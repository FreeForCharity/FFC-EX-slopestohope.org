import {JSDOM,VirtualConsole} from 'jsdom';
import {readFile,access,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {glob} from 'glob';
import {within} from './migrate.mjs';
import {EXCLUDED_ROUTES,REMOVED_CANDID_SEAL_LINKS} from './legacy-policy.mjs';
import {POLICY_ROUTES} from './release-policy.mjs';
import {LINK_REPLACEMENTS} from './link-policy.mjs';
import {hasRestrictiveViewportDirective} from './viewport-policy.mjs';
const inventory=JSON.parse(await readFile('migration/inventory.json'));
const root=resolve(process.env.SITE_ROOT||'public'),issues=[],knownBroken=new Set(['/open-positions/','/donations/slopes-to-hope']);
const publishedRoutes=inventory.routes.filter(r=>!EXCLUDED_ROUTES.has(r.path));
const routes=new Set([...publishedRoutes,...POLICY_ROUTES].map(r=>r.path));routes.add('/staff/');
const sitemapRoutes=[...publishedRoutes,...POLICY_ROUTES];
if(sitemapRoutes.length!==11||new Set(sitemapRoutes.map(r=>r.path)).size!==11)issues.push({path:'/sitemap.xml',error:'Published sitemap route inventory must contain exactly 11 unique pages'});
if(sitemapRoutes.some(r=>!r.path.startsWith('/')||r.path.includes('?')||r.path.includes('#')))issues.push({path:'/sitemap.xml',error:'Published sitemap route contains an invalid path'});
const normalize=s=>s.replace(/\s+/g,' ').trim();
const PRIMARY_IMAGES=new Map([
 ['/',{url:'https://slopestohope.org/wp-content/uploads/2026/02/IMG_20260210_201111-scaled-e1771290868699.jpg',alt:'A group posing beside a moving truck.'}],
 ['/gallery/',{url:'https://slopestohope.org/wp-content/uploads/2026/08/Marriotts-Mountain-Valley-Lodge-PillowCollection.jpg',alt:'People standing beside a moving truck outside a lodge.'}],
 ['/coosummit26/',{url:'https://slopestohope.org/assets/coosummit26-marriott-2026.webp',alt:'Slopes to Hope collection at Marriott Vacation Club Mountain Valley Lodge'}],
]);
const ORGANIZATION_LOGO='https://slopestohope.org/wp-content/uploads/2025/06/cropped-Drew-1.png';
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
 text.querySelectorAll('script,style,.sth-footer-links,.sth-hero__credit,.sth-newsletter-policy,.coosummit26-news-credit,.news-credit,footer [data-open-cookie-settings]').forEach(e=>e.remove());
 let bodyText=normalize(text.body.textContent);
 if(r.path==='/'){
  bodyText=bodyText.replaceAll('$8,068 raised$25,000 goal','$8,068.03');
  if(d.querySelector('.sth-hero a[href="/gallery/"],.eael-wrapper-link-5a53669d[href="/gallery/"]'))issues.push({path:r.path,error:'Homepage hero must not be a Gallery navigation target'});
  if(!d.querySelector('.sth-hero .sth-hero__media'))issues.push({path:r.path,error:'Homepage hero media wrapper missing'});
 }
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
 const expectedUrl='https://slopestohope.org'+route.path;
 const viewportContent=d.querySelector('meta[name="viewport"]')?.content||'';
 if(hasRestrictiveViewportDirective(viewportContent))issues.push({path:route.path,error:'Viewport restricts browser zoom'});
 if(route.path==='/'){
   const ctas=[...d.querySelectorAll('a.elementskit-btn')];
   const volunteer=ctas.filter(link=>normalize(link.textContent)==='Volunteer');
   const partner=ctas.filter(link=>normalize(link.textContent)==='Partner');
   if(volunteer.length!==1||volunteer[0].getAttribute('href')!=='/contact-us/?initial_inquiry=FDzWWvIE8BnvAFjK-rnd3')issues.push({path:route.path,error:'Volunteer CTA must preselect the Volunteer inquiry reason'});
   if(partner.length!==1||partner[0].getAttribute('href')!=='/contact-us/?initial_inquiry=pLvTcP1Yx2esDFetkizjy')issues.push({path:route.path,error:'Partner CTA must preselect the Sponsorship/Partnership inquiry reason'});
   const supportingHeadings=['Mission','Why?','How?','How is it funded?','How can you help?'];
   const actualHeadings=[...d.querySelectorAll('h3.elementor-heading-title')].map(heading=>normalize(heading.textContent));
   if(supportingHeadings.some(heading=>!actualHeadings.includes(heading))||d.querySelector('h5.elementor-heading-title'))issues.push({path:route.path,error:'Homepage supporting sections must use level-three headings'});
 }
 const description=d.querySelector('meta[name="description"]')?.content?.trim()||'';
 if(!d.title.trim()||!description)issues.push({path:route.path,error:'SEO title or meta description missing'});
 if(d.querySelector('meta[property="og:title"]')?.content!==d.title)issues.push({path:route.path,error:'Open Graph title missing or inconsistent'});
 if(d.querySelector('meta[property="og:description"]')?.content!==description)issues.push({path:route.path,error:'Open Graph description missing or inconsistent'});
 if(d.querySelector('meta[property="og:type"]')?.content!=='website'||d.querySelector('meta[property="og:site_name"]')?.content!=='Slopes to Hope')issues.push({path:route.path,error:'Open Graph site metadata missing or inconsistent'});
 const ogImage=d.querySelector('meta[property="og:image"]')?.content||'';
 const ogImageAlt=d.querySelector('meta[property="og:image:alt"]')?.content||'';
 if(!ogImage.startsWith('https://slopestohope.org/')||!ogImageAlt)issues.push({path:route.path,error:'Search/social image metadata missing or not first-party'});
 if(d.querySelector('meta[name="twitter:card"]')?.content!=='summary_large_image'||d.querySelector('meta[name="twitter:title"]')?.content!==d.title||d.querySelector('meta[name="twitter:description"]')?.content!==description||d.querySelector('meta[name="twitter:image"]')?.content!==ogImage||d.querySelector('meta[name="twitter:image:alt"]')?.content!==ogImageAlt)issues.push({path:route.path,error:'Social image metadata missing or inconsistent'});
 if(/(?:^|,|\s)noindex(?:,|\s|$)/i.test(d.querySelector('meta[name="robots"]')?.content||''))issues.push({path:route.path,error:'Published route unexpectedly marked noindex'});
 const seoScripts=[...d.querySelectorAll('script[type="application/ld+json"][data-sth-seo]')];
 if(seoScripts.length!==1)issues.push({path:route.path,error:'Expected exactly one Slopes to Hope SEO structured-data block'});
 else try{
   const data=JSON.parse(seoScripts[0].textContent);
   const graph=Array.isArray(data?.['@graph'])?data['@graph']:[];
   const page=graph.find(node=>node?.['@type']==='WebPage');
   if(data?.['@context']!=='https://schema.org'||page?.url!==expectedUrl||page?.['@id']!==expectedUrl+'#webpage'||page?.isPartOf?.['@id']!=='https://slopestohope.org/#website'||page?.about?.['@id']!=='https://slopestohope.org/#organization')issues.push({path:route.path,error:'WebPage structured data missing or inconsistent'});
   const expectedPrimary=PRIMARY_IMAGES.get(route.path);
   if(expectedPrimary){
     const primary=page?.primaryImageOfPage;
     if(primary?.['@type']!=='ImageObject'||primary?.url!==expectedPrimary.url||primary?.contentUrl!==expectedPrimary.url||primary?.caption!==expectedPrimary.alt||primary?.representativeOfPage!==true)issues.push({path:route.path,error:'Primary image structured data missing or inconsistent'});
   }else if(page?.primaryImageOfPage)issues.push({path:route.path,error:'Unexpected primary image structured data'});
   if(route.path==='/'){
     const org=graph.find(node=>node?.['@id']==='https://slopestohope.org/#organization');
     const site=graph.find(node=>node?.['@id']==='https://slopestohope.org/#website');
     if(org?.name!=='Slopes to Hope'||org?.url!=='https://slopestohope.org/'||org?.nonprofitStatus!=='https://schema.org/Nonprofit501c3'||org?.location?.name!=='Breckenridge, Colorado'||org?.areaServed?.name!=='Colorado')issues.push({path:route.path,error:'Organization structured data missing or inconsistent'});
     if(org?.logo?.['@type']!=='ImageObject'||org?.logo?.url!==ORGANIZATION_LOGO||org?.logo?.contentUrl!==ORGANIZATION_LOGO||org?.logo?.width!==512||org?.logo?.height!==512)issues.push({path:route.path,error:'Organization logo structured data missing or inconsistent'});
     if(site?.name!=='Slopes to Hope'||site?.url!=='https://slopestohope.org/'||site?.publisher?.['@id']!=='https://slopestohope.org/#organization')issues.push({path:route.path,error:'WebSite structured data missing or inconsistent'});
   }
 }catch{issues.push({path:route.path,error:'Malformed Slopes to Hope SEO structured data'});}
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
// Every real content page must use the same site header/footer structure as the homepage.
// Current-page navigation state is the only permitted header markup difference.
{
 const homeHtml=await readFile(within(root,'/index.html'),'utf8');
 const homeDoc=new JSDOM(homeHtml,{url:'https://slopestohope.org/',virtualConsole:new VirtualConsole()}).window.document;
 const normalizeHeader=node=>{
  if(!node)return '';
  const clone=node.cloneNode(true);
  for(const element of clone.querySelectorAll('[class]')){
   const classes=[...element.classList].filter(name=>!['current-menu-item','current_page_item','page_item'].includes(name)&&!/^page-item-\d+$/.test(name));
   element.setAttribute('class',classes.join(' '));
  }
  clone.querySelectorAll('[aria-current]').forEach(element=>element.removeAttribute('aria-current'));
  return clone.outerHTML;
 };
 const expectedHeader=normalizeHeader(homeDoc.querySelector('.site-header-wrapper'));
 const expectedFooter=homeDoc.querySelector('#colophon.site-footer')?.outerHTML||'';
 const chromeRoutes=[...new Set([...publishedRoutes.map(route=>route.path),...POLICY_ROUTES.map(route=>route.path),'/coosummit26confirm/'])];
 for(const path of chromeRoutes){
  const html=await readFile(within(root,path+'index.html'),'utf8');
  const d=new JSDOM(html,{url:'https://slopestohope.org'+path,virtualConsole:new VirtualConsole()}).window.document;
  if(!expectedHeader||normalizeHeader(d.querySelector('.site-header-wrapper'))!==expectedHeader)issues.push({path,error:'Site header structure drifted from homepage'});
  if(!expectedFooter||d.querySelector('#colophon.site-footer')?.outerHTML!==expectedFooter)issues.push({path,error:'Site footer drifted from homepage'});
  if(!d.querySelector('#page.site')||!d.querySelector('.mobile-menu-close'))issues.push({path,error:'Shared site chrome wrappers missing'});
  if(!d.querySelector('link[href="/assets/static-compat.css"]'))issues.push({path,error:'Shared site chrome stylesheet missing'});
 }
 const standalonePaths=new Set(['/coosummit26confirm/',...POLICY_ROUTES.map(route=>route.path)]);
 for(const path of standalonePaths){
  const html=await readFile(within(root,path+'index.html'),'utf8');
  const d=new JSDOM(html,{url:'https://slopestohope.org'+path,virtualConsole:new VirtualConsole()}).window.document;
  if(!d.querySelector('script[src="/assets/consent.js"]')||!d.querySelector('link[href="/assets/consent.css"]'))issues.push({path,error:'Shared consent assets missing'});
  const homeTypography=homeDoc.querySelector('#kirki-inline-styles')?.textContent;
  const specialTypography=d.querySelector('#kirki-inline-styles')?.textContent;
  if(!homeTypography||specialTypography!==homeTypography)issues.push({path,error:'Shared typography must exactly match homepage'});
  const homeCritical=homeDoc.querySelector('#litespeed-ccss')?.textContent;
  const specialCritical=d.querySelector('#litespeed-ccss')?.textContent;
  if(!homeCritical||specialCritical!==homeCritical)issues.push({path,error:'Shared critical styling must exactly match homepage'});
  const homeCustomCss=homeDoc.querySelector('#wp-custom-css')?.textContent;
  const specialCustomCss=d.querySelector('#wp-custom-css')?.textContent;
  if(!homeCustomCss||specialCustomCss!==homeCustomCss)issues.push({path,error:'Shared custom header styling must exactly match homepage'});
  const homeUcss=homeDoc.querySelector('link[href*="/wp-content/litespeed/ucss/"]')?.getAttribute('href');
  const specialUcss=d.querySelector('link[href*="/wp-content/litespeed/ucss/"]')?.getAttribute('href');
  if(!homeUcss||specialUcss!==homeUcss)issues.push({path,error:'Shared stylesheet must exactly match homepage'});
  const localCss=[...d.querySelectorAll('style')].filter(node=>!['kirki-inline-styles','litespeed-ccss','wp-custom-css'].includes(node.id)).map(node=>node.textContent).join('\n');
  const unsafeChromeCss=/(^|})\s*(?:\*|html|body|a|p|h[1-6])\s*(?:,|\{)|\.(?:site-header|site-branding|main-navigation|site-footer|site-info)\b/m;
  if(unsafeChromeCss.test(localCss))issues.push({path,error:'Page-local CSS must not override shared site chrome'});
 }
 const sharedChromeCss=await readFile(within(root,'/assets/static-compat.css'),'utf8');
 if(!/\.site-header\s+\.donate-menu\s*>\s*a\s*\{[^}]*background:\s*#203a58/i.test(sharedChromeCss))issues.push({path:'/assets/static-compat.css',error:'Shared Donate button background must use the approved lighter navy'});
 if(!/\.site-header\s+\.donate-menu\s*>\s*a\s*\{[^}]*color:\s*#fff\s*!important/i.test(sharedChromeCss))issues.push({path:'/assets/static-compat.css',error:'Shared Donate button text must remain white'});
}
const consent=await readFile(within(root,'/assets/consent.js'),'utf8');
for(const expected of ['GT-MKTP8299','G-XEWDW3TYVZ','granted','denied','slopesToHopeAnalyticsConsent','sth_analytics','cdn-cgi/rum'])if(!consent.includes(expected))issues.push({path:'/assets/consent.js',error:`Consent implementation missing ${expected}`});
const formEmbeds=[
 {path:'/',file:'index.html',id:'9a181260-20a9-408c-8591-cca3093d7e3f'},
 {path:'/contact-us/',file:'contact-us/index.html',id:'f35f941a-7978-41cc-aabc-4dc669ac9a0a'},
 {path:'/coosummit26/',file:'coosummit26/index.html',id:'05a4b6fe-6b23-433e-bf08-e667071c8d3b'},
];
{
 const formHtml=await readFile(within(root,'/coosummit26/index.html'),'utf8');
 const confirmHtml=await readFile(within(root,'/coosummit26confirm/index.html'),'utf8');
 const formDoc=new JSDOM(formHtml,{url:'https://slopestohope.org/coosummit26/',virtualConsole:new VirtualConsole()}).window.document;
 const confirmDoc=new JSDOM(confirmHtml,{url:'https://slopestohope.org/coosummit26confirm/',virtualConsole:new VirtualConsole()}).window.document;
 if(normalize(formDoc.querySelector('.coosummit26-news-credit')?.textContent||'')!=='Featured on 9NEWS')issues.push({path:'/coosummit26/',error:'9NEWS video credit missing or changed'});
 if(normalize(confirmDoc.querySelector('.news-credit')?.textContent||'')!=='Featured on 9NEWS')issues.push({path:'/coosummit26confirm/',error:'9NEWS video credit missing or changed'});
}
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
 if(hasRestrictiveViewportDirective(d.querySelector('meta[name="viewport"]')?.content||''))issues.push({path:'/coosummit26/',error:'COO Summit viewport restricts browser zoom'});
 if(!formWidget?.previousElementSibling?.matches('[data-widget_type="image.default"]'))issues.push({path:'/coosummit26/',error:'COO Summit form is not immediately after the picture'});
}
const output={testedAt:new Date().toISOString(),routes:publishedRoutes.length+POLICY_ROUTES.length,excludedRoutes:[...EXCLUDED_ROUTES],issues,knownSourceBrokenLinks:[...knownBroken]};
await writeFile('migration/static-validation.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(issues.length)process.exitCode=1;
