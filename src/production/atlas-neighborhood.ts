import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';
const limit='清单没有提供原Building/FloorPlan、terrain、RoofRegion或运动控制器；尺寸除注明外均为作者米制安装样件。碰撞与可见几何同源于原生体素，不声明原游戏集成、连续W运行或人工美术验收。';
const pin=(b:Shapes,x:number,y:number,z:number,t=b.pitch)=>b.b(x,y,z,t,t,t,b.s.bronze);
export const contourBottoms=[0,.2,.4,.2];
export const courtStepRuns=[0,.4,.8,1.2,2.8,3.2,3.6,4];
export function lowRampTop(i:number){return i<20?.2:i>=220?1.2:.2+Math.round(20*(i-20)/199)*.05;}
function flatGuard(w:number,feature:string):AtlasRecipe{return{size:[w,1.1,.2],pitch:.05,features:feature,limits:'独立栏件，放在明确半转平台/上层井边；不烘入台阶。'+limit,draw:b=>{
 b.part('连续钢底轨和三根立柱',()=>{b.b(0,0,0,w,.1,.2,b.s.metal);for(const x of[0,w/2-.1,w-.2])b.b(x,0,0,.2,1.1,.2,b.s.metal);});
 b.part('连续顶杆和真实薄玻璃',()=>{b.b(0,1,0,w,.1,.2,b.s.metal);for(const x of[.2,w/2+.1])b.b(x,.2,.1,w/2-.3,.8,.05,b.s.glass);});
 b.part('石柱肩与独立光芯',()=>{for(const x of[0,w-.2]){b.b(x,.85,0,.2,.15,.2,b.s.wall);b.b(x+.05,.3,0,.1,.45,.05,b.s.warm);}});
 b.part('实际铜顶锁',()=>{for(const x of[.05,w/2-.05,w-.15])pin(b,x,1.05,.05,.05);});
}};}
const stairFlight:AtlasRecipe={size:[.2,2.5,3.2],pitch:.05,features:'八级0.2m梯段配套单侧扶栏：逐级钢足、连续阶梯顶杆、实际玻璃和端部灯柱',limits:'本件只含扶栏，第一步顶为局部Y=0，逐步升高0.2m，共八个踏面安装带；实际台阶须另装。'+limit,draw:b=>{
 b.part('沿八个真实踏面安装的钢足与立柱',()=>{for(let i=0;i<8;i++){b.b(0,i*.2,i*.4,.2,.1,.4,b.s.metal);b.b(0,i*.2,i*.4,.2,1.1,.1,b.s.metal);}});
 b.part('阶梯连续顶杆和薄玻璃',()=>{for(let i=0;i<8;i++){b.b(0,i*.2+1,i*.4,.2,.1,.4,b.s.metal);if(i<7)b.b(0,i*.2+1,i*.4+.35,.2,.3,.05,b.s.metal);b.b(.1,i*.2+.1,i*.4+.1,.05,.9,.3,b.s.glass);}});
 b.part('首尾灯柱的石肩和光芯',()=>{for(const [y,z]of[[0,0],[1.4,2.8]]){b.b(0,y+.85,z,.2,.15,.1,b.s.wall);b.b(0,y+.25,z,.05,.4,.1,b.s.warm);}});
 b.part('八组独立铜锚',()=>{for(let i=0;i<8;i++)pin(b,.05,i*.2+.05,i*.4+.05,.05);});
}};
export const neighborhoodVariants:Record<string,Record<string,AtlasRecipe>>={'BUILT-242':{stairFlight,halfTurn:flatGuard(3.6,'3.6m半转平台背边扶栏：开放内侧、玻璃防护和三柱连接'),upperWell:flatGuard(3.2,'3.2m上层井边扶栏：真实玻璃和连续钢顶杆，留出上行出口')}};
export const neighborhoodRecipes:Record<string,AtlasRecipe>={
 'BUILT-225':{size:[3.2,6.4,2.4],pitch:.1,features:'双层连廊端支座：混凝土柱芯、阶梯石脚、两道实体悬臂和真实橡胶承托',limits:'作者楼层底面3.2/6.4m；支座顶3.2/6.4m与连廊、背侧楼层直接接触，非装饰柱。未进行结构受力认证。'+limit,draw:b=>{
  b.part('有限阶梯基础和连续柱芯',()=>{b.b(0,0,0,1.6,.3,2.4,b.s.wall);b.b(.2,.3,.2,1.2,.3,2,b.s.metal);b.b(.4,.6,.4,.8,5.8,1.6,b.s.structuralConcrete);});
  b.part('实际分层石包面',()=>{for(let y=.6;y<6.3;y+=.4){b.b(.3,y,.3,1,Math.min(.3,6.4-y),1.8,b.s.wall);b.b(.4,y,.4,.8,Math.min(.3,6.4-y),1.6,b.s.structuralConcrete);}});
  b.part('两层悬臂承梁、钢端板和橡胶托面',()=>{for(const top of[3.2,6.4]){b.b(.3,top-.6,.3,2.9,.4,1.8,b.s.structuralConcrete);for(const z of[.3,2])b.b(.3,top-.6,z,2.9,.4,.1,b.s.metal);b.b(2.8,top-.4,.3,.4,.2,1.8,b.s.metal);b.b(1.2,top-.2,.4,1.8,.2,1.6,b.s.bridgeBearing);}});
  b.part('柱面内嵌灯带与铜锚',()=>{b.b(.6,.9,.3,.4,1.4,.1,b.s.warm);b.b(.6,3.5,.3,.4,2,.1,b.s.warm);for(const y of[.2,2.9,6.1])for(const x of(y===.2?[.1,1.3]:[.4,2.9]))pin(b,x,y,y===.2?.1:.3,.1);});
 }},
 'BUILT-232':{size:[8,1.6,6],pitch:.1,features:'有限L形台地：四段不同底高、真实混凝土芯、分格石铺、挡土皮和缺角边界',limits:'作者8×6m台地扣去右后2×2m；四个2m宽底高带0/0.2/0.4/0.2m，台顶1.6m。必须与明确试验terrain逐段接合；不会填补旧地形漏洞。'+limit,draw:b=>{
  b.part('四段正高实体与L形缺角',()=>{for(let i=0;i<4;i++){const y=contourBottoms[i],d=i===3?4:6;b.b(i*2,y,0,2,1.4-y,d,b.s.structuralConcrete);}});
  b.part('有限挡土石面与灰缝',()=>{for(let i=0;i<4;i++){const y=contourBottoms[i],d=i===3?4:6;for(const z of[0,d-.1]){b.b(i*2,y,z,2,1.4-y,.1,b.s.mortar);for(let yy=y;yy<1.3;yy+=.4)for(let j=0;j<2;j++)b.b(i*2+j,yy,z,.9,Math.min(.3,1.4-yy),.1,b.s.wall);}}});
  b.part('灰缝床和实际铺面',()=>{for(let i=0;i<16;i++){const d=i>=12?4:6;b.b(i*.5,1.4,0,.5,.2,d,b.s.mortar);for(let j=0;j<d*2;j++)b.b(i*.5,1.5,j*.5,.4,.1,.4,b.s.wall);}});
  b.part('缺角收边和角部钢铜连接',()=>{for(const[x,z]of[[0,0],[7.7,0],[7.7,3.7],[5.7,3.7],[5.7,5.7],[0,5.7]]){b.b(x,1.3,z,.3,.3,.3,b.s.metal);pin(b,x+.1,1.5,z+.1,.1);}});
 }},
 'BUILT-233':{size:[3.6,1.8,4.4],pitch:.05,features:'双段城市外阶梯：八个0.2m真实踢高、1.2m中转平台、石踏面和实体挡土侧肩',limits:'作者净宽3m、踏深0.4m，两段各四级，中平台长1.2m，总层差1.6m；人体净空用1.72m实际体素检测。'+limit,draw:b=>{
  b.part('八级实体承芯与中转平台',()=>{courtStepRuns.forEach((z,i)=>b.b(0,0,z,3.6,(i+1)*.2,.4,b.s.structuralConcrete));b.b(0,0,1.6,3.6,.8,1.2,b.s.structuralConcrete);});
  b.part('逐踏石面、灰缝床及防滑钢鼻口',()=>{courtStepRuns.forEach((z,i)=>{const h=(i+1)*.2;b.b(.3,h-.1,z,3,.05,.4,b.s.mortar);b.b(.3,h-.05,z,3,.05,.4,b.s.wall);b.b(.4,h-.05,z,2.8,.05,.05,b.s.metal);});b.b(.3,.7,1.6,3,.05,1.2,b.s.mortar);b.b(.3,.75,1.6,3,.05,1.2,b.s.wall);});
  b.part('真实挡土侧肩和连续石压顶',()=>{for(const x of[0,3.3]){courtStepRuns.forEach((z,i)=>{const h=(i+1)*.2;b.b(x,h,z,.3,.15,.4,b.s.wall);b.b(x,h+.15,z,.3,.05,.4,b.s.metal);});b.b(x,.8,1.6,.3,.2,1.2,b.s.wall);}});
  b.part('首末侧肩暖芯和铜锁',()=>{for(const x of[0,3.3])for(const[y,z]of[[.2,0],[1.6,4]]){b.b(x+.05,y,z,.2,.1,.05,b.s.warm);pin(b,x+.1,y+.15,z+.1,.05);}});
 }},
 'BUILT-234':{size:[3.2,2.3,12],pitch:.05,features:'低坡外坡道：首尾1m平接台、10m升1m实体坡、石铺和两侧真实护栏',limits:'作者通行净宽2.8m；低顶0.2、高顶1.2m，名义坡比1:10，不声明无障碍规范认证。50mm体素台阶为真实表面，不冒称连续解析斜面。'+limit,draw:b=>{
  b.part('闭合底面与逐列实体坡芯',()=>{for(let i=0;i<240;i++)b.b(0,0,i*.05,3.2,lowRampTop(i),.05,b.s.structuralConcrete);});
  b.part('逐列石铺和砂浆床',()=>{for(let i=0;i<240;i++){const h=lowRampTop(i);b.b(.2,h-.1,i*.05,2.8,.05,.05,b.s.mortar);b.b(.2,h-.05,i*.05,2.8,.05,.05,i%10===0?b.s.mortar:b.s.wall);}});
  b.part('两侧连续钢护边、薄玻璃和实际顶杆',()=>{for(const x of[0,3])for(let i=0;i<240;i++){const h=lowRampTop(i);b.b(x,h,i*.05,.2,.1,.05,b.s.metal);b.b(x+.1,h+.1,i*.05,.05,.9,.05,b.s.glass);b.b(x,h+1,i*.05,.2,.1,.05,b.s.metal);}});
  b.part('六对柱脚、石肩、暖芯和铜帽',()=>{for(const x of[0,3])for(const z of[0,2.4,4.8,7.2,9.6,11.8]){const h=lowRampTop(Math.round(z/.05));b.b(x,h,z,.2,1.1,.2,b.s.metal);b.b(x,h+.85,z,.2,.15,.2,b.s.wall);b.b(x+.05,h+.25,z,.1,.4,.05,b.s.warm);pin(b,x+.05,h+1.05,z+.05,.05);}});
 }},
 'BUILT-235':{size:[6,3.2,.6],pitch:.05,features:'庭院低墙与开敞门框：两侧石砌围界、木过梁、薄瓦帽和2.4×2.6m真实门洞',limits:'本件不包含门扇或植物；清单要求的开敞院门保持通空。共享开口样件x1.8–4.2m、y0–2.6m，安装后验证半径0.35m通过。'+limit,draw:b=>{
  b.part('两侧低墙芯与真灰缝石面',()=>{for(const x of[0,4.6]){b.b(x,0,0,1.4,1.2,.6,b.s.mortar);for(let i=0;i<2;i++)for(let j=0;j<3;j++)b.b(x+i*.7,j*.4,0,.65,.35,.6,b.s.wall);b.b(x,1.15,0,1.4,.05,.6,b.s.metal);}});
  b.part('门柱承芯和石脚',()=>{for(const x of[1.4,4.2]){b.b(x,0,0,.4,2.9,.6,b.s.structuralConcrete);b.b(x,0,0,.4,.3,.6,b.s.wall);b.b(x+.05,.3,0,.3,2.2,.1,b.s.metal);b.b(x+.1,.6,0,.2,1.2,.05,b.s.warm);}});
  b.part('真实木过梁与薄瓦檐',()=>{b.b(1.4,2.6,.1,3.2,.3,.4,b.s.woodEdge);b.b(1.4,2.9,.05,3.2,.05,.5,b.s.waterproofMembrane);for(let i=0;i<16;i++){b.b(1.4+i*.2,2.95,0,.2,.15,.6,b.s.roof);b.b(1.45+i*.2,3.1,0,.1,.1,.6,b.s.roof);}});
  b.part('门柱金属肩、木榫和铜销',()=>{for(const x of[1.4,4.2]){b.b(x,2.45,0,.4,.15,.6,b.s.metal);b.b(x+.05,2.65,.05,.3,.15,.05,b.s.wood);pin(b,x+.15,2.5,0,.1);}});
 }},
 'BUILT-240':{size:[2.4,3.2,.8],pitch:.05,features:'垂直绿化安装架与三层空花池：真实钢背架、混凝土壳、石外皮和独立防水内衬',limits:'建筑域只含架与池壳；不含叶片、土壤、浇灌动画。三处底部排水孔贯通；安装在无门窗的明确墙段，保留通行净空。'+limit,draw:b=>{
  b.part('连续钢背架与墙面锚脚',()=>{for(const x of[0,2.2])b.b(x,0,.6,.2,3.2,.2,b.s.metal);for(const y of[0,1.1,2.1,3])b.b(0,y,.6,2.4,.2,.2,b.s.metal);});
  b.part('三层独立混凝土花池壳和石外皮',()=>{for(const y of[.4,1.4,2.4]){b.b(.2,y,0,2,.4,.7,b.s.structuralConcrete);b.b(.25,y+.05,.05,1.9,.4,.55,0);b.b(.2,y,0,2,.35,.05,b.s.wall);}});
  b.part('真实防水内衬与贯通排水孔',()=>{for(const y of[.4,1.4,2.4]){b.b(.25,y+.05,.05,1.9,.05,.55,b.s.waterproofMembrane);for(const x of[.25,2.1])b.b(x,y+.1,.05,.05,.3,.55,b.s.waterproofMembrane);for(const z of[.05,.55])b.b(.3,y+.1,z,1.8,.3,.05,b.s.waterproofMembrane);b.b(1.15,y,.3,.1,.1,.1,0);}});
  b.part('六组承托角钢和铜锁',()=>{for(const y of[.4,1.4,2.4])for(const x of[.1,2.1]){b.b(x,y-.1,.1,.2,.1,.6,b.s.metal);pin(b,x+.05,y-.05,.15,.05);}for(const x of[.05,2.25])for(const y of[.15,3.05])pin(b,x,y,.6,.1);});
 }},
 'BUILT-241':{size:[1.6,1.2,1.6],pitch:.05,features:'实体全息发射座：钢壳石脚、独立光学镜片与未绑定灯芯、真实散热缝和后部电源孔',limits:'只制作实体发射座；无全息平面、中文内容、假路标或商铺。供电与共享标识位置未绑定，发射芯保持intensity=0；不是功能性全息设备。'+limit,draw:b=>{
  b.part('实体底座和薄壁钢机壳',()=>{b.b(0,0,0,1.6,.2,1.6,b.s.wall);b.b(.1,.2,.1,1.4,.8,1.4,b.s.metal);b.b(.2,.3,.2,1.2,.6,1.2,0);});
  b.part('前部石检修盖、铜包角和真实散热缝',()=>{b.b(.45,.25,.05,.7,.7,.1,b.s.wall);for(const x of[.1,1.3])for(const z of[.1,1.3]){b.b(x,.85,z,.2,.15,.2,b.s.bronze);}for(const y of[.35,.5,.65])for(const x of[.1,1.4])b.b(x,y,.4,.1,.05,.6,0);});
  b.part('顶面镜片座、独立非激活发射芯和玻璃保护面',()=>{b.b(.2,1,.2,1.2,.1,1.2,b.s.metal);b.b(.4,1.05,.4,.8,.05,.8,b.s.projectorEmitter);b.b(.4,1.1,.4,.8,.1,.8,b.s.projectorLens);});
  b.part('后电源口与四个铜定位锚',()=>{b.b(.65,.35,1.4,.3,.3,.1,b.s.bronze);b.b(.75,.45,1.4,.1,.1,.1,0);for(const x of[.15,1.35])for(const z of[.15,1.35])pin(b,x,.15,z,.1);});
 }},
 'BUILT-242':stairFlight,
 'BUILT-243':{size:[4.8,1.2,.4],pitch:.05,features:'独立屋面边缘安全栏：石脚、四钢柱、连续顶杆和真实竖向栏条',limits:'单段4.8m母版，不烘入整屋顶；沿显式roofSupport边界布置，样件前侧作为公共出口保持开敞。不声明建筑安全规范认证。'+limit,draw:b=>{
  b.part('连续低石座与四根钢立柱',()=>{b.b(0,0,0,4.8,.15,.4,b.s.wall);for(const x of[0,1.55,3.05,4.5])b.b(x,.15,.05,.3,1.05,.3,b.s.metal);});
  b.part('两道横杆和实心钢栏条',()=>{for(const y of[.3,1.05])b.b(.1,y,.15,4.6,.1,.1,b.s.metal);for(let i=0;i<23;i++)b.b(.2+i*.2,.4,.15,.05,.65,.1,b.s.metal);});
  b.part('柱肩石块和光芯',()=>{for(const x of[0,4.5]){b.b(x,.85,.05,.3,.2,.3,b.s.wall);b.b(x+.05,.4,.05,.2,.35,.05,b.s.warm);}});
  b.part('四柱铜锁',()=>{for(const x of[.1,1.65,3.15,4.6])pin(b,x,1.15,.15,.05);});
 }},
 'BUILT-244':{size:[1.2,2.4,.2],pitch:.02,features:'独立木门扇：竖纹边梃、横纹穿带、真实嵌板榫肩、铜铰与中空拉环',limits:'作者门叶1.2×2.4m；安装试架的洞口留缝，分别保存显式关闭/90度打开摆放。没有原共享门状态，因此不自动改动通路、没有运行时开门逻辑。'+limit,draw:b=>{
  b.part('竖纹边梃与薄嵌板',()=>{for(const x of[0,1.08])b.b(x,0,.04,.12,2.4,.12,b.s.wood);b.b(.12,.12,.08,.96,2.16,.04,b.s.wood);});
  b.part('横纹上下抹头、中穿带和真实榫肩',()=>{for(const y of[0,1.08,2.28])b.b(0,y,.04,1.2,.12,.12,b.s.woodEdge);for(const y of[.12,2.16])for(const x of[.08,.96])b.b(x,y,.02,.16,.12,.16,b.s.woodEdge);});
  b.part('真实竖向木格与上下回纹',()=>{for(let i=0;i<7;i++)b.b(.22+i*.12,.28,.04,.04,1.76,.04,b.s.wood);for(const y of[.16,2.08])b.hui(.24,y,.02,.72,.16,b.s.woodEdge,.02);});
  b.part('三只铜铰、钢轴及穿空拉环',()=>{for(const y of[.3,1.1,2]){b.b(0,y,.04,.12,.16,.16,b.s.bronze);b.b(0,y,.1,.02,.16,.08,b.s.metal);b.b(.02,y,.08,.04,.16,.04,0);b.b(0,y-.02,.04,.12,.02,.16,0);}b.b(.92,1.2,.02,.12,.2,.02,b.s.metal);b.b(.92,1.2,0,.12,.2,.04,b.s.bronze);b.b(.96,1.24,0,.04,.12,.02,0);});
 }},
 'BUILT-245':{size:[2.4,1.8,.2],pitch:.02,features:'双格木窗棂：竖纹边梃、横纹压梁、退界薄玻璃、独立窗封和真实回纹木格',limits:'作者wall.window洞口2.44×1.84m，安装两侧各留20mm。镜片两面没有整块橡胶遮盖；本件不放在通行门洞。'+limit,draw:b=>{
  b.part('三根竖梃和上下横纹梁',()=>{for(const x of[0,1.12,2.24])b.b(x,0,0,.16,1.8,.2,b.s.wood);for(const y of[0,1.64])b.b(0,y,0,2.4,.16,.2,b.s.woodEdge);});
  b.part('两片退界玻璃和真实环形窗封',()=>{for(const x of[.16,1.28]){b.b(x,.16,.08,.96,1.48,.1,b.s.timberWindowSeal);b.b(x+.04,.2,.08,.88,1.4,.1,0);b.b(x+.04,.2,.12,.88,1.4,.02,b.s.glass);}});
  b.part('实际回纹木格与横竖压条',()=>{for(const x of[.16,1.28]){for(const xx of[x+.12,x+.8])b.b(xx,.16,.06,.04,1.48,.04,b.s.wood);for(const y of[.4,1.36])b.b(x,y,.06,.96,.04,.04,b.s.woodEdge);b.hui(x+.24,1.36,.04,.48,.24,b.s.woodEdge,.04);b.hui(x+.24,.2,.04,.48,.24,b.s.woodEdge,.04);}});
  b.part('四角钢箍和独立铜锁',()=>{for(const x of[0,2.24])for(const y of[0,1.64]){b.b(x,y,0,.16,.16,.04,b.s.metal);pin(b,x+.04,y+.04,0,.04);}});
 }},
 'BUILT-246':{size:[4.8,.8,1.6],pitch:.02,features:'4.8m薄瓦檐梁椽一体母版：薄瓦口、独立防水层、可见木基层、梁榫和十二根真实椽',limits:'清单既定4.8m长，作者进深1.6m、总高0.8m。底梁承托上部同一檐口，不采用参考中的悬浮展开摆放；安装到显式RoofRegion样件并核实际边界。'+limit,draw:b=>{
  b.part('横纹檐梁、端榫和钢铜箍',()=>{b.b(0,0,.6,4.8,.4,.4,b.s.woodEdge);for(const x of[0,2.3,4.6]){b.b(x,.05,.55,.2,.25,.5,b.s.metal);pin(b,x+.05,.1,.55,.1);}});
  b.part('十二根顺坡实木椽与可见基层',()=>{for(let z=0;z<32;z++){const y=.4+Math.round(4*z/31)*.05;for(let i=0;i<12;i++)b.b(.1+i*.4,y-.15,z*.05,.15,.15,.05,b.s.wood);b.b(0,y,z*.05,4.8,.05,.05,b.s.woodEdge);}});
  b.part('连续薄防水层和分垄灰瓦',()=>{for(let z=0;z<32;z++){const y=.4+Math.round(4*z/31)*.05;b.b(0,y+.05,z*.05,4.8,.05,.05,b.s.waterproofMembrane);for(let i=0;i<24;i++){b.b(i*.2,y+.1,z*.05,.2,.05,.05,b.s.roof);b.b(i*.2+.05,y+.15,z*.05,.1,.05,.05,b.s.roof);}}});
  b.part('可见椽端铜包头',()=>{for(let i=0;i<12;i++){b.b(.1+i*.4,.25,0,.15,.15,.05,b.s.bronze);b.b(.15+i*.4,.3,0,.05,.05,.05,b.s.wood);}});
 }},
};
export function neighborhoodComponent(id:string,a?:Asset){return String((a?.source?.parameters as any)?.component??Object.keys(neighborhoodVariants[id]??{})[0]??'default');}
export function selectNeighborhoodRecipe(id:string,component:unknown){if(component===undefined)return neighborhoodRecipes[id];if(typeof component!=='string'||!neighborhoodVariants[id]?.[component])throw new Error('此街区组件尚未验证');return neighborhoodVariants[id][component];}
const roles:Record<string,string[]>={
 '225':['wall','metal','structuralConcrete','bridgeBearing','warm','bronze'],'232':['structuralConcrete','mortar','wall','metal','bronze'],'233':['structuralConcrete','mortar','wall','metal','warm','bronze'],'234':['structuralConcrete','mortar','wall','metal','glass','warm','bronze'],
 '235':['mortar','wall','metal','structuralConcrete','warm','woodEdge','wood','waterproofMembrane','roof','bronze'],'240':['metal','structuralConcrete','wall','waterproofMembrane','bronze'],'241':['wall','metal','bronze','projectorEmitter','projectorLens'],'242':['metal','glass','wall','warm','bronze'],'243':['wall','metal','warm','bronze'],'244':['wood','woodEdge','bronze','metal'],'245':['wood','woodEdge','timberWindowSeal','glass','metal','bronze'],'246':['woodEdge','wood','metal','bronze','waterproofMembrane','roof'],
};
export function neighborhoodMaterialRule(id:string){if(!neighborhoodRecipes[id])return undefined;return{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:'按实际用途分开石、混凝土、砂浆、木纹方向、金属、透明镜片、未绑定发射芯、木窗窗封和防水层；不混入植物或虚拟全息图。'};}
export function configureNeighborhoodAsset(a:Asset,id:string){
 if(!neighborhoodRecipes[id])return;a.source!.component=neighborhoodComponent(id,a);a.source!.sharedStructure={originalFloorPlanAvailable:false,originalTerrainAvailable:false,controllerVerified:false,nativeCollisionAuthoritative:true};
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.ceil(n/a.cellSize-1e-8)) as V3,max:max.map(n=>Math.ceil(n/a.cellSize-1e-8)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-225'){a.source!.storeyBearingTopsM=[3.2,6.4];for(const y of[3.2,6.4])port('level-'+y,'skywalk-end',[2.1,y,1.2],[0,1,0],[1.8,0,1.6]);}
 if(id==='BUILT-232'){a.source!.terrainFixture={bottomBandsM:contourBottoms,bandWidthM:2,topYM:1.6,missingCornerM:{min:[6,0,4],max:[8,1.6,6]},originalTerrain:false};empty([6,0,4],[8,1.6,6]);}
 if(id==='BUILT-233'){a.source!.stair={riseM:.2,treadM:.4,count:8,landingLengthM:1.2,topYM:1.6,bodyHeightM:1.72};courtStepRuns.forEach((z,i)=>empty([.3,(i+1)*.2,z],[3.3,(i+1)*.2+1.72,z+.4]));empty([.3,.8,1.6],[3.3,2.52,2.8]);}
 if(id==='BUILT-234')a.source!.ramp={lowYM:.2,highYM:1.2,slopeRunM:10,landingEachM:1,nominalGrade:.1,quantizationM:.05,analyticSlope:false};
 if(id==='BUILT-235'){empty([1.8,0,0],[4.2,2.6,.6]);a.source!.authoredOpening={minM:[1.8,0,0],maxM:[4.2,2.6,.6],leavesIncluded:false};}
 if(id==='BUILT-240'){for(const y of[.4,1.4,2.4]){empty([.3,y+.1,.1],[2.1,y+.4,.55]);empty([1.15,y,.3],[1.25,y+.1,.4]);}a.source!.planting={plantsIncluded:false,soilIncluded:false,wateringRuntime:false};}
 if(id==='BUILT-241'){empty([.75,.45,1.4],[.85,.55,1.5]);a.source!.projector={powerBound:false,signLocationBound:false,hologramIncluded:false,chineseUIIncluded:false,emitterRole:'projectorEmitter',emissionState:'unbound-off'};}
 if(id==='BUILT-242')a.source!.stairGuard={component:neighborhoodComponent(id,a),stepsIncluded:false,riseM:.2,flightSteps:8,bodyRadiusM:.35,bodyHeightM:1.72,upperExitClosed:false};
 if(id==='BUILT-243')a.source!.roofGuard={roofIncluded:false,authoredRoofSupportOnly:true,publicExitMustRemainOpen:true};
 if(id==='BUILT-244'){a.source!.door={sharedStateAvailable:false,runtimeOperation:false,leafM:[1.2,2.4,.2],grain:{stiles:'Y',rails:'X'},authorFixtureStates:['closed','open-quarter-turn']};port('hinge','door-hinge',[.04,0,.1],[-1,0,0],[0,2.4,.2]);}
 if(id==='BUILT-245')a.source!.window={wallOpeningM:[2.44,1.84],leafM:[2.4,1.8],glassZM:[.12,.14],grain:{stiles:'Y',rails:'X'},passageDoor:false};
 if(id==='BUILT-246')a.source!.roofRegion={sourceLengthM:4.8,authoredDepthM:1.6,originalRegionAvailable:false,minimumSupportYM:0,explodedView:false,rafters:12};
}
