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
import {neighborhoodRecipes,neighborhoodVariants,selectNeighborhoodRecipe,contourBottoms,courtStepRuns,lowRampTop} from '../src/production/atlas-neighborhood';
import {builtWidthParameter} from '../src/production/atlas-built';
import * as assembly from '../src/production/neighborhood-assembly';
import {newProject} from '../src/core/materials';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {exportProject} from '../src/export/exporter';
import {eachCell,rotateY,type Asset,type Command,type Project,type V3} from '../src/core/types';
const p=productionProject('M023'),s=p.styles.yunshan,cache=new Map<string,{a:Asset;g:Grid}>();
const model=(id:string,component?:string)=>{const key=id+':'+(component??'default');if(!cache.has(key)){const a=makeCatalogAsset(id,id,id.toLowerCase(),s,component?{component}:{});cache.set(key,{a,g:new Grid(a.chunks)});}return cache.get(key)!;};
const at=(id:string,v:V3,component?:string)=>{const {a,g}=model(id,component);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
const catalogue=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
function doc(name:string){const p=productionProject(name);p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};return p;}
function clean(c:ReturnType<typeof checkGeometry>){for(const k of['unsupported','collisions','gaps','warnings']as const)assert.deepEqual(c[k],[],k);assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),JSON.stringify(c.openings));assert.ok(c.clearances.every(o=>o.clear),JSON.stringify(c.clearances.filter(o=>!o.clear)));}
const supportGrids=new WeakMap<Asset,Grid>();
function solidAt(p:Project,world:V3){return Object.values(p.instances).some(i=>{const a=p.assets[i.assetId],local=rotateY(world.map((v,d)=>v-i.position[d]) as V3,4-i.rotation),v=local.map((n,d)=>Math.floor((n-a.origin[d]+1e-8)/a.cellSize)) as V3,m=(supportGrids.get(a)??(supportGrids.set(a,new Grid(a.chunks)),supportGrids.get(a)!)).get(v);return !!m&&p.materials[m].solid;});}
test('M023 twelve source families and fourteen native shapes have exact dimensions, unique connected geometry, real openings and reference provenance',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M023.png')).digest('hex'),hashes=new Set<string>();assert.equal(Object.keys(neighborhoodRecipes).length,12);
 for(const[slot,id]of Object.keys(neighborhoodRecipes).entries())for(const component of Object.keys(neighborhoodVariants[id]??{default:1})){
  const c=component==='default'?undefined:component,{a,g}=model(id,c),recipe=selectNeighborhoodRecipe(id,c)!,ref=a.source!.reference as any;assert.equal(ref.sheet,'M023');assert.equal(ref.slot,slot+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.gameIntegration,false);assert.equal(gridComponents(g).length,1,id+component);assert.ok(g.count<1_000_000);assert.ok(a.parts.length>=5);const b=g.bounds()!;assert.ok(b.max.every((v,i)=>Math.abs((v-b.min[i])*a.cellSize-recipe.size[i])<1e-10),id+component);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,id+' '+v));const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash));hashes.add(hash);const d=doc(id);d.assets[a.id]=a;validateProject(d);
 }assert.equal(hashes.size,14);
});
test('actual cells keep roof tile, waterproofing, timber grain, window seals, projector lens and inactive emitter distinct',()=>{
 for(const[id,v,r]of[
  ['BUILT-225',[.6,1,.8],'structuralConcrete'],['BUILT-225',[2,3.05,1],'bridgeBearing'],['BUILT-232',[.55,1.55,.55],'wall'],['BUILT-233',[1,.775,2],'wall'],['BUILT-234',[1,lowRampTop(121)-.025,6.075],'wall'],
  ['BUILT-235',[2,2.7,.2],'woodEdge'],['BUILT-235',[2,3,.2],'roof'],['BUILT-235',[2,2.925,.2],'waterproofMembrane'],['BUILT-240',[1,.475,.2],'waterproofMembrane'],['BUILT-240',[.225,.425,.2],'structuralConcrete'],
  ['BUILT-241',[.5,1.15,.5],'projectorLens'],['BUILT-241',[.5,1.075,.5],'projectorEmitter'],['BUILT-242',[.125,.4,.2],'glass'],['BUILT-243',[1,.75,.175],'metal'],
  ['BUILT-244',[.2,.6,.09],'wood'],['BUILT-244',[.5,1.12,.1],'woodEdge'],['BUILT-244',[.08,.35,.06],'bronze'],['BUILT-245',[.5,.8,.13],'glass'],['BUILT-245',[.175,.8,.1],'timberWindowSeal'],
  ['BUILT-246',[.1,.525,.01],'roof'],['BUILT-246',[.1,.475,.01],'waterproofMembrane'],['BUILT-246',[.1,.425,.01],'woodEdge'],['BUILT-246',[.15,.325,.2],'wood'],
 ]as[string,V3,string][])assert.equal(at(id,v),s[r],id+' '+r+' '+v);
 assert.equal(at('BUILT-244',[.04,.35,.1]),0);for(const z of[.1,.16])assert.equal(at('BUILT-245',[.5,.8,z]),0);assert.equal(at('BUILT-241',[.125,.375,.5]),0);assert.equal(p.materials[s.projectorLens].category,'glass');assert.equal(p.materials[s.projectorEmitter].intensity,0);assert.equal(p.materials[s.projectorEmitter].solid,false);assert.notEqual(s.timberWindowSeal,s.facadeSeal);assert.notEqual(s.projectorLens,s.glass);
});
test('stair guard component enums reject unrelated choices and rebuild preserves origin and single undo geometry',()=>{
 assert.deepEqual((builtWidthParameter('BUILT-242') as any).component.enum,['stairFlight','halfTurn','upperWell']);const e=new Engine(doc('variants'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-242',id:'guard'},{op:'metadata',assetId:'guard',origin:[.1,0,0]}]);const before=structuredClone(e.project.assets.guard);commit(e,[{op:'rebuildCatalogAsset',assetId:'guard',params:{component:'halfTurn'}}]);assert.equal(e.project.assets.guard.source!.component,'halfTurn');assert.deepEqual(e.project.assets.guard.origin,before.origin);commit(e,[{op:'undo'}]);assert.ok(e.project.assets.guard.version>before.version);assert.deepEqual({...e.project.assets.guard,version:before.version},before);
 for(const[catalogId,component]of[['BUILT-242','cap'],['BUILT-225','stairFlight'],['BUILT-207','halfTurn'],['LIFE-001','upperWell']]){const snapshot=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId,id:'bad',params:{component}}]));assert.deepEqual(e.project,snapshot);}
});
test('skywalk support physically carries both connected floor levels with clear 1.72m routes and no detached decoration',()=>{
 const e=new Engine(doc('skywalk'));commit(e,assembly.neighborhoodSkywalkCommands(s));const c=checkGeometry(e.project,assembly.neighborhoodSkywalkClearances);clean(c);assert.ok(c.contacts['floors-1'].includes('bearing-1'));for(const y of[3.2,6.4]){assert.ok(solidAt(e.project,[2,y-.05,1]));assert.ok(solidAt(e.project,[2,y+.05,1]));assert.ok(solidAt(e.project,[2,y+.05,2.45]));}assert.equal((e.project.assets.bearing.source!.sharedStructure as any).originalFloorPlanAvailable,false);
});
test('contour platform contacts each explicit terrain band, stairs rise exactly 0.2m and 1:10 voxel ramp has flat ends and solid bottom',()=>{
 const e=new Engine(doc('terrain'));commit(e,assembly.neighborhoodTerrainCommands(s));clean(checkGeometry(e.project,assembly.neighborhoodTerrainClearances));for(let i=0;i<4;i++){const y=.2+contourBottoms[i];assert.ok(solidAt(e.project,[i*2+1,y-.05,1]));assert.ok(solidAt(e.project,[i*2+1,y+.05,1]));assert.equal(at('BUILT-232',[i*2+1,contourBottoms[i]-.05,1]),0);}
 courtStepRuns.forEach((z,i)=>{assert.ok(at('BUILT-233',[1.8,(i+1)*.2-.025,z+.2]));assert.equal(at('BUILT-233',[1.8,(i+1)*.2+.025,z+.2]),0);});const{g}=model('BUILT-234');let previous=0;for(let z=0;z<240;z++){const top=Math.round(lowRampTop(z)/.05);for(let y=0;y<top;y++)assert.ok(g.get([32,y,z]));assert.equal(g.get([32,top,z]),0);if(z)assert.ok(top-previous>=0&&top-previous<=1);previous=top;}for(const i of[0,19])assert.equal(lowRampTop(i),.2);for(const i of[220,239])assert.equal(lowRampTop(i),1.2);assert.equal((model('BUILT-234').a.source!.ramp as any).analyticSlope,false);
});
test('courtyard gateway supports a 0.35m-radius disk and 1.72m body; planter cavities and drains stay open with no plants or fake hologram',()=>{
 const e=new Engine(doc('garden'));commit(e,assembly.neighborhoodGardenCommands(s));clean(checkGeometry(e.project,assembly.neighborhoodGardenClearances));for(const z of[0,1,2.5])for(let x=-7;x<=7;x++)for(let zz=-7;zz<=7;zz++){const dx=x*.05,dz=zz*.05;if(dx*dx+dz*dz<=.35*.35)assert.ok(solidAt(e.project,[3+dx,.15,z+dz]));}
 for(const y of[.4,1.4,2.4]){assert.equal(at('BUILT-240',[1,y+.2,.3]),0);assert.equal(at('BUILT-240',[1.2,y+.025,.35]),0);}assert.ok(solidAt(e.project,[8.1,1,.775]));assert.ok(solidAt(e.project,[8.1,1,.825]));assert.equal((e.project.assets.planter.source!.planting as any).plantsIncluded,false);const projector=e.project.assets.emitter.source!.projector as any;for(const key of['powerBound','signLocationBound','hologramIncluded','chineseUIIncluded'])assert.equal(projector[key],false);
});
test('double-flight, half-turn and well rails attach to actual surfaces while upper well and roof public exit stay clear',()=>{
 const e=new Engine(doc('stairs'));commit(e,assembly.neighborhoodStairsCommands(s));const c=checkGeometry(e.project,assembly.neighborhoodStairClearances);clean(c);for(const name of['lower-out','lower-in','upper-out','upper-in','turn-1','well-1'])assert.ok(c.contacts[name].includes('stairs-1'));for(const name of['roof-back','roof-left','roof-right'])assert.ok(c.contacts[name].includes('roof-1'));
 for(const x of[.9,2.7])for(let dx=-7;dx<=7;dx++)for(let dz=-7;dz<=7;dz++)if(dx*dx+dz*dz<=49)assert.ok(solidAt(e.project,[x+dx*.05,1.775,3.75+dz*.05]));assert.equal(new Set(Object.values(e.project.assets).map(a=>a.source?.catalogId).filter(Boolean)).size,2);
});
test('same native door leaf closes or clears an authored opening with invariant hinge axis; true window opening and supported thin eave remain intact',()=>{
 let closed:Project|undefined;for(const open of[false,true]){const e=new Engine(doc('joinery'));commit(e,assembly.neighborhoodJoineryCommands(s,open));const c=checkGeometry(e.project,open?assembly.neighborhoodJoineryClearances:[]);clean(c);for(const name of['door-1','window-1','eave-1'])assert.ok(c.contacts[name].length);const probe=checkGeometry(e.project,[assembly.neighborhoodClosedDoorClearance]).clearances[0];assert.equal(probe.clear,open);if(!open){assert.ok(probe.blockedBy.includes('door-1'));closed=e.project;}else assert.deepEqual(e.project.assets.door,closed!.assets.door);
 const i=e.project.instances['door-1'],axis=rotateY([.04,0,.1],i.rotation).map((n,d)=>n+i.position[d]);assert.ok(axis.every((n,d)=>Math.abs(n-[.5,.2,.38][d])<1e-8));assert.equal((e.project.assets.door.source!.door as any).runtimeOperation,false);assert.equal((e.project.assets.eave.source!.roofRegion as any).explodedView,false);assert.deepEqual(e.project.instances['eave-1'].position,[.8,3.2,-.2]);}
});
test('lens, inactive emitter and timber seal appearance remain independent across palette, native GLB export and one undo',async()=>{
 const e=new Engine(doc('appearance'));commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-241',id:'emitter'},{op:'produceCatalogAsset',catalogId:'BUILT-245',id:'window'}]);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);}assert.equal(e.project.materials[s.projectorEmitter].intensity,0);
 const dir=await mkdtemp(path.join(os.tmpdir(),'m023-export-'));try{const ex=await exportProject(e.project,dir,'emitter'),round=JSON.parse(await readFile(path.join(ex.directory,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,{emitter:e.project.assets.emitter});assert.deepEqual(round.materials,e.project.materials);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(ex.directory,'visual.glb'));for(const role of['projectorEmitter','projectorLens'])assert.ok(glb.getRoot().listMaterials().some(m=>(m.getExtras().materialRoles as string[]).includes('yunshan.'+role)));}finally{await rm(dir,{recursive:true,force:true});}commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});
test('new roles preserve foreign 167–169 slots, roll back failed transactions and disappear together after one undo',()=>{
 const p=newProject();p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:structuredClone(catalogue)};for(const id of[167,168,169])p.materials[id]={...p.materials[1],id,name:'foreign '+id};const e=new Engine(p),before=structuredClone(p),create={op:'produceCatalogAsset',catalogId:'BUILT-241',id:'emitter'};assert.throws(()=>commit(e,[create,{op:'produceCatalogAsset',catalogId:'BUILT-242',id:'bad',params:{component:'cap'}}]));assert.deepEqual(e.project,before);commit(e,[create]);for(const id of[167,168,169])assert.deepEqual(e.project.materials[id],before.materials[id]);assert.notEqual(e.project.styles.yunshan.projectorEmitter,168);assert.ok([...new Grid(e.project.assets.emitter.chunks).cells()].some(([,m])=>m===e.project.styles.yunshan.projectorEmitter));commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials']as const)assert.deepEqual(e.project[k],before[k]);
});
