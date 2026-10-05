import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import {civicAsset} from './civic-landmarks';
import {districtSource,route,type DistrictSource} from './district-components';
import {emptyMesh,quad} from './mesh-shapes';

export type FleetSource=DistrictSource & {walkSamples:{name:string;point:V3;width:number}[];clearBoxes:{name:string;min:V3;max:V3;exclude?:string[]}[];contacts:{name:string;point:V3;exclude?:string;role?:string}[];driverEyes:V3[]};
export function fleetSource():FleetSource{return{...districtSource(),walkSamples:[],clearBoxes:[],contacts:[],driverEyes:[],identityBound:false,controllerBound:false,cargoInventoryBound:false,kinematics:'Static authored boarding state only; no transport, flight, steering, buoyancy or permission integration.'};}
export function fleetPart(b:ArchitectureBuilder,key:string,name:string,deps:string[],params:Record<string,unknown>,draw:(c:CivicComponent)=>void,pos:V3=[0,0,0],group='vehicle',rotation=0){return b.place(civicAsset(b,'fleet-'+key,id=>{const c=new CivicComponent(b.p,id,name,deps,params);draw(c);return c.finish();}),pos,rotation,group);}

/** A true annular closed solid, with a through bore rather than a painted dark cap. */
export function annulus(c:CivicComponent,name:string,role:string,center:V3,outer:number,inner:number,length:number,sides=24){
 const m=emptyMesh(name,c.role(role)),ring=(r:number,z:number,j:number):V3=>[center[0]+r*Math.cos(j/sides*Math.PI*2),center[1]+r*Math.sin(j/sides*Math.PI*2),center[2]+z];
 for(let j=0;j<sides;j++){const k=(j+1)%sides,n:V3=[Math.cos((j+.5)/sides*Math.PI*2),Math.sin((j+.5)/sides*Math.PI*2),0];quad(m,[ring(outer,0,j),ring(outer,0,k),ring(outer,length,k),ring(outer,length,j)],n);quad(m,[ring(inner,0,j),ring(inner,0,k),ring(inner,length,k),ring(inner,length,j)],n.map(v=>-v)as V3);for(const z of[0,length])quad(m,[ring(inner,z,j),ring(inner,z,k),ring(outer,z,k),ring(outer,z,j)],[0,0,z===0?-1:1]);}c.mesh(m);
}
export function passengerSeat(b:ArchitectureBuilder,pos:V3,restraint=false,rotation=0){return fleetPart(b,'seat-'+restraint,'客座软垫、金属承脚与独立织带',['LIFE-013'],{restraint,width:.64},c=>{
 for(const x of[-.24,.18])c.box('真实金属椅脚','metal',x,0,-.22,.06,.43,.46);
 c.box('硬质座衬','cabinLiner',-.32,.38,-.28,.64,.08,.56);c.box('坐垫织物','passengerUpholstery',-.3,.46,-.26,.6,.12,.52);
 c.beam('连续倾斜座背','cabinLiner',[0,.48,.25],[0,1.1,.38],.64,.08);c.beam('座背软垫','passengerUpholstery',[0,.54,.20],[0,1.1,.33],.62,.07);
 // Sloping seat backs are metre-space surfaces; only their small fastening pin is native.
 if(restraint)for(const x of[-.21,.16])c.beam('固定胸织带','passengerRestraint',[x,.62,.188],[x,1.06,.29],.045,.015);
 c.pin('客座最小固定销','bronze',[-.24,.4,-.22]);
 },pos,'seat',rotation);}

export type CabinOptions={key:string;width:number;length:number;height?:number;floorY:number;doorZ:number;skin?:string;passengers?:boolean;driver?:boolean;restraints?:boolean;endDoor?:boolean;profile?:'road'|'aircraft'|'space';at?:V3};
/** Separate wall bays, real seals, thin glazing, liner and a curved continuous roof. */
export function fleetCabin(b:ArchitectureBuilder,s:FleetSource,o:CabinOptions){
 const {key,width:w,length:l,floorY:y,doorZ:dz}=o,h=o.height??2.6,skin=o.skin??'transitBody',at=o.at??[0,0,0],v=(x:number,yy:number,z:number):V3=>[x+at[0],yy+y+at[1],z+at[2]],doorWidth=1.6,aero=o.profile==='aircraft',space=o.profile==='space',sill=aero?1.0:space?.9:.72,lintel=aero?1.8:space?1.9:h-.3;
 const shell=fleetPart(b,key+'-cabin','独立乘舱壳、真实窗封和常开侧舱口',[],{...o,height:h,doorWidth,authorDimensions:true},c=>{
  c.box('连续金属承板','metal',-w/2,-.25,-l/2,w,.22,l);c.box('防滑地胶','cabinFloor',-w/2,-.03,-l/2,w,.03,l);
  for(const side of[-1,1]){const spans=side===1?[[-l/2,dz-doorWidth/2],[dz+doorWidth/2,l/2]]:[[-l/2,l/2]];for(const[a,z]of spans){if(z<=a)continue;const n=Math.ceil((z-a)/1.55),bay=(z-a)/n;for(let j=0;j<n;j++){const zz=a+j*bay,x=side===1?w/2-.12:-w/2;
   c.box('外壳窗下裙',skin,x,0,zz,.12,sill,bay);c.box('硬质内衬','cabinLiner',side===1?x-.025:x+.12,.04,zz,.025,sill-.1,bay);
   c.box('窗上蒙皮',skin,x,lintel,zz,.12,h-lintel,bay);c.box('窗框立柱',skin,x,.7,zz,.12,h-1,.1);c.box('窗框末端立柱',skin,x,.7,zz+bay-.1,.12,h-1,.1);
   const xx=side===1?w/2-.075:-w/2+.035,inset=aero?Math.max(.12,(bay-.65)/2):.1,ww=bay-2*inset,y0=sill+.01,hh=lintel-y0;
   if(inset>.1)for(const z0 of[zz+.1,zz+bay-inset])c.box('航空窗间蒙皮',skin,x,sill,z0,.12,lintel-sill,inset-.1);
   for(const z0 of[zz+inset,zz+inset+ww-.035])c.box('独立竖窗封','vehicleSeal',xx,y0,z0,.04,hh,.035);for(const yy of[y0,lintel-.035])c.box('独立横窗封','vehicleSeal',xx,yy,zz+inset,.04,.035,ww);
   c.box('独立薄舱窗','glass',xx+.012,y0+.035,zz+inset+.035,.016,hh-.07,ww-.07);
  }}}
  c.box('门上结构梁',skin,w/2-.12,2.25,dz-.8,.12,h-2.25,1.6);
  for(const z of[dz-.84,dz+.8])c.box('实开门框',skin,w/2-.15,0,z,.20,2.3,.04);
  // A parked sliding leaf beside the aperture, with no collision in the doorway.
  c.box('常开侧滑门下裙',skin,w/2+.025,0,dz+.85,.08,.72,1.55);c.box('常开门上框',skin,w/2+.025,2.15,dz+.85,.08,.1,1.55);for(const z of[dz+.85,dz+2.35])c.box('常开门侧框',skin,w/2+.025,.72,z,.08,1.43,.05);c.box('常开门玻璃','glass',w/2+.053,.76,dz+.90,.02,1.35,1.45);
  for(const z of[-l/2,l/2-.12]){if(o.endDoor&&z>0){for(const x of[-w/2,.7])c.box('端门侧壳',skin,x,0,z,w/2-.7,h,.12);c.box('端门梁',skin,-.7,2.25,z,1.4,h-2.25,.12);}else{c.box('端面下壳',skin,-w/2,0,z,w,.75,.12);c.box('端窗玻璃','glass',-w/2+.15,.78,z+.045,w-.3,h-1.12,.018);for(const x of[-w/2,w/2-.12])c.box('端窗立框',skin,x,.7,z,.12,h-.7,.12);c.box('端窗上框',skin,-w/2,h-.3,z,w,.3,.12);}}
  for(const x of[-w/2,w/2-.1])c.box('通长顶边梁',skin,x,h-.12,-l/2,.1,.22,l);
  const xs=Array.from({length:13},(_,j)=>-w/2+w*j/12);c.surface('连续拱形舱顶',skin,xs,[-l/2,l/2],x=>h+.10+(aero?.6:space?.42:.22)*(1-(x/(w/2))**2),.1);
  c.pin('最小壳体锁销','bronze',[-w/2,.3,l/2-.2]);
 },v(0,0,0),'cabin');
 const seats=[];if(o.passengers!==false)for(let z=-l/2+2.6;z<l/2-.7;z+=1.15)for(const side of[-1,1]){if(side===1&&Math.abs(z-dz)<1.4)continue;seats.push(passengerSeat(b,v(side*(w/2-.55),0,z),!!o.restraints));}
 if(o.driver!==false){seats.push(passengerSeat(b,v(-w/2+.62,0,-l/2+.95),!!o.restraints));fleetPart(b,key+'-controls','驾驶控制台与未绑定光学面',[],{powerBound:false},c=>{c.box('仪表硬塑台','vehicleControl',-.4,.62,-.18,.8,.40,.35);c.box('未绑定仪表玻璃','vehicleInactiveOptic',-.31,.91,.176,.62,.08,.014);c.box('操纵柱','vehicleControl',-.055,.1,.07,.11,.65,.1);annulus(c,'真实方向控制环','vehicleControl',[0,.89,.20],.20,.15,.035,16);},v(-w/2+.62,0,-l/2+.27),'controls');s.driverEyes.push(v(-w/2+.62,1.33,-l/2+.65));}
 route(s,key+' aisle',[v(0,0,-l/2+.9),v(0,0,l/2-.6)],.45);route(s,key+' true door',[v(0,0,dz),v(w/2+.02,0,dz)]);
 s.clearBoxes.push({name:key+' actual side aperture',min:v(w/2-.08,.05,dz-.7),max:v(w/2+.02,2.15,dz+.7)});
 return{shell,seats,door:v(w/2,0,dz),width:w,length:l,floorY:y+at[1],roofY:y+at[1]+h+(aero?.7:space?.52:.32),driverEyes:s.driverEyes.slice(-1)};
}

/** Straight removable stair with true treads, continuous stringers and a level top landing. */
export function boardingStair(b:ArchitectureBuilder,s:FleetSource,key:string,door:V3,groundY=0){
 const h=door[1]-groundY,n=Math.ceil(h/.18),t=.32,rise=h/n,run=n*t,landing=.8,w=1.9;
 const stair=fleetPart(b,'boarding-'+key,'可登离实体踏步与连续金属梯梁',['BUILT-298'],{height:h,steps:n,tread:t,step:rise},c=>{
  c.box('舱门接合平台','metalBright',0,h-.16,-w/2,landing,.16,w);
  for(let j=0;j<n;j++)c.box('实际登离踏步-'+j,'metalBright',landing+j*t,h-(j+1)*rise-.10,-w/2,t,.10,w);
  for(const z of[-w/2+.1,w/2-.1]){c.beam('连续金属梯梁','metal',[landing,h-.2,z],[landing+run,-.2,z],.1,.15);c.beam('连续登离扶手','metalBright',[0,h+1.0,z],[landing,h+1.0,z],.06);c.beam('连续梯扶手','metalBright',[landing,h+1,z],[landing+run,1,z],.06);for(const x of[0,landing,landing+run])c.box('扶手立柱','metal',x-.025,x<=landing?h-.12:-.1,z-.025,.05,1.12,.05);}
  for(const x of[.1,landing-.1])for(const z of[-.6,.6])c.box('梯台落地承足','metal',x-.05,-.08,z-.05,.1,h,.1);c.pin('梯台最小连接销','bronze',[.1,h-.04,-.6]);
 },[door[0],groundY,door[2]],'boarding');
 for(let j=0;j<n;j++)s.walkSamples.push({name:key+' stair '+j,point:[door[0]+landing+(j+.5)*t,door[1]-(j+1)*rise,door[2]],width:.20});
 route(s,key+' boarding seam',[[door[0]-.35,door[1],door[2]],[door[0]+.55,door[1],door[2]]]);
 return{instance:stair,run,landing,groundEnd:[door[0]+landing+run,groundY,door[2]]as V3};
}

/** Continuous swept aerodynamic surface; planform and taper are genuine geometry. */
export function sweptWing(b:ArchitectureBuilder,key:string,pos:V3,halfSpan:number,chord:number,skin='aircraftSkin',rootHalf=2){return fleetPart(b,key,'连续后掠翼及薄翼缘',['BUILT-295'],{halfSpan,chord,rootHalf,authority:'continuous authored surface; historical voxel wings retained separately'},c=>{for(const side of[-1,1]){c.slab('连续后掠翼',skin,[[side*rootHalf,.0,-chord/2],[side*halfSpan,.38,chord*.28],[side*halfSpan,.38,chord*.6],[side*rootHalf,0,chord/2]],.14);c.beam('翼根实际承接梁','metal',[side*(rootHalf-.2),-.08,0],[side*(rootHalf+.6),-.08,0],.22,.25);c.pin('翼根最小铜销','bronze',[side*rootHalf,-.1,.04]);}},pos,'wing');}
