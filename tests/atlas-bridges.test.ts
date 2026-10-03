import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {bridgeRecipes} from '../src/production/atlas-bridges';
import * as assembly from '../src/production/bridge-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M019'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const {a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(doc:Project){doc.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return doc;}
const clean=(c:ReturnType<typeof checkGeometry>)=>{for(const k of ['collisions','gaps','unsupported','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances));};

test('M019 has twelve distinct connected native masters, exact reference provenance and genuinely empty declared openings',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M019.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(bridgeRecipes).length,12);
 for(const [slot,id] of Object.keys(bridgeRecipes).entries()){
  const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M019');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,bridgeRecipes[id].pitch);assert.equal(a.source!.units,'metres');assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,bridgeRecipes[id].expectedComponents??1,id);assert.ok(g.count<1_000_000,id);assert.ok(a.parts.length>=4,id);
  for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' blocked '+v));for(const port of a.ports)for(const n of port.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,id+' fractional port');
  const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);
 }
});

test('actual cable, road, glass, lamp, masonry and roofing cells have independent physical roles',()=>{
 const checks:[string,V3,string][]=[
 ['BUILT-141',[.01,.18,1],'energy'],['BUILT-141',[.1,.1,1],'metal'],['BUILT-142',[.1,.485,.1],'wall'],['BUILT-142',[.1,.46,.1],'mortar'],['BUILT-142',[.0025,.04,.04],'metal'],
 ['BUILT-143',[.4,.65,2],'suspensionCable'],['BUILT-143',[.4,.15,2],'energy'],['BUILT-143',[.08,.55,.65],'bronze'],['BUILT-144',[.2,5,.2],'wood'],
 ['BUILT-145',[.1,1,-.025],'glass'],['BUILT-145',[.1,1,.025],'energy'],['BUILT-146',[4,.45,4],'pavementConcrete'],['BUILT-147',[.14,.6,.14],'wood'],['BUILT-147',[.22,1.23,.07],'warm'],
 ['BUILT-148',[1,12,80],'suspensionCable'],['BUILT-149',[.35,3,.35],'suspensionCable'],['BUILT-150',[4,.5,4],'structuralConcrete'],['BUILT-151',[.55,30,1],'metal'],
 ['BUILT-152',[.5,2.31,1.2],'roof'],['BUILT-152',[.5,2.25,1.2],'waterproofMembrane'],
 ];for(const[id,v,r]of checks)assert.equal(at(id,v),s[r],id+' '+r+' '+v);
 assert.notEqual(s.suspensionCable,s.metal);assert.notEqual(s.suspensionCable,s.rope);assert.notEqual(s.suspensionCable,s.wood);assert.equal(p.materials[s.suspensionCable].category,'metal');assert.ok(p.materials[s.suspensionCable].solid);
 const missing={...s};delete missing.suspensionCable;assert.throws(()=>makeCatalogAsset('BUILT-143','bad','bad',missing),/缺少材质角色 suspensionCable/);
});

test('catalogue spans, offsets, post widths and openings remain measurable geometry',()=>{
 assert.deepEqual(model('BUILT-141').a.source!.railCenterOffsetsM,[-1.8,1.8]);assert.deepEqual(model('BUILT-142').a.source!.guardSectionM,[.35,.5]);assert.equal(model('BUILT-142').a.cellSize,.005);
 assert.equal(at('BUILT-142',[.1,.2,.3]),0);assert.equal(at('BUILT-147',[.3,1.1,.3]),0);assert.equal(at('BUILT-151',[1,30,1]),0);assert.equal(at('BUILT-144',[2.8,10,2.8]),0);
 assert.deepEqual(model('BUILT-146').a.source!.deckSectionM,[9,.5]);assert.equal((model('BUILT-148').a.source!.suspension as any).spanM,160);assert.equal((model('BUILT-148').a.source!.suspension as any).peakCenterM,30);assert.equal(model('BUILT-152').a.source!.beamHeightM,1.6);
 // Revised M018 seats match the new guide axes, preserving its existing datum.
 assert.equal(at('BUILT-140',[1.15,1.35,.45]),s.bronze);assert.equal(at('BUILT-140',[4.75,1.35,.45]),s.bronze);
});

test('coarse rail bed and fine guard strips assemble without expanding three hundred million individual cells',()=>{
 const e=new Engine(withCatalog(productionProject('track')));commit(e,assembly.bridgeTrackCommands());const check=checkGeometry(e.project,assembly.bridgeTrackClearances);clean(check);assert.equal(check.pitchM,.005);assert.ok(check.occupiedCollisionCells>300_000_000);assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,5);assert.deepEqual(e.project.instances['guides-1'].position,[1.06,1.4,0]);assert.deepEqual(check.contacts['guides-1'],['bed-1']);
});

test('shaft keeps the car path empty and the side guide on supported external brackets; cable fixture realizes 9m/8.5m centres',()=>{
 const e=new Engine(withCatalog(productionProject('shaft')));commit(e,assembly.bridgeShaftCommands());clean(checkGeometry(e.project,assembly.bridgeShaftClearances));assert.deepEqual(e.project.instances['guide-1'].position,[5.85,.8,2.65]);
 const c=new Engine(withCatalog(productionProject('cable fixture')));commit(c,assembly.bridgeCableFixtureCommands(c.project.styles.yunshan));clean(checkGeometry(c.project));assert.equal(c.project.instances['cable-1'].position[1]+.65,9);assert.equal(c.project.instances['cable-1'].position[1]+.15,8.5);
});

test('four independent bridge posts receive four reused horizontal rails with clear travel space',()=>{
 const e=new Engine(withCatalog(productionProject('rail')));commit(e,assembly.bridgeRailCommands());clean(checkGeometry(e.project,assembly.bridgeRailClearances));assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,9);assert.equal(Object.values(e.project.instances).filter(i=>i.assetId==='post').length,4);
});

test('160m main cables, correctly located towers and three central hanger stations have true faces and no intersections',()=>{
 const e=new Engine(withCatalog(productionProject('suspension')));commit(e,assembly.bridgeSuspensionCommands());clean(checkGeometry(e.project,assembly.bridgeSuspensionClearances));
 assert.equal(Object.keys(e.project.assets).length,7);assert.equal(new Set(Object.values(e.project.assets).map(a=>a.source!.catalogId)).size,6);assert.equal(Object.keys(e.project.instances).length,37);
 assert.deepEqual(e.project.instances['tower-0-0'].position,[0,-1,24.6]);assert.deepEqual(e.project.instances['tower-1-1'].position,[11,-1,133.4]);assert.equal(e.project.instances['cap-0'].position[1],32);
 const main=new Grid(e.project.assets.main.chunks),tower=new Grid(e.project.assets.tower.chunks);assert.ok(main.get([6,299,255]));assert.equal(tower.get([6,309,9]),0);assert.equal(tower.get([5,309,9]),s.metal,'tower steel cheek is face-adjacent to main clamp');
});

test('only verified hanger heights rebuild atomically; occupied preferred cable IDs survive with one undo',()=>{
 const doc=withCatalog(newProject());doc.materials[156]={...doc.materials[1],id:156,name:'foreign stone'};const e=new Engine(doc),before=structuredClone(e.project),create={op:'produceCatalogAsset',catalogId:'BUILT-149',id:'hanger',params:{height:12.8}};
 assert.throws(()=>commit(e,[create,{op:'produceCatalogAsset',catalogId:'BUILT-141',id:'bad',params:{height:12.8}}]));assert.deepEqual(e.project,before);commit(e,[create]);assert.deepEqual(e.project.materials[156],before.materials[156]);assert.notEqual(e.project.styles.yunshan.suspensionCable,156);assert.equal((e.project.assets.hanger.source!.dimensionsM as V3)[1],12.8);assert.ok([...new Grid(e.project.assets.hanger.chunks).cells()].some(([,m])=>m===e.project.styles.yunshan.suspensionCable));
 const tall=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'rebuildCatalogAsset',assetId:'hanger',params:{height:13}}]));assert.deepEqual(e.project,tall);commit(e,[{op:'rebuildCatalogAsset',assetId:'hanger',params:{height:12.4}}]);assert.equal((e.project.assets.hanger.source!.dimensionsM as V3)[1],12.4);commit(e,[{op:'undo'}]);const {version:oldVersion,...expected}=tall.assets.hanger,{version:restoredVersion,...restored}=e.project.assets.hanger;assert.ok(restoredVersion>oldVersion);assert.deepEqual(restored,expected);commit(e,[{op:'undo'}]);for(const k of ['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
 assert.throws(()=>makeCatalogAsset('LIFE-001','bad','bad',s,{height:12.4}));
});
test('material pack changes only appearance and exports intact native IDs, with one undo and transaction rollback',async()=>{
 const doc=withCatalog(productionProject('pack'));for(const id of['BUILT-143','BUILT-145','BUILT-152']){const {a}=model(id);doc.assets[a.id]=structuredClone(a);}const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['suspensionCable','energy','glass','roof'];
 commit(e,[{op:'definePalette',name:'M019验证',materials:Object.fromEntries(changed.map((r,i)=>[s[r],{color:['#51ab98','#142239','#efc28c','#abcdab'][i]}]))},{op:'palette',name:'M019验证'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const [id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);if(!changed.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 const applied=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'material',id:s.suspensionCable,properties:{color:'#ff0000'}},{op:'produceCatalogAsset',catalogId:'BUILT-999',id:'bad'}]));assert.deepEqual(e.project,applied);
 const dir=await mkdtemp(path.join(os.tmpdir(),'m019-export-'));try{const exported=await exportProject(e.project,dir,'built-143'),round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,{'built-143':applied.assets['built-143']});assert.deepEqual(round.materials,applied.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(exported.directory,'visual.glb'));assert.ok(glb.getRoot().listMeshes().length);for(const mat of glb.getRoot().listMaterials())assert.ok(Object.values(s).includes((mat.getExtras() as any).voxelMaterialId));}finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);for(const k of ['assets','styles','materials','palettes'] as const)assert.deepEqual(e.project[k],before[k]);
});
