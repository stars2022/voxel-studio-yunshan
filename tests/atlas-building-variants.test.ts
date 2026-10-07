import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {productionProject} from '../src/production/style';
import {parseCatalogCSV} from '../src/core/catalog';
import {buildingVariantIds,buildingVariantForms,buildingVariantSpec} from '../src/production/building-variant-spec';
import {makeBuildingVariant} from '../src/production/building-variants';
import {auditBuildingVariant} from '../scripts/lib/building-variant-audit';
import {architectureComponents} from '../scripts/lib/architecture-audit';
import {assemblyBoundsM} from '../src/production/assembly-geometry';
import {outfitHash} from '../src/production/outfit-components';
import {readProductionLibrary,productionRecipes} from '../src/production/library';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {buildGLB} from '../src/export/exporter';
import {gltfPoints,pointBounds} from '../scripts/lib/skin-audit';
import {rotateY,type Command,type Project} from '../src/core/types';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const make=(id:string,params:Record<string,string|number>={})=>{const p=productionProject(id);p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};const a=makeBuildingVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));return{p,a};};
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};
const same=(a:unknown,b:unknown)=>assert.equal(outfitHash(a??null),outfitHash(b??null));

test('M059 building variants preserve independent design size and floor-height contracts in38finite forms',()=>{
 assert.equal(buildingVariantIds.flatMap(buildingVariantForms).length,38);
 const expected:Record<string,[number,number,number]>={'quarter-1':[42,34,3.4],'quarter-2':[30,26,3.4],'quarter-3':[36,30,3.4],'quarter-4':[32,28,3.4],farm:[36,26,3.6],'bank-street':[44,34,3.6],'market-street':[34,28,3.6],workshop:[54,42,4.8],civic:[56,42,4.2],academy:[62,46,3.8]};
 for(const id of buildingVariantIds)for(const params of buildingVariantForms(id)){
  const d=buildingVariantSpec(id,params),[w,z,h]=expected[params.buildingPlan],factor=params.sizeCase==='compact'?.94:1.06;
  assert.ok(Math.abs(d.widthM-Math.round(w*factor/.4)*.4)<1e-8);assert.ok(Math.abs(d.depthM-Math.round(z*factor/.4)*.4)<1e-8);assert.equal(d.floorHeightM,h);assert.equal(d.levelTopsM.length,params.floors);
  d.levelTopsM.forEach((y,i)=>assert.ok(Math.abs(y-(.2+i*h))<1e-8));assert.equal(d.originalFloorPlanBound,false);
 }
 assert.equal(buildingVariantSpec('BUILT-025',{buildingPlan:'quarter-2'}).floors,8);
});

test('M059 all38actual building forms have closed parts, connected native details, supported floors and clear stairs and wing connections',()=>{
 let forms=0,routes=0,links=0;
 for(const id of buildingVariantIds)for(const params of buildingVariantForms(id)){
  const{p,a}=make(id,params);validateProject(p);const d=a.source!.buildingVariant as any,r=auditBuildingVariant(p,a);
  assert.ok(r.passed,id+' '+JSON.stringify(params));routes+=r.routes.length;links+=r.links.length;forms++;
  const ground=assemblyBoundsM(p,{instances:a.instances.filter(i=>(a.source!.instanceGroups as any)[i.id]==='ground-floor')});
  const frames=a.instances.filter(i=>(a.source!.instanceGroups as any)[i.id]==='frame');assert.equal(new Set(frames.map(i=>JSON.stringify(i.position))).size,frames.length,'No duplicate bearing columns');
  assert.ok(Math.abs(ground.max[0]-ground.min[0]-d.widthM)<1e-7);assert.ok(Math.abs(ground.max[2]-ground.min[2]-d.depthM)<1e-7);
  assert.equal(a.source!.kind,'catalog-variant');assert.equal(a.source!.parentCatalogId,d.parentCatalogId);assert.ok(r.sources.every(s=>s.unchanged));
 }
 assert.equal(forms,38);assert.ok(routes>2000);assert.ok(links>2000);
});

test('M059 first and last stairs meet actual0.2m floor levels and single-storey farm has no invented upper floor',()=>{
 const farm=make('BUILT-026'),fd=farm.a.source!.buildingVariant as any;assert.equal(fd.floors,1);assert.equal(fd.stairRoutes.length,0);assert.equal(fd.floorInstances.length,1);
 for(const id of ['BUILT-025','BUILT-027','BUILT-028','BUILT-029','BUILT-030']){
  const{a}=make(id),d=a.source!.buildingVariant as any;assert.equal(d.stairRoutes.length,d.floors-1);
  for(const route of d.stairRoutes){assert.ok(Math.abs(route.points[0][1]-d.levelTopsM[route.level]-.2)<1e-8);assert.ok(Math.abs(route.points.at(-1)[1]-d.levelTopsM[route.level+1])<1e-8);}
 }
});

test('M059 public variant creation preserves foreign material IDs and rejects invalid kind and parameter combinations atomically',()=>{
 const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};p.materials[74]={...p.materials[1],id:74,name:'foreign'};const e=new Engine(p);
 commit(e,[{op:'produceCatalogVariant',catalogId:'BUILT-026',id:'farm',place:true}]);assert.equal(e.project.materials[74].name,'foreign');assert.equal(Object.keys(e.project.styles.yunshan).length,512);
 for(const command of[{op:'produceCatalogAssembly',catalogId:'BUILT-026',id:'bad'},{op:'produceCatalogAsset',catalogId:'BUILT-026',id:'bad'},{op:'produceCatalogVariant',catalogId:'BUILT-019',id:'bad'},{op:'produceCatalogVariant',catalogId:'BUILT-025',id:'bad',params:{buildingPlan:'quarter-2',floors:4}},{op:'produceCatalogVariant',catalogId:'BUILT-029',id:'bad',params:{floors:9}},{op:'produceCatalogVariant',catalogId:'BUILT-028',id:'bad',params:{seed:17}}]){
  const before=outfitHash(e.project);assert.throws(()=>commit(e,[{op:'material',id:e.project.styles.yunshan.roof,properties:{color:'#ff0000'}},command]));assert.equal(outfitHash(e.project),before);
 }
 commit(e,[{op:'undo'}]);for(const field of['assets','assemblies','instances','styles','materials']as const)same(e.project[field],p[field]);
});

test('M059 counts keep six variants and38forms separate from four parent templates and existing legacy variants',async()=>{
 const dir=await mkdtemp('work/variant-counts-');try{
  const parents=['BUILT-019','BUILT-020','BUILT-021','BUILT-022'],index={format:'yunshan.production-index',version:1,createdAt:'test',counts:{baseModels:7,assemblies:4,variantEntries:4,variantModels:9,generatedEntries:15,notProduced:6},entries:[...parents.map(id=>({id,name:id,type:'组合模板',stage:'layout-candidate',assetIds:[]})),...buildingVariantIds.map(id=>({id,name:id,type:'配色尺寸变体',stage:'not-produced',assetIds:[]}))],packs:[],metrics:{}},atlas={format:'yunshan.atlas-production',version:1,run:'test',entries:[...parents.map(id=>({id,kind:'assembly',assetIds:[],assemblyId:id})),...buildingVariantIds.map(id=>({id,kind:'variant',parentCatalogId:buildingVariantSpec(id).parentCatalogId,parameters:buildingVariantSpec(id).parameters,finiteForms:buildingVariantForms(id).length,assetIds:[],assemblyId:id}))],studies:[]};
  await writeFile(dir+'/production-index.json',JSON.stringify(index));await writeFile(dir+'/atlas-production-index.json',JSON.stringify(atlas));const result=await readProductionLibrary(dir,{limit:100}),c=result.counts as Record<string,number>;assert.equal(c.baseModels,7);assert.equal(c.assemblies,4);assert.equal(c.variantEntries,10);assert.equal(c.variantModels,47);assert.equal(c.atlasUniqueMasters,0);assert.equal(c.atlasVariantCandidates,6);assert.equal(c.atlasVariantForms,38);assert.equal(c.notProduced,0);
  assert.ok(result.entries.filter(e=>buildingVariantIds.includes(e.id)).every(e=>e.stage==='variant-candidate'));
  atlas.entries=atlas.entries.filter(e=>e.id!=='BUILT-019');await writeFile(dir+'/atlas-production-index.json',JSON.stringify(atlas));await assert.rejects(readProductionLibrary(dir,{limit:100}),/父模板/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('M059 recipe discovery and JSON round trip retain the variant type, parent, parameters and complete source graph',()=>{
 const{p,a}=make('BUILT-027',{buildingPlan:'market-street',sizeCase:'expanded',floors:4}),recipes=productionRecipes(p,{query:'BUILT-02',limit:100});
 for(const id of buildingVariantIds.filter(id=>id!=='BUILT-030'))assert.equal((recipes.entries.find(r=>r.id===id)as any).kind,'variant');
 const copy=JSON.parse(JSON.stringify(p))as Project;validateProject(copy);same(copy.assets,p.assets);same(copy.assemblies,p.assemblies);same(copy.instances,p.instances);assert.equal(copy.assemblies![a.id].source!.parentCatalogId,'BUILT-020');
});

test('M059 quarter turns and independent roof, masonry and glass palettes preserve geometry and undo exactly',()=>{
 const{p,a}=make('BUILT-026'),e=new Engine(p);commit(e,[{op:'instantiateAssembly',assemblyId:a.id,prefix:'turn',position:[50,0,50],rotation:1}]);same(e.project.assets,p.assets);
 for(const asset of Object.values(p.assets).filter(x=>x.id.startsWith('architecture-variant-floor')))for(const mesh of architectureComponents(asset).filter(m=>m.name.startsWith('铺面')))assert.equal(mesh.material,p.styles.yunshan.stone,'Paving must not borrow wall render');
 for(const i of a.instances)same(e.project.instances['turn-'+i.id].position,rotateY(i.position,1).map((v,k)=>v+[50,0,50][k]));commit(e,[{op:'undo'}]);same(e.project.instances,p.instances);
 commit(e,[...referenceFinishCommands(p),{op:'palette',name:'参考材质试作'}]);for(const field of['assets','assemblies','instances','styles']as const)same(e.project[field],p[field]);commit(e,[{op:'undo'}]);same(e.project.materials,p.materials);
});

test('M059 actual exported GLB has one node per placed component with independent metre bounds',async()=>{
 const{p,a}=make('BUILT-026'),io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit]),g=await io.readBinary((await buildGLB(p)).glb),nodes=g.getRoot().listScenes()[0].listChildren();assert.equal(nodes.length,a.instances.length);
 const expected=assemblyBoundsM(p,a),actual=pointBounds(nodes.flatMap(n=>gltfPoints(n)));for(const key of['min','max']as const)for(let k=0;k<3;k++)assert.ok(Math.abs(expected[key][k]-actual[key][k])<1e-5);
});
