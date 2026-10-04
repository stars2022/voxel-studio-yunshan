import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import type {Asset,Assembly,Project,V3} from '../../src/core/types';
import {rotateY} from '../../src/core/types';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import {Grid} from '../../src/core/grid';
import {assetBoundsM} from '../../src/core/sky';
import {auditShape,inside} from './mesh-audit';
import {structureRouteClearances} from '../../src/production/structure-assembly';
import {checkGeometry} from '../../src/core/checks';

export function architectureComponents(a:Asset):AuthoredMesh[]{
 const ranges=a.source?.componentIndexRanges as {name:string;mesh:string;firstIndex:number;indexCount:number}[]|undefined;
 if(!ranges)return a.meshes??[];
 return (a.meshes??[]).flatMap(m=>{let end=0;const parts=ranges.filter(r=>r.mesh===m.name).map(r=>{assert.equal(r.firstIndex,end);end+=r.indexCount;const indices=m.indices.slice(r.firstIndex,end),used=[...new Set(indices)],map=new Map(used.map((v,i)=>[v,i]));return{...m,name:r.name,positions:used.flatMap(i=>m.positions.slice(i*3,i*3+3)),normals:used.flatMap(i=>m.normals.slice(i*3,i*3+3)),uvs:used.flatMap(i=>m.uvs.slice(i*2,i*2+2)),indices:indices.map(i=>map.get(i)!)};});assert.equal(end,m.indices.length);return parts;});
}
export function architectureClosed(a:Asset){return architectureComponents(a).map(m=>{const edges=new Map<string,number>(),winding=new Map<string,number>();for(let k=0;k<m.indices.length;k+=3){const p=m.indices.slice(k,k+3).map(i=>m.positions.slice(i*3,i*3+3).join(','));for(let j=0;j<3;j++){const x=p[j],y=p[(j+1)%3],key=[x,y].sort().join('|');edges.set(key,(edges.get(key)??0)+1);winding.set(key,(winding.get(key)??0)+(x<y?1:-1));}}return{name:m.name,closed:[...edges.values()].every(v=>v===2),oriented:[...winding.values()].every(v=>v===0)};});}
export function architecturePointRoles(p:Project,a:Asset,point:V3){const roles=new Set<number>(),q=point.map((n,i)=>Math.floor((n-a.origin[i])/a.cellSize))as V3,g=new Grid(a.chunks),native=g.get(q);if(native)roles.add(native);for(const m of architectureComponents(a))if(inside(new Vector3(...point),auditShape(m.name,m.positions,m.indices)))roles.add(m.material);return [...roles];}
/** Check each authored roof-frame column head against another actual roof solid. */
export function architectureRoofSupports(p:Project,a:Assembly){
 const groups=a.source!.instanceGroups as Record<string,string>|undefined;if(!groups||!a.source!.roofForm)return [];
 return a.instances.filter(i=>i.assetId.startsWith('architecture-column-')).map(i=>{const asset=p.assets[i.assetId],h=(asset.source!.parameters as any).h,point:V3=[i.position[0],i.position[1]+h-.01,i.position[2]],contacts:string[]=[];for(const j of a.instances.filter(j=>groups[j.id]==='roof')){const local=rotateY(point.map((v,d)=>v-j.position[d])as V3,(4-j.rotation)%4);const roles=architecturePointRoles(p,p.assets[j.assetId],local);if(roles.some(id=>p.materials[id].solid))contacts.push(j.id);}return{column:i.id,point,contacts,supported:contacts.length>0};});
}
/** Actual added continuous solids versus finite human envelopes. Original stair cells are checked separately. */
export function architectureClearance(p:Project,a:Assembly){
 const origin=a.source?.stairOrigin as V3|undefined;if(!origin)return [];
 const boxes=structureRouteClearances().map(r=>({...r,min:r.min.map((n,i)=>n+origin[i])as V3,max:r.max.map((n,i)=>n+origin[i])as V3}));
 boxes.push({name:'lower side connection',min:[origin[0]-.3,.22,.42],max:[origin[0]+.8,2.12,1.12]},{name:'upper side connection',min:[origin[0]-.3,3.42,.42],max:[origin[0]+2.8,5.32,1.12]});
 const groups=a.source!.instanceGroups as Record<string,string>,stairs=a.instances.filter(i=>groups[i.id]==='stair'&&!p.assets[i.assetId].meshes),native={...p,assets:Object.fromEntries(stairs.map(i=>[i.assetId,p.assets[i.assetId]])),instances:Object.fromEntries(stairs.map(i=>[i.id,i]))};
 const nativeChecks=checkGeometry(native,boxes).clearances;assert.ok(nativeChecks.every(c=>c.clear),JSON.stringify(nativeChecks.filter(c=>!c.clear)));
 const courts=(a.source!.courtOpenings??[])as {min:V3;max:V3}[];for(const[j,c]of courts.entries())boxes.push({name:'full height courtyard '+j,...c});
 return boxes.map(c=>{const box=new Box3(new Vector3(...c.min),new Vector3(...c.max)),blocked:string[]=[];for(const i of a.instances){const asset=p.assets[i.assetId],bb=assetBoundsM(asset)!;const corners=[bb.min,bb.max,[bb.min[0],bb.min[1],bb.max[2]],[bb.max[0],bb.max[1],bb.min[2]]].map(v=>new Vector3(...rotateY(v as V3,i.rotation).map((v,d)=>v+i.position[d])as V3));if(!box.intersectsBox(new Box3().setFromPoints(corners)))continue;for(const m of architectureComponents(asset).filter(m=>m.collision)){const positions:number[]=[];for(let k=0;k<m.positions.length;k+=3)positions.push(...rotateY(m.positions.slice(k,k+3)as V3,i.rotation).map((v,d)=>v+i.position[d]));const shape=auditShape(m.name,positions,m.indices);if(!box.intersectsBox(shape.box))continue;if(shape.ts.some(t=>box.intersectsTriangle(t))||inside(box.getCenter(new Vector3()),shape))blocked.push(i.id+':'+m.name);}}
 return{name:c.name,min:c.min,max:c.max,blocked,clear:blocked.length===0};});
}
