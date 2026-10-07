import assert from 'node:assert/strict';
import type {Project,Assembly,V3} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {checkGeometry,gridComponents} from '../../src/core/checks';
import {geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {architectureClosed} from './architecture-audit';
import {finalVariantSpec} from '../../src/production/final-variant-spec';
function finalClosure(asset:Project['assets'][string],id:string){
 if(id!=='ENV-007')return architectureClosed(asset);
 assert.equal((asset.source!.environmentVariant as any).jointMaterialShell,true);
 const meshes=asset.meshes!;assert.equal(meshes.length,2);assert.ok(meshes.every(m=>m.collision));
 const combined={...meshes[0],name:'joint bedrock/weathered exterior',positions:[] as number[],normals:[] as number[],uvs:[] as number[],indices:[] as number[]};
 for(const m of meshes){const offset=combined.positions.length/3;combined.positions.push(...m.positions);combined.normals.push(...m.normals);combined.uvs.push(...m.uvs);combined.indices.push(...m.indices.map(i=>i+offset));}
 let volume=0;for(let k=0;k<combined.indices.length;k+=3){const[a,b,c]=combined.indices.slice(k,k+3).map(i=>combined.positions.slice(i*3,i*3+3));volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;}assert.ok(volume>0);
 return architectureClosed({...asset,source:{...asset.source,componentIndexRanges:undefined},meshes:[combined]}).map(c=>({...c,jointMaterialShell:true,signedVolumeM3:volume}));
}
export function auditFinalVariant(p:Project,a:Assembly){
 const id=String(a.source!.catalogId),spec=finalVariantSpec(id,a.source!.parameters as Record<string,string|number>),s=p.styles.yunshan,d=a.source!.finalVariant as any;assert.equal(a.source!.parentCatalogId,spec.parentCatalogId);assert.ok(d&&d.parents.length);assert.equal(d.originalControllerBound,false);
 for(const parent of d.parents){const original=p.assets[parent.assetId];assert.ok(original);assert.equal(original.source!.catalogId,parent.catalogId);assert.equal(hash(geometryData(original)),parent.geometrySHA256);}
 const components=a.instances.map(i=>{const asset=p.assets[i.assetId],grid=new Grid(asset.chunks),closure=finalClosure(asset,id),attached=asset.meshes?.length?nativeIslandAttachments(asset):[];assert.ok(closure.every(c=>c.closed&&c.oriented),JSON.stringify({id,asset:asset.id,closure}));assert.ok(attached.every(c=>c.attached),JSON.stringify({id,asset:asset.id,attached}));assert.equal(asset.source!.kind,'assembly-derived-component');assert.equal(asset.source!.sourceGeometrySHA256,hash(geometryData(p.assets[String(asset.source!.sourceAssetId)])));for(const m of asset.meshes??[])assert.equal(m.collision,p.materials[m.material].solid);const materials=[...new Set([...grid.cells()].map(([,m])=>m).concat((asset.meshes??[]).map(m=>m.material)))];assert.ok(materials.every(m=>p.materials[m]));return{assetId:asset.id,cells:grid.count,closure,attached,materials};});
 const bounds=assemblyBoundsM(p,a);assert.ok(bounds.min[1]>=-1e-8);let nativeContacts:any;
 if(id.startsWith('LIFE-')){
  // Exact occupied-volume check includes soft materials as visual volume only.
  const visual={...p,instances:Object.fromEntries(a.instances.map(i=>[i.id,i])),materials:Object.fromEntries(Object.entries(p.materials).map(([id,m])=>[id,{...m,solid:true}]))};nativeContacts=checkGeometry(visual);assert.deepEqual(nativeContacts.collisions,[]);assert.deepEqual(nativeContacts.unsupported,[]);assert.deepEqual(nativeContacts.warnings,[]);
  for(const i of a.instances){const asset=p.assets[i.assetId],source=asset.source!.furnitureResize as any,roles=source.material.purposeCorrections??{},g=new Grid(asset.chunks);for(const[oldRole,newRole]of Object.entries(roles)){assert.ok([...g.cells()].some(([,m])=>m===p.styles[d.style][String(newRole)]));if(oldRole!==newRole)assert.ok(![...g.cells()].some(([,m])=>m===s[oldRole]));}}
 }else{
  const asset=p.assets[a.instances[0].assetId],parent=p.assets[d.parents[0].assetId],g=new Grid(asset.chunks),original=new Grid(parent.chunks),details=asset.source!.environmentVariant as any;
  if(id==='ENV-007'){assert.deepEqual(bounds,{min:[-8,0,-6],max:[8,18,6]});assert.equal(g.count,4);}
  if(id==='ENV-018'){assert.ok(details.sourceSections.length===6);assert.ok(bounds.max[1]>1);}
  if(id==='ENV-033'){assert.equal(bounds.min[1],0);assert.equal(bounds.max[1],153);assert.equal(details.dropM,153);assert.equal(asset.ports.length,details.lanes.length*2);assert.ok(components[0].materials.every(m=>p.materials[m].category==='water'&&!p.materials[m].solid&&p.materials[m].intensity===0));for(const m of asset.meshes??[])for(let k=0;k<m.positions.length;k+=3)assert.ok(Math.abs(m.uvs[k/3*2+1]-(153-m.positions[k+1]))<1e-6);}
  if(id==='ENV-051'){assert.equal(g.count,original.count);assert.deepEqual([...g.cells()].map(([v])=>v),[...original.cells()].map(([v])=>v));assert.equal(details.distinctSpecies,false);assert.ok(Math.abs(bounds.max[1]-Number(spec.parameters.treeHeight))<.21);}
  if(id==='ENV-058'){assert.equal(details.originalSegments,(parent.source!.anatomy as any).segments.length);assert.notEqual(details.axisFactors[0],details.axisFactors[1]);assert.equal(details.uniformAdultScale,false);}
  if(id==='ENV-075'){const wood=(grid:Grid)=>[...grid.cells()].filter(([,m])=>m===s.shrubTwig);assert.deepEqual(wood(g),wood(original));for(const[v]of g.cells())assert.ok(original.get(v));if(spec.parameters.vegetationState==='healthy')assert.equal(g.count,original.count);else{assert.ok(g.count<original.count);assert.equal(gridComponents(g).length,1);}}
  if(id==='ENV-083'){assert.ok(asset.openings.length>0);for(const o of asset.openings)for(let x=o.min[0];x<o.max[0];x++)for(let y=o.min[1];y<o.max[1];y++)for(let z=o.min[2];z<o.max[2];z++)assert.equal(g.get([x,y,z]),0);assert.ok(![...g.cells()].some(([,m])=>m===s.wall));assert.equal(gridComponents(g).length,1);}
 }
 return{passed:true,catalogId:id,params:spec.parameters,bounds,components,nativeContacts,parentConfigurations:d.parents.map((r:any)=>({id:r.catalogId,parameters:r.parameters,geometrySHA256:r.geometrySHA256})),originalRuntimeBound:false};
}
