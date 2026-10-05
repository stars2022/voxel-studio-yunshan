import type {Project,Instance} from '../core/types';

/** Explicit export sidecar only. Selecting a distant visual form does not bind runtime physics. */
export function terrainAuthorityInstances(p:Project):Instance[]|undefined{
 const bindings=new Map<string,string>();
 for(const a of Object.values(p.assemblies??{}))for(const b of(a.source?.physicalAuthorityBindings??[])as {visualAssetId:string;collisionAssetId:string}[]){
  if(!p.assets[b.visualAssetId]||!p.assets[b.collisionAssetId])throw new Error('Terrain authority asset missing');
  if(bindings.has(b.visualAssetId)&&bindings.get(b.visualAssetId)!==b.collisionAssetId)throw new Error('Conflicting terrain authority bindings');
  bindings.set(b.visualAssetId,b.collisionAssetId);
 }
 if(!bindings.size)return;
 // Match shared asset IDs, not local template instance IDs: repeated, translated and rotated placements remain exact.
 return Object.values(p.instances).map(i=>({...i,assetId:bindings.get(i.assetId)??i.assetId}));
}
