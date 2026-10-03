import type {Command,V3} from '../core/types';

export function joineryAssemblyCommands(s:Record<string,number>):Command[]{
 return[
  ...[['BUILT-065','lattice'],['BUILT-067','frame'],['BUILT-068','panel'],['BUILT-070','arm'],['BUILT-071','lantern'],['BUILT-073','eave'],['BUILT-074','brackets']].map(([catalogId,id])=>({op:'produceCatalogAsset',catalogId,id})),
  {op:'instance',id:'frame-1',assetId:'frame',position:[0,0,0]},
  {op:'connect',id:'panel-1',assetId:'panel',portId:'bottom',targetInstanceId:'frame-1',targetPortId:'panel',rotation:0},
  {op:'connect',id:'lattice-1',assetId:'lattice',portId:'sill',targetInstanceId:'panel-1',targetPortId:'lattice',rotation:0},
  {op:'createAsset',id:'wall',name:'灯杆安装墙 · 验证辅件',template:'empty',cellSize:.02},
  {op:'voxels',assetId:'wall',mode:'fill',region:{min:[0,0,0],max:[24,150,10]},material:s.wall},
  {op:'voxels',assetId:'wall',mode:'fill',region:{min:[5,71,-7],max:[19,75,0]},material:s.metal},
  {op:'metadata',assetId:'wall',ports:[{id:'arm',kind:'joinery-lantern-arm',position:[.24,2.06,0],normal:[0,0,-1],size:[.28,1.12,0],pitch:.02}]},
  {op:'instance',id:'wall-1',assetId:'wall',position:[4.06,0,.98]},
  {op:'connect',id:'arm-1',assetId:'arm',portId:'wall',targetInstanceId:'wall-1',targetPortId:'arm',rotation:0},
  {op:'connect',id:'lantern-1',assetId:'lantern',portId:'hanger',targetInstanceId:'arm-1',targetPortId:'lantern',rotation:0},
  {op:'createAsset',id:'bracket-support',name:'成对斗拱承柱 · 验证辅件',template:'empty',cellSize:.02},
  {op:'voxels',assetId:'bracket-support',mode:'fill',region:{min:[0,0,0],max:[150,8,64]},material:s.stone},
  ...[24,110].map(x=>({op:'voxels',assetId:'bracket-support',mode:'fill',region:{min:[x,8,44],max:[x+16,80,60]},material:s.wood})),
  {op:'metadata',assetId:'bracket-support',ports:[{id:'top',kind:'joinery-bracket-bearing',position:[1.5,1.6,1.04],normal:[0,1,0],size:[2.52,0,.32],pitch:.02}]},
  {op:'instance',id:'support-1',assetId:'bracket-support',position:[8,0,0]},
  {op:'connect',id:'brackets-1',assetId:'brackets',portId:'wall',targetInstanceId:'support-1',targetPortId:'top',rotation:0},
  {op:'connect',id:'eave-1',assetId:'eave',portId:'bottom',targetInstanceId:'brackets-1',targetPortId:'roof',rotation:0},
 ];
}
export const joineryClearances=[{name:'柱间下窗安装后前侧步道',min:[.44,.04,-1.2] as V3,max:[2.76,2.0,-.08] as V3}];
