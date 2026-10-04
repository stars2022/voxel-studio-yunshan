import type {Command,V3} from '../core/types';
const make=(catalogId:string,id:string):Command=>({op:'produceCatalogAsset',catalogId,id});
const create=(id:string,name:string,cellSize=.1):Command=>({op:'createAsset',id,name,cellSize,template:'empty'});
const b=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
const cut=(assetId:string,min:V3,max:V3):Command=>({op:'voxels',assetId,mode:'remove',region:{min,max}});
const put=(id:string,assetId:string,position:V3):Command=>({op:'instance',id,assetId,position,rotation:0});
export function terrainAnchorCommands(s:Record<string,number>):Command[]{return[
 make('BUILT-309','anchor'),create('bank','显式岸地基、分离河域与路域（辅助）'),b('bank',[-20,0,-10],[80,2,150],s.earthCutaway),b('bank',[-20,2,-10],[-5,3,150],s.pavementConcrete),
 create('lead','真实入索头、钢索与远端检修承塔（辅助）'),b('lead',[28,30,35],[32,34,140],s.suspensionCable),b('lead',[24,2,130],[36,30,140],s.metal),
 put('bank-1','bank',[0,0,0]),put('anchor-1','anchor',[0,.2,0]),put('lead-1','lead',[0,0,0]),
 ];}
export const terrainAnchorClearances=[{name:'岸路身体净空',min:[-1.8,.3,0] as V3,max:[-.6,2.02,14] as V3},{name:'作者河域未被锚块侵入',min:[8,0,0] as V3,max:[12,3,14] as V3}];
export function terrainCableCommands(s:Record<string,number>):Command[]{return[
 make('BUILT-310','tower'),create('terrain','两塔共用明确地面（辅助）'),b('terrain',[-10,0,-10],[50,2,170],s.earthCutaway),
 create('cables','与四导轮槽同描述的双直承索（辅助）'),...[5,33].map(x=>b('cables',[x,80,5],[x+2,82,147],s.suspensionCable)),
 create('cabin','2.8m承索间距的真实挂夹、吊臂及轿厢试架（辅助）'),b('cabin',[0,36,50],[40,38,90],s.enamel),...[0,38].flatMap(x=>[50,88].map(z=>b('cabin',[x,38,z],[x+2,58,z+2],s.metal))),b('cabin',[0,58,50],[40,60,90],s.enamel),b('cabin',[18,60,60],[22,77,64],s.metal),b('cabin',[2,75,60],[38,77,64],s.metal),
 ...[2,30].flatMap(x=>[b('cabin',[x,77,58],[x+8,84,68],s.metal),cut('cabin',[x+3,80,58],[x+5,82,68])]),
 put('terrain-1','terrain',[0,0,0]),put('tower-a','tower',[0,.2,0]),put('tower-b','tower',[0,.2,12]),put('cables-1','cables',[0,0,0]),put('cabin-1','cabin',[0,0,0]),
 ];}
export const terrainCableClearances=[{name:'舱内完整1.72m身体空间',min:[.3,3.8,5.3] as V3,max:[3.7,5.52,8.7] as V3},{name:'舱体距明确地面3.4m',min:[0,.2,5] as V3,max:[4,3.6,9] as V3}];
export function terrainWharfCommands(s:Record<string,number>):Command[]{return[
 make('BUILT-312','wharf'),create('shore','河床、真实岸路与两米岸接板（辅助）'),b('shore',[-20,0,-40],[80,2,80],s.earthCutaway),b('shore',[-20,2,-40],[80,36,-20],s.earthCutaway),b('shore',[20,34,-20],[40,36,0],s.wood),b('shore',[20,2,-20],[24,34,0],s.metal),b('shore',[36,2,-20],[40,34,0],s.metal),
 create('water','水面Y2.6，仅非碰撞显示（辅助）'),b('water',[-20,25,-20],[80,26,80],s.water),
 put('shore-1','shore',[0,0,0]),put('water-1','water',[0,0,0]),put('wharf-1','wharf',[0,.2,0]),
 ];}
export const terrainWharfClearances=[{name:'岸接板至平台入口通路',min:[2.1,3.6,-3] as V3,max:[3.9,5.32,5.5] as V3},{name:'泊位登离缺口，状态未绑定',min:[2.1,3.6,5.5] as V3,max:[3.9,5.32,6.5] as V3}];
export function terrainResidentialCommands(s:Record<string,number>):Command[]{return[
 make('BUILT-316','beam'),create('wall','住宅梁的明确试验墙与下托，非原住宅（辅助）'),b('wall',[-20,0,-10],[20,55,0],s.structuralConcrete),b('wall',[-6,8,0],[6,10,4],s.metal),
 put('wall-1','wall',[0,0,0]),put('beam-1','beam',[0,5,4.8]),
 ];}
export const terrainResidentialClearances=[{name:'作者梁端下方身体净空',min:[-.5,0,4] as V3,max:[.5,1.72,5] as V3}];
export function terrainArchCommands(s:Record<string,number>):Command[]{return[
 make('ENV-013','arch'),create('ground','天然洞底独立0.2m地面（辅助）',.2),b('ground',[-5,0,-5],[65,1,45],s.bedrock),put('ground-1','ground',[0,0,0]),put('arch-1','arch',[0,.2,0]),
 ];}
export const terrainArchClearances=[{name:'天然穿洞全进深真实身体通行',min:[3.6,.2,-1] as V3,max:[8.4,1.92,9] as V3},{name:'洞内保守4.6米真空腔',min:[3.6,.2,0] as V3,max:[8.4,4.8,8] as V3}];
export const terrainScenarios=[['anchor',terrainAnchorCommands,terrainAnchorClearances],['cable',terrainCableCommands,terrainCableClearances],['wharf',terrainWharfCommands,terrainWharfClearances],['residential',terrainResidentialCommands,terrainResidentialClearances],['arch',terrainArchCommands,terrainArchClearances]] as const;
