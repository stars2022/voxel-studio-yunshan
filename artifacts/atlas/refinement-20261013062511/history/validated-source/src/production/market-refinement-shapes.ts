import {ExtrudeGeometry,Shape} from 'three';
import type {AuthoredMesh} from '../core/authored-mesh';
import type {V3} from '../core/types';
import {emptyMesh,quad} from './mesh-shapes';
export function projectedUV(m:AuthoredMesh,normalized=false){
 const lo=[0,1,2].map(k=>Math.min(...Array.from({length:m.positions.length/3},(_,i)=>m.positions[i*3+k]))),hi=[0,1,2].map(k=>Math.max(...Array.from({length:m.positions.length/3},(_,i)=>m.positions[i*3+k])));
 for(let k=0;k<m.indices.length;k+=3){const n=m.normals.slice(m.indices[k]*3,m.indices[k]*3+3).map(Math.abs),axis=n.indexOf(Math.max(...n)),axes=axis===0?[2,1]:axis===1?[0,2]:[0,1];for(const i of m.indices.slice(k,k+3))for(let j=0;j<2;j++){const a=axes[j];m.uvs[i*2+j]=normalized?(m.positions[i*3+a]-lo[a])/(hi[a]-lo[a]):m.positions[i*3+a];}}
 return m;
}
/** Finite continuous pleated cloth with both skins and all four closed edges. */
export function marketCloth(name:string,material:number,x:number,width:number,low:number,high:number,z:number,thickness:number,collision:boolean,amplitude=.009,normalized=false){
 const m=emptyMesh(name,material,collision),N=64,p=(i:number,y:number,back=false):V3=>[x+i/N*width,y,z+amplitude*Math.cos(i/N*Math.PI*12)+(back?thickness:0)];
 for(let i=0;i<N;i++){for(const back of[false,true])quad(m,[p(i,low,back),p(i+1,low,back),p(i+1,high,back),p(i,high,back)],[0,0,back?1:-1]);for(const y of[low,high])quad(m,[p(i,y),p(i+1,y),p(i+1,y,true),p(i,y,true)],[0,y===low?-1:1,0]);}
 for(const i of[0,N])quad(m,[p(i,low),p(i,high),p(i,high,true),p(i,low,true)],[i===0?-1:1,0,0]);return projectedUV(m,normalized);
}
/** Canopy slope is authored in metres; it is not rasterized onto a voxel stair. */
export function marketCanopy(name:string,material:number,x:number,width:number,z:number,depth:number,collision:boolean,lift=0){
 const m=emptyMesh(name,material,collision),N=48,M=12,y=(xx:number,zz:number)=>1.07+.30*(zz-.025)/1.13+.008*Math.sin((xx-.10)/1.40*Math.PI*12)+lift,p=(i:number,j:number,under=false):V3=>{const xx=x+i/N*width,zz=z+j/M*depth;return[xx,y(xx,zz)-(under?.009:0),zz];};
 for(let i=0;i<N;i++)for(let j=0;j<M;j++)for(const under of[false,true])quad(m,[p(i,j,under),p(i+1,j,under),p(i+1,j+1,under),p(i,j+1,under)],[0,under?-1:1,0]);
 for(let i=0;i<N;i++)for(const j of[0,M])quad(m,[p(i,j),p(i+1,j),p(i+1,j,true),p(i,j,true)],[0,0,j===0?-1:1]);
 for(const i of[0,N])for(let j=0;j<M;j++)quad(m,[p(i,j),p(i,j+1),p(i,j+1,true),p(i,j,true)],[i===0?-1:1,0,0]);return projectedUV(m);
}
/** Closed printed polygon follows the actual sloping bag wall. */
export function bagInkPolygon(name:string,material:number,points:[number,number][],collision:boolean){
 const s=new Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new ExtrudeGeometry(s,{depth:.007,bevelEnabled:false,steps:1,curveSegments:1}),m=emptyMesh(name,material,collision),ps=g.getAttribute('position'),ns=g.getAttribute('normal'),slope=-.024/.44;
 for(let i=0;i<ps.count;i++){const x=ps.getX(i),y=ps.getY(i),n=[ns.getX(i),ns.getY(i)-slope*ns.getZ(i),ns.getZ(i)],l=Math.hypot(...n);m.positions.push(x,y,.037+(y-.03)*slope-.003+ps.getZ(i));m.normals.push(...n.map(v=>v/l));m.uvs.push(x,y);m.indices.push(i);}g.dispose();return projectedUV(m);
}
