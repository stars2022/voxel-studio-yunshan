import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {Engine,validateProject} from '../src/core/engine';
import {productionProject} from '../src/production/style';
import {Grid} from '../src/core/grid';
import {checkGeometry} from '../src/core/checks';
import {exportProject} from '../src/export/exporter';
import type {Command} from '../src/core/types';

test('1mm native details retain metre coordinates through transactions, collision queries, native and GLB export, undo and invalid-pitch rollback',async()=>{
 const e=new Engine(productionProject('millimetre detail')),commit=(commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},d=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:d.previewToken});};
 commit([{op:'createAsset',id:'micro',name:'micro',template:'empty',cellSize:.001},{op:'voxels',assetId:'micro',mode:'add',cells:[[-2,3,4],[-1,3,4]],material:2},{op:'instance',id:'micro-view',assetId:'micro',position:[.02,0,0]}]);
 assert.equal(e.project.assets.micro.cellSize,.001);assert.deepEqual(new Grid(e.project.assets.micro.chunks).bounds(),{min:[-2,3,4],max:[0,4,5]});validateProject(JSON.parse(JSON.stringify(e.project)));
 const baseline=JSON.stringify(e.project);assert.throws(()=>commit([{op:'createAsset',id:'invalid',name:'invalid',template:'empty',cellSize:.0009}]));assert.equal(JSON.stringify(e.project),baseline);assert.throws(()=>validateProject({...e.project,assets:{micro:{...e.project.assets.micro,cellSize:.0009}}}));
 const check=checkGeometry(e.project,[{name:'micro occupied',min:[.018,.003,.004],max:[.020,.004,.005]}]);assert.equal(check.pitchM,.001);assert.equal(check.occupiedCollisionCells,2);assert.equal(check.clearances[0].occupiedCells,2);assert.deepEqual(check.clearances[0].blockedBy,['micro-view']);
 const dir=await mkdtemp(path.join(os.tmpdir(),'millimetre-export-'));try{await exportProject(e.project,dir,'micro');const native=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));assert.deepEqual(native.assets.micro,e.project.assets.micro);const g=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));const all=g.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).flatMap(p=>Array.from(p.getAttribute('POSITION')!.getArray()!));assert.ok(all.length);for(let d=0;d<3;d++){const values=all.filter((_,i)=>i%3===d);assert.ok(Math.abs(Math.min(...values)-[-.002,.003,.004][d])<1e-8);assert.ok(Math.abs(Math.max(...values)-[0,.004,.005][d])<1e-8);}}finally{await rm(dir,{recursive:true,force:true});}
 commit([{op:'undo'}]);assert.deepEqual(e.project.assets,{});assert.deepEqual(e.project.instances,{});
 commit([{op:'createAsset',id:'pin',name:'1mm template pin',template:'column',cellSize:.001,params:{width:.002,height:.008,depth:.002}}]);
 assert.equal(new Grid(e.project.assets.pin.chunks).count,32);assert.equal(e.project.assets.pin.ports.find(p=>p.id==='top')!.position[1],.008);
 const original=structuredClone(e.project.assets.pin);
 commit([{op:'regenerate',assetId:'pin',params:{height:.010}}]);assert.equal(new Grid(e.project.assets.pin.chunks).count,40);assert.equal(e.project.assets.pin.ports.find(p=>p.id==='top')!.position[1],.010);
 commit([{op:'undo'}]);assert.deepEqual(e.project.assets.pin.chunks,original.chunks);assert.deepEqual(e.project.assets.pin.ports,original.ports);
 const unchanged=JSON.stringify(e.project);assert.throws(()=>commit([{op:'createAsset',id:'too-large',name:'budget probe',template:'column',cellSize:.001}]),/2,000,000/);assert.equal(JSON.stringify(e.project),unchanged);
});
