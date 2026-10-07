import {makeReferenceRefinement,referenceRefinementIds} from './reference-refinement';
import {wildlifeRecipes,makeWildlifeAsset} from './atlas-wildlife';
import {faunaRecipes,makeFaunaAsset} from './atlas-fauna';
import {careRecipes,makeCareAsset} from './atlas-care';
import {serviceRecipes,makeServiceAsset} from './atlas-service';
import {heldRecipes,makeHeldAsset} from './atlas-held';
import {attireRecipes,makeAttireAsset} from './atlas-attire';
import {costumeRecipes,makeCostumeAsset} from './atlas-costumes';
import {garmentRecipes,makeGarmentAsset} from './atlas-garments';
import {wearableRecipes,makeWearableAsset} from './atlas-wearables';
import {headwearRecipes,makeHeadwearAsset} from './atlas-headwear';
import {avatarRecipes,makeAvatarAsset} from './atlas-avatar';
import {figureRecipes,makeFigureAsset} from './atlas-figure';
import {characterRecipes,makeCharacterAsset} from './atlas-character';
import {landscapeRecipes,makeLandscapeAsset} from './atlas-landscape';
import {groundscapeRecipes,makeGroundscapeAsset} from './atlas-groundscape';
import {ecologyRecipes,makeEcologyAsset} from './atlas-ecology';
import {hydrologyRecipes,makeHydrologyAsset} from './atlas-hydrology';
import {environmentRecipes,makeEnvironmentAsset} from './atlas-terrain';
import {makeLifeAsset} from './life';
import {atlasLifeRecipes} from './atlas-life';
import {atlasBuiltRecipes,makeAtlasBuiltAsset} from './atlas-built';
import {makeSharedWall,nonReferenceBaseRecipes} from './shared-wall';
import type {Project} from '../core/types';

/** Dispatch by complete catalog ID; BUILT-003 must never alias LIFE-003. */
export function atlasRecipe(catalogId:string){
 if(catalogId==='BUILT-004')return nonReferenceBaseRecipes[catalogId];
 if(wildlifeRecipes[catalogId])return wildlifeRecipes[catalogId];
 if(faunaRecipes[catalogId])return faunaRecipes[catalogId];
 if(careRecipes[catalogId])return careRecipes[catalogId];
 if(serviceRecipes[catalogId])return serviceRecipes[catalogId];
 if(heldRecipes[catalogId])return heldRecipes[catalogId];
 if(attireRecipes[catalogId])return attireRecipes[catalogId];
 if(costumeRecipes[catalogId])return costumeRecipes[catalogId];
 if(garmentRecipes[catalogId])return garmentRecipes[catalogId];
 if(wearableRecipes[catalogId])return wearableRecipes[catalogId];
 if(headwearRecipes[catalogId])return headwearRecipes[catalogId];
 if(avatarRecipes[catalogId])return avatarRecipes[catalogId];
 if(figureRecipes[catalogId])return figureRecipes[catalogId];
 if(characterRecipes[catalogId])return characterRecipes[catalogId];
 if(/^LIFE-\d{3}$/.test(catalogId))return atlasLifeRecipes[Number(catalogId.slice(5))];
 if(/^ENV-\d{3}$/.test(catalogId))return environmentRecipes[catalogId]??hydrologyRecipes[catalogId]??ecologyRecipes[catalogId]??groundscapeRecipes[catalogId]??landscapeRecipes[catalogId];
 return atlasBuiltRecipes[catalogId];
}
export function makeCatalogAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Record<string,number|string>={},context?:Project){
 if(params.refinement!==undefined){
  const {refinement,...rest}=params;
  if(!referenceRefinementIds.includes(catalogId)||Object.keys(rest).length||!['baseline','reference-v1'].includes(String(refinement)))throw new Error('未验证的精修资产或参数组合');
  if(refinement==='baseline')return makeLifeAsset(catalogId,name,id,style);
  if(!context)throw new Error('精修需要实际项目材质映射');
  return makeReferenceRefinement(catalogId,name,id,style,context);
 }
 if(catalogId==='BUILT-004')return makeSharedWall(name,id,style,params,context);
 if(wildlifeRecipes[catalogId])return makeWildlifeAsset(catalogId,name,id,style,params);
 if(faunaRecipes[catalogId])return makeFaunaAsset(catalogId,name,id,style,params);
 if(careRecipes[catalogId])return makeCareAsset(catalogId,name,id,style,params);
 if(serviceRecipes[catalogId])return makeServiceAsset(catalogId,name,id,style,params);
 if(heldRecipes[catalogId])return makeHeldAsset(catalogId,name,id,style,params);
 if(attireRecipes[catalogId])return makeAttireAsset(catalogId,name,id,style,params);
 if(costumeRecipes[catalogId])return makeCostumeAsset(catalogId,name,id,style,params);
 if(garmentRecipes[catalogId])return makeGarmentAsset(catalogId,name,id,style,params);
 if(wearableRecipes[catalogId])return makeWearableAsset(catalogId,name,id,style,params);
 if(headwearRecipes[catalogId])return makeHeadwearAsset(catalogId,name,id,style,params);
 if(avatarRecipes[catalogId])return makeAvatarAsset(catalogId,name,id,style,params);
 if(figureRecipes[catalogId])return makeFigureAsset(catalogId,name,id,style,params);
 if(characterRecipes[catalogId])return makeCharacterAsset(catalogId,name,id,style,params);
 if(/^LIFE-\d{3}$/.test(catalogId)){if(Object.values(params).some(v=>typeof v!=='number'))throw new Error('生活资产仅支持已验证的数值参数');return makeLifeAsset(catalogId,name,id,style,params as Record<string,number>);}
 if(/^BUILT-\d{3}$/.test(catalogId))return makeAtlasBuiltAsset(catalogId,name,id,style,params);
 if(landscapeRecipes[catalogId])return makeLandscapeAsset(catalogId,name,id,style,params);
 if(groundscapeRecipes[catalogId])return makeGroundscapeAsset(catalogId,name,id,style,params);
 if(ecologyRecipes[catalogId])return makeEcologyAsset(catalogId,name,id,style,params);
 if(hydrologyRecipes[catalogId])return makeHydrologyAsset(catalogId,name,id,style,params);
 if(/^ENV-\d{3}$/.test(catalogId))return makeEnvironmentAsset(catalogId,name,id,style,params);
 throw new Error('无效或未实现的清单资产域');
}
