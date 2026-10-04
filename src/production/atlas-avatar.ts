import type {Asset} from '../core/types';
import {Grid} from '../core/grid';
import {assetBoundsM} from '../core/sky';
import {validateRig} from '../core/rig';
import {atlasSource,type AtlasRecipe} from './atlas-life';
import {productionReference,productionStyleRevision} from './style';
import {AvatarModel} from './avatar-model';
import {ageHead,hair,type HeadStage} from './avatar-heads';
import {hand,foot,humanoidRig} from './avatar-limbs';
import {abdomen,firstPerson} from './avatar-extensions';
type Params=Record<string,number|string>;
const param=(values:string[],description:string)=>({type:'string',enum:values,default:values[0],description});
export function avatarParameters(id:string):Record<string,any>{
 if(id==='CHAR-068')return{headStage:param(['preschool','school','teen'],'独立学龄前/儿童/青少年颅面比例')};
 if(id==='CHAR-070')return{limbFit:param(['adult','child'],'成人A/学龄儿童作者腕口'),handPose:param(['open','grip'],'真实分节关节姿态；不改写原生绑定格')};
 if(id==='CHAR-071')return{limbFit:param(['adult','child'],'成人A/学龄儿童作者踝口')};
 if(id==='CHAR-072')return{abdomenFit:param(['adultA','adultB'],'对应身体腹段替换，非重叠覆盖')};
 if(['CHAR-073','CHAR-074'].includes(id))return{rigPose:param(['rest','reach'],'作者手工刚性绑定，休息/抬臂屈膝姿态')};
 if(id==='CHAR-075')return{handPose:param(['open','grip'],'第一人称双手实际关节姿态')};
 if(['CHAR-085','CHAR-086','CHAR-087','CHAR-088'].includes(id))return{hairFit:param(['adult','child'],'成人066/儿童068 school头腔')};return{};
}
export function avatarVariants(id:string):Params[]{return Object.entries(avatarParameters(id)).reduce<Params[]>((rows,[key,p])=>rows.flatMap(r=>p.enum.map((v:string)=>({...r,[key]:v}))),[{}]);}
const limits='作者三维候选：最小组件保留5mm体素，斜面曲面为连续网格；全部角色外观非碰撞。头部、发型、手足、衣覆腹段和绑定导架独立。手/骨架/第一人称组件具真实关节、逆绑定矩阵及刚性分件权重，未实现软皮肤、IK、动作片段或原角色控制器。原源码、尺寸、骨骼、面部图集未收件；不写Citizen/模拟。人工美术验收待定。';
const features:Record<string,string>={
 'CHAR-068':'儿童三年龄颅面；独立五官细块；不含发型',
 'CHAR-069':'老年颧颊下颌；独立眼下口角褶线；不含毛发胡须',
 'CHAR-070':'十五指节关节；张手与握持；半掌皮套与真腕圈',
 'CHAR-071':'五枚独立足趾；抬升足弓；成人/儿童踝口',
 'CHAR-072':'衣覆孕期腹段；成人A/B独立接缝；实际替换身体中段',
 'CHAR-073':'成人二十二关节导架；手工刚性绑定；实际姿态与socket',
 'CHAR-074':'儿童二十二关节导架；独立比例；实际姿态与socket',
 'CHAR-075':'第一人称双前臂与分节双手；精确镜像；真实骨骼',
 'CHAR-085':'整齐短发完整内腔；侧后发束与额前短束',
 'CHAR-086':'偏分短发完整内腔；偏侧冠线与斜额束',
 'CHAR-087':'微卷短发完整内腔；起伏冠束与错列卷端',
 'CHAR-088':'齐耳发完整内腔；低侧后轮廓与分离刘海',
};
const counts:Record<string,number>={'CHAR-068':7,'CHAR-069':11,'CHAR-070':6,'CHAR-071':5,'CHAR-072':1,'CHAR-073':21,'CHAR-074':21,'CHAR-075':12,'CHAR-085':1,'CHAR-086':1,'CHAR-087':1,'CHAR-088':1};
export const avatarRecipes:Record<string,AtlasRecipe>=Object.fromEntries(Object.entries(features).map(([id,f])=>[id,{size:id==='CHAR-073'?[.55,1.70,.30]:id==='CHAR-074'?[.40,1.20,.23]:id==='CHAR-075'?[.55,.15,.48]:id==='CHAR-072'?[.37,.39,.38]:[.24,.28,.25],pitch:.005,features:f,limits,expectedComponents:counts[id],draw:()=>{throw new Error('通过角色混合/绑定工厂创建');}}]));
export function inspectAvatarMaterials(id:string,a:Asset,s:Record<string,number>){if(!avatarRecipes[id])return null;const allowed=id==='CHAR-068'||id==='CHAR-069'?['skinSurface','skinCrease','skinLip','eyeWhite','eyeIris','eyePupil','hairMass']:id==='CHAR-070'?['skinSurface','skinNail','handWrap','characterFastener']:id==='CHAR-071'?['skinSurface','skinNail']:id==='CHAR-072'?['modelSuit','modelSuitTrim']:id==='CHAR-073'||id==='CHAR-074'?['rigGuide','rigJointMarker','rigSocketMarker']:id==='CHAR-075'?['skinSurface','skinNail','handWrap','characterFastener','characterCloth','characterLining']:['hairMass','hairRidge'];for(const material of [...new Grid(a.chunks).cells()].map(([,m])=>m).concat((a.meshes??[]).map(m=>m.material)))if(!allowed.some(r=>s[r]===material))throw new Error(id+'材质用途错误 '+material);return{revision:1,method:'actual-voxel-and-mesh-role-check',roles:allowed,note:'实际皮肤/指甲/皮套/衣料/毛发分离；导架为作者塑料标识，不冒称人体骨材；全部非碰撞。'};}
export function makeAvatarAsset(catalogId:string,name:string,id:string,style:Record<string,number>,input:Params={}):Asset{
 const r=avatarRecipes[catalogId];if(!r)throw new Error('未实现角色扩展配方');const defs=avatarParameters(catalogId);for(const[k,v]of Object.entries(input))if(!defs[k]?.enum.includes(v))throw new Error('未验证角色扩展参数 '+k);const p={...Object.fromEntries(Object.entries(defs).map(([k,v])=>[k,v.default])),...input},s=new Proxy(style,{get(t,k){if(typeof k==='symbol')return Reflect.get(t,k);if(!Number.isInteger(t[k])||t[k]<1)throw new Error('缺少用途材质 '+k);return t[k];}}),m=new AvatarModel(s);
 if(catalogId==='CHAR-068'||catalogId==='CHAR-069')ageHead(m,catalogId==='CHAR-069'?'elder':p.headStage as HeadStage);
 else if(catalogId==='CHAR-070')hand(m,String(p.limbFit),String(p.handPose));
 else if(catalogId==='CHAR-071')foot(m,String(p.limbFit));
 else if(catalogId==='CHAR-072')abdomen(m,String(p.abdomenFit));
 else if(catalogId==='CHAR-073'||catalogId==='CHAR-074')humanoidRig(m,catalogId==='CHAR-073'?'adult':'child',String(p.rigPose));
 else if(catalogId==='CHAR-075')firstPerson(m,String(p.handPose));else hair(m,catalogId,String(p.hairFit));
 const a:Asset={id,name,version:1,category:'base',cellSize:.005,origin:[0,0,0],chunks:m.b.g.serialize(),parts:[{id:'root',name:'最小原生细块；连续形面及关节另列',parent:null,region:m.b.g.bounds()!},...m.b.parts],ports:m.ports,openings:[],meshes:m.meshes,...(m.rig?{rig:m.rig}:{}),source:{kind:'catalog-recipe',catalogId,recipeRevision:1,styleReference:productionReference,styleRevision:productionStyleRevision,parameters:p,nominalDesignSizeM:r.size,features:r.features,geometryStage:'candidate',reference:atlasSource(catalogId),referenceStage:'candidate',limitations:limits,units:'metres',front:'-Z',gameIntegration:false,animationClips:false,manualRigidBinding:!!m.rig,collision:'none; visual-only',detail:m.detail}};validateRig(a);const b=assetBoundsM(a)!;a.source!.dimensionsM=b.max.map((n,i)=>n-b.min[i]);a.source!.materialAssignmentReview=inspectAvatarMaterials(catalogId,a,style);return a;
}
