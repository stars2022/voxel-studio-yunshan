import type {Project,Command} from '../../src/core/types';
export function draftFinishCommands(p:Project):Command[]{
 const finishes:Record<string,Record<string,unknown>>={
  wood:{color:'#4b3528',roughness:.60,surfaceScale:.18,surfaceStrength:.48,surfaceRotation:0},
  woodEdge:{color:'#60422e',roughness:.55,surfaceScale:.18,surfaceStrength:.46,surfaceRotation:0},
  metal:{color:'#33383c',roughness:.34,metalness:.82,surfaceScale:.18,surfaceStrength:.18},
  trim:{color:'#4a5359',roughness:.35,metalness:.75},
  bronze:{color:'#bd8433',roughness:.30,metalness:.85},
  stone:{color:'#bcb6a6',roughness:.79,surfaceScale:.23,surfaceStrength:.24},
  fabric:{color:'#5c818c',surfaceScale:.07,surfaceStrength:.42},
  fabricEdge:{color:'#4c6b76',surfaceScale:.065,surfaceStrength:.40},
  wovenLight:{color:'#d4cbb1',surface:'fabric',surfaceScale:.07,surfaceStrength:.38},
  polymer:{color:'#c7c7bd',roughness:.52},polymerDark:{color:'#42535d',roughness:.45},
  warm:{color:'#fff3c3',emissive:'#ffc96f',intensity:1.25},
  lightCore:{color:'#fff9da',emissive:'#ffe6a4',intensity:2.5},
  mirrorGlass:{color:'#a5b0b0',roughness:.10,metalness:.96},
  screen:{color:'#142d33',intensity:0,emissive:'#000000'},
  displayGlyph:{color:'#47bbc5',intensity:0,emissive:'#000000'}
 };
 return Object.entries(finishes).map(([role,properties])=>{const id=p.styles.yunshan[role];if(!id||!p.materials[id])throw Error('Missing actual purpose '+role);return{op:'material',id,properties} as Command;});
}
