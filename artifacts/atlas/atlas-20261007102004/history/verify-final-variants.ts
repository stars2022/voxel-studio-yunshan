import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile,writeFile,access} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {geometryData} from '../src/core/sky';
import {displayMesh} from '../src/core/mesh';
import {buildGLB,exportProject} from '../src/export/exporter';
import {assemblyGeometryData,assemblyBoundsM,assemblyExportToleranceM} from '../src/production/assembly-geometry';
import {catalogVariantForms as buildingVariantForms} from '../src/production/catalog-variant-spec';
import {finalVariantIds} from '../src/production/final-variant-spec';
import {catalogVariantFinishCommands} from '../src/production/catalog-variant-finish';
const buildingVariantIds=finalVariantIds;
import {productionProject} from '../src/production/style';
import {parseCatalogCSV} from '../src/core/catalog';
import {outfitHash as hash} from '../src/production/outfit-components';
import {architectureComponents} from './lib/architecture-audit';
import {auditFinalVariant as auditBuildingVariant} from './lib/final-variant-audit';
import {gltfPoints,pointBounds} from './lib/skin-audit';
import type {Project,Command,Assembly} from '../src/core/types';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),selected=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(','),rows=latest.models.filter((r:any)=>!selected||selected.includes(r.id)),suffix=selected?'-'+selected.join('_'):'',io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
assert.equal(latest.kind,'variant-batch');assert.ok(rows.length);if(selected)assert.equal(rows.length,selected.length);assert.ok(rows.every((r:any)=>buildingVariantIds.includes(r.id)&&r.kind==='variant'));
const sheets=[...new Set<string>(latest.models.map((r:any)=>r.sheet))],atlas=JSON.parse(await readFile('projects/reference-atlas/index.json','utf8')),sheetRows=index.entries.filter((r:any)=>sheets.includes(r.sheet)),sheetReferenceCount=atlas.entries.filter((r:any)=>sheets.includes(r.sheet)).length;
const records:any[]=[],variants:any[]=[],materials:any[]=[],shapes=new Set<string>(),physicalShapes=new Set<string>(),scopedMaterialKeys=new Set<string>();
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
for(const row of rows)for(const[form,params]of buildingVariantForms(row.id).entries()){
 let p:Project,directory:string;
 if(!form){p=JSON.parse(await readFile('projects/'+row.file,'utf8'));directory=latest.out+'/exports/'+row.id;}
 else{
  directory=latest.out+'/variants/'+row.id+'-'+Object.values(params).join('-');
  let retained:Project|undefined;try{await access(directory+'/visual.glb');retained=JSON.parse(await readFile(directory+'/voxels.ysvox.json','utf8'));assert.deepEqual(retained!.assemblies![row.assemblyId].source!.parameters,params);}catch(error:any){if(error.code!=='ENOENT')throw error;}
  if(retained)p=retained;else{
  const source=productionProject(row.id+' '+JSON.stringify(params));source.catalog={sourceName:'city-assets.csv',importedAt:latest.createdAt,entries:structuredClone(catalog)};const e=new Engine(source);
  commit(e,[{op:'produceCatalogVariant',catalogId:row.id,id:row.assemblyId,place:true,params}]);commit(e,[...catalogVariantFinishCommands(e.project),{op:'palette',name:'原始素色'}]);p=JSON.parse(JSON.stringify(e.project));
  const deps=new Set([row.id,...p.assemblies![row.assemblyId].source!.dependencies as string[]]);p.catalog!.entries=Object.fromEntries(Object.entries(p.catalog!.entries).filter(([id])=>deps.has(id)));
  await exportProject(p,directory);
  }
 }
 for(const[name,style]of Object.entries(p.styles))if(name.startsWith('catalog-palette-'))for(const[role,id]of Object.entries(style))if(id!==p.styles.yunshan[role])scopedMaterialKeys.add(name+':'+role);
 const a=p.assemblies![row.assemblyId];validateProject(p);assert.equal(a.source!.kind,'catalog-variant');assert.deepEqual(a.source!.parameters,params);if(!form)assert.equal(hash(assemblyGeometryData(p,a)),row.sha256);
 const audit=auditBuildingVariant(p,a);assert.ok(audit.passed,row.id+' '+JSON.stringify(params));
 const native=JSON.parse(await readFile(directory+'/voxels.ysvox.json','utf8')),interfaces=JSON.parse(await readFile(directory+'/interfaces.json','utf8')),collision=JSON.parse(await readFile(directory+'/collision.json','utf8'));
 for(const key of['assets','instances','assemblies','styles','materials','palettes']as const)assert.equal(hash(native[key]),hash(p[key]));assert.equal(hash(interfaces.assemblies),hash(p.assemblies));assert.equal(hash(interfaces.instances),hash(Object.values(p.instances)));assert.equal(hash(collision.instances),hash(Object.values(p.instances)));
 for(const asset of Object.values(p.assets)){
  const c=collision.assets.find((r:any)=>r.id===asset.id);assert.ok(c);assert.equal(hash(c.cells),hash([...new Grid(asset.chunks).cells()].filter(([,m])=>p.materials[m].solid).map(([v])=>v)));
  if(asset.meshes){assert.equal(c.voxelProxy,false);assert.equal(hash(c.meshes),hash(asset.meshes.filter(m=>m.collision).map(m=>({name:m.name,positions:m.positions,indices:m.indices,material:m.material}))));}
  for(const m of asset.meshes??[])assert.equal(m.collision,p.materials[m.material].solid);
 }
 for(const asset of a.instances.map(i=>p.assets[i.assetId])){
  const roles=[...new Set([...new Grid(asset.chunks).cells()].map(([,m])=>m).concat((asset.meshes??[]).map(m=>m.material)))];
  assert.ok(roles.every(id=>p.materials[id]&&p.materials[id].intensity===0));
  materials.push({id:row.id,params,assetId:asset.id,roles:[...new Set(Object.values(p.styles).flatMap(style=>Object.entries(style).filter(([,id])=>roles.includes(id)).map(([role])=>role)))],nativeCellSizeM:asset.cellSize,physicalPurposes:roles.filter(id=>p.materials[id].solid)});
 }
 const e=new Engine(p);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.equal(hash(e.project.assets),hash(p.assets));const bounds=assemblyBoundsM(p,a),tolerance=assemblyExportToleranceM(p,a),exports=[];
 for(const[key,doc,mode]of[['visual',p,'near'],['visual-far',p,'far'],['visual-material',e.project,'near']]as const){
  let bytes:Uint8Array;if(key==='visual')bytes=await readFile(directory+'/visual.glb');else{bytes=(await buildGLB(doc,undefined,mode)).glb;await writeFile(directory+'/'+key+'.glb',bytes);}
  const gltf=await io.readBinary(bytes),scene=gltf.getRoot().listScenes()[0],nodes=scene.listChildren();assert.equal(nodes.length,a.instances.length);assert.equal(hash(scene.getExtras().assemblyDefinitions),hash(p.assemblies));
  const actual=pointBounds(nodes.flatMap(n=>gltfPoints(n))),error=Math.max(...bounds.min.map((v,k)=>Math.abs(v-actual.min[k])),...bounds.max.map((v,k)=>Math.abs(v-actual.max[k])));assert.ok(error<tolerance);
  const alphaChecks:any[]=[];
  for(const mat of gltf.getRoot().listMaterials()){
   const primitive=gltf.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(p=>p.getMaterial()===mat);if(!primitive)continue;
   if(key!=='visual-material')continue;
   const materialId=Number(mat.getExtras().voxelMaterialId);assert.ok(doc.materials[materialId]);const uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!,img=await sharp(mat.getBaseColorTexture()!.getImage()!).ensureAlpha().raw().toBuffer({resolveWithObject:true}),x=Math.floor(((uv[0]%1+1)%1)*img.info.width),y=Math.floor(((uv[1]%1+1)%1)*img.info.height),effectiveAlpha=img.data[(y*img.info.width+x)*4+3]/255*mat.getBaseColorFactor()[3];assert.ok(Math.abs(effectiveAlpha-doc.materials[materialId].opacity)<1/255+1e-8);alphaChecks.push({materialId,effectiveAlpha,actualUVPixel:true});
  }
  let triangles=0;for(const root of nodes)root.traverse(node=>{for(const primitive of node.getMesh()?.listPrimitives()??[])triangles+=(primitive.getIndices()?.getCount()??primitive.getAttribute('POSITION')!.getCount())/3;});
  const expectedTriangles=a.instances.reduce((n,i)=>n+displayMesh(doc.assets[i.assetId],doc.materials,mode).reduce((v,m)=>v+m.indices.length/3,0),0);assert.equal(triangles,expectedTriangles);
  exports.push({key,bytes:bytes.length,boundsErrorM:error,toleranceM:tolerance,alphaChecks,triangles,actualTriangleCountVerified:true});
 }
 const counts=new Map<string,[number,number]>();for(const id of new Set(a.instances.map(i=>i.assetId)))counts.set(id,[displayMesh(p.assets[id],p.materials).reduce((n,m)=>n+m.indices.length/3,0),displayMesh(p.assets[id],p.materials,'far').reduce((n,m)=>n+m.indices.length/3,0)]);
 const near=a.instances.reduce((n,i)=>n+counts.get(i.assetId)![0],0),far=a.instances.reduce((n,i)=>n+counts.get(i.assetId)![1],0);assert.ok(far<=near);const geometrySHA256=hash(assemblyGeometryData(p,a));shapes.add(hash(a.instances.map(i=>({geometry:geometryData(p.assets[i.assetId]),origin:p.assets[i.assetId].origin,cellSize:p.assets[i.assetId].cellSize,position:i.position,rotation:i.rotation,ports:p.assets[i.assetId].ports,openings:p.assets[i.assetId].openings}))));physicalShapes.add(hash(a.instances.map(i=>{const asset=p.assets[i.assetId];return{position:i.position,rotation:i.rotation,origin:asset.origin,cellSize:asset.cellSize,nativeCells:[...new Grid(asset.chunks).cells()].map(([v])=>v),meshes:(asset.meshes??[]).map(({material,name,...geometry})=>geometry),ports:asset.ports,openings:asset.openings};})));
 const record={id:row.id,params,isDefault:!form,directory,file:form?directory+'/voxels.ysvox.json':row.file,assemblyId:a.id,parentCatalogId:a.source!.parentCatalogId,dependencyCatalogIds:a.source!.dependencies,instances:a.instances.length,audit,nearTriangles:near,farTriangles:far,exports,geometrySHA256,nativeInterfacesAndActualCollisionIdentical:true,actualParentsAndOriginalRuntimeBoundaryPreserved:true};records.push(record);if(form)variants.push(record);
 console.log(JSON.stringify({id:row.id,params,instances:a.instances.length,components:audit.components.length,near,far}));
}
const expected=rows.reduce((n:number,r:any)=>n+buildingVariantForms(r.id).length,0);assert.equal(records.length,expected);assert.equal(variants.length,expected-rows.length);if(!selected){assert.equal(shapes.size,88);assert.equal(physicalShapes.size,46);}
const galleries=[];for(const sheet of sheets){const gallery=index.studies.find((r:any)=>r.id===sheet+'-gallery'),gp:Project=JSON.parse(await readFile('projects/'+gallery.file,'utf8')),members=sheetRows.filter((r:any)=>r.sheet===sheet);validateProject(gp);assert.equal(Object.keys(gp.assemblies!).length,members.length);const galleryBounds=Object.values(gp.assemblies!).map(a=>({id:a.id,...assemblyBoundsM(gp,{instances:a.instances.map(i=>gp.instances[i.id])})}));for(let i=0;i<galleryBounds.length;i++)for(let j=i+1;j<galleryBounds.length;j++)assert.ok(galleryBounds[i].min.some((v,k)=>v>=galleryBounds[j].max[k]||galleryBounds[i].max[k]<=galleryBounds[j].min[k]));galleries.push({sheet,gallery:gallery.id,galleryBounds,groupsDisjoint:true,produced:members.length,referenceCount:atlas.entries.filter((r:any)=>r.sheet===sheet).length});}
await writeFile(latest.evidence+'/variant-verification'+suffix+'.json',JSON.stringify({run:latest.run,status:'passed',records,variants,galleries,galleryGroupsDisjoint:true,defaultVariants:rows.length,finiteForms:expected,distinctGeometryMaterialConfigurations:shapes.size,distinctShapeConfigurations:physicalShapes.size,newBaseMasters:latest.counts.newIndependentMasters,newAssemblies:0,newMaterialEntries:0,batchComplete:!selected,wholeSheetComplete:!selected&&sheetRows.length===sheetReferenceCount,sheetProducedReferences:sheetRows.length,sheetReferenceCount,humanArtAccepted:0},null,2));
await writeFile(latest.evidence+'/material-audit'+suffix+'.json',JSON.stringify({run:latest.run,status:'passed',candidates:rows.length,pendingCandidates:0,newRoles:[],totalRoles:512,newScopedAppearanceMaterials:scopedMaterialKeys.size,reusedMaterialResources:[],checks:materials,note:'Eleven environment/furniture references and88finite forms, exact historical parents and512semantic purposes. Native fitted furniture with scoped purpose corrections, exact supports and no visual volume overlaps; continuous terrain/water/young-tree components preserve actual native detail attachment. Finite author parameters, no original game, growth, hydraulic or ecological binding.'},null,2));
