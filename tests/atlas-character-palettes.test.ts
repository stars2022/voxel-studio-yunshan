import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv';
import {Engine,validateProject} from '../src/core/engine';
import {toolDefinitions} from '../src/core/schema';
import {productionProject} from '../src/production/style';
import {parseCatalogCSV} from '../src/core/catalog';
import type {Project,Command} from '../src/core/types';
import {makeAgeVariant} from '../src/production/age-variants';
import {makeCharacterPalette} from '../src/production/character-palettes';
import {characterPaletteIds,characterPaletteForms,characterPaletteSpec} from '../src/production/character-palette-spec';
import {characterPaletteFinishCommands} from '../src/production/character-palette-finish';
import {auditAgeVariant} from '../scripts/lib/age-variant-audit';
import {auditCharacterPalette} from '../scripts/lib/character-palette-audit';
import {outfitHash as hash} from '../src/production/outfit-components';
import {assemblyBoundsM} from '../src/production/assembly-geometry';
const catalog=Object.fromEntries(parseCatalogCSV(await readFile('projects/catalog/city-assets.csv','utf8')).map(r=>[r.id,r]));
const project=()=>{const p=productionProject('M062–M064 age/palette');p.catalog={sourceName:'catalog',importedAt:'test',entries:structuredClone(catalog)};return p;};
const commit=(e:Engine,commands:Command[])=>{const r={expectedVersion:e.project.version,requestId:crypto.randomUUID(),commands},dry=e.execute({...r,dryRun:true});return e.execute({...r,previewToken:dry.previewToken});};

test('M062 independent school/teen/adult bodies give exact1.2/1.6/1.8mheights, unchanged age heads, rigid5mmislands and real neck/sole contact',()=>{
 const expected=[['CHAR-019',1.2,.215],['CHAR-020',1.6,.23],['CHAR-021',1.8,.24]]as const;
 for(const[id,height,head]of expected){const p=project(),a=makeAgeVariant(p,id,id.toLowerCase(),id);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);const check=auditAgeVariant(p,a);assert.ok(check.passed);assert.equal(check.actualHeightM,height);assert.equal(check.unscaledHeadHeightM,head);assert.equal(assemblyBoundsM(p,a).min[1],0);assert.equal(check.neckSolidOverlapSamples,9);}
});

test('All24source colour references and36finite forms preserve exact native/continuous/rig geometry and independently scoped material purpose',()=>{
 let forms=0;for(const id of characterPaletteIds)for(const params of characterPaletteForms(id)){const p=project(),a=makeCharacterPalette(p,id,id.toLowerCase(),id,params);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);const audit=auditCharacterPalette(p,a);assert.ok(audit.passed);assert.ok(Object.values(catalog[id].source).some(v=>v.includes(audit.sourceRGB)),id+' color in actual sourceCSV');forms++;}assert.equal(characterPaletteIds.length,24);assert.equal(forms,36);
});

test('Five simultaneous skin colours keep actual face/hands/feet consistent and source001unchanged; same-purpose finish swap changes only selected appearances',()=>{
 const p=project();for(const id of ['CHAR-030','CHAR-031','CHAR-032','CHAR-033','CHAR-034']){const a=makeCharacterPalette(p,id,id.toLowerCase(),id);p.assemblies??={};p.assemblies[a.id]=a;for(const i of a.instances)p.instances[i.id]={...i,position:[i.position[0]+(Number(id.slice(-3))-30)*1.2,i.position[1],i.position[2]]};assert.ok(auditCharacterPalette(p,a).passed);}
 const original=structuredClone(p),e=new Engine(p);commit(e,characterPaletteFinishCommands(e.project));for(const a of Object.values(e.project.assemblies!))assert.ok(auditCharacterPalette(e.project,a).passed);assert.equal(hash(e.project.assets),hash(original.assets));assert.equal(hash(e.project.styles),hash(original.styles));
 const before=structuredClone(e.project),skin=e.project.styles['character-palette-char-030'].skinSurface;commit(e,[{op:'definePalette',name:'one person',materials:{[skin]:{color:'#102030'}}},{op:'palette',name:'one person'}]);assert.equal(e.project.materials[skin].color,'#102030');for(const[id,m]of Object.entries(before.materials))if(Number(id)!==skin)assert.deepEqual(e.project.materials[id],m);assert.equal(hash(e.project.assets),hash(before.assets));commit(e,[{op:'undo'}]);assert.deepEqual(e.project.materials,before.materials);commit(e,[{op:'undo'}]);for(const key of['assets','styles','materials','palettes']as const)assert.equal(hash(e.project[key]),hash(original[key]));
});

test('Official colour and age schema preserves occupied preferred IDs, rejects cross-family parameters and atomically undoes complete creation',()=>{
 const schema=new Ajv({strict:false}).compile(toolDefinitions.find(t=>t.name==='edit_transaction')!.inputSchema),p=project();for(const id of[720,788,789])p.materials[id]={...p.materials[p.styles.yunshan.skinSurface],id,name:'foreign '+id,color:'#123456'};const e=new Engine(p),original=structuredClone(p);
 const commands=[{op:'produceCatalogVariant',catalogId:'CHAR-030',id:'skin',place:true},{op:'produceCatalogVariant',catalogId:'CHAR-047',id:'hair',place:true},{op:'produceCatalogVariant',catalogId:'CHAR-050',id:'coat',place:true,params:{characterTone:'char-050',garment:2}},{op:'produceCatalogVariant',catalogId:'CHAR-020',id:'teen',place:true,params:{ageBand:'teen'}}];assert.ok(schema({expectedVersion:0,requestId:'schema-check',commands}),JSON.stringify(schema.errors));commit(e,commands);
 for(const id of[720,788,789])assert.deepEqual(e.project.materials[id],original.materials[id]);assert.notEqual(e.project.styles['character-palette-char-030'].skinSurface,720);assert.notEqual(e.project.styles['character-palette-char-047'].hairMass,788);assert.notEqual(e.project.styles['character-palette-char-047'].hairRidge,789);
 for(const c of[{op:'produceCatalogVariant',catalogId:'CHAR-031',id:'bad',params:{characterTone:'char-030'}},{op:'produceCatalogVariant',catalogId:'CHAR-043',id:'bad',params:{garment:2}},{op:'produceCatalogVariant',catalogId:'CHAR-035',id:'bad',params:{garment:3}},{op:'produceCatalogVariant',catalogId:'CHAR-020',id:'bad',params:{characterTone:'char-030'}},{op:'produceCatalogAsset',catalogId:'CHAR-030',id:'bad'}]){const before=hash(e.project);assert.throws(()=>commit(e,[{op:'material',id:720,properties:{color:'#ffffff'}},c]));assert.equal(hash(e.project),before);}
 commit(e,[{op:'undo'}]);for(const key of['assets','assemblies','instances','materials','styles','palettes','catalog']as const)assert.equal(hash(e.project[key]??null),hash(original[key]??null));
});
