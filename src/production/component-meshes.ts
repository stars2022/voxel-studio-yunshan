import type {Asset} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';

/** Recover actual named primitives from a material-merged authored component. */
export function componentMeshes(a:Asset):AuthoredMesh[]{
 const ranges=a.source?.componentIndexRanges as {name:string;mesh:string;firstIndex:number;indexCount:number;material:number}[]|undefined;
 if(!ranges)return structuredClone(a.meshes??[]);
 return(a.meshes??[]).flatMap(m=>{
  let end=0;const pieces=ranges.filter(r=>r.mesh===m.name).map(r=>{
   if(r.firstIndex!==end||r.material!==m.material||r.indexCount<=0||r.indexCount%3)throw new Error('组件面范围与真实网格不一致');
   end+=r.indexCount;const indices=m.indices.slice(r.firstIndex,end),used=[...new Set(indices)],map=new Map(used.map((v,i)=>[v,i]));
   return{...m,name:r.name,positions:used.flatMap(i=>m.positions.slice(i*3,i*3+3)),normals:used.flatMap(i=>m.normals.slice(i*3,i*3+3)),uvs:used.flatMap(i=>m.uvs.slice(i*2,i*2+2)),indices:indices.map(i=>map.get(i)!)};
  });if(end!==m.indices.length)throw new Error('组件面范围不完整');return pieces;
 });
}
