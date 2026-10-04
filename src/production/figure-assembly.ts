import type {Asset,Project,V3} from '../core/types';
import {makeFigureAsset,figureProportions} from './atlas-figure';
import {roundLoft} from './mesh-shapes';
export const figureScenes=['adults','ages','accessories','sockets'] as const;
export type FigureScene=typeof figureScenes[number];
/** Explicit grey volume used only to read body proportions; never a produced head master. */
function envelope(id:string,h:number,material:number):Asset{return{id,name:'灰色头部比例占位（非头部母版）',version:1,category:'import',cellSize:.005,origin:[0,0,0],chunks:{},parts:[],ports:[{id:'neck',kind:'character-socket',position:[0,0,0],normal:[0,-1,0],size:[.1,.01,.1],pitch:.005}],openings:[],meshes:[roundLoft('仅作头部比例包络',material,[{y:0,rx:h*.2,rz:h*.22},{y:h*.25,rx:h*.36,rz:h*.35},{y:h*.7,rx:h*.38,rz:h*.37},{y:h,rx:h*.13,rz:h*.15}])],source:{kind:'author-proportion-envelope',notCatalogMaster:true,headDetailAbsent:true,originalSkeletonBound:false,limitations:'灰色几何占位，仅显示头身比例；不是儿童/老年精细头部或已完成角色。'}};}
export function figureScene(base:Project,kind:FigureScene):Project{const p=structuredClone(base);p.name='M032 · '+kind+' 静态装配';p.assets={};p.instances={};const add=(a:Asset,position:V3,name=a.name)=>{p.assets[a.id]=a;const id='i-'+a.id;p.instances[id]={id,assetId:a.id,name,position:position.map(v=>Math.round(v*1e9)/1e9||0) as V3,rotation:0,parent:null};};const make=(id:string,key=id.toLowerCase(),params={})=>makeFigureAsset(id,id,key,p.styles.yunshan,params);
 const actor=(id:string,x:number,headId?:string,extremities='covered')=>{const q=figureProportions[id];add(make(id,id.toLowerCase(),{extremities}),[x,0,0]);const a=headId?make(headId,'head-'+id):envelope('head-envelope-'+id,q.headM,p.styles.yunshan.modelSuitTrim);add(a,[x,q.heightM-q.headM,0],headId??'未制作头部：灰色比例包络');};
 if(kind==='adults'){
  actor('CHAR-059',-.50,'CHAR-066');actor('CHAR-060',.50,'CHAR-066');add(make('CHAR-013'),[-.50,1.63,0]);
  const q=figureProportions['CHAR-060'];add(make('CHAR-014','char-014',{carry:'shoulder',lid:'closed'}),[.50+q.shoulderHalfWidthM-.005+.297,q.shoulderYM+.027*q.heightM-.747,0]);
 }else if(kind==='ages'){
  const ids=Object.keys(figureProportions);ids.forEach((id,i)=>actor(id,(i-3)*.78,id==='CHAR-059'||id==='CHAR-060'?'CHAR-066':id==='CHAR-061'?'CHAR-067':undefined));
 }else if(kind==='accessories'){
  add(make('CHAR-013','cap-adult'),[-.63,.07,0]);add(make('CHAR-013','cap-teen',{capFit:'teen'}),[-.3,.07,0]);
  add(make('CHAR-014','bag-open',{carry:'hand',lid:'open'}),[.12,0,0]);add(make('CHAR-014','bag-shoulder-open',{carry:'shoulder',lid:'open'}),[.64,0,0]);add(make('CHAR-015'),[-.45,0,-.40]);
 }else{
  actor('CHAR-059',-.42,'CHAR-066','sockets');actor('CHAR-061',.30,'CHAR-067','sockets');add(make('CHAR-067','toddler-head',{headStage:'toddler'}),[.75,.03,0]);
 }
 p.selection={assetId:Object.keys(p.assets)[0],region:null,partId:null};return p;
}
