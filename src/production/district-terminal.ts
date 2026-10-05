import type {Assembly,Project,V3} from '../core/types';
import {CivicComponent,type Opening} from './civic-components';
import {civicAsset} from './civic-landmarks';
import {modernPlate,modernPost,modernRail,modernStairs} from './metropolis-components';
import {districtBuilder,districtSource,districtWall,wellGuard,perimeterGuard,thinCanopy,route,ramp,counter} from './district-components';

export function makeDistrictTerminal(p:Project,id:string,name:string):Assembly{
 const b=districtBuilder(p,id),s=districtSource(),wells=[-24,24].map(x=>({min:[x-2.8,-4.2],max:[x+2.8,4.2]}as Opening)),atrium:Opening={min:[-6,-4],max:[6,4]};
 modernPlate(b,88,10,[0,0,-19]);modernPlate(b,72,28,[0,0,0]);modernPlate(b,72,28,[0,4.2,0],[...wells,atrium]);for(const x of[-24,24]){modernStairs(b,4.2,[x-2.6,0,-4.2]);wellGuard(b,wells[x<0?0:1],4.2);}perimeterGuard(b,12,8,[0,4.2,0]);
 for(const y of[0,4.2]){for(const x of[-24,0,24]){districtWall(b,24,4.2,[x,y,-14],0,y===0,true);districtWall(b,24,4.2,[x,y,14],2,x!==0,true);}for(const x of[-36,36])districtWall(b,28,4.2,[x,y,0],x<0?3:1,false,true);}
 const cover=civicAsset(b,'valley-terminal-thin-skylight-roof',aid=>{
  const skylights=[-16,16].map(x=>({min:[x-4,-3],max:[x+4,3]}as Opening));const c=new CivicComponent(p,aid,'连续中式金属薄檐与两处真开采光顶',['BUILT-011','BUILT-012','BUILT-013','BUILT-017'],{width:76,depth:32,skylights,roofAuthority:'continuous-metre-panels',noVoxelResampling:true});const xs=[-38,-20,-12,12,20,38],zs=[-16,-8,-3,0,3,8,16],height=(z:number)=>.25+.24*(Math.abs(z)/16)**4;
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;if(skylights.some(h=>x>h.min[0]&&x<h.max[0]&&z>h.min[1]&&z<h.max[1]))continue;for(const[role,offset,thickness]of[['architecturalCladding',0,.08],['waterproofMembrane',-.08,.02],['metalBright',-.10,.12]]as [string,number,number][])c.surface('薄檐-'+role,role,[xs[i],xs[i+1]],[zs[j],zs[j+1]],(_,zz)=>height(zz)+offset,thickness);}
  for(const center of[-16,16]){const skylight=(z:number)=>height(z)+1.2*(1-Math.abs(z)/3);c.surface('实际双坡采光玻璃','glass',[center-4,center+4],[-3,0,3],(_,z)=>skylight(z),.025);for(const x of[center-4,center,center+4])c.surface('采光顶沿坡压框','facadeFrame',[x-.06,x+.06],[-3,0,3],(_,z)=>skylight(z)+.06,.08);for(const z of[-3,3])c.box('采光顶实体支承边','facadeFrame',center-4.08,-.12,z-.1,8.16,.42,.2);}
  for(const z of[-14,14])c.box('墙顶真实承檩','metal',-36,-.15,z-.18,72,.34,.36);for(const x of[-36,36])c.box('端墙承檩','metal',x-.18,-.15,-14,.36,.34,28);for(const x of[-30,-6,6,30]){c.box('通长薄屋面肋','metal',x-.12,-.15,-14,.24,.3,28);c.pin('屋面最小销','bronze',[x,.08,-13.8]);}return c.finish();});b.place(cover,[0,8.4,0],0,'roof');
 thinCanopy(b,72,5,[0,0,-16.75],[-33,-21,-9,9,21,33],3.6);
 // The two passenger connections have real upper doors, deck seams, gradual ramps and apron contacts.
 for(const x of[-24,24]){modernPlate(b,4.8,12,[x,4.2,20]);for(const xx of[x-2,x+2])for(const z of[16,24])modernPost(b,3.8,.35,[xx,0,z]);for(const xx of[x-2.4,x+2.4])modernRail(b,12,[xx,4.2,14],3);ramp(b,'terminal-apron-'+x,[x,4.2,26],[x,0,68],4.8);route(s,'waiting-floor to apron '+x,[[x+1.4,4.2,-4.5],[x+4,4.2,-4.5],[x+4,4.2,6],[x,4.2,6],[x,4.2,14],[x,4.2,26],[x,0,68],[x,0,73]]);}
 modernPlate(b,92,62,[0,0,45]);modernPlate(b,120,20,[0,0,86]);
 const paint=civicAsset(b,'valley-terminal-apron-ink',aid=>{const c=new CivicComponent(p,aid,'作者机坪接续线与未绑定跑道样段',['BUILT-175','BUILT-176'],{authorOnly:true,sourceAirportOverwritten:false});for(const x of[-24,24]){c.box('机坪真实黄涂线','airfieldYellow',x-.08,.001,69,.16,.005,6);c.box('候机连接止步红线','airfieldRed',x-3,.001,74,6,.005,.15);}for(let x=-54;x<=54;x+=12)c.box('跑道样段白中线','airfieldWhite',x,.001,85.7,6,.005,.6);for(const z of[77,95])c.box('跑道白边线','airfieldWhite',-60,.001,z,120,.005,.12);return c.finish();});b.place(paint,[0,0,0],0,'marking');
 for(const x of[-10,10])counter(b,[x,0,-9]);route(s,'ground terminal entrance',[[0,0,-23],[0,0,-14],[0,0,-7],[22.6,0,-7],[22.6,0,-4.5]]);route(s,'apron level runway connection',[[0,0,70],[0,0,76],[0,0,84]]);
 s.levels=[{walkY:0,proposedUse:'arrival/check-in',permissions:'unbound'},{walkY:4.2,proposedUse:'waiting/departure',permissions:'unbound'}];s.terminalFootprint=[72,28];s.skylightCenters=[-16,16];s.passengerRamp={rise:4.2,run:42,width:4.8};s.apronAndRunwaySampleWalkY=0;s.originalAirportRetained=true;s.originalFlightAndRentalControllerBound=false;s.sourceAircraftPadIdsInvented=false;s.authorRunwaySampleDimensions=[120,20];
 return b.finish('BUILT-265',name,s);
}
