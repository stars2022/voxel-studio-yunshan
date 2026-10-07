import type {Project,V3} from '../core/types';
import {geometryData} from '../core/sky';
import {needsNativeGrid} from '../core/grid-policy';
import {ArchitectureBuilder,nearArchitecture} from './architecture-near-assembly';
import type {BuildingPlan,Cell} from './architecture-plans';
import {architectureColumn} from './architecture-components';
import {buildingVariantSpec} from './building-variant-spec';
import {variantFloor,variantWall,variantStairs,variantCoreFloor,variantFarmRoof,variantMedicalRoof,stairDimensions} from './building-variant-components';
import {outfitHash} from './outfit-components';

export function makeBuildingVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=buildingVariantSpec(catalogId,input),parent=nearArchitecture(p,spec.parentCatalogId,'variant-parent-'+spec.parentCatalogId.toLowerCase()+(spec.parentProgram?'-'+spec.parentProgram:''),'保留原建筑母版',spec.parentProgram),plan=parent.source!.floorPlan as BuildingPlan,b=new ArchitectureBuilder(p,id),w=spec.widthM/plan.nx,d=spec.depthM/plan.nz,h=spec.floorHeightM;
 for(const dep of parent.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add(spec.parentCatalogId);
 const core:Cell=[plan.nx-1,0],key=(c:Cell)=>c.join(','),withCore=(cells:Cell[])=>[...new Map([...cells,core].map(c=>[key(c),c])).values()],lower=withCore(plan.lower),upper=withCore(plan.tallHall||spec.parentProgram==='medical'?plan.lower:plan.upper),levels:Cell[][]=[];
 const parentSources=Object.fromEntries([...new Set(parent.instances.map(i=>i.assetId))].map(a=>[a,outfitHash(geometryData(p.assets[a]))]));
 const floor=b.asset('variant-floor-'+w+'-'+d,aid=>variantFloor(p,aid,w,d)),column=b.asset('variant-column-'+h,aid=>architectureColumn(p,aid,h-.2));
 const baseCells=Array.from({length:plan.nx*plan.nz},(_,i)=>[i%plan.nx,Math.floor(i/plan.nx)]as Cell);
 for(const[x,z]of baseCells)b.place(floor,[x*w,0,z*d],0,'ground-floor');
 const stair=spec.floors>1?b.asset('variant-stair-'+h,aid=>variantStairs(p,aid,h)):null,coreFloor=spec.floors>1?b.asset('variant-core-floor-'+w+'-'+d+'-'+h,aid=>variantCoreFloor(p,aid,w,d,h)):null;
 const stairRoutes:{level:number;points:V3[]}[]=[],floorInstances:string[][]=[],framePoints=new Set<string>();
 for(let level=0;level<spec.floors;level++){
  const cells=level?upper:lower,set=new Set(cells.map(key));levels.push(cells);floorInstances[level]=[];
  if(level)for(const[x,z]of cells)floorInstances[level].push(b.place(key([x,z])===key(core)?coreFloor!:floor,[x*w,level*h,z*d],0,'upper-floor'));
  const corners=new Set<string>();if(level===0&&spec.floors>1)for(const[x,z]of upper)for(const[dx,dz]of[[0,0],[1,0],[0,1],[1,1]])corners.add(key([x+dx,z+dz]));for(const[x,z]of cells){
   for(const[dx,dz]of[[0,0],[1,0],[0,1],[1,1]])corners.add(key([x+dx,z+dz]));
   for(const[dx,dz,rotation,px,pz,width]of[[0,-1,0,x*w,z*d,w],[1,0,1,(x+1)*w,(z+1)*d,d],[0,1,2,(x+1)*w,(z+1)*d,w],[-1,0,3,x*w,z*d,d]]){
    if(set.has(key([x+dx,z+dz])))continue;
    const door=level===0&&dz===-1,wall=b.asset('variant-wall-'+width+'-'+h+'-'+door,aid=>variantWall(p,aid,width,h-.2,door));b.place(wall,[px,level*h+.2,pz],rotation,'facade');
   }
  }
  for(const c of corners){const[x,z]=c.split(',').map(Number);b.place(column,[x*w,level*h+.2,z*d],0,'frame');framePoints.add([x,z,level].join(','));}
  if(stair&&level<spec.floors-1){
   const position:V3=[core[0]*w+.3,level*h+.2,.3];b.place(stair,position,0,'stair');
   const paths=p.assets[stair].source!.stairPaths as V3[][],turn=p.assets[stair].source!.turnPath as V3[];
   stairRoutes.push({level,points:[...paths[0],...turn,...paths[1]].map(q=>q.map((v,k)=>v+position[k])as V3)});
  }
 }
 const roof=(form:Parameters<ArchitectureBuilder['roof']>[0],x:number,z:number,nx:number,nz:number,tier:number)=>{b.roof(form,x*w,tier*h+.14,z*d,nx*w,nz*d);for(const[xx,zz]of[[x,z],[x+nx,z],[x,z+nz],[x+nx,z+nz]]){const key=[xx,zz,tier-1].join(',');if(!framePoints.has(key)){b.place(column,[xx*w,(tier-1)*h+.2,zz*d],0,'frame');framePoints.add(key);}}};
 if(spec.parentProgram==='medical'){
  // The actual medical H mask repeats through the new storeys; its complete original parent remains below in source.
  b.place(b.asset('roof-variant-medical-h-'+w+'-'+d,aid=>variantMedicalRoof(p,aid,w,d,upper)),[0,spec.floors*h+.14,0],0,'roof');
 }else if(spec.floors===1){
  // Preserve the residential U-shaped family footprint; the single-storey farm has no invented second floor.
  b.place(b.asset('roof-variant-farm-'+w+'-'+d,aid=>variantFarmRoof(p,aid,w,d)),[0,h+.14,0],0,'roof');
 }else for(const r of plan.roofs){
  const tier=r.y>4?spec.floors:1;roof(r.form,Math.round(r.x/3.2),Math.round(r.z/3.2),Math.round(r.w/3.2),Math.round(r.d/3.2),tier);
 }
 const fixture=b.original(plan.fixture),purposePoints=plan.purposePoints.map(q=>[q[0]/3.2*w,.2,q[2]/3.2*d]as V3);
 const fixturePlacements=purposePoints.map(point=>{const requested:V3=[point[0]-.6,point[1],point[2]+.65],asset=p.assets[fixture],position=needsNativeGrid(asset,p.materials)?requested.map(v=>Math.round(v/asset.cellSize)*asset.cellSize)as V3:requested;return{instance:b.place(fixture,position,0,'fixture'),requested,position,nativeGridM:needsNativeGrid(asset,p.materials)?asset.cellSize:null};});
 const sd=spec.floors>1?stairDimensions(h):null;
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parameters:spec.parameters,buildingVariant:{...spec,cellDimensionsM:[w,d],parentGrid:[plan.nx,plan.nz],levels,coreCell:core,coreAddedToLower:!plan.lower.some(c=>key(c)===key(core)),stairDimensions:sd,stairRoutes,floorInstances,purposePoints,fixturePlacements,retainedParentAssembly:parent,parentSourceGeometryHashes:parentSources,...(spec.parentProgram==='medical'?{medicalDerivation:'The complete original medical parent, its right-wing upper mask and roof placements are retained. This authored height variant repeats the actual lower H footprint plus the declared stair core on every upper level, with one continuous H-shaped roof per material layer. It retains actual LIFE-123 beds, not bank furniture.'}:{}),...(catalogId>='BUILT-031'?{contractBodyHeightM:Number((spec.floors*h).toFixed(8)),dimensionException:spec.dimensionSource??'author-compact-expanded-boundary-samples',dimensionExceptionScope:'Fixed interchange and supplied main-seed dimensions are explicit fixtures; no seed algorithm or core civicPlan was recovered.'}:{}),derivation:'Original parent and its floor masks/roof tiers are retained. Bay widths/depths and floor count are parameterized; component thickness, furniture size, native pin pitch and real stair rise remain independent. Upper wings repeat at added storeys. Workshop variants repeat the full lower footprint to support real additional factory floors, explicitly replacing the original two-storey mezzanine arrangement. Farm has one storey and a single continuous U-shaped roof per material layer. Only pure native furniture placements respect that furniture own grid; continuous walls, slopes and complete buildings do not snap to it. No whole-mesh scaling.',sourceExceptions:{originalQuarterFloorPerturbation:false,originalSeedAlgorithm:false,originalDoorRoomCapacity:false,coreCivicWingSpecialDimensions:false,civicPlanOverrides:false},scope:'Finite author asset variations using the supplied design sizes and floor-height contract. Original game Building/FloorPlan, capacity, exact doors, uses, seed variation and route/controller are unavailable. No original game integration or engineering certification.'},originalRuntimeBound:false,notCatalogBase:true});
}
