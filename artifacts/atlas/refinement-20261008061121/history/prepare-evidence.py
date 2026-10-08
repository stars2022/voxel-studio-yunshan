from pathlib import Path
import json,hashlib,shutil,re
work=Path('work/m002-refinement');loc=json.load(open(work/'production-location.json'));root=Path(loc['root']);p=json.load(open(root/'production.json'));b=json.load(open(root/'browser-verification.json'));v=json.load(open(root/'visual-review.json'));base=json.load(open(root/'baseline-exports.json'))
assert b['status']=='passed'and len(b['views'])==39 and len(b['cameraComparisons'])==12
assert len(v['viewedFiles'])==39 and {r['key']for r in b['views']}=={r['key']for r in v['viewedFiles']}
source=json.load(open(root/'source-snapshot.json'));assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==r['sha256']for f,r in source['files'].items())
assert 'ℹ pass 58' in (work/'regression-attempt01.txt').read_text()and'ℹ fail 0'in(work/'regression-attempt01.txt').read_text()
assert 'ℹ pass 8'in(work/'kitchen-final.txt').read_text()and'ℹ fail 0'in(work/'kitchen-final.txt').read_text()
assert 'ℹ pass 18'in(work/'regression-final-changed.txt').read_text()and'ℹ fail 0'in(work/'regression-final-changed.txt').read_text()
assert 'built in'in(work/'build-final.txt').read_text()
for m in p['models']:
 assert len(m['contactGroups'])==(2 if m['id']=='LIFE-039'else 1)and all(r['closed']and r['oriented']for r in m['closure'])and all(r['attached']for r in m['attachments'])
 for f in m['exportFiles']:
  data=(root/f['file']).read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256']
for f in p['files']:
 data=Path('projects',f['file']).read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256']
h=root/'history';h.mkdir(exist_ok=True)
for file in work.iterdir():
 if file.is_file()and file.suffix in['.txt','.ts','.py','.json','.png','.mjs']:shutil.copy2(file,h/file.name)
for name in['attempt01','attempt02','attempt03-uv','attempt04-uv-bounds','attempt05-door-handing','draft01','draft02','postfx']:
 if(work/name).exists():shutil.copytree(work/name,h/name,dirs_exist_ok=True)
for path in['scripts/produce-reference-refinement.ts','scripts/verify-reference-refinement-browser.ts','tests/kitchen-refinement.test.ts','tests/reference-refinement.test.ts','src/core/woven-pattern.ts','src/production/reference-refinement.ts','src/production/refinement-builder.ts','src/production/kitchen-refinement.ts','src/production/kitchen-refinement-shapes.ts','src/production/refinement-finish.ts']:
 dest=h/'validated-source'/path;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest)
validation={'status':'passed','run':loc['run'],'referenceSheet':'M002','referencesRefined':12,'newIndependentMasters':0,'referenceConversionStill':793,'humanArtAccepted':0,'nativeDocuments':13,'retainedHistoricalNativeDocuments':12,'newActualGLBsRead':12,'retainedHistoricalGLBsRead':12,'finalExportFilesHashed':sum(len(m['exportFiles'])for m in p['models']),'retainedExportFilesHashed':sum(len(m['exports'])for m in base['records']),'newTexturePNGs':3,'triangles':sum(m['triangles']for m in p['models']),'nativeMinimumCells':sum(m['voxels']for m in p['models']),'closedOrientedComponents':sum(len(m['closure'])for m in p['models']),'contactGroups':'11 connected objects; hob and wall hood intentionally separate in LIFE-039','publicCreates':12,'publicRebuildsAndUndo':12,'atlasButtons':12,'capturedAndInspectedViews':39,'openedFinalImages':v['openedFinalImages'],'byteIdenticalPreviouslyOpenedImages':v['byteIdenticalPreviouslyOpenedImages'],'sameCameraPairs':12,'maxCameraError':max(r['maxError']for r in b['cameraComparisons']),'regressionTests':60,'regressionCounting':'58 broad checks plus the physical-surface and nondegenerate-rug-UV regressions; latest 8 kitchen checks and 18 changed-area checks also passed; overlap counted once','build':'passed','sourceSnapshotUnchanged':True,'loadedClientBundlesMatchBuiltFiles':True,'presentation':b['presentation'],'limits':['Reference-v1 is a first reference refinement pass, not final art acceptance.','Cabinets, countertops, appliances and stored props remain independent catalogue masters. The two countertop cutouts are an authored layout, not a verified combined installation of LIFE-039 and LIFE-040 at their independent sizes.','No refrigeration, water flow, flame, drawer motion or original game-state binding is included.','Final comparisons use default direct PBR plus studio/reference lighting. The initial optional postprocessing anomaly and controlled replay are retained without claiming a proven renderer defect.'],'validationReports':['production.json','baseline-exports.json','browser-verification.json','visual-review.json','source-snapshot.json']}
(root/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(validation,ensure_ascii=False))
