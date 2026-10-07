import type {Project} from '../core/types';
import {buildingVariantIds} from './building-variant-spec';
import {makeBuildingVariant} from './building-variants';
import {makeRoofWallVariant} from './roof-wall-variants';

export function makeCatalogVariant(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 return buildingVariantIds.includes(catalogId)?makeBuildingVariant(p,catalogId,id,name,params):makeRoofWallVariant(p,catalogId,id,name,params);
}
