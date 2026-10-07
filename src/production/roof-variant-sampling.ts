import {ArchitectureComponent} from './architecture-components';
import {architectureRoof} from './architecture-roofs';
import {architectureDistantRoles} from './architecture-distant';
import {componentMeshes as architectureComponents} from './component-meshes';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {outfitHash} from './outfit-components';
import type {Project} from '../core/types';

/** The caller retains the complete075 parent and its original near authority. */
export function sampledHip(p:Project,id:string,level:'far1'|'far2'){
 const w=12.8,d=6.4,e=.4,hipEnd=2.4,original=architectureRoof(p,id+'-retained-near','hip',w,d);
 const profile=(x:number,z:number)=>{
  const cross=1-Math.abs(z-d/2)/(d/2+e),hip=Math.min(1,(x+e)/(hipEnd+e),(w+e-x)/(hipEnd+e));
  return .12+1.6*Math.min(cross,hip)+.22*Math.pow(Math.abs(z-d/2)/(d/2+e),5)*(.4+.6*Math.pow(Math.abs(x-w/2)/(w/2+e),4));
 };
 const xs=level==='far1'?[-e,hipEnd,w/2,w-hipEnd,w+e]:[-e,hipEnd,w-hipEnd,w+e],zs=level==='far1'?[-e,d*.2,d/2,d*.8,d+e]:[-e,d/2,d+e];
 const omittedDisplayParts=['连续檐口木枋','连续山墙坡梁'];
 const b=new ArchitectureComponent(p,id,'长脊飞檐手选远档 · '+level,['BUILT-075'],{sampling:level,w,d,sampledGrid:{xs,zs},originalSourceGrid:{x:7,z:7},omittedDisplayParts,displayOmissionReason:'Fine eave timbers and gable braces follow the retained near surface and can protrude through a coarse sampled surface. Omit these four small timbers only from the far display; keep all original near parts, ridge, underside layers, bearing beams and native fasteners.',automaticDistanceLOD:false});
 for(const [name,role,offset,thickness]of[['连续瓦面-0','roof',0,.07],['独立防水层-0','waterproofMembrane',-.07,.015],['木望板-0','wood',-.085,.08]]as const)b.surface(name,role,xs,zs,(x,z)=>profile(x,z)+offset,thickness);
 for(const part of architectureComponents(original))if(!['连续瓦面-0','独立防水层-0','木望板-0',...omittedDisplayParts].includes(part.name))b.mesh(part);
 b.grid=new Grid(original.chunks);b.ports=structuredClone(original.ports);
 const a=b.finish(),map=new Map(Object.entries(architectureDistantRoles).map(([from,to])=>[p.styles.yunshan[from],p.styles.yunshan[to]]));
 for(const mesh of a.meshes!){const material=map.get(mesh.material);if(!material||!p.materials[material]||p.materials[material].solid)throw new Error('Missing non-solid distant purpose');mesh.material=material;mesh.collision=false;}
 for(const r of a.source!.componentIndexRanges as {material:number}[])r.material=map.get(r.material)!;
 const g=new Grid();for(const[v,m]of new Grid(a.chunks).cells())g.set(v,map.get(m)!);a.chunks=g.serialize();
 a.source!.physical=false;a.source!.originalRuntimeBound=false;a.source!.nearAuthority={asset:original,geometrySHA256:outfitHash(geometryData(original)),scope:'Saved unchanged author near component. Original game emitter code/data was not supplied. Far sampling changes this display derivative only.'};
 return a;
}
