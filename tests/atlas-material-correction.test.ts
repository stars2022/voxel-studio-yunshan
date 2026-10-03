import test from 'node:test';
import assert from 'node:assert/strict';
import {productionProject} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import {Grid} from '../src/core/grid';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import {exportProject} from '../src/export/exporter';
import {atlasMaterialNotes,inspectAtlasMaterialAssignments} from '../src/production/atlas-material-review';
import {referenceFinishCommands} from '../src/production/reference-finish';
import type {Asset,Command,V3} from '../src/core/types';

const p=productionProject('semantic correction'),s=p.styles.yunshan,cache=new Map<number,Asset>();
const model=(n:number)=>{if(!cache.has(n))cache.set(n,makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),'test','asset-'+n,s));return cache.get(n)!;};
const at=(n:number,v:V3)=>new Grid(model(n).chunks).get(v.map(x=>Math.floor((x+1e-8)/model(n).cellSize)) as V3);
const used=(n:number)=>new Set([...new Grid(model(n).chunks).cells()].map(([,id])=>id));
function commit(e:Engine,commands:Command[]){const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:dry.previewToken});}

test('same-looking materials have separate IDs, categories and independent authored roles',()=>{
 const categories:Record<string,string>={ceramicTeal:'ceramic',polymerDark:'plastic',metalBright:'metal',wovenLight:'fabric',glassEtch:'glass',rope:'fabric',oreVein:'stone',oreMatrix:'stone',grain:'food',grainPale:'food',vegetableStalk:'food',fish:'food',fishBack:'food',fishPale:'food',fishEye:'food',bottleAmber:'glass',inkTeal:'ink',paperEdge:'paper',bookCloth:'fabric',metalTeal:'metal',printedWarning:'ink'};
 for(const [r,c]of Object.entries(categories))assert.equal(p.materials[s[r]].category,c,r);
 assert.equal(new Set(Object.values(s)).size,Object.keys(s).length);
 assert.equal(Object.keys(atlasMaterialNotes).length,106);
 for(const n of Object.keys(atlasMaterialNotes).map(Number)){const a=model(n);assert.deepEqual(a.source!.materialAssignmentReview,inspectAtlasMaterialAssignments(n,a,s));assert.ok(!used(n).has(s.paper),n+' cannot use ambiguous legacy paper/cotton');}
});

test('pottery, textile motifs, sockets and instrument panels use physical categories at actual cells',()=>{
 assert.equal(at(19,[.04,.04,.07]),s.polymer,'ordinary keycap');assert.equal(at(19,[.04,.04,.175]),s.polymerDark,'dark keycap');
 assert.equal(at(30,[.08,.075,-.005]),s.polymer,'socket fascia');
 for(const n of[27,31])for(const id of used(n))assert.equal(p.materials[id].category,'fabric',n+' all cloth including tassel knots');
 for(const id of used(46))assert.equal(p.materials[id].category,'ceramic','bowl including coloured rings');
 assert.equal(at(43,[.045,.20,.035]),s.polymer,'refrigerator inner liner');assert.equal(at(43,[.11,.45,-.025]),s.enamel,'painted refrigerator door');
 assert.equal(at(51,[.02,.08,.02]),s.ceramicWhite,'washbasin wall');
 assert.equal(at(52,[.20,.52,.60]),s.ceramicWhite,'toilet cistern');assert.equal(at(52,[.20,.40,.08]),s.polymer,'toilet seat');
 assert.equal(at(82,[.50,.80,.72]),s.enamel,'machine enclosure');
 assert.equal(at(84,[1.40,.73,.325]),s.metalBright,'steel saw disc away from hub');
});

test('paper, ink, food, book cloth, bottle glass and plastic caps never borrow one another',()=>{
 assert.equal(at(106,[.11,.027,.15]),s.paperSheet);assert.equal(at(106,[.11,.002,.15]),s.bookCover);
 assert.equal(at(107,[.27,.0275,.1075]),s.inkTeal);assert.equal(at(107,[.27,.0275,.0975]),s.paperSheet);
 for(const n of[92,94])for(const id of used(n))assert.equal(p.materials[id].category,'food');
 assert.equal(at(96,[.265,.075,.09]),s.bottleAmber,'bottle wall choice is glass');assert.equal(at(96,[.265,.145,.09]),s.polymer,'cap');
 assert.ok(!used(96).has(s.grain));assert.ok(!used(96).has(s.leafAlt));
 for(const n of[89,91,110]){assert.ok(used(n).has(s.displayGlyph));assert.ok(used(n).has(s.displayWhite));assert.ok(!used(n).has(s.fabricEdge));}
});

test('cloth-only pack edits leave bowls, paper, glass and display pixels unchanged and undo once',()=>{
 const doc=productionProject('independence');for(const n of[27,31,46,54,57,106,107,114])doc.assets['asset-'+n]=model(n);
 const e=new Engine(doc),before=structuredClone(e.project),changes=Object.fromEntries(['wovenLight','cottonWhite','bookCloth','fabric','fabricEdge'].map(r=>[s[r],{color:'#bc2562',surface:'fabric',roughness:.95}]));
 const result=commit(e,[{op:'definePalette',name:'cloth proof',materials:changes},{op:'palette',name:'cloth proof'}]);assert.equal(result.modifiedVoxels,0);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.styles,before.styles);
 for(const id of Object.keys(e.project.materials)){assert.equal(e.project.materials[id].solid,before.materials[id].solid);assert.equal(e.project.materials[id].category,before.materials[id].category);if(!changes[id])assert.deepEqual(e.project.materials[id],before.materials[id]);}
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.palettes,before.palettes);
});

test('new semantic role allocation respects occupied foreign IDs and rolls back the complete creation',async()=>{
 const doc=productionProject('foreign slots');for(const r of['ceramicTeal','wovenLight','glassEtch','polymerDark','bottleAmber'])delete doc.styles.yunshan[r];
 for(const id of[77,78,80,81,89])doc.materials[id]={...doc.materials[1],id,name:'user stone '+id,color:'#ac34bc'};
 const rows=parseCatalogCSV(await readFile(new URL('../projects/catalog/city-assets.csv',import.meta.url),'utf8')).filter(r=>['LIFE-046','LIFE-054','LIFE-096'].includes(r.id));doc.catalog={sourceName:'test',importedAt:'test',entries:Object.fromEntries(rows.map(r=>[r.id,r]))};
 const e=new Engine(doc),before=structuredClone(e.project),commands=rows.map(r=>({op:'produceCatalogAsset',catalogId:r.id,id:r.id}));
 assert.throws(()=>commit(e,[...commands,{op:'material',id:1,properties:{roughness:-1}}]));assert.deepEqual(e.project,before);
 commit(e,commands);for(const id of[77,78,80,81,89])assert.deepEqual(e.project.materials[id],before.materials[id]);
 const mapped=e.project.styles.yunshan;assert.notEqual(mapped.ceramicTeal,77);assert.equal(e.project.materials[mapped.ceramicTeal].category,'ceramic');assert.equal(e.project.materials[mapped.bottleAmber].category,'glass');
 for(const[,id]of new Grid(e.project.assets['LIFE-046'].chunks).cells())assert.equal(e.project.materials[id].category,'ceramic');
 commit(e,[{op:'undo'}]);assert.deepEqual(e.project.assets,before.assets);assert.deepEqual(e.project.materials,before.materials);assert.deepEqual(e.project.styles,before.styles);
});

test('corrected assignments survive native and GLB export including food and ink categories',async()=>{
 const doc=productionProject('roundtrip');for(const n of[46,94,96,106])doc.assets['asset-'+n]=model(n);const e=new Engine(doc),original=structuredClone(doc);commit(e,referenceFinishCommands(e.project));
 assert.deepEqual(e.project.assets,original.assets);for(const[id,m]of Object.entries(original.materials)){assert.equal(e.project.materials[id].solid,m.solid);assert.equal(e.project.materials[id].category,m.category);}
 const directory=await mkdtemp(path.join(os.tmpdir(),'yunshan-classification-'));
 try{await exportProject(e.project,directory);const native=JSON.parse(await readFile(path.join(directory,'voxels.ysvox.json'),'utf8'));validateProject(native);assert.deepEqual(native.assets,original.assets);assert.deepEqual(native.styles,original.styles);
  const glb=await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).read(path.join(directory,'visual.glb'));
  for(const r of ['ceramicWhite','ceramicTeal','fish','fishPale','fishEye','bottleAmber','polymer','bookCover','bookCloth','paperSheet','inkTeal']){const m=glb.getRoot().listMaterials().find(m=>m.getExtras().voxelMaterialId===s[r]);assert.ok(m,r);assert.equal(m.getExtras().materialCategory,doc.materials[s[r]].category);assert.deepEqual(m.getExtras().materialRoles,['yunshan.'+r]);}
 }finally{await rm(directory,{recursive:true,force:true});}
});
