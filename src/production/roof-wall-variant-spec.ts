export const roofWallVariantIds=['BUILT-038','BUILT-039','BUILT-041','BUILT-082','BUILT-083'];
export const wallToneNames=['clinic','bank','workshop','school','fallback1','fallback2','fallback3','fallback4']as const;
type Definition={parentCatalogId:string;parentKind:'base'|'assembly';key:string;values:string[]};
const definitions:Record<string,Definition>={
 'BUILT-038':{parentCatalogId:'BUILT-011',parentKind:'base',key:'gableAxis',values:['x']},
 'BUILT-039':{parentCatalogId:'BUILT-011',parentKind:'base',key:'gableAxis',values:['z']},
 'BUILT-041':{parentCatalogId:'BUILT-004',parentKind:'base',key:'wallTone',values:[...wallToneNames]},
 'BUILT-082':{parentCatalogId:'BUILT-075',parentKind:'assembly',key:'roofSampling',values:['far1','far2']},
 'BUILT-083':{parentCatalogId:'BUILT-075',parentKind:'assembly',key:'upperFootprint',values:['compact','expanded']}
};
export function roofWallVariantParameters(id:string){const d=definitions[id];if(!d)throw new Error('未知屋顶或墙面变体');return{[d.key]:{enum:[...d.values],default:d.values[0]}};}
export function roofWallVariantForms(id:string){const d=definitions[id];if(!d)throw new Error('未知屋顶或墙面变体');return d.values.map(v=>({[d.key]:v}));}
export function roofWallVariantSpec(id:string,input:Record<string,string|number>={}){
 const d=definitions[id];if(!d)throw new Error('未知屋顶或墙面变体');if(Object.keys(input).some(k=>k!==d.key))throw new Error('该变体不支持此参数');
 const value=input[d.key]??d.values[0];if(typeof value!=='string'||!d.values.includes(value))throw new Error('屋顶或墙面变体参数未验证');
 return{catalogId:id,parentCatalogId:d.parentCatalogId,parentKind:d.parentKind,parameters:{[d.key]:value}};
}
