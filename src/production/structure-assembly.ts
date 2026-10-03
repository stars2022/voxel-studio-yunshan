import type {Command,V3} from '../core/types';

/** Ordinary public commands shared by UI/MCP tests; no second document engine. */
export function structureAssemblyCommands(roles:Record<string,number>):Command[]{
 return[
  {op:'produceCatalogAsset',catalogId:'BUILT-014',id:'wing'},
  {op:'produceCatalogAsset',catalogId:'BUILT-007',id:'outbound',params:{width:1.6}},
  {op:'produceCatalogAsset',catalogId:'BUILT-008',id:'return'},
  {op:'produceCatalogAsset',catalogId:'BUILT-009',id:'landing'},
  {op:'createAsset',id:'return-support',name:'回行承柱 · 拼装辅件',template:'empty',cellSize:.02},
  {op:'voxels',assetId:'return-support',mode:'fill',region:{min:[0,0,0],max:[10,80,10]},material:roles.wood},
  {op:'voxels',assetId:'return-support',mode:'fill',region:{min:[0,0,0],max:[10,5,10]},material:roles.stone},
  {op:'voxels',assetId:'return-support',mode:'fill',region:{min:[0,75,0],max:[10,80,10]},material:roles.metal},
  {op:'instance',id:'support-a',assetId:'return-support',position:[2.44,0,1.28]},
  {op:'instance',id:'support-b',assetId:'return-support',position:[3.76,0,1.28]},
  {op:'instance',id:'wing-1',assetId:'wing',position:[0,0,0]},
  {op:'connect',id:'outbound-1',assetId:'outbound',portId:'bottom-walkway',targetInstanceId:'wing-1',targetPortId:'lower-flight',rotation:0},
  {op:'connect',id:'landing-1',assetId:'landing',portId:'outbound',targetInstanceId:'outbound-1',targetPortId:'top-walkway',rotation:0},
  {op:'connect',id:'return-1',assetId:'return',portId:'bottom-walkway',targetInstanceId:'landing-1',targetPortId:'return',rotation:0},
 ];
}

/** Human envelope above each tread; measurements do not imply a game controller. */
export function structureRouteClearances():{name:string;min:V3;max:V3}[]{
 const ranges:{name:string;min:V3;max:V3}[]=[];
 for(let i=0;i<8;i++){
  const top=.4+i*.2,z=1.6+i*.4;
  ranges.push({name:'上行 '+(i+1)+' · 0.6m 宽 / 1.9m 净高',min:[.9,top+.02,z+.04],max:[1.5,top+1.92,z+.32]});
  const returnZ=5.2-i*.4,returnTop=top+1.6;
  ranges.push({name:'回行 '+(i+1)+' · 0.6m 宽 / 1.9m 净高',min:[2.9,returnTop+.02,returnZ+.04],max:[3.5,returnTop+1.92,returnZ+.32]});
 }
 ranges.push({name:'半转平台横向转身',min:[.9,1.82,6.3],max:[3.5,3.72,6.8]},{name:'上层出口',min:[2.9,3.42,.5],max:[3.5,5.32,1.7]});
 return ranges;
}
