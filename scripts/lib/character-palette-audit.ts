import assert from 'node:assert/strict';
import type {Assembly,Project} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {assemblyBoundsM} from '../../src/production/assembly-geometry';
import {characterPaletteSpec} from '../../src/production/character-palette-spec';

export function auditCharacterPalette(p:Project,a:Assembly){
 const d=a.source!.characterPalette as any,spec=characterPaletteSpec(String(a.source!.catalogId),a.source!.parameters as Record<string,string|number>),base=p.styles.yunshan,style=p.styles[d.style];assert.equal(d.color,spec.definition.color);assert.deepEqual(d.roles,spec.definition.roles);assert.equal(d.originalSeedOrRoleBinding,false);assert.equal(a.source!.parentCatalogId,spec.parentCatalogId);assert.equal(Object.keys(base).length,512);assert.deepEqual(Object.keys(style),Object.keys(base));
 const mapping=new Map<number,number>(d.roles.map((role:string)=>[base[role],style[role]])),reverse=new Map([...mapping].map(([a,b])=>[b,a]));
 for(const[role,from]of Object.entries(base))if(!d.roles.includes(role))assert.equal(style[role],from);
 for(const role of d.roles){const old=p.materials[base[role]],next=p.materials[style[role]];assert.notEqual(old.id,next.id);assert.equal(next.color,d.color);assert.equal(next.category,old.category);assert.equal(next.solid,false);assert.equal(next.intensity,0);assert.equal(next.emissive,'#000000');}
 const components=d.derivatives.map((row:any,j:number)=>{const original=p.assets[row.sourceAssetId],installed=p.assets[row.installedAssetId],restored=structuredClone(installed),actual=new Grid(installed.chunks),old=new Grid(original.chunks);assert.equal(hash(geometryData(original)),row.sourceGeometrySHA256);assert.equal(a.instances[j].assetId,installed.id);assert.equal(actual.count,old.count);let mappedCells=0,mappedMeshes=0;
  const grid=new Grid();for(const[v,m]of actual.cells()){const from=reverse.get(m)??m;grid.set(v,from);assert.equal(old.get(v),from);if(reverse.has(m))mappedCells++;}restored.chunks=grid.serialize();for(const mesh of restored.meshes??[])if(reverse.has(mesh.material)){mesh.material=reverse.get(mesh.material)!;mappedMeshes++;}
  assert.equal(hash(geometryData(restored)),hash(geometryData(original)));for(const field of['origin','cellSize','parts','ports','openings','rig']as const)assert.deepEqual(installed[field],original[field]);assert.equal(row.changed,mappedCells+mappedMeshes>0);
  return{sourceAssetId:original.id,installedAssetId:installed.id,unchangedShapeAndRig:true,nativeCells:actual.count,mappedCells,mappedMeshes,changed:row.changed};
 });
 if(spec.parentKind==='assembly'){const parent=d.retainedParentAssembly as Assembly;assert.equal(parent.instances.length,9);assert.equal(a.instances.length,parent.instances.length);for(const[j,i]of parent.instances.entries()){assert.deepEqual(a.instances[j].position,i.position);assert.equal(a.instances[j].rotation,i.rotation);assert.equal(d.derivatives[j].sourceAssetId,i.assetId);assert.equal(hash(geometryData(p.assets[i.assetId])),d.parentSourceGeometryHashes[i.assetId]);}assert.equal(components.filter((r:any)=>r.changed).length,5,'Actual head, two hands and two feet share one skin purpose');assert.deepEqual(assemblyBoundsM(p,a),assemblyBoundsM(p,parent));}
 else{assert.equal(a.instances.length,1);assert.equal(hash(geometryData(p.assets[d.parentAssetId])),d.parentGeometrySHA256);assert.equal(d.derivatives[0].sourceAssetId,d.parentAssetId);assert.ok(components[0].changed);}
 return{passed:true,catalogId:a.source!.catalogId,parameters:a.source!.parameters,family:d.family,sourceRGB:d.color,roles:d.roles,components,actualPurposeInstanceIds:d.roles.map((r:string)=>style[r]),sameGeometryAfterExactInverseRemap:true,parentRetained:true,independentPalette:true,originalRuntimeBound:false};
}
