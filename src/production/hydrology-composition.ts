import {Grid} from '../core/grid';
import {eachCell,type Asset,type Command,type V3} from '../core/types';
import {waterFlow,type WaterFlow} from '../core/water-flow';
import {Shapes} from './shapes';
import {makeHydrologyAsset} from './atlas-hydrology';

/** Exact native union. Reject overlaps instead of hiding intersecting water or
 * rock behind a render-only merge. Original masters remain in the document. */
export function composeHydrology(id:string,items:{asset:Asset;position:V3;instanceId:string}[],flow:WaterFlow):Asset{
 const b=new Shapes(.2,{}),dependencies=[];
 for(const {asset,position,instanceId}of items){
  if(asset.cellSize!==.2)throw new Error('Hydrology union requires the native 0.2m grid');
  const shift=position.map((n,d)=>(n+asset.origin[d])/.2);
  if(shift.some(n=>Math.abs(n-Math.round(n))>1e-7))throw new Error('Hydrology union is not grid aligned');
  const offset=shift.map(Math.round),g=new Grid(asset.chunks);
  b.part(instanceId+' · '+asset.name,()=>{for(const[p,m]of g.cells()){
   const q=p.map((n,d)=>n+offset[d]) as V3;
   if(b.g.get(q))throw new Error(`Hydrology occupancy overlap at ${q.join(',')} in ${instanceId}`);
   b.g.set(q,m);
  }});
  dependencies.push({assetId:asset.id,instanceId,version:asset.version,catalogId:asset.source?.catalogId??null,parameters:asset.source?.parameters??{},position,origin:asset.origin,occupiedCells:g.count});
 }
 if(b.g.count>1_000_000)throw new Error('Hydrology union exceeds one million native cells');
 const a=b.finish(id,'连续水系原生合成（辅助；保留母版）',{kind:'hydrology-composition',dependencies,waterFlow:flow,occupiedCells:b.g.count,overlapCells:0,regeneration:'explicit rebuild; source masters retained, no live dependency binding',originalRouteBound:false,waterSimulated:false,flowTextureAnimated:false});
 // The 153m fall beside a 100m pool is sparse; do not invent a single enormous
 // selectable box. Each retained source component has its own bounded region.
 a.parts=a.parts.filter(p=>p.id!=='root').map(p=>({...p,parent:null}));
 waterFlow(a);return a;
}

/** Compile the small author-fixture command subset without mutating a project. */
export function compileHydrologyScene(commands:Command[],s:Record<string,number>,id:string,flow:WaterFlow):Command[]{
 const assets=new Map<string,Asset>(),items:{asset:Asset;position:V3;instanceId:string}[]=[];
 for(const c of commands){
  if(c.op==='produceCatalogAsset')assets.set(c.id,makeHydrologyAsset(c.catalogId,c.id,c.id,s,c.params));
  else if(c.op==='createAsset')assets.set(c.id,{id:c.id,name:c.name,version:1,category:'base',cellSize:c.cellSize,origin:[0,0,0],chunks:{},parts:[],ports:[],openings:[]});
  else if(c.op==='voxels'){const a=assets.get(c.assetId)!;const g=new Grid(a.chunks);if(!['fill','remove'].includes(c.mode))throw new Error('Unsupported hydrology fixture edit');eachCell(c.region,p=>g.set(p,c.mode==='remove'?0:c.material));a.chunks=g.serialize();}
  else if(c.op==='instance'){if(c.rotation||c.parent)throw new Error('Hydrology fixture supports unparented translations');items.push({asset:assets.get(c.assetId)!,position:c.position,instanceId:c.id});}
  else throw new Error('Unsupported hydrology fixture command '+c.op);
 }
 return[...commands.filter(c=>c.op!=='instance'),{op:'installAsset',asset:composeHydrology(id,items,flow)},{op:'instance',id:id+'-1',assetId:id,position:[0,0,0],rotation:0}];
}
