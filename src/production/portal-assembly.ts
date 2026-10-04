import type {Command,V3} from '../core/types';
const produce=(catalogId:string,id:string,component?:string):Command=>({op:'produceCatalogAsset',catalogId,id,...(component?{params:{component}}:{})});
const create=(id:string,name:string,cellSize:number):Command=>({op:'createAsset',id,name,cellSize,template:'empty'});
const box=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
const place=(id:string,assetId:string,position:V3,rotation=0):Command=>({op:'instance',id,assetId,position,rotation});
export function portalCraftCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-248','bracket'),produce('BUILT-249','lantern'),produce('BUILT-250','stone-edge'),produce('BUILT-251','a1-frame'),
 create('craft-support','柱梁与灯环实托钩，辅助安装试架',.025),box('craft-support',[24,0,8],[40,80,24],s.wood),box('craft-support',[0,112,10],[120,120,22],s.woodEdge),
 // Hook enters the actual annular bore from behind and carries its top crossbar.
 box('craft-support',[107,106,14],[109,112,20],s.metal),box('craft-support',[107,106,11],[109,107,15],s.metal),
 place('support-1','craft-support',[0,0,0]),place('bracket-1','bracket',[0,2,0]),place('lantern-1','lantern',[2.4,1.5,0]),place('stone-1','stone-edge',[4,0,0]),place('frame-1','a1-frame',[7,0,0]),
];}
export const portalCraftClearances=[{name:'有限破边石基旁通道',min:[5.9,0,-.5] as V3,max:[6.8,1.72,2] as V3},{name:'A1真实3.2m贯通洞',min:[7.2,0,-.5] as V3,max:[10.4,2.8,.8] as V3}];
export const authoredStands=[{id:'author-stand-A',instance:'stand-a',centerM:[36,.6,47],nose:[0,0,1],wingSpanM:8.4,lengthM:10},{id:'author-stand-B',instance:'stand-b',centerM:[54,.6,47],nose:[0,0,-1],wingSpanM:8.4,lengthM:10}];
export function portalAirfieldCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-268','taxi','taxiStraight'),produce('BUILT-268','corner','taxiCorner'),produce('BUILT-269','stand'),
 place('taxi-1','taxi',[0,0,0]),place('corner-1','corner',[24,0,0]),place('taxi-2','taxi',[40,0,16],3),place('stand-a','stand',[29,0,40]),place('stand-b','stand',[61,0,54],2),
];}
export const portalAirfieldClearances=authoredStands.map(a=>({name:a.id+'独立空机位机型包络',min:[a.centerM[0]-4.2,.6,a.centerM[2]-5] as V3,max:[a.centerM[0]+4.2,4.6,a.centerM[2]+5] as V3}));
export function portalBoardingCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-270','bridge','boardingBridge'),produce('BUILT-270','stairs','boardingStairs'),produce('BUILT-273','boundary'),
 create('boarding-ground','显式试验地坪（辅助）',.2),box('boarding-ground',[-15,0,-34],[28,1,51],s.structuralConcrete),place('ground-1','boarding-ground',[0,0,0]),
 create('receiver','非飞机的明确接收舱地板和承柱（辅助）',.05),box('receiver',[0,44,160],[48,48,200],s.metal),...[0,44].flatMap(x=>[160,196].map(z=>box('receiver',[x,0,z],[x+4,44,z+4],s.metal))),
 place('receiver-1','receiver',[0,.2,0]),place('bridge-1','bridge',[0,.2,0]),place('stairs-1','stairs',[0,.2,-4.8]),place('boundary-1','boundary',[-2.8,.2,-5.6]),
];}
export const portalBoardingClearances=[{name:'边界公共入口',min:[.25,.2,-6.5] as V3,max:[2.15,1.92,-4.8] as V3},{name:'接桥至接收舱步行面',min:[.25,2.6,0] as V3,max:[2.15,4.32,10] as V3},...Array.from({length:12},(_,i)=>({name:'外梯真实踏步净空'+i,min:[.25,.4+i*.2,-4.8+i*.4] as V3,max:[2.15,2.12+i*.2,-4.4+i*.4] as V3}))];
export function portalBerthCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-276','berth'),create('berth-receiver','明确泊位接收平台及四个承脚（辅助，无船体/Torus）',.1),box('berth-receiver',[16,10,56],[40,12,80],s.metal),...[16,38].flatMap(x=>[56,78].map(z=>box('berth-receiver',[x,0,z],[x+2,10,z+2],s.metal))),
 place('berth-1','berth',[0,0,0]),place('receiver-1','berth-receiver',[0,0,0]),
];}
export const portalBerthClearances=[{name:'实体泊位通向接收平台',min:[1.8,1.2,2.4] as V3,max:[3.8,2.92,8] as V3},...Array.from({length:6},(_,i)=>({name:'泊位六级净空'+i,min:[1.8,(i+1)*.2,i*.4] as V3,max:[3.8,(i+1)*.2+1.72,(i+1)*.4] as V3}))];
export function portalWheelCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-286','wheel'),create('axle-yoke','穿轮毂方孔的前轴与车体高度样件（辅助）',.025),box('axle-yoke',[24,21,-27],[104,27,-21],s.metal),box('axle-yoke',[60,27,-27],[68,40,-21],s.metal),box('axle-yoke',[32,40,-88],[96,48,40],s.enamel),
 place('wheel-left','wheel',[0,0,0],1),place('wheel-right','wheel',[3.2,0,-1.2],3),place('axle-1','axle-yoke',[0,0,0]),
];}
export const portalWheelClearances=[{name:'明确车体1m离地高，轴位置除外',min:[.85,0,0] as V3,max:[2.35,1,.8] as V3}];
export const authoredCarSequence=[{id:'author-car-1',instance:'car-1',positionM:[0,.2,0]},{id:'author-car-2',instance:'car-2',positionM:[0,.2,11.4]}];
export function portalVehicleCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-177','car'),produce('BUILT-287','door'),produce('BUILT-288','coupler'),
 create('car-support','两舱底部静态安装承台（辅助）',.05),box('car-support',[0,0,0],[60,4,200],s.metal),box('car-support',[0,0,228],[60,4,428],s.metal),box('car-support',[12,0,200],[48,12,202],s.metal),box('car-support',[12,0,226],[48,12,228],s.metal),box('car-support',[60,0,78],[64,7,118],s.metal),
 place('support-1','car-support',[0,0,0]),place('car-1','car',[0,.2,0]),place('car-2','car',[0,.2,11.4]),place('door-1','door',[5,.35,3.9],3),place('coupler-1','coupler',[.6,.4,10]),
];}
export const portalVehicleClearances=[{name:'保持原177车体洞口与固定打开门叶外通道',min:[2.5,.45,4.1] as V3,max:[4.8,2.17,5.7] as V3}];
export const portalScenarios=[
 ['craft',portalCraftCommands,portalCraftClearances],['airfield',portalAirfieldCommands,portalAirfieldClearances],['boarding',portalBoardingCommands,portalBoardingClearances],['berth',portalBerthCommands,portalBerthClearances],['wheel',portalWheelCommands,portalWheelClearances],['vehicle',portalVehicleCommands,portalVehicleClearances],
] as const;
