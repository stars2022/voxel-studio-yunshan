import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {validateProject} from '../../src/core/engine';
import {outfitHash as hash} from '../../src/production/outfit-components';
import type {Project} from '../../src/core/types';
const rows=JSON.parse(await readFile('work/lod-variants/probe-results.json','utf8'));
for(const row of rows){
 const p:Project=JSON.parse(await readFile(row.levels[0].file,'utf8'));p.name='LOD '+row.n+' · +X方向近/中/远，统一米制尺度';p.assemblies={};p.instances={};
 const stride=Math.max(row.bounds.max[0]-row.bounds.min[0],.02)*1.65;
 for(const[j,l]of row.levels.entries()){
  const d:Project=JSON.parse(await readFile(l.file,'utf8'));for(const[id,a]of Object.entries(d.assets)){if(p.assets[id])assert.equal(hash(p.assets[id]),hash(a));else p.assets[id]=a;}
  const a=Object.values(d.assemblies!)[0];a.id='compare-'+j;a.name=l.level;a.instances=a.instances.map((i,k)=>({...i,id:a.id+'-'+k,position:[i.position[0]+(j-1)*stride,i.position[1],i.position[2]]}));p.assemblies[a.id]=a;for(const i of a.instances)p.instances[i.id]=i;
 }validateProject(p);await writeFile('work/lod-variants/comparison-'+row.n+'.ysvox.json',JSON.stringify(p));
}
