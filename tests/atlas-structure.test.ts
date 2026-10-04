import {architectureAssemblyIds} from '../src/production/atlas-architecture-assemblies';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {atlasBuiltRecipes} from '../src/production/atlas-built';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {structureRecipes} from '../src/production/atlas-structure';
import {structureAssemblyCommands,structureRouteClearances} from '../src/production/structure-assembly';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {productionRecipes} from '../src/production/library';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type Command,type Project,type V3} from '../src/core/types';

const p=productionProject('M013'),s=p.styles.yunshan,cache=new Map<string,{a:Asset,g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const{a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function withCatalog(p:Project){p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalog)};return p;}

test('M013 saves twelve distinct metre masters with actual empty passages and connected detail',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M013.png')).digest('hex');assert.equal(sha,'20f4ed41628078e31c90810e2a97e37b28d189d44dffaecc5ea11c97cd7e4b8a');
 assert.equal(Object.keys(structureRecipes).length,12);
 for(const [index,id]of Object.keys(structureRecipes).entries()){const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M013');assert.equal(ref.slot,index+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.cellSize,.02);assert.equal(a.source!.units,'metres');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id);assert.ok(g.count<=1_000_000,id);assert.ok(a.parts.length>=4,id);assert.ok(a.openings.length,id);for(const box of a.openings)eachCell(box,q=>assert.equal(g.get(q),0,id+' blocked at '+q));const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);}
});

test('concrete, mortar, stone, timber, roof tile, membrane, earth and physical sign ink are real independent voxel IDs',()=>{
 const expected:{[key:string]:string}={structuralConcrete:'concrete',mortar:'concrete',waterproofMembrane:'rubber',earthCutaway:'soil'};
 for(const [role,category]of Object.entries(expected))assert.equal(p.materials[s[role]].category,category);
 assert.equal(new Set(['stone','wall','structuralConcrete','mortar','roof','waterproofMembrane','rubber','earthCutaway','soil'].map(r=>s[r])).size,9);
 const checks:[string,V3,string][]=[['BUILT-008',[.8,1.65,.3],'structuralConcrete'],['BUILT-009',[.8,1.65,1],'structuralConcrete'],['BUILT-009',[.9,1.79,1.1],'wall'],['BUILT-011',[1.05,.18,.1],'wood'],['BUILT-011',[1.05,.285,.1],'waterproofMembrane'],['BUILT-011',[1.05,.33,.1],'roof'],['BUILT-015',[.5,.25,.47],'mortar'],['BUILT-015',[.84,1,.3],'wood'],['BUILT-015',[.1,2.8,.15],'bronze'],['BUILT-015',[.21,1,.07],'warm'],['BUILT-017',[.5,.4,.27],'mortar'],['BUILT-018',[.5,1,1.29],'structuralConcrete'],['BUILT-018',[.5,1,1.39],'waterproofMembrane'],['BUILT-018',[.5,1,1.55],'earthCutaway'],['BUILT-018',[.06,.2,1.59],'stone'],['BUILT-018',[.23,1,1.41],'metal'],['BUILT-045',[.4,1.2,.05],'enamel'],['BUILT-045',[.15,1,.16],'wood'],['BUILT-045',[.30,.70,.025],'printedDark']];
 for(const[id,point,role]of checks)assert.equal(at(id,point),s[role],id+' '+role+' '+point);
 for(const id of Object.keys(structureRecipes)){const used=new Set([...model(id).g.cells()].map(([,m])=>m));for(const role of['paper','fruitRed','rubber','displayGlyph','fabric','foodRoot'])assert.ok(!used.has(s[role]),id+' borrowed '+role);}
 const missing={...s};delete missing.waterproofMembrane;assert.throws(()=>makeCatalogAsset('BUILT-018','bad','bad',missing),/缺少材质角色 waterproofMembrane/);
});

test('return stairs rise exactly 0.2m every 0.4m, courtyard doors remain open and thin waterproof strip stays 0.2m',()=>{
 for(let i=0;i<8;i++){const top=.4+i*.2,z=4.4-(.4+i*.4)-.2;assert.equal(at('BUILT-008',[.8,top-.01,z]),s.wall);assert.equal(at('BUILT-008',[.8,top+.03,z]),0);}
 for(const id of['BUILT-015','BUILT-016'])assert.equal(at(id,[(model(id).a.source!.dimensionsM as V3)[0]/2,1.3,.4]),0);
 assert.equal(model('BUILT-013').g.bounds()!.max[2]*.02,.2);assert.equal(model('BUILT-012').g.bounds()!.max[1]*.02,.2);
});

test('only validated widths regenerate legal voxel structures and interfaces',()=>{
 for(const width of[1.2,1.6]){const a=makeCatalogAsset('BUILT-007','flight','flight',s,{width});assert.equal(new Grid(a.chunks).bounds()!.max[0]*.02,width);assert.equal(a.ports.find(p=>p.id==='top-walkway')!.kind,width===1.6?'walkway-1600':'walkway-1200');}
 for(const width of[7.2,12.8,14.4]){const a=makeCatalogAsset('BUILT-017','wall','wall',s,{width}),g=new Grid(a.chunks);assert.equal(g.bounds()!.max[0]*.02,width);for(const box of a.openings)eachCell(box,q=>assert.equal(g.get(q),0));assert.equal(a.ports.find(p=>p.id==='wall-right')!.position[0],width);}
 for(const width of[0,-1,Infinity,7.3,14.6])assert.throws(()=>makeCatalogAsset('BUILT-017','bad','bad',s,{width}));assert.throws(()=>makeCatalogAsset('BUILT-007','bad','bad',s,{width:1.4}));assert.throws(()=>makeCatalogAsset('BUILT-013','bad','bad',s,{height:3}));
 const recipes=productionRecipes(p,{query:'BUILT-',limit:100});assert.equal(recipes.total,Object.keys(atlasBuiltRecipes).length+architectureAssemblyIds.length);assert.ok(recipes.entries.some(e=>e.id==='BUILT-017'));
});

test('structural appearance pack changes no occupancy, interface, role, category or collision and undoes together',async()=>{
 const doc=productionProject('pack');doc.assets['built-018']=model('BUILT-018').a;const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['structuralConcrete','mortar','waterproofMembrane','earthCutaway'];
 const r=commit(e,[{op:'definePalette',name:'建筑分层检查',materials:Object.fromEntries(changed.map((role,i)=>[s[role],{color:['#e06245','#9673ad','#44b6c6','#a8b556'][i]}]))},{op:'palette',name:'建筑分层检查'}]);assert.equal(r.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);if(!changed.some(role=>String(s[role])===id))assert.deepEqual(e.project.materials[id],m);}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);
 const dir=await mkdtemp(path.join(os.tmpdir(),'structure-export-'));try{await exportProject(e.project,dir,'built-018');const round=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,e.project.assets);assert.deepEqual(round.styles,e.project.styles);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));for(const role of['structuralConcrete','waterproofMembrane','earthCutaway']){const m=glb.getRoot().listMaterials().find(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role));assert.equal(m?.getExtras().materialCategory,p.materials[s[role]].category);}}finally{await rm(dir,{recursive:true,force:true});}
});

test('foreign role IDs are preserved, failed structure transactions roll back and a successful batch undoes once',()=>{
 const doc=withCatalog(newProject());doc.materials[143]={...doc.materials[1],id:143,name:'用户石材'};const e=new Engine(doc),before=structuredClone(e.project),command={op:'produceCatalogAsset',catalogId:'BUILT-018',id:'section'};
 assert.throws(()=>commit(e,[command,{op:'material',id:1,properties:{roughness:-1}}]));assert.deepEqual(e.project,before);
 const req={expectedVersion:0,requestId:'structural-create',commands:[command]},dry=e.execute({...req,dryRun:true});assert.deepEqual(e.project,before);const made=e.execute({...req,previewToken:dry.previewToken});assert.deepEqual(e.execute(req),made);assert.throws(()=>e.execute({...req,requestId:'stale'}),/版本冲突/);assert.deepEqual(e.project.materials[143],before.materials[143]);assert.notEqual(e.project.styles.yunshan.structuralConcrete,143);commit(e,[{op:'undo'}]);for(const k of['assets','materials','styles','catalog']as const)assert.deepEqual(e.project[k],before[k]);
});

test('service wing uses four catalogue masters plus one support master, aligned two-flight connections and unobstructed human clearance',()=>{
 const e=new Engine(withCatalog(productionProject('route')));commit(e,structureAssemblyCommands(e.project.styles.yunshan));const c=checkGeometry(e.project,structureRouteClearances());assert.deepEqual(c.collisions,[]);assert.deepEqual(c.gaps,[]);assert.deepEqual(c.unsupported,[]);assert.deepEqual(c.warnings,[]);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings.filter(o=>o.ownSolidCells||o.blockedBy.length)));assert.ok(c.clearances.every(c=>c.clear),JSON.stringify(c.clearances.filter(c=>!c.clear)));
 assert.ok(e.project.instances['outbound-1'].position.every((n,i)=>Math.abs(n-[.4,0,1.2][i])<1e-8));assert.ok(e.project.instances['return-1'].position.every((n,i)=>Math.abs(n-[2.4,1.6,1.2][i])<1e-8));assert.equal(Object.keys(e.project.assets).length,5);
 const before=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-007',id:'narrow'},{op:'connect',id:'bad',assetId:'narrow',portId:'bottom-walkway',targetInstanceId:'wing-1',targetPortId:'lower-flight',rotation:0}]),/接口/);assert.deepEqual(e.project,before);
});

test('canopy waterproof strip and doorway/window wall dock on compatible grids with no blocked apertures',()=>{
 const doc=withCatalog(productionProject('joins')),e=new Engine(doc);commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-012',id:'canopy'},{op:'produceCatalogAsset',catalogId:'BUILT-013',id:'edge'},{op:'instance',assetId:'canopy',id:'canopy-1',position:[0,0,0]},{op:'connect',id:'edge-1',assetId:'edge',portId:'weather-front',targetInstanceId:'canopy-1',targetPortId:'weather-back',rotation:0},{op:'produceCatalogAsset',catalogId:'BUILT-015',id:'door'},{op:'produceCatalogAsset',catalogId:'BUILT-017',id:'window',params:{width:7.2}},{op:'instance',assetId:'door',id:'door-1',position:[0,0,5]},{op:'connect',assetId:'window',id:'window-1',portId:'wall-left',targetInstanceId:'door-1',targetPortId:'wall-right',rotation:0}]);const c=checkGeometry(e.project);assert.deepEqual(c.collisions,[]);assert.deepEqual(c.unsupported,[]);assert.deepEqual(c.warnings,[]);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length));
});
