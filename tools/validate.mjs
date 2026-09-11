import {JSDOM,VirtualConsole} from 'jsdom';
import {readFile,access,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {glob} from 'glob';
import {within} from './migrate.mjs';
import {EXCLUDED_ROUTES,REMOVED_CANDID_SEAL_LINKS} from './legacy-policy.mjs';
const inventory=JSON.parse(await readFile('migration/inventory.json'));
const root=resolve(process.env.SITE_ROOT||'public'),issues=[],knownBroken=new Set(['/open-positions/','/donations/slopes-to-hope']);
const publishedRoutes=inventory.routes.filter(r=>!EXCLUDED_ROUTES.has(r.path));
const routes=new Set(publishedRoutes.map(r=>r.path));routes.add('/staff/');
const normalize=s=>s.replace(/\s+/g,' ').trim();
for(const r of publishedRoutes){
 const html=await readFile(within(root,r.path+'index.html'),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org'+r.path,virtualConsole:new VirtualConsole()}).window.document;
 if(d.title!==r.title)issues.push({path:r.path,error:'Title changed'});
 const expectedUrl='https://slopestohope.org'+r.path;
 if(d.querySelector('link[rel="canonical"]')?.href!==expectedUrl)issues.push({path:r.path,error:'Canonical URL missing or incorrect'});
 if(d.querySelector('meta[property="og:url"]')?.content!==expectedUrl||d.querySelector('meta[name="og:url"]'))issues.push({path:r.path,error:'Open Graph URL missing or incorrect'});
 if(d.querySelector('link[rel="shortlink"]'))issues.push({path:r.path,error:'WordPress shortlink remains in static output'});
 const text=d.cloneNode(true);text.querySelectorAll('script,style').forEach(e=>e.remove());
 if(r.path==='/faq/') {
   const faq=d.querySelector('[data-elementor-id="3827"]');
   if(normalize(faq?.textContent||'')!=='F.A.Q.For questions about Slopes to Hope, please contact us.')issues.push({path:r.path,error:'Approved legacy-content adaptation changed'});
 } else if(normalize(text.body.textContent)!==r.bodyText)issues.push({path:r.path,error:'Source wording changed'});
 for(const a of d.querySelectorAll('a[href]')){
  const u=new URL(a.href);if(u.origin!=='https://slopestohope.org'||a.getAttribute('href').startsWith('#'))continue;
  if(knownBroken.has(u.pathname))continue;
  if(!routes.has(u.pathname)&&!/^\/wp-content\//.test(u.pathname))issues.push({path:r.path,error:'Unmapped local link',url:u.pathname});
 }
 for(const e of d.querySelectorAll('[src],link[rel="stylesheet"]')){
  const value=e.getAttribute('src')||e.getAttribute('href');
  if(!value||/^(data:|about:)/.test(value))continue;
  const u=new URL(value,'https://slopestohope.org'+r.path);
  if(['slopestohope.com','www.slopestohope.com'].includes(u.hostname))issues.push({path:r.path,error:'Source host dependency',url:value});
  if(u.origin==='https://slopestohope.org')try{await access(within(root,u.pathname));}catch{issues.push({path:r.path,error:'Missing asset',url:value});}
 }
 for(const a of d.querySelectorAll('[data-e-action-hash]')){
  const v=decodeURIComponent(a.getAttribute('data-e-action-hash')),b64=v.match(/settings=([^&]+)/)?.[1];
  if(b64&&Buffer.from(b64,'base64').toString().includes('slopestohope.com'))issues.push({path:r.path,error:'Legacy host in encoded lightbox action'});
 }
 for(const l of r.links.filter(l=>/^https?:/.test(l.url)&&!new URL(l.url).hostname.endsWith('slopestohope.com'))){
  if(REMOVED_CANDID_SEAL_LINKS.has(l.url))continue;
  if(![...d.querySelectorAll('a[href]')].some(a=>a.href===l.url))issues.push({path:r.path,error:'External destination changed',url:l.url});
 }
}
const legacyPattern=/community\s*across\s*america|communityacrossamerica|community[_-]?across[_-]?america|acrossamerica|\bcaa\b|community points|6413b7253c4a550011b7dd9a/i;
const giveWpPattern=/givewp|\[give_(?:form|receipt)\b|\/donations\/slopes-to-hope|\/donation-(?:confirmation|failed)\/|\/donor-dashboard\/|\/test-donate\//i;
const deletedPolicyShellPattern=/\/(?:privacy-policy-2|terms-of-service-2)\//i;
const brokenInstagramPreviewPattern=/www\.instagram\.com\/reel\/DXXtI72EU5f\/media\//i;
for(const file of await glob('**/*.{html,css,js,json}',{cwd:root,nodir:true})){
 const contents=await readFile(resolve(root,file),'utf8');
 if(legacyPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Community Across America legacy reference in published output'});
 if(giveWpPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'GiveWP legacy reference in published output'});
 if(deletedPolicyShellPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Deleted title-only policy route in published output'});
 if(brokenInstagramPreviewPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Broken Instagram preview image remains in published output'});
}
const output={testedAt:new Date().toISOString(),routes:publishedRoutes.length,excludedRoutes:[...EXCLUDED_ROUTES],issues,knownSourceBrokenLinks:[...knownBroken]};
await writeFile('migration/static-validation.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(issues.length)process.exitCode=1;
