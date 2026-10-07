import {ShapeUtils,Vector2} from 'three';
import type {Asset,Project,V3,Material} from '../core/types';
import {rotateY} from '../core/types';
import {Grid} from '../core/grid';
import {connectedLine} from '../core/voxel-shapes';
import {geometryData} from '../core/sky';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {makeCatalogAsset} from './catalog-assets';
import {LandscapeComponent,fieldSolid} from './landscape-components';
import {emptyMesh,quad,triangle,roundLoft} from './mesh-shapes';
import {outfitHash as hash} from './outfit-components';
import {variantAppearance,remapVariant} from './variant-appearance';
import {finalVariantSpec} from './final-variant-spec';
type Params=Record<string,string|number>;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function branch(c:LandscapeComponent,label:string,a:V3,b:V3,r0:number,r1:number){
 const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d),n=d.map(v=>v/len),h=Math.hypot(n[0],n[2]),u=h>1e-8?[n[2]/h,0,-n[0]/h]:[1,0,0],v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],m=emptyMesh(label,c.role('treeBark'));
 const rings=[a,b].map((p,k)=>Array.from({length:10},(_,j)=>p.map((x,i)=>x+(k?r1:r0)*(Math.cos(j*Math.PI/5)*u[i]+Math.sin(j*Math.PI/5)*v[i]))as V3));
 for(let j=0;j<10;j++){const k=(j+1)%10,out=rings[0][j].map((x,i)=>x-a[i])as V3;quad(m,[rings[0][j],rings[0][k],rings[1][k],rings[1][j]],out);triangle(m,a,rings[0][j],rings[0][k],n.map(x=>-x)as V3);triangle(m,b,rings[1][j],rings[1][k],n as V3);}c.mesh(m);
}
function cliff(c:LandscapeComponent,p:Params){
 const form=p.cliffForm,step=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);},edge=(x:number)=>.75*(form==='concave'?2.6*Math.cos(x/8*Math.PI/2):form==='convex'?-2.6*Math.cos(x/8*Math.PI/2):form==='end'?3.5*step((x+2)/6):1.5*Math.sin(x*.9));
 const layerDepth=.3,top=(x:number):[number,number][]=>[[-6,2.4],[-2.25+edge(x),2.4],[-1.575+edge(x),7],[.3+edge(x),7],[.975+edge(x),18],[6,18]];
 for(const layer of['bedrock','weatheredRock']){
  const mesh=emptyMesh('沿真实台阶等高线扫掠'+layer,c.role(layer)),stations=Array.from({length:17},(_,k)=>k-8),profiles=stations.map(x=>{const contour=top(x),upper=contour.map(([z,y])=>[z,y-(layer==='bedrock'?layerDepth:0)] as [number,number]),lower=layer==='bedrock'?[[6,.2],[-6,.2]]:contour.map(([z,y])=>[z,y-layerDepth]).reverse();return upper.concat(lower as [number,number][]).map(([z,y])=>[x,y,z]as V3);});
  const N=profiles[0].length;
  for(let k=1;k<profiles.length;k++)for(let j=0;j<N;j++){if(layer==='bedrock'?j<5:j>=6&&j<=10)continue;const next=(j+1)%N,a=profiles[k-1][j],b=profiles[k-1][next],face=[a,b,profiles[k][next],profiles[k][j]],dy=b[1]-a[1],dz=b[2]-a[2];quad(mesh,face,[0,dz,-dy]);}
  for(const k of[0,profiles.length-1]){const contour=profiles[k],faces=ShapeUtils.triangulateShape(contour.map(p=>new Vector2(p[2],p[1])),[]);for(const[a,b,d]of faces)triangle(mesh,contour[a],contour[b],contour[d],[k===0?-1:1,0,0]);}
  c.mesh(mesh);
 }
 for(const x of[-8,7.8])for(const z of[-6,5.8])c.rock(x,0,z);
 return{form,dimensionsM:[16,18,12],sourceTerracesM:[2.4,7,18],continuousTransitionM:.675,weatheringDepthM:layerDepth,construction:'one closed contour-swept exterior partitioned by bedrock/weathered-rock purpose; shared interior faces removed',normals:'actual faceted triangles',surfaceUV:'dominant-face metre projection',authority:'one jointly closed continuous stone shell with two material regions, plus native0.2m underside rock cells',jointMaterialShell:true,interiorFacesRemoved:true};
}
function rock(c:LandscapeComponent,parent:Asset,p:Params){
 const cells=[...new Grid(parent.chunks).cells()].filter(([,m])=>[c.role('bedrock'),c.role('weatheredRock')].includes(m)),rockGrid=new Grid();for(const[v,m]of cells)rockGrid.set(v,m);const bounds=rockGrid.bounds()!,H=(bounds.max[1]-bounds.min[1])*.2,small=p.rockSize==='small'?.5:1,wide=p.rockForm==='lowWide',split=p.rockForm==='split',sx=small*(wide?1.45:1),sy=small*(wide?.48:1),samples=[0,.15,.35,.58,.78,.96];
 const profile=samples.map(t=>{const y=Math.min(bounds.max[1]-1,Math.floor(bounds.min[1]+t*(bounds.max[1]-bounds.min[1]))),layer=cells.filter(([v])=>v[1]===y).map(([v])=>v);if(!layer.length)throw new Error('Missing real rock cross section');const lo=[0,2].map(k=>Math.min(...layer.map(v=>v[k]))*.2),hi=[0,2].map(k=>(Math.max(...layer.map(v=>v[k]))+1)*.2);return{y:.2+t*H*sy,rx:(hi[0]-lo[0])/2*sx*(split?.47:1),rz:(hi[1]-lo[1])/2*sx,x:((hi[0]+lo[0])/2+parent.origin[0])*sx,z:((hi[1]+lo[1])/2+parent.origin[2])*sx};});
 const pieces=split?[-1,1]:[0];for(const side of pieces){const rings=profile.map(r=>({...r,x:r.x+side*1.15*small,y:.2+(r.y-.2)*(side===1?.86:1)}));const mesh=emptyMesh('原岩断裂面派生'+side,c.role('weatheredRock')),height=rings.at(-1)!.y-.2,points=rings.map((r,ri)=>Array.from({length:10},(_,j)=>{const angle=j*Math.PI/5,radial=1+.08*Math.sin(j*2.17+ri*.81)+.04*Math.cos(j*1.31-ri*.43),tilt=ri===0?0:height*(ri===rings.length-1?.045:.018)*Math.sin(j*1.7+ri*.9);return[r.x+Math.sin(angle)*r.rx*radial,r.y+tilt,r.z-Math.cos(angle)*r.rz*radial]as V3;}));
  for(let ri=1;ri<rings.length;ri++)for(let j=0;j<10;j++){const k=(j+1)%10,face=[points[ri-1][j],points[ri-1][k],points[ri][k],points[ri][j]],cx=(rings[ri-1].x+rings[ri].x)/2,cz=(rings[ri-1].z+rings[ri].z)/2;quad(mesh,face,[face.reduce((n,p)=>n+p[0]/4,0)-cx,0,face.reduce((n,p)=>n+p[2]/4,0)-cz]);}
  for(const ri of[0,rings.length-1]){const r=rings[ri],center:[number,number,number]=[r.x,points[ri].reduce((n,p)=>n+p[1]/10,0),r.z];for(let j=0;j<10;j++)triangle(mesh,center,points[ri][j],points[ri][(j+1)%10],[0,ri===0?-1:1,0]);}
  for(let k=0;k<mesh.positions.length;k+=3){const normal=mesh.normals.slice(k,k+3),axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));mesh.uvs[k/3*2]=mesh.positions[k+(axis===0?2:0)];mesh.uvs[k/3*2+1]=mesh.positions[k+(axis===1?2:1)];}c.mesh(mesh);const base=rings[0];for(const dx of[-.2,0])c.rock(Math.round((base.x+dx)/.2)*.2,0,Math.round(base.z/.2)*.2);}
 return{sourceSections:profile,form:p.rockForm,size:p.rockSize,sourceHeightM:H,sourceCellPitchM:.2,wetness:p.rockWetness,fractureProfile:'deterministic irregular10-sided sections and non-planar fractured cap',sectionMethod:'Measured occupied rock bounds at six real source heights; authored continuous faceted envelope. Original monolith and shoulder plants retained separately.'};
}
function waterfall(c:LandscapeComponent,p:Params){
 const flow=p.waterfallFlow==='low'?.5:1,split=p.waterfallForm==='split',width=(p.waterfallForm==='narrow'?12:24)*flow,lanes=split?[[-width/2,-width*.08],[width*.08,width/2]]:[[-width/2,width/2]],drop=153;
 for(const[j,[left,right]]of lanes.entries()){const m=emptyMesh('连续水帘'+j,c.role('fallWater')),N=51,at=(x:number,y:number,back=false):V3=>[12+x,y,1.2+.08*Math.sin(y*.16+j)+(back?.12:0)],face=(v:V3[],normal:V3)=>quad(m,v,normal);
  for(let i=0;i<N;i++){const y0=drop*i/N,y1=drop*(i+1)/N,a=at(left,y0),b=at(right,y0),d=at(right,y1),e=at(left,y1),A=at(left,y0,true),B=at(right,y0,true),D=at(right,y1,true),E=at(left,y1,true);face([a,b,d,e],[0,0,-1]);face([A,B,D,E],[0,0,1]);face([a,e,E,A],[-1,0,0]);face([b,d,D,B],[1,0,0]);if(i===0)face([a,b,B,A],[0,-1,0]);if(i===N-1)face([e,d,D,E],[0,1,0]);}
  c.mesh(m);for(let k=0;k<m.positions.length;k+=3){m.uvs[k/3*2]=m.positions[k]-12;m.uvs[k/3*2+1]=drop-m.positions[k+1];}
  c.rock(12+(left+right)/2,drop-.2,1.2,'flowWater');c.rock(12+(left+right)/2,0,1.2,'waterFoam');
 }
 c.ports=lanes.flatMap(([l,r],j)=>[{id:'inlet-'+j,kind:'water-route',position:[12+(l+r)/2,153,1.2]as V3,normal:[0,1,0]as V3,size:[r-l,0,.12]as V3,pitch:.2},{id:'impact-'+j,kind:'water-impact',position:[12+(l+r)/2,0,1.2]as V3,normal:[0,-1,0]as V3,size:[r-l,0,.12]as V3,pitch:.2}]);
 return{dropM:drop,widthM:width,lanes,sourceRoute:[[12,153,1.2],[12,0,1.2]],worldTopReceived:false,worldBottomReceived:false,flowAnimated:false,waterFlow:{routes:lanes.map(([l,r])=>({points:[[12+(l+r)/2,153,1.2],[12+(l+r)/2,0,1.2]],startDistanceM:0})),materialIds:[c.role('fallWater'),c.role('flowWater'),c.role('waterFoam')],animated:false,originalRouteBound:false}};
}
function youngTree(c:LandscapeComponent,parent:Asset,p:Params){
 const young=p.treeStage==='young',xz=young?.68:.42,yScale=young?.74:.53,rScale=young?.58:.36,an=parent.source!.anatomy as any,segments=an.segments.map((s:any)=>({from:s.from.map((n:number,i:number)=>n*(i===1?yScale:xz))as V3,to:s.to.map((n:number,i:number)=>n*(i===1?yScale:xz))as V3,radii:s.radii.map((r:number)=>Math.max(.055,r*rScale))}));
 segments.forEach((s:any,i:number)=>{for(const key of['from','to'])if(s[key][1]===0)s[key][1]=Math.hypot(s[key][0],s[key][2])>.1?.12:.08;branch(c,'原分枝派生'+i,s.from,s.to,s.radii[0],s.radii[1]);});
 const crowns=an.crowns.map((r:any)=>({center:r.center.map((n:number,i:number)=>n*(i===1?yScale:xz))as V3,radii:r.radii.map((n:number,i:number)=>n*(young?(i===1?.76:.62):(i===1?.52:.38)))as V3,seed:r.seed}));
 crowns.forEach((r:any,j:number)=>{const rings=[-.97,-.72,-.25,.25,.72,.97].map(t=>({y:r.center[1]+t*r.radii[1],x:r.center[0],z:r.center[2],rx:r.radii[0]*Math.sqrt(1-t*t),rz:r.radii[2]*Math.sqrt(1-t*t)}));c.mesh(roundLoft('原枝端连续叶簇'+j,c.role('canopyLeaf'),rings,10));const top=r.center.map((v:number,i:number)=>v+(i===1?r.radii[1]*.65:0))as V3;c.rock(...top,'canopyLeafTip');});
 c.rock(0,0,0,'treeBark');return{stage:p.treeStage,originalSegments:an.segments.length,segments,crowns,axisFactors:[xz,yScale,xz],branchRadiusFactor:rScale,uniformAdultScale:false,growthSimulationBound:false};
}
function vegetation(parent:Asset,p:Project,state:string){
 const a=structuredClone(parent),g=new Grid(a.chunks),s=p.styles.yunshan,crowns=(parent.source!.anatomy as any).crowns,keep=state==='healthy'?[0,1,2,3,4]:state==='damaged'?[0,3]:[0,1,2,3],removed:any[]=[];
 if(state!=='healthy')for(const[v,m]of g.cells()){if(m===s.shrubTwig)continue;const point=v.map(n=>(n+.5)*.2),dist=crowns.map((c:any)=>point.reduce((sum,n,i)=>sum+((n-c.center[i])/c.radii[i])**2,0)),closest=dist.indexOf(Math.min(...dist));if(!keep.includes(closest)){removed.push([v,m]);g.set(v,0);}}
 const centerline=new Grid(),source=new Grid(parent.chunks);for(const segment of(parent.source!.anatomy as any).segments)connectedLine(centerline,.2,segment.from,segment.to,s.shrubTwig);if(state!=='healthy')for(const[v]of centerline.cells())if(source.get(v))g.set(v,source.get(v));
 // Retain only foliage connected to the unchanged original woody skeleton.
 const reached=new Set<string>(),queue:V3[]=[];for(const[v,m]of g.cells())if(m===s.shrubTwig){reached.add(v.join(','));queue.push(v);}for(let j=0;j<queue.length;j++)for(const d of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const v=queue[j].map((n,i)=>n+d[i])as V3,key=v.join(',');if(g.get(v)&&!reached.has(key)){reached.add(key);queue.push(v);}}if(state!=='healthy')for(const[v,m]of g.cells())if(!reached.has(v.join(','))){removed.push([v,m]);g.set(v,0);}
 a.chunks=g.serialize();return{asset:a,details:{state,retainedCrownRegions:keep,removedCells:removed.filter(([v])=>!g.get(v)),protectedSourceCenterlineCells:centerline.count,unchangedWoodySkeleton:true,actualNeighborConnectivity:true,ecologyControllerBound:false}};
}
function wall(parent:Asset,p:Project,params:Params){
 const a=structuredClone(parent),g=new Grid(),source=new Grid(parent.chunks),form=params.wallForm,placements:{position:V3;rotation:number}[]=[{position:[0,0,0],rotation:0}];
 if(form==='concave')placements.push({position:[7.8,0,0],rotation:3});if(form==='convex')placements.push({position:[0,0,2.6],rotation:1});if(form==='stepped')placements.push({position:[8,0,0],rotation:0});
 for(const[j,t]of placements.entries())for(const[v,m]of source.cells()){if(form==='end'&&v[0]>=20)continue;if(form==='stepped'&&j===1&&v[1]>=Math.round((Number(params.wallHeight)-.6)/.2))continue;const center=rotateY(v.map(n=>(n+.5)*.2)as V3,t.rotation),dest=center.map((n,i)=>Math.round((n+t.position[i])/.2-.5))as V3;g.set(dest,m===p.styles.yunshan.wall?p.styles.yunshan.stone:m);}
 if(form==='stepped'){const h=Number(params.wallHeight)-.6,y=Math.round(h/.2)-1,front=Math.round((.6+.25*(h-.2))/.2)-1;for(let x=40;x<80;x++)for(let z=front;z<13;z++)g.set([x,y,z],p.styles.yunshan.stone);}
 // Preserve only actual open drains after union; locations may be occluded by a return wing.
 const sockets=(parent.source!.detail as any).weepSockets,openings:any[]=[];for(const t of placements)for(const socket of sockets){const min=rotateY(socket.min,t.rotation).map((n,i)=>n+t.position[i]),max=rotateY(socket.max,t.rotation).map((n,i)=>n+t.position[i]),lo=min.map((n,i)=>Math.round(Math.min(n,max[i])/.2)),hi=min.map((n,i)=>Math.round(Math.max(n,max[i])/.2));let empty=true;for(let x=lo[0];x<hi[0];x++)for(let y=lo[1];y<hi[1];y++)for(let z=lo[2];z<hi[2];z++)if(g.get([x,y,z]))empty=false;if(empty)openings.push({min:lo,max:hi});}
 a.chunks=g.serialize();a.openings=openings;a.parts=[];a.ports=[{id:'base',kind:'terrain-wall',position:[0,0,0],normal:[0,-1,0],size:[8,0,2.8],pitch:.2}];return{asset:a,details:{form,wallHeightM:params.wallHeight,placements,actualUnion:true,openDrainCount:openings.length,sourceSockets:sockets,sourceGridPitchM:.2,originalWorldBound:false}};
}
export function makeEnvironmentVariant(p:Project,catalogId:string,id:string,name:string,input:Params={}){
 const spec=finalVariantSpec(catalogId,input);if(spec.family==='furniture')throw new Error('Not environment');const b=new ArchitectureBuilder(p,id),params=spec.parameters,parentParams:Params=catalogId==='ENV-051'?{height:Number(params.treeHeight)}:catalogId==='ENV-075'?{habit:'spreading'}:catalogId==='ENV-083'?{height:Number(params.wallHeight)}:{},original=b.original(spec.parentCatalogId,parentParams),parent=p.assets[original],parents=[{catalogId:spec.parentCatalogId,parameters:parentParams,assetId:original,geometrySHA256:hash(geometryData(parent))}];
 const colors=['#538459','#75934e','#3f7654','#89985d','#668844','#9a8750','#b19655','#586d44','#74956d'];const changes:Record<string,Partial<Material>>=catalogId==='ENV-007'?{bedrock:{color:'#5b6662'},weatheredRock:{color:'#8a9387'}}:catalogId==='ENV-018'&&params.rockWetness==='dry'?{bedrock:{color:'#5b6662'},weatheredRock:{color:'#8b8f82'}}:catalogId==='ENV-051'?{canopyLeaf:{color:colors[Number(params.treeTone)]},canopyLeafTip:{color:colors[Number(params.treeTone)],roughness:.78}}:catalogId==='ENV-018'&&params.rockWetness==='wet'?{weatheredRock:{color:'#3e4945',roughness:.29},bedrock:{color:'#343d3a',roughness:.36}}:catalogId==='ENV-075'&&params.vegetationState==='damaged'?{shrubLeaf:{color:'#8a8158'}}:{};
 const style=variantAppearance(p,catalogId.toLowerCase()+'-'+hash(changes).slice(0,12),changes),key='environment-'+hash([spec,p.styles[style]]).slice(0,24);let details:any;
 const asset=b.asset(key,aid=>{let a:Asset;if(catalogId==='ENV-051'){a=structuredClone(parent);details={sourceHeightM:params.treeHeight,treeTone:params.treeTone,distinctSpecies:false,originalSeedPaletteReceived:false};}
  else if(catalogId==='ENV-075'){const r=vegetation(parent,p,String(params.vegetationState));a=r.asset;details=r.details;}
  else if(catalogId==='ENV-083'){const r=wall(parent,p,params);a=r.asset;details=r.details;}
  else{const c=new LandscapeComponent(p,aid,name,[spec.parentCatalogId],params);details=catalogId==='ENV-007'?cliff(c,params):catalogId==='ENV-018'?rock(c,parent,params):catalogId==='ENV-033'?waterfall(c,params):youngTree(c,parent,params);a=c.finish();if(catalogId==='ENV-058')a.source!.minimumComponent='0.2m native bark/leaf cells';}
  a.id=aid;a.name=name;const material=remapVariant(a,p,style);a.source={...a.source,kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[spec.parentCatalogId],sourceAssetId:original,sourceGeometrySHA256:hash(geometryData(parent)),...(details.waterFlow?{waterFlow:details.waterFlow}:{}),environmentVariant:{...details,material}};delete a.source.catalogId;return a;});
 b.place(asset,[0,0,0],0,'environment');return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:'base',parameters:params,notCatalogBase:true,finalVariant:{family:'environment',parents,asset,style,details:p.assets[asset].source!.environmentVariant,finiteAuthorForms:true,originalControllerBound:false,scope:'Explicit finite geometry/material variants of retained real parents; continuous surfaces and native minimum details have separate true authorities. No original world, growth, fluid or ecology binding and no human-art acceptance.'}});
}
