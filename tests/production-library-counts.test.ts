import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {readProductionLibrary} from '../src/production/library';

test('upgrading existing furniture variants replaces legacy component counts without duplicating entries',async()=>{
 const dir=await mkdtemp('work/library-upgrade-counts-');
 try{
  const variants=[['LIFE-033','LIFE-016',1],['LIFE-034','LIFE-014',2],['LIFE-035','LIFE-001',4],['LIFE-036','LIFE-010',2]] as const;
  const entries:any[]=variants.flatMap(([id,parent,n])=>[
   {id:parent,name:parent,type:'基础组件',stage:'geometry-candidate',file:'retained.ysvox.json',assetIds:[parent]},
   {id,name:id,type:'配色尺寸变体',stage:'variant-candidate',assetIds:Array.from({length:n},(_,i)=>id+'-'+i)}
  ]);
  const index={format:'yunshan.production-index',version:1,createdAt:'test',counts:{baseModels:4,assemblies:0,variantEntries:4,variantModels:9,generatedEntries:8,notProduced:0},entries,packs:[],metrics:{}};
  const atlas={format:'yunshan.atlas-production',version:1,run:'test',entries:variants.map(([id,parent])=>({id,kind:'variant',parentCatalogId:parent,parameters:{furnitureSize:'standard',furnitureFinish:'standard'},finiteForms:6,assetIds:[id+'-assembly-component'],assemblyId:id})),studies:[]};
  await writeFile(dir+'/production-index.json',JSON.stringify(index));await writeFile(dir+'/atlas-production-index.json',JSON.stringify(atlas));
  for(let i=0;i<2;i++){
   const result=await readProductionLibrary(dir,{limit:100}),c=result.counts as Record<string,number>;
   assert.equal(c.variantEntries,4);assert.equal(c.variantModels,24);assert.equal(c.generatedEntries,8);assert.equal(c.notProduced,0);assert.equal(c.atlasVariantForms,24);
   assert.ok(result.entries.filter(e=>e.stage==='variant-candidate').every(e=>e.finiteForms===6));
  }
  // A later persisted finite-form count takes precedence over the component count.
  entries.find(e=>e.id==='LIFE-035').finiteForms=12;index.counts.variantModels=17;
  await writeFile(dir+'/production-index.json',JSON.stringify(index));
  assert.equal(((await readProductionLibrary(dir,{})).counts as Record<string,number>).variantModels,24);
 }finally{await rm(dir,{recursive:true,force:true});}
});
