export const m059BuildingVariantIds=['BUILT-025','BUILT-026','BUILT-027','BUILT-028','BUILT-029','BUILT-030'];
export const m060BuildingVariantIds=['BUILT-031','BUILT-032','BUILT-033','BUILT-034','BUILT-035','BUILT-036','BUILT-037'];
export const buildingVariantIds=[...m059BuildingVariantIds,...m060BuildingVariantIds];
type Plan={name:string;design:[number,number];floors:number[];height:number;fixed?:boolean;knownSize?:[number,number];parentProgram?:'medical'};
const plans:Record<string,Plan[]>={
 'BUILT-025':[{name:'quarter-1',design:[42,34],floors:[4],height:3.4},{name:'quarter-2',design:[30,26],floors:[8],height:3.4},{name:'quarter-3',design:[36,30],floors:[12],height:3.4},{name:'quarter-4',design:[32,28],floors:[6],height:3.4}],
 'BUILT-026':[{name:'farm',design:[36,26],floors:[1],height:3.6}],
 'BUILT-027':[{name:'bank-street',design:[44,34],floors:[2,3,4],height:3.6},{name:'market-street',design:[34,28],floors:[2,3,4],height:3.6}],
 'BUILT-028':[{name:'workshop',design:[54,42],floors:[3,4,5],height:4.8}],
 'BUILT-029':[{name:'civic',design:[56,42],floors:[6,7,8],height:4.2}],
 'BUILT-030':[{name:'academy',design:[62,46],floors:[5,6],height:3.8}],
 'BUILT-031':[{name:'police',design:[42,34],floors:[5],height:3.8}],
 'BUILT-032':[{name:'bank-other',design:[44,36],floors:[7,8,9],height:4.4},{name:'bank-market',design:[44,36],floors:[12,13,14,15],height:4.4}],
 'BUILT-033':[{name:'medical-h',design:[50,38],floors:[7,8,9],height:3.8,parentProgram:'medical'}],
 'BUILT-034':[{name:'relay',design:[44,32],floors:[3],height:4.2},{name:'core-interchange',design:[60,40],floors:[6],height:4.2,fixed:true}],
 'BUILT-035':[{name:'terminal',design:[120,70],floors:[6],height:6},{name:'known-main-seed',design:[120,70],knownSize:[125.6,70.4],floors:[6],height:6,fixed:true}],
 'BUILT-036':[{name:'interstellar',design:[130,90],floors:[14],height:6.6}],
 'BUILT-037':[{name:'dock',design:[36,22],floors:[2],height:3.8}]
};
export const buildingVariantParents:Record<string,string>={'BUILT-025':'BUILT-019','BUILT-026':'BUILT-019','BUILT-027':'BUILT-020','BUILT-028':'BUILT-021','BUILT-029':'BUILT-022','BUILT-030':'BUILT-022','BUILT-031':'BUILT-022','BUILT-032':'BUILT-023','BUILT-033':'BUILT-023','BUILT-034':'BUILT-024','BUILT-035':'BUILT-024','BUILT-036':'BUILT-024','BUILT-037':'BUILT-024'};
const sizes=(p:Plan)=>p.fixed?['fixed']:['compact','expanded'];
export function buildingVariantParameters(id:string){const p=plans[id];if(!p)throw new Error('未知建筑变体');return{buildingPlan:{enum:p.map(x=>x.name),default:p[0].name},sizeCase:{enum:[...new Set(p.flatMap(sizes))],default:sizes(p[0])[0]},floors:{enum:[...new Set(p.flatMap(x=>x.floors))],default:p[0].floors[0]}};}
export function buildingVariantSpec(id:string,input:Record<string,string|number>={}){
 const ps=plans[id];if(!ps)throw new Error('未知建筑变体');for(const key of Object.keys(input))if(!['buildingPlan','sizeCase','floors'].includes(key))throw new Error('未知建筑变体参数 '+key);
 const plan=ps.find(p=>p.name===(input.buildingPlan??ps[0].name));if(!plan)throw new Error('建筑变体参数未验证');
 const sizeCase=input.sizeCase??sizes(plan)[0];if(!sizes(plan).includes(String(sizeCase)))throw new Error('该建筑分组不支持此尺寸档位');
 const floors=input.floors??plan.floors[0];if(typeof floors!=='number'||!plan.floors.includes(floors))throw new Error('该建筑分组不支持此层数');
 const factor=sizeCase==='fixed'?1:sizeCase==='compact'?.94:1.06,quantize=(n:number)=>Math.round(n*factor/.4)*.4,actual=plan.knownSize??plan.design;
 return{catalogId:id,parentCatalogId:buildingVariantParents[id],parameters:{buildingPlan:plan.name,sizeCase:String(sizeCase),floors},widthM:Number((plan.fixed?actual[0]:quantize(actual[0])).toFixed(8)),depthM:Number((plan.fixed?actual[1]:quantize(actual[1])).toFixed(8)),floors,floorHeightM:plan.height,designSizeM:plan.design,authorSizeFactor:factor,dimensionQuantumM:.4,levelTopsM:Array.from({length:floors},(_,i)=>Number((.2+i*plan.height).toFixed(8))),originalSeedAlgorithmBound:false,originalFloorPlanBound:false,...(plan.parentProgram?{parentProgram:plan.parentProgram}:{}),...(plan.fixed?{fixedDimensions:true,dimensionSource:plan.knownSize?'supplied-main-seed-dimensions-only':'supplied-core-interchange-exception'}:{})};
}
export function buildingVariantForms(id:string){const ps=plans[id];if(!ps)throw new Error('未知建筑变体');return ps.flatMap(p=>sizes(p).flatMap(sizeCase=>p.floors.map(floors=>({buildingPlan:p.name,sizeCase,floors}))));}
