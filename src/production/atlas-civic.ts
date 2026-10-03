import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import {eachCell,type V3} from '../core/types';

/** M008. Authored static reconstructions in metres. Physical substances and
 * display pixels use separate roles, including when their base colours match. */
export function registerCivicRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>)=>AtlasRecipe){
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,t,d,m);b.b(x,y+h-t,z,w,t,d,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const pin=(b:Shapes,x:number,y:number,z:number,t=.04)=>{b.b(x,y,z,t,t,.025,b.s.metal);b.b(x+.01,y+.01,z-.005,t-.02,t-.02,.01,b.s.bronze);};
 const grip=(b:Shapes,x:number,y:number,z:number,w:number,h:number,m=b.s.bronze)=>{frame(b,x,y,z,w,h,.02,.015,m);for(const xx of[x,x+w-.015])b.b(xx,y,z+.02,.015,h,.035,b.s.metal);};
 const cylinderX=(b:Shapes,x:number,y:number,z:number,r:number,l:number,m:number,inner=0)=>{eachCell(b.bounds(x,y-r,z-r,l,2*r,2*r),p=>{const rr=((p[1]+.5)*b.pitch-y)**2+((p[2]+.5)*b.pitch-z)**2;if(rr<=r*r&&rr>=inner*inner)b.g.set(p,m);});};
 const caster=(b:Shapes,cx:number,cz:number,r=.045)=>{
  cylinderX(b,cx-.025,r,cz,r,.05,b.s.rubber);cylinderX(b,cx-.03,r,cz,r*.53,.06,b.s.trim);cylinderX(b,cx-.035,r,cz,.012,.07,b.s.bronze);
  for(const x of[cx-.045,cx+.025])b.b(x,r-.01,cz-.018,.02,.10,.036,b.s.metal);
  b.b(cx-.045,r+.075,cz-.018,.09,.025,.036,b.s.trim);b.cylinder(cx,r+.095,cz,.025,.055,b.s.trim);
 };
 const door=(b:Shapes,x:number,y:number,z:number,w:number,h:number,left=true)=>{
  b.inset(x,y,z,w,h,.045,b.s.wall,true);grip(b,left?x+w-.07:x+.035,y+h*.40,z-.04,.025,.18);
  for(const yy of[y+.08,y+h-.13]){b.b(left?x-.015:x+w-.01,yy,z-.005,.025,.055,.06,b.s.metal);b.b(left?x-.005:x+w-.005,yy+.01,z-.01,.015,.035,.02,b.s.bronze);}
 };
 const drawer=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{
  b.b(x,y,z,w,.02,d,b.s.wood);rim(b,x,y+.02,z,w,h-.02,d,.015,b.s.wood);
  frame(b,x,y,z-.01,w,h,.025,.025,b.s.woodEdge);b.b(x+.03,y+.03,z-.015,w-.06,h-.06,.015,b.s.wood);
  b.b(x+w/2-.055,y+h/2-.03,z-.022,.11,.06,.02,b.s.metal);grip(b,x+w/2-.045,y+h/2-.022,z-.04,.09,.045);
 };
 const binder=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d=.22,cover=b.s.bookCover)=>{
  b.b(x,y,z,w,h,d,cover);b.b(x+.01,y+.015,z+.02,w-.02,h-.03,d-.035,b.s.paperSheet);
  b.b(x+.015,y+h*.5,z-.005,w-.03,h*.34,.01,b.s.paperSheet);
  for(const yy of[y+h*.60,y+h*.72])b.b(x+.025,yy,z-.015,Math.max(.01,w-.05),.01,.01,b.s.printedDark);
  b.b(x+w*.4,y+.04,z-.005,.02,.02,.01,b.s.printedDark);
 };
 const archiveBox=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d=.27)=>{
  b.b(x,y,z,w,h,d,b.s.archiveBoard);b.b(x-.005,y+h-.025,z-.005,w+.01,.025,d+.01,b.s.archiveBoard);
  b.b(x+.035,y+h*.34,z-.005,w-.07,h*.34,.01,b.s.paperSheet);b.b(x+.055,y+h*.49,z-.015,w-.11,.01,.01,b.s.printedDark);
  b.b(x+w*.4,y+h-.045,z-.015,w*.2,.015,.015,b.s.printedDark);
 };
 const display=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{
  b.b(x,y,z,w,h,.04,b.s.metal);b.b(x+.02,y+.02,z-.01,w-.04,h-.04,.02,b.s.screen);frame(b,x+.025,y+.025,z-.015,w-.05,h-.05,.015,.01,b.s.displayGlyph);
 };
 const quarter=(b:Shapes,origin:V3,q:number,draw:(c:Shapes)=>void)=>{
  const c=new Shapes(b.pitch,b.s);draw(c);const o=origin.map(b.index);for(const[p,m]of c.g.cells()){
   const v=q===2?[-p[0]-1,p[1],-p[2]-1]:q===1?[p[2],p[1],-p[0]-1]:[-p[2]-1,p[1],p[0]];b.g.set(v.map((n,i)=>n+o[i]) as V3,m);
  }
 };

 add(123,[1.20,1.56,.43],'药柜：十六个分格药屉、抽出的空心屉盒、药包、下双门、侧板收边与石脚',(b,w,h,d)=>{
  b.part('四边柱、薄背板、下托与侧板',()=>{for(const x of[.015,w-.095])for(const z of[.02,d-.10])b.post(x,0,z,.08,h);b.b(.06,.13,d-.045,w-.12,h-.20,.025,b.s.wood);for(const x of[.055,w-.08])b.b(x,.13,.05,.025,h-.2,d-.1,b.s.wood);for(const y of[.13,.58])b.b(.055,y,.035,w-.11,.03,d-.07,b.s.wood);});
  b.part('十六分格导轨与屉盒，其中一屉拉出',()=>{const cw=(w-.16)/4;for(let row=0;row<4;row++){const y=.64+row*.205;b.b(.06,y-.02,.04,w-.12,.02,d-.08,b.s.wood);for(let col=0;col<4;col++){const x=.08+col*cw,open=col===0&&row===1,z=open?-.17:.035;drawer(b,x,y,z,cw-.015,.185,.35);if(open)for(const xx of[x+.04,x+.11,x+.18]){b.b(xx,y+.02,z+.08,.045,.025,.065,b.s.polymer);b.b(xx+.005,y+.045,z+.09,.03,.01,.025,b.s.printedDark);}}}});
  b.part('下双门、嵌芯回纹、黄铜拉手与铰座',()=>{door(b,.08,.18,-.01,(w-.18)/2,.35);door(b,w/2+.01,.18,-.01,(w-.18)/2,.35,false);});
  b.part('顶面石芯、侧后挡条、木侧面拼缝',()=>{b.slab(.03,h-.08,.025,w-.06,.045,d-.05);b.b(.04,h-.035,d-.055,w-.08,.035,.025,b.s.wood);for(const x of[.04,w-.075])b.b(x,h-.035,.07,.035,.035,d-.11,b.s.wood);for(const z of[.15,.29])for(const x of[.05,w-.065])b.b(x,.17,z,.015,h-.29,.01,b.s.woodEdge);});
 },{limits:'16 个真实屉盒，其中 1 个以静态拉出姿态展示；药包只是塑料包装几何，不代表药品种类。抽屉、铰链和门板无运动约束，分格数据不绑定医疗库存。'});

 add(124,[.58,1.82,.58],'输液架：五辐脚轮、伸缩立杆、锁套、双挂钩、空心软袋、液面和滴管回路',(b,w,h,d)=>{
  const cx=.29,cz=.29;
  b.part('五个橡胶脚轮、金属轮毂和星形底脚',()=>{for(let i=0;i<5;i++){const angle=i*Math.PI*2/5,x=cx+Math.cos(angle)*.235,z=cz+Math.sin(angle)*.235;caster(b,x,z,.04);b.beam([cx,.235,cz],[x,.19,z],.04,b.s.trim);}b.cylinder(cx,.19,cz,.065,.06,b.s.metal);b.cylinder(cx,.25,cz,.045,.025,b.s.energy);});
  b.part('内外伸缩杆、锁套、锁紧旋钮与顶横杆',()=>{b.cylinder(cx,.26,cz,.025,.66,b.s.trim);b.cylinder(cx,.87,cz,.0175,.86,b.s.trim);for(const y of[.80,1.22,1.70]){b.b(cx-.04,y,cz-.035,.08,.075,.07,b.s.metal);b.b(cx-.035,y+.02,cz-.045,.025,.035,.02,b.s.energy);}b.b(cx+.025,.825,cz-.02,.05,.025,.04,b.s.bronze);b.beam([.045,1.76,cz],[w-.045,1.76,cz],.025,b.s.trim);});
  b.part('挂钩和两只透明柔性袋，液体独立于塑料袋壁',()=>{for(const[x,fluid]of[[.075,b.s.fluidBlue],[.455,b.s.fluidAmber]]){
   b.beam([x,1.76,cz],[x,1.72,cz-.02],.02,b.s.trim);b.beam([x,1.72,cz-.02],[x-.035,1.72,cz-.02],.02,b.s.trim);b.beam([x-.035,1.72,cz-.02],[x-.035,1.81,cz-.02],.015,b.s.trim);
   frame(b,x-.04,1.65,cz-.025,.06,.075,.02,.01,b.s.flexibleClear);b.rounded(x-.065,1.40,cz-.04,.12,.25,.07,.025,b.s.flexibleClear);b.b(x-.05,1.415,cz-.025,.09,.215,.04,0);b.b(x-.05,1.415,cz-.025,.09,.115,.04,fluid);
   for(const y of[1.44,1.49,1.54])b.b(x-.04,y,cz-.045,.025,.01,.01,b.s.printedMark);b.b(x-.015,1.37,cz-.02,.03,.04,.035,b.s.polymer);
   b.cylinder(x,1.27,cz,.015,.10,b.s.flexibleClear);b.cylinder(x,1.28,cz,.006,.04,fluid);
   const path:V3[]=[[x,1.28,cz],[x,.98,cz-.01],[x+.02,.91,cz-.06],[cx,.91,cz-.10],[cx,1.05,cz-.08]];for(let i=1;i<path.length;i++)b.beam(path[i-1],path[i],.01,b.s.flexibleClear);
  }});
  b.part('夹持式输液泵壳、状态屏和独立控制键',()=>{b.b(cx-.025,1.03,cz-.09,.05,.14,.065,b.s.metal);b.b(cx-.01,1.07,cz-.10,.025,.065,.02,b.s.screen);b.b(cx-.005,1.09,cz-.11,.015,.035,.01,b.s.displayGlyph);b.b(cx-.01,1.045,cz-.11,.015,.015,.035,b.s.signalRed);b.b(cx-.055,1.06,cz-.07,.035,.04,.06,b.s.bronze);});
 },{limits:'静态输液架；橡胶、硬塑料、透明软袋软管、两种示意液体、显示屏和光芯分别赋材质。透明混合没有折射；液体颜色不表征药物，未实现液体流动、输液控制或医疗功能。'});

 add(125,[.72,.88,1.94],'救护担架：橙色分段软垫、织带锁扣、四个贯通抬握孔、双X剪叉与橡胶脚轮',(b,w,h,d)=>{
  b.part('四只脚轮、下纵梁、端梁与双X承架',()=>{for(const x of[.085,w-.085])for(const z of[.24,d-.24])caster(b,x,z,.05);for(const x of[.085,w-.085]){b.b(x-.025,.19,.20,.05,.055,d-.40,b.s.metal);b.beam([x,.245,.28],[x,.64,d-.34],.04,b.s.trim);b.beam([x,.245,d-.28],[x,.64,.34],.04,b.s.trim);cylinderX(b,x-.035,.44,d/2,.04,.07,b.s.bronze);}for(const z of[.25,d-.29])b.b(.085,.19,z,w-.17,.05,.04,b.s.trim);});
  b.part('上承框、轮廓端角、开孔提手与侧面护栏',()=>{rim(b,.025,.635,.03,w-.05,.065,d-.06,.045,b.s.metal);for(const z of[.06,d-.10]){b.b(.09,.645,z,w-.18,.045,.04,b.s.trim);for(const x of[.025,w-.08]){b.b(x,.665,z-.015,.055,.05,.06,b.s.bronze);b.b(x,.71,z-.015,.055,.025,.06,b.s.metal);}}
   for(const z of[-.06,d-.01]){rim(b,.18,.665,z,w-.36,.04,.095,.025,b.s.metal);for(const x of[.18,w-.205])b.b(x,.65,z<0?z+.03:d-.10,.025,.035,.10,b.s.trim);}
   for(const x of[-.025,w-.005]){b.b(x,.80,.55,.025,.025,.66,b.s.rubber);for(const z of[.55,1.19]){b.b(x,.68,z,.025,.12,.025,b.s.trim);b.b(x<0?x:w-.065,.68,z,.09,.025,.035,b.s.metal);b.b(x,.705,z,.025,.03,.025,b.s.bronze);}}
  });
  b.part('三段橙色软垫、抬高头枕与织物缝边',()=>{for(const[z,dd,yy]of[[.105,.50,.735],[.625,.75,.72],[1.395,.435,.72]]){b.rounded(.09,.695,z,w-.18,yy-.695+.04,dd,.025,b.s.safetyFabric);for(const x of[.11,w-.13])b.b(x,yy+.025,z+.03,.01,.01,dd-.06,b.s.safetyFabric);}b.rounded(.14,.775,.19,w-.28,.065,.25,.025,b.s.safetyFabric);});
  b.part('三条深色织带、金属扣框与分体锁扣',()=>{for(const z of[.47,.98,1.64]){b.b(.055,.755,z,w-.11,.025,.05,b.s.webbing);for(const x of[.055,w-.09])b.b(x,.66,z,.035,.12,.05,b.s.webbing);b.b(w/2-.04,.775,z-.01,.075,.03,.07,b.s.metal);b.b(w/2-.025,.805,z,.045,.01,.05,b.s.bronze);}for(const z of[.24,1.78])b.b(.07,.70,z,w-.14,.01,.01,b.s.webbing);});
 },{limits:'软垫、三条固定带、四个轮胎、金属轮毂与架体分材质；剪叉架、提手和锁扣为静态占用格。尚无折叠、患者动画、柔体或承载计算，尺寸为美术建模尺寸。'});

 add(126,[2.20,1.10,1.20],'康复扶手：独立平行双栏、木质扶手、三个柱榫、透明板压边与开放通行空间',(b,w,h,d)=>{
  for(const z of[.04,d-.20])b.part(z<.1?'前扶手独立构造':'后扶手独立构造',()=>{
   for(const x of[.04,w/2-.08,w-.20]){b.b(x-.02,0,z-.02,.20,.10,.20,b.s.wall);b.b(x,.10,z,.16,.92,.16,b.s.metal);b.b(x-.02,1.00,z-.02,.20,.06,.20,b.s.trim);b.b(x+.02,1.06,z+.02,.12,.04,.12,b.s.bronze);for(const y of[.16,.90])b.b(x+.05,y,z-.02,.04,.04,.04,b.s.bronze);if(x!==w/2-.08){b.b(x+.04,.32,z-.02,.08,.42,.04,b.s.bronze);b.b(x+.06,.35,z-.03,.04,.35,.02,b.s.warm);}}
   for(const x of[.20,w/2+.08]){const ww=(w-.40)/2-.08;b.b(x,.22,z+.04,ww,.05,.08,b.s.metal);b.b(x,.95,z+.025,ww,.08,.10,b.s.woodEdge);b.b(x,.275,z+.065,ww,.675,.025,b.s.glass);for(const xx of[x,x+ww-.025])b.b(xx,.27,z+.045,.025,.68,.065,b.s.trim);b.b(x,.92,z+.04,ww,.02,.02,b.s.energy);}
  });
 },{pitch:.02,expectedComponents:2,limits:'两个有意分开的扶手构造，中央及两端保持开放。以 2 cm 格距保持承框和玻璃压条；尚无康复动作、人体碰撞代理或无障碍工程认证。'});

 add(127,[1.52,1.69,.68],'医务洗台：真实陶瓷盆腔与排水孔、感应龙头、壁挂塑料分液盒、通风柜门和灯架',(b,w,h,d)=>{
  b.part('柜柱、薄背板、空心下柜和分仓',()=>{b.cabinet(w,.85,d,1,1,false);for(const x of[.28,1.04])b.b(x,.15,.06,.025,.63,d-.11,b.s.wood);b.b(.28,.16,.03,.76,.035,d-.07,b.s.wood);});
  b.part('柜门、格栅、清洁柜和控制侧柱',()=>{for(const x of[.33,.68])door(b,x,.19,.025,.33,.60,x<.5);door(b,1.08,.19,.025,.29,.60,false);frame(b,.06,.16,.015,.22,.64,.075,.03,b.s.enamel);for(let i=0;i<7;i++)b.b(.085,.26+i*.055,.025,.17,.025,.03,b.s.trim);b.b(1.41,.16,-.02,.10,.65,.06,b.s.metal);for(const y of[.30,.58]){display(b,1.425,y,-.03,.07,.10);b.b(1.44,y+.025,-.055,.04,.03,.01,b.s.displayGlyph);}b.b(1.095,.69,.005,.25,.07,.025,b.s.metal);b.b(1.12,.71,-.005,.19,.03,.015,b.s.displayGlyph);});
  b.part('石台面、单独白釉盆、贯穿排水口和柜内弯管',()=>{b.slab(-.02,.85,-.01,w+.04,.07,d+.02);b.b(.065,.85,.075,w-.13,.035,d-.15,0);b.b(.20,.84,.17,.66,.10,.40,0);b.b(.21,.67,.18,.64,.245,.38,b.s.ceramicWhite);b.b(.235,.70,.205,.59,.235,.33,0);for(let k=0;k<4;k++){const t=.025+k*.005;rim(b,.225+k*.01,.70-k*.01,.195+k*.01,.61-k*.02,.015,.35-k*.02,t,b.s.ceramicWhite);}rim(b,.19,.905,.16,.68,.025,.42,.035,b.s.ceramicWhite);b.cylinder(.52,.63,.37,.025,.10,0);b.cylinder(.52,.52,.37,.035,.145,b.s.trim,.025);b.beam([.52,.52,.37],[.52,.46,.44],.035,b.s.trim);b.beam([.52,.46,.44],[.52,.55,.57],.035,b.s.trim);b.beam([.52,.55,.57],[.52,.70,.62],.035,b.s.trim);});
  b.part('龙头与真实出水孔',()=>{b.cylinder(.51,.92,.61,.035,.035,b.s.trim);b.cylinder(.51,.955,.61,.02,.235,b.s.trim);b.beam([.51,1.185,.61],[.51,1.20,.44],.025,b.s.trim);b.beam([.51,1.20,.44],[.51,1.14,.40],.025,b.s.trim);b.b(.505,1.13,.395,.01,.035,.01,0);b.b(.485,1.03,.585,.05,.035,.025,b.s.screen);});
  b.part('石芯背挡、木金属侧柱与顶灯槽',()=>{b.b(.07,.91,d-.055,w-.14,.70,.035,b.s.wall);for(const x of[.03,w-.11])b.post(x,.88,d-.085,.08,.78,false);b.b(.04,1.60,d-.12,w-.08,.055,.10,b.s.metal);b.b(.10,1.595,d-.125,w-.20,.015,.025,b.s.warm);for(const x of[.04,w-.065]){b.b(x,1.16,d-.125,.025,.34,.075,b.s.trim);b.b(x+.005,1.20,d-.14,.015,.26,.02,b.s.energy);}});
  b.part('硬塑料消毒分液盒、按压口和封闭急救柜',()=>{for(const[x,y,ww,hh]of[[.18,1.08,.12,.28],[.44,1.18,.17,.23],[.82,1.18,.19,.26]]){b.rounded(x,y,d-.165,ww,hh,.12,.015,b.s.polymer);b.b(x+.025,y+.06,d-.175,ww-.05,hh-.11,.015,b.s.enamel);b.b(x+ww/2-.025,y+.07,d-.19,.05,.065,.015,b.s.screen);b.b(x+ww/2-.015,y+.085,d-.20,.03,.035,.01,b.s.displayGlyph);b.b(x+ww/2-.02,y-.025,d-.11,.04,.035,.035,b.s.polymer);}b.b(1.13,1.12,d-.17,.26,.50,.125,b.s.enamel);b.b(1.135,1.14,d-.18,.25,.46,.015,b.s.polymer);b.b(1.235,1.30,d-.20,.04,.18,.02,b.s.printedDark);b.b(1.185,1.365,d-.20,.14,.04,.02,b.s.printedDark);for(const y of[1.18,1.51])b.b(1.11,y,d-.185,.035,.055,.055,b.s.metal);});
 },{limits:'石台、白釉盆、涂装金属和塑料分液盒分材质；洗盆、排水口、下柜与格栅保留空腔。尚无消毒流程、流体、排水模拟、柜门动画或医疗功能。'});

 add(140,[1.90,1.74,.30],'公告屏：双立柱、木金属承框、独立显示底板与信息图形、前盖玻璃和两侧灯槽',(b,w,h,d)=>{
  b.part('石脚双柱、木横梁、套箍与黄铜销',()=>{for(const x of[.02,w-.20]){b.b(x-.02,0,.015,.24,.12,.26,b.s.wall);b.post(x,.12,.055,.18,h-.12,false);}for(const y of[.42,h-.16]){b.b(.17,y,.08,w-.34,.105,.115,b.s.wood);b.b(.17,y+.02,.065,w-.34,.035,.025,b.s.woodEdge);}for(const x of[.03,w-.08]){b.b(x,.68,.045,.045,.61,.03,b.s.bronze);b.b(x+.01,.72,.03,.025,.53,.02,b.s.warm);}});
  b.part('屏幕底、发光像素、虚构示意卡片与薄玻璃面',()=>{const x=.22,y=.55,ww=w-.44,hh=.98;display(b,x,y,.09,ww,hh);frame(b,x,y,.035,ww,hh,.065,.025,b.s.metal);
   for(const dx of[.16,.46,.82,1.16]){const xx=x+dx;for(let k=0;k<6;k++)b.b(xx+k*.035,y+.055,.07,.04,.025+k*.022,.01,b.s.displayGlyph);}
   for(let k=0;k<4;k++)b.b(x+.14+k*.065,y+.48,.07,.035,.19,.01,b.s.displayWhite);b.b(x+.09,y+.46,.07,.31,.02,.01,b.s.displayWhite);b.b(x+.09,y+.68,.07,.31,.02,.01,b.s.displayWhite);b.beam([x+.09,y+.71,.075],[x+.245,y+.79,.075],.02,b.s.displayWhite);b.beam([x+.245,y+.79,.075],[x+.40,y+.71,.075],.02,b.s.displayWhite);
   for(let i=0;i<3;i++){const xx=x+.48+i*.28,yy=y+.23+i*.085;b.b(xx,yy,.07,.23,.42,.01,b.s.displayWhite);b.b(xx+.045,yy+.37,.07,.13,.015,.01,b.s.displayGlyph);for(let k=0;k<6;k++)b.b(xx+.03,yy+.075+k*.04,.07,.15-(k%2)*.025,.01,.01,b.s.screen);}
   for(let i=0;i<5;i++)b.b(x+.49+i*.12,y+.84,.07,.07,.03,.01,b.s.displayGlyph);b.b(x+.015,y+.015,.04,ww-.03,hh-.03,.01,b.s.glass);
  });
  b.part('背板、检修盖、后托架和进线孔',()=>{b.b(.23,.56,.13,w-.46,.96,.025,b.s.enamel);frame(b,.64,.68,.155,.63,.42,.02,.025,b.s.metal);b.b(.69,.73,.155,.53,.32,.015,b.s.enamel);for(const x of[.34,w-.38])b.b(x,.44,.12,.04,.14,.05,b.s.metal);b.b(.94,.57,.12,.03,.03,.05,0);});
 },{limits:'白色卡片和青色信息图均为显示像素角色，玻璃单独成层，不借用纸、布或植物材质。画面是静态虚构布局，没有真实公告文字、联网新闻、数据更新或交互。'});

 add(141,[2.20,1.10,2.52],'会议桌席：石芯长桌、双列六椅、开放下枨、走线槽、端部控制屏和独立软垫',(b,w,h,d)=>{
  b.part('会议桌本体：四足、牙头、石芯桌面和走线槽',()=>{b.table(w,.76,1);for(const x of[.53,1.11])b.b(x,.72,.08,.01,.04,.84,b.s.recess);b.b(.54,.70,.43,1.12,.08,.12,0);rim(b,.52,.735,.41,1.16,.025,.16,.02,b.s.metal);b.b(.56,.69,.45,1.08,.02,.08,b.s.trim);for(const x of[.56,1.46])b.b(x,.725,.445,.18,.025,.09,b.s.screen);b.b(.59,.75,.45,.10,.01,.04,b.s.displayGlyph);});
  b.part('桌端两块薄控制台和压角',()=>{for(const x of[.10,1.91]){b.b(x,.76,.37,.19,.04,.26,b.s.metal);b.b(x+.03,.80,.40,.13,.01,.20,b.s.screen);for(const z of[.43,.49,.55])b.b(x+.05,.81,z,.09,.01,.02,b.s.displayGlyph);}});
  const chair=(c:Shapes)=>{for(const x of[.02,.40])for(const z of[.02,.44])c.post(x,0,z,.08,z>.4?1.04:.66);for(const z of[.04,.46])c.b(.07,.18,z,.37,.04,.04,c.s.wood);for(const x of[.04,.44])c.b(x,.18,.06,.04,.04,.4,c.s.wood);c.b(.025,.43,.025,.47,.04,.49,c.s.wood);c.rounded(.06,.47,.055,.40,.05,.40,.02,c.s.fabric);for(const x of[.02,.40]){c.b(x,.64,.05,.08,.04,.43,c.s.woodEdge);c.b(x,.49,.05,.06,.17,.06,c.s.wood);}c.b(.08,.74,.45,.32,.04,.06,c.s.wood);c.b(.07,1.00,.45,.34,.04,.06,c.s.wood);c.b(.10,.78,.46,.28,.22,.04,c.s.fabric);};
  for(let col=0;col<3;col++){const x=.16+col*.69;b.part('近侧独立座椅 '+(col+1),()=>quarter(b,[x+.50,0,-.16],2,chair));b.part('远侧独立座椅 '+(col+1),()=>b.shifted([x,0,1.16],chair));}
 },{pitch:.02,expectedComponents:7,limits:'一个原目录条目包含 1 张桌和 6 把椅子，共 7 个有意分离的连通体。组合排布不再追加第二组六椅；2 cm 格距；静态座椅、软垫和屏幕，无座位交互、会议系统或椅子动画。'});

 add(142,[.90,1.22,.62],'议会讲台：石芯回纹立面、内退储物层、斜置承稿台、屏幕、话筒和折线灯槽',(b,w,h,d)=>{
  b.part('四柱与石脚、回纹前嵌板和后开储格',()=>{for(const x of[.06,w-.14])for(const z of[.04,d-.12])b.post(x,0,z,.08,1.02);for(const y of[.13,.57,.97])b.b(.115,y,.08,w-.23,.03,d-.18,b.s.wood);for(const x of[.12,w-.15])b.b(x,.15,.07,.03,.81,d-.19,b.s.wood);b.inset(.16,.19,.04,w-.32,.70,.045,b.s.wall,true);for(const x of[.11,w-.13]){b.b(x,.30,.03,.025,.45,.025,b.s.metal);b.b(x+.005,.32,.02,.015,.40,.015,b.s.energy);}});
  b.part('略斜台面、下沿挡条、端框和控制屏',()=>{for(let k=0;k<31;k++){const z=k*.02,y=1.005+k*.003;b.b(0,y,z,w,.035,.02,b.s.wood);if(k>3&&k<26){b.b(.05,y+.035,z,.80,.01,.02,b.s.woodEdge);b.b(.30,y+.04,z,.31,.01,.02,b.s.screen);}}
   b.b(0,1.015,0,w,.07,.05,b.s.wood);for(const x of[0,w-.07])for(const z of[0,d-.07]){b.b(x,1.015+z*.15,z,.07,.065,.07,b.s.metal);b.b(x+.015,1.04+z*.15,z+.015,.04,.045,.04,b.s.bronze);}for(const x of[.32,.39,.46,.53])b.b(x,1.082,.22,.04,.01,.025,b.s.displayGlyph);b.b(.20,1.06,.07,.50,.035,.025,b.s.metal);});
  b.part('话筒底座、折颈与橡胶收音头',()=>{b.b(.09,1.10,.51,.09,.025,.06,b.s.metal);b.beam([.13,1.12,.53],[.13,1.24,.48],.02,b.s.trim);b.beam([.13,1.24,.48],[.13,1.25,.37],.02,b.s.trim);b.rounded(.095,1.23,.30,.07,.045,.095,.012,b.s.rubber);b.b(.105,1.235,.295,.05,.035,.01,b.s.metal);});
 },{limits:'承稿面通过阶梯体素形成斜面，背后为真实开放储物格，话筒和显示面是静态模型；未接入音频、议程、交互或动画。'});

 add(143,[.74,1.64,.52],'核验台：斜面屏和头像图形、带孔读卡台、空心投票舱、侧通风孔、检修门与灯槽',(b,w,h,d)=>{
  b.part('四边木柱、独立石脚、空心底柜与底托',()=>{for(const x of[.025,w-.105])for(const z of[.025,d-.105])b.post(x,0,z,.08,.85);b.b(.075,.14,.07,w-.15,.03,d-.14,b.s.wood);for(const x of[.08,w-.115])b.b(x,.15,.065,.035,.59,d-.125,b.s.enamel);b.b(.09,.15,d-.10,w-.18,.62,.03,b.s.enamel);b.b(.08,.69,.06,w-.16,.055,d-.12,b.s.wood);});
  b.part('检修门、刻印锁眼、状态带与通风孔',()=>{b.inset(.10,.18,.025,w-.20,.48,.04,b.s.enamel);b.b(.54,.40,.005,.025,.12,.055,b.s.metal);b.b(.545,.475,-.005,.01,.025,.02,b.s.bronze);for(const y of[.26,.32,.38,.44])for(const x of[.075,w-.115])b.b(x,y,.21,.05,.025,.13,0);b.b(.075,.23,.0,.045,.40,.03,b.s.trim);b.b(.085,.27,-.01,.025,.14,.02,b.s.warm);b.b(w-.12,.22,0,.025,.42,.025,b.s.energy);});
  b.part('操作台、贯穿收票缝、扫描面和屏幕承臂',()=>{b.slab(-.015,.755,-.04,w+.03,.08,d+.05);b.b(.095,.64,.07,.20,.23,.065,0);rim(b,.075,.83,.05,.24,.02,.105,.015,b.s.metal);b.b(.40,.83,.10,.19,.025,.19,b.s.metal);b.b(.425,.855,.125,.14,.015,.14,b.s.screen);b.b(.445,.87,.14,.10,.01,.09,b.s.displayGlyph);for(const x of[.035,w-.105])b.post(x,.82,d-.15,.07,.77,false);b.b(.06,1.54,d-.15,w-.12,.09,.065,b.s.wood);});
  b.part('真实斜屏、独立图形层、玻璃盖和侧护壳',()=>{for(let k=0;k<61;k++){const y=.90+k*.01,z=.17+k*.003;b.b(.11,y,z,w-.22,.01,.055,b.s.metal);if(k>3&&k<57){b.b(.145,y,z-.01,w-.29,.01,.02,b.s.screen);b.b(.15,y,z-.025,w-.30,.01,.01,b.s.glass);}for(const x of[.06,w-.11])b.b(x,y,z+.015,.05,.01,.07,b.s.enamel);}
   // Glyphs follow the sloping display in metre-space, including a head and torso.
   for(let k=0;k<14;k++){const y=1.30+k*.01,z=.17+(y-.90)*.30-.025,half=Math.sqrt(Math.max(0,.07**2-(y-1.37)**2));if(half>0)b.b(.37-half,y,z,2*half,.01,.012,b.s.displayGlyph);}for(let k=0;k<10;k++){const y=1.16+k*.01,z=.17+(y-.90)*.30-.025;b.b(.23+k*.004,y,z,.28-k*.008,.01,.012,b.s.displayGlyph);}for(let k=0;k<10;k++){const y=1.02+k*.01,z=.17+(y-.90)*.30-.026;b.b(.17,y,z,.22,.01,.012,b.s.displayWhite);}b.beam([.22,1.065,.187],[.255,1.04,.179],.015,b.s.screen);b.beam([.255,1.04,.179],[.325,1.10,.196],.015,b.s.screen);
  });
 },{limits:'收票缝通向空心舱，头像及核验标记为静态显示图形，不代表已验证身份或已投票。未实现选举、实名、读卡或核验逻辑，侧壳按涂装金属分类。'});

 add(144,[1.16,1.56,.42],'预算账簿柜：双层开放书架、带标签账簿、纸板档案盒、下双门与框榫',(b,w,h,d)=>{
  b.part('承框石脚、空心侧板、分层板与顶面',()=>{b.cabinet(w,h,d,1,1,false);for(const y of[.60,1.025])b.b(.04,y,.035,w-.08,.025,d-.07,b.s.wood);b.b(.57,.62,.025,.025,h-.68,d-.06,b.s.wood);b.slab(.03,h-.055,.025,w-.06,.035,d-.05);});
  b.part('六本高册、五本短册及三摞档案纸盒',()=>{for(let i=0;i<5;i++)binder(b,.09+i*.085,1.05,.10,.07,.31+(i%2)*.035,.235,i%2?b.s.archiveBoard:b.s.bookCover);for(let i=0;i<5;i++)binder(b,.65+i*.08,.625,.09,.065,.33-(i%2)*.055,.25,i%3?b.s.bookCover:b.s.archiveBoard);for(const[x,y,ww,hh]of[[.08,.625,.27,.16],[.35,.625,.18,.24],[.65,1.05,.38,.15],[.65,1.20,.38,.15]])archiveBox(b,x,y,.075,ww,hh,.28);});
  b.part('下部双门和嵌芯回纹、双铰链与铜拉手',()=>{door(b,.065,.16,.005,.505,.39);door(b,.59,.16,.005,.505,.39,false);});
 },{limits:'纸页、青灰封皮、档案纸板及印字独立于布料和木框。册盒是静态封闭细节，背板、层板和门间隙是真实体素；无账务内容、审计功能或柜门动画。'});

 add(145,[.66,.48,.42],'取证盒：涂装薄壳与内腔、独立上盖、橡胶密封条、金属护角、搭扣和贯通手柄',(b,w,h,d)=>{
  b.part('涂装金属箱壁、内底、四只护脚与上沿密封',()=>{b.b(.02,.025,.02,w-.04,.025,d-.04,b.s.enamel);rim(b,.02,.05,.02,w-.04,.275,d-.04,.02,b.s.enamel);rim(b,.035,.325,.035,w-.07,.01,d-.07,.01,b.s.rubber);for(const x of[0,w-.065])for(const z of[0,d-.065]){b.b(x,0,z,.065,.08,.065,b.s.metal);b.b(x+.01,.015,z-.005,.04,.045,.015,b.s.bronze);}for(const x of[.105,w-.135]){b.b(x,.035,.012,.03,.285,.02,b.s.metal);b.b(x,.035,d-.032,.03,.285,.02,b.s.metal);}});
  b.part('阶梯箱盖、边框、后合页与前搭扣',()=>{b.b(.015,.335,.015,w-.03,.035,d-.03,b.s.enamel);rim(b,.01,.33,.01,w-.02,.015,d-.02,.015,b.s.metal);for(const x of[.09,w-.13]){b.b(x,.355,.02,.04,.025,d-.04,b.s.metal);b.b(x,.255,.005,.04,.10,.025,b.s.metal);grip(b,x+.005,.265,-.015,.03,.06);b.b(x,.295,d-.015,.04,.055,.025,b.s.trim);cylinderX(b,x-.005,.325,d-.005,.012,.05,b.s.bronze);}for(const x of[0,w-.065])for(const z of[0,d-.065]){b.b(x,.325,z,.065,.055,.065,b.s.metal);b.b(x+.015,.38,z+.015,.035,.01,.035,b.s.bronze);}});
  b.part('双支座、可穿指手柄、顶部加强片',()=>{for(const x of[.22,.41]){b.b(x,.365,.17,.035,.025,.08,b.s.trim);b.b(x+.0075,.39,.195,.02,.055,.03,b.s.metal);}b.b(.2275,.43,.195,.21,.02,.03,b.s.rubber);});
  b.part('前部独立刻印、平衡纹样和金属压边',()=>{b.b(.16,.07,.005,.34,.22,.025,b.s.enamel);frame(b,.17,.08,.009,.32,.20,.006,.008,b.s.trim);b.beam([.33,.13,.0],[.33,.25,.0],.01,b.s.printedDark);b.beam([.25,.22,.0],[.41,.22,.0],.01,b.s.printedDark);for(const x of[.255,.395]){b.beam([x,.22,.0],[x-.03,.16,.0],.005,b.s.printedDark);b.beam([x,.22,.0],[x+.03,.16,.0],.005,b.s.printedDark);b.b(x-.03,.15,-.0025,.06,.01,.005,b.s.printedDark);}b.b(.29,.12,-.0025,.08,.01,.005,b.s.printedDark);});
 },{pitch:.005,limits:'5 mm 格距的静态空心箱，外壳为涂装金属而非石材；密封和握把为橡胶。手柄可穿指、箱内有空腔，未实现开盖动画、安全锁、物证内容或保全系统。'});

 add(146,[1.16,1.82,.46],'档案柜：两扇90度静态开门、连续铰座、三层书档、空心柜体和带标签纸板盒',(b,w,h,d)=>{
  b.part('石脚木立柱、薄侧背板、分层托板与顶沿',()=>{b.cabinet(w,h,d,1,1,false);for(const y of[.66,1.19])b.b(.04,y,.025,w-.08,.025,d-.065,b.s.wood);b.slab(.025,h-.055,.02,w-.05,.035,d-.04);});
  b.part('下层高卷宗盒、中层账簿、上层横放档案',()=>{for(let i=0;i<4;i++){const x=.115+i*.235;archiveBox(b,x,.14,.09,.20,.44-(i%2)*.06,.29);}for(let i=0;i<11;i++)binder(b,.09+i*.088,.685,.11,.075,.40-(i%3)*.035,.24,i%3?b.s.bookCover:b.s.archiveBoard);for(const x of[.10,.60])for(const y of[1.215,1.39])archiveBox(b,x,y,.105,.43,.175,.28);});
  // Integer quarter-turns preserve exact occupancy and handle holes. The doors
  // stay connected to the cabinet through the explicitly authored hinge straps.
  for(const side of[0,1])b.part(side?'右扇静态开门、内外嵌芯和铰链':'左扇静态开门、内外嵌芯和铰链',()=>{
   const ww=.495,hh=1.59,child=new Shapes(b.pitch,b.s);child.inset(0,0,0,ww,hh,.045,b.s.wall,true);child.inset(0,0,.025,ww,hh,.025,b.s.wall,true);grip(child,ww-.075,.59,-.035,.025,.22);
   const ox=b.index(side?w-.065:.065),oz=b.index(.035),oy=b.index(.145);for(const[p,m]of child.g.cells())b.g.set([side?ox-p[2]-1:ox+p[2],p[1]+oy,oz-p[0]-1],m);
   for(const y of[.24,.87,1.57]){b.b(side?w-.115:.04,y,-.015,.075,.075,.085,b.s.metal);b.cylinder(side?w-.065:.065,y-.005,.025,.02,.085,b.s.bronze);}
  });
 },{limits:'两扇门以 90° 静态开门姿态保存，整数格变换保留把手孔；有实际铰座但没有运动约束或开合动画。纸页、封皮、纸板、印字分开，未实现档案内容、检索或权限系统。'});
}
