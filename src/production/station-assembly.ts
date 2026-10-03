import type {Command,V3} from '../core/types';
const produce=(rows:string[][])=>rows.map(([catalogId,id]):Command=>({op:'produceCatalogAsset',catalogId,id}));
export function stationPlatformCommands():Command[]{return[
 ...produce([['BUILT-154','platform'],['BUILT-155','canopy'],['BUILT-156','signal']]),
 {op:'instance',id:'platform-1',assetId:'platform',position:[0,0,0]},
 {op:'connect',id:'canopy-1',assetId:'canopy',portId:'left',targetInstanceId:'platform-1',targetPortId:'canopy-left',rotation:0},
 // Station node at the platform centre: (11,0,9); signal anchor is node+(12,0,11).
 {op:'instance',id:'signal-1',assetId:'signal',position:[22.5,0,19.5]},
];}
export const stationPlatformClearances=[{name:'站台中央乘客通道',min:[2,1,.3] as V3,max:[20,6.1,17.7] as V3}];
export function stationBridgeCommands(roles:Record<string,number>):Command[]{return[
 ...produce([['BUILT-153','abutment'],['BUILT-146','deck']]),
 {op:'instance',id:'abutment-1',assetId:'abutment',position:[0,0,0]},
 {op:'connect',id:'deck-1',assetId:'deck',portId:'front',targetInstanceId:'abutment-1',targetPortId:'bridge',rotation:0},
 {op:'createAsset',id:'test-support',name:'桥面末端试验托架（辅助）',template:'empty',cellSize:.1},
 {op:'voxels',assetId:'test-support',mode:'fill',region:{min:[0,0,0],max:[20,25,20]},material:roles.structuralConcrete},
 {op:'instance',id:'test-support-1',assetId:'test-support',position:[5,0,16]},
];}
export const stationBridgeClearances=[{name:'接岸桥面通行空间',min:[3,3,6] as V3,max:[9,6.8,18] as V3}];
export function stationVehicleCommands():Command[]{return[
 ...produce([['BUILT-177','body'],['BUILT-178','glazing'],['BUILT-179','trim']]),
 {op:'instance',id:'trim-1',assetId:'trim',position:[-.125,0,.75]},
 {op:'instance',id:'body-1',assetId:'body',position:[0,.2,0]},
 {op:'instance',id:'glazing-1',assetId:'glazing',position:[0,1.4,0]},
];}
export const stationVehicleClearances=[{name:'轨道舱内部乘客空间',min:[.3,.45,.3] as V3,max:[2.7,3.2,9.7] as V3},{name:'真实侧门通道',min:[2.85,.45,4] as V3,max:[3.5,3.2,5.8] as V3}];
export const runwayStationCenters=Array.from({length:12},(_,i)=>750+i*80);
export function stationRunwayCommands():Command[]{return[
 ...produce([['BUILT-158','runway'],['BUILT-159','mark'],['BUILT-160','light']]),
 // Preserve the coarse 0.5m grid and represent the world's 0.1m Y phase explicitly.
 // All instances retain their own-grid placement contract; the common grid is 0.05m.
 {op:'metadata',assetId:'runway',origin:[0,.1,0]},
 {op:'instance',id:'runway-1',assetId:'runway',position:[710,13,-22]},
 ...runwayStationCenters.flatMap((x,i):Command[]=>[
  {op:'instance',id:'mark-'+i,assetId:'mark',position:[x-3,14.6,-.5]},
  ...[-16.5,16.5].map((z,j):Command=>({op:'instance',id:`light-${i}-${j}`,assetId:'light',position:[x-.45,14.6,z-.45]})),
 ]),
];}
export const stationRunwayClearances=[{name:'跑道上方3m净空',min:[710,14.9,-22] as V3,max:[1670,17.9,22] as V3}];
export const stationRunwayUnsupported=['runway-1']; // Terrain was not supplied; record this, do not invent it.
export function stationSignsCommands():Command[]{return[
 ...produce([['BUILT-157','junction'],['BUILT-183','pad-sign']]),
 {op:'instance',id:'junction-1',assetId:'junction',position:[1.8,0,3.5]},
 {op:'instance',id:'pad-sign-1',assetId:'pad-sign',position:[9.1,0,3.7]},
];}
export const stationSignsClearances=[{name:'路口及机位前方通行带',min:[0,0,0] as V3,max:[12,4,3] as V3}];
