import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {mirrorAsset} from './migrate.mjs';
const sync=process.argv.includes('--sync');
const requestedWidth=Number(process.argv.find(a=>a.startsWith('--width='))?.slice(8)||0);
const server=await serve(resolve(process.env.SITE_ROOT||'public'));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge'});
const results=[],issues=[],writes=[];
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL',name,e.message);}}
function assert(ok,msg){if(!ok)throw new Error(msg);}
async function waitForFrame(tab,fragment,timeout=15000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){const frame=tab.frames().find(f=>f.url().includes(fragment));if(frame)return frame;await tab.waitForTimeout(250);}
}
try{for(const width of requestedWidth?[requestedWidth]:[1440,390]){
const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
await ctx.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(!['GET','HEAD'].includes(req.method())){writes.push({url:req.url(),method:req.method()});return route.abort();}
 if(/google-analytics\.com|googletagmanager\.com|hs-analytics\.net/.test(req.url()))return route.abort();
 if(['slopestohope.com','www.slopestohope.com','communityacrossamerica.com','www.communityacrossamerica.com'].includes(u.hostname)){issues.push({legacy:req.url()});return route.abort();}
 if(sync&&u.origin===base&&/^\/wp-(content|includes)\//.test(u.pathname))try{await readFile(resolve('public','.'+u.pathname));}catch{try{await mirrorAsset(u.pathname);}catch(e){issues.push({asset:u.pathname,error:e.message});}}
 return route.continue();
});
const tab=await ctx.newPage();
tab.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)issues.push({url:r.url(),status:r.status()});});
await tab.goto(base+'/',{waitUntil:'domcontentloaded'});await tab.waitForTimeout(2500);
if(width===390)await check('Mobile menu opens, navigates to Partners, and closes',async()=>{
 await tab.locator('#menu-toggle').click();await tab.waitForTimeout(300);
 assert(await tab.locator('#menu-toggle').getAttribute('aria-expanded')==='true','Menu did not expand');
 const link=tab.locator('.buddyx-mobile-menu a').filter({hasText:/^Partners$/}).first();await link.click();await tab.waitForURL('**/partners/');await tab.waitForTimeout(1000);
 await tab.locator('#menu-toggle').click();await tab.waitForTimeout(300);await tab.locator('.menu-close').click();await tab.waitForTimeout(200);
 assert(await tab.locator('#menu-toggle').getAttribute('aria-expanded')==='false','Menu did not close');
});
await tab.goto(base+'/',{waitUntil:'domcontentloaded'});await tab.waitForTimeout(2000);
await check(`Newsletter anchor and HubSpot email-format validation (${width})`,async()=>{
 await tab.getByRole('link',{name:'Newsletter Signup',exact:true}).click();
 assert(new URL(tab.url()).hash==='#newsletter','Newsletter anchor changed');
 const f=await waitForFrame(tab,'_hsFormId=9a181260-20a9-408c-8591-cca3093d7e3f');assert(f,'Newsletter form frame missing');
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
 await tab.locator('a[data-elementor-open-lightbox="yes"]').first().click();
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
 await f.getByRole('button',{name:'Submit',exact:true}).click();await tab.waitForTimeout(500);
 assert(/required/i.test(await f.locator('body').innerText()),'Required-field validation not visible');
});
await ctx.close();
}}finally{await browser.close();server.close();}
const reportName=requestedWidth?`migration/interactions-${requestedWidth}.json`:'migration/interactions.json';
await writeFile(reportName,JSON.stringify({testedAt:new Date().toISOString(),results,issues,blockedWrites:writes,deliveryVerified:false,note:'No real submissions, donations, CRM writes, or email messages were sent. Validation behavior is not end-to-end delivery verification.'},null,2)+'\n');
if(results.some(r=>!r.passed)||issues.length)process.exitCode=1;
