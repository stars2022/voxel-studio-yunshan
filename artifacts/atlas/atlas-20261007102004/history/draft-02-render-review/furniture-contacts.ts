import {writeFile} from 'node:fs/promises';import {productionProject} from '../../src/production/style';import {Grid} from '../../src/core/grid';import {makeFurnitureVariant} from './furniture-variants';
const rows:any[]=[];
for(const id of ['LIFE-033','LIFE-034','LIFE-035','LIFE-036'])for(const size of ['standard','compact','wide']){
 const p=productionProject('contact'),a=makeFurnitureVariant(p,id,'sample',id,{furnitureSize:size}),sets=a.instances.map(i=>{const a=p.assets[i.assetId],s=new Set<string>(),n=Math.round(a.cellSize/.01);for(const[v]of new Grid(a.chunks).cells()){const start=v.map((v,k)=>Math.round((v*a.cellSize+a.origin[k]+i.position[k])/.01));for(let x=0;x<n;x++)for(let y=0;y<n;y++)for(let z=0;z<n;z++)s.add(start.map((v,k)=>v+[x,y,z][k]).join(','));}return s;}),pairs=[];
 for(let j=0;j<sets.length;j++)for(let k=j+1;k<sets.length;k++){let overlap=0,touch=0,up=0;for(const key of sets[j]){if(sets[k].has(key))overlap++;const v=key.split(',').map(Number);for(const d of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])if(sets[k].has(v.map((v,i)=>v+d[i]).join(','))){touch++;if(d[1]===1)up++;}}pairs.push({j,k,overlap,touch,up,volumeM3:overlap*1e-6});}
 const r={id,size,pairs};rows.push(r);console.log(JSON.stringify(r));
}await writeFile('work/environment-furniture/furniture-contacts.json',JSON.stringify(rows,null,2));
