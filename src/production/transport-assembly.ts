import type {Command,V3} from '../core/types';
const produce=(entries:string[][])=>entries.map(([catalogId,id]):Command=>({op:'produceCatalogAsset',catalogId,id}));
export function transportRoadCommands():Command[]{return[
 ...produce([['BUILT-131','road'],['BUILT-132','line'],['BUILT-133','joint'],['BUILT-134','curbs']]),
 {op:'instance',id:'road-1',assetId:'road',position:[0,0,0]},
 {op:'connect',id:'joint-1',assetId:'joint',portId:'bottom',targetInstanceId:'road-1',targetPortId:'joint',rotation:0},
 {op:'connect',id:'line-1',assetId:'line',portId:'bottom',targetInstanceId:'road-1',targetPortId:'line',rotation:0},
 {op:'instance',id:'curbs-1',assetId:'curbs',position:[.05,.5,0]},
];}
export const transportRoadClearances=[{name:'道路双肩之间上部通行体',min:[.46,.7,0] as V3,max:[9.54,3,2] as V3}];
export function transportViaductCommands():Command[]{return[
 ...produce([['BUILT-136','foundation'],['BUILT-137','pier'],['BUILT-138','cap'],['BUILT-140','bed']]),
 {op:'instance',id:'foundation-1',assetId:'foundation',position:[0,0,0]},
 {op:'connect',id:'pier-1',assetId:'pier',portId:'foot',targetInstanceId:'foundation-1',targetPortId:'pier',rotation:0},
 {op:'connect',id:'cap-1',assetId:'cap',portId:'bottom',targetInstanceId:'pier-1',targetPortId:'cap',rotation:0},
 {op:'connect',id:'bed-1',assetId:'bed',portId:'bottom',targetInstanceId:'cap-1',targetPortId:'bed',rotation:0},
];}
export function transportTieCommands():Command[]{return[
 ...produce([['BUILT-136','foundation'],['BUILT-137','pier'],['BUILT-139','tie']]),
 ...[0,9].flatMap((x,i):Command[]=>[
  {op:'instance',id:`foundation-${i}`,assetId:'foundation',position:[x,0,0]},
  {op:'connect',id:`pier-${i}`,assetId:'pier',portId:'foot',targetInstanceId:`foundation-${i}`,targetPortId:'pier',rotation:0},
 ]),
 {op:'instance',id:'tie-1',assetId:'tie',position:[5,18,3.2]},
];}
/** Fixtures exist only to verify installation. They are not catalogued assets or the future BUILT-147 post. */
export function transportFixtureCommands(roles:Record<string,number>):Command[]{return[
 ...produce([['BUILT-116','sign'],['BUILT-135','rail']]),
 {op:'createAsset',id:'wall-fixture',name:'安装试验墙，不计入清单',template:'empty',cellSize:.02},
 {op:'voxels',mode:'fill',assetId:'wall-fixture',region:{min:[0,0,0],max:[150,170,10]},material:roles.structuralConcrete},
 {op:'voxels',mode:'fill',assetId:'wall-fixture',region:{min:[20,45,-10],max:[130,50,0]},material:roles.metal},
 {op:'createAsset',id:'stand-fixture',name:'横杆安装试验托架，不计入清单',template:'empty',cellSize:.02},
 {op:'voxels',mode:'fill',assetId:'stand-fixture',region:{min:[0,0,0],max:[10,50,10]},material:roles.structuralConcrete},
 {op:'instance',id:'wall',assetId:'wall-fixture',position:[0,0,.2]},
 {op:'instance',id:'sign-1',assetId:'sign',position:[.4,1,0]},
 ...[5,8.8,11,14.8].map((x,i):Command=>({op:'instance',id:'stand-'+i,assetId:'stand-fixture',position:[x,0,0]})),
 {op:'instance',id:'rail-a',assetId:'rail',position:[5,1,0]},
 {op:'instance',id:'rail-b',assetId:'rail',position:[11,1,0]},
];}
export const transportFixtureClearances=[{name:'护栏交口2m断口',min:[9,0,-.2] as V3,max:[11,2,.4] as V3}];
