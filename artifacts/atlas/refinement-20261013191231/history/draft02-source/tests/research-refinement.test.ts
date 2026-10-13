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
import {researchRefinementIds} from '../src/production/research-refinement';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {heldContactGroups} from '../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import {surfaceArtworkPixels,validateSurfaceArtwork} from '../src/core/surface-artwork';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {refinementFinishCommands} from '../src/production/refinement-finish';
import type {Asset,Project,Command,V3} from '../src/core/types';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M007 regression');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=researchRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const hits=(p:Project,a:Asset,origin:V3,direction:V3,part?:string)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:{p:Vector3;material:number}[]=[];const ms=part?architectureComponents(a).filter(m=>m.name.includes(part)):displayMesh(a,p.materials);for(const m of ms)for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),h=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(h)out.push({p:h,material:m.material});}return out.sort((a,b)=>a.p.distanceTo(ray.origin)-b.p.distanceTo(ray.origin));};

test('M007 stays opt-in and preserves all 72 published refinement geometries',async()=>{
 const p=project();for(const run of['refinement-20261007114945','refinement-20261008061121','refinement-20261013041132','refinement-20261013062511','refinement-20261013114151','refinement-20261013135409'])for(const row of JSON.parse(await readFile('artifacts/atlas/'+run+'/production.json','utf8')).models)assert.equal(hash(geometryData(refined(p,row.id))),row.sha256,row.id);
 for(const id of researchRefinementIds){assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{},p),makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan));assert.notEqual(hash(geometryData(refined(p,id))),hash(geometryData(makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan))));}
});
test('M007 actual arrays closure native attachment and declared assembly groups are valid',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets);for(const a of Object.values(p.assets)){assert.ok(architectureClosed(a).every(c=>c.closed&&c.oriented),a.id);assert.ok(nativeIslandAttachments(a).every(c=>c.attached),a.id);assert.equal(heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials).length,a.id==='life-111'?2:a.id==='life-115'?4:1,a.id);for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);}
 const p2=project();for(const m of Object.values(p2.materials))m.solid=false;for(const id of researchRefinementIds)assert.ok(refined(p2,id).meshes!.every(m=>!m.collision));
});
test('M007 microscope stage bore and independent objective tubes are genuine apertures',()=>{
 const p=prepared(['LIFE-114']),a=p.assets['life-114'];assert.equal(hits(p,a,[.23,.275,.17],[0,1,0],'透孔载物').length,0);assert.ok(hits(p,a,[.27,.275,.17],[0,1,0],'透孔载物').length>0);assert.equal(hits(p,a,[.23,.275,.17],[0,1,0])[0].material,p.styles.yunshan.glass);
 assert.equal(hits(p,a,[.23,.353,.17],[0,1,0],'开放物镜钢套筒').length,0);assert.ok(hits(p,a,[.248,.353,.17],[0,1,0],'开放物镜钢套筒').length>0);assert.equal(hits(p,a,[.23,.203,.17],[0,1,0],'空心下聚光器').length,0);
});
test('M007 laboratory drain socket slits server vents and tool-ring holes remain physically open',()=>{
 const p=prepared(['LIFE-112','LIFE-118','LIFE-119']);assert.equal(hits(p,p.assets['life-112'],[.311,.60,.423],[0,1,0],'钢洗槽').length,0);assert.ok(hits(p,p.assets['life-112'],[.351,.60,.423],[0,1,0],'钢洗槽').length>0);
 for(const x of[.125,.264,1.233,1.371])for(const [dx,dy]of[[.0305,.068],[.0645,.068],[.0475,.0385]])assert.equal(hits(p,p.assets['life-112'],[1.64-x-dx,1.168+dy,.53],[0,0,1],'电插座真孔').length,0);
 for(let j=0;j<8;j++)for(let k=0;k<9;k++)assert.equal(hits(p,p.assets['life-118'],[.1855+k*.045,.281+j*.190,0],[0,0,1],'通风前板').length,0);assert.ok(hits(p,p.assets['life-118'],[.167,.281,0],[0,0,1],'通风前板').length>0);
 for(const x of[.48-.095,.48-.145]){assert.equal(hits(p,p.assets['life-119'],[x,.040,.093],[0,1,0],'贯通指环').length,0);assert.ok(hits(p,p.assets['life-119'],[x+.017,.040,.093],[0,1,0],'贯通指环').length>0);}
});
test('M007 empty vessel floors clamp stop planes wall contacts and scanner clearance are actual',()=>{
 const p=prepared(['LIFE-115','LIFE-120','LIFE-121','LIFE-122']);for(const [x,z,originY,floor,part]of[[.115,.16,.1,.034,'开放玻璃量杯'],[.286,.23,.05,.012,'细颈样品玻璃瓶'],[.395,.23,.05,.012,'细颈样品玻璃瓶'],[.329,.069,.020,.009,'开放玻璃培养皿']]as[number,number,number,number,string][])assert.ok(Math.abs(hits(p,p.assets['life-115'],[x,originY,z],[0,-1,0],part)[0].p.y-floor)<1e-8);
 for(const port of p.assets['life-120'].ports){const hit=hits(p,p.assets['life-120'],[port.position[0],port.position[1],-.1],[0,0,1],'开放病床夹座')[0];assert.ok(hit);assert.ok(Math.abs(hit.p.z-port.position[2])<1e-8);}for(const port of p.assets['life-121'].ports)assert.ok(Math.abs(hits(p,p.assets['life-121'],[port.position[0],port.position[1],.3],[0,0,-1])[0].p.z-port.position[2])<1e-8);
 for(const x of[.70,.88,1.06])for(const y of[.88,1.1,1.28])assert.equal(hits(p,p.assets['life-122'],[x,y,1.5],[0,0,1]).length,0);assert.ok(hits(p,p.assets['life-122'],[.18,1,1.5],[0,0,1],'扫描环厚壳').length>0);assert.equal(hits(p,p.assets['life-122'],[.88,.9,.5],[0,-1,0])[0].material,p.styles.yunshan.fabric);
 for(const x of[1.38-1.033,1.38-1.210])assert.equal(hits(p,p.assets['life-121'],[x,.394,-.10],[0,0,1]).length,0);
});
test('M007 purposeful paper bag plastic glass steel and unpowered optics preserve original contracts',()=>{
 const p=prepared(),e=new Engine(p);assert.equal(Object.keys(p.styles.yunshan).length,512);for(const a of Object.values(p.assets)){assert.deepEqual((a.source!.refinement as any).baselineSource,makeLifeAsset(String(a.source!.catalogId),a.name,a.id,p.styles.yunshan).source);for(const m of a.meshes!)assert.notEqual(p.materials[m.material].category,'food');}
 for(const role of['bagCloth','bagLeather','bagHardware','bookCover','paperSheet'])assert.ok(p.assets['life-111'].meshes!.some(m=>m.material===p.styles.yunshan[role]));for(const role of['bookCover','archiveBoard','bookCloth','paperSheet'])assert.ok(p.assets['life-116'].meshes!.some(m=>m.material===p.styles.yunshan[role]));assert.ok(p.assets['life-121'].meshes!.some(m=>m.material===p.styles.yunshan.signalRed));commit(e,[...referenceFinishCommands(p),...refinementFinishCommands(p,'M007')]);for(const role of['warm','energy','opticsGlow','lightCore','displayGlyph','displayWhite'])assert.equal(e.project.materials[p.styles.yunshan[role]].intensity,0);for(const a of Object.values(e.project.assets))for(const m of a.meshes!.filter(m=>m.artwork))validateSurfaceArtwork(m.artwork!,e.project.materials);
});
test('M007 foreign role IDs public rebuild undo and invalid mixed requests remain atomic',()=>{
 const p=project(),offset=2000;for(const[role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-111',id:'good',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-122',id:'bad',params:{refinement:'reference-v1',width:2}}]));assert.deepEqual(e.project,before);
 commit(e,researchRefinementIds.map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));const made=structuredClone(e.project.assets);assert.ok(Object.values(made).every(a=>a.meshes!.every(m=>m.material>offset)));commit(e,[{op:'rebuildCatalogAsset',assetId:'life-122',params:{refinement:'baseline'}}]);commit(e,[{op:'undo'}]);for(const[id,a]of Object.entries(made))assert.deepEqual({...e.project.assets[id],version:a.version},a);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});
test('M007 actual GLB glass alpha artwork PBR and isolated graduation ink recolor undo are retained',async()=>{
 const p=prepared(['LIFE-115','LIFE-117']),e=new Engine(p);commit(e,[...referenceFinishCommands(p),...refinementFinishCommands(p,'M007')]);const before=structuredClone(e.project);commit(e,[{op:'material',id:p.styles.yunshan.printedMark,properties:{color:'#af454d'}}]);assert.deepEqual(e.project.assets,before.assets);for(const[id,m]of Object.entries(before.materials))if(Number(id)!==p.styles.yunshan.printedMark)assert.deepEqual(e.project.materials[id],m);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);for(const id of['life-115','life-117']){const{glb}=await buildGLB(e.project,id),doc=await io.readBinary(glb),primitives=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives());for(const pr of primitives)assert.equal(pr.getMaterial()!.getExtension('KHR_materials_unlit'),null);if(id==='life-115'){const mat=primitives.find(pr=>pr.getMaterial()!.getExtras().voxelMaterialId===p.styles.yunshan.glass)!.getMaterial()!;assert.equal(mat.getAlphaMode(),'BLEND');const raw=await sharp(mat.getBaseColorTexture()!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true}),index=Object.values(e.project.materials).sort((a,b)=>a.id-b.id).findIndex(m=>m.id===p.styles.yunshan.glass),px=(Math.floor(index/16)*16+8)*raw.info.width+index%16*16+8;assert.equal(raw.data[px*4+3],Math.round(.27*255));}else{const arts=primitives.filter(pr=>pr.getMaterial()!.getExtras().artwork);assert.equal(arts.length,e.project.assets[id].meshes!.filter(m=>m.artwork).length);assert.ok(arts.some(pr=>(pr.getMaterial()!.getExtras().artwork as any).design==='energy-v1'));for(const pr of arts){const mat=pr.getMaterial()!,d=mat.getExtras().artwork as any,t=surfaceArtworkPixels(d,e.project.materials);const raw=await sharp(mat.getBaseColorTexture()!.getImage()!).ensureAlpha().raw().toBuffer();assert.deepEqual(new Uint8Array(raw),t.data);assert.ok(mat.getNormalTexture());assert.ok(mat.getMetallicRoughnessTexture());}}}
});
