import {heldContactGroups} from './lib/held-audit';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import {productionProject} from '../src/production/style';
import {m001RefinementIds} from '../src/production/reference-refinement';
import {kitchenRefinementIds} from '../src/production/kitchen-refinement';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {refinementFinishCommands} from '../src/production/refinement-finish';
import {Engine,validateProject} from '../src/core/engine';
import {parseCatalogCSV} from '../src/core/catalog';
import {assetBoundsM,geometryData,geometryKind} from '../src/core/sky';
import {Grid} from '../src/core/grid';
import {displayMesh} from '../src/core/mesh';
import {architectureClosed,architectureComponents} from './lib/architecture-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {exportProject} from '../src/export/exporter';
import {outfitHash as hash} from '../src/production/outfit-components';
import {layoutAtlasGallery} from '../src/production/gallery-layout';
import type {Project,Command} from '../src/core/types';
const sheet=process.argv[2]??'M001';assert.ok(['M001','M002'].includes(sheet),'Expected M001 or M002');
const referenceRefinementIds=sheet==='M001'?m001RefinementIds:kitchenRefinementIds;
await mkdir('work/'+sheet.toLowerCase()+'-refinement',{recursive:true});
const run='refinement-'+new Date().toISOString().replace(/\D/g,'').slice(0,14),root='artifacts/atlas/'+run;
await mkdir(root+'/baselines',{recursive:true});
const priorText=await readFile('projects/atlas-production-index.json','utf8'),index=JSON.parse(priorText),previousLatest=await readFile('artifacts/atlas/latest.json','utf8');
await writeFile(root+'/previous-index.json',priorText);await writeFile(root+'/previous-latest.json',previousLatest);
const refs=JSON.parse(await readFile('projects/reference-atlas/index.json','utf8')),catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex'),files:any[]=[],models:any[]=[],io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);
const gallery=productionProject(sheet+' · 参考精修第一轮');
for(const id of referenceRefinementIds){
 const before=index.entries.find((r:any)=>r.id===id),ref=refs.entries.find((r:any)=>r.id===id),originalBytes=await readFile('projects/'+before.file),original:Project=JSON.parse(originalBytes.toString()),old=original.assets[before.assetId];
 assert.equal(hash(geometryData(old)),before.sha256);await writeFile(root+'/baselines/'+id+'.ysvox.json',originalBytes);
 const p=productionProject(sheet+' · '+id+' · 参考精修');p.catalog={sourceName:'city-assets.csv',importedAt:new Date().toISOString(),entries:{[id]:structuredClone(catalog[id])}};
 const e=new Engine(p);commit(e,[{op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}}]);commit(e,[...referenceFinishCommands(e.project),...refinementFinishCommands(e.project,sheet)]);
 const a=e.project.assets[id.toLowerCase()];assert.equal((a.source!.refinement as any).baselineGeometrySHA256,before.sha256,'Retained baseline differs from recipe '+id);
 (a.source!.refinement as any).retainedBaseline={file:before.file,assetId:before.assetId,nativeSHA256:sha(originalBytes),geometrySHA256:before.sha256};
 const bounds=assetBoundsM(a)!,closure=architectureClosed(a),attachments=nativeIslandAttachments(a);assert.ok(closure.every(c=>c.closed&&c.oriented));assert.ok(attachments.every(c=>c.attached));const contactGroups=heldContactGroups({...a,meshes:architectureComponents(a).map((m,i)=>({...m,name:i+':'+m.name}))},e.project.materials);assert.equal(contactGroups.length,(a.source!.refinement as any).expectedContactGroups??1,id+' component contact graph');validateProject(e.project);
 const native=JSON.stringify(e.project),file=run+'-'+id.toLowerCase()+'.ysvox.json';await writeFile('projects/'+file,native);files.push({file,bytes:Buffer.byteLength(native),sha256:sha(native)});
 const exported=await exportProject(e.project,root+'/exports/'+id,a.id),glb=await io.read(exported.directory+'/visual.glb'),positions=glb.getRoot().listMeshes().flatMap(m=>m.listPrimitives().map(p=>p.getAttribute('POSITION')!.getArray()!)),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const ps of positions)for(let k=0;k<ps.length;k++){lo[k%3]=Math.min(lo[k%3],ps[k]);hi[k%3]=Math.max(hi[k%3],ps[k]);}for(let k=0;k<3;k++){assert.equal(lo[k],Math.fround(bounds.min[k]));assert.equal(hi[k],Math.fround(bounds.max[k]));}
 const round:Project=JSON.parse(await readFile(exported.directory+'/voxels.ysvox.json','utf8'));validateProject(round);assert.deepEqual(round.assets,e.project.assets);assert.deepEqual(round.styles,e.project.styles);
 const exportFiles=[];for(const f of exported.files){const b=await readFile(exported.directory+'/'+f);exportFiles.push({file:'exports/'+id+'/'+f,bytes:b.length,sha256:sha(b)});}
 const record={...before,file,assetId:a.id,revision:4,representation:geometryKind(a),voxels:new Grid(a.chunks).count,triangles:displayMesh(a,e.project.materials).reduce((n,b)=>n+b.indices.length/3,0),cellSizeM:a.cellSize,sha256:hash(geometryData(a)),boundsM:bounds,note:sheet+'第一轮参考精修候选；连续倒角/曲面、独立最小块件和真实纹理。旧母版另存；人工美术验收未完成。'};
 Object.assign(before,record);models.push({...record,baseline:(a.source!.refinement as any).retainedBaseline,closure,attachments,contactGroups,ports:a.ports,exportFiles,glbBytes:exported.glbBytes});
 gallery.assets[a.id]=structuredClone(a);gallery.materials=structuredClone(e.project.materials);gallery.styles=structuredClone(e.project.styles);gallery.instances[a.id+'-display']={id:a.id+'-display',assetId:a.id,name:a.name,position:[0,0,0],rotation:0,parent:null};
 console.log(JSON.stringify({id,triangles:record.triangles,nativeFasteners:record.voxels,components:closure.length,exports:exportFiles.length}));
}
layoutAtlasGallery(gallery);validateProject(gallery);const galleryFile=run+'-'+sheet.toLowerCase()+'-gallery.ysvox.json',galleryText=JSON.stringify(gallery);await writeFile('projects/'+galleryFile,galleryText);files.push({file:galleryFile,bytes:Buffer.byteLength(galleryText),sha256:sha(galleryText)});
const priorStudy=index.studies.find((s:any)=>s.id===sheet+'-gallery');if(priorStudy)index.studies.push({...priorStudy,id:sheet+'-baseline-gallery-'+run,name:sheet+' · 精修前母版留档',group:'参考精修历史'});index.studies=index.studies.filter((s:any)=>s.id!==sheet+'-gallery');index.studies.push({id:sheet+'-gallery',name:sheet+' · 12件参考精修',file:galleryFile,assetIds:Object.keys(gallery.assets),note:'实际资产等比例陈列；墙装/吊装母版的陈列位置不是安装示范。',group:'参考精修'});index.run=run;index.createdAt=new Date().toISOString();
await writeFile(root+'/index.json',JSON.stringify(index,null,2));
const report={kind:'reference-refinement',phase:sheet+'-first-refinement-pass',run,evidence:root,out:root,createdAt:index.createdAt,counts:{references:793,referenceCandidates:index.entries.length,refinedThisRun:12,newIndependentMasters:0,retainedBaselines:12,accepted:0},files,models,previousConversionRun:JSON.parse(previousLatest).run};
await writeFile(root+'/production.json',JSON.stringify(report,null,2));await writeFile('work/'+sheet.toLowerCase()+'-refinement/production-location.json',JSON.stringify({run,root}));
// Publish the new library pointers only after every actual native/GLB pair has passed.
await writeFile('projects/atlas-production-index.json.tmp',JSON.stringify(index));await rename('projects/atlas-production-index.json.tmp','projects/atlas-production-index.json');await writeFile('artifacts/atlas/latest.json',JSON.stringify(report,null,2));console.log(JSON.stringify({run,models:models.length,files:files.length,status:'produced-and-export-readback-passed'}));
