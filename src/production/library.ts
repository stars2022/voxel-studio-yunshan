import {architectureAssemblyIds,architectureAssemblyParameters} from './atlas-architecture-assemblies';
import {wildlifeRecipes,wildlifeParameters} from './atlas-wildlife';
import {faunaRecipes,faunaParameters} from './atlas-fauna';
import {careRecipes,careParameters} from './atlas-care';
import {serviceRecipes,serviceParameters} from './atlas-service';
import {heldRecipes,heldParameters} from './atlas-held';
import {attireRecipes,attireParameters} from './atlas-attire';
import {costumeRecipes,costumeParameters} from './atlas-costumes';
import {garmentRecipes,garmentParameters} from './atlas-garments';
import {wearableRecipes,wearableParameters} from './atlas-wearables';
import {headwearRecipes,headwearParameters} from './atlas-headwear';
import {avatarRecipes,avatarParameters} from './atlas-avatar';
import {figureRecipes,figureParameters} from './atlas-figure';
import {characterRecipes,characterParameters} from './atlas-character';
import {landscapeRecipes,landscapeParameters} from './atlas-landscape';
import {groundscapeRecipes,groundscapeParameters} from './atlas-groundscape';
import {ecologyRecipes,ecologyParameters} from './atlas-ecology';
import {hydrologyRecipes,hydrologyParameters} from './atlas-hydrology';
import {environmentRecipes,environmentParameters} from './atlas-terrain';
import {readFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import type {Project} from '../core/types';
import {lifeRecipes} from './life';
import {lifeLayouts,layoutDependencies} from './layouts';
import {readAtlasProduction} from './atlas';
import {atlasLifeRecipes,atlasSource} from './atlas-life';
import {atlasBuiltRecipes,builtWidthParameter} from './atlas-built';

export type LibraryEntry={id:string;primaryMasterId?:string;name:string;type:string;stage:'geometry-candidate'|'layout-candidate'|'variant-candidate'|'not-produced';file?:string;assetIds:string[];assemblyId?:string;voxels?:number;triangles?:number;sha256?:string;note:string};
export type ProductionIndex={format:'yunshan.production-index';version:1;createdAt:string;sourceSHA256:string;counts:Record<string,number>;entries:LibraryEntry[];packs:{file:string;name:string;entries:number;uniqueMasters:number}[];studies?:{id:string;name:string;file:string;assetIds:string[];note:string;group?:string}[];metrics:Record<string,unknown>};
const page=<T>(rows:T[],args:any)=>{const offset=args.offset??0,limit=args.limit??24;return{total:rows.length,offset,entries:rows.slice(offset,offset+limit),nextOffset:offset+limit<rows.length?offset+limit:null};};
export async function readProductionLibrary(root:string,args:any){
 const read=async(filename:string)=>{const file=path.join(root,filename);try{const stat=await lstat(file);if(stat.isSymbolicLink()||stat.size>8_000_000)throw new Error('制作索引无效');return JSON.parse(await readFile(file,'utf8'));}catch(e:any){if(e.code==='ENOENT')return null;throw e;}};
 const [stored,architecture,finishes,atlas]=await Promise.all([read('production-index.json'),read('architecture-index.json'),read('material-index.json'),readAtlasProduction(root)]);
 if(!stored&&!architecture&&!finishes)return{available:false,total:0,entries:[],packs:[],counts:{},nextOffset:null};
 const index:ProductionIndex=stored??{format:'yunshan.production-index',version:1,createdAt:(architecture??finishes).createdAt,sourceSHA256:'',counts:{catalogEntries:0,baseModels:0,assemblies:0,variantEntries:0,notProduced:0,accepted:0},entries:[],packs:[],metrics:{}};
 if(index.format!=='yunshan.production-index'||index.version!==1||!Array.isArray(index.entries))throw new Error('不支持的制作索引');
 if(architecture&&(architecture.format!=='yunshan.architecture-references'||architecture.version!==1||!Array.isArray(architecture.studies)))throw new Error('不支持的建筑图鉴索引');
 if(finishes&&(finishes.format!=='yunshan.material-studies'||finishes.version!==1||!Array.isArray(finishes.studies)))throw new Error('不支持的材质试作索引');
 if(atlas)for(const upgrade of atlas.entries){
  const row=index.entries.find(e=>e.id===upgrade.id);if(!row)continue;
  const assembly=upgrade.kind==='assembly',primary=assembly?undefined:upgrade.primaryMasterId;
  if(primary&&!atlas.entries.some(e=>e.id===primary&&e.kind!=='assembly'&&!e.primaryMasterId))throw new Error('共享主母版必须引用已有独立图册资产');
  if(assembly&&row.type!=='组合模板'||!assembly&&row.type!=='基础组件')throw new Error('图册制作类型与清单不一致');
  if(row.stage==='not-produced'){
   if(assembly)index.counts.assemblies=(index.counts.assemblies??0)+1;
   else if(!primary)index.counts.baseModels=(index.counts.baseModels??0)+1;
   index.counts.generatedEntries=(index.counts.generatedEntries??0)+1;index.counts.notProduced=Math.max(0,(index.counts.notProduced??0)-1);
  }
  Object.assign(row,{...(primary?{primaryMasterId:primary}:{}),stage:assembly?'layout-candidate':'geometry-candidate',file:upgrade.file,assetIds:assembly?upgrade.assetIds:[upgrade.assetId],...(assembly?{assemblyId:upgrade.assemblyId}:{}),voxels:upgrade.voxels,triangles:upgrade.triangles,sha256:upgrade.sha256,note:upgrade.note});
 }
 const q=String(args.query??'').toLowerCase(),rows=index.entries.filter(e=>(!args.generatedOnly||e.stage!=='not-produced')&&(!q||(e.id+' '+e.name+' '+e.type).toLowerCase().includes(q)));
 const architectureStudies=(architecture?.studies??[]).sort((a:any,b:any)=>(a.assetIds.length>1?0:1)-(b.assetIds.length>1?0:1)||a.id.localeCompare(b.id));
 const materialStudies=(finishes?.studies??[]).sort((a:any,b:any)=>Number(b.id.includes('gallery'))-Number(a.id.includes('gallery'))||a.id.localeCompare(b.id));
 return{available:true,createdAt:index.createdAt,sourceSHA256:index.sourceSHA256,counts:{...index.counts,referenceDesigns:architecture?.counts.designs??0,materialStudies:finishes?.counts.designs??0,atlasReferenceCandidates:atlas?.entries.length??0,atlasSharedMasterReferences:atlas?.entries.filter(e=>e.kind!=='assembly'&&!!e.primaryMasterId).length??0,atlasUniqueMasters:new Set(atlas?.entries.filter(e=>e.kind!=='assembly').map(e=>e.primaryMasterId??e.id)??[]).size,atlasAssemblyCandidates:atlas?.entries.filter(e=>e.kind==='assembly').length??0},packs:index.packs,studies:[...(atlas?.studies??[]),...materialStudies,...architectureStudies,...(index.studies??[]).map(s=>({...s,group:s.group??'家居十二件'}))],notice:'生成时的候选记录；已有模型按图升级不重复计数，原清单中首次建模的独立母版计入基础模型数；共享主母版引用完成参考条目但不增加几何母版数；组合按真实模板计数，组件派生和重复实例不新增基础母版。当前打开项目的改动、人工验收与游戏运行验证需另查。',...page(rows,args)};
}
export function productionRecipes(p:Project,args:any){
 const q=String(args.query??'').toLowerCase(),models:(Record<string,unknown>&{id:string;name:string})[]=Object.entries(lifeRecipes).map(([n,r])=>{const id='LIFE-'+n.padStart(3,'0');return{id,kind:'base',name:p.catalog?.entries[id]?.source['中文名称']??id,dimensionsM:r.size,cellSizeM:r.pitch,features:r.features,...(atlasLifeRecipes[Number(n)]?{recipeRevision:3,reference:atlasSource(id),limitations:atlasLifeRecipes[Number(n)].limits}:{}),parameters:[1,2,3,4,10,11,14,15,16].includes(Number(n))?{width:{minimum:r.size[0]*.75,maximum:r.size[0]*1.5,default:r.size[0],unit:'metres'}}:{}};});
 for(const[id,r]of Object.entries(atlasBuiltRecipes))models.push({id,kind:'base',name:p.catalog?.entries[id]?.source['中文名称']??id,dimensionsM:r.size,cellSizeM:r.pitch,features:r.features,recipeRevision:3,reference:atlasSource(id),limitations:r.limits,parameters:builtWidthParameter(id)});
 for(const[id,r]of Object.entries({...environmentRecipes,...hydrologyRecipes,...ecologyRecipes,...groundscapeRecipes,...landscapeRecipes,...characterRecipes,...figureRecipes,...avatarRecipes,...headwearRecipes,...wearableRecipes,...garmentRecipes,...costumeRecipes,...attireRecipes,...heldRecipes,...serviceRecipes,...careRecipes,...faunaRecipes,...wildlifeRecipes}))models.push({id,kind:(r as {primaryMasterId?:string}).primaryMasterId?'shared-master':'base',...((r as {primaryMasterId?:string}).primaryMasterId?{primaryMasterId:(r as {primaryMasterId?:string}).primaryMasterId}:{}),name:p.catalog?.entries[id]?.source['中文名称']??id,dimensionsM:r.size,cellSizeM:r.pitch,features:r.features,recipeRevision:wildlifeRecipes[id]||faunaRecipes[id]||careRecipes[id]||serviceRecipes[id]||heldRecipes[id]||attireRecipes[id]||costumeRecipes[id]||garmentRecipes[id]||wearableRecipes[id]||headwearRecipes[id]||avatarRecipes[id]||figureRecipes[id]?1:3,reference:atlasSource(id),limitations:r.limits,parameters:wildlifeRecipes[id]?wildlifeParameters(id):faunaRecipes[id]?faunaParameters(id):careRecipes[id]?careParameters(id):serviceRecipes[id]?serviceParameters(id):heldRecipes[id]?heldParameters(id):attireRecipes[id]?attireParameters(id):costumeRecipes[id]?costumeParameters(id):garmentRecipes[id]?garmentParameters(id):wearableRecipes[id]?wearableParameters(id):headwearRecipes[id]?headwearParameters(id):avatarRecipes[id]?avatarParameters(id):figureRecipes[id]?figureParameters(id):characterRecipes[id]?characterParameters(id):landscapeRecipes[id]?landscapeParameters(id):groundscapeRecipes[id]?groundscapeParameters(id):ecologyRecipes[id]?ecologyParameters(id):hydrologyRecipes[id]?hydrologyParameters(id):environmentParameters(id)});
 const layouts=Object.keys(lifeLayouts).filter(n=>!architectureAssemblyIds.includes('LIFE-'+n.padStart(3,'0'))).map(n=>{const id='LIFE-'+n.padStart(3,'0');return{id,kind:'assembly',name:p.catalog?.entries[id]?.source['中文名称']??id,dependencies:layoutDependencies(Number(n)),instances:lifeLayouts[Number(n)].length};});
 const architectureLayouts=architectureAssemblyIds.map(id=>({id,kind:'assembly',name:p.catalog?.entries[id]?.source['中文名称']??id,parameters:architectureAssemblyParameters(id),geometryAuthority:'Separate reusable components and actual instances',originalRuntimeBound:false}));
 const rows=[...models,...layouts,...architectureLayouts].filter(e=>!q||(e.id+' '+e.name).toLowerCase().includes(q)).sort((a,b)=>a.id.localeCompare(b.id));
 return{units:'metres',upAxis:'Y',geometryStage:'candidate',runtimeIntegration:false,...page(rows,args)};
}
