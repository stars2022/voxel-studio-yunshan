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
import {joineryRecipes} from '../src/production/atlas-joinery';
import {joineryAssemblyCommands,joineryClearances} from '../src/production/joinery-assembly';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M015'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const{a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(p:Project){p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
const clean=(c:ReturnType<typeof checkGeometry>)=>{for(const k of['collisions','gaps','unsupported','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings.filter(o=>o.ownSolidCells||o.blockedBy.length)));assert.ok(c.clearances.every(o=>o.clear));};

test('M015 twelve reference masters have connected physical cells, provenance, clear holes and explicit precision',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M015.png')) .digest('hex');assert.equal(sha,'08ed79281a2f98c824be04508b3334233231e6a797e8147d6194c54feafa146d');
 assert.equal(Object.keys(joineryRecipes).length,12);const hashes=new Set<string>();
 for(const [i,id]of Object.keys(joineryRecipes).entries()){
  const{a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M015');assert.equal(ref.slot,i+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,id==='BUILT-088'?.04:id==='BUILT-089'?.1:.02);assert.equal(a.source!.units,'metres');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id);assert.ok(g.count<=1_000_000,id);assert.ok(a.parts.length>=4,id);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));for(const port of a.ports){assert.equal(port.pitch,a.cellSize);for(const n of port.position)assert.ok(Math.abs(n/a.cellSize-Math.round(n/a.cellSize))<1e-8,id);}
  const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);
 }
});

test('actual paper, fibre tassel, ink on timber and roof layers retain independent material identities',()=>{
 assert.equal(p.materials[s.lanternTassel].category,'fabric');assert.equal(p.materials[s.lanternTassel].solid,false);assert.equal(new Set(['lanternPaper','lanternTassel','paperSheet','fabric','glass','warm','screen','displayGlyph','printedMark'].map(r=>s[r])).size,9);
 const checks:[string,V3,string][]=[['BUILT-065',[.84,.6,.02],'wood'],['BUILT-066',[1.5,.6,.5],'stone'],['BUILT-066',[.67,.36,.09],'mortar'],['BUILT-067',[.20,1.1,.30],'wood'],['BUILT-068',[.40,.40,.10],'wall'],['BUILT-069',[.29,.41,.03],'printedMark'],['BUILT-069',[.29,.41,.05],'wood'],['BUILT-070',[.30,.50,.90],'wood'],['BUILT-071',[.2,.6,.11],'lanternPaper'],['BUILT-071',[.27,.6,.27],'warm'],['BUILT-071',[.23,.10,.27],'lanternTassel'],['BUILT-071',[.05,.6,.05],'wood'],['BUILT-073',[.3,.13,.40],'wood'],['BUILT-073',[.3,.19,.40],'waterproofMembrane'],['BUILT-073',[.3,.23,.40],'roof'],['BUILT-088',[3.4,3.61,1.6],'waterproofMembrane'],['BUILT-089',[1.2,1.2,1.2],'structuralConcrete']];
 for(const[id,v,role]of checks)assert.equal(at(id,v),s[role],id+' '+role+' '+v);
 for(const id of Object.keys(joineryRecipes)){const used=new Set([...model(id).g.cells()].map(([,m])=>m));for(const role of['paper','paperSheet','fruitRed','screen','displayGlyph','opticsGlow','glass'])assert.ok(!used.has(s[role]),id+' borrowed '+role);}
 const missing={...s};delete missing.lanternTassel;assert.throws(()=>makeCatalogAsset('BUILT-071','bad','bad',missing),/缺少材质角色 lanternTassel/);
});

test('parts stay within catalogue scope: no duplicate glass, lamp, wall, door, pavilion roof or thirty-storey mass',()=>{
 assert.equal(at('BUILT-065',[.42,.60,.03]),0);assert.equal(at('BUILT-067',[1.6,1.2,.32]),0);assert.equal(at('BUILT-070',[.30,.30,.20]),0);assert.equal(at('BUILT-072',[.80,2.64,.60]),0);
 assert.equal(at('BUILT-088',[3.4,1.2,2.8]),0);assert.equal(model('BUILT-088').a.source!.columnCount,6);
 const{a,g}=model('BUILT-089');assert.equal(g.bounds()!.max[1]*a.cellSize,20);assert.equal(a.source!.floorCount,6);assert.equal(a.ports.filter(p=>p.id.startsWith('floor-')).length,6);
});

test('independent window, supported hanging lantern and paired roof brackets assemble without collision or blocked access',()=>{
 const e=new Engine(withCatalog(productionProject('joinery route')));commit(e,joineryAssemblyCommands(s));clean(checkGeometry(e.project,joineryClearances));assert.equal(Object.keys(e.project.assets).length,9);assert.equal(Object.keys(e.project.instances).length,9);
 const pavilion=new Engine(withCatalog(productionProject('pavilion details')));commit(pavilion,[{op:'produceCatalogAsset',catalogId:'BUILT-072',id:'post'},{op:'produceCatalogAsset',catalogId:'BUILT-073',id:'roof'},{op:'instance',id:'post-1',assetId:'post',position:[0,0,0]},{op:'connect',id:'roof-1',assetId:'roof',portId:'column-seat',targetInstanceId:'post-1',targetPortId:'roof',rotation:0}]);clean(checkGeometry(pavilion.project));
 const before=structuredClone(e.project);commit(e,[{op:'instance',id:'eave-copy',assetId:'eave',position:[12,0,0]}]);assert.equal(Object.keys(e.project.assets).length,9);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.instances,before.instances);
});

test('six storey units stack through 100mm ports; finer sockets reject without partial assets',()=>{
 const e=new Engine(withCatalog(productionProject('giant column')));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-089',id:'column'},{op:'instance',id:'lower',assetId:'column',position:[0,0,0]},{op:'connect',id:'upper',assetId:'column',portId:'stack-bottom',targetInstanceId:'lower',targetPortId:'stack-top',rotation:0}]);clean(checkGeometry(e.project));assert.deepEqual(e.project.instances.upper.position,[0,20,0]);assert.equal(Object.keys(e.project.assets).length,1);
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'createAsset',id:'fine',name:'20mm incompatible',template:'empty',cellSize:.02},{op:'metadata',assetId:'fine',ports:[{id:'p',kind:'giant-column-stack',position:[0,0,0],normal:[0,-1,0],size:[2.4,0,2.4],pitch:.02}]},{op:'connect',id:'bad',assetId:'fine',portId:'p',targetInstanceId:'lower',targetPortId:'stack-top',rotation:0}]),/格距|接口/);assert.deepEqual(e.project,before);
});

test('a lantern appearance pack changes paper, tassel and lamp separately, exports semantic IDs, and undoes in one transaction',async()=>{
 const doc=productionProject('joinery palette');doc.assets.lantern={...model('BUILT-071').a,id:'lantern'};const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),roles=['lanternPaper','lanternTassel','warm','wood'];
 const r=commit(e,[{op:'definePalette',name:'灯笼独立材质',materials:Object.fromEntries(roles.map((r,i)=>[s[r],{color:['#acd4ba','#516dc2','#efa237','#744561'][i]}]))},{op:'palette',name:'灯笼独立材质'}]);assert.equal(r.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);if(!roles.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'joinery-'));try{await exportProject(e.project,dir,'lantern');const round=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(round);for(const k of['assets','styles','materials']as const)assert.deepEqual(round[k],e.project[k]);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));for(const role of roles){const mat=glb.getRoot().listMaterials().find(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role));assert.equal(mat?.getExtras().materialCategory,e.project.materials[s[role]].category);}}finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);
});

test('foreign fibre IDs survive, dry-run is immutable, stale versions and failed commands roll back new roles',()=>{
 const doc=withCatalog(newProject());doc.materials[148]={...doc.materials[1],id:148,name:'用户石料'};const e=new Engine(doc),before=structuredClone(e.project),c={op:'produceCatalogAsset',catalogId:'BUILT-071',id:'lantern'};
 assert.throws(()=>commit(e,[c,{op:'material',id:1,properties:{opacity:8}}]));assert.deepEqual(e.project,before);
 const request={expectedVersion:before.version,requestId:'joinery-fibre-create',commands:[c]},dry=e.execute({...request,dryRun:true});assert.deepEqual(e.project,before);const r=e.execute({...request,previewToken:dry.previewToken});assert.deepEqual(e.execute(request),r);assert.throws(()=>e.execute({...request,requestId:'stale'}),/版本冲突/);assert.deepEqual(e.project.materials[148],before.materials[148]);assert.notEqual(e.project.styles.yunshan.lanternTassel,148);const used=new Set([...new Grid(e.project.assets.lantern.chunks).cells()].map(([,m])=>m));assert.ok(used.has(e.project.styles.yunshan.lanternTassel));assert.ok(!used.has(148));commit(e,[{op:'undo'}]);for(const k of['assets','materials','styles','catalog']as const)assert.deepEqual(e.project[k],before[k]);
});
