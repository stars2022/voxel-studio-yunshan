import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import {eachCell,type V3} from '../core/types';

/** M009. Static fictional civic equipment. Authored dimensions, not recovered
 * measurements. Display glyphs, printed paper and fabric are separate cells. */
export function registerPublicServiceRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>)=>AtlasRecipe){
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,t,d,m);b.b(x,y+h-t,z,w,t,d,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const handle=(b:Shapes,x:number,y:number,z:number,w:number,h:number,m=b.s.bronze)=>{frame(b,x,y,z,w,h,.02,.015,m);for(const xx of[x,x+w-.015])b.b(xx,y,z+.02,.015,h,.045,b.s.metal);};
 const hinges=(b:Shapes,x:number,y:number,z:number,h:number)=>{for(const yy of[y+.05,y+h-.105]){b.b(x,yy,z,.045,.065,.035,b.s.metal);b.b(x+.015,yy+.01,z-.01,.015,.045,.025,b.s.bronze);}};
 const door=(b:Shapes,x:number,y:number,z:number,w:number,h:number,left=true)=>{b.inset(x,y,z,w,h,.045,b.s.wall,true);hinges(b,left?x-.02:x+w-.025,y,z,h);handle(b,left?x+w-.07:x+.035,y+h*.38,z-.045,.025,.18);};
 const drawer=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,face=b.s.wood)=>{b.b(x,y,z,w,.02,d,b.s.wood);rim(b,x,y+.02,z,w,h-.02,d,.02,b.s.wood);frame(b,x,y,z-.02,w,h,.04,.025,b.s.woodEdge);b.b(x+.025,y+.025,z-.025,w-.05,h-.05,.025,face);handle(b,x+w/2-.055,y+h/2-.025,z-.055,.11,.05);};
 const archiveBox=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,m=b.s.archiveBoard)=>{b.b(x,y,z,w,h,d,m);b.b(x-.005,y+h-.02,z-.005,w+.01,.02,d+.01,m);b.b(x+w*.24,y+h*.32,z-.005,w*.52,h*.35,.01,b.s.paperSheet);for(const yy of[y+h*.45,y+h*.61])b.b(x+w*.30,yy,z-.015,w*.4,.01,.01,b.s.printedDark);};
 const manuscript=(b:Shapes,x:number,y:number,z:number,w:number,d:number)=>{b.b(x,y,z,w,.015,d,b.s.paperSheet);for(let k=0;k<4;k++)b.b(x+.04,y+.015,z+.05+k*.04,w-.08,.01,.01,b.s.printedDark);};
 const screen=(b:Shapes,x:number,y:number,z:number,w:number,h:number,city=false)=>{
  b.b(x,y,z,w,h,.04,b.s.metal);frame(b,x-.01,y-.01,z-.015,w+.02,h+.02,.025,.025,b.s.trim);
  b.b(x+.025,y+.025,z-.012,w-.05,h-.05,.015,b.s.screen);
  if(city){for(let k=0;k<9;k++){const hh=(h-.10)*[.27,.4,.56,.35,.76,.62,.93,.48,.32][k],xx=x+.09+k*(w-.19)/9;b.b(xx,y+.05,z-.024,(w-.19)/12,hh,.01,b.s.displayGlyph);}for(const xx of[x+.04,x+w-.065])for(let k=0;k<4;k++)frame(b,xx,y+.065+k*(h-.14)/4,z-.027,.045,.035,.01,.01,b.s.displayWhite);}
  else{for(let k=0;k<3;k++)b.b(x+.045,y+.06+k*.045,z-.023,w-.09-k*.025,.01,.01,b.s.displayGlyph);b.b(x+w-.07,y+h-.07,z-.023,.025,.025,.01,b.s.displayWhite);}
  b.b(x+.025,y+.025,z-.035,w-.05,h-.05,.01,b.s.glass);
 };
 const smallMonitor=(b:Shapes,x:number,y:number,z:number,w=.35)=>{b.b(x+.04,y,z-.07,w-.08,.025,.18,b.s.metal);b.b(x+w/2-.03,y+.02,z-.01,.06,.105,.045,b.s.trim);screen(b,x,y+.10,z,w,.25);for(const xx of[x+.025,x+w-.05])b.b(xx,y+.115,z+.04,.025,.20,.015,b.s.polymer);};
 const deskPedestal=(b:Shapes,x:number,w:number,h:number,d:number,drawers=true)=>{
  for(const xx of[x+.025,x+w-.055])b.b(xx,.12,.05,.03,h-.16,d-.10,b.s.wood);for(const yy of[.12,h-.045])b.b(x+.025,yy,.05,w-.05,.025,d-.10,b.s.wood);b.b(x+.025,.12,d-.075,w-.05,h-.14,.025,b.s.wood);
  if(drawers){for(let k=0;k<3;k++)drawer(b,x+.06,.155+k*(h-.19)/3,.025,w-.12,(h-.19)/3-.02,d-.15);}
  else door(b,x+.055,.16,.01,w-.11,h-.21);
 };
 const handset=(b:Shapes,x:number,y:number,z:number)=>{b.b(x,y,z,.10,.28,.045,b.s.metal);for(const yy of[y,y+.21])b.rounded(x-.005,yy,z-.025,.11,.07,.045,.015,b.s.polymer);for(let i=0;i<3;i++)b.b(x+.02+i*.025,y+.245,z-.03,.01,.02,.015,b.s.printedDark);};
 const gavel=(b:Shapes,x:number,y:number,z:number)=>{b.cylinder(x+.055,y,z+.05,.055,.025,b.s.woodEdge);b.b(x+.015,y+.025,z+.025,.085,.04,.05,b.s.wood);b.beam([x+.055,y+.04,z+.05],[x+.18,y+.04,z+.10],.02,b.s.wood);};

 add(147,[1.16,1.64,.58],'城市终端：空心双门柜、双层竖框大屏、倾斜输入台、实体按键、读卡孔与后检修口',(b,w,h,d)=>{
  b.part('四立柱与石脚、空心柜腔及上下背撑',()=>{for(const x of[.01,w-.105])for(const z of[.015,d-.11])b.post(x,0,z,.095,z<.1?.90:h);for(const yy of[.13,.70])b.b(.055,yy,.065,w-.11,.03,d-.13,b.s.wood);for(const x of[.06,w-.085])b.b(x,.14,.065,.025,.60,d-.13,b.s.wood);b.b(.06,.14,d-.08,w-.12,.60,.025,b.s.wood);});
  b.part('双石芯柜门、铜拉手与中分承板',()=>{b.b(w/2-.015,.14,.05,.03,.58,d-.12,b.s.wood);door(b,.07,.17,.015,w/2-.085,.49);door(b,w/2+.015,.17,.015,w/2-.085,.49,false);});
  b.part('上部大屏、后壳通风和框端灯盒',()=>{screen(b,.115,.925,d-.10,w-.23,.60,true);b.b(.06,1.54,d-.15,w-.12,.07,.09,b.s.wood);for(const x of[.07,w-.14]){b.b(x,.98,d-.125,.06,.45,.06,b.s.metal);b.b(x+.01,1.07,d-.14,.04,.22,.02,b.s.energy);}for(const x of[.17,w-.28]){b.b(x,1.56,d-.17,.11,.035,.02,b.s.warm);}for(let x=.17;x<w-.12;x+=.07)b.b(x,1.04,d-.055,.025,.25,.02,0);});
  b.part('阶梯斜面输入台、随坡嵌屏、独立键帽与贯通读卡槽',()=>{
   for(let k=0;k<32;k++){const z=-.04+k*.015,yy=.76+k*.005;b.b(.02,yy,z,w-.04,.045,.015,b.s.wood);b.b(.065,yy+.025,z,w-.13,.025,.015,b.s.wall);}
   for(const x of[.02,w-.065])b.beam([x,.73,-.03],[x,.92,.42],.045,b.s.trim);
   for(let k=5;k<21;k++){const z=-.04+k*.015,yy=.76+k*.005;b.b(.18,yy+.05,z,.42,.02,.015,b.s.metal);if(k>5&&k<20){b.b(.20,yy+.065,z,.38,.01,.015,b.s.screen);for(let j=0;j<5;j++)if(k<9+[4,8,6,11,3][j])b.b(.225+j*.065,yy+.075,z,.035,.01,.015,b.s.displayGlyph);b.b(.20,yy+.085,z,.38,.01,.015,b.s.glass);}}
   for(let row=0;row<3;row++)for(let col=0;col<4;col++){const z=.075+row*.055,yy=.76+Math.floor((z+.04)/.015)*.005+.065;b.b(.66+col*.055,yy-.015,z,.04,.04,.04,b.s.polymer);b.b(.67+col*.055,yy+.025,z+.01,.015,.01,.015,b.s.printedDark);}
   b.b(.935,.845,.065,.105,.095,.115,b.s.metal);b.b(.955,.885,.055,.065,.02,.135,0);
  });
  b.part('侧控灯、前铜销和后部走线通孔',()=>{for(const x of[.015,w-.045]){b.b(x,.33,-.01,.035,.28,.065,b.s.metal);b.b(x+.01,.37,-.02,.015,.19,.02,b.s.energy);}b.b(.40,.24,d-.085,.14,.10,.04,0);});
 },{limits:'柜体真实空心，屏幕底面、显示图形、保护玻璃、按键塑料及石芯输入台分别归类。城市图只是静态几何标记，无查询数据、触控或身份功能。尺寸为作者指定，不声明符合无障碍规范。'});

 add(148,[.78,2.12,.42],'单面仪仗旗：三层基座、嵌灯套筒、分节旗杆、夹环、连续折旗面与织入纹样',(b,w,h,d)=>{
  const pole=.21;
  b.part('石台阶、木金属灯座和承插套筒',()=>{b.b(.015,0,.015,.40,.05,.39,b.s.wall);b.b(.045,.05,.045,.34,.05,.33,b.s.stone);b.b(.09,.10,.08,.25,.20,.26,b.s.metal);for(const z of[.075,.33])b.b(.13,.135,z,.17,.105,.01,b.s.warm);for(const x of[.08,.32])b.b(x,.12,.10,.015,.16,.20,b.s.wood);b.b(.065,.29,.055,.29,.045,.30,b.s.wall);b.b(.125,.335,.115,.17,.04,.18,b.s.metal);b.b(.165,.375,.155,.09,.07,.10,b.s.bronze);});
  b.part('分节方杆、三道夹箍和封顶榫',()=>{b.b(pole-.02,.40,.19,.04,h-.40,.04,b.s.metal);for(const yy of[.48,1.10,1.98]){b.b(pole-.03,yy,.18,.06,.05,.06,b.s.bronze);b.b(pole+.025,yy+.015,.19,.03,.02,.04,b.s.metal);}b.b(pole-.04,h-.075,.17,.08,.06,.08,b.s.bronze);b.b(pole-.02,h-.015,.19,.04,.015,.04,b.s.metal);});
  b.part('连续褶皱旗布、上下包边和两处挂耳',()=>{const x0=.255,ww=.49,y0=.78,hh=1.19;for(let k=0;k<49;k++){const x=x0+k*.01,z=.205+.012*Math.sin(k*.30);b.b(x,y0,z,.01,hh,.025,b.s.bannerCloth);for(const yy of[y0,y0+hh-.02])b.b(x,yy,z-.005,.01,.02,.03,b.s.bannerPattern);if(k%9===0)b.b(x,y0+.02,z-.005,.01,hh-.04,.015,b.s.bannerCloth);}for(const yy of[y0+.04,y0+hh-.06]){frame(b,.225,yy,.185,.06,.045,.055,.01,b.s.bronze);b.b(.25,yy,.20,.035,.045,.025,b.s.bannerCloth);}b.b(.245,1.965,.195,.505,.02,.035,b.s.metal);b.b(.735,1.95,.18,.04,.05,.05,b.s.bronze);});
  b.part('沿褶皱连续织入的双菱形纹样',()=>{
   // Woven yarn follows the existing cloth thickness. A flat ornament plane
   // would disappear behind alternating folds or float in front of them.
   for(const[p,m]of b.g.cells())if(m===b.s.bannerCloth){const x=(p[0]+.5)*b.pitch,y=(p[1]+.5)*b.pitch,diamond=Math.abs(x-.49)+Math.abs(y-1.37);if([.15,.075].some(r=>Math.abs(diamond-r)<.0175))b.g.set(p,b.s.bannerPattern);}
  });
 },{limits:'当前实现参考左侧灰蓝菱纹单旗母版；其余两面旗的独立纹样尚未重建，不计为新增基础 ID。纹样是虚构织入图形；旗布为静态连续薄壳，没有飘动动画、布料求解或真实机构徽记。'});

 add(149,[2.1,1.15,.76],'双工位办理台：石芯桌面、左柜右双抽、双终端支座、中央透明挡片、纸件槽与开放膝位',(b,w,h,d)=>{
  b.table(w,.79,d);b.part('左柜、右抽屉和后横撑',()=>{deskPedestal(b,.035,.48,.735,d,false);deskPedestal(b,w-.515,.48,.735,d,true);b.b(.46,.63,d-.08,w-.92,.09,.04,b.s.wood);});
  b.part('固定双工位屏、独立扫描底座与中央挡片',()=>{for(const x of[.20,1.50]){smallMonitor(b,x,.79,.49,.34);b.b(x+.01,.79,.11,.32,.025,.22,b.s.polymer);for(let k=0;k<4;k++)for(let j=0;j<3;j++)b.b(x+.035+k*.065,.815,.135+j*.055,.045,.015,.035,b.s.printedDark);}for(const x of[.82,1.22]){b.b(x,.79,.36,.08,.20,.045,b.s.metal);b.b(x+.01,.815,.37,.06,.14,.025,b.s.glass);}b.b(.90,.82,.375,.32,.16,.01,b.s.glass);b.b(.90,.97,.37,.32,.015,.025,b.s.trim);});
  b.part('共享交接槽、证件读头与两处真实走线孔',()=>{rim(b,.86,.79,.075,.36,.025,.22,.02,b.s.metal);b.b(.88,.79,.095,.32,.01,.18,b.s.polymer);b.b(1.86,.79,.21,.15,.055,.22,b.s.metal);b.b(1.88,.815,.205,.11,.012,.23,0);for(const x of[.50,1.45])b.b(x,.72,d-.14,.07,.08,.055,0);});
 },{limits:'两组屏与输入装置作为该双工位台的固定部件；柜门、抽屉内腔及走线口是真体素。没有移民、审批、身份数据或业务流程，屏幕及键帽均为静态示意。'});

 add(150,[1.18,1.72,.48],'救济柜：两列三层空格、折叠棉毯、硬塑料急救盒、纸板箱、独立瓶盖液体及下双门',(b,w,h,d)=>{
  b.cabinet(w,h,d,1,1);b.part('中隔与三道承托板',()=>{b.b(.57,.63,.035,.03,h-.68,d-.07,b.s.wood);for(const yy of[.60,.95,1.29])b.b(.04,yy,.025,w-.08,.025,d-.06,b.s.wood);door(b,.065,.17,.0,.515,.385);door(b,.60,.17,.0,.515,.385,false);});
  b.part('三层折叠棉毯及两只纸板救济箱',()=>{for(let j=0;j<3;j++){b.rounded(.075,1.315+j*.08,.09,.44,.08,.29,.025,j===1?b.s.cottonWhite:b.s.fabric);b.b(.12,1.345+j*.08,.075,.33,.01,.02,b.s.fabricEdge);for(const x of[.14,.42])b.b(x,1.32+j*.08,.075,.015,.065,.31,b.s.webbing);}archiveBox(b,.635,1.315,.065,.455,.24,.325);archiveBox(b,.075,.625,.07,.43,.245,.32);archiveBox(b,.66,.625,.07,.40,.245,.30);});
  b.part('塑料急救盒、红色油墨标记和铜扣',()=>{b.rounded(.085,.975,.065,.42,.23,.32,.02,b.s.polymer);b.b(.08,1.185,.06,.43,.025,.33,b.s.polymer);b.b(.262,1.015,.055,.065,.15,.015,b.s.printedRed);b.b(.22,1.055,.055,.15,.065,.015,b.s.printedRed);for(const x of[.13,.43])b.b(x,1.16,.05,.035,.025,.02,b.s.bronze);});
  b.part('四只硬塑料示意液体瓶及独立塑料盖',()=>{for(let k=0;k<4;k++){const cx=.655+k*.11;b.cylinder(cx, .975,.225,.045,.205,b.s.rigidClear);b.cylinder(cx,.975,.225,.035,.15,b.s.fluidBlue);b.cylinder(cx,1.18,.225,.03,.035,b.s.polymer);b.b(cx-.035,1.02,.18,.07,.10,.01,b.s.paperSheet);b.b(cx-.01,1.045,.17,.02,.05,.01,b.s.printedDark);}});
 },{limits:'柜内物资为示意陈列，不表示实际药物内容；白色箱为硬塑料、红色标记为油墨，毯子用织物，包装箱和标签用纸。库存、药效及门屉动画均未实现。'});

 add(151,[1.6,.80,.76],'值班桌本体：左侧检修围板、右三只空心抽屉、石芯写字面、后走线孔、柜内支承与接口托座',(b,w,h,d)=>{
  b.table(w,.80,d);b.part('单侧抽屉柜和另一侧加固围板',()=>{deskPedestal(b,w-.50,.47,.745,d,true);b.b(.07,.25,.06,.04,.43,d-.12,b.s.wood);b.b(.06,.30,.11,.02,.33,d-.22,b.s.wall);b.b(.09,.26,.05,.025,.40,d-.10,b.s.wood);b.b(.12,.18,d-.10,w-.20,.04,.055,b.s.wood);b.b(.11,.27,d-.09,w-.22,.36,.025,b.s.wood);});
  b.part('两组走线槽、后沿线夹和桌下机盒托盘',()=>{for(const x of[.48,1.01]){b.b(x,.74,d-.13,.10,.07,.045,0);b.b(x-.015,.79,d-.145,.13,.015,.025,b.s.metal);}b.b(.10,.14,.24,.19,.025,.34,b.s.metal);for(const z of[.24,.545])b.b(.10,.14,z,.19,.07,.025,b.s.trim);b.b(.11,.14,.24,.025,.30,.335,b.s.metal);});
  b.part('固定近端通讯接口座、插孔和状态键',()=>{b.b(.12,.80,.12,.14,.045,.12,b.s.metal);b.b(.14,.825,.10,.055,.015,.08,0);b.b(.22,.835,.13,.025,.015,.055,b.s.energy);for(const x of[.13,1.42])b.b(x,.725,-.005,.025,.025,.025,b.s.bronze);});
 },{limits:'本母版只包含值班桌和固定接口。参考中的显示器、台灯、资料及座椅按其他母版放置，不焊入桌体、不重复增加基础数量。原生柜腔及膝位保留，尚无抽屉动画。'});

 add(152,[1.10,1.82,.50],'证物柜：分隔承架、双玻璃门、分层纸盒和硬壳盒、下双空屉、锁条与侧嵌式状态屏',(b,w,h,d)=>{
  b.cabinet(w,h,d,1,1);b.part('三层证物承板与左右分仓',()=>{for(const yy of[.48,.89,1.29])b.b(.05,yy,.04,w-.10,.025,d-.08,b.s.wood);b.b(.455,.50,.025,.025,h-.55,d-.06,b.s.wood);b.b(.865,.49,.04,.035,h-.54,d-.08,b.s.wood);for(let j=0;j<3;j++)for(let i=0;i<2;i++){archiveBox(b,.09+i*.41,.505+j*.40,.10,.32,.22,.28,(i+j)%2?b.s.archiveBoard:b.s.polymer);b.b(.12+i*.41,.555+j*.40,.085,.025,.065,.015,b.s.bronze);}});
  b.part('玻璃门压框、上下铰链和双长把',()=>{for(const x of[.045,.465]){frame(b,x,.485,-.015,.41,1.27,.045,.025,b.s.metal);b.b(x+.025,.51,.005,.36,1.22,.015,b.s.glass);handle(b,x===.045?x+.345:x+.035,1.00,-.055,.025,.22);hinges(b,x===.045?x-.005:x+.385,.52,-.025,1.15);}});
  b.part('下部双层结构抽屉、承重滑轨与锁销',()=>{for(const x of[.065,.55]){for(const xx of[x+.035,x+.39])b.b(xx,.135,.07,.025,.045,d-.14,b.s.metal);drawer(b,x,.16,.02,.45,.26,d-.09,b.s.wall);}});
  b.part('右侧嵌式查询条、键帽、门锁和检修边',()=>{b.b(.91,.48,0,.125,1.20,.045,b.s.enamel);screen(b,.925,1.12,-.015,.095,.25);b.b(.93,.79,-.015,.09,.20,.035,b.s.metal);for(let j=0;j<3;j++)for(let k=0;k<2;k++)b.b(.94+k*.035,.82+j*.05,-.035,.02,.025,.02,b.s.polymer);b.b(.94,1.58,-.01,.075,.035,.02,b.s.energy);});
 },{limits:'证物为无内容的示意盒，柜门保持闭合静态姿态。透明门、纸板包装、硬塑料盒、纸标签和显示面分别可替换；没有门禁、锁定、证物追踪或开门动画。'});

 add(153,[2.40,1.54,1.64],'三席审判工位：木构长台、凹芯前围、三组固定屏与话筒、铜制平衡纹以及三把独立高背椅',(b,w,h,d)=>{
  b.table(w,.90,.76);b.part('前围、浅石侧芯及中央铜制平衡图形',()=>{b.b(.10,.14,.035,w-.20,.64,.055,b.s.wood);for(const x of[.17,1.73])b.inset(x,.22,-.015,.49,.46,.06,b.s.wall,true);b.b(.77,.19,.015,.86,.56,.035,b.s.woodEdge);b.cylinder(1.20,.49,-.005,.20,.02,b.s.bronze,.18,'z');b.beam([1.20,.36,-.015],[1.20,.64,-.015],.025,b.s.bronze);b.beam([1.02,.58,-.015],[1.38,.58,-.015],.025,b.s.bronze);for(const x of[1.04,1.36]){b.beam([x,.58,-.015],[x-.06,.43,-.015],.02,b.s.bronze);b.beam([x,.58,-.015],[x+.06,.43,-.015],.02,b.s.bronze);b.b(x-.06,.42,-.02,.12,.02,.025,b.s.bronze);}});
  b.part('木台面分板、固定屏、弯颈话筒与木槌',()=>{b.b(.05,.88,.04,w-.10,.04,.68,b.s.wood);for(const x of[.79,1.59])b.b(x,.90,.05,.02,.02,.65,b.s.metal);for(const x of[.30,1.03,1.76]){smallMonitor(b,x,.92,.43,.30);b.cylinder(x+.34,.92,.47,.035,.02,b.s.metal);b.beam([x+.34,.94,.47],[x+.34,1.15,.40],.02,b.s.metal);b.beam([x+.34,1.15,.40],[x+.34,1.18,.38],.04,b.s.rubber);}gavel(b,1.09,.92,.15);});
  for(let n=0;n<3;n++)b.part('独立高背椅 '+(n+1),()=>b.shifted([.15+n*.77,0,1.00],q=>{const cw=.56,cd=.58;for(const x of[0,cw-.08]){q.post(x,0,0,.08,.70);q.post(x,0,cd-.08,.08,h);}q.b(.055,.32,.04,cw-.11,.06,cd-.08,q.s.wood);q.rounded(.08,.38,.055,cw-.16,.09,cd-.12,.025,q.s.fabric);for(const x of[.03,cw-.07])q.b(x,.65,.045,.04,.04,cd-.08,q.s.wood);q.b(.06,.62,cd-.07,cw-.12,.04,.04,q.s.wood);q.b(.06,h-.08,cd-.075,cw-.12,.05,.05,q.s.wood);for(const x of[.16,.29,.40])q.b(x,.40,cd-.07,.03,h-.49,.035,q.s.wood);q.rounded(.09,.72,cd-.13,cw-.18,.45,.065,.02,q.s.fabric);q.inset(.19,1.25,cd-.09,.18,.17,.03,q.s.wall,false);}));
 },{pitch:.02,expectedComponents:4,limits:'该清单条目是三席工位：长台与三把座椅共四个预期分离结构，没有额外新增基础 ID。屏和话筒固定于台面，平衡纹为虚构装饰。无司法业务、录音或座椅活动机构。'});

 add(154,[1.92,.97,.66],'三连旁听座椅：共享下架、四组扶手柱、分体坐垫、后倾靠垫、包缝、背枨与石脚',(b,w,h,d)=>{
  b.part('四组前后柱、贯通下枨及每席承板',()=>{for(const x of[0,.61,1.22,1.83]){b.post(x,0,.015,.09,.69);b.post(x,0,d-.09,.09,h);}for(const z of[.04,d-.08])b.b(.045,.30,z,w-.09,.055,.04,b.s.wood);for(let n=0;n<3;n++){const x=.09+n*.61;b.b(x,.33,.055,.52,.04,d-.13,b.s.wood);for(const xx of[x-.055,x+.555])b.b(xx,.63,.055,.035,.055,d-.12,b.s.wood);b.b(x,.82,d-.05,.52,.045,.035,b.s.wood);}});
  b.part('三块独立软垫、折边和阶梯后倾靠背',()=>{for(let n=0;n<3;n++){const x=.11+n*.61;b.rounded(x,.37,.055,.47,.10,.50,.02,b.s.fabricEdge);b.rounded(x+.01,.385,.06,.45,.09,.48,.02,b.s.fabric);for(let k=0;k<44;k++){const y=.48+k*.01,z=.50+k*.0016;b.b(x,y,z,.47,.01,.07,b.s.fabricEdge);b.b(x+.01,y,z-.005,.45,.01,.065,b.s.fabric);}for(const z of[.085,.505])b.b(x+.02,.455,z,.43,.01,.01,b.s.fabricEdge);}});
 },{limits:'三席为一个连座母版，共享下架而非三个新资产。布垫与木扶手、金属套箍、石脚分开；人体空间只做几何净空检查，不宣称结构承重认证或坐姿动画。'});

 add(155,[1.30,1.12,.70],'记录台：左围板右抽屉、凹入纸件托盘、短屏、记录盒、桌上小摄像头和走线孔',(b,w,h,d)=>{
  b.table(w,.78,d);b.part('右三抽与左竖向围板、桌后横撑',()=>{deskPedestal(b,w-.46,.43,.725,d,true);b.b(.07,.27,.06,.045,.43,d-.12,b.s.wood);b.b(.045,.31,.12,.025,.34,d-.24,b.s.wall);b.b(.10,.23,d-.09,w-.20,.055,.045,b.s.wood);});
  b.part('低短屏与固定信息底座、双键槽和记录盒',()=>{smallMonitor(b,.71,.78,.35,.32);b.b(.42,.78,.19,.24,.045,.24,b.s.metal);b.b(.44,.81,.195,.20,.025,.05,b.s.bronze);b.b(.455,.835,.20,.17,.01,.025,b.s.screen);for(const x of[.44,.58])b.b(x,.81,.33,.065,.02,.06,b.s.polymer);b.b(.77,.78,.10,.27,.025,.16,b.s.polymer);for(let i=0;i<4;i++)b.b(.79+i*.055,.805,.12,.035,.01,.11,b.s.printedDark);});
  b.part('真实纸件凹槽、纸张与桌面摄像支架',()=>{b.b(.15,.755,.075,.235,.045,.27,0);rim(b,.14,.775,.065,.255,.015,.29,.015,b.s.metal);b.b(.16,.75,.085,.215,.01,.25,b.s.wood);manuscript(b,.17,.76,.095,.195,.22);b.b(.29,.78,.44,.10,.035,.12,b.s.metal);b.b(.325,.805,.47,.025,.24,.035,b.s.trim);b.b(.295,1.015,.435,.09,.07,.075,b.s.polymer);b.cylinder(.34,1.05,.425,.025,.02,b.s.glass,0,'z');});
  b.part('后端走线孔和固定脚板',()=>{b.b(.57,.72,d-.105,.075,.065,.04,0);for(const x of[.025,w-.125])for(const z of[.025,d-.125]){b.b(x,0,z,.10,.025,.10,b.s.metal);b.b(x+.035,0,z+.035,.03,.03,.03,0);}});
 },{limits:'只含记录桌与固定采录外壳，座椅另行拼装；纸张与显示图形材质独立。摄像和记录界面没有采集、识别、录音功能，无人物或问讯内容。'});

 add(156,[2.06,1.98,.90],'双层床储物组合：木金属四柱、上下承床、两组棉枕与床品、长短防护栏、贯通梯级与空心下柜',(b,w,h,d)=>{
  b.part('四角柱、分层纵梁、床板与端板',()=>{for(const x of[0,w-.10])for(const z of[.02,d-.12])b.post(x,0,z,.10,h);for(const yy of[.48,1.38]){b.b(.06,yy,.075,w-.12,.06,d-.15,b.s.metal);for(const z of[.05,d-.10])b.b(.04,yy-.05,z,w-.08,.07,.055,b.s.wood);for(const x of[.04,w-.10])b.b(x,yy-.03,.07,.06,.08,d-.14,b.s.wood);}b.b(w-.075,.12,.075,.035,h-.20,d-.15,b.s.wall);});
  b.part('上下床品、独立棉枕与可见缝边',()=>{for(const[yy,mat]of[[.54,b.s.fabric],[1.44,b.s.cottonWhite]]){b.rounded(.11,yy,.10,w-.22,.10,d-.21,.025,b.s.cottonWhite);b.rounded(.46,yy+.07,.11,w-.61,.035,d-.23,.015,mat);b.b(.45,yy+.10,.12,.07,.02,d-.25,b.s.fabricEdge);b.rounded(.15,yy+.10,.21,.30,.08,.46,.035,b.s.cottonWhite);for(const z of[.12,d-.14])b.b(.51,yy+.10,z,w-.67,.02,.02,b.s.fabricEdge);}});
  b.part('上铺前后护栏、端栏及固定卡座',()=>{for(const z of[.03,d-.075]){const length=z<.1?1.48:w-.16;b.b(.08,1.78,z,length,.045,.035,b.s.metal);for(const x of[.10,.73,1.45])b.b(x,1.42,z,.025,.39,.035,b.s.trim);}for(const x of[.06,w-.10]){b.b(x,1.82,.05,.04,.045,d-.14,b.s.metal);for(const z of[.10,.43,.76])b.b(x,1.48,z,.04,.36,.025,b.s.trim);}});
  b.part('外挂直梯、贯通梯间空格和踏面橡胶',()=>{for(const x of[1.48,1.94])b.b(x,0,-.06,.045,1.87,.06,b.s.metal);for(let k=0;k<7;k++){const yy=.16+k*.235;b.b(1.50,yy,-.06,.47,.045,.06,b.s.trim);b.b(1.53,yy+.04,-.065,.41,.02,.07,b.s.rubber);}for(const y of[.45,1.39])for(const x of[1.48,1.94])b.b(x,y,-.025,.045,.06,.16,b.s.bronze);});
  b.part('床下双门空柜、开放纸盒格和底托',()=>{b.b(.12,.10,.075,w-.24,.035,d-.15,b.s.wood);b.b(.12,.135,d-.12,w-.24,.32,.025,b.s.wood);for(const x of[.12,1.19,w-.16])b.b(x,.135,.075,.035,.32,d-.15,b.s.wood);door(b,.15,.16,.035,.50,.28);door(b,.67,.16,.035,.49,.28,false);archiveBox(b,1.27,.135,.16,.49,.25,.52);});
  b.part('端柱检修面板与独立状态灯',()=>{b.b(w-.115,.73,-.015,.075,.34,.055,b.s.metal);b.b(w-.10,.85,-.025,.045,.15,.02,b.s.screen);b.b(w-.09,.875,-.03,.025,.05,.015,b.s.displayGlyph);});
 },{pitch:.02,limits:'上下铺净空、梯间通孔和下柜空腔为真实网格，床品、橡胶踏面和纸盒分别归类。无人物、床铺动画或工程承重认证；薄构造按 20 mm 格距表达，梯角和床垫曲面仍为阶梯。'});

 add(157,[.82,1.60,.56],'岗亭信息台：石芯柜门、空腔、倾斜屏、话筒挂槽、实体线缆、抬高防雨檐和暖光灯盒',(b,w,h,d)=>{
  b.part('四柱、空心下柜与单门检修面',()=>{for(const x of[.015,w-.11])for(const z of[.015,d-.11])b.post(x,0,z,.095,z<.1?.85:h-.10);for(const yy of[.14,.73])b.b(.065,yy,.06,w-.13,.025,d-.12,b.s.wood);for(const x of[.06,w-.085])b.b(x,.16,.06,.025,.57,d-.12,b.s.wood);b.b(.065,.16,d-.08,w-.13,.57,.025,b.s.wood);door(b,.085,.20,.005,w-.17,.47);});
  b.part('分层防雨罩、上沿挂槽和内缩暖光面',()=>{b.b(-.06,1.46,-.07,w+.12,.075,d+.13,b.s.metal);b.b(-.025,1.535,-.035,w+.05,.035,d+.065,b.s.trim);b.b(.09,1.43,.045,w-.18,.045,.06,b.s.wood);b.b(.18,1.425,.035,w-.36,.025,.05,b.s.warm);for(const x of[-.045,w-.005])b.b(x,1.445,-.065,.05,.09,.07,b.s.bronze);});
  b.part('真实后倾屏面、实体输入沿和侧指示柱',()=>{for(let k=0;k<35;k++){const yy=.82+k*.01,zz=.08+k*.007;b.b(.075,yy,zz,.48,.01,.065,b.s.metal);if(k>2&&k<32){b.b(.105,yy,zz-.005,.42,.01,.02,b.s.screen);for(const xx of[.105,.495])b.b(xx,yy,zz-.015,.03,.01,.01,b.s.displayGlyph);b.b(.105,yy,zz-.025,.42,.01,.01,b.s.glass);}}b.b(.07,.785,-.015,w-.14,.045,.21,b.s.wall);b.b(.24,.825,.015,.22,.01,.05,b.s.polymer);for(const x of[.015,w-.055]){b.b(x,.82,.04,.04,.28,.045,b.s.trim);b.b(x+.01,.90,.025,.02,.11,.02,b.s.energy);}for(let k=0;k<6;k++){const yy=.91+k*.025,zz=.08+(yy-.82)*.7-.023;b.b(.16+k*.035,yy,zz,.035,.01,.012,b.s.displayWhite);}});
  b.part('话筒托座、数字键与有支撑的盘绕线缆',()=>{b.b(.59,.82,.15,.15,.34,.10,b.s.metal);handset(b,.62,.85,.13);for(let k=0;k<5;k++){b.beam([.735,.88-k*.06,.14],[.765,.85-k*.06,.14],.015,b.s.rubber);b.beam([.765,.85-k*.06,.14],[.735,.82-k*.06,.14],.015,b.s.rubber);}b.beam([.735,.58,.14],[.705,.53,.31],.015,b.s.rubber);b.b(.68,.52,.285,.06,.055,.055,b.s.metal);});
 },{limits:'防雨檐和后倾屏为真实几何，话筒线缆用连续体素路径。柜内留空，显示内容仅静态图形；无联网、巡逻数据、通信或雨水仿真。'});

 add(158,[.32,.50,.66],'安防摄像器：中空涂装壳、伸出遮雨罩、退层镜圈、独立玻璃与光学层、俯仰座、壁板和连续线缆',(b,w,h,d)=>{
  b.part('涂装壁板、四只螺钉和加长金属悬臂',()=>{b.rounded(.075,0,.605,.17,.34,.035,.01,b.s.enamel);b.b(.09,.015,.59,.14,.31,.02,b.s.metal);for(const x of[.10,.205])for(const y of[.025,.30]){b.cylinder(x,y,.58,.012,.025,b.s.bronze,0,'z');b.b(x-.004,y-.004,.575,.008,.008,.01,b.s.metal);}b.b(.125,.14,.22,.07,.065,.385,b.s.metal);b.b(.11,.125,.44,.10,.095,.075,b.s.trim);});
  b.part('俯仰叉架、横向铜轴和抬高的相机空心壳',()=>{for(const x of[.095,.205])b.b(x,.185,.19,.025,.16,.07,b.s.metal);b.b(.085,.265,.195,.15,.055,.055,b.s.bronze);b.b(.125,.28,.175,.07,.075,.075,b.s.metal);b.rounded(.015,.32,.015,.29,.14,.325,.025,b.s.enamel);b.b(.045,.345,.035,.23,.09,.28,0);b.b(.04,.34,.295,.24,.105,.025,b.s.metal);b.b(.06,.355,.275,.20,.075,.02,b.s.polymer);});
  b.part('前框、退层光学镜圈、青色光学面与保护玻璃',()=>{frame(b,.035,.33,-.005,.25,.125,.04,.02,b.s.metal);b.b(.055,.35,.025,.21,.085,.015,b.s.metal);b.cylinder(.16,.3925,-.0125,.0525,.04,b.s.trim,.038,'z');b.cylinder(.16,.3925,.0125,.036,.0125,b.s.opticsGlow,0,'z');b.cylinder(.16,.3925,.01,.018,.005,b.s.lightCore,0,'z');b.cylinder(.16,.3925,-.005,.04,.01,b.s.glass,0,'z');for(const x of[.055,.245])b.b(x,.355,-.01,.015,.015,.04,b.s.bronze);});
  b.part('伸出式阶梯遮雨罩、实体分板凹缝、护边和后扣',()=>{for(let k=0;k<5;k++){const x=.005+k*.005;b.b(x,.44+k*.005,-.045,w-2*x,.015,.40-k*.003,b.s.enamel);}for(const x of[.005,.295])b.b(x,.41,-.045,.02,.04,.395,b.s.enamel);for(const x of[.11,.205])b.b(x,.47,-.025,.005,.01,.32,0);for(const x of[.02,.265])for(const z of[-.025,.28]){b.b(x,.435,z,.035,.03,.03,b.s.bronze);b.b(x+.01,.435,z,.015,.03,.01,b.s.metal);}});
  b.part('连续橡胶电缆、插头和背面通风槽',()=>{const points:V3[]=[[.25,.365,.32],[.28,.32,.40],[.28,.07,.49],[.24,.035,.53],[.16,.045,.57],[.155,.09,.60]];for(let k=1;k<points.length;k++)b.beam(points[k-1],points[k],.015,b.s.rubber);for(const[x,y,z]of[points[0],points[points.length-1]])b.b(x-.0125,y-.0125,z-.0125,.025,.025,.025,b.s.metal);for(let x=.07;x<.27;x+=.035)b.b(x,.40,.3075,.015,.035,.04,0);});
 },{pitch:.005,mount:'wall',limits:'5 mm 格距保留镜圈退面、线缆及俯仰叉间隙；浅壳为涂装金属，线缆为橡胶，保护玻璃和光学发光层独立。仅静态设备外形，无成像、跟踪、录像或旋转动画。'});
}
