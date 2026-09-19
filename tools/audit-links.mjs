import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
const document=new JSDOM(await readFile('public/partners/index.html','utf8'),{virtualConsole:new VirtualConsole()}).window.document;
const urls=[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(url=>/^https?:/.test(url)))];
const results=[];
let next=0;
await Promise.all(Array.from({length:5},async()=>{
  while(next<urls.length){
    const url=urls[next++];
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Mozilla/5.0 (compatible; SlopesToHopeLinkAudit/1.0)'}});
      const body=await response.text();
      results.push({url,finalUrl:response.url,status:response.status,title:body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]||'',classification:response.ok?'reachable':[401,403,429].includes(response.status)?'access-limited':'needs-review'});
    }catch(error){results.push({url,error:error.message,classification:'unverified'});}
  }
}));
results.sort((a,b)=>a.url.localeCompare(b.url));
await mkdir('migration/closeout',{recursive:true});
await writeFile('migration/closeout/partner-links.json',JSON.stringify({testedAt:new Date().toISOString(),method:'GET only; no forms or payments submitted',results},null,2)+'\n');
console.log(JSON.stringify({total:results.length,findings:results.filter(r=>r.classification!=='reachable')},null,2));
