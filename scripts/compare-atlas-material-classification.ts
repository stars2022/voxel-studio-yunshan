import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Grid} from '../src/core/grid';
import {productionProject} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import type {Project} from '../src/core/types';

// Compare the saved pre-repair native grids, never inferred screenshot colours.
const baseline=JSON.parse(await readFile('artifacts/material-classification/before-index.json','utf8'));
const saved=process.argv.includes('--saved'),current=saved?JSON.parse(await readFile('projects/atlas-production-index.json','utf8')):undefined;
const start=performance.now(),records=[];let modifiedVoxels=0,collisionChanges=0;
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
for(const row of baseline.entries){
 const before:Project=JSON.parse(await readFile('projects/'+row.file,'utf8')),old=before.assets[row.assetId];
 const entry=current?.entries.find((r:any)=>r.id===row.id),after:Project=entry?JSON.parse(await readFile('projects/'+entry.file,'utf8')):productionProject('classification audit');
 const a=entry?after.assets[row.assetId]:makeLifeAsset(row.id,old.name,row.assetId,after.styles.yunshan),g=new Grid(a.chunks),og=new Grid(old.chunks);
 assert.equal(g.count,og.count,row.id+' occupied cell count changed');assert.deepEqual(g.bounds(),og.bounds(),row.id+' bounds');assert.equal(a.cellSize,old.cellSize);assert.deepEqual(a.origin,old.origin);assert.deepEqual(a.ports,old.ports);assert.deepEqual(a.openings,old.openings);
 const changes=new Map<string,number>(),roles=Object.fromEntries(Object.entries(after.styles.yunshan).map(([r,id])=>[id,r])),oldRoles=Object.fromEntries(Object.entries(before.styles.yunshan).map(([r,id])=>[id,r])),used=new Map<string,number>();let changed=0,collisionChanged=0;
 for(const [v,m]of og.cells()){
  const next=g.get(v);assert.ok(next,row.id+' cell deleted '+v);used.set(roles[next],(used.get(roles[next])??0)+1);
  if(m!==next){changed++;const key=oldRoles[m]+' → '+roles[next];changes.set(key,(changes.get(key)??0)+1);}
  if(before.materials[m].solid!==after.materials[next].solid)collisionChanged++;
 }
 for(const [v]of g.cells())assert.ok(og.get(v),row.id+' cell added '+v);
 assert.ok(!used.has('paper'),row.id+' ambiguous paper/cotton remains');
 modifiedVoxels+=changed;collisionChanges+=collisionChanged;
 records.push({id:row.id,sheet:row.sheet,baselineFile:row.file,currentFile:entry?.file??null,baselineChunkSHA256:hash(old.chunks),currentChunkSHA256:hash(a.chunks),occupiedCells:g.count,occupancyUnchanged:true,boundsPortsOriginsAndVoidsUnchanged:true,changedMaterialCells:changed,changedCollisionCells:collisionChanged,transitions:Object.fromEntries(changes),roles:Object.fromEntries([...used].sort(([a],[b])=>a.localeCompare(b)))});
 console.log(row.id,changed,'reassigned cells,',collisionChanged,'collision flags corrected');
}
const report={baselineRun:baseline.run,currentRun:current?.run??'in-memory-candidate',createdAt:new Date().toISOString(),elapsedMs:performance.now()-start,compared:records.length,changedCandidates:records.filter(r=>r.changedMaterialCells>0).length,modifiedVoxels,collisionChanges,notes:['Classification correction edits IDs and in some cases deliberately corrects collision semantics (e.g. non-solid display pixels).','This is not a resource-pack swap. Subsequent appearance swaps must preserve all IDs and solid flags.','All pre-repair native projects remain readable; they are not silently migrated.'],records};
await writeFile('artifacts/material-classification/'+(saved?'saved-comparison':'candidate-comparison')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,records:undefined}));
