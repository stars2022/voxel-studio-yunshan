import test from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {atelierCatalog,atelierStyleCommands} from '../src/core/atelier';
import {generateTemplate} from '../src/core/templates';
import {Grid} from '../src/core/grid';
import {voxelEmitters} from '../src/core/emission';
import {buildGLB} from '../src/export/exporter';
import {checkGeometry} from '../src/core/checks';
import type {Command} from '../src/core/types';
function edit(e:Engine,commands:Command[]){const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},p=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:p.previewToken});}
function setup(){const e=new Engine(newProject());edit(e,atelierStyleCommands());return e;}
test('detail templates preserve real cells, part hierarchy and deterministic regeneration',()=>{
 const e=setup();for(const [type,name]of Object.entries(atelierCatalog)){
  edit(e,[{op:'createAsset',id:type,name,template:type,style:'atelier',cellSize:.02}]);const a=e.project.assets[type];
  assert.ok(new Grid(a.chunks).count>100);assert.ok(a.parts.length>=3);
  assert.deepEqual(generateTemplate(a.id,a.name,type,a.template!.params,a.cellSize,e.project.styles.atelier,'atelier').chunks,a.chunks);
 }validateProject(JSON.parse(JSON.stringify(e.project)));
});
test('detailed bay retains a clear door after parameter change and atomic undo',()=>{
 const e=setup();edit(e,[{op:'createAsset',id:'bay',name:'bay',template:'atelier-bay',style:'atelier',cellSize:.02},{op:'instance',id:'i',assetId:'bay',position:[0,0,0]}]);const original=JSON.stringify(e.project.assets.bay.chunks);
 edit(e,[{op:'regenerate',assetId:'bay',params:{openingWidth:1.44}},{op:'material',id:103,properties:{surfaceStrength:.7}}]);
 const c=checkGeometry(e.project,[{name:'clear door',min:[1.1,.26,-.02],max:[2.5,2.4,1.2]}]);assert.equal(c.clearances[0].clear,true);assert.equal(c.openings[0].ownSolidCells,0);
 edit(e,[{op:'undo'}]);assert.equal(JSON.stringify(e.project.assets.bay.chunks),original);assert.equal(e.project.materials[103].surfaceStrength,.45);
});
test('planter is hollow and contains distinct stems, leaves, flowers and raised ornament cells',()=>{
 const e=setup(),a=generateTemplate('pot','pot','atelier-planter',{},.02,e.project.styles.atelier,'atelier'),g=new Grid(a.chunks),m=e.project.styles.atelier;
 const counts=new Map<number,number>();for(const[,id]of g.cells())counts.set(id,(counts.get(id)??0)+1);
 for(const key of['wood','leaf','leafAlt','flower','soil'])assert.ok((counts.get(m[key])??0)>5,key);
 assert.ok([...g.cells()].some(([v,mat])=>v[2]<-1&&mat===m.wallAlt),'raised meander is geometry');
 assert.ok([...g.cells()].filter(([v])=>v[1]>22&&v[0]>4&&v[0]<54&&v[2]>4&&v[2]<24).length<50*40*20*.3,'foliage retains open air');
});
test('rail gap, joinery and lantern emitters are geometry; shading keeps the same occupancy',async()=>{
 const e=setup();edit(e,[{op:'createAsset',id:'rail',name:'rail',template:'atelier-railing',style:'atelier',cellSize:.02},{op:'createAsset',id:'lamp',name:'lamp',template:'atelier-lantern',style:'atelier',cellSize:.02}]);
 const rail=new Grid(e.project.assets.rail.chunks);assert.equal(rail.get([15,25,5]),0);assert.ok([...rail.cells()].some(([,m])=>m===117));
 const emitters=voxelEmitters(e.project.assets.lamp,e.project.materials);assert.ok(emitters.length>0&&emitters.length<=16);assert.ok(emitters.every(e=>e.area>0&&e.position.every(Number.isFinite)));
 const before=JSON.stringify(e.project.assets.rail.chunks);edit(e,[{op:'material',id:103,properties:{surface:'wood',surfaceScale:.7,surfaceStrength:.4}}]);assert.equal(JSON.stringify(e.project.assets.rail.chunks),before);
 const {glb}=await buildGLB(e.project,'rail'),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).readBinary(glb);
 const material=doc.getRoot().listMaterials().find(m=>m.getName()==='深色榆木')!;assert.ok(material.getNormalTexture());assert.ok(material.getBaseColorTexture());assert.ok(material.getMetallicRoughnessTexture());
 assert.ok(doc.getRoot().listMeshes()[0].listPrimitives().some(p=>Math.max(...p.getAttribute('TEXCOORD_0')!.getArray()!)>1),'metre UVs repeat independently of greedy chunk boundaries');
});
test('detail budget, unsupported pitch and invalid texture input fail without changing document',()=>{
 const e=setup(),before=JSON.stringify(e.project);
 assert.throws(()=>edit(e,[{op:'createAsset',id:'bad',name:'bad',template:'atelier-bay',style:'atelier',cellSize:.1}]),/格距/);
 assert.throws(()=>edit(e,[{op:'createAsset',id:'bad',name:'bad',template:'atelier-bay',style:'atelier',cellSize:.01}]),/预算|2,000,000/);
 assert.throws(()=>edit(e,[{op:'material',id:103,properties:{surfaceScale:0}}]));
 assert.throws(()=>edit(e,[{op:'material',id:103,properties:{surface:'invented'}}]));assert.equal(JSON.stringify(e.project),before);
});
