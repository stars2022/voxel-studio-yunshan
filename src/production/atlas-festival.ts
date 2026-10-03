import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import {eachCell,type V3} from '../core/types';

/** M011: scoped native masters. Dimensions and hidden surfaces are authored;
 * the supplied image is a design reference, not a measurable engineering plan. */
export function registerFestivalRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>)=>AtlasRecipe){
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,t,d,m);b.b(x,y+h-t,z,w,t,d,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const cylinderX=(b:Shapes,x:number,cy:number,cz:number,len:number,r:number,m:number,inner=0)=>eachCell(b.bounds(x,cy-r,cz-r,len,2*r,2*r),p=>{const rr=((p[1]+.5)*b.pitch-cy)**2+((p[2]+.5)*b.pitch-cz)**2;if(rr<=r*r&&rr>=inner*inner)b.g.set(p,m);});
 const locks=(b:Shapes,x:number,y:number,z:number,w:number,d:number)=>{for(const xx of[x,x+w-.06])for(const zz of[z,z+d-.06]){b.b(xx,y,zz,.06,.045,.06,b.s.metal);b.b(xx+.012,y+.018,zz+.012,.036,.032,.036,b.s.bronze);}};
 const lantern=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{
  for(const yy of[y,y+h-.045]){b.b(x,yy,z,w,.025,d,b.s.metal);b.b(x+.015,yy+.025,z+.015,w-.03,.02,d-.03,b.s.bronze);}
  for(const xx of[x+.015,x+w-.035])for(const zz of[z+.015,z+d-.035])b.b(xx,y+.03,zz,.02,h-.06,.02,b.s.bronze);
  const pad=Math.max(b.pitch,Math.min(.03,Math.min(w,d)*.22));b.b(x+pad,y+.045,z+pad,w-2*pad,h-.09,d-2*pad,b.s.warm);
 };
 const diamond=(b:Shapes,x:number,y:number,z:number,scale:number,m:number)=>{
  const pattern=['0001000','0011100','0110110','1101011','0110110','0011100','0001000'];for(let j=0;j<7;j++)for(let i=0;i<7;i++)if(pattern[j][i]==='1')b.b(x+i*scale,y+(6-j)*scale,z,scale,scale,b.pitch,m);
 };
 const timer=(b:Shapes,x:number,y:number,z:number)=>{
  b.b(x,y,z,.26,.16,.07,b.s.metal);b.b(x+.015,y+.015,z-.01,.23,.13,.02,b.s.screen);
  // Actual seven-segment 03:00 glyph cells. No bitmap overlay or live timer.
  const segments=[[0,0,.035,.01],[0,.04,.035,.01],[0,.08,.035,.01],[0,0,.01,.045],[.025,0,.01,.045],[0,.045,.01,.045],[.025,.045,.01,.045]];
  for(const [j,on]of [[0,[0,2,3,4,5,6]],[1,[0,1,2,4,6]],[2,[0,2,3,4,5,6]],[3,[0,2,3,4,5,6]]] as const){const xx=x+.025+j*.05+(j>1?.01:0);for(const n of on){const [a,c,w,h]=segments[n];b.b(xx+a,y+.035+c,z-.02,w,h,.01,b.s.displayGlyph);}}
  for(const yy of[y+.06,y+.10])b.b(x+.12,yy,z-.02,.01,.01,.01,b.s.displayGlyph);
  b.b(x+.045,y-.025,z+.025,.17,.03,.045,b.s.metal);locks(b,x,y+.13,z,.26,.07);
 };
 const ball=(b:Shapes,c:V3,r:number,colour:(v:V3)=>number)=>eachCell(b.bounds(c[0]-r,c[1]-r,c[2]-r,2*r,2*r,2*r),p=>{const v=p.map((n,i)=>(n+.5)*b.pitch-c[i]) as V3,q=v.reduce((s,n)=>s+n*n,0);if(q<=r*r&&q>=(r-.025)**2)b.g.set(p,colour(v));});
 const gift=(b:Shapes,x:number,y:number,z:number)=>{
  b.b(x,y,z,.23,.19,.22,b.s.giftPaper);b.b(x-.005,y+.165,z-.005,.24,.035,.23,b.s.giftPaper);
  b.b(x+.095,y,z-.005,.035,.20,.235,b.s.giftRibbon);b.b(x-.005,y+.17,z+.09,.24,.035,.035,b.s.giftRibbon);
  for(const sign of[-1,1]){frame(b,x+.11+(sign<0?-.08:.005),y+.195,z+.085,.08,.045,.035,.01,b.s.giftRibbon);}b.b(x+.105,y+.19,z+.09,.035,.045,.04,b.s.giftRibbon);
 };

 add(180,[1.02,1.46,.65],'辩论讲席：斜承板、实心挡沿、开放背柜、书页折脊、话筒支臂与独立计时面',(b,w,h,d)=>{
  b.part('四立柱、宽石脚、木横枨与凹入前嵌板',()=>{for(const x of[.06,.84])for(const z of[.07,.48])b.post(x,0,z,.09,.98);for(const y of[.18,.94])b.b(.06,y,.07,.87,.05,.50,b.s.wood);b.inset(.17,.25,.10,.64,.61,.045,b.s.wall,true);for(const x of[.10,.86]){b.b(x,.34,.055,.05,.43,.045,b.s.bronze);b.b(x+.01,.36,.045,.03,.39,.02,b.s.warm);}b.b(.15,.57,.13,.71,.025,.40,b.s.wood);});
  b.part('连续坡面、书挡、边框与背侧穿线孔',()=>{for(let k=0;k<52;k++){const z=.02+k*.01,y=.98+Math.round(k*.22)*.01;b.b(.015,y,z,w-.03,.045,.01,b.s.wood);for(const x of[.015,w-.045])b.b(x,y+.045,z,.03,.025,.01,b.s.metal);}b.b(.02,1.02,.01,w-.04,.045,.025,b.s.woodEdge);locks(b,.0,1.00,.0,w,.12);b.b(.77,1.04,.42,.055,.07,.07,0);});
  b.part('展开纸本、书脊、页边与纸上印墨',()=>{for(let k=0;k<34;k++){const z=.10+k*.01,top=.98+Math.round(((z-.02)/.01)*.22)*.01+.045;for(let j=0;j<42;j++){const x=.075+j*.01,fold=Math.max(0,2-Math.floor(Math.abs(j-20)/8))*.01;b.b(x,top,z,.01,.01+fold,.01,b.s.bookCover);b.b(x,top+.01+fold,z,.01,.015,.01,b.s.paperSheet);if(k%5===1&&j%21>2&&j%21<17)b.b(x,top+.025+fold,z,.01,.005,.01,b.s.printedDark);}}b.b(.28,1.04,.09,.02,.05,.03,b.s.bookCloth);});
  b.part('计时盒和鹅颈话筒',()=>{timer(b,.65,1.125,.32);b.beam([.60,1.08,.46],[.60,1.33,.46],.025,b.s.metal);b.beam([.60,1.33,.46],[.53,1.43,.38],.025,b.s.metal);b.b(.505,1.405,.35,.065,.055,.07,b.s.polymerDark);b.b(.535,1.40,.365,.015,.02,.03,b.s.bronze);});
 },{limits:'保留一个讲席，展开纸本属于固定示意内容；计时屏显示静态 03:00，未实现计时、语音或翻页。石质前嵌板、纸页、印墨、塑料话筒头、显示像素各有实际用途。'});

 add(181,[.68,.12,.68],'棋盘与棋具：十九路线、釉面黑白棋子、低位抽屉、棋盒内腔与桌面脚垫',(b,w,h,d)=>{
  b.part('木棋盘、底部收纳槽与四软脚',()=>{b.b(0,.015,0,w,.055,d,b.s.wood);b.b(.075,.03,0,w-.15,.03,.49,0);for(const x of[.03,w-.06])for(const z of[.03,d-.06])b.b(x,0,z,.03,.015,.03,b.s.rubber);b.b(.035,.07,.035,w-.07,.015,d-.07,b.s.woodEdge);locks(b,0,.06,0,w,d);});
  b.part('十九道实际墨线与星位、分离黑白棋子',()=>{for(let j=0;j<19;j++){const k=.07+j*.03;b.b(k,.085,.07,.005,.005,.545,b.s.printedDark);b.b(.07,.085,k,.545,.005,.005,b.s.printedDark);}for(const x of[.16,.34,.52])for(const z of[.16,.34,.52])b.cylinder(x+.0025,.085,z+.0025,.0075,.005,b.s.printedDark);
   for(const [j,k,c]of[[7,8,0],[8,8,1],[9,9,0],[8,9,1],[10,10,1],[11,10,0],[10,11,0],[6,7,1],[7,6,0],[12,12,1],[6,8,0],[11,11,1]]){const m=c?b.s.gameWhite:b.s.gameBlack;b.cylinder(.0725+j*.03,.09,.0725+k*.03,.013,.01,m);b.cylinder(.0725+j*.03,.10,.0725+k*.03,.010,.005,m);}});
  b.part('静态半开屉、真实屉腔与拉手间隙',()=>{b.b(.085,.03,-.085,.50,.01,.40,b.s.wood);rim(b,.085,.04,-.085,.50,.025,.40,.015,b.s.wood);frame(b,.285,.035,-.11,.10,.025,.015,.005,b.s.bronze);for(const x of[.29,.37])b.b(x,.04,-.10,.015,.015,.03,b.s.metal);for(let j=0;j<8;j++)b.cylinder(.12+j*.055,.04,-.045,.015,.015,j%2?b.s.gameWhite:b.s.gameBlack);});
 },{pitch:.005,limits:'按“棋盘与棋具”制作可摆上桌的棋盘，不重复焊入参考桌子和凳子。棋线为印墨，黑白棋子选釉面陶瓷；十九路线真实，摆子只是示意局面，无棋规判断或抽屉动画。'});

 add(182,[1.42,1.62,.48],'体育球具：木金属双层架、三种空心合成球皮、可见接缝、拍框弦网与尼龙羽球',(b,w,h,d)=>{
  b.part('球架和拍架、托球梁、石脚与分层搁板',()=>{for(const x of[.03,.95,1.29])for(const z of[.055,.335])b.post(x,0,z,.075,x>1?1.55:.85);for(const y of[.19,.75]){b.b(.03,y,.055,1.335,.045,.36,b.s.wood);for(const z of[.05,.365])b.b(.02,y+.045,z,1.355,.045,.035,b.s.metal);}b.b(.08,.235,.095,.90,.03,.27,b.s.wood);b.b(1.02,.24,.12,.32,.065,.25,b.s.wood);b.b(1.015,.78,.13,.35,.05,.16,b.s.wood);});
  b.part('篮球、足球与排球的独立聚合物外皮和中空结构',()=>{ball(b,[.235,.99,.23],.195,v=>Math.abs(v[0])<.012||Math.abs(v[1])<.012||Math.abs(v[0]+v[2]*.7)<.013?b.s.rubber:b.s.ballOrange);ball(b,[.625,.98,.23],.185,v=>{const norm=Math.hypot(...v);return [[0,0,-1],[0,1,0],[.85,.2,.55],[-.65,-.6,.4]].some(n=>v.reduce((sum,q,j)=>sum+q*n[j],0)/norm>.84)?b.s.ballDark:b.s.ballWhite;});ball(b,[.955,.95,.23],.155,v=>Math.floor((Math.atan2(v[0],v[2])+Math.PI)/(Math.PI/3))%2?b.s.ballBlue:b.s.ballYellow);});
  b.part('空椭圆拍框、交叉尼龙弦和橡胶握把',()=>{const cx=1.21,cy=1.18,rx=.145,ry=.265;eachCell(b.bounds(cx-rx,cy-ry,.185,rx*2,ry*2,.05),p=>{const x=(p[0]+.5)*b.pitch-cx,y=(p[1]+.5)*b.pitch-cy,q=x*x/(rx*rx)+y*y/(ry*ry);if(q<=1&&q>.69)b.g.set(p,b.s.metal);else if(q<=.69&&(p[0]%4===0||p[1]%4===0))b.g.set(p,b.s.racketString);});b.beam([1.10,.99,.205],[1.21,.82,.205],.025,b.s.metal);b.beam([1.32,.99,.205],[1.21,.82,.205],.025,b.s.metal);b.b(1.19,.36,.18,.045,.48,.055,b.s.wood);b.b(1.185,.37,.175,.055,.25,.065,b.s.rubber);for(const y of[.38,.43,.48,.53,.58])b.b(1.18,y,.17,.065,.012,.075,b.s.bronze);});
  b.part('下层小球与软木尼龙羽球',()=>{ball(b,[.24,.355,.23],.095,v=>Math.abs(v[0]+v[1])<.015?b.s.printedRed:b.s.ballWhite);ball(b,[.47,.355,.23],.095,v=>Math.abs(v[2])<.01?b.s.rubber:b.s.ballRed);b.cylinder(.755,.265,.22,.035,.055,b.s.shuttleCork);for(let j=0;j<10;j++){const a=j*Math.PI/5;b.beam([.755+Math.cos(a)*.018,.30,.22+Math.sin(a)*.018],[.755+Math.cos(a)*.095,.49,.22+Math.sin(a)*.095],.015,b.s.shuttleVanes);}b.cylinder(.755,.395,.22,.066,.012,b.s.shuttleVanes,.05);});
 },{limits:'器具收纳架属于本球具组，不另外虚报为新资产。球皮选合成聚合物、网弦选尼龙、羽球选尼龙裙片与软木头；足球花片是粗略空间分区，不是标准五六边形面板。无弹跳、充气、球拍变形或体育规则。'});

 add(183,[1.96,1.68,1.90],'卧推器械：双柱孔轨、抱钩、贯通杠轴、分离配重片和独立软垫长凳',(b,w,h,d)=>{
  b.part('双立柱、宽脚与背部横撑',()=>{for(const x of[.31,1.47])for(const z of[1.29,1.62])b.b(x-.07,0,z-.09,.25,.075,.24,b.s.wall);for(const x of[.31,1.47]){b.b(x,.06,1.33,.11,1.56,.34,b.s.metal);b.b(x+.02,.13,1.37,.07,1.44,.23,b.s.wood);for(let j=0;j<9;j++)b.b(x+.035,.46+j*.10,1.32,.035,.035,.055,0);locks(b,x-.02,1.60,1.32,.15,.36);b.b(x-.015,.21,1.285,.14,.24,.045,b.s.metal);b.b(x+.01,.24,1.275,.09,.14,.015,b.s.displayGlyph);}b.b(.33,.14,1.51,1.23,.075,.075,b.s.metal);b.b(.33,1.40,1.57,1.23,.06,.055,b.s.metal);});
  b.part('静态抱钩、钢轴、橡胶握位与独立配重片',()=>{for(const x of[.29,1.45]){b.b(x,1.285,1.24,.15,.045,.30,b.s.metal);b.b(x,1.29,1.23,.15,.10,.04,b.s.metal);b.b(x+.02,1.33,1.24,.11,.02,.08,b.s.rubber);}cylinderX(b,.04,1.37,1.38,1.83,.035,b.s.metalBright);for(const x of[.60,1.18])cylinderX(b,x,1.37,1.38,.16,.037,b.s.rubber);for(const x of[.10,.16,.22,1.58,1.64,1.70]){cylinderX(b,x,1.37,1.38,.045,.27,b.s.metal,.028);cylinderX(b,x+.008,1.37,1.38,.028,.25,b.s.trim,.21);}for(const x of[.04,1.80])cylinderX(b,x,1.37,1.38,.05,.065,b.s.bronze,.027);});
  b.part('独立卧推凳、承垫框和透空支腿',()=>{b.shifted([.69,0,.03],c=>{c.table(.49,.48,1.15,false);c.b(0,.455,0,.49,.04,1.15,c.s.wood);c.rounded(.015,.495,.015,.46,.095,1.12,.025,c.s.fabric);for(const z of[.365,.745])c.b(.03,.575,z,.43,.012,.01,c.s.fabricEdge);for(const z of[.065,1.05]){c.b(.04,.19,z,.41,.045,.04,c.s.metal);}});});
 },{expectedComponents:2,limits:'器械主架与长凳为两组有意分离结构。杠轴、重量片孔、抱钩及机架孔是实际体素；配重不可运动，承重及人体安全未经工程验证。'});

 add(184,[1.04,.84,1.04],'游艺桌：木构腿枨、真实膝部空间、绿呢台面、塑料牌墙、静态抽屉和控制槽',(b,w,h,d)=>{
  b.table(w,.78,d,false);b.part('木围台、嵌入式绿呢和铜角',()=>{b.b(0,.745,0,w,.065,d,b.s.wood);b.b(.07,.79,.07,w-.14,.025,d-.14,b.s.gameFelt);rim(b,.02,.79,.02,w-.04,.035,d-.04,.035,b.s.woodEdge);locks(b,0,.79,0,w,d);});
  b.part('四边分离塑料牌墙与独立油墨牌面',()=>{for(let k=0;k<14;k++){const u=.17+k*.05;for(const z of[.15,.86]){b.b(u,.815,z,.037,.05,.025,b.s.polymer);b.b(u+.01,.827,z-.005,.01,.02,.005,b.s.inkTeal);}for(const x of[.13,.88]){b.b(x,.815,u,.025,.05,.037,b.s.polymer);b.b(x-.005,.825,u+.01,.005,.02,.01,b.s.printedRed);}}for(let j=0;j<4;j++)for(let k=0;k<4;k++){const x=.37+j*.06,z=.37+k*.06;b.b(x,.815,z,.04,.015,.05,b.s.polymer);b.b(x+.015,.83,z+.01,.01,.005,.03,(j+k)%2?b.s.printedRed:b.s.inkTeal);}});
  b.part('屉腔、抽屉侧帮与可握拉手',()=>{b.b(.16,.59,.045,.72,.025,.38,b.s.wood);for(const x of[.16,.855])b.b(x,.615,.045,.025,.12,.38,b.s.wood);b.b(.185,.71,.045,.67,.035,.38,0);b.b(.17,.60,.02,.70,.105,.025,b.s.wood);frame(b,.42,.63,-.025,.20,.04,.02,.01,b.s.bronze);for(const x of[.42,.60])b.b(x,.64,-.01,.02,.02,.045,b.s.metal);b.b(.84,.64,.015,.06,.05,.02,b.s.metal);b.b(.855,.65,.005,.03,.025,.01,b.s.energy);});
 },{limits:'按本次参考制作棋类游艺桌，而非旧粗模街机。独立凳子使用其他母版，不焊在桌子上。牌为塑料和印墨，呢面为织物；无牌局规则、自动洗牌或抽屉动画。'});

 add(185,[1.66,1.70,.20],'双旗幡挂件：横杆、穿孔挂环、双织物垂旗、织入菱纹、压杆与悬坠',(b,w,h,d)=>{
  b.part('上横梁、金属端帽和背部固定耳',()=>{b.b(.01,1.58,.06,w-.02,.075,.095,b.s.wood);locks(b,0,1.58,.05,w,.12);for(const x of[.09,1.47]){b.b(x,1.54,.14,.08,.14,.045,b.s.metal);b.b(x+.025,1.59,.14,.03,.05,.055,0);}});
  b.part('红蓝旗面、真实穿环和金属压杆',()=>{for(const [x,m]of[[.22,b.s.festivalRed],[.91,b.s.bannerCloth]]){for(const xx of[x+.05,x+.39])frame(b,xx,1.43,.07,.055,.17,.04,.015,b.s.bronze);b.b(x-.025,1.395,.055,.53,.045,.095,b.s.wood);b.b(x,.35,.10,.48,1.045,.025,m);for(const xx of[x,x+.46])b.b(xx,.35,.09,.02,1.045,.015,b.s.bannerPattern);for(const yy of[.385,1.33])b.b(x,.0+yy,.085,.48,.025,.015,b.s.bannerPattern);diamond(b,x+.10,.78,.10,.04,b.s.bannerPattern);b.b(x-.015,.32,.06,.51,.035,.085,b.s.bronze);b.b(x+.07,.22,.09,.02,.12,.04,b.s.metal);b.b(x+.385,.22,.09,.02,.12,.04,b.s.metal);frame(b,x+.07,.10,.09,.335,.14,.04,.025,b.s.metal);b.b(x+.19,.04,.09,.095,.085,.04,b.s.metal);}});
  b.part('两端绳节与分束红穗',()=>{for(const x of[.045,1.565]){b.b(x,0,.09,.015,1.60,.02,b.s.festivalRed);for(const y of[.36,.73,1.44])b.b(x-.015,y,.065,.045,.055,.055,b.s.bronze);b.b(x-.02,.28,.09,.06,.035,.02,b.s.festivalRed);for(let j=0;j<3;j++)b.b(x-.02+j*.02,0,.09,.01,.30,.02,b.s.festivalRed);}});
 },{mount:'wall',limits:'本件是悬挂部件，不附造假落地支架。需要通过上梁背部固定耳安装；布面与织纹不是油墨或黄铜。静态无飘动；金属挂环与旗面均保留实际厚度。'});

 add(186,[.94,2.12,.55],'花灯外壳及支架：阶梯悬臂、真实链环、四面框罩、玻璃扩散面、独立内芯和布穗',(b,w,h,d)=>{
  b.part('石座、木立柱与阶梯悬臂',()=>{b.b(0,0,.27,.25,.07,.27,b.s.stone);b.b(.025,.07,.295,.20,.075,.22,b.s.wall);b.post(.075,.145,.345,.10,1.90,false);b.b(.055,1.94,.325,.84,.095,.14,b.s.wood);for(let j=0;j<4;j++)b.b(.15+j*.09,1.54+j*.10,.345,.11,.10,.10,b.s.wood);for(const y of[.33,1.42,1.94]){b.b(.05,y,.32,.15,.08,.15,b.s.metal);b.b(.095,y+.025,.305,.06,.03,.02,b.s.bronze);}b.b(.11,.64,.315,.035,.09,.045,b.s.signalRed);});
  b.part('三节穿环、灯体上下退层盖和四柱框骨',()=>{for(let j=0;j<3;j++)frame(b,.69,1.69+j*.085,.35,.075,.11,.045,.018,b.s.bronze);for(const y of[.68,1.62]){b.b(.49,y,.18,.45,.04,.37,b.s.metal);b.b(.525,y+.04,.215,.38,.04,.30,b.s.bronze);}for(const x of[.535,.865])for(const z of[.225,.485])b.b(x,.76,z,.025,.86,.025,b.s.bronze);b.b(.665,1.70,.31,.105,.055,.11,b.s.metal);});
  b.part('四面玻璃与独立发光内芯、非发光金属回纹',()=>{for(const yy of[.76,1.59])rim(b,.535,yy,.225,.355,.035,.285,.025,b.s.bronze);b.b(.695,.755,.355,.035,.095,.04,b.s.metal);for(const z of[.237,.472])b.b(.56,.79,z,.30,.80,.012,b.s.glass);for(const x of[.55,.86])b.b(x,.79,.25,.012,.80,.23,b.s.glass);b.b(.62,.83,.29,.18,.67,.16,b.s.warm);b.hui(.595,1.025,.22,.22,.26,b.s.bronze,.02);b.b(.60,1.20,.23,.025,.10,.02,b.s.bronze);});
  b.part('下垂结与红色纤维穗',()=>{b.b(.685,.60,.335,.06,.10,.075,b.s.bronze);b.b(.705,.50,.355,.02,.105,.025,b.s.festivalRed);b.b(.69,.47,.34,.055,.06,.055,b.s.bronze);for(let j=0;j<4;j++)b.b(.68+j*.02,.29,.355,.01,.20,.025,b.s.festivalRed);});
 },{limits:'本 ID 保留图示落地悬臂支架，灯罩玻璃与内部电发光芯分开，布穗为织物。玻璃透明混合无真实折射；无摆动、布料或灯光照度验证。'});

 add(187,[1.80,1.17,.72],'婚礼礼仪台：嵌石木台、独立两侧礼托、朱红布幔、织入纹样及纸盒缎带',(b,w,h,d)=>{
  b.table(w,.86,d);b.part('端部抬高礼托与柜式支座',()=>{for(const x of[0,w-.32]){b.b(x,.80,.08,.32,.13,.52,b.s.wood);b.slab(x-.01,.93,.07,.34,.045,.54);b.inset(x+.02,.52,.08,.28,.25,.035,b.s.wood,true,{recess:b.s.woodEdge});b.b(x+.03,.30,.11,.26,.025,.36,b.s.wood);}});
  b.part('跨台布幔、织入边线和前垂图形',()=>{b.b(.44,.86,.035,.92,.015,.65,b.s.festivalRed);b.b(.44,.34,.025,.92,.535,.02,b.s.festivalRed);for(const x of[.475,1.305]){b.b(x,.355,.015,.025,.50,.015,b.s.bannerPattern);b.b(x,.875,.045,.025,.005,.62,b.s.bannerPattern);}for(const y of[.37,.78])b.b(.475,y,.015,.855,.02,.015,b.s.bannerPattern);diamond(b,.78,.51,.025,.035,b.s.bannerPattern);});
  b.part('两只固定示意纸礼盒及独立缎带结',()=>{gift(b,.045,.975,.23);gift(b,1.525,.975,.23);});
 },{limits:'礼盒为本台示意陈设，不重复统计基础 ID；后续可以拆成实例。布幔、织纹、包装纸与缎带分别归类，无婚礼交互、礼盒打开或布料动画。'});

 add(188,[.84,1.19,.79],'礼仪座席：透空侧格、榫接扶手、双层红坐垫、垂背织片和织入菱纹',(b,w,h,d)=>{
  b.table(w,.43,d,false);b.part('四柱、扶手、靠背木框与镂空侧格',()=>{for(const x of[.035,.72]){b.post(x,.38,.66,.085,.78,false);b.post(x,.38,.055,.085,.38,false);b.b(x-.01,.715,.055,.105,.055,.69,b.s.wood);b.b(x+.005,.47,.08,.04,.20,.59,b.s.wood);b.b(x+.005,.515,.10,.04,.115,.54,0);for(let j=0;j<6;j++)b.b(x+.005,.495,.11+j*.09,.04,.165,.018,b.s.wood);b.b(x,.56,.07,.045,.02,.61,b.s.wood);}frame(b,.07,.48,.675,.68,.655,.06,.05,b.s.wood);for(const x of[.12,.22,.59,.69])b.b(x,.58,.66,.018,.46,.03,b.s.wood);b.b(.07,1.13,.65,.68,.04,.095,b.s.wood);for(const yy of[.555,1.02])b.b(.07,yy,.66,.68,.035,.045,b.s.wood);});
  b.part('红色坐垫、独立包边与靠背覆片',()=>{b.b(.065,.40,.07,.68,.05,.65,b.s.wood);b.rounded(.075,.45,.07,.665,.095,.59,.02,b.s.festivalRed);b.b(.075,.455,.07,.665,.015,.01,b.s.giftRibbon);b.b(.275,.57,.645,.31,.55,.025,b.s.festivalRed);b.b(.275,1.11,.645,.31,.025,.11,b.s.festivalRed);for(const x of[.285,.565])b.b(x,.595,.635,.015,.50,.015,b.s.bannerPattern);diamond(b,.325,.75,.645,.027,b.s.bannerPattern);});
  b.part('扶手铜角和两只布穗挂结',()=>{for(const x of[.035,.72]){locks(b,x-.015,.725,.04,.115,.115);b.b(x+.025,.585,.05,.025,.16,.025,b.s.giftRibbon);b.b(x+.015,.575,.04,.045,.04,.035,b.s.bronze);for(let j=0;j<3;j++)b.b(x+.01+j*.015,.46,.055,.01,.13,.015,b.s.giftRibbon);}});
 },{limits:'一个独立礼仪座椅母版，可重复实例化；透空格与扶手净空真实。红软垫、背布和织纹为织物，缎穗使用独立缎带角色。无坐姿、压陷或布料运动。'});

 add(189,[2.36,1.23,1.16],'葬仪台及封闭棺：六足台架、分层棺盖、真实内腔、环形提手、白覆布与四角灯',(b,w,h,d)=>{
  b.part('六足木台、石鞋与凹面围裙',()=>{for(const x of[.04,1.12,2.21])for(const z of[.04,.99])b.post(x,0,z,.095,.48);b.slab(0,.44,0,w,.075,d);for(const z of[.035,1.09])b.b(.04,.16,z,w-.08,.26,.05,b.s.wood);b.inset(.40,.20,.01,1.56,.23,.035,b.s.wood,true,{recess:b.s.woodEdge});b.b(.91,.215,.015,.54,.21,.015,b.s.woodEdge);b.hui(.97,.235,.005,.42,.16,b.s.metal,.015);for(const x of[.24,2.02]){b.b(x,.21,.01,.065,.19,.025,b.s.metal);b.b(x+.015,.245,0,.035,.12,.02,b.s.warm);}for(const x of[.035,2.275])b.b(x,.16,.04,.055,.26,1.08,b.s.wood);});
  b.part('封闭空棺、连续盖层、端封与铜压条',()=>{b.rounded(.17,.515,.17,2.02,.48,.82,.055,b.s.wood);b.b(.25,.58,.25,1.86,.35,.66,0);b.b(.15,.985,.15,2.06,.045,.86,b.s.metal);b.b(.20,1.03,.20,1.96,.055,.76,b.s.wood);b.b(.265,1.085,.265,1.83,.055,.63,b.s.wood);for(const z of[.175,.94])b.b(.21,.98,z,1.95,.018,.025,b.s.bronze);for(const x of[.18,2.14])b.b(x,.59,.16,.04,.32,.025,b.s.bronze);});
  b.part('实握提环与铰座、白色覆布及织纹',()=>{for(const z of[.135,.98])for(const x of[.38,.78,1.36,1.76]){frame(b,x,.67,z,.16,.07,.025,.015,b.s.bronze);for(const xx of[x,x+.135])b.b(xx,.70,z,.025,.05,.055,b.s.bronze);}b.b(.96,1.14,.25,.46,.015,.66,b.s.cottonWhite);for(const z of[.15,.98]){b.b(.96,.71,z,.46,.435,.02,b.s.cottonWhite);for(const xx of[.97,1.39])b.b(xx,.745,z-.01,.02,.36,.015,b.s.wovenLight);diamond(b,1.055,.825,z-.015,.035,b.s.fabricEdge);for(let j=0;j<10;j++)b.b(.97+j*.045,.67,z,.02,.045,.02,b.s.cottonWhite);}for(const z of[.17,.94])b.b(.96,1.10,z,.46,.04,.075,b.s.cottonWhite);});
  b.part('四角框灯与底部安装座',()=>{for(const x of[.025,2.18])for(const z of[.015,1.01]){b.b(x,.51,z,.15,.10,.13,b.s.metal);lantern(b,x,.61,z,.15,.36,.13);}});
 },{limits:'静态封闭空棺，无遗体细节；内部腔体与提环空隙保留，未建立开盖、搬运、布料或仪式逻辑。白覆布与织纹独立于木棺、金属提环及电灯芯。'});

 add(190,[.98,1.61,.67],'纪念牌位：退层石木台座、可替换碑面、背撑、前香座及两侧盆花',(b,w,h,d)=>{
  b.part('宽台座、直立双柱、背撑和石质牌面',()=>{b.b(0,0,.09,w,.065,.58,b.s.stone);b.b(.045,.065,.13,w-.09,.065,.49,b.s.wall);for(const x of[.20,.70])b.post(x,.13,.39,.08,1.39,false);b.panel(.26,.34,.40,.46,1.13,.06,b.s.wall,b.s.wood);b.b(.20,1.48,.36,.58,.07,.14,b.s.metal);b.b(.245,1.55,.385,.49,.035,.09,b.s.stone);b.beam([.31,.14,.58],[.31,1.27,.46],.035,b.s.metal);b.beam([.67,.14,.58],[.67,1.27,.46],.035,b.s.metal);});
  b.part('碑面独立印墨示意、四枚固定扣',()=>{diamond(b,.42,1.18,.39,.02,b.s.printedDark);for(let j=0;j<3;j++){b.b(.455,.65+j*.13,.39,.075,.01,.01,b.s.printedDark);b.b(.475,.66+j*.13,.39,.015,.07,.01,b.s.printedDark);b.b(.45,.70+j*.13,.39,.08,.01,.01,b.s.printedDark);}for(const x of[.25,.67])for(const y of[.39,1.41])b.b(x,y,.365,.06,.055,.045,b.s.bronze);});
  b.part('前托架、空心香座与三枝植物香材',()=>{b.b(.235,.13,.13,.51,.04,.23,b.s.wood);b.b(.36,.17,.195,.27,.035,.13,b.s.wood);rim(b,.36,.205,.195,.27,.06,.13,.02,b.s.bronze);b.b(.38,.21,.215,.23,.02,.09,b.s.soil);for(const x of[.42,.49,.56]){b.b(x,.225,.25,.01,.20,.01,b.s.incense);b.b(x,.425,.25,.01,.015,.01,b.s.ember);}});
  b.part('双侧空心陶盆、枝茎与白花',()=>{for(const x of[.085,.805]){b.b(x,.13,.395,.12,.24,.16,b.s.stone);b.b(x-.015,.37,.37,.15,.17,.18,b.s.ceramicWhite);b.b(x+.01,.41,.395,.10,.14,.13,0);b.b(x+.01,.415,.395,.10,.035,.13,b.s.soil);for(let j=0;j<5;j++){const xx=x+.025+(j%3)*.03,yy=.56+(j%3)*.08,zz=.42+Math.floor(j/3)*.065;b.beam([x+.06,.45,.455],[xx,yy,zz],.01,b.s.leaf);b.b(xx-.025,yy-.06,zz,.05,.02,.045,b.s.leafAlt);b.b(xx-.03,yy,zz-.01,.07,.02,.03,b.s.flowerWhite);b.b(xx-.01,yy,zz-.03,.03,.02,.07,b.s.flowerWhite);b.b(xx-.008,yy+.02,zz-.008,.025,.01,.025,b.s.flowerAmber);}}});
 },{limits:'依据图示制作落地纪念牌位，不能仍当旧版小牌摆到供台上。文字为简化印墨标记，不声称复刻可读铭文；盆花与香座可分选，未实现烟气、祭奠或交互。'});

 add(191,[.94,.80,.49],'家庭庆典桌面摆台：低托盘、独立糕体与裱花、蜡烛烛芯、纸卡、空瓷杯和枝花',(b,w,h,d)=>{
  b.part('低木托台、金属角套与石足',()=>{for(const x of[.025,w-.07])for(const z of[.025,d-.07])b.b(x,0,z,.045,.035,.045,b.s.wall);b.b(0,.035,0,w,.035,d,b.s.wood);locks(b,0,.05,0,w,d);});
  b.part('陶瓷托盘、两层糕体、独立奶油层与朱红糖饰',()=>{b.cylinder(.35,.07,.22,.17,.015,b.s.ceramicWhite);for(const [y,r,hh]of[[.085,.15,.105],[.195,.105,.105]]){b.cylinder(.35,y,.22,r,hh,b.s.cakeCrumb);b.cylinder(.35,y+hh-.02,.22,r+.005,.025,b.s.cakeCream);for(let j=0;j<18;j++){const a=j*Math.PI/9,x=.35+Math.cos(a)*(r-.01),z=.22+Math.sin(a)*(r-.01);b.cylinder(x,y+hh-.01,z,.018,.025,b.s.cakeCream);if(j%3===0)b.b(x-.009,y+.02,z-.009,.018,.045,.018,b.s.cakeGlaze);}}});
  b.part('三只蜡烛、棉芯与静态示意火焰',()=>{for(const [x,z,hh]of[[.31,.22,.11],[.36,.25,.14],[.395,.205,.095]]){b.cylinder(x,.305,z,.008,hh,b.s.candleWax);b.b(x-.0025,.305+hh,z-.0025,.005,.015,.005,b.s.candleWick);b.b(x-.0075,.315+hh,z-.005,.015,.025,.01,b.s.candleFlame);b.b(x-.0025,.34+hh,z-.0025,.005,.01,.005,b.s.candleFlame);}});
  b.part('紙质祝卡、木支撑与红色印字',()=>{b.b(.535,.07,.24,.18,.02,.10,b.s.wood);b.beam([.555,.085,.32],[.555,.36,.285],.015,b.s.wood);b.beam([.695,.085,.32],[.695,.36,.285],.015,b.s.wood);b.b(.54,.10,.285,.165,.29,.01,b.s.paperSheet);for(const yy of[.16,.205,.27,.33])b.b(.585,yy,.28,.075,.01,.005,b.s.printedRed);b.b(.615,.14,.28,.015,.215,.005,b.s.printedRed);});
  b.part('朱红空心陶瓶、枝条与橙色花瓣',()=>{b.cylinder(.825,.07,.355,.055,.12,b.s.ceramicRed);b.cylinder(.825,.18,.355,.035,.07,b.s.ceramicRed);b.cylinder(.825,.12,.355,.022,.15,0);b.b(.82,.08,.35,.01,.58,.01,b.s.wood);for(let j=0;j<7;j++){const yy=.37+j*.047,sign=j%2?1:-1,xx=.825+sign*(.08-j*.006),zz=.355+(j%3-1)*.03;b.beam([.825,yy-.05,.355],[xx,yy,zz],.01,b.s.wood);b.b(xx-.015,yy,zz-.01,.035,.015,.025,b.s.flowerAmber);b.b(xx-.005,yy-.01,zz-.005,.015,.035,.015,b.s.flowerAmber);}});
  b.part('空心白瓷杯和一盏框灯',()=>{for(const x of[.58,.76]){b.bowl(x,.07,.105,.038,.05,b.s.ceramicWhite);b.cylinder(x,.12,.105,.038,.005,b.s.ceramicWhite,.03);}lantern(b,.065,.07,.23,.075,.22,.08);});
 },{pitch:.005,limits:'只制作桌面庆典摆台，不包含餐桌。糕体、奶油、糖饰为食材；蜡体为 wax、棉芯和示意火焰独立，不能把糕体借成石材或蜡体借成灯芯。蜡烛不会燃烧或熔化；瓷杯和花瓶保留真实内腔，纸卡不是显示屏。'});
}
