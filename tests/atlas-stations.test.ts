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
import {stationRecipes} from '../src/production/atlas-stations';
import * as assembly from '../src/production/station-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {layoutAtlasGallery} from '../src/production/gallery-layout';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';
const p=productionProject('M020'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const {a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function doc(name:string){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
function clean(c:ReturnType<typeof checkGeometry>,unsupported:string[]=[]){assert.deepEqual(c.unsupported,unsupported);for(const k of['collisions','gaps','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances));}

test('M020 has twelve distinct native masters, measured dimensions, source hashes and empty openings; only eleven separated glazing panels are intentional',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M020.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(stationRecipes).length,12);
 for(const [slot,id]of Object.keys(stationRecipes).entries()){const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M020');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,stationRecipes[id].pitch);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,stationRecipes[id].expectedComponents??1,id);assert.ok(g.count<1_000_000);assert.ok(a.parts.length>=4);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));for(const port of a.ports)for(const n of port.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,id);const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const d=productionProject(id);d.assets[a.id]=a;validateProject(d);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);}
});
test('signals, vehicle seals, glass, lamp cores, wood and blank enamel signs retain actual physical roles',()=>{
 for(const[id,v,r]of[
  ['BUILT-153',[5,2.95,8],'wall'],['BUILT-154',[2.05,.95,2.05],'wall'],['BUILT-155',[2,3,4.9],'wood'],['BUILT-155',[3,6.25,3],'waterproofMembrane'],
  ['BUILT-156',[.425,4.925,.225],'signalStopLamp'],['BUILT-156',[.425,4.525,.225],'signalCautionLamp'],['BUILT-156',[.425,4.125,.225],'signalGoLamp'],['BUILT-156',[.425,4.925,.175],'glass'],
  ['BUILT-157',[2.15,2,.5],'wood'],['BUILT-158',[4,1.25,20],'pavementConcrete'],['BUILT-158',[8.25,.25,20],'structuralConcrete'],
  ['BUILT-159',[1,.075,.5],'warm'],['BUILT-159',[1,.125,.5],'glass'],['BUILT-160',[.35,.175,.35],'energy'],['BUILT-160',[.35,.275,.35],'glass'],
  ['BUILT-177',[1,.2,1],'wood'],['BUILT-177',[.075,.6,2],'enamel'],['BUILT-178',[.025,.025,.25],'vehicleSeal'],['BUILT-178',[.025,.8,.8],'glass'],
  ['BUILT-179',[.0375,.0875,1],'energy'],['BUILT-179',[.0125,.0875,1],'glass'],['BUILT-183',[.5,3,.175],'enamel'],
 ] as [string,V3,string][])assert.equal(at(id,v),s[r],id+' '+r+' '+v);
 for(const role of['signalStopLamp','signalCautionLamp','signalGoLamp']){assert.equal(p.materials[s[role]].category,'emissive');assert.notEqual(s[role],s.signalRed);assert.equal(p.materials[s[role]].intensity,0);}
 assert.equal(p.materials[s.vehicleSeal].category,'rubber');assert.notEqual(s.vehicleSeal,s.rubber);assert.equal(at('BUILT-183',[.5,3,.075]),0,'blank sign has no baked letter');
});
test('mixed-pitch display galleries keep the 960m runway independent of 25mm trim without changing native cells',()=>{
 const d=productionProject('gallery');for(const id of Object.keys(stationRecipes)){const {a}=model(id);d.assets[a.id]=a;d.instances[id]={id,assetId:a.id,name:id,position:[0,0,0],rotation:0,parent:null};}
 const hashes=Object.values(d.assets).map(a=>createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex'));layoutAtlasGallery(d);const c=checkGeometry(d);clean(c);assert.equal(c.collisionGrids.length,12);assert.deepEqual(Object.values(d.assets).map(a=>createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex')),hashes);
});
test('22x18m platform receives two six-metre canopy posts and a node-offset signal with a clear passenger path',()=>{
 const e=new Engine(doc('platform'));commit(e,assembly.stationPlatformCommands());clean(checkGeometry(e.project,assembly.stationPlatformClearances));assert.deepEqual(e.project.instances['canopy-1'].position,[-.5,1,3.5]);assert.deepEqual(e.project.instances['signal-1'].position,[22.5,0,19.5]);assert.deepEqual(e.project.assets.platform.source!.platform,{widthM:22,depthM:18,thicknessM:1});assert.deepEqual(e.project.assets.signal.source!.signal,{state:'unbound',lit:false,runtimeBinding:false});
});
test('the 3m authored bridge end joins a separate deck, keeps access open and retains the historical unintegrated high-block failure',()=>{
 const e=new Engine(doc('abutment'));commit(e,assembly.stationBridgeCommands(e.project.styles.yunshan));clean(checkGeometry(e.project,assembly.stationBridgeClearances));assert.deepEqual(e.project.instances['deck-1'].position,[1.5,2.5,10]);const meta=e.project.assets.abutment.source!.abutment as any;assert.equal(meta.blockHeightM,Math.max(1,meta.authoredDeckM-meta.authoredTerrainM));assert.match(meta.historicalFailure,/154\.6m/);assert.equal(Object.values(e.project.assets).filter(a=>a.source?.catalogId).length,2);
});
test('the real 960m runway installs at 710 to 1670 and Y14.6 using an explicit grid phase, with independent marks and symmetric lights',()=>{
 const e=new Engine(doc('runway'));commit(e,assembly.stationRunwayCommands());const c=checkGeometry(e.project,assembly.stationRunwayClearances);clean(c,assembly.stationRunwayUnsupported);assert.equal(c.pitchM,.05);assert.ok(c.occupiedCollisionCells>100_000_000);assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,37);
 assert.deepEqual(e.project.assets.runway.origin,[0,.1,0]);assert.deepEqual(e.project.instances['runway-1'].position,[710,13,-22]);assert.equal(13+.1+1.5,14.6);assert.equal(710+960,1670);for(let i=0;i<12;i++){assert.equal(e.project.instances['mark-'+i].position[1],14.6);assert.equal(e.project.instances[`light-${i}-0`].position[2]+.45,-16.5);assert.equal(e.project.instances[`light-${i}-1`].position[2]+.45,16.5);}
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'instance',id:'invalid',assetId:'runway',position:[710,13.1,-22]}]),/格距/);assert.deepEqual(e.project,before);
});
test('three independent vehicle modules have a hollow passenger space, open side door and exact width/length relationships',()=>{
 const e=new Engine(doc('vehicle'));commit(e,assembly.stationVehicleCommands());clean(checkGeometry(e.project,assembly.stationVehicleClearances));assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,3);assert.deepEqual(e.project.instances['glazing-1'].position,[0,1.4,0]);const meta=e.project.assets.trim.source!.vehicle as any;assert.deepEqual(e.project.assets.trim.source!.dimensionsM,[3+.25,.2,10*.85]);assert.equal(meta.widthAdditionM,.25);assert.equal((e.project.assets.body.source!.vehicle as any).originalModeDimensionsAvailable,false);
});
test('junction and blank pad sign stay outside the travel strip and retain explicit node and pad bindings',()=>{
 const e=new Engine(doc('signs'));commit(e,assembly.stationSignsCommands());clean(checkGeometry(e.project,assembly.stationSignsClearances));const {anchorM,nodeOffsetM}=e.project.assets.junction.source!;assert.deepEqual((anchorM as V3).map((x,i)=>x+e.project.instances['junction-1'].position[i]),nodeOffsetM);assert.equal((e.project.assets['pad-sign'].source!.sign as any).blank,true);
});
test('station finish changes retain geometry and inactive signal semantics; native and GLB exports preserve seal and glass roles, then undo once',async()=>{
 const e=new Engine(doc('materials'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-156',id:'signal'},{op:'produceCatalogAsset',catalogId:'BUILT-178',id:'glass'}]);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const role of['signalStopLamp','signalCautionLamp','signalGoLamp'])assert.equal(e.project.materials[s[role]].intensity,0);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'m020-export-'));try{const exported=await exportProject(e.project,dir,'glass'),round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets.glass,e.project.assets.glass);assert.deepEqual(round.materials,e.project.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(exported.directory,'visual.glb'));assert.ok(glb.getRoot().listMaterials().some(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.vehicleSeal')));}finally{await rm(dir,{recursive:true,force:true});}commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});
test('new signal and glazing roles preserve occupied IDs, reject unverified shape controls and roll back atomically',()=>{
 const p=newProject();p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};for(const id of[157,158,159,160])p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project),create={op:'produceCatalogAsset',catalogId:'BUILT-178',id:'glazing'};
 assert.throws(()=>commit(e,[create,{op:'produceCatalogAsset',catalogId:'BUILT-177',id:'bad',params:{height:4}}]));assert.deepEqual(e.project,before);commit(e,[create]);for(const id of[157,158,159,160])assert.deepEqual(e.project.materials[id],before.materials[id]);assert.notEqual(e.project.styles.yunshan.vehicleSeal,160);assert.ok([...new Grid(e.project.assets.glazing.chunks).cells()].some(([,m])=>m===e.project.styles.yunshan.vehicleSeal));commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
});
