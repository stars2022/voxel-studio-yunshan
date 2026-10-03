import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';
const bridgeLimit='尺寸为作者接口样件，原隔离descriptor/terrain采样未提供。保留原巨块/ray负例与lowerdeck pier冲突；不声称原游戏最终PASS、三桥全净空或已集成。';
const marketLimit='原MarketSurface/MarketSolid及地形场未提供；本件是明确米制作者样件，碰撞来自同一体素占用。未接原getWalkHeight/step控制器，不声称24tick运行或美术通过。';
const pin=(b:Shapes,x:number,y:number,z:number,t=b.pitch)=>b.b(x,y,z,t,t,t,b.s.bronze);
function landing(lift:boolean):AtlasRecipe{return{size:[9,.6,4],pitch:.1,features:lift?'独立电梯侧U形落台：9×4m石铺承板、3×3m贯通井口、钢边及暖光端接':'独立岸侧落台：9×4m连续石铺承板、混凝土芯、接岸端梁与明确桥侧接口',limits:'同一清单ID内liftLanding和bankLanding分开生成；不烘入完整电梯塔/轿厢或地形。'+bridgeLimit,draw:b=>{
 b.part('有限混凝土承板和接岸钢边',()=>{b.b(0,0,0,9,.5,4,b.s.structuralConcrete);for(const x of[0,8.8])b.b(x,0,0,.2,.6,4,b.s.metal);});
 b.part('分格石铺面和真实灰缝',()=>{b.b(.2,.5,0,8.6,.1,4,b.s.mortar);for(let x=.2;x<8.8;x+=1)for(let z=0;z<4;z+=1)b.b(x,.5,z,Math.min(.9,8.8-x),.1,.9,b.s.wall);if(lift)b.b(3,0,0,3,.6,3,0);});
 b.part('落台端部金属收边与井口边框',()=>{if(lift){for(const x of[2.9,6])b.b(x,.4,0,.1,.2,3,b.s.metal);b.b(3,.4,3,3,.2,.1,b.s.metal);}else b.b(.2,.4,0,8.6,.2,.2,b.s.metal);});
 b.part('角部铜锚和分离光芯',()=>{for(const x of[.3,8.4])for(const z of[.3,3.4]){b.b(x,.3,z,.3,.3,.3,b.s.metal);pin(b,x+.1,.5,z+.1);b.b(x,.3,z-.1,.2,.1,.1,b.s.warm);}});
}};}
const pier:AtlasRecipe={size:[4,8,3],pitch:.1,features:'8m作者高桥墩：分级石鞋、真实混凝土芯、石砌包层、钢肩和检修灯槽',limits:'本件为pier；9m墩帽cap另选，6pier/8cap仅记录原描述数量，未编造原放置坐标。'+bridgeLimit,draw:b=>{
 b.part('两级石鞋与混凝土基础芯',()=>{b.b(0,0,0,4,.4,3,b.s.wall);b.b(.2,.4,.2,3.6,.4,2.6,b.s.structuralConcrete);b.b(.4,.8,.4,3.2,.4,2.2,b.s.wall);});
 b.part('连续承载柱芯与分缝石砌皮',()=>{b.b(.8,1.2,.8,2.4,6.2,1.4,b.s.structuralConcrete);for(let y=1.2;y<7.4;y+=.5){b.b(.7,y,.7,2.6,.4,1.6,b.s.wall);}b.b(1,1.2,1,2,6.2,1,b.s.structuralConcrete);});
 b.part('顶部阶梯钢肩及承台',()=>{b.b(.5,7.2,.5,3,.3,2,b.s.metal);b.b(.3,7.5,.3,3.4,.3,2.4,b.s.wall);b.b(.1,7.8,.1,3.8,.2,2.8,b.s.metal);b.b(.6,1,.6,2.8,.3,1.8,b.s.metal);});
 b.part('柱面内缩灯槽、检修盖及铜锚',()=>{b.b(1.7,1.5,.7,.6,4.8,.2,b.s.metal);b.b(1.8,1.7,.7,.4,4.4,.1,b.s.warm);for(const x of[.3,3.5])for(const z of[.3,2.5])b.b(x,7.9,z,.2,.1,.2,b.s.bronze);});
}};
const cap:AtlasRecipe={size:[9,1.2,3.2],pitch:.1,features:'独立9m高桥墩帽：连续混凝土承梁、石侧皮、钢围带及三组橡胶支座',limits:'与8m墩身独立，可复用端部墩帽；作者安装底251.6m、顶252.8m。'+bridgeLimit,draw:b=>{
 b.part('阶梯混凝土承梁',()=>{b.b(1.5,0,.3,6,.3,2.6,b.s.structuralConcrete);b.b(.5,.3,.1,8,.3,3,b.s.structuralConcrete);b.b(0,.6,0,9,.4,3.2,b.s.structuralConcrete);});
 b.part('浅石侧压面与端部护角',()=>{for(const z of[0,3.1])b.b(0,.6,z,9,.4,.1,b.s.wall);for(const x of[0,8.8])b.b(x,.6,0,.2,.4,3.2,b.s.wall);});
 b.part('真实钢围带和三组橡胶支座',()=>{for(const x of[.5,4.2,7.9]){b.b(x,.9,.2,.6,.1,2.8,b.s.metal);b.b(x,1,.2,.6,.2,2.8,b.s.bridgeBearing);}});
 b.part('独立铜锁',()=>{for(const x of[.6,8.2])for(const z of[.1,2.9])b.b(x,.9,z,.2,.1,.2,b.s.bronze);});
}};
const foundation:AtlasRecipe={size:[4,1,3],pitch:.1,features:'4×3m独立基础承台：连续混凝土、浅石压面、四足接口和实际钢锚',limits:'仅基础承台foundation；分段footing另选。原32footing/8foundation/160terrain contacts作为未复现来源计数，作者样例明确给出5个高度带，不假称原地形采样。'+bridgeLimit,draw:b=>{
 b.part('混凝土承台与退层石边',()=>{b.b(0,0,0,4,.6,3,b.s.structuralConcrete);b.b(.2,.6,.2,3.6,.4,2.6,b.s.wall);});
 b.part('真实承重铺面与四足钢底座',()=>{b.b(.4,.8,.4,3.2,.2,2.2,b.s.structuralConcrete);for(const x of[0,3])for(const z of[0,2])b.b(x,0,z,1,.1,1,b.s.metal);});
 b.part('两侧钢压带',()=>{for(const z of[.3,2.5])b.b(.3,.9,z,3.4,.1,.2,b.s.metal);});
 b.part('四角铜固定锚',()=>{for(const x of[.3,3.5])for(const z of[.3,2.5])b.b(x,.9,z,.2,.1,.2,b.s.bronze);});
}};
export const civicContactHeights=[0,.1,.2,.1,0];
const footing:AtlasRecipe={size:[1,1,1],pitch:.1,features:'五高度带的正高实体承足：真实阶梯底面、混凝土芯、钢顶托及独立铜锚',limits:'1m方形作者footing，5段底高0/0.1/0.2/0.1/0m、统一顶1m，各段实体高度均为正。不是原160个terrain采样点。'+bridgeLimit,draw:b=>{
 b.part('按五个显式接触高度生成的混凝土实体',()=>{civicContactHeights.forEach((y,i)=>b.b(i*.2,y,0,.2,1-y,1,b.s.structuralConcrete));});
 b.part('前后分段石皮保持真实阶梯底面',()=>{civicContactHeights.forEach((y,i)=>{for(const z of[0,.9])b.b(i*.2,y,z,.2,.8-y,.1,b.s.wall);});});
 b.part('连续钢顶托',()=>b.b(0,.8,0,1,.2,1,b.s.metal));
 b.part('四颗铜定位钉',()=>{for(const x of[.1,.8])for(const z of[.1,.8])pin(b,x,.9,z);});
}};
function rail(b:Shapes,corner:boolean){
 const strip=(x:number,z:number)=>b.shifted([x,0,z],c=>{
  c.part('低石座、三柱与金属横杆',()=>{c.b(0,0,0,4,.2,.3,c.s.wall);for(const xx of[0,1.85,3.7]){c.b(xx,.2,0,.3,1,.3,c.s.metal);c.b(xx,.9,0,.3,.2,.3,c.s.wall);}for(const y of[.3,1.05])c.b(.3,y,.1,3.4,.1,.1,c.s.metal);});
  c.part('两片真实玻璃与暖色柱芯',()=>{for(const xx of[.3,2.15])c.b(xx,.4,.15,1.55,.65,.05,c.s.glass);for(const xx of[.05,3.75]){c.b(xx,.35,0,.2,.5,.05,c.s.warm);c.b(xx,.35,-.0,.2,.5,.05,c.s.glass);c.b(xx,.35,.05,.2,.5,.05,c.s.warm);}});
  c.part('铜扣与顶端状态窗',()=>{for(const xx of[.05,1.9,3.75]){c.b(xx,1.1,.05,.2,.05,.2,c.s.bronze);c.b(xx+.05,1.15,.1,.1,.05,.1,c.s.warm);}});
 });
 strip(0,0);
 if(corner){const c=new Shapes(b.pitch,b.s);rail(c,false);for(const[v,m]of c.g.cells())b.g.set([Math.round(3.7/b.pitch)+v[2],v[1],v[0]],m);b.part('转角真实内钢鞋',()=>b.b(3.7,0,0,.3,.3,.3,b.s.metal));}
 b.part('前柱底部独立铜销',()=>pin(b,.1,.1,0,.05));
}
const straight:AtlasRecipe={size:[4,1.2,.3],pitch:.05,features:'4m独立玻璃护栏：石脚钢柱、真实薄玻璃、灯芯护面与铜锁',limits:'直线straight与转角corner共用清单ID；原13rail为描述数量，未伪造原路线。0.35m半径和1.72m身体只在明确作者路径样例检查。'+bridgeLimit,draw:b=>rail(b,false)};
const corner:AtlasRecipe={...straight,size:[4,1.2,4],features:'4×4m转角护栏：两翼连续顶杆、共享转角柱、真实玻璃与开放内侧',draw:b=>rail(b,true)};
const kerb:AtlasRecipe={size:[3.2,.2,.2],pitch:.05,features:'3.2m低路缘段：实体混凝土脚、分块石条、真实灰缝及端部钢铜接件',limits:'kerb与treeRing分别选择；路缘高0.2m，不能用虚构大碰撞盒冒充实体。'+marketLimit,draw:b=>{
 b.part('连续混凝土下脚',()=>b.b(0,0,0,3.2,.1,.2,b.s.structuralConcrete));b.part('灰缝床和四块独立石条',()=>{b.b(0,.1,0,3.2,.1,.2,b.s.mortar);for(let i=0;i<4;i++)b.b(i*.8,.1,0,.75,.1,.2,b.s.wall);});b.part('端部钢接头',()=>{for(const x of[0,3.1])b.b(x,0,0,.1,.2,.2,b.s.metal);});b.part('铜端销',()=>{for(const x of[.05,3.1])pin(b,x,.15,.05,.05);});
}};
const treeRing:AtlasRecipe={size:[3.2,.4,3.2],pitch:.05,features:'独立3.2m树池围边：四侧真实石砌、连续承脚、2.6m方孔和钢铜角接',limits:'不烘入树木、土壤或整片街面；中央空腔为真实未占用格。'+marketLimit,draw:b=>{
 b.part('空心混凝土环形承脚',()=>{b.b(0,0,0,3.2,.3,3.2,b.s.structuralConcrete);b.b(.3,0,.3,2.6,.4,2.6,0);});
 b.part('灰缝层与逐块浅石压顶',()=>{for(const z of[0,2.9]){b.b(0,.3,z,3.2,.1,.3,b.s.mortar);for(let i=0;i<4;i++)b.b(i*.8,.3,z,.75,.1,.3,b.s.wall);}for(const x of[0,2.9]){b.b(x,.3,.3,.3,.1,2.6,b.s.mortar);for(let i=0;i<4;i++)b.b(x,.3,.3+i*.65,.3,.1,.6,b.s.wall);}});
 b.part('四角钢包边',()=>{for(const x of[0,2.95])for(const z of[0,2.95])b.b(x,.25,z,.25,.1,.25,b.s.metal);});
 b.part('四角铜销',()=>{for(const x of[.1,3.05])for(const z of[.1,3.05])pin(b,x,.35,z,.05);});
}};
export const civicVariants:Record<string,Record<string,AtlasRecipe>>={'BUILT-207':{liftLanding:landing(true),bankLanding:landing(false)},'BUILT-208':{pier,cap},'BUILT-209':{foundation,footing},'BUILT-210':{straight,corner},'BUILT-215':{kerb,treeRing}};
export const civicRecipes:Record<string,AtlasRecipe>={
 'BUILT-207':civicVariants['BUILT-207'].liftLanding,'BUILT-208':pier,'BUILT-209':foundation,'BUILT-210':straight,
 'BUILT-212':{size:[6,2,6],pitch:.1,features:'6×6m有限石铺台基：2m混凝土芯、真实灰缝和石铺层、下部石皮与独立端锚',limits:'作者地形基准0、台顶2m，填方2m≤清单4m上限；没有原terrain场，未压平整个街区。'+marketLimit,draw:b=>{
  b.part('有限结构混凝土芯',()=>b.b(0,0,0,6,1.9,6,b.s.structuralConcrete));
  b.part('逐层石侧皮与边带',()=>{for(let y=0;y<1.8;y+=.5)for(let i=0;i<6;i++){for(const z of[0,5.9])b.b(i,y,z,.9,.4,.1,b.s.wall);for(const x of[0,5.9])b.b(x,y,i,.1,.4,.9,b.s.wall);}for(const z of[0,5.9])b.b(0,1.7,z,6,.2,.1,b.s.metal);});
  b.part('真实灰缝与三十六块石铺面',()=>{b.b(0,1.9,0,6,.1,6,b.s.mortar);for(let x=0;x<6;x++)for(let z=0;z<6;z++)b.b(x,1.9,z,.9,.1,.9,b.s.wall);});
  b.part('钢铜角锚和内嵌暖芯',()=>{for(const x of[.1,5.6])for(const z of[.1,5.6]){b.b(x,1.8,z,.3,.2,.3,b.s.metal);pin(b,x+.1,1.9,z+.1); }for(const x of[.4,5.3])b.b(x,.8,0,.3,.2,.1,b.s.warm);});
 }},
 'BUILT-213':{size:[3.2,2,12],pitch:.05,features:'3.2×12m实体坡接：0.2至2m的离散上升、闭合底面、石层灰缝和实际钢边',limits:'作者坡长12m、升高1.8m；50mm体素阶梯表面，不冒称连续解析斜面。上表面与实体同源，底面实际闭合。'+marketLimit,draw:b=>{
  b.part('逐列正高混凝土实体与闭合底面',()=>{for(let i=0;i<240;i++){const h=(4+Math.round(36*i/239))*.05;b.b(0,0,i*.05,3.2,h,.05,b.s.structuralConcrete);}});
  b.part('逐列石铺面及下方灰缝',()=>{for(let i=0;i<240;i++){const h=(4+Math.round(36*i/239))*.05;b.b(0,h-.1,i*.05,3.2,.05,.05,b.s.mortar);b.b(0,h-.05,i*.05,3.2,.05,.05,i%10===0?b.s.mortar:b.s.wall);}});
  b.part('沿实际坡顶的连续钢边',()=>{for(let i=0;i<240;i++){const h=(4+Math.round(36*i/239))*.05;for(const x of[0,3.15])b.b(x,h-.1,i*.05,.05,.1,.05,b.s.metal);}});
  b.part('两端铜接点与实体低端门槛',()=>{for(const x of[.1,3]){pin(b,x,.15,.05,.05);pin(b,x,1.95,11.9,.05);}b.b(.2,.1,0,2.8,.05,.1,b.s.metal);});
 }},
 'BUILT-214':{size:[6,.2,.8],pitch:.05,features:'6m独立边沟盖：钢框、石盖区、真实细格栅与可见排水槽隙',limits:'盖板与沟渠分开；本件不含整段道路或地下水系统，slit宽0.05m以上。'+marketLimit,draw:b=>{
  b.part('连续周边钢框与中部承轨',()=>{for(const z of[0,.7])b.b(0,0,z,6,.2,.1,b.s.metal);for(const x of[0,5.9])b.b(x,0,0,.1,.2,.8,b.s.metal);for(const x of[2,4])b.b(x,0,0,.1,.15,.8,b.s.metal);});
  b.part('两个独立石盖区',()=>{for(const x of[1,3])b.b(x,.1,.1,1,.1,.6,b.s.wall);});
  b.part('真实亮钢格栅和开放槽隙',()=>{for(let i=0;i<30;i++){const x=.1+i*.2;if((x>=1&&x<2)||(x>=3&&x<4))continue;b.b(x,.1,.1,.05,.1,.6,b.s.metalBright);}});
  b.part('端部铜扣及石盖钢压片',()=>{for(const x of[.1,5.8])for(const z of[0,.7])b.b(x,.15,z,.1,.05,.1,b.s.bronze);for(const x of[1,1.9,3,3.9])b.b(x,.15,.35,.1,.05,.1,b.s.metal);});
 }},
 'BUILT-215':kerb,
 'BUILT-216':{size:[4,2,.6],pitch:.1,features:'4m有限挡土侧体：真实混凝土墙芯、分缝石面、压顶、钢脚和三个贯通泄水孔',limits:'作者挡土高2m、厚0.6m，土体和地形另附，不能烘成整片平地。'+marketLimit,draw:b=>{
  b.part('连续混凝土墙芯与金属底脚',()=>{b.b(0,0,0,4,1.8,.6,b.s.structuralConcrete);b.b(0,0,0,4,.2,.6,b.s.metal);});
  b.part('分块浅石面及独立灰缝',()=>{b.b(0,.2,0,4,1.6,.1,b.s.mortar);for(let i=0;i<4;i++)for(let j=0;j<4;j++)b.b(i,.2+j*.4,0,.9,.3,.1,b.s.wall);});
  b.part('石压顶与三条真实泄水孔',()=>{b.b(0,1.8,0,4,.2,.6,b.s.wall);for(const x of[.7,1.9,3.1])b.b(x,.4,0,.2,.2,.6,0);});
  b.part('端部钢扣与铜销',()=>{for(const x of[0,3.8]){b.b(x,1.7,0,.2,.2,.6,b.s.metal);pin(b,x,1.9,.2,.1);}});
 }},
 'BUILT-217':{size:[3.2,2,4],pitch:.05,features:'3.2m步行连接十级台阶：精确0.2m步高、0.4m作者踏深、闭合承芯与独立防滑鼻口',limits:'十级共升高2m；步行连接，不生成车辆坡道。未把参考侧柱/完整围栏重复并入；扶栏另装。'+marketLimit,draw:b=>{
  b.part('十级真实混凝土承芯',()=>{for(let i=0;i<10;i++)b.b(0,0,i*.4,3.2,(i+1)*.2,.4,b.s.structuralConcrete);});
  b.part('石踏面、踢面和独立灰缝床',()=>{for(let i=0;i<10;i++){const h=(i+1)*.2;b.b(0,h-.1,i*.4,3.2,.05,.4,b.s.mortar);b.b(0,h-.05,i*.4,3.2,.05,.4,b.s.wall);b.b(.1,h-.2,i*.4,3,.1,.05,b.s.wall);}});
  b.part('真实金属防滑鼻口与两侧收边',()=>{for(let i=0;i<10;i++){const h=(i+1)*.2;b.b(.2,h-.05,i*.4,2.8,.05,.05,b.s.metal);for(const x of[0,3.1])b.b(x,h-.2,i*.4,.1,.2,.4,b.s.wall);}});
  b.part('首末踏步铜锁',()=>{for(const x of[.1,3.05]){pin(b,x,.15,.1,.05);pin(b,x,1.95,3.9,.05);}});
 }},
 'BUILT-218':{size:[4,6.4,.3],pitch:.02,features:'两层标准实开间幕墙：铝框、真实横竖分格、独立橡胶环、退界薄玻璃与三层遮阳安装槽',limits:'作者4m开间、两层3.2m；玻璃厚0.04m并退界0.16m，不用整块透明box代墙。楼板与遮阳叶片另装，未绑定原Building/FloorPlan。',draw:b=>{
  b.part('连续铝合金立框与三道楼层横框',()=>{for(const x of[0,1.28,2.56,3.8])b.b(x,0,0,.2,6.4,.3,b.s.facadeFrame);for(const [y,h]of[[0,.24],[3.1,.2],[6.16,.24]])b.b(0,y,0,4,h,.3,b.s.facadeFrame);});
  b.part('六块独立薄玻璃和真实环形窗封',()=>{for(const [x,w]of[[.2,1.08],[1.48,1.08],[2.76,1.04]])for(const[y,h]of[[.24,2.86],[3.3,2.86]]){b.b(x,y,.12,w,h,.12,b.s.facadeSeal);b.b(x+.04,y+.04,.12,w-.08,h-.08,.12,0);b.b(x+.04,y+.04,.16,w-.08,h-.08,.04,b.s.glass);b.b(x+.06,y+.06,.16,.2,.02,.04,b.s.glassEtch);}});
  b.part('真实钢锚、铜锁与内嵌暖芯',()=>{for(const x of[0,3.84])for(const y of[.04,3.12,6.2]){b.b(x,y,0,.16,.08,.08,b.s.metal);pin(b,x+.04,y,.0,.04);}for(const x of[.04,3.92])b.b(x,1,0,.04,.2,.02,b.s.warm);});
  b.part('九片遮阳叶的三层凹入安装槽',()=>{for(const x of civicShadeX)for(const y of civicShadeY)b.b(x,y,0,.2,.08,.08,0);});
 }},
 'BUILT-219':{size:[.2,6.4,.68],pitch:.02,features:'单片竖向金属遮阳：6.4m金色阳极氧化铝薄叶、硬边端盖、三只钢背托与铜销',limits:'单叶母版按真实开间复用，9片仍计一个母版；金色为独立铝材而非黄铜。安装槽与幕墙横框匹配，不含整幅幕墙或室内植物；未作能耗/气候遮阳认证。',draw:b=>{
  b.part('连续硬边铝制薄叶',()=>b.b(.06,0,0,.08,6.4,.52,b.s.sunshadeMetal));
  b.part('上下端盖与独立前缘加强条',()=>{for(const y of[0,6.3])b.b(0,y,0,.2,.1,.52,b.s.facadeFrame);b.b(.04,.1,0,.12,6.2,.04,b.s.sunshadeMetal);});
  b.part('三只真实背托',()=>{for(const y of civicShadeY)b.b(0,y,.48,.2,.08,.2,b.s.metal);});
  b.part('三层铜紧固销与末端金属夹',()=>{for(const y of civicShadeY){pin(b,0,y,.5,.04);pin(b,.16,y,.5,.04);}});
 }},
};
export const civicShadeX=Array.from({length:9},(_,i)=>.3+i*.4);
export const civicShadeY=[.12,3.16,6.28];
export function civicComponent(id:string,a?:Asset){return String((a?.source?.parameters as Record<string,unknown>|undefined)?.component??Object.keys(civicVariants[id]??{})[0]??'default');}
export function selectCivicRecipe(id:string,component:unknown){if(!civicRecipes[id]){if(component!==undefined)throw new Error('本清单不支持组件选择');return undefined;}if(component===undefined)return civicRecipes[id];if(typeof component!=='string'||!civicVariants[id]?.[component])throw new Error('此清单组件尚未验证');return civicVariants[id][component];}
const allowed:Record<string,string[]>={
 '207':['structuralConcrete','mortar','wall','metal','bronze','warm'],'208':['structuralConcrete','wall','metal','bronze','warm','bridgeBearing'],'209':['structuralConcrete','wall','metal','bronze'],'210':['wall','metal','glass','warm','bronze'],
 '212':['structuralConcrete','wall','metal','mortar','bronze','warm'],'213':['structuralConcrete','mortar','wall','metal','bronze'],'214':['metal','wall','metalBright','bronze'],'215':['structuralConcrete','mortar','wall','metal','bronze'],'216':['structuralConcrete','mortar','wall','metal','bronze'],'217':['structuralConcrete','mortar','wall','metal','bronze'],
 '218':['facadeFrame','facadeSeal','glass','glassEtch','metal','bronze','warm'],'219':['sunshadeMetal','facadeFrame','metal','bronze'],
};
export function civicMaterialRule(id:string,a:Asset){if(!civicRecipes[id])return undefined;const roles=allowed[id.slice(-3)],component=civicComponent(id,a),required=id==='BUILT-208'?roles.filter(r=>r!==(component==='pier'?'bridgeBearing':'warm')):roles;return{required,allowed:roles,note:'明确作者物理分层：石、结构混凝土、灰缝、钢铜、支座、幕墙铝框和窗封、阳极氧化遮阳叶分别保留；透明玻璃两面无橡胶覆盖。'};}
export function configureCivicAsset(a:Asset,id:string){
 if(!civicRecipes[id])return;const component=civicComponent(id,a);a.source!.component=component;
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(['BUILT-207','BUILT-208','BUILT-209','BUILT-210'].includes(id))a.source!.isolatedBridge={originalDescriptorAvailable:false,originalTerrainContactsAvailable:false,originalGameFinalPass:false,historicalFailures:['giant block / ray mismatch','new lower pier conflict'],sourceCounts:{landings:2,piers:6,caps:8,footings:32,foundations:8,terrainContacts:160,rails:13},countsReconstructed:false};
 if(id==='BUILT-207'){if(component==='liftLanding')empty([3,0,0],[6,3,3]);port('bridge','high-landing',[4.5,.6,component==='liftLanding'?4:0],[0,0,component==='liftLanding'?1:-1],[9,.6,0]);}
 if(id==='BUILT-208'){a.source!.authoredDatum=component==='pier'?{worldBottomYM:243.6,worldTopYM:251.6}:{worldBottomYM:251.6,worldTopYM:252.8};if(component==='pier')port('cap','civic-cap',[2,8,1.5],[0,1,0],[4,0,3]);else port('pier','civic-cap',[4.5,0,1.6],[0,-1,0],[4,0,3]);}
 if(id==='BUILT-209'){a.source!.authoredFoundation=component==='footing'?{bottomBandsM:civicContactHeights,topYM:1,positiveHeightsM:civicContactHeights.map(n=>1-n),originalSamples:false}:{sizeM:[4,1,3],footingCount:4};}
 if(id==='BUILT-210'){a.source!.authoredBody={radiusM:.35,heightM:1.72,wholeOriginalRouteAvailable:false};empty([.3,.4,0],[1.8,1.05,.1]);}
 if(['BUILT-212','BUILT-213','BUILT-214','BUILT-215','BUILT-216','BUILT-217'].includes(id))a.source!.marketSurface={nativeOccupancyAuthoritative:true,originalSurfaceAvailable:false,runtime24TickVerified:false};
 if(id==='BUILT-212')a.source!.earthwork={authoredTerrainYM:0,topYM:2,fillM:2,sourceLimitM:4};
 if(id==='BUILT-213')a.source!.ramp={widthM:3.2,lengthM:12,lowYM:.2,highYM:2,quantizationM:.05,surfaceRule:'topCells=4+round(36*zIndex/239)',analyticSlope:false};
 if(id==='BUILT-214'){empty([.2,0,.1],[.3,.2,.7]);empty([4.4,0,.1],[4.5,.2,.7]);}
 if(id==='BUILT-215'&&component==='treeRing')empty([.3,0,.3],[2.9,1,2.9]);
 if(id==='BUILT-216')for(const x of[.7,1.9,3.1])empty([x,.4,0],[x+.2,.6,.6]);
 if(id==='BUILT-217'){a.source!.stair={widthM:3.2,riseM:.2,count:10,treadM:.4,topYM:2,pedestrianOnly:true};for(let i=0;i<10;i++)empty([.2,(i+1)*.2,i*.4],[3,(i+1)*.2+1.72,(i+1)*.4]);}
 if(id==='BUILT-218'){a.source!.facade={authoredBayM:4,storeyHeightM:3.2,storeys:2,glassInsetM:.16,glassThicknessM:.04,originalFloorPlanAvailable:false,mountingRecesses:{x:civicShadeX,y:civicShadeY,sizeM:[.2,.08,.08]}};for(const [i,x]of civicShadeX.entries())port('shade-'+i,'facade-shade',[x+.1,.16,.08],[0,0,-1],[.2,.08,0]);}
 if(id==='BUILT-219')port('mount','facade-shade',[.1,.16,.68],[0,0,1],[.2,.08,0]);
}
