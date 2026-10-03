import {atelierStyleCommands} from './atelier';
import type {Command,Material} from './types';

/** A reusable material library. New IDs avoid changing materials on earlier assets. */
export function atelierFinishCommands(startId=201):Command[]{
 const commands=atelierStyleCommands(startId),style=commands.pop()!,roles={...style.roles};
 const finish:Record<string,Partial<Material>>={
  stone:{name:'精修 · 墨灰玄武石',color:'#444e52',roughness:.89,metalness:0,surfaceScale:.42,surfaceStrength:.44},
  wall:{name:'精修 · 暖灰砂岩',color:'#c9c1ae',roughness:.86,metalness:0,surfaceScale:.38,surfaceStrength:.42},
  wallAlt:{name:'精修 · 砂岩切边',color:'#ddd3bf',roughness:.80,metalness:0,surfaceScale:.38,surfaceStrength:.26},
  wood:{name:'精修 · 竖纹榆木',color:'#6e4d30',roughness:.60,surfaceScale:.55,surfaceStrength:.64},
  woodAlt:{name:'精修 · 榆木收边',color:'#89643e',roughness:.65,surfaceScale:.55,surfaceStrength:.40},
  metal:{name:'精修 · 石墨烤漆铁',color:'#303c40',roughness:.52,metalness:.30,surfaceScale:.18,surfaceStrength:.19},
  trim:{name:'精修 · 铁件切边',color:'#59656a',roughness:.38,metalness:.66,surfaceScale:.18,surfaceStrength:.16},
  bronze:{name:'精修 · 拉丝黄铜五金',color:'#a88042',roughness:.38,metalness:.78,surfaceScale:.20,surfaceStrength:.20},
  roof:{name:'精修 · 深灰檐砖',color:'#3f494d',roughness:.80,metalness:0,surface:'stone',surfaceScale:.4,surfaceStrength:.35},
  roofAlt:{color:'#4d5759',roughness:.82,metalness:0,surface:'stone',surfaceScale:.4,surfaceStrength:.33},
  glass:{name:'精修 · 青灰玻璃',color:'#93c6c5',roughness:.12,metalness:0,opacity:.28,solid:false,surface:'none'},
  glassTrim:{name:'精修 · 青铜压条',color:'#4e696d',roughness:.34,metalness:.6,surfaceStrength:.13},
  energy:{name:'精修 · 青色灯条',color:'#a0dfe0',emissive:'#55cbd0',intensity:1.2,roughness:.35,metalness:0},
  warm:{name:'精修 · 暖白灯芯',color:'#ffe2ad',emissive:'#ffd18a',intensity:1.4,roughness:.6,metalness:0},
  amber:{name:'精修 · 铜质灯笼细框',color:'#b18541',emissive:'#000000',intensity:0,roughness:.4,metalness:.65,surface:'metal',surfaceStrength:.18},
  mortar:{name:'精修 · 暖灰砂浆',color:'#8e8d80',roughness:1,metalness:0,surfaceStrength:.25},
  floor:{name:'精修 · 浅色石板',color:'#c8bfaa',roughness:.8,metalness:0,surfaceStrength:.29},
  floorAlt:{color:'#d3c8b1',roughness:.84,metalness:0,surfaceStrength:.29},
  stoneAlt:{color:'#566064',roughness:.86,metalness:0,surfaceStrength:.4},
  cavity:{name:'精修 · 铁件凹槽',color:'#252d2e',roughness:.75,metalness:.25},
  leaf:{name:'精修 · 深绿成熟叶',color:'#405530',roughness:.82,metalness:0},
  leafAlt:{name:'精修 · 黄绿嫩叶',color:'#8e9c43',roughness:.8,metalness:0},
  flower:{name:'精修 · 花蕊',color:'#d4a33c',roughness:.9,metalness:0},
  soil:{name:'精修 · 培养土',color:'#483a29',roughness:1,metalness:0,surfaceScale:.09,surfaceStrength:.60}
 };
 for(const [i,c]of commands.entries()){
  const role=Object.keys(roles).find(k=>roles[k]===c.id)!;
  Object.assign(c.properties,finish[role],{surfaceSeed:19+i*13,surfaceRotation:0});
 }
 const extras:[string,number,Partial<Material>][]=[
  ['woodCross',roles.wood,{name:'精修 · 横纹榆木',surfaceRotation:90}],
  ['leafMid',roles.leaf,{name:'精修 · 中绿叶',color:'#667738'}],
  ['flowerPetal',roles.flower,{name:'精修 · 米黄花瓣',color:'#f0dba2'}],
  ['diffuser',roles.warm,{name:'精修 · 绢纸灯罩',category:'fabric',color:'#edd6a4',surface:'fabric',surfaceScale:.12,surfaceStrength:.18,roughness:.86,metalness:0,opacity:.91,emissive:'#dfb770',intensity:.2}],
  ['metalEdge',roles.metal,{name:'精修 · 柱帽折边',color:'#445155',roughness:.43}],
  ['stoneEdge',roles.wall,{name:'精修 · 石脚倒台',color:'#91988d',surfaceStrength:.25}]
 ];
 for(const [i,[role,base,changes]]of extras.entries()){
  const id=startId+24+i,properties={...commands.find(c=>c.id===base)!.properties,...changes};roles[role]=id;commands.push({op:'material',id,properties});
 }
 commands.push({op:'style',id:'atelier-finish',roles});return commands;
}
