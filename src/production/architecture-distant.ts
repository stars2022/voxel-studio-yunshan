import {createHash} from 'node:crypto';
import type {Asset,Assembly,Project,V3} from '../core/types';
import {rotateY} from '../core/types';
import {displayMesh} from '../core/mesh';
import {emptyMesh,mergeMeshes} from './mesh-shapes';
import type {AuthoredMesh} from '../core/authored-mesh';
import {geometryData,assetBoundsM} from '../core/sky';
import {ArchitectureBuilder,nearArchitecture} from './architecture-near-assembly';
import {architectureFamilies} from './architecture-plans';
import links from './atlas-links.json';
const familyCache=new Map<string,Asset[]>();
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const architectureDistantRoles:Record<string,string>={wall:'distantMasonry',stone:'distantStone',wood:'distantTimber',woodEdge:'distantTimberEdge',roof:'distantRoofTile',metal:'distantFrame',trim:'distantFrame',bronze:'distantBronze',glass:'distantGlazing',facadeFrame:'distantGlazingFrame',structuralConcrete:'distantConcrete',mortar:'distantMortar',waterproofMembrane:'distantMembrane',energy:'distantLamp',warm:'distantLamp',architecturePin:'distantFastener'};
/** Display derivative from real assembly instances: no new base master, no coarse solid infill. */
export function bakeDistantArchitecture(p:Project,assembly:Assembly,id:string):Asset{
 const sourceRoles=p.styles.yunshan,remap=new Map(Object.entries(architectureDistantRoles).map(([a,b])=>[sourceRoles[a],sourceRoles[b]])),meshes:AuthoredMesh[]=[],sources:Record<string,unknown>[]=[],groups=assembly.source!.instanceGroups as Record<string,string>;
 for(const i of assembly.instances){if(groups[i.id]==='fixture')continue;const a=p.assets[i.assetId];sources.push({instanceId:i.id,assetId:a.id,position:i.position,rotation:i.rotation,geometrySHA256:hash(geometryData(a))});
  for(const bucket of displayMesh(a,p.materials,'far')){
   const material=remap.get(bucket.material);if(!material)throw new Error('远景未声明用途映射 '+bucket.material);const m=emptyMesh(i.id+'-'+(bucket.meshName??bucket.material),material,false);
   for(let j=0;j<bucket.positions.length;j+=3){const v=rotateY(bucket.positions.slice(j,j+3) as V3,i.rotation),n=rotateY(bucket.normals.slice(j,j+3) as V3,i.rotation);m.positions.push(...v.map((v,d)=>Math.round((v+i.position[d])*1e9)/1e9||0));m.normals.push(...n.map(v=>v||0));}
   m.indices=[...bucket.indices];m.uvs=[...bucket.uvs];meshes.push(m);
  }
 }
 const buckets=new Map<number,AuthoredMesh[]>();for(const m of meshes){const g=buckets.get(m.material)??[];g.push(m);buckets.set(m.material,g);}
 const merged=[...buckets].map(([material,items])=>mergeMeshes('distant-material-'+material,items));
 return{id,name:assembly.name+' · 明确非碰撞远景',version:1,category:'import',cellSize:.02,origin:[0,0,0],chunks:{},parts:[],ports:[],openings:[],meshes:merged,source:{kind:'assembly-distant-display',notCatalogMaster:true,sourceAssemblyCatalogId:assembly.source!.catalogId,sourceParameters:assembly.source!.parameters,sourceAssemblySHA256:hash({assets:sources,instances:assembly.instances}),sourceInstances:sources,floorPlan:assembly.source!.floorPlan,courtOpenings:assembly.source!.courtOpenings,sourceMasterIds:assembly.source!.dependencies,roleMapping:architectureDistantRoles,physical:false,method:'Exact native face tessellation and continuous meshes transformed from the real assembly. Adjacent native coplanar faces may merge; furniture omitted. Courtyards and stairwells are never filled.',originalRuntimeBound:false,automaticDistanceLOD:false}};
}

export function distantFamilyAssets(p:Project){
 const key=JSON.stringify([p.styles.yunshan,architectureFamilies.map(id=>p.catalog?.entries[id]?.source['中文名称'])]);const cached=familyCache.get(key);
 if(cached){for(const a of cached){if(p.assets[a.id]&&hash(geometryData(p.assets[a.id]))!==hash(geometryData(a)))throw new Error('远景组件已编辑 '+a.id);p.assets[a.id]??=structuredClone(a);}return cached.map(a=>a.id);}
 const ids=architectureFamilies.map(catalogId=>{
  const id='distant-'+catalogId.toLowerCase();if(p.assets[id]){if(p.assets[id].source?.kind!=='assembly-distant-display')throw new Error('远景ID已占用');return id;}
  const temporary:Project={...p,assets:{},instances:{},assemblies:{},selection:{assetId:null,region:null,partId:null}},a=nearArchitecture(temporary,catalogId,'source-'+catalogId.toLowerCase(),p.catalog?.entries[catalogId]?.source['中文名称']??catalogId);
  p.assets[id]=bakeDistantArchitecture(temporary,a,id);return id;
 });
 familyCache.set(key,ids.map(id=>structuredClone(p.assets[id])));if(familyCache.size>2)familyCache.delete(familyCache.keys().next().value!);return ids;
}
export function distantArchitecture(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}):Assembly{
 const assets=distantFamilyAssets(p),instances:Assembly['instances']=[],placements:Record<string,unknown>[]=[],put=(assetId:string,position:V3,rotation:number,detail:Record<string,unknown>)=>{const instanceId=id+'-'+instances.length;instances.push({id:instanceId,assetId,name:p.assets[assetId].name,position,rotation,parent:null});placements.push({instanceId,...detail});};
 if(catalogId==='BUILT-040')for(let j=0;j<6;j++)put(assets[j],[(j%3)*30,Math.floor(j/3)*3.2,Math.floor(j/3)*30],0,{family:architectureFamilies[j],authorDisplayTerrace:true});
 else{
  const seed=Number(params.layoutSeed??7);let state=seed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  // Four quarters, each with six ring sites. Explicit metre-space exclusion inputs are retained.
  const exclusion=[{name:'author river corridor',min:[-18,-1,-500],max:[18,20,500]},{name:'author station approach',min:[-58,-1,-40],max:[58,20,40]}];
  for(let quarter=0;quarter<4;quarter++)for(let within=0;within<6;within++){
   const radius=88+64*quarter,base=quarter*Math.PI/2+within*Math.PI/3+(random()-.5)*.12;let chosen:V3|undefined,heading=0,attempts=0;
   for(;attempts<24;attempts++){const theta=base+attempts*.09,position:V3=[Math.round(Math.cos(theta)*radius*100)/100,0,Math.round(Math.sin(theta)*radius*100)/100],assetId=assets[(quarter+within)%6],bb=assetBoundsM(p.assets[assetId])!,q=Math.round((theta+Math.PI/2)/(Math.PI/2))%4;
    const corners=[bb.min,bb.max,[bb.min[0],bb.min[1],bb.max[2]],[bb.max[0],bb.max[1],bb.min[2]]].map(v=>rotateY(v as V3,q).map((n,d)=>n+position[d]));const min=[0,1,2].map(d=>Math.min(...corners.map(v=>v[d]))),max=[0,1,2].map(d=>Math.max(...corners.map(v=>v[d])));
    const blocked=exclusion.some(e=>min[0]<e.max[0]&&max[0]>e.min[0]&&min[2]<e.max[2]&&max[2]>e.min[2])||placements.some((e:any)=>e.bounds&&min[0]<e.bounds.max[0]+4&&max[0]>e.bounds.min[0]-4&&min[2]<e.bounds.max[2]+4&&max[2]>e.bounds.min[2]-4);
    if(!blocked){chosen=position;heading=q;put(assetId,chosen,heading,{quarter,within,radius,angle:theta,attempts,seed,family:architectureFamilies[(quarter+within)%6],bounds:{min,max},authorSite:true});break;}
   }
   if(!chosen)throw new Error('作者环式示例无法满足排除区');
   random(); // Saved deterministic sequence, no dependency on Math.random or original world seeds.
  }
  return{id,name,version:1,instances,source:{kind:'catalog-assembly',catalogId,recipeRevision:1,reference:(links as Record<string,unknown>)[catalogId],parameters:{layoutSeed:seed},dependencies:architectureFamilies,placements,exclusion,quarters:4,sitesPerQuarter:6,radiusRule:'88 + 64 * quarter metres',sourceSeedState:state,physical:false,originalRuntimeBound:false,scope:'Explicit author ring study. Original world coordinates/seed algorithm/doors/rivers/stations absent; these positions are not claimed to reproduce or preserve original seed results. No street-wall/CBD claim.'}};
 }
 return{id,name,version:1,instances,source:{kind:'catalog-assembly',catalogId,recipeRevision:1,reference:(links as Record<string,unknown>)[catalogId],parameters:{},dependencies:architectureFamilies,placements,physical:false,originalRuntimeBound:false,scope:'Six real author floor-plan families, derived exact structural display geometry. No collision and no automatic distance switching. The raised rear row is a display transform, not integrated mountain terrain.'}};
}
