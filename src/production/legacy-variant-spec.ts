export const legacyVariantIds=['BUILT-084','BUILT-085','BUILT-170','BUILT-171','BUILT-172','BUILT-173','BUILT-174','BUILT-175','BUILT-176','BUILT-182'];
export const legacyWallColors={workshop:'#a5b1ad',bank:'#c7bcaa',police:'#aebccc',clinic:'#d6e1da',school:'#d6c7ad',civic:'#c5b9a7',transport:'#b2c3c4',generic1:'#c7c3b6',generic2:'#aabcb3',generic3:'#c9b9ae',generic4:'#b6c0cb'};
export const legacyRoofColors={blueGreyA:'#526777',blueGreyB:'#627c83'};
export const legacyVehicleKinds=['road','maglev','lightRail','cable','lift','ferry','flight']as const;
export type LegacyVehicleKind=typeof legacyVehicleKinds[number];
export function legacyVariantParameters(id:string):Record<string,{enum:string[];default:string}>{
 if(!legacyVariantIds.includes(id))throw new Error('未知旧屋顶/用途/交通变体');
 if(id==='BUILT-084')return{roofProgram:{enum:['farm','home-narrow','home-wide'],default:'farm'},roofTone:{enum:Object.keys(legacyRoofColors),default:'blueGreyA'}};
 if(id==='BUILT-085')return{legacyWallTone:{enum:Object.keys(legacyWallColors),default:'workshop'}};
 if(id==='BUILT-182')return{padSize:{enum:['military-14m'],default:'military-14m'}};
 const kind=legacyVehicleKinds[Number(id.slice(-3))-170];return{vehicleKind:{enum:[kind],default:kind}};
}
export function legacyVariantForms(id:string){let forms:Record<string,string>[]=[{}];for(const[key,p]of Object.entries(legacyVariantParameters(id)))forms=forms.flatMap(f=>p.enum.map(v=>({...f,[key]:v})));return forms;}
export function legacyVariantSpec(id:string,input:Record<string,string|number>={}){
 const allowed=legacyVariantParameters(id),parameters:Record<string,string>={};if(Object.keys(input).some(k=>!allowed[k]))throw new Error('该旧资产变体不支持此参数');
 for(const[key,p]of Object.entries(allowed)){const v=input[key]??p.default;if(typeof v!=='string'||!p.enum.includes(v))throw new Error('旧资产变体参数未验证');parameters[key]=v;}
 return{catalogId:id,parentCatalogId:id==='BUILT-084'?'BUILT-076':id==='BUILT-085'?'BUILT-058':id==='BUILT-182'?'BUILT-181':'BUILT-169',parentKind:id==='BUILT-085'?'base'as const:'assembly'as const,parameters};
}
export function legacyRoofPlan(program:string){
 if(!['farm','home-narrow','home-wide'].includes(program))throw new Error('未知住宅屋顶程序');
 const width=program==='farm'?12.8:program==='home-narrow'?32:38.4,depth=program==='farm'?6.4:12.8;
 return{program,width,depth,ridges:program==='home-wide'?2:1,sourceThresholdM:35,dimensionsAuthored:true,ridgeAxis:'x'};
}
