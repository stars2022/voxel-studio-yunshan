import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {newProject} from '../src/core/materials';
import {validateProject} from '../src/core/engine';
import {generateTemplate} from '../src/core/templates';
import {Grid} from '../src/core/grid';
import {gridComponents} from '../src/core/checks';
import {meshAsset} from '../src/core/mesh';
import {exportProject} from '../src/export/exporter';
import {loadMesh} from '../src/import/converter';
import type {Project,Command} from '../src/core/types';

const root=path.resolve('artifacts/geometry-study'),runtime=path.join(root,'runtime'),url='http://127.0.0.1:4337';
const kinds=['bay','railing','planter','lantern'],names=['开间 · 饰牌与五金','栏杆 · 截面与插接','花槽 · 口沿与分簇植物','灯笼 · 薄罩与墙座'];
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const snapshot:Project=JSON.parse(await readFile(path.join(root,'before-state.json'),'utf8')).project;
const commands:Command[]=kinds.map((k,i)=>({op:'createAsset',id:'study-'+k,name:'研究版 · '+names[i],template:'atelier-'+k,params:snapshot.assets['atelier-'+k].template!.params,style:'atelier',cellSize:.02}));
async function connect(endpoint:string){
 const client=new Client({name:'geometry-study',version:'2'});
 await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],cwd:process.cwd(),env:{...process.env as Record<string,string>,VOXEL_URL:endpoint},stderr:'pipe'}));
 const call=async(name:string,args:any={})=>{const raw:any=await client.callTool({name,arguments:args});const data=JSON.parse(raw.content[0].text);if(raw.isError)throw new Error(JSON.stringify(data));return data;};
 return{client,call};
}
if(process.argv.includes('--install')){
 const {client,call}=await connect('http://127.0.0.1:4317');
 try{
  const before=await fetch('http://127.0.0.1:4317/api/state').then(r=>r.json());
  for(const k of kinds)assert.ok(!before.project.assets['study-'+k],'研究版 ID 已存在，拒绝覆盖');
  const backup=await call('save_project',{filename:'before-geometry-study-'+Date.now()+'.ysvox.json'});
  const envelope={expectedVersion:before.project.version,requestId:crypto.randomUUID(),label:'添加四个几何研究母版 · 原资产与实例保持不变',commands};
  const dry=await call('edit_transaction',{...envelope,dryRun:true});assert.deepEqual(dry.affectedInstances,[]);
  const result=await call('edit_transaction',{...envelope,previewToken:dry.previewToken});
  const after=await fetch('http://127.0.0.1:4317/api/state').then(r=>r.json());assert.equal(after.project.version,result.version);
  for(const [id,a] of Object.entries(before.project.assets))assert.equal(hash(after.project.assets[id]),hash(a),id);
  for(const key of['materials','styles','instances','assemblies','selection'])assert.deepEqual(after.project[key],before.project[key]);
  for(const k of kinds){const a=after.project.assets['study-'+k];assert.equal(a.source.generatorRevision,2);assert.equal(hash(a.chunks),hash(generateTemplate(a.id,a.name,a.template.type,a.template.params,a.cellSize,after.project.styles.atelier,'atelier').chunks));}
  const saved=await call('save_project',{filename:'geometry-study-with-house.ysvox.json'});
  await writeFile(path.join(root,'installed.json'),JSON.stringify({backup,result,saved,existingAssetsPreserved:true,materialsPreserved:true,instancesPreserved:true,history:after.history},null,2));
  console.log(JSON.stringify({version:result.version,added:result.affectedAssets,backup,saved},null,2));
 }finally{await client.close();}
 process.exit(0);
}

await mkdir(runtime,{recursive:true});
const p:Project={...newProject(),name:'云山 · 同格距几何对照',materials:snapshot.materials,styles:snapshot.styles,assets:{},instances:{},assemblies:{}};
for(const k of kinds)p.assets['atelier-'+k]=snapshot.assets['atelier-'+k];
validateProject(p);await writeFile(path.join(runtime,'autosave.ysvox.json'),JSON.stringify(p));
const report:any={startedAt:new Date().toISOString(),sourceVersion:snapshot.version,pitchM:.02,scope:'Actual voxel geometry, same base colours and display; no textures or scene illumination',environment:{platform:os.platform(),release:os.release(),arch:os.arch(),cpu:os.cpus()[0].model,logicalCPUs:os.cpus().length,memoryBytes:os.totalmem(),node:process.version},assets:[],checks:[],errors:[]};
for(const c of commands){
 const old=snapshot.assets['atelier-'+c.id.slice(6)],t=performance.now(),a=generateTemplate(c.id,c.name,c.template,c.params,.02,p.styles.atelier,'atelier'),generationMs=performance.now()-t;
 const g=new Grid(a.chunks),oldGrid=new Grid(old.chunks),mt=performance.now(),mesh=meshAsset(a,p.materials),meshingMs=performance.now()-mt;
 const oldComponents=gridComponents(oldGrid),newComponents=gridComponents(g);assert.deepEqual(newComponents,[g.count]);
 report.assets.push({id:a.id,name:a.name,cellSizeM:a.cellSize,oldVoxels:oldGrid.count,newVoxels:g.count,oldComponentCount:oldComponents.length,newComponentCount:newComponents.length,oldLargestComponent:oldComponents[0],boundsCells:g.bounds(),parts:a.parts.map(p=>p.name),ports:a.ports,generationMs,meshingMs,quads:mesh.reduce((n,b)=>n+b.quads,0),geometrySHA256:hash(a.chunks)});
}
console.log('Generated four connected voxel assets; starting isolated MCP and browser checks.');
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{cwd:process.cwd(),env:{...process.env,VOXEL_PORT:'4337',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,client:Client|undefined;
try{
 for(let i=0;i<100;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 const connection=await connect(url);client=connection.client;const call=connection.call;
 browser=await chromium.launch({headless:true});report.environment.browser=browser.version();
 const page=await browser.newPage({viewport:{width:1250,height:1050}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'/?preview=1&asset=atelier-planter&view=perspective&flat=1');
 await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready&&(window as any).voxelStudio.clayEnabled,null,{timeout:120000});
 await page.locator('#toast').waitFor({state:'hidden',timeout:15000});
 report.environment.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER),version:gl.getParameter(gl.VERSION)};});
 const state=await call('read_project'),envelope={expectedVersion:state.version,requestId:crypto.randomUUID(),commands,label:'四构件几何研究'};
 const dry=await call('edit_transaction',{...envelope,dryRun:true});assert.equal((await call('read_project')).version,state.version);
 const committed=await call('edit_transaction',{...envelope,previewToken:dry.previewToken});
 await page.waitForFunction(v=>(window as any).voxelStudio.version===v,committed.version);
 assert.equal(await page.evaluate(()=>(window as any).voxelStudio.project.assets['study-planter'].source.generatorRevision),2);
 assert.equal((await call('edit_transaction',{...envelope,previewToken:dry.previewToken})).version,committed.version);
 const undo=await call('edit_transaction',{expectedVersion:committed.version,requestId:crypto.randomUUID(),commands:[{op:'undo'}]});
 await page.waitForFunction(v=>(window as any).voxelStudio.version===v,undo.version);
 assert.equal(await page.evaluate(()=>Object.keys((window as any).voxelStudio.project.assets).length),4);
  const redo=await call('edit_transaction',{expectedVersion:undo.version,requestId:crypto.randomUUID(),commands:[{op:'redo'}]});
  await page.waitForFunction(v=>(window as any).voxelStudio.version===v,redo.version);
  await page.evaluate(async()=>{const v=(window as any).voxelStudio;await Promise.all(['study-bay','atelier-planter','study-bay'].map(id=>v.mode('asset',id)));});
  await page.waitForFunction(()=>!!(window as any).voxelStudio.ready,null,{timeout:120000});
  assert.deepEqual(await page.evaluate(()=>(window as any).voxelStudio.performance.assetIds),['study-bay']);
  assert.equal(await page.evaluate(()=>(window as any).voxelStudio.performance.renderedVersion),redo.version);
 report.transaction={preview:{modifiedVoxels:dry.modifiedVoxels,affectedAssets:dry.affectedAssets},commit:committed.version,undo:undo.version,redo:redo.version};
 report.checks.push('真实 stdio MCP dry-run、原子提交、幂等重放；浏览器 WebSocket 同步','一次撤销移除整批四构件，重做恢复');
 const documentBefore=await fetch(url+'/api/state').then(r=>r.json());
 for(const k of kinds)for(const rev of['before','after']){
  const id=(rev==='before'?'atelier-':'study-')+k;
  await page.evaluate(async id=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.view('perspective');v.clay(true);},id);
  await page.waitForFunction(()=>(window as any).voxelStudio.ready,null,{timeout:120000});await page.waitForTimeout(250);
  assert.ok(await page.evaluate(()=>(window as any).voxelStudio.performance.objects>0),'ready must contain the selected asset meshes');
  assert.deepEqual(await page.evaluate(()=>(window as any).voxelStudio.performance.assetIds),[id]);
  assert.equal(await page.evaluate(()=>(window as any).voxelStudio.performance.renderedVersion),redo.version);
  await page.locator('#toast').waitFor({state:'hidden',timeout:15000});
  const shot=path.join(root,rev+'-'+k+'.png');await page.locator('#viewport').screenshot({path:shot});
  const pixels=await sharp(shot).extract({left:180,top:180,width:850,height:690}).removeAlpha().raw().toBuffer();
  let coloured=0;for(let i=0;i<pixels.length;i+=3)if(Math.abs(pixels[i]-202)+Math.abs(pixels[i+1]-202)+Math.abs(pixels[i+2]-202)>35)coloured++;
  assert.ok(coloured>12000,'actual centre pixels must contain geometry, not an empty viewport');
 }
 // The lantern's actual cut section proves the diffuser is a shell around empty space.
 await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('asset','study-lantern');v.view('perspective');v.clip(.32);});
 await page.waitForTimeout(200);await page.locator('#viewport').screenshot({path:path.join(root,'lantern-section.png')});
 await page.evaluate(()=>(window as any).voxelStudio.clip(Infinity));
 const documentAfter=await fetch(url+'/api/state').then(r=>r.json());assert.equal(hash(documentAfter.project),hash(documentBefore.project));
 report.checks.push('快速撤销/重做后，四构件均有合并网格与非空实际像素；素色预览与剖切不修改权威文档');
 const save=await call('save_project',{filename:'geometry-study.ysvox.json'}),saved:Project=JSON.parse(await readFile(save.path,'utf8'));
 validateProject(saved);assert.equal(hash(saved),hash(documentAfter.project));
 await writeFile('projects/geometry-study.ysvox.json',JSON.stringify(saved));
 const exported=await exportProject(saved,path.resolve('projects/exports/geometry-study-planter'),'study-planter');
 const imported=await loadMesh({filename:'visual.glb',data:(await readFile(path.join(exported.directory,'visual.glb'))).toString('base64')});
 const b=new Grid(saved.assets['study-planter'].chunks).bounds()!;
 for(const edge of['min','max'] as const)for(let d=0;d<3;d++)assert.ok(Math.abs(imported.bounds[edge][d]-b[edge][d]*.02)<1e-6);
 report.export={...exported,reimportBoundsM:imported.bounds};report.checks.push('原生保存无损读回；花槽 GLB 导出重导入尺寸坐标一致');
 for(const mode of['overview','comparison']){
  const figures=mode==='overview'?kinds.map((k,i)=>`<figure><img src="after-${k}.png"><figcaption>${names[i]}</figcaption></figure>`).join(''):kinds.map((k,i)=>['before','after'].map(rev=>`<figure><img src="${rev}-${k}.png"><figcaption>${rev==='before'?'原版':'研究版'} · ${names[i]}</figcaption></figure>`).join('')).join('');
  const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#cacaca;color:#26322c;font:17px system-ui,'PingFang SC',sans-serif}header{padding:22px 28px;height:100px}h1{margin:0 0 8px;font-size:26px}p{margin:0;font-size:15px}.grid{display:grid;grid-template-columns:1fr 1fr}figure{margin:0;border:1px solid #b5b9b6}img{display:block;width:100%;height:560px;object-fit:contain}figcaption{padding:13px 28px;border-top:1px solid #b5b9b6}</style><header><h1>云山 · 构件几何研究${mode==='comparison'?' / 修改前后':''}</h1><p>同为 2cm 原生体素 · 相同基础色 · 无纹理、反射、发光、透明、场景照明、阴影、AO、后期；固定面朝向明暗</p></header><div class="grid">${figures}</div></html>`;
  await writeFile(path.join(root,mode+'.html'),html);const sheet=await browser.newPage({viewport:{width:1600,height:1320}});
  await sheet.goto(pathToFileURL(path.join(root,mode+'.html')).href);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:path.join(root,mode+'.png'),fullPage:true});await sheet.close();
 }
 assert.deepEqual(report.errors,[]);report.finishedAt=new Date().toISOString();
 await writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,assets:report.assets.map((a:any)=>({id:a.id,before:a.oldVoxels,after:a.newVoxels,componentsBefore:a.oldComponentCount,componentsAfter:a.newComponentCount})),errors:report.errors},null,2));
}finally{await client?.close();await browser?.close();server.kill('SIGTERM');await writeFile(path.join(root,'server.log'),log);}
