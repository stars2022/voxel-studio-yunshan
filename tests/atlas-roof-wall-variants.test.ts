import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {productionProject} from '../src/production/style';
import {makeRoofWallVariant} from '../src/production/roof-wall-variants';
import {roofWallVariantIds,roofWallVariantForms,roofWallVariantSpec} from '../src/production/roof-wall-variant-spec';
import {roofWallFinishCommands} from '../src/production/roof-wall-finish';
import {wallPurposeColors} from '../src/production/wall-purpose-variant';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {geometryData,assetBoundsM} from '../src/core/sky';
import {Grid} from '../src/core/grid';
import {outfitHash} from '../src/production/outfit-components';
import {auditRoofWallVariant,roofWallClearBox} from '../scripts/lib/roof-wall-variant-audit';
import {architecturePointRoles} from '../scripts/lib/architecture-audit';
import {buildGLB,exportProject} from '../src/export/exporter';
import {terrainAuthorityInstances} from '../src/export/terrain-authority';
import {gltfPoints,pointBounds} from '../scripts/lib/skin-audit';
import {assemblyBoundsM} from '../src/production/assembly-geometry';
import {readProductionLibrary,productionRecipes} from '../src/production/library';
import type {Command,Project} from '../src/core/types';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const project=()=>{const p=productionProject('屋顶与墙面验证');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};
const make=(id:string,params:Record<string,string|number>={})=>{const p=project(),a=makeRoofWallVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));return{p,a};};
const same=(a:unknown,b:unknown)=>assert.equal(outfitHash(a??null),outfitHash(b??null));

test('M060 roof/wall14forms retain real parents, closed continuous parts, native contacts, roof holes and supported upper fixtures',()=>{
 const results=[];for(const id of roofWallVariantIds)for(const params of roofWallVariantForms(id)){const{p,a}=make(id,params);validateProject(p);results.push(auditRoofWallVariant(p,a));}
 assert.equal(results.length,14);const far=results.filter(r=>r.catalogId==='BUILT-082').map(r=>(r.checks.sampling as any).triangles);assert.deepEqual(far,[444,288]);
});

test('M060 gable derivatives preserve the complete historic011 and reflect normals, native pins and ports in X/Z',async()=>{
 const x=make('BUILT-038'),z=make('BUILT-039'),ax=x.p.assets[x.a.instances[0].assetId],az=z.p.assets[z.a.instances[0].assetId];
 const old=JSON.parse(await readFile('projects/atlas-20261003104805-built-011.ysvox.json','utf8'))as Project,historical=Object.values(old.assets).find(a=>a.source?.catalogId==='BUILT-011')!;
 same(geometryData(x.p.assets['source-built-011']),geometryData(historical));assert.equal(new Grid(historical.chunks).count,600131);
 const gx=new Grid(ax.chunks),gz=new Grid(az.chunks);for(const[v,m]of gz.cells())assert.equal(gx.get([v[2],v[1],v[0]]),m);
 for(const[i,m]of az.meshes!.entries()){const target=ax.meshes![i];for(let j=0;j<m.positions.length;j+=3)assert.deepEqual(target.positions.slice(j,j+3),[m.positions[j+2],m.positions[j+1],m.positions[j]]);for(let j=0;j<m.indices.length;j+=3)assert.deepEqual(target.indices.slice(j,j+3),[m.indices[j],m.indices[j+2],m.indices[j+1]]);}
 for(const[i,port]of az.ports.entries())assert.deepEqual(ax.ports[i].position,[port.position[2],port.position[1],port.position[0]]);
});

test('M060 new004 is a real canonical0.4m wall with open door/window and actual custom collision roles',()=>{
 const p=project(),e=new Engine(p);commit(e,[{op:'produceCatalogAsset',catalogId:'BUILT-004',id:'wall'}]);const a=e.project.assets.wall;assert.equal(a.source!.kind,'catalog-recipe');assert.equal(a.source!.reference,null);assert.equal(a.source!.wallThicknessM,.4);assert.ok(a.meshes!.length);assert.equal(new Grid(a.chunks).count,4);
 assert.deepEqual(roofWallClearBox(a,[.65,.01,-.1],[1.35,1.73,.5]),[]);assert.deepEqual(roofWallClearBox(a,[3.21,.91,-.1],[5.59,2.39,.5]),[]);
 for(const x of[.08,6.32])assert.deepEqual(architecturePointRoles(e.project,a,[x,1.45,.2]),[e.project.styles.yunshan.wood],'End posts contain no overlaid wall or mortar');
 const style:Record<string,number>={...p.styles.yunshan,wall:1500};p.materials[1500]={...p.materials[p.styles.yunshan.wall],id:1500,solid:false};const custom=makeCatalogAsset('BUILT-004','custom','custom',style,{},p);assert.ok(custom.meshes!.some(m=>m.material===1500&&!m.collision));assert.ok(custom.meshes!.filter(m=>m.material!==1500&&m.material!==style.architecturePin).every(m=>m.collision));
 commit(e,[{op:'rebuildCatalogAsset',assetId:'wall',params:{}}]);same(geometryData(e.project.assets.wall),geometryData(a));
});

test('M060 eight wall finishes coexist with foreign IDs; appearance replacement, invalid transactions and undo preserve geometry and global walls',()=>{
 const p=project();p.materials[539]={...p.materials[p.styles.yunshan.wall],id:539,name:'foreign user',color:'#123456'};p.palettes['原始素色']={539:{color:'#123456'}};const original=structuredClone(p),e=new Engine(p);
 commit(e,roofWallVariantForms('BUILT-041').map((params,i)=>({op:'produceCatalogVariant',catalogId:'BUILT-041',id:'tone-'+i,params,place:true})));
 const made=structuredClone(e.project);assert.deepEqual(e.project.materials[539],original.materials[539]);same(e.project.styles.yunshan,original.styles.yunshan);assert.equal(new Set(Object.entries(e.project.styles).filter(([s])=>s.startsWith('wall-purpose-')).map(([,s])=>s.wall)).size,8);
 for(const[tone,color]of Object.entries(wallPurposeColors))assert.equal(e.project.materials[e.project.styles['wall-purpose-'+tone].wall].color,color);
 const geometry=outfitHash(Object.values(e.project.assets).map(geometryData));commit(e,roofWallFinishCommands(e.project));assert.equal(outfitHash(Object.values(e.project.assets).map(geometryData)),geometry);same(e.project.palettes['原始素色'],original.palettes['原始素色']);assert.ok(Object.values(e.project.palettes).every(p=>Object.keys(p).length<=512));
 for(const[tone,color]of Object.entries(wallPurposeColors))assert.equal(e.project.materials[e.project.styles['wall-purpose-'+tone].wall].color,color);
 for(const params of[{wallTone:'seed7'},{wallTone:'clinic',floors:1},{gableAxis:'x'}]){const before=outfitHash(e.project);assert.throws(()=>commit(e,[{op:'material',id:539,properties:{color:'#ffffff'}},{op:'produceCatalogVariant',catalogId:'BUILT-041',id:'bad',params}]));assert.equal(outfitHash(e.project),before);}
 commit(e,[{op:'undo'}]);same(e.project.materials,made.materials);same(e.project.assets,made.assets);commit(e,[{op:'undo'}]);for(const f of['assets','instances','assemblies','styles','materials','palettes']as const)same(e.project[f],original[f]);
});

test('M060 public variants export real GLB bounds and retained near authority after quarter turns',async()=>{
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit]);
 for(const id of roofWallVariantIds){const e=new Engine(project());commit(e,[{op:'produceCatalogVariant',catalogId:id,id:'candidate',place:true}]);const a=e.project.assemblies!.candidate;assert.ok(auditRoofWallVariant(e.project,a).passed);const original=outfitHash(e.project.instances);commit(e,[...a.instances.map(i=>({op:'removeInstance',id:i.id})),{op:'instantiateAssembly',assemblyId:a.id,prefix:'turned',position:[20,0,30],rotation:1}]);
  const g=await io.readBinary(new Uint8Array((await buildGLB(e.project)).glb)),nodes=g.getRoot().listScenes()[0].listChildren(),actual=pointBounds(nodes.flatMap(n=>gltfPoints(n))),expected=assemblyBoundsM(e.project,{instances:Object.values(e.project.instances)});assert.equal(nodes.length,a.instances.length);for(const key of['min','max']as const)expected[key].forEach((v,k)=>assert.ok(Math.abs(v-actual[key][k])<1e-4));
  if(id==='BUILT-082'){const authority=terrainAuthorityInstances(e.project)!;assert.ok(authority.every(i=>i.rotation===1));assert.deepEqual(authority.map(i=>i.position),Object.values(e.project.instances).map(i=>i.position));const dir=await mkdtemp('work/roof-authority-');try{await exportProject(e.project,dir);const sidecar=JSON.parse(await readFile(dir+'/terrain-authority.json','utf8'));assert.equal(sidecar.instances.length,19);assert.ok(sidecar.instances.every((i:any)=>i.rotation===1));}finally{await rm(dir,{recursive:true,force:true});}}
  commit(e,[{op:'undo'}]);assert.equal(outfitHash(e.project.instances),original);
 }
});

test('M060 discovery and counts require exact base versus assembly parents, including real non-reference004',async()=>{
 const p=project(),recipes=productionRecipes(p,{query:'BUILT-',limit:100});assert.equal((recipes.entries.find(r=>r.id==='BUILT-004')as any).kind,'base');for(const id of roofWallVariantIds)assert.equal((recipes.entries.find(r=>r.id===id)as any).kind,'variant');
 const dir=await mkdtemp('work/roof-wall-counts-');try{
  const index={format:'yunshan.production-index',version:1,createdAt:'test',counts:{baseModels:2,assemblies:1,variantEntries:0,variantModels:0,generatedEntries:3,notProduced:5},entries:[{id:'BUILT-004',name:'wall',type:'基础组件',stage:'geometry-candidate',file:'wall.ysvox.json',assetIds:['wall']},...roofWallVariantIds.map(id=>({id,name:id,type:'配色尺寸变体',stage:'not-produced',assetIds:[]}))],packs:[],metrics:{}},atlas={format:'yunshan.atlas-production',version:1,entries:[{id:'BUILT-011',kind:'base',assetId:'gable'},{id:'BUILT-075',kind:'assembly',assetIds:['roof']},...roofWallVariantIds.map(id=>({id,kind:'variant',parentCatalogId:roofWallVariantSpec(id).parentCatalogId,finiteForms:roofWallVariantForms(id).length,assetIds:[],assemblyId:id}))],studies:[]};
  await writeFile(dir+'/production-index.json',JSON.stringify(index));await writeFile(dir+'/atlas-production-index.json',JSON.stringify(atlas));const c=(await readProductionLibrary(dir,{limit:100})).counts as Record<string,number>;assert.equal(c.baseModels,2);assert.equal(c.assemblies,1);assert.equal(c.variantEntries,5);assert.equal(c.variantModels,14);
  index.entries[0].stage='not-produced';await writeFile(dir+'/production-index.json',JSON.stringify(index));await assert.rejects(readProductionLibrary(dir,{}),/父模板或基础母版/);index.entries[0].stage='geometry-candidate';await writeFile(dir+'/production-index.json',JSON.stringify(index));(atlas.entries.find(e=>e.id==='BUILT-038')as {parentCatalogId:string}).parentCatalogId='BUILT-075';await writeFile(dir+'/atlas-production-index.json',JSON.stringify(atlas));await assert.rejects(readProductionLibrary(dir,{}),/准确类型/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
