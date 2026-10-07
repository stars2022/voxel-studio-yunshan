import assert from'node:assert/strict';
import {writeFile}from'node:fs/promises';
import {productionProject}from'../../src/production/style';
import {makeFigureAsset}from'../../src/production/atlas-figure';
import {makeAvatarAsset}from'../../src/production/atlas-avatar';
import {abdomenSlot}from'../../src/production/avatar-assembly';
import {abdomenProfile}from'../../src/production/avatar-extensions';
import {nativeIslandAttachments}from'../../src/production/mixed-review';
import {architectureClosed}from'../../scripts/lib/architecture-audit';
import {assetBoundsM,geometryData}from'../../src/core/sky';
import {stagedAbdomen}from'./pregnancy-prototype';
import {validateProject}from'../../src/core/engine';
const records=[],all=productionProject('pregnancy stages');
for(const fit of ['adultA','adultB'])for(const stage of ['early','middle','late']as const){const key=fit+'-'+stage,p=productionProject(key),body=makeFigureAsset(fit==='adultA'?'CHAR-059':'CHAR-060','body','original-body',p.styles.yunshan),source=makeAvatarAsset('CHAR-072','abdomen','original-abdomen',p.styles.yunshan,{abdomenFit:fit}),slot=abdomenSlot(body,fit,'slotted-body'),belly=stagedAbdomen(source,'staged-belly',stage),head=makeFigureAsset('CHAR-066','head','original-head',p.styles.yunshan),b=abdomenProfile(fit);
 for(const a of[body,source,slot,belly,head])p.assets[a.id]=a;for(const[a,y]of[[slot,0],[belly,b.bottom],[head,b.q.heightM-b.q.headM]]as const)p.instances[a.id]={id:a.id,assetId:a.id,position:[0,y,0],rotation:0,parent:null,name:a.name};p.selection={assetId:belly.id,region:null,partId:null};validateProject(p);if(stage==='late')assert.deepEqual(geometryData(belly),geometryData(source));const native=nativeIslandAttachments(belly),closed=architectureClosed(belly);assert.ok(native.every(r=>r.attached)&&closed.every(r=>r.closed&&r.oriented));records.push({key,bounds:assetBoundsM(belly),closed:closed.length,native});await writeFile('work/body-variants/'+key+'.ysvox.json',JSON.stringify(p));
 for(const a of Object.values(p.assets)){a.id=key+'-'+a.id;all.assets[a.id]=a;}for(const i of Object.values(p.instances)){i.id=key+'-'+i.id;i.assetId=key+'-'+i.assetId;i.position[0]+=(records.length-1)*.9;all.instances[i.id]=i;}
}
all.selection={assetId:Object.values(all.instances)[0].assetId,region:null,partId:null};validateProject(all);await writeFile('work/body-variants/pregnancy-comparison.ysvox.json',JSON.stringify(all));await writeFile('work/body-variants/pregnancy-probe.json',JSON.stringify(records,null,2));console.log(JSON.stringify(records));
