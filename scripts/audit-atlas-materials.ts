import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Grid} from '../src/core/grid';
import {inspectAtlasMaterialAssignments,materialAssignmentRevision} from '../src/production/atlas-material-review';
import type {Project} from '../src/core/types';
import {inspectBuiltMaterialAssignments} from '../src/production/atlas-built';

// Read the saved canonical cells, not colours in a screenshot or recipe labels.
const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8'));
const index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8'));
const records=[];
for(const row of index.entries){
 const project:Project=JSON.parse(await readFile(path.join('projects',row.file),'utf8'));
 const asset=project.assets[row.assetId],counts=new Map<number,number>();
 assert.equal(createHash('sha256').update(JSON.stringify(asset.chunks)).digest('hex'),row.sha256);
 for(const[,id]of new Grid(asset.chunks).cells())counts.set(id,(counts.get(id)??0)+1);
 const assignments=[...counts].sort(([a],[b])=>a-b).map(([id,occupiedCells])=>{
  const material=project.materials[id];assert.ok(material,`${row.id}: missing material ${id}`);
  const roles=Object.entries(project.styles).flatMap(([style,bindings])=>Object.entries(bindings).filter(([,value])=>value===id).map(([role])=>style+'.'+role));
  assert.ok(roles.length,`${row.id}: material ${id} has no semantic binding`);
  return{id,roles,category:material.category,name:material.name,solid:material.solid,occupiedCells};
 });
 const authoredReview=row.id.startsWith('BUILT-')?inspectBuiltMaterialAssignments(row.id,asset,project.styles.yunshan):inspectAtlasMaterialAssignments(Number(row.id.slice(5)),asset,project.styles.yunshan);
 if(authoredReview)assert.deepEqual(asset.source?.materialAssignmentReview,authoredReview,`${row.id}: saved asset predates the material repair`);
 const reviewed=['M007','M008','M009'].includes(row.sheet)||!!authoredReview,legacy=project.styles.yunshan.paper;
 if(reviewed)assert.ok(!counts.has(legacy),`${row.id}: ambiguous legacy paper/cotton material remains`);
 if(['M008','M009'].includes(row.sheet))for(const role of['foodRoot','fruitRed','grain','fish','fishBack'])assert.ok(!counts.has(project.styles.yunshan[role]),`${row.id}: food material borrowed by equipment`);
 if(row.sheet==='M009')for(const role of['roof','flexibleClear'])assert.ok(!counts.has(project.styles.yunshan[role]),`${row.id}: rigid civic equipment borrowed ${role}`);
 records.push({id:row.id,sheet:row.sheet,file:row.file,geometrySHA256:row.sha256,assignmentRevision:authoredReview?.revision??null,authoredDecision:authoredReview?.note??asset.source?.limitations,classificationReview:reviewed?'authored-role-review':'pending-individual-review',assignments});
}
const report={run:index.run,createdAt:new Date().toISOString(),scope:'Saved voxel IDs and role bindings; categories are authored, not automatically inferred from images.',reviewedCandidates:records.filter(r=>r.classificationReview==='authored-role-review').length,pendingCandidates:records.filter(r=>r.classificationReview==='pending-individual-review').length,records};
const filename=path.join(latest.evidence,'material-audit.json');await writeFile(filename,JSON.stringify(report,null,2));console.log(JSON.stringify({filename,reviewedCandidates:report.reviewedCandidates,pendingCandidates:report.pendingCandidates}));
