import {Grid} from './grid';
import {connectedLine,bladeLeaf,voxelIndex} from './voxel-shapes';
import {eachCell,type Asset,type V3,type Bounds} from './types';

// Author a vessel section and individual branched plants in metres. All detail is
// occupied cells or explicit empty space; the render mesh contains no decorations.
export function generateAtelierPlanter(id:string,name:string,p:Record<string,number>,dims:V3,s:number,m:Record<string,number>,style:string):Asset{
 const [W,H,D]=dims,q=(n:number)=>voxelIndex(n,s),snap=(n:number)=>q(n)*s,g=new Grid(),parts:Asset['parts']=[];
 const pot=snap(H*.46),wall=snap(.065),soil=snap(pot-.08),detail=Math.max(1,Math.min(4,Math.round(p.detail??2)));
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:number)=>{
  const min:V3=[q(x),q(y),q(z)],max:V3=[q(x+w),q(y+h),q(z+d)];
  if(max.every((n,i)=>n>min[i]))eachCell({min,max},v=>g.set(v,mat));
 };
 const line=(a:V3,b:V3,mat:number)=>connectedLine(g,s,a,b,mat);
 const part=(id:string,name:string,min:V3,max:V3)=>parts.push({id,name,parent:'root',region:{min:min.map(q) as V3,max:max.map(q) as V3}});
 const ring=(inset:number,y:number,height:number,thickness:number,mat:number)=>{
  box(inset,y,inset,W-2*inset,height,D-2*inset,mat);
  box(inset+thickness,y,inset+thickness,W-2*(inset+thickness),height,D-2*(inset+thickness),0);
 };
 // Foot, recessed neck, tapering wall, undercut lip and a subtly stepped cap.
 box(.01,0,.01,W-.02,.04,D-.02,m.stone);
 box(.025,.04,.025,W-.05,.03,D-.05,m.stone);
 for(let y=.06;y<pot-.055;y+=s){
  const inset=snap(.025-.015*(y-.06)/(pot-.115));
  box(inset,y,inset,W-2*inset,Math.min(s,pot-.055-y),D-2*inset,m.wall);
 }
 box(wall,.07,wall,W-2*wall,pot,D-2*wall,0);
 box(wall,.035,wall,W-2*wall,soil-.035,D-2*wall,m.soil);
 ring(.015,pot-.065,.03,.06,m.wall);
 ring(0,pot-.035,.025,.075,m.wallAlt);
 ring(.01,pot-.01,.01,.065,m.wallAlt);
 // All panel borders attach to a solid return. Small recesses make the section legible.
 const panelY=.105,panelH=pot-.235,icon=snap(Math.min(.205,panelH+.04)),iconX=snap((W-icon)/2),iconY=snap(.115);
 box(.055,panelY-.015,0,W-.11,panelH+.05,.04,m.wall);
 for(const [x,w] of [[.06,iconX-.085],[iconX+icon+.035,W-iconX-icon-.095]]){
  box(x,panelY,0,w,panelH,.02,m.wallAlt);
  box(x+.015,panelY+.015,0,w-.03,panelH-.03,s,m.wall);
  for(const xx of[x,x+w-s])box(xx,panelY,-s,s,panelH,s,m.wallAlt);
  for(const yy of[panelY,panelY+panelH-s])box(x,yy,-s,w,s,s,m.wallAlt);
 }
 box(iconX-.02,iconY-.02,-s,icon+.04,icon+.04,2*s,m.wallAlt);
 box(iconX-.01,iconY-.01,-s,icon+.02,icon+.02,s,m.wall);
 const motif=[[0,0],[0,12],[12,12],[12,0],[4,0],[4,8],[8,8],[8,4]],u=icon*.66/12,pad=icon*.17;
 for(let i=1;i<motif.length;i++)line([iconX+pad+motif[i-1][0]*u,iconY+pad+motif[i-1][1]*u,-2*s],[iconX+pad+motif[i][0]*u,iconY+pad+motif[i][1]*u,-2*s],m.wallAlt);
 // Long returns and tiny mitres, visible from either side of the freestanding planter.
 for(const yy of[.085,pot-.105])box(.045,yy,0,W-.09,s,s,m.wallAlt);
 for(const xx of[.035,W-.045])box(xx,.08,0,s,pot-.18,.035,m.wallAlt);
 // The same fitted-panel construction continues around the rear and both ends.
 const borderY=.11,borderH=pot-.23;
 box(.06,borderY,D-.02,W-.12,borderH,.02,m.wallAlt);
 box(.06+s,borderY+s,D-s,W-.12-2*s,borderH-2*s,s,m.wall);
 for(const xx of[0,W-s]){
  box(xx,borderY,.07,s,borderH,D-.14,m.wallAlt);
  box(xx,borderY+s,.07+s,s,borderH-2*s,D-.14-2*s,m.wall);
 }
 part('vessel','叠层口沿 / 退进面板 / 回纹 / 内壁与土层',[0,0,-2*s],[W,pot,D]);

 const rand=(i:number)=>{const n=Math.sin(i*117.37+73.91)*43758.5453;return n-Math.floor(n);};
 const lerp=(a:V3,b:V3,t:number):V3=>a.map((n,i)=>n+(b[i]-n)*t) as V3;
 const curve=(a:V3,b:V3,c:V3,t:number):V3=>a.map((n,i)=>(1-t)**2*n+2*t*(1-t)*b[i]+t*t*c[i]) as V3;
 const branch=(a:V3,b:V3,c:V3,mat:number)=>{
  const count=Math.max(3,Math.ceil((Math.hypot(...b.map((v,i)=>v-a[i]))+Math.hypot(...c.map((v,i)=>v-b[i])))/(s*.7)));
  let last=a;for(let i=1;i<=count;i++){const next=curve(a,b,c,i/count);line(last,next,mat);last=next;}
 };
 const shades=[m.leaf,m.leaf,m.leafMid??m.leaf,m.leafMid??m.leaf,m.leafAlt];
 const leaf=(base:V3,len:number,a:number,tilt:number,seed:number,young=false)=>bladeLeaf(g,s,base,len,len*(.38+rand(seed+17)*.2),a,tilt,young?(m.leafYoung??m.leafAlt):shades[Math.floor(rand(seed+3)*shades.length)],.004+rand(seed+11)*.006);
 const canopy=H-pot-.07,scale=Math.min(1,W/1.2,D/.6),blooms:{p:V3;angle:number;radius:number}[]=[],budSites:V3[]=[];
 // Deliberately staggered masses: low front leaves, taller back foliage and uneven gaps.
 const layout=[[.14,.25,.67],[.30,.68,.88],[.46,.25,.73],[.58,.70,.83],[.75,.32,.98],[.89,.72,.76]];
 const clumps=Math.max(3,Math.round(W/.135));
 for(let c=0;c<clumps;c++){
  const l=layout[c%layout.length],cx=wall+(.04+(c+.5)/clumps*.92)*(W-2*wall),cz=wall+l[1]*(D-2*wall),seed=97*c+13;
  const base:V3=[cx,soil-s,cz],height=canopy*l[2];
  const top:V3=[cx+(rand(seed)-.5)*.08*scale,soil+height*.74,cz+(rand(seed+1)-.5)*.05*scale];
  const knee:V3=[cx+(top[0]-cx)*.18,soil+height*.3,cz+(top[2]-cz)*.25];
  branch(base,knee,top,m.wood);
  const shoots=6+detail;
  for(let k=0;k<shoots;k++){
   const angle=k*2.399963+c*.87+(rand(seed+k+22)-.5)*.45,t=.18+k*.56/shoots;
   const start=curve(base,knee,top,t),reach=(.12+rand(seed+k+5)*.065)*scale;
   const tip:V3=[Math.max(wall*.8,Math.min(W-wall*.8,start[0]+Math.cos(angle)*reach)),soil+height*(.59+rand(seed+k+8)*.49),Math.max(wall*.8,Math.min(D-wall*.8,start[2]+Math.sin(angle)*reach))];
   const control:V3=[start[0]+(tip[0]-start[0])*.62,start[1]+(tip[1]-start[1])*.32,start[2]+(tip[2]-start[2])*.6];
   branch(start,control,tip,m.leafMid??m.leaf);
   for(let j=0;j<3+detail;j++){
    const tt=.17+j*.77/(3+detail),at=curve(start,control,tip,tt),len=(.042+rand(seed+k*31+j*7)*.033)*scale;
    // Opposite and alternate leaves share a twig, with decreasing size near the tip.
    const side=j%2?1:-1,a=angle+side*(.65+rand(seed+j+44)*.55),tilt=-.18+rand(seed+k*11+j)*.75;
    leaf(at,len*(1-tt*.24),a,tilt,seed+k*23+j);
    if(j<2+detail)leaf(at,len*.82,angle-side*1.02,tilt*.65,seed+k*19+j+200);
   }
   leaf(tip,.052*scale,angle,.42,seed+k+500,true);
  }
  // Fine flowering stems rise out of the foliage; not every upright ends in a flower.
  const heads=c%3===0?2:1;
  for(let k=0;k<heads;k++){
   const a=rand(seed+k+70)*Math.PI*2,from=curve(base,knee,top,.45),fy=soil+canopy*(.64+rand(seed+k+74)*.29);
   const tip:V3=[Math.max(.08,Math.min(W-.08,cx+Math.cos(a)*.07)),fy,Math.max(.08,Math.min(D-.08,cz+Math.sin(a)*.065))];
   const bend=lerp(from,tip,.55);bend[0]+=(rand(seed+k+81)-.5)*.055;branch(from,bend,tip,m.leafMid??m.leaf);
   for(const t of[.23,.43,.65])leaf(curve(from,bend,tip,t),.041*scale,a+t*5,.4,seed+k+700);
   if((c+k)%5===2)budSites.push(tip);else blooms.push({p:tip,angle:a,radius:(.025+rand(seed+k+83)*.008)*scale});
  }
 }
 // Draw petals last so neighbouring leaves do not erase a flower head.
 for(const {p,angle,radius} of blooms){
  for(let k=0;k<5;k++)bladeLeaf(g,s,p,radius,.019*scale,angle+k*Math.PI*2/5,.04,m.flowerPetal??m.flower,.003);
  const v=p.map(q) as V3;g.set(v,m.amber);g.set([v[0],v[1]+1,v[2]],m.flower);
 }
 for(const p of budSites){const v=p.map(q) as V3;g.set(v,m.flower);g.set([v[0],v[1]+1,v[2]],m.flower);}
 const foliageBounds:Bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 for(const [v] of g.cells())if(v[1]>=q(soil))for(let d=0;d<3;d++){foliageBounds.min[d]=Math.min(foliageBounds.min[d],v[d]);foliageBounds.max[d]=Math.max(foliageBounds.max[d],v[d]+1);}
 parts.push({id:'planting',name:'弯曲主枝 / 分叉细枝 / 薄叶 / 花序',parent:'root',region:foliageBounds});
 const b=g.bounds()!;parts.unshift({id:'root',name,parent:null,region:b});
 return{id,name,version:1,category:'template',cellSize:s,origin:[0,0,0],chunks:g.serialize(),parts,openings:[],template:{type:'atelier-planter',params:{width:W,height:H,depth:D,detail},style},source:{reference:'用户提供的花槽细节与四构件参考图',generatorRevision:3,method:'真实体素截面、曲线分枝、单层渐尖叶片和独立花序；基础色检查',assumptions:'尺寸及背面为米制设计；每个格子可编辑，不依赖贴图或装饰网格'},ports:[{id:'base',kind:'support',position:[0,0,0],normal:[0,-1,0],size:[W,0,D],pitch:s}]};
}
