import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const url='http://127.0.0.1:4317',hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),state=()=>fetch(url+'/api/state').then(r=>r.json()),before=await state();
const browser=await chromium.launch({headless:true}),errors:string[]=[],report:any={version:before.project.version,checks:[],errors};
try{
 const page=await browser.newPage({viewport:{width:1660,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'/?asset=study-planter&view=perspective');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),true);
 await page.locator('[data-tab="catalog"]').click();await page.locator('#catalog-stage').selectOption('modeling');assert.equal(await page.locator('[data-catalog-id]').count(),2);
 await page.locator('#toast').waitFor({state:'hidden',timeout:15000});await page.screenshot({path:'artifacts/catalog/live-editor.png'});
 await page.setViewportSize({width:857,height:850});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal clipping at desktop-panel width');
 for(const [i,v]of [28,50,5].entries())await page.locator('#min-'+i).fill(String(v));for(const [i,v]of [94,86,55].entries())await page.locator('#max-'+i).fill(String(v));
 await page.getByRole('button',{name:'仅看选区',exact:true}).click();await page.waitForFunction(()=>(window as any).voxelStudio.ready&&document.getElementById('viewport-title')!.textContent!.includes('选区隔离'));
 assert.equal(await page.locator('#min-1').inputValue(),'50');assert.ok(await page.getByRole('button',{name:'恢复完整模型',exact:true}).isEnabled());
 await page.getByRole('button',{name:'资产栏',exact:true}).click();await page.getByRole('button',{name:'属性栏',exact:true}).click();await page.waitForTimeout(150);
 const rects=await page.evaluate(()=>{const a=document.getElementById('viewport')!.getBoundingClientRect(),b=document.querySelector('.view-controls')!.getBoundingClientRect(),title=document.querySelector('.viewport-top')!.getBoundingClientRect();return{viewport:a.toJSON(),controls:b.toJSON(),title:title.toJSON(),innerWidth,scrollWidth:document.documentElement.scrollWidth};});
 assert.ok(rects.viewport.width>840);assert.ok(rects.controls.left>=rects.viewport.left);assert.ok(rects.controls.right<=rects.viewport.right);assert.ok(rects.title.bottom<=rects.controls.top);report.compactLayout=rects;
 await page.screenshot({path:'artifacts/catalog/compact-detail.png'});report.checks.push('857px panel has no horizontal overflow; controls do not cover title; both sidebars collapse');
 await page.getByRole('button',{name:'属性栏',exact:true}).click();await page.getByRole('button',{name:'恢复完整模型',exact:true}).click();await page.waitForFunction(()=>(window as any).voxelStudio.ready&&!(window as any).voxelStudio.performance.isolatedRegion);assert.ok(!(await page.locator('#viewport-title').textContent())!.includes('选区隔离'));report.checks.push('region entered in visible UI stays in inspector; isolate/restore changes only display');
 await page.getByRole('button',{name:'材质',exact:true}).click();assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),false);await page.getByRole('button',{name:'纯色',exact:true}).click();assert.equal(await page.evaluate(()=>(window as any).voxelStudio.clayEnabled),true);report.checks.push('default pure-colour view and explicit material switch work');
 assert.equal(hash((await state()).project),hash(before.project));assert.deepEqual(errors,[]);report.checks.push('UI inspection leaves native project, selection, geometry and materials unchanged');await writeFile('artifacts/catalog/detail-ui.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,errors},null,2));
}finally{await browser.close();}
