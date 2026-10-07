import type {Project,Asset,V3,Material} from '../../src/core/types';
import {ArchitectureBuilder} from '../../src/production/architecture-near-assembly';
import {makeCatalogAsset} from '../../src/production/catalog-assets';
import {lifeRecipes} from '../../src/production/life';
import {geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {variantAppearance,remapVariant} from './variant-appearance';
import {finalVariantSpec} from './final-variant-spec';
const widths:Record<string,number[]>={'LIFE-033':[1.4,1.2,1.8],'LIFE-034':[1.1,.9,1.4],'LIFE-035':[1.6,1.2,2.0],'LIFE-036':[1.9,1.5,2.4]};
export function makeFurnitureVariant(p:Project,catalogId:string,id:string,name:string,input:Record<string,string|number>={}){
 const spec=finalVariantSpec(catalogId,input);if(spec.family!=='furniture')throw new Error('Not furniture');const b=new ArchitectureBuilder(p,id),width=widths[catalogId][['standard','compact','wide'].indexOf(String(spec.parameters.furnitureSize))],warm=spec.parameters.furnitureFinish==='warm',changes:Record<string,Partial<Material>>=catalogId==='LIFE-033'||catalogId==='LIFE-034'?warm?{wood:{color:'#795339'},woodEdge:{color:'#ad8052'}}:{}:warm?{fabric:{color:'#a09077'},fabricEdge:{color:'#796b58'}}:{},style=variantAppearance(p,catalogId.toLowerCase()+'-'+spec.parameters.furnitureFinish,changes),parents:any[]=[],components:any[]=[];
 function install(parentId:string,w:number,at:V3){
  const original=b.original(parentId),parent=p.assets[original];parents.push({catalogId:parentId,parameters:{},assetId:original,geometrySHA256:hash(geometryData(parent))});
  const baseWidth=lifeRecipes[Number(parentId.slice(-3))].size[0],normalizedWidth=Math.abs(w-baseWidth*.75)<1e-9?baseWidth*.75:w;const sourceParams:Record<string,string|number>=w===baseWidth?{}:{width:normalizedWidth},corrections:Record<string,string>={};if(['LIFE-001','LIFE-003','LIFE-010','LIFE-014','LIFE-015','LIFE-016'].includes(parentId))corrections.wall='stone';if(['LIFE-002','LIFE-004'].includes(parentId))corrections.paper='cottonWhite';if(parentId==='LIFE-002')corrections.wall='fabricEdge';if(parentId==='LIFE-003')corrections.energy='displayGlyph';
  const key='final-'+hash([parentId,w,style,p.styles[style]]).slice(0,24),installed=b.asset(key,aid=>{const a:Asset=makeCatalogAsset(parentId,parent.name,aid,p.styles.yunshan,sourceParams,p),material=remapVariant(a,p,style,corrections);a.source={...a.source,kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:[parentId],sourceAssetId:original,sourceGeometrySHA256:hash(geometryData(parent)),furnitureResize:{sourceParams,requestedWidthM:w,originalWidthM:lifeRecipes[Number(parentId.slice(-3))].size[0],method:'Original dimension-aware recipe, constant leg/fitting thickness; no uniform voxel scaling',material}};return a;});
  b.place(installed,at,0,'furniture');components.push({source:original,installed,parentId,width:w,position:at,corrections});
 }
 install(spec.parentCatalogId,width,[0,0,0]);
 if(catalogId==='LIFE-034')install('LIFE-015',width,[0,.42,0]);
 if(catalogId==='LIFE-035'){const inner=Math.max(1.12,width-.12),x=(width-inner)/2;install('LIFE-002',inner,[x,.42,.02]);install('LIFE-003',width,[0,0,1.98]);install('LIFE-004',inner,[x,.62,.02]);}
 if(catalogId==='LIFE-036')install('LIFE-011',width-.22,[.11,.28,.04]);
 return b.finish(catalogId,name,{kind:'catalog-variant',parentCatalogId:spec.parentCatalogId,parentKind:'base',parameters:spec.parameters,physical:true,notCatalogBase:true,finalVariant:{family:'furniture',parents,components,widthM:width,style,finiteAuthorDimensions:true,originalControllerBound:false,originalFunctionPointsBound:false,scope:'Controlled width regeneration with unchanged small fitting dimensions, original complete parents, scoped material purpose corrections and appearance. Actual supports and openings require verification; no original FloorPlan or human-art acceptance.'}});
}
