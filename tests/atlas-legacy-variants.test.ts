import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import type {Project,Command,Assembly} from '../src/core/types';
import {parseCatalogCSV} from '../src/core/catalog';
import {productionProject} from '../src/production/style';
import {makeLegacyVariant} from '../src/production/legacy-variants';
import {legacyVariantIds,legacyVariantForms,legacyWallColors} from '../src/production/legacy-variant-spec';
import {legacyVariantFinishCommands} from '../src/production/legacy-variant-finish';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {auditLegacyVariant} from '../scripts/lib/legacy-variant-audit';
import {buildGLB} from '../src/export/exporter';
import {assemblyBoundsM} from '../src/production/assembly-geometry';
import {gltfPoints,pointBounds} from '../scripts/lib/skin-audit';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const project=()=>{const p=productionProject('旧资产变体验证');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};
const make=(id:string,params:Record<string,string|number>={})=>{const p=project(),a=makeLegacyVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));return{p,a};};

test('M06125forms have real closed roof valleys, actual column/bearing/floor contacts, exact native walls and source transport envelopes',()=>{
 const rows=[];for(const id of legacyVariantIds)for(const params of legacyVariantForms(id)){const{p,a}=make(id,params);validateProject(p);rows.push(auditLegacyVariant(p,a));}
 assert.equal(rows.length,25);assert.equal(rows.filter(r=>r.catalogId==='BUILT-084').length,6);assert.equal(rows.filter(r=>r.catalogId==='BUILT-085').length,11);
 for(const row of rows.filter(r=>r.catalogId==='BUILT-084'))assert.ok((row.checks.roof as any).bearingChecks>=135);
});

test('M061 retains actual historic076roof,058native wall,169proxy and181pad without replacing their geometry or layouts',async()=>{
 const index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8'));
 for(const id of['BUILT-084','BUILT-085','BUILT-170','BUILT-182']){
  const{p,a}=make(id),d=a.source!.legacyVariant as any,parentId=a.source!.parentCatalogId,row=index.entries.find((r:any)=>r.id===parentId),saved:Project=JSON.parse(await readFile('projects/'+row.file,'utf8'));
  if(id==='BUILT-085'){assert.equal(hash(geometryData(p.assets[d.parentAssetId])),hash(geometryData(saved.assets[row.assetId])));continue;}
  const original=saved.assemblies![row.assemblyId],retained=d.retainedParentAssembly as Assembly,layout=(a:Assembly)=>a.instances.map(i=>({assetId:i.assetId,position:i.position,rotation:i.rotation}));
  assert.equal(hash(layout(original)),hash(layout(retained)));assert.deepEqual(original.source!.parameters,retained.source!.parameters);
  for(const aid of new Set(retained.instances.map(i=>i.assetId)))assert.equal(hash(geometryData(p.assets[aid])),hash(geometryData(saved.assets[aid])));
 }
});

test('M061 eleven wall appearances coexist with foreign IDs; one scoped palette and failed parameter transactions preserve every geometry and undo',()=>{
 const p=project();p.materials[547]={...p.materials[p.styles.yunshan.wall],id:547,name:'foreign material',color:'#123456'};p.palettes['原始素色']={547:{color:'#123456'}};const original=structuredClone(p),e=new Engine(p);
 commit(e,legacyVariantForms('BUILT-085').map((params,i)=>({op:'produceCatalogVariant',catalogId:'BUILT-085',id:'wall-'+i,params,place:true})));
 assert.deepEqual(e.project.materials[547],original.materials[547]);assert.deepEqual(e.project.styles.yunshan,original.styles.yunshan);
 for(const[tone,color]of Object.entries(legacyWallColors))assert.equal(e.project.materials[e.project.styles['legacy-wall-'+tone].wall].color,color);
 const made=structuredClone(e.project),beforeGeometry=hash(Object.values(e.project.assets).map(geometryData));commit(e,legacyVariantFinishCommands(e.project));assert.equal(hash(Object.values(e.project.assets).map(geometryData)),beforeGeometry);assert.deepEqual(e.project.palettes['原始素色'],original.palettes['原始素色']);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,made.materials);
 const target=e.project.styles['legacy-wall-clinic'].wall;commit(e,[{op:'definePalette',name:'one-wall',materials:{[target]:{color:'#557788'}}},{op:'palette',name:'one-wall'}]);
 assert.equal(e.project.materials[target].color,'#557788');for(const[id,m]of Object.entries(made.materials))if(Number(id)!==target)assert.deepEqual(e.project.materials[id],m);assert.equal(hash(Object.values(e.project.assets).map(geometryData)),beforeGeometry);commit(e,[{op:'undo'}]);
 for(const[catalogId,params]of[['BUILT-084',{roofProgram:'home-wide',wallTone:'clinic'}],['BUILT-085',{legacyWallTone:'bank',roofTone:'blueGreyA'}],['BUILT-170',{vehicleKind:'flight'}],['BUILT-182',{padSize:'civil-7m'}]]as [string,Record<string,string>][]){const before=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:547,properties:{color:'#ffffff'}},{op:'produceCatalogVariant',catalogId,id:'bad',params}]));assert.equal(hash(e.project),before);}
 commit(e,[{op:'undo'}]);for(const key of['assets','instances','assemblies','materials','styles','palettes']as const)assert.equal(hash(e.project[key]??null),hash(original[key]??null));
});

test('M061 public variants survive actual GLB export after metre-space quarter turns, with one undo restoring their original positions',async()=>{
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit]);
 for(const id of legacyVariantIds){const e=new Engine(project());commit(e,[{op:'produceCatalogVariant',catalogId:id,id:'candidate',place:true}]);const a=e.project.assemblies!.candidate;assert.ok(auditLegacyVariant(e.project,a).passed);const original=hash(e.project.instances);
  commit(e,[...a.instances.map(i=>({op:'removeInstance',id:i.id})),{op:'instantiateAssembly',assemblyId:a.id,prefix:'turned',position:[20,0,30],rotation:1}]);
  const g=await io.readBinary(new Uint8Array((await buildGLB(e.project)).glb)),nodes=g.getRoot().listScenes()[0].listChildren(),actual=pointBounds(nodes.flatMap(n=>gltfPoints(n))),expected=assemblyBoundsM(e.project,{instances:Object.values(e.project.instances)});assert.equal(nodes.length,a.instances.length);
  for(const key of['min','max']as const)expected[key].forEach((v,k)=>assert.ok(Math.abs(v-actual[key][k])<1e-4));commit(e,[{op:'undo'}]);assert.equal(hash(e.project.instances),original);
 }
});

test('M061 road/lift and maglev/lightRail preserve shared actual proxy geometry, while cable offset and distinct role contracts remain explicit',()=>{
 const geometry=(id:string)=>{const{p,a}=make(id);return{geometry:hash(a.instances.map(i=>({geometry:geometryData(p.assets[i.assetId]),position:i.position,rotation:i.rotation}))),kind:(a.source!.legacyVariant as any).vehicle.kind};};
 const road=geometry('BUILT-170'),lift=geometry('BUILT-174'),maglev=geometry('BUILT-171'),light=geometry('BUILT-172');assert.equal(road.geometry,lift.geometry);assert.equal(maglev.geometry,light.geometry);assert.notEqual(road.kind,lift.kind);assert.notEqual(maglev.kind,light.kind);
 const{p,a}=make('BUILT-170'),d=a.source!.legacyVariant as any,parent=d.retainedParentAssembly as Assembly;assert.equal(hash(geometryData(p.assets[a.instances[0].assetId])),hash(geometryData(p.assets[parent.instances[0].assetId])));
 const cable=make('BUILT-173');assert.equal(cable.a.instances[0].position[1],2.5);assert.equal((cable.a.source!.legacyVariant as any).vehicle.identityBound,false);
});
