import {templateCatalog} from '../core/templates';
import {catalogSummary,queryCatalog} from '../core/catalog';
import {templateParameters} from '../core/template-parameters';
import {parentPort,workerData} from 'node:worker_threads';
import {readFile,writeFile,rename,mkdir,copyFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {Engine,EditError,validateProject} from '../core/engine';
import {demoProject} from '../core/demo';
import {Grid} from '../core/grid';
import {checkGeometry} from '../core/checks';
import {exportProject} from '../export/exporter';
import type {Envelope,Project} from '../core/types';
import {readProductionLibrary,productionRecipes} from '../production/library';
import {readReferenceAtlas} from '../production/atlas';
const root=path.resolve(workerData.root);await mkdir(root,{recursive:true});
let engine=new Engine(demoProject()),recoveryInfo={recovered:false,from:'demo',warning:''};
async function safeFile(filename:string){if(!/^[a-zA-Z0-9_-]{1,80}\.ysvox\.json$/.test(filename))throw new Error('只允许项目目录内的 .ysvox.json 文件名');const target=path.join(root,filename);try{if((await lstat(target)).isSymbolicLink())throw new Error('拒绝符号链接');}catch(e:any){if(e.code!=='ENOENT')throw e;}return target;}
async function atomic(filename:string,data:string){const target=await safeFile(filename),temp=target+'.'+process.pid+'.tmp';await writeFile(temp,data,{flag:'wx'});await rename(temp,target);}
async function autosave(){try{await copyFile(await safeFile('autosave.ysvox.json'),await safeFile('recovery.ysvox.json'));}catch(e:any){if(e.code!=='ENOENT')throw e;}await atomic('autosave.ysvox.json',JSON.stringify({...engine.project,session:{undo:engine.undoStack,redo:engine.redoStack,idempotency:[...engine.idempotency]}}));}
for(const file of['autosave.ysvox.json','recovery.ysvox.json']){try{const p=JSON.parse(await readFile(await safeFile(file),'utf8'));engine=new Engine(p);if(p.session){engine.undoStack=p.session.undo??[];engine.redoStack=p.session.redo??[];engine.idempotency=new Map(p.session.idempotency??[]);}delete (engine.project as any).session;recoveryInfo={recovered:true,from:file,warning:recoveryInfo.warning};break;}catch(e:any){if(e.code!=='ENOENT')recoveryInfo.warning+=`${file}: ${e.message}; `;}}
const summary=()=>Object.values(engine.project.assets).map(a=>{const g=new Grid(a.chunks);return{id:a.id,name:a.name,category:a.category,version:a.version,cellSizeM:a.cellSize,originM:a.origin,boundsCells:g.bounds(),voxelCount:g.count,chunks:g.chunks.size,template:a.template,ports:a.ports,parts:a.parts,instanceCount:Object.values(engine.project.instances).filter(i=>i.assetId===a.id).length};});
async function handle(method:string,args:any){
 const p=engine.project;
 if(method==='state')return{project:p,history:{undo:engine.undoStack.length,redo:engine.redoStack.length},recovery:recoveryInfo};
 if(method==='list_assets')return{templates:Object.fromEntries(Object.entries(templateCatalog).map(([id,name])=>[id,{name,parameters:templateParameters(id),dimensionUnit:'metres',integerParameters:['detail','glass','steps']} ])),version:p.version,assets:summary(),assemblies:p.assemblies??{},instances:Object.values(p.instances),palettes:Object.keys(p.palettes),counts:{uniqueAssets:Object.keys(p.assets).length,placements:Object.keys(p.instances).length,assemblies:Object.keys(p.assemblies??{}).length}};
 if(method==='read_catalog')return queryCatalog(p,args);
 if(method==='read_production_library')return readProductionLibrary(root,args);
 if(method==='read_reference_atlas')return readReferenceAtlas(root,p,args);
 if(method==='list_production_recipes')return productionRecipes(p,args);
 if(method==='read_project'){if(args.includeVoxels)return p;return{...p,assets:summary(),catalog:catalogSummary(p)};}
 if(method==='query_voxels'){const a=p.assets[args.assetId];if(!a)throw new Error('资产不存在');const cells=[...new Grid(a.chunks).cells(args.region)];return{version:p.version,cellSizeM:a.cellSize,originM:a.origin,total:cells.length,cells:cells.slice(args.offset??0,(args.offset??0)+(args.limit??1000)),nextOffset:(args.offset??0)+(args.limit??1000)<cells.length?(args.offset??0)+(args.limit??1000):null};}
 if(method==='query_materials_interfaces')return{version:p.version,materials:p.materials,styles:p.styles,palettes:p.palettes,assets:args.assetId?[p.assets[args.assetId]].filter(Boolean).map(a=>({id:a.id,parts:a.parts,ports:a.ports,openings:a.openings})):summary().map(a=>({id:a.id,parts:a.parts,ports:a.ports}))};
 if(method==='edit_transaction'){
  const before={project:engine.project,undo:[...engine.undoStack],redo:[...engine.redoStack],idempotency:new Map(engine.idempotency)};const result=engine.execute(args as Envelope);
  if(!result.dryRun&&engine.project!==before.project){try{await autosave();}catch(error){engine.project=before.project;engine.undoStack=before.undo;engine.redoStack=before.redo;engine.idempotency=before.idempotency;throw error;}parentPort!.postMessage({event:'changed',data:{project:engine.project,result,history:{undo:engine.undoStack.length,redo:engine.redoStack.length}}});}return result;
 }
 if(method==='check_geometry')return checkGeometry(p,args.clearances);
 if(method==='save_project'){await atomic(args.filename,JSON.stringify(p));return{version:p.version,filename:args.filename,path:path.join(root,args.filename)};}
 if(method==='load_project'){
  if(args.expectedVersion!==p.version)throw new EditError('VERSION_CONFLICT','加载前版本已变化');const data=JSON.parse(await readFile(await safeFile(args.filename),'utf8'));validateProject(data);await atomic('before-load.ysvox.json',JSON.stringify(p));
  const oldEngine=engine;delete data.session;engine=new Engine({...data,version:p.version+1});engine.undoStack=[{label:'恢复项目',document:JSON.stringify(p)}];try{await autosave();}catch(error){engine=oldEngine;throw error;}parentPort!.postMessage({event:'changed',data:{project:engine.project,result:{label:'恢复项目'},history:{undo:1,redo:0}}});return{version:engine.project.version,filename:args.filename};
 }
 if(method==='export_project'){
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(args.name))throw new Error('导出名称无效');const exports=path.join(root,'exports');await mkdir(exports,{recursive:true});if((await realpath(exports))!==exports)throw new Error('拒绝导出目录符号链接');const directory=path.join(exports,args.name);try{if((await lstat(directory)).isSymbolicLink())throw new Error('拒绝符号链接');}catch(e:any){if(e.code!=='ENOENT')throw e;}
  // A fresh directory prevents overwriting symlinked output entries.
  await mkdir(directory);return exportProject(p,directory,args.assetId);
 }
 throw new Error('未知文档方法');
}
let queue=Promise.resolve();parentPort!.on('message',message=>{queue=queue.then(async()=>{try{parentPort!.postMessage({id:message.id,result:await handle(message.method,message.args??{})});}catch(e:any){parentPort!.postMessage({id:message.id,error:{code:e.code??'OPERATION_FAILED',message:e.message,details:e.details}});}});});
parentPort!.postMessage({event:'ready'});
