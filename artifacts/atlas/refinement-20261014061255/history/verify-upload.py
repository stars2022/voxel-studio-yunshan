from pathlib import Path
import hashlib, json, subprocess

w = Path('work/m008-refinement')
loc = json.loads((w / 'production-location.json').read_text())
root = Path(loc['root'])
manifest = json.loads((root / 'package-manifest.json').read_text())
downloads = json.loads((root / 'downloads.json').read_text())['files']
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
remote = subprocess.check_output(['git', 'ls-remote', 'origin', 'refs/heads/main'], text=True).split()[0]
assert commit == remote, (commit, remote)
assert not subprocess.check_output(['git', 'status', '--porcelain'], text=True).strip()
rows = manifest['files'] + [dict(d, path=(root / d['file']).as_posix()) for d in downloads]
for row in rows:
    data = subprocess.check_output(['git', 'cat-file', 'blob', commit + ':' + row['path']])
    assert len(data) == row['bytes'], row['path']
    assert hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
proof = {
    'status': 'passed', 'commit': commit, 'remoteMain': remote,
    'cleanWorkingTree': True, 'payloadBlobsVerified': len(manifest['files']),
    'archiveBlobsVerified': len(downloads), 'run': loc['run'],
    'method': 'Every committed payload and download blob byte count and SHA-256 checked against final package records; origin/main equals HEAD.',
    'downloads': downloads,
}
(w / 'final-upload.json').write_text(json.dumps(proof, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(proof, ensure_ascii=False))
