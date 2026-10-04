import type {Asset,Port,V3} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';
import {Grid} from '../core/grid';
import {Shapes} from './shapes';
import {loft,roundLoft,roundBand,band,hollowLoft,rigidMesh,type Ring} from './mesh-shapes';
import {assetBoundsM} from '../core/sky';
import {atlasSource,type AtlasRecipe} from './atlas-life';
import {productionReference,productionStyleRevision} from './style';
type Params=Record<string,number|string>;
export type FigureProportion={heightM:number;headM:number;hipYM:number;kneeYM:number;shoulderYM:number;shoulderHalfWidthM:number;hipHalfWidthM:number;waistHalfWidthM:number;hipRadiusM:number;section:'rounded'|'bevelled'};
export const figureProportions:Record<string,FigureProportion>={
 'CHAR-059':{heightM:1.7,headM:.24,hipYM:.86,kneeYM:.46,shoulderYM:1.37,shoulderHalfWidthM:.205,hipHalfWidthM:.10,waistHalfWidthM:.14,hipRadiusM:.164,section:'bevelled'},
 'CHAR-060':{heightM:1.7,headM:.24,hipYM:.85,kneeYM:.45,shoulderYM:1.365,shoulderHalfWidthM:.188,hipHalfWidthM:.111,waistHalfWidthM:.127,hipRadiusM:.183,section:'rounded'},
 'CHAR-061':{heightM:.60,headM:.19,hipYM:.22,kneeYM:.125,shoulderYM:.36,shoulderHalfWidthM:.096,hipHalfWidthM:.055,waistHalfWidthM:.086,hipRadiusM:.09,section:'rounded'},
 'CHAR-062':{heightM:.90,headM:.205,hipYM:.39,kneeYM:.205,shoulderYM:.63,shoulderHalfWidthM:.116,hipHalfWidthM:.060,waistHalfWidthM:.091,hipRadiusM:.105,section:'rounded'},
 'CHAR-063':{heightM:1.20,headM:.215,hipYM:.57,kneeYM:.30,shoulderYM:.91,shoulderHalfWidthM:.138,hipHalfWidthM:.071,waistHalfWidthM:.102,hipRadiusM:.123,section:'rounded'},
 'CHAR-064':{heightM:1.50,headM:.23,hipYM:.755,kneeYM:.405,shoulderYM:1.19,shoulderHalfWidthM:.166,hipHalfWidthM:.088,waistHalfWidthM:.118,hipRadiusM:.142,section:'rounded'},
 'CHAR-065':{heightM:1.64,headM:.24,hipYM:.825,kneeYM:.445,shoulderYM:1.31,shoulderHalfWidthM:.184,hipHalfWidthM:.098,waistHalfWidthM:.149,hipRadiusM:.157,section:'rounded'},
};
const limits='作者混合几何候选：5mm基础细块、连续斜面与曲面。全部为非碰撞外观，不写Citizen/模拟或改变原0.2m玩法网格。原源码、尺寸矩阵、骨骼、年龄/种子条件与面部图集未收件，尺寸比例为作者研究；静态装配不是绑定、蒙皮或动画。身体不含头发和精细头部；人工美术验收待定。历史5cm细格说明不覆盖用户允许连续曲面的最新修正。';
const param=(values:string[],description:string)=>({type:'string',enum:values,default:values[0],description});
export function figureParameters(id:string):Record<string,any>{if(figureProportions[id])return{extremities:param(['covered','sockets'],'全覆衣中性手套/脚套，或移除端部以接后续精细手足')};if(id==='CHAR-013')return{capFit:param(['adult','teen'],'独立成人/青少年作者帽腔尺寸；非年龄控制器')};if(id==='CHAR-014')return{carry:param(['hand','shoulder'],'短提把/长肩带真实几何'),lid:param(['closed','open'],'绕后铰轴真实刚体开盖')};if(id==='CHAR-067')return{headStage:param(['infant','toddler'],'独立婴儿/幼儿颅面比例')};return{};}
export function figureVariants(id:string):Params[]{return Object.entries(figureParameters(id)).reduce<Params[]>((rows,[key,p])=>rows.flatMap(r=>p.enum.map((v:string)=>({...r,[key]:v}))),[{}]);}
const socket=(id:string,position:V3,normal:V3=[0,1,0],size:V3=[.1,.01,.1]):Port=>({id,kind:'character-socket',position:position.map(v=>Math.round(v*1e9)/1e9||0) as V3,normal,size,pitch:.005});
class Figure{
 b:Shapes;meshes:AuthoredMesh[]=[];ports:Port[]=[];detail:Record<string,unknown>={};
 constructor(public s:Record<string,number>){this.b=new Shapes(.005,s);}
 add(name:string,role:string,rings:Ring[],round=true){this.meshes.push(round?roundLoft(name,this.s[role],rings):loft(name,this.s[role],rings));}
 box(name:string,role:string,x:number,y:number,z:number,w:number,h:number,d:number){this.b.part(name,()=>this.b.b(x,y,z,w,h,d,this.s[role]));}
}
function body(m:Figure,id:string,p:Params){const q=figureProportions[id],infant=id==='CHAR-061',elder=id==='CHAR-065',rounded=q.section==='rounded',h=q.heightM,hip=q.hipYM,sh=q.shoulderYM,headBase=h-q.headM,ankle=h*(infant?.092:.059),legR=q.hipHalfWidthM*(infant?.74:.69),depth=q.hipRadiusM*.65,elbow=sh-(sh-hip)*.48,wrist=hip+(infant?.022:.037),armX=q.shoulderHalfWidthM,armR=h*(infant?.066:elder?.032:.038),wristX=armX+armR*.67,neckR=q.headM*.19;
 m.add('髋腹胸肩连续衣身','modelSuit',[{y:hip-.014,rx:q.hipRadiusM*.87,rz:depth},{y:hip+.038,rx:q.hipRadiusM,rz:depth*1.03},{y:hip+(sh-hip)*.36,rx:q.waistHalfWidthM,rz:depth*.92,z:elder?.006:0},{y:sh-.055*h,rx:armX*.88,rz:depth*1.06},{y:sh+.005,rx:armX*.96,rz:depth*.88},{y:headBase-.018,rx:neckR*1.1,rz:neckR*.96}],rounded);
 m.add('衣领承接颈部','modelSuitTrim',[{y:headBase-.038,rx:neckR*1.1,rz:neckR},{y:headBase+.012,rx:neckR,rz:neckR*.94}]);
 for(const side of[-1,1]){const x=side*q.hipHalfWidthM;
  m.add('裤腿膝踝连续收束-'+side,'modelSuit',[{y:ankle,rx:legR*.66,rz:legR*.75,x},{y:q.kneeYM*.65,rx:legR*.79,rz:legR*.87,x},{y:q.kneeYM,rx:legR*.91,rz:legR*.95,x,z:-.005},{y:hip-(hip-q.kneeYM)*.33,rx:legR*1.05,rz:legR*1.15,x},{y:hip+.028,rx:legR*1.12,rz:depth*.96,x}],rounded);
  m.add('膝前衣褶-'+side,'modelSuitTrim',[{y:q.kneeYM-h*.012,rx:legR*.69,rz:.008,x,z:-legR*.88},{y:q.kneeYM+h*.01,rx:legR*.71,rz:.01,x,z:-legR*.90}],rounded);
  m.add('肩肘腕连续袖身-'+side,'modelSuit',[{y:wrist,rx:armR*.64,rz:armR*.68,x:side*wristX},{y:elbow,rx:armR*.84,rz:armR*.86,x:side*(armX+armR*.48)},{y:sh-.03*h,rx:armR,rz:armR*1.06,x:side*armX},{y:sh+.027*h,rx:armR*.65,rz:armR*.77,x:side*(armX-.005)}],rounded);
  m.add('袖口织边-'+side,'modelSuitTrim',[{y:wrist-.008,rx:armR*.69,rz:armR*.73,x:side*wristX},{y:wrist+.016,rx:armR*.71,rz:armR*.75,x:side*wristX}],rounded);
  m.add('裤脚织边-'+side,'modelSuitTrim',[{y:ankle,rx:legR*.70,rz:legR*.79,x},{y:ankle+.014,rx:legR*.73,rz:legR*.82,x}],rounded);
  if(p.extremities==='covered'){
   m.add('中性衣套手端非精细手-'+side,'modelSuit',[{y:wrist-h*.071,rx:armR*.32,rz:armR*.39,x:side*wristX},{y:wrist-h*.042,rx:armR*.69,rz:armR*.48,x:side*wristX},{y:wrist+.003,rx:armR*.59,rz:armR*.64,x:side*wristX}]);
   m.add('中性衣套足端非裸足-'+side,'modelSuit',[{y:0,rx:legR*.79,rz:legR*1.42,x,z:-legR*.46},{y:ankle*.4,rx:legR*.89,rz:legR*1.53,x,z:-legR*.51},{y:ankle*1.02,rx:legR*.62,rz:legR*.74,x}]);
  }
  m.ports.push(socket('shoulder-'+side,[side*armX,sh,0],[side,0,0]),socket('elbow-'+side,[side*(armX+armR*.48),elbow,0]),socket('wrist-'+side,[side*wristX,wrist,0],[0,-1,0],[armR*1.28,.01,armR*1.36]),socket('hip-'+side,[x,hip,0],[0,-1,0]),socket('knee-'+side,[x,q.kneeYM,-.005],[0,-1,0]),socket('ankle-'+side,[x,ankle,0],[0,-1,0],[legR*1.32,.01,legR*1.5]));
 }
 const seamZ=-depth*.94;
 m.box('胸前最小织标','modelSuitTrim',-.0125,sh-.12*h,-depth*1.08,.025,.025,.02);
 m.box('腹部拉链止挡','modelSuitTrim',-.0075,hip+(sh-hip)*.38,seamZ-.006,.015,.02,.014);
 m.ports.unshift(socket('neck',[0,headBase,0]),socket('bag-shoulder',[armX-.005,sh+.027*h,0]));
 m.detail={proportions:q,overallHeightIncludesSeparateHead:true,headExcluded:true,hairExcluded:true,extremities:p.extremities,coveredExtremities:'neutral fully clothed modelling suit mittens/socks; not CHAR070 articulated hands or CHAR071 bare feet',futureRig:['CHAR-073','CHAR-074'],genderOrIdentityInferred:false,elderBentBackReservedFor:'CHAR-080',originalSkeletonBound:false};
}
function head(m:Figure,stage:'adult'|'infant'|'toddler'){
 const adult=stage==='adult',baby=stage==='infant',height=adult?.24:baby?.19:.205;
 const profiles:Ring[]=adult?[{y:0,rx:.039,rz:.047,z:-.009},{y:.018,rx:.056,rz:.058,z:-.006},{y:.043,rx:.071,rz:.068,z:-.003},{y:.07,rx:.082,rz:.080},{y:.10,rx:.085,rz:.084},{y:.128,rx:.084,rz:.086},{y:.154,rx:.084,rz:.083},{y:.19,rx:.079,rz:.077},{y:.218,rx:.062,rz:.061},{y:.235,rx:.033,rz:.034},{y:.24,rx:.013,rz:.018}]:baby?[{y:0,rx:.035,rz:.040,z:-.008},{y:.018,rx:.053,rz:.055,z:-.006},{y:.038,rx:.070,rz:.067},{y:.060,rx:.078,rz:.077},{y:.09,rx:.082,rz:.080},{y:.132,rx:.081,rz:.083,z:.003},{y:.161,rx:.067,rz:.073,z:.002},{y:.18,rx:.043,rz:.048},{y:.19,rx:.014,rz:.018}]:[{y:0,rx:.035,rz:.044,z:-.008},{y:.022,rx:.056,rz:.057},{y:.048,rx:.073,rz:.071},{y:.079,rx:.079,rz:.080},{y:.12,rx:.082,rz:.082},{y:.155,rx:.078,rz:.080},{y:.18,rx:.059,rz:.064},{y:.198,rx:.034,rz:.038},{y:.205,rx:.013,rz:.016}];
 m.add('独立颅额颧颊下颌-'+stage,'skinSurface',profiles);
 m.add('颈部插接','skinSurface',[{y:-.022,rx:adult?.042:.032,rz:adult?.040:.030},{y:.022,rx:adult?.043:.034,rz:adult?.041:.033}]);
 const eyeY=adult?.113:baby?.068:.083,eyeX=adult?.035:.031,eyeZ=adult?-.081:baby?-.073:-.076,earY=eyeY-.024;
 for(const side of[-1,1]){
  m.add('连续耳轮-'+side,'skinSurface',[{y:earY-.015,rx:.007,rz:.011,x:side*(adult?.085:.078)},{y:earY+.013,rx:.013,rz:.019,x:side*(adult?.085:.078)},{y:earY+.045,rx:.007,rz:.014,x:side*(adult?.082:.077)}]);
  m.box('耳内褶层-'+side,'skinCrease',side*(adult?.088:.081)-.003,earY+.005,-.012,.006,.02,.012);
  m.box('眼白-'+side,'eyeWhite',side*eyeX-.016,eyeY,eyeZ-.006,.032,.012,.014);
  m.box('虹膜-'+side,'eyeIris',side*eyeX-.0075,eyeY,eyeZ-.011,.015,.012,.005);
  m.box('瞳孔-'+side,'eyePupil',side*eyeX-.0025,eyeY+.003,eyeZ-.016,.005,.008,.005);
  m.box('眼睑-'+side,'skinCrease',side*eyeX-.017,eyeY+.013,eyeZ-.005,.034,.005,.013);
  m.box('眉毛-'+side,'hairMass',side*eyeX-.018,eyeY+.028,adult?-.087:baby?-.085:-.087,.036,adult?.008:.005,.024);
 }
 m.add('鼻梁鼻翼鼻尖-'+stage,'skinSurface',[{y:eyeY-.035,rx:adult?.014:.010,rz:.011,z:eyeZ-.003},{y:eyeY-.022,rx:adult?.016:.013,rz:adult?.019:.013,z:eyeZ-.016},{y:eyeY-.006,rx:.008,rz:.012,z:eyeZ-.009},{y:eyeY+.014,rx:.004,rz:.008,z:eyeZ+.002}]);
 m.box('独立唇面','skinLip',-.015,adult?.039:baby?.017:.027,adult?-.080:baby?-.072:-.078,.03,.008,.024);
 m.ports=[socket('neck',[0,0,0],[0,-1,0]),socket('hat-seat',[0,adult?.170:.145,0]),socket('hair-back',[0,0,0])];
 m.detail={stage,heightM:height,adultUniformScale:false,headHairExcluded:true,faceAtlasBound:false,faceRepresentation:'actual skin mesh and 5mm ocular/lip/brow components',cranialProfiles:profiles,originalAgeConditionBound:false};
}
function cap(m:Figure,p:Params){const teen=p.capFit==='teen',rx=teen?.109:.116,rz=teen?.114:.119;
 const outer:Ring[]=[{y:0,rx,rz},{y:.038,rx:rx*1.03,rz:rz*1.02},{y:.09,rx:rx*.86,rz:rz*.84,z:.008},{y:.135,rx:rx*.55,rz:rz*.56,z:.012},{y:.145,rx:.025,rz:.029,z:.012}],inner=outer.map((r,i)=>({...r,y:i===0?0:r.y-.007,rx:r.rx-.007,rz:r.rz-.007}));
 m.meshes.push(hollowLoft('帽冠真实开底内腔',m.s.hatCloth,outer,inner,'bottom'));
 // An elliptical outer leather band shares the crown profile and stays outside its cavity.
 m.meshes.push(roundBand('帽圈皮带',m.s.hatBand,[{y:.008,rx:rx+.003,rz:rz+.003},{y:.03,rx:rx+.004,rz:rz+.004}],.004));
 m.add('短帽舌连续斜面','hatCloth',[{y:.002,rx:rx*.84,rz:.036,z:-rz-.015},{y:.014,rx:rx*.86,rz:.038,z:-rz-.015}],false);
 for(const side of[-1,1]){m.box('帽侧铜夹-'+side,'hatHardware',side*(rx-.006)-.005,.018,-.027,.01,.026,.025);m.add('帽侧皮扣带-'+side,'hatBand',[{y:-.047,rx:.009,rz:.01,x:side*(rx-.003),z:.015},{y:.025,rx:.01,rz:.012,x:side*(rx-.003),z:.004}],false);}
 m.box('帽徽铜座','hatHardware',-.020,.027,-rz-.006,.04,.03,.014);m.box('帽徽装饰玻璃非灯','hatBadgeGlass',-.0125,.032,-rz-.011,.025,.020,.005);
 m.ports=[socket('hat-seat',[0,0,0],[0,-1,0])];m.detail={fit:p.capFit,innerRings:inner,openBottom:true,sourceEligibility:'12岁以上种子/警卫官条件',sourceEligibilityBound:false,emission:0,headExcluded:true};
}
function bag(m:Figure,p:Params){
 const outer:Ring[]=[{y:0,rx:.122,rz:.065,bevel:.014},{y:.02,rx:.134,rz:.075,bevel:.016},{y:.29,rx:.136,rz:.072,bevel:.016},{y:.31,rx:.131,rz:.068,bevel:.014}],inner=outer.map((r,i)=>({...r,y:i===0?.008:r.y,rx:r.rx-.006,rz:r.rz-.006}));
 m.meshes.push(hollowLoft('帆布袋身真实开口',m.s.bagCloth,outer,inner,'top',false));
 const liningOuter=inner.map((r,i)=>({...r,y:i===0?r.y+.0005:r.y-.001,rx:r.rx-.0005,rz:r.rz-.0005})),liningInner=liningOuter.map((r,i)=>({...r,y:i===0?r.y+.003:r.y,rx:r.rx-.003,rz:r.rz-.003}));m.meshes.push(hollowLoft('内袋独立布衬',m.s.bagLining,liningOuter,liningInner,'top',false));
 for(const side of[-1,1]){m.add('袋角皮革包边-'+side,'bagLeather',[{y:.012,rx:.014,rz:.072,x:side*.119},{y:.294,rx:.014,rz:.071,x:side*.121}],false);m.box('正面皮扣带-'+side,'bagLeather',side*.066-.01,.105,-.081,.02,.158,.012);m.box('铜扣框-'+side,'bagHardware',side*.066-.016,.15,-.088,.032,.028,.009);m.box('扣芯皮带-'+side,'bagLeather',side*.066-.006,.154,-.093,.012,.017,.005);}
 m.box('空白油墨标签','bagLabel',-.025,.065,-.078,.05,.025,.01);
 const hinge:V3=[0,.313,.068],angle=p.lid==='open'?Math.PI/2:0,lid=loft('绕后铰轴旋转的皮革盖',m.s.bagLeather,[{y:.312,rx:.140,rz:.080,z:-.006,bevel:.015},{y:.324,rx:.14,rz:.080,z:-.006,bevel:.015}]);m.meshes.push(rigidMesh(lid,[0,0,0],angle,0,hinge));
 m.add('后铰缝真实连接','bagLeather',[{y:.300,rx:.092,rz:.008,z:.066},{y:.325,rx:.092,rz:.008,z:.066}],false);
 // Handle is a true ring in a vertical plane, remaining outside the lid sweep.
 m.meshes.push(rigidMesh(band('手提把真孔',m.s.bagLeather,{y:-.007,rx:.066,rz:.045},{y:.007,rx:.066,rz:.045},.011),[0,.353,.11],Math.PI/2));
 for(const side of[-1,1])m.add('提把后置承接耳-'+side,'bagLeather',[{y:.291,rx:.013,rz:.027,x:side*.055,z:.091},{y:.32,rx:.013,rz:.027,x:side*.055,z:.091}],false);
 if(p.carry==='shoulder'){
  for(const side of[-1,1])m.add('肩带袋面接耳-'+side,'bagLeather',[{y:.254,rx:.015,rz:.027,z:side*.091},{y:.285,rx:.015,rz:.027,z:side*.091}],false);
  for(const side of[-1,1])m.add('长肩带前后条-'+side,'bagLeather',[{y:.265,rx:.012,rz:.005,x:0,z:side*.108},{y:.48,rx:.012,rz:.005,x:-.160,z:side*.108},{y:.64,rx:.012,rz:.005,x:-.293,z:side*.094},{y:.69,rx:.012,rz:.005,x:-.297,z:side*.09},{y:.72,rx:.012,rz:.005,x:-.297,z:side*.078},{y:.747,rx:.012,rz:.007,x:-.297,z:side*.057}],false);
  m.add('肩顶连续承接带','bagLeather',[{y:.747,rx:.012,rz:.062,x:-.297},{y:.756,rx:.012,rz:.062,x:-.297}],false);
 }
 m.ports=[socket('carry-origin',[0,0,0],[0,-1,0]),socket('shoulder-rest',[-.297,.747,0],[0,-1,0]),socket('lid-hinge',hinge,[0,0,1])];m.detail={carry:p.carry,lid:p.lid,hinge,angleX:angle,innerRings:liningInner,truePocket:true,sourceEligibility:'6岁以上种子条件',sourceEligibilityBound:false,handGripRigBound:false};
}
function feet(m:Figure){for(const side of[-1,1]){const x=side*.044;m.add('独立婴幼儿脚块-'+side,'skinSurface',[{y:0,rx:.033,rz:.054,x,z:-.019},{y:.025,rx:.038,rz:.059,x,z:-.019},{y:.055,rx:.029,rz:.038,x,z:0},{y:.081,rx:.024,rz:.025,x}]);for(let k=0;k<3;k++)m.box('脚趾最小块-'+side+'-'+k,'skinSurface',x-.025+k*.019,.020,-.077,.015,.015,.015);m.ports.push(socket('ankle-'+side,[x,.079,0]));}m.detail={pairedFeetOnly:true,sourceRule:'height<=0.6 提前返回，无完整四肢',sourceRuleBound:false,completeInfantExcluded:true,fineInfantBodySeparate:'CHAR-061'};}
const features:Record<string,string[]>={'CHAR-013':['开底软帽冠','短斜帽舌','独立皮圈铜夹玻璃徽'],'CHAR-014':['真空袋腔和独立衬里','后铰轴开闭盖','短提把/长肩带'],'CHAR-015':['成对婴幼儿脚','独立踝挂点','原提前返回规则未绑定'],'CHAR-059':['成人A直肩髋衣身','独立肘膝腕踝挂点'],'CHAR-060':['成人B圆肩髋衣身','独立作者比例'],'CHAR-061':['婴儿短肢宽躯体','独立大头身比'],'CHAR-062':['学龄前体型','非成人等比缩放'],'CHAR-063':['学龄儿童体型','独立肩髋腿比例'],'CHAR-064':['青少年体型','独立头身和四肢比例'],'CHAR-065':['老年衣身体型','较收束肢体与圆肩','不等同强制弯背姿态'],'CHAR-066':['成人精细颅颊颌曲面','独立鼻耳眼唇材质'],'CHAR-067':['婴儿/幼儿独立颅面','大颅与短下脸']};
const counts:Record<string,number>={'CHAR-013':3,'CHAR-014':3,'CHAR-015':5,'CHAR-059':2,'CHAR-060':2,'CHAR-061':1,'CHAR-062':2,'CHAR-063':2,'CHAR-064':2,'CHAR-065':2,'CHAR-066':7,'CHAR-067':7};
export const figureRecipes:Record<string,AtlasRecipe>=Object.fromEntries(Object.entries(features).map(([id,f])=>[id,{size:figureProportions[id]?[figureProportions[id].shoulderHalfWidthM*2+.13,figureProportions[id].heightM-figureProportions[id].headM,.3]:id==='CHAR-014'?[.28,.70,.18]:id==='CHAR-013'?[.25,.2,.3]:id==='CHAR-015'?[.16,.081,.14]:[.2,.24,.21],pitch:.005,features:f.join('；'),limits,expectedComponents:counts[id],draw:()=>{throw new Error('通过混合人体工厂创建');}}]));
const headRoles=['skinSurface','skinCrease','skinLip','eyeWhite','eyeIris','eyePupil','hairMass'];
export function inspectFigureMaterials(id:string,a:Asset,s:Record<string,number>){if(!figureRecipes[id])return null;const allowed=figureProportions[id]?['modelSuit','modelSuitTrim']:id==='CHAR-013'?['hatCloth','hatBand','hatHardware','hatBadgeGlass']:id==='CHAR-014'?['bagCloth','bagLeather','bagHardware','bagLining','bagLabel']:id==='CHAR-015'?['skinSurface']:headRoles;for(const material of[...new Grid(a.chunks).cells()].map(([,m])=>m).concat((a.meshes??[]).map(m=>m.material)))if(!allowed.some(r=>s[r]===material))throw new Error(id+'材质用途错误 '+material);return{revision:1,method:'actual-voxel-and-mesh-role-check',roles:allowed,note:'衣套/帽布/帽皮圈/帽五金/玻璃徽/包布/皮边/五金/衬/油墨独立；皮肤、褶线、唇、眼、眉独立。全部非碰撞，装饰玻璃非灯。'};}
export function makeFigureAsset(catalogId:string,name:string,id:string,style:Record<string,number>,input:Params={}):Asset{
 const r=figureRecipes[catalogId];if(!r)throw new Error('未实现人体附件配方');const defs=figureParameters(catalogId);for(const[k,v]of Object.entries(input))if(!defs[k]?.enum.includes(v))throw new Error('未验证人体附件参数 '+k);const p={...Object.fromEntries(Object.entries(defs).map(([k,v])=>[k,v.default])),...input},s=new Proxy(style,{get(t,k){if(typeof k==='symbol')return Reflect.get(t,k);if(!Number.isInteger(t[k])||t[k]<1)throw new Error('缺少用途材质 '+k);return t[k];}}),m=new Figure(s);
 if(figureProportions[catalogId])body(m,catalogId,p);else if(catalogId==='CHAR-013')cap(m,p);else if(catalogId==='CHAR-014')bag(m,p);else if(catalogId==='CHAR-015')feet(m);else head(m,catalogId==='CHAR-066'?'adult':p.headStage as 'infant'|'toddler');
 const a:Asset={id,name,version:1,category:'base',cellSize:.005,origin:[0,0,0],chunks:m.b.g.serialize(),parts:[{id:'root',name:'最小原生细块；连续曲面另列',parent:null,region:m.b.g.bounds()!},...m.b.parts],ports:m.ports,openings:[],meshes:m.meshes,source:{kind:'catalog-recipe',catalogId,recipeRevision:1,styleReference:productionReference,styleRevision:productionStyleRevision,parameters:p,nominalDesignSizeM:r.size,features:r.features,geometryStage:'candidate',reference:atlasSource(catalogId),referenceStage:'candidate',limitations:limits,units:'metres',front:'-Z',gameIntegration:false,animation:false,collision:'none; visual-only',detail:m.detail}};const b=assetBoundsM(a)!;a.source!.dimensionsM=b.max.map((n,i)=>n-b.min[i]);a.source!.materialAssignmentReview=inspectFigureMaterials(catalogId,a,style);return a;
}
