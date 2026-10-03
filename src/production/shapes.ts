import {Grid} from '../core/grid';
import {eachCell,type Asset,type V3,type Bounds} from '../core/types';
import {connectedLine,voxelIndex} from '../core/voxel-shapes';

/** Metre-space construction, rasterised before storage. No mesh is authoritative. */
export class Shapes {
 g=new Grid(); parts:Asset['parts']=[];
 constructor(public pitch:number,public s:Record<string,number>){}
 shifted(offset:V3,draw:(b:Shapes)=>void){const child=new Shapes(this.pitch,this.s);draw(child);const shift=offset.map(this.index);for(const[p,m]of child.g.cells())this.g.set(p.map((n,i)=>n+shift[i]) as V3,m);for(const part of child.parts)this.parts.push({...part,id:'part-'+this.parts.length,region:{min:part.region.min.map((n,i)=>n+shift[i]) as V3,max:part.region.max.map((n,i)=>n+shift[i]) as V3}});}
 index=(v:number)=>voxelIndex(v,this.pitch);
 bounds(x:number,y:number,z:number,w:number,h:number,d:number):Bounds{return{min:[x,y,z].map(this.index) as V3,max:[x+w,y+h,z+d].map(this.index) as V3};}
 b(x:number,y:number,z:number,w:number,h:number,d:number,m:number){
  if(w<=0||h<=0||d<=0)return;
  const r=this.bounds(x,y,z,w,h,d);r.max=r.max.map((n,i)=>Math.max(n,r.min[i]+1)) as V3;eachCell(r,p=>this.g.set(p,m));
 }
 part(name:string,draw:()=>void){
  // Record cells touched by this construction, not merely the whole asset's AABB.
  const before=this.g.serialize();draw();const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];
  const old=new Grid(before);for(const[p,m]of this.g.cells())if(old.get(p)!==m)for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]+1);}
  if(Number.isFinite(min[0]))this.parts.push({id:'part-'+this.parts.length,name,parent:'root',region:{min,max}});
 }
 beam(a:V3,b:V3,t:number,m:number){
  const line=new Grid();connectedLine(line,this.pitch,a,b,m);const n=Math.max(1,this.index(t)),offset=Math.floor(n/2);
  for(const[p]of line.cells())for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++)this.g.set([p[0]+x-offset,p[1]+y-offset,p[2]+z-offset],m);
 }
 rounded(x:number,y:number,z:number,w:number,h:number,d:number,r:number,m:number){
  const bounds=this.bounds(x,y,z,w,h,d),cx=x+w/2,cy=y+h/2,cz=z+d/2;r=Math.min(r,w/2,h/2,d/2);
  eachCell(bounds,p=>{const v=p.map(n=>(n+.5)*this.pitch),q=[Math.max(Math.abs(v[0]-cx)-w/2+r,0),Math.max(Math.abs(v[1]-cy)-h/2+r,0),Math.max(Math.abs(v[2]-cz)-d/2+r,0)];if(q.reduce((s,n)=>s+n*n,0)<=r*r+1e-9)this.g.set(p,m);});
 }
 cylinder(cx:number,y:number,cz:number,r:number,h:number,m:number,inner=0,axis:'y'|'z'='y'){
  const a=axis==='y'?this.bounds(cx-r,y,cz-r,2*r,h,2*r):this.bounds(cx-r,y-r,cz,2*r,2*r,h);
  eachCell(a,p=>{const px=(p[0]+.5)*this.pitch,other=(p[axis==='y'?2:1]+.5)*this.pitch,rr=(px-cx)**2+(other-(axis==='y'?cz:y))**2;if(rr<=r*r&&rr>=inner*inner)this.g.set(p,m);});
 }
 bowl(cx:number,y:number,cz:number,r:number,h:number,m:number){
  for(let k=0;k<Math.ceil(h/this.pitch);k++){const f=k*this.pitch/h,rr=r*(.55+.45*f);this.cylinder(cx,y+k*this.pitch,cz,rr,this.pitch,m,k<2?0:Math.max(0,rr-this.pitch*2));}
 }
 /** Continuous orthogonal meander, cut or inlaid as actual cells on a front face. */
 hui(x:number,y:number,z:number,w:number,h:number,m:number,t=this.pitch){
  if(w<6*t||h<6*t)return;
  this.b(x,y,z,w,t,t,m);this.b(x,y,z,t,h,t,m);this.b(x,y+h-t,z,w,h>t?t:0,t,m);this.b(x+w-t,y+2*t,z,t,h-2*t,t,m);
  this.b(x+2*t,y+2*t,z,w-2*t,t,t,m);this.b(x+2*t,y+2*t,z,t,h-4*t,t,m);this.b(x+2*t,y+h-3*t,z,w-4*t,t,t,m);
 }
 /** A square timber post, stepped stone shoe, dark shoulders and brass tenon cap. */
 post(x:number,y:number,z:number,t:number,h:number,foot=true){
  const e=this.pitch,wood=this.s.wood,metal=this.s.metal,gold=this.s.bronze??metal;
  this.b(x+e,y,z+e,t-2*e,h,t-2*e,wood);
  if(foot){this.b(x,y,z,t,.04,t,this.s.wall);this.b(x+e,y+.04,z+e,t-2*e,.045,t-2*e,metal);}
  this.b(x,y+h-.08,z,t,.05,t,metal);
  this.b(x+e,y+h-.03,z+e,t-2*e,.03,t-2*e,wood);
  for(const sx of[x,x+t-2*e])this.b(sx,y+h-.04,z,2*e,.04,2*e,gold);
  if(h>.3)this.b(x+e,y+.1,z,2*e,2*e,e,gold);
 }
 /** Horizontal inset is exposed at the top; no wood layer covers the stone. */
 slab(x:number,y:number,z:number,w:number,h:number,d:number){
  const e=this.pitch,r=Math.max(.04,3*e),gold=this.s.bronze??this.s.metal;
  this.b(x,y,z,w,h,d,this.s.wood);
  this.b(x+r,y+e,z+r,w-2*r,h-e,d-2*r,this.s.wall);
  this.b(x+r,y+h-e,z+r,w-2*r,e,e,this.s.recess??this.s.stone);
  this.b(x+r,y+h-e,z+d-r-e,w-2*r,e,e,this.s.recess??this.s.stone);
  for(const sx of[x,x+w-r])for(const sz of[z,z+d-r]){
   this.b(sx,y,sz,r,h,r,this.s.metal);
   this.b(sx+e,y+h-2*e,sz+e,r-2*e,2*e,r-2*e,gold);
  }
 }
 /** Front faces point -Z. Framed panel with an actual recessed field and relief. */
 inset(x:number,y:number,z:number,w:number,h:number,d:number,face=this.s.wall,motif=false,materials?:{frame?:number;recess?:number}){
  const e=this.pitch,r=Math.max(.03,2*e),recess=materials?.recess??this.s.recess??this.s.stone;
  this.b(x,y,z,w,h,d,materials?.frame??this.s.wood);
  this.b(x+r,y+r,z,w-2*r,h-2*r,e,0);
  this.b(x+r,y+r,z+e,w-2*r,h-2*r,Math.max(e,d-e),recess);
  this.b(x+r+e,y+r+e,z+e,w-2*r-2*e,h-2*r-2*e,e,face);
  if(motif&&w>.22&&h>.35){
   const mw=Math.min(.19,w*.48),mh=mw,xx=x+(w-mw)/2,yy=y+h-mh-.09;
   this.b(xx-e,yy-e,z, mw+2*e,mh+2*e,e,recess);
   this.b(xx,yy,z,mw,mh,e,face);
   this.hui(xx+2*e,yy+2*e,z-e,mw-4*e,mh-4*e,recess,e);
  }
 }
 pull(x:number,y:number,z:number,w:number,h:number){
  const e=this.pitch,gold=this.s.bronze??this.s.wood;
  this.b(x-e,y-e,z+e,w+2*e,h+2*e,e,this.s.metal);
  this.b(x,y,z,w,h,e,gold);this.b(x+e,y+e,z,w-2*e,h-2*e,e,this.s.metal);
 }
 panel(x:number,y:number,z:number,w:number,h:number,d:number,m:number,trim=this.s.metal){
  this.b(x,y,z,w,h,d,m);const t=Math.max(this.pitch,.025);
  this.b(x,y,z-this.pitch,t,h,this.pitch,trim);this.b(x+w-t,y,z-this.pitch,t,h,this.pitch,trim);
  this.b(x,y,z-this.pitch,w,t,this.pitch,trim);this.b(x,y+h-t,z-this.pitch,w,t,this.pitch,trim);
  if(w>=.32&&h>=.24){
   // Corner saddles lock the inset panel into its carrier. These have depth,
   // shoulders and pins; changing base colour cannot remove their silhouette.
   const c=Math.max(.06,2*this.pitch),clip=this.s.metal,pin=this.s.bronze??clip;
   for(const sx of[x,x+w-c])for(const sy of[y,y+h-c]){
    this.b(sx,sy,z-2*this.pitch,c,t,this.pitch,clip);this.b(sx,sy,z-2*this.pitch,t,c,this.pitch,clip);
    this.b(sx+t,sy+t,z-2*this.pitch,this.pitch,this.pitch,this.pitch,pin);
   }
   if(m===this.s.wood&&w>=.5&&h>=.35){const mw=Math.min(.22,w*.25),mh=Math.min(.16,h*.28);this.hui(x+w/2-mw/2,y+h-mh-.055,z-this.pitch,mw,mh,this.s.woodEdge??this.s.wood);}
  }
 }
 feet(w:number,d:number,top:number,m=this.s.wood,t=.06,foot=this.s.wall){for(const x of[.04,w-t-.04])for(const z of[.04,d-t-.04]){
  this.b(x,0,z,t,top,t,m);this.b(x-.02,0,z-.02,t+.04,.04,t+.04,foot);
  this.b(x-.01,.04,z-.01,t+.02,.055,t+.02,this.s.metal);if(top>.16){this.b(x-.01,top-.08,z-.01,t+.02,.06,t+.02,this.s.metal);this.b(x,top-.06,z-.02,this.pitch,this.pitch,this.pitch,this.s.bronze??this.s.metal);}
 }}
 table(w:number,h:number,d:number,top=true,m=this.s.wood){
  const jointY=top?h-.05:h,apron=h<.5?.055:.07,leg=Math.max(.06,Math.min(.09,w*.07));
  this.part('束腰、插肩榫、阶梯牙头与金属脚套',()=>{
   this.feet(w,d,jointY,m,leg);
   for(const z of[.04,d-.09]){
    this.b(.04,jointY-apron,z,w-.08,apron,.05,m);
    for(const sign of[0,1])for(let k=0;k<3;k++){const x=sign?w-.13-(k+1)*.025:.1+k*.025;this.b(x,jointY-apron-.06+k*.02,z,.035,.06-k*.02,.05,m);}
    this.b(.14,jointY-.02,z-.005,w-.28,.01,.055,this.s.woodEdge??m);
   }
   for(const x of[.04,w-.09])this.b(x,jointY-apron,.04,.05,apron,d-.08,m);
  });
  if(top)this.part('攒边嵌芯桌面与锁固角件',()=>this.slab(0,h-.05,0,w,.05,d));
 }
 cabinet(w:number,h:number,d:number,columns=2,rows=3,doors=false,m=this.s.wood,materials?:{foot?:number;base?:number;edge?:number}){
  this.part('柜脚、框体与背板',()=>{this.feet(w,d,.12,m,.06,materials?.foot??this.s.wall);for(const x of[0,w-.04])this.b(x,.1,0,.04,h-.1,d,m);for(const y of[.1,h-.04])this.b(0,y,0,w,.04,d,m);this.b(0,.1,d-.03,w,h-.1,.03,m);});
  this.part('隔板与分格',()=>{for(let c=1;c<columns;c++)this.b(w*c/columns-.02,.14,.02,.04,h-.18,d-.04,m);for(let r=1;r<rows;r++)this.b(.04,.14+(h-.18)*r/rows,.02,w-.08,.025,d-.04,m);});
  if(doors)this.part('可分选柜门、嵌板和拉手',()=>{for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){const cw=(w-.08)/columns,rh=(h-.16)/rows,x=.04+c*cw,y=.12+r*rh;this.inset(x+.01,y+.01,-.025,cw-.02,rh-.02,.04,m===this.s.wood?this.s.wall:m);this.pull(x+cw/2-.045,y+rh*.5,-.045,.09,.04);}});
  this.part('承重边柱、退层柱帽、锁销及底座',()=>{
   for(const x of[0,w-.055])for(const z of[0,d-.055]){
    this.b(x,.09,z,.055,h-.09,.055,m);this.b(x-.015,h-.07,z-.015,.085,.045,.085,this.s.metal);this.b(x,h-.025,z,.055,.025,.055,this.s.bronze??m);
    if(z===0)for(const y of[.16,h-.16])this.b(x+.015,y,-.02,this.pitch,this.pitch,.025,this.s.bronze??this.s.metal);
   }
   this.b(.035,.075,.02,w-.07,.035,d-.04,materials?.base??this.s.stone);this.b(.05,h-.08,0,w-.1,.025,.035,materials?.edge??this.s.woodEdge??m);
  });
 }
 finish(id:string,name:string,source:Record<string,unknown>):Asset{
  const bounds=this.g.bounds();if(!bounds)throw new Error('Empty production recipe '+id);
  const min=bounds.min.map(n=>n*this.pitch) as V3,max=bounds.max.map(n=>n*this.pitch) as V3;
  return{id,name,version:1,category:'base',cellSize:this.pitch,origin:[0,0,0],chunks:this.g.serialize(),parts:[{id:'root',name:'整体',parent:null,region:bounds},...this.parts],openings:[],ports:[{id:'base',kind:'support',position:[min[0],min[1],min[2]],normal:[0,-1,0],size:[max[0]-min[0],0,max[2]-min[2]],pitch:this.pitch}],source};
 }
}
