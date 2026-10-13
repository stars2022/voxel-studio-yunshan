import type {Project,Command} from '../core/types';
export function refinementFinishCommands(p:Project,sheet='M001'):Command[]{
 const finishes:Record<string,Record<string,unknown>>={
  wood:{color:'#4b3528',roughness:.60,surfaceScale:.18,surfaceStrength:.48,surfaceRotation:0},
  woodEdge:{color:'#60422e',roughness:.55,surfaceScale:.18,surfaceStrength:.46,surfaceRotation:0},
  metal:{color:'#33383c',roughness:.34,metalness:.82,surfaceScale:.18,surfaceStrength:.18},
  trim:{color:'#4a5359',roughness:.35,metalness:.75},
  bronze:{color:'#bd8433',roughness:.30,metalness:.85},
  stone:{color:'#bcb6a6',roughness:.79,surfaceScale:.23,surfaceStrength:.24},
  fabric:{color:'#5c818c',surfaceScale:.48,surfaceStrength:.60},
  fabricEdge:{color:'#4c6b76',surfaceScale:.4,surfaceStrength:.55},
  wovenLight:{color:'#d4cbb1',surface:'fabric',surfaceScale:.48,surfaceStrength:.55},
  polymer:{color:'#c7c7bd',roughness:.52},polymerDark:{color:'#42535d',roughness:.45},
  glass:sheet==='M002'||sheet==='M003'?{color:'#839ca8',roughness:.16,metalness:.05,opacity:.33}:{color:'#fff0cc',roughness:.13,metalness:0,opacity:.2},
  warm:{color:'#ffdf9d',emissive:'#ffbe60',intensity:2.8},
  lightCore:{color:'#fff9da',emissive:'#ffe6a4',intensity:4.5},
  mirrorGlass:{color:'#a5b0b0',roughness:.10,metalness:.96},
  screen:{color:'#142d33',intensity:0,emissive:'#000000'},
  displayGlyph:{color:'#47bbc5',intensity:0,emissive:'#000000'}
 };
 if(sheet==='M003')Object.assign(finishes,{wood:{...finishes.wood,surfaceScale:.10,surfaceStrength:.35},woodEdge:{...finishes.woodEdge,surfaceScale:.10,surfaceStrength:.35},ceramicTeal:{color:'#9ea993',roughness:.40},ceramicWhite:{color:'#cbc6b9',roughness:.32,surfaceStrength:.12},cottonWhite:{color:'#ded9cd',surface:'fabric',surfaceScale:.15,surfaceStrength:.5},safetyMetal:{color:'#b83e38',roughness:.42,metalness:.65}});
 if(sheet==='M004')Object.assign(finishes,{wood:{...finishes.wood,surfaceScale:.10,surfaceStrength:.35},woodEdge:{...finishes.woodEdge,surfaceScale:.10,surfaceStrength:.35},enamel:{color:'#667074',roughness:.55,metalness:.55,surfaceStrength:.16},rigidClear:{color:'#c7d4d5',opacity:.26,roughness:.22,metalness:0},webbing:{color:'#456f84',roughness:.85,surface:'fabric',surfaceScale:.13,surfaceStrength:.50},cottonWhite:{color:'#d5d0c2',surface:'fabric',surfaceScale:.17,surfaceStrength:.40},inkTeal:{color:'#41697b',roughness:.9,intensity:0,emissive:'#000000'},polymerRed:{color:'#942f2b',roughness:.64,metalness:0}});
 return Object.entries(finishes).map(([role,properties])=>{const id=p.styles.yunshan[role];if(!id||!p.materials[id])throw Error('Missing actual purpose '+role);return{op:'material',id,properties} as Command;});
}
