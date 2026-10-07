import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import type {Project,Assembly,Asset} from '../src/core/types';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {productionProject} from '../src/production/style';
import {exportProject} from '../src/export/exporter';
const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),verification=JSON.parse(await readFile(latest.evidence+'/variant-verification.json','utf8')),checks:any[]=[],cache=new Map<string,{file:string;asset:Asset;historicalEvidenceFiles?:string[];priorNativeExisted?:boolean}>();
async function historical(id:string,params:Record<string,string|number>,retained:Asset):Promise<{file:string;asset:Asset;historicalEvidenceFiles?:string[];priorNativeExisted?:boolean}>{
 const key=id+JSON.stringify(params);if(cache.has(key))return cache.get(key)!;
 const row=index.entries.find((r:any)=>r.id===id);assert.ok(row);const candidates=['projects/'+row.file],run=row.file.slice(0,20),dir='projects/production/'+run+'/variants/'+id;
 try{for(const file of await readdir(dir,{recursive:true}))if(file.endsWith('voxels.ysvox.json'))candidates.push(dir+'/'+file);}catch(e:any){if(e.code!=='ENOENT')throw e;}
 for(const file of candidates){const doc:Project=JSON.parse(await readFile(file,'utf8')),asset=Object.values(doc.assets).find(a=>a.source?.catalogId===id&&hash(a.source?.parameters??{})===hash(params));if(asset){const result={file,asset,priorNativeExisted:true};cache.set(key,result);return result;}}
 // M031 validated garment2 by immutable geometry hash but did not export a
 // separate native variant. Preserve that distinction and deliver the exact
 // matching canonical parent configuration now, without adding a base model.
 assert.equal(id,'CHAR-002');assert.deepEqual(params,{garment:2});const evidence='artifacts/atlas/atlas-20261004074226/component-variants.json',record=JSON.parse(await readFile(evidence,'utf8')).variants.find((r:any)=>r.id===id&&hash(r.parameters)===hash(params));assert.ok(record);assert.equal(hash(geometryData(retained)),record.geometrySHA256);
 const parent=productionProject('原002交领参数父件 · 历史几何哈希核对'),asset=structuredClone(retained);parent.assets[asset.id]=asset;const directory=latest.out+'/variants/CHAR-002-retained-parent-garment-2';await exportProject(parent,directory,asset.id);
 const result={file:directory+'/voxels.ysvox.json',asset,historicalEvidenceFiles:[evidence],priorNativeExisted:false};cache.set(key,result);return result;
}
for(const row of verification.records){
 const p:Project=JSON.parse(await readFile(row.isDefault?'projects/'+row.file:row.file,'utf8')),a=p.assemblies![row.assemblyId],d=(a.source!.ageVariant??a.source!.characterPalette)as any,parentId=String(a.source!.parentCatalogId),parentRecord=index.entries.find((r:any)=>r.id===parentId);assert.ok(parentRecord);
 if(a.source!.parentKind==='assembly'){
  const parentFile='projects/'+parentRecord.file,parent:Project=JSON.parse(await readFile(parentFile,'utf8')),canonical=parent.assemblies![parentRecord.assemblyId],retained=d.retainedParentAssembly as Assembly,layout=(a:Assembly)=>a.instances.map(i=>({assetId:i.assetId,position:i.position,rotation:i.rotation}));assert.equal(hash(layout(canonical)),hash(layout(retained)));assert.deepEqual(canonical.source!.parameters,retained.source!.parameters);
  const geometry=Object.entries(d.parentSourceGeometryHashes).map(([id,saved])=>{assert.equal(hash(geometryData(p.assets[id])),saved);assert.equal(hash(geometryData(parent.assets[id])),saved);return{id,same:true,geometrySHA256:saved};});checks.push({child:row.id,childParameters:row.params,parent:parentId,kind:'assembly',parentFile,parameters:canonical.source!.parameters,layoutSame:true,parametersSame:true,geometry,instances:retained.instances.length});
 }
 const assets=a.source!.ageVariant?[p.assets[d.originalBodyAssetId],p.assets[d.headAssetId]]:a.source!.parentKind==='base'?[p.assets[d.parentAssetId]]:[];
 for(const retained of assets){const id=String(retained.source!.catalogId),params=(retained.source!.parameters??{})as Record<string,string|number>,source=await historical(id,params,retained),digest=hash(geometryData(retained));assert.equal(digest,hash(geometryData(source.asset)));checks.push({child:row.id,childParameters:row.params,parent:id,kind:'base',program:source.file.includes('/variants/')?Object.entries(params).map(([k,v])=>k+'-'+v).join('_'):'default',parentFile:source.file,parameters:params,geometrySame:true,geometrySHA256:digest,canonicalAssetId:source.asset.id,retainedAssetId:retained.id,historicalEvidenceFiles:source.historicalEvidenceFiles??[],priorNativeExisted:source.priorNativeExisted});}
}
assert.equal(checks.length,45);await writeFile(latest.evidence+'/retained-parent-verification.json',JSON.stringify({run:latest.run,status:'passed',checks,scope:'Exact retained001resident, age-specific063/064/059bodies,068school/teenand066heads,002bothgarments,004thighand010hair. M031garment2previously had a geometry hash only; an exact matching canonical native/export parent is delivered here, not represented as a pre-existing native or new base.'},null,2));console.log(JSON.stringify({status:'passed',checks:checks.length,uniqueBaseConfigurations:cache.size}));
