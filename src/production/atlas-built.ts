import {civicRecipes,civicVariants,selectCivicRecipe,civicMaterialRule,configureCivicAsset} from './atlas-urban';
import {aerialRecipes,aerialMaterialRules,configureAerialAsset} from './atlas-aerial';
import {stationRecipes,stationMaterialRules,configureStationAsset} from './atlas-stations';
import {bridgeRecipes,bridgeMaterialRules,configureBridgeAsset} from './atlas-bridges';
import {transportRecipes,transportMaterialRules,configureTransportAsset} from './atlas-transport';
import {waterfrontRecipes,waterfrontMaterialRules,configureWaterfrontAsset} from './atlas-waterfront';
import {exteriorRecipes,exteriorMaterialRules,configureExteriorAsset} from './atlas-exterior';
import {joineryRecipes,joineryMaterialRules,configureJoineryAsset} from './atlas-joinery';
import {structureRecipes,structureMaterialRules,configureStructureAsset} from './atlas-structure';
import {legacyBuildingRecipes,legacyBuildingMaterialRules,configureLegacyBuildingAsset} from './atlas-legacy-building';
import {Shapes} from './shapes';
import {Grid} from '../core/grid';
import type {Asset,V3} from '../core/types';
import type {AtlasRecipe} from './atlas-life';
import links from './atlas-links.json';
import {productionReference,productionStyleRevision} from './style';

export const atlasBuiltRecipes:Record<string,AtlasRecipe>={
 'BUILT-003':{size:[2.4,.20,1.2],pitch:.02,features:'共享回廊楼板：石铺面、攒边梁、下层承梁、连续通行面与柱座凹口',limits:'参考图的上下展开表示承力层次，本母版是单块可拼装楼板，不把展示中的悬起一层当作额外可走楼层；无游戏 FloorPlan/路径系统接入。',draw:(b,w,h,d)=>{
  b.part('下层钢边梁、横向承梁与真实层间空隙',()=>{for(const z of[0,d-.10])b.b(0,0,z,w,.12,.10,b.s.metal);for(const x of[0,w-.10])b.b(x,0,.08,.10,.12,d-.16,b.s.metal);for(let x=.38;x<w-.2;x+=.4)b.b(x,.04,.08,.08,.08,d-.16,b.s.trim);for(const x of[.10,w-.18])b.b(x,.12,.08,.08,.04,d-.16,b.s.metal);});
  b.part('四角连接鞍、石质套座与安装凹口',()=>{for(const x of[0,w-.16])for(const z of[0,d-.16]){b.b(x,0,z,.16,.16,.16,b.s.stone);b.b(x,.10,z,.16,.08,.16,b.s.metal);b.b(x+.04,.16,z+.04,.08,.04,.08,b.s.bronze);b.b(x+.06,0,z+.06,.04,.10,.04,0);}});
  b.part('连续承板、浅石铺块与独立灰缝',()=>{b.b(.08,.14,.08,w-.16,.04,d-.16,b.s.stone);for(let x=.10;x<w-.10;x+=.40)for(let z=.10;z<d-.10;z+=.34)b.b(x,.18,z,Math.min(.38,w-.10-x),.02,Math.min(.32,d-.10-z),b.s.wall);for(const z of[0,d-.08])b.b(.16,.12,z,w-.32,.08,.08,b.s.wall);for(const x of[0,w-.08])b.b(x,.12,.16,.08,.08,d-.32,b.s.wall);});
  b.part('边梁灯槽和内缩连接接缝',()=>{for(const x of[.26,1.88]){b.b(x,.06,0,.24,.06,.04,b.s.trim);b.b(x+.02,.08,0,.20,.02,.02,b.s.energy);}for(const x of[.18,w-.22])for(const z of[.015,d-.035])b.b(x,.04,z,.04,.04,.02,b.s.bronze);});
 }},
 'BUILT-007':{size:[1.2,1.8,4.4],pitch:.02,features:'共享上行一跑：八级 0.2m 踢高 / 0.4m 进深、底顶平台、双侧木梁与真实梯下空间',limits:'按参考只制作双跑楼梯中的上行一跑；不是双跑总成。台阶真实离散，梯下有支承空间；尚未接入游戏的寻路、楼层或第一人称控制器。',draw:(b,w,h,d)=>{
  b.part('底平台、顶接台与浅石铺面',()=>{b.b(0,0,0,w,.16,.40,b.s.metal);b.b(.06,.16,.02,w-.12,.04,.36,b.s.wall);b.b(0,1.60,3.60,w,.16,.80,b.s.metal);b.b(.06,1.76,3.62,w-.12,.04,.76,b.s.wall);for(const z of[0,4.24])for(const x of[0,w-.16]){b.b(x,z===0?0:1.60,z,.16,.20,.16,b.s.metal);b.b(x+.04,z===0?.16:1.76,z+.04,.08,.04,.08,b.s.bronze);}});
  b.part('八块独立踏面、踢面和两侧实木梯梁',()=>{for(let i=0;i<8;i++){const z=.40+i*.40,top=.40+i*.20;b.b(0,top-.08,z,w,.08,.40,b.s.wall);b.b(0,top-.20,z,w,.12,.06,b.s.stone);b.b(.04,top-.04,z+.02,w-.08,.04,.34,b.s.wall);for(const x of[.06,w-.14])b.b(x,top-.18,z+.04,.08,.10,.28,b.s.wood);}for(const x of[.10,w-.10])b.beam([x,.10,.20],[x,1.70,3.40],.12,b.s.wood);});
  b.part('顶台双柱、石足、金属套肩与横枨',()=>{for(const x of[.08,w-.20]){b.b(x-.02,0,4.10,.16,.10,.18,b.s.wall);b.b(x,.10,4.12,.12,1.50,.14,b.s.wood);b.b(x-.02,1.50,4.10,.16,.10,.18,b.s.metal);}b.b(.14,1.46,4.14,w-.28,.10,.10,b.s.wood);});
  b.part('两端嵌入状态窗与踏步防滑条',()=>{for(const z of[.02,4.24]){const y=z<1?.06:1.66;b.b(.04,y,z-.02,.04,.08,.02,b.s.energy);b.b(w-.08,y,z-.02,.04,.08,.02,b.s.energy);}for(let i=0;i<8;i++)b.b(.14,.38+i*.20,.43+i*.40,w-.28,.02,.02,b.s.stone);});
 }},
};

Object.assign(atlasBuiltRecipes,structureRecipes,legacyBuildingRecipes,joineryRecipes,exteriorRecipes,waterfrontRecipes,transportRecipes,bridgeRecipes,stationRecipes,aerialRecipes,civicRecipes);

export function builtWidthParameter(id:string){
 if(civicVariants[id])return{component:{type:'string',enum:Object.keys(civicVariants[id]),default:Object.keys(civicVariants[id])[0],description:'同一清单ID内的独立结构组件；切换组件不会增加清单母版数量'}};
 if(id==='BUILT-205')return{depth:{minimum:.2,maximum:8,default:8,enum:[.2,8],unit:'metres'}};
 if(id==='BUILT-149')return{height:{minimum:12.4,maximum:12.8,default:12.4,enum:[12.4,12.8],unit:'metres'}};
 if(id==='BUILT-007')return{width:{minimum:1.2,maximum:1.6,default:1.2,enum:[1.2,1.6],unit:'metres'}};
 if(id==='BUILT-017')return{width:{minimum:7.2,maximum:14.4,default:12.8,step:.2,unit:'metres'}};
 return{};
}

export function inspectBuiltMaterialAssignments(id:string,a:Asset,roles:Record<string,number>){
 if(!atlasBuiltRecipes[id])return null;
 const used=new Set([...new Grid(a.chunks).cells()].map(([,m])=>m));
 const rule=structureMaterialRules[id]??legacyBuildingMaterialRules[id]??joineryMaterialRules[id]??exteriorMaterialRules[id]??waterfrontMaterialRules[id]??transportMaterialRules[id]??bridgeMaterialRules[id]??stationMaterialRules[id]??aerialMaterialRules[id]??civicMaterialRule(id,a);
 for(const role of rule?.required??['stone','wall','metal','bronze','energy'])if(!used.has(roles[role]))throw new Error(id+' 缺少实际材质 '+role);
 const permitted=new Set((rule?.allowed??['stone','wall','metal','trim','wood','bronze','energy']).map(r=>roles[r]));
 for(const m of used)if(!permitted.has(m))throw new Error(id+' 非建筑材质 '+m);
 return{revision:1,method:'authored-use-and-actual-voxel-check',note:rule?.note??(id==='BUILT-003'?'石铺块、灰缝、钢边梁、铜鞍与独立灯芯按实际用途分类；无第二层假楼板。':'石踏面与踢面、木梯梁、金属套肩、铜连接和灯芯独立；不是涂装金属借用石色。')};
}

export function makeAtlasBuiltAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Record<string,number|string>={}):Asset{
 const recipe=selectCivicRecipe(catalogId,params.component)??atlasBuiltRecipes[catalogId];if(!recipe)throw new Error('此建筑清单条目尚无已实现的原生体素配方');
 const dimensions=[...recipe.size] as V3;
 if(Object.keys(params).some(k=>k!=='width'&&k!=='height'&&k!=='depth'&&k!=='component'))throw new Error('本建筑参数尚未验证');
 if(params.width!==undefined){const width=params.width;if(typeof width!=='number')throw new Error('宽度必须为数值');if(catalogId==='BUILT-007'&&[1.2,1.6].includes(width))dimensions[0]=width;else if(catalogId==='BUILT-017'&&Number.isFinite(width)&&width>=7.2&&width<=14.4&&Math.abs(width/.2-Math.round(width/.2))<1e-8)dimensions[0]=width;else throw new Error('本建筑配方的尺寸变化尚未验证；上行跑仅 1.2/1.6m，窗墙仅 7.2–14.4m 的 0.2m 增量');}
 if(params.height!==undefined){if(typeof params.height!=='number')throw new Error('高度必须为数值');if(catalogId!=='BUILT-149'||![12.4,12.8].includes(params.height))throw new Error('吊杆仅验证12.4/12.8m高度');dimensions[1]=params.height;}
 if(params.depth!==undefined){if(typeof params.depth!=='number')throw new Error('进深必须为数值');if(catalogId!=='BUILT-205'||![.2,8].includes(params.depth))throw new Error('高桥板/缝仅验证8/0.2m进深');dimensions[2]=params.depth;}
 const s=new Proxy(style,{get(target,role){if(typeof role==='symbol')return Reflect.get(target,role);const value=target[role];if(!Number.isInteger(value)||value<1||value>65535)throw new Error('配方缺少材质角色 '+role+'；禁止按近似颜色回退');return value;}}),b=new Shapes(recipe.pitch,s);
 b.part(recipe.features,()=>recipe.draw(b,...dimensions));
 if(b.g.count>1_000_000)throw new Error('建筑母版超过 1,000,000 个占用格；拆分组件');
 const a=b.finish(id,name,{kind:'catalog-recipe',catalogId,recipeRevision:3,styleReference:productionReference,styleRevision:productionStyleRevision,dimensionsM:dimensions,parameters:params,features:recipe.features,geometryStage:'candidate',gameIntegration:false,animation:false,units:'metres',front:'-Z',reference:(links as Record<string,unknown>)[catalogId],referenceStage:'candidate',dimensionBasis:`authored metres on ${recipe.pitch*1000} mm grid; explicit catalogue dimensions are stated in limitations, remaining dimensions are authored, not measured from the image`,limitations:recipe.limits,kinematics:'static; no rig or runtime motion'});
 const box=(min:V3,max:V3)=>({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 if(catalogId==='BUILT-003'){
  a.openings=[box([.50,0,.20],[.70,.14,1.00])];
  for(const[id,x,sign]of[['join-left',0,-1],['join-right',2.4,1]] as const)a.ports.push({id,kind:'walkway-1200',position:[x,.20,.60],normal:[sign,0,0],size:[0,.20,1.2],pitch:.02});
  for(const x of[.60,1.80])for(const[id,z,sign]of[['front',0,-1],['back',1.20,1]] as const)a.ports.push({id:id+'-'+Math.round(x*100),kind:'walkway-1200',position:[x,.20,z],normal:[0,0,sign],size:[1.2,.20,0],pitch:.02});
 }else if(catalogId==='BUILT-007'){
  const width=dimensions[0],kind=width===1.6?'walkway-1600':'walkway-1200';
  a.openings=[box([.28,.20,2.40],[width-.28,.90,3.30])];
  for(let i=0;i<8;i++)a.openings.push(box([.22,.42+i*.20,.48+i*.40],[width-.22,2.30+i*.20,.72+i*.40]));
  a.ports.push({id:'bottom-walkway',kind,position:[width/2,.20,0],normal:[0,0,-1],size:[width,.20,0],pitch:.02},{id:'top-walkway',kind,position:[width/2,1.80,4.40],normal:[0,0,1],size:[width,.20,0],pitch:.02});
 }else{configureStructureAsset(a,catalogId);configureLegacyBuildingAsset(a,catalogId);configureJoineryAsset(a,catalogId);configureExteriorAsset(a,catalogId);configureWaterfrontAsset(a,catalogId);configureTransportAsset(a,catalogId);configureBridgeAsset(a,catalogId);configureStationAsset(a,catalogId);configureAerialAsset(a,catalogId);configureCivicAsset(a,catalogId);}
 a.source!.materialAssignmentReview=inspectBuiltMaterialAssignments(catalogId,a,style);return a;
}
