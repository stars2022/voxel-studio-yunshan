from pathlib import Path
for name,destination in [('refinement-shapes','refinement-shapes'),('remaining-shapes','refinement-detail-shapes'),('refined-m001','reference-refinement'),('finish-drafts','refinement-finish')]:
 s=Path('work/m001-refinement/'+name+'.ts').read_text().replace('../../src/core/','../core/').replace('../../src/production/','./')
 if name=='refined-m001':
  s=s.replace("import {makeCatalogAsset} from './catalog-assets';","import {makeLifeAsset} from './life';").replace("from './remaining-shapes'","from './refinement-detail-shapes'")
  s=s.replace("export function makeM001Draft(p:Project,catalogId:string,id=catalogId.toLowerCase()+'-refined'){\n const original=makeCatalogAsset(catalogId,catalogId,id,p.styles.yunshan),b=new DetailBuilder(p,original);", "export const referenceRefinementIds=['LIFE-008','LIFE-009','LIFE-019','LIFE-020','LIFE-023','LIFE-024','LIFE-025','LIFE-026','LIFE-027','LIFE-028','LIFE-029','LIFE-030'];\nexport function makeReferenceRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,context:Project){\n if(!referenceRefinementIds.includes(catalogId))throw Error('此资产尚未验证参考精修版本');\n const p=context,original=makeLifeAsset(catalogId,name,id,style),b=new DetailBuilder(p,original,style);")
  s=s.replace("M001 refinement draft not implemented", "Reference refinement not implemented")
  s=s.replace("帘片连续褶面草稿：", "帘片细化：")
  s=s.replace("const center:V3=[.2+Math.sin(angle)*.191,.381,.2+Math.cos(angle)*.191],foot:V3=[center[0]-.028,.352,center[2]-.012];", "const center:V3=[.2+Math.sin(angle)*.191,.381,.2+Math.cos(angle)*.191];")
 if name=='finish-drafts':s=s.replace('draftFinishCommands','refinementFinishCommands')
 Path('src/production/'+destination+'.ts').write_text(s)
p=Path('src/production/catalog-assets.ts');s=p.read_text();s="import {makeReferenceRefinement,referenceRefinementIds} from './reference-refinement';\n"+s
needle=" if(catalogId==='BUILT-004')return makeSharedWall(name,id,style,params,context);"
assert needle in s
s=s.replace(needle,""" if(params.refinement!==undefined){
  const {refinement,...rest}=params;
  if(!referenceRefinementIds.includes(catalogId)||Object.keys(rest).length||!['baseline','reference-v1'].includes(String(refinement)))throw new Error('未验证的精修资产或参数组合');
  if(refinement==='baseline')return makeLifeAsset(catalogId,name,id,style);
  if(!context)throw new Error('精修需要实际项目材质映射');
  return makeReferenceRefinement(catalogId,name,id,style,context);
 }
"""+needle);p.write_text(s)
p=Path('src/core/schema.ts');s=p.read_text().replace('params:obj({width:positive,height:positive,depth:positive,tileX:',"params:obj({refinement:{enum:['baseline','reference-v1']},width:positive,height:positive,depth:positive,tileX:");assert s.count("refinement:{enum:['baseline','reference-v1']}")==2;p.write_text(s)
p=Path('src/production/library.ts');s=p.read_text();s="import {referenceRefinementIds} from './reference-refinement';\n"+s;s=s.replace('parameters:[1,2,3,4,10,11,14,15,16].includes(Number(n))?',"parameters:referenceRefinementIds.includes(id)?{refinement:{enum:['baseline','reference-v1'],default:'baseline',note:'Explicit optional refinement; previous masters and assemblies retain baseline geometry'}}:[1,2,3,4,10,11,14,15,16].includes(Number(n))?");p.write_text(s)
