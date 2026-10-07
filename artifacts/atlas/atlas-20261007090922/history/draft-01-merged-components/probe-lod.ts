import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {productionProject} from '../../src/production/style';
import {ArchitectureBuilder} from '../../src/production/architecture-near-assembly';
import {makeArchitectureAssembly} from '../../src/production/atlas-architecture-assemblies';
import {careParameters} from '../../src/production/atlas-care';
import {faunaParameters} from '../../src/production/atlas-fauna';
import {wildlifeParameters} from '../../src/production/atlas-wildlife';
import {assetBoundsM} from '../../src/core/sky';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {displayMesh} from '../../src/core/mesh';
import {validateProject} from '../../src/core/engine';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {architectureClosed} from '../../scripts/lib/architecture-audit';
import {reduceAsset} from './mesh-lod';
import type {Assembly,Project} from '../../src/core/types';

const animals=[306,307,308,313,314,315,316,317,318,310,311,312,319,320,309,321,322,323],rows:any[]=[];
const defs=(n:number)=>n<=307?careParameters('CHAR-'+n):n<=319?faunaParameters('CHAR-'+n):wildlifeParameters('CHAR-'+n);
function document(n:number){const p=productionProject('LOD source '+n),b=new ArchitectureBuilder(p,'lod-source');let a:Assembly;
 if(n<2)a=makeArchitectureAssembly(p,n===0?'CHAR-001':'CHAR-165','lod-source','Original '+n);
 else{const params=Object.fromEntries(Object.entries(defs(n)).map(([k,d])=>[k,d.default])),id=b.original('CHAR-'+n,params);b.place(id,[0,0,0]);a=b.finish('CHAR-'+n,'Original '+n,{});}p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));return{p,a};}
const selected=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',').map(Number)??[0,1,...animals];
for(const n of selected){
 const{p,a}=document(n),bounds=assemblyBoundsM(p,a),height=Math.max(...bounds.max.map((v,k)=>v-bounds.min[k])),levels=[];
 for(const level of['near','middle','far']as const){const doc:Project=structuredClone(p),target=structuredClone(a),proofs=[];
  if(level!=='near')for(const i of target.instances){const src=doc.assets[i.assetId],id=i.assetId+'-'+level,tolerance=Math.max(.0005,Math.min(.03,height*(level==='middle'?.005:.018)));if(!doc.assets[id])doc.assets[id]=reduceAsset(src,id,level,tolerance);i.assetId=id;const next=doc.assets[id],before=assetBoundsM(src)!,after=assetBoundsM(next)!;assert.ok(before.min.every((v,k)=>Math.abs(v-after.min[k])<1e-8)&&before.max.every((v,k)=>Math.abs(v-after.max[k])<1e-8));for(const f of['chunks','parts','rig','ports','origin','cellSize']as const)assert.equal(hash(next[f]??null),hash(src[f]??null));const closed=architectureClosed(next);assert.ok(closed.every(c=>c.closed&&c.oriented));const native=nativeIslandAttachments(next),originalNative=nativeIslandAttachments(src);assert.equal(native.filter(x=>!x.attached).length,originalNative.filter(x=>!x.attached).length);proofs.push({asset:id,meshes:next.source!.lodReduction,originalNativeUnattached:originalNative.filter(x=>!x.attached).length});}
  doc.assemblies={[target.id]:target};doc.instances=Object.fromEntries(target.instances.map(i=>[i.id,i]));doc.name='LOD '+n+' '+level;validateProject(doc);const triangles=target.instances.reduce((s,i)=>s+displayMesh(doc.assets[i.assetId],doc.materials).reduce((n,m)=>n+m.indices.length/3,0),0),file='work/lod-variants/source-'+n+'-'+level+'.ysvox.json';await writeFile(file,JSON.stringify(doc));levels.push({level,triangles,file,proofs});console.log(JSON.stringify({n,level,triangles,instances:target.instances.length}));
 }
 assert.ok(levels[1].triangles<levels[0].triangles);assert.ok(levels[2].triangles<levels[1].triangles);rows.push({n,bounds,levels});await writeFile('work/lod-variants/probe-results.json',JSON.stringify(rows,null,2));
}
