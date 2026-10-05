import type {Project,V3} from '../core/types';
import {Grid} from '../core/grid';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import {civicAsset,rail,roof,civicPost} from './civic-landmarks';
import {LandscapeComponent,terrainHeightAt,type HeightField} from './landscape-components';
import {fleetSource,type FleetSource} from './fleet-components';
import {route} from './district-components';
import {rootedPlant} from './habitat-components';

export type ParkSource=FleetSource & {park:any;forest:any[]};
export function parkSource():ParkSource{return{...fleetSource(),forest:[],originalRuntimeBound:false,park:{pads:[],guards:[],seats:[],steps:[],rockContacts:[],drains:[],viewRays:[],wayfinding:[],activityPoints:[],scope:'Finite author scene geometry. No original world, social activity, hydrology, automatic residency, guard safety certification or human art acceptance.'}};}
export function parkPart(b:ArchitectureBuilder,key:string,name:string,draw:(c:CivicComponent)=>void,deps:string[]=['ENV-001'],natural=false){return b.place(civicAsset(b,'park-'+key,id=>{const c=natural?new LandscapeComponent(b.p,id,name,deps,{key}):new CivicComponent(b.p,id,name,deps,{key});draw(c);return c.finish();}),[0,0,0],0,natural?'park-ground':'park-fixture');}

/** Mortar fills the joints; stone tiles own the top surface. Optional garden hole is genuinely open. */
export function pavedPad(b:ArchitectureBuilder,s:ParkSource,key:string,rect:[number,number,number,number],y:number,bottom:number,hole?:[number,number,number,number]){
 const [x,z,X,Z]=rect,rects=hole?[[x,z,hole[0],Z],[hole[2],z,X,Z],[hole[0],z,hole[2],hole[1]],[hole[0],hole[3],hole[2],Z]]:[rect];
 const instance=parkPart(b,'paving-'+key,'分层实心台基与独立石铺面',c=>{for(const [j,[a,d,A,D]]of rects.entries()){if(A<=a||D<=d)continue;c.box('实承台基 '+j,'structuralConcrete',a,bottom,d,A-a,y-.08-bottom,D-d);c.box('连续真实灰缝 '+j,'mortar',a,y-.08,d,A-a,.04,D-d);for(let xx=a;xx<A-1e-6;xx+=1.2)for(let zz=d;zz<D-1e-6;zz+=1.2){const w=Math.min(1.2,A-xx),h=Math.min(1.2,D-zz);c.box('独立石铺块','stone',xx+.008,y-.04,zz+.008,w-.016,.04,h-.016);for(const side of[xx,xx+w-.008])c.box('实填纵灰缝','mortar',side,y-.04,zz,.008,.04,h);for(const edge of[zz,zz+h-.008])c.box('实填横灰缝','mortar',xx+.008,y-.04,edge,w-.016,.04,.008);}}c.pin('台基边部最小接件','bronze',[x+.1,bottom+.1,z+.1]);},['BUILT-003','ENV-094']);
 s.park.pads.push({instance,rect,y,bottom,hole:hole??null});return instance;
}
/** A deck over a real lower domain: footings stop at its underside, leaving the valley open. */
export function supportedPad(b:ArchitectureBuilder,s:ParkSource,key:string,rect:[number,number,number,number],y:number,ground:HeightField,step=1){
 const instance=pavedPad(b,s,key,rect,y,y-.4),[x,z,X,Z]=rect,feet=[];
 for(const [j,[xx,zz]]of[[x+.8,z+.8],[X-.8,z+.8],[x+.8,Z-.8],[X-.8,Z-.8]].entries()){
  const g=terrainHeightAt(ground,xx,zz,step,-24,-24),top=y-.4;if(g>=top-.05)continue;
  const foot=parkPart(b,key+'-foot-'+j,'真实地形至台板底的独立承脚',c=>{c.box('实际入岩基脚','structuralConcrete',xx-.55,g-.25,zz-.55,1.1,.35,1.1);c.box('实际石砌承柱','wall',xx-.35,g+.05,zz-.35,.7,top-g-.05,.7);c.pin('柱顶承板销','bronze',[xx,top-.04,zz]);},['ENV-081','BUILT-307','BUILT-308']);
  s.contacts.push({name:key+' actual footing '+j,point:[xx,g-.02,zz],exclude:foot},{name:key+' actual deck bearing '+j,point:[xx,top+.01,zz],exclude:foot});feet.push({instance:foot,point:[xx,g,zz],top});
 }return{instance,rect,y,feet};
}
/** Reuse the existing rail profile; record actual body-width obstruction and post contacts. */
export function parkGuard(b:ArchitectureBuilder,s:ParkSource,key:string,a:V3,d:V3){
 if(a[1]!==d[1]||(a[0]!==d[0]&&a[2]!==d[2]))throw new Error('Park rail requires a level axis');
 const zAxis=a[0]===d[0],start=zAxis?Math.min(a[2],d[2]):Math.min(a[0],d[0]),end=zAxis?Math.max(a[2],d[2]):Math.max(a[0],d[0]),count=Math.ceil((end-start)/4);
 for(let j=0;j<count;j++){const t=start+j*4,w=Math.min(4,end-t),pos:V3=zAxis?[a[0],a[1],t]:[t,a[1],a[2]],instance=rail(b,w,pos,zAxis?3:0);s.park.guards.push({key,instance,from:pos,to:zAxis?[a[0],a[1],t+w]:[t+w,a[1],a[2]],width:w,axis:zAxis?'z':'x',height:1.1,largestProfileGapM:.28});for(const u of[.1,w-.18]){const point:V3=zAxis?[a[0],a[1]-.02,t+u]:[t+u,a[1]-.02,a[2]];s.contacts.push({name:key+' actual rail foot',point,exclude:instance});}}
}
export function perimeterRails(b:ArchitectureBuilder,s:ParkSource,key:string,rect:[number,number,number,number],y:number,frontGap=4){const[x,z,X,Z]=rect;parkGuard(b,s,key+'-back',[x,y,Z],[X,y,Z]);for(const xx of[x,X])parkGuard(b,s,key+'-side',[xx,y,z],[xx,y,Z]);if(frontGap>0){const mid=(x+X)/2;parkGuard(b,s,key+'-front-left',[x,y,z],[mid-frontGap/2,y,z]);parkGuard(b,s,key+'-front-right',[mid+frontGap/2,y,z],[X,y,z]);}}
export function parkSeat(b:ArchitectureBuilder,s:ParkSource,key:string,center:V3,form:'stone'|'wood'='wood'){
 const instance=b.place(b.original('ENV-098',{seatForm:form}),[center[0]-1.8,center[1],center[2]-.6],0,'park-seat');s.park.seats.push({key,instance,point:[center[0],center[1]+.6,center[2]-.1],approach:[center[0],center[1],center[2]-1.2],form});for(const x of[center[0]-1.5,center[0]+1.5])s.contacts.push({name:key+' actual seat foot',point:[x,center[1]-.02,center[2]],exclude:instance});return instance;
}
export function parkLamp(b:ArchitectureBuilder,s:ParkSource,pos:V3){const instance=b.place(b.original('ENV-104',{lampForm:'stone'}),pos,0,'park-lamp');s.contacts.push({name:'original stone lamp on paving',point:[pos[0]+.3,pos[1]-.02,pos[2]+.3],exclude:instance});return instance;}
export function parkPlants(b:ArchitectureBuilder,s:ParkSource,key:string,ground:HeightField,points:[number,number][],ids:[string,Record<string,string|number>][],step=1,origin=-24){for(const[j,[x,z]]of points.entries())s.forest.push(rootedPlant(b,s,key+'-'+j,ids[j%ids.length][0],ids[j%ids.length][1],x,z,ground,step,origin));}
export function parkStairs(b:ArchitectureBuilder,s:ParkSource,key:string,x:number,z:number,fromY:number,count:number,tread=.8,width=4,bottom=fromY-.4){
 const instance=parkPart(b,'stairs-'+key,'实体山步与独立踏面',c=>{for(let j=0;j<count;j++){const y=fromY+(j+1)*.2;c.box('实心踏步 '+j,'wall',x-width/2,bottom,z+j*tread,width,y-.05-bottom,tread);c.box('石踏面 '+j,'stone',x-width/2,y-.05,z+j*tread,width,.05,tread);}c.pin('踏步最小销','bronze',[x-width/2+.1,bottom+.1,z+.1]);},['BUILT-007','ENV-087']);
 const record={key,instance,x,z,fromY,count,tread,width,rise:.2,endZ:z+count*tread,toY:fromY+count*.2};s.park.steps.push(record);for(let j=0;j<count;j++)for(const dx of[-1.35,0,1.35])s.walkSamples.push({name:key+' actual tread '+j,point:[x+dx,fromY+(j+1)*.2,z+(j+.5)*tread],width:.2});return record;
}
export function pavilion(b:ArchitectureBuilder,s:ParkSource,key:string,x:number,y:number,z:number,w=7,d=7){const posts=[];for(const xx of[x-w/2,x+w/2])for(const zz of[z-d/2,z+d/2]){const instance=civicPost(b,4,.28,[xx,y,zz]);s.contacts.push({name:key+' true pavilion foot',point:[xx,y-.02,zz],exclude:instance});posts.push(instance);}const top=roof(b,w,d,[x,y+4,z],1.4,'hip');return{posts,roof:top,at:[x,y,z],size:[w,d]};}
export function gardenBridge(b:ArchitectureBuilder,s:ParkSource,key:string,x:number,z:number,length:number,y:number,ground:HeightField,width=4.4){const bridge=supportedPad(b,s,key,[x-length/2,z-width/2,x+length/2,z+width/2],y,ground);for(const zz of[z-width/2+.16,z+width/2-.16])parkGuard(b,s,key+'-rail',[x-length/2+.1,y,zz],[x+length/2-.1,y,zz]);route(s,key+' actual bridge',[[x-length/2+.1,y,z],[x+length/2-.1,y,z]],3);return bridge;}
export function placedRock(b:ArchitectureBuilder,s:ParkSource,key:string,pos:V3,id='ENV-015',params:Record<string,string|number>={}){const asset=b.original(id,params),instance=b.place(asset,pos,0,'garden-rock'),a=b.p.assets[asset],cells=[...new Grid(a.chunks).cells()],min=Math.min(...cells.map(([v])=>a.origin[1]+v[1]*a.cellSize));const samples=cells.filter(([v])=>Math.abs(a.origin[1]+v[1]*a.cellSize-min)<1e-7).filter((_,j)=>j%7===0).map(([v])=>v.map((n,d)=>pos[d]+a.origin[d]+(n+(d===1?0:.5))*a.cellSize)as V3);s.park.rockContacts.push({key,instance,samples,kind:'original rock base',minimumContacts:samples.length});return instance;}
export function stackRock(b:ArchitectureBuilder,s:ParkSource,lower:string){const i=b.instances.find(i=>i.id===lower)!,a=b.p.assets[i.assetId],cells=[...new Grid(a.chunks).cells()].filter(([,mat])=>b.p.materials[mat].solid),top=Math.max(...cells.map(([v])=>a.origin[1]+(v[1]+1)*a.cellSize)),v=cells.find(([v])=>Math.abs(a.origin[1]+(v[1]+1)*a.cellSize-top)<1e-7)![0],target:V3=v.map((n,d)=>i.position[d]+a.origin[d]+(n+(d===1?1:.5))*a.cellSize)as V3,asset=b.original('ENV-017',{shoreSize:1.2}),upper=b.p.assets[asset],uc=[...new Grid(upper.chunks).cells()].filter(([,m])=>b.p.materials[m].solid),bottom=Math.min(...uc.map(([v])=>upper.origin[1]+v[1]*upper.cellSize)),base=uc.find(([v])=>Math.abs(upper.origin[1]+v[1]*upper.cellSize-bottom)<1e-7)![0],pos:V3=target.map((n,d)=>Math.round((n-upper.origin[d]-(base[d]+(d===1?0:.5))*upper.cellSize)*5)/5)as V3,instance=b.place(asset,pos,0,'stacked-rock');s.park.rockContacts.push({key:'single finite stone-to-stone joint',instance,samples:[target],kind:'stacked original shore rock',minimumContacts:1,lower,stabilityCertified:false});return instance;}
export function guideMap(b:ArchitectureBuilder,s:ParkSource,key:string,at:V3,paths:{name:string;points:V3[]}[]){
 const segments=paths.flatMap(r=>r.points.slice(1).map((p,j)=>({route:r.name,from:r.points[j],to:p}))),map=(v:V3):V3=>[at[0]+v[0]*.105,at[1]+2.0-v[2]*.07,at[2]-.096];
 const instance=parkPart(b,'guide-'+key,'实际作者路线的实体导览板与印墨',c=>{for(const x of[at[0]-1.65,at[0]+1.65]){c.box('牌座','stone',x-.2,at[1],at[2]-.3,.4,.3,.6);c.box('实体牌杆','metal',x-.06,at[1]+.2,at[2]-.08,.12,3.5,.16);}c.box('实体金属牌板','metalTeal',at[0]-1.8,at[1]+.7,at[2]-.07,3.6,2.8,.14);c.box('独立不透明实涂底','printedDark',at[0]-1.7,at[1]+.8,at[2]-.086,3.4,2.6,.012);for(const r of segments)c.beam('同源可达路线印墨','printedMark',map(r.from),map(r.to),.04,.008);for(const r of paths){const p=map(r.points.at(-1)!);c.box('有限作者目的点印墨','printedMark',p[0]-.07,p[1]-.07,p[2]-.008,.14,.14,.012);}c.pin('导览板定位销','bronze',[at[0]-1.64,at[1]+.24,at[2]]);},['BUILT-045','LIFE-140']);
 s.park.wayfinding.push({key,instance,at,segments,authorDestinations:paths.map(r=>({name:r.name,point:r.points.at(-1)})),originalPlaceNamesAvailable:false,hologram:false,powerBound:false});for(const x of[at[0]-1.65,at[0]+1.65])s.contacts.push({name:'guide actual foot',point:[x,at[1]-.02,at[2]],exclude:instance});return instance;
}
