import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';
const limits='原Vehicle/AerialVehicle、SimState、NetworkEdge、停稳/权限/登离/飞行/转向状态及机型规格未提供；均为明确作者米制接口样件，不宣称原游戏W运行、驾驶、动画、浮力或受力认证。';
const pin=(b:Shapes,x:number,y:number,z:number,t=.1)=>b.b(x,y,z,t,t,t,b.s.bronze);
function discX(b:Shapes,x:number,y:number,z:number,r:number,d:number,m:number){const p=b.pitch;for(let iy=Math.round((y-r)/p);iy<Math.round((y+r)/p);iy++)for(let iz=Math.round((z-r)/p);iz<Math.round((z+r)/p);iz++)if(((iy+.5)*p-y)**2+((iz+.5)*p-z)**2<=r*r+1e-9)b.b(x,iy*p,iz*p,d,p,p,m);}
const railBogie:AtlasRecipe={size:[3,1.4,3.2],pitch:.05,features:'两轴轨道钢轮架：四钢轮踏面、内轮缘、实心车轴、轴箱、弹簧与车体上承鞍',limits:'作者轮踏半径0.5m/轮缘0.55m，最下轮缘Y0、踏面Y0.05；安装到真实双钢轨头，不借橡胶车胎。'+limits,draw:b=>{
 b.part('四钢轮踏面和独立内轮缘',()=>{for(const z of[.6,2.6]){for(const x of[0,2.7])discX(b,x,.55,z,.5,.3,b.s.railWheel);for(const x of[.25,2.65])discX(b,x,.55,z,.55,.1,b.s.railWheel);}});
 b.part('实心车轴、轴箱与外锁帽',()=>{for(const z of[.6,2.6]){b.b(.3,.45,z-.1,2.4,.2,.2,b.s.metalBright);for(const x of[.4,2.35])b.b(x,.4,z-.15,.25,.5,.3,b.s.metal);for(const x of[0,2.9])pin(b,x,.5,z-.05);}});
 b.part('两侧连续钢架和端横梁',()=>{for(const x of[.4,2.3])b.b(x,.8,0,.3,.4,3.2,b.s.metal);for(const z of[.2,2.7])b.b(.4,.8,z,2.2,.4,.3,b.s.metal);});
 b.part('四组分层金属弹簧与上承鞍',()=>{for(const x of[.8,2.2])for(const z of[.6,2.6]){b.cylinder(x,.6,z,.15,.6,b.s.metal);for(const y of[.65,.85,1.05])b.cylinder(x,y,z,.2,.1,b.s.metalBright);}b.b(.5,1.2,1.2,2,.2,.8,b.s.enamel);});
 b.part('有限铜紧固与实涂检查标记',()=>{for(const x of[.45,2.4])for(const z of[.05,3.05])pin(b,x,1.1,z);b.b(.55,1.3,1.3,.2,.1,.1,b.s.printedWarning);});
}};
const maglevBase:AtlasRecipe={size:[3,1.4,3.2],pitch:.05,features:'磁浮导向U形底座：真实下包唇和导向间隙、分段绕组、钢上架和车体上承鞍',limits:'不同于轮轨：无钢轮/车轴，作者中心导梁宽0.8m、两侧0.1m空气隙。静态检修止挡承托，未用磁力假装悬浮。'+limits,draw:b=>{
 b.part('两侧导鞋和实际下包唇',()=>{for(const x of[.7,2])b.b(x,0,.2,.3,.9,2.8,b.s.metal);for(const x of[.7,1.8])b.b(x,0,.2,.5,.2,2.8,b.s.metal);});
 b.part('实绕组块与独立导向钢面',()=>{for(const x of[.9,2])for(const z of[.4,.9,1.4,1.9,2.4]){b.b(x,.25,z,.1,.5,.3,b.s.maglevCoil);for(const y of[.35,.55])b.b(x,y,z,.1,.05,.3,b.s.metalBright);}});
 b.part('检修承脚和连续上钢架',()=>{for(const x of[.4,2.3])b.b(x,.3,.2,.3,.7,2.8,b.s.metal);b.b(0,1,0,3,.2,3.2,b.s.metal);});
 b.part('上承鞍和独立涂装盖',()=>{b.b(.5,1.2,1.2,2,.2,.8,b.s.enamel);for(const x of[.2,2.6])b.b(x,1.1,.2,.2,.1,2.8,b.s.enamel);});
 b.part('铜锚与实体警示涂料',()=>{for(const x of[.05,2.85])for(const z of[.05,3.05])pin(b,x,1.1,z);b.b(.55,1.3,1.3,.2,.1,.1,b.s.printedWarning);});
}};
function gear(b:Shapes,h:number){
 b.part('两个真实橡胶轮胎和独立轮圈',()=>{for(const x of[0,1.4]){discX(b,x,.6,.6,.6,.4,b.s.rubber);discX(b,x,.6,.6,.35,.4,b.s.metalBright);}});
 b.part('横轴、双叉与减震活塞',()=>{b.b(.4,.5,.5,1,.2,.2,b.s.metalBright);for(const x of[.5,1.1])b.b(x,.6,.45,.2,h-.95,.3,b.s.metal);b.cylinder(.9,1,.6,.15,h-1.2,b.s.metalBright);});
 b.part('外筒、实心上安装板和连接锁',()=>{b.cylinder(.9,h-1,.6,.3,.8,b.s.metal);b.b(.3,h-.2,.1,1.2,.2,1,b.s.aircraftSkin);for(const x of[.35,1.35])for(const z of[.15,.95])pin(b,x,h-.1,z);});
 b.part('真实防扭连杆和铜铰轴',()=>{b.beam([.75,.85,.85],[.75,h-.5,.85],.1,b.s.metal);pin(b,.75,1,.8);pin(b,.75,h-.55,.8);});
 b.part('轮轴外帽与维护涂印',()=>{for(const x of[0,1.7])pin(b,x,.55,.55);b.b(.4,h-.1,.2,.15,.1,.15,b.s.printedWarning);});
}
const gearDeployed:AtlasRecipe={size:[1.8,2.4,1.2],pitch:.05,features:'客机双轮起落架放下静态形状：轮胎、独立轮圈、双叉、减震外筒、活塞和上安装板',limits:'作者自由伸长总高2.4m，轮胎直径1.2m；另有压缩和90度收起静态形状，不声称状态机/动画。'+limits,draw:b=>gear(b,2.4)};
const gearCompressed:AtlasRecipe={...gearDeployed,size:[1.8,2,1.2],features:'同轮径起落架压缩静态形状：上安装面降低0.4m，轮胎/车轴不缩放',draw:b=>gear(b,2)};
const gearRetracted:AtlasRecipe={...gearDeployed,size:[1.8,1.2,2.4],features:'同一放下起落架刚体转90度的收起静态形状：进入明确检修舱，不改变材料与占用数',draw:b=>{const c=new Shapes(b.pitch,b.s);gear(c,2.4);for(const[v,m]of c.g.cells())b.g.set([v[0],v[2],48-v[1]-1],m);for(const p of c.parts)b.parts.push({...p,region:{min:[p.region.min[0],p.region.min[2],48-p.region.max[1]],max:[p.region.max[0],p.region.max[2],48-p.region.min[1]]}});}};
function wing(b:Shapes,left:boolean){const c=new Shapes(b.pitch,b.s);
 c.part('七米半翼封闭蒙皮、后掠和渐薄真翼腔',()=>{for(let i=0;i<70;i++){const x=i*.1,lead=Math.round(x*.2/.1)*.1,back=3.6-Math.round(x*.1/.1)*.1,h=x<4?.4:x<6?.3:.2;c.b(x,0,lead,.1,h,back-lead,c.s.aircraftSkin);if(h>.2)c.b(x,.1,lead+.1,.1,h-.2,back-lead-.2,0);}});
 c.part('连续主梁、根部实心夹与七肋板',()=>{for(let i=0;i<70;i++){const x=i*.1,h=x<4?.4:x<6?.3:.2;c.b(x,.1,1.8,.1,Math.max(.1,h-.2),.2,c.s.metal);}for(const x of[.5,1.5,2.5,3.5,4.5,5.5,6.5]){const lead=Math.round(x*.2/.1)*.1,h=x<4?.4:x<6?.3:.2;c.b(x,0,lead,.1,h,3.6-Math.round(x*.1/.1)*.1-lead,c.s.metal);}c.b(0,0,0,.3,.4,3.6,c.s.metal);});
 c.part('翼端立片、硬边与实际边缘涂印',()=>{c.b(6.8,.2,1.5,.2,1.4,1.2,c.s.aircraftSkin);c.b(6.8,1.5,1.5,.2,.1,1.2,c.s.metal);c.b(6.9,.3,2.5,.1,1.1,.1,c.s.printedRed);});
 c.part('根部铜锁及独立未绑定导航灯',()=>{for(const z of[.1,3.3])pin(c,.1,.3,z);c.b(6.9,.3,1.6,.1,.2,.3,c.s[left?'navPortLamp':'navStarboardLamp']);});
 c.part('真实贯通吊舱挂柱槽与加固边',()=>{c.b(2.9,0,1.1,.6,.4,1.4,c.s.metal);c.b(3,0,1.2,.4,.4,1.2,0);});
 for(const[v,m]of c.g.cells())b.g.set(left?[69-v[0],v[1],v[2]]:v,m);for(const p of c.parts)b.parts.push({...p,region:left?{min:[70-p.region.max[0],p.region.min[1],p.region.min[2]],max:[70-p.region.min[0],p.region.max[1],p.region.max[2]]}:p.region});
}
const portWing:AtlasRecipe={size:[7,1.6,3.6],pitch:.1,features:'左七米半翼与翼端：实际封闭翼腔、后掠渐薄、主梁/肋、真实发动机挂槽及左导航芯',limits:'作者4m机身试架+左右各7m，整体18m翼展；不沿用17m代理，不将宽body当翼。导航状态未绑定且零发光。'+limits,draw:b=>wing(b,true)};
const starboardWing:AtlasRecipe={...portWing,features:'右七米半翼：与左翼镜像但导航用途角色独立，挂柱槽、根向和翼端真实相反',draw:b=>wing(b,false)};
const horizontalTail:AtlasRecipe={size:[6,.4,3],pitch:.1,features:'完整六米水平尾翼：左右一体后掠蒙皮、主梁肋、中央安装鞍和硬边实体涂印',limits:'作者完整平尾，左右不能重复计母版；verticalTail为同一家族独立垂尾。静态朝向与明确机身试架一致。'+limits,draw:b=>{
 b.part('左右连续阶梯后掠平尾和封闭薄腔',()=>{for(let i=0;i<60;i++){const x=i*.1,t=Math.abs(x+.05-3)/3,lead=Math.round(t*.8/.1)*.1,back=Math.round(t*.4/.1)*.1;b.b(x,0,lead,.1,.4,3-lead-back,b.s.aircraftSkin);b.b(x,.1,lead+.1,.1,.2,2.8-lead-back,0);}});
 b.part('实心主梁和五道薄肋',()=>{b.b(0,.1,1.4,6,.2,.2,b.s.metal);for(const x of[1,2,3,4,5])b.b(x,0,.6,.1,.4,1.8,b.s.metal);});
 b.part('中央真实垂尾承面和机身根夹',()=>b.b(2.6,0,0,.8,.4,3,b.s.metal));
 b.part('边缘涂印与根部铜销',()=>{for(const x of[.1,5.8])b.b(x,.3,1.2,.1,.1,.5,b.s.printedRed);for(const x of[2.7,3.2])for(const z of[.1,2.8])pin(b,x,.3,z);});
}};
const verticalTail:AtlasRecipe={size:[.4,3,3],pitch:.1,features:'独立三米垂直尾翼：全厚安装脚、后掠立片、承力前脊和红色实体尾缘涂印',limits:horizontalTail.limits,draw:b=>{
 b.part('完整根夹与后掠立片蒙皮',()=>{b.b(0,0,0,.4,.2,3,b.s.metal);for(let i=2;i<30;i++){const y=i*.1,lead=Math.round(y*.5/.1)*.1,back=3-Math.round(y*.15/.1)*.1;b.b(.1,y,lead,.2,.1,back-lead,b.s.aircraftSkin);}});
 b.part('真实前脊与层间肋',()=>{for(let i=2;i<30;i++){const y=i*.1,lead=Math.round(y*.5/.1)*.1;b.b(.1,y,lead,.2,.1,.1,b.s.metal);}});
 b.part('尾缘实体红印与有限端盖',()=>{for(let i=2;i<30;i++){const y=i*.1,back=3-Math.round(y*.15/.1)*.1;b.b(.2,y,back-.2,.1,.1,.2,b.s.printedRed);}});
 b.part('根部铜销与钢底边',()=>{for(const z of[.1,2.8])pin(b,.1,.1,z);b.b(.1,.2,.1,.2,.1,.3,b.s.metal);});
}};
const bollard:AtlasRecipe={size:[1.2,1.2,1.2],pitch:.05,features:'码头系船柱：石基、钢底板、粗钢柱、宽帽、四铜锚和独立非承载展示缆绳卷',limits:'系船绳卷为非碰撞织物，未连接或锁定船体；安装避开公共通路。'+limits,draw:b=>{
 b.part('石质底鞋、钢板与真实柱身',()=>{b.b(0,0,0,1.2,.2,1.2,b.s.wall);b.b(.1,.2,.1,1,.1,1,b.s.metal);b.cylinder(.6,.3,.6,.25,.7,b.s.metal);});
 b.part('宽钢柱帽与顶面',()=>{b.b(.15,1,.15,.9,.2,.9,b.s.metal);b.b(.2,1.15,.2,.8,.05,.8,b.s.metalBright);});
 b.part('三层编织缆绳卷',()=>{for(const y of[.45,.65,.85])b.cylinder(.6,y,.6,.35,.1,b.s.mooringLine,.25);});
 b.part('四铜锚与涂印',()=>{for(const x of[.15,.95])for(const z of[.15,.95])pin(b,x,.25,z);b.b(.25,1.1,.15,.15,.05,.05,b.s.printedWarning);});
}};
const fender:AtlasRecipe={size:[2,.8,.6],pitch:.05,features:'独立码头橡胶护舷：有限圆角厚垫、钢背板、两道实夹与四铜紧固',limits:'独立护舷不借轮胎；安装在明确码头侧壁和下托上，与实际船体水线一致。'+limits,draw:b=>{
 b.part('实际钢背板和有限厚橡胶垫',()=>{b.b(0,0,.5,2,.8,.1,b.s.metal);b.rounded(0,0,0,2,.8,.5,.15,b.s.dockFender);});
 b.part('两端实际钢夹带',()=>{for(const x of[.15,1.75])b.b(x,0,.1,.1,.8,.5,b.s.metal);});
 b.part('背板四角铜锁',()=>{for(const x of[.05,1.85])for(const y of[.05,.65])pin(b,x,y,.5);});
 b.part('夹带维护涂印',()=>{for(const x of[.15,1.75])b.b(x,.35,.1,.1,.1,.05,b.s.printedWarning);});
}};
export const vesselVariants:Record<string,Record<string,AtlasRecipe>>={'BUILT-289':{railBogie,maglevBase},'BUILT-294':{gearDeployed,gearCompressed,gearRetracted},'BUILT-295':{portWing,starboardWing},'BUILT-297':{horizontalTail,verticalTail},'BUILT-300':{bollard,fender}};
export const vesselRecipes:Record<string,AtlasRecipe>={
 'BUILT-289':railBogie,
 'BUILT-290':{size:[2.4,3,1.2],pitch:.05,features:'缆车吊架与双承索夹：下承板、连续吊臂、双夹体和两条真实贯通索孔',limits:'作者双索沿+Z，索孔0.2m方截面，孔顶2.75m；下承板托住明确轿厢顶板而非悬浮贴件。'+limits,draw:b=>{
 b.part('轿厢下承板与连续吊臂',()=>{b.b(.4,0,0,1.6,.2,1.2,b.s.metal);b.b(1,.2,.4,.4,2,.4,b.s.metal);});
 b.part('双索夹下横梁和两侧承臂',()=>{b.b(.2,1.9,.1,2,.2,1,b.s.metal);for(const x of[.2,1.8])b.b(x,1.9,.1,.4,.7,1,b.s.metal);});
 b.part('两个完整索夹与实际贯穿方孔',()=>{for(const x of[0,1.6]){b.b(x,2.2,0,.8,.8,1.2,b.s.metal);b.b(x+.1,2.3,0,.6,.6,.1,b.s.metalBright);b.b(x+.3,2.55,0,.2,.2,1.2,0);}});
 b.part('实际铜铰销与涂装外片',()=>{for(const x of[.05,1.65]){pin(b,x,2.25,.1,.15);pin(b,x+.55,2.8,.1,.15);}b.b(1,.4,.35,.4,.8,.05,b.s.enamel);});
 b.part('下承板铜锚和检修涂印',()=>{for(const x of[.5,1.8])for(const z of[.1,1])pin(b,x,.1,z);b.b(1.1,.7,.35,.2,.2,.05,b.s.printedWarning);});
 }},
 'BUILT-291':{size:[6,2,10],pitch:.1,features:'六米宽渡船封闭船艏与厚底：阶梯收艏、0.3m底、侧壳、舱内隔板、可读水线和连续甲板',limits:'作者长度10m，局部水线Y1m、甲板Y2m；测试显式水面和检修龙骨垫，不宣称浮力模拟。'+limits,draw:b=>{
 b.part('闭合阶梯船底与侧壳',()=>{for(let j=0;j<100;j++)for(let k=0;k<18;k++){const z=j*.1,y=k*.1,bow=z<2?Math.round((2-z)*.5/.1)*.1:0,low=y<.8?Math.round((.8-y)*.5/.1)*.1:0,edge=bow+low,w=6-2*edge,m=y<1?b.s.marineAntifouling:b.s.marineHull;if(k<3||j<2||j>=98)b.b(edge,y,z,w,.1,.1,m);else{b.b(edge,y,z,.2,.1,.1,m);b.b(6-edge-.2,y,z,.2,.1,.1,m);}}});
 b.part('三道真实内部隔板与连续封闭甲板',()=>{for(const z of[2,5,8])b.b(.4,.3,z,5.2,1.5,.1,b.s.metal);for(let j=0;j<100;j++){const z=j*.1,edge=z<2?Math.round((2-z)*.5/.1)*.1:0;b.b(edge,1.8,z,6-2*edge,.2,.1,b.s.metalBright);}});
 b.part('实际水线涂印与甲板周边包钢',()=>{for(let j=0;j<100;j++){const z=j*.1,edge=z<2?Math.round((2-z)*.5/.1)*.1:0;for(const x of[edge,6-edge-.1])b.b(x,1,z,.1,.1,.1,b.s.printedMark);}for(const z of[.1,9.8])b.b(1,1.9,z,4,.1,.1,b.s.metal);});
 b.part('有限系固铜点和甲板方向警示',()=>{for(const x of[.3,5.6])for(const z of[2.3,8.8])pin(b,x,1.9,z);b.b(5.7,1.9,4.1,.2,.1,1.8,b.s.printedWarning);});
 }},
 'BUILT-292':{size:[6,1.2,10],pitch:.1,features:'同6×10m甲板的完整舷栏：后掠船艏跟随栏、钢上下杆、薄玻璃和右侧真实2m登离缺口',limits:'右侧Z4–6m开口，内侧通道保持开放；栏杆不虚构开启权限。'+limits,draw:b=>{
 b.part('跟随收艏的阶梯侧栏与真实登离缺口',()=>{for(let j=0;j<98;j++){const z=j*.1,edge=z<2?Math.round((2-z)*.5/.1)*.1:0;for(const x of[edge,6-edge-.2]){if(x>3&&z>=4&&z<6)continue;for(const y of[0,1.1])b.b(x,y,z,.2,.1,.1,b.s.metal);b.b(x+.1,.2,z,.1,.9,.1,b.s.glass);}}});
 b.part('首尾横栏和封闭角连接',()=>{for(const[z,x,w]of[[0,1,4],[9.8,0,6]]){for(const y of[0,1.1])b.b(x,y,z,w,.1,.2,b.s.metal);b.b(x,.2,z+.1,w,.9,.1,b.s.glass);}});
 b.part('八对实际承柱与口边短柱',()=>{for(const z of[0,2,3.8,6,8,9.8]){const edge=z<2?Math.round((2-z)*.5/.1)*.1:0;for(const x of[edge,6-edge-.2])b.b(x,0,z,.2,1.2,.2,b.s.metal);}});
 b.part('铜柱帽与入口实体涂印',()=>{for(const z of[2,3.8,6,8])for(const x of[0,5.8])pin(b,x,1.1,z);for(const z of[3.8,6])b.b(5.9,.3,z,.1,.5,.1,b.s.printedWarning);});
 }},
 'BUILT-293':{size:[2.4,1.2,4],pitch:.05,features:'四米固定登离接板：封闭钢底、2m净宽防滑实面、钢护栏和真实端部支承接口',limits:'作者固定landing，顶面局部Y0.2m；船/岸端同高的明确安装样件，无停稳状态时不开放虚构登离功能。'+limits,draw:b=>{
 b.part('连续封闭承板与独立金属防滑踏面',()=>{b.b(0,0,0,2.4,.15,4,b.s.metal);b.b(.2,.15,0,2,.05,4,b.s.metalBright);});
 b.part('双侧上下护边及六对承柱',()=>{for(const x of[0,2.2]){for(const y of[.15,1.1])b.b(x,y,0,.2,.1,4,b.s.metal);for(const z of[0,.75,1.5,2.25,3,3.8])b.b(x,.25,z,.2,.85,.2,b.s.metal);}});
 b.part('实际横向防滑嵌条与边侧警示涂料',()=>{for(let i=1;i<20;i++)b.b(.35,.15,i*.2,1.7,.05,.05,b.s.enamel);for(const x of[.2,2.1])b.b(x,.15,0,.1,.05,4,b.s.printedWarning);});
 b.part('端部钢锁、铜销与侧板凹槽',()=>{for(const x of[.05,2.25])for(const z of[.05,3.85])pin(b,x,1.1,z,.05);for(const z of[0,3.9])b.b(.4,0,z,1.6,.1,.1,b.s.metal);});
 }},
 'BUILT-294':gearDeployed,'BUILT-295':portWing,
 'BUILT-296':{size:[1.6,2.4,3.2],pitch:.05,features:'独立发动机吊舱：环形双层蒙皮、真实进排气空腔、八片静态风扇、挂柱和跨翼上承帽',limits:'直径1.6m、长3.2m，上承帽底Y2.3m通过机翼真槽承托。叶片不旋转，无推力或未经系统消费的烟雾。'+limits,draw:b=>{
 b.part('真实环形蒙皮与金属内衬',()=>{b.cylinder(.8,.8,0,.8,3.2,b.s.aircraftSkin,.65,'z');b.cylinder(.8,.8,0,.7,3.2,b.s.metal,.6,'z');});
 b.part('八片实际风扇和中央轮毂',()=>{b.cylinder(.8,.8,.6,.2,.2,b.s.metalBright,0,'z');for(let i=0;i<8;i++){const a=i*Math.PI/4;b.beam([.8+.15*Math.cos(a),.8+.15*Math.sin(a),.65],[.8+.65*Math.cos(a),.8+.65*Math.sin(a),.65],.05,b.s.metalBright);}});
 b.part('开放尾喷圈与实体红色外环',()=>{b.cylinder(.8,.8,2.9,.6,.3,b.s.metalBright,.4,'z');b.cylinder(.8,.8,1.2,.8,.1,b.s.printedRed,.75,'z');});
 b.part('连续挂柱与宽上承帽',()=>{b.b(.6,1.45,1.2,.4,.85,1.2,b.s.metal);b.b(.45,2.3,1.1,.7,.1,1.4,b.s.metal);});
 b.part('实际铜销与短侧接头',()=>{for(const x of[.45,1.05])for(const z of[1.15,2.35])pin(b,x,2.3,z,.05);b.b(.7,.025,.15,.2,.1,.1,b.s.bronze);});
 }},
 'BUILT-297':horizontalTail,'BUILT-300':bollard,
 'BUILT-307':{size:[6,2.4,4.8],pitch:.1,features:'真实接岸桥台：三段底高贴合显式岸地形、石包混凝土芯、真实桥板凹座与双支承垫',limits:'作者三段底高0/0.4/0.8m、上行面2.4m，前端槽底2m承4m宽以上桥板；非电梯landing。原terrain/共享controller与旧巨块/ray负例未在此解决。'+limits,draw:b=>{
 b.part('三段有限台阶底和实体混凝土芯',()=>{for(let i=0;i<3;i++)b.b(0,i*.4,i*1.6,6,2.4-i*.4,1.6,b.s.structuralConcrete);});
 b.part('独立石面、薄灰缝和上部石铺',()=>{for(const x of[0,5.8])for(let i=0;i<3;i++)b.b(x,i*.4,i*1.6,.2,2.4-i*.4,1.6,b.s.wall);b.b(0,2.1,0,6,.1,4.8,b.s.mortar);b.b(0,2.2,0,6,.2,4.8,b.s.wall);});
 b.part('真实桥板承槽和底部双垫',()=>{b.b(.5,2,4,5,.4,.8,0);for(const x of[.8,4.2]){b.b(x,1.8,4,1,.1,.8,b.s.metal);b.b(x,1.9,4,1,.1,.8,b.s.bridgeBearing);}});
 b.part('两侧钢接件和铜锚',()=>{for(const x of[.1,5.7]){b.b(x,1.2,4.7,.2,.7,.1,b.s.metal);pin(b,x,1.7,4.7);}b.b(.1,2.3,.1,.2,.1,.2,b.s.bronze);});
 }},
 'BUILT-308':{size:[5,1.2,2],pitch:.1,features:'桥板梁墩支座：混凝土墩帽、独立上下钢板、双橡胶支座、真实上梁与纵向密封缝',limits:'局部顶1.2m、双承载垫0.4–0.6m，明确墩→帽→垫→梁→板层级；未解决原共享桥逻辑的历史失败。'+limits,draw:b=>{
 b.part('真实墩帽和下部钢板',()=>{b.b(0,0,0,5,.3,2,b.s.structuralConcrete);b.b(.2,.3,.1,4.6,.1,1.8,b.s.metal);});
 b.part('两个独立厚承载垫与连续上钢板',()=>{for(const x of[.6,3.4])b.b(x,.4,.3,1,.2,1.4,b.s.bridgeBearing);b.b(.4,.6,.2,4.2,.2,1.6,b.s.metal);});
 b.part('完整上梁和实际密封接缝',()=>{b.b(0,.8,0,5,.4,2,b.s.structuralConcrete);b.b(0,.8,.9,5,.4,.1,b.s.jointSeal);});
 b.part('两侧钢锚和铜锁',()=>{for(const x of[.2,4.6])for(const z of[.2,1.6]){b.b(x,.1,z,.2,.2,.2,b.s.metal);pin(b,x,.2,z);}b.b(.1,1.1,.1,.2,.1,.2,b.s.bronze);});
 }},
};
export function vesselComponent(id:string,a?:Asset){return String((a?.source?.parameters as any)?.component??Object.keys(vesselVariants[id]??{})[0]??'default');}
export function selectVesselRecipe(id:string,c:unknown){if(c===undefined)return vesselRecipes[id];if(typeof c!=='string'||!vesselVariants[id]?.[c])throw new Error('此载具组件尚未验证');return vesselVariants[id][c];}
const roles:Record<string,string[]>={
 '289':['railWheel','metal','metalBright','enamel','bronze','printedWarning','maglevCoil'],'290':['metal','metalBright','enamel','bronze','printedWarning'],'291':['marineHull','marineAntifouling','metal','metalBright','printedMark','printedWarning','bronze'],'292':['metal','glass','bronze','printedWarning'],'293':['metal','metalBright','enamel','printedWarning','bronze'],'294':['rubber','metalBright','metal','aircraftSkin','bronze','printedWarning'],'295':['aircraftSkin','metal','printedRed','bronze','navPortLamp','navStarboardLamp'],'296':['aircraftSkin','metal','metalBright','printedRed','bronze'],'297':['aircraftSkin','metal','printedRed','bronze'],'300':['wall','metal','metalBright','mooringLine','bronze','printedWarning','dockFender'],'307':['structuralConcrete','wall','mortar','metal','bridgeBearing','bronze'],'308':['structuralConcrete','metal','bridgeBearing','jointSeal','bronze'],
};
export function vesselMaterialRule(id:string,a:Asset){if(!vesselRecipes[id])return undefined;const c=vesselComponent(id,a);let required=roles[id.slice(-3)];if(id==='BUILT-289')required=required.filter(r=>r!==(c==='railBogie'?'maglevCoil':'railWheel'));if(id==='BUILT-295')required=required.filter(r=>r!==(c==='portWing'?'navStarboardLamp':'navPortLamp'));if(id==='BUILT-300')required=required.filter(r=>!(c==='bollard'?['dockFender']:['wall','metalBright','mooringLine']).includes(r));return{required,allowed:required,note:'实际用途：钢轮与橡胶轮胎、导向绕组、船体上下蒙皮、实体涂印、非碰撞系船绳、护舷、独立左右导航芯、桥垫及缝封分别赋值。'};}
export function configureVesselAsset(a:Asset,id:string){if(!vesselRecipes[id])return;const c=vesselComponent(id,a);a.source!.component=c;a.source!.runtime={originalStateBound:false,animation:false,originalGameFinalPass:false};
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-289'){a.source!.guide={mode:c==='railBogie'?'wheel-rail':'maglev-inspection',rollingBottomYM:c==='railBogie'?.05:null,airGapM:c==='maglevBase'?.1:null,levitationImplemented:false};port('body','rail-body',[1.5,1.4,1.6],[0,1,0],[2,0,.8]);if(c==='maglevBase'){empty([1,.3,0],[1.1,.9,3.2]);empty([1.9,.3,0],[2,.9,3.2]);}}
 if(id==='BUILT-290'){a.source!.hanger={cableDirection:[0,0,1],cableBoresM:[{min:[.3,2.55,0],max:[.5,2.75,1.2]},{min:[1.9,2.55,0],max:[2.1,2.75,1.2]}],cableCeilingYM:2.75,authoredCabinOnly:true};port('cabin','cabin-roof',[1.2,.2,.6],[0,1,0],[1.6,0,1.2]);}
 if(id==='BUILT-291'){a.source!.hull={waterlineYM:1,deckYM:2,waterSimulation:false,closedHull:true,dryDockFixture:true};port('boarding','ferry-walk',[6,2,5],[1,0,0],[0,0,2]);}
 if(id==='BUILT-292'){empty([5.8,0,4],[6,1.72,6]);empty([.3,0,2.2],[5.7,1.72,9.7]);a.source!.boardingGapM={min:[5.8,0,4],max:[6,1.72,6]};}
 if(id==='BUILT-293'){empty([.2,.2,0],[2.2,1.92,4]);port('ship','ferry-walk',[1.2,.2,0],[0,0,-1],[2,0,0]);port('shore','ferry-walk',[1.2,.2,4],[0,0,1],[2,0,0]);a.source!.boarding={fixedLanding:true,stoppedStateBound:false,permissionBound:false};}
 if(id==='BUILT-294'){a.source!.gear={pose:c,compressionM:c==='gearCompressed'?.4:0,rigidQuarterTurn:c==='gearRetracted',flightStateBound:false};port('mount','gear-mount',c==='gearRetracted'?[.9,.6,0]:[.9,c==='gearCompressed'?2:2.4,.6],c==='gearRetracted'?[0,0,-1]:[0,1,0],c==='gearRetracted'?[1.2,1,0]:[1.2,0,1]);}
 if(id==='BUILT-295'){const left=c==='portWing',min=left?3.6:3,max=left?4:3.4;a.source!.wing={halfSpanM:7,authorFuselageWidthM:4,totalSpanM:18,usesLegacy17mProxy:false,navigationStateBound:false,pylonSocketM:{min:[min,0,1.2],max:[max,.4,2.4]}};port('engine','engine-cap',[(min+max)/2,.4,1.8],[0,1,0],[.7,0,1.4]);port('root','airliner-wing',[left?7:0,.2,1.8],left?[1,0,0]:[-1,0,0],[0,.4,3.6]);}
 if(id==='BUILT-296'){empty([.5,.5,0],[1.1,1.1,.5]);empty([.6,.6,2.6],[1,1,3.2]);port('wing','engine-cap',[.8,2.3,1.8],[0,-1,0],[.7,0,1.4]);a.source!.engine={staticFanBlades:8,thrustBound:false,smokeIncluded:false};}
 if(id==='BUILT-297'){a.source!.tail={component:c,authorHeading:[0,0,-1],yawPitchBound:false};port('base','airliner-tail',c==='horizontalTail'?[3,0,1.5]:[.2,0,1.5],[0,-1,0],c==='horizontalTail'?[.8,0,3]:[.4,0,3]);}
 if(id==='BUILT-300')a.source!.dock={component:c,mooringStateBound:false,ropeAttachedToShip:false};
 if(id==='BUILT-307'){a.source!.abutment={bottomBandsM:[0,.4,.8],terrainOriginal:false,walkYM:2.4,deckSeatM:{min:[.5,2,4],max:[5.5,2.4,4.8]},notLiftLanding:true,historicalFailures:['original giant block / ray mismatch','original lower pier conflict']};port('deck','bank-deck',[3,2,4.4],[0,1,0],[5,0,.8]);}
 if(id==='BUILT-308'){a.source!.bearing={topYM:1.2,padBottomYM:.4,padTopYM:.6,structuralAnalysis:false,historicalFailures:['original giant block / ray mismatch','original lower pier conflict']};port('beam','bank-deck',[2.5,1.2,1],[0,1,0],[5,0,2]);}
}
