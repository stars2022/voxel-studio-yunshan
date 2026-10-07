import assert from'node:assert/strict';
import{Vector3}from'three';
import{Grid}from'../../src/core/grid';
import{geometryData}from'../../src/core/sky';
import{outfitHash as hash}from'../../src/production/outfit-components';
import{architectureClosed}from'../../scripts/lib/architecture-audit';
import{nativeIslandAttachments}from'../../src/production/mixed-review';
import{auditShape,inside,penetration}from'../../scripts/lib/mesh-audit';
import{assemblyBoundsM}from'../../src/production/assembly-geometry';
import {bodyVariantSpec,growthHeads,skinToneColors}from'../../src/production/body-variant-spec';
import {reflectAvatar}from'../../src/production/avatar-assembly';
import {faceAtlasPixels}from'../../src/core/face-atlas';
import type{Assembly,Project,V3}from'../../src/core/types';
export function auditBodyVariant(p:Project,a:Assembly){
 const spec=bodyVariantSpec(String(a.source!.catalogId),a.source!.parameters as Record<string,string|number>),d=a.source!.bodyVariant as any,checks:any={passed:true,catalogId:a.source!.catalogId,family:d.family,parameters:spec.parameters,components:[]};assert.equal(d.family,spec.family);assert.equal(a.source!.parentCatalogId,spec.parentCatalogId);assert.equal(d.originalRuntimeBound,false);assert.equal(d.originalProfileOrPregnancyTimerModified,false);assert.equal(Object.keys(p.styles.yunshan).length,512);
 for(const parent of d.parents)assert.equal(hash(geometryData(p.assets[parent.assetId])),parent.geometrySHA256);
 for(const i of a.instances){const asset=p.assets[i.assetId];const closed=architectureClosed(asset),native=nativeIslandAttachments(asset);assert.ok(closed.every(row=>row.closed&&row.oriented));assert.ok(native.every(row=>row.attached));for(const m of asset.meshes??[]){assert.equal(m.collision,false);assert.equal(p.materials[m.material].solid,false);assert.equal(p.materials[m.material].intensity,0);}checks.components.push({id:asset.id,closedParts:closed.length,nativeCells:new Grid(asset.chunks).count,nativeIslands:native.length,allNativeAttached:true});}
 if(d.family==='body'||d.family==='pregnancy'){
  const body=p.assets[d.installedBodyAssetId],head=p.assets[d.headAssetId],bi=a.instances.find(i=>i.assetId===body.id)!,hi=a.instances.find(i=>i.assetId===head.id)!,neck=body.ports.find(p=>p.id==='neck')!.position;assert.deepEqual(neck,hi.position);assert.equal(assemblyBoundsM(p,a).min[1],0);
  const world=(m:NonNullable<typeof body.meshes>[number],offset:V3)=>auditShape(m.name,m.positions.map((v,k)=>v+offset[k%3]),m.indices),collar=world(body.meshes!.find(m=>m.name==='衣领承接颈部')!,bi.position),insert=world(head.meshes!.find(m=>m.name==='颈部插接')!,hi.position);
  for(const x of[-.012,0,.012])for(const z of[-.012,0,.012]){const point=new Vector3(neck[0]+x,neck[1]-.01,neck[2]+z);assert.ok(inside(point,collar)&&inside(point,insert),'Actual neck inserts both closed surfaces');}
  const hits=penetration(body.meshes!.map(m=>world(m,bi.position)),head.meshes!.map(m=>world(m,hi.position)));assert.ok(hits.details.every(r=>['衣领承接颈部','髋腹胸肩连续衣身','保留胸肩到颈部'].includes(r.a)&& (r.b==='颈部插接'||r.b.startsWith('独立颅'))),'Only intended collar contact');checks.neckContacts=9;checks.neckOverlap=hits;
  if(d.family==='body'){
   const expectedHeight=({'CHAR-076':1.7,'CHAR-077':1.7,'CHAR-078':1.55,'CHAR-079':1.88,'CHAR-080':1.595,'CHAR-081':1.68}as Record<string,number>)[String(a.source!.catalogId)];assert.ok(Math.abs(assemblyBoundsM(p,a).max[1]-expectedHeight)<1e-8);checks.actualHeightM=expectedHeight;
   const old=p.assets[d.parentAssetId],sculpt=body.source!.bodySculpt as any,restored=new Grid(),g=new Grid(body.chunks);assert.equal(g.count,new Grid(old.chunks).count);for(const m of sculpt.nativeMoves){assert.equal(g.get(m.to),m.material);restored.set(m.from,m.material);}assert.equal(hash([...restored.cells()].sort()),hash([...new Grid(old.chunks).cells()].sort()));
   for(const mesh of body.meshes!){const original=old.meshes!.find(m=>m.name===mesh.name)!;assert.deepEqual(mesh.indices,original.indices);assert.deepEqual(mesh.uvs,original.uvs);if(mesh.name.startsWith('中性衣套足端'))assert.deepEqual(mesh,original,'Complete original continuous foot retained byte-for-byte');}
   checks.nativeRigidTranslations=sculpt.nativeMoves.length;checks.footGeometryUnchanged=true;checks.leanForwardM=sculpt.leanForwardM;
  }else{
   const belly=p.assets[d.abdomenAssetId],original=p.assets[d.parentAssetId],stage=belly.source!.pregnancyStage as any,mesh=belly.meshes!.find(m=>m.name.startsWith('衣覆孕期'))!,offset=a.instances.find(i=>i.assetId===belly.id)!.position;assert.equal(stage.timerBound,false);assert.equal(stage.replacementNotOverlay,true);assert.ok(!body.meshes!.some(m=>m.name==='髋腹胸肩连续衣身'));if(stage.stage==='late')assert.equal(hash(geometryData(belly)),hash(geometryData(original)));
   const plane=(m:typeof mesh,y:number,at:V3)=>[...new Set(Array.from({length:m.positions.length/3},(_,i)=>m.positions.slice(i*3,i*3+3)).filter(v=>Math.abs(v[1]+at[1]-y)<1e-8).map(v=>[v[0]+at[0],v[2]+at[2]].map(n=>Math.round(n*1e8)/1e8||0).join(',')))].sort();
   const lower=body.meshes!.find(m=>m.name==='保留髋部到下接缝')!,upper=body.meshes!.find(m=>m.name==='保留胸肩到颈部')!;assert.deepEqual(plane(mesh,d.replacementIntervalM[0],offset),plane(lower,d.replacementIntervalM[0],bi.position));assert.deepEqual(plane(mesh,d.replacementIntervalM[1],offset),plane(upper,d.replacementIntervalM[1],bi.position));
   let volume=0;for(let k=0;k<mesh.indices.length;k+=3){const[v,w,z]=mesh.indices.slice(k,k+3).map(i=>new Vector3(...mesh.positions.slice(i*3,i*3+3)));volume+=v.dot(w.clone().cross(z))/6;}assert.ok(volume>0);checks.abdomenVolumeM3=volume;checks.actualSeamsMatched=true;checks.stage=stage.stage;checks.fit=stage.fit;
  }
 }else if(d.family==='growth'){
  const definition=growthHeads[String(spec.parameters.growthBand)];assert.equal(d.ageRange[0],definition.range[0]);
  const old=p.assets[d.selectedHeadParent],current=p.assets[d.installedHeadAssetId],change=current.source!.faceAtlasDerivation as any;assert.equal(old.meshes!.length,current.meshes!.length);for(let k=0;k<current.meshes!.length;k++){const m=current.meshes![k],o=old.meshes![k];assert.deepEqual(m.positions,o.positions);assert.deepEqual(m.normals,o.normals);assert.deepEqual(m.indices,o.indices);if(!m.faceAtlas)assert.deepEqual(m.uvs,o.uvs);else for(let j=0;j<m.uvs.length;j+=2)assert.ok(m.uvs[j]>change.tile/6&&m.uvs[j]<(change.tile+1)/6);}
  const restored=structuredClone(current),g=new Grid(restored.chunks);for(const row of change.removedCells){assert.equal(g.get(row.cell),0);g.set(row.cell,row.material);}const serialized=g.serialize();restored.chunks=Object.fromEntries(change.originalChunkOrder.map((key:string)=>[key,serialized[key]]));const face=restored.meshes!.find(m=>m.faceAtlas)!;face.uvs=change.originalUV;delete face.faceAtlas;assert.equal(hash(geometryData(restored)),hash(geometryData(old)));const actualFace=current.meshes!.find(m=>m.faceAtlas)!;assert.deepEqual(actualFace.faceAtlas,p.assets[d.resourceAssetId].meshes![0].faceAtlas);checks.faceCell=definition.tile;checks.headSource=definition.catalogId;checks.headHeightM=definition.height;checks.originalShapeRecoveredExactly=true;checks.atlasPixelsSHA256=hash([...faceAtlasPixels(actualFace.faceAtlas!,p.materials).data]);
 }else{
  const base=p.styles.yunshan,style=p.styles[d.styleName],expected=skinToneColors[Number(spec.parameters.skinTone)],to=style.skinSurface;assert.equal(d.color,expected);assert.equal(p.materials[to].color,expected);assert.notEqual(to,base.skinSurface);assert.equal(p.materials[to].category,'skin');assert.equal(p.materials[to].solid,false);for(const[role,material]of Object.entries(base))if(role!=='skinSurface')assert.equal(style[role],material);assert.equal(d.derivatives.length,5);
  const mapped=[];for(const row of d.derivatives){const original=p.assets[row.source],expected=row.mirrored?reflectAvatar(original,'expected'):original,installed=p.assets[row.installed],restored=structuredClone(installed),g=new Grid();let cells=0,meshes=0;for(const[v,m]of new Grid(installed.chunks).cells()){g.set(v,m===to?base.skinSurface:m);if(m===to)cells++;}restored.chunks=g.serialize();for(const m of restored.meshes??[])if(m.material===to){m.material=base.skinSurface;meshes++;}assert.ok(cells+meshes>0);assert.equal(hash(geometryData(restored)),hash(geometryData(expected)));for(const field of['origin','cellSize','parts','ports','openings','rig']as const)assert.equal(hash(installed[field]??null),hash(expected[field]??null),'Exact native JSON field '+field);mapped.push({source:row.source,installed:row.installed,mirrored:row.mirrored,cells,meshes});}
  assert.equal(a.instances.length,7);checks.sourceRGB=d.color;checks.style=d.styleName;checks.skinMaterialId=to;checks.skinParts=mapped;checks.originalRigAndShapeUnchanged=true;
 }
 checks.parentsRetained=d.parents.length;checks.originalRuntimeBound=false;return checks;
}

