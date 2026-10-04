import type {V3} from '../core/types';import {AvatarModel} from './avatar-model';import {hollowLoft,roundBand,loft,rigidMesh,type Ring} from './mesh-shapes';
export const ROOT='root';
export function heldModel(s:Record<string,number>){const m=new AvatarModel(s);m.bind('prop');m.joint(ROOT,null,[0,0,0]);return m;}
export function slab(m:AvatarModel,name:string,role:string,x:number,y:number,z:number,w:number,h:number,d:number){m.add(name,role,[{x:x+w/2,y,z:z+d/2,rx:w/2,rz:d/2,bevel:Math.min(w,d)*.12},{x:x+w/2,y:y+h,z:z+d/2,rx:w/2,rz:d/2,bevel:Math.min(w,d)*.12}],ROOT,false);}
export function shell(m:AvatarModel,name:string,role:string,rings:Ring[],t:number,round=false){const inner=rings.map((r,i)=>({...r,y:r.y+(i===0?t:0),rx:r.rx-t,rz:r.rz-t,bevel:r.bevel===undefined?undefined:Math.max(.001,r.bevel-t*.2)}));m.mesh(hollowLoft(name,m.s[role],rings,inner,'top',round),ROOT);}
/** A real XY loop with hollow middle, separate from a decorative line. */
export function loopXY(m:AvatarModel,name:string,role:string,c:V3,rx:number,ry:number,t=.008,depth=.008){const mesh=roundBand(name,m.s[role],[{y:-depth/2,rx,rz:ry},{y:depth/2,rx,rz:ry}],t);m.mesh(rigidMesh(mesh,c,Math.PI/2),ROOT);}
export function pin(m:AvatarModel,name:string,c:V3,role='utensilFerrule',size=.01){const p=c.map(v=>Math.round((v-size/2)/.005)*.005) as V3;m.box(name,role,...p,size,size,size,ROOT);}
export function ferrule(m:AvatarModel,name:string,y:number,r=.02,h=.025){m.add(name,'utensilFerrule',[{y,rx:r,rz:r},{y:y+h,rx:r,rz:r}],ROOT);pin(m,name+'方销',[0,y+h/2,-r]);}
export function grip(m:AvatarModel,p:V3,axis:V3=[0,1,0],radius=.015,length=.09){m.port('grip',p,axis.every(v=>[-1,0,1].includes(v))?axis:[1,0,0],axis.map(v=>Math.abs(v)*length+2*radius*Math.sqrt(Math.max(0,1-v*v))) as V3,ROOT);m.detail.grip={center:p,axis,radiusM:radius,lengthM:length,authority:'author',originalHandControllerBound:false};}
export function woodenShaft(m:AvatarModel,name:string,role:string,bottom:number,top:number,r=.012){m.add(name,role,[{y:bottom,rx:r,rz:r},{y:top,rx:r*.9,rz:r*.9}],ROOT,false);}
