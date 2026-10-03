import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {meshAsset} from '../src/core/mesh';
import {architectureDefinitions,architectureRevision} from '../src/production/architecture';
import {productionProject} from '../src/production/style';
import {exportProject} from '../src/export/exporter';
import type {Project} from '../src/core/types';

const start=performance.now(),run='architecture-'+new Date().toISOString().replace(/\D/g,'').slice(0,14),root=path.resolve('projects'),out=path.join(root,'production',run),artifacts=path.resolve('artifacts/architecture');
await mkdir(out,{recursive:true});await mkdir(artifacts,{recursive:true});
const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex'),nativeFiles:any[]=[],items:any[]=[],studies:any[]=[],geometry=new Set<string>(),galleries={A:productionProject('云山 · 建筑主体十二件 · 素色结构'),B:productionProject('云山 · 立面细部十六件 · 素色结构')};
async function save(p:Project,file:string){validateProject(p);const data=JSON.stringify(p);await writeFile(path.join(root,file),data,{flag:'wx'});nativeFiles.push({file,bytes:Buffer.byteLength(data),sha256:hash(data)});}
for(const[code,name,size,features]of architectureDefinitions){
 const t=performance.now(),id='arch-'+code.toLowerCase(),engine=new Engine(productionProject(`${code} ${name} · 原生体素`));
 const env={expectedVersion:0,requestId:crypto.randomUUID(),label:'从参考规则生成 '+code,commands:[{op:'createAsset',id,name:code+' '+name,template:'kit-'+code.toLowerCase(),cellSize:.02},{op:'instance',id:'display-'+id,assetId:id,position:[0,0,0]}]};
 const dry=engine.execute({...env,dryRun:true});engine.execute({...env,previewToken:dry.previewToken});engine.project.selection={assetId:id,region:null,partId:null};
 const p=engine.project,a=p.assets[id],g=new Grid(a.chunks),sha=hash(JSON.stringify(a.chunks));assert.ok(!geometry.has(sha),code+' duplicates another reference geometry');geometry.add(sha);
 const meshStart=performance.now(),triangles=meshAsset(a,p.materials).reduce((n,b)=>n+b.indices.length/3,0),meshingMs=performance.now()-meshStart;
 const file=run+'-'+code+'.ysvox.json';await save(p,file);
 const exportStart=performance.now();await exportProject(p,path.join(out,'exports',code),id);
 const group=code.startsWith('A')?'A':'B',gallery=galleries[group],j=Number(code.slice(1))-1;
 gallery.assets[id]=structuredClone(a);gallery.instances['gallery-'+id]={id:'gallery-'+id,name:a.name,assetId:id,position:[j%4*5.2,0,Math.floor(j/4)*4.4],rotation:0,parent:null};
 const item={code,name,assetId:id,file,features,cellSizeM:a.cellSize,designDimensionsM:size,actualBoundsCells:g.bounds(),voxels:g.count,triangles,sha256:sha,meshingMs,exportMs:performance.now()-exportStart,totalMs:performance.now()-t,parts:a.parts.length,ports:a.ports.length};items.push(item);
 studies.push({id:'architecture-'+code,name:code+' '+name,file,assetIds:[id],group:group==='A'?'建筑主体 A01–A12':'立面细部 B01–B16',note:features+'；按参考人工规则建模，尺寸与背面为设计值，未人工美术验收。'});
 console.log(`${code} ${name}: ${g.count} cells, ${triangles} triangles, ${item.totalMs.toFixed(0)} ms`);
}
for(const group of['A','B']as const){
 const p=galleries[group],file=run+'-gallery-'+group+'.ysvox.json';await save(p,file);
 studies.unshift({id:'architecture-gallery-'+group,name:group==='A'?'A 建筑主体 · 十二件总览':'B 立面细部 · 十六件总览',file,assetIds:Object.keys(p.assets),group:group==='A'?'建筑主体 A01–A12':'立面细部 B01–B16',note:'相同28件中的展示实例，不增加基础母版数量。'});
}
const sources=[];for(const filename of['庭院建筑模块图鉴-2.png','立面与细部组件-1.png']){const data=await readFile(path.join('参考',filename));sources.push({filename,bytes:data.length,sha256:hash(data)});}
const metrics={environment:{cpu:os.cpus()[0].model,memoryBytes:os.totalmem(),os:os.release(),arch:os.arch(),node:process.version},generationAndExportMs:performance.now()-start,nativeVoxels:items.reduce((n,i)=>n+i.voxels,0),triangles:items.reduce((n,i)=>n+i.triangles,0),nativeBytes:nativeFiles.reduce((n,i)=>n+i.bytes,0)};
const index={format:'yunshan.architecture-references',version:1,generatorRevision:architectureRevision,run,createdAt:new Date().toISOString(),counts:{designs:28,sourceSheets:2,galleryInstances:28,accepted:0},sources,studies,items,metrics};
await writeFile(path.join(out,'index.json'),JSON.stringify(index,null,2));await writeFile(path.join(out,'native-manifest.json'),JSON.stringify(nativeFiles,null,2));
try{await copyFile(path.join(root,'architecture-index.json'),path.join(out,'previous-index.json'));}catch(e:any){if(e.code!=='ENOENT')throw e;}
await writeFile(path.join(root,'architecture-index.json'),JSON.stringify(index));await writeFile(path.join(artifacts,'latest.json'),JSON.stringify({run,out,indexFile:path.join(out,'index.json'),nativeFiles,metrics},null,2));
console.log(JSON.stringify({run,out,...index.counts,...metrics},null,2));
