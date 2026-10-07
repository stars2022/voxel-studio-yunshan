import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {productionProject} from '../../src/production/style';
import {validateProject} from '../../src/core/engine';
import {Grid} from '../../src/core/grid';
import {geometryData} from '../../src/core/sky';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {architectureClosed} from '../../scripts/lib/architecture-audit';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {finalVariantIds,finalVariantForms} from './final-variant-spec';
import {makeEnvironmentVariant} from './environment-variants';
import {makeFurnitureVariant} from './furniture-variants';
const rows:any[]=[];
for(const id of finalVariantIds)for(const params of finalVariantForms(id)){
 const start=Date.now(),p=productionProject('环境家具88有限形态检查'),a=(id.startsWith('LIFE')?makeFurnitureVariant:makeEnvironmentVariant)(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);const saved=JSON.parse(JSON.stringify(p));validateProject(saved);assert.equal(hash(geometryData(saved.assets[a.instances[0].assetId])),hash(geometryData(p.assets[a.instances[0].assetId])));
 const closure=a.instances.flatMap(i=>architectureClosed(p.assets[i.assetId]));assert.ok(closure.every(c=>c.closed&&c.oriented),JSON.stringify({id,params,closure:closure.filter(c=>!c.closed||!c.oriented)}));
 const bounds=assemblyBoundsM(p,a);assert.ok(bounds.min[1]>=-1e-8,JSON.stringify({id,params,bounds}));
 for(const i of a.instances){const aa=p.assets[i.assetId];for(const[,m]of new Grid(aa.chunks).cells())assert.ok(p.materials[m]);for(const m of aa.meshes??[])assert.equal(m.collision,p.materials[m.material].solid);}
 const row={id,params,ms:Date.now()-start,bounds,closure:closure.length,cells:a.instances.reduce((n,i)=>n+new Grid(p.assets[i.assetId].chunks).count,0),instanceCount:a.instances.length,geometrySHA256:hash(a.instances.map(i=>[geometryData(p.assets[i.assetId]),i.position]))};rows.push(row);console.log(JSON.stringify(row));
}
assert.equal(rows.length,88);await writeFile('work/environment-furniture/probe-all.json',JSON.stringify({status:'passed',count:88,records:rows},null,2));
