from pathlib import Path
import json,shutil,hashlib,re

w=Path('work/m008-refinement');root=Path('artifacts/atlas/m008-refinement-checkpoint')
assert not root.exists();log=(w/'regression-final.txt').read_text();assert 'ℹ pass 69' in log and 'ℹ fail 0'in log
names=[re.sub(r' \([0-9.]+ms\)$','',l[2:])for l in log.splitlines()if l.startswith('✔ ')];assert len(names)==len(set(names))==69
assert 'built in'in(w/'build-final.txt').read_text();review=json.loads((w/'draft-review.json').read_text());assert len(review['viewedIds'])==12
preview=json.loads((w/'draft01/preview.json').read_text());assert len(preview['records'])==12
root.mkdir(parents=True)
for name in ['regression-final.txt','build-final.txt','probe-restored.txt','workspace-refresh-note.json','draft-review.json','asset-notes.json','save-checkpoint.py','preview-draft.ts','produce-isolated.py']:
 shutil.copy2(w/name,root/name)
shutil.copytree(w/'draft01',root/'draft01');shutil.copytree(w/'draft01-source',root/'draft01-source')
sourceFiles=['src/production/civic-refinement.ts','src/production/reference-refinement.ts','src/production/refinement-finish.ts','src/core/surface-artwork.ts','tests/civic-refinement.test.ts','scripts/produce-reference-refinement.ts','scripts/verify-reference-refinement-browser.ts']
source={name:hashlib.sha256(Path(name).read_bytes()).hexdigest()for name in sourceFiles}
for name in sourceFiles:
 t=root/'validated-source'/name;t.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(name,t)
state={'sheet':'M008','state':'validated-source-checkpoint','referencesImplemented':12,'regressionTests':69,'draftImagesCapturedAndOpened':12,'exports':'pending','finalScreenshots':'pending','package':'pending','firstPassSheetsStill':7,'firstPassReferencesStill':84,'humanArtAccepted':0,'purpose':'Preserve verified recipes and real drafts before full asset delivery; no completed asset-batch claim.','sourceSHA256':source}
(root/'checkpoint.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n');print(json.dumps(state,ensure_ascii=False))
