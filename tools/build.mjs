import {access,cp,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {EXCLUDED_ROUTES} from './legacy-policy.mjs';
import {POLICY_ROUTES} from './release-policy.mjs';
import {JSDOM,VirtualConsole} from 'jsdom';
const root=resolve('.'),out=resolve('out');
if(relative(root,out)!=='out')throw new Error('Invalid export directory');
await rm(out,{recursive:true,force:true});
await cp(resolve('public'),out,{recursive:true});
const inventory=JSON.parse(await readFile('migration/inventory.json'));
const routes=[...inventory.routes.filter(route=>!EXCLUDED_ROUTES.has(route.path)),...POLICY_ROUTES];
const routePaths=routes.map(route=>route.path);
if(routePaths.length!==11||new Set(routePaths).size!==11)throw new Error('Sitemap must contain exactly 11 unique published routes');
if(routePaths.some(path=>!path.startsWith('/')||path.includes('?')||path.includes('#')))throw new Error('Sitemap route contains an invalid path');
const SITE_ORIGIN='https://slopestohope.org';
const imageExt=/\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const excludedImage=/\/wp-content\/uploads\/2023\/04\/cropped-cropped-kalen-|\/wp-content\/uploads\/2025\/06\/cropped-Drew-1|\/assets\/candid-|\/wp-content\/uploads\/2025\/06\/Logo-Final-/i;
function xmlEscape(value){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&apos;");}
function bestImageUrl(img,documentUrl){
  const parentHref=img.closest('a[href]')?.getAttribute('href');
  if(parentHref){
    const linked=new URL(parentHref,documentUrl);
    if(linked.origin===SITE_ORIGIN&&imageExt.test(linked.pathname))return linked.href;
  }
  const srcset=(img.getAttribute('srcset')||'').split(',').map(item=>item.trim()).filter(Boolean).map(item=>{
    const parts=item.split(/\s+/),url=parts[0],descriptor=parts[1]||'';
    return {url,score:/w$/.test(descriptor)?Number.parseInt(descriptor,10)||0:0};
  }).sort((a,b)=>b.score-a.score);
  const candidate=srcset[0]?.url||img.getAttribute('src');
  if(!candidate)return null;
  const resolved=new URL(candidate,documentUrl);
  return resolved.origin===SITE_ORIGIN&&imageExt.test(resolved.pathname)?resolved.href:null;
}
async function imagesForRoute(route){
  const file=resolve(out,'.'+route.path,'index.html');
  const documentUrl=SITE_ORIGIN+route.path;
  const document=new JSDOM(await readFile(file,'utf8'),{url:documentUrl,virtualConsole:new VirtualConsole()}).window.document;
  const images=new Set();
  for(const img of document.querySelectorAll('img[src]')){
    if(img.closest('header,.site-branding,.sth-candid,footer'))continue;
    const url=bestImageUrl(img,documentUrl);
    if(!url||excludedImage.test(new URL(url).pathname))continue;
    try{await access(resolve(out,'.'+new URL(url).pathname));}catch{continue;}
    images.add(url);
  }
  return [...images].slice(0,1000);
}
const sitemapEntries=[];
for(const route of routes){
  const images=await imagesForRoute(route);
  const imageXml=images.map(url=>`<image:image><image:loc>${xmlEscape(url)}</image:loc></image:image>`).join('');
  sitemapEntries.push(`<url><loc>${SITE_ORIGIN}${route.path}</loc>${imageXml}</url>`);
}
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+sitemapEntries.join('')+'</urlset>\n';
if((sitemap.match(/<loc>/g)||[]).length!==11||/slopestohope\.com/i.test(sitemap))throw new Error('Generated sitemap failed host or route-count validation');
if(/<image:(?:caption|geo_location|title|license)>/i.test(sitemap))throw new Error('Generated image sitemap contains deprecated image tags');
await writeFile(resolve(out,'sitemap.xml'),sitemap);
const robots='User-agent: *\nAllow: /\nDisallow: /cdn-cgi/\nSitemap: https://slopestohope.org/sitemap.xml\n';
if(!robots.includes('Sitemap: https://slopestohope.org/sitemap.xml')||/slopestohope\.com/i.test(robots))throw new Error('Generated robots.txt failed sitemap validation');
await writeFile(resolve(out,'robots.txt'),robots);
console.log(`Static export: ${routes.length} published routes, plus /staff/ compatibility redirect, in out/`);
