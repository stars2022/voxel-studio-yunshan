import {Vector3} from 'three';
import type {Project,Assembly,Instance,V3} from '../../src/core/types';
import {rotateY} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {displayMesh} from '../../src/core/mesh';
import {garmentFrame} from '../../src/production/garment-shapes';
import {auditShape,penetration,type Shape} from './mesh-audit';

export function outfitAudit(p:Project,a:Assembly){
 const o=a.source!.outfit as any,world=new Map(a.instances.map(i=>[i.id,displayMesh(p.assets[i.assetId],p.materials).map((m,k)=>auditShape(m.meshName??'native-'+k,m.positions.map((_,j)=>{const idx=Math.floor(j/3)*3,v=rotateY(m.positions.slice(idx,idx+3)as V3,i.rotation);return v[j%3]+i.position[j%3];}),m.indices))])),pairs:any[]=[],contacts:any[]=[];
 const distance=(point:V3,items:Instance[],filter=(s:Shape)=>true)=>{const v=new Vector3(...point);return Math.min(...items.flatMap(i=>world.get(i.id)!.filter(filter).flatMap(s=>s.ts.map(t=>t.closestPointToPoint(v,new Vector3()).distanceTo(v)))));};
 const from=(i:Instance,catalogId:string)=>{let asset=p.assets[i.assetId];const seen=new Set<string>();while(asset&&!seen.has(asset.id)){if(asset.source?.catalogId===catalogId)return true;seen.add(asset.id);asset=p.assets[String(asset.source?.sourceAssetId)];}return false;};
 for(let j=0;j<a.instances.length;j++)for(let k=j+1;k<a.instances.length;k++){const left=a.instances[j],right=a.instances[k];pairs.push({left:left.id,right:right.id,leftAsset:left.assetId,rightAsset:right.assetId,...penetration(world.get(left.id)!,world.get(right.id)!)});}
 const cloth=a.instances.find(i=>from(i,o.clothing)),offset=cloth?.position??[0,0,0],shift=(point:V3)=>point.map((v,k)=>v+offset[k])as V3;
 if(!o.distant)for(const note of o.accessories){
  const accessory=a.instances.filter(i=>from(i,o.accessory));
  if(note.kind==='bag')for(const local of note.shoulderContacts){const point=shift(local);contacts.push({kind:'shoulder-strap',point,clothingDistanceM:distance(point,[cloth!]),accessoryDistanceM:distance(point,accessory,s=>s.name.includes('肩带')||s.name.includes('背包带'))});}
  if(note.kind==='hat'){const point=shift([note.actualContact[0],note.actualContact[1]+garmentFrame(o.bodyFit).neck,note.actualContact[2]]),head=a.instances.filter(i=>from(i,'CHAR-066')||from(i,'CHAR-085'));contacts.push({kind:'head-liner',point,clothingDistanceM:distance(point,head),accessoryDistanceM:distance(point,accessory,s=>s.name==='独立帽盔内衬环')});}
  if(note.kind==='sash'){const point=shift(note.actualWaistContact);contacts.push({kind:'sash-waist',point,clothingDistanceM:distance(point,[cloth!]),accessoryDistanceM:distance(point,accessory,s=>s.name==='腰封真开环')});}
  if(note.kind==='badge'){const mapped=o.sourceGraph.find((r:any)=>r.sourceSceneAsset===note.tab)!.retainedAsset,tab=a.instances.find(i=>i.assetId===mapped)!,source=p.assets[mapped].source!.retainedAuthorSource as any;for(const local of source.clothContacts){const point=shift(local);contacts.push({kind:'badge-cloth-tab',point,clothingDistanceM:distance(point,[cloth!]),accessoryDistanceM:distance(point,[tab])});}const point=shift(source.clipBridgeContact);contacts.push({kind:'badge-real-clip',point,clothingDistanceM:distance(point,[tab]),accessoryDistanceM:distance(point,accessory,s=>s.name==='背夹上桥')});}
 }
 const soles=a.instances.flatMap(i=>world.get(i.id)!.filter(s=>s.name.includes('真实橡胶鞋底')).flatMap(s=>s.vs.map(v=>v.y))),shoeGroundY=Math.min(...soles),allY=[...world.values()].flatMap(s=>s.flatMap(m=>m.vs.map(v=>v.y)));
 return{instances:a.instances.length,pairs,contacts,contactsPassed:contacts.every(r=>Number.isFinite(r.clothingDistanceM)&&Number.isFinite(r.accessoryDistanceM)&&Math.max(r.clothingDistanceM,r.accessoryDistanceM)<2e-8),shoeGroundY,shoeGroundPassed:Math.abs(shoeGroundY-o.groundY)<1e-8,minY:Math.min(...allY),maxY:Math.max(...allY),nonphysical:a.instances.every(i=>(p.assets[i.assetId].meshes??[]).every(m=>!m.collision)&&[...new Grid(p.assets[i.assetId].chunks).cells()].every(([,m])=>!p.materials[m].solid)),rigsRetained:o.distant?a.instances.every(i=>!p.assets[i.assetId].rig):a.instances.every(i=>!!p.assets[i.assetId].rig),distant:!!o.distant,scope:'Actual displayed pose triangle pairs, explicit clothing/strap/liner/clip surface contacts and actual shoe soles. Finite standing adultA only; static rigid clothing, no original character controllers.'};
}
