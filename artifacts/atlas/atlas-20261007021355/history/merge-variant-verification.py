import json
from pathlib import Path
root=Path.cwd();read=lambda p:json.loads(p.read_text());latest=read(root/'artifacts/atlas/latest.json');out=root/latest['evidence'];groups=['BUILT-025_BUILT-026_BUILT-030','BUILT-027','BUILT-028_BUILT-029'];reports=[read(out/('variant-verification-'+g+'.json'))for g in groups];materials=[read(out/('material-audit-'+g+'.json'))for g in groups];assert all(r['status']=='passed'and r['run']==latest['run']for r in reports+materials)
records=sum([r['records']for r in reports],[]);variants=sum([r['variants']for r in reports],[]);records.sort(key=lambda r:(r['id'],r['params']['buildingPlan'],r['params']['sizeCase'],r['params']['floors']));variants.sort(key=lambda r:(r['id'],r['params']['buildingPlan'],r['params']['sizeCase'],r['params']['floors']));keys={(r['id'],tuple(r['params'].values()))for r in records};assert len(keys)==len(records)==38 and len(variants)==32;assert len({r['geometrySHA256']for r in records})==38;assert len({r['id']for r in records})==6;assert sum(len(r['exports'])for r in records)==114;assert all(r['audit']['passed']for r in records)
base=reports[0];assert all(r['galleryBounds']==base['galleryBounds']and r['galleryGroupsDisjoint']for r in reports)
result={**base,'records':records,'variants':variants,'defaultVariants':6,'finiteForms':38,'distinctGeometryConfigurations':38,'wholeSheetComplete':True,'verificationGroups':groups}
(out/'variant-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(out/'material-audit.json').write_text(json.dumps({**materials[0],'candidates':6,'checks':sum([m['checks']for m in materials],[]),'verificationGroups':groups},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'passed','forms':38,'variants':32,'GLBs':114,'groups':groups}))
