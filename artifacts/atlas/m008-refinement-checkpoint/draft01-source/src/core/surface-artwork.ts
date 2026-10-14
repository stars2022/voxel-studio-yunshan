import type {Material} from './types';
import {surfacePixels} from './surface';

/** Authored pigment/display artwork, saved as a purpose-aware recipe, never a baked render. */
export type SurfaceArtwork={version:1;design:'finance-v1'|'energy-v1'|'notice-v1'|'verify-v1'|'parcel-v1'|'lesson-v1'|'landscape-v1'|'book-v1'|'control-v1';width:1024;height:768;sizeM:[number,number];materials:{ground:number;motif:number;detail:number}};
export function validateSurfaceArtwork(d:SurfaceArtwork,materials?:Record<string,Material>){
 if(!d||d.version!==1||!['finance-v1','energy-v1','notice-v1','verify-v1','parcel-v1','lesson-v1','landscape-v1','book-v1','control-v1'].includes(d.design)||d.width!==1024||d.height!==768||!Array.isArray(d.sizeM)||d.sizeM.length!==2||d.sizeM.some(v=>!Number.isFinite(v)||v<=0||v>10)||!d.materials||Object.keys(d.materials).length!==3||!['ground','motif','detail'].every(k=>Number.isInteger(d.materials[k as 'ground'])&&d.materials[k as 'ground']>0&&d.materials[k as 'ground']<=65535)||new Set(Object.values(d.materials)).size!==3)throw Error('无效纸面/显示图形描述或独立用途映射');
 if(materials){const ms=Object.values(d.materials).map(id=>materials[id]),display=['finance-v1','energy-v1','notice-v1','verify-v1','parcel-v1','lesson-v1','control-v1'].includes(d.design),categories=display?['metal','emissive','emissive']:['paper','ink','ink'];if(ms.some((m,i)=>!m||m.category!==categories[i]||m.intensity!==0))throw Error('图形必须采用实际独立纸/油墨或显示底面/像素用途，并保持零发光');}
}
export function surfaceArtworkSignature(d:SurfaceArtwork,materials:Record<string,Material>){return JSON.stringify([d,Object.values(d.materials).map(id=>materials[id])]);}

/** UV starts at the lower left. The short notice title is authored from the reference; no live data, prices, codes or medical states. */
export function surfaceArtworkPixels(d:SurfaceArtwork,materials:Record<string,Material>){
 validateSurfaceArtwork(d,materials);const W=d.width,H=d.height,N=W*H,rolePixels=new Uint8Array(N),coverage=new Float32Array(N);
 const mark=(x:number,y:number,r:number,a=1)=>{if(x<0||y<0||x>=W||y>=H)return;const k=y*W+x;rolePixels[k]=r;coverage[k]=a;};
 const rect=(x:number,y:number,w:number,h:number,r=1,a=1)=>{for(let yy=Math.max(0,Math.floor(y*H));yy<Math.min(H,Math.ceil((y+h)*H));yy++)for(let xx=Math.max(0,Math.floor(x*W));xx<Math.min(W,Math.ceil((x+w)*W));xx++)mark(xx,yy,r,a);};
 const line=(ax:number,ay:number,bx:number,by:number,t=.002,r=1,a=1)=>{const x0=ax*W,y0=ay*H,dx=(bx-ax)*W,dy=(by-ay)*H,l=dx*dx+dy*dy,rad=t*W/2;for(let y=Math.max(0,Math.floor(Math.min(ay,by)*H-rad-1));y<Math.min(H,Math.ceil(Math.max(ay,by)*H+rad+1));y++)for(let x=Math.max(0,Math.floor(Math.min(ax,bx)*W-rad-1));x<Math.min(W,Math.ceil(Math.max(ax,bx)*W+rad+1));x++){const f=l?Math.max(0,Math.min(1,((x+.5-x0)*dx+(y+.5-y0)*dy)/l)):0,dist=Math.hypot(x+.5-x0-f*dx,y+.5-y0-f*dy),c=Math.max(0,Math.min(1,rad+.65-dist));if(c>0)mark(x,y,r,a*c);}};
 const frame=(x:number,y:number,w:number,h:number,t=.002,r=1,a=1)=>{line(x,y,x+w,y,t,r,a);line(x+w,y,x+w,y+h,t,r,a);line(x+w,y+h,x,y+h,t,r,a);line(x,y+h,x,y,t,r,a);};
 const circle=(x:number,y:number,rx:number,ry=rx,t=.002,r=1,a=1)=>{for(let j=0;j<80;j++){const aa=j*Math.PI/40,bb=(j+1)*Math.PI/40;line(x+rx*Math.cos(aa),y+ry*Math.sin(aa),x+rx*Math.cos(bb),y+ry*Math.sin(bb),t,r,a);}};
 const cube=(x:number,y:number,s:number)=>{const points:[[number,number],[number,number]][]=[[[x,y+s],[x-s,y+s*.5]],[[x-s,y+s*.5],[x,y]],[[x,y],[x+s,y+s*.5]],[[x+s,y+s*.5],[x,y+s]],[[x-s,y+s*.5],[x-s,y-s*.65]],[[x+s,y+s*.5],[x+s,y-s*.65]],[[x-s,y-s*.65],[x,y-s*1.15]],[[x+s,y-s*.65],[x,y-s*1.15]],[[x,y],[x,y-s*1.15]]];for(const[a,b]of points)line(...a,...b,.004);line(x-s*.55,y+s*.78,x+s*.43,y+s*.29,.002,2);};
 if(['finance-v1','energy-v1','notice-v1','verify-v1','parcel-v1','lesson-v1','control-v1'].includes(d.design)){
  frame(.028,.034,.944,.932,.003);frame(.037,.047,.926,.906,.001,2,.6);
  for(const[x,y]of[[.035,.045],[.035,.93],[.915,.045],[.915,.93]]){line(x,y,x+.045,y,.005,2);line(x,y,x,y+.024,.005,2);}
  if(d.design==='finance-v1'){
   for(let j=0;j<5;j++)line(.17,.21+j*.125,.77,.21+j*.125,.001,1,.25);for(let j=0;j<9;j++)line(.17+j*.075,.21,.17+j*.075,.71,.001,1,.20);
   const heights=[.10,.17,.12,.24,.30,.22,.42,.32,.46,.57,.39,.52,.64,.58,.79,.72,.89,.80];for(let j=0;j<heights.length;j++)rect(.185+j*.0305,.22,.019,.47*heights[j],j%3===0?2:1,.7);
   for(let j=0;j<heights.length-1;j++)line(.194+j*.0305,.29+heights[j]*.48,.194+(j+1)*.0305,.29+heights[j+1]*.48,.003,2);
   for(let j=0;j<4;j++){frame(.065,.25+j*.145,.06,.068,.002);rect(.077,.269+j*.145,.015,.036,2);rect(.097,.276+j*.145,.017,.012);circle(.865,.30+j*.155,.041,.051,.002);line(.85,.30+j*.155,.88,.30+j*.155,.003,2);}
   for(let j=0;j<5;j++)rect(.20+j*.12,.11,.078-j*.004,.012,j%2?1:2,.85);rect(.20,.82,.34,.028,2);rect(.20,.866,.18,.014);rect(.61,.82,.14,.065,1,.35);
  }else if(d.design==='energy-v1'){
   circle(.32,.62,.165,.24,.003);circle(.32,.62,.14,.203,.001,2,.65);circle(.32,.62,.023,.034,.003,2);for(let j=0;j<8;j++){const a=j*Math.PI/4,x=.32+.14*Math.cos(a),y=.62+.203*Math.sin(a);line(.32,.62,x,y,.002);circle(x,y,.014,.021,.002,2);line(x,y,x+.017*Math.cos(a),y+.025*Math.sin(a),.004,2);}for(let j=0;j<7;j++){frame(.57,.37+j*.075,.034,.042,.002);rect(.635,.385+j*.075,.23-j%3*.027,.008,2);rect(.635,.405+j*.075,.11+j%3*.021,.004,1,.6);}for(let j=0;j<22;j++){const h=.037+.055*(1+Math.sin(j*2.3))+.005*j;rect(.13+j*.034,.125,.020,h,j%5?1:2,.8);if(j)line(.14+(j-1)*.034,.16+.065*(1+Math.sin((j-1)*.7)),.14+j*.034,.16+.065*(1+Math.sin(j*.7)),.002,2);}line(.10,.105,.91,.105,.002);
  }else if(d.design==='notice-v1'){
   // Static civic icon, the source sheet's short announcement title and cards.
   line(.08,.64,.185,.78,.008,2);line(.185,.78,.29,.64,.008,2);line(.065,.63,.305,.63,.008,2);line(.08,.40,.29,.40,.008,2);for(const x of[.095,.154,.215,.275])rect(x,.415,.012,.20,2);
   for(const[a,b,c,e]of[[.36,.90,.32,.84],[.41,.90,.45,.84],[.38,.848,.346,.787],[.346,.787,.426,.787],[.415,.814,.435,.780],[.52,.90,.497,.87],[.499,.872,.579,.872],[.54,.906,.54,.838],[.492,.838,.587,.838]])line(a,b,c,e,.006,2);frame(.510,.787,.060,.035,.006,2);
   for(let j=0;j<3;j++){const x=.35+j*.20,y=.24+j*.035;rect(x,y,.164,.425,2,.95);rect(x+.038,y+.397,.090,.027,1);for(let k=0;k<7;k++)rect(x+.018,y+.033+k*.044,.126-(k%3)*.017,.006,0);line(x+.018,y+.35,x+.145,y+.35,.002,1);}for(let j=0;j<7;j++){const x=.07+j*.126,h=.025+.023*(j%3);rect(x,.10,.067,h,1,.55);line(x,.10+h,x+.04,.13+h,.002,1,.6);}line(.065,.176,.92,.176,.001,2,.6);
  }else if(d.design==='verify-v1'){
   // Author portrait and tick, without identity or voting state.
   for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(((x/W-.50)/.092)**2+((y/H-.67)/.135)**2<=1)mark(x,y,1);for(let j=0;j<100;j++){const y=.33+j*.0019,w=.30-.12*(j/99)**1.7;rect(.50-w/2,y,w,.0022,1);}frame(.16,.10,.68,.14,.003,2);line(.22,.172,.284,.133,.012,2);line(.284,.133,.396,.215,.012,2);for(let j=0;j<3;j++)rect(.48,.137+j*.038,.26-j*.041,.009,2,.9);frame(.19,.295,.62,.58,.002,1,.35);
  }else if(d.design==='parcel-v1'){
   cube(.47,.65,.23);for(let j=0;j<3;j++){frame(.15,.14+j*.09,.04,.04,.002);line(.16,.16+j*.09,.178,.175+j*.09,.004,2);rect(.24,.154+j*.09,.51-j*.065,.009,2);rect(.24,.176+j*.09,.20+j*.05,.006,1,.65);}rect(.15,.87,.40,.015,2);rect(.66,.87,.13,.015);frame(.83,.26,.06,.56,.002);for(let j=0;j<6;j++)rect(.845,.29+j*.079,.03,.03,j%2?2:1,.75);
  }else if(d.design==='lesson-v1'){
   for(let j=0;j<3;j++){const y=.20+j*.17,w=.38-j*.072,x=.29-w/2;frame(x+.035,y,w-.07,.12,.002);line(x-.025,y+.12,.29,y+.20,.003);line(.29,y+.20,x+w+.025,y+.12,.003);line(x-.035,y+.115,x+w+.035,y+.115,.003,2);for(let k=0;k<4;k++)line(x+.055+k*(w-.11)/3,y,x+.055+k*(w-.11)/3,y+.12,.001,2,.7);}
   line(.29,.74,.29,.90,.003);circle(.76,.45,.145,.21,.002);circle(.76,.45,.024,.035,.002,2);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;line(.76,.45,.76+.145*Math.cos(a),.45+.21*Math.sin(a),.002);circle(.76+.11*Math.cos(a),.45+.16*Math.sin(a),.014,.02,.001,2);}for(let j=0;j<4;j++){circle(.57,.75+j*.05,.004,.006,.002,2);rect(.60,.746+j*.05,.20-j*.015,.006,2);}line(.08,.14,.91,.14,.001,1,.6);
  }else{for(let j=0;j<3;j++)frame(.10+j*.29,.20,.23,.58,.003);for(let j=0;j<3;j++)for(let k=0;k<5;k++)rect(.125+j*.29,.25+k*.09,.18-(k%3)*.035,.012,k%2?2:1);}
 }else if(d.design==='landscape-v1'){
  // Layered pigment washes, followed by ridges, rocks, tree strokes and water lines.
  for(let layer=0;layer<5;layer++){const base=.22+layer*.082,peak=.10+layer*.035;for(let x=80;x<W-70;x++){const u=x/W,top=base+peak*(.42+.28*Math.sin(u*14+layer*1.7)+.22*Math.sin(u*31+layer*.9));for(let y=Math.round(base*H);y<top*H;y++){const f=(y/H-base)/(top-base);mark(x,y,layer<2?1:2,(.24+layer*.105)*(1-.20*f));}if(layer>1&&x%2===0)line(u,top,u+.002,top-.003,.0014,layer===2?1:2,.83);}}
  for(const[cx,cy,rx,ry]of[[.24,.29,.105,.21],[.58,.36,.13,.36],[.72,.30,.09,.26],[.42,.27,.075,.18]]){for(let j=0;j<9;j++){const x=cx+(j-4)*rx/7,top=cy+ry*(1-Math.abs(j-4)/5);line(x,cy,x+.008*Math.sin(j*3),top,.0018,2,.76);line(x,top,x+.025,top-.04,.0012,1,.65);}}
  for(let j=0;j<16;j++){const y=.10+j*.006;line(.12+j%4*.018,y,.70-(j%5)*.065,y+.004,.0008,1,.38);}
  for(const[x,y,s]of[[.20,.20,.065],[.32,.21,.05],[.73,.24,.07],[.78,.22,.05]]){line(x,y,x-.004,y+s,.002,2,.9);for(let j=0;j<5;j++){const yy=y+s*.3+j*s*.12;line(x-.023*(1-j*.1),yy,x+.023*(1-j*.1),yy+.004,.002,2,.78);}}
  frame(.06,.06,.88,.88,.001,2,.32);
 }else{
  frame(.055,.055,.89,.89,.004,2,.85);frame(.077,.077,.846,.846,.002,1,.85);
  for(const[x,y]of[[.1,.1],[.8,.1],[.1,.8],[.8,.8]]){frame(x,y,.1,.1,.003,2);frame(x+.021,y+.021,.058,.058,.002,2);line(x+.047,y+.043,x+.08,y+.043,.002,2);}
  for(let j=0;j<3;j++){const y=.27+j*.13,w=.61-j*.105,x=.5-w/2;frame(x+.035,y,w-.07,.095,.002,1,.9);line(x,y+.095,.5,y+.175,.003,2,.8);line(.5,y+.175,x+w,y+.095,.003,2,.8);line(x-.025,y+.093,x+w+.025,y+.093,.002,2);for(let k=0;k<4;k++)line(x+.055+k*(w-.11)/3,y,x+.055+k*(w-.11)/3,y+.095,.001,1,.8);}
  circle(.5,.79,.044,.064,.002,2,.8);line(.5,.715,.5,.858,.001,1,.7);
 }
 const ms=Object.values(d.materials).map(id=>materials[id]),maps=ms.map(m=>surfacePixels(m.surface??'none',m.surfaceStrength??.35,128,m.surfaceSeed??0)),rgba=ms.map(m=>[...[1,3,5].map(i=>parseInt(m.color.slice(i,i+2),16)),Math.round(m.opacity*255)]),data=new Uint8Array(N*4),normal=new Uint8Array(N*4),orm=new Uint8Array(N*4);let transparent=false;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x,o=k*4,r=rolePixels[k],a=coverage[k],m=ms[r],s=maps[r],px=(x+.5)/W*d.sizeM[0],py=(y+.5)/H*d.sizeM[1],scale=m.surfaceScale??.5,si=(Math.floor((py/scale%1)*128)*128+Math.floor((px/scale%1)*128))*4,shade=m.surface&&m.surface!=='none'?s.albedo[si]/255:1;for(let j=0;j<4;j++)data[o+j]=Math.round((rgba[0][j]*(1-a)+rgba[r][j]*a)*(j===3?1:shade));transparent ||= data[o+3]<255;normal.set(m.surface&&m.surface!=='none'?s.normal.subarray(si,si+4):[128,128,255,255],o);orm.set([255,Math.round(ms[0].roughness*(1-a)*255+m.roughness*a*255),Math.round((ms[0].metalness*(1-a)+m.metalness*a)*255),255],o);}
 return{width:W,height:H,data,normal,orm,rolePixels,transparent,nearest:false,key:surfaceArtworkSignature(d,materials)};
}
