import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Engine,validateProject} from '../src/core/engine';
import {referenceFinishCommands,referenceFinishVersion} from '../src/production/reference-finish';
import type {Project} from '../src/core/types';

const root=path.resolve('projects'),out=path.resolve('artifacts/material-study');await mkdir(out,{recursive:true});
const arch=JSON.parse(await readFile(path.join(root,'architecture-index.json'),'utf8')),life=JSON.parse(await readFile(path.join(root,'production-index.json'),'utf8'));
const run='finish-'+new Date().toISOString().replace(/\D/g,'').slice(0,14),hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const index:any={format:'yunshan.material-studies',version:1,profileVersion:referenceFinishVersion,run,createdAt:new Date().toISOString(),studies:[],counts:{designs:40,sourceSheets:3,newGeometry:0,accepted:0}};
const rows=[...arch.studies.map((s:any)=>({...s,group:'材质 · '+s.group})),...life.studies.map((s:any)=>({...s,id:'furniture-'+s.id,group:'材质 · 家居十二件'}))];
for(const row of rows){
 const p:Project=JSON.parse(await readFile(path.join(root,row.file),'utf8')),before=hash(p.assets),engine=new Engine(p);
 const envelope={expectedVersion:p.version,requestId:crypto.randomUUID(),label:'参考图材质处理',commands:referenceFinishCommands(p)},dry=engine.execute({...envelope,dryRun:true});engine.execute({...envelope,previewToken:dry.previewToken});
 assert.equal(hash(engine.project.assets),before,'material handling changed geometry '+row.id);assert.deepEqual(engine.project.instances,p.instances);validateProject(engine.project);
 engine.project.name+=' · 材质试作';const file=run+'-'+row.id+'.ysvox.json';await writeFile(path.join(root,file),JSON.stringify(engine.project),{flag:'wx'});
 index.studies.push({...row,id:'finish-'+row.id,name:row.name+' · 材质',file,originalFile:row.file,geometrySHA256:before,materialsSHA256:hash(engine.project.materials),note:'同一份体素几何的材质方案；保留原始素色配色；透明混合，无折射与GI。'});
}
await writeFile(path.join(out,'latest.json'),JSON.stringify(index,null,2));await writeFile(path.join(root,'material-index.json'),JSON.stringify(index));
console.log(JSON.stringify({run,files:index.studies.length,designs:40,newGeometry:0},null,2));
