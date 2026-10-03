import {Shapes} from './shapes';
import {Grid} from '../core/grid';
import {type Asset,type Bounds,type V3} from '../core/types';

/** Image-guided construction recipes. The images guide design; dimensions and hidden
 * faces below are authored, not recovered from a single view. All detail is voxel data. */
export const architectureDefinitions=[
 ['A01','屋顶中段',[4,1.2,2.4],'搭接瓦垄、瓦口、檐下椽条、分层脊檩和端头'],
 ['A02','山墙端段',[3.2,1.5,2.4],'双坡连续屋面、真实山墙封板、脊端与阶梯山花'],
 ['A03','直线檐口',[4,.88,1.44],'短坡瓦面、檐梁、椽头、灯匣与端石'],
 ['A04','飞檐转角',[2.4,1.4,2.4],'连续转角瓦面、谷线、双向檐口和转角脊'],
 ['A05','首层开间',[3.2,3,.8],'贯穿门洞、侧窗、分段石柱、套箍、踏面和灯座'],
 ['A06','上层开间',[3.2,3,1.12],'开间、外挑楼板、玻璃栏杆和双花槽'],
 ['A07','转角开间',[3.2,3,3.2],'两向窗墙、共用转角柱、L形楼板和角部花槽'],
 ['A08','实墙开间',[3.2,3,.4],'错缝墙面、柱脚、窗台、贯穿格栅孔和梁头'],
 ['A09','门楼框架',[3.6,3.24,.64],'双柱、贯穿入口、承重门额、侧能源匣与柱脚'],
 ['A10','连桥直段',[4,1.4,1.6],'可通行桥板、双侧玻璃栏杆、端柱与下边梁'],
 ['A11','连廊转角',[3.2,1.4,3.2],'L形通道、连续转角栏杆、内角收口和承托'],
 ['A12','台基模块',[4,.4,1.6],'承重基座、错缝侧石、铺板与端面'],
 ['B01','落地窗',[3.2,2.64,.24],'三扇内缩玻璃、竖梃、压条、柱帽与上灯槽'],
 ['B02','玻璃门',[3.2,2.72,.32],'双玻璃门扇、独立拉手、轴套和可重建的静态开合'],
 ['B03','石柱',[.48,2.72,.48],'石砌柱身、阶梯柱帽、凹灯槽与柱脚格纹'],
 ['B04','横梁',[3.2,.48,.4],'梁腹、端箍、浅色嵌板、下灯匣与连接截面'],
 ['B05','栏杆直段',[3.2,1.08,.32],'分层端柱、压框、内缩玻璃和真实安装脚'],
 ['B06','栏杆转角',[2,1.08,2],'两向护栏与共用转角柱、内侧通行空间'],
 ['B07','楼板底板',[3.2,.32,2.4],'板底承托、石铺面、边框、能源槽和角件'],
 ['B08','屋脊端饰',[1.6,1.12,.72],'短瓦坡、递层脊端、端头饰块和能源嵌条'],
 ['B09','暖光壁灯',[.28,1.12,.2],'墙座、深色外框、内缩灯罩、上下盖及卡扣'],
 ['B10','青色灯带',[2.4,.16,.16],'完整线槽、扩散条、端盖和安装背面'],
 ['B11','长条花槽',[2.4,1,.6],'空心厚口沿、下沉土层、格纹嵌板和分枝叶簇'],
 ['B12','墙面格栅',[1.6,1.92,.32],'砌石外边、内凹金属框与贯穿的格栅孔'],
 ['B13','入口台阶',[3.2,.8,1.6],'四级等高踏步、侧收边、独立踏板和端灯座'],
 ['B14','庭院铺地',[3.2,.24,2.4],'实厚基底、方石铺面、下凹分缝与边石'],
 ['B15','铺地灯线',[3.2,.24,2.4],'铺地与L形内嵌灯槽、连续转角和端接'],
 ['B16','桥头连接段',[2.4,1.4,1.6],'可通行桥头、端部支座、短护栏和开放接续面'],
] as const;
export const architectureCatalog=Object.fromEntries(architectureDefinitions.map(([code,name])=>['kit-'+code.toLowerCase(),`${code} ${name} · 细化图鉴`]));
export const architectureParameters=(type:string)=>['width','height','depth',...(['kit-a05','kit-a06','kit-a09'].includes(type)?['openingWidth','openingHeight']:[]),...(type==='kit-b02'?['doorOpen']:[]),...(['kit-a01','kit-a02','kit-a03','kit-a04','kit-b08','kit-b11'].includes(type)?['detail']:[])];
export const architectureRevision=3;

class Builder extends Shapes{
 openings:Bounds[]=[];
 override b(x:number,y:number,z:number,w:number,h:number,d:number,m:number){if(Math.min(w,h,d)<1e-8)return;super.b(x,y,z,w,h,d,m);if(this.g.count>1_000_000)throw new Error('图鉴组件超过 1,000,000 格，请增大格距或缩小尺寸');}
 region(name:string,r:Bounds){this.parts.push({id:'part-'+this.parts.length,name,parent:'root',region:r});}
 blockPart(name:string,x:number,y:number,z:number,w:number,h:number,d:number,draw:()=>void){draw();this.region(name,this.bounds(x,y,z,w,h,d));}
 stamp(child:Builder,at:V3,turn=0,name='连接分段'){
  const q=((turn%4)+4)%4,offset=at.map(this.index),rotate=(p:V3):V3=>q===0?p:q===1?[p[2],p[1],-p[0]-1]:q===2?[-p[0]-1,p[1],-p[2]-1]:[-p[2]-1,p[1],p[0]];
  const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];
  for(const[p,m]of child.g.cells()){const v=rotate(p).map((n,i)=>n+offset[i]) as V3;this.g.set(v,m);for(let i=0;i<3;i++){min[i]=Math.min(min[i],v[i]);max[i]=Math.max(max[i],v[i]+1);}}
  if(child.g.count)this.region(name,{min,max});
 }
 masonry(x:number,y:number,z:number,w:number,h:number,d:number,m=this.s.wall,bw=.4,bh=.24){
  const e=this.pitch,core=this.s.recess??this.s.stone;
  this.b(x+e,y,z+e,w-2*e,h,d-2*e,core);
  // Mortar at the four arrises keeps coarse-grid corner stones face-connected.
  for(const xx of[x,x+w-e])for(const zz of[z,z+d-e])this.b(xx,y,zz,e,h,e,core);
  // Half-bond joints are recesses with a continuous backing, never accidental holes.
  for(let j=0,yy=y;yy<y+h-e/2;yy+=bh,j++){
   const hh=Math.min(bh,h-(yy-y));
   for(let xx=x-(j%2)*bw/2;xx<x+w-e/2;xx+=bw){const a=Math.max(x,xx),b=Math.min(x+w,xx+bw);if(b-a<=e)continue;for(const zz of[z,z+d-e])this.b(a+e,yy+e,zz,b-a-e,hh-e,e,m);}
   for(let zz=z;zz<z+d-e/2;zz+=bw){const dd=Math.min(bw,z+d-zz);for(const xx of[x,x+w-e])this.b(xx,yy+e,zz+e,e,hh-e,dd-e,m);}
  }
  this.b(x,y,z,w,e,d,m);this.b(x,y+h-e,z,w,e,d,m);
 }
 paving(x:number,y:number,z:number,w:number,h:number,d:number,energy=false){
  const e=this.pitch,edge=Math.min(.12,w/5,d/5);
  this.masonry(x,y,z,w,h,d,this.s.stone,.4,.2);
  this.b(x,y+h-2*e,z,w,e,d,this.s.recess??this.s.stone);
  for(let xx=x;xx<x+w-e;xx+=.4)for(let zz=z;zz<z+d-e;zz+=.4)this.b(xx+e,y+h-e,zz+e,Math.min(.4,x+w-xx)-e,e,Math.min(.4,z+d-zz)-e,this.s.wall);
  for(const xx of[x,x+w-edge])this.b(xx,y+h-e,z,edge,e,d,this.s.wall);
  for(const zz of[z,z+d-edge])this.b(x,y+h-e,zz,w,e,edge,this.s.wall);
  if(energy){this.b(x+.2,y+h-.1,z,w-.4,.06,e,this.s.metal);this.b(x+.24,y+h-.08,z-e,w-.48,e,e,this.s.energy);}
 }
 lamp(x:number,y:number,z:number,w:number,h:number,d:number){
  const e=this.pitch,r=Math.max(e,Math.min(.04,w/5));
  this.b(x,y,z+d-e,w,h,e,this.s.metal);
  this.b(x+r,y+.06,z+e,w-2*r,h-.12,d-2*e,this.s.warm);
  for(const xx of[x,x+w-r])this.b(xx,y,z,r,h,d,this.s.metal);
  for(const yy of[y,y+h-.06])this.b(x,yy,z,w,.06,d,this.s.trim??this.s.metal);
  for(const yy of[y+.08,y+h-.1])this.b(x+r,yy,z,w-2*r,e,e,this.s.bronze??this.s.wood);
  // Short ribs are geometry, not a luminous-texture mask.
  this.b(x+w/2-e/2,y+.16,z+e,e,h-.32,e,this.s.warm);
 }
 pillar(x:number,y:number,z:number,w:number,h:number,d:number,lamp=true){
  const e=this.pitch,foot=Math.min(.3,h*.14),cap=Math.min(.18,h*.1),side=Math.max(e,.06);
  this.masonry(x,y,z,w,foot,d,this.s.stone,.24,.16);
  this.masonry(x+e,y+foot,z+e,w-2*e,h-foot-cap,d-2*e,this.s.wall,.32,.32);
  for(const xx of[x+side,x+w-side-.06])this.b(xx,y+foot,z,.06,h-foot-cap,e,this.s.metal);
  this.b(x+side+.06,y+foot,z,w-2*side-.12,h-foot-cap,e,this.s.wood);
  for(const yy of[y+foot,y+h-cap-.1]){
   this.b(x,yy,z,w,.1,d,this.s.metal);this.b(x+w/2-e,yy+.02,z-e,2*e,2*e,e,this.s.bronze??this.s.warm);
  }
  this.masonry(x,y+h-cap,z,w,cap,d,this.s.wall,.24,.16);
  if(lamp)this.lamp(x+w/2-.07,y+foot+.42,z-.1,.14,Math.min(.72,h*.29),.12);
  this.b(x+w/2-.08,y+.06,z-e,.16,.16,e,this.s.metal);
  this.hui(x+w/2-.06,y+.08,z-2*e,.12,.12,this.s.trim??this.s.stone,e);
 }
 crossbeam(x:number,y:number,z:number,w:number,h:number,d:number){
  const e=this.pitch;
  this.b(x,y,z,w,h,d,this.s.metal);
  this.masonry(x+.16,y+.1,z,w-.32,h-.18,d,this.s.wall,.4,.18);
  for(const xx of[x,x+w-.16]){
   this.b(xx,y,z-e,.16,h,d+2*e,this.s.metal);
   this.b(xx+.04,y+h/2-.02,z-2*this.pitch,.06,.06,this.pitch,this.s.bronze??this.s.warm);
  }
  this.b(x+.16,y+.02,z-this.pitch,w-.32,.06,this.pitch,this.s.wood);
  for(let xx=x+.3;xx<x+w-.22;xx+=.6)this.b(xx,y-.04,z+.02,.12,.06,.08,this.s.warm);
 }
 railing(w:number,h:number,d:number=.28){
  const s=this.s,e=this.pitch,post=Math.min(.24,d),railY=h-.12;
  this.b(0,.08,0,w,.12,d,s.metal);this.b(0,railY,0,w,.1,d,s.metal);
  const gaps=Math.max(1,Math.round((w-.4)/.8));
  for(let j=0;j<gaps;j++){
   const l=post+(w-2*post)*j/gaps,r=post+(w-2*post)*(j+1)/gaps;
   this.b(l+e,.24,d/2,r-l-2*e,h-.48,e,s.glass);
   this.b(l, .2,d/2-e,.04,h-.32,3*e,s.metal);
   this.b(l+.04,railY-.06,0,r-l-.04,.06,2*e,s.metal);
   this.b(l+.04,railY-.06,-e,r-l-.04,e,e,s.energy);
  }
  for(const x of[0,w-post]){
   this.b(x,0,0,post,.16,d,s.stone);this.b(x+e,.16,e,post-2*e,h-.16,d-2*e,s.metal);
   this.b(x,h-.14,0,post,.14,d,s.trim??s.metal);
   this.b(x+.04,h-.34,0,Math.max(2*e,post-.08),.14,e,s.metal);
   this.b(x+.06,h-.32,-e,Math.max(e,post-.12),.1,e,s.warm);
  }
 }
 glazing(w:number,h:number,d:number,panes=3){
  const s=this.s,e=this.pitch,t=.1;
  for(const x of[0,w-t])this.b(x,0,0,t,h,d,s.metal);
  for(const y of[0,h-t])this.b(0,y,0,w,t,d,s.metal);
  for(let i=0;i<panes;i++){
   const x=t+(w-2*t)*i/panes,r=t+(w-2*t)*(i+1)/panes;
   this.b(x+.04,.12,d/2,r-x-.08,h-.28,e,s.glass);
   this.b(x,.08,d/2-e,.04,h-.16,3*e,s.metal);
   this.b(r-.04,.08,d/2-e,.04,h-.16,3*e,s.metal);
   this.b(x+.04,h-.18,0,r-x-.08,.08,2*e,s.metal);
   this.b(x+.04,h-.18,-e,r-x-.08,e,e,s.energy);
   this.b(x+.04,.1,d/2-e,r-x-.08,e,3*e,s.trim??s.metal);
  }
  for(const x of[0,w-.16])for(const y of[0,h-.16]){this.b(x,y,-e,.16,.16,d+e,s.trim??s.metal);this.b(x+.06,y+.06,-2*e,.04,.04,e,s.energy);}
 }
 planter(w:number,h:number,d:number,detail=2){
  const e=this.pitch,s=this.s,pot=h*.6,wall=Math.max(.06,3*e),soil=pot-.08;
  this.b(0,0,0,w,.1,d,s.stone);this.b(e,.1,e,w-2*e,.04,d-2*e,s.metal);
  this.masonry(e,.14,e,w-2*e,pot-.14,d-2*e,s.wall,.32,.22);
  this.b(wall,.16,wall,w-2*wall,pot,d-2*wall,0);
  this.b(wall,.16,wall,w-2*wall,soil-.16,d-2*wall,s.soil);
  for(const x of[0,w-wall])this.b(x,pot-.04,0,wall,.06,d,s.wall);
  for(const z of[0,d-wall])this.b(0,pot-.04,z,w,.06,wall,s.wall);
  this.b(wall,.2,0,w-2*wall,.24,e,s.metal);
  for(const y of[.22,.32])this.b(wall+.04,y,-e,w-2*wall-.08,.04,e,s.trim??s.stone);
  this.b(.12,.2,-e,.22,.24,e,s.wall);this.hui(.16,.24,-2*e,.14,.16,s.metal,e);
  // Real drainage slot; no glass/soil material masquerading as a hole.
  this.b(w-.22,.08,d-.1,.06,.06,.1,0);
  const count=Math.max(3,Math.round(w/.32));
  for(let i=0;i<count;i++){
   const cx=wall+.1+(w-2*wall-.2)*(i+.5)/count,cz=d*(i%2?.65:.38),top=soil+(h-soil)*(.65+(i%3)*.14);
   const lean=i%2?.04:-.04;
   this.beam([cx,soil-e,cz],[cx+lean,top,cz],2*e,s.wood);
   for(let j=0;j<4+detail;j++){
    const a=j*2.399+i*.7,yy=soil+.08+(top-soil-.08)*j/(4+detail),len=.08+(j%2)*.04;
    const tip:V3=[cx+Math.cos(a)*len,yy+.04,Math.max(wall,Math.min(d-wall,cz+Math.sin(a)*len))];
    this.beam([cx+lean*(yy-soil+e)/(top-soil+e),yy,cz],tip,e,s.leaf);
    this.rounded(tip[0]-.06,tip[1]-.02,tip[2]-.05,.12,.08,.1,e,j%3?s.leaf:s.leafAlt??s.leaf);
   }
   this.b(cx+lean-.04,top,cz-.04,.08,.08,.08,s.leafAlt??s.leaf);
  }
 }
}

/** Continuous tile shell; curved profile is quantised before emitting cells. */
function roof(b:Builder,W:number,H:number,D:number,mode:'slope'|'gable'|'corner',detail:number,ends=true){
 const e=b.pitch,s=b.s,tile=Math.max(.16,.32-detail*.04),rise=H-.62,base=.14;
 const profile=(x:number,z:number)=>{
  const u=mode==='gable'?1-Math.abs(2*x/W-1):mode==='corner'?Math.max(x/W,z/D):z/D;
  return b.index(base+rise*u+Math.max(0,1-u*5)*.1)*e;
 };
 const nx=b.index(W),nz=b.index(D),span=Math.max(1,b.index(tile)),row=Math.max(1,b.index(.36));
 // One surface at every X/Z column: corners are not two intersecting solid roof planes.
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
  const x=ix*e,z=iz*e,y=profile(x+e/2,z+e/2),across=mode==='gable'?iz:ix,along=mode==='gable'?ix:iz;
  b.b(x,y,z,e,.08,e,s.roof);
  if(across%span<=1)b.b(x,y+.08,z,e,e,e,s.trim??s.roof);
  if(along%row===0)b.b(x,y+.08,z,e,e,e,s.roof);
 }
 // Exposed rafters run underneath and attach to the continuous shell.
 for(let x=.12;x<W-.1;x+=.48)for(let z=.04;z<D-.08;z+=e){const y=profile(x,z);b.b(x,y-.06,z,.06,.06,e,s.wood);}
 if(mode==='gable'){
  const top=profile(W/2,D/2)+.08;
  b.masonry(W/2-.14,top,0,.28,.16,D,s.roof,.28,.16);
  b.b(W/2-.16,top-.02,.08,e,.04,D-.16,s.energy);
  for(const z of[0,D-.28]){b.b(W/2-.18,top+.14,z,.36,.18,.28,s.roof);b.b(W/2-.12,top+.32,z+.04,.24,.08,.2,s.trim??s.roof);}
  // Front and rear bargeboards follow the roof slope and remain visibly stepped.
  for(const z of[0,D-.08])for(let x=0;x<W;x+=e){const yy=profile(x,z);b.b(x,yy+.06,z,e,.12,.08,s.metal);b.b(x,yy+.04,z-e,e,e,e,s.energy);}
  for(let x=.16;x<W-.16;x+=e){const hh=Math.max(0,profile(x,.2)-.18);b.b(x,.16,.18,e,hh,.08,s.wall);}
 }else{
  const top=profile(W-e,D-e)+.08;
  b.masonry(0,top,D-.24,W,.18,.24,s.roof,.32,.18);b.b(.08,top-.02,D-.26,W-.16,e,e,s.energy);
  if(mode==='corner'){b.masonry(W-.24,top,0,.24,.18,D,s.roof,.32,.18);b.b(W-.26,top-.02,.08,e,e,D-.16,s.energy);}
  if(ends)for(const x of[0,W-.28]){b.b(x,top+.14,D-.3,.28,.16,.3,s.roof);b.b(x+.02,top+.3,D-.28,.24,.1,.26,s.trim??s.roof);}
  if(ends&&mode==='corner'){b.b(W-.28,top+.14,0,.28,.16,.3,s.roof);b.b(W-.26,top+.3,.02,.24,.1,.26,s.trim??s.roof);}
  if(ends&&mode!=='corner')for(const x of[0,W-.1])for(let z=0;z<D-.22;z+=e){const yy=profile(x,z);b.b(x,yy+.04,z,.1,.12,e,s.metal);}
 }
 // Fascia brackets follow their own eave, not the centre/ridge height.
 // The two gable eaves run along Z; a hip corner has two raking front edges.
 const tooth=(x:number,z:number)=>{
  const y=profile(x+.07,z+.07);
  b.b(x,y-.08,z,.14,.16,.14,s.roof);
  b.b(x+.02,y-.14,z+.02,.1,.06,.1,s.warm);
 };
 if(mode==='gable')for(const x of[0,W-.14])for(let z=.08;z<D-.08;z+=.24)tooth(x,z);
 else{
  for(let x=.08;x<W-.08;x+=.24)tooth(x,0);
  if(mode==='corner')for(let z=.24;z<D-.08;z+=.24)tooth(0,z);
 }
 b.region('瓦垄、叠瓦、檐口与承托',b.bounds(0,0,0,W,H,D));
}

export function generateArchitecture(id:string,name:string,type:string,p:Record<string,number>,pitch:number,style:Record<string,number>,styleName:string):Asset{
 const def=architectureDefinitions.find(([code])=>'kit-'+code.toLowerCase()===type);if(!def)throw new Error('未知建筑图鉴组件');
 if(![.01,.02,.04].includes(pitch))throw new Error('细化建筑图鉴支持 0.01、0.02 或 0.04 米格距');
 const allowed=architectureParameters(type);for(const[k,v]of Object.entries(p))if(!allowed.includes(k)||!Number.isFinite(v))throw new Error('未知或无效建筑参数 '+k);
 const size=def[2].map((v,i)=>{const n=p[['width','height','depth'][i]]??v;if(n<v*.65||n>v*1.6)throw new Error('尺寸超出此构件已验证的 65%–160% 重建范围');return Math.round(n/pitch)*pitch;}) as V3;
 const[W,H,D]=size,detail=p.detail??2;if(!Number.isInteger(detail)||detail<1||detail>3)throw new Error('detail 必须为 1–3');
 if(W*H*D/pitch**3>20_000_000)throw new Error('体积预算过大，请增大格距');
 const m:Record<string,number>={...style,trim:style.trim??style.metal,recess:style.recess??style.stone,bronze:style.bronze??style.wood,leafAlt:style.leafAlt??style.leaf};
 const b=new Builder(pitch,m),e=pitch,code=def[0];
 const child=()=>new Builder(pitch,m),params:Record<string,number>={width:W,height:H,depth:D};
 if(allowed.includes('detail'))params.detail=detail;
 const place=(draw:(c:Builder)=>void,at:V3,turn=0,label='装配分段')=>{const c=child();draw(c);b.stamp(c,at,turn,label);};
 const opening=(x:number,y:number,z:number,w:number,h:number,d:number)=>b.openings.push(b.bounds(x,y,z,w,h,d));
 const window=(x:number,y:number,z:number,w:number,h:number,d:number,panes=3)=>place(c=>c.glazing(w,h,d,panes),[x,y,z],0,'竖梃、压条与玻璃');
 const bay=(solid=false,balcony=false)=>{
  const base=.24,post=.36,wallZ=D-.36,lintel=H-.32;
  b.paving(0,0,0,W,base,D);for(const x of[0,W-post])b.pillar(x,base,wallZ,post,H-base,.36);
  b.b(post,lintel,wallZ,W-2*post,.24,.3,m.metal);b.b(post+.06,lintel+.04,wallZ-e,W-2*post-.12,.08,e,m.wood);
  b.b(post+.08,lintel+.02,wallZ-e,W-2*post-.16,e,e,m.energy);
  if(solid){
   b.masonry(post,base,wallZ+.06,W-2*post,lintel-base,.28,m.wall);
   const ow=Math.min(1.12,W-1.12),oh=Math.min(1.28,H-1.1),ox=Math.round((W-ow)/2/e)*e,oy=.9;
   b.b(ox-.1,oy-.1,wallZ-.02,ow+.2,oh+.2,.34,m.metal);b.b(ox,oy,wallZ-.02,ow,oh,.38,0);
   for(let x=ox+.1;x<ox+ow-.04;x+=.16)b.b(x,oy,wallZ+.1,.04,oh,.04,m.metal);
   for(let y=oy+.12;y<oy+oh-.04;y+=.18)b.b(ox,y,wallZ+.1,ow,.04,.04,m.metal);
   b.b(ox-.12,oy-.12,wallZ-.08,ow+.24,.1,.42,m.stone);
  }else{
   const ow=Math.round((p.openingWidth??1.2)/e)*e,oh=Math.round((p.openingHeight??2.12)/e)*e,ox=Math.round((W-ow)/2/e)*e;
   if(ow<.8||ow>W-1.08||oh<1.6||base+oh>lintel-.08)throw new Error('门洞与柱梁尺寸不兼容');
   params.openingWidth=ow;params.openingHeight=oh;
   for(const[x,w]of[[post,ox-post-.08],[ox+ow+.08,W-post-ox-ow-.08]])window(x,base,wallZ,w,lintel-base,.2,1);
   b.b(ox-.08,base,wallZ,.08,oh,.22,m.metal);b.b(ox+ow,base,wallZ,.08,oh,.22,m.metal);
   b.b(ox-.08,base+oh,wallZ,ow+.16,.08,.22,m.metal);
   window(ox,base+oh+.08,wallZ,ow,Math.max(.12,lintel-base-oh-.08),.16,1);
   if(!balcony){
    opening(ox,base,0,ow,oh,D);
    for(const x of[0,W-post]){for(let step=0;step<3;step++)b.b(x+.04,base,step*.08,post-.08,(step+1)*.04,.08,m.wall);b.b(x+.1,base+Math.max(0,.04-e),-e,.1,e,e,m.warm);}
   }
   else{
    place(c=>c.railing(W-.88,.88,.22),[.44,base,.04],0,'前沿玻璃栏杆');
    for(const x of[.02,W-.44])place(c=>c.planter(.42,.74,.48,1),[x,base,.02],0,'阳台种植槽');
   }
  }
  b.region('承重楼板与分段柱梁',b.bounds(0,0,0,W,H,D));
 };
 if(['A01','A02','A03','A04'].includes(code)){
  roof(b,W,H,D,code==='A02'?'gable':code==='A04'?'corner':'slope',detail,code!=='A03');
  if(code==='A03')for(const x of[0,W-.28])b.masonry(x,H-.26,D-.3,.28,.24,.3,m.wall,.28,.12);
 }else if(code==='A05'||code==='A06'||code==='A08')bay(code==='A08',code==='A06');
 else if(code==='A07'){
  const foot=.24,t=.36,arm=.8; b.paving(0,0,0,W,foot,arm);b.paving(W-arm,0,arm,arm,foot,D-arm);
  for(const[x,z]of[[0,0],[W-t,0],[W-t,D-t]])b.pillar(x,foot,z,t,H-foot,t);
  b.b(t,H-.32,.04,W-2*t,.24,.28,m.metal);b.b(W-.32,H-.32,t,.28,.24,D-2*t,m.metal);
  window(t,foot,.08,W-2*t,H-foot-.32,.2,3);
  place(c=>c.glazing(D-2*t,H-foot-.32,.2,3),[W-.08,foot,t],3,'转角第二向压框与玻璃');
  for(const z of[0,D-t]){
   b.b(W-e,foot+.3,z+.1,e,H-foot-.48,.16,m.wood);
   place(c=>c.lamp(0,0,0,.14,.72,.12),[W+.08,foot+.72,z+.1],3,'转角侧向柱灯');
  }
  b.paving(W-.54,0,-.34,.54,foot,.34);
  place(c=>c.planter(.5,.9,.5,2),[W-.52,foot,-.32],0,'外角种植槽与承托');
  b.region('L形基座与共用角柱',b.bounds(0,0,0,W,H,D));
 }else if(code==='A09'){
  const ow=Math.round((p.openingWidth??W-1.04)/e)*e,oh=Math.round((p.openingHeight??H-.52)/e)*e,x=(W-ow)/2;
  if(ow<1||ow>W-.88||oh<1.8||oh>H-.4)throw new Error('门楼开口与梁柱尺寸不兼容');params.openingWidth=ow;params.openingHeight=oh;
  for(const xx of[0,x+ow])b.pillar(xx,0,0,x,H,D,false);
  b.crossbeam(x,oh+.04,0,ow,H-oh-.04,.44);
  for(const xx of[.1,W-.28]){b.b(xx,.6,-.08,.18,H-1.24,.1,m.metal);b.b(xx+.04,.68,-.1,.1,H-1.4,.04,m.energy);}
  opening(x,0,0,ow,oh,D);b.region('门楼双柱与门额',b.bounds(0,0,-.1,W,H,D+.1));
 }else if(code==='A10'||code==='B16'){
  const deck=.32;b.paving(0,0,0,W,deck,D,true);
  for(const z of[0,D-.28])place(c=>c.railing(W,H-deck,.28),[0,deck,z],0,'桥侧护栏');
  for(const z of[.2,D-.32])b.b(0,0,z,W,.12,.12,m.metal);
  if(code==='B16')for(const x of[0,W-.32])for(const z of[0,D-.32])b.masonry(x,deck,z,.32,H-deck,.32,m.stone,.32,.3);
  opening(0,deck,.32,W,H-deck,D-.64);
 }else if(code==='A11'){
  const deck=.32,arm=1.28;b.paving(0,0,0,W,deck,arm,true);b.paving(W-arm,0,arm,arm,deck,D-arm,true);
  place(c=>c.railing(W,H-deck,.24),[0,deck,0],0,'外侧横栏');
  place(c=>c.railing(D,H-deck,.24),[W,deck,0],3,'外侧纵栏');
  place(c=>c.railing(W-arm+.24,H-deck,.24),[0,deck,arm-.24],0,'内侧横栏');
  place(c=>c.railing(D-arm+.24,H-deck,.24),[W-arm+.24,deck,arm-.24],3,'内侧纵栏');
  opening(0,deck,.28,W-.28,H-deck,arm-.56);opening(W-arm+.28,deck,arm-.28,arm-.56,H-deck,D-arm+.28);
 }else if(['A12','B07','B14','B15'].includes(code)){
  b.paving(0,0,0,W,H,D,code==='B07');
  if(code==='B07'){for(const x of[0,W-.24])for(const z of[0,D-.24])b.b(x,0,z,.24,H-.04,.24,m.metal);for(let x=.2;x<W-.2;x+=.64)b.b(x,.06,0,.12,.06,e,m.warm);}
  if(code==='B15'){
   const lx=Math.round(W*.65/e)*e,lz=Math.round(D*.35/e)*e;
   b.b(lx-.02,H-.06,0,.1,.06,lz+.06,m.metal);b.b(0,H-.06,lz-.02,lx+.08,.06,.1,m.metal);
   b.b(lx,H-e,0,.04,e,lz+.04,m.energy);b.b(0,H-e,lz,lx+.04,e,.04,m.energy);
  }
  b.region('铺面、下凹接缝与承托',b.bounds(0,0,0,W,H,D));
 }else if(code==='B01')b.glazing(W,H,D,3);
 else if(code==='B02'){
  const opened=p.doorOpen??0;if(opened!==0&&opened!==1)throw new Error('doorOpen 仅支持 0（关闭）或 1（90°静态开启）');params.doorOpen=opened;
  const post=.24,lintel=.2,clear=W-2*post,leafW=(clear-.08)/2;
  for(const x of[0,W-post])b.pillar(x,0,0,post,H,D,true);
  b.b(post,H-lintel,0,clear,lintel,D,m.metal);b.b(post+.04,H-lintel+.02,-e,clear-.08,e,e,m.energy);
  const makeLeaf=()=>{const c=child();c.glazing(leafW,H-lintel-.04,.12,1);c.b(leafW-.14,H*.43,-.08,.04,.38,.1,m.bronze);c.b(leafW-.16,H*.43,-.02,.08,.04,.1,m.metal);c.b(leafW-.16,H*.43+.34,-.02,.08,.04,.1,m.metal);return c;};
  const leaf=makeLeaf(),rightLeaf=child();
  // Mirror X only: both pull handles must remain on the front of the closed door.
  for(const[v,material]of leaf.g.cells())rightLeaf.g.set([b.index(leafW)-v[0]-1,v[1],v[2]],material);
  if(!opened){b.stamp(leaf,[post+.02,0,.08],0,'左门扇 / 拉手');b.stamp(rightLeaf,[W-post-.02-leafW,0,.08],0,'右门扇 / 拉手');}
  else{b.stamp(leaf,[post+.08,0,.06],3,'左扇静态开启');b.stamp(rightLeaf,[W-post-.08,0,leafW+.06],1,'右扇静态开启');opening(post+.24,0,0,clear-.48,H-lintel,D);}
  for(const x of[post-.04,W-post-.04])for(const y of[.3,H-.48])b.b(x,y,.12,.08,.12,.12,m.trim);
 }else if(code==='B03')b.pillar(0,0,0,W,H,D);
 else if(code==='B04')b.crossbeam(0,.04,0,W,H-.04,D);
 else if(code==='B05')b.railing(W,H,D);
 else if(code==='B06'){
  b.railing(W,H,.28);place(c=>c.railing(D,H,.28),[.28,0,0],3,'转角栏杆第二向');
  b.b(0,H-.18,0,.28,.18,.28,m.trim);
 }else if(code==='B08'){
  roof(b,W,H-.22,D,'slope',detail,false);
  const x=W-.3;for(let j=0;j<4;j++)b.b(x-j*.12,H-.44-j*.12,D-.28,.3,.24,.28,m.roof);
  b.b(x+.04,H-.22,D-.24,.22,.22,.2,m.trim);b.b(x+.08,H-.4,D-.3,.08,.08,e,m.warm);
 }else if(code==='B09')b.lamp(0,0,0,W,H,D);
 else if(code==='B10'){
  b.b(0,0,0,W,H,D,m.metal);b.b(.14,.04,0,W-.28,H-.08,.04,0);b.b(.16,.04,.02,W-.32,H-.08,.02,m.energy);
  for(const x of[0,W-.14]){b.b(x,-.02,-.02,.14,H+.04,D+.04,m.trim);b.b(x+.04,.04,-.04,.06,H-.08,.02,m.stone);}
 }else if(code==='B11')b.planter(W,H,D,detail);
 else if(code==='B12'){
  const t=.2;b.masonry(0,0,0,W,H,D,m.wall,.32,.24);b.b(t-.04,t-.04,0,W-2*t+.08,H-2*t+.08,D,m.metal);b.b(t,t,0,W-2*t,H-2*t,D,0);
  for(let x=t+.12;x<W-t-.04;x+=.18)b.b(x,t,.12,.04,H-2*t,.06,m.metal);
  for(let y=t+.12;y<H-t-.04;y+=.18)b.b(t,y,.12,W-2*t,.04,.06,m.metal);
  b.region('石边与凹入格栅',b.bounds(0,0,0,W,H,D));
 }else if(code==='B13'){
  const n=4,dh=H/n,dd=D/n,edge=.28;
  for(let i=0;i<n;i++)b.paving(edge,0,i*dd,W-2*edge,(i+1)*dh,dd,false);
  for(const x of[0,W-edge])for(let i=0;i<n;i++)b.masonry(x,0,i*dd,edge,(i+1)*dh,dd,m.wall,.28,.2);
  for(const x of[.04,W-edge+.04]){b.b(x,.04,-e,edge-.08,.12,e,m.metal);b.b(x+.02,.06,-2*e,edge-.12,.08,e,m.warm);}
  b.region('四级踏步、侧收边与端灯',b.bounds(0,0,-2*e,W,H,D+2*e));
 }
 if(b.g.count>1_000_000)throw new Error('图鉴组件超过 1,000,000 格，请增大格距');
 const a=b.finish(id,name,{kind:'architecture-reference',referenceCode:code,referenceImage:code.startsWith('A')?'庭院建筑模块图鉴-2.png':'立面与细部组件-1.png',generatorRevision:architectureRevision,features:def[3],method:'依据用户参考图人工解析并编写规则，输出原生体素；非自动图片或Tripo反推',assumptions:'尺寸、背面、构件厚度及隐藏连接为显式建模设计；静态开合不是动画系统',units:'metres',frontAxis:'-Z',dimensionsM:size,style:styleName});
 a.category='template';a.template={type,params,style:styleName};a.openings=b.openings;
 if(a.parts.length===1)a.parts.push({id:'structure',name:def[3],parent:'root',region:new Grid(a.chunks).bounds()!});
 const bb=new Grid(a.chunks).bounds()!,y0=bb.min[1]*pitch;
 a.ports=[{id:'base',kind:'support',position:[0,y0,0],normal:[0,-1,0],size:[W,0,D],pitch}];
 if(!['B03','B08','B09','B11','B12','B13'].includes(code)){
  a.ports.push({id:'left',kind:code.startsWith('A0')&&Number(code.slice(1))<=4?'roof-seam':'edge',position:[0,0,0],normal:[-1,0,0],size:[0,H,D],pitch},{id:'right',kind:code.startsWith('A0')&&Number(code.slice(1))<=4?'roof-seam':'edge',position:[W,0,0],normal:[1,0,0],size:[0,H,D],pitch});
 }
 if(['A05','A06','A07','A08','A09','B03'].includes(code))a.ports.push({id:'top',kind:'support',position:[0,H,0],normal:[0,1,0],size:[W,0,D],pitch});
 return a;
}
