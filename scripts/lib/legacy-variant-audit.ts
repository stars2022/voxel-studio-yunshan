import assert from 'node:assert/strict';
import {Ray,Vector3} from 'three';
import type {Assembly,Project,V3} from '../../src/core/types';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import {Grid} from '../../src/core/grid';
import {geometryData,assetBoundsM} from '../../src/core/sky';
import {outfitHash} from '../../src/production/outfit-components';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {architectureComponents,architectureClosed} from './architecture-audit';

const near=(a:number,b:number,note:string,tolerance=2e-8)=>assert.ok(Math.abs(a-b)<tolerance,note+': '+a+' vs '+b);
export function legacyPartBounds(m:AuthoredMesh){const points=Array.from({length:m.positions.length/3},(_,i)=>m.positions.slice(i*3,i*3+3));return{min:[0,1,2].map(k=>Math.min(...points.map(p=>p[k])))as V3,max:[0,1,2].map(k=>Math.max(...points.map(p=>p[k])))as V3};}
/** Intersections with actual triangles, independent of recipe height functions. */
export function legacyVerticalHits(meshes:AuthoredMesh[],x:number,z:number){
 const ray=new Ray(new Vector3(x,100,z),new Vector3(0,-1,0)),hits:number[]=[];
 for(const mesh of meshes)for(let i=0;i<mesh.indices.length;i+=3){const v=mesh.indices.slice(i,i+3).map(j=>new Vector3(...mesh.positions.slice(j*3,j*3+3)as V3)),point=ray.intersectTriangle(v[0],v[1],v[2],false,new Vector3());if(point)hits.push(point.y);}
 return hits.sort((a,b)=>a-b);
}

export function auditLegacyVariant(p:Project,a:Assembly){
 const d=a.source!.legacyVariant as any,id=String(a.source!.catalogId),sources:{id:string;unchanged:boolean}[]=[],components:any[]=[],checks:Record<string,unknown>={};
 if(d.parentAssetId)sources.push({id:d.parentAssetId,unchanged:outfitHash(geometryData(p.assets[d.parentAssetId]))===d.parentGeometrySHA256});
 for(const[aid,hash]of Object.entries(d.parentSourceGeometryHashes??{}))sources.push({id:aid,unchanged:outfitHash(geometryData(p.assets[aid]))===hash});
 assert.ok(sources.length&&sources.every(s=>s.unchanged),'Actual retained parent geometry');
 for(const aid of new Set(a.instances.map(i=>i.assetId))){
  const asset=p.assets[aid];if(!asset.meshes?.length){components.push({id:aid,nativeCells:new Grid(asset.chunks).count,geometryAuthority:'exact retained native wall with scoped purpose remap'});continue;}
  const parts=architectureComponents(asset),closed=architectureClosed(asset),native=nativeIslandAttachments({...asset,meshes:parts});
  assert.ok(closed.length&&closed.every(c=>c.closed&&c.oriented),aid+' actual closed/oriented parts');assert.ok(native.every(n=>n.attached),aid+' actual native contacts');
  for(const m of parts)for(let k=0;k<m.indices.length;k+=3){const v=m.indices.slice(k,k+3).map(j=>new Vector3(...m.positions.slice(j*3,j*3+3)as V3)),normal=new Vector3(...m.normals.slice(m.indices[k]*3,m.indices[k]*3+3)as V3);assert.ok(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).dot(normal)>1e-12,aid+' actual winding');}
  components.push({id:aid,closedParts:closed.length,nativeIslands:native.length,nativeCells:new Grid(asset.chunks).count,triangles:asset.meshes.reduce((n,m)=>n+m.indices.length/3,0)});
 }
 if(id==='BUILT-085'){
  const child=p.assets[a.instances[0].assetId],parent=p.assets[d.parentAssetId],map=child.source!.materialDerivation as any,copy=structuredClone(child),g=new Grid();
  for(const[v,m]of new Grid(copy.chunks).cells())g.set(v,m===map.to?map.from:m);copy.chunks=g.serialize();
  assert.equal(outfitHash(geometryData(copy)),outfitHash(geometryData(parent)));assert.deepEqual(child.ports,parent.ports);assert.deepEqual(child.openings,parent.openings);assert.deepEqual(child.origin,parent.origin);
  assert.equal(new Grid(parent.chunks).count,386556);assert.equal(map.role,'wall');assert.equal(map.from,p.styles.yunshan.wall);assert.equal(p.styles[map.style].wall,map.to);assert.equal(p.materials[map.to].solid,p.materials[map.from].solid);assert.equal(p.materials[map.to].category,p.materials[map.from].category);assert.equal(child.source!.catalogId,undefined);
  checks.wall={nativeCells:386556,allNativePositionsAndOtherPurposeIDsIdentical:true,portsAndOpeningsIdentical:true,finish:map};
 }else if(id==='BUILT-084'){
  const r=d.roof,instance=a.instances.find(i=>i.id===r.roofInstance)!,roof=p.assets[instance.assetId],parts=architectureComponents(roof),board=parts.find(m=>m.name==='连续木望板')!,tile=parts.find(m=>m.name==='连续瓦基')!,membrane=parts.find(m=>m.name==='完整防水膜')!;
  assert.ok(board&&tile&&membrane);const ridgeParts=parts.filter(m=>m.name.startsWith('通长脊-'));
  const dimensions=r.plan.program==='farm'?[12.8,6.4,1]:r.plan.program==='home-narrow'?[32,12.8,1]:[38.4,12.8,2];assert.equal(ridgeParts.length,dimensions[2]);
  const box=legacyPartBounds(board);near(box.min[0],-.4,'left roof overhang');near(box.max[0],dimensions[0]+.4,'right roof overhang');near(box.min[2],-.4,'front overhang');near(box.max[2],dimensions[1]+.4,'back overhang');
  for(const m of [board,tile,membrane]){assert.equal(architectureClosed({...roof,meshes:[m],source:{}})[0].closed,true);assert.ok(legacyVerticalHits([m],dimensions[0]*.47,dimensions[1]/2).length,'Continuous real center/valley layer');}
  const centerTop=legacyVerticalHits([tile],dimensions[0]*.47,dimensions[1]/2).at(-1)!;
  if(ridgeParts.length===2){near(centerTop,.24,'Actual valley top');assert.equal(parts.filter(m=>m.name==='谷部连续防水金属槽').length,1);for(const z of[dimensions[1]/4,dimensions[1]*3/4])near(legacyVerticalHits([tile],dimensions[0]*.47,z).at(-1)!,1.72,'Two true roof ridges');}else near(centerTop,1.72,'True single roof ridge');
  let bearingChecks=0,floorContacts=0;const groups=a.source!.instanceGroups as Record<string,string>,floors=a.instances.filter(i=>groups[i.id]==='floor');
  for(const pair of r.supports){
   const col=a.instances.find(i=>i.id===pair.column)!,bear=a.instances.find(i=>i.id===pair.bearing)!,column=p.assets[col.assetId],bearing=p.assets[bear.assetId];
   for(const dx of[-.16,0,.16])for(const dz of[-.14,0,.14]){
    const x=col.position[0]+dx,z=col.position[2]+dz,roofHits=legacyVerticalHits([board],x-instance.position[0],z-instance.position[2]),bearingHits=legacyVerticalHits(bearing.meshes!,x-bear.position[0],z-bear.position[2]),columnHits=legacyVerticalHits(column.meshes!,dx,dz);
    assert.ok(roofHits.length&&bearingHits.length&&columnHits.length);near(roofHits[0]+instance.position[1],bearingHits.at(-1)!+bear.position[1],'Actual roof underside-to-bearing');near(bearingHits[0]+bear.position[1],columnHits.at(-1)!+col.position[1],'Actual column-to-bearing');bearingChecks++;
   }
   for(const dx of[-.12,.12])for(const dz of[-.12,.12]){
    const x=col.position[0]+dx,z=col.position[2]+dz,hit=floors.some(i=>{const asset=p.assets[i.assetId],b=assetBoundsM(asset)!,xx=x-i.position[0],zz=z-i.position[2];if(xx<b.min[0]||xx>b.max[0]||zz<b.min[2]||zz>b.max[2])return false;const hits=legacyVerticalHits(asset.meshes!,xx,zz);return hits.length&&Math.abs(hits.at(-1)!+i.position[1]-col.position[1])<2e-8;});assert.ok(hit,'Actual floor below column foot');floorContacts++;
   }
  }
  checks.roof={dimensionsM:dimensions.slice(0,2),ridges:ridgeParts.length,continuousLayers:3,bearingChecks,floorContacts,originalSeedRGBBound:false};
 }else if(id==='BUILT-182'){
  const child=p.assets[a.instances[0].assetId],parts=architectureComponents(child),pad=legacyPartBounds(parts.find(m=>m.name==='站台混凝土承体')!),paving=legacyPartBounds(parts.find(m=>m.name==='石铺面')!),ramp=parts.find(m=>m.name==='连续缓坡')!;
  assert.deepEqual(pad.min,[-7,0,-7]);assert.deepEqual(pad.max,[7,.15,7]);near(paving.max[1],.2,'Pad walk level');assert.equal(parts.filter(m=>m.name==='金色实际涂线').length,3);
  for(const t of[0,.25,.5,.75,1]){const z=-11+4*t,ys=legacyVerticalHits([ramp],0,z);assert.ok(ys.length);near(ys.at(-1)!,.2*t,'Actual continuous ramp slope');}
  near(legacyVerticalHits([ramp],0,-7).at(-1)!,paving.max[1],'Actual ramp-to-pad contact');assert.equal(d.identityBound,false);checks.pad={sizeM:14,strips:3,rampContact:true,identityBound:false};
 }else{
  const expected:Record<string,V3>={'BUILT-170':[2.5,1.5,5.5],'BUILT-171':[3.3,1.5,16],'BUILT-172':[3.3,1.5,16],'BUILT-173':[2.5,1.5,3.5],'BUILT-174':[2.5,1.5,5.5],'BUILT-175':[4.5,1.5,11],'BUILT-176':[14,.8,17]},instance=a.instances[0],parts=architectureComponents(p.assets[instance.assetId]),body=legacyPartBounds(parts.find(m=>m.name.startsWith('body'))!),head=legacyPartBounds(parts.find(m=>m.name.startsWith('head'))!),trim=parts.find(m=>m.name.startsWith('trim'))!;
  assert.equal(a.instances.length,1);assert.equal(parts.length,3);body.max.forEach((v,k)=>near(v-body.min[k],expected[id][k],'Actual source body dimensions'));near(head.min[1],body.max[1],'Body/head actual contact');near(head.max[1]-head.min[1],id==='BUILT-176'?1.8:.8,'Head source height');if(id==='BUILT-176')near(head.max[0]-head.min[0],3,'Flight head width');
  near(instance.position[1],id==='BUILT-173'?2.5:0,'Source cable body offset');assert.equal(trim.material,p.styles.yunshan.vehicleInactiveOptic);assert.equal(p.materials[trim.material].intensity,0);assert.equal(d.vehicle.identityBound,false);assert.equal(d.vehicle.completeVehicle,false);
  checks.vehicle={bodyM:expected[id],worldBodyMinY:body.min[1]+instance.position[1],headHeightM:head.max[1]-head.min[1],actualThreeDisplayBoxes:true,identityBound:false};
 }
 return{passed:true,catalogId:id,parameters:a.source!.parameters,sources,components,checks};
}
