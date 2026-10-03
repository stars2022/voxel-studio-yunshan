import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLifeAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {lifeLayouts,makeLifeAssembly,nativeLifeId} from '../src/production/layouts';
import {Grid} from '../src/core/grid';
import {Engine,validateProject} from '../src/core/engine';
import {gridComponents,checkGeometry} from '../src/core/checks';
import {eachCell,type Asset,type V3,type Command} from '../src/core/types';

const ids=[123,124,125,126,127,140,141,142,143,144,145,146],cache=new Map<number,{a:Asset,g:Grid}>();
function model(n:number){if(!cache.has(n)){const id=nativeLifeId(n),p=productionProject('test'),a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,p.styles.yunshan);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;}
const at=(n:number,v:V3)=>model(n).g.get(v.map(x=>Math.floor((x+1e-8)/model(n).a.cellSize)) as V3);
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};

test('M008 references preserve metre coordinates, static limits and intentional separated rail/table-chair bodies',()=>{
 for(const [i,n]of ids.entries()){
  const {a,g}=model(n);assert.equal((a.source!.reference as any).sheet,'M008');assert.equal((a.source!.reference as any).slot,i+1);
  assert.equal(a.source!.units,'metres');assert.equal(a.source!.animation,false);assert.equal(a.source!.gameIntegration,false);
  assert.ok(String(a.source!.limitations).length>35);assert.equal(g.bounds()!.min[1],0);
  const components=gridComponents(g);assert.equal(components.length,n===126?2:n===141?7:1,n+': no incidental floating geometry');
 }
});

test('drawer interior, lifting handles, sink, ballot chute, case grip and open cabinet approach remain genuine voids',()=>{
 for(const n of ids){const {a,g}=model(n);assert.ok(a.openings.length);for(const o of a.openings)eachCell(o,v=>assert.equal(g.get(v),0,n+' opening '+v));}
 assert.equal(at(125,[-.01,.75,.90]),0,'side handle must be open rather than a solid rectangle');
 assert.ok(at(125,[-.01,.81,.90]),'side handle top rail');
 assert.ok(at(127,[.30,.685,.30]),'basin retains a floor around drain');
 assert.ok(at(143,[.10,.20,.12]),'ballot cavity retains a physical wall');
 for(let y=.64;y<.86;y+=.01)assert.equal(at(143,[.20,y,.10]),0,'ballot slit passes through the cabinet roof into the chamber');
 assert.equal(at(145,[.32,.415,.205]),0,'handle finger hole');assert.ok(at(145,[.32,.44,.205]),'rubber grip above fingers');
 assert.ok(at(146,[.11,.40,-.32]),'left open door occupies a quarter-turned position');
 assert.equal(at(146,[.55,.40,-.32]),0,'open doors do not close the central approach');
});

test('actual M008 cells separate rubber, textile, straps, liquid, plastic, paper and screen graphics by meaning',()=>{
 const p=productionProject('semantic M008'),s=p.styles.yunshan;
 assert.equal(at(125,[.08,.015,.24]),s.rubber);assert.equal(at(125,[.085,.21,.50]),s.metal);
 assert.equal(at(125,[.36,.75,.28]),s.safetyFabric);assert.equal(at(125,[.18,.76,.98]),s.webbing);
 assert.equal(at(124,[.07,1.465,.285]),s.fluidBlue);assert.equal(at(124,[.45,1.465,.285]),s.fluidAmber);
 const required:Record<number,string[]>={124:['rubber','flexibleClear','fluidBlue','fluidAmber','polymer','displayGlyph'],125:['rubber','safetyFabric','webbing','metal','bronze'],127:['wall','ceramicWhite','enamel','polymer','displayGlyph'],140:['glass','screen','displayGlyph','displayWhite'],144:['paperSheet','bookCover','archiveBoard','printedDark'],145:['enamel','rubber','metal','printedDark'],146:['paperSheet','bookCover','archiveBoard','printedDark']};
 for(const n of ids){const used=new Set([...model(n).g.cells()].map(([,m])=>m));
  for(const role of['paper','foodRoot','fruitRed','grain','fish','fishBack'])assert.ok(!used.has(s[role]),n+' must not borrow '+role);
  for(const role of required[n]??[])assert.ok(used.has(s[role]),n+' must store '+role+' in actual cells');
  if(n===140)assert.ok(!used.has(s.paperSheet),'digital white cards are screen pixels, not physical paper');
  if(n===145)assert.ok(!used.has(s.wall),'off-white evidence case is coated metal, not stone');
 }
 assert.equal(p.materials[s.rubber].category,'rubber');assert.equal(p.materials[s.flexibleClear].category,'plastic');
 for(const r of['bookCover','archiveBoard','paperSheet'])assert.equal(p.materials[s[r]].category,'paper');
});

test('changing rubber and textile appearances preserves voxel assignments, other semantic roles and supports one undo',()=>{
 const p=productionProject('independent resource pack'),a=model(125).a;p.assets[a.id]=a;const e=new Engine(p);commit(e,referenceFinishCommands(e.project));const before=structuredClone(e.project),s=p.styles.yunshan;
 const result=commit(e,[{op:'material',id:s.rubber,properties:{color:'#274d72',roughness:.75}},{op:'material',id:s.safetyFabric,properties:{color:'#984f51',surface:'fabric'}}]);
 assert.equal(result.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const role of['webbing','metal','polymer','enamel'])assert.deepEqual(e.project.materials[s[role]],before.materials[s[role]]);
 validateProject(JSON.parse(JSON.stringify(e.project)));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.assets,before.assets);
 const bad=productionProject('missing tyre');delete bad.styles.yunshan.rubber;assert.throws(()=>makeLifeAsset('LIFE-125','stretcher','s',bad.styles.yunshan),/配方缺少材质角色 rubber/);
});

test('conference station keeps exactly six independent chairs and reading-room layout no longer adds duplicate seats',()=>{
 assert.equal(lifeLayouts[130].filter(([n])=>n===141).length,1);assert.equal(lifeLayouts[130].filter(([n])=>n===22).length,0);
 const {a}=model(141),p=productionProject('meeting');p.assets[a.id]=a;p.instances.table={id:'table',assetId:a.id,name:'table',position:[0,0,0],rotation:0,parent:null};
 const check=checkGeometry(p);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.unsupported,[]);assert.ok(check.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length));
 assert.equal(a.parts.filter(p=>p.name.includes('独立座椅')).length,6);
});

test('emergency furnishing study places 5 mm instrument tray on the new wash counter with no collisions or blocked openings',()=>{
 const p=productionProject('emergency furnishing');for(const [n]of lifeLayouts[139]){assert.equal(typeof n,'number');const {a}=model(n as number);p.assets[a.id]=a;}
 const assembly=makeLifeAssembly(p,'LIFE-139','emergency','急救器具摆放');p.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));validateProject(p);
 const check=checkGeometry(p);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.unsupported,[]);assert.deepEqual(check.warnings,[]);assert.ok(check.openings.every(o=>!o.ownSolidCells&&!o.blockedBy.length));
 const tray=assembly.instances.find(i=>i.assetId==='life-119')!,counter=assembly.instances.find(i=>i.assetId==='life-127')!;assert.ok(check.contacts[tray.id].includes(counter.id));assert.ok(check.collisionGrids.some(g=>g.pitchM===.005));
});
