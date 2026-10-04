import {Grid} from './grid';
import {needsNativeGrid} from './grid-policy';
import {dirs,worldPoint,type Project,type V3,type Bounds} from './types';
type Span={lo:number;hi:number;ids:string[]};
const rowKey=(y:number,z:number)=>y+','+z;
const intersection=(a:Span,b:Span)=>Math.max(0,Math.min(a.hi,b.hi)-Math.max(a.lo,b.lo));
/** A shared-grid row stores exact occupied X intervals, not one entry per cell.
 * Coarse slabs therefore keep their full collision volume without cubic resampling. */
function checkConnectedGeometry(p:Project,clearances:{name:string,min:V3,max:V3}[]=[]){
 const pitch=Math.min(...Object.values(p.instances).map(i=>p.assets[i.assetId].cellSize),1),rows=new Map<string,Span[]>(),warnings:string[]=[],bounds:Record<string,Bounds>={},hasSolid=new Set<string>(),pendingRows:{y:number;z:number;scale:number;spans:Span[]}[]=[];let expandedRows=0;
 const worldBox=(a:Project['assets'][string],i:Project['instances'][string],box:Bounds):Bounds=>{const a0=worldPoint(a,i,box.min),a1=worldPoint(a,i,box.max);return{min:a0.map((n,d)=>Math.round(Math.min(n,a1[d])/pitch)) as V3,max:a0.map((n,d)=>Math.round(Math.max(n,a1[d])/pitch)) as V3};};
 const grids=new Map<string,Grid>();
 for(const i of Object.values(p.instances)){
  const a=p.assets[i.assetId];if(a.meshes?.some(m=>m.collision))warnings.push(`${i.id}: 本检查仅覆盖体素块件；连续网格另按三角面验证，不能据此宣称全资产碰撞通过。`);if(!grids.has(a.id))grids.set(a.id,new Grid(a.chunks));const g=grids.get(a.id)!,scale=Math.round(a.cellSize/pitch),nativeRows=new Map<string,{y:number;z:number;ranges:[number,number][]}>();
  const b:Bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};bounds[i.id]=b;
  // Visual-only cells need no collision lattice; arbitrary mesh pivots must not trigger a fictitious physical failure.
  if(needsNativeGrid(a,p.materials,g)&&(Math.abs(a.cellSize/pitch-scale)>1e-6||[...a.origin,...i.position].some(n=>Math.abs(n/pitch-Math.round(n/pitch))>1e-6))){warnings.push(`${i.id}: 不共格，跳过精确碰撞；需重采样或调整原点。`);continue;}
  for(const[v,m]of g.cells()){
   const p0=worldPoint(a,i,v),p1=worldPoint(a,i,v.map(n=>n+1) as V3),min=p0.map((n,d)=>Math.min(n,p1[d])),max=p0.map((n,d)=>Math.max(n,p1[d]));
   for(let d=0;d<3;d++){b.min[d]=Math.min(b.min[d],min[d]);b.max[d]=Math.max(b.max[d],max[d]);}if(!p.materials[m].solid)continue;
   hasSolid.add(i.id);const lo=min.map(n=>Math.round(n/pitch)),hi=max.map(n=>Math.round(n/pitch)),key=rowKey(lo[1],lo[2]);let row=nativeRows.get(key);if(!row){row={y:lo[1],z:lo[2],ranges:[]};nativeRows.set(key,row);}row.ranges.push([lo[0],hi[0]]);
  }
  for(const row of nativeRows.values()){
   row.ranges.sort((a,b)=>a[0]-b[0]);const merged:[number,number][]=[];
   for(const range of row.ranges){const last=merged.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);}
   expandedRows+=merged.length*scale*scale;if(expandedRows>3_000_000)throw new Error('混合精度碰撞检查超过 3,000,000 个行区间展开项，缩小场景');
   const spans=merged.map(([lo,hi])=>({lo,hi,ids:[i.id]}));
   pendingRows.push({y:row.y,z:row.z,scale,spans});
  }
 }
 // Validate the complete expansion budget before allocating any shared-grid rows.
 for(const row of pendingRows)for(let y=row.y;y<row.y+row.scale;y++)for(let z=row.z;z<row.z+row.scale;z++){const key=rowKey(y,z),existing=rows.get(key);if(existing)existing.push(...row.spans);else rows.set(key,[...row.spans]);}
 const collisions=new Map<string,number>();let occupied=0;
 for(const[key,input]of rows){
  let spans=input;
  if(input.length>1){
   const events=input.flatMap(s=>[{x:s.lo,id:s.ids[0],delta:1},{x:s.hi,id:s.ids[0],delta:-1}]).sort((a,b)=>a.x-b.x),active=new Map<string,number>();spans=[];let previous=events[0].x;
   for(let n=0;n<events.length;){const x=events[n].x;if(x>previous&&active.size)spans.push({lo:previous,hi:x,ids:[...active.keys()].sort()});while(n<events.length&&events[n].x===x){const event=events[n++],count=(active.get(event.id)??0)+event.delta;if(count)active.set(event.id,count);else active.delete(event.id);}previous=x;}
   rows.set(key,spans);
  }
  for(const span of spans){const cells=span.hi-span.lo;occupied+=cells;for(let j=0;j<span.ids.length;j++)for(let k=j+1;k<span.ids.length;k++){const pair=[span.ids[j],span.ids[k]].sort().join(' / ');collisions.set(pair,(collisions.get(pair)??0)+cells);}}
 }
 const touching=new Map(Object.keys(p.instances).map(id=>[id,new Set<string>()])),supported=new Set<string>();
 for(const[key,spans]of rows){const[y,z]=key.split(',').map(Number),below=rows.get(rowKey(y-1,z));for(const span of spans){if(y<=0)for(const id of span.ids)supported.add(id);if(!below)continue;for(const other of below){if(other.lo>=span.hi)break;if(!intersection(span,other))continue;for(const id of span.ids)for(const target of other.ids)if(target!==id){supported.add(id);touching.get(id)!.add(target);}}}}
 const contacts=Object.fromEntries([...touching].map(([id,ids])=>[id,[...ids].sort()])),unsupported=Object.keys(p.instances).filter(id=>hasSolid.has(id)&&!supported.has(id));
 function query(box:Bounds,excluded?:string){const hit=new Set<string>();let cells=0;
  const visit=(spans:Span[]|undefined)=>{for(const span of spans??[]){const overlap=Math.max(0,Math.min(span.hi,box.max[0])-Math.max(span.lo,box.min[0]));if(!overlap)continue;const ids=span.ids.filter(id=>id!==excluded);if(ids.length){cells+=overlap;for(const id of ids)hit.add(id);}}};
  const area=Math.max(0,box.max[1]-box.min[1])*Math.max(0,box.max[2]-box.min[2]);
  if(area<rows.size){for(let y=box.min[1];y<box.max[1];y++)for(let z=box.min[2];z<box.max[2];z++)visit(rows.get(rowKey(y,z)));}
  else for(const[key,spans]of rows){const[y,z]=key.split(',').map(Number);if(y>=box.min[1]&&y<box.max[1]&&z>=box.min[2]&&z<box.max[2])visit(spans);}
  return{cells,ids:[...hit].sort()};
 }
 const openings=Object.values(p.instances).flatMap(i=>{const a=p.assets[i.assetId],g=grids.get(a.id)!;return a.openings.map((b,index)=>{let ownSolid=0,glass=0,empty=0;
  for(let x=b.min[0];x<b.max[0];x++)for(let y=b.min[1];y<b.max[1];y++)for(let z=b.min[2];z<b.max[2];z++){const m=g.get([x,y,z]);if(!m)empty++;else if(p.materials[m].solid)ownSolid++;else glass++;}
  return{instanceId:i.id,index,widthM:(b.max[0]-b.min[0])*a.cellSize,heightM:(b.max[1]-b.min[1])*a.cellSize,emptyCells:empty,ownSolidCells:ownSolid,nonCollisionCells:glass,blockedBy:query(worldBox(a,i,b),i.id).ids};});});
 const firstCenterAtLeast=(n:number)=>{let cell=Math.ceil(n/pitch-.5);while((cell+.5)*pitch<n)cell++;while((cell-.5)*pitch>=n)cell--;return cell;};
 const clearanceResults=clearances.map(c=>{if(c.max.some((v,i)=>v<=c.min[i]))throw new Error('净空范围无效');const box={min:c.min.map(firstCenterAtLeast) as V3,max:c.max.map(firstCenterAtLeast) as V3},hit=query(box);return{name:c.name,clear:hit.cells===0,occupiedCells:hit.cells,blockedBy:hit.ids};});
 const gaps:{instances:string[],distanceM:number}[]=[];const ids=Object.keys(bounds);
 for(let j=0;j<ids.length;j++)for(let k=j+1;k<ids.length;k++){const a=bounds[ids[j]],b=bounds[ids[k]],seps=a.min.map((n,d)=>Math.max(0,n-b.max[d],b.min[d]-a.max[d]));const dist=Math.hypot(...seps);if(dist>1e-6&&dist<=pitch*1.51)gaps.push({instances:[ids[j],ids[k]],distanceM:dist});}
 return{pitchM:pitch,occupiedCollisionCells:occupied,collisionGrids:[{instanceIds:Object.keys(p.instances),pitchM:pitch,occupiedCells:occupied}],cellCountUnits:'one shared grid',collisions:[...collisions].sort(([a],[b])=>a.localeCompare(b)).map(([instances,cells])=>({instances:instances.split(' / '),cells,volumeM3:cells*pitch**3})),unsupported,contacts,gaps,openings,clearances:clearanceResults,warnings,limitations:['支撑检查为垂直接触检测，不作结构受力分析。','间隙为包围盒邻近提示；没有设计公差或自动修补。','共享格以精确X行区间存储；每组最多3,000,000个行区间展开项，统计仍是实际共享格数量。']};
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
  clearances:clearances.map((c,i)=>({name:c.name,clear:checks.every(v=>v.result.clearances[i].clear),occupiedCells:checks.reduce((s,v)=>s+v.result.clearances[i].occupiedCells,0),blockedBy:[...new Set(checks.flatMap(v=>v.result.clearances[i].blockedBy))]})),warnings:checks.flatMap(c=>c.result.warnings),limitations:[...checks[0].result.limitations,'相互独立的空间组分别使用格距；碰撞与净空数量按各组格子累计。每个相邻组保留3,000,000个行区间展开项的检查预算。']};
}
export function gridComponents(grid:Grid){const unvisited=new Set([...grid.cells()].map(([v])=>v.join(','))),sizes:number[]=[];while(unvisited.size){const first=unvisited.values().next().value!;unvisited.delete(first);const q=[first];for(let j=0;j<q.length;j++){const v=q[j].split(',').map(Number);for(const d of dirs){const k=v.map((n,i)=>n+d[i]).join(',');if(unvisited.delete(k))q.push(k);}}sizes.push(q.length);}return sizes.sort((a,b)=>b-a);}
