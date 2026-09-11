import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';

const server=await serve(resolve(process.env.SITE_ROOT||'out'));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const results=[];
function assert(value,message){if(!value)throw new Error(message);}
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(error){results.push({name,passed:false,error:error.message});console.log('FAIL',name,error.message);}}

try{
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const analyticsRequests=[];
    await context.route(/(?:googletagmanager\.com|google-analytics\.com|js-na2\.hs-scripts\.com\/244348981\.js)/,route=>{analyticsRequests.push(route.request().url());return route.abort();});
    const page=await context.newPage();
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await check(`First visit shows consent (${width})`,async()=>{assert(await page.locator('#sth-cookie-consent').isVisible(),'Consent interface is not visible');assert(analyticsRequests.length===0,'Analytics requested before consent');});
    await page.getByRole('button',{name:'Decline analytics'}).click();
    await check(`Decline persists without analytics (${width})`,async()=>{assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='denied','Decline was not stored');await page.reload({waitUntil:'domcontentloaded'});assert(!(await page.locator('#sth-cookie-consent').isVisible()),'Consent reappeared after decline');assert(analyticsRequests.length===0,'Analytics requested after decline');});
    await check(`Policy links and settings work (${width})`,async()=>{await page.locator('footer a[href="/privacy-policy/"]').click();await page.waitForURL('**/privacy-policy/');assert((await page.locator('main h1').innerText())==='Privacy Policy','Privacy route did not load');await page.locator('footer [data-open-cookie-settings]').click();assert(await page.locator('#sth-cookie-consent').isVisible(),'Settings did not reopen consent');});
    await page.getByRole('button',{name:'Accept analytics'}).click();
    await check(`Accept enables intended analytics (${width})`,async()=>{assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='granted','Acceptance was not stored');assert(await page.locator('html').getAttribute('data-analytics-measurement-id')==='G-XEWDW3TYVZ','Measurement ID was not activated');assert(analyticsRequests.some(url=>url.includes('gtag/js?id=GT-MKTP8299')),'Google tag was not requested');assert(analyticsRequests.some(url=>url.includes('/244348981.js')),'Consented HubSpot tracking was not requested');});
    await check(`Acceptance persists and layout fits (${width})`,async()=>{const count=analyticsRequests.length;await page.goto(base+'/terms-of-service/',{waitUntil:'domcontentloaded'});assert((await page.locator('main h1').innerText())==='Terms of Service','Terms route did not load');assert(!(await page.locator('#sth-cookie-consent').isVisible()),'Consent reappeared after acceptance');assert(analyticsRequests.length>count,'Analytics preference did not apply after navigation');assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Consent or policy page causes horizontal overflow');});
    await context.close();
  }
}finally{await browser.close();server.close();}

await writeFile('migration/consent-validation.json',JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
if(results.some(result=>!result.passed))process.exitCode=1;
