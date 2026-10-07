import json
from pathlib import Path
root=Path.cwd(); read=lambda p:json.loads(p.read_text()); latest=read(root/'artifacts/atlas/latest.json');out=root/latest['evidence']
groups=['BUILT-032','BUILT-031_BUILT-033_BUILT-034_BUILT-035_BUILT-036_BUILT-037']
reports=[read(out/('variant-verification-'+g+'.json'))for g in groups];materials=[read(out/('material-audit-'+g+'.json'))for g in groups]
assert all(r['status']=='passed' and r['run']==latest['run'] for r in reports+materials)
records=sum([r['records'] for r in reports],[]);variants=sum([r['variants'] for r in reports],[])
order=lambda r:(r['id'],r['params']['buildingPlan'],r['params']['sizeCase'],r['params']['floors'])
records.sort(key=order);variants.sort(key=order)
assert len({order(r) for r in records})==len(records)==32 and len(variants)==25
assert len({r['geometrySHA256'] for r in records})==32 and len({r['id']for r in records})==7
assert sum(len(r['exports'])for r in records)==96 and all(r['audit']['passed']for r in records)
base=reports[0];assert all(r['galleryBounds']==base['galleryBounds'] and r['galleryGroupsDisjoint'] for r in reports)
assert base['sheetProducedReferences']==7 and base['sheetReferenceCount']==12
result={**base,'records':records,'variants':variants,'defaultVariants':7,'finiteForms':32,'distinctGeometryConfigurations':32,'batchComplete':True,'wholeSheetComplete':False,'verificationGroups':groups}
(out/'variant-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(out/'material-audit.json').write_text(json.dumps({**materials[0],'candidates':7,'checks':sum([m['checks']for m in materials],[]),'verificationGroups':groups},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'passed','forms':32,'nonDefaultForms':25,'GLBs':96,'wholeSheetComplete':False}))
