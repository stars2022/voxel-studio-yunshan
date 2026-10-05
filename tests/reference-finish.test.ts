import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,type EmissiveStrength} from '@gltf-transform/extensions';
import Ajv from 'ajv';
import {toolDefinitions} from '../src/core/schema';
import {productionProject} from '../src/production/style';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {readProductionLibrary} from '../src/production/library';
import {Engine,validateProject} from '../src/core/engine';
import {generateTemplate} from '../src/core/templates';
import {buildGLB} from '../src/export/exporter';
import type {Command} from '../src/core/types';

function setup(){const p=productionProject('finish test');p.assets.bay=generateTemplate('bay','bay','kit-a05',{},.04,p.styles.yunshan);p.instances.one={id:'one',name:'bay',assetId:'bay',position:[0,0,0],rotation:0,parent:null};return new Engine(p);}
function commit(e:Engine,commands:Command[]){const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:dry.previewToken});}
test('PBR batch previews, preserves every voxel/part/port/instance, and undoes atomically',()=>{
 const e=setup(),before=structuredClone(e.project),commands=referenceFinishCommands(e.project),env={expectedVersion:0,requestId:'finish-once',commands};
 const dry=e.execute({...env,dryRun:true});assert.deepEqual(e.project,before);assert.equal(dry.modifiedVoxels,0);
 const result=e.execute({...env,previewToken:dry.previewToken});assert.equal(result.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.instances,before.instances);
 for(const[id,m]of Object.entries(before.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].id,m.id);}
 assert.ok(e.project.materials[6].opacity<1);assert.ok(e.project.materials[11].intensity>0);assert.equal(e.execute(env).version,result.version);
 assert.throws(()=>e.execute({...env,requestId:'stale'}),/版本冲突/);validateProject(JSON.parse(JSON.stringify(e.project)));
 const after=structuredClone(e.project);assert.throws(()=>commit(e,[{op:'material',id:2,properties:{color:'#ffffff'}},{op:'material',id:3,properties:{surfaceScale:-1}}]));assert.deepEqual(e.project,after);
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);assert.deepEqual(e.project.assets,before.assets);
});
test('reapplying the profile does not overwrite original palette; both looks remain editable',()=>{
 const e=setup();commit(e,referenceFinishCommands(e.project));const original=structuredClone(e.project.palettes['原始素色']);
 commit(e,referenceFinishCommands(e.project));assert.deepEqual(e.project.palettes['原始素色'],original);
 commit(e,[{op:'palette',name:'原始素色'}]);assert.equal(e.project.materials[3].surface,'none');assert.equal(e.project.materials[6].opacity,1);assert.equal(e.project.materials[11].intensity,0);
 commit(e,[{op:'palette',name:'参考材质试作'}]);assert.equal(e.project.materials[3].surface,'wood');assert.equal(e.project.materials[3].surfaceSeed,117);assert.equal(e.project.materials[42].surfaceRotation,90);
});
test('reference appearance stays bounded with more than 512 document materials and preserves unrelated user material/palette entries',()=>{
 const e=setup();for(let id=6000;id<6032;id++)e.project.materials[id]={...e.project.materials[2],id,name:'user '+id,color:'#936b4a'};
 assert.ok(Object.keys(e.project.materials).length>512);const before=structuredClone(e.project),commands=referenceFinishCommands(e.project);
 for(const c of commands)if(c.op==='definePalette'){assert.ok(Object.keys(c.materials).length<=512);assert.ok(!c.materials['6000']);}
 assert.deepEqual(e.project,before);assert.throws(()=>commit(e,[...commands,{op:'palette',name:'missing-palette'}]));assert.deepEqual(e.project,before);
 commit(e,commands);for(let id=6000;id<6032;id++)assert.deepEqual(e.project.materials[id],before.materials[id]);assert.deepEqual(e.project.assets,before.assets);
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);
 e.project.palettes['原始素色']={'3':{color:'#123456'},'6000':{color:'#abcdef'}};const saved=structuredClone(e.project.palettes['原始素色']);
 commit(e,referenceFinishCommands(e.project));assert.deepEqual(e.project.palettes['原始素色'],saved);assert.deepEqual(e.project.materials[6000],before.materials[6000]);
 commit(e,[{op:'palette',name:'原始素色'}]);assert.equal(e.project.materials[6000].color,'#abcdef');
});
test('export embeds PBR maps, transparent glass, physical scale, and real emissive strength',async()=>{
 const e=setup();commit(e,referenceFinishCommands(e.project));const {glb}=await buildGLB(e.project),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).readBinary(glb),mats=doc.getRoot().listMaterials(),byId=(id:number)=>mats.find(m=>m.getExtras().voxelMaterialId===id)!;
 const wood=byId(3);assert.ok(wood.getBaseColorTexture()?.getImage()?.length);assert.ok(wood.getNormalTexture()?.getImage()?.length);assert.ok(wood.getMetallicRoughnessTexture()?.getImage()?.length);assert.equal(wood.getExtras().surfaceScaleM,.75);assert.equal(wood.getExtras().surfaceSeed,117);
 assert.equal(byId(6).getAlphaMode(),'BLEND');assert.equal(byId(6).getDoubleSided(),true);assert.equal(byId(4).getMetallicFactor(),.72);assert.equal(byId(11).getExtension<EmissiveStrength>('KHR_materials_emissive_strength')?.getEmissiveStrength(),2.1);
});
test('material library entries do not inflate base-model or accepted counts',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'yunshan-finish-'));
 try{await writeFile(path.join(root,'material-index.json'),JSON.stringify({format:'yunshan.material-studies',version:1,createdAt:'test',studies:[{id:'finish-furniture-01',file:'bed.ysvox.json',assetIds:['frame','pillow']},{id:'finish-furniture-gallery',file:'all.ysvox.json',assetIds:['frame','pillow']}],counts:{designs:1}}));
  const r:any=await readProductionLibrary(root,{});assert.equal(r.counts.materialStudies,1);assert.equal(r.counts.baseModels,0);assert.equal(r.counts.accepted,0);assert.equal(r.studies[0].id,'finish-furniture-gallery');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('MCP preview schema accepts explicit material look and rejects unsupported or duplicate views',()=>{
 const schema=toolDefinitions.find(t=>t.name==='generate_previews')!.inputSchema,validate=new Ajv({strict:false}).compile(schema);
 assert.ok(validate({appearance:'material',lighting:'soft',effects:true,views:['perspective','front']}));assert.ok(validate({}));
 for(const bad of[{appearance:'raytracing'},{views:['front','front']},{views:[]},{views:['arbitrary']},{lighting:'GI'},{effects:'true'},{shell:'echo'}])assert.equal(validate(bad),false,JSON.stringify(bad));
});
