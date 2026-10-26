import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {serve} from './serve.mjs';
const root=resolve('.migration-cache/rollback-baseline');
const out=resolve(root,'out'),source=resolve(root,'public');
const routes=['/','/contact-us/','/our-story/','/faq/','/donors/','/team/','/gallery/','/partners/','/coosummit26/','/privacy-policy/','/terms-of-service/'];
const server=await serve(out);
const base='http://127.0.0.1:'+server.address().port;
const checks=[];
try{
  for(const route of routes){const r=await fetch(base+route);assert.equal(r.status,200);checks.push({route,status:r.status});}
  const redirect=await fetch(base+'/coosummit26?utm_source=coosummit26&utm_medium=qr',{redirect:'manual'});
  assert.equal(redirect.status,301);
  assert.equal(redirect.headers.get('location'),'/coosummit26/?utm_source=coosummit26&utm_medium=qr');
  const staff=await(await fetch(base+'/staff/')).text();
  assert.match(staff,/url=\/team\//i);
  assert.equal((await fetch(base+'/not-a-real-page/')).status,404);
  for(const [file,id] of [['index.html','9a181260-20a9-408c-8591-cca3093d7e3f'],['contact-us/index.html','f35f941a-7978-41cc-aabc-4dc669ac9a0a'],['coosummit26/index.html','05a4b6fe-6b23-433e-bf08-e667071c8d3b']]){
    assert.ok((await readFile(resolve(out,file),'utf8')).includes(id));
  }
  assert.equal((await readFile(resolve(out,'CNAME'),'utf8')).trim(),'slopestohope.org');
  let filesVerified=0;
  const hashes=[];
  async function verify(dir){
    for(const entry of await readdir(dir,{withFileTypes:true})){
      const file=resolve(dir,entry.name);
      if(entry.isDirectory()){await verify(file);continue;}
      const path=relative(source,file);
      const expected=await readFile(file),actual=await readFile(resolve(out,path));
      assert.ok(expected.equals(actual),'Export differs from baseline source: '+path);
      filesVerified++;
      if(path.endsWith('.html'))hashes.push({path:path.replaceAll('\\','/'),sha256:createHash('sha256').update(actual).digest('hex')});
    }
  }
  await verify(source);
  const report={testedAt:new Date().toISOString(),revision:'81958410772660513037e0b55b53863a6508af7c',method:'Local archived revision rebuild and read-only HTTP checks; no production restore',checks,filesVerified,queryPreservation:true,staffBrowserRedirect:true,unknownRoute404:true,threeFormIdsPresent:true,hashes,productionRestoreTested:false,privateBackupsVerified:false};
  await writeFile('migration/closeout/rollback-verification.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({routes:checks.length,filesVerified,passed:true}));
}finally{server.close();}
