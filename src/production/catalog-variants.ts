import {characterPaletteIds} from './character-palette-spec';
import {makeCharacterPalette} from './character-palettes';
import type {Project} from '../core/types';
import {buildingVariantIds} from './building-variant-spec';
import {makeBuildingVariant} from './building-variants';
import {makeRoofWallVariant} from './roof-wall-variants';
import {roofWallVariantIds} from './roof-wall-variant-spec';
import {makeLegacyVariant} from './legacy-variants';
import {legacyVariantIds} from './legacy-variant-spec';
import {makeAgeVariant} from './age-variants';

export function makeCatalogVariant(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 return buildingVariantIds.includes(catalogId)?makeBuildingVariant(p,catalogId,id,name,params):roofWallVariantIds.includes(catalogId)?makeRoofWallVariant(p,catalogId,id,name,params):legacyVariantIds.includes(catalogId)?makeLegacyVariant(p,catalogId,id,name,params):characterPaletteIds.includes(catalogId)?makeCharacterPalette(p,catalogId,id,name,params):makeAgeVariant(p,catalogId,id,name,params);
}
