import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import type {Project,Assembly} from '../src/core/types';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),checks:any[]=[];
for(const row of latest.models){
 const p:Project=JSON.parse(await readFile('projects/'+row.file,'utf8')),a=p.assemblies![row.assemblyId],d=a.source!.ageVariant as any,parentId=String(a.source!.parentCatalogId),parentRecord=index.entries.find((r:any)=>r.id===parentId);assert.ok(parentRecord);
 const parentFile='projects/'+parentRecord.file,parent:Project=JSON.parse(await readFile(parentFile,'utf8'));
 if(a.source!.parentKind==='base'){
  const canonical=parent.assets[parentRecord.assetId],retained=p.assets[d.parentAssetId];assert.ok(canonical&&retained);assert.equal(hash(geometryData(canonical)),hash(geometryData(retained)));assert.equal(hash(geometryData(retained)),d.parentGeometrySHA256);
  checks.push({child:row.id,parent:parentId,kind:'base',parentFile,geometrySame:true,geometrySHA256:d.parentGeometrySHA256,canonicalAssetId:canonical.id,retainedAssetId:retained.id,nonReferenceNewMaster:false});
 }else{
  const canonical=parent.assemblies![parentRecord.assemblyId],retained=d.retainedParentAssembly as Assembly,layout=(a:Assembly)=>a.instances.map(i=>({assetId:i.assetId,position:i.position,rotation:i.rotation}));assert.equal(hash(layout(canonical)),hash(layout(retained)));assert.deepEqual(canonical.source!.parameters,retained.source!.parameters);
  const geometry=Object.entries(d.parentSourceGeometryHashes).map(([id,saved])=>{assert.equal(hash(geometryData(p.assets[id])),saved);assert.equal(hash(geometryData(parent.assets[id])),saved);return{id,same:true,geometrySHA256:saved};});
  checks.push({child:row.id,parent:parentId,kind:'assembly',parentFile,parameters:canonical.source!.parameters,layoutSame:true,parametersSame:true,geometry,instances:retained.instances.length});
 }
 const bodyId=d.bodyCatalogId;
 for(const[partId,assetId,program]of[[bodyId,d.originalBodyAssetId,'default'],['CHAR-067',d.headAssetId,row.id==='CHAR-018'?'headStage-toddler':'default']]){
  const r=index.entries.find((r:any)=>r.id===partId),parentFile=program==='default'?'projects/'+r.file:'projects/production/atlas-20261004084218/variants/CHAR-067/02/voxels.ysvox.json',doc:Project=JSON.parse(await readFile(parentFile,'utf8')),canonical=Object.values(doc.assets).find(a=>a.source?.catalogId===partId)!;const digest=hash(geometryData(p.assets[assetId]));assert.equal(digest,hash(geometryData(canonical)));
  checks.push({child:row.id,parent:partId,kind:'base',program,parentFile,parameters:canonical.source!.parameters,geometrySame:true,geometrySHA256:digest,canonicalAssetId:canonical.id,retainedAssetId:assetId});
 }
}
await writeFile(latest.evidence+'/retained-parent-verification.json',JSON.stringify({run:latest.run,status:'passed',checks,scope:'Exact complete historical001adult resident plus061/062covered bodies and both067age heads retained. Six source checks, five unique historical configurations. No new base masters; source ageProfile/Citizen and growth controllers remain unbound.'},null,2));console.log(JSON.stringify({status:'passed',checks:checks.length}));
