import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {validateProject} from '../src/core/engine';
import type {Command} from '../src/core/types';
const url='http://127.0.0.1:4317',state=()=>fetch(url+'/api/state').then(r=>r.json()),hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const client=new Client({name:'city-catalog-install',version:'1'});await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],cwd:process.cwd(),stderr:'pipe'}));
const call=async(name:string,args:any={})=>{const r:any=await client.callTool({name,arguments:args}),v=JSON.parse(r.content[0].text);if(r.isError)throw new Error(JSON.stringify(v));return v;};
try{
 const before=await state(),pre=JSON.parse(await readFile('artifacts/catalog/pre-live-upgrade.json','utf8'));assert.equal(hash(before.project),hash(pre.project));assert.deepEqual(before.history,pre.history);
 assert.equal(before.project.catalog,undefined,'refuse overwriting a live production catalog');
 const commands:Command[]=[{op:'importCatalog',csv:await readFile('projects/catalog/city-assets.csv','utf8'),sourceName:'city-assets.csv'},
 {op:'catalogEntry',id:'BUILT-249',assetIds:['study-lantern'],stage:'modeling',note:'候选细节母版：1 cm 真体素，7,148 格，当前合面导出 1,014 三角形。可编辑、纸罩/框架/挂环已建模；游戏挂点、电力、运行时局部光、LOD 和原规格全部验收尚未完成。'},
 {op:'catalogEntry',id:'ENV-096',assetIds:['study-planter'],stage:'modeling',note:'候选细节母版：1 cm 真体素，石作容器、土面、枝干、薄叶与花序已建模。现有版本含植株，尚须拆分容器与植株接口；游戏支撑/公共净空和 LOD 尚未验收。'}];
 const envelope={expectedVersion:before.project.version,requestId:crypto.randomUUID(),commands,label:'导入城市制作清单 · 关联两项候选母版'},dry=await call('edit_transaction',{...envelope,dryRun:true}),commit=await call('edit_transaction',{...envelope,previewToken:dry.previewToken});
 const installed=await state();for(const key of['assets','materials','styles','palettes','instances','assemblies','selection'])assert.equal(hash(installed.project[key]),hash(before.project[key]),key+' unchanged');
 const undo=await call('edit_transaction',{expectedVersion:commit.version,requestId:crypto.randomUUID(),commands:[{op:'undo'}]});assert.equal((await state()).project.catalog,undefined);
 const redo=await call('edit_transaction',{expectedVersion:undo.version,requestId:crypto.randomUUID(),commands:[{op:'redo'}]});const final=await state();validateProject(final.project);assert.equal(hash(final.project.catalog),hash(installed.project.catalog));
 const saved=await call('save_project',{filename:'city-production.ysvox.json'});assert.equal(hash(JSON.parse(await readFile(saved.path,'utf8'))),hash(final.project));
 const catalog=await call('read_catalog',{limit:1}),tools=await client.listTools();await writeFile('docs/tool-schemas.json',JSON.stringify(tools.tools,null,2));
 const report={versions:{before:before.project.version,commit:commit.version,undo:undo.version,redo:redo.version},preservedGeometryAndMaterials:true,restartPreservedHistory:true,importUndoRedoVerified:true,summary:catalog.summary,modifiedVoxels:commit.modifiedVoxels,saved,history:final.history};
 await writeFile('artifacts/catalog/installed.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await client.close();}
