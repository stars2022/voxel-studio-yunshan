import type {V3} from '../../src/core/types';
import {CivicAudit} from './civic-audit';

/** Finite checks against actual closed component triangles AND native physical cells. */
export function metropolisClearance(a:CivicAudit){const s=a.assembly.source as any,id=s.catalogId,checks:ReturnType<CivicAudit['clear']>[]=[],contacts:{name:string;point:V3;supported:boolean;hits:ReturnType<CivicAudit['point']>}[]=[];
 const contact=(name:string,point:V3,exclude?:string)=>{const hits=a.point(point,exclude,true);contacts.push({name,point,supported:!!hits.length,hits});};
 const walk=(name:string,p:V3,height=1.9)=>{checks.push(a.head(name,p,.45,height));contact(name,[p[0],p[1]-.02,p[2]]);};
 if(id==='BUILT-166'){for(let j=0;j<=60;j++)walk('author-705m-road-'+j,[5+705*j/60,14.6,0]);for(const x of[4.7,5.3,709.7,710.3,711])walk('actual-road-end-seam-'+x,[x,14.6,0]);for(const z of[19.8,20.2,21.5,22.8,23.2])walk('ground-terminal-to-observation-tower-'+z,[-20,0,z]);}
 if(id==='BUILT-181')for(let j=0;j<=20;j++){const t=j/20;walk('continuous-pad-ramp-'+j,[0,t*.2,-7.5+4*t]);}
 if(id==='BUILT-184'||id==='BUILT-185'){
  for(const x of[-.6,-.3,0,.3])walk('finite-open-entry-footwell-'+x,[x,.9,0],1.8);
  for(const instance of s.feet){const i=a.assembly.instances.find(v=>v.id===instance)!;contact('actual-leg-head-'+instance,a.world(i,[.1,.8,.1]),instance);}
  if(id==='BUILT-184')for(const arm of s.arms){contact('actual-arm-body-root-'+arm.instance,arm.from,arm.instance);const v=arm.hub as V3;checks.push(a.clear('conservative-static-rotor-disc-box-'+arm.instance,[v[0]-1.01,1.83,v[2]-1.01],[v[0]+1.01,1.94,v[2]+1.01],[arm.instance]));}
  if(id==='BUILT-185'){for(const x of[-1.2,1.2])checks.push(a.clear('power-duct-'+x,[x-.10,1.12,1.5],[x+.10,1.48,2.8]));for(const z of[.15,2.85])contact('wing-root-'+z,[0,z===.15?.8:1.6,z]);}
 }
 if(id==='BUILT-204'){
  for(let j=0;j<=151;j++)walk('author-453m-deck-'+j,[144+453*j/151,254.6,27.5]);for(const seg of s.authorBridge.segments.slice(0,-1)){const x=seg.to[0];for(const dx of[-.03,.03,.17,.23])walk('actual-expansion-joint-'+x+'-'+dx,[x+dx,254.6,27.5]);}
  for(const x of[140,143.8,144.2,596.8,597.2,610])walk('actual-lift-and-station-seam-'+x,[x,254.6,27.5]);for(const z of[35,33.2,33,32.6,32.4,30])walk('actual-lift-top-boarding-'+z,[140,254.6,z]);
 }
 if(id==='BUILT-211'){for(let j=0;j<=102;j++)walk('author-51m-market-street-'+j,[-25.5+j*.5,1.2,-6]);for(const x of[-18,0,18])for(const z of[6.5,7,7.5,9])walk('upper-shop-entry-'+x+'-'+z,[x,4.4,z]);}
 if(id==='BUILT-220'||id==='BUILT-222'){const y=s.crown.upperWalkY;for(const x of[-5,0,5])walk('usable-crown-upper-deck-'+x,[x,y,-6]);}
 if(id==='BUILT-221'){for(const y of[0,4.2,8.4])for(const z of[-21,-19, -12]){if(y&&z===-21)continue;walk('podium-public-floor-'+y+'-'+z,[0,y,z]);}for(const y of[4.2,8.4,12.6])checks.push(a.clear('actual-atrium-opening-'+y,[-5,y-.38,-3],[5,y+.2,3]));}
 if(id==='BUILT-222'){for(const [y,x,z]of[[12.6,21,0],[151.2,16,0],[201.6,12,0]])walk('main-setback-terrace-'+y,[x,y,z]);}
 if(id==='BUILT-223')for(const t of s.towers){for(let j=1;j<t.tiers.length;j++){const old=t.tiers[j-1],next=t.tiers[j],y=t.position[1]+t.tiers.slice(0,j).reduce((n:number,v:any)=>n+v.floors,0)*4.2;const front=old.dz-old.d/2,nextFront=next.dz-next.d/2,z=(front+nextFront)/2;if(nextFront-front>.7)walk('secondary-setback-'+t.key+'-'+j,[t.position[0]+next.dx,t.position[1]+y,t.position[2]+z]);}}
 return{checks,contacts,scope:'Finite authored foot/head boxes, actual material solids, preserved native legs and component contact surfaces; no motion controller, strength, aircraft physics or original lower-bridge collision certification.'};}
