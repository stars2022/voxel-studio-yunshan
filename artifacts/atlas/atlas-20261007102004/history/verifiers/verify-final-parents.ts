import assert from 'node:assert/strict';import {readFile,writeFile,readdir} from 'node:fs/promises';import type {Project,Asset} from '../src/core/types';import {geometryData} from '../src/core/sky';import {outfitHash as hash} from '../src/production/outfit-components';
const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),legacy=JSON.parse(await readFile('projects/production-index.json','utf8')),verification=JSON.parse(await readFile(latest.evidence+'/variant-verification.json','utf8')),checks:any[]=[],cache=new Map<string,{file:string;asset:Asset}>();
async function historical(id:string,params:Record<string,string|number>){
 const key=id+JSON.stringify(params);if(cache.has(key))return cache.get(key)!;
 const row=index.entries.find((r:any)=>r.id===id)??legacy.entries.find((r:any)=>r.id===id);assert.ok(row);
 const candidates=['projects/'+row.file];
 if(row.file.startsWith('atlas-')){
  const run=row.file.slice(0,20),directory='projects/production/'+run+'/variants/'+id;
  try{for(const file of await readdir(directory,{recursive:true}))if(file.endsWith('voxels.ysvox.json'))candidates.push(directory+'/'+file);}catch(e:any){if(e.code!=='ENOENT')throw e;}
  // Early environment batches retained parameterized parents in audited component scenes.
  const evidence='artifacts/atlas/'+run;
  try{const record=JSON.parse(await readFile(evidence+'/component-variants.json','utf8'));assert.equal(record.status,'passed');
   for(const r of record.records)if(r.id===id&&hash(r.parameters)===hash(params)&&r.nativeScene)candidates.push(evidence+'/'+r.nativeScene);
  }catch(e:any){if(e.code!=='ENOENT')throw e;}
 }
 for(const file of candidates){const p:Project=JSON.parse(await readFile(file,'utf8')),asset=Object.values(p.assets).find(a=>a.source?.catalogId===id&&hash(a.source?.parameters??{})===hash(params));if(asset){const found={file,asset};cache.set(key,found);return found;}}
 throw new Error('Missing historical parent '+key);
}
for(const row of verification.records){const p:Project=JSON.parse(await readFile(row.isDefault?'projects/'+row.file:row.file,'utf8')),d=p.assemblies![row.assemblyId].source!.finalVariant as any;for(const parent of d.parents){const old=await historical(parent.catalogId,parent.parameters),current=p.assets[parent.assetId];assert.equal(hash(geometryData(old.asset)),hash(geometryData(current)));for(const field of['origin','cellSize','parts','ports','openings','rig']as const)assert.equal(hash(old.asset[field]??null),hash(current[field]??null));checks.push({child:row.id,params:row.params,parent:parent.catalogId,parentParameters:parent.parameters,file:old.file,parentFile:old.file,parameters:parent.parameters,childParameters:row.params,geometrySame:true,kind:'base',historicalEvidenceFiles:old.file.startsWith('artifacts/')?[old.file.slice(0,old.file.lastIndexOf('/'))+'/component-variants.json',...['voxels.ysvox.json','visual.glb','collision.json','interfaces.json','atlas.json','atlas.png'].map(name=>old.file.replace('.ysvox.json','-export/')+name)]:[],geometrySHA256:hash(geometryData(current)),priorNativeExisted:true});}}
const configurations=new Set(checks.map(r=>r.parent+JSON.stringify(r.parentParameters)));assert.equal(verification.records.length,88);assert.equal(configurations.size,19);assert.equal(checks.length,118);await writeFile(latest.evidence+'/retained-parent-verification.json',JSON.stringify({run:latest.run,status:'passed',checks,configurations:configurations.size,scope:'All88 finite forms retain actual environmental parents and nine exact historical furniture sources. No new source masters.'},null,2));console.log(JSON.stringify({status:'passed',checks:checks.length,configurations:configurations.size}));
