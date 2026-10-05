import type {Assembly,Project,V3} from '../core/types';
import {rotateY} from '../core/types';
import {assetBoundsM,geometryData} from '../core/sky';
export function assemblyGeometryData(p:Project,a:Assembly){return{assets:Object.fromEntries([...new Set(a.instances.map(i=>i.assetId))].sort().map(id=>[id,geometryData(p.assets[id])])),instances:a.instances};}
/** Float32 POSITION storage error depends on component coordinates, not gallery translation. */
export function assemblyExportToleranceM(p:Project,a:Pick<Assembly,'instances'>){const largest=Math.max(...[...new Set(a.instances.map(i=>i.assetId))].map(id=>{const b=assetBoundsM(p.assets[id])!;return Math.max(...b.min.map(Math.abs),...b.max.map(Math.abs));}));return Math.max(5e-6,largest*2**-23+1e-9);}
export function assemblyBoundsM(p:Project,a:Pick<Assembly,'instances'>){const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];for(const i of a.instances){const b=assetBoundsM(p.assets[i.assetId]);if(!b)throw new Error('空组合组件 '+i.assetId);for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]]){const v=rotateY([x,y,z],i.rotation).map((n,d)=>n+i.position[d]);for(let d=0;d<3;d++){min[d]=Math.min(min[d],v[d]);max[d]=Math.max(max[d],v[d]);}}}return{min,max};}
