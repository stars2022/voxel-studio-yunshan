import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';
function sideFrame(b:Shapes,x:number){for(const y of[0,1.08])b.b(x,y,0,.2,.12,2,b.s.aircraftSkin);for(const z of[0,1.88])b.b(x,0,z,.2,1.2,.12,b.s.metal);b.b(x+.06,.12,.12,.08,.96,1.76,b.s.vehicleSeal);b.b(x+.06,.16,.16,.08,.88,1.68,0);b.b(x+.08,.16,.16,.04,.88,1.68,b.s.glass);for(const z of[.04,1.92])b.b(x,.04,z,.2,.04,.04,b.s.bronze);}
function wing(b:Shapes,w:number,d:number){
 b.part('离散渐薄的封闭涂装蒙皮与真实内部空腔',()=>{for(let i=0;i<Math.round(w/.02);i++){const x=i*.02,t=Math.abs((x+.01)-w/2)/(w/2),lead=Math.round(d*.25*t/.02)*.02,back=Math.round(d*.21*t/.02)*.02,h=t>.7?.08:t>.3?.12:.2,depth=d-lead-back;b.b(x,0,lead,.02,h,depth,b.s.aircraftSkin);if(h>.08)b.b(x,.02,lead+.04,.02,h-.04,depth-.08,0);}});
 b.part('连续金属主梁与内部肋',()=>{b.b(0,.02,d*.5-.04,w,.04,.08,b.s.metal);for(let i=1;i<Math.round(w/.4);i++){const x=i*.4,t=Math.abs(x-w/2)/(w/2),lead=Math.round(d*.25*t/.02)*.02,back=Math.round(d*.21*t/.02)*.02,h=t>.7?.08:t>.3?.12:.2;b.b(x,0,lead,.02,h,d-lead-back,b.s.metal);}});
 b.part('根部实心安装鞍与铜锁',()=>{b.b(w/2-.2,0,d/2-.16,.4,.2,.32,b.s.metal);for(const x of[w/2-.16,w/2+.12])b.b(x,.18,d/2-.12,.04,.02,.24,b.s.bronze);});
 b.part('翼尖独立光学面与端部亮钢',()=>{for(const x of[0,w-.04]){b.b(x,.02,d/2-.12,.04,.04,.24,b.s.metalBright);b.b(x,.04,d/2-.08,.04,.02,.16,b.s.energy);}});
}
export const aerialRecipes:Record<string,AtlasRecipe>={
 'BUILT-186':{size:[1.8,.2,.2],pitch:.02,features:'1.8m单根四旋翼支臂：连续箱形梁、开放线槽、根部夹座和独立电机安装环',limits:'四侧复用同一母版；不含机身或旋翼。电机孔为安装凹口，叶片未提供动态旋转、扫掠与飞行功能。',draw:b=>{
  b.part('完整根座与薄壁箱梁',()=>{b.b(0,0,0,.2,.2,.2,b.s.metal);b.b(.2,.04,.02,1.4,.12,.16,b.s.metal);b.b(.2,.1,.08,1.4,.06,.04,0);});
  b.part('亮钢边与电机安装盘',()=>{for(const z of[.02,.16])b.b(.2,.14,z,1.4,.04,.02,b.s.metalBright);b.cylinder(1.7,0,.1,.1,.2,b.s.metal);b.cylinder(1.7,.16,.1,.08,.04,b.s.metalBright);b.cylinder(1.7,.18,.1,.02,.02,0);});
  b.part('三个铜套夹与根座销',()=>{for(const x of[.02,.78,1.42]){b.b(x,.02,.02,.04,.16,.16,b.s.bronze);b.b(x,.1,.08,.04,.1,.04,0);}});
  b.part('独立状态灯与保留线槽',()=>{b.b(.04,.06,0,.08,.04,.02,b.s.energy);b.b(.3,.14,.08,.4,.04,.04,0);});
 }},
 'BUILT-187':{size:[2,.08,.2],pitch:.02,features:'2m单枚金色旋翼叶：钢制根夹、涂层叶身、离散减薄及真实叶尖收窄',limits:'叶片金色为金属涂层，不归黄铜。单叶母版复用四次，静态安装不代表四旋翼动力、转向或扫掠安全已验收。',draw:b=>{
  b.part('八厘米厚根夹及亮钢承轴',()=>{b.b(0,0,0,.2,.08,.2,b.s.metal);b.cylinder(.1,0,.1,.06,.08,b.s.metalBright);});
  b.part('渐薄收尖金色涂装金属叶身',()=>{for(let i=10;i<100;i++){const x=i*.02,h=x<.7?.08:x<1.4?.06:.04,t=x<1.2?.2:x<1.7?.16:.08;b.b(x,0,(.2-t)/2,.02,h,t,b.s.rotorBlade);}});
  b.part('连续根部加强脊',()=>b.b(.2,0,.08,.6,.04,.04,b.s.metal));
  b.part('四颗独立黄铜紧固销',()=>{for(const x of[.02,.16])for(const z of[.02,.16])b.b(x,.06,z,.02,.02,.02,b.s.bronze);});
 }},
 'BUILT-188':{size:[.2,.8,.2],pitch:.02,features:'0.8m单脚：独立橡胶落地垫、金属减震筒、活塞杆与上部安装夹',limits:'四个实例共用一个母版；橡胶为独立落地脚角色，没有接触形变、伸缩或飞行动画。',draw:b=>{
  b.part('真实橡胶落地垫与金属足托',()=>{b.b(0,0,0,.2,.08,.2,b.s.landingPadRubber);b.b(.02,.08,.02,.16,.04,.16,b.s.metal);});
  b.part('筒身、独立亮钢活塞与上夹',()=>{b.b(.04,.12,.04,.12,.34,.12,b.s.metal);b.b(.06,.46,.06,.08,.22,.08,b.s.metalBright);b.b(0,.68,0,.2,.12,.2,b.s.metal);});
  b.part('铜环与横轴端帽',()=>{for(const y of[.16,.36])b.b(.02,y,.02,.16,.04,.16,b.s.bronze);for(const x of[0,.18])b.b(x,.72,.06,.02,.04,.08,b.s.bronze);});
  b.part('足垫两侧防滑真槽',()=>{for(const z of[.04,.12])for(const x of[0,.18])b.b(x,0,z,.02,.02,.04,0);});
 }},
 'BUILT-189':{size:[1.8,1.2,2],pitch:.02,expectedComponents:2,features:'左右两片0.2×1.2×2m舱窗：涂装上下框、金属竖框、橡胶密封和独立薄玻璃',limits:'两片有意分离；作者左右外侧间距1.8m，保留中央驾驶空间。未给原机身眼位，当前仅验证作者眼位与直视通道。',draw:b=>{b.part('左侧框、玻璃与密封',()=>sideFrame(b,0));b.part('右侧框、玻璃与密封',()=>sideFrame(b,1.6));b.part('左窗蚀刻定位线',()=>b.b(.08,.18,.18,.04,.02,.2,b.s.glassEtch));b.part('右窗蚀刻定位线',()=>b.b(1.68,.18,.18,.04,.02,.2,b.s.glassEtch));}},
 'BUILT-190':{size:[1.8,.2,2.4],pitch:.02,features:'1.8×2.4m独立顶盖：涂装蒙皮、金属边梁、密封天窗与贯通散热缝',limits:'厚0.2m的顶盖不是完整飞机；舱窗、驾驶台另装，通风孔是真几何。未实现风场、门铰链与驾驶模式。',draw:b=>{
  b.part('金属边梁与涂装上盖',()=>{b.b(0,.08,0,1.8,.12,2.4,b.s.aircraftSkin);for(const x of[0,1.6])b.b(x,0,0,.2,.08,2.4,b.s.metal);for(const z of[0,2.2])b.b(.2,0,z,1.4,.08,.2,b.s.metal);});
  b.part('独立密封天窗与薄玻璃',()=>{b.b(.4,.08,.5,1,.12,1.2,b.s.vehicleSeal);b.b(.46,.08,.56,.88,.12,1.08,0);b.b(.46,.14,.56,.88,.04,1.08,b.s.glass);});
  b.part('后部贯通通风槽与铜固定片',()=>{for(let i=0;i<5;i++)b.b(.42+i*.2,.08,1.94,.08,.12,.24,0);for(const x of[.06,1.66])for(const z of[.06,2.26])b.b(x,.18,z,.08,.02,.08,b.s.bronze);});
  b.part('前缘暖灯与独立保护玻璃',()=>{b.b(.4,.08,0,1,.04,.04,b.s.warm);b.b(.4,.08,0,1,.04,.02,b.s.glass);});
 }},
 'BUILT-191':{size:[8.4,.2,2.4],pitch:.02,features:'8.4m完整主翼：离散后掠与渐薄蒙皮、封闭翼腔、主梁肋板、根鞍及翼尖灯',limits:'8.4×0.2×2.4m外包络；作者构型，不代表原机身全装尺寸。薄壁翼腔保留真实体素；未作气动、受力或飞行认证。',draw:b=>wing(b,8.4,2.4)},
 'BUILT-192':{size:[.4,1.8,2],pitch:.02,features:'0.4×1.8×2m垂尾：完整安装脚、后掠立面、独立承力脊与顶端光学面',limits:'单个垂尾母版；方向舵为静态面，无舵角、骨骼或驾驶联动。',draw:b=>{
  b.part('完整金属安装脚与铜锁',()=>{b.b(0,0,0,.4,.12,2,b.s.metal);for(const x of[.04,.32])for(const z of[.08,1.84])b.b(x,.1,z,.04,.02,.08,b.s.bronze);});
  b.part('真实后掠涂装尾翼面',()=>{for(let i=6;i<90;i++){const f=i/90,z=Math.round(1.1*f/.02)*.02,back=Math.round(.2*f/.02)*.02;b.b(.14,i*.02,z,.12,.02,2-z-back,b.s.aircraftSkin);}});
  b.part('阶梯式承力脊与尾缘亮钢',()=>{for(let i=6;i<90;i++){const f=i/90,z=Math.round(1.1*f/.02)*.02,back=Math.round(.2*f/.02)*.02;b.b(.14,i*.02,z,.12,.02,.04,b.s.metal);b.b(.14,i*.02,1.96-back,.12,.02,.04,b.s.metalBright);}});
  b.part('顶部内嵌暖灯与铜接点',()=>{b.b(.14,1.74,1.3,.12,.04,.2,b.s.warm);b.b(.14,1.7,1.3,.12,.04,.04,b.s.bronze);});
 }},
 'BUILT-193':{size:[4,.2,1],pitch:.02,features:'4×0.2×1m水平尾翼：渐薄涂装蒙皮、金属主梁、真实翼腔、中央安装鞍与端灯',limits:'一个完整平尾，左右不得再分别计两件；当前静态组件无俯仰舵、升力或配重功能。',draw:b=>wing(b,4,1)},
 'BUILT-194':{size:[2.4,1,1.6],pitch:.02,features:'尾前动力盒组件：中置空腔机匣、两侧1.6m长通风盒、钢横接梁与后格栅',limits:'清单仅明确两侧盒长1.6m；本件总2.4×1×1.6m为作者接口样件。进气道是真孔，灯芯仅状态示意；无推力、燃烧或排气仿真。',draw:b=>{
  b.part('中央薄壁涂装机匣与进气空腔',()=>{b.b(.6,0,0,1.2,1,1.6,b.s.aircraftSkin);b.b(.68,.08,0,1.04,.84,1.6,0);for(const z of[.04,1.5])b.b(.6,.08,z,1.2,.06,.06,b.s.metal);});
  b.part('左右独立盒体与贯通风道',()=>{for(const x of[0,2]){b.b(x,.2,0,.4,.6,1.6,b.s.metal);b.b(x+.06,.26,0,.28,.48,1.6,0);b.b(x,.78,0,.4,.02,1.6,b.s.aircraftSkin);}});
  b.part('连续上下横接梁与后部真实格栅',()=>{for(const y of[.2,.72])b.b(0,y,.7,2.4,.06,.2,b.s.metalBright);for(let i=0;i<6;i++)b.b(.68,.12+i*.12,1.52,1.04,.04,.04,b.s.metal);for(const x of[.06,2.06])for(let i=0;i<4;i++)b.b(x,.28+i*.12,1.52,.28,.04,.04,b.s.metal);});
  b.part('四角铜锁与左右独立状态芯',()=>{for(const x of[.62,1.72])for(const z of[.06,1.46])b.b(x,.96,z,.06,.04,.06,b.s.bronze);b.b(0,.4,.04,.02,.16,.3,b.s.energy);b.b(2.38,.4,.04,.02,.16,.3,b.s.warm);});
 }},
 'BUILT-195':{size:[1.2,.2,1.4],pitch:.01,features:'低于眼位的1.2×0.2×1.4m操纵台：阶梯斜板、真实底部空间、独立屏底与像素、塑料旋钮',limits:'固定静态低台，不含座椅或整舱；作者眼位Y1.1m，装配后台顶Y0.4m。像素非业务数据，按钮未接驾驶控制。',draw:b=>{
  b.part('两侧金属脚轨与后部连接梁',()=>{for(const x of[0,1.1])b.b(x,0,0,.1,.16,1.4,b.s.metal);b.b(0,0,1.3,1.2,.16,.1,b.s.metal);});
  b.part('由低到高的薄涂装斜面',()=>{for(let i=0;i<14;i++)b.b(0,.04+i*.01,i*.1,1.2,.03,.1,b.s.aircraftSkin);});
  b.part('独立深屏底与显示像素',()=>{b.b(.2,.15,1.1,.8,.02,.2,b.s.screen);for(let i=0;i<5;i++)b.b(.25+i*.12,.17,1.16,.06,.01,.08,b.s.displayGlyph);});
  b.part('塑料旋钮、铜安装销和真实脚下空间',()=>{for(const x of[.15,.45,.75,.95])b.b(x,.11,.52,.06,.04,.06,b.s.polymerDark);for(const x of[.03,1.13])b.b(x,.18,1.32,.04,.02,.04,b.s.bronze);});
 }},
 'BUILT-205':{size:[9,.6,8],pitch:.1,features:'隔离高桥共享板/缝：9m宽承板、混凝土铺面、钢边锚点与独立伸缩密封',limits:'默认8m板段，另验0.2m缝段；6板5缝为复用实例。世界底254、顶254.6m。保留原游戏巨块/ray负例及新增低pier冲突；本孤立候选不等于原游戏最终PASS或合入。',draw:(b,w,h,d)=>{
  b.part('结构混凝土层与钢边',()=>{b.b(0,0,0,w,.4,d,b.s.structuralConcrete);for(const x of[0,w-.2])b.b(x,0,0,.2,.6,d,b.s.metal);});
  b.part('独立磨耗铺面与缝段密封层',()=>{b.b(.2,.4,0,w-.4,.2,d,d===.2?b.s.jointSeal:b.s.pavementConcrete);if(d===.2)for(const x of[.2,w-.5])b.b(x,.5,0,.3,.1,d,b.s.pavementConcrete);else for(const z of[0,d-.1])b.b(.2,.5,z,w-.4,.1,.1,b.s.jointSeal);});
  b.part('真实端部钢锚或交替伸缩齿',()=>{if(d===.2){for(let i=1;i<42;i++)b.b(.2+i*.2,.5,i%2?.1:0,.1,.1,.1,b.s.metal);}else for(const x of[.3,8.3])for(const z of[.2,7.4])b.b(x,.5,z,.4,.1,.4,b.s.metal);});
  b.part('独立黄铜锚钉',()=>{for(const x of[.6,8.2])for(const z of(d===.2?[0]:[.3,7.5]))b.b(x,.5,z,.1,.1,.1,b.s.bronze);});
 }},
 'BUILT-206':{size:[9,1.2,8],pitch:.1,features:'隔离高桥箱梁：9m宽、1.2m高、8m节段、真实检查腔及两端0.1m承缝顶托',limits:'6梁复用；梁底252.8m、顶254m，禁止误写252.6。端托使实体进深8.2m（局部Z−0.1至8.1）；原游戏pier冲突与巨块/ray负例未在此解决。',draw:b=>{
  b.part('连续混凝土上下翼板与三道腹板',()=>{for(const y of[0,1])b.b(0,y,0,9,.2,8,b.s.structuralConcrete);for(const x of[0,4.4,8.8])b.b(x,.2,0,.2,.8,8,b.s.structuralConcrete);});
  b.part('中部横隔板与实际贯通检查口',()=>{b.b(.2,.2,3.8,8.6,.8,.4,b.s.structuralConcrete);for(const x of[.8,5.2])b.b(x,.3,3.8,2.8,.6,.4,0);});
  b.part('端部承缝钢托与侧面钢加强带',()=>{for(const z of[-.1,8])b.b(0,1,z,9,.2,.1,b.s.metal);for(const x of[0,8.9])for(const z of[.2,3.8,7.6])b.b(x,.2,z,.1,.8,.2,b.s.metal);});
  b.part('真实端托铜锁与独立浅石侧压块',()=>{for(const x of[.3,8.4])for(const z of[-.1,8])b.b(x,1.1,z,.2,.1,.1,b.s.bronze);for(const x of[0,8.9])b.b(x,.8,.6,.1,.2,6.8,b.s.wall);});
 }},
};
const roles:Record<string,string[]>={
 '186':['metal','metalBright','bronze','energy'],'187':['metal','metalBright','rotorBlade','bronze'],'188':['landingPadRubber','metal','metalBright','bronze'],
 '189':['aircraftSkin','metal','vehicleSeal','glass','glassEtch','bronze'],'190':['aircraftSkin','metal','vehicleSeal','glass','bronze','warm'],
 '191':['aircraftSkin','metal','metalBright','bronze','energy'],'192':['aircraftSkin','metal','metalBright','bronze','warm'],'193':['aircraftSkin','metal','metalBright','bronze','energy'],
 '194':['aircraftSkin','metal','metalBright','bronze','energy','warm'],'195':['metal','aircraftSkin','screen','displayGlyph','polymerDark','bronze'],
 '205':['structuralConcrete','pavementConcrete','metal','jointSeal','bronze'],'206':['structuralConcrete','metal','wall','bronze'],
};
export const aerialMaterialRules=Object.fromEntries(Object.keys(aerialRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:'航空蒙皮与金色叶片按涂装金属归类；落地脚胶、窗密封与玻璃独立；高桥结构混凝土、磨耗面、密封及钢锚分别保留。'}]));
export function configureAerialAsset(a:Asset,id:string){
 if(!aerialRecipes[id])return;const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 a.source!.originalVehicleStateAvailable=false;
 if(id==='BUILT-186'){empty([.3,.14,.08],[.7,.18,.12]);port('root','quad-arm',[0,.1,.1],[-1,0,0],[0,.2,.2]);port('rotor','rotor-root',[1.7,.2,.1],[0,1,0],[.2,0,.2]);}
 if(id==='BUILT-187')port('root','rotor-root',[.1,0,.1],[0,-1,0],[.2,0,.2]);
 if(id==='BUILT-188')port('top','quad-leg',[.1,.8,.1],[0,1,0],[.2,0,.2]);
 if(id==='BUILT-189'){empty([.2,.4,.16],[1.6,1.2,1.84]);port('roof','aerial-roof',[.9,1.2,1],[0,1,0],[1.8,0,2]);a.source!.sidePanelM=[.2,1.2,2];}
 if(id==='BUILT-190'){for(let i=0;i<5;i++)empty([.42+i*.2,.08,1.94],[.5+i*.2,.2,2.18]);port('bottom','aerial-roof',[.9,0,1.2],[0,-1,0],[1.8,0,2]);}
 if(id==='BUILT-191'||id==='BUILT-193'){const w=id==='BUILT-191'?8.4:4,d=id==='BUILT-191'?2.4:1;port('root','wing-mount',[w/2,0,d/2],[0,-1,0],[.4,0,.32]);empty([w/2+.24,.04,d/2+.2],[w/2+.36,.16,d/2+.3]);}
 if(id==='BUILT-192')port('root','fin-mount',[.2,0,1],[0,-1,0],[.4,0,2]);
 if(id==='BUILT-194'){empty([.7,.3,0],[1.7,.7,.7]);empty([.06,.28,0],[.34,.7,.7]);a.source!.powerBox={authoredOverallM:[2.4,1,1.6],catalogueSideLengthM:1.6};}
 if(id==='BUILT-195'){empty([.1,0,.1],[1.1,.04,1.2]);a.source!.cockpit={authoredEyeYM:1.1,installedTopYM:.4,controlsBound:false};}
 if(id==='BUILT-205'){const d=(a.source!.dimensionsM as V3)[2];a.source!.bridge={variant:d===.2?'joint':'deck',worldBottomYM:254,worldTopYM:254.6,repeatDecks:6,repeatJoints:5,originalGameFinalPass:false,historicalFailures:['giant block / ray mismatch','new lower pier conflict']};port('beam','high-deck',[4.5,0,d/2],[0,-1,0],[9,0,d]);}
 if(id==='BUILT-206'){empty([.2,.2,0],[4.4,1,3.8]);empty([4.6,.2,4.2],[8.8,1,8]);a.source!.bridge={worldBottomYM:252.8,worldTopYM:254,spanM:8,endCapExtensionM:.1,actualDepthM:8.2,repeatBeams:6,originalGameFinalPass:false,historicalFailures:['giant block / ray mismatch','new lower pier conflict']};port('deck','high-deck',[4.5,1.2,4],[0,1,0],[9,0,8]);}
}
