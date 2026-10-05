import type {Project,V3} from '../core/types';
import {assetBoundsM} from '../core/sky';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {outfitBaseScene,outfitRecipes,outfitSourceImporter} from './outfit-components';
import {addOutfitAccessories} from './outfit-accessories';
import {makeDistantResident} from './outfit-distant';

export const outfitAssemblyIds=['CHAR-016',...Object.keys(outfitRecipes).map(n=>'CHAR-'+n)];
export function makeOutfitAssembly(p:Project,catalogId:string,id:string,name:string){
 if(catalogId==='CHAR-016')return makeDistantResident(p,id,name);
 const n=Number(catalogId.slice(5)),base=outfitBaseScene(p,n),accessories=addOutfitAccessories(base),b=new ArchitectureBuilder(p,id),importer=outfitSourceImporter(b,base.p),originX=base.items[0].position[0];
 const minimumY=Math.min(...base.items.map(i=>assetBoundsM(base.p.assets[i.assetId])!.min[1]+i.position[1])),placed=base.items.map(i=>({sourceInstance:i.id,sourceAsset:i.assetId,assetId:importer.keep(i.assetId),position:[i.position[0]-originX,i.position[1]-minimumY,i.position[2]]as V3,rotation:i.rotation}));
 const instances=placed.map(i=>({...i,instance:b.place(i.assetId,i.position,i.rotation,'wearer')}));
 const omitted=base.omitted.map(i=>({sourceInstance:i.id,originalBodyAssetId:importer.keep(String(base.p.assets[i.assetId].source!.sourceAssetId)),reason:'Original body and slot retained; redundant neck and replaced solid trousers leave no installed visible body here.'}));
 return b.finish(catalogId,name,{outfit:{bodyFit:base.fit,pose:'standing',clothing:'CHAR-'+base.recipe.clothing,accessory:'CHAR-'+base.recipe.accessory,sourceScene:base.sourceScene,sourceSelection:base.sourceSelection,sourceGraph:importer.sources,instances,accessories,omitted,groundY:0,groundShiftY:-minimumY,sharedGeometryFamily:[158,159,160].includes(n)?'CHAR137 plus CHAR150 compact clip badge':null,sourceRoleContractOnly:true},parameters:{},physical:false,originalBaseline:{describeCitizenIntegratedCoarse:true,readOnly:['Citizen.id','position','state','role','actorProfiles.age','alive']},ageSeedRoleBinding:false,softCloth:false,animationClips:false,scope:'One finite adultA standing author outfit assembled from original bodies, clothing and accessories. Whole-source geometry and actual rigid rigs retained. Explicit fitting derivatives, no new human base master. 158/159/160 intentionally share their declared137+150 geometry family; no invented uniforms or identity claims. Original wages, permissions, inventory, identity and quality-distance logic remain unbound.'});
}
