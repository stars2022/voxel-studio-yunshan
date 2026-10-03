import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='artifacts/flat',url='http://127.0.0.1:4317';await mkdir(root,{recursive:true});
const before=await fetch(url+'/api/state').then(r=>r.json()),hash=(p:any)=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:1150}}),errors:string[]=[],views:any[]=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(url+'/?preview=1&asset=atelier-bay&view=perspective&flat=1');
 await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready&&(window as any).voxelStudio.clayEnabled,null,{timeout:120000});
 await page.locator('#toast').waitFor({state:'hidden',timeout:15000});
 for(const[id,file,label]of [['atelier-bay','bay','开间 · 柱帽、压条与门洞'],['atelier-railing','railing','栏杆 · 扶手、柱帽与连接'],['atelier-planter','planter','花槽 · 口沿、回纹与枝叶'],['atelier-lantern','lantern','灯笼 · 支架、骨架与底坠']]){
  await page.evaluate(async id=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.view('perspective');v.clay(true);},id);
  await page.waitForFunction(()=>(window as any).voxelStudio.ready);await page.waitForTimeout(350);
  await page.locator('#viewport').screenshot({path:`${root}/${file}.png`});
  views.push({id,file: file+'.png',label,version:await page.evaluate(()=>(window as any).voxelStudio.version)});
 }
 // Exercise the user-facing toggle, not only the query-string route.
 await page.evaluate(()=>document.body.classList.remove('preview-mode'));
 assert.equal(await page.locator('#bloom').isDisabled(),true);await page.locator('#clay').click();assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),false);
 await page.locator('#clay').click();assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),true);assert.equal(await page.locator('#ao').isDisabled(),true);
 await page.screenshot({path:`${root}/editor.png`});
 const after=await fetch(url+'/api/state').then(r=>r.json());assert.equal(hash(after.project),hash(before.project),'display mode must not mutate the canonical project');assert.deepEqual(errors,[]);
 const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#cacaca;color:#26322c;font:18px system-ui,'PingFang SC',sans-serif}header{height:88px;padding:20px 28px;border-bottom:1px solid #a8ada9}h1{font-size:25px;margin:0 0 6px;font-weight:600}header p{margin:0;font-size:14px;color:#53625a}.grid{display:grid;grid-template-columns:1fr 1fr}figure{margin:0;position:relative;border-bottom:1px solid #acb1ad}figure:nth-child(odd){border-right:1px solid #acb1ad}img{display:block;width:100%;height:620px;object-fit:contain}figcaption{height:48px;padding:12px 28px;border-top:1px solid #b9bebb;font-size:17px}</style><header><h1>云山 · 构件素色检查</h1><p>实际体素几何 · 保留基础色 · 无纹理、凹凸、反射、发光、场景光照与后期效果</p></header><div class="grid">${views.map(v=>`<figure><img src="${v.file}"><figcaption>${v.label}</figcaption></figure>`).join('')}</div></html>`;
 await writeFile(root+'/index.html',html);
 const sheet=await browser.newPage({viewport:{width:1600,height:1424}});await sheet.goto(pathToFileURL(path.resolve(root,'index.html')).href);await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:root+'/overview.png',fullPage:true});
 await writeFile(root+'/verification.json',JSON.stringify({capturedAt:new Date().toISOString(),mode:'unlit-base-colour',settings:{textures:false,normalMaps:false,reflection:false,emission:false,transparency:false,sceneLighting:false,shadows:false,ao:false,bloom:false,faceNormalContrast:true},views,errors,documentUnchanged:true,version:after.project.version},null,2));
 console.log('Captured four actual voxel assets; UI toggle passed; authoritative document unchanged.');
}finally{await browser.close();}
