import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {fleetSource,type FleetSource} from './fleet-components';
import {terrainTile,terrainPad,terrainHeightAt,grove,waterRibbon,type HeightField} from './landscape-components';
import {bridgeSpan} from './transport-structures';
import {districtHouse,route} from './district-components';
export const landscapeAssemblyIds=['ENV-002','ENV-003','ENV-004','ENV-009','ENV-025'];
export const authorMountains=[[-108,-58,49,31,28],[-62,-24,55,38,30],[-14,-54,76,36,31],[39,-39,64,35,34],[103,-57,58,27,32],[-108,46,68,31,34],[-54,52,76,37,29],[8,30,85,32,36],[59,55,68,30,31],[111,30,54,30,35]];
export const gaussianHeight:HeightField=(x,z)=>7+authorMountains.reduce((n,[cx,cz,h,sx,sz])=>n+h*Math.exp(-((x-cx)**2/(sx*sx)+(z-cz)**2/(sz*sz))),0);
export const authorRidges:V3[][]=[ [[-140,45,-52],[-92,85,-60],[-62,132,-32],[-22,96,-49],[24,174,-14],[67,110,-30],[105,146,-5],[140,50,28]], [[-118,30,84],[-88,108,51],[-41,148,44],[-18,66,15],[24,174,-14]], [[-41,148,44],[18,96,64],[63,137,46],[105,146,-5]] ];
const segment=(x:number,z:number,a:V3,b:V3)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz)));return{distance:Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz),height:a[1]+(b[1]-a[1])*t};};
export const ridgeHeight:HeightField=(x,z)=>{let h=8;for(const r of authorRidges)for(let j=1;j<r.length;j++){const q=segment(x,z,r[j-1],r[j]),width=25+6*Math.sin(x*.023+z*.041),envelope=Math.max(0,1-q.distance/width);h=Math.max(h,8+q.height*envelope**1.15);}return h+2*(1+Math.sin(x*.15)*Math.sin(z*.13));};
const riverX=(z:number)=>Math.abs(z)<12?0:18*Math.sin((z-Math.sign(z)*12)/52);
export const valleyRaw:HeightField=(x,z)=>{const main=Math.abs(x-riverX(z)),side=segment(x,z,[-144,0,-60],[-30,0,0]).distance,d=Math.min(main,x<-30?side:x<0?Math.abs(z):main),shoulder=80+140*(.5+.5*Math.sin(x*.017+z*.011)),r=Math.max(0,d-7);return 8+(shoulder-8)*(1-Math.exp(-((r/18)**1.4)));};
type CitySite={x:number;z:number;level:number;side:1|3};
function cityField(raw:HeightField,sites:CitySite[],bridges:{z:number;level:number;length:number}[]):HeightField{return(x,z)=>{let h=raw(x,z);for(const p of sites){const d=Math.max(Math.abs(x-p.x),Math.abs(z-p.z)),mix=Math.max(0,Math.min(1,(24-d)/8));h=h*(1-mix)+p.level*mix;}for(const p of bridges){if(Math.abs(x)>p.length/2)continue;const mix=Math.max(0,Math.min(1,(14-Math.abs(z-p.z))/4)),cut=Math.min(h,p.level-3);h=h*(1-mix)+cut*mix;}return h;};}
function city(b:ArchitectureBuilder,s:FleetSource,key:string,raw:HeightField,levels:[number,number],sizeZ=288){
 const sites:CitySite[]=[{x:-124,z:-60,level:levels[0],side:1},{x:124,z:-60,level:levels[0],side:3},{x:-124,z:60,level:levels[1],side:1},{x:124,z:60,level:levels[1],side:3}],spans=[{z:-60,level:levels[0]+.2,length:232},{z:60,level:levels[1]+.2,length:232}],height=cityField(raw,sites,spans),step=4;
 const zs=sizeZ===288?[-96,0,96]:[-48,48];for(const x of[-96,0,96])for(const z of zs)terrainTile(b,s,key+'-cliff',[x,0,z],height,step);
 const houses=[];for(const[j,p]of sites.entries()){const actual=terrainHeightAt(height,p.x,p.z,step),y=terrainPad(b,s,key+'-city-'+j,p.x,p.z,actual,20,22);houses.push(districtHouse(b,s,key+'-cliff-house-'+j,[p.x,y,p.z],14,16,3,false,{level:0,side:p.side}));}
 const bridges=spans.map((r,j)=>bridgeSpan(b,s,key+'-city-bridge-'+j,0,r.z,r.length,10,r.level,(x,z)=>terrainHeightAt(height,x,z,step)));
 for(const p of sites){const sign=Math.sign(p.x);route(s,key+' bridge to actual side door '+p.x+','+p.z,[[sign*114,p.level+.2,p.z+1],[sign*119,p.level+.2,p.z+1]],.7);}
 s.cliffCity={sites,bridges,houses,localCutDomains:sites.map(p=>({center:[p.x,p.z],flatHalfSize:16,blendOuterHalfSize:24,groundLevel:p.level})),roadsCutOnlyAtActualBridgeCorridors:true,originalUrbanDensityBound:false};return height;
}

export const waterfallRaw:HeightField=(x,z)=>{
 const mainBed=z<=-20?158.7:z>=-12?5.7:158.7-(z+20)/8*153,riverDistance=Math.max(0,Math.abs(x)-14),shoulder=175+55*Math.sin(x*.02+z*.012)**2;let h=mainBed+(shoulder-mainBed)*(1-Math.exp(-((riverDistance/21)**1.5)));
 if(x<=0&&x>=-144){const sideBed=x<=-40?53.7:x>=-24?5.7:53.7-(x+40)/16*48,d=Math.max(0,Math.abs(z-40)-6),side=sideBed+(210-sideBed)*(1-Math.exp(-((d/15)**1.5)));h=Math.min(h,side);}return h;
};
export function makeLandscapeAssembly(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 const b=new ArchitectureBuilder(p,id),s=fleetSource();
 s.terrainAuthority='Actual authored closed triangles and separate0.2m minimum rock cells. Historical full0.2m voxel masters remain unchanged; no identical continuous/voxel collision claim.';
 if(catalogId==='ENV-002'){
  const detail=String(params.terrainDetail??'near'),height:HeightField=(x,z)=>{const d=Math.max(0,Math.abs(x-12*Math.sin(z/36))-16);let h=8+(44+9*Math.sin(z*.024)+6*Math.cos(x*.032))*(1-Math.exp(-d*d/280));for(const x0 of[-84,84]){const r=Math.max(Math.abs(x-x0),Math.abs(z)),mix=Math.max(0,Math.min(1,(18-r)/12));h=h*(1-mix)+76*mix;}return h;};
  for(const x of[-48,48])for(const z of[-48,48])terrainTile(b,s,'chunked-source',[x,0,z],height,2,detail);
  const points:V3[]=Array.from({length:25},(_,j)=>{const z=-96+j*8;return[12*Math.sin(z/36),8.3,z];});waterRibbon(b,'chunk-river',points,8);
  s.bridges=[bridgeSpan(b,s,'chunk-valley-crossing',0,0,160,8,76,(x,z)=>terrainHeightAt(height,x,z,2))];s.forest=grove(b,s,'chunk-grove',height,[[-76,-66],[-42,-32],[-65,35],[-38,70],[48,-70],[71,-32],[42,34],[76,66]],2);
  route(s,'chunk bridge joins actual terrain banks',[[-88,76,1],[88,76,1]],.7);s.parameters={terrainDetail:detail};s.chunking={chunkSizeM:96,tiles:4,nearSamplingM:2,proxyInteriorSamplingM:8,proxyBoundarySamplingM:2,proxySelection:'manual finite form only',sourceRuntimeSamples:{near:[1,2],far:[16,8,4],cacheTiles:18},originalStreamingBound:false};
  s.physicalAuthorityBindings=(s.terrainTiles as any[]).map(t=>({instanceId:t.instance,visualAssetId:t.assetId,collisionAssetId:t.authorityAssetId}));s.proxyCollisionScope='The manual far document retains near geometry and explicit bindings. terrain-authority.json carries the physical placement descriptor; automatic renderer/physics binding and distance streaming are not implemented.';
 }else if(catalogId==='ENV-003'||catalogId==='ENV-004'){
  const gaussian=catalogId==='ENV-003',height=gaussian?gaussianHeight:ridgeHeight;for(const x of[-96,0,96])for(const z of[-48,48])terrainTile(b,s,gaussian?'ten-author-gaussians':'connected-irregular-ridges',[x,0,z],height,4);
  s.forest=grove(b,s,gaussian?'gaussian-forest':'ridge-forest',height,[[-120,-76],[-82,-42],[-36,-62],[20,-52],[64,-62],[112,-30],[-116,56],[-72,42],[-24,60],[26,44],[64,66],[116,48]]);
  if(gaussian)s.mountains={formula:'7 + sum(h * exp(-((x-cx)^2/sx^2 + (z-cz)^2/sz^2)))',authorParameters:authorMountains,sourceParameterCount:10,originalParametersAvailable:false,instancesNotNewMasters:true};else s.ridges={authorPaths:authorRidges,connectedCrests:true,sourceAlgorithmAvailable:false,method:'Joined asymmetric polyline ridge envelopes with explicit saddles and side ridges; no random scaling of the Gaussian template.'};
 }else if(catalogId==='ENV-009'){
  const height=city(b,s,'deep-valley',valleyRaw,[144,104]),points:V3[]=Array.from({length:37},(_,j)=>{const z=-144+j*8;return[riverX(z),8.3,z];});waterRibbon(b,'deep-valley-main',points,8);waterRibbon(b,'deep-valley-tributary',[[-144,8.3,-60],[-30,8.3,0],[-4,8.3,0]],6);
  s.forest=grove(b,s,'valley-forest',height,[[-88,-110],[76,-112],[-62,108],[80,108],[-74,20],[80,20]]);s.deepValley={authorWorldSize:[288,288],shoulderRangeM:[80,220],mainValley:true,sideValley:true,riverSurfaceY:8.3,originalWorldBound:false};s.waterJunctions=[{name:'side branch to main channel',point:[-4,8.24,0],minimumPieces:2}];
 }else{
  const height=city(b,s,'waterfall-city',waterfallRaw,[172,84],192);
  const upstream=waterRibbon(b,'upper-main-river',[[0,159,-96],[0,159,-20]],24),fall=waterRibbon(b,'153m-main-curtain',[[0,159,-20],[0,6,-12]],24,'fallWater',76),lower=waterRibbon(b,'lower-main-river',[[0,6,-12],[0,6,96]],24,'flowWater',76+Math.hypot(153,8));
  waterRibbon(b,'side-upper-stream',[[-144,54,40],[-40,54,40]],8);waterRibbon(b,'side-curtain',[[-40,54,40],[-24,6,40]],8,'fallWater',104);waterRibbon(b,'side-lower-stream',[[-24,6,40],[-12,6,40]],8,'flowWater',104+Math.hypot(48,16));
  s.forest=grove(b,s,'falls-forest',height,[[-82,-72],[80,-72],[-68,72],[80,72],[-74,-6],[82,-6]]);s.waterfalls={main:{dropM:153,widthM:24,upstream,fall,lower},side:{dropM:48,widthM:8},visualSurfaceOnly:true,flowAndOriginalShaderBound:false};s.waterJunctions=[{name:'main lip',point:[0,158.94,-20],minimumPieces:2},{name:'main foot',point:[0,5.94,-12],minimumPieces:2},{name:'side lip',point:[-40,53.94,40],minimumPieces:2},{name:'side foot',point:[-24,5.94,40],minimumPieces:2},{name:'side/main confluence',point:[-12,5.94,40],minimumPieces:2}];
 }
 return b.finish(catalogId,name,JSON.parse(JSON.stringify(s)));
}
