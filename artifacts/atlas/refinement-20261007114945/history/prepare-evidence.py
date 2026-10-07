from pathlib import Path
import json,hashlib,shutil,re
loc=json.load(open('work/m001-refinement/production-location.json'));root=Path(loc['root']);p=json.loads((root/'production.json').read_text());b=json.loads((root/'browser-verification.json').read_text());v=json.loads((root/'visual-review.json').read_text());
assert b['status']=='passed' and len(b['views'])==39 and len(b['cameraComparisons'])==12
assert len(v['viewedFiles'])==39 and {r['key']for r in b['views']}=={r['key']for r in v['viewedFiles']}
source=json.loads((root/'source-snapshot.json').read_text());assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==r['sha256']for f,r in source['files'].items())
tests=Path('work/m001-refinement/regression-final.txt').read_text();assert 'ℹ pass 52' in tests and 'ℹ fail 0' in tests
assert 'built in' in Path('work/m001-refinement/build-final.txt').read_text()
for m in p['models']:
 assert len(m['contactGroups'])==1 and all(r['closed']and r['oriented']for r in m['closure'])and all(r['attached']for r in m['attachments'])
 for f in m['exportFiles']:
  data=(root/f['file']).read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256']
for f in p['files']:
 data=Path('projects',f['file']).read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256']
# Preserve the actual scripts, raw failures and viewed drafts; closed runtime archives
# have separate byte-exact restoration manifests and are not relabelled as final proof.
h=root/'history';h.mkdir(exist_ok=True)
work=Path('work/m001-refinement')
for file in work.iterdir():
 if file.is_file()and file.suffix in ['.txt','.ts','.py','.json','.png']:shutil.copy2(file,h/file.name)
for folder in ['review-02','review-03','attempt02-evidence']:
 target=h/folder;target.mkdir(exist_ok=True)
 for file in (work/folder).rglob('*'):
  if file.is_file()and 'runtime'not in file.parts:
   rel=file.relative_to(work/folder);dest=target/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dest)
failed=work/'production-attempt01-native-zero';target=h/'production-attempt01-native-zero';target.mkdir(exist_ok=True)
for file in failed.iterdir():
 if file.is_file():shutil.copy2(file,target/file.name)
# Canonical source is also available directly in the commit.
for file in ['scripts/produce-reference-refinement.ts','scripts/verify-reference-refinement-browser.ts','tests/reference-refinement.test.ts','src/core/woven-pattern.ts','src/production/reference-refinement.ts','src/production/refinement-shapes.ts','src/production/refinement-detail-shapes.ts','src/production/refinement-finish.ts']:
 dest=h/'validated-source'/file;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dest)
validation={'status':'passed','run':loc['run'],'referenceSheet':'M001','referencesRefined':12,'newIndependentMasters':0,'referenceConversionStill':793,'humanArtAccepted':0,'nativeDocuments':13,'retainedHistoricalNativeDocuments':12,'newActualGLBsRead':12,'retainedHistoricalGLBsRead':12,'finalExportFilesHashed':75,'retainedExportFilesHashed':48,'newTexturePNGs':3,'triangles':sum(r['triangles']for r in p['models']),'nativeMinimumCells':sum(r['voxels']for r in p['models']),'closedOrientedComponents':sum(len(r['closure'])for r in p['models']),'allComponentContactGraphsConnected':12,'publicCreates':12,'publicRebuildsAndUndo':12,'atlasButtons':12,'capturedAndOpenedViews':39,'sameCameraPairs':12,'maxCameraError':max(r['maxError']for r in b['cameraComparisons']),'regressionTests':52,'build':'passed','sourceSnapshotUnchanged':True,'loadedClientBundlesMatchBuiltFiles':True,'limits':['Reference-v1 is a first refinement pass, not final art acceptance.','Wardrobe shell/doors, clothing, books/plants and countertop props remain separate catalogue assets.','Mirror uses PBR environment response, not planar scene reflection.','Static lights, drawers and controls have no original game-state or animation binding.'],'correctiveEvidence':['history/production-attempt01-native-zero/failure.txt','history/attempt02-evidence/component-contacts.json','history/review-03/visual-review.json'],'validationReports':['production.json','baseline-exports.json','browser-verification.json','visual-review.json','source-snapshot.json']}
(root/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(validation,ensure_ascii=False))
