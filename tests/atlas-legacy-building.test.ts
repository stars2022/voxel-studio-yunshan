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
import {legacyBuildingRecipes} from '../src/production/atlas-legacy-building';
import {legacyStairAssemblyCommands,legacyGateAssemblyCommands,legacyStairClearances,legacyGateClearances} from '../src/production/legacy-building-assembly';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {layoutAtlasGallery} from '../src/production/gallery-layout';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M014'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const{a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(p:Project){p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
const clean=(c:ReturnType<typeof checkGeometry>)=>{for(const k of['collisions','gaps','unsupported','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings.filter(o=>o.ownSolidCells||o.blockedBy.length)));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances.filter(o=>!o.clear)));};

test('M014 saves twelve unique connected masters, source provenance, real openings and their individual precision',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M014.png')).digest('hex');assert.equal(sha,'d563f28f4fd387add98cb621a8e2e6c457c4bbe8035601eb6bfbdd3d9b37ffd5');
 assert.equal(Object.keys(legacyBuildingRecipes).length,12);const hashes=new Set<string>();
 for(const [i,id]of Object.keys(legacyBuildingRecipes).entries()){
  const{a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M014');assert.equal(ref.slot,i+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,['BUILT-055','BUILT-056','BUILT-057','BUILT-062'].includes(id)?.04:.02);assert.equal(a.source!.units,'metres');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id);assert.ok(g.count<=1_000_000,id);assert.ok(a.parts.length>=4,id);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));for(const port of a.ports){assert.equal(port.pitch,a.cellSize);for(const n of port.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,id);}
  const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);
 }
});

test('paper shade, lamp core, glazing and all building layers are different actual voxel roles, never similar-colour substitutes',()=>{
 assert.equal(p.materials[s.lanternPaper].category,'paper');assert.equal(new Set(['lanternPaper','paperSheet','paper','fabric','glass','warm','screen','lightCore','displayGlyph'].map(r=>s[r])).size,9);
 const checks:[string,V3,string][]=[['BUILT-053',[.64,.34,.7],'wood'],['BUILT-054',[.2,.5,.13],'lanternPaper'],['BUILT-054',[.10,.5,.10],'wood'],['BUILT-054',[.3,.5,.3],'warm'],['BUILT-054',[.25,.25,.25],'metal'],['BUILT-054',[.27,1.16,.3],'bronze'],['BUILT-055',[4,.3,4],'stone'],['BUILT-055',[.41,.62,.41],'wall'],['BUILT-055',[1,.57,1],'mortar'],['BUILT-057',[1,.10,1],'structuralConcrete'],['BUILT-057',[1,.02,1],'wood'],['BUILT-057',[1,.22,1],'wall'],['BUILT-057',[.02,.18,.02],'mortar'],['BUILT-059',[.46,1.2,.46],'wood'],['BUILT-060',[.5,1,.13],'glass'],['BUILT-060',[.13,1,.6],'glass'],['BUILT-060',[2.27,1,.6],'glass'],['BUILT-061',[.4,.2,.2],'wood'],['BUILT-063',[.21,.5,.09],'wood'],['BUILT-064',[.2,1,.3],'wood']];
 for(const[id,v,role]of checks)assert.equal(at(id,v),s[role],id+' '+role+' '+v);
 for(const id of Object.keys(legacyBuildingRecipes)){const used=new Set([...model(id).g.cells()].map(([,m])=>m));for(const role of['paper','paperSheet','fabric','displayGlyph','screen','fruitRed','rubber','enamel'])assert.ok(!used.has(s[role]),id+' borrowed '+role);}
 const missing={...s};delete missing.lanternPaper;assert.throws(()=>makeCatalogAsset('BUILT-054','bad','bad',missing),/缺少材质角色 lanternPaper/);
});

test('solid foundation, four-piece well, ten exact stair rises and the 0.7m timber shaft are real grid geometry',()=>{
 for(const v of[[1,.3,1],[4,.3,4],[7,.3,7]] as V3[])assert.equal(at('BUILT-055',v),s.stone);
 for(let i=0;i<10;i++){const y=.48+i*.24,z=.60+i*.4;assert.equal(at('BUILT-062',[1.08,y-.02,z]),s.wall);assert.equal(at('BUILT-062',[1.08,y+.02,z]),0);assert.equal(at('BUILT-062',[1.08,.10,z]),s.stone);}
 eachCell({min:[50,0,10],max:[110,6,140]},v=>assert.equal(model('BUILT-057').g.get(v),0,'complete authored stair well'));assert.equal(at('BUILT-057',[3.2,.1,3.2]),0);assert.equal(at('BUILT-058',[1.1,1.2,.24]),0);assert.equal(at('BUILT-058',[3,1.2,.24]),0);assert.equal(at('BUILT-064',[1.2,1.2,.3]),0);
 const{a,g}=model('BUILT-059'),cells=[...g.cells()].filter(([v])=>v[1]===50&&v[2]===23).map(([v])=>v[0]);assert.ok(Math.abs((Math.max(...cells)-Math.min(...cells)+1)*a.cellSize-.7)<1e-8);
});

test('paper resource pack preserves geometry, role IDs, collision and unrelated materials, survives native/GLB export and undoes together',async()=>{
 const doc=productionProject('lantern pack');doc.assets.lamp={...model('BUILT-054').a,id:'lamp'};const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['lanternPaper','warm','wood','bronze'];
 const r=commit(e,[{op:'definePalette',name:'独立灯笼材质',materials:Object.fromEntries(changed.map((role,i)=>[s[role],{color:['#70bd94','#ffa733','#485864','#b861aa'][i]}]))},{op:'palette',name:'独立灯笼材质'}]);assert.equal(r.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const [id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);if(!changed.some(role=>String(s[role])===id))assert.deepEqual(e.project.materials[id],m);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'legacy-lantern-'));try{
  await exportProject(e.project,dir,'lamp');const round=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(round);for(const k of['assets','materials','styles']as const)assert.deepEqual(round[k],e.project[k]);
  const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));for(const role of changed){const mat=glb.getRoot().listMaterials().find(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role));assert.equal(mat?.getExtras().materialCategory,e.project.materials[s[role]].category);}
 }finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);assert.deepEqual(e.project.assets,before.assets);
});

test('foreign paper IDs remain intact and failed or conflicting creation is atomic',()=>{
 const doc=withCatalog(newProject());doc.materials[147]={...doc.materials[1],id:147,name:'用户石料'};const e=new Engine(doc),before=structuredClone(e.project),command={op:'produceCatalogAsset',catalogId:'BUILT-054',id:'lamp'};
 assert.throws(()=>commit(e,[command,{op:'material',id:1,properties:{opacity:5}}]));assert.deepEqual(e.project,before);
 const request={expectedVersion:before.version,requestId:'paper-create',commands:[command]},dry=e.execute({...request,dryRun:true});assert.deepEqual(e.project,before);const made=e.execute({...request,previewToken:dry.previewToken});assert.deepEqual(e.execute(request),made);assert.throws(()=>e.execute({...request,requestId:'stale'}),/版本冲突/);assert.deepEqual(e.project.materials[147],before.materials[147]);assert.notEqual(e.project.styles.yunshan.lanternPaper,147);const used=new Set([...new Grid(e.project.assets.lamp.chunks).cells()].map(([,m])=>m));assert.ok(used.has(e.project.styles.yunshan.lanternPaper));assert.ok(!used.has(147));commit(e,[{op:'undo'}]);for(const k of['assets','materials','styles','catalog']as const)assert.deepEqual(e.project[k],before[k]);
});

test('four-piece floor connects to the ten-step solid stair with supports and eleven unobstructed human envelopes',()=>{
 const e=new Engine(withCatalog(productionProject('stair route')));commit(e,legacyStairAssemblyCommands(s));clean(checkGeometry(e.project,legacyStairClearances()));assert.equal(Object.keys(e.project.assets).length,3);assert.equal(Object.keys(e.project.instances).length,6);assert.ok(e.project.instances['floor-1'].position.every((n,i)=>Math.abs(n-[0,2.4,0][i])<1e-8));
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'createAsset',id:'wrong-pitch',name:'20mm test',template:'empty',cellSize:.02},{op:'metadata',assetId:'wrong-pitch',ports:[{id:'p',kind:'legacy-stair-2400',position:[0,0,0],normal:[0,0,-1],size:[2.4,.24,0],pitch:.02}]},{op:'connect',id:'bad',assetId:'wrong-pitch',portId:'p',targetInstanceId:'stair-1',targetPortId:'top-walkway',rotation:0}]),/格距|接口/);assert.deepEqual(e.project,before);
});

test('independent wall-side leaf and supported paper lantern dock without blocking the six-metre door approach',()=>{
 const e=new Engine(withCatalog(productionProject('gate route')));commit(e,legacyGateAssemblyCommands(s));clean(checkGeometry(e.project,legacyGateClearances));assert.equal(Object.keys(e.project.assets).length,4);assert.equal(Object.values(e.project.instances).filter(i=>i.assetId==='gate-leaf').length,1);assert.ok(e.project.instances['leaf-1'].position.every((n,i)=>Math.abs(n-[-1.24,0,-.16][i])<1e-8));
 const before=structuredClone(e.project);commit(e,[{op:'instance',id:'lamp-copy',assetId:'paper-lantern',position:[4.04,1,.08]}]);assert.equal(Object.keys(e.project.assets).length,4);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.instances,before.instances);
});

test('mixed 20/40mm gallery placement keeps every instance on its own grid and every native cell unchanged',()=>{
 const doc=productionProject('mixed precision gallery');for(const id of Object.keys(legacyBuildingRecipes)){const a=structuredClone(model(id).a);doc.assets[a.id]=a;doc.instances[a.id]={id:a.id,assetId:a.id,name:a.name,position:[0,0,0],rotation:0,parent:null};}
 const before=structuredClone(doc.assets);layoutAtlasGallery(doc);assert.deepEqual(doc.assets,before);for(const i of Object.values(doc.instances)){const a=doc.assets[i.assetId];for(const n of i.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,i.id+' '+n);}
 clean(checkGeometry(doc));
});
