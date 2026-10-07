import type {Asset,Assembly,Project} from '../core/types';
import {geometryData} from '../core/sky';
import {displayMesh} from '../core/mesh';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {makeArchitectureAssembly} from './atlas-architecture-assemblies';
import {careParameters} from './atlas-care';
import {faunaParameters} from './atlas-fauna';
import {wildlifeParameters} from './atlas-wildlife';
import {outfitHash as hash} from './outfit-components';
import {assemblyBoundsM} from './assembly-geometry';
import {lodVariantSpec} from './lod-variant-spec';
import {reduceAsset} from './mesh-lod';

export function defaultAnimalParameters(id:string){const n=Number(id.slice(-3)),defs=n<=307?careParameters(id):n<=319?faunaParameters(id):wildlifeParameters(id);return Object.fromEntries(Object.entries(defs).map(([k,p])=>[k,p.default]));}
export const lodAssemblyIdentity=(p:Project,a:Assembly)=>hash(a.instances.map(i=>({geometry:geometryData(p.assets[i.assetId]),origin:p.assets[i.assetId].origin,cellSize:p.assets[i.assetId].cellSize,parts:p.assets[i.assetId].parts,ports:p.assets[i.assetId].ports,openings:p.assets[i.assetId].openings,position:i.position,rotation:i.rotation})));
const cache=new Map<string,Asset>();
export function makeLodVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=lodVariantSpec(catalogId,input),b=new ArchitectureBuilder(p,id),human=['human','child'].includes(spec.family),primaryParams=human?{extremities:'sockets'}:defaultAnimalParameters(spec.parentCatalogId),primary=b.original(spec.parentCatalogId,primaryParams),parents:any[]=[{kind:'base',catalogId:spec.parentCatalogId,parameters:primaryParams,assetId:primary,geometrySHA256:hash(geometryData(p.assets[primary]))}];let near:Assembly;
 if(human){near=makeArchitectureAssembly(p,spec.sourceCatalogId,'lod-near-'+spec.sourceCatalogId.toLowerCase(),'保留近景 '+spec.sourceCatalogId);b.dependencies.add(spec.sourceCatalogId);for(const dep of near.source!.dependencies as string[])b.dependencies.add(dep);parents.push({kind:'assembly',catalogId:spec.sourceCatalogId,parameters:{},definition:structuredClone(near),identitySHA256:lodAssemblyIdentity(p,near)});}
 else{const params=defaultAnimalParameters(spec.sourceCatalogId),source=b.original(spec.sourceCatalogId,params),builder=new ArchitectureBuilder(p,'lod-near-'+spec.sourceCatalogId.toLowerCase());builder.place(source,[0,0,0],0,'animal');near=builder.finish(spec.sourceCatalogId,'保留近景 '+spec.sourceCatalogId,{physical:false});if(source!==primary)parents.push({kind:'base',catalogId:spec.sourceCatalogId,parameters:params,assetId:source,geometrySHA256:hash(geometryData(p.assets[source]))});}
 const bounds=assemblyBoundsM(p,near),span=Math.max(...bounds.max.map((v,k)=>v-bounds.min[k])),tolerance=spec.level==='near'?0:Math.max(.0005,Math.min(.03,span*(spec.level==='middle'?.005:.018))),sources=[];
 for(const i of near.instances){const old=p.assets[i.assetId],sourceHash=hash(geometryData(old));let installed=i.assetId;
  if(spec.level!=='near'){
   const key=hash([old.id,sourceHash,spec.level,tolerance]);installed=b.asset('lod-'+spec.level+'-'+key.slice(0,24),aid=>{let a=cache.get(key);if(!a){a=reduceAsset(old,aid,spec.level as'middle'|'far',tolerance);cache.set(key,a);if(cache.size>128)cache.delete(cache.keys().next().value!);}return{...structuredClone(a),id:aid};});
   if(p.assets[installed].source!.sourceAssetId!==old.id||p.assets[installed].source!.sourceGeometrySHA256!==sourceHash)throw new Error('LOD派生组件被不兼容内容占用');
  }
  const instance=b.place(installed,i.position,i.rotation,'lod',i.name);sources.push({sourceInstance:structuredClone(i),sourceAssetId:i.assetId,installedAssetId:installed,instance,sourceGeometrySHA256:sourceHash});
 }
 const count=(a:Assembly)=>a.instances.reduce((s,i)=>s+displayMesh(p.assets[i.assetId],p.materials).reduce((n,m)=>n+m.indices.length/3,0),0),nearTriangles=count(near),levelTriangles=count({instances:b.instances}as Assembly);
 if(spec.level!=='near'&&levelTriangles>=nearTriangles)throw new Error('LOD没有实际减少三角面');
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:'base',parameters:spec.parameters,physical:false,notCatalogBase:true,lodVariant:{family:spec.family,level:spec.level,sourceCatalogId:spec.sourceCatalogId,parents,nearDefinition:near,nearIdentitySHA256:lodAssemblyIdentity(p,near),sources,nearBoundsM:bounds,toleranceM:tolerance,nearTriangles,levelTriangles,ratio:levelTriangles/nearTriangles,nativeMinimumComponentsRetained:true,rigAndSocketsRetained:true,samePositionOrientationAndIdentity:true,automaticDistanceSelection:false,boneUpdateRateBound:false,originalStateReadOrWritten:false,scope:'Finite manual near/middle/far derivatives of the complete actual near source. Closed component edge collapse with measured vertex-map error bounds, original bind/posed boundary planes, rigid native details and complete original parents. No new actors/species or original runtime distance,animation,ownership or ecology binding; not final art acceptance.'}});
}
