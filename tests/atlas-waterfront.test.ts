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
import {waterfrontRecipes} from '../src/production/atlas-waterfront';
import {waterfrontAssemblyCommands,waterfrontClearances} from '../src/production/waterfront-assembly';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M017'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const {a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(doc:Project){doc.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return doc;}
const clean=(c:ReturnType<typeof checkGeometry>)=>{for(const k of ['collisions','gaps','unsupported','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances));};

test('M017 has twelve distinct connected native masters, exact reference provenance and genuinely empty declared openings',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M017.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(waterfrontRecipes).length,12);
 for(const [slot,id] of Object.keys(waterfrontRecipes).entries()){
  const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M017');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,.04);assert.equal(a.source!.units,'metres');assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id);assert.ok(g.count<1_000_000,id);assert.ok(a.parts.length>=4,id);
  for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' blocked '+v));for(const port of a.ports)for(const n of port.position)assert.ok(Math.abs(n/.04-Math.round(n/.04))<1e-8,id+' fractional port');
  const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);
 }
});

test('real window, display and illuminated sign cells preserve physical material/use semantics',()=>{
 const checks:[string,V3,string][]=[
  ['BUILT-104',[1,3.40,1],'structuralConcrete'],['BUILT-104',[1,3.49,1],'mortar'],['BUILT-104',[1,3.57,1],'wall'],
  ['BUILT-106',[.60,1,.30],'glass'],['BUILT-106',[.60,.34,.30],'rubber'],['BUILT-106',[.02,1,.20],'metal'],
  ['BUILT-109',[2.70,.80,.10],'signDiffuser'],['BUILT-109',[3,.93,.05],'printedDark'],['BUILT-109',[2.8,.8,.21],'warm'],
  ['BUILT-113',[.30,3,.05],'screen'],['BUILT-113',[.30,3,-.02],'glass'],['BUILT-113',[.59,3.4,-.06],'displayGlyph'],['BUILT-113',[.45,3.66,-.06],'displayWhite'],
  ['BUILT-113',[.5,5,.5],'wood'],['BUILT-114',[2.65,.81,-.14],'displayWhite'],['BUILT-115',[.60,1,.38],'glass'],
 ];
 for(const [id,v,role] of checks)assert.equal(at(id,v),s[role],id+' '+role+' '+v);
 const missing={...s};delete missing.screen;assert.throws(()=>makeCatalogAsset('BUILT-113','bad','bad',missing),/缺少材质角色 screen/);
 for(const id of Object.keys(waterfrontRecipes)){const used=new Set([...model(id).g.cells()].map(([,m])=>m));for(const r of ['paper','paperSheet','fruitRed','fabric','flueLiner','energyField'])assert.ok(!used.has(s[r]),id+' borrowed '+r);}
});

test('catalogue dimensions, clear entry spans and reusable pile/rail counts remain physical metres',()=>{
 assert.equal(model('BUILT-104').g.bounds()!.max[1]*.04,3.6);assert.equal(model('BUILT-107').g.bounds()!.max[1],140);assert.equal(model('BUILT-110').g.bounds()!.max[1]*.04,6);assert.equal(model('BUILT-113').g.bounds()!.max[1]*.04,6);
 assert.equal(model('BUILT-112').a.source!.deckThicknessM,.6);assert.equal(model('BUILT-114').a.source!.verticalBarCount,7);assert.equal(model('BUILT-111').a.source!.centralDoorWidthM,4.32);
 for(const v of [[4,0,.3],[6,2,.4],[8,3.16,.2]] as V3[])assert.equal(at('BUILT-111',v),0);assert.equal(at('BUILT-110',[2,2,2]),0);assert.equal(at('BUILT-112',[4,1,2]),0);
});

test('dock uses three masters and repeated supported piles while keeping the boarding passage open',()=>{
 const e=new Engine(withCatalog(productionProject('dock assembly')));commit(e,waterfrontAssemblyCommands());clean(checkGeometry(e.project,waterfrontClearances));assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,9);assert.equal(Object.values(e.project.instances).filter(i=>i.assetId==='pile').length,6);
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'createAsset',id:'fine',name:'wrong pitch',template:'empty',cellSize:.02},{op:'metadata',assetId:'fine',ports:[{id:'foot',kind:'dock-pile',position:[.6,0,.6],normal:[0,-1,0],size:[1.2,0,1.2],pitch:.02}]},{op:'connect',id:'wrong',assetId:'fine',portId:'foot',targetInstanceId:'deck-1',targetPortId:'pile-0-0',rotation:0}]),/格距/);assert.deepEqual(e.project,before);
});

test('clinic window sections join without collision, blocked ventilation or seam gap',()=>{
 const e=new Engine(withCatalog(productionProject('clinic')));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-115',id:'window'},{op:'instance',id:'left',assetId:'window',position:[0,0,0]},{op:'connect',id:'right',assetId:'window',portId:'left',targetInstanceId:'left',targetPortId:'right',rotation:0}]);clean(checkGeometry(e.project));assert.deepEqual(e.project.instances.right.position,[6,0,0]);assert.equal(Object.keys(e.project.assets).length,1);
});

test('material pack changes only appearance and exports intact native IDs, with one undo and transaction rollback',async()=>{
 const doc=withCatalog(productionProject('pack'));for(const id of['BUILT-106','BUILT-109','BUILT-113']){const {a}=model(id);doc.assets[a.id]=structuredClone(a);}const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['glass','screen','displayGlyph','signDiffuser'];
 commit(e,[{op:'definePalette',name:'M017验证',materials:Object.fromEntries(changed.map((r,i)=>[s[r],{color:['#51ab98','#142239','#efc28c','#abcdab'][i]}]))},{op:'palette',name:'M017验证'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const [id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);if(!changed.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 const applied=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'material',id:s.glass,properties:{color:'#ff0000'}},{op:'produceCatalogAsset',catalogId:'BUILT-999',id:'bad'}]));assert.deepEqual(e.project,applied);
 const dir=await mkdtemp(path.join(os.tmpdir(),'m017-export-'));try{const exported=await exportProject(e.project,dir,'built-113'),round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,{'built-113':applied.assets['built-113']});assert.deepEqual(round.materials,applied.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(exported.directory,'visual.glb'));assert.ok(glb.getRoot().listMeshes().length);for(const mat of glb.getRoot().listMaterials())assert.ok(Object.values(s).includes((mat.getExtras() as any).voxelMaterialId));}finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);for(const k of ['assets','styles','materials','palettes'] as const)assert.deepEqual(e.project[k],before[k]);
});
