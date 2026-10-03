import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import {lifeLayouts,makeLifeAssembly,nativeLifeId} from '../src/production/layouts';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {gridComponents,checkGeometry} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {newProject} from '../src/core/materials';
import {exportProject} from '../src/export/exporter';
import {eachCell,type Asset,type Command,type V3} from '../src/core/types';
const ids=Array.from({length:12},(_,i)=>180+i),p=productionProject('M011'),s=p.styles.yunshan,cache=new Map<number,{a:Asset,g:Grid}>();
const model=(n:number)=>{if(!cache.has(n)){const id=nativeLifeId(n),a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,s);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;};
const at=(n:number,v:V3)=>{const {a,g}=model(n);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:dry.previewToken});};

test('M011 source and twelve native models retain editable spaces, metre axes and actual construction support',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M011.png')).digest('hex');assert.equal(sha,'f7134c7bbc4a6f9b5bc5c25ab9a41610cc1fdc7f24684fbcc46503e8d9726fd3');
 for(const n of ids){const {a,g}=model(n);const ref=a.source!.reference as any;assert.equal(ref.sheet,'M011');assert.equal(ref.slot,n-179);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.front,'-Z');assert.equal(a.source!.units,'metres');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.ok(a.source!.materialAssignmentReview);assert.equal(g.bounds()!.min[1],0);assert.equal(gridComponents(g).length,n===183?2:1,'unintended disconnected details '+n);assert.ok(a.parts.length>=4);assert.ok(a.openings.length);for(const box of a.openings)eachCell(box,v=>assert.equal(g.get(v),0,n+' obstructed void '+v));}
 assert.equal(model(181).a.cellSize,.005);assert.equal(model(191).a.cellSize,.005);assert.equal(model(183).a.cellSize,.01);
 // A sparse training frame must not be forced down to 20mm simply because its
 // bounding box encloses empty exercise space. Actual occupancy stays bounded.
 const g=model(183).g,b=g.bounds()!;assert.ok(b.max.reduce((v,n,i)=>v*(n-b.min[i]),1)>2_000_000);assert.ok(g.count<1_000_000);assert.throws(()=>makeLifeAsset('LIFE-183','oversized','oversized',s,{width:10}),/未验证/);
});

test('cloth, gift ribbon/paper, ball skins, ceramic pieces, cake, wax and light retain independent physical roles',()=>{
 const categories={festivalRed:'fabric',gameFelt:'fabric',gameWhite:'ceramic',gameBlack:'ceramic',ballOrange:'plastic',ballWhite:'plastic',ballBlue:'plastic',ballYellow:'plastic',ballDark:'plastic',ballRed:'plastic',racketString:'fabric',shuttleVanes:'plastic',shuttleCork:'plant',giftPaper:'paper',giftRibbon:'fabric',cakeCrumb:'food',cakeCream:'food',cakeGlaze:'food',candleWax:'wax',candleWick:'fabric',candleFlame:'emissive',ceramicRed:'ceramic',flowerWhite:'plant',flowerAmber:'plant'};
 assert.equal(new Set(Object.keys(categories).map(r=>s[r])).size,24);for(const[r,c]of Object.entries(categories))assert.equal(p.materials[s[r]].category,c,r);
 assert.equal(at(181,[.3125,.10,.3125]),s.gameWhite);assert.equal(at(181,[.2825,.10,.3125]),s.gameBlack);
 assert.equal(at(184,[.30,.80,.30]),s.gameFelt);assert.equal(at(185,[.30,.50,.11]),s.festivalRed);assert.equal(at(187,[.10,1.03,.26]),s.giftPaper);assert.equal(at(187,[.15,1.10,.23]),s.giftRibbon);
 assert.equal(at(191,[.10,.15,.26]),s.warm,'small lantern must retain an actual emitter core');assert.equal(at(191,[.31,.365,.22]),s.candleWax);assert.equal(at(191,[.31,.42,.22]),s.candleWick);assert.equal(at(191,[.31,.44,.22]),s.candleFlame);assert.equal(at(191,[.35,.14,.22]),s.cakeCrumb);assert.equal(at(191,[.35,.29,.22]),s.cakeCream);
 for(const n of ids){const used=new Set([...model(n).g.cells()].map(([,m])=>m));assert.ok(!used.has(s.paper));for(const r of ['foodRoot','fruitRed','grain','fish','fishBack'])assert.ok(!used.has(s[r]),n+' colour borrowing '+r);if(n!==191)for(const r of['candleWax','candleFlame','cakeCream'])assert.ok(!used.has(s[r]));}
});

test('ball cavities, separated racket strings, coffin chamber, drawer access and cups remain true empty cells',()=>{
 assert.equal(at(182,[.235,.99,.23]),0);assert.equal(at(182,[1.195,1.135,.20]),0);assert.equal(at(182,[1.205,1.135,.20]),s.racketString);
 assert.equal(at(189,[1,.80,.50]),0);assert.equal(at(189,[1,.55,.50]),s.wood);assert.equal(at(189,[.70,1.00,.50]),s.metal);
 assert.equal(at(181,[.30,.05,.18]),0);assert.equal(at(191,[.58,.11,.105]),0);assert.equal(at(191,[.825,.23,.355]),s.wood,'branch inside otherwise hollow vase');
 assert.equal(at(185,[.29,1.50,.085]),0,'actual mounting ring aperture');assert.equal(at(183,[.355,.675,1.34]),0,'upright adjustment slot');
});

test('material packs change appearance only and preserve all festive material identities through one undo',()=>{
 const doc=productionProject('festival');for(const n of ids){const a=model(n).a;doc.assets[a.id]=a;}const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['festivalRed','giftRibbon','ballRed','cakeGlaze','candleWax'];
 const r=commit(e,[{op:'definePalette',name:'红色用途独立替换',materials:Object.fromEntries(changed.map((r,i)=>[s[r],{color:i%2?'#334e89':'#c7996b'}]))},{op:'palette',name:'红色用途独立替换'}]);assert.equal(r.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);if(!changed.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 commit(e,[{op:'undo'}]);for(const key of['assets','styles','materials','palettes']as const)assert.deepEqual(e.project[key],before[key]);const missing={...s};delete missing.candleWax;assert.throws(()=>makeLifeAsset('LIFE-191','bad','bad',missing),/缺少材质角色 candleWax/);
});

test('affected debate, games, training and ritual layouts use actual revised sizes without duplicated props or unsupported placements',()=>{
 for(const number of[204,205,206,207,208,209,210]){const doc=productionProject('M011 layout');for(const[n]of lifeLayouts[number]){const {a}=model(n as number);doc.assets[a.id]=a;}const assembly=makeLifeAssembly(doc,'LIFE-'+number,'room','study');doc.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));validateProject(doc);const c=checkGeometry(doc);assert.deepEqual(c.collisions,[],number+' collision');assert.deepEqual(c.unsupported,[],number+' unsupported');assert.deepEqual(c.warnings,[],number+' budget');assert.ok(c.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),number+' blocked clearance');}
});

test('wax and food classification survives actual GLB/native export, conflicting user IDs, failed transaction and undo',async()=>{
 const doc=newProject(),rows=parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).filter(r=>r.id==='LIFE-191');doc.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:Object.fromEntries(rows.map(r=>[r.id,r]))};for(let id=108;id<=131;id++)doc.materials[id]={...doc.materials[1],id,name:'用户自有 '+id};const e=new Engine(doc),before=structuredClone(e.project),cmd={op:'produceCatalogAsset',catalogId:'LIFE-191',id:'celebration'};
 assert.throws(()=>commit(e,[cmd,{op:'material',id:1,properties:{category:'nonexistent'}}]));assert.deepEqual(e.project,before);commit(e,[cmd]);validateProject(e.project);for(let id=108;id<=131;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);assert.ok(e.project.styles.yunshan.candleWax>131);
 const dir=await mkdtemp(path.join(os.tmpdir(),'festival-export-'));try{await exportProject(e.project,dir,'celebration');const round=JSON.parse(await readFile(path.join(dir,'voxels.ysvox.json'),'utf8'));validateProject(round);assert.deepEqual(round.assets,e.project.assets);assert.deepEqual(round.styles,e.project.styles);const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(dir,'visual.glb'));const m=glb.getRoot().listMaterials().find(m=>(m.getExtras().materialRoles as string[]).some(r=>r==='yunshan.candleWax'));assert.equal(m?.getExtras().materialCategory,'wax');}finally{await rm(dir,{recursive:true,force:true});}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.styles,before.styles);
});
