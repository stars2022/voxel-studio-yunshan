import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {chromium} from 'playwright';
const out='artifacts/atlas/atlas-20261007063858',runtime=out+'/variant-mcp-runtime',url='http://127.0.0.1:4401',sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4401',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;server.stdout!.on('data',b=>log+=b);server.stderr!.on('data',b=>log+=b);
const report:any={status:'running',run:'atlas-20261007063858',captures:[],errors:[]};
try{
 for(let i=0;i<300;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1400,height:1000}});page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'/?atlas=1&flat=1&view=back');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready);
 for(const id of ['BUILT-171','BUILT-172']){
  const state=await fetch(url+'/api/state').then(r=>r.json());const res=await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'load_project',arguments:{filename:'atlas-20261007063858-'+id.toLowerCase()+'.ysvox.json',expectedVersion:state.project.version}})});assert.ok(res.ok,await res.clone().text());const loaded=await res.json();
  await page.waitForFunction(v=>(window as any).voxelStudio.performance.renderedVersion===v,loaded.version);
  await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(true);v.studio(false);v.referenceLighting(false);v.ao(false);v.bloom(false);v.view('back');});
  for(let frame=0;frame<6;frame++)await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const file='variant-'+id+'-back-rechecked.png';const clip=await page.locator('#viewport').boundingBox();assert.ok(clip);await page.screenshot({path:out+'/'+file,clip});const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(perf.renderedVersion,loaded.version);assert.equal(perf.meshError,null);assert.equal(perf.triangles,48);
  report.captures.push({id,file,sha256:sha(await readFile(out+'/'+file)),renderedVersion:perf.renderedVersion,triangles:perf.triangles,visibleAssetIds:perf.assetIds,nativeSHA256:sha(await readFile('projects/atlas-20261007063858-'+id.toLowerCase()+'.ysvox.json')),frameWait:12});
 }
 await page.close();
 await mkdir(out+'/history/board-label-before',{recursive:true});for(const ext of ['html','png'])await copyFile(out+'/M061.'+ext,out+'/history/board-label-before/M061.'+ext);
 let html=await readFile(out+'/M061.html','utf8');html=html.replace('按参考图重建的 10 件三维候选','10 项参数变体（含原三盒载具代理）').replace('几何候选，尚未通过人工美术验收。','本批完成 M061 的 10/12 条参考；载具按原三盒代理合同制作，完整载具另见 M048。技术候选，尚未通过人工美术验收。');await writeFile(out+'/M061.html',html);
 const board=await browser.newPage({viewport:{width:2200,height:1300}});await board.goto(pathToFileURL(path.resolve(out+'/M061.html')).href);await board.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await board.screenshot({path:out+'/M061.png',fullPage:true});await board.close();report.board={file:'M061.png',sha256:sha(await readFile(out+'/M061.png')),change:'Accurate scope label; all source model captures unchanged.'};assert.deepEqual(report.errors,[]);report.status='passed';
}finally{await browser?.close();if(server.exitCode===null){const done=once(server,'exit');server.kill();await done;}await writeFile('work/m061/review-captures-server.txt',log);await writeFile(out+'/capture-recheck.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
