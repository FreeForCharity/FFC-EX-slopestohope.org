import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {FAVICON_PATHS,applyFaviconLinks} from './favicon-policy.mjs';

test('favicon policy replaces legacy tags without altering other content',()=>{
 const input='<html><head><title>New page</title><link rel="icon" href="/old.png"><link rel="apple-touch-icon" href="/oldapple.png"></head><body>Keep me</body></html>';
 const output=applyFaviconLinks(input);
 assert(!output.includes('/old.png')&&!output.includes('/oldapple.png'));
 assert(output.includes('<title>New page</title>'));
 assert(output.includes('<body>Keep me</body>'));
 for(const path of Object.values(FAVICON_PATHS))assert(output.includes('href="'+path+'"'));
 assert.equal(applyFaviconLinks(output),output);
 assert.throws(()=>applyFaviconLinks('<body>No head</body>'),/head/);
});

test('existing brand artwork is present and ICO is a real multi-image icon',async()=>{
 const files=['public/favicon.ico',...Object.values(FAVICON_PATHS).filter(x=>x.endsWith('.png')).map(x=>'public'+x)];
 for(const file of files)assert((await readFile(file)).length>100,file);
 const icon=await readFile('public/favicon.ico');
 assert.equal(icon.readUInt16LE(0),0);
 assert.equal(icon.readUInt16LE(2),1);
 assert.equal(icon.readUInt16LE(4),2);
 assert.equal(icon[6],32);
 assert.equal(icon[22],192);
});

test('every current published HTML source can receive the shared favicon',async()=>{
 async function visit(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const path=dir+'/'+entry.name;
   if(entry.isDirectory())await visit(path);
   else if(entry.name.endsWith('.html')){
    const html=await readFile(path,'utf8');
    if(!/<head\b[^>]*>/i.test(html))continue; // Legacy HTML fragments are not standalone pages.
    const updated=applyFaviconLinks(html);
    for(const icon of Object.values(FAVICON_PATHS))assert(updated.includes('href="'+icon+'"'),path);
    assert.equal((updated.match(/rel="icon"/g)||[]).length,2,path);
   }
  }
 }
 await visit('public');
});
