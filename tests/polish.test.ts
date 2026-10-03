import test from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {atelierFinishCommands} from '../src/core/atelier-finish';
import {generateTemplate} from '../src/core/templates';
import {Grid} from '../src/core/grid';
import {gridComponents} from '../src/core/checks';
import {buildGLB} from '../src/export/exporter';
import {surfacePixels} from '../src/core/surface';
import {eachCell,type Command} from '../src/core/types';
function setup(){const e=new Engine(newProject());e.execute({expectedVersion:0,requestId:crypto.randomUUID(),commands:atelierFinishCommands()});return e;}
function edit(e:Engine,commands:Command[]){const x={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},p=e.execute({...x,dryRun:true});return e.execute({...x,previewToken:p.previewToken});}

test('compact entry and centimetre detail assets have no floating hardware or disconnected plants',()=>{
 const e=setup(),roles=e.project.styles['atelier-finish'];
 for(const type of['bay','railing','planter','lantern']){
  const a=generateTemplate('test','test','atelier-'+type,type==='bay'?{depth:.8}:type==='planter'?{detail:3}:{},type==='bay'?.02:.01,roles,'atelier-finish'),g=new Grid(a.chunks);
  assert.deepEqual(gridComponents(g),[g.count],type);validateProject({...e.project,assets:{test:a}});
  if(type==='bay')eachCell(a.openings[0],v=>assert.equal(g.get(v),0,'door path stays entirely open'));
 }
});

test('surface edits change material maps without changing native geometry; invalid stored fields fail',()=>{
 const e=setup();edit(e,[{op:'createAsset',id:'rail',name:'rail',template:'atelier-railing',style:'atelier-finish',cellSize:.01}]);
 const geometry=structuredClone(e.project.assets.rail.chunks),id=e.project.styles['atelier-finish'].woodCross;
 edit(e,[{op:'material',id,properties:{surfaceRotation:180,surfaceSeed:834}}]);assert.deepEqual(e.project.assets.rail.chunks,geometry);
 edit(e,[{op:'undo'}]);assert.equal(e.project.materials[id].surfaceRotation,90);
 const saved=JSON.parse(JSON.stringify(e.project));validateProject(saved);
 for(const value of[-1,65536,NaN]){const p=structuredClone(e.project);p.materials[id].surfaceSeed=value;assert.throws(()=>validateProject(p),/纹理/);}
 const p=structuredClone(e.project);p.materials[id].surfaceRotation=45;assert.throws(()=>validateProject(p),/纹理/);
 const a=surfacePixels('wood',.5,128,44),b=surfacePixels('wood',.5,128,45);assert.notDeepEqual(a.albedo,b.albedo);assert.deepEqual(a.albedo,surfacePixels('wood',.5,128,44).albedo);
});

test('GLB preserves horizontal timber grain direction, maps and editable material metadata',async()=>{
 const e=setup();edit(e,[{op:'createAsset',id:'rail',name:'rail',template:'atelier-railing',style:'atelier-finish',cellSize:.01}]);
 const {glb}=await buildGLB(e.project,'rail'),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).readBinary(glb);
 const mat=doc.getRoot().listMaterials().find(m=>m.getName()==='精修 · 横纹榆木')!,primitive=doc.getRoot().listMeshes()[0].listPrimitives().find(p=>p.getMaterial()===mat)!;
 assert.ok(mat.getBaseColorTexture());assert.ok(mat.getNormalTexture());assert.ok(mat.getMetallicRoughnessTexture());assert.equal(mat.getExtras().surfaceRotation,90);
 const pos=primitive.getAttribute('POSITION')!.getArray()!,normal=primitive.getAttribute('NORMAL')!.getArray()!,uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!;let checked=0;
 for(let i=0;i<pos.length/3;i++)if(Math.abs(normal[3*i+2])===1){assert.ok(Math.abs(uv[2*i]-pos[3*i+1]/.55)<1e-5);assert.ok(Math.abs(uv[2*i+1]+pos[3*i]/.55)<1e-5);checked++;}
 assert.ok(checked>10);
});
