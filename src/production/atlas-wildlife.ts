import type {Asset,V3} from '../core/types';
import {Grid} from '../core/grid';
import {validateRig} from '../core/rig';
import {assetBoundsM} from '../core/sky';
import {heldModel} from './held-shapes';
import {Shapes} from './shapes';
import {heron,streamFish,insect} from './wildlife-species';
import {quadrupedRig,birdRig,fishRig} from './wildlife-rigs';
import {petCollar,petTag,petHarness,livestockTag} from './animal-wear';
import {atlasSource,type AtlasRecipe} from './atlas-life';
import {productionReference,productionStyleRevision} from './style';
const definitions:Record<string,[string,string,string[]]>={
 'CHAR-320':['鹭鸟独立长腿、S颈、长直喙和羽冠','heronNeck',['watchful','lowered']],
 'CHAR-321':['溪流鱼长躯、窄尾柄、叉尾、腹臀鳍及口须','streamTail',['broad-tail','narrow-tail']],
 'CHAR-322':['蝶六足、分节躯、四翼、薄鳞面和触角','butterflyWings',['spread-wings','folded-wings']],
 'CHAR-323':['蜂六足、金色刚毛/深色外骨骼、四透明翼与复眼','beeWings',['wings-up','wings-down']],
 'CHAR-324':['四足动物父子局部骨链、四肢/头/尾和刚性姿态','quadrupedPose',['neutral','stride-study']],
 'CHAR-325':['鸟类颈链、两翼肩肘腕尖链、双足和尾','birdRigPose',['neutral','wing-study']],
 'CHAR-326':['鱼类串联脊尾链、胸鳍与背鳍独立归属','fishRigPose',['neutral','tail-bend']],
 'CHAR-327':['昆虫六足髋膝、四翅根、头和腹部局部刚性动作','insectPose',['rest','flexed']],
 'CHAR-328':['真实贯通项圈、软衬、扣壳、调整孔及挂环','collarFit',['dog','cat']],
 'CHAR-329':['圆角名牌、实体珐琅、真孔及连接环','tagFace',['paw','blank']],
 'CHAR-330':['胸背带真实胸腹环、背腹侧连接和牵引环','harnessFit',['dog','cat']],
 'CHAR-331':['家畜独立颈带、真挂环及空白识别佩牌','livestockFit',['cow','cow-wide']]
};
export const wildlifeIds=Object.keys(definitions);
export function wildlifeParameters(id:string){const d=definitions[id];if(!d)throw new Error('未实现动物骨架穿戴候选');const[,key,values]=d;return{[key]:{type:'string',enum:values,default:values[0],description:'有限作者形态/刚性姿态；不代表原运行骨架、动画片段或动物实体'}};}
export const wildlifeVariants=(id:string)=>{const[,k,v]=definitions[id];return v.map(value=>({[k]:value}));};
const limits='M043技术候选：连续曲面、翼、斜带及骨链，不强制整件卡格。昆虫最小细件1mm，其余5mm原生。全部非碰撞、未绑定电源零发光。骨架保留真实父子关节与刚性分件、归属和有限姿态，不冒称软皮肤、动作片段、原骨架重定向、飞行游泳/步态/生态/所有权集成。穿戴仅指定猫犬牛有限静态配合；空牌不捏造身份，人工美术验收0。';
const sizes:Record<string,V3>={"CHAR-320": [0.296693834, 1.324488246, 0.940823907], "CHAR-321": [0.222030812, 0.21300000000000002, 0.588286205], "CHAR-322": [0.147746052, 0.050753, 0.10400000000000001], "CHAR-323": [0.045179068, 0.034399103, 0.040499999999999994], "CHAR-324": [0.264868532, 0.70845, 0.8947], "CHAR-325": [1.2998, 1.006399169, 0.764451202], "CHAR-326": [0.187295688, 0.15455903799999998, 0.554772982], "CHAR-327": [0.140055112, 0.106637218, 0.1262], "CHAR-328": [0.26, 0.23240171999999998, 0.277010298], "CHAR-329": [0.047, 0.07246, 0.0115], "CHAR-330": [0.32, 0.4032667689999999, 0.208], "CHAR-331": [0.378, 0.546116536, 0.39028333000000004]};
const components:Record<string,number>={"CHAR-320": 9, "CHAR-321": 3, "CHAR-322": 8, "CHAR-323": 8, "CHAR-324": 25, "CHAR-325": 21, "CHAR-326": 10, "CHAR-327": 8, "CHAR-328": 2, "CHAR-329": 1, "CHAR-330": 2, "CHAR-331": 3};
export const wildlifeRecipes:Record<string,AtlasRecipe>=Object.fromEntries(Object.entries(definitions).map(([id,[features]])=>[id,{size:sizes[id]??[1,1,1],pitch:['CHAR-322','CHAR-323','CHAR-327'].includes(id)?.001:.005,features,limits,expectedComponents:components[id],draw:()=>{throw new Error('使用动物骨架穿戴混合工厂');}}]));
const bird=['featherCream','featherGray','featherSlate','featherDark','birdFootDark','birdBeak','eyeWhite','animalIris','animalPupil','animalNose','animalClaw'];
const fish=['liveScaleWhite','liveScaleOrange','liveFin','liveGill','liveMouth','eyeWhite','animalIris','animalPupil'];
const bug=['insectCuticle','butterflyScaleBlue','insectWingMembrane','butterflyScaleDark','butterflyScalePale','insectWingVein','beePile','insectEye','insectCuticleGreen'];
const rig=['rigGuide','rigJointMarker','rigSocketMarker'];
const wear=['petWebbing','petHardware','petBuckle','petOptic','petTagMetal','petTagEnamel','petTagInk','harnessLiner','livestockWebbing','livestockTagEnamel'];
export function inspectWildlifeMaterials(id:string,a:Asset,s:Record<string,number>){const allowed=id==='CHAR-320'?bird:id==='CHAR-321'?fish:['CHAR-322','CHAR-323','CHAR-327'].includes(id)?bug:['CHAR-324','CHAR-325','CHAR-326'].includes(id)?rig:wear,used=new Set([...new Grid(a.chunks).cells()].map(([,v])=>v).concat((a.meshes??[]).map(m=>m.material)));for(const v of used)if(!allowed.some(r=>s[r]===v))throw new Error(id+'动物骨架穿戴材质用途混用 '+v);return{revision:1,method:'actual-voxel-and-continuous-mesh-role-check',roles:allowed.filter(r=>used.has(s[r])),note:'Rig guides use tooling purposes; insect tissue and wing scales/membranes/veins, bird plumage, and worn hardware/webbing/ink remain independently replaceable. Coarse skin/hair categories do not equate their physical tissues.'};}
export function makeWildlifeAsset(catalogId:string,name:string,id:string,style:Record<string,number>,input:Record<string,string|number>={}):Asset{
 const r=wildlifeRecipes[catalogId];if(!r)throw new Error('未实现动物骨架穿戴候选');const defs=wildlifeParameters(catalogId);for(const[k,v]of Object.entries(input))if(typeof v!=='string'||!defs[k]?.enum.includes(v))throw new Error('未验证动物骨架穿戴参数 '+k);const parameters={...Object.fromEntries(Object.entries(defs).map(([k,d])=>[k,d.default])),...input},s=new Proxy(style,{get(t,k){if(typeof k==='symbol')return Reflect.get(t,k);if(!Number.isInteger(t[k])||t[k]<1)throw new Error('缺少动物骨架穿戴用途 '+k);return t[k];}}),m=heldModel(s);m.b=new Shapes(r.pitch!,s);
 const builders:Record<string,(m:ReturnType<typeof heldModel>,form:string)=>void>={'CHAR-320':heron,'CHAR-321':streamFish,'CHAR-322':(m,f)=>insect(m,f,'butterfly'),'CHAR-323':(m,f)=>insect(m,f,'bee'),'CHAR-324':quadrupedRig,'CHAR-325':birdRig,'CHAR-326':fishRig,'CHAR-327':(m,f)=>insect(m,f,'locust'),'CHAR-328':petCollar,'CHAR-329':petTag,'CHAR-330':petHarness,'CHAR-331':livestockTag};builders[catalogId](m,String(Object.values(parameters)[0]));
 const bounds=m.b.g.bounds();if(!bounds)throw new Error('缺少最小原生细件');for(const port of m.ports)port.pitch=r.pitch!;const a:Asset={id,name,version:1,category:'base',cellSize:r.pitch!,origin:[0,0,0],chunks:m.b.g.serialize(),parts:[{id:'root',name:'最小原生细件',parent:null,region:bounds},...m.b.parts],meshes:m.meshes,rig:m.rig,ports:m.ports,openings:[],source:{kind:'catalog-recipe',catalogId,recipeRevision:1,styleReference:productionReference,styleRevision:productionStyleRevision,parameters,features:r.features,geometryStage:'candidate',reference:atlasSource(catalogId),referenceStage:'candidate',limitations:limits,units:'metres',front:'-Z',gameIntegration:false,animationClips:false,collision:'none; visual-only',detail:m.detail,dimensionBasis:'Author anatomy/family guide or finite accessory fit, not original runtime dimensions'}};validateRig(a);const b=assetBoundsM(a)!;a.source!.dimensionsM=b.max.map((v,i)=>v-b.min[i]);a.source!.materialAssignmentReview=inspectWildlifeMaterials(catalogId,a,style);return JSON.parse(JSON.stringify(a));
}
