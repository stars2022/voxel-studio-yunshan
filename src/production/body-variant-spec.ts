export const bodyVariantIds=Array.from({length:9},(_,i)=>'CHAR-'+String(76+i).padStart(3,'0'));
export const growthHeads:Record<string,{catalogId:string;parameters:Record<string,string>;height:number;tile:number;range:number[]}>= {
 infant:{catalogId:'CHAR-067',parameters:{headStage:'infant'},height:.19,tile:2,range:[0,2]},
 toddler:{catalogId:'CHAR-067',parameters:{headStage:'toddler'},height:.205,tile:2,range:[2,4]},
 preschool:{catalogId:'CHAR-068',parameters:{headStage:'preschool'},height:.205,tile:2,range:[4,6]},
 school:{catalogId:'CHAR-068',parameters:{headStage:'school'},height:.215,tile:2,range:[6,12]},
 teen:{catalogId:'CHAR-068',parameters:{headStage:'teen'},height:.23,tile:2,range:[12,18]},
 adult:{catalogId:'CHAR-066',parameters:{},height:.24,tile:0,range:[18,62]},
 elder:{catalogId:'CHAR-069',parameters:{},height:.24,tile:1,range:[62,140]}
};
export const skinToneColors=['#d6b391','#c89e7d','#b98b69','#e4c3a3','#b77d5b'];
const forms=['thin','full','short','tall','stoop','frail'];
export function bodyVariantParameters(id:string):Record<string,{enum:(string|number)[];default:string|number}>{
 const n=Number(id.slice(-3));if(!bodyVariantIds.includes(id))throw new Error('未知体型参数变体');
 if(n<=81)return{bodyShape:{enum:[forms[n-76]],default:forms[n-76]}};
 if(n===82)return{abdomenFit:{enum:['adultA','adultB'],default:'adultA'},pregnancyStage:{enum:['early','middle','late'],default:'middle'}};
 if(n===83)return{growthBand:{enum:Object.keys(growthHeads),default:'adult'}};
 return{skinTone:{enum:[0,1,2,3,4],default:0}};
}
export function bodyVariantForms(id:string){return Object.entries(bodyVariantParameters(id)).reduce<Record<string,string|number>[]>((rows,[key,p])=>rows.flatMap(row=>[p.default,...p.enum.filter(v=>v!==p.default)].map(v=>({...row,[key]:v}))),[{}]);}
export function bodyVariantSpec(id:string,input:Record<string,string|number>={}){
 const allowed=bodyVariantParameters(id);if(Object.entries(input).some(([key,value])=>!allowed[key]?.enum.includes(value)))throw new Error('此体型参考不支持该参数');
 const parameters={...Object.fromEntries(Object.entries(allowed).map(([k,v])=>[k,v.default])),...input},n=Number(id.slice(-3)),parentCatalogId=n===77?'CHAR-060':n===80?'CHAR-065':n===82?'CHAR-072':n>=83?'CHAR-066':'CHAR-059';
 return{catalogId:id,parentCatalogId,parentKind:'base'as const,parameters,family:n<=81?'body':n===82?'pregnancy':n===83?'growth':'skin'};
}
