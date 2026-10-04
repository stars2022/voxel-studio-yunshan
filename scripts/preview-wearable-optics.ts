import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import path from 'node:path';
const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),out=latest.evidence,runtime=path.join(out,'optics-front-runtime'),url='http://127.0.0.1:4384',source='wearable-eyewear.ysvox.json',target='wearable-eyewear-material-front.png';
await mkdir(runtime,{recursive:true});await copyFile(path.join(out,source),path.join(runtime,'autosave.ysvox.json'));
const original=JSON.parse(await readFile(path.join(out,source),'utf8')),server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4384',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try{
 for(let i=0;i<180;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 const before=(await fetch(url+'/api/state').then(r=>r.json())).project;assert.deepEqual(before.assets,original.assets);assert.deepEqual(before.instances,original.instances);
 const response=await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'generate_previews',arguments:{appearance:'material',views:['front']}})}),preview=await response.json();assert.ok(response.ok,JSON.stringify(preview));assert.equal(preview.files.length,1);await copyFile(preview.files[0],path.join(out,target));
 const after=(await fetch(url+'/api/state').then(r=>r.json())).project;assert.deepEqual(after,before);
 await writeFile(path.join(out,'wearable-optics-front.json'),JSON.stringify({run:latest.run,status:'captured',source,target,method:'Actual generate_previews material/front on a separate server with the saved canonical eyewear scene; no document mutation',sourceSHA256:createHash('sha256').update(await readFile(path.join(out,source))).digest('hex'),canonicalUnchanged:true,preview},null,2));
 console.log(target);
}finally{const end=once(server,'exit');server.kill();await end;await writeFile(path.join(runtime,'server.log'),log);}
