import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {validationBrowserOptions} from './browser-options';
const previous='atlas-20261003124003',latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),out=latest.evidence;
const oldIndex=JSON.parse(await readFile(path.join('projects/production',previous,'index.json'),'utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8'));
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const notes:Record<string,string>={'BUILT-071':'给上下帽沿补出真正凸出的金属角鞍和铜销；纸罩、流苏、木骨架、内部灯芯及全部材质/配色保持原样。'};
const records=[];
for(const [id,note]of Object.entries(notes)){
 const old=oldIndex.entries.find((r:any)=>r.id===id),current=index.entries.find((r:any)=>r.id===id),a=JSON.parse(await readFile(path.join('projects',old.file),'utf8')),b=JSON.parse(await readFile(path.join('projects',current.file),'utf8'));
 for(const key of['materials','styles','palettes'])assert.equal(hash(a[key]),hash(b[key]),id+' appearance changed');
 assert.notEqual(old.sha256,current.sha256);records.push({id,note,oldFile:old.file,newFile:current.file,oldVoxelHash:old.sha256,newVoxelHash:current.sha256,oldCells:old.voxels,newCells:current.voxels,unchangedMaterials:true,unchangedRoles:true,unchangedPalettes:true});
}
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#dce0d8;color:#263c30;font:18px system-ui}header,footer{padding:24px 32px}h1{font-size:28px}article{padding:14px 24px}section{display:grid;grid-template-columns:1fr 1fr}figure{margin:0;border:1px solid #adb8ac}img{width:100%;display:block}figcaption{padding:16px}</style><header><h1>M015 · 纸灯帽沿和外露铜销</h1>实际编辑器截图 · 前后完整材质、角色及配色参数一致 · 没有重绘图片</header>${records.map(r=>`<article><h2>${r.id}</h2><p>${r.note}</p><section><figure><img src="../${previous}/screenshots/${r.id}-isometric.png"><figcaption>初次版本 · ${r.oldCells.toLocaleString()} 格</figcaption></figure><figure><img src="screenshots/${r.id}-isometric.png"><figcaption>当前版本 · ${r.newCells.toLocaleString()} 格</figcaption></figure></section></article>`).join('')}<footer>两者均为可编辑体素候选；不表示达到参考图美术标准。源版本、边界、角色及修改哈希保留在 JSON 中。</footer>`;
const file=path.join(out,'joinery-revision.html');await writeFile(file,html);await writeFile(path.join(out,'joinery-revision.json'),JSON.stringify({previous,current:index.run,records},null,2));
const browser=await chromium.launch(validationBrowserOptions());try{const page=await browser.newPage({viewport:{width:1700,height:1000}});await page.goto(pathToFileURL(file).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(out,'joinery-revision.png'),fullPage:true});}finally{await browser.close();}
console.log(JSON.stringify({out,models:records.length}));
