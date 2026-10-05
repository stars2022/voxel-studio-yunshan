import {createHash} from 'node:crypto';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import type {Asset,Instance,Project} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {garmentScene} from './garment-assembly';
import {costumeWearers} from './costume-assembly';
import {attireWearers} from './attire-assembly';
import {makeGarmentAsset} from './atlas-garments';
import {garmentFrame} from './garment-shapes';
import {splitGarmentBodyMesh} from './garment-body';

export const outfitHash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const outfitRecipes:Record<number,{clothing:number;accessory:number;family:string;key:string}>={
 151:{clothing:116,accessory:147,family:'layers',key:'coat-a'},
 152:{clothing:113,accessory:148,family:'tops',key:'top-0'},
 153:{clothing:127,accessory:101,family:'costume',key:'actor'},
 154:{clothing:128,accessory:102,family:'costume',key:'actor'},
 155:{clothing:114,accessory:148,family:'tops',key:'top-1'},
 156:{clothing:129,accessory:150,family:'costume',key:'actor'},
 157:{clothing:117,accessory:120,family:'skirt-sash',key:'sash'},
 158:{clothing:137,accessory:150,family:'attire',key:'actor'},
 159:{clothing:137,accessory:150,family:'attire',key:'actor'},
 160:{clothing:137,accessory:150,family:'attire',key:'actor'},
 161:{clothing:130,accessory:103,family:'costume',key:'actor'},
};

/** Keep the exact original and derive only the specified installation geometry. */
function fittedBody(source:Asset,fit:string,replaceLegs:boolean,trimWrists:boolean):Asset{
 const a=structuredClone(source),removed:string[]=[],cuts:any[]=[];
 a.id=source.id+'-m057-fit';a.name+=' · 独立安装拟合';
 a.meshes=a.meshes!.filter(m=>{const remove=m.name==='作者颈部连接皮肤'||replaceLegs&&['裤腿','裤脚','膝前'].some(p=>m.name.startsWith(p));if(remove){removed.push(m.name);delete a.rig!.meshJoints[m.name];}return !remove;});
 if(trimWrists)a.meshes=a.meshes.map(m=>{if(!m.name.startsWith('作者暴露手臂')||!m.name.endsWith('下分件'))return m;const y=garmentFrame(fit).wrist+.015,replacement=splitGarmentBodyMesh(m,y,true),joint=a.rig!.meshJoints[m.name];delete a.rig!.meshJoints[m.name];a.rig!.meshJoints[replacement.name]=joint;cuts.push({sourceMesh:m.name,sourceSHA256:outfitHash(m),replacement:replacement.name,keepAboveBindY:y,joint});return replacement;});
 a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),removedMeshes:removed,closedForearmCuts:cuts,originalRetained:true,reason:'Omit duplicate short neck; replace solid neutral trouser shells with separate hollow118 where required. Merchant exposed wrists end above the actual detailed hand wraps. All other source parts and native cells retained.'};
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
 a.id=source.id+'-m057-low-waist';a.name+=' · 制服内搭低腰口';
 a.source={kind:'author-outfit-fit',notCatalogMaster:true,sourceAssetId:source.id,sourceGeometrySHA256:outfitHash(geometryData(source)),originalRetained:true,waistband:{mesh:band.name,bottomY:hip-.020,originalTopY:hip+.052,installedTopY:hip+.012},nativeMoves:moved.map(([cell,material])=>({from:cell,to:[cell[0],cell[1]-8,cell[2]],material})),waistPortY:hip-.004,reason:'Lower only the hollow trouser waistband to clear actual costume lining; move its buckle and binding region together. Other meshes and native cells unchanged.'};return a;
}

export function outfitBaseScene(base:Project,n:number){
 const r=outfitRecipes[n];if(!r)throw new Error('Unknown outfit recipe');
 const catalogId='CHAR-'+r.clothing,fit='adultA',p=r.family==='costume'?costumeWearers(base,[{key:r.key,fit,catalogId}]):r.family==='attire'?attireWearers(base,[{key:r.key,fit,catalogId}]):garmentScene(base,r.family as Parameters<typeof garmentScene>[1]);
 const items=Object.values(p.instances).filter(i=>i.id.startsWith(r.key)),body=items.find(i=>i.id.endsWith('-body'))!,original=p.assets[body.assetId],replaceLegs=r.family==='costume'||r.family==='attire',fitted=fittedBody(original,fit,replaceLegs,n===157);
 p.assets[fitted.id]=fitted;body.assetId=fitted.id;
 if(replaceLegs){const pants=makeGarmentAsset('CHAR-118','原独立空腔裤','m057-trousers-'+fit,p.styles.yunshan,{bodyFit:fit}),low=loweredWaist(pants,fit);p.assets[pants.id]=pants;p.assets[low.id]=low;items.push({...body,id:r.key+'-hollow-trousers',assetId:low.id});}
 const omitted=items.filter(i=>!p.assets[i.assetId].meshes?.length&&!new Grid(p.assets[i.assetId].chunks).count),installed=items.filter(i=>!omitted.includes(i));
 return{p,items:installed,omitted,recipe:r,fit,sourceScene:r.family,sourceSelection:r.key};
}

/** Import a selected wearer's entire source graph, never the other gallery actors. */
export function outfitSourceImporter(b:ArchitectureBuilder,scene:Project){
 const mapped=new Map<string,string>(),sources:{sourceSceneAsset:string;retainedAsset:string}[]=[];
 const keep=(key:string):string=>{if(mapped.has(key))return mapped.get(key)!;const old=scene.assets[key];if(!old)throw new Error('Missing outfit source '+key);let id:string;
  if(old.source?.kind==='catalog-recipe'){id=b.original(String(old.source.catalogId),old.source.parameters as Record<string,string|number>);if(outfitHash(geometryData(b.p.assets[id]))!==outfitHash(geometryData(old)))throw new Error('Outfit canonical recipe mismatch '+key);}
  else{const parent=keep(String(old.source!.sourceAssetId)),deps=(b.p.assets[parent].source?.baseCatalogIds??[b.p.assets[parent].source!.catalogId])as string[];id=b.asset('outfit-'+key,aid=>{const a=structuredClone(old);a.id=aid;if(old.source!.kind==='author-reflected-component')a.name=b.p.assets[parent].name+' · 镜像';a.source={kind:'assembly-derived-component',baseCatalogIds:deps,notCatalogMaster:true,sourceAssetId:parent,sourceGeometrySHA256:outfitHash(geometryData(scene.assets[String(old.source!.sourceAssetId)])),retainedAuthorSource:structuredClone(old.source),rigidComponentDerivative:true,originalRetained:true};return a;});}
  mapped.set(key,id);sources.push({sourceSceneAsset:key,retainedAsset:id});return id;
 };return{keep,sources};
}
