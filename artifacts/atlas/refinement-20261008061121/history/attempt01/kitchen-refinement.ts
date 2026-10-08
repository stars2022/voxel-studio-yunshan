import type {Asset,Project,Port,V3} from '../core/types';
import {makeLifeAsset} from './life';
import {DetailBuilder} from './refinement-builder';
import {slottedPlate} from './refinement-detail-shapes';
import {rigidMesh} from './mesh-shapes';
import {sectionShell,glazeStroke,type Section} from './kitchen-refinement-shapes';

export const kitchenRefinementIds=['LIFE-031','LIFE-032','LIFE-037','LIFE-038','LIFE-039','LIFE-040','LIFE-041','LIFE-042','LIFE-043','LIFE-044','LIFE-045','LIFE-046'];
const port=(id:string,kind:string,position:V3,normal:V3,size:V3):Port=>({id,kind,position,normal,size,pitch:.005});

export function makeKitchenRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,p:Project):Asset{
 const b=new DetailBuilder(p,makeLifeAsset(catalogId,name,id,style),style);
 const shell=(name:string,role:string,profile:Section[],center:[number,number],segments=48)=>b.mesh(sectionShell(name,b.role(role),profile,center,p.materials[b.role(role)].solid,segments));
 const frame=(name:string,role:string,x:number,y:number,z:number,w:number,h:number,t=.025,depth=.024)=>{
  for(const xx of[x,x+w-t])b.box(name+'立边',role,[xx,y,z],[t,h,depth],.002);
  for(const yy of[y,y+h-t])b.box(name+'横边',role,[x,yy,z],[w,t,depth],.002,0);
 };
 const nail=(x:number,y:number,z:number,role='bronze')=>b.voxel(role,[x,y,z],[.01,.01,.005]);
 const pull=(x:number,y:number,z:number,length:number,vertical=false)=>{
  for(const offset of[0,length-.018])b.box('拉手连接脚','metal',[x+(vertical?0:offset),y+(vertical?offset:0),z+.008],[.018,.018,.037],.002);
  b.box('黄铜握杆','bronze',[x,y,z],[vertical?.018:length,vertical?length:.018,.016],.003,vertical?1:0);
 };
 const control=(x:number,y:number,z:number,w=.085,h=.11)=>{
  b.box('操作模块外框','metal',[x,y,z],[w,h,.035],.003);
  b.box('独立屏幕底','screen',[x+.008,y+.028,z-.002],[w-.016,h-.04,.004],.0006);
  b.box('静态显示图形','displayGlyph',[x+.015,y+h-.035,z-.004],[w-.03,.01,.003],.0005);
  nail(x+.01,y+.008,z-.004);
 };
 const door=(x:number,y:number,z:number,w:number,h:number,glass=false,handleSide:'left'|'right'='right')=>{
  frame('柜门攒边','woodEdge',x,y,z,w,h,.025,.037);
  frame('柜门内压边','metal',x+.022,y+.022,z+.003,w-.044,h-.044,.006,.028);
  b.box('内凹独立门芯',glass?'glass':'enamel',[x+.027,y+.027,z+.018],[w-.054,h-.054,.016],.002);
  if(!glass){frame('门芯细压线','enamel',x+.042,y+.042,z+.010,w-.084,h-.084,.008,.01);for(const xx of[x+.049,x+w-.059])for(const yy of[y+.049,y+h-.059])nail(xx,yy,z+.009,'metal');}
  for(const yy of[y+.06,y+h-.10]){b.box('柜门铰链','metal',[handleSide==='right'?x-.008:x+w-.008,yy,z+.006],[.017,.04,.04],.002);nail(handleSide==='right'?x-.006:x+w-.004,yy+.014,z+.002);}
  pull(handleSide==='right'?x+w-.06:x+.04,y+h*.42,z-.022,Math.min(.22,h*.32),true);
 };
 const corner=(x:number,y:number,z:number,w=.065,h=.075)=>{
  b.box('独立铁包角','metal',[x,y,z],[w,h,.035],.004);b.voxel('bronze',[x+.015,y+.02,z-.005],[Math.max(.01,w-.03),Math.max(.01,h-.04),.01]);
 };
 const cabinet=(w:number,h:number,d:number,metal=false,backHole=false)=>{
  for(const x of[.018,w-.082])for(const z of[.012,d-.076]){
   b.box('独立底脚',metal?'rubber':'stone',[x-.008,0,z-.006],[.080,.05,.078],.004);
   b.box('贯通承重角柱',metal?'metal':'wood',[x,.043,z],[.064,h-.064,.064],.004);
  }
  for(const y of[.085,h-.038])b.box('柜体横向承板',metal?'enamel':'wood',[.024,y,.014],[w-.048,.038,d-.028],.003,0);
  for(const x of[.031,w-.051])b.box('柜体侧壁',metal?'enamel':'wood',[x,.12,.035],[.02,h-.157,d-.07],.002,1);
  if(backHole)b.mesh(slottedPlate('背板真实管线口',b.role('wood'),[.040,.12,d-.038],[w-.08,h-.157,.02],[{x:.22,y:.20,width:.16,height:.15}],p.materials[b.role('wood')].solid));
  else b.box('独立柜背板',metal?'enamel':'wood',[.04,.12,d-.036],[w-.08,h-.157,.018],.002,1);
  for(const x of[.008,w-.073])for(const y of[.085,h-.09])corner(x,y,-.012);
 };
 const done=(features:string,details:Record<string,unknown>={},ports?:Port[])=>{const a=b.finish(features,{sheet:'M002',expectedContactGroups:1,...details});if(ports)a.ports=ports;return a;};

 if(catalogId==='LIFE-031'){
  b.box('连续地毯包边底层','fabricEdge',[0,0,0],[1.8,.012,1.2],.002,0);
  const top=b.box('真实四角回纹织面','fabric',[.018,.010,.018],[1.764,.004,1.164],.0008,0);
  top.wovenPattern={version:1,design:'hui-rug-v1',width:1024,height:768,sizeM:[1.8,1.2],materials:{ground:b.role('fabric'),motif:b.role('wovenLight')}};
  for(let k=0;k<top.positions.length/3;k++){top.uvs[k*2]=(top.positions[k*3]-.018)/1.764;top.uvs[k*2+1]=(top.positions[k*3+2]-.018)/1.164;}
  for(let k=0;k<22;k++)for(const x of[-.045,1.79]){const z=.035+k*.0525;b.voxel('wovenLight',[x,.005,z],[.055,.005,.015]);b.voxel('fabricEdge',[x<0?-.010:1.79,.005,z-.005],[.020,.01,.025]);}
  return done('低厚度连续地毯、双线四角回纹真实织物贴图与最小块件短穗',{scope:'single rug; real palette-derived woven artwork'});
 }
 if(catalogId==='LIFE-032'){
  const w=1.6,d=.76,h=.82;
  for(const x of[.025,w-.095])for(const z of[.02,d-.09]){b.box('浅石脚座','stone',[x-.015,0,z-.012],[.10,.065,.095],.004);b.box('连续木桌腿','wood',[x,.055,z],[.07,h-.11,.07],.005);corner(x-.003,.64,z-.012,.076,.11);}
  b.box('木攒边承托台面','woodEdge',[0,.755,0],[w,.05,d],.006,0);
  b.box('浅石嵌芯操作面','stone',[.035,.799,.032],[w-.07,.021,d-.064],.004,0);
  for(const z of[.022,d-.055])b.box('桌下横向束腰','wood',[.07,.654,z],[w-.14,.115,.034],.003,0);
  for(const x of[.046,w-.08]){b.box('两侧贯通脚枨','wood',[x,.22,.045],[.034,.045,d-.09],.003,0);b.member('连续斜向侧撑','metal',[x+.017,.242,.065],[x+.017,.674,d-.065],.018,.024,.002);}
  b.box('后部脚枨','wood',[.07,.22,d-.085],[w-.14,.045,.035],.003,0);
  b.box('抽屉底板','wood',[.13,.574,.035],[.52,.019,.40],.002,0);
  for(const x of[.13,.634])b.box('抽屉侧板','wood',[x,.584,.025],[.016,.108,.42],.002);
  b.box('抽屉后板','wood',[.13,.584,.424],[.52,.108,.016],.002,0);
  b.box('独立抽屉前脸','woodEdge',[.12,.582,-.012],[.54,.11,.036],.004,0);pull(.31,.62,-.045,.16);
  for(const x of[.005,w-.075])corner(x,.75,-.008,.07,.068);
  b.box('侧向工具轨','metal',[w-.055,.52,.11],[.07,.025,d-.22],.002,0);
  for(const z of[.15,.29,.43,.57]){b.box('工具挂扣','metal',[w+.002,.447,z],[.016,.09,.025],.002);b.voxel('bronze',[w+.005,.445,z-.005],[.02,.015,.035]);}
  control(.075,.626,-.036,.085,.11);
  return done('连续倒角攒边石台、真实抽屉空腔、贯通侧撑、开放膝部与可分选工具挂轨',{kneeClearanceM:{min:[.72,.05,.03],max:[1.46,.64,.62]}});
 }
 if(catalogId==='LIFE-037'){
  cabinet(1.2,.82,.6,false,true);
  b.box('柜体中分隔','wood',[.582,.123,.032],[.026,.66,.528],.002);
  b.box('右部开放层板','wood',[.602,.365,.026],[.55,.022,.535],.002,0);
  b.box('左门后层板','wood',[.054,.41,.040],[.53,.022,.51],.002,0);
  // From the shared camera the cabinet's closed door is on the left.
  door(.619,.142,-.016,.516,.578);
  b.box('右抽屉底','wood',[.065,.624,.032],[.495,.018,.50],.002,0);
  b.box('浅抽屉前板','woodEdge',[.065,.641,-.010],[.495,.11,.034],.003,0);pull(.236,.681,-.042,.15);
  return done('厨房下柜木构、内凹门芯、独立浅屉与开放搁层，背板保留真实管线口',{scope:'cabinet body only; countertop and stored containers remain independent'},[port('base','base',[.6,0,.3],[0,-1,0],[1.18,0,.59]),port('countertop','countertop',[.6,.82,.3],[0,1,0],[1.152,0,.572])]);
 }
 if(catalogId==='LIFE-038'){
  const slots=[{x:.33,y:.31,width:.46,height:.35},{x:.915,y:.31,width:.43,height:.35}];
  for(const [name,role,top,thickness]of[['台面金属承托','metal',.025,.025],['石台连续真开孔','stone',.060,.035]]as const){
   const m=slottedPlate(name,b.role(role),[0,0,0],[1.24,.64,thickness],slots,p.materials[b.role(role)].solid);
   b.mesh(rigidMesh(m,[0,top,0],Math.PI/2));
  }
  for(const x of[.006,1.204])b.box('木台面短收边','woodEdge',[x,.019,.008],[.030,.045,.624],.003,0);
  for(const z of[.005,.615])b.box('木台面长收边','woodEdge',[.007,.018,z],[1.226,.035,.020],.003,0);
  b.box('后挡水条','stone',[.022,.053,.599],[1.196,.061,.025],.004,0);
  for(const x of[.004,1.191])for(const z of[.004,.589]){b.box('台面角件','metal',[x,.021,z],[.044,.035,.046],.003);b.voxel('bronze',[x+.01,.045,z+.01],[.02,.015,.025]);}
  const a=done('双真实贯通安装孔、连续石面和木金属收边',{throughSlots:slots,scope:'countertop only; no duplicate legs, basin or cooking appliance'},[port('base','countertop',[.62,0,.32],[0,-1,0],[1.24,0,.64]),port('sink-cutout','counter-cutout',[.33,.06,.31],[0,1,0],[.46,0,.35]),port('hob-cutout','counter-cutout',[.915,.06,.31],[0,1,0],[.43,0,.35])]);
  a.openings=slots.map(s=>({min:[s.x-s.width/2,0,s.y-s.height/2],max:[s.x+s.width/2,.06,s.y+s.height/2]}));return a;
 }
 if(catalogId==='LIFE-039'){
  b.box('独立灶具底壳','metal',[0,0,0],[.72,.052,.52],.005);
  b.box('灶面金属分区','metalBright',[.022,.047,.075],[.676,.015,.42],.004,0);
  for(const x of[.18,.54]){
   shell('开口承锅圈','metal',[{rx:.112,y:.059},{rx:.119,y:.067},{rx:.117,y:.078},{rx:.083,y:.078},{rx:.080,y:.063}],[x,.29]);
   shell('独立钢质燃烧环','metalBright',[{rx:.062,y:.062},{rx:.067,y:.074},{rx:.048,y:.074},{rx:.046,y:.062}],[x,.29]);
   for(let j=0;j<4;j++){const a=j*Math.PI/2;b.member('分离径向锅架','metal',[x+.065*Math.cos(a),.079,.29+.065*Math.sin(a)],[x+.133*Math.cos(a),.088,.29+.133*Math.sin(a)],.017,.021,.002);}
  }
  for(const x of[.12,.28,.44,.60]){b.cylinder('独立旋钮','bronze',[x,.027,-.013],[x,.027,-.035],.017,24);b.voxel('metal',[x-.005,.035,-.04],[.005,.01,.01]);}
  shell('连续斜面烟罩壳','metal',[{rx:.34,rz:.245,y:.85,exponent:.16},{rx:.13,rz:.105,y:1.035,exponent:.16},{rx:.113,rz:.088,y:1.035,exponent:.16},{rx:.322,rz:.227,y:.858,exponent:.16}],[.36,.265],48);
  for(const x of[.015,.680])b.box('烟罩下口侧框','metal',[x,.834,.014],[.025,.028,.502],.003,0);
  for(const z of[.014,.491])b.box('烟罩下口横框','metal',[.015,.834,z],[.690,.028,.025],.003,0);
  for(let j=0;j<14;j++)b.box('真实间隙进气格','metalBright',[.047+j*.047,.837,.035],[.012,.014,.46],.001,0);
  shell('顶部贯通烟道','metal',[{rx:.124,rz:.099,y:1.015,exponent:.16},{rx:.124,rz:.099,y:1.30,exponent:.16},{rx:.11,rz:.085,y:1.30,exponent:.16},{rx:.11,rz:.085,y:1.015,exponent:.16}],[.36,.265],48);
  for(const x of[.022,.641])corner(x,.837,-.011,.055,.063);
  b.box('烟罩工作灯芯','warm',[.20,.838,.006],[.32,.012,.014],.002,0);
  for(const x of[.115,.555])b.box('烟罩墙面挂耳','metal',[x,.876,.474],[.05,.085,.045],.003);
  return done('双圆灶圈与连续斜烟罩，灶具和烟罩保持两个可分别安装部件',{expectedContactGroups:2,scope:'separate hob and wall hood; no invented connecting cabinet or wall; no flame simulation'},[port('hob-base','base',[.36,0,.26],[0,-1,0],[.71,0,.51]),port('hood-wall','wall',[.385,.925,.519],[0,0,1],[.49,.04,0])]);
 }
 if(catalogId==='LIFE-040'){
  shell('连续内收水槽及真实排水孔','metalBright',[{rx:.017,rz:.017,y:.025},{rx:.243,rz:.155,y:.025,exponent:.20},{rx:.318,rz:.226,y:.180,exponent:.20},{rx:.292,rz:.191,y:.180,exponent:.20},{rx:.215,rz:.13,y:.047,exponent:.20},{rx:.017,rz:.017,y:.047}],[.33,.23],48);
  shell('厚翻边水槽唇口','metalBright',[{rx:.319,rz:.226,y:.169,exponent:.20},{rx:.323,rz:.23,y:.180,exponent:.20},{rx:.293,rz:.192,y:.187,exponent:.20},{rx:.288,rz:.187,y:.176,exponent:.20}],[.33,.23],48);
  shell('实际排水法兰','metal',[{rx:.028,y:.041},{rx:.030,y:.049},{rx:.017,y:.049},{rx:.017,y:.026},{rx:.020,y:.026}],[.33,.23],48);
  b.box('龙头后承台','metalBright',[.23,.171,.414],[.27,.02,.052],.003,0);
  b.box('龙头安装座','metal',[.300,.181,.413],[.075,.020,.052],.004);
  b.box('连续龙头立管','metalBright',[.319,.197,.423],[.041,.194,.036],.006);
  b.box('连续转角出水臂','metalBright',[.309,.357,.239],[.06,.037,.216],.006,0);
  shell('厚壁开放出水嘴','metal',[{rx:.020,y:.348},{rx:.020,y:.366},{rx:.009,y:.366},{rx:.009,y:.348}],[.339,.259],32);
  b.voxel('bronze',[.330,.351,.241],[.015,.01,.01]);
  b.box('独立阀钮承座','metal',[.43,.185,.416],[.045,.057,.042],.004);
  b.box('连续阀柄','bronze',[.442,.232,.395],[.021,.014,.070],.003,0);nail(.448,.205,.411);
  const a=done('连续内收金属盆壁、开放盆腔和贯通排水法兰，厚壁龙头与独立阀钮',{drainCenter:[.33,.23],drainRadius:.017,scope:'basin and faucet only; no cabinet or fake water stream'},[port('counter-rim','countertop',[.33,.169,.23],[0,-1,0],[.636,0,.452])]);a.openings=[{min:[.30,.024,.20],max:[.36,.20,.26]}];return a;
 }
 if(catalogId==='LIFE-041'){
  const w=.8,h=.68,d=.32;
  for(const x of[.008,.391,.77])b.box('吊柜贯通立板','wood',[x,.02,.012],[.022,h-.032,d-.024],.002);
  for(const y of[.02,.32,.645])b.box('吊柜横板','wood',[.009,y,.011],[.782,.025,.298],.003,0);
  b.box('吊柜背板','wood',[.01,.04,.296],[.78,.605,.015],.002);
  for(let j=0;j<4;j++)door(.023+j*.192,.059,-.018,.183,.563,j<2,j%2?'left':'right');
  for(const x of[.004,.736])for(const y of[.024,.602])corner(x,y,-.028,.060,.074);
  for(const x of[.115,.605]){b.box('独立下照灯座','metal',[x,.005,.08],[.08,.026,.055],.003);b.box('下照光芯','warm',[x+.008,.001,.087],[.064,.01,.040],.001);}
  b.box('实际墙装挂梁','metal',[.070,.532,.305],[.66,.055,.022],.003,0);
  return done('独立实门和玻璃门、连续攒边、内层板及真实背挂梁',{scope:'hanging cabinet; dishes remain independent'},[port('wall','wall',[.4,.558,.327],[0,0,1],[.648,.044,0])]);
 }
 if(catalogId==='LIFE-042'){
  cabinet(.96,1.7,.46);
  b.box('食品柜中分隔','wood',[.464,.122,.030],[.025,1.54,.391],.002);
  for(const y of[.397,.678,.959,1.24])b.box('开放食品搁板','wood',[.484,y,.031],[.42,.023,.39],.002,0);
  for(const y of[.65,1.17])b.box('门内食品搁板','wood',[.053,y,.031],[.410,.023,.39],.002,0);
  door(.061,.147,-.015,.192,1.445,false,'right');door(.261,.147,-.015,.192,1.445,false,'left');
  return done('高食品柜真实开放层架、成对长门、木纹方向与独立铜拉手',{scope:'empty cabinet, no inventory props fused into the master'});
 }
 if(catalogId==='LIFE-043'){
  cabinet(.68,1.82,.68,true);
  for(const y of[.22,.58,.94,1.30])b.box('冷藏独立内层板','polymer',[.060,y,.080],[.56,.015,.54],.002,0);
  for(let j=0;j<2;j++){
   const x=.025+j*.315;frame('真实门封环','rubber',x,.151,-.018,.307,1.591,.018,.024);
   b.box('双温区门板','enamel',[x+.014,.168,-.031],[.279,1.559,.032],.007);
   frame('门板浅压边','enamel',x+.028,.182,-.034,.25,1.53,.009,.008);
   pull(j?x+.035:x+.250,.57,-.071,.63,true);
   for(const y of[.21,1.66])nail(x+.038,y,-.04,'metal');
  }
  control(.083,1.25,-.061,.095,.272);
  for(let j=0;j<11;j++)b.box('底部真实间隔散热叶','trim',[.076+j*.047,.045,-.012],[.022,.068,.023],.002);
  for(let j=0;j<9;j++)b.box('背部换热肋','metal',[.077+j*.061,.29,.651],[.015,1.34,.034],.0015);
  return done('双温区连续冷藏门、真实门封环、长拉手、独立内腔及通风叶',{scope:'static shell; refrigeration and inventory not bound'});
 }
 if(catalogId==='LIFE-044'){
  shell('连续厚壁空心锅体','metalBright',[{rx:0,y:.007},{rx:.087,y:.007},{rx:.114,y:.022},{rx:.127,y:.063},{rx:.13,y:.145},{rx:.134,y:.151},{rx:.131,y:.160},{rx:.119,y:.160},{rx:.118,y:.141},{rx:.115,y:.064},{rx:.104,y:.026},{rx:0,y:.026}],[.18,.14],48);
  shell('独立黑色锅底脚','metal',[{rx:.075,y:0},{rx:.092,y:0},{rx:.097,y:.013},{rx:.079,y:.016}],[.18,.14],48);
  for(const left of[true,false]){const x=left?.003:.288;for(const z of[.096,.170])b.box('锅耳径向托臂','metal',[x,.103,z],[.070,.022,.020],.003,0);b.box('木质耳柄握段','woodEdge',[left?.002:.340,.105,.099],[.018,.028,.086],.004);for(const z of[.102,.173])b.voxel('bronze',[left?.054:.290,.12,z],[.015,.015,.015]);}
  return done('48段连续锅壁与卷口、真实锅腔、圈足及镂空双木耳柄',{interiorFloorY:.026,interiorCenter:[.18,.14],scope:'pot body only; lid remains LIFE-045'});
 }
 if(catalogId==='LIFE-045'){
  shell('厚壁金属锅盖外沿','metal',[{rx:.119,y:.003},{rx:.14,y:.003},{rx:.14,y:.015},{rx:.130,y:.024},{rx:.118,y:.023}],[.14,.14],48);
  shell('连续弧形玻璃盖芯','glass',[{rx:0,y:.056},{rx:.035,y:.054},{rx:.075,y:.045},{rx:.109,y:.028},{rx:.130,y:.014},{rx:.123,y:.009},{rx:.103,y:.024},{rx:.070,y:.039},{rx:.03,y:.048},{rx:0,y:.050}],[.14,.14],48);
  shell('黄铜玻璃压圈','bronze',[{rx:.125,y:.016},{rx:.131,y:.016},{rx:.129,y:.022},{rx:.123,y:.022}],[.14,.14],48);
  b.box('提手黄铜承座','bronze',[.107,.052,.106],[.066,.012,.068],.004);
  for(const x of[.108,.157]){b.box('镂空提手支脚','metal',[x,.062,.120],[.016,.028,.038],.003);b.voxel('bronze',[x+.005,.069,.114],[.005,.01,.01]);}
  b.box('连续桥式木握','woodEdge',[.105,.083,.118],[.070,.017,.042],.004,0);
  return done('真实厚度弧形玻璃盖、黄铜压圈与透空桥式把手',{scope:'single independent lid; transparent shell has inner and outer surfaces'});
 }
 if(catalogId==='LIFE-046'){
  shell('真实空腔连续陶碗','ceramicWhite',[{rx:0,y:.014},{rx:.043,y:.014},{rx:.055,y:.023},{rx:.074,y:.048},{rx:.095,y:.085},{rx:.101,y:.099},{rx:.098,y:.107},{rx:.090,y:.107},{rx:.087,y:.087},{rx:.067,y:.052},{rx:.045,y:.026},{rx:0,y:.026}],[.1,.1],48);
  shell('厚壁陶碗圈足','ceramicWhite',[{rx:.035,y:0},{rx:.049,y:0},{rx:.051,y:.018},{rx:.034,y:.018}],[.1,.1],48);
  const radius=(y:number)=>.074+(y-.048)/(.085-.048)*(.095-.074);
  for(const y of[.057,.081])shell('青釉边线','ceramicTeal',[{rx:radius(y)-.001,y},{rx:radius(y)+.0015,y},{rx:radius(y+.004)+.0015,y:y+.004},{rx:radius(y+.004)-.001,y:y+.004}],[.1,.1],48);
  for(let j=0;j<8;j++){const a=j*Math.PI/4,step=.043;for(const[u,v,ww,hh]of[[0,0,5,1],[0,0,1,4],[0,3,4,1],[3,1,1,3],[1,1,3,1]]as number[][]){b.mesh(glazeStroke('实际青釉回纹笔画',b.role('ceramicTeal'),[.1,.1],a+u*step,a+(u+ww)*step,.062+v*.004,.062+(v+hh)*.004,radius,p.materials[b.role('ceramicTeal')].solid));}}
  // A small base maker mark is native ceramic, with no unrelated material role.
  b.voxel('ceramicTeal',[.095,.014,.095],[.01,.005,.01]);
  return done('连续空腔陶碗、卷口圈足、独立青釉线与真实回纹嵌层',{interiorFloorY:.026,interiorCenter:[.1,.1],scope:'one bowl master; reference vessel variations are not counted as extra masters'});
 }
 throw Error('Unknown kitchen refinement '+catalogId);
}
