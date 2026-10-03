import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';
export const suspensionHeight=(z:number)=>z<25.6?1.1+28.9*z/25.6:z>134.4?1.1+28.9*(160-z)/25.6:12+18*((z-80)/54.4)**2;
function bolts(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number){b.b(x,y,z,w,h,d,b.s.metal);b.b(x+b.pitch,y+b.pitch,z-b.pitch,Math.max(b.pitch,w-2*b.pitch),Math.max(b.pitch,h-2*b.pitch),b.pitch,b.s.bronze);}
function stoneFoot(b:Shapes,w:number,h:number,d:number){b.b(0,0,0,w,h,d,b.s.structuralConcrete);for(let y=0;y<h;y+=.4)for(let x=0;x<w;x+=.8)for(const z of[0,d-.1])b.b(x,y,z,Math.min(.7,w-x),Math.min(.3,h-y),.1,b.s.stone);}
export const bridgeRecipes:Record<string,AtlasRecipe>={
 'BUILT-141':{size:[4,.32,8],pitch:.02,features:'双青导轨：两根0.28×0.24m钢梁、轴距3.6m、独立青色灯槽和底部支脚',limits:'8m作者直段，导轨轴相对轨道中线±1.8m；0.08m安装脚使钢梁中心位于路床顶面上0.2m的线路基准。无磁浮机制或车辆仿真。',draw:b=>{
  b.part('双根钢质导轨梁',()=>{for(const x of[0,3.6])b.b(x,.08,0,.28,.24,8,b.s.metal);});
  b.part('两侧实体光槽及亮钢压条',()=>{for(const x of[0,3.6]){for(const xx of[x,x+.26])b.b(xx,.16,.04,.02,.08,7.92,b.s.energy);b.b(x+.04,.30,0,.20,.02,8,b.s.metalBright);}});
  b.part('两道底部间距连接片及支脚',()=>{for(const z of[.4,7.4]){b.b(-.06,0,z,4,.04,.2,b.s.metal);for(const x of[-.06,3.54])b.b(x,.04,z,.4,.04,.2,b.s.metal);}});
  b.part('端套与独立铜销',()=>{for(const x of[0,3.6])for(const z of[0,7.84]){b.b(x,.08,z,.28,.24,.16,b.s.metal);b.b(x+.08,.30,z+.04,.12,.02,.08,b.s.bronze);}});
 }},
 'BUILT-142':{size:[5.85,.5,2],pitch:.005,expectedComponents:2,features:'成对轨道护条：每条0.35×0.5m、轴距5.5m、薄壁钢箱、石盖及检修孔',limits:'2m作者段；5mm网格保留0.35m条宽和±2.75m轴偏的半格边界。钢箱为真实空腔，不缩成实心墙；平台侧开口通过分段留空验证。',draw:b=>{
  b.part('两组钢底板、薄壁钢箱和横肋',()=>{for(const x of[0,5.5]){b.b(x,0,0,.35,.02,2,b.s.metal);for(const xx of[x,x+.345])b.b(xx,.02,0,.005,.43,2,b.s.metal);for(const z of[0,.495,.995,1.495,1.995])b.b(x,.02,z,.35,.43,.005,b.s.metal);}});
  b.part('独立砂浆床和石质上盖',()=>{for(const x of[0,5.5]){b.b(x,.45,0,.35,.02,2,b.s.mortar);for(let z=0;z<2;z+=.25)b.b(x,.47,z,.35,.03,.24,b.s.wall);}});
  b.part('侧面可检修开口',()=>{for(const x of[0,5.845])for(const z of[.12,.62,1.12,1.62])b.b(x,.12,z,.005,.2,.24,0);});
  b.part('石盖端部铜固定件',()=>{for(const x of[.025,5.775])for(const z of[.03,1.93])b.b(x,.47,z,.05,.03,.04,b.s.bronze);});
 }},
 'BUILT-143':{size:[.65,.85,8],pitch:.025,features:'缆车承载钢束和独立能源管：0.45m主束、0.15m青管、双夹箍与联接座',limits:'旧规则wood为旧渲染材质名；实体承载索按钢缆用途独立分类，不借木材颜色。安装时主束中心9m、青管中心8.5m，作者段长8m；地形支柱、索车和动力系统未实现。',draw:b=>{
  b.part('0.45m承载钢缆芯及连续绞股',()=>{b.cylinder(.4,.65,0,.225,8,b.s.suspensionCable,0,'z');for(let k=0;k<80;k++){const z=k*.1,a=z*3;for(const phase of[0,Math.PI]){const x=.4+.2*Math.cos(a+phase),y=.65+.2*Math.sin(a+phase);b.b(x-.025,y-.025,z,.05,.05,.1,b.s.suspensionCable);}}});
  b.part('独立0.15m能源管与金属端盖',()=>{b.b(.325,.075,0,.15,.15,8,b.s.energy);for(const z of[0,7.8])b.b(.3,.05,z,.2,.2,.2,b.s.metal);});
  b.part('两组连通夹箍及上下连接鞍',()=>{for(const z of[.5,7.1]){b.b(.1,.35,z,.6,.55,.4,b.s.metal);b.b(.15,.4,z,.5,.45,.4,b.s.suspensionCable);b.b(.3,.05,z,.2,.4,.4,b.s.metal);}});
  b.part('夹箍铜锁和检修孔',()=>{for(const z of[.5,7.1]){b.b(.075,.5,z+.1,.025,.2,.2,b.s.bronze);b.b(.7,.5,z+.1,.025,.2,.2,b.s.bronze);b.b(.325,.25,z+.1,.15,.05,.2,0);}});
 }},
 'BUILT-144':{size:[6.2,24.8,5.6],pitch:.1,features:'开放四柱井架：0.6m方柱、轴偏±2.5m、12m横梁节奏、外侧斜撑和侧导轨座',limits:'作者24m行程层；中央4.4m方轴真实开放。只含井架，不含升降舱、轿厢动画、上下landing或崖壁。145侧导轨是独立母版。',draw:b=>{
  b.part('四组石脚与钢木立柱',()=>{for(const x of[0,5])for(const z of[0,5]){b.b(x,0,z,.6,.4,.6,b.s.stone);b.b(x,.4,z,.6,24,.6,b.s.metal);b.b(x+.1,.8,z+.1,.4,23.2,.4,b.s.wood);}});
  b.part('12m节奏的开放横梁圈',()=>{for(const y of[.4,12.4,24.4]){for(const z of[0,5])b.b(0,y,z,5.6,.4,.6,b.s.metal);for(const x of[0,5])b.b(x,y,0,.6,.4,5.6,b.s.metal);}});
  b.part('后侧对角支撑和柱肩铜销',()=>{for(const y of[.8,12.8])b.beam([.3,y,5.3],[5.3,y+11.6,5.3],.2,b.s.metal);for(const x of[.1,5.1])for(const y of[.5,12.5,24.5])b.b(x,y,-.1,.4,.2,.1,b.s.bronze);});
  b.part('x+3.2m导轨的下承座与侧向固定耳',()=>{b.b(5.6,.6,2.5,.6,.2,.6,b.s.metal);for(const y of[12.4,24.4])b.b(5.6,y,2.5,.2,.2,.6,b.s.metal);});
  b.part('柱顶独立暖灯与金属保护帽',()=>{for(const x of[.1,5.1])for(const z of[0,5])b.b(x,24.5,z-.1,.4,.2,.1,b.s.warm);});
 }},
 'BUILT-145':{size:[.35,24,.4],pitch:.05,features:'井架侧导轨：0.3m金属轨体、青色连续灯芯、玻璃罩和后侧安装扣',limits:'作者24m高，由安装位置Y=0.8m至24.8m；轴位为井架中线x+3.2m。井架与乘舱路线独立，不把光线当机械升降能力。',draw:b=>{
  b.part('钢质侧导轨及背部凹槽',()=>{b.b(0,0,0,.3,24,.3,b.s.metal);b.b(.1,.2,.25,.1,23.6,.05,0);});
  b.part('独立青灯芯和玻璃前罩',()=>{b.b(.05,.2,0,.2,23.6,.05,b.s.energy);b.b(.05,.2,-.05,.2,23.6,.05,b.s.glass);});
  b.part('三组后安装扣',()=>{for(const y of[0,11.6,23.6]){b.b(0,y,.3,.3,.4,.05,b.s.metalBright);b.b(-.05,y,.25,.05,.4,.1,b.s.metalBright);}});
  b.part('端部铜锁销与灯槽封边',()=>{for(const y of[.05,23.85])b.b(.05,y,-.05,.2,.1,.05,b.s.bronze);});
 }},
 'BUILT-146':{size:[9,.5,8],pitch:.1,features:'9m桥面板：0.5m厚梁板、空腹纵肋、道路磨耗面、边梁和端部钢连接',limits:'作者8m长段，保留9m显示面宽0.5m厚；147栏柱和135横杆另装。不含整桥悬索、塔柱或自动道路body，不因一块桥面就判定完整桥受力通过。',draw:b=>{
  b.part('连续承板与下层空腹肋',()=>{b.b(0,.3,0,9,.1,8,b.s.structuralConcrete);for(const x of[0,2.2,4.4,6.6,8.8])b.b(x,0,0,.2,.3,8,b.s.structuralConcrete);for(const z of[0,7.8])b.b(0,0,z,9,.3,.2,b.s.structuralConcrete);});
  b.part('独立道路磨耗面',()=>b.b(0,.4,0,9,.1,8,b.s.pavementConcrete));
  b.part('双侧金属边梁',()=>{for(const x of[0,8.9])b.b(x,.1,0,.1,.2,8,b.s.metal);});
  b.part('两端钢连接和铜锁销',()=>{for(const z of[0,7.9])for(const x of[.4,8.2]){b.b(x,.1,z,.4,.2,.1,b.s.metal);b.b(x+.1,.1,z,.2,.1,.1,b.s.bronze);}});
 }},
 'BUILT-147':{size:[.6,1.4,.6],pitch:.02,features:'桥栏独立立柱：石脚木芯、金属肩、1.1m中心高横杆槽及顶端暖灯',limits:'单柱母版；约8m节奏通过实例放置，横杆135另装。横杆槽是安装凹口，不能误标成永远保持空的通行洞；不包含整段栏杆或玻璃板。',draw:b=>{
  b.part('石足、木芯和钢角柱',()=>{b.b(0,0,0,.6,.16,.6,b.s.wall);b.b(.1,.16,.1,.4,1.12,.4,b.s.wood);for(const x of[.08,.48])for(const z of[.08,.48])b.b(x,.16,z,.04,1.12,.04,b.s.metal);});
  b.part('底顶锁肩和石柱帽',()=>{for(const y of[.16,.88])b.b(.04,y,.04,.52,.12,.52,b.s.metal);b.b(.04,1.28,.04,.52,.12,.52,b.s.wall);});
  b.part('真实横杆通槽及安装座',()=>{b.b(.2,1,0,.2,.2,.6,0);b.b(.2,.94,.1,.2,.06,.4,b.s.metal);});
  b.part('前后暖色灯芯和铜固定件',()=>{for(const z of[.06,.52]){b.b(.18,1.22,z,.24,.06,.02,b.s.warm);b.b(.12,1.2,z,.04,.08,.02,b.s.bronze);}for(const x of[.08,.44])b.b(x,.2,.02,.08,.08,.02,b.s.bronze);});
 }},
 'BUILT-148':{size:[12.6,30.3,161.6],pitch:.1,expectedComponents:2,features:'160m双侧主悬索：0.4m钢缆、0.16/0.84跨长塔位、30m高点与四端实体锚座',limits:'作者跨长160m满足旧阈值>140m；塔位25.6/134.4m，中央最低点12m，两侧曲线是两组有意分离部件。只验证静态连接与锚座，不声称索力、地形/车辆或自动悬桥系统完整。',draw:b=>{
  b.part('双侧连续分段钢缆',()=>{for(const x of[1,12])for(let z=0;z<160;z+=.2)b.beam([x,Math.round(suspensionHeight(z)*10)/10,z],[x,Math.round(suspensionHeight(Math.min(z+.2,160))*10)/10,Math.min(z+.2,160)],.4,b.s.suspensionCable);});
  b.part('四端石锚座和金属压鞍',()=>{for(const x of[.2,11.2])for(const z of[-.8,159.2]){b.b(x,0,z,1.6,.6,1.6,b.s.stone);b.b(x+.2,.6,z+.2,1.2,.7,1.2,b.s.metal);}});
  b.part('锚座铜锁和真实紧固孔',()=>{for(const x of[.3,11.3])for(const z of[-.7,159.3]){b.b(x,.6,z,.2,.2,.2,b.s.bronze);b.b(x+1,.6,z+1,.2,.2,.2,b.s.bronze);b.b(x+.6,.6,z+.6,.2,.2,.2,0);}});
  b.part('两处塔顶独立金属抱箍',()=>{for(const x of[.6,11.6])for(const z of[25.4,134.2]){b.b(x,29.7,z,.8,.6,.4,b.s.metal);b.b(x+.2,29.8,z,.4,.4,.4,b.s.suspensionCable);}});
 }},
 'BUILT-149':{size:[2,12.4,.8],pitch:.1,features:'竖吊杆：1.1m起杆位置、独立钢缆、顶夹箍真孔和桥边承托悬臂',limits:'默认主缆中心12m，吊杆有效端点差10.9m；总高12.4m含夹箍。验证12.4/12.8m两规格用于中央8m节距示例，不将尺寸版本或重复吊杆计为新母版。实际受拉承载尚未验算。',draw:(b,w,h)=>{
  b.part('桥侧承托脚和连接悬臂',()=>{b.b(1.4,0,0,.6,.4,.8,b.s.metal);b.b(0,.4,.2,2,.2,.4,b.s.metal);b.b(.2,.6,.2,.4,.5,.4,b.s.metal);});
  b.part('独立钢质竖吊杆及中间锁节',()=>{b.cylinder(.4,1.1,.4,.1,h-1.9,b.s.suspensionCable);b.b(.2,h/2-.2,.2,.4,.4,.4,b.s.metal);});
  b.part('顶端夹箍和沿主缆方向实孔',()=>{b.b(0,h-.8,0,.8,.8,.8,b.s.metal);b.b(.2,h-.7,0,.4,.6,.8,0);});
  b.part('铜锁销和脚部石垫',()=>{for(const y of[.2,h-.8]){b.b(0,y,.1,.1,.2,.2,b.s.bronze);b.b(.7,y,.5,.1,.2,.2,b.s.bronze);}b.b(1.4,0,0,.6,.1,.8,b.s.stone);});
 }},
 'BUILT-150':{size:[9,1.6,9],pitch:.1,features:'9×1.6×9m桥塔基础：分层砌石基座、混凝土芯、中央2m承面与四角铜定位',limits:'9m方脚座，正面回纹另出0.1m；作者桥面基准Y=0、terrain=0时ground=min(0,-2.6)=-2.6m，基础顶为-1m。实际地形采样、土基承载与游戏body未接入。',draw:b=>{
  b.part('底部混凝土和分缝石砌体',()=>stoneFoot(b,9,1.2,9));
  b.part('退层石台及中央承面',()=>{b.b(.2,1.2,.2,8.6,.2,8.6,b.s.stone);b.b(3.5,1.4,3.5,2,.2,2,b.s.wall);});
  b.part('承座外金属定位件与铜销',()=>{for(const x of[3.1,5.6])for(const z of[3.1,5.6]){b.b(x,1.2,z,.3,.2,.3,b.s.metal);b.b(x+.1,1.4,z+.1,.1,.1,.1,b.s.bronze);}});
  b.part('前部几何石回纹',()=>b.hui(3.6,.3,-.1,1.8,.6,b.s.wall,.1));
 }},
 'BUILT-151':{size:[2,33,2],pitch:.1,features:'2m桥塔柱：33m作者高度、钢木骨架、石嵌面、主索通道与顶承面',limits:'2m柱身前铜扣另出0.1m；安装在基础顶-1m时柱顶为桥面基准+32m。塔沿160m跨长的0.16/0.84处复用；主索槽用于安装148，不能称净空通行洞。未实现自动地形适配。',draw:b=>{
  b.part('钢木柱芯与石包边',()=>{b.b(0,0,0,2,33,2,b.s.metal);b.b(.2,.4,.2,1.6,32.2,1.6,b.s.wood);for(const x of[.2,1.6])for(const z of[0,1.8])b.b(x,.4,z,.2,32.2,.2,b.s.wall);});
  b.part('逐段锁肩与铜扣',()=>{for(const y of[0,8,16,24,32.6]){for(const z of[0,1.8])b.b(0,y,z,2,.4,.2,b.s.metal);for(const x of[.1,1.7])b.b(x,y+.1,-.1,.2,.2,.1,b.s.bronze);}});
  b.part('主索真实通槽和两侧钢夹接面',()=>{b.b(.6,29.4,0,.8,2,2,0);for(const x of[.5,1.4])b.b(x,29.4,0,.1,2,2,b.s.metal);});
  b.part('中段独立青色状态灯',()=>{b.b(.7,20,0,.6,4,.1,b.s.energy);b.b(.6,19.8,0,.8,.2,.1,b.s.bronze);});
 }},
 'BUILT-152':{size:[13,2.6,2.4],pitch:.1,features:'塔间1.6m横梁与双小冠盖：13m梁跨、钢木叠梁、双端真实瓦坡及铜脊饰',limits:'2m塔柱轴距11m，中央9m通行宽度；1.6m为梁体厚度，2.6m含小屋冠。安装在柱顶+32m，不能占桥面车辆通行层；未实现结构受力验证。',draw:b=>{
  b.part('1.6m梁体的钢边和木芯',()=>{b.b(0,0,.2,13,1.6,2,b.s.metal);b.b(.2,.2,.1,12.6,1.2,.1,b.s.wood);b.b(.2,.2,2.2,12.6,1.2,.1,b.s.wood);});
  b.part('两端冠盖木座与独立防水层',()=>{for(const x of[0,11]){b.b(x,1.6,.2,2,.2,2,b.s.wood);b.b(x,1.8,.2,2,.1,2,b.s.waterproofMembrane);}});
  b.part('真实双坡瓦冠与瓦脊',()=>{for(const x of[0,11]){for(let z=0;z<2.4;z+=.1){const y=1.9+Math.round((1-Math.abs(z+.05-1.2)/1.2)*4)/10;b.b(x,1.8,z,2,y-1.8,.1,b.s.wood);b.b(x,y-.1,z,2,.1,.1,b.s.waterproofMembrane);b.b(x,y,z,2,.1,.1,b.s.roof);}b.b(x,2.4,1.1,2,.1,.2,b.s.roof);}});
  b.part('四角铜锁脊和暖色柱头灯',()=>{for(const x of[0,1.7,11,12.7]){b.b(x,2.5,1.1,.3,.1,.2,b.s.bronze);b.b(x,.4,0,.3,.6,.1,b.s.warm);}});
 }},
};
const roles:Record<string,string[]>={
 '141':['metal','metalBright','energy','bronze'],'142':['metal','mortar','wall','bronze'],'143':['suspensionCable','energy','metal','bronze'],
 '144':['stone','metal','wood','bronze','warm'],'145':['metal','metalBright','energy','glass','bronze'],'146':['structuralConcrete','pavementConcrete','metal','bronze'],
 '147':['wall','wood','metal','warm','bronze'],'148':['suspensionCable','stone','metal','bronze'],'149':['suspensionCable','stone','metal','bronze'],
 '150':['structuralConcrete','stone','wall','metal','bronze'],'151':['metal','wood','wall','bronze','energy'],'152':['metal','wood','waterproofMembrane','roof','bronze','warm'],
};
export const bridgeMaterialRules=Object.fromEntries(Object.keys(bridgeRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:'钢缆按实际承载索用途独立，不借编织绳网、木材或金属颜色；石、钢、木、发光芯、玻璃及防水层逐格分开。'}]));
export function configureBridgeAsset(a:Asset,id:string){
 if(!bridgeRecipes[id])return;
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-141'){a.source!.railCenterOffsetsM=[-1.8,1.8];a.source!.railSectionM=[.28,.24];port('bed','rail-guides',[1.94,0,4],[0,-1,0],[4,0,8]);}
 if(id==='BUILT-142'){a.source!.guardCenterOffsetsM=[-2.75,2.75];a.source!.guardSectionM=[.35,.5];for(const x of[0,5.845])for(const z of[.12,.62,1.12,1.62])empty([x,.12,z],[x+.005,.32,z+.24]);}
 if(id==='BUILT-143')a.source!.installationM={assetY:8.35,mainCableCenterY:9,energyLineCenterY:8.5};
 if(id==='BUILT-144'){empty([.6,.8,.6],[5,24.4,5]);a.source!.shaft={postAxisOffsetsM:[-2.5,2.5],postWidthM:.6,ringPitchM:12};}
 if(id==='BUILT-145')a.source!.shaftSideOffsetM=3.2;
 if(id==='BUILT-146'){empty([.2,0,.2],[2.2,.3,7.8]);for(const[name,z,n]of[['front',0,-1],['back',8,1]]as const)port(name,'bridge-9000',[4.5,.5,z],[0,0,n],[9,.5,0]);a.source!.deckSectionM=[9,.5];}
 if(id==='BUILT-147'){a.source!.installationRecessM={min:[.2,1,0],max:[.4,1.2,.6]};a.source!.postRepeatApproxM=8;}
 if(id==='BUILT-148')a.source!.suspension={spanM:160,thresholdM:140,towerFractions:[.16,.84],towerPositionsM:[25.6,134.4],peakCenterM:30,centerSagM:12};
 if(id==='BUILT-149'){const h=(a.source!.dimensionsM as V3)[1];a.source!.hanger={bottomRodDatumM:1.1,cableCenterM:h-.4,installationRecessM:{min:[.2,h-.7,0],max:[.6,h-.1,.8]},verifiedRepeatM:8};}
 if(id==='BUILT-150'){port('tower','bridge-tower',[4.5,1.6,4.5],[0,1,0],[2,0,2]);a.source!.groundRule='min(terrain, deck - 2.6m)';}
 if(id==='BUILT-151'){port('foot','bridge-tower',[1,0,1],[0,-1,0],[2,0,2]);port('cap','bridge-tower',[1,33,1],[0,1,0],[2,0,2]);a.source!.deckRelativeTopM=32;a.source!.installedBaseM=-1;}
 if(id==='BUILT-152'){port('left','bridge-tower',[1,0,1.2],[0,-1,0],[2,0,2]);port('right','bridge-tower',[12,0,1.2],[0,-1,0],[2,0,2]);a.source!.beamHeightM=1.6;}
}
