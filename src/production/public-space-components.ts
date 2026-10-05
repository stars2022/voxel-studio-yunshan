import {createHash} from 'node:crypto';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import type {V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import {emptyMesh,quad} from './mesh-shapes';
import {residentialFurniture} from './residential-assemblies';
import {spaceFurniture} from './life-space-components';

/** Material-only derivatives retain all native geometry and the complete canonical original. */
export function publicFurniture(b:ArchitectureBuilder,n:number){
 if(n===111)return spaceFurniture(b,n);
 if([2,3,4,18,108].includes(n))return residentialFurniture(b,n);
 const original=b.original('LIFE-'+String(n).padStart(3,'0'));
 if(![112,116,117,118,121,124,126,127].includes(n))return original;
 return b.asset('public-material-'+n,id=>{const old=b.p.assets[original],a=structuredClone(old),g=new Grid(a.chunks),s=b.p.styles.yunshan,changes:Record<string,number>={};
  for(const[cell,m]of g.cells()){const v=cell.map((n,k)=>a.origin[k]+(n+.5)*a.cellSize);let next=m;
   if(n===116){if(m===s.fabricEdge)next=s.bookCloth;else if(m===s.woodEdge&&v[1]>.7&&v[2]>.14&&v[2]<.40)next=s.bookCover;}
   else if(m===s.energy)next=[112,117].includes(n)?s.displayGlyph:s.opticsGlow;
   if(next!==m){if(b.p.materials[next].solid!==b.p.materials[m].solid)throw new Error('Material derivative collision change');g.set(cell,next);const key=m+'->'+next;changes[key]=(changes[key]??0)+1;}
  }
  a.id=id;a.name=old.name+' · 公共空间用途修正';a.chunks=g.serialize();a.source={kind:'assembly-derived-component',baseCatalogIds:['LIFE-'+String(n).padStart(3,'0')],notCatalogMaster:true,materialOnly:true,sourceAssetId:original,sourceGeometrySHA256:createHash('sha256').update(JSON.stringify(geometryData(old))).digest('hex'),materialChanges:changes,reason:n===116?'Actual binder covers only: book cloth and paper covers; structural wooden rails unchanged.':'Display pixels and optical indicators separated; zero emission and original collision retained.'};return a;
 });
}
export function publicLectern(b:ArchitectureBuilder,n=109){
 b.original('LIFE-'+n);return b.asset('public-continuous-lectern-'+n,id=>{const c=new CivicComponent(b.p,id,'连续斜承稿台、开放后格与话筒',['LIFE-'+n],{sourceOriginalRetained:true});
  for(const x of[0,.9])for(const z of[.02,.5])c.box('承台木柱','wood',x,0,z,.1,.96+.22*z,.1);
  c.box('前嵌石板','wall',.06,.18,.025,.88,.64,.04);c.box('开放储格底板','wood',.06,.18,.065,.88,.04,.49);c.surface('连续斜书面','woodEdge',[0,1.02],[0,.64],(_,z)=>.96+.22*z,.06);c.box('挡书木沿','wood',0,.96,0,1.02,.055,.025);
  c.box('话筒实承座','metal',.72,1.035,.42,.12,.08,.12);c.tube('话筒竖杆','metal',[[.78,1.09,.48],[.78,1.36,.48]],.012);c.beam('话筒斜杆','metal',[.78,1.35,.48],[.70,1.40,.30],.024);c.tube('收音头','rubber',[[.70,1.40,.30],[.68,1.40,.25]],.025);c.pin('最小木构销','bronze',[.02,.50,.02]);return c.finish();});
}
/** Freestanding author screen: pleats are a closed continuous cloth surface. */
export function privacyCurtain(b:ArchitectureBuilder,length=2.8){
 b.original('LIFE-026');b.original('LIFE-027');return b.asset('clinical-curtain-'+length,id=>{const c=new CivicComponent(b.p,id,'医护隔帘、真实承轨与落地架',['LIFE-026','LIFE-027'],{length,partialCurtain:true,clothThickness:.008,physics:'static fabric and actual steel support; not cloth simulation'});
  for(const x of[0,length]){c.box('落地架钢脚','metal',x-.10,0,-.25,.20,.05,.50);c.tube('独立立杆','metal',[[x,.03,0],[x,2.4,0]],.028);c.pin('架脚最小销','bronze',[x-.02,.02,-.06]);}
  c.tube('承帘横轨','metalBright',[[0,2.37,0],[length,2.37,0]],.025);
  const end=length*.72,segments=36,xs=Array.from({length:segments+1},(_,i)=>.08+(end-.08)*i/segments),depth=(x:number)=>.055*Math.sin((x-.08)/(end-.08)*Math.PI*12),m=emptyMesh('连续折帘布',c.role('cottonWhite'));
  const p=(i:number,y:number,back=false):V3=>[xs[i],y,depth(xs[i])+(back?.008:0)];
  for(let i=0;i<segments;i++){quad(m,[p(i,.25),p(i+1,.25),p(i+1,2.25),p(i,2.25)],[0,0,-1]);quad(m,[p(i,.25,true),p(i+1,.25,true),p(i+1,2.25,true),p(i,2.25,true)],[0,0,1]);for(const y of[.25,2.25])quad(m,[p(i,y),p(i+1,y),p(i+1,y,true),p(i,y,true)],[0,y<1?-1:1,0]);}
  for(const i of[0,segments])quad(m,[p(i,.25),p(i,2.25),p(i,2.25,true),p(i,.25,true)],[i===0?-1:1,0,0]);c.mesh(m);
  for(let k=0;k<=6;k++){const x=.08+(end-.08)*k/6;c.box('钢轨滑扣','metal',x-.015,2.24,-.02,.03,.145,.04);}
  return c.finish();});
}
export function publicTable(b:ArchitectureBuilder,key:string,width=1.1,depth=.7,height=.9,role='metalBright',base='LIFE-119'){
 return b.asset('public-table-'+key,id=>{const c=new CivicComponent(b.p,id,'实际承托工作面与四足',[base],{width,depth,height});for(const x of[.05,width-.12])for(const z of[.05,depth-.12])c.box('台下实接腿','metal',x,0,z,.07,height-.045,.07);c.box('独立连续台面',role,0,height-.05,0,width,.05,depth);c.box('下部承板','metal',.05,.2,.05,width-.10,.025,depth-.10);c.pin('最小台架销','bronze',[.06,height-.04,.06]);return c.finish();});
}
