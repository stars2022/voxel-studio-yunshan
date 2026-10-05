import {Vector3}from'three';
import type{Asset,V3}from'../core/types';
import {displayMesh}from'../core/mesh';
import {band,ringPoints,rigidMesh}from'./mesh-shapes';
import {makeWearableAsset}from'./atlas-wearables';
import {makeHeadwearAsset}from'./atlas-headwear';
import {garmentMount}from'./garment-body';
import {garmentFrame}from'./garment-shapes';
import {fittedHat}from'./outfit-accessories';
import {eyeHeight}from'./wearable-face';
import {accessoryInstaller,annularPoints,fitSource,triangles,type ProfessionBase,type ProfessionContact}from'./profession-fit';

function maskFit(b:ProfessionBase,source:Asset){const neck=garmentFrame(b.fit).neck,heads=b.items.filter(i=>i.id.endsWith('-head')||i.id.endsWith('-hair')).map(i=>b.p.assets[i.assetId]),target=triangles(b.p,heads),a=structuredClone(source),contacts:any[]=[];
 for(const side of[-1,1]){const mesh=a.meshes!.find(m=>m.name==='口罩真实耳挂-'+side)!;let best:any,distance=Infinity;
  for(let k=0;k<mesh.positions.length;k+=3){const v=new Vector3(mesh.positions[k],mesh.positions[k+1]+neck,mesh.positions[k+2]);for(const t of target){const A=new Vector3(...t.points[0]),B=new Vector3(...t.points[1]),C=new Vector3(...t.points[2]);const point=closestTriangle(v,A,B,C),d=v.distanceTo(point);if(d<distance){distance=d;best={original:mesh.positions.slice(k,k+3),point:point.toArray(),targetMesh:t.name,shiftM:d};}}}
  if(distance>.002)throw new Error('Mask ear-loop contact exceeds finite local fit');const to=[best.point[0],best.point[1]-neck,best.point[2]];for(let k=0;k<mesh.positions.length;k+=3)if(best.original.every((v:number,j:number)=>Math.abs(mesh.positions[k+j]-v)<1e-10))mesh.positions.splice(k,3,...to);
  for(let k=0;k<mesh.indices.length;k+=3){const v=mesh.indices.slice(k,k+3).map(i=>new Vector3(...mesh.positions.slice(i*3,i*3+3)as V3)),normal=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize();for(const i of mesh.indices.slice(k,k+3))mesh.normals.splice(i*3,3,...normal.toArray());}contacts.push({...best,side});
 }
 a.id=source.id+'-contact-fit';a.name+=' · 实际发侧耳挂接触';fitSource(a,source,{contacts,preservedNativeCells:true,replacedMeshes:['口罩真实耳挂--1','口罩真实耳挂-1'],reason:'Sub-millimetre local fit of actual ear-loop surface vertices to actual head/hair. Endpoints, face cloth and native seam knots unchanged. Contacts are on hair, not claimed to be ear contacts or protective certification.'});return{asset:a,contacts};
}
// Reuse Three.js exact closest-point implementation, without a mesh or physics proxy.
import {Triangle}from'three';
const closestTriangle=(p:Vector3,a:Vector3,b:Vector3,c:Vector3)=>new Triangle(a,b,c).closestPointToPoint(p,new Vector3());

function gogglesFit(b:ProfessionBase,source:Asset){const neck=garmentFrame(b.fit).neck,y=eyeHeight(b.p.styles.yunshan,'adult'),heads=b.items.filter(i=>i.id.endsWith('-head')||i.id.endsWith('-hair')).map(i=>b.p.assets[i.assetId]),a=structuredClone(source),contacts:any[]=[];
 for(const side of[-1,1]){const cx=side*.046,cy=neck+y,polygon=(rx:number,rz:number)=>ringPoints({y:0,rx,rz}).map(v=>[v[0]+cx,v[2]+cy,0]as V3),points=annularPoints(b.p,heads,polygon(.042,.0295),polygon(.036,.0235),[0,1]),touch=points.reduce((a,b)=>a.point[2]<b.point[2]?a:b),front=-.1455,back=touch.point[2],name='镜后独立密封环-'+side;
  if(back<front||back>-.08)throw new Error('Unverified goggle seal extent');const mesh=rigidMesh(band(name,b.p.styles.yunshan.gogglesSeal,{y:front,rx:.042,rz:.0295},{y:back,rx:.042,rz:.0295},.006),[cx,y,0],Math.PI/2);a.meshes=a.meshes!.map(m=>m.name===name?mesh:m);contacts.push({...touch,side,frontZ:front,fittedBackZ:back});
 }
 a.id=source.id+'-seal-fit';a.name+=' · 实际鼻侧密封承接';fitSource(a,source,{contacts,preservedNativeCells:true,replacedMeshes:['镜后独立密封环--1','镜后独立密封环-1'],reason:'Extend only the two independent rear seal rings to the exact frontmost actual head surface inside their annular footprints. Original lens, frame, strap, native buckles and source retained. No pressure, optics or protective-performance claim.'});return{asset:a,contacts};
}

export function addProfessionHeadwear(b:ProfessionBase,contacts:ProfessionContact[]){const n=b.recipe.accessory,s=b.p.styles.yunshan,neck=garmentFrame(b.fit).neck,put=accessoryInstaller(b),headItems=b.items.filter(i=>i.id.endsWith('-head')||i.id.endsWith('-hair'));
 if([104,106,109,111].includes(n)){const source=makeWearableAsset('CHAR-'+n,'原独立头部穿戴','m058-headwear-'+n,s,n<=106?{wearFit:'adult'}:{headFit:'adult'});b.p.assets[source.id]=source;let fitted:Asset,points:{point:V3;leftMeshes?:string[];rightMeshes?:string[]}[];
  if(n<=106){fitted=fittedHat(b,source);const c=fitted.source!.actualHeadContact as V3;points=[{point:[c[0],c[1]+neck,c[2]],rightMeshes:['独立帽盔内衬环']}];}
  else if(n===111){const f=maskFit(b,source);fitted=f.asset;points=f.contacts.map(c=>({point:c.point,leftMeshes:[c.targetMesh],rightMeshes:['口罩真实耳挂-'+c.side]}));}
  else{const f=gogglesFit(b,source);fitted=f.asset;points=f.contacts.map(c=>({point:c.point,leftMeshes:[c.mesh],rightMeshes:['镜后独立密封环-'+c.side]}));}
  b.p.assets[fitted.id]=fitted;const mounted=garmentMount(fitted,b.fit,'head',[0,neck,0],s,fitted.id+'-mounted'),item=put(mounted);for(const point of points)contacts.push({kind:n<=106?'hat-liner':n===111?'mask-loop-hair':'goggle-nose-seal',...point,left:headItems.map(i=>i.id),right:[item.id]});
 }
 if(n===100){const old=b.items.find(i=>i.id.endsWith('-hair'))!;b.items.splice(b.items.indexOf(old),1);b.omitted.push(old);const hair=makeHeadwearAsset('CHAR-093','原独立冠髻','m058-crown-hair',s,{hairFit:'adult'}),crown=makeHeadwearAsset('CHAR-100','原插簪发冠','m058-crown-inserted',s,{pinState:'inserted'});b.p.assets[hair.id]=hair;b.p.assets[crown.id]=crown;const seat=hair.ports.find(p=>p.id==='crown-seat')!.position,hi=put(garmentMount(hair,b.fit,'head',[0,neck,0],s,hair.id+'-mounted')),ci=put(garmentMount(crown,b.fit,'head',[seat[0],seat[1]+neck,seat[2]],s,crown.id+'-mounted'));
  contacts.push({kind:'actual-crown-seat',point:[0,neck+seat[1],seat[2]-.068],left:[hi.id],right:[ci.id],leftMeshes:['承冠织带外缘支承'],rightMeshes:['发冠底座真实空环']});
 }
}
