import {ExtrudeGeometry,Shape,Path} from 'three';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import type {V3} from '../../src/core/types';
import {emptyMesh,quad} from '../../src/production/mesh-shapes';
/** Actual through slots, with the same metre-space contours on both faces. */
export function slottedPlate(name:string,material:number,min:V3,size:V3,slots:{x:number;y:number;width:number;height:number;angle?:number}[],collision:boolean):AuthoredMesh{
 const [w,h,d]=size,shape=new Shape();shape.moveTo(0,0);shape.lineTo(w,0);shape.lineTo(w,h);shape.lineTo(0,h);shape.closePath();
 for(const s of slots){const p=new Path(),c=Math.cos(s.angle??0),sn=Math.sin(s.angle??0);[[-.5,-.5],[-.5,.5],[.5,.5],[.5,-.5]].forEach(([x,y],i)=>{const u=s.x+c*x*s.width-sn*y*s.height,v=s.y+sn*x*s.width+c*y*s.height;if(i===0)p.moveTo(u,v);else p.lineTo(u,v);});p.closePath();shape.holes.push(p);}
 const g=new ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1,curveSegments:1}),m=emptyMesh(name,material,collision),ps=g.getAttribute('position'),ns=g.getAttribute('normal');
 for(let i=0;i<ps.count;i++){m.positions.push(ps.getX(i)+min[0],ps.getY(i)+min[1],ps.getZ(i)+min[2]);m.normals.push(ns.getX(i),ns.getY(i),ns.getZ(i));m.uvs.push(ps.getX(i),ps.getY(i));m.indices.push(i);}g.dispose();return m;
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
