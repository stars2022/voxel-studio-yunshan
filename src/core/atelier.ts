import {Grid} from './grid';
import {eachCell,type Asset,type Bounds,type Command,type Material,type V3} from './types';
import type {SurfaceKind} from './surface';
import {connectedLine,voxelIndex} from './voxel-shapes';

export const atelierCatalog={'atelier-bay':'精作 · 首层开间','atelier-railing':'精作 · 木扶手铁栏','atelier-planter':'精作 · 回纹花槽','atelier-lantern':'精作 · 挂灯笼'};
export function atelierStyleCommands(startId=101):Command[]{
 const defs:[string,string,string,number,number,SurfaceKind][]=[
  ['基座玄武石','stone','#596064',.87,.03,'stone'],
  ['暖白砂岩','stone','#c7beb0',.88,0,'stone'],
  ['深色榆木','wood','#63503e',.62,0,'wood'],
  ['铸铁窗框','metal','#414c50',.41,.62,'metal'],
  ['脊檩石墨','tile','#465057',.69,.08,'ceramic'],
  ['低饱和青玻璃','glass','#8fc5c2',.1,.08,'none'],
  ['砂岩亮面','stone','#dbd1bd',.82,0,'stone'],
  ['榆木亮棱','wood','#827057',.67,0,'wood'],
  ['青色扩散灯罩','emissive','#9cedef',.25,.03,'none'],
  ['琥珀扩散灯罩','emissive','#ffd399',.28,0,'none'],
  ['金属收边','metal','#78848a',.35,.72,'metal'],
  ['灰浆细缝','stone','#98978e',.96,0,'stone'],
  ['浅灰地砖','stone','#bdb8aa',.76,0,'stone'],
  ['地砖浅暖变体','stone','#ccc4b5',.83,0,'stone'],
  ['玄武石变体','stone','#73797a',.89,0,'stone'],
  ['檐砖变体','tile','#566169',.75,.1,'ceramic'],
  ['古铜五金','metal','#9b8052',.38,.68,'metal'],
  ['灯匣内腔','metal','#323b3d',.66,.22,'none'],
  ['玻璃窗边冷色镀层','metal','#526d72',.27,.62,'metal'],
  ['琥珀灯罩包边','ceramic','#c58a42',.47,.1,'ceramic'],
  ['深绿叶片','plant','#53673c',.94,0,'none'],
  ['嫩绿叶片','plant','#8f9d50',.92,0,'none'],
  ['金黄小花','plant','#dac777',.85,0,'none'],
  ['湿润栽培土','stone','#504331',1,0,'stone']
 ];
 const keys=['stone','wall','wood','metal','roof','glass','wallAlt','woodAlt','energy','warm','trim','mortar','floor','floorAlt','stoneAlt','roofAlt','bronze','cavity','glassTrim','amber','leaf','leafAlt','flower','soil'];
 const commands:Command[]=defs.map(([name,category,color,roughness,metalness,surface],i)=>{
  const id=startId+i,m:Omit<Material,'id'>={name,category,color,roughness,metalness,opacity:category==='glass'?.25:1,emissive:category==='emissive'?(i===8?'#42cddd':'#ffc27a'):'#000000',intensity:category==='emissive'?2.8:0,solid:category!=='glass',surface,surfaceScale:category==='wood'?.75:.45,surfaceStrength:category==='wood'?.45:.24};
  return{op:'material',id,properties:m};
 });
 commands.push({op:'style',id:'atelier',roles:Object.fromEntries(keys.map((k,i)=>[k,startId+i]))});return commands;
}

// A deliberately authored architectural cross-section. Every reveal, moulding, joint,
// fastener and light casing below is authoritative occupied grid data, not attached meshes.
export function generateAtelier(id:string,name:string,p:Record<string,number>,s:number,m:Record<string,number>,styleName='atelier'):Asset{
 if(Object.values(p).some(n=>!Number.isFinite(n)||n<0||n>50))throw new Error('精作参数须为 0–50 的有限数。');
 const q=(v:number)=>voxelIndex(v,s),snap=(v:number)=>q(v)*s;
 const W=snap(p.width??3.6),H=snap(p.height??3.2),D=snap(p.depth??1.2),ow=snap(p.openingWidth??1.24),oh=snap(p.openingHeight??2.24);
 if(W<2.8||W>5||H<2.9||H>4||D<.8||D>1.6||ow<.8||ow>W-1.5||oh<1.8||oh>H-.7)throw new Error('精作开间尺寸不兼容：宽 2.8–5m，高 2.9–4m，进深 0.8–1.6m，门洞须留出柱和过梁。');
 if(s>.04)throw new Error('精作开间需要不大于 0.04m 的格距，以保留窗框和接缝。');
 if(q(W+.04)*q(H+.04)*q(D+.04)>2_000_000)throw new Error('精作开间包围体超过 2,000,000 格，请增大格距或减小尺寸。');
 for(const key of ['stone','wall','wood','metal','glass','wallAlt','woodAlt','energy','warm','trim','mortar','floor','floorAlt','stoneAlt','roof','roofAlt','bronze','cavity','glassTrim','amber'])if(!m[key])throw new Error('精作开间需要 atelier 材质角色：'+key);
 const g=new Grid(),parts:Asset['parts']=[],base=snap(.24),face=snap(Math.max(D-.5,Math.min(.5,D-.3))),ox=snap((W-ow)/2),doorTop=base+oh,beam=H-.42;
 const woodCross=m.woodCross??m.wood;
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:number)=>{const min:V3=[q(x),q(y),q(z)],max:V3=[q(x+w),q(y+h),q(z+d)];if(max.every((n,i)=>n>min[i]))eachCell({min,max},v=>g.set(v,mat));};
 const region=(x:number,y:number,z:number,w:number,h:number,d:number):Bounds=>({min:[q(x),q(y),q(z)],max:[q(x+w),q(y+h),q(z+d)]});
 const part=(id:string,name:string,b:Bounds)=>parts.push({id,name,parent:'root',region:b});
 const masonry=(x:number,y:number,z:number,w:number,h:number,d:number,main:number,alt:number,bw=.28,bh=.24)=>{
  box(x,y,z,w,h,d,m.mortar);
  for(let row=0,yy=y;yy<y+h-s/2;row++,yy+=bh){for(let col=0,xx=x-(row%2&&w>bw*1.5?bw/2:0);xx<x+w-s/2;col++,xx+=bw){const left=Math.max(x,xx),ww=Math.min(xx+bw,x+w)-left,hh=Math.min(bh,y+h-yy),mat=(row*3+col*7)%11===2?alt:main;
   box(left+s/2,yy+s/2,z-s,ww-s/2,hh-s/2,Math.min(.06,d)+s,mat);
   box(left+s/2,yy+s/2,z+d-Math.min(.06,d),ww-s/2,hh-s/2,Math.min(.06,d),mat);
  }}
  for(let row=0,yy=y;yy<y+h-s/2;row++,yy+=bh)for(let zz=z;zz<z+d-s/2;zz+=bw){const hh=Math.min(bh,y+h-yy),dd=Math.min(bw,z+d-zz),mat=row%4===1?alt:main;box(x-s,yy+s/2,zz+s/2,s*2,hh-s/2,dd-s/2,mat);box(x+w-s,yy+s/2,zz+s/2,s,hh-s/2,dd-s/2,mat);}
 };
 // Ground course and thin top pavers, with mortar behind every joint.
 masonry(0,0,0,W,base-.04,D,m.stone,m.stoneAlt,.36,.16);
 box(0,base-.06,0,W,.06,D,m.mortar);
 for(let ix=0,x=0;x<W-s/2;x+=.36,ix++)for(let iz=0,z=0;z<D-s/2;z+=.36,iz++)box(x+s/2,base-.04,z+s/2,Math.min(.36,W-x)-s/2,.04,Math.min(.36,D-z)-s/2,(ix+iz*3)%5===0?m.floorAlt:m.floor);
 part('paving','薄地砖 / 实心灰浆 / 石基',region(0,0,0,W,base,D));
 // Masonry returns frame a real alcove. Front posts expose stone, timber, strap and lamp layers.
 for(const [x,sign]of [[.02,1],[W-.3,-1]]){
  masonry(x,base,face-.12,.28,H-base-.12,D-face+.12,m.wall,m.wallAlt,.28,.26);
  masonry(x-.02,base,face-.2,.32,.32,D-face+.2,m.stone,m.stoneAlt,.32,.16);
  const px=sign>0?x+.2:x-.08;
  box(px,.5,face-.19,.18,H-.65,.22,m.wood);
  box(px,.52,face-.21,.04,H-.75,.04,m.woodAlt);
  box(px+.15,.52,face-.21,.03,H-.75,.06,m.metal);
  for(const y of[.55,H-.6]){box(px-.02,y,face-.23,.23,.11,.28,m.metal);box(px+.07,y+.04,face-.25,.04,.04,s,m.bronze);}
  // Recessed vertical lantern: frame, shadow gap, amber diffuser rim and luminous core.
  const lx=px+.035,ly=.92;
  box(lx-.045,ly-.12,face-.26,.19,.86,.12,m.woodAlt);
  box(lx-.025,ly-.08,face-.29,.15,.78,.12,m.metal);
  box(lx,ly-.04,face-.31,.1,.7,.1,m.amber);
  box(lx+s,ly,face-.33,Math.max(s,.1-2*s),.62,s,m.warm);
  for(const yy of[ly+.08,ly+.5])box(lx+s,yy,face-.33,s,.04,s,m.amber);
  part(sign>0?'lamp-left':'lamp-right','实体灯匣与发光格',region(lx-.05,ly-.12,face-.34,.22,.87,.23));
  // Broad stone cap, narrow dark collar and a small gold pin. None are texture decals.
  box(x-.04,H-.17,face-.18,.36,.11,D-face+.2,m.wallAlt);
  box(x-.02,H-.06,face-.16,.32,.04,D-face+.18,m.wallAlt);
  box(x-.02,H-.24,face-.2,.32,.07,D-face+.22,m.metal);
  box(x-.035,H-.175,face-.2,.35,s,D-face+.22,m.trim);
  box(x+.1,H-.34,face-.23,.08,.1,.14,m.metal);box(x+.12,H-.32,face-.25,.04,.04,s,m.bronze);
  // A stepped entrance side block with a warm wayfinding inset.
  const sx=sign>0?.02:W-.36;
  box(sx,base,0,.34,.08,.36,m.wall);
  for(let step=0;step<4;step++){
   box(sx,base+.08,step*.085,.34,.04*(step+1),.085,m.wallAlt);
   box(sx+s,base+.08+.04*step,step*.085,.34-2*s,s,s,m.wall);
  }
  box(sx+.07,base+.035,-s,.2,.08,s,m.amber);box(sx+.1,base+.055,-2*s,.14,.04,s,m.warm);
 }
 part('piers','石柱 / 木柱 / 金属箍',region(0,base,face-.24,W,H-base,D-face+.26));
 // Layered lintel: stone-black brick course, timber soffit, slender metal drip and inset energy channel.
 masonry(.29,beam+.16,face-.12,W-.58,.26,.4,m.roof,m.roofAlt,.3,.13);
 // A stepped plaque with an occupied-cell key motif, attached to the front brick course.
 const plaqueX=snap(W/2-.2),plaqueY=snap(beam+.2),plaqueZ=snap(face-.12)-2*s;
 box(plaqueX,plaqueY,plaqueZ,.4,.14,2*s,m.trim);
 box(plaqueX+s,plaqueY+s,plaqueZ-s,.4-2*s,.14-2*s,s,m.metal);
 for(const offset of[.04,.2]){
  const path:V3[]=[[plaqueX+offset,plaqueY+s,plaqueZ-s],[plaqueX+offset,plaqueY+.1,plaqueZ-s],[plaqueX+offset+.1,plaqueY+.1,plaqueZ-s],[plaqueX+offset+.1,plaqueY+.04,plaqueZ-s],[plaqueX+offset+.06,plaqueY+.04,plaqueZ-s],[plaqueX+offset+.06,plaqueY+.06,plaqueZ-s]];
  for(let i=1;i<path.length;i++)connectedLine(g,s,path[i-1],path[i],m.trim);
 }
 box(.32,beam-.02,face-.18,W-.64,.18,.3,woodCross);
 box(.34,beam,face-.2,W-.68,.04,s,m.woodCross??m.woodAlt);
 box(.32,beam+.11,face-.22,W-.64,.04,.34,m.metal);
 box(.34,beam+.13,face-.22,W-.68,s,s,m.trim);
 box(.34,beam-.06,face-.22,W-.68,.045,.04,m.metal);
 box(.42,beam-.055,face-.23,W-.84,.02,s,m.energy);
 box(.4,beam-.15,face-.08,W-.8,.06,.11,m.cavity);
 for(const x of[.38,W-.62]){
  box(x,beam-.15,face-.17,.24,.17,.28,m.wood);box(x+.04,beam-.2,face-.12,.16,.09,.25,m.woodAlt);
  box(x+.02,beam-.07,face-.22,.20,.04,s,m.metal);
  for(const xx of[x+.04,x+.16])box(xx,beam-.06,face-.24,s,s,s,m.bronze);
 }
 part('lintel','砖檩 / 叠梁 / 内嵌线槽',region(.26,beam-.22,face-.25,W-.52,H-beam+.24,.55));
 // Recessed window section. Several narrow offsets replace the old single massive black frame.
 const frameZ=face+.08,post=.06;
 for(const [left,right]of [[.5,ox-.045],[ox+ow+.045,W-.5]]){
  const w=right-left;
  box(left-.04,base,frameZ+.03,w+.08,.08,.14,m.wallAlt);
  box(left,base+.08,frameZ,w,.045,.12,m.metal);
  box(left,base+.08,frameZ,post,beam-base-.11,.12,m.metal);
  box(right-post,base+.08,frameZ,post,beam-base-.11,.12,m.metal);
  box(left,beam-.08,frameZ,w,.05,.12,m.metal);
  box(left+post,base+.08,frameZ-s,w-2*post,s,s,m.trim);
  box(left+s,base+.11,frameZ-s,s,beam-base-.23,s,m.trim);
  box(right-2*s,base+.11,frameZ-s,s,beam-base-.23,s,m.glassTrim);
  if(p.glass!==0){
   box(left+post,base+.13,frameZ+.065,w-2*post,beam-base-.21,s,m.glass);
   // Corner inlays replace glass cells in the same plane. They are not floating line meshes.
   const paneLeft=q(left+post),paneRight=q(right-post)-1,paneBottom=q(base+.13),paneTop=q(beam-.1),z=q(frameZ+.065);
   const inset=Math.max(1,q(.04)),reach=Math.min(q(.12),Math.floor((paneRight-paneLeft)/3));
   for(const side of[-1,1])for(const upper of[false,true]){
    const xx=side<0?paneLeft+inset:paneRight-inset,yy=upper?paneTop-inset:paneBottom+inset,dy=upper?-1:1,dx=-side;
    for(let j=0;j<=reach;j++){if(g.get([xx+dx*j,yy,z])===m.glass)g.set([xx+dx*j,yy,z],m.energy);if(g.get([xx,yy+dy*j,z])===m.glass)g.set([xx,yy+dy*j,z],m.energy);}
    for(let j=0;j<=Math.max(1,reach-2);j++)if(g.get([xx+dx*2,yy+dy*(j+2),z])===m.glass)g.set([xx+dx*2,yy+dy*(j+2),z],m.glassTrim);
   }
  }
  // Glazing bead, transom and concealed cyan line all have independent cells.
  box(left+post,beam-.34,frameZ+.03,w-2*post,.025,.055,m.glassTrim);
  box(left+post,beam-.07,frameZ+.02,w-2*post,.02,.04,m.energy);
 }
 for(const x of[ox-.06,ox+ow]){
  box(x,base,frameZ-.02,.06,oh+.08,.16,m.metal);
  box(x+.02,base+.03,frameZ-.04,s,oh-.02,s,m.trim);
  // Two stand-offs support a handle with a genuine air gap behind the grip.
  for(const yy of[base+1.02,base+1.26])box(x+.02,yy,frameZ-.1,s,.04,.08,m.bronze);
  for(const yy of[base+1.0,base+1.26])box(x,yy,frameZ-.04,.06,.06,s,m.metal);
  box(x+.02,base+1.02,frameZ-.12,s,.28,s,m.bronze);
 }
 box(ox-.06,doorTop,frameZ-.02,ow+.12,.08,.16,m.metal);
 if(p.glass!==0)box(ox,doorTop+.08,frameZ+.065,ow,Math.max(0,beam-doorTop-.13),s,m.glass);
 box(ox+.05,doorTop+.04,frameZ-.04,ow-.1,s,s,m.energy);
 for(const x of[.06,W-.24]){
  box(x,base+.03,face-.235,.18,.18,.035,m.trim);box(x+.03,base+.06,face-.255,.12,.12,s,m.cavity);
  box(x+.07,base+.1,face-.275,.04,.04,s,m.bronze);
 }
 const openings=[region(ox,base,-.04,ow,oh,D+.08)];
 part('glazing','玻璃 / 压条 / 门框 / 五金',region(.44,base,frameZ-.1,W-.88,beam-base,.28));
 const b=g.bounds()!;parts.unshift({id:'root',name:'精作开间',parent:null,region:b});
 return{id,name,version:1,category:'template',cellSize:s,origin:[0,0,0],chunks:g.serialize(),parts,openings,template:{type:'atelier-bay',params:{width:W,height:H,depth:D,openingWidth:ow,openingHeight:oh,glass:p.glass===0?0:1},style:styleName},source:{reference:'庭院建筑模块图鉴-2.png / A05 / 用户补充开间近景',generatorRevision:3,method:'错缝砌石、分层柱帽、四级侧座、榫托和五金；材料方向与几何分开',assumptions:'实际尺寸与背面为设计假设，中心门保持开放'},ports:[{id:'left',kind:'edge',position:[0,0,0],normal:[-1,0,0],size:[0,H,D],pitch:s},{id:'right',kind:'edge',position:[W,0,0],normal:[1,0,0],size:[0,H,D],pitch:s},{id:'base',kind:'support',position:[0,0,0],normal:[0,-1,0],size:[W,0,D],pitch:s},{id:'top',kind:'support',position:[0,H,0],normal:[0,1,0],size:[W,0,D],pitch:s}]};
}
