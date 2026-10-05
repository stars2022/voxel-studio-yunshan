import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Engine,validateProject} from '../src/core/engine';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {geometryData} from '../src/core/sky';
import {rotateY,type Project,type Assembly,type Command} from '../src/core/types';
import {productionProject} from '../src/production/style';
import {parseCatalogCSV} from '../src/core/catalog';
import {makeArchitectureAssembly,outfitAssemblyIds} from '../src/production/atlas-architecture-assemblies';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {outfitHash} from '../src/production/outfit-components';
import {referenceFinishCommands} from '../src/production/reference-finish';
import {architectureClosed,architectureComponents} from '../scripts/lib/architecture-audit';
import {nativeIslandAttachments} from '../src/production/mixed-review';
import {outfitAudit} from '../scripts/lib/outfit-audit';

const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r])),cache=new Map<string,{p:Project;a:Assembly}>();
function make(id:string){if(!cache.has(id)){const p=productionProject(id);p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};const a=makeArchitectureAssembly(p,id,id.toLowerCase(),id);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);cache.set(id,{p,a});}return cache.get(id)!;}
const commit=(e:Engine,commands:Command[])=>{const req={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...req,dryRun:true});return e.execute({...req,previewToken:dry.previewToken});};

test('M057 twelve reusable templates retain closed oriented surfaces, attached native components and actual rigs',()=>{
 assert.equal(outfitAssemblyIds.length,12);for(const id of outfitAssemblyIds){const{p,a}=make(id);assert.equal(a.source!.notCatalogBase,true);for(const asset of Object.values(p.assets)){if(asset.meshes?.length){assert.ok(architectureClosed(asset).every(r=>r.closed&&r.oriented),id+' '+asset.id);assert.ok(nativeIslandAttachments({...asset,meshes:architectureComponents(asset)}).every(r=>r.attached),id+' '+asset.id);}}}
});

test('M057 every complete standing wearer has clear actual triangle pairs, real accessory contacts and soles at ground',()=>{
 let pairs=0,contacts=0;for(const id of outfitAssemblyIds){const{p,a}=make(id),audit=outfitAudit(p,a);assert.ok(audit.pairs.every(r=>r.contained===0&&r.crossing===0),id);assert.ok(audit.contactsPassed,id+' '+JSON.stringify(audit.contacts));assert.ok(audit.shoeGroundPassed&&audit.rigsRetained&&audit.nonphysical,id);assert.ok(Math.abs(audit.minY)<1e-8,id);pairs+=audit.pairs.length;contacts+=audit.contacts.length;}assert.ok(pairs>450);assert.ok(contacts>=27);
});

test('M057 canonical sources and every fitting provenance edge remain exact; only declared native waist cells move',()=>{
 let shifted=0,retained=0;for(const id of outfitAssemblyIds){const{p}=make(id);for(const a of Object.values(p.assets)){if(a.source?.kind==='catalog-recipe'){const original=makeCatalogAsset(String(a.source.catalogId),a.name,a.id,p.styles.yunshan,a.source.parameters as any);assert.deepEqual(geometryData(a),geometryData(original));for(const k of['origin','cellSize','ports','openings','parts']as const)assert.deepEqual(a[k],original[k]);retained++;}
  const parent=a.source?.sourceAssetId;if(parent){const old=p.assets[String(parent)];assert.ok(old);assert.equal(a.source!.sourceGeometrySHA256,outfitHash(geometryData(old)));const fitted=a.source!.retainedAuthorSource as any;if(fitted?.nativeMoves){const before=new Grid(old.chunks),after=new Grid(a.chunks),moves=new Map(fitted.nativeMoves.map((r:any)=>[r.from.join(','),r]));assert.equal(before.count,after.count);for(const[cell,m]of before.cells()){const move=moves.get(cell.join(','))as any;assert.equal(after.get(move?move.to:cell),m);if(move){assert.equal(move.material,m);shifted++;}}assert.equal(a.ports.find(p=>p.id==='waist')!.position[1],fitted.waistPortY);}else if(fitted?.preservedNativeCells)assert.deepEqual(a.chunks,old.chunks);
  }
 }}assert.ok(retained>100);assert.ok(shifted>0);
});

test('M057 far resident derives the same near identity without face, hands, hair or knee seams',()=>{
 const{p,a}=make('CHAR-016'),far=p.assets[a.instances[0].assetId],o=a.source!.outfit as any;assert.equal(a.instances.length,1);assert.equal(o.sourceIdentity,'CHAR-001');assert.ok(o.samePositionAndHeading);assert.equal(new Grid(far.chunks).count,0);assert.equal(far.rig,undefined);assert.ok(o.farTriangles<o.nearTriangles*.25);assert.equal(far.meshes!.filter(m=>m.name.includes('连续整腿')).length,2);assert.ok(far.meshes!.every(m=>!/(发束|眉|眼|鼻|耳|手|指|原生)/.test(m.name)));assert.ok(far.source!.sourceAssemblyDefinition);assert.ok((a.source!.dependencies as string[]).includes('CHAR-001'));assert.equal(a.source!.originalRuntimeBound,false);
});

test('M057 public creation preserves foreign material IDs and rolls back invalid states with a single undo',()=>{
 const p=newProject();p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};p.materials[74]={...p.materials[1],id:74,name:'foreign-74'};const e=new Engine(p);commit(e,[{op:'produceCatalogAssembly',catalogId:'CHAR-151',id:'wearer',place:true}]);assert.equal(e.project.materials[74].name,'foreign-74');assert.equal(Object.keys(e.project.styles.yunshan).length,512);const before=outfitHash(e.project);assert.throws(()=>commit(e,[{op:'material',id:e.project.styles.yunshan.travelCanvas,properties:{color:'#ff0000'}},{op:'produceCatalogAssembly',catalogId:'CHAR-151',id:'bad',params:{bodyFit:'adultB'}}]));assert.equal(outfitHash(e.project),before);commit(e,[{op:'undo'}]);for(const k of['assets','instances','assemblies','materials','styles']as const)assert.deepEqual(e.project[k],p[k]);
});

test('M057 all public quarter turns and independent role palettes preserve native and continuous authority',()=>{
 for(const id of outfitAssemblyIds){const{p,a}=make(id),e=new Engine(p),before=outfitHash(p.assets);commit(e,[{op:'instantiateAssembly',assemblyId:a.id,prefix:'quarter',position:[4,0,4],rotation:1}]);assert.equal(outfitHash(e.project.assets),before);for(const i of a.instances)assert.deepEqual(e.project.instances['quarter-'+i.id].position,rotateY(i.position,1).map((v,k)=>v+[4,0,4][k]));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.instances,p.instances);}
 const{p}=make('CHAR-158'),e=new Engine(p);commit(e,[...referenceFinishCommands(p),{op:'palette',name:'参考材质试作'}]);for(const k of['assets','instances','assemblies','styles']as const)assert.deepEqual(e.project[k],p[k]);assert.equal(Object.keys(e.project.palettes['参考材质试作']).length,512);commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,p.materials);
});

test('M057 three civic role contracts share their declared garment geometry without becoming new human masters',()=>{
 const geometry=(id:string)=>{const{p,a}=make(id),o=a.source!.outfit as any;assert.equal(o.clothing,'CHAR-137');assert.equal(o.accessory,'CHAR-150');assert.ok(o.sharedGeometryFamily);assert.equal(a.source!.ageSeedRoleBinding,false);return a.instances.map(i=>({geometry:geometryData(p.assets[i.assetId]),position:i.position,rotation:i.rotation}));};assert.deepEqual(geometry('CHAR-158'),geometry('CHAR-159'));assert.deepEqual(geometry('CHAR-159'),geometry('CHAR-160'));
});

test('M057 independently produced outfit documents agree on every shared component and metadata field',()=>{
 const seen=new Map<string,unknown>();for(const id of outfitAssemblyIds)for(const asset of Object.values(make(id).p.assets)){if(seen.has(asset.id))assert.deepEqual(asset,seen.get(asset.id),'Shared component conflict '+asset.id);else seen.set(asset.id,asset);}assert.ok(seen.size>40);
});
