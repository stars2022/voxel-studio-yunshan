import {buildingVariantIds,buildingVariantForms,buildingVariantParameters,buildingVariantSpec} from './building-variant-spec';
import {roofWallVariantIds,roofWallVariantForms,roofWallVariantParameters,roofWallVariantSpec} from './roof-wall-variant-spec';
export const catalogVariantIds=[...buildingVariantIds,...roofWallVariantIds];
export const catalogVariantForms=(id:string):Record<string,string|number>[]=>buildingVariantIds.includes(id)?buildingVariantForms(id):roofWallVariantForms(id);
export const catalogVariantParameters=(id:string):Record<string,{enum:(string|number)[];default:string|number}>=>buildingVariantIds.includes(id)?buildingVariantParameters(id):roofWallVariantParameters(id);
export const catalogVariantSpec=(id:string,input:Record<string,string|number>={})=>buildingVariantIds.includes(id)?{...buildingVariantSpec(id,input),parentKind:'assembly'as const}:roofWallVariantSpec(id,input);
export function catalogVariantParameterSchema(){
 const values:Record<string,(string|number)[]>={};for(const id of catalogVariantIds)for(const[key,p]of Object.entries(catalogVariantParameters(id)))values[key]=[...new Set([...(values[key]??[]),...p.enum])];
 return Object.fromEntries(Object.entries(values).map(([key,choices])=>[key,{enum:choices,...(choices.every(v=>typeof v==='number')?{type:'integer'}:{})}]));
}
