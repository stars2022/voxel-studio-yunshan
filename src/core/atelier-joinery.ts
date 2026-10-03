import {Grid} from './grid';
import {connectedLine,voxelIndex} from './voxel-shapes';
import {eachCell,type Asset,type V3,type Bounds} from './types';

/** Authored joinery, in metres. Every rebate, socket and pin lives in the voxel grid. */
export function generateAtelierJoinery(id:string,name:string,type:string,dims:V3,s:number,m:Record<string,number>,style:string):Asset{
 const [W,H,D]=dims,q=(n:number)=>voxelIndex(n,s),snap=(n:number)=>q(n)*s,g=new Grid(),parts:Asset['parts']=[];
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:number)=>{const min:V3=[q(x),q(y),q(z)],max:V3=[q(x+w),q(y+h),q(z+d)];if(max.every((n,i)=>n>min[i]))eachCell({min,max},v=>g.set(v,mat));};
 const mark=(id:string,name:string,min:V3,max:V3)=>parts.push({id,name,parent:'root',region:{min:min.map(q) as V3,max:max.map(q) as V3}});
 const line=(a:V3,b:V3,mat:number)=>connectedLine(g,s,a,b,mat);
 const metalEdge=m.metalEdge??m.metal,stoneEdge=m.stoneEdge??m.wall,woodCross=m.woodCross??m.wood;
 let ports:Asset['ports'];
 if(type==='atelier-railing'){
  const n=Math.max(2,Math.round(W/.65)+1),post=snap(.12),cz=snap(D/2),railY=snap(H-.19),foot=snap(.08);
  const centers=Array.from({length:n},(_,k)=>snap(.1+k*(W-.2)/(n-1)));
  for(let k=1;k<n;k++){
   const x=centers[k-1]+post/2,w=centers[k]-post/2-x;
   // A broad gripping surface over a rebated timber section; end tenons enter steel sockets.
   box(x,railY,cz-.055,w,.07,.11,woodCross);
   box(x,railY+.07,cz-.045,w,s,.09,woodCross);
   box(x,railY+s,cz-.065,w,.04,s,m.woodCross??m.woodAlt);
   box(x,railY,cz-.025,w,s,.05,woodCross);
   box(x,.235,cz-.035,w,.06,.07,m.metal);
   box(x,.235,cz-.045,w,s,s,metalEdge);
  }
  for(let k=0;k<n;k++){
   const x=centers[k],f=cz-post/2;
   // Broad stone footing, bevelled top course and a narrow metal shoe.
   box(x-.10,0,cz-.10,.20,.045,.20,m.stone);
   box(x-.09,.045,cz-.09,.18,.025,.18,stoneEdge);
   box(x-.075,.07,cz-.075,.15,.04,.15,m.metal);
   box(x-post/2,foot,f,post,H-.15,post,m.metal);
   if(s<=.01)for(const xx of[x-post/2,x+post/2-s])for(const zz of[f,f+post-s])box(xx,.12,zz,s,H-.28,s,0);
   // A recessed face on every post, framed by the structural outer stiles.
   box(x-.04,.15,f,.08,H-.36,s,m.cavity);
   box(x-.03,.16,f,.06,H-.38,s,m.metal);
   box(x-.05,.12,f-s,s,H-.26,s,metalEdge);
   // Layered cap: neck, overhanging skirt, chamfered top and a small bronze fixing.
   box(x-.07,H-.15,cz-.07,.14,.03,.14,m.metal);
   box(x-.095,H-.12,cz-.095,.19,.045,.19,m.metal);
   box(x-.085,H-.075,cz-.085,.17,.025,.17,metalEdge);
   box(x-.075,H-.05,cz-.075,.15,.025,.15,m.metal);
   box(x-.025,H-.025,cz-.025,.05,s,.05,m.cavity);
   box(x-.015,H-s,cz-.015,.03,s,.03,m.bronze);
   for(const dir of[-1,1]){
    if(k===0&&dir===-1||k===n-1&&dir===1)continue;
    const sx=dir<0?x-post/2-s:x+post/2;
    box(sx,railY-.015,cz-.075,s,.12,.15,m.metal);
    box(sx,.215,cz-.055,s,.10,.11,m.metal);
    box(sx,railY+.015,cz-.075-s,s,.02,s,m.bronze);
   }
   for(const y of[.16,.32,H-.29]){
    box(x-.015,y,f-s,.03,.03,s,m.bronze);
    if(s<=.01)box(x-.005,y+.01,f-s,s,s,s,m.cavity);
   }
   if(k===0||k===n-1)for(let yy=.42;yy<H-.29;yy+=.145){
    box(x-.045,yy-.01,f-s,.09,.09,s,m.metal);
    box(x-.035,yy,f-s,.07,.07,s,m.glassTrim);
    box(x-.025,yy+.01,f-s,.05,.05,s,m.energy);
   }
  }
  mark('handrail','榫入木扶手 / 退底截面 / 铁套座',[0,railY-.02,0],[W,H-.13,D]);
  mark('posts','退面铁柱 / 分层柱帽 / 细铆钉',[0,.07,0],[W,H,D]);
  mark('feet','石脚 / 倒台 / 金属柱鞋',[0,0,0],[W,.12,D]);
  ports=[{id:'base',kind:'support',position:[0,0,0],normal:[0,-1,0],size:[W,0,D],pitch:s}];
 }else{
  const w=snap(W*.8),d=snap(D*.62),x=snap((W-w)/2),z=snap(.025),y=snap(H*.17),h=snap(H*.54),bar=Math.max(s,snap(.018));
  const top=y+h,cx=snap(W/2),cz=snap(z+d/2),plateY=snap(H*.7),plateH=snap(H-plateY),diffuser=m.diffuser??m.warm;
  // Four thin, inset paper panels; keep their centre completely hollow.
  box(x+bar,y,z+bar,w-2*bar,h,d-2*bar,diffuser);
  box(x+2*bar,y,z+2*bar,w-4*bar,h,d-4*bar,0);
  for(const xx of[x,x+w-bar])for(const zz of[z,z+d-bar]){
   box(xx,y,zz,bar,h,bar,m.bronze);
   if(s<=.01)box(xx,y,zz,s,h,s,m.amber);
  }
  for(const yy of[y,top-bar]){
   box(x,yy,z,w,bar,bar,m.bronze);box(x,yy,z+d-bar,w,bar,bar,m.bronze);
   box(x,yy,z,bar,bar,d,m.bronze);box(x+w-bar,yy,z,bar,bar,d,m.bronze);
  }
  // Thin corner fretwork, attached to the stiles and touching the diffuser plane.
  for(const upper of[false,true])for(const side of[-1,1]){
   const xx=side<0?x+bar:x+w-bar-s,yy=upper?top-3*bar:y+2*bar,dy=upper?-1:1,dx=-side;
   line([xx,yy,z],[xx+dx*bar*1.5,yy,z],m.bronze);
   line([xx+dx*bar*1.5,yy,z],[xx+dx*bar*1.5,yy+dy*bar*2,z],m.bronze);
   line([xx+dx*bar*1.5,yy+dy*bar*2,z],[xx,yy+dy*bar*2,z],m.bronze);
  }
  // The lamp source sits on the rear inner wall, not in the inspection cavity.
  box(cx-s,y+2*bar,z+d-2*bar,2*s,h-4*bar,s,m.warm);
  // Folded trays, raised ribs, narrow ventilation reveals and an interlocking cap.
  box(x-s,y-2*s,z-s,w+2*s,s,d+2*s,m.metal);
  box(x,y-s,z,w,s,d,m.bronze);
  box(x+s,y-3*s,z+s,w-2*s,s,d-2*s,m.bronze);
  box(cx-2*s,y-4*s,cz-2*s,4*s,s,4*s,m.bronze);
  box(cx-s,y-5*s,cz-s,2*s,s,2*s,m.bronze);
  box(cx-s/2,y-6*s,cz-s/2,s,s,s,m.amber);
  box(x,top,z,w,s,d,m.bronze);
  box(x+s,top+s,z+s,w-2*s,s,d-2*s,m.cavity);
  for(const xx of[x+s,x+w-2*s])box(xx,top+s,z+s,s,2*s,d-2*s,m.bronze);
  box(x-s,top+2*s,z-s,w+2*s,s,d+2*s,m.metal);
  box(x,top+3*s,z,w,s,d,metalEdge);
  box(x+s,top+4*s,z+s,w-2*s,s,d-2*s,m.bronze);
  // A small open suspension eye joins the cap to the arm; the triangular brace reaches the wall plate.
  const eyeBottom=top+5*s,eyeTop=Math.max(eyeBottom+3*s,H-3*s),eyeW=Math.max(3*s,snap(.045));
  box(cx-eyeW/2,eyeBottom,cz-s,eyeW,s,2*s,m.bronze);
  for(const xx of[cx-eyeW/2,cx+eyeW/2-s])box(xx,eyeBottom,cz-s,s,eyeTop-eyeBottom,2*s,m.bronze);
  box(cx-eyeW/2,eyeTop-s,cz-s,eyeW,s,2*s,m.bronze);
  box(cx-2*s,H-3*s,cz-2*s,4*s,2*s,D-cz+2*s,m.bronze);
  box(cx-3*s,plateY,D-2*s,6*s,plateH,2*s,m.metal);
  line([cx,plateY,D-2*s],[cx,H-3*s,cz+2*s],m.metal);
  for(const yy of[plateY+s,H-2*s])box(cx-s/2,yy,D-3*s,s,s,s,m.bronze);
  mark('bracket','墙座螺钉 / 斜撑悬臂 / 镂空吊环',[cx-3*s,plateY,cz-2*s],[cx+3*s,H,D]);
  mark('lantern','角柱与回纹 / 内退薄罩 / 透空内腔',[x-s,y-6*s,z-s],[x+w+s,top+5*s,z+d+s]);
  ports=[{id:'wall',kind:'wall-mount',position:[snap(cx-3*s),plateY,D],normal:[0,0,1],size:[6*s,plateH,0],pitch:s}];
 }
 const b=g.bounds()!;parts.unshift({id:'root',name,parent:null,region:b});
 return{id,name,version:1,category:'template',cellSize:s,origin:[0,0,0],chunks:g.serialize(),parts,ports,openings:[],template:{type,params:{width:W,height:H,depth:D},style},source:{reference:'用户提供的栏杆、灯笼构件及细节图',generatorRevision:3,method:'可编辑体素截面、镂空与接合结构；材质另行检查',assumptions:'单视图无法确认的背面和安装件采用明确的米制设计'}};
}
