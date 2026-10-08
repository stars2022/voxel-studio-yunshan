from pathlib import Path
import json,hashlib,datetime,subprocess,re
work=Path('work/m002-refinement');loc=json.load(open(work/'production-location.json'))
assert 'ℹ pass 8'in(work/'kitchen-final.txt').read_text()and 'ℹ fail 0'in(work/'kitchen-final.txt').read_text()
assert 'built in'in(work/'build-final.txt').read_text()
files={}
for folder in ['src','scripts','tests','dist']:
 for p in sorted(Path(folder).rglob('*')):
  if p.is_file():files[p.as_posix()]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
Path(loc['root'],'source-snapshot.json').write_text(json.dumps({'createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceBaseCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'files':files},indent=2))
names=set();reports=[]
for file in ['regression-attempt01.txt','regression-final-changed.txt','kitchen-final.txt','handing-regression.txt']:
 p=work/file;s=p.read_text();assert 'ℹ fail 0'in s
 entries=[re.sub(r' \([0-9.]+ms\)$','',line[2:])for line in s.splitlines()if line.startswith('✔ ')];names.update(entries);reports.append({'file':file,'pass':len(entries),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert len(names)==60,len(names)
(work/'regression-summary.json').write_text(json.dumps({'status':'passed','uniqueTests':len(names),'reports':reports,'tests':sorted(names)},ensure_ascii=False,indent=2))
print(json.dumps({'run':loc['run'],'sourceFiles':len(files),'distinctPassingTests':len(names)}))
