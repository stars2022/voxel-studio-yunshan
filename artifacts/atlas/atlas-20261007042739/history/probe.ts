import {writeFile,readFile} from 'node:fs/promises';
import {productionProject} from '../../src/production/style';
import {parseCatalogCSV} from '../../src/core/catalog';
import {validateProject} from '../../src/core/engine';
import {makeBuildingVariant} from '../../src/production/building-variants';
import {m060BuildingVariantIds,buildingVariantForms} from '../../src/production/building-variant-spec';
import {auditBuildingVariant} from '../../scripts/lib/building-variant-audit';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
const selected=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(','),records=[];
for(const id of m060BuildingVariantIds.filter(id=>!selected||selected.includes(id)))for(const params of buildingVariantForms(id)){
 const start=performance.now(),p=productionProject(id);p.catalog={sourceName:'catalog',importedAt:'probe',entries:structuredClone(catalog)};
 const a=makeBuildingVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);
 const r=auditBuildingVariant(p,a),failed={routes:r.routes.filter((x:any)=>!x.support.length||!x.clearance.clear),links:r.links.filter((x:any)=>!x.support.length||!x.clearance.clear),floors:r.floors.filter((x:any)=>!x.support.length),columns:r.columns.filter(x=>!x.contacts.length),roofs:r.roofs.filter(x=>!x.supported),components:r.components.filter(x=>x.closed.some(y=>!y.closed||!y.oriented)||x.native.some(y=>!y.attached))};
 const record={id,params,passed:r.passed,instances:a.instances.length,ms:performance.now()-start,counts:{routes:r.routes.length,links:r.links.length,floors:r.floors.length,columns:r.columns.length,roofs:r.roofs.length},failed};records.push(record);
 await writeFile('work/m060/probe-'+(selected?.join('_')??'all')+'.json',JSON.stringify(records,null,2));console.log(JSON.stringify({...record,failed:Object.fromEntries(Object.entries(failed).map(([k,v])=>[k,v.length]))}));
 if(!r.passed)throw new Error('Building probe failed; inspect saved actual geometry failures');
}
