import type {Asset,Project,V3} from '../core/types';
import {Grid} from '../core/grid';
import {assetBoundsM,geometryData} from '../core/sky';
import {ArchitectureBuilder,roofArchitecture} from './architecture-near-assembly';
import {ArchitectureComponent,architectureColumn} from './architecture-components';
import {fittedUpperRoof} from './roof-upper-fixture';
import {architectureDistantRoles} from './architecture-distant';
import {variantFloor} from './building-variant-components';
import {continuousGable} from './roof-variant-gable';
import {sampledHip} from './roof-variant-sampling';
import {piercedHip,type PlanHole} from './roof-variant-hole';
import {wallPurpose,type WallPurposeTone} from './wall-purpose-variant';
import {roofWallVariantSpec} from './roof-wall-variant-spec';
import {outfitHash} from './outfit-components';

function remapComponent(p:Project,parent:Asset,id:string,far:boolean,floor:boolean){
 const a=structuredClone(parent),roles=p.styles.yunshan;
 const map=far?new Map(Object.entries(architectureDistantRoles).map(([from,to])=>[roles[from],roles[to]])):new Map<number,number>();
 if(floor)map.set(roles.wall,roles[far?'distantStone':'stone']);
 const material=(id:number)=>{const target=map.get(id);if(far&&!target)throw new Error('未声明远景实际材质用途 '+id);if(target&&!p.materials[target])throw new Error('缺失派生材质 '+target);if(far&&p.materials[target!].solid)throw new Error('远景显示用途必须非碰撞');return target??id;};
 const g=new Grid();for(const[v,m]of new Grid(a.chunks).cells())g.set(v,material(m));a.chunks=g.serialize();
 for(const m of a.meshes??[]){m.material=material(m.material);if(far)m.collision=false;}
 for(const r of (a.source!.componentIndexRanges??[])as {material:number}[])r.material=material(r.material);
 a.id=id;a.source={...a.source,kind:'assembly-derived-component',notCatalogMaster:true,sourceAssetId:parent.id,sourceGeometrySHA256:outfitHash(geometryData(parent)),materialDerivation:{mapping:Object.fromEntries(map),floorPavingPurpose:floor?'stone':null,geometryChanged:false},...(far?{physical:false,automaticDistanceLOD:false}:{} )};
 delete a.source.catalogId;return a;
}

/** The wall body supplies the measured footprint, independently of its oversailing roof. */
function upperBody(p:Project,id:string,w:number,d:number){
 const b=new ArchitectureComponent(p,id,'穿顶上层0.4m实体墙体',['BUILT-004'],{w,d,h:2.6,wallThicknessM:.4,authorFixture:true});
 const panel=(name:string,x:number,y:number,z:number,ww:number,h:number,dd:number)=>b.box(name,'wall',x,y,z,ww,h,dd);
 const side=(w-1.2)/2;
 panel('前墙左垛',0,0,0,side,2.6,.4);panel('前墙右垛',side+1.2,0,0,side,2.6,.4);panel('门上实墙',side,2.2,0,1.2,.4,.4);
 panel('后墙',0,0,d-.4,w,2.6,.4);panel('左墙',0,0,.4,.4,2.6,d-.8);panel('右墙',w-.4,0,.4,.4,2.6,d-.8);
 for(const x of[.12,w-.14])b.pin('上层墙实际定位销','bronze',[x,2.58,.12]);
 const a=b.finish();a.source!.doorM={min:[side,0,0],max:[side+1.2,2.2,.4]};return a;
}

export function makeRoofWallVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=roofWallVariantSpec(catalogId,input),b=new ArchitectureBuilder(p,id);
 const finish=(details:Record<string,unknown>)=>b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:spec.parentKind,parameters:spec.parameters,roofWallVariant:details,originalRuntimeBound:false,notCatalogBase:true});
 if(spec.parentKind==='base'){
  const parentId=b.original(spec.parentCatalogId),parent=p.assets[parentId];let child:string;
  if(catalogId==='BUILT-041'){
   const tone=spec.parameters.wallTone as WallPurposeTone;
   const candidate=wallPurpose(p,parent,'wall-purpose-candidate',tone),material=p.styles['wall-purpose-'+tone].wall;
   child=b.asset('wall-purpose-'+tone+'-'+material,aid=>({...candidate,id:aid}));
  }else{
   const axis=spec.parameters.gableAxis as 'x'|'z';child=b.asset('continuous-gable-'+axis,aid=>continuousGable(p,aid,axis));
  }
  b.place(child,[0,0,0],0,catalogId==='BUILT-041'?'wall':'roof');
  return finish({parentAssetId:parentId,parentGeometrySHA256:outfitHash(geometryData(parent)),derivation:catalogId==='BUILT-041'?'Only the actual wall material is assigned an independent same-purpose authored finish. All original geometry and global wall colors are retained. Exact original RGB and seed mapping unavailable.':'Explicit continuous five-point gable alternative. The entire original native BUILT-011 remains as a separate asset. X/Z swaps positions, normals, ports and native pins with reversed triangle winding.',scope:'Finite author asset variant; original source generator, FloorPlan and controllers are unbound.'});
 }
 const parent=roofArchitecture(p,'BUILT-075','variant-parent-built-075-standard','保留原长脊屋面母版','standard');
 for(const dep of parent.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add('BUILT-075');
 const hashes=Object.fromEntries([...new Set(parent.instances.map(i=>i.assetId))].map(aid=>[aid,outfitHash(geometryData(p.assets[aid]))]));
 const groups=parent.source!.instanceGroups as Record<string,string>,roofInstance=parent.instances.find(i=>groups[i.id]==='roof')!;
 const details:Record<string,unknown>={retainedParentAssembly:parent,parentSourceGeometryHashes:hashes,scope:'Actual standard 075 author parent retained. Original roofHeightAt/programRoof and historic high-eave art FAIL remain unverified; this finite derivative does not assert original runtime integration.'};
 if(catalogId==='BUILT-082'){
  const level=spec.parameters.roofSampling as 'far1'|'far2',bindings:{visualAssetId:string;collisionAssetId:string}[]=[],derivatives=new Map<string,string>();
  for(const i of parent.instances){
   let child=derivatives.get(i.assetId);
   if(!child){
    child=b.asset('roof-far-'+level+'-'+i.assetId,aid=>i.id===roofInstance.id?sampledHip(p,aid,level):remapComponent(p,p.assets[i.assetId],aid,true,i.assetId.includes('floor-')));
    if(i.id===roofInstance.id&&(p.assets[child].source!.nearAuthority as {geometrySHA256:string}).geometrySHA256!==hashes[i.assetId])throw new Error('远景屋面来源与实际父组件不一致');
    derivatives.set(i.assetId,child);bindings.push({visualAssetId:child,collisionAssetId:i.assetId});
   }
   b.place(child,i.position,i.rotation,groups[i.id]);
  }
  const a=finish({...details,sampling:level,physicalAuthorityBindings:bindings,automaticDistanceLOD:false,derivation:'Only the roof surface sampling changes; small near eave timbers that protrude through coarse facets are omitted from far display. Retained parent frame and floor are explicit non-solid display copies. Physical authority remains the complete unchanged near assembly, exported in terrain-authority.json for explicit consumer loading.'});
  a.source!.physicalAuthorityBindings=bindings;a.source!.physical=false;a.source!.automaticDistanceLOD=false;return a;
 }
 const expanded=spec.parameters.upperFootprint==='expanded',w=expanded?6.4:4.8,d=expanded?4:3.2,at=[(12.8-w)/2,4.6,(6.4-d)/2].map(v=>Math.round(v*1e8)/1e8)as V3;
 const body=b.asset('roof-upper-body-'+w+'-'+d,aid=>upperBody(p,aid,w,d)),bounds=assetBoundsM(p.assets[body])!;
 const hole:PlanHole={min:[bounds.min[0]+at[0],bounds.min[2]+at[2]],max:[bounds.max[0]+at[0],bounds.max[2]+at[2]]};
 const lower=b.asset('pierced-hip-'+w+'-'+d,aid=>piercedHip(p,aid,hole));
 if((p.assets[lower].source!.retainedOriginalRoof as {geometrySHA256:string}).geometrySHA256!==hashes[roofInstance.assetId])throw new Error('穿孔屋面来源与实际父组件不一致');
 for(const i of parent.instances){const child=i.id===roofInstance.id?lower:i.assetId.includes('floor-')?b.asset('roof-installed-'+i.assetId,aid=>remapComponent(p,p.assets[i.assetId],aid,false,true)):i.assetId;b.place(child,i.position,i.rotation,groups[i.id]);}
 const support=b.asset('roof-upper-support-3.6',aid=>architectureColumn(p,aid,3.6)),supportInstances:string[]=[];
 for(const x of[at[0]+.3,at[0]+w-.3])for(const z of[at[2]+.3,at[2]+d-.3])supportInstances.push(b.place(support,[x,.2,z],0,'upper-support'));
 const plinth=b.asset('roof-upper-plinth-'+w+'-'+d,aid=>{const c=new ArchitectureComponent(p,aid,'穿顶上层实际承台',['BUILT-003'],{w,d,h:.6});c.box('连续混凝土承台','structuralConcrete',0,0,0,w,.6,d);return c.finish();});
 b.place(plinth,[at[0],3.8,at[2]],0,'upper-plinth');
 const floor=b.asset('roof-upper-floor-'+w+'-'+d,aid=>variantFloor(p,aid,w,d));b.place(floor,[at[0],4.4,at[2]],0,'upper-floor');
 const bodyInstance=b.place(body,at,0,'upper-body'),upper=b.asset('roof-upper-hip-'+w+'-'+d,aid=>fittedUpperRoof(p,aid,w,d));b.place(upper,[at[0],7.34,at[2]],0,'upper-roof');
 return finish({...details,measuredUpperFootprintM:hole,upperBodyInstance:bodyInstance,upperSupportInstances:supportInstances,roofInstance:b.instances.find(i=>i.assetId===lower)!.id,upperBodyGeometrySHA256:outfitHash(geometryData(p.assets[body])),upperDoorM:p.assets[body].source!.doorM,derivation:'Actual upper wall mesh bounds cut every lower roof layer and split the lower long ridge. The height profile is explicitly resampled at the new hole boundary. Added columns, plinth and floor support the upper fixture. Original parent and complete unperforated roof remain retained.',accessScope:'Roof penetration and support fixture only. Upper doorway is geometrically open; no stairs, access route, original FloorPlan or controller is claimed.'});
}
