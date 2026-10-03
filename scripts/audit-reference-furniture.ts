import {writeFile,mkdir} from 'node:fs/promises';
import {referenceFurniture} from '../src/production/reference-furniture';
import {productionProject} from '../src/production/style';
import {makeLifeAsset} from '../src/production/life';
import {nativeLifeId} from '../src/production/layouts';
import {checkGeometry} from '../src/core/checks';

const report=[];
for(const item of referenceFurniture){
 const p=productionProject(item.name);
 for(const[n,x,y,z,q]of item.items){const id=nativeLifeId(Number(n));p.assets[id]??=makeLifeAsset('LIFE-'+String(n).padStart(3,'0'),id,id,p.styles.yunshan);const iid=item.id+'-'+Object.keys(p.instances).length;p.instances[iid]={id:iid,assetId:id,name:id,position:[x,y,z],rotation:q??0,parent:null};}
 const t=performance.now(),r=checkGeometry(p);report.push({id:item.id,elapsedMs:performance.now()-t,...r});console.log(JSON.stringify({id:item.id,collisions:r.collisions,unsupported:r.unsupported,warnings:r.warnings}));
}
await mkdir('artifacts/production',{recursive:true});await writeFile('artifacts/production/reference-geometry.json',JSON.stringify(report,null,2));
