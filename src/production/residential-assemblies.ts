import {createHash} from 'node:crypto';
import {Grid} from '../core/grid';
import type {Project,V3,Asset} from '../core/types';
import {geometryData} from '../core/sky';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {civicAsset} from './civic-landmarks';
import {CivicComponent} from './civic-components';
import {parkSource,pavedPad} from './park-components';
import {route} from './district-components';
export const residentialAssemblyIds=['LIFE-058','LIFE-059','LIFE-060','LIFE-061'];
const hash=(a:Asset)=>createHash('sha256').update(JSON.stringify(geometryData(a))).digest('hex');
/** Explicit material-only derivatives; historic canonical masters remain intact. */
export function residentialFurniture(b:ArchitectureBuilder,num:number){
 const catalogId='LIFE-'+String(num).padStart(3,'0'),original=b.original(catalogId);
 if(![2,3,4,18,108].includes(num))return original;
 return b.asset('room-material-'+num,id=>{
  const source=b.p.assets[original],a=structuredClone(source),g=new Grid(a.chunks),s=b.p.styles.yunshan,changes:Record<string,number>={};
  for(const[cell,material]of g.cells()){
   const v=cell.map((n,k)=>a.origin[k]+(n+.5)*a.cellSize);let target=material;
   if((num===2||num===4)&&material===s.paper)target=s.cottonWhite;
   if(num===2&&material===s.wall)target=s.fabricEdge;
   if(num===3&&material===s.energy)target=s.displayGlyph;
   if(num===18&&material===s.energy)target=v[1]>=.18&&v[1]<.42&&v[2]>=.03&&v[2]<.04?s.displayGlyph:s.opticsGlow;
   if(num===108){if(material===s.paper)target=s.paperSheet;else if(material===s.fabric)target=s.bookCloth;else if(material===s.woodEdge)target=s.bookCover;}
   if(target!==material){if(!b.p.materials[target]||b.p.materials[target].solid!==b.p.materials[material].solid)throw new Error('Material correction must preserve collision occupancy');g.set(cell,target);const key=material+'->'+target;changes[key]=(changes[key]??0)+1;}
  }
  a.id=id;a.name=source.name+' · 用途材质派生';a.chunks=g.serialize();
  a.source={kind:'assembly-derived-component',baseCatalogIds:[catalogId],notCatalogMaster:true,sourceAssetId:original,sourceGeometrySHA256:hash(source),materialOnly:true,materialChanges:changes,materialAssignmentRevision:1,reason:'Retain every occupied cell, origin, part, opening and port. Cotton/seam, display pixels/optical strips and paper/cloth book binding are separate existing semantic roles; original canonical asset retained. Bookcase stone planter and stone insets remain stone.'};return a;
 });
}
export function makeResidentialAssembly(p:Project,catalogId:string,id:string,name:string){
 const b=new ArchitectureBuilder(p,id),s=parkSource(),n=Number(catalogId.slice(5)),[w,d]=n===58?[5.8,4.8]:n===59?[6.2,5.4]:n===60?[4.4,3.6]:[6.0,5.6];
 s.room={dimensions:[w,2.8,d],floorY:0,entrance:[w/2,0,0],usePoints:[],seats:[],supportedPairs:[],mounts:[],sourceLegacy:'life-20261002143409-scene-'+String(n).padStart(3,'0')+'.ysvox.json',legacyLayoutRetainedInOriginalFile:true,originalFloorPlanBound:false,utilitiesBound:false};const room=s.room as any;
 pavedPad(b,s,'room-'+n,[0,0,w,d],0,-.28);
 const shell=civicAsset(b,'room-shell-'+n,id=>{const c=new CivicComponent(p,id,'真实窗洞、木梁与切角房间墙',['BUILT-003','BUILT-015','BUILT-017','BUILT-059'],{w,d,height:2.8,cutawaySides:['front','right'],doorWidth:1.4});
  // Back wall and a side window are actual structural surfaces. Two camera sides are intentionally open.
  c.box('后墙砂浆芯','mortar',0,0,d,w,2.64,.14);for(let x=.02;x<w-.02;x+=.58)for(let y=.02;y<2.62;y+=.33)c.box('后墙分层石块','wall',x,y,d-.015,Math.min(.56,w-x-.01),Math.min(.31,2.63-y),.025);
  c.box('侧窗下裙','wall',-.14,0,0,.14,.9,d);c.box('侧窗上墙','wall',-.14,2.25,0,.14,.39,d);for(const z of[0,d-1])c.box('侧窗实垛','wall',-.14,.9,z,.14,1.35,1);
  c.box('独立侧窗玻璃','glass',-.06,.94,1.06,.015,1.25,d-2.12);for(let z=1.04;z<d-1;z+=.42)c.box('窗竖木格','wood',-.1,.92,z,.13,1.33,.035);c.box('窗横木格','woodEdge',-.1,1.6,1,.13,.04,d-2);
  for(const [x,z]of[[0,0],[0,d],[w,d]]){c.box('独立墙角木柱','wood',x-.08,0,z-.08,.16,2.8,.16);for(const y of[.10,2.5]){c.box('柱头金属箍','metal',x-.095,y,z-.095,.19,.10,.19);c.pin('墙角铜销','bronze',[x-.02,y+.02,z-.10]);}}
  c.box('后墙通长承梁','woodEdge',-.08,2.64,d-.10,w+.16,.16,.20);c.box('左墙通长承梁','woodEdge',-.10,2.64,-.08,.20,.16,d+.16);
  const half=w/2;for(const [x,W]of[[0,half-.7],[half+.7,half-.7]])c.box('前墙切口踢脚','wood',x,0,-.08,W,.18,.16);for(const x of[half-.78,half+.70])c.box('真实入口侧柱截面','wood',x,0,-.08,.08,.65,.16);
  c.ports=[{id:'door',kind:'author-room-entry',position:[w/2,0,0],normal:[0,0,-1],size:[1.4,2.2,0],pitch:.02}];return c.finish();});room.shell=b.place(shell,[0,0,0],0,'room-shell');
 const place=(num:number,at:V3,q=0,group='furniture')=>b.place(residentialFurniture(b,num),at,q,group);
 const use=(key:string,point:V3,width=.7)=>{room.usePoints.push({key,point,width});return point;};
 const pair=(upper:string,lower:string,points:V3[])=>room.supportedPairs.push({upper,lower,points});
 const bed=(x:number,z:number)=>{const frame=place(1,[x,0,z]),mattress=place(2,[x+.06,.42,z+.06]),head=place(3,[x,0,z+2.02]),bedding=place(4,[x+.06,.62,z+.06]);pair(mattress,frame,[[x+.2,.42,z+.2],[x+1.3,.42,z+1.8]]);pair(bedding,mattress,[[x+.3,.62,z+.3]]);room.bed={frame,mattress,head,bedding};};
 const sofa=(x:number,z:number)=>{const frame=place(10,[x,0,z]),pad=place(11,[x+.11,.28,z+.04]);pair(pad,frame,[[x+.3,.28,z+.2],[x+1.4,.28,z+.2]]);room.seats.push({key:'sofa',instance:pad,point:[x+.6,.43,z+.35],approach:use('sofa approach',[x+.6,0,z-.55])});};
 const armchair=(x:number,z:number)=>{const frame=place(12,[x,0,z]),pad=place(13,[x+.11,.28,z+.04]);pair(pad,frame,[[x+.15,.28,z+.23]]);room.seats.push({key:'armchair',instance:pad,point:[x+.35,.43,z+.3],approach:use('armchair approach',[x+.35,0,z-.5])});};
 if(n===58){bed(.7,d-2.36);const cabinet=place(5,[.12,0,d-1.05]),lamp=place(20,[.19,.58,d-.97]);pair(lamp,cabinet,[[.27,.58,d-.82]]);const x=4.04,z=d-.72;place(6,[x,0,z]);place(7,[x+.06,.14,z-.03]);place(8,[x+.04,.14,z+.04]);place(31,[.8,0,.5]);use('right bed side',[2.85,0,3.25]);use('wardrobe front',[4.65,0,3.2]);route(s,'bedroom entrance and storage',[[w/2,0,.4],[w/2,0,1.8],[2.85,0,3.25]],.7);route(s,'bedroom wardrobe',[[w/2,0,1.8],[4.65,0,1.8],[4.65,0,3.2]],.7);
 }else if(n===59){sofa(.65,3.95);armchair(4.2,3.2);const base=place(14,[1.08,0,2.2]),top=place(15,[1.08,.42,2.2]);pair(top,base,[[1.15,.42,2.27],[2.11,.42,2.75]]);place(31,[.8,0,1.6]);place(108,[4.8,0,4.9]);const wallLight=place(29,[3.3,1.55,d-.17]);room.mounts.push({instance:wallLight,wall:room.shell,point:[3.38,1.7,d]});use('bookcase front',[5.5,0,4.25]);route(s,'living entrance to seating',[[w/2,0,.4],[3.1,0,3.4],[1.25,0,3.4]],.7);route(s,'living side chair and books',[[3.1,0,1.5],[4.55,0,1.5],[4.55,0,2.7]],.7);route(s,'bookcase approach',[[3.1,0,1.5],[5.5,0,1.5],[5.5,0,4.25]],.7);
 }else if(n===60){const x=.65,z=2.68,desk=place(16,[x,0,z]);place(17,[x+.08,0,z+.13]);const monitor=place(18,[x+.69,.76,z+.38]),keyboard=place(19,[x+.67,.76,z+.06]),lamp=place(20,[x+.1,.76,z+.35]),book=place(106,[x+.35,.76,z+.11]);pair(monitor,desk,[[x+.95,.76,z+.48]]);pair(keyboard,desk,[[x+.9,.76,z+.15]]);pair(lamp,desk,[[x+.25,.76,z+.5]]);pair(book,desk,[[x+.45,.76,z+.21]]);const chair=place(22,[1.8,0,2.50],2);room.seats.push({key:'desk chair',instance:chair,point:[1.575,.44,2.27],approach:use('desk chair side',[2.45,0,2.2])});place(108,[3.0,0,3.18]);const control=place(30,[2.6,1.15,d]);room.mounts.push({instance:control,wall:room.shell,point:[2.7,1.2,d]});use('bookcase front',[3.55,0,2.55]);route(s,'office doorway to work point',[[w/2,0,.4],[2.45,0,1.3],[2.45,0,2.2]],.7);route(s,'office bookcase',[[2.45,0,1.3],[3.55,0,1.3],[3.55,0,2.55]],.7);
 }else{
  // The old two-hole worktop cannot fit this sink. Retain both old masters;
  // derive only the cabinet's actual sink clearance and build a matching top.
  const z=4.86,original=b.original('LIFE-037'),oldTop=b.original('LIFE-038');
  const cabinet=civicAsset(b,'room-kitchen-sink-cabinet',id=>{const a=structuredClone(p.assets[original]),g=new Grid(a.chunks),removed:any[]=[];for(const [cell,material]of g.cells()){const v=cell.map((n,k)=>a.origin[k]+(n+.5)*a.cellSize);if(v[0]>=.22&&v[0]<=.96&&v[1]>=.68&&v[2]>=.04&&v[2]<=.58){removed.push({cell,material});g.set(cell,0);}}a.id=id;a.name='保留原下柜的水槽上口避让派生';a.chunks=g.serialize();a.source={kind:'assembly-derived-component',baseCatalogIds:['LIFE-037','LIFE-040'],notCatalogMaster:true,sourceAssetId:original,sourceGeometrySHA256:hash(p.assets[original]),removedCells:removed,reason:'Only cut the upper sink volume; canonical cabinet retained.'};return a;});const installed=b.place(cabinet,[.3,0,z],0,'kitchen-cabinet');
  const top=civicAsset(b,'room-kitchen-fitted-worktops',id=>{const c=new CivicComponent(p,id,'匹配盆体的真孔台面与独立灶台',['LIFE-038','LIFE-040'],{oldTop,canonicalRetained:true,sinkOuterHole:[.52,z+.06,1.2,z+.56]});
   for(const[x,Z,X,D]of[[.28,z-.02,.52,z+.62],[1.2,z-.02,1.52,z+.62],[.52,z-.02,1.2,z+.06],[.52,z+.56,1.2,z+.62]])c.box('真实盆外留孔石台','stone',x,.82,Z,X-x,.06,D-Z);
   c.box('独立备餐灶台面','stone',1.58,.82,z-.02,1.24,.06,.64);for(const zz of[z+.10,z+.43])c.box('盆底承托钢枨','metal',.39,.68,zz,.92,.02,.025);c.pin('台面最小接件','bronze',[.34,.84,z+.02]);return c.finish();});const counterTop=b.place(top,[0,0,0],0,'kitchen-top'),sink=place(40,[.53,.70,z+.07]);place(37,[1.6,0,z]);const stove=place(39,[1.8,.88,z+.04]);
  // Real wall mounting rails meet the separate hanging hood, without closing its intake.
  const mounts=civicAsset(b,'room-kitchen-wall-mounts',id=>{const c=new CivicComponent(p,id,'吊柜与烟罩实际壁挂承件',['LIFE-039','LIFE-041'],{});c.box('吊柜后墙实接承轨','metal',.53,1.74,z+.35,.55,.06,d-(z+.35));c.box('烟罩后上部承轨避开进气口','metal',1.9,1.83,z+.51,.55,.04,d-(z+.51));c.pin('壁挂最小销','bronze',[.6,1.76,d-.02]);return c.finish();});room.mounts.push({instance:b.place(mounts,[0,0,0],0,'wall-mount'),wall:room.shell,point:[.6,1.77,d]});place(41,[.48,1.4,d-.34]);place(43,[3.2,0,d-.74]);place(42,[4.5,0,d-.52]);const prep=place(48,[2.05,.88,z+.13]);room.kitchen={sink,counterTop,installedCabinet:installed,canonicalCabinet:original,canonicalWorktop:oldTop,stove,prep,bowlCenter:[.86,.79,z+.28],hoodIntake:[2.16,1.76,z+.30],hoodGaps:[1.89,2.05,2.21].map(x=>[x,1.74,z+.26]),hoodGrille:[1.87,1.74,z+.26],appliancesPowered:false};
  const table=place(21,[1.25,0,1.55]);for(const [x,zz,q]of[[1.75,1.40,2],[2.40,1.40,2],[1.32,2.83,0],[2.15,2.83,0]]){const chair=place(22,[x,0,zz],q);room.seats.push({key:'dining chair',instance:chair,point:q?[x-.22,.44,zz-.22]:[x+.22,.44,zz+.22],approach:q?[x-.22,0,zz-.8]:[x+.22,0,zz+.9]});}const tea=place(49,[1.65,.74,1.76]);pair(tea,table,[[1.8,.74,1.9]]);use('sink front',[.86,0,4.15]);use('stove front',[2.16,0,4.15]);use('fridge front',[3.55,0,4.15]);use('food store front',[4.98,0,4.3]);route(s,'kitchen doorway and appliance aisle',[[w/2,0,.7],[3.5,0,.8],[3.5,0,4.15],[.86,0,4.15]],.7);route(s,'kitchen storage',[[3.5,0,3.9],[4.98,0,3.9],[4.98,0,4.3]],.7);
 }
 s.scope='Author room cutaway with real door/window, floor and finite use points. Canonical furniture retained; explicit sink cabinet derivation and fitted top are saved separately. No original FloorPlan, sleeping/sitting/cooking controller, energy, inventory or human art acceptance.';return b.finish(catalogId,name,JSON.parse(JSON.stringify(s)));
}
