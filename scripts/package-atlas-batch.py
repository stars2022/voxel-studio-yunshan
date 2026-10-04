"""Package one validated atlas batch, resolving each active ID through its index.

Unlike the historical all-library package, this works with a migrated snapshot
that intentionally omits superseded exports. No historical screenshot is relabelled.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

parser = argparse.ArgumentParser()
parser.add_argument('--sheet', required=True)
parser.add_argument('--include', default='', help='Comma-separated revised dependency IDs, not new batch masters')
parser.add_argument('--verification', required=True, help='MCP report filename in this run')
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
assert re.fullmatch(r'M\d{3}', args.sheet)
assert Path(args.verification).name == args.verification
root = Path(__file__).resolve().parents[1]
read = lambda p: json.loads(p.read_text())
index = read(root / 'projects/atlas-production-index.json')
atlas = read(root / 'projects/reference-atlas/index.json')
latest = read(root / 'artifacts/atlas/latest.json')
out = (root / latest['evidence']).resolve()
assert out.is_relative_to(root / 'artifacts/atlas')
entries = [r for r in index['entries'] if r['sheet'] == args.sheet]
dependencies = [r for r in index['entries'] if r['id'] in args.include.split(',') and r['sheet'] != args.sheet]
assert {r['id'] for r in dependencies} == set(filter(None, args.include.split(',')))
expected = [r for r in atlas['entries'] if r['sheet'] == args.sheet]
assert {r['id'] for r in entries} == {r['id'] for r in expected}
assert len(entries) == len(expected)
assert latest['run'] == index['run']
previews = read(out / 'previews.json')
assert previews['run'] == index['run'] and not previews['errors']
shots = [r for r in previews['items'] if r['sheet'] == args.sheet]
assert {r['id'] for r in shots} == {r['id'] for r in entries}
for d in dependencies:
    dependency_shot = next(r for r in previews['items'] if r['id'] == d['id'])
    assert {'isometric', 'front', 'material'} <= dependency_shot['files'].keys()
for r in shots:
    assert {'isometric', 'front', 'material'} <= r['files'].keys()
verification = read(out / args.verification)
assert verification['run'] == index['run']
assert verification['status'] == 'passed' and not verification['errors']
tests = read(out / 'validation.json')
assert tests['status'] == 'passed'
audit = read(out / 'material-audit.json')
assert audit['pendingCandidates'] == 0
gallery = next(r for r in index['studies'] if r['id'] == args.sheet + '-gallery')
gallery_check = next(r for r in read(out / 'gallery-support-audit.json')['records'] if r['id'] == gallery['id'])
assert not gallery_check['check']['collisions']
assert not gallery_check['check']['warnings']
assert all(not r['ownSolidCells'] and not r['blockedBy'] for r in gallery_check['check']['openings'])

files = {root / 'projects/atlas-production-index.json', root / 'projects/reference-atlas/index.json',
         root / 'projects' / gallery['file'], root / 'projects/reference-atlas/images' / (args.sheet + '.png')}
for row in entries + dependencies:
    native = root / 'projects' / row['file']
    doc = read(native)
    asset = doc['assets'][row['assetId']]
    # Match the canonical JS serialization used by the producer (UTF-8, compact).
    digest = hashlib.sha256(json.dumps(asset['chunks'], ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
    assert digest == row['sha256'], row['id']
    files.add(native)
    run = re.match(r'atlas-\d{14}', row['file']).group()
    for name in ['visual.glb', 'voxels.ysvox.json', 'collision.json', 'interfaces.json', 'atlas.png', 'atlas.json']:
        files.add(root / 'projects/production' / run / 'exports' / row['id'] / name)
for r in shots + [r for r in previews['items'] if r['id'] in {d['id'] for d in dependencies}]:
    files.update(out / 'screenshots' / name for name in r['files'].values())
for name in [args.sheet + '.png', args.sheet + '.html', 'materials.html', 'materials.png', 'previews.json',
             'production.json', 'material-audit.json', 'gallery-support-audit.json', 'validation.json', args.verification]:
    files.add(out / name)
for scenario in verification.get('assemblies', []):
    name = scenario['name']
    files.add(out / (name + '.ysvox.json'))
    files.update((out / (name + '-export')).glob('*'))
    files.update(out.glob(name + '-view-*.png'))
files.update(out.glob('*-tests*.txt'))
files.update(out.glob('*-mcp-client.txt'))
files.update(out.glob('*-mcp-initial.json'))
files.update(out.glob('mcp-*.png'))
files.update(out.glob('high-bridge-*.png'))
files.update(p for p in (out / 'high-bridge-ui-before').rglob('*') if p.is_file())
for name in ['final-geometry-recheck.json', 'camera-framing-verification.json']:
    if (out / name).exists():
        assert read(out / name)['status'] == 'passed'
        files.add(out / name)
for name in ['camera-framing-first-attempt.json', 'catalog-counts.json', 'component-variants.json', 'typecheck-final.txt']:
    if (out / name).exists():
        files.add(out / name)
files.update(p for p in (out / 'camera-framing-before').rglob('*') if p.is_file())
if (out / 'terrain-lod.json').exists():
    lod = read(out / 'terrain-lod.json')
    assert lod['status'] == 'passed' and lod['run'] == index['run']
    assert {r['id'] for r in lod['records']} == {r['id'] for r in entries}
    files.add(out / 'terrain-lod.json')
    files.update(root / r['farGLB'] for r in lod['records'])
    files.update(out.glob('terrain-*.png'))
files.add(out / 'build.txt')
manifest = {'format': 'yunshan.atlas-batch', 'version': 1, 'sheet': args.sheet, 'run': index['run'],
            'candidateMasters': len(entries), 'humanArtAccepted': 0, 'assets': entries, 'revisedDependencies': dependencies,
            'files': [{'path': str(p.relative_to(root)), 'bytes': p.stat().st_size,
                       'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]}
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for p in sorted(files):
        assert p.resolve().is_relative_to(root) and p.is_file()
        archive.write(p, p.relative_to(root))
    archive.writestr('batch-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    archive.writestr('使用说明.txt', f'''云山体素资产 · {args.sheet} · {len(entries)} 件候选
原生权威数据：projects 下的 .ysvox.json，单位米，Y 轴向上。
把包内 projects 的单件/总览文件复制到编辑器项目目录后打开。
通用三维查看器可直接打开各 exports 子目录下的 visual.glb。
碰撞、接口、材质 ID 与图集分别存储，不以 GLB 代替原生体素。
制作源码及启动方式：https://github.com/stars2022/voxel-studio-yunshan
artifacts 内是本批真实截图与验证。仍属待美术验收候选，没有动画或游戏集成。
''')
with ZipFile(args.output) as archive:
    assert archive.testzip() is None
(out / 'batch-package.json').write_text(json.dumps({**manifest, 'archive': args.output.name,
    'archiveBytes': args.output.stat().st_size,
    'archiveSHA256': hashlib.sha256(args.output.read_bytes()).hexdigest()}, ensure_ascii=False, indent=2))
print(json.dumps({'sheet': args.sheet, 'masters': len(entries), 'files': len(files),
                  'path': str(args.output), 'bytes': args.output.stat().st_size}, ensure_ascii=False))
