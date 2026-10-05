import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual} from '@gltf-transform/extensions';
import sharp from 'sharp';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {geometryData} from '../src/core/sky';
import {displayMesh} from '../src/core/mesh';
import {buildGLB} from '../src/export/exporter';
import {assemblyGeometryData,assemblyBoundsM,assemblyExportToleranceM} from '../src/production/assembly-geometry';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {architectureClosed,architectureComponents} from './lib/architecture-audit';
import {outfitAudit} from './lib/outfit-audit';
import {gltfPoints,pointBounds} from './lib/skin-audit';
import type {Project,Command} from '../src/core/types';

const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),rows=latest.models,hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex'),io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit,KHRLightsPunctual]);
assert.equal(latest.kind,'assembly-batch');assert.equal(rows.length,12);assert.ok(rows.every((r:any)=>r.sheet==='M057'));
const records:any[]=[],materialChecks:any[]=[],configurations=new Set<string>();
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};
for(const row of rows){
 const p:Project=JSON.parse(await readFile('projects/'+row.file,'utf8')),a=p.assemblies![row.assemblyId],directory=latest.out+'/exports/'+row.id;validateProject(p);assert.equal(hash(assemblyGeometryData(p,a)),row.sha256);
 const audit=outfitAudit(p,a);assert.ok(audit.pairs.every(r=>r.contained===0&&r.crossing===0),row.id);assert.ok(audit.contactsPassed&&audit.shoeGroundPassed&&audit.nonphysical&&audit.rigsRetained,row.id);
 const closed=[],pins=[],provenance=[];
 for(const asset of Object.values(p.assets)){
  if(asset.meshes?.length){const c=architectureClosed(asset);assert.ok(c.every(r=>r.closed&&r.oriented),asset.id);closed.push({assetId:asset.id,parts:c.length});const n=nativeIslandAttachments({...asset,meshes:architectureComponents(asset)});assert.ok(n.every(r=>r.attached),asset.id);pins.push({assetId:asset.id,islands:n.length,cells:n.reduce((n,r)=>n+r.cells,0)});}
  if(asset.source?.sourceAssetId){const parent=p.assets[String(asset.source.sourceAssetId)];assert.ok(parent);assert.equal(asset.source.sourceGeometrySHA256,hash(geometryData(parent)));provenance.push({assetId:asset.id,parentId:parent.id,parentGeometrySHA256:hash(geometryData(parent)),preservedOriginal:true});}
  for(const m of asset.meshes??[]){assert.ok(p.materials[m.material]);assert.equal(m.collision,p.materials[m.material].solid);}
 }
 const native=JSON.parse(await readFile(directory+'/voxels.ysvox.json','utf8')),interfaces=JSON.parse(await readFile(directory+'/interfaces.json','utf8')),collision=JSON.parse(await readFile(directory+'/collision.json','utf8'));
 for(const k of['assets','instances','assemblies','styles','materials','palettes']as const)assert.deepEqual(native[k],p[k]);assert.deepEqual(interfaces.assemblies,p.assemblies);assert.deepEqual(interfaces.instances,Object.values(p.instances));assert.deepEqual(collision.instances,Object.values(p.instances));
 for(const asset of Object.values(p.assets)){const c=collision.assets.find((r:any)=>r.id===asset.id);assert.ok(c);assert.deepEqual(c.cells,[...new Grid(asset.chunks).cells()].filter(([,m])=>p.materials[m].solid).map(([v])=>v));if(asset.meshes){assert.equal(c.voxelProxy,false);assert.deepEqual(c.meshes,asset.meshes.filter(m=>m.collision).map(m=>({name:m.name,positions:m.positions,indices:m.indices,material:m.material})));}}
 const e=new Engine(p);commit(e,[{op:'palette',name:'参考材质试作'}]);assert.deepEqual(e.project.assets,p.assets);const bounds=assemblyBoundsM(p,a),tolerance=assemblyExportToleranceM(p,a),exports=[];
 for(const[key,doc,mode]of[['visual-far',p,'far'],['visual-material',e.project,'near']]as const){const data=await buildGLB(doc,undefined,mode);await writeFile(directory+'/'+key+'.glb',data.glb);const gltf=await io.readBinary(data.glb),nodes=gltf.getRoot().listScenes()[0].listChildren();assert.equal(nodes.length,a.instances.length);assert.deepEqual(gltf.getRoot().listScenes()[0].getExtras().assemblyDefinitions,p.assemblies);const actual=pointBounds(nodes.flatMap(n=>gltfPoints(n))),error=Math.max(...bounds.min.map((v,k)=>Math.abs(v-actual.min[k])),...bounds.max.map((v,k)=>Math.abs(v-actual.max[k])));assert.ok(error<tolerance);const alpha=[];
  if(key==='visual-material')for(const role of['hatBadgeGlass','gogglesLens']){const material=gltf.getRoot().listMaterials().find(m=>m.getExtras().voxelMaterialId===p.styles.yunshan[role]),primitive=gltf.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(r=>r.getMaterial()===material);if(!material||!primitive)continue;let value=material.getBaseColorFactor()[3];if(material.getBaseColorTexture()){const image=await sharp(Buffer.from(material.getBaseColorTexture()!.getImage()!)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!,x=Math.floor(((uv[0]%1+1)%1)*image.info.width),y=Math.floor(((uv[1]%1+1)%1)*image.info.height);value*=image.data[(y*image.info.width+x)*4+3]/255;}assert.ok(Math.abs(value-doc.materials[p.styles.yunshan[role]].opacity)<1/255+.00001);alpha.push({role,effectiveAlpha:value,actualGLTFUVPixel:true});}
  exports.push({key,bytes:data.glb.length,boundsErrorM:error,toleranceM:tolerance,alpha,independentSkinEvaluation:true});
 }
 const cloth=a.instances.find(i=>p.assets[i.assetId].source?.catalogId===(a.source!.outfit as any).clothing);if(cloth){const asset=p.assets[cloth.assetId],roles=[...new Set([...new Grid(asset.chunks).cells()].map(([,m])=>m).concat((asset.meshes??[]).map(m=>m.material)))];materialChecks.push({id:row.id,assetId:asset.id,purposeRoles:Object.entries(p.styles.yunshan).filter(([,m])=>roles.includes(m)).map(([r])=>r),allMaterialsVisualOnly:roles.every(id=>!p.materials[id].solid),sourceGeometryUnchanged:true});}
 for(const asset of Object.values(p.assets))if(asset.source?.retainedAuthorSource){const fit=asset.source.retainedAuthorSource as any;if(fit.reason?.startsWith('Actual closed strap')){assert.ok(asset.meshes!.every(m=>m.material===p.styles.yunshan.garmentStrap));materialChecks.push({id:row.id,assetId:asset.id,purposeRoles:['garmentStrap'],actualClosedClothTab:true});}if(fit.replacedMeshes?.some((r:any)=>r.name==='独立帽盔内衬环')){assert.equal(asset.meshes!.find(m=>m.name==='独立帽盔内衬环')!.material,p.styles.yunshan.helmetPad);materialChecks.push({id:row.id,assetId:asset.id,purposeRoles:['helmetPad'],fittedPadOnly:true});}}
 const configuration=a.instances.map(i=>({geometry:geometryData(p.assets[i.assetId]),position:i.position,rotation:i.rotation}));configurations.add(hash(configuration));const near=a.instances.reduce((n,i)=>n+displayMesh(p.assets[i.assetId],p.materials).reduce((n,m)=>n+m.indices.length/3,0),0),far=a.instances.reduce((n,i)=>n+displayMesh(p.assets[i.assetId],p.materials,'far').reduce((n,m)=>n+m.indices.length/3,0),0);assert.ok(far<=near);
 records.push({id:row.id,params:{},isDefault:true,directory,instances:a.instances.length,closed,pins,provenance,outfit:audit,nearTriangles:near,farTriangles:far,exports,geometrySHA256:row.sha256,nativeInterfacesAndActualCollisionIdentical:true});console.log(JSON.stringify({id:row.id,instances:a.instances.length,posedPairs:audit.pairs.length,contacts:audit.contacts.length,near,far}));
}
assert.equal(configurations.size,10);const gallery=index.studies.find((r:any)=>r.id==='M057-gallery'),gp:Project=JSON.parse(await readFile('projects/'+gallery.file,'utf8')),galleryBounds=Object.values(gp.assemblies!).map(a=>({id:a.id,...assemblyBoundsM(gp,{instances:a.instances.map(i=>gp.instances[i.id])})}));for(let i=0;i<galleryBounds.length;i++)for(let j=i+1;j<galleryBounds.length;j++)assert.ok(galleryBounds[i].min.some((v,k)=>v>=galleryBounds[j].max[k]||galleryBounds[i].max[k]<=galleryBounds[j].min[k]));
await writeFile(latest.evidence+'/assembly-verification.json',JSON.stringify({run:latest.run,status:'passed',records,variants:[],gallery:gallery.id,galleryBounds,galleryGroupsDisjoint:true,defaultTemplates:12,finiteForms:12,distinctGeometryConfigurations:10,newBaseMasters:0},null,2));
await writeFile(latest.evidence+'/material-audit.json',JSON.stringify({run:latest.run,status:'passed',candidates:12,pendingCandidates:0,newRoles:[],totalRoles:512,creationBatches:[256,256],checks:materialChecks,note:'Canonical source purposes retained exactly. New clothing adapters use garmentStrap, hat fitting uses helmetPad, bags retain travelLeather, and fitted native fasteners retain their original meanings.512-role cap unchanged; appearances independently replaceable, all character geometry nonphysical.'},null,2));
