import {Matrix3,Vector3} from 'three';
import type {Asset,V3} from '../../src/core/types';
import {dirs} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {geometryData,assetBoundsM} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {figureProportions} from '../../src/production/atlas-figure';

export type BodyForm='thin'|'full'|'short'|'tall'|'stoop'|'frail';
const interpolate=(rows:[number,number][],x:number)=>{
 if(x<=rows[0][0])return rows[0][1];for(let k=1;k<rows.length;k++)if(x<=rows[k][0]){const a=rows[k-1],b=rows[k];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return rows.at(-1)![1];
};
const snap=(v:number)=>Math.round(v*1e9)/1e9||0;
export function sculptBody(source:Asset,id:string,form:BodyForm):Asset{
 const parent=String(source.source!.catalogId),q=figureProportions[parent];if(!q||!['CHAR-059','CHAR-060','CHAR-065'].includes(parent)||source.rig)throw new Error('Unsupported original body');
 const a=structuredClone(source),hip=q.hipYM,shoulder=q.shoulderYM,neck=q.heightM-q.headM,ankle=q.heightM*.059,armR=q.heightM*(parent==='CHAR-065'?.032:.038),wrist=hip+.037,elbow=shoulder-(shoulder-hip)*.48;
 const slender=form==='thin'||form==='frail',wide=form==='full',shoulderRatio=slender?.9:wide?1.09:1,waistRatio=slender?.80:wide?1.27:1,hipRatio=slender?.95:wide?1.13:1,limbRatio=slender?.84:wide?1.15:1,depthRatio=slender?.88:wide?1.19:1;
 const fullHeight=form==='short'?1.55:form==='tall'?1.88:q.heightM,targetNeck=fullHeight-q.headM,yFactor=(targetNeck-ankle)/(neck-ankle),lean=form==='stoop'?.18:form==='frail'?.085:0,lower=form==='stoop'?.045:form==='frail'?.020:0;
 const torsoX:[number,number][]=[[hip-.014,hipRatio],[hip+.038,hipRatio],[hip+(shoulder-hip)*.36,waistRatio],[shoulder-.055*q.heightM,shoulderRatio],[shoulder+.005,shoulderRatio],[neck-.018,1]];
 const torsoZ:[number,number][]=[[hip-.014,1],[hip+.038,depthRatio],[shoulder-.055*q.heightM,depthRatio],[neck-.038,1]];
 const family=(name:string)=>/肩肘腕|袖口|衣套手|shoulder|elbow|wrist|bag-shoulder/.test(name)?'arm':/裤腿|膝前|裤脚|hip-|knee-|ankle-/.test(name)?'leg':/衣套足/.test(name)?'foot':'torso';
 const map=(name:string,p:V3):V3=>{
  let[x,y,z]=p;const kind=family(name),side=x<0?-1:1;if(kind==='foot')return [...p];
  if(kind==='torso'){x*=interpolate(torsoX,y);z*=interpolate(torsoZ,y);}
  if(kind==='arm'){
   const center=side*interpolate([[wrist,q.shoulderHalfWidthM+armR*.67],[elbow,q.shoulderHalfWidthM+armR*.48],[shoulder-.03*q.heightM,q.shoulderHalfWidthM],[shoulder+.027*q.heightM,q.shoulderHalfWidthM-.005]],y);
   const radius=interpolate([[wrist-.008,1],[elbow,limbRatio],[shoulder,limbRatio]],y);x=center+side*q.shoulderHalfWidthM*(shoulderRatio-1)+(x-center)*radius;z*=radius;
  }
  if(kind==='leg'){const center=side*q.hipHalfWidthM,radius=interpolate([[ankle+.014,1],[q.kneeYM,limbRatio],[hip,limbRatio]],y);x=center+(x-center)*radius;z*=radius;}
  const t=Math.min(1,Math.max(0,(y-hip)/(neck-.05-hip))),smooth=t*t*(3-2*t);z-=lean*smooth;y=y<=ankle?y:ankle+(y-ankle)*yFactor;y-=lower*smooth;
  return[x,y,z].map(snap)as V3;
 };
 a.id=id;a.name+=' · '+form+'局部派生';
 for(const m of a.meshes??[]){
  for(let k=0;k<m.positions.length;k+=3)m.positions.splice(k,3,...map(m.name,m.positions.slice(k,k+3)as V3));
  for(let k=0;k<m.indices.length;k+=3){const ids=m.indices.slice(k,k+3),p=ids.map(i=>new Vector3(...m.positions.slice(i*3,i*3+3))),n=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();if(!n.length())throw new Error('Collapsed body triangle');for(const i of ids)m.normals.splice(i*3,3,...n.toArray());}
 }
 const before=new Grid(source.chunks),remaining=new Map([...before.cells()].map(([v,m])=>[v.join(','),{v,m}])),next=new Grid(),moves:{from:V3;to:V3;material:number}[]=[],islands:{cells:number;delta:V3}[]=[];
 while(remaining.size){const first=remaining.values().next().value!,group=[first];remaining.delete(first.v.join(','));for(let k=0;k<group.length;k++)for(const d of dirs){const key=group[k].v.map((v,j)=>v+d[j]).join(','),row=remaining.get(key);if(row){remaining.delete(key);group.push(row);}}
  const centre=[0,1,2].map(k=>group.reduce((s,c)=>s+(c.v[k]+.5)*source.cellSize,0)/group.length)as V3,target=map('torso',centre),delta=target.map((v,k)=>Math.round((v-centre[k])/source.cellSize))as V3;islands.push({cells:group.length,delta});
  for(const {v,m}of group){const to=v.map((n,k)=>n+delta[k])as V3;if(next.get(to))throw new Error('Native islands overlap');next.set(to,m);moves.push({from:v,to,material:m});}
 }
 a.chunks=next.serialize();for(const part of a.parts){const cells=moves.filter(c=>c.from.every((v,k)=>v>=part.region.min[k]&&v<part.region.max[k])).map(c=>c.to);if(cells.length)part.region={min:[0,1,2].map(k=>Math.min(...cells.map(c=>c[k])))as V3,max:[0,1,2].map(k=>Math.max(...cells.map(c=>c[k]))+1)as V3};}
 for(const port of a.ports){const p=[...port.position]as V3,epsilon=1e-5,columns=[0,1,2].map(k=>{const lo=[...p]as V3,hi=[...p]as V3;lo[k]-=epsilon;hi[k]+=epsilon;const l=map(port.id,lo),h=map(port.id,hi);return h.map((v,j)=>(v-l[j])/(2*epsilon));});const j=new Matrix3().set(columns[0][0],columns[1][0],columns[2][0],columns[0][1],columns[1][1],columns[2][1],columns[0][2],columns[1][2],columns[2][2]);port.normal=new Vector3(...port.normal).applyMatrix3(j.clone().invert().transpose()).normalize().toArray()as V3;port.position=map(port.id,p);}
 a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[parent],sourceAssetId:source.id,sourceGeometrySHA256:hash(geometryData(source)),originalRetained:true,bodySculpt:{form,torsoX,torsoZ,limbRatio,shoulderRatio,sourceNeckM:neck,targetNeckM:targetNeck,yFactor,leanForwardM:lean,upperLoweringM:lower,nativeCellSizeM:source.cellSize,nativeMoves:moves,nativeIslands:islands,sourceBoundsM:assetBoundsM(source),originalProfileBound:false,originalGameplayCollisionChanged:false,scope:'Localcontinuous-bodyprofile deformation; unchanged foot pieces and rigid integer translations of minimum native islands. Author static standing posture, original fullbody retained, no uniform actor scaling.'}};
 return a;
}
