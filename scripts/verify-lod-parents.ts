import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import type {Project,Asset} from '../src/core/types';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {lodAssemblyIdentity} from '../src/production/lod-variants';
const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),verification=JSON.parse(await readFile(latest.evidence+'/variant-verification.json','utf8')),checks:any[]=[],cache=new Map<string,{file:string;asset:Asset}>();
async function historical(id:string,params:Record<string,string|number>){
 const key=id+JSON.stringify(params);if(cache.has(key))return cache.get(key)!;const row=index.entries.find((r:any)=>r.id===id);assert.ok(row);const candidates=['projects/'+row.file],directory='projects/production/'+row.file.slice(0,20)+'/variants/'+id;
 try{for(const file of await readdir(directory,{recursive:true}))if(file.endsWith('voxels.ysvox.json'))candidates.push(directory+'/'+file);}catch(e:any){if(e.code!=='ENOENT')throw e;}
 for(const file of candidates){const p:Project=JSON.parse(await readFile(file,'utf8')),asset=Object.values(p.assets).find(a=>a.source?.catalogId===id&&hash(a.source?.parameters??{})===hash(params));if(asset){const found={file,asset};cache.set(key,found);return found;}}
 throw new Error('Missing historical parent '+key);
}
for(const row of verification.records){
 const p:Project=JSON.parse(await readFile(row.isDefault?'projects/'+row.file:row.file,'utf8')),d=p.assemblies![row.assemblyId].source!.lodVariant as any;
 for(const parent of d.parents){
  if(parent.kind==='base'){
   const old=await historical(parent.catalogId,parent.parameters),current=p.assets[parent.assetId];assert.equal(hash(geometryData(old.asset)),hash(geometryData(current)));
   for(const field of ['origin','cellSize','parts','ports','openings','rig']as const)assert.equal(hash(old.asset[field]??null),hash(current[field]??null));
   checks.push({child:row.id,params:row.params,parent:parent.catalogId,parentParameters:parent.parameters,file:old.file,parentFile:old.file,parameters:parent.parameters,childParameters:row.params,geometrySame:true,kind:'base',geometrySHA256:hash(geometryData(current)),priorNativeExisted:true});
  }else{
   const oldRow=index.entries.find((r:any)=>r.id===parent.catalogId),file='projects/'+oldRow.file,old:Project=JSON.parse(await readFile(file,'utf8')),a=old.assemblies![oldRow.assemblyId];assert.ok(a);assert.equal(lodAssemblyIdentity(old,a),lodAssemblyIdentity(p,parent.definition));assert.equal(hash(a.source?.parameters??{}),hash(parent.definition.source?.parameters??{}));
   checks.push({child:row.id,params:row.params,parent:parent.catalogId,parentParameters:{},file,parentFile:file,parameters:{},childParameters:row.params,layoutSame:true,parametersSame:true,geometry:[{same:true,identitySHA256:parent.identitySHA256}],kind:'assembly',identitySHA256:parent.identitySHA256,instances:a.instances.length,priorNativeExisted:true});
  }
 }
}
const configurations=new Set(checks.map(r=>r.parent+JSON.stringify(r.parentParameters)));assert.equal(verification.records.length,60);assert.equal(configurations.size,22);
await writeFile(latest.evidence+'/retained-parent-verification.json',JSON.stringify({run:latest.run,status:'passed',checks,configurations:configurations.size,scope:'All60LODforms retain actual historical primary parents, complete001/165assembly graphs and each selected animal default. No substitute species, scaled adult child or new identity.'},null,2));console.log(JSON.stringify({status:'passed',checks:checks.length,configurations:configurations.size}));
