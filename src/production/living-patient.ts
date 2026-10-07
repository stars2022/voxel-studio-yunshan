import type {Asset,Project,V3} from '../core/types';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {AvatarModel} from './avatar-model';
import {garmentRig} from './garment-shapes';
import {roundBand,ellipsePoints,emptyMesh} from './mesh-shapes';
import {orientedQuad} from './attire-shapes';
import {costumeButton} from './costume-details';
import {clipAxis} from './profession-fit';
import {outfitHash} from './outfit-components';

/** Fit actual145 wraps to the actual124 pajama surfaces. Canonical sources are retained by the caller. */
export function patientBandages(p:Project,source:Asset,clothes:Asset){
 const a=structuredClone(source),model=new AvatarModel(p.styles.yunshan),f=garmentRig(model,'adultA'),contacts:{mesh:string;contact:V3;scale:number;joint:string;low:number;high:number}[]=[];
 a.id='m059-patient-bandages';a.name+=' · 病衣外穿安装';model.meshes=[];model.rig!.meshJoints={};
function fitBand(name:string,joint:string,low:number,high:number,rx:number,rz:number,cx:(y:number)=>number){const points:V3[]=[];for(const mesh of clothes.meshes!.filter(m=>clothes.rig!.meshJoints[m.name]===joint))for(let j=0;j<mesh.indices.length;j+=3){const tri=mesh.indices.slice(j,j+3).map(i=>mesh.positions.slice(i*3,i*3+3)as V3);points.push(...clipAxis(clipAxis(tri,1,low,true),1,high,false));}if(!points.length)throw new Error(name+' has no actual clothing');const ring=ellipsePoints({y:0,rx,rz}),ratio=(p:V3)=>Math.max(...ring.map((a,i)=>{const b=ring[(i+1)%16],nx=b[2]-a[2],nz=a[0]-b[0];return(nx*(p[0]-cx(p[1]))+nz*p[2])/(nx*a[0]+nz*a[2]);})),contact=points.reduce((a,b)=>ratio(a)>ratio(b)?a:b),scale=ratio(contact),mesh=roundBand(name,p.styles.yunshan.bandageCloth,[{y:low,rx:rx*scale+.004,rz:rz*scale+.004,x:cx(low)},{y:high,rx:rx*scale+.004,rz:rz*scale+.004,x:cx(high)}],.004);model.mesh(mesh,joint);contacts.push({mesh:name,contact,scale,joint,low,high});}
for(let j=0;j<4;j++)fitBand('躯干外穿缠布-'+j,'chest',f.hip+.06+j*.069,f.hip+.115+j*.069,.15,.12,()=>0);
for(const side of[-1,1])for(let j=0;j<3;j++)fitBand('前臂外穿缠布-'+side+'-'+j,'elbow'+side,f.wrist+(j===0?.033:.013)+j*.06,f.wrist+.055+j*.06,f.armR,f.armR*1.08,y=>side*(f.wristX+(f.q.shoulderHalfWidthM+f.armR*.48-f.wristX)*(y-f.wrist)/(f.elbow-f.wrist)));
const start:V3=[-.12,f.sh-.08,0],end:V3=[.10,f.hip+.10,0],dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy),tx=dx/length,ty=dy/length,ux=ty,uy=-tx,toLocal=([x,y,z]:V3):V3=>[(x-start[0])*ux+(y-start[1])*uy,(x-start[0])*tx+(y-start[1])*ty,z],toWorld=([u,v,z]:V3):V3=>[start[0]+u*ux+v*tx,start[1]+u*uy+v*ty,z],polys:V3[][]=[];
for(const m of [...clothes.meshes!,...model.meshes])for(let j=0;j<m.indices.length;j+=3){let poly=m.indices.slice(j,j+3).map(i=>toLocal(m.positions.slice(i*3,i*3+3)as V3));poly=clipAxis(clipAxis(poly,0,-.013,true),0,.013,false);if(poly.length)polys.push(poly);}
const vs=[...new Set([0,length,...polys.flatMap(poly=>poly.map(p=>p[1])).filter(v=>v>0&&v<length)].map(v=>Math.round(v*1e10)/1e10))].sort((a,b)=>b-a),front=(v:number)=>{const ps:V3[]=[];for(const poly of polys)for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length];if(Math.abs(a[1]-v)<1e-9)ps.push(a);if((a[1]<v&&b[1]>v)||(a[1]>v&&b[1]<v)){const t=(v-a[1])/(b[1]-a[1]);ps.push(a.map((x,k)=>x+t*(b[k]-x))as V3);}}if(!ps.length)throw new Error('No diagonal support');return ps.reduce((a,b)=>a[2]<b[2]?a:b);},strip=emptyMesh('病衣实际表面斜固定织带',p.styles.yunshan.garmentStrap),frames=vs.map(v=>{const c=front(v),back=c[2];return[-1,1].flatMap(s=>[[s*.013,v,back-.006],[s*.013,v,back]]as V3[]).map(toWorld);});
for(let j=0;j<frames.length-1;j++)for(const[u,v]of[[0,2],[2,3],[3,1],[1,0]])orientedQuad(strip,[frames[j][u],frames[j+1][u],frames[j+1][v],frames[j][v]]);orientedQuad(strip,[frames[0][0],frames[0][2],frames[0][3],frames[0][1]]);orientedQuad(strip,[frames.at(-1)![0],frames.at(-1)![1],frames.at(-1)![3],frames.at(-1)![2]]);model.mesh(strip,'chest');for(let i=0;i<3;i++)costumeButton(model,'绷带固定最小夹-'+i,[strip],-.12+.22*(i+1)/4,f.sh-.08+(f.hip+.10-f.sh+.08)*(i+1)/4,'garmentBuckle');
 a.meshes=model.meshes;a.rig=model.rig;a.rig!.sockets=structuredClone(source.rig!.sockets);a.chunks=model.b.g.serialize();a.parts=[{id:'root',name:'病衣外穿固定夹',parent:null,region:model.b.g.bounds()!},...model.b.parts];
 // The first clamp needs one additional native cell of clearance; moving every clamp detaches the middle one.
 const g=new Grid(a.chunks),part=a.parts.find(p=>p.name==='绷带固定最小夹-0')!,region=structuredClone(part.region),moved=[...g.cells()].filter(([v])=>v.every((n,k)=>n>=region.min[k]&&n<region.max[k]));
 for(const[v]of moved)g.set(v,0);for(const[v,m]of moved){const target:V3=[v[0],v[1],v[2]-1];if(g.get(target))throw new Error('Patient native clamp overlaps another native component');g.set(target,m);}
 a.chunks=g.serialize();for(const r of[part.region,...a.rig!.voxelJoints.filter(j=>JSON.stringify(j.region)===JSON.stringify(region)).map(j=>j.region)]){r.min[2]--;r.max[2]--;}
 a.parts[0].region=g.bounds()!;
 a.source={kind:'author-patient-wrap-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,clothingCatalogId:'CHAR-124',clothingGeometrySHA256:outfitHash(geometryData(clothes)),replacedMeshes:source.meshes!.map(m=>({name:m.name,sha256:outfitHash(m)})),originalNativeCells:[...new Grid(source.chunks).cells()],replacementNativeCells:[...g.cells()],minimumClampMove:moved.map(([cell,material])=>({from:cell,to:[cell[0],cell[1],cell[2]-1],material})),nativeClampReconstruction:'Three original-purpose clamps rebuilt on fitted diagonal cloth; same smallest5mm components. First clamp then moves one cell forward, with integer part and rig regions.',contacts,reason:'Ten closed4mm bandage loops fitted to actual pajama triangle envelopes; distal forearm loop starts33mm above wrist. Continuous6mm diagonal support follows actual clothing and wrap surfaces. Original145 geometry, native cells, ports and source retained; no medical or all-pose claim.'};
 return{asset:a,contacts};
}
