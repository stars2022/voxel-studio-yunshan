import {filterParameters} from './template-parameters';
import {Grid} from './grid';
import {eachCell,type Asset,type Bounds,type V3} from './types';

// Image-guided, explicitly authored structures. Dimensions of unseen surfaces are design choices,
// not estimates recovered from pixels. Every feature below writes authoritative voxel IDs.
export const referenceCatalog = {
 'ref-roof':'A01 屋顶中段','ref-gable':'A02 山墙端段','ref-eave':'A03 直线檐口',
 'ref-eave-corner':'A04 飞檐转角','ref-bay':'A05 首层开间','ref-balcony':'A06 上层开间',
 'ref-bay-corner':'A07 转角开间','ref-solid-bay':'A08 实墙开间','ref-gateway':'A09 门楼框架',
 'ref-bridge':'A10 连桥直段','ref-bridge-corner':'A11 连廊转角','ref-plinth':'A12 台基模块'
};
export function generateReference(id:string,name:string,type:string,p:Record<string,number>,s:number,style:Record<string,number>,styleName:string):Asset{
 const defaults:Record<string,V3>={
  'ref-roof':[4,1.55,2.2],'ref-gable':[3.6,1.7,2.4],'ref-eave':[4,1.25,1.6],
  'ref-eave-corner':[2.6,1.55,2.6],'ref-bay':[3.6,3.2,1.1],'ref-balcony':[3.6,3.2,1.2],
  'ref-bay-corner':[3.6,3.2,3.6],'ref-solid-bay':[3.6,3.2,.6],'ref-gateway':[3.6,3.4,.7],
  'ref-bridge':[4,1.4,1.7],'ref-bridge-corner':[3.2,1.4,3.2],'ref-plinth':[4,.45,1.8]
 };
 for(const[k,v]of Object.entries(p)){
  if(!['width','height','depth','thickness','detail','openingWidth','openingHeight','sill','glass'].includes(k))throw new Error('未知图鉴模板参数 '+k);
  if(!Number.isFinite(v)||v<0||v>50)throw new Error('模板参数必须为 0–50 的有限数');
 }
 const q=(n:number)=>Math.round(n/s),snap=(n:number)=>q(n)*s;
 const [W,H,D]=defaults[type].map((v,i)=>snap(p[['width','height','depth'][i]]??v)) as V3;
 if(['ref-bay-corner','ref-bridge-corner','ref-eave-corner'].includes(type)&&Math.abs(W-D)>s*.01)throw new Error('当前转角模板仅支持等宽等深；不等臂请用独立直段拼装。');
 if(W<1||H<(type==='ref-plinth'?.2:1)||D<.3)throw new Error('图鉴组件尺寸过小，无法保留柱脚、层次与开口');
 if(q(W)*q(H)*q(D)>2_000_000)throw new Error('模板包围体超过 2,000,000 格，请增大格距');
 const t=snap(Math.max(s,p.thickness??.15)),detail=Math.max(1,Math.min(4,Math.round(p.detail??2)));
 const params:Record<string,number>={...p,width:W,height:H,depth:D,thickness:t,detail};
 const g=new Grid(),parts:Asset['parts']=[],openings:Bounds[]=[];
 const m:Record<string,number>={...style,mortar:style.mortar??style.stone,stoneAlt:style.stoneAlt??style.stone,wallAlt:style.wallAlt??style.wall,roofAlt:style.roofAlt??style.roof,trim:style.trim??style.metal,leafAlt:style.leafAlt??style.leaf};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:number)=>{
  const min:V3=[q(x),q(y),q(z)],max:V3=[q(x+w),q(y+h),q(z+d)];
  if(max.every((v,i)=>v>min[i]))eachCell({min,max},v=>g.set(v,mat));
 };
 const part=(id:string,name:string,x:number,y:number,z:number,w:number,h:number,d:number)=>parts.push({id,name,parent:'root',region:{min:[q(x),q(y),q(z)],max:[q(x+w),q(y+h),q(z+d)]}});
 const bricks=(x:number,y:number,z:number,w:number,h:number,d:number,mat:number,alt:number,bw=.4,bh=.25)=>{
  // Solid mortar core; recessed joints, not holes through a wall.
  box(x,y,z,w,h,d,mat===m.roof?m.metal:m.mortar);
  if(detail===1){box(x,y,z,w,h,d,mat);return;}
  for(let row=0,yy=y;yy<y+h-s/2;yy+=bh,row++)for(let xx=x-(row%2)*bw/2;xx<x+w-s/2;xx+=bw){
   const left=Math.max(x,xx),right=Math.min(x+w,xx+bw),top=Math.min(y+h,yy+bh),choose=(Math.round(xx/bw)+row)%5===0?alt:mat;
   box(left+s,yy+s,z,right-left-s,top-yy-s,Math.min(s*2,d),choose);
   box(left+s,yy+s,z+Math.max(0,d-s*2),right-left-s,top-yy-s,Math.min(s*2,d),choose);
  }
  // End faces carry the same bond, so turning a module does not expose a blank slab.
  for(let yy=y;yy<y+h-s/2;yy+=bh)for(let zz=z;zz<z+d-s/2;zz+=bw){const hh=Math.min(bh,h-(yy-y)),dd=Math.min(bw,d-(zz-z));box(x,yy+s,zz+s,Math.min(s,d),hh-s,dd-s,mat);box(x+w-s,yy+s,zz+s,s,hh-s,dd-s,mat);}
 };
 const paving=(x:number,y:number,z:number,w:number,h:number,d:number)=>{
  bricks(x,y,z,w,h,d,m.stone,m.stoneAlt,.5,.2);
  box(x,y+h-s,z,w,s,d,m.mortar);
  for(let xx=x;xx<x+w-s/2;xx+=.4)for(let zz=z;zz<z+d-s/2;zz+=.4)box(xx+s,y+h-s,zz+s,Math.min(.4,x+w-xx)-s,s,Math.min(.4,z+d-zz)-s,m.wallAlt);
 };
 const pillar=(x:number,y:number,z:number,w:number,h:number,d:number)=>{
  bricks(x,y,z,w,Math.min(.45,h),d,m.stone,m.stoneAlt,.25,.2);
  bricks(x+s,y+.4,z+s,w-2*s,h-.65,d-2*s,m.wall,m.wallAlt,.3,.25);
  box(x+.1,y+.4,z,w-.2,h-.7,s,m.wood);
  box(x,y+.4,z,w<.35?s:.1,h-.65,s,m.metal);box(x+w-.1,y+.4,z,.1,h-.65,s,m.metal);
  box(x+.1,y+.55,z-s,Math.max(s,w-.2),h-.9,s,m.trim);
  const lampY=y+.75,lampH=Math.min(.65,h*.24);
  box(x+w/2-.075,lampY-s,z-2*s,.15,lampH+2*s,2*s,m.metal);
  const lampW=Math.max(s,.075);box(x+w/2-lampW/2,lampY,z-2*s,lampW,lampH,s,m.warm);
  bricks(x-.025,y+h-.25,z-.025,w+.05,.25,d+.05,m.wall,m.wallAlt,.25,.25);
  box(x+w/2-s/2,y+h-.42,z-s,s,s,s,m.warm);
  if(detail>1){box(x+w/2-.075,y+.15,z-s,.15,.15,s,m.metal);box(x+w/2-.025,y+.2,z-s,.05,.05,s,m.trim);}
 };
 const rail=(x:number,y:number,z:number,w:number,h:number,d:number=.15)=>{
  box(x,y,z,w,.12,d,m.stone);box(x,y+h-.1,z,w,.1,d,m.metal);
  const n=Math.max(1,Math.round(w/.75));for(let i=0;i<n;i++){const lo=x+i*w/n,hi=x+(i+1)*w/n;box(lo,y,z,.1,h,d,m.metal);box(lo+.1,y+.15,z+d/2,hi-lo-.15,h-.3,s,m.glass);box(lo+.1,y+h-.2,z,hi-lo-.15,s,s,m.energy);}
  box(x+w-.1,y,z,.1,h,d,m.metal);
 };
 const planter=(x:number,y:number,z:number,w=.5,d=.45)=>{
  bricks(x,y,z,w,.45,d,m.wall,m.wallAlt,.25,.25);box(x+s,y+.4,z+s,w-2*s,s,d-2*s,m.soil);
  for(let k=0;k<7;k++){const xx=x+.1+((k*17)%7)/7*(w-.2),zz=z+.08+((k*13)%7)/7*(d-.16),hh=.15+(k%3)*.1;box(xx,y+.4,zz,s,hh,s,m.wood);box(xx-s,y+.4+hh,zz-s,3*s,.15,3*s,k%2?m.leaf:m.leafAlt);}
 };
 const bay=(width:number,height:number,depth:number,solid=false,balcony=false)=>{
  const base=.25,post=.45,wallZ=Math.max(.2,depth-.4),lintel=height-.45;
  paving(0,0,0,width,base,depth);pillar(0,base,wallZ,post,height-base,.35);pillar(width-post,base,wallZ,post,height-base,.35);
  box(post,lintel,wallZ,width-2*post,.35,.35,m.metal);box(post,lintel+.05,wallZ-s,width-2*post,.1,s,m.trim);
  box(post,lintel-.05,wallZ,width-2*post,s,s,m.energy);
  if(solid){
   bricks(post,base,wallZ+.1,width-2*post,lintel-base,.25,m.wall,m.wallAlt);
   const ow=snap(p.openingWidth??1),oh=snap(p.openingHeight??1.3),sill=snap(p.sill??1),ox=snap((width-ow)/2);
   if(ow>width-2*post-.2||oh>lintel-sill-.1||ow<.4||oh<.4)throw new Error('窗洞与墙柱不兼容');
   box(ox-.1,sill-.1,wallZ,ow+.2,oh+.2,.3,m.metal);box(ox,sill,wallZ,ow,oh,.4,0);
   for(let xx=ox+s;xx<ox+ow-s;xx+=.15)box(xx,sill,wallZ+.1,s,oh,s,m.metal);
   for(let yy=sill+s;yy<sill+oh-s;yy+=.2)box(ox,yy,wallZ+.1,ow,s,s,m.metal);
   openings.push({min:[q(ox),q(sill),q(wallZ+.2)],max:[q(ox+ow),q(sill+oh),q(wallZ+.35)]});
   Object.assign(params,{openingWidth:ow,openingHeight:oh,sill});
  }else{
   const ow=snap(p.openingWidth??1.4),oh=snap(p.openingHeight??2.25),ox=snap((width-ow)/2),doorTop=base+oh;
   if(ow<.6||ow>width-2*post-.3||oh<1.2||doorTop>lintel)throw new Error('门洞与边柱或过梁不兼容');
   for(const[a,b]of [[post+.1,ox-.1],[ox+ow+.1,width-post-.1]]){
    box(a,base,wallZ,b-a,.1,.15,m.metal);box(a,base,wallZ,.075,lintel-base,.15,m.metal);box(b-.075,base,wallZ,.075,lintel-base,.15,m.metal);
    if(p.glass!==0)box(a+.075,base+.1,wallZ+.1,b-a-.15,lintel-base-.2,s,m.glass);
   }
   box(ox-.1,base,wallZ,.1,doorTop-base,.2,m.metal);box(ox+ow,base,wallZ,.1,doorTop-base,.2,m.metal);box(ox-.1,doorTop,wallZ,ow+.2,.1,.2,m.metal);
   if(p.glass!==0)box(ox,doorTop+.1,wallZ+.1,ow,Math.max(0,lintel-doorTop-.15),s,m.glass);
   // The middle passage is deliberately open, not an opaque pane painted blue.
   openings.push({min:[q(ox),q(base),0],max:[q(ox+ow),q(doorTop),q(depth)]});
   Object.assign(params,{openingWidth:ow,openingHeight:oh,glass:p.glass===0?0:1});
   if(balcony){rail(.45,base,0,width-.9,.85);planter(.05,base,0);planter(width-.55,base,0);openings.length=0;}
  }
  part('posts','柱脚 / 石帽 / 灯具',0,0,wallZ-s,width,height,.5);part('infill','墙面与玻璃',post,base,wallZ,width-2*post,lintel-base,.35);part('lintel','承重过梁',post,lintel,wallZ,width-2*post,.35,.35);
 };
 const roofPlane=(x:number,z:number,w:number,d:number,base:number,rise:number,endRidges=true)=>{
  const tileW=snap(Math.max(.15,.4/detail)),tileD=snap(.4),thick=Math.max(s,t);
  // Each row overlaps the previous row. Channels, tile ends and stepped eaves are geometry.
  for(let xx=x;xx<x+w-s/2;xx+=tileW)for(let zz=z;zz<z+d-s/2;zz+=s){
   const progress=(zz-z)/Math.max(s,d-s),upturn=Math.max(0,1-progress*7)*.18,yy=snap(base+progress*rise+upturn),row=Math.floor((zz-z)/tileD),rib=0;
   box(xx,yy,zz,Math.min(tileW,w-(xx-x)),thick+rib,s,m.roof);
   if(detail>1){box(xx,yy+thick,zz,Math.min(s,tileW),s,s,m.roofAlt);if(q(zz-z)%Math.max(1,q(tileD))===0)box(xx,yy+thick-s,zz,Math.min(tileW,w-(xx-x)),s,s,m.roofAlt);}
  }
  box(x,base,z,w,.15,.15,m.trim);
  for(let xx=x+.1;xx<x+w-.1;xx+=.3){box(xx,base-.15,z+.1,.15,.15,.2,m.wood);box(xx,base-.2,z+.05,.1,s,.1,m.warm);}
  const ry=base+rise+.15;
  bricks(x,ry,z+d-.2,w,.2,.2,m.roof,m.roofAlt,.35,.2);box(x,ry-s,z+d-.225,w,s,s,m.energy);
  if(endRidges)for(const xx of[x,x+w-.15]){
   for(let zz=z;zz<z+d-s/2;zz+=.2){const u=(zz-z)/d,yy=snap(base+u*rise+.1+Math.max(0,1-u*5)*.2);box(xx,yy,zz,.15,.2,Math.min(.2,z+d-zz),m.roofAlt);}
   bricks(xx-.05,ry+.2,z+d-.25,.25,.3,.3,m.roof,m.roofAlt,.25,.15);box(xx,ry+.05,z+d-.26,s,.1,s,m.warm);
  }
 };
 if(['ref-bay','ref-balcony','ref-solid-bay'].includes(type))bay(W,H,D,type==='ref-solid-bay',type==='ref-balcony');
 else if(type==='ref-bay-corner'){
  // Two open glazed bays at right angles, one shared corner pier.
  bay(W,H,.65,false,false);const copy=[...g.cells()];const oldOpenings=structuredClone(openings);g.chunks.clear();for(const[v,mat]of copy)g.set([v[0],v[1],q(D-.65)+v[2]],mat);
  for(const[v,mat]of copy){const xx=q(W)-1-v[0],z=Math.round(xx*(D/W));g.set([q(W)-1-v[2],v[1],z],mat);}
  openings.length=0;for(const b of oldOpenings)openings.push({min:[b.min[0],b.min[1],b.min[2]+q(D-.65)],max:[b.max[0],b.max[1],b.max[2]+q(D-.65)]});
  planter(W-.55,.25,D-.55);parts.length=0;
 }else if(type==='ref-gateway'){
  const post=.55,base=.4,oh=snap(p.openingHeight??H-.7),ow=snap(p.openingWidth??W-2*post),x=snap((W-ow)/2);
  if(ow>W-1||ow<.8||oh<1.2||oh>H-.4)throw new Error('门楼净空或立柱尺寸无效');
  pillar(0,0,.1,x,H,D-.15);pillar(x+ow,0,.1,W-x-ow,H,D-.15);
  box(x,oh,.15,ow,H-oh-.15,D-.25,m.metal);box(x,oh+.1,.05,ow,.12,.1,m.wood);box(x+.2,oh+.15,0,ow-.4,s,s,m.warm);
  for(const px of[.05,W-.3]){box(px,.7,0,.25,H-1.25,.1,m.metal);box(px+s,.8,0,.25-2*s,H-1.45,s,m.energy);}
  openings.push({min:[q(x),0,0],max:[q(x+ow),q(oh),q(D)]});Object.assign(params,{openingWidth:ow,openingHeight:oh});part('lintel','门额过梁',x,oh,0,ow,H-oh,D);part('pillars','双柱与灯匣',0,0,0,W,H,D);
 }else if(['ref-roof','ref-eave'].includes(type)){
  roofPlane(.1,.1,W-.2,D-.2,.25,Math.max(.2,H-.95),type==='ref-roof');
  if(type==='ref-eave')for(const x of[0,W-.3])bricks(x,H-.45,D-.35,.3,.3,.35,m.wall,m.wallAlt,.3,.15);
  part('tiles','搭接瓦面',0,0,0,W,H,D);part('ridge','脊檩与线槽',0,H-.6,D-.4,W,.6,.4);
 }else if(type==='ref-gable'){
  const half=(W-.4)/2;
  // Generate two planes, then rotate their grid cells onto X slopes facing a central ridge.
  roofPlane(0,0,D,half,.2,Math.max(.3,H-.95),false);const cells=[...g.cells()];g.chunks.clear();for(const[v,mat]of cells){g.set([v[2]+q(.15),v[1],v[0]],mat);g.set([q(W-.15)-1-v[2],v[1],v[0]],mat);}
  box(W/2-.1,H-.5,0,.2,.2,D,m.roofAlt);box(W/2-.025,H-.55,0,.05,.05,D,m.energy);for(const z of[0,D-.25])bricks(W/2-.175,H-.3,z,.35,.3,.25,m.roof,m.roofAlt,.35,.15);
  // A stepped triangular infill carries the gable, leaving the lower underside open.
  for(let x=.25;x<W-.25;x+=s){const y=Math.max(.1,(1-Math.abs(x-W/2)/(W/2))*(H-.7));box(x,.15,D-.15,s,y,s,m.wall);}
 }else if(type==='ref-eave-corner'){
  roofPlane(0,0,W,D,.25,Math.max(.3,H-.9),false);const cells=[...g.cells()];for(const[v,mat]of cells){const pos:V3=[v[2],v[1],v[0]];if(pos[0]<q(W)&&pos[2]<q(D))g.set(pos,mat);}for(const x of[0,W-.25])bricks(x,H-.4,D-.25,.25,.4,.25,m.roof,m.roofAlt,.25,.2);
 }else if(['ref-bridge','ref-bridge-corner'].includes(type)){
  const deck=.4,railH=H-deck;
  if(type==='ref-bridge'){
   paving(0,0,0,W,deck,D);rail(.2,deck,.05,W-.4,railH);rail(.2,deck,D-.2,W-.4,railH);
   for(const x of[0,W-.25])for(const z of[0,D-.25])bricks(x,deck,z,.25,railH,.25,m.wall,m.wallAlt,.25,.3);
   box(.3,.1,0,W-.6,s,s,m.warm);box(.3,.1,D-s,W-.6,s,s,m.warm);
  }else{
   const arm=snap(Math.min(W,D)*.45);paving(0,0,0,W,deck,arm);paving(W-arm,0,arm,arm,deck,D-arm);
   rail(0,deck,0,W,railH);rail(0,deck,arm-.15,W-arm,railH);
   const scratch=new Grid();for(const[v,mat]of g.cells())if(v[1]>=q(deck))scratch.set(v,mat);
   for(const[v,mat]of scratch.cells()){const nv:V3=[q(W)-1-v[2],v[1],Math.round(v[0]*D/W)];g.set(nv,mat);}
   box(.15,.1,0,W-.3,s,s,m.warm);box(W-s,.1,.15,s,s,D-.3,m.warm);
  }
  part('deck','承重桥面',0,0,0,W,deck,D);part('rails','玻璃护栏',0,deck,0,W,railH,D);
 }else if(type==='ref-plinth')paving(0,0,0,W,H,D);
 const b=g.bounds();if(!b)throw new Error('组件未生成体素');
 const actual=b.max.map((n,i)=>n*s) as V3;
 parts.unshift({id:'root',name:'图鉴结构整体',parent:null,region:b});
 return{id,name,version:1,category:'template',cellSize:s,origin:[0,0,0],chunks:g.serialize(),parts,openings,template:{type,params:filterParameters(type,params),style:styleName},source:{reference:'庭院建筑模块图鉴-2.png',method:'人工解析参考图 → 参数化原生体素；非自动图像重建',assumptions:'米制尺寸、背面、承重厚度为显式设计；透明玻璃和发光是手工指定语义'},ports:[
  {id:'left',kind:'edge',position:[0,0,0],normal:[-1,0,0],size:[0,H,D],pitch:s},
  {id:'right',kind:'edge',position:[W,0,0],normal:[1,0,0],size:[0,H,D],pitch:s},
  {id:'base',kind:'support',position:[0,0,0],normal:[0,-1,0],size:[W,0,D],pitch:s},
  {id:'top',kind:'support',position:[0,actual[1],0],normal:[0,1,0],size:[W,0,D],pitch:s}
 ]};
}
