import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {productionProject} from '../../src/production/style';
import {makeFaceVariant} from '../../src/production/face-variants';
import {faceVariantIds} from '../../src/production/face-variant-spec';
import {faceAtlasPixels,faceAtlasRolePixels} from '../../src/core/face-atlas';
import {ensureFaceAtlasResource,faceAtlasResourceId} from '../../src/production/face-atlas-resource';
import {parseCatalogCSV} from '../../src/core/catalog';
import {validateProject} from '../../src/core/engine';
const root='work/face-atlas';await mkdir(root,{recursive:true});const entries=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=(name:string)=>{const p=productionProject(name);p.catalog={sourceName:'catalog',importedAt:'draft',entries:structuredClone(entries)};return p;};
const gallery=project('六格共享面孔 · 草稿');
for(const [tile,id]of faceVariantIds.entries()){
 const p=project(id),a=makeFaceVariant(p,id,id.toLowerCase(),id);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);await writeFile(root+'/'+id+'.ysvox.json',JSON.stringify(p));
 const comparison=makeFaceVariant(gallery,id,id.toLowerCase(),id);gallery.assemblies??={};gallery.assemblies[a.id]=comparison;for(const i of comparison.instances)gallery.instances[i.id]={...i,position:[tile%3*.32,.022+(tile<3?.32:0),0]};
}
validateProject(gallery);await writeFile(root+'/comparison.ysvox.json',JSON.stringify(gallery));
const resource=project('CHAR-023共享材质父图谱'),a=ensureFaceAtlasResource(resource);resource.instances.preview={id:'preview',assetId:a.id,name:'six shared cells',position:[0,0,0],rotation:0,parent:null};validateProject(resource);await writeFile(root+'/CHAR-023.ysvox.json',JSON.stringify(resource));
const descriptor=resource.assets[faceAtlasResourceId].meshes![0].faceAtlas!,t=faceAtlasPixels(descriptor,resource.materials),png=await sharp(t.data,{raw:{width:192,height:16,channels:4}}).png().toBuffer();await writeFile(root+'/face-atlas-draft.png',png);await sharp(png).resize(1920,160,{kernel:'nearest'}).png().toFile(root+'/face-atlas-draft-enlarged.png');await writeFile(root+'/descriptor-draft.json',JSON.stringify({descriptor,rolePixels:[...faceAtlasRolePixels()]},null,2));
console.log(JSON.stringify({status:'draft-created',cells:6,nativeDocuments:8,sharedAtlas:[192,16]}));
