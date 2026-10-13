import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Ray,Vector3} from 'three';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import sharp from 'sharp';
import {productionProject} from '../src/production/style';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {makeLifeAsset} from '../src/production/life';
import {domesticRefinementIds} from '../src/production/domestic-refinement';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {heldContactGroups} from '../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {wovenPatternPixels} from '../src/core/woven-pattern';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import type {Asset,Project,Command,V3} from '../src/core/types';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M003 reconstruction regression');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=domesticRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const hits=(p:Project,a:Asset,origin:V3,direction:V3,part?:string)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:{p:Vector3;material:number}[]=[];const ms=part?architectureComponents(a).filter(m=>m.name.includes(part)):displayMesh(a,p.materials);for(const m of ms)for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),h=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(h)out.push({p:h,material:m.material});}return out.sort((a,b)=>a.p.distanceTo(ray.origin)-b.p.distanceTo(ray.origin));};

test('M003 remains opt-in and preserves all 24 published M001/M002 geometries',async()=>{
 const p=project();for(const run of['refinement-20261007114945','refinement-20261008061121'])for(const row of JSON.parse(await readFile('artifacts/atlas/'+run+'/production.json','utf8')).models)assert.equal(hash(geometryData(refined(p,row.id))),row.sha256,row.id);
 for(const id of domesticRefinementIds){const old=makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan);assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{},p),old);assert.notEqual(hash(geometryData(refined(p,id))),hash(geometryData(old)));}
});
test('M003 real shells are closed oriented and connected with native details and actual solid flags',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets);
 for(const a of Object.values(p.assets)){const closed=architectureClosed(a);assert.ok(closed.every(c=>c.closed&&c.oriented),a.id+' '+JSON.stringify(closed.filter(c=>!c.closed||!c.oriented)));const attached=nativeIslandAttachments(a);assert.ok(attached.every(c=>c.attached),a.id+' '+JSON.stringify(attached.filter(c=>!c.attached)));const groups=heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials);assert.equal(groups.length,1,a.id+' '+JSON.stringify(groups));for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);}
 const ns=project();for(const m of Object.values(ns.materials))m.solid=false;for(const id of domesticRefinementIds)assert.ok(refined(ns,id).meshes!.every(m=>!m.collision));
});
test('M003 actual cups, blade hole, service opening, drains, four pipe bores and cable hole remain open',()=>{
 const p=prepared();for(const[x,z]of[[.297,.068],[.073,.177]])assert.ok(Math.abs(hits(p,p.assets['life-047'],[x,.3,z],[0,-1,0])[0].p.y-.058)<1e-8);
 assert.equal(hits(p,p.assets['life-048'],[.324,.20,.177],[0,-1,0],'实际挂孔刀身').length,0);
 assert.equal(hits(p,p.assets['life-050'],[.39,.375,.8],[0,0,-1],'柜背').length,0);
 for(const[id,x,z]of[['life-051',.37,.235],['life-052',.195,.264],['life-053',.39,.82]]as const)assert.equal(hits(p,p.assets[id],[x,id==='life-051'?.20:1,z],[0,-1,0]).length,0,id);
 for(const[o,d]of[[[.17,.5,.08],[0,-1,0]],[[.17,-.1,.08],[0,1,0]],[[-.1,.19,.08],[1,0,0]],[[.5,.19,.08],[-1,0,0]]]as[V3,V3][])assert.equal(hits(p,p.assets['life-056'],o,d).length,0);
 assert.equal(hits(p,p.assets['life-064'],[.21,1.2,.378],[0,-1,0],'真实走线口').length,0);
});
test('M003 public create rebuild rollback and undo preserve foreign purpose IDs',()=>{
 const p=project(),offset=1200;for(const[role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-047',id:'jug',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-051',id:'bad',params:{refinement:'reference-v1',width:2}}]));assert.deepEqual(e.project,before);
 commit(e,domesticRefinementIds.map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));const made=structuredClone(e.project.assets);assert.ok(Object.values(made).every(a=>a.meshes!.every(m=>m.material>offset)));commit(e,[{op:'rebuildCatalogAsset',assetId:'life-051',params:{refinement:'baseline'}}]);commit(e,[{op:'undo'}]);for(const[id,a]of Object.entries(made))assert.deepEqual(geometryData(e.project.assets[id]),geometryData(a));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});
test('M003 actual ceramic, glass, mirror, safety steel and screen surfaces use separate purposes',()=>{
 const p=prepared();assert.equal(Object.keys(p.styles.yunshan).length,512);for(const[id,o,d,role]of[
 ['life-051',[-.2,.12,.235],[1,0,0],'ceramicWhite'],['life-054',[.5,.7,-.2],[0,0,1],'glass'],['life-055',[.3,.4,-.2],[0,0,1],'mirrorGlass'],['life-056',[.299,.19,-.2],[0,0,1],'safetyMetal'],['life-052',[.5,.678,.579],[-1,0,0],'screen']
 ]as[string,V3,V3,string][])assert.equal(hits(p,p.assets[id],o,d)[0]?.material,p.styles.yunshan[role],id+' '+role);
 for(const a of Object.values(p.assets))for(const m of a.meshes!)assert.notEqual(p.materials[m.material].category,'water');
});
test('M003 independent woven towel purposes retain two UV axes and isolate recoloring and undo',()=>{
 const p=prepared(['LIFE-057']),a=p.assets['life-057'],bands=a.meshes!.filter(m=>m.wovenPattern),e=new Engine(p),before=structuredClone(p);assert.equal(bands.length,2);
 for(const m of bands){const pix=wovenPatternPixels(m.wovenPattern!,p.materials);assert.ok(pix.rolePixels.includes(0)&&pix.rolePixels.includes(1));for(let k=0;k<m.indices.length;k+=3){const uv=m.indices.slice(k,k+3).map(i=>m.uvs.slice(i*2,i*2+2)),area=(uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[1][1]-uv[0][1])*(uv[2][0]-uv[0][0]);assert.ok(Math.abs(area)>1e-12);}}
 const a0=wovenPatternPixels(bands[0].wovenPattern!,p.materials),b0=wovenPatternPixels(bands[1].wovenPattern!,p.materials);commit(e,[{op:'material',id:bands[0].wovenPattern!.materials.motif,properties:{color:'#bf375e'}}]);assert.notDeepEqual(wovenPatternPixels(bands[0].wovenPattern!,e.project.materials).data,a0.data);assert.deepEqual(wovenPatternPixels(bands[1].wovenPattern!,e.project.materials).data,b0.data);assert.deepEqual(e.project.assets,before.assets);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
});
test('M003 actual GLB includes both lit towel PBR textures with correct pixels purpose IDs and UVs',async()=>{
 const p=prepared(['LIFE-057']),a=p.assets['life-057'],bands=displayMesh(a,p.materials).filter(m=>m.wovenPattern),{glb}=await buildGLB(p,a.id),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]).readBinary(glb),primitives=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).filter(m=>m.getMaterial()!.getExtras().wovenPattern);assert.equal(primitives.length,2);
 for(const primitive of primitives){const m=primitive.getMaterial()!,band=bands.find(b=>JSON.stringify(Object.values(b.wovenPattern!.materials))===JSON.stringify(m.getExtras().sourceMaterialIds))!;assert.ok(band);assert.equal(m.getExtension('KHR_materials_unlit'),null);for(const[t,pixels]of[[m.getBaseColorTexture(),band.texture!.data],[m.getNormalTexture(),band.texture!.normal],[m.getMetallicRoughnessTexture(),band.texture!.orm]]as const){const raw=await sharp(t!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(raw.info.width,1024);assert.equal(raw.info.height,384);assert.deepEqual(new Uint8Array(raw.data),pixels);}const uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!;for(let i=0;i<uv.length;i++)assert.equal(uv[i],Math.fround(band.uvs[i]));}
});
