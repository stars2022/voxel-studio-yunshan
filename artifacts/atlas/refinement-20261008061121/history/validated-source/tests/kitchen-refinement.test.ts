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
import {kitchenRefinementIds} from '../src/production/kitchen-refinement';
import {m001RefinementIds} from '../src/production/reference-refinement';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {heldContactGroups} from '../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {geometryData,assetBoundsM} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {wovenPatternPixels,validateWovenPattern} from '../src/core/woven-pattern';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import type {Asset,Project,Command,V3} from '../src/core/types';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M002 regression');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=kitchenRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const hits=(p:Project,a:Asset,origin:V3,direction:V3)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:Vector3[]=[];for(const m of displayMesh(a,p.materials))for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),hit=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(hit)out.push(hit);}return out.sort((a,b)=>a.distanceTo(ray.origin)-b.distanceTo(ray.origin));};

test('M002 is opt-in and the shared builder preserves every published M001 geometry hash',async()=>{
 const p=project(),published=JSON.parse(await readFile('artifacts/atlas/refinement-20261007114945/production.json','utf8'));
 for(const id of m001RefinementIds)assert.equal(hash(geometryData(refined(p,id))),published.models.find((r:any)=>r.id===id).sha256,id);
 for(const id of kitchenRefinementIds){const old=makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan);for(const params of[{}, {refinement:'baseline'}]as Record<string,string|number>[])assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,params,p),old);assert.notEqual(hash(geometryData(refined(p,id))),hash(geometryData(old)));}
 assert.throws(()=>makeCatalogAsset('LIFE-040','sink','sink',p.styles.yunshan,{refinement:'reference-v1',width:2},p));
});

test('all closed shells, native fasteners and real contact groups survive native JSON and actual solid flags',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets);
 for(const a of Object.values(p.assets)){assert.equal(a.cellSize,.005);assert.ok(architectureClosed(a).every(r=>r.closed&&r.oriented),a.id);assert.ok(nativeIslandAttachments(a).every(r=>r.attached),a.id);assert.equal(heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials).length,a.id==='life-039'?2:1,a.id);for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);const bounds=assetBoundsM(a)!;for(const port of a.ports){assert.ok(port.position.every((v,k)=>v>=bounds.min[k]-1e-7&&v<=bounds.max[k]+1e-7));if(port.kind==='base'||port.kind==='counter-cutout')continue;const start=port.position.map((v,k)=>v+port.normal[k]*.01)as V3;assert.ok(hits(p,a,start,port.normal.map(v=>-v)as V3).some(h=>h.distanceTo(new Vector3(...port.position))<1e-7),a.id+' '+port.id+' must touch actual surface');}}
 const ns=project();for(const m of Object.values(ns.materials))m.solid=false;for(const id of kitchenRefinementIds){const a=refined(ns,id);assert.ok(a.meshes!.every(m=>!m.collision));}
});

test('counter cutouts, sink drain and vessel interiors are real geometry openings',()=>{
 const p=prepared(['LIFE-038','LIFE-040','LIFE-044','LIFE-046']),counter=p.assets['life-038'];
 for(const [x,z]of[[.33,.33],[.915,.33]])assert.equal(hits(p,counter,[x,.3,z],[0,-1,0]).length,0);
 assert.ok(hits(p,counter,[.62,.3,.33],[0,-1,0]).length>0);
 const sink=p.assets['life-040'];assert.equal(hits(p,sink,[.33,.3,.23],[0,-1,0]).length,0);const floor=hits(p,sink,[.25,.3,.23],[0,-1,0])[0];assert.ok(Math.abs(floor.y-.047)<1e-8);
 for(const id of['life-044','life-046']){const a=p.assets[id],r=a.source!.refinement as any,[x,z]=r.interiorCenter,first=hits(p,a,[x,1,z],[0,-1,0])[0];assert.ok(Math.abs(first.y-r.interiorFloorY)<1e-8,id+' open interior');}
});

test('public transactions keep foreign purpose IDs, preserve solid flags and undo failed/rebuilt kitchen batches',()=>{
 const p=project(),offset=1200;for(const [role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-031',id:'rug',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-040',id:'bad',params:{refinement:'reference-v1',width:3}}]));assert.deepEqual(e.project,before);
 commit(e,kitchenRefinementIds.map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));const made=structuredClone(e.project.assets);for(const a of Object.values(made))assert.ok(a.meshes!.every(m=>m.material>offset));assert.deepEqual(made['life-031'].meshes!.find(m=>m.wovenPattern)!.wovenPattern!.materials,{ground:p.styles.yunshan.fabric,motif:p.styles.yunshan.wovenLight});
 commit(e,[{op:'rebuildCatalogAsset',assetId:'life-040',params:{refinement:'baseline'}}]);assert.equal(hash(geometryData(e.project.assets['life-040'])),hash(geometryData(makeLifeAsset('LIFE-040','sink','life-040',p.styles.yunshan))));commit(e,[{op:'undo'}]);assert.deepEqual(geometryData(e.project.assets['life-040']),geometryData(made['life-040']));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});

test('rug artwork has four mirrored woven corners; recolor and undo preserve every other purpose and geometry',()=>{
 const p=prepared(['LIFE-031']),e=new Engine(p),a=p.assets['life-031'],d=a.meshes!.find(m=>m.wovenPattern)!.wovenPattern!,pixels=wovenPatternPixels(d,p.materials),before=structuredClone(p);
 assert.ok(pixels.rolePixels.includes(0)&&pixels.rolePixels.includes(1));const at=(x:number,y:number)=>pixels.rolePixels[y*d.width+x];for(let y=0;y<d.height;y+=7)for(let x=0;x<d.width;x+=7){assert.equal(at(x,y),at(d.width-1-x,y));assert.equal(at(x,y),at(x,d.height-1-y));}
 commit(e,[{op:'material',id:d.materials.motif,properties:{color:'#ba3562',roughness:.44}}]);const after=wovenPatternPixels(d,e.project.materials);for(let i=0;i<pixels.rolePixels.length;i++)if(pixels.rolePixels[i]===0)assert.deepEqual(after.data.slice(i*4,i*4+4),pixels.data.slice(i*4,i*4+4));assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);commit(e,[{op:'undo'}]);assert.deepEqual(wovenPatternPixels(d,e.project.materials).data,pixels.data);assert.throws(()=>validateWovenPattern({...d,materials:{...d.materials,motif:p.styles.yunshan.stone}},p.materials));
});

test('actual rug GLB carries identical lit PBR pixels, purpose IDs and UVs',async()=>{
 const p=prepared(['LIFE-031']),a=p.assets['life-031'],b=displayMesh(a,p.materials).find(m=>m.wovenPattern)!,{glb}=await buildGLB(p,a.id),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]).readBinary(glb),primitive=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(p=>p.getMaterial()!.getExtras().wovenPattern)!,m=primitive.getMaterial()!;assert.equal(m.getExtension('KHR_materials_unlit'),null);assert.deepEqual(m.getExtras().sourceMaterialIds,Object.values(b.wovenPattern!.materials));
 for(const[t,expected]of[[m.getBaseColorTexture(),b.texture!.data],[m.getNormalTexture(),b.texture!.normal],[m.getMetallicRoughnessTexture(),b.texture!.orm]]as const){const raw=await sharp(t!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(raw.info.width,1024);assert.equal(raw.info.height,768);assert.deepEqual(new Uint8Array(raw.data),expected);}
 const uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!;assert.equal(uv.length,b.uvs.length);for(let i=0;i<uv.length;i++)assert.equal(uv[i],Math.fround(b.uvs[i]));
});

test('physical surfaces at actual kitchen coordinates use their own replaceable purposes',()=>{
 const p=prepared();assert.equal(Object.keys(p.styles.yunshan).length,512);
 const firstRole=(id:string,origin:V3,direction:V3)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:{distance:number;material:number}[]=[];for(const m of displayMesh(p.assets[id],p.materials))for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),hit=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(hit)out.push({distance:hit.distanceTo(ray.origin),material:m.material});}return out.sort((a,b)=>a.distance-b.distance)[0]?.material;};
 for(const [id,o,d,role]of[
 ['life-037',[.668,.45,-.2],[0,0,1],'bronze'],
 ['life-038',[.62,.3,.33],[0,-1,0],'stone'],
 ['life-041',[.10,.20,-.2],[0,0,1],'glass'],
 ['life-043',[.12,1,-.2],[0,0,1],'enamel'],
 ['life-044',[.18,.10,-.1],[0,0,1],'metalBright'],
 ['life-046',[.1,.04,-.2],[0,0,1],'ceramicWhite'],
 ['life-031',[.9,.3,.6],[0,-1,0],'fabric'],
 ]as [string,V3,V3,string][])assert.equal(firstRole(id,o,d),p.styles.yunshan[role],id+' '+role);
 for(const a of Object.values(p.assets))for(const m of a.meshes!){const material=p.materials[m.material];if(['screen','displayGlyph','glass'].some(role=>p.styles.yunshan[role]===m.material))assert.equal(material.intensity,0);assert.notEqual(material.category,'water','no fabricated water stream in kitchen fixtures');}
});

test('every normal-mapped rug triangle retains two UV axes, including its thin vertical edge',()=>{
 const p=prepared(['LIFE-031']),m=p.assets['life-031'].meshes!.find(m=>m.wovenPattern)!;
 for(let k=0;k<m.indices.length;k+=3){const uv=m.indices.slice(k,k+3).map(i=>m.uvs.slice(i*2,i*2+2)),area=(uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[1][1]-uv[0][1])*(uv[2][0]-uv[0][0]);assert.ok(Math.abs(area)>1e-12,'degenerate tangent frame at triangle '+k/3);}
});
