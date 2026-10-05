import type {V3} from '../core/types';
import {Grid} from '../core/grid';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {civicAsset} from './civic-landmarks';
import {CivicComponent} from './civic-components';
import {LandscapeComponent,terrainHeightAt,type HeightField} from './landscape-components';
import {emptyMesh,triangle} from './mesh-shapes';
import type {FleetSource} from './fleet-components';

const clean=(v:number)=>Math.round(v*1e9)/1e9||0;
type WaterVertex={x:number;z:number;bed:number;water:number};
/** Clip the actual bed triangles against the water field. Shared edges are stitched;
 * only the outer boundary has walls, including islands and open reach interfaces. */
export function floodedField(b:ArchitectureBuilder,key:string,bed:HeightField,water:HeightField,rect:[number,number,number,number],step=1,role='flowWater',axis:'x'|'z'='z',flowScale=1,flowOrigin?:number,startDistance=0){
 const [x0,z0,x1,z1]=rect,origin=flowOrigin??(axis==='x'?x0:z0),samples:{point:V3;bedY:number;depth:number}[]=[],shore:V3[]=[];
 const asset=civicAsset(b,'flooded-'+key,id=>{
  const c=new CivicComponent(b.p,id,'同源床面裁切的真实水域',['ENV-027','ENV-028','ENV-034','ENV-035'],{rect,step,role,axis,flowScale,flowOrigin:origin,startDistance,clipping:'actual triangulated bed below water only',noInternalCaps:true}),m=emptyMesh('闭合裁切水域',c.role(role)),uv:number[]=[],edges=new Map<string,{a:WaterVertex;d:WaterVertex;count:number}>();
  const vertex=(x:number,z:number):WaterVertex=>({x,z,bed:bed(x,z),water:water(x,z)}),keyOf=(v:WaterVertex)=>v.x+','+v.z;
  const cross=(a:WaterVertex,d:WaterVertex)=>{if(keyOf(a)>keyOf(d))[a,d]=[d,a];const av=a.water-a.bed,dv=d.water-d.bed,t=av/(av-dv),x=clean(a.x+t*(d.x-a.x)),z=clean(a.z+t*(d.z-a.z)),h=clean(a.water+t*(d.water-a.water));return{x,z,bed:h,water:h};};
  const add=(a:V3,d:V3,e:V3,n:V3,chart?:(p:V3)=>number[])=>{const start=m.positions.length;triangle(m,a,d,e,n);for(let k=start;k<m.positions.length;k+=3){const p=m.positions.slice(k,k+3)as V3;uv.push(...(chart?chart(p):axis==='z'?[(p[2]-origin)*flowScale+startDistance,p[0]-(x0+x1)/2]:[(p[0]-origin)*flowScale+startDistance,p[2]-(z0+z1)/2]));}};
  const emit=(tri:WaterVertex[])=>{
   const polygon:WaterVertex[]=[];for(let i=0;i<3;i++){const a=tri[i],d=tri[(i+1)%3],ai=a.bed<a.water,di=d.bed<d.water;if(ai)polygon.push(a);if(ai!==di)polygon.push(cross(a,d));}
   const ring=polygon.filter((v,j)=>!polygon.slice(0,j).some(a=>keyOf(v)===keyOf(a)));if(ring.length<3)return;
   const xyz=(v:WaterVertex,top:boolean):V3=>[v.x,top?v.water:v.bed,v.z];
   for(let j=1;j<ring.length-1;j++){add(xyz(ring[0],true),xyz(ring[j],true),xyz(ring[j+1],true),[0,1,0]);add(xyz(ring[0],false),xyz(ring[j],false),xyz(ring[j+1],false),[0,-1,0]);}
   for(let j=0;j<ring.length;j++){const a=ring[j],d=ring[(j+1)%ring.length],key=[keyOf(a),keyOf(d)].sort().join('|'),old=edges.get(key);if(old)old.count++;else edges.set(key,{a,d,count:1});}
   const center=ring.reduce((s,v)=>({x:s.x+v.x/ring.length,z:s.z+v.z/ring.length,bed:s.bed+v.bed/ring.length,water:s.water+v.water/ring.length}),{x:0,z:0,bed:0,water:0});samples.push({point:[center.x,center.water,center.z],bedY:center.bed,depth:center.water-center.bed});
  };
  for(let x=x0;x<x1-1e-6;x+=step)for(let z=z0;z<z1-1e-6;z+=step){const a=vertex(x,z),d=vertex(Math.min(x1,x+step),z),e=vertex(Math.min(x1,x+step),Math.min(z1,z+step)),f=vertex(x,Math.min(z1,z+step));emit([a,d,e]);emit([a,e,f]);}
  for(const{a,d,count}of edges.values()){if(count>2)throw new Error('Nonmanifold water edge');if(count!==1)continue;if(Math.abs(a.water-a.bed)<1e-8&&Math.abs(d.water-d.bed)<1e-8){shore.push([a.x,a.water,a.z]);continue;}const A:V3=[a.x,a.water,a.z],D:V3=[d.x,d.water,d.z],E:V3=[d.x,d.bed,d.z],F:V3=[a.x,a.bed,a.z],dx=d.x-a.x,dz=d.z-a.z,len=Math.hypot(dx,dz),n:V3=[dz,0,-dx],chart=(v:V3)=>{const t=((v[0]-a.x)*dx+(v[2]-a.z)*dz)/(len*len);return[t*len,a.water+(d.water-a.water)*t-v[1]];};if(d.water-d.bed>1e-8)add(A,D,E,n,chart);if(a.water-a.bed>1e-8)add(A,E,F,n,chart);}
  c.mesh(m);m.uvs=uv;const a=c.finish();a.source!.floodedGeometry={samples:samples.filter((_,j)=>j%Math.max(1,Math.ceil(samples.length/180))===0),shore};a.source!.waterFlow={routes:[{points:(axis==='x'?[[flowScale>0?x0:x1,(z0+z1)/2],[flowScale>0?x1:x0,(z0+z1)/2]]:[[(x0+x1)/2,z0],[(x0+x1)/2,z1]]).map(([x,z])=>[x,water(x,z),z]),startDistanceM:startDistance}],materialIds:[c.role(role)],animated:false,originalRouteBound:false};return a;
 });
 return{instance:b.place(asset,[0,0,0],0,'water'),assetId:asset,rect,step,role,...b.p.assets[asset].source!.floodedGeometry as {samples:typeof samples;shore:V3[]},waterPhysical:false};
}

/** Whole canonical plants keep their native grid. Root seats follow the actual
 * terrain triangles; only a small root domain receives a flat planting pocket. */
export function rootedPlant(b:ArchitectureBuilder,s:FleetSource,key:string,catalogId:string,params:Record<string,string|number>,x:number,z:number,height:HeightField,step=2,origin=-32){
 const asset=b.original(catalogId,params),a=b.p.assets[asset],cells=[...new Grid(a.chunks).cells()],minY=Math.min(...cells.map(([v])=>a.origin[1]+v[1]*a.cellSize)),roots=cells.filter(([v])=>Math.abs(a.origin[1]+v[1]*a.cellSize-minY)<1e-7),xs=roots.map(([v])=>a.origin[0]+v[0]*a.cellSize),zs=roots.map(([v])=>a.origin[2]+v[2]*a.cellSize),loX=Math.min(...xs)-.2,hiX=Math.max(...xs)+a.cellSize+.2,loZ=Math.min(...zs)-.2,hiZ=Math.max(...zs)+a.cellSize+.2;
 const at=(xx:number,zz:number)=>terrainHeightAt(height,xx,zz,step,origin,origin),grounds=[at(x+loX,z+loZ),at(x+hiX,z+loZ),at(x+hiX,z+hiZ),at(x+loX,z+hiZ),at(x,z)],low=Math.min(...grounds),y=clean(Math.ceil((Math.max(...grounds)+.06)/.2)*.2),soil=civicAsset(b,'root-pocket-'+key,id=>{const c=new LandscapeComponent(b.p,id,'贴地独立根域与表土',['ENV-001'],{plant:catalogId,rootDomain:[loX,loZ,hiX,hiZ],groundRange:[low,Math.max(...grounds)],soilY:y});c.box('植入岩床的小根域','bedrock',x+loX,low-.4,z+loZ,hiX-loX,y-low+.05,hiZ-loZ);c.box('连续种植表土','surfaceSoil',x+loX,y-.35,z+loZ,hiX-loX,.35,hiZ-loZ);c.rock(Math.ceil((x+loX)/.2)*.2,Math.floor((y-.4)/.2)*.2,Math.ceil((z+loZ)/.2)*.2);return c.finish();}),soilInstance=b.place(soil,[0,0,0],0,'root-soil'),position:V3=[x,clean(y-minY),z],instance=b.place(asset,position,0,'vegetation');
 for(const [i,[xx,zz]]of[[x+loX,z+loZ],[x+hiX,z+loZ],[x+hiX,z+hiZ],[x+loX,z+hiZ],[x,z]].entries())s.contacts.push({name:key+' root pocket terrain '+i,point:[xx,at(xx,zz)-.02,zz],exclude:soilInstance});
 const rootSamples=roots.filter((_,j)=>j%Math.max(1,Math.floor(roots.length/6))===0).map(([v])=>[clean(x+a.origin[0]+(v[0]+.5)*a.cellSize),y,clean(z+a.origin[2]+(v[2]+.5)*a.cellSize)]as V3);for(const point of rootSamples)s.contacts.push({name:key+' canonical root on actual soil',point:[point[0],point[1]-.02,point[2]],exclude:instance,role:'surfaceSoil'});
 return{catalogId,params,instance,soilInstance,position,rootSamples,rootCount:roots.length,rootDomain:[loX,loZ,hiX,hiZ],ground:at(x,z)};
}

/** A solid embankment, not a thin floating plate; its top is the route authority. */
export function groundRamp(b:ArchitectureBuilder,key:string,from:V3,to:V3,width:number,bottom:number){
 if(from[0]!==to[0]||from[2]>=to[2])throw new Error('Ground ramp requires increasing Z');
 return b.place(civicAsset(b,'ground-ramp-'+key,id=>{const c=new LandscapeComponent(b.p,id,'真实实体路基与连续坡面',['ENV-087','ENV-088'],{from,to,width,bottom});const h=(z:number)=>from[1]+(to[1]-from[1])*(z-from[2])/(to[2]-from[2]),top:V3[]=[[from[0]-width/2,from[1]-.08,from[2]],[from[0]+width/2,from[1]-.08,from[2]],[to[0]+width/2,to[1]-.08,to[2]],[to[0]-width/2,to[1]-.08,to[2]]],m=emptyMesh('连续实体填方',c.role('bedrock')),bot=top.map(v=>[v[0],bottom,v[2]]as V3);for(const [ring,n]of[[top,[0,1,0]],[bot,[0,-1,0]]]as [V3[],V3][]){triangle(m,ring[0],ring[1],ring[2],n);triangle(m,ring[0],ring[2],ring[3],n);}for(let j=0;j<4;j++){const k=(j+1)%4,dx=top[k][0]-top[j][0],dz=top[k][2]-top[j][2],n:V3=[dz,0,-dx];triangle(m,top[j],top[k],bot[k],n);triangle(m,top[j],bot[k],bot[j],n);}c.mesh(m);c.surface('连续石铺面','stone',[from[0]-width/2,from[0]+width/2],[from[2],to[2]],(_,z)=>h(z),.08);c.rock(from[0]-.2,bottom,from[2]);return c.finish();}),[0,0,0],0,'terrain-road');
}
