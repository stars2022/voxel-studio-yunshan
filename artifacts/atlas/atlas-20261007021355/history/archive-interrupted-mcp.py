import hashlib,json,shutil,zipfile,subprocess
from pathlib import Path
root=Path.cwd();sources=[root/'artifacts/atlas/atlas-20261007021355/variant-mcp-runtime'];target=root/'work/snapshot-archives/m059-building-interrupted-mcp-runtime.zip';target.parent.mkdir(parents=True,exist_ok=True);assert all(source.is_dir()for source in sources) and not target.exists()
assert not subprocess.check_output(['git','ls-files','--',*[str(p.relative_to(root))for p in sources]]).strip()
files=sorted(p for source in sources for p in source.rglob('*') if p.is_file());manifest=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in files]
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in files:z.write(p,p.relative_to(root).as_posix())
 z.writestr('__snapshot-manifest.json',json.dumps(manifest,ensure_ascii=False))
with zipfile.ZipFile(target)as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(manifest)+1
 for r in manifest:
  data=z.read(r['path']);assert len(data)==r['bytes'] and hashlib.sha256(data).hexdigest()==r['sha256']
report={'status':'passed','sources':[source.relative_to(root).as_posix()for source in sources],'archive':target.relative_to(root).as_posix(),'files':len(files),'originalBytes':sum(r['bytes']for r in manifest),'archiveBytes':target.stat().st_size,'archiveSHA256':hashlib.sha256(target.read_bytes()).hexdigest(),'restoration':'Extract at repository root to restore every original path; full manifest included; all byte hashes and CRC verified before removing expanded scratch.'}
(root/'work/m059-buildings/variant-interrupted-mcp-runtime-archive-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');[shutil.rmtree(source)for source in sources];print(json.dumps(report,ensure_ascii=False))
