import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const out=path.resolve('artifacts/microscope-study'),before=JSON.parse(await readFile(path.join(out,'before.json'),'utf8')),fixed=JSON.parse(await readFile(path.join(out,'ao-fixed.json'),'utf8')),after=JSON.parse(await readFile(path.join(out,'after.json'),'utf8'));
assert.equal(fixed.geometrySHA256,before.geometrySHA256);assert.equal(after.status,'passed');assert.equal(fixed.status,'passed');
const image=(f:string)=>`<img src="${f}"/>`,card=(label:string,file:string,note:string)=>`<article><h2>${label}</h2>${image(file)}<p>${note}</p></article>`;
const html=`<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:36px;background:#efeeea;color:#263b37;font-family:system-ui,"PingFang SC",sans-serif}header{border-bottom:1px solid #9fa8a1;padding-bottom:20px;margin-bottom:22px}h1{font-size:28px;margin:0 0 10px}header p{font-size:14px;margin:4px 0}main{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}article{background:white;border:1px solid #c9cdca;padding:12px}h2{font-size:17px;margin:5px 8px}img{width:100%;display:block}article p{font-size:13px;line-height:1.6;margin:8px}aside{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:22px}aside img{max-height:590px;object-fit:contain}footer{margin-top:20px;font-size:13px;line-height:1.6}code{font-size:12px}</style>
<header><h1>显微观察设备 · 几何与材质实测对照</h1><p>同一真实体素编辑器、固定等轴视角。截图直接取自 WebGL；不使用图片生成或重绘。</p><p>上排隔离 AO 修复与建模修改；下排检查新版素色与材质。各模型适配画幅，不能用像素尺寸测量实物。</p></header>
<main>${card('01 旧模型 · 旧 AO','before-material-ao.png','原模型未改变。AO 将背景帧透明度降至 140/255，与白色页面混合。')}${card('02 同一旧模型 · 修复 AO','ao-fixed-material-ao.png','体素哈希与左图相同；相同材质。帧透明度恢复 255/255。')}${card('03 新版几何 · 修复 AO','after-material-ao.png','新增机壳分层、导轨、套筒、夹片与灯芯。此图没有开启辉光。')}</main>
<aside>${card('04 新版 · 纯色验形','after-flat.png','关闭纹理、场景光照、反射、透明混合、AO 与辉光；保留当前方案基础色及固定朝向明暗。')}${card('05 新版 · 材质与辉光','after-material-glow.png','玻璃、屏底、显示图形、光学发光面、亮芯、涂装和结构金属分开。未使用近似点光源。')}</aside>
<footer>材质角色保存在 <code>styles.yunshan</code>，对应每格的材质 ID。换外观不改变体素、开口和碰撞属性。<br>仍是待人工美术验收的静态模型；曲面和斜筒保持 5mm 阶梯，比例、构造和细节尚不能称为达到参考图标准。没有显微成像或调焦动画。</footer>`;
await writeFile(path.join(out,'comparison.html'),html);
const browser=await chromium.launch({headless:true});try{const page=await browser.newPage({viewport:{width:1560,height:1200}});await page.goto(pathToFileURL(path.join(out,'comparison.html')).href);await page.locator('img').evaluateAll((imgs:any[])=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:path.join(out,'comparison.png'),fullPage:true});}finally{await browser.close();}
const result={status:'passed',oldGeometry:before.geometrySHA256,newGeometry:after.geometrySHA256,aoOnlyPreservesGeometry:fixed.geometrySHA256===before.geometrySHA256,beforeAlpha:before.images.find((r:any)=>r.name==='material-ao').framebufferSamples,afterAlpha:fixed.images.find((r:any)=>r.name==='material-ao').framebufferSamples};await writeFile(path.join(out,'comparison.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
