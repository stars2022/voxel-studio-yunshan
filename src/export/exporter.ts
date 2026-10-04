import {waterFlow} from '../core/water-flow';
import {Document,NodeIO} from '@gltf-transform/core';
import {KHRMaterialsEmissiveStrength} from '@gltf-transform/extensions';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {displayMesh} from '../core/mesh';
import {Grid} from '../core/grid';
import {surfacePixels} from '../core/surface';
import type {Project,Asset,Material} from '../core/types';
const rgb=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const materialRoles=(p:Project,id:number)=>Object.entries(p.styles).flatMap(([style,roles])=>Object.entries(roles).filter(([,m])=>m===id).map(([role])=>`${style}.${role}`)).sort();
export async function buildGLB(p:Project,assetId?:string,meshMode:'near'|'far'='near'){
 const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene(p.name),materials=new Map<number,any>();
 scene.setExtras({meshMode,meshSource:'native occupancy',simplification:meshMode==='far'?'same-material coplanar merges only':'chunk greedy rectangles'});
 const flowIds=new Set(Object.values(assetId?{[assetId]:p.assets[assetId]}:p.assets).flatMap(a=>waterFlow(a)?.materialIds??[]));
 const emission=doc.createExtension(KHRMaterialsEmissiveStrength);
 const sorted=Object.values(p.materials).sort((a,b)=>a.id-b.id),cols=Math.min(16,sorted.length),rows=Math.ceil(sorted.length/cols),tile=16,width=cols*tile,height=rows*tile,raw=Buffer.alloc(width*height*4);
 sorted.forEach((m,index)=>{const c=rgb(m.color).map(n=>Math.round(n*255));for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){const offset=((Math.floor(index/cols)*tile+y)*width+(index%cols*tile+x))*4;raw.set([...c,Math.round(m.opacity*255)],offset);}});
 const atlas=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer(),texture=doc.createTexture('材质色板图集').setImage(atlas).setMimeType('image/png');
 sorted.forEach(m=>{const material=doc.createMaterial(m.name).setBaseColorFactor([1,1,1,1]).setBaseColorTexture(texture).setRoughnessFactor(m.roughness).setMetallicFactor(m.metalness).setEmissiveFactor(rgb(m.emissive).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4) as [number,number,number]).setDoubleSided(m.opacity<1).setAlphaMode(m.opacity<1?'BLEND':'OPAQUE').setExtras({voxelMaterialId:m.id,materialCategory:m.category,materialRoles:materialRoles(p,m.id),emissiveIntensity:m.intensity,collisionSolid:m.solid});if(m.intensity!==1)material.setExtension('KHR_materials_emissive_strength',emission.createEmissiveStrength().setEmissiveStrength(m.intensity));materials.set(m.id,material);});
 // Bake the exact editor surface algorithm into portable textures. The colour atlas
 // remains available to engines that only need the base palette.
 const surfaceCache=new Map<string,any[]>();
 for(const m of sorted)if(m.surface&&m.surface!=='none'){
  const key=m.surface+':'+(m.surfaceStrength??.35)+':'+(m.surfaceSeed??0);let maps=surfaceCache.get(key);
  if(!maps){const pixels=surfacePixels(m.surface,m.surfaceStrength??.35,128,m.surfaceSeed??0);maps=[];for(const [name,bytes]of Object.entries({albedo:pixels.albedo,normal:pixels.normal,roughness:pixels.roughness})){
   const png=await sharp(bytes,{raw:{width:pixels.size,height:pixels.size,channels:4}}).png().toBuffer();maps.push(doc.createTexture(key+'-'+name).setImage(png).setMimeType('image/png'));
  }surfaceCache.set(key,maps);}
  const linear=rgb(m.color).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
  materials.get(m.id).setBaseColorFactor([...linear,m.opacity]).setBaseColorTexture(maps[0]).setNormalTexture(maps[1]).setMetallicRoughnessTexture(maps[2]).setExtras({voxelMaterialId:m.id,materialCategory:m.category,materialRoles:materialRoles(p,m.id),collisionSolid:m.solid,emissiveIntensity:m.intensity,surface:m.surface,surfaceScaleM:m.surfaceScale??.5,surfaceStrength:m.surfaceStrength??.35,surfaceSeed:m.surfaceSeed??0,surfaceRotation:m.surfaceRotation??0});
 }
 for(const id of flowIds){const m=p.materials[id];if(!m)throw new Error('Water flow material missing');const linear=rgb(m.color).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);materials.get(id).setBaseColorFactor([...linear,m.opacity]).setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setExtras({...materials.get(id).getExtras(),flowUV:'U downstream arc length / V signed lateral distance, metres',flowAnimated:false});}
 const assetMeshes=new Map<string,any>();
 const getMesh=(a:Asset)=>{if(assetMeshes.has(a.id))return assetMeshes.get(a.id);const mesh=doc.createMesh(a.name);const groups=new Map<number,{positions:number[],normals:number[],indices:number[],uvs:number[]}>();
  for(const b of displayMesh(a,p.materials,meshMode)){let group=groups.get(b.material);if(!group){group={positions:[],normals:[],indices:[],uvs:[]};groups.set(b.material,group);}const offset=group.positions.length/3;for(const x of b.positions)group.positions.push(x);for(const x of b.normals)group.normals.push(x);for(const x of b.uvs)group.uvs.push(x);for(const x of b.indices)group.indices.push(x+offset);}
  for(const[id,g]of groups){const i=sorted.findIndex(m=>m.id===id),u=(i%cols+.5)/cols,v=(Math.floor(i/cols)+.5)/rows;const uv=new Float32Array(g.positions.length/3*2);for(let k=0;k<uv.length;k+=2){uv[k]=u;uv[k+1]=v;}
   const mat=p.materials[id];if(mat.surface&&mat.surface!=='none'){const angle=(mat.surfaceRotation??0)*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle),scale=mat.surfaceScale??.5;for(let k=0;k<uv.length;k+=2){uv[k]=(c*g.uvs[k]+sn*g.uvs[k+1])/scale;uv[k+1]=(-sn*g.uvs[k]+c*g.uvs[k+1])/scale;}}
   if(flowIds.has(id))for(let k=0;k<uv.length;k++)uv[k]=g.uvs[k];
   const attr=(name:string,type:any,array:any)=>doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
   mesh.addPrimitive(doc.createPrimitive().setAttribute('POSITION',attr('positions','VEC3',new Float32Array(g.positions))).setAttribute('NORMAL',attr('normals','VEC3',new Float32Array(g.normals))).setAttribute('TEXCOORD_0',attr('atlasUV','VEC2',uv)).setIndices(attr('indices','SCALAR',new Uint32Array(g.indices))).setMaterial(materials.get(id)));
  }assetMeshes.set(a.id,mesh);return mesh;};
 if(assetId){const a=p.assets[assetId];if(!a)throw new Error('资产不存在');scene.addChild(doc.createNode(a.name).setMesh(getMesh(a)).setExtras({assetId:a.id,cellSizeM:a.cellSize,origin:a.origin,units:'metres',ports:a.ports}));}
 else for(const i of Object.values(p.instances)){const a=p.assets[i.assetId],angle=i.rotation*Math.PI/2;scene.addChild(doc.createNode(i.name).setMesh(getMesh(a)).setTranslation(i.position).setRotation([0,Math.sin(angle/2),0,Math.cos(angle/2)]).setExtras({assetId:a.id,instanceId:i.id,units:'metres',cellSizeM:a.cellSize,origin:a.origin,ports:a.ports}));}
 return{glb:await new NodeIO().registerExtensions([KHRMaterialsEmissiveStrength]).writeBinary(doc),atlas,atlasMap:sorted.map((m,i)=>({id:m.id,name:m.name,category:m.category,roles:materialRoles(p,m.id),rect:[i%cols*tile,Math.floor(i/cols)*tile,tile,tile],uv:[(i%cols+.5)/cols,(Math.floor(i/cols)+.5)/rows]})),width,height};
}
export async function exportProject(p:Project,directory:string,assetId?:string){
 await mkdir(directory,{recursive:true});const {glb,atlas,atlasMap,width,height}=await buildGLB(p,assetId);
 const assets=assetId?{[assetId]:p.assets[assetId]}:p.assets;
 const collision={format:'yunshan.collision',version:1,units:'metres',upAxis:'Y',assets:Object.values(assets).map(a=>({id:a.id,origin:a.origin,cellSize:a.cellSize,cells:[...new Grid(a.chunks).cells()].filter(([,m])=>p.materials[m].solid).map(([v])=>v)})),instances:assetId?[]:Object.values(p.instances)};
 const interfaces={format:'yunshan.interfaces',version:1,units:'metres',upAxis:'Y',materialRoles:p.styles,assets:Object.values(assets).map(a=>({id:a.id,name:a.name,version:a.version,origin:a.origin,cellSize:a.cellSize,ports:a.ports,parts:a.parts,openings:a.openings})),instances:assetId?[]:Object.values(p.instances)};
 await Promise.all([writeFile(path.join(directory,'visual.glb'),glb),writeFile(path.join(directory,'voxels.ysvox.json'),JSON.stringify({...p,catalog:assetId?undefined:p.catalog,assets,assemblies:assetId?{}:p.assemblies,instances:assetId?{}:p.instances,selection:assetId?{assetId,region:null,partId:null}:p.selection})),writeFile(path.join(directory,'collision.json'),JSON.stringify(collision)),writeFile(path.join(directory,'interfaces.json'),JSON.stringify(interfaces,null,2)),writeFile(path.join(directory,'atlas.png'),atlas),writeFile(path.join(directory,'atlas.json'),JSON.stringify({width,height,materials:atlasMap},null,2))]);
 return{directory,files:['visual.glb','voxels.ysvox.json','collision.json','interfaces.json','atlas.png','atlas.json'],glbBytes:glb.byteLength};
}
