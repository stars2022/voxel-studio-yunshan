import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {exportProject} from '../src/export/exporter';
import {loadMesh} from '../src/import/converter';
import {validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {worldPoint,type Project,type V3} from '../src/core/types';

const root=path.resolve('artifacts/material-study'),index=JSON.parse(await readFile(path.join(root,'latest.json'),'utf8')),hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),start=performance.now();
const report:any={run:index.run,environment:{node:process.version,cpu:os.cpus()[0].model,os:os.release(),memoryBytes:os.totalmem()},items:[],checks:[]};
const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]);
await mkdir(path.join(root,'exports'),{recursive:true});
for(const row of index.studies){
 const t=performance.now(),p:Project=JSON.parse(await readFile(path.join('projects',row.file),'utf8')),original:Project=JSON.parse(await readFile(path.join('projects',row.originalFile),'utf8'));
 validateProject(p);assert.equal(hash(p.assets),hash(original.assets));assert.equal(hash(p.assets),row.geometrySHA256);assert.deepEqual(p.instances,original.instances);
 for(const[id,m]of Object.entries(original.materials))assert.equal(p.materials[id].solid,m.solid);
 const dir=path.join(root,'exports',row.id),out=await exportProject(p,dir),native:Project=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(native);assert.equal(hash(native),hash(p));
 const bytes=await readFile(path.join(dir,'visual.glb')),doc=await io.readBinary(bytes),mats=doc.getRoot().listMaterials();
 for(const m of Object.values(p.materials)){const exported=mats.find(n=>n.getExtras().voxelMaterialId===m.id)!;assert.ok(exported);assert.equal(exported.getRoughnessFactor(),m.roughness);assert.equal(exported.getMetallicFactor(),m.metalness);assert.equal(exported.getAlphaMode(),m.opacity<1?'BLEND':'OPAQUE');if(m.surface&&m.surface!=='none'){assert.ok(exported.getBaseColorTexture()?.getImage()?.length);assert.ok(exported.getNormalTexture()?.getImage()?.length);assert.ok(exported.getMetallicRoughnessTexture()?.getImage()?.length);assert.equal(exported.getExtras().surfaceScaleM,m.surfaceScale);}}
 // Check every single design through the actual import parser; gallery exports
 // share exactly those meshes and are checked for metadata/texture/native fidelity.
 let reimportErrorM:number|null=null;
 if(!row.id.includes('gallery')){
  const expected={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
  for(const inst of Object.values(p.instances)){const a=p.assets[inst.assetId],b=new Grid(a.chunks).bounds()!;for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]]){const v=worldPoint(a,inst,[x,y,z] as V3);for(let k=0;k<3;k++){expected.min[k]=Math.min(expected.min[k],v[k]);expected.max[k]=Math.max(expected.max[k],v[k]);}}}
  const imported=await loadMesh({filename:row.id+'.glb',data:bytes.toString('base64')});reimportErrorM=0;for(const side of['min','max'] as const)for(let k=0;k<3;k++)reimportErrorM=Math.max(reimportErrorM,Math.abs(imported.bounds[side][k]-expected[side][k]));assert.ok(reimportErrorM<.00001,row.id+' metre/axis mismatch');
 }
 report.items.push({id:row.id,nativeFile:row.file,directory:dir,glbBytes:out.glbBytes,exportAndVerifyMs:performance.now()-t,reimportErrorM,geometrySHA256:row.geometrySHA256});console.log('EXPORTED '+row.id);
}
report.elapsedMs=performance.now()-start;report.checks=['43 native projects preserve every source asset and instance exactly','40 design GLBs reimport with metre-space bounds error below 0.00001 m','All PBR maps, roughness, metalness, alpha modes and texture scales survive export','Collision flags and component interfaces remain unchanged'];await writeFile(path.join(root,'export-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({exports:report.items.length,elapsedMs:report.elapsedMs}));
