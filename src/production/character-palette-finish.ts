import type {Command,Project} from '../core/types';
import {Grid} from '../core/grid';
import {materialAppearance} from '../core/material-appearance';
import {referenceFinishes} from './reference-finish';
/** Same-purpose palette instances retain their exact source RGB in both views. */
export function characterPaletteFinishCommands(p:Project):Command[]{
 const used=new Set<number>();for(const a of Object.values(p.assets)){for(const[,m]of new Grid(a.chunks).cells())used.add(m);for(const m of a.meshes??[]){used.add(m.material);if(m.faceAtlas)for(const id of Object.values(m.faceAtlas.materials))used.add(id);}}
 const base=p.styles.yunshan,roles=new Map(Object.entries(base).map(([r,m])=>[m,r])),scoped=new Set<number>();
 for(const[name,style]of Object.entries(p.styles))if(name.startsWith('character-palette-')||name.startsWith('face-atlas-'))for(const[role,id]of Object.entries(style))if(id!==base[role]){roles.set(id,role);scoped.add(id);}
 const managed=[...used].filter(id=>roles.has(id));if(managed.length>512)throw new Error('实际人物外观包超过512項');
 const flat=Object.fromEntries(managed.map(id=>[id,materialAppearance(p.materials[id])])),reference=structuredClone(flat);
 for(const id of managed){const finish=referenceFinishes[roles.get(id)!];if(finish)Object.assign(reference[id],{opacity:1,emissive:'#000000',intensity:0,...finish,...(scoped.has(id)?{color:p.materials[id].color,name:p.materials[id].name}:{})});}
 return[...(p.palettes['原始素色']?[]:[{op:'definePalette',name:'原始素色',materials:flat}as Command]),{op:'definePalette',name:'人物变体素色',materials:flat},{op:'definePalette',name:'参考材质试作',materials:reference},{op:'palette',name:'参考材质试作'}];
}
