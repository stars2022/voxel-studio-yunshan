import type {Command,V3} from '../core/types';
import {contourBottoms,courtStepRuns} from './atlas-neighborhood';
const produce=(catalogId:string,id:string,component?:string):Command=>({op:'produceCatalogAsset',catalogId,id,...(component?{params:{component}}:{})});
const box=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
const cut=(assetId:string,min:V3,max:V3):Command=>({op:'voxels',assetId,mode:'remove',region:{min,max}});
const create=(id:string,name:string,cellSize:number):Command=>({op:'createAsset',id,name,cellSize,template:'empty'});
const place=(id:string,assetId:string,position:V3,rotation=0):Command=>({op:'instance',id,assetId,position,rotation});
export function neighborhoodSkywalkCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-225','bearing'),create('floors','作者两层楼板与连廊安装试架（辅助）',.1),
 ...[32,64].flatMap(y=>[box('floors',[14,y,4],[64,y+2,24],s.structuralConcrete),box('floors',[0,y,24],[64,y+2,64],s.structuralConcrete)]),
 ...[0,60].map(x=>box('floors',[x,0,60],[x+4,64,64],s.metal)),
 place('bearing-1','bearing',[0,0,0]),place('floors-1','floors',[0,0,0]),
];}
export const neighborhoodSkywalkClearances=[3.4,6.6].map(y=>({name:'两层连廊至楼层人体净空-'+y,min:[1.4,y,.6] as V3,max:[2.8,y+1.72,5.6] as V3}));
export function neighborhoodTerrainCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-232','platform'),produce('BUILT-233','steps'),produce('BUILT-234','ramp'),create('terrain','显式L形等高接触带与两段入口试验地形（辅助）',.1),
 ...contourBottoms.map((h,i)=>box('terrain',[i*20,0,0],[i*20+20,2+Math.round(h*10),i===3?40:60],s.earthCutaway)),
 box('terrain',[4,0,-44],[40,2,0],s.earthCutaway),box('terrain',[48,0,-120],[80,6,0],s.earthCutaway),box('terrain',[48,0,-132],[80,8,-120],s.earthCutaway),
 place('terrain-1','terrain',[0,0,0]),place('platform-1','platform',[0,.2,0]),place('steps-1','steps',[.4,.2,-4.4]),place('ramp-1','ramp',[4.8,.6,-12]),
];}
export const neighborhoodTerrainClearances=[{name:'台地两个入口向内转接',min:[.75,1.8,0] as V3,max:[7.7,3.52,2] as V3},{name:'L形缺角保持原生空缺',min:[6,.8,4] as V3,max:[8,3.52,6] as V3},...courtStepRuns.map((z,i)=>({name:'外阶梯净空-'+i,min:[.75,.2+(i+1)*.2,-4.4+z] as V3,max:[3.65,.2+(i+1)*.2+1.72,-4+z] as V3}))];
export function neighborhoodGardenCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-235','gate'),produce('BUILT-240','planter'),produce('BUILT-241','emitter'),create('garden-fixture','院门地坪与明确无洞安装墙段（辅助）',.1),
 box('garden-fixture',[0,0,-10],[140,2,40],s.structuralConcrete),box('garden-fixture',[80,2,8],[104,34,11],s.structuralConcrete),
 place('garden-1','garden-fixture',[0,0,0]),place('gate-1','gate',[0,.2,0]),place('planter-1','planter',[8,.2,0]),place('emitter-1','emitter',[12,.2,0]),
];}
export const neighborhoodGardenClearances=[{name:'院门0.35m半径与1.72m身体通道',min:[2.65,.2,-.8] as V3,max:[3.35,1.92,3.5] as V3},{name:'墙边绿架侧向通道',min:[10.6,.2,-.8] as V3,max:[11.6,1.92,3.5] as V3}];
export function neighborhoodStairsCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-242','flight','stairFlight'),produce('BUILT-242','turn','halfTurn'),produce('BUILT-242','well','upperWell'),produce('BUILT-243','roof-rail'),
 create('stair-fixture','八级双跑梯与真正开放上层井孔（辅助）',.05),box('stair-fixture',[-16,0,-24],[72,4,88],s.structuralConcrete),
 ...Array.from({length:8},(_,i)=>box('stair-fixture',[0,4,i*8],[36,8+i*4,i*8+8],s.structuralConcrete)),
 ...Array.from({length:8},(_,i)=>box('stair-fixture',[36,4,56-i*8],[72,40+i*4,64-i*8],s.structuralConcrete)),
 box('stair-fixture',[0,4,64],[72,36,88],s.structuralConcrete),box('stair-fixture',[-16,64,-24],[72,68,0],s.structuralConcrete),box('stair-fixture',[-16,64,0],[0,68,88],s.structuralConcrete),
 ...[-16,68].map(x=>box('stair-fixture',[x,4,-24],[x+4,64,-20],s.metal)),box('stair-fixture',[-16,4,84],[-12,64,88],s.metal),
 place('stairs-1','stair-fixture',[0,0,0]),place('lower-out','flight',[0,.4,0]),place('lower-in','flight',[1.6,.4,0]),place('upper-out','flight',[3.6,2,3.2],2),place('upper-in','flight',[2,2,3.2],2),place('turn-1','turn',[0,1.8,4.2]),place('well-1','well',[0,3.4,0],3),
 create('roof-fixture','独立平屋面和承柱试架，前侧为开放出口（辅助）',.1),box('roof-fixture',[0,30,0],[56,32,56],s.structuralConcrete),
 ...[0,52].flatMap(x=>[0,52].map(z=>box('roof-fixture',[x,0,z],[x+4,30,z+4],s.structuralConcrete))),
 place('roof-1','roof-fixture',[7,0,0]),place('roof-back','roof-rail',[7.4,3.2,5.2]),place('roof-left','roof-rail',[7.4,3.2,.4],3),place('roof-right','roof-rail',[12.6,3.2,.4],3),
];}
export const neighborhoodStairClearances=[
 ...Array.from({length:8},(_,i)=>({name:'下跑净空-'+i,min:[.3,.4+i*.2,i*.4] as V3,max:[1.5,2.12+i*.2,i*.4+.4] as V3})),
 ...Array.from({length:8},(_,i)=>({name:'上跑净空-'+i,min:[2.1,2+i*.2,2.8-i*.4] as V3,max:[3.3,3.72+i*.2,3.2-i*.4] as V3})),
 {name:'半转内侧横向转身带',min:[.3,1.8,3.3] as V3,max:[3.3,3.52,4.1] as V3},{name:'上层楼梯正常出口',min:[2.1,3.4,-1.2] as V3,max:[3.3,5.12,0] as V3},
 {name:'上层楼板井口没有填板',min:[.2,3.4,0] as V3,max:[1.6,3.6,3.2] as V3},{name:'屋面公共出口',min:[8,3.2,-.4] as V3,max:[11.8,4.92,4.8] as V3},
];
export function neighborhoodJoineryCommands(s:Record<string,number>,open:boolean):Command[]{return[
 produce('BUILT-244','door'),produce('BUILT-245','window'),produce('BUILT-246','eave'),create('joinery-fixture','明确门窗洞口与RoofRegion墙架（辅助）',.02),
 create('joinery-floor','门窗安装地坪（辅助）',.1),box('joinery-floor',[0,0,-10],[64,2,20],s.structuralConcrete),place('floor-1','joinery-floor',[0,0,0]),box('joinery-fixture',[0,10,10],[320,160,30],s.wall),
 cut('joinery-fixture',[20,10,10],[84,132,30]),cut('joinery-fixture',[170,40,10],[292,132,30]),
 // Three steel hinge pins bridge the authored leaf/frame clearance and the window rests on actual support blocks.
 ...[.5,1.3,2.2].flatMap(y=>[box('joinery-fixture',[19,Math.round(y*50)-1,18],[26,Math.round(y*50),20],s.metal),box('joinery-fixture',[24,Math.round(y*50),18],[26,Math.round(y*50)+8,20],s.metal)]),
 box('joinery-fixture',[171,40,10],[291,41,30],s.metal),
 place('wall-1','joinery-fixture',[0,0,0]),place('door-1','door',open?[.6,.2,.34]:[.46,.2,.28],open?3:0),place('window-1','window',[3.42,.82,.3]),place('eave-1','eave',[.8,3.2,-.2]),
];}
export const neighborhoodJoineryClearances=[{name:'门外与室内不受瓦檐影响',min:[.7,.2,-.8] as V3,max:[1.4,1.92,1.6] as V3}];
export const neighborhoodClosedDoorClearance={name:'显式关闭门扇必须阻挡通道',min:[.7,.2,.2] as V3,max:[1.4,1.92,.6] as V3};
