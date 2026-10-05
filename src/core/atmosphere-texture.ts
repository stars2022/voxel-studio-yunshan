import type {Material} from './types';
/** A bounded, saved author snapshot. No particle clock or simulation ownership. */
export type AtmosphereTexture={version:1;kind:'cloud'|'fog'|'rain';seed:number;density:number;light:number;wind:number};
export function validateAtmosphereTexture(t:AtmosphereTexture){
 if(!t||t.version!==1||!['cloud','fog','rain'].includes(t.kind)||!Number.isInteger(t.seed)||t.seed<1||t.seed>65535||![t.density,t.light].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!Number.isFinite(t.wind)||Math.abs(t.wind)>1)throw new Error('无效有界环境贴图');
}
export function atmospherePixels(t:AtmosphereTexture,m:Material){
 validateAtmosphereTexture(t);const width=256,height=128,data=new Uint8Array(width*height*4),rgb=[1,3,5].map(i=>parseInt(m.color.slice(i,i+2),16));let state=t.seed;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const lobes=Array.from({length:18},()=>({x:.12+random()*.76,y:.24+random()*.5,r:.045+random()*.15}));
 const drops=Array.from({length:100},()=>({x:random(),y:random(),length:.025+random()*.08}));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+.5)/width,v=(y+.5)/height,edge=Math.min(1,u*14,(1-u)*14,v*14,(1-v)*14);let alpha=0;
  if(t.kind==='rain'){for(const d of drops){const dy=v-d.y,dx=u-d.x-t.wind*dy*.18;if(dy>=0&&dy<d.length&&Math.abs(dx)<.003)alpha=Math.max(alpha,(1-Math.abs(dx)/.003)*Math.sin(dy/d.length*Math.PI)*.75);}}
  else{for(const l of lobes){const dx=(u-l.x)/(l.r*(t.kind==='fog'?1.5:1)),dy=(v-l.y)/(l.r*.75);alpha=Math.max(alpha,Math.exp(-(dx*dx+dy*dy)*2));}alpha=Math.pow(alpha,t.kind==='fog'?.7:1.1);}
  const k=(y*width+x)*4,brightness=.22+.78*t.light;for(let c=0;c<3;c++)data[k+c]=Math.round(rgb[c]*brightness);data[k+3]=Math.round(255*Math.min(1,alpha*edge*t.density*m.opacity));
 }
 return{width,height,data,transparent:true};
}
