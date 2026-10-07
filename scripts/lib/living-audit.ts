import {Vector3} from 'three';
import type {Project,Assembly,V3} from '../../src/core/types';
import {rotateY} from '../../src/core/types';
import {Grid} from '../../src/core/grid';
import {displayMesh} from '../../src/core/mesh';
import {wildlifeComponents} from './wildlife-audit';
import {auditShape,penetration} from './mesh-audit';

/** Decompose compact animal primitives before inside tests; retain actual joint poses and native meshes. */
export function livingWorld(p:Project,a:Assembly){return new Map(a.instances.map(i=>{
 const asset=p.assets[i.assetId],display=displayMesh(asset,p.materials),meshes=(asset.source?.detail as any)?.componentIndexRanges?[...wildlifeComponents(asset,true),...display.filter(m=>!m.meshName).map((m,k)=>({...m,name:'native-'+k}))]:display.map((m,k)=>({...m,name:m.meshName??'native-'+k}));
 return[i.id,meshes.map(m=>{const positions:number[]=[];for(let j=0;j<m.positions.length;j+=3)positions.push(...rotateY(m.positions.slice(j,j+3)as V3,i.rotation).map((v,k)=>v+i.position[k]));return auditShape(m.name,positions,m.indices);})];
}));}

export function livingViewAudit(p:Project,a:Assembly){
 const d=a.source!.living as any;if(!d.firstPerson)return null;
 const {verticalFOVDegrees,aspect,nearM}=d.camera,scale=Math.tan(verticalFOVDegrees*Math.PI/360),width=320,height=180,raster=new Uint8Array(width*height),shapes=[...livingWorld(p,a).values()].flat();let minZ=Infinity,maxZ=-Infinity;
 for(const m of shapes){for(const v of m.vs){minZ=Math.min(minZ,v.z);maxZ=Math.max(maxZ,v.z);}for(const t of m.ts){const points=[t.a,t.b,t.c];if(points.some(p=>p.z>=-nearM))throw new Error('View hands intersect near plane');const [a,b,c]=points.map(p=>[p.x/(-p.z*scale*aspect),p.y/(-p.z*scale)]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-12)continue;
  const loX=Math.max(0,Math.floor((Math.min(a[0],b[0],c[0])+1)/2*width)),hiX=Math.min(width-1,Math.ceil((Math.max(a[0],b[0],c[0])+1)/2*width)),loY=Math.max(0,Math.floor((Math.min(a[1],b[1],c[1])+1)/2*height)),hiY=Math.min(height-1,Math.ceil((Math.max(a[1],b[1],c[1])+1)/2*height));
  for(let y=loY;y<=hiY;y++)for(let x=loX;x<=hiX;x++){const u=2*(x+.5)/width-1,v=2*(y+.5)/height-1,A=((b[1]-c[1])*(u-c[0])+(c[0]-b[0])*(v-c[1]))/den,B=((c[1]-a[1])*(u-c[0])+(a[0]-c[0])*(v-c[1]))/den;if(Math.min(A,B,1-A-B)>=0)raster[y*width+x]=1;}
 }}
 let centerHits=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(Math.abs(2*(x+.5)/width-1)<.12&&Math.abs(2*(y+.5)/height-1)<.12)centerHits+=raster[y*width+x];
 return{camera:d.camera,visibleHandFraction:raster.reduce((a,b)=>a+b,0)/raster.length,centerHits,minZ,maxZ,resolution:[width,height],heldObjects:d.heldObjects.length,method:'Pixel-centre union of actual posed triangles in the explicit author camera; forearms may extend below viewport. No original player controller integration.'};
}

export function livingAudit(p:Project,a:Assembly){
 const d=a.source!.living as any,world=livingWorld(p,a),pairs:any[]=[],distance=(point:V3,ids:string[],names?:string[])=>{const v=new Vector3(...point);return Math.min(...ids.flatMap(id=>world.get(id)!.filter(s=>!names||names.includes(s.name)).flatMap(s=>s.ts.map(t=>t.closestPointToPoint(v,new Vector3()).distanceTo(v)))));};
 for(let j=0;j<a.instances.length;j++)for(let k=j+1;k<a.instances.length;k++){const left=a.instances[j],right=a.instances[k];pairs.push({left:left.id,right:right.id,...penetration(world.get(left.id)!,world.get(right.id)!)});}
 const contacts=d.contacts.map((c:any)=>({...c,leftDistanceM:distance(c.point,c.left,c.leftMeshes),rightDistanceM:distance(c.point,c.right,c.rightMeshes)})),allY=[...world.values()].flatMap(s=>s.flatMap(m=>m.vs.map(v=>v.y))),animalGround=(d.animals??[]).filter((r:any)=>r.bodyGroundY===0||r.groundY===0).map((r:any)=>({instance:r.bodyInstance??r.instance,y:Math.min(...world.get(r.bodyInstance??r.instance)!.flatMap(s=>s.vs.map(v=>v.y)))}));
 return{instances:a.instances.length,pairs,contacts,contactsPassed:contacts.every((c:any)=>Number.isFinite(c.leftDistanceM)&&Number.isFinite(c.rightDistanceM)&&Math.max(c.leftDistanceM,c.rightDistanceM)<2e-8),groundY:d.groundY??null,groundPassed:d.groundY!==0||Math.abs(Math.min(...allY))<2e-8,animalGround,animalGroundPassed:animalGround.every((r:any)=>Math.abs(r.y)<2e-8),minY:Math.min(...allY),maxY:Math.max(...allY),nonphysical:a.instances.every(i=>(p.assets[i.assetId].meshes??[]).every(m=>!m.collision)&&[...new Grid(p.assets[i.assetId].chunks).cells()].every(([,m])=>!p.materials[m].solid)),rigsRetained:a.instances.every(i=>!!p.assets[i.assetId].rig),view:livingViewAudit(p,a),scope:'All installed real posed animal/body/accessory/native triangle pairs. Explicit surface contacts and independent species ground placement; no all-age/all-pose, inventory, animal entity or camera runtime binding.'};
}
