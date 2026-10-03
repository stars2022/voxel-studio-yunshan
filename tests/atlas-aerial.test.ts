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
import {aerialRecipes} from '../src/production/atlas-aerial';
import * as assembly from '../src/production/aerial-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {layoutAtlasGallery} from '../src/production/gallery-layout';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';
const p=productionProject('M021'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const {a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function doc(name:string){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
function clean(c:ReturnType<typeof checkGeometry>,unsupported:string[]=[],nearPairs:string[][]=[]){assert.deepEqual(c.unsupported,unsupported);assert.deepEqual(c.gaps.map(g=>g.instances),nearPairs);for(const g of c.gaps)assert.ok(Math.abs(g.distanceM-.1)<1e-8);for(const k of['collisions','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances));}

test('M021 has twelve measured native masters, faithful source hashes, empty openings and two intentional side windows',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M021.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(aerialRecipes).length,12);
 for(const [slot,id]of Object.keys(aerialRecipes).entries()){const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M021');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,aerialRecipes[id].pitch);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,aerialRecipes[id].expectedComponents??1,id);assert.ok(g.count<1_000_000);assert.ok(a.parts.length>=5);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));const bounds=g.bounds()!,size=bounds.max.map((v,i)=>(v-bounds.min[i])*a.cellSize);assert.ok(size.every((v,i)=>Math.abs(v-(id==='BUILT-206'?[9,1.2,8.2]:aerialRecipes[id].size)[i])<1e-10),id);const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const d=productionProject(id);d.assets[a.id]=a;validateProject(d);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);}
});
test('aircraft coating, golden blade, landing rubber, window seal, glass, control pixels and bridge layers use distinct real cells',()=>{
 for(const[id,v,r]of[
  ['BUILT-186',[.4,.15,.03],'metalBright'],['BUILT-187',[.5,.07,.03],'rotorBlade'],['BUILT-187',[.1,.03,.1],'metalBright'],['BUILT-188',[.1,.03,.1],'landingPadRubber'],
  ['BUILT-189',[.1,.05,.5],'aircraftSkin'],['BUILT-189',[.07,.3,.14],'vehicleSeal'],['BUILT-189',[.09,.5,.5],'glass'],['BUILT-190',[.2,.19,.4],'aircraftSkin'],['BUILT-190',[.6,.15,.8],'glass'],
  ['BUILT-191',[2.1,.01,1],'aircraftSkin'],['BUILT-192',[.19,1.5,1.5],'aircraftSkin'],['BUILT-193',[1,.01,.5],'aircraftSkin'],['BUILT-194',[.61,.5,.3],'aircraftSkin'],
  ['BUILT-195',[.22,.16,1.15],'screen'],['BUILT-195',[.26,.175,1.17],'displayGlyph'],['BUILT-195',[.17,.13,.54],'polymerDark'],
  ['BUILT-205',[4,.45,4],'pavementConcrete'],['BUILT-205',[4,.2,4],'structuralConcrete'],['BUILT-205',[4,.55,.05],'jointSeal'],['BUILT-206',[4,1.1,4],'structuralConcrete'],['BUILT-206',[4,1.1,-.05],'metal'],
 ] as [string,V3,string][])assert.equal(at(id,v),s[r],id+' '+r+' '+v);
 for(const x of[.07,.13,1.67,1.73])assert.equal(at('BUILT-189',[x,.5,.5]),0,'No opaque seal covers either glass face');assert.equal(p.materials[s.aircraftSkin].category,'metal');assert.notEqual(s.aircraftSkin,s.wall);assert.notEqual(s.aircraftSkin,s.enamel);assert.equal(p.materials[s.rotorBlade].category,'metal');assert.notEqual(s.rotorBlade,s.bronze);assert.equal(p.materials[s.landingPadRubber].category,'rubber');assert.notEqual(s.landingPadRubber,s.rubber);assert.notEqual(s.landingPadRubber,s.vehicleSeal);
});
test('four arms, four blades and four legs dock to an explicit auxiliary fixture with real vertical contacts',()=>{
 const e=new Engine(doc('quad'));commit(e,assembly.aerialQuadCommands(s));const c=checkGeometry(e.project,assembly.aerialQuadClearances);clean(c);assert.equal(Object.keys(e.project.assets).length,4);assert.equal(Object.keys(e.project.instances).length,13);assert.equal(Object.values(e.project.assets).filter(a=>a.source?.catalogId).length,3);
 for(let i=0;i<4;i++){assert.ok(c.contacts['blade-'+i].includes('arm-'+i));assert.ok(c.contacts['arm-'+i].includes('fixture-1'));}assert.equal((e.project.assets.blade.source!).animation,false);
});
test('two separated cockpit windows receive the roof and leave the authored eye line open above the low console',()=>{
 const e=new Engine(doc('cockpit'));commit(e,assembly.aerialCockpitCommands(s));clean(checkGeometry(e.project,assembly.aerialCockpitClearances));assert.deepEqual(e.project.instances['roof-1'].position,[0,1.4,0]);assert.equal(gridComponents(new Grid(e.project.assets.glazing.chunks)).length,2);assert.equal((e.project.assets.console.source!.cockpit as any).installedTopYM,.4);assert.equal(e.project.assets.glazing.source!.originalVehicleStateAvailable,false);
});
test('8.4m wing root is supported independently while the 4m tail, fin and power box assemble without covering intake cavities',()=>{
 for(const [commands,clearances]of[[assembly.aerialWingCommands(s),assembly.aerialWingClearances],[assembly.aerialTailCommands(),assembly.aerialTailClearances]] as const){const e=new Engine(doc('wing-tail'));commit(e,commands);clean(checkGeometry(e.project,clearances));}
});
test('six high-bridge decks, five joints and six beams keep exact 254.6/254/252.8 elevations, support contacts and historical limitations',()=>{
 const e=new Engine(doc('bridge'));commit(e,assembly.aerialBridgeCommands());const c=checkGeometry(e.project,assembly.aerialBridgeClearances);clean(c,assembly.aerialBridgeUnsupported,assembly.aerialBridgeNearPairs);assert.equal(Object.keys(e.project.instances).length,17);assert.equal(new Set(Object.values(e.project.assets).map(a=>a.source?.catalogId)).size,2);
 for(let i=0;i<6;i++){assert.equal(e.project.instances['beam-'+i].position[1],252.8);assert.equal(e.project.instances['deck-'+i].position[1],254);assert.ok(c.contacts['deck-'+i].includes('beam-'+i));if(i<5){assert.ok(c.contacts['joint-'+i].includes('beam-'+i));assert.ok(c.contacts['joint-'+i].includes('beam-'+(i+1)));}}
 assert.deepEqual(e.project.assets.joint.source!.dimensionsM,[9,.6,.2]);for(const a of Object.values(e.project.assets)){const meta=a.source!.bridge as any;assert.equal(meta.originalGameFinalPass,false);assert.deepEqual(meta.historicalFailures,['giant block / ray mismatch','new lower pier conflict']);}
 const before=structuredClone(e.project);for(const depth of[.3,4])assert.throws(()=>commit(e,[{op:'rebuildCatalogAsset',assetId:'joint',params:{depth}}]));assert.deepEqual(e.project,before);
});
test('new aircraft roles remain separate through appearance changes, native and GLB export, then undo once',async()=>{
 const e=new Engine(doc('materials'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-187',id:'blade'},{op:'produceCatalogAsset',catalogId:'BUILT-188',id:'leg'},{op:'produceCatalogAsset',catalogId:'BUILT-189',id:'glazing'}]);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'m021-export-'));try{const exported=await exportProject(e.project,dir,'blade'),round=JSON.parse(await readFile(path.join(exported.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,{blade:e.project.assets.blade});assert.deepEqual(round.materials,e.project.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(exported.directory,'visual.glb'));assert.ok(glb.getRoot().listMaterials().some(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.rotorBlade')));}finally{await rm(dir,{recursive:true,force:true});}commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});
test('occupied IDs and missing roles are preserved, new roles create atomically, and unverified depth rejects without partial changes',()=>{
 const p=newProject();p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};for(const id of[161,162,163])p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project),create={op:'produceCatalogAsset',catalogId:'BUILT-187',id:'blade'};
 assert.throws(()=>commit(e,[create,{op:'produceCatalogAsset',catalogId:'BUILT-191',id:'bad',params:{depth:8}}]));assert.deepEqual(e.project,before);commit(e,[create]);for(const id of[161,162,163])assert.deepEqual(e.project.materials[id],before.materials[id]);assert.notEqual(e.project.styles.yunshan.rotorBlade,162);assert.ok([...new Grid(e.project.assets.blade.chunks).cells()].some(([,m])=>m===e.project.styles.yunshan.rotorBlade));commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);const missing={...s};delete missing.rotorBlade;assert.throws(()=>makeCatalogAsset('BUILT-187','missing','missing',missing),/缺少材质角色/);
});
