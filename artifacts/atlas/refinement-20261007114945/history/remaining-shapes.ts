import {ExtrudeGeometry,Shape,Path} from 'three';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import type {V3} from '../../src/core/types';
import {emptyMesh,quad,triangle} from '../../src/production/mesh-shapes';
/** Actual through slots, with the same metre-space contours on both faces. */
export function slottedPlate(name:string,material:number,min:V3,size:V3,slots:{x:number;y:number;width:number;height:number;angle?:number}[],collision:boolean):AuthoredMesh{
 const [w,h,d]=size,shape=new Shape();shape.moveTo(0,0);shape.lineTo(w,0);shape.lineTo(w,h);shape.lineTo(0,h);shape.closePath();
 for(const s of slots){const p=new Path(),c=Math.cos(s.angle??0),sn=Math.sin(s.angle??0);[[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]].forEach(([x,y],i)=>{const u=s.x+c*x*s.width-sn*y*s.height,v=s.y+sn*x*s.width+c*y*s.height;if(i===0)p.moveTo(u,v);else p.lineTo(u,v);});p.closePath();shape.holes.push(p);}
 const g=new ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1,curveSegments:1}),m=emptyMesh(name,material,collision),ps=g.getAttribute('position'),ns=g.getAttribute('normal');
 for(let i=0;i<ps.count;i++){m.positions.push(ps.getX(i)+min[0],ps.getY(i)+min[1],ps.getZ(i)+min[2]);m.normals.push(ns.getX(i),ns.getY(i),ns.getZ(i));m.uvs.push(ps.getX(i),ps.getY(i));m.indices.push(i);}g.dispose();
 // Earcut can bridge collinear hole edges with a long cap edge. Split every
 // affected edge at the actual existing vertices so caps and slot walls agree.
 const points=[...new Set(Array.from({length:m.positions.length/3},(_,i)=>m.positions.slice(i*3,i*3+3).join(',')))].map(s=>s.split(',').map(Number) as V3),closed=emptyMesh(name,material,collision);
 for(let k=0;k<m.indices.length;k+=3){
  const ps=m.indices.slice(k,k+3).map(i=>m.positions.slice(i*3,i*3+3) as V3),center=ps[0].map((v,j)=>(v+ps[1][j]+ps[2][j])/3) as V3,normal=m.normals.slice(m.indices[k]*3,m.indices[k]*3+3) as V3;
  for(let j=0;j<3;j++){const a=ps[j],b=ps[(j+1)%3],delta=b.map((v,n)=>v-a[n]),dd=delta.reduce((v,n)=>v+n*n,0),cuts=[{t:0,p:a},{t:1,p:b}];
   for(const p of points){const t=p.reduce((v,n,l)=>v+(n-a[l])*delta[l],0)/dd;if(t>1e-7&&t<1-1e-7&&Math.hypot(...p.map((v,l)=>v-a[l]-t*delta[l]))<1e-8)cuts.push({t,p});}
   cuts.sort((x,y)=>x.t-y.t);for(let n=0;n<cuts.length-1;n++)triangle(closed,center,cuts[n].p,cuts[n+1].p,normal);
  }
 }
 return closed;
}
/** A closed continuous folded cloth strip, not a stepped raster of the slope. */
export function foldedCloth(name:string,material:number,low:number,high:number,collision:boolean){
 const m=emptyMesh(name,material,collision),n=160,w=.8,t=.006,z=(x:number)=>.045+.033*Math.cos(x/w*Math.PI*11),point=(i:number,y:number,back=false):V3=>[i/n*w,y,z(i/n*w)+(back?t:0)];
 for(let i=0;i<n;i++){
  for(const back of[false,true])quad(m,[point(i,low,back),point(i+1,low,back),point(i+1,high,back),point(i,high,back)],[0,0,back?1:-1]);
  for(const yy of[low,high])quad(m,[point(i,yy),point(i+1,yy),point(i+1,yy,true),point(i,yy,true)],[0,yy===low?-1:1,0]);
 }
 for(const i of[0,n])quad(m,[point(i,low),point(i,high),point(i,high,true),point(i,low,true)],[i===0?-1:1,0,0]);
 return m;
}
