from pathlib import Path
import json,shutil,subprocess,sys,os

repo=Path.cwd();w=repo/'work/m005-refinement';old=json.load(open(w/'candidate01/production-location.json'));oldroot=repo/old['root'];shadow=w/'corrected-workspace'
shadow.mkdir(exist_ok=True)
for name in ['src','scripts','node_modules']:
 p=shadow/name
 if not p.exists():p.symlink_to(repo/name,target_is_directory=True)
(shadow/'projects').mkdir(exist_ok=True);(shadow/'artifacts/atlas').mkdir(parents=True,exist_ok=True)
for name in ['catalog','reference-atlas']:
 p=shadow/'projects'/name
 if not p.exists():p.symlink_to(repo/'projects'/name,target_is_directory=True)
index=json.load(open(oldroot/'previous-index.json'))
for r in index['entries']:
 if r['sheet']=='M005':
  p=shadow/'projects'/r['file']
  if not p.exists():p.symlink_to(repo/'projects'/r['file'])
shutil.copy2(oldroot/'previous-index.json',shadow/'projects/atlas-production-index.json')
shutil.copy2(oldroot/'previous-latest.json',shadow/'artifacts/atlas/latest.json')
with (w/'production-final.txt').open('w')as f:
 result=subprocess.run(['node','--import','tsx','scripts/produce-reference-refinement.ts','M005'],cwd=shadow,stdout=f,stderr=subprocess.STDOUT)
if result.returncode:sys.exit(result.returncode)
loc=json.load(open(shadow/'work/m005-refinement/production-location.json'));src=shadow/loc['root'];report=json.load(open(src/'production.json'));prior=json.load(open(oldroot/'production.json'))
before={m['id']:m['sha256']for m in prior['models']};changed=sorted(m['id']for m in report['models']if m['sha256']!=before[m['id']]);assert changed==['LIFE-079','LIFE-083'],changed
report['correctionLineage']={'priorCandidateRun':old['run'],'priorCandidate':old['root'],'changedGeometryIds':changed,'unchangedOtherCandidateGeometryHashes':10,'reason':'Move and raise lift control for visibility; preserve wrench tail bore through the complete tool.'}
(src/'production.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
dest=repo/loc['root'];assert not dest.exists();shutil.copytree(src,dest)
for f in report['files']:shutil.copy2(shadow/'projects'/f['file'],repo/'projects'/f['file'])
p=repo/'projects/atlas-production-index.json.tmp';shutil.copy2(shadow/'projects/atlas-production-index.json',p);os.replace(p,repo/'projects/atlas-production-index.json')
(repo/'artifacts/atlas/latest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(w/'production-location.json').write_text(json.dumps(loc)+'\n')
oldstatus=json.load(open(oldroot/'delivery-status.json'));oldstatus.update(state='superseded-for-visual-correction',supersededBy=loc['run'],visualReview='21 images opened; side-control occlusion and occupied wrench tail bores required revision')
(oldroot/'delivery-status.json').write_text(json.dumps(oldstatus,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'corrected-assets-produced-and-published-locally','run':loc['run'],'root':loc['root'],'changedIds':changed,'unchangedOtherHashes':10}))
