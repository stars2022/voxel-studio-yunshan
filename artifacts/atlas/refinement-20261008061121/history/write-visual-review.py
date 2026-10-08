from pathlib import Path
import json,hashlib
work=Path('work/m002-refinement');loc=json.load(open(work/'production-location.json'));root=Path(loc['root']);b=json.load(open(root/'browser-verification.json'));input=json.load(open(work/'review-input.json'))
assert b['status']=='passed'and len(b['views'])==39
assert set(input['proof'])=={v['key']for v in b['views']}
viewed=[]
for v in b['views']:
 data=(root/v['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==v['sha256'];proof=input['proof'][v['key']]
 row={'key':v['key'],'file':v['file'],'sha256':v['sha256'],'inspection':proof['method']}
 if proof['method']=='byte-identical-to-previously-opened-image':
  old=Path(proof['previous']);assert old.read_bytes()==data
  row['previousViewedFile']='history/'+str(old.relative_to(work))
 viewed.append(row)
report={'status':'reviewed-first-reference-pass','run':loc['run'],'referenceSheet':'projects/reference-atlas/images/M002.png','capturedFinalViews':39,'openedFinalImages':sum(r['inspection']=='opened-final-image'for r in viewed),'byteIdenticalPreviouslyOpenedImages':sum(r['inspection']=='byte-identical-to-previously-opened-image'for r in viewed),'viewedFiles':viewed,'models':input['notes'],'sameCameraPairs':12,'maxCameraError':max(r['maxError']for r in b['cameraComparisons']),'presentation':b['presentation'],'method':'Each final image was opened directly or proved byte-identical to an already opened actual image; no inspection was inferred solely from a file name or render success. Before/after share metre bounds, camera matrices and actual purpose finishes.','humanArtAccepted':0,'limits':['This is a first reference refinement pass; final art acceptance is separate.','Cabinet contents, countertop installation combinations and original game functionality are not claimed as complete.','In the editor clay mode, woven artwork is retained; front views verify outline, and the three top closeups separately inspect the actual rug artwork.'],'correctiveEvidence':['history/attempt01/','history/attempt02/','history/attempt03-uv/','history/attempt04-uv-bounds/','history/attempt05-door-handing/','history/postfx-assessment.json']}
(root/'visual-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k]for k in['status','capturedFinalViews','openedFinalImages','byteIdenticalPreviouslyOpenedImages']}))
