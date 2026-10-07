import {catalogVariantIds} from '../src/production/catalog-variant-spec';
import {nonReferenceBaseRecipes} from '../src/production/shared-wall';
import {architectureAssemblyIds} from '../src/production/atlas-architecture-assemblies';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {atlasBuiltRecipes} from '../src/production/atlas-built';
import {makeCatalogAsset,atlasRecipe} from '../src/production/catalog-assets';
import {makeFlowerAsset} from '../src/production/life';
import {lifeLayouts,makeLifeAssembly,nativeLifeId} from '../src/production/layouts';
import {productionRecipes,readProductionLibrary} from '../src/production/library';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {gridComponents,checkGeometry} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type V3,type Command} from '../src/core/types';
const ids=[...Array.from({length:9},(_,i)=>'LIFE-'+(192+i)),'LIFE-227','BUILT-003','BUILT-007'],p=productionProject('M012'),s=p.styles.yunshan,cache=new Map<string,{a:Asset,g:Grid}>();
const model=(id:string)=>{if(!cache.has(id)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s);cache.set(id,{a,g:new Grid(a.chunks)});}return cache.get(id)!;};
const at=(id:string,v:V3)=>{const{a,g}=model(id);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};

test('M012 native masters preserve the source, real voids, supported details and distinct catalog domains',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M012.png')).digest('hex');assert.equal(sha,'a705ae6b6694c50c45f606cfe4018f8ce0809cb8a0e7b858128063cdc12a23e5');
 for(const[idIndex,id]of ids.entries()){const {a,g}=model(id),ref=a.source!.reference as any;assert.equal(ref.sheet,'M012');assert.equal(ref.slot,idIndex+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.units,'metres');assert.equal(a.source!.front,'-Z');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.ok(a.source!.materialAssignmentReview);assert.equal(g.bounds()!.min[1],0,id);assert.equal(gridComponents(g).length,atlasRecipe(id).expectedComponents??1,id);assert.ok(a.parts.length>=4);assert.ok(g.count<1_000_000);assert.ok(a.openings.length);for(const box of a.openings)eachCell(box,q=>assert.equal(g.get(q),0,id+' blocked void '+q));const doc=productionProject(id);doc.assets[a.id]=a;validateProject(doc);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);}
 assert.equal(model('LIFE-198').a.cellSize,.005);assert.equal(model('BUILT-007').a.cellSize,.02);
 assert.notDeepEqual(model('LIFE-003').a.chunks,model('BUILT-003').a.chunks);
 assert.throws(()=>makeCatalogAsset('BUILT-999','unknown','bad',s),/尚无/);assert.throws(()=>makeCatalogAsset('BUILT-003','slab','bad',s,{width:6}),/尚未验证/);
});

test('actual tea, pet food, nylon, coated metal, glass, mirror and wrapping cells are classified independently',()=>{
 const checks:[string,V3,string][]=[['LIFE-192',[.15,.13,.085],'teaLiquid'],['LIFE-192',[.45,.14,.26],'teaLeaf'],['LIFE-195',[.10,.20,.10],'petKibble'],['LIFE-195',[.50,.21,.15],'water'],['LIFE-196',[.77,.025,.04],'cleanerFibre'],['LIFE-196',[.545,.79,.305],'cleanerLiquid'],['LIFE-197',[.32,.90,.10],'cottonWhite'],['LIFE-197',[.90,.80,.10],'fabric'],['LIFE-198',[.04,.70,.03],'enamel'],['LIFE-198',[.54,.46,.25],'metalBright'],['LIFE-198',[.33,.68,0],'rubber'],['LIFE-198',[.33,.46,-.03],'glass'],['LIFE-198',[.335,.795,-.023],'displayGlyph'],['LIFE-199',[.5,1.3,.445],'mirrorGlass'],['LIFE-200',[.025,.15,.20],'giftWrapRed'],['LIFE-200',[.525,.15,.10],'giftWrapBlue'],['LIFE-200',[.15,.15,.12],'giftWrapBand'],['LIFE-200',[.045,.15,.3],'giftBoard'],['LIFE-227',[.2,.3,.15],'soil']];
 for(const[id,point,role]of checks)assert.equal(at(id,point),s[role],id+' '+role+' '+point);
 for(const id of ids){const used=new Set([...model(id).g.cells()].map(([,m])=>m));assert.ok(!used.has(s.paper));for(const role of['cakeCrumb','candleWax','fish','fruitRed'])assert.ok(!used.has(s[role]),id+' borrowed '+role);}
 const flower=makeFlowerAsset(s),flowerIDs=new Set([...new Grid(flower.chunks).cells()].map(([,m])=>m));for(const r of['plantStem','leaf','flowerWhite','flowerAmber']){assert.ok(flowerIDs.has(s[r]));assert.equal(p.materials[s[r]].category,'plant');}assert.ok(!flowerIDs.has(s.warm));assert.ok(!flowerIDs.has(s.wood));const noPetals={...s};delete noPetals.flowerWhite;assert.throws(()=>makeFlowerAsset(noPetals),/缺少材质角色/);
 const missing={...s};delete missing.mirrorGlass;assert.throws(()=>makeCatalogAsset('LIFE-199','mirror','bad',missing),/缺少材质角色 mirrorGlass/);
});

test('washer cylinder, gift interiors, teapot spout, floor layering and 0.2m stair risers are actual voxel geometry',()=>{
 assert.equal(at('LIFE-198',[.33,.46,.25]),0);assert.equal(at('LIFE-198',[.33,.46,-.03]),s.glass);assert.equal(at('LIFE-192',[.09,.21,.275]),0);assert.equal(at('LIFE-200',[.20,.415,.30]),0);assert.equal(at('LIFE-227',[.33,.20,.21]),0);
 assert.equal(at('BUILT-003',[.6,.05,.6]),0);assert.equal(at('BUILT-003',[.6,.19,.6]),s.wall);
 for(let i=0;i<8;i++){const top=.4+i*.2,z=.4+i*.4;assert.equal(at('BUILT-007',[.6,top-.01,z+.15]),s.wall);assert.equal(at('BUILT-007',[.6,top+.03,z+.15]),0);}
 assert.equal(at('BUILT-007',[.6,.5,2.6]),0);assert.equal(model('BUILT-007').a.ports.find(p=>p.id==='top-walkway')!.position[1],1.8);
});

test('M012 material packs retain voxel identities and physical flags; GLB and native export preserve new roles',async()=>{
 const doc=productionProject('swap');for(const id of['LIFE-192','LIFE-195','LIFE-198','LIFE-199','LIFE-200']){const {a}=model(id);doc.assets[a.id]=a;}const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),roles=['teaLiquid','petKibble','mirrorGlass','giftWrapRed'];const change=commit(e,[{op:'definePalette',name:'独立外观',materials:Object.fromEntries(roles.map((r,i)=>[s[r],{color:i%2?'#473959':'#78a575'}]))},{op:'palette',name:'独立外观'}]);assert.equal(change.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const [id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);if(!roles.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
 const dir=await mkdtemp(path.join(os.tmpdir(),'domestic-export-'));try{await exportProject(e.project,dir,'life-195');const round=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets['life-195'],model('LIFE-195').a);assert.deepEqual(round.styles,e.project.styles);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));const material=glb.getRoot().listMaterials().find(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.petKibble'));assert.equal(material?.getExtras().materialCategory,'food');}finally{await rm(dir,{recursive:true,force:true});}
});

test('mixed LIFE and BUILT creation uses one previewed transaction with collision-safe IDs, rollback and one undo',async()=>{
 const doc=productionProject('mixed'),rows=parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8'));doc.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:Object.fromEntries(rows.map(r=>[r.id,r]))};const e=new Engine(doc),before=structuredClone(e.project),commands=[{op:'produceCatalogAsset',catalogId:'BUILT-003',id:'floor'},{op:'produceCatalogAsset',catalogId:'BUILT-007',id:'stairs'},{op:'produceCatalogAsset',catalogId:'LIFE-192',id:'tea'}];
 assert.throws(()=>commit(e,[...commands,{op:'produceCatalogAsset',catalogId:'BUILT-999',id:'bad'}]));assert.deepEqual(e.project,before);const req={expectedVersion:e.project.version,requestId:'cross-domain',commands},dry=e.execute({...req,dryRun:true});assert.deepEqual(e.project,before);const result=e.execute({...req,previewToken:dry.previewToken});assert.deepEqual(e.execute(req),result);assert.equal(e.project.assets.floor.source!.catalogId,'BUILT-003');assert.equal(productionRecipes(e.project,{query:'BUILT-',limit:100}).total,Object.keys(atlasBuiltRecipes).length+architectureAssemblyIds.filter(id=>id.startsWith('BUILT-')).length+catalogVariantIds.length+Object.keys(nonReferenceBaseRecipes).length);assert.throws(()=>e.execute({...req,requestId:'stale'}),/版本冲突/);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});

test('dependent domestic arrangements keep master scope, real support and free access',()=>{
 for(const number of[99,211,212,213,214,228]){const doc=productionProject('domestic layout');for(const[n]of lifeLayouts[number]){const a=typeof n==='string'?makeFlowerAsset(s):model('LIFE-'+String(n).padStart(3,'0')).a;doc.assets[a.id]=a;}const assembly=makeLifeAssembly(doc,'LIFE-'+String(number).padStart(3,'0'),'room','layout');doc.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));const c=checkGeometry(doc);assert.deepEqual(c.collisions,[],number+' collisions');assert.deepEqual(c.unsupported,[],number+' unsupported');assert.deepEqual(c.warnings,[],number+' budget');assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),number+' blocked opening');}
});

test('BUILT floor and stair ports assemble a supported two-level route without collisions or blocked headroom',()=>{
 const doc=productionProject('walkway');for(const id of['BUILT-003','BUILT-007']){const {a}=model(id);doc.assets[a.id]=a;}const e=new Engine(doc);
 commit(e,[{op:'createAsset',id:'support',name:'上层承柱',template:'empty',cellSize:.02},{op:'voxels',assetId:'support',mode:'fill',region:{min:[0,0,0],max:[10,80,10]},material:s.metal},
  {op:'instance',id:'floor',assetId:'built-003',position:[0,0,0]},
  {op:'connect',id:'floor-side',assetId:'built-003',portId:'join-left',targetInstanceId:'floor',targetPortId:'join-right',rotation:0},
  {op:'connect',id:'stairs',assetId:'built-007',portId:'bottom-walkway',targetInstanceId:'floor',targetPortId:'back-60',rotation:0},
  {op:'connect',id:'upper',assetId:'built-003',portId:'front-60',targetInstanceId:'stairs',targetPortId:'top-walkway',rotation:0},
  ...([[.02,0,5.6],[2.18,0,5.6],[.02,0,6.58],[2.18,0,6.58]] as V3[]).map((position,i)=>({op:'instance',id:'column-'+i,assetId:'support',position}))]);
 assert.deepEqual(e.project.instances['floor-side'].position,[2.4,0,0]);assert.deepEqual(e.project.instances.stairs.position,[0,0,1.2]);assert.ok(e.project.instances.upper.position.every((n,i)=>Math.abs(n-[0,1.6,5.6][i])<1e-9));
 const c=checkGeometry(e.project);assert.deepEqual(c.collisions,[]);assert.deepEqual(c.gaps,[]);assert.deepEqual(c.unsupported,[]);assert.deepEqual(c.warnings,[]);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length));
});

test('library counts newly modelled BUILT IDs once while retaining existing LIFE upgrade counts',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'atlas-library-'));try{await writeFile(path.join(root,'production-index.json'),JSON.stringify({format:'yunshan.production-index',version:1,createdAt:'test',sourceSHA256:'test',counts:{baseModels:1,generatedEntries:1,notProduced:2,accepted:0},entries:[{id:'LIFE-192',name:'tea',type:'基础组件',stage:'geometry-candidate'},{id:'BUILT-003',name:'floor',type:'基础组件',stage:'not-produced'},{id:'BUILT-007',name:'stair',type:'基础组件',stage:'not-produced'}],packs:[],metrics:{}}));await writeFile(path.join(root,'atlas-production-index.json'),JSON.stringify({format:'yunshan.atlas-production',version:1,run:'test',entries:['LIFE-192','BUILT-003','BUILT-007'].map(id=>({id,assetId:id.toLowerCase(),file:id+'.ysvox.json',voxels:1,triangles:12,sha256:'test',note:'candidate'})),studies:[]}));for(let j=0;j<2;j++){const r:any=await readProductionLibrary(root,{generatedOnly:true,limit:100});assert.equal(r.counts.baseModels,3);assert.equal(r.counts.generatedEntries,3);assert.equal(r.counts.notProduced,0);assert.equal(r.total,3);assert.equal(r.counts.accepted,0);}}finally{await rm(root,{recursive:true,force:true});}
});
