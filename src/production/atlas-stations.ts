import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

function frame(b:Shapes,x:number,y:number,z:number,w:number,h:number,t:number,d:number,m:number){for(const xx of[x,x+w-t])b.b(xx,y,z,t,h,d,m);for(const yy of[y,y+h-t])b.b(x,yy,z,w,t,d,m);}
function locks(b:Shapes,x:number,y:number,z:number,w:number,h:number,t:number){for(const xx of[x,x+w-t])for(const yy of[y,y+h-t]){b.b(xx,yy,z,t,t,b.pitch,b.s.bronze);}}
const vehiclePanels=[.2,2.2,4.2,6.2,8.2];
const signalRoles=['signalStopLamp','signalCautionLamp','signalGoLamp'];
function signal(b:Shapes,x:number,y:number,z:number){b.b(x,y,z,.4,1.2,.3,b.s.metal);for(let i=0;i<3;i++){b.b(x+.05,y+.05+i*.4,z-.05,.3,.3,.05,b.s.glass);b.b(x+.1,y+.1+i*.4,z,.2,.2,.05,b.s[signalRoles[2-i]]);}b.b(x-.05,y+1.2,z-.1,.5,.1,.4,b.s.metal);}

export const stationRecipes:Record<string,AtlasRecipe>={
 'BUILT-153':{size:[12,8.4,10],pitch:.1,features:'12×10m桥端块：3m作者高差、15级接岸阶梯、开放通行门架及真实检修腔',limits:'基础端块高max(1,deck-terrain)，本件明确采用deck=3m、terrain=0m；上部门架使总高8.4m。没有把历史154.6m高桥负例改称已解决，未接入游戏body或实时地形。',draw:b=>{
  b.part('3m高端块的混凝土承台和侧翼',()=>{b.b(0,0,6,12,3,4,b.s.structuralConcrete);for(const x of[0,9])b.b(x,0,0,3,3,6,b.s.structuralConcrete);b.b(4,.4,7,4,2,3,0);});
  b.part('十五级石踏面与连续阶梯芯',()=>{for(let i=0;i<15;i++){b.b(3,0,i*.4,6,(i+1)*.2,.4,b.s.structuralConcrete);b.b(3,(i+1)*.2-.1,i*.4,6,.1,.4,b.s.wall);}b.b(3,2.9,6,6,.1,4,b.s.wall);});
  b.part('两翼石砌皮和分层承台',()=>{for(const x of[0,9])for(let y=0;y<3;y+=.5)for(let z=0;z<10;z+=1){b.b(x,y,z,3,.4,.9,b.s.stone);}for(const x of[0,9])b.b(x,2.8,0,3,.2,10,b.s.wall);});
  b.part('开放石门柱与上部钢木叠梁',()=>{for(const x of[1.5,9.5]){b.b(x,3,8,1,4.2,1.2,b.s.wall);b.b(x,3.2,7.9,1,.2,1.4,b.s.metal);b.b(x,6.8,7.9,1,.4,1.4,b.s.metal);}b.b(1,7.2,7.8,10,.8,1.6,b.s.metal);b.b(1.2,7.4,7.7,9.6,.4,.1,b.s.wood);b.b(1,8,7.8,10,.4,1.6,b.s.wall);});
  b.part('嵌入暖灯、铜锁和检修门框',()=>{for(const x of[1.8,9.8])b.b(x,3.6,7.9,.4,2.6,.1,b.s.warm);for(const x of[1.2,10.5])b.b(x,7.4,7.6,.3,.3,.2,b.s.bronze);frame(b,3.9,.3,9.9,4.2,2.2,.1,.1,b.s.metal);});
 }},
 'BUILT-154':{size:[22,1,18],pitch:.1,features:'22×18m独立站台承板：1m总厚、下部梁肋、分区石铺面、青色边线及两柱安装座',limits:'本件仅为平台；候车棚155、信号杆156保持独立。站台几何底厚1m；清单站点坐标和上下车状态尚未绑定，青色边线只作实体灯芯。',draw:b=>{
  b.part('结构承板与可维护的纵横梁肋',()=>{b.b(0,.7,0,22,.2,18,b.s.structuralConcrete);for(const x of[0,5.4,10.8,16.2,21.6])b.b(x,0,0,.4,.7,18,b.s.structuralConcrete);for(const z of[0,5.8,11.6,17.6])b.b(0,0,z,22,.7,.4,b.s.structuralConcrete);});
  b.part('砂浆床与分缝石铺装',()=>{b.b(0,.9,0,22,.1,18,b.s.mortar);for(let x=0;x<22;x+=2)for(let z=0;z<18;z+=2)b.b(x,.9,z,1.9,.1,1.9,b.s.wall);});
  b.part('两侧钢边、青灯和入口断口',()=>{for(const z of[0,17.8]){b.b(0,.7,z,22,.2,.2,b.s.metal);b.b(.4,.9,z,21.2,.1,.1,b.s.energy);}for(const x of[0,21.8]){b.b(x,.7,0,.2,.2,18,b.s.metal);for(const z of[.4,11])b.b(x,.9,z,.1,.1,6.6,b.s.energy);}});
  b.part('两柱定位座和端部铜锁',()=>{for(const x of[1,20.2])b.b(x,.9,8.1,.8,.1,.8,b.s.metal);for(const x of[.3,21.4])for(const z of[.3,17.4])b.b(x,.9,z,.3,.1,.3,b.s.bronze);});
 }},
 'BUILT-155':{size:[23,6.8,11],pitch:.1,features:'23×11m两柱雨棚：6m木柱、石鞋钢肩、挑檐梁、防水基层与分块瓦盖',limits:'6m为柱顶，屋面总高6.8m；两柱轴距19.2m。平台和座椅为其他独立资产，本件不烘入站台或完整站房；通行净空实测，未作受力验算。',draw:b=>{
  b.part('两只石鞋、连续木柱与钢肩',()=>{for(const x of[1.5,20.7]){b.b(x,0,4.6,.8,.4,.8,b.s.wall);b.b(x+.1,.4,4.7,.6,5.6,.6,b.s.wood);for(const y of[.4,5.6])b.b(x,y,4.6,.8,.4,.8,b.s.metal);}});
  b.part('纵横木梁与六组真实挑檐撑',()=>{b.b(.4,5.8,4.5,22.2,.2,1,b.s.wood);for(const x of[1.5,11.1,20.7]){b.b(x,5.8,.3,.8,.2,10.4,b.s.metal);b.beam([x+.4,5.2,5],[x+.4,5.9,3.4],.2,b.s.wood);b.beam([x+.4,5.2,5],[x+.4,5.9,6.6],.2,b.s.wood);}b.b(1.5,5.2,4.8,20,.2,.4,b.s.wood);});
  b.part('连续木基层、独立防水层和金属收边',()=>{b.b(0,6,0,23,.2,11,b.s.wood);b.b(.1,6.2,.1,22.8,.1,10.8,b.s.waterproofMembrane);for(const x of[0,22.9])b.b(x,6.1,0,.1,.3,11,b.s.metal);for(const z of[0,10.9])b.b(0,6.1,z,23,.3,.1,b.s.metal);});
  b.part('分块瓦板、压脊和铜扣',()=>{for(let x=.1;x<22.9;x+=1.9)for(let z=.1;z<10.9;z+=1.8)b.b(x,6.3,z,Math.min(1.8,22.9-x),.2,Math.min(1.7,10.9-z),b.s.roof);b.b(0,6.5,5.3,23,.2,.4,b.s.roof);for(const x of[0,22.6])b.b(x,6.7,5.3,.4,.1,.4,b.s.bronze);});
  b.part('前檐灯芯与柱前暖灯',()=>{b.b(.5,5.9,0,22,.1,.1,b.s.warm);for(const x of[1.8,21])b.b(x,1,4.6,.2,4,.1,b.s.warm);});
 }},
 'BUILT-156':{size:[3.6,5.3,1],pitch:.05,features:'站台信号杆牌：层叠钢座、独立红黄绿光学面、悬臂显示牌及像素箭头',limits:'作者杆牌总高5.3m，安装基准相对节点+x12/z11。信号三色均未绑定状态、默认不发光，不能用装饰自造state.signals；显示箭头为静态像素。',draw:b=>{
  b.part('石脚、钢杆与套肩',()=>{b.b(0,0,0,1,.3,1,b.s.wall);b.b(.3,.3,.3,.4,4.4,.4,b.s.metal);for(const y of[.3,2.8,4.4])b.b(.2,y,.2,.6,.3,.6,b.s.metalBright);});
  b.part('木夹芯挑臂与挂扣',()=>{b.b(.5,4.3,.35,3.1,.2,.3,b.s.metal);b.b(.8,4.35,.3,2.6,.1,.05,b.s.wood);for(const x of[1.3,2.9])b.b(x,3.8,.4,.15,.5,.15,b.s.bronze);});
  b.part('可换屏幕外框与显示底面',()=>{b.b(1.2,2.65,.35,2,1.15,.2,b.s.metal);b.b(1.3,2.75,.3,1.8,.95,.05,b.s.screen);locks(b,1.2,2.65,.3,2,1.15,.1);});
  b.part('清晰静态箭头和列车图形',()=>{b.b(2.3,3.15,.25,.55,.1,.05,b.s.displayWhite);for(let i=0;i<4;i++){b.b(2.65+i*.05,3.25+i*.05,.25,.1,.1,.05,b.s.displayWhite);b.b(2.65+i*.05,3.1-i*.05,.25,.1,.1,.05,b.s.displayWhite);}frame(b,1.5,2.95,.25,.5,.65,.05,.05,b.s.displayGlyph);for(const x of[1.5,1.9])b.b(x,2.85,.25,.1,.1,.05,b.s.displayGlyph);});
  b.part('独立信号灯壳、保护玻璃和三色灯芯',()=>signal(b,.3,4,.2));
 }},
 'BUILT-157':{size:[4.4,4.8,1],pitch:.05,features:'4.4m木质路口杆：石座钢肩、双侧横臂、三色信号壳与独立静态导向屏',limits:'木杆名义高度4.4m，含上部灯壳总高4.8m；节点偏移+x4/z4。红黄绿灯芯均未接状态，材质试作保持不发光；无道路通行控制或局部点光。',draw:b=>{
  b.part('石座与4.4m木柱实体',()=>{b.b(1.7,0,0,1,.3,1,b.s.wall);b.b(2,0,.3,.4,4.4,.4,b.s.wood);for(const y of[.3,1,3.7,4.15])b.b(1.9,y,.2,.6,.25,.6,b.s.metal);});
  b.part('双侧钢木横臂和铜榫夹',()=>{b.b(0,3.8,.35,4.4,.2,.3,b.s.metal);b.b(.4,3.85,.3,3.6,.1,.05,b.s.wood);for(const x of[.7,2.7,3.9])b.b(x,3.75,.3,.15,.3,.4,b.s.bronze);});
  b.part('三色信号模块',()=>signal(b,.05,3.5,.2));
  b.part('柱面金属检修门和独立显示面',()=>{b.b(2.05,.4,.15,.3,.5,.05,b.s.metalBright);b.b(2.15,.55,.1,.05,.15,.05,b.s.bronze);b.b(3.5,3.2,.3,.6,.6,.15,b.s.metal);b.b(3.55,3.25,.25,.5,.5,.05,b.s.screen);b.b(3.7,3.35,.2,.2,.3,.05,b.s.displayGlyph);});
 }},
 'BUILT-158':{size:[960,1.5,44],pitch:.5,features:'真实960×44m跑道面：连续磨耗层、周边梁与8m横肋、独立端锁和维护空腔',limits:'0.5m格距保留全长全宽；作者总结构厚1.5m，表面磨耗层0.5m。世界端点710→1670m、顶面Y14.6m作为安装基准；159中心短划和160侧灯另装。不是完整机场或可运行航空系统。',draw:b=>{
  b.part('连续道路混凝土磨耗面',()=>b.b(0,1,0,960,.5,44,b.s.pavementConcrete));
  b.part('承力侧梁和8m节奏横肋',()=>{for(const z of[0,43])b.b(0,0,z,960,1,1,b.s.structuralConcrete);for(let x=0;x<960;x+=8)b.b(x,0,0,1,1,44,b.s.structuralConcrete);b.b(959,0,0,1,1,44,b.s.structuralConcrete);});
  b.part('两端钢质接岸边梁',()=>{for(const x of[0,959.5])b.b(x,1,0,.5,.5,44,b.s.metal);});
  b.part('角部石质压块和铜接点',()=>{for(const x of[.5,958])for(const z of[.5,42]){b.b(x,1,z,1.5,.5,1.5,b.s.stone);b.b(x+.5,1,z+.5,.5,.5,.5,b.s.bronze);}});
 }},
 'BUILT-159':{size:[6,.15,1],pitch:.05,features:'6×1m暖色跑道短划：独立钢托、内缩暖光芯、分段透明罩和端锁',limits:'作者实体安装厚0.15m，暖色来自灯芯与玻璃罩，非发光混凝土或一整段跑道。位置须绑定每个route段中心；当前仅有明确作者布点的静态拼装。',draw:b=>{
  b.part('6×1m连续钢底托',()=>b.b(0,0,0,6,.05,1,b.s.metal));
  b.part('内缩灯芯与边框',()=>{b.b(.1,.05,.1,5.8,.05,.8,b.s.warm);for(const z of[0,.95])b.b(0,.05,z,6,.1,.05,b.s.metal);});
  b.part('分段玻璃盖及隔条',()=>{for(let x=.1;x<5.9;x+=.6){b.b(x,.1,.1,Math.min(.5,5.9-x),.05,.8,b.s.glass);if(x+.5<5.9)b.b(x+.5,.1,.1,.1,.05,.8,b.s.metal);}});
  b.part('四角铜固定片',()=>{for(const x of[0,5.9])for(const z of[0,.9])b.b(x,.05,z,.1,.1,.1,b.s.bronze);});
 }},
 'BUILT-160':{size:[.9,.3,.9],pitch:.05,features:'0.9×0.3×0.9m青色跑道边灯：石鞋、空腔钢壳、灯芯、透明玻璃盖与四角铜扣',limits:'每件为一个侧灯母版，实例放在跑道中线z±16.5m；不能把两侧复用计两件。仅自发光显示，机场灯光序列和真实点光未实现。',draw:b=>{
  b.part('石质安装鞋和金属底托',()=>{b.b(0,0,0,.9,.1,.9,b.s.stone);b.b(.1,.1,.1,.7,.05,.7,b.s.metal);});
  b.part('钢壳与真实内部腔',()=>{b.b(.1,.15,.1,.7,.1,.7,b.s.metal);b.b(.2,.15,.2,.5,.1,.5,0);b.b(.25,.15,.25,.4,.05,.4,b.s.energy);});
  b.part('承托压圈与独立玻璃顶盖',()=>{b.b(.15,.2,.15,.6,.05,.6,b.s.metal);b.b(.25,.2,.25,.4,.05,.4,0);b.b(.2,.25,.2,.5,.05,.5,b.s.glass);});
  b.part('四角铜扣和电源端口',()=>{for(const x of[.1,.7])for(const z of[.1,.7])b.b(x,.25,z,.1,.05,.1,b.s.bronze);b.b(.35,.05,0,.2,.05,.05,0);});
 }},
 'BUILT-177':{size:[3,3.4,10],pitch:.05,features:'3×10m轨道舱体壳：承载底盘、独立木地板、金属立框、檐口与真实侧门通道',limits:'当前仓库未附原游戏mode尺寸表；3×3.4×10m是明确作者轨道舱接口样件，不能宣称复原所有车型。178玻璃组件、179底灯独立；不含座椅、轮组、驾驶系统、门动画或运行时对象池。',draw:b=>{
  b.part('钢质底盘及木地板',()=>{b.b(0,0,0,3,.15,10,b.s.metal);b.b(.15,.15,.15,2.7,.1,9.7,b.s.wood);});
  b.part('下部涂装金属裙板与端面骨架',()=>{for(const x of[0,2.85])b.b(x,.15,0,.15,1.05,10,b.s.enamel);for(const z of[0,9.8])b.b(0,.15,z,3,1.05,.2,b.s.enamel);b.b(2.85,.25,4,.15,.95,2,0);});
  b.part('连续窗间钢柱、上边梁及敞开侧门',()=>{for(const x of[0,2.85])for(const z of[0,1.8,3.8,5.8,7.8,9.8])b.b(x,1.2,z,.15,1.8,.2,b.s.metal);for(const x of[0,2.85])b.b(x,3,0,.15,.2,10,b.s.metal);for(const z of[0,9.8])b.b(0,3,z,3,.2,.2,b.s.metal);b.b(2.85,.25,4,.15,2.75,1.8,0);});
  b.part('屋顶板、檐沿与金属检修脊',()=>{b.b(0,3.2,0,3,.1,10,b.s.enamel);for(const x of[.1,2.7])b.b(x,3.3,.1,.2,.1,9.8,b.s.metal);for(const z of[.1,9.7])b.b(.1,3.3,z,2.8,.1,.2,b.s.metal);b.b(1.2,3.3,1,.6,.1,8,b.s.metalBright);});
  b.part('窗楣木收边、铜锁及检修开口',()=>{for(const x of[0,2.95])b.b(x,3.05,.2,.05,.1,9.6,b.s.woodEdge);for(const x of[.2,2.6])for(const z of[.2,9.6])b.b(x,3.3,z,.2,.1,.2,b.s.bronze);b.b(.5,.4,0,.6,.4,.2,0);});
 }},
 'BUILT-178':{size:[3,1.8,10],pitch:.05,expectedComponents:11,features:'独立舱窗组件：九片侧窗与前后挡风玻璃、橡胶密封边和连续透明玻璃层',limits:'匹配作者3×10m轨道舱，在177局部Y1.2m安装；右侧4–5.8m侧门留空。11片窗在安装前有意分离，不假造第二个完整车体、座椅或驾驶舱。',draw:b=>{
  b.part('九片侧窗独立密封边',()=>{for(const x of[0,2.95])for(const z of vehiclePanels){if(x>0&&z===4.2)continue;/* rotate a thin front frame into a side plane */b.b(x,0,z,.05,1.8,1.6,b.s.vehicleSeal);b.b(x,.1,z+.1,.05,1.6,1.4,0);}});
  b.part('九片真实薄玻璃侧窗',()=>{for(const x of[0,2.95])for(const z of vehiclePanels){if(x>0&&z===4.2)continue;b.b(x,.1,z+.1,.05,1.6,1.4,b.s.glass);}});
  b.part('前后挡风玻璃密封框',()=>{for(const z of[0,9.95])frame(b,.15,0,z,2.7,1.8,.1,.05,b.s.vehicleSeal);});
  b.part('前后完整玻璃与蚀刻边标',()=>{for(const z of[0,9.95]){b.b(.25,.1,z,2.5,1.6,.05,b.s.glass);b.b(.3,.2,z,.25,.05,.05,b.s.glassEtch);}});
 }},
 'BUILT-179':{size:[3.25,.2,8.5],pitch:.025,features:'车宽+0.25m的独立底部饰带：0.2m高、0.85车长、双侧青灯、散热真孔与金属端接',limits:'作者车宽3m、车长10m，故本件3.25×0.2×8.5m；装在车体下方，中心轴一致。无能源传输或跟随Vehicle逻辑；开放格栅是真几何，不靠贴图。',draw:b=>{
  b.part('连续顶托和两侧钢壳',()=>{b.b(0,.15,0,3.25,.05,8.5,b.s.metal);for(const x of[0,3.2])b.b(x,0,0,.05,.15,8.5,b.s.metal);for(const z of[0,8.45])b.b(0,0,z,3.25,.15,.05,b.s.metal);});
  b.part('双侧灯芯与独立玻璃保护片',()=>{for(const [core,cover] of[[.025,0],[3.2,3.225]]){b.b(core,.075,.25,.025,.05,8,b.s.energy);for(let z=.25;z<8.25;z+=1)b.b(cover,.075,z,.025,.05,.8,b.s.glass);}});
  b.part('底部金属格栅与真实通风孔',()=>{for(let z=.25;z<8.25;z+=.5)b.b(.05,0,z,3.15,.025,.05,b.s.metalBright);});
  b.part('铜端接与四角固定鞋',()=>{for(const x of[0,3.1])for(const z of[0,8.35])b.b(x,0,z,.15,.15,.15,b.s.bronze);});
 }},
 'BUILT-183':{size:[1.8,3.4,.6],pitch:.05,features:'机位标杆：0.2m方杆、3m杆高、1.8×0.8m空白可换牌及石脚铜扣',limits:'按清单保留空白牌，不把参考图字母A或未绑定机位类型烧进几何；侧向安装需检查登机路径。杆高3m，牌居中Y3m，总高3.4m；无租用/登机交互。',draw:b=>{
  b.part('石脚与0.2m方形钢杆',()=>{b.b(.6,0,0,.6,.25,.6,b.s.stone);b.b(.8,0,.2,.2,3,.2,b.s.metal);});
  b.part('实心涂装金属空白牌胎',()=>b.b(0,2.6,.15,1.8,.8,.1,b.s.enamel));
  b.part('独立钢包边和铜扣',()=>{frame(b,0,2.6,.1,1.8,.8,.05,.05,b.s.metal);locks(b,0,2.6,.05,1.8,.8,.1);});
  b.part('背部夹轨和柱面检修盖',()=>{for(const y of[2.7,3.15])b.b(.7,y,.25,.4,.1,.15,b.s.metal);b.b(.8,.35,.15,.2,.35,.05,b.s.metalBright);b.b(.85,.45,.1,.05,.1,.05,b.s.bronze);});
 }},
};
const roles:Record<string,string[]>={
 '153':['structuralConcrete','wall','stone','metal','wood','warm','bronze'],'154':['structuralConcrete','mortar','wall','metal','energy','bronze'],
 '155':['wall','wood','metal','waterproofMembrane','roof','bronze','warm'],'156':['wall','metal','metalBright','wood','bronze','screen','displayWhite','displayGlyph','glass',...signalRoles],
 '157':['wall','wood','metal','metalBright','bronze','screen','displayGlyph','glass',...signalRoles],'158':['pavementConcrete','structuralConcrete','metal','stone','bronze'],
 '159':['metal','warm','glass','bronze'],'160':['stone','metal','energy','glass','bronze'],
 '177':['metal','enamel','wood','woodEdge','metalBright','bronze'],'178':['vehicleSeal','glass','glassEtch'],'179':['metal','metalBright','energy','glass','bronze'],
 '183':['stone','metal','enamel','metalBright','bronze'],
};
export const stationMaterialRules=Object.fromEntries(Object.keys(stationRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:'信号光学灯芯与红色塑料按钮独立；车辆玻璃密封、金属壳、木地板和底灯分开。空白机位牌为涂装金属，不借屏幕或石材。'}]));
export function configureStationAsset(a:Asset,id:string){
 if(!stationRecipes[id])return;const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-153'){empty([4,.4,7],[8,2.4,9.9]);empty([3,3,6.5],[9,7.2,9.5]);a.source!.abutment={widthM:12,depthM:10,heightRule:'max(1, deck-terrain)',authoredDeckM:3,authoredTerrainM:0,blockHeightM:3,historicalFailure:'154.6m rendered end block not consumed by original game body; unresolved runtime integration'};port('bridge','bridge-9000',[6,3,10],[0,0,1],[9,.5,0]);}
 if(id==='BUILT-154'){empty([.4,0,.4],[5.4,.7,5.8]);port('canopy-left','canopy-foot',[1.4,1,8.5],[0,1,0],[.8,0,.8]);port('canopy-right','canopy-foot',[20.6,1,8.5],[0,1,0],[.8,0,.8]);a.source!.platform={widthM:22,depthM:18,thicknessM:1};}
 if(id==='BUILT-155'){port('left','canopy-foot',[1.9,0,5],[0,-1,0],[.8,0,.8]);port('right','canopy-foot',[21.1,0,5],[0,-1,0],[.8,0,.8]);empty([2.3,0,.2],[20.7,5.1,10.8]);a.source!.canopy={postHeightM:6,roofSizeM:[23,11]};}
 if(id==='BUILT-156'||id==='BUILT-157'){a.source!.signal={state:'unbound',lit:false,runtimeBinding:false};a.source!.nodeOffsetM=id==='BUILT-156'?[12,0,11]:[4,0,4];a.source!.anchorM=id==='BUILT-156'?[.5,0,.5]:[2.2,0,.5];}
 if(id==='BUILT-158'){empty([1,0,1],[8,1,43]);a.source!.runway={lengthM:960,widthM:44,worldStartXM:710,worldEndXM:1670,worldTopYM:14.6,localTopYM:1.5,installationPhaseYM:.1,installationTranslationM:[710,13,-22],routeBinding:false};}
 if(id==='BUILT-159')a.source!.marking={planSizeM:[6,1],heightM:.15,routeSegmentBinding:false};
 if(id==='BUILT-160'){empty([.35,.05,0],[.55,.1,.05]);a.source!.runwayOffsetsM=[-16.5,16.5];}
 if(id==='BUILT-177'){empty([.15,.25,.2],[2.85,3,9.8]);empty([2.85,.25,4],[3,3,5.8]);empty([.5,.4,0],[1.1,.8,.2]);a.source!.vehicle={mode:'authored-rail-interface-study',bodyM:[3,3.4,10],originalModeDimensionsAvailable:false};}
 if(id==='BUILT-178'){a.source!.vehicle={bodyM:[3,3.4,10],installM:[0,1.2,0],intentionalWindowComponents:11};empty([2.95,0,4],[3,1.8,5.8]);}
 if(id==='BUILT-179'){a.source!.vehicle={bodyM:[3,3.4,10],widthAdditionM:.25,lengthRatio:.85,installM:[-.125,-.2,.75]};empty([.2,.025,1],[3,.075,1.2]);}
 if(id==='BUILT-183'){a.source!.sign={postSectionM:.2,postHeightM:3,panelSizeM:[1.8,.8],blank:true,padKindBinding:false};}
}
