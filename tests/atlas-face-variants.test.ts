import {auditFaceVariant} from '../scripts/lib/face-variant-audit';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength,KHRMaterialsUnlit} from '@gltf-transform/extensions';
import sharp from 'sharp';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {geometryData} from '../src/core/sky';
import {faceAtlasPixels,faceAtlasRolePixels,faceAtlasRoles,validateFaceAtlas} from '../src/core/face-atlas';
import {parseCatalogCSV} from '../src/core/catalog';
import type {Project,Command} from '../src/core/types';
import {productionProject} from '../src/production/style';
import {makeFaceVariant} from '../src/production/face-variants';
import {faceVariantIds} from '../src/production/face-variant-spec';
import {faceAtlasResourceId,ensureFaceAtlasResource} from '../src/production/face-atlas-resource';
import {characterPaletteFinishCommands} from '../src/production/character-palette-finish';
import {outfitHash as hash} from '../src/production/outfit-components';
import {architectureClosed} from '../scripts/lib/architecture-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {buildGLB} from '../src/export/exporter';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('six shared face cells');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};
const all=()=>{const p=project();for(const id of faceVariantIds){const a=makeFaceVariant(p,id,id.toLowerCase(),id);p.assemblies??={};p.assemblies[a.id]=a;for(const i of a.instances)p.instances[i.id]={...i,position:[(Number(id.slice(-3))-24)*.3,...i.position.slice(1)]as [number,number,number]};}validateProject(p);return p;};

test('One192×16RGBAresource holds6distinct32×16age/moodcells; skin, eye, lip, eyebrow and grey temple purposes remain independent',()=>{
 const p=project(),a=ensureFaceAtlasResource(p),d=a.meshes![0].faceAtlas!,pixels=faceAtlasPixels(d,p.materials),roles=faceAtlasRolePixels(),pixelRole=(tile:number,x:number,y:number)=>faceAtlasRoles[roles[y*192+tile*32+x]];
 assert.equal(pixels.width,192);assert.equal(pixels.height,16);assert.equal(pixels.data.length,12288);assert.equal(pixels.transparent,false);assert.equal(new Grid(a.chunks).count,0);assert.equal(a.source!.kind,'catalog-material');assert.equal(a.source!.notCatalogBase,true);
 const tiles=Array.from({length:6},(_,t)=>hash(Array.from({length:16},(_,y)=>[...pixels.data.slice((y*192+t*32)*4,(y*192+t*32+32)*4)])));assert.equal(new Set(tiles).size,6);
 for(let tile=0;tile<6;tile++){assert.equal(pixelRole(tile,10,8),'eyePupil');assert.equal(pixelRole(tile,15,0),'skinSurface');assert.equal(pixelRole(tile,15,tile<3?13:12),'skinLip');assert.equal(pixelRole(tile,2,6),tile%3===1?'sparseHair':tile%3===0?'hairMass':'skinSurface');}
 assert.notEqual(pixelRole(0,12,7),pixelRole(3,12,7));assert.equal(p.materials[d.materials.sparseHair].color,'#92938d');assert.equal(new Set(Object.values(d.materials)).size,9);assert.equal(Object.keys(p.styles.yunshan).length,512);
 const invalid=structuredClone(d);invalid.materials.eyeWhite=p.styles.yunshan.wall;assert.throws(()=>validateFaceAtlas(invalid,p.materials));
});

test('All6facecells retain3actual independent historical heads, unchanged closed continuous geometry and native5mmears; old facial cells can be restored exactly',async()=>{
 const p=all(),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8'));
 for(const a of Object.values(p.assemblies!)){
  assert.ok(auditFaceVariant(p,a).passed);
  const d=a.source!.faceAtlasVariant as any,old=p.assets[d.headSourceAssetId],head=p.assets[d.installedHeadAssetId],change=head.source!.faceAtlasDerivation as any,restored=structuredClone(head),g=new Grid(restored.chunks);
  assert.equal(hash(geometryData(old)),d.headSourceGeometrySHA256);assert.equal(head.cellSize,.005);assert.equal(head.parts.length,3);assert.ok(head.parts.filter(p=>p.id!=='root').every(part=>part.name.startsWith('耳内')));assert.ok(new Grid(head.chunks).count>0);assert.ok(change.removedCells.length>100);
  for(const row of change.removedCells){assert.equal(g.get(row.cell),0);g.set(row.cell,row.material);}const serial=g.serialize();restored.chunks=Object.fromEntries(change.originalChunkOrder.map((key:string)=>[key,serial[key]]));const mesh=restored.meshes!.find(m=>m.name===change.faceMesh)!;mesh.uvs=change.originalUV;delete mesh.faceAtlas;assert.equal(hash(geometryData(restored)),hash(geometryData(old)));
  const closed=architectureClosed(head),native=nativeIslandAttachments(head);assert.ok(closed.length&&closed.every(r=>r.closed&&r.oriented));assert.ok(native.length&&native.every(r=>r.attached));
  const face=head.meshes!.find(m=>m.faceAtlas)!;for(let k=0;k<face.uvs.length;k+=2){assert.ok(face.uvs[k]>d.tile/6&&face.uvs[k]<(d.tile+1)/6);assert.ok(face.uvs[k+1]>0&&face.uvs[k+1]<1);}
  const row=index.entries.find((r:any)=>r.id===d.head),file=d.head==='CHAR-068'?'projects/production/atlas-20261004093013/variants/CHAR-068/02/voxels.ysvox.json':'projects/'+row.file,saved:Project=JSON.parse(await readFile(file,'utf8')),actual=Object.values(saved.assets).find(x=>x.source?.catalogId===d.head)!;assert.ok(actual);assert.equal(hash(geometryData(actual)),hash(geometryData(old)));
 }
 assert.equal(Object.values(p.assets).filter(a=>a.source?.catalogId==='CHAR-023').length,1);assert.equal(new Set(Object.values(p.assemblies!).map(a=>(a.source!.faceAtlasVariant as any).headSourceAssetId)).size,3);
});

test('Actual6headGLBembeds one shared lit face PNG and correctUVcells; role recolour changes real texels only and undo restores exact source',async()=>{
 const p=all(),io=new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength,KHRMaterialsUnlit]),build=async(p:Project)=>io.readBinary(new Uint8Array((await buildGLB(p)).glb)),g=await build(p),primitives=g.getRoot().listScenes()[0].listChildren().flatMap(n=>n.getMesh()!.listPrimitives()).filter(p=>!!p.getMaterial()!.getExtras().faceAtlas);
 assert.equal(primitives.length,6);assert.equal(new Set(primitives.map(p=>p.getMaterial()!.getBaseColorTexture())).size,1);const texture=primitives[0].getMaterial()!.getBaseColorTexture()!,raw=await sharp(texture.getImage()!).ensureAlpha().raw().toBuffer(),descriptor=p.assets[faceAtlasResourceId].meshes![0].faceAtlas!;assert.deepEqual(raw,Buffer.from(faceAtlasPixels(descriptor,p.materials).data));
 for(const[i,primitive]of primitives.entries()){const material=primitive.getMaterial()!,uv=primitive.getAttribute('TEXCOORD_0')!.getArray()!;assert.equal(material.getExtension('KHR_materials_unlit'),null);assert.equal(material.getBaseColorTextureInfo()!.getMagFilter(),9728);assert.equal((material.getExtras().sourceMaterialIds as number[]).length,9);for(let k=0;k<uv.length;k+=2)assert.ok(uv[k]>i/6&&uv[k]<(i+1)/6);}
 const e=new Engine(p),before=hash(p.assets),skin=descriptor.materials.skinSurface;commit(e,[{op:'definePalette',name:'testskin',materials:{[skin]:{color:'#123456'}}},{op:'palette',name:'testskin'}]);assert.equal(hash(e.project.assets),before);const changed=await build(e.project),newPNG=changed.getRoot().listTextures().find(t=>t.getExtras().catalogId==='CHAR-023')!,next=await sharp(newPNG.getImage()!).ensureAlpha().raw().toBuffer();assert.deepEqual([...next.slice(0,4)],[18,52,86,255]);assert.notDeepEqual(next,raw);
 const rolePixels=faceAtlasRolePixels();for(let k=0;k<rolePixels.length;k++)if(faceAtlasRoles[rolePixels[k]]!=='skinSurface')assert.deepEqual(next.subarray(k*4,k*4+4),raw.subarray(k*4,k*4+4));commit(e,[{op:'undo'}]);assert.equal(hash(e.project.assets),before);assert.deepEqual(e.project.materials,p.materials);
 commit(e,characterPaletteFinishCommands(e.project));assert.equal(e.project.materials[descriptor.materials.sparseHair].color,'#92938d');assert.equal(hash(e.project.assets),before);
});

test('Official face commands preserve occupied gray-hairID, reject wrongcells/types and rollback; singleundo removes whole generated resource graph',()=>{
 const p=project();p.materials[1800]={...p.materials[p.styles.yunshan.skinSurface],id:1800,name:'foreign material',color:'#123456'};const original=structuredClone(p),e=new Engine(p);commit(e,faceVariantIds.map((catalogId,i)=>({op:'produceCatalogVariant',catalogId,id:'face'+i,place:true,params:{faceCell:i}})));assert.deepEqual(e.project.materials[1800],original.materials[1800]);assert.notEqual(e.project.styles['face-atlas-char-023'].sparseHair,1800);
 for(const command of [{op:'produceCatalogVariant',catalogId:'CHAR-024',id:'bad',params:{faceCell:5}},{op:'produceCatalogVariant',catalogId:'CHAR-024',id:'bad',params:{garment:2}},{op:'produceCatalogAsset',catalogId:'CHAR-023',id:'bad'},{op:'produceCatalogVariant',catalogId:'CHAR-023',id:'bad'}]){const before=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:1800,properties:{color:'#ffffff'}},command]));assert.equal(hash(e.project),before);}
 const bad=structuredClone(e.project),a=Object.values(bad.assets).find(a=>a.source?.kind==='assembly-derived-component')!;a.meshes!.find(m=>m.faceAtlas)!.collision=true;assert.throws(()=>validateProject(bad));
 commit(e,[{op:'undo'}]);for(const key of ['assets','assemblies','instances','materials','styles','palettes','catalog']as const)assert.equal(hash(e.project[key]??null),hash(original[key]??null));
});
