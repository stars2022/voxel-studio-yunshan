import type {Command,V3} from '../core/types';
const produce=(entries:string[][])=>entries.map(([catalogId,id]):Command=>({op:'produceCatalogAsset',catalogId,id}));
export function bridgeTrackCommands():Command[]{return[
 ...produce([['BUILT-140','bed'],['BUILT-141','guides'],['BUILT-142','guards']]),
 {op:'instance',id:'bed-1',assetId:'bed',position:[0,0,0]},
 {op:'instance',id:'guides-1',assetId:'guides',position:[1.06,1.4,0]},
 ...[0,2,6].map((z,i):Command=>({op:'instance',id:'guards-'+i,assetId:'guards',position:[.075,1.4,z]})),
];}
export const bridgeTrackClearances=[{name:'平台侧2m护条开口',min:[-.2,1.4,4] as V3,max:[.6,3,6] as V3}];
export function bridgeShaftCommands():Command[]{return[
 ...produce([['BUILT-144','shaft'],['BUILT-145','guide']]),
 {op:'instance',id:'shaft-1',assetId:'shaft',position:[0,0,0]},
 {op:'instance',id:'guide-1',assetId:'guide',position:[5.85,.8,2.65]},
];}
export const bridgeShaftClearances=[{name:'升降机中央乘舱路线',min:[.6,.8,.6] as V3,max:[5,24.4,5] as V3}];
export function bridgeRailCommands():Command[]{return[
 ...produce([['BUILT-146','deck'],['BUILT-147','post'],['BUILT-135','rail']]),
 {op:'instance',id:'deck-1',assetId:'deck',position:[0,0,0]},
 ...[0,8.4].flatMap((x,i)=>[0,7.4].map((z,j):Command=>({op:'instance',id:`post-${i}-${j}`,assetId:'post',position:[x,.5,z]}))),
 ...[.2,8.6].flatMap((x,i)=>[4,8].map((z,j):Command=>({op:'instance',id:`rail-${i}-${j}`,assetId:'rail',position:[x,1.5,z],rotation:1}))),
];}
export const bridgeRailClearances=[{name:'桥面中央通行层',min:[.6,.5,0] as V3,max:[8.4,4,8] as V3}];
/** Full main cables and tower locations; three central hanger stations demonstrate the 8m repeat.
 * This is a static interface study, not a complete load-bearing bridge simulation. */
export function bridgeSuspensionCommands():Command[]{return[
 ...produce([['BUILT-148','main'],['BUILT-149','hanger'],['BUILT-150','foundation'],['BUILT-151','tower'],['BUILT-152','cap'],['BUILT-146','deck']]),
 {op:'produceCatalogAsset',catalogId:'BUILT-149',id:'hanger-tall',params:{height:12.8}},
 {op:'instance',id:'main-1',assetId:'main',position:[0,0,0]},
 ...[25.6,134.4].flatMap((z,j):Command[]=>[
  ...[-3.5,7.5].flatMap((x,i):Command[]=>[
   {op:'instance',id:`foundation-${j}-${i}`,assetId:'foundation',position:[x,-2.6,z-4.5]},
   {op:'connect',id:`tower-${j}-${i}`,assetId:'tower',portId:'foot',targetInstanceId:`foundation-${j}-${i}`,targetPortId:'tower',rotation:0},
  ]),
  {op:'connect',id:`cap-${j}`,assetId:'cap',portId:'left',targetInstanceId:`tower-${j}-0`,targetPortId:'cap',rotation:0},
 ]),
 ...Array.from({length:20},(_,i):Command=>({op:'instance',id:'deck-'+i,assetId:'deck',position:[2,-.5,i*8]})),
 ...[72,80,88].flatMap((z,j):Command[]=>[
  {op:'instance',id:`hanger-${j}-left`,assetId:z===80?'hanger':'hanger-tall',position:[.6,0,z-.4]},
  {op:'instance',id:`hanger-${j}-right`,assetId:z===80?'hanger':'hanger-tall',position:[12.4,0,z+.4],rotation:2},
 ]),
];}
export const bridgeSuspensionClearances=[{name:'160m桥面中央净空',min:[2.7,0,0] as V3,max:[10.3,5,160] as V3}];
export function bridgeCableFixtureCommands(roles:Record<string,number>):Command[]{return[
 ...produce([['BUILT-143','cable']]),
 {op:'createAsset',id:'fixture',name:'高度试验托架，不计清单',template:'empty',cellSize:.1},
 {op:'voxels',assetId:'fixture',mode:'fill',region:{min:[0,0,0],max:[5,84,8]},material:roles.structuralConcrete},
 ...[.3,6.9].map((z,i):Command=>({op:'instance',id:'fixture-'+i,assetId:'fixture',position:[.1,0,z]})),
 {op:'instance',id:'cable-1',assetId:'cable',position:[0,8.35,0]},
];}
