export const finalVariantIds=['ENV-007','ENV-018','ENV-033','ENV-051','ENV-058','ENV-075','ENV-083','LIFE-033','LIFE-034','LIFE-035','LIFE-036'];
const parents:Record<string,string>={'ENV-007':'ENV-006','ENV-018':'ENV-015','ENV-033':'ENV-028','ENV-051':'ENV-050','ENV-058':'ENV-057','ENV-075':'ENV-061','ENV-083':'ENV-082','LIFE-033':'LIFE-016','LIFE-034':'LIFE-014','LIFE-035':'LIFE-001','LIFE-036':'LIFE-010'};
type Choice={enum:(string|number)[];default:string|number};
const choice=(values:(string|number)[],value=values[0]):Choice=>({enum:values,default:value});
export function finalVariantParameters(id:string):Record<string,Choice>{
 switch(id){
  case'ENV-007':return{cliffForm:choice(['concave','convex','end','multiple'])};
  case'ENV-018':return{rockForm:choice(['block','lowWide','split']),rockSize:choice(['large','small']),rockWetness:choice(['dry','wet'])};
  case'ENV-033':return{waterfallForm:choice(['wide','narrow','split']),waterfallFlow:choice(['full','low'])};
  case'ENV-051':return{treeHeight:choice([16,24,31]),treeTone:choice([0,1,2,3,4,5,6,7,8])};
  case'ENV-058':return{treeStage:choice(['young','juvenile'])};
  case'ENV-075':return{vegetationState:choice(['healthy','damaged','recovering'])};
  case'ENV-083':return{wallForm:choice(['straight','concave','convex','stepped','end']),wallHeight:choice([2.4,3.6])};
  case'LIFE-033':case'LIFE-034':case'LIFE-035':case'LIFE-036':return{furnitureSize:choice(['standard','compact','wide']),furnitureFinish:choice(['standard','warm'])};
  default:throw new Error('Unknown final environment/furniture variant');
 }
}
export function finalVariantForms(id:string){return Object.entries(finalVariantParameters(id)).reduce<Record<string,string|number>[]>((rows,[key,d])=>rows.flatMap(row=>d.enum.map(value=>({...row,[key]:value}))),[{}]);}
export function finalVariantSpec(id:string,input:Record<string,string|number>={}){
 const defs=finalVariantParameters(id);if(Object.entries(input).some(([key,v])=>!defs[key]?.enum.includes(v)))throw new Error('Unsupported environment/furniture parameter');
 const parameters={...Object.fromEntries(Object.entries(defs).map(([key,d])=>[key,d.default])),...input};return{catalogId:id,parentCatalogId:parents[id],parentKind:'base'as const,parameters,family:id.startsWith('LIFE-')?'furniture':id};
}
