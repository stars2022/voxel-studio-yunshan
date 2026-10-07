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
