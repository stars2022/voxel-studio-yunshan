import type {Project} from '../core/types';
import {ArchitectureComponent} from './architecture-components';
export type RoofForm='hip'|'gable'|'industrial'|'market'|'flat';
/** Each assembly places the separate roof/underlay/beam component at real eave height. */
export function architectureRoof(p:Project,id:string,form:RoofForm,w:number,d:number,skylight=false){
 const base=form==='hip'?'BUILT-011':form==='gable'?'BUILT-011':form==='industrial'?'BUILT-065':'BUILT-011';
 const b=new ArchitectureComponent(p,id,'连续屋面 · '+form,[base,'BUILT-012','BUILT-013'],{form,w,d,overhang:.4,rise:form==='flat'?.1:1.6});
 const e=.4,rise=form==='flat'?.1:1.6;
 const profile=(x:number,z:number)=>{
  if(form==='flat')return .18;
  const cross=1-Math.abs(z-d/2)/(d/2+e),hip=form==='hip'?Math.min(1,(x+e)/(Math.min(w*.23,2.4)+e),(w+e-x)/(Math.min(w*.23,2.4)+e)):1;
  const up=.22*Math.pow(Math.abs(z-d/2)/(d/2+e),5)*(form==='hip'?.4+.6*Math.pow(Math.abs(x-w/2)/(w/2+e),4):1);
  return .12+rise*Math.min(cross,hip)+up;
 };
 const xs=[-e,0,w*.2,w*.5,w*.8,w,w+e],zs=skylight?[-e,0,d*.18,d*.2,d*.43,d*.5,d*.8,d,d+e]:[-e,0,d*.2,d*.5,d*.8,d,d+e];
 const pieces=skylight?[
  {x:[-e,0,.6],z:zs},{x:[w-.6,w,w+e],z:zs},
  {x:[.6,w/2,w-.6],z:[-e,0,d*.18]},
  {x:[.6,w/2,w-.6],z:[d*.43,d/2,d*.8,d,d+e]},
 ]:[{x:xs,z:zs}];
 for(const[i,r]of pieces.entries()){
  b.surface('连续瓦面-'+i,'roof',r.x,r.z,(x,z)=>profile(x,z),.07);
  b.surface('独立防水层-'+i,'waterproofMembrane',r.x,r.z,(x,z)=>profile(x,z)-.07,.015);
  b.surface('木望板-'+i,'wood',r.x,r.z,(x,z)=>profile(x,z)-.085,.08);
 }
 // Genuine metre-space ridge and end ornaments; no stepped slope rasterisation.
 if(form!=='flat'){
  const hipEnd=form==='hip'?Math.min(w*.23,2.4):0;
  b.box('长屋脊','roof',hipEnd-.12,profile(w/2,d/2)-.01,d/2-.12,w-2*hipEnd+.24,.18,.24);
  for(const x of[hipEnd-.12,w-hipEnd-.04]){b.box('端脊金属底','metal',x,profile(w/2,d/2)+.14,d/2-.12,.16,.16,.24);b.box('端脊铜饰','bronze',x+.02,profile(w/2,d/2)+.3,d/2-.10,.12,.10,.20);b.pin('脊饰最小销','bronze',[x+.06,profile(w/2,d/2)+.39,d/2-.02]);}
 }
 for(const z of[-e+.06,d+e-.18])b.box('连续檐口木枋','woodEdge',-.30,profile(w/2,z)-.20,z,w+.6,.14,.12);
 for(const z of[.18,d-.42])b.box('横向通长承梁','wood',.1,-.14,z,w-.2,.14,.24);
 for(const x of[.1,w-.3]){
  b.box('山墙承枋','wood',x,-.14,0,.2,.14,d);
  b.surface('连续山墙坡梁','wood',[x,x+.2],zs,(xx,z)=>profile(xx,z)-.165,.14);
  for(const z of[.2,d-.4]){b.box('梁檐托','woodEdge',x-.06,-.32,z,.32,.18,.2);b.pin('梁托铜销','bronze',[x+.04,-.16,z+.06]);}
 }
 return b.finish();
}
