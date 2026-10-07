import type {Material} from './types';
import {surfacePixels} from './surface';

/** Saved cloth artwork, evaluated from the actual two fabric purposes. */
export type WovenPattern={version:1;design:'hui-border-v1';width:1024;height:192;sizeM:[.8,.12];materials:{ground:number;motif:number}};
export function validateWovenPattern(d:WovenPattern,materials?:Record<string,Material>){
 if(!d||d.version!==1||d.design!=='hui-border-v1'||d.width!==1024||d.height!==192||JSON.stringify(d.sizeM)!=='[0.8,0.12]'||!d.materials||Object.keys(d.materials).length!==2||!['ground','motif'].every(k=>Number.isInteger(d.materials[k as 'ground'])&&d.materials[k as 'ground']>0&&d.materials[k as 'ground']<=65535)||d.materials.ground===d.materials.motif)throw Error('无效织入回纹描述或用途映射');
 if(materials){const values=Object.values(d.materials).map(id=>materials[id]);if(values.some(m=>!m||m.category!=='fabric'||m.intensity!==0)||values[0].solid!==values[1].solid)throw Error('回纹必须采用碰撞属性一致的独立零发光织物用途');}
}
export function wovenPatternSignature(d:WovenPattern,materials:Record<string,Material>){return JSON.stringify([d,Object.values(d.materials).map(id=>materials[id])]);}
/** UV origin is the lower left. These are pigment/threads, with no baked light. */
export function wovenPatternPixels(d:WovenPattern,materials:Record<string,Material>){
 validateWovenPattern(d,materials);
 const roles=[d.materials.ground,d.materials.motif].map(id=>materials[id]),maps=roles.map(m=>surfacePixels(m.surface??'none',m.surfaceStrength??.35,128,m.surfaceSeed??0));
 const data=new Uint8Array(d.width*d.height*4),normal=new Uint8Array(data.length),orm=new Uint8Array(data.length),rolePixels=new Uint8Array(d.width*d.height);
 const spiral=['1111111','1000001','1011101','1010101','1010001','1011111','1000000'];
 let transparent=false;
 for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++){
  const u=(x+.5)/d.width,v=(y+.5)/d.height,px=u*.8,py=v*.12;
  let role=0;
  for(const center of[.075,.725]){const a=Math.floor((px-center+.045)/.09*7),b=6-Math.floor((py-.015)/.09*7);if(a>=0&&a<7&&b>=0&&b<7&&spiral[b][a]==='1')role=1;}
  rolePixels[y*d.width+x]=role;const m=roles[role],s=maps[role],angle=(m.surfaceRotation??0)*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle),scale=m.surfaceScale??.5;
  const sx=Math.floor(((c*px+sn*py)/scale%1+1)%1*128),sy=Math.floor(((-sn*px+c*py)/scale%1+1)%1*128),k=(sy*128+sx)*4,o=(y*d.width+x)*4,shade=m.surface&&m.surface!=='none'?s.albedo[k]/255:1;
  for(let j=0;j<3;j++)data[o+j]=Math.round(parseInt(m.color.slice(1+j*2,3+j*2),16)*shade);
  data[o+3]=Math.round(m.opacity*255);transparent ||= data[o+3]<255;
  if(m.surface&&m.surface!=='none'){const nx=s.normal[k]/127.5-1,ny=s.normal[k+1]/127.5-1;normal.set([Math.round((c*nx-sn*ny+1)*127.5),Math.round((sn*nx+c*ny+1)*127.5),s.normal[k+2],255],o);}else normal.set([128,128,255,255],o);
  orm.set([255,Math.round(m.roughness*(m.surface&&m.surface!=='none'?s.roughness[k+1]:255)),Math.round(m.metalness*255),255],o);
 }
 return{width:d.width,height:d.height,data,normal,orm,rolePixels,transparent,nearest:false,key:wovenPatternSignature(d,materials)};
}
