import {defaultMaterials} from './materials';
import type {Command,Material} from './types';
export function referenceStyleCommands():Command[]{
 const base=defaultMaterials();
 const colors:Record<number,string>={1:'#51565b',2:'#c9bdae',3:'#4f4239',4:'#242d33',5:'#333a42',6:'#70c8cf',7:'#9e9a8a',8:'#c4b59e',9:'#619337',10:'#4a9eaa',11:'#44d9eb',12:'#ffc16b',13:'#4e4232',14:'#16282e'};
 for(const [id,color]of Object.entries(colors))base[id].color=color;
 Object.assign(base[4],{roughness:.48,metalness:.55});Object.assign(base[5],{roughness:.78,metalness:.12});Object.assign(base[6],{roughness:.19,metalness:.1,opacity:.36});
 Object.assign(base[11],{emissive:'#26d4ee',intensity:1.4});Object.assign(base[12],{emissive:'#ffa63d',intensity:1.4});
 const extras:[string,string,string,number,number][]=[['瓦边石墨','tile','#48505a',.8,.1],['石面浅灰','stone','#73777a',.9,0],['墙砖浅暖','stone','#dcd0be',.95,0],['细缝灰浆','stone','#8a8880',1,0],['框架拉丝边','metal','#4a5157',.43,.5],['嫩叶','plant','#9bab41',.96,0]];
 extras.forEach(([name,category,color,roughness,metalness],i)=>{const id=15+i;base[id]={id,name,category,color,roughness,metalness,opacity:1,emissive:'#000000',intensity:0,solid:category!=='plant'};});
 return[...Object.values(base).map((mat:Material)=>{const {id,...properties}=mat;return{op:'material',id,properties};}),{op:'style',id:'courtyard',roles:{stone:1,wall:2,wood:3,metal:4,roof:5,glass:6,ceramic:7,fabric:8,leaf:9,water:10,energy:11,warm:12,soil:13,screen:14,roofAlt:15,stoneAlt:16,wallAlt:17,mortar:18,trim:19,leafAlt:20}}];
}
