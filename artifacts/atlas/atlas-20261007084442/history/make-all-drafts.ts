import assert from'node:assert/strict';
import {readFile,writeFile}from'node:fs/promises';
import {productionProject}from'../../src/production/style';
import {parseCatalogCSV}from'../../src/core/catalog';
import {validateProject}from'../../src/core/engine';
import {assemblyBoundsM}from'../../src/production/assembly-geometry';
import {displayMesh}from'../../src/core/mesh';
import {bodyVariantIds,bodyVariantForms,bodyVariantSpec}from'./body-variant-spec';
import {makeBodyVariant}from'./body-variants';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e])),report=[];
for(const id of bodyVariantIds)for(const[formIndex,params]of bodyVariantForms(id).entries()){
 const p=productionProject(id+' '+JSON.stringify(params));p.catalog={sourceName:'city-assets.csv',importedAt:'draft',entries:structuredClone(catalog)};const a=makeBodyVariant(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));p.selection={assetId:a.instances[0].assetId,region:null,partId:null};validateProject(p);const key=id+'-'+String(formIndex+1).padStart(2,'0'),b=assemblyBoundsM(p,a),triangles=a.instances.reduce((sum,i)=>sum+displayMesh(p.assets[i.assetId],p.materials).reduce((s,b)=>s+b.indices.length/3,0),0);await writeFile('work/body-variants/'+key+'.ysvox.json',JSON.stringify(p));const def=bodyVariantSpec(id);if(JSON.stringify(def.parameters)===JSON.stringify(params))await writeFile('work/body-variants/'+id+'.ysvox.json',JSON.stringify(p));report.push({id,key,params,bounds:b,triangles,instances:a.instances.length,parents:(a.source!.bodyVariant as any).parents});
}
assert.equal(report.length,24);await writeFile('work/body-variants/all-drafts.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({parents,...r})=>r)));
