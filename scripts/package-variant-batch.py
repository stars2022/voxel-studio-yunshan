"""Package a validated building variant batch with its transitive native/export dependencies."""
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
assert latest['run'] == index['run'] and latest['kind'] == 'variant-batch'
sheet_entries = [r for r in index['entries'] if r['sheet'] == args.sheet]
entries = [r for r in sheet_entries if r['kind'] == 'variant']
assert len(entries) == 6 and len(sheet_entries) == 12
gallery_dependencies = [r for r in sheet_entries if r['kind'] == 'assembly']
for file in ['validation.json', 'variant-verification.json', 'variant-mcp-verification.json', 'material-audit.json']:
    assert read(out / file)['status'] == 'passed'
assert read(out / 'material-audit.json')['pendingCandidates'] == 0
previews = read(out / 'previews.json')
assert not previews['errors'] and previews['run'] == latest['run']
assert {r['id'] for r in previews['items']} == {r['id'] for r in sheet_entries}
assert all({'isometric', 'front', 'material'} <= r['files'].keys() for r in previews['items'])
by_id = {r['id']: r for r in index['entries']}
legacy_report = out / 'legacy-dependencies.json'
if legacy_report.exists():
    legacy = read(legacy_report)
    assert legacy['status'] == 'passed' and legacy['run'] == latest['run']
    for row in legacy['dependencies']:
        assert row['kind'] == 'legacy-base-dependency' and row['canonicalCopiedIdentity'] and row['collisionOccupancyIdentity']
        assert hashlib.sha256((root / 'projects' / row['file']).read_bytes()).hexdigest() == row['originalFileSHA256']
        assert row['id'] not in by_id, 'Atlas masters take precedence over legacy exports'
        by_id[row['id']] = row
closure = {r['id']: r for r in sheet_entries}
catalog_contracts = {}
todo = list(sheet_entries) + read(out / 'variant-verification.json')['variants']
while todo:
    row = todo.pop()
    dependencies = row.get('dependencyCatalogIds', []) + ([row['primaryMasterId']] if row.get('primaryMasterId') else [])
    for dependency in dependencies:
        if dependency not in by_id:
            # A new authored component can cite a catalogue contract whose
            # standalone master has not been made. Never treat an absent copied
            # canonical asset or shared-master payload as this kind of citation.
            native_path = root / 'projects' / row['file']
            if not native_path.exists():
                native_path = root / row['file']
            native = read(native_path)
            sources = [a.get('source', {}) for a in native['assets'].values()]
            assert not row.get('primaryMasterId') == dependency
            assert not any(s.get('catalogId') == dependency for s in sources), f'Missing copied canonical master {dependency}'
            assert any(s.get('kind') == 'assembly-derived-component' and dependency in s.get('baseCatalogIds', []) for s in sources), f'Undeclared missing dependency {dependency}'
            entry = native['catalog']['entries'][dependency]
            record = catalog_contracts.setdefault(dependency, {'id': dependency, 'entry': entry, 'referencedBy': [], 'standaloneMasterDelivered': False, 'scope': 'Catalogue use/contract citation only. Actual authored geometry is included in the assembly; no canonical geometry was copied or claimed.'})
            if row['id'] not in record['referencedBy']:
                record['referencedBy'].append(row['id'])
            continue
        if dependency not in closure:
            closure[dependency] = by_id[dependency]
            todo.append(by_id[dependency])
verification = read(out / 'variant-verification.json')
form_count = verification['finiteForms']
reference_count = len(entries)
files = set()
def add(p):
    p = p.resolve()
    assert p.is_relative_to(root) and p.is_file() and not p.is_symlink(), str(p)
    files.add(p)
for row in closure.values():
    add(root / 'projects' / row['file'])
    if row.get('kind') == 'legacy-base-dependency':
        directory = root / row['exportDirectory']
        assert directory.resolve().is_relative_to((root / latest['out'] / 'legacy-dependencies').resolve())
        assert read(directory / 'voxels.ysvox.json')['assets'][row['assetId']] == read(root / row['sourceParentFile'])['assets'][row['sourceParentAssetId']]
        for historical_file in row['historicalExportFiles']:
            add(root / historical_file)
    else:
        run = re.match(r'(atlas-\d{14})-', row['file']).group(1)
        directory = root / 'projects/production' / run / 'exports' / row['id']
    for name in ['voxels.ysvox.json', 'visual.glb', 'collision.json', 'interfaces.json', 'atlas.json', 'atlas.png']:
        add(directory / name)
    for pattern in ['*-sky.png', '*-atmosphere-*.png']:
        for image in directory.glob(pattern):
            add(image)
    if (directory / 'terrain-authority.json').exists():
        add(directory / 'terrain-authority.json')
    if row['id'] in {e['id'] for e in entries}:
        for name in ['visual-far.glb', 'visual-material.glb']:
            add(directory / name)
for variant in read(out / 'variant-verification.json')['variants']:
    directory = root / variant['directory']
    assert directory.resolve().is_relative_to((root / latest['out'] / 'variants').resolve())
    for p in directory.iterdir():
        if p.is_file():
            add(p)
gallery = next(r for r in index['studies'] if r['id'] == args.sheet + '-gallery')
for p in [root / 'projects' / gallery['file'], root / 'projects/atlas-production-index.json', root / 'projects/reference-atlas/index.json', root / 'projects/reference-atlas/images' / (args.sheet + '.png'), root / 'docs' / (args.sheet + '-BUILDING-VARIANTS.md')]:
    add(p)
for p in out.iterdir():
    if p.is_file() and p.suffix in {'.json', '.png', '.html', '.txt'} and p.name not in {'batch-package.json', 'previews.partial.json', 'PACKAGE-DOWNLOAD.txt'}:
        add(p)
for p in (out / 'screenshots').iterdir():
    if p.is_file():
        add(p)
for p in (out / 'history').rglob('*'):
    if p.is_file():
        add(p)
manifest = {'format': 'yunshan.variant-batch', 'version': 1, 'sheet': args.sheet, 'run': latest['run'], 'candidateReferences': reference_count, 'candidateMasters': 0, 'candidateAssemblies': 0, 'candidateVariants': reference_count, 'finiteForms': form_count, 'humanArtAccepted': 0, 'variants': entries, 'galleryAssemblyDependencies': gallery_dependencies, 'dependencies': [r for key, r in closure.items() if key not in {e['id'] for e in entries}], 'files': [{'path': str(p.relative_to(root)), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]}
manifest['catalogContractReferences'] = list(catalog_contracts.values())
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for p in sorted(files):
        archive.write(p, p.relative_to(root))
    archive.writestr('batch-manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    archive.writestr('catalog-contract-references.json', json.dumps(list(catalog_contracts.values()), ensure_ascii=False, indent=2))
    archive.writestr('使用说明.txt', f'''{args.sheet} 建筑参数变体：{reference_count} 条参考，{form_count} 种有限形态，新增基础母版 0。
projects 中的原生文件保存父模板、参数、组件、原件/派生关系和实际实例；整体单位米，Y 轴向上。
visual.glb 为整组场景，visual-material.glb 带实际参考材质，visual-far.glb 为手动远档。
通用查看器可读取GLB；编辑器可打开原生单组或gallery文件。若含天球，应按场景extras在独立背景通道绘制天空，按前景几何构图，避免天球半径使场景缩小；半球光须消费端配置。云雾雨与天空PNG同时随包。
斜面、曲面及地形保留连续网格，最小块件为原生体素。原生格和连续网格分别保存碰撞声明；手动远档不等于自动距离 LOD。
若有 terrain-authority.json，须显式加载其中近景实体及实际放置作为物理权威；远景显示面并非体素碰撞代理。
包内保留本批变体及其递归依赖，不把依赖、重复放置或宽度形态算成新基础母版。
另有 {len(catalog_contracts)} 条仅清单用途/契约引用，见 catalog-contract-references.json；其独立母版未交付，不冒称已有原件。
来源给定尺寸与作者布局分别标注，未接入原 FloorPlan、控制器或世界地形；人工美术验收 0。
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
        f'{args.sheet} 资产包：完整 ZIP 的 {len(parts)} 个二进制分卷；请下载全部分卷到同一文件夹。',
        f'内容：{reference_count} 类建筑参数变体、{form_count} 种有限形态、{len(manifest["dependencies"])} 个递归依赖；人工美术验收 0。',
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
if 'archiveParts' not in result:
    (out / 'PACKAGE-DOWNLOAD.txt').write_text(f'{args.sheet}：{reference_count} 类建筑参数变体、{form_count} 种有限形态；人工美术验收 0。\n' + '下载完整 ZIP：https://github.com/stars2022/voxel-studio-yunshan/raw/main/' + str(out.relative_to(root)) + '/' + result['archive'] + '\nSHA-256：' + result['archiveSHA256'] + '\n')
(out / 'batch-package.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps({'references': reference_count, 'assemblies': 0, 'variants': reference_count, 'masters': 0, 'dependencies': len(manifest['dependencies']), 'files': len(files), 'bytes': result['archiveBytes'], 'path': str(args.output), 'parts': result.get('archiveParts', [])}, ensure_ascii=False))
