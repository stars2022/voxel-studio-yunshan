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
import {portalRecipes,portalVariants,selectPortalRecipe,taxiRoute} from '../src/production/atlas-portals';
import {builtWidthParameter} from '../src/production/atlas-built';
import * as assembly from '../src/production/portal-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,rotateY,type Asset,type Command,type Project,type V3} from '../src/core/types';
const p=productionProject('M024'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string,component?:string)=>{const key=id+':'+(component??'default');if(!cache.has(key)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s,component?{component}:{});cache.set(key,{a,g:new Grid(a.chunks)});}return cache.get(key)!;};
const at=(id:string,v:V3,component?:string)=>{const {a,g}=model(id,component);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function doc(name:string){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
function clean(c:ReturnType<typeof checkGeometry>){for(const k of['unsupported','collisions','gaps','warnings']as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances.filter(o=>!o.clear)));}
const supportGrids=new WeakMap<Asset,Grid>();
function solidAt(p:Project,world:V3){return Object.values(p.instances).some(i=>{const a=p.assets[i.assetId],local=rotateY(world.map((v,d)=>v-i.position[d]) as V3,4-i.rotation),v=local.map((n,d)=>Math.floor((n-a.origin[d]+1e-8)/a.cellSize)) as V3,m=(supportGrids.get(a)??(supportGrids.set(a,new Grid(a.chunks)),supportGrids.get(a)!)).get(v);return !!m&&p.materials[m].solid;});}
import {meshAsset} from '../src/core/mesh';
test('M024 twelve source families and fourteen native shapes have exact dimensions, unique connected geometry, real openings and reference provenance',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M024.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(portalRecipes).length,12);
 for(const[slot,id]of Object.keys(portalRecipes).entries())for(const component of Object.keys(portalVariants[id]??{default:1})){
  const c=component==='default'?undefined:component,{a,g}=model(id,c),recipe=selectPortalRecipe(id,c)!,ref=a.source!.reference as any;assert.equal(ref.sheet,'M024');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id+component);assert.ok(g.count<1_000_000);assert.ok(a.parts.length>=5);const b=g.bounds()!;assert.ok(b.max.every((v,i)=>Math.abs((v-b.min[i])*a.cellSize-recipe.size[i])<1e-10),id+component);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);if(a.source!.triangleBudget)assert.ok(meshAsset(a,p.materials).reduce((n,b)=>n+b.indices.length/3,0)<=Number(a.source!.triangleBudget));const d=doc(id);d.assets[a.id]=a;validateProject(d);
 }assert.equal(hashes.size,14);
});
const probes:[string,V3,string][]=[['BUILT-248',[.7,.1,.3],'wood'],['BUILT-249',[.2,.5,.08],'lanternPaper'],['BUILT-249',[.3,.5,.3],'warm'],['BUILT-249',[.26,.1,.26],'lanternTassel'],['BUILT-250',[.5,.05,.5],'mortar'],['BUILT-251',[.1,1,0],'warm'],['BUILT-268',[5,.5,4],'airfieldYellow'],['BUILT-268',[18,.5,3],'airfieldWhite'],['BUILT-269',[.5,.5,4],'airfieldRed'],['BUILT-270',[.1,3,1],'glass'],['BUILT-273',[.32,1,.22],'metalBright'],['BUILT-276',[2,.15,.05],'airfieldYellow'],['BUILT-286',[.6,.01,.2],'rubber'],['BUILT-287',[1.93,2,1],'glass'],['BUILT-287',[1.91,1.21,.5],'vehicleSeal'],['BUILT-288',[.32,.05,.5],'couplerHose']];
test('actual cells separate paper, noncollision fabric, paint, steel, tire, hose and annular window seal',()=>{
 for(const[id,v,r]of probes)assert.equal(at(id,v),s[r],id+' '+r+' '+v);assert.equal(p.materials[s.lanternTassel].solid,false);assert.equal(p.materials[s.lanternPaper].category,'paper');for(const r of['airfieldYellow','airfieldWhite','airfieldRed'])assert.equal(p.materials[s[r]].category,'ink');assert.notEqual(s.couplerHose,s.rubber);assert.notEqual(s.couplerHose,s.vehicleSeal);for(const x of[1.9,1.95])assert.equal(at('BUILT-287',[x,2,1]),0);
});
test('component enums stay recipe-specific; rebuild preserves origin and one undo restores geometry',()=>{
 assert.deepEqual((builtWidthParameter('BUILT-268') as any).component.enum,['taxiStraight','taxiCorner']);assert.deepEqual((builtWidthParameter('BUILT-270') as any).component.enum,['boardingBridge','boardingStairs']);const e=new Engine(doc('variants'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-268',id:'taxi'},{op:'metadata',assetId:'taxi',origin:[.2,0,0]}]);const before=structuredClone(e.project.assets.taxi);commit(e,[{op:'rebuildCatalogAsset',assetId:'taxi',params:{component:'taxiCorner'}}]);assert.equal(e.project.assets.taxi.source!.component,'taxiCorner');assert.deepEqual(e.project.assets.taxi.origin,before.origin);commit(e,[{op:'undo'}]);assert.deepEqual({...e.project.assets.taxi,version:before.version},before);
 for(const[catalogId,component]of[['BUILT-268','boardingStairs'],['BUILT-270','taxiCorner'],['BUILT-251','taxiStraight'],['LIFE-001','boardingBridge']]){const snapshot=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId,id:'bad',params:{component}}]));assert.deepEqual(e.project,snapshot);}
});
test('bracket supports a real beam and lantern hangs through its bore; finite stone edge and A1 replacement remain clear',()=>{
 const e=new Engine(doc('craft'));commit(e,assembly.portalCraftCommands(s));const c=checkGeometry(e.project,assembly.portalCraftClearances);clean(c);assert.ok(c.contacts['lantern-1'].includes('support-1'));assert.ok(c.contacts['bracket-1'].includes('support-1'));for(const y of[2,2.8]){assert.ok(solidAt(e.project,[.8,y-.01,.4]));assert.ok(solidAt(e.project,[.8,y+.01,.4]));}const o=e.project.assets['a1-frame'].source!.externalOriginal as any;assert.equal(o.originalValidated,false);assert.equal(o.originalReceived,false);assert.equal(o.authoredReplacement,true);assert.deepEqual((e.project.assets['stone-edge'].source!.stoneEdge as any).blocksM,[.2,.6]);
 const gallery=doc('hanging');gallery.assets.lantern=e.project.assets.lantern;gallery.instances.one={id:'one',name:'one',parent:null,assetId:'lantern',position:[0,0,0],rotation:0};assert.deepEqual(checkGeometry(gallery).unsupported,['one']);
});
const portWorld=(p:Project,i:string,id:string)=>{const inst=p.instances[i],port=p.assets[inst.assetId].ports.find(p=>p.id===id)!;return{point:rotateY(port.position,inst.rotation).map((v,d)=>v+inst.position[d]),normal:rotateY(port.normal,inst.rotation)};};
test('straight and curved taxi routes share real closed pavement and matching ports; stand placements have distinct IDs, headings and empty envelopes',()=>{
 const e=new Engine(doc('airfield'));commit(e,assembly.portalAirfieldCommands(s));clean(checkGeometry(e.project,assembly.portalAirfieldClearances));for(const[a,b]of[['taxi-1','corner-1'],['corner-1','taxi-2']]){const out=portWorld(e.project,a,'exit'),entry=portWorld(e.project,b,'entry');assert.ok(out.point.every((n,d)=>Math.abs(n-entry.point[d])<1e-8));assert.ok(out.normal.every((n,d)=>n===-entry.normal[d]));}
 for(const c of['taxiStraight','taxiCorner']){const {a,g}=model('BUILT-268',c);assert.deepEqual((a.source!.taxi as any).routeM,taxiRoute(c));for(const point of taxiRoute(c)){const x=Math.min((a.source!.dimensionsM as V3)[0]-.2,Math.max(.2,point[0])),z=Math.min((a.source!.dimensionsM as V3)[2]-.2,Math.max(.2,point[2]));for(const y of[.1,.3,.5])assert.ok(g.get([Math.floor(x/.2),Math.floor(y/.2),Math.floor(z/.2)]));}}
 const stands=assembly.authoredStands;assert.equal(new Set(stands.map(s=>s.id)).size,2);assert.notDeepEqual(stands[0].nose,stands[1].nose);assert.ok(stands[1].centerM[0]-stands[0].centerM[0]>8.4);assert.equal((e.project.assets.stand.source!.stand as any).aircraftIncluded,false);assert.equal((e.project.assets.taxi.source!.aviation as any).routeRuntime,false);
});
test('twelve real boarding steps and six berth steps connect to supported receiving floors with body clearances and unbound access',()=>{
 for(const [name,fn,clear]of [assembly.portalScenarios[2],assembly.portalScenarios[3]]){const e=new Engine(doc(name));commit(e,fn(s));clean(checkGeometry(e.project,clear));if(name==='boarding'){for(const z of[-.01,.01,7.99,8.01,9.8])assert.ok(solidAt(e.project,[1.2,2.575,z]));assert.equal((e.project.assets.boundary.source!.aviation as any).accessPermissionBound,false);}else{for(const z of[5.59,5.61,7.9])assert.ok(solidAt(e.project,[2.8,1.15,z]));assert.equal((e.project.assets.berth.source!.berth as any).originalRingId,null);}}
 for(let i=0;i<12;i++){assert.ok(at('BUILT-270',[1.2,(i+1)*.2-.025,i*.4+.2],'boardingStairs'));assert.equal(at('BUILT-270',[1.2,(i+1)*.2+.025,i*.4+.2],'boardingStairs'),0);}
});
test('two tire wheels physically carry a bore-fitting axle with one metre chassis clearance and no steering binding',()=>{
 const e=new Engine(doc('wheel'));commit(e,assembly.portalWheelCommands(s));const c=checkGeometry(e.project,assembly.portalWheelClearances);clean(c);for(const n of['wheel-left','wheel-right'])assert.ok(c.contacts[n].includes('axle-1'));assert.ok(solidAt(e.project,[1.6,.6,-.6]));assert.ok(solidAt(e.project,[1.6,1.01,.5]));assert.equal((e.project.assets.wheel.source!.wheel as any).steeringBound,false);
});
test('fixed open door respects unchanged car opening, and coupler stays between actual consecutive end faces with supported plates',()=>{
 const e=new Engine(doc('vehicle'));commit(e,assembly.portalVehicleCommands(s));const c=checkGeometry(e.project,assembly.portalVehicleClearances);clean(c);assert.deepEqual(e.project.assets.car.chunks,model('BUILT-177').a.chunks);assert.deepEqual(e.project.assets.car.openings,model('BUILT-177').a.openings);assert.equal(e.project.instances['coupler-1'].position[2],10);assert.equal(e.project.instances['car-2'].position[2],11.4);assert.ok(c.contacts['coupler-1'].includes('support-1'));for(const z of[9.99,10.01,11.39,11.41])assert.ok(solidAt(e.project,[1.5,1,z]));assert.equal((e.project.assets.door.source!.door as any).sharedStateBound,false);assert.equal((e.project.assets.door.source!.door as any).bodyGeometryRewritten,false);
});
test('independent paint and hose appearances preserve geometry through palette, native/GLB export and one undo',async()=>{
 const e=new Engine(doc('appearance'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-269',id:'stand'},{op:'produceCatalogAsset',catalogId:'BUILT-288',id:'coupler'}]);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);}
 const dir=await mkdtemp(path.join(os.tmpdir(),'m024-export-'));try{const ex=await exportProject(e.project,dir),round=JSON.parse(await readFile(path.join(ex.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,e.project.assets);assert.deepEqual(round.materials,e.project.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(ex.directory,'visual.glb'));for(const role of['airfieldYellow','airfieldWhite','airfieldRed','couplerHose'])assert.ok(glb.getRoot().listMaterials().some(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role)));}finally{await rm(dir,{recursive:true,force:true});}commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});
test('new roles preserve foreign 170–173 slots, roll back failure and disappear with asset after one undo',()=>{
 const p=newProject();p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};for(const id of[170,171,172,173])p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(p),create={op:'produceCatalogAsset',catalogId:'BUILT-288',id:'coupler'};assert.throws(()=>commit(e,[create,{op:'produceCatalogAsset',catalogId:'BUILT-270',id:'bad',params:{component:'taxiCorner'}}]));assert.deepEqual(e.project,before);commit(e,[create]);for(const id of[170,171,172,173])assert.deepEqual(e.project.materials[id],before.materials[id]);assert.notEqual(e.project.styles.yunshan.couplerHose,172);assert.ok([...new Grid(e.project.assets.coupler.chunks).cells()].some(([,m])=>m===e.project.styles.yunshan.couplerHose));commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
});
