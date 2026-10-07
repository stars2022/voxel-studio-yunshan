import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{Vector3}from'three';
import{Grid}from'../../src/core/grid';
import{geometryData}from'../../src/core/sky';
import{outfitHash as hash}from'../../src/production/outfit-components';
import{architectureClosed}from'../../scripts/lib/architecture-audit';
import{nativeIslandAttachments}from'../../src/production/mixed-review';
import{auditShape,inside,penetration}from'../../scripts/lib/mesh-audit';
import{assemblyBoundsM}from'../../src/production/assembly-geometry';
import type{Project,V3}from'../../src/core/types';
const records=JSON.parse(await readFile('work/body-variants/all-drafts.json','utf8')),results=[];
for(const r of records){const p:Project=JSON.parse(await readFile('work/body-variants/'+r.key+'.ysvox.json','utf8')),a=p.assemblies![r.id.toLowerCase()],d=a.source!.bodyVariant as any,checks:any={key:r.key,family:d.family};
 for(const parent of d.parents)assert.equal(hash(geometryData(p.assets[parent.assetId])),parent.geometrySHA256);
 for(const i of a.instances){const asset=p.assets[i.assetId];assert.ok(architectureClosed(asset).every(row=>row.closed&&row.oriented));assert.ok(nativeIslandAttachments(asset).every(row=>row.attached));for(const m of asset.meshes??[])assert.equal(m.collision,false);}
 if(d.family==='body'||d.family==='pregnancy'){
  const body=p.assets[d.installedBodyAssetId],head=p.assets[d.headAssetId],bi=a.instances.find(i=>i.assetId===body.id)!,hi=a.instances.find(i=>i.assetId===head.id)!,neck=body.ports.find(p=>p.id==='neck')!.position;assert.deepEqual(neck,hi.position);assert.equal(assemblyBoundsM(p,a).min[1],0);
  const world=(m:NonNullable<typeof body.meshes>[number],offset:V3)=>auditShape(m.name,m.positions.map((v,k)=>v+offset[k%3]),m.indices),collar=world(body.meshes!.find(m=>m.name==='衣领承接颈部')!,bi.position),insert=world(head.meshes!.find(m=>m.name==='颈部插接')!,hi.position);
  for(const x of[-.012,0,.012])for(const z of[-.012,0,.012]){const point=new Vector3(neck[0]+x,neck[1]-.01,neck[2]+z);assert.ok(inside(point,collar)&&inside(point,insert),'Actual neck inserts both closed surfaces');}
  const hits=penetration(body.meshes!.map(m=>world(m,bi.position)),head.meshes!.map(m=>world(m,hi.position)));assert.ok(hits.details.every(r=>['衣领承接颈部','髋腹胸肩连续衣身','保留胸肩到颈部'].includes(r.a)&& (r.b==='颈部插接'||r.b.startsWith('独立颅'))),'Only intended collar contact');checks.neckContacts=9;checks.neckOverlap=hits;
  if(d.family==='body'){
   const old=p.assets[d.parentAssetId],sculpt=body.source!.bodySculpt as any,restored=new Grid(),g=new Grid(body.chunks);assert.equal(g.count,new Grid(old.chunks).count);for(const m of sculpt.nativeMoves){assert.equal(g.get(m.to),m.material);restored.set(m.from,m.material);}assert.equal(hash([...restored.cells()].sort()),hash([...new Grid(old.chunks).cells()].sort()));
   for(const mesh of body.meshes!){const original=old.meshes!.find(m=>m.name===mesh.name)!;assert.deepEqual(mesh.indices,original.indices);assert.deepEqual(mesh.uvs,original.uvs);if(mesh.name.startsWith('中性衣套足端'))assert.deepEqual(mesh,original,'Complete original continuous foot retained byte-for-byte');}
  }
 }else if(d.family==='growth'){
  const old=p.assets[d.selectedHeadParent],current=p.assets[d.installedHeadAssetId],change=current.source!.faceAtlasDerivation as any;assert.equal(old.meshes!.length,current.meshes!.length);for(let k=0;k<current.meshes!.length;k++){const m=current.meshes![k],o=old.meshes![k];assert.deepEqual(m.positions,o.positions);assert.deepEqual(m.normals,o.normals);assert.deepEqual(m.indices,o.indices);if(!m.faceAtlas)assert.deepEqual(m.uvs,o.uvs);else for(let j=0;j<m.uvs.length;j+=2)assert.ok(m.uvs[j]>change.tile/6&&m.uvs[j]<(change.tile+1)/6);}
 }
 results.push(checks);
}
await writeFile('work/body-variants/draft-geometry-audit.json',JSON.stringify({status:'passed',records:results},null,2));console.log('Passed '+results.length+'actual drafts');
