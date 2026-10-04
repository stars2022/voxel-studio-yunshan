import type {Command,V3} from '../core/types';
import type {WaterFlow} from '../core/water-flow';
import {compileHydrologyScene,composeHydrology} from './hydrology-composition';
import {makeEcologyAsset} from './atlas-ecology';
import {Shapes} from './shapes';
const make=(catalogId:string,id:string,params:Record<string,number|string>={}):Command=>({op:'produceCatalogAsset',catalogId,id,params});
const create=(id:string,name:string):Command=>({op:'createAsset',id,name,cellSize:.2,template:'empty'});
const box=(assetId:string,min:V3,max:V3,material:number):Command=>({op:'voxels',assetId,mode:'fill',region:{min,max},material});
const put=(id:string,assetId:string,position:V3):Command=>({op:'instance',id,assetId,position,rotation:0});
const floor=(s:Record<string,number>,min:V3,max:V3):Command[]=>[create('ground','明确作者承托岩地（辅助；非原terrainHeight）'),box('ground',min,max,s.bedrock),put('ground-1','ground',[0,0,0])];
const flow=(s:Record<string,number>,points:V3[]):WaterFlow=>({routes:[{points,startDistanceM:0}],materialIds:[s.flowWater,s.fallWater,s.waterFoam],animated:false,originalRouteBound:false});
export function ecologyHeadCommands(s:Record<string,number>):Command[]{return compileHydrologyScene([
 make('ENV-037','head',{waterWidth:24}),make('ENV-028','fall'),create('support','主瀑作者薄崖背托和下方承水池；未受力认证'),
 box('support',[-75,0,-35],[75,1,65],s.bedrock),box('support',[-70,1,59],[70,746,60],s.bedrock),box('support',[-60,1,-30],[60,2,0],s.flowWater),
 put('support-1','support',[0,0,0]),put('head-1','head',[0,149.2,0]),put('fall-1','fall',[-12,.4,-1.4]),
 ],s,'head-union',flow(s,[[0,153.4,12],[.6,153.4,6],[0,153.4,0],[0,153.4,-.2],[0,.4,-.2],[0,.4,-6]]));}
export const ecologyHeadClearances=[{name:'薄崖与瀑帘之间的真实净空',min:[-11,2,.2] as V3,max:[11,148,11.6] as V3}];
export function ecologyBankCommands(s:Record<string,number>):Command[]{return[...['gentle','steep','shingle'].flatMap((bankProfile,i)=>[make('ENV-038',bankProfile,{bankProfile}),put(bankProfile+'-1',bankProfile,[i*12,.2,0])]),...floor(s,[-5,0,-5],[165,1,65]),make('ENV-037','small-head',{waterWidth:4}),put('small-head-1','small-head',[44,.2,0]),create('head-floor','小源溪另设实岩地'),box('head-floor',[190,0,-5],[250,1,65],s.bedrock),put('head-floor-1','head-floor',[0,0,0])];}
export const ecologyBankClearances=[{name:'缓岸与陡岸间4m检查通路',min:[8,.2,0] as V3,max:[12,1.92,12] as V3}];
export function foamPlacements():V3[]{const points:V3[]=[];for(const[n,r]of[[8,1.4],[16,2.8],[24,4.2],[32,5.6]])for(let i=0;i<n;i++){const a=(i+.25)*Math.PI*2/n;points.push([Math.round(Math.cos(a)*r*5)/5,1.2,Math.round(Math.sin(a)*r*5)/5]);}return points;}
export function ecologyFoamCommands(s:Record<string,number>):Command[]{const b=new Shapes(.2,s);b.part('作者承水圆池实岩床和岸环',()=>{for(let x=-35;x<35;x++)for(let z=-35;z<35;z++){const r=Math.hypot((x+.5)*.2,(z+.5)*.2);if(r>6.8)continue;for(let y=0;y<(r<6.4?5:8);y++)b.g.set([x,y,z],s.bedrock);if(r<6.4)b.g.set([x,5,z],s.flowWater);}});const pond=b.finish('pond','明确静态泡沫承水池（辅助）',{});
 // Compiler accepts the bounded fill subset; use the already generated native
 // pond after composing to avoid thousands of transport commands.
 const placements=foamPlacements();const commands:Command[]=[make('ENV-043','foam',{foamShape:'patch'}),...placements.map((p,i)=>put('foam-'+String(i+1).padStart(2,'0'),'foam',p))];
 // Preserve one source definition and 80 source placements, then add pond cells
 // through the same exact native union used by connected hydrology fixtures.
 return buildFoamUnion(commands,pond,s);
}
function buildFoamUnion(commands:Command[],pond:ReturnType<Shapes['finish']>,s:Record<string,number>):Command[]{const a=makeEcologyAsset('ENV-043','共享泡沫斑母版','foam',s),union=composeHydrology('foam-union',[{asset:pond,position:[0,0,0],instanceId:'pond-1'},...foamPlacements().map((position,i)=>({asset:a,position,instanceId:'foam-'+String(i+1).padStart(2,'0')}))],flow(s,[[-6,1.2,0],[6,1.2,0]]));union.source!.foamReuse={catalogMasters:1,sourcePlacements:80,gpuInstancing:false,static:true,flowFrame:'author UV frame; no fluid direction measured'};const water=new Shapes(.2,s);water.b(8,0,-1,3,.2,2,s.bedrock);water.b(8,.2,-1,3,.2,2,s.flowWater);const crestFlow=flow(s,[[8,.4,0],[11,.4,0]]),bed=water.finish('crest-water','泡脊另设静水承托样件',{waterFlow:crestFlow,frame:'author static metre UV frame'}),crest=makeEcologyAsset('ENV-043','共享泡脊形状','crest',s,{foamShape:'crest'}),crestUnion=composeHydrology('crest-union',[{asset:bed,position:[0,0,0],instanceId:'crest-water-1'},{asset:crest,position:[9,.4,0],instanceId:'crest-1'}],crestFlow);return[commands[0],{op:'installAsset',asset:pond},{op:'installAsset',asset:union},put('foam-union-1',union.id,[0,0,0]),make('ENV-043','crest',{foamShape:'crest'}),{op:'installAsset',asset:bed},{op:'installAsset',asset:crestUnion},put('crest-union-1',crestUnion.id,[0,0,0])];}
export const ecologyFoamClearances=[{name:'圆池与独立泡脊之间的检查域',min:[6.9,0,-1] as V3,max:[7.9,1.72,1] as V3}];
export function ecologyHeightsCommands(s:Record<string,number>):Command[]{return[...floor(s,[-40,0,-65],[370,1,65]),...[16,24,31].flatMap((height,i)=>[make('ENV-050','tree-'+height,{height}),put('tree-'+height+'-1','tree-'+height,[i*30,.2,0])])];}
export const ecologyHeightsClearances=[{name:'16m与24m乔木间身体通道',min:[10,.2,-6] as V3,max:[14,1.92,6] as V3}];
export function ecologySpeciesCommands(s:Record<string,number>):Command[]{return[...floor(s,[-40,0,-40],[320,1,40]),...['ENV-054','ENV-055','ENV-056','ENV-057'].flatMap((id,i)=>[make(id,id.toLowerCase()),put(id.toLowerCase()+'-1',id.toLowerCase(),[i*18,.2,0])])];}
export const ecologySpeciesClearances=[{name:'树种列前方公共通路和身体净空',min:[-6,.2,-8] as V3,max:[62,1.92,-6.6] as V3}];
export function ecologyForestCommands(s:Record<string,number>):Command[]{return[...floor(s,[-30,0,-30],[180,1,180]),make('ENV-052','proxy'),...Array.from({length:9},(_,i)=>put('tree-'+i,'proxy',[i%3*15,.2,Math.floor(i/3)*15]))];}
export const ecologyForestClearances=[{name:'九树作者样区内东西通路',min:[-5,.2,6] as V3,max:[35,1.92,9] as V3}];
export function ecologyRootsCommands(s:Record<string,number>):Command[]{return[...floor(s,[-25,0,-25],[125,1,25]),...['buttress','shallow','rockGrip'].flatMap((rootForm,i)=>[make('ENV-059',rootForm,{rootForm}),put(rootForm+'-1',rootForm,[i*10,.2,0])])];}
export const ecologyRootsClearances=[{name:'根系样段之间保留的身体通道',min:[4.2,.2,-4] as V3,max:[5.8,1.92,4] as V3}];
export function ecologyShrubsCommands(s:Record<string,number>):Command[]{return[...floor(s,[-15,0,-15],[95,1,15]),make('ENV-060','low-shrub'),make('ENV-061','flower-low',{habit:'low'}),make('ENV-061','flower-spreading',{habit:'spreading'}),put('low-shrub-1','low-shrub',[0,.2,0]),put('flower-low-1','flower-low',[7,.2,0]),put('flower-spreading-1','flower-spreading',[15,.2,0])];}
export const ecologyShrubsClearances=[{name:'低灌木与花灌木之间的人体通路',min:[2,.2,-2] as V3,max:[4.8,1.92,2] as V3}];
export const ecologyScenarios=[['head',ecologyHeadCommands,ecologyHeadClearances],['banks',ecologyBankCommands,ecologyBankClearances],['foam',ecologyFoamCommands,ecologyFoamClearances],['heights',ecologyHeightsCommands,ecologyHeightsClearances],['species',ecologySpeciesCommands,ecologySpeciesClearances],['forest',ecologyForestCommands,ecologyForestClearances],['roots',ecologyRootsCommands,ecologyRootsClearances],['shrubs',ecologyShrubsCommands,ecologyShrubsClearances]] as const;
