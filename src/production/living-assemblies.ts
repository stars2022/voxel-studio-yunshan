import type {Project,V3} from '../core/types';
import {assetBoundsM,geometryData} from '../core/sky';
import {Grid} from '../core/grid';
import {rigPoint} from '../core/rig';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {garmentScene} from './garment-assembly';
import {makeAttireAsset} from './atlas-attire';
import {makeCommunityAssembly} from './community-assemblies';
import {outfitHash,outfitSourceImporter} from './outfit-components';
import {patientBandages} from './living-patient';
import {fittedAnimalWear} from './living-wear';

export const livingAssemblyIds=['CHAR-174','CHAR-175','CHAR-176','CHAR-332','CHAR-333','CHAR-334'];
const choices:Record<string,[string,string[]]>={
 'CHAR-175':['handPose',['open','grip']],
 'CHAR-176':['view',['observer','first-person-open','first-person-grip']],
 'CHAR-332':['wear',['collars','harnesses']],
 'CHAR-333':['group',['farmyard','small-stock']],
 'CHAR-334':['habitat',['forest-bank','stream']]
};
export function livingParameters(id:string):Record<string,{enum:string[];default:string}>{const d=choices[id];return d?{[d[0]]:{enum:d[1],default:d[1][0]}}:{};}
export function livingVariants(id:string):Record<string,string>[] {const d=choices[id];return d?d[1].map(v=>({[d[0]]:v})):[{}];}
export type LivingContact={kind:string;point:V3;left:string[];right:string[];leftMeshes?:string[];rightMeshes?:string[]};
export const livingCamera={position:[0,0,0]as V3,direction:[0,0,-1]as V3,verticalFOVDegrees:70,aspect:16/9,nearM:.05,handOffsetM:[0,-.20,-.40]as V3,controllerBound:false};

function patient(b:ArchitectureBuilder,contacts:LivingContact[]){
 const scene=garmentScene(b.p,'sleepwear'),selected=Object.values(scene.instances).filter(i=>i.id.startsWith('sleep-0')),body=selected.find(i=>i.id.endsWith('-body'))!,clothing=selected.find(i=>i.id==='sleep-0-CHAR-124')!,old=scene.assets[body.assetId];
 if(new Grid(old.chunks).count||(old.meshes??[]).some(m=>m.name!=='作者颈部连接皮肤'))throw new Error('Patient duplicate-neck omission would remove other body geometry');
 const original=makeAttireAsset('CHAR-145','原独立绷带','m059-original-bandage',scene.styles.yunshan,{costumeFit:'adultA'}),fit=patientBandages(scene,original,scene.assets[clothing.assetId]);
 scene.assets[original.id]=original;scene.assets[fit.asset.id]=fit.asset;
 const items=selected.filter(i=>i!==body);items.push({...clothing,id:'patient-bandage',assetId:fit.asset.id});
 const minimumY=Math.min(...items.map(i=>assetBoundsM(scene.assets[i.assetId])!.min[1]+i.position[1])),origin=clothing.position,importer=outfitSourceImporter(b,scene),omitted=importer.keep(body.assetId),instances=items.map(i=>({sourceInstance:i.id,sourceAsset:i.assetId,assetId:importer.keep(i.assetId),position:[i.position[0]-origin[0],i.position[1]-minimumY,i.position[2]-origin[2]]as V3,rotation:i.rotation})).map(i=>({...i,instance:b.place(i.assetId,i.position,i.rotation,'patient')}));
 const instance=(key:string)=>instances.find(i=>i.sourceInstance===key)!.instance;
 for(const c of fit.contacts){const point=rigPoint(fit.asset,c.contact,c.joint).map((v,k)=>v+(k===1?origin[1]-minimumY:0))as V3;contacts.push({kind:'bandage-on-pajamas',point,left:[instance('patient-bandage')],leftMeshes:[c.mesh],right:[instance(clothing.id)]});}
 return{bodyFit:'adultA',clothing:'CHAR-124',accessory:'CHAR-145',pose:'finite standing',groundY:0,sourceGraph:importer.sources,instances,omitted:[{sourceInstance:body.id,retainedAsset:omitted,reason:'Duplicate short neck is already present on the actual head; all original source data retained.'}]};
}

function firstPerson(b:ArchitectureBuilder,pose:string,sharedNPCClothes=false){
 const original=b.original('CHAR-075',{handPose:pose});let assetId=original;
 if(sharedNPCClothes)assetId=b.asset('m059-first-person-npc-'+pose,id=>{
  const source=b.p.assets[original],a=structuredClone(source),s=b.p.styles.yunshan,changes:Record<string,number>={};
  for(const m of a.meshes??[]){const next=m.material===s.characterCloth?s.garmentLight:m.material===s.characterLining?s.garmentLining:m.material;if(next!==m.material){changes[m.material+'->'+next]=(changes[m.material+'->'+next]??0)+1;m.material=next;}}
  a.id=id;a.name+=' · 共用NPC113衣料用途';a.source={kind:'assembly-derived-component',baseCatalogIds:['CHAR-075','CHAR-113'],sourceAssetId:original,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,notCatalogMaster:true,materialOnly:true,changedMeshMaterials:changes,nativeCellsUnchanged:true,rigAndPortsUnchanged:true,reason:'First-person sleeve cloth and lining use exactly the same purpose IDs as actual NPC113, while skin, nails, leather wrist wraps and metal fasteners retain their original IDs. No similarity-by-colour substitution.'};return a;
 });
 const instance=b.place(assetId,livingCamera.handOffsetM,0,'first-person');
 return{firstPerson:true,handPose:pose,camera:livingCamera,heldObjects:[],inventoryBound:false,sourceHands:'CHAR-075',bothHandsAlreadyIncluded:true,instance,originalRetained:original,forearmTailMayExtendBelowViewport:true};
}

function player(b:ArchitectureBuilder,view:string){
 const near=makeCommunityAssembly(b.p,'CHAR-001','m059-retained-npc-source','原NPC共同身体与外观'),sourceInstances=near.instances.map(i=>({...i,geometrySHA256:outfitHash(geometryData(b.p.assets[i.assetId]))}));
 for(const dep of near.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add('CHAR-001');
 if(view==='observer')for(const i of near.instances)b.place(i.assetId,i.position,i.rotation,'shared-npc-body',i.name);
 const hands=view==='observer'?{}:firstPerson(b,view.endsWith('grip')?'grip':'open',true);
 return{...hands,view,groundY:view==='observer'?0:null,sharedBodyCatalogId:'CHAR-001',retainedNPCAssembly:near,sourceInstances,bodyIdentityUnchanged:true,visibilityStrategy:view==='observer'?'Full actual NPC body, clothing and hair are visible.':'Only the shared-appearance view hands are installed. Full NPC definition and sources are retained but not drawn in this view; do not draw its head or duplicate hands.',runtimeCameraSwitch:false,thirdPersonGameplay:false};
}

function pets(b:ArchitectureBuilder,wear:string,contacts:LivingContact[]){
 const rows:any[]=[];
 for(const[species,id,x]of[['cat','CHAR-306',-.8],['dog','CHAR-307',0],['rabbit','CHAR-308',.8]]as const){
  const animalId=b.original(id),animal=b.p.assets[animalId],bodyY=-assetBoundsM(animal)!.min[1],kind=wear==='harnesses'&&species!=='rabbit'?'harness':'collar',form=species==='rabbit'?'cat':species,accessoryId=b.original(kind==='collar'?'CHAR-328':'CHAR-330',kind==='collar'?{collarFit:form}:{harnessFit:form}),offset:V3=species==='rabbit'?[0,.011,.046]:[0,0,0],fit=fittedAnimalWear(b.p,b.p.assets[accessoryId],animal,kind,offset),key='m059-'+species+'-'+kind;
  const fitted=b.asset(key,aid=>({...fit.asset,id:aid,source:{kind:'assembly-derived-component',baseCatalogIds:[id,kind==='collar'?'CHAR-328':'CHAR-330'],notCatalogMaster:true,sourceAssetId:accessoryId,sourceGeometrySHA256:outfitHash(geometryData(b.p.assets[accessoryId])),originalRetained:true,retainedAuthorSource:fit.asset.source}})),bodyInstance=b.place(animalId,[x,bodyY,0],0,'animal'),wearInstance=b.place(fitted,[x+offset[0],bodyY+offset[1],offset[2]],0,'animal-wear');
  for(const c of fit.contacts)contacts.push({kind:'actual-'+species+'-'+kind+'-liner',point:[c.point[0]+x,c.point[1]+bodyY,c.point[2]],left:[bodyInstance],right:[wearInstance],rightMeshes:[c.mesh]});
  rows.push({species,bodyInstance,sourceBody:animalId,wearInstance,sourceWear:accessoryId,kind,bodyGroundY:0,offset,sourceBodyGeometrySHA256:outfitHash(geometryData(animal)),sourceBodyParameters:animal.source!.parameters});
 }
 return{wear,animals:rows,groundY:0,pose:'original finite static species poses',tagInstalled:false,tagReason:'No identity or ownership data supplied; no standalone329 tag is added. Actual328 buckle and hanging loop remain intact.',rabbitHarness:false,rabbitNote:'Rabbit uses an explicit fitted328 cat-source collar in both groups; no public rabbit330 harness claimed.',entityOwnershipBound:false};
}

function animals(b:ArchitectureBuilder,id:string,form:string){
 const ids=id==='CHAR-333'?(form==='farmyard'?['CHAR-315','CHAR-313','CHAR-310']:['CHAR-314','CHAR-311','CHAR-312']):(form==='forest-bank'?['CHAR-316','CHAR-317','CHAR-320']:['CHAR-321','CHAR-309']),rows:any[]=[];let x=0;
 for(const catalogId of ids){const aid=b.original(catalogId),a=b.p.assets[aid],bounds=assetBoundsM(a)!,aquatic=form==='stream',position:V3=[x-bounds.min[0],aquatic?-.35-(bounds.min[1]+bounds.max[1])/2:-bounds.min[1],0],instance=b.place(aid,position,0,aquatic?'water-column-animal':'ground-animal');x+=bounds.max[0]-bounds.min[0]+.35;rows.push({catalogId,assetId:aid,instance,position,speciesParameters:a.source!.parameters,geometrySHA256:outfitHash(geometryData(a)),medium:aquatic?'water-column-placement-only':'ground-plane',groundY:aquatic?null:0,age:'author source morphology, no age-state binding',health:'unspecified; no health inferred'});}
 const centre=x/2-.175;for(const i of b.instances)i.position[0]-=centre;for(const r of rows)r.position=b.instances.find(i=>i.id===r.instance)!.position;
 return{group:form,animals:rows,groundY:form==='stream'?null:0,medium:form==='stream'?'declared water column, no liquid or buoyancy simulation':'separate ground placements',speciesCoexistenceClaim:false,sourceMorphologyUnchanged:true,ageHealthProductionBound:false,ecologyBound:false,automaticDistanceLOD:false,scope:'Explicit static display grouping of real species sources. No juvenile made by shrinking adults, no new body master, herd controller, shared ecosystem, production chain or ownership state.'};
}

export function makeLivingAssembly(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const schema=livingParameters(catalogId),parameters={...Object.fromEntries(Object.entries(schema).map(([k,d])=>[k,d.default])),...input};
 for(const[k,v]of Object.entries(parameters))if(typeof v!=='string'||!schema[k]?.enum.includes(v))throw new Error('未经验证的角色动物组合参数 '+k);
 const b=new ArchitectureBuilder(p,id),contacts:LivingContact[]=[],n=Number(catalogId.slice(5));
 const detail=n===174?patient(b,contacts):n===175?firstPerson(b,String(parameters.handPose)):n===176?player(b,String(parameters.view)):n===332?pets(b,String(parameters.wear),contacts):animals(b,catalogId,String(parameters.group??parameters.habitat));
 return b.finish(catalogId,name,{parameters,living:{...detail,contacts},physical:false,originalBaseline:{characterReadOnly:['Citizen.id','position','state','role','actorProfiles.age','alive'],animalEntityContractProvided:false},runtimeBound:false,inventoryBound:false,softSkin:false,animationClips:false,scope:'M059 character and animal assembly sub-batch. Reuse actual component masters, preserve originals and explicit fits. Finite adultA/rest/species forms; native minimum parts and continuous slopes/curves. Original role, inventory, player camera, animal age/health/ownership and ecology controllers unbound; human art acceptance remains separate.'});
}
