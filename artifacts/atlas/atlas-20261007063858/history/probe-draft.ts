import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {productionProject} from '../../src/production/style';
import {validateProject} from '../../src/core/engine';
import {geometryData} from '../../src/core/sky';
import {Grid} from '../../src/core/grid';
import {outfitHash} from '../../src/production/outfit-components';
import {parseCatalogCSV} from '../../src/core/catalog';
import {architectureClosed,architectureComponents} from '../../scripts/lib/architecture-audit';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {makeLegacyVariant} from './draft/legacy-variants';
import {legacyVariantIds,legacyVariantForms} from './draft/legacy-variant-spec';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const reports=[];
for(const id of legacyVariantIds)for(const params of legacyVariantForms(id)){
 const p=productionProject(id);p.catalog={sourceName:'catalog',importedAt:'draft',entries:structuredClone(catalog)};
 const a=makeLegacyVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);
 const report:any={id,params,instances:a.instances.length,parts:0,nativeIslands:0,passed:true};
 for(const aid of new Set(a.instances.map(i=>i.assetId))){
  const asset=p.assets[aid];if(!asset.meshes?.length)continue;
  const closed=architectureClosed(asset),parts=architectureComponents(asset),native=nativeIslandAttachments({...asset,meshes:parts});
  assert.ok(closed.length&&closed.every(c=>c.closed&&c.oriented),aid+' closed '+JSON.stringify(closed.filter(c=>!c.closed||!c.oriented)));
  assert.ok(native.every(n=>n.attached),aid+' native '+JSON.stringify(native.filter(n=>!n.attached)));
  report.parts+=closed.length;report.nativeIslands+=native.length;
 }
 const details=a.source!.legacyVariant as any;
 for(const[aid,hash]of Object.entries(details.parentSourceGeometryHashes??{}))assert.equal(outfitHash(geometryData(p.assets[aid])),hash);
 if(id==='BUILT-085'){
  const child=p.assets[a.instances[0].assetId],from=p.assets[details.parentAssetId],copy=structuredClone(child),g=new Grid(),remap=child.source!.materialDerivation as any;
  for(const[v,m]of new Grid(copy.chunks).cells())g.set(v,m===remap.to?remap.from:m);copy.chunks=g.serialize();assert.equal(outfitHash(geometryData(copy)),outfitHash(geometryData(from)));report.nativeCells=new Grid(from.chunks).count;
 }
 reports.push(report);console.log(JSON.stringify(report));
 if(id==='BUILT-084'&&params.roofTone==='blueGreyA')await writeFile('work/m061/'+params.roofProgram+'.ysvox.json',JSON.stringify(p));
 if(['BUILT-085','BUILT-173','BUILT-176','BUILT-182'].includes(id)&&legacyVariantForms(id).indexOf(params)<1)await writeFile('work/m061/'+id+'.ysvox.json',JSON.stringify(p));
}
await writeFile('work/m061/draft-probe.json',JSON.stringify({status:'passed',forms:reports.length,reports},null,2));
