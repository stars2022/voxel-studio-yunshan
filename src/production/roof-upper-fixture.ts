import type {Project,V3} from '../core/types';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {ArchitectureComponent} from './architecture-components';
import {architectureRoof} from './architecture-roofs';
import {componentMeshes} from './component-meshes';
import {emptyMesh,triangle,quad} from './mesh-shapes';
import {outfitHash} from './outfit-components';

function clip(points:V3[],axis:0|2,boundary:number,greater:boolean){
 const out:V3[]=[];for(let j=0;j<points.length;j++){const a=points[j],b=points[(j+1)%points.length],da=(a[axis]-boundary)*(greater?1:-1),db=(b[axis]-boundary)*(greater?1:-1);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=(boundary-a[axis])/(b[axis]-a[axis]);out.push(a.map((v,k)=>v+(b[k]-v)*t)as V3);}}
 return out;
}
function compact(points:V3[]){
 const out=points.filter((p,i)=>{const q=points[(i+1)%points.length];return Math.hypot(p[0]-q[0],p[2]-q[2])>1e-8;});
 let changed=true;while(changed&&out.length>=3){changed=false;for(let i=0;i<out.length;i++){const a=out[(i+out.length-1)%out.length],b=out[i],c=out[(i+1)%out.length];if(Math.abs((b[0]-a[0])*(c[2]-b[2])-(b[2]-a[2])*(c[0]-b[0]))<1e-10){out.splice(i,1);changed=true;break;}}}return out;
}

/** Refit fine timbers to the actual triangulated underside, preserving the original roof separately. */
export function fittedUpperRoof(p:Project,id:string,w:number,d:number){
 const original=architectureRoof(p,id+'-retained-upper','hip',w,d),parts=componentMeshes(original),board=parts.find(m=>m.name==='木望板-0')!,b=new ArchitectureComponent(p,id,'上层屋面与实际贴面檐木',['BUILT-011','BUILT-012','BUILT-013'],{form:'hip',w,d,refittedFineTimbers:true});
 for(const part of parts)if(!['连续檐口木枋','连续山墙坡梁'].includes(part.name))b.mesh(part);
 const bands=[[-.30,w+.30,-.34,-.22],[-.30,w+.30,d+.22,d+.34],[.1,.3,-.4,d+.4],[w-.3,w-.1,-.4,d+.4]];
 let pieces=0;
 for(const[band,[x0,x1,z0,z1]]of bands.entries())for(let k=0;k<board.indices.length;k+=3){
  if(board.normals[board.indices[k]*3+1]>=0)continue;
  let points=board.indices.slice(k,k+3).map(i=>board.positions.slice(i*3,i*3+3)as V3);
  for(const[axis,at,greater]of[[0,x0,true],[0,x1,false],[2,z0,true],[2,z1,false]]as const)points=clip(points,axis,at,greater);
  points=compact(points);if(points.length<3)continue;
  const m=emptyMesh('贴合真实底面的檐木-'+band+'-'+pieces++,b.role(band<2?'woodEdge':'wood')),low=points.map(v=>[v[0],v[1]-.14,v[2]]as V3),center=points.reduce((s,v)=>s.map((n,k)=>n+v[k]/points.length)as V3,[0,0,0]as V3);
  for(let i=1;i<points.length-1;i++){triangle(m,points[0],points[i],points[i+1],[0,1,0]);triangle(m,low[0],low[i],low[i+1],[0,-1,0]);}
  for(let i=0;i<points.length;i++){const j=(i+1)%points.length;quad(m,[points[i],points[j],low[j],low[i]],[(points[i][0]+points[j][0])/2-center[0],0,(points[i][2]+points[j][2])/2-center[2]]);}b.mesh(m);
 }
 b.grid=new Grid(original.chunks);b.ports=structuredClone(original.ports);const a=b.finish();a.source!.retainedOriginalUpperRoof={asset:original,geometrySHA256:outfitHash(geometryData(original))};a.source!.timberRefit={strips:4,closedPieces:pieces,method:'Clip each actual triangulated underside face to the four timber strips and extrude down0.14m. Joined closed pieces follow the real lower board surface, without analytical-height interpolation breaking through the tiles. Original full upper roof remains retained.'};return a;
}
