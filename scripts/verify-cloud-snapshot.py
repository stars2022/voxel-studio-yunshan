"""Check a received migration snapshot without altering native voxel documents."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'cloud/manifest.json').read_text())
failures = []
for row in manifest['files']:
    file = root / row['path']
    if not file.resolve().is_relative_to(root) or file.is_symlink() or not file.is_file():
        failures.append({'path': row['path'], 'error': 'missing or unsafe path'})
        continue
    if hashlib.sha256(file.read_bytes()).hexdigest() != row['sha256']:
        failures.append({'path': row['path'], 'error': 'content differs from migration snapshot'})
print(json.dumps({'status': 'failed' if failures else 'passed', 'files': len(manifest['files']),
                  'atlasRun': manifest['atlasRun'], 'errors': failures}, ensure_ascii=False, indent=2))
raise SystemExit(bool(failures))
