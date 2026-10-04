import {assetBoundsM} from '../core/sky';
import {Grid} from '../core/grid';
import type {Project,V3} from '../core/types';

/** Preserve each master's grid when laying out a mixed-precision gallery.
 * Positions use a common metre lattice; cells are never resampled. */
export function layoutAtlasGallery(p:Project){
 const instances=Object.values(p.instances),limits=instances.map(i=>({i,a:p.assets[i.assetId],b:assetBoundsM(p.assets[i.assetId])!}));
 if(!limits.length)return;
 const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
 const ticks=limits.map(({a})=>{const t=Math.round(a.cellSize*1e6);if(!t||Math.abs(t/1e6-a.cellSize)>1e-10)throw new Error('图册格距须能以微米表示');return t;});
 const common=ticks.reduce((a,b)=>a/gcd(a,b)*b)/1e6;
 if(!Number.isFinite(common)||common>100)throw new Error('图册格距的公倍格过大');
 // Display neighbours are independent masters. Keep them beyond the largest
 // collision-neighbour margin, including coarse airfield slabs beside fine trim.
 const gap=Math.max(.5,Math.max(...limits.map(({a})=>a.cellSize))*1.51+common);
 const strideX=Math.ceil((Math.max(...limits.map(({a,b})=>(b.max[0]-b.min[0])))+gap)/common)*common;
 const strideZ=Math.ceil((Math.max(...limits.map(({a,b})=>(b.max[2]-b.min[2])))+gap)/common)*common;
 for(const[j,{i,a,b}]of limits.entries())i.position=[j%4*strideX,0,Math.floor(j/4)*strideZ].map((n,k)=>Math.round((n-b.min[k])*1e8)/1e8) as V3;
}
