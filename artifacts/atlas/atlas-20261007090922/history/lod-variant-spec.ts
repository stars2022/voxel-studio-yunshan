export const lodVariantIds=Array.from({length:8},(_,i)=>'CHAR-'+(357+i));
export const lodSpecies={
 quadruped:{cat:'CHAR-306',dog:'CHAR-307',rabbit:'CHAR-308',pig:'CHAR-313',goat:'CHAR-314',cow:'CHAR-315',deer:'CHAR-316',boar:'CHAR-317',squirrel:'CHAR-318'},
 bird:{smallBird:'CHAR-319',chicken:'CHAR-310',duck:'CHAR-311',goose:'CHAR-312',heron:'CHAR-320'},
 fish:{streamFish:'CHAR-321',ornamentalFish:'CHAR-309'},
 insect:{butterfly:'CHAR-322',bee:'CHAR-323'}
};
export type LodLevel='near'|'middle'|'far';
export function lodVariantParameters(id:string):Record<string,{enum:(string|number)[];default:string|number}>{
 const n=Number(id.slice(-3));if(!lodVariantIds.includes(id))throw new Error('未知LOD参考');
 const levels:LodLevel[]=n<=359?[["near"],["middle"],["far"]][n-357]as LodLevel[]:['near','middle','far'];
 if(n<=360)return{lodLevel:{enum:levels,default:levels[0]}};
 const family=(['quadruped','bird','fish','insect']as const)[n-361],species=Object.keys(lodSpecies[family]);return{lodSpecies:{enum:species,default:species[0]},lodLevel:{enum:levels,default:'near'}};
}
export function lodVariantForms(id:string){return Object.entries(lodVariantParameters(id)).reduce<Record<string,string|number>[]>((rows,[key,p])=>rows.flatMap(r=>p.enum.map(v=>({...r,[key]:v}))),[{}]);}
export function lodVariantSpec(id:string,input:Record<string,string|number>={}){
 const allowed=lodVariantParameters(id);if(Object.entries(input).some(([key,value])=>!allowed[key]?.enum.includes(value)))throw new Error('此LOD参考不支持该参数');
 const parameters={...Object.fromEntries(Object.entries(allowed).map(([k,v])=>[k,v.default])),...input},n=Number(id.slice(-3)),family=n<=359?'human':n===360?'child':(['quadruped','bird','fish','insect']as const)[n-361],parentCatalogId=n<=359?'CHAR-059':n===360?'CHAR-063':(['CHAR-306','CHAR-319','CHAR-321','CHAR-322'])[n-361],sourceCatalogId=n<=359?'CHAR-001':n===360?'CHAR-165':(lodSpecies[family as keyof typeof lodSpecies]as Record<string,string>)[String(parameters.lodSpecies)];
 return{catalogId:id,parentCatalogId,parentKind:'base'as const,parameters,family,sourceCatalogId,level:parameters.lodLevel as LodLevel};
}
