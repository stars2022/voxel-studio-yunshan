import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {checkGeometry} from '../src/core/checks';
const latest=JSON.parse(await readFile('artifacts/atlas/latest.json','utf8')),index=JSON.parse(await readFile('projects/atlas-production-index.json','utf8')),before=JSON.parse(await readFile('artifacts/material-classification/before-index.json','utf8'));
const records=[];
for(const row of index.studies){
 const native=JSON.parse(await readFile(path.join('projects',row.file),'utf8')),t=performance.now(),check=checkGeometry(native);
 const priorRow=before.studies.find((s:any)=>s.id===row.id),old=priorRow?checkGeometry(JSON.parse(await readFile(path.join('projects',priorRow.file),'utf8'))):null;
 records.push({id:row.id,file:row.file,elapsedMs:performance.now()-t,check,priorFile:priorRow?.file,priorDiagnostics:old?{unsupported:old.unsupported,collisions:old.collisions,warnings:old.warnings,blockedOpenings:old.openings.filter(o=>o.ownSolidCells||o.blockedBy.length)}:null});
 console.log(JSON.stringify({sheet:row.id,unsupported:check.unsupported,collisions:check.collisions.length,blockedOpenings:check.openings.filter(o=>o.ownSolidCells||o.blockedBy.length).length,warnings:check.warnings,priorUnsupported:old?.unsupported}));
}
await writeFile(path.join(latest.evidence,'gallery-support-audit.json'),JSON.stringify({run:index.run,note:'Display galleries are not complete installation scenes. Missing wall supports remain reported; this audit does not suppress them.',records},null,2));
