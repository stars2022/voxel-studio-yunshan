import type {Project,Asset,Material} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
export function variantAppearance(p:Project,key:string,changes:Record<string,Partial<Material>>){
 const name='catalog-palette-'+key,base=p.styles.yunshan;
 if(!p.styles[name]){const style={...base};for(const[role,appearance]of Object.entries(changes)){const original=p.materials[base[role]];if(!original)throw new Error('Missing semantic purpose '+role);let id=2400+parseInt(hash([key,role]).slice(0,4),16)%20000;while(p.materials[id])id++;if(id>65535||Object.keys(p.materials).length>=4096)throw new Error('Material budget exceeded');p.materials[id]={...structuredClone(original),...appearance,id,category:original.category,solid:original.solid,name:original.name+' · '+key};style[role]=id;}p.styles[name]=style;}
 const style=p.styles[name];for(const[role,id]of Object.entries(base)){if(!(role in changes)&&style[role]!==id)throw new Error('Unrelated purpose altered');const m=p.materials[style[role]],old=p.materials[id];if(!m||m.category!==old.category||m.solid!==old.solid)throw new Error('Invalid appearance material');}
 return name;
}
export function remapVariant(a:Asset,p:Project,styleName:string,roles:Record<string,string>={}){
 const base=p.styles.yunshan,style=p.styles[styleName],mapping:Record<number,number>={};for(const[role,id]of Object.entries(base)){const target=style[roles[role]??role];if(!target)throw new Error('Missing target purpose '+role);if(target!==id)mapping[id]=target;}
 const old=hash(geometryData(a)),g=new Grid(a.chunks);for(const[v,m]of g.cells())if(mapping[m])g.set(v,mapping[m]);a.chunks=g.serialize();for(const m of a.meshes??[])if(mapping[m.material])m.material=mapping[m.material];
 return{sourceGeometrySHA256:old,mapping,style:styleName,purposeCorrections:roles};
}
