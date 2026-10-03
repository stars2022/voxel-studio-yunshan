import type {Command,V3} from '../core/types';

/** Public document commands only. A support is a reusable auxiliary master,
 * not a duplicated catalogue asset or claimed game FloorPlan integration. */
export function legacyStairAssemblyCommands(s:Record<string,number>):Command[]{
 return[
  {op:'produceCatalogAsset',catalogId:'BUILT-062',id:'legacy-stair'},
  {op:'produceCatalogAsset',catalogId:'BUILT-057',id:'well-floor'},
  {op:'createAsset',id:'floor-bearing',name:'40mm 楼板承柱 · 拼装辅件',template:'empty',cellSize:.04},
  {op:'voxels',assetId:'floor-bearing',mode:'fill',region:{min:[0,0,0],max:[10,60,10]},material:s.wood},
  {op:'voxels',assetId:'floor-bearing',mode:'fill',region:{min:[0,0,0],max:[10,4,10]},material:s.stone},
  {op:'voxels',assetId:'floor-bearing',mode:'fill',region:{min:[0,56,0],max:[10,60,10]},material:s.metal},
  {op:'metadata',assetId:'floor-bearing',ports:[{id:'top',kind:'legacy-floor-bearing',position:[.2,2.4,.2],normal:[0,1,0],size:[.4,0,.4],pitch:.04}]},
  {op:'instance',id:'stair-1',assetId:'legacy-stair',position:[2,0,.4]},
  {op:'connect',id:'floor-1',assetId:'well-floor',portId:'stair-top',targetInstanceId:'stair-1',targetPortId:'top-walkway',rotation:0},
  ...[.4,6.0].flatMap(x=>[.4,6.0].map(z=>({op:'connect',id:'bearing-'+Math.round(x*100)+'-'+Math.round(z*100),assetId:'floor-bearing',portId:'top',targetInstanceId:'floor-1',targetPortId:'bearing-'+Math.round(x*100)+'-'+Math.round(z*100),rotation:0}))),
 ];
}

export function legacyGateAssemblyCommands(s:Record<string,number>):Command[]{
 return[
  {op:'produceCatalogAsset',catalogId:'BUILT-064',id:'gate-frame'},
  {op:'produceCatalogAsset',catalogId:'BUILT-063',id:'gate-leaf'},
  {op:'produceCatalogAsset',catalogId:'BUILT-054',id:'paper-lantern'},
  {op:'createAsset',id:'mount-wall',name:'壁灯安装木墙 · 拼装辅件',template:'empty',cellSize:.02},
  {op:'voxels',assetId:'mount-wall',mode:'fill',region:{min:[0,0,0],max:[36,130,6]},material:s.wood},
  {op:'voxels',assetId:'mount-wall',mode:'fill',region:{min:[12,48,-5],max:[24,50,0]},material:s.metal},
  {op:'metadata',assetId:'mount-wall',ports:[{id:'lamp',kind:'legacy-lantern-wall',position:[.36,1.72,0],normal:[0,0,-1],size:[.24,1.44,0],pitch:.02}]},
  {op:'instance',id:'gate-1',assetId:'gate-frame',position:[0,0,0]},
  {op:'connect',id:'leaf-1',assetId:'gate-leaf',portId:'hinge-right',targetInstanceId:'gate-1',targetPortId:'open-leaf-left',rotation:0},
  {op:'instance',id:'wall-1',assetId:'mount-wall',position:[3.2,0,1]},
  {op:'connect',id:'lamp-1',assetId:'paper-lantern',portId:'wall-mount',targetInstanceId:'wall-1',targetPortId:'lamp',rotation:0},
 ];
}

export function legacyStairClearances():{name:string;min:V3;max:V3}[]{
 const out:{name:string;min:V3;max:V3}[]=[];
 for(let i=0;i<10;i++){const y=.48+i*.24,z=.8+i*.4;out.push({name:'旧楼十级 '+(i+1)+' · 0.8m宽 / 1.92m净高',min:[2.8,y+.04,z+.04],max:[3.6,y+1.96,z+.32]});}
 out.push({name:'顶台至四片楼板',min:[2.8,2.68,4.84],max:[3.6,4.60,6.20]});return out;
}
export const legacyGateClearances=[{name:'墙侧展开门扇 · 门前6m通道',min:[.52,.04,-6] as V3,max:[1.88,2.44,.68] as V3}];
