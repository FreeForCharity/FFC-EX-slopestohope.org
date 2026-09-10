import { JSDOM, VirtualConsole } from 'jsdom';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

export const SOURCE = 'https://slopestohope.com';
export const ROOT = resolve('public');
const CACHE = resolve('.migration-cache/source');
const offline = process.argv.includes('--offline');
const report = { capturedAt: new Date().toISOString(), source: SOURCE, routes: [], assets: [], failures: [], adaptations: ['Hydrate LiteSpeed-delayed resources for static hosting.', 'Remove the LiteSpeed PHP guest probe and WordPress click-tracking POSTs.', 'Preserve original Elementor, theme, and accessibility runtimes; discover their dynamic assets in browser tests.'] };
const queue = new Set(), visited = new Set();
const sha = b => createHash('sha256').update(b).digest('hex');
export function within(root, path) {
  const file = resolve(root, decodeURIComponent(path).replace(/^[/\\]+/, ''));
  const rel = relative(root, file);
  if (!rel || rel.startsWith('..') || isAbsolute(rel) || rel.includes(':')) throw new Error(`Unsafe path: ${path}`);
  return file;
}
async function save(path, body) { await mkdir(dirname(path), {recursive:true}); await writeFile(path, body); }
export async function get(url) {
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const res = await fetch(url, {signal:AbortSignal.timeout(30000), headers:{'User-Agent':'SlopesToHopeMigration/1.0 (read-only public snapshot)'}});
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) { if(attempt===2) throw e; await new Promise(r=>setTimeout(r,1000)); }
  }
}
const localHost = u => ['slopestohope.com','www.slopestohope.com'].includes(u.hostname);
export function rewrite(text) {
  return text.replace(/https?:\/\/(?:www\.)?slopestohope\.com(?=[/"'\s<]|$)/g, '')
    .replace(/https?:\\\/\\\/(?:www\.)?slopestohope\.com/g, '')
    .replace(/https?%3A%2F%2F(?:www\.)?slopestohope\.com/gi, 'https%3A%2F%2Fslopestohope.org');
}
function assetUrl(value, base=SOURCE) {
  try { const u=new URL(value,base); if(localHost(u)&&/^\/wp-(content|includes)\//.test(u.pathname)&&!u.pathname.endsWith('/')&&u.pathname!=='/wp-content/uploads') return u; } catch {}
}
function enqueue(value,base) {const u=assetUrl(value,base); if(u) queue.add(u.pathname);}
export function scan(text, base=SOURCE) {
  // Decode Elementor's HTML-entity and JSON-escaped URL values before scanning.
  const decoded=text.replace(/\\\//g,'/').replace(/&(?:quot|apos|#0?3[49]|#x27);/g,'"').replace(/&amp;/g,'&');
  for(const m of decoded.matchAll(/(?:https?:\/\/(?:www\.)?slopestohope\.com)?\/wp-(?:content|includes)\/[^\s"'<>\\(){};,]+/g)) enqueue(m[0],base);
  if(/\.css(?:\?|$)/.test(base)) for(const m of decoded.matchAll(/(?:url\(\s*|@import\s*)["']?([^\s"')]+)["']?/g)) enqueue(m[1],base);
}
async function capture(url, path) {
  const dest=within(CACHE,path);
  if(offline) return readFile(dest);
  const bytes=await get(url); await save(dest,bytes); return bytes;
}
function dom(html,url) { return new JSDOM(html,{url,virtualConsole:new VirtualConsole()}); }
async function page(url) {
  const u=new URL(url), path=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;
  const raw=await capture(url,path);
  const doc=dom(raw.toString(),url).window.document;
  const links=[...doc.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim(),url:a.href}));
  const entry={path:u.pathname,title:doc.title,sourceSha256:sha(raw),navigation:[...doc.querySelectorAll('nav a[href]')].map(a=>({text:a.textContent.trim(),url:a.href})),links,forms:[...doc.querySelectorAll('form')].map(f=>({action:f.action,method:f.method,html:f.outerHTML})),embeds:[...doc.querySelectorAll('iframe,[data-form-id],.hbspt-form')].map(e=>e.outerHTML),scripts:[...doc.scripts].map(s=>({src:s.src||s.getAttribute('data-src')||'',id:s.id})),widgets:[...new Set([...doc.querySelectorAll('[data-widget_type]')].map(e=>e.getAttribute('data-widget_type')))],bodyText:doc.body.textContent.replace(/\s+/g,' ').trim().slice(0,100000)};
  // Remove script/style content from the plain-text baseline without modifying the live document.
  const textDoc=dom(raw.toString(),url).window.document; textDoc.querySelectorAll('script,style').forEach(e=>e.remove()); entry.bodyText=textDoc.body.textContent.replace(/\s+/g,' ').trim();
  report.routes.push(entry);
  for(const s of [...doc.scripts]) {
    if(/track-the-click/.test(s.id+' '+s.src) || /var litespeed_vary=|var litespeed_docref=|window\.litespeed_ui_events=|window\.lazyLoadOptions=/.test(s.textContent) || s.type==='speculationrules') {s.remove(); continue;}
    if(s.type==='litespeed/javascript') {s.type='text/javascript'; if(s.hasAttribute('data-src')){s.src=s.getAttribute('data-src');s.removeAttribute('data-src');}}
  }
  // LiteSpeed places its combined bundle (including jQuery) last. Run separate
  // jQuery-dependent plugin files after that bundle, while keeping config first.
  const combined=[...doc.scripts].findLast(s=>/\/litespeed\/js\//.test(s.src));
  if(combined){
    let after=combined;
    for(const s of [...doc.scripts].filter(s=>/\/plugins\/elementskit-lite\//.test(s.src))){after.after(s);after=s;}
  }
  // Native lazy loading retains all responsive image candidates without PHP/cache dependencies.
  for(const el of doc.querySelectorAll('img,iframe')) {
    for(const [from,to] of [['data-src','src'],['data-litespeed-src','src'],['data-srcset','srcset'],['data-sizes','sizes']]) if(el.hasAttribute(from)){el.setAttribute(to,el.getAttribute(from));el.removeAttribute(from);}
    el.removeAttribute('data-lazyloaded');
  }
  doc.querySelectorAll('link').forEach(e=>{if(/wp-json|xmlrpc\.php|\/feed\//.test(e.href))e.remove();});
  // This loader does not carry content. Clear it even if an external tag is slow.
  const fallback=doc.createElement('script'); fallback.textContent="document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.site-loader').forEach(function(e){e.classList.add('loaded');e.style.display='none';});});";doc.head.append(fallback);
  const normalized=doc.documentElement.outerHTML;
  scan(normalized,url);
  let html='<!DOCTYPE html>\n'+rewrite(normalized);
  // Absolute identity URLs must remain URLs, while navigation/assets are origin-relative.
  const final=dom(html,'https://slopestohope.org'+u.pathname).window.document;
  const compatCSS=final.createElement('link');compatCSS.rel='stylesheet';compatCSS.href='/assets/static-compat.css';final.head.append(compatCSS);
  const compatJS=final.createElement('script');compatJS.src='/assets/static-compat.js';final.body.append(compatJS);
  // Elementor also hides lightbox URLs inside base64 action settings. Plain
  // src/href rewriting cannot see them; decode, localize, and re-encode them.
  for(const el of final.querySelectorAll('[data-e-action-hash],a[href*="elementor-action"]'))for(const attr of ['data-e-action-hash','href']){
    const value=el.getAttribute(attr);if(!value?.includes('elementor-action'))continue;
    const decoded=decodeURIComponent(value.replace(/^#/,''));
    const converted=decoded.replace(/settings=([^&]+)/,(_m,b64)=>'settings='+Buffer.from(rewrite(Buffer.from(b64,'base64').toString())).toString('base64'));
    el.setAttribute(attr,'#'+encodeURIComponent(converted));
  }
  final.querySelectorAll('a[href=""]').forEach(a=>a.setAttribute('href','/'));
  final.querySelectorAll('link[rel="canonical"],meta[property="og:url"]').forEach(e=>e.setAttribute(e.tagName==='LINK'?'href':'content','https://slopestohope.org'+u.pathname));
  await save(within(ROOT,path),'<!DOCTYPE html>\n'+final.documentElement.outerHTML);
  console.log('Captured',u.pathname);
  return links;
}
export async function mirrorAsset(path) {
  const url=SOURCE+path;
  const bytes=await capture(url,path);
  const isText=/\.(?:css|js|svg|json|map)$/i.test(path);
  if(isText) scan(bytes.toString(),url);
  const body=isText?rewrite(bytes.toString()):bytes;
  await save(within(ROOT,path),body);
  return {path,bytes:bytes.length,sourceSha256:sha(bytes)};
}
async function main(){
  await mkdir('migration',{recursive:true});
  const sitemap=await capture(SOURCE+'/wp-sitemap.xml','wp-sitemap.xml');
  report.capturedAt=(await stat(within(CACHE,'wp-sitemap.xml'))).mtime.toISOString();
  const children=[...sitemap.toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  const urls=new Set();
  for(const child of children){const xml=await capture(child,new URL(child).pathname);for(const m of xml.toString().matchAll(/<loc>(.*?)<\/loc>/g)) urls.add(m[1]);}
  for(const url of urls){
    try{const links=await page(url);for(const link of links){try{const u=new URL(link.url); if(localHost(u)&&!u.search&&!/^\/wp-|\/feed\//.test(u.pathname)&&!(/\.[a-z0-9]+$/i.test(u.pathname)))urls.add(SOURCE+u.pathname);}catch{}}}
    catch(e){report.failures.push({url,error:offline&&e.code==='ENOENT'?'Not present in source capture; verify HTTP status in migration report':e.message});console.log(e.message);}
    if(urls.size>100)throw new Error('Unexpected route count; inspect inventory before continuing');
  }
  while(queue.size){const batch=[...queue].filter(p=>!visited.has(p)).slice(0,4);if(!batch.length)break;
    batch.forEach(p=>{queue.delete(p);visited.add(p);});
    await Promise.all(batch.map(async p=>{try{report.assets.push(await mirrorAsset(p));}catch(e){report.failures.push({url:SOURCE+p,error:e.message});}}));
    if(visited.size%40===0)console.log('Assets',visited.size);
  }
  await save(resolve('migration/inventory.json'),JSON.stringify(report,null,2)+'\n');
  await save(resolve('public/.nojekyll'),'');
  await save(resolve('public/staff/index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><title>Team – Slopes to Hope</title><meta http-equiv="refresh" content="0;url=/team/"><link rel="canonical" href="https://slopestohope.org/team/"><a href="/team/">Team</a></html>');
  console.log(JSON.stringify({routes:report.routes.length,assets:report.assets.length,failures:report.failures},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/migrate.mjs')) await main();
