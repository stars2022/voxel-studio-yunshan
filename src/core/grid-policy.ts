import {Grid} from './grid';
import type {Asset,Project} from './types';
/** Native collision and declared voxel openings need a shared lattice. Visual components do not. */
export function needsNativeGrid(a:Asset,materials:Project['materials'],g=new Grid(a.chunks)){if(a.openings.length)return true;for(const[,m]of g.cells())if(materials[m].solid)return true;return false;}
