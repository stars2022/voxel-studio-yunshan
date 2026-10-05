import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {modernPlate} from './metropolis-components';
import {route} from './district-components';
import {fleetSource,fleetPart,fleetCabin,boardingStair,passengerSeat,sweptWing,annulus,type FleetSource} from './fleet-components';
export const fleetVehicleIds=['BUILT-277','BUILT-279','BUILT-280','BUILT-281','BUILT-282','BUILT-283','BUILT-284','BUILT-285'];

function roadWheels(b:ArchitectureBuilder,s:FleetSource,w:number,zs:number[],floorY:number){
 const wheels=[];for(const z of zs)for(const side of[-1,1])wheels.push(b.place(b.original('BUILT-286'),[side*(w/2+.15),0,z+(side===-1?.6:-.6)],side===-1?1:3,'wheel'));
 fleetPart(b,'road-underframe-'+w+'-'+zs.join('-')+'-'+floorY,'真实车轴与纵梁',['BUILT-286'],{wheelBore:.15,axleWidth:.1,zs},c=>{for(const z of zs){c.box('穿过轮毂方孔的车轴','metalBright',-w/2-.15,.55,z-.05,w+.3,.1,.1);for(const x of[-w*.28,w*.28])c.box('轴至底盘承托','metal',x-.1,.6,z-.12,.2,floorY-.82,.24);}for(const x of[-w*.28,w*.28])c.box('底盘通长纵梁','metal',x-.10,floorY-.30,Math.min(...zs)-.6,.2,.2,Math.max(...zs)-Math.min(...zs)+1.2);});
 for(const z of zs)for(const side of[-1,1])s.contacts.push({name:'wheel tread road contact',point:[side*(w/2-.05),-.01,z]});
 return wheels;
}
function addRoadNose(b:ArchitectureBuilder,key:string,w:number,l:number,floorY:number,skin='transitBody'){
 return fleetPart(b,key+'-nose','连续倾斜前围与分离光学灯',[],{w,l},c=>{c.slab('连续收尖前围',skin,[[-w/2,0,-l/2],[w/2,0,-l/2],[w*.38,-.18,-l/2-.6],[-w*.38,-.18,-l/2-.6]],.35);for(const x of[-w*.3,w*.3])c.box('未绑定车辆光学灯','vehicleInactiveOptic',x-.18,-.25,-l/2-.615,.36,.1,.015);},[0,floorY,0]);
}
/** Independently proportioned 18m cabin, true hatch, deployed native gear and continuous wings. */
export function passengerAircraft(b:ArchitectureBuilder,s:FleetSource,key='airliner',withBoarding=true){
 const y=2.65,body=fleetCabin(b,s,{key,width:4,length:18,floorY:y,doorZ:-6.4,skin:'aircraftSkin',restraints:true,profile:'aircraft'});
 const gear=[];for(const[x,z]of[[-.9,-6.8],[-2.25,4.0],[.45,4.0]]){const i=b.place(b.original('BUILT-294'),[x,0,z],0,'gear');gear.push(i);s.contacts.push({name:key+' gear upper plate to cabin underside',point:[x+.9,2.4,z+.6],exclude:i,role:'metal'});}
 addRoadNose(b,key,4,18,y,'aircraftSkin');
 fleetPart(b,key+'-aerodynamic-ends','连续收尖机鼻、尾锥和实体垂尾',['BUILT-297'],{},c=>{
  c.slab('流线机鼻下壳','aircraftSkin',[[-2,.7,-9],[2,.7,-9],[1.7,.7,-10.2],[.45,.1,-11.8],[-.45,.1,-11.8],[-1.7,.7,-10.2]],.45);
  c.surface('实际倾斜驾驶风挡','glass',[-1.65,1.65],[-10.2,-9],(_,z)=>.73+(z+10.2)/1.2*1.6,.024);
  for(const x of[-1.69,1.69])c.beam('风挡侧框','aircraftSkin',[x,.72,-10.2],[x,2.33,-9],.08,.08);
  c.beam('风挡下框','aircraftSkin',[-1.7,.73,-10.2],[1.7,.73,-10.2],.08,.08);
  c.beam('风挡顶框','aircraftSkin',[-1.7,2.33,-9],[1.7,2.33,-9],.08,.08);
  c.slab('连续后机身尾锥','aircraftSkin',[[-2,0,9],[2,0,9],[.45,.7,12],[-.45,.7,12]],.3);
  c.beam('连续垂尾前梁','aircraftSkin',[0,.45,9],[0,3.5,11],.18,.22);
  // A closed, thin vertical prism from three continuous beams and a filled polygon.
  const a=[0,.45,8.8]as V3,d=[0,3.5,11.1]as V3,e=[0,.7,12]as V3;
  const mesh=c.meshes.length;c.slab('垂尾实体临时水平','aircraftSkin',[[a[2],0,a[1]],[d[2],0,d[1]],[e[2],0,e[1]]],.18);
  const m=c.meshes[mesh];for(let j=0;j<m.positions.length;j+=3){const [x,yy,z]=m.positions.slice(j,j+3);m.positions.splice(j,3,yy+.09,z,x);}for(let j=0;j<m.normals.length;j+=3){const[x,yy,z]=m.normals.slice(j,j+3);m.normals.splice(j,3,yy,z,x);}
 },[0,y,0],'tail');
 sweptWing(b,key+'-main-wing',[0,3.1,0],11,4,'aircraftSkin',1.85);sweptWing(b,key+'-tailplane',[0,4.0,9.7],4.2,2,'aircraftSkin',.35);
 const engines=[];for(const x of[-6.0,4.4]){const i=b.place(b.original('BUILT-296'),[x,.8,-1.5],0,'engine');engines.push(i);s.contacts.push({name:key+' native engine cap to continuous wing',point:[x+.8,3.18,.3],exclude:i});}
 let stairs;if(withBoarding)stairs=boardingStair(b,s,key,body.door);
 const result={cabin:body,gear,engines,spanM:22,bodyLengthM:24,doorWidthM:1.6,original185Preserved:true,original169ProxyPreserved:true,gearState:'static deployed',boarding:stairs};s.airliner=result;return result;
}

export function makeFleetVehicle(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 const b=new ArchitectureBuilder(p,id),s=fleetSource();
 if(catalogId==='BUILT-279'||catalogId==='BUILT-280'){
  const truck=catalogId==='BUILT-280',l=truck?3.8:10,w=2.8,y=1.5,dz=truck?-.45:-3.7;modernPlate(b,18,18,[3,0,1]);
  const body=fleetCabin(b,s,{key:truck?'cargo-cab':'city-bus',width:w,length:l,floorY:y,doorZ:dz,passengers:!truck});addRoadNose(b,truck?'cargo':'bus',w,l,y);
  const wheels=roadWheels(b,s,w,truck?[-1.2,5.1,6.6]:[-3.4,3.4],y);const stair=boardingStair(b,s,truck?'cargo-cab':'bus',body.door);
  if(truck){fleetPart(b,'empty-cargo-box','空货箱、承板与常开后门',[],{inventoryBound:false,contents:[],dimensions:[3,2.7,6.4]},c=>{c.box('货箱承板','metal',-1.5,y-.25,2.1,3,.22,6.4);c.box('货箱防滑地胶','cabinFloor',-1.5,y-.03,2.1,3,.03,6.4);for(const x of[-1.5,1.4])c.box('货箱金属侧壁','transitBody',x,y,2.1,.1,2.7,6.4);c.box('货箱前隔壁','transitBody',-1.5,y,2.1,3,2.7,.1);c.box('货箱顶','transitBody',-1.5,y+2.6,2.1,3,.1,6.4);for(const x of[-1.6,1.5])c.box('后门常开折叶','transitBody',x,y,8.5,.1,2.6,1.5);c.pin('箱角最小销','bronze',[-1.5,y+.2,2.1]);});s.clearBoxes.push({name:'empty cargo interior',min:[-1.3,y+.05,2.3],max:[1.3,y+2.5,8.4]});s.cargo={bound:false,inventoryItems:[],capacityNotInferred:true};}
  s.roadVehicle={mode:truck?'cargo':'bus',body,wheels,boarding:stair,authorFloorY:y,steeringBound:false};
 }else if(catalogId==='BUILT-281'){
  const mode=String(params.trainMode??'lightRail');s.parameters={trainMode:mode};modernPlate(b,15,29,[3,0,0]);
  const y=1.85,body=fleetCabin(b,s,{key:'passenger-train',width:3.4,length:16,floorY:y,doorZ:-5.5});addRoadNose(b,'train',3.4,16,y);
  const bogies=[];for(const z of[-5.7,3.0])bogies.push(b.place(b.original('BUILT-289',{component:mode==='lightRail'?'railBogie':'maglevBase'}),[-1.5,.2,z],0,'bogie'));
  const coupling=b.place(b.original('BUILT-288'),[-.9,.35,7.95],0,'coupler');
  const couplerFrame=fleetPart(b,'train-coupler-stop','静态车钩尾端检修承架',['BUILT-288'],{},c=>{c.box('车钩前端实际承接座','metal',-.6,1.45,7.8,1.2,.2,.4);for(const x of[-.65,.55])c.box('止架金属立足','metal',x,0,9.3,.1,1.45,.2);c.box('止架横梁','metal',-.7,1.25,9.3,1.4,.2,.2);});
  fleetPart(b,'train-guide-'+mode,'对应模式导轨与明确机械止挡',['BUILT-289'],{mode,unpowered:true},c=>{if(mode==='lightRail'){for(const x of[-1.35,1.35]){c.box('轮轨踏面','railWheel',x-.10,.15,-10,.20,.10,21);c.box('钢轨腹板','metal',x-.045,.02,-10,.09,.13,21);}for(let z=-9;z<11;z+=1.2)c.box('轨枕','structuralConcrete',-1.7,0,z,3.4,.08,.28);}else{c.box('磁浮中导梁','structuralConcrete',-.4,0,-10,.8,.90,21);for(const x of[-.95,.95])c.box('静态机械止挡承台','structuralConcrete',x-.15,0,-10,.3,.5,21);}});
  for(const i of bogies){const instance=b.instances.find(r=>r.id===i)!;s.contacts.push({name:'bogie saddle real floor contact',point:[0,1.6,instance.position[2]+1.6],exclude:i});if(mode==='maglev')s.clearBoxes.push({name:'unpowered guide side air gap',min:[-.48,.46,instance.position[2]+.5],max:[-.42,.86,instance.position[2]+2.6]});}
  s.contacts.push({name:'coupler attachment to actual cabin floor',point:[0,1.62,7.85],exclude:couplerFrame,role:'metal'});s.contacts.push({name:'actual coupler front plate to body attachment',point:[0,1.52,8.025],exclude:coupling,role:'metal'});const stairs=boardingStair(b,s,'train',body.door);s.train={mode,body,bogies,coupling,boarding:stairs,authorRouteMode:true,originalRouteId:null,magneticForceBound:false};
 }else if(catalogId==='BUILT-282'){
  const y=1,body=fleetCabin(b,s,{key:'cable-cabin',width:2.8,length:4.8,floorY:y,doorZ:-.7,driver:false});modernPlate(b,8,6,[5,1,-.7]);
  fleetPart(b,'cable-boarding-bridge','轿厢与平台齐平接板',['BUILT-293'],{},c=>c.box('实际接板','metalBright',1.3,.82,-1.5,1.8,.18,1.6));route(s,'cable landing',[[1.4,1,-.7],[5,1,-.7]]);
  const hanger=b.place(b.original('BUILT-290'),[-1.2,3.9,-.6],0,'hanger');fleetPart(b,'cable-roof-saddle','缆车顶托与同源双钢缆',['BUILT-290'],{cableDiameter:.15},c=>{c.box('真实顶托板','metal',-.8,3.78,-.6,1.6,.17,1.2);for(const x of[-.8,.8])c.tube('同源实际承载钢缆','suspensionCable',[[x,6.55,-5],[x,6.55,5]],.075,12);});
  s.contacts.push({name:'hanger bottom plate to cabin roof saddle',point:[0,3.9,0],exclude:hanger,role:'metal'});s.cable={body,hanger,cableY:6.55,cableX:[-.8,.8],diameterM:.15,clampHoleM:.2,sourceRouteBound:false};
 }else if(catalogId==='BUILT-283'){
  const body=fleetCabin(b,s,{key:'cliff-lift',width:3.2,length:4,floorY:1.2,doorZ:-.5,driver:false});modernPlate(b,8,6,[5.6,1.2,-.5]);fleetPart(b,'lift-boarding','停靠接板与开放侧导架',['BUILT-307'],{stopY:1.2,travelBound:false},c=>{c.box('真实停靠接板','metalBright',1.5,1.02,-1.3,1.2,.18,1.6);for(const x of[-2.0,2.0]){c.box('升降侧导轨','metal',x-.06,0,2.1,.12,6,.12);c.box('静态检修止挡足','metal',x-.18,0,1.8,.36,.95,.5);c.box('舱底承托臂','metal',Math.min(x,0),.95,1.75,Math.abs(x)+.18,.25,.25);}c.box('井架顶横梁','metal',-2.06,5.8,2.1,4.12,.2,.12);});
  for(const x of[-2,2])for(const y of[1.65,3.5]){const wheel=fleetPart(b,'lift-guide-wheel-'+x+'-'+y,'侧导轮及刚性轴套',[],{},c=>{c.tube('实际钢导轮','cableSheave',[[x-.08,y,1.94],[x+.08,y,1.94]],.20,16);c.box('导轮至乘舱连接臂','metal',Math.min(x,x<0?-1.4:1.4),y-.05,1.82,Math.abs(x)-1.4,.10,.14);});s.contacts.push({name:'actual side guide wheel to rail',point:[x,y,2.11],exclude:wheel,role:'metal'});}
  route(s,'lift landing seam',[[1.6,1.2,-.5],[5,1.2,-.5]]);s.lift={body,stopY:1.2,verticalDatum:'author local metres',shaftFilled:false,landingMotionBound:false};
 }else if(catalogId==='BUILT-284'){
  const hull=b.place(b.original('BUILT-291'),[0,.2,0],0,'hull'),guard=b.place(b.original('BUILT-292'),[0,2.2,0],0,'guard'),gangway=b.place(b.original('BUILT-293'),[6,2,6.2],1,'boarding');
  const body=fleetCabin(b,s,{key:'ferry-cabin',width:4,length:6,floorY:0,at:[3,2.2,5.5],doorZ:-.5,skin:'marineHull'});modernPlate(b,5,5,[12,2.2,5]);route(s,'ferry actual embarkation',[[5,2.2,5],[12,2.2,5]]);
  fleetPart(b,'ferry-author-water','平水线视觉与龙骨检修托',['BUILT-291'],{waterY:1.2,buoyancyBound:false},c=>{c.box('作者平水面','flowWater',-2,1.17,-2,10,.03,14);for(const z of[3,7])c.box('明确龙骨检修托','structuralConcrete',1.5,-.4,z,3,.6,.5);});
  s.ferry={hull,guard,gangway,body,waterlineY:1.2,deckY:2.2,hullNativeUnchanged:true,buoyancyBound:false};
 }else if(catalogId==='BUILT-285'){
  modernPlate(b,34,32,[4,0,0]);passengerAircraft(b,s);
 }else if(catalogId==='BUILT-277'){
  modernPlate(b,24,24,[3,0,0]);const body=fleetCabin(b,s,{key:'star-passenger',width:5,length:12,floorY:1.4,doorZ:-3.7,skin:'spacecraftSkin',restraints:true,profile:'space'});
  const stairs=boardingStair(b,s,'star-passenger',body.door);sweptWing(b,'spacecraft-swept-shoulders',[0,2.8,1.3],7.2,5,'spacecraftSkin',2.3);
  fleetPart(b,'spacecraft-propulsion','双耐热推力腔与真实落地支柱',[],{energized:false,thrustBound:false},c=>{for(const x of[-4.8,4.8]){annulus(c,'独立推力金属外筒','spacecraftSkin',[x,2.0,1],1,.78,4.5);annulus(c,'耐热陶瓷内衬','thrusterLiner',[x,2.0,1.06],.78,.64,4.38);c.beam('推力筒至舱体承梁','metal',[x,2.92,1.5],[Math.sign(x)*2.4,2.92,1.5],.25,.16);}for(const x of[-1.8,1.8])for(const z of[-4.3,4.3]){c.box('独立落地胶垫','landingPadRubber',x-.3,0,z-.4,.6,.12,.8);c.beam('连续斜落地支柱','metalBright',[x,.1,z],[x*.8,1.25,z*.85],.16);c.box('落地上承帽','metal',x*.8-.16,1.15,z*.85-.16,.32,.15,.32);}c.pin('最小支柱锁销','bronze',[-1.44,1.2,-3.66]);});
  fleetPart(b,'spacecraft-nose','独立连续楔形星船前罩',[],{},c=>c.slab('连续前罩','spacecraftSkin',[[-2.5,.0,-6],[2.5,0,-6],[1,-.25,-9],[-1,-.25,-9]],.65),[0,1.4,0]);
  for(const x of[-4.8,4.8]){s.clearBoxes.push({name:'true unpowered thruster bore',min:[x-.35,1.65,1.08],max:[x+.35,2.35,5.42]});for(let j=0;j<12;j++){const angle=j/12*Math.PI*2,xx=x+.58*Math.cos(angle),yy=2+.58*Math.sin(angle);s.clearBoxes.push({name:'full circumference through bore sector '+x+' '+j,min:[xx-.02,yy-.02,1.08],max:[xx+.02,yy+.02,5.42]});}}s.spacecraft={body,boarding:stairs,spanM:14.4,authorParkingEnvelopeM:[16,6,18],originalFleetProxyRelabelled:false,flightBound:false};
 }else throw new Error('Unknown fleet vehicle');
 return b.finish(catalogId,name,s);
}
