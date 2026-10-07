from pathlib import Path
import hashlib,json,zipfile,shutil

loc=json.loads(Path('work/m001-refinement/production-location.json').read_text());root=Path(loc['root'])
validation=json.loads((root/'validation.json').read_text());assert validation['status']=='passed'
review=json.loads((root/'visual-review.json').read_text());assert len(review['viewedFiles'])==39
boards=json.loads((root/'review-boards.json').read_text());assert boards['status']=='viewed'
production=json.loads((root/'production.json').read_text());baseline=json.loads((root/'baseline-exports.json').read_text())
archive=root/'Yunshan-M001-reference-v1.zip';assert not archive.exists()
files=set()
for file in root.rglob('*'):
 if file.is_file()and not any('runtime'in p for p in file.relative_to(root).parts)and file.name not in ['batch-package.json','downloads.json','PACKAGE-DOWNLOAD.txt','package-manifest.json']and file.suffix!='.zip':files.add(file)
for f in production['files']:
 file=Path('projects')/f['file'];data=file.read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256'];files.add(file)
for m in baseline['records']:
 for f in m['exports']:
  file=Path(f['file']);data=file.read_bytes();assert len(data)==f['bytes']and hashlib.sha256(data).hexdigest()==f['sha256'];files.add(file)
files.update([Path('projects/reference-atlas/images/M001.png'),Path('docs/M001-REFERENCE-REFINEMENT.md')])
rows=[{'path':p.as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(files)]
manifest={'format':'yunshan.refinement-package','run':loc['run'],'status':'validated-first-reference-pass','files':rows,'expandedBytes':sum(r['bytes']for r in rows),'limits':validation['limits']}
manifest_bytes=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
assert shutil.disk_usage('.').free>90*1024**2
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for row in rows:z.write(row['path'],row['path'])
 z.writestr('MANIFEST.json',manifest_bytes)
 z.writestr('START-HERE.txt',f'''云山 M001 · 首轮参考打磨

解压后打开 {root}/review.html 查看12件实际模型与同机位前后对照。
模型原生文件：projects/refinement-*-life-*.ysvox.json（12件）
模型总览：projects/refinement-*-m001-gallery.ysvox.json
导出：{root}/exports/LIFE-*/visual.glb
帘布三张真实PBR贴图随 LIFE-027 导出，并内嵌于GLB。
历史原生：{root}/baselines/；历史导出：projects/production/atlas-20261003063047/exports/。
每个文件的字节数与SHA-256见 MANIFEST.json。

本包是资产与验证证据。编辑器及完整依赖源码：
https://github.com/stars2022/voxel-studio-yunshan
在相同版本编辑器的图册页打开M001，或加载上列原生文件。
具体变化、可复现操作与剩余差距见 docs/M001-REFERENCE-REFINEMENT.md。
最小原生块件5mm，斜面、倒角与曲面为连续网格；不可把原生占用层当作全部显示面。
这是一轮参考打磨交付，尚未计入最终人工美术验收。
''')
with zipfile.ZipFile(archive)as z:
 assert z.testzip()is None
 assert json.loads(z.read('MANIFEST.json'))==manifest
 for row in rows:
  data=z.read(row['path']);assert len(data)==row['bytes']and hashlib.sha256(data).hexdigest()==row['sha256']
size=archive.stat().st_size;assert size<100*1024**2,'Use split package before staging'
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(root/'package-manifest.json').write_bytes(manifest_bytes)
record={'status':'passed','run':loc['run'],'archive':archive.name,'bytes':size,'sha256':digest,'payloadFiles':len(rows),'zipEntries':len(rows)+2,'expandedBytes':manifest['expandedBytes'],'zipCRCChecked':True,'allPayloadSHA256ReadBack':True,'manifest':'package-manifest.json','nativeDocuments':13,'newGLBs':12,'retainedNativeDocuments':12,'retainedGLBs':12,'screenshots':39,'boards':3}
(root/'batch-package.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
url='https://raw.githubusercontent.com/stars2022/voxel-studio-yunshan/main/'+archive.as_posix()
(root/'downloads.json').write_text(json.dumps({'run':loc['run'],'files':[{'url':url,'file':archive.name,'bytes':size,'sha256':digest}]},ensure_ascii=False,indent=2)+'\n')
(root/'PACKAGE-DOWNLOAD.txt').write_text(f'M001 首轮参考打磨资源包\n\n{url}\n\n文件：{archive.name}\n字节：{size}\nSHA-256：{digest}\n\n解压后先读 START-HERE.txt。ZIP CRC及全部{len(rows)}个交付文件SHA-256已读回验证。\n12件母版和1个总览原生、12件新GLB、12件历史原生/GLB、39张实拍及3张排版对照板。人工美术验收未完成。\n')
print(json.dumps(record,ensure_ascii=False))
