import {writeFile} from 'node:fs/promises';
import {productionProject} from '../../src/production/style';
import {validateProject} from '../../src/core/engine';
import {Grid} from '../../src/core/grid';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {finalVariantIds} from './final-variant-spec';
import {makeEnvironmentVariant} from './environment-variants';
import {makeFurnitureVariant} from './furniture-variants';
const rows:any[]=[];
for(const id of finalVariantIds){const start=Date.now(),p=productionProject('最后环境家具草稿'),a=(id.startsWith('LIFE')?makeFurnitureVariant:makeEnvironmentVariant)(p,id,id.toLowerCase(),id);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);const row={id,ms:Date.now()-start,bounds:assemblyBoundsM(p,a),instances:a.instances.length,assets:Object.keys(p.assets).length,cells:a.instances.reduce((n,i)=>n+new Grid(p.assets[i.assetId].chunks).count,0),triangles:a.instances.reduce((n,i)=>n+(p.assets[i.assetId].meshes??[]).reduce((n,m)=>n+m.indices.length/3,0),0),details:a.source!.finalVariant};rows.push(row);console.log(JSON.stringify({id,ms:row.ms,bounds:row.bounds,cells:row.cells,triangles:row.triangles}));await writeFile('work/environment-furniture/draft-'+id+'.ysvox.json',JSON.stringify(p));}
await writeFile('work/environment-furniture/probe.json',JSON.stringify(rows,null,2));
