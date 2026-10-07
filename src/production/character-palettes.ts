import type {Asset,Project} from '../core/types';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {makeCommunityAssembly} from './community-assemblies';
import {outfitHash as hash} from './outfit-components';
import {characterPaletteSpec,type CharacterPaletteDefinition} from './character-palette-spec';

function paletteStyle(p:Project,catalogId:string,d:CharacterPaletteDefinition){
 const name='character-palette-'+catalogId.toLowerCase(),base=p.styles.yunshan,existing=p.styles[name];
 if(existing){if(Object.keys(existing).length!==Object.keys(base).length||Object.entries(base).some(([role,id])=>!d.roles.includes(role)&&existing[role]!==id))throw new Error('人物用途外观样式已被不兼容映射占用');for(const role of d.roles){const m=p.materials[existing[role]],old=p.materials[base[role]];if(!m||existing[role]===base[role]||m.category!==old.category||m.solid!==old.solid)throw new Error('人物用途材质实例无效');}return name;}
 if(Object.keys(base).length>512||Object.keys(p.materials).length+d.roles.length>4096)throw new Error('保留512用途和既有文档材质上限');
 const style={...base};for(const[j,role]of d.roles.entries()){const source=p.materials[base[role]];if(!source||source.solid)throw new Error('人物外观必须引用实际非碰撞用途');let id=600+Number(catalogId.slice(-3))*4+j;if(p.materials[id]){id=1;while(p.materials[id]&&id<=65535)id++;}if(id>65535)throw new Error('没有可用材质ID');p.materials[id]={...structuredClone(source),id,name:source.name+' · '+catalogId,color:d.color};style[role]=id;}p.styles[name]=style;return name;
}
function applyPalette(p:Project,parent:Asset,id:string,style:string,d:CharacterPaletteDefinition){
 const mapping=Object.fromEntries(d.roles.map(role=>[p.styles.yunshan[role],p.styles[style][role]])),a=structuredClone(parent),g=new Grid(a.chunks);
 for(const[v,m]of g.cells())if(mapping[m])g.set(v,mapping[m]);a.chunks=g.serialize();for(const m of a.meshes??[])if(mapping[m.material])m.material=mapping[m.material];
 for(const range of (a.source?.componentIndexRanges??[])as {material:number}[])if(mapping[range.material])range.material=mapping[range.material];
 a.id=id;a.name+=' · 同用途配色';a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[d.parent,...(parent.source?.baseCatalogIds??[])as string[]],sourceAssetId:parent.id,sourceGeometrySHA256:hash(geometryData(parent)),materialRoleStyle:style,style,materialDerivation:{mapping,roles:d.roles,color:d.color,sourceRGBExact:true,originalSeedOrRoleBinding:false,geometryChanged:false,rigUnchanged:true}};return a;
}
export function makeCharacterPalette(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=characterPaletteSpec(catalogId,input),d=spec.definition,b=new ArchitectureBuilder(p,id),style=paletteStyle(p,catalogId,d),derivatives:{sourceAssetId:string;installedAssetId:string;sourceGeometrySHA256:string;changed:boolean}[]=[],details:Record<string,unknown>={family:d.family,roles:d.roles,color:d.color,style,sourceIndex:d.sourceIndex,sourceCondition:d.sourceCondition,sourceRGBExact:true,originalSeedOrRoleBinding:false,derivatives};
 const install=(aid:string,position:[number,number,number],rotation:number)=>{const old=p.assets[aid],used=new Set([...new Grid(old.chunks).cells()].map(([,m])=>m).concat((old.meshes??[]).map(m=>m.material))),changed=d.roles.some(role=>used.has(p.styles.yunshan[role]));
  const child=changed?b.asset('character-tone-'+catalogId.slice(-3)+'-'+hash(aid).slice(0,12)+'-'+d.roles.map(role=>p.styles[style][role]).join('-'),cid=>applyPalette(p,old,cid,style,d)):aid;
  b.place(child,position,rotation,'character');derivatives.push({sourceAssetId:aid,installedAssetId:child,sourceGeometrySHA256:hash(geometryData(old)),changed});
 };
 if(spec.parentKind==='assembly'){
  const parent=makeCommunityAssembly(p,'CHAR-001','palette-retained-resident','完整保留原居民组合');for(const dep of parent.source!.dependencies as string[])b.dependencies.add(dep);b.dependencies.add('CHAR-001');
  Object.assign(details,{retainedParentAssembly:parent,parentSourceGeometryHashes:Object.fromEntries([...new Set(parent.instances.map(i=>i.assetId))].map(aid=>[aid,hash(geometryData(p.assets[aid]))]))});for(const i of parent.instances)install(i.assetId,i.position,i.rotation);
 }else{const parentId=b.original(d.parent,d.parent==='CHAR-002'?{garment:spec.parameters.garment}:{});Object.assign(details,{parentAssetId:parentId,parentGeometrySHA256:hash(geometryData(p.assets[parentId])),parentParameters:p.assets[parentId].source!.parameters});install(parentId,[0,0,0],0);}
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:spec.parentKind,parameters:spec.parameters,physical:false,notCatalogBase:true,characterPalette:{...details,scope:'Exact listed RGB in independent same-purpose instances. Skin matches the actual retained resident face/hands/feet. Coat is original002torso; pants is original004single thigh; hair is original010short back piece. Both002garments retained as finite forms. No complete uniform, new character identity, haircut, seeded appearance, age or role controller binding.'}});
}
