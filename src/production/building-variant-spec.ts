export const buildingVariantIds=['BUILT-025','BUILT-026','BUILT-027','BUILT-028','BUILT-029','BUILT-030'];
type Plan={name:string;design:[number,number];floors:number[];height:number};
const plans:Record<string,Plan[]>={
 'BUILT-025':[{name:'quarter-1',design:[42,34],floors:[4],height:3.4},{name:'quarter-2',design:[30,26],floors:[8],height:3.4},{name:'quarter-3',design:[36,30],floors:[12],height:3.4},{name:'quarter-4',design:[32,28],floors:[6],height:3.4}],
 'BUILT-026':[{name:'farm',design:[36,26],floors:[1],height:3.6}],
 'BUILT-027':[{name:'bank-street',design:[44,34],floors:[2,3,4],height:3.6},{name:'market-street',design:[34,28],floors:[2,3,4],height:3.6}],
 'BUILT-028':[{name:'workshop',design:[54,42],floors:[3,4,5],height:4.8}],
 'BUILT-029':[{name:'civic',design:[56,42],floors:[6,7,8],height:4.2}],
 'BUILT-030':[{name:'academy',design:[62,46],floors:[5,6],height:3.8}]
};
export const buildingVariantParents:Record<string,string>={'BUILT-025':'BUILT-019','BUILT-026':'BUILT-019','BUILT-027':'BUILT-020','BUILT-028':'BUILT-021','BUILT-029':'BUILT-022','BUILT-030':'BUILT-022'};
export function buildingVariantParameters(id:string){const p=plans[id];if(!p)throw new Error('未知建筑变体');return{buildingPlan:{enum:p.map(x=>x.name),default:p[0].name},sizeCase:{enum:['compact','expanded'],default:'compact'},floors:{enum:[...new Set(p.flatMap(x=>x.floors))],default:p[0].floors[0]}};}
export function buildingVariantSpec(id:string,input:Record<string,string|number>={}){
 const ps=plans[id];if(!ps)throw new Error('未知建筑变体');for(const key of Object.keys(input))if(!['buildingPlan','sizeCase','floors'].includes(key))throw new Error('未知建筑变体参数 '+key);
 const plan=ps.find(p=>p.name===(input.buildingPlan??ps[0].name)),sizeCase=input.sizeCase??'compact';if(!plan||!['compact','expanded'].includes(String(sizeCase)))throw new Error('建筑变体参数未验证');
 const floors=input.floors??plan.floors[0];if(typeof floors!=='number'||!plan.floors.includes(floors))throw new Error('该建筑分组不支持此层数');
 const factor=sizeCase==='compact'?.94:1.06,quantize=(n:number)=>Math.round(n*factor/.4)*.4;
 return{catalogId:id,parentCatalogId:buildingVariantParents[id],parameters:{buildingPlan:plan.name,sizeCase:String(sizeCase),floors},widthM:Number(quantize(plan.design[0]).toFixed(8)),depthM:Number(quantize(plan.design[1]).toFixed(8)),floors,floorHeightM:plan.height,designSizeM:plan.design,authorSizeFactor:factor,dimensionQuantumM:.4,levelTopsM:Array.from({length:floors},(_,i)=>Number((.2+i*plan.height).toFixed(8))),originalSeedAlgorithmBound:false,originalFloorPlanBound:false};
}
export function buildingVariantForms(id:string){return plans[id].flatMap(p=>['compact','expanded'].flatMap(sizeCase=>p.floors.map(floors=>({buildingPlan:p.name,sizeCase,floors}))));}
