import type {Asset,Project,V3,Port} from '../core/types';
import {makeLifeAsset} from './life';
import {DetailBuilder} from './refinement-builder';
import {orthogonalDifference,type SolidBox} from './domestic-refinement-shapes';
import {sectionShell} from './kitchen-refinement-shapes';
import {rigidMesh} from './mesh-shapes';
import {marketCloth,marketCanopy,bagInkPolygon} from './market-refinement-shapes';
export const marketRefinementIds=Array.from({length:12},(_,i)=>'LIFE-'+String(65+i).padStart(3,'0'));
export function makeMarketRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,p:Project):Asset{
 const b=new DetailBuilder(p,makeLifeAsset(catalogId,name,id,style),style);
 const cut=(name:string,role:string,min:V3,size:V3,voids:SolidBox[])=>b.mesh(orthogonalDifference(name,b.role(role),[{min,size}],voids,p.materials[b.role(role)].solid));
 const pin=(x:number,y:number,z:number,role='bronze')=>b.voxel(role,[x,y,z],[.01,.01,.01]);
 const corner=(x:number,y:number,z:number,w=.045,h=.055,d=.045)=>{b.box('独立金属包角','metal',[x,y,z],[w,h,d],.003);pin(x+.012,y+.018,z-.005);};
 const frame=(name:string,role:string,x:number,y:number,z:number,w:number,h:number,t=.020,d=.025)=>{for(const xx of[x,x+w-t])b.box(name+'竖边',role,[xx,y,z],[t,h,d],.0015);for(const yy of[y,y+h-t])b.box(name+'横边',role,[x,yy,z],[w,t,d],.0015,0);};
 const pull=(x:number,y:number,z:number,w:number)=>{for(const xx of[x,x+w-.015])b.box('拉手实际支脚','metal',[xx,y,z-.024],[.015,.015,.031],.001);b.box('铜拉手握杆','bronze',[x,y,z-.029],[w,.015,.011],.0015,0);};
 const label=(x:number,y:number,z:number,w:number,h:number,code:number,up=false)=>{
  if(up){b.box('独立纸签','parcelLabel',[x,y,z],[w,.003,h],.0002,0);b.box('纸签印墨色头','printedWarning',[x+.009,y+.0028,z+.007],[w-.018,.0006,.011],.0001,0);for(let j=0;j<12;j++)b.box('作者登记短码墨条','parcelInk',[x+.009+j*(w-.018)/12,y+.0028,z+Math.min(.027,h*.42)],[(j%3?1:2)*.0015,.0006,h*.44],.0001);}
  else{b.box('独立纸签','parcelLabel',[x,y,z],[w,h,.004],.0002);b.box('纸签印墨色头','printedWarning',[x+.009,y+h-.023,z-.0005],[w-.018,.012,.001],.0001,0);for(let j=0;j<12;j++)b.box('作者登记短码墨条','parcelInk',[x+.009+j*(w-.018)/12,y+.010,z-.0005],[(j%3?1:2)*.0015,h*.36,.001],.0001);b.box('作者清单编号笔段','parcelInk',[x+.009,y+h*.53,z-.0005],[Math.min(w-.02,.035+code%10*.002),.003,.001],.0001,0);}
 };
 const cabinet=(w:number,h:number,d:number)=>{for(const x of[.018,w-.062])for(const z of[.018,d-.062]){b.box('退层石脚','stone',[x-.007,0,z-.007],[.060,.040,.060],.003);b.box('连续木立柱','wood',[x,.032,z],[.045,h-.051,.045],.002);corner(x-.006,h-.062,z-.006,.058,.060,.058);corner(x-.006,.034,z-.006,.058,.057,.058);}for(const y of[.042,h-.031])b.box('柜上下承板','wood',[.025,y,.025],[w-.05,.031,d-.050],.002,0);for(const x of[.028,w-.046])b.box('柜侧板','wood',[x,.066,.028],[.018,h-.10,d-.056],.0015);b.box('真实柜背','wood',[.027,.066,d-.043],[w-.054,h-.101,.018],.0015);};
 const drawer=(x:number,y:number,z:number,w:number,h:number,d:number,stone=false)=>{b.box('抽屉底板','wood',[x,y+.005,z+.025],[w,.012,d-.030],.001,0);for(const xx of[x,x+w-.012])b.box('实际屉壁及滑轨','wood',[xx,y+.011,z+.028],[.012,h-.015,d-.034],.001);b.box('抽屉后壁','wood',[x,y+.011,z+d-.015],[w,h-.015,.012],.001);b.box('独立屉前木框','woodEdge',[x-.002,y,z-.008],[w+.004,h,.035],.002,0);b.box('可单独替换屉芯',stone?'stone':'wood',[x+.015,y+.016,z-.011],[w-.030,h-.032,.012],.001,0);pull(x+w*.30,y+h*.48,z-.011,w*.40);};
 const ports=(items:{id:string;kind:string;position:V3;normal:V3;size:V3}[]):Port[]=>items.map(v=>({...v,pitch:.005}));
 const done=(features:string,details:Record<string,unknown>={},actualPorts?:Port[])=>{const a=b.finish(features,{sheet:'M004',expectedContactGroups:1,...details});a.openings=[];if(actualPorts)a.ports=actualPorts;return a;};
 if(catalogId==='LIFE-065'){
  const w=.60,d=.50;for(const x of[.014,.530])for(const z of[.015,.435]){b.box('陈列石脚','stone',[x,0,z],[.054,.040,.054],.003);b.box('木支承柱','wood',[x+.005,.030,z+.005],[.044,.350,.044],.002);corner(x-.003,.302,z-.003,.060,.073,.06);}
  b.box('底部储物承板','wood',[.025,.050,.020],[.55,.035,.46],.002,0);for(let j=0;j<2;j++){const zz=.022+j*.217,yy=.118+j*.143;b.box('真实陈列金属承板','enamel',[.014,yy,zz],[.572,.022,.243],.002,0);for(const z of[zz,zz+.224])b.box('木盘前后边','woodEdge',[.014,yy+.013,z],[.572,.055,.018],.002,0);for(const x of[.014,.568])b.box('木盘短边','woodEdge',[x,yy+.013,zz],[.018,.055,.242],.002);for(let k=1;k<4;k++)b.box('八个陈列位实际隔条','metal',[.014+k*.143,yy+.012,zz+.012],[.012,.053,.221],.001);}
  for(const x of[.072,.257,.442]){b.box('独立浅屉前板','woodEdge',[x,.060,-.006],[.166,.065,.034],.002,0);pull(x+.051,.084,-.006,.063);}
  const sites=Array.from({length:8},(_,i)=>({id:'inventory-'+i,kind:'inventory-display',position:[.086+(i%4)*.143,.144+Math.floor(i/4)*.143,.136+Math.floor(i/4)*.217]as V3,normal:[0,1,0]as V3,size:[.12,0,.18]as V3}));
  return done('两级八格空陈列托、木金属支架、分选价签接口与独立屉面',{scope:'inventory-ready empty fixture; existing shop.open/inventory renderer remains original and is not rebound',inventorySites:sites,sourceRuntimeSampleSizeM:[.4,.2,.4],sampleLimit:8},ports(sites));
 }
 if(catalogId==='LIFE-066'){
  const w=1.20,h=1.80,d=.48;for(const x of[.020,1.115])for(const z of[.020,.395]){b.box('调平石脚','stone',[x-.010,0,z-.010],[.086,.065,.086],.004);b.box('贯通木框立柱','wood',[x,.054,z],[.066,1.722,.065],.004);for(const y of[.058,1.712])corner(x-.006,y,z-.006,.078,.078,.079);}
  for(const y of[.24,.61,.98,1.35,1.72]){b.box('木围边与金属承板托','woodEdge',[.037,y,.022],[1.125,.032,.435],.002,0);b.box('独立浅涂装金属层板','enamel',[.065,y+.024,.050],[1.070,.016,.380],.002,0);for(const x of[.026,1.115])b.box('层板实际金属托件','metal',[x,y-.020,.043],[.064,.048,.387],.0015);}
  b.member('实际连续背交叉撑甲','metal',[.065,.14,.435],[1.145,1.746,.435],.021,.018,.0015);b.member('实际连续背交叉撑乙','metal',[1.145,.14,.443],[.065,1.746,.443],.021,.018,.0015);
  for(const z of[.028,.399])b.box('上部贯通木梁','wood',[.040,1.745,z],[1.120,.041,.05],.002,0);
  return done('五层独立金属承板、木攒边、背交叉撑、托件与退层调平脚',{scope:'empty shelf frame; merchandise remains separate'});
 }
 if(catalogId==='LIFE-067'){
  cabinet(.72,.54,.40);for(const x of[.245,.455])b.box('储物柜中分隔','wood',[x,.073,.025],[.018,.438,.351],.001);
  for(const y of[.263,.402])b.box('中央开放搁层','wood',[.262,y,.030],[.196,.013,.335],.001,0);
  for(const y of[.193,.347]){drawer(.065,y,.004,.173,.140,.335,true);drawer(.480,y,.004,.173,.140,.335,false);}
  for(const x of[.065,.370])drawer(x,.084,.004,.282,.093,.334,true);
  for(const y of[.178,.334])b.box('实际屉间前横枨','wood',[.052,y,.008],[.615,.020,.036],.001,0);
  return done('独立石芯与木芯抽屉、中央空搁格及真实屉壁滑轨',{scope:'six closed static drawers and open central cubbies; no storage contents or drawer animation'});
 }
 if(catalogId==='LIFE-068'){
  const holes:SolidBox[]=[0,.55].map(x=>({min:[x+.018,.039,-.01],size:[.014,.012,.11]}));cut('木签槽真实贯通安装轨','woodEdge',[0,.020,.018],[.60,.055,.041],holes);for(const x of[0,.55]){cut('包角及真实背装孔','metal',[x,.008,.011],[.050,.075,.055],holes);pin(x+.012,.026,.006);cut('真实背装螺钉孔耳','metal',[x+.010,.026,.049],[.030,.041,.028],holes);}
  cut('金属贯通夹槽','metal',[.030,0,.005],[.540,.061,.039],[{min:[.029,.012,-.01],size:[.542,.037,.048]},...holes]);
  b.box('真实硬透明塑料护片','rigidClear',[.039,.012,.008],[.522,.037,.003],.0003,0);b.box('独立纸价签','paperSheet',[.045,.018,.014],[.510,.026,.002],.0002,0);b.box('价签红色印墨头','printedRed',[.049,.034,.0136],[.112,.006,.0008],.0001,0);
  for(let j=0;j<15;j++)b.box('作者价签静态墨条','printedDark',[.183+j*.019,.021,.0136],[(j%3?1:2)*.002,.011,.0008],.0001);
  for(const x of[.047,.539])b.box('实际纸签压舌','metal',[x,.008,.011],[.010,.043,.006],.0005);
  return done('贯通价签夹槽、独立纸签油墨、透明硬塑护片与真背装孔',{scope:'author registration bars only; price and product identifiers are not bound'});
 }
 if(catalogId==='LIFE-069'){
  const w=.48,d=.34;b.box('空木托盘底','wood',[0,.013,0],[w,.021,d],.002,0);for(let j=0;j<5;j++)b.box('托盘独立底条','wood',[.015+j*.090,.031,.014],[.086,.010,.312],.001,0);
  for(const z of[0,.319])b.box('空盘前后攒边','woodEdge',[0,.032,z],[w,.073,.021],.002,0);for(const x of[0,.459])b.box('空盘端攒边','woodEdge',[x,.032,0],[.021,.073,d],.002);for(const x of[.005,.425])for(const z of[.005,.285])corner(x,.019,z,.050,.088,.050);
  const X=.58,W=.42,D=.34;b.box('空编篮底','wood',[X+.012,.020,.011],[W-.024,.020,D-.022],.002,0);
  for(let j=0;j<9;j++){const yy=.048+j*.019;for(const z of[.007,.322])b.box('真实横向木编条','wood',[X+.010,yy,z],[W-.020,.011,.011],.001,0);for(const x of[X+.006,X+W-.017])b.box('真实横向侧编条','wood',[x,yy,.010],[.011,.011,.321],.001,0);}
  for(let j=0;j<11;j++)for(const z of[.003,.325])b.box('真实纵向木编条','woodEdge',[X+.016+j*.034,.034,z],[.010,.205,.013],.001);for(let j=0;j<9;j++)for(const x of[X+.003,X+W-.016])b.box('真实纵向侧编条','woodEdge',[x,.034,.022+j*.033],[.013,.205,.010],.001);
  for(const z of[0,.317])b.box('编篮上口收边','woodEdge',[X,.225,z],[W,.022,.023],.002,0);for(const x of[X,X+W-.023])b.box('编篮端上口收边','woodEdge',[x,.225,0],[.023,.022,D],.002);
  for(const x of[X+.004,X+W-.048])for(const z of[.004,.292])corner(x,.021,z,.044,.035,.044);
  for(const z of[.014,.307])cut('金属提耳真实握孔','metal',[X+.147,.233,z],[.125,.043,.012],[{min:[X+.162,.244,z-.01],size:[.095,.022,.032]}]);
  return done('空木托盘与真实木编空篮，编条间孔隙、底脚及镂空提耳',{expectedContactGroups:2,scope:'one catalogue kit containing two independent empty forms; no merchandise or duplicated reference count'});
 }
 if(catalogId==='LIFE-070'){
  for(const x of[.021,1.515])for(const z of[.021,1.093]){b.box('棚架石脚','stone',[x-.014,0,z-.014],[.091,.065,.091],.004);b.box('木棚挂柱','wood',[x,.051,z],[.064,1.405,.064],.004);corner(x-.009,1.363,z-.009,.082,.082,.082);corner(x-.007,.053,z-.007,.080,.087,.080);}
  b.box('棚前连续挂梁','woodEdge',[.039,1.046,.014],[1.523,.052,.073],.003,0);b.box('棚后连续挂梁','woodEdge',[.039,1.361,1.085],[1.523,.052,.074],.003,0);for(const x of[.068,1.528])b.member('连续斜侧承梁','metal',[x,1.077,.052],[x,1.397,1.132],.045,.046,.003);
  b.mesh(marketCanopy('连续有厚度斜棚面',b.role('fabric'),.10,1.40,.025,1.13,p.materials[b.role('fabric')].solid));for(const x of[.096,1.466])b.mesh(marketCanopy('独立米白棚面折边',b.role('wovenLight'),x,.038,.025,1.13,p.materials[b.role('wovenLight')].solid,.003));
  const valance=b.mesh(marketCloth('实际缝边织带布幔',b.role('fabric'),.10,1.40,.945,1.065,.018,.008,p.materials[b.role('fabric')].solid,.009,true));valance.wovenPattern={version:1,design:'market-stripe-v1',width:1024,height:192,sizeM:[1.4,.12],materials:{ground:b.role('fabric'),motif:b.role('wovenLight')}};
  for(const x of[.129,.602,1.075]){b.mesh(marketCloth('连续薄壁垂帘',b.role('fabric'),x,.396,.205,.976,.081,.006,p.materials[b.role('fabric')].solid,.012));b.mesh(marketCloth('独立米白帘边',b.role('wovenLight'),x,.396,.205,.224,.080,.007,p.materials[b.role('wovenLight')].solid,.012));for(const xx of[x+.049,x+.321])b.box('帘挂真实夹扣','metal',[xx,.959,.032],[.022,.058,.071],.002);}
  return done('真实连续斜棚、三段薄壁褶帘、独立折边与受光缝边织纹',{scope:'static canopy/cloth with author support frame; no shop assembly, cloth dynamics or wind binding'});
 }
 if(catalogId==='LIFE-071'){
  const w=.50,h=.40,d=.42;b.box('木货箱真实底','wood',[.014,.025,.014],[.472,.022,.392],.002,0);
  for(let j=0;j<4;j++){const y=.048+j*.082;for(const z of[.012,.394])b.box('独立前后箱板','wood',[.019,y,z],[.462,.077,.014],.001,0);for(const x of[.012,.474])b.box('独立侧箱板','wood',[x,y,.019],[.014,.077,.382],.001,0);}
  for(const x of[.003,.459])for(const z of[.003,.379]){b.box('真实角木榫柱','woodEdge',[x,.022,z],[.038,.372,.038],.002);corner(x-.003,.014,z-.003,.044,.055,.044);corner(x-.003,.351,z-.003,.044,.049,.044);}
  for(let j=0;j<5;j++)b.box('静态闭合独立箱盖板','wood',[.015+j*.094,.373,.013],[.090,.025,.394],.001,0);
  for(const x of[.122,.344]){b.box('固定织带盖段','webbing',[x,.395,.020],[.025,.007,.380],.001,0);for(const z of[.009,.401])b.box('固定织带侧段','webbing',[x,.030,z],[.025,.370,.007],.001);}
  label(.195,.156,.009,.122,.134,71);for(const x of[.061,.407]){b.box('提手真实支座','metal',[x,.231,.006],[.033,.057,.024],.002);b.box('侧提手铜握段','bronze',[x,.247,-.020],[.033,.021,.028],.002);}
  return done('真实独立木分板、闭合箱盖、角柱包铁、固定织带与纸油墨标签',{scope:'one empty closed wooden packing case; registration bars are authored catalogue artwork, no FIFO/ownership binding'});
 }
 if(catalogId==='LIFE-072'){
  const w=.90,h=.72,d=.66;for(const x of[.007,.831])for(const z of[.007,.591]){b.box('货箱角柱','metal',[x,.018,z],[.063,.689,.063],.004);corner(x-.004,.010,z-.004,.071,.087,.071);corner(x-.004,.629,z-.004,.071,.084,.071);}
  for(const y of[.030,.672])b.box('金属箱底或闭合盖芯','enamel',[.028,y,.029],[.844,.020,.602],.004,0);for(const x of[.018,.864])b.box('连续侧钢箱壁','enamel',[x,.048,.030],[.018,.634,.600],.003);for(const z of[.018,.624])b.box('连续前后钢箱壁','enamel',[.030,.048,z],[.840,.634,.018],.003);
  frame('独立盖沿橡胶密封','rubber',.037,.040,.638,.826,.030,.008,.017);for(const z of[.013,.620])b.box('上口真实盖封条','rubber',[.032,.665,z],[.836,.009,.026],.001,0);for(const x of[.021,.853])b.box('上口短盖封条','rubber',[x,.665,.031],[.026,.009,.598],.001);
  for(const x of[.185,.653]){b.box('独立货箱锁扣座','metal',[x,.556,-.003],[.063,.097,.039],.003);b.box('铜锁扣翻片','bronze',[x+.012,.583,-.012],[.039,.054,.017],.002);pin(x+.022,.601,-.017);}
  pull(.366,.444,.018,.168);label(.078,.265,.017,.168,.136,72);
  for(const x of[.126,.729])b.box('真实背部盖铰','metal',[x,.630,.635],[.05,.071,.032],.003);
  return done('独立钢箱壁、封闭盖芯、橡胶盖封、真实锁扣铰链与纸签油墨',{scope:'one empty closed warehouse case; no lock motion, cargo count or controller binding'});
 }
 if(catalogId==='LIFE-073'){
  b.box('硬塑编码板基体','polymer',[0,0,0],[.30,.016,.12],.003,0);b.box('金属牌板薄背','metalBright',[.003,.001,.003],[.294,.005,.114],.001,0);label(.026,.014,.015,.248,.088,73,true);
  for(const x of[.008,.282])for(const z of[.008,.102])pin(x,.011,z,'metalBright');
  cut('封条头真实环孔','polymerRed',[0,.001,.192],[.038,.014,.048],[{min:[.010,-.002,.205],size:[.018,.025,.020]}]);b.box('连续硬塑封条带','polymerRed',[.028,.010,.203],[.310,.006,.025],.001,0);
  cut('封条扣真实压带窗口','polymerRed',[.126,.005,.191],[.059,.027,.050],[{min:[.120,.009,.198],size:[.072,.009,.035]}]);b.cylinder('封条夹压销','metalBright',[.155,.016,.191],[.155,.016,.242],.004,16);pin(.150,.014,.193,'metalBright');label(.215,.015,.203,.113,.026,73,true);
  return done('独立硬塑编码板与封条配件、真实环孔和扣槽、纸签及登记墨条',{expectedContactGroups:2,scope:'one accessory kit containing plate and seal; no complete box, scannable QR or logistics identity claimed'});
 }
 if(catalogId==='LIFE-074'){
  const outer=(rx:number,rz:number,y:number)=>({rx,rz,y,exponent:.13});b.mesh(sectionShell('连续空心棉布袋筐',b.role('cottonWhite'),[{rx:0,y:.034},outer(.173,.113,.034),outer(.194,.137,.470),outer(.182,.125,.470),outer(.160,.100,.048),{rx:0,y:.048}],[.21,.15],p.materials[b.role('cottonWhite')].solid,32));
  for(const x of[.009,.370])for(const z of[.009,.260]){b.box('袋筐石脚','stone',[x-.005,0,z-.005],[.056,.051,.056],.003);b.box('袋筐真实木承条','wood',[x,.043,z],[.041,.435,.041],.003);corner(x-.004,.045,z-.004,.048,.052,.048);corner(x-.004,.442,z-.004,.048,.052,.048);}
  for(const z of[.010,.267])b.box('袋筐上口金属承轨','metal',[.022,.455,z],[.384,.024,.023],.0015,0);for(const x of[.016,.380])b.box('袋筐短上口承轨','metal',[x,.455,.030],[.024,.024,.244],.0015);
  for(const x of[.074,.323])for(const back of[false,true])b.member('实际固定织带','webbing',[x,.217,back?.275:.028],[x,.467,back?.284:.017],.024,.010,.001);
  for(const z of[.010,.275])cut('真实织带提手握孔','webbing',[.147,.407,z],[.128,.096,.013],[{min:[.165,.433,z-.01],size:[.092,.050,.034]}]);
  const base:[number,number][]=[[.195,.235],[.231,.235],[.231,.225],[.249,.247],[.231,.269],[.231,.257],[.195,.257]],cx=.21,cy=.224;
  for(let j=0;j<3;j++){const a=j*Math.PI*2/3,points=base.map(([x,y])=>[cx+(x-cx)*Math.cos(a)-(y-cy)*Math.sin(a),cy+(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a)]as[number,number]);b.mesh(bagInkPolygon('独立回收印墨箭头',b.role('inkTeal'),points,p.materials[b.role('inkTeal')].solid));}
  return done('连续空心棉布筐、独立织带握孔、木金属承架与回收印墨',{scope:'empty reusable bag/basket; static cloth, no simulated load or recycling resource state'});
 }
 if(catalogId==='LIFE-075'){
  for(const x of[.024,.534,1.044])b.box('贯通底部木托条','wood',[x,0,.015],[.132,.024,.770],.002,0);
  for(const x of[.024,.534,1.044])for(const z of[.027,.337,.647])b.box('九枚独立承重木墩','wood',[x,.021,z],[.132,.087,.126],.002);
  for(const z of[.027,.337,.647])b.box('贯通上承横梁','woodEdge',[.017,.104,z],[1.166,.028,.126],.002,0);
  for(let j=0;j<5;j++)b.box('上部独立托盘板','wood',[0,.129,.018+j*.162],[1.20,.031,.114],.002,0);
  for(const x of[.005,1.135])for(const z of[.005,.725])corner(x,.111,z,.060,.050,.070);
  const a=done('九木墩、上下实接交错板、四向真实进叉通路与独立包角',{scope:'single empty pallet; no duplicated cargo cases or load-bearing certification'},ports([{id:'fork-left',kind:'fork-aperture',position:[0,.065,.247],normal:[-1,0,0],size:[0,.078,.166]},{id:'fork-right',kind:'fork-aperture',position:[1.20,.065,.557],normal:[1,0,0],size:[0,.078,.166]},{id:'fork-front',kind:'fork-aperture',position:[.344,.065,0],normal:[0,0,-1],size:[.36,.078,0]},{id:'fork-back',kind:'fork-aperture',position:[.854,.065,.8],normal:[0,0,1],size:[.36,.078,0]}]));
  a.openings=[{min:[0,5,32],max:[240,20,67]},{min:[32,5,0],max:[106,20,160]}];return a;
 }
 if(catalogId==='LIFE-076'){
  const band=sectionShell('单条连续绕箱固定织带',b.role('webbing'),[{rx:.348,rz:.298,y:0,exponent:.14},{rx:.348,rz:.298,y:.055,exponent:.14},{rx:.338,rz:.288,y:.055,exponent:.14},{rx:.338,rz:.288,y:0,exponent:.14}],[0,0],p.materials[b.role('webbing')].solid,48);b.mesh(rigidMesh(band,[.355,.35,.30],0,-Math.PI/2));
  cut('棘轮扣真开放窗口','metal',[.321,.270,-.035],[.143,.150,.062],[{min:[.343,.302,-.05],size:[.101,.092,.095]}]);for(const y of[.305,.389])b.cylinder('真实压带滚轴','bronze',[.322,y,.014],[.465,y,.014],.009,24);b.cylinder('棘轮卷带轴','bronze',[.341,.35,.020],[.438,.35,.020],.030,24);
  const gear=sectionShell('独立棘轮齿圈',b.role('metalBright'),[{rx:.035,y:0},{rx:.035,y:.009},{rx:.026,y:.009},{rx:.026,y:0}],[0,0],p.materials[b.role('metalBright')].solid,24);b.mesh(rigidMesh(gear,[.339,.35,.020],0,-Math.PI/2));for(let j=0;j<12;j++){const a=j*Math.PI/6;b.member('真实棘轮齿','metalBright',[.344,.35+.031*Math.cos(a),.02+.031*Math.sin(a)],[.344,.35+.040*Math.cos(a),.02+.040*Math.sin(a)],.007,.008,.0005);}
  for(const x of[.335,.443])b.member('实际倾斜棘轮柄臂','metal',[x,.402,-.018],[x,.450,-.091],.014,.020,.001);b.cylinder('铜柄握段','bronze',[.331,.45,-.091],[.447,.45,-.091],.012,24);pin(.327,.400,-.025);pin(.442,.400,-.025);
  b.member('实际余带尾段','webbing',[.383,.303,-.014],[.383,.067,-.030],.053,.008,.001);const points:V3[]=[[.383,.069,-.030],[.383,.033,-.030],[.405,.019,-.030],[.427,.039,-.030]];for(let j=0;j<3;j++)b.cylinder('实际开放末端钩','metalBright',points[j],points[j+1],.005,16);pin(.377,.064,-.035,'metalBright');
  return done('一条连续织带、开放棘轮窗口、独立齿圈压轴及真实末端钩',{scope:'one strap master around an empty authored wrap path; no full box/pallet duplication or tension certification',authoredWrapM:[.80,.70,.60]});
 }
 throw Error('Market refinement not implemented '+catalogId);
}
