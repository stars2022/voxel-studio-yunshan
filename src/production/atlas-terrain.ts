import {Shapes} from './shapes';
import {Grid} from '../core/grid';
import type {Asset,V3} from '../core/types';
import type {AtlasRecipe} from './atlas-life';
import {atlasSource} from './atlas-life';
import {productionReference,productionStyleRevision} from './style';
const runtime='作者米制候选；未取得原WorldDefinition、NetworkEdge、terrainHeight、共享FloorPlan及身体控制器。不声明原游戏集成、受力认证或人工美术验收。';
const terrainLimits='完整0.2m三维占用是物理/编辑权威，显示与碰撞均由同一原生格派生；远壳仅合并同材质共面面片，无距离自动LOD或原96m流送接入。'+runtime;
const pin=(b:Shapes,x:number,y:number,z:number)=>b.b(x,y,z,.1,.1,.1,b.s.bronze);
export const terrainBuiltRecipes:Record<string,AtlasRecipe>={
 'BUILT-309':{size:[6,3.6,4.8],pitch:.1,features:'岸侧主缆实体锚块：连续阶梯混凝土、石包面、钢锚箱、真入索孔和埋入锚板',limits:'作者主缆沿+Z，孔心[3,3,4.4]、0.4m方孔到内锚板；基底在显式岸地面落地，留出河道/路域。'+runtime,draw:b=>{
 b.part('完整基础和阶梯混凝土芯',()=>{b.b(0,0,0,6,.4,4.8,b.s.structuralConcrete);for(let z=0;z<40;z++){const h=Math.min(2.8,1.2+Math.floor(z/5)*.3);b.b(.4,.4,.4+z*.1,5.2,h,.1,b.s.structuralConcrete);}});
 b.part('连续石面与真实退层轮廓',()=>{for(const x of[.4,5.4])for(let z=0;z<40;z++){const h=Math.min(2.8,1.2+Math.floor(z/5)*.3);b.b(x,.4,.4+z*.1,.2,h,.1,b.s.wall);}b.b(.4,.4,.4,5.2,1.2,.2,b.s.wall);});
 b.part('实体钢锚箱、贯通索喉与内承板',()=>{b.b(2,2.4,3.2,2,1.2,1.6,b.s.metal);b.b(2.2,2.6,4.6,1.6,.8,.2,b.s.metalBright);b.b(2.8,2.8,3.5,.4,.4,1.3,0);b.b(2.6,2.6,3.3,.8,.8,.2,b.s.metalBright);});
 b.part('四个真实基础压脚与铜锚',()=>{for(const x of[.2,5.2])for(const z of[.2,4]){b.b(x,.3,z,.6,.4,.6,b.s.metal);pin(b,x+.2,.6,z+.2);}for(const x of[2.2,3.7])for(const y of[2.6,3.3])pin(b,x,y,4.7);});
 b.part('实体检查涂印和钢侧带',()=>{for(const x of[1.2,4.6])b.b(x,.4,.5,.2,1.1,.2,b.s.metal);b.b(2.4,3.4,4.7,.3,.1,.1,b.s.printedWarning);});
 }},
 'BUILT-310':{size:[4,8,3.2],pitch:.1,features:'八米缆车terrain支柱：实体基础、双腹板与四导轮槽、索路承面和横向维护梁',limits:'作者双承索沿+Z，导轮实际槽底Y7.8，索下表面Y7.8；原转弯线形/舱速度状态缺失，静态直线跨距样件。'+runtime,draw:b=>{
 b.part('整块基础、柱脚钢鞋和连续混凝土柱芯',()=>{b.b(.4,0,0,3.2,.4,3.2,b.s.wall);b.b(1,.4,.6,2,.2,2,b.s.metal);b.b(1.5,.6,1.1,1,6.6,1,b.s.structuralConcrete);});
 b.part('连续双钢腹板和顶部横担',()=>{for(const x of[1.3,2.5])b.b(x,.6,1,.2,6.4,1.2,b.s.metal);b.b(0,7,0,4,.3,3.2,b.s.metal);for(const x of[.5,3.3])b.b(x,7.3,0,.2,.3,3.2,b.s.metal);});
 b.part('四个钢轮与真实中央索槽',()=>{for(const x of[.6,3.4])for(const z of[.7,2.5]){for(let i=-5;i<5;i++)for(let j=-5;j<5;j++)if((i+.5)**2+(j+.5)**2<=25){const y=7.5+i*.1,zz=z+j*.1;for(const xx of[x-.3,x+.1])b.b(xx,y,zz,.2,.1,.1,b.s.cableSheave);if(y<7.8)b.b(x-.1,y,zz,.2,.1,.1,b.s.cableSheave);}b.b(x-.4,7.4,z-.1,.8,.2,.2,b.s.metalBright);}});
 b.part('实横向维护带、铜轴帽和柱脚锚',()=>{for(const y of[.6,2,4,6.4])b.b(1.3,y,1,1.4,.2,1.2,b.s.metal);for(const x of[.3,3.7])for(const z of[.7,2.5])pin(b,x,7.5,z);for(const x of[1.1,2.8])for(const z of[.7,2.4])pin(b,x,.5,z);});
 b.part('独立实涂维护标记',()=>{b.b(1.6,1,1,.3,.5,.1,b.s.printedWarning);b.b(1.6,5,1,.3,.5,.1,b.s.printedWarning);});
 }},
 'BUILT-312':{size:[6,4.4,6],pitch:.1,features:'真实滨水栈台：四根连续木桩、浸水木层、横梁木平台、石柱脚与双入口护栏',limits:'作者平台Y3.4，显示水位Y2.4；岸侧Z0与泊位侧Z6各留2m入口。合法登船权限/船体状态未绑定。'+runtime,draw:b=>{
 b.part('四个从河床贯到甲板的实木桩',()=>{for(const x of[.4,4.8])for(const z of[.4,4.8]){b.b(x,0,z,.8,2.4,.8,b.s.wetPileWood);b.b(x,2.4,z,.8,.8,.8,b.s.wood);}});
 b.part('真实承梁、横枨与独立木平台',()=>{for(const x of[.4,4.8])b.b(x,2.8,0,.8,.4,6,b.s.wood);for(const z of[.4,2.6,4.8])b.b(0,3,z,6,.2,.8,b.s.metal);b.b(0,3.2,0,6,.2,6,b.s.wood);for(let x=.2;x<6;x+=.4)b.b(x,3.3,0,.1,.1,6,b.s.woodEdge);});
 b.part('石角柱、钢柱箍与真实2m出入口',()=>{for(const x of[0,5.4])for(const z of[0,5.4]){b.b(x,3.4,z,.6,1,.6,b.s.wall);b.b(x,3.6,z,.6,.2,.6,b.s.metal);}for(const x of[.2,5.6])for(const y of[3.6,4.2])b.b(x,y,.6,.2,.1,4.8,b.s.metal);for(const z of[.2,5.6])for(const x of[.6,4])for(const y of[3.6,4.2])b.b(x,y,z,1.4,.1,.2,b.s.metal);});
 b.part('栏杆实柱和有限铜锁',()=>{for(const x of[.2,5.6])for(const z of[2,4])b.b(x,3.4,z,.2,.8,.2,b.s.metal);for(const z of[.2,5.6])for(const x of[1.8,4])b.b(x,3.4,z,.2,.8,.2,b.s.metal);for(const x of[.2,5.6])for(const z of[.2,5.6])pin(b,x,4.3,z);});
 b.part('桩面附生苔层和独立涂印',()=>{for(const x of[.4,4.8])for(const z of[.4,4.8])b.b(x,1.6,z-.1,.6,.6,.1,b.s.moss);for(const z of[.1,5.8])b.b(2,3.3,z,2,.1,.1,b.s.printedWarning);});
 }},
 'BUILT-316':{size:[1.2,4,5],pitch:.1,features:'新作住宅悬挑承梁候选：墙背板、连续五米上梁、双斜撑、真端承帽和独立连接件',limits:'原截面/跨度/数量未获共享方案，原安装0；本体是作者5m深单梁研究，梁端承托中心为原点。仅装在显式试验墙上，无住宅楼板/栏杆/可走面，不改旧recipe。'+runtime,draw:b=>{
 b.part('真实墙背板、双边柱与上梁',()=>{b.b(0,0,0,1.2,4,.4,b.s.metal);b.b(0,3.2,.4,1.2,.6,4.6,b.s.metal);for(const x of[0,1])b.b(x,0,.4,.2,3.2,.2,b.s.metal);});
 b.part('双斜撑和实心端承帽',()=>{for(const x of[.2,.8])b.beam([x,.5,.5],[x,3.3,4.7],.2,b.s.metal);b.b(0,3.8,.6,1.2,.2,4.4,b.s.wall);});
 b.part('独立木饰腹板和金属分段压件',()=>{b.b(.1,3.3,.6,1,.4,4.2,b.s.wood);for(const z of[.8,2,3.2,4.6])b.b(0,3.2,z,1.2,.6,.2,b.s.metal);});
 b.part('铜安装锚、侧盖和非发光实涂标记',()=>{for(const x of[.1,1])for(const y of[.2,1.8,3.8])pin(b,x,y,.3);for(const z of[1,4]){b.b(0,3.4,z,.1,.2,.6,b.s.printedWarning);b.b(1.1,3.4,z,.1,.2,.6,b.s.printedWarning);}});
 }},
};
export function terrainMaterialRule(id:string){const r:Record<string,string[]>={'BUILT-309':['structuralConcrete','wall','metal','metalBright','bronze','printedWarning'],'BUILT-310':['wall','metal','structuralConcrete','cableSheave','metalBright','bronze','printedWarning'],'BUILT-312':['wetPileWood','wood','woodEdge','metal','wall','bronze','moss','printedWarning'],'BUILT-316':['metal','wall','wood','bronze','printedWarning']};if(!r[id])return;return{required:r[id],allowed:r[id],note:'岸锚混凝土/石面、承索钢轮、浸水木桩/苔层和住宅梁钢木饰面按真实用途独立赋值。'};}
export function configureTerrainBuiltAsset(a:Asset,id:string){if(!terrainBuiltRecipes[id])return;a.source!.runtime={originalStateBound:false,originalGameFinalPass:false,structuralAnalysis:false};
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-309'){a.source!.anchor={cableBoreM:{min:[2.8,2.8,3.5],max:[3.2,3.2,4.8]},innerPlateZM:3.5,terrainOriginal:false};port('cable','main-cable',[3,3,4.8],[0,0,1],[.4,.4,0]);}
 if(id==='BUILT-310'){a.source!.guide={cableBottomYM:7.8,cableXsM:[.6,3.4],cableDirection:[0,0,1],straightSpanOnly:true};}
 if(id==='BUILT-312'){a.source!.wharf={walkYM:3.4,waterlineYM:2.4,entryWidthM:2,boardingStateBound:false};for(const z of[0,6]){a.openings.push({min:[20,34,z===0?0:56],max:[40,52,z===0?4:60]});port(z===0?'shore':'berth','wharf-walk',[3,3.4,z],[0,0,z===0?-1:1],[2,0,0]);}}
 if(id==='BUILT-316'){// Explicit local origin is the end-bearing centre, per the catalogue contract.
 a.origin=[-.6,-4,-4.8];for(const p of a.ports)p.position=p.position.map((v,d)=>v+a.origin[d]) as V3;
 port('bearing','residential-beam',[0,0,0],[0,1,0],[1.2,0,.4]);a.source!.residential={sourceInstalled:0,authorStudyOnly:true,authorDepthM:5,sharedSectionApproved:false,walkSurfaceAdded:false,originBasis:'end-bearing-centre'};}
}
export const terrainGeology={jointDomainM:24,stepM:8,physicalPitchM:.2} as const;
const mod=(a:number,b:number)=>((a%b)+b)%b;
// Deterministic global-coordinate descriptor. Every sample is a 0.2m column;
// the arch below explicitly subtracts a 3D volume and cannot use this as a heightfield.
export function terrainHeightCells(id:string,x:number,z:number){const X=x*.2,Z=z*.2,edge=1.1*Math.sin(X*.85)+.6*Math.sin(X*1.8),j=(mod(Math.floor(x/6)+Math.floor(z/7),4)===0?1:0);
 switch(id){
 case'ENV-001':return 30+Math.round(3*Math.sin(X*.35)+2*Math.sin(Z*.4))-j;
 case'ENV-005':return Math.round(terrainGeology.stepM/terrainGeology.physicalPitchM)*(Z>7.8+edge?2:1)-j;
 case'ENV-006':return (Z>5.8+edge?90:Z>2.6+.5*edge?35:12)-j;
 case'ENV-008':return (Z>9+edge?60:Z>4.8+edge?38:Z>1.8+.3*edge?17:8)-j;
 case'ENV-010':{const ridge=28+20*Math.pow(Math.abs(X-11)/11,1.5),side=Math.max(0,1-Math.abs(Z-7)/7);return Math.max(5,Math.round(5+(ridge-5)*side))-j;}
 case'ENV-011':return Math.max(3,Math.round(3+Z*1.25+3*Math.sin(X*.4)*Z/12));
 case'ENV-012':{const center=riverCenterXM(Z),dist=Math.abs(X-center);return dist<2?3:dist<3?8:dist<4+edge*.2?16:26-j;}
 case'ENV-013':return 46+Math.round(2*Math.sin(X*.8)+Math.sin(Z));
 default:throw new Error('Unimplemented terrain descriptor '+id);
 }}
export const riverCenterXM=(z:number)=>10+1.2*Math.sin(z*.4);
export function archCeilingCells(x:number,z:number){const X=(x+.5)*.2,Z=(z+.5)*.2;return Math.floor((4.8+1.2*(1-Math.abs(X-6)/3)+.2*Math.sin(Z))/.2);}
function terrainDraw(b:Shapes,id:string,w:number,d:number,tileX=0){const nx=Math.round(w/.2),nz=Math.round(d/.2),ox=tileX*120,heights=new Int16Array(nx*nz);for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)heights[x+z*nx]=terrainHeightCells(id,x+ox,z);
 b.part('连续完整基岩体：逐0.2米占用',()=>{for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)for(let y=0;y<heights[x+z*nx];y++){if(id==='ENV-013'&&x>=15&&x<45&&y<archCeilingCells(x,z))continue;b.g.set([x,y,z],b.s.bedrock);}});
 b.part('实际风化层、节理浅槽与暴露岩面',()=>{for(const[v]of b.g.cells()){const[x,y,z]=v,band=mod(y+Math.floor(x/14)+Math.floor(z/11),9);if(band<2||mod(Math.floor(x/7)+Math.floor(z/8),4)===0)b.g.set(v,b.s.weatheredRock);}
 // Finite shallow joints cut actual exposed side cells, never split the basal rock.
 for(let z=1;z<nz-1;z++)for(let x=1;x<nx-1;x++)if(mod(x+ox+Math.floor(z/17),13)===0){const top=heights[x+z*nx];for(let y=3;y<top-2;y++){if(!b.g.get([x,y,z-1])&&b.g.get([x,y,z+1]))b.g.set([x,y,z],0);}}
 });
 b.part('真实顶面表土斑片，与岩石角色独立',()=>{for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const h=heights[x+z*nx],patch=Math.sin((x+ox)*.16)+Math.cos(z*.23);if(patch>.25&&!(id==='ENV-012'&&h<16))b.g.set([x,h-1,z],b.s.surfaceSoil);}});
 b.part('贴生苔层仅在真实地面上附着',()=>{for(let z=1;z<nz-1;z++)for(let x=1;x<nx-1;x++){const h=heights[x+z*nx];if(Math.sin((x+ox)*.25)*Math.cos(z*.31)>.6&&!(id==='ENV-012'&&h<16))b.g.set([x,h,z],b.s.moss);}});
 b.part('稀疏灌木冠层：每柱从该格地面起生',()=>{for(let z=8;z<nz-5;z+=19)for(let x=8;x<nx-5;x+=23){if(mod(Math.floor((x+ox)/23)+Math.floor(z/19),3))continue;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,zz=z+dz,h=heights[xx+zz*nx];if(id==='ENV-012'&&h<16)continue;const n=Math.max(1,4-Math.abs(dx)-Math.abs(dz));for(let y=0;y<n;y++)b.g.set([xx,h+y,zz],b.s.shrubFoliage);}}});
 if(id==='ENV-011')b.part('坡脚大中小真实角砾，逐柱落地并保持底部连通',()=>{for(const[cx,cz,r,h]of[[4,9,1.8,1.8],[11,9,1.4,1.6],[7,6,1.2,1.2],[3,4,.8,.8],[12,4,.8,.8],[8,2,.6,.6],[2,1,.4,.4],[14,1,.4,.4]])for(let z=Math.round((cz-r)/.2);z<Math.round((cz+r)/.2);z++)for(let x=Math.round((cx-r)/.2);x<Math.round((cx+r)/.2);x++){const t=Math.abs((x+.5)*.2-cx)/r+Math.abs((z+.5)*.2-cz)/r;if(t>1.5)continue;const top=heights[x+z*nx],n=Math.max(1,Math.round(h/.2*(1-t*.5)));for(let y=0;y<n;y++)b.g.set([x,top+y,z],y===n-1?b.s.weatheredRock:b.s.bedrock);}});
 if(id==='ENV-012')b.part('独立非碰撞显示水层，开放上下游且不含道路',()=>{for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)if(heights[x+z*nx]===3)for(let y=3;y<6;y++)b.g.set([x,y,z],b.s.water);});
}
const env:(readonly[string,V3,string,string])[]=[
 ['ENV-001',[24,8,16],'连续岩土表面：细格统一描述、完整岩芯、真节理浅槽、表土苔层与稀疏灌丛','相邻24m作者块用全局X采样，tileX只改变采样/米制锚点，非原96m系统。'],
 ['ENV-005',[terrainGeology.jointDomainM,17,16],'24米节理域分层岩台：8米级差、不等宽岩沿、浅节理和真实上下平台','保留24m节理域与8m台阶参数；仅高度场岩台，不声称悬挑。'],
 ['ENV-006',[16,19,12],'高陡连续崖壁：低台、次级肩台和18米顶台，竖直断面与横向节理连续','连续实体崖面不靠埋入装饰盒填高；作者界线与上下台面明确。'],
 ['ENV-008',[18,13,14],'不等宽错层岩台：四段自然岩阶、崖沿浅槽、表土与贴生植物','独立天然地质空间，没有城市铺面或虚构交通授权。'],
 ['ENV-010',[22,11,14],'双峰连续山脊和中部低鞍：脊顶/脊侧连续，渐降两侧与开放鞍部','原交通路线未取得；作者样件在中央低鞍检查身体空间，不将原运输域埋入新地形。'],
 ['ENV-011',[16,8,12],'连续碎石坡与大中小角砾：上坡大块、中坡碎岩、低处小石且逐柱贴地','碎石不另计模型，未占用原河道/人行域；保留独立作者空通道。'],
 ['ENV-012',[20,6,14],'弯曲河床切槽：完整低床、开放两端、退层岩岸和独立显示水层','原单河中心线、水位和潭形未取得；作者中心X=10+1.2sin(0.4Z)，槽宽4m、水面1.2m、床0.6m，不宣称原河复原/流体。'],
 ['ENV-013',[12,11,8],'三维天然穿洞：两实岩腿、拱顶连续体、真实穿透洞与悬挑岩檐','明确三维占用减洞；洞底0、保守净空X3.6–8.4/Y0–4.6全进深，单值高度场不能替代。'],
];
export const environmentRecipes:Record<string,AtlasRecipe>=Object.fromEntries(env.map(([id,size,features,limits])=>[id,{size,pitch:.2,features,limits:limits+terrainLimits,draw:(b:Shapes,w:number,_h:number,d:number)=>terrainDraw(b,id,w,d)}]));
export const environmentParameters=(id:string)=>id==='ENV-001'?{tileX:{type:'integer',minimum:-8,maximum:8,default:0,description:'24m作者接续块，原生原点与全局采样同步'}}:{};
export function inspectEnvironmentMaterials(id:string,a:Asset,roles:Record<string,number>){if(!environmentRecipes[id])return null;const required=['bedrock','weatheredRock','surfaceSoil','moss','shrubFoliage',...(id==='ENV-012'?['water']:[])],used=new Set([...new Grid(a.chunks).cells()].map(([,m])=>m));for(const r of required)if(!used.has(roles[r]))throw new Error(id+' missing '+r);for(const m of used)if(!required.some(r=>roles[r]===m))throw new Error(id+' unexpected material '+m);return{revision:1,method:'authored-use-and-actual-voxel-check',note:'完整基岩、风化岩层、soil表土、非碰撞苔层/灌木及河面水分别赋值；所有格点占用为原生权威。'};}
export function makeEnvironmentAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Record<string,number|string>={}):Asset{const r=environmentRecipes[catalogId];if(!r)throw new Error('尚无已实现地形母版');if(Object.keys(params).some(k=>k!=='tileX')||params.tileX!==undefined&&(catalogId!=='ENV-001'||typeof params.tileX!=='number'||!Number.isInteger(params.tileX)||Math.abs(params.tileX)>8))throw new Error('地形参数未经验证');const tileX=Number(params.tileX??0),s=new Proxy(style,{get(t,k){if(typeof k==='symbol')return Reflect.get(t,k);if(!Number.isInteger(t[k])||t[k]<1||t[k]>65535)throw new Error('缺少地形材质角色 '+k);return t[k];}}),b=new Shapes(.2,s);terrainDraw(b,catalogId,r.size[0],r.size[2],tileX);if(b.g.count>1_000_000)throw new Error('地形单母版超过占用预算');const bounds=b.g.bounds()!,a=b.finish(id,name,{kind:'catalog-recipe',catalogId,recipeRevision:3,styleReference:productionReference,styleRevision:productionStyleRevision,dimensionsM:bounds.max.map((v,i)=>(v-bounds.min[i])*.2),envelopeM:r.size,parameters:params,features:r.features,geometryStage:'candidate',gameIntegration:false,animation:false,units:'metres',front:'-Z',reference:atlasSource(catalogId),referenceStage:'candidate',limitations:r.limits,dimensionBasis:'author metre envelope, actual full 0.2m occupancy',terrain:{physicalPitchM:.2,editPitchM:.2,displaySource:'native occupancy',collisionSource:'native occupancy',volumeCave:catalogId==='ENV-013',jointDomainM:catalogId==='ENV-005'?terrainGeology.jointDomainM:null,stepM:catalogId==='ENV-005'?terrainGeology.stepM:null,originalWorldBound:false,autoLOD:false}});a.origin=[tileX*24,0,0];for(const p of a.ports)p.position[0]+=tileX*24;if(catalogId==='ENV-013')a.openings.push({min:[18,0,0],max:[42,23,40]});if(catalogId==='ENV-012')a.source!.river={centerline:'X=10+1.2sin(0.4Z)',waterlineYM:1.2,bedYM:.6,channelWidthM:4,originalCenterlineBound:false,flowSimulation:false};a.source!.materialAssignmentReview=inspectEnvironmentMaterials(catalogId,a,style);return a;}
