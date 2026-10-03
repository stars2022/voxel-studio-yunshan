import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLifeAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {Grid} from '../src/core/grid';
import {eachCell,type Asset,type V3} from '../src/core/types';
import {gridComponents,checkGeometry} from '../src/core/checks';
import {Engine} from '../src/core/engine';

const cache=new Map<number,{a:Asset,g:Grid}>();
function model(n:number){if(!cache.has(n)){const id='LIFE-'+String(n).padStart(3,'0'),p=productionProject('test'),a=makeLifeAsset(id,id,id,p.styles.yunshan);cache.set(n,{a,g:new Grid(a.chunks)});}return cache.get(n)!;}
const at=(n:number,p:V3)=>model(n).g.get(p.map(v=>Math.floor((v+1e-8)/.01)) as V3);

test('conveyor keeps an open belt loop, solid end rollers and two aligned docking faces',()=>{
 const {a}=model(78),ports=a.ports.filter(p=>p.kind==='conveyor-600');assert.equal(ports.length,2);assert.deepEqual(ports.map(p=>p.normal),[[-1,0,0],[1,0,0]]);assert.deepEqual(ports[0].size,ports[1].size);assert.equal(ports[0].position[1],ports[1].position[1]);
 assert.ok(at(78,[.65,.71,.30]),'top wear plate');assert.equal(at(78,[.60,.71,.30]),0,'joint between wear plates');assert.ok(at(78,[.60,.69,.30]),'continuous belt below joint');assert.ok(at(78,[.60,.51,.30]),'return belt');assert.ok(at(78,[.13,.60,.30]),'roller');assert.equal(at(78,[.60,.60,.30]),0,'open return space');
});
test('two conveyor instances dock without collision or a gap, with continuous transfer plates',()=>{
 const p=productionProject('join'),a=structuredClone(model(78).a);p.assets[a.id]=a;const e=new Engine(p);e.execute({expectedVersion:0,requestId:'conveyor-join',commands:[{op:'instance',id:'first',assetId:a.id,position:[0,0,0]},{op:'connect',id:'second',assetId:a.id,targetInstanceId:'first',portId:'input',targetPortId:'output',rotation:0}]});const check=checkGeometry(e.project);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.gaps,[]);assert.deepEqual(check.unsupported,[]);assert.deepEqual(e.project.instances.second.position,[1.6,0,0]);
 for(let x=0;x<160;x++)assert.ok(model(78).g.get([x,69,30]),`transfer surface missing at ${x}`);
});
test('lift, machine enclosure, harvest box, net and cold box preserve declared empty regions',()=>{
 for(const n of[79,82,86,87,88]){const{a,g}=model(n);assert.ok(a.openings.length>0);for(const r of a.openings)eachCell(r,p=>assert.equal(g.get(p),0,`${n} blocked at ${p}`));}
 assert.ok(at(79,[.58,.36,.21]),'scissor axle stays structural');assert.equal(at(82,[.04,.36,.18]),0,'side vent goes through shell');assert.ok(at(82,[.04,.43,.18]),'wall between vents remains');
});
test('pegboard holes and harvest handles are geometry, with adjacent solid grip structure',()=>{
 assert.equal(at(83,[.14,.66,.25]),0,'peg hole');assert.ok(at(83,[.155,.655,.25]),'material between holes');assert.equal(at(86,[-.01,.34,.20]),0,'handle opening');assert.ok(at(86,[-.01,.39,.20]),'handle upper grip');
});
test('fishing net has two declared independent objects and open mesh instead of opaque panels',()=>{
 const{g,a}=model(87);assert.equal(gridComponents(g).length,2);assert.match(String(a.source!.limitations),/两块有意分离/);let solid=0,total=0;for(let x=5;x<61;x++)for(let y=14;y<64;y++){total++;if(g.get([x,y,45]))solid++;}assert.ok(solid/total>.08&&solid/total<.8,`net occupancy ${solid}/${total}`);let bottom=0;for(let x=7;x<60;x++)for(let z=48;z<70;z++)if(g.get([x,11,z]))bottom++;assert.ok(bottom>100&&bottom<53*22*.8,`bottom net occupancy ${bottom}`);
});
test('workshop assets identify source slots and explicitly retain static rather than animated status',()=>{
 for(let n=77;n<=88;n++){const{a}=model(n),source=a.source!;assert.equal((source.reference as any).sheet,'M005');assert.equal((source.reference as any).slot,n-76);assert.equal(source.animation,false);assert.match(String(source.kinematics),/^static/);assert.ok(String(source.limitations).length>20);}
});
