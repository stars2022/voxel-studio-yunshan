import type {AuthoredMesh} from '../core/authored-mesh';
import type {V3} from '../core/types';
import {emptyMesh,quad,triangle} from './mesh-shapes';

export type Section={rx:number;rz?:number;y:number;exponent?:number};
/** Closed section swept around Y. Zero-radius ends are genuine fan caps;
 * a nonzero inner radius leaves a real open drain or annular mounting bore. */
export function sectionShell(name:string,material:number,profile:Section[],center:[number,number],collision:boolean,segments=48):AuthoredMesh{
 const m=emptyMesh(name,material,collision);
 const signed=profile.reduce((a,p,i)=>{const q=profile[(i+1)%profile.length];return a+p.rx*q.y-q.rx*p.y;},0),sign=Math.sign(signed);
 if(!sign)throw Error('Empty section '+name);
 const point=(p:Section,j:number):V3=>{const t=j/segments*Math.PI*2,c=Math.cos(t),s=Math.sin(t),e=p.exponent??1;return[center[0]+p.rx*Math.sign(c)*Math.abs(c)**e,p.y,center[1]+(p.rz??p.rx)*Math.sign(s)*Math.abs(s)**e];};
 for(let i=0;i<profile.length;i++){
  const a=profile[i],b=profile[(i+1)%profile.length];if(a.rx===0&&b.rx===0)continue;
  for(let j=0;j<segments;j++){
   const t=(j+.5)/segments*Math.PI*2,n:V3=[(b.y-a.y)*Math.cos(t)*sign,-(b.rx-a.rx)*sign,(b.y-a.y)*Math.sin(t)*sign];
   const ps=[point(a,j),point(a,j+1),point(b,j+1),point(b,j)];
   if(a.rx===0)triangle(m,ps[0],ps[2],ps[3],n);else if(b.rx===0)triangle(m,ps[0],ps[1],ps[2],n);else quad(m,ps,n);
  }
 }
 // Independent projected UV axes on nearly horizontal faces; metre arc/Y on walls.
 for(let k=0;k<m.indices.length;k+=3){const ids=m.indices.slice(k,k+3),cap=Math.abs(m.normals[ids[0]*3+1])>.85,angles=ids.map(i=>Math.atan2(m.positions[i*3+2]-center[1],m.positions[i*3]-center[0]));if(Math.max(...angles)-Math.min(...angles)>Math.PI)for(let j=0;j<3;j++)if(angles[j]<0)angles[j]+=Math.PI*2;
  ids.forEach((id,j)=>{m.uvs[id*2]=cap?m.positions[id*3]:angles[j]*Math.max(...profile.map(p=>p.rx));m.uvs[id*2+1]=cap?m.positions[id*3+2]:m.positions[id*3+1];});
 }
 return m;
}

/** Thin glazed ceramic inlay. Both radial faces and all four edge walls exist. */
export function glazeStroke(name:string,material:number,center:[number,number],a0:number,a1:number,y0:number,y1:number,radius:(y:number)=>number,collision:boolean){
 const m=emptyMesh(name,material,collision),ps:V3[]=[];
 for(const offset of[-.001,.0015])for(const y of[y0,y1])for(const a of[a0,a1])ps.push([center[0]+(radius(y)+offset)*Math.cos(a),y,center[1]+(radius(y)+offset)*Math.sin(a)]);
 const middle=(a0+a1)/2,radial:V3=[Math.cos(middle),0,Math.sin(middle)];
 for(const [indices,normal]of [[[0,1,3,2],radial.map(v=>-v)],[[4,6,7,5],radial],[[0,4,5,1],[0,-1,0]],[[2,3,7,6],[0,1,0]],[[0,2,6,4],[Math.sin(a0),0,-Math.cos(a0)]],[[1,5,7,3],[-Math.sin(a1),0,Math.cos(a1)]]] as [number[],number[]][]){quad(m,indices.map(i=>ps[i]),normal as V3);}
 return m;
}
