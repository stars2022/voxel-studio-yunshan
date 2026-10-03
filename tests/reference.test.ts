import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {referenceCatalog} from '../src/core/reference-templates';
import {referenceStyleCommands} from '../src/core/reference-style';
import {generateTemplate} from '../src/core/templates';
import {Grid} from '../src/core/grid';
import {checkGeometry} from '../src/core/checks';
import type {Command,Envelope} from '../src/core/types';
function edit(e:Engine,commands:Command[]){const env:Envelope={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},p=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:p.previewToken});}
function setup(){const e=new Engine(newProject());edit(e,referenceStyleCommands());return e;}
test('MCP material command creates complete new semantic materials and rolls back incomplete definitions',()=>{
 const e=setup();assert.equal(Object.keys(e.project.materials).length,20);assert.equal(e.project.materials[6].solid,false);assert.equal(e.project.materials[11].intensity,1.4);const before=JSON.stringify(e.project);
 assert.throws(()=>edit(e,[{op:'material',id:30,properties:{color:'#aa0000',name:'incomplete'}}]),/全部属性/);assert.equal(JSON.stringify(e.project),before);
});
test('all twelve image-guided templates create native voxel structures with reproducible regeneration',()=>{
 const e=setup();for(const [type,name]of Object.entries(referenceCatalog)){
  edit(e,[{op:'createAsset',id:type,name,template:type,cellSize:.05,style:'courtyard'}]);const a=e.project.assets[type],g=new Grid(a.chunks);assert.ok(g.count>100);assert.ok(a.parts.length);assert.equal(a.ports.length,4);
  const regenerated=generateTemplate(a.id,a.name,type,a.template!.params,a.cellSize,e.project.styles.courtyard,'courtyard');assert.deepEqual(regenerated.chunks,a.chunks,type+' must persist effective parameters reproducibly');
 }validateProject(e.project);assert.equal(Object.keys(e.project.assets).length,12);
});
test('reference bay and gateway preserve real, editable passage volume after width changes and undo',()=>{
 const e=setup();edit(e,[{op:'createAsset',id:'bay',name:'bay',template:'ref-bay',cellSize:.05,style:'courtyard'},{op:'instance',id:'bay-i',assetId:'bay',position:[0,0,0]},{op:'createAsset',id:'gate',name:'gate',template:'ref-gateway',cellSize:.05,style:'courtyard'},{op:'instance',id:'gate-i',assetId:'gate',position:[5,0,0]}]);
 const before=JSON.stringify(e.project.assets.bay.chunks);edit(e,[{op:'regenerate',assetId:'bay',params:{openingWidth:1.8}}]);const checks=checkGeometry(e.project,[{name:'bay human passage',min:[.9,.25,0],max:[2.7,2.4,1.1]},{name:'gateway passage',min:[5.55,0,0],max:[8.05,2.5,.7]}]);
 assert.ok(checks.clearances.every(x=>x.clear),JSON.stringify(checks.clearances));assert.ok(checks.openings.every(x=>!x.ownSolidCells&&!x.blockedBy.length));edit(e,[{op:'undo'}]);assert.equal(JSON.stringify(e.project.assets.bay.chunks),before);
});
test('reference glass walkway keeps collision-free walkable strip and validates impossible openings',()=>{
 const e=setup();edit(e,[{op:'createAsset',id:'bridge',name:'bridge',template:'ref-bridge',cellSize:.05,style:'courtyard'},{op:'instance',id:'bridge-i',assetId:'bridge',position:[0,0,0]}]);
 const c=checkGeometry(e.project,[{name:'walkway',min:[.3,.4,.3],max:[3.7,2.4,1.4]}]);assert.equal(c.clearances[0].clear,true);assert.throws(()=>edit(e,[{op:'createAsset',id:'bad',name:'bad',template:'ref-bay',cellSize:.05,params:{openingWidth:3.5},style:'courtyard'}]),/不兼容/);assert.ok(!e.project.assets.bad);
});
test('unsupported controls reject without silently changing geometry; asymmetric corner is explicit',()=>{
 const e=setup();assert.throws(()=>edit(e,[{op:'createAsset',id:'bay',name:'bay',template:'ref-bay',cellSize:.05,params:{thickness:.3},style:'courtyard'}]),/不适用/);
 assert.throws(()=>edit(e,[{op:'createAsset',id:'corner',name:'corner',template:'ref-bay-corner',cellSize:.05,params:{width:3,depth:4},style:'courtyard'}]),/等宽等深/);
 edit(e,[{op:'createAsset',id:'wall',name:'wall',template:'wall',cellSize:.1}]);assert.ok(!('thickness' in e.project.assets.wall.template!.params));
 e.project.assets.wall.template!.params.thickness=.1;edit(e,[{op:'regenerate',assetId:'wall',params:{width:4}}]);assert.equal(e.project.assets.wall.template!.params.width,4);assert.ok(!('thickness' in e.project.assets.wall.template!.params));
});
