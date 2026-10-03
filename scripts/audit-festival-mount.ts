import {makeLifeAsset} from '../src/production/life';
import {productionProject} from '../src/production/style';
import {Grid} from '../src/core/grid';
const s=productionProject('mount').styles.yunshan,post=new Grid(makeLifeAsset('LIFE-186','p','p',s).chunks),flag=new Grid(makeLifeAsset('LIFE-185','f','f',s).chunks),postWorld=new Set([...post.cells()].map(([v])=>[18-v[0]-1,v[1],100-v[2]-1].join(','))),cells=[...flag.cells()].map(([p])=>p);
const candidates=[];
for(let dx=5;dx<=30;dx++)for(let dz=42;dz<=70;dz++){let hits=0,contact=0;for(const v of cells){const x=v[0]+dx,y=v[1]+46,z=v[2]+dz;if(postWorld.has([x,y,z].join(','))){hits++;break;}if(postWorld.has([x,y-1,z].join(',')))contact++;}if(!hits&&contact)candidates.push({position:[dx*.01,.46,dz*.01],contact,delta:Math.abs(dx-10)+Math.abs(dz-50)});}
console.log(JSON.stringify(candidates.sort((a,b)=>a.delta-b.delta||b.contact-a.contact).slice(0,12)));
