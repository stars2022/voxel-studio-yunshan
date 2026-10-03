import type {Material} from './types';

/** Resource packs change appearance, not voxel identity or collision semantics. */
export const appearanceKeys=['name','color','roughness','metalness','opacity','emissive','intensity','surface','surfaceScale','surfaceStrength','surfaceSeed','surfaceRotation'] as const;
export function materialAppearance(m:Partial<Material>):Partial<Material>{
 return Object.fromEntries(appearanceKeys.filter(k=>m[k]!==undefined).map(k=>[k,m[k]]));
}
