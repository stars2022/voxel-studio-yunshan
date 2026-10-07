import type {V3} from '../../src/core/types';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import {emptyMesh,quad,triangle,roundLoft} from '../../src/production/mesh-shapes';
const clean=(v:V3)=>v.map(n=>Math.round(n*1e9)/1e9||0) as V3;
/** A true closed 26-face bevel, in metres; independent from the native detail grid. */
export function bevelBox(name:string,material:number,min:V3,size:V3,bevel:number,collision:boolean,grainAxis=1):AuthoredMesh{
 if(size.some(n=>n<=0)||bevel<=0||bevel>=Math.min(...size)/2)throw new Error('Invalid bevel box '+name);
 const m=emptyMesh(name,material,collision),h=size.map(n=>n/2),c=min.map((n,k)=>n+h[k]);
 const vertex=(axis:number,signs:number[]):V3=>clean(h.map((n,k)=>c[k]+signs[k]*(n-(k===axis?0:bevel))) as V3);
 for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){const others=[0,1,2].filter(k=>k!==axis),points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(pair=>{const signs=[0,0,0];signs[axis]=sign;others.forEach((k,j)=>signs[k]=pair[j]);return vertex(axis,signs);}),normal=[0,0,0]as V3;normal[axis]=sign;quad(m,points,normal);}
 for(let free=0;free<3;free++){const[a,b]=[0,1,2].filter(k=>k!==free);for(const sa of[-1,1])for(const sb of[-1,1]){const signs=[0,0,0];signs[a]=sa;signs[b]=sb;signs[free]=-1;const a0=vertex(a,signs),b0=vertex(b,signs);signs[free]=1;const a1=vertex(a,signs),b1=vertex(b,signs),normal=[0,0,0]as V3;normal[a]=sa;normal[b]=sb;quad(m,[a0,a1,b1,b0],normal);}}
 for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1]){const s=[x,y,z];triangle(m,vertex(0,s),vertex(1,s),vertex(2,s),s as V3);}
 // Grain follows the authored member axis; end faces use a planar metre mapping.
 for(let k=0;k<m.positions.length;k+=3){const normal=m.normals.slice(k,k+3),axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs))),vAxis=axis===grainAxis?[0,1,2].find(a=>a!==axis)!:grainAxis,uAxis=[0,1,2].find(a=>a!==axis&&a!==vAxis)!;m.uvs[k/3*2]=m.positions[k+uAxis];m.uvs[k/3*2+1]=m.positions[k+vAxis];}
 return m;
}
/** Rigid orthonormal placement, preserving triangle winding and metre UVs. */
export function alongSegment(m:AuthoredMesh,start:V3,end:V3):AuthoredMesh{
 const delta=end.map((n,k)=>n-start[k]),length=Math.hypot(...delta);if(length<1e-8)throw new Error('Zero length member');const t=delta.map(n=>n/length),plan=Math.hypot(t[0],t[2]),u=plan>1e-8?[t[2]/plan,0,-t[0]/plan]:[1,0,0],v=[u[1]*t[2]-u[2]*t[1],u[2]*t[0]-u[0]*t[2],u[0]*t[1]-u[1]*t[0]],out=structuredClone(m);
 for(let k=0;k<m.positions.length;k+=3)for(let d=0;d<3;d++){out.positions[k+d]=Math.round((start[d]+u[d]*m.positions[k]+t[d]*m.positions[k+1]+v[d]*m.positions[k+2])*1e9)/1e9||0;out.normals[k+d]=u[d]*m.normals[k]+t[d]*m.normals[k+1]+v[d]*m.normals[k+2];}return out;
}
export function bevelMember(name:string,material:number,start:V3,end:V3,width:number,depth:number,bevel:number,collision:boolean){const length=Math.hypot(...end.map((n,k)=>n-start[k]));return alongSegment(bevelBox(name,material,[-width/2,0,-depth/2],[width,length,depth],bevel,collision),start,end);}
export function roundMember(name:string,material:number,start:V3,end:V3,radius:number,collision:boolean,sides=24){const length=Math.hypot(...end.map((n,k)=>n-start[k]));return alongSegment(roundLoft(name,material,[{y:0,rx:radius,rz:radius},{y:length,rx:radius,rz:radius}],sides,collision),start,end);}
