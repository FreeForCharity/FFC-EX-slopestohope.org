import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
const server=await serve(resolve(process.env.SITE_ROOT||'out'));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const results=[];
function assert(value,message){if(!value)throw new Error(message);}
try{
  for(const width of [1440,390])for(const saved of [null,'denied','granted']){
    const context=await browser.newContext({viewport:{width,height:900}});
    const analyticsRequests=[];
    await context.route('**/*',route=>{
      const request=route.request();
      if(/googletagmanager\.com|google-analytics\.com|js-na2\.hs-scripts\.com\/244348981\.js/.test(request.url())){analyticsRequests.push(request.url());return route.abort();}
      if(!['GET','HEAD'].includes(request.method()))return route.abort();
      return route.continue();
    });
    if(saved)await context.addInitScript(value=>localStorage.setItem('slopesToHopeAnalyticsConsent',value),saved);
    const page=await context.newPage();
    const name=`No popup or optional analytics; policy navigation (${width}, saved=${saved})`;
    try{
      await page.goto(base+'/',{waitUntil:'domcontentloaded'});
      for(const path of ['/', '/privacy-policy/', '/terms-of-service/']){
        if(path!=='/'){await page.locator(`footer a[href="${path}"]`).click();await page.waitForURL(base+path);}
        await page.waitForTimeout(500);
        assert(await page.locator('#sth-cookie-consent,[data-open-cookie-settings],[data-consent]').count()===0,'Popup controls remain');
        assert(analyticsRequests.length===0,'Optional analytics was requested');
        assert(await page.locator('#sth-google-tag,#sth-hubspot-tracking').count()===0,'Tracking loader remains');
        assert(await page.evaluate(()=>Array.from(window.dataLayer||[]).some(e=>e[0]==='consent'&&e[1]==='default'&&e[2].analytics_storage==='denied')),'Default denial missing');
        if(path!=='/')assert(await page.locator('main h1').innerText()===(path==='/privacy-policy/'?'Privacy Policy':'Terms of Service'),'Policy page missing');
        assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Horizontal overflow');
      }
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(500);
      assert(analyticsRequests.length===0,'Analytics requested after reload');
      results.push({name,passed:true});console.log('PASS',name);
    }catch(error){results.push({name,passed:false,error:error.message});console.log('FAIL',name,error.message);}
    await context.close();
  }
}finally{await browser.close();server.close();}
await writeFile('migration/consent-validation.json',JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
if(results.some(result=>!result.passed))process.exitCode=1;
