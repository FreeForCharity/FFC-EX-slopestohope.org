import {readFileSync} from 'node:fs';
import {verifyPublishedHomepage} from './verify-published-homepage.mjs';
export function expectedFigures(html) {
  const life=[...html.matchAll(/<b>([\d,]+) pounds<\/b> - Collected and Redistributed/g)];
  const fy=[...html.matchAll(/Goal:<br>([\d,]+)\/20,000/g)];
  const progress=[...html.matchAll(/class="eael-progressbar eael-progressbar-circle"[^>]*data-count="([\d.]+)"(?:(?!class="eael-progressbar eael-progressbar-circle").){0,2500}?Goal:<br>[\d,]+\/20,000/gs)];
  if(life.length!==1||fy.length!==1||progress.length!==1)throw new Error('Ambiguous expected homepage');
  return {fy27:fy[0][1],lifetime:life[0][1],percent:progress[0][1]};
}
export function comparePublished(expected,actual) {
  const got=expectedFigures(actual);
  if(Object.keys(expected).some(key=>expected[key]!==got[key]))throw new Error('Published collection figures do not match the deployed commit');
  return got;
}
export async function verifyLive({url='https://slopestohope.org/',expected,fetchImpl=fetch,attempts=36,delay=5000}={}) {
  const target=new URL(url);
  if(target.protocol!=='https:'||!['slopestohope.org','freeforcharity.github.io'].includes(target.hostname))throw new Error('Unapproved verification URL');
  for(let i=0;i<attempts;i++){
    try {
      target.searchParams.set('sth-verify',String(Date.now()));
      const result=await fetchImpl(target,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(10000)});
      if(!result.ok)throw new Error('Live homepage HTTP failure');
      return comparePublished(expected,await result.text());
    }catch{if(i===attempts-1)throw new Error('Live homepage verification failed: deployment, HTTP, layout, or numerical mismatch');}
    await new Promise(resolve=>setTimeout(resolve,delay));
  }
}
if(process.argv[1]?.endsWith('verify-live-impact.mjs')) {
  const expected=expectedFigures(readFileSync('public/index.html','utf8'));
  verifyLive({url:process.env.DEPLOY_URL||'https://slopestohope.org/',expected})
    .then(result=>console.log(JSON.stringify({verified:true,...result})))
    .catch(error=>{console.error(error.message);process.exitCode=1;});
}
