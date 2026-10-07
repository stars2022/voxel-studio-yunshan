import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),checks=[];
for(const row of latest.models){
 const child=JSON.parse(await readFile('projects/'+row.file,'utf8')),detail=child.assemblies[row.assemblyId].source.buildingVariant,definition=detail.retainedParentAssembly,parentRow=index.entries.find((r:any)=>r.id===row.parentCatalogId);
 let parentFile='projects/'+parentRow.file;
 if(detail.parentProgram){
  const run=parentRow.file.match(/^(atlas-\d{14})-/)[1],v=JSON.parse(await readFile('artifacts/atlas/'+run+'/assembly-verification.json','utf8'));
  assert.equal(v.status,'passed');const form=v.variants.find((r:any)=>r.id===row.parentCatalogId&&r.params.program===detail.parentProgram);assert.ok(form);parentFile=form.directory+'/voxels.ysvox.json';
 }
 const saved=JSON.parse(await readFile(parentFile,'utf8')),actual=saved.assemblies[parentRow.assemblyId],normalize=(a:any)=>a.instances.map(({assetId,position,rotation}:any)=>({assetId,position,rotation}));
 const layoutSame=hash(normalize(definition))===hash(normalize(actual)),assets=[...new Set(definition.instances.map((i:any)=>i.assetId))]as string[],geometry=assets.map(id=>({id,same:hash(geometryData(child.assets[id]))===hash(geometryData(saved.assets[id]))}));
 assert.ok(layoutSame);assert.ok(geometry.every(g=>g.same));assert.deepEqual(definition.source.floorPlan,actual.source.floorPlan);
 checks.push({child:row.id,parent:row.parentCatalogId,program:detail.parentProgram??'default',parentFile,layoutSame,geometry,floorPlanSame:true,scope:'Original metre layout and complete parent geometry compared independently with the previously committed default or explicitly selected medical parent. Only assembly identifier/name prefixes differ.'});
}
await writeFile(latest.evidence+'/retained-parent-verification.json',JSON.stringify({run:latest.run,status:'passed',checks},null,2));console.log(JSON.stringify({status:'passed',parentConfigurations:new Set(checks.map(c=>c.parent+':'+c.program)).size,children:checks.length}));
