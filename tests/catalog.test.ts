import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {exportProject} from '../src/export/exporter';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {catalogSummary,parseCatalogCSV,queryCatalog,effectiveStage} from '../src/core/catalog';
import type {Command} from '../src/core/types';
const csv=await readFile(new URL('../projects/catalog/city-assets.csv',import.meta.url),'utf8');
const rows=parseCatalogCSV(csv),head=Object.keys(rows[0].source),encode=(row:Record<string,string>)=>head.map(h=>'"'+(row[h]??'').replaceAll('"','""')+'"').join(','),subset=(...indices:number[])=>head.join(',')+'\r\n'+indices.map(i=>encode(rows[i].source)).join('\r\n');
function apply(e:Engine,commands:Command[]){const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:dry.previewToken});}
function setup(){const e=new Engine(newProject());apply(e,[{op:'importCatalog',csv:subset(0,1),sourceName:'city-assets.csv'},{op:'createAsset',id:'a',name:'test',template:'empty',cellSize:.01},{op:'voxels',assetId:'a',mode:'add',cells:[[0,0,0]],material:1}]);return e;}

test('all 1068 supplied CSV records import losslessly as planned work, not manufactured assets',()=>{
 const e=new Engine(newProject()),r=apply(e,[{op:'importCatalog',csv,sourceName:'city-assets.csv'}]);assert.equal(r.modifiedVoxels,0);assert.equal(Object.keys(e.project.assets).length,0);
 const s=catalogSummary(e.project);assert.equal(s.total,1068);assert.deepEqual(s.types,{'基础组件':552,'组合模板':209,'配色尺寸变体':91,'材质贴图':77,'动画特效':139});assert.equal(s.stages.planned,1068);assert.equal(s.stages.accepted,0);assert.equal(s.sourceStatuses['已集成代码生成'],337);
 assert.deepEqual(Object.values(e.project.catalog!.entries).map(e=>e.source),rows.map(e=>e.source));const saved=JSON.parse(JSON.stringify(e.project));validateProject(saved);assert.deepEqual(saved.catalog,e.project.catalog);
 assert.equal(queryCatalog(e.project,{type:'动画特效',limit:10}).total,139);assert.equal(queryCatalog(e.project,{type:'动画特效',limit:10}).nextOffset,10);assert.equal(queryCatalog(e.project,{query:'BUILT-001'}).entries[0].id,'BUILT-001');
});

test('CSV parser handles BOM, CRLF, escaped quotes and multiline cells; rejects duplicates and malformed data',()=>{
 const source={...rows[0].source,'现有证据':'not a formula =1+1, "quoted"\nsecond line'};
 assert.deepEqual(parseCatalogCSV('\uFEFF'+head.join(',')+'\r\n'+encode(source)+'\r\n')[0].source,source);
 for(const bad of[subset(0,0),head.join(',')+'\n"unterminated',head.join(',')+'\n'+encode({...source,asset_id:'__proto__'}),head.join(',')+'\n'+encode(source)+'x','asset_id,name\n1,test',subset(0).replace('基础组件','unexpected')])assert.throws(()=>parseCatalogCSV(bad));
});

test('catalog and geometry share one atomic, idempotent, conflict-checked undoable transaction',()=>{
 const e=new Engine(newProject()),env={expectedVersion:0,requestId:'catalog-import',commands:[{op:'importCatalog',csv:subset(0),sourceName:'city-assets.csv'}]};const dry=e.execute({...env,dryRun:true});assert.equal(e.project.catalog,undefined);const r=e.execute({...env,previewToken:dry.previewToken});assert.deepEqual(e.execute(env),r);assert.throws(()=>e.execute({...env,requestId:'stale'}),/版本冲突/);
 apply(e,[{op:'undo'}]);assert.equal(e.project.catalog,undefined);apply(e,[{op:'redo'}]);assert.equal(catalogSummary(e.project).total,1);
 const before=JSON.stringify(e.project);assert.throws(()=>apply(e,[{op:'catalogEntry',id:'BUILT-001',note:'should roll back'},{op:'catalogEntry',id:'missing',stage:'review'}]));assert.equal(JSON.stringify(e.project),before);
});

test('model acceptance needs native geometry and a record; changed masters require renewed review',()=>{
 const e=setup();assert.throws(()=>apply(e,[{op:'catalogEntry',id:'BUILT-001',stage:'accepted'}]),/验收/);
 apply(e,[{op:'catalogEntry',id:'BUILT-001',assetIds:['a'],stage:'accepted',note:'native geometry reviewed'}]);let entry=e.project.catalog!.entries['BUILT-001'];assert.equal(effectiveStage(entry,e.project),'accepted');
 apply(e,[{op:'voxels',assetId:'a',mode:'add',cells:[[1,0,0]],material:2}]);entry=e.project.catalog!.entries['BUILT-001'];assert.equal(effectiveStage(entry,e.project),'review');assert.equal(catalogSummary(e.project).stages.accepted,0);
 apply(e,[{op:'catalogEntry',id:'BUILT-001',note:'updated note only'}]);assert.equal(effectiveStage(e.project.catalog!.entries['BUILT-001'],e.project),'review');
 assert.throws(()=>apply(e,[{op:'removeAsset',id:'a'}]),/制作清单引用/);
 apply(e,[{op:'catalogEntry',id:'BUILT-001',assetIds:[],stage:'planned'},{op:'removeAsset',id:'a'}]);assert.equal(Object.keys(e.project.assets).length,0);
});

test('CSV merge retains local notes and omitted rows; changed source requirements invalidate acceptance',()=>{
 const e=setup();apply(e,[{op:'catalogEntry',id:'BUILT-001',assetIds:['a'],stage:'accepted',note:'reviewed'}]);apply(e,[{op:'importCatalog',sourceName:'again.csv',csv:subset(0)}]);assert.equal(catalogSummary(e.project).total,2);assert.equal(effectiveStage(e.project.catalog!.entries['BUILT-001'],e.project),'accepted');
 const source={...rows[0].source,'验收要求':'changed requirement'};apply(e,[{op:'importCatalog',sourceName:'again.csv',csv:head.join(',')+'\n'+encode(source)}]);assert.equal(e.project.catalog!.entries['BUILT-001'].stage,'review');assert.equal(e.project.catalog!.entries['BUILT-001'].note,'reviewed');
});

test('animation catalog entries cannot be passed off as completed static models',()=>{
 const e=setup(),i=rows.findIndex(r=>r.source['条目类型']==='动画特效');apply(e,[{op:'importCatalog',csv:subset(i),sourceName:'animation.csv'}]);assert.throws(()=>apply(e,[{op:'catalogEntry',id:rows[i].id,assetIds:['a'],stage:'accepted',note:'a static box is insufficient'}]),/专用验收/);
 const p=structuredClone(e.project);p.catalog!.entries['BUILT-001'].assetIds=['missing'];assert.throws(()=>validateProject(p),/无效清单/);
});

// A single-asset export must not retain catalog references to omitted masters.
test('single-master native export omits full-library catalog while project export preserves it',async()=>{
 const e=setup();apply(e,[{op:'catalogEntry',id:'BUILT-001',assetIds:['a'],stage:'modeling'}]);const root=await mkdtemp(path.join(os.tmpdir(),'yunshan-catalog-export-'));
 try{
  await exportProject(e.project,path.join(root,'single'),'a');const single=JSON.parse(await readFile(path.join(root,'single','voxels.ysvox.json'),'utf8'));validateProject(single);assert.equal(single.catalog,undefined);assert.deepEqual(single.assets.a,e.project.assets.a);
  await exportProject(e.project,path.join(root,'whole'));const whole=JSON.parse(await readFile(path.join(root,'whole','voxels.ysvox.json'),'utf8'));validateProject(whole);assert.deepEqual(whole.catalog,e.project.catalog);
 }finally{await rm(root,{recursive:true,force:true});}
});
