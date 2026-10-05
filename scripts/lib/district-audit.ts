import type {V3} from '../../src/core/types';
import {CivicAudit} from './civic-audit';
import type {WalkRoute} from '../../src/production/district-components';

/** Finite body boxes and real under-foot solids on every authored route, including seams. */
export function districtClearance(a:CivicAudit){
 const checks:ReturnType<CivicAudit['clear']>[]=[],contacts:{name:string;point:V3;contacts:ReturnType<CivicAudit['point']>;supported:boolean}[]=[];
 for(const r of (a.assembly.source!.routes??[])as WalkRoute[])for(let j=1;j<r.points.length;j++){
  const from=r.points[j-1],to=r.points[j],distance=Math.hypot(...to.map((n,d)=>n-from[d])),count=Math.max(1,Math.ceil(distance/.5)),width=r.width??.45,plan=Math.hypot(to[0]-from[0],to[2]-from[2]),slope=plan?Math.abs(to[1]-from[1])/plan:0;
  for(let k=0;k<=count;k++){const v=from.map((n,d)=>n+(to[d]-n)*k/count)as V3,name=r.name+' '+j+':'+k,point:V3=[v[0],v[1]-.02,v[2]],hits=a.point(point,undefined,true);contacts.push({name,point,contacts:hits,supported:!!hits.length});checks.push(a.clear(name,[v[0]-width/2,v[1]+.025+slope*width/2,v[2]-width/2],[v[0]+width/2,v[1]+1.9,v[2]+width/2]));}
 }
 const groups=a.assembly.source!.instanceGroups as Record<string,string>;for(const i of a.assembly.instances.filter(i=>groups[i.id]==='column')){const point=a.world(i,[0,-.02,0]),hits=a.point(point,i.id,true);contacts.push({name:'actual column foot '+i.id,point,contacts:hits,supported:!!hits.length});}
 const id=a.assembly.source!.catalogId;if(id==='BUILT-236')checks.push(a.clear('independent full three-metre canopy passage',[-19,.025,-1.5],[19,2.2,1.5]));
 if(id==='BUILT-239'){for(const x of[1,7])for(const z of[-5,5])checks.push(a.clear('unpowered magnetic air gap '+x+','+z,[x-.4,1.75,z-.9],[x+.4,2.85,z+.9]));}
 if(id==='BUILT-265'){for(const x of[-16,16])checks.push(a.clear('roof actual skylight throat '+x,[x-3.8,8.26,-2.8],[x+3.8,8.55,2.8]));}
 return{checks,contacts,sampling:{maximumRouteStepM:.5,bodyHeightM:1.9,defaultBodyWidthM:.45,footSampleDepthM:.02,slopeBottomAllowance:'0.025m + half body width times actual slope; avoids counting the same sloping walking surface as a torso obstruction'}};
}
