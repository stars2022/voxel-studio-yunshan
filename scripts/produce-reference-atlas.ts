import {readFile,writeFile,mkdir,copyFile,rename} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {productionProject} from '../src/production/style';
import {atlasSource} from '../src/production/atlas-life';
import {atlasRecipe} from '../src/production/catalog-assets';
import {readAtlasIndex,readAtlasProduction,type AtlasProduction,type AtlasEntry} from '../src/production/atlas';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {layoutAtlasGallery} from '../src/production/gallery-layout';
import {meshAsset} from '../src/core/mesh';
import {exportProject} from '../src/export/exporter';
import {readProductionLibrary} from '../src/production/library';
import {checkFloat32Bounds} from '../src/export/precision';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {eachCell,type Project,type Command} from '../src/core/types';

const started=performance.now(),run='atlas-'+new Date().toISOString().replace(/\D/g,'').slice(0,14),root=path.resolve('projects'),out=path.join(root,'production',run),evidence=path.resolve('artifacts/atlas',run),hash=(s:unknown)=>createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
const atlas=(await readAtlasIndex(root))!,catalog=new Map(parseCatalogCSV(await readFile(path.join(root,'catalog/city-assets.csv'),'utf8')).map(e=>[e.id,e]));assert.ok(atlas,'Run atlas:index first');
const requestedIds=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');if(requestedIds?.some(id=>!/^(LIFE|BUILT|ENV)-[0-9]{3}$/.test(id)))throw new Error('Invalid asset ID');
const requested=process.argv.find(a=>a.startsWith('--sheets='))?.slice(9).split(',');if(requested?.some(s=>!/^M[0-9]{3}$/.test(s)))throw new Error('Invalid sheet ID');const rows=atlas.entries.filter(e=>!!atlasRecipe(e.id)&&(!requested||requested.includes(e.sheet))&&(!requestedIds||requestedIds.includes(e.id)));assert.ok(rows.length>0,'No implemented recipes in selected sheets');const activeSheets=[...new Set(rows.map(e=>e.sheet))];const old=await readAtlasProduction(root),index:AtlasProduction={format:'yunshan.atlas-production',version:1,run,createdAt:new Date().toISOString(),entries:(old?.entries??[]).filter(e=>!rows.some(r=>r.id===e.id)),studies:(old?.studies??[]).filter(e=>!activeSheets.some(s=>e.id.startsWith(s)))};
const beforeLibrary=await readProductionLibrary(root,{limit:5000}),newCatalogIds=rows.filter(row=>beforeLibrary.entries.find(e=>e.id===row.id)?.stage==='not-produced').length;
if(requestedIds)assert.equal(rows.length,new Set(requestedIds).size,'Some requested assets are absent or not implemented');
await mkdir(out,{recursive:true});await mkdir(evidence,{recursive:true});
function blank(name:string,entries:AtlasEntry[]){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:index.createdAt,entries:Object.fromEntries(entries.map(r=>[r.id,structuredClone(catalog.get(r.id)!)]))};return p;}
function commit(e:Engine,commands:Command[],label:string){const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands,label},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});}
async function save(p:Project,file:string){validateProject(p);const json=JSON.stringify(p);await writeFile(path.join(root,file),json,{flag:'wx'});return{file,sha256:hash(json),bytes:Buffer.byteLength(json)};}
const metrics:any[]=[],files:any[]=[],galleries=new Map<string,Project>(),hashes=new Set<string>(),io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]);let maxError=0;
for(const row of rows){
 const t=performance.now(),assetId=row.id.toLowerCase(),e=new Engine(blank('云山 · '+row.sheet+' · '+row.name,[row]));assert.equal(atlasSource(row.id).imageSHA256,row.imageSHA256,'Recipe reference changed: review before building');
 commit(e,[{op:'produceCatalogAsset',catalogId:row.id,id:assetId},{op:'instance',id:assetId+'-preview',assetId,position:[0,0,0]},{op:'select',assetId,region:null,partId:null}],'按图重建 '+row.id);
 // Both appearances are recoverable. This batch opens in base-colour inspection.
 commit(e,[...referenceFinishCommands(e.project),{op:'palette',name:'原始素色'}],'保存可替换材质方案');
 const p=e.project,a=p.assets[assetId],g=new Grid(a.chunks),bounds=g.bounds()!,geometrySHA=hash(a.chunks),components=gridComponents(g);assert.equal(components.length,atlasRecipe(row.id).expectedComponents??1,'Unintended floating geometry: '+row.id);assert.ok(!hashes.has(geometrySHA),'Duplicate authored geometry');hashes.add(geometrySHA);
 for(const opening of a.openings)eachCell(opening,v=>assert.equal(g.get(v),0,`${row.id}: declared opening blocked at ${v}`));
 const meshStart=performance.now(),meshes=meshAsset(a,p.materials),triangles=meshes.reduce((s,m)=>s+m.indices.length/3,0),meshingMs=performance.now()-meshStart,file=run+'-'+row.id.toLowerCase()+'.ysvox.json',boundsM={min:bounds.min.map((n,i)=>a.origin[i]+n*a.cellSize),max:bounds.max.map((n,i)=>a.origin[i]+n*a.cellSize)};
 files.push(await save(p,file));const exportStart=performance.now(),exported=await exportProject(p,path.join(out,'exports',row.id),assetId),glb=await io.read(path.join(exported.directory,'visual.glb')),positions=glb.getRoot().listMeshes().flatMap(m=>m.listPrimitives().map(p=>p.getAttribute('POSITION')!)),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const acc of positions){const arr=acc.getArray()!;for(let k=0;k<arr.length;k++){const j=k%3;min[j]=Math.min(min[j],arr[k]);max[j]=Math.max(max[j],arr[k]);}}
 const error=Math.max(...min.map((n,i)=>Math.abs(n-boundsM.min[i])),...max.map((n,i)=>Math.abs(n-boundsM.max[i])));const precision=checkFloat32Bounds(boundsM,{min,max});assert.ok(precision.matchesFloat32Rounding&&error<a.cellSize*.001,'GLB bounds changed beyond exact float32 encoding');maxError=Math.max(maxError,error);
 const round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.equal(hash(round.assets),hash(p.assets));
 const record={id:row.id,sheet:row.sheet,slot:row.slot,file,assetId,revision:3,referenceSHA256:row.imageSHA256,voxels:g.count,triangles,cellSizeM:a.cellSize,sha256:geometrySHA,boundsM,note:String(a.source!.limitations)+' 已按图重建候选，待人工美术验收。'};index.entries.push(record);
 metrics.push({...record,cellSizeM:a.cellSize,parts:a.parts.length,components,meshingMs,exportAndRoundTripMs:performance.now()-exportStart,totalMs:performance.now()-t,glbBytes:exported.glbBytes,glbBoundsMaxErrorM:error,glbFloat32Rounding:precision});
 let gallery=galleries.get(row.sheet);if(!gallery){gallery=blank('云山 · '+row.sheet+' 十二件 · 原生体素',rows.filter(r=>r.sheet===row.sheet));gallery.palettes=structuredClone(p.palettes);galleries.set(row.sheet,gallery);}
 gallery.assets[assetId]=structuredClone(a);gallery.catalog!.entries[row.id]=structuredClone(p.catalog!.entries[row.id]);gallery.instances[assetId+'-display']={id:assetId+'-display',assetId,name:a.name,position:[(row.slot-1)%4*2.3,-bounds.min[1]*a.cellSize,Math.floor((row.slot-1)/4)*2.3],rotation:0,parent:null};
 console.log(`${row.sheet}/${row.slot} ${row.id}: ${g.count} cells, ${a.parts.length} parts, ${components.length} components, ${Math.round(performance.now()-t)} ms`);
}
for(const[sheet,p]of galleries){
 // Rebuild a complete sheet gallery even when only one dependency was revised.
 for(const row of index.entries.filter(r=>r.sheet===sheet&&!p.assets[r.assetId])){
  const prior=JSON.parse(await readFile(path.join(root,row.file),'utf8')) as Project,a=prior.assets[row.assetId];assert.ok(a,'Missing gallery dependency '+row.id);
  for(const[,m]of new Grid(a.chunks).cells()){assert.ok(p.materials[m]);assert.equal(p.materials[m].category,prior.materials[m].category);assert.equal(p.materials[m].solid,prior.materials[m].solid);}
  p.assets[a.id]=structuredClone(a);p.catalog!.entries[row.id]=structuredClone(prior.catalog!.entries[row.id]);p.instances[a.id+'-display']={id:a.id+'-display',assetId:a.id,name:a.name,position:[0,0,0],rotation:0,parent:null};
 }
 p.assets=Object.fromEntries(Object.entries(p.assets).sort(([a],[b])=>a.localeCompare(b)));p.instances=Object.fromEntries(Object.entries(p.instances).sort(([a],[b])=>a.localeCompare(b)));

 // Independent masters are laid out by measured bounds, including open doors
 // and chair sets extending past the model origin. Keep all pitches aligned.
 layoutAtlasGallery(p);
 p.selection={assetId:Object.keys(p.assets)[0],region:null,partId:null};const file=run+'-'+sheet.toLowerCase()+'-gallery.ysvox.json';files.push(await save(p,file));index.studies.push({id:sheet+'-gallery',name:sheet+' · 十二件按图重建',file,assetIds:Object.keys(p.assets),note:'相同母版的等比例展示实例；最低点对齐展示地面，不表示墙装设备已安装。不增加基础模型数。',group:'67 张完整图册'});}
index.entries.sort((a,b)=>a.sheet.localeCompare(b.sheet)||a.slot-b.slot);
try{await copyFile(path.join(root,'atlas-production-index.json'),path.join(out,'previous-index.json'));}catch(e:any){if(e.code!=='ENOENT')throw e;}
await writeFile(path.join(out,'index.json'),JSON.stringify(index,null,2));await writeFile(path.join(root,'atlas-production-index.json.tmp'),JSON.stringify(index));await rename(path.join(root,'atlas-production-index.json.tmp'),path.join(root,'atlas-production-index.json'));
const report={run,createdAt:index.createdAt,environment:{cpu:os.cpus()[0].model,memoryBytes:os.totalmem(),os:os.release(),node:process.version},counts:{references:793,rebuiltThisRun:rows.length,newCatalogIds,referenceCandidates:index.entries.length,pendingReference:793-index.entries.length,accepted:0,nativeDocuments:files.length},elapsedMs:performance.now()-started,nativeVoxels:metrics.reduce((s,m)=>s+m.voxels,0),triangles:metrics.reduce((s,m)=>s+m.triangles,0),glbBoundsMaxErrorM:maxError,files,models:metrics,out,evidence};
// Keep active report paths relocatable; environment facts remain historical.
report.out=path.relative(process.cwd(),out);report.evidence=path.relative(process.cwd(),evidence);
await writeFile(path.join(evidence,'production.json'),JSON.stringify(report,null,2));await writeFile(path.join(out,'production.json'),JSON.stringify(report,null,2));await writeFile('artifacts/atlas/latest.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,models:undefined,files:undefined},null,2));
