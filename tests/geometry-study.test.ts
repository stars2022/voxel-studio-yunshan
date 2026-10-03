import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {atelierStyleCommands} from '../src/core/atelier';
import {generateTemplate} from '../src/core/templates';
import {Grid} from '../src/core/grid';
import {gridComponents} from '../src/core/checks';
import {connectedLine} from '../src/core/voxel-shapes';
import {eachCell,type Asset,type V3} from '../src/core/types';

function setup(){const e=new Engine(newProject());e.execute({expectedVersion:0,requestId:crypto.randomUUID(),commands:atelierStyleCommands()});return e.project;}
const project=setup(),m=project.styles.atelier;
const asset=(type:string,params:Record<string,number>={},s=.02)=>generateTemplate(type,type,type,params,s,m,'atelier');
function oneComponent(a:Asset){const g=new Grid(a.chunks);assert.deepEqual(gridComponents(g),[g.count],a.template!.type+' has detached cells');}

test('thin diagonal voxel paths remain face-connected in all octants',()=>{
 for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){
  const g=new Grid(),end:V3=[sx*.12,sy*.18,sz*.08];connectedLine(g,.02,[0,0,0],end,1);
  assert.equal(g.get(end.map(n=>Math.round(n/.02)) as V3),1);assert.deepEqual(gridComponents(g),[g.count]);
 }
});

test('planter soil, rim and leaves stay attached at 1, 2 and 2.5cm pitch',()=>{
 for(const s of[.01,.02,.025]){
  const a=asset('atelier-planter',{},s),g=new Grid(a.chunks);oneComponent(a);
  assert.equal(g.get([.6,.2,.3].map(n=>Math.round(n/s)) as V3),m.soil,'filled substrate reaches the roots');
  assert.equal(g.get([.1,.42,.3].map(n=>Math.round(n/s)) as V3),0,'air above the soil is retained');
  const foliage=[...g.cells()].filter(([,id])=>[m.leaf,m.leafAlt,m.flower].includes(id));assert.ok(foliage.length>300);
 }
});

test('hanging lantern encloses air, has a connected bracket and a grid-aligned wall interface',()=>{
 for(const s of[.01,.02,.025]){
  const a=asset('atelier-lantern',{},s),g=new Grid(a.chunks),[port]=a.ports;oneComponent(a);
  assert.equal(g.get([.12,.32,.1].map(n=>Math.round(n/s)) as V3),0,'diffuser centre is hollow');
  assert.equal(port.kind,'wall-mount');assert.deepEqual(port.normal,[0,0,1]);
  assert.ok([...port.position,...port.size].every(n=>Math.abs(n/s-Math.round(n/s))<1e-8));
  const onPlate=port.position.map(n=>Math.round(n/s)) as V3;onPlate[2]--;assert.ok(g.get(onPlate));
 }
});

test('railing sockets preserve open spans and a continuous supporting frame',()=>{
 for(const width of[.6,1.8,2.4]){
  const a=asset('atelier-railing',{width}),g=new Grid(a.chunks);oneComponent(a);
  const posts=Math.max(2,Math.round(width/.65)+1),spanX=.1+(width-.2)/(posts-1)/2;
  assert.equal(g.get([Math.round(spanX/.02),25,5]),0,'open span between the first pair of posts');
  assert.ok([...g.cells()].some(([,id])=>id===m.wood));
 }
});

test('bay ornament and handles leave both door variants open; glazing can still be removed',()=>{
 const variants:Record<string,number>[]=[{openingWidth:1.24},{openingWidth:1.44,glass:0}];
 for(const params of variants){
  const a=asset('atelier-bay',params),g=new Grid(a.chunks);let occupied=0;
  eachCell(a.openings[0],v=>{if(g.get(v))occupied++;});assert.equal(occupied,0);
  const ox=(3.6-a.template!.params.openingWidth)/2,x=Math.round((ox-.04)/.02);
  assert.equal(g.get([x,70,34]),0,'air gap behind the handle');
  if(params.glass===0)assert.equal([...g.cells()].filter(([,id])=>id===m.glass).length,0);
  validateProject({...project,assets:{[a.id]:a}});
 }
});
