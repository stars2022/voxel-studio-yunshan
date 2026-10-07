import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Engine,validateProject} from '../src/core/engine';
import {productionProject} from '../src/production/style';
import {parseCatalogCSV} from '../src/core/catalog';
import {m059BuildingVariantIds,m060BuildingVariantIds,buildingVariantForms,buildingVariantSpec} from '../src/production/building-variant-spec';
import {makeBuildingVariant} from '../src/production/building-variants';
import {variantFloor} from '../src/production/building-variant-components';
import {assemblyBoundsM,assemblyGeometryData} from '../src/production/assembly-geometry';
import {outfitHash as hash} from '../src/production/outfit-components';
import {auditBuildingVariant} from '../scripts/lib/building-variant-audit';
import {architectureClosed,architecturePointRoles} from '../scripts/lib/architecture-audit';
import {referenceFinishCommands} from '../src/production/reference-finish';
import type {Command,Project} from '../src/core/types';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(e=>[e.id,e]));
function source(){const p=productionProject('M060 test');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;}
function make(id:string,params:Record<string,string|number>={}){const p=source(),a=makeBuildingVariant(p,id,id.toLowerCase(),catalog[id].source['中文名称'],params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));return{p,a};}
function commit(e:Engine,commands:Command[]){const request={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...request,dryRun:true});return e.execute({...request,previewToken:dry.previewToken});}

test('M060 source dimensions include32forms, fixed interchange and a supplied main-seed fixture',()=>{
 assert.deepEqual(m060BuildingVariantIds.map(id=>buildingVariantForms(id).length),[2,14,6,3,3,2,2]);
 const fixed=buildingVariantSpec('BUILT-034',{buildingPlan:'core-interchange'});assert.deepEqual([fixed.widthM,fixed.depthM,fixed.floors,fixed.floorHeightM],[60,40,6,4.2]);assert.equal(fixed.parameters.sizeCase,'fixed');
 const terminal=buildingVariantSpec('BUILT-035',{buildingPlan:'known-main-seed'});assert.deepEqual([terminal.widthM,terminal.depthM,terminal.floors*terminal.floorHeightM],[125.6,70.4,36]);assert.equal(terminal.originalSeedAlgorithmBound,false);
 const star=buildingVariantSpec('BUILT-036');assert.ok(Math.abs(star.floors*star.floorHeightM-92.4)<1e-8);
 const designs:Record<string,number[]>={'BUILT-031':[42,34,3.8],'BUILT-032':[44,36,4.4],'BUILT-033':[50,38,3.8],'BUILT-034':[44,32,4.2],'BUILT-035':[120,70,6],'BUILT-036':[130,90,6.6],'BUILT-037':[36,22,3.8]};
 for(const id of m060BuildingVariantIds)for(const params of buildingVariantForms(id).filter(p=>p.sizeCase!=='fixed')){const d=buildingVariantSpec(id,params),[w,z,h]=designs[id],scale=params.sizeCase==='compact'?.94:1.06;assert.ok(Math.abs(d.widthM-Math.round(w*scale/.4)*.4)<1e-8);assert.ok(Math.abs(d.depthM-Math.round(z*scale/.4)*.4)<1e-8);assert.equal(d.floorHeightM,h);}
});

test('M060 all32actual forms have closed connected parts, supported floors and roofs, clear stairs and wing links',()=>{
 let count=0,routes=0,links=0;
 for(const id of m060BuildingVariantIds)for(const params of buildingVariantForms(id)){
  const{p,a}=make(id,params),d=a.source!.buildingVariant as any;validateProject(p);const r=auditBuildingVariant(p,a);assert.ok(r.passed,id+' '+JSON.stringify(params));count++;routes+=r.routes.length;links+=r.links.length;
  const floor=assemblyBoundsM(p,{instances:a.instances.filter(i=>(a.source!.instanceGroups as any)[i.id]==='ground-floor')});assert.ok(Math.abs(floor.max[0]-floor.min[0]-d.widthM)<1e-7);assert.ok(Math.abs(floor.max[2]-floor.min[2]-d.depthM)<1e-7);
  for(const route of d.stairRoutes){assert.ok(Math.abs(route.points[0][1]-d.levelTopsM[route.level]-.2)<1e-8);assert.ok(Math.abs(route.points.at(-1)[1]-d.levelTopsM[route.level+1])<1e-8);}
 }
 assert.equal(count,32);assert.ok(routes>4000);assert.ok(links>4000);
});

test('M060 medical floors and continuous roof retain real H notches and original medical beds',()=>{
 const{p,a}=make('BUILT-033'),d=a.source!.buildingVariant as any,plan=d.retainedParentAssembly.source.floorPlan;
 assert.equal(plan.variant,'medical');assert.equal(plan.fixture,'LIFE-123');assert.equal(plan.nz,5);assert.ok(a.instances.some(i=>i.assetId==='source-life-123'));assert.ok(!a.instances.some(i=>i.assetId==='source-life-151'));
 const cells=new Set(d.levels[0].map((c:number[])=>c.join(',')));assert.ok(!cells.has('2,0')&&!cells.has('2,4')&&cells.has('2,2'));for(const upper of d.levels.slice(1))assert.deepEqual(new Set(upper.map((c:number[])=>c.join(','))),cells);
 const roofInstances=a.instances.filter(i=>(a.source!.instanceGroups as any)[i.id]==='roof');assert.equal(roofInstances.length,1);const roof=p.assets[roofInstances[0].assetId],[w,z]=d.cellDimensionsM;
 for(const cell of[[2.5,.5],[2.5,4.5]])assert.deepEqual(architecturePointRoles(p,roof,[cell[0]*w,.15,cell[1]*z]),[]);
 assert.ok(architecturePointRoles(p,roof,[2.5*w,.15,2.5*z]).includes(p.styles.yunshan.roof));assert.ok(architectureClosed(roof).every(r=>r.closed&&r.oriented));
});

test('M060 public transactions accept new plan-dependent forms and roll back invalid combinations',()=>{
 const p=source(),e=new Engine(p);
 for(const [id,params]of[['BUILT-034',{buildingPlan:'core-interchange'}],['BUILT-035',{buildingPlan:'known-main-seed'}],['BUILT-032',{buildingPlan:'bank-market',floors:15}]]as const){commit(e,[{op:'produceCatalogVariant',catalogId:id,id:'actual',place:true,params}]);assert.equal(e.project.assemblies!.actual.source!.kind,'catalog-variant');commit(e,[{op:'undo'}]);for(const key of['assets','assemblies','instances','materials','styles']as const)assert.equal(hash(e.project[key]??null),hash(p[key]??null));}
 for(const [id,params]of[['BUILT-034',{buildingPlan:'core-interchange',sizeCase:'compact'}],['BUILT-035',{buildingPlan:'known-main-seed',sizeCase:'expanded'}],['BUILT-032',{buildingPlan:'bank-other',floors:15}],['BUILT-032',{buildingPlan:'bank-market',floors:9}],['BUILT-033',{buildingPlan:'bank-other'}]]as const){const before=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:p.styles.yunshan.roof,properties:{color:'#ff0000'}},{op:'produceCatalogVariant',catalogId:id,id:'bad',params}]));assert.equal(hash(e.project),before);}
});

test('M060 fractional edge paving omits zero-width cut tiles and retains the continuous bearing slab',()=>{
 const p=source(),a=variantFloor(p,'edge',7.866666666666667,1.62);assert.ok(architectureClosed(a).every(r=>r.closed&&r.oriented));assert.ok(architecturePointRoles(p,a,[.1,.17,1.61]).includes(p.styles.yunshan.mortar));
});

test('M060 extension preserves every M059 default placed geometry and original parent source data',async()=>{
 for(const id of m059BuildingVariantIds){const saved=JSON.parse(await readFile('projects/atlas-20261007021355-'+id.toLowerCase()+'.ysvox.json','utf8'))as Project,{p,a}=make(id);assert.equal(hash(assemblyGeometryData(p,a)),hash(assemblyGeometryData(saved,saved.assemblies![a.id])));assert.equal(hash(a.source!.buildingVariant),hash(saved.assemblies![a.id].source!.buildingVariant));}
 const{p,a}=make('BUILT-033'),e=new Engine(p);commit(e,[...referenceFinishCommands(p),{op:'palette',name:'参考材质试作'}]);assert.equal(hash(e.project.assets),hash(p.assets));assert.equal(hash(e.project.assemblies),hash(p.assemblies));commit(e,[{op:'undo'}]);assert.equal(hash(e.project.materials),hash(p.materials));
});
