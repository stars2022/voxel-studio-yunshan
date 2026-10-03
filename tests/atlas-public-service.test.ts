import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeLifeAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {lifeLayouts,makeLifeAssembly,nativeLifeId} from '../src/production/layouts';
import {Grid} from '../src/core/grid';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {parseCatalogCSV} from '../src/core/catalog';
import {gridComponents,checkGeometry} from '../src/core/checks';
import {eachCell,type Asset,type V3,type Command} from '../src/core/types';

const ids=Array.from({length:12},(_,i)=>147+i),cache=new Map<number,{a:Asset,g:Grid}>();
function model(n:number){if(!cache.has(n)){const id=nativeLifeId(n),p=productionProject('test'),a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,p.styles.yunshan);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;}
const at=(n:number,v:V3)=>model(n).g.get(v.map(x=>Math.floor((x+1e-8)/model(n).a.cellSize)) as V3);
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};

test('M009 source, metre axes and physical supports are preserved; only the judge chairs are separate bodies',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M009.png')).digest('hex');
 assert.equal(sha,'364bf3033092f2f0aba41635ddd743afb07e6a17df0b9948fd35aa5832d3dd2d');
 for(const n of ids){const {a,g}=model(n),ref=a.source!.reference as any;assert.equal(ref.sheet,'M009');assert.equal(ref.slot,n-146);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.units,'metres');assert.equal(a.source!.front,'-Z');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.equal(g.bounds()!.min[1],0);assert.equal(gridComponents(g).length,n===153?4:1,n+' no floating details');}
 assert.equal(model(158).a.cellSize,.005);assert.equal(model(153).a.parts.filter(p=>/^独立高背椅 [123]$/.test(p.name)).length,3);
});

test('cabinet chambers, desk knees, ladder intervals and camera body stay empty in the actual grid',()=>{
 for(const n of ids){const {a,g}=model(n);assert.ok(a.openings.length);for(const opening of a.openings)eachCell(opening,v=>assert.equal(g.get(v),0,n+' opening '+v));}
 assert.ok(at(152,[.11,.145,.10]),'drawer slide attaches to cabinet floor');assert.ok(at(152,[.11,.165,.10]),'slide supports drawer bottom');
 assert.equal(at(156,[1.70,.30,-.03]),0,'ladder tread interval');assert.ok(at(156,[1.70,.21,-.03]),'ladder tread');
 assert.equal(at(158,[.12,.38,.12]),0,'body interior');assert.ok(at(158,[.12,.455,.12]),'camera roof remains a real wall');
 assert.ok(at(147,[.025,.42,.04]),'lamp bracket joins the terminal post');
});

test('sloped terminal controls are exposed above the deck and camera arm leaves a real gap behind its housing',()=>{
 const {a,g}=model(147),s=productionProject('controls').styles.yunshan;
 const top=(x:number,z:number)=>{let material=0;for(let y=g.bounds()!.max[1]-1;y>=0;y--){material=g.get([Math.floor(x/a.cellSize),y,Math.floor(z/a.cellSize)]);if(material)return material;}return 0;};
 for(const [x,z]of [[.30,.10],[.30,.22]])assert.equal(top(x,z),s.glass,'input display must remain above the sloped deck');
 for(const [x,z]of [[.68,.095],[.845,.095],[.68,.205],[.845,.205]])assert.ok([s.polymer,s.printedDark].includes(top(x,z)),'front and rear key rows cannot be buried by stone');
 assert.equal(at(158,[.16,.24,.45]),0,'space above camera arm');assert.ok(at(158,[.16,.17,.45]),'actual arm below the space');assert.ok(at(158,[.16,.24,.62]),'separate wall plate behind the gap');
});

test('actual M009 cells distinguish woven motifs, cotton, ink, plastic bottle walls, liquid, optical layers and screen graphics',()=>{
 const p=productionProject('semantic M009'),s=p.styles.yunshan;
 const required:Record<number,string[]>={147:['screen','displayGlyph','displayWhite','glass','polymer'],148:['bannerCloth','bannerPattern'],150:['cottonWhite','webbing','rigidClear','fluidBlue','polymer','printedRed','paperSheet','archiveBoard'],152:['glass','paperSheet','archiveBoard','polymer','enamel','screen','displayGlyph'],156:['cottonWhite','fabric','archiveBoard'],157:['rubber','polymer','screen','displayGlyph','displayWhite','glass'],158:['enamel','rubber','glass','opticsGlow','lightCore','metal','bronze']};
 for(const n of ids){const used=new Set([...model(n).g.cells()].map(([,m])=>m));for(const role of['paper','foodRoot','fruitRed','grain','fish','fishBack','roof','flexibleClear'])assert.ok(!used.has(s[role]),n+' cannot borrow '+role);for(const role of required[n]??[])assert.ok(used.has(s[role]),n+' actual '+role);}
 assert.equal(at(150,[.28,1.07,.065]),s.printedRed);assert.equal(at(150,[.655,1.12,.225]),s.fluidBlue);assert.equal(at(150,[.695,1.10,.225]),s.rigidClear);
 assert.equal(at(158,[.17,.39,0]),s.glass);assert.equal(at(158,[.16,.39,.01]),s.lightCore);assert.equal(at(158,[.185,.39,.015]),s.opticsGlow);
 for(const role of['bannerCloth','bannerPattern','cottonWhite'])assert.equal(p.materials[s[role]].category,'fabric');
 assert.equal(p.materials[s.printedRed].category,'ink');assert.equal(p.materials[s.rigidClear].category,'plastic');assert.notEqual(s.rigidClear,s.flexibleClear);assert.notEqual(s.rigidClear,s.polymer);
 const flag=model(148);for(const [x,y]of [[.635,1.375],[.495,1.515],[.345,1.375],[.495,1.225]]){
  const ix=Math.floor(x/flag.a.cellSize),iy=Math.floor(y/flag.a.cellSize),column=[...flag.g.cells()].filter(([v])=>v[0]===ix&&v[1]===iy).map(([,m])=>m);
  assert.ok(column.length>0);assert.ok(column.every(m=>m===s.bannerPattern),'woven motif follows the full folded cloth thickness');
 }
});

test('replacing flag cloth, motif and red ink changes no cells or collision flags and can be undone in one transaction',()=>{
 const p=productionProject('role swap');for(const n of[148,150,158]){const {a}=model(n);p.assets[a.id]=a;}const e=new Engine(p);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),s=e.project.styles.yunshan;
 const result=commit(e,[{op:'definePalette',name:'独立分类测试',materials:{[s.bannerCloth]:{color:'#9b4842'},[s.bannerPattern]:{color:'#d5d0bc'},[s.printedRed]:{color:'#37599a'}}},{op:'palette',name:'独立分类测试'}]);
 assert.equal(result.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const role of['cottonWhite','bronze','signalRed','rigidClear','fluidBlue','glass','opticsGlow'])assert.deepEqual(e.project.materials[s[role]],before.materials[s[role]]);
 for(const [id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);}
 validateProject(JSON.parse(JSON.stringify(e.project)));commit(e,[{op:'undo'}]);for(const field of['assets','styles','materials','palettes'] as const)assert.deepEqual(e.project[field],before[field]);
 const bad={...s};delete bad.bannerPattern;assert.throws(()=>makeLifeAsset('LIFE-148','bad','bad',bad),/配方缺少材质角色 bannerPattern/);
});

test('new fabric, ink and rigid-plastic roles are allocated atomically even if their preferred IDs belong to a user',async()=>{
 const p=newProject(),rows=parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).filter(e=>['LIFE-148','LIFE-150'].includes(e.id));p.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:Object.fromEntries(rows.map(r=>[r.id,r]))};
 for(let id=72;id<=76;id++)p.materials[id]={...p.materials[1],id,name:'用户石材 '+id,color:'#123456'};
 const e=new Engine(p),before=structuredClone(e.project),commands=[{op:'produceCatalogAsset',catalogId:'LIFE-148',id:'flag'},{op:'produceCatalogAsset',catalogId:'LIFE-150',id:'supplies'}];
 assert.throws(()=>commit(e,[...commands,{op:'material',id:1,properties:{opacity:2}}]));assert.deepEqual(e.project,before);
 commit(e,commands);for(let id=72;id<=76;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);
 for(const role of['bannerCloth','bannerPattern','cottonWhite','printedRed','rigidClear']){const id=e.project.styles.yunshan[role];assert.ok(id>76);assert.ok(Object.values(e.project.assets).some(a=>[...new Grid(a.chunks).cells()].some(([,m])=>m===id)));}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.styles,before.styles);assert.deepEqual(e.project.assets,before.assets);
});

test('the two service counters reuse one master with enough spacing; M009 furnishing has no overlaps or blocked access',()=>{
 const p=productionProject('service room');for(const [n]of lifeLayouts[168]){const {a}=model(n as number);p.assets[a.id]=a;}
 const assembly=makeLifeAssembly(p,'LIFE-168','service','办事区组合');p.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));validateProject(p);
 const check=checkGeometry(p);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.unsupported,[]);assert.deepEqual(check.warnings,[]);assert.ok(check.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length));
 assert.equal(Object.values(p.assets).filter(a=>a.source?.catalogId==='LIFE-149').length,1);assert.equal(assembly.instances.filter(i=>i.assetId==='life-149').length,2);
 const desk=model(151).a,display=model(18).a;p.assets={[desk.id]:desk,[display.id]:display};p.instances={desk:{id:'desk',assetId:desk.id,name:'desk',position:[0,0,0],rotation:0,parent:null},display:{id:'display',assetId:display.id,name:'display',position:[.55,.80,.30],rotation:0,parent:null}};
 const placed=checkGeometry(p);assert.deepEqual(placed.collisions,[]);assert.deepEqual(placed.unsupported,[]);assert.ok(placed.contacts.display.includes('desk'));
});
