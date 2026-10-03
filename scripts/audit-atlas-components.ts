import {Grid} from '../src/core/grid';
import {dirs,eachCell,type V3} from '../src/core/types';
import {makeCatalogAsset} from '../src/production/catalog-assets';
import {atlasLifeRecipes} from '../src/production/atlas-life';
import {atlasBuiltRecipes} from '../src/production/atlas-built';
import {productionProject} from '../src/production/style';
const style=productionProject('audit').styles.yunshan;
const requested=new Set(process.argv.slice(2));
for(const id of [...Object.keys(atlasLifeRecipes).map(n=>'LIFE-'+n.padStart(3,'0')),...Object.keys(atlasBuiltRecipes)]){
 if(requested.size&&!requested.has(id)&&!requested.has(String(Number(id.slice(5)))))continue;
 try{
 const a=makeCatalogAsset(id,id,id,style),g=new Grid(a.chunks),left=new Set([...g.cells()].map(([p])=>p.join(','))),components:any[]=[];
 while(left.size){const first=left.values().next().value!;left.delete(first);const q=[first],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<q.length;i++){const p=q[i].split(',').map(Number);p.forEach((v,k)=>{min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v+1);});for(const d of dirs){const key=p.map((v,k)=>v+d[k]).join(',');if(left.delete(key))q.push(key);}}components.push({count:q.length,minM:min.map(v=>v*a.cellSize),maxM:max.map(v=>v*a.cellSize)});}
 const blocked:any[]=[];for(const box of a.openings)eachCell(box,p=>{if(g.get(p)&&blocked.length<12)blocked.push({cell:p,material:g.get(p)});});
 components.sort((a,b)=>b.count-a.count);if(requested.size||components.length>1||blocked.length)console.log(JSON.stringify({id,cells:g.count,components,blocked}));
 }catch(error){console.log(JSON.stringify({id,error:String(error)}));process.exitCode=1;}
}
