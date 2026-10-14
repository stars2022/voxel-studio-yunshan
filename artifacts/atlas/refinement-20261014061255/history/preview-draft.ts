import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {productionProject} from '../../src/production/style';
import {Engine} from '../../src/core/engine';
import {parseCatalogCSV} from '../../src/core/catalog';
import {civicRefinementIds} from '../../src/production/civic-refinement';
import {referenceFinishCommands} from '../../src/production/reference-finish';
import {refinementFinishCommands} from '../../src/production/refinement-finish';
import {assetBoundsM,geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import type {Command} from '../../src/core/types';
const runtime='/tmp/yunshan-m008-draft',out='work/m008-refinement/draft03';await mkdir(runtime+'/reference-atlas/images',{recursive:true});await mkdir(out,{recursive:true});
for(const f of['atlas-production-index.json','production-index.json','architecture-index.json','material-index.json'])await copyFile('projects/'+f,runtime+'/'+f);
await copyFile('projects/reference-atlas/index.json',runtime+'/reference-atlas/index.json');await copyFile('projects/reference-atlas/images/M008.png',runtime+'/reference-atlas/images/M008.png');
const p=productionProject('M008 actual draft');p.catalog={sourceName:'catalog',importedAt:'draft',entries:Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]))};const e=new Engine(p);
const edit=(commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});e.execute({...r,previewToken:dry.previewToken});};edit(['LIFE-127'].map(id=>({op:'produceCatalogAsset',catalogId:id,id:id.toLowerCase(),params:{refinement:'reference-v1'}})));edit([...referenceFinishCommands(e.project),...refinementFinishCommands(e.project,'M008')]);await writeFile(runtime+'/autosave.ysvox.json',JSON.stringify(e.project));
const server=spawn(process.execPath,['--import','tsx','src/server/main.ts'],{env:{...process.env,VOXEL_PORT:'4413',VOXEL_PROJECT_DIR:runtime},stdio:['ignore','pipe','pipe']});let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);let browser:any;const records:any[]=[];
try{let ready=false;for(let j=0;j<180;j++){try{if((await fetch('http://127.0.0.1:4413/api/state')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready,log);browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1400,height:1000}});page.setDefaultTimeout(180000);await page.goto('http://127.0.0.1:4413/?flat=1&view=perspective');await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready);
for(const id of ['LIFE-127']){const a=e.project.assets[id.toLowerCase()],bounds=assetBoundsM(a)!,region={min:bounds.min.map(v=>v/.005),max:bounds.max.map(v=>v/.005)};await page.evaluate(async({id,region})=>{const v=(window as any).voxelStudio;await v.mode('asset',id);v.clay(false);v.studio(true);v.referenceLighting(true);v.ao(false);v.bloom(false);v.practicals(false);v.view('perspective');v.focus(region);},{id:a.id,region});for(let k=0;k<3;k++)await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const perf=await page.evaluate(()=>(window as any).voxelStudio.performance);assert.equal(perf.meshError,null);const clip=await page.locator('#viewport').boundingBox();await page.screenshot({path:out+'/'+id+'.png',clip:clip!});records.push({id,geometrySHA256:hash(geometryData(a)),file:id+'.png',triangles:perf.triangles});console.log(id+' captured');await page.evaluate(()=>{const v=(window as any).voxelStudio;v.clay(true);v.view('top');});for(let j=0;j<3;j++)await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:out+'/'+id+'-top-clay.png',clip:clip!});records.push({id:id+'-top-clay',geometrySHA256:hash(geometryData(a)),file:id+'-top-clay.png'});console.log(id+' top captured');}
}finally{await browser?.close();server.kill();await writeFile(out+'/server.txt',log);await writeFile(out+'/preview.json',JSON.stringify({kind:'actual-editor-draft',records},null,2));}
