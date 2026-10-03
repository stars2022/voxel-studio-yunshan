import {newProject} from './materials';
import {generateTemplate} from './templates';
import {Grid} from './grid';
import type {Project,V3} from './types';
export function demoProject():Project{
 const p=newProject(),style=p.styles.yunshan;
 const add=(id:string,name:string,type:string,params:Record<string,number>={})=>{p.assets[id]=generateTemplate(id,name,type,params,.1,style);};
 add('foundation','悬台基座','slab',{width:6.4,height:.4,depth:5.4});
 const foundationGrid=new Grid(p.assets.foundation.chunks);for(let x=10;x<24;x++)for(let y=0;y<4;y++)for(let z=0;z<2;z++)foundationGrid.set([x,y,z],0);p.assets.foundation.chunks=foundationGrid.serialize();
 add('floor','室内木台','slab',{width:6,height:.2,depth:5});
 add('entry','通高大门 · 西侧','door',{width:3,height:3,depth:.2,openingWidth:1.4,openingHeight:2.4});
 add('window','格栅窗 · 东侧','window',{width:3,height:3,depth:.2,openingWidth:1.6,openingHeight:1.4,sill:.9,glass:1});
 add('sidewall','侧墙','wall',{width:.2,height:3,depth:4.6});
 add('backwall','后墙','wall',{width:6,height:3,depth:.2});
 add('stairs','入户台阶','stairs',{width:1.4,height:.6,depth:1.2,steps:3});
 add('roof','双坡飞檐','roof',{width:6.8,height:1.2,depth:5.8,thickness:.1,detail:2});
 add('ridge','中脊','ridge',{width:6.8,height:.2,depth:.2});
 add('railing','山城护栏','railing',{width:2,height:1,depth:.1});
 add('planter','陶质花槽','planter',{width:1.2,height:.5,depth:.6,thickness:.1});
 add('bed','栖居床榻','bed',{width:1.5,height:.6,depth:2,thickness:.1});
 add('table','工作木案','table',{width:1.4,height:.8,depth:.7,thickness:.1});
 add('monitor','能源终端','monitor',{width:.7,height:.5,depth:.2});
 add('lamp','暖光柱','column',{width:.1,height:.3,depth:.1});
 // Roof understructure: discrete purlins bridge the upturned roof to the wall bearing strips.
 const roofGrid=new Grid(p.assets.roof.chunks);for(const x of[4,5,62,63])for(let z=4;z<54;z++){let top=0;while(top<12&&!roofGrid.get([x,top,z]))top++;for(let y=0;y<top;y++)roofGrid.set([x,y,z],3);}p.assets.roof.chunks=roofGrid.serialize();
 // This small deliberate material edit is still native voxel data.
 for(const arr of Object.values(p.assets.lamp.chunks))for(let j=1;j<arr.length;j+=2)arr[j]=12;
 const place=(id:string,assetId:string,position:V3,rotation=0)=>{p.instances[id]={id,assetId,name:p.assets[assetId].name,position,rotation,parent:null};};
 place('base-1','foundation',[-.2,0,-.2]);place('floor-1','floor',[0,.4,0]);
 place('entry-1','entry',[0,.6,0]);place('window-1','window',[3,.6,0]);
 place('wall-west','sidewall',[0,.6,.2]);place('wall-east','sidewall',[5.8,.6,.2]);place('wall-back','backwall',[0,.6,4.8]);
 place('stairs-1','stairs',[.8,0,-1.2]);
 place('roof-1','roof',[-.4,3.6,-.4]);place('ridge-1','ridge',[-.4,4.8,2.4]);
 place('rail-1','railing',[3.6,.4,-.2]);place('planter-1','planter',[4.4,0,-1.1]);
 place('bed-1','bed',[.5,.6,2.4]);place('table-1','table',[3.8,.6,3.8]);place('monitor-1','monitor',[4.1,1.4,4.1]);
 place('lamp-1','lamp',[5.0,1.4,4.1]);
 p.assemblies={qinglan:{id:'qinglan',name:'青岚居 · 民居组合',version:1,instances:structuredClone(Object.values(p.instances))}};
 p.selection={assetId:'window',region:null,partId:null};return p;
}
