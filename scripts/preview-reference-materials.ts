import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const root=path.resolve('artifacts/material-study'),index=JSON.parse(await readFile(path.join(root,'latest.json'),'utf8')),runtime=path.join(root,'runtime-'+index.run),url='http://127.0.0.1:4343';
const full=process.argv.includes('--full'),pilots=['finish-architecture-A01','finish-architecture-A05','finish-architecture-B11','finish-furniture-01-bed','finish-furniture-04-sofa','finish-furniture-07-desk'];
const rows=index.studies.filter((s:any)=>full?!s.id.includes('gallery'):pilots.includes(s.id));
await mkdir(runtime,{recursive:true});await mkdir(path.join(root,'screenshots'),{recursive:true});
for(const row of rows)for(const name of[row.file,row.originalFile])await copyFile(path.join('projects',name),path.join(runtime,name));
await copyFile(path.join(runtime,rows[0].file),path.join(runtime,'autosave.ysvox.json'));
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4343',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
const report:any={run:index.run,mode:full?'40 designs':'six pilots',items:[],errors:[]};
try{
 for(let i=0;i<150;i++){try{if((await fetch(url+'/api/state')).ok)break;}catch{}if(server.exitCode!==null)throw new Error(log);await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1080,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(url+'/?preview=1&material=1&ao=1&bloom=1&view=isometric&look=reference');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});
 const open=async(file:string)=>{const p=await fetch(url+'/api/state').then(r=>r.json()),r=await fetch(url+'/api/load',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file,expectedVersion:p.project.version})}),loaded=await r.json();assert.ok(r.ok,JSON.stringify(loaded));await page.waitForFunction(v=>(window as any).voxelStudio?.performance.renderedVersion===v,loaded.version,{timeout:120000});await page.evaluate(async()=>{const v=(window as any).voxelStudio;await v.mode('scene');v.clay(false);v.studio(true);v.referenceLighting(true);v.ao(true);v.bloom(true);v.practicals(false);v.view('isometric');});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
 for(const row of rows){
  const files:any={};
  for(const mode of full?['after']:['before','after']){
   await open(mode==='before'?row.originalFile:row.file);const file=row.id+'-'+mode+'.png';await page.locator('#viewport').screenshot({path:path.join(root,'screenshots',file)});files[mode]=file;
  }
  const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(perf.meshError,null);report.items.push({id:row.id,name:row.name,group:row.group,files,performance:perf});console.log('CAPTURED '+row.name);
 }
 const groups=full?['建筑主体','立面细部','家居']:['pilot'];
 for(const group of groups){
  const chosen=full?report.items.filter((x:any)=>x.group.includes(group)):report.items;
  const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#d9dad7;color:#283a33;font:16px system-ui,'PingFang SC'}header{padding:26px 32px}h1{margin:0 0 8px}main{display:grid;grid-template-columns:repeat(${full?4:2},1fr)}figure{margin:0;border:1px solid #b2b8b1}img{display:block;width:100%}figcaption{padding:14px 22px}b{font-size:22px}small{display:block;margin-top:7px}footer{padding:22px 32px}</style><header><h1>云山 · ${full?group+'材质试作':'材质处理前 / 后 · 同机位与同光照'}</h1>实际编辑器截图 · 同一份体素几何 · PBR 材质 / 棚光 / SSAO / 小幅辉光 · 无图像重绘</header><main>${chosen.flatMap((r:any)=>(full?['after']:['before','after']).map(mode=>`<figure><img src="screenshots/${r.files[mode]}"><figcaption><b>${r.name.replace(' · 材质','')} · ${mode==='before'?'原始参数':'处理后'}</b><small>几何、材质 ID、部件与接口保持一致</small></figcaption></figure>`)).join('')}</main><footer>玻璃为透明混合；没有真实折射、GI 或离线渲染。轮廓、内景与构造差异仍需几何处理。</footer>`;
  const file=path.join(root,group+'.html');await writeFile(file,html);const sheet=await browser.newPage({viewport:{width:full?2200:1700,height:1100}});await sheet.goto(pathToFileURL(file).href);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:path.join(root,group+'.png'),fullPage:true});await sheet.close();
 }
 assert.deepEqual(report.errors,[]);await writeFile(path.join(root,full?'all-previews.json':'pilot.json'),JSON.stringify(report,null,2));
}finally{await browser?.close();server.kill('SIGTERM');await writeFile(path.join(root,'preview-server.log'),log);}
