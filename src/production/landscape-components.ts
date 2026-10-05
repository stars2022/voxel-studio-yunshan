import type {Asset,Project,V3} from '../core/types';
import {CivicComponent} from './civic-components';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {civicAsset} from './civic-landmarks';
import {emptyMesh,quad,triangle} from './mesh-shapes';
import {fleetPart,type FleetSource} from './fleet-components';

export type HeightField=(x:number,z:number)=>number;
export type TerrainTile={instance:string;assetId:string;authorityAssetId:string;origin:V3;size:number;step:number;detail:string};
const clean=(v:number)=>Math.round(v*1e9)/1e9||0;
/** Natural minimum components are 0.2m rock cells, not architectural copper pins. */
export class LandscapeComponent extends CivicComponent {
 finish():Asset{const a=super.finish();a.cellSize=.2;a.source!.minimumComponent='0.2m native rock cells';return a;}
 rock(x:number,y:number,z:number,role='bedrock'){this.grid.set([x,y,z].map(n=>Math.round(n/.2))as V3,this.role(role));}
}

/** Closed volume. Coarse boundary cells fan to the same fine edge vertices as the near form. */
export function fieldSolid(c:CivicComponent,name:string,role:string,size:number,step:number,bottom:HeightField,top:HeightField,boundaryStep=step){
 const m=emptyMesh(name,c.role(role)),lo=-size/2,hi=size/2,uv:number[]=[];
 const add=(a:V3,b:V3,d:V3,normal:V3,field?:HeightField,up=1)=>{const start=m.positions.length;triangle(m,a,b,d,normal);for(let k=start;k<m.positions.length;k+=3){const[x,y,z]=m.positions.slice(k,k+3);if(field){const e=.05,dx=(field(x+e,z)-field(x-e,z))/(2*e),dz=(field(x,z+e)-field(x,z-e))/(2*e),n=[-dx,1,-dz],length=Math.hypot(...n);m.normals.splice(k,3,...n.map(v=>up*v/length));uv.push(x,z);}else{uv.push(Math.abs(normal[0])>.5?z:x,y);}}};
 for(let x=lo;x<hi-1e-6;x+=step)for(let z=lo;z<hi-1e-6;z+=step){
  const x1=Math.min(hi,x+step),z1=Math.min(hi,z+step),corners:[number,number][]=[[x,z],[x1,z],[x1,z1],[x,z1]];
  if(boundaryStep===step){for(const[field,up]of[[top,1],[bottom,-1]]as [HeightField,number][]){const p=corners.map(([x,z])=>[x,field(x,z),z]as V3);add(p[0],p[1],p[2],[0,up,0],field,up);add(p[0],p[2],p[3],[0,up,0],field,up);}}
  else{
   const ring:[number,number][]=[];for(let j=0;j<4;j++){const a=corners[j],b=corners[(j+1)%4],outer=(a[0]===b[0]&&Math.abs(a[0])===hi)||(a[1]===b[1]&&Math.abs(a[1])===hi),count=outer?Math.round(step/boundaryStep):1;for(let k=0;k<count;k++)ring.push([a[0]+(b[0]-a[0])*k/count,a[1]+(b[1]-a[1])*k/count]);}
   for(const[field,up]of[[top,1],[bottom,-1]]as [HeightField,number][]){const center:V3=[(x+x1)/2,corners.reduce((v,[xx,zz])=>v+field(xx,zz)/4,0),(z+z1)/2];for(let k=0;k<ring.length;k++){const a=ring[k],b=ring[(k+1)%ring.length];add(center,[a[0],field(...a),a[1]],[b[0],field(...b),b[1]],[0,up,0],field,up);}}
  }
 }
 for(let t=lo;t<hi-1e-6;t+=boundaryStep)for(const side of[-1,1])for(const axis of[0,2]){
  const a:[number,number]=axis===0?[side*hi,t]:[t,side*hi],b:[number,number]=axis===0?[side*hi,t+boundaryStep]:[t+boundaryStep,side*hi],p:V3[]=[[a[0],top(...a),a[1]],[b[0],top(...b),b[1]],[b[0],bottom(...b),b[1]],[a[0],bottom(...a),a[1]]],n:V3=axis===0?[side,0,0]:[0,0,side];add(p[0],p[1],p[2],n);add(p[0],p[2],p[3],n);
 }
 c.mesh(m);m.uvs=uv;
}

export function terrainTile(b:ArchitectureBuilder,s:FleetSource,key:string,origin:V3,height:HeightField,step=4,detail='near',size=96):TerrainTile{
 const make=(mode:string)=>civicAsset(b,'terrain-'+key+'-'+origin.join('-')+'-'+step+'-'+mode,id=>{
  const c=new LandscapeComponent(b.p,id,'连续岩土实体与最小原生岩块',['ENV-001','ENV-006','ENV-007'],{key,origin,size,nearStep:step,proxyStep:8,detail:mode,originalWorldBound:false});
  const top=(x:number,z:number)=>height(x+origin[0],z+origin[2]),far=mode==='far';
  fieldSolid(c,'闭合连续基岩实体',far?'distantRock':'bedrock',size,far?8:step,()=>-1,(x,z)=>top(x,z)-.4,step);
  fieldSolid(c,'独立连续风化岩层',far?'distantRock':'weatheredRock',size,far?8:step,(x,z)=>top(x,z)-.4,top,step);
  // Four rock cells meet the actual flat geological underside. They are physical only in the near form.
  for(const x of[-size/2,size/2-.2])for(const z of[-size/2,size/2-.2])c.rock(x,-1.2,z,far?'distantRock':'bedrock');
  const a=c.finish();a.source!.authority=far?'manual nonphysical proxy; near asset retained':'closed authored triangles plus native minimum rock cells';a.source!.physicalProxy=false;a.source!.originalGridContract='Historical0.2m full occupancy retained in original masters; this new continuous alternative does not claim matching voxel collision.';return a;
 });
 const authorityAssetId=make('near'),assetId=detail==='far'?make('far'):authorityAssetId,instance=b.place(assetId,origin,0,detail==='far'?'terrain-proxy':'terrain');
 const tile={instance,assetId,authorityAssetId,origin,size,step,detail};const tiles=(s.terrainTiles??=[])as TerrainTile[];tiles.push(tile);return tile;
}

/** The height of the actual two triangles of a regular near cell, not an analytic approximation. */
export function terrainHeightAt(height:HeightField,x:number,z:number,step:number,originX=-48,originZ=-48){
 const x0=Math.floor((x-originX)/step)*step+originX,z0=Math.floor((z-originZ)/step)*step+originZ,u=(x-x0)/step,v=(z-z0)/step,a=height(x0,z0),b=height(x0+step,z0),c=height(x0+step,z0+step),d=height(x0,z0+step);
 return clean(v<=u?a+(b-a)*u+(c-b)*v:a+(c-d)*u+(d-a)*v);
}
export function terrainPad(b:ArchitectureBuilder,s:FleetSource,key:string,x:number,z:number,ground:number,width=4,depth=4){
 const y=Math.ceil((ground+.2)/.2)*.2,asset=civicAsset(b,'natural-root-seat-'+key,id=>{const c=new LandscapeComponent(b.p,id,'作者根部岩土承接',['ENV-001'],{ground,walkY:y,width,depth});c.box('植入地形的岩基','bedrock',x-width/2,ground-.6,z-depth/2,width,y-ground+.45,depth);c.box('真实表土','surfaceSoil',x-width/2,y-.15,z-depth/2,width,.15,depth);c.rock(x-.2,y-.4,z-.2);return c.finish();}),id=b.place(asset,[0,0,0],0,'terrain-anchor');
 s.contacts.push({name:key+' anchor contacts terrain',point:[x,ground-.02,z],exclude:id});return y;
}
export function grove(b:ArchitectureBuilder,s:FleetSource,key:string,height:HeightField,points:[number,number][],step=4){
 const trees=[];for(const[j,[x,z]]of points.entries()){const ground=terrainHeightAt(height,x,z,step),y=terrainPad(b,s,key+'-'+j,x,z,ground,4,4),catalogId=j%3===0?'ENV-055':'ENV-050',asset=b.original(catalogId,catalogId==='ENV-050'?{height:16}:{}),instance=b.place(asset,[x,y,z],0,'vegetation');s.contacts.push({name:key+' actual tree root to soil',point:[x,y-.02,z],exclude:instance,role:'surfaceSoil'});trees.push({instance,catalogId,position:[x,y,z],ground});}return trees;
}
export function waterRibbon(b:ArchitectureBuilder,key:string,points:V3[],width:number,role='flowWater',startDistance=0){
 return b.place(civicAsset(b,'water-ribbon-'+key,id=>{const c=new CivicComponent(b.p,id,'连续水体表面与真实米制流向',['ENV-027','ENV-028','ENV-034','ENV-035'],{points,width,startDistance,flowBound:false,authority:'closed visual triangles; nonphysical'});
  const edges=points.map((p,j)=>{const a=points[Math.max(0,j-1)],b=points[Math.min(points.length-1,j+1)],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),n=[-dz/len,dx/len];return[[p[0]+n[0]*width/2,p[1],p[2]+n[1]*width/2],[p[0]-n[0]*width/2,p[1],p[2]-n[1]*width/2]]as V3[];});
  const m=emptyMesh('共享拓扑连续水带',c.role(role)),uv:number[]=[];
  const face=(points:V3[],normal:V3,chart:number[][])=>{const start=m.positions.length;quad(m,points,normal);for(let k=start;k<m.positions.length;k+=3){const v=m.positions.slice(k,k+3);const j=points.findIndex(p=>p.every((n,d)=>Math.abs(n-v[d])<1e-8));if(j<0)throw new Error('Water UV vertex missing');uv.push(...chart[j]);}};
  let distance=startDistance;
  for(let j=1;j<points.length;j++){
   const a=points[j-1],b=points[j],next=distance+Math.hypot(...b.map((v,k)=>v-a[k])),top=[edges[j-1][0],edges[j][0],edges[j][1],edges[j-1][1]],bottom=top.map(v=>[v[0],v[1]-.12,v[2]]as V3),chart=[[distance,-width/2],[next,-width/2],[next,width/2],[distance,width/2]];
   face(top,[0,1,0],chart);face(bottom,[0,-1,0],chart);
   for(const side of[0,1]){const k=side===0?[0,1]:[2,3],t=[top[k[0]],top[k[1]],bottom[k[1]],bottom[k[0]]],direction=side===0?1:-1,normal:V3=[-(b[2]-a[2])*direction,0,(b[0]-a[0])*direction],us=k.map(i=>chart[i][0]);face(t,normal,[[us[0],0],[us[1],0],[us[1],.12],[us[0],.12]]);}
   if(j===1)face([top[3],top[0],bottom[0],bottom[3]],[a[0]-b[0],0,a[2]-b[2]],[[width/2,0],[-width/2,0],[-width/2,.12],[width/2,.12]]);
   if(j===points.length-1)face([top[1],top[2],bottom[2],bottom[1]],[b[0]-a[0],0,b[2]-a[2]],[[-width/2,0],[width/2,0],[width/2,.12],[-width/2,.12]]);
   distance=next;
  }
  c.mesh(m);m.uvs=uv;
  const asset=c.finish();asset.source!.waterFlow={routes:[{points,startDistanceM:startDistance}],materialIds:[c.role(role)],animated:false,originalRouteBound:false};return asset;
 }),[0,0,0],0,'water');
}
