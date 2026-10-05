import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {modernPlate,modernRoof,modernPost,modernStairs,modernRail} from './metropolis-components';
import {districtWell,districtWall,wellGuard,districtHouse,route,shiftNew,perimeterGuard} from './district-components';
import {fleetSource,fleetPart,passengerSeat,type FleetSource} from './fleet-components';
import {passengerAircraft} from './fleet-vehicles';
export const fleetAirportIds=['BUILT-266','BUILT-267','BUILT-271','BUILT-275'];
function airportAircraft(b:ArchitectureBuilder,s:FleetSource,key:string,at:V3,boarding=true){const start=b.instances.length,t=fleetSource(),plane=passengerAircraft(b,t,'airliner',boarding),move=(v:V3)=>v.map((n,d)=>n+at[d])as V3;shiftNew(b,start,at);for(const r of t.routes)s.routes.push({...r,name:key+' '+r.name,points:r.points.map(move)});for(const r of t.walkSamples)s.walkSamples.push({...r,name:key+' '+r.name,point:move(r.point)});for(const r of t.contacts)s.contacts.push({...r,name:key+' '+r.name,point:move(r.point)});for(const r of t.clearBoxes)s.clearBoxes.push({...r,name:key+' '+r.name,min:move(r.min),max:move(r.max)});s.driverEyes.push(...t.driverEyes.map(move));return{...plane,offset:at,instanceIds:b.instances.slice(start).map(i=>i.id)};}
export function makeFleetAirport(p:Project,catalogId:string,id:string,name:string){
 const b=new ArchitectureBuilder(p,id),s=fleetSource();
 if(catalogId==='BUILT-266'){
  modernPlate(b,28,32,[0,0,0]);const levels=[];
  for(let f=0;f<8;f++){const y=f*4.2,w=f===7?16:10,d=f===7?18:14;modernPlate(b,w,d,[0,y,0],f?[districtWell]:[]);for(const[width,x,z,rot]of[[w,0,-d/2,0],[w,0,d/2,2],[d,-w/2,0,3],[d,w/2,0,1]])districtWall(b,width,4.2,[x,y,z],rot,f===0&&rot===0,true);if(f<7)modernStairs(b,4.2,[-2.6,y,-4.2]);if(f)wellGuard(b,districtWell,y);route(s,'tower floor '+f,[[1.4,y,-4.5],[1.4,y,-d/2+1]]);levels.push(y);}
  modernRoof(b,16,18,[0,33.6,0],2.2);route(s,'tower ground entry',[[0,0,-8],[0,0,-6],[1.4,0,-6],[1.4,0,-4.5]]);
  // Real corbels carry the projecting glass control floor from the shaft faces.
  fleetPart(b,'control-tower-head-corbel','外挑管制层钢斜撑与连续承梁',['BUILT-059'],{},c=>{for(const x of[-4.8,4.8])for(const z of[-6.8,6.8])c.beam('真实管制层外挑斜撑','metal',[x,25.2,z],[Math.sign(x)*7.5,29.1,Math.sign(z)*8.3],.32,.32);for(const z of[-8.3,8.3])c.box('管制层底横梁','metal',-7.7,28.9,z-.2,15.4,.3,.4);});
  fleetPart(b,'tower-control-desks','管制席控制台与未绑定屏面',[],{contentBound:false},c=>{for(const x of[-5.8,5.8]){c.box('控制席台体','vehicleControl',x-.6,29.4,4,.0+1.2,.85,2.4);c.box('未绑定控制光学面','vehicleInactiveOptic',x-.5,30.25,4.1,1,.016,2.2);}});for(const x of[-5.8,5.8])passengerSeat(b,[x,29.4,3.25],false,2);
  s.controlTower={levels,controlFloorY:29.4,shaftFootprint:[10,14],headFootprint:[16,18],independentFromTerminal:true};
 }else if(catalogId==='BUILT-267'){
  modernPlate(b,86,68,[0,0,0]);modernPlate(b,100,18,[0,0,45]);modernPlate(b,14,2,[0,0,35]);
  districtHouse(b,s,'apron-service-terminal',[0,0,-27],40,10,1,true,undefined,true);
  const stands=[];for(const x of[-20,20]){const plane=airportAircraft(b,s,'stand '+x,[x,0,0]);stands.push({authorId:'stand-'+(x<0?'west':'east'),center:[x,0,0],envelope:{min:[x-11.2,0,-12.2],max:[x+11.2,6.4,12.2]},plane});s.clearBoxes.push({name:'real wing and fin stand envelope '+x,min:[x-11.2,.05,-12.2],max:[x+11.2,6.4,12.2],exclude:plane.instanceIds});}
  fleetPart(b,'apron-shared-markings','同源滑行线、机位实涂边与航站步行界面',['BUILT-170'],{markings:'authored paint; identities and original routes absent'},c=>{for(const x of[-20,20]){c.box('实涂机位中心线','airfieldYellow',x-.06,.001,12.5,.12,.003,10);c.box('机位停靠短线','airfieldYellow',x-2,.001,-12.5,4,.003,.12);}c.box('共享横向滑行线','airfieldYellow',-20,.001,22.44,40,.003,.12);c.box('共享跑道连接线','airfieldYellow',-.06,.001,22.5,.12,.003,22.5);for(let x=-45;x<45;x+=10)c.box('跑道中心短划','airfieldWhite',x,.001,44.5,6,.003,1);});
  route(s,'terminal apron pedestrian connection',[[0,0,-23],[0,0,-21],[0,0,-16],[0,0,20]]);s.apron={stands,taxiRoute:[[0,0,45],[0,0,22.5],[-20,0,22.5],[20,0,22.5]],runwayY:0,terminalDoor:[0,0,-22],sharedAuthorGeometry:true,sourceSharedDescriptorBound:false};
 }else if(catalogId==='BUILT-271'){
  modernPlate(b,78,64,[10,0,-5]);modernPlate(b,48,38,[0,0,0]);
  districtWall(b,48,10,[0,0,19],2,false,true);districtWall(b,38,10,[-24,0,0],3,false,true);districtWall(b,38,10,[24,0,0],1,true,true);
  fleetPart(b,'hangar-actual-door','机库真实净门及固定收起门板',['BUILT-015'],{clearWidth:30,clearHeight:8.4,doorState:'static raised'},c=>{for(const x of[-24,15])c.box('机库门侧实体','architecturalCladding',x,0,-19,9,10,.35);c.box('门洞跨梁','metal',-15,8.4,-19.15,30,.5,.6);c.box('固定收起门板','architecturalCladding',-15,8.95,-19.18,30,1.05,.18);});modernRoof(b,48,38,[0,10,0],2.4,'gable');
  const plane=airportAircraft(b,s,'hangar aircraft',[0,0,0]);s.clearBoxes.push({name:'actual aircraft swept entry clearance',min:[-11.2,.05,-28],max:[11.2,6.4,12.2],exclude:plane.instanceIds});
  districtHouse(b,s,'hangar-service-wing',[32,0,0],12,14,1,true);route(s,'hangar maintenance doorway',[[23,0,0],[25,0,0],[25,0,-8],[32,0,-8]]);s.hangar={opening:{width:30,height:8.4,z:-19},actualAircraft:plane,serviceWingOriginalProgramBound:false};
 }else if(catalogId==='BUILT-275'){
  modernPlate(b,44,44,[0,0,0]);modernPlate(b,30,32,[0,4.2,-1],[{min:[-2.8,-14],max:[2.8,-5.6]}],.6);modernStairs(b,4.2,[-2.6,0,-15]);wellGuard(b,{min:[-2.8,-15],max:[2.8,-6.6]},4.2);
  for(const x of[-12,-6,6,12])for(const z of[-12,0,12])modernPost(b,3.6,.8,[x,0,z]);
  for(const z of[-17,15])modernRail(b,30,[-15,4.2,z]);for(const x of[-15,15])modernRail(b,32,[x,4.2,-17],3);
  fleetPart(b,'starport-pad-and-service','实体停泊标记与三座开放勤务架',['BUILT-181'],{padEnvelope:[16,18],powered:false},c=>{for(const x of[-8,8])c.box('实涂停泊侧边','airfieldYellow',x-.05,4.201,-5,.1,.003,18);for(const z of[-5,13])c.box('实涂停泊端边','airfieldYellow',-8,4.201,z,16,.003,.1);for(const x of[-11,0,11]){for(const xx of[x-.7,x+.7])c.box('勤务架实立柱','metal',xx-.1,4.2,13.6,.2,7,.2);c.box('勤务架顶横梁','metal',x-.8,11.0,13.6,1.6,.2,.2);c.box('未绑定供能硬接口','coilInsulator',x-.3,4.8,13.35,.6,.7,.25);c.pin('勤务架最小锁销','bronze',[x-.7,11.06,13.62]);}});
  route(s,'launch deck from stair',[[1.4,4.2,-15.5],[1.4,4.2,-13.8]]);
  route(s,'starport upper connection',[[1.4,4.2,-15.5],[4,4.2,-15.5],[4,4.2,-10],[4,4.2,0],[0,4.2,0]]);route(s,'starport stair lower approach',[[-1.4,0,-17],[-1.4,0,-14]]);
  s.starport={walkY:4.2,authorParkingEnvelope:{min:[-8,4.2,-5],max:[8,10.2,13]},actualStair:true,originalFlightAndForceBound:false};
 }else throw new Error('Unknown fleet airport');
 return b.finish(catalogId,name,s);
}
