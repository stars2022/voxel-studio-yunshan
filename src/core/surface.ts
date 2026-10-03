export const surfaceKinds = ['none','stone','wood','metal','ceramic','fabric'] as const;
export type SurfaceKind = typeof surfaceKinds[number];
// Deterministic, tileable material detail. This is shading, never occupancy or geometry.
// Shared by the WebGL editor and GLB export; coordinates are in local metres.
export function surfacePixels(kind:SurfaceKind,strength=.35,size=128,seed=0){
 if(seed)return authoredSurface(kind,strength,size,seed);
 const albedo=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 const tau=Math.PI*2,hash=(x:number,y:number)=>{let v=Math.imul((x+17)^Math.imul(y+31,1597334677),3812015801);v^=v>>>16;return(v>>>0)/4294967295;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,n=hash(x,y),low=Math.sin(u*tau*5+Math.cos(v*tau*3))*.5+.5;
  let h=n;
  if(kind==='wood')h=.4+.25*Math.sin(u*tau*23+1.4*Math.sin(v*tau*2)+.5*Math.sin(u*tau*3))+.2*n+.1*low;
  else if(kind==='metal')h=.65*hash(x,0)+.35*n;
  else if(kind==='fabric')h=.5+.2*Math.cos(u*tau*32)+.2*Math.cos(v*tau*32)+.1*n;
  else if(kind==='ceramic')h=.65+.25*n+.1*low;
  else h=.5*n+.3*low+.2*Math.sin(v*tau*9)*Math.cos(u*tau*7);
  height[y*size+x]=h;
  const shade=Math.round(255*(1-strength*(1-h)*.36)),o=(y*size+x)*4;
  albedo.set([shade,shade,shade,255],o);
  const r=Math.round(255*(1-strength*.25*h));roughness.set([255,r,255,255],o);
 }
 const at=(x:number,y:number)=>height[((y+size)%size)*size+(x+size)%size];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(at(x+1,y)-at(x-1,y))*strength*.6,dy=(at(x,y+1)-at(x,y-1))*strength*.6,l=Math.hypot(dx,dy,1);
  normal.set([Math.round(127.5*(1-dx/l)),Math.round(127.5*(1-dy/l)),Math.round(127.5*(1+1/l)),255],(y*size+x)*4);
 }
 return{albedo,normal,roughness,size};
}

// Low frequency material structure + fine pores. No baked directional light,
// scratches at voxel boundaries, artificial bevels or geometry in these maps.
function authoredSurface(kind:SurfaceKind,strength:number,size:number,seed:number){
 const albedo=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 const wrap=(x:number,n:number)=>(x%n+n)%n;
 const hash=(x:number,y:number)=>{let n=Math.imul(x+seed*37,374761393)^Math.imul(y+seed*11,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
 const noise=(u:number,v:number,nx:number,ny=nx)=>{
  const x=u*nx,y=v*ny,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const at=(dx:number,dy:number)=>hash(wrap(ix+dx,nx),wrap(iy+dy,ny));
  return(at(0,0)*(1-sx)+at(1,0)*sx)*(1-sy)+(at(0,1)*(1-sx)+at(1,1)*sx)*sy;
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size,fine=hash(x,y),broad=noise(u,v,5),mid=noise(u,v,19);let h=.58*broad+.3*mid+.12*fine,shade=1-strength*(.04+.22*h),r=.94-.12*h;
  if(kind==='wood'){
   const warp=.035*Math.sin(v*Math.PI*2)+.025*(noise(u,v,3,3)-.5),grain=noise(u+warp,v,48,3),pores=Math.max(0,noise(u+warp,v,87,5)-.63);
   h=.56*grain+.29*noise(u+warp,v,16,2)+.15*fine;
   shade=1-strength*(.03+.36*grain+.6*pores);r=.92-.22*grain;
  }else if(kind==='metal'){
   h=.16*noise(u,v,71,2)+.1*fine;shade=1-strength*(.035+.13*fine);r=.91-.13*noise(u,v,32,3);
  }else if(kind==='fabric'){
   h=.45+.16*Math.sin(u*Math.PI*64)+.16*Math.sin(v*Math.PI*64)+.1*fine;shade=1-strength*(.12+.17*h);r=.97;
  }else if(kind==='ceramic'){
   h=.12*mid+.04*fine;shade=1-strength*(.04+.14*broad);r=.96-.12*mid;
  }else{
   const pore=Math.max(0,(fine-.94)/.06)*.25;
   h+=pore;shade=1-strength*(.03+.28*h+pore*.35);r=.97-.1*mid;
  }
  height[y*size+x]=h;const shade8=Math.round(Math.max(0,Math.min(1,shade))*255),o=(y*size+x)*4;
  albedo.set([shade8,shade8,shade8,255],o);roughness.set([255,Math.round(r*255),255,255],o);
 }
 const at=(x:number,y:number)=>height[wrap(y,size)*size+wrap(x,size)];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const amplitude=kind==='metal'?.11:kind==='wood'?.25:.35,dx=(at(x+1,y)-at(x-1,y))*strength*amplitude,dy=(at(x,y+1)-at(x,y-1))*strength*amplitude,len=Math.hypot(dx,dy,1);
  normal.set([Math.round(127.5*(1-dx/len)),Math.round(127.5*(1-dy/len)),Math.round(127.5*(1+1/len)),255],(y*size+x)*4);
 }
 return{albedo,normal,roughness,size};
}
