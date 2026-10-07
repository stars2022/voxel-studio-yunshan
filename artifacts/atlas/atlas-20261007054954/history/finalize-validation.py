import hashlib
import json
import re
import shutil
from pathlib import Path

root = Path.cwd()
read = lambda p: json.loads(p.read_text())
latest = read(root / 'artifacts/atlas/latest.json')
out = root / latest['evidence']
assert latest['run'] == 'atlas-20261007054954'
work = root / 'work/m060-roofs'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
snapshot = read(work / 'validation-source-snapshot-wall-repair.json')
actual = {str(p.relative_to(root)): sha(p) for directory in ['src', 'tests', 'scripts/lib'] for p in sorted((root / directory).rglob('*')) if p.is_file()}
assert actual == snapshot, 'Tested source changed during regression'
def tests(name, expected):
    log = (work / name).read_text()
    result = {key: int(re.search(r'ℹ ' + key + r' (\d+)\s', log).group(1)) for key in ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']}
    assert result == {'tests': expected, 'pass': expected, 'fail': 0, 'cancelled': 0, 'skipped': 0, 'todo': 0}, result
    return result
full = tests('full-tests-wall-repair.txt', 575)
targeted = tests('targeted-tests-wall-repair.txt', 6)
assert '✓ built in ' in (work / 'build-wall-repair.txt').read_text()
assert read(work / 'final-typecheck.json')['exitCode'] == 0
assert read(work / 'git-fsck-result.json')['exitCode'] == 0
reports = {name: read(out / (name + '.json')) for name in ['variant-verification', 'variant-mcp-verification', 'retained-parent-verification', 'new-base-production', 'material-audit', 'visual-review']}
assert all(r['status'] == 'passed' and r['run'] == latest['run'] for r in reports.values())
variant, mcp, parents, base, material, visual = reports.values()
assert len(variant['records']) == 14 and variant['distinctPhysicalGeometryConfigurations'] == 7 and variant['distinctGeometryMaterialConfigurations'] == 14
assert variant['wholeSheetComplete'] and variant['sheetProducedReferences'] == variant['sheetReferenceCount'] == 12
assert len(mcp['quarterTurns']) == len(mcp['publicForms']) == 14 and len(mcp['notifications']) == 99 and not mcp['errors']
assert all(v['passed'] and v['actualQuarterTurnPositionsAndAssetsVerified'] for v in mcp['quarterTurns'])
assert [n['version'] for n in mcp['notifications']] == mcp['expectedInvalidationVersions']
assert all(not n['fullProject'] and n['bytes'] < 65536 for n in mcp['notifications'])
for record, turn in zip(variant['records'], mcp['quarterTurns']):
    assert record['id'] == turn['id'] and record['params'] == turn['params']
    native = root / record['file']
    if not native.exists():
        native = root / 'projects' / record['file']
    assert sha(native) == turn['sourceSHA256'], native
for view in mcp['views']:
    assert sha(out / view['file']) == view['imageSHA256']
for group in ['defaultViews', 'mcpViews', 'boardsAndUI']:
    for view in visual[group]:
        assert sha(out / view['file']) == view['sha256']
assert len(parents['checks']) == 5 and material['totalRoles'] == 512 and material['pendingCandidates'] == 0
assert base['canonicalNativeAndCollisionIdentical'] and base['newIndependentMasters'] == 1
exports = [e for r in variant['records'] for e in r['exports']]
assert len(exports) == 42
previews = read(out / 'previews.json')
assert not previews['errors'] and previews['imageCount'] == 36 and previews['reusedImages'] == 21
index = read(root / 'projects/atlas-production-index.json')
atlas = read(root / 'projects/reference-atlas/index.json')
done = {r['id'] for r in index['entries']}
complete = [s for s in {r['sheet'] for r in atlas['entries']} if all(r['id'] in done for r in atlas['entries'] if r['sheet'] == s)]
assert len(done) == 720 and len(complete) == 60
validation = {
    'run': latest['run'], 'status': 'passed', 'subBatch': 'M060 roof orientation, wall purpose, roof sampling and upper-footprint variants',
    'wholeSheetComplete': True, 'sheetProducedReferences': 12, 'sheetReferenceCount': 12,
    'fullRepositoryTests': full['tests'], 'fullRepositoryPass': full['pass'], 'fullRepositoryFail': 0,
    'targetedTests': targeted, 'unresolvedFailures': 0, 'build': 'passed', 'typecheck': 'passed',
    'mcpCheckGroups': len(mcp['checks']), 'publicParameterCreations': 14, 'publicQuarterTurns': 14,
    'mcpNotificationVersions': mcp['expectedInvalidationVersions'], 'maximumNotificationBytes': max(n['bytes'] for n in mcp['notifications']),
    'defaultScreenshots': 15, 'reusedDefaultScreenshots': 21, 'additionalMCPViews': 18,
    'defaultVariants': 5, 'finiteForms': 14, 'distinctPhysicalGeometryConfigurations': 7, 'distinctGeometryMaterialConfigurations': 14,
    'newBaseMasters': 1, 'newAssemblies': 0,
    'defaultInstances': sum(r['instances'] for r in variant['records'] if r['isDefault']),
    'allFiniteFormInstances': sum(r['instances'] for r in variant['records']),
    'independentlyReadGLBs': 43, 'maximumGLBBoundsErrorM': max([e['boundsErrorM'] for e in exports] + [base['glbBoundsMaxErrorM']]),
    'newRoles': 0, 'totalRoles': 512, 'wallAppearanceInstances': 8,
    'selectedHistoricalParentChecks': 5, 'sourceAndTestsUnchangedSinceFullSuiteStart': True,
    'referenceCandidates': 720, 'remainingReferences': 73, 'completeSheets': 60, 'humanArtAccepted': 0,
    'scope': 'Five variant references with fourteen finite forms and one genuinely new non-reference004base. Full011and075sources retained. Actual coarse-roof physical authority sidecars, upper-body roof perforation, fitted underside timbers, independent wall finishes and real mesh/native exports. Original seed RGB, generator, FloorPlan and controllers remain unbound. Upper roof is a support/perforation fixture with no access stairs.',
    'history': 'Before final freeze, visual review found upper fine timbers protruding through the sampled roof and coplanar wall masonry overlapping end wood posts. Failed images and prior wall assets/exports were archived; final geometry was corrected and all checks rerun. An initial complete14formMCP run failed an invented1KiBnotification assertion; the verifier was corrected to the existing64KiBcontract and the entireMCP run passed. Interrupted pre-fix tests are not counted as completed.'
}
(out / 'validation.json').write_text(json.dumps(validation, ensure_ascii=False, indent=2) + '\n')
for name in ['full-tests-wall-repair.txt', 'final-typecheck.json', 'final-typecheck.txt', 'git-fsck-result.json', 'git-fsck-full.txt']:
    shutil.copy2(work / name, out / 'history' / name)
print(json.dumps({k: validation[k] for k in ['run', 'status', 'fullRepositoryTests', 'finiteForms', 'independentlyReadGLBs', 'defaultInstances', 'allFiniteFormInstances']}, ensure_ascii=False))
