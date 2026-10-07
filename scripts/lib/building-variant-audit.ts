import {Box3,Vector3} from 'three';
import {architectureComponents,architectureClosed} from './architecture-audit';
import {auditShape,inside,type Shape} from './mesh-audit';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {assetBoundsM,geometryData} from '../../src/core/sky';
import {displayMesh} from '../../src/core/mesh';
import {rotateY,type Project,type Assembly,type V3} from '../../src/core/types';
import {outfitHash} from '../../src/production/outfit-components';

export function auditBuildingVariant(p:Project,a:Assembly){
 const detail=a.source!.buildingVariant as any,cache=new Map<string,Shape[]>(),bounds=new Map<string,Box3>();
 for(const id of new Set(a.instances.map(i=>i.assetId))){const asset=p.assets[id],b=assetBoundsM(asset)!;bounds.set(id,new Box3(new Vector3(...b.min),new Vector3(...b.max)));}
 const shapes=(id:string)=>{if(!cache.has(id)){const asset=p.assets[id],parts=asset.meshes?.length?architectureComponents(asset):displayMesh(asset,p.materials);cache.set(id,parts.filter(m=>p.materials[m.material].solid).map(m=>auditShape('name'in m?m.name:id+'-'+m.material,m.positions,m.indices)));}return cache.get(id)!;};
 const local=(point:V3,instance:typeof a.instances[number])=>rotateY(point.map((v,k)=>v-instance.position[k])as V3,(4-instance.rotation)%4);
 const support=(point:V3,allowed?:Set<string>)=>a.instances.filter(i=>{if(allowed&&!allowed.has(i.id))return false;const q=new Vector3(...local(point,i));return bounds.get(i.assetId)!.distanceToPoint(q)<=1e-8&&shapes(i.assetId).some(s=>s.box.distanceToPoint(q)<=1e-8&&(inside(q,s)||s.ts.some(t=>t.closestPointToPoint(q,new Vector3()).distanceToSquared(q)<=1e-16)));}).map(i=>i.id);
 const clear=(point:V3,name:string)=>{
  const min:V3=[point[0]-.24,point[1]+.25,point[2]-.16],max:V3=[point[0]+.24,point[1]+1.9,point[2]+.16],blocked:string[]=[];
  for(const i of a.instances){const box=new Box3().setFromPoints([min,max,[min[0],min[1],max[2]],[max[0],max[1],min[2]]].map(q=>new Vector3(...local(q as V3,i))));if(!box.intersectsBox(bounds.get(i.assetId)!))continue;for(const s of shapes(i.assetId)){if(box.intersectsBox(s.box)&&(s.ts.some(t=>box.intersectsTriangle(t))||inside(box.getCenter(new Vector3()),s)))blocked.push(i.id+':'+s.name);}}
  return{name,point,clear:blocked.length===0,blocked};
 };
 const routes=detail.stairRoutes.flatMap((r:any)=>r.points.map((point:V3,k:number)=>({level:r.level,index:k,point,support:support([point[0],point[1]-.01,point[2]]),clearance:clear(point,'stair-'+r.level+'-'+k)})));
 const floors=detail.levels.flatMap((cells:[number,number][],level:number)=>cells.map(([x,z])=>{const[w,d]=detail.cellDimensionsM,point:V3=[(x+.5)*w,detail.levelTopsM[level],(z===0&&x===detail.coreCell[0])?0.7:(z+.5)*d];return{level,cell:[x,z],point,bearingProbeDepthM:.025,support:support([point[0],point[1]-.025,point[2]])};}));
 const links:any[]=[];const[w,d]=detail.cellDimensionsM,origin=detail.coreCell[0]*w;
 const segment=(from:V3,to:V3,name:string)=>{const count=Math.max(1,Math.ceil(Math.hypot(...to.map((v,k)=>v-from[k]))/.2));for(let k=0;k<=count;k++){const point=from.map((v,j)=>v+(to[j]-v)*k/count)as V3;links.push({name,point,support:support([point[0],point[1]-.025,point[2]]),clearance:clear(point,name+'-'+k)});}};
 for(let level=1;level<detail.floors;level++){
  const y=detail.levelTopsM[level],x=origin+(w+3.64)/2;
  segment([origin+3,y,.7],[x,y,.7],'upper-landing-'+level);segment([x,y,.7],[x,y,d+.4],'upper-wing-link-'+level);
 }
 const components=[...new Set(a.instances.map(i=>i.assetId))].filter(id=>!Object.hasOwn(detail.parentSourceGeometryHashes,id)).map(id=>({id,closed:architectureClosed(p.assets[id]),native:nativeIslandAttachments({...p.assets[id],meshes:architectureComponents(p.assets[id])})}));
 const groups=a.source!.instanceGroups as Record<string,string>,floorIds=new Set(a.instances.filter(i=>['ground-floor','upper-floor'].includes(groups[i.id])).map(i=>i.id)),frameIds=new Set(a.instances.filter(i=>['frame','facade'].includes(groups[i.id])).map(i=>i.id));
 const columns=a.instances.filter(i=>groups[i.id]==='frame').map(i=>{const points=[[-.08,-.025,-.08],[.08,-.025,-.08],[-.08,-.025,.08],[.08,-.025,.08]].map(q=>q.map((v,k)=>v+i.position[k])as V3),contacts=points.flatMap(q=>support(q,floorIds));return{instance:i.id,points,contacts:[...new Set(contacts)]};});
 const roofs=a.instances.filter(i=>groups[i.id]==='roof'&&i.assetId.startsWith('architecture-roof-')).map(i=>{const s=p.assets[i.assetId].source!.parameters as any,points=((s.bearingProbePoints??[[.2,-.15,.1],[s.w-.2,-.15,s.d-.1]])as V3[]).map(q=>rotateY(q,i.rotation).map((v,k)=>v+i.position[k])as V3),contacts=points.map(q=>support(q,frameIds));return{instance:i.id,points,contacts,supported:points.length>0&&contacts.every(c=>c.length>0)};});
 const sources=Object.entries(detail.parentSourceGeometryHashes).map(([id,sha])=>({id,unchanged:outfitHash(geometryData(p.assets[id]))===sha}));
 return{routes,links,floors,components,columns,roofs,sources,bodyEnvelope:{widthM:.48,depthM:.32,bottomAboveFootM:.25,topAboveFootM:1.9,scope:'Finite upper-body envelope, with actual tread support checked independently; not a full articulated gait.'},passed:[...routes,...links].every((r:any)=>r.support.length&&r.clearance.clear)&&floors.every((r:any)=>r.support.length)&&columns.every(c=>c.contacts.length>0)&&roofs.every(r=>r.supported)&&components.every(c=>c.closed.length>0&&c.closed.every(x=>x.closed&&x.oriented)&&c.native.every(x=>x.attached))&&sources.every(s=>s.unchanged)};
}
