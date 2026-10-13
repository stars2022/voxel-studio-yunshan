import type {Asset,Project,V3} from '../core/types';
import type {SurfaceArtwork} from '../core/surface-artwork';
import {makeLifeAsset} from './life';
import {DetailBuilder} from './refinement-builder';
import {orthogonalDifference,type SolidBox} from './domestic-refinement-shapes';
import {roundLoft,rigidMesh} from './mesh-shapes';
import {sectionShell} from './kitchen-refinement-shapes';
import {artPanel,ellipsoid,leafBlade,fishBody,finPrism,scrollSheet,slopePlate} from './commerce-refinement-shapes';
export const commerceRefinementIds=[89,90,91,92,93,94,95,96,106,107,109,110].map(i=>'LIFE-'+String(i).padStart(3,'0'));
export function makeCommerceRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,p:Project):Asset{
 const b=new DetailBuilder(p,makeLifeAsset(catalogId,name,id,style),style),solid=(r:string)=>p.materials[b.role(r)].solid;
 const cut=(name:string,role:string,min:V3,size:V3,voids:SolidBox[])=>b.mesh(orthogonalDifference(name,b.role(role),[{min,size}],voids,solid(role)));
 const pin=(x:number,y:number,z:number,role='bronze')=>b.voxel(role,[x,y,z],[.010,.010,.010]);
 const corner=(x:number,y:number,z:number,w=.07,h=.08,d=.07)=>{b.box('连续钢抱角','metal',[x,y,z],[w,h,d],.004);for(const xx of[x+.006,x+w-.013])b.box('独立黄铜角边','bronze',[xx,y+.004,z-.003],[.007,h-.008,.012],.001);b.box('独立黄铜角帽','bronze',[x+.006,y+h-.012,z-.004],[w-.012,.011,.014],.001);pin(x+w*.4,y+h*.45,z-.005);};
 const frame=(name:string,role:string,x:number,y:number,z:number,w:number,h:number,t=.025,d=.025)=>{for(const xx of[x,x+w-t])b.box(name+'竖边',role,[xx,y,z],[t,h,d],.002);for(const yy of[y,y+h-t])b.box(name+'横边',role,[x,yy,z],[w,t,d],.002,0);};
 const rim=(name:string,role:string,min:V3,size:V3,t:number)=>{const[x,y,z]=min,[w,h,d]=size;for(const zz of[z,z+d-t])b.box(name+'长边',role,[x,y,zz],[w,h,t],.002,0);for(const xx of[x,x+w-t])b.box(name+'端边',role,[xx,y,z],[t,h,d],.002);};
 const pull=(x:number,y:number,z:number,w:number)=>{for(const xx of[x,x+w-.015])b.box('真实握杆支座','metal',[xx,y,z-.026],[.015,.020,.030],.002);b.box('独立铜握杆','bronze',[x,y,z-.033],[w,.019,.015],.002,0);};
 const display=(name:string,min:V3,size:V3,design:SurfaceArtwork['design']='control-v1',axis:'XY'|'XZ'='XY')=>b.mesh(artPanel(name,b.role('screen'),min,size,solid('screen'),design,{ground:b.role('screen'),motif:b.role('displayGlyph'),detail:b.role('displayWhite')},axis));
 const light=(x:number,y:number,z:number,h:number)=>{b.box('独立侧灯金属槽','metal',[x,y,z],[.030,h,.125],.002);b.box('原用途光学侧条','energy',[x+.008,y+.02,z-.004],[.014,h-.04,.012],.001);};
 const done=(features:string,scope:string,details:Record<string,unknown>={},reflectWidth?:number)=>{if(reflectWidth)b.reflectX(reflectWidth);const a=b.finish(features,{sheet:'M006',expectedContactGroups:1,scope,...details,...(reflectWidth?{referenceSideReflectionWidthM:reflectWidth}:{})});a.openings=[];return a;};
 if(catalogId==='LIFE-089'||catalogId==='LIFE-091'){
  const financial=catalogId==='LIFE-089',w=financial?1.02:.62,h=financial?1.52:1.46,d=financial?.56:.50;
  for(const x of[.012,w-.092])for(const z of[.042,d-.100]){b.box('独立石脚','stone',[x-.010,0,z-.010],[.100,.060,.100],.004);b.box('连续木框立柱','wood',[x,.046,z],[.080,z>.2?h-.056:.753,.080],.004);for(const y of[.075,.694])corner(x-.006,y,z-.006,.092,.087,.092);if(z>.2)corner(x-.006,h-.085,z-.006,.092,.085,.092);}
  b.box('实际木柜底','wood',[.049,.142,.057],[w-.098,.028,d-.115],.003,0);b.box('独立柜背','wood',[.065,.164,d-.093],[w-.130,.525,.026],.002);for(const x of[.063,w-.088])b.box('实际木柜侧壁','wood',[x,.164,.070],[.025,.525,d-.155],.002);
  for(const y of[.233,.590])b.box('检修门实际侧铰耳','metal',[.075,y,.049],[.054,.048,.065],.003);
  if(financial)b.box('通风机箱实际上联架','metal',[w-.295,.652,.053],[.233,.064,.078],.003,0);
  const doorW=financial?w-.37:w-.19;frame('检修门木攒框','woodEdge',.10,.194,.055,doorW,.453,.028,.030);b.box('真实浅石嵌芯','stone',[.124,.218,.062],[doorW-.048,.405,.023],.002);frame('检修门独立钢细压边','metal',.142,.237,.052,doorW-.084,.366,.009,.014);b.box('锁扣真实承面','metal',[.10+doorW*.49,.362,.032],[.046,.056,.038],.003);pin(.115+doorW*.49,.38,.029);
  if(financial){cut('真实前机箱通风盖','metal',[w-.280,.187,.052],[.174,.475,.030],Array.from({length:7},(_,j)=>({min:[w-.256,.219+j*.055,.038]as V3,size:[.126,.016,.060]as V3})));b.box('通风后机箱暗底','polymerDark',[w-.282,.195,.125],[.204,.462,.018],.003);light(w-.260,.652,.042,.041);}else pull(w-.154,.355,.052,.03);
  b.box('分层木操作台','woodEdge',[0,.727,0],[w,.046,d],.005,0);b.mesh(slopePlate('真实连续斜石操作面',b.role('stone'),.074,w-.074,.047,d-.090,.770,.809,.018,solid('stone')));
  const angle=-Math.atan(.039/(d-.137)),first=b.meshes.length;b.box('键盘钢托板','metal',[.135,.787,.073],[w-.270,.016,.153],.003,0);for(let row=0;row<3;row++)for(let col=0;col<(financial?13:7);col++)b.box('独立硬塑键帽','polymer',[.149+col*(w-.306)/(financial?13:7),.802,.094+row*.036],[(w-.35)/(financial?13:7),.012,.026],.002,0);b.box('独立空格键','polymerDark',[w*.36,.802,.076],[w*.28,.012,.013],.0015,0);display('实际输入状态贴图',[w*.30,.803,.208],[w*.40,.002,.044],'control-v1','XZ');for(let j=first;j<b.meshes.length;j++)b.meshes[j]=rigidMesh(b.meshes[j],[0,0,0],angle,0,[0,.788,.047]);
  b.box('卡槽独立金属承壳','metal',[w-.20,.807,d-.177],[.109,.017,.043],.002);cut('真实签收读取槽','polymerDark',[w-.193,.821,d-.170],[.095,.011,.029],[{min:[w-.181,.814,d-.156],size:[.072,.026,.005]}]);
  const sx=.118,sy=.924,sw=w-.236,sh=h-1.018,sz=d-.166;b.box('实际退层后机箱','metal',[sx-.002,sy+.012,sz+.039],[sw+.004,sh-.024,.059],.005);frame('木屏外攒框','wood',sx-.034,sy-.034,sz+.011,sw+.068,sh+.068,.035,.078);frame('深钢屏压框','metal',sx-.014,sy-.014,sz-.016,sw+.028,sh+.028,.019,.031);display('实际静态作者显示贴图',[sx+.001,sy+.001,sz-.005],[sw-.002,sh-.002,.019],financial?'finance-v1':'parcel-v1');
  b.box('浅石屏额枋','stone',[.082,h-.078,sz-.012],[w-.164,.037,.083],.004,0);for(const x of[.04,w-.07])light(x,.95,sz-.041,h-1.075);
  cut('真实屏后散热格','metal',[sx+.058,sy+.060,sz+.093],[sw-.116,sh-.116,.018],Array.from({length:6},(_,j)=>({min:[sx+.082,sy+.094+j*(sh-.168)/6,sz+.078]as V3,size:[sw-.164,.008,.05]as V3})));
  return done('连续木石终端框、真实倾斜输入面、独立键帽、空检修腔与真正显示贴图','one standalone terminal; author diagrams only, no transaction, scanning, signature, pricing or inventory binding',{},w);
 }
 if(catalogId==='LIFE-090'){
  const w=.98;for(const x of[.004,.908]){b.box('桌装屏真实浅石锁座','stone',[x-.028,0,0],[.123,.029,.20],.004);b.box('连续双木屏柱','wood',[x,.024,.044],[.068,.544,.071],.004);for(const y of[.048,.503])corner(x-.007,y,.033,.082,.077,.084);}
  b.box('桌装屏底木联梁','woodEdge',[.032,.071,.065],[.914,.046,.062],.003,0);frame('独立钢玻璃压框','metal',.077,.143,.079,.826,.371,.024,.035);b.box('实际透明玻璃屏','glass',[.101,.166,.092],[.778,.324,.010],.001);for(const x of[.108,.835])for(const y of[.177,.459]){b.box('玻璃屏显示角横画','displayGlyph',[x,y,.091],[.036,.002,.002],.0003);b.box('玻璃屏显示角竖画','displayGlyph',[x,y,.091],[.002,.027,.002],.0003);}
  cut('真实底传声槽钢承片','metal',[.119,.118,.061],[.717,.030,.060],Array.from({length:10},(_,j)=>({min:[.141+j*.066,.124,.05]as V3,size:[.044,.009,.081]as V3})));b.box('屏侧控制盒实际托架','metal',[.855,.257,.020],[.071,.083,.080],.003);display('屏侧作者身份框',[.862,.267,.013],[.054,.066,.012],'parcel-v1');b.box('屏后数据接口壳','polymerDark',[.741,.126,.118],[.099,.034,.038],.003);
  return done('独立桌装双柱屏、真实透明玻璃、深钢压框、十个贯通传声槽和侧控制框','screen master only; counter, drawers and other terminals remain independent, no refraction or banking interaction',{},w);
 }
 if(catalogId==='LIFE-092'){
  b.mesh(ellipsoid('真实连续粮堆食材芯',b.role('grain'),[.15,.026,.125],[.140,.034,.114],solid('grain'),24,12));
  for(let ix=0;ix<17;ix++)for(let iz=0;iz<14;iz++){const x=.020+ix*.016,z=.018+iz*.016,r=((x-.15)/.139)**2+((z-.125)/.114)**2;if(r>.92)continue;const y=.026+.034*Math.sqrt(1-r),a=(ix*1.91+iz*.73)%Math.PI,role=(ix*7+iz*11)%9===0?'grainPale':'grain',m=ellipsoid('实际沿堆面长谷粒',b.role(role),[x,y-.0015,z],[.0042,.0034,.0105],solid(role),10,6);for(let k=0;k<m.positions.length;k+=3){const xx=m.positions[k]-x,zz=m.positions[k+2]-z;m.positions[k]=x+xx*Math.cos(a)-zz*Math.sin(a);m.positions[k+2]=z+xx*Math.sin(a)+zz*Math.cos(a);const nx=m.normals[k],nz=m.normals[k+2];m.normals[k]=nx*Math.cos(a)-nz*Math.sin(a);m.normals[k+2]=nx*Math.sin(a)+nz*Math.cos(a);}b.mesh(m);}
  b.voxel('grain',[.145,.025,.120],[.005,.005,.010]);b.voxel('grainPale',[.145,.055,.120],[.005,.005,.005]);
  return done('连续低粮堆、按堆面贴合的独立长谷粒与食材深浅用途','one reusable grain pile; no rack, labels, commodity quantities, scatter physics or extra grain identities');
 }
 if(catalogId==='LIFE-093'){
  b.mesh(ellipsoid('实际白色食材根盘',b.role('vegetableStalk'),[.12,.027,.12],[.029,.027,.030],solid('vegetableStalk'),16,8));
  for(let j=0;j<10;j++){const a=j*Math.PI/5,rad=.049+(j%3)*.005,start:V3=[.12+Math.cos(a)*.016,.040,.12+Math.sin(a)*.016],mid:V3=[.12+Math.cos(a)*rad,.116,.12+Math.sin(a)*rad],end:V3=[.12+Math.cos(a)*(rad+.015),.253+(j%3)*.014,.12+Math.sin(a)*(rad+.015)];b.cylinder('独立白色菜梗','vegetableStalk',start,mid,.008,12);b.mesh(leafBlade('真实卷曲薄叶',b.role(j%2?'leafAlt':'leaf'),[mid[0],mid[1]-.020,mid[2]],end,.088,solid(j%2?'leafAlt':'leaf'),j));b.cylinder('主叶脉独立绿色用途','leafAlt',mid,end,.0022,10);}
  for(let j=0;j<3;j++){const a=j*Math.PI*2/3;b.mesh(leafBlade('独立嫩心叶',b.role('leafAlt'),[.12,.047,.12],[.12+Math.cos(a)*.015,.270,.12+Math.sin(a)*.015],.044,solid('leafAlt'),j+12));}b.voxel('vegetableStalk',[.115,.020,.115],[.010,.010,.010]);
  return done('真实连续曲叶与自然叶缝、十根白菜梗、独立嫩心与可见根盘','one standalone leafy vegetable, no display shelf or other vegetable types, no growth or wind binding');
 }
 if(catalogId==='LIFE-094'){
  for(const m of fishBody({body:b.role('fish'),back:b.role('fishBack'),pale:b.role('fishPale')},id=>p.materials[id].solid))b.mesh(m);
  b.mesh(finPrism('真实连续叉尾',b.role('fishBack'),[[.352,.069],[.423,.135],[.445,.137],[.411,.073],[.445,.009],[.423,.012],[.352,.064]],.071,.018,solid('fishBack')));b.mesh(finPrism('真实连续背鳍',b.role('fishBack'),[[.126,.107],[.178,.162],[.225,.132],[.280,.109]],.076,.007,solid('fishBack')));
  for(const z of[.023,.124])b.mesh(finPrism('独立胸鳍',b.role('fishBack'),[[.087,.066],[.171,.025],[.144,.063]],z,.010,solid('fishBack')));
  for(const[z,sign]of[[.034,-1],[.126,1]]){b.mesh(ellipsoid('真正侧眼食材浅圈',b.role('fishPale'),[.055,.083,z],[.011,.010,.006],solid('fishPale'),12,6));b.mesh(ellipsoid('独立黑色鱼眼食材',b.role('fishEye'),[.054,.084,z+sign*.0036],[.0065,.0065,.004],solid('fishEye'),12,6));}
  b.mesh(ellipsoid('真实口缘',b.role('fishEye'),[.015,.072,.080],[.006,.004,.012],solid('fishEye'),12,6));
  for(const sign of[-1,1])for(let j=0;j<5;j++){const yy=.045+j*.014,zz=.08+sign*(.052-Math.abs(yy-.075)*.46);b.member('实际短鳃纹','fishBack',[.092,yy,zz],[.102,yy+.009,zz+sign*.003],.002,.003,.0004);}
  for(let j=0;j<5;j++)b.member('真实叉尾鳍条','fish',[.360,.071,.079],[.427,.019+j*.026,.079],.0018,.020,.0003);b.voxel('fishBack',[.185,.110,.075],[.010,.005,.010]);
  return done('真实连续纺锤鱼体、独立背腹食材层、有限厚度叉尾与鳍、双侧鱼眼和鳃纹','static fish ingredient only; no ice stand, live-fish skeleton, swimming, cutting or cooking state');
 }
 if(catalogId==='LIFE-095'){
  const w=.62,d=.40;cut('真实空心涂装金属箱壳','enamel',[.014,.025,.014],[.592,.340,.372],[{min:[.041,.051,.041],size:[.538,.355,.318]}]);b.box('独立涂装金属箱盖','enamel',[.013,.366,.013],[.594,.035,.374],.005);rim('真实钢盖沿','metal',[.007,.343,.007],[.606,.028,.386],.033);
  for(const x of[.008,.554])for(const z of[.008,.334]){b.box('独立竖角钢条','metal',[x,.044,z],[.058,.329,.058],.004);for(const y of[.002,.343])corner(x-.008,y,z-.008,.074,.067,.074);}for(const x of[.130,.451]){b.box('前钢箍带','metal',[x,.052,-.004],[.035,.300,.027],.002);b.box('实际箱盖钢箍','metal',[x,.391,.010],[.035,.016,.380],.002,2);b.box('后钢箍带','metal',[x,.052,.377],[.035,.345,.027],.002);b.box('独立锁座','metal',[x-.008,.263,-.015],[.053,.093,.029],.003);b.box('实际黄铜锁片','bronze',[x+.005,.282,-.020],[.026,.052,.024],.002);pin(x+.012,.300,-.024);}
  for(const x of[.226,.377])b.box('盖提手实际钢支座','metal',[x,.397,.172],[.018,.035,.038],.002);b.box('真实悬高盖握杆','metal',[.226,.431,.172],[.169,.015,.038],.002,0);
  frame('真正纸标签钢托框','metal',.231,.147,.002,.165,.102,.011,.015);b.box('独立纸标签','paperSheet',[.241,.157,-.001],[.145,.082,.013],.001,0);b.box('独立红油墨标题','printedRed',[.255,.212,-.0018],[.060,.012,.002],.0003,0);for(let j=0;j<3;j++)b.box('有限深油墨登记线','printedDark',[.256,.175+j*.008,-.0018],[.105-j*.023,.002,.002],.0003,0);
  return done('真实金属空箱、独立盖沿和两道钢箍、闭合护角、锁片与贯通提手','one reusable empty industrial case; no small duplicate, invented barcode, contents or animated lid',{},w);
 }
 if(catalogId==='LIFE-096'){
  const w=.48,d=.32;b.box('药盒真实木底','wood',[0,0,0],[w,.025,d],.002,0);rim('实际开盒木壁','woodEdge',[0,.023,0],[w,.055,d],.020);b.box('独立药盒木格板','wood',[.202,.025,.020],[.016,.049,.280],.002);b.box('药盒第二格板','wood',[.020,.025,.174],[.442,.049,.016],.002,0);
  frame('打开盖木攒框','wood',.008,.049,.283,.464,.365,.027,.030);b.box('真实内凹木盖芯','wood',[.035,.076,.291],[.410,.311,.017],.002,1);for(const x of[.030,.418]){b.box('真实静态开盖铰耳','metal',[x,.009,.275],[.033,.063,.046],.003);b.cylinder('独立铜盖轴','bronze',[x-.004,.045,.303],[x+.039,.045,.303],.008,16);corner(x,.355,.279,.040,.049,.039);}b.box('独立铜盒前锁扣','bronze',[.222,.034,-.008],[.041,.045,.024],.003);pin(.235,.047,-.011);
  for(const[x,z,y,ww,dd]of[[.039,.202,.025,.136,.088],[.246,.202,.025,.150,.086],[.251,.202,.070,.140,.086],[.041,.060,.025,.098,.080]]){b.box('真实折纸药包','paperSheet',[x,y,z],[ww,.043,dd],.003);b.box('独立纸包折边','paperEdge',[x+.006,y+.003,z-.002],[ww-.012,.035,.004],.0007,0);b.box('真实固定织带','webbing',[x+ww*.45,y+.037,z-.003],[.015,.009,dd+.006],.001,2);for(const zz of[z-.003,z+dd-.004])b.box('织带连续下折','webbing',[x+ww*.45,y,zz],[.015,.043,.007],.001);b.box('药包纸封签','paperSheet',[x+ww*.18,y+.042,z+dd*.23],[ww*.24,.002,dd*.49],.0003);b.box('独立青色印墨标记','inkTeal',[x+ww*.21,y+.043,z+dd*.28],[ww*.15,.0016,dd*.14],.00025);}
  for(const[x,z,H]of[[.272,.092,.115],[.353,.092,.135],[.431,.092,.105]]){
   const shell=sectionShell('实际空心琥珀玻璃药瓶',b.role('bottleAmber'),[{y:.025,rx:0},{y:.025,rx:.022},{y:.032,rx:.025},{y:H-.022,rx:.025},{y:H-.005,rx:.013},{y:H+.011,rx:.013},{y:H+.011,rx:.010},{y:H-.005,rx:.010},{y:H-.022,rx:.022},{y:.033,rx:.022},{y:.029,rx:0}],[x,z],solid('bottleAmber'),24);b.mesh(shell);b.cylinder('独立瓶口塑料盖','polymer',[x,H+.008,z],[x,H+.029,z],.017,24);for(let j=0;j<12;j++){const a=j*Math.PI/6;b.cylinder('真实塑料旋盖竖筋','polymerDark',[x+.016*Math.cos(a),H+.011,z+.016*Math.sin(a)],[x+.016*Math.cos(a),H+.026,z+.016*Math.sin(a)],.0018,8);}
   b.box('实际瓶前纸标签','paperSheet',[x-.017,.047,z-.025],[.034,H-.063,.005],.0008);b.box('独立瓶标青油墨','inkTeal',[x-.009,.058,z-.0258],[.018,.014,.002],.0003);pin(x-.005,H+.023,z-.005,'polymer');
  }
  return done('真实开腔木盒与静态铰盖、分格折纸包、独立织带与油墨、空心琥珀瓶和旋盖','one packaging kit; bottles contain no modeled medicine, no medicine name, dose, medical claim, inventory or lid animation',{},w);
 }
 if(catalogId==='LIFE-106'){
  const w=.23,h=.055,d=.31;b.box('真实纸质下硬封','bookCover',[0,0,0],[w,.005,d],.0009,2);b.mesh(artPanel('真实纸质封面与作者建筑印墨',b.role('bookCover'),[0,h-.005,0],[w,.005,d],solid('bookCover'),'book-v1',{ground:b.role('bookCover'),motif:b.role('inkTeal'),detail:b.role('printedMark')},'XZ'));
  b.box('独立内退页芯','paperSheet',[.018,.007,.010],[.202,.040,.290],.0012,2);for(let j=0;j<13;j++){const y=.009+j*.0027;b.box('真正右侧露出页边','paperEdge',[.218,y,.012],[.0025,.0007,.286],.00012,2);for(const z of[.009,.299])b.box('真正上下露出页边','paperEdge',[.021,y,z],[.198,.0007,.002],.00012,0);}
  b.mesh(rigidMesh(roundLoft('实际圆弧布书脊',b.role('bookCloth'),[{y:.003,rx:.009,rz:.024,x:0,z:0},{y:.307,rx:.009,rz:.024,x:0,z:0}],20,solid('bookCloth')),[.007,.0275,.002],Math.PI/2));
  for(const z of[.035,.100,.199,.267])b.box('真实独立书脊筋','bookCloth',[-.004,.005,z],[.020,.045,.007],.0012);
  for(const x of[.003,.205])for(const z of[.003,.285])for(const y of[.001,.049]){b.box('独立薄铜书角','bronze',[x,y,z],[.025,.006,.025],.0009);b.voxel('bronze',[x+.010,y,z+.010],[.005,.005,.005]);}
  return done('真实厚硬封与连续弧布书脊、内退纸页和十三道页缝、作者封面贴图与最小铜角','one closed book; cover artwork is author-designed, no fabricated title, repeated copies or page-turn animation');
 }
 if(catalogId==='LIFE-107'){
  const paper=b.mesh(scrollSheet('真实连续薄纸画心',b.role('paperSheet'),solid('paperSheet')));paper.artwork={version:1,design:'landscape-v1',width:1024,height:768,sizeM:[.414,.20],materials:{ground:b.role('paperSheet'),motif:b.role('inkTeal'),detail:b.role('printedDark')}};
  for(const z of[.047,.303]){b.cylinder('独立真实木卷轴','wood',[0,.042,z],[.55,.042,z],.015,24);b.cylinder('真正连续卷起纸端','paperSheet',[.061,.042,z],[.489,.042,z],.030,40);for(const x of[.018,.507]){b.cylinder('真实木卷轴头','wood',[x,.042,z],[x+.025,.042,z],.037,24);b.cylinder('独立铜卷轴箍','bronze',[x-.004,.042,z],[x+.003,.042,z],.031,24);b.voxel('bronze',[x,.035,z-.01],[.005,.015,.020]);}for(const x of[0,.535])b.cylinder('退层独立铜轴帽','bronze',[x,.042,z],[x+.015,.042,z],.018,16);}
  for(const x of[.069,.474])b.box('独立纸边装裱条','paperEdge',[x,.025,.075],[.007,.002,.20],.0003,2);
  return done('真实连续画纸、卷端圆纸层、独立木轴和铜轴头、分层山水油墨贴图','one static open scroll; author-designed landscape pigment, no copied reference pixels, rolled duplicate or scrolling animation');
 }
 if(catalogId==='LIFE-109'){
  const w=1.02,d=.64;for(const x of[.018,.922])for(const z of[.040,.520]){b.box('独立讲台石脚','stone',[x-.010,0,z-.01],[.100,.060,.100],.004);b.box('连续讲台木柱','wood',[x,.048,z],[.080,.911,.080],.004);for(const y of[.074,.862])corner(x-.006,y,z-.006,.092,.089,.092);}
  b.box('真正开放讲台木底','wood',[.067,.169,.090],[.886,.030,.480],.003,0);for(const x of[.065,.930])b.box('独立讲台侧板','wood',[x,.198,.093],[.026,.650,.477],.003);for(const y of[.172,.838])b.box('实际前后木横枨','wood',[.052,y,.065],[.916,.054,.054],.003,0);
  frame('实际木嵌板攒框','woodEdge',.097,.245,.057,.826,.580,.044,.038);b.box('真正退层木嵌芯','wood',[.139,.286,.071],[.742,.496,.023],.003);frame('细木压边','woodEdge',.189,.330,.050,.642,.405,.019,.025);frame('独立铜回纹外圈','bronze',.407,.462,.064,.206,.199,.010,.018);for(const[min,size]of[[[.433,.489,.064],[.145,.010,.018]],[[.568,.489,.064],[.010,.139,.018]],[[.458,.618,.064],[.120,.010,.018]],[[.458,.518,.064],[.010,.110,.018]],[[.458,.518,.064],[.086,.010,.018]],[[.534,.518,.064],[.010,.073,.018]]]as[V3,V3][])b.box('真实回纹铜枝','bronze',min,size,.001);
  for(const x of[.018,.922]){b.box('讲台真实后承托木柱','wood',[x,.884,.520],[.080,.232,.080],.004);b.box('讲台实际前承托木座','wood',[x,.923,.040],[.080,.065,.080],.003);}
  b.mesh(slopePlate('真正连续倾斜木讲台',b.role('wood'),0,w,.025,.615,.958,1.088,.045,solid('wood')));for(const x of[0,.971])b.member('独立倾斜攒边','woodEdge',[x+.0245,1.024,.064],[x+.0245,1.146,.591],.049,.024,.003);b.box('真正挡书沿','woodEdge',[.027,1.004,.033],[.966,.027,.032],.003,0);
  b.box('实际控制座钢壳','metal',[.387,1.086,.383],[.232,.036,.115],.004);display('真实讲台静态显示贴图',[.405,1.119,.395],[.196,.005,.074],'control-v1','XZ');b.box('话筒实际钢基座','metal',[.767,1.101,.485],[.057,.058,.063],.004);const pts:V3[]=[[.795,1.154,.516],[.794,1.245,.514],[.775,1.301,.480],[.694,1.342,.379]];for(let j=0;j<pts.length-1;j++)b.cylinder('实际连续鹅颈话筒','metal',pts[j],pts[j+1],.006,12);b.cylinder('真正金属话筒头','metal',pts.at(-1)!,[.673,1.347,.356],.014,16);pin(.675,1.34,.350);
  return done('真正倾斜攒边书台、挡书沿、开放背仓、实铜回纹与连续鹅颈话筒','one empty lectern; no microphone audio, classroom interaction, book placement or movement binding',{},w);
 }
 if(catalogId==='LIFE-110'){
  const w=1.62,d=.38;for(const x of[.018,1.522])for(const z of[.037,.264]){b.box('教学屏独立石脚','stone',[x-.010,0,z-.010],[.100,.060,.100],.004);b.box('教学屏实际木柱','wood',[x,.046,z],[.080,z<.1?1.42:.397,.080],.004);for(const y of[.070,.390])corner(x-.006,y,z-.006,.092,.087,.092);if(z<.1)corner(x-.006,1.389,z-.006,.092,.091,.092);}
  b.box('真实浅柜木底','wood',[.055,.130,.053],[1.510,.028,.269],.003,0);b.box('实际浅柜木背','wood',[.068,.158,.300],[1.484,.281,.024],.002);for(const x of[.063,.925,1.531])b.box('浅柜真实侧分板','wood',[x,.158,.060],[.026,.281,.255],.002);b.box('实际浅柜木顶','woodEdge',[.018,.432,.025],[1.584,.038,.323],.004,0);
  for(const x of[.108,.526]){for(const y of[.217,.332])b.box('独立柜门真实铰耳','metal',[x-.030,y,.043],[.059,.045,.052],.003);frame('独立木柜门攒框','woodEdge',x,.174,.043,.390,.227,.025,.026);b.box('真实木门退层嵌芯','wood',[x+.023,.197,.052],[.344,.181,.020],.002);pull(x+.318,.222,.063,.029);}b.box('通风框实际木上承枨','wood',[.955,.392,.039],[.560,.048,.050],.003,0);cut('底柜真实通风钢框','metal',[.998,.177,.043],[.482,.220,.026],Array.from({length:5},(_,j)=>({min:[1.026,.203+j*.034,.028]as V3,size:[.426,.013,.058]as V3})));
  b.box('真正粉笔托槽底','wood',[.092,.493,-.070],[1.436,.025,.173],.003,0);for(const z of[-.070,.079])b.box('粉笔槽独立实木挡边','woodEdge',[.092,.515,z],[1.436,.023,.024],.002,0);for(const x of[.092,1.504])b.box('粉笔槽真实端壁','woodEdge',[x,.515,-.046],[.024,.023,.125],.002);
  const sx=.133,sy=.619,sw=1.354,sh=.750,sz=.112;b.box('实际教学屏退层背机箱','metal',[sx-.002,sy+.01,sz+.036],[sw+.004,sh-.020,.059],.005);frame('教学屏木外攒框','wood',sx-.033,sy-.034,sz+.006,sw+.066,sh+.068,.034,.082);frame('教学屏深钢压框','metal',sx-.012,sy-.012,sz-.012,sw+.024,sh+.024,.019,.030);display('真正教学建筑与圆图贴图',[sx+.005,sy+.005,sz-.003],[sw-.010,sh-.010,.018],'lesson-v1');for(const x of[.043,1.547])light(x,.668,.083,.635);
  b.box('屏下设备带真实木后托','wood',[.509,.522,.087],[.602,.084,.064],.003);b.box('屏下连续钢设备带','metal',[.503,.551,.049],[.614,.034,.057],.003,0);for(let j=0;j<5;j++)b.box('独立设备塑料键','polymerDark',[.631+j*.066,.560,.040],[.027,.017,.021],.002);pin(.972,.563,.049);
  return done('真实教学屏木钢框、空浅柜和贯通通风槽、真实粉笔槽、作者建筑和圆图贴图','one static teaching screen; no text lesson, handwriting input, playback, teaching script or drawers animation',{},w);
 }
 throw Error('Commerce refinement not implemented '+catalogId);
}
