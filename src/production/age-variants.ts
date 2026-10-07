import type {Asset,Project,V3} from '../core/types';
import {dirs} from '../core/types';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {makeCommunityAssembly} from './community-assemblies';
import {outfitHash} from './outfit-components';
import {ageVariantSpec} from './age-variant-spec';

/** Fit the actual child's clothed body below its unchanged head. Native details
 * remain rigid5mm islands; each island only translates by whole native cells. */
export function ageBodyHeight(source:Asset,id:string,neckY:number):Asset{
 const a=structuredClone(source),oldNeck=source.ports.find(p=>p.id==='neck')!.position[1],factor=neckY/oldNeck;
 a.id=id;a.name+=' · 年龄身高安装派生';
 for(const mesh of a.meshes??[]){for(let k=1;k<mesh.positions.length;k+=3)mesh.positions[k]*=factor;for(let k=0;k<mesh.normals.length;k+=3){const n=[mesh.normals[k],mesh.normals[k+1]/factor,mesh.normals[k+2]],length=Math.hypot(...n);mesh.normals.splice(k,3,...n.map(v=>v/length));}}
 const original=new Grid(source.chunks),remaining=new Map([...original.cells()].map(([v,m])=>[v.join(','),{v,m}])),next=new Grid(),moves:{from:V3;to:V3;material:number}[]=[],islands:{cells:number;deltaCellsY:number}[]=[];
 while(remaining.size){const first=remaining.values().next().value!,cells=[first];remaining.delete(first.v.join(','));for(let k=0;k<cells.length;k++)for(const d of dirs){const key=cells[k].v.map((n,j)=>n+d[j]).join(','),cell=remaining.get(key);if(cell){remaining.delete(key);cells.push(cell);}}
  const centreY=cells.reduce((sum,c)=>sum+c.v[1]+.5,0)/cells.length,dy=Math.round(centreY*(factor-1));islands.push({cells:cells.length,deltaCellsY:dy});
  for(const {v,m}of cells){const to:V3=[v[0],v[1]+dy,v[2]];if(next.get(to))throw new Error('年龄变体原生组件发生重叠');next.set(to,m);moves.push({from:v,to,material:m});}
 }
 a.chunks=next.serialize();for(const part of a.parts){const cells=moves.filter(c=>c.from.every((n,k)=>n>=part.region.min[k]&&n<part.region.max[k])).map(c=>c.to);if(cells.length)part.region={min:[0,1,2].map(k=>Math.min(...cells.map(v=>v[k])))as V3,max:[0,1,2].map(k=>Math.max(...cells.map(v=>v[k]))+1)as V3};}
 for(const p of a.ports)p.position[1]*=factor;
 a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[String(source.source!.catalogId)],sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,ageBodyFit:{method:'Y-only fit of independent age-specific body below unchanged head; no uniform whole-person scaling',sourceNeckM:oldNeck,targetNeckM:neckY,verticalFactor:factor,unchangedHorizontalProfile:true,nativeCellSizeM:source.cellSize,nativeIslands:islands,nativeMoves:moves},retainedBodyDetail:structuredClone(source.source!.detail)};
 return a;
}

export function makeAgeVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=ageVariantSpec(catalogId,input),d=spec.definition,b=new ArchitectureBuilder(p,id),parent=makeCommunityAssembly(p,'CHAR-001','age-retained-resident','完整保留原居民组合');
 for(const dep of parent.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add('CHAR-001');
 const originalBody=b.original(d.body,{extremities:'covered'}),head=b.original(d.head,d.headParameters),neckY=d.heightM-d.headHeightM,sourceBody=p.assets[originalBody];
 const body=Math.abs(sourceBody.ports.find(p=>p.id==='neck')!.position[1]-neckY)<1e-10?originalBody:b.asset('age-body-'+spec.parameters.ageBand+'-'+d.heightM,aid=>ageBodyHeight(sourceBody,aid,neckY));
 const bodyInstance=b.place(body,[0,0,0],0,'age-body'),headInstance=b.place(head,[0,neckY,0],0,'age-head');
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:'CHAR-001',parentKind:'assembly',parameters:spec.parameters,physical:false,notCatalogBase:true,ageVariant:{ageRangeInclusiveExclusive:d.range,sourceHeightM:d.heightM,bodyCatalogId:d.body,headCatalogId:d.head,headParameters:d.headParameters,originalBodyAssetId:originalBody,originalBodyGeometrySHA256:outfitHash(geometryData(sourceBody)),headAssetId:head,headGeometrySHA256:outfitHash(geometryData(p.assets[head])),bodyInstance,headInstance,neckY,retainedParentAssembly:parent,parentSourceGeometryHashes:Object.fromEntries([...new Set(parent.instances.map(i=>i.assetId))].map(aid=>[aid,outfitHash(geometryData(p.assets[aid]))])),authorPosture:'standing',clothing:'Existing neutral full-cover modelling suit, including mittens and socks',headAndHorizontalBodyUnscaled:true,originalAgeProfileBound:false,adultUniformScale:false,gameplayCollisionUnchanged:true,scope:'Original0.6/1/1.2/1.6/1.8mheight steps retained using independent061/062/063/064/059bodies and067/068/066heads. Only the selected age body is fitted below its unchanged head; native details translate by complete5mmcells. Exact adult001and source bodies are separately retained. This static standing neutral suit does not claim the reference seated pose, backpack/hair outfit, complete age growth, sourceCitizen identity or runtime profile binding.'}});
}
