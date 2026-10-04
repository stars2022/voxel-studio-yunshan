import {waterFlow} from '../core/water-flow';
import {Grid} from '../core/grid';
import {meshChunk,displayMesh} from '../core/mesh';
import {voxelEmitters} from '../core/emission';
self.onmessage=e=>{const {id,asset,materials,keys,far=false,replaceAll=false}=e.data;try{const start=performance.now(),g=new Grid(asset.chunks),whole=far||!!asset.meshes||!!asset.sky||!!waterFlow(asset),chunks=whole?[{key:asset.meshes?'hybrid':asset.sky?'sky':far?'far':'flow',buckets:displayMesh(asset,materials,far?'far':'near')}]:keys.map((key:string)=>({key,buckets:meshChunk(g,key,materials,asset.cellSize,asset.origin)})),emitters=voxelEmitters(asset,materials,g);self.postMessage({id,assetId:asset.id,chunks,emitters,replaceAll:replaceAll||whole,durationMs:performance.now()-start});}catch(error:any){self.postMessage({id,error:error.message});}};
