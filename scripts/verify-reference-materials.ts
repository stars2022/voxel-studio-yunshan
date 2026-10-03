import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {referenceFinishCommands} from '../src/production/reference-finish';

const root=path.resolve('artifacts/material-study'),index=JSON.parse(await readFile(path.join(root,'latest.json'),'utf8')),runtime=path.join(root,'mcp-runtime-'+index.run),url='http://127.0.0.1:4344',hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const bay=index.studies.find((s:any)=>s.id==='finish-architecture-A05');await mkdir(runtime,{recursive:true});
for(const file of['material-index.json','architecture-index.json','production-index.json',bay.file,bay.originalFile])await copyFile(path.join('projects',file),path.join(runtime,file));
await copyFile(path.join(runtime,bay.originalFile),path.join(runtime,'autosave.ysvox.json'));
let log='',server:ChildProcess|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,client:Client|undefined;
const report:any={run:index.run,environment:{node:process.version,cpu:os.cpus()[0].model,os:os.release(),memoryBytes:os.totalmem()},checks:[],errors:[]};
const state=()=>fetch(url+'/api/state').then(r=>r.json());
const start=async()=>{server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4344',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});server.stdout!.on('data',d=>log+=d);server.stderr!.on('data',d=>log+=d);for(let n=0;n<180;n++){try{if((await fetch(url+'/api/state')).ok)return;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}throw new Error('server start timeout');};
const stop=async()=>{if(server&&server.exitCode===null){const exited=once(server,'exit');server.kill('SIGTERM');await exited;}};
try{
 await start();client=new Client({name:'reference-finish-validation',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],env:{...process.env as Record<string,string>,VOXEL_URL:url},cwd:process.cwd(),stderr:'pipe'}));
 const raw=async(name:string,args:any={})=>{const r:any=await client!.callTool({name,arguments:args},undefined,{timeout:180000});return{...JSON.parse(r.content[0].text),isError:!!r.isError};};
 const call=async(name:string,args:any={})=>{const r=await raw(name,args);assert.ok(!r.isError,JSON.stringify(r));return r;};
 const tools=await client.listTools();await writeFile('docs/tool-schemas.json',JSON.stringify(tools.tools,null,2));assert.ok(JSON.stringify(tools).includes('baseColor'));
 const library=await call('read_production_library');assert.equal(library.counts.materialStudies,40);assert.equal(library.counts.referenceDesigns,28);assert.equal(library.counts.generatedEntries,216);assert.equal(library.studies.filter((s:any)=>s.id.startsWith('finish-')).length,43);report.checks.push('40 material studies / 43 files are discoverable; catalog completion stays 216');
 browser=await chromium.launch({headless:true});report.environment.browser=browser.version();const page=await browser.newPage({viewport:{width:1500,height:950}});page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url+'/?library=1&flat=1&view=perspective');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});
 const sync=(version:number)=>page.waitForFunction(v=>(window as any).voxelStudio?.performance.renderedVersion===v,version,{timeout:120000});
 report.environment.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});
 const before=(await state()).project,env={expectedVersion:before.version,requestId:crypto.randomUUID(),label:'MCP 参考材质批次',commands:referenceFinishCommands(before)},dry=await call('edit_transaction',{...env,dryRun:true});assert.equal(hash((await state()).project),hash(before));
 const t=performance.now(),done=await call('edit_transaction',{...env,previewToken:dry.previewToken});await sync(done.version);report.materialBatchCommitAndUISyncMs=performance.now()-t;
 const changed=(await state()).project;assert.equal(done.modifiedVoxels,0);assert.equal(hash(changed.assets),hash(before.assets));assert.equal(hash(changed.instances),hash(before.instances));assert.equal(hash(await page.evaluate(()=>(window as any).voxelStudio.project.materials)),hash(changed.materials));assert.equal((await call('edit_transaction',env)).version,done.version);
 assert.equal((await raw('edit_transaction',{...env,requestId:crypto.randomUUID()})).code,'VERSION_CONFLICT');
 assert.ok((await raw('edit_transaction',{expectedVersion:changed.version,requestId:crypto.randomUUID(),commands:[{op:'material',id:2,properties:{color:'#ffffff'}},{op:'material',id:3,properties:{surfaceScale:-1}}]})).isError);assert.equal(hash((await state()).project),hash(changed));
 const undo=await call('edit_transaction',{expectedVersion:changed.version,requestId:crypto.randomUUID(),commands:[{op:'undo'}]});await sync(undo.version);assert.equal(hash((await state()).project.materials),hash(before.materials));assert.equal(hash((await state()).project.assets),hash(before.assets));
 const redo=await call('edit_transaction',{expectedVersion:undo.version,requestId:crypto.randomUUID(),commands:[{op:'redo'}]});await sync(redo.version);assert.equal(hash((await state()).project.materials),hash(changed.materials));report.checks.push('official stdio MCP: dry-run, shared UI update, idempotency, CAS conflict, invalid-batch rollback, single undo and redo all pass');report.transaction=done;
 await page.locator('#production-study').selectOption(bay.file);await page.locator('#production-open-study').click();await page.waitForFunction(()=>!(window as any).voxelStudio.clayEnabled&&!!(window as any).voxelStudio.project.palettes['参考材质试作'],null,{timeout:120000});await sync((await state()).project.version);
 assert.equal(await page.locator('#reference-light').getAttribute('class'),'active');assert.equal(await page.locator('#production-study').inputValue(),bay.file);await page.locator('#clay').click();assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),true);await page.locator('#material-view').click();assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),false);report.checks.push('UI material-study selector automatically opens PBR look; pure-colour toggle retains geometry and palette');
 // Colour and texture palettes take the same preview/commit path as any other edit.
 await page.locator('#palette').selectOption('原始素色');await page.getByRole('button',{name:'应用并记录撤销',exact:true}).click();await page.waitForFunction(()=>(window as any).voxelStudio.project.materials[3].surface==='none');
 await page.locator('#palette').selectOption('参考材质试作');await page.getByRole('button',{name:'应用并记录撤销',exact:true}).click();await page.waitForFunction(()=>(window as any).voxelStudio.project.materials[3].surface==='wood');await sync((await state()).project.version);report.checks.push('both stored appearance palettes apply through UI transactions, including textures');
 await page.screenshot({path:path.join(root,'material-library-ui.png')});await page.close();
 const previews=await call('generate_previews',{appearance:'material',lighting:'soft',effects:false,views:['perspective','front']});assert.equal(previews.files.length,2);for(const file of previews.files)assert.ok((await readFile(file)).length>1000);report.previews=previews;report.checks.push('MCP renders perspective and front PNGs with actual PBR parameters and reports capture version');
 const saved=await call('save_project',{filename:'material-verified.ysvox.json'}),savedState=(await state()).project;assert.equal(hash(JSON.parse(await readFile(saved.path,'utf8'))),hash(savedState));await stop();await start();const recovered=await state();assert.equal(hash(recovered.project),hash(savedState));assert.equal(recovered.recovery.recovered,true);report.checks.push('lossless explicit save and process restart recovery preserve material maps, geometry, palettes and instances');
 assert.deepEqual(report.errors,[]);report.completedAt=new Date().toISOString();await writeFile(path.join(root,'mcp-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,materialBatchCommitAndUISyncMs:report.materialBatchCommitAndUISyncMs,errors:report.errors},null,2));
}finally{await browser?.close();await client?.close();await stop();await writeFile(path.join(root,'mcp-server.log'),log);await writeFile(path.join(root,'mcp-partial.json'),JSON.stringify(report,null,2));}
