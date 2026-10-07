import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {validationBrowserOptions} from '../../scripts/browser-options';
import {Engine} from '../../src/core/engine';
import {catalogVariantFinishCommands as legacyVariantFinishCommands} from './catalog-variant-finish';
const root='work/environment-furniture',runtime=root+'/diagnostic-shadow-state-preview-runtime',url='http://127.0.0.1:4411',targets=JSON.parse(await readFile(root+'/preview-cases.json','utf8')).filter((r:any)=>!process.env.PREVIEW_IDS||process.env.PREVIEW_IDS.split(',').includes(r.id)).map((r:any)=>r.key).filter((key:string)=>key.includes('finaldraft-01-'));
await mkdir(runtime,{recursive:true});
for(const key of targets){const p=JSON.parse(await readFile(root+'/'+key+'.ysvox.json','utf8')),e=new Engine(p),request={expectedVersion:p.version,requestId:crypto.randomUUID(),commands:legacyVariantFinishCommands(p)},dry=e.execute({...request,dryRun:true});e.execute({...request,previewToken:dry.previewToken});await writeFile(runtime+'/'+key+'.ysvox.json',JSON.stringify(e.project));}
await writeFile(runtime+'/autosave.ysvox.json',await readFile(runtime+'/'+targets[0]+'.ysvox.json'));
let server:ChildProcess|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,log='';const report:any={status:'running-draft-preview',views:[],errors:[]};
try{
 server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4411',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});server.stdout!.on('data',d=>log+=d);server.stderr!.on('data',d=>log+=d);
 let ready=false;for(let i=0;i<180;i++){try{if((await fetch(url+'/api/state')).ok){ready=true;break;}}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
 browser=await chromium.launch(validationBrowserOptions());report.browser=browser.version();const page=await browser.newPage({viewport:{width:1400,height:1000}});page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url+'/?flat=1&view=isometric');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready);
 for(const key of targets){
  const state=await fetch(url+'/api/state').then(r=>r.json()),loaded=await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'load_project',arguments:{filename:key+'.ysvox.json',expectedVersion:state.project.version}})}).then(r=>r.json());await page.waitForFunction(v=>(window as any).voxelStudio.performance.renderedVersion===v,loaded.version);
  for(const view of['front','material']){
   await page.evaluate(async view=>{const {Viewer}=await import('/src/client/viewer.ts' as string),proto=Viewer.prototype as any;if(!proto.diagnosticShadowState){const original=proto.setStudio;proto.setStudio=function(flag:boolean){original.call(this,flag);for(const m of this.materials.values())m.needsUpdate=true;};proto.diagnosticShadowState=true;}const v=(window as any).voxelStudio;await v.mode('scene');v.view(view==='material'?'isometric':view);v.clay(false);v.studio(false);v.referenceLighting(true);v.ao(false);v.bloom(false);},view);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(perf.meshError,null);const clip=await page.locator('#viewport').boundingBox();assert.ok(clip);const file='diagnostic-shadow-state-'+key+'-'+view+'.png';await page.screenshot({path:root+'/'+file,clip});report.views.push({key,file,view,triangles:perf.triangles,sha256:createHash('sha256').update(await readFile(root+'/'+file)).digest('hex')});
  }
 }
 assert.deepEqual(report.errors,[]);report.status='captured-draft-preview';
}finally{await browser?.close();if(server&&server.exitCode===null){const closed=once(server,'exit');server.kill();await closed;}await writeFile(root+'/diagnostic-shadow-state-preview-server.txt',log);await writeFile(root+'/diagnostic-shadow-state-preview.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify({status:report.status,views:report.views.length}));
