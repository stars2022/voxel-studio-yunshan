import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RenderMaterialLibrary} from '../src/client/render-materials';
import {productionProject} from '../src/production/style';

test('colour and roughness edits retain GPU materials, texture objects and shader versions across all other roles',()=>{
 const p=productionProject('render reuse');p.materials[3].surface='wood';
 const cache=new RenderMaterialLibrary();cache.sync(p.materials,100,8);
 const originals=new Map(cache.materials),wood=cache.materials.get(3)!,map=wood.map,version=wood.version;
 let disposals=0;for(const m of originals.values())m.addEventListener('dispose',()=>disposals++);
 p.materials[3].color='#614327';p.materials[3].roughness=.35;cache.sync(p.materials,2,8);
 for(const[id,mat]of originals)assert.equal(cache.materials.get(id),mat);
 assert.equal(disposals,0);assert.equal(wood.map,map);assert.equal(wood.version,version);
 assert.equal(wood.color.getHexString(),'614327');assert.equal(wood.roughness,.35);assert.equal(wood.clippingPlanes![0].constant,2);
});

test('appearance undo changes surface and transparency without disposing shared shader-owning materials',()=>{
 const p=productionProject('render undo'),cache=new RenderMaterialLibrary();cache.sync(p.materials,100,8);
 const original=structuredClone(p.materials),mat=cache.materials.get(6)!,version=mat.version;
 let materialDisposals=0;mat.addEventListener('dispose',()=>materialDisposals++);
 p.materials[6].opacity=.3;p.materials[6].surface='metal';cache.sync(p.materials,100,8);
 assert.equal(mat.transparent,true);assert.equal(mat.depthWrite,false);assert.equal(mat.side,THREE.DoubleSide);assert.ok(mat.version>version);
 const maps=[mat.map!,mat.normalMap!,mat.roughnessMap!];let released=0;for(const t of maps)t.addEventListener('dispose',()=>released++);
 cache.sync(original,100,8);
 assert.equal(cache.materials.get(6),mat);assert.equal(materialDisposals,0);assert.equal(released,3);
 assert.equal(mat.map,null);assert.equal(mat.transparent,false);assert.equal(mat.depthWrite,true);assert.equal(mat.side,THREE.FrontSide);
 assert.equal(mat.color.getHexString(),original[6].color.slice(1));
});

test('removing a material releases only its textures and material while keeping unrelated roles alive',()=>{
 const p=productionProject('release');p.materials[3].surface='wood';p.materials[4].surface='metal';
 const cache=new RenderMaterialLibrary();cache.sync(p.materials,100,8);const removed=cache.materials.get(3)!,kept=cache.materials.get(4)!;
 let released=0;for(const r of[removed,removed.map!,removed.normalMap!,removed.roughnessMap!])r.addEventListener('dispose',()=>released++);
 let unrelated=0;kept.addEventListener('dispose',()=>unrelated++);kept.map!.addEventListener('dispose',()=>unrelated++);
 delete p.materials[3];cache.sync(p.materials,100,8);assert.equal(released,4);assert.equal(unrelated,0);assert.equal(cache.materials.has(3),false);assert.equal(cache.materials.get(4),kept);
});


test('disabled clipping shows native assets above 100m without infinite GPU planes, and finite heights reuse the shader',()=>{
 const p=productionProject('high bridge'),cache=new RenderMaterialLibrary();cache.sync(p.materials,Infinity,8);
 const mat=cache.materials.get(4)!,v=mat.version;assert.equal(mat.clippingPlanes?.length??0,0);
 cache.sync(p.materials,254.2,8);assert.equal(mat.clippingPlanes![0].constant,254.2);assert.ok(mat.version>v);
 const plane=mat.clippingPlanes![0],v2=mat.version;cache.sync(p.materials,254.6,8);assert.equal(mat.clippingPlanes![0],plane);assert.equal(mat.version,v2);
 cache.sync(p.materials,Infinity,8);assert.equal(mat.clippingPlanes!.length,0);assert.ok(mat.version>v2);assert.equal(cache.materials.get(4),mat);
});
