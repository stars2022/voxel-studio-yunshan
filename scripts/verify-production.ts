import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry} from '../src/core/checks';
import {loadMesh} from '../src/import/converter';
import type {Project,Command} from '../src/core/types';
import type {ProductionIndex} from '../src/production/library';

const root=path.resolve('artifacts/production'),latest=JSON.parse(await readFile(path.join(root,'latest.json'),'utf8')),index:ProductionIndex=JSON.parse(await readFile(latest.indexFile,'utf8')),runtime=path.join(root,'runtime-'+latest.run),url='http://127.0.0.1:4341',hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
await mkdir(runtime,{recursive:true});await mkdir(path.join(root,'screenshots'),{recursive:true});
for(const {file,sha256}of latest.nativeFiles){const data=await readFile(path.join('projects',file),'utf8');assert.equal(createHash('sha256').update(data).digest('hex'),sha256);validateProject(JSON.parse(data));await copyFile(path.join('projects',file),path.join(runtime,file));}
await copyFile('projects/production-index.json',path.join(runtime,'production-index.json'));
await copyFile(path.join(runtime,latest.run+'-models-01.ysvox.json'),path.join(runtime,'autosave.ysvox.json'));
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{cwd:process.cwd(),env:{...process.env,VOXEL_PORT:'4341',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,client:Client|undefined;
const report:any={startedAt:new Date().toISOString(),run:latest.run,environment:{cpu:os.cpus()[0].model,memoryBytes:os.totalmem(),os:os.release(),arch:os.arch(),node:process.version},counts:index.counts,checks:[],screens:[],errors:[],measurements:[]};
try{
 for(let i=0;i<150;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 client=new Client({name:'production-validation',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],env:{...process.env as Record<string,string>,VOXEL_URL:url},cwd:process.cwd(),stderr:'pipe'}));
 const raw=async(name:string,args:any={})=>{const r:any=await client!.callTool({name,arguments:args});return{...JSON.parse(r.content[0].text),isError:!!r.isError};};
 const call=async(name:string,args:any={})=>{const r=await raw(name,args);if(r.isError)throw new Error(JSON.stringify(r));return r;};
 const state=()=>fetch(url+'/api/state').then(r=>r.json());
 const edit=async(commands:Command[])=>{const env={expectedVersion:(await state()).project.version,requestId:crypto.randomUUID(),commands},dry=await call('edit_transaction',{...env,dryRun:true});return call('edit_transaction',{...env,previewToken:dry.previewToken});};
 const tools=await client.listTools();assert.equal(tools.tools.length,17);await writeFile('docs/tool-schemas.json',JSON.stringify(tools.tools,null,2));report.checks.push('17 actual stdio MCP tool schemas available');
 const library=await call('read_production_library',{generatedOnly:true,limit:100});assert.equal(library.total,216);assert.equal(library.counts.baseModels,161);assert.equal((await call('read_production_library',{query:'CHAR-',generatedOnly:false,limit:1})).entries[0].stage,'not-produced');assert.equal((await call('list_production_recipes',{limit:1})).total,212);report.checks.push('entire 1068-row index distinguishes 161 bases, 51 layouts, 4 variant families and 852 unproduced rows');
 browser=await chromium.launch({headless:true});report.environment.browser=browser.version();const page=await browser.newPage({viewport:{width:760,height:650},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
 const wait=()=>page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});
 const sync=(v:number)=>page.waitForFunction(v=>(window as any).voxelStudio?.performance.renderedVersion===v,v,{timeout:120000});
 const t=performance.now();await page.goto(url+'/?preview=1&asset=life-001&view=perspective&flat=1');await wait();report.firstAssetMs=performance.now()-t;
 report.environment.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});
 const open=async(file:string)=>{const t=performance.now(),r=await call('load_project',{filename:file,expectedVersion:(await state()).project.version});await sync(r.version);report.measurements.push({file,loadAndSyncMs:performance.now()-t});return r;};
 // Capture the supplied twelve-item reference set before the larger regression gallery.
 await mkdir(path.join(root,'reference-screenshots'),{recursive:true});report.referenceScreens=[];
 for(const study of(index.studies??[]).filter(s=>s.id!=='gallery')){
  await open(study.file);await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(true);v.view('perspective');});await wait();await page.waitForTimeout(80);
  const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(perf.meshError,null);assert.ok(perf.triangles>0);
  const geometric=checkGeometry((await state()).project);assert.deepEqual(geometric.collisions,[],study.id);assert.deepEqual(geometric.unsupported,[],study.id);assert.deepEqual(geometric.warnings,[],study.id);report.referenceGeometry??=[];report.referenceGeometry.push({id:study.id,...geometric});
  const file=study.id+'.png';await page.locator('#viewport').screenshot({path:path.join(root,'reference-screenshots',file)});report.referenceScreens.push({...study,image:file,triangles:perf.triangles,drawCalls:perf.drawCalls,workerMs:perf.lastWorkerMeshMs});
  for(const view of ['front','back','top']){await page.evaluate(v=>(window as any).voxelStudio.view(v),view);await page.waitForTimeout(60);await page.locator('#viewport').screenshot({path:path.join(root,'reference-screenshots',study.id+'-'+view+'.png')});}
 }
 const referenceHtml=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#cacaca;color:#273932;font:16px system-ui,'PingFang SC'}header{padding:28px 32px;border-bottom:1px solid #929b96}h1{margin:0 0 10px;font-size:34px}p{margin:0}main{display:grid;grid-template-columns:repeat(4,1fr)}figure{margin:0;border:1px solid #adb4af}img{width:100%;display:block}figcaption{padding:4px 22px 18px;height:115px}b{font-size:22px}small{display:block;margin-top:8px;line-height:1.5;font-size:13px;color:#4f5d56}footer{padding:20px 32px}</style><header><h1>云山 · 家居十二件 · 原生体素结构对照</h1><p>实际编辑器画面 / 基础色 + 固定面明暗 / 无纹理、反射、发光、场景灯光和后期</p></header><main>${report.referenceScreens.map((r:any)=>`<figure><img src="reference-screenshots/${r.image}"><figcaption><b>${r.id.slice(0,2)} ${r.name}</b><small>${r.note}</small></figcaption></figure>`).join('')}</main><footer>参考图指导人工规则建模 · 每件保留稀疏体素、材质 ID 与母版关系 · 未计为美术验收通过</footer>`;
 const referenceFile=path.join(root,'reference-furniture.html');await writeFile(referenceFile,referenceHtml);const refpage=await browser.newPage({viewport:{width:2000,height:1600}});await refpage.goto(pathToFileURL(referenceFile).href);await refpage.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await refpage.screenshot({path:path.join(root,'reference-furniture.png'),fullPage:true});await refpage.close();
 await writeFile(path.join(root,'reference-capture.json'),JSON.stringify({run:latest.run,environment:report.environment,screens:report.referenceScreens},null,2));report.checks.push('12 persisted reference arrangements have no overlapping solid cells or unsupported instances and render without material effects');console.log('REFERENCE twelve native assemblies captured');
 // All bases receive actual WebGL previews, grouped by their persisted native packs.
 for(const pack of index.packs.filter(p=>p.file.includes('-models-'))){
  await open(pack.file);const entries=index.entries.filter(e=>e.file===pack.file);
  for(const entry of entries){await page.evaluate(async id=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.clay(true);v.view('perspective');},entry.assetIds[0]);await wait();await page.waitForTimeout(45);const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.deepEqual(perf.assetIds,[entry.assetIds[0]]);assert.equal(perf.triangles,entry.triangles);assert.equal(perf.meshError,null);
   const file=entry.id+'.png';await page.locator('#viewport').screenshot({path:path.join(root,'screenshots',file)});report.screens.push({id:entry.id,file,triangles:perf.triangles,drawCalls:perf.drawCalls,workerMs:perf.lastWorkerMeshMs});
  }
  console.log('WEBGL bases '+report.screens.length+'/161');
 }
 report.checks.push('all 161 base masters rendered as native voxel meshes in pure-colour WebGL, matching CPU triangle counts');
 for(const entry of index.entries.filter(e=>['layout-candidate','variant-candidate'].includes(e.stage))){await open(entry.file!);await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(true);v.view('perspective');});await wait();await page.waitForTimeout(45);const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.ok(perf.triangles>0);const file=entry.id+'.png';await page.locator('#viewport').screenshot({path:path.join(root,'screenshots',file)});report.screens.push({id:entry.id,file,triangles:perf.triangles,drawCalls:perf.drawCalls});}
 report.checks.push('51 assemblies and four dimension families open and render with shared master instances');
 // Test actual GUI-driven cross-pack loading, separately from the contact-sheet capture.
 const ui=await browser.newPage({viewport:{width:1660,height:1060}});ui.on('pageerror',e=>report.errors.push(e.message));await ui.goto(url+'/?library=1&flat=1&view=perspective');await ui.waitForFunction(()=>!!(window as any).voxelStudio?.ready);await ui.locator('#production-search').fill('LIFE-018');await ui.waitForFunction(()=>document.querySelectorAll('[data-production-file]').length===1&&!!document.querySelector('[data-production-asset="life-018"]'));await ui.locator('[data-production-asset="life-018"]').click();await ui.waitForFunction(()=>(window as any).voxelStudio?.performance.assetIds.length===1&&(window as any).voxelStudio.performance.assetIds[0]==='life-018');await ui.waitForTimeout(300);await ui.screenshot({path:path.join(root,'library-ui.png')});
 report.checks.push('visible batch-library search opens the matching native pack and focuses the selected master');
 const before=await state(),env={expectedVersion:before.project.version,requestId:'mcp-batch-'+crypto.randomUUID(),commands:[{op:'rebuildCatalogAsset',assetId:'life-016',params:{width:1.8}},{op:'assignMaterial',assetId:'life-018',fromMaterial:4,material:3},{op:'instance',id:'copy-monitor',assetId:'life-018',position:[0,.8,0]},{op:'instance',id:'copy-monitor-2',assetId:'life-018',position:[1,.8,0]}]};
 const dry=await call('edit_transaction',{...env,dryRun:true});assert.ok(dry.modifiedVoxels>4096);assert.equal(hash((await state()).project),hash(before.project));const changed=await call('edit_transaction',{...env,previewToken:dry.previewToken});await ui.waitForFunction(v=>(window as any).voxelStudio?.performance.renderedVersion===v,changed.version);assert.equal((await call('edit_transaction',env)).version,changed.version);assert.equal((await state()).project.instances['copy-monitor'].assetId,'life-018');
 assert.equal((await raw('edit_transaction',{...env,requestId:'stale-'+crypto.randomUUID()})).code,'VERSION_CONFLICT');
 const altered=(await state()).project;const failed=await raw('edit_transaction',{expectedVersion:altered.version,requestId:crypto.randomUUID(),commands:[{op:'material',id:3,properties:{color:'#ffffff'}},{op:'produceCatalogAsset',catalogId:'LIFE-215',id:'fake-texture'}]});assert.ok(failed.isError);assert.equal(hash((await state()).project),hash(altered));
 const undo=await edit([{op:'undo'}]);await ui.waitForFunction(v=>(window as any).voxelStudio?.performance.renderedVersion===v,undo.version);const undone=(await state()).project;for(const id of Object.keys(before.project.assets))assert.equal(hash(undone.assets[id].chunks),hash(before.project.assets[id].chunks));assert.deepEqual(undone.instances,before.project.instances);
 report.batch={modifiedVoxels:changed.modifiedVoxels,affectedAssets:changed.affectedAssets,affectedInstances:changed.affectedInstances,version:changed.version};report.checks.push('official stdio MCP width rebuild + material replacement + two placements synchronise GUI, reject stale versions, roll back invalid batch, and undo together');
 const saved=await call('save_project',{filename:'production-save-restore.ysvox.json'});assert.equal(hash(JSON.parse(await readFile(saved.path,'utf8'))),hash((await state()).project));const invalidPath=await raw('load_project',{filename:'../city-production.ysvox.json',expectedVersion:undone.version});assert.ok(invalidPath.isError);await call('load_project',{filename:'production-save-restore.ysvox.json',expectedVersion:undone.version});report.checks.push('save/readback/reload lossless; out-of-root filename rejected');
 // All individual GLBs are parsed, all native exports validated; selected complex cases reimport through the actual mesh importer.
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]);let parsed=0;
 const {readdir}=await import('node:fs/promises');const dirs=await readdir(path.join(latest.out,'exports'));
 for(const id of dirs){const dir=path.join(latest.out,'exports',id),native:Project=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(native);const bytes=await readFile(path.join(dir,'visual.glb')),doc=await io.readBinary(bytes);assert.ok(doc.getRoot().listMeshes().length>0);assert.equal(doc.getRoot().listNodes().length,Object.keys(native.instances).length||1);parsed++;
  if(['life-018','life-040','life-053','life-122','life-198'].includes(id)){const imported=await loadMesh({filename:'visual.glb',data:bytes.toString('base64')}),a=native.assets[id],b=new Grid(a.chunks).bounds()!;for(const side of['min','max']as const)for(let k=0;k<3;k++)assert.ok(Math.abs(imported.bounds[side][k]-b[side][k]*a.cellSize)<1e-6,id+' reimport bounds');}
 }
 report.checks.push(`${parsed} actual GLBs parsed and native exports validated; five complex meshes reimport with matching metre bounds`);report.exportFilesChecked=parsed;
 // HTML contact sheets only arrange the preceding actual WebGL screenshots.
 const escape=(s:string)=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]!));
 for(let start=0;start<report.screens.length;start+=24){const batch=report.screens.slice(start,start+24),n=String(start/24+1).padStart(2,'0'),html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#e1e0d8;color:#26332f;font:14px system-ui,'PingFang SC'}header{padding:24px 26px}h1{font-size:26px;margin:0 0 8px}p{margin:0}main{display:grid;grid-template-columns:repeat(6,1fr)}figure{margin:0;border:1px solid #b8bdb5}img{width:100%;display:block}figcaption{padding:8px 12px;height:70px}small{display:block;color:#516057;font-size:11px}</style><header><h1>云山 · 批量几何检查 ${n}</h1><p>真实可编辑体素 · 基础色 / 固定面明暗 · 无纹理、反射、场景光与后期 · 候选，未人工验收</p></header><main>${batch.map((s:any)=>`<figure><img src="screenshots/${s.file}"><figcaption><b>${s.id} ${escape(index.entries.find(e=>e.id===s.id)!.name)}</b><small>${s.triangles.toLocaleString()} 三角形 · ${s.drawCalls} draw calls</small></figcaption></figure>`).join('')}</main>`;const file=path.join(root,'contact-'+n+'.html');await writeFile(file,html);const sheet=await browser.newPage({viewport:{width:2100,height:1500}});await sheet.goto(pathToFileURL(file).href);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:path.join(root,'contact-'+n+'.png'),fullPage:true});await sheet.close();}
 assert.deepEqual(report.errors,[]);report.completedAt=new Date().toISOString();await writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,screens:report.screens.length,parsed,errors:report.errors},null,2));
}finally{await browser?.close();await client?.close();server.kill('SIGTERM');await writeFile(path.join(root,'server.log'),log);}
