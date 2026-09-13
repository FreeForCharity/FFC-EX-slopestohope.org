import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { within } from './migrate.mjs';
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain','.mp4':'video/mp4'};
export async function serve(root=resolve('public'),port=0){
  const server=createServer(async(req,res)=>{
    try{
      if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405).end();return;}
      let path=new URL(req.url,'http://localhost').pathname;
      let file=within(root,path==='/'?'/index.html':path);
      if((await stat(file)).isDirectory()){if(!path.endsWith('/')){res.writeHead(301,{Location:path+'/'}).end();return;}file=within(root,path+'index.html');}
      const body=await readFile(file); res.writeHead(200,{'Content-Type':MIME[extname(file)]||'application/octet-stream','X-Robots-Tag':'noindex, nofollow'});res.end(req.method==='HEAD'?undefined:body);
    }catch{res.writeHead(404).end('Not found');}
  });
  await new Promise(r=>server.listen(port,'127.0.0.1',r)); return server;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('tools/serve.mjs')){const s=await serve(resolve(process.argv[2]||'public'),Number(process.argv[3]||4173));console.log(`Preview: http://127.0.0.1:${s.address().port}`);}
