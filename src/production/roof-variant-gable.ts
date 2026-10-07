import {ArchitectureComponent} from './architecture-components';
import {emptyMesh,triangle,quad} from './mesh-shapes';
import {Grid} from '../core/grid';
import {assetBoundsM} from '../core/sky';
import type {Asset,Project,V3} from '../core/types';

/** Continuous alternative; The original BUILT-011 is retained separately. */
export function continuousGable(p:Project,id:string,axis:'x'|'z'):Asset{
 const length=4,cross=3.2,ridge=1.7,eave=.24;
 const height=(z:number)=>eave+(ridge-eave)*(1-Math.abs(z-cross/2)/(cross/2));
 const b=new ArchitectureComponent(p,id,'连续封闭山墙屋面 · '+axis,['BUILT-011'],{gableAxis:axis,ridgeAxis:axis==='x'?'z':'x',lengthM:length,crossSpanM:cross,derivation:'Explicit continuous alternative of the retained voxel gable. Metre-space slopes, actual solid gable ends and independent native fasteners; original source geometry is not resampled.'});
 for(const [name,role,offset,thickness]of[['连续瓦基层','roof',0,.07],['防水膜','waterproofMembrane',-.07,.015],['木望板','wood',-.085,.08]]as const)b.surface(name,role,[0,length],[0,cross/2,cross],(_,z)=>height(z)+offset,thickness);
 // Closed pentagonal ends meet the actual underside, leaving the middle roof cavity empty.
 const profile:[number,number][]=[[0,0],[cross,0],[cross,eave-.165],[cross/2,ridge-.165],[0,eave-.165]];
 for(const [x0,x1]of[[.02,.12],[length-.12,length-.02]]){
  const m=emptyMesh('五点闭合山墙端',b.role('wall')),points=(x:number)=>profile.map(([z,y])=>[x,y,z]as V3),left=points(x0),right=points(x1);
  for(let i=1;i<profile.length-1;i++){triangle(m,left[0],left[i],left[i+1],[-1,0,0]);triangle(m,right[0],right[i],right[i+1],[1,0,0]);}
  for(let i=0;i<profile.length;i++){const j=(i+1)%profile.length,[za,ya]=profile[i],[zb,yb]=profile[j];quad(m,[left[i],left[j],right[j],right[i]],[0,za-zb,yb-ya]);}
  b.mesh(m);
 }
 // Tile courses are real thin solids following the continuous pitch; no voxel staircase.
 for(let i=0;i<10;i++)for(let j=0;j<8;j++){
  const x0=i*.4+.015,x1=(i+1)*.4-.015,z0=j*.4+.012,z1=(j+1)*.4-.012;
  b.surface('瓦垄-'+i+'-'+j,'roof',[x0,x1],[z0,z1],(_,z)=>height(z)+.028,.028);
 }
 b.box('连续长脊','roof',-.02,ridge-.012,cross/2-.10,length+.04,.16,.20);
 for(const x of[.02,length-.12]){
  b.box('脊端金属扣','metal',x,ridge+.108,cross/2-.12,.10,.04,.24);
  b.pin('脊端铜销','bronze',[x+.04,ridge+.14,cross/2-.02]);
 }
 for(const x of[.02,length-.12])for(const z of[.04,cross-.06])b.pin('山墙最小销','bronze',[x+.04,.02,z]);
 b.ports=[
  {id:'ridge-start',kind:'gable-ridge',position:[0,ridge+.148,cross/2],normal:[-1,0,0],size:[0,.16,.24],pitch:.02},
  {id:'ridge-end',kind:'gable-ridge',position:[length,ridge+.148,cross/2],normal:[1,0,0],size:[0,.16,.24],pitch:.02},
  {id:'gable-bearing-start',kind:'support',position:[.02,0,0],normal:[0,-1,0],size:[.10,0,cross],pitch:.02},
  {id:'gable-bearing-end',kind:'support',position:[length-.12,0,0],normal:[0,-1,0],size:[.10,0,cross],pitch:.02}
 ];
 const a=b.finish();
 if(axis==='x'){
  const swap=(v:V3):V3=>[v[2],v[1],v[0]],g=new Grid();for(const[v,m]of new Grid(a.chunks).cells())g.set(swap(v),m);a.chunks=g.serialize();
  for(const m of a.meshes??[]){for(let i=0;i<m.positions.length;i+=3){[m.positions[i],m.positions[i+2]]=[m.positions[i+2],m.positions[i]];[m.normals[i],m.normals[i+2]]=[m.normals[i+2],m.normals[i]];}for(let i=0;i<m.indices.length;i+=3)[m.indices[i+1],m.indices[i+2]]=[m.indices[i+2],m.indices[i+1]];}
  for(const port of a.ports){port.position=swap(port.position);port.normal=swap(port.normal);port.size=swap(port.size);}
 }
 a.source!.roofRegion={boundsM:assetBoundsM(a),gableAxis:axis,ridgeAxis:axis==='x'?'z':'x',physicsAuthority:'Actual closed solid triangles, with separate non-solid native fasteners. Exported mesh collision is the support/blocking authority, not an analytic or voxel approximation.',originalRoofRegionBound:false,innerHole:null};
 return a;
}
