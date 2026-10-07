import {writeFile}from'node:fs/promises';
import {productionProject}from'../../src/production/style';
import {makeAvatarAsset}from'../../src/production/atlas-avatar';
import {makeFigureAsset}from'../../src/production/atlas-figure';
import {nativeIslandAttachments}from'../../src/production/mixed-review';
import {architectureClosed}from'../../scripts/lib/architecture-audit';
import {assetBoundsM}from'../../src/core/sky';
import {sculptBody,type BodyForm}from'./sculpt-prototype';
const p=productionProject('body prototypes'),records=[];
for(const form of ['thin','full','short','tall','stoop','frail']as BodyForm[]){const source=makeFigureAsset(form==='full'?'CHAR-060':form==='stoop'?'CHAR-065':'CHAR-059','body','original-'+form,p.styles.yunshan),a=sculptBody(source,'body-'+form,form);p.assets[source.id]=source;p.assets[a.id]=a;p.instances['i-'+form]={id:'i-'+form,assetId:a.id,position:[records.length*.9,0,0],rotation:0,parent:null,name:form};const head=form==='stoop'?makeAvatarAsset('CHAR-069','head','head-'+form,p.styles.yunshan):makeFigureAsset('CHAR-066','head','head-'+form,p.styles.yunshan);p.assets[head.id]=head;const neck=a.ports.find(p=>p.id==='neck')!.position;p.instances['head-'+form]={id:'head-'+form,assetId:head.id,position:[records.length*.9+neck[0],neck[1],neck[2]],rotation:0,parent:null,name:'original head'};records.push({form,bounds:assetBoundsM(a),closed:architectureClosed(a).every(m=>m.closed&&m.oriented),native:nativeIslandAttachments(a),ports:a.ports.map(p=>({id:p.id,position:p.position}))});}
p.selection={assetId:'body-thin',partId:null,region:null};for(const form of ['thin','full','short','tall','stoop','frail']){const doc=structuredClone(p);doc.instances=Object.fromEntries(Object.entries(doc.instances).filter(([id])=>id==='i-'+form||id==='head-'+form));doc.name='body '+form;doc.selection.assetId='body-'+form;await writeFile('work/body-variants/'+form+'.ysvox.json',JSON.stringify(doc));}
await writeFile('work/body-variants/sculpt-probe.json',JSON.stringify(records,null,2));await writeFile('work/body-variants/sculpt-prototype.ysvox.json',JSON.stringify(p));console.log(JSON.stringify(records.map(r=>({form:r.form,bounds:r.bounds,closed:r.closed,native:r.native})),null,2));
