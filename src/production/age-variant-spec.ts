export const ageVariantIds=['CHAR-017','CHAR-018'];
export type AgeVariantDefinition={band:string;range:[number,number];heightM:number;body:string;head:string;headParameters:Record<string,string>;headHeightM:number};
const definitions:Record<string,AgeVariantDefinition>={
 'CHAR-017':{band:'infant',range:[0,2],heightM:.6,body:'CHAR-061',head:'CHAR-067',headParameters:{headStage:'infant'},headHeightM:.19},
 'CHAR-018':{band:'preschool',range:[2,6],heightM:1,body:'CHAR-062',head:'CHAR-067',headParameters:{headStage:'toddler'},headHeightM:.205}
};
export function ageVariantParameters(id:string):Record<string,{enum:string[];default:string}>{const d=definitions[id];if(!d)throw new Error('未知年龄身高变体');return{ageBand:{enum:[d.band],default:d.band}};}
export function ageVariantForms(id:string){const p=ageVariantParameters(id);return[{ageBand:p.ageBand.default}];}
export function ageVariantSpec(id:string,input:Record<string,string|number>={}){
 const definition=definitions[id];if(!definition)throw new Error('未知年龄身高变体');if(Object.keys(input).some(k=>k!=='ageBand'))throw new Error('年龄变体不支持此参数');
 if(input.ageBand!==undefined&&input.ageBand!==definition.band)throw new Error('该参考的年龄档不匹配');
 return{catalogId:id,parentCatalogId:'CHAR-001',parentKind:'assembly'as const,parameters:{ageBand:definition.band},definition};
}
