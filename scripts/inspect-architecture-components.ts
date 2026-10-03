import {writeFile} from 'node:fs/promises';
import {architectureDefinitions} from '../src/production/architecture';
import {generateTemplate} from '../src/core/templates';
import {productionProject} from '../src/production/style';
import {Grid} from '../src/core/grid';
import type {V3} from '../src/core/types';

// Inspect face-connected geometry, including each loose fragment's exact bounds.
const project=productionProject('architecture-connectivity'),pitch=Number(process.argv[2]??.02),report=[];
for(const[code]of architectureDefinitions){
 const asset=generateTemplate(code,code,'kit-'+code.toLowerCase(),{},pitch,project.styles.yunshan),g=new Grid(asset.chunks);
 const unseen=new Set([...g.cells()].map(([p])=>p.join(','))),components=[];
 while(unseen.size){
  const start=unseen.values().next().value!;unseen.delete(start);const queue=[start],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],materials:Record<number,number>={};
  for(let i=0;i<queue.length;i++){
   const p=queue[i].split(',').map(Number) as V3,m=g.get(p);materials[m]=(materials[m]??0)+1;
   for(let a=0;a<3;a++){min[a]=Math.min(min[a],p[a]);max[a]=Math.max(max[a],p[a]+1);for(const step of[-1,1]){const v=[...p];v[a]+=step;const key=v.join(',');if(unseen.delete(key))queue.push(key);}}
  }
  components.push({count:queue.length,minM:min.map(x=>+(x*pitch).toFixed(3)),maxM:max.map(x=>+(x*pitch).toFixed(3)),materials});
 }
 components.sort((a,b)=>b.count-a.count);report.push({code,pitch,components});console.log(code,components.length,components.length>1?JSON.stringify(components.slice(1)):asset.source!.features);
}
await writeFile(`artifacts/architecture/connectivity-${pitch}.json`,JSON.stringify(report,null,2));
