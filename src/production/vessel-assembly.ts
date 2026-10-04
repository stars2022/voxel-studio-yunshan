import type {Command,V3} from '../core/types';
const produce=(catalogId:string,id:string,component?:string):Command=>({op:'produceCatalogAsset',catalogId,id,...(component?{params:{component}}:{})});
const create=(id:string,name:string,cellSize:number):Command=>({op:'createAsset',id,name,cellSize,template:'empty'});
const box=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
const cut=(assetId:string,min:V3,max:V3):Command=>({op:'voxels',assetId,mode:'remove',region:{min,max}});
const place=(id:string,assetId:string,position:V3,rotation=0):Command=>({op:'instance',id,assetId,position,rotation});
export function vesselRailCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-289','bogie','railBogie'),produce('BUILT-177','car'),create('track','作者2.8m轨头中心距钢轨与地床（辅助）',.05),box('track',[-4,0,-20],[64,2,220],s.structuralConcrete),...[0,56].map(x=>box('track',[x,2,-20],[x+4,5,220],s.metalBright)),
 place('track-1','track',[0,0,0]),place('bogie-front','bogie',[0,.2,0]),place('bogie-back','bogie',[0,.2,6.8]),place('car-1','car',[0,1.6,0]),
];}
export const vesselRailClearances=[{name:'车厢正常内通路',min:[.35,1.85,.3] as V3,max:[2.65,3.57,9.7] as V3}];
export function vesselMaglevCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-289','base','maglevBase'),produce('BUILT-177','car'),create('guide','明确0.8m导梁、检修止挡，非磁悬浮模拟（辅助）',.05),box('guide',[24,0,-20],[36,14,220],s.structuralConcrete),box('guide',[22,14,-20],[38,22,220],s.metal),
 ...[0,136].flatMap(z=>[8,46].flatMap(x=>[4,52].map(zz=>box('guide',[x,0,z+zz],[x+6,14,z+zz+8],s.metal)))),
 place('guide-1','guide',[0,0,0]),place('base-front','base',[0,.4,0]),place('base-back','base',[0,.4,6.8]),place('car-1','car',[0,1.8,0]),
];}
export const vesselMaglevClearances=[{name:'车厢正常内通路',min:[.35,2.05,.3] as V3,max:[2.65,3.77,9.7] as V3}];
export const authoredCableRoute={direction:[0,0,1],centerlinesM:[[[.4,5.85,-1.8],[.4,5.85,3.2]],[[2,5.85,-1.8],[2,5.85,3.2]]],originalRouteBound:false};
export function vesselCableCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-290','hanger'),create('cable-rig','两条实际钢索与外侧承塔（辅助）',.05),
 ...[-8,48].flatMap(x=>[-36,56].map(z=>box('cable-rig',[x,0,z],[x+8,111,z+8],s.metal))),...[-36,56].map(z=>box('cable-rig',[-8,111,z],[56,115,z+8],s.metal)),
 ...[6,38].map(x=>box('cable-rig',[x,115,-36],[x+4,119,64],s.suspensionCable)),
 create('cabin','顶板由吊架底托实承的开敞轿厢试架（辅助）',.05),box('cabin',[0,16,-20],[48,20,44],s.enamel),...[0,44].flatMap(x=>[-20,40].map(z=>box('cabin',[x,20,z],[x+4,68,z+4],s.metal))),box('cabin',[0,68,-20],[48,72,44],s.enamel),cut('cabin',[20,68,8],[28,72,16]),
 place('rig-1','cable-rig',[0,0,0]),place('hanger-1','hanger',[0,3.2,0]),place('cabin-1','cabin',[0,0,0]),
];}
export const vesselCableClearances=[{name:'吊臂及穿顶槽不占轿厢身体通路',min:[.25,1,-.75] as V3,max:[2.15,2.72,1.95] as V3}];
export function vesselFerryCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-291','hull'),produce('BUILT-292','rail'),produce('BUILT-293','gangway'),produce('BUILT-300','bollard','bollard'),produce('BUILT-300','fender','fender'),
 create('dock','码头地坪、固定接板承梁、护舷下托与检修龙骨垫（辅助）',.1),box('dock',[66,18,0],[106,20,100],s.metal),box('dock',[66,20,0],[106,22,100],s.wall),cut('dock',[66,20,38],[100,22,62]),
 ...[66,102].flatMap(x=>[0,48,96].map(z=>box('dock',[x,0,z],[x+4,18,z+4],s.structuralConcrete))),box('dock',[66,0,0],[68,18,100],s.structuralConcrete),
 ...[10,70].map(z=>box('dock',[60,11,z],[66,12,z+20],s.metal)),... [10,80].map(z=>box('dock',[24,0,z],[36,2,z+10],s.metal)),
 // Short fixed landing toe carries the outboard part while the dock beam carries the rest.
 box('dock',[60,0,38],[62,20,62],s.metal),
 create('water','明确水线Y1.2m，仅非碰撞显示水面（辅助）',.1),box('water',[-4,11,-4],[110,12,104],s.water),
 place('dock-1','dock',[0,0,0]),place('water-1','water',[0,0,0]),place('hull-1','hull',[0,.2,0]),place('rail-1','rail',[0,2.2,0]),place('gangway-1','gangway',[6,2,6.2],1),
 place('bollard-a','bollard',[6.8,2.2,.2]),place('bollard-b','bollard',[6.8,2.2,8.6]),place('fender-a','fender',[6,1.2,3],1),place('fender-b','fender',[6,1.2,9],1),
];}
export const vesselFerryClearances=[{name:'甲板缺口与岸船固定接板连续通行',min:[3,2.2,4.05] as V3,max:[10.6,3.92,5.95] as V3},{name:'甲板内侧公共路线',min:[2.65,2.2,2.5] as V3,max:[3.35,3.92,9] as V3}];
export const authoredAirliner={heading:[0,0,-1],fuselageFixtureWidthM:4,halfWingM:7,wingSpanM:18,legacy17mProxyUsed:false,flightStateBound:false};
export function vesselAirlinerCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-294','gear','gearDeployed'),produce('BUILT-295','left-wing','portWing'),produce('BUILT-295','right-wing','starboardWing'),produce('BUILT-296','engine'),produce('BUILT-297','tail','horizontalTail'),produce('BUILT-297','fin','verticalTail'),
 create('airframe','明确4m宽机身钢安装梁框，非完整飞机（辅助）',.1),box('airframe',[70,24,0],[110,28,140],s.metal),cut('airframe',[72,25,2],[108,27,138]),box('airframe',[66,22,40],[70,24,76],s.metal),box('airframe',[110,22,40],[114,24,76],s.metal),
 place('frame-1','airframe',[0,0,0]),place('gear-front','gear',[8.1,0,1.4]),place('gear-back','gear',[8.1,0,10.4]),place('wing-left','left-wing',[0,2.4,4]),place('wing-right','right-wing',[11,2.4,4]),place('engine-left','engine',[3,.5,4]),place('engine-right','engine',[13.4,.5,4]),place('tail-1','tail',[6,2.8,11]),place('fin-1','fin',[8.8,3.2,11]),
];}
export const vesselAirlinerClearances=[{name:'两吊舱与地面之间0.5m空间',min:[3,0,4] as V3,max:[5,.5,7.2] as V3},{name:'右翼吊舱下间隙',min:[13.4,0,4] as V3,max:[15,.5,7.2] as V3}];
export function vesselCompressedCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-294','gear','gearCompressed'),create('gear-load','压缩态明确上安装试板（辅助）',.05),box('gear-load',[0,40,0],[36,44,24],s.metal),place('gear-1','gear',[0,0,0]),place('load-1','gear-load',[0,0,0]),
];}
export const vesselCompressedClearances=[{name:'轮组前方检查空隙',min:[.45,0,-.5] as V3,max:[1.35,1.72,0] as V3}];
export function vesselRetractedCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-294','gear','gearRetracted'),create('gear-bay','有实际底托的收起检修舱，非飞行中机身（辅助）',.05),box('gear-bay',[-4,0,-4],[40,4,52],s.metal),box('gear-bay',[-4,4,-4],[0,32,52],s.enamel),box('gear-bay',[36,4,-4],[40,32,52],s.enamel),box('gear-bay',[0,4,-4],[36,32,0],s.metal),
 place('bay-1','gear-bay',[0,0,0]),place('gear-1','gear',[0,.2,0]),
];}
export const vesselRetractedClearances=[{name:'收起形状上方0.2m检修空间',min:[0,1.4,0] as V3,max:[1.8,1.6,2.4] as V3}];
export function vesselBridgeCommands(s:Record<string,number>):Command[]{return[
 produce('BUILT-307','abutment'),produce('BUILT-308','bearing'),create('terrain','三段明确岸地形、岸路与远端平台（辅助）',.1),... [0,.4,.8].map((h,i)=>box('terrain',[0,0,i*16],[60,2+Math.round(h*10),(i+1)*16],s.earthCutaway)),box('terrain',[0,0,-20],[60,26,0],s.earthCutaway),box('terrain',[5,0,120],[55,26,140],s.structuralConcrete),
 create('span','实际桥板与独立中墩（辅助）',.1),box('span',[5,22,40],[55,25,120],s.structuralConcrete),box('span',[5,25,40],[55,26,120],s.wall),box('span',[5,0,80],[55,10,100],s.structuralConcrete),
 place('terrain-1','terrain',[0,0,0]),place('abutment-1','abutment',[0,.2,0]),place('bearing-1','bearing',[.5,1,8]),place('span-1','span',[0,0,0]),
];}
export const vesselBridgeClearances=[{name:'岸路桥台桥板至对岸0.35m半径/1.72m身体净空',min:[2.65,2.6,-1] as V3,max:[3.35,4.32,13] as V3}];
export const vesselScenarios=[['rail',vesselRailCommands,vesselRailClearances],['maglev',vesselMaglevCommands,vesselMaglevClearances],['cable',vesselCableCommands,vesselCableClearances],['ferry',vesselFerryCommands,vesselFerryClearances],['airliner',vesselAirlinerCommands,vesselAirlinerClearances],['compressed',vesselCompressedCommands,vesselCompressedClearances],['retracted',vesselRetractedCommands,vesselRetractedClearances],['bridge',vesselBridgeCommands,vesselBridgeClearances]] as const;
