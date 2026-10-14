from pathlib import Path
import json,hashlib,shutil,re
w=Path('work/m008-refinement');loc=json.load(open(w/'production-location.json'));root=Path(loc['root']);p=json.load(open(root/'production.json'));b=json.load(open(root/'browser-verification.json'));review=json.load(open(w/'review-input.json'));base=json.load(open(root/'baseline-exports.json'));log=(w/'regression-final.txt').read_text()
assert 'ℹ fail 0' in log
names=[re.sub(r' \([0-9.]+ms\)$','',line[2:])for line in log.splitlines()if line.startswith('✔ ')]
assert len(names)==len(set(names)) and len(names)>=69
(w/'regression-summary.json').write_text(json.dumps({'status':'passed','uniqueTests':len(names),'tests':names,'reportSHA256':hashlib.sha256((w/'regression-final.txt').read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
assert b['status']=='passed' and len(b['views'])==39 and len(b['cameraComparisons'])==12
assert {r['file']:r['sha256']for r in b['loadedBundles']}=={r['file']:r['sha256']for r in b['distFiles']}
assert all(c['maxError']<1e-7 for c in b['cameraComparisons']) and not b['errors']
assert set(review['viewed'])=={v['key']for v in b['views']} and len(review['notes'])==12
for v in b['views']:assert hashlib.sha256((root/v['file']).read_bytes()).hexdigest()==v['sha256']
assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==r['sha256']for f,r in json.load(open(root/'source-snapshot.json'))['files'].items())
for m in p['models']:
 assert m['voxels']>0
 assert len(m['contactGroups'])==(2 if m['id']=='LIFE-126'else 7 if m['id']=='LIFE-141'else 1) and all(r['closed']and r['oriented']for r in m['closure'])and all(r['attached']for r in m['attachments'])
 for f in m['exportFiles']:assert hashlib.sha256((root/f['file']).read_bytes()).hexdigest()==f['sha256']
for f in p['files']:assert hashlib.sha256(Path('projects',f['file']).read_bytes()).hexdigest()==f['sha256']
before=json.load(open(root/'previous-index.json'));after=json.load(open('projects/atlas-production-index.json'));changed=[a['id']for a,c in zip(after['entries'],before['entries'])if a!=c];assert set(changed)=={m['id']for m in p['models']}and len(after['entries'])==len(before['entries'])==793
old={v['id']:v for v in before['studies']};new={v['id']:v for v in after['studies']};assert all(new[k]==v for k,v in old.items()if k!='M008-gallery')
limits=['First reference refinement pass; final art acceptance remains separate.','Static medical and civic fixtures only; no infusion, water flow, sterilization, diagnosis, voting, identity, records, network, power or articulated movement binding.','LIFE-126 is one parallel-rail kit with two separate frames; LIFE-141 one table-and-six-chair kit with seven separate forms; repeats are not new independent assets.','Notice title and cards, portrait and check mark, fluid colors and device labels are static author illustrations; optical faces have zero emissive intensity.']
visual={'status':'reviewed-first-reference-pass','run':loc['run'],'referenceSheet':'projects/reference-atlas/images/M008.png','capturedFinalViews':39,'openedFinalImages':39,'viewedFiles':[{k:v[k]for k in ['key','file','sha256']}for v in b['views']],'models':review['notes'],'sameCameraPairs':12,'maxCameraError':max(c['maxError']for c in b['cameraComparisons']),'presentation':b['presentation'],'humanArtAccepted':0,'method':'All 39 final screenshots opened and visually inspected. Same metre-space framing and actual camera matrices for before/after. Geometry views show actual openings and silhouettes; three material closeups verify isolated notice motif recoloring and undo.','limits':limits}
(root/'visual-review.json').write_text(json.dumps(visual,ensure_ascii=False,indent=2)+'\n')
v={'status':'passed','run':loc['run'],'referenceSheet':'M008','referencesRefined':12,'newIndependentMasters':0,'referenceConversionStill':793,'humanArtAccepted':0,'nativeDocuments':13,'retainedHistoricalNativeDocuments':12,'newActualGLBsRead':12,'retainedHistoricalGLBsRead':12,'finalExportFilesHashed':sum(len(m['exportFiles'])for m in p['models']),'retainedExportFilesHashed':sum(len(m['exports'])for m in base['records']),'newTexturePNGs':sum(1 for m in p['models'] for f in m['exportFiles'] if '/artwork-' in f['file'] and f['file'].endswith('.png')),'triangles':sum(m['triangles']for m in p['models']),'nativeMinimumCells':sum(m['voxels']for m in p['models']),'closedOrientedComponents':sum(len(m['closure'])for m in p['models']),'contactGroups':'10 single-group masters; parallel-rail kit two groups and table-and-six-chair kit seven groups','publicCreates':12,'publicRebuildsAndUndo':12,'atlasButtons':12,'capturedAndInspectedViews':39,'sameCameraPairs':12,'maxCameraError':visual['maxCameraError'],'regressionTests':len(names),'regressionScope':json.loads((w/'regression-scope.json').read_text()),'build':'passed','sourceSnapshotUnchanged':True,'loadedClientBundlesMatchBuiltFiles':True,'unchangedOtherReferenceEntries':781,'presentation':b['presentation'],'limits':limits}
(root/'validation.json').write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
h=root/'history';h.mkdir(exist_ok=True)
for f in w.iterdir():
 if f.is_file() and f.suffix in ['.py','.ts','.mjs','.txt','.json']:shutil.copy2(f,h/f.name)
for name in ['draft01-source','draft-preview-source','draft01','draft02-source','draft02','draft03-source','draft03','candidate01','candidate02']:
 if(w/name).exists():shutil.copytree(w/name,h/name,dirs_exist_ok=True)
for f in ['src/core/surface-artwork.ts','src/core/surface.ts','src/core/schema.ts','src/core/authored-mesh.ts','src/core/mesh.ts','src/client/viewer.ts','src/client/main.ts','src/export/exporter.ts','src/production/refinement-builder.ts','src/production/civic-refinement.ts','src/production/reference-refinement.ts','src/production/refinement-finish.ts','tests/civic-refinement.test.ts','scripts/produce-reference-refinement.ts','scripts/verify-reference-refinement-browser.ts']:
 dest=h/'validated-source'/f;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
print(json.dumps(v,ensure_ascii=False))
