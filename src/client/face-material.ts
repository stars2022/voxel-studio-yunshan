import * as THREE from 'three';
import type {MeshBucket} from '../core/mesh';

/** Lit skin texture; shared by all six UV cells during each rendered snapshot. */
export function texturedFaceMaterial(b:Pick<MeshBucket,'texture'>,source:THREE.MeshStandardMaterial){
 const pixels=b.texture;if(!pixels)throw new Error('面孔缺少实际图谱');
 const map=new THREE.DataTexture(pixels.data,pixels.width,pixels.height,THREE.RGBAFormat);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;map.magFilter=map.minFilter=THREE.NearestFilter;map.generateMipmaps=false;map.flipY=false;map.needsUpdate=true;
 return new THREE.MeshStandardMaterial({color:0xffffff,map,roughness:source.roughness,metalness:source.metalness,transparent:pixels.transparent,depthWrite:!pixels.transparent,side:pixels.transparent?THREE.DoubleSide:THREE.FrontSide});
}
