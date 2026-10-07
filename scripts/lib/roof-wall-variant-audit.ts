import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import type {Asset,Assembly,Project,V3} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {assetBoundsM,geometryData} from '../../src/core/sky';
import {outfitHash} from '../../src/production/outfit-components';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {terrainAuthorityInstances} from '../../src/export/terrain-authority';
import {architectureClosed,architectureComponents,architecturePointRoles} from './architecture-audit';
import {auditShape,inside} from './mesh-audit';

export function roofWallClearBox(a:Asset,min:V3,max:V3){
 const box=new Box3(new Vector3(...min),new Vector3(...max)),blocked:string[]=[];
 for(const m of architectureComponents(a)){const s=auditShape(m.name,m.positions,m.indices);if(s.box.intersectsBox(box)&&(s.ts.some(t=>box.intersectsTriangle(t))||inside(box.getCenter(new Vector3()),s)))blocked.push(m.name);}
 for(const[v]of new Grid(a.chunks).cells()){const lo=v.map((n,d)=>n*a.cellSize+a.origin[d])as V3,hi=lo.map(n=>n+a.cellSize)as V3;if(box.intersectsBox(new Box3(new Vector3(...lo),new Vector3(...hi))))blocked.push('native:'+v.join(','));}
 return blocked;
}

/** Independent checks read installed geometry and saved parent data, not just recipe metadata. */
export function auditRoofWallVariant(p:Project,a:Assembly){
 const d=a.source!.roofWallVariant as any,id=String(a.source!.catalogId),sources:{id:string;unchanged:boolean}[]=[],components:any[]=[],checks:Record<string,unknown>={};
 if(d.parentAssetId)sources.push({id:d.parentAssetId,unchanged:outfitHash(geometryData(p.assets[d.parentAssetId]))===d.parentGeometrySHA256});
 for(const[aid,hash]of Object.entries(d.parentSourceGeometryHashes??{}))sources.push({id:aid,unchanged:outfitHash(geometryData(p.assets[aid]))===hash});
 assert.ok(sources.length&&sources.every(s=>s.unchanged),'Retained actual parents unchanged');
 for(const aid of new Set(a.instances.map(i=>i.assetId))){
  const asset=p.assets[aid],parts=architectureComponents(asset),closed=architectureClosed(asset),native=nativeIslandAttachments({...asset,meshes:parts});
  assert.ok(closed.length&&closed.every(r=>r.closed&&r.oriented),aid+' closed/oriented');assert.ok(native.every(r=>r.attached),aid+' native details attached');
  for(const m of parts)for(let k=0;k<m.indices.length;k+=3){const vs=m.indices.slice(k,k+3).map(j=>new Vector3(...m.positions.slice(j*3,j*3+3)as V3)),normal=new Vector3(...m.normals.slice(m.indices[k]*3,m.indices[k]*3+3)as V3);assert.ok(vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0])).dot(normal)>1e-12,aid+' face winding/normal');}
  components.push({id:aid,closedParts:closed.length,nativeIslands:native.length,nativeCells:new Grid(asset.chunks).count,triangles:asset.meshes!.reduce((n,m)=>n+m.indices.length/3,0)});
 }
 const child=p.assets[a.instances[0].assetId];
 if(id==='BUILT-038'||id==='BUILT-039'){
  const axis=id==='BUILT-038'?'x':'z',point:V3=axis==='x'?[1.6,.4,2]:[2,.4,1.6];assert.deepEqual(architecturePointRoles(p,child,point),[]);checks.gableAxis=axis;checks.centralCavityClear=true;
 }
 if(id==='BUILT-041'){
  const material=child.source!.materialDerivation as any,parent=p.assets[d.parentAssetId],copy=structuredClone(child),grid=new Grid();for(const[v,m]of new Grid(copy.chunks).cells())grid.set(v,m===material.to?material.from:m);copy.chunks=grid.serialize();for(const m of copy.meshes??[])if(m.material===material.to)m.material=material.from;
  assert.equal(outfitHash(geometryData(copy)),outfitHash(geometryData(parent)));assert.equal(p.materials[material.to].solid,p.materials[material.from].solid);assert.equal(p.materials[material.to].category,p.materials[material.from].category);assert.equal(child.source!.catalogId,undefined);assert.equal(p.styles[material.style].wall,material.to);
  assert.deepEqual(roofWallClearBox(child,[.65,.01,-.1],[1.35,1.73,.5]),[]);assert.deepEqual(roofWallClearBox(child,[3.21,.91,.01],[5.59,2.39,.39]),[]);checks.wallFinish=material;checks.doorAndWindowClear=true;
 }
 if(id==='BUILT-082'){
  const parent=d.retainedParentAssembly as Assembly,bindings=a.source!.physicalAuthorityBindings as {visualAssetId:string;collisionAssetId:string}[];
  assert.equal(a.instances.length,parent.instances.length);assert.equal(bindings.length,new Set(a.instances.map(i=>i.assetId)).size);
  const authority=terrainAuthorityInstances({...p,instances:Object.fromEntries(a.instances.map(i=>[i.id,i])),assemblies:{[a.id]:a}})!;
  for(const[i,instance]of a.instances.entries()){
   const asset=p.assets[instance.assetId],source=parent.instances[i];assert.deepEqual(instance.position,source.position);assert.equal(instance.rotation,source.rotation);assert.equal(authority[i].assetId,source.assetId);
   assert.ok(asset.meshes!.every(m=>!m.collision&&!p.materials[m.material].solid));assert.ok([...new Grid(asset.chunks).cells()].every(([,m])=>!p.materials[m].solid));
  }
  const roof=a.instances.map(i=>p.assets[i.assetId]).find(a=>a.source!.nearAuthority)!,near=(roof.source!.nearAuthority as any).asset as Asset;
  assert.deepEqual(assetBoundsM(roof),assetBoundsM(near));assert.deepEqual(architectureComponents(roof).find(m=>m.name==='长屋脊')!.positions,architectureComponents(near).find(m=>m.name==='长屋脊')!.positions);
  const triangles=roof.meshes!.reduce((n,m)=>n+m.indices.length/3,0),nearTriangles=near.meshes!.reduce((n,m)=>n+m.indices.length/3,0);assert.ok(triangles<nearTriangles);checks.sampling={level:d.sampling,triangles,nearTriangles,authorityInstances:authority.length,longRidgeUnchanged:true};
 }
 if(id==='BUILT-083'){
  const bodyInstance=a.instances.find(i=>i.id===d.upperBodyInstance)!,body=p.assets[bodyInstance.assetId],bounds=assetBoundsM(body)!,hole={min:[bounds.min[0]+bodyInstance.position[0],bounds.min[2]+bodyInstance.position[2]],max:[bounds.max[0]+bodyInstance.position[0],bounds.max[2]+bodyInstance.position[2]]};assert.deepEqual(hole,d.measuredUpperFootprintM);
  const lower=p.assets[a.instances.find(i=>i.id===d.roofInstance)!.assetId];assert.deepEqual(roofWallClearBox(lower,[hole.min[0]+.001,-.5,hole.min[1]+.001],[hole.max[0]-.001,3,hole.max[1]-.001]),[]);
  const door=body.source!.doorM as {min:V3;max:V3},center=(door.min[0]+door.max[0])/2;assert.deepEqual(roofWallClearBox(body,[center-.35,.01,-.01],[center+.35,1.73,.41]),[]);
  const groups=a.source!.instanceGroups as Record<string,string>,solidAt=(group:string,point:V3)=>a.instances.filter(i=>groups[i.id]===group).some(i=>{assert.equal(i.rotation,0);return architecturePointRoles(p,p.assets[i.assetId],point.map((n,k)=>n-i.position[k])as V3).some(m=>p.materials[m].solid);});
  for(const key of d.upperSupportInstances as string[]){const col=a.instances.find(i=>i.id===key)!;assert.ok(solidAt('structure',[col.position[0],.195,col.position[2]]),'Actual floor under column');assert.ok(solidAt('upper-plinth',[col.position[0],3.805,col.position[2]]),'Actual plinth on column');}
  const x=bodyInstance.position[0]+.2,z=bodyInstance.position[2]+.3;
  for(const[group,y]of[['upper-plinth',4.395],['upper-floor',4.405],['upper-floor',4.595],['upper-body',4.605],['upper-body',7.195],['upper-roof',7.205]]as const)assert.ok(solidAt(group,[x,y,z]),group+' actual vertical contact');
  const upper=p.assets[a.instances.find(i=>groups[i.id]==='upper-roof')!.assetId],saved=upper.source!.retainedOriginalUpperRoof as {asset:Asset;geometrySHA256:string};assert.equal(outfitHash(geometryData(saved.asset)),saved.geometrySHA256);
  const parts=architectureComponents(upper),board=parts.find(m=>m.name==='木望板-0')!,shape=auditShape('actual board',board.positions,board.indices),underside=shape.ts.filter(t=>t.getNormal(new Vector3()).y<-.01),timbers=parts.filter(m=>m.name.startsWith('贴合真实底面的檐木-'));assert.ok(timbers.length>4);
  for(const m of timbers)for(let k=0;k<m.positions.length;k+=3)if(m.normals[k+1]>0){const v=new Vector3(...m.positions.slice(k,k+3)as V3);assert.ok(underside.some(t=>t.closestPointToPoint(v,new Vector3()).distanceTo(v)<2e-8),'Fine timber touches actual triangulated underside');}
  checks.refittedTimbers={closedPieces:timbers.length,actualUndersideContact:true,originalUpperRoofRetained:true};
  checks.perforation={actualHole:hole,allLowerRoofPartsClear:true,doorClear:true,supportedColumns:d.upperSupportInstances.length,plinthFloorWallRoofContacts:true};
 }
 return{passed:true,catalogId:id,parameters:a.source!.parameters,sources,components,checks};
}
