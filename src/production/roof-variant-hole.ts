import {ArchitectureComponent} from './architecture-components';
import {architectureRoof} from './architecture-roofs';
import {componentMeshes as architectureComponents} from './component-meshes';
import {emptyMesh,quad} from './mesh-shapes';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {outfitHash} from './outfit-components';
import type {Project,V3} from '../core/types';
export type PlanHole={min:[number,number];max:[number,number]};

/** The caller supplies this hole from measured upper-tier instances. */
export function piercedHip(p:Project,id:string,hole:PlanHole){
 const w=12.8,d=6.4,e=.4,hipEnd=2.4,original=architectureRoof(p,id+'-retained-near','hip',w,d);
 if(!(hole.min[0]>hipEnd&&hole.max[0]<w-hipEnd&&hole.min[1]>.5&&hole.max[1]<d-.5&&hole.min.every((v,i)=>v<hole.max[i])))throw new Error('Unsupported actual upper footprint');
 const profile=(x:number,z:number)=>.12+1.6*Math.min(1-Math.abs(z-d/2)/(d/2+e),Math.min(1,(x+e)/(hipEnd+e),(w+e-x)/(hipEnd+e)))+.22*Math.pow(Math.abs(z-d/2)/(d/2+e),5)*(.4+.6*Math.pow(Math.abs(x-w/2)/(w/2+e),4));
 const ordered=(values:number[])=>[...new Set(values)].sort((a,b)=>a-b),xs=ordered([-e,0,w*.2,w*.5,w*.8,w,w+e,hole.min[0],hole.max[0]]),zs=ordered([-e,0,d*.2,d*.5,d*.8,d,d+e,hole.min[1],hole.max[1]]);
 const exists=(i:number,j:number)=>i>=0&&j>=0&&i<xs.length-1&&j<zs.length-1&&!((xs[i]+xs[i+1])/2>hole.min[0]&&(xs[i]+xs[i+1])/2<hole.max[0]&&(zs[j]+zs[j+1])/2>hole.min[1]&&(zs[j]+zs[j+1])/2<hole.max[1]);
 const b=new ArchitectureComponent(p,id,'层间真实穿孔长脊屋面',['BUILT-075'],{w,d,innerHoleM:hole,authorResampling:'Original authored height function evaluated on a grid additionally cut by actual upper footprint. Outer near triangles are explicitly regenerated, not claimed unchanged; original complete source remains.'});
 for(const [role,offset,thickness]of[['roof',0,.07],['waterproofMembrane',-.07,.015],['wood',-.085,.08]]as const){
  const m=emptyMesh('连续带孔层-'+role,b.role(role)),point=(i:number,j:number,low=false):V3=>[xs[i],profile(xs[i],zs[j])+offset-(low?thickness:0),zs[j]];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++)if(exists(i,j)){
   quad(m,[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],[0,1,0]);quad(m,[point(i,j,true),point(i+1,j,true),point(i+1,j+1,true),point(i,j+1,true)],[0,-1,0]);
   if(!exists(i,j-1))quad(m,[point(i,j),point(i+1,j),point(i+1,j,true),point(i,j,true)],[0,0,-1]);
   if(!exists(i,j+1))quad(m,[point(i,j+1),point(i+1,j+1),point(i+1,j+1,true),point(i,j+1,true)],[0,0,1]);
   if(!exists(i-1,j))quad(m,[point(i,j),point(i,j+1),point(i,j+1,true),point(i,j,true)],[-1,0,0]);
   if(!exists(i+1,j))quad(m,[point(i+1,j),point(i+1,j+1),point(i+1,j+1,true),point(i+1,j,true)],[1,0,0]);
  }b.mesh(m);
 }
 const excluded=new Set(['连续瓦面-0','独立防水层-0','木望板-0','长屋脊']);
 for(const m of architectureComponents(original))if(!excluded.has(m.name))b.mesh(m);
 // The actual ridge is split too: an innerHole tag alone would leave a solid bar through the upper storey.
 const ridgeStart=hipEnd-.12,ridgeEnd=w-hipEnd+.12;
 if(hole.min[1]<d/2+.12&&hole.max[1]>d/2-.12){for(const[x0,x1]of[[ridgeStart,hole.min[0]],[hole.max[0],ridgeEnd]])b.box('穿孔两侧长脊','roof',x0,profile(w/2,d/2)-.01,d/2-.12,x1-x0,.18,.24);}
 else b.box('连续长脊','roof',ridgeStart,profile(w/2,d/2)-.01,d/2-.12,ridgeEnd-ridgeStart,.18,.24);
 b.grid=new Grid(original.chunks);b.ports=structuredClone(original.ports);
 const a=b.finish();a.source!.retainedOriginalRoof={asset:original,geometrySHA256:outfitHash(geometryData(original))};return a;
}
