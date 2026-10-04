import {ecologyRecipes,makeEcologyAsset} from './atlas-ecology';
import {hydrologyRecipes,makeHydrologyAsset} from './atlas-hydrology';
import {environmentRecipes,makeEnvironmentAsset} from './atlas-terrain';
import {makeLifeAsset} from './life';
import {atlasLifeRecipes} from './atlas-life';
import {atlasBuiltRecipes,makeAtlasBuiltAsset} from './atlas-built';

/** Dispatch by complete catalog ID; BUILT-003 must never alias LIFE-003. */
export function atlasRecipe(catalogId:string){
 if(/^LIFE-\d{3}$/.test(catalogId))return atlasLifeRecipes[Number(catalogId.slice(5))];
 if(/^ENV-\d{3}$/.test(catalogId))return environmentRecipes[catalogId]??hydrologyRecipes[catalogId]??ecologyRecipes[catalogId];
 return atlasBuiltRecipes[catalogId];
}
export function makeCatalogAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Record<string,number|string>={}){
 if(/^LIFE-\d{3}$/.test(catalogId)){if(Object.values(params).some(v=>typeof v!=='number'))throw new Error('生活资产仅支持已验证的数值参数');return makeLifeAsset(catalogId,name,id,style,params as Record<string,number>);}
 if(/^BUILT-\d{3}$/.test(catalogId))return makeAtlasBuiltAsset(catalogId,name,id,style,params);
 if(ecologyRecipes[catalogId])return makeEcologyAsset(catalogId,name,id,style,params);
 if(hydrologyRecipes[catalogId])return makeHydrologyAsset(catalogId,name,id,style,params);
 if(/^ENV-\d{3}$/.test(catalogId))return makeEnvironmentAsset(catalogId,name,id,style,params);
 throw new Error('无效或未实现的清单资产域');
}
