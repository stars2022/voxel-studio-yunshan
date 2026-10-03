import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

function pavings(b:Shapes,x:number,y:number,z:number,w:number,d:number){
 const e=b.pitch;b.b(x,y,z,w,e,d,b.s.mortar);
 for(let xx=0;xx<w-e;xx+=.4)for(let zz=0;zz<d-e;zz+=.4)b.b(x+xx+e,y+e,z+zz+e,Math.min(.4-e,w-xx-e),e,Math.min(.4-e,d-zz-e),b.s.wall);
}
function post(b:Shapes,x:number,y:number,z:number,h:number,t=.32){
 b.b(x,y,z,t,.16,t,b.s.wall);b.b(x+.04,y+.16,z+.04,t-.08,h-.24,t-.08,b.s.wood);
 for(const yy of[y+.16,y+h-.12]){b.b(x,yy,z,t,.08,t,b.s.metal);b.b(x+.08,yy+.02,z-b.pitch,t-.16,.04,b.pitch,b.s.bronze);}
 b.b(x+.04,y+h-.04,z+.04,t-.08,.04,t-.08,b.s.woodEdge);
}
function timberRail(b:Shapes,x:number,y:number,z:number,w:number,glass=false){
 for(const xx of[x,x+w-.24])post(b,xx,y,z,1.10,.24);
 for(const yy of[y+.22,y+.92])b.b(x+.12,yy,z+.04,w-.24,.08,.16,b.s.woodEdge);
 if(glass)b.b(x+.24,y+.30,z+.10,w-.48,.62,.02,b.s.glass);
 for(let xx=x+.60;xx<x+w-.3;xx+=.60)b.b(xx,y+.30,z+.04,.06,.62,.16,b.s.wood);
}
function shopRoof(b:Shapes,x:number,w:number,d:number){
 const e=b.pitch;
 // A cross section with a lifted lip. Every backing and tile is in the grid.
 for(let z=0;z<d-e/2;z+=e){const y=.40+Math.round((.10*Math.max(0,1-z/.4)+.30*z/d)/e)*e;b.b(x,y-.20,z,w,.08,e,b.s.wood);b.b(x,y-.12,z,w,.04,e,b.s.waterproofMembrane);b.b(x,y-.08,z,w,.08,e,b.s.roof);}
 for(let xx=.12;xx<w-.08;xx+=.32)for(let z=.04;z<d-.08;z+=.40){const y=.40+Math.round((.10*Math.max(0,1-z/.4)+.30*z/d)/e)*e;b.b(x+xx,y,z,Math.min(.28,w-xx),.04,Math.min(.44,d-z),b.s.roof);b.b(x+xx+.04,y+.04,z+.04,.04,.04,Math.min(.40,d-z-.04),b.s.roof);}
 for(const z of[.36,d-.40])b.b(x+.12,0,z,w-.24,.20,.40,b.s.wood);
 for(const xx of[x+.24,x+w-.40])b.b(xx,.16,.20,.16,.20,d-.40,b.s.wood);
 for(const z of[0,d-.12])b.b(x,.32,z,w,.12,.12,b.s.woodEdge);
 for(const xx of[x,x+w-.12]){b.b(xx,.40,0,.12,.16,d,b.s.roof);b.b(xx,.24,-.04,.12,.20,.12,b.s.bronze);}
 for(let xx=x+.28;xx<x+w-.2;xx+=.4){b.b(xx,.20,-.04,.16,.16,.12,b.s.metal);b.b(xx+.04,.20,-.08,.08,.08,.04,b.s.warm);}
}
function annulus(b:Shapes,c:number,y:number,r:number,inner:number,h:number,m:number){b.cylinder(c,y,c,r,h,m,inner);}
function ringRadius(x:number,z:number){
 // 32 actual radial facets; radius is that of the polygon's vertices.
 const step=Math.PI/16,theta=Math.atan2(z,x),delta=((theta+step/2+Math.PI*2)%step)-step/2;
 return Math.hypot(x,z)*Math.cos(delta)/Math.cos(step/2);
}

export const exteriorRecipes:Record<string,AtlasRecipe>={
 'BUILT-090':{size:[6.4,4.72,3.2],pitch:.04,features:'级间飞檐外廊：实体可走楼板、护栏、双坡分层瓦面、递层翘角、柱梁短栱和独立暖带',limits:'作者6.4m直廊段，清单要求的外廊随真实楼体收分尚未接入；未伪称已运行原地标发射器。曲面用40mm阶梯表示，走廊与瓦面均为实体体素，非只显示的外壳。',draw:(b,w,h,d)=>{
  b.part('连续廊板、石铺面和承梁',()=>{b.b(0,0,.40,w,.08,2.4,b.s.wood);b.b(0,.08,.40,w,.08,2.4,b.s.structuralConcrete);pavings(b,0,.16,.40,w,2.4);for(const z of[.40,2.68])b.b(0,0,z,w,.12,.12,b.s.metal);});
  b.part('两根背侧廊柱、石脚及抬梁',()=>{for(const x of[.16,5.68]){post(b,x,.24,2.12,3.60,.56);b.b(x-.04,3.68,1.48,.64,.16,1.12,b.s.wood);for(let k=0;k<3;k++)b.b(Math.max(0,x-.08-k*.08),3.28+k*.12,1.84-k*.12,Math.min(.72+k*.16,w-Math.max(0,x-.08-k*.08)),.12,.64,b.s.wood);}b.b(.16,3.68,2.12,w-.32,.20,.40,b.s.wood);});
  b.part('双坡木基层、防水膜与真实曲线瓦体',()=>{for(let x=0;x<w-.01;x+=.04)for(let z=0;z<d-.01;z+=.04){const q=Math.abs(z+.02-d/2)/(d/2),edge=Math.max(0,1-Math.min(x,w-x-.04)/.52);const y=Math.round((3.48+.80*Math.pow(1-q,.8)+.24*edge*q)/.04)*.04;b.b(x,y-.20,z,.04,.08,.04,b.s.wood);b.b(x,y-.12,z,.04,.04,.04,b.s.waterproofMembrane);b.b(x,y-.08,z,.04,.08,.04,b.s.roof);}});
  b.part('瓦垄、分段屋脊及翘角木托',()=>{for(let x=.08;x<w-.08;x+=.32)for(let z=.04;z<d-.04;z+=.28){const q=Math.abs(z+.02-d/2)/(d/2),edge=Math.max(0,1-Math.min(x,w-x-.04)/.52),y=Math.round((3.48+.80*Math.pow(1-q,.8)+.24*edge*q)/.04)*.04;b.b(x,y,z,Math.min(.28,w-x),.04,Math.min(.28,d-z),b.s.roof);b.b(x+.08,y+.04,z+.04,.04,.04,Math.min(.20,d-z-.04),b.s.roof);}for(let x=0;x<w;x+=.4)b.b(x,4.28,1.44,Math.min(.36,w-x),.16,.32,b.s.roof);b.b(0,4.20,1.44,w,.08,.32,b.s.wood);for(const x of[0,w-.24]){b.b(x,4.20,1.44,.24,.36,.32,b.s.metal);b.b(x+.04,4.56,1.48,.16,.08,.24,b.s.bronze);}});
  b.part('廊前木玻璃护栏、嵌槽暖带',()=>{timberRail(b,.08,.24,.44,6.24,true);for(const z of[.20,2.88])for(let x=.4;x<w-.4;x+=.48){b.b(x,3.32,z,.24,.20,.12,b.s.metal);b.b(x+.04,3.36,z-.04,.16,.08,.04,b.s.warm);}b.b(.12,.08,.36,w-.24,.04,.04,b.s.warm);});
 }},
 'BUILT-091':{size:[6.4,2.9,4.8],pitch:.02,features:'顶层开放观景层：四角承柱、连续楼板、精确1.1m围护、玻璃嵌板、1.6m开放入口与安装插座',limits:'作者6.4×4.8m平台，顶面1.8m、围护1.1m，未加封闭顶盒。植物和入台楼梯单独实例化；没有接入楼层/路径系统。可用BUILT-007的1.6m宽版本接入。',draw:(b,w,h,d)=>{
  b.part('四角真实承柱与分层石脚',()=>{for(const x of[.10,w-.62])for(const z of[.10,d-.62]){b.b(x,0,z,.52,.16,.52,b.s.stone);b.b(x+.06,.16,z+.06,.40,1.52,.40,b.s.wood);b.b(x+.02,1.52,z+.02,.48,.16,.48,b.s.metal);b.b(x+.16,1.58,z,.20,.04,.04,b.s.bronze);}});
  b.part('三层楼板与分缝浅石铺面',()=>{b.b(0,1.68,0,w,.04,d,b.s.wood);b.b(0,1.72,0,w,.04,d,b.s.structuralConcrete);pavings(b,0,1.76,0,w,d);});
  b.part('精确1.1m围护与前侧开放入口',()=>{timberRail(b,0,1.8,0,2.4,true);timberRail(b,4,1.8,0,2.4,true);timberRail(b,0,1.8,d-.24,w,true);for(const x of[0,w-.24]){for(const z of[.24,d-.48])post(b,x,1.8,z,1.10,.24);for(const y of[2.02,2.72])b.b(x+.04,y,.24,.16,.08,d-.48,b.s.woodEdge);b.b(x+.10,2.10,.48,.02,.62,d-.96,b.s.glass);for(let z=.9;z<d-.5;z+=.6)b.b(x+.04,2.1,z,.16,.62,.06,b.s.wood);}});
  b.part('角柱状态灯、铜嵌件与边缘安装锁口',()=>{for(const x of[.04,w-.16])for(const z of[0,d-.24]){b.b(x,2.30,z,.12,.28,.04,b.s.metal);b.b(x+.04,2.34,z-.02,.04,.20,.02,b.s.warm);}for(const x of[.52,w-.68]){b.b(x,1.76,1.00,.16,.04,.24,b.s.metal);b.b(x+.04,1.78,1.06,.08,.02,.12,b.s.bronze);}});
 }},
 'BUILT-094':{size:[90,7,90],pitch:.2,features:'实际42m主半径停泊环：32段轮廓、四边截面、贯通中央停泊空域、八座实体支腿和独立青色发光带',limits:'依据max(42,0.6w)，作者候航楼宽60m得到42m主半径。环截面作者径向半厚2m、竖向半厚1.4m；200mm体素保持真实大尺度，非把小玩具缩放冒充。能量带不含力场/停泊动画，中心留空。',draw:(b,w)=>{
  b.part('32径向段与四边截面实体环体',()=>{const c=45,e=.2;for(let y=2;y<4.8-.01;y+=e){const half=2*(1-Math.abs(y+e/2-3.4)/1.4);for(let z=1;z<89;z+=e)for(let x=1;x<89;x+=e){const rr=ringRadius(x+.1-c,z+.1-c),dist=Math.abs(rr-42);if(dist<=half){const glow=Math.abs(y+.1-3.4)<.4&&dist>half-.4;b.g.set([Math.round(x/e),Math.round(y/e),Math.round(z/e)],glow?b.s.energy:b.s.metal);}}}});
  b.part('八座承环石脚与金属承塔',()=>{for(let k=0;k<8;k++){const t=k*Math.PI/4,x=Math.round((45+42*Math.cos(t))/.2)*.2,z=Math.round((45+42*Math.sin(t))/.2)*.2;b.b(x-1.8,0,z-1.8,3.6,.6,3.6,b.s.stone);b.b(x-1.2,.6,z-1.2,2.4,5.6,2.4,b.s.metal);b.b(x-1.4,5.6,z-1.4,2.8,.6,2.8,b.s.metal);b.b(x-.8,6.2,z-.8,1.6,.4,1.6,b.s.bronze);b.b(x-.4,1.2,z-1.4,.8,2.8,.2,b.s.warm);}});
  b.part('三十二段检修脊与铜锁块',()=>{for(let k=0;k<32;k++){const t=k*Math.PI/16,x=Math.round((45+42*Math.cos(t))/.2)*.2,z=Math.round((45+42*Math.sin(t))/.2)*.2;b.b(x-.4,4.4,z-.4,.8,.4,.8,b.s.metal);b.b(x-.2,4.8,z-.2,.4,.2,.4,b.s.bronze);}});
  b.part('承塔石踏座与侧向金属检修格',()=>{for(const x of[3,87])for(const z of[45]){b.b(x-2.0,0,z-2.0,4,.2,4,b.s.wall);for(let y=1;y<5;y+=.6)b.b(x+1.2,y,z-.6,.2,.2,1.2,b.s.bronze);}});
 }},
 'BUILT-095':{size:[10,42,10],pitch:.1,features:'能量塔与35m光柱：台阶基座、检修口、实体骨架、玻璃护片、独立非碰撞能量区和顶部发射冠',limits:'光柱从基座上沿Y=6m到Y=41m，精确35m；含基座和冠顶总高42m。能量区是非碰撞体素示意，不是玻璃、金属或灯带；无物理光束、GI、力场或候航楼运行时功能。',draw:(b,w,h,d)=>{
  b.part('四级承台、实体核心与可见石分层',()=>{for(let k=0;k<4;k++)b.b(k*.6,k*.6,k*.6,w-k*1.2,.6,d-k*1.2,k%2?b.s.wall:b.s.stone);b.b(3,2.4,3,4,3.6,4,b.s.metal);for(const x of[2.8,6.8])b.b(x,2.4,3,.4,3.6,4,b.s.wall);});
  b.part('正面检修凹腔、金属门框和铜门扣',()=>{b.b(4.2,2.8,2.9,1.6,2.0,.8,0);for(const x of[4.0,5.8])b.b(x,2.6,2.8,.2,2.4,.4,b.s.metal);for(const y of[2.6,4.8])b.b(4,y,2.8,2,.2,.4,b.s.bronze);b.b(4.2,2.8,3.7,1.6,2,.1,b.s.metal);b.b(4.4,3.0,3.6,.2,.6,.1,b.s.energy);});
  b.part('35m非碰撞能量示意与底部发射器',()=>{annulus(b,5,5.4,2.0,1.0,.6,b.s.metal);annulus(b,5,5.8,1.5,1.0,.2,b.s.bronze);b.cylinder(5,6,5,.7,35,b.s.energyField);b.cylinder(5,5.8,5,.7,.2,b.s.energy);});
  b.part('四根实体导流柱、分离玻璃护片和底肩',()=>{for(const x of[3.4,6.3])for(const z of[3.4,6.3]){b.b(x,5.6,z,.3,35.8,.3,b.s.metal);b.b(x-.1,5.2,z-.1,.5,.8,.5,b.s.bronze);}for(const z of[3.6,6.3])b.b(3.7,6,z,2.6,35,.1,b.s.glass);for(const x of[3.6,6.3])b.b(x,6,3.7,.1,35,2.6,b.s.glass);});
  b.part('上部发射冠、青色节点及可检修铜鞍',()=>{b.b(3.2,41,3.2,3.6,.4,3.6,b.s.metal);b.b(3.6,41.4,3.6,2.8,.4,2.8,b.s.wall);b.b(4.2,41.8,4.2,1.6,.2,1.6,b.s.metal);for(const x of[3.2,6.4])for(const z of[3.2,6.4])b.b(x,40.8,z,.4,.4,.4,b.s.bronze);for(const x of[4.2,5.4])b.b(x,41.1,3.1,.4,.2,.1,b.s.energy);});
 }},
 'BUILT-096':{size:[2.8,1.2,2.4],pitch:.02,features:'2.4m深木阳台板：三层木承板与石铺装、两组穿墙根部、斜托、滴水槽和栏杆安装面',limits:'作者楼宽10m×0.28=2.8m；只含板和支托，不重复包含BUILT-097扶栏。背部嵌入区保留，安装墙需要独立建模；未声称接入旧住宅发射器。',draw:(b,w,h,d)=>{
  b.part('实体木板、双纵梁和墙端嵌入根',()=>{b.b(0,.96,0,w,.16,d,b.s.wood);for(const x of[.16,2.32]){b.b(x,.8,0,.32,.16,d,b.s.wood);b.b(x,0,2.16,.32,.80,.24,b.s.wood);b.beam([x+.16,.10,2.28],[x+.16,.88,.40],.20,b.s.wood);}});
  b.part('独立灰缝、石铺面和浅石包边',()=>{pavings(b,.16,1.16,.16,w-.32,d-.32);b.b(0,1.12,0,w,.04,d,b.s.structuralConcrete);for(const z of[0,d-.16])b.b(0,1.12,z,w,.08,.16,b.s.wall);for(const x of[0,w-.16])b.b(x,1.12,.16,.16,.08,d-.32,b.s.wall);});
  b.part('承托金属抱箍、铜销与可见根部锁片',()=>{for(const x of[.16,2.32]){for(const z of[.12,2.16]){b.b(x-.04,.78,z,.40,.20,.20,b.s.metal);b.b(x+.06,.82,z-.02,.20,.10,.04,b.s.bronze);}b.b(x-.04,.16,2.32,.40,.48,.08,b.s.metal);}});
  b.part('真实底边滴水槽与四处栏杆脚座',()=>{b.b(.40,.96,.10,2,.04,.04,0);for(const x of[.04,w-.28]){b.b(x,1.12,.04,.24,.08,.24,b.s.metal);b.b(x+.04,1.16,.08,.16,.04,.16,b.s.bronze);}});
 }},
 'BUILT-097':{size:[2.8,1.1,.28],pitch:.02,features:'独立阳台扶栏：两端木柱石脚、五根细竖栏、连续扶手、独立玻璃嵌片和连接铜销',limits:'总高1.1m，五根细栏遵守清单；玻璃、木和金属分别归类。不含阳台板，按20mm端口装到BUILT-096，未提供人物碰撞/攀爬控制器。',draw:(b,w)=>{
  b.part('两端柱脚、柱芯与柱帽',()=>{for(const x of[0,w-.28])post(b,x,0,0,1.10,.28);});
  b.part('下枨、连续木扶手和五根细竖栏',()=>{for(const y of[.22,.94])b.b(.14,y,.06,w-.28,.08,.16,b.s.woodEdge);for(const x of[.46,.91,1.36,1.81,2.26])b.b(x,.30,.06,.08,.64,.16,b.s.wood);});
  b.part('独立薄玻璃与轻浅蚀刻端角',()=>{b.b(.28,.30,.12,w-.56,.64,.02,b.s.glass);for(const x of[.34,2.24]){b.b(x,.36,.10,.02,.18,.02,b.s.glassEtch);b.b(x,.36,.10,.16,.02,.02,b.s.glassEtch);}});
  b.part('金属玻璃压条、独立灯芯与端部铜榫',()=>{for(const y of[.30,.90])b.b(.28,y,.10,w-.56,.04,.04,b.s.metal);for(const x of[.06,w-.22]){b.b(x,.52,.02,.16,.24,.02,b.s.metal);b.b(x,.52,-.02,.16,.24,.04,b.s.bronze);b.b(x+.04,.56,-.04,.08,.16,.02,b.s.warm);}});
 }},
 'BUILT-098':{size:[7,1.92,1.6],pitch:.04,features:'7m门侧石接台：四级实心踏步、顶台石铺面、双侧连续木扶条和独立端柱暖灯',limits:'单侧7m接台，另一侧复用同母版180°放置；中央入口另留空，不把两侧合成堵门地块。作者踏高0.2m、踏深0.4m，不是规范或承载验收。',draw:(b,w,h,d)=>{
  b.part('四级真实踏体与7m长顶接台',()=>{for(let i=0;i<4;i++){const top=.2+i*.2;b.b(i*.4,0,0,.4,top-.08,d,b.s.stone);pavings(b,i*.4,top-.08,0,.4,d);}b.b(1.6,0,0,w-1.6,.72,d,b.s.stone);pavings(b,1.6,.72,0,w-1.6,d);});
  b.part('侧石护边和顶部连续压条',()=>{for(const z of[0,d-.16]){for(let i=0;i<4;i++)b.b(i*.4,0,z,.4,.28+i*.2,.16,b.s.wall);b.b(1.6,0,z,w-1.6,.88,.16,b.s.wall);}});
  b.part('四角与顶台扶柱、真实斜扶手',()=>{for(const z of[0,d-.24]){for(const [x,y]of[[0,.28],[1.60,.88],[6.76,.88]])post(b,x,y,z,1.0,.24);b.beam([.12,1.20,z+.12],[1.72,1.80,z+.12],.12,b.s.woodEdge);b.b(1.72,1.80,z+.06,5.16,.12,.12,b.s.woodEdge);b.b(1.72,1.24,z+.08,5.16,.08,.08,b.s.wood);}});
  b.part('顶台中竖栏与独立暖灯槽',()=>{for(const z of[.06,d-.18]){for(let x=2.2;x<6.5;x+=.6)b.b(x,1.28,z,.08,.52,.12,b.s.wood);for(const x of[.04,6.80]){const y=x<1?.68:1.28;b.b(x,y,z-.04,.16,.36,.08,b.s.bronze);b.b(x+.04,y+.04,z-.08,.08,.28,.04,b.s.warm);}}});
 }},
 'BUILT-099':{size:[10,.8,5.6],pitch:.04,expectedComponents:2,features:'双侧独立店檐：各3m宽/5.6m深的薄瓦棚、递层唇口、真实木托、独立暖灯和中央4m留空',limits:'作者楼宽10m，各侧0.3w，中间0.4w不生成檐盖；保留两组预期分离的体素结构。柱由BUILT-100另装，不把参考的一座单檐当作双侧完成。楼层与门位系统尚未接入。',draw:(b,w,h,d)=>{
  b.part('左侧分层薄瓦棚与灯槽',()=>shopRoof(b,0,3,d));
  b.part('右侧分层薄瓦棚与灯槽',()=>shopRoof(b,7,3,d));
  b.part('四根独立柱的实木承座',()=>{for(const x of[.60,2.4,7.6,9.4])b.b(x-.20,0,4.60,.40,.32,.40,b.s.wood);});
  b.part('店牌出挑铜座与穿吊耳承托销',()=>{for(const x of[.80,2.12]){b.b(x,0,5.20,.20,.32,.52,b.s.bronze);b.b(x+.12,-.08,5.60,.08,.40,.08,b.s.bronze);b.b(x-.04,-.08,5.60,.24,.04,.04,b.s.bronze);}});
 }},
 'BUILT-100':{size:[1.04,3.6,1.12],pitch:.04,features:'0.4m店檐木柱：精确3.6m高、分层石脚、可见套肩、两层短枋和独立安装顶面',limits:'一根母柱，双侧各两柱通过四个实例实现；实木芯0.4m、整高3.6m依清单。壁灯是另一个组件，不因参考图挂了灯而重复焊入。',draw:(b)=>{
  b.part('双层石脚和木柱芯',()=>{b.b(.16,0,.20,.72,.16,.72,b.s.stone);b.b(.20,.16,.24,.64,.48,.64,b.s.wall);b.b(.32,.64,.36,.40,2.64,.40,b.s.wood);});
  b.part('金属柱靴、套肩和铜固定件',()=>{for(const y of[.64,2.96]){b.b(.28,y,.32,.48,.16,.48,b.s.metal);b.b(.40,y+.04,.28,.24,.08,.08,b.s.bronze);}});
  b.part('两层出挑短枋与真实承托斜材',()=>{b.beam([.52,2.68,.56],[.52,3.36,.20],.16,b.s.wood);b.b(.16,3.12,.16,.72,.16,.80,b.s.wood);b.b(0,3.28,.08,1.04,.16,.96,b.s.wood);b.b(.32,3.44,.36,.40,.16,.40,b.s.woodEdge);});
  b.part('短枋端部黄铜锁鞍',()=>{for(const x of[.04,.88]){b.b(x,3.28,.04,.12,.16,.16,b.s.metal);b.b(x+.04,3.32,0,.04,.08,.04,b.s.bronze);}});
 }},
 'BUILT-101':{size:[2.2,2.4,.40],pitch:.04,features:'暖色实体灯箱牌：木攒边、可换丙烯酸透光板、内部灯芯、实体印墨茶壶/简化茶字和独立吊耳',limits:'作者楼宽10m×0.22=2.2m牌宽。是背光实体牌，不是屏幕；印墨、透光塑料与灯芯分开。茶壶/茶字为作者简化色格，不读取游戏店名；透明混合不是透射照明。',draw:(b,w,h,d)=>{
  b.part('木攒边、背板与上下金属包边',()=>{b.b(0,0,.08,w,2.20,.28,b.s.wood);b.b(.16,.16,.08,w-.32,1.88,.20,0);b.b(.20,.20,.32,w-.40,1.80,.04,b.s.metal);for(const y of[0,2.08])b.b(0,y,.04,w,.12,.36,b.s.metal);});
  b.part('独立透光板和后侧独立发光层',()=>{b.b(.16,.16,.12,1.88,1.88,.04,b.s.signDiffuser);b.b(.24,.24,.28,1.72,1.72,.04,b.s.warm);});
  b.part('茶壶图标与简化茶字的实体油墨',()=>{const ink=b.s.printedDark;b.b(.80,1.44,.08,.64,.36,.04,ink);b.b(.72,1.76,.08,.80,.08,.04,ink);b.b(1.08,1.84,.08,.12,.08,.04,ink);b.b(.56,1.60,.08,.24,.12,.04,ink);b.b(1.44,1.52,.08,.20,.28,.04,ink);b.b(1.44,1.64,.08,.08,.08,.04,b.s.signDiffuser);for(const [x,y,ww,hh]of[[.68,1.12,.88,.08],[.84,1.04,.08,.28],[1.28,1.04,.08,.28],[.76,.80,.72,.08],[1.08,.48,.08,.40],[.76,.64,.72,.08],[.72,.48,.16,.08],[1.40,.48,.16,.08]])b.b(x,y,.08,ww,hh,.04,ink);});
  b.part('四角铜夹、后侧支撑及两只贯孔吊耳',()=>{for(const x of[.04,w-.16])for(const y of[.04,1.96])b.b(x,y,0,.12,.16,.08,b.s.bronze);for(const x of[.40,1.72]){b.b(x,2.20,.12,.08,.20,.24,b.s.metal);b.b(x,2.28,.20,.08,.08,.08,0);}for(const x of[.04,w-.12])b.b(x,.32,.36,.08,1.44,.04,b.s.woodEdge);});
 }},
 'BUILT-102':{size:[10,8,3.6],pitch:.1,features:'真实双烟囱：两根2.8m方筒/8m高、贯通烟道、耐火陶内衬、独立砂浆、木顶帽和根部泛水',limits:'作者楼宽10m，两筒中心在±0.36w，中心距7.2m；根部共同安装基面。100mm格距保留真实双孔与检修口，不代表烟气、热学、消防或旧工坊代码已验证。',draw:(b,w,h,d)=>{
  b.part('共同安装基面、两根方烟道和砂浆芯',()=>{b.b(0,0,0,w,.80,d,b.s.stone);for(const x of[0,7.2]){b.b(x,.8,.4,2.8,6.4,2.8,b.s.wall);for(let y=1.2;y<7;y+=.4)b.b(x,y,.4,2.8,.1,2.8,b.s.mortar);b.b(x-.0,6.6,.4,2.8,.2,2.8,b.s.metal);b.b(x,7.2,.4,2.8,.4,2.8,b.s.wood);b.b(x,7.6,.4,2.8,.4,2.8,b.s.wall);}});
  b.part('两根贯通内衬和上下贯通烟孔',()=>{for(const x of[0,7.2]){b.b(x+.3,0,.7,2.2,8,2.2,b.s.flueLiner);b.b(x+.4,0,.8,2.0,8,2.0,0);}});
  b.part('根部防水压边和金属泛水环',()=>{for(const x of[0,7.2]){for(const z of[.1,3.2]){b.b(x,.8,z,2.8,.1,.3,b.s.waterproofMembrane);b.b(x, .9,z,2.8,.1,.3,b.s.metal);}for(const xx of[x,x+2.6])b.b(xx,.8,.4,.2,.2,2.8,b.s.metal);}});
  b.part('正面检修通孔、实体门框和侧置开门片',()=>{b.b(1,1.2,.3,.8,.8,.6,0);for(const x of[.9,1.8])b.b(x,1.1,.3,.1,1.0,.2,b.s.metal);for(const y of[1.1,2.0])b.b(.9,y,.3,1.0,.1,.2,b.s.metal);b.b(.8,1.2,0,.1,.8,.4,b.s.metal);b.b(.7,1.5,.1,.1,.2,.1,b.s.bronze);});
  b.part('侧梯、顶部抱箍和独立根部灯条',()=>{for(const x of[7.7,8.5])b.b(x,.9,.2,.1,5.5,.2,b.s.metal);for(let y=1;y<6.4;y+=.4)b.b(7.7,y,.1,.9,.1,.2,b.s.metal);for(const x of[.4,7.6]){b.b(x,.2,-.1,1.2,.4,.2,b.s.metal);b.b(x+.2,.3,-.2,.8,.2,.1,b.s.warm);}});
 }},
 'BUILT-103':{size:[10.4,6.4,2.4],pitch:.04,features:'五列临街木架：中央门段下部断开、双排承柱、两层攒边平台、真实斜撑、护条与铜榫板',limits:'五列上部木架，中央列从3.2m以上起，门下方不落柱；前后两排中8根落地。作者固定10.4×6.4×2.4m，未接入旧工坊门位、攀爬或荷载系统。',draw:(b,w,h,d)=>{
  b.part('五列双排木架和八个落地石足',()=>{for(let i=0;i<5;i++){const x=.24+i*2.4;for(const z of[.16,1.84]){const start=i===2?3.20:0;if(i!==2){b.b(x-.12,0,z-.08,.56,.20,.56,b.s.wall);b.b(x-.08,.20,z-.04,.48,.16,.48,b.s.metal);}b.b(x,start+.00,z,.32,h-start,.32,b.s.wood);}}});
  b.part('两层连续框梁、前后拉枋与平台木铺条',()=>{for(const y of[2.96,5.36]){for(const z of[.16,1.84])b.b(.24,y,z,9.92,.24,.32,b.s.wood);for(let x=.24;x<10.1;x+=2.4)b.b(x,y,.16,.32,.24,2.00,b.s.wood);for(let x=.24;x<10.12;x+=.32)b.b(x,y+.24,.16,.28,.08,2.0,b.s.woodEdge);}});
  b.part('边跨两层斜撑、中央门段留空',()=>{for(const z of[.20,1.88])for(const start of[.40,7.60]){b.beam([start,.48,z],[start+2.32,2.96,z],.16,b.s.wood);b.beam([start,3.40,z],[start+2.32,5.36,z],.16,b.s.wood);}});
  b.part('上层护条、可见金属节点和铜销',()=>{for(const z of[.16,1.84])for(const y of[5.84,6.20])b.b(.24,y,z,9.92,.12,.32,b.s.woodEdge);for(let i=0;i<5;i++){const x=.24+i*2.4;for(const z of[.16,1.84])for(const y of[2.96,5.36,6.16]){b.b(x-.04,y,z-.04,.40,.20,.40,b.s.metal);b.b(x+.04,y+.04,z-.08,.24,.12,.04,b.s.bronze);}}});
 }},
};

const roles:Record<string,string[]>={
 '090':['wood','woodEdge','wall','structuralConcrete','mortar','metal','bronze','glass','roof','waterproofMembrane','warm'],
 '091':['stone','wall','wood','woodEdge','metal','bronze','structuralConcrete','mortar','glass','warm'],
 '094':['stone','wall','metal','bronze','energy','warm'],
 '095':['stone','wall','metal','bronze','glass','energy','energyField'],
 '096':['wood','stone','wall','structuralConcrete','mortar','metal','bronze'],
 '097':['wood','woodEdge','wall','metal','bronze','glass','glassEtch','warm'],
 '098':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm'],
 '099':['wood','woodEdge','roof','waterproofMembrane','metal','bronze','warm'],
 '100':['stone','wall','wood','woodEdge','metal','bronze'],
 '101':['wood','woodEdge','metal','bronze','signDiffuser','printedDark','warm'],
 '102':['stone','wall','wood','mortar','metal','bronze','waterproofMembrane','flueLiner','warm'],
 '103':['wall','wood','woodEdge','metal','bronze'],
};
// The balcony's shoe remains metal; no dark stone role is needed in this master.
roles['096']=roles['096'].filter(r=>r!=='stone');
export const exteriorMaterialRules=Object.fromEntries(Object.keys(exteriorRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:id==='BUILT-101'?'丙烯酸透光板、实体印墨、内部灯芯与木金属框按实际体素分开；不是屏幕，不把印字归为发光像素。':id==='BUILT-095'?'非碰撞能量区与玻璃护片、实体金属导流柱、石基和灯节点分别归类；体素光柱是静态示意。':id==='BUILT-102'?'耐火陶内衬独立于外砌石、砂浆、木顶帽、根部防水膜和金属泛水；烟孔与检修孔是实际空格。':'逐格按承力层、覆面、栏杆、玻璃、木、瓦和独立灯芯分类，不按近似颜色借用。'}]));

export function configureExteriorAsset(a:Asset,id:string){
 if(!exteriorRecipes[id])return;
 const box=(min:V3,max:V3)=>({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const empty=(min:V3,max:V3)=>a.openings.push(box(min,max));
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-090'){empty([.72,.24,.76],[5.60,2.24,1.96]);for(const[name,x,n]of[['left',0,-1],['right',6.4,1]] as const)port(name,'exterior-walkway',[x,.24,1.6],[n,0,0],[0,.24,2.4]);}
 if(id==='BUILT-091'){empty([2.40,1.80,-.20],[4,3.80,2.8]);port('entry','walkway-1600',[3.2,1.8,0],[0,0,-1],[1.6,.20,0]);a.source!.guardHeightM=1.1;}
 if(id==='BUILT-094'){empty([25,0,25],[65,7,65]);a.source!.ring={majorRadiusM:42,radialHalfThicknessM:2,verticalHalfThicknessM:1.4,radialFacets:32,sectionFacets:4,authoredBuildingWidthM:60};}
 if(id==='BUILT-095'){empty([4.2,2.8,2.9],[5.8,4.8,3.6]);a.source!.energyVolume={baseY:6,topY:41,heightM:35,role:'energyField',solid:false};}
 if(id==='BUILT-096'){empty([.40,.96,.10],[2.40,1,.14]);port('rail','balcony-rail-2800',[1.4,1.2,.14],[0,1,0],[2.8,0,.28]);port('wall','balcony-wall',[1.4,.6,2.4],[0,0,1],[2.8,1.2,0]);a.source!.authoredBuildingWidthM=10;}
 if(id==='BUILT-097')port('bottom','balcony-rail-2800',[1.4,0,.14],[0,-1,0],[2.8,0,.28]);
 if(id==='BUILT-098'){for(let i=0;i<4;i++)empty([i*.4+.04,.2+i*.2,.32],[i*.4+.36,2.2+i*.2,1.28]);empty([1.92,.8,.32],[6.64,2.8,1.28]);port('door-side','side-apron-1600',[7,.8,.8],[1,0,0],[0,.24,1.6]);a.source!.sideLengthM=7;}
 if(id==='BUILT-099'){empty([3,0,-.2],[7,3,5.8]);for(const x of[.6,2.4,7.6,9.4])port('column-'+Math.round(x*100),'shop-canopy-column',[x,0,4.8],[0,-1,0],[.4,0,.4]);port('sign','shop-sign',[1.52,0,5.6],[0,-1,0],[2.2,0,.4]);a.source!.centralGapM=4;a.source!.authoredBuildingWidthM=10;}
 if(id==='BUILT-100'){port('top','shop-canopy-column',[.52,3.6,.56],[0,1,0],[.4,0,.4]);a.source!.timberWidthM=.4;}
 if(id==='BUILT-101'){port('hanger','shop-sign',[1.12,2.4,.24],[0,1,0],[2.2,0,.4]);a.source!.signContent='authored simplified teapot and 茶; printed ink, not a live screen';}
 if(id==='BUILT-102'){for(const x of[.4,7.6])empty([x,0,.8],[x+2,8,2.8]);empty([1.0,1.2,.3],[1.8,2.0,.8]);a.source!.chimneys={count:2,outerWidthM:2.8,heightM:8,centresXM:[1.4,8.6],clearBoreM:2,liningRole:'flueLiner'};}
 if(id==='BUILT-103'){empty([4.4,0,-.2],[6,2.88,2.6]);a.source!.columnLayout={frontColumns:5,rearColumns:5,groundBearingColumns:8,centralColumnStartsAtM:3.2};}
}
