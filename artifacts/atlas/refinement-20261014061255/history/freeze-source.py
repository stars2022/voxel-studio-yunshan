from pathlib import Path
import json,hashlib,datetime,subprocess,re
w=Path('work/m008-refinement');loc=json.load(open(w/'production-location.json'));log=(w/'regression-final.txt').read_text()
assert 'ℹ pass 69' in log and 'ℹ fail 0' in log and 'built in' in (w/'build-final.txt').read_text()
names=[re.sub(r' \([0-9.]+ms\)$','',line[2:])for line in log.splitlines()if line.startswith('✔ ')];assert len(names)==len(set(names))==69
(w/'regression-summary.json').write_text(json.dumps({'status':'passed','uniqueTests':69,'tests':names,'reportSHA256':hashlib.sha256((w/'regression-final.txt').read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
files={p.as_posix():{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for folder in ['src','scripts','tests','dist']for p in sorted(Path(folder).rglob('*'))if p.is_file()}
Path(loc['root'],'source-snapshot.json').write_text(json.dumps({'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceBaseCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':files,'checks':'69 regression tests and final build passed before the source freeze.'},indent=2)+'\n')
print({'sourceFiles':len(files),'passingTests':69,'run':loc['run']})
