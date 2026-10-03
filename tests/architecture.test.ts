import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {architectureDefinitions} from '../src/production/architecture';
import {generateTemplate} from '../src/core/templates';
import {productionProject} from '../src/production/style';
import {Engine,validateProject} from '../src/core/engine';
import {Grid} from '../src/core/grid';
import {checkGeometry,gridComponents} from '../src/core/checks';
import {validRegion,type Project,type Command,type V3} from '../src/core/types';

const project=(code:string,params:Record<string,number>={})=>{const p=productionProject(code),id='arch-'+code.toLowerCase();p.assets[id]=generateTemplate(id,code,'kit-'+code.toLowerCase(),params,.02,p.styles.yunshan);p.instances.one={id:'one',name:code,assetId:id,position:[0,0,0],rotation:0,parent:null};return p;};
const commit=(engine:Engine,commands:Command[])=>{const env={expectedVersion:engine.project.version,requestId:crypto.randomUUID(),commands},r=engine.execute({...env,dryRun:true});return engine.execute({...env,previewToken:r.previewToken});};
const cell=(p:Project,v:V3)=>{const a=Object.values(p.assets)[0];return new Grid(a.chunks).get(v.map(n=>Math.floor(n/a.cellSize+1e-8)) as V3);};

test('the two supplied architecture sheets produce 28 distinct editable native structures',()=>{
 const hashes=new Set<string>();assert.equal(architectureDefinitions.length,28);
 for(const[code]of architectureDefinitions){const p=project(code);validateProject(p);const a=Object.values(p.assets)[0],g=new Grid(a.chunks);assert.ok(g.count>0&&g.count<=1_000_000,code);assert.ok(a.parts.length>=2);assert.ok(a.ports.length);assert.equal(a.source!.referenceCode,code);assert.deepEqual(new Grid(JSON.parse(JSON.stringify(a.chunks))).serialize(),a.chunks);const hash=createHash('sha256').update(JSON.stringify(a.chunks)).digest('hex');assert.ok(!hashes.has(hash),code);hashes.add(hash);}
});
test('entrances, straight bridge and corner gallery retain real clear passages',()=>{
 for(const code of['A05','A09','A10','A11','B16']){
  const p=project(code),report=checkGeometry(p);assert.ok(report.openings.length,code);for(const o of report.openings){assert.equal(o.ownSolidCells,0,code);assert.equal(o.nonCollisionCells,0,code);assert.deepEqual(o.blockedBy,[]);assert.ok(o.emptyCells>0);}
 }
});
test('default architecture has no floating roof teeth, light strips, glazing or finials',()=>{
 for(const[code]of architectureDefinitions){const p=project(code),g=new Grid(Object.values(p.assets)[0].chunks);assert.deepEqual(gridComponents(g),[g.count],code+' must be face-connected');}
});
test('coarser masonry and step lamps remain attached after quantisation',()=>{
 const p=productionProject('coarse geometry');for(const type of['kit-b03','kit-a05']){const a=generateTemplate(type,type,type,{},.04,p.styles.yunshan),g=new Grid(a.chunks);assert.deepEqual(gridComponents(g),[g.count],type);}
});
test('window lattice, soil setback and roof layering are actual occupied/empty cells',()=>{
 const grille=project('B12');assert.equal(cell(grille,[.26,.26,.15]),0);assert.ok(cell(grille,[.33,.4,.15]));assert.ok(cell(grille,[.1,.4,.15]));
 const pot=project('B11');assert.equal(cell(pot,[1.2,.58,.3]),0,'air above soil');assert.equal(cell(pot,[1.2,.45,.3]),pot.styles.yunshan.soil);assert.ok(cell(pot,[.03,.54,.3]));
 const roof=project('A01'),a=Object.values(roof.assets)[0],g=new Grid(a.chunks);assert.ok([...g.cells()].some(([v,m])=>m===roof.styles.yunshan.wood&&v[1]>0),'rafters');assert.ok([...g.cells()].some(([,m])=>m===roof.styles.yunshan.energy),'ridge energy slot');
});
test('door open parameter rebuilds leaves as geometry and opens a real passage',()=>{
 const closed=project('B02'),open=project('B02',{doorOpen:1});assert.notEqual(cell(closed,[1.7,1,.14]),0);assert.equal(cell(open,[1.7,1,.14]),0);
 assert.equal(cell(closed,[1.46,1.22,.01]),closed.styles.yunshan.bronze,'left pull faces front');assert.equal(cell(closed,[1.74,1.22,.01]),closed.styles.yunshan.bronze,'right pull faces front');
 const report=checkGeometry(open);for(const o of report.openings)assert.equal(o.ownSolidCells+o.nonCollisionCells,0);
 assert.throws(()=>project('B02',{doorOpen:.5}),/doorOpen/);
});
test('MCP command path preserves CAS, preview, rollback and whole-transaction undo for the new templates',()=>{
 const e=new Engine(project('A05'));const before=structuredClone(e.project),env={expectedVersion:0,requestId:'architecture-edit',commands:[{op:'regenerate',assetId:'arch-a05',params:{openingWidth:1.6}},{op:'material',id:2,properties:{color:'#bfc8c5'}}]};
 const dry=e.execute({...env,dryRun:true});assert.equal(e.project.version,0);assert.ok(dry.modifiedVoxels>4096);assert.throws(()=>e.execute(env),/dry-run/);const done=e.execute({...env,previewToken:dry.previewToken});assert.equal(e.execute(env).version,done.version);
 assert.equal(e.project.assets['arch-a05'].template!.params.openingWidth,1.6);assert.throws(()=>e.execute({...env,requestId:'stale'}),/版本冲突/);
 const current=JSON.stringify(e.project);assert.throws(()=>commit(e,[{op:'material',id:2,properties:{color:'#ffffff'}},{op:'regenerate',assetId:'arch-a05',params:{openingWidth:20}}]),/不兼容/);assert.equal(JSON.stringify(e.project),current);
 commit(e,[{op:'undo'}]);for(const[id,a]of Object.entries(before.assets))assert.deepEqual(e.project.assets[id],{...a,version:e.project.assets[id].version});assert.deepEqual(e.project.materials,before.materials);
});
test('adjacent floor ports join on-grid without overlap; sparse part metadata does not lift edit limits',()=>{
 const p=project('B07'),e=new Engine(p);commit(e,[{op:'connect',id:'joined',assetId:'arch-b07',portId:'left',targetInstanceId:'one',targetPortId:'right',rotation:0}]);const r=checkGeometry(e.project);assert.deepEqual(r.collisions,[]);assert.deepEqual(r.warnings,[]);assert.deepEqual(e.project.instances.joined.position,[3.2,0,0]);
 const corner=project('A07'),a=Object.values(corner.assets)[0];validateProject(corner);assert.throws(()=>validRegion(a.parts[0].region),/2,000,000/);assert.throws(()=>commit(new Engine(corner),[{op:'voxels',assetId:a.id,mode:'fill',region:a.parts[0].region,material:2}]),/2,000,000/);
});
