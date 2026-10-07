import {Vector3}from'three';
import type{Asset,V3}from'../core/types';
import {Grid}from'../core/grid';
import {geometryData}from'../core/sky';
import {outfitHash as hash}from'./outfit-components';
import {abdomenProfile}from'./avatar-extensions';
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const sample=(rows:number[][],y:number,k:number)=>{if(y<=rows[0][0])return rows[0][k];for(let i=1;i<rows.length;i++)if(y<=rows[i][0])return lerp(rows[i-1][k],rows[i][k],(y-rows[i-1][0])/(rows[i][0]-rows[i-1][0]));return rows.at(-1)![k];};
export function stagedAbdomen(source:Asset,id:string,stage:'early'|'middle'|'late'){
 const a=structuredClone(source),fit=(source.source!.parameters as {abdomenFit:string}).abdomenFit,{q,bottom,top,rings}=abdomenProfile(fit),depth=q.hipRadiusM*.65,amount={early:.25,middle:.60,late:1}[stage],neutral=[[0,q.hipRadiusM,depth*1.03,0],[q.hipYM+(q.shoulderYM-q.hipYM)*.36-bottom,q.waistHalfWidthM,depth*.92,0],[top-bottom,q.shoulderHalfWidthM*.88,depth*1.06,0]],before=rings.map(r=>[r.y,r.rx,r.rz,r.z??0]),after=before.map(r=>[r[0],...r.slice(1).map((v,k)=>lerp(sample(neutral,r[0],k+1),v,amount))]);
 const map=(p:V3):V3=>{const[x,y,z]=p,oldRX=sample(before,y,1),oldRZ=sample(before,y,2),oldZ=sample(before,y,3),rx=sample(after,y,1),rz=sample(after,y,2),zz=sample(after,y,3);return[x*rx/oldRX,y,zz+(z-oldZ)*rz/oldRZ].map(v=>Math.round(v*1e9)/1e9||0)as V3;};
 a.id=id;a.name+=' · '+stage;
 if(amount!==1)for(const mesh of a.meshes??[]){if(mesh.name.includes('下接缝'))continue;for(let k=0;k<mesh.positions.length;k+=3)mesh.positions.splice(k,3,...map(mesh.positions.slice(k,k+3)as V3));for(let k=0;k<mesh.indices.length;k+=3){const ids=mesh.indices.slice(k,k+3),p=ids.map(i=>new Vector3(...mesh.positions.slice(i*3,i*3+3))),normal=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize();for(const i of ids)mesh.normals.splice(i*3,3,...normal.toArray());}}
 const cells=[...new Grid(source.chunks).cells()],center=[0,1,2].map(k=>cells.reduce((sum,[v])=>sum+(v[k]+.5)*source.cellSize,0)/cells.length)as V3,to=map(center),delta=to.map((v,k)=>amount===1?0:Math.round((v-center[k])/source.cellSize))as V3,g=new Grid();
 for(const[v,m]of cells)g.set(v.map((n,k)=>n+delta[k])as V3,m);a.chunks=amount===1?structuredClone(source.chunks):g.serialize();for(const p of a.parts)p.region={min:p.region.min.map((v,k)=>v+delta[k])as V3,max:p.region.max.map((v,k)=>v+delta[k])as V3};
 a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:['CHAR-072'],sourceAssetId:source.id,sourceGeometrySHA256:hash(geometryData(source)),originalRetained:true,pregnancyStage:{stage,fit,amount,sourceRings:before,stageRings:after,replaceIntervalM:[bottom,top],nativeDeltaCells:delta,nativeCellSizeM:source.cellSize,sourceCellCount:cells.length,progressInterval:stage==='early'?[0,1/3]:stage==='middle'?[1/3,2/3]:[2/3,1],intervalMeaning:'clamped (now-startedAt)/(dueAt-startedAt), manual authored stages; original timer not read or modified',timerBound:false,replacementNotOverlay:true,scope:'Same original072clothed abdomen interpolated toward real neutral body cross sections; lower and upper seam profiles identical. Late stage retains exact original mesh and native geometry; no medical or automatic pregnancy simulation claim.'}};
 return a;
}
