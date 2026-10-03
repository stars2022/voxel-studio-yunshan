import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {parseAtlasCSV,readReferenceAtlas,atlasFile,readAtlasIndex} from '../src/production/atlas';
import {atlasLifeRecipes} from '../src/production/atlas-life';
import {makeLifeAsset} from '../src/production/life';
import {atlasBuiltRecipes} from '../src/production/atlas-built';
import {makeCatalogAsset,atlasRecipe} from '../src/production/catalog-assets';
import {productionProject} from '../src/production/style';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {gridComponents} from '../src/core/checks';
import {eachCell,type V3} from '../src/core/types';
import {parseCatalogCSV} from '../src/core/catalog';

const input=await readFile(new URL('../projects/reference-atlas/source.csv',import.meta.url),'utf8');
test('all 67 reference sheets map uniquely to 793 catalog IDs without counting layouts and variants as bases',async()=>{
 const rows=parseAtlasCSV(input),catalog=new Map(parseCatalogCSV(await readFile(new URL('../projects/catalog/city-assets.csv',import.meta.url),'utf8')).map(e=>[e.id,e]));assert.equal(rows.length,793);assert.equal(new Set(rows.map(r=>r['图册编号'])).size,67);assert.equal(new Set(rows.map(r=>r['资产ID'])).size,793);for(const r of rows)assert.ok(catalog.has(r['资产ID']));
 assert.deepEqual(['基础组件','组合模板','配色尺寸变体'].map(t=>rows.filter(r=>catalog.get(r['资产ID'])!.source['条目类型']===t).length),[516,186,91]);
 const atlas=await readAtlasIndex(path.resolve('projects'));assert.ok(atlas);assert.ok(atlas.entries.every(e=>e.description&&e.crop.width>0&&e.crop.height>0));
 const r=await readReferenceAtlas(path.resolve('projects'),productionProject('empty'),{sheet:'M067'});assert.equal(r.total,1);assert.equal(r.entries[0].slot,1);assert.equal(r.counts!.accepted,0);assert.equal(r.entries[0].liveAssets.length,0);
});
test('atlas rejects duplicated slots, unknown ID syntax, traversal and malformed CSV instead of executing source content',()=>{
 const line=input.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean).slice(0,2),single=line.join('\n');assert.equal(parseAtlasCSV(single).length,1);assert.throws(()=>parseAtlasCSV(single+'\n'+line[1]),/重复/);assert.throws(()=>parseAtlasCSV(single.replace('LIFE-008','__proto__')),/无效/);assert.throws(()=>parseAtlasCSV(single.replace('图像/M001_','../M001_')),/无效/);assert.throws(()=>parseAtlasCSV(single+'"'),/引号/);
});
test('atlas server files remain confined even with nested directory and file symlinks',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'atlas-test-'));try{await mkdir(path.join(root,'inside'));await writeFile(path.join(root,'inside','file.json'),'{}');await symlink(path.join(root,'inside'),path.join(root,'linked'));await symlink(path.join(root,'inside','file.json'),path.join(root,'link.json'));assert.ok(await atlasFile(root,'inside/file.json'));await assert.rejects(atlasFile(root,'../outside.json'),/越界/);await assert.rejects(atlasFile(root,'linked/file.json'),/符号链接/);await assert.rejects(atlasFile(root,'link.json'),/符号链接/);}finally{await rm(root,{recursive:true,force:true});}
});
test('168 authored reconstructions use persistent voxels, declared source hashes, metre ports and no accidental floating geometry',()=>{
 const ids=[...Object.keys(atlasLifeRecipes).map(n=>'LIFE-'+n.padStart(3,'0')),...Object.keys(atlasBuiltRecipes)];assert.equal(ids.length,192);for(const id of ids){const p=productionProject('test'),a=makeCatalogAsset(id,id,id,p.styles.yunshan);p.assets[id]=a;validateProject(p);assert.equal(a.source!.recipeRevision,3);assert.match((a.source!.reference as any).imageSHA256,/^[0-9a-f]{64}$/);assert.ok(a.parts.length>=4);const g=new Grid(a.chunks),components=gridComponents(g);assert.equal(components.length,atlasRecipe(id).expectedComponents??1,id+' has floating detail');assert.ok(components.every(v=>v>0));for(const port of a.ports)assert.ok(port.position.every(v=>Math.abs(v/a.cellSize-Math.round(v/a.cellSize))<1e-8));assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);}
});
test('counter apertures, basin clearances and pipe bores stay genuinely empty through the whole declared region',()=>{
 for(const n of[38,40,51,53,56,75]){const p=productionProject('test'),id='LIFE-'+String(n).padStart(3,'0'),a=makeLifeAsset(id,id,id,p.styles.yunshan),g=new Grid(a.chunks);assert.ok(a.openings.length>0,id);for(const r of a.openings)eachCell(r,v=>assert.equal(g.get(v),0,id+' opening blocked at '+v));}
 const cell=(n:number,point:V3)=>{const p=productionProject('test'),id='LIFE-'+String(n).padStart(3,'0'),a=makeLifeAsset(id,id,id,p.styles.yunshan);return new Grid(a.chunks).get(point.map(v=>Math.floor(v/a.cellSize)) as V3);};
 assert.equal(cell(30,[.045,.105,.015]),0,'socket bore');assert.ok(cell(30,[.055,.105,.015]),'socket partition');assert.equal(cell(44,[.035,.11,.14]),0,'pot handle hole');assert.equal(cell(46,[.10,.08,.10]),0,'empty bowl');assert.equal(cell(56,[.17,.33,.14]),0,'vertical pipe bore');assert.equal(cell(56,[.02,.15,.14]),0,'side pipe bore');
});
test('atlas recipe batches keep the shared preview/CAS/undo contract and roll back partial failures',async()=>{
 const p=productionProject('test'),rows=parseCatalogCSV(await readFile(new URL('../projects/catalog/city-assets.csv',import.meta.url),'utf8'));p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:Object.fromEntries(rows.map(e=>[e.id,e]))};const e=new Engine(p),env={expectedVersion:0,requestId:'atlas-batch',commands:[{op:'produceCatalogAsset',catalogId:'LIFE-026',id:'rail'},{op:'produceCatalogAsset',catalogId:'LIFE-040',id:'sink'}]};
 const dry=e.execute({...env,dryRun:true});assert.ok(dry.modifiedVoxels>4096);assert.equal(Object.keys(e.project.assets).length,0);assert.throws(()=>e.execute(env),/dry-run/);const done=e.execute({...env,previewToken:dry.previewToken});assert.deepEqual(e.execute(env),done);assert.throws(()=>e.execute({...env,requestId:'old-version'}),/版本冲突/);const before=JSON.stringify(e.project);assert.throws(()=>e.execute({expectedVersion:done.version,requestId:'invalid',commands:[{op:'rebuildCatalogAsset',assetId:'rail',params:{}},{op:'produceCatalogAsset',catalogId:'LIFE-215',id:'fake'}]}));assert.equal(JSON.stringify(e.project),before);e.execute({expectedVersion:done.version,requestId:'undo',commands:[{op:'undo'}]});assert.equal(Object.keys(e.project.assets).length,0);
});
