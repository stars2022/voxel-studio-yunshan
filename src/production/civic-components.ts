import type {Asset,Project,V3} from '../core/types';
import {ArchitectureComponent} from './architecture-components';
import {emptyMesh,quad,triangle} from './mesh-shapes';

export type Opening={min:[number,number];max:[number,number]};
const clean=(v:V3)=>v.map(n=>Math.round(n*1e9)/1e9||0) as V3;
/** New civic components retain separate closed construction pieces and metre-space authority. */
export class CivicComponent extends ArchitectureComponent{
 finish():Asset{const a=super.finish();for(const m of a.meshes??[])for(const key of["positions","normals","uvs"]as const)m[key]=m[key].map(v=>v||0);return a;}
 tube(name:string,role:string,points:V3[],radius:number,sides=12){
  const m=emptyMesh(name,this.role(role)),tangents=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],v=b.map((n,d)=>n-a[d]),l=Math.hypot(...v);return v.map(n=>n/l)as V3;}),rings=points.map((p,i)=>{const t=tangents[i],l=Math.hypot(t[0],t[2]),u=l>1e-8?[t[2]/l,0,-t[0]/l]:[1,0,0],v=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]];return Array.from({length:sides},(_,j)=>clean(p.map((n,d)=>n+radius*(Math.cos(j/sides*Math.PI*2)*u[d]+Math.sin(j/sides*Math.PI*2)*v[d]))as V3));});
  for(let i=1;i<rings.length;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides,center=points[i].map((n,d)=>(n+points[i-1][d])/2),face=[rings[i-1][j],rings[i-1][k],rings[i][k],rings[i][j]],normal=face.reduce((s,p)=>s.map((n,d)=>n+p[d]/4)as V3,[0,0,0]).map((n,d)=>n-center[d])as V3;quad(m,face,normal);}
  for(const i of[0,points.length-1])for(let j=0;j<sides;j++)triangle(m,points[i],rings[i][j],rings[i][(j+1)%sides],tangents[i].map(n=>n*(i===0?-1:1))as V3);this.mesh(m);
 }
 slab(name:string,role:string,top:V3[],thickness:number){
  const m=emptyMesh(name,this.role(role)),bottom=top.map(p=>clean([p[0],p[1]-thickness,p[2]])),center=top.reduce((s,p)=>s.map((v,d)=>v+p[d]/top.length)as V3,[0,0,0]);
  for(let i=1;i<top.length-1;i++){triangle(m,top[0],top[i],top[i+1],[0,1,0]);triangle(m,bottom[0],bottom[i],bottom[i+1],[0,-1,0]);}
  for(let i=0;i<top.length;i++){const j=(i+1)%top.length;quad(m,[top[i],top[j],bottom[j],bottom[i]],[(top[i][0]+top[j][0])/2-center[0],0,(top[i][2]+top[j][2])/2-center[2]]);}this.mesh(m);
 }
 beam(name:string,role:string,a:V3,b:V3,width:number,height=width){
  const axis=b.map((v,d)=>v-a[d]),length=Math.hypot(...axis);if(length<1e-8)throw new Error('Zero length civic beam');const t=axis.map(v=>v/length),plan=Math.hypot(t[0],t[2]),u=plan>1e-8?[t[2]/plan,0,-t[0]/plan]:[1,0,0],v=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]];
  const corners=[a,b].flatMap(p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([s,r])=>clean(p.map((n,d)=>n+s*u[d]*width/2+r*v[d]*height/2)as V3))),center=a.map((n,d)=>(n+b[d])/2),m=emptyMesh(name,this.role(role));
  for(const face of[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){const points=face.map(i=>corners[i]),normal=points.reduce((s,p)=>s.map((n,d)=>n+p[d]/4)as V3,[0,0,0]).map((n,d)=>n-center[d])as V3;quad(m,points,normal);}this.mesh(m);
 }
}
/** Top at local Y=0. Actual rectangular openings cut through all three layers. */
export function civicPlate(p:Project,id:string,w:number,d:number,holes:Opening[]=[],depth=.4,wood=false):Asset{
 const c=new CivicComponent(p,id,wood?'木铺面与承梁平台':'石铺面与混凝土承板',['BUILT-003','BUILT-001'],{w,d,holes,depth,topY:0});
 const xs=[...new Set([-w/2,w/2,...holes.flatMap(h=>[h.min[0],h.max[0]])])].sort((a,b)=>a-b),zs=[...new Set([-d/2,d/2,...holes.flatMap(h=>[h.min[1],h.max[1]])])].sort((a,b)=>a-b);
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2;if(holes.some(h=>x>h.min[0]&&x<h.max[0]&&z>h.min[1]&&z<h.max[1]))continue;const dx=xs[i+1]-xs[i],dz=zs[j+1]-zs[j];c.box('承板-'+i+'-'+j,wood?'wood':'structuralConcrete',xs[i],-depth,zs[j],dx,depth-.08,dz);c.box('结合层-'+i+'-'+j,wood?'woodEdge':'mortar',xs[i],-.08,zs[j],dx,.02,dz);c.box('实际铺面-'+i+'-'+j,wood?'wood':'stone',xs[i],-.06,zs[j],dx,.06,dz);}
 for(const x of[-w/2+.1,w/2-.12])for(const z of[-d/2+.1,d/2-.12])c.pin('板边铜定位销','bronze',[x,-.02,z]);c.ports=[{id:'top',kind:'civic-floor',position:[0,0,0],normal:[0,1,0],size:[w,0,d],pitch:.02}];return c.finish();
}
/** Centred on X, outer face at Z=0; a door is an actual centred opening. */
export function civicWall(p:Project,id:string,w:number,h:number,door=false,open=false):Asset{
 const c=new CivicComponent(p,id,open?'开放观景栏与承架':door?'中轴实开门墙':'分格窗洞与木石墙',['BUILT-017','BUILT-015','BUILT-091'],{w,h,door,open});
 const region=(left:number,right:number)=>{const n=Math.max(1,Math.ceil((right-left)/6)),bay=(right-left)/n;for(let i=0;i<n;i++){const x=left+i*bay,tower=h>=4.8&&!open,bottom=tower?2.35:.85,top=tower?h-1.75:h-.60,inset=tower?Math.min(1.1,bay*.24):.20;
  c.box('窗下实裙','wall',x,0,0,bay,open?1.1:bottom,.32);for(const px of[x,x+bay-.18])c.box('壁柱木梃','wood',px,0,-.08,.18,h,.48);
  if(!open){c.box('窗上墙芯','mortar',x,top,0,bay,h-top-.25,.26);c.box('窗上石皮','wall',x,top,-.02,bay,h-top-.25,.08);if(tower){for(const px of[x+.18,x+bay-inset])c.box('厚石窗垛','wall',px,bottom,-.015,inset-.18,top-bottom,.34);c.box('层间石腰线','stone',x,.95,-.12,bay,.22,.50);c.box('窗台木枋','woodEdge',x+inset-.1,bottom-.12,-.08,bay-inset*2+.2,.12,.45);}
   c.box('独立窗玻璃','glass',x+inset,bottom+.05,.12,bay-inset*2,top-bottom-.10,.018);for(let k=1;k<4;k++)c.box('窗间木格','wood',x+inset+(bay-inset*2)*k/4-.035,bottom+.05,.08,.07,top-bottom-.05,.11);for(const y of[bottom+.01,(bottom+top)/2,top-.06])c.box('水平窗枋','woodEdge',x+inset-.02,y,.06,bay-inset*2+.04,.08,.15);
  }
 }};
 if(door){region(-w/2,-1.8);region(1.8,w/2);c.box('中轴门过梁','woodEdge',-1.8,3.0,-.10,3.6,.25,.52);if(h>3.5)c.box('门上砌体','wall',-1.8,3.25,0,3.6,h-3.5,.32);c.ports.push({id:'door',kind:'civic-walk',position:[0,0,-.1],normal:[0,0,-1],size:[3.6,3,0],pitch:.02});}else region(-w/2,w/2);
 c.box('整面通长承枋','woodEdge',-w/2,h-.25,-.1,w,.25,.52);for(const x of[-w/2+.06,w/2-.08])c.pin('壁柱锁销','bronze',[x,h-.1,-.12]);return c.finish();
}
export function civicStair(p:Project,id:string,height:number):Asset{
 const n=Math.ceil(height/.4),step=height/(2*n),tread=.28,run=n*tread,landing=2.4,w=2.4,gap=.4,totalW=w*2+gap,totalD=run+landing*2;
 const c=new CivicComponent(p,id,'双跑连续梁与实体踏步',['BUILT-007','BUILT-008','BUILT-009','BUILT-242'],{height,stepsPerFlight:n,step,tread,width:w,totalW,totalD,topWalkY:height});
 c.box('下层入口平台','structuralConcrete',0,-.2,0,totalW,.2,landing);c.box('上层出口平台','structuralConcrete',0,height-.2,0,totalW,.2,landing);c.box('半转实平台','structuralConcrete',0,height/2-.2,landing+run,totalW,.2,landing);
 for(let i=0;i<n;i++){c.box('上行踏步-'+i,'stone',0,(i+1)*step-.20,landing+i*tread,w,.20,tread);c.box('回行踏步-'+i,'stone',w+gap,height/2+(i+1)*step-.20,landing+(n-1-i)*tread,w,.20,tread);}
 for(const x of[.10,w-.10])c.beam('上行连续梯梁','structuralConcrete',[x,-.12,landing],[x,height/2-.12,landing+run],.20,.35);
 for(const x of[w+gap+.10,totalW-.10])c.beam('回行连续梯梁','structuralConcrete',[x,height-.12,landing],[x,height/2-.12,landing+run],.20,.35);
 for(const [x,reverse]of[[-.08,false],[w+.02,false],[w+gap-.02,true],[totalW+.08,true]]as [number,boolean][]){const start=reverse?height:0,end=height/2;c.beam('连续梯扶手','woodEdge',[x,start+1.05,landing],[x,end+1.05,landing+run],.08,.08);for(let i=0;i<=n;i+=Math.max(1,Math.floor(n/4))){const z=landing+i*tread,y=reverse?height-i*step:i*step;c.box('扶手竖柱','metal',x-.025,y-.02,z-.025,.05,1.07,.05);}}
 for(const x of[-.08,totalW+.08])for(const y of[0,height/2,height]){const z=y===height/2?landing+run:0;c.beam('平台边扶手','woodEdge',[x,y+1.05,z],[x,y+1.05,z+landing],.08,.08);for(const zz of[z,z+landing-.05])c.box('平台栏柱','metal',x-.025,y-.02,zz,.05,1.07,.05);}
 c.beam('半转末端横扶手','woodEdge',[-.08,height/2+1.05,totalD],[totalW+.08,height/2+1.05,totalD],.08);for(const x of[0,totalW-.02])c.pin('平台栏端销','bronze',[x,height/2+1.04,totalD-.02]);
 const a=c.finish();a.ports=[{id:'lower',kind:'civic-walk',position:[1.2,0,0],normal:[0,0,-1],size:[2.4,2.2,0],pitch:.02},{id:'upper',kind:'civic-walk',position:[4,height,0],normal:[0,0,-1],size:[2.4,2.2,0],pitch:.02}];return a;
}
/** Analytic hip panels meet at real hip edges, with no rectangular grid crossing a crease. */
export function civicRoof(p:Project,id:string,w:number,d:number,rise=2,form:'hip'|'gable'='hip',inner?:[number,number]):Asset{
 const c=new CivicComponent(p,id,inner?'级间穿孔连续檐廊':'连续飞檐与梁椽',['BUILT-011','BUILT-012','BUILT-013','BUILT-246','BUILT-247'],{w,d,rise,form,inner:inner??null});
 const sections=12,outer=[w/2+.6,d/2+.6],innerX=inner?inner[0]/2:Math.max(0,w/2-d*.28),innerZ=inner?inner[1]/2:0;
 const y=(t:number)=>rise*(1-t)+.26*t**5;
 const addPanel=(name:string,a:(t:number)=>[number,number],b:(t:number)=>[number,number])=>{for(let j=0;j<sections;j++){const t=j/sections,q=(j+1)/sections,aa=a(t),bb=b(t),cc=b(q),dd=a(q),top:V3[]=[];top.push([aa[0],y(t),aa[1]]);if(Math.hypot(aa[0]-bb[0],aa[1]-bb[1])>1e-8)top.push([bb[0],y(t),bb[1]]);top.push([cc[0],y(q),cc[1]],[dd[0],y(q),dd[1]]);for(const[role,shift,thickness]of[['roof',0,.07],['waterproofMembrane',-.07,.015],['wood',-.085,.08]]as [string,number,number][])c.slab(name+'-'+j+'-'+role,role,top.map(v=>[v[0],v[1]+shift,v[2]]),thickness);}};
 if(form==='gable'&&!inner){for(const side of[-1,1])addPanel('双坡-'+side,t=>[-w/2-.6,side*outer[1]*t],t=>[w/2+.6,side*outer[1]*t]);}
 else{
  for(const side of[-1,1])addPanel('长檐-'+side,t=>[-innerX-(outer[0]-innerX)*t,side*(innerZ+(outer[1]-innerZ)*t)],t=>[innerX+(outer[0]-innerX)*t,side*(innerZ+(outer[1]-innerZ)*t)]);
  for(const side of[-1,1])addPanel('侧檐-'+side,t=>[side*(innerX+(outer[0]-innerX)*t),-innerZ-(outer[1]-innerZ)*t],t=>[side*(innerX+(outer[0]-innerX)*t),innerZ+(outer[1]-innerZ)*t]);
 }
 for(const z of[-d/2,d/2]){c.box('柱上通长梁','woodEdge',-w/2,-.15,z-.15,w,.30,.30);for(const x of[-w/2+.1,w/2-.12])c.pin('承梁铜锁销','bronze',[x,.10,z-.16]);}
 for(const x of[-w/2,w/2])c.box('山面承梁','wood',x-.15,-.15,-d/2,.30,.30,d);
 // Bearing blocks follow the very same piecewise planar roof profile. They join
 // the perimeter beams to the underside of the boards, including raised eaves.
 const roofY=(x:number,z:number)=>{const t=Math.max(0,Math.min(1,form==='gable'&&!inner?Math.abs(z)/outer[1]:Math.max((Math.abs(x)-innerX)/(outer[0]-innerX),(Math.abs(z)-innerZ)/(outer[1]-innerZ)))),j=Math.min(sections-1,Math.floor(t*sections)),f=t*sections-j;return y(j/sections)*(1-f)+y((j+1)/sections)*f;};
 const seats:[number,number][]=[];for(const z of[-d/2,d/2])for(let j=0,n=Math.max(1,Math.ceil(w/4));j<=n;j++)seats.push([-w/2+w*j/n,z]);for(const x of[-w/2,w/2])for(let j=1,n=Math.max(2,Math.ceil(d/4));j<n;j++)seats.push([x,-d/2+d*j/n]);
 for(const[x,z]of seats){const top=roofY(x,z)-.12;if(top>.15)c.box('檐梁至望板实承垫','wood',x-.09,.10,z-.09,.18,top-.10,.18);}
 if(!inner){c.box('长脊压瓦','roof',-innerX-.1,rise-.02,-.12,Math.max(.2,innerX*2+.2),.18,.24);for(const x of[-innerX,innerX]){c.box('脊端铜头','bronze',x-.10,rise+.12,-.10,.20,.18,.20);c.pin('脊端锁销','bronze',[x,rise+.28,0]);}}
 return c.finish();
}
