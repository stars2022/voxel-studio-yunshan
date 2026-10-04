import type {Asset,Project,V3,Bounds} from '../core/types';
import {Grid} from '../core/grid';
import {makeAvatarAsset} from './atlas-avatar';
import {makeFigureAsset,figureProportions} from './atlas-figure';
import {abdomenProfile} from './avatar-extensions';
import {loft,roundLoft} from './mesh-shapes';
import {snap} from './avatar-model';
export const avatarScenes=['faces','hair','hands-feet','rigs','first-person','abdomen','dressed'] as const;
export type AvatarScene=typeof avatarScenes[number];
/** Exact X reflection, preserving native cells, skeleton hierarchy and pose conjugation. */
export function reflectAvatar(source:Asset,id:string):Asset{
 const a=structuredClone(source),g=new Grid();a.id=id;a.name+=' · 镜像';a.category='import';a.source={kind:'author-reflected-component',notCatalogMaster:true,sourceAssetId:source.id,sourceParameters:source.source?.parameters,exactNativeReflection:true};
 for(const[v,m]of new Grid(source.chunks).cells())g.set([-v[0]-1,v[1],v[2]],m);a.chunks=g.serialize();a.origin[0]=-a.origin[0];const region=(r:Bounds):Bounds=>({min:[-r.max[0],r.min[1],r.min[2]],max:[-r.min[0],r.max[1],r.max[2]]});a.parts=a.parts.map(p=>({...p,region:region(p.region)}));
 for(const m of a.meshes??[]){m.positions=m.positions.map((v,i)=>i%3===0?-v:v);m.normals=m.normals.map((v,i)=>i%3===0?-v:v);for(let i=0;i<m.indices.length;i+=3)[m.indices[i+1],m.indices[i+2]]=[m.indices[i+2],m.indices[i+1]];}
 for(const p of a.ports){p.position[0]=-p.position[0];p.normal[0]=-p.normal[0];}
 if(a.rig){for(const j of a.rig.joints)j.translation[0]=-j.translation[0];a.rig.voxelJoints=a.rig.voxelJoints.map(b=>({...b,region:region(b.region)}));for(const[id,q]of Object.entries(a.rig.pose))a.rig.pose[id]=[q[0],-q[1],-q[2],q[3]];}
 return a;
}
/** Derived slot body retains the original master separately; the old middle is actually absent. */
export function abdomenSlot(source:Asset,fit:string,id:string):Asset{
 const a=structuredClone(source),{q,bottom,top}=abdomenProfile(fit),depth=q.hipRadiusM*.65,neckR=q.headM*.19,mesh=q.section==='rounded'?roundLoft:loft;
 a.id=id;a.name='衣身腹段替换槽 · '+fit;a.category='import';a.meshes=a.meshes!.filter(m=>m.name!=='髋腹胸肩连续衣身');
 a.meshes.push(mesh('保留髋部到下接缝',source.meshes![0].material,[{y:q.hipYM-.014,rx:q.hipRadiusM*.87,rz:depth},{y:bottom,rx:q.hipRadiusM,rz:depth*1.03}]),mesh('保留胸肩到颈部',source.meshes![0].material,[{y:top,rx:q.shoulderHalfWidthM*.88,rz:depth*1.06},{y:q.shoulderYM+.005,rx:q.shoulderHalfWidthM*.96,rz:depth*.88},{y:q.heightM-q.headM-.018,rx:neckR*1.1,rz:neckR*.96}]));
 const removed=a.parts.filter(p=>p.id!=='root'&&p.region.min[1]*a.cellSize>=bottom&&p.region.max[1]*a.cellSize<=top),g=new Grid(a.chunks);for(const[v]of g.cells())if(removed.some(p=>v.every((n,i)=>n>=p.region.min[i]&&n<p.region.max[i])))g.set(v,0);a.chunks=g.serialize();a.parts=g.count?a.parts.filter(p=>!removed.some(r=>r.id===p.id)):[];if(a.parts.length)a.parts[0].region=g.bounds()!;
 a.ports.push({id:'abdomen-bottom',kind:'character-socket',position:[0,bottom,0],normal:[0,1,0],size:[.1,.01,.1],pitch:.005});a.source={kind:'author-abdomen-slot',notCatalogMaster:true,sourceAssetId:source.id,sourceVersion:source.version,fit,removedMesh:'髋腹胸肩连续衣身',removedNativeParts:removed.map(p=>p.name),removedIntervalM:[bottom,top],originalMasterRetained:true,replacementNotOverlay:true};return a;
}
export function avatarScene(base:Project,kind:AvatarScene):Project{
 const p=structuredClone(base);p.name='M033 · '+kind+' 作者装配';p.assets={};p.instances={};const s=p.styles.yunshan;
 const make=(id:string,key=id.toLowerCase(),params={})=>makeAvatarAsset(id,id,key,s,params),figure=(id:string,key=id.toLowerCase(),params={})=>makeFigureAsset(id,id,key,s,params);
 const retain=(a:Asset)=>{p.assets[a.id]=a;return a;},add=(a:Asset,position:V3)=>{retain(a);const id='i-'+a.id;p.instances[id]={id,assetId:a.id,name:a.name,position:position.map(snap) as V3,rotation:0,parent:null};return a;};
 if(kind==='faces')for(const[index,id]of ['CHAR-062','CHAR-063','CHAR-064','CHAR-065'].entries()){const x=(index-1.5)*.65,q=figureProportions[id];add(figure(id),[x,0,0]);add(make(index===3?'CHAR-069':'CHAR-068','face-'+index,index===3?{}:{headStage:['preschool','school','teen'][index]}),[x,q.heightM-q.headM,0]);}
 if(kind==='hair')for(const[fitIndex,fit]of ['adult','child'].entries())for(const[i,id]of ['CHAR-085','CHAR-086','CHAR-087','CHAR-088'].entries()){const position:V3=[(i-1.5)*.40,.025,fitIndex*.45],head=fit==='adult'?figure('CHAR-066','head-'+fit+'-'+i):make('CHAR-068','head-'+fit+'-'+i,{headStage:'school'});add(head,position);add(make(id,id.toLowerCase()+'-'+fit,{hairFit:fit}),position);}
 if(kind==='hands-feet')for(const[i,fit]of ['adult','child'].entries()){for(const[j,pose]of ['open','grip'].entries())add(make('CHAR-070','hand-'+fit+'-'+pose,{limbFit:fit,handPose:pose}),[(j-.5)*.28,.19,i*.36]);add(make('CHAR-071','foot-'+fit,{limbFit:fit}),[.53,.11,i*.36]);}
 if(kind==='rigs')for(const[i,id]of ['CHAR-073','CHAR-074'].entries())for(const[j,pose]of ['rest','reach'].entries())add(make(id,id.toLowerCase()+'-'+pose,{rigPose:pose}),[(j-.5)*.70,0,i*.85]);
 if(kind==='first-person')for(const[i,pose]of ['open','grip'].entries())add(make('CHAR-075','fps-'+pose,{handPose:pose}),[(i-.5)*.70,.10,0]);
 if(kind==='abdomen')for(const[i,fit]of ['adultA','adultB'].entries()){const id=i?'CHAR-060':'CHAR-059',q=figureProportions[id],body=retain(figure(id)),slot=abdomenSlot(body,fit,'slot-'+fit),x=(i-.5)*.75;add(slot,[x,0,0]);add(make('CHAR-072','abdomen-'+fit,{abdomenFit:fit}),[x,abdomenProfile(fit).bottom,0]);add(figure('CHAR-066','head-'+fit),[x,q.heightM-q.headM,0]);}
 if(kind==='dressed')for(const[i,fit]of ['adult','child'].entries()){const id=i?'CHAR-063':'CHAR-059',q=figureProportions[id],x=(i-.5)*.8,body=add(figure(id,id.toLowerCase(),{extremities:'sockets'}),[x,0,0]);add(i?make('CHAR-068','head-'+fit,{headStage:'school'}):figure('CHAR-066','head-'+fit),[x,q.heightM-q.headM,0]);add(make('CHAR-085','hair-'+fit,{hairFit:fit}),[x,q.heightM-q.headM,0]);const hand=retain(make('CHAR-070','hand-'+fit,{limbFit:fit})),foot=retain(make('CHAR-071','foot-'+fit,{limbFit:fit}));for(const side of[-1,1]){const hp=body.ports.find(p=>p.id==='wrist-'+side)!.position,fp=body.ports.find(p=>p.id==='ankle-'+side)!.position;add(side>0?reflectAvatar(hand,'hand-reflected-'+fit):hand,hp.map((v,d)=>v+(d===0?x:0)) as V3);add(side<0?reflectAvatar(foot,'foot-reflected-'+fit):foot,fp.map((v,d)=>v+(d===0?x:0)) as V3);}}
 p.selection={assetId:Object.values(p.instances)[0].assetId,region:null,partId:null};return p;
}
