from pathlib import Path
import json,shutil,subprocess,sys,os

repo=Path.cwd();w=repo/'work/m008-refinement';shadow=w/'production-workspace'
assert not shadow.exists();shadow.mkdir()
for name in ['src','scripts','node_modules']:(shadow/name).symlink_to(repo/name,target_is_directory=True)
(shadow/'projects').mkdir();(shadow/'artifacts/atlas').mkdir(parents=True)
for name in ['catalog','reference-atlas']:(shadow/'projects'/name).symlink_to(repo/'projects'/name,target_is_directory=True)
index=json.loads((repo/'projects/atlas-production-index.json').read_text())
for row in index['entries']:
 if row['sheet']=='M008':(shadow/'projects'/row['file']).symlink_to(repo/'projects'/row['file'])
shutil.copy2(repo/'projects/atlas-production-index.json',shadow/'projects/atlas-production-index.json');shutil.copy2(repo/'artifacts/atlas/latest.json',shadow/'artifacts/atlas/latest.json')
with (w/'production-final.txt').open('w')as f:result=subprocess.run(['node','--import','tsx','scripts/produce-reference-refinement.ts','M008'],cwd=shadow,stdout=f,stderr=subprocess.STDOUT)
if result.returncode:sys.exit(result.returncode)
loc=json.loads((shadow/'work/m008-refinement/production-location.json').read_text());source=shadow/loc['root'];report=json.loads((source/'production.json').read_text());dest=repo/loc['root'];assert not dest.exists();shutil.copytree(source,dest)
for row in report['files']:shutil.copy2(shadow/'projects'/row['file'],repo/'projects'/row['file'])
temp=repo/'projects/atlas-production-index.json.tmp';shutil.copy2(shadow/'projects/atlas-production-index.json',temp);os.replace(temp,repo/'projects/atlas-production-index.json');shutil.copy2(source/'production.json',repo/'artifacts/atlas/latest.json');(w/'production-location.json').write_text(json.dumps(loc)+'\n')
print(json.dumps({'status':'produced-and-export-readback-passed','run':loc['run'],'root':loc['root'],'references':len(report['models'])}))
