import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLifeAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {Grid} from '../src/core/grid';
import {Engine,validateProject} from '../src/core/engine';
import {eachCell,type Asset,type V3,type Command} from '../src/core/types';
import {checkGeometry} from '../src/core/checks';

const cache=new Map<number,{a:Asset,g:Grid}>();
function model(n:number){if(!cache.has(n)){const id='LIFE-'+String(n).padStart(3,'0'),p=productionProject('test'),a=makeLifeAsset(id,id,id,p.styles.yunshan);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;}
const at=(n:number,p:V3)=>model(n).g.get(p.map(v=>Math.floor((v+1e-8)/model(n).a.cellSize)) as V3);
const commit=(e:Engine,commands:Command[],id=crypto.randomUUID())=>{const req={expectedVersion:e.project.version,requestId:id,commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};

test('5 mm native grids use the shared transaction path, survive serialization and enforce pitch compatibility',()=>{
 const e=new Engine(productionProject('precision'));const create=(id:string,cellSize:number):Command=>({op:'createAsset',id,name:id,template:'slab',cellSize,params:{width:.10,height:.02,depth:.10}});
 commit(e,[create('fine',.005),create('coarse',.01),{op:'instance',id:'a',assetId:'fine',position:[0,0,0]}]);
 const fine=e.project.assets.fine;assert.equal(fine.cellSize,.005);assert.deepEqual(new Grid(fine.chunks).bounds(),{min:[0,0,0],max:[20,4,20]});validateProject(JSON.parse(JSON.stringify(e.project)));
 const before=JSON.stringify(e.project);assert.throws(()=>commit(e,[{op:'connect',id:'bad',assetId:'coarse',portId:'base',targetInstanceId:'a',targetPortId:'top',rotation:0}]),/格距/);assert.equal(JSON.stringify(e.project),before);
 assert.throws(()=>commit(e,[create('too-fine',.0009)]),/minimum|>=/);assert.equal(JSON.stringify(e.project),before);
 commit(e,[{op:'connect',id:'b',assetId:'fine',portId:'base',targetInstanceId:'a',targetPortId:'top',rotation:0}]);assert.deepEqual(e.project.instances.b.position,[0,.02,0]);assert.deepEqual(checkGeometry(e.project).collisions,[]);
 commit(e,[{op:'undo'}]);assert.equal(e.project.instances.b,undefined);
});

test('tiny food, bottles and books use 5 mm cells without substituting emissive or metal materials for food colours',()=>{
 const p=productionProject('food');for(const n of[92,93,94,96,106,107]){const {a}=model(n);assert.equal(a.cellSize,.005);p.assets[a.id]=a;validateProject(p);}
 const e=new Engine(p);commit(e,referenceFinishCommands(p));for(const role of['grain','fish','fishBack']){const m=e.project.materials[e.project.styles.yunshan[role]];assert.equal(m.intensity,0);assert.equal(m.metalness,0);assert.equal(m.emissive,'#000000');}
 const ids=new Set([...model(93).g.cells()].map(([,m])=>m));assert.ok(ids.has(p.styles.yunshan.vegetableStalk)&&ids.has(p.styles.yunshan.leaf)&&ids.has(p.styles.yunshan.leafAlt));
 for(const n of[92,93,94])assert.ok(model(n).a.parts.every(p=>!p.name.includes('货架')));
});

test('unplaced fine masters do not change scene collision precision or expand coarse occupancy',()=>{
 const e=new Engine(productionProject('unplaced'));commit(e,[{op:'createAsset',id:'slab',name:'slab',template:'slab',cellSize:.01,params:{width:.1,height:.02,depth:.1}},{op:'instance',id:'placed',assetId:'slab',position:[0,0,0]}]);const before=checkGeometry(e.project);
 commit(e,[{op:'createAsset',id:'unused',name:'unused fine master',template:'empty',cellSize:.005},{op:'voxels',assetId:'unused',mode:'add',cells:[[0,0,0]],material:2}]);assert.deepEqual(checkGeometry(e.project),before);assert.equal(before.pitchM,.01);assert.equal(before.occupiedCollisionCells,200);
});

test('distant fine instances get a local collision grid, while remote opening blockers remain checked',()=>{
 const e=new Engine(productionProject('mixed'));commit(e,[{op:'createAsset',id:'coarse',name:'coarse',template:'slab',cellSize:.01,params:{width:.1,height:.02,depth:.1}},{op:'createAsset',id:'fine',name:'fine',template:'empty',cellSize:.005},{op:'voxels',assetId:'fine',mode:'add',cells:[[0,0,0],[1,0,0]],material:2},{op:'instance',id:'slab',assetId:'coarse',position:[0,0,0]},{op:'instance',id:'detail',assetId:'fine',position:[2,0,0]}]);
 const check=checkGeometry(e.project,[{name:'fine region',min:[2,0,0],max:[2.01,.005,.005]}]);assert.deepEqual(check.collisions,[]);assert.equal(check.occupiedCollisionCells,202);assert.deepEqual(check.collisionGrids?.map(g=>g.pitchM),[.01,.005]);assert.deepEqual(check.clearances[0].blockedBy,['detail']);assert.equal(check.clearances[0].occupiedCells,2);
 e.project.assets.coarse.openings=[{min:[200,0,0],max:[202,1,1]}];const blocked=checkGeometry(e.project);assert.deepEqual(blocked.openings[0].blockedBy,['detail']);assert.equal(blocked.openings[0].ownSolidCells,0);assert.equal(blocked.pitchM,.005);
});

test('fish tail fork, stiff book overhang and scroll inlay remain explicit geometry',()=>{
 assert.equal(at(94,[.44,.065,.08]),0,'fork recess');assert.ok(at(94,[.435,.12,.08]),'upper tail lobe');assert.ok(at(94,[.19,.13,.08]),'dorsal fin');
 const s=productionProject('test').styles.yunshan;assert.equal(at(106,[.11,.027,.15]),s.paperSheet,'page block');assert.equal(at(106,[.225,.027,.15]),0,'recess below cover overhang');assert.ok(at(106,[.225,.05,.15]),'cover');
 assert.equal(at(107,[.27,.0275,.1075]),s.inkTeal,'coloured water line is in the paper grid');assert.equal(at(107,[.27,.0275,.0975]),s.paperSheet);assert.equal(at(107,[.27,.035,.17]),0,'not a thick stone slab');
});

test('packaging has an empty internal volume and a graspable handle; lectern rear remains open',()=>{
 for(const n of[95,109]){const{a,g}=model(n);assert.ok(a.openings.length);for(const r of a.openings)eachCell(r,p=>assert.equal(g.get(p),0,`${n} blocked at ${p}`));}
 assert.equal(at(95,[.31,.42,.19]),0,'finger clearance');assert.ok(at(95,[.31,.435,.19]),'upper grip');assert.ok(at(95,[.31,.38,.19]),'lid');
 assert.ok(at(109,[.4,.98,.08]),'sloped desktop front');assert.ok(at(109,[.4,1.09,.54]),'sloped desktop rear');
});

test('M006 masters retain exact source slots, physical units and explicit noninteractive limits',()=>{
 const ids=[89,90,91,92,93,94,95,96,106,107,109,110];for(const [i,n]of ids.entries()){const {a}=model(n),source=a.source!;assert.equal((source.reference as any).sheet,'M006');assert.equal((source.reference as any).slot,i+1);assert.equal(source.units,'metres');assert.equal(source.animation,false);assert.equal(source.gameIntegration,false);assert.ok(String(source.limitations).length>30);}
 const p=productionProject('missing-food-roles');delete p.styles.yunshan.grain;delete p.styles.yunshan.fish;delete p.styles.yunshan.fishBack;for(const n of[92,94]){const id='LIFE-'+String(n).padStart(3,'0');assert.throws(()=>makeLifeAsset(id,id,id,p.styles.yunshan),/配方缺少材质角色/);}
});
