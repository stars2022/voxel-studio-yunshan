import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import {eachCell,type V3} from '../core/types';

/** M005: authored static machinery and containers. Reference inventory is not
 * welded into storage masters. Motion is not implied by a visible axle. */
export function registerWorkshopRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>)=>AtlasRecipe){
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,t,d,m);b.b(x,y+h-t,z,w,t,d,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const control=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{b.b(x,y,z,w,h,.07,b.s.metal);b.b(x+.02,y+.055,z-.01,w-.04,h-.075,.015,b.s.screen);for(let k=0;k<4;k++)b.b(x+.035+k*(w-.07)/4,y+.07,z-.02,.015,.025+.015*k,.01,b.s.displayGlyph);for(let k=0;k<Math.max(1,Math.min(3,Math.floor((w-.025)/.04)));k++)b.b(x+.025+k*.04,y+.02,z-.015,.025,.02,.02,k?b.s.trim:b.s.bronze);};
 const saddle=(b:Shapes,x:number,y:number,z:number,t:number)=>{b.b(x-.01,y,z-.01,t+.02,.07,t+.02,b.s.metal);b.b(x+.01,y+.02,z-.02,.025,.025,.02,b.s.bronze);b.b(x-.015,y+.02,z+.01,.02,.025,.025,b.s.bronze);};
 const pull=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{frame(b,x,y,z,w,h,.02,.015,b.s.bronze);for(const xx of[x,x+w-.015])b.b(xx,y,z+.02,.015,h,.04,b.s.metal);};
 const pegboard=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{b.b(x,y,z,w,h,.025,b.s.enamel);for(let xx=x+.055;xx<x+w-.035;xx+=.07)for(let yy=y+.055;yy<y+h-.035;yy+=.07)b.b(xx,yy,z-.01,.02,.02,.05,0);frame(b,x-.02,y-.02,z-.015,w+.04,h+.04,.05,.025,b.s.metal);};
 const drawer=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{b.b(x,y,z,w,.02,d,b.s.wood);rim(b,x,y+.02,z,w,h-.02,d,.02,b.s.wood);b.inset(x,y,z-.02,w,h,.04,b.s.wall);pull(b,x+w/2-.045,y+h/2-.015,z-.05,.09,.03);};
 const crate=(b:Shapes,w:number,h:number,d:number)=>{
  b.part('底板、分层木壁与承重角柱',()=>{b.b(.015,.035,.015,w-.03,.035,d-.03,b.s.wood);for(const x of[0,w-.055])for(const z of[0,d-.055]){b.post(x,0,z,.055,h);for(const y of[.07,h-.10])saddle(b,x,y,z,.055);}for(let y=.075;y<h-.07;y+=.075)rim(b,.025,y,.025,w-.05,.065,d-.05,.025,b.s.wood);rim(b,0,h-.045,0,w,.045,d,.045,b.s.woodEdge);});
  b.part('双提耳、加厚口沿与外侧箍',()=>{for(const x of[-.025,w-.005]){b.b(x,h-.17,d/2-.10,.03,.10,.2,b.s.metal);b.b(x-.01,h-.15,d/2-.075,.05,.055,.15,0);b.b(x,h-.09,d/2-.10,.03,.02,.20,b.s.woodEdge);for(const z of[d/2-.10,d/2+.08])b.b(x<0?-.01:w-.055,h-.17,z,.065,.025,.02,b.s.metal);}for(const z of[-.005,d-.035])for(const x of[.12,w-.15])b.b(x,.085,z,.03,h-.18,.04,b.s.woodEdge);});
 };

 add(77,[1.56,1.92,.60],'仓储梁柱：六柱与三层承板、侧向交叉拉撑、分层锁鞍、铜榫头和石脚',(b,w,h,d)=>{
  b.part('六根承重木柱及退层柱帽',()=>{for(const x of[0,w/2-.04,w-.08])for(const z of[0,d-.08])b.post(x,0,z,.08,h);});
  b.part('三层双梁、薄承板和分跨插肩托',()=>{for(const y of[.18,.89,1.6]){for(const z of[.015,d-.065])b.b(.015,y,z,w-.03,.09,.05,b.s.wood);for(const x of[.015,w/2-.025,w-.065]){b.b(x,y,.02,.05,.07,d-.04,b.s.wood);for(const z of[0,d-.08])saddle(b,x-.015,y-.025,z,.08);}b.b(.065,y+.07,.06,w-.13,.025,d-.12,b.s.wood);b.b(.09,y+.09,.09,w-.18,.01,d-.18,b.s.woodEdge);}});
  b.part('两侧 X 拉撑、后横枨与安装锁销',()=>{for(const x of[.035,w-.045])for(const y of[.24,.95]){b.beam([x,y,.045],[x,y+.60,d-.045],.025,b.s.metal);b.beam([x,y,d-.045],[x,y+.60,.045],.025,b.s.metal);}b.b(.03,h-.10,d-.06,w-.06,.045,.04,b.s.wood);for(const x of[.03,w/2-.01,w-.04])for(const y of[.39,1.10,1.81])b.b(x,y,-.005,.025,.025,.02,b.s.bronze);});
 },{limits:'只制作仓储架母版，参考图中的货箱属于独立库存资产。木梁与金属锁件有实体构造，未作真实承载计算。'});

 add(78,[1.6,.74,.60],'输送单元：双滚筒、连续上下带、分节板链、轴承座、侧挡、可辨电机与走线框',(b,w,h,d)=>{
  b.part('四根支架、侧梁及横向拉撑',()=>{for(const x of[.14,w-.22])for(const z of[.015,d-.095])b.post(x,0,z,.08,.55);for(const z of[.015,d-.055])b.b(.08,.49,z,w-.16,.065,.04,b.s.metal);for(const x of[.18,w-.23])b.b(x,.31,.045,.045,.04,d-.09,b.s.metal);});
  b.part('首尾滚筒、实轴和轴承夹耳',()=>{for(const x of[.13,w-.13]){b.cylinder(x,.60,.05,.075,d-.10,b.s.trim,0,'z');b.cylinder(x,.60,-.02,.025,d+.04,b.s.bronze,0,'z');for(const z of[0,d-.06]){b.b(x-.055,.52,z,.11,.15,.06,b.s.metal);b.b(x-.02,.57,z-.01,.04,.06,.08,b.s.bronze);}}});
  b.part('连续带回路、分节耐磨片和边压条',()=>{for(const y of[.50,.68])b.b(.13,y,.07,w-.26,.025,d-.14,b.s.rubber);for(const x of[.13,w-.13])b.cylinder(x,.60,.07,.105,d-.14,b.s.rubber,.078,'z');for(let x=.14;x<w-.13;x+=.095){b.b(x,.70,.07,.08,.025,d-.14,b.s.trim);for(const z of[.08,d-.11])b.b(x+.025,.72,z,.025,.01,.02,b.s.metal);}for(const x of[0,w-.13])b.b(x,.68,.07,.13,.02,d-.14,b.s.trim);for(const z of[-.005,d-.035]){b.b(.12,.55,z,w-.24,.075,.04,b.s.metal);b.b(.18,.565,z-.005,w-.36,.015,.01,b.s.energy);}});
  b.part('电机壳、散热槽与控制框',()=>{b.b(w-.43,.40,-.15,.28,.20,.19,b.s.metal);b.b(w-.40,.43,-.16,.22,.14,.035,b.s.trim);for(let x=w-.38;x<w-.22;x+=.04)b.b(x,.46,-.17,.02,.075,.02,b.s.metal);b.b(.17,.37,-.045,.08,.15,.10,b.s.metal);control(b,.14,.35,-.115,.14,.15);});
 },{limits:'滚筒和带节均为静态体素，具有首尾对接面；没有带速、物料运送、传动或连锁控制。'});

 add(79,[1.16,.68,.92],'升降托板：透空底框、双剪架、导向槽、枢轴、机械止挡、嵌芯平台和侧控制柱',(b,w,h,d)=>{
  b.part('底框、石脚和侧向控制立柱',()=>{rim(b,0,.035,0,w,.075,d,.095,b.s.metal);for(const x of[0,w-.09])for(const z of[0,d-.09]){b.b(x-.015,0,z-.015,.12,.045,.12,b.s.wall);saddle(b,x,.045,z,.09);}b.b(w-.07,.04,d-.2,.27,.07,.08,b.s.metal);b.post(w+.08,0,d-.20,.10,h+.03);});
  b.part('导向槽、止挡与两组交叉剪架',()=>{for(const z of[.19,d-.23]){for(const y of[.11,h-.13]){b.b(.075,y,z-.025,w-.15,.025,.10,b.s.trim);b.b(.15,y+.01,z,w-.30,.025,.04,0);}b.beam([.15,.12,z+.02],[w-.15,h-.09,z+.02],.045,b.s.metal);b.beam([w-.15,.12,z+.035],[.15,h-.09,z+.035],.045,b.s.metal);for(const [x,y]of[[.15,.14],[w-.15,.14],[w/2,.36],[.15,h-.12],[w-.15,h-.12]])b.cylinder(x,y,z-.015,.045,.10,b.s.bronze,0,'z');for(const x of[.12,w-.18])b.b(x,.125,z-.015,.055,.055,.08,b.s.metal);}});
  b.part('分层承台、耐磨嵌芯和退层防撞角',()=>{b.b(0,h-.09,0,w,.065,d,b.s.metal);rim(b,0,h-.035,0,w,.035,d,.035,b.s.metal);b.b(.035,h-.025,.035,w-.07,.025,d-.07,b.s.metalBright);for(const x of[.04,w-.10])for(const z of[.04,d-.10])b.b(x,h-.04,z,.065,.04,.065,b.s.trim);for(let x=.06;x<w-.05;x+=.14)for(const z of[.005,d-.025])b.b(x,h-.005,z,.065,.01,.02,b.s.printedWarning);for(const z of[.005,d-.025])b.b(.10,h-.045,z,w-.20,.015,.025,b.s.trim);});
  b.part('独立侧控制盒、按钮与检修压条',()=>{control(b,w+.085,.32,d-.23,.09,.28);b.b(w+.095,.15,d-.235,.06,.10,.055,b.s.trim);b.b(w+.11,.17,d-.25,.025,.055,.02,b.s.bronze);});
 },{limits:'保留剪架和导轨的可见间隙，但只交付一个静态升起姿态；无升降动画、负载计算或动态行程碰撞检查。'});

 add(80,[.68,.84,.58],'磅秤：分层承盘、底框、四个调平脚、秤盘支点与杆式读数框',(b,w,h,d)=>{
  b.part('调平脚、压框和承盘支点',()=>{for(const x of[.035,w-.095])for(const z of[.035,d-.095]){b.cylinder(x+.03,0,z+.03,.04,.02,b.s.metal);b.cylinder(x+.03,.02,z+.03,.015,.07,b.s.bronze);b.b(x,.06,z,.065,.04,.065,b.s.metal);}b.b(.015,.07,.015,w-.03,.09,d-.03,b.s.metal);for(const x of[.06,w-.11])for(const z of[.06,d-.11])b.b(x,.15,z,.05,.035,.05,b.s.trim);});
  b.part('钢质承盘、压边和四角锁件',()=>{b.b(0,.18,0,w,.045,d,b.s.trim);b.b(.015,.225,.015,w-.03,.035,d-.03,b.s.metalBright);for(const x of[0,w-.05])for(const z of[0,d-.05])b.b(x,.17,z,.05,.09,.05,b.s.bronze);for(const x of[.10,w-.16])b.b(x,.095,-.005,.06,.015,.02,b.s.energy);});
  b.part('读数立柱、背撑和纯几何显示框',()=>{b.b(w-.095,.12,d-.06,.05,h-.23,.05,b.s.metal);saddle(b,w-.095,.22,d-.065,.05);control(b,w-.24,h-.19,d-.10,.32,.19);b.b(w-.05,h-.20,d-.05,.075,.05,.075,b.s.metal);});
 },{limits:'显示框只含静态条形符号，未伪造称重数值；无称量或调平仿真。'});

 add(81,[1.6,1.35,.72],'制造工作台：攒边耐磨台面、夹具槽、透空横枨、空抽屉、侧撑与背部挂轨',(b,w,h,d)=>{
  b.table(w,.86,d);
  b.part('底层承板、双侧 X 撑和后挂架立柱',()=>{b.b(.065,.15,.055,w-.13,.035,d-.11,b.s.wood);for(const x of[.07,w-.10]){b.beam([x,.2,.08],[x,.69,d-.08],.035,b.s.metal);b.beam([x,.2,d-.08],[x,.69,.08],.035,b.s.metal);}for(const x of[.045,w-.115])b.post(x,.82,d-.085,.075,h-.82,false);b.b(.06,h-.08,d-.075,w-.12,.06,.065,b.s.wood);});
  b.part('右双屉内盒、左浅屉和台面夹具凹槽',()=>{b.b(w-.46,.20,.02,.025,.6,d-.08,b.s.wood);for(const y of[.23,.49])drawer(b,w-.43,y,.015,.33,.24,d-.10);drawer(b,.13,.65,.02,.44,.15,.42);for(const x of[.18,.52,.86])b.b(x,.835,.12,.025,.035,.46,0);});
  b.part('双挂轨、空挂钩、锁座与侧控口',()=>{for(const y of[1.00,1.18])b.b(.09,y,d-.08,w-.18,.035,.04,b.s.metal);for(let x=.16;x<w-.15;x+=.18){b.b(x,.985,d-.105,.02,.08,.045,b.s.bronze);b.b(x,.975,d-.135,.02,.02,.07,b.s.metal);}control(b,w-.12,.63,-.055,.095,.13);});
 },{limits:'工作面、底层和挂钩保持空置；工具与库存另作母版。抽屉只有静态几何，夹具槽不代表机加工精度。'});

 add(82,[1.14,1.45,.78],'机床外壳：阶梯围壳、可检查内腔、双压框观察门、通风栅、检修盖与外置控制座',(b,w,h,d)=>{
  b.part('石脚、机架和倒阶围壳',()=>{for(const x of[.015,w-.105])for(const z of[.015,d-.105])b.b(x,0,z,.09,.085,.09,b.s.wall);b.b(0,.06,0,w,.16,d,b.s.metal);b.b(.02,.22,.015,w-.04,h-.24,d-.03,b.s.enamel);b.b(.10,.28,.09,w-.20,h-.43,d-.18,0);for(const x of[.02,w-.08])b.b(x,h-.09,.015,.06,.09,d-.03,0);b.b(.12,h-.05,.09,w-.24,.05,d-.18,b.s.trim);for(const x of[0,w-.07])for(const z of[0,d-.07])b.b(x,.08,z,.07,h-.21,.07,b.s.metal);});
  b.part('观察门真实凹口、压框、门轨与内腔承轨',()=>{b.b(.31,.49,-.02,.50,.78,.15,0);frame(b,.285,.465,-.025,.55,.83,.06,.045,b.s.metal);b.b(.33,.51,.015,.46,.74,.015,b.s.glass);for(const y of[.48,1.26])b.b(.33,y,-.04,.46,.015,.02,b.s.energy);for(const x of[.17,w-.24])b.b(x,.275,.10,.07,.045,d-.20,b.s.trim);for(const yy of[.57,1.10])b.b(.81,yy,-.045,.035,.09,.065,b.s.bronze);pull(b,.78,.73,-.085,.04,.23);});
  b.part('退层检修盖、通风实孔和格栅压边',()=>{b.inset(.04,.40,-.025,.21,.84,.05,b.s.enamel,false,{frame:b.s.metal,recess:b.s.trim});for(let y=.42;y<.62;y+=.045)b.b(.075,y,-.025,.14,.015,.04,b.s.metal);for(let z=.16;z<d-.12;z+=.085)b.b(-.01,.33,z,.13,.065,.04,0);b.b(.015,.31,.13,.03,.02,d-.25,b.s.metal);b.b(.015,.40,.13,.03,.025,d-.25,b.s.metal);for(const y of[.45,1.15])b.b(.035,y,-.04,.02,.025,.02,b.s.bronze);});
  b.part('侧端控制座、线缆托和底检修带',()=>{b.b(w-.07,.73,-.075,.18,.07,.20,b.s.metal);control(b,w-.12,.71,-.135,.27,.30);b.b(.12,.125,-.015,w-.24,.065,.025,b.s.trim);b.b(.22,.15,-.025,w-.44,.02,.015,b.s.metal);});
 },{limits:'仅加工机床围壳和静态观察门；没有刀具、工件、门联锁或加工动作。内部空间可查询，玻璃用透明材质 ID 表达。'});

 add(83,[.96,1.42,.32],'工坊工具架：通孔挂板、木框柱、四个内腔抽屉及带孔扳手等静态挂具',(b,w,h,d)=>{
  b.part('四柱、石脚、底柜框和台面',()=>{for(const x of[0,w-.065])for(const z of[0,d-.065])b.post(x,0,z,.065,h);b.b(.02,.10,.015,w-.04,.025,d-.03,b.s.wood);b.b(.02,.49,0,w-.04,.045,d,b.s.wood);b.b(.045,.11,d-.035,w-.09,.39,.025,b.s.wood);b.b(w/2-.015,.11,.015,.03,.38,d-.03,b.s.wood);b.b(.025,h-.08,d-.06,w-.05,.055,.05,b.s.wood);});
  b.part('四只抽屉内盒、拉手与挂板真孔',()=>{for(const x of[.06,.505])for(const y of[.14,.315])drawer(b,x,y,0,.395,.16,d-.05);pegboard(b,.07,.59,d-.08,w-.14,.68);for(const x of[.49,.87])for(const y of[.13,.305])b.b(x,y,.025,.03,.025,d-.05,b.s.metal);});
  b.part('锤、扳手、螺丝刀及其实际挂点',()=>{for(let k=0;k<5;k++){const x=.15+k*.145,yy=k%2?.82:.73;b.b(x,yy,.12,.025,.36,.035,k===3?b.s.bronze:b.s.metal);b.b(x-.015,yy+.04,.105,.055,.14,.03,k===3?b.s.bronze:b.s.wood);b.b(x-.025,yy+.27,.145,.075,.035,.12,b.s.metal);b.b(x-.025,yy+.27,.12,.02,.06,.12,b.s.bronze);if(k===0){b.b(x-.055,yy+.32,.095,.135,.055,.065,b.s.metal);}else if(k===1||k===2){b.cylinder(x+.015,yy+.35,.105,.045,.045,b.s.trim,.025,'z');b.b(x+.004,yy+.29,.125,.02,.035,.035,b.s.metal);}else{b.b(x,yy+.31,.11,.025,.08,.03,b.s.trim);b.b(x-.01,yy+.37,.11,.045,.025,.03,b.s.metal);}}});
 },{limits:'工具作为该清单工具架的一组静态挂具保留，不另计基础 ID；挂板孔为真实镂空。没有工具取放状态或物品交互。'});

 add(84,[1.64,1.06,.64],'切割设备：开式滑轨机座、承载滑台、双臂枢轴、带齿刀盘、上护弧和电机检修盖',(b,w,h,d)=>{
  b.part('四个石脚、透空机座与双导轨',()=>{rim(b,0,.045,0,w,.075,d,.075,b.s.metal);for(const x of[0,w-.09])for(const z of[0,d-.09]){b.b(x-.01,0,z-.01,.11,.045,.11,b.s.wall);saddle(b,x,.07,z,.07);}for(const z of[.16,d-.20]){b.b(.04,.115,z,w-.08,.06,.04,b.s.trim);for(const x of[.16,w-.22])b.b(x,.15,z-.01,.065,.04,.065,b.s.bronze);}});
  b.part('滑台、电机外壳与检修门',()=>{b.b(.17,.15,.10,.66,.055,d-.20,b.s.metal);b.rounded(.21,.20,.14,.54,.30,.35,.035,b.s.trim);b.inset(.26,.245,.115,.40,.20,.045,b.s.metal,true,{frame:b.s.metal,recess:b.s.trim});for(let x=.3;x<.61;x+=.055)b.b(x,.30,.125,.02,.065,.02,b.s.metal);control(b,.18,.26,.05,.095,.18);});
  b.part('双厚连接臂、销轴和几何走线',()=>{for(const z of[.22,.42]){b.beam([.53,.42,z],[1.23,.76,z],.09,b.s.metal);b.beam([.54,.46,z],[1.15,.80,z],.03,b.s.enamel);for(const[x,y]of[[.56,.45],[.87,.60],[1.21,.75]]){b.cylinder(x,y,z-.04,.05,.10,b.s.bronze,0,'z');b.cylinder(x,y,z-.055,.025,.02,b.s.trim,0,'z');}}b.b(.60,.33,.25,.045,.19,.08,b.s.metal);});
  b.part('实心分段刀盘、刃齿和上半护弧',()=>{const cx=1.23,cy=.73,rr=.31;b.cylinder(cx,cy,.30,rr,.055,b.s.metalBright,0,'z');b.cylinder(cx,cy,.285,.16,.08,b.s.metal,.12,'z');b.cylinder(cx,cy,.245,.065,.14,b.s.trim,0,'z');for(let k=0;k<20;k++){const ang=k*Math.PI/10,xx=cx+Math.cos(ang)*(rr-.015),yy=cy+Math.sin(ang)*(rr-.015);b.b(xx-.025,yy-.025,.292,.05,.05,.07,k%2?b.s.trim:b.s.metalBright);}for(let k=0;k<16;k++){const ang=k*Math.PI/15;b.beam([cx+Math.cos(ang)*.325,cy+Math.sin(ang)*.325,.32],[cx+Math.cos((k+1)*Math.PI/15)*.325,cy+Math.sin((k+1)*Math.PI/15)*.325,.32],.025,b.s.metal);}b.b(1.19,.69,.21,.08,.08,.25,b.s.metal);});
 },{limits:'切割头、传动臂和滑台为静态造型研究；未实现旋转、进给、采矿行为和动态安全包络。'});

 add(85,[.48,.36,.42],'矿料母体：不规则切面、相接的大小矿块和实际矿脉材质格',(b,w,h,d)=>{
  b.part('主矿块的多向切面',()=>{eachCell(b.bounds(.02,0,.02,w-.04,h,d-.04),p=>{const[x,y,z]=p.map(n=>(n+.5)*b.pitch),nx=(x-.24)/.23,ny=(y-.16)/.20,nz=(z-.22)/.20;if(Math.abs(nx)+.75*Math.abs(ny)+.9*Math.abs(nz)<1.50&&x+.23*y<.465&&x-.4*z>-.105)b.g.set(p,b.s.stone);});});
  b.part('相接的侧矿体和阶梯断面',()=>{for(const[x,y,z,s]of[[.03,.015,.015,.18],[.27,.02,.07,.19],[.13,.20,.12,.14]]){eachCell(b.bounds(x,y,z,s,s*.90,s),p=>{const[xx,yy,zz]=p.map(n=>(n+.5)*b.pitch),q=Math.abs((xx-x-s*.48)/(s*.55))+.7*Math.abs((yy-y-s*.40)/(s*.52))+Math.abs((zz-z-s*.51)/(s*.53));if(q<1.5&&xx+.2*zz<x+s*1.1+.2*z)b.g.set(p,b.s.stone);});}});
  b.part('体内延续的离散铜矿脉',()=>{for(const[p,m]of[...b.g.cells()])if(m===b.s.stone){const[x,y,z]=p,v=x-.35*y+.3*z-19-2*Math.sin(z*.45)-2*Math.cos(y*.37),branch=x+.55*y-.2*z-34+Math.sin(z*.3)*2,patch=(Math.floor(y/3)*7+Math.floor(z/4)*11+Math.floor(x/5)*3)%13;if((Math.abs(v)<1.4||Math.abs(branch)<.75)&&patch<9)b.g.set(p,b.s.oreVein);else if((Math.floor(x/6)+Math.floor(y/4)*5+Math.floor(z/7)*3)%11===0)b.g.set(p,b.s.oreMatrix);}});
 },{limits:'只交付一种不规则矿料母版，图中的展示货箱和其他矿色不另计资产。矿脉是材质格，没有发光开关或矿产数值。'});

 add(86,[.64,.47,.42],'采收容器：空心分板木筐、包角、三道箍、真提孔和厚口沿',(b,w,h,d)=>{
  crate(b,w,h,d);b.part('底部透气孔和分板错缝',()=>{for(let x=.10;x<w-.08;x+=.08)b.b(x,.035,.12,.025,.035,d-.24,0);for(const z of[.025,d-.05])for(let x=.10;x<w-.08;x+=.10)b.b(x,.08,z,.01,h-.15,.025,b.s.woodEdge);});
 },{limits:'仅空采收筐，不把参考图中的作物焊进容器。提孔和通气缝为真实体素空隙，无作物库存或采收交互。'});

 add(87,[1.05,.73,.76],'捕鱼器具组：实孔菱形网笼、木边框、挂绳、独立空捕捞箱和金属提扣',(b,w,h,d)=>{
  b.part('后部网笼木骨与分层包角',()=>{for(const x of[0,.605])for(const z of[.42,.705]){b.post(x,0,z,.055,h);for(const y of[.055,h-.10])saddle(b,x,y,z,.055);}for(const y of[.085,h-.065])rim(b,.025,y,.445,.61,.035,.285,.03,b.s.wood);});
  b.part('菱形网目、侧网与两条垂绳',()=>{const mesh=(o:V3,u:V3,span:number)=>{const height=h-.19,step=.09;for(let start=-height;start<span;start+=step)for(const sign of[-1,1]){const lo=Math.max(0,-start),hi=Math.min(height,span-start);if(hi<=lo)continue;const a=sign===1?lo:height-lo,c=sign===1?hi:height-hi;b.beam([o[0]+u[0]*(start+lo),.12+a,o[2]+u[2]*(start+lo)],[o[0]+u[0]*(start+hi),.12+c,o[2]+u[2]*(start+hi)],.012,b.s.rope);}};for(const z of[.45,.725])mesh([.04,0,z],[1,0,0],.58);for(const x of[.03,.635])mesh([x,0,.45],[0,0,1],.275);for(let start=-.275;start<.58;start+=.09)for(const sign of[-1,1]){const lo=Math.max(0,-start),hi=Math.min(.275,.58-start);if(hi>lo)b.beam([.04+start+lo,.105,.45+(sign===1?lo:.275-lo)],[.04+start+hi,.105,.45+(sign===1?hi:.275-hi)],.012,b.s.rope);}for(const x of[-.015,.665]){b.beam([x,.15,.44],[x-.02,.44,.43],.02,b.s.rope);b.beam([x-.02,.44,.43],[x+.025,h-.02,.445],.02,b.s.rope);}});
  b.part('前部独立捕捞箱、真实内腔和口沿',()=>{const x=.48,ww=.54,dd=.32;b.b(x,.045,0,ww,.03,dd,b.s.polymer);rim(b,x,.075,0,ww,.235,dd,.035,b.s.polymer);rim(b,x-.01,.31,-.01,ww+.02,.025,dd+.02,.045,b.s.trim);for(const xx of[x,x+ww-.045])for(const z of[0,dd-.045]){b.b(xx,0,z,.045,.335,.045,b.s.metal);b.b(xx+.01,.05,z-.01,.02,.025,.015,b.s.bronze);}for(const z of[-.015,dd-.01])frame(b,x+.20,.18,z,.14,.08,.025,.02,b.s.metal);b.inset(x+.09,.085,-.02,ww-.18,.18,.04,b.s.polymer,false,{frame:b.s.polymer,recess:b.s.polymerDark});});
 },{expectedComponents:2,limits:'清单将网笼和捕捞箱列为一组母版，保留两块有意分离的静态结构；空网和空箱不含鱼。无网布模拟、捕捞动作或鱼类动画。'});

 add(88,[.88,.60,.56],'冷链箱：空心保温壳、密封盖缝、双端锁带、侧提孔、嵌芯面板和几何冷链标记',(b,w,h,d)=>{
  b.part('下箱空腔、保温塑料壳和角柱套',()=>{b.b(0,.045,0,w,.48,d,b.s.polymer);b.b(.05,.085,.05,w-.10,.43,d-.10,0);rim(b,0,.065,0,w,.035,d,.035,b.s.metal);for(const x of[0,w-.06])for(const z of[0,d-.06]){b.b(x,0,z,.06,.60,.06,b.s.metal);for(const y of[.05,.49])saddle(b,x,y,z,.06);}});
  b.part('密封圈、闭合箱盖及双锁带',()=>{rim(b,.025,.50,.025,w-.05,.035,d-.05,.035,b.s.rubber);b.b(.025,.535,.025,w-.05,.035,d-.05,b.s.polymer);b.b(.08,.57,.06,w-.16,.025,d-.12,b.s.polymer);for(const x of[.045,w-.095]){b.b(x,.525,.01,.05,.075,d-.02,b.s.metal);for(const z of[-.025,d-.025]){b.b(x-.005,.39,z,.06,.15,.05,b.s.metal);b.b(x+.01,.41,z-.01,.03,.08,.02,b.s.bronze);}}});
  b.part('双侧真提孔和制冷接口框',()=>{for(const x of[-.025,w-.005]){b.b(x,.245,.16,.03,.15,.24,b.s.metal);b.b(x-.01,.275,.185,.05,.09,.19,0);b.b(x,.245,.16,.03,.03,.24,b.s.trim);}b.b(.16,.17,-.015,.10,.12,.035,b.s.metal);b.b(.18,.19,-.025,.06,.08,.015,b.s.energy);});
  b.part('前嵌芯和非文字冷链标记',()=>{b.inset(.29,.14,-.025,.42,.29,.055,b.s.polymer,false,{frame:b.s.metal,recess:b.s.polymerDark});b.b(.44,.205,-.025,.13,.15,.015,b.s.inkTeal);const x=.505,y=.28;for(const[a,c]of[[[-.05,0],[.05,0]],[[0,-.055],[0,.055]],[[-.04,-.04],[.04,.04]],[[-.04,.04],[.04,-.04]]])b.beam([x+a[0],y+a[1],-.035],[x+c[0],y+c[1],-.035],.01,b.s.printedMark);});
 },{limits:'仅静态密封箱；几何雪花标记不代表制冷和温控功能。盖、扣与把手有实体结构，没有开箱动画或温度数据。'});
}
