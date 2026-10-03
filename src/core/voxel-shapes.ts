import {Grid} from './grid';
import {dirs,eachCell, type V3} from './types';

// Decimal metre dimensions often land on a half-cell. Stabilise tie-breaking
// across equivalent sums such as .5-.33 and .17 so touching parts stay touching.
export const voxelIndex=(metres:number,pitch:number)=>Math.round(metres/pitch+1e-8);

/** A one-cell path whose consecutive cells share a face, including diagonal branches.
 * Endpoints are metres in the asset's local frame. No detached diagonal-only steps. */
export function connectedLine(g:Grid, s:number, start:V3, end:V3, material:number){
 const a=start.map(n=>voxelIndex(n,s)) as V3,b=end.map(n=>voxelIndex(n,s)) as V3,p=[...a] as V3;
 const distance=b.map((n,i)=>Math.abs(n-a[i])),step=b.map((n,i)=>Math.sign(n-a[i])),crossed=[0,0,0];
 g.set(p,material);
 for(let remaining=distance.reduce((n,d)=>n+d,0);remaining>0;remaining--){
  let axis=0,t=Infinity;
  for(let i=0;i<3;i++)if(crossed[i]<distance[i]){const next=(crossed[i]+.5)/distance[i];if(next<t){axis=i;t=next;}}
  p[axis]+=step[axis];crossed[axis]++;g.set(p,material);
 }
}

/** An oriented solid leaf, sampled into cells. A connected midrib joins it to its petiole. */
export function voxelLeaf(g:Grid,s:number,base:V3,length:number,width:number,azimuth:number,tilt:number,material:number){
 const leaf=new Grid();
 const forward:V3=[Math.cos(azimuth)*Math.cos(tilt),Math.sin(tilt),Math.sin(azimuth)*Math.cos(tilt)];
 const side:V3=[-Math.sin(azimuth),0,Math.cos(azimuth)];
 const normal:V3=[-Math.cos(azimuth)*Math.sin(tilt),Math.cos(tilt),-Math.sin(azimuth)*Math.sin(tilt)];
 const center=base.map((n,i)=>n+forward[i]*length*.5) as V3,r=[length*.55,width*.5,Math.max(s*.8,.012)];
 const extent=[0,1,2].map(i=>Math.abs(forward[i])*r[0]+Math.abs(side[i])*r[1]+Math.abs(normal[i])*r[2]);
 const min=center.map((n,i)=>Math.floor((n-extent[i])/s)) as V3,max=center.map((n,i)=>Math.ceil((n+extent[i])/s)+1) as V3;
 eachCell({min,max},v=>{
  const delta=v.map((n,i)=>(n+.5)*s-center[i]),dot=(axis:V3)=>delta.reduce((sum,n,i)=>sum+n*axis[i],0);
  if((dot(forward)/r[0])**2+(dot(side)/r[1])**2+(dot(normal)/r[2])**2<=1)leaf.set(v,material);
 });
 connectedLine(leaf,s,base,base.map((n,i)=>n+forward[i]*length*.9) as V3,material);
 // Discard disconnected rasterisation specks at the rim, retaining the connected midrib.
 const queue:V3[]=[base.map(n=>Math.round(n/s)) as V3],seen=new Set<string>();
 for(let i=0;i<queue.length;i++){
  const v=queue[i],key=v.join(',');if(seen.has(key)||!leaf.get(v))continue;
  seen.add(key);g.set(v,material);
  for(const d of dirs)queue.push(v.map((n,k)=>n+d[k]) as V3);
 }
}

/** Thin tapered blade with a curved midrib. Every half-row touches the midrib;
 * rasterisation never inflates a leaf into an ellipsoid or leaves floating edge cells. */
export function bladeLeaf(g:Grid,s:number,base:V3,length:number,width:number,angle:number,tilt:number,material:number,curl=.006){
 const forward:V3=[Math.cos(angle)*Math.cos(tilt),Math.sin(tilt),Math.sin(angle)*Math.cos(tilt)],side:V3=[-Math.sin(angle),0,Math.cos(angle)];
 const steps=Math.max(3,Math.ceil(length/(s*.55)));let previous=base;
 for(let row=0;row<=steps;row++){
  const t=row/steps,half=width*.5*Math.pow(Math.sin(Math.PI*t),.8)*(1-.2*t);
  const center=base.map((n,i)=>n+forward[i]*length*t+(i===1?curl*Math.sin(Math.PI*t)-curl*.45*t*t:0)) as V3;
  connectedLine(g,s,previous,center,material);previous=center;
  for(const sign of[-1,1]){
   const edge=center.map((n,i)=>n+sign*side[i]*half+(i===1?curl*.35*Math.sin(Math.PI*t):0)) as V3;
   connectedLine(g,s,center,edge,material);
  }
 }
}
