export type CharacterPaletteDefinition={family:'skin'|'coat'|'pants'|'hair'|'role';parent:string;color:string;roles:string[];sourceIndex?:number;sourceCondition?:string};
export const characterPaletteDefinitions:Record<string,CharacterPaletteDefinition>={};
const add=(start:number,colors:string[],family:CharacterPaletteDefinition['family'],parent:string,roles:string[])=>colors.forEach((color,i)=>characterPaletteDefinitions['CHAR-'+String(start+i).padStart(3,'0')]={family,parent,color,roles,sourceIndex:i});
add(30,['#d6b391','#c89e7d','#b98b69','#e4c3a3','#b77d5b'],'skin','CHAR-001',['skinSurface']);
add(35,['#365d5b','#688478','#47617e','#8b6956','#a98563','#b49a72','#6e7680','#78617e'],'coat','CHAR-002',['characterCloth']);
add(43,['#3c4844','#4b505c','#61574e','#40434f'],'pants','CHAR-004',['characterCloth']);
add(47,['#2e302c','#5b4538','#92938d'],'hair','CHAR-010',['hairMass','hairRidge']);
characterPaletteDefinitions['CHAR-049'].sourceCondition='age>=62';
add(50,['#546d85','#69785c','#7b977d','#a87d50'],'role','CHAR-002',['characterCloth']);
['警|police','卫|soldier','师|teacher','商|merchant'].forEach((condition,i)=>characterPaletteDefinitions['CHAR-'+String(50+i).padStart(3,'0')].sourceCondition=condition);
export const characterPaletteIds=Object.keys(characterPaletteDefinitions);
export function characterPaletteParameters(id:string):Record<string,{enum:(string|number)[];default:string|number}>{const d=characterPaletteDefinitions[id];if(!d)throw new Error('未知人物用途配色');return{characterTone:{enum:[id.toLowerCase()],default:id.toLowerCase()},...(d.parent==='CHAR-002'?{garment:{enum:[1,2],default:1}}:{})};}
export function characterPaletteForms(id:string){let rows:Record<string,string|number>[]=[{}];for(const[key,p]of Object.entries(characterPaletteParameters(id)))rows=rows.flatMap(row=>p.enum.map(v=>({...row,[key]:v})));return rows;}
export function characterPaletteSpec(id:string,input:Record<string,string|number>={}){
 const definition=characterPaletteDefinitions[id],allowed=characterPaletteParameters(id),parameters:Record<string,string|number>={};if(Object.keys(input).some(k=>!allowed[k]))throw new Error('人物配色不支持此参数');
 for(const[k,p]of Object.entries(allowed)){const v=input[k]??p.default;if(!p.enum.includes(v))throw new Error('该参考的人物配色参数不匹配');parameters[k]=v;}
 return{catalogId:id,parentCatalogId:definition.parent,parentKind:definition.parent==='CHAR-001'?'assembly'as const:'base'as const,parameters,definition};
}
