import {Grid} from './grid';
import {dirs,worldPoint,type Project,type V3,type Bounds} from './types';
function checkConnectedGeometry(p:Project,clearances:{name:string,min:V3,max:V3}[]=[]){
 // Unplaced library masters cannot collide. Including their precision here
 // could expand a coarse scene eightfold merely by importing a 5 mm book.
 const pitch=Math.min(...Object.values(p.instances).map(i=>p.assets[i.assetId].cellSize),1),occupancy=new Map<string,Set<string>>(),instanceCells=new Map<string,Set<string>>(),warnings:string[]=[],collisions=new Map<string,number>(),bounds:Record<string,Bounds>={};let expanded=0;
 for(const i of Object.values(p.instances)){
  const a=p.assets[i.assetId],g=new Grid(a.chunks),own=new Set<string>();instanceCells.set(i.id,own);
  const b:Bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};bounds[i.id]=b;
  if(Math.abs(a.cellSize/pitch-Math.round(a.cellSize/pitch))>1e-6||[...a.origin,...i.position].some(n=>Math.abs(n/pitch-Math.round(n/pitch))>1e-6)){warnings.push(`${i.id}: 不共格，跳过精确碰撞；需重采样或调整原点。`);continue;}
  for(const[v,m]of g.cells()){
   const p0=worldPoint(a,i,v),p1=worldPoint(a,i,v.map(n=>n+1) as V3),min=p0.map((n,d)=>Math.min(n,p1[d])) as V3,max=p0.map((n,d)=>Math.max(n,p1[d])) as V3;
   for(let d=0;d<3;d++){b.min[d]=Math.min(b.min[d],min[d]);b.max[d]=Math.max(b.max[d],max[d]);}if(!p.materials[m].solid)continue;
   const lo=min.map(n=>Math.round(n/pitch)),hi=max.map(n=>Math.round(n/pitch));
   for(let y=lo[1];y<hi[1];y++)for(let z=lo[2];z<hi[2];z++)for(let x=lo[0];x<hi[0];x++){
    if(++expanded>3_000_000)throw new Error('混合精度碰撞检查超过 3,000,000 格，缩小场景');const key=[x,y,z].join(',');let ids=occupancy.get(key);if(!ids){ids=new Set;occupancy.set(key,ids);}for(const other of ids)if(other!==i.id){const pair=[i.id,other].sort().join(' / ');collisions.set(pair,(collisions.get(pair)??0)+1);}ids.add(i.id);own.add(key);
   }
  }
 }
 const unsupported:string[]=[],contacts:Record<string,string[]>={};
 for(const[id,keys]of instanceCells){const touching=new Set<string>();let supported=false;for(const key of keys){const v=key.split(',').map(Number);if(v[1]<=0)supported=true;const below=occupancy.get([v[0],v[1]-1,v[2]].join(','));if(below)for(const other of below)if(other!==id){supported=true;touching.add(other);}}
  if(!supported&&keys.size)unsupported.push(id);contacts[id]=[...touching];
 }
 const openings=Object.values(p.instances).flatMap(i=>{const a=p.assets[i.assetId],g=new Grid(a.chunks);return a.openings.map((b,index)=>{const blocked=new Set<string>();let ownSolid=0,glass=0,empty=0;
  for(let x=b.min[0];x<b.max[0];x++)for(let y=b.min[1];y<b.max[1];y++)for(let z=b.min[2];z<b.max[2];z++){
   const v:V3=[x,y,z],m=g.get(v);if(!m)empty++;else if(p.materials[m].solid)ownSolid++;else glass++;
   const lo=worldPoint(a,i,v),hi=worldPoint(a,i,v.map(n=>n+1) as V3),min=lo.map((n,d)=>Math.round(Math.min(n,hi[d])/pitch)),max=lo.map((n,d)=>Math.round(Math.max(n,hi[d])/pitch));
   for(let xx=min[0];xx<max[0];xx++)for(let yy=min[1];yy<max[1];yy++)for(let zz=min[2];zz<max[2];zz++)for(const other of occupancy.get([xx,yy,zz].join(','))??[])if(other!==i.id)blocked.add(other);
  }return{instanceId:i.id,index,widthM:(b.max[0]-b.min[0])*a.cellSize,heightM:(b.max[1]-b.min[1])*a.cellSize,emptyCells:empty,ownSolidCells:ownSolid,nonCollisionCells:glass,blockedBy:[...blocked]};});});
 const clearanceResults=clearances.map(c=>{if(c.max.some((v,i)=>v<=c.min[i]))throw new Error('净空范围无效');const hits=new Set<string>();let count=0;for(const[key,ids]of occupancy){const v=key.split(',').map(n=>(Number(n)+.5)*pitch);if(v.every((n,i)=>n>=c.min[i]&&n<c.max[i])){count++;for(const id of ids)hits.add(id);}}return{name:c.name,clear:count===0,occupiedCells:count,blockedBy:[...hits]};});
 const gaps:{instances:string[],distanceM:number}[]=[];const ids=Object.keys(bounds);
 for(let j=0;j<ids.length;j++)for(let k=j+1;k<ids.length;k++){const a=bounds[ids[j]],b=bounds[ids[k]],seps=a.min.map((n,d)=>Math.max(0,n-b.max[d],b.min[d]-a.max[d]));const dist=Math.hypot(...seps);if(dist>1e-6&&dist<=pitch*1.51)gaps.push({instances:[ids[j],ids[k]],distanceM:dist});}
 return{pitchM:pitch,occupiedCollisionCells:occupancy.size,collisionGrids:[{instanceIds:Object.keys(p.instances),pitchM:pitch,occupiedCells:occupancy.size}],cellCountUnits:'one shared grid',collisions:[...collisions].map(([instances,cells])=>({instances:instances.split(' / '),cells,volumeM3:cells*pitch**3})),unsupported,contacts,gaps,openings,clearances:clearanceResults,warnings,limitations:['支撑检查为垂直接触检测，不作结构受力分析。','间隙为包围盒邻近提示；没有设计公差或自动修补。']};
}

/** Broad phase: spatially independent groups do not need to share a fine grid.
 * Include declared opening regions so blockers outside the visual bounds are
 * still assigned to the same exact-check group. Each group retains its budget. */
export function checkGeometry(p:Project,clearances:{name:string,min:V3,max:V3}[]=[]){
 const instances=Object.values(p.instances),parent=instances.map((_,i)=>i),find=(i:number):number=>parent[i]===i?i:(parent[i]=find(parent[i]));
 const localBounds=new Map<string,Bounds|null>();
 const bounds=instances.map(i=>{const a=p.assets[i.assetId];if(!localBounds.has(a.id))localBounds.set(a.id,new Grid(a.chunks).bounds());const ranges=[localBounds.get(a.id),...a.openings].filter((b):b is Bounds=>!!b);if(!ranges.length)return null;
  const b:Bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};for(const r of ranges){const lo=worldPoint(a,i,r.min),hi=worldPoint(a,i,r.max);for(let d=0;d<3;d++){b.min[d]=Math.min(b.min[d],lo[d],hi[d]);b.max[d]=Math.max(b.max[d],lo[d],hi[d]);}}return b;});
 for(let i=0;i<instances.length;i++)for(let j=i+1;j<instances.length;j++){const a=bounds[i],b=bounds[j];if(!a||!b)continue;const gap=Math.hypot(...a.min.map((n,d)=>Math.max(0,n-b.max[d],b.min[d]-a.max[d]))),margin=Math.max(p.assets[instances[i].assetId].cellSize,p.assets[instances[j].assetId].cellSize)*1.51;if(gap<=margin+1e-9)parent[find(j)]=find(i);}
 const groups=new Map<number,typeof instances>();instances.forEach((v,i)=>{const id=find(i);if(!groups.has(id))groups.set(id,[]);groups.get(id)!.push(v);});
 if(groups.size<=1)return checkConnectedGeometry(p,clearances);
 const checks=[...groups.values()].map(group=>({instanceIds:group.map(i=>i.id),result:checkConnectedGeometry({...p,instances:Object.fromEntries(group.map(i=>[i.id,i]))},clearances)})),pitch=Math.min(...checks.map(c=>c.result.pitchM));
 return{pitchM:pitch,occupiedCollisionCells:checks.reduce((s,c)=>s+c.result.occupiedCollisionCells,0),collisionGrids:checks.map(c=>({instanceIds:c.instanceIds,pitchM:c.result.pitchM,occupiedCells:c.result.occupiedCollisionCells})),cellCountUnits:'sum of independent grids; use each collisionGrid pitch, not global minimum pitch',
  collisions:checks.flatMap(c=>c.result.collisions.map(v=>({...v,pitchM:c.result.pitchM}))),unsupported:checks.flatMap(c=>c.result.unsupported),contacts:Object.assign({},...checks.map(c=>c.result.contacts)) as Record<string,string[]>,gaps:checks.flatMap(c=>c.result.gaps).filter(g=>g.distanceM<=pitch*1.51),openings:checks.flatMap(c=>c.result.openings),
  clearances:clearances.map((c,i)=>({name:c.name,clear:checks.every(v=>v.result.clearances[i].clear),occupiedCells:checks.reduce((s,v)=>s+v.result.clearances[i].occupiedCells,0),blockedBy:[...new Set(checks.flatMap(v=>v.result.clearances[i].blockedBy))]})),warnings:checks.flatMap(c=>c.result.warnings),limitations:[...checks[0].result.limitations,'相互独立的空间组分别使用格距；碰撞与净空数量按各组格子累计。单个相邻组仍保留 3,000,000 格的检查预算。']};
}
export function gridComponents(grid:Grid){const unvisited=new Set([...grid.cells()].map(([v])=>v.join(','))),sizes:number[]=[];while(unvisited.size){const first=unvisited.values().next().value!;unvisited.delete(first);const q=[first];for(let j=0;j<q.length;j++){const v=q[j].split(',').map(Number);for(const d of dirs){const k=v.map((n,i)=>n+d[i]).join(',');if(unvisited.delete(k))q.push(k);}}sizes.push(q.length);}return sizes.sort((a,b)=>b-a);}
