import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import {eachCell,type V3} from '../core/types';

/** M007: reference-guided static geometry. Openings, vents and instrument
 * spaces are occupancy, never textures. Screen marks do not imply live data. */
export function registerResearchRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>)=>AtlasRecipe){
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,t,d,m);b.b(x,y+h-t,z,w,t,d,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const pin=(b:Shapes,x:number,y:number,z:number,s=.055)=>{b.b(x,y,z,s,s,.035,b.s.metal);b.b(x+.01,y+.01,z-.01,s-.02,s-.02,.02,b.s.bronze);};
 const grip=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{frame(b,x,y,z,w,h,.015,.015,b.s.bronze);for(const xx of[x,x+w-.015])b.b(xx,y,z+.015,.015,h,.055,b.s.metal);};
 const hollowDrawer=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{b.b(x,y,z,w,.02,d,b.s.wood);rim(b,x,y+.02,z,w,h-.02,d,.02,b.s.wood);b.inset(x,y,z-.015,w,h,.025,b.s.wall);grip(b,x+w/2-.055,y+h/2-.02,z-.055,.11,.045);};
 const screen=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{b.b(x,y,z,w,h,.055,b.s.metal);frame(b,x-.025,y-.025,z-.01,w+.05,h+.05,.04,.025,b.s.wood);b.b(x+.02,y+.02,z-.005,w-.04,h-.04,.01,b.s.screen);frame(b,x+.03,y+.03,z-.015,w-.06,h-.06,.015,.01,b.s.energy);for(const xx of[x-.025,x+w-.03])for(const yy of[y-.025,y+h-.03])pin(b,xx,yy,z-.025);};
 const cylinderX=(b:Shapes,x:number,y:number,z:number,r:number,l:number,m:number,inner=0)=>{eachCell(b.bounds(x,y-r,z-r,l,2*r,2*r),p=>{const rr=((p[1]+.5)*b.pitch-y)**2+((p[2]+.5)*b.pitch-z)**2;if(rr<=r*r&&rr>=inner*inner)b.g.set(p,m);});};
 const tap=(b:Shapes,x:number,y:number,z:number)=>{b.cylinder(x,y,z,.035,.02,b.s.metal);b.cylinder(x,y+.02,z,.015,.22,b.s.trim);b.beam([x,y+.23,z],[x,y+.25,z-.08],.025,b.s.trim);b.beam([x,y+.25,z-.08],[x,y+.21,z-.13],.025,b.s.trim);b.b(x-.0075,y+.205,z-.1475,.015,.035,.015,0);b.b(x+.005,y+.08,z-.01,.065,.015,.02,b.s.bronze);};
 const sockets=(b:Shapes,x:number,y:number,z:number)=>{b.b(x,y,z,.10,.13,.045,b.s.polymer);frame(b,x,y,z-.005,.10,.13,.01,.01,b.s.recess);for(const xx of[x+.025,x+.065])b.b(xx,y+.06,z-.01,.01,.025,.04,0);b.b(x+.045,y+.03,z-.01,.01,.025,.04,0);};

 add(111,[.84,.88,1.12],'学生工位：独立桌椅、内收书兜、笔槽、背包挂架、椅背横枨与膝部净空',(b,w,h,d)=>{
  b.part('桌架、石脚、木质攒边桌面和笔槽',()=>{b.shifted([0,0,.55],c=>{c.table(.76,.76,.55);c.b(.05,.755,.05,.66,.005,.44,c.s.woodEdge);c.b(.14,.74,.43,.48,.04,.025,0);});});
  b.part('内收书兜、层板、薄书册与挂钩',()=>{b.b(.075,.535,.61,.61,.02,.38,b.s.wood);for(const x of[.06,.67])b.b(x,.55,.61,.025,.15,.40,b.s.metal);b.b(.075,.555,.99,.61,.135,.02,b.s.wood);for(const[x,hh]of[[.10,.045],[.40,.06]]){b.b(x,.555,.66,.22,hh,.22,b.s.fabricEdge);b.b(x+.012,.565,.67,.195,hh-.02,.20,b.s.paperSheet);}b.b(-.04,.64,.72,.09,.02,.03,b.s.metal);b.b(-.055,.62,.72,.025,.04,.03,b.s.bronze);});
  b.part('挂包、双肩带、袋口翻盖与提环',()=>{b.rounded(-.16,.26,.69,.13,.32,.22,.025,b.s.fabricEdge);b.b(-.17,.40,.72,.025,.13,.16,b.s.fabric);b.b(-.18,.41,.77,.015,.065,.04,b.s.bronze);for(const z of[.71,.86]){b.b(-.05,.39,z,.015,.23,.025,b.s.fabric);b.b(-.08,.61,z,.05,.02,.025,b.s.fabric);}b.beam([-.08,.58,.79],[-.065,.65,.735],.015,b.s.metal);});
  b.part('独立座椅：四足、空背架、横枨和木坐面',()=>{const x=.18,z=.015,ww=.42,dd=.42;for(const xx of[x,x+ww-.05])for(const zz of[z,z+dd-.05])b.post(xx,0,zz,.05,zz<.05?.87:.46);b.b(x-.01,.43,z-.005,ww+.02,.035,dd+.01,b.s.wood);for(const zz of[z+.005,z+dd-.04])b.b(x,.17,zz,ww,.035,.035,b.s.wood);for(const xx of[x+.005,x+ww-.04])b.b(xx,.17,z,.035,.035,dd,b.s.wood);for(const y of[.63,.79])b.b(x+.015,y,z+.01,ww-.03,.065,.035,b.s.woodEdge);});
 },{expectedComponents:2,limits:'一个学生工位 ID，桌与椅为两块有意分离的体素构造，可按部件选区移动。挂包是静态细节；没有坐下动画、课堂任务或 FloorPlan 功能点绑定，重复排布不增加资产数。'});

 add(112,[1.64,1.40,.72],'实验台：耐洗石台面、贯通洗槽、双接口背架、细龙头、三抽屉、检修柜与开放膝位',(b,w,h,d)=>{
  b.part('四柱、柜体侧壁、背撑和石脚',()=>{for(const x of[.01,w-.095])for(const z of[.02,d-.105])b.post(x,0,z,.085,.90);for(const x of[.08,.46,w-.49,w-.105])b.b(x,.12,.08,.025,.72,d-.17,b.s.wood);for(const y of[.14,.79]){b.b(.075,y,.055,.42,.03,d-.12,b.s.wood);b.b(w-.495,y,.055,.42,.03,d-.12,b.s.wood);}b.b(.07,.68,d-.10,w-.14,.15,.03,b.s.wood);});
  b.part('左三屉、右检修门与中间浅屉',()=>{for(const y of[.18,.39,.60])hollowDrawer(b,.085,y,.06,.365,.185,.48);b.inset(w-.45,.19,.035,.34,.57,.035,b.s.wall,true);grip(b,w-.20,.41,-.01,.04,.16);hollowDrawer(b,.53,.72,.085,w-1.06,.08,.38);for(const x of[.54,1.06])b.b(x,.79,.10,.035,.065,.34,b.s.metal);for(const y of[.27,.63])b.b(w-.48,y,.025,.07,.055,.09,b.s.metal);});
  b.part('厚嵌芯台面、真实水槽内腔与排水口',()=>{b.slab(-.015,.84,-.01,w+.03,.07,d+.02);b.b(w-.48,.63,.26,.36,.26,.35,b.s.trim);b.b(w-.455,.655,.285,.31,.31,.30,0);rim(b,w-.49,.89,.25,.38,.025,.37,.025,b.s.metal);b.cylinder(w-.30,.625,.43,.025,.045,0);});
  b.part('背架双柱、水电插盒和中央状态槽',()=>{for(const x of[.03,w-.11])b.post(x,.88,d-.10,.08,h-.88,false);b.b(.07,1.10,d-.085,w-.14,.24,.045,b.s.metal);for(const x of[.14,.28,w-.39,w-.25])sockets(b,x,1.155,d-.12);b.b(.50,1.17,d-.12,w-1,.13,.035,b.s.trim);b.b(.52,1.195,d-.13,w-1.04,.07,.015,b.s.energy);for(const x of[.12,w-.42]){b.cylinder(x,.905,.67,.022,.045,b.s.bronze);b.cylinder(x,.95,.67,.012,.13,b.s.trim);b.b(x-.035,1.05,.655,.07,.015,.03,b.s.bronze);}tap(b,w-.24,.91,.61);});
 },{limits:'台面、抽屉和洗槽有真实结构；显微镜、样品瓶等另用母版放置。水电端口仅是模型安装语义，无管流、化学实验、供电仿真或抽屉动画。'});

 add(113,[.98,1.03,.69],'实验仪器：倒阶壳体、内退工作腔、斜观察罩、样台、右操作柱与贯通通风栅',(b,w,h,d)=>{
  b.part('底框、石脚、倒阶左右壳体及后背板',()=>{for(const x of[.01,w-.095])for(const z of[.03,d-.11])b.b(x,0,z,.085,.055,.08,b.s.enamel);b.b(0,.04,.01,w,.11,d-.02,b.s.metal);b.rounded(0,.15,.04,.25,.58,d-.07,.045,b.s.enamel);b.rounded(w-.24,.15,.045,.24,h-.16,d-.08,.05,b.s.enamel);b.b(.22,.15,d-.085,w-.43,h-.22,.055,b.s.enamel);b.b(.19,h-.125,.36,w-.38,.105,d-.38,b.s.enamel);});
  b.part('凹腔底盘、样台、行程导向和检修间缝',()=>{b.b(.23,.22,.115,w-.46,.035,d-.20,b.s.metal);b.b(.27,.255,.24,w-.54,.015,.31,b.s.trim);b.b(.27,.27,.29,w-.54,.025,.19,b.s.trim);for(const z of[.29,.45])b.b(.28,.27,z,w-.55,.025,.025,b.s.bronze);b.b(.43,.29,.325,.16,.045,.12,b.s.enamel);b.b(.485,.335,.365,.05,.055,.045,b.s.ceramicWhite);for(const x of[.02,w-.07])b.b(x,.15,.045,.05,.02,d-.08,b.s.trim);});
  b.part('分格透明斜罩、实心压边、转轴座与开启拉手',()=>{const x=.25,ww=w-.50;for(let k=0;k<45;k++){const y=.30+k*.012,z=.105+k*.0055;b.b(x,y,z,ww,.018,.015,b.s.glass);for(const xx of[x,x+ww-.02])b.b(xx,y,z-.008,.02,.018,.03,b.s.trim);}for(const[y,z]of[[.30,.105],[.83,.345]])b.b(x,y,z-.005,ww,.025,.025,b.s.trim);grip(b,.405,.335,.075,.19,.035);for(const xx of[.22,w-.27]){b.b(xx,.82,.33,.05,.065,.075,b.s.metal);b.b(xx+.01,.835,.32,.03,.025,.02,b.s.bronze);}});
  b.part('侧壳真孔、顶模块、竖向灯框与双控键',()=>{frame(b,-.005,.26,.16,.035,.34,.30,.025,b.s.metal);for(let y=.295;y<.56;y+=.045)b.b(-.01,y,.195,.28,.02,.23,0);b.b(.05,.70,.26,.15,.11,.19,b.s.metal);b.b(.065,.795,.275,.12,.025,.16,b.s.trim);b.b(w-.18,.46,.025,.105,.36,.065,b.s.metal);frame(b,w-.165,.49,.015,.075,.29,.025,.015,b.s.bronze);b.b(w-.145,.515,.012,.035,.24,.015,b.s.warm);for(const x of[.07,w-.17]){b.b(x,.19,-.005,.085,.11,.06,b.s.metal);b.b(x+.015,.215,-.015,.055,.06,.02,b.s.energy);}b.b(.25,.145,.075,w-.50,.085,.08,b.s.trim);b.b(.26,.17,.055,w-.52,.02,.04,b.s.warm);});
 },{limits:'工作腔真实为空，观察罩是静态斜放的透明格子；没有罩盖转轴动画、实验反应或内部精密测量机构。示意样台不代表正在实验。'});

 add(114,[.43,.61,.47],'显微镜精修：分层机壳、双目发光镜芯、导轨滑座、转换物镜、透孔载物台与锁固底座',(b,w,h,d)=>{
  b.part('分层底框、嵌装面板、四角黑金脚套和前检修槽',()=>{
   b.rounded(0,0,0,w,.055,d,.025,b.s.metal);b.rounded(.025,.055,.025,w-.05,.025,d-.05,.015,b.s.enamel);
   for(const x of[0,w-.08])for(const z of[0,d-.08]){b.b(x,0,z,.08,.045,.08,b.s.metal);b.b(x+.01,.045,z+.01,.06,.02,.06,b.s.trim);b.b(x+.015,.05,z-.005,.04,.035,.015,b.s.bronze);b.b(x+.025,.08,z-.005,.02,.005,.01,b.s.trim);}
   b.b(.085,.015,-.005,w-.17,.025,.015,b.s.trim);b.b(.11,.02,-.01,w-.22,.015,.01,b.s.metal);b.b(.12,.025,-.015,.085,.005,.01,b.s.opticsGlow);
   for(const x of[.09,w-.10])b.b(x,.025,-.005,.01,.01,.005,b.s.bronze);
  });
  b.part('后立柱涂装壳、前导轨、滑座、刻度与承台连臂',()=>{
   b.rounded(.295,.08,.31,.095,.405,.125,.02,b.s.enamel);b.b(.255,.11,.27,.045,.34,.125,b.s.metal);
   for(const x of[.247,.285])b.b(x,.115,.257,.013,.325,.018,b.s.trim);
   b.b(.237,.265,.245,.07,.05,.12,b.s.trim);for(const x of[.247,.287])for(const y of[.277,.300])b.b(x,y,.237,.009,.009,.01,b.s.bronze);
   for(let y=.135;y<.25;y+=.02)b.b(.282,y,.252,.01,.005,.01,b.s.bronze);
   b.b(.257,.18,.255,.022,.05,.008,b.s.screen);b.b(.262,.188,.25,.01,.015,.01,b.s.opticsGlow);
   b.b(.375,.115,.33,.01,.18,.085,b.s.metal);b.b(.38,.13,.34,.005,.15,.065,b.s.enamel);
   for(const y of[.12,.28])for(const z of[.335,.40])b.b(.385,y,z,.005,.008,.008,b.s.bronze);
  });
  b.part('双侧调焦轴、金属法兰、铜套和分齿防滑旋钮',()=>{
   for(const y of[.20,.385]){
    cylinderX(b,.22,y,.37,.022,.19,b.s.trim);cylinderX(b,.39,y,.37,.047,.018,b.s.metal);cylinderX(b,.407,y,.37,.038,.012,b.s.bronze);cylinderX(b,.418,y,.37,.034,.017,b.s.metal);cylinderX(b,.43,y,.37,.026,.009,b.s.trim);
    cylinderX(b,.215,y,.37,.031,.02,b.s.metal);cylinderX(b,.207,y,.37,.024,.01,b.s.bronze);
    for(let j=0;j<12;j++){const a=j*Math.PI/6;b.b(.421,y+Math.cos(a)*.031-.005,.37+Math.sin(a)*.031-.005,.012,.01,.01,b.s.trim);}
   }
  });
  b.part('载物台凹框、贯通光孔、玻璃载片与双夹片',()=>{
   b.b(.04,.285,.075,.315,.025,.275,b.s.metal);b.b(.055,.31,.09,.285,.015,.245,b.s.trim);
   b.b(.075,.32,.108,.245,.01,.205,b.s.metal);b.cylinder(.20,.27,.17,.035,.065,0);
   frame(b,.05,.289,.068,.295,.028,.012,.006,b.s.trim);for(const x of[.06,.32])b.b(x,.317,.075,.015,.012,.015,b.s.bronze);
   b.b(.14,.33,.12,.12,.005,.10,b.s.glass);b.b(.16,.335,.135,.08,.005,.07,b.s.opticsGlow);b.b(.18,.34,.15,.04,.005,.04,b.s.lightCore);
   for(const x of[.12,.265]){b.b(x,.325,.12,.012,.01,.10,b.s.bronze);b.b(x,.325,.13,.02,.008,.015,b.s.trim);}
   b.b(.065,.328,.302,.26,.007,.012,b.s.trim);for(const x of[.10,.23])b.b(x,.33,.299,.04,.008,.02,b.s.bronze);
  });
  b.part('下聚光器、独立暖光投射座和分层压环',()=>{
   b.rounded(.135,.08,.105,.13,.02,.13,.01,b.s.metal);b.cylinder(.20,.10,.17,.055,.022,b.s.metal);b.cylinder(.20,.122,.17,.045,.012,b.s.bronze);b.cylinder(.20,.134,.17,.033,.007,b.s.warm);b.cylinder(.20,.141,.17,.022,.005,b.s.lightCore);
   b.cylinder(.20,.205,.17,.037,.08,b.s.metal,.018);b.cylinder(.20,.205,.17,.043,.01,b.s.trim,.018);b.cylinder(.20,.26,.17,.042,.015,b.s.bronze,.018);b.beam([.226,.275,.17],[.30,.275,.17],.018,b.s.metal);
  });
  b.part('分件机头、黑色密封带、物镜转换盘与三根套筒',()=>{
   b.beam([.34,.455,.36],[.22,.49,.255],.065,b.s.enamel);b.rounded(.105,.42,.16,.22,.075,.205,.025,b.s.enamel);
   b.b(.108,.455,.163,.214,.012,.199,b.s.metal);b.rounded(.115,.467,.17,.20,.10,.185,.025,b.s.enamel);
   for(const x of[.125,.29])for(const y of[.44,.49])b.b(x,y,.157,.012,.012,.025,b.s.trim);
   b.cylinder(.20,.405,.17,.066,.037,b.s.metal);b.cylinder(.20,.408,.17,.067,.01,b.s.bronze);b.cylinder(.20,.435,.17,.05,.02,b.s.trim);
   for(const [x,z,bottom,rr]of[[.20,.17,.36,.021],[.155,.205,.378,.016],[.24,.205,.385,.016]]){
    b.cylinder(x,bottom,z,rr,.419-bottom,b.s.metal);b.cylinder(x,bottom+.009,z,rr+.003,.014,b.s.trim);b.cylinder(x,bottom,z,rr,.009,b.s.bronze);b.cylinder(x,bottom-.004,z,rr-.006,.005,b.s.glass);
   }
  });
  b.part('双目斜筒、内缩眼罩、独立青色镜芯与前玻璃',()=>{
   for(const x of[.11,.25]){
    b.beam([x,.51,.19],[x,.495,.075],.055,b.s.metal);
    for(let k=0;k<14;k++)b.b(x-.037,.45+k*.003,.025+k*.006,.074,.067,.009,b.s.metal);
    b.b(x-.044,.447,.009,.088,.076,.025,b.s.trim);b.b(x-.037,.454,-.004,.074,.062,.02,b.s.metal);
    b.cylinder(x,.485,-.012,.030,.02,b.s.trim,.024,'z');b.cylinder(x,.485,-.015,.024,.012,b.s.opticsGlow,0,'z');b.cylinder(x,.485,-.020,.012,.006,b.s.lightCore,0,'z');b.cylinder(x,.485,-.025,.025,.005,b.s.glass,0,'z');
    for(const xx of[x-.036,x+.028])for(const yy of[.455,.508])b.b(xx,yy,0,.008,.008,.01,b.s.bronze);
   }
  });
  b.part('机头状态屏、仪器涂装分板、后立筒与顶调节钮',()=>{
   b.b(.166,.511,.146,.085,.042,.04,b.s.metal);b.b(.176,.520,.140,.065,.026,.008,b.s.screen);for(let k=0;k<4;k++)b.b(.183+k*.012,.527,.135,.006,.006+(k%2)*.006,.006,b.s.displayGlyph);
   b.b(.302,.49,.22,.008,.042,.075,b.s.trim);b.b(.307,.497,.227,.005,.028,.06,b.s.enamel);for(const z of[.23,.28])b.b(.31,.50,z,.005,.007,.007,b.s.bronze);
   b.cylinder(.33,.445,.405,.032,.14,b.s.metal);for(const y of[.46,.58])b.cylinder(.33,y,.405,.038,.015,b.s.trim);for(let j=0;j<8;j++){const a=j*Math.PI/4;b.b(.33+Math.cos(a)*.029-.004,.473,.405+Math.sin(a)*.029-.004,.008,.09,.008,b.s.trim);}b.cylinder(.33,.595,.405,.026,.01,b.s.metal);
   b.cylinder(.105,.515,.27,.015,.058,b.s.metal);b.cylinder(.105,.565,.27,.026,.023,b.s.trim);b.cylinder(.105,.584,.27,.020,.01,b.s.metal);
  });
 },{pitch:.005,limits:'5mm 静态观察设备精修；外壳涂装、结构金属、光学玻璃、屏底、青色显示层和高亮芯使用不同材质角色。载物台孔真实贯通，透明载片位于其上方；没有实际显微成像、倍率或调焦动画。'});

 add(115,[.45,.30,.31],'研究容器：敞口量杯、两只带颈瓶、培养皿、厚唇圈、指孔把手及刻度格',(b,w,h,d)=>{
  b.part('厚底敞口量杯、玻璃壁和双金属口沿',()=>{const x=.115,z=.16;b.cylinder(x,0,z,.09,.02,b.s.trim);b.cylinder(x,.02,z,.086,.25,b.s.glass,.076);for(const y of[.02,.26])b.cylinder(x,y,z,.092,.015,b.s.trim,.076);b.cylinder(x,.03,z,.076,.01,b.s.glass);for(let i=0;i<6;i++)b.b(.105,.06+i*.032,.078,.02+(i%2)*.015,.005,.01,b.s.printedMark);});
  b.part('量杯方把、双连接耳、真实指孔及销钉',()=>{for(const y of[.055,.22])b.b(-.01,y,.125,.055,.02,.035,b.s.trim);frame(b,-.055,.055,.125,.065,.185,.035,.015,b.s.metal);for(const y of[.06,.215])b.b(-.025,y,.12,.02,.01,.01,b.s.bronze);});
  b.part('双层收肩的两只样品瓶、细颈和盖筋',()=>{for(const[cx,cz,r,hh,mat]of[[.285,.23,.055,.22,b.s.polymer],[.395,.23,.045,.15,b.s.bronze]]){b.cylinder(cx,0,cz,r,.01,b.s.glass);b.cylinder(cx,.01,cz,r,hh-.055,b.s.glass,r-.01);for(let k=0;k<=6;k++){const rr=r-(r-.024)*k/6;b.cylinder(cx,hh-.055+k*.005,cz,rr,.01,b.s.glass,Math.max(.01,rr-.012));}b.cylinder(cx,hh-.025,cz,.021,.035,b.s.glass,.01);b.cylinder(cx,hh,cz,.027,.018,mat);for(let j=0;j<8;j++){const a=j*Math.PI/4;b.b(cx+Math.cos(a)*.023-.004,hh+.002,cz+Math.sin(a)*.023-.004,.008,.016,.008,b.s.trim);}for(let k=0;k<3;k++)b.b(cx-.008,.04+k*.03,cz-r,.02,.005,.008,b.s.printedMark);}});
  b.part('独立培养皿、内凹底与双边沿',()=>{b.cylinder(.33,0,.07,.068,.01,b.s.glass);b.cylinder(.33,.01,.07,.068,.022,b.s.glass,.056);b.cylinder(.33,.03,.07,.071,.008,b.s.trim,.056);});
 },{pitch:.005,expectedComponents:4,limits:'四件有意分离的静态容器构成一个清单套件，未另算四个基础资产。量杯、样品瓶和皿内保持空腔；刻度只作几何示意，不是可用于计量的刻度，也无流体或开盖动画。'});

 add(116,[1.12,1.78,.50],'科研柜：四柱攒边、上层双玻璃门、三层资料格、四抽屉、底柜与铜拉手',(b,w,h,d)=>{
  b.part('四柱、五道承板、顶框和薄背板',()=>{for(const x of[.015,w-.095])for(const z of[.03,d-.11])b.post(x,0,z,.08,h);for(const y of[.12,.68,1.03,1.36,h-.08])b.b(.06,y,.055,w-.12,.035,d-.12,b.s.wood);b.b(.06,.15,d-.075,w-.12,h-.22,.025,b.s.wood);b.b(w/2-.018,.72,.06,.036,h-.82,d-.14,b.s.wood);});
  b.part('下四抽、右嵌芯门、上下锁固横枋',()=>{for(const x of[.095,.405])for(const y of[.18,.41])hollowDrawer(b,x,y,.075,.275,.20,d-.17);for(const x of[.38,.70])b.b(x,.155,.07,.025,.525,d-.12,b.s.wood);for(const y of[.155,.385])b.b(.08,y,.075,.65,.025,d-.17,b.s.wood);b.inset(.745,.18,.055,.275,.43,.03,b.s.wall,true);for(const y of[.24,.51])b.b(.705,y,.035,.075,.045,.08,b.s.metal);grip(b,.775,.29,.015,.03,.17);for(const y of[.64,h-.11])b.b(.03,y,.02,w-.06,.07,.075,b.s.woodEdge);});
  b.part('双玻璃门、分离压条与铜铰链',()=>{for(const x of[.105,w/2+.015]){const ww=w/2-.125;frame(b,x,.735,.04,ww,h-.895,.035,.028,b.s.wood);b.b(x+.03,.765,.052,ww-.06,h-.955,.015,b.s.glass);for(const y of[.84,1.49])pin(b,x-.012,y,.005,.04);grip(b,x+ww-.065,1.12,-.005,.025,.15);}});
  b.part('资料夹脊、内缩书页、标签凹面及留空格',()=>{for(const y of[.715,1.065,1.395])for(let k=0;k<5;k++){const x=.135+k*.165,hh=.22+(k%2)*.045,m=k%2?b.s.fabricEdge:b.s.woodEdge;b.b(x,y,.16,.10,hh,.22,m);b.b(x+.012,y+.01,.18,.077,hh-.025,.19,b.s.paperSheet);b.b(x+.025,y+.05,.15,.045,.035,.015,b.s.paperSheet);b.b(x+.033,y+.08,.145,.03,.05,.01,b.s.bronze);}});
 },{limits:'资料夹为静态内部示意；柜体、搁板、玻璃门、拉手可按部件选区编辑，没有开合动画、可读文档或科研库存逻辑。'});

 add(117,[1.68,1.42,.80],'能源调度台：三屏分层座、分格键帽、双柜空腔、主控轮、木构框脚和后侧线槽',(b,w,h,d)=>{
  b.part('木构主架、横枨、左右柜壳和石脚',()=>{b.table(w,.83,d);for(const x of[.085,.415,w-.45,w-.12])b.b(x,.12,.10,.025,.64,d-.20,b.s.wood);for(const x of[.085,w-.45]){b.b(x,.14,.10,.365,.025,d-.20,b.s.wood);b.b(x,.14,d-.12,.365,.60,.025,b.s.wood);}b.b(.09,.58,d-.11,w-.18,.11,.03,b.s.wood);});
  b.part('左通风柜门、右三抽屉和后穿线槽',()=>{b.inset(.11,.20,.05,.29,.51,.04,b.s.wall);for(let y=.27;y<.61;y+=.055)b.b(.14,y,.045,.23,.025,.055,0);for(const y of[.19,.37,.55])hollowDrawer(b,w-.415,y,.075,.30,.15,.56);b.b(.50,.815,d-.20,w-1,.055,.04,0);});
  b.part('中大屏与双侧屏、升降座及空臂架',()=>{for(const x of[.62,1.0]){b.b(x,.83,.50,.065,.15,.11,b.s.metal);b.b(x-.055,.83,.44,.17,.025,.22,b.s.trim);}screen(b,.475,.99,.52,.73,.385);for(const x of[.035,w-.385]){b.b(x+.10,.83,.43,.07,.085,.14,b.s.metal);screen(b,x,.935,.44,.35,.28);}});
  b.part('独立按键、触控斜托、控制轮与接口槽',()=>{b.b(.54,.83,.15,.66,.022,.22,b.s.metal);for(let r=0;r<4;r++)for(let k=0;k<12;k++)b.b(.56+k*.05,.852,.17+r*.04,.035,.008,.02,r%3===0?b.s.polymer:b.s.trim);for(const x of[.12,w-.32]){b.b(x,.83,.19,.20,.045,.16,b.s.polymer);b.b(x+.02,.875,.21,.16,.01,.11,b.s.screen);b.b(x+.035,.885,.23,.13,.005,.045,b.s.displayGlyph);}b.cylinder(.42,.83,.25,.033,.04,b.s.bronze);b.cylinder(.42,.87,.25,.023,.01,b.s.trim);});
  b.part('供能路径图、状态格与分区背部散热鳍',()=>{const z=.512,cx=.69,cy=1.20;for(let j=0;j<24;j++){const a=j*Math.PI/12,n=(j+1)*Math.PI/12;b.beam([cx+Math.cos(a)*.095,cy+Math.sin(a)*.095,z],[cx+Math.cos(n)*.095,cy+Math.sin(n)*.095,z],.01,b.s.displayGlyph);}b.beam([cx-.12,cy,z],[cx+.12,cy,z],.01,b.s.displayGlyph);b.beam([cx,cy-.12,z],[cx,cy+.12,z],.01,b.s.displayGlyph);for(let k=0;k<6;k++)b.b(.91+k*.032,1.055,z-.005,.02,.04+(k%3)*.035,.015,b.s.displayGlyph);for(const x of[.085,w-.335])for(let k=0;k<4;k++){b.b(x,.99+k*.04,.42,.025,.02,.025,b.s.displayGlyph);b.b(x+.05,1.00+k*.04,.42,.15,.01,.025,b.s.displayGlyph);}for(const x of[.53,.65,.77,.89,1.01])b.b(x,1.055,.575,.025,.245,.03,b.s.trim);});
 },{limits:'独立控制台，操作椅复用其他母版；主屏路径与侧屏标记均为静态可编辑色格，没有实时能源调度、键盘交互或显示器转轴动画。'});

 add(118,[.78,1.86,.68],'通信机柜：内外双框、八个抽拉设备层、真通风孔、线缆槽、侧立管和石脚',(b,w,h,d)=>{
  b.part('四根结构柱、石脚、顶部横梁与双侧壳',()=>{for(const x of[0,w-.09])for(const z of[.02,d-.11]){b.post(x,0,z,.09,h);for(const y of[.08,h-.105])b.b(x-.01,y,z-.01,.11,.06,.11,b.s.wall);}for(const y of[.12,h-.075])b.b(.06,y,.055,w-.12,.035,d-.12,b.s.metal);for(const x of[.055,w-.08])b.b(x,.16,.10,.025,h-.25,d-.20,b.s.metal);});
  b.part('八个设备底托、前板、凹拉柄与逐层状态槽',()=>{for(const x of[.075,w-.12])b.b(x,.16,.065,.045,h-.28,.045,b.s.metal);for(let k=0;k<8;k++){const y=.20+k*.19;b.b(.10,y,.075,w-.20,.025,d-.14,b.s.trim);b.b(.10,y+.025,d-.105,w-.20,.105,.025,b.s.metal);b.b(.10,y+.025,.05,w-.20,.105,.05,b.s.trim);for(const x of[.105,w-.135])grip(b,x,y+.04,.005,.025,.065);for(let j=0;j<4;j++)b.b(.17+j*.075,y+.045,.045,.045,.05,.04,0);b.b(.16,y+.095,.035,.29,.01,.02,b.s.energy);for(const x of[w-.225,w-.185])b.b(x,y+.055,.035,.02,.025,.02,b.s.bronze);}});
  b.part('左右贯通百叶、顶网与背部竖向线槽',()=>{for(const x of[.05,w-.085])for(let y=.25;y<h-.22;y+=.075)b.b(x-.01,y,.18,.055,.025,d-.35,0);for(let x=.13;x<w-.13;x+=.07)b.b(x,h-.07,.11,.025,.06,d-.24,0);b.b(.12,.17,d-.085,w-.24,h-.29,.03,b.s.metal);b.b(w-.22,.17,d-.055,.12,h-.31,.05,b.s.trim);b.b(w-.205,.20,d-.04,.08,h-.37,.04,0);});
  b.part('双侧冷却立管、抱箍、侧检修口和青色引导条',()=>{for(const z of[.17,.29]){b.cylinder(.025,.18,z,.018,.67,b.s.trim);for(const y of[.24,.70])b.b(-.005,y,z-.025,.09,.025,.05,b.s.metal);b.b(.01,.34,z-.025,.02,.22,.015,b.s.bronze);}for(const x of[.01,w-.04]){b.b(x,.30,.005,.03,1.2,.04,b.s.wood);b.b(x+.01,.36,-.005,.01,1.08,.015,b.s.warm);}b.b(.10,1.74,.06,w-.20,.035,.025,b.s.energy);});
 },{limits:'设备层、散热孔和线槽为静态体素；状态格不是运行中的服务器。没有网络、散热模拟、抽屉运动或现有游戏数据机房运行状态绑定。'});

 add(119,[.48,.15,.34],'器械盘：倾斜口沿、空把手、底足、剪刀指环、钳镊及带颈瓶',(b,w,h,d)=>{
  b.part('耐洗托盘、阶梯斜边和四个短足',()=>{b.rounded(.015,.025,.015,w-.03,.02,d-.03,.015,b.s.trim);for(let k=0;k<5;k++)rim(b,.02-k*.003,.045+k*.01,.02-k*.003,w-.04+k*.006,.01,d-.04+k*.006,.01,b.s.enamel);for(const x of[.025,w-.06])for(const z of[.025,d-.06])b.b(x,0,z,.035,.03,.035,b.s.metal);});
  b.part('双侧提耳和四角锁块',()=>{for(const x of[-.012,w-.003]){b.b(x,.07,.09,.015,.07,.16,b.s.metal);b.b(x-.005,.09,.11,.025,.035,.12,0);b.b(x<0?0:w-.02,.07,.09,.025,.025,.02,b.s.metal);b.b(x<0?0:w-.02,.07,.23,.025,.025,.02,b.s.metal);}for(const x of[.005,w-.03])for(const z of[.005,d-.03])b.b(x,.045,z,.025,.045,.025,b.s.bronze);});
  b.part('剪刀空指环、交叉钳口及独立镊片',()=>{for(const x of[.095,.145])b.cylinder(x,.045,.095,.021,.01,b.s.metal,.014);b.beam([.10,.05,.112],[.145,.05,.265],.009,b.s.trim);b.beam([.145,.05,.112],[.10,.05,.265],.009,b.s.trim);b.cylinder(.122,.052,.18,.01,.008,b.s.bronze);for(const x of[.245,.29]){b.beam([x,.045,.075],[x-.015,.045,.26],.007,b.s.trim);b.beam([x,.045,.075],[x+.015,.045,.26],.007,b.s.trim);}b.beam([.35,.05,.095],[.35,.05,.28],.012,b.s.trim);b.b(.343,.052,.07,.015,.012,.065,b.s.metal);});
  b.part('小瓶、密封圈与独立空白标签块',()=>{b.cylinder(.40,.045,.12,.025,.065,b.s.glass,.018);b.cylinder(.40,.105,.12,.025,.01,b.s.glass,.01);b.cylinder(.40,.11,.12,.018,.02,b.s.glass,.01);b.cylinder(.40,.13,.12,.02,.015,b.s.bronze);b.b(.325,.045,.21,.09,.055,.075,b.s.enamel);b.b(.345,.10,.23,.05,.005,.035,b.s.screen);});
 },{pitch:.005,limits:'器械与托盘组成一个静态陈列套件，指环及提耳为空；不是可操作医疗器械。没有消毒、诊疗交互、软体接触或剪钳开合动画。'});

 add(120,[1.48,.65,.10],'病床护栏：双端帽、三块分离玻璃芯、上下扶梁、下夹座与静态锁扣',(b,w,h,d)=>{
  b.part('上下扶梁、四根支柱和阶梯柱帽',()=>{for(const y of[.05,h-.07])b.b(.02,y,.025,w-.04,.045,.05,b.s.enamel);for(const x of[.02,.49,.96,w-.065]){b.b(x,.055,.025,.045,h-.065,.05,b.s.metal);b.b(x-.01,h-.075,.015,.065,.05,.07,b.s.metal);b.b(x,h-.025,.025,.045,.025,.05,b.s.bronze);}});
  b.part('三个独立压框和内退透明面板',()=>{for(const x of[.09,.56,1.03]){const ww=x>1?.34:.37;frame(b,x,.13,.02,ww,.40,.04,.015,b.s.trim);b.b(x+.02,.15,.035,ww-.04,.36,.01,b.s.glass);for(const y of[.13,.495]){b.b(x-.04,y,.025,.06,.035,.06,b.s.metal);b.b(x+ww-.02,y,.025,.075,.035,.06,b.s.metal);}for(const xx of[x-.015,x+ww-.02])for(const y of[.115,.50])pin(b,xx,y,.005,.035);}});
  b.part('两组床框夹座、真实夹口及端部解锁柄',()=>{for(const x of[.06,w-.14]){b.b(x-.025,-.08,0,.10,.15,.10,b.s.metal);b.b(x-.015,-.035,-.005,.08,.045,.07,0);b.b(x,-.065,-.01,.025,.025,.02,b.s.bronze);}b.b(.04,.17,-.025,.04,.20,.07,b.s.metal);b.b(.045,.31,-.04,.03,.055,.025,b.s.trim);});
 },{mount:'insert',limits:'护栏保留床架夹口；底部夹座位于局部 Y=-0.08m。面板可分选但没有升降、折叠或解锁动画，也未实现病床安全联锁。'});

 add(121,[1.38,.52,.22],'病床医疗面板：分区插盒、凹接口、呼叫键、后墙座、设备挂轨、空篮与挂瓶',(b,w,h,d)=>{
  b.part('双墙座、分层主壳与两道压梁',()=>{for(const x of[.08,w-.16])b.b(x,.22,.13,.08,.26,.075,b.s.metal);b.b(0,.24,.055,w,.28,.08,b.s.enamel);for(const y of[.23,.49])b.b(0,y,.035,w,.035,.115,b.s.woodEdge);for(const x of[0,w-.07]){b.b(x,.21,.025,.07,.32,.13,b.s.metal);b.b(x+.015,.485,.01,.04,.04,.025,b.s.bronze);}});
  b.part('双插座、呼叫钮、内退显示框与气口孔',()=>{for(const x of[.13,.29])sockets(b,x,.32,.035);b.b(.46,.32,.015,.105,.13,.065,b.s.enamel);b.cylinder(.512,.385,0,.028,.025,b.s.signalRed,0,'z');b.b(.64,.33,.025,.30,.115,.055,b.s.metal);b.b(.66,.35,.015,.26,.075,.015,b.s.screen);for(const x of[.69,.78,.86])b.b(x,.38,.01,.04,.02,.01,b.s.displayGlyph);for(const x of[1.03,1.21]){b.cylinder(x,.395,.025,.039,.035,b.s.trim,0,'z');b.cylinder(x,.395,.015,.026,.015,b.s.glass,.013,'z');b.cylinder(x,.395,0,.013,.09,0,0,'z');}b.b(1.29,.33,.025,.025,.055,.02,b.s.energy);});
  b.part('下挂轨、六个挂点、镂空器具篮与套管',()=>{for(const x of[.16,w-.22])b.b(x,.17,.035,.035,.10,.07,b.s.trim);b.b(.14,.175,.015,w-.28,.025,.025,b.s.trim);for(let x=.20;x<w-.20;x+=.16)b.b(x,.15,.005,.015,.06,.04,b.s.bronze);b.b(.18,.035,-.13,.29,.015,.16,b.s.trim);for(const x of[.18,.26,.35,.45])for(const z of[-.13,.015])b.b(x,.05,z,.012,.10,.012,b.s.trim);for(const y of[.05,.12])rim(b,.18,y,-.13,.29,.012,.16,.012,b.s.trim);for(const x of[.22,.42])b.b(x,.13,.01,.015,.055,.025,b.s.metal);});
  b.part('挂瓶、双箍、悬吊连接管和阀头',()=>{const x=1.18,z=-.03;b.cylinder(x,.035,z,.05,.10,b.s.glass,.038);for(const y of[.035,.12])b.cylinder(x,y,z,.053,.018,b.s.trim,.034);b.cylinder(x,.125,z,.05,.015,b.s.trim,.018);b.cylinder(x,.135,z,.025,.025,b.s.enamel);b.cylinder(x,.16,z,.012,.055,b.s.trim);b.beam([x,.21,z],[1.21,.30,.02],.015,b.s.trim);b.b(1.20,.27,0,.025,.10,.035,b.s.metal);});
 },{mount:'wall',limits:'各区域仅表达壳体、挂架与孔位，没有呼叫、医用气体或供电功能。显示区不包含真实患者信息；挂瓶没有流体及阀门动画。'});

 add(122,[1.76,1.84,2.32],'扫描舱：贯通圆环、内退光带、分层外壳、后检修格、承床导轨与独立推送台',(b,w,h,d)=>{
  const cx=w/2,cy=1.0,z=1.68;
  b.part('双侧结构脚、阶梯底框与环形厚壳',()=>{for(const x of[.02,w-.20])b.b(x,0,z,.18,.18,.60,b.s.stone);b.b(.08,.08,z,w-.16,.13,.62,b.s.metal);b.cylinder(cx,cy,z,.81,.52,b.s.enamel,.56,'z');b.cylinder(cx,cy,z-.025,.70,.035,b.s.recess,.56,'z');for(const x of[.06,w-.18])b.b(x,.18,z+.22,.12,1.33,.28,b.s.metal);});
  b.part('内环、分段光芯、外端帽与检修轮廓',()=>{b.cylinder(cx,cy,z-.055,.595,.04,b.s.trim,.55,'z');b.cylinder(cx,cy,z-.065,.57,.025,b.s.warm,.55,'z');for(let k=0;k<12;k++){const a=k*Math.PI/6,x=cx+Math.cos(a)*.57,y=cy+Math.sin(a)*.57;b.b(x-.02,y-.02,z-.085,.04,.04,.06,b.s.trim);}for(const x of[.04,w-.16])for(const y of[.18,1.45]){b.b(x,y,z-.025,.12,.12,.12,b.s.metal);b.b(x+.025,y+.04,z-.045,.07,.06,.06,b.s.bronze);if(y>1)b.b(x+.02,y,z+.06,.08,.07,.47,b.s.metal);}b.b(cx-.18,1.66,z-.04,.36,.07,.05,b.s.trim);b.b(cx-.13,1.68,z-.055,.26,.02,.02,b.s.energy);});
  b.part('床板支承、导轨、长承台与薄垫边',()=>{b.b(cx-.34,0,.02,.68,.10,1.98,b.s.metal);for(const x of[cx-.29,cx+.24])b.b(x,.10,.08,.05,.045,1.92,b.s.trim);for(const zz of[.20,1.22]){b.b(cx-.30,.13,zz-.02,.60,.05,.30,b.s.trim);b.b(cx-.18,.14,zz,.36,.43,.22,b.s.metal);b.b(cx-.25,.52,zz-.04,.50,.06,.30,b.s.trim);}b.b(cx-.31,.58,.06,.62,.06,2.07,b.s.enamel);b.rounded(cx-.29,.64,.08,.58,.08,2.03,.035,b.s.fabricEdge);for(const x of[cx-.325,cx+.305])b.b(x,.60,.17,.02,.02,1.74,b.s.energy);for(const x of[cx-.31,cx+.21])b.b(x,0,.04,.10,.09,.09,b.s.bronze);});
  b.part('左右状态窗、后检修框与真正通风口',()=>{for(const x of[.035,w-.115]){b.b(x,.78,z-.07,.08,.28,.09,b.s.trim);b.b(x+.02,.82,z-.08,.04,.20,.025,b.s.energy);}b.b(.11,.39,z+.52,.21,.42,.07,b.s.trim);for(let y=.44;y<.78;y+=.07)b.b(.14,y,z+.49,.15,.025,.12,0);b.b(w-.35,.39,z+.52,.21,.42,.07,b.s.trim);for(let y=.44;y<.78;y+=.07)b.b(w-.32,y,z+.49,.15,.025,.12,0);});
 },{pitch:.02,limits:'使用 2cm 网格的静态检查设备，圆环和床面上方贯通；没有扫描成像、辐射、床板平移动画或临床仿真。小端件随格距阶梯化，不能以概念图尺寸替代真实设备规格。'});
}
