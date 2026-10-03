import * as THREE from 'three';
import {surfacePixels} from '../core/surface';
import type {Material} from '../core/types';

/** Infinity means no clipping; never upload an infinite plane to WebGL. */
export function setMaterialClip(material:THREE.Material,clipY:number){
 if(!Number.isFinite(clipY)&&clipY!==Infinity)throw new Error('Invalid clip height');
 const enabled=Number.isFinite(clipY),planes=material.clippingPlanes??[];
 if(enabled&&planes.length===1){planes[0].constant=clipY;return;}
 if(!enabled&&!planes.length)return;
 material.clippingPlanes=enabled?[new THREE.Plane(new THREE.Vector3(0,-1,0),clipY)]:[];
 material.needsUpdate=true;
}

/** Keep GPU material identities through appearance edits and undo. Disposing the
 * whole palette also evicted shared shader programs and stalled software GPUs. */
export class RenderMaterialLibrary {
 readonly materials=new Map<number,THREE.MeshStandardMaterial>();
 private surfaces=new Map<number,{signature:string;textures:THREE.Texture[]}>();
 sync(definitions:Record<string,Material>,clipY:number,maxAnisotropy:number){
  for(const [id,mat]of this.materials)if(!definitions[id]){
   mat.dispose();this.surfaces.get(id)?.textures.forEach(t=>t.dispose());
   this.surfaces.delete(id);this.materials.delete(id);
  }
  for(const m of Object.values(definitions)){
   let mat=this.materials.get(m.id);
   if(!mat){mat=new THREE.MeshStandardMaterial();mat.clipShadows=true;this.materials.set(m.id,mat);}
   const transparent=m.opacity<1,side=transparent?THREE.DoubleSide:THREE.FrontSide,hasSurface=!!m.surface&&m.surface!=='none';
   const shaderChanged=mat.transparent!==transparent||mat.side!==side||!!mat.map!==hasSurface;
   mat.name=m.name;mat.color.set(m.color);mat.roughness=m.roughness;mat.metalness=m.metalness;
   mat.transparent=transparent;mat.opacity=m.opacity;mat.emissive.set(m.emissive);mat.emissiveIntensity=m.intensity;
   mat.depthWrite=!transparent;mat.side=side;setMaterialClip(mat,clipY);
   const signature=hasSurface?JSON.stringify([m.surface,m.surfaceStrength??.35,m.surfaceSeed??0,m.surfaceScale??.5,m.surfaceRotation??0,maxAnisotropy]):'';
   if(this.surfaces.get(m.id)?.signature!==signature){
    this.surfaces.get(m.id)?.textures.forEach(t=>t.dispose());
    const textures:THREE.Texture[]=[];mat.map=null;mat.normalMap=null;mat.roughnessMap=null;
    if(hasSurface){
     const pixels=surfacePixels(m.surface!,m.surfaceStrength??.35,128,m.surfaceSeed??0);
     const texture=(bytes:Uint8Array,srgb=false)=>{
      const t=new THREE.DataTexture(bytes,pixels.size,pixels.size,THREE.RGBAFormat);
      t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.setScalar(1/(m.surfaceScale??.5));t.rotation=(m.surfaceRotation??0)*Math.PI/180;
      t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=maxAnisotropy;
      if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;
     };
     mat.map=texture(pixels.albedo,true);mat.normalMap=texture(pixels.normal);mat.roughnessMap=texture(pixels.roughness);
    }
    this.surfaces.set(m.id,{signature,textures});
   }
   if(shaderChanged)mat.needsUpdate=true;
  }
 }
}
