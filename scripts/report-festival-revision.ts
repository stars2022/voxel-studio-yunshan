import {readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {Grid} from '../src/core/grid';
import {validationBrowserOptions} from './browser-options';

const priorRun='atlas-20261003080834',priorRoot=path.resolve('artifacts/atlas',priorRun),report=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),prior=JSON.parse(await readFile(path.join('projects/production',priorRun,'index.json'),'utf8')),records=[];
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
for(const [id,note]of [['LIFE-189','补出正面凹板内的原生回纹和竖向灯槽，保留空棺内腔与独立覆布。'],['LIFE-191','按灯体实际宽度计算内缩量，修复小尺寸灯芯消失；蜡烛与糕体材质保持独立。']]){
 const before=prior.entries.find((e:any)=>e.id===id),after=index.entries.find((e:any)=>e.id===id);assert.ok(before&&after);assert.notEqual(before.sha256,after.sha256);
 const oldDoc=JSON.parse(await readFile(path.join('projects',before.file),'utf8')),newDoc=JSON.parse(await readFile(path.join('projects',after.file),'utf8'));
 assert.equal(hash(oldDoc.materials),hash(newDoc.materials));assert.equal(hash(oldDoc.styles),hash(newDoc.styles));
 for(const view of['isometric','material'])await copyFile(path.join(priorRoot,'screenshots',id+'-'+view+'.png'),path.join(report.evidence,'festival-before-'+id+'-'+view+'.png'));
 records.push({id,note,before:{file:before.file,sha256:before.sha256,voxels:new Grid(oldDoc.assets[before.assetId].chunks).count,triangles:before.triangles},after:{file:after.file,sha256:after.sha256,voxels:new Grid(newDoc.assets[after.assetId].chunks).count,triangles:after.triangles},materialsUnchanged:true});
}
const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#dde1da;color:#293d32;font:18px system-ui,'PingFang SC'}header,footer{padding:25px 34px}h1{margin:0 0 12px;font-size:30px}h2{font-size:23px;margin:20px 30px}main>section{border-top:1px solid #aab8a6}article{display:grid;grid-template-columns:repeat(4,1fr)}figure{margin:0;border:1px solid #bec6ba}img{display:block;width:100%}figcaption{padding:14px}p{margin:6px 30px 20px}small{font-size:15px}</style><header><h1>M011 实图复查 · 台面回纹与小灯芯</h1>相同方向、相同外观参数的真实 WebGL 截图。修正的是权威体素结构。</header><main>${records.map(r=>`<section><h2>${r.id}</h2><p>${r.note}<br><small>占用格 ${r.before.voxels.toLocaleString()} → ${r.after.voxels.toLocaleString()}；三角形 ${r.before.triangles.toLocaleString()} → ${r.after.triangles.toLocaleString()}。材质映射及参数不变。</small></p><article>${['isometric','material'].flatMap(view=>['before','after'].map(phase=>`<figure><img src="${phase==='before'?'festival-before-'+r.id+'-'+view+'.png':'screenshots/'+r.id+'-'+view+'.png'}"><figcaption>${phase==='before'?'修正前':'修正后'} · ${view==='isometric'?'素色验形':'材质试作'}</figcaption></figure>`)).join('')}</article></section>`).join('')}</main><footer>仍为候选资产。曲面阶梯、简化图画与细小构造尚有差距；静态结构检查不代表燃烧、动画或美术验收。</footer>`;
await writeFile(path.join(report.evidence,'festival-revision.html'),html);await writeFile(path.join(report.evidence,'festival-revision.json'),JSON.stringify({beforeRun:priorRun,run:index.run,records},null,2));
const browser=await chromium.launch(validationBrowserOptions());try{const page=await browser.newPage({viewport:{width:2200,height:1200}});await page.goto(pathToFileURL(path.join(report.evidence,'festival-revision.html')).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(report.evidence,'festival-revision.png'),fullPage:true});}finally{await browser.close();}
console.log(JSON.stringify({run:index.run,records}));
