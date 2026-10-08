import {heldContactGroups} from '../scripts/lib/held-audit';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Ray,Vector3,MeshStandardMaterial} from 'three';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import sharp from 'sharp';
import {productionProject} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {m001RefinementIds as referenceRefinementIds} from '../src/production/reference-refinement';
import {refinementFinishCommands} from '../src/production/refinement-finish';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {assetBoundsM,geometryData} from '../src/core/sky';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {wovenPatternPixels,validateWovenPattern} from '../src/core/woven-pattern';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import {texturedFaceMaterial} from '../src/client/face-material';
import {disposeSkyMaterial} from '../src/client/sky-material';
import type {Project,Command,Asset} from '../src/core/types';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M001 reference refinement');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=referenceRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const hitCount=(p:Project,a:Asset,x:number,y:number)=>{const ray=new Ray(new Vector3(x,y,-.3),new Vector3(0,0,1));let hits=0;for(const m of displayMesh(a,p.materials))for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3)));if(ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3()))hits++;}return hits;};

test('all 12 refinements are explicit; defaults and the baseline selection preserve earlier geometry, ports and roles',()=>{
 const p=project();for(const id of referenceRefinementIds){const old=makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan);for(const params of[{}, {refinement:'baseline'}]as Record<string,string|number>[])assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,params,p),old);assert.notDeepEqual(geometryData(refined(p,id)),geometryData(old));}
 for(const [id,params]of[['LIFE-001',{refinement:'reference-v1'}],['LIFE-019',{refinement:'reference-v1',width:.6}],['LIFE-019',{refinement:'unknown'}]]as const)assert.throws(()=>makeCatalogAsset(id,id,id,p.styles.yunshan,params,p));
});

test('closed continuous components retain connected native fasteners and their actual material collision flags',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets,'native JSON must preserve the entire authored asset');for(const a of Object.values(p.assets)){const c=architectureClosed(a),n=nativeIslandAttachments(a);assert.ok(c.length&&c.every(r=>r.closed&&r.oriented),a.id);assert.ok(n.length&&n.every(r=>r.attached),a.id);assert.equal(heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials).length,1,a.id+' every separate real component must join the object');assert.equal(a.cellSize,.005);for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);const bounds=assetBoundsM(a)!;for(const port of a.ports){assert.ok(port.position.every((v,k)=>v>=bounds.min[k]-1e-8&&v<=bounds.max[k]+1e-8));if(port.kind==='base')assert.equal(port.position[1],bounds.min[1]);else{const components=architectureComponents(a);assert.ok(components.some(m=>{for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),ray=new Ray(new Vector3(...port.position).add(new Vector3(...port.normal).multiplyScalar(.01)),new Vector3(...port.normal).negate()),hit=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(hit&&hit.distanceTo(new Vector3(...port.position))<1e-7)return true;}return false;}),a.id+' mount touches actual geometry');}}}
 const nonSolid=project();for(const m of Object.values(nonSolid.materials))m.solid=false;for(const id of referenceRefinementIds){const a=refined(nonSolid,id);nonSolid.assets[a.id]=a;}validateProject(nonSolid);assert.ok(Object.values(nonSolid.assets).every(a=>a.meshes!.every(m=>!m.collision)));
 assert.equal(p.assets['life-027'].ports.length,6);assert.equal(p.assets['life-025'].ports.length,2);assert.equal(p.assets['life-026'].ports.length,2);
});

test('socket holes pass through the entire front and backing; stool cap UVs have two noncollapsed axes',()=>{
 const p=prepared(['LIFE-030','LIFE-023']),panel=p.assets['life-030'];const slots=(panel.source!.refinement as any).throughSlots;
 for(const s of slots){const x=.28-(s.x+.022),y=s.y+.025;assert.equal(hitCount(p,panel,x,y),0,JSON.stringify(s));assert.ok(hitCount(p,panel,x+.008,y)>0,'adjacent real socket wall');}
 const cushion=architectureComponents(p.assets['life-023']).find(m=>m.name==='低鼓度软垫')!;let checked=0;for(let k=0;k<cushion.indices.length;k+=3){const ids=cushion.indices.slice(k,k+3);if(cushion.normals[ids[0]*3+1]<.999)continue;const uv=ids.map(i=>cushion.uvs.slice(i*2,i*2+2)),area=(uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[1][1]-uv[0][1])*(uv[2][0]-uv[0][0]);assert.ok(Math.abs(area)>1e-7);checked++;}assert.ok(checked>=30);
});

test('public create/rebuild, rejected transactions and one undo retain custom role IDs and original masters',()=>{
 const p=project();const offset=900;for(const [role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-027',id:'curtain',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-020',id:'bad',params:{refinement:'reference-v1',width:.8}}]));assert.deepEqual(e.project,before);
 commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-027',id:'curtain',params:{refinement:'reference-v1'}}]);const a=structuredClone(e.project.assets.curtain);assert.ok(a.meshes!.every(m=>m.material>offset));assert.deepEqual(a.meshes!.find(m=>m.wovenPattern)!.wovenPattern!.materials,{ground:p.styles.yunshan.wovenLight,motif:p.styles.yunshan.fabric});
 commit(e,[{op:'rebuildCatalogAsset',assetId:'curtain',params:{refinement:'baseline'}}]);assert.deepEqual(geometryData(e.project.assets.curtain),geometryData(makeLifeAsset('LIFE-027','curtain','curtain',p.styles.yunshan)));commit(e,[{op:'undo'}]);assert.ok(e.project.assets.curtain.version>a.version);assert.deepEqual({...e.project.assets.curtain,version:a.version},a);
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.styles,before.styles);
});

test('woven border uses two actual fabric purposes; changing either appearance preserves geometry and every other purpose',()=>{
 const p=prepared(['LIFE-027']),e=new Engine(p);commit(e,[...referenceFinishCommands(p),...refinementFinishCommands(p)]);const a=e.project.assets['life-027'],d=a.meshes!.find(m=>m.wovenPattern)!.wovenPattern!,before=structuredClone(e.project),pixels=wovenPatternPixels(d,e.project.materials);
 assert.ok(pixels.rolePixels.includes(0)&&pixels.rolePixels.includes(1));assert.deepEqual(wovenPatternPixels({...d,materials:{motif:d.materials.motif,ground:d.materials.ground}},e.project.materials).data,pixels.data);
 commit(e,[{op:'material',id:d.materials.motif,properties:{color:'#ca286b',opacity:.6,roughness:.52}}]);const changed=wovenPatternPixels(d,e.project.materials);assert.equal(changed.transparent,true);for(let i=0;i<pixels.rolePixels.length;i++)if(pixels.rolePixels[i]===0)assert.deepEqual(changed.data.slice(i*4,i*4+4),pixels.data.slice(i*4,i*4+4));assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 commit(e,[{op:'undo'}]);assert.deepEqual(wovenPatternPixels(d,e.project.materials).data,pixels.data);
 assert.throws(()=>validateWovenPattern({...d,materials:{...d.materials,motif:e.project.styles.yunshan.stone}},e.project.materials));
});

test('exported curtain contains the exact lit artwork, normal and ORM pixels, source role IDs and unchanged UVs',async()=>{
 const p=prepared(['LIFE-027']),e=new Engine(p);commit(e,[...referenceFinishCommands(p),...refinementFinishCommands(p)]);const a=e.project.assets['life-027'],b=displayMesh(a,e.project.materials).find(m=>m.wovenPattern)!;const {glb}=await buildGLB(e.project,'life-027'),doc=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]).readBinary(glb),primitive=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(p=>p.getMaterial()!.getExtras().wovenPattern)!,m=primitive.getMaterial()!;
 assert.equal(m.getExtension('KHR_materials_unlit'),null);assert.equal(m.getRoughnessFactor(),1);assert.equal(m.getMetallicFactor(),1);assert.deepEqual(m.getExtras().sourceMaterialIds,Object.values(b.wovenPattern!.materials));assert.equal(m.getExtras().collisionSolid,e.project.materials[b.material].solid);
 for(const [t,expected]of[[m.getBaseColorTexture(),b.texture!.data],[m.getNormalTexture(),b.texture!.normal],[m.getMetallicRoughnessTexture(),b.texture!.orm]]as const){const decoded=await sharp(t!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(decoded.info.width,1024);assert.equal(decoded.info.height,192);assert.deepEqual(new Uint8Array(decoded.data),expected);}
 const uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!;assert.equal(uv.length,b.uvs.length);for(let i=0;i<uv.length;i++)assert.equal(uv[i],Math.fround(b.uvs[i]));
});

test('lit cloth material uses all three maps and frees each GPU texture once',()=>{
 const p=prepared(['LIFE-027']),b=displayMesh(p.assets['life-027'],p.materials).find(m=>m.wovenPattern)!,mat=texturedFaceMaterial(b,new MeshStandardMaterial()),textures=[mat.map!,mat.normalMap!,mat.roughnessMap!];assert.equal(mat.metalnessMap,mat.roughnessMap);assert.equal(mat.roughness,1);assert.equal(mat.metalness,1);let disposed=0;for(const t of textures)t.addEventListener('dispose',()=>disposed++);disposeSkyMaterial(mat);assert.equal(disposed,3);
});
