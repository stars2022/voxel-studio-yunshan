import type {Command,V3} from '../core/types';
import {civicContactHeights} from './atlas-urban';
const produce=(catalogId:string,id:string,component?:string):Command=>({op:'produceCatalogAsset',catalogId,id,...(component?{params:{component}}:{})});
const box=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
export function urbanLandingCommands():Command[]{return[
 produce('BUILT-207','lift','liftLanding'),produce('BUILT-207','bank','bankLanding'),produce('BUILT-210','rail','straight'),produce('BUILT-210','corner','corner'),
 {op:'instance',id:'lift-1',assetId:'lift',position:[0,0,0]},{op:'instance',id:'bank-1',assetId:'bank',position:[11,0,0]},
 {op:'instance',id:'rail-left',assetId:'rail',position:[.3,.6,0],rotation:3},{op:'instance',id:'rail-right',assetId:'rail',position:[9,.6,0],rotation:3},
 {op:'instance',id:'corner-1',assetId:'corner',position:[11,.6,0]},
];}
export const urbanLandingClearances=[{name:'半径0.35m、1.72m作者通行体积',min:[1.15,.6,.45] as V3,max:[1.85,2.32,3.55] as V3},{name:'岸侧落台开放通行带',min:[16,.6,.3] as V3,max:[19,2.32,3.7] as V3}];
export function urbanFoundationCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-208','pier','pier'),produce('BUILT-208','cap','cap'),produce('BUILT-209','foundation','foundation'),produce('BUILT-209','footing','footing'),produce('BUILT-206','beam'),produce('BUILT-205','deck'),
 {op:'createAsset',id:'terrain-fixture',name:'显式五高度带试验地形（辅助，非原采样）',template:'empty',cellSize:.1},
 box('terrain-fixture',[0,0,0],[40,4,30],s.earthCutaway),
 ...[0,30].flatMap(x=>[0,20].flatMap(z=>civicContactHeights.flatMap((h,i)=>h>0?[box('terrain-fixture',[x+i*2,4,z],[x+i*2+2,4+Math.round(h*10),z+10],s.earthCutaway)]:[]))),
 {op:'instance',id:'terrain-1',assetId:'terrain-fixture',position:[2.5,241.2,2.5]},
 ...[0,3].flatMap((x,i)=>[0,2].map((z,j):Command=>({op:'instance',id:`footing-${i}-${j}`,assetId:'footing',position:[2.5+x,241.6,2.5+z]}))),
 {op:'instance',id:'foundation-1',assetId:'foundation',position:[2.5,242.6,2.5]},
 {op:'instance',id:'pier-1',assetId:'pier',position:[2.5,243.6,2.5]},
 {op:'connect',id:'cap-1',assetId:'cap',portId:'pier',targetInstanceId:'pier-1',targetPortId:'cap',rotation:0},
 {op:'instance',id:'beam-1',assetId:'beam',position:[0,252.8,0]},
 {op:'connect',id:'deck-1',assetId:'deck',portId:'beam',targetInstanceId:'beam-1',targetPortId:'deck',rotation:0},
];}
export const urbanFoundationClearances=[{name:'作者高桥板顶1.72m净空',min:[.2,254.6,.2] as V3,max:[8.8,256.32,7.8] as V3}];
export const urbanFoundationUnsupported=['terrain-1']; // finite sample surface has no supplied deeper geology
export function urbanMarketCommands():Command[]{return[
 produce('BUILT-212','platform'),produce('BUILT-213','ramp'),produce('BUILT-217','stairs'),produce('BUILT-215','kerb','kerb'),
 {op:'instance',id:'platform-1',assetId:'platform',position:[0,0,12]},
 {op:'instance',id:'ramp-1',assetId:'ramp',position:[1.4,0,0]},
 {op:'instance',id:'stairs-1',assetId:'stairs',position:[10,0,13.4],rotation:3},
 {op:'instance',id:'kerb-1',assetId:'kerb',position:[1.4,2,17.8]},
];}
export const urbanMarketClearances=[{name:'市场台顶步行转接区',min:[1.4,2,12] as V3,max:[6,3.72,16.6] as V3}];
export function urbanDrainCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-214','cover'),produce('BUILT-215','ring','treeRing'),produce('BUILT-216','retaining'),
 {op:'createAsset',id:'channel-fixture',name:'边沟试验承槽（辅助）',template:'empty',cellSize:.05},
 box('channel-fixture',[0,0,0],[120,2,16],s.structuralConcrete),box('channel-fixture',[0,2,0],[120,8,2],s.structuralConcrete),box('channel-fixture',[0,2,14],[120,8,16],s.structuralConcrete),
 {op:'instance',id:'channel-1',assetId:'channel-fixture',position:[0,0,0]},
 {op:'instance',id:'cover-1',assetId:'cover',position:[0,.4,0]},
 {op:'instance',id:'ring-1',assetId:'ring',position:[7,0,0]},
 {op:'instance',id:'retaining-1',assetId:'retaining',position:[7,0,4]},
 {op:'createAsset',id:'soil-fixture',name:'有限挡土试验土层（辅助）',template:'empty',cellSize:.1},
 box('soil-fixture',[0,0,0],[40,17,20],s.earthCutaway),
 ...[7,19,31].map((x):Command=>({op:'voxels',assetId:'soil-fixture',mode:'remove',region:{min:[x,4,0],max:[x+2,6,20]}})),
 {op:'instance',id:'soil-1',assetId:'soil-fixture',position:[7,0,4.6]},
];}
export const urbanDrainClearances=[{name:'树池中央真实空腔',min:[7.3,0,.3] as V3,max:[9.9,1.72,2.9] as V3},...[.7,1.9,3.1].map(x=>({name:'贯通泄水孔-'+x,min:[7+x,.4,3.9] as V3,max:[7+x+.2,.6,6.6] as V3}))];
export function urbanFacadeCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-218','facade'),produce('BUILT-219','shade'),
 {op:'createAsset',id:'floor-fixture',name:'两层楼板和后柱安装试架（辅助）',template:'empty',cellSize:.1},
 box('floor-fixture',[0,0,-6],[60,2,33],s.structuralConcrete),box('floor-fixture',[0,32,3],[40,34,33],s.structuralConcrete),
 ...[0,38].map(x=>box('floor-fixture',[x,2,31],[x+2,32,33],s.metal)),
 {op:'instance',id:'floors-1',assetId:'floor-fixture',position:[0,0,0]},
 {op:'instance',id:'facade-1',assetId:'facade',position:[0,.2,0]},
 ...Array.from({length:9},(_,i):Command=>({op:'connect',id:'shade-'+i,assetId:'shade',portId:'mount',targetInstanceId:'facade-1',targetPortId:'shade-'+i,rotation:0})),
];}
export const urbanFacadeClearances=[{name:'下层室内净空',min:[.3,.4,.35] as V3,max:[3.7,3.1,3] as V3},{name:'上层室内净空',min:[.3,3.4,.35] as V3,max:[3.7,6.4,3] as V3},{name:'侧向通行预留',min:[4.4,.2,-.5] as V3,max:[5.6,1.92,2.5] as V3},{name:'屋面以上无遮阳侵占',min:[0,6.6,-.6] as V3,max:[4,8.32,3.3] as V3}];
