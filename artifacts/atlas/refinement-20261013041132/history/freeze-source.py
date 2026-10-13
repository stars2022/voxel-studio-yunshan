from pathlib import Path
import json,hashlib,datetime,subprocess
w=Path('work/m003-refinement');loc=json.load(open(w/'production-location.json'))
assert 'ℹ pass 7' in (w/'domestic-final.txt').read_text() and 'ℹ fail 0' in (w/'domestic-final.txt').read_text()
assert 'built in' in (w/'build-final.txt').read_text()
files={p.as_posix():{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for d in ['src','scripts','tests','dist'] for p in sorted(Path(d).rglob('*')) if p.is_file()}
Path(loc['root'],'source-snapshot.json').write_text(json.dumps({'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceBaseCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':files,'initialChecks':'7 domestic tests and build passed; full regression runs against the same frozen source.'},indent=2)+'\n')
print('Frozen',len(files),'source/build files')
