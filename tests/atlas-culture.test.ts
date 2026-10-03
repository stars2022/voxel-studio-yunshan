import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {productionProject} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import {lifeLayouts,makeLifeAssembly,nativeLifeId} from '../src/production/layouts';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {gridComponents,checkGeometry} from '../src/core/checks';
import {parseCatalogCSV} from '../src/core/catalog';
import {newProject} from '../src/core/materials';
import {eachCell,type Asset,type Command,type V3} from '../src/core/types';

const ids=[159,169,170,171,172,173,174,175,176,177,178,179],p=productionProject('M010'),s=p.styles.yunshan,cache=new Map<number,{a:Asset,g:Grid}>();
const model=(n:number)=>{if(!cache.has(n)){const id=nativeLifeId(n),a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,s);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;};
const at=(n:number,v:V3)=>{const {a,g}=model(n);return g.get(v.map(x=>Math.floor((x+1e-8)/a.cellSize)) as V3);};
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};

test('M010 twelve authored candidates preserve reference source, axis, editable cavities and actual connected support',async()=>{
 const sha=createHash('sha256').update(await readFile('projects/reference-atlas/images/M010.png')).digest('hex');assert.equal(sha,'a7c85d88426ed6d3bb41092269f7861f787d397737085584a1948cd5f1316c11');
 for(const [j,n]of ids.entries()){const {a,g}=model(n),ref=a.source!.reference as any;assert.equal(ref.sheet,'M010');assert.equal(ref.slot,j+1);assert.equal(ref.imageSHA256,sha);assert.equal(a.source!.units,'metres');assert.equal(a.source!.front,'-Z');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);assert.ok(a.source!.materialAssignmentReview);assert.equal(g.bounds()!.min[1],0);assert.equal(gridComponents(g).length,n===179?3:1,'unexpected floating detail '+n);assert.ok(a.parts.length>=4);assert.ok(a.openings.length);for(const opening of a.openings)eachCell(opening,v=>assert.equal(g.get(v),0,n+' blocked opening '+v));}
 assert.equal(model(171).a.cellSize,.005);assert.equal(model(176).a.cellSize,.02);
});

test('same-colour fire equipment, paper, canvas, pigment, membrane and acoustic/optical surfaces use distinct actual material cells',()=>{
 const categories={safetyMetal:'metal',lacquerWood:'wood',canvas:'fabric',pigmentInk:'ink',pigmentMist:'ink',drumSkin:'plastic',instrumentWire:'metal',brushFibre:'fabric',redHose:'rubber',incense:'plant',ember:'emissive',polymerRed:'plastic',speakerCone:'plastic'};
 assert.equal(new Set(Object.keys(categories).map(r=>s[r])).size,Object.keys(categories).length);
 for(const[r,c]of Object.entries(categories))assert.equal(p.materials[s[r]].category,c);
 for(const n of ids){const used=new Set([...model(n).g.cells()].map(([,m])=>m));for(const r of['paper','foodRoot','fruitRed','grain','fish','fishBack','roof'])assert.ok(!used.has(s[r]),n+' may not borrow '+r);}
 assert.equal(at(159,[.85,.41,.22]),s.safetyMetal,'steel extinguisher body');assert.equal(at(159,[.20,1.10,.20]),s.polymerRed,'hard plastic first aid case');assert.equal(at(159,[.485,.435,.19]),s.redHose,'rubber coil');
 assert.equal(at(169,[.50,1.20,.20]),s.paperSheet,'paper scroll');assert.equal(at(170,[.50,1.20,.165]),s.canvas,'stretched canvas');
 assert.equal(at(171,[.30,.04,.15]),s.paperSheet,'calligraphy paper');assert.equal(at(171,[.1625,.19,.3575]),s.brushFibre,'synthetic brush tip');
 assert.equal(at(175,[.52,.82,.095]),s.drumSkin,'synthetic drum head');assert.equal(at(175,[.52,1.28,.30]),s.lacquerWood,'lacquered wood drum shell');
 assert.equal(at(179,[.495,.68,.20]),s.incense,'incense body');assert.equal(at(179,[.495,.725,.20]),s.ember,'separate ember');
 for(const n of[169,170,171,173])assert.ok(![...model(n).g.cells()].some(([,m])=>m===s.displayGlyph||m===s.screen),'physical picture is not a display '+n);
});

test('drum bore, print feed slit, lyre sound holes, open reel spindle and hanging brush intervals are actual voids',()=>{
 assert.equal(at(175,[.525,.82,.32]),0);assert.ok(at(175,[.525,1.30,.32]));
 assert.equal(at(172,[.50,.915,.475]),0);assert.equal(at(172,[.50,1.045,.475]),s.metalBright);assert.equal(at(172,[.50,.805,.475]),s.rubber);
 assert.equal(at(174,[.24,.69,.20]),0,'sound opening through box bottom');assert.equal(at(174,[.32,.74,.13]),0,'hollow resonance chamber');
 assert.equal(at(177,[.315,.455,.11]),0,'speaker baffle must not cover the cone');assert.equal(at(177,[.315,.455,.165]),s.polymerDark,'exposed speaker centre');
 assert.equal(at(177,[.95,1.09,.30]),0,'hollow reel shaft');assert.equal(at(171,[.1975,.30,.3525]),0,'separated brush shafts');
 // Strings are separate above their body, rather than printed stripes.
 assert.equal(at(174,[.35,.86,.07]),0);assert.equal(at(174,[.35,.885,.05]),s.instrumentWire);
});

test('two stage units dock along actual flush sides and the revised performance arrangement has supported instruments',()=>{
 const doc=productionProject('stage'),a=model(176).a;doc.assets[a.id]=a;const e=new Engine(doc);
 commit(e,[{op:'instance',id:'a',assetId:a.id,position:[0,0,0]},{op:'connect',id:'b',assetId:a.id,targetInstanceId:'a',portId:'join-left',targetPortId:'join-right',rotation:0}]);
 assert.deepEqual(e.project.instances.b.position,[2,0,0]);const joined=checkGeometry(e.project);assert.deepEqual(joined.collisions,[]);assert.deepEqual(joined.gaps,[]);assert.deepEqual(joined.unsupported,[]);
 for(const number of[132,203,204]){const doc=productionProject('culture room');for(const[n]of lifeLayouts[number]){const {a}=model(n as number);doc.assets[a.id]=a;}const assembly=makeLifeAssembly(doc,'LIFE-'+number,'room','culture');doc.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));validateProject(doc);const result=checkGeometry(doc);assert.deepEqual(result.collisions,[],number+' overlaps');assert.deepEqual(result.unsupported,[],number+' unsupported');assert.deepEqual(result.warnings,[],number+' budget');assert.ok(result.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length),number+' blocked void');}
});

test('independent role-pack replacement affects no geometry, category or collision flags and one undo restores everything',()=>{
 const doc=productionProject('pack');for(const n of ids){const a=model(n).a;doc.assets[a.id]=a;}const e=new Engine(doc);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),changed=['safetyMetal','redHose','polymerRed','canvas','drumSkin','instrumentWire','speakerCone'];
 const result=commit(e,[{op:'definePalette',name:'独立用途检查',materials:Object.fromEntries(changed.map((r,i)=>[s[r],{color:i%2?'#315fa2':'#a26339'}]))},{op:'palette',name:'独立用途检查'}]);assert.equal(result.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].category,m.category);assert.equal(e.project.materials[id].solid,m.solid);if(!changed.some(r=>String(s[r])===id))assert.deepEqual(e.project.materials[id],m);}
 commit(e,[{op:'undo'}]);for(const k of['assets','styles','materials','palettes']as const)assert.deepEqual(e.project[k],before[k]);
 const missing={...s};delete missing.drumSkin;assert.throws(()=>makeLifeAsset('LIFE-175','bad','bad',missing),/配方缺少材质角色 drumSkin/);
});

test('M010 semantic roles can be allocated in a foreign palette atomically; failed creation restores IDs and document',async()=>{
 const doc=newProject(),rows=parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).filter(r=>ids.includes(Number(r.id.slice(5)))&&r.id.startsWith('LIFE-'));
 doc.catalog={sourceName:'city-assets.csv',importedAt:'test',entries:Object.fromEntries(rows.map(r=>[r.id,r]))};for(let id=95;id<=107;id++)doc.materials[id]={...doc.materials[1],id,name:'用户自有 '+id};const e=new Engine(doc),before=structuredClone(e.project),commands=[{op:'produceCatalogAsset',catalogId:'LIFE-159',id:'cabinet'},{op:'produceCatalogAsset',catalogId:'LIFE-175',id:'drum'}];
 assert.throws(()=>commit(e,[...commands,{op:'material',id:1,properties:{opacity:5}}]));assert.deepEqual(e.project,before);commit(e,commands);for(let id=95;id<=107;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);for(const r of['safetyMetal','redHose','polymerRed','drumSkin','lacquerWood'])assert.ok(e.project.styles.yunshan[r]>107);
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.styles,before.styles);assert.deepEqual(e.project.assets,before.assets);
});
