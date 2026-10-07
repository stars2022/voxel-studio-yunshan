import assert from 'node:assert/strict';
import {Vector3} from 'three';
import type {Assembly,Project,V3} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {geometryData,assetBoundsM} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {architectureClosed} from './architecture-audit';
import {auditShape,inside,penetration} from './mesh-audit';

const near=(a:number,b:number,note:string)=>assert.ok(Math.abs(a-b)<2e-8,note+': '+a+' vs '+b);
export function auditAgeVariant(p:Project,a:Assembly){
 const id=String(a.source!.catalogId),d=a.source!.ageVariant as any,expected=({'CHAR-017':{height:.6,body:'CHAR-061',headId:'CHAR-067',head:.19,band:'infant',range:[0,2]},'CHAR-018':{height:1,body:'CHAR-062',headId:'CHAR-067',head:.205,band:'preschool',range:[2,6]},'CHAR-019':{height:1.2,body:'CHAR-063',headId:'CHAR-068',head:.215,band:'school',range:[6,12]},'CHAR-020':{height:1.6,body:'CHAR-064',headId:'CHAR-068',head:.23,band:'teen',range:[12,18]},'CHAR-021':{height:1.8,body:'CHAR-059',headId:'CHAR-066',head:.24,band:'adult',range:[18,140]}}as Record<string,{height:number;body:string;headId:string;head:number;band:string;range:number[]}>)[id];assert.ok(expected);
 assert.equal(a.source!.kind,'catalog-variant');assert.equal(a.source!.parentCatalogId,'CHAR-001');assert.equal(d.bodyCatalogId,expected.body);assert.deepEqual(d.ageRangeInclusiveExclusive,expected.range);assert.equal((a.source!.parameters as any).ageBand,expected.band);assert.equal(d.adultUniformScale,false);assert.equal(d.originalAgeProfileBound,false);
 const sources=Object.entries(d.parentSourceGeometryHashes).map(([id,value])=>({id,unchanged:hash(geometryData(p.assets[id]))===value}));assert.ok(sources.length&&sources.every(r=>r.unchanged));
 const original=p.assets[d.originalBodyAssetId],bodyI=a.instances.find(i=>i.id===d.bodyInstance)!,headI=a.instances.find(i=>i.id===d.headInstance)!,body=p.assets[bodyI.assetId],head=p.assets[headI.assetId];assert.equal(a.instances.length,2);
 assert.equal(hash(geometryData(original)),d.originalBodyGeometrySHA256);assert.equal(hash(geometryData(head)),d.headGeometrySHA256);assert.equal(original.source!.catalogId,expected.body);assert.equal(head.source!.catalogId,expected.headId);
 const bounds=assemblyBoundsM(p,a);near(bounds.min[1],0,'Both real soles on same ground');near(bounds.max[1],expected.height,'Actual full head/body height');near(assetBoundsM(head)!.max[1],expected.head,'Unscaled age-specific head height');near(body.ports.find(p=>p.id==='neck')!.position[1]+bodyI.position[1],head.ports.find(p=>p.id==='neck')!.position[1]+headI.position[1],'Actual neck socket registration');
 const components=a.instances.map(i=>{const asset=p.assets[i.assetId],closed=architectureClosed(asset),native=nativeIslandAttachments(asset);assert.ok(closed.length&&closed.every(c=>c.closed&&c.oriented));assert.ok(native.length&&native.every(n=>n.attached));
  for(const m of asset.meshes??[]){assert.equal(m.collision,false);assert.equal(p.materials[m.material].solid,false);for(let k=0;k<m.indices.length;k+=3){const vs=m.indices.slice(k,k+3).map(j=>new Vector3(...m.positions.slice(j*3,j*3+3)as V3)),normal=new Vector3(...m.normals.slice(m.indices[k]*3,m.indices[k]*3+3)as V3);assert.ok(vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0])).dot(normal)>1e-13);}}
  for(const[,m]of new Grid(asset.chunks).cells())assert.equal(p.materials[m].solid,false);
  return{id:asset.id,closedParts:closed.length,nativeCells:new Grid(asset.chunks).count,nativeIslands:native.length,allNativeAttached:true,nonphysical:true};
 });
 let nativeMoves=0;
 if(body!==original){const fit=body.source!.ageBodyFit as any,restored=new Grid(),g=new Grid(body.chunks);assert.equal(fit.nativeCellSizeM,.005);assert.equal(g.count,new Grid(original.chunks).count);assert.equal(fit.nativeMoves.length,g.count);assert.ok(fit.nativeIslands.every((r:any)=>Number.isInteger(r.deltaCellsY)));
  for(const row of fit.nativeMoves){assert.equal(g.get(row.to),row.material);restored.set(row.from,row.material);assert.equal(row.from[0],row.to[0]);assert.equal(row.from[2],row.to[2]);assert.ok(Number.isInteger(row.to[1]-row.from[1]));}
  assert.equal(hash([...restored.cells()].sort()),hash([...new Grid(original.chunks).cells()].sort()));nativeMoves=fit.nativeMoves.length;
  for(let j=0;j<body.meshes!.length;j++){const m=body.meshes![j],old=original.meshes![j];assert.equal(m.name,old.name);assert.equal(hash(m.indices),hash(old.indices));assert.equal(hash(m.uvs),hash(old.uvs));m.positions.forEach((v,k)=>near(v,old.positions[k]*(k%3===1?fit.verticalFactor:1),'Actual independent child body transform'));}
 }else assert.equal(hash(geometryData(body)),d.originalBodyGeometrySHA256);
 const collar=body.meshes!.find(m=>m.name==='衣领承接颈部')!,insert=head.meshes!.find(m=>m.name==='颈部插接')!,worldHead=(m:typeof insert)=>auditShape(m.name,m.positions.map((v,k)=>v+headI.position[k%3]),m.indices),worldBody=(m:typeof collar)=>auditShape(m.name,m.positions.map((v,k)=>v+bodyI.position[k%3]),m.indices);
 const bodyShape=worldBody(collar),headShape=worldHead(insert),contactSamples=[];
 for(const x of[-.012,0,.012])for(const z of[-.012,0,.012]){const point:V3=[x,d.neckY-.010,z];assert.ok(inside(new Vector3(...point),bodyShape)&&inside(new Vector3(...point),headShape),'Actual inserted neck touches real collar solid');contactSamples.push(point);}
 const pairs=penetration(body.meshes!.map(worldBody),head.meshes!.map(worldHead));assert.ok(pairs.details.every(r=>['衣领承接颈部','髋腹胸肩连续衣身'].includes(r.a)&& (r.b==='颈部插接'||(r.b.startsWith('独立颅额颧颊下颌')||r.b.startsWith('独立颅面-')))),'Only intended neck/collar insertion can overlap');
 const soleMeshes=body.meshes!.filter(m=>m.name.startsWith('中性衣套足端'));assert.equal(soleMeshes.length,2);for(const m of soleMeshes)near(Math.min(...m.positions.filter((_,k)=>k%3===1)),0,'Actual covered sole contact');
 return{passed:true,catalogId:id,parameters:a.source!.parameters,actualHeightM:bounds.max[1]-bounds.min[1],unscaledHeadHeightM:expected.head,headToHeightRatio:expected.head/expected.height,sourceBody:expected.body,originalParentComponents:sources.length,sources,components,nativeCellsMovedAsRigidIslands:nativeMoves,neckSolidOverlapSamples:contactSamples.length,intendedNeckInsertion:pairs,bodyAndHeadSourceUnchanged:true,originalProfileBound:false,scope:'Independent age-specific clothed body/head with two real sole contacts and actual neck insertion; neutral mittens/socks, static standing, no detailed hand/foot claim or runtime age controller.'};
}
