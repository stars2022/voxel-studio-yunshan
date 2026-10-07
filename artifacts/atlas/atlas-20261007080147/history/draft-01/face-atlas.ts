import type {Material} from './types';

export const faceAtlasRoles=['skinSurface','skinCrease','skinLip','eyeWhite','eyeIris','eyePupil','browHair','hairMass','sparseHair'] as const;
export type FaceAtlasRole=typeof faceAtlasRoles[number];
/** One saved, shared six-cell pixel design. Cells are UV selections, never separate textures. */
export type FaceAtlas={version:1;width:192;height:16;design:'authored-six-faces-v1';materials:Record<FaceAtlasRole,number>};
export function validateFaceAtlas(d:FaceAtlas,materials?:Record<string,Material>){
 if(!d||d.version!==1||d.width!==192||d.height!==16||d.design!=='authored-six-faces-v1'||!d.materials||Object.keys(d.materials).length!==faceAtlasRoles.length||faceAtlasRoles.some(r=>!Number.isInteger(d.materials[r])||d.materials[r]<1||d.materials[r]>65535)||new Set(Object.values(d.materials)).size!==faceAtlasRoles.length)throw new Error('无效六格面孔图谱描述或独立用途映射');
 if(materials)for(const role of faceAtlasRoles){const m=materials[d.materials[role]],category=role.startsWith('skin')?'skin':role.startsWith('eye')?'eye':'hair';if(!m||m.solid||m.category!==category||m.intensity!==0)throw new Error('面孔图谱必须使用实际非碰撞零发光皮肤、眼部和毛发用途 '+role);}
}
/** Top-left pixel origin, 32 × 16 pixels per face; untouched pixels retain skin purpose. */
export function faceAtlasRolePixels():Uint8Array{
 const result=new Uint8Array(192*16),role=(r:FaceAtlasRole)=>faceAtlasRoles.indexOf(r);
 for(let cell=0;cell<6;cell++){
  const elder=cell%3===1,child=cell%3===2,stressed=cell>=3;
  const pixel=(x:number,y:number,r:FaceAtlasRole)=>{if(x>=0&&x<32&&y>=0&&y<16)result[y*192+cell*32+x]=role(r);},rect=(x:number,y:number,w:number,h:number,r:FaceAtlasRole)=>{for(let v=y;v<y+h;v++)for(let u=x;u<x+w;u++)pixel(u,v,r);};
  for(const left of [true,false]){
   const x=left?8:20;rect(x,8,4,child?2:1,'eyeWhite');rect(x+1,8,2,child?2:1,'eyeIris');pixel(x+2,8,'eyePupil');
   for(let j=0;j<5;j++)pixel(x+j,stressed?(left?5+Math.floor(j/2):7-Math.floor(j/2)):6,'browHair');
   if(elder){rect(x,10,4,1,'skinCrease');rect(left?5:25,8,2,1,'skinCrease');rect(left?2:28,5,2,5,'sparseHair');}
   else if(!child)rect(left?2:28,5,1,3,'hairMass');
  }
  if(elder){rect(11,3,10,1,'skinCrease');rect(12,4,8,1,'skinCrease');}
  if(stressed){rect(14,12,4,1,'skinLip');pixel(13,13,'skinLip');pixel(18,13,'skinLip');if(elder){pixel(12,13,'skinCrease');pixel(19,13,'skinCrease');}}
  else{rect(14,13,4,1,'skinLip');if(child){pixel(13,12,'skinLip');pixel(18,12,'skinLip');}}
 }
 return result;
}
export function faceAtlasSignature(d:FaceAtlas,materials:Record<string,Material>){return JSON.stringify([d,faceAtlasRoles.map(r=>{const m=materials[d.materials[r]];return[m.id,m.color,m.opacity];})]);}
export function faceAtlasPixels(d:FaceAtlas,materials:Record<string,Material>){
 validateFaceAtlas(d,materials);const roles=faceAtlasRolePixels(),data=new Uint8Array(192*16*4);let transparent=false;
 const rgba=faceAtlasRoles.map(r=>{const m=materials[d.materials[r]];return[...[1,3,5].map(i=>parseInt(m.color.slice(i,i+2),16)),Math.round(m.opacity*255)];});
 for(let k=0;k<roles.length;k++){const c=rgba[roles[k]];data.set(c,k*4);if(c[3]<255)transparent=true;}
 return{width:192,height:16,data,transparent,nearest:true,key:faceAtlasSignature(d,materials)};
}
