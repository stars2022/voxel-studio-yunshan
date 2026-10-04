"""Package one validated atlas batch, resolving each active ID through its index.

Unlike the historical all-library package, this works with a migrated snapshot
that intentionally omits superseded exports. No historical screenshot is relabelled.
"""
import argparse
import hashlib
import json
import re
import subprocess
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
if gallery_check['check']['warnings']:
    mixed = read(out / 'mixed-geometry-verification.json')
    assert mixed['status'] == 'passed' and mixed['run'] == index['run']
    assert mixed['gallery'] == gallery['id'] and mixed['galleryInstancesDisjointUsingActualBounds']
    assert all('连续网格另按三角面验证' in w for w in gallery_check['check']['warnings'])
assert all(not r['ownSolidCells'] and not r['blockedBy'] for r in gallery_check['check']['openings'])

files = {root / 'projects/atlas-production-index.json', root / 'projects/reference-atlas/index.json',
         root / 'projects' / gallery['file'], root / 'projects/reference-atlas/images' / (args.sheet + '.png')}
for row in entries + dependencies:
    native = root / 'projects' / row['file']
    doc = read(native)
    asset = doc['assets'][row['assetId']]
    # Canonical geometry hashes are produced by JavaScript. Python's exponent
    # formatting (for example e-09 versus e-9) differs for valid small rig values.
    # Hash the exact same parsed numeric data with the producer's serializer.
    digest = subprocess.check_output(['node', '--input-type=module', '-e',
        "import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';"
        "const a=JSON.parse(readFileSync(process.argv[1],'utf8')).assets[process.argv[2]];"
        "const data=a.sky??(a.rig?{chunks:a.chunks,meshes:a.meshes,rig:a.rig}:a.meshes?{chunks:a.chunks,meshes:a.meshes}:a.chunks);"
        "process.stdout.write(createHash('sha256').update(JSON.stringify(data)).digest('hex'));",
        str(native), row['assetId']], text=True).strip()
    assert digest == row['sha256'], row['id']
    files.add(native)
    run = re.match(r'atlas-\d{14}', row['file']).group()
    for name in ['visual.glb', 'voxels.ysvox.json', 'collision.json', 'interfaces.json', 'atlas.png', 'atlas.json']:
        files.add(root / 'projects/production' / run / 'exports' / row['id'] / name)
    files.update((root / 'projects/production' / run / 'exports' / row['id']).glob('*-sky.png'))
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
files.update(out.glob('*-mcp-refresh-client.txt'))
files.update(out.glob('*-mcp-initial-client.txt'))
files.update(out.glob('*-mcp-initial.json'))
files.update(out.glob('mcp-*.png'))
files.update(out.glob('high-bridge-*.png'))
files.update(p for p in (out / 'high-bridge-ui-before').rglob('*') if p.is_file())
for name in ['final-geometry-recheck.json', 'camera-framing-verification.json', 'recipe-metadata-verification.json']:
    if (out / name).exists():
        assert read(out / name)['status'] == 'passed'
        files.add(out / name)
for name in ['camera-framing-first-attempt.json', 'catalog-counts.json', 'component-variants.json', 'typecheck-final.txt', 'gallery-audit-initial.txt', 'gallery-audit.txt', 'material-audit.txt']:
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
if (out / 'material-export.json').exists():
    material_export = read(out / 'material-export.json')
    assert material_export['status'] == 'passed' and material_export['run'] == index['run']
    assert {r['id'] for r in material_export['records']} == {r['id'] for r in entries}
    files.add(out / 'material-export.json')
    files.update(root / r['file'] for r in material_export['records'])
files.update(out.glob('sky-*.png'))
files.update(out.glob('landscape-*.png'))
files.update(out.glob('character-*.png'))
files.update(out.glob('figure-*.png'))
files.update(out.glob('avatar-*.png'))
files.update(out.glob('headwear-*.png'))
files.update(out.glob('wearable-*.png'))
files.update(out.glob('garment-*.png'))
files.update(out.glob('costume-*.png'))
files.update(out.glob('costume-initial-fit-failures.json'))
files.update(out.glob('costume-development-checks.json'))
files.update(out.glob('attire-*.png'))
files.update(out.glob('attire-initial-fit-failures.json'))
files.update(out.glob('attire-development-checks.json'))
files.update(out.glob('garment-initial-fit-failures.json'))
files.update(out.glob('garment-mcp-before-underlayer*'))
files.update(out.glob('underlayer-attachments-*.txt'))
files.update(out.glob('wearable-optics-front.json'))
files.update(out.glob(args.sheet + '-wear.*'))
if (out / 'component-variants.json').exists():
    for variant in read(out / 'component-variants.json')['variants']:
        if 'variantDirectory' in variant:
            variant_dir = (root / variant['variantDirectory']).resolve()
            assert variant_dir.is_relative_to(root / 'projects/production' / index['run'] / 'variants')
            for name in ['voxels.ysvox.json', 'visual.glb', 'collision.json', 'interfaces.json', 'atlas.json', 'atlas.png']:
                files.add(variant_dir / name)
if (out / 'figure-installation-verification.json').exists():
    assert read(out / 'figure-installation-verification.json')['status'] == 'passed'
    files.add(out / 'figure-installation-verification.json')
for name in ['attire-installation-verification.json', 'attire-variant-export-verification.json', 'costume-installation-verification.json', 'costume-variant-export-verification.json', 'garment-installation-verification.json', 'garment-variant-export-verification.json', 'wearable-installation-verification.json', 'wearable-variant-export-verification.json', 'headwear-installation-verification.json', 'headwear-variant-export-verification.json', 'figure-variant-export-verification.json', 'avatar-installation-verification.json', 'avatar-variant-export-verification.json']:
    if (out / name).exists():
        assert read(out / name)['status'] == 'passed'
        files.add(out / name)
for name in ['character-installation-verification.json', 'character-presentation-verification.json']:
    if (out / name).exists():
        assert read(out / name)['status'] == 'passed'
        files.add(out / name)
files.update(p for p in (out / 'head-presentation-before').glob('*') if p.is_file())
character_doc = root / 'docs' / (args.sheet + '-CHARACTER-COMPONENTS.md')
if character_doc.exists():
    files.add(character_doc)
if (out / 'mixed-geometry-verification.json').exists():
    files.add(out / 'mixed-geometry-verification.json')
if (out / 'sky-presentation-verification.json').exists():
    assert read(out / 'sky-presentation-verification.json')['status'] == 'passed'
    files.add(out / 'sky-presentation-verification.json')
    files.update(p for p in (out / 'sky-presentation-before').glob('*') if p.is_file())
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
通用三维查看器可直接打开各 exports 子目录下的 visual.glb。若附有 visual-material.glb，可直接查看参考材质和透明水层。
体素块件、连续网格和天空贴图分别保留权威数据；碰撞、接口、材质 ID 与贴图随包导出。
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
