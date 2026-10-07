import type{Asset,Project,V3}from'../core/types';
import {Grid}from'../core/grid';
import {geometryData}from'../core/sky';
import {ArchitectureBuilder}from'./architecture-near-assembly';
import {abdomenSlot,reflectAvatar}from'./avatar-assembly';
import {abdomenProfile}from'./avatar-extensions';
import {outfitHash as hash}from'./outfit-components';
import {faceHead}from'./face-variants';
import {ensureFaceAtlasResource}from'./face-atlas-resource';
import {sculptBody,type BodyForm}from'./body-sculpt';
import {stagedAbdomen}from'./pregnancy-stages';
import {bodyVariantSpec,growthHeads,skinToneColors}from'./body-variant-spec';

export function makeBodyVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=bodyVariantSpec(catalogId,input),b=new ArchitectureBuilder(p,id),parents:{catalogId:string;parameters:Record<string,string|number>;assetId:string;geometrySHA256:string}[]=[],detail:Record<string,any>={family:spec.family,parents};
 const original=(catalogId:string,parameters:Record<string,string|number>={})=>{const assetId=b.original(catalogId,parameters);if(!parents.some(r=>r.assetId===assetId))parents.push({catalogId,parameters,assetId,geometrySHA256:hash(geometryData(p.assets[assetId]))});return assetId;};
 const head=(sourceId:string,bodyId:string)=>b.place(sourceId,[...p.assets[bodyId].ports.find(p=>p.id==='neck')!.position]as V3,0,'head');
 if(spec.family==='body'){
  const parent=original(spec.parentCatalogId,{extremities:'covered'}),body=b.asset('body-sculpt-'+spec.parameters.bodyShape,aid=>sculptBody(p.assets[parent],aid,spec.parameters.bodyShape as BodyForm)),headId=original(spec.parameters.bodyShape==='stoop'?'CHAR-069':'CHAR-066');
  Object.assign(detail,{parentAssetId:parent,installedBodyAssetId:body,headAssetId:headId,bodyInstance:b.place(body,[0,0,0],0,'body'),headInstance:head(headId,body),authorHeightChoice:spec.parameters.bodyShape==='short'?1.55:spec.parameters.bodyShape==='tall'?1.88:null,originalGameplayClearanceUnchanged:true});
 }else if(spec.family==='pregnancy'){
  const fit=String(spec.parameters.abdomenFit),stage=spec.parameters.pregnancyStage as'early'|'middle'|'late',parent=original('CHAR-072',{abdomenFit:fit}),body=original(fit==='adultA'?'CHAR-059':'CHAR-060',{extremities:'covered'}),profile=abdomenProfile(fit),slot=b.asset('body-pregnancy-slot-'+fit,aid=>{const a=abdomenSlot(p.assets[body],fit,aid);a.source={...a.source,kind:'assembly-derived-component',baseCatalogIds:[fit==='adultA'?'CHAR-059':'CHAR-060'],sourceGeometrySHA256:hash(geometryData(p.assets[body])),originalRetained:true};return a;}),abdomen=b.asset('body-pregnancy-'+fit+'-'+stage,aid=>stagedAbdomen(p.assets[parent],aid,stage)),headId=original('CHAR-066');
  Object.assign(detail,{parentAssetId:parent,originalBodyAssetId:body,installedBodyAssetId:slot,abdomenAssetId:abdomen,headAssetId:headId,bodyInstance:b.place(slot,[0,0,0],0,'body'),abdomenInstance:b.place(abdomen,[0,profile.bottom,0],0,'abdomen'),headInstance:head(headId,slot),replacementIntervalM:[profile.bottom,profile.top]});
 }else if(spec.family==='growth'){
  const parent=original('CHAR-066'),band=String(spec.parameters.growthBand),d=growthHeads[band],source=original(d.catalogId,d.parameters),resource=ensureFaceAtlasResource(p),descriptor=resource.meshes![0].faceAtlas!;b.dependencies.add('CHAR-023');
  const installed=b.asset('body-growth-'+band+'-'+hash(descriptor).slice(0,10),aid=>{
   const old=p.assets[source],a=faceHead(old,aid,d.tile,d.height,descriptor),face=a.meshes!.find(m=>m.faceAtlas)!,eye=old.parts.find(p=>p.name.startsWith('眼白'))!,lip=old.parts.find(p=>p.name==='独立唇面')??old.parts.find(p=>p.name.includes('唇'))!,eyeY=(eye.region.min[1]+eye.region.max[1])*.5*old.cellSize,lipY=(lip.region.min[1]+lip.region.max[1])*.5*old.cellSize,anchors=[[0,15.5],[lipY,13.5],[eyeY,d.tile===2?9:8.5],[d.height,.5]];
   if(!(lipY>0&&eyeY>lipY&&eyeY<d.height))throw new Error('缺少原头部实际五官定位');
   for(let k=0;k<face.positions.length/3;k++){if(face.normals[k*3+2]>=-.35)continue;const y=face.positions[k*3+1];let v=.5;if(y<=0)v=15.5;else for(let j=1;j<anchors.length;j++)if(y<=anchors[j][0]){const lo=anchors[j-1],hi=anchors[j];v=lo[1]+(hi[1]-lo[1])*(y-lo[0])/(hi[0]-lo[0]);break;}face.uvs[k*2+1]=Math.max(.5,Math.min(15.5,v))/16;}
   a.source!.growthUV={band,sourceFeatureAnchorsM:{eyeY,lipY},rows:anchors,sameSharedIdentityPalette:true,ageRange:d.range,rangeAuthority:'author subdivision for selecting existing age heads; only18/62texture thresholds are supplied',automaticTransition:false};return a;
  });
  Object.assign(detail,{parentAssetId:parent,selectedHeadParent:source,installedHeadAssetId:installed,resourceAssetId:resource.id,headInstance:b.place(installed,[0,.022,0],0,'head'),growthBand:band,ageRange:d.range,ageRangeAuthority:'author head selection study; original18/62texture thresholds retained',newActorIdentity:false});
 }else{
  const tone=Number(spec.parameters.skinTone),color=skinToneColors[tone],styleName='character-palette-body084-'+tone,base=p.styles.yunshan;
  let style=p.styles[styleName];if(!style){let mid=2200+tone;if(p.materials[mid]){mid=1;while(p.materials[mid]&&mid<=65535)mid++;}if(mid>65535||Object.keys(p.materials).length>=4096)throw new Error('没有可用的肤色材质槽');p.materials[mid]={...structuredClone(p.materials[base.skinSurface]),id:mid,name:'精细肤色参数 '+tone,color};p.styles[styleName]=style={...base,skinSurface:mid};}else if(style.skinSurface===base.skinSurface||!p.materials[style.skinSurface]||p.materials[style.skinSurface].category!=='skin'||p.materials[style.skinSurface].solid||Object.entries(base).some(([role,mid])=>role!=='skinSurface'&&style[role]!==mid))throw new Error('精细肤色用途映射已被不兼容内容占用');
  const parent=original('CHAR-066'),body=original('CHAR-059',{extremities:'sockets'}),handSource=original('CHAR-070',{limbFit:'adult',handPose:'open'}),footSource=original('CHAR-071',{limbFit:'adult'}),hair=original('CHAR-085',{hairFit:'adult'}),derived:{source:string;installed:string;mirrored:boolean}[]=[];
  const colored=(sourceId:string,mirror=false)=>{const aid=b.asset('body084-'+tone+'-'+hash([sourceId,mirror,style.skinSurface]).slice(0,14),id=>{const old=p.assets[sourceId],a=mirror?reflectAvatar(old,id):structuredClone(old);a.id=id;a.name+=' · 肤色'+tone;const g=new Grid(a.chunks);for(const[v,m]of g.cells())if(m===base.skinSurface)g.set(v,style.skinSurface);a.chunks=g.serialize();for(const mesh of a.meshes??[])if(mesh.material===base.skinSurface)mesh.material=style.skinSurface;a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[String(old.source!.catalogId)],sourceAssetId:sourceId,sourceGeometrySHA256:hash(geometryData(old)),originalRetained:true,materialRoleStyle:styleName,skinTone:{tone,color,sourceMaterial:base.skinSurface,targetMaterial:style.skinSurface,mirrorX:mirror,originalRigRetained:true,originalSeedBound:false}};return a;});derived.push({source:sourceId,installed:aid,mirrored:mirror});return aid;};
  const headId=colored(parent);b.place(body,[0,0,0],0,'body');head(headId,body);head(hair,body);for(const side of[-1,1]){b.place(colored(handSource,side>0),[...p.assets[body].ports.find(p=>p.id==='wrist-'+side)!.position]as V3,0,'hand');b.place(colored(footSource,side<0),[...p.assets[body].ports.find(p=>p.id==='ankle-'+side)!.position]as V3,0,'foot');}
  Object.assign(detail,{parentAssetId:parent,installedBodyAssetId:body,installedHeadAssetId:headId,styleName,tone,color,derivatives:derived,roles:['skinSurface'],originalRigAndOtherPurposesUnchanged:true});
 }
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:'base',parameters:spec.parameters,physical:false,notCatalogBase:true,bodyVariant:{...detail,originalRuntimeBound:false,originalProfileOrPregnancyTimerModified:false,scope:'Finite author local body,static posture,pregnancy replacement,age-head/UV or exact five-color skin variants. Complete canonical parents retained. Minimum native cells remain rigid,continuous shapes remain meshes,not new characters or source outfits; no original controller,automatic growth/LOD,simulation or collision binding.'}});
}
