from pathlib import Path
import json,hashlib,shutil,re
w=Path('work/m004-refinement');loc=json.load(open(w/'production-location.json'));root=Path(loc['root']);p=json.load(open(root/'production.json'));b=json.load(open(root/'browser-verification.json'));review=json.load(open(w/'review-input.json'));base=json.load(open(root/'baseline-exports.json'));log=(w/'regression-final.txt').read_text()
assert 'ℹ fail 0' in log
names=[re.sub(r' \([0-9.]+ms\)$','',line[2:])for line in log.splitlines()if line.startswith('✔ ')]
assert len(names)==len(set(names)) and len(names)>=75
(w/'regression-summary.json').write_text(json.dumps({'status':'passed','uniqueTests':len(names),'tests':names,'reportSHA256':hashlib.sha256((w/'regression-final.txt').read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
assert b['status']=='passed' and len(b['views'])==39 and len(b['cameraComparisons'])==12
assert set(review['viewed'])=={v['key']for v in b['views']} and len(review['notes'])==12
for v in b['views']:assert hashlib.sha256((root/v['file']).read_bytes()).hexdigest()==v['sha256']
assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==r['sha256']for f,r in json.load(open(root/'source-snapshot.json'))['files'].items())
for m in p['models']:
 assert len(m['contactGroups'])==(2 if m['id']in['LIFE-069','LIFE-073']else 1) and all(r['closed']and r['oriented']for r in m['closure'])and all(r['attached']for r in m['attachments'])
 for f in m['exportFiles']:assert hashlib.sha256((root/f['file']).read_bytes()).hexdigest()==f['sha256']
for f in p['files']:assert hashlib.sha256(Path('projects',f['file']).read_bytes()).hexdigest()==f['sha256']
before=json.load(open(root/'previous-index.json'));after=json.load(open('projects/atlas-production-index.json'));changed=[a['id']for a,c in zip(after['entries'],before['entries'])if a!=c];assert set(changed)=={m['id']for m in p['models']}and len(after['entries'])==len(before['entries'])==793
old={v['id']:v for v in before['studies']};new={v['id']:v for v in after['studies']};assert all(new[k]==v for k,v in old.items()if k!='M004-gallery')
limits=['First reference refinement pass; final art acceptance remains separate.','Empty independent catalogue masters; no fluid, drawer motion, cloth simulation or original game-state binding.','LIFE-069 and LIFE-073 are single catalogue kits containing separate forms. LIFE-076 is one strap without a duplicated cargo box. Registration bars are author artwork, not scannable logistics identities.','LIFE-065 is an empty authored fixture with eight author display sites; original inventory renderer, quantity and lifecycle rules are retained as source information without new binding.']
visual={'status':'reviewed-first-reference-pass','run':loc['run'],'referenceSheet':'projects/reference-atlas/images/M004.png','capturedFinalViews':39,'openedFinalImages':39,'viewedFiles':[{k:v[k]for k in ['key','file','sha256']}for v in b['views']],'models':review['notes'],'sameCameraPairs':12,'maxCameraError':max(c['maxError']for c in b['cameraComparisons']),'presentation':b['presentation'],'humanArtAccepted':0,'method':'All 39 final screenshots opened and visually inspected. Same metre-space framing and actual camera matrices for before/after. Existing clay display retains fabric artwork; separate closeups verify recoloring and undo.','limits':limits}
(root/'visual-review.json').write_text(json.dumps(visual,ensure_ascii=False,indent=2)+'\n')
v={'status':'passed','run':loc['run'],'referenceSheet':'M004','referencesRefined':12,'newIndependentMasters':0,'referenceConversionStill':793,'humanArtAccepted':0,'nativeDocuments':13,'retainedHistoricalNativeDocuments':12,'newActualGLBsRead':12,'retainedHistoricalGLBsRead':12,'finalExportFilesHashed':sum(len(m['exportFiles'])for m in p['models']),'retainedExportFilesHashed':sum(len(m['exports'])for m in base['records']),'newTexturePNGs':3,'triangles':sum(m['triangles']for m in p['models']),'nativeMinimumCells':sum(m['voxels']for m in p['models']),'closedOrientedComponents':sum(len(m['closure'])for m in p['models']),'contactGroups':'10 connected masters; tray/basket and plate/seal kits each contain two deliberately separate forms','publicCreates':12,'publicRebuildsAndUndo':12,'atlasButtons':12,'capturedAndInspectedViews':39,'sameCameraPairs':12,'maxCameraError':visual['maxCameraError'],'regressionTests':len(names),'build':'passed','sourceSnapshotUnchanged':True,'loadedClientBundlesMatchBuiltFiles':True,'unchangedOtherReferenceEntries':781,'presentation':b['presentation'],'limits':limits}
(root/'validation.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
h=root/'history';h.mkdir(exist_ok=True)
for f in w.iterdir():
 if f.is_file() and f.suffix in ['.py','.ts','.mjs','.txt','.json']:shutil.copy2(f,h/f.name)
for name in ['draft01-source','draft02-source','draft02']:
 if(w/name).exists():shutil.copytree(w/name,h/name,dirs_exist_ok=True)
for f in ['src/production/market-refinement.ts','src/production/market-refinement-shapes.ts','src/production/reference-refinement.ts','src/production/refinement-finish.ts','src/core/woven-pattern.ts','tests/market-refinement.test.ts','scripts/produce-reference-refinement.ts','scripts/verify-reference-refinement-browser.ts']:
 dest=h/'validated-source'/f;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
print(json.dumps(v,ensure_ascii=False))
