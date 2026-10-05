import {texturedSkyMaterial,disposeSkyMaterial} from './sky-material';
import * as THREE from 'three';
import {skyMesh,skyState,type SkyClock} from '../core/sky';
import type {Project} from '../core/types';
/** A separate background pass keeps astronomical-scale depth out of foreground depth. */
export class SkyPreview {
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(60,1,.1,40000);clock:SkyClock|null=null;sourceIds:string[]=[];observer=[0,0,0];disposedGeometries=0;disposedMaterials=0;
 clear(){for(const o of [...this.scene.children])if(o instanceof THREE.Mesh){o.geometry.dispose();disposeSkyMaterial(o.material as THREE.Material);this.disposedGeometries++;this.disposedMaterials++;}this.scene.clear();this.clock=null;this.sourceIds=[];}
 set(p:Project,clock:SkyClock,assetIds?:string[],rotation=0){skyState(clock);const assets=Object.values(p.assets).filter(a=>a.sky&&(!assetIds||assetIds.includes(a.id)));if(!assets.length)throw new Error('当前文件没有天空程序组件');const next:THREE.Mesh[]=[];
  try{for(const a of assets){const copy={...a,origin:[0,0,0] as [number,number,number],sky:{...a.sky!,...clock}};for(const b of skyMesh(copy,p.materials)){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uvs,2));g.setIndex(b.indices);const m=texturedSkyMaterial(b);m.depthWrite=false;m.depthTest=false;const mesh=new THREE.Mesh(g,m);mesh.renderOrder=a.sky!.kind==='dome'?-3:a.sky!.kind==='stars'?-2:-1;mesh.frustumCulled=false;mesh.rotation.y=rotation*Math.PI/2;next.push(mesh);}}}catch(e){for(const m of next){m.geometry.dispose();disposeSkyMaterial(m.material as THREE.Material);}throw e;}
  this.clear();this.clock={...clock};this.sourceIds=assets.map(a=>a.id);this.scene.add(...next);
 }
 render(renderer:THREE.WebGLRenderer,observer:THREE.Camera,aspect:number){this.observer=observer.position.toArray();this.camera.quaternion.copy(observer.quaternion);this.camera.aspect=aspect;this.camera.fov=observer instanceof THREE.PerspectiveCamera?observer.fov:60;this.camera.updateProjectionMatrix();renderer.render(this.scene,this.camera);}
 get stats(){return{clock:this.clock,sourceIds:this.sourceIds,objects:this.scene.children.length,triangles:this.scene.children.reduce((n,m)=>n+((m as THREE.Mesh).geometry.index?.count??0)/3,0),observer:this.observer,cameraFollowing:true,originalStateBound:false,disposedGeometries:this.disposedGeometries,disposedMaterials:this.disposedMaterials};}
}
