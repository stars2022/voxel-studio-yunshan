import {finalVariantIds} from './final-variant-spec';
import {makeEnvironmentVariant} from './environment-variants';
import {makeFurnitureVariant} from './furniture-variants';
import {lodVariantIds} from './lod-variant-spec';
import {makeLodVariant} from './lod-variants';
import {bodyVariantIds} from './body-variant-spec';
import {makeBodyVariant} from './body-variants';
import {faceVariantIds} from './face-variant-spec';
import {makeFaceVariant} from './face-variants';
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
 return finalVariantIds.includes(catalogId)?(catalogId.startsWith('LIFE-')?makeFurnitureVariant:makeEnvironmentVariant)(p,catalogId,id,name,params):lodVariantIds.includes(catalogId)?makeLodVariant(p,catalogId,id,name,params):bodyVariantIds.includes(catalogId)?makeBodyVariant(p,catalogId,id,name,params):buildingVariantIds.includes(catalogId)?makeBuildingVariant(p,catalogId,id,name,params):roofWallVariantIds.includes(catalogId)?makeRoofWallVariant(p,catalogId,id,name,params):legacyVariantIds.includes(catalogId)?makeLegacyVariant(p,catalogId,id,name,params):characterPaletteIds.includes(catalogId)?makeCharacterPalette(p,catalogId,id,name,params):faceVariantIds.includes(catalogId)?makeFaceVariant(p,catalogId,id,name,params):makeAgeVariant(p,catalogId,id,name,params);
}
