from pathlib import Path
import subprocess,hashlib,json,time,shutil
root=Path.cwd();git=root/'.git';dest=root/'work/m060/git-storage-verification.json'
refs=subprocess.check_output(['git','show-ref']).decode();head=subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()
files=[p for d in (git/'objects').iterdir()if d.is_dir() and len(d.name)==2 and all(c in '0123456789abcdef'for c in d.name) for p in d.iterdir()if p.is_file() and len(p.name)==38]
name_lines=subprocess.check_output(['git','rev-list','--objects','--all']).decode().splitlines();names={line[:40]:line[41:] for line in name_lines if len(line)>40}
# Bounded batches keep enough free space while Git itself removes only packed duplicates.
files.sort(key=lambda p:(Path(names.get(p.parent.name+p.name,'')).suffix,p.stat().st_size,p.parent.name+p.name));batches=[];batch=[];size=0
for p in files:
 n=p.stat().st_size
 if batch and size+n>96*1024**2:batches.append(batch);batch=[];size=0
 batch.append(p);size+=n
if batch:batches.append(batch)
report={'status':'running','head':head,'refsSHA256':hashlib.sha256(refs.encode()).hexdigest(),'looseObjects':len(files),'looseBytes':sum(p.stat().st_size for p in files),'batches':[]}
for k,batch in enumerate(batches):
 before=shutil.disk_usage(root).free;assert before>220*1024**2,'Maintain temporary pack headroom'
 oids=[p.parent.name+p.name for p in batch if p.exists()];data='\n'.join(oid+(' '+names[oid]if oid in names else '')for oid in oids)+'\n'
 packed=subprocess.run(['git','-c','pack.threads=1','-c','pack.windowMemory=64m','pack-objects','--window=10','--depth=50','.git/objects/pack/pack'],input=data,text=True,check=True,capture_output=True).stdout.strip()
 for pack in packed.splitlines():subprocess.run(['git','verify-pack','-s',str(git/'objects/pack'/('pack-'+pack+'.idx'))],check=True,stdout=subprocess.DEVNULL)
 checks=subprocess.check_output(['git','cat-file','--batch-check'],input=('\n'.join(oids)+'\n').encode()).decode().splitlines();assert len(checks)==len(oids) and all(not line.endswith(' missing')for line in checks)
 subprocess.run(['git','prune-packed'],check=True)
 assert subprocess.check_output(['git','show-ref']).decode()==refs and subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()==head
 row={'batch':k+1,'objects':len(oids),'pack':packed,'freeBytesBefore':before,'freeBytesAfter':shutil.disk_usage(root).free};report['batches'].append(row);dest.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(row),flush=True)
subprocess.run(['git','fsck','--connectivity-only','--no-dangling'],check=True,stdout=subprocess.DEVNULL)
report['status']='passed';report['refsUnchanged']=True;report['headUnchanged']=True;report['freeBytesAfter']=shutil.disk_usage(root).free;dest.write_text(json.dumps(report,indent=2)+'\n');print('Git storage compaction passed',flush=True)
