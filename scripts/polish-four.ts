import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {atelierFinishCommands} from '../src/core/atelier-finish';
import {generateTemplate} from '../src/core/templates';
import {Grid} from '../src/core/grid';
import {gridComponents} from '../src/core/checks';
import {meshAsset} from '../src/core/mesh';
import {exportProject} from '../src/export/exporter';
import {loadMesh} from '../src/import/converter';
import type {Project,Command} from '../src/core/types';

const root=path.resolve('artifacts/polish'),runtime=path.join(root,'runtime'),url='http://127.0.0.1:4339';
const kinds=['bay','railing','planter','lantern'];
const names=['开间 · 错缝石作与榫托','栏杆 · 柱帽、退面与插接','花槽 · 薄叶、分枝与花序','灯笼 · 挂环、回纹与薄罩'];
const dimensions:Record<string,Record<string,number>>={bay:{width:3.6,height:3.2,depth:.8,openingWidth:1.24,openingHeight:2.24},planter:{width:1.2,height:1,depth:.6,detail:3}};
export const polishSpecs=kinds.map((k,i)=>({id:'study-'+k,name:'精修 · '+names[i],type:'atelier-'+k,pitch:k==='bay'?.02:.01,params:dimensions[k]??{}}));
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
await mkdir(runtime,{recursive:true});
const p=newProject();p.name='云山 · 四构件几何与材质精修';
const engine=new Engine(p);engine.execute({expectedVersion:0,requestId:crypto.randomUUID(),commands:atelierFinishCommands()});
const report:any={startedAt:new Date().toISOString(),scope:'4 existing masters refined; not new library asset count',environment:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0].model,memoryBytes:os.totalmem(),node:process.version},assets:[],screenshots:[],errors:[]};
for(const spec of polishSpecs){
 const t=performance.now(),a=generateTemplate(spec.id,spec.name,spec.type,spec.params,spec.pitch,engine.project.styles['atelier-finish'],'atelier-finish'),generationMs=performance.now()-t,g=new Grid(a.chunks),components=gridComponents(g);
 assert.deepEqual(components,[g.count],spec.id+' must have no detached cells');
 const mt=performance.now(),buckets=meshAsset(a,engine.project.materials),meshingMs=performance.now()-mt;
 engine.project.assets[a.id]=a;report.assets.push({id:a.id,name:a.name,pitchM:a.cellSize,voxels:g.count,boundsCells:g.bounds(),components:components.length,generationMs,meshingMs,quads:buckets.reduce((sum,b)=>sum+b.quads,0),geometrySHA256:hash(a.chunks)});
 console.log(a.id+': '+g.count+' cells, '+components.length+' component');
}
engine.project.selection={assetId:'study-planter',region:null,partId:null};validateProject(engine.project);
await writeFile(path.join(runtime,'autosave.ysvox.json'),JSON.stringify(engine.project));
// Isolated preview: no history from earlier iterations is reloaded over the fresh document.
const {rm}=await import('node:fs/promises');await rm(path.join(runtime,'session.json'),{force:true});
await writeFile('projects/four-components-polished.ysvox.json',JSON.stringify(engine.project));
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{cwd:process.cwd(),env:{...process.env,VOXEL_PORT:'4339',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 for(let i=0;i<100;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});report.environment.browser=browser.version();
 const page=await browser.newPage({viewport:{width:1250,height:1100},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'/?preview=1&asset=study-planter&view=perspective&flat=1');
 await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});
 report.environment.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});
 await page.locator('#toast').waitFor({state:'hidden',timeout:15000});
 for(const k of kinds){
  await page.evaluate(async id=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.view('perspective');v.ao(false);v.bloom(false);v.practicals(false);},'study-'+k);
  await page.waitForFunction(()=>!!(window as any).voxelStudio.ready,null,{timeout:120000});
  for(const mode of['flat','material']){
   await page.evaluate(flat=>(window as any).voxelStudio.clay(flat),mode==='flat');await page.waitForTimeout(350);
   const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.deepEqual(perf.assetIds,['study-'+k]);assert.ok(perf.triangles>0);
   const filename=mode+'-'+k+'.png';await page.locator('#viewport').screenshot({path:path.join(root,filename)});report.screenshots.push({file:filename,mode,...perf});
  }
  const regionM:Record<string,{min:number[];max:number[]}>= {
   bay:{min:[0,.42,.04],max:[1.12,1.88,.72]},
   railing:{min:[-.02,.35,-.02],max:[.62,.97,.21]},
   planter:{min:[.28,.35,-.02],max:[.94,.87,.58]},
   lantern:{min:[.01,.4,0],max:[.23,.72,.27]}
  };
  const a=engine.project.assets['study-'+k],r=regionM[k],region={min:r.min.map(n=>Math.floor(n/a.cellSize)),max:r.max.map(n=>Math.ceil(n/a.cellSize))};
  for(const mode of['flat','material']){
   await page.evaluate(({region,flat})=>{const v=(window as any).voxelStudio;v.view('perspective');v.focus(region);v.clay(flat);},{region,flat:mode==='flat'});await page.waitForTimeout(150);
   await page.locator('#viewport').screenshot({path:path.join(root,mode+'-detail-'+k+'.png')});
  }
  await page.evaluate(()=>{const v=(window as any).voxelStudio;v.clay(true);v.view('back');});await page.waitForTimeout(150);
  await page.locator('#viewport').screenshot({path:path.join(root,'back-'+k+'.png')});
 }
 await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('asset','study-lantern');v.view('perspective');v.clay(true);v.clip(.34);});await page.waitForTimeout(150);await page.locator('#viewport').screenshot({path:path.join(root,'lantern-section.png')});
 const now=await fetch(url+'/api/state').then(r=>r.json());assert.equal(hash(now.project),hash(engine.project),'preview leaves authoritative document unchanged');
 for(const mode of['flat','material']){
  const figures=kinds.map((k,i)=>`<figure><img src="${mode}-${k}.png"><figcaption><b>0${i+1} ${names[i]}</b><small>${report.assets[i].pitchM*100} cm 格距 · ${report.assets[i].voxels.toLocaleString()} 个可编辑体素</small></figcaption></figure>`).join('');
  const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#cacaca;color:#293630;font:16px system-ui,'PingFang SC',sans-serif}header{padding:24px 30px;height:112px}h1{margin:0 0 10px;font-size:28px}p{margin:0;font-size:16px}.grid{display:grid;grid-template-columns:1fr 1fr}figure{margin:0;border:1px solid #b5b9b6}img{display:block;width:100%;height:640px;object-fit:contain}figcaption{padding:16px 26px;border-top:1px solid #b5b9b6}small{display:block;margin-top:7px;color:#4d5a54}</style><header><h1>云山 · 四构件 / ${mode==='flat'?'纯色几何检查':'材质检查'}</h1><p>${mode==='flat'?'基础色与固定面明暗；关闭纹理、反射、透明、发光、场景灯光、阴影与后期':'同一份原生体素；石材、木纹、金属、透明玻璃与绢纸灯罩；固定摄影棚，关闭 AO / 泛光 / 局部灯光'}</p></header><div class="grid">${figures}</div>`;
  const file=path.join(root,mode+'-overview.html');await writeFile(file,html);const sheet=await browser.newPage({viewport:{width:1700,height:1500}});await sheet.goto(pathToFileURL(file).href);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:path.join(root,mode+'-overview.png'),fullPage:true});await sheet.close();
 }
 if(!process.argv.includes('--quick')){
  report.exports=[];
  for(const {id,pitch}of polishSpecs){
   const out=await exportProject(engine.project,path.resolve('projects/exports/polish-'+id.slice(6)),id);
   const imported=await loadMesh({filename:'visual.glb',data:(await readFile(path.join(out.directory,'visual.glb'))).toString('base64')}),b=new Grid(engine.project.assets[id].chunks).bounds()!;
   for(const edge of['min','max'] as const)for(let d=0;d<3;d++)assert.ok(Math.abs(imported.bounds[edge][d]-b[edge][d]*pitch)<1e-6);
   report.exports.push({...out,reimportBoundsM:imported.bounds});
  }
 }
 assert.deepEqual(report.errors,[]);report.finishedAt=new Date().toISOString();await writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2));console.log('Captured actual flat + material previews of all four assets.');
}finally{await browser?.close();server.kill('SIGTERM');await writeFile(path.join(root,'server.log'),log);}
