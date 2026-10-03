import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {Engine} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {atelierCatalog,atelierStyleCommands} from '../src/core/atelier';
import {Grid} from '../src/core/grid';
import {toolDefinitions} from '../src/core/schema';
import {templateCatalog} from '../src/core/templates';
import {templateParameters} from '../src/core/template-parameters';
import type {Command} from '../src/core/types';

const report:any={startedAt:new Date().toISOString(),scope:'几何与 MCP 验证；按用户要求，本次不渲染截图。',checks:[]};
const creations:Command[]=Object.entries(atelierCatalog).map(([id,name])=>({op:'createAsset',id,name,template:id,style:'atelier',cellSize:.02}));
const e=new Engine(newProject());const envelope={expectedVersion:0,requestId:crypto.randomUUID(),commands:[...atelierStyleCommands(),...creations,{op:'renameProject',name:'云山 · 细部构造工作台'}]};
const preview=e.execute({...envelope,dryRun:true}),result=e.execute({...envelope,previewToken:preview.previewToken});
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const assets=Object.values(e.project.assets).map(a=>({id:a.id,cellSizeM:a.cellSize,voxels:new Grid(a.chunks).count,parts:a.parts.map(p=>({id:p.id,name:p.name})),boundsCells:new Grid(a.chunks).bounds(),geometrySHA256:digest(a.chunks)}));
report.generated={modifiedVoxels:result.modifiedVoxels,durationMs:result.durationMs,assets};
await mkdir('artifacts/atelier',{recursive:true});await writeFile('projects/atelier-details.ysvox.json',JSON.stringify(e.project));
await writeFile('docs/tool-schemas.json',JSON.stringify(toolDefinitions,null,2));
await writeFile('docs/template-parameters.json',JSON.stringify(Object.fromEntries(Object.entries(templateCatalog).map(([id,name])=>[id,{name,parameters:templateParameters(id),units:'metres; detail/glass/steps are dimensionless'}])),null,2));
if(process.argv.includes('--install')){
 const client=new Client({name:'atelier-geometry-check',version:'1'});
 try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/server/mcp.ts'],cwd:process.cwd(),env:{...process.env as Record<string,string>,VOXEL_URL:'http://127.0.0.1:4317'},stderr:'pipe'}));
  const call=async(name:string,args:any={})=>{const raw:any=await client.callTool({name,arguments:args});const r=JSON.parse(raw.content[0].text);if(raw.isError)throw new Error(JSON.stringify(r));return r;};
  const tx=async(commands:Command[],label:string)=>{const state=await call('read_project'),env={expectedVersion:state.version,requestId:crypto.randomUUID(),commands,label},dry=await call('edit_transaction',{...env,dryRun:true});return call('edit_transaction',{...env,previewToken:dry.previewToken});};
  const state=await call('read_project');assert.ok(!state.assets.some((a:any)=>a.id.startsWith('atelier-')),'停止：已有同 ID 精作资产，不能覆盖');
  assert.ok(!state.styles.atelier,'停止：已有同名风格，不能覆盖');
  const base=Math.max(101,...Object.keys(state.materials).map(Number).map(n=>n+1));
  const backup='before-atelier-'+Date.now()+'.ysvox.json';report.backup=await call('save_project',{filename:backup});
  report.install=await tx([...atelierStyleCommands(base),...creations],'添加四个细部体素母版 · 保留原民居与实例');
  const installed=await call('read_project');assert.equal(installed.assets.length,state.assets.length+4);assert.deepEqual(installed.instances,state.instances);report.checks.push('MCP 原子创建四母版，原有实例保持一致');
  const before=await fetch('http://127.0.0.1:4317/api/state').then(r=>r.json());
  const changed=await tx([{op:'regenerate',assetId:'atelier-bay',params:{openingWidth:1.44}},{op:'material',id:base+2,properties:{surfaceStrength:.6}}],'检查门洞参数与共享材质事务');
  const shared=await fetch('http://127.0.0.1:4317/api/state').then(r=>r.json());assert.equal(shared.project.version,changed.version);assert.equal(shared.project.assets['atelier-bay'].template.params.openingWidth,1.44);report.checks.push('HTTP 权威文档读回与 MCP 版本及门洞一致');
  await tx([{op:'undo'}],'撤销检查批次');const after=await fetch('http://127.0.0.1:4317/api/state').then(r=>r.json());
  for(const a of Object.keys(atelierCatalog))assert.equal(digest(before.project.assets[a].chunks),digest(after.project.assets[a].chunks));assert.deepEqual(after.project.materials,before.project.materials);report.checks.push('一次撤销恢复四母版格子及完整材质');
  report.saved=await call('save_project',{filename:'atelier-workbench-with-house.ysvox.json'});
 }finally{await client.close();}
}
report.finishedAt=new Date().toISOString();await writeFile('artifacts/atelier/geometry-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({assets,checks:report.checks,native:'projects/atelier-details.ysvox.json'},null,2));
