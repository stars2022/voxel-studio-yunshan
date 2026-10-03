import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Engine,validateProject} from '../src/core/engine';
import {productionProject} from '../src/production/style';
import {referenceFurniture} from '../src/production/reference-furniture';
import {parseCatalogCSV} from '../src/core/catalog';
import {makeFlowerAsset,lifeRecipes} from '../src/production/life';
import {layoutDependencies,lifeLayouts,nativeLifeId} from '../src/production/layouts';
import {meshAsset} from '../src/core/mesh';
import {Grid} from '../src/core/grid';
import {exportProject} from '../src/export/exporter';
import type {Asset,Command,Project} from '../src/core/types';
import type {ProductionIndex,LibraryEntry} from '../src/production/library';

const started=performance.now(),tag='life-'+new Date().toISOString().replace(/\D/g,'').slice(0,14),root=path.resolve('projects'),out=path.join(root,'production',tag),csv=await readFile(path.join(root,'catalog/city-assets.csv'),'utf8'),rows=parseCatalogCSV(csv),hash=(v:unknown)=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
await mkdir(out,{recursive:true});await mkdir('artifacts/production',{recursive:true});
const entryMap=new Map(rows.map(r=>[r.id,r])),models=rows.filter(e=>e.id.startsWith('LIFE-')&&e.source['条目类型']==='基础组件'),layouts=rows.filter(e=>e.id.startsWith('LIFE-')&&e.source['条目类型']==='组合模板');
assert.equal(models.length,Object.keys(lifeRecipes).length);assert.equal(layouts.length,Object.keys(lifeLayouts).length);
const index:ProductionIndex={format:'yunshan.production-index',version:1,createdAt:new Date().toISOString(),sourceSHA256:hash(csv),counts:{catalogEntries:rows.length,baseModels:0,auxiliaryMasters:1,assemblies:0,variantEntries:0,variantModels:0,accepted:0,notProduced:rows.length},entries:rows.map(e=>({id:e.id,name:e.source['中文名称'],type:e.source['条目类型'],stage:'not-produced',assetIds:[],note:e.source['条目类型']==='动画特效'?'尚未实现动画和运行状态接入。':e.source['条目类型']==='材质贴图'?'材质细化留待后续统一处理。':'尚未制作；不以占位体或实例计数。'})),packs:[],metrics:{environment:{cpu:os.cpus()[0].model,memoryBytes:os.totalmem(),platform:os.platform(),release:os.release(),node:process.version},run:tag}};
const indexById=new Map(index.entries.map(e=>[e.id,e])),all=new Map<string,Asset>(),stats:any[]=[],geometryHashes=new Map<string,string>(),nativeFiles:{file:string;sha256:string;bytes:number}[]=[];
function blank(name:string){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:index.createdAt,entries:Object.fromEntries(rows.map(e=>[e.id,structuredClone(e)]))};return p;}
function commit(engine:Engine,commands:Command[],label:string){const e={expectedVersion:engine.project.version,requestId:crypto.randomUUID(),commands,label},preview=engine.execute({...e,dryRun:true}),result=engine.execute({...e,previewToken:preview.previewToken});return result;}
async function save(p:Project,file:string){validateProject(p);const json=JSON.stringify(p);await writeFile(path.join(root,file),json,{flag:'wx'});nativeFiles.push({file,sha256:hash(json),bytes:Buffer.byteLength(json)});}
function link(p:Project,id:string,assetIds:string[],note:string){Object.assign(p.catalog!.entries[id],{stage:'modeling',assetIds,note});}
for(let start=0;start<models.length;start+=24){
 const batch=models.slice(start,start+24),engine=new Engine(blank(`云山 · 生活模型 ${start+1}–${start+batch.length}`)),t=performance.now();
 const result=commit(engine,batch.map(e=>({op:'produceCatalogAsset',catalogId:e.id,id:nativeLifeId(Number(e.id.slice(5)))})),'批量生成生活基础组件');
 const file=`${tag}-models-${String(start/24+1).padStart(2,'0')}.ysvox.json`;
 for(const[e,a]of batch.map(e=>[e,engine.project.assets[nativeLifeId(Number(e.id.slice(5)))]] as const)){
  all.set(a.id,a);const g=new Grid(a.chunks),t=performance.now(),meshes=meshAsset(a,engine.project.materials),geometrySHA256=hash(a.chunks),triangles=meshes.reduce((n,b)=>n+b.indices.length/3,0);
  // Detect duplicate native geometry + colours; no silent aliases counted as new models.
  assert.ok(!geometryHashes.has(geometrySHA256),`${a.id} duplicates ${geometryHashes.get(geometrySHA256)}`);geometryHashes.set(geometrySHA256,a.id);
  const item={id:e.id,assetId:a.id,voxels:g.count,boundsCells:g.bounds(),cellSizeM:a.cellSize,triangles,meshingMs:performance.now()-t,geometrySHA256,features:a.source!.features};stats.push(item);
  Object.assign(indexById.get(e.id)!,{stage:'geometry-candidate',file,assetIds:[a.id],voxels:g.count,triangles,sha256:geometrySHA256,note:a.source!.features+'。几何候选；未做游戏功能点、LOD、动画与人工美术验收。'});
  const j=batch.indexOf(e);engine.project.instances['gallery-'+a.id]={id:'gallery-'+a.id,assetId:a.id,name:a.name,position:[(j%6)*3.6,0,Math.floor(j/6)*3.6],rotation:0,parent:null};
 }
 engine.project.selection={assetId:nativeLifeId(Number(batch[0].id.slice(5))),region:null,partId:null};await save(engine.project,file);index.packs.push({file,name:engine.project.name,entries:batch.length,uniqueMasters:batch.length});
 console.log(`MODEL PACK ${start/24+1}: ${batch.length} masters, ${result.modifiedVoxels} native cells, ${(performance.now()-t).toFixed(0)} ms`);
}
all.set('support-flower',makeFlowerAsset(blank('').styles.yunshan));
for(const entry of layouts){
 const n=Number(entry.id.slice(5)),p=blank('云山 · '+entry.source['中文名称']);
 for(const id of layoutDependencies(n)){const a=all.get(id);assert.ok(a,'Missing '+id);p.assets[id]=structuredClone(a);if(a.source?.catalogId)link(p,String(a.source.catalogId),[id],'复用已生成生活母版；几何候选。');}
 const engine=new Engine(p),assemblyId=entry.id.toLowerCase(),t=performance.now();commit(engine,[{op:'produceCatalogAssembly',catalogId:entry.id,id:assemblyId,place:true}],'生成陈设组合');
 engine.project.selection={assetId:Object.keys(p.assets)[0],region:null,partId:null};const file=`${tag}-scene-${String(n).padStart(3,'0')}.ysvox.json`;await save(engine.project,file);
 Object.assign(indexById.get(entry.id)!,{stage:'layout-candidate',file,assemblyId,assetIds:Object.keys(p.assets),note:'可编辑相对陈设组合，复用 '+Object.keys(p.assets).length+' 个母版。未适配真实 FloorPlan / 功能点；静态摆放不代表行为或库存已接入。'});
 index.packs.push({file,name:p.name,entries:1,uniqueMasters:Object.keys(p.assets).length});console.log(`ASSEMBLY ${entry.id}: ${Object.keys(engine.project.instances).length} placements, ${(performance.now()-t).toFixed(0)} ms`);
}
// Four catalog variant families, nine regenerated derived objects; never counted as bases.
const variants:Record<number,[number,number,number,number,number][]>={33:[[16,1.8,0,0,0]],34:[[14,1.4,0,0,0],[15,1.4,0,.42,0]],35:[[1,2,0,0,0],[2,1.88,.06,.42,.06],[3,2,0,0,2.02],[4,1.88,.06,.62,.06]],36:[[10,2.4,0,0,0],[11,2.18,.11,.28,.04]]};
for(const[n,items]of Object.entries(variants)){
 const cid='LIFE-'+n.padStart(3,'0'),engine=new Engine(blank('云山 · '+entryMap.get(cid)!.source['中文名称'])),commands:Command[]=[];
 for(const[id,width,x,y,z]of items){const assetId=nativeLifeId(id)+'-size-'+n;commands.push({op:'produceCatalogAsset',catalogId:'LIFE-'+String(id).padStart(3,'0'),id:assetId,params:{width}},{op:'instance',id:'variant-'+assetId,assetId,position:[x,y,z].map(v=>Math.round(v/.02)*.02)});}
 commit(engine,commands,'重建尺寸变体');for(const a of Object.values(engine.project.assets)){a.source!.variantOf=nativeLifeId(Number(String(a.source!.catalogId).slice(5)));all.set(a.id,a);}
 link(engine.project,cid,Object.keys(engine.project.assets),'按已声明宽度重建，原母版和派生实例分别计数；材质仍为同一基础色库。');engine.project.selection={assetId:Object.keys(engine.project.assets)[0],region:null,partId:null};
 const file=`${tag}-variant-${n}.ysvox.json`;await save(engine.project,file);Object.assign(indexById.get(cid)!,{stage:'variant-candidate',file,assetIds:Object.keys(engine.project.assets),note:'宽度参数重新生成 '+items.length+' 个派生组件；不增加基础母版数。'});index.packs.push({file,name:engine.project.name,entries:1,uniqueMasters:items.length});
}
const exportStarted=performance.now();let exported=0;
// Review the twelve supplied furniture references by reusing catalog masters.
// These documents and repeated placements do not inflate the base/assembly counts.
const gallery=blank('云山 · 家居十二件 · 素色结构对照');gallery.assemblies={};index.studies=[];
for(const [j,item]of referenceFurniture.entries()){
 const p=blank('云山 · '+item.name+' · 参考结构对照');
 for(const[n]of item.items){const id=typeof n==='number'?nativeLifeId(n):n;p.assets[id]=structuredClone(all.get(id)!);gallery.assets[id]=structuredClone(all.get(id)!);link(p,String(p.assets[id].source!.catalogId),[id],item.note);}
 const e=new Engine(p),commands:Command[]=item.items.map(([n,x,y,z,q],i)=>({op:'instance',id:item.id+'-'+i,assetId:typeof n==='number'?nativeLifeId(n):n,position:[x,y,z],rotation:q??0}));
 commit(e,commands,'复用母版拼装参考小件');commit(e,[{op:'createAssembly',id:item.id,name:item.name,instanceIds:Object.keys(e.project.instances)}],'保存参考组合');
 const file=`${tag}-reference-${item.id}.ysvox.json`;await save(e.project,file);await exportProject(e.project,path.join(out,'exports','reference-'+item.id));
 index.studies.push({id:item.id,name:item.name,file,assetIds:Object.keys(p.assets),note:item.note});gallery.assemblies[item.id]=e.project.assemblies![item.id];
 for(const i of Object.values(e.project.instances))gallery.instances[i.id]={...i,position:[i.position[0]+j%4*3,i.position[1],i.position[2]+Math.floor(j/4)*3]};
}
const galleryFile=tag+'-reference-gallery.ysvox.json';await save(gallery,galleryFile);index.studies.unshift({id:'gallery',name:'十二件总览',file:galleryFile,assetIds:Object.keys(gallery.assets),note:'同一组母版的十二种展示组合；不增加基础模型数量。'});
for(const a of all.values()){
 const p=blank(a.name);delete p.catalog;p.assets[a.id]=a;p.selection={assetId:a.id,region:null,partId:null};
 await exportProject(p,path.join(out,'exports',a.id),a.id);if(++exported%20===0)console.log('EXPORTED '+exported+'/'+all.size);
}
for(const e of index.entries.filter(e=>e.stage==='layout-candidate')){const p=JSON.parse(await readFile(path.join(root,e.file!),'utf8'));await exportProject(p,path.join(out,'exports',e.id.toLowerCase()));}
Object.assign(index.counts,{baseModels:models.length,assemblies:layouts.length,variantEntries:4,variantModels:9,generatedEntries:models.length+layouts.length+4,notProduced:rows.length-models.length-layouts.length-4});
Object.assign(index.metrics,{generationAndExportMs:performance.now()-started,exportMs:performance.now()-exportStarted,nativeBaseVoxels:stats.reduce((n,s)=>n+s.voxels,0),baseTriangles:stats.reduce((n,s)=>n+s.triangles,0),uniqueNativeFiles:nativeFiles.length,nativeBytes:nativeFiles.reduce((n,f)=>n+f.bytes,0),exportsDirectory:out,generatedDocuments:tag});
await writeFile(path.join(out,'index.json'),JSON.stringify(index,null,2));await writeFile(path.join(out,'model-metrics.json'),JSON.stringify(stats,null,2));await writeFile(path.join(out,'native-manifest.json'),JSON.stringify(nativeFiles,null,2));
try{await copyFile(path.join(root,'production-index.json'),path.join(out,'previous-index.json'));}catch(e:any){if(e.code!=='ENOENT')throw e;}
await writeFile(path.join(root,'production-index.json'),JSON.stringify(index));await writeFile('artifacts/production/latest.json',JSON.stringify({run:tag,out,indexFile:path.join(out,'index.json'),nativeFiles,counts:index.counts,metrics:index.metrics},null,2));
console.log(JSON.stringify({run:tag,...index.counts,elapsedMs:performance.now()-started}));
