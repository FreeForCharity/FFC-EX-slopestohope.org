import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { serve } from './serve.mjs';
import { mirrorAsset } from './migrate.mjs';
import {EXCLUDED_ROUTES} from './legacy-policy.mjs';
import {POLICY_ROUTES} from './release-policy.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const sync=process.argv.includes('--sync');
const live=process.argv.includes('--live');
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8)||'';
const inv=JSON.parse(await readFile('migration/inventory.json'));
const routes=[...inv.routes.filter(r=>!EXCLUDED_ROUTES.has(r.path)),...POLICY_ROUTES].filter(r=>!only||only.includes(r.path));
const server=live?null:await serve(resolve(process.env.SITE_ROOT||'public'));
const base=live?'https://slopestohope.com':`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const results=[], mirrored=new Map();
await mkdir('.migration-cache/screenshots',{recursive:true});
try{
for(const width of [1440,390])for(const r of routes){
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const tab=await ctx.newPage();
  const record={path:r.path,width,missing:[],legacy:[],externalFailures:[],errors:[],blockedWrites:[]};
  await ctx.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(!['GET','HEAD'].includes(req.method())){record.blockedWrites.push({url:req.url(),method:req.method()});return route.abort();}
    // Do not generate analytics events or submit forms during automated QA.
    if(/google-analytics\.com|googletagmanager\.com|hs-analytics\.net|track\.hubspot|hubspot\.com\/.*track|hubspot\.com\/__ptq/.test(req.url()))return route.abort();
    if(!live&&['slopestohope.com','www.slopestohope.com','communityacrossamerica.com','www.communityacrossamerica.com'].includes(u.hostname)){record.legacy.push(req.url());return route.abort();}
    if(sync&&u.origin===base&&/^\/wp-(content|includes)\//.test(u.pathname)){
      try{await readFile(resolve('public','.'+decodeURIComponent(u.pathname)));}
      catch{if(!mirrored.has(u.pathname))mirrored.set(u.pathname,mirrorAsset(u.pathname).catch(e=>({path:u.pathname,error:e.message})));await mirrored.get(u.pathname);}
    }
    return route.continue();
  });
  tab.on('response',resp=>{if(resp.status()>=400){const value={url:resp.url(),status:resp.status()};(resp.url().startsWith(base)?record.missing:record.externalFailures).push(value);}});
  tab.on('pageerror',e=>record.errors.push(e.stack||e.message));
  tab.on('requestfailed',req=>{if(req.url().startsWith(base))record.missing.push({url:req.url(),error:req.failure()?.errorText});});
  try{
    await tab.goto(base+r.path,{waitUntil:'domcontentloaded',timeout:45000});
    await tab.mouse.move(100,200); // trigger the source site's delayed runtime
    await tab.waitForTimeout(2500);
    for(let y=0;y<await tab.evaluate(()=>document.body.scrollHeight);y+=800){await tab.evaluate(y=>window.scrollTo(0,y),y);await tab.waitForTimeout(120);}
    await tab.waitForTimeout(1500);await tab.evaluate(()=>window.scrollTo(0,0));await tab.waitForTimeout(500);
    record.dom=await tab.evaluate(()=>({title:document.title,text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].filter(i=>(!i.complete||!i.naturalWidth)&&i.getClientRects().length&&getComputedStyle(i).visibility!=='hidden').map(i=>i.currentSrc||i.src),frames:[...document.querySelectorAll('iframe')].map(i=>({src:i.src,title:i.title})),counter:[...document.querySelectorAll('.elementor-counter-number')].map(e=>({text:e.textContent,target:e.dataset.toValue})),progress:[...document.querySelectorAll('.eael-progressbar,.elementskit-progressbar')].map(e=>({text:e.innerText,count:e.dataset.count})),menu:[...document.querySelectorAll('button')].map(e=>({text:e.innerText,label:e.getAttribute('aria-label'),class:e.className})),widgets:[...document.querySelectorAll('[data-widget_type]')].map(e=>e.dataset.widget_type)}));
    record.formFrames=[];for(const frame of tab.frames())if(frame.url().includes('hsforms.net/ui-forms'))try{record.formFrames.push({url:frame.url().split('&_hsInstanceId=')[0],text:(await frame.locator('body').innerText({timeout:1500})).slice(0,2000),fields:await frame.locator('input,textarea,select').count()});}catch{}
    // Reference-only browser normalization: the source loader can remain over
    // content when its PHP guest probe/telemetry is blocked. No source is edited.
    if(live)await tab.locator('.site-loader').evaluateAll(es=>es.forEach(e=>e.style.display='none'));
    const name=(r.path.replace(/\//g,'_')||'home')+'-'+width;
    await tab.screenshot({path:`.migration-cache/screenshots/${live?'live':'local'}${name}.png`,fullPage:true,animations:'disabled'});
  }catch(e){record.errors.push(e.message);}
  console.log(JSON.stringify({path:r.path,width,missing:record.missing,legacy:record.legacy,errors:record.errors,overflow:record.dom?.overflow,brokenImages:record.dom?.images}));
  results.push(record);await ctx.close();
}
}finally{await browser.close();server?.close();}
await writeFile(`migration/${live?'live':'local'}${label}-browser-audit.json`,JSON.stringify({testedAt:new Date().toISOString(),base,results,mirrored:await Promise.all(mirrored.values())},null,2)+'\n');
if(results.some(r=>r.missing.length||r.legacy.length||r.errors.length||r.dom?.images.length||r.dom?.overflow))process.exitCode=1;
