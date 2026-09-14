import {chromium} from 'playwright';
import {serve} from './serve.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const server=await serve(resolve('out'));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const results=[];
await mkdir('.migration-cache/screenshots',{recursive:true});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  // The static hero must function with all WordPress/Elementor runtime scripts blocked.
  await context.route('**/*',route=>{
   const r=route.request();
   if(!['GET','HEAD'].includes(r.method())||!r.url().startsWith(base)||(r.resourceType()==='script'&&/\/wp-(content|includes)\//.test(r.url())))return route.abort();
   return route.continue();
  });
  const page=await context.newPage();
  await page.goto(base+'/',{waitUntil:'load'});
  const hero=page.locator('.sth-hero');const slides=hero.locator('img');
  assert.equal(await slides.count(),4);
  assert.equal(await slides.first().evaluate(e=>getComputedStyle(e.parentElement).opacity),'1');
  assert(await slides.evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
  const bounds=await hero.boundingBox();assert(bounds.width>0&&bounds.height>0);
  assert.equal(await slides.first().evaluate(e=>getComputedStyle(e.parentElement).transitionDuration),'0.5s');
  await hero.screenshot({path:`.migration-cache/screenshots/hero-first-${width}.png`});
  for(let step=1;step<=4;step++){
   await page.waitForFunction(index=>document.querySelectorAll('.sth-hero__slide')[index].classList.contains('is-active'),step%4);
   await page.waitForTimeout(200);
   assert.equal(await hero.locator('.is-active img').getAttribute('src'),await slides.nth(step%4).getAttribute('src'));
   const opacity=await slides.nth(step%4).evaluate(e=>Number(getComputedStyle(e.parentElement).opacity));assert(opacity>0&&opacity<1,'Expected an in-progress fade');
  }
  await page.waitForTimeout(500);
  assert.equal(await slides.first().evaluate(e=>getComputedStyle(e.parentElement).opacity),'1');
  const after=await hero.boundingBox();assert.equal(after.width,bounds.width);assert.equal(after.height,bounds.height);
  const text=await page.locator('body').innerText();assert(/26,007 pounds/i.test(text));assert(/Goal:\s*5,152\/20,000/.test(text));assert(!text.includes('25,599'));assert(!text.includes('4,743/20,000'));
  await hero.locator('a').click();await page.waitForURL(base+'/gallery/');assert((await page.title()).includes('Gallery'));
  // Without any JavaScript, the first hero image and native Gallery link still work.
  await context.close();
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000}});
  const fallback=await noJS.newPage();await fallback.goto(base+'/',{waitUntil:'load'});
  assert(await fallback.locator('.sth-hero img').first().evaluate(e=>e.complete&&e.naturalWidth>0&&getComputedStyle(e.parentElement).opacity==='1'));
  await noJS.close();results.push({width,passed:true,bounds});console.log('PASS hero, loop, fade, Gallery, figures, and no-JS fallback',width);
 }
}catch(error){results.push({passed:false,error:error.stack});console.error(error);process.exitCode=1;}
finally{await browser.close();server.close();}
await writeFile('migration/hero-validation.json',JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
