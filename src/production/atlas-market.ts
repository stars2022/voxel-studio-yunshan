import type {AtlasRecipe} from './atlas-life';
import {Shapes} from './shapes';
import type {V3} from '../core/types';

/** M004 reference reconstruction. Inventory graphics and labels are static;
 * empty storage volume is never replaced by a textured cube. */
export function registerMarketRecipes(add:(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options?:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'>>)=>AtlasRecipe){
 const rim=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,w,h,t,m);b.b(x,y,z+d-t,w,h,t,m);b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);};
 const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,t:number,m:number)=>{b.b(x,y,z,w,t,t,m);b.b(x,y+h-t,z,w,t,t,m);b.b(x,y,z,t,h,t,m);b.b(x+w-t,y,z,t,h,t,m);};
 const tray=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{b.b(x,y,z,w,.025,d,b.s.wood);rim(b,x,y+.025,z,w,h-.025,d,.02,b.s.wood);for(const xx of[x,x+w-.035])for(const zz of[z,z+d-.035])b.b(xx,y,zz,.035,h,.035,b.s.metal);};
 const drawer=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,m:number)=>{b.b(x,y,z,w,.025,d,b.s.wood);rim(b,x,y+.025,z,w,h-.025,d,.02,b.s.wood);b.inset(x,y,z-.035,w,h,.05,m,false,{recess:m===b.s.wood?b.s.woodEdge:b.s.recess});b.pull(x+w/2-.035,y+h/2-.02,z-.055,.07,.04);for(const xx of[x+w/2-.035,x+w/2+.015])b.b(xx,y+h/2-.01,z-.04,.02,.02,.075,b.s.metal);};
 const corners=(b:Shapes,w:number,h:number,d:number)=>{for(const x of[0,w-.06])for(const z of[0,d-.06]){b.b(x,0,z,.06,h,.06,b.s.metal);for(const y of[.02,h-.07]){b.b(x-.01,y,z-.01,.08,.05,.08,b.s.trim);b.b(x+.01,y+.01,z-.02,.025,.025,.02,b.s.bronze);}}};
 const label=(b:Shapes,x:number,y:number,z:number,w:number,h:number)=>{b.b(x,y,z,w,h,.02,b.s.trim);b.b(x+.015,y+.015,z-.01,w-.03,h-.03,.01,b.s.paperSheet);b.b(x+.02,y+h-.035,z-.02,w-.04,.015,.01,b.s.printedRed);for(let k=0;k<5;k++)b.b(x+.025+k*.02,y+.025,z-.02,.01,.015+(k%2)*.01,.01,b.s.printedDark);};
 add(65,[1.2,.96,.65],'食品陈列：两阶承托、六个分仓、独立果蔬块、价签槽和三只底屉',(b,w,h,d)=>{
  b.part('四柱、两阶架与下横枨',()=>{for(const x of[0,w-.08])for(const z of[.02,d-.08])b.post(x,0,z,.08,z>.3?h:.65);for(const z of[.03,d-.07])b.b(.04,.13,z,w-.08,.04,.04,b.s.wood);for(const x of[.025,w-.065])b.b(x,.15,.07,.035,.035,d-.14,b.s.wood);for(const[y,z]of[[.35,.01],[.68,.32]]){b.b(.02,y,z,w-.04,.04,.30,b.s.wood);for(const x of[.03,w-.08])b.b(x,.14,z+.05,.05,y-.14,.05,b.s.wood);}});
  b.part('下部三抽屉与六个翻沿承盘',()=>{for(let k=0;k<3;k++){drawer(b,.08+k*.35,.15,-.005,.34,.18,.24,b.s.wood);for(let tier=0;tier<2;tier++)tray(b,.08+k*.35,.39+tier*.33,.035+tier*.32,.32,.07,.25);}});
  b.part('静态果蔬母体及承盘标签',()=>{for(let k=0;k<6;k++){const tier=Math.floor(k/3),x=.10+k%3*.35,y=.415+tier*.33,z=.06+tier*.32;for(let j=0;j<6;j++){const xx=x+j%3*.085,zz=z+Math.floor(j/3)*.09;if(k%3===0){b.cylinder(xx+.035,y,zz+.035,.03,.075,b.s.foodRoot);b.beam([xx+.035,y+.06,zz+.035],[xx+.02,y+.16,zz+.06],.015,b.s.leaf);b.rounded(xx+.005,y+.11,zz+.035,.065,.025,.065,.01,b.s.leafAlt);}else b.rounded(xx,y,zz,.075,.06+(j%2)*.02,.075,.015,k%3===1?(b.s.fruitRed):b.s.leaf);}label(b,x,y-.02,z-.045,.14,.045);}});
 },{limits:'果蔬是当前展示内容的静态几何，不声称与游戏库存绑定；六盘重复食物不另计资产。'});
 add(66,[1.2,1.8,.48],'商铺货架：四根木柱、三层独立承板、低围沿、后斜撑与金属角托',(b,w,h,d)=>{
  b.part('承重柱、上下横枨和金属脚套',()=>{for(const x of[0,w-.09])for(const z of[0,d-.09])b.post(x,0,z,.09,h);for(const y of[.12,h-.09])for(const z of[.025,d-.065])b.b(.04,y,z,w-.08,.045,.04,b.s.wood);});
  b.part('三层浅灰承板与木边围沿',()=>{for(const y of[.23,.83,1.43]){b.b(.025,y,.025,w-.05,.04,d-.05,b.s.metal);b.b(.065,y+.04,.065,w-.13,.015,d-.13,b.s.enamel);for(const x of[.02,w-.055])b.b(x,y+.04,.045,.035,.045,d-.09,b.s.wood);b.b(.06,y+.04,d-.06,w-.12,.045,.035,b.s.wood);}});
  b.part('后斜撑、层托锁销与防摇连接',()=>{b.beam([.045,.17,d-.03],[w-.045,h-.10,d-.03],.02,b.s.metal);for(const y of[.20,.80,1.4])for(const x of[.02,w-.055])b.b(x,y,-.01,.035,.06,.065,b.s.bronze);});
 });
 add(67,[.9,.88,.38],'商铺收纳：六抽屉与中间双开格、实际抽盒内腔、铜拉手和嵌芯',(b,w,h,d)=>{
  b.cabinet(w,h,d,1,1,false);b.part('两块分仓板与中间搁层',()=>{for(const x of[.3,.59])b.b(x,.32,.02,.025,h-.4,d-.04,b.s.wood);b.b(.315,.54,.025,.285,.025,d-.05,b.s.wood);});
  b.part('上部四只抽屉和底部两只长屉',()=>{for(const x of[.04,.615])for(const y of[.34,.57])drawer(b,x,y,-.02,.245,.215,d-.02,x>.4?b.s.wood:b.s.wall);for(const x of[.04,.455])drawer(b,x,.14,-.02,.405,.18,d-.02,b.s.wall);});
 });
 add(68,[.6,.1,.075],'价格签槽：双压唇、通长插片槽、两张空白标签和两端安装夹',(b,w,h,d)=>{
  b.part('木背条、金属轨道和双压唇',()=>{b.b(0,.035,.03,w,.065,.045,b.s.wood);b.b(.025,.025,.015,w-.05,.045,.025,b.s.trim);for(const y of[.025,.06])b.b(.025,y,0,w-.05,.01,.025,b.s.metal);for(const x of[0,w-.035])b.b(x,.025,.005,.035,.075,.07,b.s.metal);});
  b.part('两张可替换价签和夹扣',()=>{for(const x of[.08,.34]){b.b(x,0,-.025,.18,.06,.015,b.s.rigidClear);b.b(x+.015,.01,-.035,.15,.04,.01,b.s.paperSheet);b.b(x+.04,.03,-.045,.07,.01,.01,b.s.printedRed);b.b(x+.025,.02,-.045,.11,.01,.01,b.s.printedDark);b.b(x+.07,.04,-.01,.04,.025,.04,b.s.metal);}});
 },{mount:'insert',limits:'标签仅有静态色块和排版槽；无真实价格、二维码或文字贴图。'});
 add(69,[.48,.2,.34],'空展示篮：正交编织围壁、透空缝、双提耳、四角套与内腔',(b,w,h,d)=>{
  b.part('编条底、底框和四角包件',()=>{b.b(.015,0,.015,w-.03,.02,d-.03,b.s.wood);rim(b,0,.015,0,w,.025,d,.025,b.s.metal);for(const x of[0,w-.035])for(const z of[0,d-.035])b.b(x,0,z,.035,h,.035,b.s.metal);});
  b.part('交织围壁和加厚口沿',()=>{for(let y=.035;y<h-.025;y+=.04){rim(b,.025,y,.025,w-.05,.02,d-.05,.02,b.s.wood);for(let x=.055;x<w-.03;x+=.06)for(const z of[.015,d-.035])b.b(x,.035,z,.02,h-.06,.02,b.s.woodEdge);for(let z=.055;z<d-.03;z+=.06)for(const x of[.015,w-.035])b.b(x,.035,z,.02,h-.06,.02,b.s.woodEdge);}rim(b,0,h-.025,0,w,.025,d,.03,b.s.wood);});
  b.part('镂空双提手和口沿锁钉',()=>{for(const z of[.02,d-.045])frame(b,w/2-.05,h-.01,z,.1,.06,.015,b.s.metal);for(const x of[.01,w-.025])for(const z of[.01,d-.025])b.b(x,h-.01,z,.015,.02,.015,b.s.bronze);});
 },{limits:'只输出一个空篮母版，参考格中的大小和材质变形不重复计数。'});
 add(70,[1.6,.52,1.2],'布棚分件：连续折面顶棚、双侧包缝、分幅前幔与背挂梁',(b,w,h,d)=>{
  b.part('连续斜棚布面和侧包边',()=>{for(let z=0;z<d;z+=b.pitch){const y=.5-z*.2;b.b(0,y,z,w,.025,b.pitch,b.s.fabric);for(const x of[.015,w-.055])b.b(x,y+b.pitch,z,.04,.015,b.pitch,b.s.wovenLight);}b.b(0,.49,0,w,.03,.04,b.s.wood);b.b(0,.25,d-.04,w,.04,.04,b.s.metal);});
  b.part('两幅前幔、下缘和折边',()=>{for(let k=0;k<2;k++)for(let x=.02+k*w/2;x<(k+1)*w/2-.02;x+=b.pitch){const z=d-.025+.015*Math.sin(x*24);b.b(x,.025,z,b.pitch,.265,.03,b.s.fabric);for(const y of[.045,.095])b.b(x,y,z-.01,b.pitch,.015,.015,b.s.wovenLight);}});
  b.part('四处背挂扣和前收边',()=>{for(const x of[.04,w*.33,w*.66,w-.065])b.b(x,.455,-.02,.035,.075,.055,b.s.metal);});
 },{mount:'insert',limits:'只做棚布、边梁与挂点；图中独立立柱门架不属于该布棚母版。无布料或收卷动画。'});
 add(71,[.5,.4,.42],'杂货箱：分板闭合外壳、内部空腔、包边、交叉绑带、提槽与标签板',(b,w,h,d)=>{
  b.part('薄壳箱体、内腔和分板外表',()=>{b.b(0,0,0,w,h,d,b.s.wood);b.b(.03,.03,.03,w-.06,h-.06,d-.06,0);for(let y=.08;y<h-.02;y+=.075){b.b(.04,y,-.005,w-.08,.01,.01,b.s.woodEdge);b.b(.04,y,d-.005,w-.08,.01,.01,b.s.woodEdge);}for(let x=.07;x<w-.02;x+=.085)b.b(x,h-.01,.02,.01,.015,d-.04,b.s.woodEdge);});
  b.part('金属包角、交叉绑带和可抓提槽',()=>{corners(b,w,h,d);rim(b,w*.45,0,0,.045,h,d,.015,b.s.webbing);b.b(0,h-.01,d*.5,w,.025,.035,b.s.webbing);for(const z of[0,d-.03]){b.b(.13,.27,z,.24,.045,.03,b.s.metal);b.b(.16,.28,z,.18,.025,.03,0);}});
  b.part('标签板、锁钉和短色码',()=>label(b,.08,.09,-.025,.18,.12));
 },{limits:'箱盖静态闭合，内腔存在；标签不含可扫描代码。同图格中的其他箱型属于变体。'});
 add(72,[.9,.72,.66],'仓储货箱：闭合壳体、带密封线的箱盖、强化肋、锁扣、真空把手和角脚',(b,w,h,d)=>{
  b.part('下箱壳、内部空腔与分离盖边',()=>{b.b(0,0,0,w,h,d,b.s.metal);b.b(.045,.04,.045,w-.09,h-.10,d-.09,0);rim(b,-.01,h-.11,-.01,w+.02,.02,d+.02,.04,b.s.rubber);b.b(.035,h-.035,.035,w-.07,.04,d-.07,b.s.trim);});
  b.part('加强立肋、包角和双前锁扣',()=>{corners(b,w,h,d);for(const x of[.14,.42,.7])for(const z of[-.015,d-.015])b.b(x,.08,z,.035,h-.19,.03,b.s.trim);for(const x of[.22,.66]){b.b(x,.44,-.04,.065,.18,.04,b.s.trim);b.b(x+.015,.48,-.055,.035,.11,.025,b.s.bronze);}});
  b.part('两侧框形把手、回纹检修盖和标牌',()=>{for(const x of[.03,w-.05]){b.b(x,.31,.22,.025,.14,.22,b.s.metal);b.b(x,.34,.25,.035,.08,.16,0);rim(b,x-.015,.31,.22,.05,.025,.22,.015,b.s.trim);}label(b,.08,.25,-.025,.20,.115);b.hui(.56,.12,-.01,.12,.12,b.s.trim,.01);});
 },{limits:'锁扣、箱盖和提手都有独立构造，仍为闭合静态姿态，无开箱动画。'});
 add(73,[.3,.12,.025],'货箱附件：薄编码牌、折边、铆点、封条带与真实穿孔',(b,w,h,d)=>{
  b.part('标签背板、折边和有限色码',()=>{b.b(.105,.015,0,.195,.105,.015,b.s.polymer);frame(b,.105,.015,-.01,.195,.105,.01,b.s.trim);label(b,.14,.03,-.02,.14,.075);});
  b.part('独立封条带、穿孔头和锁块',()=>{b.b(0,.055,0,.135,.035,.025,b.s.polymerDark);frame(b,0,.04,-.01,.055,.065,.015,b.s.metal);b.b(.08,.045,-.01,.04,.055,.045,b.s.metal);b.b(.09,.055,-.02,.02,.02,.01,b.s.bronze);b.b(.02,.06,-.02,.015,.025,.07,0);});
 },{mount:'insert',limits:'用有限色块表示标签区域，无真实二维码、条码或可扫描编码。'});
 add(74,[.42,.52,.3],'可回收袋筐：空心软袋、外部承架、上缘翻边、缝带和两只提耳',(b,w,h,d)=>{
  b.part('承框、角脚与软袋空腔',()=>{b.b(.025,.025,.025,w-.05,.03,d-.05,b.s.fabric);rim(b,.025,.055,.025,w-.05,h-.1,d-.05,.02,b.s.cottonWhite);for(const x of[0,w-.04])for(const z of[0,d-.04]){b.post(x,0,z,.04,h,false);b.b(x-.01,0,z-.01,.06,.035,.06,b.s.stone);}rim(b,0,.035,0,w,.03,d,.035,b.s.metal);rim(b,0,h-.04,0,w,.035,d,.035,b.s.wood);});
  b.part('布包缝、翻边与蓝灰提耳',()=>{for(const x of[.08,w-.10])for(const z of[.015,d-.035])b.b(x,.07,z,.02,h-.12,.02,b.s.webbing);for(const z of[-.015,d-.015]){frame(b,.13,h-.075,z,w-.26,.12,.025,b.s.webbing);b.b(.15,h-.095,z,.02,.04,.04,b.s.bronze);}b.hui(.145,.20,.02,.13,.13,b.s.inkTeal,.015);});
 },{limits:'没有装货内容，软袋只提供静态褶边；不包含布料模拟。'});
 add(75,[1.2,.16,.8],'货运托盘：九墩、上下错向承板、四向贯通进叉孔、铜铆钉和金属包角',(b,w,h,d)=>{
  b.part('三条下承板与九支墩',()=>{for(const x of[0,w/2-.06,w-.12]){b.b(x,0,0,.12,.025,d,b.s.wood);for(const z of[0,d/2-.06,d-.12])b.b(x,.025,z,.12,.10,.12,b.s.wood);}});
  b.part('顶承板、木纹方向分板与角鞍',()=>{for(const x of[0,w/2-.06,w-.12])b.b(x,.12,0,.12,.02,d,b.s.wood);for(let k=0;k<5;k++)b.b(0,.125,k*.165,w,.035,k===4?.14:.12,b.s.woodEdge);for(const x of[0,w-.08])for(const z of[0,d-.08]){b.b(x,.035,z,.08,.09,.035,b.s.metal);b.b(x,.13,z,.08,.035,.08,b.s.metal);b.b(x+.025,.155,z+.025,.025,.015,.025,b.s.bronze);}});
  b.part('墩边连接压板与板端栓',()=>{for(const x of[.035,w-.07])for(const z of[.17,.335,.50])b.b(x,.15,z+.02,.035,.01,.02,b.s.trim);});
 });
 add(76,[.8,.7,.6],'固定带分件：绕箱双向带体、棘轮架、透空压带槽、销轴和末端钩',(b,w,h,d)=>{
  b.part('绕箱竖带与横向织带',()=>{b.b(.35,0,0,.06,h,d,b.s.webbing);b.b(.35,.025,.025,.06,h-.05,d-.05,0);rim(b,0,.33,0,w,.06,d,.02,b.s.webbing);});
  b.part('棘轮承架、双耳、压带空槽与铜轴',()=>{b.b(.32,.23,-.035,.12,.2,.035,b.s.metal);for(const x of[.32,.415])b.b(x,.255,-.085,.025,.12,.06,b.s.bronze);for(const y of[.255,.35])b.b(.32,y,-.085,.12,.025,.025,b.s.bronze);b.b(.35,.265,-.09,.06,.08,.02,b.s.webbing);b.b(.345,.30,-.075,.07,.015,.04,0);});
  b.part('自由带尾、回折和开口挂钩',()=>{b.b(.365,.12,-.07,.03,.14,.035,b.s.webbing);frame(b,.345,.065,-.075,.07,.08,.015,b.s.bronze);b.b(.345,.065,-.075,.025,.08,.015,0);b.b(.365,.12,-.055,.035,.02,.04,b.s.bronze);});
 },{mount:'insert',limits:'只有带体和扣钩，图中货箱为绕行路径参照，未焊入；固定尺寸路径需按货箱包围盒调整。'});
}
