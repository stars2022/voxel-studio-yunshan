import {Shapes} from './shapes';
import type {Asset,V3} from '../core/types';
import {productionReference,productionStyleRevision} from './style';
import {atlasLifeRecipes,finishAtlasMetadata} from './atlas-life';

type Recipe={size:V3;pitch:number;features:string;draw:(b:Shapes,w:number,h:number,d:number)=>void};
export const lifeRecipes:Record<number,Recipe>={};
const add=(id:number,size:V3,features:string,draw:Recipe['draw'],pitch=.02)=>lifeRecipes[id]={size,pitch,features,draw};
const boxPart=(b:Shapes,name:string,fn:()=>void)=>b.part(name,fn);
add(1,[1.6,.42,2.1],'四足石脚、木构纵梁、金属榫肩和独立床板',(b,w,h,d)=>{
 b.part('床腿、退层石脚和角部榫肩',()=>{for(const x of[0,w-.12])for(const z of[0,d-.12])b.post(x,0,z,.12,h);});
 b.part('纵梁、端梁与内缩承托',()=>{for(const x of[.025,w-.085])b.b(x,.22,.06,.06,.16,d-.12,b.s.wood);for(const z of[.025,d-.085]){b.b(.06,.22,z,w-.12,.16,.06,b.s.wood);b.b(.14,.35,z-.01,w-.28,.02,.02,b.s.woodEdge??b.s.wood);}for(let z=.14;z<d-.12;z+=.16)b.b(.08,h-.04,z,w-.16,.04,.1,b.s.wood);});
});
add(2,[1.48,.2,1.96],'棉白床垫、倒阶软边及下沿包边',(b,w,h,d)=>{b.rounded(0,0,0,w,h,d,.04,b.s.paper??b.s.wall);b.b(.02,.03,0,w-.04,.02,d,b.s.wall);});
add(3,[1.6,1,.12],'双立柱、浅色嵌芯、回纹浮雕与侧控面板',(b,w,h,d)=>{
 b.part('床头立柱、榫肩与横枨',()=>{for(const x of[0,w-.12])b.post(x,.42,0,.12,h-.42,false);b.b(.08,.44,.025,w-.16,.045,.07,b.s.wood);b.b(.08,h-.07,.025,w-.16,.05,.07,b.s.wood);});
 b.part('凹槽浅色嵌板和回纹',()=>{b.inset(.12,.47,.045,w-.24,h-.55,.06,b.s.wall);const mw=.18;b.b(w/2-.13,.61,.015,.26,.26,.03,b.s.recess??b.s.stone);b.b(w/2-.11,.63,.005,.22,.22,.02,b.s.wall);b.hui(w/2-mw/2,.65,-.005,mw,.18,b.s.recess??b.s.metal);});
 b.part('柱侧可更换控制盒',()=>{b.b(w-.07,.64,-.04,.1,.19,.04,b.s.metal);b.b(w-.05,.66,-.05,.06,.15,.02,b.s.screen);for(const y of[.68,.75])b.b(w-.04,y,-.06,.04,.04,.01,b.s.energy);});
},.01);
add(4,[1.48,.13,1.96],'两只独立棉枕、蓝灰被面、折边和侧包缝',(b,w,h,d)=>{b.part('蓝灰被面、棉白折边',()=>{b.rounded(0,0,0,w,.09,d*.72,.03,b.s.fabric);b.b(.02,.085,d*.56,w-.04,.015,.18,b.s.paper??b.s.wall);for(const x of[.02,w-.04])b.b(x,.06,.02,.02,.02,d*.52,b.s.fabricEdge??b.s.fabric);});b.part('双枕',()=>{for(const x of[.08,w/2+.02])b.rounded(x,.02,d-.43,w/2-.12,.11,.34,.04,b.s.paper??b.s.wall);});},.01);
add(5,[.5,.58,.44],'浅色双抽屉、黑色凹拉手、黄铜口沿、角榫和石脚',(b,w,h,d)=>{b.cabinet(w,h,d,1,2,false);b.part('双抽屉的浅色整幅面板与黑金凹拉手',()=>{for(let i=0;i<2;i++){const y=.12+i*(h-.17)/2,hh=(h-.17)/2-.012;b.b(.06,y,-.01,w-.12,hh,.045,b.s.wall);for(const sy of[y+.01,y+hh-.02])b.b(.07,sy,-.015,w-.14,.01,.01,b.s.recess??b.s.stone);b.pull(w/2-.045,y+hh/2-.025,-.035,.09,.05);}});},.01);
add(6,[1.2,2,.56],'中空木柜、承重柱、退层顶框、黄铜角榫和石脚',(b,w,h,d)=>b.cabinet(w,h,d,1,1,false));
add(7,[1.08,1.76,.07],'双扇浅色凹芯门、回纹、长黄铜拉手与明合页',(b,w,h,d)=>{
 for(let i=0;i<2;i++){const x=i*w/2+.01,ww=w/2-.02;b.part('柜门 '+(i+1)+' · 嵌芯与回纹',()=>b.inset(x,0,0,ww,h,d,b.s.wall,true));b.part('柜门 '+(i+1)+' · 拉手和铰接座',()=>{const hx=w/2+(i?.05:-.075);b.b(hx-.01,h*.43,-.035,.045,.26,.02,b.s.metal);b.b(hx,h*.43+.01,-.05,.025,.24,.025,b.s.bronze??b.s.wood);for(const y of[.19,h-.27]){const xx=i?w-.05:.02;b.b(xx,y,-.02,.04,.075,.03,b.s.metal);b.b(xx+.01,y+.01,-.035,.02,.055,.02,b.s.bronze??b.s.wood);}});}
},.01);
add(8,[1.1,1.8,.48],'衣柜分隔、三层搁板与挂衣横杆',(b,w,h,d)=>{b.b(w*.6,0,0,.03,h,d,b.s.wood);for(const y of[.02,.55,1.1,1.65])b.b(w*.6,y,0,w*.4,.03,d,b.s.wood);b.b(.02,h-.14,d*.5,w*.56,.025,.025,b.s.metal);});
add(9,[.65,.8,.09],'台镜底座、轴架与框内玻璃',(b,w,h,d)=>{b.b(0,0,0,w,.04,.24,b.s.wood);for(const x of[.04,w-.08])b.b(x,.04,.08,.04,h-.16,.04,b.s.wood);b.panel(.08,.16,.07,w-.16,h-.2,.04,b.s.glass,b.s.metal);});
function sofaFrame(b:Shapes,w:number,h:number,d:number){
 b.part('四柱、套肩和石脚',()=>{for(const x of[0,w-.1]){b.post(x,0,0,.1,h*.77);b.post(x,0,d-.1,.1,h);}});
 b.part('座框与承托条',()=>{for(const z of[.035,d-.085])b.b(.06,.2,z,w-.12,.08,.05,b.s.wood);for(const x of[.04,w-.08])b.b(x,.2,.04,.04,.08,d-.08,b.s.wood);for(let x=.12;x<w-.1;x+=.14)b.b(x,.25,.07,.07,.03,d-.14,b.s.wood);});
 b.part('透空扶手、下枨与侧竖枨',()=>{for(const x of[.025,w-.075]){b.b(x,h*.77-.07,.06,.05,.06,d-.12,b.s.wood);b.b(x,.28,.06,.05,.035,d-.12,b.s.wood);b.b(x,.315,d*.5,.035,h*.77-.385,.035,b.s.wood);}});
 b.part('透空背架、上枨与嵌接座',()=>{b.b(.07,h-.07,d-.07,w-.14,.05,.05,b.s.wood);for(let x=.18;x<w-.1;x+=.3)b.b(x,.27,d-.06,.04,h-.32,.04,b.s.wood);});
}
add(10,[1.9,.8,.82],'透空木构双人沙发框、独立扶手与石脚',sofaFrame,.01);
add(11,[1.68,.48,.7],'两组独立蓝灰坐垫和靠垫、倒阶边沿与中缝',(b,w,h,d)=>{for(let i=0;i<2;i++){const x=i*w/2+.01,ww=w/2-.02;b.part('软垫 '+(i+1),()=>{b.rounded(x,0,0,ww,.15,d-.04,.025,b.s.fabricEdge??b.s.fabric);b.rounded(x+.01,.025,.01,ww-.02,.13,d-.06,.025,b.s.fabric);b.rounded(x,.14,d-.14,ww,h-.14,.14,.02,b.s.fabricEdge??b.s.fabric);b.rounded(x+.01,.15,d-.15,ww-.02,h-.16,.13,.02,b.s.fabric);});}},.01);
add(12,[.72,.8,.78],'单席透空扶手、木构榫肩、下枨和石脚',sofaFrame,.01);
add(13,[.5,.45,.64],'单席包边坐垫与独立厚靠垫',(b,w,h,d)=>{b.rounded(0,0,0,w,.15,d,.025,b.s.fabricEdge??b.s.fabric);b.rounded(.01,.02,.01,w-.02,.13,d-.02,.025,b.s.fabric);b.rounded(0,.14,d-.14,w,h-.14,.14,.02,b.s.fabricEdge??b.s.fabric);b.rounded(.01,.15,d-.15,w-.02,h-.16,.13,.02,b.s.fabric);},.01);
add(14,[1.1,.42,.62],'茶几束腰、阶梯牙头、四脚套肩及开放下搁板',(b,w,h,d)=>{b.table(w,h,d,false);b.b(.06,.12,.06,w-.12,.03,d-.12,b.s.wood);},.01);
add(15,[1.1,.05,.62],'外露浅石嵌芯、攒边木框和黄铜角扣',(b,w,h,d)=>b.slab(0,0,0,w,h,d),.01);
add(16,[1.4,.76,.7],'浅石嵌芯书桌、束腰、侧枨和真实后走线槽',(b,w,h,d)=>{b.table(w,h,d);b.b(.1,.18,d-.12,w-.2,.045,.05,b.s.wood);for(const x of[.055,w-.105])b.b(x,.18,.08,.05,.04,d-.16,b.s.wood);b.b(w*.43,h-.05,d-.1,w*.14,.05,.045,0);},.01);
add(17,[.4,.7,.46],'独立木面三屉箱、箱内空腔与黑金凹拉手',(b,w,h,d)=>{b.cabinet(w,h,d,1,3,false);for(let i=0;i<3;i++){const y=.1+i*(h-.13)/3,hh=(h-.13)/3-.01;b.b(.055,y,0,w-.11,hh,.035,b.s.wood);b.b(.065,y+.01,-.01,w-.13,.01,.01,b.s.woodEdge??b.s.wood);b.pull(w/2-.04,y+hh/2-.02,-.03,.08,.04);}},.01);
add(18,[.6,.46,.22],'攒框终端屏、分层石座、角榫、后壳散热和静态体素界面',(b,w,h,d)=>{
 b.part('分层基座、颈架及固定鞍座',()=>{b.b(.1,0,.015,w-.2,.025,d-.03,b.s.metal);b.b(.12,.025,.035,w-.24,.02,d-.07,b.s.wall);b.b(.15,.045,.045,w-.3,.02,d-.09,b.s.metal);b.b(w/2-.04,.06,.11,.08,.095,.06,b.s.metal);b.b(w/2-.025,.075,.1,.05,.04,.01,b.s.bronze??b.s.wood);for(const x of[.1,w-.14])b.b(x,.015,.015,.04,.04,.035,b.s.bronze??b.s.wood);b.b(.2,.015,.005,w-.4,.01,.01,b.s.energy);});
 b.part('通风后壳与可分选框架',()=>{b.b(.025,.15,.125,w-.05,.27,.06,b.s.metal);for(const x of[.015,w-.045])for(let y=.18;y<.4;y+=.035)b.b(x,y,.175,.03,.015,.025,b.s.trim??b.s.metal);b.panel(0,.14,.065,w,h-.14,.045,b.s.metal,b.s.trim??b.s.metal);b.b(.025,.165,.04,w-.05,h-.19,.035,b.s.screen);for(const x of[0,w-.04])for(const y of[.14,h-.04])b.b(x,y,.035,.04,.04,.025,b.s.bronze??b.s.wood);b.b(.055,h-.02,.035,w-.11,.01,.015,b.s.energy);});
 b.part('屏内静态体素图形：刻度、回形导航和状态列',()=>{const e=b.pitch,z=.03,c=b.s.energy;b.b(.04,.18,z,.01,.23,.01,c);b.b(.04,.18,z,.43,.01,.01,c);b.hui(.1,.23,z,.16,.16,c);for(let i=0;i<3;i++){b.b(.41,.24+i*.055,z,.02,.025,e,c);b.b(.45,.25+i*.055,z,.09,.01,e,c);}for(let i=0;i<6;i++)b.b(.29+i*.02,.195,z,.01,.015+(i%3)*.012,e,c);});
},.01);
add(19,[.52,.04,.2],'独立按键阵列、空格键与托板',(b,w,h,d)=>{b.b(0,0,0,w,.02,d,b.s.metal);for(let z=.025;z<d-.03;z+=.04)for(let x=.02;x<w-.03;x+=.04)b.b(x,.02,z,.025,.015,.025,b.s.wall);b.b(.12,.02,.015,.25,.02,.025,b.s.wood);},.01);
add(20,[.28,.48,.3],'台灯底座、两段关节臂、薄罩',(b,w,h,d)=>{b.cylinder(w/2,0,d/2,.12,.035,b.s.metal);b.beam([w/2,.03,d/2],[w/2,.29,d*.8],.035,b.s.metal);b.beam([w/2,.29,d*.8],[w/2,.44,d*.45],.03,b.s.metal);b.b(.025,.42,.02,w-.05,.04,.2,b.s.metal);b.b(.045,.4,.04,w-.09,.02,.16,b.s.warm);},.01);
add(21,[1.4,.74,.82],'攒边浅石芯餐桌、束腰、插肩牙头、套脚和角件',(b,w,h,d)=>b.table(w,h,d),.01);
add(22,[.44,.88,.46],'三枨透空靠背、回纹中牌、蓝灰坐垫、横枨与套脚',(b,w,h,d)=>{
 b.table(w,.44,d,false);b.b(.025,.4,.025,w-.05,.035,d-.05,b.s.wood);b.rounded(.04,.435,.035,w-.08,.03,d-.07,.01,b.s.fabric);
 for(const x of[.01,w-.08])b.post(x,0,d-.09,.08,h);b.b(.055,h-.065,d-.08,w-.11,.045,.045,b.s.wood);for(const x of[w*.27,w*.49,w*.71])b.b(x,.46,d-.065,.025,h-.53,.025,b.s.wood);
 b.b(w/2-.06,h-.17,d-.09,.12,.11,.025,b.s.wood);b.b(w/2-.045,h-.15,d-.1,.09,.075,.02,b.s.wall);b.hui(w/2-.03,h-.135,d-.11,.06,.06,b.s.metal,.01);
 for(const z of[.06,d-.1])b.b(.065,.16,z,w-.13,.03,.035,b.s.wood);for(const x of[.065,w-.1])b.b(x,.16,.06,.035,.03,d-.12,b.s.wood);
},.01);
add(23,[.38,.44,.38],'圆凳厚面、四脚与脚枨',(b,w,h,d)=>{b.cylinder(w/2,h-.06,d/2,w/2,.06,b.s.wood);b.feet(w,d,h-.04);b.b(.06,.16,.06,w-.12,.04,.04,b.s.wood);b.b(.06,.16,d-.1,w-.12,.04,.04,b.s.wood);});
add(24,[.9,.9,.34],'百叶鞋柜、四层透气门',(b,w,h,d)=>{b.cabinet(w,h,d,2,3);for(let y=.15;y<h-.05;y+=.09)b.b(.04,y,-.01,w-.08,.055,.04,b.s.wood);b.b(w/2-.02,.14,-.03,.04,h-.18,.04,b.s.metal);});
add(25,[.9,.22,.24],'搁板、两只三角支撑托臂',(b,w,h,d)=>{b.b(0,h-.035,0,w,.035,d,b.s.wood);for(const x of[.08,w-.1]){b.b(x,0,d-.025,.025,h,.025,b.s.metal);b.beam([x,0,d-.02],[x,h-.04,.02],.025,b.s.metal);}});
add(26,[1.8,.09,.1],'双轨、端盖与挂环',(b,w,h,d)=>{for(const z of[.01,.065])b.b(0,.04,z,w,.025,.02,b.s.metal);for(const x of[0,w-.04])b.b(x,.02,0,.04,h-.02,d,b.s.wood);for(let x=.1;x<w-.06;x+=.12)b.b(x,0,.01,.02,.04,.06,b.s.metal);},.01);
add(27,[.8,1.8,.1],'真实褶皱帘片、上沿与下摆',(b,w,h,d)=>{for(let x=0;x<w;x+=b.pitch){const z=.03+.025*Math.cos(x*Math.PI/.05);b.b(x,0,z,b.pitch,h,.02,b.s.fabric);}b.b(0,h-.06,0,w,.06,d,b.s.wood);},.02);
add(28,[.56,.14,.56],'吸顶灯外框、退面漫射板与角扣',(b,w,h,d)=>{b.b(0,.06,0,w,.08,d,b.s.wood);b.b(.04,.025,.04,w-.08,.06,d-.08,b.s.warm);for(const x of[0,w-.06])for(const z of[0,d-.06])b.b(x,0,z,.06,h,.06,b.s.metal);});
add(29,[.18,.42,.14],'背板、固定臂、双框护罩',(b,w,h,d)=>{b.b(.025,0,d-.025,w-.05,h,.025,b.s.metal);b.b(.065,.1,0,.05,.04,d,b.s.metal);b.b(0,.08,0,w,.04,.12,b.s.wood);b.b(0,h-.08,0,w,.04,.12,b.s.wood);b.b(.025,.12,.02,w-.05,h-.2,.07,b.s.warm);for(const x of[0,w-.02])b.b(x,.08,0,.02,h-.12,.02,b.s.metal);},.01);
add(30,[.18,.16,.03],'嵌框开关、插孔及螺钉',(b,w,h,d)=>{b.panel(0,0,0,w,h,d,b.s.wall);b.b(.025,.04,-.01,.065,.08,.02,b.s.metal);for(const x of[.12,.145])b.b(x,.06,-.01,.01,.03,.02,b.s.screen);},.01);
add(31,[1.8,.02,1.2],'边框、四角回纹及短穗几何',(b,w,h,d)=>{b.b(0,0,0,w,h,d,b.s.fabric);for(const z of[.06,d-.1])b.b(.06,0,z,w-.12,h,.04,b.s.wood);for(const x of[.06,w-.1])b.b(x,0,.06,.04,h,d-.12,b.s.wood);for(let x=.06;x<w;x+=.08)for(const z of[-.04,d])b.b(x,0,z,.025,h,.04,b.s.fabric);});
add(32,[1.6,.82,.76],'加固工作桌、交叉侧撑、工具挂条',(b,w,h,d)=>{b.table(w,h,d);for(const x of[.07,w-.08])b.beam([x,.16,.08],[x,.63,d-.08],.04,b.s.metal);b.b(.12,.2,d-.12,w-.24,.06,.05,b.s.wood);});
add(37,[1.2,.82,.6],'操作柜双门、退脚与抽屉',(b,w,h,d)=>b.cabinet(w,h,d,2,2,true));
add(38,[1.24,.06,.64],'台面边口、后挡水条',(b,w,h,d)=>{b.b(0,0,0,w,h,d,b.s.stone);b.b(0,h,d-.035,w,.075,.035,b.s.stone);});
add(39,[.72,1.3,.52],'双灶圈、旋钮、烟罩与烟道',(b,w,h,d)=>{b.part('灶面与双炉圈',()=>{b.b(0,0,0,w,.06,d,b.s.metal);for(const x of[w*.25,w*.75]){b.cylinder(x,.06,d*.56,.115,.02,b.s.metal,.075);b.cylinder(x,.06,.07,.025,.025,b.s.wood);}});b.part('悬挂烟罩与烟道',()=>{b.b(.04,.86,0,w-.08,.12,d,b.s.metal);b.b(.1,.98,.05,w-.2,.08,d-.1,b.s.metal);b.b(w/2-.12,1.06,d-.25,.24,.24,.22,b.s.metal);});});
function faucet(b:Shapes,x:number,y:number,z:number){b.b(x,y,z,.025,.2,.025,b.s.metal);b.b(x,y+.175,z-.12,.025,.025,.145,b.s.metal);b.b(x,y+.145,z-.12,.025,.055,.025,b.s.metal);}
function sink(b:Shapes,w:number,h:number,d:number){b.part('盆体、排水孔与翻边',()=>{b.rounded(0,0,0,w,h,d,.04,b.s.ceramic);b.rounded(.045,.04,.04,w-.09,h,d-.13,.03,0);b.b(.04,h-.03,.04,w-.08,.03,.025,b.s.metal);b.b(w/2-.02,.02,d/2-.02,.04,.02,.04,b.s.metal);});b.part('龙头与阀钮',()=>{faucet(b,w/2-.02,h-.04,d-.065);for(const x of[w/2-.12,w/2+.1])b.b(x,h-.02,d-.07,.035,.03,.035,b.s.metal);});}
add(40,[.66,.18,.48],'空腔水槽、翻边和独立弯头龙头',sink,.01);
add(41,[.8,.68,.32],'壁挂柜、开放搁层及玻璃门',(b,w,h,d)=>{b.cabinet(w,h,d,2,2);for(const x of[.04,w/2+.01])b.panel(x,.36,-.01,w/2-.06,.28,.025,b.s.glass);});
add(42,[.66,1.7,.46],'通风食品柜、五层隔板、门扇拉手',(b,w,h,d)=>{b.cabinet(w,h,d,2,5,true);for(let x=.06;x<w-.04;x+=.08)b.b(x,h-.2,-.04,.025,.12,.02,b.s.metal);});
add(43,[.68,1.82,.68],'双温区冰箱门、门封缝、把手、底部散热',(b,w,h,d)=>{b.cabinet(w,h,d,1,4,false,b.s.wall);for(const[y,rh]of[[.13,.98],[1.14,.64]]){b.panel(.015,y,-.035,w-.03,rh,.065,b.s.wall);b.b(.06,y+.1,-.06,.025,.3,.025,b.s.metal);}for(let x=.06;x<w-.05;x+=.05)b.b(x,.045,-.01,.02,.04,.025,b.s.metal);});
add(44,[.36,.16,.28],'中空圆锅、双耳与加厚锅底',(b,w,h,d)=>{b.bowl(w/2,0,d/2,.14,h,b.s.metal);for(const x of[0,w-.035])b.b(x,.08,.09,.035,.025,.1,b.s.wood);},.01);
add(45,[.28,.07,.28],'阶梯弧盖、玻璃盖芯与提钮',(b,w,h,d)=>{b.cylinder(w/2,0,d/2,.14,.02,b.s.metal);b.cylinder(w/2,.02,d/2,.12,.02,b.s.glass);b.b(w/2-.035,.035,d/2-.02,.07,.035,.04,b.s.wood);},.01);
add(46,[.2,.08,.2],'带圈足的空心陶碗',(b,w,h,d)=>{b.cylinder(w/2,0,d/2,.05,.015,b.s.ceramic,.03);b.bowl(w/2,.015,d/2,.1,h-.015,b.s.wall);},.01);
add(47,[.16,.16,.13],'中空杯、环形把手与圈足',(b,w,h,d)=>{b.cylinder(.06,0,.065,.06,.02,b.s.ceramic);b.cylinder(.06,.02,.065,.06,h-.02,b.s.ceramic,.04);b.b(.11,.035,.045,.05,.09,.035,b.s.ceramic);b.b(.12,.055,.045,.025,.05,.035,0);},.01);
add(48,[.42,.05,.28],'圆角砧板、菜刀刀刃与木柄',(b,w,h,d)=>{b.rounded(0,0,0,w,.025,d,.02,b.s.wood);b.b(.08,.025,.08,.18,.015,.09,b.s.metal);b.b(.26,.025,.1,.12,.025,.045,b.s.wood);},.01);
add(49,[.5,.18,.34],'茶盘、空心茶壶、壶嘴、提手与双杯',(b,w,h,d)=>{b.b(0,0,0,w,.025,d,b.s.wood);b.bowl(.16,.025,.16,.09,.11,b.s.ceramic);b.cylinder(.16,.135,.16,.08,.02,b.s.ceramic);b.b(.145,.155,.145,.03,.025,.03,b.s.wood);b.beam([.22,.1,.16],[.28,.15,.16],.03,b.s.ceramic);for(const z of[.09,.25])b.bowl(.38,.025,z,.05,.06,b.s.wall);},.01);
add(50,[.82,.76,.5],'悬空洗面柜、双抽屉和搁层',(b,w,h,d)=>b.cabinet(w,h,d,2,2,true,b.s.wood));
add(51,[.74,.14,.46],'浅陶盆、溢流与鹅颈龙头',sink,.01);
add(52,[.4,.78,.7],'中空马桶盆、座圈、存水底座及水箱',(b,w,h,d)=>{b.rounded(.08,0,.13,w-.16,.32,.4,.05,b.s.wall);b.bowl(w/2,.24,.26,.19,.16,b.s.wall);b.cylinder(w/2,.4,.26,.2,.035,b.s.wall,.13);b.rounded(.02,.38,.49,w-.04,.4,.2,.025,b.s.wall);b.b(.26,.68,.48,.07,.025,.025,b.s.metal);});
add(53,[.78,.55,1.64],'真实内腔浴缸、厚唇、排水口',(b,w,h,d)=>{b.rounded(0,0,0,w,h,d,.1,b.s.wall);b.rounded(.065,.1,.09,w-.13,h,d-.18,.08,0);b.b(w/2-.035,.09,d-.26,.07,.02,.07,b.s.metal);});
add(54,[.9,1.9,.05],'薄玻璃隔屏、压条与竖把手',(b,w,h,d)=>{b.panel(0,0,0,w,h,d,b.s.glass);b.b(w-.15,.78,-.035,.025,.28,.035,b.s.metal);});
add(55,[.6,.8,.04],'镜面与四边退层金属框',(b,w,h,d)=>b.panel(0,0,0,w,h,d,b.s.glass));
add(56,[.22,.18,.15],'法兰接头、转角管与十字阀柄',(b,w,h,d)=>{b.cylinder(.07,0,.075,.035,.13,b.s.metal,.015);b.cylinder(.07,.13,.075,.065,.02,b.s.metal,.015);b.b(.025,.155,.065,.18,.025,.025,b.s.wood);b.b(.065,.155,.015,.025,.025,.12,b.s.wood);},.01);
add(57,[.55,.2,.09],'双墙座、挂杆和折挂毛巾',(b,w,h,d)=>{for(const x of[.02,w-.06]){b.b(x,.1,.05,.04,.08,.04,b.s.metal);b.b(x,.13,0,.04,.025,.09,b.s.metal);}b.b(.04,.13,0,w-.08,.025,.025,b.s.metal);b.b(.13,0,.015,.24,.15,.02,b.s.fabric);},.01);
add(64,[1.6,1.02,.64],'售货柜台、退台与开架收纳',(b,w,h,d)=>{b.cabinet(w,h-.08,d-.06,3,2);b.b(-.025,h-.08,-.025,w+.05,.08,d+.05,b.s.wood);b.panel(.05,.17,d-.06,w-.1,.68,.04,b.s.wall,b.s.wood);});
add(65,[.6,.38,.5],'空食品陈列托、两级抬架',(b,w,h,d)=>{for(let i=0;i<2;i++){b.b(0,.1+i*.14,.02+i*.22,w,.03,.24,b.s.wood);for(const x of[.02,w-.05])b.b(x,0,.05+i*.22,.03,.1+i*.14,.03,b.s.metal);}b.b(.03,.27,.3,w-.06,.09,.17,b.s.wood);b.b(.055,.29,.325,w-.11,.1,.12,0);});
add(66,[1.2,1.8,.48],'五层货架、背交叉拉撑与调平脚',(b,w,h,d)=>{b.cabinet(w,h,d,1,5,false,b.s.metal);b.beam([.04,.12,d],[w-.04,h-.06,d],.025,b.s.metal);});
add(67,[.72,.44,.4],'三只抽屉盒及独立分格',(b,w,h,d)=>b.cabinet(w,h,d,3,2,true));
add(68,[.6,.06,.025],'价格签夹槽、边唇与空白插片',(b,w,h,d)=>{b.b(0,0,0,w,h,d,b.s.metal);b.b(.02,.012,-.01,w-.04,h-.024,.01,b.s.wall);},.01);
add(69,[.48,.2,.34],'透缝篮筐、底板、口沿',(b,w,h,d)=>{b.b(0,0,0,w,.025,d,b.s.wood);for(let x=0;x<w;x+=.06)for(const z of[0,d-.02])b.b(x,0,z,.03,h,.02,b.s.wood);for(let z=0;z<d;z+=.06)for(const x of[0,w-.02])b.b(x,0,z,.02,h,.03,b.s.wood);for(const z of[0,d-.02])b.b(0,h-.03,z,w,.03,.02,b.s.wood);});
add(70,[1.6,.42,1.2],'折面布棚、横梁、布幔下摆',(b,w,h,d)=>{for(let z=0;z<d;z+=b.pitch)b.b(0,h-z*.22,z,w,.02,b.pitch,b.s.fabric);b.b(0,.1,d-.03,w,.15,.025,b.s.fabric);for(const x of[.02,w-.04])b.beam([x,h,0],[x,.15,d],.025,b.s.metal);});
function crate(b:Shapes,w:number,h:number,d:number,metal=false){const m=metal?b.s.metal:b.s.wood;b.part('箱体、内腔和边框',()=>{b.b(0,0,0,w,h,d,m);b.b(.04,.04,.04,w-.08,h,d-.08,0);for(const x of[0,w-.055])for(const z of[0,d-.055])b.b(x,0,z,.055,h,.055,b.s.metal);});b.part('板缝、提手和侧面加强',()=>{for(let y=.1;y<h-.05;y+=.14){b.b(.06,y,-.01,w-.12,.025,.01,b.s.wall);b.b(.06,y,d,w-.12,.025,.01,b.s.wall);}for(const x of[.08,w-.15])b.b(x,h-.12,-.02,.07,.03,.035,b.s.metal);});}
add(71,[.5,.4,.42],'开口木板包装箱、角包铁与提手',(b,w,h,d)=>crate(b,w,h,d));
add(72,[.9,.72,.66],'加固仓储箱、横板、角件及双扣',(b,w,h,d)=>{crate(b,w,h,d);b.b(.04,h-.04,.04,w-.08,.04,d-.08,b.s.wood);for(const x of[w*.25,w*.75])b.b(x-.02,h-.08,0,.04,.1,d,b.s.metal);});
add(73,[.3,.12,.03],'空白编码牌、铆钉与封条',(b,w,h,d)=>{b.panel(0,0,0,w,h,d,b.s.wall);for(const x of[.015,w-.025])b.b(x,.05,-.01,.01,.02,.01,b.s.metal);},.01);
add(74,[.42,.52,.3],'软袋折面、收口边和两只环提手',(b,w,h,d)=>{b.rounded(0,0,0,w,h-.12,d,.05,b.s.fabric);b.b(.04,.04,.04,w-.08,h,d-.08,0);for(const z of[.02,d-.04]){b.b(.12,h-.18,z,w-.24,.18,.025,b.s.fabric);b.b(.15,h-.12,z,w-.3,.09,.025,0);}});
add(75,[1.2,.16,.8],'三墩九脚、上下交错托盘条',(b,w,h,d)=>{for(const x of[0,w/2-.06,w-.12])for(const z of[0,d/2-.06,d-.12])b.b(x,.025,z,.12,.1,.12,b.s.wood);for(const x of[0,w/2-.06,w-.12])b.b(x,0,0,.12,.025,d,b.s.wood);for(let z=0;z<d-.01;z+=.16)b.b(0,.125,z,w,.035,.11,b.s.wood);});
add(76,[.8,.7,.6],'双环形绑带与棘轮扣',(b,w,h,d)=>{for(const x of[.14,w-.18]){b.b(x,0,0,.04,h,d,b.s.fabric);b.b(x,b.pitch,b.pitch,.04,h-2*b.pitch,d-2*b.pitch,0);b.b(x-.01,.25,-.03,.06,.09,.05,b.s.metal);}});
add(77,[1.8,2.2,.8],'仓储梁柱、三层横梁、斜撑与脚板',(b,w,h,d)=>{for(const x of[0,w-.06])for(const z of[0,d-.06]){b.b(x,0,z,.06,h,.06,b.s.metal);b.b(x-.04,0,z-.04,.14,.04,.14,b.s.metal);}for(const y of[.2,1.1,2.05])for(const z of[0,d-.06])b.b(0,y,z,w,.1,.06,b.s.wood);for(const x of[0,w-.06])b.beam([x,.15,0],[x,h-.15,d],.035,b.s.metal);});
add(78,[1.6,.72,.62],'输送滚筒、侧梁、四脚与驱动罩',(b,w,h,d)=>{b.feet(w,d,h-.1,b.s.metal);for(const z of[0,d-.05])b.b(0,h-.14,z,w,.1,.05,b.s.metal);for(let x=.08;x<w-.05;x+=.12)b.cylinder(x,h-.075,.04,.055,d-.08,b.s.metal,0,'z');b.b(.1,.34,d-.02,.3,.2,.15,b.s.wood);});
add(79,[1.2,.46,.9],'升降平台、交叉剪架、底框',(b,w,h,d)=>{b.b(0,0,0,w,.06,d,b.s.metal);b.b(0,h-.06,0,w,.06,d,b.s.stone);for(const z of[.14,d-.14]){b.beam([.1,.06,z],[w-.1,h-.06,z],.05,b.s.metal);b.beam([w-.1,.06,z],[.1,h-.06,z],.05,b.s.metal);}});
add(80,[.52,.52,.42],'磅秤底座、秤盘、支杆与读数框',(b,w,h,d)=>{b.rounded(0,0,0,w,.09,d,.03,b.s.metal);b.b(.03,.09,.03,w-.06,.04,d-.08,b.s.wall);b.b(w-.08,.09,d-.06,.035,h-.1,.035,b.s.metal);b.panel(w-.22,h-.13,d-.08,.22,.13,.05,b.s.screen);});
add(81,[1.8,.88,.8],'厚作业台、下架、虎钳与孔板',(b,w,h,d)=>{b.table(w,h,d);b.b(.07,.17,.07,w-.14,.04,d-.14,b.s.wood);b.b(.16,h-.02,-.08,.18,.12,.26,b.s.metal);b.b(.15,h+.08,-.08,.025,.09,.18,b.s.metal);b.b(.31,h+.08,-.08,.025,.09,.18,b.s.metal);});
add(82,[1.3,1.42,.76],'机床床身、刀架、工件槽、防护窗',(b,w,h,d)=>{b.cabinet(w,.6,d,2,1,true,b.s.metal);b.b(.08,.62,.12,w-.16,.12,d-.2,b.s.stone);for(const x of[.06,w-.18])b.b(x,.6,.18,.12,.64,.38,b.s.metal);b.b(.08,1.18,.2,w-.16,.1,.34,b.s.metal);b.panel(.3,.83,.1,.68,.42,.04,b.s.glass);b.b(w-.23,.8,0,.18,.28,.08,b.s.screen);});
add(83,[.9,1.4,.25],'工具孔架、四类挂具与底盘',(b,w,h,d)=>{b.panel(0,.3,d-.04,w,h-.3,.04,b.s.wood);for(const x of[.05,w-.09])b.b(x,0,d-.06,.04,.4,.06,b.s.metal);b.b(0,0,0,w,.04,d,b.s.metal);for(let i=0;i<5;i++){const x=.12+i*.15;b.b(x,.55+i%2*.2,d-.09,.025,.38,.04,b.s.metal);b.b(x-.045,.88+i%2*.2,d-.1,.11,.05,.04,b.s.metal);}});
add(84,[1.2,.96,.68],'切割机机座、圆锯护罩、轨台与控制盒',(b,w,h,d)=>{b.cabinet(w,.48,d,2,1,true,b.s.metal);b.b(.04,.5,.05,w-.08,.05,d-.1,b.s.stone);b.cylinder(.75,.65,.32,.29,.06,b.s.metal,0,'z');b.cylinder(.75,.65,.305,.08,.08,b.s.wood,0,'z');b.b(.08,.54,.06,.16,.22,.2,b.s.screen);});
add(85,[.44,.34,.4],'不规则矿石体与矿脉色块',(b,w,h,d)=>{for(let y=0;y<h;y+=b.pitch){const f=1-Math.abs(y/h-.4)*.6;b.rounded(w*(1-f)/2,y,d*(1-f)/2,w*f,b.pitch,d*f,.005,b.s.stone);}b.b(.08,.22,.12,.12,.08,.13,b.s.ceramic);b.b(.27,.08,.07,.07,.12,.1,b.s.metal);});
add(86,[.58,.4,.4],'透气采收筐、加强筋与扣手',(b,w,h,d)=>{crate(b,w,h,d);for(let x=.08;x<w-.06;x+=.08)for(const z of[0,d-.04])b.b(x,.08,z,.035,h-.16,.04,0);});
add(87,[.8,1.1,.4],'渔网骨架、可见网孔、收纳箱',(b,w,h,d)=>{crate(b,.5,.32,d);b.b(.58,0,.15,.035,h,.035,b.s.wood);b.b(.4,h-.04,.15,.4,.035,.035,b.s.wood);for(let x=.42;x<.8;x+=.06)b.b(x,.56,.15,.012,.51,.012,b.s.fabric);for(let y=.56;y<h;y+=.06)b.b(.4,y,.15,.4,.012,.012,b.s.fabric);});
add(88,[.8,.56,.5],'保温冷链箱、密封圈、扣锁与把手',(b,w,h,d)=>{crate(b,w,h,d,true);b.b(.025,h-.065,.025,w-.05,.04,d-.05,b.s.wall);for(const x of[.14,w-.18])b.b(x,h-.12,-.025,.04,.16,.05,b.s.metal);b.b(.1,.18,-.015,w-.2,.06,.02,b.s.energy);});
function terminal(b:Shapes,w:number,h:number,d:number){
 const e=b.pitch,gold=b.s.bronze??b.s.wood,deck=h*.46,screenY=h*.56,screenH=h*.35;
 b.part('石脚、下柜和浅色检修嵌板',()=>{b.b(0,0,0,w,.05,d,b.s.wall);b.cabinet(w,deck,d,1,1,false);b.inset(.075,.13,-.015,w-.15,deck-.21,.05,b.s.wall,true);b.b(.1,.23,-.035,.025,.11,.025,gold);});
 b.part('木构框、后机箱、柱帽和侧散热片',()=>{b.b(.045,deck,d*.53,w-.09,h-deck-.07,d*.43,b.s.metal);for(const x of[.035,w-.115]){b.post(x,deck,d*.46,.08,h-deck,false);for(let y=screenY;y<h-.12;y+=.065)b.b(x-.015,y,d*.6,.025,.025,d*.26,b.s.trim??b.s.metal);}b.b(.06,h-.075,d*.43,w-.12,.055,.12,b.s.wood);});
 b.part('屏框、静态住宅标识与状态栏',()=>{const z=d*.5-.025;b.inset(.11,screenY,z,w-.22,screenH,.045,b.s.screen);const cx=w/2,cy=screenY+screenH*.58;for(let i=0;i<4;i++)b.b(cx-(i+1)*e,cy+(3-i)*e,z-e,2*(i+1)*e,e,e,b.s.energy);b.b(cx-3*e,cy-4*e,z-e,6*e,4*e,e,b.s.energy);b.b(cx-e,cy-4*e,z-e,2*e,3*e,e,b.s.screen);for(let i=0;i<3;i++){b.b(.16,screenY+.055+i*.055,z-e,.035,.02,e,b.s.energy);b.b(.215,screenY+.065+i*.055,z-e,w-.38,.01,e,b.s.energy);}});
 b.part('有支撑的输入托盘、体素按键与接口',()=>{b.slab(.04,deck,0,w-.08,.05,d*.65);b.b(.1,deck+.05,.07,w-.2,e,d*.34,b.s.glass);for(let row=0;row<3;row++)for(let col=0;col<5;col++)b.b(.12+col*(w-.28)/5,deck+.05+e,.08+row*.04,.025,e,.02,b.s.energy);for(const x of[.02,w-.06]){b.b(x,screenY-.01,d*.46-.04,.04,.14,.03,b.s.metal);for(const y of[screenY+.015,screenY+.08])b.b(x+e,y,d*.46-.05,.02,.035,e,b.s.energy);}});
}
add(89,[.64,1.28,.52],'金融终端、键盘台、出钞槽与屏幕',(b,w,h,d)=>{terminal(b,w,h,d);b.b(.12,.38,-.03,w-.24,.035,.04,b.s.screen);});
add(90,[.68,.5,.18],'柜台双面屏、支柱与文件传递口',(b,w,h,d)=>{b.b(.12,0,0,w-.24,.03,d,b.s.metal);b.b(w/2-.025,.03,.065,.05,.12,.05,b.s.metal);b.panel(0,.15,.04,w,h-.15,.08,b.s.screen);});
add(91,[.36,.36,.25],'签收终端、立式扫码头与输入面',(b,w,h,d)=>{b.b(0,0,0,w,.06,d,b.s.metal);b.panel(.04,.16,.13,w-.08,.2,.06,b.s.screen);b.b(.12,.04,.17,.1,.14,.055,b.s.metal);b.b(.03,.06,.025,w-.06,.02,.09,b.s.wall);},.01);
add(92,[.25,.24,.25],'敞口粮袋与独立米粒颗粒',(b,w,h,d)=>{b.rounded(0,0,0,w,h-.03,d,.04,b.s.fabric);for(let x=.04;x<w-.02;x+=.04)for(let z=.04;z<d-.02;z+=.04)b.b(x,h-.04+(x*7% .025),z,.02,.035,.025,b.s.wall);},.01);
add(93,[.24,.3,.24],'叶菜主茎、展开叶片和根部',(b,w,h,d)=>{b.b(.1,0,.1,.04,.15,.04,b.s.wood);for(let i=0;i<6;i++){const a=i*Math.PI/3;for(let k=0;k<12;k++){const f=k/12;b.rounded(.12+Math.cos(a)*.08*f-.035,.06+f*.2,.12+Math.sin(a)*.08*f-.035,.07*(1-f*.6),.04,.07*(1-f*.6),.015,b.s.leaf);}}},.01);
add(94,[.36,.09,.14],'鱼身、尾鳍、背鳍和眼位',(b,w,h,d)=>{b.rounded(.045,.01,.025,.25,.075,.09,.035,b.s.stone);b.b(.3,.02,0,.06,.055,d,b.s.metal);b.b(.16,.07,.06,.06,.025,.02,b.s.metal);b.b(.06,.065,.04,.012,.015,.012,b.s.screen);},.01);
add(95,[.48,.4,.4],'工业材料袋、捆扎与规格牌',(b,w,h,d)=>{b.rounded(0,0,0,w,h,d,.05,b.s.wall);for(const x of[.1,w-.13])b.b(x,0,-.01,.03,h,d+.02,b.s.metal);b.panel(.17,.12,-.02,.14,.16,.02,b.s.wood);});
add(96,[.34,.22,.24],'药盒、药瓶、封口和空白标签',(b,w,h,d)=>{b.b(0,0,0,.15,h,.2,b.s.wall);b.panel(.025,.04,-.01,.1,.12,.01,b.s.leaf);b.cylinder(.26,0,.12,.06,.17,b.s.glass);b.cylinder(.26,.17,.12,.05,.05,b.s.wood);},.01);

add(106,[.22,.055,.3],'书脊、上下硬封与内缩书页',(b,w,h,d)=>{b.b(0,0,0,w,.01,d,b.s.wood);b.b(0,h-.01,0,w,.01,d,b.s.wood);b.b(0,0,0,.015,h,d,b.s.wood);b.b(.015,.01,.015,w-.03,h-.02,d-.03,b.s.wall);},.01);
add(107,[.48,.045,.3],'卷轴双杆、展开纸面、卷头',(b,w,h,d)=>{b.b(.04,.015,.01,w-.08,.01,d-.02,b.s.wall);for(const x of[.025,w-.025])b.cylinder(x,.023,-.02,.025,d+.04,b.s.wood,0,'z');},.01);
add(108,[1.16,1.88,.34],'四柱木架、双开放书格、浅色双下柜门、书本与盆栽',(b,w,h,d)=>{
 b.part('四柱石脚与框架横枨',()=>{for(const x of[0,w-.1])for(const z of[0,d-.1])b.post(x,0,z,.1,h);for(const y of[.12,.72,1.27,h-.075])b.b(.06,y,.04,w-.12,.045,d-.08,b.s.wood);b.b(.06,.14,d-.035,w-.12,.59,.035,b.s.wood);b.b(w/2-.025,1.3,d-.16,.05,h-1.35,.13,b.s.wood);});
 b.part('下柜双扇门、回纹嵌芯与黄铜拉手',()=>{for(let i=0;i<2;i++){const x=.1+i*(w-.2)/2,ww=(w-.2)/2-.015;b.inset(x,.18,.035,ww,.51,.04,b.s.wall,true);b.b(w/2+(i?.035:-.055),.35,.005,.02,.16,.025,b.s.bronze??b.s.wood);}});
 b.part('上格有厚度的书脊、书页和书挡',()=>{for(const y of[.765,1.315])for(let i=0;i<5;i++){if(y>1) {if(i<2)continue;}const x=.13+i*.105,hh=.26+(i%3)*.05,m=i%2?b.s.fabric:b.s.woodEdge??b.s.wood;b.b(x,y,.1,.075,hh,.19,m);b.b(x+.012,y+.015,.115,.05,hh-.03,.165,b.s.paper??b.s.wall);b.b(x+.025,y+.055,.085,.025,.025,.02,b.s.bronze??b.s.wall);}b.b(.76,.765,.11,.22,.035,.17,b.s.fabric);b.b(.78,.8,.12,.21,.03,.16,b.s.paper??b.s.wall);});
 b.part('上格盆栽的盆体、主干与分簇叶片',()=>{b.b(.12,1.315,.09,.18,.075,.18,b.s.wall);b.b(.145,1.39,.115,.13,.01,.13,b.s.soil);b.b(.195,1.4,.16,.02,.2,.02,b.s.wood);for(const[x,y,z]of[[.13,1.5,.1],[.2,1.55,.12],[.12,1.58,.17],[.21,1.49,.19],[.17,1.63,.15]]){b.b(x,y,z,.07,.045,.06,b.s.leaf);b.b(x+.015,y+.04,z+.015,.04,.015,.03,b.s.leafAlt??b.s.leaf);}});
},.01);
add(109,[.82,1.04,.6],'讲台基座、退面台身与阅读台唇',(b,w,h,d)=>{b.b(0,0,0,w,.06,d,b.s.stone);b.cabinet(w-.08,h-.12,d-.08,1,2);b.b(-.025,h-.12,-.025,w+.05,.05,d+.05,b.s.wood);b.b(0,h-.07,0,w,.04,.035,b.s.metal);});
add(110,[1.8,1.2,.16],'教学屏框、下笔槽与壁挂点',(b,w,h,d)=>{b.panel(0,0,.04,w,h,.06,b.s.screen);b.b(.08,0,0,w-.16,.035,.14,b.s.metal);for(const x of[.1,w-.14])b.b(x,.3,.1,.04,.6,.04,b.s.metal);});
add(111,[.66,.72,.5],'教室单桌、笔槽、书兜和座位接近端口',(b,w,h,d)=>{b.table(w,h,d);b.b(.06,.45,.04,w-.12,.03,d-.08,b.s.wood);b.b(.02,.7,d-.1,w-.04,.02,.025,0);});
add(112,[1.6,.9,.76],'实验台、药架、防溅背板与操作面',(b,w,h,d)=>{b.table(w,h,d);b.b(.04,h,d-.055,w-.08,.22,.055,b.s.wall);for(const x of[.08,w-.12])b.b(x,h+.1,d-.25,.04,.35,.04,b.s.metal);b.b(.08,h+.42,d-.3,w-.16,.03,.26,b.s.wood);});
add(113,[.6,.44,.5],'仪器外壳、检查窗、仪表旋钮与通风格',(b,w,h,d)=>{b.cabinet(w,h,d,1,1,false,b.s.metal);b.panel(.04,.12,-.02,w-.08,h-.18,.03,b.s.screen);for(let x=.1;x<w-.06;x+=.09)b.cylinder(x,.08,-.035,.025,.03,b.s.wood,0,'z');});
add(114,[.3,.4,.3],'显微镜底座、载物台、立柱和镜筒',(b,w,h,d)=>{b.rounded(0,0,0,w,.035,d,.02,b.s.metal);b.b(.18,.03,.18,.06,.27,.06,b.s.wall);b.b(.035,.14,.035,.2,.025,.2,b.s.metal);b.beam([.2,.29,.2],[.12,.35,.13],.055,b.s.wall);b.cylinder(.12,.29,.13,.035,.11,b.s.metal);b.cylinder(.12,.24,.13,.015,.05,b.s.metal);},.01);
add(115,[.32,.24,.18],'试管架孔位、透明管壁和底座',(b,w,h,d)=>{b.b(0,0,0,w,.025,d,b.s.wood);for(const x of[.01,w-.03])b.b(x,0,.02,.02,.17,d-.04,b.s.metal);b.b(0,.14,0,w,.02,d,b.s.wood);for(const x of[.06,.16,.26]){b.cylinder(x,.025,d/2,.03,.2,b.s.glass,.018);b.cylinder(x,.21,d/2,.035,.02,b.s.wood);}},.01);
add(116,[.9,1.72,.44],'科研资料柜、上玻璃门与下抽屉',(b,w,h,d)=>{b.cabinet(w,h,d,2,4);for(const x of[.04,w/2+.01])b.panel(x,.76,-.025,w/2-.06,.9,.025,b.s.glass);for(let i=0;i<4;i++)b.panel(.045+i*w/4,.14,-.025,w/4-.04,.54,.035,b.s.wood);});
add(117,[1.4,1.05,.72],'双屏能源台、键区、底柜及侧通风',(b,w,h,d)=>{terminal(b,w,h,d);b.b(w/2-.02,h*.58,d*.5-.04,.04,h*.3,.04,b.s.metal);for(let x=.13;x<w-.1;x+=.1)b.b(x,.22,-.015,.03,.18,.025,b.s.screen);});
add(118,[.66,1.96,.72],'机架立柱、插拔设备层、风孔和脚轮',(b,w,h,d)=>{b.cabinet(w,h,d,1,9,false,b.s.metal);for(let y=.2;y<h-.1;y+=.18){b.panel(.04,y,-.02,w-.08,.14,.04,b.s.metal);for(let x=.08;x<w-.12;x+=.06)b.b(x,y+.03,-.035,.025,.06,.02,b.s.screen);b.b(w-.1,y+.03,-.04,.025,.025,.025,b.s.energy);}});
add(119,[.44,.04,.3],'浅器械盘、圆角边沿与三种器械',(b,w,h,d)=>{b.rounded(0,0,0,w,h,d,.015,b.s.metal);b.b(.02,.02,.02,w-.04,h,d-.04,0);for(let i=0;i<3;i++)b.b(.06+i*.11,.02,.06,.025,.01,.17,b.s.wall);},.01);
add(120,[1.6,.52,.08],'病床护栏上下横杆与竖向安全杆',(b,w,h,d)=>{for(const y of[0,h-.04])b.b(0,y,.02,w,.04,.04,b.s.metal);for(let x=.03;x<w;x+=.22)b.b(x,0,.02,.035,h,.04,b.s.metal);for(const x of[0,w-.08])b.b(x,-.09,0,.08,.14,d,b.s.metal);});
add(121,[.56,.36,.08],'病床控制面板、按键和输氧插口',(b,w,h,d)=>{b.panel(0,0,0,w,h,d,b.s.wall);b.panel(.035,.1,-.02,.24,.2,.02,b.s.screen);for(let y=.06;y<h-.03;y+=.09)for(const x of[.34,.44])b.cylinder(x,y,-.02,.02,.02,b.s.metal,0,'z');},.01);
add(122,[1.9,1.9,1.16],'贯通扫描环、内壁和病床滑轨',(b,w,h,d)=>{b.cylinder(w/2,h/2,.55,.92,.52,b.s.wall,.59,'z');b.cylinder(w/2,h/2,.53,.63,.02,b.s.metal,.59,'z');b.b(.42,0,.58,1.06,.28,.52,b.s.metal);b.b(.61,.55,-1.1,.68,.09,2.1,b.s.wall);b.b(.75,.1,-.85,.4,.45,.6,b.s.metal);},.04);
add(123,[1.12,1.64,.46],'多格药屉、标签凹槽及拉钮',(b,w,h,d)=>{b.cabinet(w,h,d,4,6,true);for(let c=0;c<4;c++)for(let r=0;r<6;r++)b.b(.075+c*.26,.2+r*.245,-.032,.12,.045,.02,b.s.wall);});
add(124,[.48,1.68,.48],'十字脚、杆套、四挂钩与瓶夹',(b,w,h,d)=>{b.b(0,0,d/2-.025,w,.04,.05,b.s.metal);b.b(w/2-.025,0,0,.05,.04,d,b.s.metal);b.b(w/2-.025,0,d/2-.025,.05,h-.16,.05,b.s.metal);b.b(.05,h-.16,d/2-.015,w-.1,.025,.03,b.s.metal);for(const x of[.05,w-.075])b.b(x,h-.2,d/2-.015,.025,.065,.03,b.s.metal);});
add(125,[.66,.54,1.96],'担架折脚、双纵杆、布面及端把手',(b,w,h,d)=>{for(const x of[.02,w-.05])b.b(x,h-.08,0,.03,.05,d,b.s.metal);b.rounded(.06,h-.065,.18,w-.12,.045,d-.36,.025,b.s.fabric);for(const z of[.35,d-.4]){b.beam([.08,0,z],[w-.08,h-.06,z],.035,b.s.metal);b.beam([w-.08,0,z],[.08,h-.06,z],.035,b.s.metal);}});
add(126,[1.4,.88,.48],'双侧康复扶手、支座与留空步行通道',(b,w,h,d)=>{for(const z of[0,d-.04]){b.b(0,h-.04,z,w,.04,.04,b.s.wood);for(const x of[.06,w-.1]){b.b(x,0,z,.04,h,.04,b.s.metal);b.b(x-.05,0,z-.03,.14,.04,.1,b.s.metal);}}});
add(127,[.86,.9,.55],'医用消毒台、空腔盆、踏杆与皂液器',(b,w,h,d)=>{b.table(w,.78,d);b.shifted([0,.74,0],c=>sink(c,w,.16,d));b.b(.05,.84,d-.12,.09,.16,.1,b.s.wall);b.b(.04,.96,d-.18,.11,.025,.07,b.s.metal);});
add(140,[1.5,1.76,.22],'公告屏、双立柱、脚座与信息板槽',(b,w,h,d)=>{for(const x of[.08,w-.14]){b.b(x,0,.06,.06,h,.06,b.s.metal);b.b(x-.07,0,-.08,.2,.04,.38,b.s.stone);}b.panel(0,.65,0,w,h-.65,.1,b.s.screen);b.b(.08,.68,-.025,w-.16,.035,.025,b.s.wood);});
add(141,[2.2,.76,1.08],'会议长桌、双立架、中央接线槽',(b,w,h,d)=>{b.b(0,h-.055,0,w,.055,d,b.s.wood);for(const x of[.36,w-.5]){b.b(x,.06,.16,.14,h-.1,d-.32,b.s.metal);b.b(x-.16,0,.08,.46,.06,d-.16,b.s.metal);}b.b(.3,h-.03,d/2-.04,w-.6,.03,.08,b.s.metal);});
add(142,[.74,1.12,.56],'议会讲席、麦克风杆、斜台阶与徽位',(b,w,h,d)=>{b.cabinet(w,.92,d,1,2);b.b(-.03,.94,-.02,w+.06,.05,d+.04,b.s.wood);b.panel(.2,.42,-.02,.34,.28,.03,b.s.stone);b.beam([.14,.99,.2],[.14,1.12,.07],.02,b.s.metal);});
add(143,[.56,.9,.46],'投票箱、顶槽、封签和核验面板',(b,w,h,d)=>{crate(b,w,h,d,true);b.b(0,h-.05,0,w,.05,d,b.s.wood);b.b(.1,h-.05,d/2-.015,w-.2,.05,.03,0);b.panel(.12,.42,-.03,.32,.2,.04,b.s.screen);});
add(144,[.82,1.52,.48],'账簿柜、锁板和编号插槽',(b,w,h,d)=>{b.cabinet(w,h,d,2,4,true);b.b(w/2-.025,.55,-.06,.05,.3,.025,b.s.metal);});
add(145,[.46,.2,.32],'审计取证盒、密封沿、铰链和锁扣',(b,w,h,d)=>{crate(b,w,h,d,true);b.b(.02,h-.03,.02,w-.04,.03,d-.04,b.s.wall);b.b(w/2-.035,h-.09,-.025,.07,.095,.04,b.s.metal);},.01);
add(146,[1.04,1.84,.5],'档案柜、十二抽格、标签与退脚',(b,w,h,d)=>b.cabinet(w,h,d,3,4,true,b.s.metal));
add(147,[.58,1.52,.46],'木金属立式终端、浅色检修门、散热格与实体输入板',terminal,.01);
add(148,[.4,1.84,.4],'仪仗旗底座、套筒、旗杆和旗面',(b,w,h,d)=>{b.b(0,0,0,w,.09,d,b.s.stone);b.b(w/2-.04,.09,d/2-.04,.08,.12,.08,b.s.metal);b.b(w/2-.015,.2,d/2-.015,.03,h-.2,.03,b.s.metal);b.b(w/2,1.12,d/2,.44,.64,.02,b.s.fabric);});
add(149,[1.3,1.06,.62],'办理柜台、传递凹口、证件读头',(b,w,h,d)=>{b.cabinet(w,.96,d,3,2,true);b.b(0,.96,0,w,.06,d,b.s.wood);b.b(.46,.985,.02,.34,.035,.24,b.s.metal);b.panel(.94,1.02,.22,.24,.2,.06,b.s.screen);});
add(150,[1.24,1.66,.52],'救济柜、六个开放储格与发放台',(b,w,h,d)=>{b.cabinet(w,h,d,3,3);b.b(0,.72,-.18,w,.05,d+.18,b.s.wood);});
add(151,[1.4,.78,.76],'值班桌、单侧三抽屉及记录板',(b,w,h,d)=>{b.table(w,h,d);b.cabinet(.36,h-.07,d-.1,1,3,true);b.b(.53,h,.18,.48,.025,.34,b.s.wall);});
add(152,[.9,1.82,.54],'证物柜、钢门、铰链和独立锁格',(b,w,h,d)=>{b.cabinet(w,h,d,2,4,true,b.s.metal);for(let y=.3;y<h;y+=.41)b.b(.38,y,-.06,.14,.055,.025,b.s.wood);});
add(153,[2.4,1.12,.72],'审判席连体柜、前围屏、记录台与台阶基脚',(b,w,h,d)=>{b.cabinet(w,.83,d,4,2);b.panel(0,.1,-.04,w,h-.1,.06,b.s.wood,b.s.wood);b.b(-.06,0,-.08,w+.12,.1,d+.12,b.s.stone);b.b(.04,.86,.08,w-.08,.055,d-.13,b.s.wood);});
add(154,[1.6,.84,.5],'旁听长椅、两组脚架、横向背枨',(b,w,h,d)=>{b.table(w,.44,d);for(const x of[.08,w-.14])b.b(x,.4,d-.08,.06,h-.4,.06,b.s.wood);for(const y of[.55,.7])b.b(.06,y,d-.075,w-.12,.09,.045,b.s.wood);});
add(155,[1.12,.74,.68],'记录桌、屏风、走线孔和固定脚板',(b,w,h,d)=>{b.table(w,h,d);b.panel(.06,.22,d-.065,w-.12,.38,.04,b.s.metal);for(const x of[.025,w-.13])for(const z of[.025,d-.13])b.b(x,0,z,.1,.025,.1,b.s.metal);});
add(156,[.84,1.68,2.06],'双层监所床、梯子、护栏和储物格',(b,w,h,d)=>{for(const x of[.02,w-.06])for(const z of[.02,d-.06])b.b(x,0,z,.04,h,.04,b.s.metal);for(const y of[.3,1.2]){b.b(0,y,0,w,.06,d,b.s.metal);b.rounded(.04,y+.06,.04,w-.08,.08,d-.08,.025,b.s.fabric);}for(const y of[1.38,1.58])b.b(0,y,0,w,.035,.035,b.s.metal);for(let y=.14;y<1.22;y+=.22)b.b(.08,y,d-.035,.36,.035,.035,b.s.metal);b.cabinet(.56,.25,.6,2,1,true,b.s.metal);},.04);
add(157,[.82,1.1,.54],'岗亭信息台、竖屏和通讯面板',(b,w,h,d)=>{terminal(b,w,h,d);b.b(.08,.72,.02,.14,.05,.16,b.s.wood);});
add(158,[.22,.24,.36],'摄像头筒壳、遮阳罩、镜头与万向支架',(b,w,h,d)=>{b.b(.04,0,.2,.14,.03,.12,b.s.metal);b.b(.09,.025,.23,.04,.09,.04,b.s.metal);b.rounded(.01,.1,.035,.2,.12,.3,.025,b.s.wall);b.cylinder(.11,.16,.015,.06,.04,b.s.screen,0,'z');b.b(0,.21,0,.22,.025,.36,b.s.metal);},.01);
add(159,[1.06,1.76,.5],'消防柜、破玻璃门、工具挂架和卷管',(b,w,h,d)=>{b.cabinet(w,h,d,2,2,false,b.s.metal);b.panel(.025,.16,-.02,w/2-.04,h-.2,.025,b.s.glass);b.cylinder(w*.73,.96,.1,.18,.12,b.s.wood,.1,'z');for(const x of[.1,.29]){b.b(x,.3,.17,.035,.8,.04,b.s.wood);b.b(x-.05,1.06,.16,.14,.08,.05,b.s.metal);}});
add(169,[.9,1.64,.42],'展架A型撑、内框画板与前沿托台',(b,w,h,d)=>{for(const x of[.06,w-.1]){b.b(x,0,.02,.04,h,.04,b.s.wood);b.beam([x,0,d],[x,h-.1,.04],.04,b.s.wood);}b.panel(.02,.5,0,w-.04,h-.58,.04,b.s.wall,b.s.wood);b.b(0,.48,-.06,w,.05,.14,b.s.wood);});
add(170,[.7,1.76,.6],'三腿画架、滑动夹、托台和画布',(b,w,h,d)=>{for(const x of[.06,w-.1])b.beam([x,0,0],[w/2,1.7,.2],.04,b.s.wood);b.beam([w/2,0,d],[w/2,1.5,.14],.04,b.s.wood);b.panel(.06,.64,.06,w-.12,.84,.04,b.s.fabric,b.s.wood);b.b(0,.6,-.02,w,.04,.15,b.s.wood);});
add(171,[.68,.12,.4],'书法宣纸、砚池、笔架和毛笔',(b,w,h,d)=>{b.b(0,0,0,w,.01,d,b.s.wall);b.rounded(.44,.01,.06,.2,.045,.19,.02,b.s.stone);b.b(.47,.025,.09,.14,.04,.13,0);b.b(.09,.02,.3,.28,.035,.03,b.s.wood);for(const x of[.12,.24,.34])b.b(x,.04,.16,.01,.015,.22,b.s.wood);},.01);
add(172,[1.1,1.26,.8],'印刷机空腔、送纸托盘、墨辊和操作窗',(b,w,h,d)=>{b.cabinet(w,.68,d,2,2,true,b.s.metal);for(const x of[.05,w-.12])b.b(x,.68,.14,.07,.44,.52,b.s.metal);b.cylinder(w/2,.89,.24,.14,.4,b.s.metal,0,'z');b.b(.12,.7,-.24,w-.24,.04,.42,b.s.wall);b.b(0,1.14,.06,w,.08,d-.12,b.s.metal);b.panel(w-.32,.83,0,.26,.22,.04,b.s.screen);});
add(173,[.5,.94,.3],'展品说明牌、立柱、脚座和嵌板',(b,w,h,d)=>{b.b(.08,0,0,w-.16,.03,d,b.s.metal);b.b(w/2-.025,.03,d/2-.025,.05,h-.27,.05,b.s.metal);b.panel(0,h-.28,.08,w,.28,.045,b.s.wall);});
add(174,[1.18,.12,.28],'长琴共鸣箱、七弦、琴桥和尾钮',(b,w,h,d)=>{b.rounded(0,0,0,w,h-.02,d,.04,b.s.wood);for(let z=.05;z<d-.02;z+=.025)b.b(.04,h-.01,z,w-.08,.01,.01,b.s.metal);for(const x of[.12,w-.14])b.b(x,h-.015,.03,.025,.015,d-.06,b.s.ceramic);},.01);
add(175,[.52,.72,.52],'鼓腔、双蒙皮、钉圈和支架',(b,w,h,d)=>{b.cylinder(w/2,.22,d/2,.23,.42,b.s.wood,.17);for(const y of[.22,.63])b.cylinder(w/2,y,d/2,.25,.035,b.s.fabric);b.feet(w,d,.26,b.s.wood);for(let i=0;i<12;i++){const a=i*Math.PI/6;b.b(w/2+Math.cos(a)*.23-.015,.55,d/2+Math.sin(a)*.23-.015,.03,.03,.03,b.s.metal);}});
add(176,[2,.4,1.6],'舞台桁架、拼缝面板和连接锁位',(b,w,h,d)=>{b.feet(w,d,h-.04,b.s.metal,.1);for(const y of[.06,h-.08])for(const z of[.04,d-.1])b.b(.04,y,z,w-.08,.05,.06,b.s.metal);for(let x=0;x<w;x+=.25)b.b(x,h-.04,0,.24,.04,d,b.s.wood);});
add(177,[.6,1.4,.62],'音响机架、上下喇叭锥和防撞护角',(b,w,h,d)=>{b.cabinet(w,h,d,1,2,false,b.s.metal);b.b(.025,.12,0,w-.05,h-.17,.03,b.s.screen);for(const y of[.43,1.05])b.cylinder(w/2,y,-.025,.21,.045,b.s.metal,.14,'z');b.cylinder(w/2,.43,-.04,.06,.02,b.s.metal,0,'z');});
add(178,[1.6,.98,.58],'礼仪供台、曲折裙板、端头翘角',(b,w,h,d)=>{b.table(w,h,d);for(const x of[0,w-.06])b.b(x,h-.01,0,.06,.09,d,b.s.wood);b.panel(.1,.52,-.02,w-.2,.2,.04,b.s.wood,b.s.metal);});
add(179,[.36,.42,.3],'空心香炉、三足、炉耳与独立烛灯',(b,w,h,d)=>{b.bowl(.13,.1,.14,.1,.14,b.s.metal);for(const x of[.06,.17])b.b(x,0,.11,.035,.12,.035,b.s.metal);b.b(.11,.22,.13,.01,.16,.01,b.s.wood);b.cylinder(.29,0,.18,.055,.025,b.s.metal);b.b(.265,.025,.155,.05,.31,.05,b.s.wall);b.b(.28,.335,.17,.025,.05,.025,b.s.warm);},.01);
add(180,[.9,.94,.54],'辩论讲席、开架、扶边和文件夹',(b,w,h,d)=>{b.table(w,h,d);b.b(.06,.28,.06,w-.12,.04,d-.12,b.s.wood);for(const x of[0,w-.04])b.b(x,h,0,.04,.06,d,b.s.wood);});
add(181,[.46,.04,.46],'十九路线格、围棋子与棋盒',(b,w,h,d)=>{b.b(0,0,0,w,.03,d,b.s.wood);for(let i=0;i<19;i++){const k=.025+i*(w-.05)/18;b.b(k,.03,.02,.01,.01,d-.04,b.s.metal);b.b(.02,.03,k,w-.04,.01,.01,b.s.metal);}for(const[x,z,m]of[[.15,.2,b.s.wall],[.25,.3,b.s.metal],[.3,.15,b.s.wall]])b.cylinder(x,.04,z,.016,.02,m);},.01);
add(182,[.24,.24,.24],'球形体素、经纬色带',(b,w,h,d)=>{const r=w/2;for(let y=0;y<h;y+=b.pitch){const rr=Math.sqrt(Math.max(0,r*r-((y+.5*b.pitch)-r)**2));if(rr>b.pitch/2)b.cylinder(r,y,r,rr,b.pitch,Math.abs(y-r)<.015?b.s.wall:b.s.wood);}for(const[p]of b.g.cells())if(Math.abs(p[0]*b.pitch-r)<.01)b.g.set(p,b.s.metal);},.01);
add(183,[1.6,2.2,.7],'双杠训练架、脚板、梯档与握杆',(b,w,h,d)=>{for(const x of[.04,w-.08])for(const z of[.06,d-.1]){b.b(x,0,z,.04,h,.04,b.s.metal);b.b(x-.03,0,z-.03,.1,.04,.1,b.s.stone);}for(let y=.3;y<h;y+=.24)b.b(.04,y,.06,w-.08,.04,.04,b.s.wood);b.b(.04,h-.04,d-.1,w-.08,.04,.04,b.s.wood);});
add(184,[.72,1.64,.72],'游艺机独立控台、凹屏、摇杆与双按钮',(b,w,h,d)=>{terminal(b,w,h,d);b.b(.12,h*.52,.07,.025,.085,.025,b.s.metal);b.cylinder(.13,h*.57,.08,.035,.035,b.s.wood);for(const x of[.42,.55])b.cylinder(x,h*.52,.09,.025,.02,b.s.warm);});
add(185,[.5,.84,.05],'旗幡上横杆、旗面、锯齿下摆与悬环',(b,w,h,d)=>{b.b(0,h-.04,0,w,.03,d,b.s.wood);b.b(.04,.1,.01,w-.08,h-.13,.02,b.s.fabric);for(let x=.04;x<w-.04;x+=.12)b.b(x,.04,.01,.07,.06,.02,b.s.fabric);b.b(w/2-.02,h,0,.04,.08,.03,b.s.metal);});
add(186,[.42,.7,.42],'节庆花灯八棱罩、框骨、提环与流苏',(b,w,h,d)=>{b.cylinder(w/2,.14,d/2,.2,.4,b.s.warm,.17);for(const y of[.1,.54])b.cylinder(w/2,y,d/2,.21,.045,b.s.wood);for(let i=0;i<8;i++){const a=i*Math.PI/4;b.b(w/2+Math.cos(a)*.18-.015,.13,d/2+Math.sin(a)*.18-.015,.03,.43,.03,b.s.wood);}b.b(w/2-.015,0,d/2-.015,.03,.1,.03,b.s.fabric);b.b(w/2-.045,.585,d/2-.02,.09,.105,.04,b.s.metal);b.b(w/2-.025,.61,d/2-.02,.05,.055,.04,0);});
add(187,[1.4,.86,.62],'婚礼仪台、布幔、抬边和环饰支座',(b,w,h,d)=>{b.table(w,h,d);b.b(.04,.35,-.025,w-.08,.5,.025,b.s.fabric);for(const x of[.15,w-.22])b.b(x,h,.1,.07,.08,.07,b.s.metal);});
add(188,[.48,.94,.5],'礼仪座椅、靠背框、座垫和背结',(b,w,h,d)=>{b.table(w,.46,d);for(const x of[.04,w-.08])b.b(x,.43,d-.07,.04,h-.43,.04,b.s.wood);b.panel(.07,.58,d-.07,w-.14,h-.64,.04,b.s.fabric,b.s.wood);b.rounded(.04,.46,.04,w-.08,.055,d-.1,.02,b.s.fabric);b.b(w/2-.055,.7,d-.01,.11,.045,.04,b.s.wood);});
add(189,[.78,.8,2],'葬仪台、六脚承架、棺身退层与盖沿',(b,w,h,d)=>{b.table(w,.34,d);b.b(.04,.34,.04,w-.08,.32,d-.08,b.s.wood);b.b(.02,.66,.02,w-.04,.06,d-.04,b.s.metal);b.b(.08,.72,.08,w-.16,.08,d-.16,b.s.wood);for(const z of[.4,d-.5])for(const x of[0,w-.02])b.b(x,.49,z,.03,.04,.16,b.s.metal);});
add(190,[.22,.42,.12],'牌位台座、阶层冠及内凹铭牌',(b,w,h,d)=>{b.b(0,0,0,w,.04,d,b.s.wood);b.panel(.025,.04,.03,w-.05,h-.09,.05,b.s.wood,b.s.metal);b.b(.06,h-.05,.03,w-.12,.05,.05,b.s.wood);},.01);
add(191,[.62,.28,.42],'庆典摆盘、分层糕体、蜡烛与杯碟',(b,w,h,d)=>{b.b(0,0,0,w,.025,d,b.s.wood);b.cylinder(.23,.025,.21,.16,.08,b.s.wall);b.cylinder(.23,.105,.21,.125,.07,b.s.ceramic);b.cylinder(.23,.175,.21,.09,.06,b.s.wall);for(const x of[.19,.26])b.b(x,.235,.2,.015,.045,.015,b.s.warm);b.bowl(.5,.025,.16,.065,.09,b.s.wall);},.01);
add(192,[.66,.26,.4],'茶室茶盘、储茶罐、三杯与竹夹',(b,w,h,d)=>{b.b(0,0,0,w,.04,d,b.s.wood);for(const x of[.11,.25,.39])b.bowl(x,.04,.12,.055,.07,b.s.wall);b.cylinder(.53,.04,.27,.08,.19,b.s.ceramic);b.cylinder(.53,.23,.27,.085,.025,b.s.wood);for(const z of[.27,.3])b.b(.06,.04,z,.32,.015,.015,b.s.wood);},.01);
add(193,[1.36,1.04,.6],'旅游接待台、折页格与登记端口',(b,w,h,d)=>{b.cabinet(w,h-.08,d,3,2);b.b(0,h-.08,0,w,.055,d,b.s.wood);for(let i=0;i<3;i++){b.b(.1+i*.18,h-.025,.25,.14,.18,.06,b.s.wood);b.b(.115+i*.18,h-.01,.22,.11,.12,.025,b.s.wall);}});
add(194,[.72,.28,.58],'宠物寝窝、可进入前口和软垫',(b,w,h,d)=>{b.rounded(0,0,0,w,h,d,.08,b.s.fabric);b.rounded(.06,.07,.06,w-.12,h,d-.12,.045,0);b.b(.18,.1,0,w-.36,.18,.08,0);b.rounded(.08,.04,.08,w-.16,.05,d-.16,.025,b.s.wall);});
add(195,[.42,.11,.2],'双食水盆、中空腔和防滑座',(b,w,h,d)=>{b.rounded(0,0,0,w,.025,d,.02,b.s.wood);for(const x of[.105,.315])b.bowl(x,.025,d/2,.085,.085,b.s.ceramic);},.01);
add(196,[.46,1.14,.28],'扫把束、长杆、簸箕口和提柄',(b,w,h,d)=>{b.b(.08,.16,.08,.025,h-.16,.025,b.s.wood);for(let x=0;x<.21;x+=.025)b.b(x,0,.05,.015,.21,.08,b.s.fabric);b.b(.24,0,0,.22,.025,.28,b.s.metal);for(const x of[.24,.44])b.b(x,0,0,.02,.09,.28,b.s.metal);b.b(.24,0,.25,.22,.13,.025,b.s.metal);b.b(.34,.1,.25,.02,.5,.025,b.s.wood);},.01);
add(197,[1.4,1.44,.6],'可折X脚晾架、挂杆、端帽',(b,w,h,d)=>{for(const x of[.04,w-.08]){b.beam([x,0,0],[x,h,d],.04,b.s.metal);b.beam([x,0,d],[x,h,0],.04,b.s.metal);}for(const z of[0,d])b.b(0,h-.02,z-.02,w,.04,.04,b.s.wood);});
add(198,[.64,.86,.64],'洗衣机外壳、贯通门圈、滚筒口和控制面',(b,w,h,d)=>{b.cabinet(w,h,d,1,1,false,b.s.wall);b.b(0,.12,0,w,.58,.05,b.s.wall);b.cylinder(w/2,.4,-.02,.22,.1,0,0,'z');b.cylinder(w/2,.4,-.04,.235,.045,b.s.metal,.19,'z');b.cylinder(w/2,.4,.025,.18,.01,b.s.glass,0,'z');b.panel(.03,.73,-.02,w-.06,.1,.04,b.s.wall);b.cylinder(.49,.78,-.035,.035,.025,b.s.metal,0,'z');});
add(199,[1.1,1.68,.48],'理发台、双侧抽柜、梳妆镜和工具槽',(b,w,h,d)=>{b.table(w,.8,d);b.cabinet(.3,.76,d,1,3,true);b.panel(.28,.84,d-.08,w-.34,.8,.05,b.s.glass,b.s.wood);b.b(.78,.8,.08,.22,.06,.16,b.s.wood);for(const x of[.81,.88,.95])b.b(x,.86,.13,.02,.1,.02,b.s.metal);});
add(200,[.36,.3,.3],'礼盒、独立盖沿、交叉缎带与结',(b,w,h,d)=>{b.b(0,0,0,w,h-.04,d,b.s.fabric);b.b(-.015,h-.07,-.015,w+.03,.04,d+.03,b.s.wood);b.b(w/2-.02,0,-.01,.04,h,d+.02,b.s.wall);b.b(-.01,0,d/2-.02,w+.02,h,.04,b.s.wall);b.b(w/2-.065,h-.015,d/2-.035,.13,.035,.07,b.s.wood);},.01);
add(227,[1.4,.8,.6],'长槽真实口壁、扩口槽沿、土层与壁边安装背板',(b,w,h,d)=>{b.b(.1,0,.1,w-.2,h-.2,d-.2,b.s.stone);b.b(0,h-.2,0,w,.2,d,b.s.wall);b.b(.15,.12,.15,w-.3,h,d-.3,0);b.b(.15,.12,.15,w-.3,.38,d-.3,b.s.soil);for(const x of[.12,w-.2])b.b(x,.2,d-.14,.08,.4,.06,b.s.metal);});

Object.assign(lifeRecipes,atlasLifeRecipes);

export function makeFlowerAsset(style:Record<string,number>):Asset{
 for(const role of['plantStem','leaf','flowerWhite','flowerAmber'])if(!Number.isInteger(style[role])||style[role]<1)throw new Error('配方缺少材质角色 '+role+'；禁止按颜色借用');
 const b=new Shapes(.02,style);b.part('曲茎、叶柄和薄叶',()=>{b.beam([.15,0,.15],[.17,.42,.14],.02,style.plantStem);for(let k=0;k<4;k++){const sign=k%2?1:-1,y=.08+k*.07;b.beam([.16,y,.15],[.16+sign*.1,y+.07,.17],.02,style.leaf);b.rounded(.16+sign*.09-.05,y+.04,.12,.1,.025,.09,.01,style.leaf);}});
 b.part('花托与五瓣花',()=>{b.b(.14,.41,.11,.07,.025,.07,style.plantStem);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;b.rounded(.17+Math.cos(a)*.035-.025,.44,.14+Math.sin(a)*.035-.025,.05,.025,.05,.01,style.flowerWhite);}b.b(.15,.46,.12,.04,.02,.04,style.flowerAmber);});
 return b.finish('support-flower','辅助母版 · 长槽茎花',{kind:'support-master',usedBy:['LIFE-228'],species:'unspecified stylised flowering herb',materialAssignmentReview:{revision:1,note:'草本茎、植物叶、植物白花瓣和橙色花心；不使用灯芯作为花瓣。'},geometryStage:'candidate',gameIntegration:false,animation:false});
}

export function makeLifeAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Record<string,number>={}):Asset {
 if(!/^LIFE-\d{3}$/.test(catalogId))throw new Error('无效生活资产 ID');
 const recipe=lifeRecipes[Number(catalogId.slice(5))];if(!recipe)throw new Error('此清单条目还没有静态几何配方');
 if(Object.keys(params).some(k=>k!=='width'))throw new Error('当前批次只对床、沙发、茶几、办公桌开放宽度重建');
 if(params.width!==undefined&&![1,2,3,4,10,11,14,15,16].includes(Number(catalogId.slice(5))))throw new Error('此配方暂未验证可变尺寸；仍可编辑原生格子');
 const dims=recipe.size.map((n,i)=>params[['width','height','depth'][i]]??n) as V3;
 for(let i=0;i<3;i++)if(!Number.isFinite(dims[i])||dims[i]<recipe.size[i]*.75||dims[i]>recipe.size[i]*1.5)throw new Error('尺寸只允许配方默认值的 0.75–1.5 倍；细节重新体素化');
 // Sparse authored frames may contain a large empty bounding box. Keep a
 // bounded scan estimate; Grid independently caps actual occupancy at 1M and
 // every primitive still obeys eachCell's 2M candidate-cell limit.
 const boxBudget=atlasLifeRecipes[Number(catalogId.slice(5))]?8_000_000:2_000_000;
 if(dims.reduce((n,v)=>n*Math.ceil(v/recipe.pitch),1)>boxBudget)throw new Error('配方包围盒超过体素预算');
 // Missing roles must fail visibly. UI/MCP add independent material entries
 // in the same transaction; geometry code never substitutes a similar colour.
 const semanticStyle=new Proxy(style,{get(target,role){if(typeof role==='symbol')return Reflect.get(target,role);const id=target[role];if(!Number.isInteger(id)||id<1||id>65535)throw new Error('配方缺少材质角色 '+role+'；先建立独立材质，禁止按近似颜色回退');return id;}});
 const b=new Shapes(recipe.pitch,semanticStyle);b.part(recipe.features,()=>recipe.draw(b,...dims));
 const a=b.finish(id,name,{kind:'catalog-recipe',catalogId,recipeRevision:2,styleReference:productionReference,geometryReference:[1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,21,22,108,147].includes(Number(catalogId.slice(5)))?productionReference:undefined,styleRevision:productionStyleRevision,dimensionsM:dims,parameters:params,features:recipe.features,geometryStage:'candidate',gameIntegration:false,animation:false,units:'metres',front:'-Z'});
 if(a.source!.geometryReference===undefined)delete a.source!.geometryReference;
 return atlasLifeRecipes[Number(catalogId.slice(5))]?finishAtlasMetadata(a,atlasLifeRecipes[Number(catalogId.slice(5))],style):a;
}
