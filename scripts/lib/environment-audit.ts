import {Vector3} from 'three';
import type {Assembly,Project,V3} from '../../src/core/types';
import {CivicAudit} from './civic-audit';
import {inside} from './mesh-audit';
import {displayMesh} from '../../src/core/mesh';
import {atmospherePixels} from '../../src/core/atmosphere-texture';
export function environmentAudit(p:Project,a:Assembly){
 const q=new CivicAudit(p,a),s=a.source as any;
 const visual=(point:V3,id:string)=>{const i=a.instances.find(i=>i.id===id)!,asset=p.assets[i.assetId],c=q.assets.get(asset.id)!,local=q.local(i,point),v=new Vector3(...local);return !!c.grid.get(local.map((n,d)=>Math.floor((n-asset.origin[d])/asset.cellSize))as V3)||c.shapes.some(shape=>inside(v,shape)||shape.ts.some(t=>t.closestPointToPoint(v,new Vector3()).distanceToSquared(v)<1e-14));};
 const atmospheric=[];for(const i of a.instances){const asset=p.assets[i.assetId];for(const m of asset.meshes??[])if(m.atmosphere){const pixels=atmospherePixels(m.atmosphere,p.materials[m.material]),alpha=pixels.data.filter((_,j)=>j%4===3),bounds=q.assets.get(asset.id)!.box,vertices=[];for(let j=0;j<m.positions.length;j+=3)vertices.push(q.world(i,m.positions.slice(j,j+3)as V3));atmospheric.push({instance:i.id,kind:m.atmosphere.kind,nonphysical:!m.collision&&![...q.assets.get(asset.id)!.grid.cells()].length,texture:[pixels.width,pixels.height],alphaRange:[Math.min(...alpha),Math.max(...alpha)],transparentPixels:alpha.filter(v=>v===0).length,opaquePixels:alpha.filter(v=>v===255).length,actualTriangles:m.indices.length/3,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},clearOfTerrain:vertices.every(v=>!q.point(v).some(h=>s.instanceGroups[h.instance]==='terrain')),nativeGLBTexture:true});}}
 const room=s.room,uses=[],seats=[],bearings=[],mounts=[];
 if(room){for(const use of room.usePoints){const clear=q.head(use.key,use.point,use.width,1.72);uses.push({...use,clear:clear.clear,blocked:clear.blocked,footPresent:!!q.point([use.point[0],-.02,use.point[2]],undefined,true).length});}
  for(const seat of room.seats){const point=seat.point as V3,torso=q.clear(seat.key+' seated torso',[point[0]-.22,point[1]+.06,point[2]-.22],[point[0]+.22,point[1]+.98,point[2]+.22],[seat.instance]),approach=q.head(seat.key+' approach',seat.approach,.7,1.72);seats.push({...seat,seatPresent:visual([point[0],point[1]-.015,point[2]],seat.instance),torsoClear:torso.clear,torsoBlocked:torso.blocked,approachClear:approach.clear,approachBlocked:approach.blocked,footPresent:!!q.point([seat.approach[0],-.02,seat.approach[2]],undefined,true).length});}
  for(const pair of room.supportedPairs)for(const point of pair.points)bearings.push({...pair,point,lowerPresent:visual([point[0],point[1]-.002,point[2]],pair.lower),upperPresent:visual([point[0],point[1]+.002,point[2]],pair.upper)});
  for(const mount of room.mounts)mounts.push({...mount,wallPresent:visual(mount.point,mount.wall),fixtureTouchesWall:visual(mount.point,mount.instance)});
 }
 const kitchen=room?.kitchen?{bowlClear:q.clear('actual sink inner bowl',[room.kitchen.bowlCenter[0]-.16,room.kitchen.bowlCenter[1],room.kitchen.bowlCenter[2]-.1],[room.kitchen.bowlCenter[0]+.16,room.kitchen.bowlCenter[1]+.06,room.kitchen.bowlCenter[2]+.1]),hoodOpen:{clear:room.kitchen.hoodGaps.every((v:V3)=>q.clear('actual grille opening',[v[0]-.007,v[1]-.008,v[2]-.05],[v[0]+.007,v[1]+.008,v[2]+.05]).clear),grillePresent:visual(room.kitchen.hoodGrille,room.kitchen.stove),gaps:room.kitchen.hoodGaps}}:null;
 const bonsai=[];if(s.bonsai){const r=s.bonsai;for(const point of[[-.4,.16,-.2],[.4,.16,-.2],[-.4,.16,.2],[.4,.16,.2]]as V3[])bonsai.push({point,soilPresent:visual([point[0],point[1]+.01,point[2]],r.plant),potBearing:visual([point[0],point[1]-.002,point[2]],r.pot)});}
 const drain=s.bonsai?q.clear('actual lower drain bore',[-.04,.081,-.04],[.04,.239,.04]):null;
 const nativeTriangles=a.instances.reduce((n,i)=>n+displayMesh(p.assets[i.assetId],p.materials).reduce((s,b)=>s+b.indices.length/3,0),0);
 return{atmospheric,uses,seats,bearings,mounts,kitchen,bonsai,drain,nativeTriangles,scope:'Independent queries of actual triangles/cells and evaluated texture alpha. Finite author snapshots only; no simulated wind, precipitation, temperature, hydrology or room controllers.'};
}
