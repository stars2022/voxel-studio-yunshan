import type {Command,V3} from '../core/types';

/** Commands used by both headless tests and the real stdio MCP client. */
export function exteriorAssemblyCommands(s:Record<string,number>):Command[]{
 return[
  ...[['BUILT-091','deck'],['BUILT-096','balcony'],['BUILT-097','rail'],['BUILT-098','apron'],['BUILT-099','canopies'],['BUILT-100','column'],['BUILT-101','sign']].map(([catalogId,id])=>({op:'produceCatalogAsset',catalogId,id})),
  {op:'produceCatalogAsset',catalogId:'BUILT-007',id:'stairs',params:{width:1.6}},
  {op:'instance',id:'deck-1',assetId:'deck',position:[0,0,0]},
  {op:'connect',id:'stairs-1',assetId:'stairs',portId:'top-walkway',targetInstanceId:'deck-1',targetPortId:'entry',rotation:0},
  {op:'createAsset',id:'balcony-wall',name:'阳台安装墙 · 验证辅件',template:'empty',cellSize:.02},
  {op:'voxels',assetId:'balcony-wall',mode:'fill',region:{min:[0,0,0],max:[140,180,12]},material:s.wall},
  {op:'voxels',assetId:'balcony-wall',mode:'fill',region:{min:[8,46,-12],max:[24,50,0]},material:s.metal},
  {op:'voxels',assetId:'balcony-wall',mode:'fill',region:{min:[116,46,-12],max:[132,50,0]},material:s.metal},
  {op:'metadata',assetId:'balcony-wall',ports:[{id:'balcony',kind:'balcony-wall',position:[1.4,1.6,0],normal:[0,0,-1],size:[2.8,1.2,0],pitch:.02}]},
  {op:'instance',id:'wall-1',assetId:'balcony-wall',position:[10,0,2.4]},
  {op:'connect',id:'balcony-1',assetId:'balcony',portId:'wall',targetInstanceId:'wall-1',targetPortId:'balcony',rotation:0},
  {op:'connect',id:'rail-1',assetId:'rail',portId:'bottom',targetInstanceId:'balcony-1',targetPortId:'rail',rotation:0},
  {op:'instance',id:'apron-left',assetId:'apron',position:[18,0,0]},
  {op:'instance',id:'apron-right',assetId:'apron',position:[34,0,1.6],rotation:2},
  {op:'instance',id:'canopies-1',assetId:'canopies',position:[38,3.6,0]},
  ...[.6,2.4,7.6,9.4].map(x=>({op:'connect',id:'column-'+Math.round(x*100),assetId:'column',portId:'top',targetInstanceId:'canopies-1',targetPortId:'column-'+Math.round(x*100),rotation:0})),
  {op:'connect',id:'sign-1',assetId:'sign',portId:'hanger',targetInstanceId:'canopies-1',targetPortId:'sign',rotation:0},
 ];
}
export const exteriorClearances=[
 {name:'观景层入口与平台净空',min:[2.5,1.8,-.4] as V3,max:[3.9,3.8,2.8] as V3},
 {name:'两侧7m接台之间中央2m入口',min:[25.04,0,-1] as V3,max:[26.96,2.8,3] as V3},
 {name:'双侧店檐间4m入口',min:[41.04,0,-1] as V3,max:[44.96,3.4,5.6] as V3},
];
