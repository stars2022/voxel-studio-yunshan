import json,hashlib,subprocess
from pathlib import Path
root=Path.cwd();records=[]
for path in sorted((root/'work/assembly-archives').glob('*/*.zip')):
 info_path=root/'artifacts/atlas'/path.parent.name/'batch-package.json'
 if not info_path.exists():continue
 info=json.loads(info_path.read_text());parts=info.get('archiveParts')
 if not parts or path.name!=info['archive']:continue
 assert not subprocess.check_output(['git','ls-files','--',str(path.relative_to(root))]).strip()
 fullhash=hashlib.sha256(path.read_bytes()).hexdigest();combined=hashlib.sha256();size=0
 for part in parts:
  data=(info_path.parent/part['file']).read_bytes();assert len(data)==part['bytes'] and hashlib.sha256(data).hexdigest()==part['sha256'];combined.update(data);size+=len(data)
 assert size==path.stat().st_size==info['archiveBytes'] and combined.hexdigest()==fullhash==info['archiveSHA256']
 records.append({'duplicateRemoved':str(path.relative_to(root)),'sourceManifest':str(info_path.relative_to(root)),'bytes':size,'sha256':fullhash,'restoration':'Concatenate archiveParts from sourceManifest in listed order; all byte counts and SHA256s verified before removing duplicate scratch ZIP.'})
 path.unlink()
Path('work/m059-buildings/duplicate-archive-verification.json').write_text(json.dumps({'status':'passed','records':records,'recoveredBytes':sum(r['bytes']for r in records)},indent=2)+'\n')
print(len(records),'duplicates removed;',sum(r['bytes']for r in records),'bytes recovered')
