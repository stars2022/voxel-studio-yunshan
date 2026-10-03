"""Package the editable material variants, exports and actual verification images.
This is an asset pack for the existing editor, not a second application checkout.
"""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
out = root / 'artifacts/material-study'
index = json.loads((root / 'projects/material-index.json').read_text())
files = {root / 'projects/material-index.json', root / 'docs/MATERIAL-STUDY.md'}
for row in index['studies']:
    files.add(root / 'projects' / row['file'])
    files.add(root / 'projects' / row['originalFile'])
files.update(p for p in (out / 'exports').rglob('*') if p.is_file())
files.update(p for p in (out / 'screenshots').glob('*.png'))
for name in ['建筑主体.png', '立面细部.png', '家居.png', 'pilot.png', 'pilot.html',
             'material-library-ui.png', 'export-verification.json', 'mcp-verification.json',
             'all-previews.json', 'full-tests.log', 'build.log', 'preview-invalid-input.json',
             'library-selection.json', 'live-editor.png']:
    p = out / name
    if not p.is_file():
        raise FileNotFoundError(p)
    files.add(p)
manifest = {'run': index['run'], 'designs': 40, 'newGeometry': 0, 'accepted': 0,
            'files': [{'path': p.relative_to(root).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size} for p in sorted(files)]}
archive = out / '云山-40件材质试作包.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(files):
        z.write(p, p.relative_to(root).as_posix())
    z.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    z.writestr('使用说明.txt', '本包是已有体素工坊的材质模型包，不是独立应用。\n40 件设计 / 43 份材质项目（含 3 总览），没有新增模型，也未达到参考图整体美术验收标准。\nprojects/ 内保留材质版和原始素色项目；把文件复制到现有 voxel-studio/projects 后，从批量库或恢复功能打开。\n每份材质项目内有“原始素色”“参考材质试作”配色，可继续编辑真实体素。\nartifacts/material-study/exports/ 包含 GLB、原生体素、碰撞与接口。\n查看 docs/MATERIAL-STUDY.md 及实际截图和测试报告。\n源码与启动方式在已有 voxel-studio 工作区；本包不包含应用依赖。\n')
with ZipFile(archive) as z:
    assert z.testzip() is None
result = {'path': str(archive), 'bytes': archive.stat().st_size, 'entries': len(files) + 2,
          'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()}
(out / 'package.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False))
