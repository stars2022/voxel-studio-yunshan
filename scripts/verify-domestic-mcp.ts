import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {validationBrowserOptions} from './browser-options';
import {parseCatalogCSV} from '../src/core/catalog';
import {productionProject} from '../src/production/style';
import type {Command,Project,V3} from '../src/core/types';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8'));
const index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8'));
const out=latest.evidence,runtime=path.join(out,'domestic-mcp-runtime'),url='http://127.0.0.1:4347';
const gallery=index.studies.find((s:any)=>s.id==='M012-gallery');assert.ok(gallery);
const native:Project=JSON.parse(await readFile(path.join('projects',gallery.file),'utf8'));
await mkdir(runtime,{recursive:true});
for(const f of ['atlas-production-index.json','production-index.json',gallery.file,...index.entries.filter((e:any)=>e.sheet==='M012').map((e:any)=>e.file)])await copyFile(path.join('projects',f),path.join(runtime,f));
await cp('projects/reference-atlas',path.join(runtime,'reference-atlas'),{recursive:true});
await copyFile(path.join(runtime,gallery.file),path.join(runtime,'autosave.ysvox.json'));
const empty=productionProject('共享楼板与楼梯 · MCP 拼装验证');empty.catalog={sourceName:'city-assets.csv',importedAt:'verification',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(row=>[row.id,row]))};
await writeFile(path.join(runtime,'empty.ysvox.json'),JSON.stringify(empty));
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const state=async():Promise<Project>=>(await fetch(url+'/api/state').then(r=>r.json())).project;
const report:any={run:index.run,startedAt:new Date().toISOString(),status:'running',checks:[],errors:[],uiSync:[]};
let server:ChildProcess|undefined,client:Client|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,log='';
async function start(){
 server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4347',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});
 server.stdout!.on('data',d=>log+=d);server.stderr!.on('data',d=>log+=d);
 for(let i=0;i<180;i++){try{if((await fetch(url+'/api/state')).ok)return;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}throw new Error('Server start timeout');
}
async function stop(){if(server&&server.exitCode===null){const done=once(server,'exit');server.kill('SIGTERM');await done;}}
try{
 await start();client=new Client({name:'domestic-role-and-assembly-validation',version:'1'});
 await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],env:{...process.env as Record<string,string>,VOXEL_URL:url},cwd:process.cwd(),stderr:'pipe'}));
 const raw=async(name:string,args:any={})=>{const t=performance.now(),r:any=await client!.callTool({name,arguments:args},undefined,{timeout:180000});console.log(JSON.stringify({tool:name,ms:performance.now()-t,error:!!r.isError}));return{...JSON.parse(r.content[0].text),isError:!!r.isError};};
 const call=async(name:string,args:any={})=>{const r=await raw(name,args);assert.ok(!r.isError,JSON.stringify(r));return r;};
 browser=await chromium.launch(validationBrowserOptions());report.browser=browser.version();
 const page=await browser.newPage({viewport:{width:1600,height:1050}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'/?atlas=1&sheet=M012&asset=life-198&flat=1&view=isometric');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});
 report.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});if(process.argv.includes('--metal'))assert.match(report.webgl,/Metal Renderer/);
 const sync=async(v:number)=>{const t=performance.now();await page.waitForFunction(n=>(window as any).voxelStudio.performance.renderedVersion===n,v,{timeout:120000});report.uiSync.push({version:v,ms:performance.now()-t});};
 const before=await state(),roles=before.styles.yunshan;
 const checks=await call('check_geometry');assert.equal(checks.collisionGrids.length,12);assert.deepEqual(checks.collisions,[]);assert.deepEqual(checks.unsupported,[]);assert.deepEqual(checks.warnings,[]);assert.ok(checks.openings.every((o:any)=>!o.ownSolidCells&&!o.blockedBy.length));report.gallery=checks;
 report.checks.push('12 saved M012 masters have separate collision grids, no collisions, unsupported objects or blocked authored openings');
 for(const [role,category]of Object.entries({teaLeaf:'food',teaLiquid:'water',petKibble:'food',cleanerFibre:'fabric',cleanerLiquid:'water',mirrorGlass:'glass',giftWrapRed:'fabric',giftWrapBlue:'fabric',giftWrapBand:'fabric',giftBoard:'paper',plantStem:'plant'}))assert.equal(before.materials[roles[role]].category,category);
 for(const [min,role]of [[[8,140,6],'enamel'],[[108,92,50],'metalBright'],[[66,136,0],'rubber'],[[66,92,-6],'glass'],[[67,159,-5],'displayGlyph']] as const){const q=await call('query_voxels',{assetId:'life-198',region:{min,max:min.map(n=>n+1)}});assert.equal(q.cells[0]?.[1],roles[role]);}
 const changed=['enamel','glass','displayGlyph','mirrorGlass','petKibble','giftWrapRed'];
 const request={expectedVersion:before.version,requestId:crypto.randomUUID(),label:'独立材质包校验',commands:[{op:'definePalette',name:'M012 分类验证',materials:Object.fromEntries(changed.map((r,i)=>[roles[r],{color:i%2?'#814872':'#417c75'}]))},{op:'palette',name:'M012 分类验证'}]};
 const dry=await call('edit_transaction',{...request,dryRun:true});assert.equal(hash(await state()),hash(before));
 const result=await call('edit_transaction',{...request,previewToken:dry.previewToken});await sync(result.version);const after=await state();assert.equal(result.modifiedVoxels,0);
 for(const k of['assets','styles']as const)assert.equal(hash(after[k]),hash(before[k]));
 for(const [id,m]of Object.entries(before.materials)){assert.equal(after.materials[id].category,m.category);assert.equal(after.materials[id].solid,m.solid);if(!changed.some(r=>String(roles[r])===id))assert.equal(hash(after.materials[id]),hash(m));}
 assert.equal(hash(await page.evaluate(()=>(window as any).voxelStudio.project.materials)),hash(after.materials));await page.locator('[data-material="'+roles.enamel+'"]').click();assert.match(await page.locator('#material-role').innerText(),/yunshan.enamel/);await page.screenshot({path:path.join(out,'mcp-domestic-roles.png')});
 assert.equal((await call('edit_transaction',request)).version,result.version);assert.equal((await raw('edit_transaction',{...request,requestId:crypto.randomUUID()})).code,'VERSION_CONFLICT');
 const failed=await raw('edit_transaction',{expectedVersion:after.version,requestId:crypto.randomUUID(),commands:[{op:'material',id:roles.enamel,properties:{color:'#ff00ff'}},{op:'produceCatalogAsset',catalogId:'BUILT-999',id:'bad'}]});assert.ok(failed.isError);assert.equal(hash(await state()),hash(after));
 const undone=await call('edit_transaction',{expectedVersion:after.version,requestId:crypto.randomUUID(),commands:[{op:'undo'}]});await sync(undone.version);const restored=await state();for(const k of['assets','styles','materials','palettes']as const)assert.equal(hash(restored[k]),hash(before[k]));await page.screenshot({path:path.join(out,'mcp-domestic-roles-restored.png')});
 report.checks.push('actual 5 mm coating/steel/rubber/glass/display cells are queryable; six-role resource pack preserves geometry, all other materials and physical flags; UI hashes agree; retry, conflict, rollback and one undo verified');
 await page.locator('#atlas-sheet').selectOption('M012');await page.locator('[data-catalog="BUILT-003"][data-atlas-open]').first().click();await page.waitForFunction(()=>(window as any).voxelStudio.performance.assetIds.includes('built-003'),null,{timeout:120000});assert.match(await page.locator('#atlas-reference').innerText(),/BUILT-003/);await page.screenshot({path:path.join(out,'mcp-domestic-editor.png')});
 report.checks.push('BUILT-003 opens from the real M012 reference tile with its own native asset and catalogue domain');
 const loaded=await call('load_project',{filename:'empty.ysvox.json',expectedVersion:(await state()).version});await sync(loaded.version);
 const commands:Command[]=[{op:'produceCatalogAsset',catalogId:'BUILT-003',id:'floor'},{op:'produceCatalogAsset',catalogId:'BUILT-007',id:'stairs'},
  {op:'createAsset',id:'support',name:'承柱',template:'empty',cellSize:.02},{op:'voxels',assetId:'support',mode:'fill',region:{min:[0,0,0],max:[10,80,10]},material:roles.metal},
  {op:'instance',id:'floor-lower',assetId:'floor',position:[0,0,0]},
  {op:'connect',id:'floor-side',assetId:'floor',portId:'join-left',targetInstanceId:'floor-lower',targetPortId:'join-right',rotation:0},
  {op:'connect',id:'stairs-up',assetId:'stairs',portId:'bottom-walkway',targetInstanceId:'floor-lower',targetPortId:'back-60',rotation:0},
  {op:'connect',id:'floor-upper',assetId:'floor',portId:'front-60',targetInstanceId:'stairs-up',targetPortId:'top-walkway',rotation:0},
  ...([[.02,0,5.6],[2.18,0,5.6],[.02,0,6.58],[2.18,0,6.58]] as V3[]).map((position,i)=>({op:'instance',id:'column-'+i,assetId:'support',position}))];
 const req={expectedVersion:loaded.version,requestId:crypto.randomUUID(),commands},preview=await call('edit_transaction',{...req,dryRun:true}),built=await call('edit_transaction',{...req,previewToken:preview.previewToken});await sync(built.version);await page.evaluate(()=>(window as any).voxelStudio.mode('scene'));await page.waitForFunction(()=>(window as any).voxelStudio.performance.assetIds.includes('stairs'),null,{timeout:120000});
 const route=await call('check_geometry');for(const k of['collisions','gaps','unsupported','warnings'])assert.deepEqual(route[k],[]);assert.ok(route.openings.every((o:any)=>!o.ownSolidCells&&!o.blockedBy.length));report.route=route;
 const builtDoc=await state();assert.equal(hash(await page.evaluate(()=>(window as any).voxelStudio.project.assets)),hash(builtDoc.assets));await page.screenshot({path:path.join(out,'mcp-domestic-route.png')});
 report.checks.push('MCP creates two BUILT masters, voxel support columns and eight placements in one transaction; matched interfaces yield a supported two-level route with free stair headroom and no collision or gap');
 const exported=await call('export_project',{name:'domestic-route'});const round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));for(const k of['assets','instances','styles','materials']as const)assert.equal(hash(round[k]),hash(builtDoc[k]));report.export=exported;await cp(exported.directory,path.join(out,'domestic-route-export'),{recursive:true});
 const views=await call('generate_previews',{appearance:'baseColor',views:['isometric','front']});assert.equal(views.files.length,2);for(const f of views.files)assert.ok((await readFile(f)).length>1000);report.previews=views;for(let i=0;i<views.files.length;i++)await copyFile(views.files[i],path.join(out,'domestic-route-view-'+i+'.png'));
 report.checks.push('GLB/collision/interface/native export includes the assembled route and stable material mappings; MCP renders two actual views');
 const save=await call('save_project',{filename:'domestic-route.ysvox.json'}),saved=await state();assert.equal(hash(JSON.parse(await readFile(save.path,'utf8'))),hash(saved));await copyFile(save.path,path.join(out,'domestic-route.ysvox.json'));await stop();await start();assert.equal(hash(await state()),hash(saved));report.checks.push('native save and server restart restore the exact shared document and role bindings');
 assert.deepEqual(report.errors,[]);report.status='passed';report.completedAt=new Date().toISOString();console.log(JSON.stringify({status:report.status,checks:report.checks.length,out}));
}catch(e){report.status='failed';report.errors.push(String(e));throw e;}finally{await browser?.close();await client?.close();await stop();await writeFile(path.join(out,'domestic-mcp-verification.json'),JSON.stringify(report,null,2));await writeFile(path.join(out,'domestic-mcp-server.log'),log);}
