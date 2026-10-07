import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const loc=JSON.parse(await readFile('work/m001-refinement/production-location.json','utf8'));
const report=JSON.parse(await readFile(loc.root+'/browser-verification.json','utf8'));
if(report.status!=='passed'||report.views.length!==39)throw Error('Final browser verification must finish before report capture');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const records=[];
try{
 const page=await browser.newPage({viewport:{width:1664,height:2000},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.resolve(loc.root,'review.html')).href);
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 for(const [id,file]of [['overview','M001-materials.png'],['comparison-1','M001-comparison-01.png'],['comparison-2','M001-comparison-02.png']]){
  await page.locator('#'+id).scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.locator('#'+id).screenshot({path:loc.root+'/'+file});
  const bytes=await readFile(loc.root+'/'+file);records.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),source:'Actual unmodified editor screenshots arranged by review.html'});
 }
}finally{await browser.close();}
await writeFile(loc.root+'/review-boards.json',JSON.stringify({status:'captured',records},null,2)+'\n');
console.log(JSON.stringify(records));
