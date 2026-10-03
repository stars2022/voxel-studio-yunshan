import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleAssetIds,meshMaterialSignature,dirtyMeshChunks,displayAsset,voxelCount} from '../src/client/mesh-plan';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import type {Asset} from '../src/core/types';
function asset(id='a'):Asset{const g=new Grid();g.set([15,0,0],1);g.set([16,0,0],2);g.set([40,2,2],3);return{id,name:id,version:1,category:'base',cellSize:.01,origin:[0,0,0],chunks:g.serialize(),parts:[],ports:[],openings:[]};}

test('library models mesh only when selected or actually instantiated; placements share cache',()=>{const p=newProject();p.assets={a:asset('a'),b:asset('b'),c:asset('c')};p.instances={one:{id:'one',name:'one',assetId:'a',position:[0,0,0],rotation:0,parent:null},two:{id:'two',name:'two',assetId:'a',position:[1,0,0],rotation:0,parent:null}};assert.deepEqual(visibleAssetIds(p,'asset','b'),['b']);assert.deepEqual(visibleAssetIds(p,'scene',null),['a']);assert.deepEqual(visibleAssetIds(p,'asset','missing'),[]);});

test('hidden edits compare against each cached source, including neighboring chunks and deletions',()=>{const before=asset(),g=new Grid(before.chunks);g.set([16,0,0],0);const after={...before,chunks:g.serialize()};const keys=dirtyMeshChunks(before,after);assert.ok(keys.includes('1,0,0'));assert.ok(keys.includes('0,0,0'));assert.ok(!keys.includes('3,0,0'));assert.deepEqual(dirtyMeshChunks(after,structuredClone(after)),[]);assert.ok(dirtyMeshChunks(before,{...before,origin:[1,0,0]}).includes('2,0,0'));});

test('region isolation and layers generate display copies without changing native occupancy',()=>{const a=asset(),saved=JSON.stringify(a);const crop=displayAsset(a,null,{min:[15,0,0],max:[17,1,1]});assert.equal(voxelCount(crop),2);assert.equal(voxelCount(displayAsset(a,2,null)),1);assert.equal(voxelCount(displayAsset(a,2,{min:[15,0,0],max:[17,1,1]})),0);assert.equal(JSON.stringify(a),saved);assert.equal(voxelCount(a),3);});

test('palette/roughness changes reuse geometry; opacity and emission presence invalidate correct caches',()=>{const p=newProject(),sig=meshMaterialSignature(p);p.materials[1].color='#113355';p.materials[1].roughness=.2;assert.equal(meshMaterialSignature(p),sig);p.materials[1].opacity=.5;assert.notEqual(meshMaterialSignature(p),sig);const next=meshMaterialSignature(p);p.materials[1].emissive='#00ffff';p.materials[1].intensity=1;assert.notEqual(meshMaterialSignature(p),next);});
