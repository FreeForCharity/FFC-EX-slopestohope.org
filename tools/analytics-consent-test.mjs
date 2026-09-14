import {JSDOM} from 'jsdom';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {POLICY_ROUTES} from './release-policy.mjs';
import {EXCLUDED_ROUTES} from './legacy-policy.mjs';

const RESTRICTED_REGIONS=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
const source=await readFile('public/assets/consent.js','utf8');
const inventory=JSON.parse(await readFile('migration/inventory.json','utf8'));
const routes=[...inventory.routes.filter(route=>!EXCLUDED_ROUTES.has(route.path)).map(route=>route.path),...POLICY_ROUTES.map(route=>route.path)];
const results=[];
function assert(value,message){if(!value)throw new Error(message);}
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(error){results.push({name,passed:false,error:error.message});console.log('FAIL',name,error.message);}}
function runAt(hostname){
  const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:`https://${hostname}/`,runScripts:'outside-only'});
  const {window}=dom,appended=[];
  const append=window.document.head.appendChild.bind(window.document.head);
  window.document.head.appendChild=node=>{appended.push({id:node.id,src:node.src});return append(node);};
  window.eval(source);
  return {window,appended};
}

await check('Production host queues consent defaults before one Google tag configuration',async()=>{
  const {window,appended}=runAt('slopestohope.org');
  const commands=Array.from(window.dataLayer,entry=>Array.from(entry));
  assert(appended.length===1&&appended[0].id==='sth-google-tag'&&appended[0].src.includes('gtag/js?id=GT-MKTP8299'),'Expected one Google tag loader');
  assert(commands[0][0]==='consent'&&commands[0][1]==='default'&&commands[1][0]==='consent'&&commands[1][1]==='default','Consent defaults did not precede configuration');
  assert(commands.slice(0,2).every(command=>command[2].ad_storage==='denied'&&command[2].ad_user_data==='denied'&&command[2].ad_personalization==='denied'),'Advertising consent was not denied');
  assert(commands[0][2].analytics_storage==='denied'&&JSON.stringify(commands[0][2].region)===JSON.stringify(RESTRICTED_REGIONS),'Restricted default is incorrect');
  assert(commands[1][2].analytics_storage==='granted'&&!commands[1][2].region,'Non-restricted default is incorrect');
  assert(commands.some(command=>command[0]==='set'&&command[1]==='linker'&&command[2].domains.includes('slopestohope.com')),'Cross-domain linker missing');
  assert(commands.filter(command=>command[0]==='config'&&command[1]==='GT-MKTP8299').length===1,'Google tag config was duplicated');
  window.eval(source);
  assert(window.dataLayer.length===commands.length&&appended.length===1,'Reevaluation duplicated analytics initialization');
});

await check('Development and preview hosts never initialize Google Analytics',async()=>{
  for(const host of ['localhost','127.0.0.1','preview.example.github.io','example.test']){
    const {window,appended}=runAt(host);
    assert(!window.dataLayer&&appended.length===0&&!window.document.querySelector('#sth-google-tag'),`Analytics initialized on ${host}`);
  }
});

await check('All intended static routes contain one runtime and no legacy tracker',async()=>{
  for(const path of routes){
    const document=new JSDOM(await readFile(resolve('public','.'+path,'index.html'),'utf8')).window.document;
    assert(document.querySelectorAll('script[src="/assets/consent.js"]').length===1,`Runtime missing or duplicated on ${path}`);
    assert(!document.querySelector('#google_gtagjs-js,#google_gtagjs-js-after,#leadin-script-loader-js-js,#sth-hubspot-tracking'),`Legacy or HubSpot tracking loader remains on ${path}`);
  }
});

const server=await serve(resolve(process.env.SITE_ROOT||'out'));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
try{
  await check('Intercepted production host initializes one Google tag without transmitting data',async()=>{
    const context=await browser.newContext();
    const index=await readFile('out/index.html');
    const runtime=await readFile('out/assets/consent.js');
    const googleRequests=[];
    await context.route('https://slopestohope.org/**',route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/'||path==='/index.html')return route.fulfill({contentType:'text/html',body:index});
      if(path==='/assets/consent.js')return route.fulfill({contentType:'text/javascript',body:runtime});
      return route.fulfill({status:204,body:''});
    });
    await context.route(/googletagmanager\.com|google-analytics\.com/,route=>{googleRequests.push(route.request().url());return route.abort();});
    const page=await context.newPage();
    await page.goto('https://slopestohope.org/',{waitUntil:'domcontentloaded'});await page.waitForTimeout(100);
    assert(await page.locator('#sth-google-tag').count()===1,'Production host did not add one Google tag');
    assert(googleRequests.length===1&&googleRequests[0].includes('GT-MKTP8299'),'Unexpected Google tag request');
    assert(await page.evaluate(()=>window.dataLayer.filter(command=>command[0]==='config'&&command[1]==='GT-MKTP8299').length===1),'Production configuration was duplicated');
    await context.close();
  });
  await check('Localhost requests no Google Analytics and has no consent popup',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900}}),requests=[];
    await context.route('**/*',route=>{const request=route.request();if(/googletagmanager\.com|google-analytics\.com/.test(request.url()))requests.push(request.url());if(!['GET','HEAD'].includes(request.method()))return route.abort();return route.continue();});
    const page=await context.newPage();
    for(const path of ['/','/privacy-policy/','/terms-of-service/']){
      await page.goto(base+path,{waitUntil:'domcontentloaded'});
      assert(await page.locator('#sth-cookie-consent,[data-open-cookie-settings],[data-consent]').count()===0,`Obsolete popup control remains on ${path}`);
      assert(await page.locator('#sth-google-tag,#sth-hubspot-tracking').count()===0,`Tracker loaded locally on ${path}`);
    }
    assert(requests.length===0,'Localhost requested Google Analytics');
    await context.close();
  });
  await check('Privacy Policy is aligned and Terms has no obsolete consent reference',async()=>{
    const page=await browser.newPage();
    await page.goto(base+'/privacy-policy/',{waitUntil:'domcontentloaded'});
    const policy=await page.locator('main').innerText();
    for(const expected of ['production .org website','Google Consent Mode','limited cookieless measurement signals','Standalone HubSpot visitor tracking is not currently enabled'])assert(policy.includes(expected),`Privacy wording missing: ${expected}`);
    for(const obsolete of ['accept analytics','Cookie settings','local storage'])assert(!policy.toLowerCase().includes(obsolete.toLowerCase()),`Obsolete privacy wording remains: ${obsolete}`);
    await page.goto(base+'/terms-of-service/',{waitUntil:'domcontentloaded'});
    assert(!/accept analytics|decline analytics|cookie settings|analytics and privacy/i.test(await page.locator('main').innerText()),'Terms contains obsolete analytics controls');
    await page.close();
  });
}finally{await browser.close();server.close();}

await writeFile('migration/consent-validation.json',JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
if(results.some(result=>!result.passed))process.exitCode=1;
