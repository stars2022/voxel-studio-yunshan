import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {parseCatalogCSV} from '../src/core/catalog';
import {productionProject,productionStyleCommands} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {exportProject} from '../src/export/exporter';
import type {Command,V3} from '../src/core/types';

function commit(e:Engine,commands:Command[]){const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:dry.previewToken});}
function microscope(){const p=productionProject('semantic microscope');p.assets.scope=makeLifeAsset('LIFE-114','scope','scope',p.styles.yunshan);return p;}

test('the optical glass, emitting layer, bright core, screen graphics, coating and structural metals are independently addressable',()=>{
 const p=microscope(),s=p.styles.yunshan,a=p.assets.scope,g=new Grid(a.chunks),at=(v:V3)=>g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);
 const roles=['glass','opticsGlow','lightCore','screen','displayGlyph','enamel','metal','bronze'];assert.equal(new Set(roles.map(r=>s[r])).size,roles.length);
 for(const role of roles)assert.ok([...g.cells()].some(([,m])=>m===s[role]),role+' must be used in actual voxels');
 assert.equal(at([.11,.485,-.025]),s.glass);assert.equal(at([.11,.485,-.020]),s.lightCore);assert.equal(at([.125,.485,-.015]),s.opticsGlow);
 assert.equal(at([.19,.34,.16]),s.lightCore);assert.equal(at([.17,.335,.16]),s.opticsGlow);assert.equal(at([.145,.33,.16]),s.glass);
 const e=new Engine(p),before=structuredClone(e.project);const result=commit(e,[{op:'material',id:s.opticsGlow,properties:{color:'#b722e3',emissive:'#b722e3',intensity:3}}]);
 assert.equal(result.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const role of roles.filter(r=>r!=='opticsGlow'))assert.deepEqual(e.project.materials[s[role]],before.materials[s[role]]);
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});

test('catalog creation allocates missing semantic IDs without overwriting foreign IDs; undo and failed batches restore bindings',async()=>{
 const p=newProject(),row=parseCatalogCSV(await readFile(new URL('../projects/catalog/city-assets.csv',import.meta.url),'utf8')).find(e=>e.id==='LIFE-114')!;
 p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:{[row.id]:row}};p.materials[53]={...p.materials[1],id:53,name:'foreign stone',color:'#773366'};
 const e=new Engine(p),before=structuredClone(e.project),command={op:'produceCatalogAsset',catalogId:'LIFE-114',id:'scope'};
 const preview=e.execute({expectedVersion:0,requestId:'probe',commands:[command],dryRun:true});assert.deepEqual(e.project,before);assert.ok(preview.warnings.some(w=>w.includes('opticsGlow')));
 assert.throws(()=>commit(e,[command,{op:'material',id:1,properties:{roughness:-1}}]));assert.deepEqual(e.project,before);
 commit(e,[command]);assert.deepEqual(e.project.materials[53],before.materials[53]);assert.notEqual(e.project.styles.yunshan.opticsGlow,53);
 for(const role of['opticsGlow','lightCore','enamel','displayGlyph']){const id=e.project.styles.yunshan[role];assert.equal(e.project.materials[id].source,'yunshan.role.'+role);assert.ok([...new Grid(e.project.assets.scope.chunks).cells()].some(([,m])=>m===id));}
 validateProject(JSON.parse(JSON.stringify(e.project)));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.styles,before.styles);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.assets,before.assets);
 const invalid=structuredClone(before);invalid.styles.yunshan.opticsGlow=65000;assert.throws(()=>validateProject(invalid),/风格引用缺失材质/);
});

test('appearance swaps and GLB/native/atlas/interface export preserve role bindings, occupancy and collision semantics',async()=>{
 const e=new Engine(microscope()),before=structuredClone(e.project),s=e.project.styles.yunshan;commit(e,referenceFinishCommands(e.project));
 for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].id,m.id);assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);}
 assert.deepEqual(e.project.styles,before.styles);assert.deepEqual(e.project.assets,before.assets);
 const directory=await mkdtemp(path.join(os.tmpdir(),'yunshan-roles-'));
 try{await exportProject(e.project,directory,'scope');
  const native=JSON.parse(await readFile(path.join(directory,'voxels.ysvox.json'),'utf8')),interfaces=JSON.parse(await readFile(path.join(directory,'interfaces.json'),'utf8')),atlas=JSON.parse(await readFile(path.join(directory,'atlas.json'),'utf8'));
  validateProject(native);assert.deepEqual(native.assets,before.assets);assert.deepEqual(native.styles,before.styles);assert.deepEqual(interfaces.materialRoles,before.styles);
  const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(directory,'visual.glb'));
  for(const role of['glass','screen','opticsGlow','lightCore','enamel','displayGlyph','bronze']){const id=s[role],m=glb.getRoot().listMaterials().find(m=>m.getExtras().voxelMaterialId===id)!;assert.deepEqual(m.getExtras().materialRoles,['yunshan.'+role]);assert.deepEqual(atlas.materials.find((m:any)=>m.id===id).roles,['yunshan.'+role]);}
  const collision=JSON.parse(await readFile(path.join(directory,'collision.json'),'utf8')),solid=[...new Grid(before.assets.scope.chunks).cells()].filter(([,m])=>before.materials[m].solid).map(([v])=>v);assert.deepEqual(collision.assets[0].cells,solid);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('research controls, printed marks, paper, plastic caps and chart glyphs do not borrow food, stone or fabric roles',()=>{
 const p=productionProject('roles'),s=p.styles.yunshan;assert.equal(p.materials[s.printedMark].category,'ink');assert.equal(p.materials[s.paperSheet].category,'paper');
 for(const n of[113,114,115,117,119,120,121,122]){const a=makeLifeAsset('LIFE-'+n,'test','a'+n,s),ids=new Set([...new Grid(a.chunks).cells()].map(([,m])=>m));
  assert.ok(!ids.has(s.fruitRed),n+': no red fruit controls');
  if([113,114,119,120,121,122].includes(n))assert.ok(ids.has(s.enamel),n+': instrument coating');
  if(n===115){assert.ok(ids.has(s.polymer));assert.ok(ids.has(s.printedMark));assert.ok(!ids.has(s.fabricEdge));assert.ok(!ids.has(s.paper));}
  if(n===117){assert.ok(ids.has(s.displayGlyph));assert.ok(!ids.has(s.fabricEdge));assert.ok(!ids.has(s.paper));}
 }
});


test('resource-pack Schema accepts the complete role library but rejects reclassifying materials or changing collision',()=>{
 const e=new Engine(newProject());commit(e,productionStyleCommands());assert.ok(Object.keys(e.project.styles.yunshan).length>30);
 const before=structuredClone(e.project);for(const property of[{solid:false},{category:'plant'},{id:65000}])assert.throws(()=>commit(e,[{op:'definePalette',name:'bad pack',materials:{2:property}}]));assert.deepEqual(e.project,before);
 // Old saved palettes are readable, but historical semantic fields are not applied.
 const old=structuredClone(e.project);old.palettes.legacy={2:{solid:false,category:'plant',color:'#45a651'}};const legacy=new Engine(old),result=commit(legacy,[{op:'palette',name:'legacy'}]);
 assert.equal(legacy.project.materials[2].solid,true);assert.equal(legacy.project.materials[2].category,'stone');assert.equal(legacy.project.materials[2].color,'#45a651');assert.ok(result.warnings.some(w=>w.includes('非外观字段已忽略')));assert.deepEqual(legacy.project.styles,old.styles);
});

test('large classified material libraries keep atomic upserts, bounded schema, dry-run, duplicate rejection and complete undo',()=>{
 const e=new Engine(newProject()),before=structuredClone(e.project),commands=productionStyleCommands();assert.ok(commands.length<5);
 const env={expectedVersion:e.project.version,requestId:'library-bulk',commands},dry=e.execute({...env,dryRun:true});assert.deepEqual(e.project,before);assert.equal(dry.modifiedVoxels,0);const result=e.execute({...env,previewToken:dry.previewToken});assert.ok(Object.keys(e.project.styles.yunshan).length>100);assert.equal(e.project.materials[e.project.styles.yunshan.candleWax].category,'wax');assert.deepEqual(e.execute(env),result);
 const current=structuredClone(e.project);
 assert.throws(()=>commit(e,[{op:'materialBatch',entries:[{id:1,properties:{color:'#123456'}},{id:1,properties:{color:'#abcdef'}}]}]),/ID 重复/);assert.deepEqual(e.project,current);
 assert.throws(()=>commit(e,[{op:'materialBatch',entries:[{id:1,properties:{color:'#123456'}},{id:65000,properties:{color:'#abcdef'}}]}]),/全部属性/);assert.deepEqual(e.project,current);
 assert.throws(()=>commit(e,[{op:'materialBatch',entries:Array.from({length:257},(_,i)=>({id:i+1,properties:{color:'#123456'}}))}]),/256/);assert.deepEqual(e.project,current);
 commit(e,[{op:'undo'}]);for(const k of['assets','materials','styles','palettes']as const)assert.deepEqual(e.project[k],before[k]);
});

test('M029 plant tissue and drainage roles preserve all fifteen foreign IDs, failed parameters roll back, and one undo removes newly allocated roles',async()=>{
 const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]))};for(let id=210;id<=224;id++)p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'ENV-066',id:'lotus'},{op:'produceCatalogAsset',catalogId:'ENV-082',id:'bad',params:{height:3}}]));assert.deepEqual(e.project,before);
 commit(e,[{op:'produceCatalogAsset',catalogId:'ENV-066',id:'lotus'}]);for(let id=210;id<=224;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);for(const role of['lotusLeaf','aquaticPetiole','lotusPetal','lotusReceptacle','rootRhizome']){const id=e.project.styles.yunshan[role];assert.ok(id>224);assert.ok([...new Grid(e.project.assets.lotus.chunks).cells()].some(([,m])=>m===id));}validateProject(e.project);commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
});

test('M030 imported IDs survive mixed mesh and textured sky production; one undo removes newly allocated semantic roles',async()=>{const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]))};for(let id=225;id<=236;id++)p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'ENV-104',id:'lamp'},{op:'produceCatalogAsset',catalogId:'ENV-114',id:'bad',params:{hour:99}}]));assert.deepEqual(e.project,before);commit(e,[{op:'produceCatalogAsset',catalogId:'ENV-104',id:'lamp'},{op:'produceCatalogAsset',catalogId:'ENV-114',id:'stars'},{op:'produceCatalogAsset',catalogId:'ENV-088',id:'slope'}]);for(let id=225;id<=236;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);assert.ok(e.project.assets.stars.sky!.materials.points>236);assert.equal(e.project.assets.stars.sky!.materials.points,e.project.styles.yunshan.starPoint);assert.equal(e.project.assets.slope.meshes![0].material,e.project.styles.yunshan.soilSubstrate);validateProject(e.project);commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);});

test('M031 skin eye hair leather and noncollision garment roles preserve foreign IDs and creation rollback',async()=>{const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]))};for(let id=237;id<=253;id++)p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'CHAR-003',id:'head'},{op:'produceCatalogAsset',catalogId:'CHAR-002',id:'bad',params:{garment:3}}]));assert.deepEqual(e.project,before);commit(e,[{op:'produceCatalogAsset',catalogId:'CHAR-003',id:'head'},{op:'produceCatalogAsset',catalogId:'CHAR-006',id:'boot'}]);for(let id=237;id<=253;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);for(const role of['skinSurface','eyeWhite','hairMass','characterLeather','characterArmor','characterSole','characterOptic']){const id=e.project.styles.yunshan[role];assert.ok(id>253);assert.equal(e.project.materials[id].solid,false);assert.ok(Object.values(e.project.assets).some(a=>a.meshes?.some(m=>m.material===id)||[...new Grid(a.chunks).cells()].some(([,m])=>m===id)));}validateProject(e.project);commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);});

test('M032 independent suit hat and satchel roles preserve eleven occupied foreign IDs and undo their atomic creation',async()=>{const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]))};for(let id=255;id<=265;id++)p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'CHAR-013',id:'hat'},{op:'produceCatalogAsset',catalogId:'CHAR-014',id:'bad',params:{lid:'half'}}]));assert.deepEqual(e.project,before);commit(e,[{op:'produceCatalogAsset',catalogId:'CHAR-013',id:'hat'},{op:'produceCatalogAsset',catalogId:'CHAR-014',id:'bag'},{op:'produceCatalogAsset',catalogId:'CHAR-059',id:'body'}]);for(let id=255;id<=265;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);for(const role of['modelSuit','modelSuitTrim','hatCloth','hatBand','hatHardware','hatBadgeGlass','bagCloth','bagLeather','bagHardware','bagLining','bagLabel']){const id=e.project.styles.yunshan[role];assert.ok(id>265);assert.equal(e.project.materials[id].solid,false);assert.ok(Object.values(e.project.assets).some(a=>a.meshes?.some(m=>m.material===id)||[...new Grid(a.chunks).cells()].some(([,m])=>m===id)));}validateProject(e.project);commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);});

test('M033 actual skin binding and plastic guide roles preserve foreign IDs with atomic creation and one undo',async()=>{const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]))};for(let id=266;id<=269;id++)p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'CHAR-073',id:'rig'},{op:'produceCatalogAsset',catalogId:'CHAR-070',id:'bad',params:{handPose:'invalid'}}]));assert.deepEqual(e.project,before);commit(e,[{op:'produceCatalogAsset',catalogId:'CHAR-073',id:'rig'},{op:'produceCatalogAsset',catalogId:'CHAR-070',id:'hand'}]);for(let id=266;id<=269;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);for(const role of['rigGuide','rigJointMarker','rigSocketMarker','handWrap']){const id=e.project.styles.yunshan[role];assert.ok(id>269);assert.equal(e.project.materials[id].solid,false);assert.equal(e.project.materials[id].category,role==='handWrap'?'leather':'plastic');assert.ok(Object.values(e.project.assets).some(a=>a.meshes?.some(m=>m.material===id)||[...new Grid(a.chunks).cells()].some(([,m])=>m===id)));}validateProject(e.project);commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);});
