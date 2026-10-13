import type {Asset,Project,V3,Port} from '../core/types';
import {makeLifeAsset} from './life';
import {DetailBuilder} from './refinement-builder';
import {orthogonalDifference,type SolidBox} from './domestic-refinement-shapes';
import {polarPlate,conveyorLoop,mineralRock,diamondNet} from './workshop-refinement-shapes';
export const workshopRefinementIds=Array.from({length:12},(_,i)=>'LIFE-'+String(77+i).padStart(3,'0'));
export function makeWorkshopRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,p:Project):Asset{
 const b=new DetailBuilder(p,makeLifeAsset(catalogId,name,id,style),style),solid=(r:string)=>p.materials[b.role(r)].solid;
 const cut=(name:string,role:string,min:V3,size:V3,voids:SolidBox[])=>b.mesh(orthogonalDifference(name,b.role(role),[{min,size}],voids,solid(role)));
 const pin=(x:number,y:number,z:number,role='bronze')=>b.voxel(role,[x,y,z],[.010,.010,.005]);
 const corner=(x:number,y:number,z:number,w=.068,h=.070,d=.068)=>{b.box('退层钢护角','metal',[x,y,z],[w,h,d],.004);for(const xx of[x+.008,x+w-.015])b.box('独立金色包角条','bronze',[xx,y+.004,z-.002],[.007,h-.008,.009],.001);b.box('金色角帽压边','bronze',[x+.006,y+h-.007,z-.002],[w-.012,.007,.009],.001,0);pin(x+.028,y+.025,z-.005);};
 const frame=(name:string,role:string,x:number,y:number,z:number,w:number,h:number,t=.023,d=.022)=>{for(const xx of[x,x+w-t])b.box(name+'竖边',role,[xx,y,z],[t,h,d],.002);for(const yy of[y,y+h-t])b.box(name+'横边',role,[x,yy,z],[w,t,d],.002,0);};
 const rim=(name:string,role:string,min:V3,size:V3,t:number)=>{const[x,y,z]=min,[w,h,d]=size;for(const zz of[z,z+d-t])b.box(name+'长边',role,[x,y,zz],[w,h,t],.002,0);for(const xx of[x,x+w-t])b.box(name+'短边',role,[xx,y,z],[t,h,d],.002);};
 const pull=(x:number,y:number,z:number,w:number)=>{for(const xx of[x,x+w-.012])b.box('真实把手支座','metal',[xx,y,z-.024],[.012,.016,.029],.001);b.box('独立铜握杆','bronze',[x,y,z-.029],[w,.016,.011],.0015,0);};
 const control=(x:number,y:number,z:number,w:number,h:number)=>{b.box('独立控制壳','metal',[x,y,z],[w,h,.055],.004);b.box('显示底面','screen',[x+.016,y+.056,z-.005],[w-.032,h-.073,.013],.001,0);for(let k=0;k<4;k++)b.box('静态作者显示像素','displayGlyph',[x+.024+k*(w-.047)/4,y+.069,z-.007],[Math.max(.008,(w-.067)/9),.021+.012*(k%3),.004],.0004);for(const xx of[x+.022,x+w-.043]){b.box('独立硬塑按键','polymerDark',[xx,y+.018,z-.010],[.022,.023,.020],.002);pin(xx+.005,y+.024,z-.014,'bronze');}};
 const drawer=(x:number,y:number,z:number,w:number,h:number,d:number)=>{b.box('实际空屉底','wood',[x,y,z],[w,.015,d],.001,0);for(const xx of[x,x+w-.015])b.box('独立屉壁','wood',[xx,y,z],[.015,h,d],.001);b.box('真实屉后壁','wood',[x,y,z+d-.015],[w,h,.015],.001);b.box('屉前木框','woodEdge',[x,y,z-.014],[w,h,.033],.002,0);b.box('独立浅石抽屉芯','stone',[x+.017,y+.018,z-.018],[w-.034,h-.036,.012],.001,0);pull(x+w*.34,y+h*.49,z-.018,w*.32);};
 const done=(features:string,scope:string,details:Record<string,unknown>={},ports?:Port[])=>{const a=b.finish(features,{sheet:'M005',expectedContactGroups:1,scope,...details});a.openings=[];if(ports)a.ports=ports;return a;};
 if(catalogId==='LIFE-077'){
  const w=1.56,h=1.92,d=.60;for(const x of[.016,.740,1.464])for(const z of[.016,.504]){b.box('六个独立石脚','stone',[x-.010,0,z-.010],[.101,.066,.101],.005);b.box('六根木框柱','wood',[x,.051,z],[.076,1.848,.076],.004);for(const y of[.066,.877,1.795])corner(x-.008,y,z-.008,.092,.095,.092);}
  for(const y of[.185,.893,1.601]){for(const z of[.023,.532])b.box('双跨实际木承梁','woodEdge',[.034,y,z],[1.493,.077,.046],.004,0);for(const x of[.031,.75,1.469])b.box('真实跨深承枨','wood',[x,y,.04],[.055,.061,.516],.003);for(let j=0;j<6;j++)b.box('分板木承面','wood',[.066,y+.058,.056+j*.078],[1.431,.029,.074],.002,0);}
  for(const x of[.052,1.502])for(const y of[.280,1.010]){b.member('侧面交叉钢拉撑','metal',[x,y,.045],[x,y+.57,.55],.025,.018,.002);b.member('侧面交叉钢拉撑','metal',[x,y,.55],[x,y+.57,.045],.025,.018,.002);}
  b.box('顶后贯通木枨','woodEdge',[.035,1.855,.526],[1.490,.043,.040],.003,0);
  return done('六柱双跨三层木承架、真实侧交叉撑、分板承面和金属金边护角','empty storage frame; cargo remains independent, no load calculation or inventory binding');
 }
 if(catalogId==='LIFE-078'){
  for(const x of[.141,1.373])for(const z of[.013,.508]){b.box('输送架石脚','stone',[x-.012,0,z-.012],[.096,.065,.096],.004);b.box('实际钢支柱','metal',[x,.048,z],[.070,.549,.070],.004);corner(x-.008,.480,z-.008,.088,.080,.088);}
  for(const z of[.020,.531])b.box('连续输送侧梁','metal',[.10,.518,z],[1.40,.086,.045],.004,0);for(const x of[.166,1.389])b.box('真实横向联梁','metal',[x,.283,.029],[.036,.040,.526],.002);
  b.mesh(conveyorLoop('真实连续橡胶传送回路',b.role('rubber'),.103,1.497,.622,.070,.46,.093,.013,solid('rubber')));
  for(const x of[.103,1.497]){b.cylinder('真实钢滚筒','metalBright',[x,.622,.073],[x,.622,.527],.077,32);b.cylinder('实接滚轴','bronze',[x,.622,-.006],[x,.622,.608],.022,24);for(const z of[.014,.535]){b.box('真实轴承夹耳','metal',[x-.051,.554,z],[.103,.134,.052],.004);b.mesh(polarPlate('轴承圆形压圈',b.role('bronze'),[x,.622,z-.006],()=>.039,.024,.012,solid('bronze'),32));}}
  for(let j=0;j<18;j++){const x=.074+j*.081;b.box('独立耐磨钢链片','metalBright',[x,.709,.079],[.075,.016,.442],.002,0);for(const z of[.087,.496])pin(x+.029,.721,z,'metal');}
  for(const z of[.016,.559])b.box('实际边挡与走线护条','metal',[.090,.650,z],[1.420,.036,.024],.002,0);
  b.box('独立静态电机壳','enamel',[1.173,.400,-.127],[.263,.210,.174],.009);cut('真实电机通风盖','metal',[1.189,.427,-.140],[.232,.157,.028],Array.from({length:5},(_,j)=>({min:[1.212+j*.037,.447,-.152]as V3,size:[.013,.108,.052]as V3})));control(.175,.378,-.115,.151,.156);
  return done('连续橡胶回路、双圆滚筒、十八钢链片、真实轴承和通风电机壳','static conveyor with author input/output planes; no belt speed, transport or control binding',{},[{id:'input',kind:'conveyor-600',position:[.010,.725,.30],normal:[-1,0,0],size:[0,.016,.442],pitch:.005},{id:'output',kind:'conveyor-600',position:[1.59,.725,.30],normal:[1,0,0],size:[0,.016,.442],pitch:.005}]);
 }
 if(catalogId==='LIFE-079'){
  rim('升降底框','metal',[0,.048,0],[1.16,.069,.92],.092);for(const x of[.012,1.054])for(const z of[.012,.814]){b.box('升降台石脚','stone',[x-.012,0,z-.012],[.112,.062,.112],.005);corner(x-.006,.063,z-.006,.099,.068,.099);}
  for(const z of[.203,.701]){for(const y of[.121,.552])cut('真实 U 型导向轨','metal',[.084,y,z-.043],[.992,.051,.093],[{min:[.119,y+.016,z-.019],size:[.922,.051,.045]}]);for(const y of[.145,.578])for(const x of[.161,.950])b.box('实际滑块与机械止挡','metalBright',[x-.029,y-.015,z-.016],[.058,.055,.060],.003);b.member('连续剪叉钢臂甲','metal',[.184,.169,z+.012],[.976,.597,z+.012],.048,.021,.002);b.member('连续剪叉钢臂乙','metal',[.976,.169,z+.040],[.184,.597,z+.040],.048,.021,.002);for(const[x,y]of[[.184,.169],[.976,.169],[.580,.383],[.184,.597],[.976,.597]])b.cylinder('实际剪架枢轴','bronze',[x,y,z-.027],[x,y,z+.073],.035,24);}
  b.box('真实上承平台钢框','metal',[0,.593,0],[1.16,.063,.92],.007,0);b.box('独立耐磨钢承面','metalBright',[.028,.648,.028],[1.104,.030,.864],.006,0);
  for(const z of[.005,.895])for(let j=0;j<8;j++)b.box('独立黄色警示油墨','printedWarning',[.041+j*.139,.673,z],[.067,.0025,.019],.0004,0);
  b.box('侧控制柱实际底联架','metal',[1.06,.059,.703],[.244,.060,.080],.003);b.box('独立控制石脚','stone',[1.225,0,.692],[.128,.065,.126],.004);b.box('原用途木控制柱','wood',[1.251,.052,.721],[.077,.625,.077],.003);corner(1.242,.602,.712,.094,.086,.094);control(1.236,.334,.674,.105,.278);
  return done('连续双剪架、U型导轨、实际滑块和止挡、分层钢台及独立控制柱','one static raised pose; no lift simulation, dynamic sweep or load certification');
 }
 if(catalogId==='LIFE-080'){
  for(const x of[.066,.614])for(const z of[.066,.514]){b.cylinder('独立调平钢脚盘','metal',[x,0,z],[x,.022,z],.036,32);b.cylinder('实际调平螺柱','bronze',[x,.018,z],[x,.092,z],.011,24);b.box('承盘调平脚座','metal',[x-.027,.065,z-.027],[.054,.048,.054],.003);}
  b.box('磅秤钢底架','metal',[.018,.081,.018],[.644,.085,.544],.006,0);for(const x of[.073,.557])for(const z of[.073,.457])b.box('实际承盘支点','metalBright',[x,.156,z],[.050,.046,.050],.003);
  b.box('钢盘下承框','metal',[0,.186,0],[.68,.035,.58],.005,0);b.box('独立钢质称量盘','metalBright',[.010,.216,.010],[.66,.033,.56],.006,0);for(const x of[.002,.626])for(const z of[.002,.526])corner(x,.162,z,.052,.066,.052);
  b.box('实际读数钢立柱','metal',[.572,.127,.521],[.048,.557,.048],.003);b.member('读数柱连续背支撑','metal',[.622,.16,.546],[.616,.626,.549],.026,.024,.002);control(.441,.650,.497,.322,.189);
  return done('真实调平脚盘螺柱、承盘支点、薄钢承盘与杆式显示框','static scale with author glyphs only; no numeric weight, calibration or measured load');
 }
 if(catalogId==='LIFE-081'){
  for(const x of[.022,1.504])for(const z of[.022,.624]){b.box('工作台石脚','stone',[x-.008,0,z-.008],[.092,.062,.092],.004);b.box('工作台连续木腿','wood',[x,.048,z],[.074,.781,.074],.004);corner(x-.007,.754,z-.007,.088,.086,.088);}
  b.box('工作台下层独立承板','wood',[.045,.139,.039],[1.515,.030,.641],.003,0);for(const x of[.059,1.533]){b.member('工作台交叉侧撑','metal',[x,.195,.059],[x,.723,.652],.025,.020,.002);b.member('工作台交叉侧撑','metal',[x,.195,.652],[x,.723,.059],.025,.020,.002);}
  const slots:SolidBox[]=[.18,.52,.86].map(x=>({min:[x,.810,.12],size:[.025,.067,.46]}));cut('攒边真实木工作面框','woodEdge',[0,.794,0],[1.60,.066,.72],[{min:[.044,.826,.035],size:[1.512,.065,.650]},...slots]);cut('实际石芯夹具槽承面','stone',[.044,.829,.035],[1.512,.031,.650],slots);
  b.box('右屉支承分板','wood',[1.122,.166,.035],[.024,.630,.644],.002);for(const y of[.234,.484])drawer(1.16,y,.024,.334,.231,.608);drawer(.130,.633,.024,.440,.142,.411);
  for(const x of[.037,1.486]){b.box('后挂轨木立柱','wood',[x,.823,.634],[.075,.528,.073],.004);corner(x-.007,1.268,.627,.089,.084,.087);}b.box('挂轨顶木横枨','woodEdge',[.052,1.286,.643],[1.477,.049,.056],.003,0);
  for(const y of[1.007,1.184])b.box('两道独立钢挂轨','metal',[.097,y,.634],[1.400,.028,.023],.002,0);for(let j=0;j<7;j++){const x=.177+j*.184;b.member('空挂钩实接段','metal',[x,1.194,.654],[x,1.194,.594],.010,.010,.001);b.member('空挂钩垂段','bronze',[x,1.194,.594],[x,1.135,.594],.010,.010,.001);}control(1.477,.628,-.043,.10,.130);
  return done('空石芯工作面与真实夹具槽、双侧连续撑、独立抽屉及空工具挂轨','empty workbench; tools and inventory separate, static drawers and author clamp channels');
 }
 if(catalogId==='LIFE-082'){
  const w=1.14,h=1.45,d=.78;for(const x of[.011,1.039])for(const z of[.011,.679]){b.box('机床石脚','stone',[x-.005,0,z-.005],[.101,.068,.101],.005);b.box('连续机床钢骨柱','metal',[x,.055,z],[.085,1.354,.085],.006);for(const y of[.078,1.353])corner(x-.004,y,z-.004,.093,.087,.093);}
  b.box('机床真实钢内底','metal',[.026,.109,.025],[1.088,.055,.727],.004,0);b.box('涂装钢顶壳','enamel',[.025,1.364,.025],[1.088,.052,.727],.007,0);b.box('涂装钢实际后壳','enamel',[.029,.153,.737],[1.082,1.226,.027],.004);
  const vents=Array.from({length:7},(_,j)=>({min:[-.015,.344,.162+j*.072]as V3,size:[.092,.043,.028]as V3}));cut('左侧钢壳真实通风孔','enamel',[.025,.153,.034],[.027,1.226,.716],vents);b.box('右侧涂装钢壳','enamel',[1.088,.153,.034],[.027,1.226,.716],.004);b.box('外露左检修金属边带','metal',[.025,.280,.118],[.034,.032,.575],.002);
  cut('真实前部观察门框围壳','enamel',[.037,.153,.019],[1.066,1.222,.027],[{min:[.274,.337,-.01],size:[.610,.909,.093]}]);frame('观察门独立深钢压框','metal',.274,.337,-.010,.610,.909,.036,.036);b.box('独立透明观察玻璃','glass',[.308,.373,.008],[.542,.839,.009],.0008,0);pull(.819,.726,-.002,.032);
  for(const y of[.411,1.119])b.box('观察门实际铰座','bronze',[.270,y,-.014],[.026,.054,.027],.002);cut('左前真实通风检修盖','metal',[.088,.373,-.005],[.126,.580,.025],Array.from({length:7},(_,j)=>({min:[.111,.418+j*.068,-.014]as V3,size:[.080,.018,.052]as V3})));
  b.box('独立控制座实接托臂','metal',[1.05,.782,-.016],[.203,.048,.120],.004);control(1.068,.730,-.123,.234,.303);b.box('真实底检修带','metal',[.128,.163,-.005],[.885,.052,.035],.003,0);
  return done('连续涂装钢围壳、实际内腔、透明观察门与铰座、真实通风孔和控制座','enclosure only; no cutter, workpiece, machine motion, door interlock or powered operation');
 }
 if(catalogId==='LIFE-083'){
  for(const x of[.012,.879])for(const z of[.012,.248]){b.box('工具架石脚','stone',[x-.006,0,z-.006],[.081,.054,.081],.004);b.box('实际工具架木柱','wood',[x,.043,z],[.067,(z>.2?1.358:.479),.067],.003);corner(x-.004,.440,z-.004,.075,.089,.075);if(z>.2)corner(x-.004,1.329,z-.004,.075,.083,.075);}
  b.box('工具架木底板','wood',[.030,.084,.024],[.903,.029,.276],.002,0);b.box('真实柜后板','wood',[.035,.108,.277],[.893,.383,.018],.001);b.box('实际柜中分板','wood',[.467,.107,.023],[.025,.384,.267],.001);b.box('木柜工作顶','woodEdge',[.014,.490,.006],[.932,.040,.308],.003,0);for(const x of[.060,.506])for(const y of[.139,.312])drawer(x,y,.015,.388,.157,.267);
  const holes:SolidBox[]=Array.from({length:11*9},(_,j)=>({min:[.110+j%11*.067,.624+Math.floor(j/11)*.070,.235],size:[.014,.014,.050]}));cut('真实九九孔涂装钢挂板','enamel',[.077,.590,.252],[.806,.690,.014],holes);frame('挂板独立钢压边','metal',.053,.568,.237,.853,.736,.025,.038);b.box('工具架顶木横枨','woodEdge',[.046,1.359,.263],[.869,.043,.048],.003,0);
  for(const[x,k]of[[.153,0],[.313,1],[.473,2],[.633,3],[.793,4]]){b.member('实际独立挂钩','metal',[x,1.109,.260],[x,1.109,.146],.012,.013,.001);
   if(k===0){b.box('锤木柄','wood',[x-.011,.823,.158],[.022,.376,.021],.0015);b.box('实际锤头','metalBright',[x-.061,1.173,.142],[.122,.049,.052],.004,0);}
   else if(k===1||k===2){b.box('扳手真实钢柄','metalBright',[x-.013,.836,.157],[.026,.315,.019],.002);b.mesh(polarPlate('扳手真实贯通环口',b.role('metalBright'),[x,1.181,.155],()=>.043,.023,.020,solid('metalBright'),32));b.mesh(polarPlate('扳手末端穿孔',b.role('metalBright'),[x,.845,.155],()=>.024,.009,.020,solid('metalBright'),24));}
   else if(k===3){b.cylinder('螺丝刀独立塑料握柄','polymerDark',[x,.827,.168],[x,1.107,.168],.018,20);b.cylinder('螺丝刀实际钢杆','metalBright',[x,1.099,.168],[x,1.262,.168],.0055,16);b.box('实际一字刀头','metalBright',[x-.009,1.243,.165],[.018,.022,.007],.0008);}
   else{for(const s of[-1,1]){b.member('钳臂钢件','metalBright',[x+s*.027,.869,.167],[x-s*.014,1.100,.167],.018,.021,.001);b.member('钳口真实分叉','metalBright',[x-s*.014,1.081,.167],[x+s*.019,1.193,.167],.016,.021,.001);b.member('独立钳柄包塑','polymerDark',[x+s*.028,.866,.167],[x+s*.012,.981,.167],.026,.026,.002);}b.cylinder('实际钳枢轴','bronze',[x,1.045,.147],[x,1.045,.188],.020,20);}
  }
  return done('真实九十九孔挂板、四独立抽屉、木钢框与一组有实际挂点的五件工具','one tool-rack kit including static hung tools; no extra tool IDs, pickup state or interaction');
 }
 if(catalogId==='LIFE-084'){
  rim('透空切割机钢机座','metal',[0,.048,0],[1.64,.074,.64],.074);for(const x of[.010,1.54])for(const z of[.01,.54]){b.box('切割机石脚','stone',[x-.010,0,z-.010],[.113,.065,.113],.004);corner(x-.006,.070,z-.006,.095,.080,.095);}for(const z of[.151,.454])b.box('真实钢导轨','metalBright',[.049,.118,z],[1.54,.050,.038],.003,0);
  b.box('真实承载滑台','metal',[.174,.157,.092],[.679,.055,.444],.006,0);b.box('独立电机涂装壳','enamel',[.222,.204,.132],[.540,.307,.364],.021);cut('电机真实检修栅盖','metal',[.292,.250,.116],[.378,.199,.027],Array.from({length:4},(_,j)=>({min:[.319,.283+j*.039,.103]as V3,size:[.323,.014,.052]as V3})));control(.172,.255,.063,.099,.181);
  for(const z of[.223,.413]){b.member('实际连续承载钢臂','metal',[.550,.453,z],[1.23,.763,z],.088,.068,.004);b.member('浅涂装钢臂包条','enamel',[.556,.488,z-.019],[1.178,.806,z-.019],.026,.044,.002);for(const[x,y]of[[.56,.455],[.89,.607],[1.225,.763]])b.cylinder('独立臂枢轴','bronze',[x,y,z-.047],[x,y,z+.047],.044,24);}
  b.cylinder('真实刀盘主轴','metal',[1.23,.735,.206],[1.23,.735,.498],.058,32);b.mesh(polarPlate('真实一体钢刀盘及二十刃齿',b.role('metalBright'),[1.23,.735,.290],i=>i%4<2?.303:.328,.063,.052,solid('metalBright'),80));b.mesh(polarPlate('独立刀盘夹压环',b.role('metal'),[1.23,.735,.270],()=>.126,.058,.024,solid('metal'),48));
  b.mesh(polarPlate('连续上半刀盘护弧',b.role('metal'),[1.23,.735,.357],()=>.350,.333,.034,solid('metal'),36,0,Math.PI));b.member('护弧真实背托','metal',[1.231,.766,.393],[1.231,1.078,.393],.027,.030,.002);
  return done('透空滑轨、实际滑台、连续双钢臂、圆枢轴、一体齿刃刀盘和连续护弧','static mining cutter study; no blade rotation, feed motion, extraction or dynamic safety envelope');
 }
 if(catalogId==='LIFE-085'){
  const roles={matrix:b.role('oreMatrix'),stone:b.role('stone'),vein:b.role('oreVein')};for(const[c,r,label]of[[[.24,.17,.21],[.205,.186,.178],'主矿料连续切面'],[[.085,.09,.13],[.092,.096,.109],'相接小矿体'],[[.362,.091,.263],[.094,.106,.112],'相接侧矿体']]as[V3,V3,string][])for(const m of mineralRock(label,roles,c,r,n=>p.materials[n].solid))b.mesh(m);
  b.voxel('oreMatrix',[.225,.130,.205],[.010,.010,.010]);b.voxel('oreVein',[.230,.135,.210],[.005,.010,.005]);
  return done('真实连续不规则矿料切面、相接矿体和有限厚度矿脉石层','one mineral specimen; no cargo crates, extra ore identities, emission or mineral values');
 }
 if(catalogId==='LIFE-086'){
  for(const x of[.018,.557])for(const z of[.018,.337]){b.box('采收箱石脚','stone',[x-.010,0,z-.010],[.085,.047,.085],.004);b.box('实际角木柱','woodEdge',[x,.032,z],[.065,.431,.065],.003);for(const y of[.055,.387])corner(x-.005,y,z-.005,.077,.081,.077);}
  for(let j=0;j<6;j++)b.box('透气分板真底','wood',[.035+j*.096,.052,.031],[.090,.021,.358],.0015,0);
  for(let j=0;j<10;j++)for(const z of[.018,.381])b.box('前后独立立向木箱板','wood',[.035+j*.057,.069,z],[.053,.366,.022],.0015);
  const voids:SolidBox[]=[{min:[-.05,.308,.138],size:[.75,.049,.144]}];for(let j=0;j<6;j++)for(const x of[.018,.597])cut('侧壁真实提孔木箱板','wood',[x,.069,.037+j*.057],[.023,.366,.053],voids);
  for(const y of[.102,.265,.416])rim('真实木箍收边','woodEdge',[.015,y,.014],[.611,.028,.391],.022);rim('加厚箱口木沿','woodEdge',[.008,.435,.008],[.626,.035,.405],.031);
  for(const x of[-.018,.617])cut('独立金属提耳贯通握孔','metal',[x,.280,.110],[.038,.113,.200],voids);
  return done('空分板木采收箱、真实底缝、三道木箍、厚口沿与侧握孔','empty harvest container; crops remain separate, no inventory or harvesting binding');
 }
 if(catalogId==='LIFE-087'){
  for(const x of[.012,.604])for(const z of[.431,.699]){b.box('网笼石脚','stone',[x-.008,0,z-.008],[.080,.056,.080],.004);b.box('木网笼承柱','wood',[x,.044,z],[.056,.665,.056],.003);for(const y of[.055,.624])corner(x-.005,y,z-.005,.070,.080,.070);}for(const y of[.088,.655])rim('网笼实际木收框','woodEdge',[.025,y,.444],[.629,.038,.288],.030);
  const net=(name:string,w:number,h:number,fn:(u:number,v:number)=>V3)=>{for(const m of diamondNet(name,b.role('rope'),w,h,.09,fn,solid('rope')))b.mesh(m);};
  for(const z of[.451,.724])net('真实前后菱形纤维网',.585,.533,(u,v)=>[.046+u,.123+v,z+(z<.6?-.020:.020)*Math.sin(Math.PI*u/.585)*Math.sin(Math.PI*v/.533)]);
  for(const x of[.040,.637])net('真实侧菱形纤维网',.276,.533,(u,v)=>[x+(x<.3?-.014:.014)*Math.sin(Math.PI*u/.276)*Math.sin(Math.PI*v/.533),.123+v,.452+u]);net('真实空网底部绳目',.585,.276,(u,v)=>[.046+u,.109-.010*Math.sin(Math.PI*u/.585)*Math.sin(Math.PI*v/.276),.452+v]);
  for(const x of[.03,.646]){const pts:V3[]=[[x,.683,.448],[x-.034,.513,.443],[x-.026,.291,.450],[x,.133,.458]];for(let j=0;j<pts.length-1;j++)b.cylinder('实际垂挂提绳', 'rope',pts[j],pts[j+1],.007,12);}
  const X=.49,W=.54,D=.325;b.box('独立捕捞箱真实硬塑底','polymer',[X,.045,0],[W,.028,D],.003,0);const grip:SolidBox[]=[{min:[X+.194,.214,-.030],size:[.151,.042,.410]}];for(const z of[0,D-.026])cut('硬塑箱壁实际提孔','polymer',[X,.070,z],[W,.249,.026],grip);for(const x of[X,X+W-.026])b.box('实际硬塑箱侧壁','polymer',[x,.070,0],[.026,.249,D],.002);rim('捕捞箱独立钢口沿','metal',[X-.004,.307,-.004],[W+.008,.025,D+.008],.036);for(const x of[X+.003,X+W-.052])for(const z of[.003,D-.052]){b.box('捕捞箱角钢承柱','metal',[x,0,z],[.049,.333,.049],.003);corner(x-.003,.015,z-.003,.055,.069,.055);}for(const z of[-.010,.315])cut('独立金属提耳真实握孔','metal',[X+.172,.191,z],[.195,.087,.020],grip);
  return done('真空腔菱形绳网笼、实际木骨架和垂绳、独立空硬塑捕捞箱','one static net/catch-box kit with two independent forms; no fish, cloth simulation or capture state',{expectedContactGroups:2});
 }
 if(catalogId==='LIFE-088'){
  cut('实际空心硬塑保温下壳','polymer',[.011,.053,.012],[.858,.452,.536],[{min:[.056,.090,.057],size:[.768,.450,.446]}]);rim('独立实际盖封橡胶','rubber',[.024,.498,.024],[.832,.020,.512],.023);b.box('硬塑箱闭合盖','polymer',[.027,.514,.027],[.826,.031,.506],.005,0);b.box('独立退层硬塑盖芯','polymer',[.066,.539,.058],[.748,.034,.444],.005,0);
  for(const x of[.009,.813])for(const z of[.009,.493]){b.box('冷链箱连续钢角柱','metal',[x,.012,z],[.059,.572,.059],.005);for(const y of[.022,.491])corner(x-.009,y,z-.009,.077,.104,.077);}
  for(const x of[.044,.778])b.box('钢盖端压条','metal',[x,.539,.025],[.058,.045,.510],.004);for(const x of[.067,.745]){b.box('冷链箱实际扣锁座','metal',[x,.379,-.019],[.066,.144,.035],.004);b.box('独立铜扣翻片','bronze',[x+.016,.409,-.026],[.034,.077,.018],.003);pin(x+.027,.441,-.031);}
  for(const x of[-.027,.879])cut('冷链箱真实外置握孔','metal',[x,.240,.155],[.028,.135,.223],[{min:[x-.010,.270,.182],size:[.049,.081,.167]}]);
  b.box('冷链蓝色实涂标记底','inkTeal',[.350,.207,.009],[.178,.174,.003],.0004);const cx=.439,cy=.294,z=.008;for(let j=0;j<6;j++){const a=j*Math.PI/3,pt=(r:number,off=0):V3=>[cx+r*Math.cos(a+off),cy+r*Math.sin(a+off),z];b.member('独立白色冷链印墨主枝','printedMark',pt(0),pt(.061),.006,.002,.0004);for(const s of[-1,1])b.member('独立白色冷链印墨分枝','printedMark',pt(.034),[cx+.046*Math.cos(a)+s*.014*Math.cos(a+Math.PI/2),cy+.046*Math.sin(a)+s*.014*Math.sin(a+Math.PI/2),z],.004,.002,.0004);}
  b.box('侧制冷接口未启用壳','metal',[.128,.183,-.013],[.094,.118,.033],.003);b.box('未绑定状态显示像素','displayGlyph',[.147,.205,-.016],[.056,.072,.007],.001,0);
  return done('真实空心保温硬塑壳、闭合退层盖、独立橡胶封圈、扣锁和六枝雪花印墨','one static cold-chain case; no refrigeration, temperature data, lock motion or cargo binding');
 }
 throw Error('Workshop refinement not implemented '+catalogId);
}
