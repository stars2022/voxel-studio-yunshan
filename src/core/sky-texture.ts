import type {Material,V3} from './types';
import {skyState,starSites,type SkyDescriptor} from './sky';
const clamp=(v:number)=>Math.max(0,Math.min(1,v)),mix=(a:number[],b:number[],t:number)=>a.map((v,i)=>v+(b[i]-v)*t),smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const linear=(hex:string)=>[1,3,5].map(i=>{const v=parseInt(hex.slice(i,i+2),16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
const byte=(v:number)=>Math.round(255*clamp(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));
function noise(x:number,y:number,z:number){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),f=[x-X,y-Y,z-Z].map(v=>v*v*(3-2*v));let value=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){let n=Math.imul(X+i,374761393)+Math.imul(Y+j,668265263)+Math.imul(Z+k,2147483647);n=Math.imul(n^(n>>>13),1274126177);value+=((n^(n>>>16))>>>0)/4294967295*(i?f[0]:1-f[0])*(j?f[1]:1-f[1])*(k?f[2]:1-f[2]);}return value;}
/** Seamless directional colour/opacity textures, no lighting baked into physical materials. */
export function skyPixels(s:SkyDescriptor,materials:Record<string,Material>){const stars=s.kind==='stars',width=stars?2048:s.kind==='dome'?1024:512,height=width/2,data=new Uint8Array(width*height*4),state=skyState(s),c=Object.fromEntries(Object.entries(s.materials).map(([k,id])=>[k,[...linear(materials[id].color),materials[id].opacity]]));let transparent=stars;
 const write=(offset:number,v:number[])=>{data[offset]=byte(v[0]);data[offset+1]=byte(v[1]);data[offset+2]=byte(v[2]);data[offset+3]=Math.round(clamp(v[3])*255);if(v[3]<1)transparent=true;};
 if(stars){for(const star of starSites(s)){const n=star.position.map(v=>v/s.radiusM),u=(Math.atan2(n[2],n[0])/Math.PI/2+1)%1,v=Math.acos(clamp((n[1]+1)/2)*2-1)/Math.PI,cx=u*width,cy=v*height,r=1.1+(star.radiusM-8)/10*1.5;for(let y=Math.max(0,Math.floor(cy-r*3));y<Math.min(height,Math.ceil(cy+r*3));y++)for(let x=Math.floor(cx-r*3);x<Math.ceil(cx+r*3);x++){const dx=(x+.5-cx)/r,dy=(y+.5-cy)/r,core=Math.exp(-(dx*dx+dy*dy)*3),halo=Math.exp(-(dx*dx+dy*dy)*.7)*.1,alpha=clamp((core+halo)*star.brightness*c.points[3]),o=(y*width+(x+width)%width)*4;if(alpha*255>data[o+3])write(o,[...c.points.slice(0,3),alpha]);}}return{width,height,data,transparent};}
 for(let y=0;y<height;y++){const phi=(y+.5)/height*Math.PI,ny=Math.cos(phi),r=Math.sin(phi);for(let x=0;x<width;x++){const t=(x+.5)/width*Math.PI*2,n:V3=[r*Math.cos(t),ny,r*Math.sin(t)];let color:number[];
  if(s.kind==='dome'){const altitude=smooth(-.12,.85,ny),day=mix(c.horizon,c.zenith,altitude),night=mix(c.night,c.zenith,.03*altitude),sunSide=Math.max(0,(n[0]*state.sun[0]+n[2]*state.sun[2]+1)/2),dusk=state.twilight*Math.exp(-Math.abs(ny)/.2)*(.25+.65*sunSide);color=mix(mix(night,day,state.daylight),c.dusk,dusk);const haze=(1-s.visibility)*.65+(s.weather==='overcast'?.7:0);color=mix(color,mix(c.night,c.horizon,state.daylight*.48),clamp(haze));
   // Directional bands create a continuous painted cloud layer across the UV seam.
   const wave=Math.sin(n[0]*11+n[2]*7+Math.sin(ny*20)*2)+.45*Math.sin(n[0]*31-n[2]*19+ny*15),cloud=smooth(.6,1.3,wave)*smooth(-.02,.12,ny)*(1-smooth(.35,.8,ny))*(s.weather==='overcast'?.45:.12)*(.025+.975*state.daylight);color=mix(color,mix(c.horizon,c.dusk,state.twilight*.5),cloud);
  }else if(s.kind==='sun')color=mix(c.edge,c.surface,.3+.7*Math.abs(ny));
  else{const f=.65*noise(n[0]*3.5+10,ny*3.5+20,n[2]*3.5+30)+.25*noise(n[0]*9+2,ny*9+5,n[2]*9+11)+.1*noise(n[0]*24,ny*24,n[2]*24);const maria=smooth(.38,.62,f)*.82,grain=(noise(n[0]*80,ny*80,n[2]*80)-.5)*.14;color=mix(c.surface,c.maria,clamp(maria+grain));}
  write((y*width+x)*4,color);
 }}return{width,height,data,transparent};
}
