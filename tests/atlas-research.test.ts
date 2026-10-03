import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLifeAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {lifeLayouts,makeLifeAssembly,nativeLifeId} from '../src/production/layouts';
import {Grid} from '../src/core/grid';
import {validateProject} from '../src/core/engine';
import {checkGeometry} from '../src/core/checks';
import {eachCell,type Asset,type V3} from '../src/core/types';

const cache=new Map<number,{a:Asset,g:Grid}>();
function model(n:number){if(!cache.has(n)){const id=nativeLifeId(n),p=productionProject('test'),a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,p.styles.yunshan);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;}
const at=(n:number,p:V3)=>model(n).g.get(p.map(v=>Math.floor((v+1e-8)/model(n).a.cellSize)) as V3);

test('M007 knee spaces, laboratory cavities, optical bore, containers, rail clamps and scanner passage are empty',()=>{
 for(const n of[111,112,113,114,115,117,118,120,122]){
  const {a,g}=model(n);assert.ok(a.openings.length,`${n} needs a declared clearance`);
  for(const r of a.openings)eachCell(r,p=>assert.equal(g.get(p),0,`${n} opening blocked at ${p}`));
 }
 assert.ok(at(112,[1.20,.64,.33]),'sink has a floor');
 assert.ok(at(113,[.46,.30,.35]),'sample stage has a physical support');
 assert.equal(at(114,[.20,.25,.165]),0,'light passes through stage');
 assert.ok(at(114,[.25,.30,.165]),'stage surrounds the light path');
 assert.ok(at(122,[.88,.68,1.90]),'bed remains below the scanner clearance');
 assert.ok(at(122,[.88,1.68,1.75]),'the clearance is surrounded by an actual ring');
});

test('small instrument, jug and tray details remain open at 5 mm, with solid adjacent supports',()=>{
 for(const n of[114,115,119])assert.equal(model(n).a.cellSize,.005);
 assert.equal(model(122).a.cellSize,.02);
 assert.equal(at(115,[-.03,.14,.135]),0,'jug handle finger hole');
 assert.ok(at(115,[-.05,.14,.135]),'jug handle outer rail');
 assert.equal(at(119,[.095,.05,.095]),0,'scissors finger hole');
 assert.ok(at(119,[.1125,.05,.095]),'scissors ring has a wall');
 assert.equal(at(119,[-.005,.11,.17]),0,'tray carrying handle is open');
 assert.ok(at(119,[-.005,.13,.095]),'tray carrying handle top rail');
 const s=productionProject('colours').styles.yunshan;
 assert.equal(at(121,[.51,.385,.01]),s.signalRed,'call key uses the control role, not food colour');
});

test('classroom layout reuses six complete desk-chair stations without adding a second set of chairs',()=>{
 const layout=lifeLayouts[128],p=productionProject('classroom stations');
 assert.equal(layout.filter(([id])=>id===111).length,6);assert.equal(layout.filter(([id])=>id===22).length,0);
 p.assets['life-111']=model(111).a;
 for(const[,x,y,z,q]of layout.filter(([id])=>id===111)){const id='station-'+Object.keys(p.instances).length;p.instances[id]={id,assetId:'life-111',name:id,position:[x,y,z],rotation:q??0,parent:null};}
 validateProject(p);const check=checkGeometry(p);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.unsupported,[]);assert.ok(check.openings.every(o=>o.ownSolidCells===0&&o.blockedBy.length===0));
 assert.equal(Object.keys(p.assets).length,1);
});

test('updated research layout places the fine microscope and containers on the counter without collision or blocked openings',()=>{
 const p=productionProject('research layout');for(const [n]of lifeLayouts[133]){assert.equal(typeof n,'number');const {a}=model(n as number);p.assets[a.id]=a;}
 const assembly=makeLifeAssembly(p,'LIFE-133','research','科研实验空间');p.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));validateProject(p);
 const check=checkGeometry(p);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.unsupported,[]);assert.deepEqual(check.warnings,[]);
 assert.ok(check.openings.every(o=>o.ownSolidCells===0&&o.blockedBy.length===0));
 for(const n of[114,115]){const i=assembly.instances.find(i=>i.assetId===nativeLifeId(n))!;assert.ok(check.contacts[i.id].includes('research-0'),`${n} must rest on the first counter`);}
 assert.ok(check.collisionGrids.some(g=>g.pitchM===.005));
});

test('M007 source slots, metre coordinates and static-only limits persist, including downward rail clamp geometry',()=>{
 for(let n=111;n<=122;n++){const {a}=model(n),source=a.source!;assert.equal((source.reference as any).sheet,'M007');assert.equal((source.reference as any).slot,n-110);assert.equal(source.units,'metres');assert.equal(source.animation,false);assert.equal(source.gameIntegration,false);assert.ok(String(source.limitations).length>30);}
 const a=model(120).a;assert.equal(model(120).g.bounds()!.min[1]*a.cellSize,-.08);
 assert.equal(a.ports.filter(p=>p.kind==='bed-rail-clamp-80').length,2);
 const p=productionProject('missing-control-role');delete p.styles.yunshan.signalRed;assert.throws(()=>makeLifeAsset('LIFE-121','panel','life-121',p.styles.yunshan),/配方缺少材质角色 signalRed/);
});
