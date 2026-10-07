import test from'node:test';
import assert from'node:assert/strict';
import {readFile}from'node:fs/promises';
import Ajv from'ajv';
import {Engine,validateProject}from'../src/core/engine';
import {toolDefinitions}from'../src/core/schema';
import type{Command}from'../src/core/types';
import {productionProject}from'../src/production/style';
import {parseCatalogCSV}from'../src/core/catalog';
import {bodyVariantIds,bodyVariantForms,bodyVariantSpec,skinToneColors}from'../src/production/body-variant-spec';
import {makeBodyVariant}from'../src/production/body-variants';
import {characterPaletteFinishCommands}from'../src/production/character-palette-finish';
import {auditBodyVariant}from'../scripts/lib/body-variant-audit';
import {outfitHash as hash}from'../src/production/outfit-components';
import {geometryData}from'../src/core/sky';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const project=()=>{const p=productionProject('body variants');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const make=(id:string,params:Record<string,string|number>)=>{const p=project(),a=makeBodyVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);return{p,a,check:auditBodyVariant(p,a)};};

test('M064–M065 all24body/growth/skin forms retain actual parents, closed surfaces,5mmattached islands and exact foot/head boundaries',()=>{
 for(const id of bodyVariantIds)assert.deepEqual(bodyVariantForms(id)[0],bodyVariantSpec(id).parameters,'Default export must be first finite form');let count=0;for(const id of bodyVariantIds)for(const params of bodyVariantForms(id)){const{p,a,check}=make(id,params);assert.ok(check.passed);const native=JSON.parse(JSON.stringify(p));assert.ok(auditBodyVariant(native,native.assemblies[a.id]).passed);assert.equal(check.originalRuntimeBound,false);count++;}assert.equal(count,24);assert.equal(bodyVariantIds.length,9);
});

test('Both072abdomen families keep true matching seams and strictly increasing closed volumes; late stage retains exact original geometry',()=>{
 for(const fit of['adultA','adultB']){let before=0;for(const stage of['early','middle','late']){const{p,a,check}=make('CHAR-082',{abdomenFit:fit,pregnancyStage:stage}),d=a.source!.bodyVariant as any;assert.ok(check.actualSeamsMatched);assert.ok(check.abdomenVolumeM3>before);before=check.abdomenVolumeM3;if(stage==='late')assert.equal(hash(geometryData(p.assets[d.abdomenAssetId])),hash(geometryData(p.assets[d.parentAssetId])));assert.equal(new Set(a.instances.map(i=>i.assetId)).size,3);}}
});

test('Five fine-skin variants coexist and change only their own actual head/hands/feet while preserving mirrored joints and all other purposes',()=>{
 const p=project();for(let tone=0;tone<5;tone++){const a=makeBodyVariant(p,'CHAR-084','skin'+tone,'skin',{skinTone:tone});p.assemblies??={};p.assemblies[a.id]=a;for(const i of a.instances)p.instances[i.id]={...i,position:[i.position[0]+tone, i.position[1],i.position[2]]};assert.equal(auditBodyVariant(p,a).sourceRGB,skinToneColors[tone]);}
 const source=structuredClone(p),e=new Engine(p);commit(e,characterPaletteFinishCommands(p));for(const a of Object.values(e.project.assemblies!))assert.ok(auditBodyVariant(e.project,a).passed);assert.equal(hash(e.project.assets),hash(source.assets));const before=structuredClone(e.project),skin=e.project.styles['character-palette-body084-0'].skinSurface;commit(e,[{op:'material',id:skin,properties:{color:'#123456'}}]);assert.equal(hash(e.project.assets),hash(before.assets));for(const[id,m]of Object.entries(before.materials))if(Number(id)!==skin)assert.deepEqual(e.project.materials[id],m);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});

test('Official body schema preserves foreign2200/1800 and rejects cross-family parameters/types with complete rollback and one undo',()=>{
 const schema=new Ajv({strict:false}).compile(toolDefinitions.find(t=>t.name==='edit_transaction')!.inputSchema),p=project();for(const id of[1800,2200])p.materials[id]={...p.materials[p.styles.yunshan.skinSurface],id,name:'foreign '+id,color:'#102030'};const before=structuredClone(p),e=new Engine(p),commands:Command[]=[{op:'produceCatalogVariant',catalogId:'CHAR-084',id:'skin',place:true,params:{skinTone:0}},{op:'produceCatalogVariant',catalogId:'CHAR-083',id:'child-head',place:true,params:{growthBand:'infant'}},{op:'produceCatalogVariant',catalogId:'CHAR-082',id:'pregnant',place:true,params:{abdomenFit:'adultB',pregnancyStage:'late'}},{op:'produceCatalogVariant',catalogId:'CHAR-078',id:'short',place:true}];assert.ok(schema({expectedVersion:0,requestId:'schema-body',commands}),JSON.stringify(schema.errors));commit(e,commands);for(const id of[1800,2200])assert.deepEqual(e.project.materials[id],before.materials[id]);assert.notEqual(e.project.styles['character-palette-body084-0'].skinSurface,2200);assert.notEqual(e.project.styles['face-atlas-char-023'].sparseHair,1800);
 for(const bad of[{op:'produceCatalogVariant',catalogId:'CHAR-076',id:'bad',params:{bodyShape:'full'}},{op:'produceCatalogVariant',catalogId:'CHAR-078',id:'bad',params:{growthBand:'child'}},{op:'produceCatalogVariant',catalogId:'CHAR-082',id:'bad',params:{pregnancyStage:'future'}},{op:'produceCatalogVariant',catalogId:'CHAR-083',id:'bad',params:{skinTone:1}},{op:'produceCatalogVariant',catalogId:'CHAR-084',id:'bad',params:{skinTone:5}},{op:'produceCatalogAsset',catalogId:'CHAR-076',id:'bad'}]){const snapshot=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:2200,properties:{color:'#ffffff'}},bad]));assert.equal(hash(e.project),snapshot);}
 commit(e,[{op:'undo'}]);for(const field of['assets','assemblies','instances','materials','styles','palettes','catalog']as const)assert.equal(hash(e.project[field]??null),hash(before[field]??null));
});
