import express from 'express';
import {atlasFile,readAtlasIndex} from '../production/atlas';
import {WebSocketServer} from 'ws';
import {Worker} from 'node:worker_threads';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir,readdir,realpath,lstat,open,unlink} from 'node:fs/promises';
import {unlinkSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv from 'ajv';
import {toolDefinitions} from '../core/schema';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),root=path.resolve(process.env.VOXEL_PROJECT_DIR??path.join(base,'projects')),port=Number(process.env.VOXEL_PORT??4317);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('无效端口');await mkdir(root,{recursive:true});if(await realpath(root)!==root)throw new Error('项目根目录不允许符号链接');
for(const d of['sources','previews']){await mkdir(path.join(root,d),{recursive:true});if(await realpath(path.join(root,d))!==path.join(root,d))throw new Error('拒绝符号链接子目录');}
const lockPath=path.join(root,'.yunshan.lock');
try{const lock=await open(lockPath,'wx');await lock.writeFile(JSON.stringify({pid:process.pid,port}));await lock.close();}catch(e:any){if(e.code!=='EEXIST')throw e;if((await lstat(lockPath)).isSymbolicLink())throw new Error('拒绝锁文件符号链接');const owner=JSON.parse(await readFile(lockPath,'utf8'));let alive=true;try{process.kill(owner.pid,0);}catch(err:any){if(err.code==='ESRCH')alive=false;else throw err;}if(alive)throw new Error(`该项目目录已有编辑服务（PID ${owner.pid}，端口 ${owner.port}），请复用已有服务。`);await unlink(lockPath);const lock=await open(lockPath,'wx');await lock.writeFile(JSON.stringify({pid:process.pid,port}));await lock.close();}
process.on('exit',()=>{try{unlinkSync(lockPath);}catch{}});
const app=express(),http=createServer(app),wss=new WebSocketServer({noServer:true}),worker=new Worker(new URL('./document-worker.mjs',import.meta.url),{workerData:{root}}),pending=new Map<string,{resolve:Function,reject:Function}>();
let readyResolve:()=>void;const ready=new Promise<void>(r=>readyResolve=r);
const rpc=(method:string,args:any={})=>new Promise<any>((resolve,reject)=>{const id=randomUUID();pending.set(id,{resolve,reject});worker.postMessage({id,method,args});});
worker.on('message',msg=>{if(msg.event==='ready')readyResolve();else if(msg.event==='changed'){for(const client of wss.clients)if(client.readyState===1)client.send(JSON.stringify(msg.data));}else{const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Object.assign(new Error(msg.error.message),msg.error)):p.resolve(msg.result);}}});
worker.on('error',e=>{for(const p of pending.values())p.reject(e);pending.clear();console.error('Document worker failed:',e);});
const trusted=(host?:string,origin?:string)=>!!host&&[`127.0.0.1:${port}`,`localhost:${port}`].includes(host)&&(!origin||[`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(origin));
app.use((req,res,next)=>{if(!trusted(req.headers.host,req.headers.origin))return res.status(403).json({error:'仅允许本地同源访问'});next();});
app.use(express.json({limit:'60mb'}));
http.on('upgrade',(req,socket,head)=>{if(!trusted(req.headers.host,req.headers.origin)||req.url!=='/ws'){socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
const ajv=new Ajv({strict:false}),validators=new Map(toolDefinitions.map(t=>[t.name,ajv.compile(t.inputSchema)]));
type Job={id:string;status:string;sourceId:string;options:any;worker?:Worker;diagnostics?:any;progress?:any;result?:any;error?:string;createdAt:string};const jobs=new Map<string,Job>();
const jobRequests=new Map<string,{hash:string,id:string}>();
async function sourceFile(id:string){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new Error('无效源 ID');const f=path.join(root,'sources',id+'.json');if((await lstat(f)).isSymbolicLink())throw new Error('拒绝符号链接源');return JSON.parse(await readFile(f,'utf8'));}
async function startJob(args:any,inspect=false){
 if(!inspect){const prev=jobRequests.get(args.requestId),hash=JSON.stringify(args);if(prev){if(prev.hash!==hash)throw new Error('导入 requestId 已用于不同参数');const old=jobs.get(prev.id);if(!old)throw new Error('任务预览已过期，请使用新 requestId');return{id:old.id,status:old.status};}}
 while(jobs.size>=8){const old=[...jobs.values()].find(j=>j.status!=='running');if(!old)break;jobs.delete(old.id);}
 if([...jobs.values()].filter(j=>j.status==='running').length>=2)throw new Error('最多同时运行 2 个转换任务');const source=await sourceFile(args.sourceId),state=await rpc('state');
 if(!inspect&&args.expectedVersion!==state.project.version)throw Object.assign(new Error('导入版本冲突'),{code:'VERSION_CONFLICT'});
 const id=randomUUID(),options={...args,assetId:'import-'+id.slice(0,8),materialStart:Math.max(...Object.keys(state.project.materials).map(Number),0)+1};
 const job:Job={id,status:'running',sourceId:args.sourceId,options,createdAt:new Date().toISOString()};jobs.set(id,job);const w=new Worker(new URL('./import-worker.mjs',import.meta.url),{workerData:{source,options,inspect}});job.worker=w;
 if(!inspect){jobRequests.set(args.requestId,{hash:JSON.stringify(args),id});if(jobRequests.size>100)jobRequests.delete(jobRequests.keys().next().value!);}
 w.on('message',m=>{if(job.status!=='running')return;if(m.type==='diagnostics')job.diagnostics=m.diagnostics;else if(m.type==='progress')job.progress=m.value;else if(m.type==='result'){job.result=m.result;job.status='completed';if(job.result.asset)job.result.asset.source.originalSourceId=args.sourceId;void w.terminate();}else if(m.type==='error'){job.error=m.error;job.diagnostics=m.diagnostics??job.diagnostics;job.status='failed';void writeFile(path.join(root,'sources',`failure-${id}.json`),JSON.stringify({options,diagnostics:job.diagnostics,error:job.error},null,2));void w.terminate();}});
 w.on('error',e=>{job.error=e.message;job.status='failed';});w.on('exit',code=>{if(job.status==='running'){job.status='failed';job.error=`后台任务意外退出 ${code}`;}});return{id,status:'running'};
}
const publicJob=(job:Job)=>{const {worker,...rest}=job;return rest;};
async function callTool(name:string,args:any){
 const validate=validators.get(name);if(!validate||!validate(args))throw Object.assign(new Error(validate?ajv.errorsText(validate.errors):'未知工具'),{code:'INVALID_INPUT'});
 if(name==='import_mesh')return startJob(args);
 if(name==='job_status'||name==='cancel_job'||name==='commit_import'){
  const job=jobs.get(String(args.jobId));if(!job)throw new Error('任务不存在');
  if(name==='job_status')return publicJob(job);
  if(name==='cancel_job'){if(job.status==='running'){job.status='cancelled';await job.worker?.terminate();job.worker=undefined;}return{jobId:job.id,status:job.status};}
  if(job.status!=='completed'||!job.result?.asset)throw new Error('导入结果不可提交');const result=await rpc('edit_transaction',{expectedVersion:args.expectedVersion,requestId:args.requestId,dryRun:args.dryRun,previewToken:args.previewToken,label:'导入 '+job.options.name,commands:[{op:'installAsset',asset:job.result.asset,materials:job.result.materials}]});return result;
 }
 if(name==='generate_previews'){
  const captured=(await rpc('state')).project;if(args.assetId&&!captured.assets[String(args.assetId)])throw new Error('预览资产不存在');
  const {chromium}=await import('playwright');const browser=await chromium.launch({headless:true}),directory=path.join(root,'previews',randomUUID());await mkdir(directory);
  const version=captured.version,appearance=args.appearance??'baseColor',lighting=args.lighting??'standard',meshMode=String(args.meshMode??'near'),effects=!!args.effects;
  try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),query=new URLSearchParams({preview:'1',flat:appearance==='material'?'0':'1',look:lighting==='soft'?'reference':'standard',ao:effects?'1':'0',bloom:effects?'1':'0',time:lighting==='night'?'night':'day',mesh:meshMode});if(args.assetId)query.set('asset',String(args.assetId));
   await page.goto(`http://127.0.0.1:${port}/?${query}`);await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,{},{timeout:60000});
   const files=[];for(const view of (args.views as string[]|undefined)??['perspective','front','back','left','right','top','bottom']){
    if((await rpc('state')).project.version!==version)throw new Error('预览期间文档变化，请重试');
    await page.evaluate(v=>(window as any).voxelStudio.view(v),view);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const file=path.join(directory,view+'.png');await page.locator('#viewport').screenshot({path:file});files.push(file);
   }
   if((await rpc('state')).project.version!==version)throw new Error('预览期间文档变化，请重试');return{version,assetId:args.assetId??null,appearance,lighting,meshMode,effects,files};
  }finally{await browser.close();}
 }
 return rpc(name,args);
}
const wrap=(fn:Function)=>(req:any,res:any)=>Promise.resolve(fn(req,res)).catch((e:any)=>res.status(e.code==='VERSION_CONFLICT'?409:400).json({error:e.message,code:e.code??'OPERATION_FAILED',details:e.details}));
app.get('/api/state',wrap(async(_:any,res:any)=>res.json(await rpc('state'))));
app.get('/api/tools',(_:any,res:any)=>res.json(toolDefinitions));
app.get('/api/reference-atlas/:sheet.png',wrap(async(req:any,res:any)=>{const id=String(req.params.sheet);if(!/^M\d{3}$/.test(id))throw new Error('图册编号无效');const atlas=await readAtlasIndex(root),sheet=atlas?.sheets.find(s=>s.id===id);if(!sheet||sheet.file!==`images/${id}.png`)throw new Error('图册不存在');res.setHeader('Cache-Control','no-cache');res.sendFile(await atlasFile(root,'reference-atlas/'+sheet.file));}));
app.get('/api/files',wrap(async(_:any,res:any)=>res.json((await readdir(root)).filter(n=>n.endsWith('.ysvox.json')))));
app.post('/api/tool',wrap(async(req:any,res:any)=>res.json(await callTool(req.body.name,req.body.arguments??{}))));
app.post('/api/load',wrap(async(req:any,res:any)=>res.json(await rpc('load_project',req.body))));
app.post('/api/upload',wrap(async(req:any,res:any)=>{const {filename,data,resources}=req.body;if(typeof filename!=='string'||filename.length>160||!/^.+\.(glb|gltf|obj)$/i.test(filename)||typeof data!=='string'||data.length>54_000_000||!data.length)throw new Error('源文件格式或大小无效');if(resources&&Object.entries(resources).some(([k,v])=>k.length>200||typeof v!=='string'||v.length>30_000_000))throw new Error('伴随资源无效');const id=randomUUID();await writeFile(path.join(root,'sources',id+'.json'),JSON.stringify({filename:path.basename(filename),data,resources}));res.json({sourceId:id,filename});}));
app.post('/api/inspect',wrap(async(req:any,res:any)=>{const body=req.body;if(!Number.isFinite(body.cellSize)||body.cellSize<.01||body.cellSize>1||!Number.isFinite(body.scale)||body.scale<=0||body.scale>50||!['Y','Z'].includes(body.upAxis))throw new Error('检查参数无效');res.json(await startJob(body,true));}));
app.get('/api/job/:id',wrap(async(req:any,res:any)=>{const job=jobs.get(req.params.id);if(!job)throw new Error('任务不存在');res.json(publicJob(job));}));
const production=await import('node:fs').then(fs=>fs.existsSync(path.join(base,'dist','index.html')));
if(production){app.use(express.static(path.join(base,'dist')));app.get('/',(_:any,res:any)=>res.sendFile(path.join(base,'dist','index.html')));}else{const {createServer}=await import('vite');const vite=await createServer({configFile:path.join(base,'vite.config.ts'),server:{middlewareMode:true,hmr:{server:http}},appType:'spa'});app.use(vite.middlewares);}
await ready;await new Promise<void>(resolve=>http.listen(port,'127.0.0.1',resolve));console.log(`云山体素编辑器 http://127.0.0.1:${port}  · 项目目录 ${root}`);
process.on('SIGTERM',()=>{for(const job of jobs.values())void job.worker?.terminate();void worker.terminate();http.close();process.exit();});
