import type {Asset,Project} from '../core/types';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {outfitHash} from './outfit-components';
export const wallPurposeColors={clinic:'#d7e2dc',bank:'#d2c6af',workshop:'#a9b5b5',school:'#d8cab6',fallback1:'#c2bfb2',fallback2:'#aebeb8',fallback3:'#c8b8aa',fallback4:'#b4bdc7'};
export type WallPurposeTone=keyof typeof wallPurposeColors;

/** Scoped finish: one physical purpose, independent appearance material, no global recoloring. */
export function wallPurpose(p:Project,parent:Asset,id:string,tone:WallPurposeTone){
 if(!Object.hasOwn(wallPurposeColors,tone))throw new Error('Unverified wall purpose tone');
 const base=p.styles.yunshan,from=base.wall,source=p.materials[from],styleId='wall-purpose-'+tone;
 if(!source)throw new Error('Missing actual wall material');
 let scoped=p.styles[styleId];
 if(scoped){
  if(Object.keys(scoped).length!==Object.keys(base).length||Object.entries(base).some(([r,id])=>r!=='wall'&&scoped[r]!==id)||!p.materials[scoped.wall]||p.materials[scoped.wall].category!==source.category||p.materials[scoped.wall].solid!==source.solid)throw new Error('Scoped wall style is occupied incompatibly');
 }else{
  if(Object.keys(base).length>512||Object.keys(p.materials).length>=4096)throw new Error('Existing style/material limits are retained');
  const preferred=539+Object.keys(wallPurposeColors).indexOf(tone);let next=preferred;
  if(p.materials[next]){next=1;while(p.materials[next]&&next<=65535)next++;}if(next>65535)throw new Error('No free material ID');
  p.materials[next]={...structuredClone(source),id:next,name:source.name+' · 作者用途 '+tone,color:wallPurposeColors[tone]};
  scoped={...base,wall:next};p.styles[styleId]=scoped;
 }
 const to=scoped.wall,a=structuredClone(parent),g=new Grid(a.chunks);for(const[v,m]of g.cells())if(m===from)g.set(v,to);a.chunks=g.serialize();
 for(const m of a.meshes??[])if(m.material===from)m.material=to;
 for(const r of (a.source!.componentIndexRanges??[])as {material:number}[])if(r.material===from)r.material=to;
 a.id=id;a.name='共享墙面用途 · '+tone;a.source={...a.source,kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:['BUILT-004'],parameters:{wallTone:tone},materialRoleStyle:styleId,style:styleId,sourceAssetId:parent.id,sourceGeometrySHA256:outfitHash(geometryData(parent)),materialDerivation:{role:'wall',from,to,style:styleId,authoredColor:wallPurposeColors[tone],originalRGBBound:false,originalSeedMappingBound:false,geometryChanged:false},dimensionBasis:'Exact parent geometry retained. Only wall-role IDs remap to a scoped same-purpose material; other parts and global materials remain unchanged.'};
 delete a.source.catalogId;a.source.sourceCatalogId='BUILT-004';
 return a;
}
