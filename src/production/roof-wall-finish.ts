import type {Command,Project} from '../core/types';
import {Grid} from '../core/grid';
import {materialAppearance} from '../core/material-appearance';
import {referenceFinishes} from './reference-finish';

/** Finishes for the actual retained/installed assets, including scoped wall appearances. */
export function roofWallFinishCommands(p:Project):Command[]{
 const used=new Set<number>();for(const a of Object.values(p.assets)){for(const[,m]of new Grid(a.chunks).cells())used.add(m);for(const m of a.meshes??[])used.add(m.material);}
 const roles=new Map(Object.entries(p.styles.yunshan).map(([role,id])=>[id,role])),scoped=new Set<number>();
 for(const[name,style]of Object.entries(p.styles))if(name.startsWith('wall-purpose-')){roles.set(style.wall,'wall');scoped.add(style.wall);}
 const managed=[...used].filter(id=>roles.has(id));if(managed.length>512)throw new Error('实际用途外观包超过512项；须分包');
 const flat=Object.fromEntries(managed.map(id=>[id,materialAppearance(p.materials[id])])),reference=structuredClone(flat);
 for(const id of managed){const finish=referenceFinishes[roles.get(id)!];if(finish)Object.assign(reference[id],{opacity:1,emissive:'#000000',intensity:0,...finish,...(scoped.has(id)?{color:p.materials[id].color,name:p.materials[id].name}:{})});}
 const commands:Command[]=p.palettes['原始素色']?[]:[{op:'definePalette',name:'原始素色',materials:flat}];
 return[...commands,{op:'definePalette',name:'屋顶墙面素色',materials:flat},{op:'definePalette',name:'参考材质试作',materials:reference},{op:'palette',name:'参考材质试作'}];
}
