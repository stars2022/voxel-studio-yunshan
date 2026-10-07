from pathlib import Path
import argparse,hashlib,json,zipfile,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('label');a=p.parse_args();source=Path(a.source);assert source.is_dir()
assert not subprocess.check_output(['git','ls-files','--',str(source)]).strip()
files=sorted(p for p in source.rglob('*') if p.is_file());assert files and not any(p.is_symlink() for p in files)
manifest=[{'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
target=Path('work/snapshot-archives')/('final-'+a.label+'-runtime.zip');assert not target.exists()
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,str(p))
 z.writestr('__snapshot-manifest.json',json.dumps(manifest))
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for row in manifest:
  b=z.read(row['path']);assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256']
report={'status':'passed','source':str(source),'archive':str(target),'files':len(files),'expandedBytes':sum(x['bytes'] for x in manifest),'archiveBytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'restoration':'Extract verified ZIP at repository root.'}
shutil.rmtree(source)
(Path('work/environment-furniture')/(a.label+'-runtime-archive-verification.json')).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
