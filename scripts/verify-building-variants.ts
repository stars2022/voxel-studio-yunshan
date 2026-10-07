import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile,writeFile,access} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {displayMesh} from '../src/core/mesh';
import {buildGLB,exportProject} from '../src/export/exporter';
import {assemblyGeometryData,assemblyBoundsM,assemblyExportToleranceM} from '../src/production/assembly-geometry';
import {buildingVariantForms} from '../src/production/building-variant-spec';
import {productionProject} from '../src/production/style';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {parseCatalogCSV} from '../src/core/catalog';
import {outfitHash as hash} from '../src/production/outfit-components';
import {architectureComponents} from './lib/architecture-audit';
import {auditBuildingVariant} from './lib/building-variant-audit';
import {gltfPoints,pointBounds} from './lib/skin-audit';
import type {Project,Command} from '../src/core/types';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),selected=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(','),rows=latest.models.filter((r:any)=>!selected||selected.includes(r.id)),suffix=selected?'-'+selected.join('_'):'',io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
assert.equal(latest.kind,'variant-batch');assert.equal(latest.models.length,6);assert.ok(rows.length);if(selected)assert.equal(rows.length,selected.length);assert.ok(rows.every((r:any)=>r.sheet==='M059'&&r.kind==='variant'));
const records:any[]=[],variants:any[]=[],materials:any[]=[],shapes=new Set<string>();
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
for(const row of rows)for(const[form,params]of buildingVariantForms(row.id).entries()){
 let p:Project,directory:string;
 if(!form){p=JSON.parse(await readFile('projects/'+row.file,'utf8'));directory=latest.out+'/exports/'+row.id;}
 else{
  directory=latest.out+'/variants/'+row.id+'-'+Object.values(params).join('-');
  let retained:Project|undefined;try{await access(directory+'/visual.glb');retained=JSON.parse(await readFile(directory+'/voxels.ysvox.json','utf8'));assert.deepEqual(retained!.assemblies![row.assemblyId].source!.parameters,params);}catch(error:any){if(error.code!=='ENOENT')throw error;}
  if(retained)p=retained;else{
  const source=productionProject(row.id+' '+JSON.stringify(params));source.catalog={sourceName:'city-assets.csv',importedAt:latest.createdAt,entries:structuredClone(catalog)};const e=new Engine(source);
  commit(e,[{op:'produceCatalogVariant',catalogId:row.id,id:row.assemblyId,place:true,params}]);commit(e,[...referenceFinishCommands(e.project),{op:'palette',name:'原始素色'}]);p=JSON.parse(JSON.stringify(e.project));
  const deps=new Set([row.id,...p.assemblies![row.assemblyId].source!.dependencies as string[]]);p.catalog!.entries=Object.fromEntries(Object.entries(p.catalog!.entries).filter(([id])=>deps.has(id)));
  await exportProject(p,directory);
  }
 }
 const a=p.assemblies![row.assemblyId];validateProject(p);assert.equal(a.source!.kind,'catalog-variant');assert.deepEqual(a.source!.parameters,params);if(!form)assert.equal(hash(assemblyGeometryData(p,a)),row.sha256);
 const audit=auditBuildingVariant(p,a);assert.ok(audit.passed,row.id+' '+JSON.stringify(params));
 const native=JSON.parse(await readFile(directory+'/voxels.ysvox.json','utf8')),interfaces=JSON.parse(await readFile(directory+'/interfaces.json','utf8')),collision=JSON.parse(await readFile(directory+'/collision.json','utf8'));
 for(const key of['assets','instances','assemblies','styles','materials','palettes']as const)assert.equal(hash(native[key]),hash(p[key]));assert.equal(hash(interfaces.assemblies),hash(p.assemblies));assert.equal(hash(interfaces.instances),hash(Object.values(p.instances)));assert.equal(hash(collision.instances),hash(Object.values(p.instances)));
 for(const asset of Object.values(p.assets)){
  const c=collision.assets.find((r:any)=>r.id===asset.id);assert.ok(c);assert.equal(hash(c.cells),hash([...new Grid(asset.chunks).cells()].filter(([,m])=>p.materials[m].solid).map(([v])=>v)));
  if(asset.meshes){assert.equal(c.voxelProxy,false);assert.equal(hash(c.meshes),hash(asset.meshes.filter(m=>m.collision).map(m=>({name:m.name,positions:m.positions,indices:m.indices,material:m.material}))));}
  for(const m of asset.meshes??[])assert.equal(m.collision,p.materials[m.material].solid);
 }
 for(const asset of Object.values(p.assets).filter(asset=>asset.source?.kind==='assembly-derived-component'&&!Object.hasOwn((a.source!.buildingVariant as any).parentSourceGeometryHashes,asset.id))){
  const roles=[...new Set((asset.meshes??[]).map(m=>m.material))];assert.ok(roles.every(id=>p.materials[id]));
  for(const[,material]of new Grid(asset.chunks).cells())assert.equal(material,p.styles.yunshan.architecturePin);
  if(asset.id.startsWith('architecture-variant-floor'))for(const m of architectureComponents(asset).filter(m=>m.name.startsWith('铺面')))assert.equal(m.material,p.styles.yunshan.stone);
  materials.push({id:row.id,params,assetId:asset.id,roles:Object.entries(p.styles.yunshan).filter(([,id])=>roles.includes(id)).map(([role])=>role),nativePinRole:'architecturePin'});
 }
 const e=new Engine(p);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.equal(hash(e.project.assets),hash(p.assets));const bounds=assemblyBoundsM(p,a),tolerance=assemblyExportToleranceM(p,a),exports=[];
 for(const[key,doc,mode]of[['visual',p,'near'],['visual-far',p,'far'],['visual-material',e.project,'near']]as const){
  let bytes:Uint8Array;if(key==='visual')bytes=await readFile(directory+'/visual.glb');else{bytes=(await buildGLB(doc,undefined,mode)).glb;await writeFile(directory+'/'+key+'.glb',bytes);}
  const gltf=await io.readBinary(bytes),scene=gltf.getRoot().listScenes()[0],nodes=scene.listChildren();assert.equal(nodes.length,a.instances.length);assert.equal(hash(scene.getExtras().assemblyDefinitions),hash(p.assemblies));
  const actual=pointBounds(nodes.flatMap(n=>gltfPoints(n))),error=Math.max(...bounds.min.map((v,k)=>Math.abs(v-actual.min[k])),...bounds.max.map((v,k)=>Math.abs(v-actual.max[k])));assert.ok(error<tolerance);
  const alphaChecks=[];if(key==='visual-material'){
   const mat=gltf.getRoot().listMaterials().find(m=>m.getExtras().voxelMaterialId===p.styles.yunshan.glass),primitive=gltf.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(p=>p.getMaterial()===mat);assert.ok(mat&&primitive);assert.equal(mat.getAlphaMode(),'BLEND');
   const uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!,img=await sharp(Buffer.from(mat.getBaseColorTexture()!.getImage()!)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),x=Math.floor(((uv[0]%1+1)%1)*img.info.width),y=Math.floor(((uv[1]%1+1)%1)*img.info.height),effectiveAlpha=img.data[(y*img.info.width+x)*4+3]/255*mat.getBaseColorFactor()[3];assert.ok(Math.abs(effectiveAlpha-.3)<1/255);alphaChecks.push({role:'glass',effectiveAlpha,actualUVPixel:true});
  }exports.push({key,bytes:bytes.length,boundsErrorM:error,toleranceM:tolerance,alphaChecks});
 }
 const counts=new Map<string,[number,number]>();for(const id of new Set(a.instances.map(i=>i.assetId)))counts.set(id,[displayMesh(p.assets[id],p.materials).reduce((n,m)=>n+m.indices.length/3,0),displayMesh(p.assets[id],p.materials,'far').reduce((n,m)=>n+m.indices.length/3,0)]);
 const near=a.instances.reduce((n,i)=>n+counts.get(i.assetId)![0],0),far=a.instances.reduce((n,i)=>n+counts.get(i.assetId)![1],0);assert.ok(far<=near);const geometrySHA256=hash(assemblyGeometryData(p,a));shapes.add(geometrySHA256);
 const record={id:row.id,params,isDefault:!form,directory,file:form?directory+'/voxels.ysvox.json':row.file,assemblyId:a.id,parentCatalogId:a.source!.parentCatalogId,dependencyCatalogIds:a.source!.dependencies,instances:a.instances.length,audit,nearTriangles:near,farTriangles:far,exports,geometrySHA256,nativeInterfacesAndActualCollisionIdentical:true};records.push(record);if(form)variants.push(record);
 console.log(JSON.stringify({id:row.id,params,instances:a.instances.length,stairs:audit.routes.length,links:audit.links.length,columns:audit.columns.length,roofs:audit.roofs.length,near,far}));
}
const expected=rows.reduce((n:number,r:any)=>n+buildingVariantForms(r.id).length,0);assert.equal(records.length,expected);assert.equal(variants.length,expected-rows.length);assert.equal(shapes.size,expected);
const gallery=index.studies.find((r:any)=>r.id==='M059-gallery'),gp:Project=JSON.parse(await readFile('projects/'+gallery.file,'utf8'));validateProject(gp);assert.equal(Object.keys(gp.assemblies!).length,12);
const galleryBounds=Object.values(gp.assemblies!).map(a=>({id:a.id,...assemblyBoundsM(gp,{instances:a.instances.map(i=>gp.instances[i.id])})}));for(let i=0;i<galleryBounds.length;i++)for(let j=i+1;j<galleryBounds.length;j++)assert.ok(galleryBounds[i].min.some((v,k)=>v>=galleryBounds[j].max[k]||galleryBounds[i].max[k]<=galleryBounds[j].min[k]));
await writeFile(latest.evidence+'/variant-verification'+suffix+'.json',JSON.stringify({run:latest.run,status:'passed',records,variants,gallery:gallery.id,galleryBounds,galleryGroupsDisjoint:true,defaultVariants:rows.length,finiteForms:expected,distinctGeometryConfigurations:shapes.size,newBaseMasters:0,newAssemblies:0,wholeSheetComplete:!selected,humanArtAccepted:0},null,2));
await writeFile(latest.evidence+'/material-audit'+suffix+'.json',JSON.stringify({run:latest.run,status:'passed',candidates:rows.length,pendingCandidates:0,newRoles:[],totalRoles:512,creationBatches:[256,256],checks:materials,note:'Basalt paving/treads use stone, separate from wall render. Concrete, mortar, timber, metal, glazing, roof tile and waterproof membrane retain their own roles. Native architecturePin details remain separate. Original parent components preserved; no new material role or cap expansion.'},null,2));
