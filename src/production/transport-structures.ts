import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {fleetSource,fleetPart,boardingStair,type FleetSource} from './fleet-components';
import {makeFleetVehicle} from './fleet-vehicles';
import {modernPlate} from './metropolis-components';
import {districtHouse,route,thinCanopy,counter} from './district-components';
import {terrainTile,terrainHeightAt,grove,type HeightField} from './landscape-components';

export const transportStructureIds=['BUILT-305','BUILT-306','BUILT-311','BUILT-313','BUILT-314'];
export function bridgeSpan(b:ArchitectureBuilder,s:FleetSource,key:string,x:number,z:number,length:number,width:number,walkY:number,ground:HeightField,rail=false){
 const piers=[x-length*.32,x+length*.32].flatMap(px=>[-1,1].map(side=>({x:px,z:z+side*(width/2-.85),ground:ground(px,z+side*(width/2-.85))}))),deck=fleetPart(b,'bridge-'+key,'分层路床、承梁、支座和实墩', ['BUILT-134','BUILT-146','BUILT-147','BUILT-154','BUILT-305'],{length,width,walkY,piers,rail,originalNetworkBound:false},c=>{
  c.box('独立连续混凝土承板','structuralConcrete',x-length/2,walkY-.7,z-width/2,length,.55,width);c.box('连续道路磨耗面','pavementConcrete',x-length/2,walkY-.15,z-width/2,length,.15,width);
  if(rail)for(const zz of[z-1.35,z+1.35]){c.box('固定钢轨导向件','metal',x-length/2,walkY,zz-.10,length,.15,.2);for(let xx=x-length/2;xx<x+length/2;xx+=1.4)c.box('独立轨枕','structuralConcrete',xx,walkY-.03,z-1.8,.3,.06,3.6);}
  else c.box('实嵌陶瓷中心条','roadInlay',x-length/2,walkY-.03,z-.08,length,.032,.16);
  for(const zz of[z-width/2+.25,z+width/2-.25]){c.box('连续纵向承梁','metal',x-length/2,walkY-1.5,zz-.25,length,.85,.5);c.beam('连续道路金属扶栏','metalBright',[x-length/2,walkY+1.05,zz],[x+length/2,walkY+1.05,zz],.08);for(let xx=x-length/2;xx<=x+length/2;xx+=2)c.box('实际护栏立柱','metal',xx-.04,walkY-.03,zz-.04,.08,1.08,.08);}
  for(const[p,j]of piers.map((p,j)=>[p,j]as const)){const top=walkY-1.5;c.box('入岩基础-'+j,'structuralConcrete',p.x-1.3,p.ground-.35,p.z-1.3,2.6,.75,2.6);c.box('承重实墩-'+j,'structuralConcrete',p.x-.65,p.ground+.3,p.z-.65,1.3,top-p.ground-.3,1.3);c.box('独立橡胶支座-'+j,'bridgeBearing',p.x-.55,top-.1,p.z-.55,1.1,.22,1.1);if(j%2===0)c.box('横向实墩帽-'+j,'structuralConcrete',p.x-.8,top+.08,z-width/2,.0+1.6,.38,width);c.pin('墩帽最小接件','bronze',[p.x-.65,top+.2,p.z-.6]);}
 },[0,0,0],'bridge');
 for(const p of piers)s.contacts.push({name:key+' foundation into actual terrain',point:[p.x,p.ground-.02,p.z],exclude:deck});
 const joints=(s.bearingJoints??=[])as any[];for(const p of piers)joints.push({name:key,point:[p.x,walkY-1.53,p.z],roles:['structuralConcrete','bridgeBearing']});
 route(s,key+' deck',[ [x-length/2+1,walkY,z+(rail?2.5:1)],[x+length/2-1,walkY,z+(rail?2.5:1)] ],.7);
 return{instance:deck,length,width,walkY,piers};
}

function bench(b:ArchitectureBuilder,key:string,pos:V3){return fleetPart(b,'waiting-bench-'+key,'木座、独立金属承脚与倾斜靠背',['LIFE-011'],{},c=>{for(const x of[-1.3,1.15])c.box('金属凳脚','metal',x,0,-.22,.15,.45,.44);c.box('木座面','wood',-1.5,.43,-.3,3,.09,.6);c.beam('倾斜木靠背','woodEdge',[0,.5,.25],[0,1.05,.4],3,.08);c.pin('座边铜销','bronze',[-1.25,.46,-.2]);},pos,'fixture');}

/** Reuse the actual M048 component assets; omit only that study's separate floor and removable stair instances. */
function parkedFleet(b:ArchitectureBuilder,s:FleetSource,catalogId:string){
 const original=makeFleetVehicle(b.p,catalogId,'station-vehicle-source',catalogId),source=original.source as any,map=new Map<string,string>();
 for(const dep of source.dependencies)b.dependencies.add(dep);b.dependencies.add(catalogId);
 for(const i of original.instances){if(['floor','boarding'].includes(source.instanceGroups[i.id]))continue;map.set(i.id,b.place(i.assetId,i.position,i.rotation,'parked-vehicle',i.name));}
 for(const r of source.routes)if(!r.name.includes('boarding'))s.routes.push(structuredClone(r));
 s.contacts.push(...source.contacts.map((r:any)=>({...r,exclude:r.exclude?map.get(r.exclude):undefined})));
 s.clearBoxes.push(...source.clearBoxes.map((r:any)=>({...r,exclude:r.exclude?.map((id:string)=>map.get(id)).filter(Boolean)})));s.driverEyes.push(...source.driverEyes);
 return{catalogId,sourceAssemblyId:original.id,instanceMap:Object.fromEntries(map),componentsRetained:true,omittedGroups:['floor','boarding'],body:catalogId==='BUILT-279'?source.roadVehicle.body:source.train.body};
}

export const hairpinPath:V3[]=(()=>{const p:V3[]=[[-40,4,-25],[26,10,-25]];for(let j=1;j<=12;j++){const a=-Math.PI/2+j*Math.PI/12;p.push([26+15*Math.cos(a),10+j*.5,-10+15*Math.sin(a)]);}p.push([-26,22,5]);for(let j=1;j<=12;j++){const a=-Math.PI/2-j*Math.PI/12;p.push([-26+15*Math.cos(a),22+j*.5,20+15*Math.sin(a)]);}p.push([32,34,35]);return p;})();
export function nearestHairpin(x:number,z:number){let best={distance:Infinity,y:0};for(let j=1;j<hairpinPath.length;j++){const a=hairpinPath[j-1],d=hairpinPath[j],dx=d[0]-a[0],dz=d[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz))),distance=Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);if(distance<best.distance)best={distance,y:a[1]+(d[1]-a[1])*t};}return best;}
export const hairpinTerrain:HeightField=(x,z)=>{const n=nearestHairpin(x,z),mountain=14+44*Math.exp(-((x+2)**2/1200+(z-13)**2/1800))+4*Math.sin(x*.13)*Math.cos(z*.12),blend=Math.max(0,Math.min(1,(n.distance-7)/6));return(n.y-1.3)*(1-blend)+mountain*blend;};
function mountainRoad(b:ArchitectureBuilder,s:FleetSource){
 terrainTile(b,s,'hairpin',[0,0,0],hairpinTerrain,2);const width=8,left:V3[]=[],right:V3[]=[];
 for(let j=0;j<hairpinPath.length;j++){const a=hairpinPath[Math.max(0,j-1)],d=hairpinPath[Math.min(j+1,hairpinPath.length-1)],dx=d[0]-a[0],dz=d[2]-a[2],l=Math.hypot(dx,dz),p=hairpinPath[j];left.push([p[0]-dz/l*width/2,p[1],p[2]+dx/l*width/2]);right.push([p[0]+dz/l*width/2,p[1],p[2]-dx/l*width/2]);}
 const road=fleetPart(b,'actual-hairpin-ribbon','连续两次发卡弯、路床、护栏与实际承脚',['BUILT-313','BUILT-134','BUILT-097'],{width,path:hairpinPath,minimumRadius:15,authority:'actual closed continuous road ribbon'},c=>{
  for(let j=1;j<hairpinPath.length;j++){
   for(const [side,top]of [['left',[left[j-1],left[j],hairpinPath[j],hairpinPath[j-1]]],['right',[hairpinPath[j-1],hairpinPath[j],right[j],right[j-1]]]]as [string,V3[]][]){c.slab('连续承板-'+j+'-'+side,'structuralConcrete',top.map(v=>[v[0],v[1]-.12,v[2]]),.7);c.slab('道路磨耗面-'+j+'-'+side,'pavementConcrete',top,.12);}
   const top=[left[j-1],left[j],right[j],right[j-1]],stripe=top.map((v,k)=>{const p=hairpinPath[k===0||k===3?j-1:j];return[p[0]+(v[0]-p[0])*.025,p[1]+.002,p[2]+(v[2]-p[2])*.025]as V3;});c.slab('实嵌陶瓷引导线-'+j,'roadInlay',stripe,.03);for(const edge of[left,right])c.beam('连续弯道扶栏-'+j,'metalBright',[edge[j-1][0],edge[j-1][1]+1.1,edge[j-1][2]],[edge[j][0],edge[j][1]+1.1,edge[j][2]],.10);
  }
  for(let j=0;j<hairpinPath.length;j++)for(const edge of[left,right]){const[x,y,z]=edge[j];c.box('真实栏柱','metal',x-.05,y-.1,z-.05,.1,1.2,.1);}
  c.pin('弯道最小结构接件','bronze',[left[0][0],left[0][1]-.1,left[0][2]]);
 });
 const supports=[];for(let j=1;j<hairpinPath.length;j++){const a=hairpinPath[j-1],d=hairpinPath[j],count=Math.max(1,Math.ceil(Math.hypot(d[0]-a[0],d[2]-a[2])/8));for(let k=0;k<count;k++){const t=(k+.5)/count,p=a.map((v,i)=>v+(d[i]-v)*t)as V3,g=terrainHeightAt(hairpinTerrain,p[0],p[2],2),top=p[1]-.78;if(top<=g)continue;const part=fleetPart(b,'hairpin-foot-'+j+'-'+k,'路床至真实岩面的局部承脚',['BUILT-154'],{ground:g,top},c=>{c.box('入岩混凝土基座','structuralConcrete',p[0]-.7,g-.3,p[2]-.7,1.4,.4,1.4);c.box('路床下实际实承','structuralConcrete',p[0]-.45,g,p[2]-.45,.9,top-g,.9);});s.contacts.push({name:'hairpin real footing '+j+'-'+k,point:[p[0],g-.02,p[2]],exclude:part});s.contacts.push({name:'hairpin footing to deck '+j+'-'+k,point:[p[0],p[1]-.8,p[2]],exclude:part});supports.push(part);}}
 route(s,'continuous two-hairpin walking centre',hairpinPath,.7);s.hairpin={path:hairpinPath,width,road,supports,groundAuthority:'actual piecewise triangles; no whole-region flattening',drivingBound:false};s.forest=grove(b,s,'hairpin-grove',hairpinTerrain,[[-22,-42],[-4,-42],[15,-42],[0,20],[-10,20],[10,20]],2);
}

export function makeTransportStructure(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 const b=new ArchitectureBuilder(p,id),s=fleetSource();
 if(catalogId==='BUILT-305'){
  modernPlate(b,76,100,[0,0,28]);s.bridges=[];for(const[j,width]of[6,8,10].entries()){const y=8+j*2,z=j*28;const banks=fleetPart(b,'bridge-bank-'+j,'两端真实接岸岩台',['ENV-001'],{y,z},c=>{for(const side of[-1,1])c.box('接岸岩体','bedrock',side<0?-31:20,-.2,z-width/2-2,11,y+.2,width+4);});const bridge=bridgeSpan(b,s,'three-author-bridges-'+j,0,z,42,width,y,()=>0);route(s,'bridge '+j+' bank seam',[[-27,y,z+1],[27,y,z+1]],.7);route(s,'bridge '+j+' underdeck',[ [0,0,z-width/2-3],[0,0,z+width/2+3] ],.7);(s.bridges as any[]).push({...bridge,banks});}s.originalThreeRoutesBound=false;s.oldSaveChanged=false;
 }else if(catalogId==='BUILT-306'){
  modernPlate(b,80,80,[0,0,0]);const lower=bridgeSpan(b,s,'lower-rail',0,0,56,8,7,()=>0,true),upper=bridgeSpan(b,s,'upper-road',0,0,68,10,17,()=>0);route(s,'lower ground route',[[0,0,-15],[0,0,35]],.7);s.multilevel={lower,upper,sourceDomainsSeparate:true,originalSupportControllerBound:false};s.clearBoxes.push({name:'lower deck distinct body domain',min:[-3,7.2,-.5],max:[3,9.1,.5]});
 }else if(catalogId==='BUILT-311'){
  const mode=String(params.stationMode??'bus'),rail=mode==='rail',y=rail?1.85:1.5,x=rail?13.1:12.8,doorZ=rail?-5.5:-3.7;modernPlate(b,54,40,[11,0,0]);modernPlate(b,22,18,[x,y,0]);
  const vehicle=parkedFleet(b,s,rail?'BUILT-281':'BUILT-279'),doorX=rail?1.7:1.4;
  fleetPart(b,'station-boarding-'+mode,'站台至真实舱门的齐平接板',['BUILT-293'],{mode,walkY:y},c=>c.box('同高登离接板','metalBright',doorX-.05,y-.14,doorZ-.7,x-11-doorX+.15,.14,1.4));
  const canopy=thinCanopy(b,20,12,[x,y,1],[-9,0,9],3.6);for(const xx of[x-5,x+5])bench(b,mode+'-'+xx,[xx,y,2]);const stair=boardingStair(b,s,'station-'+mode,[x+11,y,0]);
  route(s,'actual platform to cabin',[[doorX-.4,y,doorZ],[x+2,y,doorZ],[x+2,y,0],[x+10.8,y,0]],.7);s.parameters={stationMode:mode};s.station={mode,platformSize:[22,18],platformY:y,vehicle,canopy,stair,vehicleRuntimeBound:false};
 }else if(catalogId==='BUILT-313')mountainRoad(b,s);
 else{
  modernPlate(b,80,54,[0,0,0]);const bridge=bridgeSpan(b,s,'inhabited-underdeck',0,0,68,12,10,()=>0);const shops=[];for(const x of[-27,-9,9,27]){shops.push(districtHouse(b,s,'underdeck-shop-'+x,[x,0,9],10,8,1,false,undefined,false));counter(b,[x,0,9]);}for(const x of[-16,0,16])bench(b,'underdeck-'+x,[x,0,-3]);route(s,'actual underdeck public crossing',[[-34,0,0],[34,0,0]],.7);route(s,'cross-layer ground passage',[[8,0,-23],[8,0,4]],.7);s.underdeck={upperRoad:bridge,shops,groundWalkY:0,upperWalkY:10,identityAndTradeBound:false};
 }
 return b.finish(catalogId,name,JSON.parse(JSON.stringify(s)));
}
