import {parentPort,workerData} from 'node:worker_threads';
import {loadMesh,diagnoseMesh,voxelize} from './converter';
try{const mesh=await loadMesh(workerData.source,workerData.options.scale,workerData.options.upAxis);const diagnostics=diagnoseMesh(mesh,workerData.options.cellSize);parentPort!.postMessage({type:'diagnostics',diagnostics});
 if(workerData.inspect)parentPort!.postMessage({type:'result',result:{diagnostics,triangles:mesh.triangles.map(t=>({points:t.points,color:t.color}))}});
 else {const result=await voxelize(mesh,workerData.options,value=>parentPort!.postMessage({type:'progress',value}));parentPort!.postMessage({type:'result',result});}
}catch(error:any){parentPort!.postMessage({type:'error',error:error.message,diagnostics:error.diagnostics});}
