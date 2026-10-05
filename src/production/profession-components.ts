import {AvatarModel}from'./avatar-model';import{garmentRig}from'./garment-shapes';import{trousers}from'./garment-lower';
import {outfitHash} from './outfit-components';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import type {Asset,Instance,Project} from '../core/types';
import {garmentScene} from './garment-assembly';
import {costumeWearers} from './costume-assembly';
import {attireWearers} from './attire-assembly';
import {makeGarmentAsset} from './atlas-garments';
import {garmentFrame} from './garment-shapes';
import {splitGarmentBodyMesh} from './garment-body';

export const professionRecipes:Record<number,{clothing:number;accessory:number;family:string;key:string}>={
162:{clothing:132,accessory:111,family:'costume',key:'actor'},163:{clothing:133,accessory:106,family:'costume',key:'actor'},164:{clothing:131,accessory:104,family:'costume',key:'actor'},165:{clothing:126,accessory:148,family:'costume',key:'actor'},166:{clothing:134,accessory:109,family:'costume',key:'actor'},167:{clothing:116,accessory:141,family:'layers',key:'coat-a'},168:{clothing:130,accessory:149,family:'costume',key:'actor'},169:{clothing:135,accessory:136,family:'costume',key:'actor'},170:{clothing:130,accessory:149,family:'costume',key:'actor'},171:{clothing:114,accessory:150,family:'tops',key:'top-1'},172:{clothing:138,accessory:100,family:'attire',key:'actor'},173:{clothing:139,accessory:141,family:'attire',key:'actor'},
};

/** Keep the exact original and derive only the specified installation geometry. */
function fittedBody(source:Asset,fit:string,replaceLegs:boolean,trimWrists:boolean):Asset{
 const a=structuredClone(source),removed:string[]=[],cuts:any[]=[];
 a.id=source.id+'-m058-fit';a.name+=' · 独立安装拟合';
 a.meshes=a.meshes!.filter(m=>{const remove=m.name==='作者颈部连接皮肤'||replaceLegs&&['裤腿','裤脚','膝前'].some(p=>m.name.startsWith(p));if(remove){removed.push(m.name);delete a.rig!.meshJoints[m.name];}return !remove;});
 if(trimWrists)a.meshes=a.meshes.map(m=>{if(!m.name.startsWith('作者短袖暴露前臂'))return m;const y=garmentFrame(fit).wrist+.015,replacement=splitGarmentBodyMesh(m,y,true),joint=a.rig!.meshJoints[m.name];delete a.rig!.meshJoints[m.name];a.rig!.meshJoints[replacement.name]=joint;cuts.push({sourceMesh:m.name,sourceSHA256:outfitHash(m),replacement:replacement.name,keepAboveBindY:y,joint});return replacement;});
 a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),removedMeshes:removed,closedForearmCuts:cuts,originalRetained:true,reason:'Omit duplicate short neck; replace solid neutral trouser shells with separate hollow trousers where required. Farmer exposed wrists end above the actual detailed hand wraps. All other source parts and native cells retained.'};
 return a;
}

function loweredWaist(source:Asset,fit:string):Asset{
 const a=structuredClone(source),hip=garmentFrame(fit).hip,band=a.meshes!.find(m=>m.name==='长裤独立开放腰口')!,scale=.032/.072;
 for(let k=1;k<band.positions.length;k+=3)band.positions[k]=hip-.020+(band.positions[k]-(hip-.020))*scale;
 for(let k=0;k<band.normals.length;k+=3){const n=[band.normals[k],band.normals[k+1]/scale,band.normals[k+2]],length=Math.hypot(...n);band.normals.splice(k,3,...n.map(v=>v/length));}
 const part=a.parts.find(p=>p.name==='裤腰最小扣')!,before=structuredClone(part.region),g=new Grid(a.chunks),moved=[...g.cells()].filter(([v])=>v.every((n,k)=>n>=before.min[k]&&n<before.max[k]));
 for(const[v]of moved)g.set(v,0);for(const[v,m]of moved){const next:[number,number,number]=[v[0],v[1]-8,v[2]];if(g.get(next))throw new Error('Lowered waistband buckle overlaps existing native detail');g.set(next,m);}
 a.chunks=g.serialize();for(const region of[part.region,...a.rig!.voxelJoints.filter(v=>JSON.stringify(v.region)===JSON.stringify(before)).map(v=>v.region)]){region.min[1]-=8;region.max[1]-=8;}
 a.parts.find(p=>p.id==='root')!.region=g.bounds()!;a.ports.find(p=>p.id==='waist')!.position[1]=hip-.004;
 if(fit==='child'){for(let j=0;j<band.positions.length;j++)if(j%3!==1)band.positions[j]*=.96;}
 a.id=source.id+'-m058-low-waist';a.name+=' · 制服内搭低腰口';
 a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,waistband:{mesh:band.name,bottomY:hip-.020,originalTopY:hip+.052,installedTopY:hip+.012},nativeMoves:moved.map(([cell,material])=>({from:cell,to:[cell[0],cell[1]-8,cell[2]],material})),waistPortY:hip-.004,childWaistRadialScale:fit==='child'?.96:1,reason:'Lower only the hollow trouser waistband to clear actual costume lining; move its buckle and binding region together. Other meshes and native cells unchanged.'};return a;
}

export function professionBaseScene(base:Project,n:number){
 const r=professionRecipes[n];if(!r)throw new Error('Unknown outfit recipe');
 const catalogId='CHAR-'+r.clothing,fit=n===165?'child':'adultA',p=r.family==='costume'?costumeWearers(base,[{key:r.key,fit,catalogId}]):r.family==='attire'?attireWearers(base,[{key:r.key,fit,catalogId}]):garmentScene(base,r.family as Parameters<typeof garmentScene>[1]);
 const items=Object.values(p.instances).filter(i=>i.id.startsWith(r.key)),body=items.find(i=>i.id.endsWith('-body'))!,original=p.assets[body.assetId],replaceLegs=r.family==='costume'||r.family==='attire',fitted=fittedBody(original,fit,replaceLegs,n===164);
 p.assets[fitted.id]=fitted;body.assetId=fitted.id;
 if(replaceLegs){const pants=fit==='child'?childPants(p.assets[String(original.source!.sourceAssetId)],p.styles.yunshan):makeGarmentAsset('CHAR-118','原独立空腔裤','m058-trousers-'+fit,p.styles.yunshan,{bodyFit:fit}),low=loweredWaist(pants,fit);p.assets[pants.id]=pants;p.assets[low.id]=low;items.push({...body,id:r.key+'-hollow-trousers',assetId:low.id});}
 if(n===169){const i=items.find(i=>p.assets[i.assetId].source?.catalogId==='CHAR-135')!,old=p.assets[i.assetId],a=withoutCoveredApron(old);p.assets[a.id]=a;i.assetId=a.id;}
 const omitted=items.filter(i=>!p.assets[i.assetId].meshes?.length&&!new Grid(p.assets[i.assetId].chunks).count),installed=items.filter(i=>!omitted.includes(i));
 return{p,items:installed,omitted,recipe:r,fit,sourceScene:r.family,sourceSelection:r.key};
}

// Child-specific installation construction: generate rings from actual CHAR063 proportions, never scale an adult mesh.
function childPants(body:Asset,s:Record<string,number>):Asset{const m=new AvatarModel(s);garmentRig(m,'child');trousers(m,'child');const a:Asset={id:'m058-child-hollow-pants',name:'作者学龄比例空腔裤安装研究',version:1,category:'import',cellSize:.005,origin:[0,0,0],chunks:m.b.g.serialize(),parts:[{id:'root',name:'原生裤扣和织标',parent:null,region:m.b.g.bounds()!},...m.b.parts],meshes:m.meshes,rig:m.rig,ports:m.ports,openings:[],source:{kind:'author-child-hollow-pants',sourceAssetId:body.id,sourceGeometrySHA256:outfitHash(geometryData(body)),originalRetained:true,construction:'118 hollow-trouser construction with separate actual CHAR063 child frame; adult mesh not scaled; no canonical child118 claimed',notCatalogMaster:true}};return a;}

function withoutCoveredApron(source:Asset){const a=structuredClone(source),removedMeshes=a.meshes!.filter(m=>m.name==='服务衣独立围腰'||m.name.startsWith('围裙工具袋')).map(m=>m.name),removedParts=a.parts.filter(p=>p.name.startsWith('围裙工具袋')),g=new Grid(a.chunks),removedCells=[...g.cells()].filter(([cell])=>removedParts.some(p=>cell.every((v,k)=>v>=p.region.min[k]&&v<p.region.max[k])));a.meshes=a.meshes!.filter(m=>!removedMeshes.includes(m.name));for(const name of removedMeshes)delete a.rig!.meshJoints[name];for(const[cell]of removedCells)g.set(cell,0);a.chunks=g.serialize();a.parts=a.parts.filter(p=>!removedParts.includes(p));a.parts.find(p=>p.id==='root')!.region=g.bounds()!;a.rig!.voxelJoints=a.rig!.voxelJoints.filter(j=>!removedParts.some(p=>JSON.stringify(p.region)===JSON.stringify(j.region)));a.id=source.id+'-m058-under-apron';a.name+=' · 独立胸兜围裙内搭';a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,removedMeshes,removedParts,removedNativeCells:removedCells.map(([cell,material])=>({cell,material})),reason:'Omit only the covered original waist apron, its two pockets and their native pocket catches before installing actual136 bib apron. Original135 clothing and all other native details retained.'};return a;}
