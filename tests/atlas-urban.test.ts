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
import {civicRecipes,civicVariants,selectCivicRecipe,civicContactHeights} from '../src/production/atlas-urban';
import {builtWidthParameter} from '../src/production/atlas-built';
import * as assembly from '../src/production/urban-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {layoutAtlasGallery} from '../src/production/gallery-layout';
import {eachCell,rotateY,type Asset,type Command,type Project,type V3} from '../src/core/types';
const p=productionProject('M022'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string,component?:string)=>{const key=id+':'+(component??'default');if(!cache.has(key)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s,component?{component}:{});cache.set(key,{a,g:new Grid(a.chunks)});}return cache.get(key)!;};
const at=(id:string,v:V3,component?:string)=>{const {a,g}=model(id,component);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function doc(name:string){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
function clean(c:ReturnType<typeof checkGeometry>,unsupported:string[]=[]){assert.deepEqual(c.unsupported,unsupported);for(const k of['collisions','gaps','warnings'] as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances));}

test('M022 has twelve catalogue families and seventeen explicit component shapes, correct dimensions, one connected body each and true openings',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M022.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(civicRecipes).length,12);
 for(const[slot,id]of Object.keys(civicRecipes).entries())for(const component of Object.keys(civicVariants[id]??{default:1})){
  const {a,g}=model(id,component==='default'?undefined:component),recipe=selectCivicRecipe(id,component==='default'?undefined:component)!,ref=a.source!.reference as any;assert.equal(ref.sheet,'M022');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id+component);assert.ok(g.count<1_000_000);assert.ok(a.parts.length>=5);const b=g.bounds()!;assert.ok(b.max.every((v,i)=>Math.abs((v-b.min[i])*a.cellSize-recipe.size[i])<1e-10),id+component);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash),id+component);hashes.add(hash);const d=productionProject(id);d.assets[a.id]=a;validateProject(d);
 }assert.equal(hashes.size,17);
});
test('actual stone, concrete, mortar, structural bearings, facade frames, window seals and golden aluminium stay separate',()=>{
 for(const[id,v,r,c]of[
  ['BUILT-207',[1,.2,2],'structuralConcrete'],['BUILT-207',[1.25,.55,1.25],'wall'],['BUILT-208',[1.9,3,1.5],'structuralConcrete'],['BUILT-208',[1,.6,.05],'wall','cap'],['BUILT-208',[.65,1.15,.5],'bridgeBearing','cap'],
  ['BUILT-209',[1,.85,1],'structuralConcrete'],['BUILT-209',[.3,.15,.5],'structuralConcrete','footing'],['BUILT-210',[.5,.6,.175],'glass'],['BUILT-210',[.1,.6,.075],'warm'],
  ['BUILT-212',[2,.8,2],'structuralConcrete'],['BUILT-212',[2.2,1.95,2.2],'wall'],['BUILT-212',[2.95,1.95,2.2],'mortar'],
  ['BUILT-214',[1.4,.175,.4],'wall'],['BUILT-214',[.125,.175,.4],'metalBright'],['BUILT-215',[1.1,.15,.1],'wall'],['BUILT-216',[.4,.25,.05],'wall'],
  ['BUILT-217',[1.6,.375,.6],'wall'],['BUILT-218',[.5,1,.17],'glass'],['BUILT-218',[.215,1,.17],'facadeSeal'],['BUILT-218',[1.35,1,.15],'facadeFrame'],['BUILT-219',[.09,1,.3],'sunshadeMetal'],
 ]as[string,V3,string,string?][])assert.equal(at(id,v,c),s[r],id+' '+r+' '+v);
 for(const z of[.13,.21])assert.equal(at('BUILT-218',[.5,1,z]),0,'No opaque seal behind either glass face');assert.equal(p.materials[s.facadeSeal].category,'rubber');assert.notEqual(s.facadeSeal,s.vehicleSeal);assert.notEqual(s.facadeSeal,s.rubber);for(const r of['facadeFrame','sunshadeMetal'])assert.equal(p.materials[s[r]].category,'metal');assert.notEqual(s.sunshadeMetal,s.bronze);
});
test('component selection is explicit and recipe-specific, rejects cross-family and mistyped parameters, and rebuild preserves origin plus one undo',()=>{
 for(const[id,variants]of Object.entries(civicVariants))assert.deepEqual((builtWidthParameter(id) as any).component.enum,Object.keys(variants));
 const e=new Engine(doc('variants'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-215',id:'edge',params:{component:'kerb'}},{op:'metadata',assetId:'edge',origin:[.1,0,.1]}]);const before=structuredClone(e.project);commit(e,[{op:'rebuildCatalogAsset',assetId:'edge',params:{component:'treeRing'}}]);assert.deepEqual(e.project.assets.edge.source!.dimensionsM,[3.2,.4,3.2]);assert.deepEqual(e.project.assets.edge.origin,[.1,0,.1]);assert.equal(e.project.assets.edge.source!.catalogId,'BUILT-215');commit(e,[{op:'undo'}]);assert.ok(e.project.assets.edge.version>before.assets.edge.version);assert.deepEqual({...e.project.assets.edge,version:before.assets.edge.version},before.assets.edge);
 for(const[catalogId,params]of[['BUILT-207',{component:'cap'}],['BUILT-205',{component:'pier'}],['LIFE-001',{component:'pier'}],['BUILT-207',{component:1}],['BUILT-217',{width:'3.2'}]]){const snapshot=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId,id:'bad',params}]));assert.deepEqual(e.project,snapshot);}
});
const supportGrids=new WeakMap<Asset,Grid>();
function solidAt(p:Project,world:V3){return Object.values(p.instances).some(i=>{const a=p.assets[i.assetId],local=rotateY(world.map((v,d)=>v-i.position[d]) as V3,4-i.rotation),v=local.map((n,d)=>Math.floor((n-a.origin[d]+1e-8)/a.cellSize)) as V3,m=(supportGrids.get(a)??(supportGrids.set(a,new Grid(a.chunks)),supportGrids.get(a)!)).get(v);return !!m&&p.materials[m].solid;});}
test('lift and bank landings remain separate, with a clear 1.72m body and a fully supported 0.35m-radius authored walking disk',()=>{
 const e=new Engine(doc('landings'));commit(e,assembly.urbanLandingCommands());clean(checkGeometry(e.project,assembly.urbanLandingClearances));assert.equal(new Set(Object.values(e.project.assets).map(a=>a.source!.catalogId)).size,2);assert.equal(e.project.assets.lift.source!.component,'liftLanding');assert.equal(e.project.assets.bank.source!.component,'bankLanding');
 for(const z of[.8,2,3.2])for(let ix=-6;ix<=6;ix++)for(let iz=-6;iz<=6;iz++){const dx=ix*.05,dz=iz*.05;if(dx*dx+dz*dz<=.35*.35)assert.ok(solidAt(e.project,[1.5+dx,.55,z+dz]));}
});
test('five-height positive footings contact explicit sample terrain, then support foundation, pier, cap and M021 high bridge at exact datums',()=>{
 const e=new Engine(doc('foundation'));commit(e,assembly.urbanFoundationCommands(s));const c=checkGeometry(e.project,assembly.urbanFoundationClearances);clean(c,assembly.urbanFoundationUnsupported);for(const id of['footing-0-0','footing-0-1','footing-1-0','footing-1-1'])assert.ok(c.contacts[id].includes('terrain-1'));for(const[a,b]of[['pier-1','foundation-1'],['cap-1','pier-1'],['beam-1','cap-1'],['deck-1','beam-1']])assert.ok(c.contacts[a].includes(b));assert.equal(c.contacts['foundation-1'].length,4);
 assert.deepEqual(e.project.instances['cap-1'].position,[0,251.6,2.4]);assert.equal(e.project.instances['beam-1'].position[1],252.8);assert.equal(e.project.instances['deck-1'].position[1],254);assert.deepEqual((e.project.assets.footing.source!.authoredFoundation as any).bottomBandsM,civicContactHeights);for(let i=0;i<5;i++){const y=civicContactHeights[i];assert.ok(y<1);assert.equal(at('BUILT-209',[i*.2+.1,y-.05,.5],'footing'),0);assert.ok(at('BUILT-209',[i*.2+.1,y+.05,.5],'footing'));}
 const historic=e.project.assets.pier.source!.isolatedBridge as any;assert.equal(historic.countsReconstructed,false);assert.equal(historic.originalGameFinalPass,false);assert.deepEqual(historic.historicalFailures,['giant block / ray mismatch','new lower pier conflict']);
});
test('ramp top and closed solid bottom come from the same column heights; ten real 0.2m steps meet the finite 2m platform',()=>{
 const {a,g}=model('BUILT-213');for(let z=0;z<240;z++){const h=4+Math.round(36*z/239);for(let y=0;y<h;y++)assert.ok(g.get([32,y,z]));assert.equal(g.get([32,h,z]),0);}assert.equal((a.source!.ramp as any).analyticSlope,false);
 for(let i=0;i<10;i++){assert.ok(at('BUILT-217',[1.6,(i+1)*.2-.025,i*.4+.2]));assert.equal(at('BUILT-217',[1.6,(i+1)*.2+.025,i*.4+.2]),0);}const e=new Engine(doc('market'));commit(e,assembly.urbanMarketCommands());clean(checkGeometry(e.project,assembly.urbanMarketClearances));assert.deepEqual(e.project.instances['stairs-1'].position,[10,0,13.4]);const fill=e.project.assets.platform.source!.earthwork as any;assert.equal(fill.fillM,2);assert.ok(fill.fillM<=fill.sourceLimitM);
});
test('drain cover stays independent, tree surround stays hollow, and wall weeps continue through the finite auxiliary soil',()=>{
 const e=new Engine(doc('drain'));commit(e,assembly.urbanDrainCommands(s));clean(checkGeometry(e.project,assembly.urbanDrainClearances));assert.equal(e.project.assets.ring.source!.component,'treeRing');assert.equal(Object.values(e.project.assets).filter(a=>a.source?.catalogId).length,3);assert.equal(at('BUILT-214',[.25,.15,.4]),0);assert.equal(at('BUILT-216',[.75,.45,.3]),0);
});
test('two-storey facade accepts nine real shade brackets in cut pockets and leaves both floors, side route and roof volume clear',()=>{
 const e=new Engine(doc('facade'));commit(e,assembly.urbanFacadeCommands(s));const c=checkGeometry(e.project,assembly.urbanFacadeClearances);clean(c);assert.equal(Object.values(e.project.instances).filter(i=>i.assetId==='shade').length,9);for(let i=0;i<9;i++){assert.ok(c.contacts['shade-'+i].includes('facade-1'));assert.ok(Math.abs(e.project.instances['shade-'+i].position[2]+.6)<1e-10);}assert.equal((e.project.assets.facade.source!.facade as any).originalFloorPlanAvailable,false);
});
test('architectural role appearance remains independent through palette application, native and GLB export and one undo',async()=>{
 const e=new Engine(doc('materials'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-218',id:'facade'},{op:'produceCatalogAsset',catalogId:'BUILT-219',id:'shade'}]);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'m022-export-'));try{const ex=await exportProject(e.project,dir,'facade'),round=JSON.parse(await readFile(path.join(ex.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,{facade:e.project.assets.facade});assert.deepEqual(round.materials,e.project.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(ex.directory,'visual.glb'));for(const role of['facadeSeal','facadeFrame','glass'])assert.ok(glb.getRoot().listMaterials().some(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role)));}finally{await rm(dir,{recursive:true,force:true});}commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});
test('foreign architectural IDs stay intact, role creation rejects partial failures and one undo removes all newly allocated roles',()=>{
 const p=newProject();p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};for(const id of[164,165,166])p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(e.project),create={op:'produceCatalogAsset',catalogId:'BUILT-219',id:'shade'};assert.throws(()=>commit(e,[create,{op:'produceCatalogAsset',catalogId:'BUILT-207',id:'bad',params:{component:'cap'}}]));assert.deepEqual(e.project,before);commit(e,[create]);for(const id of[164,165,166])assert.deepEqual(e.project.materials[id],before.materials[id]);assert.notEqual(e.project.styles.yunshan.sunshadeMetal,166);assert.ok([...new Grid(e.project.assets.shade.chunks).cells()].some(([,m])=>m===e.project.styles.yunshan.sunshadeMetal));commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
});
