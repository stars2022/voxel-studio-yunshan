import type {Asset,Project,V3} from '../core/types';
import {makeCostumeAsset} from './atlas-costumes';
import {makeGarmentAsset} from './atlas-garments';
import {makeFigureAsset} from './atlas-figure';
import {makeAvatarAsset} from './atlas-avatar';
import {reflectAvatar} from './avatar-assembly';
import {garmentBodyId,garmentFrame} from './garment-shapes';
import {garmentMount,garmentPoseAsset,type GarmentPose} from './garment-body';
import {costumeBodySlot,costumeLabUnderlayer} from './costume-body';
export const costumeScenes=['children','uniforms','work-field','medical','service','poses','labcoat-fits'] as const;
export type CostumeScene=typeof costumeScenes[number];
export type CostumeWearer={key:string;fit:string;catalogId:string;pose?:GarmentPose;x?:number};
export function costumeWearers(base:Project,actors:CostumeWearer[],name='作者衣装穿戴'):Project{
 const p=structuredClone(base);p.name='M037 · '+name;p.assets={};p.instances={};const s=p.styles.yunshan,keep=(a:Asset)=>p.assets[a.id]??(p.assets[a.id]=a),place=(a:Asset,position:V3,key:string)=>{keep(a);p.instances[key]={id:key,assetId:a.id,name:a.name,position,rotation:0,parent:null};},posed=(a:Asset,pose:GarmentPose)=>pose==='standing'?a:keep(garmentPoseAsset(a,pose,a.id+'-'+pose));
 for(const {key,fit,catalogId,pose='standing',x=0}of actors){const f=garmentFrame(fit),neutral=['infant','teen'].includes(fit),child=fit==='child',position:V3=[x,.020,0],source=keep(makeFigureAsset(garmentBodyId(fit),'保留原年龄身体','body-'+fit,s,{extremities:neutral?'covered':'sockets'})),slot=keep(costumeBodySlot(source,fit,catalogId,s,'slot-'+fit+'-'+catalogId));place(posed(slot,pose),position,key+'-body');
  const garment=keep(makeCostumeAsset(catalogId,catalogId,catalogId.toLowerCase()+'-'+fit,s,catalogId==='CHAR-125'?{}:{costumeFit:fit}));place(posed(garment,pose),position,key+'-'+catalogId);
  const ids=catalogId==='CHAR-136'?['CHAR-113','CHAR-118','CHAR-122']:catalogId==='CHAR-134'?['CHAR-113','CHAR-122']:neutral?[]:[child?'CHAR-123':'CHAR-122'];for(const id of ids){const a=keep(makeGarmentAsset(id,id,id.toLowerCase()+'-'+fit,s,id==='CHAR-123'?{}:{bodyFit:fit}));const installed=catalogId==='CHAR-134'&&id==='CHAR-113'?keep(costumeLabUnderlayer(a,fit,a.id+'-lab-underlayer')):a;place(posed(installed,pose),position,key+'-'+id);}
  const headId='head-'+fit,head=keep(fit==='infant'?makeFigureAsset('CHAR-067','独立婴儿头',headId,s,{headStage:'infant'}):child||fit==='teen'?makeAvatarAsset('CHAR-068','独立年龄头',headId,s,{headStage:child?'school':'teen'}):makeFigureAsset('CHAR-066','独立成人头',headId,s));
  const mounted=(src:Asset,joint:string,offset:V3)=>keep(garmentMount(src,fit,joint,offset,s,'mounted-'+src.id+'-'+fit+'-'+joint));place(posed(mounted(head,'head',[0,f.neck,0]),pose),position,key+'-head');
  if(!neutral){const hair=keep(makeAvatarAsset('CHAR-085','独立短发','hair-'+fit,s,{hairFit:child?'child':'adult'}));place(posed(mounted(hair,'head',[0,f.neck,0]),pose),position,key+'-hair');for(const side of[-1,1])for(const type of['hand','foot'] as const){const raw=keep(makeAvatarAsset(type==='hand'?'CHAR-070':'CHAR-071','独立'+type,type+'-'+fit,s,{limbFit:child?'child':'adult'})),reflected=type==='hand'?side>0:side<0,src=reflected?keep(reflectAvatar(raw,raw.id+'-reflected')):raw,offset:V3=type==='hand'?[side*f.wristX,f.wrist,0]:[side*f.q.hipHalfWidthM,f.ankle,0],joint=(type==='hand'?'wrist':'ankle')+side;place(posed(mounted(src,joint,offset),pose),position,key+'-'+type+side);}}
 }
 p.selection={assetId:Object.values(p.instances)[0].assetId,partId:null,region:null};return JSON.parse(JSON.stringify(p));
}
export function costumeScene(base:Project,kind:CostumeScene):Project{
 const actor=(catalogId:string,fit:string,x:number,pose:GarmentPose='standing'):CostumeWearer=>({key:catalogId.toLowerCase()+'-'+fit+'-'+pose,catalogId,fit,x,pose});let actors:CostumeWearer[]=[];
 if(kind==='children')actors=[actor('CHAR-125','infant',-.85),actor('CHAR-126','child',0),actor('CHAR-126','teen',.85)];
 if(kind==='uniforms')actors=[actor('CHAR-127','adultA',-1),actor('CHAR-128','adultB',0),actor('CHAR-129','adultA',1)];
 if(kind==='work-field')actors=[actor('CHAR-130','adultA',-.55),actor('CHAR-131','adultB',.55)];
 if(kind==='medical')actors=[actor('CHAR-132','adultA',-1),actor('CHAR-133','adultB',0),actor('CHAR-134','adultA',1)];
 if(kind==='service')actors=[actor('CHAR-135','adultA',-.55),actor('CHAR-136','adultB',.55)];
 if(kind==='poses')actors=[actor('CHAR-127','adultA',-.55,'raisedArms'),actor('CHAR-130','adultA',.55,'walking')];
 if(kind==='labcoat-fits')actors=[actor('CHAR-134','adultA',-.55),actor('CHAR-134','adultB',.55)];
 return costumeWearers(base,actors,kind);
}
