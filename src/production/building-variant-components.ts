import {ShapeUtils,Vector2} from 'three';
import type {Project,V3} from '../core/types';
import {Grid} from '../core/grid';
import {ArchitectureComponent,architectureFloor} from './architecture-components';
import {emptyMesh,quad,triangle} from './mesh-shapes';
import type {Cell} from './architecture-plans';

export function variantFloor(p:Project,id:string,w:number,d:number){
 const a=architectureFloor(p,id,w,d),from=p.styles.yunshan.wall,to=p.styles.yunshan.stone;
 for(const m of a.meshes??[])if(m.material===from)m.material=to;
 for(const r of a.source!.componentIndexRanges as {material:number}[])if(r.material===from)r.material=to;
 a.source!.surfacePurpose='Basalt paving uses stone; wall render remains wall. Concrete bearing, mortar, native pins and metre geometry are unchanged; original parent components retained separately.';
 return a;
}

export function variantWall(p:Project,id:string,w:number,h:number,door=false){
 const b=new ArchitectureComponent(p,id,door?'参数墙 · 通行门洞':'参数墙 · 独立窗玻璃',['BUILT-017','BUILT-015'],{w,h,door});
 const count=Math.max(1,Math.floor(w/2.4)),bay=w/count,top=Math.min(2.6,h-.24),bottom=door?0:.9;
 for(let i=0;i<count;i++){
  const x=i*bay,side=.22,opening=bay-2*side,isDoor=door&&i===Math.floor(count/2),low=isDoor?0:bottom||.9;
  for(const xx of[x,x+bay-side])b.box('连续墙垛','wall',xx,0,0,side,h-.16,.24);
  if(low)b.box('窗下实体','wall',x+side,0,0,opening,low,.24);
  b.box('门窗过梁墙','wall',x+side,top,0,opening,h-.16-top,.24);
  for(const xx of[x+side,x+bay-side-.06])b.box('木门窗梃','wood',xx,low,-.03,.06,top-low,.30);
  b.box('木门窗横枋','woodEdge',x+side,top-.06,-.03,opening,.06,.30);
  if(!isDoor){b.box('独立窗玻璃','glass',x+side+.06,low+.04,.11,opening-.12,top-low-.10,.02);b.box('窗中梃','wood',x+bay/2-.03,low+.04,.07,.06,top-low-.10,.1);b.box('石窗台','stone',x+side-.03,low-.06,-.06,opening+.06,.06,.36);}
  b.box('竖向木壁柱','wood',x+.03,0,-.08,.14,h-.16,.08);
  for(const y of[.16,h-.36]){b.box('独立金属箍','metal',x+.01,y,-.10,.18,.10,.12);b.pin('最小铜销','bronze',[x+.08,y+.04,-.12]);}
 }
 b.box('连续顶部木梁','wood',0,h-.16,-.06,w,.16,.36);return b.finish();
}

export function stairDimensions(h:number){const steps=Math.round(h/.2);if(Math.abs(steps*.2-h)>1e-8)throw new Error('楼层高度不是0.2米阶高的整数倍');const first=Math.ceil(steps/2),second=steps-first,run=first*.28;return{steps,first,second,run,width:3.4,depth:run+2.4};}
/** A closed extruded stair profile, with real treads and a continuous sloped underside. */
function profile(b:ArchitectureComponent,name:string,role:string,x:number,width:number,points:[number,number][]){
 let contour=points.map(([z,y])=>new Vector2(z,y));if(ShapeUtils.isClockWise(contour))contour=contour.reverse();
 const m=emptyMesh(name,b.role(role)),at=(q:Vector2,side:number):V3=>[x+side*width,q.y,q.x];
 for(const t of ShapeUtils.triangulateShape(contour,[]))for(const side of[0,1])triangle(m,at(contour[t[0]],side),at(contour[t[1]],side),at(contour[t[2]],side),[side?1:-1,0,0]);
 for(let i=0;i<contour.length;i++){const a=contour[i],c=contour[(i+1)%contour.length];quad(m,[at(a,0),at(a,1),at(c,1),at(c,0)],[0,-(c.x-a.x),c.y-a.y]);}b.mesh(m);
}
export function variantStairs(p:Project,id:string,h:number){
 const d=stairDimensions(h),b=new ArchitectureComponent(p,id,'参数回行楼梯 · 连续底板与真实踏步',['BUILT-007','BUILT-008','BUILT-009','BUILT-014'],{h,...d}),paths:V3[][]=[];
 for(const [x,count,base,reverse]of[[.1,d.first,0,false],[2.1,d.second,d.first*.2,true]]as const){
  const z=(v:number)=>1.2+(reverse?d.run-v:v),step=d.run/count;
  // Adjacent closed sections share the same inclined underside plane. Splitting at each riser
  // avoids numerical zero-area ears in a single long, periodically collinear stair polygon.
  for(let n=0;n<count;n++)profile(b,'连续斜底梯段-'+n,'structuralConcrete',x,1.2,[[z(n*step),base+n*.2-.18],[z((n+1)*step),base+(n+1)*.2-.18],[z((n+1)*step),base+(n+1)*.2-.02],[z(n*step),base+(n+1)*.2-.02]]);
  const route:V3[]=[];for(let n=0;n<count;n++){b.box('石材真实踏面','stone',x,base+(n+1)*.2-.02,Math.min(z(n*step),z((n+1)*step)),1.2,.02,step);route.push([x+.6,base+(n+1)*.2,z((n+.5)*step)]);}
  paths.push(route);
  for(const railX of[x-.06,x+1.2]){
   profile(b,'连续倾斜木扶手','woodEdge',railX,.06,[[z(0),base+1],[z(d.run),base+count*.2+1],[z(d.run),base+count*.2+1.08],[z(0),base+1.08]]);
   for(const n of[0,count-1]){const zz=z((n+.5)*step),foot=base+(n+1)*.2,rail=base+(n+.5)*.2+1;b.box('扶手立柱','wood',railX,foot-.02,zz-.04,.06,rail-foot+.02,.08);b.pin('立柱最小销','bronze',[railX+.02,foot+.06,zz-.04]);}
  }
 }
 const mid=d.first*.2;b.box('回行平台承板','structuralConcrete',0,mid-.2,1.2+d.run,d.width,.18,1.2);b.box('回行平台铺面','stone',0,mid-.02,1.2+d.run,d.width,.02,1.2);
 for(const x of[.04,d.width-.12])for(const z of[1.2+d.run+.1,d.depth-.18]){b.box('逐层连续平台承柱','metal',x,0,z,.08,h,.08);b.box('平台栏柱','wood',x,mid,z,.08,1,.08);b.pin('平台栏柱销','bronze',[x+.02,mid+.06,z-.02]);}
 b.box('平台后缘扶手','woodEdge',.04,mid+.94,d.depth-.14,d.width-.08,.06,.08);
 const a=b.finish();a.source!.stairPaths=paths;a.source!.turnPath=[[.7,mid,1.2+d.run+.6],[2.7,mid,1.2+d.run+.6]];return a;
}

export function variantCoreFloor(p:Project,id:string,w:number,depth:number,h:number){
 const d=stairDimensions(h),b=new ArchitectureComponent(p,id,'保留真实梯井的楼板',['BUILT-003'],{w,depth,h,hole:{x:.3,z:1.5,width:d.width,depth:d.depth-1.2}});
 // Four disjoint rectangles surround the actual flight and mid-landing opening.
 const rectangles=[[0,0,w,1.5],[0,1.5,.3,d.depth-1.2],[.3+d.width,1.5,w-.3-d.width,d.depth-1.2],[0,.3+d.depth,w,depth-.3-d.depth]];
 for(const[x,z,ww,dd]of rectangles){if(ww<=0||dd<=0)throw new Error('梯井放不进实际楼板');if(Math.min(ww,dd)<.18){b.box('窄边承板','structuralConcrete',x,0,z,ww,.16,dd);b.box('窄边砂浆','mortar',x,.16,z,ww,.02,dd);b.box('窄边铺面','stone',x,.18,z,ww,.02,dd);continue;}const a=variantFloor(p,id,ww,dd);for(const m of a.meshes??[]){const copy=structuredClone(m);for(let k=0;k<copy.positions.length;k+=3){copy.positions[k]+=x;copy.positions[k+2]+=z;}b.mesh(copy);}for(const[cell,mat]of new Grid(a.chunks).cells())b.grid.set([cell[0]+Math.round(x/.02),cell[1],cell[2]+Math.round(z/.02)],mat);}
 const back=.3+d.depth;
 for(const x of[.14,.3+d.width+.10]){for(const z of[1.48,back+.06]){b.box('梯井护栏柱','wood',x,.2,z,.08,1,.08);b.pin('梯井护栏销','bronze',[x+.02,.26,z-.02]);}for(const y of[.62,1.12])b.box('梯井侧护栏','woodEdge',x,y,1.48,.08,.08,back-1.4);}
 for(const y of[.62,1.12])b.box('梯井后护栏','woodEdge',.14,y,back+.06,d.width+.34,.08,.08);
 // Keep both flight exits open; only the centre gap gets a front guard.
 for(const x of[1.64,2.24])b.box('梯井前中护栏柱','wood',x,.2,1.36,.08,1,.08);
 for(const y of[.62,1.12])b.box('梯井前中护栏','woodEdge',1.64,y,1.36,.68,.08,.08);
 return b.finish();
}

/** One closed U-shaped roof per layer. Shared valleys are real shared edges, not intersecting roofs. */
export function variantFarmRoof(p:Project,id:string,w:number,d:number){
 const W=w*6,D=d*4,e=.4,b=new ArchitectureComponent(p,id,'农舍连续U形坡屋面',['BUILT-011','BUILT-012','BUILT-013'],{form:'continuous-u-roof',w:W,d:D,overhang:e});
 const polygon=[[-e,-e],[2*w+e,-e],[2*w+e,2*d-e],[4*w-e,2*d-e],[4*w-e,-e],[W+e,-e],[W+e,D+e],[-e,D+e]];
 const xs=[-e,0,w,2*w,2*w+e,3*w,4*w-e,4*w,5*w,W,W+e],zs=[-e,0,d,2*d-e,2*d,3*d,D,D+e];
 const exists=(i:number,j:number)=>i>=0&&j>=0&&i<xs.length-1&&j<zs.length-1&&!((xs[i]+xs[i+1])/2>2*w+e&&(xs[i]+xs[i+1])/2<4*w-e&&(zs[j]+zs[j+1])/2<2*d-e);
 const height=(x:number,z:number)=>{const distance=Math.min(...polygon.map((a,k)=>{const c=polygon[(k+1)%polygon.length],dx=c[0]-a[0],dz=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}));return .04+1.6*Math.min(1,distance/(w+e));};
 for(const [role,offset,thickness]of[['roof',0,.07],['waterproofMembrane',-.07,.015],['wood',-.085,.08]]as const){
  const mesh=emptyMesh('连续U形屋面-'+role,b.role(role)),point=(i:number,j:number,low=false):V3=>[xs[i],height(xs[i],zs[j])+offset-(low?thickness:0),zs[j]];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++)if(exists(i,j)){
   quad(mesh,[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],[0,1,0]);quad(mesh,[point(i,j,true),point(i+1,j,true),point(i+1,j+1,true),point(i,j+1,true)],[0,-1,0]);
   if(!exists(i,j-1))quad(mesh,[point(i,j),point(i+1,j),point(i+1,j,true),point(i,j,true)],[0,0,-1]);
   if(!exists(i,j+1))quad(mesh,[point(i,j+1),point(i+1,j+1),point(i+1,j+1,true),point(i,j+1,true)],[0,0,1]);
   if(!exists(i-1,j))quad(mesh,[point(i,j),point(i,j+1),point(i,j+1,true),point(i,j,true)],[-1,0,0]);
   if(!exists(i+1,j))quad(mesh,[point(i+1,j),point(i+1,j+1),point(i+1,j+1,true),point(i+1,j,true)],[1,0,0]);
  }b.mesh(mesh);
 }
 const bearing=[[0,0],[2*w,0],[2*w,2*d],[4*w,2*d],[4*w,0],[W,0],[W,D],[0,D]];
 for(let k=0;k<bearing.length;k++){const a=bearing[k],c=bearing[(k+1)%bearing.length];b.box('U形檐下承梁','woodEdge',Math.min(a[0],c[0])-.12,-.14,Math.min(a[1],c[1])-.12,Math.abs(c[0]-a[0])+.24,.22,Math.abs(c[1]-a[1])+.24);}
 for(const[x,z]of[[.1,.1],[W-.1,.1],[.1,D-.1],[W-.1,D-.1]])b.pin('屋面最小定位销','bronze',[x,height(x,z)-.125,z]);
 return b.finish();
}

/** Union of the actual medical wings, with shared slab edges and no intersecting rectangular roofs. */
export function variantMedicalRoof(p:Project,id:string,w:number,d:number,cells:Cell[]){
 const e=.4,W=(Math.max(...cells.map(c=>c[0]))+1)*w,D=(Math.max(...cells.map(c=>c[1]))+1)*d;
 const b=new ArchitectureComponent(p,id,'医馆连续H形平屋面',['BUILT-011','BUILT-012','BUILT-013'],{form:'continuous-medical-h-roof',w:W,d:D,overhang:e,occupiedCells:cells});
 const rectangles=cells.map(([x,z])=>[x*w-e,z*d-e,(x+1)*w+e,(z+1)*d+e]);
 const ordered=(a:number[])=>[...new Set(a)].sort((x,y)=>x-y),xs=ordered(rectangles.flatMap(r=>[r[0],r[2]])),zs=ordered(rectangles.flatMap(r=>[r[1],r[3]]));
 const exists=(i:number,j:number)=>i>=0&&j>=0&&i<xs.length-1&&j<zs.length-1&&rectangles.some(r=>(xs[i]+xs[i+1])/2>r[0]&&(xs[i]+xs[i+1])/2<r[2]&&(zs[j]+zs[j+1])/2>r[1]&&(zs[j]+zs[j+1])/2<r[3]);
 for(const [role,top,thickness]of[['roof',.18,.07],['waterproofMembrane',.11,.015],['wood',.095,.08]]as const){
  const m=emptyMesh('连续H形屋面-'+role,b.role(role)),point=(i:number,j:number,low=false):V3=>[xs[i],top-(low?thickness:0),zs[j]];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++)if(exists(i,j)){
   quad(m,[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],[0,1,0]);quad(m,[point(i,j,true),point(i+1,j,true),point(i+1,j+1,true),point(i,j+1,true)],[0,-1,0]);
   if(!exists(i,j-1))quad(m,[point(i,j),point(i+1,j),point(i+1,j,true),point(i,j,true)],[0,0,-1]);
   if(!exists(i,j+1))quad(m,[point(i,j+1),point(i+1,j+1),point(i+1,j+1,true),point(i,j+1,true)],[0,0,1]);
   if(!exists(i-1,j))quad(m,[point(i,j),point(i,j+1),point(i,j+1,true),point(i,j,true)],[-1,0,0]);
   if(!exists(i+1,j))quad(m,[point(i+1,j),point(i+1,j+1),point(i+1,j+1,true),point(i+1,j,true)],[1,0,0]);
  }b.mesh(m);
 }
 const occupied=new Set(cells.map(c=>c.join(','))),probes:V3[]=[],bearings:{from:[number,number];to:[number,number]}[]=[];
 for(const[x,z]of cells)for(const[dx,dz,ax,az,cx,cz]of[[0,-1,x*w,z*d,(x+1)*w,z*d],[0,1,x*w,(z+1)*d,(x+1)*w,(z+1)*d],[-1,0,x*w,z*d,x*w,(z+1)*d],[1,0,(x+1)*w,z*d,(x+1)*w,(z+1)*d]]){
  if(occupied.has([x+dx,z+dz].join(',')))continue;
  b.box('H形檐下承梁','woodEdge',ax-.12,-.14,az-.12,cx-ax+.24,.22,cz-az+.24);
  bearings.push({from:[ax,az],to:[cx,cz]});
  probes.push([ax+(dx?.05:.1),-.15,az+(dx?.1:.05)],[cx+(dx?.05:-.1),-.15,cz+(dx?-.1:.05)]);
 }
 for(const[x,z]of cells)b.pin('屋面最小定位销','bronze',[(x+.5)*w,.18,(z+.5)*d]);
 b.parameters.bearingEdges=bearings;b.parameters.bearingProbePoints=probes;
 return b.finish();
}
