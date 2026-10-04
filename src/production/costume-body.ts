import type {Asset} from '../core/types';
import {AvatarModel} from './avatar-model';
import {garmentFrame,torsoProfiles,sectorBand} from './garment-shapes';
import {garmentBodySlot,splitGarmentBodyMesh} from './garment-body';

/** Explicit installation derivatives; the original full body remains a separate source. */
export function costumeBodySlot(source:Asset,fit:string,catalogId:string,s:Record<string,number>,id:string):Asset{
 const apron=catalogId==='CHAR-136',open=catalogId==='CHAR-134',f=garmentFrame(fit),a=garmentBodySlot(source,fit,apron?['CHAR-113','CHAR-118']:['CHAR-113'],s,id),removed=[...(a.source!.removedMeshes as string[])];
 if(catalogId==='CHAR-131')for(const side of[-1,1]){const original=source.meshes!.find(m=>m.name==='肩肘腕连续袖身-'+side)!;const mesh=splitGarmentBodyMesh(original,f.elbow,false);mesh.name='作者短袖暴露前臂-'+side;mesh.material=s.skinSurface;a.meshes!.push(mesh);a.rig!.meshJoints[mesh.name]='elbow'+side;}
 // Infant and teen retain their own age-specific neutral covered ends. They are not fine hands/feet.
 for(const mesh of a.meshes!){const side=mesh.name.endsWith('--1')?-1:1;if(mesh.name.startsWith('中性衣套手端非精细手-'))a.rig!.meshJoints[mesh.name]='wrist'+side;if(mesh.name.startsWith('中性衣套足端非裸足-'))a.rig!.meshJoints[mesh.name]='ankle'+side;}
 a.source={...a.source,kind:'author-costume-body-slot',costumeCatalogId:catalogId,removedMeshes:removed,originalBodyRetained:true,oldCoveredExtremitiesExcluded:!['infant','teen'].includes(fit),neutralCoveredEndsRetained:['infant','teen'].includes(fit),independentUnderlayerForOpenCoat:open,exposedForearmsAreAuthorProfileStudy:catalogId==='CHAR-131',notCatalogMaster:true};return a;
}

/** The open coat uses only explicitly visible original-shirt panels; source master remains intact. */
export function costumeLabUnderlayer(source:Asset,fit:string,id:string):Asset{const a=structuredClone(source),r=torsoProfiles(fit),outer=a.meshes!.find(m=>m.name==='衣身真实腰腔')!,inner=a.meshes!.find(m=>m.name==='衣身独立内衬')!,collar=a.meshes!.find(m=>m.name==='真实开放领圈')!;a.meshes=[sectorBand('实验外套内搭可见前衣面',outer.material,r,-Math.PI*.15,Math.PI*.15,.004,8),sectorBand('实验外套内搭可见前衬',inner.material,r.map(v=>({...v,rx:v.rx-.0042,rz:v.rz-.0042})),-Math.PI*.15,Math.PI*.15,.002,8),collar];a.chunks={};a.parts=[];a.rig!.voxelJoints=[];a.rig!.meshJoints=Object.fromEntries(a.meshes.map(m=>[m.name,'chest']));a.ports=a.ports.filter(p=>p.id==='neck');a.rig!.sockets={neck:'chest'};a.id=id;a.name+=' · 实验外套可见内搭';a.category='import';a.source={...source.source,kind:'author-labcoat-underlayer',notCatalogMaster:true,sourceAssetId:source.id,sourceMasterRetained:true,visibleTorsoSectorRadians:[-Math.PI*.15,Math.PI*.15],removedHiddenNativeParts:source.parts.filter(p=>p.id!=='root').map(p=>p.name),removedHiddenMeshes:source.meshes!.filter(m=>m!==collar).map(m=>m.name),originalGarmentGeometryPreserved:false,reason:'Rebuild the original torso profiles as the visible front lining; remove covered sleeves/back/shoulders/straps and every associated native fastener.'};return a;}
