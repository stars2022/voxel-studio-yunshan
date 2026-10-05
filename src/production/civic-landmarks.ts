import {createHash} from 'node:crypto';
import type {Assembly,Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {architectureRail} from './architecture-components';
import {CivicComponent,civicPlate,civicWall,civicStair,civicRoof,type Opening} from './civic-components';

export const civicLandmarkIds=['BUILT-079','BUILT-080','BUILT-081','BUILT-086','BUILT-087','BUILT-092','BUILT-093'];
const hole:Opening={min:[-2.8,-5.4],max:[2.8,5.4]};
export function civicAsset(b:ArchitectureBuilder,key:string,make:(id:string)=>Project['assets'][string]){return b.asset('civic-'+key.slice(0,42)+'-'+createHash('sha256').update(key).digest('hex').slice(0,10),make);}
export function plate(b:ArchitectureBuilder,w:number,d:number,y:number,at:[number,number]=[0,0],holes:Opening[]=[],wood=false){return b.place(civicAsset(b,'plate-'+w+'-'+d+'-'+JSON.stringify(holes)+'-'+wood,id=>civicPlate(b.p,id,w,d,holes,.4,wood)),[at[0],y,at[1]],0,'floor');}
export function wall(b:ArchitectureBuilder,w:number,h:number,pos:V3,rot=0,door=false,open=false){return b.place(civicAsset(b,'wall-'+w+'-'+h+'-'+door+'-'+open,id=>civicWall(b.p,id,w,h,door,open)),pos,rot,'facade');}
export function roof(b:ArchitectureBuilder,w:number,d:number,pos:V3,rise=2,form:'hip'|'gable'='hip',inner?:[number,number]){return b.place(civicAsset(b,'roof-'+w+'-'+d+'-'+rise+'-'+form+'-'+(inner?.join('-')??'closed'),id=>civicRoof(b.p,id,w,d,rise,form,inner)),pos,0,'roof');}
export function stairs(b:ArchitectureBuilder,height:number,pos:V3,rotation=0){return b.place(civicAsset(b,'stair-'+height,id=>civicStair(b.p,id,height)),pos,rotation,'stair');}
export function civicPost(b:ArchitectureBuilder,height:number,width:number,pos:V3){return b.place(civicAsset(b,'post-'+height+'-'+width,id=>{const c=new CivicComponent(b.p,id,'石础、木柱与金属承箍',['BUILT-059','BUILT-089'],{height,width});c.box('砌石基座','stone',-width*.7,0,-width*.7,width*1.4,.5,width*1.4);c.box('实木柱身','wood',-width/2,.5,-width/2,width,height-.5,width);for(const y of[.5,height-.25]){c.box('结构柱箍','metal',-width*.55,y,-width*.55,width*1.1,.18,width*1.1);c.pin('柱箍铜销','bronze',[0,y+.08,-width*.55-.01]);}return c.finish();}),pos,0,'column');}
export function rail(b:ArchitectureBuilder,w:number,pos:V3,rotation=0){return b.place(civicAsset(b,'rail-'+w,id=>architectureRail(b.p,id,w)),pos,rotation,'guard');}
export function lamp(b:ArchitectureBuilder,pos:V3){return b.place(civicAsset(b,'court-lamp',id=>{const c=new CivicComponent(b.p,id,'独立六米庭灯与未绑定灯芯',['ENV-104'],{powerBound:false});c.box('石座','stone',-.45,0,-.45,.9,.4,.9);c.box('木灯杆','wood',-.13,.4,-.13,.26,5.1,.26);c.box('灯底托','bronze',-.36,5.35,-.36,.72,.14,.72);for(const x of[-.32,.26])for(const z of[-.32,.26])c.box('金属灯框','metal',x,5.49,z,.06,.7,.06);for(const z of[-.31,.29])c.box('独立玻璃罩','glass',-.25,5.5,z,.5,.65,.02);for(const x of[-.31,.29])c.box('侧玻璃罩','glass',x,5.5,-.25,.02,.65,.5);c.box('未通电灯芯','landscapeEmitter',-.08,5.5,-.08,.16,.5,.16);c.box('瓦灯帽','roof',-.4,6.17,-.4,.8,.12,.8);c.pin('灯帽销','bronze',[0,6.27,0]);return c.finish();}),pos,0,'fixture');}
function facadeBox(b:ArchitectureBuilder,w:number,d:number,height:number,y:number,open=false){wall(b,w,height,[0,y,-d/2],0,!open,open);wall(b,w,height,[0,y,d/2],2,false,open);wall(b,d,height,[-w/2,y,0],3,false,open);wall(b,d,height,[w/2,y,0],1,false,open);}
function localHouse(b:ArchitectureBuilder,at:V3,w=24,d=16){
 const start=b.instances.length;plate(b,w,d,0);plate(b,w,d,3.2);facadeBox(b,w,d,3.2,0);facadeBox(b,w,d,3.2,3.2);roof(b,w,d,[0,6.4,0],2,'gable');
 // Explicit right-side connection is opened at both levels; remove only this newly authored wall instance.
 for(const i of b.instances.slice(start).filter(i=>b.groups[i.id]==='facade'&&i.rotation===1)){i.assetId=civicAsset(b,'wall-'+d+'-3.2-true-false',id=>civicWall(b.p,id,d,3.2,true));}
 stairs(b,3.2,[w/2,0,2.6],1);for(const i of b.instances.slice(start))i.position=i.position.map((n,d)=>n+at[d])as V3;
 return{position:at,frontDoor:[at[0],at[1],at[2]-d/2]as V3,upperWalkY:at[1]+3.2,instanceIds:b.instances.slice(start).map(i=>i.id)};
}
export function civicTower(p:Project,catalogId:string,id:string,name:string):Assembly{
 const b=new ArchitectureBuilder(p,id),levels:any[]=[],tierData:any[]=[],stairsPlaced:string[]=[];
 for(const [label,y,h]of[['B2',-9.6,4.8],['B1',-4.8,4.8]]as [string,number,number][]){plate(b,144,112,y,[0,0],[hole]);facadeBox(b,144,112,h,y);levels.push({label,walkY:y,footprint:[144,112],use:'unassigned',permissions:'unbound'});stairsPlaced.push(stairs(b,h,[-2.6,y,-5.4]));}
 for(let tier=0;tier<5;tier++){
  const w=144-18*tier,d=112-14*tier,base=tier*46.8;
  for(let floor=0;floor<6;floor++){const n=tier*6+floor+1,y=(n-1)*7.8,top=n===30;plate(b,w,d,y,[0,0],[hole]);facadeBox(b,w,d,top?5.8:floor===5?6.6:7.8,y,top);levels.push({label:String(n),walkY:y,footprint:[w,d],use:top?'author-observation':'unassigned',permissions:'unbound'});if(!top)stairsPlaced.push(stairs(b,7.8,[-2.6,y,-5.4]));}
  for(const x of[-.42,-.26,-.10,.10,.26,.42])civicPost(b,tier===4?44.8:45.6,1.8,[w*x,base,-d/2-.65]);
  if(tier<4)roof(b,w+12,d+12,[0,base+44.8,0],2,'hip',[w-18,d-14]);else roof(b,w,d,[0,232,0],1.7);
  tierData.push({tier:tier+1,width:w,depth:d,baseY:base,floors:6,frontGiantColumns:6});
 }
 // Six genuine front columns carry a separate entrance roof; its centre axis is open.
 const porchW=144*.68;for(const x of[-.42,-.25,-.08,.08,.25,.42])civicPost(b,8.7,1.2,[x*porchW,0,-66]);roof(b,porchW,12,[0,8,-62],2);
 return b.finish(catalogId,name,{levels,tiers:tierData,stairInstances:stairsPlaced,stairwell:hole,sourceDimensions:{base:[144,112],top:[72,56],tierCount:5,floorsPerTier:6,aboveGroundFloors:30,belowGroundFloors:2,totalHeightM:234},authorFloorPitch:7.8,authorBasementPitch:4.8,actualRoofMaximumY:234,entrance:[0,0,-56],scope:'Exact listed tower envelope and floor counts; explicit author floor/stair geometry. Original per-floor programs, FloorPlan, permissions and controller absent. Top floor is open with 1.1m skirts; no modern sealed glass-tower substitution.'});
}
/** Rectangular path union uses exact input edges, not sampled voxel cells. */
export function pathNetwork(b:ArchitectureBuilder,key:string,paths:V3[][],width=4){
 return b.place(civicAsset(b,key,id=>{const c=new CivicComponent(b.p,id,'正交石铺步行连接',['BUILT-003','BUILT-002'],{paths,width,authorOnly:true});const rects:Opening[]=[];for(const points of paths)for(let i=1;i<points.length;i++){const a=points[i-1],d=points[i];if(a[0]!==d[0]&&a[2]!==d[2]||a[1]!==0||d[1]!==0)throw new Error('Civic court paths are explicit level orthogonal paths');rects.push({min:[Math.min(a[0],d[0])-(a[0]===d[0]?width/2:0),Math.min(a[2],d[2])-(a[2]===d[2]?width/2:0)],max:[Math.max(a[0],d[0])+(a[0]===d[0]?width/2:0),Math.max(a[2],d[2])+(a[2]===d[2]?width/2:0)]});if(i<points.length-1)rects.push({min:[d[0]-width/2,d[2]-width/2],max:[d[0]+width/2,d[2]+width/2]});}const xs=[...new Set(rects.flatMap(r=>[r.min[0],r.max[0]]))].sort((a,b)=>a-b),zs=[...new Set(rects.flatMap(r=>[r.min[1],r.max[1]]))].sort((a,b)=>a-b);for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;if(!rects.some(r=>x>r.min[0]&&x<r.max[0]&&z>r.min[1]&&z<r.max[1]))continue;c.box('路径承板','structuralConcrete',xs[i],-.4,zs[j],xs[i+1]-xs[i],.32,zs[j+1]-zs[j]);c.box('路径石面','stone',xs[i],-.08,zs[j],xs[i+1]-xs[i],.08,zs[j+1]-zs[j]);}return c.finish();}),[0,0,0],0,'walk');
}
export function makeCivicLandmark(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}):Assembly{
 if(catalogId==='BUILT-086')return civicTower(p,catalogId,id,name);
 const b=new ArchitectureBuilder(p,id),stairInstances:string[]=[],source:any={parameters:params,scope:'Finite author civic assembly; original terrain, FloorPlan, permission and transport state remain unbound.'};
 if(catalogId==='BUILT-079'){
  const program=String(params.program??'bank');plate(b,16,12,0);plate(b,16,12,3.2,[0,0],[{min:[-4,-3],max:[4,3]}]);facadeBox(b,16,12,3.2,0);const side=b.instances.find(i=>b.groups[i.id]==='facade'&&i.rotation===1)!;side.assetId=civicAsset(b,'wall-12-3.2-true-false',id=>civicWall(p,id,12,3.2,true));stairInstances.push(stairs(b,3.2,[8,0,2.6],1));
  const glass=civicAsset(b,'platform-skylight-'+program,id=>{const c=new CivicComponent(p,id,'实际开洞上的双坡采光玻璃',['BUILT-006','BUILT-017','BUILT-013'],{hole:[8,6],program});const xs=program==='bank'?[-4,-2.3,-1.9,1.9,2.3,4]:[-4,4],zs=program==='bank'?[-3,-1.8,-1.4,0,1.4,1.8,3]:[-3,0,3],height=(z:number)=>1.2-Math.abs(z)*.22;for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;if(program==='bank'&&Math.abs(Math.abs(x)-2.1)<.2&&Math.abs(Math.abs(z)-1.6)<.2)continue;c.surface('独立采光玻璃','glass',[xs[i],xs[i+1]],[zs[j],zs[j+1]],(_,z)=>height(z),.025);}for(const side of[-1,1])for(const x of[-4,0,4])c.surface('采光压框','facadeFrame',[x-.05,x+.05],[0,side*3].sort((a,b)=>a-b),(_,z)=>height(z)+.025,.07);for(const x of[-4,4])c.box('采光木基梁','wood',x-.1,-.2,-3,.2,1.42,6);for(const z of[-3,3])c.box('采光长边木框','wood',-4,-.2,z-.1,8,.76,.2);if(program==='bank')for(const z of[-1.6,1.6])c.box('中央亭帽穿孔支承梁','woodEdge',-4,-.20,z-.18,8,.24,.36);return c.finish();});b.place(glass,[0,3.2,0],0,'roof');
  if(program==='bank'){for(const x of[-2.1,2.1])for(const z of[-1.6,1.6])civicPost(b,2.4,.28,[x,3.2,z]);roof(b,4.2,3.2,[0,5.6,0],1.2);}
  for(const z of[-5.9,5.9])rail(b,15.8,[-7.9,3.2,z]);rail(b,11.8,[-7.9,3.2,-5.9],3);for(const z of[-5.9,2.6])rail(b,3.3,[7.9,3.2,z],3);source.canopyProgram=program;source.skylightThroughOpening={min:[-4,-3],max:[4,3]};source.stairInstances=stairInstances;
 }else if(catalogId==='BUILT-080'){
  plate(b,20.8,12,0);const y=4.8;for(const x of[-9.6,-3.2,3.2,9.6])for(const z of[-4.6,4.6])civicPost(b,y,.36,[x,0,z]);
  for(let i=0;i<3;i++){if(i===1)b.roof('industrial',-3.2,y,-4.8,6.4,9.6);else b.place(civicAsset(b,'three-span-outer-roof',id=>civicRoof(p,id,9.6,6.4,1.6,'gable')),[-6.4+i*6.4,y,0],1,'roof');}
  // Side gables use their actual long axis; all column heads have a shared rectangular beam grid.
  const frame=civicAsset(b,'three-span-frame',id=>{const c=new CivicComponent(p,id,'三跨候车棚共用承梁',['BUILT-155','BUILT-059'],{});for(const z of[-4.6,4.6])c.box('跨间通长梁','woodEdge',-9.9,-.2,z-.2,19.8,.4,.4);for(const x of[-9.6,-3.2,3.2,9.6])c.box('纵向承枋','wood',x-.2,-.2,-4.8,.4,.4,9.6);return c.finish();});b.place(frame,[0,y,0],0,'roof');source.spans=3;source.centralSkylight=true;
 }else if(catalogId==='BUILT-081'){
  plate(b,14.4,10,1.2,[0,0],[],true);for(const x of[-6.8,0,6.8])for(const z of[-3.5,3.5])civicPost(b,2.4,.32,[x,1.2,z]);roof(b,13.6,7,[0,3.6,0],2,'gable');const piles=civicAsset(b,'ferry-roof-piles',id=>{const c=new CivicComponent(p,id,'低木棚独立岸桩',['BUILT-113'],{terrainBound:false});for(const x of[-6.8,0,6.8])for(const z of[-4.2,4.2])c.box('浸水木桩','wetPileWood',x-.2,-2,z-.2,.4,3.2,.4);return c.finish();});b.place(piles,[0,0,0]);for(const x of[-7.1,7.1])rail(b,9.8,[x,1.2,-4.9],3);source.canopyDepthRatio=.7;source.authorPlatformDepth=10;source.roofRiseInterpretationM=2;
 }else if(catalogId==='BUILT-087'){
  const core=civicTower(p,'BUILT-086',id+'-core','公务翼院中的主阁');b.instances.push(...core.instances);Object.assign(b.groups,core.source!.instanceGroups);for(const dep of core.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add('BUILT-086');
  const programs=['行政','数据','能源','应急','议会','使馆','档案','金库','换乘','急救','水运'],wings:any[]=[],paths:V3[][]=[[[0,0,-56],[0,0,-142]],[[-86,0,-142],[86,0,-142]],[[-86,0,-142],[-86,0,142]],[[86,0,-142],[86,0,142]]];
  for(let i=0;i<programs.length;i++){const pos:V3=i===10?[0,0,132]:[i<5?-112:112,0,-100+(i%5)*46],house=localHouse(b,pos);wings.push({program:programs[i],...house,permissions:'unbound'});const door=house.frontDoor;if(i===10)paths.push([door,[0,0,114],[-86,0,114]]);else paths.push([door,[door[0],0,door[2]-6],[i<5?-86:86,0,door[2]-6]]);}
  pathNetwork(b,'civic-wing-walkways',paths);source.civicPlan={count:12,mainTowerTemplate:core,wings,authorPaths:paths,sourcePositionsAvailable:false};
 }else if(catalogId==='BUILT-092'){
  plate(b,96,84,0);for(const side of[-1,1])for(let i=0;i<6;i++)lamp(b,[side*40,0,-35+i*14]);
  const flag=civicAsset(b,'court-flag',id=>{const c=new CivicComponent(p,id,'旗杆、悬挂旗布与织入边纹',['LIFE-148','LIFE-185'],{clothMotionBound:false});c.box('旗座','stone',-.5,0,-.5,1,.5,1);c.box('旗杆','metal',-.10,.5,-.10,.20,8.8,.20);c.box('顶部横杆','bronze',-.1,9,-.12,3.1,.15,.24);c.box('真正旗布','bannerCloth',.2,4,-.025,2.6,5,.05);for(const x of[.2,2.7])c.box('织入金边','bannerPattern',x,4,-.03,.10,5,.06);c.pin('横杆销','bronze',[0,9.12,0]);return c.finish();});for(const x of[-9,9])b.place(flag,[x,0,-30],0,'fixture');
  const line=civicAsset(b,'court-center-line',id=>{const c=new CivicComponent(p,id,'中轴嵌装能源面与金属承槽',['BUILT-117'],{powerBound:false});c.box('嵌装金属槽','metal',-.20,-.055,-40,.40,.06,80);c.box('未绑定光学面','civicGuideOptic',-.14,.005,-40,.28,.01,80);return c.finish();});b.place(line,[0,0,0],0,'fixture');source.sourceCourtDimensions=[96,84];source.lampsPerSide=6;source.flagCount=2;
 }else if(catalogId==='BUILT-093'){
  const upperHole:Opening={min:[-.4,-5.4],max:[5.2,5.4]};plate(b,12.8,12.8,0);plate(b,12.8,12.8,3.2,[0,0],[upperHole]);stairInstances.push(stairs(b,3.2,[-.2,0,-5.4]));for(const x of[-5.8,5.8])for(const z of[-5.8,5.8])civicPost(b,6.4,.48,[x,0,z]);
  roof(b,13.2,13.2,[0,2.25,0],.8,'hip',[11.6,11.6]);roof(b,11.6,11.6,[0,6.4,0],2);
  for(const z of[-6.2,6.2])rail(b,12.4,[-6.2,3.2,z]);for(const x of[-6.2,6.2])rail(b,12.4,[x,3.2,-6.2],3);source.stairInstances=stairInstances;source.levelHeights=[0,3.2];source.mainPillars=4;source.openPavilion=true;
 }else throw new Error('Unknown civic landmark');
 return b.finish(catalogId,name,source);
}
