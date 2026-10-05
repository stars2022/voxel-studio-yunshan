import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import {fleetSource,fleetPart,fleetCabin,boardingStair,annulus,type FleetSource} from './fleet-components';
import {passengerAircraft} from './fleet-vehicles';
import {modernPlate} from './metropolis-components';
import {route,shiftNew} from './district-components';
export const airportServiceIds=['BUILT-298','BUILT-299'];

function parkedAircraft(b:ArchitectureBuilder,s:FleetSource,key:string,offset:V3){
 const other=fleetSource(),start=b.instances.length,plane=passengerAircraft(b,other,key,false),move=(v:V3)=>v.map((n,d)=>n+offset[d])as V3;shiftNew(b,start,offset);
 s.routes.push(...other.routes.map(r=>({...r,points:r.points.map(move)})));s.contacts.push(...other.contacts.map(r=>({...r,point:move(r.point)})));s.clearBoxes.push(...other.clearBoxes.map(r=>({...r,min:move(r.min),max:move(r.max)})));s.driverEyes.push(...other.driverEyes.map(move));
 b.dependencies.add('BUILT-285');s.parkedAircraft={...plane,offset,actualDoor:move(plane.cabin.door),original285ComponentsPreserved:true};return{...plane,door:move(plane.cabin.door)};
}
function wheel(c:CivicComponent,name:string,center:V3,r:number,width:number,axis:'X'|'Z'){
 const first=c.meshes.length;annulus(c,name+' 真胎环','rubber',[0,0,0],r,r*.54,width,20);annulus(c,name+' 独立轮圈','metalBright',[0,0,0],r*.54,r*.22,width,20);
 for(const m of c.meshes.slice(first)){for(let k=0;k<m.positions.length;k+=3){const[x,y,z]=m.positions.slice(k,k+3);m.positions.splice(k,3,...(axis==='X'?[z,y,-x]:[x,y,z]).map((v,d)=>v+center[d]));if(axis==='X'){const[x,y,z]=m.normals.slice(k,k+3);m.normals.splice(k,3,z,y,-x);}}}
 const from=center,to=center.map((v,d)=>v+(d===(axis==='X'?0:2)?width:0))as V3;c.tube(name+' 轴芯','metal',[from,to],r*.23,16);
}
function mobileStair(b:ArchitectureBuilder,s:FleetSource,door:V3){
 const h=door[1],n=14,tread=.32,landing=.8,run=n*tread,rise=h/n,roof=(x:number)=>h+2.25-Math.max(0,x-landing)/run*h;
 const instance=fleetPart(b,'mobile-enclosed-stair','可移动封闭登机梯、独立轮脚及连续玻璃雨棚',['BUILT-298','BUILT-286','BUILT-007'],{height:h,steps:n,rise,tread,width:1.9,mobileGeometry:true,controllerBound:false},c=>{
  c.box('真实上接合平台','metalBright',0,h-.16,-.95,landing,.16,1.9);
  for(let j=0;j<n;j++)c.box('实际登机踏步-'+j,'metalBright',landing+j*tread,h-(j+1)*rise-.10,-.95,tread,.10,1.9);
  for(const z of[-1.02,1.02]){c.beam('连续梯侧承梁','metal',[landing,h-.18,z],[landing+run,-.18,z],.12,.18);c.beam('连续梯边扶手','metalBright',[landing,h+1,z],[landing+run,1,z],.07);c.box('轮架纵梁','metal',.7,.34,z-.08,2.8,.18,.16);c.beam('平台至移动轮架的斜撑','metal',[.1,h-.16,z],[1.2,.48,z],.12);c.beam('梯梁至后轮架斜撑','metal',[2.5,h-(2.5-landing)/run*h-.18,z],[3.1,.48,z],.12);
   c.beam('独立连续斜侧玻璃','glass',[landing,h+1.2,z],[landing+run,1.2,z],.024,1.65);c.beam('玻璃上沿斜框','transitBody',[landing,roof(landing),z],[landing+run,roof(landing+run),z],.08);c.beam('侧玻璃下沿斜框','transitBody',[landing,h+.35,z],[landing+run,.35,z],.08);
   for(const x of[landing,2.3,3.8,landing+run]){const y=h-Math.max(0,x-landing)/run*h;c.box('实际侧窗竖框','transitBody',x-.035,y+.30,z-.04,.07,1.95,.08);}
  }
  c.surface('连续透明斜雨棚','glass',[0,landing,landing+run],[-1.05,1.05],x=>roof(x),.025);
  for(const z of[-1.05,1.05])c.beam('接合平台雨棚框','transitBody',[0,h+2.25,z],[landing,h+2.25,z],.08);
  for(const x of[1.1,3.2]){for(const z of[-1.02,1.02])c.box('轮轴至车架实轴承座','metal',x-.12,.20,z-.12,.24,.24,.24);c.tube('实穿车轴','metal',[[x,.23,-1.3],[x,.23,1.48]],.08);for(const z of[-1.3,1.12])wheel(c,'移动梯轮',[x,.23,z],.23,.18,'Z');}
  c.pin('登机梯最小固定销','bronze',[.10,h-.04,-.6]);
 },[door[0],0,door[2]],'mobile-stair');
 for(let j=0;j<n;j++)s.walkSamples.push({name:'mobile stair tread '+j,point:[door[0]+landing+(j+.5)*tread,h-(j+1)*rise,door[2]],width:.20});
 route(s,'mobile landing to actual aircraft hatch',[[door[0]-.35,h,door[2]],[door[0]+.55,h,door[2]]],.7);
 for(const x of[1.1,3.2])for(const z of[-1.21,1.21])s.contacts.push({name:'mobile stair wheel to apron',point:[door[0]+x,-.01,door[2]+z],exclude:instance});
 s.mobileStair={instance,door,steps:n,rise,tread,width:1.9,bodyRadiusM:.35,bodyHeightM:1.72,closedCanopy:true,wheelCount:4,originalMobilityControllerBound:false};return instance;
}

export function makeAirportService(p:Project,catalogId:string,id:string,name:string){
 const b=new ArchitectureBuilder(p,id),s=fleetSource();
 if(catalogId==='BUILT-298'){
  modernPlate(b,36,34,[0,0,0]);const plane=parkedAircraft(b,s,'mobile-stair-airliner',[0,0,0]);mobileStair(b,s,plane.door);
 }else{
  modernPlate(b,40,50,[0,0,2]);const parked=parkedAircraft(b,s,'tow-airliner',[0,0,8]);boardingStair(b,s,'parked-tow-airliner',parked.door);
  const cab=fleetCabin(b,s,{key:'tow-tractor',width:3,length:3,floorY:.9,doorZ:0,passengers:false,height:2.4,at:[0,0,-8]});boardingStair(b,s,'tractor-cab',cab.door);
  const chassis=fleetPart(b,'tow-tractor-chassis','牵引车低重心车架、四个独立轮胎和后配重',['BUILT-286','BUILT-299'],{floorY:.9,wheelRadius:.4},c=>{
   c.box('真实牵引车底盘','metal',-1.4,.55,-9.4,2.8,.24,4.9);c.box('后配重外壳','transitBody',-1.4,.79,-6.5,2.8,.4,2);c.box('独立后牵引座','metalBright',-.4,.5,-4.65,.8,.22,.3);
   for(const z of[-8.9,-5.3]){c.tube('实际贯穿车轴','metal',[[-1.75,.4,z],[1.75,.4,z]],.1);for(const x of[-1.75,1.5])wheel(c,'牵引车轮',[x,.4,z],.4,.25,'X');}
   for(const x of[-1.1,1.1])c.box('未绑定牵引车光学灯','vehicleInactiveOptic',x-.15,1,-9.52,.3,.14,.02);
   c.pin('底盘最小连接销','bronze',[-1.3,.68,-9.3]);
  });
  const bar=fleetPart(b,'actual-aircraft-towbar','真实拖杆、承轮和作者可拆夹座',['BUILT-299','BUILT-294'],{receiverPoint:[0,.6,1.72],source294Unmodified:true,towingStateBound:false},c=>{
   c.beam('连续金属拖杆','safetyMetal',[0,.6,-4.6],[0,.6,.6],.18,.18);for(const x of[-.35,.35])c.beam('真实末端分叉','metalBright',[0,.6,.6],[x,.6,1.72],.13,.13);c.box('独立可拆前夹座','metalBright',-.43,.50,1.58,.86,.20,.2);
   c.tube('拖杆支轮横轴','metal',[[-.55,.2,-2.5],[.55,.2,-2.5]],.07);for(const x of[-.55,.40])wheel(c,'拖杆承轮',[x,.2,-2.5],.2,.15,'X');c.box('拖杆至承轮支柱','metal',-.1,.2,-2.6,.2,.4,.2);c.pin('拖杆铰销最小组件','bronze',[-.02,.60,-4.6]);
  });
  s.contacts.push({name:'towbar to existing aircraft axle',point:[0,.6,1.72],exclude:bar,role:'metalBright'},{name:'towbar to actual tractor hitch',point:[0,.6,-4.55],exclude:bar,role:'metalBright'});
  for(const x of[-1.625,1.625])for(const z of[-8.9,-5.3])s.contacts.push({name:'tractor tyre to apron',point:[x,-.01,z],exclude:chassis});
  s.towTractor={chassis,bar,cab,authorReceiver:true,originalGearNotChanged:true,actualAirportStateBound:false};
 }
 return b.finish(catalogId,name,JSON.parse(JSON.stringify(s)));
}
