"""Package a validated assembly batch with its transitive native/export dependencies."""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

parser = argparse.ArgumentParser()
parser.add_argument('--sheet', required=True)
parser.add_argument('--output', required=True, type=Path)
parser.add_argument('--part-size-mib', type=int, default=80)
args = parser.parse_args()
assert re.fullmatch(r'M\d{3}', args.sheet)
assert 1 <= args.part_size_mib <= 95
root = Path(__file__).resolve().parents[1]
read = lambda p: json.loads(p.read_text())
index = read(root / 'projects/atlas-production-index.json')
latest = read(root / 'artifacts/atlas/latest.json')
out = root / latest['evidence']
assert latest['run'] == index['run'] and latest['kind'] == 'assembly-batch'
entries = [r for r in index['entries'] if r['sheet'] == args.sheet]
assert len(entries) == 12 and all(r['kind'] == 'assembly' for r in entries)
for file in ['validation.json', 'assembly-verification.json', 'assembly-mcp-verification.json', 'material-audit.json']:
    assert read(out / file)['status'] == 'passed'
assert read(out / 'material-audit.json')['pendingCandidates'] == 0
previews = read(out / 'previews.json')
assert not previews['errors'] and previews['run'] == latest['run']
assert {r['id'] for r in previews['items']} == {r['id'] for r in entries}
assert all({'isometric', 'front', 'material'} <= r['files'].keys() for r in previews['items'])
by_id = {r['id']: r for r in index['entries']}
closure = {r['id']: r for r in entries}
todo = list(entries) + read(out / 'assembly-verification.json')['variants']
while todo:
    row = todo.pop()
    dependencies = row.get('dependencyCatalogIds', []) + ([row['primaryMasterId']] if row.get('primaryMasterId') else [])
    for dependency in dependencies:
        assert dependency in by_id, f'Missing authoritative dependency {dependency}'
        if dependency not in closure:
            closure[dependency] = by_id[dependency]
            todo.append(by_id[dependency])
files = set()
def add(p):
    p = p.resolve()
    assert p.is_relative_to(root) and p.is_file() and not p.is_symlink(), str(p)
    files.add(p)
for row in closure.values():
    add(root / 'projects' / row['file'])
    run = re.match(r'(atlas-\d{14})-', row['file']).group(1)
    directory = root / 'projects/production' / run / 'exports' / row['id']
    for name in ['voxels.ysvox.json', 'visual.glb', 'collision.json', 'interfaces.json', 'atlas.json', 'atlas.png']:
        add(directory / name)
    if row['id'] in {e['id'] for e in entries}:
        for name in ['visual-far.glb', 'visual-material.glb']:
            add(directory / name)
for variant in read(out / 'assembly-verification.json')['variants']:
    directory = root / variant['directory']
    assert directory.resolve().is_relative_to((root / latest['out'] / 'variants').resolve())
    for p in directory.iterdir():
        if p.is_file():
            add(p)
gallery = next(r for r in index['studies'] if r['id'] == args.sheet + '-gallery')
for p in [root / 'projects' / gallery['file'], root / 'projects/atlas-production-index.json', root / 'projects/reference-atlas/index.json', root / 'projects/reference-atlas/images' / (args.sheet + '.png'), root / 'docs/M044-ARCHITECTURE-ASSEMBLIES.md']:
    add(p)
for p in out.iterdir():
    if p.is_file() and p.suffix in {'.json', '.png', '.html', '.txt'} and p.name not in {'batch-package.json', 'previews.partial.json', 'PACKAGE-DOWNLOAD.txt'}:
        add(p)
for p in (out / 'screenshots').iterdir():
    if p.is_file():
        add(p)
manifest = {'format': 'yunshan.assembly-batch', 'version': 1, 'sheet': args.sheet, 'run': latest['run'], 'candidateReferences': 12, 'candidateMasters': 0, 'candidateAssemblies': 12, 'finiteForms': 18, 'humanArtAccepted': 0, 'assemblies': entries, 'dependencies': [r for key, r in closure.items() if key not in {e['id'] for e in entries}], 'files': [{'path': str(p.relative_to(root)), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]}
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for p in sorted(files):
        archive.write(p, p.relative_to(root))
    archive.writestr('batch-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    archive.writestr('使用说明.txt', '''M044 建筑组合模板：12 条参考，18 种有限形态，新增基础母版 0。
projects 中的原生文件保存组件、原件/派生关系和实际实例；整体单位米，Y 轴向上。
visual.glb 为整组场景，visual-material.glb 带实际参考材质，visual-far.glb 为手动远档。
通用查看器可直接打开 GLB；编辑器可打开原生单组或 gallery 文件。
屋面为连续网格，最小销钉保留原生体素。碰撞与连续表面分开声明，远景无碰撞。
包内保留本批组合及其递归依赖，不把依赖、重复放置或宽度形态算成新基础母版。
所有尺寸/布局为作者候选，未接入原 FloorPlan、控制器或世界地形；人工美术验收 0。
源码：https://github.com/stars2022/voxel-studio-yunshan
''')
with ZipFile(args.output) as archive:
    assert archive.testzip() is None
result = {**manifest, 'archive': args.output.name, 'archiveBytes': args.output.stat().st_size, 'archiveSHA256': hashlib.sha256(args.output.read_bytes()).hexdigest()}
if result['archiveBytes'] > args.part_size_mib * 1024**2:
    parts = []
    combined = hashlib.sha256()
    with args.output.open('rb') as source:
        while data := source.read(args.part_size_mib * 1024**2):
            part = args.output.with_name(args.output.name + '.' + str(len(parts) + 1).zfill(3))
            part.write_bytes(data)
            actual = part.read_bytes()
            assert actual == data
            combined.update(actual)
            parts.append({'file': part.name, 'bytes': len(actual), 'sha256': hashlib.sha256(actual).hexdigest()})
    assert combined.hexdigest() == result['archiveSHA256']
    result['archiveParts'] = parts
    result['archiveStorage'] = 'Binary split ZIP; concatenate listed parts in order before extracting'
    retained = root / 'work/assembly-archives' / latest['run'] / args.output.name
    retained.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(args.output, retained)
    base = 'https://github.com/stars2022/voxel-studio-yunshan/raw/main/' + str(out.relative_to(root)) + '/'
    text = '\n'.join([
        f'M044 建筑资产包：完整 ZIP 的 {len(parts)} 个二进制分卷；请下载全部分卷到同一文件夹。',
        '内容：12 个组合模板、18 种有限形态、19 个递归依赖；人工美术验收 0。',
        '各卷不能单独解压。可用 7-Zip 打开 .001，或先按下面顺序合并，再解压 ZIP。',
        '', *[base + p['file'] for p in parts], '',
        'macOS / Linux：',
        'cat ' + ' '.join("'" + p['file'] + "'" for p in parts) + " > '" + result['archive'] + "'",
        '', 'Windows 命令提示符（cmd.exe）：',
        'copy /b ' + '+'.join('"' + p['file'] + '"' for p in parts) + ' "' + result['archive'] + '"',
        '', '完整 ZIP SHA-256：' + result['archiveSHA256'],
        *[p['file'] + ' SHA-256：' + p['sha256'] for p in parts], '',
        '分卷重新串联后的 SHA-256 已核验等于原 ZIP；原 ZIP 全部条目的 CRC 已通过。',
    ])
    (out / 'PACKAGE-DOWNLOAD.txt').write_text(text + '\n')
(out / 'batch-package.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps({'references': 12, 'assemblies': 12, 'masters': 0, 'dependencies': len(manifest['dependencies']), 'files': len(files), 'bytes': result['archiveBytes'], 'path': str(args.output), 'parts': result.get('archiveParts', [])}, ensure_ascii=False))
