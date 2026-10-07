import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv';
import {Engine,validateProject} from '../src/core/engine';
import {toolDefinitions} from '../src/core/schema';
import type {Command} from '../src/core/types';
import {productionProject} from '../src/production/style';
import {parseCatalogCSV} from '../src/core/catalog';
import {lodVariantIds,lodVariantForms,lodVariantSpec} from '../src/production/lod-variant-spec';
import {makeLodVariant} from '../src/production/lod-variants';
import {characterPaletteFinishCommands} from '../src/production/character-palette-finish';
import {auditLodVariant} from '../scripts/lib/lod-variant-audit';
import {outfitHash as hash} from '../src/production/outfit-components';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const project=()=>{const p=productionProject('LOD variants');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};

test('All60LOD forms preserve full source identity, real posed bounds, UVs, closed surfaces and native/socket/overlay support triangles',()=>{
 const groups=new Map<string,number[]>();let count=0;
 for(const id of lodVariantIds){assert.deepEqual(lodVariantForms(id)[0],lodVariantSpec(id).parameters);for(const params of lodVariantForms(id)){
  const p=project(),a=makeLodVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);
  const saved=JSON.parse(JSON.stringify(p)),check=auditLodVariant(saved,saved.assemblies[a.id]);assert.ok(check.passed);assert.equal(check.originalRuntimeBound,false);
  const values=groups.get(check.sourceCatalogId)??[];values.push(check.levelTriangles);groups.set(check.sourceCatalogId,values);count++;
 }}
 assert.equal(count,60);assert.equal(groups.size,20);for(const values of groups.values()){assert.equal(values.length,3);assert.ok(values[0]>values[1]&&values[1]>values[2]);}
});

test('LOD source parents coexist with all levels and material swaps leave geometry, binding and every retained parent unchanged',()=>{
 const p=project();for(const level of ['near','middle','far']){const a=makeLodVariant(p,'CHAR-361','cat-'+level,'cat',{lodSpecies:'cat',lodLevel:level});p.assemblies??={};p.assemblies[a.id]=a;for(const i of a.instances)p.instances[i.id]=i;}
 const before=structuredClone(p),e=new Engine(p);commit(e,characterPaletteFinishCommands(p));assert.equal(hash(e.project.assets),hash(before.assets));
 const finished=structuredClone(e.project),used=new Set(Object.values(finished.instances).flatMap(i=>finished.assets[i.assetId].meshes!.map(m=>m.material))),material=[...used][0];commit(e,[{op:'material',id:material,properties:{color:'#123456'}}]);assert.equal(hash(e.project.assets),hash(finished.assets));for(const[id,m]of Object.entries(finished.materials))if(Number(id)!==material)assert.deepEqual(e.project.materials[id],m);commit(e,[{op:'undo'}]);assert.equal(hash(e.project.materials),hash(finished.materials));
 for(const a of Object.values(e.project.assemblies!))assert.ok(auditLodVariant(e.project,a).passed);
});

test('Official LOD schema and transaction enforce species/level family, foreign materials, rollback and one-step undo',()=>{
 const schema=new Ajv({strict:false}).compile(toolDefinitions.find(t=>t.name==='edit_transaction')!.inputSchema),p=project();p.materials[2200]={...p.materials[p.styles.yunshan.skinSurface],id:2200,name:'foreign',color:'#102030'};const before=structuredClone(p),e=new Engine(p),commands:Command[]=[{op:'produceCatalogVariant',catalogId:'CHAR-363',id:'fish',place:true,params:{lodSpecies:'ornamentalFish',lodLevel:'far'}},{op:'produceCatalogVariant',catalogId:'CHAR-360',id:'child',place:true,params:{lodLevel:'middle'}}];assert.ok(schema({expectedVersion:0,requestId:'schema-lod',commands}),JSON.stringify(schema.errors));commit(e,commands);assert.deepEqual(e.project.materials[2200],before.materials[2200]);
 for(const bad of [{op:'produceCatalogVariant',catalogId:'CHAR-357',id:'bad',params:{lodLevel:'far'}},{op:'produceCatalogVariant',catalogId:'CHAR-361',id:'bad',params:{lodSpecies:'butterfly'}},{op:'produceCatalogVariant',catalogId:'CHAR-362',id:'bad',params:{lodLevel:'automatic'}},{op:'produceCatalogVariant',catalogId:'CHAR-364',id:'bad',params:{skinTone:1}},{op:'produceCatalogAsset',catalogId:'CHAR-357',id:'bad'}]){const snapshot=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:2200,properties:{color:'#ffffff'}},bad]));assert.equal(hash(e.project),snapshot);}
 commit(e,[{op:'undo'}]);for(const field of ['assets','assemblies','instances','materials','styles','palettes','catalog']as const)assert.equal(hash(e.project[field]??null),hash(before[field]??null));
});
