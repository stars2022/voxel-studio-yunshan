import {Grid} from '../core/grid';
import {meshChunk} from '../core/mesh';
import {voxelEmitters} from '../core/emission';
self.onmessage=e=>{const {id,asset,materials,keys}=e.data;try{const start=performance.now(),g=new Grid(asset.chunks),chunks=keys.map((key:string)=>({key,buckets:meshChunk(g,key,materials,asset.cellSize,asset.origin)})),emitters=voxelEmitters(asset,materials,g);self.postMessage({id,assetId:asset.id,chunks,emitters,durationMs:performance.now()-start});}catch(error:any){self.postMessage({id,error:error.message});}};
