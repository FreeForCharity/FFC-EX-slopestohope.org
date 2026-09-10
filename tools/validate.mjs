import {JSDOM,VirtualConsole} from 'jsdom';
import {readFile,access,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {within} from './migrate.mjs';
const inventory=JSON.parse(await readFile('migration/inventory.json'));
const root=resolve(process.env.SITE_ROOT||'public'),issues=[],knownBroken=new Set(['/open-positions/','/donations/slopes-to-hope']);
const routes=new Set(inventory.routes.map(r=>r.path));routes.add('/staff/');
const normalize=s=>s.replace(/\s+/g,' ').trim();
for(const r of inventory.routes){
 const html=await readFile(within(root,r.path+'index.html'),'utf8');
 const d=new JSDOM(html,{url:'https://slopestohope.org'+r.path,virtualConsole:new VirtualConsole()}).window.document;
 if(d.title!==r.title)issues.push({path:r.path,error:'Title changed'});
 const text=d.cloneNode(true);text.querySelectorAll('script,style').forEach(e=>e.remove());
 if(normalize(text.body.textContent)!==r.bodyText)issues.push({path:r.path,error:'Source wording changed'});
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
  if(![...d.querySelectorAll('a[href]')].some(a=>a.href===l.url))issues.push({path:r.path,error:'External destination changed',url:l.url});
 }
}
const output={testedAt:new Date().toISOString(),routes:inventory.routes.length,issues,knownSourceBrokenLinks:[...knownBroken]};
await writeFile('migration/static-validation.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));if(issues.length)process.exitCode=1;
