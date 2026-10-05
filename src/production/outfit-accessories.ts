import {displayMesh} from '../core/mesh';
import {geometryData} from '../core/sky';
import type {Asset,Project,V3} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';
import {emptyMesh,ellipsePoints,quad} from './mesh-shapes';
import {orientedQuad} from './attire-shapes';
import {garmentFrame,garmentFront,torsoProfiles} from './garment-shapes';
import {garmentMount} from './garment-body';
import {makeAttireAsset} from './atlas-attire';
import {makeWearableAsset} from './atlas-wearables';
import {makeHeldAsset} from './atlas-held';
import {outfitHash,type outfitBaseScene} from './outfit-components';

function clipPlane(poly:V3[],axis:number,value:number,above:boolean){const next:V3[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],A=above?a[axis]>=value:a[axis]<=value,B=above?b[axis]>=value:b[axis]<=value;if(A)next.push(a);if(A!==B){const t=(value-a[axis])/(b[axis]-a[axis]);next.push(a.map((v,k)=>v+(b[k]-v)*t)as V3);}}return next;}
/** Exact maximum of displayed garment triangles clipped to the flat shoulder pad. */
function shoulderHeight(p:Project,coat:Asset,side:number,bag=false){
 const xs=bag?[.106,.134]:[side*.155-.016,side*.155+.016],points:V3[]=[];
 for(const m of displayMesh(coat,p.materials))for(let j=0;j<m.indices.length;j+=3){let poly=m.indices.slice(j,j+3).map(i=>m.positions.slice(i*3,i*3+3)as V3);for(const[axis,value,above]of[[0,xs[0],true],[0,xs[1],false],[2,bag?-.16:-.12,true],[2,bag?.15:.195,false]]as [number,number,boolean][])poly=clipPlane(poly,axis,value,above);points.push(...poly);}
 if(!points.length)throw new Error('No actual coat shoulder below pack strap');
 return points.reduce((a,v)=>v[1]>a[1]?v:a);
}

function fittedShoulderBag(p:Project,source:Asset,clothes:Asset){
 const a=structuredClone(source),contact=shoulderHeight(p,clothes,1,true),h=contact[1]+.003-.410,old=a.meshes!.find(m=>m.name==='挎包实际长肩带')!,mesh=emptyMesh(old.name,p.styles.yunshan.travelLeather),pts:V3[]=[[-.19,.24,0],[-.19,.40,-.16],[-.28,.64,-.20],[-.28,h,-.16],[-.28,h,.15],[-.10,.60,.18],[.19,.40,.14],[.19,.24,0]];
 const frames=pts.map(([x,y,z],i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dy,dz),ny=i===3||i===4?-.003:-dz/length*.003,nz=i===3||i===4?0:dy/length*.003;return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([w,t])=>[x+w*.014,y+t*ny,z+t*nz]as V3);});
 for(let i=0;i<pts.length-1;i++)for(let j=0;j<4;j++){const k=(j+1)%4;orientedQuad(mesh,[frames[i][j],frames[i+1][j],frames[i+1][k],frames[i][k]]);}orientedQuad(mesh,frames[0]);orientedQuad(mesh,[...frames.at(-1)!].reverse());a.meshes=a.meshes!.map(m=>m===old?mesh:m);
 a.id=source.id+'-shoulder-fit-'+String(clothes.source!.catalogId);a.name+=' · 实贴肩部';a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,replacedMeshes:[{name:old.name,sha256:outfitHash(old)}],actualShoulderContacts:[contact],garmentSourceAssetId:clothes.id,garmentGeometrySHA256:outfitHash(geometryData(clothes)),preservedNativeCells:true,preservedPropRig:true,reason:'Lower and flatten only the continuous shoulder span to touch the actual shirt shoulder. Original bag body, anchors, lid, native detail and source retained.'};return a;
}

function fittedHat(base:ReturnType<typeof outfitBaseScene>,source:Asset){
 const{p,items,fit}=base,neck=garmentFrame(fit).neck,points:V3[]=[];
 for(const i of items.filter(i=>i.id.endsWith('-head')||i.id.endsWith('-hair')))for(const m of displayMesh(p.assets[i.assetId],p.materials))for(let j=0;j<m.indices.length;j+=3){let poly=m.indices.slice(j,j+3).map(i=>[m.positions[i*3],m.positions[i*3+1]-neck,m.positions[i*3+2]]as V3);poly=clipPlane(clipPlane(poly,1,.160,true),1,.185,false);points.push(...poly);}
 if(!points.length)throw new Error('No actual head or hair at hat liner');
 const ratio=(thickness:number)=>{const ring=ellipsePoints({y:0,rx:.158-thickness,rz:.151-thickness}),rows=points.map(point=>({point,value:Math.max(...ring.map((a,i)=>{const b=ring[(i+1)%ring.length],nx=b[2]-a[2],nz=a[0]-b[0];return(nx*point[0]+nz*point[2])/(nx*a[0]+nz*a[2]);}))}));return rows.reduce((a,b)=>a.value>b.value?a:b);};
 let lo=.009,hi=.04;if(ratio(lo).value>1+1e-8)throw new Error('Original hat liner already intersects wearer');for(let i=0;i<44;i++){const mid=(lo+hi)/2;if(ratio(mid).value<=1)lo=mid;else hi=mid;}
 const innerRx=.158-lo,innerRz=.151-lo,contact=ratio(lo).point,a=structuredClone(source),old=a.meshes!.find(m=>m.name==='独立帽盔内衬环')!,mesh=emptyMesh(old.name,old.material),outer=[.160,.185].map(y=>ellipsePoints({y,rx:.158,rz:.151})),inner=[.160,.185].map(y=>ellipsePoints({y,rx:innerRx,rz:innerRz}));
 for(let j=0;j<16;j++){const k=(j+1)%16,normal:V3=[outer[0][j][0]+outer[0][k][0],0,outer[0][j][2]+outer[0][k][2]];quad(mesh,[outer[0][j],outer[0][k],outer[1][k],outer[1][j]],normal);quad(mesh,[inner[0][j],inner[0][k],inner[1][k],inner[1][j]],normal.map(v=>-v)as V3);for(const q of[0,1])quad(mesh,[outer[q][j],outer[q][k],inner[q][k],inner[q][j]],[0,q===0?-1:1,0]);}
 a.meshes=a.meshes!.map(m=>m===old?mesh:m);a.id=source.id+'-liner-fit';a.name+=' · 真实头发内衬贴合';a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,replacedMeshes:[{name:old.name,sha256:outfitHash(old)}],originalLinerThicknessM:.009,fittedLinerThicknessM:lo,actualHeadContact:contact,innerRadiiM:[innerRx,innerRz],preservedNativeCells:true,preservedOuterShell:true,reason:'Fit only the inner nonphysical pad boundary to the actual head/hair triangle envelope over the real liner height. Outer shell, original liner, native hardware and ports retained.'};return a;
}

function fittedSash(p:Project,source:Asset,clothes:Asset){
 const hip=garmentFrame('adultA').hip,profile=torsoProfiles('adultA')[0],rx=profile.rx+.036,rz=profile.rz+.036,low=hip+.020,top=hip+.083,points:V3[]=[];
 for(const m of displayMesh(clothes,p.materials))for(let j=0;j<m.indices.length;j+=3){let poly=m.indices.slice(j,j+3).map(i=>m.positions.slice(i*3,i*3+3)as V3);poly=clipPlane(clipPlane(poly,1,low,true),1,top,false);points.push(...poly);}
 const ratio=(thickness:number)=>{const ring=ellipsePoints({y:0,rx:rx-thickness,rz:rz-thickness});return points.map(point=>({point,value:Math.max(...ring.map((a,i)=>{const b=ring[(i+1)%ring.length],nx=b[2]-a[2],nz=a[0]-b[0];return(nx*point[0]+nz*point[2])/(nx*a[0]+nz*a[2]);}))})).reduce((a,b)=>a.value>b.value?a:b);};
 let lo=.008,hi=.06;if(ratio(lo).value>1+1e-8)throw new Error('Original sash already intersects torso');for(let i=0;i<44;i++){const mid=(lo+hi)/2;if(ratio(mid).value<=1)lo=mid;else hi=mid;}
 const a=structuredClone(source),old=a.meshes!.find(m=>m.name==='腰封真开环')!,mesh=emptyMesh(old.name,old.material),outer=[low,top].map(y=>ellipsePoints({y,rx,rz})),inner=[low,top].map(y=>ellipsePoints({y,rx:rx-lo,rz:rz-lo}));
 for(let j=0;j<16;j++){const k=(j+1)%16,normal:V3=[outer[0][j][0]+outer[0][k][0],0,outer[0][j][2]+outer[0][k][2]];quad(mesh,[outer[0][j],outer[0][k],outer[1][k],outer[1][j]],normal);quad(mesh,[inner[0][j],inner[0][k],inner[1][k],inner[1][j]],normal.map(v=>-v)as V3);for(const q of[0,1])quad(mesh,[outer[q][j],outer[q][k],inner[q][k],inner[q][j]],[0,q===0?-1:1,0]);}
 a.meshes=a.meshes!.map(m=>m===old?mesh:m);a.id=source.id+'-waist-fit';a.name+=' · 真实衣腰贴合';a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,replacedMeshes:[{name:old.name,sha256:outfitHash(old)}],originalBandThicknessM:.008,fittedBandThicknessM:lo,actualWaistContact:ratio(lo).point,preservedNativeCells:true,preservedOuterSurface:true,reason:'Fit only the inner sash surface to the actual vest and its fastener envelope. Preserve the outer ring, woven edge, hanging tabs, native hardware and original source.'};return a;
}

function fittedPack(p:Project,source:Asset,coat:Asset){
 const a=structuredClone(source),replaced=a.meshes!.filter(m=>m.name.startsWith('背包肩带真环')).map(m=>({name:m.name,sha256:outfitHash(m)})),contacts:V3[]=[];
 a.meshes=a.meshes!.filter(m=>!m.name.startsWith('背包肩带真环'));for(const r of replaced)delete a.rig!.meshJoints[r.name];
 for(const side of[-1,1]){const contact=shoulderHeight(p,coat,-side),h=contact[1]+.003-.72;contacts.push(contact);
  const pts:V3[]=[[side*.105,.08,.115],[side*.270,.005,.18],[side*.270,.005,.38],[side*.155,.035,.55],[side*.155,.60,.55],[side*.155,h,.40],[side*.155,h,.085],[side*.105,.48,.115]],mesh=emptyMesh('长衫安装连续背包带-'+side,p.styles.yunshan.travelLeather);
  const frames=pts.map(([x,y,z],i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dy,dz),ny=i===5||i===6?.003:-dz/length*.003,nz=i===5||i===6?0:dy/length*.003;return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([w,t])=>[x+w*.016,y+t*ny,z+t*nz]as V3);});
  for(let i=0;i<pts.length-1;i++)for(let j=0;j<4;j++){const k=(j+1)%4;orientedQuad(mesh,[frames[i][j],frames[i+1][j],frames[i+1][k],frames[i][k]]);}orientedQuad(mesh,frames[0]);orientedQuad(mesh,[...frames.at(-1)!].reverse());a.meshes.push(mesh);a.rig!.meshJoints[mesh.name]='root';
 }
 a.id=source.id+'-coat-fit';a.name+=' · 长衫肩带拟合';a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,replacedMeshes:replaced,actualShoulderContacts:contacts,garmentSourceAssetId:coat.id,garmentGeometrySHA256:outfitHash(geometryData(coat)),preservedNativeCells:true,preservedPropRig:true,reason:'Widen only two lower strap loops to clear coat hems; fit continuous flat shoulder spans to actual displayed coat triangles. Original pack body, pockets, lid, hardware and native details unchanged.'};return a;
}

function badgeTab(p:Project,clothes:Asset){
 const x=-.1,y=1.28,z=-.18,m=emptyMesh('实际衣面承接的3mm夹持织带',p.styles.yunshan.garmentStrap),ys=[y+.055,y+.02,y-.03,y-.06,y-.10];
 const frames=ys.map((yy,k)=>[-1,1].flatMap(side=>{const xx=x+side*.012,back=k<3?z+.011:garmentFront(clothes.meshes!,xx,yy);return[[xx,yy,back-.003],[xx,yy,back]]as V3[];}));
 for(let i=0;i<frames.length-1;i++)for(const[j,k]of[[0,2],[2,3],[3,1],[1,0]])orientedQuad(m,[frames[i][j],frames[i+1][j],frames[i+1][k],frames[i][k]]);
 orientedQuad(m,[frames[0][0],frames[0][2],frames[0][3],frames[0][1]]);orientedQuad(m,[frames.at(-1)![0],frames.at(-1)![1],frames.at(-1)![3],frames.at(-1)![2]]);
 const a=structuredClone(clothes);a.id='m057-badge-tab-'+clothes.id;a.name='衣装实际承夹织带';a.meshes=[m];a.chunks={};a.parts=[];a.ports=[];a.rig!.meshJoints={[m.name]:'chest'};a.rig!.voxelJoints=[];a.rig!.sockets={};
 a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:clothes.id,sourceGeometrySHA256:outfitHash(geometryData(clothes)),originalRetained:true,clothContacts:[frames[3][1],frames[3][3],frames[4][1],frames[4][3]],clipBridgeContact:[x,y+.055,z+.010],clipSlotThicknessM:.003,clipSlotM:.004,reason:'Actual closed strap seated on clothing triangles and reaching the real badge back-clip bridge, replacing an unattached test coupon. Badge remains unchanged and carries no live identity.'};return a;
}

export function addOutfitAccessories(base:ReturnType<typeof outfitBaseScene>){
 const {p,items,recipe,fit}=base,s=p.styles.yunshan,body=items[0],at=body.position,notes:any[]=[];
 const put=(a:Asset,position:V3=[at[0],at[1],0],rotation=0)=>{p.assets[a.id]=a;items.push({id:'m057-'+a.id,assetId:a.id,name:a.name,position,rotation,parent:null});return a;};
 const clothes=p.assets[items.find(i=>p.assets[i.assetId].source?.catalogId==='CHAR-'+recipe.clothing)!.assetId];
 if(recipe.accessory===120){const item=items.find(i=>p.assets[i.assetId].source?.catalogId==='CHAR-120')!,original=p.assets[item.assetId],fitted=fittedSash(p,original,clothes);p.assets[fitted.id]=fitted;item.assetId=fitted.id;notes.push({kind:'sash',source:original.id,actualWaistContact:fitted.source!.actualWaistContact});}
 if([101,102,103].includes(recipe.accessory)){const original=makeWearableAsset('CHAR-'+recipe.accessory,'原头部穿戴','m057-hat-'+recipe.accessory,s,{wearFit:'adult'});p.assets[original.id]=original;const fitted=fittedHat(base,original);p.assets[fitted.id]=fitted;put(garmentMount(fitted,fit,'head',[0,garmentFrame(fit).neck,0],s,fitted.id+'-mounted'));notes.push({kind:'hat',source:original.id,headSocket:true,actualContact:fitted.source!.actualHeadContact});}
 if(recipe.accessory===147||recipe.accessory===148){const source=makeAttireAsset('CHAR-'+recipe.accessory,'原旅行携带件','m057-bag-'+recipe.accessory,s,{lid:'closed'});p.assets[source.id]=source;const asset=recipe.accessory===147?fittedPack(p,source,clothes):fittedShoulderBag(p,source,clothes);put(asset,[at[0]+(recipe.accessory===148?.400:0),at[1]+(recipe.accessory===148?.410:.720),recipe.accessory===148?0:.280],recipe.accessory===147?2:0);notes.push({kind:'bag',assetId:asset.id,closedOnly:true,shoulderContacts:asset.source!.actualShoulderContacts});}
 if(recipe.accessory===150){const original=makeHeldAsset('CHAR-150','原职业夹牌','m057-badge-waist',s,{badgeType:'waist'});p.assets[original.id]=original;put(garmentMount(original,fit,'chest',[-.1,1.28,-.18],s,original.id+'-chest-mounted'));const tab=put(badgeTab(p,clothes));notes.push({kind:'badge',source:original.id,tab:tab.id,usedVariant:'waist compact physical clip mounted at chest',staticOriginalInk:true});}
 return notes;
}
