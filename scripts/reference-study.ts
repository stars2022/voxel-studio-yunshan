import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {spawn,type ChildProcess} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from 'playwright';
import {newProject} from '../src/core/materials';
import {referenceCatalog} from '../src/core/reference-templates';
import {referenceStyleCommands} from '../src/core/reference-style';
import {Grid} from '../src/core/grid';
import {loadMesh,diagnoseMesh} from '../src/import/converter';
import type {Command,Project} from '../src/core/types';
const base=process.cwd(),out=path.join(base,'artifacts/reference-study'),root=path.join(out,'session-'+Date.now()),url='http://127.0.0.1:4337';
await mkdir(root,{recursive:true});await writeFile(path.join(root,'autosave.ysvox.json'),JSON.stringify(newProject()));
const report:any={startedAt:new Date().toISOString(),source:'modular building 3d model.glb',reference:'庭院建筑模块图鉴-2.png',assumptions:['源 GLB 整体约 1m 宽，疑似归一化图鉴；没有可靠的实际建筑尺寸，转换按其现有单位 scale=1 对比。','图鉴重建模块按开间 3.6m 人工设定；隐蔽结构和背面为可编辑设计，不宣称从图片恢复。','转换毫秒和参数生成毫秒均为运行时间，不包含实现模板/人工修复的劳动。'],checks:[],conversions:[]};
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{cwd:base,env:{...process.env,VOXEL_PROJECT_DIR:root,VOXEL_PORT:'4337'},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
for(let i=0;i<100;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
const client=new Client({name:'reference-study',version:'1.0'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],cwd:base,env:{...process.env as Record<string,string>,VOXEL_URL:url},stderr:'pipe'}));
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1600,height:1080}});let errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
async function tool(name:string,args:any={}){const r:any=await client.callTool({name,arguments:args});const value=JSON.parse(r.content[0].text);if(r.isError)throw new Error(JSON.stringify(value));return value;}
async function http(route:string,args?:any){const r=await fetch(url+route,args?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)}:{});const value=await r.json();if(!r.ok)throw new Error(JSON.stringify(value));return value;}
async function tx(commands:Command[],label:string){const state=await tool('read_project'),e={expectedVersion:state.version,requestId:crypto.randomUUID(),commands,label},t=performance.now(),preview=await tool('edit_transaction',{...e,dryRun:true}),previewMs=performance.now()-t,t2=performance.now(),result=await tool('edit_transaction',{...e,previewToken:preview.previewToken});return{previewMs,commitMs:performance.now()-t2,result};}
async function done(id:string){for(let i=0;i<3000;i++){const j=await tool('job_status',{jobId:id});if(j.status!=='running')return j;await new Promise(r=>setTimeout(r,100));}throw new Error('任务超时');}
async function ready(){await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});}
async function snap(name:string,full=true){await ready();await page.waitForTimeout(1200);if(full)await page.screenshot({path:path.join(out,name+'.png')});else await page.locator('#viewport').screenshot({path:path.join(out,name+'.png')});}
const record=(name:string,data:any={})=>{report.checks.push({name,passed:true,...data});console.log('PASS',name);};
try{
 const sourceBytes=await readFile('projects/reference-study/tripo-original.glb'),source={filename:'tripo-original.glb',data:sourceBytes.toString('base64')};report.sha256=createHash('sha256').update(sourceBytes).digest('hex');
 const loadStart=performance.now(),mesh=await loadMesh(source);report.loadMs=performance.now()-loadStart;report.inspection=diagnoseMesh(mesh,.01);report.sourceMaterials=mesh.sourceMaterials;report.sourceDimensions=mesh.bounds.max.map((n,i)=>n-mesh.bounds.min[i]);
 await page.goto(url);await ready();await page.evaluate(data=>(window as any).showOriginalGLB(data),source.data);await snap('tripo-original',false);
 for(const view of['front','back','top']){await page.evaluate(v=>(window as any).voxelStudio.view(v),view);await snap('tripo-'+view,false);}
 await tx(referenceStyleCommands(),'建立独立语义材质库');
 await page.click('[data-tab=import]');await page.setInputFiles('#import-file',path.join(base,'projects/reference-study/tripo-original.glb'));await page.waitForFunction(()=>document.querySelector('#import-status')?.textContent?.includes('已保留'));await page.fill('#import-pitch','.01');await page.click('#inspect-source');await page.waitForFunction(()=>document.querySelector('#import-status')?.textContent?.includes('8089 三角形'),null,{timeout:60000});await snap('ui-source-texture-inspection');record('可视界面真实文件上传 / 诊断 / 原贴图预览');
 const upload=await http('/api/upload',source);
 for(const pitch of[.02,.01]){
  const state=await tool('read_project'),start=performance.now();const job=await tool('import_mesh',{sourceId:upload.sourceId,name:'Tripo 采样 '+pitch,cellSize:pitch,origin:[0,0,0],scale:1,upAxis:'Y',mode:'surface',colorMode:'sample',colorLevels:8,material:2,thinPolicy:'conservative',expectedVersion:state.version,requestId:crypto.randomUUID()});const result=await done(job.id);
  report.conversions.push({pitch,roundtripMs:performance.now()-start,status:result.status,diagnostics:result.result?.diagnostics,error:result.error,comparison:result.result?.comparison,performance:result.result?.performance});await writeFile(path.join(out,'tripo-'+pitch+'-result.json'),JSON.stringify(result,null,2));assert.equal(result.status,'completed',result.error);
  const data=result.result;const preview=await tool('commit_import',{jobId:job.id,expectedVersion:state.version,requestId:'install-'+pitch,dryRun:true});await tool('commit_import',{jobId:job.id,expectedVersion:state.version,requestId:'install-'+pitch,previewToken:preview.previewToken});
  await tx([{op:'select',assetId:data.asset.id,region:null,partId:null}],'选择转换样例');await page.reload();await ready();await page.evaluate(async id=>{await (window as any).voxelStudio.mode('asset',id);(window as any).voxelStudio.view('perspective');},data.asset.id);await snap('tripo-voxel-'+pitch,false);
  report.conversions.at(-1).materialCount=Object.keys(data.materials).length;
  const exported=await tool('export_project',{name:'tripo-'+String(pitch).replace('.','-'),assetId:data.asset.id});await cp(exported.directory,'projects/reference-study/exports/tripo-'+pitch,{recursive:true});
  if(pitch===.01){
   // Reviewed, explicit heuristic: ONLY upper cyan samples are relabelled as roof light strips.
   // Lower cyan samples could be glazing, reflected light or paint and are deliberately retained.
   await tx(referenceStyleCommands(),'图鉴风格材质');
   const candidates=Object.values(data.materials).filter((m:any)=>{const c=[1,3,5].map(i=>parseInt(m.color.slice(i,i+2),16));return c[1]>95&&c[2]>95&&c[0]<c[1]*.55;}) as any[];
   const cmds:Command[]=candidates.map(m=>({op:'assignMaterial',assetId:data.asset.id,fromMaterial:m.id,material:11,height:{min:.26,max:.5}}));
   const repair=cmds.length?await tx(cmds,'人工规则：上部青色采样 → 能源灯带'):null;
   report.materialRepair={rule:'采样 G,B>95 且 R<0.55G；仅局部 Y≥0.26m；人工假设为上部灯带，仍需逐片检查。',candidates:candidates.map(m=>({id:m.id,color:m.color})),...repair};
   await page.waitForFunction(v=>(window as any).voxelStudio.version===v,repair!.result.version);await snap('tripo-partial-material-repair',false);
   const saved=await tool('save_project',{filename:'tripo-converted.ysvox.json'});await cp(saved.path,'projects/reference-study/tripo-converted.ysvox.json');
  }
 }
 const state=await tool('read_project'),j=await tool('import_mesh',{sourceId:upload.sourceId,name:'Tripo 实体填充失败案例',cellSize:.01,origin:[0,0,0],scale:1,upAxis:'Y',mode:'solid',colorMode:'sample',colorLevels:8,material:2,thinPolicy:'conservative',expectedVersion:state.version,requestId:crypto.randomUUID()}),failure=await done(j.id);assert.equal(failure.status,'failed');report.solidFailure=failure;await writeFile(path.join(out,'tripo-solid-failure.json'),JSON.stringify(failure,null,2));record('真实 Tripo 两档表面转换 / 拒绝非封闭实体填充');
 // Independent project for the reference library, generated only through real MCP commands.
 const blank=newProject();await writeFile(path.join(root,'blank.ysvox.json'),JSON.stringify(blank));await http('/api/load',{filename:'blank.ysvox.json',expectedVersion:(await tool('read_project')).version});
 await tx(referenceStyleCommands(),'统一图鉴物理材质');
 const commands:Command[]=[{op:'renameProject',name:'云山 · 庭院建筑图鉴'}];
 let index=0;for(const [type,name]of Object.entries(referenceCatalog)){const id=type;commands.push({op:'createAsset',id,name,template:type,params:type==='ref-bay-corner'?{width:3,depth:3}:{},cellSize:.025,style:'courtyard'},{op:'instance',id:'display-'+id,assetId:id,name,position:[(3-index%4)*5,0,Math.floor(index/4)*5],rotation:0});index++;}
 commands.push({op:'select',assetId:'ref-bay',region:null,partId:null});const generated=await tx(commands,'按参考图生成十二个体素母版');report.parametricGeneration=generated;record('MCP 生成 12 个独立参数母版',generated);
 await page.reload();await ready();await page.evaluate(()=>(window as any).voxelStudio.view('perspective'));await snap('reference-library-editor');await page.evaluate(()=>(window as any).voxelStudio.view('isometric'));await snap('reference-library',false);
 const checks=await tool('check_geometry');report.referenceGeometry=checks;
 const big:any=await client.callTool({name:'read_project',arguments:{includeVoxels:true}});assert.equal(JSON.parse(big.content[0].text).code,'RESULT_TOO_LARGE');assert.equal((await tool('list_assets')).counts.uniqueAssets,12);record('超大 MCP 结果返回可检查错误且连接保持');
 const p:Project=(await http('/api/state')).project;assert.equal(Object.keys(p.assets).length,12);report.assets=Object.values(p.assets).map(a=>({id:a.id,name:a.name,count:new Grid(a.chunks).count,bounds:new Grid(a.chunks).bounds(),cellSize:a.cellSize,parts:a.parts.length}));
 for(const assetId of['ref-bay','ref-gateway','ref-roof','ref-gable','ref-balcony','ref-solid-bay','ref-bridge']){
  await page.evaluate(async id=>{await (window as any).voxelStudio.mode('asset',id);(window as any).voxelStudio.view('perspective');},assetId);await page.evaluate(()=>(window as any).voxelStudio.ao(true));await snap(assetId);await snap(assetId+'-render',false);await page.evaluate(()=>(window as any).voxelStudio.ao(false));
 }
 const saved=await tool('save_project',{filename:'courtyard-reference.ysvox.json'});await cp(saved.path,'projects/courtyard-reference.ysvox.json');
 const exported=await tool('export_project',{name:'courtyard-reference'});await cp(exported.directory,'projects/reference-study/exports/courtyard-reference',{recursive:true});
 const before:Project=(await http('/api/state')).project,modify=await tx([{op:'regenerate',assetId:'ref-bay',params:{openingWidth:1.8}},{op:'assignMaterial',assetId:'ref-solid-bay',fromMaterial:2,material:17},{op:'material',id:11,properties:{intensity:.8}}],'MCP 参考组件加宽与配色');await page.waitForFunction(v=>(window as any).voxelStudio.version===v,modify.result.version);assert.equal(await page.evaluate(()=>(window as any).voxelStudio.project.assets['ref-bay'].template.params.openingWidth),1.8);await tx([{op:'undo'}],'一次撤销参考库修改');const after:Project=(await http('/api/state')).project;assert.deepEqual(after.assets['ref-bay'].chunks,before.assets['ref-bay'].chunks);record('参考库改参数 → UI 同步 → 单次撤销');
 const round=await loadMesh({filename:'visual.glb',data:(await readFile(path.join(exported.directory,'visual.glb'))).toString('base64')});report.exportRoundtrip={bounds:round.bounds,triangles:round.triangles.length};record('图鉴视觉 GLB 与原生体素分开导出');
 await page.evaluate(async()=>{await (window as any).voxelStudio.mode('asset','ref-bay');(window as any).voxelStudio.view('perspective');});await page.waitForTimeout(4000);report.browserStats=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(errors.length,0,errors.join('\n'));report.success=true;
}catch(e:any){report.success=false;report.failure=e.stack;console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await writeFile(path.join(out,'study.json'),JSON.stringify(report,null,2));await writeFile(path.join(out,'server.log'),log);await client.close();await browser.close();server.kill('SIGTERM');}
console.log(JSON.stringify({success:report.success,checks:report.checks.length,conversions:report.conversions.map((x:any)=>({pitch:x.pitch,status:x.status,ms:x.performance?.durationMs,voxels:x.performance?.voxels,materials:x.materialCount})),generation:report.parametricGeneration},null,2));
