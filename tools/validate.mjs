import {JSDOM,VirtualConsole} from 'jsdom';
import {readFile,access,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {glob} from 'glob';
import {within} from './migrate.mjs';
import {EXCLUDED_ROUTES,REMOVED_CANDID_SEAL_LINKS} from './legacy-policy.mjs';
import {POLICY_ROUTES} from './release-policy.mjs';
import {LINK_REPLACEMENTS} from './link-policy.mjs';
const inventory=JSON.parse(await readFile('migration/inventory.json'));
const root=resolve(process.env.SITE_ROOT||'public'),issues=[],knownBroken=new Set(['/open-positions/','/donations/slopes-to-hope']);
const publishedRoutes=inventory.routes.filter(r=>!EXCLUDED_ROUTES.has(r.path));
const routes=new Set([...publishedRoutes,...POLICY_ROUTES].map(r=>r.path));routes.add('/staff/');
const normalize=s=>s.replace(/\s+/g,' ').trim();
for(const r of publishedRoutes){
 const html=await readFile(within(root,r.path+'index.html'),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org'+r.path,virtualConsole:new VirtualConsole()}).window.document;
 if(d.title!==r.title)issues.push({path:r.path,error:'Title changed'});
 const expectedUrl='https://slopestohope.org'+r.path;
 if(d.querySelector('link[rel="canonical"]')?.href!==expectedUrl)issues.push({path:r.path,error:'Canonical URL missing or incorrect'});
 if(d.querySelector('meta[property="og:url"]')?.content!==expectedUrl||d.querySelector('meta[name="og:url"]'))issues.push({path:r.path,error:'Open Graph URL missing or incorrect'});
 if(d.querySelector('link[rel="shortlink"]'))issues.push({path:r.path,error:'WordPress shortlink remains in static output'});
 const text=d.cloneNode(true);
 // Exclude migration-added UI copy from the captured WordPress wording check.
 // The homepage also has one owner-approved fundraising display adaptation.
 text.querySelectorAll('script,style,.sth-footer-links,.sth-hero__credit,.sth-newsletter-policy,footer [data-open-cookie-settings]').forEach(e=>e.remove());
 let bodyText=normalize(text.body.textContent);
 if(r.path==='/')bodyText=bodyText.replaceAll('$8,068 raised$25,000 goal','$8,068.03');
 if(r.path==='/coosummit26/'){
   const approvedHeading='COO Summit 2026: Complimentary Concierge Pickup';
   const approvedParagraph="Complete the form below to request a one-time complimentary concierge pickup of your property's unclaimed lost-and-found clothing. We'll coordinate a convenient pickup time and provide documentation of your collection afterward.";
   const expectedBodyText=normalize(r.bodyText.replace(approvedHeading+approvedParagraph,''));
   bodyText=normalize(bodyText.replace(approvedHeading,''));
   if(bodyText!==expectedBodyText)issues.push({path:r.path,error:'Approved COO Summit visible-content adaptation changed'});
 } else if(r.path==='/faq/') {
   const faq=d.querySelector('[data-elementor-id="3827"]');
   if(!faq)issues.push({path:r.path,error:'FAQ content container missing'});
   else {
    const hiddenText=faq.querySelectorAll('.screen-reader-text');
    const hiddenHeading=faq.querySelector(':scope > h1.screen-reader-text');
    if(hiddenText.length!==1||!hiddenHeading||normalize(hiddenHeading.textContent)!=='FAQ')issues.push({path:r.path,error:'FAQ accessibility heading changed'});
    else hiddenHeading.remove();
    if(normalize(faq.textContent)!=='F.A.Q.For questions about Slopes to Hope, please contact us.')issues.push({path:r.path,error:'Approved legacy-content adaptation changed'});
   }
 } else if(bodyText!==r.bodyText)issues.push({path:r.path,error:'Source wording changed'});
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
  const expected=LINK_REPLACEMENTS.get(l.url)||l.url;
  if(![...d.querySelectorAll('a[href]')].some(a=>a.href===expected))issues.push({path:r.path,error:'External destination changed',url:l.url,expected});
 }
}
const legacyPattern=/community\s*across\s*america|communityacrossamerica|community[_-]?across[_-]?america|acrossamerica|\bcaa\b|community points|6413b7253c4a550011b7dd9a/i;
const giveWpPattern=/givewp|\[give_(?:form|receipt)\b|\/donations\/slopes-to-hope|\/donation-(?:confirmation|failed)\/|\/donor-dashboard\/|\/test-donate\//i;
const deletedPolicyShellPattern=/\/(?:privacy-policy-2|terms-of-service-2)\//i;
const brokenInstagramPreviewPattern=/www\.instagram\.com\/reel\/DXXtI72EU5f\/media\//i;
const elementorAllyPattern=/ea11y|allyWidget|cdn\.elementor\.com\/a11y\/widget\.js/i;
for(const file of await glob('**/*.{html,css,js,json}',{cwd:root,nodir:true})){
 const contents=await readFile(resolve(root,file),'utf8');
 if(legacyPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Community Across America legacy reference in published output'});
 if(giveWpPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'GiveWP legacy reference in published output'});
 if(deletedPolicyShellPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Deleted title-only policy route in published output'});
 if(brokenInstagramPreviewPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Broken Instagram preview image remains in published output'});
 if(elementorAllyPattern.test(contents))issues.push({path:file.replaceAll('\\','/'),error:'Elementor Ally accessibility widget remains in published output'});
}
for(const route of POLICY_ROUTES){
 const html=await readFile(within(root,route.path+'index.html'),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org'+route.path,virtualConsole:new VirtualConsole()}).window.document;
 if(d.title!==route.title)issues.push({path:route.path,error:'Policy title missing or incorrect'});
 if(d.querySelector('link[rel="canonical"]')?.href!=='https://slopestohope.org'+route.path)issues.push({path:route.path,error:'Policy canonical URL missing or incorrect'});
 if(d.querySelector('meta[property="og:url"]')?.content!=='https://slopestohope.org'+route.path)issues.push({path:route.path,error:'Policy Open Graph URL missing or incorrect'});
 if(!d.querySelector('main')?.textContent.trim())issues.push({path:route.path,error:'Policy body missing'});
}
for(const route of [...publishedRoutes,...POLICY_ROUTES]){
 const html=await readFile(within(root,route.path+'index.html'),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org'+route.path,virtualConsole:new VirtualConsole()}).window.document;
 const ids=new Set();
 for(const element of d.querySelectorAll('[id]')){
  if(ids.has(element.id))issues.push({path:route.path,error:'Duplicate HTML ID',id:element.id});
  ids.add(element.id);
 }
 const mobile=d.querySelector('.buddyx-mobile-menu ul.menu');
 if(mobile&&(mobile.id!=='primary-menu-mobile'||d.querySelector('#menu-toggle')?.getAttribute('aria-controls')!==mobile.id))issues.push({path:route.path,error:'Mobile menu control does not identify its unique menu'});
 if(route.path==='/gallery/')for(const link of d.querySelectorAll('a[data-elementor-open-lightbox="yes"]')){
  if(!link.querySelector('img')?.alt.trim()||!link.getAttribute('aria-label')?.trim())issues.push({path:route.path,error:'Gallery photo or lightbox link lacks a description',url:link.getAttribute('href')});
 }
 const consentScripts=[...d.querySelectorAll('script[src="/assets/consent.js"]')];
 if(!d.querySelector('link[href="/assets/consent.css"]')||consentScripts.length!==1)issues.push({path:route.path,error:'Consent assets missing or duplicated'});
 else if(consentScripts[0].parentElement!==d.head||consentScripts[0].hasAttribute('defer')||consentScripts[0].hasAttribute('async')||d.head.querySelector('script')!==consentScripts[0])issues.push({path:route.path,error:'Consent guard must be the first synchronous head script'});
 if(!d.querySelector('footer a[href="/privacy-policy/"]')||!d.querySelector('footer a[href="/terms-of-service/"]')||!d.querySelector('footer [data-open-cookie-settings]'))issues.push({path:route.path,error:'Policy or cookie-settings footer control missing'});
 if(d.querySelector('#google_gtagjs-js,#google_gtagjs-js-after,#leadin-script-loader-js-js'))issues.push({path:route.path,error:'Uncontrolled analytics loader present in static HTML'});
 for(const script of d.querySelectorAll('script[type="application/ld+json"]'))try{JSON.parse(script.textContent);}catch{issues.push({path:route.path,error:'Malformed structured data'});}
}
const consent=await readFile(within(root,'/assets/consent.js'),'utf8');
for(const expected of ['GT-MKTP8299','G-XEWDW3TYVZ','granted','denied','slopesToHopeAnalyticsConsent','sth_analytics','cdn-cgi/rum'])if(!consent.includes(expected))issues.push({path:'/assets/consent.js',error:`Consent implementation missing ${expected}`});
const formEmbeds=[
 {path:'/',file:'index.html',id:'9a181260-20a9-408c-8591-cca3093d7e3f'},
 {path:'/contact-us/',file:'contact-us/index.html',id:'f35f941a-7978-41cc-aabc-4dc669ac9a0a'},
 {path:'/coosummit26/',file:'coosummit26/index.html',id:'05a4b6fe-6b23-433e-bf08-e667071c8d3b'},
];
const exactLoader='<script src="https://js-na2.hsforms.net/forms/embed/244348981.js" defer></script>';
for(const form of formEmbeds){
 const html=await readFile(within(root,'/'+form.file),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org'+form.path,virtualConsole:new VirtualConsole()}).window.document;
 const frames=[...d.querySelectorAll('.hs-form-frame')];
 const loaders=[...d.querySelectorAll('script[src^="https://js-na2.hsforms.net/forms/embed/"]')];
 if(frames.length!==1)issues.push({path:form.path,error:'Expected exactly one HubSpot form frame'});
 else if(frames[0].dataset.region!=='na2'||frames[0].dataset.portalId!=='244348981'||frames[0].dataset.formId!==form.id)issues.push({path:form.path,error:'HubSpot form configuration changed'});
 else if(!frames[0].previousElementSibling?.matches('script[src="https://js-na2.hsforms.net/forms/embed/244348981.js"][defer]'))issues.push({path:form.path,error:'HubSpot loader and form frame are not the owner-supplied adjacent snippet'});
 if(loaders.length!==1||loaders[0].src!=='https://js-na2.hsforms.net/forms/embed/244348981.js'||!loaders[0].defer)issues.push({path:form.path,error:'Exact HubSpot forms loader missing or duplicated'});
 if(!html.includes(exactLoader)||/hsforms\.net\/forms\/embed\/v2/.test(html))issues.push({path:form.path,error:'HubSpot embed is not the owner-supplied snippet'});
}
{
 const html=await readFile(within(root,'/coosummit26/index.html'),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org/coosummit26/',virtualConsole:new VirtualConsole()}).window.document;
 const description="Complete the form below to request a one-time complimentary concierge pickup of your property's unclaimed lost-and-found clothing. We'll coordinate a convenient pickup time and provide documentation of your collection afterward.";
 const formWidget=d.querySelector('.hs-form-frame')?.closest('.elementor-widget');
 if(d.querySelectorAll('h1').length!==1||normalize(d.querySelector('h1')?.textContent||'')!=='COO Summit 2026: Complimentary Concierge Pickup')issues.push({path:'/coosummit26/',error:'COO Summit must have exactly one correct H1'});
 if(d.querySelector('meta[name="description"]')?.content!==description||d.querySelector('meta[property="og:description"]')?.content!==description)issues.push({path:'/coosummit26/',error:'COO Summit description metadata changed'});
 if(d.querySelector('meta[property="og:title"]')?.content!=='COO Summit 2026: Complimentary Concierge Pickup – Slopes to Hope')issues.push({path:'/coosummit26/',error:'COO Summit Open Graph title changed'});
 if(d.querySelector('meta[property="og:type"]')?.content!=='website'||d.querySelector('meta[property="og:site_name"]')?.content!=='Slopes to Hope'||d.querySelector('meta[property="og:image"]')?.content!=='https://slopestohope.org/assets/coosummit26-marriott-2026.webp')issues.push({path:'/coosummit26/',error:'COO Summit Open Graph metadata incomplete'});
 if(/Contact%20Us|"page_permalink":"\/contact-us\/"|postId:"71"|context:\{"id":71,"type":"post"\}|data-elementor-id="71"|elementor-71/.test(html))issues.push({path:'/coosummit26/',error:'Contact Us runtime metadata remains'});
 if(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?/.test(d.querySelector('meta[name="viewport"]')?.content||''))issues.push({path:'/coosummit26/',error:'COO Summit viewport prevents browser zoom'});
 if(!formWidget?.previousElementSibling?.matches('[data-widget_type="image.default"]'))issues.push({path:'/coosummit26/',error:'COO Summit form is not immediately after the picture'});
}
const output={testedAt:new Date().toISOString(),routes:publishedRoutes.length+POLICY_ROUTES.length,excludedRoutes:[...EXCLUDED_ROUTES],issues,knownSourceBrokenLinks:[...knownBroken]};
await writeFile('migration/static-validation.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(issues.length)process.exitCode=1;
