import type {Project,V3} from '../core/types';
import {rotateY} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent,civicPlate,civicWall,type Opening} from './civic-components';
import {civicAsset,roof,rail} from './civic-landmarks';
import {modernWall,modernPlate,modernPost,modernRoof,modernRail,modernStairs} from './metropolis-components';

export const districtWell:Opening={min:[-2.8,-4.2],max:[2.8,4.2]};
export type WalkRoute={name:string;points:V3[];width?:number};
export type DistrictSource={routes:WalkRoute[];[key:string]:unknown};
export function districtBuilder(p:Project,id:string){return new ArchitectureBuilder(p,id);}
export function districtSource():DistrictSource{return{parameters:{},routes:[],scope:'Explicit author geometry and finite circulation samples. Original Building/FloorPlan, terrain, permissions, identities, energy/flight controllers and world coordinates are unavailable and remain unbound. Technical candidate; human art acceptance pending.'};}
export function route(s:DistrictSource,name:string,points:V3[],width=.45){s.routes.push({name,points,width});}
export function districtWall(b:ArchitectureBuilder,w:number,h:number,pos:V3,rot=0,door=false,modern=false){return b.place(civicAsset(b,'district-wall-'+w+'-'+h+'-'+door+'-'+modern,id=>modern?modernWall(b.p,id,w,h,door):civicWall(b.p,id,w,h,door)),pos,rot,'facade');}
export function wellGuard(b:ArchitectureBuilder,h:Opening,y:number,at:[number,number]=[0,0]){for(const x of[h.min[0],h.max[0]])modernRail(b,h.max[1]-h.min[1],[at[0]+x,y,at[1]+h.min[1]],3);modernRail(b,h.max[0]-h.min[0],[at[0]+h.min[0],y,at[1]+h.max[1]]);}
export function perimeterGuard(b:ArchitectureBuilder,w:number,d:number,pos:V3){for(const z of[-d/2,d/2])modernRail(b,w,[pos[0]-w/2,pos[1],pos[2]+z]);for(const x of[-w/2,w/2])modernRail(b,d,[pos[0]+x,pos[1],pos[2]-d/2],3);}
export function shiftNew(b:ArchitectureBuilder,start:number,at:V3,rotation=0){for(const i of b.instances.slice(start)){i.position=rotateY(i.position,rotation).map((n,d)=>Math.round((n+at[d])*1e8)/1e8||0)as V3;i.rotation=(i.rotation+rotation)%4;}}

/** Each storey owns its walls and true opening. Stair geometry is never placed through a solid plate. */
export function districtHouse(b:ArchitectureBuilder,s:DistrictSource,key:string,at:V3,w=14,d=16,floors=2,modern=false,sideDoor?:{level:number;side:1|3},backDoor=true){
 const start=b.instances.length,levels=[];for(let f=0;f<floors;f++){const y=f*4.2;modernPlate(b,w,d,[0,y,0],f?[districtWell]:[]);districtWall(b,w,4.2,[0,y,-d/2],0,f===0,modern);districtWall(b,w,4.2,[0,y,d/2],2,f===0&&backDoor,modern);for(const side of[1,3]as const)districtWall(b,d,4.2,[side===1?w/2:-w/2,y,0],side,sideDoor?.level===f&&sideDoor.side===side,modern);if(f<floors-1)modernStairs(b,4.2,[-2.6,y,-4.2]);if(f)wellGuard(b,districtWell,y);levels.push({level:f,walkY:at[1]+y,proposedUse:'unassigned',permissions:'unbound'});route(s,key+' floor '+f,[[at[0]+1.4,at[1]+y,at[2]-4.5],[at[0]+1.4,at[1]+y,at[2]-d/2+1]]);}
 if(modern)modernRoof(b,w,d,[0,floors*4.2,0],1.3);else roof(b,w,d,[0,floors*4.2,0],1.5,'gable');shiftNew(b,start,at);
 route(s,key+' entrance',[[at[0],at[1],at[2]-d/2-.6],[at[0],at[1],at[2]-d/2+1],[at[0]-1.4,at[1],at[2]-d/2+1],[at[0]-1.4,at[1],at[2]-4.4]]);
 return{key,position:at,footprint:[w,d],floors,levels,instanceIds:b.instances.slice(start).map(i=>i.id),frontDoor:[at[0],at[1],at[2]-d/2]as V3,backDoor:backDoor?[at[0],at[1],at[2]+d/2]:null};
}

/** 0.30m beams, 0.18m laminated roof, genuine columns and metre-space eave profile. */
export function thinCanopy(b:ArchitectureBuilder,w:number,d:number,at:V3,columns:number[],h=3.6,modern=true){
 const start=b.instances.length,roofId=civicAsset(b,'district-thin-canopy-'+w+'-'+d+'-'+modern+'-'+columns.join('-'),id=>{const c=new CivicComponent(b.p,id,'连续薄檐、独立防水膜与实际承梁',['BUILT-011','BUILT-012','BUILT-013','BUILT-059'],{w,d,columns,beamDepth:.30,roofThickness:.18});const y=(z:number)=>.30+.20*(Math.abs(z)/(d/2+.4))**4;for(const [role,shift,t]of[[modern?'architecturalCladding':'roof',0,.08],['waterproofMembrane',-.08,.02],[modern?'metalBright':'wood',-.1,.08]]as [string,number,number][])c.surface('连续檐-'+role,role,[-w/2-.4,w/2+.4],Array.from({length:9},(_,j)=>-d/2-.4+(d+.8)*j/8),(_,z)=>y(z)+shift,t);for(const z of[-d/2+.25,d/2-.25])c.box('柱上通长薄梁',modern?'metal':'woodEdge',-w/2,-.15,z-.15,w,.30,.30);for(const x of columns){c.box('穿接横椽',modern?'metal':'wood',x-.12,.10,-d/2,.24,.22,d);c.pin('最小体素檐销','bronze',[x,.12,-d/2+.1]);}return c.finish();});
 b.place(roofId,[0,h,0],0,'canopy');for(const x of columns)for(const z of[-d/2+.25,d/2-.25])modernPost(b,h,.24,[x,0,z]);shiftNew(b,start,at);return{position:at,width:w,depth:d,clearWidth:d-.5-.336,beamDepth:.3,headY:at[1]+h,instanceIds:b.instances.slice(start).map(i=>i.id)};
}
export function counter(b:ArchitectureBuilder,pos:V3){return b.place(civicAsset(b,'district-shop-counter',id=>{const c=new CivicComponent(b.p,id,'作者木制售货工作台',['LIFE-064'],{w:2.2,d:1.0,h:.95});c.box('木柜台面','wood',-1.1,.86,-.5,2.2,.09,1);for(const x of[-1,.85])c.box('木立板','wood',x,0,-.45,.15,.86,.9);c.box('柜后木挡','woodEdge',-1,.12,.35,2,.7,.08);c.box('金属踢脚','metal',-1.02,.06,-.48,2.04,.08,.08);c.pin('台面定位销','bronze',[-1,.90,-.4]);return c.finish();}),pos,0,'fixture');}
export function schoolDesk(b:ArchitectureBuilder,pos:V3){return b.place(civicAsset(b,'district-student-desk',id=>{const c=new CivicComponent(b.p,id,'作者双人课桌和长凳',['LIFE-109'],{purpose:'author-classroom-workplace',notLecternMaster:true});c.box('木桌面','wood',-.9,.72,-.35,1.8,.08,.7);for(const x of[-.78,.68])for(const z of[-.27,.18])c.box('金属桌脚','metal',x,0,z,.10,.72,.10);c.box('长凳木座','wood',-.85,.42,.65,1.7,.08,.35);for(const x of[-.75,.65])c.box('凳脚','woodEdge',x,0,.69,.10,.42,.25);c.pin('课桌最小铜销','bronze',[-.74,.74,-.22]);return c.finish();}),pos,0,'fixture');}
export function ramp(b:ArchitectureBuilder,key:string,from:V3,to:V3,width:number){
 if(from[0]!==to[0]||from[2]===to[2])throw new Error('District ramp currently follows Z');const lo=Math.min(from[2],to[2]),hi=Math.max(from[2],to[2]),height=(z:number)=>from[1]+(to[1]-from[1])*(z-from[2])/(to[2]-from[2]);return b.place(civicAsset(b,'district-ramp-'+key+'-'+JSON.stringify([from,to,width]),id=>{const c=new CivicComponent(b.p,id,'连续斜坡与独立金属扶栏',['BUILT-003','BUILT-097'],{from,to,width,physicalAuthority:'closed-authored-mesh'});c.surface('连续混凝土斜板','structuralConcrete',[from[0]-width/2,from[0]+width/2],[lo,hi],(_,z)=>height(z)-.05,.25);c.surface('连续石铺坡面','stone',[from[0]-width/2,from[0]+width/2],[lo,hi],(_,z)=>height(z),.05);for(const x of[from[0]-width/2+.08,from[0]+width/2-.08]){c.beam('顺坡连续扶手','facadeFrame',[x,height(lo)+1.06,lo],[x,height(hi)+1.06,hi],.08);for(let z=lo;z<=hi+.01;z+=Math.min(2,(hi-lo)/2))c.box('实际坡栏柱','metal',x-.03,height(z)-.01,z-.03,.06,1.07,.06);}c.pin('坡道端销','bronze',[from[0]-width/2+.10,height(lo)-.02,lo+.04]);return c.finish();}),[0,0,0],0,'ramp');
}
