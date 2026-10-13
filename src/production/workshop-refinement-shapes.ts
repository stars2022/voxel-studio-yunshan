import {IcosahedronGeometry} from 'three';
import type {AuthoredMesh} from '../core/authored-mesh';
import type {V3} from '../core/types';
import {emptyMesh,quad,triangle} from './mesh-shapes';
import {roundMember} from './refinement-shapes';
import {projectedUV} from './market-refinement-shapes';

/** A finite annular XY plate, including the bore, both faces and sector ends. */
export function polarPlate(name:string,material:number,center:V3,outer:(i:number)=>number,inner:number,depth:number,collision:boolean,n=64,start=0,end=Math.PI*2):AuthoredMesh{
 const m=emptyMesh(name,material,collision),point=(i:number,r:number,back=false):V3=>{const a=start+(end-start)*i/n;return[center[0]+r*Math.cos(a),center[1]+r*Math.sin(a),center[2]+(back?depth:0)];};
 for(let i=0;i<n;i++){
  const a=start+(end-start)*(i+.5)/n,normal:V3=[Math.cos(a),Math.sin(a),0];
  for(const back of[false,true])quad(m,[point(i,outer(i),back),point(i+1,outer(i+1),back),point(i+1,inner,back),point(i,inner,back)],[0,0,back?1:-1]);
  quad(m,[point(i,outer(i)),point(i+1,outer(i+1)),point(i+1,outer(i+1),true),point(i,outer(i),true)],normal);
  quad(m,[point(i,inner),point(i,inner,true),point(i+1,inner,true),point(i+1,inner)],normal.map(v=>-v)as V3);
 }
 if(Math.abs(end-start-Math.PI*2)>1e-8)for(const i of[0,n]){const a=i===0?start:end,s=i===0?-1:1;quad(m,[point(i,inner),point(i,outer(i)),point(i,outer(i),true),point(i,inner,true)],[-s*Math.sin(a),s*Math.cos(a),0]);}
 return projectedUV(m);
}

/** Closed stadium belt shell: upper run, lower return and continuous roll ends. */
export function conveyorLoop(name:string,material:number,left:number,right:number,y:number,z:number,width:number,radius:number,thickness:number,collision:boolean){
 const m=emptyMesh(name,material,collision),N=24;
 const loop=(r:number)=>[...Array.from({length:N+1},(_,i)=>{const a=-Math.PI/2+i/N*Math.PI;return[right+r*Math.cos(a),y+r*Math.sin(a)];}),...Array.from({length:N+1},(_,i)=>{const a=Math.PI/2+i/N*Math.PI;return[left+r*Math.cos(a),y+r*Math.sin(a)];})];
 const o=loop(radius),inside=loop(radius-thickness),point=(p:number[],back=false):V3=>[p[0],p[1],z+(back?width:0)];
 for(let i=0;i<o.length;i++){const j=(i+1)%o.length,cx=Math.max(left,Math.min(right,(o[i][0]+o[j][0])/2)),normal:V3=[(o[i][0]+o[j][0])/2-cx,(o[i][1]+o[j][1])/2-y,0];
  for(const back of[false,true])quad(m,[point(o[i],back),point(o[j],back),point(inside[j],back),point(inside[i],back)],[0,0,back?1:-1]);
  quad(m,[point(o[i]),point(o[j]),point(o[j],true),point(o[i],true)],normal);
  quad(m,[point(inside[i]),point(inside[i],true),point(inside[j],true),point(inside[j])],normal.map(v=>-v)as V3);
 }
 return projectedUV(m);
}

/** Connected faceted stone; finite mineral skins intersect their source facets. */
export function mineralRock(name:string,roles:{matrix:number;stone:number;vein:number},center:V3,radii:V3,solid:(id:number)=>boolean){
 const g=new IcosahedronGeometry(1,1),ps=g.getAttribute('position'),vertices:V3[]=[];
 for(let i=0;i<ps.count;i++){const v=[ps.getX(i),ps.getY(i),ps.getZ(i)],f=1+.09*Math.sin(v[0]*8+v[1]*5-v[2]*7);vertices.push(v.map((q,k)=>center[k]+q*radii[k]*f)as V3);}g.dispose();
 const m=emptyMesh(name,roles.matrix,solid(roles.matrix)),patches:AuthoredMesh[]=[];
 for(let i=0;i<vertices.length;i+=3){const vs=vertices.slice(i,i+3),c=vs[0].map((_,k)=>vs.reduce((n,p)=>n+p[k]/3,0))as V3;triangle(m,vs[0],vs[1],vs[2],c.map((v,k)=>v-center[k])as V3);
  if((i/3)%7!==2&&(i/3)%11!==4)continue;
  const id=(i/3)%7===2?roles.vein:roles.stone,normal=m.normals.slice(-3),weights=id===roles.vein?[[.45,.24,.31],[.40,.22,.38],[.10,.67,.23],[.15,.71,.14]]:[[.46,.24,.30],[.40,.24,.36],[.31,.38,.31],[.33,.41,.26]],vs2=weights.map(w=>[0,1,2].map(k=>vs.reduce((n,v,j)=>n+v[k]*w[j],0))as V3),pc=vs2[0].map((_,k)=>vs2.reduce((n,v)=>n+v[k]/vs2.length,0))as V3,p=emptyMesh(name+(id===roles.vein?' · 真实细矿脉层':' · 浅石断面'),id,solid(id)),point=(j:number,top=false)=>vs2[j].map((v,k)=>v+normal[k]*(top?.0025:-.001))as V3;
  for(let j=1;j<vs2.length-1;j++){triangle(p,point(0),point(j+1),point(j),normal.map(v=>-v)as V3);triangle(p,point(0,true),point(j,true),point(j+1,true),normal as V3);}
  for(let j=0;j<vs2.length;j++){const k=(j+1)%vs2.length,fc=vs2[j].map((v,n)=>(v+vs2[k][n])/2-pc[n])as V3;quad(p,[point(j),point(k),point(k,true),point(j,true)],fc);}
  patches.push(projectedUV(p));
 }
 return[projectedUV(m),...patches];
}

/** Every crossing is a shared 3D knot; sag is authored, with true open diamonds. */
export function diamondNet(name:string,material:number,w:number,h:number,step:number,point:(u:number,v:number)=>V3,collision:boolean){
 const meshes:AuthoredMesh[]=[];
 for(const family of[1,-1])for(let j=Math.ceil((family===1?0:-h)/step);j<=Math.floor(w/step)+Math.ceil(h/step);j++){
  const s=j*step,y=(x:number)=>family===1?s-x:x-s,candidates=[0,w,family===1?s:s,family===1?s-h:s+h].filter(x=>x>=-1e-9&&x<=w+1e-9&&y(x)>=-1e-9&&y(x)<=h+1e-9).sort((a,b)=>a-b);
  if(candidates.length<2)continue;const lo=candidates[0],hi=candidates.at(-1)!;if(hi-lo<1e-8)continue;
  const xs=[lo,hi];for(let k=Math.floor(-h/step)-1;k<=Math.ceil((w+h)/step)+1;k++){const x=(s+k*step)/2;if(x>lo+1e-8&&x<hi-1e-8)xs.push(x);}xs.sort((a,b)=>a-b);
  for(let k=0;k<xs.length-1;k++)meshes.push(roundMember(name,material,point(xs[k],y(xs[k])),point(xs[k+1],y(xs[k+1])),.0045,collision,8));
 }
 return meshes;
}
