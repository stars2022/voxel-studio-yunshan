import type {Asset,Project,V3} from '../core/types';
import {rotateY} from '../core/types';
import {displayMesh} from '../core/mesh';
import {geometryData} from '../core/sky';
import type {AuthoredMesh} from '../core/authored-mesh';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {makeCommunityAssembly} from './community-assemblies';
import {outfitHash} from './outfit-components';
import {emptyMesh,roundLoft,type Ring} from './mesh-shapes';
import {garmentFrame} from './garment-shapes';

/** A finite distant view of the actual detailed resident; the near sources remain authoritative. */
export function makeDistantResident(p:Project,id:string,name:string){
 const near=makeCommunityAssembly(p,'CHAR-001','m057-retained-near-source','原站姿近景居民'),b=new ArchitectureBuilder(p,id),sources:any[]=[],omitted:any[]=[],meshes:AuthoredMesh[]=[],kept:any[]=[];
 const transform=(mesh:AuthoredMesh,at:V3,q:number)=>{for(let j=0;j<mesh.positions.length;j+=3){const point=rotateY(mesh.positions.slice(j,j+3)as V3,q),normal=rotateY(mesh.normals.slice(j,j+3)as V3,q);mesh.positions.splice(j,3,...point.map((v,k)=>v+at[k]));mesh.normals.splice(j,3,...normal);}return mesh;};
 for(const i of near.instances){const a=p.assets[i.assetId],data=displayMesh(a,p.materials),catalogId=String(a.source?.catalogId??''),head=i.name?.includes('成人头'),selected=data.filter(m=>{
  if(!m.meshName)return false;
  if(catalogId==='CHAR-113')return m.meshName==='衣身真实腰腔'||m.meshName.startsWith('衣身独立胸背片')&&!m.meshName.endsWith('独立内衬')||m.meshName.startsWith('肩顶桥片')&&!m.meshName.endsWith('独立内衬')||m.meshName.startsWith('上袖真腔')||m.meshName.startsWith('下袖真腔');
  if(catalogId==='CHAR-118')return m.meshName==='长裤独立开放腰口';
  if(catalogId==='CHAR-121')return m.meshName.startsWith('独立鞋面真内腔')||m.meshName.startsWith('真实橡胶鞋底');
  if(head)return m.meshName.startsWith('独立颅额颧颊下颌')||m.meshName==='颈部插接';
  return false;
 });
  sources.push({instance:i,assetId:a.id,geometrySHA256:outfitHash(geometryData(a))});
  omitted.push({assetId:a.id,meshes:data.filter(m=>!selected.includes(m)).map(m=>m.meshName??'native-details')});
  for(const bucket of selected){const m=emptyMesh('远景-'+bucket.meshName,bucket.material);m.positions=[...bucket.positions];m.normals=[...bucket.normals];m.uvs=[...bucket.uvs];m.indices=[...bucket.indices];meshes.push(transform(m,i.position,i.rotation));kept.push({assetId:a.id,mesh:bucket.meshName,poseBaked:true});}
  if(catalogId==='CHAR-118'){
   const{q,hip,legR,ankle,depth}=garmentFrame('adultA');
   for(const side of[-1,1]){const x=side*q.hipHalfWidthM,rings:Ring[]=[{y:ankle+.025,rx:legR*.88,rz:legR*.98,x},{y:q.kneeYM*.65,rx:legR*.94,rz:legR*1.02,x},{y:q.kneeYM,rx:legR*1.05,rz:legR*1.1,x,z:-.005},{y:hip-(hip-q.kneeYM)*.33,rx:legR*1.17,rz:legR*1.27,x},{y:hip-.004,rx:legR*1.23,rz:depth*1.08,x}];
    meshes.push(transform(roundLoft('远景连续整腿-'+side,p.styles.yunshan.trouserCloth,rings,16),i.position,i.rotation));kept.push({assetId:a.id,replacement:'one whole leg from exact original118 outer ring profile',side,rings,internalKneeCapsRemoved:true,nonphysical:true});
   }
  }
 }
 if(!meshes.some(m=>m.name.includes('颅额')))throw new Error('Distant resident lost the actual near head');
 const nearTriangles=near.instances.reduce((n,i)=>n+displayMesh(p.assets[i.assetId],p.materials).reduce((k,m)=>k+m.indices.length/3,0),0),farTriangles=meshes.reduce((n,m)=>n+m.indices.length/3,0);if(farTriangles>=nearTriangles)throw new Error('Resident distant view did not reduce triangles');
 const assetId=b.asset('outfit-distant-resident-adultA',aid=>({id:aid,name:'原近景居民的连续整腿远景',version:1,category:'import',cellSize:.005,origin:[0,0,0],chunks:{},parts:[],ports:[],openings:[],meshes,source:{kind:'assembly-derived-component',baseCatalogIds:['CHAR-001'],notCatalogMaster:true,sourceAssemblyCatalogId:'CHAR-001',sourceAssemblyDefinition:near,sourceInstances:sources,sourceAssemblySHA256:outfitHash(sources),kept,omitted,nearTriangles,farTriangles,physical:false,automaticDistanceLOD:false,age:'author adultA only',bodyIdentityPreserved:true,method:'Bake actual near standing garment, head and shoe surfaces; omit face, ears, native detail, hands, feet, hair and accessories. Replace two split trouser legs with whole continuous legs from the identical original118 outer profiles. No independent human master or automatic game LOD.'}}as Asset));
 b.place(assetId,[0,0,0],0,'distant-wearer');
 return b.finish('CHAR-016',name,{parameters:{},outfit:{bodyFit:'adultA',pose:'standing',groundY:0,distant:true,nearTriangles,farTriangles,retainedNear:near,sourceIdentity:'CHAR-001',samePositionAndHeading:true},physical:false,originalBaseline:{catalogueState:'already integrated coarse code generation in external citizen-appearance',newDetailedDistanceControllerBound:false},referenceConflict:'M057 first picture shows a detailed wearer and pet, contradicting actual CHAR016 far contract. Follow catalogue simplification and preserve the illustration only as source evidence.',scope:'Author adultA finite distant derivative of actual CHAR001. Original integrated coarse baseline remains recorded; no age/quality/distance simulation binding or human art acceptance.'});
}
