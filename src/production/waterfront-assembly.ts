import type {Command,V3} from '../core/types';

/** Reuses three library masters: the six piles are placements, not six assets. */
export function waterfrontAssemblyCommands():Command[]{
 return[
  ...[['BUILT-112','deck'],['BUILT-113','pile'],['BUILT-114','rail']].map(([catalogId,id]):Command=>({op:'produceCatalogAsset',catalogId,id})),
  {op:'instance',id:'deck-1',assetId:'deck',position:[0,0,0]},
  ...[0,7.8].flatMap(x=>[0,2.88,5.76].map((z):Command=>({op:'connect',id:`pile-${Math.round(x*100)}-${Math.round(z*100)}`,assetId:'pile',portId:'foot',targetInstanceId:'deck-1',targetPortId:`pile-${Math.round(x*100)}-${Math.round(z*100)}`,rotation:0}))),
  {op:'connect',id:'rail-left',assetId:'rail',portId:'bottom',targetInstanceId:'deck-1',targetPortId:'rail-left',rotation:1},
  {op:'connect',id:'rail-right',assetId:'rail',portId:'bottom',targetInstanceId:'deck-1',targetPortId:'rail-right',rotation:3},
 ];
}
export const waterfrontClearances=[
 {name:'渡口中央前后登离通道',min:[1.24,2.4,-.2] as V3,max:[7.76,4.8,7.2] as V3},
];
