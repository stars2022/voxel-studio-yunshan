import {readFile,writeFile} from 'node:fs/promises';
import {Grid} from '../../src/core/grid';
import {geometryData} from '../../src/core/sky';
import {outfitHash} from '../../src/production/outfit-components';
import {makeCatalogAsset} from '../../src/production/catalog-assets';
import {productionProject} from '../../src/production/style';
const p=JSON.parse(await readFile('projects/atlas-20261003120646-built-058.ysvox.json','utf8')),a=p.assets['built-058'],counts=new Map<number,number>();for(const[,m]of new Grid(a.chunks).cells())counts.set(m,(counts.get(m)??0)+1);
const current=productionProject('next-batch source audit'),b=makeCatalogAsset('BUILT-058','test','test',current.styles.yunshan,{},current),report={status:'read-only-parent-preflight',id:'BUILT-058',nativeCells:new Grid(a.chunks).count,sourceGeometrySHA256:outfitHash(geometryData(a)),currentFactoryGeometryIdentical:outfitHash(geometryData(a))===outfitHash(geometryData(b)),materials:[...counts].map(([id,cells])=>({id,cells,roles:Object.entries(p.styles.yunshan).filter(([,v])=>v===id).map(([r])=>r),material:p.materials[id]}))};await writeFile('work/m061/legacy-wall-parent-probe.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
