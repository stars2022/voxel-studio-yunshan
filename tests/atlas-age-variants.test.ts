import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import type {Project,Command,Assembly} from '../src/core/types';
import {toolDefinitions} from '../src/core/schema';
import {parseCatalogCSV} from '../src/core/catalog';
import {productionProject} from '../src/production/style';
import {makeAgeVariant} from '../src/production/age-variants';
import {ageVariantIds} from '../src/production/age-variant-spec';
import {geometryData} from '../src/core/sky';
import {outfitHash} from '../src/production/outfit-components';
import {auditAgeVariant} from '../scripts/lib/age-variant-audit';
import {buildGLB} from '../src/export/exporter';
import {assemblyBoundsM} from '../src/production/assembly-geometry';
import {gltfPoints,pointBounds} from '../scripts/lib/skin-audit';

const hash=(v:unknown)=>outfitHash(v??null),catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const project=()=>{const p=productionProject('年龄身高');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};
const make=(id:string)=>{const p=project(),a=makeAgeVariant(p,id,id.toLowerCase(),id);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));return{p,a};};

test('M061 real independent infant/preschool bodies meet0.6m/1mheights with unscaled heads, retained5mmnative details and actual neck/sole contact',()=>{
 for(const id of ageVariantIds){const{p,a}=make(id);validateProject(p);const check=auditAgeVariant(p,a);assert.ok(check.passed);assert.ok(check.headToHeightRatio>.2);assert.equal(check.neckSolidOverlapSamples,9);assert.equal(check.originalProfileBound,false);}
});

test('M061 age variants retain exact historic adult001parent plus real061/062and067source geometry',async()=>{
 const index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),row=index.entries.find((r:any)=>r.id==='CHAR-001'),saved:Project=JSON.parse(await readFile('projects/'+row.file,'utf8'));
 for(const id of ageVariantIds){const{p,a}=make(id),d=a.source!.ageVariant as any,old=saved.assemblies![row.assemblyId],parent=d.retainedParentAssembly as Assembly,layout=(a:Assembly)=>a.instances.map(i=>({assetId:i.assetId,position:i.position,rotation:i.rotation}));assert.equal(hash(layout(old)),hash(layout(parent)));
  for(const aid of new Set(parent.instances.map(i=>i.assetId)))assert.equal(hash(geometryData(p.assets[aid])),hash(geometryData(saved.assets[aid])));
  for(const [catalogId,assetId]of[[d.bodyCatalogId,d.originalBodyAssetId],['CHAR-067',d.headAssetId]]){const r=index.entries.find((r:any)=>r.id===catalogId);let doc:Project;
   if(id==='CHAR-018'&&catalogId==='CHAR-067')doc=JSON.parse(await readFile('projects/production/atlas-20261004084218/variants/CHAR-067/02/voxels.ysvox.json','utf8'));
   else doc=JSON.parse(await readFile('projects/'+r.file,'utf8'));
   const oldAsset=Object.values(doc.assets).find(a=>a.source?.catalogId===catalogId)!;assert.equal(hash(geometryData(p.assets[assetId])),hash(geometryData(oldAsset)));
  }
 }
});

test('M061 official schema admits CHAR age variants while wrong bands, cross-family keys and wrong catalog types roll back and one undo restores all content',()=>{
 const validate=new Ajv({strict:false}).compile(toolDefinitions.find(t=>t.name==='edit_transaction')!.inputSchema),p=project();p.materials[580]={...p.materials[p.styles.yunshan.skinSurface],id:580,color:'#123456',name:'foreign'};const e=new Engine(p),original=structuredClone(p);
 const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands:[{op:'produceCatalogVariant',catalogId:'CHAR-017',id:'infant',place:true,params:{ageBand:'infant'}}]};assert.ok(validate(request),JSON.stringify(validate.errors));commit(e,request.commands);assert.deepEqual(e.project.materials[580],original.materials[580]);assert.ok(auditAgeVariant(e.project,e.project.assemblies!.infant).passed);
 for(const command of[{op:'produceCatalogVariant',catalogId:'CHAR-017',id:'bad',params:{ageBand:'preschool'}},{op:'produceCatalogVariant',catalogId:'CHAR-018',id:'bad',params:{roofProgram:'farm'}},{op:'produceCatalogVariant',catalogId:'BUILT-170',id:'bad',params:{ageBand:'infant'}},{op:'produceCatalogVariant',catalogId:'CHAR-061',id:'bad'},{op:'produceCatalogAsset',catalogId:'CHAR-017',id:'bad'}]){const before=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:580,properties:{color:'#ffffff'}},command]));assert.equal(hash(e.project),before);}
 commit(e,[{op:'undo'}]);for(const key of['assets','assemblies','instances','materials','styles','palettes','catalog']as const)assert.equal(hash(e.project[key]),hash(original[key]));
});

test('M061 age variants export actual nonphysical GLB metre bounds afterquarterturn with one undo restoring exact source placements',async()=>{
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit]);
 for(const id of ageVariantIds){const e=new Engine(project());commit(e,[{op:'produceCatalogVariant',catalogId:id,id:'age',place:true}]);const a=e.project.assemblies!.age,old=hash(e.project.instances);commit(e,[...a.instances.map(i=>({op:'removeInstance',id:i.id})),{op:'instantiateAssembly',assemblyId:'age',prefix:'turned',position:[3,0,4],rotation:1}]);
  const g=await io.readBinary(new Uint8Array((await buildGLB(e.project)).glb)),nodes=g.getRoot().listScenes()[0].listChildren(),actual=pointBounds(nodes.flatMap(n=>gltfPoints(n))),expected=assemblyBoundsM(e.project,{instances:Object.values(e.project.instances)});assert.equal(nodes.length,2);for(const key of['min','max']as const)expected[key].forEach((v,k)=>assert.ok(Math.abs(v-actual[key][k])<1e-6));commit(e,[{op:'undo'}]);assert.equal(hash(e.project.instances),old);
 }
});
