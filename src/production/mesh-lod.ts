import {Triangle,Vector3} from 'three';
import type {Asset,V3} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {outfitHash as hash} from './outfit-components';
import {mergeMeshes} from './mesh-shapes';
import {rigMatrices} from '../core/rig';

type Face={v:number[];uv:number[][];source:number};
const sub=(a:number[],b:number[])=>a.map((n,k)=>n-b[k]);
const dot=(a:number[],b:number[])=>a.reduce((s,n,k)=>s+n*b[k],0);
const cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(p:number[][])=>cross(sub(p[1],p[0]),sub(p[2],p[0]));
const edgeKey=(a:number,b:number)=>a<b?a+','+b:b+','+a;
export function meshTopology(m:AuthoredMesh){
 const points:V3[]=[],index=new Map<string,number>(),corners:number[]=[];
 for(let k=0;k<m.positions.length;k+=3){const p=m.positions.slice(k,k+3)as V3,key=p.join(',');if(!index.has(key)){index.set(key,points.length);points.push(p);}corners.push(index.get(key)!);}
 const faces:Face[]=[];for(let k=0;k<m.indices.length;k+=3){const ids=m.indices.slice(k,k+3);faces.push({v:ids.map(i=>corners[i]),uv:ids.map(i=>m.uvs.slice(i*2,i*2+2)),source:k/3});}return{points,faces};
}
function topologyEdges(faces:Face[]){const edges=new Map<string,{a:number;b:number;faces:number[];direction:number}>();faces.forEach((f,i)=>{for(let k=0;k<3;k++){const a=f.v[k],b=f.v[(k+1)%3],key=edgeKey(a,b),e=edges.get(key)??{a:Math.min(a,b),b:Math.max(a,b),faces:[],direction:0};e.faces.push(i);e.direction+=a<b?1:-1;edges.set(key,e);}});return edges;}
export function reduceMesh(m:AuthoredMesh,tolerance:number,ratio:number,protectedPoints:V3[],contactDistance:number,posed:(p:V3)=>V3=p=>p,preserveThinLayer=false){
 const{points,faces:original}=meshTopology(m),edges0=topologyEdges(original),identity=points.map((_,i)=>i),base={mesh:m.name,sourceMeshSHA256:hash(m),beforeTriangles:original.length,afterTriangles:original.length,toleranceM:tolerance,maxVertexDisplacementM:0,vertexMap:identity,sourceFaceIndices:original.map(f=>f.source),closed:true,lockedVertices:0,lockedVertexIndices:[]as number[],collapses:0};
 if(preserveThinLayer)return{mesh:structuredClone(m),proof:{...base,lockedVertices:points.length,lockedVertexIndices:identity,thinLayerPreservedExactly:true,reason:'Thin material layer or hollow passage retained together with its support triangles'}};
 if(m.faceAtlas||m.atmosphere||m.wovenPattern||[...edges0.values()].some(e=>e.faces.length!==2||e.direction!==0))return{mesh:structuredClone(m),proof:{...base,closed:false,reason:'Texture-specific or non-closed surface retained exactly'}};
 const planes=points.map(p=>[...p,...posed(p)]),min=[0,1,2,3,4,5].map(k=>Math.min(...planes.map(p=>p[k]))),max=[0,1,2,3,4,5].map(k=>Math.max(...planes.map(p=>p[k]))),locked=new Set<number>();
 const constraints=planes.map(p=>p.map((n,k)=>n===min[k]||n===max[k]));
 const q=new Vector3(),closest=new Vector3(),tri=new Triangle();
 for(const f of original){tri.set(...f.v.map(i=>new Vector3(...points[i]))as[Vector3,Vector3,Vector3]);for(const p of protectedPoints){q.set(...p);tri.closestPointToPoint(q,closest);if(closest.distanceToSquared(q)<=contactDistance**2){for(const i of f.v)locked.add(i);break;}}}
 base.lockedVertices=locked.size;base.lockedVertexIndices=[...locked];let faces=original.map(f=>({...f,v:[...f.v]})),map=[...identity],collapses=0;
 const clusters=new Map(identity.map(i=>[i,[i]]));
 while(faces.length>Math.max(8,Math.floor(original.length*ratio))){
  const edges=topologyEdges(faces),neighbors=new Map<number,Set<number>>(),incident=new Map<number,number[]>();
  faces.forEach((f,fi)=>{for(const v of f.v){const ns=neighbors.get(v)??new Set<number>();f.v.filter(w=>w!==v).forEach(w=>ns.add(w));neighbors.set(v,ns);const is=incident.get(v)??[];is.push(fi);incident.set(v,is);}});
  const candidates:{from:number;to:number;score:number}[]=[];
  for(const e of edges.values()){
   if(e.faces.length!==2||e.direction!==0)throw new Error('LOD topology changed');
   const na=normal(faces[e.faces[0]].v.map(i=>points[i])),nb=normal(faces[e.faces[1]].v.map(i=>points[i])),curvature=1-dot(na,nb)/Math.sqrt(dot(na,na)*dot(nb,nb));
   for(const[from,to]of[[e.a,e.b],[e.b,e.a]])if(!locked.has(from)){
    if(constraints[from].some((on,k)=>on&&Math.abs(planes[from][k]-planes[to][k])>1e-12))continue;const d=sub(points[from],points[to]),distance=dot(d,d);if(distance>tolerance*tolerance)continue;
    candidates.push({from,to,score:distance*(1+Math.max(0,curvature)*8)});
   }
  }
  candidates.sort((a,b)=>a.score-b.score||a.from-b.from||a.to-b.to);let chosen:typeof candidates[number]|undefined;
  for(const c of candidates){
   const ns=neighbors.get(c.from)!,other=neighbors.get(c.to)!;if([...ns].filter(v=>other.has(v)).length!==2)continue;
   if(clusters.get(c.from)!.some(i=>{const d=sub(points[i],points[c.to]);return dot(d,d)>tolerance*tolerance+1e-18;}))continue;
   let valid=true;for(const fi of incident.get(c.from)!){const f=faces[fi];if(f.v.includes(c.to))continue;const n0=normal(f.v.map(i=>points[i])),n1=normal(f.v.map(i=>points[i===c.from?c.to:i])),l0=Math.sqrt(dot(n0,n0)),l1=Math.sqrt(dot(n1,n1));if(l1<1e-13||dot(n0,n1)<l0*l1*.25){valid=false;break;}}
   if(valid){chosen=c;break;}
  }
  if(!chosen)break;const{from,to}=chosen;
  const moved=clusters.get(from)!;for(const i of moved)map[i]=to;clusters.get(to)!.push(...moved);clusters.delete(from);faces=faces.filter(f=>!(f.v.includes(from)&&f.v.includes(to))).map(f=>({...f,v:f.v.map(i=>i===from?to:i)}));collapses++;
 }
 if(!collapses)return{mesh:structuredClone(m),proof:{...base,reason:'No admissible collapse within anchor and error bounds'}};
 const out={...structuredClone(m),positions:[]as number[],normals:[]as number[],uvs:[]as number[],indices:[]as number[]};
 for(const f of faces){const n=normal(f.v.map(i=>points[i])),l=Math.sqrt(dot(n,n));for(let k=0;k<3;k++){out.indices.push(out.positions.length/3);out.positions.push(...points[f.v[k]]);out.normals.push(...n.map(v=>v/l||0));out.uvs.push(...f.uv[k]);}}
 if([...topologyEdges(faces).values()].some(e=>e.faces.length!==2||e.direction!==0))throw new Error('LOD must retain closed oriented topology');
 const maxError=Math.max(...map.map((j,i)=>Math.hypot(...sub(points[i],points[j]))));
 return{mesh:out,proof:{...base,afterTriangles:faces.length,vertexMap:map,sourceFaceIndices:faces.map(f=>f.source),maxVertexDisplacementM:maxError,collapses,reason:'Bounded edge collapse; all original component boundary planes preserved; actual native/socket contacts locked'}};
}
export function sourceComponents(source:Asset,m:AuthoredMesh){
 const nested=(source.source?.detail as any)?.componentIndexRanges?.[m.name]as {name:string;firstIndex:number;indexCount:number}[]|undefined;
 const flat=(source.source?.componentIndexRanges as {name:string;mesh:string;firstIndex:number;indexCount:number}[]|undefined)?.filter(r=>r.mesh===m.name);
 const ranges=nested??(flat?.length?flat:undefined)??[{name:m.name,firstIndex:0,indexCount:m.indices.length}];let end=0;
 const result=ranges.map(r=>{if(r.firstIndex!==end)throw new Error('Noncontiguous source component ranges');end+=r.indexCount;const indices=m.indices.slice(r.firstIndex,end),used=[...new Set(indices)],map=new Map(used.map((v,i)=>[v,i]));if(end>m.indices.length)throw new Error('Bad source component range');return{range:r,mesh:{...m,name:r.name,positions:used.flatMap(i=>m.positions.slice(i*3,i*3+3)),normals:used.flatMap(i=>m.normals.slice(i*3,i*3+3)),uvs:used.flatMap(i=>m.uvs.slice(i*2,i*2+2)),indices:indices.map(i=>map.get(i)!)}as AuthoredMesh};});if(end!==m.indices.length)throw new Error('Incomplete source component ranges');return result;
}
export function thinLayerMeasure(m:AuthoredMesh){
 let volume=0,area=0;
 for(let i=0;i<m.indices.length;i+=3){const p=m.indices.slice(i,i+3).map(j=>m.positions.slice(j*3,j*3+3));volume+=dot(p[0],cross(p[1],p[2]))/6;const n=normal(p);area+=Math.sqrt(dot(n,n))/2;}
 return area?Math.abs(volume)/area:Infinity;
}
export function preserveSurface(m:AuthoredMesh,cellSize:number){
 const t=meshTopology(m),e=topologyEdges(t.faces),closed=[...e.values()].every(v=>v.faces.length===2&&v.direction===0);
 return thinLayerMeasure(m)<=Math.min(.0015,cellSize*.3)||(closed&&t.points.length-e.size+t.faces.length<=0);
}
export function reduceAsset(source:Asset,id:string,level:'middle'|'far',tolerance:number){
 const a=structuredClone(source),protectedPoints=[...[...new Grid(source.chunks).cells()].map(([v])=>v.map(n=>(n+.5)*source.cellSize)as V3),...source.ports.map(p=>p.position)],proofs=[];
 a.id=id;a.name+=' · '+level+'LOD';a.meshes=[];const ranges:{name:string;mesh:string;firstIndex:number;indexCount:number}[]=[];
 const matrices=source.rig?rigMatrices(source):null,componentMap=new Map((source.meshes??[]).map(m=>[m.name,sourceComponents(source,m)])),thin=new Set<AuthoredMesh>();
 
 for(const parts of componentMap.values())for(const part of parts)if(preserveSurface(part.mesh,source.cellSize)){thin.add(part.mesh);protectedPoints.push(...meshTopology(part.mesh).points);}
 const distinctPoints=[...new Map(protectedPoints.map(p=>[p.join(','),p])).values()];
 for(const m of source.meshes??[]){const parts=[],checks=[];let first=0;const matrix=matrices?matrices.skin[matrices.indices.get(source.rig!.meshJoints[m.name])!]:null,posed=(p:V3)=>{const v=new Vector3(...p.map((n,k)=>n+source.origin[k]));if(matrix)v.applyMatrix4(matrix);return v.toArray().map(n=>Math.round(n*1e9)/1e9||0)as V3;};for(const part of componentMap.get(m.name)!){const r=reduceMesh(part.mesh,tolerance,level==='middle'?.68:.34,distinctPoints,source.cellSize*1.8,posed,thin.has(part.mesh));parts.push(r.mesh);checks.push({...r.proof,sourceFirstIndex:part.range.firstIndex,sourceIndexCount:part.range.indexCount});ranges.push({name:part.range.name,mesh:m.name,firstIndex:first,indexCount:r.mesh.indices.length});first+=r.mesh.indices.length;}a.meshes.push(mergeMeshes(m.name,parts));proofs.push({mesh:m.name,parts:checks});}
 a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:(source.source!.baseCatalogIds??[source.source!.catalogId])as string[],sourceAssetId:source.id,sourceGeometrySHA256:hash(geometryData(source)),originalRetained:true,componentIndexRanges:ranges,lodReduction:{level,toleranceM:tolerance,nativeCellsPreservedExactly:true,rigAndPortsPreserved:true,method:'Closed per-component edge collapse; no voxel resampling; original component boundary planes preserved and actual native/socket contact triangles locked. Thin surface layers, closed hollow passages and their support triangles retained exactly. Every output face retains its original source-face correspondence and cornerUVs.',meshes:proofs,automaticDistanceBinding:false}};
 return a;
}
