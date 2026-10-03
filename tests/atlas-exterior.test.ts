import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {exteriorRecipes} from '../src/production/atlas-exterior';
import {exteriorAssemblyCommands,exteriorClearances} from '../src/production/exterior-assembly';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {checkFloat32Bounds} from '../src/export/precision';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M016'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const{a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(p:Project){p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
const clean=(c:ReturnType<typeof checkGeometry>)=>{for(const k of['collisions','gaps','unsupported','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings.filter(o=>o.ownSolidCells||o.blockedBy.length)));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances.filter(o=>!o.clear)));};

test('M016 keeps twelve unique native masters, authored scope, actual holes, source hash and deliberate disconnected canopies',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M016.png')).digest('hex');assert.equal(sha,'8b52c5fdeec38a9bcaf6283f50fd489ad4919f1106f5b661a0217877f1c39f56');assert.equal(Object.keys(exteriorRecipes).length,12);const hashes=new Set<string>();
 for(const [i,id]of Object.keys(exteriorRecipes).entries()){
  const{a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M016');assert.equal(ref.slot,i+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,exteriorRecipes[id].pitch);assert.equal(a.source!.units,'metres');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,id==='BUILT-099'?2:1,id);assert.ok(g.count<=1_000_000,id);assert.ok(a.parts.length>=4,id);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));for(const port of a.ports){assert.equal(port.pitch,a.cellSize);for(const n of port.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,id);}
  const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);
 }
});

test('lamp-box diffuser, printed ink, lamp core, non-solid energy, glass and fireclay are separate actual voxel materials',()=>{
 assert.equal(p.materials[s.signDiffuser].category,'plastic');assert.equal(p.materials[s.flueLiner].category,'ceramic');assert.equal(p.materials[s.energyField].solid,false);assert.equal(p.materials[s.energyField].category,'emissive');assert.equal(new Set(['signDiffuser','lanternPaper','glass','energy','energyField','screen','printedDark','displayGlyph','flueLiner'].map(r=>s[r])).size,9);
 const checks:[string,V3,string][]=[['BUILT-095',[5,20,5],'energyField'],['BUILT-095',[4,20,3.65],'glass'],['BUILT-095',[3.45,20,3.45],'metal'],['BUILT-096',[1,1.05,1],'wood'],['BUILT-096',[1,1.13,1],'structuralConcrete'],['BUILT-097',[1,.5,.13],'glass'],['BUILT-101',[.24,.24,.13],'signDiffuser'],['BUILT-101',[.85,1.5,.09],'printedDark'],['BUILT-101',[.4,.4,.29],'warm'],['BUILT-102',[.35,4.25,1.5],'flueLiner'],['BUILT-102',[.15,4.25,1.5],'wall'],['BUILT-102',[.15,4.05,1.5],'mortar'],['BUILT-100',[.5,1.5,.5],'wood']];
 for(const[id,v,role]of checks)assert.equal(at(id,v),s[role],id+' '+role+' '+v);
 for(const id of Object.keys(exteriorRecipes)){const used=new Set([...model(id).g.cells()].map(([,m])=>m));for(const role of['paper','paperSheet','fruitRed','screen','displayGlyph','opticsGlow','lanternPaper'])assert.ok(!used.has(s[role]),id+' borrowed '+role);}
 const missing={...s};delete missing.signDiffuser;assert.throws(()=>makeCatalogAsset('BUILT-101','bad','bad',missing),/缺少材质角色 signDiffuser/);
});

test('large catalogue dimensions remain metres, not scaled tabletop props, and central entrances are genuinely empty',()=>{
 const ring=model('BUILT-094'),r=ring.g.bounds()!;assert.equal(ring.a.cellSize,.2);assert.ok((r.max[0]-r.min[0])*.2>=84);assert.equal((ring.a.source!.ring as any).majorRadiusM,42);assert.equal(at('BUILT-094',[45,3.4,45]),0);
 const field=[...model('BUILT-095').g.cells()].filter(([,m])=>m===s.energyField).map(([v])=>v[1]);assert.equal((Math.max(...field)+1-Math.min(...field))*.1,35);assert.equal(Math.min(...field)*.1,6);
 assert.ok(Math.abs(model('BUILT-091').g.bounds()!.max[1]*.02-1.8-1.1)<1e-12);assert.equal(model('BUILT-098').g.bounds()!.max[0]*.04,7);assert.equal(at('BUILT-099',[5,.4,3]),0);assert.equal(at('BUILT-103',[5.2,2,1.2]),0);
 assert.equal(model('BUILT-102').g.bounds()!.max[1]*.1,8);for(const x of[1.4,8.6])for(let y=0;y<8;y+=.1)assert.equal(at('BUILT-102',[x,y,1.8]),0);
 const xs=[...model('BUILT-100').g.cells()].filter(([v,m])=>v[1]===30&&v[2]===13&&m===s.wood).map(([v])=>v[0]);assert.equal((Math.max(...xs)-Math.min(...xs)+1)*.04,.4);
});

test('observation stairs, supported balcony and rail, two side aprons, double canopies and four repeated posts assemble cleanly',()=>{
 const e=new Engine(withCatalog(productionProject('exterior route')));commit(e,exteriorAssemblyCommands(s));clean(checkGeometry(e.project,exteriorClearances));assert.equal(Object.keys(e.project.assets).length,9);assert.equal(Object.keys(e.project.instances).length,13);assert.equal(Object.values(e.project.instances).filter(i=>i.assetId==='column').length,4);assert.equal(Object.values(e.project.instances).filter(i=>i.assetId==='apron').length,2);
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'createAsset',id:'wrong',name:'wrong pitch',template:'empty',cellSize:.02},{op:'metadata',assetId:'wrong',ports:[{id:'p',kind:'shop-canopy-column',position:[0,0,0],normal:[0,1,0],size:[.4,0,.4],pitch:.02}]},{op:'connect',id:'bad',assetId:'wrong',portId:'p',targetInstanceId:'canopies-1',targetPortId:'column-60',rotation:0}]),/格距|接口/);assert.deepEqual(e.project,before);
});

test('two true eaves-corridor segments dock with continuous floor and no colliding end ornaments',()=>{
 const e=new Engine(withCatalog(productionProject('eaves route')));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-090',id:'corridor'},{op:'instance',id:'left',assetId:'corridor',position:[0,0,0]},{op:'connect',id:'right',assetId:'corridor',portId:'left',targetInstanceId:'left',targetPortId:'right',rotation:0}]);clean(checkGeometry(e.project));assert.deepEqual(e.project.instances.right.position,[6.4,0,0]);assert.equal(Object.keys(e.project.assets).length,1);
});

test('resource pack preserves material categories, IDs, physical collision, geometry and ports and survives native/GLB export with one undo',async()=>{
 const doc=productionProject('new roles');for(const id of['BUILT-095','BUILT-101','BUILT-102'])doc.assets[id.toLowerCase()]=model(id).a;const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),roles=['signDiffuser','energyField','flueLiner','printedDark'];const r=commit(e,[{op:'definePalette',name:'外立面独立材质',materials:Object.fromEntries(roles.map((r,i)=>[s[r],{color:['#95bdaa','#745ce0','#798399','#943a3a'][i]}]))},{op:'palette',name:'外立面独立材质'}]);assert.equal(r.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);if(!roles.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'exterior-'));try{await exportProject(e.project,dir);const round=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(round);for(const k of['assets','styles','materials']as const)assert.deepEqual(round[k],e.project[k]);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));for(const role of roles){const mat=glb.getRoot().listMaterials().find(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role));assert.equal(mat?.getExtras().materialCategory,e.project.materials[s[role]].category);}}finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);
});

test('foreign IDs remain intact; stale versions, missing semantic roles and failed creation do not partially mutate the document',()=>{
 const doc=withCatalog(newProject());doc.materials[149]={...doc.materials[1],id:149,name:'用户石料'};const e=new Engine(doc),before=structuredClone(e.project),c={op:'produceCatalogAsset',catalogId:'BUILT-101',id:'sign'};
 assert.throws(()=>commit(e,[c,{op:'material',id:1,properties:{opacity:8}}]));assert.deepEqual(e.project,before);const request={expectedVersion:before.version,requestId:'diffuser-create',commands:[c]},dry=e.execute({...request,dryRun:true});assert.deepEqual(e.project,before);const r=e.execute({...request,previewToken:dry.previewToken});assert.deepEqual(e.execute(request),r);assert.throws(()=>e.execute({...request,requestId:'stale'}),/版本冲突/);assert.deepEqual(e.project.materials[149],before.materials[149]);assert.notEqual(e.project.styles.yunshan.signDiffuser,149);const used=new Set([...new Grid(e.project.assets.sign.chunks).cells()].map(([,m])=>m));assert.ok(used.has(e.project.styles.yunshan.signDiffuser));assert.ok(!used.has(149));commit(e,[{op:'undo'}]);for(const k of['assets','materials','styles','catalog']as const)assert.deepEqual(e.project[k],before[k]);
});

test('float32 export validation accepts only exact accessor rounding and rejects actual geometric drift',async()=>{
 const expected={min:[1,0,1.2],max:[89,6.6,88.8]},encoded={min:expected.min.map(Math.fround),max:expected.max.map(Math.fround)};assert.equal(checkFloat32Bounds(expected,encoded).matchesFloat32Rounding,true);assert.ok(checkFloat32Bounds(expected,encoded).maxErrorM>1e-6);assert.equal(checkFloat32Bounds(expected,{...encoded,max:[89,6.6,88.801]}).matchesFloat32Rounding,false);
 const doc=productionProject('large GLB');doc.assets.ring={...model('BUILT-094').a,id:'ring'};const dir=await mkdtemp(path.join(os.tmpdir(),'large-ring-'));try{await exportProject(doc,dir,'ring');const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb')),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const m of glb.getRoot().listMeshes())for(const primitive of m.listPrimitives()){const v=primitive.getAttribute('POSITION')!.getArray()!;for(let i=0;i<v.length;i++){min[i%3]=Math.min(min[i%3],v[i]);max[i%3]=Math.max(max[i%3],v[i]);}}const b=model('BUILT-094').g.bounds()!,native={min:b.min.map(n=>n*.2),max:b.max.map(n=>n*.2)};assert.equal(checkFloat32Bounds(native,{min,max}).matchesFloat32Rounding,true);const restored=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));assert.deepEqual(restored.assets.ring,doc.assets.ring);}finally{await rm(dir,{recursive:true,force:true});}
});
