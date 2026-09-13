import {JSDOM, VirtualConsole} from 'jsdom';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {EXCLUDED_ROUTES} from './legacy-policy.mjs';

export const POLICY_ROUTES=[
  {path:'/privacy-policy/',title:'Privacy Policy – Slopes to Hope'},
  {path:'/terms-of-service/',title:'Terms of Service – Slopes to Hope'},
];

const footerLinks='<span class="sth-footer-links"><a href="/privacy-policy/">Privacy Policy</a><a href="/terms-of-service/">Terms of Service</a><button type="button" data-open-cookie-settings>Cookie settings</button></span>';

export function applyConsentAndPolicyLinks(document){
  document.querySelectorAll('#google_gtagjs-js,#google_gtagjs-js-after,#leadin-script-loader-js-js,#leadin-script-loader-js-js-extra').forEach(node=>node.remove());
  document.querySelectorAll('#ea11y-widget-js-extra,#ea11y-widget-js').forEach(node=>node.remove());
  document.querySelectorAll('script:not([src])').forEach(script=>{
    if(/registerAllyAction|allyWidget:open|ea11yWidget/.test(script.textContent))script.remove();
  });
  document.querySelectorAll('link[href="//cdn.elementor.com"]').forEach(node=>node.remove());
  document.querySelectorAll('link[href]').forEach(link=>{if(/google-analytics\.com|googletagmanager\.com/.test(link.href))link.remove();});
  if(!document.querySelector('link[href="/assets/consent.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/consent.css';document.head.appendChild(link);}
  const footer=document.querySelector('.site-info .container');
  if(footer&&!footer.querySelector('.sth-footer-links'))footer.insertAdjacentHTML('beforeend',footerLinks);
  if(!document.querySelector('script[src="/assets/consent.js"]')){const script=document.createElement('script');script.src='/assets/consent.js';script.defer=true;document.body.appendChild(script);}
}

const header='<header class="sth-policy-header"><div class="sth-policy-header__inner"><a class="sth-policy-brand" href="/">Slopes to Hope</a><p class="sth-policy-tagline">Reducing Waste and Fostering Hope</p><nav class="sth-policy-nav" aria-label="Primary"><a href="/">Home</a><a href="/gallery/">Gallery</a><a href="/team/">Team</a><a href="/our-story/">Our Story</a><a href="/partners/">Partners</a><a href="/contact-us/">Contact</a><a href="https://givebutter.com/slopes-to-hope">DONATE</a></nav></div></header>';
const footer='<footer class="sth-policy-footer" role="contentinfo"><div class="sth-policy-footer__inner">Copyright © 2026 Slopes to Hope '+footerLinks+'</div></footer>';

const privacyBody=`<h1>Privacy Policy</h1><p><strong>Effective September 11, 2026</strong></p><p>This policy explains how information is handled when you visit the Slopes to Hope website or use services linked or embedded here.</p><h2>Information you choose to provide</h2><p>The newsletter signup and contact forms are provided by HubSpot. When you submit a form, the information you enter is sent to HubSpot for Slopes to Hope so the organization can manage subscriptions, respond to messages, and maintain related records. The fields shown on each form determine what information is requested.</p><p>Donation and fundraising links take you to third-party services, including Givebutter, RallyUp, and Colorado Gives. Those providers collect and process the information needed for their services under their own terms and privacy policies. Slopes to Hope does not collect payment-card details through this website.</p><h2>Analytics and cookies</h2><p>With your permission, this website loads Google Analytics through Google tag <code>GT-MKTP8299</code> (measurement ID <code>G-XEWDW3TYVZ</code>) to understand site usage. Analytics is not loaded until you accept analytics in the consent interface. You may decline analytics or change your choice at any time using “Cookie settings” in the footer.</p><p>Your consent choice is stored in your browser's local storage. Embedded forms and third-party content may use their own cookies or similar technologies when they load or when you interact with them.</p><h2>Hosting and third-party content</h2><p>The site is hosted using GitHub Pages. Hosting and network providers may process routine technical information, such as IP addresses, request details, browser information, timestamps, and security logs, to deliver and protect the site.</p><p>The site also links to or embeds services such as Google Maps, Instagram, Facebook, and other third-party websites. Those services receive information according to their own practices when their content loads or when you follow a link.</p><h2>Choices and contact</h2><p>You can decline optional analytics, change your analytics choice through the footer, avoid submitting forms, and choose whether to visit third-party services. Newsletter messages should provide the applicable subscription-management options.</p><p>For questions about this policy or information submitted to Slopes to Hope, email <a href="mailto:drew@slopestohope.com">drew@slopestohope.com</a> or use the <a href="/contact-us/">contact page</a>.</p><p>This policy may be updated as the website and its services change. The effective date above identifies the current version.</p>`;
const termsBody=`<h1>Terms of Service</h1><p><strong>Effective September 11, 2026</strong></p><p>These terms apply to use of the Slopes to Hope website. By using the site, you agree to these terms.</p><h2>Informational website</h2><p>This website provides general information about Slopes to Hope, its mission, activities, partners, and ways to support or contact the organization. Content may be corrected or updated as circumstances change.</p><h2>Third-party services and links</h2><p>The site links to or embeds services operated by others, including HubSpot, Givebutter, RallyUp, Colorado Gives, Google Maps, Instagram, Facebook, and other third-party websites. Those services are governed by their own terms and policies. Slopes to Hope does not control their availability, content, or data practices.</p><h2>Donations</h2><p>Donation and fundraising transactions are handled through the third-party provider selected by the visitor. Any transaction is subject to that provider's checkout information, terms, privacy policy, and confirmation process. This website does not directly process payment-card information.</p><h2>Site content</h2><p>Site text, designs, logos, photographs, and other materials may be protected by copyright, trademark, or other rights. You may view the site and share links to it for personal and informational purposes. Contact Slopes to Hope before reusing site content beyond uses allowed by law. Third-party materials remain subject to their respective owners' rights.</p><h2>Availability and responsibility</h2><p>The site is provided for general informational use. Slopes to Hope does not promise that every page, link, embed, or third-party service will always be available or error-free. To the extent permitted by applicable law, Slopes to Hope is not responsible for losses caused by reliance on site content or by third-party services outside its control.</p><h2>Changes and contact</h2><p>These terms may be updated as the website changes. The effective date above identifies the current version. For questions, email <a href="mailto:drew@slopestohope.com">drew@slopestohope.com</a> or use the <a href="/contact-us/">contact page</a>.</p>`;

function policyHtml(route,body){return `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${route.title}</title><meta name="robots" content="max-image-preview:large"><link rel="canonical" href="https://slopestohope.org${route.path}"><meta property="og:url" content="https://slopestohope.org${route.path}"><link rel="stylesheet" href="/assets/policy.css"><link rel="stylesheet" href="/assets/consent.css"></head><body class="sth-policy-page">${header}<main class="sth-policy-main">${body}</main>${footer}<script defer src="/assets/consent.js"></script></body></html>\n`;}

export async function applyReleasePolicy(root='public'){
  const inventory=JSON.parse(await readFile('migration/inventory.json','utf8'));
  for(const route of inventory.routes.filter(route=>!EXCLUDED_ROUTES.has(route.path))){
    const file=resolve(root,'.'+route.path,'index.html');
    const document=new JSDOM(await readFile(file,'utf8'),{url:'https://slopestohope.org'+route.path,virtualConsole:new VirtualConsole()}).window.document;
    applyConsentAndPolicyLinks(document);
    await writeFile(file,'<!DOCTYPE html>\n'+document.documentElement.outerHTML+'\n');
  }
  for(const [route,body] of [[POLICY_ROUTES[0],privacyBody],[POLICY_ROUTES[1],termsBody]]){
    const dir=resolve(root,'.'+route.path);await mkdir(dir,{recursive:true});await writeFile(resolve(dir,'index.html'),policyHtml(route,body));
  }
}

if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/release-policy.mjs'))await applyReleasePolicy();
