import type {Command,Project} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {materialAppearance} from '../../src/core/material-appearance';
import {referenceFinishes} from '../../src/production/reference-finish';
/** Apply purpose finishes while retaining explicit scoped colour/roughness choices. */
export function catalogVariantFinishCommands(p:Project):Command[]{
 const used=new Set<number>();for(const a of Object.values(p.assets)){for(const[,m]of new Grid(a.chunks).cells())used.add(m);for(const m of a.meshes??[])used.add(m.material);}
 const base=p.styles.yunshan,roles=new Map(Object.entries(base).map(([r,m])=>[m,r])),scoped=new Set<number>();
 for(const[name,style]of Object.entries(p.styles))if(['catalog-palette-','character-palette-','face-atlas-'].some(prefix=>name.startsWith(prefix)))for(const[role,id]of Object.entries(style))if(id!==base[role]){roles.set(id,role);scoped.add(id);}
 const managed=[...used].filter(id=>roles.has(id));if(managed.length>512)throw new Error('实际外观包超过512項');
 const flat=Object.fromEntries(managed.map(id=>[id,materialAppearance(p.materials[id])])),reference=structuredClone(flat);
 for(const id of managed){const role=roles.get(id)!,finish=referenceFinishes[role],overrides:any={};if(scoped.has(id)){const original=materialAppearance(p.materials[base[role]]),actual=materialAppearance(p.materials[id]);for(const key of Object.keys(actual)as (keyof typeof actual)[])if(JSON.stringify(original[key])!==JSON.stringify(actual[key]))overrides[key]=actual[key];}if(finish)Object.assign(reference[id],{opacity:1,emissive:'#000000',intensity:0,...finish,...overrides});}
 return[...(p.palettes['原始素色']?[]:[{op:'definePalette',name:'原始素色',materials:flat}as Command]),{op:'definePalette',name:'参数变体素色',materials:flat},{op:'definePalette',name:'参考材质试作',materials:reference},{op:'palette',name:'参考材质试作'}];
}
