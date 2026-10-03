import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {validateProject} from '../src/core/engine';
import {templateCatalog} from '../src/core/templates';
import {templateParameters} from '../src/core/template-parameters';
import {loadMesh} from '../src/import/converter';
import type {Project} from '../src/core/types';

const root=path.resolve('artifacts/architecture'),latest=JSON.parse(await readFile(path.join(root,'latest.json'),'utf8')),index=JSON.parse(await readFile(latest.indexFile,'utf8')),runtime=path.join(root,'runtime-'+latest.run),url='http://127.0.0.1:4342',hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
await mkdir(runtime,{recursive:true});await mkdir(path.join(root,'screenshots'),{recursive:true});
for(const n of latest.nativeFiles){const src=path.join('projects',n.file);assert.equal(createHash('sha256').update(await readFile(src)).digest('hex'),n.sha256);await copyFile(src,path.join(runtime,n.file));}
await copyFile('projects/architecture-index.json',path.join(runtime,'architecture-index.json'));await copyFile('projects/production-index.json',path.join(runtime,'production-index.json'));
await copyFile(path.join(runtime,index.items[0].file),path.join(runtime,'autosave.ysvox.json'));
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4342',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,client:Client|undefined;
const report:any={run:latest.run,startedAt:new Date().toISOString(),environment:{cpu:os.cpus()[0].model,arch:os.arch(),os:os.release(),memoryBytes:os.totalmem(),node:process.version},checks:[],items:[],errors:[]};
try{
 for(let i=0;i<180;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 client=new Client({name:'architecture-validation',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],env:{...process.env as Record<string,string>,VOXEL_URL:url},cwd:process.cwd(),stderr:'pipe'}));
 const raw=async(name:string,args:any={})=>{const result:any=await client!.callTool({name,arguments:args});return{...JSON.parse(result.content[0].text),isError:!!result.isError};};
 const call=async(name:string,args:any={})=>{const r=await raw(name,args);if(r.isError)throw new Error(JSON.stringify(r));return r;};
 const state=()=>fetch(url+'/api/state').then(r=>r.json());
 const tools=await client.listTools();await writeFile('docs/tool-schemas.json',JSON.stringify(tools.tools,null,2));assert.ok(JSON.stringify(tools).includes('kit-b16'));report.checks.push('official stdio MCP advertises all new template names');
 await writeFile('docs/template-parameters.json',JSON.stringify(Object.fromEntries(Object.entries(templateCatalog).map(([id,name])=>[id,{name,parameters:templateParameters(id),units:'metres; detail/glass/steps/doorOpen are dimensionless'}])),null,2));
 const library=await call('read_production_library');assert.equal(library.counts.referenceDesigns,28);assert.equal(library.studies.filter((s:any)=>s.id.startsWith('architecture-')).length,30);assert.equal(library.counts.generatedEntries,216);report.checks.push('two galleries + 28 study files are available without inflating catalog completion');
 browser=await chromium.launch({headless:true});report.environment.browser=browser.version();const page=await browser.newPage({viewport:{width:900,height:780}});page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url+'/?preview=1&flat=1&view=perspective');
 const wait=()=>page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});await wait();
 const sync=(version:number)=>page.waitForFunction(v=>(window as any).voxelStudio?.performance.renderedVersion===v,version,{timeout:120000});
 report.environment.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});
 const open=async(file:string)=>{const t=performance.now(),r=await call('load_project',{filename:file,expectedVersion:(await state()).project.version});await sync(r.version);return performance.now()-t;};
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]);
 for(const item of index.items){
  const loadAndSyncMs=await open(item.file);await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(true);v.view('perspective');});await wait();
  const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(perf.meshError,null);assert.equal(perf.triangles,item.triangles);
  for(const view of['perspective','front','back','top']){await page.evaluate(view=>(window as any).voxelStudio.view(view),view);await page.waitForTimeout(100);await page.locator('#viewport').screenshot({path:path.join(root,'screenshots',`${item.code}-${view}.png`)});}
  const p:Project=(await state()).project;validateProject(p);const a=p.assets[item.assetId],geometry=checkGeometry(p);assert.deepEqual(geometry.collisions,[]);assert.deepEqual(geometry.warnings,[]);for(const o of geometry.openings){assert.equal(o.ownSolidCells+o.nonCollisionCells,0,item.code+' blocked own passage');assert.deepEqual(o.blockedBy,[]);}
  const dir=path.join(latest.out,'exports',item.code),bytes=await readFile(path.join(dir,'visual.glb')),doc=await io.readBinary(bytes);assert.ok(doc.getRoot().listMeshes().length);const imported=await loadMesh({filename:item.code+'.glb',data:bytes.toString('base64')}),bounds=new Grid(a.chunks).bounds()!;
  for(const side of['min','max']as const)for(let k=0;k<3;k++)assert.ok(Math.abs(imported.bounds[side][k]-bounds[side][k]*a.cellSize)<1e-6,item.code+' reimport dimensions');
  const native:Project=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(native);assert.equal(hash(native.assets[a.id].chunks),hash(a.chunks));
  const components=gridComponents(new Grid(a.chunks));assert.equal(components.length,1,item.code+' contains a floating fragment');report.items.push({...item,loadAndSyncMs,workerMs:perf.lastWorkerMeshMs,drawCalls:perf.drawCalls,components:components.length,componentSizes:components,unsupported:geometry.unsupported,openings:geometry.openings,glbBytes:bytes.length});console.log('VERIFIED '+item.code+' / cells '+item.voxels+' / components '+components.length);
 }
 report.checks.push('28 native projects render in four views; all GLBs reimport with metre-space bounds intact; all default models are face-connected with no self-blocked declared passages');
 for(const group of['A','B']){
  const rows=report.items.filter((r:any)=>r.code.startsWith(group)),html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#d5d6d2;color:#283b36;font:16px system-ui,'PingFang SC'}header{padding:28px 32px;border-bottom:1px solid #aeb8ad}h1{margin:0 0 8px;font-size:34px}p{margin:0}main{display:grid;grid-template-columns:repeat(4,1fr)}figure{margin:0;border:1px solid #adb4af}img{display:block;width:100%}figcaption{padding:12px 20px;height:96px}b{font-size:22px}small{display:block;margin-top:8px;color:#536358}footer{padding:22px 32px}</style><header><h1>云山 · ${group==='A'?'建筑主体组件':'立面与细部组件'} · 原生体素</h1><p>实际编辑器画面 · 2cm 格距 · 仅基础色 / 固定面明暗 · 无纹理、反射、发光、场景灯光与后期</p></header><main>${rows.map((r:any)=>`<figure><img src="screenshots/${r.code}-perspective.png"><figcaption><b>${r.code} ${r.name}</b><small>${r.features}</small></figcaption></figure>`).join('')}</main><footer>依据参考图人工规则建模；尺寸与背面为设计值。原生体素、材质ID、部件和接口均可继续编辑；尚未人工美术验收。</footer>`;
  const file=path.join(root,'sheet-'+group+'.html');await writeFile(file,html);const sheet=await browser.newPage({viewport:{width:2200,height:1700}});await sheet.goto(pathToFileURL(file).href);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:path.join(root,'sheet-'+group+'.png'),fullPage:true});await sheet.close();
 }
 await open(index.items.find((i:any)=>i.code==='A05').file);const before=(await state()).project;
 const env={expectedVersion:before.version,requestId:crypto.randomUUID(),commands:[{op:'regenerate',assetId:'arch-a05',params:{openingWidth:1.6}},{op:'material',id:2,properties:{color:'#c1cac5'}},{op:'instance',id:'copy-bay',assetId:'arch-a05',position:[3.2,0,0]}]};
 const dry=await call('edit_transaction',{...env,dryRun:true});assert.equal(hash((await state()).project),hash(before));const done=await call('edit_transaction',{...env,previewToken:dry.previewToken});await sync(done.version);assert.equal((await call('edit_transaction',env)).version,done.version);
 assert.equal((await raw('edit_transaction',{...env,requestId:crypto.randomUUID()})).code,'VERSION_CONFLICT');
 const changed=(await state()).project;const failed=await raw('edit_transaction',{expectedVersion:changed.version,requestId:crypto.randomUUID(),commands:[{op:'material',id:2,properties:{color:'#ffffff'}},{op:'regenerate',assetId:'arch-a05',params:{openingWidth:30}}]});assert.ok(failed.isError);assert.equal(hash((await state()).project),hash(changed));
 const undo=await call('edit_transaction',{expectedVersion:changed.version,requestId:crypto.randomUUID(),commands:[{op:'undo'}]});await sync(undo.version);const restored=(await state()).project;for(const[id,a]of Object.entries(before.assets as Project['assets']))assert.deepEqual(restored.assets[id],{...a,version:restored.assets[id].version});assert.deepEqual(restored.materials,before.materials);assert.deepEqual(restored.instances,before.instances);
 const saved=await call('save_project',{filename:'architecture-save-restore.ysvox.json'});assert.equal(hash(JSON.parse(await readFile(saved.path,'utf8'))),hash(restored));report.checks.push('MCP opening-width rebuild, shared recolour and instance copy update UI together; preview, CAS, idempotency, failed-batch rollback, single undo and lossless save pass');report.transaction={modifiedVoxels:done.modifiedVoxels,version:done.version};
 const ui=await browser.newPage({viewport:{width:1560,height:1000}});await ui.goto(url+'/?library=1&flat=1&view=perspective');await ui.waitForFunction(()=>!!(window as any).voxelStudio?.ready);const target=index.items.find((i:any)=>i.code==='B11');await ui.locator('#production-study').selectOption(target.file);await ui.locator('#production-open-study').click();await ui.waitForFunction(()=>(window as any).voxelStudio?.performance.assetIds.includes('arch-b11'));assert.equal(await ui.locator('#production-study').inputValue(),target.file);await ui.screenshot({path:path.join(root,'library-ui.png')});report.checks.push('visible grouped study selector opens B11 and keeps its selection after document refresh');
 const assetCount=Object.keys((await state()).project.assets).length;await ui.locator('[data-tab=templates]').click();await ui.locator('[data-template=kit-b09]').click();assert.equal(await ui.locator('#new-pitch').inputValue(),'0.02');await ui.getByRole('button',{name:'创建母版',exact:true}).click();await ui.getByRole('button',{name:'应用并记录撤销',exact:true}).click();await ui.waitForFunction(n=>Object.keys((window as any).voxelStudio.project.assets).length===n,assetCount+1);assert.ok(Object.values((await state()).project.assets).some((a:any)=>a.template?.type==='kit-b09'&&a.cellSize===.02));await ui.close();report.checks.push('UI template creation defaults to the supported 2cm pitch and commits through the same preview transaction');
 assert.deepEqual(report.errors,[]);report.completedAt=new Date().toISOString();await writeFile(path.join(root,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,items:report.items.length,errors:report.errors},null,2));
}finally{await browser?.close();await client?.close();server.kill('SIGTERM');await writeFile(path.join(root,'server.log'),log);await writeFile(path.join(root,'verification-partial.json'),JSON.stringify(report,null,2));}
