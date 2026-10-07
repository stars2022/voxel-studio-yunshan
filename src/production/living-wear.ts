import type {Asset,Project,V3} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';
import {displayMesh} from '../core/mesh';
import {geometryData} from '../core/sky';
import {clipAxis,clipEdge} from './profession-fit';
import {ellipsePoints,roundBand,rigidMesh} from './mesh-shapes';
import {outfitHash} from './outfit-components';

/** Expand saved compact primitive ranges without changing any vertex, material or face. */
export function livingComponents(a:Asset):AuthoredMesh[]{
 const ranges=(a.source?.detail as any)?.componentIndexRanges;
 if(!ranges)return a.meshes??[];
 return(a.meshes??[]).flatMap(m=>{let end=0;const parts=(ranges[m.name]??[{name:m.name,firstIndex:0,indexCount:m.indices.length}]).map((r:any)=>{
  if(r.firstIndex!==end||r.indexCount<=0||r.indexCount%3)throw new Error('Invalid saved animal component ranges');end+=r.indexCount;
  const indices=m.indices.slice(r.firstIndex,end),used=[...new Set<number>(indices)],map=new Map(used.map((n,k)=>[n,k]));
  return{...m,name:r.name,indices:indices.map(n=>map.get(n)!),positions:used.flatMap(n=>m.positions.slice(n*3,n*3+3)),normals:used.flatMap(n=>m.normals.slice(n*3,n*3+3)),uvs:used.flatMap(n=>m.uvs.slice(n*2,n*2+2))};
 });if(end!==m.indices.length)throw new Error('Incomplete saved animal component partition');return parts;});
}

type RingFit={mesh:string;c:V3;angle:number;lo:number;hi:number;rx:number;rz:number;thickness:number};
/** Change only the inner liner radius until it meets a real clipped body triangle. */
function fittedRing(p:Project,animal:Asset,sourceMesh:AuthoredMesh,f:RingFit,offset:V3){
 const c=f.c.map((v,k)=>v+offset[k])as V3,co=Math.cos(f.angle),si=Math.sin(f.angle),local=([x,y,z]:V3):V3=>[x-c[0],(y-c[1])*co+(z-c[2])*si,-(y-c[1])*si+(z-c[2])*co],world=([x,y,z]:V3):V3=>[x+c[0],y*co-z*si+c[1],y*si+z*co+c[2]],outer=ellipsePoints({y:0,rx:f.rx,rz:f.rz}),points:V3[]=[];
 for(const mesh of displayMesh(animal,p.materials))for(let j=0;j<mesh.indices.length;j+=3){let poly=mesh.indices.slice(j,j+3).map(i=>local(mesh.positions.slice(i*3,i*3+3)as V3));poly=clipAxis(clipAxis(poly,1,f.lo,true),1,f.hi,false);for(let k=0;k<outer.length;k++)poly=clipEdge(poly,outer[k],outer[(k+1)%outer.length],true);points.push(...poly);}
 if(!points.length)throw new Error('No actual animal surface inside '+f.mesh);
 const gauge=(thickness:number)=>{const ring=ellipsePoints({y:0,rx:f.rx-thickness,rz:f.rz-thickness});return points.map(point=>({point,value:Math.max(...ring.map((a,k)=>{const b=ring[(k+1)%ring.length],nx=b[2]-a[2],nz=a[0]-b[0];return(nx*point[0]+nz*point[2])/(nx*a[0]+nz*a[2]);}))})).reduce((a,b)=>a.value>b.value?a:b);};
 let low=f.thickness,high=Math.min(f.rx,f.rz)*.8;if(gauge(low).value>1+1e-8)throw new Error('Source liner already penetrates target '+f.mesh);if(gauge(high).value<1)throw new Error('Target contact cannot be reached');
 for(let k=0;k<44;k++){const mid=(low+high)/2;if(gauge(mid).value<1)low=mid;else high=mid;}
 return{mesh:rigidMesh(roundBand(sourceMesh.name,sourceMesh.material,[{y:f.lo,rx:f.rx,rz:f.rz},{y:f.hi,rx:f.rx,rz:f.rz}],low),f.c,f.angle),contact:world(gauge(low).point),thicknessM:low,originalThicknessM:f.thickness};
}

export function fittedAnimalWear(p:Project,source:Asset,animal:Asset,kind:'collar'|'harness',offset:V3=[0,0,0]){
 const a=structuredClone(source),f=(source.source!.detail as any).fit,parts=livingComponents(source),fits:RingFit[]=kind==='collar'?[{mesh:'项圈贴肤软衬',c:f.c,angle:f.a,lo:-f.w/2+.002,hi:f.w/2-.002,rx:f.rx-.005,rz:f.rz-.005,thickness:.003}]:f.zs.map((z:number,k:number)=>({mesh:'胸背'+k+'harnessLiner',c:[0,f.cy,z],angle:Math.PI/2,lo:-f.w/2,hi:f.w/2,rx:f.rx-.004,rz:f.ry-.004,thickness:.003}));
 const contacts=fits.map(fit=>{const old=parts.find(m=>m.name===fit.mesh);if(!old)throw new Error('Missing animal soft liner '+fit.mesh);const next=fittedRing(p,animal,old,fit,offset);parts[parts.indexOf(old)]=next.mesh;return{mesh:fit.mesh,point:next.contact,thicknessM:next.thicknessM,originalThicknessM:next.originalThicknessM};});
 a.id='m059-fit-'+outfitHash([source.id,animal.id,offset]).slice(0,16);a.name+=' · 实际身体内衬拟合';a.meshes=parts;a.rig!.meshJoints=Object.fromEntries(parts.map(m=>[m.name,a.rig!.joints[0].id]));
 a.source={kind:'author-animal-wear-fit',sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),notCatalogMaster:true,originalRetained:true,targetAnimalCatalogId:animal.source!.catalogId,targetAnimalGeometrySHA256:outfitHash(geometryData(animal)),targetAnimalParameters:animal.source!.parameters,installationOffsetM:offset,contacts,preservedNativeCells:true,preservedOuterGeometry:true,preservedPorts:true,reason:'Fit only actual inner soft-liner radius to independent species body. Outer woven straps, buckles, handles, native pins, ports and original body are unchanged. Rabbit is an explicit cat328 installation derivative, not a public328 rabbit variant. Finite source rest pose only.'};
 return{asset:a,contacts};
}
