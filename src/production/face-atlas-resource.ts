import {faceAtlasRoles,validateFaceAtlas,type FaceAtlas} from '../core/face-atlas';
import type {Asset,Project} from '../core/types';
import {geometryData} from '../core/sky';
import {outfitHash as hash} from './outfit-components';

export const faceAtlasResourceId='source-char-023-face-atlas';
export function faceAtlasDescriptor(p:Project):FaceAtlas{
 const base=p.styles.yunshan,name='face-atlas-char-023';let style=p.styles[name];
 if(!style){const source=p.materials[base.sparseHair];if(!source||source.solid||source.category!=='hair')throw new Error('面孔灰鬓缺少实际毛发用途');if(Object.keys(base).length>512||Object.keys(p.materials).length>=4096)throw new Error('保留材质和用途上限');let id=1800;if(p.materials[id]){id=1;while(p.materials[id]&&id<=65535)id++;}if(id>65535)throw new Error('没有可用材质ID');p.materials[id]={...structuredClone(source),id,color:'#92938d',name:source.name+' · CHAR-023灰鬓'};p.styles[name]=style={...base,sparseHair:id};}
 if(Object.keys(style).length!==Object.keys(base).length||Object.entries(base).some(([r,id])=>r!=='sparseHair'&&style[r]!==id)||style.sparseHair===base.sparseHair)throw new Error('面孔图谱样式被不兼容映射占用');
 const descriptor:FaceAtlas={version:1,width:192,height:16,design:'authored-six-faces-v1',materials:Object.fromEntries(faceAtlasRoles.map(r=>[r,style[r]]))as FaceAtlas['materials']};validateFaceAtlas(descriptor,p.materials);return descriptor;
}
/** Material swatch carrier only: zero voxels, no physical model or base-master count. */
export function ensureFaceAtlasResource(p:Project){
 const descriptor=faceAtlasDescriptor(p),old=p.assets[faceAtlasResourceId];
 if(old){if(old.source?.kind!=='catalog-material'||old.source.catalogId!=='CHAR-023'||hash(geometryData(old))!==old.source.materialResourceGeometrySHA256||JSON.stringify(old.meshes?.[0].faceAtlas)!==JSON.stringify(descriptor))throw new Error('共享面孔父图谱已被不兼容编辑');return old;}
 const a:Asset={id:faceAtlasResourceId,name:'CHAR-023 · 六格共享面孔材质图谱',version:1,category:'template',cellSize:.005,origin:[0,0,0],chunks:{},parts:[],ports:[],openings:[],meshes:[{name:'材质预览载体（非模型母版）',material:descriptor.materials.skinSurface,collision:false,positions:[0,0,0,0,.16,0,1.92,.16,0,1.92,0,0],normals:[0,0,-1,0,0,-1,0,0,-1,0,0,-1],uvs:[0,1,0,0,1,0,1,1],indices:[0,1,2,0,2,3],faceAtlas:descriptor}],source:{kind:'catalog-material',catalogId:'CHAR-023',catalogType:'材质贴图',notCatalogBase:true,descriptor,previewCarrierOnly:true,physical:false,originalPixelsProvided:false,designAuthority:'authored from192×16six-cell contract; original citizen-appearance.ts unavailable',originalAgeMoodControllerBound:false}};
 a.source!.materialResourceGeometrySHA256=hash(geometryData(a));p.assets[a.id]=a;return a;
}
