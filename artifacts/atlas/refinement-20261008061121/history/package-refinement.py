from pathlib import Path
import hashlib,json,zipfile,shutil
loc=json.load(open('work/m002-refinement/production-location.json'));root=Path(loc['root']);v=json.load(open(root/'validation.json'));p=json.load(open(root/'production.json'));baseline=json.load(open(root/'baseline-exports.json'))
assert v['status']=='passed'and len(json.load(open(root/'visual-review.json'))['viewedFiles'])==39
assert json.load(open(root/'review-boards.json'))['status']=='viewed'
archive=root/'Yunshan-M002-reference-v1.zip';assert not archive.exists()and not list(root.glob(archive.name+'.part*'))
files=set();history_evidence={'regression-summary.json','regression-attempt01.txt','regression-final-changed.txt','kitchen-final.txt','handing-regression.txt','build-final.txt','postfx-assessment.json'}
for f in root.rglob('*'):
 if not f.is_file():continue
 rel=f.relative_to(root)
 if any('runtime'in part for part in rel.parts)or f.name in['batch-package.json','downloads.json','PACKAGE-DOWNLOAD.txt','package-manifest.json']or f.suffix=='.zip':continue
 if rel.parts[0]=='history'and'validated-source'not in rel.parts and f.name not in history_evidence:continue
 files.add(f)
for f in p['files']:files.add(Path('projects')/f['file'])
for m in baseline['records']:
 for f in m['exports']:
  data=Path(f['file']).read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256'];files.add(Path(f['file']))
files.update([Path('projects/reference-atlas/images/M002.png'),Path('docs/M002-REFERENCE-REFINEMENT.md')])
rows=[{'path':f.as_posix(),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}for f in sorted(files)]
manifest={'format':'yunshan.refinement-package','run':loc['run'],'status':'validated-first-reference-pass','files':rows,'expandedBytes':sum(r['bytes']for r in rows),'limits':v['limits'],'historyScope':'Final assets, retained historical baselines and primary verification evidence are packaged; full corrective drafts remain in this batch repository history/ folder.'}
manifest_bytes=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode();assert shutil.disk_usage('.').free>300*1024**2
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for r in rows:z.write(r['path'],r['path'])
 z.writestr('MANIFEST.json',manifest_bytes)
 z.writestr('START-HERE.txt',f'''云山 M002 · 厨房与生活器物参考精修

解压后打开 {root}/review.html 查看12件真实模型与同机位对照。
原生文件：projects/{loc['run']}-life-*.ysvox.json
总览：projects/{loc['run']}-m002-gallery.ysvox.json
最终GLB：{root}/exports/LIFE-*/visual.glb
地毯三张真实PBR贴图随LIFE-031导出并嵌入GLB。
原始历史母版：{root}/baselines/；历史GLB见MANIFEST.json内projects/production/路径。
主要验证报告、39张最终实拍与3张排版图包含在本包中。
完整中间候选与失败试拍保留在仓库当前批次history/，不重复放入使用资源包。

编辑器与完整版本： https://github.com/stars2022/voxel-studio-yunshan
在相同版本编辑器中打开图册M002或加载上述原生文件。
变化和剩余范围见docs/M002-REFERENCE-REFINEMENT.md。
本包为首轮精修交付；最终人工美术验收另计。
''')
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None and json.loads(z.read('MANIFEST.json'))==manifest
 for r in rows:
  data=z.read(r['path']);assert len(data)==r['bytes']and hashlib.sha256(data).hexdigest()==r['sha256']
size=archive.stat().st_size;digest=hashlib.sha256(archive.read_bytes()).hexdigest();downloads=[]
def item(file):return{'file':file.name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'url':'https://github.com/stars2022/voxel-studio-yunshan/blob/main/'+file.as_posix()+'?raw=1'}
if size<95*1024**2:downloads=[item(archive)]
else:
 parts=[]
 with archive.open('rb')as f:
  while data:=f.read(90*1024**2):
   part=root/(archive.name+f'.part{len(parts)+1:02d}');part.write_bytes(data);parts.append(part)
 check=hashlib.sha256()
 for part in parts:check.update(part.read_bytes())
 assert check.hexdigest()==digest
 downloads=[item(part)for part in parts];archive.unlink()
(root/'package-manifest.json').write_bytes(manifest_bytes)
record={'status':'passed','run':loc['run'],'archive':archive.name,'bytes':size,'sha256':digest,'payloadFiles':len(rows),'zipEntries':len(rows)+2,'expandedBytes':manifest['expandedBytes'],'zipCRCChecked':True,'allPayloadSHA256ReadBack':True,'manifest':'package-manifest.json','nativeDocuments':13,'newGLBs':12,'retainedNativeDocuments':12,'retainedGLBs':12,'screenshots':39,'boards':3,'downloads':downloads}
(root/'batch-package.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');(root/'downloads.json').write_text(json.dumps({'run':loc['run'],'files':downloads},ensure_ascii=False,indent=2)+'\n')
links='\n'.join(d['url']for d in downloads);join=''if len(downloads)==1 else f'\n分卷请按part01、part02顺序拼接为{archive.name}，再解压。\n'
(root/'PACKAGE-DOWNLOAD.txt').write_text(f'M002 首轮参考精修资源包\n\n{links}\n{join}\n完整ZIP字节：{size}\n完整ZIP SHA-256：{digest}\n\n解压后先读START-HERE.txt。ZIP CRC及全部{len(rows)}个文件SHA-256均已读回核验。\n12件最终GLB、13份原生文档、12件历史原生/GLB、39张实拍及3张排版图。完整中间检查历史保留于仓库history/。\n')
print(json.dumps(record,ensure_ascii=False))
