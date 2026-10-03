import {readFile,writeFile,mkdir,copyFile,rename,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {parseCatalogCSV} from '../src/core/catalog';
import {parseAtlasCSV,type AtlasIndex} from '../src/production/atlas';

const input=path.resolve(process.argv[2]??'参考/云山巨城_67张完整图册'),out=path.resolve('projects/reference-atlas'),hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
const csv=await readFile(path.join(input,'清单.csv'),'utf8'),catalogCSV=await readFile('projects/catalog/city-assets.csv','utf8'),catalog=new Map(parseCatalogCSV(catalogCSV).map(e=>[e.id,e])),rows=parseAtlasCSV(csv),old=JSON.parse(await readFile('projects/production-index.json','utf8')),legacy=new Map<string,any>(old.entries.map((e:any)=>[e.id,e]));
const index:AtlasIndex={format:'yunshan.reference-atlas',version:1,createdAt:new Date().toISOString(),sourceSHA256:hash(csv),catalogSHA256:hash(catalogCSV),sheets:[],entries:[]};
await mkdir(path.join(out,'images'),{recursive:true});
for(const sheet of [...new Set(rows.map(r=>r['图册编号']))].sort()){
 const items=rows.filter(r=>r['图册编号']===sheet),r=items[0],source=path.resolve(input,r['图像文件']);
 assert.ok(source.startsWith(input+path.sep));assert.equal((await lstat(source)).isSymbolicLink(),false);assert.equal(await realpath(source),source);
 const image=await readFile(source),sha=hash(image),meta=await sharp(image).metadata();assert.equal(meta.format,'png');assert.equal(meta.width,Number(r['图像宽']));assert.equal(meta.height,Number(r['图像高']));
 const file='images/'+sheet+'.png',prompt=await readFile(path.join(input,'最终提示词',sheet+'.txt'),'utf8');
 const descriptions=new Map<string,string>();const matches=[...prompt.matchAll(/^\d{2}\. ((?:LIFE|BUILT|ENV|CHAR)-\d{3}) ([^\n]+)\n([\s\S]*?)(?=^\d{2}\. |$(?![\s\S]))/gm)];
 for(const m of matches)descriptions.set(m[1],m[3].trim().split(/\n\s*\n/)[0].slice(0,6000));
 for(const item of items){assert.equal(item['图像SHA256'],sha);assert.equal(item['图像文件'],r['图像文件']);assert.ok(catalog.has(item['资产ID']),'Unknown ID '+item['资产ID']);const id=item['资产ID'],slot=Number(item['格序']),prior=legacy.get(id),left=Math.floor((slot-1)%4*meta.width!/4),top=Math.floor(Math.floor((slot-1)/4)*meta.height!/3),right=Math.floor(((slot-1)%4+1)*meta.width!/4),bottom=Math.floor((Math.floor((slot-1)/4)+1)*meta.height!/3);
  index.entries.push({id,name:item['资产名称'],type:catalog.get(id)!.source['条目类型'],sheet,slot,theme:item['主题'],imageSHA256:sha,description:descriptions.get(id)??'',crop:{left,top,width:right-left,height:bottom-top},...(prior?.file?{legacy:{file:prior.file,assetIds:prior.assetIds,stage:prior.stage}}:{})});
 }
 await copyFile(source,path.join(out,file));index.sheets.push({id:sheet,theme:r['主题'],file,sha256:sha,width:meta.width!,height:meta.height!,entries:items.length});
}
assert.equal(index.sheets.length,67);assert.equal(index.entries.length,793);assert.equal(index.entries.filter(e=>!e.description).length,0,'Missing individual description');
await writeFile(path.join(out,'index.json.tmp'),JSON.stringify(index,null,2));await rename(path.join(out,'index.json.tmp'),path.join(out,'index.json'));await copyFile(path.join(input,'清单.csv'),path.join(out,'source.csv'));
// Provenance used by headless recipes. No image path or prompt is executed by the engine.
await writeFile('src/production/atlas-links.json',JSON.stringify(Object.fromEntries(index.entries.map(e=>[e.id,{sheet:e.sheet,slot:e.slot,imageSHA256:e.imageSHA256}]))));
await mkdir('artifacts/atlas',{recursive:true});const report={sheets:index.sheets.length,entries:index.entries.length,uniqueIds:new Set(index.entries.map(e=>e.id)).size,types:Object.fromEntries(['基础组件','组合模板','配色尺寸变体'].map(t=>[t,index.entries.filter(e=>e.type===t).length])),sourceSHA256:index.sourceSHA256,verifiedImages:index.sheets,unmapped:[],imageDimensionsAreNotModelDimensions:true};await writeFile('artifacts/atlas/reference-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,verifiedImages:report.verifiedImages.length},null,2));
