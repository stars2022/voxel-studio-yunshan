"""Losslessly store scratch ZIP bytes as shared raw segments; restore exact original ZIPs."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,struct,subprocess,zipfile
root=Path.cwd();source=root/'work/snapshot-archives';store=root/'work/snapshot-archive-cas';objects=store/'objects';manifests=store/'manifests'
parser=argparse.ArgumentParser();parser.add_argument('--restore',type=Path);args=parser.parse_args()
def digest_file(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  while block:=f.read(1024**2):h.update(block)
 return h.hexdigest()
def object_path(digest):
 assert len(digest)==64 and all(c in '0123456789abcdef'for c in digest)
 return objects/digest[:2]/digest[2:]
def data_for(row):
 p=object_path(row['sha256']);data=p.read_bytes();assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'];return data
def verify(m,original=None):
 h=hashlib.sha256();n=0;f=original.open('rb')if original else None
 try:
  for row in m['segments']:
   data=data_for(row);h.update(data);n+=len(data)
   if f:assert f.read(len(data))==data
  if f:assert f.read(1)==b''
 finally:
  if f:f.close()
 assert n==m['archiveBytes'] and h.hexdigest()==m['archiveSHA256']
def restore(mp):
 m=json.loads(mp.read_text());p=root/m['originalPath'];assert p.resolve().is_relative_to(source.resolve())
 if p.exists():assert digest_file(p)==m['archiveSHA256'];return
 verify(m);p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_name(p.name+'.restoring')
 with tmp.open('wb')as out:
  for row in m['segments']:out.write(data_for(row))
  out.flush();os.fsync(out.fileno())
 assert tmp.stat().st_size==m['archiveBytes'] and digest_file(tmp)==m['archiveSHA256'];os.chmod(tmp,m['mode']);os.utime(tmp,ns=(m['atimeNs'],m['mtimeNs']));os.replace(tmp,p);print('Restored '+m['originalPath'])
if args.restore:
 restore(args.restore);raise SystemExit
objects.mkdir(parents=True,exist_ok=True);manifests.mkdir(parents=True,exist_ok=True)
paths=[source/'body-variants-closed-draft-runtime-01.zip'];assert not subprocess.check_output(['git','ls-files','--',str(source.relative_to(root))]).strip()
report={'status':'running','format':'exact-zip-segment-store','freeBytesBefore':shutil.disk_usage(root).free,'archives':[]};report_path=root/'work/body-variants/draft-cas-verification.json'
for p in paths:
 st=p.stat();assert p.is_file()and not p.is_symlink();archive_sha=digest_file(p);regions=[];cursor=0
 with zipfile.ZipFile(p)as z,p.open('rb')as f:
  for info in sorted(z.infolist(),key=lambda r:r.header_offset):
   f.seek(info.header_offset);header=f.read(30);assert header[:4]==b'PK\x03\x04';name_size,extra_size=struct.unpack('<HH',header[26:30]);begin=info.header_offset+30+name_size+extra_size;end=begin+info.compress_size;assert begin>=cursor and end<=st.st_size
   if begin>cursor:regions.append((cursor,begin-cursor,'header-or-descriptor'))
   if info.compress_size:regions.append((begin,info.compress_size,'compressed-payload'))
   cursor=end
  if cursor<st.st_size:regions.append((cursor,st.st_size-cursor,'central-directory-and-footer'))
 segments=[];new_sizes={}
 with p.open('rb')as f:
  for offset,n,kind in regions:
   f.seek(offset);data=f.read(n);assert len(data)==n;sha=hashlib.sha256(data).hexdigest();segments.append({'offset':offset,'bytes':n,'sha256':sha,'kind':kind})
   if not object_path(sha).exists():new_sizes[sha]=n
 needed=sum(((n+4095)//4096)*4096 for n in new_sizes.values())+8*1024**2
 assert shutil.disk_usage(root).free>needed+128*1024**2,('Insufficient temporary headroom; originals retained',p,needed)
 with p.open('rb')as f:
  for row in segments:
   obj=object_path(row['sha256'])
   if obj.exists():continue
   f.seek(row['offset']);data=f.read(row['bytes']);assert hashlib.sha256(data).hexdigest()==row['sha256'];obj.parent.mkdir(exist_ok=True);tmp=obj.with_name(obj.name+'.part')
   with tmp.open('wb')as out:out.write(data);out.flush();os.fsync(out.fileno())
   os.replace(tmp,obj)
 m={'format':'exact-zip-segments','version':1,'originalPath':p.relative_to(root).as_posix(),'archiveBytes':st.st_size,'archiveSHA256':archive_sha,'mode':st.st_mode&0o777,'atimeNs':st.st_atime_ns,'mtimeNs':st.st_mtime_ns,'segments':segments,'restoration':'python3 work/maintenance/deduplicate-zip-storage.py --restore '+str((manifests/(p.name+'.'+archive_sha[:12]+'.json')).relative_to(root))}
 verify(m,p);mp=manifests/(p.name+'.'+archive_sha[:12]+'.json');tmp=mp.with_suffix('.tmp');tmp.write_text(json.dumps(m,indent=2)+'\n');os.replace(tmp,mp)
 assert json.loads(mp.read_text())==m;verify(json.loads(mp.read_text()),p);p.unlink()
 row={'originalPath':m['originalPath'],'archiveBytes':st.st_size,'archiveSHA256':archive_sha,'manifest':mp.relative_to(root).as_posix(),'segments':len(segments),'newObjectBytes':sum(new_sizes.values()),'freeBytesAfter':shutil.disk_usage(root).free,'byteForByteReconstructionVerified':True};report['archives'].append(row);report_path.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(row),flush=True)
report['status']='passed';report['freeBytesAfter']=shutil.disk_usage(root).free;report['freedBytes']=report['freeBytesAfter']-report['freeBytesBefore'];report_path.write_text(json.dumps(report,indent=2)+'\n')
(source/'CAS-RESTORE.txt').write_text('Temporary ZIP backups have been stored as shared raw byte segments. Every original ZIP can be reconstructed exactly, including all headers and compressed streams; decoded files were not recompressed.\nManifests: work/snapshot-archive-cas/manifests/*.json\nRestore one ZIP from repository root:\npython3 work/maintenance/deduplicate-zip-storage.py --restore <manifest-path>\nAll original ZIP SHA-256s, metadata, paths and reconstruction commands are preserved in the manifests. Verification: work/snapshot-archive-cas/verification.json\n')
print(json.dumps({'status':'passed','archives':len(report['archives']),'freedBytes':report['freedBytes']}),flush=True)
