import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import {eachCell,type V3} from '../core/types';

/** M010: authored, editable construction. Artwork is a deliberately simplified
 * pigment-cell study, never a photograph projected onto a box. Invisible backs
 * and dimensions are design decisions. All mechanisms remain static. */
export function registerCultureRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>)=>AtlasRecipe){
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,t,d,m);b.b(x,y+h-t,z,w,t,d,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const cylinderX=(b:Shapes,x:number,cy:number,cz:number,length:number,r:number,m:number,inner=0)=>eachCell(b.bounds(x,cy-r,cz-r,length,2*r,2*r),p=>{const rr=((p[1]+.5)*b.pitch-cy)**2+((p[2]+.5)*b.pitch-cz)**2;if(rr<=r*r&&rr>=inner*inner)b.g.set(p,m);});
 const pull=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{frame(b,x,y,z,w,h,.02,.015,b.s.bronze);for(const xx of[x,x+w-.015])b.b(xx,y,z+.02,.015,h,.05,b.s.metal);};
 const book=(b:Shapes,x:number,y:number,z:number,w:number,d:number)=>{b.b(x,y,z,w,.055,d,b.s.bookCover);b.b(x+.008,y+.008,z-.004,w-.016,.04,d-.02,b.s.paperSheet);for(const yy of[y+.015,y+.033])b.b(x+.012,yy,z-.005,w-.024,.005,.005,b.s.paperEdge);b.b(x,y,z,w,.055,.018,b.s.bookCloth);};
 const lantern=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{
  b.b(x,y,z,w,.025,d,b.s.metal);b.b(x+.015,y+.025,z+.015,w-.03,.025,d-.03,b.s.bronze);
  b.b(x+.035,y+.045,z+.035,w-.07,h-.095,d-.07,b.s.warm);
  for(const xx of[x+.015,x+w-.035])for(const zz of[z+.015,z+d-.035])b.b(xx,y+.03,zz,.02,h-.07,.02,b.s.bronze);
  b.b(x,y+h-.045,z,w,.025,d,b.s.metal);b.b(x+.025,y+h-.02,z+.025,w-.05,.02,d-.05,b.s.bronze);
 };
 const display=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{b.b(x,y,z,w,h,.035,b.s.metal);b.b(x+.015,y+.015,z-.01,w-.03,h-.03,.015,b.s.screen);for(let i=0;i<Math.max(1,Math.min(3,Math.floor((h-.04)/.03)));i++)b.b(x+.025,y+.025+i*.03,z-.015,w-.05-i*.015,.01,.01,b.s.displayGlyph);b.b(x+.02,y+.02,z-.025,w-.04,h-.04,.01,b.s.glass);};
 // Return a pigment role for a small authored landscape. No texture, generated
 // bitmap, real text or guessed identity is baked into the geometry.
 const landscape=(u:number,v:number,s:Record<string,number>)=>{
  const far=.32+.20*Math.sin(u*15)+.10*Math.sin(u*31),near=.18+.15*Math.sin(u*17+1);
  if(v<near&&v>.06)return s.pigmentInk;if(v<far&&v>.08)return s.pigmentMist;
  if(u>.60&&u<.84&&v>.14&&v<.30)return (v>.25||u<.63||u>.81)?s.pigmentInk:s.pigmentMist;
  if(u>.06&&u<.08&&v>.65&&v<.76)return s.printedRed;return 0;
 };
 const picture=(b:Shapes,x:number,y:number,z:number,w:number,h:number,support:number)=>{
  b.b(x,y,z,w,h,.02,support);
  for(let ix=1;ix<Math.floor(w/b.pitch)-1;ix++)for(let iy=1;iy<Math.floor(h/b.pitch)-1;iy++){
   const m=landscape(ix*b.pitch/w,iy*b.pitch/h,b.s);if(m)b.b(x+ix*b.pitch,y+iy*b.pitch,z-b.pitch,b.pitch,b.pitch,b.pitch,m);
  }
 };

 add(159,[1.12,1.72,.46],'消防工具柜：玻璃双门、分仓承板、独立灭火器、盘管与喷嘴、塑料急救箱和工具挂扣',(b,w,h,d)=>{
  b.cabinet(w,h,d,2,1);
  b.part('左右分仓承板、靠背挂轨与双门压框',()=>{b.b(.045,.86,.035,w-.09,.025,d-.07,b.s.wood);for(const x of[.06,.585]){frame(b,x,.16,-.015,.475,h-.24,.045,.035,b.s.metalBright);b.b(x+.035,.195,.0,.405,h-.31,.015,b.s.glass);for(const yy of[.29,1.43]){b.b(x,.0+yy,-.025,.025,.09,.045,b.s.bronze);}pull(b,x+(x<.2?.40:.025),.70,-.06,.03,.23);}b.b(.64,.58,.35,.30,.035,.11,b.s.metal);});
  b.part('红色钢瓶、上下箍、喷管、金属阀和纸质标签',()=>{const x=.83,z=.255;
   b.cylinder(x,.14,z,.105,.48,b.s.safetyMetal);b.cylinder(x,.61,z,.075,.045,b.s.safetyMetal);b.cylinder(x,.65,z,.025,.08,b.s.bronze);
   for(const yy of[.17,.48])b.cylinder(x,yy,z,.111,.03,b.s.metal,.095);
   b.b(x-.07,.70,z-.025,.14,.025,.05,b.s.metal);frame(b,x-.045,.717,z-.025,.105,.045,.045,.01,b.s.metal);
   b.b(x-.06,.34,z-.108,.12,.10,.01,b.s.paperSheet);b.b(x-.025,.37,z-.12,.05,.012,.01,b.s.printedRed);
   b.beam([x+.02,.71,z],[x+.145,.63,z-.03],.02,b.s.rubber);b.beam([x+.145,.63,z-.03],[x+.145,.29,z-.03],.025,b.s.rubber);b.b(x+.12,.27,z-.055,.055,.095,.05,b.s.metal);
  });
  b.part('红色橡胶盘管、间隔槽、固定绑带和黄铜管口',()=>{const cx=.295,cy=.435;
   b.cylinder(cx,cy,.25,.207,.045,b.s.metal,0,'z');
   for(const r of[.075,.12,.165,.207])b.cylinder(cx,cy,.135,r,.12,b.s.redHose,Math.max(.0,r-.028),'z');
   b.b(cx-.017,cy-.21,.12,.034,.43,.025,b.s.webbing);b.b(cx-.12,.20,.15,.20,.03,.05,b.s.redHose);b.b(cx-.14,.18,.14,.05,.09,.07,b.s.bronze);
   b.b(cx-.035,.14,.215,.07,.16,.07,b.s.metal);
  });
  b.part('红色塑料急救箱、白色印字与挂置工具',()=>{
   b.rounded(.14,.89,.135,.34,.32,.21,.025,b.s.polymerRed);rim(b,.13,1.185,.125,.36,.025,.23,.025,b.s.polymerDark);
   b.b(.27,.97,.125,.065,.15,.015,b.s.printedMark);b.b(.225,1.012,.125,.155,.065,.015,b.s.printedMark);pull(b,.245,1.21,.19,.13,.045);
   b.b(.63,1.35,.325,.35,.035,.12,b.s.metal);
   for(const x of[.68,.82,.97]){b.b(x-.012,.91,.25,.025,.43,.025,b.s.wood);b.b(x-.035,1.30,.23,.07,.08,.06,b.s.metal);b.b(x-.025,1.33,.27,.05,.035,.10,b.s.bronze);b.b(x-.025,.90,.24,.05,.07,.05,b.s.polymerDark);}
   display(b,w-.025,1.36,-.035,.095,.20);
  });
 },{limits:'柜内器材作为示意陈列部件保存，不是消防规范或可用压力设备。钢瓶红漆、软管橡胶、塑料箱、标签和显示像素分别赋值；玻璃门静态闭合，无开门、喷射或破玻璃效果。'});

 add(169,[1.20,1.70,.42],'画框展架：双柱穿榫横梁、挂环与卷轴、独立纸面颜料、退层石脚和双灯台',(b,w,h,d)=>{
  b.part('双柱、贯通顶梁、底横撑和石质长脚',()=>{for(const x of[.07,w-.15]){b.b(x-.035,0,.02,.15,.055,d-.02,b.s.wall);b.post(x,.055,.19,.08,h-.055,false);}for(const yy of[.18,1.51,1.62])b.b(.02,yy,.185,w-.04,.065,.085,b.s.wood);for(const x of[.03,w-.09])for(const yy of[.18,1.61]){b.b(x,yy,.17,.06,.065,.11,b.s.metal);b.b(x+.015,yy+.025,.16,.025,.025,.025,b.s.bronze);}});
  b.part('实际挂环、画轴、纸面与阶梯山形颜料',()=>{for(const x of[.34,.83]){frame(b,x,1.38,.18,.055,.15,.04,.015,b.s.metal);b.b(x+.015,1.385,.16,.025,.04,.035,b.s.bronze);}for(const yy of[.315,1.405])cylinderX(b,.22,yy,.175,w-.44,.022,b.s.wood);picture(b,.24,.33,.19,w-.48,1.07,b.s.paperSheet);b.b(.24,.325,.18,w-.48,.025,.03,b.s.paperSheet);for(const x of[.21,w-.23])for(const yy of[.30,1.39])b.b(x,yy,.155,.02,.035,.04,b.s.bronze);});
  b.part('两座挂灯、承台与低位展签',()=>{for(const x of[.02,w-.20]){b.b(x,.18,.075,.18,.07,.23,b.s.metal);lantern(b,x+.015,.25,.095,.15,.30,.15);}b.b(.48,.20,.145,.24,.055,.05,b.s.metal);b.b(.50,.212,.135,.20,.026,.01,b.s.paperSheet);});
 },{limits:'只复现画架、纸轴和简化山形的体素颜料分布，不声称还原参考水墨画或文字。所有画面是静态可编辑格子；不存在自动图像转绘、卷轴展开或灯光投射模拟。'});

 add(170,[.96,1.74,.72],'画布与画架：前倾双撑、后撑铰接、中央夹轨、绷布框背、承槽与笔杯侧盘',(b,w,h,d)=>{
  b.part('A形木撑、四脚套、铰耳和实际后撑',()=>{for(const x of[.10,.73]){b.b(x-.025,0,.005,.115,.05,.13,b.s.wall);b.beam([x+.03,.05,.06],[x+.03,1.58,.22],.065,b.s.wood);b.b(x-.01,.11,.04,.09,.05,.09,b.s.metal);}b.b(.385,0,.58,.14,.05,.14,b.s.wall);b.beam([.455,.05,.65],[.455,1.54,.24],.065,b.s.wood);b.b(.39,1.47,.20,.13,.07,.105,b.s.metal);for(const xx of[.385,.50])b.b(xx,1.485,.21,.02,.04,.08,b.s.bronze);b.b(.095,.22,.05,.74,.055,.075,b.s.wood);b.beam([.455,.23,.09],[.455,.23,.63],.04,b.s.wood);});
  b.part('画布背面木内框、绷布与原生颜料格',()=>{frame(b,.135,.58,.18,.64,.88,.055,.035,b.s.wood);b.b(.43,.55,.225,.045,1.16,.055,b.s.wood);b.b(.415,1.66,.215,.08,.065,.075,b.s.metal);picture(b,.135,.58,.155,.64,.88,b.s.canvas);for(const x of[.125,.725])for(const yy of[.565,1.425])b.b(x,yy,.14,.06,.05,.075,b.s.bronze);});
  b.part('可见托槽与顶夹、木侧盘和空心笔杯',()=>{b.b(.08,.52,.095,.76,.06,.20,b.s.wood);b.b(.08,.56,.09,.76,.035,.025,b.s.metal);b.b(.35,1.45,.135,.20,.045,.11,b.s.wood);b.b(.415,1.455,.12,.06,.025,.025,b.s.bronze);b.b(.78,.61,.15,.18,.04,.27,b.s.wood);b.beam([.76,.46,.225],[.90,.61,.31],.03,b.s.metal);b.cylinder(.875,.65,.285,.055,.13,b.s.polymerDark);b.cylinder(.875,.68,.285,.035,.15,0);for(const [x,z,hh]of[[.85,.27,.32],[.89,.30,.27],[.88,.255,.23]]){b.b(x,.66,z,.012,hh,.012,b.s.wood);b.b(x,.66+hh,z,.012,.035,.012,b.s.brushFibre);}});
 },{limits:'画布、纸张、绘画颜料和笔尖纤维分别归类。画面为明确简化的山水色格，不等于原图画作；画架铰轴、夹轨和笔杯有静态结构，无调节动画。'});

 add(171,[.82,.53,.45],'桌面文房组：有底托盘、宣纸折边、镂空砚池、悬笔木架、挂环与分层笔尖',(b,w,h,d)=>{
  b.part('木托盘、双底足与侧围',()=>{b.b(0,.015,0,w,.025,d,b.s.wood);for(const x of[.05,w-.09])b.b(x,0,.03,.04,.02,d-.06,b.s.rubber);rim(b,0,.04,0,w,.02,d,.015,b.s.woodEdge);for(const x of[0,w-.035])for(const z of[0,d-.035])b.b(x,.015,z,.035,.045,.035,b.s.metal);});
  b.part('悬笔架、五个真实吊环与木杆纤维笔锋',()=>{for(const x of[.09,.47])b.post(x,.04,.355,.04,.45,false);b.b(.075,.485,.35,.45,.035,.06,b.s.wood);b.b(.115,.425,.35,.36,.02,.02,b.s.metal);for(let k=0;k<5;k++){const x=.15+k*.065;frame(b,x,.397,.345,.025,.055,.02,.005,b.s.bronze);b.b(x+.008,.225,.35,.01,.18,.01,b.s.wood);b.cylinder(x+.012,.207,.355,.009,.025,b.s.metal);b.cylinder(x+.012,.18,.355,.010,.03,b.s.brushFibre);b.b(x+.008,.164,.35,.01,.02,.01,b.s.brushFibre);}});
  b.part('宣纸、印墨行列与卷起端边',()=>{b.b(.08,.04,.055,.43,.005,.235,b.s.paperSheet);for(const x of[.08,.49])cylinderX(b,x,.05,.10,.025,.012,b.s.paperSheet);for(let row=0;row<5;row++)for(let col=0;col<7;col++){const x=.14+col*.045,z=.08+row*.035;b.b(x,.045,z,.015,.005,.025,b.s.printedDark);b.b(x+.01,.045,z+.007,.012,.005,.006,b.s.printedDark);}b.b(.455,.045,.24,.02,.005,.025,b.s.printedRed);});
  b.part('砚石内腔、墨液格、印章和纸本',()=>{b.rounded(.555,.04,.06,.21,.045,.16,.015,b.s.stone);b.b(.58,.06,.08,.15,.035,.10,0);b.b(.59,.06,.09,.13,.005,.08,b.s.pigmentInk);b.b(.67,.04,.255,.075,.065,.075,b.s.stone);b.hui(.68,.05,.25,.055,.05,b.s.pigmentInk,.005);book(b,.02,.04,.285,.21,.05);lantern(b,.58,.04,.325,.115,.205,.11);});
 },{pitch:.005,limits:'按“书法纸砚及笔架”制作桌面器具组，未把参考图中的整张书桌算进本母版。墨字是不可读的示意格，笔尖选择合成纤维；没有书写、流体墨迹或真实书法复刻。'});

 add(172,[1.34,1.25,.82],'印刷设备：平行钢辊与橡胶辊、轴承座、真实纸路、出纸斜托和空腔下机架',(b,w,h,d)=>{
  b.part('木金属机架、石脚、承板和透空侧撑',()=>{b.table(w,.70,d,false);for(const y of[.16,.63])b.b(.075,y,.07,w-.15,.04,d-.14,b.s.wood);for(const x of[.08,w-.12]){b.b(x,.67,.20,.04,.40,.45,b.s.metal);b.beam([x,.2,.14],[x,.6,d-.10],.035,b.s.metal);}for(const z of[.07,d-.10])b.b(.075,.44,z,w-.15,.04,.03,b.s.metal);});
  b.part('两只大辊、滚轴端套和四角轴承',()=>{for(const [cy,cz,r,role]of[[1.04,.47,.105,'metalBright'],[.81,.47,.10,'rubber']] as const){cylinderX(b,.13,cy,cz,w-.44,r,b.s[role]);for(const x of[.07,w-.34]){b.b(x,cy-.13,cz-.14,.10,.27,.28,b.s.metal);cylinderX(b,x-.01,cy,cz,.12,.065,b.s.bronze);cylinderX(b,x-.015,cy,cz,.015,.038,b.s.metal);}for(const x of[.17,w-.38])cylinderX(b,x,cy,cz,.025,r+.012,b.s.trim);}});
  b.part('滚筒间真实走纸缝、纸页出料和阶梯斜托',()=>{
   b.b(.20,.923,.39,.69,.01,.35,b.s.paperSheet);
   for(let k=0;k<25;k++){const z=-.12+k*.02,y=.725+k*.008;b.b(.17,y,z,.76,.025,.02,b.s.metal);b.b(.20,y+.025,z,.69,.01,.02,b.s.paperSheet);}
   for(let row=0;row<6;row++)for(let col=0;col<2;col++){const z=-.06+row*.05,y=.725+Math.floor((z+.12)/.02)*.008+.035;b.b(.25+col*.33,y,z,.23,.01,.01,b.s.printedDark);}
   b.b(.14,.65,-.14,.04,.16,.53,b.s.metal);b.b(.94,.65,-.14,.04,.16,.53,b.s.metal);
  });
  b.part('操作座与独立显示图形、通风孔和下层纸叠',()=>{b.b(1.06,.68,.16,.21,.23,.29,b.s.metal);display(b,1.065,.76,.145,.20,.20);b.b(1.09,.715,.115,.045,.035,.04,b.s.signalRed);for(const x of[.19,.76]){book(b,x,.20,.18,.30,.42);book(b,x,.255,.18,.30,.42);}for(let j=0;j<5;j++)b.b(.07,.26+j*.045,.24,.045,.025,.16,0);for(const x of[.10,1.17])lantern(b,x,.52,-.03,.09,.13,.09);});
 },{limits:'轴向沿 X 的两辊、纸路和支架是原生几何；纸页图文为色格示意，无排版、进纸、印刷或电机动画。参考中的木框与石脚保留，辊为钢/橡胶，纸与屏幕像素独立。'});

 add(173,[.92,1.18,.60],'展陈介绍牌：双面木石座、内缩灯槽、倾斜纸面板、玻璃护面及四角锁件',(b,w,h,d)=>{
  b.part('退层台座与木金属承柱',()=>{b.b(.12,0,.12,.68,.055,.42,b.s.stone);b.b(.15,.055,.15,.62,.035,.36,b.s.wall);b.b(.28,.09,.25,.36,.63,.22,b.s.wood);b.b(.28,.12,.24,.36,.08,.24,b.s.metal);b.b(.27,.64,.235,.38,.07,.25,b.s.metal);b.inset(.335,.26,.22,.25,.32,.025,b.s.wall,true);for(const x of[.285,.60]){b.b(x,.25,.23,.025,.32,.025,b.s.warm);}});
  b.part('沿坡连续的木板、独立纸面和玻璃保护格',()=>{for(let k=0;k<48;k++){const z=.02+k*.01,y=.75+Math.round(k*.8)*.01;b.b(.02,y,z,w-.04,.05,.01,b.s.wood);if(k>=3&&k<45){b.b(.055,y+.05,z,w-.11,.02,.01,b.s.paperSheet);for(let ix=0;ix<44;ix++){const m=landscape(ix/44,k/48,b.s);if(m)b.b(.075+ix*.01,y+.06,z,.01,.01,.01,m);}if(k%6===0)for(let j=0;j<2;j++)b.b(.61,y+.06,z,.17-j*.03,.01,.01,b.s.printedDark);b.b(.055,y+.07,z,w-.11,.01,.01,b.s.glass);}for(const x of[.02,w-.055])b.b(x,y+.05,z,.035,.03,.01,b.s.metal);}
   for(const [y,z]of[[.76,.02],[1.12,.47]]){b.b(.02,y,z,w-.04,.04,.025,b.s.woodEdge);for(const x of[.02,w-.08])b.b(x,y-.015,z-.015,.06,.065,.06,b.s.bronze);}
   b.beam([.33,.64,.28],[.33,1.03,.42],.045,b.s.metal);b.beam([.59,.64,.28],[.59,1.03,.42],.045,b.s.metal);
  });
 },{limits:'展签采用纸张与静态颜料/印字，保护层为玻璃，不借显示屏材质。倾斜面由连续体素阶梯构成，文字不具备可读说明内容，没有触控或自动排版。'});

 add(174,[1.50,.91,.46],'长琴与支座：空心共鸣箱、十三根分离琴弦、阶梯琴桥、尾钉和底部音孔',(b,w,h,d)=>{
  b.part('双端榫接琴架与中横枨',()=>{for(const xx of[.12,w-.22]){for(const zz of[.035,d-.115])b.post(xx,0,zz,.08,.68);b.b(xx-.015,.62,.025,.11,.065,d-.04,b.s.wood);b.b(xx,.20,.06,.08,.04,d-.13,b.s.wood);}b.b(.15,.30,.205,w-.30,.045,.05,b.s.wood);for(const x of[.12,w-.22])b.b(x,.30,.07,.08,.045,d-.14,b.s.wood);});
  b.part('中空弧收木琴体、双端封板和音孔',()=>{b.rounded(.015,.685,.015,w-.03,.13,d-.03,.045,b.s.wood);b.b(.10,.705,.085,w-.20,.08,d-.17,0);for(const x of[.08,w-.13])b.b(x,.685,.015,.05,.135,d-.03,b.s.metal);for(const x of[.18,.95])b.b(x,.68,.16,.16,.04,.11,0);b.b(.02,.80,.025,w-.04,.025,d-.05,b.s.woodEdge);for(const x of[.08,w-.13])for(const z of[.015,d-.055])b.b(x,.79,z,.05,.045,.04,b.s.bronze);});
  b.part('十三道钢弦、琴桥、尾钉与琴首调音扣',()=>{for(let j=0;j<13;j++){const z=.053+j*.0275,bridge=.48+j*.026;
   b.b(.07,.83,z,.06,.03,.015,b.s.bronze);b.b(w-.13,.83,z,.06,.03,.015,b.s.bronze);
   b.beam([.10,.86,z],[bridge,.89,z],.01,b.s.instrumentWire);b.beam([bridge,.89,z],[w-.10,.86,z],.01,b.s.instrumentWire);
   for(let k=0;k<4;k++)b.b(bridge-.025+k*.006,.825+k*.015,z-.008,.05-k*.012,.015,.026,b.s.wood);b.b(bridge-.007,.88,z-.01,.015,.01,.03,b.s.bronze);
  }display(b,.17,.73,.005,.11,.065);});
 },{limits:'按参考制作带支座的虚构十三弦长琴，座凳是独立清单母版，未重复焊入。1cm 格距使弦与琴桥明显加粗；音孔、共鸣腔可查，但没有声学模拟、演奏动作或调音功能。'});

 add(175,[1.06,1.32,.64],'立式鼓：鼓腹空腔、独立前后合成膜、铆钉环、抱架、静态鼓槌与侧槽',(b,w,h,d)=>{
  b.part('双侧木抱架、石脚、前后横枨和鼓座',()=>{for(const x of[.06,.87])for(const z of[.06,.50])b.post(x,0,z,.075,.63);for(const z of[.06,.49])for(const y of[.19,.51])b.b(.06,y,z,.885,.05,.085,b.s.wood);for(const x of[.06,.875])b.b(x,.30,.06,.075,.06,.50,b.s.wood);for(const x of[.20,.74])b.b(x,.53,.11,.07,.22,.42,b.s.wood);});
  b.part('膨胀鼓腹、两道金属箍与独立鼓膜',()=>{// Twelve broad stave faces with deliberately stepped shoulders. A sampled
   // smooth barrel produced noisy nested rings rather than the reference's
   // readable wooden panels. Both the outer shell and inner void stay voxels.
   for(let k=0;k<42;k++){const z=.095+k*.01,edge=Math.min(k,41-k),r=edge<4?.45:edge<10?.47:.49,inner=r-.04;
    eachCell(b.bounds(.525-r,.82-r,z,2*r,2*r,.01),p=>{const x=(p[0]+.5)*b.pitch-.525,y=(p[1]+.5)*b.pitch-.82;
     let distance=-Infinity,second=-Infinity;for(let j=0;j<12;j++){const angle=j*Math.PI/6,q=x*Math.cos(angle)+y*Math.sin(angle);if(q>distance){second=distance;distance=q;}else second=Math.max(second,q);}
     if(distance<=r&&distance>=inner){const seam=edge>1&&distance-second<.012&&distance>r-.015;b.g.set(p,seam?0:b.s.lacquerWood);}
    });
   }for(const z of[.075,.505]){b.cylinder(.525,.82,z,.465,.035,b.s.metal,.425,'z');b.cylinder(.525,.82,z+.005,.425,.02,b.s.drumSkin,0,'z');}});
  b.part('环绕铜钉、拉紧件、印膜纹样和侧置鼓槌',()=>{for(let k=0;k<20;k++){const angle=k*Math.PI/10,x=.525+Math.cos(angle)*.449,y=.82+Math.sin(angle)*.449;for(const z of[.06,.54])b.b(x-.015,y-.015,z,.03,.03,.025,b.s.bronze);if(k%2===0)b.b(x-.012,y-.012,.105,.025,.025,.41,b.s.bronze);}for(let ix=0;ix<24;ix++)for(let iy=0;iy<24;iy++){const x=.405+ix*.01,y=.70+iy*.01,dist=Math.abs(x-.525)+Math.abs(y-.82);if(Math.abs(dist-.105)<.015||Math.abs(dist-.05)<.015)b.b(x,y,.07,.01,.01,.01,b.s.printedWarning);}b.b(.965,.17,.36,.085,.04,.10,b.s.metal);frame(b,.965,.42,.36,.085,.11,.10,.02,b.s.metal);for(const x of[.98,1.015]){b.b(x,.205,.39,.015,.61,.015,b.s.wood);b.rounded(x-.008,.79,.38,.03,.08,.035,.01,b.s.lacquerWood);}});
 },{limits:'鼓膜明确选用合成聚合物，不误归石材、纸或棉布。鼓腹为空、表面纹样为印墨；鼓槌静态放入侧槽。没有打击动画、弹性膜或发声。'});

 add(176,[2,.42,1.60],'演出舞台模块：可拼接齐边木台、金属桁架、端部凹锁与三阶前梯',(b,w,h,d)=>{
  b.part('六脚承托、侧框桁架和分板木面',()=>{for(const x of[.02,.94,1.86])for(const z of[.04,1.42]){b.b(x,0,z,.12,.08,.14,b.s.wall);b.b(x+.02,.06,z+.02,.08,.30,.10,b.s.metal);}for(const z of[.02,d-.08])for(const y of[.10,.28])b.b(0,y,z,w,.06,.06,b.s.metal);for(const x of[.02,w-.08])b.b(x,.10,.03,.06,.24,d-.06,b.s.metal);b.b(0,.34,0,w,.04,d,b.s.metal);for(let x=.04;x<w-.04;x+=.12)b.b(x,.38,.04,.10,.04,d-.08,b.s.wood);for(const z of[0,d-.04])b.b(0,.38,z,w,.04,.04,b.s.metal);for(const x of[0,w-.04])b.b(x,.38,0,.04,.04,d,b.s.metal);});
  b.part('嵌入端锁、灯窗与结构对接面',()=>{for(const x of[0,w-.02])for(const z of[.20,1.30]){b.b(x,.20,z,.02,.10,.08,b.s.bronze);b.b(x,.23,z+.02,.02,.04,.04,0);}for(const z of[0,d-.02])for(const x of[.20,1.38]){b.b(x,.20,z,.40,.10,.02,b.s.trim);b.b(x+.04,.22,z===0?-.02:z+.02,.32,.06,.02,b.s.warm);}for(const x of[.04,w-.14])for(const z of[.02,d-.12])b.b(x,.38,z,.10,.04,.10,b.s.bronze);});
  b.part('三阶前梯、包鼻、双侧实托与无突出侧沿',()=>{for(let k=0;k<3;k++){const z=-.78+k*.26,y=k*.14;for(const x of[.61,1.33])b.b(x,0,z,.06,y+.14,.26,b.s.metal);b.b(.59,y+.10,z,.82,.04,.27,b.s.wood);b.b(.59,y+.08,z,.82,.04,.04,b.s.trim);for(const x of[.60,1.36])b.b(x,y+.10,z,.04,.04,.06,b.s.bronze);}b.b(.61,.34,-.02,.78,.06,.08,b.s.metal);});
 },{pitch:.02,limits:'标准单元含前置三阶梯，X 方向接续边齐平，灯条只在前后面。凹锁与桁架为静态结构，尚无荷载计算、收折、拆梯或工程安全认证。'});

 add(177,[1.32,1.48,.60],'后台音响架：双柜木金属框、真实橡胶脚轮、分层扬声器、机盒、空芯线盘和封闭运输箱',(b,w,h,d)=>{
  b.part('六组脚轮、双机架柱梁与层板',()=>{for(const x of[.06,.59,1.18])for(const z of[.08,.45]){b.cylinder(x+.035,.055,z,.055,.065,b.s.rubber,.02,'z');b.b(x,.07,z+.015,.07,.105,.035,b.s.metal);b.b(x-.015,.15,z-.015,.10,.04,.10,b.s.metal);}for(const x of[.015,.625,1.22])for(const z of[.035,.51])b.post(x,.18,z,.08,1.30,false);for(const y of[.18,.75,1.40]){b.b(.015,y,.035,w-.03,.055,.55,b.s.wood);b.b(.015,y,.02,w-.03,.04,.03,b.s.metal);}for(const x of[.04,.65,1.24]){b.b(x,.21,.535,.035,1.21,.035,b.s.wood);b.beam([x,.22,.55],[x,1.38,.10],.025,b.s.metal);}});
  b.part('两只独立音箱腔与聚合物盆、橡胶悬边',()=>{for(const y of[.235,.805]){b.b(.10,y,.10,.43,.44,.39,b.s.wood);b.b(.135,y+.035,.135,.36,.37,.32,0);frame(b,.10,y,.085,.43,.44,.03,.035,b.s.metal);const cx=.315,cy=y+.22;b.cylinder(cx,cy,.08,.145,.075,0,0,'z');b.cylinder(cx,cy,.09,.175,.05,b.s.rubber,.14,'z');for(let k=0;k<6;k++){const r=.15-k*.018;b.cylinder(cx,cy,.13+k*.01,r,.01,b.s.speakerCone,Math.max(0,r-.03),'z');}b.cylinder(cx,cy,.16,.055,.04,b.s.polymerDark,0,'z');for(const x of[.115,.495])for(const yy of[y+.025,y+.395])b.b(x,yy,.075,.02,.02,.025,b.s.bronze);}});
  b.part('上层线盘、铜轴、橡胶线圈与固定轴座',()=>{const cx=.95,cy=1.09;b.b(.90,.805,.17,.10,.15,.28,b.s.metal);for(const z of[.18,.41])b.cylinder(cx,cy,z,.24,.035,b.s.metal,.10,'z');b.cylinder(cx,cy,.215,.185,.20,b.s.rubber,.09,'z');b.cylinder(cx,cy,.18,.075,.265,b.s.bronze,.025,'z');for(const z of[.17,.44])for(let i=0;i<8;i++){const a=i*Math.PI/4;b.beam([cx+Math.cos(a)*.065,cy+Math.sin(a)*.065,z],[cx+Math.cos(a)*.225,cy+Math.sin(a)*.225,z],.025,b.s.metal);}b.b(.92,.84,.15,.06,.10,.33,b.s.metal);});
  b.part('下部运输箱、独立锁扣、凹提手和显示机盒',()=>{b.rounded(.74,.235,.11,.43,.44,.38,.02,b.s.polymerDark);rim(b,.735,.59,.105,.44,.035,.39,.02,b.s.metalBright);frame(b,.87,.43,.09,.16,.09,.03,.015,b.s.metalBright);for(const x of[.775,1.11])b.b(x,.54,.08,.035,.075,.035,b.s.metalBright);b.b(.55,.96,.115,.17,.29,.34,b.s.metal);display(b,.56,1.03,.105,.15,.14);b.b(.525,.93,.115,.205,.04,.34,b.s.wood);});
 },{limits:'两机架作为一个后台设备架条目，内部箱体与设备为可分选部件；背后留出走线空隙。振膜采用聚合物，橡胶线圈和轮胎不借显示面；只有小机盒信息面使用显示像素。无音频播放、转盘或脚轮运动。'});

 add(178,[1.60,.98,.64],'礼仪供台本体：攒边木面、双层束腰、阶梯牙头、透空回纹裙边与长脚枨',(b,w,h,d)=>{
  b.table(w,h,d,false);b.part('纯木台面、连续退层边口和铜包角',()=>{b.b(0,h-.055,0,w,.055,d,b.s.wood);for(const z of[.015,d-.045])b.b(.025,h-.015,z,w-.05,.015,.03,b.s.woodEdge);for(const x of[.025,w-.06])b.b(x,h-.015,.015,.035,.015,d-.03,b.s.woodEdge);for(const x of[0,w-.07])for(const z of[0,d-.07]){b.b(x,h-.055,z,.07,.055,.07,b.s.metal);b.b(x+.01,h-.035,z+.01,.05,.035,.05,b.s.bronze);}});
  b.part('束腰嵌纹和两端真实回纹透孔',()=>{b.b(.10,.735,.03,w-.20,.11,.035,b.s.wood);for(const x of[.13,1.20]){b.b(x,.685,.035,.27,.055,.035,b.s.wood);b.b(x+.035,.74,.03,.20,.055,.045,0);b.hui(x+.035,.745,.025,.20,.09,b.s.woodEdge,.01);}b.b(.49,.745,.02,.60,.045,.025,b.s.bronze);b.b(.52,.755,.01,.54,.02,.02,b.s.wood);for(const x of[.065,w-.11])b.b(x,.16,.10,.045,.05,d-.20,b.s.wood);b.b(.09,.18,.47,w-.18,.04,.045,b.s.wood);});
 },{limits:'只制作供台本体，参考中的香炉、灯与花瓶为可另行放置资产，未重复计入母版。保留东方木构和可替换金属连接件，不指定现实宗教图案，无仪式或交互脚本。'});

 add(179,[1.18,1.09,.40],'香炉及灯组：空心四足铜炉、阶梯透气盖、独立植物香枝及两座悬灯木架',(b,w,h,d)=>{
  b.part('四足炉座、空心炉壁、耳环与纹样嵌板',()=>{for(const x of[.40,.70])for(const z of[.085,.30]){b.b(x,0,z,.06,.11,.06,b.s.metal);b.b(x-.01,0,z-.01,.08,.04,.08,b.s.bronze);}b.b(.39,.09,.08,.39,.045,.28,b.s.bronze);rim(b,.39,.135,.08,.39,.255,.28,.035,b.s.metal);b.inset(.42,.16,.06,.33,.17,.025,b.s.bronze,false,{frame:b.s.metal,recess:b.s.metal});b.b(.50,.185,.05,.16,.13,.03,b.s.bronze);b.hui(.51,.195,.04,.14,.11,b.s.metal,.01);for(const x of[.34,.78])frame(b,x,.245,.11,.07,.12,.20,.02,b.s.bronze);b.b(.405,.375,.09,.36,.035,.26,b.s.bronze);});
  b.part('退层炉盖、孔阵和三枝独立香材',()=>{for(let k=0;k<3;k++)b.b(.42+k*.035,.41+k*.035,.10+k*.025,.33-k*.07,.035,.24-k*.05,b.s.metal);for(const x of[.475,.555,.635])b.b(x,.405,.18,.025,.14,.04,0);for(const x of[.485,.565,.645]){b.b(x,.135,.20,.01,.59,.01,b.s.incense);b.b(x,.715,.20,.01,.025,.01,b.s.ember);}b.b(.43,.145,.12,.31,.035,.19,b.s.soil);});
  for(const [index,x,z]of[[1,.045,.23],[2,1.00,.23]])b.part('独立悬灯 '+index+'：石座、木柱、悬臂和铜框灯芯',()=>{b.b(x-.04,0,z-.07,.18,.055,.18,b.s.wall);b.b(x-.015,.055,z-.045,.13,.045,.13,b.s.metal);b.post(x,.10,z-.03,.08,.98,false);const left=x<.5,cx=left?x+.15:x-.17;b.b(Math.min(x,cx),.99,z-.03,Math.abs(cx-x)+.08,.045,.08,b.s.wood);b.b(cx+.015,.89,z-.02,.04,.13,.04,b.s.metal);lantern(b,cx-.035,.54,z-.075,.15,.35,.15);b.b(cx+.025,.48,z-.015,.025,.06,.025,b.s.bronze);});
 },{expectedComponents:3,limits:'中央炉与两座灯是三组有意分离的器物，均有地面支脚。香枝用压制植物材料、末端为示意余烬；灯采用电发光芯，没有蜡材、燃烧、烟气、动画或宗教仪式功能。炉灰暂用独立土质角色，未模拟燃烧产物。'});
}
