import {Grid} from './grid';
import {dirs,type Asset,type Material,type V3} from './types';
export type VoxelEmitter={position:V3;material:number;area:number};
// Bounded approximation of light emitted by exposed voxel islands. No hidden mesh lamps.
// The renderer uses at most eight unshadowed point sources, not global illumination.
export function voxelEmitters(a:Asset,materials:Record<string,Material>,grid=new Grid(a.chunks)):VoxelEmitter[]{
 const candidates=new Map<string,{p:V3,m:number}>();
 for(const[p,m]of grid.cells())if(materials[m]?.intensity>0&&materials[m].emissive!=='#000000'){
  if(candidates.size===30000)break;candidates.set(p.join(','),{p,m});
 }
 const emitters:VoxelEmitter[]=[];
 while(candidates.size){
  const first=candidates.values().next().value!,queue=[first],cells:typeof queue=[];candidates.delete(first.p.join(','));
  for(let i=0;i<queue.length;i++){const cell=queue[i];cells.push(cell);for(const d of dirs){const v=cell.p.map((n,k)=>n+d[k]) as V3,key=v.join(','),next=candidates.get(key);if(next&&next.m===first.m){candidates.delete(key);queue.push(next);}}}
  const exposed=dirs.map(d=>cells.filter(({p})=>!grid.get(p.map((n,k)=>n+d[k]) as V3)));
  let side=0;for(let i=1;i<6;i++)if(exposed[i].length>exposed[side].length)side=i;
  const face=exposed[side];if(!face.length)continue;
  const position=face.reduce((sum,{p})=>sum.map((n,k)=>n+p[k]+.5) as V3,[0,0,0] as V3).map((n,k)=>a.origin[k]+n/face.length*a.cellSize+dirs[side][k]*Math.max(.08,a.cellSize*2)) as V3;
  emitters.push({position,material:first.m,area:face.length*a.cellSize**2});
 }
 return emitters.sort((a,b)=>b.area-a.area).slice(0,16);
}
