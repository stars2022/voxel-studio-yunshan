import type {Asset,Project} from '../core/types';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {outfitHash} from './outfit-components';

/** A palette instance of an existing purpose, never a new logical material role. */
export function scopedLegacyFinish(p:Project,parent:Asset,id:string,role:'wall'|'roof',styleName:string,color:string,preferred:number,sourceCatalogId:string){
 const base=p.styles.yunshan,from=base[role],source=p.materials[from];if(!source)throw new Error('缺失真实材质用途 '+role);
 let style=p.styles[styleName];
 if(style){
  if(Object.keys(style).length!==Object.keys(base).length||Object.entries(base).some(([key,value])=>key!==role&&style[key]!==value)||!p.materials[style[role]]||p.materials[style[role]].solid!==source.solid||p.materials[style[role]].category!==source.category)throw new Error('独立用途外观已被不兼容映射占用');
 }else{
  if(Object.keys(base).length>512||Object.keys(p.materials).length>=4096)throw new Error('保留既有材质和样式数量上限');
  let next=preferred;if(p.materials[next]){next=1;while(p.materials[next]&&next<=65535)next++;}if(next>65535)throw new Error('没有可用材质ID');
  p.materials[next]={...structuredClone(source),id:next,name:source.name+' · '+styleName,color};style={...base,[role]:next};p.styles[styleName]=style;
 }
 const to=style[role],a=structuredClone(parent),g=new Grid(a.chunks);for(const[v,m]of g.cells())if(m===from)g.set(v,to);a.chunks=g.serialize();
 for(const mesh of a.meshes??[])if(mesh.material===from)mesh.material=to;
 for(const range of (a.source?.componentIndexRanges??[])as {material:number}[])if(range.material===from)range.material=to;
 a.id=id;a.source={...a.source,kind:'assembly-derived-component',notCatalogMaster:true,sourceAssetId:parent.id,sourceCatalogId,baseCatalogIds:[...new Set([sourceCatalogId,...(parent.source?.baseCatalogIds??[])as string[]])],sourceGeometrySHA256:outfitHash(geometryData(parent)),materialRoleStyle:styleName,style:styleName,materialDerivation:{role,from,to,style:styleName,authoredColor:color,originalRGBBound:false,originalSeedMappingBound:false,geometryChanged:false}};delete a.source.catalogId;
 return a;
}
