import {mkdir,readFile,writeFile,copyFile,cp} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const phase=process.argv.find(s=>s.startsWith('--phase='))?.slice(8)??'after';assert.ok(['before','ao-fixed','after'].includes(phase));
const index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),entry=index.entries.find((r:any)=>r.id==='LIFE-114'),out=path.resolve('artifacts/microscope-study'),runtime=path.join(out,'runtime-'+phase),url='http://127.0.0.1:4347';
const baseline=phase==='ao-fixed'?JSON.parse(await readFile(path.join(out,'before.json'),'utf8')):null,source=baseline?path.join(out,'before.ysvox.json'):path.join('projects',entry.file),expectedHash=baseline?.geometrySHA256??entry.sha256;
await mkdir(runtime,{recursive:true});await copyFile(source,path.join(runtime,'autosave.ysvox.json'));await copyFile(source,path.join(out,phase+'.ysvox.json'));
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4347',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const result:any={phase,run:index.run,file:entry.file,images:[],errors:[],geometrySHA256:expectedHash,status:'running'};
try{
 for(let i=0;i<180;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});result.browser=browser.version();const page=await browser.newPage({viewport:{width:1100,height:1000}});page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto(url+'/?preview=1&flat=1&view=isometric');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});
 const state=()=>fetch(url+'/api/state').then(r=>r.json()),s=await state(),res=await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'edit_transaction',arguments:{expectedVersion:s.project.version,requestId:crypto.randomUUID(),commands:[{op:'palette',name:'参考材质试作'}]}})}),applied=await res.json();assert.ok(res.ok,JSON.stringify(applied));await page.waitForFunction(v=>(window as any).voxelStudio.performance.renderedVersion===v,applied.version,{timeout:120000});
 await page.evaluate(async id=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.studio(true);v.referenceLighting(true);v.practicals(false);v.view('isometric');},entry.assetId);
 for(const [name,flat,ao,bloom] of [['flat',true,false,false],['material',false,false,false],['material-ao',false,true,false],['material-glow',false,true,true]] as const){
  await page.evaluate(([f,a,b])=>{const v=(window as any).voxelStudio;v.clay(f);v.ao(a);v.bloom(b);},[flat,ao,bloom]);
  const pixels=await page.evaluate(()=>new Promise<number[][]>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{const c=document.querySelector('#viewport canvas') as HTMLCanvasElement,gl=c.getContext('webgl2')!,samples:number[][]=[];for(const [x,y]of[[10,10],[c.width-10,10],[10,c.height-10]]){const p=new Uint8Array(4);gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);samples.push([...p]);}resolve(samples);}))))
  const file=phase+'-'+name+'.png';await page.locator('#viewport').screenshot({path:path.join(out,file)});result.images.push({name,file,framebufferSamples:pixels});if(phase!=='before')assert.ok(pixels.every(p=>p[3]===255),'AO must preserve the opaque frame alpha: '+name);
 }
 const p=(await state()).project;result.materials=Object.values(p.materials);result.roles=p.styles.yunshan;result.nativeGeometrySHA256=createHash('sha256').update(JSON.stringify(p.assets[entry.assetId].chunks)).digest('hex');assert.equal(result.nativeGeometrySHA256,expectedHash);assert.deepEqual(result.errors,[]);
 if(phase==='after'){
  await writeFile(path.join(out,'after-material.ysvox.json'),JSON.stringify(p));
  const response=await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'export_project',arguments:{name:'microscope-material-'+Date.now(),assetId:entry.assetId}})}),exported=await response.json();assert.ok(response.ok,JSON.stringify(exported));await cp(exported.directory,path.join(out,'after-material-export'),{recursive:true});result.export=exported.files;
 }result.status='passed';
 await writeFile(path.join(out,phase+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({phase,status:result.status,images:result.images}));
}catch(error){result.status='failed';result.errors.push(String(error));throw error;}finally{await writeFile(path.join(out,phase+'.json'),JSON.stringify(result,null,2));await browser?.close();server.kill('SIGTERM');await writeFile(path.join(out,phase+'-server.log'),log);}
