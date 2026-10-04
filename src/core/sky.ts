import {authoredBuckets} from './authored-mesh';
import type {Asset,Bounds,Material,V3} from './types';
import {skyPixels} from './sky-texture';
import {Grid} from './grid';
import type {MeshBucket} from './mesh';
export type SkyClock={hour:number;weather:'clear'|'overcast';visibility:number};
/** Authoritative, nonphysical procedural geometry. This is never voxel occupancy. */
export type SkyDescriptor=SkyClock&{version:1;kind:'dome'|'sun'|'moon'|'stars';radiusM:number;distanceM:number;segments:[number,number];seed:number;starCount:number;materials:Record<string,number>;clockSource:'author-preview';originalStateBound:false};
export const skyRoleKeys={dome:['zenith','horizon','dusk','night'],sun:['surface','edge'],moon:['surface','maria'],stars:['points']} as const;
const finite=(x:unknown,lo:number,hi:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=lo&&x<=hi;
export function validateSky(a:Asset,materials?:Record<string,Material>){const s=a.sky;if(!s)return;
 if(!s||s.version!==1||!Object.hasOwn(skyRoleKeys,s.kind)||!finite(s.radiusM,.2,16000)||!finite(s.distanceM,0,16000)||!finite(s.hour,0,24)||!['clear','overcast'].includes(s.weather)||!finite(s.visibility,0,1)||!Number.isInteger(s.seed)||!finite(s.seed,1,65535)||!Array.isArray(s.segments)||s.segments.length!==2||s.segments.some((v,i)=>!Number.isInteger(v)||!finite(v,8,i?64:128)||v%(i?2:4)!==0)||s.starCount!==(s.kind==='stars'?600:0)||s.clockSource!=='author-preview'||s.originalStateBound!==false)throw new Error('无效或超预算的天空程序组件');
 if(Object.keys(a.chunks).length||a.meshes?.length||a.parts.length||a.openings.length)throw new Error('天空程序组件不能混入体素、体素选区或物理孔洞');
 const keys=skyRoleKeys[s.kind];if(!s.materials||Object.keys(s.materials).length!==keys.length||keys.some(k=>!Number.isInteger(s.materials[k])||s.materials[k]<1||s.materials[k]>65535))throw new Error('天空用途材质映射无效');
 if(new Set(Object.values(s.materials)).size!==keys.length)throw new Error('天空用途材质不能合并');
 if(materials)for(const id of Object.values(s.materials)){const m=materials[id];if(!m||m.solid||m.category!=='emissive')throw new Error('天空须使用独立非碰撞视觉光学材质');}
}
export const geometryData=(a:Asset)=>a.sky??(a.meshes?{chunks:a.chunks,meshes:a.meshes}:a.chunks);
export const geometryKind=(a:Asset)=>a.sky?'textured-sky':a.meshes?'voxel-and-mesh':'native-voxels';
const clamp=(n:number)=>Math.max(0,Math.min(1,n)),smooth=(a:number,b:number,x:number)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export function skyState(clock:SkyClock){if(!finite(clock.hour,0,24)||!['clear','overcast'].includes(clock.weather)||!finite(clock.visibility,0,1))throw new Error('无效天空预览状态');const t=(clock.hour%24-6)/24*Math.PI*2,v:V3=[Math.cos(t),Math.sin(t),.14*Math.cos(t)],n=Math.hypot(...v),sun=v.map(x=>x/n) as V3,daylight=smooth(-.12,.18,sun[1]),twilight=Math.exp(-((sun[1]/.18)**2)),weather=clock.weather==='overcast'?.28:1;
 return{sun,moon:sun.map(v=>-v) as V3,daylight,twilight,starVisibility:(1-smooth(-.16,.06,sun[1]))*weather*clock.visibility,discVisibility:weather*clock.visibility,clockSource:'author-preview' as const,originalStateBound:false};}
const linear=(s:string)=>[1,3,5].map(i=>{const n=parseInt(s.slice(i,i+2),16)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}) as V3;
const mix=(a:V3,b:V3,t:number)=>a.map((v,i)=>v*(1-t)+b[i]*t) as V3;
export function skyColor(s:SkyDescriptor,normal:V3,materials:Record<string,Material>,channel:'color'|'opacity'='color'):V3{const state=skyState(s),colors=Object.fromEntries(Object.entries(s.materials).map(([k,id])=>[k,channel==='color'?linear(materials[id].color):[materials[id].opacity,materials[id].opacity,materials[id].opacity] as V3]));
 if(s.kind==='dome'){const altitude=smooth(-.12,.85,normal[1]),day=mix(colors.horizon,colors.zenith,altitude),night=mix(colors.night,colors.zenith,.03*altitude),sunSide=Math.max(0,(normal[0]*state.sun[0]+normal[2]*state.sun[2]+1)/2),dusk=state.twilight*Math.exp(-Math.abs(normal[1])/.2)*(.25+.65*sunSide);let c=mix(mix(night,day,state.daylight),colors.dusk,dusk);const haze=(1-s.visibility)*.65+(s.weather==='overcast'?.7:0),grey=mix(colors.night,colors.horizon,state.daylight*.48);return mix(c,grey,clamp(haze));}
 if(s.kind==='sun'){const f=.3+.7*Math.abs(normal[1]);return mix(colors.edge,colors.surface,f);}
 if(s.kind==='moon'){const f=Math.sin(normal[0]*13+2)*Math.cos(normal[1]*9-1)+Math.sin(normal[2]*19)*.4;return mix(colors.surface,colors.maria,smooth(-.15,.55,f)*.72);}
 return colors.points;
}
function rng(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function starSites(s:SkyDescriptor){const r=rng(s.seed),sites:{position:V3;radiusM:number;brightness:number}[]=[];for(let i=0;i<s.starCount;i++){const y=r()*2-1,a=r()*Math.PI*2,t=Math.sqrt(1-y*y);sites.push({position:[Math.cos(a)*t*s.radiusM,y*s.radiusM,Math.sin(a)*t*s.radiusM],radiusM:8+r()*10,brightness:.45+r()*.55});}return sites;}
function bucket(s:SkyDescriptor):MeshBucket{return{material:Object.values(s.materials)[0],positions:[],normals:[],indices:[],uvs:[],quads:0,unlit:true,doubleSided:true,opacity:s.kind==='stars'?skyState(s).starVisibility:s.kind==='sun'||s.kind==='moon'?skyState(s).discVisibility:1};}
export function skyMesh(a:Asset,materials:Record<string,Material>):MeshBucket[]{validateSky(a,materials);const s=a.sky;if(!s)return[];const b=bucket(s);b.texture=skyPixels(s,materials);const state=skyState(s),center=(s.kind==='sun'?state.sun:s.kind==='moon'?state.moon:[0,0,0]).map(n=>n*s.distanceM) as V3;
 const vertex=(p:V3,n:V3,uv:[number,number],c:V3,alpha:number)=>{b.positions.push(...p.map((v,i)=>v+a.origin[i]));b.normals.push(...n);b.uvs.push(...uv);};

 const [W,H]=s.segments;for(let y=0;y<=H;y++)for(let x=0;x<=W;x++){const theta=x/W*Math.PI*2,phi=y/H*Math.PI,n:V3=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)],p=n.map((v,i)=>center[i]+v*s.radiusM) as V3;vertex(p,(s.kind==='dome'||s.kind==='stars')?n.map(v=>-v) as V3:n,[x/W,y/H],skyColor(s,n,materials),skyColor(s,n,materials,'opacity')[0]);}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=x+y*(W+1),c=a+W+1;const triangles:number[][]=[];if(y>0)triangles.push([a,c,a+1]);if(y<H-1)triangles.push([a+1,c,c+1]);for(const t of triangles)b.indices.push(...((s.kind==='dome'||s.kind==='stars')?t:t.reverse()));}return[b];
}
export function meshBounds(buckets:MeshBucket[]):Bounds|null{const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];for(const b of buckets)for(let i=0;i<b.positions.length;i++){const d=i%3;min[d]=Math.min(min[d],b.positions[i]);max[d]=Math.max(max[d],b.positions[i]);}return Number.isFinite(min[0])?{min,max}:null;}
/** Sky bounds are visual only. Never use them as collision or voxel bounds. */
export function skyBoundsM(a:Asset):Bounds|null{const s=a.sky;if(!s)return null;validateSky(a);const st=skyState(s),d=s.kind==='sun'?st.sun:s.kind==='moon'?st.moon:[0,0,0];return{min:d.map((v,i)=>a.origin[i]+v*s.distanceM-s.radiusM) as V3,max:d.map((v,i)=>a.origin[i]+v*s.distanceM+s.radiusM) as V3};}

export function assetBoundsM(a:Asset):Bounds|null{if(a.sky)return skyBoundsM(a);const b=new Grid(a.chunks).bounds(),m=meshBounds(authoredBuckets(a)),v=b?{min:b.min.map((n,i)=>a.origin[i]+n*a.cellSize) as V3,max:b.max.map((n,i)=>a.origin[i]+n*a.cellSize) as V3}:null;if(!v)return m;if(!m)return v;return{min:v.min.map((n,i)=>Math.min(n,m.min[i])) as V3,max:v.max.map((n,i)=>Math.max(n,m.max[i])) as V3};}
