import {writeFile} from 'node:fs/promises';
import {makeLifeAsset,makeFlowerAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {lifeLayouts,makeLifeAssembly} from '../src/production/layouts';
import {checkGeometry} from '../src/core/checks';
import type {Asset} from '../src/core/types';
const cache=new Map<string,Asset>(),p=productionProject('audit'),records=[];
for(const n of [63,99,211,212,213,214,228]){
 try{
 const p=productionProject('domestic layout');for(const[id]of lifeLayouts[n]){const key=typeof id==='number'?'LIFE-'+String(id).padStart(3,'0'):id;if(!cache.has(key))cache.set(key,typeof id==='string'?makeFlowerAsset(p.styles.yunshan):makeLifeAsset(key,key,key.toLowerCase(),p.styles.yunshan));const a=cache.get(key)!;p.assets[a.id]=a;}
 const assembly=makeLifeAssembly(p,'LIFE-'+String(n).padStart(3,'0'),'layout','layout');p.instances=Object.fromEntries(assembly.instances.map(i=>[i.id,i]));const check=checkGeometry(p);records.push({id:n,instances:p.instances,check});console.log(JSON.stringify({id:n,collisions:check.collisions,unsupported:check.unsupported,gaps:check.gaps,blocked:check.openings.filter(o=>o.ownSolidCells||o.blockedBy.length),warnings:check.warnings}));
 }catch(error){records.push({id:n,error:String(error)});console.log(JSON.stringify({id:n,error:String(error)}));}
}
await writeFile(process.argv[2]??'artifacts/atlas/domestic-study/layout-audit.json',JSON.stringify(records,null,2));
