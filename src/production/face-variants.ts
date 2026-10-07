import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import type {Asset,Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {ensureFaceAtlasResource} from './face-atlas-resource';
import {faceVariantSpec} from './face-variant-spec';
import {outfitHash as hash} from './outfit-components';
import type {FaceAtlas} from '../core/face-atlas';

export function faceHead(source:Asset,id:string,tile:number,height:number,descriptor:FaceAtlas):Asset{
 const a=structuredClone(source),g=new Grid(a.chunks),removedParts=a.parts.filter(p=>p.id!=='root'&&!p.name.startsWith('耳内')),removedCells:{cell:V3;material:number}[]=[];
 for(const[cell,material]of g.cells())if(removedParts.some(p=>cell.every((v,k)=>v>=p.region.min[k]&&v<p.region.max[k]))){removedCells.push({cell,material});g.set(cell,0);}
 a.chunks=g.serialize();a.parts=a.parts.filter(p=>!removedParts.includes(p));a.parts.find(p=>p.id==='root')!.region=g.bounds()!;const face=a.meshes!.find(m=>m.name.startsWith('独立颅'))!;if(!face||!removedCells.length||!g.count)throw new Error('面孔安装缺少真实头壳或可保留原生耳细件');
 const width=2*Math.max(...face.positions.filter((_,i)=>i%3===0).map(Math.abs)),originalUV=[...face.uvs];
 for(let i=0;i<face.positions.length/3;i++){
  const x=face.positions[i*3],y=face.positions[i*3+1],front=face.normals[i*3+2]<-.35,u=front?Math.max(.5,Math.min(31.5,(x/width+.5)*32)):.5,v=front?Math.max(.5,Math.min(15.5,(1-y/height)*16)):.5;
  face.uvs[i*2]=(tile*32+u)/192;face.uvs[i*2+1]=v/16;
 }
 face.faceAtlas=structuredClone(descriptor);a.id=id;a.name+=' · 共享面孔格'+tile;a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[String(source.source!.catalogId),'CHAR-023'],sourceAssetId:source.id,sourceGeometrySHA256:hash(geometryData(source)),originalRetained:true,faceAtlasDerivation:{tile,headHeightM:height,removedParts,removedCells,originalChunkOrder:Object.keys(source.chunks),originalRootRegion:source.parts.find(p=>p.id==='root')?.region,faceMesh:face.name,originalUV,continuousShapeUnchanged:true,retainedNativeEarCells:g.count,noOverlay:true,originalPixelsProvided:false,originalControllerBound:false}};
 return a;
}
export function makeFaceVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=faceVariantSpec(catalogId,input),d=spec.definition,b=new ArchitectureBuilder(p,id),resource=ensureFaceAtlasResource(p),descriptor=resource.meshes![0].faceAtlas!,parent=b.original(d.head,d.headParameters),head=b.asset('face-cell-'+d.tile+'-'+hash(descriptor).slice(0,12),aid=>faceHead(p.assets[parent],aid,d.tile,d.height,descriptor));b.dependencies.add('CHAR-023');b.place(head,[0,.022,0],0,'face');
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:'CHAR-023',parentKind:'material',parameters:spec.parameters,physical:false,notCatalogBase:true,faceAtlasVariant:{...d,parentResourceAssetId:resource.id,parentResourceGeometrySHA256:hash(geometryData(resource)),headSourceAssetId:parent,headSourceGeometrySHA256:hash(geometryData(p.assets[parent])),installedHeadAssetId:head,sharedAtlasDescriptor:descriptor,sourceConditions:{elderAgeAtLeast:62,childAgeBelow:18,stressedMoodBelow:35,stressedStressAbove:70,bound:false},scope:'One shared192×16RGBAatlas and six UV cells on three actual retained independent head shapes. Existing native face pixels removed explicitly, ears remain5mmnative, nose/ears/neck and closed cranial geometry preserved. Authored pixels; no original texture identity, facial animation, automatic age/mood binding or new base master.'}});
}
