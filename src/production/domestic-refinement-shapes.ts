import type {V3} from '../core/types';
import {emptyMesh,quad} from './mesh-shapes';
export type SolidBox={min:V3;size:V3};
/** Exact boundary on authored coordinate planes, not a physical voxel grid. */
export function orthogonalDifference(name:string,material:number,solids:SolidBox[],voids:SolidBox[],collision:boolean){
 const m=emptyMesh(name,material,collision),coords=[0,1,2].map(k=>[...new Set([...solids,...voids].flatMap(b=>[b.min[k],b.min[k]+b.size[k]]).map(v=>Math.round(v*1e9)/1e9))].sort((a,b)=>a-b));
 const inside=(p:V3,boxes:SolidBox[])=>boxes.some(b=>p.every((v,k)=>v>b.min[k]-1e-10&&v<b.min[k]+b.size[k]+1e-10));
 const filled=new Set<string>();
 for(let x=0;x<coords[0].length-1;x++)for(let y=0;y<coords[1].length-1;y++)for(let z=0;z<coords[2].length-1;z++){
  const v=[x,y,z],p=v.map((n,k)=>(coords[k][n]+coords[k][n+1])/2)as V3;
  if(inside(p,solids)&&!inside(p,voids))filled.add(v.join(','));
 }
 for(const key of filled){const v=key.split(',').map(Number);for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){
  const neighbor=[...v];neighbor[axis]+=sign;if(filled.has(neighbor.join(',')))continue;
  const a=(axis+1)%3,b=(axis+2)%3,n=[0,0,0]as V3;n[axis]=sign;
  const ps=[[0,0],[1,0],[1,1],[0,1]].map(([u,w])=>{const p=[0,0,0]as V3;p[axis]=coords[axis][v[axis]+(sign>0?1:0)];p[a]=coords[a][v[a]+u];p[b]=coords[b][v[b]+w];return p;});quad(m,ps,n);
 }}
 for(let k=0;k<m.indices.length;k+=3){const axis=m.normals.slice(m.indices[k]*3,m.indices[k]*3+3).map(Math.abs).indexOf(1),a=(axis+1)%3,b=(axis+2)%3;for(const i of m.indices.slice(k,k+3)){m.uvs[i*2]=m.positions[i*3+a];m.uvs[i*2+1]=m.positions[i*3+b];}}
 return m;
}
/** Closed finite cloth, including the curved return over the actual round rod. */
export function towelStrip(name:string,material:number,x:number,width:number,bottom:number,backBottom:number,collision:boolean,band?:[number,number]){
 const m=emptyMesh(name,material,collision),rodY=.352,rodZ=.035,r=.014,half=band?.0007:.002;
 const path:{y:number;z:number;ny:number;nz:number}[]=[];
 if(band){for(let j=0;j<=8;j++)path.push({y:band[0]+(band[1]-band[0])*j/8,z:rodZ-r-.0025,ny:0,nz:-1});}
 else{
  for(let j=0;j<8;j++)path.push({y:bottom+(rodY-bottom)*j/8,z:rodZ-r,ny:0,nz:-1});
  for(let j=0;j<=16;j++){const a=-Math.PI/2+j/16*Math.PI;path.push({y:rodY+r*Math.cos(a),z:rodZ+r*Math.sin(a),ny:Math.cos(a),nz:Math.sin(a)});}
  for(let j=1;j<=8;j++)path.push({y:rodY+(backBottom-rodY)*j/8,z:rodZ+r,ny:0,nz:1});
 }
 const N=48,point=(i:number,j:number,side:number):V3=>{const s=path[j],fade=Math.max(0,(rodY-s.y)/(rodY-bottom)),pleat=.0035*Math.sin(i/N*Math.PI*12)*fade;return[x+width*i/N,s.y+s.ny*half*side,s.z+pleat+s.nz*half*side];};
 for(let i=0;i<N;i++)for(let j=0;j<path.length-1;j++)for(const side of[-1,1])quad(m,[point(i,j,side),point(i+1,j,side),point(i+1,j+1,side),point(i,j+1,side)],[0,(path[j].ny+path[j+1].ny)*side,(path[j].nz+path[j+1].nz)*side]);
 for(let i=0;i<N;i++)for(const j of[0,path.length-1])quad(m,[point(i,j,-1),point(i+1,j,-1),point(i+1,j,1),point(i,j,1)],[0,band&&j!==0?1:-1,0]);
 for(const i of[0,N])for(let j=0;j<path.length-1;j++)quad(m,[point(i,j,-1),point(i,j+1,-1),point(i,j+1,1),point(i,j,1)],[i===0?-1:1,0,0]);
 const lo=[0,1,2].map(k=>Math.min(...Array.from({length:m.positions.length/3},(_,i)=>m.positions[i*3+k]))),hi=[0,1,2].map(k=>Math.max(...Array.from({length:m.positions.length/3},(_,i)=>m.positions[i*3+k])));
 for(let k=0;k<m.indices.length;k+=3){const n=m.normals.slice(m.indices[k]*3,m.indices[k]*3+3).map(Math.abs),axis=n.indexOf(Math.max(...n)),axes=axis===0?[2,1]:axis===1?[0,2]:[0,1];for(const i of m.indices.slice(k,k+3))for(let j=0;j<2;j++)m.uvs[i*2+j]=(m.positions[i*3+axes[j]]-lo[axes[j]])/(hi[axes[j]]-lo[axes[j]]);}
 return m;
}
