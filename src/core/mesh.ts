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
