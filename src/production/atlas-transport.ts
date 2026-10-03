import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

/** M018: components stay independent. Later rail guides and guard posts are separate catalogue entries. */
export const transportRecipes:Record<string,AtlasRecipe>={
 'BUILT-116':{size:[2.2,2.2,.20],pitch:.02,features:'医馆墙装标识：1.8m朱红十字印墨、金属牌胎、四角固定件与背部挂轨',limits:'1.8m指红十字符号的横竖外径；2.2m牌面和0.2m总厚为作者尺寸。红色是实体印墨；墙体另装，不含诊疗或交互功能。',draw:b=>{
  b.part('浅色涂装金属牌胎',()=>b.b(0,0,.04,2.2,2.2,.08,b.s.enamel));
  b.part('牌面包边和铜螺栓',()=>{for(const x of[0,2.14])b.b(x,0,.02,.06,2.2,.12,b.s.metal);for(const y of[0,2.14])b.b(0,y,.02,2.2,.06,.12,b.s.metal);for(const x of[.10,2.02])for(const y of[.10,2.02])b.b(x,y,0,.08,.08,.04,b.s.bronze);});
  b.part('真实1.8m十字印墨层',()=>{b.b(.20,.86,.02,1.8,.48,.02,b.s.printedRed);b.b(.86,.20,.02,.48,1.8,.02,b.s.printedRed);});
  b.part('双背轨与挂钩实孔',()=>{for(const y of[.32,1.72]){b.b(.28,y,.12,1.64,.16,.08,b.s.metal);for(const x of[.40,1.68])b.b(x,y+.04,.16,.12,.08,.04,0);}});
 }},
 'BUILT-117':{size:[4.82,3.2,.24],pitch:.02,expectedComponents:2,features:'两件光条族：4m水平青灯带及3.2m竖暖光条，独立壳、灯芯、玻璃保护罩与背轨',limits:'清单同时列水平/竖直件，本母版以两件可选部件陈列，故有两个连通分量；不是两件新清单资产。无墙体、真实光照或游戏能源状态。',draw:b=>{
  const lamp=(x:number,w:number,h:number,role:number)=>{
   b.part('金属槽壳与凹入灯芯',()=>{b.b(x,0,.02,w,h,.18,b.s.metal);b.b(x+.06,.06,.04,w-.12,h-.12,.10,0);b.b(x+.06,.06,.12,w-.12,h-.12,.02,role);});
   b.part('独立玻璃罩与四角铜扣',()=>{b.b(x+.06,.06,.02,w-.12,h-.12,.02,b.s.glass);for(const xx of[x,x+w-.06])for(const y of[0,h-.06])b.b(xx,y,0,.06,.06,.04,b.s.bronze);});
   b.part('背部金属安装轨',()=>b.b(x+.06,.06,.20,w-.12,h-.12,.04,b.s.metal));
  };lamp(0,4,.32,b.s.energy);lamp(4.5,.32,3.2,b.s.warm);
 }},
 'BUILT-131':{size:[10,.5,2],pitch:.02,features:'10m道路面分段：0.5m梁板厚、独立磨耗面、下层肋与7m横缝嵌装槽',limits:'作者2m长直段，路面总宽10m厚0.5m；非实心地基。中心线132、横缝133及双路肩134单独安装。edge曲线采样和游戏道路系统尚未接入。',draw:(b,w,h,d)=>{
  b.part('承板与可见纵横混凝土肋',()=>{b.b(0,.42,0,w,.04,d,b.s.structuralConcrete);for(const x of[0,2.48,4.96,7.44,9.92])b.b(x,0,0,.08,.42,d,b.s.structuralConcrete);for(const z of[0,1.92])b.b(0,0,z,w,.42,.08,b.s.structuralConcrete);});
  b.part('道路独立混凝土磨耗面',()=>b.b(0,.46,0,w,.04,d,b.s.pavementConcrete));
  b.part('7m真实横缝预留槽',()=>b.b(1.5,.42,.94,7,.08,.12,0));
  b.part('端面连接钢板及铜锁销',()=>{for(const z of[0,1.98])for(const x of[.32,9.36]){b.b(x,.12,z,.32,.16,.02,b.s.metal);b.b(x+.08,.16,z,.16,.08,.02,b.s.bronze);}});
 }},
 'BUILT-132':{size:[.16,.08,2],pitch:.02,features:'0.16m宽0.08m高陶瓷中心嵌条：金属托片、弹性底垫、分段条及端部固定',limits:'严格保留清单0.08m厚度，以实物嵌条表达，不冒称薄漆。作者段长2m，沿道路轴重复；没有车道逻辑。',draw:b=>{
  b.part('独立密封底垫',()=>b.b(0,0,0,.16,.02,2,b.s.jointSeal));
  b.part('金属承托片',()=>b.b(0,.02,0,.16,.02,2,b.s.metal));
  b.part('四段陶瓷条与可见弹性分缝',()=>{b.b(0,.04,0,.16,.04,2,b.s.jointSeal);for(let z=0;z<2;z+=.5)b.b(0,.04,z,.16,.04,.48,b.s.roadInlay);});
  b.part('两端铜固定销',()=>{for(const z of[.04,1.92])b.b(.06,.04,z,.04,.04,.04,b.s.bronze);});
 }},
 'BUILT-133':{size:[7,.08,.12],pitch:.02,features:'7m横向伸缩缝嵌件：双钢边、波形弹性芯、底托和分布铜扣',limits:'嵌入131预留槽，顶面齐平；实体宽0.12m高0.08m为作者尺寸。密封条与桥梁支座、轮胎橡胶角色独立，不具备实际伸缩模拟。',draw:b=>{
  b.part('连续钢质底托',()=>b.b(0,0,0,7,.02,.12,b.s.metal));
  b.part('双排钢边',()=>{for(const z of[0,.10])b.b(0,.02,z,7,.06,.02,b.s.metal);});
  b.part('真实凹进的弹性芯',()=>{b.b(0,.02,.02,7,.04,.08,b.s.jointSeal);for(let x=0;x<7;x+=.20)b.b(x,.06,.04,.10,.02,.04,b.s.jointSeal);});
  b.part('两侧铜紧固件',()=>{for(let x=.10;x<7;x+=.4)for(const z of[0,.10])b.b(x,.06,z,.04,.02,.02,b.s.bronze);});
 }},
 'BUILT-134':{size:[9.9,.2,2],pitch:.01,expectedComponents:2,features:'双路肩：单条0.4m宽0.2m高、中心距9.5m，石铺块、灰缝、真实排水缺口和边压条',limits:'两条路肩是一件成对组件；相对道路中线各4.75m。10mm网格保留安装偏移0.05m，不能和20mm道路直接用同格距connect；用实际米制放置验证。',draw:b=>{
  b.part('双肩砂浆底座',()=>{for(const x of[0,9.5])b.b(x,0,0,.4,.05,2,b.s.mortar);});
  b.part('独立石块与分缝',()=>{for(const x of[0,9.5])for(let z=0;z<2;z+=.4)b.b(x,.05,z,.4,.15,.38,b.s.wall);});
  b.part('内侧金属压条',()=>{for(const x of[.38,9.5])b.b(x,.05,0,.02,.05,2,b.s.metal);});
  b.part('横向排水实槽',()=>{for(const x of[0,9.5])for(const z of[.16,1.76])b.b(x,0,z,.4,.06,.08,0);});
 }},
 'BUILT-135':{size:[4,.2,.2],pitch:.02,features:'4m共享护栏横杆：0.2m截面、空腔钢梁、顶面木扶手与端套铜销',limits:'只制作水平横杆；栏柱是BUILT-147，不能重复烘入此母版。安装中心高1.1m、交口断开通过实例验证；未实现自动cut算法或护栏受力计算。',draw:b=>{
  b.part('连续空腔钢梁',()=>{b.b(0,0,0,4,.16,.2,b.s.metal);b.b(.08,.04,.04,3.84,.08,.12,0);});
  b.part('实木扶手面',()=>b.b(0,.16,0,4,.04,.2,b.s.woodEdge));
  b.part('两端钢套',()=>{for(const x of[0,3.84])b.b(x,0,0,.16,.16,.2,b.s.metalBright);});
  b.part('铜销与端接实孔',()=>{for(const x of[.04,3.88]){b.b(x,.04,0,.08,.08,.02,b.s.bronze);b.b(x,.06,.04,.08,.04,.12,0);}});
 }},
 'BUILT-136':{size:[7,2,7],pitch:.1,features:'轨道高架石基础：7×7m、2m厚，混凝土芯、分层石皮、3m柱座与铜定位块',limits:'本母版为轨道7×7m规格；道路8×8m规格未作为本次已验证变体。70/80m是原边线布点节距，本件不虚构整条高架或地质承载验算。',draw:b=>{
  b.part('实心混凝土基础内芯',()=>b.b(0,0,0,7,2,7,b.s.structuralConcrete));
  b.part('四侧独立砌石与灰缝',()=>{for(const y of[0,.5,1,1.5])for(let n=0;n<7;n+=1){for(const z of[0,6.8])b.b(n,y,z,.9,.4,.2,b.s.stone);for(const x of[0,6.8])b.b(x,y,n,.2,.4,.9,b.s.stone);}});
  b.part('3m方柱承座和石压沿',()=>{b.b(2,1.8,2,3,.2,3,b.s.wall);for(const z of[.2,6.5])b.b(.2,1.8,z,6.6,.2,.3,b.s.wall);});
  b.part('柱座外侧定位铜块',()=>{for(const x of[1.7,5.1])for(const z of[1.7,5.1])b.b(x,1.8,z,.2,.2,.2,b.s.bronze);});
 }},
 'BUILT-137':{size:[3.4,32,3],pitch:.1,features:'32m轨道高架墩柱：3m混凝土柱芯、石端座、分段箍与16m高拉结承耳',limits:'3m为柱芯截面；侧耳各出挑0.2m，总宽3.4m。作者高32m以验证高于25m时16m拉结层；4m道路柱、地形适配和其他高度未声称完成。',draw:b=>{
  b.part('3m方柱芯与上下石端',()=>{b.b(0,0,0,3,32,3,b.s.structuralConcrete);for(const y of[0,31.6])b.b(0,y,0,3,.4,3,b.s.stone);});
  b.part('四段金属箍与铜扣',()=>{for(const y of[7.8,15.8,23.8]){b.b(0,y,0,3,.2,.1,b.s.metal);b.b(0,y,2.9,3,.2,.1,b.s.metal);for(const x of[0,2.9])b.b(x,y,0,.1,.2,3,b.s.metal);for(const x of[.2,2.6])b.b(x,y,0,.2,.2,.1,b.s.bronze);}});
  b.part('16m层双侧木拉结承耳',()=>{for(const x of[-.2,3])b.b(x,15.8,1.2,.2,.2,.6,b.s.metal);});
  b.part('正面退进竖向石饰槽',()=>{b.b(1.2,.6,0,.6,30.8,.1,b.s.wall);for(let y=1;y<31;y+=2)b.b(1.2,y,0,.6,.1,.1,b.s.structuralConcrete);});
 }},
 'BUILT-138':{size:[7,1.8,4],pitch:.1,features:'轨道7m墩帽：6m路床两侧各加0.5m、1.8m总高、4m纵长、阶梯承托与独立橡胶支座',limits:'3m柱芯中心承托7m墩帽；1.8m包含顶层0.2m橡胶支座。道路11m规格另需变体验证，未做结构安全认证。',draw:b=>{
  b.part('三级混凝土悬臂承托',()=>{b.b(2,0,.5,3,.4,3,b.s.structuralConcrete);});
  b.part('混凝土帽梁和阶梯加宽',()=>{b.b(1,.4,0,5,.4,4,b.s.structuralConcrete);b.b(0,.8,0,7,.6,4,b.s.structuralConcrete);});
  b.part('石压边及两只钢托板',()=>{for(const z of[0,3.8])b.b(0,1.4,z,7,.2,.2,b.s.stone);for(const x of[1.2,4.8])b.b(x,1.4,1,1,.2,2,b.s.metal);});
  b.part('两只独立橡胶支座',()=>{for(const x of[1.2,4.8])b.b(x,1.6,1,1,.2,2,b.s.bridgeBearing);});
 }},
 'BUILT-139':{size:[6,.6,.6],pitch:.1,features:'高墩木拉结：6m独立木梁、端部钢鞋、两组铜销和上表面木收边',limits:'为两根3m柱、柱轴距9m的作者场景，木梁端坐在137的16m层承耳上。25m阈值和每16m规则已记录并验证一层；非自动桥梁生成器。',draw:b=>{
  b.part('连续实木拉结梁',()=>b.b(0,0,0,6,.6,.6,b.s.wood));
  b.part('两端钢鞋',()=>{for(const x of[0,5.8]){b.b(x,0,0,.2,.6,.6,b.s.metal);b.b(x,.1,.1,.2,.4,.4,b.s.wood);}});
  b.part('两侧铜穿销',()=>{for(const x of[.3,5.5])for(const z of[0,.5])b.b(x,.2,z,.2,.2,.1,b.s.bronze);});
  b.part('上缘独立木收边',()=>b.b(.2,.5,.1,5.6,.1,.4,b.s.woodEdge));
 }},
 'BUILT-140':{size:[6,1.4,8],pitch:.1,features:'6m轨道高架路床：1.4m高箱梁、真实检修空腔、上承板和双侧导轨安装座',limits:'作者8m长直段；清单中心偏-0.9m按Y向解释：路床几何中心低于线路基准0.9m，顶面低0.2m；线路基准接口另列。141导轨与142侧缘保护条下一批独立制作，不算进本件；无列车或动力学。',draw:b=>{
  b.part('混凝土底板及三道腹板',()=>{b.b(0,0,0,6,.2,8,b.s.structuralConcrete);for(const x of[0,2.8,5.6])b.b(x,.2,0,.4,.8,8,b.s.structuralConcrete);});
  b.part('连续上承板',()=>b.b(0,1,0,6,.3,8,b.s.structuralConcrete));
  b.part('石质顶铺与明缝',()=>{b.b(0,1.3,0,6,.1,8,b.s.mortar);for(let z=0;z<8;z+=1)for(const x of[0,3])b.b(x,1.3,z,2.9,.1,.9,b.s.wall);});
  b.part('双线导轨钢安装座',()=>{for(const x of[1.4,4.2])for(let z=.4;z<8;z+=.8){b.b(x,1.3,z,.4,.1,.2,b.s.metal);b.b(x+.1,1.3,z,.2,.1,.1,b.s.bronze);}});
 }},
};

const roles:Record<string,string[]>={
 '116':['enamel','metal','bronze','printedRed'], '117':['metal','bronze','energy','warm','glass'],
 '131':['structuralConcrete','pavementConcrete','metal','bronze'], '132':['jointSeal','metal','roadInlay','bronze'],
 '133':['metal','jointSeal','bronze'], '134':['mortar','wall','metal'], '135':['metal','metalBright','woodEdge','bronze'],
 '136':['structuralConcrete','stone','wall','bronze'], '137':['structuralConcrete','stone','wall','metal','bronze'],
 '138':['structuralConcrete','stone','metal','bridgeBearing'], '139':['wood','woodEdge','metal','bronze'],
 '140':['structuralConcrete','wall','mortar','metal','bronze'],
};
export const transportMaterialRules=Object.fromEntries(Object.keys(transportRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:'按实际用途逐格区分结构混凝土、磨耗面、陶瓷中心条、石材、钢、木、印墨、灯芯/透光板及伸缩密封/桥梁支座；颜色相似不复用角色。'}]));

export function configureTransportAsset(a:Asset,id:string){
 if(!transportRecipes[id])return;
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-116'){for(const y of[.32,1.72])for(const x of[.40,1.68])empty([x,y+.04,.16],[x+.12,y+.12,.20]);port('wall','wall-sign',[1.1,1.1,.20],[0,0,1],[2.2,2.2,0]);a.source!.symbolSpanM=1.8;}
 if(id==='BUILT-117')a.source!.intentionalComponents=['horizontal-cyan','vertical-warm'];
 if(id==='BUILT-131'){for(const [name,z,n]of[['front',0,-1],['back',2,1]]as const)port(name,'road-10000',[5,.5,z],[0,0,n],[10,.5,0]);port('joint','road-joint',[5,.42,1],[0,1,0],[7,0,.12]);port('line','road-line',[5,.5,1],[0,1,0],[.16,0,2]);a.source!.installationRecessM={min:[1.5,.42,.94],max:[8.5,.5,1.06]};empty([.2,0,.2],[2.4,.32,1.8]);}
 if(id==='BUILT-132')port('bottom','road-line',[.08,0,1],[0,-1,0],[.16,0,2]);
 if(id==='BUILT-133')port('bottom','road-joint',[3.5,0,.06],[0,-1,0],[7,0,.12]);
 if(id==='BUILT-134'){a.source!.shoulderCenterOffsetsM=[-4.75,4.75];for(const x of[0,9.5])for(const z of[.16,1.76])empty([x,0,z],[x+.4,.06,z+.08]);}
 if(id==='BUILT-135'){empty([.16,.04,.04],[3.84,.12,.16]);port('left','rail-200',[0,.1,.1],[-1,0,0],[0,.2,.2]);port('right','rail-200',[4,.1,.1],[1,0,0],[0,.2,.2]);a.source!.installedCenterHeightM=1.1;}
 if(id==='BUILT-136'){port('pier','pier-3000',[3.5,2,3.5],[0,1,0],[3,0,3]);a.source!.repeatSpacingM={road:70,rail:80};}
 if(id==='BUILT-137'){port('foot','pier-3000',[1.5,0,1.5],[0,-1,0],[3,0,3]);port('cap','pier-3000',[1.5,32,1.5],[0,1,0],[3,0,3]);a.source!.tieRule={thresholdM:25,spacingM:16,authoredLevelsM:[16]};}
 if(id==='BUILT-138'){port('bottom','pier-3000',[3.5,0,2],[0,-1,0],[3,0,3]);port('bed','rail-bed',[3.5,1.8,2],[0,1,0],[6,0,4]);}
 if(id==='BUILT-139')a.source!.pierAxisSpacingM=9;
 if(id==='BUILT-140'){port('bottom','rail-bed',[3,0,4],[0,-1,0],[6,0,4]);for(const [name,z,n]of[['front',0,-1],['back',8,1]]as const)port(name,'rail-bed-end',[3,1.4,z],[0,0,n],[6,1.4,0]);empty([.4,.2,0],[2.8,1,8]);empty([3.2,.2,0],[5.6,1,8]);port('track-datum','track-datum',[3,1.6,4],[0,1,0],[6,0,8]);a.source!.trackPlacement={bedCenterRelativeToTrackM:[0,-.9,0],bedTopRelativeToTrackM:-.2,trackDatumLocalYM:1.6,interpretation:'catalogue centre offset interpreted along Y; no runtime integration'};}
}
