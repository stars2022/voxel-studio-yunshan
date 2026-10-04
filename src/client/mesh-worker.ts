import {Grid} from '../core/grid';
import {meshChunk,meshAsset,mergeCoplanarMesh} from '../core/mesh';
import {voxelEmitters} from '../core/emission';
self.onmessage=e=>{const {id,asset,materials,keys,far=false,replaceAll=false}=e.data;try{const start=performance.now(),g=new Grid(asset.chunks),chunks=far?[{key:'far',buckets:mergeCoplanarMesh(asset,meshAsset(asset,materials))}]:keys.map((key:string)=>({key,buckets:meshChunk(g,key,materials,asset.cellSize,asset.origin)})),emitters=voxelEmitters(asset,materials,g);self.postMessage({id,assetId:asset.id,chunks,emitters,replaceAll:replaceAll||far,durationMs:performance.now()-start});}catch(error:any){self.postMessage({id,error:error.message});}};
