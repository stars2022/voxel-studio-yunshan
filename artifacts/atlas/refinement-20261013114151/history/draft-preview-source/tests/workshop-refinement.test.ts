import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Ray,Vector3} from 'three';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {makeLifeAsset} from '../src/production/life';
import {workshopRefinementIds} from '../src/production/workshop-refinement';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {heldContactGroups} from '../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {geometryData} from '../src/core/sky';
import {outfitHash as hash} from '../src/production/outfit-components';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {refinementFinishCommands} from '../src/production/refinement-finish';
import type {Asset,Project,Command,V3} from '../src/core/types';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M005 regression');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const refined=(p:Project,id:string)=>makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);
const prepared=(ids=workshopRefinementIds)=>{const p=project();for(const id of ids){const a=refined(p,id);p.assets[a.id]=a;}return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const hits=(p:Project,a:Asset,origin:V3,direction:V3,part?:string)=>{const ray=new Ray(new Vector3(...origin),new Vector3(...direction)),out:{p:Vector3;material:number}[]=[];const ms=part?architectureComponents(a).filter(m=>m.name.includes(part)):displayMesh(a,p.materials);for(const m of ms)for(let k=0;k<m.indices.length;k+=3){const ps=m.indices.slice(k,k+3).map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),h=ray.intersectTriangle(ps[0],ps[1],ps[2],false,new Vector3());if(h)out.push({p:h,material:m.material});}return out.sort((a,b)=>a.p.distanceTo(ray.origin)-b.p.distanceTo(ray.origin));};

test('M005 remains opt-in while all 48 published reference geometries retain their hashes',async()=>{
 const p=project();for(const run of['refinement-20261007114945','refinement-20261008061121','refinement-20261013041132','refinement-20261013062511'])for(const row of JSON.parse(await readFile('artifacts/atlas/'+run+'/production.json','utf8')).models)assert.equal(hash(geometryData(refined(p,row.id))),row.sha256,row.id);
 for(const id of workshopRefinementIds){const old=makeLifeAsset(id,id,id.toLowerCase(),p.styles.yunshan);assert.deepEqual(makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{},p),old);assert.notEqual(hash(geometryData(refined(p,id))),hash(geometryData(old)));}
});
test('M005 actual components are oriented and closed with attached native fasteners and declared contact groups',()=>{
 const p=prepared();validateProject(p);assert.deepEqual(JSON.parse(JSON.stringify(p.assets)),p.assets);
 for(const a of Object.values(p.assets)){assert.ok(architectureClosed(a).every(c=>c.closed&&c.oriented),a.id);assert.ok(nativeIslandAttachments(a).every(c=>c.attached),a.id);const groups=heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},p.materials);assert.equal(groups.length,a.id==='life-087'?2:1,a.id);for(const m of a.meshes!)assert.equal(m.collision,p.materials[m.material].solid);}
 const p2=project();for(const m of Object.values(p2.materials))m.solid=false;for(const id of workshopRefinementIds)assert.ok(refined(p2,id).meshes!.every(m=>!m.collision));
});
test('M005 conveyor has actual upper and lower returns and ports on the steel chain surface',()=>{
 const p=prepared(['LIFE-078']),a=p.assets['life-078'];for(const[d,y]of[[[0,1,0],.702],[[0,-1,0],.542]]as[V3,number][])assert.ok(Math.abs(hits(p,a,[.80,.622,.30],d,'橡胶传送回路')[0].p.y-y)<1e-7);
 assert.ok(Math.abs(hits(p,a,[-.2,.622,.30],[1,0,0],'橡胶传送回路')[0].p.x-.010)<1e-7);
 for(const port of a.ports){const o=[port.position[0],1,port.position[2]]as V3;assert.equal(hits(p,a,o,[0,-1,0])[0].material,p.styles.yunshan.metalBright);assert.ok(Math.abs(hits(p,a,o,[0,-1,0])[0].p.y-port.position[1])<1e-8);}
});
test('M005 lift under-space vents pegboard bores wrench rings and cutter bore are true openings',()=>{
 const p=prepared(['LIFE-079','LIFE-082','LIFE-083','LIFE-084']);assert.equal(hits(p,p.assets['life-079'],[.31,.36,-.1],[0,0,1]).length,0);assert.ok(hits(p,p.assets['life-079'],[.58,.383,-.1],[0,0,1]).length>0);
 for(let j=0;j<99;j++){const x=.117+j%11*.067,y=.631+Math.floor(j/11)*.070;assert.equal(hits(p,p.assets['life-083'],[x,y,.1],[0,0,1],'九十九孔涂装钢挂板').length,0);}assert.ok(hits(p,p.assets['life-083'],[.143,.631,.1],[0,0,1],'九十九孔涂装钢挂板').length>0);
 for(const x of[.313,.473]){assert.equal(hits(p,p.assets['life-083'],[x,1.181,0],[0,0,1],'扳手真实贯通环口').length,0);assert.ok(hits(p,p.assets['life-083'],[x+.034,1.181,0],[0,0,1],'扳手真实贯通环口').length>0);}
 assert.ok(Math.abs(hits(p,p.assets['life-082'],[-.1,.36,.176],[1,0,0])[0].p.x-1.088)<1e-7);assert.ok(Math.abs(hits(p,p.assets['life-082'],[.60,.8,.03],[0,0,1])[0].p.z-.737)<1e-7);
 assert.equal(hits(p,p.assets['life-084'],[1.23,.735,.1],[0,0,1],'一体钢刀盘').length,0);assert.ok(hits(p,p.assets['life-084'],[1.46,.735,.1],[0,0,1],'一体钢刀盘').length>0);
});
test('M005 harvest and catch containers retain floors while actual net diamonds and grips stay open',()=>{
 const p=prepared(['LIFE-086','LIFE-087','LIFE-088']);assert.equal(hits(p,p.assets['life-086'],[-.1,.330,.20],[1,0,0]).length,0);assert.ok(hits(p,p.assets['life-086'],[-.1,.27,.20],[1,0,0]).length>0);
 assert.ok(Math.abs(hits(p,p.assets['life-086'],[.365,.4,.21],[0,-1,0])[0].p.y-.073)<1e-8);assert.ok(Math.abs(hits(p,p.assets['life-087'],[.76,.25,.16],[0,-1,0])[0].p.y-.073)<1e-8);
 assert.equal(hits(p,p.assets['life-087'],[.178,.272,.38],[0,0,1]).length,0);assert.equal(hits(p,p.assets['life-087'],[.76,.235,-.1],[0,0,1]).length,0);
 assert.equal(hits(p,p.assets['life-088'],[-.1,.31,.267],[1,0,0],'真实外置握孔').length,0);assert.ok(hits(p,p.assets['life-088'],[-.1,.255,.267],[1,0,0],'真实外置握孔').length>0);
 assert.ok(Math.abs(hits(p,p.assets['life-088'],[.45,.4,.28],[0,-1,0])[0].p.y-.090)<1e-8);
});
test('M005 actual surface purposes separate steel rubber glass ink plastic rope and nonmetal mineral veins',()=>{
 const p=prepared();assert.equal(Object.keys(p.styles.yunshan).length,512);
 for(const[id,o,d,role]of[['life-077',[.34,.50,.30],[0,-1,0],'wood'],['life-078',[.8,.622,.30],[0,-1,0],'rubber'],['life-079',[.10,1,.040],[0,-1,0],'printedWarning'],['life-080',[.31,.5,.31],[0,-1,0],'metalBright'],['life-081',[.70,1,.30],[0,-1,0],'stone'],['life-082',[.60,.8,-.1],[0,0,1],'glass'],['life-088',[.40,.24,-.1],[0,0,1],'inkTeal'],['life-088',[.2,.35,-.1],[0,0,1],'polymer']]as[string,V3,V3,string][])assert.equal(hits(p,p.assets[id],o,d)[0]?.material,p.styles.yunshan[role],id+' '+role);
 for(const m of p.assets['life-085'].meshes!)assert.equal(p.materials[m.material].category,'stone');assert.ok(p.assets['life-085'].meshes!.some(m=>m.material===p.styles.yunshan.oreVein));assert.ok(p.assets['life-087'].meshes!.some(m=>m.material===p.styles.yunshan.rope));
 for(const a of Object.values(p.assets)){assert.ok(String((a.source!.refinement as any).scope).includes('no '),a.id);for(const m of a.meshes!){assert.equal(p.materials[m.material].intensity,0);assert.notEqual(p.materials[m.material].category,'water');assert.notEqual(p.materials[m.material].category,'food');}}
});
test('M005 public create rebuild and undo preserve foreign purpose IDs and atomic failure rollback',()=>{
 const p=project(),offset=2000;for(const[role,id]of Object.entries(p.styles.yunshan)){p.styles.yunshan[role]=id+offset;p.materials[id+offset]={...p.materials[id],id:id+offset};}for(const id of Object.keys(p.materials).map(Number))if(id<offset)delete p.materials[id];const e=new Engine(p),before=structuredClone(p);
 assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-077',id:'rack',params:{refinement:'reference-v1'}},{op:'produceCatalogAsset',catalogId:'LIFE-078',id:'bad',params:{refinement:'reference-v1',width:2}}]));assert.deepEqual(e.project,before);
 commit(e,workshopRefinementIds.map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));const made=structuredClone(e.project.assets);assert.ok(Object.values(made).every(a=>a.meshes!.every(m=>m.material>offset)));commit(e,[{op:'rebuildCatalogAsset',assetId:'life-084',params:{refinement:'baseline'}}]);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,made);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);
});
test('M005 lit GLBs retain real observation transparency and isolated cold-chain ink recoloring',async()=>{
 const p=prepared(['LIFE-082','LIFE-088']),e=new Engine(p);commit(e,[...referenceFinishCommands(p),...refinementFinishCommands(p,'M005')]);const before=structuredClone(e.project);commit(e,[{op:'material',id:p.styles.yunshan.inkTeal,properties:{color:'#af4543'}}]);assert.deepEqual(e.project.assets,before.assets);for(const [id,m]of Object.entries(before.materials))if(Number(id)!==p.styles.yunshan.inkTeal)assert.deepEqual(e.project.materials[id],m);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);
 const io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);for(const id of['life-082','life-088']){const {glb}=await buildGLB(e.project,id),d=await io.readBinary(glb),primitives=d.getRoot().listMeshes().flatMap(m=>m.listPrimitives());for(const primitive of primitives){assert.ok(primitive.getAttribute('POSITION')!.getCount()>0);assert.equal(primitive.getMaterial()!.getExtension('KHR_materials_unlit'),null);}if(id==='life-082')assert.ok(primitives.some(v=>v.getMaterial()!.getAlphaMode()==='BLEND'&&Math.abs(v.getMaterial()!.getBaseColorFactor()[3]-.25)<1e-7));else{const used=d.getRoot().listMaterials();for(const role of['polymer','rubber','inkTeal','printedMark'])assert.ok(used.some(m=>m.getName()===e.project.materials[p.styles.yunshan[role]].name),role);}}
});
