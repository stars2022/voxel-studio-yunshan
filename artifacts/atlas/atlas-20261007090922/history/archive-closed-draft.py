from pathlib import Path
import hashlib,json,zipfile
r=Path('work/lod-variants');files=sorted(p for p in [*r.glob('source-*.ysvox.json'),*r.glob('comparison-*.ysvox.json'),*(r/'draft-preview-runtime').rglob('*')] if p.is_file())
assert files
manifest=[{'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
target=Path('work/snapshot-archives/lod-variants-closed-final-draft-runtime.zip');assert not target.exists()
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,str(p))
 z.writestr('__snapshot-manifest.json',json.dumps(manifest))
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for row in manifest:
  data=z.read(row['path']);assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']
report={'status':'passed','archive':str(target),'files':len(files),'expandedBytes':sum(x['bytes'] for x in manifest),'archiveBytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'restoration':'Extract verified ZIP at repository root.'}
(r/'closed-draft-runtime-archive-verification.json').write_text(json.dumps(report,indent=2)+'\n')
for p in files:p.unlink()
print(json.dumps(report))
