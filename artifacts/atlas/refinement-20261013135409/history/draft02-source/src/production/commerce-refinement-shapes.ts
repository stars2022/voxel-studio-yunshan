import {ShapeUtils,Vector2} from 'three';
import type {AuthoredMesh} from '../core/authored-mesh';
import type {V3} from '../core/types';
import {emptyMesh,quad,triangle,rigidMesh} from './mesh-shapes';
import {alongSegment,bevelBox} from './refinement-shapes';
import {projectedUV} from './market-refinement-shapes';
import type {SurfaceArtwork} from '../core/surface-artwork';

export function artPanel(name:string,material:number,min:V3,size:V3,collision:boolean,design:SurfaceArtwork['design'],roles:SurfaceArtwork['materials'],axis:'XY'|'XZ'='XY'){
 const m=projectedUV(bevelBox(name,material,min,size,Math.min(...size)*.16,collision),true);m.artwork={version:1,design,width:1024,height:768,sizeM:[size[0],size[axis==='XY'?1:2]],materials:roles};return m;
}
export function ellipsoid(name:string,material:number,c:V3,r:V3,collision:boolean,N=16,M=8){
 const m=emptyMesh(name,material,collision),p=(i:number,j:number):V3=>{const a=i*Math.PI*2/N,b=j*Math.PI/M;return[c[0]+r[0]*Math.sin(b)*Math.cos(a),c[1]-r[1]*Math.cos(b),c[2]+r[2]*Math.sin(b)*Math.sin(a)];};
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const ps=[p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],normal=ps[2].map((v,k)=>v-c[k])as V3;if(j===0)triangle(m,ps[0],ps[2],ps[3],normal);else if(j===M-1)triangle(m,ps[0],ps[1],ps[2],normal);else quad(m,ps,normal);}return projectedUV(m);
}
/** True finite leaf skins, with a curved center, undulating edge and closed root/tip. */
export function leafBlade(name:string,material:number,start:V3,end:V3,width:number,collision:boolean,phase=0){
 const L=Math.hypot(...end.map((v,k)=>v-start[k])),m=emptyMesh(name,material,collision),N=20,M=8,t=.0014;
 const p=(i:number,j:number,back=false):V3=>{const v=j/N,u=i/M*2-1,w=.002+width*.5*Math.sin(Math.PI*v)**.65*(1+.07*Math.sin(v*25+phase));return[u*w,L*v,.014*Math.sin(Math.PI*v)*Math.cos(phase*.31)+.010*u*u*Math.sin(Math.PI*v)+.003*u*Math.sin(v*30+phase)+(back?t:0)];};
 for(let j=0;j<N;j++)for(let i=0;i<M;i++)for(const back of[false,true])quad(m,[p(i,j,back),p(i+1,j,back),p(i+1,j+1,back),p(i,j+1,back)],[0,0,back?1:-1]);
 for(const i of[0,M])for(let j=0;j<N;j++)quad(m,[p(i,j),p(i,j+1),p(i,j+1,true),p(i,j,true)],[i===0?-1:1,0,0]);
 for(const j of[0,N])for(let i=0;i<M;i++)quad(m,[p(i,j),p(i+1,j),p(i+1,j,true),p(i,j,true)],[0,j===0?-1:1,0]);return projectedUV(alongSegment(m,start,end));
}
/** Closed radial sectors share exact seams and retain independent food purposes. */
export function fishBody(roles:{body:number;back:number;pale:number},solid:(id:number)=>boolean){
 const xs=[.012,.025,.050,.085,.14,.205,.27,.315,.346,.366],ry=[.004,.020,.034,.044,.051,.052,.044,.026,.013,.011],rz=[.008,.026,.046,.061,.067,.061,.045,.026,.014,.012],N=24,cy=.073,cz=.080,parts:AuthoredMesh[]=[];
 for(const[from,to,id,label]of[[-4,4,roles.back,'鱼背食材层'],[4,10,roles.body,'右侧银灰鱼体'],[10,14,roles.pale,'独立鱼腹食材层'],[14,20,roles.body,'左侧银灰鱼体']]as[number,number,number,string][]){
  const m=emptyMesh(label,id,solid(id)),p=(j:number,i:number):V3=>[xs[j],cy+ry[j]*Math.cos(i*Math.PI*2/N),cz+rz[j]*Math.sin(i*Math.PI*2/N)],c=(j:number):V3=>[xs[j],cy,cz];
  for(let j=0;j<xs.length-1;j++){for(let i=from;i<to;i++)quad(m,[p(j,i),p(j+1,i),p(j+1,i+1),p(j,i+1)],[0,Math.cos((i+.5)*Math.PI*2/N),Math.sin((i+.5)*Math.PI*2/N)]);for(const i of[from,to]){const a=i*Math.PI*2/N,n:V3=[0,i===from?Math.sin(a):-Math.sin(a),i===from?-Math.cos(a):Math.cos(a)];quad(m,[c(j),c(j+1),p(j+1,i),p(j,i)],n);}}
  for(const j of[0,xs.length-1])for(let i=from;i<to;i++)triangle(m,c(j),p(j,i),p(j,i+1),[j===0?-1:1,0,0]);parts.push(projectedUV(m));
 }return parts;
}
/** Finite polygonal fin, including the concave fork, not an opaque drawn triangle. */
export function finPrism(name:string,material:number,points:[number,number][],z:number,t:number,collision:boolean){
 // These author contours have a kernel at the first point; triangulate as a fan.
 if(points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0)<0)points=[...points].reverse();
 const m=emptyMesh(name,material,collision),tris=ShapeUtils.triangulateShape(points.map(p=>new Vector2(...p)),[]);
 for(const back of[false,true])for(const tri of tris)triangle(m,...tri.map(i=>[...points[i],z+(back?t:0)]as V3) as [V3,V3,V3],[0,0,back?1:-1]);
 for(let j=0;j<points.length;j++){const a=points[j],b=points[(j+1)%points.length];quad(m,[[...a,z]as V3,[...b,z]as V3,[...b,z+t]as V3,[...a,z+t]as V3],[b[1]-a[1],a[0]-b[0],0]);}return projectedUV(m);
}
/** Continuous rolled paper joined to a finite flat sheet; every strip has two skins. */
export function scrollSheet(name:string,material:number,collision:boolean){
 const m=emptyMesh(name,material,collision),N=48,x0=.068,x1=.482,z0=.075,z1=.275,t=.0015,y=(z:number)=>.025+.009*(Math.exp(-(((z-z0)/.016)**2))+Math.exp(-(((z-z1)/.016)**2))),p=(i:number,x:number,back=false):V3=>{const z=z0+(z1-z0)*i/N;return[x,y(z)-(back?t:0),z];};
 for(let i=0;i<N;i++){for(const back of[false,true])quad(m,[p(i,x0,back),p(i,x1,back),p(i+1,x1,back),p(i+1,x0,back)],[0,back?-1:1,0]);for(const x of[x0,x1])quad(m,[p(i,x),p(i+1,x),p(i+1,x,true),p(i,x,true)],[x===x0?-1:1,0,0]);}for(const i of[0,N])quad(m,[p(i,x0),p(i,x1),p(i,x1,true),p(i,x0,true)],[0,0,i===0?-1:1]);
 return projectedUV(m,true);
}
export {rigidMesh};

export function slopePlate(name:string,material:number,x0:number,x1:number,z0:number,z1:number,y0:number,y1:number,t:number,collision:boolean){const m=emptyMesh(name,material,collision),p=(x:number,z:number,top=false):V3=>[x,y0+(y1-y0)*(z-z0)/(z1-z0)+(top?t:0),z];for(const top of[false,true])quad(m,[p(x0,z0,top),p(x1,z0,top),p(x1,z1,top),p(x0,z1,top)],[0,top?1:-1,top?-(y1-y0)/(z1-z0):(y1-y0)/(z1-z0)]);for(const x of[x0,x1])quad(m,[p(x,z0),p(x,z1),p(x,z1,true),p(x,z0,true)],[x===x0?-1:1,0,0]);for(const z of[z0,z1])quad(m,[p(x0,z),p(x1,z),p(x1,z,true),p(x0,z,true)],[0,0,z===z0?-1:1]);return projectedUV(m);}

/** A bounded half-mound with its own real flat floor, rather than a thick exposed disc. */
export function grainMound(name:string,material:number,collision:boolean){
 const m=emptyMesh(name,material,collision),N=32,M=10,p=(i:number,j:number):V3=>{const a=i*Math.PI*2/N,b=j*Math.PI/(2*M);return[.15+.139*Math.cos(b)*Math.cos(a),.001+.058*Math.sin(b),.125+.114*Math.cos(b)*Math.sin(a)];};
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const ps=[p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],normal:V3=[Math.cos((i+.5)*Math.PI*2/N),Math.sin((j+.5)*Math.PI/(2*M)),Math.sin((i+.5)*Math.PI*2/N)];if(j===M-1)triangle(m,ps[0],ps[1],ps[2],normal);else quad(m,ps,normal);}for(let i=0;i<N;i++)triangle(m,[.15,.001,.125],p(i,0),p(i+1,0),[0,-1,0]);return projectedUV(m);
}
