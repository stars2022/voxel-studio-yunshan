import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,cp} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from 'playwright';
import {newProject} from '../src/core/materials';
import {referenceStyleCommands} from '../src/core/reference-style';
import {loadMesh} from '../src/import/converter';
import type {Command,V3} from '../src/core/types';
const base=process.cwd(),root=path.join(base,'artifacts/reference-study/house-session-'+Date.now()),url='http://127.0.0.1:4338',report:any={startedAt:new Date().toISOString(),checks:[]};
await mkdir(root,{recursive:true});await writeFile(path.join(root,'autosave.ysvox.json'),JSON.stringify(newProject()));const processServer=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{cwd:base,env:{...process.env,VOXEL_PORT:'4338',VOXEL_PROJECT_DIR:root},stdio:['ignore','pipe','pipe']});let log='';processServer.stdout.on('data',b=>log+=b);processServer.stderr.on('data',b=>log+=b);
for(let i=0;i<100;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
const client=new Client({name:'reference-house-verifier',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],cwd:base,env:{...process.env as Record<string,string>,VOXEL_URL:url},stderr:'pipe'}));
async function tool(name:string,args:any={}){const r:any=await client.callTool({name,arguments:args});const result=JSON.parse(r.content[0].text);if(r.isError)throw new Error(JSON.stringify(result));return result;}
async function tx(commands:Command[],label:string){const version=(await tool('read_project')).version,e={expectedVersion:version,requestId:crypto.randomUUID(),commands,label},preview=await tool('edit_transaction',{...e,dryRun:true});return tool('edit_transaction',{...e,previewToken:preview.previewToken});}
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1600,height:1080}});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const check=(name:string,data:any={})=>{report.checks.push({name,passed:true,...data});console.log('PASS',name);};
try{
 await tx(referenceStyleCommands(),'统一图鉴材质');const commands:Command[]=[{op:'renameProject',name:'云山 · 青岚居 / 图鉴结构版'}];
 const asset=(id:string,name:string,template:string,params:any)=>commands.push({op:'createAsset',id,name,template,params,cellSize:.05,style:'courtyard'});
 const instance=(id:string,assetId:string,position:V3,rotation=0)=>commands.push({op:'instance',id,assetId,position,rotation});
 asset('foundation','砖石台基','ref-plinth',{width:6,height:.6,depth:5.6});instance('foundation-i','foundation',[0,0,-.6]);
 asset('floor','室内地坪','ref-plinth',{width:6,height:.25,depth:5});instance('floor-i','floor',[0,.6,0]);
 asset('front','入户开间 · 双侧玻璃','ref-bay',{width:6,height:3.2,depth:.6,openingWidth:1.4,openingHeight:2.25});instance('front-i','front',[0,.6,-.6]);
 asset('side','侧墙','wall',{width:.2,height:2.95,depth:4.8});instance('side-left','side',[0,.85,0]);instance('side-right','side',[5.8,.85,0]);
 asset('window','后墙 · 通风窗','window',{width:6,height:2.95,depth:.2,openingWidth:2.2,openingHeight:1.4,sill:1});instance('back-i','window',[0,.85,4.8]);
 asset('roof','双坡瓦顶 · 山墙收边','ref-gable',{width:6.4,height:1.8,depth:5.8});
 for(const [min,max]of [[[4,0,8],[8,6,104]],[[120,0,8],[124,6,104]]])commands.push({op:'voxels',assetId:'roof',mode:'fill',region:{min,max},material:3});
 instance('roof-i','roof',[-.2,3.8,-.4]);
 asset('stairs','入户五级台阶','stairs',{width:1.4,height:.85,depth:1.8,steps:5});instance('stairs-i','stairs',[2.3,0,-2.4]);
 asset('rail','前廊护栏','railing',{width:1.9,height:.9,depth:.1,spacing:.6});instance('rail-left','rail',[.05,.85,-.6]);instance('rail-right','rail',[4.05,.85,-.6]);
 asset('planter','前庭花槽','planter',{width:1.2,height:.6,depth:.6});instance('planter-left','planter',[.4,0,-1.3]);instance('planter-right','planter',[4.4,0,-1.3]);
 asset('bed','杉木床','bed',{width:1.5,height:.7,depth:2});instance('bed-i','bed',[3.7,.85,2.65]);
 asset('table','书桌','table',{width:1.3,height:.8,depth:.7});instance('table-i','table',[.7,.85,2.6]);
 asset('monitor','能源显示器','monitor',{width:.7,height:.5,depth:.15});instance('monitor-i','monitor',[1,1.65,2.85]);
 commands.push({op:'select',assetId:'front',region:null,partId:null});report.generation=await tx(commands,'由图鉴组件与基础组件拼装可进入民居');check('MCP 原生组件拼装',{modifiedVoxels:report.generation.modifiedVoxels});
 const p=await tool('read_project');await tx([{op:'createAssembly',id:'qinglan-courtyard',name:'青岚居 · 图鉴结构版',instanceIds:Object.keys(p.instances)}],'保存组合模板');
 const geometry=await tool('check_geometry',{clearances:[{name:'门口 1.4m × 2.15m 净空',min:[2.3,.85,-.6],max:[3.7,3,.3]},{name:'首阶上方 2m',min:[2.3,.15,-2.4],max:[3.7,2.15,-2.05]},{name:'顶阶上方 2m',min:[2.3,.85,-1],max:[3.7,2.85,-.6]}]});report.geometry=geometry;assert.equal(geometry.collisions.length,0,JSON.stringify(geometry.collisions));assert.equal(geometry.unsupported.length,0,JSON.stringify(geometry.unsupported));assert.ok(geometry.openings.every((x:any)=>!x.blockedBy.length));assert.ok(geometry.clearances.every((x:any)=>x.clear),JSON.stringify(geometry.clearances));check('实际拼装无碰撞 / 支撑 / 门窗 / 楼梯净空');
 await page.goto(url);await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});await page.evaluate(()=>{(window as any).voxelStudio.view('isometric');(window as any).voxelStudio.ao(true);});await page.waitForTimeout(1400);await page.screenshot({path:'artifacts/reference-study/courtyard-house-editor.png'});await page.locator('#viewport').screenshot({path:'artifacts/reference-study/courtyard-house-exterior.png'});
 await page.evaluate(()=>(window as any).voxelStudio.clip(3.3));await page.waitForTimeout(700);await page.screenshot({path:'artifacts/reference-study/courtyard-house-cutaway.png'});await page.evaluate(()=>(window as any).voxelStudio.view('top'));await page.waitForTimeout(500);await page.locator('#viewport').screenshot({path:'artifacts/reference-study/courtyard-house-interior-top.png'});await page.evaluate(()=>{(window as any).voxelStudio.clip(100);(window as any).voxelStudio.view('isometric');});
 const saved=await tool('save_project',{filename:'courtyard-house.ysvox.json'});await cp(saved.path,'projects/courtyard-house.ysvox.json');const snapshot=await readFile(saved.path,'utf8'),exported=await tool('export_project',{name:'courtyard-house'});await cp(exported.directory,'projects/reference-study/exports/courtyard-house',{recursive:true});
 const change=await tx([{op:'regenerate',assetId:'window',params:{openingWidth:2.8}},{op:'assignMaterial',assetId:'side',fromMaterial:2,material:1},{op:'instance',id:'planter-copy',assetId:'planter',position:[6.3,0,0]},{op:'material',id:11,properties:{color:'#2ccfff',emissive:'#19beed',intensity:.7}}],'整批：加宽窗 / 改墙 / 复制花槽 / 灯带');await page.waitForFunction(v=>(window as any).voxelStudio.version===v&&!!(window as any).voxelStudio.ready,change.version);assert.ok(await page.evaluate(()=>(window as any).voxelStudio.project.instances['planter-copy']));await page.screenshot({path:'artifacts/reference-study/courtyard-house-mcp-batch.png'});await tx([{op:'undo'}],'一次撤销四项修改');
 const undoSaved=await tool('save_project',{filename:'house-undone.ysvox.json'}),before=JSON.parse(snapshot),after=JSON.parse(await readFile(undoSaved.path,'utf8'));assert.deepEqual(after.instances,before.instances);assert.deepEqual(after.materials,before.materials);for(const id of Object.keys(before.assets))assert.deepEqual(after.assets[id].chunks,before.assets[id].chunks);check('图鉴民居 MCP 四项修改同步并一次撤销');
 const visual=await loadMesh({filename:'visual.glb',data:(await readFile(path.join(exported.directory,'visual.glb'))).toString('base64')});report.export={bounds:visual.bounds,triangles:visual.triangles.length};assert.ok(Math.abs(visual.bounds.min[2]+2.4)<1e-5);assert.ok(Math.abs(visual.bounds.max[0]-6.05)<1e-5||visual.bounds.max[0]>6);check('图鉴民居 GLB 重新导入的尺寸与坐标');assert.equal(errors.length,0,errors.join('\n'));report.success=true;
}catch(e:any){report.success=false;report.failure=e.stack;console.error(e);process.exitCode=1;}finally{report.finishedAt=new Date().toISOString();await writeFile('artifacts/reference-study/house-verification.json',JSON.stringify(report,null,2));await writeFile(path.join(root,'server.log'),log);await client.close();await browser.close();processServer.kill('SIGTERM');}
