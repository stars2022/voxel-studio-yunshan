import type {Command,V3} from '../core/types';
import {compileHydrologyScene} from './hydrology-composition';
import {authoredWaterRoutes} from './atlas-hydrology';
import type {FlowRoute,WaterFlow} from '../core/water-flow';
const moved=(r:FlowRoute,p:V3,startDistanceM=r.startDistanceM):FlowRoute=>({points:r.points.map(q=>q.map((n,d)=>n+p[d]) as V3),startDistanceM});
const flow=(s:Record<string,number>,routes:FlowRoute[]):WaterFlow=>({routes,materialIds:[s.flowWater,s.fallWater,s.waterFoam,s.water],animated:false,originalRouteBound:false});
export function networkFlow(s:Record<string,number>){const stream=authoredWaterRoutes('ENV-034',{waterWidth:2.4})[0],length=stream.points.slice(1).reduce((n,p,i)=>n+Math.hypot(...p.map((v,d)=>v-stream.points[i][d])),0),start=-Math.hypot(5,10)-length;return flow(s,[{points:[[5,3.4,-20],[5,3.4,-16]],startDistanceM:start-4},{points:[[15,3.4,-20],[15,3.4,-16]],startDistanceM:start-4},moved(stream,[1,0,-16],start),moved(stream,[11,0,-16],start),...authoredWaterRoutes('ENV-035',{component:'junctionY'}),moved(authoredWaterRoutes('ENV-027',{})[0],[2,0,20],10)]);}
export function fallPoolFlow(s:Record<string,number>){return flow(s,[{points:[[50,153.4,-1],[50,153.4,14]],startDistanceM:0},moved(authoredWaterRoutes('ENV-028',{})[0],[38,.4,12.8],15),moved(authoredWaterRoutes('ENV-029',{})[0],[0,0,0],168),moved(authoredWaterRoutes('ENV-027',{})[0],[42,0,106],260)]);}
const make=(catalogId:string,id:string,params:Record<string,number|string>={}):Command=>({op:'produceCatalogAsset',catalogId,id,params});
const create=(id:string,name:string,cellSize=.2):Command=>({op:'createAsset',id,name,cellSize,template:'empty'});
const b=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
const put=(id:string,assetId:string,position:V3):Command=>({op:'instance',id,assetId,position,rotation:0});
export function hydrologyRootsCommands(s:Record<string,number>):Command[]{return[
 make('ENV-014','shallow',{soilDepth:1}),make('ENV-014','deep',{soilDepth:2}),create('ground','两份作者根际切片共用岩床（辅助）'),b('ground',[-5,0,-5],[95,1,35],s.bedrock),put('ground-1','ground',[0,0,0]),put('shallow-1','shallow',[0,.2,0]),put('deep-1','deep',[10,.2,0]),
 ];}
export const hydrologyRootsClearances=[{name:'两土层切片之间的身体通路',min:[8.3,.2,0] as V3,max:[9.7,1.92,6] as V3}];
export function hydrologyStonesCommands(s:Record<string,number>):Command[]{return[
 make('ENV-015','monolith'),make('ENV-016','small',{grainDiameter:.4}),make('ENV-016','large',{grainDiameter:.8}),make('ENV-017','shore-small',{shoreSize:1.2}),make('ENV-017','shore-large',{shoreSize:3.6}),
 create('ground','明确石件岩床与保留不盖的0.8m裂隙（辅助）'),b('ground',[-25,0,-25],[115,1,60],s.bedrock),{op:'voxels',assetId:'ground',mode:'remove',region:{min:[30,0,-25],max:[34,1,60]}},
 put('ground-1','ground',[0,0,0]),put('monolith-1','monolith',[0,.2,0]),put('small-1','small',[8,.2,0]),put('large-1','large',[16,.2,0]),put('shore-small-1','shore-small',[0,.2,7]),put('shore-large-1','shore-large',[4,.2,7]),
 ];}
export const hydrologyStonesClearances=[{name:'权威地面裂隙未被装饰岩石封盖',min:[6,0,-5] as V3,max:[6.8,2,12] as V3},{name:'大碎石群落保留0.8m通路',min:[18.85,.4,0] as V3,max:[19.55,2.12,6] as V3}];
export function hydrologyCascadeCommands(s:Record<string,number>):Command[]{return[
 make('ENV-026','single'),make('ENV-032','steps21',{levels:2,stepHeight:1}),make('ENV-032','steps22',{levels:2,stepHeight:2}),make('ENV-032','steps31',{levels:3,stepHeight:1}),make('ENV-032','steps32',{levels:3,stepHeight:2}),
 put('single-1','single',[0,0,0]),put('steps21-1','steps21',[12,0,0]),put('steps22-1','steps22',[24,0,0]),put('steps31-1','steps31',[36,0,0]),put('steps32-1','steps32',[48,0,0]),
 ];}
export const hydrologyCascadeClearances=[{name:'跌水样件间的明确地面检查通道',min:[9.5,0,0] as V3,max:[12,1.72,16] as V3}];
export function hydrologyNetworkCommands(s:Record<string,number>):Command[]{return compileHydrologyScene([
 make('ENV-034','stream',{waterWidth:2.4}),make('ENV-027','river'),make('ENV-035','junction',{component:'junctionY'}),
 create('source','作者上游蓄水槽与两处泉口，不是原水源（辅助）'),b('source',[0,0,-20],[100,15,0],s.bedrock),b('source',[19,15,-20],[31,17,0],s.water),b('source',[69,15,-20],[81,17,0],s.water),
 ...[13,31,63,81].map(x=>b('source',[x,15,-20],[x+6,19,0],s.waterWornRock)),b('source',[13,15,-20],[87,19,-18],s.waterWornRock),
 put('source-1','source',[0,0,-16]),put('stream-left','stream',[1,0,-16]),put('stream-right','stream',[11,0,-16]),put('junction-1','junction',[0,0,0]),put('river-1','river',[2,0,20]),
 ],s,'network-union',networkFlow(s));}
export const hydrologyNetworkClearances=[{name:'作者水系旁1.72m身体检查域',min:[19.2,0,-16] as V3,max:[20,1.72,52] as V3}];
export function hydrologyJunctionCommands(s:Record<string,number>):Command[]{return[
 make('ENV-035','junctionY',{component:'junctionY'}),make('ENV-035','junctionT',{component:'junctionT'}),make('ENV-035','bendLeft',{component:'bendLeft'}),make('ENV-035','bendRight',{component:'bendRight'}),make('ENV-034','narrow',{waterWidth:1.2}),
 put('y-1','junctionY',[0,0,0]),put('t-1','junctionT',[24,0,0]),put('left-1','bendLeft',[48,0,0]),put('right-1','bendRight',[72,0,0]),put('narrow-1','narrow',[96,0,0]),
 ];}
export const hydrologyJunctionClearances=[{name:'各拓扑研究之间的身体检查域',min:[20.4,0,0] as V3,max:[23.6,1.72,20] as V3}];
export function hydrologyFallCommands(s:Record<string,number>):Command[]{return compileHydrologyScene([
 make('ENV-028','fall'),make('ENV-029','pool'),make('ENV-027','outlet'),
 create('cliff','明确高崖与上源悬挑岩台，未受力认证（辅助）'),b('cliff',[185,0,-5],[315,756,-4],s.bedrock),b('cliff',[185,756,-5],[315,766,69],s.waterWornRock),b('cliff',[190,766,-5],[310,767,69],s.water),
 put('cliff-1','cliff',[0,0,0]),put('pool-1','pool',[0,0,0]),put('fall-1','fall',[38,.4,12.8]),put('outlet-1','outlet',[42,0,106]),
 ],s,'fall-pool-union',fallPoolFlow(s));}
export const hydrologyFallClearances=[{name:'高岩台以下的真实自由落水前空间',min:[38,2,0] as V3,max:[62,151.2,13.8] as V3},{name:'原升降井未提供；作者东侧预留域保持无实体',min:[102,0,20] as V3,max:[106,8,24] as V3}];
export function hydrologyProxyCommands(s:Record<string,number>):Command[]{return[
 make('ENV-019','proxy'),create('base','远景代理下的明确展示岩板，非可探索山体（辅助）'),b('base',[-5,0,-5],[245,1,65],s.bedrock),put('base-1','base',[0,0,0]),put('proxy-1','proxy',[0,.2,0]),
 ];}
export const hydrologyProxyClearances=[{name:'代理前方实体通路',min:[0,.2,-1] as V3,max:[48,1.92,0] as V3}];
export const hydrologyScenarios=[['roots',hydrologyRootsCommands,hydrologyRootsClearances],['stones',hydrologyStonesCommands,hydrologyStonesClearances],['cascades',hydrologyCascadeCommands,hydrologyCascadeClearances],['network',hydrologyNetworkCommands,hydrologyNetworkClearances],['junctions',hydrologyJunctionCommands,hydrologyJunctionClearances],['fall-pool',hydrologyFallCommands,hydrologyFallClearances],['proxy',hydrologyProxyCommands,hydrologyProxyClearances]] as const;
