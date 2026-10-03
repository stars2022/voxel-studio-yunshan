import {Grid} from '../core/grid';
import {inside,type Asset,type Project,type Bounds} from '../core/types';

export function visibleAssetIds(p:Project,mode:'scene'|'asset',assetId:string|null){
 return mode==='asset'?(assetId&&p.assets[assetId]?[assetId]:[]):[...new Set(Object.values(p.instances).map(i=>i.assetId))].filter(id=>!!p.assets[id]);
}
export function meshMaterialSignature(p:Project){
 return JSON.stringify(Object.values(p.materials).map(m=>[m.id,m.opacity<1,m.intensity>0&&m.emissive!=='#000000']));
}
export function displayAsset(a:Asset,layer:number|null,region:Bounds|null):Asset{
 if(layer===null&&!region)return a;
 const g=new Grid(a.chunks),filtered=new Grid();for(const[v,m]of g.cells(region??undefined))if((layer===null||v[1]===layer)&&(!region||inside(v,region)))filtered.set(v,m);
 return{...a,chunks:filtered.serialize()};
}
// Each cache entry retains the snapshot it actually meshed, including hidden assets.
// Comparing against the last global document would miss edits made while hidden.
export function dirtyMeshChunks(old:Asset|undefined,next:Asset,force=false){
 const changed=new Set<string>();const all=force||!old||old.cellSize!==next.cellSize||JSON.stringify(old.origin)!==JSON.stringify(next.origin);
 for(const ck of new Set([...Object.keys(next.chunks),...Object.keys(old?.chunks??{})]))if(all||JSON.stringify(old!.chunks[ck])!==JSON.stringify(next.chunks[ck])){
  changed.add(ck);const b=ck.split(',').map(Number);for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){const n=[...b];n[axis]+=sign;changed.add(n.join(','));}
 }
 return[...changed];
}
export const voxelCount=(a:Asset)=>Object.values(a.chunks).reduce((n,pairs)=>n+pairs.length/2,0);
