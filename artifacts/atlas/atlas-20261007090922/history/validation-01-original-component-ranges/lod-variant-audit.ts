import assert from 'node:assert/strict';
import {Triangle,Vector3} from 'three';
import type {Project,Assembly,V3} from '../../src/core/types';
import {geometryData,assetBoundsM} from '../../src/core/sky';
import {displayMesh} from '../../src/core/mesh';
import {Grid} from '../../src/core/grid';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {architectureClosed} from '../../scripts/lib/architecture-audit';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {lodVariantSpec} from '../../src/production/lod-variant-spec';
import {lodAssemblyIdentity} from '../../src/production/lod-variants';
import {meshTopology,sourceComponents,thinLayerMeasure,preserveSurface} from '../../src/production/mesh-lod';

export function auditLodVariant(p:Project,a:Assembly){
 const d=a.source!.lodVariant as any,spec=lodVariantSpec(String(a.source!.catalogId),a.source!.parameters as Record<string,string|number>);
 assert.equal(d.level,spec.level);assert.equal(d.family,spec.family);assert.equal(d.sourceCatalogId,spec.sourceCatalogId);assert.equal(a.source!.parentCatalogId,spec.parentCatalogId);
 assert.equal(d.automaticDistanceSelection,false);assert.equal(d.boneUpdateRateBound,false);assert.equal(d.originalStateReadOrWritten,false);assert.equal(Object.keys(p.styles.yunshan).length,512);
 assert.equal(lodAssemblyIdentity(p,d.nearDefinition),d.nearIdentitySHA256);assert.equal(a.instances.length,d.nearDefinition.instances.length);
 assert.equal(hash(assemblyBoundsM(p,a)),hash(assemblyBoundsM(p,d.nearDefinition)));assert.equal(hash(d.nearBoundsM),hash(assemblyBoundsM(p,d.nearDefinition)));
 for(const parent of d.parents)if(parent.kind==='base')assert.equal(hash(geometryData(p.assets[parent.assetId])),parent.geometrySHA256);else assert.equal(lodAssemblyIdentity(p,parent.definition),parent.identitySHA256);
 const components:any[]=[];let protectedSupportTriangles=0,thinLayers=0,maxErrorM=0;
 for(const[j,i]of a.instances.entries()){
  const originalInstance=d.nearDefinition.instances[j],src=p.assets[originalInstance.assetId],next=p.assets[i.assetId];assert.equal(hash(i.position),hash(originalInstance.position));assert.equal(i.rotation,originalInstance.rotation);
  const source=d.sources[j];assert.equal(source.sourceAssetId,src.id);assert.equal(source.installedAssetId,next.id);assert.equal(source.sourceGeometrySHA256,hash(geometryData(src)));
  for(const field of ['chunks','parts','rig','ports','openings','origin','cellSize']as const)assert.equal(hash(src[field]??null),hash(next[field]??null),'Original native/binding field '+field);
  assert.equal(hash(assetBoundsM(src)),hash(assetBoundsM(next)));const closure=architectureClosed(next);assert.ok(closure.every(r=>r.closed&&r.oriented));
  const oldNative=nativeIslandAttachments(src),newNative=nativeIslandAttachments(next);assert.equal(newNative.filter(r=>!r.attached).length,oldNative.filter(r=>!r.attached).length);
  if(spec.level==='near'){assert.equal(hash(geometryData(src)),hash(geometryData(next)));components.push({asset:next.id,retainedExact:true,triangles:displayMesh(next,p.materials).reduce((n,m)=>n+m.indices.length/3,0)});continue;}
  assert.equal(next.source!.sourceGeometrySHA256,hash(geometryData(src)));assert.equal(next.source!.sourceAssetId,src.id);assert.equal(src.meshes!.length,next.meshes!.length);
  const originalParts=src.meshes!.flatMap(m=>sourceComponents(src,m)),thinPoints=originalParts.filter(part=>preserveSurface(part.mesh,src.cellSize)).flatMap(part=>meshTopology(part.mesh).points);
  const protectedPoints=[...new Map([...thinPoints,...[...new Grid(src.chunks).cells()].map(([v])=>v.map(n=>(n+.5)*src.cellSize)as V3),...src.ports.map(v=>v.position)].map(v=>[v.join(','),v])).values()];
  let reduced=0;
  for(const[mIndex,m]of src.meshes!.entries()){
   const out=next.meshes![mIndex];for(const field of ['name','material','collision','faceAtlas','atmosphere']as const)assert.equal(hash(m[field]??null),hash(out[field]??null));
   assert.equal(m.collision,false);assert.equal(p.materials[m.material].solid,false);assert.equal(p.materials[m.material].intensity,0);
   const before=sourceComponents(src,m),after=sourceComponents(next,out),proofs=(next.source!.lodReduction as any).meshes[mIndex].parts;assert.equal(before.length,after.length);assert.equal(before.length,proofs.length);
   for(const[k,part]of before.entries()){
    const old=part.mesh,current=after[k].mesh,proof=proofs[k],top=meshTopology(old);assert.equal(proof.sourceMeshSHA256,hash(old));assert.equal(proof.vertexMap.length,top.points.length);assert.equal(proof.beforeTriangles,old.indices.length/3);assert.equal(proof.afterTriangles,current.indices.length/3);assert.equal(proof.sourceFaceIndices.length,current.indices.length/3);
    const error=Math.max(...top.points.map((v,vi)=>{const mapped=top.points[proof.vertexMap[vi]];assert.ok(mapped);return Math.hypot(...v.map((n,axis)=>n-mapped[axis]));}));assert.ok(error<=d.toleranceM+1e-12);assert.ok(Math.abs(error-proof.maxVertexDisplacementM)<1e-12);maxErrorM=Math.max(maxErrorM,error);
    for(const vi of proof.lockedVertexIndices)assert.equal(proof.vertexMap[vi],vi,'Protected native/overlay support vertex moved');
    for(let fi=0;fi<current.indices.length/3;fi++){const sourceFace=top.faces[proof.sourceFaceIndices[fi]];assert.ok(sourceFace);for(let corner=0;corner<3;corner++){const ci=current.indices[fi*3+corner];assert.equal(hash(current.positions.slice(ci*3,ci*3+3)),hash(top.points[proof.vertexMap[sourceFace.v[corner]]]));assert.equal(hash(current.uvs.slice(ci*2,ci*2+2)),hash(sourceFace.uv[corner]));}}
    if(preserveSurface(old,src.cellSize)){assert.equal(hash(current),hash(old),'Thin material layer changed');thinLayers++;}
    else if(proof.collapses){const tri=new Triangle(),q=new Vector3(),closest=new Vector3();for(const face of top.faces){const verts=face.v.map(vi=>top.points[vi]),min=[0,1,2].map(axis=>Math.min(...verts.map(v=>v[axis]))-src.cellSize*1.8),max=[0,1,2].map(axis=>Math.max(...verts.map(v=>v[axis]))+src.cellSize*1.8);tri.set(...verts.map(v=>new Vector3(...v))as[Vector3,Vector3,Vector3]);if(protectedPoints.some(v=>v.every((n,axis)=>n>=min[axis]&&n<=max[axis])&&(q.set(...v),tri.closestPointToPoint(q,closest).distanceToSquared(q)<=Math.pow(src.cellSize*1.8,2)))){for(const vi of face.v)assert.equal(proof.vertexMap[vi],vi,'Actual thin-layer/native support triangle changed');protectedSupportTriangles++;}}}
    reduced+=proof.beforeTriangles-proof.afterTriangles;
   }
  }
  components.push({asset:next.id,source:src.id,removedTriangles:reduced,closedParts:closure.length,nativeCells:new Grid(next.chunks).count,nativeIslands:newNative.length,unattachedNativeUnchanged:true});
 }
 const count=(value:Assembly)=>value.instances.reduce((n,i)=>n+displayMesh(p.assets[i.assetId],p.materials).reduce((v,m)=>v+m.indices.length/3,0),0),near=count(d.nearDefinition),current=count(a);assert.equal(near,d.nearTriangles);assert.equal(current,d.levelTriangles);assert.equal(current/near,d.ratio);assert.ok(spec.level==='near'?current===near:current<near);
 return{passed:true,catalogId:a.source!.catalogId,parameters:spec.parameters,family:spec.family,level:spec.level,sourceCatalogId:spec.sourceCatalogId,nearTriangles:near,levelTriangles:current,ratio:current/near,maxErrorM,toleranceM:d.toleranceM,thinLayers,protectedSupportTriangles,components,parentsRetained:d.parents.length,originalRuntimeBound:false};
}
