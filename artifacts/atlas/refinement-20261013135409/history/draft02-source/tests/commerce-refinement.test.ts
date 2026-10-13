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
import {commerceRefinementIds} from '../src/production/commerce-refinement';
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
const project=()=>{const p=productionProject('M006 regression');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=commerceRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const hits=(p:Project,a:Asset,origin:V3,direction:V3,part?:string)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:{p:Vector3;material:number}[]=[];const ms=part?architectureComponents(a).filter(m=>m.name.includes(part)):displayMesh(a,p.materials);for(const m of ms)for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),h=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(h)out.push({p:h,material:m.material});}return out.sort((a,b)=>a.p.distanceTo(ray.origin)-b.p.distanceTo(ray.origin));};

test('M006 is opt-in and all 60 published refinement geometries retain exact hashes',async()=>{
 const p=project();for(const run of['refinement-20261007114945','refinement-20261008061121','refinement-20261013041132','refinement-20261013062511','refinement-20261013114151'])for(const row of JSON.parse(await readFile('artifacts/atlas/'+run+'/production.json','utf8')).models)assert.equal(hash(geometryData(refined(p,row.id))),row.sha256,row.id);
 for(const id of commerceRefinementIds){const old=makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan);assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{},p),old);assert.notEqual(hash(geometryData(refined(p,id))),hash(geometryData(old)));}
});
test('M006 real components are oriented closed attached and connected without changing collision purposes',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets);
 for(const a of Object.values(p.assets)){assert.ok(architectureClosed(a).every(c=>c.closed&&c.oriented),a.id);assert.ok(nativeIslandAttachments(a).every(c=>c.attached),a.id);assert.equal(heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials).length,1,a.id);for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);}
 const p2=project();for(const m of Object.values(p2.materials))m.solid=false;for(const id of commerceRefinementIds)assert.ok(refined(p2,id).meshes!.every(m=>!m.collision));
});
test('M006 input stone and lectern have actual continuous slope planes with empty rear storage',()=>{
 const p=prepared(['LIFE-089','LIFE-091','LIFE-109']);for(const[id,w,d]of[['life-089',1.02,.56],['life-091',.62,.50]]as[string,number,number][])for(const z of[.085,.19,.30]){const h=hits(p,p.assets[id],[w/2,1.2,z],[0,-1,0],'连续斜石')[0];assert.ok(h);assert.ok(Math.abs(h.p.y-(.788+.039*(z-.047)/(d-.137)))<1e-8);}
 const a=p.assets['life-109'];for(const z of[.15,.25,.35])assert.ok(Math.abs(hits(p,a,[.51,1.5,z],[0,-1,0],'连续倾斜木')[0].p.y-(1.003+.13*(z-.025)/.59))<1e-8);assert.equal(hits(p,a,[.51,.50,.75],[0,0,-1])[0].material,p.styles.yunshan.wood);assert.ok(hits(p,a,[.51,.50,.75],[0,0,-1])[0].p.z<.12);
});
test('M006 actual vents transmission slots case grip and bottle bores remain open with real floors',()=>{
 const p=prepared(['LIFE-089','LIFE-090','LIFE-095','LIFE-096','LIFE-110']);for(let j=0;j<7;j++)assert.equal(hits(p,p.assets['life-089'],[.200,.227+j*.055,0],[0,0,1],'前机箱通风盖').length,0);assert.ok(hits(p,p.assets['life-089'],[.200,.210,0],[0,0,1],'前机箱通风盖').length>0);
 for(let j=0;j<10;j++)assert.equal(hits(p,p.assets['life-090'],[.98-(.163+j*.066),.128,0],[0,0,1],'传声槽钢承片').length,0);
 assert.equal(hits(p,p.assets['life-095'],[.31,.420,0],[0,0,1]).length,0);assert.ok(Math.abs(hits(p,p.assets['life-095'],[.31,.30,.20],[0,-1,0],'空心涂装金属箱壳')[0].p.y-.051)<1e-8);
 for(const x of[.48-.272,.48-.353,.48-.431]){assert.equal(hits(p,p.assets['life-096'],[x,.06,.092],[0,1,0],'空心琥珀玻璃药瓶').length,0);assert.ok(Math.abs(hits(p,p.assets['life-096'],[x,.06,.092],[0,-1,0],'空心琥珀玻璃药瓶')[0].p.y-.029)<1e-8);}
 for(let j=0;j<5;j++)assert.equal(hits(p,p.assets['life-110'],[.40,.209+j*.034,0],[0,0,1],'通风钢框').length,0);
});
test('M006 grain leaf fish and packaging roles describe actual surfaces and keep original contracts',()=>{
 const p=prepared();assert.equal(Object.keys(p.styles.yunshan).length,512);for(const a of Object.values(p.assets))assert.deepEqual((a.source!.refinement as any).baselineSource,makeLifeAsset(String(a.source!.catalogId),a.name,a.id,p.styles.yunshan).source);
 for(const id of['life-092','life-094'])for(const m of p.assets[id].meshes!)assert.equal(p.materials[m.material].category,'food');assert.ok(p.assets['life-092'].meshes!.some(m=>m.material===p.styles.yunshan.grainPale));assert.ok(p.assets['life-093'].meshes!.some(m=>m.material===p.styles.yunshan.vegetableStalk));for(const m of p.assets['life-093'].meshes!)assert.ok(['food','plant'].includes(p.materials[m.material].category));
 for(const[id,o,d,role]of[['life-093',[.12,-.1,.12],[0,1,0],'vegetableStalk'],['life-094',[.18,.20,.08],[0,-1,0],'fishBack'],['life-094',[.18,-.05,.08],[0,1,0],'fishPale'],['life-106',[.10,-.01,.15],[0,1,0],'bookCover'],['life-096',[.208,.06,.092],[1,0,0],'bottleAmber']]as[string,V3,V3,string][])assert.equal(hits(p,p.assets[id],o,d)[0].material,p.styles.yunshan[role],id+' '+role);
 assert.equal(hits(p,p.assets['life-094'],[.440,.073,.02],[0,0,1],'连续叉尾').length,0);assert.ok(hits(p,p.assets['life-094'],[.432,.126,.02],[0,0,1],'连续叉尾').length>0);
});
test('M006 saved artwork uses actual independent pigment or display roles and nondegenerate two-axis UVs',()=>{
 const p=prepared();let designs=new Set<string>();for(const a of Object.values(p.assets))for(const m of a.meshes!.filter(m=>m.artwork)){const d=m.artwork!;validateSurfaceArtwork(d,p.materials);designs.add(d.design);for(let k=0;k<m.indices.length;k+=3){const [aa,bb,cc]=m.indices.slice(k,k+3).map(i=>m.uvs.slice(i*2,i*2+2));assert.ok(Math.abs((bb[0]-aa[0])*(cc[1]-aa[1])-(bb[1]-aa[1])*(cc[0]-aa[0]))>1e-12,a.id);}}
 assert.deepEqual([...designs].sort(),['book-v1','control-v1','finance-v1','landscape-v1','lesson-v1','parcel-v1']);const a=p.assets['life-107'],d=a.meshes!.find(m=>m.artwork)!.artwork!;assert.throws(()=>validateSurfaceArtwork({...d,materials:{...d.materials,motif:p.styles.yunshan.fabric}},p.materials));assert.throws(()=>validateProject({...p,assets:{...p.assets,[a.id]:{...a,meshes:a.meshes!.map(m=>m.artwork?{...m,artwork:{...d,materials:{...d.materials,motif:d.materials.ground}}}:m)}}}));
});
test('M006 public create rebuild undo and rejected transactions preserve foreign material mappings',()=>{
 const p=project(),offset=2000;for(const[role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-089',id:'good',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-094',id:'bad',params:{refinement:'reference-v1',width:2}}]));assert.deepEqual(e.project,before);
 commit(e,commerceRefinementIds.map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));const made=structuredClone(e.project.assets);for(const a of Object.values(made))for(const m of a.meshes!){assert.ok(m.material>offset);if(m.artwork)assert.ok(Object.values(m.artwork.materials).every(id=>id>offset));}commit(e,[{op:'rebuildCatalogAsset',assetId:'life-107',params:{refinement:'baseline'}}]);commit(e,[{op:'undo'}]);for(const[id,a]of Object.entries(made))assert.deepEqual({...e.project.assets[id],version:a.version},a);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});
test('M006 lit GLB artwork embeds exact palette-derived albedo normal ORM and isolated recolor with undo',async()=>{
 const p=prepared(['LIFE-089','LIFE-106','LIFE-107']),e=new Engine(p);commit(e,[...referenceFinishCommands(p),...refinementFinishCommands(p,'M006')]);const before=structuredClone(e.project),a=before.assets['life-107'],d=a.meshes!.find(m=>m.artwork)!.artwork!,pixels=surfaceArtworkPixels(d,before.materials);commit(e,[{op:'material',id:d.materials.motif,properties:{color:'#b5444d'}}]);assert.deepEqual(e.project.assets,before.assets);const after=surfaceArtworkPixels(d,e.project.materials);let changed=0;for(let i=0;i<pixels.rolePixels.length;i++){const aa=pixels.data.subarray(i*4,i*4+4),bb=after.data.subarray(i*4,i*4+4);if(!aa.every((v,j)=>v===bb[j])){assert.equal(pixels.rolePixels[i],1);changed++;}}assert.ok(changed>10000);assert.deepEqual(after.normal,pixels.normal);assert.deepEqual(after.orm,pixels.orm);for(const[id,m]of Object.entries(before.materials))if(Number(id)!==d.materials.motif)assert.deepEqual(e.project.materials[id],m);commit(e,[{op:'undo'}]);assert.deepEqual(surfaceArtworkPixels(d,e.project.materials).data,pixels.data);
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);for(const id of['life-089','life-106','life-107']){const {glb}=await buildGLB(e.project,id),doc=await io.readBinary(glb),primitives=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives());for(const primitive of primitives)assert.equal(primitive.getMaterial()!.getExtension('KHR_materials_unlit'),null);const arts=primitives.filter(v=>v.getMaterial()!.getExtras().artwork);assert.equal(arts.length,e.project.assets[id].meshes!.filter(m=>m.artwork).length);for(const primitive of arts){const mat=primitive.getMaterial()!,d=mat.getExtras().artwork as any,t=surfaceArtworkPixels(d,e.project.materials);assert.deepEqual(mat.getExtras().sourceMaterialIds,Object.values(d.materials));for(const[tex,expected]of[[mat.getBaseColorTexture(),t.data],[mat.getNormalTexture(),t.normal],[mat.getMetallicRoughnessTexture(),t.orm]]as const){assert.ok(tex);const raw=await sharp(tex!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(raw.info.width,1024);assert.equal(raw.info.height,768);assert.deepEqual(new Uint8Array(raw.data),expected);}assert.deepEqual(mat.getBaseColorFactor(),[1,1,1,1]);assert.equal(mat.getRoughnessFactor(),1);assert.equal(mat.getMetallicFactor(),1);assert.ok(primitive.getAttribute('TEXCOORD_0')!.getCount()>0);}}
});
