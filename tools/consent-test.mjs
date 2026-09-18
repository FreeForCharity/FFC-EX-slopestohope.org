import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';

const server=await serve(resolve(process.env.SITE_ROOT||'out'));
const base=`http://127.0.0.1:${server.address().port}`;
const browserChannel=process.env.BROWSER_CHANNEL;
const browser=await chromium.launch({...((browserChannel)?{channel:browserChannel}:{}),headless:true});
const results=[],blockedWrites=[];
function assert(value,message){if(!value)throw new Error(message);}
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS',name);}catch(error){results.push({name,passed:false,error:error.message});console.log('FAIL',name,error.message);}}
async function hubSpotState(page){return page.evaluate(()=>({tracking:Array.from(window._hsq||[],entry=>Array.from(entry)),privacy:Array.from(window._hsp||[],entry=>Array.from(entry))}));}
function hasHubSpotConsent(entries,value){return entries.some(entry=>entry[0]==='setHubSpotConsent'&&entry[1]?.analytics===value&&entry[1]?.advertisement===false&&entry[1]?.functionality===true);}
function hasDoNotTrack(entries,enabled){return entries.some(entry=>entry[0]==='doNotTrack'&&(enabled?entry[1]?.track===true:!entry[1]));}

try{
  const consentSource=await readFile('public/assets/consent.js','utf8');
  await check('Required analytics IDs and independent HubSpot form embeds remain intact',async()=>{
    assert(consentSource.includes("TAG_ID='GT-MKTP8299'"),'Google tag ID changed or missing');
    assert(consentSource.includes("MEASUREMENT_ID='G-XEWDW3TYVZ'"),'Google measurement ID changed or missing');
    assert(consentSource.includes('window.disableHubSpotCookieBanner=true'),'External consent management flag missing');
    for(const [path,id] of [['public/index.html','9a181260-20a9-408c-8591-cca3093d7e3f'],['public/contact-us/index.html','f35f941a-7978-41cc-aabc-4dc669ac9a0a']]){
      const html=await readFile(path,'utf8');
      assert(html.includes(`data-form-id="${id}"`),`HubSpot form ${id} missing from ${path}`);
      assert(/hsforms\.net\/forms\/embed/.test(html),`Independent HubSpot forms loader missing from ${path}`);
    }
  });
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const analyticsRequests=[];
    await context.route('**/*',route=>{const request=route.request();if(!['GET','HEAD'].includes(request.method())){blockedWrites.push({url:request.url(),method:request.method()});return route.abort();}if(/(?:googletagmanager\.com|google-analytics\.com|js-na2\.hs-scripts\.com\/244348981\.js|hs-analytics\.net|track\.hubspot|hubspot\.com\/.*track|hubspot\.com\/__ptq)/.test(request.url())){analyticsRequests.push(request.url());return route.abort();}return route.continue();});
    const page=await context.newPage();
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    await check(`First visit enables analytics without a modal (${width})`,async()=>{assert(!(await page.locator('#sth-cookie-consent').isVisible()),'Consent interface covered the page');assert(await page.locator('html').getAttribute('data-analytics-measurement-id')==='G-XEWDW3TYVZ','Measurement ID was not activated by default');assert(analyticsRequests.some(url=>url.includes('gtag/js?id=GT-MKTP8299')),'Google tag was not requested by default');assert(analyticsRequests.some(url=>url.includes('/244348981.js')),'HubSpot tracking was not requested by default');const state=await hubSpotState(page);assert(hasDoNotTrack(state.tracking,true),'HubSpot tracking was not enabled by default');assert(hasHubSpotConsent(state.privacy,true),'HubSpot analytics was not enabled by default');});
    await page.locator('footer [data-open-cookie-settings]').click();
    await page.getByRole('button',{name:'Decline analytics'}).click();
    await check(`Decline persists without analytics (${width})`,async()=>{assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='denied','Decline was not stored');let state=await hubSpotState(page);assert(hasHubSpotConsent(state.privacy,false),'HubSpot analytics consent was not denied');assert(state.privacy.some(entry=>entry[0]==='revokeCookieConsent'),'HubSpot cookie consent was not revoked');assert(hasDoNotTrack(state.tracking,false),'HubSpot do-not-track was not enabled');const count=analyticsRequests.length;await page.reload({waitUntil:'domcontentloaded'});assert(!(await page.locator('#sth-cookie-consent').isVisible()),'Consent reappeared after decline');assert(analyticsRequests.length===count,'Analytics requested after decline');state=await hubSpotState(page);assert(hasDoNotTrack(state.tracking,false)&&hasHubSpotConsent(state.privacy,false),'Persisted HubSpot decline was not reapplied');});
    await check(`Policy links and settings work (${width})`,async()=>{await page.locator('footer a[href="/privacy-policy/"]').click();await page.waitForURL('**/privacy-policy/');assert((await page.locator('main h1').innerText())==='Privacy Policy','Privacy route did not load');await page.locator('footer [data-open-cookie-settings]').click();assert(await page.locator('#sth-cookie-consent').isVisible(),'Settings did not reopen consent');});
    await page.getByRole('button',{name:'Accept analytics'}).click();
    await check(`Accept enables intended analytics (${width})`,async()=>{assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='granted','Acceptance was not stored');assert(await page.locator('html').getAttribute('data-analytics-measurement-id')==='G-XEWDW3TYVZ','Measurement ID was not activated');assert(analyticsRequests.some(url=>url.includes('gtag/js?id=GT-MKTP8299')),'Google tag was not requested');assert(analyticsRequests.some(url=>url.includes('/244348981.js')),'Consented HubSpot tracking was not requested');const state=await hubSpotState(page);assert(hasDoNotTrack(state.tracking,true),'HubSpot tracking was not explicitly enabled');assert(hasHubSpotConsent(state.privacy,true),'HubSpot analytics consent was not granted');});
    await check(`Acceptance persists and layout fits (${width})`,async()=>{const count=analyticsRequests.length;await page.goto(base+'/terms-of-service/',{waitUntil:'domcontentloaded'});assert((await page.locator('main h1').innerText())==='Terms of Service','Terms route did not load');assert(!(await page.locator('#sth-cookie-consent').isVisible()),'Consent reappeared after acceptance');assert(analyticsRequests.length>count,'Analytics preference did not apply after navigation');assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Consent or policy page causes horizontal overflow');});
    await check(`Revoking consent disables Google and HubSpot tracking (${width})`,async()=>{await page.locator('footer [data-open-cookie-settings]').click();await page.getByRole('button',{name:'Decline analytics'}).click();assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='denied','Revocation was not stored');assert(await page.locator('html').getAttribute('data-analytics-measurement-id')===null,'Measurement ID remained active after revocation');assert(await page.evaluate(()=>Array.from(window.dataLayer).some(entry=>entry[0]==='consent'&&entry[1]==='update'&&entry[2]?.analytics_storage==='denied')),'Denied consent update was not recorded');const state=await hubSpotState(page);assert(hasHubSpotConsent(state.privacy,false),'HubSpot analytics consent was not denied');assert(state.privacy.some(entry=>entry[0]==='revokeCookieConsent'),'HubSpot cookie consent was not revoked');assert(hasDoNotTrack(state.tracking,false),'HubSpot do-not-track was not enabled');const count=analyticsRequests.length;await page.reload({waitUntil:'domcontentloaded'});assert(analyticsRequests.length===count,'Analytics was requested after revoked choice reloaded');assert(await page.locator('#sth-google-tag,#sth-hubspot-tracking').count()===0,'Tracking loader survived the revoked reload');});
    await check(`Revoked visitor can accept and persist a new choice (${width})`,async()=>{const count=analyticsRequests.length;await page.locator('footer [data-open-cookie-settings]').click();await page.getByRole('button',{name:'Accept analytics'}).click();await page.waitForTimeout(100);assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='granted','Changed acceptance was not stored');assert(analyticsRequests.length>count&&analyticsRequests.some(url=>url.includes('gtag/js?id=GT-MKTP8299'))&&analyticsRequests.some(url=>url.includes('/244348981.js')),'Tracking was not enabled after changed acceptance');let state=await hubSpotState(page);assert(hasDoNotTrack(state.tracking,true)&&hasHubSpotConsent(state.privacy,true),'HubSpot was not enabled after changed acceptance');const acceptedCount=analyticsRequests.length;await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(100);assert(await page.evaluate(()=>localStorage.getItem('slopesToHopeAnalyticsConsent'))==='granted','Changed acceptance did not persist');assert(!(await page.locator('#sth-cookie-consent').isVisible()),'Consent reappeared after accepted reload');assert(analyticsRequests.length>acceptedCount,'Accepted tracking did not persist after reload');state=await hubSpotState(page);assert(hasDoNotTrack(state.tracking,true)&&hasHubSpotConsent(state.privacy,true),'Persisted HubSpot acceptance was not applied');});
    await context.close();
  }
}finally{await browser.close();server.close();}

await writeFile('migration/consent-validation.json',JSON.stringify({testedAt:new Date().toISOString(),results,blockedWrites,note:'All non-GET/HEAD requests were blocked. No forms were submitted, and no CRM or email write was attempted.'},null,2)+'\n');
if(results.some(result=>!result.passed))process.exitCode=1;
