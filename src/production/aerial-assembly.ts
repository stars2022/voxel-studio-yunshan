import type {Command,V3,Port} from '../core/types';
const produce=(rows:string[][])=>rows.map(([catalogId,id]):Command=>({op:'produceCatalogAsset',catalogId,id}));
export function aerialQuadCommands(roles:Record<string,number>):Command[]{
 const ports:Port[]=[{id:'right',kind:'quad-arm',position:[.8,.1,.4],normal:[1,0,0],size:[0,.2,.2],pitch:.02},{id:'left',kind:'quad-arm',position:[0,.1,.4],normal:[-1,0,0],size:[0,.2,.2],pitch:.02},{id:'front',kind:'quad-arm',position:[.4,.1,0],normal:[0,0,-1],size:[.2,.2,0],pitch:.02},{id:'back',kind:'quad-arm',position:[.4,.1,.8],normal:[0,0,1],size:[.2,.2,0],pitch:.02}];
 for(const x of[.1,.7])for(const z of[.1,.7])ports.push({id:`leg-${Math.round(x*100)}-${Math.round(z*100)}`,kind:'quad-leg',position:[x,0,z],normal:[0,-1,0],size:[.2,0,.2],pitch:.02});
 return[
 ...produce([['BUILT-186','arm'],['BUILT-187','blade'],['BUILT-188','leg']]),
 {op:'createAsset',id:'quad-fixture',name:'作者中心安装试验块（辅助，不计飞机母版）',template:'empty',cellSize:.02},
 {op:'voxels',assetId:'quad-fixture',mode:'fill',region:{min:[0,0,0],max:[40,10,40]},material:roles.aircraftSkin},
 ...[{min:[-6,-1,15],max:[46,0,25]},{min:[15,-1,-6],max:[25,0,46]}].map(region=>({op:'voxels',assetId:'quad-fixture',mode:'fill',region,material:roles.metal}) as Command),
 {op:'metadata',assetId:'quad-fixture',ports},
 {op:'instance',id:'fixture-1',assetId:'quad-fixture',position:[-.4,.8,-.4]},
 ...ports.slice(4).map((p,i):Command=>({op:'connect',id:'leg-'+i,assetId:'leg',portId:'top',targetInstanceId:'fixture-1',targetPortId:p.id,rotation:0})),
 ...ports.slice(0,4).flatMap((p,i):Command[]=>[{op:'connect',id:'arm-'+i,assetId:'arm',portId:'root',targetInstanceId:'fixture-1',targetPortId:p.id,rotation:[0,2,1,3][i]},{op:'connect',id:'blade-'+i,assetId:'blade',portId:'root',targetInstanceId:'arm-'+i,targetPortId:'rotor',rotation:[0,2,1,3][i]}]),
 ];
}
export const aerialQuadClearances=[{name:'中心块下方实际空隙',min:[-.15,0,-.15] as V3,max:[.15,.76,.15] as V3}];
export function aerialCockpitCommands(roles:Record<string,number>):Command[]{return[
 ...produce([['BUILT-189','glazing'],['BUILT-190','roof'],['BUILT-195','console']]),
 {op:'createAsset',id:'floor-fixture',name:'驾驶舱安装地板（辅助）',template:'empty',cellSize:.02},
 {op:'voxels',assetId:'floor-fixture',mode:'fill',region:{min:[0,0,0],max:[90,10,120]},material:roles.metal},
 {op:'instance',id:'floor-1',assetId:'floor-fixture',position:[0,0,0]},
 {op:'instance',id:'glazing-1',assetId:'glazing',position:[0,.2,.2]},
 {op:'connect',id:'roof-1',assetId:'roof',portId:'bottom',targetInstanceId:'glazing-1',targetPortId:'roof',rotation:0},
 {op:'instance',id:'console-1',assetId:'console',position:[.3,.2,.5]},
];}
export const aerialCockpitClearances=[{name:'作者Y1.1m眼位直视通道',min:[.3,.8,-.4] as V3,max:[1.5,1.3,2.3] as V3}];
export function aerialWingCommands(roles:Record<string,number>):Command[]{return[
 ...produce([['BUILT-191','wing']]),
 {op:'createAsset',id:'wing-fixture',name:'主翼根鞍试验台（辅助）',template:'empty',cellSize:.02},
 {op:'voxels',assetId:'wing-fixture',mode:'fill',region:{min:[0,0,0],max:[20,50,16]},material:roles.metal},
 {op:'metadata',assetId:'wing-fixture',ports:[{id:'top',kind:'wing-mount',position:[.2,1,.16],normal:[0,1,0],size:[.4,0,.32],pitch:.02}]},
 {op:'instance',id:'stand-1',assetId:'wing-fixture',position:[4,0,1.04]},
 {op:'connect',id:'wing-1',assetId:'wing',portId:'root',targetInstanceId:'stand-1',targetPortId:'top',rotation:0},
];}
export const aerialWingClearances=[{name:'主翼左侧下方检查空间',min:[0,.1,0] as V3,max:[3.8,.9,2.4] as V3}];
export function aerialTailCommands():Command[]{return[
 ...produce([['BUILT-192','fin'],['BUILT-193','tail'],['BUILT-194','power']]),
 {op:'instance',id:'power-1',assetId:'power',position:[0,0,0]},
 {op:'instance',id:'tail-1',assetId:'tail',position:[-.8,1,.3]},
 {op:'instance',id:'fin-1',assetId:'fin',position:[1,1.2,-.2]},
];}
export const aerialTailClearances=[{name:'动力盒前方进气通道',min:[.7,.3,-1] as V3,max:[1.7,.7,.6] as V3}];
export function aerialBridgeCommands():Command[]{return[
 ...produce([['BUILT-205','deck'],['BUILT-206','beam']]),
 {op:'produceCatalogAsset',catalogId:'BUILT-205',id:'joint',params:{depth:.2}},
 ...Array.from({length:6},(_,i):Command[]=>[{op:'instance',id:'beam-'+i,assetId:'beam',position:[0,252.8,i*8.2]},{op:'connect',id:'deck-'+i,assetId:'deck',portId:'beam',targetInstanceId:'beam-'+i,targetPortId:'deck',rotation:0}]).flat(),
 ...Array.from({length:5},(_,i):Command=>({op:'instance',id:'joint-'+i,assetId:'joint',position:[0,254,8+i*8.2]})),
];}
export const aerialBridgeClearances=[{name:'隔离高桥板顶3m净空',min:[.2,254.6,0] as V3,max:[8.8,257.6,49] as V3}];
export const aerialBridgeUnsupported=Array.from({length:6},(_,i)=>'beam-'+i);
// Bounding-box proximity between a beam cap and the NEXT deck is intentional:
// the intervening 0.2m joint has direct support from both caps. Keep the notices.
export const aerialBridgeNearPairs=Array.from({length:5},(_,i)=>[[`beam-${i}`,`deck-${i+1}`],[`deck-${i}`,`beam-${i+1}`]]).flat();
