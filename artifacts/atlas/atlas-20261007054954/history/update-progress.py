import json
from pathlib import Path
root = Path.cwd()
read = lambda p: json.loads(p.read_text())
latest = read(root / 'artifacts/atlas/latest.json')
out = root / latest['evidence']
v = read(out / 'validation.json')
assert v['status'] == 'passed' and v['wholeSheetComplete'] and v['referenceCandidates'] == 720
counts = read(out / 'catalog-counts.json')
assert counts['atlasReferenceCandidates'] == 720 and counts['baseModels'] == 533
source = read(root / 'projects/reference-atlas/index.json')
remaining = [r['id'] for r in source['entries'] if r['sheet'] == 'M061']
p = root / 'projects/conversion-goal.json'
g = read(p)
g['progress'] = {'referenceCandidates': 720, 'remainingReferenceEntries': 73, 'completedReferenceSheets': 60, 'catalogCounts': counts, 'humanArtAccepted': 0}
g['lastCompletedBatch'] = {'sheet': 'M060', 'subBatch': 'roof-orientation-wall-purpose-roof-detail-variants', 'run': latest['run'], 'state': 'validated', 'wholeSheetComplete': True, 'evidence': latest['evidence']}
g['activeBatch'] = {'sheet': 'M061', 'subBatch': 'legacy-roof-wall-transport-variants', 'state': 'queued', 'ids': remaining[:10], 'scope': '保留真实076/058/169/181父资产，制作单/双脊、11种墙色、7种载具三盒代理和14m机位；CHAR017/018年龄比例另作子批。'}
g['nextBatch'] = 'M061'
g['limitations'][-1] = 'M001–M060累计720条技术候选，余73；513独立图册母版、3共享引用、186图册组合、18变体参考/84有限形态，完整图册60张，人工美术验收0。'
g['nextBatchNotes'] = [
    '用户修正持续优先：最小组件体素，斜面和曲面连续，天空/星空使用真实贴图。',
    'M060整张12/12参考已完成技术转化：第一子批7类32形态，第二子批5类14形态。两个下载包共同交付全部46形态；最新包另含前一子批7个默认组合以打开整张gallery。',
    '第二子批整库575测试、43份实际GLB、14次公开创建和14次90度旋转撤销、99条精确版本更新通知全部通过。011完整600131格与075standard父源保持；004新增真实墙母版单独计数，不能继续称其缺失。',
    '累计720/793，余73；全库基础533、组合186、变体22类/93形态、已生成744条、未制作324条。',
    '墙色为8个wall用途外观实例，仍512用途上限。远档保留近景物理权威侧文件；上层屋顶为穿孔/承托样件，无通达楼梯。原seedRGB、屋面生成器及控制器仍未绑定。',
    'M061五个父资产已在atlas核实，旧production-index的not-produced记录不代表父资产缺失。085保留058实际386556格，只换墙面用途；084双脊须真实处理谷部。',
    '170–176是原169三盒代理尺寸/类型变体，172与171共形，不能冒称新增Vehicle身份、完整载具或真实路线绑定。182为181真实7m站台的14m尺寸派生。',
    'CHAR017/018保留0.6m/1m身高阶梯，同时使用真实婴幼儿比例，不能仅缩小成人001。公开变体schema目前仅BUILT，接入CHAR须明确扩展并验证。',
    '每批验证后推送origin/main已授权；完成当前子批不能调用stop_goal。源代码回归或正式验证期间不修改被测生产代码。浏览器串行，使用PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright。'
]
p.write_text(json.dumps(g, ensure_ascii=False, indent=2) + '\n')
p = root / 'README.md'
lines = p.read_text().splitlines()
at = next(i for i, line in enumerate(lines) if line.startswith('67 张完整图册已接入'))
lines[at] = '67 张完整图册已接入「图册」页，793 条参考逐 ID 对齐。M001–M060 累计 **720 个参考 ID（513 个独立图册母版、3 条共享引用、186 个组合模板、18 类参数变体）**已制作为候选，其余 73 条待制作或复核，人工美术验收为 0。[模型与历史记录](docs/ATLAS-PRODUCTION.md) · [M060 屋顶与墙色变体](docs/M060-ROOF-WALL-VARIANTS.md) · [本批总览](' + latest['evidence'] + '/M060.png)。M060 两个子批共12类、46种有限形态，整张完成数60。新004墙体另计一个非图册基础母版，合并旧库基础候选533；实例与参数形态不增加基础资产数。'
p.write_text('\n'.join(lines) + '\n')
p = root / 'docs/ATLAS-PRODUCTION.md'
lines = p.read_text().splitlines()
assert lines[2].startswith('M001–M059 与 M060 首批累计')
lines[2] = 'M001–M060 累计 **720/793** 条参考候选，剩余73条；整张完成数60，人工美术验收0。最新 [M060 屋顶与墙色变体](M060-ROOF-WALL-VARIANTS.md)、[进度](../projects/conversion-goal.json) 和 [实际总览](../' + latest['evidence'] + '/M060.png)。M060 第一子批7类32形态、第二子批5类14形态分别打包；新004真实父墙另计一个非图册基础母版。后续继续M061，保持最小体素组件、连续斜面/曲面及天空贴图的混合标准。'
p.write_text('\n'.join(lines) + '\n')
print(json.dumps({'references': 720, 'remaining': 73, 'completeSheets': 60, 'nextBatch': 'M061', 'nextIds': remaining}, ensure_ascii=False))
