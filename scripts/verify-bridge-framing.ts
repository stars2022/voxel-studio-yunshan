// Re-capture the two long M019 subjects after fixing the viewer far plane.
// Keep the original clipped images and the unaffected captures' provenance.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,cp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {validationBrowserOptions} from './browser-options';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),out=latest.evidence,index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8'));
const row=index.entries.find((r:any)=>r.id==='BUILT-148'),runtime=path.join(out,'bridge-framing-runtime'),url='http://127.0.0.1:4355',before=path.join(out,'camera-framing-before');
assert.equal(row.sheet,'M019');await mkdir(runtime,{recursive:true});await mkdir(before,{recursive:true});
for(const file of[row.file,'atlas-production-index.json'])await copyFile(path.join('projects',file),path.join(runtime,file));
await cp('projects/reference-atlas',path.join(runtime,'reference-atlas'),{recursive:true});
await copyFile(path.join('projects',row.file),path.join(runtime,'autosave.ysvox.json'));
await copyFile(path.join(out,'bridge-suspension.ysvox.json'),path.join(runtime,'bridge-suspension.ysvox.json'));
const replaced=['screenshots/BUILT-148-isometric.png','screenshots/BUILT-148-front.png','screenshots/BUILT-148-material.png','bridge-suspension-view-0.png','bridge-suspension-view-1.png','mcp-bridge-suspension.png','M019.png','materials.png'];
for(const file of replaced){await mkdir(path.dirname(path.join(before,file)),{recursive:true});try{await copyFile(path.join(out,file),path.join(before,file),1);}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}}
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4355',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const report:any={run:index.run,status:'running',startedAt:new Date().toISOString(),reason:'The fixed 500m far plane clipped the fitted 160m cable and bridge. Viewer.frame now includes the complete bounding sphere.',replaced,originals:'camera-framing-before',errors:[]};
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const builtIndex=await readFile('dist/index.html','utf8'),bundle=builtIndex.match(/src="([^"]+\.js)"/)?.[1];assert.ok(bundle,'Build the client before capturing');
report.clientBundle={file:bundle,sha256:createHash('sha256').update(await readFile(path.join('dist',bundle))).digest('hex')};
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined,client:Client|undefined;
try{
 for(let i=0;i<180;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 client=new Client({name:'bridge-framing-verification',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],env:{...process.env as Record<string,string>,VOXEL_URL:url},cwd:process.cwd(),stderr:'pipe'}));
 const call=async(name:string,args:any={})=>{const r:any=await client!.callTool({name,arguments:args},undefined,{timeout:180000});assert.ok(!r.isError,JSON.stringify(r));return JSON.parse(r.content[0].text);};
 const state=async()=>(await fetch(url+'/api/state').then(r=>r.json())).project;
 browser=await chromium.launch(validationBrowserOptions());report.browser=browser.version();const page=await browser.newPage({viewport:{width:900,height:800}});page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'/?preview=1&flat=1&view=isometric');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready);
 assert.equal(await page.locator('script[type="module"]').getAttribute('src'),bundle);
 report.webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});
 const frames=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.evaluate(async id=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.clay(true);},row.assetId);
 for(const view of['isometric','front']){await page.evaluate(v=>(window as any).voxelStudio.view(v),view);await frames();await page.locator('#viewport').screenshot({path:path.join(out,'screenshots',row.id+'-'+view+'.png')});}
 const initial=await state(),changed=await call('edit_transaction',{expectedVersion:initial.version,requestId:crypto.randomUUID(),commands:[{op:'palette',name:'参考材质试作'}]});
 await page.waitForFunction(v=>(window as any).voxelStudio.performance.renderedVersion===v,changed.version);
 await page.evaluate(()=>{const v=(window as any).voxelStudio;v.clay(false);v.studio(true);v.referenceLighting(true);v.ao(false);v.bloom(false);v.view('isometric');});await frames();
 await page.locator('#viewport').screenshot({path:path.join(out,'screenshots',row.id+'-material.png')});assert.equal(hash((await state()).assets),hash(initial.assets));report.nativeGeometryUnchanged=true;
 const loaded=await call('load_project',{filename:'bridge-suspension.ysvox.json',expectedVersion:(await state()).version});
 await page.waitForFunction(v=>(window as any).voxelStudio.performance.renderedVersion===v,loaded.version);
 await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(true);v.view('isometric');});await frames();
 const previews=await call('generate_previews',{appearance:'baseColor',views:['isometric','front']});assert.equal(previews.files.length,2);
 for(let i=0;i<2;i++)await copyFile(previews.files[i],path.join(out,'bridge-suspension-view-'+i+'.png'));report.scenePreviews=previews;
 const ui=await browser.newPage({viewport:{width:1600,height:1050}});ui.on('pageerror',e=>report.errors.push(e.message));await ui.goto(url+'/?flat=1&view=isometric');await ui.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});await ui.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(true);v.view('isometric');});await ui.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await ui.screenshot({path:path.join(out,'mcp-bridge-suspension.png')});await ui.close();
 for(const name of['M019','materials']){const p=await browser.newPage({viewport:{width:2200,height:1300}});await p.goto(pathToFileURL(path.resolve(out,name+'.html')).href);await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});await p.close();}
 const meta=JSON.parse(await readFile(path.join(out,'previews.json'),'utf8'));assert.equal(meta.browser,report.browser);assert.equal(meta.webgl,report.webgl);meta.framingCorrection={report:'camera-framing-verification.json',ids:['BUILT-148'],newCaptures:3,unaffectedCaptures:36};await writeFile(path.join(out,'previews.json'),JSON.stringify(meta,null,2));
 assert.equal(await readFile('dist/index.html','utf8'),builtIndex,'Client build changed while capturing');
 assert.deepEqual(report.errors,[]);report.status='passed';report.completedAt=new Date().toISOString();console.log(JSON.stringify({status:report.status,replaced}));
}catch(e){report.status='failed';report.errors.push(String(e));throw e;}finally{await browser?.close();await client?.close();server.kill('SIGTERM');await writeFile(path.join(out,'camera-framing-verification.json'),JSON.stringify(report,null,2));await writeFile(path.join(out,'camera-framing-server.log'),log);}
