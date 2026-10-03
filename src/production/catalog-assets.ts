import {makeLifeAsset} from './life';
import {atlasLifeRecipes} from './atlas-life';
import {atlasBuiltRecipes,makeAtlasBuiltAsset} from './atlas-built';

/** Dispatch by complete catalog ID; BUILT-003 must never alias LIFE-003. */
export function atlasRecipe(catalogId:string){
 if(/^LIFE-\d{3}$/.test(catalogId))return atlasLifeRecipes[Number(catalogId.slice(5))];
 return atlasBuiltRecipes[catalogId];
}
export function makeCatalogAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Record<string,number>={}){
 if(/^LIFE-\d{3}$/.test(catalogId))return makeLifeAsset(catalogId,name,id,style,params);
 if(/^BUILT-\d{3}$/.test(catalogId))return makeAtlasBuiltAsset(catalogId,name,id,style,params);
 throw new Error('无效或未实现的清单资产域');
}
