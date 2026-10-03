import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {validationBrowserOptions} from './browser-options';
import {checkGeometry} from '../src/core/checks';

// Explicit invocation loads the selected gallery after saving the live document.
const sheet=process.argv.find(s=>s.startsWith('--sheet='))?.slice(8)??'M008',asset=process.argv.find(s=>s.startsWith('--asset='))?.slice(8)??'life-125',role=process.argv.find(s=>s.startsWith('--role='))?.slice(7)??'rubber';
const index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),report=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),entry=index.entries.find((e:any)=>e.assetId===asset&&e.sheet===sheet),gallery=index.studies.find((s:any)=>s.id===sheet+'-gallery');assert.ok(entry&&gallery);
const out=report.evidence,url='http://127.0.0.1:4317',state=()=>fetch(url+'/api/state').then(r=>r.json());
async function call(name:string,args:any){const response=await fetch(url+'/api/tool',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,arguments:args})}),result=await response.json();assert.ok(response.ok,JSON.stringify(result));return result;}
const expectedUnsupported=process.argv.find(s=>s.startsWith('--expected-unsupported='))?.slice(23).split(',')??[];
const native=JSON.parse(await readFile(path.join('projects',gallery.file),'utf8')),t=performance.now(),check=checkGeometry(native);assert.deepEqual(check.collisions,[]);assert.deepEqual(check.unsupported,expectedUnsupported);assert.deepEqual(check.warnings,[]);assert.ok(check.openings.every(o=>o.ownSolidCells===0&&o.blockedBy.length===0));await writeFile(path.join(out,'gallery-check.json'),JSON.stringify({elapsedMs:performance.now()-t,...check},null,2));
let backup:any;
if(!process.argv.includes('--capture-only')){
const before=(await state()).project;backup=await call('save_project',{filename:'before-atlas-'+new Date().toISOString().replace(/\D/g,'').slice(0,14)+'.ysvox.json'});
await call('load_project',{filename:gallery.file,expectedVersion:before.version});const loaded=(await state()).project,request={expectedVersion:loaded.version,requestId:crypto.randomUUID(),label:'按材质角色检查 '+asset,commands:[{op:'palette',name:'参考材质试作'},{op:'select',assetId:asset,region:null,partId:null}]},dry=await call('edit_transaction',{...request,dryRun:true});await call('edit_transaction',{...request,previewToken:dry.previewToken});
}
const liveCheck=await call('check_geometry',{});assert.deepEqual(liveCheck.collisions,[]);assert.deepEqual(liveCheck.unsupported,expectedUnsupported);assert.deepEqual(liveCheck.warnings,[]);await writeFile(path.join(out,'live-geometry.json'),JSON.stringify(liveCheck,null,2));
const browser=await chromium.launch(validationBrowserOptions());try{const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const link=url+'/?atlas=1&sheet='+sheet+'&asset='+asset+'&view=isometric&flat=0&look=reference&ao=1&bloom=1';
 await page.goto(link);await page.waitForFunction(()=>!!(window as any).voxelStudio?.ready,null,{timeout:120000});await page.waitForFunction(id=>(window as any).voxelStudio.performance.assetIds.includes(id),asset,{timeout:120000});await page.evaluate(()=>{const v=(window as any).voxelStudio;v.clay(false);v.studio(true);v.referenceLighting(true);v.ao(true);v.bloom(true);v.practicals(false);});
 const live=(await state()).project;await page.waitForFunction(version=>(window as any).voxelStudio.performance.renderedVersion===version,live.version,{timeout:120000});await page.locator('[data-material="'+live.styles.yunshan[role]+'"]').click();assert.ok((await page.locator('#material-role').innerText()).includes('yunshan.'+role));
 const rendered=await page.evaluate(id=>(window as any).voxelStudio.project.assets[id].chunks,asset);assert.equal(createHash('sha256').update(JSON.stringify(rendered)).digest('hex'),entry.sha256);assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(out,'live-editor.png')});await page.locator('#viewport').screenshot({path:path.join(out,'live-asset.png')});const webgl=await page.evaluate(()=>{const gl=(document.querySelector('#viewport canvas') as HTMLCanvasElement).getContext('webgl2')!,ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER);});const result={browser:browser.version(),webgl,name:live.name,version:live.version,selection:live.selection,performance:await page.evaluate(()=>(window as any).voxelStudio.performance),errors,url:link,backup,geometrySHA256:entry.sha256};await writeFile(path.join(out,'live-editor.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({version:live.version,url:link,backup:backup?.path,errors}));
}finally{await browser.close();}
