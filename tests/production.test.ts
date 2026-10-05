import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {newProject} from '../src/core/materials';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {parseCatalogCSV} from '../src/core/catalog';
import {makeLifeAsset,makeFlowerAsset,lifeRecipes} from '../src/production/life';
import {lifeLayouts,layoutDependencies,nativeLifeId,makeLifeAssembly} from '../src/production/layouts';
import type {Command} from '../src/core/types';
import {referenceFurniture} from '../src/production/reference-furniture';
import {productionProject} from '../src/production/style';
import {checkGeometry} from '../src/core/checks';

const csv=await readFile(new URL('../projects/catalog/city-assets.csv',import.meta.url),'utf8'),rows=parseCatalogCSV(csv);
const base=()=>{const p=productionProject('test');p.catalog={sourceName:'city-assets.csv',importedAt:'2026-10-02',entries:Object.fromEntries(rows.map(e=>[e.id,structuredClone(e)]))};return p;};
function commit(e:Engine,commands:Command[]){const env={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...env,dryRun:true});return e.execute({...env,previewToken:dry.previewToken});}

test('all 161 LIFE base entries have distinct real voxel geometry, valid materials and lossless native round trips',()=>{
 const entries=rows.filter(e=>e.id.startsWith('LIFE-')&&e.source['条目类型']==='基础组件'),hashes=new Set<string>();assert.equal(entries.length,161);assert.equal(Object.keys(lifeRecipes).length,161);
 for(const e of entries){const p=base(),a=makeLifeAsset(e.id,e.source['中文名称'],nativeLifeId(Number(e.id.slice(5))),p.styles.yunshan),g=new Grid(a.chunks);p.assets[a.id]=a;validateProject(p);assert.ok(g.count>0);assert.ok(g.count<1_000_000);assert.deepEqual(new Grid(g.serialize()).serialize(),a.chunks);const h=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(h),e.id+' duplicates earlier geometry');hashes.add(h);assert.ok(a.parts.length>=2);}
});

test('cabinets, sink, bowls, toilet, bathtub and scanner retain their real cavities',()=>{
 const check=(n:number,p:number[],filled=false)=>{const a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),'test','test',productionProject('test').styles.yunshan),g=new Grid(a.chunks);assert.equal(!!g.get(p.map(v=>Math.floor(v/a.cellSize)) as any),filled,'LIFE-'+n+' at '+p);};
 check(6,[.6,1,.3]);check(6,[.02,1,.3],true);check(40,[.33,.12,.24]);check(40,[.33,.01,.24],true);check(46,[.1,.06,.1]);check(52,[.2,.39,.26]);check(53,[.39,.4,.82]);check(53,[.39,.04,.82],true);check(122,[.95,.95,.7]);
});

test('catalog batch generation has preview, CAS, idempotency, atomic rollback and a single undo',()=>{
 const e=new Engine(base()),env={expectedVersion:0,requestId:'production-batch',commands:[{op:'produceCatalogAsset',catalogId:'LIFE-001',id:'life-001'},{op:'produceCatalogAsset',catalogId:'LIFE-018',id:'life-018'}]};
 const dry=e.execute({...env,dryRun:true});assert.ok(dry.modifiedVoxels>4096);assert.equal(Object.keys(e.project.assets).length,0);assert.throws(()=>e.execute(env),/dry-run/);const done=e.execute({...env,previewToken:dry.previewToken});assert.deepEqual(e.execute(env),done);assert.throws(()=>e.execute({...env,requestId:'stale'}),/版本冲突/);
 assert.equal(e.project.catalog!.entries['LIFE-001'].stage,'modeling');const saved=JSON.stringify(e.project);assert.throws(()=>commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-053',id:'tub'},{op:'produceCatalogAsset',catalogId:'LIFE-215',id:'fake-material'}]));assert.equal(JSON.stringify(e.project),saved);
 commit(e,[{op:'undo'}]);assert.equal(Object.keys(e.project.assets).length,0);assert.equal(e.project.catalog!.entries['LIFE-001'].stage,'planned');commit(e,[{op:'redo'}]);assert.equal(Object.keys(e.project.assets).length,2);
});

test('all 51 room layouts reference native masters, snap to grids and count placements separately',()=>{
 const p=base();for(const n of Object.keys(lifeRecipes)){const id=nativeLifeId(Number(n));p.assets[id]=makeLifeAsset('LIFE-'+n.padStart(3,'0'),id,id,p.styles.yunshan);}p.assets['support-flower']=makeFlowerAsset(p.styles.yunshan);
 assert.equal(Object.keys(lifeLayouts).length,51);
 for(const n of Object.keys(lifeLayouts)){const id='LIFE-'+n.padStart(3,'0'),a=makeLifeAssembly(p,id,id.toLowerCase(),id);assert.ok(a.instances.length>0);assert.deepEqual([...new Set(a.instances.map(i=>i.assetId))].sort(),layoutDependencies(Number(n)).sort());for(const i of a.instances){assert.ok(p.assets[i.assetId]);assert.ok(i.position.every(v=>Math.abs(v/p.assets[i.assetId].cellSize-Math.round(v/p.assets[i.assetId].cellSize))<1e-8));}p.assemblies??={};p.assemblies[a.id]=a;}
 validateProject(p);assert.equal(Object.keys(p.assets).length,162);
 const e=new Engine(base());assert.throws(()=>commit(e,[{op:'produceCatalogAssembly',catalogId:'LIFE-205',id:'philosophyroom'}]),/缺少母版/);assert.equal(Object.keys(e.project.assemblies??{}).length,0);
});

test('width regeneration rebuilds supports and planks; unknown and unverified dimensions are rejected',()=>{
 const e=new Engine(base());commit(e,[{op:'produceCatalogAsset',catalogId:'LIFE-016',id:'desk'},{op:'instance',id:'desk-placement',assetId:'desk',position:[0,0,0]}]);const old=e.project.assets.desk,oldW=new Grid(old.chunks).bounds()!.max[0];
 const result=commit(e,[{op:'rebuildCatalogAsset',assetId:'desk',params:{width:1.8}}]);assert.ok(new Grid(e.project.assets.desk.chunks).bounds()!.max[0]>oldW);assert.deepEqual(result.affectedInstances,['desk-placement']);assert.equal(e.project.instances['desk-placement'].assetId,'desk');
 for(const params of[{width:0},{width:Infinity},{depth:.7},{shell:'rm'}])assert.throws(()=>makeLifeAsset('LIFE-016','test','test',e.project.styles.yunshan,params as any));assert.throws(()=>makeLifeAsset('LIFE-043','test','test',e.project.styles.yunshan,{width:1}));
});

test('dining chairs face the table without intersecting its bounding volume',()=>{
 const table={min:[.7,0,-.2],max:[2.1,.74,.62]},chairs=lifeLayouts[61].filter(p=>p[0]===22);assert.equal(chairs.length,4);
 for(const[,x,y,z,q]of chairs){const lo=q===2?[x-.44,y,z-.46]:[x,y,z],hi=q===2?[x,y+.88,z]:[x+.44,y+.88,z+.46];assert.ok(lo.some((v,i)=>v>=table.max[i]||hi[i]<=table.min[i]));assert.equal(q===2,z<0);}
});

test('twelve reference arrangements reuse masters and have no intersecting solid cells or unsupported parts',()=>{
 const reusedBooks:string[]=[];
 for(const item of referenceFurniture){const p=productionProject(item.name);
  for(const[n,x,y,z,q]of item.items){const id=nativeLifeId(Number(n));p.assets[id]??=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,p.styles.yunshan);const iid=item.id+'-'+Object.keys(p.instances).length;p.instances[iid]={id:iid,assetId:id,name:id,position:[x,y,z],rotation:q??0,parent:null};if(n===106)reusedBooks.push(id);}
  validateProject(p);const r=checkGeometry(p);assert.deepEqual(r.collisions,[],item.id);assert.deepEqual(r.unsupported,[],item.id);assert.deepEqual(r.warnings,[],item.id);
 }
 assert.equal(reusedBooks.length,3);assert.equal(new Set(reusedBooks).size,1);
});

test('reference frames preserve arm openings, drawer knee space and a true cable aperture without optical effects',()=>{
 const p=productionProject('检查'),point=(n:number,v:number[])=>{const a=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),'test','test',p.styles.yunshan);return new Grid(a.chunks).get(v.map(x=>Math.floor(x/a.cellSize)) as any);};
 assert.equal(point(10,[.04,.42,.22]),0,'sofa arm opening');assert.equal(point(10,[.04,.56,.22]),p.styles.yunshan.wood,'arm upper rail');
 assert.equal(point(16,[.7,.72,.62]),0,'cable aperture through tabletop');assert.equal(point(16,[.9,.45,.35]),0,'knee space');
 assert.equal(point(15,[.55,.045,.3]),p.styles.yunshan.wall,'stone insert remains visible at upper surface');
 for(const m of Object.values(p.materials)){assert.equal(m.surface,'none');assert.equal(m.intensity,0);assert.equal(m.opacity,1);}
});
