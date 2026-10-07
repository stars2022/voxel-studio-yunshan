import {buildingVariantIds,buildingVariantForms,buildingVariantParameters,buildingVariantSpec} from './building-variant-spec';
import {roofWallVariantIds,roofWallVariantForms,roofWallVariantParameters,roofWallVariantSpec} from './roof-wall-variant-spec';
import {legacyVariantIds,legacyVariantForms,legacyVariantParameters,legacyVariantSpec} from './legacy-variant-spec';
import {ageVariantIds,ageVariantForms,ageVariantParameters,ageVariantSpec} from './age-variant-spec';
export const catalogVariantIds=[...buildingVariantIds,...roofWallVariantIds,...legacyVariantIds,...ageVariantIds];
export const catalogVariantForms=(id:string):Record<string,string|number>[]=>buildingVariantIds.includes(id)?buildingVariantForms(id):roofWallVariantIds.includes(id)?roofWallVariantForms(id):legacyVariantIds.includes(id)?legacyVariantForms(id):ageVariantForms(id);
export const catalogVariantParameters=(id:string):Record<string,{enum:(string|number)[];default:string|number}>=>buildingVariantIds.includes(id)?buildingVariantParameters(id):roofWallVariantIds.includes(id)?roofWallVariantParameters(id):legacyVariantIds.includes(id)?legacyVariantParameters(id):ageVariantParameters(id);
export const catalogVariantSpec=(id:string,input:Record<string,string|number>={})=>buildingVariantIds.includes(id)?{...buildingVariantSpec(id,input),parentKind:'assembly'as const}:roofWallVariantIds.includes(id)?roofWallVariantSpec(id,input):legacyVariantIds.includes(id)?legacyVariantSpec(id,input):ageVariantSpec(id,input);
export function catalogVariantParameterSchema(){
 const values:Record<string,(string|number)[]>={};for(const id of catalogVariantIds)for(const[key,p]of Object.entries(catalogVariantParameters(id)))values[key]=[...new Set([...(values[key]??[]),...p.enum])];
 return Object.fromEntries(Object.entries(values).map(([key,choices])=>[key,{enum:choices,...(choices.every(v=>typeof v==='number')?{type:'integer'}:{})}]));
}
