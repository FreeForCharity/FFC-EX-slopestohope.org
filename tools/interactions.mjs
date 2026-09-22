import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {mirrorAsset} from './migrate.mjs';
const sync=process.argv.includes('--sync');
await mkdir('.migration-cache/screenshots',{recursive:true});
const requestedWidth=Number(process.argv.find(a=>a.startsWith('--width='))?.slice(8)||0);
const server=await serve(resolve(process.env.SITE_ROOT||'public'));
const base=`http://127.0.0.1:${server.address().port}`;
const browserChannel=process.env.BROWSER_CHANNEL;
const browser=await chromium.launch(browserChannel?{channel:browserChannel}:{});
const results=[],issues=[],writes=[],formEvidence=[];
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL',name,e.message);}}
function assert(ok,msg){if(!ok)throw new Error(msg);}
async function declineAnalytics(tab){const panel=tab.locator('#sth-cookie-consent');if(await panel.isVisible().catch(()=>false))await tab.getByRole('button',{name:'Decline analytics'}).click();}
async function waitForFrame(tab,fragment,timeout=15000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){const frame=tab.frames().find(f=>f.url().includes(fragment));if(frame)return frame;await tab.waitForTimeout(250);}
}
async function inspectForm(frame,name,width){
 const controls=frame.locator('input:not([type="hidden"]),textarea,select');
 const visibleControls=[];
 for(let i=0;i<await controls.count();i++){const control=controls.nth(i);if(await control.isVisible())visibleControls.push(await control.evaluate(element=>({tag:element.tagName.toLowerCase(),type:element.getAttribute('type')||'',name:element.getAttribute('name')||'',required:element.required,ariaLabel:element.getAttribute('aria-label')||'',label:element.labels?.[0]?.textContent?.replace(/\s+/g,' ').trim()||''})));}
 const submit=frame.locator('button[type="submit"],input[type="submit"]').first();
 assert(visibleControls.length>0,`${name} has no visible controls`);
 assert(await submit.isVisible(),`${name} submit button missing`);
 assert(visibleControls.every(control=>control.label||control.ariaLabel),`${name} has an unlabeled visible field`);
 await controls.first().focus();assert(await controls.first().evaluate(element=>element===document.activeElement),`${name} first field cannot receive keyboard focus`);
 formEvidence.push({name,width,fields:visibleControls,submitLabel:(await submit.getAttribute('value'))||(await submit.innerText()).trim()});
 return visibleControls;
}
try{for(const width of requestedWidth?[requestedWidth]:[1440,390]){
const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
await ctx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.origin===base&&u.pathname==='/cdn-cgi/trace')return route.fulfill({status:200,contentType:'text/plain',body:'fl=test\nloc=US\n'});
 if(!['GET','HEAD'].includes(req.method())){writes.push({url:req.url(),method:req.method()});return route.abort();}
 if(/google-analytics\.com|googletagmanager\.com|hs-analytics\.net/.test(req.url()))return route.abort();
 if(['slopestohope.com','www.slopestohope.com','communityacrossamerica.com','www.communityacrossamerica.com'].includes(u.hostname)){issues.push({legacy:req.url()});return route.abort();}
 if(sync&&u.origin===base&&/^\/wp-(content|includes)\//.test(u.pathname))try{await readFile(resolve('public','.'+u.pathname));}catch{try{await mirrorAsset(u.pathname);}catch(e){issues.push({asset:u.pathname,error:e.message});}}
 return route.continue();
});
const tab=await ctx.newPage();
tab.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)issues.push({url:r.url(),status:r.status()});});
await tab.goto(base+'/',{waitUntil:'domcontentloaded'});await tab.waitForTimeout(2500);await declineAnalytics(tab);
await check(`Hero respects reduced motion (${width})`,async()=>{const active=await tab.locator('.sth-hero__slide.is-active').evaluateAll(nodes=>nodes.map(node=>Array.from(node.parentElement.children).indexOf(node)));await tab.waitForTimeout(3200);const after=await tab.locator('.sth-hero__slide.is-active').evaluateAll(nodes=>nodes.map(node=>Array.from(node.parentElement.children).indexOf(node)));assert(JSON.stringify(after)===JSON.stringify(active),'Hero auto-advanced despite reduced-motion preference');});
const motionCtx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
await motionCtx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.origin===base&&u.pathname==='/cdn-cgi/trace')return route.fulfill({status:200,contentType:'text/plain',body:'fl=test\nloc=US\n'});
 if(!['GET','HEAD'].includes(req.method())){writes.push({url:req.url(),method:req.method()});return route.abort();}
 if(/google-analytics\.com|googletagmanager\.com|hs-analytics\.net/.test(req.url()))return route.abort();
 if(['slopestohope.com','www.slopestohope.com','communityacrossamerica.com','www.communityacrossamerica.com'].includes(u.hostname)){issues.push({legacy:req.url()});return route.abort();}
 return route.continue();
});
const motionTab=await motionCtx.newPage();
await motionTab.goto(base+'/',{waitUntil:'domcontentloaded'});await motionTab.waitForTimeout(1200);
await check(`Hero advances and pauses on hover (${width})`,async()=>{
 const activeIndex=async()=>motionTab.locator('.sth-hero__slide').evaluateAll(nodes=>nodes.findIndex(node=>node.classList.contains('is-active')));
 const start=await activeIndex();await motionTab.waitForTimeout(3200);const advanced=await activeIndex();assert(advanced!==start,'Hero did not auto-advance with normal motion');
 await motionTab.locator('.sth-hero').hover();const hovered=await activeIndex();await motionTab.waitForTimeout(3200);assert(await activeIndex()===hovered,'Hero advanced while hovered');
 await motionTab.mouse.move(0,0);await motionTab.waitForTimeout(3200);assert(await activeIndex()!==hovered,'Hero did not resume after hover ended');
});
await motionTab.goto(base+'/',{waitUntil:'domcontentloaded'});await motionTab.waitForTimeout(1200);
await check(`Hero is non-interactive and cannot navigate to Gallery (${width})`,async()=>{
 assert(await motionTab.locator('.sth-hero a[href="/gallery/"]').count()===0,'Hero still contains a Gallery link');
 assert(await motionTab.locator('.eael-wrapper-link-5a53669d').count()===0,'Legacy Elementor hero wrapper link remains');
 assert(await motionTab.locator('.sth-hero__media').count()===1,'Hero media wrapper missing');
});
await motionCtx.close();
if(width===390)await check('Mobile menu opens, navigates to Partners, and closes',async()=>{
 await tab.locator('#menu-toggle').focus();await tab.keyboard.press('Enter');await tab.waitForTimeout(300);
 assert(await tab.locator('#menu-toggle').getAttribute('aria-expanded')==='true','Menu did not expand');
 assert(await tab.locator('#menu-toggle').getAttribute('aria-controls')==='primary-menu-mobile','Menu button controls the wrong menu');
 assert(await tab.locator('#primary-menu-mobile').isVisible(),'Controlled mobile menu is not visible');
 const link=tab.locator('.buddyx-mobile-menu a').filter({hasText:/^Partners$/}).first();await link.click();await tab.waitForURL('**/partners/');await tab.waitForTimeout(1000);
 await tab.locator('#menu-toggle').click();await tab.waitForTimeout(300);await tab.locator('.menu-close').click();await tab.waitForTimeout(200);
 assert(await tab.locator('#menu-toggle').getAttribute('aria-expanded')==='false','Menu did not close');
});
await tab.goto(base+'/',{waitUntil:'domcontentloaded'});await tab.waitForTimeout(2000);await declineAnalytics(tab);
await check(`Newsletter anchor and HubSpot email-format validation (${width})`,async()=>{
 await tab.getByRole('link',{name:'Newsletter Signup',exact:true}).click();
 assert(new URL(tab.url()).hash==='#newsletter','Newsletter anchor changed');
 const f=await waitForFrame(tab,'_hsFormId=9a181260-20a9-408c-8591-cca3093d7e3f');assert(f,'Newsletter form frame missing');
 const fields=await inspectForm(f,'Homepage Newsletter',width);assert(fields.some(field=>field.type==='email'),'Newsletter email field missing');
 await f.locator('input[type="email"]').fill('invalid-email');await f.getByRole('button',{name:'Submit',exact:true}).click();await tab.waitForTimeout(600);
 const txt=await f.locator('body').innerText();const invalid=await f.locator('input[type="email"]').evaluate(e=>!e.validity.valid||e.getAttribute('aria-invalid')==='true');assert(invalid||/valid email/i.test(txt),'Invalid email validation not visible');
});
await check(`Donation and pledge destinations unchanged (${width})`,async()=>{
 const hrefs=await tab.locator('a[href]').evaluateAll(links=>links.map(a=>a.href));
 assert(hrefs.includes('https://givebutter.com/slopes-to-hope'),'Givebutter missing');
 const source=JSON.parse(await readFile('migration/inventory.json')).routes.find(r=>r.path==='/');
 for(const l of source.links.filter(l=>/givebutter\.com|rallyup\.com/.test(l.url)))assert(hrefs.includes(l.url),'Donation URL changed: '+l.url);
});
await tab.goto(base+'/gallery/',{waitUntil:'domcontentloaded'});await tab.waitForTimeout(2500);
await check(`Gallery opens, advances, and closes with Escape (${width})`,async()=>{
 const photo=tab.locator('a[data-elementor-open-lightbox="yes"]').first();
 assert((await photo.getAttribute('aria-label'))?.startsWith('Open photo: '),'Gallery link is unnamed');
 assert((await photo.locator('img').getAttribute('alt'))?.trim(),'Gallery image description is empty');
 await photo.focus();await tab.keyboard.press('Enter');
 const dialog=tab.locator('.elementor-lightbox');await dialog.waitFor({state:'visible',timeout:10000});await tab.waitForTimeout(1500);
 const img=dialog.locator('.swiper-slide-active img').first();await img.waitFor({state:'visible'});
 const first=await img.getAttribute('src');assert(await img.evaluate(i=>i.complete&&i.naturalWidth>0),'Lightbox image not loaded');
 await tab.keyboard.press('ArrowRight');await tab.waitForTimeout(700);
 assert(await dialog.locator('.swiper-slide-active img').first().getAttribute('src')!==first,'Gallery did not advance');
 await tab.screenshot({path:`.migration-cache/screenshots/lightbox-${width}.png`});
 await tab.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
});
await tab.goto(base+'/contact-us/',{waitUntil:'domcontentloaded'});await tab.waitForTimeout(2500);
await check(`Contact form fields and required-field validation (${width})`,async()=>{
 const f=await waitForFrame(tab,'_hsFormId=f35f941a-7978-41cc-aabc-4dc669ac9a0a');assert(f,'Contact form frame missing');
 assert(await f.locator('input,textarea,select').count()>=10,'Contact fields missing');
 await inspectForm(f,'Contact Us',width);
 await f.getByRole('button',{name:'Submit',exact:true}).click();await tab.waitForTimeout(500);
 assert(/required/i.test(await f.locator('body').innerText()),'Required-field validation not visible');
});
await check(`COO Summit route, form fields, and keyboard access (${width})`,async()=>{
 for(const target of ['/coosummit26','/coosummit26/','/coosummit26?utm_source=coosummit26&utm_medium=qr']){const response=await tab.goto(base+target,{waitUntil:'domcontentloaded'});assert(response?.ok(),`COO Summit route failed: ${target}`);assert((await tab.locator('h1').innerText()).trim()==='COO Summit 2026: Complimentary Concierge Pickup',`COO Summit content missing: ${target}`);}
 await tab.waitForTimeout(2500);
 assert(new URL(tab.url()).searchParams.get('utm_source')==='coosummit26'&&new URL(tab.url()).searchParams.get('utm_medium')==='qr','COO Summit QR parameters changed');
 const f=await waitForFrame(tab,'_hsFormId=05a4b6fe-6b23-433e-bf08-e667071c8d3b');assert(f,'COO Summit form frame missing');
 const fields=await inspectForm(f,'COO Summit Promo',width);assert(fields.some(field=>field.required),'COO Summit required fields missing');
 assert(await f.locator('form').evaluate(form=>!form.checkValidity()),'COO Summit empty-form validation is not active');
});
await ctx.close();
}}finally{await browser.close();server.close();}
const reportName=requestedWidth?`migration/interactions-${requestedWidth}.json`:'migration/interactions.json';
await writeFile(reportName,JSON.stringify({testedAt:new Date().toISOString(),results,issues,formEvidence,blockedWrites:writes,deliveryVerified:false,note:'No real submissions, donations, CRM writes, or email messages were sent. Validation behavior is not end-to-end delivery verification.'},null,2)+'\n');
if(results.some(r=>!r.passed)||issues.length)process.exitCode=1;
