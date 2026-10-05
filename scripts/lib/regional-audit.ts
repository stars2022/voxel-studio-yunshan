import assert from 'node:assert/strict';
import {Vector3} from 'three';
import type {Assembly,Project,V3} from '../../src/core/types';
import {architectureComponents} from './architecture-audit';
import {CivicAudit} from './civic-audit';
import {fleetClearance} from './fleet-audit';
import {inside} from './mesh-audit';

/** The manual proxy retains explicit near collision assets. It is never treated as a matching voxel proxy. */
export function regionalAuthority(p:Project,a:Assembly){const result=structuredClone(a),bindings=(a.source!.physicalAuthorityBindings??[])as {instanceId:string;visualAssetId:string;collisionAssetId:string}[];for(const r of bindings){const i=result.instances.find(i=>i.id===r.instanceId)!;assert.ok(i&&i.assetId===r.visualAssetId&&p.assets[r.collisionAssetId]);i.assetId=r.collisionAssetId;}return result;}
export function regionalClearance(p:Project,a:Assembly){
 const authority=regionalAuthority(p,a),q=new CivicAudit(p,authority),r=fleetClearance(q),bearings=[];
 for(const j of(a.source!.bearingJoints??[])as {name:string;point:V3;roles:string[]}[]){const hits=q.point(j.point,undefined,true),actual=new Set(hits.map(h=>h.material));bearings.push({...j,hits,connected:j.roles.every(role=>actual.has(p.styles.yunshan[role]))});}
 const steppedBodies=[];for(const w of(a.source!.walkSamples??[])as {name:string;point:V3}[]){const v=w.point;steppedBodies.push(q.clear(w.name+' conservative0.35m radius upper-body volume',[v[0]-.35,v[1]+.205,v[2]-.35],[v[0]+.35,v[1]+1.72,v[2]+.35]));}
 const water=[];for(const junction of(a.source!.waterJunctions??[])as {name:string;point:V3;minimumPieces:number}[]){const pieces=[];for(const i of a.instances){const v=new Vector3(...q.local(i,junction.point)),cached=q.assets.get(i.assetId);if(!cached)continue;for(const shape of cached.shapes)if([p.styles.yunshan.flowWater,p.styles.yunshan.fallWater].includes(shape.material)&&(inside(v,shape)||shape.ts.some(t=>t.closestPointToPoint(v,new Vector3()).distanceToSquared(v)<1e-14)))pieces.push({instance:i.id,part:shape.name,material:shape.material});}water.push({...junction,pieces,connected:pieces.length>=junction.minimumPieces});}
 return{...r,bearings,steppedBodies,water,authorityBindings:a.source!.physicalAuthorityBindings??[],physicalScope:'Body/footing queries use actual near collision triangles. A selected far visual form requires its explicit exported authority descriptor; runtime automatic binding remains absent.'};
}

export function terrainSeams(p:Project,a:Assembly){
 const tiles=(a.source!.terrainTiles??[])as {instance:string;assetId:string;authorityAssetId:string;origin:V3;size:number;step:number;detail:string}[],tops=new Map<string,Map<string,{point:V3;normal:V3}>>();
 for(const t of tiles){const asset=p.assets[t.assetId],shape=architectureComponents(asset).find(m=>m.name==='独立连续风化岩层')!;assert.ok(shape);const vertices=new Map<string,{point:V3;normal:V3}>();for(let k=0;k<shape.positions.length;k+=3){if(shape.normals[k+1]<=0)continue;const point=shape.positions.slice(k,k+3).map((n,d)=>Math.round((n+t.origin[d])*1e8)/1e8)as V3,key=point[0]+','+point[2],normal=shape.normals.slice(k,k+3)as V3,old=vertices.get(key);if(!old||point[1]>old.point[1])vertices.set(key,{point,normal});}tops.set(t.instance,vertices);}
 const seams=[];for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){
  const a=tiles[i],b=tiles[j],axis=Math.abs(a.origin[0]-b.origin[0])===a.size&&a.origin[2]===b.origin[2]?0:Math.abs(a.origin[2]-b.origin[2])===a.size&&a.origin[0]===b.origin[0]?2:-1;if(axis===-1)continue;const edge=(a.origin[axis]+b.origin[axis])/2,other=axis===0?2:0,at=tops.get(a.instance)!,bt=tops.get(b.instance)!,samples=[];
  for(let v=a.origin[other]-a.size/2;v<=a.origin[other]+a.size/2+1e-7;v+=a.step){const key=axis===0?edge+','+v:v+','+edge,aa=at.get(key),bb=bt.get(key);assert.ok(aa&&bb,'missing actual seam vertex '+key);const heightError=Math.abs(aa.point[1]-bb.point[1]),normalError=Math.max(...aa.normal.map((n,d)=>Math.abs(n-bb.normal[d])));samples.push({point:aa.point,heightError,normalError});}
  seams.push({a:a.instance,b:b.instance,axis,samples,joined:samples.every(s=>s.heightError<1e-7&&s.normalError<1e-7)});
 }
 const proxies=tiles.filter(t=>t.detail==='far').map(t=>{const near=p.assets[t.authorityAssetId],far=p.assets[t.assetId],count=(a:typeof near)=>(a.meshes??[]).reduce((n,m)=>n+m.indices.length/3,0);return{instance:t.instance,nearAssetId:near.id,proxyAssetId:far.id,nearTriangles:count(near),proxyTriangles:count(far),nonphysical:far.meshes!.every(m=>!m.collision),authorityRetained:true};});
 return{tiles:tiles.length,seams,proxies};
}
