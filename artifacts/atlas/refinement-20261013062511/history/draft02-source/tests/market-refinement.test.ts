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
import {marketRefinementIds} from '../src/production/market-refinement';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {heldContactGroups} from '../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {wovenPatternPixels,validateWovenPattern} from '../src/core/woven-pattern';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import type {Asset,Project,Command,V3} from '../src/core/types';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M004 regression');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=marketRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const hits=(p:Project,a:Asset,origin:V3,direction:V3,part?:string)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:{p:Vector3;material:number}[]=[];const ms=part?architectureComponents(a).filter(m=>m.name.includes(part)):displayMesh(a,p.materials);for(const m of ms)for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),h=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(h)out.push({p:h,material:m.material});}return out.sort((a,b)=>a.p.distanceTo(ray.origin)-b.p.distanceTo(ray.origin));};

test('M004 is opt-in and all 36 published reference geometries remain unchanged',async()=>{
 const p=project();for(const run of['refinement-20261007114945','refinement-20261008061121','refinement-20261013041132'])for(const row of JSON.parse(await readFile('artifacts/atlas/'+run+'/production.json','utf8')).models)assert.equal(hash(geometryData(refined(p,row.id))),row.sha256,row.id);
 for(const id of marketRefinementIds){const old=makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan);assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{},p),old);assert.notEqual(hash(geometryData(refined(p,id))),hash(geometryData(old)));}
});
test('M004 real closed oriented components retain native attachments and declared contact groups',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets);
 for(const a of Object.values(p.assets)){const closed=architectureClosed(a);assert.ok(closed.every(c=>c.closed&&c.oriented),a.id+' '+JSON.stringify(closed.filter(c=>!c.closed||!c.oriented)));assert.ok(nativeIslandAttachments(a).every(c=>c.attached),a.id);const groups=heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials);assert.equal(groups.length,['life-069','life-073'].includes(a.id)?2:1,a.id+' '+JSON.stringify(groups));for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);}
 const ns=project();for(const m of Object.values(ns.materials))m.solid=false;for(const id of marketRefinementIds)assert.ok(refined(ns,id).meshes!.every(m=>!m.collision));
});
test('M004 installation bores grip apertures and all four forklift approaches are real geometry openings',()=>{
 const p=prepared();for(const x of[.025,.575])assert.equal(hits(p,p.assets['life-068'],[x,.045,-.2],[0,0,1]).length,0);
 assert.equal(hits(p,p.assets['life-073'],[.018,.1,.215],[0,-1,0]).length,0);assert.ok(hits(p,p.assets['life-073'],[.004,.1,.215],[0,-1,0]).length>0);
 assert.equal(hits(p,p.assets['life-069'],[.21,.256,-.2],[0,0,1]).length,0);
 for(const[o,d]of[[[-.1,.065,.247],[1,0,0]],[[1.3,.065,.557],[-1,0,0]],[[.344,.065,-.1],[0,0,1]],[[.854,.065,.9],[0,0,-1]]]as[V3,V3][])assert.equal(hits(p,p.assets['life-075'],o,d).length,0);
 assert.ok(hits(p,p.assets['life-075'],[.09,.065,-.1],[0,0,1]).length>0,'real bearing blocks were not removed to fake openings');
 assert.equal(hits(p,p.assets['life-074'],[.21,.480,-.2],[0,0,1]).length,0);
});
test('M004 open baskets and reusable cloth container have real floors while cases retain empty interiors',()=>{
 const p=prepared();for(const[id,x,z,originY,floor]of[['life-069',.76,.17,.3,.041],['life-069',.21,.17,.5,.040],['life-074',.21,.15,.6,.048],['life-071',.25,.21,.3,.047],['life-072',.45,.33,.4,.050]]as const)assert.ok(Math.abs(hits(p,p.assets[id],[x,originY,z],[0,-1,0])[0].p.y-floor)<1e-7,id+' floor');
});
test('M004 actual surfaces separate coated steel wood stone paper ink hard-clear plastic and fixed webbing',()=>{
 const p=prepared();assert.equal(Object.keys(p.styles.yunshan).length,512);for(const[id,o,d,role]of[
 ['life-066',[.60,.50,.24],[0,-1,0],'enamel'],['life-067',[.57,.30,-.2],[0,0,1],'stone'],['life-068',[.11,.027,-.1],[0,0,1],'rigidClear'],['life-068',[.12,.027,.0115],[0,0,1],'paperSheet'],['life-068',[.09,.037,.0115],[0,0,1],'printedRed'],['life-071',[.31,.282,-.2],[0,0,1],'parcelLabel'],['life-071',[.33,.235,-.2],[0,0,1],'wood'],['life-072',[.50,.30,-.2],[0,0,1],'enamel'],['life-074',[.216,.245,-.2],[0,0,1],'inkTeal'],['life-076',[.383,.60,-.2],[0,0,1],'webbing']
 ]as[string,V3,V3,string][])assert.equal(hits(p,p.assets[id],o,d)[0]?.material,p.styles.yunshan[role],id+' '+role);
 for(const a of Object.values(p.assets))for(const m of a.meshes!){assert.notEqual(p.materials[m.material].category,'water');assert.equal(p.materials[m.material].intensity,0,'no invented powered fixture in market components');}
});
test('M004 public transactions preserve foreign roles and atomically undo rejected created and rebuilt batches',()=>{
 const p=project(),offset=1200;for(const[role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-065',id:'unit',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-075',id:'bad',params:{refinement:'reference-v1',width:2}}]));assert.deepEqual(e.project,before);
 commit(e,marketRefinementIds.map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));const made=structuredClone(e.project.assets);assert.ok(Object.values(made).every(a=>a.meshes!.every(m=>m.material>offset)));commit(e,[{op:'rebuildCatalogAsset',assetId:'life-070',params:{refinement:'baseline'}}]);commit(e,[{op:'undo'}]);for(const[id,a]of Object.entries(made))assert.deepEqual(geometryData(e.project.assets[id]),geometryData(a));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
 const display=made['life-065'],r=display.source!.refinement as any;assert.equal(r.inventorySites.length,8);assert.equal(r.sampleLimit,8);assert.deepEqual(r.sourceRuntimeSampleSizeM,[.4,.2,.4]);assert.ok(display.meshes!.every(m=>p.materials[m.material].category!=='food'));assert.ok(String(r.scope).includes('not rebound'));
});
test('M004 woven canopy artwork keeps two UV axes and isolates recoloring with a full undo',()=>{
 const p=prepared(['LIFE-070']),a=p.assets['life-070'],m=a.meshes!.find(m=>m.wovenPattern)!,d=m.wovenPattern!,e=new Engine(p),before=structuredClone(p),pix=wovenPatternPixels(d,p.materials);assert.ok(pix.rolePixels.includes(0)&&pix.rolePixels.includes(1));assert.deepEqual(d.sizeM,[1.4,.12]);
 for(let k=0;k<m.indices.length;k+=3){const uv=m.indices.slice(k,k+3).map(i=>m.uvs.slice(i*2,i*2+2)),area=(uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[1][1]-uv[0][1])*(uv[2][0]-uv[0][0]);assert.ok(Math.abs(area)>1e-12);}
 commit(e,[{op:'material',id:d.materials.motif,properties:{color:'#bf375e'}}]);const after=wovenPatternPixels(d,e.project.materials);assert.notDeepEqual(after.data,pix.data);for(let i=0;i<pix.rolePixels.length;i+=13)if(pix.rolePixels[i]===0)assert.deepEqual(after.data.slice(i*4,i*4+4),pix.data.slice(i*4,i*4+4));assert.deepEqual(e.project.assets,before.assets);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);assert.throws(()=>validateWovenPattern({...d,materials:{...d.materials,motif:p.styles.yunshan.paperSheet}},p.materials));
});
test('M004 actual canopy GLB embeds matching lit PBR pixels purpose IDs and UVs',async()=>{
 const p=prepared(['LIFE-070']),a=p.assets['life-070'],band=displayMesh(a,p.materials).find(m=>m.wovenPattern)!,{glb}=await buildGLB(p,a.id),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]).readBinary(glb),primitive=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(m=>m.getMaterial()!.getExtras().wovenPattern)!,m=primitive.getMaterial()!;assert.equal(m.getExtension('KHR_materials_unlit'),null);assert.deepEqual(m.getExtras().sourceMaterialIds,Object.values(band.wovenPattern!.materials));
 for(const[t,pixels]of[[m.getBaseColorTexture(),band.texture!.data],[m.getNormalTexture(),band.texture!.normal],[m.getMetallicRoughnessTexture(),band.texture!.orm]]as const){const raw=await sharp(t!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(raw.info.width,1024);assert.equal(raw.info.height,192);assert.deepEqual(new Uint8Array(raw.data),pixels);}const uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!;for(let i=0;i<uv.length;i++)assert.equal(uv[i],Math.fround(band.uvs[i]));
});
