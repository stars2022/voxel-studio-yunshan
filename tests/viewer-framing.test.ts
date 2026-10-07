import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Viewer} from '../src/client/viewer';

for(const projection of ['perspective','orthographic'] as const)test(`${projection} framing keeps small assets, 160m bridges and 960m runways inside all six clip planes`,()=>{
 for(const size of [[.2,.3,.4],[12.6,30.3,161.6],[960,.5,44]])for(const aspect of [.75,1.125,2])for(const direction of [[1,1,-1],[0,0,-1],[-1,0,0]]){
  const min=new THREE.Vector3(-3,-2,-.8),box=new THREE.Box3(min,min.clone().add(new THREE.Vector3(...size))),center=box.getCenter(new THREE.Vector3());
  const camera=projection==='perspective'?new THREE.PerspectiveCamera(37,aspect,.01,500):new THREE.OrthographicCamera(-1,1,1,-1,.01,500);
  camera.position.copy(center).add(new THREE.Vector3(...direction).multiplyScalar(Math.max(...size)*1.8));camera.lookAt(center);camera.updateMatrixWorld();
  const target=new THREE.Vector3(),fixture={camera,el:{clientWidth:900*aspect,clientHeight:900},controls:{target,update(){camera.lookAt(target);camera.updateMatrixWorld();}},fitLight(){}};
  Viewer.prototype.frame.call(fixture as unknown as Viewer,box);
  for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
   const ndc=new THREE.Vector3(x,y,z).project(camera);
   for(const [axis,v]of Object.entries({x:ndc.x,y:ndc.y,z:ndc.z}))assert.ok(v>=-1&&v<=1,`${projection} ${size} ${direction} aspect=${aspect}: ${axis}=${v}`);
  }
  assert.equal(camera.near,.01);assert.ok(camera.far>=500);
 }
});


test('clip toggles synchronise native, clay, AO, face textures and lights, and reject invalid heights atomically',()=>{
 const clayMaterial=new THREE.ShaderMaterial(),normalMaterial=new THREE.MeshNormalMaterial(),native=new THREE.MeshStandardMaterial(),face=new THREE.MeshStandardMaterial({map:new THREE.DataTexture(new Uint8Array(192*16*4),192,16)}),light=new THREE.PointLight();light.position.y=254.5;
 const fixture={clipY:Infinity,clayMaterial,aoPass:{normalMaterial},materials:new Map([[1,native]]),proceduralMaterials:[face],practicalLights:{children:[light]}};
 const clip=(v:number)=>Viewer.prototype.setClip.call(fixture as unknown as Viewer,v);
 clip(254.2);for(const m of[clayMaterial,normalMaterial,native,face])assert.equal(m.clippingPlanes![0].constant,254.2);assert.equal(light.visible,false);
 clip(Infinity);for(const m of[clayMaterial,normalMaterial,native,face])assert.deepEqual(m.clippingPlanes,[]);assert.equal(light.visible,true);
 for(const invalid of[NaN,-Infinity])assert.throws(()=>clip(invalid));assert.equal(fixture.clipY,Infinity);
});

test('studio shadow toggles and PCF/VSM changes invalidate cached, imported and ground shaders without replacing materials',()=>{
 const documentBefore=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{classList:{toggle(){}}}}});
 try{
  const cached=new THREE.MeshStandardMaterial(),imported=new THREE.MeshStandardMaterial(),ground=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial()),scene=new THREE.Scene();scene.add(ground,new THREE.Mesh(new THREE.BoxGeometry(),[cached,imported]));
  const fixture={studio:true,referenceLighting:false,renderer:{shadowMap:{enabled:true,type:THREE.PCFSoftShadowMap},setClearColor(){},toneMappingExposure:1},materials:new Map([[1,cached]]),scene,ground,grid:{visible:false},practicalLights:{visible:false},practicalsEnabled:false,sun:new THREE.DirectionalLight(),ambient:new THREE.HemisphereLight(),fill:new THREE.DirectionalLight(),environment:null,fitLight(){},clayEnabled:false};
  const materials=[cached,imported,ground.material],versions=()=>materials.map(m=>m.version),set=(enabled:boolean)=>Viewer.prototype.setStudio.call(fixture as unknown as Viewer,enabled);let previous=versions();
  set(true);assert.deepEqual(versions(),previous);
  for(const[enabled,soft]of[[false,false],[true,false],[true,true],[true,false]]){fixture.referenceLighting=soft;set(enabled);assert.equal(fixture.renderer.shadowMap.enabled,enabled);assert.equal(fixture.renderer.shadowMap.type,enabled&&soft?THREE.VSMShadowMap:THREE.PCFSoftShadowMap);assert.deepEqual(versions(),previous.map(v=>v+1));previous=versions();set(enabled);assert.deepEqual(versions(),previous);}
  assert.equal(fixture.materials.get(1),cached);assert.equal(ground.material,materials[2]);
 }finally{if(documentBefore)Object.defineProperty(globalThis,'document',documentBefore);else Reflect.deleteProperty(globalThis,'document');}
});
