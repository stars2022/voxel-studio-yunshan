"""Package only the verified architecture run; never publish an older run by accident."""
import hashlib
import json
import zipfile
from pathlib import Path

base = Path(__file__).resolve().parent.parent
artifacts = base / 'artifacts' / 'architecture'
latest = json.loads((artifacts / 'latest.json').read_text())
verified = json.loads((artifacts / 'verification.json').read_text())
assert verified['run'] == latest['run'] and not verified['errors']
assert len(verified['items']) == 28
assert all(item['components'] == 1 for item in verified['items'])
output = artifacts / '云山-建筑两图-28件模型包.zip'
files = [(base / 'projects' / 'architecture-index.json', 'projects/architecture-index.json')]
for item in latest['nativeFiles']:
    file = base / 'projects' / item['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == item['sha256']
    files.append((file, 'projects/' + file.name))
run = Path(latest['out'])
for file in sorted((run / 'exports').rglob('*')):
    if file.is_file():
        files.append((file, str(file.relative_to(run))))
for name in ['index.json', 'native-manifest.json']:
    files.append((run / name, name))
for name in ['verification.json', 'sheet-A.png', 'sheet-B.png', 'library-ui.png', 'live-editor.png', 'live-editor.json', 'connectivity-0.04.json']:
    files.append((artifacts / name, 'verification/' + name))
for file in sorted((artifacts / 'screenshots').glob('*.png')):
    files.append((file, 'verification/screenshots/' + file.name))
for name in ['ARCHITECTURE-REFERENCES.md', 'FORMAT.md', 'tool-schemas.json', 'template-parameters.json', 'mcp.example.json']:
    files.append((base / 'docs' / name, 'docs/' + name))
for name in ['architecture-full-tests.log', 'architecture-build.log']:
    files.append((base / 'artifacts' / name, 'verification/' + name))
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file, name in files:
        archive.write(file, name)
    archive.writestr('打开说明.txt', '''云山 · 建筑两张参考图 · 28 件原生体素模型包

A01–A12 建筑主体 / B01–B16 立面细部。默认 0.02 米格距，Y 轴向上。
这是模型与验证包；完整编辑器源码位于原工作区 voxel-studio。

1. 将 projects 中的文件复制到编辑器的 projects 目录，保留文件名。
2. npm start 后打开 http://127.0.0.1:4317/?library=1&flat=1&view=perspective
3. 批量库 → 参考图鉴 → 建筑主体 / 立面细部，选择总览或单件并打开。
4. exports 中每个目录包含 GLB、无损体素 JSON、碰撞格、安装接口与颜色图集。
5. verification 中全部图片为真实编辑器截图。可在编辑器旋转、剖切和逐格修改。

图中不可见的结构与尺寸为建模设计值；这批仍待人工美术验收。
玻璃与灯罩按基础色验形，无纹理、反射、场景照明与后期。
B02 doorOpen 为 0/1 两种静态几何，未实现动画。
图鉴设计、重复展示实例与原城市清单的基础资产数量分开统计。
''')
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
print(json.dumps({'file': str(output), 'bytes': output.stat().st_size, 'entries': len(files) + 1,
                  'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}, ensure_ascii=False, indent=2))
