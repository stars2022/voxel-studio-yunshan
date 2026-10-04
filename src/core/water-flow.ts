import type {Asset,V3} from './types';
import type {MeshBucket} from './mesh';
export type FlowRoute={points:V3[];startDistanceM:number};
export type WaterFlow={routes:FlowRoute[];materialIds:number[];animated:false;originalRouteBound:false};
export function waterFlow(a:Asset):WaterFlow|undefined{
 const f=a.source?.waterFlow as WaterFlow|undefined;if(!f)return;
 if(!Array.isArray(f.routes)||!f.routes.length||f.routes.length>8||!Array.isArray(f.materialIds)||f.materialIds.some(m=>!Number.isInteger(m)||m<1||m>65535))throw new Error('Invalid native water flow descriptor');
 for(const r of f.routes)if(!Number.isFinite(r.startDistanceM)||!Array.isArray(r.points)||r.points.length<2||r.points.length>64||r.points.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||Math.abs(n)>32768)))throw new Error('Invalid native water flow route');
 return f;
}
/** U is downstream arc length in metres; V is signed lateral distance. At a
 * junction, each branch reaches station zero and the outlet advances from zero.
 * This is static UV data, not texture animation, velocity or fluid simulation. */
export function flowUV(point:V3,flow:WaterFlow):[number,number]{let best=Infinity,answer:[number,number]=[0,0];for(const route of flow.routes){let distance=route.startDistanceM;for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],d=b.map((n,j)=>n-a[j]),length=Math.hypot(...d);if(!length)continue;const t=Math.max(0,Math.min(1,point.reduce((sum,n,j)=>sum+(n-a[j])*d[j],0)/(length*length))),q=a.map((n,j)=>n+t*d[j]),sq=point.reduce((sum,n,j)=>sum+(n-q[j])**2,0);if(sq<best-1e-12){best=sq;const horizontal=Math.hypot(d[0],d[2]);answer=[distance+t*length,horizontal?((point[0]-q[0])*d[2]-(point[2]-q[2])*d[0])/horizontal:point[0]-q[0]];}distance+=length;}}return answer;}
/** Share coplanar water vertices across native chunks while keeping hard-edge
 * normals and material boundaries. Every original index still points to the
 * exact same occupied surface position. Never round or resample occupancy. */
export function applyWaterFlow(a:Asset,buckets:MeshBucket[]):MeshBucket[]{
 const f=waterFlow(a);if(!f)return buckets;
 type Face={material:number;axis:number;sign:number;plane:number;u0:number;u1:number;v0:number;v1:number};
 const faces:Face[]=[],lines=new Map<string,Set<number>>(),output=buckets.filter(b=>!f.materialIds.includes(b.material));
 const line=(axis:number,sign:number,plane:number,direction:number,fixed:number)=>[axis,sign,plane,direction,fixed].join(',');
 for(const b of buckets)if(f.materialIds.includes(b.material))for(let k=0;k<b.positions.length;k+=12){const axis=b.normals.slice(k,k+3).findIndex(n=>n!==0),sign=b.normals[k+axis],u=(axis+1)%3,v=(axis+2)%3,c=[0,1,2,3].map(j=>b.positions.slice(k+j*3,k+j*3+3).map((n,d)=>Math.round((n-a.origin[d])/a.cellSize))),face={material:b.material,axis,sign,plane:c[0][axis],u0:Math.min(...c.map(p=>p[u])),u1:Math.max(...c.map(p=>p[u])),v0:Math.min(...c.map(p=>p[v])),v1:Math.max(...c.map(p=>p[v]))};faces.push(face);for(const p of c)for(const dir of[0,1]){const key=line(axis,sign,face.plane,dir,p[dir?u:v]);let values=lines.get(key);if(!values){values=new Set();lines.set(key,values);}values.add(p[dir?v:u]);}}
 const sorted=new Map([...lines].map(([k,v])=>[k,[...v].sort((a,b)=>a-b)])),groups=new Map<number,{bucket:MeshBucket;vertices:Map<string,number>}>();
 for(const face of faces){const {axis,sign,plane,material,u0,u1,v0,v1}=face,u=(axis+1)%3,v=(axis+2)%3;let group=groups.get(material);if(!group){group={bucket:{material,positions:[],normals:[],indices:[],uvs:[],quads:0},vertices:new Map()};groups.set(material,group);}const out=group.bucket;
  const index=(uu:number,vv:number)=>{const q:V3=[0,0,0],normal=[0,0,0];q[axis]=plane;q[u]=uu;q[v]=vv;normal[axis]=sign;const key=[...q.map(n=>n*2),...normal].join(',');let i=group!.vertices.get(key);if(i===undefined){i=out.positions.length/3;group!.vertices.set(key,i);const local=q.map(n=>n*a.cellSize) as V3;out.positions.push(...local.map((n,d)=>n+a.origin[d]));out.normals.push(...normal);out.uvs.push(...flowUV(local,f));}return i;};
  const edge=(dir:number,fixed:number,lo:number,hi:number,reverse=false)=>{const values=sorted.get(line(axis,sign,plane,dir,fixed))!.filter(n=>n>=lo&&n<=hi);if(reverse)values.reverse();return values.slice(0,-1).map(n=>dir?index(fixed,n):index(n,fixed));};
  const boundary=[...edge(0,v0,u0,u1),...edge(1,u1,v0,v1),...edge(0,v1,u0,u1,true),...edge(1,u0,v0,v1,true)];
  if(boundary.length===4){for(const n of(sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]))out.indices.push(boundary[n]);}
  else{const centre=index((u0+u1)/2,(v0+v1)/2);for(let i=0;i<boundary.length;i++){const j=(i+1)%boundary.length;out.indices.push(centre,boundary[sign>0?i:j],boundary[sign>0?j:i]);}}
  out.quads++;
 }
 return[...output,...[...groups.values()].map(g=>g.bucket)];
}
