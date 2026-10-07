import {createHash} from 'node:crypto';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import type {Asset,Assembly,Instance,Project,V3} from '../core/types';
import {rotateY} from '../core/types';
import {makeCatalogAsset} from './catalog-assets';
import {ArchitectureComponent,architectureFloor,architectureWall,architectureColumn,architectureRail} from './architecture-components';
import {architectureRoof,type RoofForm} from './architecture-roofs';
import {architecturePlan,type Cell} from './architecture-plans';
import links from './atlas-links.json';
const round=(x:number)=>Math.round(x*1e8)/1e8||0;
const sourceCache=new Map<string,Asset>();
const digest=(a:Asset)=>createHash('sha256').update(JSON.stringify(geometryData(a))).digest('hex');
function seal(a:Asset){a.source!.assemblyGeometrySHA256=digest(a);return a;}
function unchanged(a:Asset){if(a.source?.assemblyGeometrySHA256!==digest(a))throw new Error('组合依赖已编辑，请另存组件或使用新的组件ID '+a.id);}
export class ArchitectureBuilder{
 instances:Instance[]=[];groups:Record<string,string>={};dependencies=new Set<string>();
 constructor(public p:Project,public id:string){}
 asset(key:string,make:(id:string)=>Asset){const id='architecture-'+key.replace(/[^a-zA-Z0-9_-]/g,'p');if(!this.p.assets[id])this.p.assets[id]=seal(make(id));const a=this.p.assets[id];unchanged(a);if(a.source?.kind!=='assembly-derived-component')throw new Error('组合组件ID已被其他资产占用 '+id);for(const dep of a.source!.baseCatalogIds as string[])this.dependencies.add(dep);return id;}
 original(catalogId:string,params:Record<string,number|string>={}){const suffix=Object.entries(params).map(([k,v])=>'-'+k+'-'+v).join(''),id='source-'+catalogId.toLowerCase()+suffix.replace(/[^a-zA-Z0-9_-]/g,'p');if(!this.p.assets[id]){const name=this.p.catalog?.entries[catalogId]?.source['中文名称']??catalogId,key=JSON.stringify([id,name,params,this.p.styles.yunshan,...(catalogId==='BUILT-004'?[Object.fromEntries(Object.values(this.p.styles.yunshan).map(id=>[id,this.p.materials[id]?.solid]))]:[])]);let canonical=sourceCache.get(key);if(!canonical){canonical=makeCatalogAsset(catalogId,name,id,this.p.styles.yunshan,params,this.p);sourceCache.set(key,canonical);if(sourceCache.size>24)sourceCache.delete(sourceCache.keys().next().value!);}this.p.assets[id]=seal(structuredClone(canonical));}else if(this.p.assets[id].source?.catalogId!==catalogId||JSON.stringify(this.p.assets[id].source?.parameters??{})!==JSON.stringify(params))throw new Error('原母版ID冲突 '+id);unchanged(this.p.assets[id]);this.dependencies.add(catalogId);return id;}
 place(assetId:string,position:V3,rotation=0,group='structure',name?:string){const id=this.id+'-'+this.instances.length;this.instances.push({id,assetId,name:name??this.p.assets[assetId].name,position:position.map(round) as V3,rotation,parent:null});this.groups[id]=group;return id;}
 floor(x:number,z:number,y=0,w=3.2,d=3.2){return this.place(this.asset('floor-'+w+'-'+d,id=>architectureFloor(this.p,id,w,d)),[x,y,z]);}
 wall(x:number,z:number,y:number,rotation:number,kind:'window'|'door'|'open'|'solid'='window'){return this.place(this.asset('wall-'+kind,id=>architectureWall(this.p,id,kind)),[x,y,z],rotation,'facade');}
 column(x:number,z:number,y=0,h=3.2){return this.place(this.asset('column-'+h,id=>architectureColumn(this.p,id,h)),[x,y,z]);}
 roof(form:RoofForm,x:number,y:number,z:number,w:number,d:number){
  if(form==='industrial'){
   const asset=this.asset('roof-glazed-gable-'+d+'-'+w,id=>architectureRoof(this.p,id,'gable',d,w,true));this.place(asset,[x,y,z+d],1,'roof');
   // A genuine glazed strip is a separate closed thin surface over the sun-facing roof slope.
   const light=this.asset('skylight-'+d+'-'+w,id=>{const b=new ArchitectureComponent(this.p,id,'工业屋面连续采光带',['BUILT-017','BUILT-011'],{d,w});const zs=[w*.18,w*.43],height=(z:number)=>.12+1.6*(1-Math.abs(z-w/2)/(w/2+.4))+.22*Math.pow(Math.abs(z-w/2)/(w/2+.4),5)+.018;b.surface('采光玻璃','glass',[.6,d-.6],zs,(_,z)=>height(z),.016);for(const z of zs)b.surface('采光压框','facadeFrame',[.56,d-.56],[z-.04,z+.04],(_,zz)=>height(zz)+.01,.03);for(let u=.6;u<d-.59;u+=1.6)b.surface('采光中梃','facadeFrame',[u-.035,u+.035],zs,(_,zz)=>height(zz)+.01,.03);return b.finish();});this.place(light,[x,y,z+d],1,'roof');return;
  }
  this.place(this.asset('roof-'+form+'-'+w+'-'+d,id=>architectureRoof(this.p,id,form,w,d)),[x,y,z],0,'roof');
 }
 stairs(x:number,z:number){
  const raw:[string,Record<string,number|string>,V3][]=[['BUILT-014',{},[0,0,0]],['BUILT-007',{width:1.6},[.4,0,1.2]],['BUILT-009',{},[.4,0,5.6]],['BUILT-008',{},[2.4,1.6,1.2]]];
  for(const[id,params,at]of raw){let assetId=this.original(id,params);if(id==='BUILT-014'){const sourceId=assetId;assetId='architecture-stair-shell-side-exit';if(!this.p.assets[assetId]){const original=this.p.assets[sourceId],derived=structuredClone(original),g=new Grid(derived.chunks),removed:{cell:V3;material:number}[]=[];for(let ix=15;ix<21;ix++)for(let iy=170;iy<176;iy++)for(let iz=4;iz<59;iz++){const cell:V3=[ix,iy,iz],material=g.get(cell);if(material){removed.push({cell,material});g.set(cell,0);}}derived.id=assetId;derived.name='服务翼侧出口派生 · 原母版另存';derived.chunks=g.serialize();derived.source={kind:'assembly-derived-stair-shell',notCatalogMaster:true,sourceAssetId:sourceId,sourceCatalogId:'BUILT-014',sourceGeometrySHA256:digest(original),removedCells:removed,reason:'Remove only the 0.12m left upper landing curb for an actual level side connection. Original master retained unchanged.'};this.p.assets[assetId]=seal(derived);}unchanged(this.p.assets[assetId]);}this.place(assetId,[at[0]+x,at[1],at[2]+z],0,'stair');}
  const support=this.asset('stair-support',id=>{const b=new ArchitectureComponent(this.p,id,'回行楼梯实际承柱',['BUILT-009'],{h:1.6,w:.2});b.box('石足','stone',0,0,0,.2,.1,.2);b.box('木柱','wood',0,.1,0,.2,1.4,.2);b.box('金属承帽','metal',0,1.5,0,.2,.1,.2);b.pin('锁销','bronze',[.08,1.52,-.02]);return b.finish();});for(const xx of[2.44,3.76])this.place(support,[x+xx,0,z+1.28],0,'stair');
  // Adjacent main floor plates meet the lower and upper landing; no duplicate slab or stairwell infill.
  this.roof('flat',x,6.34,z,4.4,7.6);
 }
 finish(catalogId:string,name:string,source:Record<string,unknown>):Assembly{return{id:this.id,name,version:1,instances:this.instances,source:{kind:'catalog-assembly',catalogId,recipeRevision:1,reference:(links as Record<string,unknown>)[catalogId],units:'metres',authority:'author',originalRuntimeBound:false,notCatalogBase:true,dependencies:[...this.dependencies].sort(),instanceGroups:this.groups,...source}};}
}

/** Actual separate plates, wall bays, beams, roof pieces and canonical stair masters. */
export function nearArchitecture(p:Project,catalogId:string,id:string,name:string,variant='default'):Assembly{
 const plan=architecturePlan(catalogId,variant),b=new ArchitectureBuilder(p,id),W=plan.nx*3.2,D=plan.nz*3.2;
 for(let x=0;x<plan.nx;x++)for(let z=0;z<plan.nz;z++)b.floor(x*3.2,z*3.2);
 const floors=(cells:Cell[],level:number)=>{
  const set=new Set(cells.map(c=>c.join(',')));if(level)for(const[x,z]of cells)b.floor(x*3.2,z*3.2,level*3.2);
  for(const[x,z]of cells){
   for(const[dx,dz,rotation,px,pz]of[[0,-1,0,x*3.2,z*3.2],[1,0,1,(x+1)*3.2,(z+1)*3.2],[0,1,2,(x+1)*3.2,(z+1)*3.2],[-1,0,3,x*3.2,z*3.2]]){
    if(set.has([x+dx,z+dz].join(',')))continue;
    if(dx===1&&x===plan.nx-1&&z===0)continue; // Real side connection to the shared service stair.
    const openHall=plan.tallHall&&level===0&&dz===-1;
    b.wall(px,pz,level*3.2+.2,rotation,openHall?'open':dz===-1?'door':'window');
   }
  }
 };
 floors(plan.lower,0);floors(plan.upper,1);
 // Tall workshop sides retain the second tier; a mezzanine does not fill its hall.
 if(plan.tallHall){for(let z=0;z<plan.nz-1;z++){b.wall(0,z*3.2,3.4,3);if(z>0)b.wall(W,(z+1)*3.2,3.4,1);}for(let x=0;x<plan.nx-1;x++)b.wall(x*3.2,0,3.4,0,'open');}
 // Columns under all upper plates and roof-bearing open canopies.
 const columns=new Set<string>();for(const[x,z]of plan.upper)for(const[dx,dz]of[[0,0],[1,0],[0,1],[1,1]])columns.add([(x+dx)*3.2,(z+dz)*3.2].join(','));
 for(const key of columns){const[x,z]=key.split(',').map(Number);if(x===W&&z<1.3)continue;b.column(x,z,.2);}
 for(const r of plan.roofs){b.roof(r.form,r.x,r.y,r.z,r.w,r.d);if(plan.openLower&&r.y<4)for(const x of[r.x+.2,r.x+r.w-.2])for(const z of[r.z+.2,r.z+r.d-.2])b.column(x,z,.2);}
 // Unroofed upper edges receive actual guards, leaving doors and the stair approach free.
 const upper=new Set(plan.upper.map(c=>c.join(','))),rail=b.asset('rail-3.2',id=>architectureRail(p,id));
 for(const[x,z]of plan.upper)if(!upper.has([x,z-1].join(','))&&!(x===5&&z===0))b.place(rail,[x*3.2,3.4,z*3.2-.18],0,'guard');
 b.stairs(W,0);
 const fixture=b.original(plan.fixture);
 for(const[i,point]of plan.purposePoints.entries())b.place(fixture,[point[0]-.6,point[1],point[2]+.65],0,'fixture',plan.family+' purpose '+(i+1));
 // Source uses two arcades; real column/beam canopies flank the market court.
 if(catalogId==='BUILT-020')for(const x of[.2,W-.2])for(const z of[3.4,6.6,9.4])b.column(x,z,.2);
 const entrance:V3=[1.6,.2,-.4],stairEntry:V3=[W+.9,.2,.6];
 return b.finish(catalogId,name,{variant:plan.variant,parameters:{program:plan.variant},floorPlan:plan,entrance,stairEntry,levelHeights:[.2,3.4],purposePoints:plan.purposePoints,stairOrigin:[W,0,0],courtOpenings:catalogId==='BUILT-019'?[{min:[6.82,.3,.42],max:[12.38,10,5.98]}]:catalogId==='BUILT-022'?[{min:[6.82,.3,3.62],max:[12.38,10,9.18]}]:[],scope:'Author floor layout and finite route geometry. Original Building/FloorPlan, permissions, route/controller and terrain not supplied. Three stair-flight/landing masters retain exact geometry. Original service shell retained; explicit side-exit derivative removes only its upper left curb. No source runtime integration or human art acceptance.'});
}

export function roofArchitecture(p:Project,catalogId:string,id:string,name:string,variant='default'){
 const b=new ArchitectureBuilder(p,id),w=variant==='wide'?19.2:catalogId==='BUILT-077'?14.4:12.8,d=6.4,form:RoofForm=catalogId==='BUILT-075'?'hip':catalogId==='BUILT-076'?'gable':catalogId==='BUILT-077'?'industrial':'market';
 // The four roof templates include a sparse, explicit support frame, not a new building master.
 for(let x=0;x<w-.01;x+=3.2)for(let z=0;z<d-.01;z+=3.2)b.floor(x,z,0,Math.min(3.2,w-x),3.2);
 const xs=[.3,w-.3];for(let x=3.5;x<w-1;x+=3.2)xs.push(x);
 for(const x of xs)for(const z of[.3,d-.3])b.column(x,z,.2,form==='market'&&(x<w*.22||x>w*.78)?2.4:3.2);
 if(form==='market'){
  const side=w*.22,main=w*.66,center=(w-main)/2;
  b.roof('gable',center,3.4,0,main,d);
  // Source proportions overlap by 0.05w each side; low canopies sit under the main eaves.
  for(const x of[0,w-side])b.roof('flat',x,2.6,0,side,d);
 }else if(form==='industrial'){const header=b.asset('industrial-header-'+w+'-'+d,id=>{const c=new ArchitectureComponent(p,id,'多跨屋面通长柱顶承梁',['BUILT-011','BUILT-059'],{w,d});for(const z of[.18,d-.42]){c.box('柱顶连续横枋','woodEdge',.1,0,z,w-.2,.14,.24);for(const x of[.3,w-.3])c.pin('横枋锁销','bronze',[x,.10,z-.02]);}return c.finish();});b.place(header,[0,3.26,0],0,'roof');const spans=variant==='wide'?4:3;for(let i=0;i<spans;i++)b.roof('industrial',i*w/spans,3.4,0,w/spans,d);}
 else b.roof(form,0,3.4,0,w,d);
 return b.finish(catalogId,name,{variant,parameters:{roofWidth:variant==='wide'?'wide':'standard'},roofForm:form,dimensionsM:[w,5.7,d],...(form==='market'?{sourceRatios:{main:.66,side:.22,overlapPerSide:.05}}:{}),...(form==='industrial'?{industrialSpans:variant==='wide'?4:3}:{}),scope:'Continuous roof alternative in an explicit author opt-in assembly. Original roofHeightAt/programRoof code unavailable; historical high-eave art FAIL not relabelled as passed. Support frame and repeated components do not create base catalogue masters.'});
}
