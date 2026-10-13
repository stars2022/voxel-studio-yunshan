import type {Asset,Project,Port,V3} from '../core/types';
import {makeLifeAsset} from './life';
import {DetailBuilder} from './refinement-builder';
import {sectionShell,type Section} from './kitchen-refinement-shapes';
import {rigidMesh} from './mesh-shapes';
import {orthogonalDifference,towelStrip,type SolidBox} from './domestic-refinement-shapes';

export const domesticRefinementIds=['LIFE-047','LIFE-048','LIFE-049','LIFE-050','LIFE-051','LIFE-052','LIFE-053','LIFE-054','LIFE-055','LIFE-056','LIFE-057','LIFE-064'];
export function makeDomesticRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,p:Project):Asset{
 const b=new DetailBuilder(p,makeLifeAsset(catalogId,name,id,style),style);
 const shell=(name:string,role:string,profile:Section[],center:[number,number],segments=48)=>b.mesh(sectionShell(name,b.role(role),profile,center,p.materials[b.role(role)].solid,segments));
 const cut=(name:string,role:string,min:V3,size:V3,voids:SolidBox[])=>b.mesh(orthogonalDifference(name,b.role(role),[{min,size}],voids,p.materials[b.role(role)].solid));
 const frame=(name:string,role:string,x:number,y:number,z:number,w:number,h:number,t=.012,d=.018)=>{for(const xx of[x,x+w-t])b.box(name+'竖',role,[xx,y,z],[t,h,d],.001);for(const yy of[y,y+h-t])b.box(name+'横',role,[x,yy,z],[w,t,d],.001,0);};
 const motif=(x:number,y:number,z:number,size:number,role='ceramicTeal')=>{const t=size/10;frame('独立回纹',role,x,y,z,size,size,t,.010);b.box('回纹内折',role,[x+size*.33,y+size*.30,z],[size*.37,t,.010],.0005,0);b.box('回纹内竖',role,[x+size*.60,y+size*.30,z],[t,size*.35,.010],.0005);};
 const nail=(x:number,y:number,z:number,role='bronze')=>b.voxel(role,[x,y,z],[.010,.010,.010]);
 const corner=(x:number,y:number,z:number,w=.035,h=.04)=>{b.box('铁包角','metal',[x,y,z],[w,h,.030],.002);nail(x+.010,y+.015,z-.005);};
 const tray=(w:number,d:number)=>{b.box('托盘底板','wood',[0,.009,0],[w,.018,d],.002,0);for(let j=0;j<7;j++)b.box('连续木条托面','wood',[.018+j*(w-.036)/7,.023,.014],[(w-.036)/7-.004,.017,d-.028],.001,0);for(const z of[0,d-.017])b.box('托盘前后攒边','woodEdge',[0,.021,z],[w,.022,.017],.002,0);for(const x of[0,w-.017])b.box('托盘左右攒边','woodEdge',[x,.021,0],[.017,.022,d],.002);for(const x of[0,w-.025])for(const z of[0,d-.025])corner(x,.008,z,.025,.034);};
 const cup=(x:number,z:number,y:number,r=.033)=>{shell('厚壁空心陶杯','ceramicWhite',[{rx:0,y:y+.008},{rx:r*.88,rz:r*.88,y:y+.008,exponent:.25},{rx:r,rz:r,y:y+.072,exponent:.25},{rx:r-.006,rz:r-.006,y:y+.072,exponent:.25},{rx:r*.78,rz:r*.78,y:y+.018,exponent:.25},{rx:0,y:y+.018}],[x,z],32);shell('杯底铜圈足','bronze',[{rx:r*.83,rz:r*.83,y,exponent:.25},{rx:r*.88,rz:r*.88,y:y+.012,exponent:.25},{rx:r*.65,rz:r*.65,y:y+.012,exponent:.25},{rx:r*.65,rz:r*.65,y,exponent:.25}],[x,z],32);motif(x-r*.48,y+.030,z-r-.003,r*.92);};
 const nozzle=(name:string,role:string,origin:V3,length:number,radius:number,angleZ=0)=>{const m=sectionShell(name,b.role(role),[{rx:radius,y:0},{rx:radius,y:length},{rx:radius*.58,y:length},{rx:radius*.58,y:0}],[0,0],p.materials[b.role(role)].solid,24);return b.mesh(rigidMesh(m,origin,0,angleZ));};
 const pull=(x:number,y:number,z:number,length:number,vertical=false)=>{for(const o of[0,length-.016])b.box('拉手支脚','metal',[x+(vertical?0:o),y+(vertical?o:0),z-.036],[.016,.016,.046],.001);b.box('独立铜握杆','bronze',[x,y,z-.040],[vertical?.016:length,vertical?length:.016,.017],.002,vertical?1:0);};
 const cabinet=(w:number,h:number,d:number,backHole=false)=>{for(const x of[.020,w-.065])for(const z of[.015,d-.060]){b.box('石脚','stone',[x-.006,0,z-.006],[.058,.060,.058],.003);b.box('木角柱','wood',[x,.050,z],[.045,h-.065,.045],.003);}for(const y of[.057,h-.035])b.box('柜体承板','wood',[.025,y,.019],[w-.05,.035,d-.038],.002,0);for(const x of[.039,w-.059])b.box('柜侧板','wood',[x,.087,.033],[.020,h-.122,d-.066],.002);cut('柜背与真实检修口','wood',[.045,.086,d-.031],[w-.09,h-.122,.019],backHole?[{min:[w*.40,.30,d-.05],size:[w*.17,.15,.08]}]:[]);for(const x of[.008,w-.045])for(const y of[.057,h-.056])corner(x,y,-.012,.038,.045);};
 const door=(x:number,y:number,z:number,w:number,h:number)=>{frame('木攒边柜门','woodEdge',x,y,z,w,h,.025,.044);b.box('浅石门芯','stone',[x+.024,y+.024,z+.012],[w-.048,h-.048,.025],.002);frame('门芯压线','stone',x+.045,y+.045,z+.008,w-.09,h-.09,.008,.016);motif(x+w*.28,y+h*.59,z+.004,Math.min(.14,w*.40),'stone');for(const yy of[y+.065,y+h-.105])b.box('实际铰链','metal',[x-.006,yy,z+.008],[.017,.040,.040],.001);pull(x+.035,y+h*.32,z,.18,true);};
 const control=(x:number,y:number,z:number,w=.055,h=.12)=>{b.box('控制盒金属壳','metal',[x,y,z],[w,h,.045],.003);b.box('独立屏幕底','screen',[x+.007,y+.030,z-.003],[w-.014,h-.045,.005],.0005);for(let j=0;j<3;j++)b.box('独立静态显示段','displayGlyph',[x+.013,y+.045+j*.018,z-.004],[w-.026,.006,.003],.0004);nail(x+.012,y+.010,z-.005);};
 const done=(features:string,details:Record<string,unknown>={},ports?:Port[])=>{const a=b.finish(features,{sheet:'M003',expectedContactGroups:1,reconstruction:'Recreated from the confirmed design after the uncommitted Oct 8 workspace was not restored.',...details});if(ports)a.ports=ports;return a;};
 if(catalogId==='LIFE-047'){
  tray(.36,.24);cup(.063,.068,.040);cup(.287,.177,.040);
  shell('连续空心保温壶','enamel',[{rx:0,y:.041},{rx:.051,y:.041},{rx:.056,y:.064},{rx:.056,y:.244},{rx:.052,y:.256},{rx:.043,y:.256},{rx:.047,y:.242},{rx:.047,y:.065},{rx:0,y:.056}],[.173,.126],16);
  for(const y of[.041,.239])shell('深铁壶箍','metal',[{rx:.052,y},{rx:.059,y},{rx:.059,y:y+.017},{rx:.051,y:y+.017}],[.173,.126],16);
  b.cylinder('静态闭合壶盖','metal',[.173,.250,.126],[.173,.271,.126],.050,16);b.box('盖钮','bronze',[.158,.268,.112],[.030,.013,.030],.002);
  nozzle('真实开放壶嘴','metalBright',[.121,.227,.126],.035,.012,Math.PI/3);
  for(const y of[.072,.232])b.box('木柄承脚','wood',[.219,y,.115],[.043,.016,.025],.002,0);b.box('透空木握柄','woodEdge',[.248,.072,.110],[.022,.177,.035],.003);
  b.reflectX(.36);return done('双厚壁空心杯、连续保温壶、开放壶嘴、镂空木柄和顺纹木托',{scope:'one cup/jug catalogue master; empty cups, static closed lid',cupFloors:[{center:[.297,.068],y:.058},{center:[.073,.177],y:.058}]});
 }
 if(catalogId==='LIFE-048'){
  b.box('砧板底','wood',[0,0,0],[.42,.028,.28],.003,0);for(let j=0;j<7;j++)b.box('顺纹砧板面','wood',[.032+j*.051,.024,.032],[.049,.016,.216],.001,0);
  for(const z of[.006,.260])b.box('接汁槽外边','woodEdge',[.006,.024,z],[.408,.022,.014],.002,0);for(const x of[.006,.4])b.box('接汁槽短边','woodEdge',[x,.024,.006],[.014,.022,.268],.002);
  for(const x of[0,.39])for(const z of[0,.25])corner(x,0,z,.030,.035);
  cut('实际挂孔刀身','metal',[.074,.040,.109],[.180,.010,.084],[{min:[.088,.035,.170],size:[.016,.020,.014]}]);b.box('连续薄刀刃','metalBright',[.074,.039,.104],[.180,.005,.006],.0007,0);
  b.box('刀柄全长钢芯','metal',[.246,.041,.132],[.134,.013,.041],.001,0);b.box('木刀柄','wood',[.264,.043,.128],[.123,.025,.050],.003,0);b.box('独立护手','metal',[.248,.039,.119],[.018,.025,.068],.002);
  for(const x of[.285,.360])nail(x,.065,.145);b.reflectX(.42);
  return done('真实接汁槽、薄刃、贯通刀身挂孔与木握柄',{knifeHole:{min:[.316,.035,.170],size:[.016,.020,.014]},scope:'board and knife only; ingredient trays and spice tools are independent'});
 }
 if(catalogId==='LIFE-049'){
  tray(.50,.35);for(const x of[.073,.177])for(const z of[.084,.196])cup(x,z,.040,.034);
  shell('连续青釉空心茶壶','ceramicTeal',[{rx:0,y:.040},{rx:.077,rz:.077,y:.040,exponent:.16},{rx:.085,rz:.085,y:.065,exponent:.16},{rx:.085,rz:.085,y:.214,exponent:.16},{rx:.076,rz:.076,y:.223,exponent:.16},{rx:.067,rz:.067,y:.223,exponent:.16},{rx:.071,rz:.071,y:.062,exponent:.16},{rx:0,y:.059}],[.360,.19],32);
  b.box('静态闭合壶盖','ceramicTeal',[.280,.216,.110],[.160,.022,.160],.007,0);b.box('铜盖钮','bronze',[.345,.235,.177],[.030,.014,.027],.002);
  nozzle('开放茶嘴','ceramicTeal',[.278,.186,.17],.048,.021,Math.PI/3);
  for(const x of[.282,.423])b.box('木提梁立足','wood',[x,.226,.181],[.018,.061,.025],.002);b.box('木提梁横握','woodEdge',[.282,.273,.181],[.159,.017,.025],.002,0);motif(.334,.116,.105,.056);
  b.reflectX(.50);return done('透水木茶盘、四只空心杯、连续青釉壶与木提梁',{scope:'one tea-set master; no liquid or separate tea-room furnishings',cupFloors:[.058]});
 }
 if(catalogId==='LIFE-050'){
  cabinet(.80,.76,.54,true);for(const x of[.263,.526])b.box('柜内分隔','wood',[x,.090,.020],[.026,.637,.502],.002);
  for(const y of[.30,.50])b.box('右部开放搁层','wood',[.056,y,.032],[.220,.021,.472],.0015,0);door(.551,.116,-.009,.192,.585);
  for(const y of[.16,.435]){b.box('抽屉底','wood',[.278,y+.003,.024],[.245,.019,.478],.001,0);for(const x of[.274,.509])b.box('抽屉侧壁与滑轨','wood',[x,y+.006,.026],[.017,.23,.469],.001);b.box('抽屉前板','woodEdge',[.277,y,-.009],[.246,.248,.040],.002,0);b.box('抽屉浅石芯','stone',[.296,y+.023,-.013],[.208,.203,.014],.001);pull(.342,y+.102,-.009,.113);}
  return done('左门中双屉右开架，独立石芯与真实背部检修孔',{scope:'cabinet body only; separate basin and toiletries remain independent'});
 }
 if(catalogId==='LIFE-051'){
  shell('连续瓷盆与真实排水孔','ceramicWhite',[{rx:.017,y:.021},{rx:.25,rz:.14,y:.021,exponent:.20},{rx:.355,rz:.225,y:.151,exponent:.20},{rx:.365,rz:.235,y:.160,exponent:.20},{rx:.315,rz:.185,y:.160,exponent:.20},{rx:.22,rz:.12,y:.042,exponent:.20},{rx:.017,y:.042}],[.37,.235]);
  shell('独立排水法兰','metalBright',[{rx:.029,y:.038},{rx:.031,y:.048},{rx:.017,y:.048},{rx:.017,y:.021}],[.37,.235],32);
  b.box('盆后龙头承台','ceramicWhite',[.29,.142,.425],[.23,.019,.039],.002);b.box('黑色龙头座','metal',[.333,.157,.422],[.060,.020,.046],.003);b.box('龙头立柱','metal',[.344,.170,.429],[.041,.181,.035],.005);b.box('龙头出水臂','metal',[.331,.326,.233],[.067,.036,.222],.005,0);nozzle('开放龙头水嘴','metal',[.366,.322,.254],.022,.019);
  b.box('阀钮承座','metal',[.484,.154,.423],[.042,.044,.043],.003);b.box('独立铜阀柄','bronze',[.495,.193,.413],[.022,.015,.061],.002,0);nail(.501,.183,.421);
  frame('溢流金属框','metalBright',.347,.111,.412,.047,.022,.005,.015);
  return done('厚壁连续瓷盆、真实排水口、溢流框和开放水嘴',{drainCenter:[.37,.235],drainRadius:.017,scope:'empty basin and faucet; no water flow'});
 }
 if(catalogId==='LIFE-052'){
  shell('连续空心坐便瓷体','ceramicWhite',[{rx:.028,y:0},{rx:.10,rz:.155,y:0},{rx:.130,rz:.187,y:.075},{rx:.131,rz:.194,y:.270},{rx:.18,rz:.253,y:.378},{rx:.186,rz:.262,y:.405},{rx:.132,rz:.186,y:.405},{rx:.114,rz:.152,y:.286},{rx:.035,y:.18}],[.195,.264]);
  shell('厚壁独立座圈','polymer',[{rx:.178,rz:.256,y:.399},{rx:.188,rz:.265,y:.416},{rx:.184,rz:.263,y:.430},{rx:.126,rz:.183,y:.430},{rx:.122,rz:.180,y:.408}],[.195,.264]);
  b.box('独立水箱','ceramicWhite',[.031,.392,.510],[.328,.367,.172],.014);b.box('水箱盖','ceramicWhite',[.023,.753,.506],[.344,.032,.182],.008,0);
  const lid=sectionShell('打开的连续坐便盖',b.role('polymer'),[{rx:0,y:0},{rx:.141,rz:.177,y:0},{rx:.15,rz:.183,y:.012},{rx:.142,rz:.177,y:.024},{rx:0,y:.024}],[0,0],p.materials[b.role('polymer')].solid,48);b.mesh(rigidMesh(lid,[.195,.615,.498],Math.PI/2));
  for(const x of[.087,.258])b.cylinder('实际盖板铰轴','metal',[x,.437,.503],[x+.049,.437,.503],.018,16);
  b.box('侧面控制盒','metal',[.349,.587,.546],[.037,.125,.081],.003);b.box('侧面独立屏底','screen',[.383,.613,.555],[.005,.080,.060],.0005);for(let j=0;j<3;j++)b.box('侧面静态显示','displayGlyph',[.387,.624+j*.018,.566],[.003,.008,.040],.0004);nail(.379,.597,.558);
  const outlet=sectionShell('真实后部排水端口',b.role('metal'),[{rx:.030,y:0},{rx:.030,y:.243},{rx:.017,y:.243},{rx:.017,y:0}],[0,0],p.materials[b.role('metal')].solid,24);b.mesh(rigidMesh(outlet,[.195,.17,.425],Math.PI/2));
  return done('空心瓷体、厚座圈、打开盖板和水箱侧面独立控制盒',{scope:'static open lid; concealed hydraulic trap and flush state are not simulated'});
 }
 if(catalogId==='LIFE-053'){
  shell('连续深石浴盆与排水口','stone',[{rx:.024,y:.084},{rx:.344,rz:.770,y:.084,exponent:.16},{rx:.380,rz:.812,y:.510,exponent:.16},{rx:.390,rz:.820,y:.550,exponent:.16},{rx:.320,rz:.738,y:.550,exponent:.16},{rx:.284,rz:.681,y:.124,exponent:.16},{rx:.024,y:.124}],[.390,.820]);
  shell('独立浴盆排水法兰','metalBright',[{rx:.036,y:.117},{rx:.037,y:.133},{rx:.024,y:.133},{rx:.024,y:.084}],[.39,.82],32);
  for(const x of[.015,.721])b.box('浴盆底边承梁','metal',[x,.075,.040],[.044,.060,1.56],.003);for(const z of[.040,1.556])b.box('浴盆端底梁','metal',[.017,.075,z],[.746,.06,.044],.003,0);
  for(const x of[.047,.659])for(const z of[.071,1.463]){b.box('独立石脚','stone',[x,0,z],[.074,.10,.096],.004);corner(x,.077,z-.008,.07,.09);}
  for(let j=0;j<5;j++)for(const x of[.013,.735])b.box('独立裙板','metal',[x,.120,.070+j*.296],[.031,.389,.282],.003);
  for(const z of[.018,1.596])b.box('浴盆端裙板','metal',[.062,.120,z],[.656,.389,.031],.003,0);
  b.box('龙头安装座','metal',[.475,.530,1.542],[.066,.025,.072],.003);b.box('浴盆龙头柱','metal',[.489,.547,1.55],[.043,.177,.041],.004);b.box('浴盆出水臂','metal',[.477,.694,1.352],[.067,.036,.229],.004,0);nozzle('浴盆开放水嘴','metalBright',[.510,.687,1.376],.023,.018);
  for(const x of[.225,.317]){b.box('独立浴盆阀座','metal',[x,.535,1.550],[.041,.049,.040],.002);b.box('铜阀柄','bronze',[x+.012,.577,1.533],[.020,.015,.065],.002);nail(x+.015,.561,1.54);}
  b.box('独立橡胶头枕','rubber',[.25,.538,1.48],[.28,.048,.150],.006,0);
  return done('连续深石盆、十块独立金属裙板、真实排水口与实接底脚',{drainCenter:[.39,.82],drainRadius:.024,scope:'empty bath master; no water or hydraulic simulation'});
 }
 if(catalogId==='LIFE-054'){
  b.box('低门槛','metal',[0,0,0],[.92,.070,.19],.004,0);frame('连续屏框','metal',.025,.050,.034,.870,1.830,.049,.081);
  for(const x of[.071,.818])b.box('前木框饰面','wood',[x,.096,-.008],[.031,1.745,.049],.002);b.box('上木框饰面','wood',[.071,1.809,-.008],[.778,.032,.049],.002,0);
  b.box('独立透明玻璃','glass',[.091,.09,.067],[.738,1.744,.014],.001);frame('玻璃独立蚀刻框','glassEtch',.140,.155,.064,.643,1.620,.005,.005);motif(.430,1.09,.064,.20,'glassEtch');
  for(const y of[.355,.510])b.box('细蚀刻分段','glassEtch',[.196,y,.064],[.532,.004,.005],.0003,0);pull(.083,.706,.018,.352,true);control(.018,.40,-.03,.058,.36);
  for(const x of[.02,.85])for(const y of[.06,1.81]){corner(x,y,-.015,.055,.07);b.box('角件真实背托','metal',[x,y,.01],[.055,.07,.040],.002);}
  b.reflectX(.92);
  return done('透明玻璃与独立蚀刻、连续屏框、低门槛和实接握柄',{scope:'independent static screen; no bathroom assembly or moving-door claim'});
 }
 if(catalogId==='LIFE-055'){
  b.box('独立木镜背','wood',[.042,.050,.086],[.526,.704,.018],.002);frame('连续金属镜框','metal',.035,.043,.058,.540,.715,.035,.061);
  b.box('独立背镀镜芯','mirrorGlass',[.067,.075,.073],[.476,.649,.015],.001);frame('青色光学细边','opticsGlow',.064,.072,.058,.483,.656,.007,.020);
  for(const x of[.013,.556]){b.box('实际侧灯槽','metal',[x,.097,.048],[.041,.635,.043],.003);b.box('独立暖色灯面','warm',[x+.011,.115,.022],[.020,.596,.033],.002);}
  b.box('窄木搁台','woodEdge',[.030,.015,-.030],[.550,.035,.210],.003,0);for(const x of[.094,.446])b.box('真实背部挂座','metal',[x,.134,.100],[.066,.110,.037],.002);
  for(const x of[.023,.537])for(const y of[.047,.717])corner(x,y,.037,.054,.065);
  return done('独立镜芯、连续金属框、青色内边、暖色侧灯与真实背挂座',{reflection:'existing PBR mirror response; no planar scene reflection',scope:'single wall mirror'});
 }
 if(catalogId==='LIFE-056'){
  cut('四口连通中央接头','metal',[.115,.135,.025],[.11,.11,.11],[{min:[-.01,.175,.063],size:[.36,.030,.034]},{min:[.155,-.01,.063],size:[.030,.40,.034]}]);
  const arm=(start:number,end:number,horizontal=false)=>{const m=sectionShell('连续圆截面开口支管',b.role('metal'),[{rx:.034,y:start},{rx:.034,y:end},{rx:.018,y:end},{rx:.018,y:start}],[0,0],p.materials[b.role('metal')].solid,32);return b.mesh(rigidMesh(m,horizontal?[0,.19,.08]:[.17,0,.08],0,horizontal?-Math.PI/2:0));};
  arm(0,.145);arm(.235,.38);arm(0,.130,true);arm(.210,.34,true);
  const flange=(at:number,horizontal=false)=>{const m=sectionShell('独立铜法兰',b.role('bronze'),[{rx:.052,y:at},{rx:.052,y:at+.018},{rx:.033,y:at+.018},{rx:.033,y:at}],[0,0],p.materials[b.role('bronze')].solid,16);b.mesh(rigidMesh(m,horizontal?[0,.19,.08]:[.17,0,.08],0,horizontal?-Math.PI/2:0));for(let j=0;j<4;j++){const a=j*Math.PI/2,u=.042*Math.cos(a),v=.042*Math.sin(a);if(horizontal)b.cylinder('法兰钢螺栓','metalBright',[at-.003,.19+u,.08+v],[at+.025,.19+u,.08+v],.006,8);else b.cylinder('法兰钢螺栓','metalBright',[.17+u,at-.003,.08+v],[.17+u,at+.025,.08+v],.006,8);}};
  for(const at of[.027,.329])flange(at);for(const at of[.023,.291])flange(at,true);
  b.cylinder('检修阀轴','metalBright',[.270,.190,.056],[.270,.190,-.017],.011,16);const wheel=sectionShell('红色安全涂装手轮',b.role('safetyMetal'),[{rx:.037,y:0},{rx:.037,y:.010},{rx:.026,y:.010},{rx:.026,y:0}],[0,0],p.materials[b.role('safetyMetal')].solid,24);b.mesh(rigidMesh(wheel,[.270,.19,-.028],Math.PI/2));
  for(let j=0;j<4;j++){const a=j*Math.PI/2;b.member('手轮径向辐条','safetyMetal',[.27,.19,-.020],[.27+.035*Math.cos(a),.19+.035*Math.sin(a),-.020],.009,.009,.001);}
  b.cylinder('手轮中心铜帽','bronze',[.27,.19,-.023],[.27,.19,-.032],.011,16);nail(.265,.185,-.025,'metalBright');
  b.cylinder('独立阀柄轴','metalBright',[.064,.19,.056],[.064,.19,-.017],.010,16);b.box('独立青色金属阀柄','metalTeal',[.029,.184,-.029],[.100,.018,.023],.002,0);nail(.057,.191,-.020);
  const port=(id:string,position:V3,normal:V3):Port=>({id,kind:'open-pipe',position,normal,size:[.036,.036,.036],pitch:.005});
  return done('四口真实贯通管腔、连续圆支管、独立法兰螺栓及两种金属阀柄',{scope:'open communicating geometry; no flow or valve-state simulation'},[port('left',[0,.19,.08],[-1,0,0]),port('right',[.34,.19,.08],[1,0,0]),port('bottom',[.17,0,.08],[0,-1,0]),port('top',[.17,.38,.08],[0,1,0])]);
 }
 if(catalogId==='LIFE-057'){
  for(const x of[.015,.485]){b.box('墙面实装板','metal',[x,.258,.075],[.050,.142,.023],.003);b.box('木挂杆支臂','wood',[x,.327,-.003],[.050,.047,.098],.003);corner(x,.337,-.006,.048,.044);}
  b.cylinder('连续圆木挂杆','woodEdge',[.053,.352,.035],[.497,.352,.035],.012,32);
  for(const [x,w,bottom,back,role,motifRole,low]of[[.300,.175,.005,.065,'cottonWhite','fabricEdge',.025],[.105,.150,.065,.110,'fabric','wovenLight',.085]]as const){
   b.mesh(towelStrip('完整前后褶皱毛巾',b.role(role),x,w,bottom,back,p.materials[b.role(role)].solid));const band=b.mesh(towelStrip('独立织入回纹带',b.role(role),x,w,bottom,back,p.materials[b.role(role)].solid,[low,low+.065]));band.wovenPattern={version:1,design:'hui-towel-v1',width:1024,height:384,sizeM:[.18,.065],materials:{ground:b.role(role),motif:b.role(motifRole)}};
  }
  return done('双毛巾真实薄壁、绕杆弧面、连续褶皱与独立双色织纹',{scope:'white longer towel on reference-left; static folded cloth, no dynamics'});
 }
 if(catalogId==='LIFE-064'){
  cabinet(1.64,.955,.76);b.box('展示与实柜中隔','wood',[1.017,.089,.025],[.032,.833,.702],.002);
  for(const y of[.327,.650])b.box('独立玻璃展示层板','glass',[.056,y,.027],[.974,.014,.707],.001,0);frame('展示腔前金属框','metal',.039,.100,.008,.978,.802,.020,.032);b.box('展示前玻璃','glass',[.055,.118,.006],[.950,.767,.014],.001);b.box('展示层金属前边','metal',[.048,.488,.006],[.962,.016,.031],.001,0);
  door(1.071,.109,-.010,.505,.791);const hole={min:[.188,.925,.356]as V3,size:[.044,.12,.044]as V3};cut('连续木台沿与真实走线口','woodEdge',[0,.931,0],[1.64,.066,.76],[hole]);cut('浅石台面真实走线口','stone',[.031,.992,.027],[1.578,.028,.706],[hole]);
  for(const x of[.018,1.577]){b.box('侧向灯承槽','metal',[x,.127,-.004],[.047,.733,.033],.002);b.box('独立暖色灯面','warm',[x+.012,.145,-.016],[.021,.693,.018],.001);}
  return done('独立展示腔、石木台沿、浅石柜门回纹与实际走线口',{scope:'empty counter master; stock, cash terminal and scale remain separate assets',cableHole:[.210,.378]});
 }
 throw Error('Domestic refinement not implemented '+catalogId);
}
