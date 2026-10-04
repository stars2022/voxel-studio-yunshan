import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';
const aviationLimit='原AviationPad/Vehicle/SimState、NetworkEdge、租用/登离/驾驶/权限状态未提供；仅作者米制几何与接口样件，不声称W上机、可驾驶、动画或原游戏集成。';
const pin=(b:Shapes,x:number,y:number,z:number,t=b.pitch)=>b.b(x,y,z,t,t,t,b.s.bronze);
export function taxiRoute(component='taxiStraight'):V3[]{return component==='taxiCorner'?[[0,.6,4],...Array.from({length:19},(_,i)=>{const t=Math.PI*i/36;return[4+8*Math.sin(t),.6,12-8*Math.cos(t)] as V3;}),[12,.6,16]]:[[0,.6,4],[24,.6,4]];}
function paintRoute(b:Shapes,route:V3[],width:number){for(let i=0;i<route.length-1;i++){const a=route[i],c=route[i+1],n=Math.ceil(Math.hypot(c[0]-a[0],c[2]-a[2])/.1);for(let j=0;j<=n;j++){const t=j/n,x=a[0]+(c[0]-a[0])*t,z=a[2]+(c[2]-a[2])*t;b.b(x-width/2,.4,z-width/2,width,.2,width,b.s.airfieldYellow);}}}
const taxiStraight:AtlasRecipe={size:[24,.6,8],pitch:.2,features:'24×8m闭合滑行道段：混凝土芯、磨耗面、实际黄色中线、白色等候线与真实端接口',limits:'作者24m直段，路中线由同一保存的route点驱动物理涂料占用。未接实际Aircraft滚行状态，不以黄线证明可驾驶。'+aviationLimit,draw:b=>{
 b.part('闭合结构层和独立磨耗面',()=>{b.b(0,0,0,24,.4,8,b.s.structuralConcrete);b.b(0,.4,0,24,.2,8,b.s.pavementConcrete);});
 b.part('钢边和同源route实体涂料线',()=>{for(const z of[0,7.8])b.b(0,.4,z,24,.2,.2,b.s.metal);paintRoute(b,taxiRoute().map(p=>[Math.max(.2,Math.min(23.8,p[0])),p[1],p[2]]),.2);});
 b.part('两道真实等候线和端部白边',()=>{for(const x of[18,18.6])b.b(x,.4,.4,.2,.2,7.2,b.s.airfieldWhite);for(const x of[0,23.8])b.b(x,.4,.4,.2,.2,7.2,b.s.airfieldWhite);});
 b.part('四角铜锚和非占道边缘光芯',()=>{for(const x of[.4,23.2])for(const z of[.2,7.4]){pin(b,x,.4,z,.2);b.b(x+.2,.4,z,.2,.2,.2,b.s.warm);}});
}};
const taxiCorner:AtlasRecipe={size:[16,.6,16],pitch:.2,features:'16m转角滑行道：沿90度作者route生成的8m宽闭合铺面、实涂中心线与端口',limits:'作者转弯半径8m、半宽4m；实际表面是0.2m体素曲线近似。几何涂线和检查共用同一组采样点；不冒称原Aircraft能转过该半径。'+aviationLimit,draw:b=>{
 b.part('有限曲线走廊的闭合结构层',()=>{for(let x=0;x<80;x++)for(let z=0;z<80;z++){const xx=(x+.5)*.2,zz=(z+.5)*.2,r=Math.hypot(xx-4,zz-12);if((xx>=4&&zz<=12&&r>=4&&r<=12)||(xx<4&&zz>=0&&zz<8)||(zz>12&&xx>=8&&xx<16)){b.b(x*.2,0,z*.2,.2,.4,.2,b.s.structuralConcrete);b.b(x*.2,.4,z*.2,.2,.2,.2,b.s.pavementConcrete);}}});
 b.part('同源中心线与两端延伸线',()=>{paintRoute(b,taxiRoute('taxiCorner').map(p=>[Math.max(.2,Math.min(15.8,p[0])),p[1],Math.max(.2,Math.min(15.8,p[2]))]),.2);});
 b.part('实际白色端线',()=>{b.b(0,.4,0,.2,.2,8,b.s.airfieldWhite);b.b(8,.4,15.8,8,.2,.2,b.s.airfieldWhite);});
 b.part('端部边缘钢锚和铜锁',()=>{for(const[x,z]of[[.2,.2],[.2,7.4],[8.2,15.4],[15.4,15.4]]){b.b(x,.4,z,.4,.2,.4,b.s.metal);pin(b,x,.4,z,.2);}});
}};
const boardingStairs:AtlasRecipe={size:[2.4,3.5,4.8],pitch:.05,features:'独立登机接台十二级外梯：真实0.2m踢高、0.4m踏深、石踏面和两侧钢扶栏',limits:'作者净宽2m，总升高2.4m；与同一清单内boardingBridge分开生成，不增加清单母版计数。'+aviationLimit,draw:b=>{
 b.part('十二级闭合混凝土承芯',()=>{for(let i=0;i<12;i++)b.b(0,0,i*.4,2.4,(i+1)*.2,.4,b.s.structuralConcrete);});
 b.part('真实石踏面和白色防滑鼻口',()=>{for(let i=0;i<12;i++){const y=(i+1)*.2;b.b(.2,y-.05,i*.4,2,.05,.4,b.s.wall);b.b(.25,y-.05,i*.4,1.9,.05,.05,b.s.airfieldWhite);}});
 b.part('连续阶梯钢顶杆与六对承脚',()=>{for(const x of[0,2.2])for(let i=0;i<12;i++){const y=(i+1)*.2;b.b(x,y+.95,i*.4,.2,.15,.4,b.s.metal);if(i<11)b.b(x,y+1,i*.4+.35,.2,.3,.05,b.s.metal);if(i%2===0||i===11)b.b(x,y,i*.4,.2,1.1,.15,b.s.metal);}});
 b.part('首末铜锚和边侧暖芯',()=>{for(const x of[.05,2.25])for(const[y,z]of[[.2,0],[2.4,4.4]]){pin(b,x,y+1.05,z,.05);b.b(x,y+.25,z,.1,.35,.05,b.s.warm);}});
}};
const boardingBridge:AtlasRecipe={size:[2.4,4.8,8],pitch:.05,features:'独立2.4×8m登机接桥：2.4m高通行面、连续封顶、透明侧墙、四脚与两端开敞接口',limits:'通道净宽2m、净高2.2m，作者登机门接收面Y2.4m。十二级外梯另选boardingStairs；不烘入飞机或航站。'+aviationLimit,draw:b=>{
 b.part('四脚实际承柱、钢底梁和铺面',()=>{for(const x of[.1,1.9])for(const z of[.4,7.2]){b.b(x,0,z,.4,.2,.4,b.s.wall);b.b(x+.1,.2,z+.1,.2,2,.2,b.s.metal);}b.b(0,2.2,0,2.4,.2,8,b.s.metal);b.b(.2,2.35,0,2,.05,8,b.s.wall);});
 b.part('五组侧框和独立玻璃',()=>{for(const x of[0,2.2]){for(const z of[0,1.95,3.9,5.85,7.8])b.b(x,2.4,z,.2,2.2,.2,b.s.metal);for(const z of[.2,2.15,4.1,6.05])b.b(x+.075,2.5,z,.05,2,1.75,b.s.glass);}});
 b.part('两侧低护边和薄顶板',()=>{for(const x of[0,2.2])b.b(x,2.4,0,.2,.1,8,b.s.metal);b.b(0,4.6,0,2.4,.2,8,b.s.enamel);});
 b.part('铜边锁、两端连接钢圈及光芯',()=>{for(const z of[0,7.8])for(const x of[0,2.2]){b.b(x,2.4,z,.2,2.2,.2,b.s.metal);pin(b,x+.05,4.5,z,.1);b.b(x+.05,2.8,z,.1,1,.05,b.s.warm);}});
}};
export const portalVariants:Record<string,Record<string,AtlasRecipe>>={'BUILT-268':{taxiStraight,taxiCorner},'BUILT-270':{boardingBridge,boardingStairs}};
export const portalRecipes:Record<string,AtlasRecipe>={
 'BUILT-248':{size:[1.6,.8,.8],pitch:.025,features:'独立梁端斗拱：三层交错短木托、实榫肩、钢夹与铜锁，接柱和梁的真实承面',limits:'作者1.6×0.8×0.8m独立斗拱，不包含完整柱/屋檐。使用同材共面贪心合并的原生网格；未提供运行时LOD切换或结构受力认证。',draw:b=>{
  b.part('柱顶榫块与两级短木托',()=>{b.b(.6,0,.2,.4,.2,.4,b.s.wood);b.b(.4,.2,.1,.8,.2,.6,b.s.woodEdge);b.b(.2,.4,.2,1.2,.2,.4,b.s.woodEdge);});
  b.part('正交上承托和真实退层肩',()=>{b.b(0,.6,.25,1.6,.2,.3,b.s.woodEdge);for(const x of[.3,1.1])b.b(x,.5,0,.2,.3,.8,b.s.wood);});
  b.part('两端钢夹与短木外榫',()=>{for(const x of[.05,1.45]){b.b(x,.6,.225,.1,.2,.35,b.s.metal);b.b(x,.65,.2,.1,.1,.025,b.s.wood);}});
  b.part('独立铜榫销',()=>{for(const x of[.075,1.475])pin(b,x,.675,.175,.05);for(const x of[.425,1.125])pin(b,x,.3,.075,.05);});
 }},
 'BUILT-249':{size:[.6,1.2,.6],pitch:.025,features:'独立木纸灯笼A3：四面真纸罩、木骨架、独立光芯、铜挂环和非碰撞织物穗',limits:'实际导出三角形必须≤1800。纸罩不伪称透射材质；仅静态发光外观，无原电力绑定或真实点光认证。悬挂件须在明确挂点验证，穗保持非碰撞。',draw:b=>{
  b.part('四根木骨与上下木托',()=>{for(const x of[.05,.5])for(const z of[.05,.5])b.b(x,.3,z,.05,.65,.05,b.s.wood);for(const y of[.3,.9])b.b(0,y,0,.6,.05,.6,b.s.woodEdge);});
  b.part('独立四面纸罩与真实内腔',()=>{for(const z of[.075,.5])b.b(.1,.35,z,.4,.55,.025,b.s.lanternPaper);for(const x of[.075,.5])b.b(x,.35,.1,.025,.55,.4,b.s.lanternPaper);});
  b.part('内侧实体灯托与独立暖芯',()=>{b.b(.25,.35,.25,.1,.1,.1,b.s.metal);b.b(.25,.45,.25,.1,.3,.1,b.s.warm);b.b(.25,.75,.25,.1,.15,.1,b.s.metal);});
  b.part('铜帽、贯通挂环和真实挂孔',()=>{b.b(.2,.95,.2,.2,.05,.2,b.s.bronze);b.b(.225,1,.275,.15,.2,.05,b.s.bronze);b.b(.25,1.05,.275,.1,.125,.05,0);for(const x of[.025,.525])for(const z of[.025,.525])pin(b,x,.925,z,.05);});
  b.part('非碰撞布穗与织物悬结',()=>{b.b(.275,.2,.275,.05,.1,.05,b.s.lanternTassel);b.b(.25,0,.25,.1,.2,.1,b.s.lanternTassel);b.b(.275,0,.275,.05,.15,.05,0);});
 }},
 'BUILT-250':{size:[1.8,.6,1.8],pitch:.05,features:'石基边角破边模块：0.2–0.6m真实石块、错缝、有限缺角及独立砂浆承床',limits:'作者1.8m方形边角模块；0.2–0.6m块体留在明确实体范围内，破边为移除格子，不散落堆石阻路。',draw:b=>{
  b.part('连续有限砂浆承床',()=>b.b(0,0,0,1.8,.1,1.8,b.s.mortar));
  b.part('两层错缝石块和独立缝隙',()=>{for(let j=0;j<3;j++)for(let i=0;i<3;i++){b.b(i*.6,.1,j*.6,.55,.2,.55,b.s.stone);b.b(i*.6,.3,j*.6,.55,.2,.55,b.s.wall);}});
  b.part('浅石压面和真实破角',()=>{for(let x=0;x<3;x++)for(let z=0;z<3;z++)b.b(x*.6,.5,z*.6,.55,.1,.55,b.s.wall);b.b(0,.3,0,.2,.3,.2,0);b.b(1.55,.1,1.55,.25,.5,.25,0);});
  b.part('侧边小钢连接和铜定位销',()=>{b.b(.25,.1,0,.2,.2,.05,b.s.metal);pin(b,.3,.15,0,.05);});
 }},
 'BUILT-251':{size:[3.6,3,.3],pitch:.05,features:'A1开敞木门框替代候选：外3.6×3×0.3m、真净洞3.2×2.8m、薄木榫与独立钢铜锁',limits:'原外部GLB/原task像素未收件，原件bounds/净洞/材质仍未核。这里是按清单明确尺寸新制的替代候选，不是原件验证、集成或美术验收。局部0.05m格距，实际导出三角预算≤2500；不改变原0.2m世界结构。',draw:b=>{
  b.part('两根完整木柱和真实开敞净洞',()=>{for(const x of[0,3.4])b.b(x,0,0,.2,2.8,.3,b.s.wood);b.b(0,2.8,0,3.6,.2,.3,b.s.woodEdge);});
  b.part('柱脚石套与榫肩钢夹',()=>{for(const x of[0,3.4]){b.b(x,0,0,.2,.2,.3,b.s.wall);for(const y of[.2,2.6])b.b(x,y,0,.2,.1,.3,b.s.metal);}});
  b.part('前侧浅榫和端部铜锁',()=>{for(const x of[0,3.4]){b.b(x,2.4,0,.2,.15,.05,b.s.woodEdge);pin(b,x+.05,2.65,0,.05);}for(const x of[.3,3.25])pin(b,x,2.85,0,.05);});
  b.part('柱前独立内嵌暖芯',()=>{for(const x of[.05,3.45])b.b(x,.8,0,.1,.9,.05,b.s.warm);});
 }},
 'BUILT-268':taxiStraight,
 'BUILT-269':{size:[14,.6,14],pitch:.2,features:'独立机位承板：14m方形实铺面、实体黄色入位轴线、红色边界、白色步行接点和空机位包络',limits:'单个可复用stand母版；样件A/B各有独立位置与鼻向，均为空位，不复制静态飞机计数。作者机型包络翼展8.4m/长10m，原stand id、实际机型及登离状态未绑定。'+aviationLimit,draw:b=>{
  b.part('闭合结构板与磨耗层',()=>{b.b(0,0,0,14,.4,14,b.s.structuralConcrete);b.b(0,.4,0,14,.2,14,b.s.pavementConcrete);});
  b.part('真实黄色鼻向线、T形止位线与翼展包络角',()=>{b.b(6.8,.4,0,.2,.2,11,b.s.airfieldYellow);b.b(5,.4,10.8,4,.2,.2,b.s.airfieldYellow);for(const x of[2.8,10.8])for(const z of[2,11.6]){b.b(x,.4,z,.4,.2,.2,b.s.airfieldYellow);b.b(x,.4,z,.2,.2,.4,b.s.airfieldYellow);}});
  b.part('红色有限边界与白色步行接点',()=>{for(const x of[.4,13.4])b.b(x,.4,.4,.2,.2,13.2,b.s.airfieldRed);for(const z of[.4,13.4])b.b(.4,.4,z,13.2,.2,.2,b.s.airfieldRed);b.b(0,.4,6,.8,.2,2,b.s.airfieldWhite);});
  b.part('角部钢连接和铜锚',()=>{for(const x of[0,13.6])for(const z of[0,13.6]){b.b(x,.4,z,.4,.2,.4,b.s.metal);pin(b,x,.4,z,.2);}});
 }},
 'BUILT-270':boardingBridge,
 'BUILT-273':{size:[8,2.8,.4],pitch:.05,features:'机场边界与开敞门架：两侧真实钢网、2m净入口、独立柱灯和未绑定控制盒',limits:'作者中央x3–5m、净高2.6m通口；钢网为真实占用，原权限/公众受限区状态未绑定。控制盒无假“允许通行”图形，不代替权威权限。'+aviationLimit,draw:b=>{
  b.part('四根实际钢柱与有限石脚',()=>{for(const x of[0,2.7,5,7.7]){b.b(x,0,0,.3,.3,.4,b.s.wall);b.b(x,.3,.05,.3,2.5,.3,b.s.metal);}b.b(0,2.6,.1,8,.2,.2,b.s.metal);});
  b.part('两侧钢网外框与真实细网格',()=>{for(const x of[.3,5.3]){for(const y of[.3,2.4])b.b(x,y,.1,2.4,.1,.2,b.s.metal);for(let i=0;i<12;i++)b.b(x+i*.2,.4,.175,.05,2,.05,b.s.metalBright);for(let i=0;i<10;i++)b.b(x,.4+i*.2,.175,2.4,.05,.05,b.s.metalBright);}});
  b.part('柱芯与玻璃灯罩',()=>{for(const x of[.05,2.75,5.05,7.75]){b.b(x,.6,.05,.2,.8,.05,b.s.warm);b.b(x,.6,0,.2,.8,.05,b.s.glass);}});
  b.part('未绑定控制盒、空屏与铜接点',()=>{b.b(7.7,.5,0,.3,.6,.1,b.s.metal);b.b(7.75,.65,0,.2,.25,.05,b.s.screen);for(const x of[.1,2.8,5.1,7.8])pin(b,x,2.7,.05,.05);});
 }},
 'BUILT-276':{size:[5.6,2.4,5.6],pitch:.1,features:'星港实体泊位接台：1.2m步行面、六级真实接梯、四柱承托、玻璃边栏和后方登离接口',limits:'仅接台，不将装饰Torus计为真实泊位。原停泊环和船体/权限状态未提供；保存作者泊位接口与真实实体步路，原ring id为空。'+aviationLimit,draw:b=>{
  b.part('四柱、真实钢承板与石铺',()=>{for(const x of[0,5])for(const z of[2.4,5]){b.b(x,0,z,.6,.2,.6,b.s.wall);b.b(x+.1,.2,z+.1,.4,.8,.4,b.s.metal);}b.b(0,1,2.4,5.6,.1,3.2,b.s.metal);b.b(0,1.1,2.4,5.6,.1,3.2,b.s.wall);});
  b.part('六级闭合实体阶梯',()=>{for(let i=0;i<6;i++){b.b(1.6,0,i*.4,2.4,(i+1)*.2,.4,b.s.structuralConcrete);b.b(1.6,(i+1)*.2-.1,i*.4,2.4,.1,.4,b.s.wall);b.b(1.8,(i+1)*.2-.1,i*.4,2,.1,.1,b.s.airfieldYellow);}});
  b.part('两侧真实玻璃与留口后栏',()=>{for(const x of[0,5.4]){for(const z of[2.4,3.8,5.4])b.b(x,1.2,z,.2,1.2,.2,b.s.metal);b.b(x,2.3,2.4,.2,.1,3.2,b.s.metal);b.b(x+.1,1.4,2.6,.1,.9,2.8,b.s.glass);}for(const x of[0,4]){b.b(x,2.3,5.4,1.6,.1,.2,b.s.metal);b.b(x,1.4,5.5,1.6,.9,.1,b.s.glass);}});
  b.part('铜柱帽与侧向暖芯',()=>{for(const x of[0,5.4])for(const z of[2.4,5.4]){pin(b,x,2.3,z,.1);b.b(x,1.5,z,.1,.4,.1,b.s.warm);}});
 }},
 'BUILT-286':{size:[1.2,1.2,.8],pitch:.025,features:'独立轮胎轮毂与轴套：真实橡胶胎、亮钢轮圈、铜锁、刚性后轴套和贯通安装方孔',limits:'作者直径1.2m，轮胎厚0.4m、含轴套总深0.8m；轮组最低点为0。速度/steering未绑定，不改变任何原Vehicle碰撞；只验证作者前轴样件。',draw:b=>{
  b.part('真实橡胶胎与独立钢轮圈',()=>{b.cylinder(.6,.6,0,.6,.4,b.s.rubber,0,'z');b.cylinder(.6,.6,0,.35,.4,b.s.metalBright,0,'z');});
  b.part('后方钢轴套和前轮毂',()=>{b.cylinder(.6,.6,.4,.2,.4,b.s.metal,0,'z');b.cylinder(.6,.6,0,.2,.1,b.s.metal,0,'z');});
  b.part('六颗黄铜固定锁及有限胎面真槽',()=>{for(let i=0;i<6;i++){const a=i*Math.PI/3;pin(b,.575+.275*Math.cos(a),.575+.275*Math.sin(a),0,.05);}for(const y of[.05,1.1])for(const x of[.35,.75])b.b(x,y,.1,.1,.05,.2,0);});
  b.part('真实贯通轴孔与后端法兰',()=>{b.b(.375,.375,.7,.45,.45,.1,b.s.metal);b.b(.525,.525,0,.15,.15,.8,0);});
 }},
 'BUILT-287':{size:[2,2.95,2],pitch:.025,features:'载具门壳及铰接样件：真实1.8×2.75m门框、固定90度开叶、金属门皮、环形窗封和薄玻璃',limits:'固定打开姿态的作者门壳，叶和框用真实铰接耳连通；不包含门动画或权限逻辑。装在M020作者轨道舱外侧，保持原177门洞，不由视觉模型改写body。',draw:b=>{
  b.part('完整外部门框与开敞净洞',()=>{for(const x of[0,1.9])b.b(x,0,1.8,.1,2.95,.2,b.s.enamel);for(const y of[0,2.85])b.b(0,y,1.8,2,.1,.2,b.s.metal);});
  b.part('固定打开门叶的金属骨架和下部门皮',()=>{b.b(1.85,.1,0,.15,1.1,1.8,b.s.enamel);for(const z of[0,1.7])b.b(1.85,1.2,z,.15,1.65,.1,b.s.metal);b.b(1.85,2.75,0,.15,.1,1.8,b.s.metal);});
  b.part('真实环形车辆窗封与薄玻璃',()=>{b.b(1.9,1.2,.1,.05,1.55,1.6,b.s.vehicleSeal);b.b(1.9,1.25,.15,.05,1.45,1.5,0);b.b(1.925,1.25,.15,.025,1.45,1.5,b.s.glass);});
  b.part('三层钢铰耳、铜轴和拉手',()=>{for(const y of[.25,1.35,2.55]){b.b(1.825,y,1.7,.175,.15,.1,b.s.metal);b.b(1.9,y,1.8,.1,.15,.1,b.s.metal);b.b(1.9,y,1.8,.05,.15,.05,b.s.bronze);}b.b(1.85,1.35,.05,.05,.4,.05,b.s.bronze);});
 }},
 'BUILT-288':{size:[1.8,1.2,1.4],pitch:.05,features:'列车车厢端固定连挂：两端钢板、中央牵引杆、双锁套与独立U形制动软管',limits:'作者两车端间距1.4m；与同一10m舱体的首尾端面直接连接，实例绑定在明确车厢序列。软管不是轮胎橡胶角色；无列车运行、缓冲或解挂动画。',draw:b=>{
  b.part('两端连续钢接板和涂装侧块',()=>{for(const z of[0,1.25]){b.b(0,.2,z,1.8,1,.15,b.s.metal);for(const x of[0,1.4])b.b(x,.3,z,.4,.8,.15,b.s.enamel);}});
  b.part('中央实心牵引杆与两道锁套',()=>{b.b(.7,.55,.15,.4,.4,1.1,b.s.metalBright);for(const z of[.3,.9])b.b(.6,.45,z,.6,.6,.2,b.s.metal);});
  b.part('贯通两端的独立制动软管',()=>{b.b(.3,.1,.15,.1,.35,.1,b.s.couplerHose);b.b(.3,.1,1.15,.1,.35,.1,b.s.couplerHose);b.b(.3,0,.25,.1,.1,.9,b.s.couplerHose);for(const z of[.2,1.1])b.b(.3,.05,z,.1,.1,.1,b.s.couplerHose);});
  b.part('端部铜锁与软管金属接头',()=>{for(const z of[.1,1.25])for(const x of[.1,1.6])pin(b,x,.95,z,.1);for(const z of[.1,1.25])b.b(.25,.35,z,.2,.15,.1,b.s.metal);});
 }},
};
export function portalComponent(id:string,a?:Asset){return String((a?.source?.parameters as any)?.component??Object.keys(portalVariants[id]??{})[0]??'default');}
export function selectPortalRecipe(id:string,c:unknown){if(c===undefined)return portalRecipes[id];if(typeof c!=='string'||!portalVariants[id]?.[c])throw new Error('此门户组件尚未验证');return portalVariants[id][c];}
const roles:Record<string,string[]>={
 '248':['wood','woodEdge','metal','bronze'],'249':['wood','woodEdge','lanternPaper','metal','warm','bronze','lanternTassel'],'250':['mortar','stone','wall','metal','bronze'],'251':['wood','woodEdge','wall','metal','bronze','warm'],
 '268':['structuralConcrete','pavementConcrete','metal','airfieldYellow','airfieldWhite','bronze','warm'],'269':['structuralConcrete','pavementConcrete','airfieldYellow','airfieldWhite','airfieldRed','metal','bronze'],'270':['structuralConcrete','wall','airfieldWhite','metal','warm','bronze','glass','enamel'],
 '273':['wall','metal','metalBright','warm','glass','screen','bronze'],'276':['wall','metal','structuralConcrete','airfieldYellow','glass','warm','bronze'],'286':['rubber','metalBright','metal','bronze'],'287':['enamel','metal','vehicleSeal','glass','bronze'],'288':['metal','enamel','metalBright','couplerHose','bronze'],
};
export function portalMaterialRule(id:string,a:Asset){if(!portalRecipes[id])return undefined;let required=roles[id.slice(-3)];if(id==='BUILT-268'&&portalComponent(id,a)==='taxiCorner')required=required.filter(r=>r!=='warm');if(id==='BUILT-270')required=required.filter(r=>!(portalComponent(id,a)==='boardingStairs'?['glass','enamel']:['structuralConcrete','airfieldWhite']).includes(r));return{required,allowed:roles[id.slice(-3)],note:'原生实际用途：木构/纸罩/非碰撞穗、石砌与灰缝、机场涂料、钢铜、独立轮胎与制动软管、车窗封和玻璃分别赋值，不以颜色借材质。'};}
export function configurePortalAsset(a:Asset,id:string){if(!portalRecipes[id])return;const c=portalComponent(id,a);a.source!.component=c;
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-248'){port('post','bracket-post',[.8,0,.4],[0,-1,0],[.4,0,.4]);port('beam','bracket-beam',[.8,.8,.4],[0,1,0],[1.6,0,.8]);a.source!.lod={greedyCoplanarMerge:true,runtimeLODs:false};}
 if(id==='BUILT-249'){a.source!.triangleBudget=1800;a.source!.lamp={paperTransmissionImplemented:false,powerBound:false,emissionAppearanceOnly:true,tasselCollision:false,mountBoreM:{min:[.25,1.05,.275],max:[.35,1.175,.325]}};empty([.15,.4,.15],[.225,.85,.45]);port('hang','lantern-hook',[.3,1.175,.3],[0,1,0],[.1,0,.05]);}
 if(id==='BUILT-250')a.source!.stoneEdge={authoredSolidM:{min:[0,0,0],max:[1.8,.6,1.8]},blocksM:[.2,.6],looseRubble:false};
 if(id==='BUILT-251'){a.source!.triangleBudget=2500;a.source!.externalOriginal={status:'awaiting-original-glb',originalReceived:false,originalValidated:false,originalTaskAvailable:false,authoredReplacement:true,worldPitchM:.2,localPitchM:.05};empty([.2,0,0],[3.4,2.8,.3]);a.source!.sharedOpening={authored:true,clearWidthM:3.2,clearHeightM:2.8};}
 if(['BUILT-268','BUILT-269','BUILT-270','BUILT-273','BUILT-276'].includes(id))a.source!.aviation={originalStateBound:false,routeRuntime:false,accessPermissionBound:false,boardingRuntime:false,staticAuthoredFixture:true};
 if(id==='BUILT-268'){a.source!.taxi={component:c,routeM:taxiRoute(c),widthM:8,curveRadiusM:c==='taxiCorner'?8:null,surfaceYM:.6,routeDrivesMarking:true};if(c==='taxiStraight'){port('entry','taxi-eight',[0,.6,4],[-1,0,0],[0,.6,8]);port('exit','taxi-eight',[24,.6,4],[1,0,0],[0,.6,8]);}else{port('entry','taxi-eight',[0,.6,4],[-1,0,0],[0,.6,8]);port('exit','taxi-eight',[12,.6,16],[0,0,1],[8,.6,0]);}}
 if(id==='BUILT-269'){a.source!.stand={originalId:null,authorEnvelopeM:{wingSpan:8.4,length:10},centerM:[7,.6,7],nose:[0,0,1],aircraftIncluded:false};port('walk','stand-walk',[0,.6,7],[-1,0,0],[0,0,2]);}
 if(id==='BUILT-270'){a.source!.boarding={component:c,walkYM:2.4,bodyRadiusM:.35,bodyHeightM:1.72,stairs:c==='boardingStairs'?{count:12,riseM:.2,treadM:.4}:null};if(c==='boardingBridge'){empty([.2,2.4,0],[2.2,4.6,8]);port('front','boarding-walk',[1.2,2.4,0],[0,0,-1],[2,0,0]);port('back','boarding-walk',[1.2,2.4,8],[0,0,1],[2,0,0]);}else{port('top','boarding-walk',[1.2,2.4,4.8],[0,0,1],[2,0,0]);for(let i=0;i<12;i++)empty([.2,(i+1)*.2,i*.4],[2.2,(i+1)*.2+1.72,(i+1)*.4]);}}
 if(id==='BUILT-273')empty([3,0,0],[5,2.6,.4]);
 if(id==='BUILT-276'){a.source!.berth={originalRingId:null,torusIsNotBerth:true,walkYM:1.2};port('ship','berth-walk',[2.8,1.2,5.6],[0,0,1],[2.4,0,0]);empty([1.6,1.2,2.4],[4,2.92,5.6]);}
 if(id==='BUILT-286'){a.source!.wheel={diameterM:1.2,axleYM:.6,axleBoreM:{min:[.525,.525,0],max:[.675,.675,.8]},speedBound:false,steeringBound:false};port('axle','wheel-axle',[.6,.6,.8],[0,0,1],[.15,.15,0]);}
 if(id==='BUILT-287'){empty([.1,.1,1.8],[1.9,2.85,2]);a.source!.door={fixedOpenQuarterTurn:true,sharedStateBound:false,bodyGeometryRewritten:false,nominalOpeningM:[1.8,2.75],hingeM:[1.925,.1,1.8]};}
 if(id==='BUILT-288'){a.source!.coupling={authorEndGapM:1.4,carBodyLengthM:10,sequenceBound:false,animation:false};port('front','rail-coupler',[.9,.7,0],[0,0,-1],[1.8,1,0]);port('back','rail-coupler',[.9,.7,1.4],[0,0,1],[1.8,1,0]);}
}
