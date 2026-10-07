export const faceVariantIds=['CHAR-024','CHAR-025','CHAR-026','CHAR-027','CHAR-028','CHAR-029'];
export function faceVariantParameters(id:string):Record<string,{enum:(string|number)[];default:string|number}>{const tile=faceVariantIds.indexOf(id);if(tile<0)throw new Error('未知面孔图谱格');return{faceCell:{enum:[tile],default:tile}};}
export function faceVariantForms(id:string){return[{faceCell:faceVariantParameters(id).faceCell.default}];}
export function faceVariantSpec(id:string,input:Record<string,string|number>={}){
 const allowed=faceVariantParameters(id),tile=allowed.faceCell.default as number;if(Object.keys(input).some(k=>k!=='faceCell')||(input.faceCell!==undefined&&input.faceCell!==tile))throw new Error('面孔参考只允许自己的图谱格');
 const age=['adult','elder','child'][tile%3],head=age==='adult'?'CHAR-066':age==='elder'?'CHAR-069':'CHAR-068',headParameters:Record<string,string>=age==='child'?{headStage:'school'}:{};
 return{catalogId:id,parentCatalogId:'CHAR-023',parentKind:'material'as const,parameters:{faceCell:tile},definition:{tile,age,head,headParameters,height:age==='child'?.215:.24,stressed:tile>=3}};
}
