import type {Project} from '../core/types';
import {geometryData} from '../core/sky';
import {ArchitectureBuilder,roofArchitecture} from './architecture-near-assembly';
import {makeMetropolisAviation} from './metropolis-aviation';
import {outfitHash} from './outfit-components';
import {legacyVariantSpec,legacyWallColors,legacyRoofColors,type LegacyVehicleKind} from './legacy-variant-spec';
import {scopedLegacyFinish} from './scoped-legacy-finish';
import {placeLegacyRoof} from './legacy-ridge-roof';
import {placeLegacyVehicle,militaryPad} from './legacy-transport-variants';

export function makeLegacyVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=legacyVariantSpec(catalogId,input),b=new ArchitectureBuilder(p,id);
 const finish=(details:Record<string,unknown>)=>b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:spec.parentKind,parameters:spec.parameters,legacyVariant:details,originalRuntimeBound:false,notCatalogBase:true});
 if(catalogId==='BUILT-085'){
  const parent=b.original('BUILT-058'),tone=spec.parameters.legacyWallTone as keyof typeof legacyWallColors,style='legacy-wall-'+tone;
  const candidate=scopedLegacyFinish(p,p.assets[parent],'candidate','wall',style,legacyWallColors[tone],547+Object.keys(legacyWallColors).indexOf(tone),'BUILT-058');
  candidate.source!.parameters={...candidate.source!.parameters as object,legacyWallTone:tone};
  const child=b.asset('legacy-wall-'+tone+'-'+p.styles[style].wall,aid=>({...candidate,id:aid}));b.place(child,[0,0,0],0,'wall');
  return finish({parentAssetId:parent,parentGeometrySHA256:outfitHash(geometryData(p.assets[parent])),tone,scope:'Exact058native wall occupancy, openings, ports and all other purposes retained. Only wall IDs remap to eleven independent same-purpose finishes. Authored RGB, original purpose/seed color lookup unbound.'});
 }
 const parent=catalogId==='BUILT-084'?roofArchitecture(p,'BUILT-076','variant-parent-built-076-standard','完整保留单脊父组合','standard'):makeMetropolisAviation(p,spec.parentCatalogId,'variant-parent-'+spec.parentCatalogId.toLowerCase(),'完整保留交通父组合');
 for(const dep of parent.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add(spec.parentCatalogId);
 const details={retainedParentAssembly:parent,parentSourceGeometryHashes:Object.fromEntries([...new Set(parent.instances.map(i=>i.assetId))].map(aid=>[aid,outfitHash(geometryData(p.assets[aid]))]))};
 if(catalogId==='BUILT-084')return finish({...details,roof:placeLegacyRoof(b,spec.parameters.roofProgram,spec.parameters.roofTone as keyof typeof legacyRoofColors)});
 if(catalogId==='BUILT-182'){
  const asset=b.asset('legacy-fourteen-metre-pad',aid=>militaryPad(p,aid));b.place(asset,[0,0,0],0,'pad');
  return finish({...details,padSizeM:14,sourceDefaultPadM:7,walkY:.2,authorStreetEntry:[0,0,-11],goldStrips:3,identityBound:false,scope:'14mplatform derived from actual1817mpad. Three paint strips, blank sign and author continuous ramp; originalAviationPadID, exclusion/flattening, rental and controller unbound. Not a full apron system.'});
 }
 return finish({...details,vehicle:placeLegacyVehicle(b,spec.parameters.vehicleKind as LegacyVehicleKind)});
}
