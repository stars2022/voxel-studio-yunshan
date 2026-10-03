"""Prepare a reviewed working set in an empty checkout. Never upload anything.

The current verified atlas package supplies its evidence dependency closure;
all active library indexes, references, source, and the live autosave are added.
Historical files outside this working set stay local and are inventoried.
"""
import argparse
import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('destination', type=Path)
args = parser.parse_args()
target = args.destination.resolve()
if target == root or target.is_relative_to(root) or root.is_relative_to(target):
    raise SystemExit('Destination must be a separate empty checkout, not the source or its ancestor.')
target.mkdir(parents=True, exist_ok=True)
if any(p.name != '.git' for p in target.iterdir()):
    raise SystemExit('Refusing to overwrite a nonempty destination.')

selected = set()
excluded_names = {'.DS_Store', '.yunshan.lock', 'mcp.local.json'}
def add(file):
    file = Path(file)
    if file.is_symlink():
        raise ValueError(f'Symlink is not a portable source: {file}')
    file = file.resolve()
    if not file.is_relative_to(root):
        return
    if file.is_file() and file.name not in excluded_names and file.suffix.lower() != '.zip':
        selected.add(file)

def tree(directory):
    for file in directory.rglob('*'):
        if file.is_file():
            add(file)

for name in ['src', 'scripts', 'tests', 'docs', 'public']:
    tree(root / name)
for name in ['README.md', 'AGENTS.md', '.gitignore', 'package.json', 'package-lock.json',
             'tsconfig.json', 'vite.config.ts', 'cloud-handoff.txt']:
    add(root / name)

index_names = ['atlas-production-index.json', 'production-index.json',
               'architecture-index.json', 'material-index.json', 'reference-atlas/index.json']
def native_links(value):
    if isinstance(value, dict):
        for child in value.values():
            native_links(child)
    elif isinstance(value, list):
        for child in value:
            native_links(child)
    elif isinstance(value, str) and value.endswith('.ysvox.json'):
        file = root / 'projects' / value
        if not file.is_file():
            raise FileNotFoundError(f'Index references a missing native document: {value}')
        add(file)

for name in index_names:
    file = root / 'projects' / name
    add(file)
    native_links(json.loads(file.read_text()))
for name in ['catalog', 'reference-atlas', 'fixtures', 'reference-study', 'geometry-study', 'sources']:
    tree(root / 'projects' / name)
for file in (root / '参考').rglob('*'):
    # Expanded originals and prompts are included; duplicate download archives are not.
    if file.is_file() and file.suffix.lower() != '.zip':
        add(file)

index = json.loads((root / 'projects/atlas-production-index.json').read_text())
latest_file = root / 'artifacts/atlas/latest.json'
latest = json.loads(latest_file.read_text())
assert latest['run'] == index['run']
add(latest_file)
evidence = (root / latest['evidence']).resolve()
assert evidence.is_relative_to(root / 'artifacts/atlas')
packages = list(evidence.glob('*.zip'))
assert len(packages) == 1, 'Expected one verified current atlas package'
generated_package_entries = []
with ZipFile(packages[0]) as archive:
    for entry in archive.infolist():
        if entry.is_dir():
            continue
        file = (root / entry.filename).resolve()
        if not file.is_relative_to(root):
            raise ValueError('Unsafe package member')
        if file.is_file():
            add(file)
        else:
            generated_package_entries.append(entry.filename)

# Include project indexes from past runs used by batch validation scripts.
for file in (root / 'projects/production').glob('*/*.json'):
    add(file)

# Preserve local Markdown/HTML evidence links rather than shipping broken galleries.
checked = set()
unresolved = set()
while True:
    pending = [f for f in selected - checked if f.suffix.lower() in {'.md', '.html'}]
    if not pending:
        break
    for file in pending:
        checked.add(file)
        text = file.read_text()
        links = re.findall(r'(?:src|href)=[\"\']([^\"\']+)', text)
        links += re.findall(r'\]\(([^\s)]+)\)', text)
        for raw in links:
            link = urlsplit(raw)
            if link.scheme or link.netloc or not link.path:
                continue
            path = (file.parent / unquote(link.path)).resolve()
            if path.is_relative_to(root) and path.is_file():
                add(path)
            elif path.is_relative_to(root) and not path.exists():
                unresolved.add(str(path.relative_to(root)))

rows = []
rewrites = []
for file in sorted(selected):
    relative = file.relative_to(root)
    data = file.read_bytes()
    source_hash = hashlib.sha256(data).hexdigest()
    # Native documents and indexes remain byte-identical. Only historical report
    # filesystem locations are relocated; dates, measurements and claims stay intact.
    if file.suffix == '.json' and not file.name.endswith('.ysvox.json') and (
            relative.parts[0] == 'artifacts' or relative.parts[:2] == ('projects', 'production')):
        old = data
        data = data.replace(str(root).encode() + b'/', b'')
        if old != data:
            rewrites.append(str(relative))
    out = target / relative
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    shutil.copymode(file, out)
    rows.append({'path': str(relative), 'bytes': len(data),
                 'sha256': hashlib.sha256(data).hexdigest(), 'sourceSHA256': source_hash})

# Retain live document, selection, version and undo/redo history. The start script
# restores it once; local autosave and all historical files stay in place.
autosave = root / 'projects/autosave.ysvox.json'
data = autosave.read_bytes()
live = json.loads(data)
resume_name = 'projects/cloud-resume.ysvox.json'
(target / resume_name).write_bytes(data)
rows.append({'path': resume_name, 'bytes': len(data),
             'sha256': hashlib.sha256(data).hexdigest(), 'sourceSHA256': hashlib.sha256(data).hexdigest()})

omitted = []
for name in ['projects', 'artifacts', '参考']:
    for file in (root / name).rglob('*'):
        if file.is_file() and file not in selected and file.name not in excluded_names:
            omitted.append({'path': str(file.relative_to(root)), 'bytes': file.stat().st_size})
cloud = target / 'cloud'
cloud.mkdir()
(cloud / 'local-history.json').write_text(json.dumps({
    'note': 'Preserved on the original workstation. Not uploaded; not deleted. Autosave is captured as cloud-resume.',
    'files': omitted}, ensure_ascii=False, indent=2))
manifest = {
    'format': 'yunshan.cloud-migration', 'version': 1,
    'createdAt': datetime.now(timezone.utc).isoformat(), 'atlasRun': index['run'],
    'counts': {'atlasCandidates': len(index['entries']), 'atlasGalleries': len(index['studies']),
               'referenceSheets': 67, 'referenceEntries': 793, 'artAccepted': 0},
    'resume': {'file': resume_name, 'version': live['version'],
               'undoSteps': len(live.get('session', {}).get('undo', [])),
               'redoSteps': len(live.get('session', {}).get('redo', []))},
    'bytes': sum(r['bytes'] for r in rows), 'files': rows,
    'relocatedReports': rewrites, 'unresolvedHistoricalLinks': sorted(unresolved),
    'generatedPackageEntriesNotCopied': generated_package_entries,
    'localHistoryFiles': len(omitted), 'localHistoryBytes': sum(r['bytes'] for r in omitted),
    'notIncluded': ['node_modules', 'dist', '.git', 'host-specific MCP configuration',
                    'runtime locks', 'duplicate archives and unreferenced historical evidence'],
    'validation': 'No cloud run yet. Historical performance figures identify their original host.'}
(cloud / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print(json.dumps({k: v for k, v in manifest.items() if k not in ['files', 'relocatedReports']}, ensure_ascii=False, indent=2))
