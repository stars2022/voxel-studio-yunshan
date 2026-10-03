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
import {transportRecipes} from '../src/production/atlas-transport';
import * as assembly from '../src/production/transport-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M018'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const {a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(doc:Project){doc.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return doc;}
const clean=(c:ReturnType<typeof checkGeometry>)=>{for(const k of ['collisions','gaps','unsupported','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances));};

test('M018 has twelve distinct connected native masters, exact reference provenance and genuinely empty declared openings',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M018.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(transportRecipes).length,12);
 for(const [slot,id] of Object.keys(transportRecipes).entries()){
  const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M018');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,transportRecipes[id].pitch);assert.equal(a.source!.units,'metres');assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,transportRecipes[id].expectedComponents??1,id);assert.ok(g.count<1_000_000,id);assert.ok(a.parts.length>=4,id);
  for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' blocked '+v));for(const port of a.ports)for(const n of port.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,id+' fractional port');
  const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);
 }
});

test('actual cells distinguish medical ink, glass cover, pavement, ceramic inlay, joint seals and bridge bearings',()=>{
 const checks:[string,V3,string][]=[
  ['BUILT-116',[1,1,.03],'printedRed'],['BUILT-116',[.5,.5,.05],'enamel'],
  ['BUILT-117',[1,.1,.03],'glass'],['BUILT-117',[1,.1,.13],'energy'],['BUILT-117',[4.6,1,.13],'warm'],
  ['BUILT-131',[1,.47,.5],'pavementConcrete'],['BUILT-131',[1,.43,.5],'structuralConcrete'],
  ['BUILT-132',[.02,.07,.2],'roadInlay'],['BUILT-132',[.02,.01,.2],'jointSeal'],
  ['BUILT-133',[1,.04,.05],'jointSeal'],['BUILT-134',[.1,.1,.1],'wall'],
  ['BUILT-135',[1,.18,.1],'woodEdge'],['BUILT-136',[3,1,3],'structuralConcrete'],
  ['BUILT-137',[1,16,1],'structuralConcrete'],['BUILT-138',[1.5,1.7,1.5],'bridgeBearing'],
  ['BUILT-139',[1,.2,.2],'wood'],['BUILT-140',[2,1.1,2],'structuralConcrete'],
 ];for(const[id,v,role]of checks)assert.equal(at(id,v),s[role],id+' '+role+' '+v);
 const roles=['pavementConcrete','roadInlay','bridgeBearing','jointSeal','rubber','waterproofMembrane'];assert.equal(new Set(roles.map(r=>s[r])).size,roles.length);
 for(const [role,category]of [['pavementConcrete','concrete'],['roadInlay','ceramic'],['bridgeBearing','rubber'],['jointSeal','rubber'],['printedRed','ink']])assert.equal(p.materials[s[role]].category,category);
 const missing={...s};delete missing.bridgeBearing;assert.throws(()=>makeCatalogAsset('BUILT-138','bad','bad',missing),/缺少材质角色 bridgeBearing/);
});

test('specified metre dimensions and installation recesses are real cells',()=>{
 for(const[id,size]of [['BUILT-131',[10,.5,2]],['BUILT-132',[.16,.08,2]],['BUILT-133',[7,.08,.12]],['BUILT-134',[9.9,.2,2]],['BUILT-136',[7,2,7]],['BUILT-138',[7,1.8,4]],['BUILT-140',[6,1.4,8]]] as [string,V3][]){const {a,g}=model(id),b=g.bounds()!;b.max.forEach((n,i)=>assert.ok(Math.abs((n-b.min[i])*a.cellSize-size[i])<1e-8,id));}
 assert.equal(model('BUILT-116').a.source!.symbolSpanM,1.8);assert.equal(at('BUILT-116',[.21,1,.03]),s.printedRed);assert.notEqual(at('BUILT-116',[.19,1,.03]),s.printedRed);
 assert.equal(at('BUILT-131',[2,.47,1]),0);assert.equal(at('BUILT-140',[1,.5,1]),0);
 const bed=model('BUILT-140').a;assert.deepEqual((bed.source!.trackPlacement as any).bedCenterRelativeToTrackM,[0,-.9,0]);assert.equal(bed.ports.find(p=>p.id==='track-datum')!.position[1],1.6);assert.ok(Math.abs(1.4/2-1.6+.9)<1e-8);
 assert.deepEqual(model('BUILT-137').a.source!.tieRule,{thresholdM:25,spacingM:16,authoredLevelsM:[16]});
});

test('road pieces support each other on the shared 10mm collision grid with clear drains and travel space',()=>{
 const e=new Engine(withCatalog(productionProject('road')));commit(e,assembly.transportRoadCommands());const check=checkGeometry(e.project,assembly.transportRoadClearances);clean(check);assert.equal(check.pitchM,.01);assert.equal(Object.keys(e.project.assets).length,4);assert.deepEqual(e.project.instances['joint-1'].position,[1.5,.42,.94]);assert.deepEqual(e.project.instances['line-1'].position,[4.92,.5,0]);assert.deepEqual(e.project.instances['curbs-1'].position,[.05,.5,0]);
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'createAsset',id:'fine',name:'wrong pitch',template:'empty',cellSize:.01},{op:'metadata',assetId:'fine',ports:[{id:'p',kind:'road-line',position:[.08,0,1],normal:[0,-1,0],size:[.16,0,2],pitch:.01}]},{op:'connect',id:'bad',assetId:'fine',portId:'p',targetInstanceId:'road-1',targetPortId:'line',rotation:0}]),/格距/);assert.deepEqual(e.project,before);
});

test('pier, cap and bed dock at their actual bearing faces; high-pier ties rest on the 16m saddle',()=>{
 for(const commands of [assembly.transportViaductCommands(),assembly.transportTieCommands()]){const e=new Engine(withCatalog(productionProject('viaduct')));commit(e,commands);clean(checkGeometry(e.project));if(e.project.instances['bed-1'])assert.deepEqual(e.project.instances['bed-1'].position,[.5,35.8,-.5]);else {assert.deepEqual(e.project.instances['tie-1'].position,[5,18,3.2]);assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,5);}}
});

test('medical plaque and horizontal rails mount to explicit non-catalogued fixtures and preserve a 2m intersection cut',()=>{
 const e=new Engine(withCatalog(productionProject('fixtures')));commit(e,assembly.transportFixtureCommands(e.project.styles.yunshan));clean(checkGeometry(e.project,assembly.transportFixtureClearances));assert.equal(Object.values(e.project.assets).filter(a=>a.source?.catalogId).length,2);
});

test('new road material roles allocate around foreign IDs and roll back in the same creation transaction',()=>{
 const doc=withCatalog(newProject());for(const id of [152,153,154,155])doc.materials[id]={...doc.materials[1],id,name:'foreign-'+id};const e=new Engine(doc),before=structuredClone(e.project),commands=[{op:'produceCatalogAsset',catalogId:'BUILT-132',id:'line'},{op:'produceCatalogAsset',catalogId:'BUILT-138',id:'cap'}];
 assert.throws(()=>commit(e,[...commands,{op:'produceCatalogAsset',catalogId:'BUILT-999',id:'bad'}]));assert.deepEqual(e.project,before);commit(e,commands);
 for(const id of [152,153,154,155])assert.deepEqual(e.project.materials[id],before.materials[id]);for(const r of ['roadInlay','bridgeBearing','jointSeal']){const m=e.project.styles.yunshan[r];assert.ok(![152,153,154,155].includes(m));assert.ok(Object.values(e.project.assets).some(a=>[...new Grid(a.chunks).cells()].some(([,id])=>id===m)));}
 commit(e,[{op:'undo'}]);for(const k of ['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
});
test('material pack changes only appearance and exports intact native IDs, with one undo and transaction rollback',async()=>{
 const doc=withCatalog(productionProject('pack'));for(const id of['BUILT-131','BUILT-132','BUILT-138']){const {a}=model(id);doc.assets[a.id]=structuredClone(a);}const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['pavementConcrete','roadInlay','bridgeBearing','jointSeal'];
 commit(e,[{op:'definePalette',name:'M018验证',materials:Object.fromEntries(changed.map((r,i)=>[s[r],{color:['#51ab98','#142239','#efc28c','#abcdab'][i]}]))},{op:'palette',name:'M018验证'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const [id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);if(!changed.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 const applied=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'material',id:s.bridgeBearing,properties:{color:'#ff0000'}},{op:'produceCatalogAsset',catalogId:'BUILT-999',id:'bad'}]));assert.deepEqual(e.project,applied);
 const dir=await mkdtemp(path.join(os.tmpdir(),'m018-export-'));try{const exported=await exportProject(e.project,dir,'built-138'),round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,{'built-138':applied.assets['built-138']});assert.deepEqual(round.materials,applied.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(exported.directory,'visual.glb'));assert.ok(glb.getRoot().listMeshes().length);for(const mat of glb.getRoot().listMaterials())assert.ok(Object.values(s).includes((mat.getExtras() as any).voxelMaterialId));}finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);for(const k of ['assets','styles','materials','palettes'] as const)assert.deepEqual(e.project[k],before[k]);
});
