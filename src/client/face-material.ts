import * as THREE from 'three';
import type {MeshBucket} from '../core/mesh';

/** Lit palette-derived textures: face cells retain nearest filtering; cloth uses mipmaps. */
export function texturedFaceMaterial(b:Pick<MeshBucket,'texture'>,source:THREE.MeshStandardMaterial){
 const pixels=b.texture;if(!pixels)throw new Error('缺少实际用途图谱');
 const texture=(bytes:Uint8Array,srgb=false)=>{const t=new THREE.DataTexture(bytes,pixels.width,pixels.height,THREE.RGBAFormat);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.magFilter=pixels.nearest?THREE.NearestFilter:THREE.LinearFilter;t.minFilter=pixels.nearest?THREE.NearestFilter:THREE.LinearMipmapLinearFilter;t.generateMipmaps=!pixels.nearest;t.flipY=false;t.needsUpdate=true;return t;};
 const map=texture(pixels.data,true),normalMap=pixels.normal?texture(pixels.normal):null,orm=pixels.orm?texture(pixels.orm):null;
 return new THREE.MeshStandardMaterial({color:0xffffff,map,normalMap,roughnessMap:orm,metalnessMap:orm,roughness:orm?1:source.roughness,metalness:orm?1:source.metalness,transparent:pixels.transparent,depthWrite:!pixels.transparent,side:pixels.transparent?THREE.DoubleSide:THREE.FrontSide});
}
