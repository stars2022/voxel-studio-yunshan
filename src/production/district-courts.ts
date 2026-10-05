import type {Assembly,Project,V3} from '../core/types';
import {CivicComponent,type Opening} from './civic-components';
import {civicAsset,roof} from './civic-landmarks';
import {modernPlate,modernPost,modernRail,modernStairs} from './metropolis-components';
import {districtBuilder,districtSource,districtHouse,districtWall,wellGuard,thinCanopy,counter,schoolDesk,route,ramp} from './district-components';

export const districtCourtIds=['BUILT-227','BUILT-228','BUILT-229','BUILT-230','BUILT-231'];
const footprint=(x:number,z:number,w=14,d=16):Opening=>({min:[x-w/2,z-d/2],max:[x+w/2,z+d/2]});
export function makeDistrictCourt(p:Project,catalogId:string,id:string,name:string):Assembly{
 const b=districtBuilder(p,id),s=districtSource();
 if(catalogId==='BUILT-227'){
  modernPlate(b,46,40,[0,0,0],[-14,0,14].map(x=>footprint(x,0)));s.houses=[-14,0,14].map((x,j)=>{const h=districtHouse(b,s,'street house '+j,[x,0,0]);counter(b,[x-5,0,0]);return{...h,proposedUse:'ground shop / upper workroom'};});
  districtWall(b,42,3.2,[0,0,16],2,true);for(const x of[-21,21])districtWall(b,8,3.2,[x,0,12],x<0?3:1,true);thinCanopy(b,42,4,[0,0,-10.2],[-18,-10,-4,4,10,18],3.6,false);
  route(s,'continuous street wall',[[-20,0,-10.2],[20,0,-10.2]]);route(s,'real rear court',[[-20,0,12],[20,0,12]]);for(const x of[-14,0,14])route(s,'rear door '+x,[[x+4,0,6.5],[x,0,6.5],[x,0,8.5],[x,0,12]]);s.houseCount=3;s.rearCourt={bounds:[[-21,8],[21,16]],walkY:0};s.scatteredCityBuildingsClaimed=false;
 }else if(catalogId==='BUILT-228'){
  // A real 45-degree clipped corner, not a quarter-turned rectangular facade.
  const well:Opening={min:[-8,0],max:[-2.4,8.4]},clip=(points:[number,number][])=>{const out:[number,number][]=[];for(let j=0;j<points.length;j++){const a=points[j],d=points[(j+1)%points.length],fa=a[0]-a[1]-12,fb=d[0]-d[1]-12;if(fa<=1e-9)out.push(a);if((fa<0&&fb>0)||(fa>0&&fb<0)){const t=fa/(fa-fb);out.push([a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t]);}}return out;};
  modernPlate(b,34,34,[0,0,0],[{min:[-12,-8],max:[12,12]}]);
  for(const y of[0,4.2,8.4]){const aid=civicAsset(b,'chamfer-floor-'+y,id=>{const c=new CivicComponent(p,id,'真实斜切街角楼板与贯通梯井',['BUILT-003','BUILT-001'],{w:24,d:20,holes:y===4.2?[well]:[],depth:.4,authorCornerDegrees:45});const xs=[-12,-8,-2.4,4,12],zs=[-8,0,8.4,12];for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){if(y===4.2&&i===1&&j===1)continue;const poly=clip([[xs[i],zs[j]],[xs[i+1],zs[j]],[xs[i+1],zs[j+1]],[xs[i],zs[j+1]]]);if(poly.length<3)continue;c.slab('斜切结构板','structuralConcrete',poly.map(([x,z])=>[x,-.06,z]),.34);c.slab('斜切石铺面','stone',poly.map(([x,z])=>[x,0,z]),.06);}c.pin('街角板销','bronze',[-11.9,-.02,-7.9]);return c.finish();});b.place(aid,[0,y,0],0,y===8.4?'roof':'floor');}
  // Fill the triangular sidewalk left by the chamfer; the rest of the plaza excludes the complete rectangle.
  const corner=civicAsset(b,'chamfer-sidewalk',id=>{const c=new CivicComponent(p,id,'斜角门前真实三角街面',['BUILT-003'],{});c.slab('三角铺面','stone',[[4,0,-8],[12,0,-8],[12,0,0]],.4);return c.finish();});b.place(corner,[0,0,0],0,'walk');
  for(const y of[0,4.2]){districtWall(b,16,4.2,[-4,y,-8],0,y===0);districtWall(b,24,4.2,[0,y,12],2,false);districtWall(b,20,4.2,[-12,y,2],3,false);districtWall(b,12,4.2,[12,y,6],1,false);const diag=civicAsset(b,'chamfer-door-'+y,id=>{const c=new CivicComponent(p,id,'沿真实斜角的门窗与连续过梁',['BUILT-015','BUILT-017'],{door:y===0,cornerDegrees:45});const u:V3=[Math.SQRT1_2,0,Math.SQRT1_2],point=(t:number,h:number):V3=>[8+u[0]*t,h,-4+u[2]*t],half=Math.sqrt(32);for(const [lo,hi]of(y===0?[[-half,-1.8],[1.8,half]]:[[-half,half]])){c.beam('斜面窗下实墙','wall',point(lo,.425),point(hi,.425),.28,.85);c.beam('独立斜窗玻璃','glass',point(lo+.14,2),point(hi-.14,2),.018,2.1);for(const t of[lo,hi])c.beam('斜窗木立梃','wood',point(t,0),point(t,4.2),.18,.28);c.beam('斜窗顶实墙','wall',point(lo,3.65),point(hi,3.65),.28,.50);}c.beam('通长斜角过梁','woodEdge',point(-half,4.05),point(half,4.05),.4,.30);if(y===0)c.beam('真门洞上梁','woodEdge',point(-1.8,3.1),point(1.8,3.1),.35,.20);c.pin('斜角最小销','bronze',[4.02,4.06,-7.98]);return c.finish();});b.place(diag,[0,y,0],0,'facade');}
  modernStairs(b,4.2,[-7.8,0,0]);wellGuard(b,well,4.2);counter(b,[5,0,6]);route(s,'diagonal actual corner entrance',[[10,0,-6],[8,0,-4],[6,0,-2],[0,0,-2],[-6.6,0,-2],[-6.6,0,-.2]]);route(s,'corner upper landing',[[-3.8,4.2,-.2],[-3.8,4.2,-2],[4,4.2,-2]]);route(s,'corner sightline sidewalk',[[13,0,-7],[10,0,-7],[10,0,-6],[13,0,-3]]);s.chamfer={angleDegrees:45,doorCenter:[8,0,-4],realDoorWidth:3.6};s.originalContourBound=false;
 }else if(catalogId==='BUILT-229'){
  const sites=[[-14,0],[14,0],[-14,16],[0,16],[14,16]];modernPlate(b,48,60,[0,0,0],sites.map(([x,z])=>footprint(x,z)));s.houses=sites.map(([x,z],j)=>{const h=districtHouse(b,s,'connected house '+j,[x,0,z]);counter(b,[x-5,0,z]);return{...h,proposedZone:j<2?'public-workshop':'private-residence',permissions:'unbound'};});
  districtWall(b,14,3.2,[0,0,-8],0,true);thinCanopy(b,14,4,[0,0,-5.8],[-6,6],3.6,false);modernPlate(b,6,4,[0,1.2,4],[],1.6);ramp(b,'court-garden',[-4.2,0,-2],[-4.2,1.2,4],2.2);modernPlate(b,2.4,2,[-4.2,1.2,5]);for(const z of[2,6])modernRail(b,6,[-3,1.2,z]);modernRail(b,4,[3,1.2,2],3);
  route(s,'courtyard actual public gate',[[0,0,-10],[0,0,-8],[0,0,-4],[4.5,0,-4],[4.5,0,6],[6,0,6]]);route(s,'terrace continuous ramp',[[-4.2,0,-2],[-4.2,1.2,4],[-4.2,1.2,5],[-1,1.2,5]]);s.houseCount=5;s.sourceAllowedHouseCount=[3,8];s.grammar='Two front wings plus three linked rear houses enclose a real gate court, covered entrance and raised garden terrace';s.originalPrivatePublicPermissionsBound=false;
 }else if(catalogId==='BUILT-230'){
  modernPlate(b,72,68,[0,0,0]);const hole:Opening={min:[-2.8,-14],max:[2.8,-5.6]};modernPlate(b,40,28,[0,4.2,14],[hole],4.6);modernStairs(b,4.2,[-2.6,0,0]);wellGuard(b,{min:[-2.8,0],max:[2.8,8.4]},4.2);modernPlate(b,10,3,[0,4.2,-1.5]);for(const x of[-4,4])modernPost(b,3.8,.4,[x,0,-2]);modernRail(b,10,[-5,4.2,-3]);
  for(const x of[-26,26]){modernPlate(b,12,28,[x,3.8,14],[],4.2);for(const z of[1,27])modernPlate(b,12,2,[x,4.2,z]);districtHouse(b,s,'terrace wing '+x,[x,4.2,14],12,24,2,false,undefined,false);}
  districtWall(b,64,3.2,[0,0,-28],0,true);for(const x of[-32,32]){districtWall(b,28,3.2,[x,0,-14],x<0?3:1,true);districtWall(b,28,3.2,[x,4.2,14],x<0?3:1,true);}districtWall(b,64,3.2,[0,4.2,28],2,true);thinCanopy(b,40,5,[0,4.2,24],[-18,-6,6,18],3.6,false);
  route(s,'lower entry and real terrace stairs',[[0,0,-30],[0,0,-28],[0,0,-6],[-1.4,0,-6],[-1.4,0,-.2]]);route(s,'upper return landing to courtyard',[[1.4,4.2,-.2],[1.4,4.2,-1.5],[4,4.2,-1.5],[4,4.2,12],[0,4.2,12],[0,4.2,24],[0,4.2,28.5]]);modernPlate(b,6,4,[0,4.2,30],[],4.6);s.terraces=[{walkY:0,bounds:[[-32,-28],[32,0]]},{walkY:4.2,bounds:[[-32,0],[32,28]],foundationDepth:4.6}];s.authorSteppedGround=true;s.originalTerrainReplaced=false;
 }else if(catalogId==='BUILT-231'){
  const sites=[[-18,-12],[18,-12],[-18,12],[18,12]];modernPlate(b,52,56,[0,0,0],sites.map(([x,z])=>footprint(x,z,12,16)));s.classroomWings=sites.map(([x,z],j)=>{const h=districtHouse(b,s,'classroom wing '+j,[x,0,z],12,16,2,false,undefined,false);for(const y of[0,4.2]){for(const dz of[-2,1,4])schoolDesk(b,[x-4.5,y,z+dz]);counter(b,[x+4.5,y,z+3]);}return{...h,proposedUses:['classroom','reading-room'],permissions:'unbound',actualDesksPerFloor:3};});
  districtWall(b,48,3.2,[0,0,-24],0,true);districtWall(b,24,3.2,[0,0,0],0,true);districtWall(b,48,3.2,[0,0,24],2,true);for(const z of[-22,2,22])thinCanopy(b,24,4,[0,0,z],[-10,-5,5,10],3.6,false);
  // Four side galleries join the two courts without filling their open centres.
  for(const x of[-10,10])for(const z of[-10,12])thinCanopy(b,4,18,[x,0,z],[-1.5,1.5],3.6,false);
  route(s,'front gate first court second gate second court',[[0,0,-26],[0,0,-24],[0,0,-10],[0,0,0],[0,0,12],[0,0,24],[0,0,26]]);for(const[x,z]of sites)route(s,'classroom covered approach '+x+' '+z,[[0,0,z-10],[x,0,z-10],[x,0,z-8]]);s.courts=[{center:[0,0,-12],openToSky:true},{center:[0,0,12],openToSky:true}];s.governmentHallRelabelled=false;s.schoolControllerAndPermissionsBound=false;
 }else throw new Error('Unknown district court');
 return b.finish(catalogId,name,s);
}
