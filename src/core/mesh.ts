import {Grid,CHUNK} from './grid';
import type {V3,Material,Asset} from './types';
export type MeshBucket={material:number;positions:number[];normals:number[];indices:number[];uvs:number[];quads:number};
// Axis-aligned greedy meshing, scoped to a dirty chunk; neighbours are queried across chunk boundaries.
export function meshChunk(grid:Grid,key:string,materials:Record<string,Material>,size=1,origin:V3=[0,0,0]):MeshBucket[]{
 const buckets=new Map<number,MeshBucket>(),base=key.split(',').map(n=>Number(n)*CHUNK),N=CHUNK;
 if(!grid.chunks.has(key))return[];
 for(let axis=0;axis<3;axis++){const u=(axis+1)%3,v=(axis+2)%3;
  for(const sign of[-1,1])for(let slice=0;slice<N;slice++){
   const mask=new Uint16Array(N*N);
   for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const p=[...base] as V3;p[axis]+=slice;p[u]+=i;p[v]+=j;const m=grid.get(p);if(!m)continue;const q=[...p] as V3;q[axis]+=sign;const other=grid.get(q);
    const visible=!other||(other!==m&&(materials[other]?.opacity??1)<1&&(materials[m]?.opacity??1)>=1);
    if(visible)mask[i+j*N]=m;
   }
   for(let j=0;j<N;j++)for(let i=0;i<N;){const m=mask[i+j*N];if(!m){i++;continue;}let w=1,h=1;while(i+w<N&&mask[i+w+j*N]===m)w++;
    outer:while(j+h<N){for(let k=0;k<w;k++)if(mask[i+k+(j+h)*N]!==m)break outer;h++;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)mask[i+x+(j+y)*N]=0;
    let b=buckets.get(m);if(!b){b={material:m,positions:[],normals:[],indices:[],uvs:[],quads:0};buckets.set(m,b);}const start=b.positions.length/3;
    const p=[...base] as V3;p[axis]+=slice+(sign>0?1:0);p[u]+=i;p[v]+=j;
    const corners=[[0,0],[w,0],[w,h],[0,h]];
    for(const[a,c]of corners){const q=[...p];q[u]+=a;q[v]+=c;for(let d=0;d<3;d++)b.positions.push(origin[d]+q[d]*size);const normal=[0,0,0];normal[axis]=sign;b.normals.push(...normal);const tx=axis===0?2:0,ty=axis===1?2:1;b.uvs.push(origin[tx]+q[tx]*size,origin[ty]+q[ty]*size);}
    const idx=sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2];b.indices.push(...idx.map(n=>start+n));b.quads++;i+=w;
   }
  }
 }
 return[...buckets.values()];
}
export function meshAsset(a:Asset,materials:Record<string,Material>){const g=new Grid(a.chunks);return[...g.chunks.keys()].flatMap(k=>meshChunk(g,k,materials,a.cellSize,a.origin));}

/** Static overview mesh: merge rectangles only on identical material/plane/normal.
 * No voxel resampling, decimation, interpolation, collision or silhouette change. */
export function mergeCoplanarMesh(a:Asset,buckets:MeshBucket[]):MeshBucket[]{
 type Rect={u0:number;u1:number;v0:number;v1:number};
 const planes=new Map<string,{material:number;axis:number;sign:number;plane:number;rects:Rect[]}>();
 for(const b of buckets)for(let k=0;k<b.positions.length;k+=12){const normal=b.normals.slice(k,k+3),axis=normal.findIndex(n=>n!==0),sign=normal[axis],u=(axis+1)%3,v=(axis+2)%3,coords=[0,1,2,3].map(j=>b.positions.slice(k+j*3,k+j*3+3).map((n,d)=>Math.round((n-a.origin[d])/a.cellSize))),plane=coords[0][axis],key=[b.material,axis,sign,plane].join(',');let group=planes.get(key);if(!group){group={material:b.material,axis,sign,plane,rects:[]};planes.set(key,group);}group.rects.push({u0:Math.min(...coords.map(c=>c[u])),u1:Math.max(...coords.map(c=>c[u])),v0:Math.min(...coords.map(c=>c[v])),v1:Math.max(...coords.map(c=>c[v]))});}
 const result=new Map<number,MeshBucket>();
 for(const group of planes.values()){
  let rects=group.rects,previous=Infinity;
  while(rects.length<previous){previous=rects.length;for(const direction of[0,1]){const lo=direction?'v0':'u0',hi=direction?'v1':'u1',ac=direction?'u0':'v0',bc=direction?'u1':'v1';rects.sort((a,b)=>a[ac]-b[ac]||a[bc]-b[bc]||a[lo]-b[lo]);const merged:Rect[]=[];for(const r of rects){const last=merged.at(-1);if(last&&last[ac]===r[ac]&&last[bc]===r[bc]&&last[hi]===r[lo])last[hi]=r[hi];else merged.push({...r});}rects=merged;}}
  const {material,axis,sign,plane}=group,u=(axis+1)%3,v=(axis+2)%3;let b=result.get(material);if(!b){b={material,positions:[],normals:[],indices:[],uvs:[],quads:0};result.set(material,b);}
  for(const r of rects){const start=b.positions.length/3;for(const[uu,vv]of[[r.u0,r.v0],[r.u1,r.v0],[r.u1,r.v1],[r.u0,r.v1]]){const q=[0,0,0],n=[0,0,0];q[axis]=plane;q[u]=uu;q[v]=vv;n[axis]=sign;const world=q.map((c,d)=>a.origin[d]+c*a.cellSize);b.positions.push(...world);b.normals.push(...n);b.uvs.push(world[axis===0?2:0],world[axis===1?2:1]);}b.indices.push(...(sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]).map(n=>start+n));b.quads++;}
 }
 return[...result.values()];
}
