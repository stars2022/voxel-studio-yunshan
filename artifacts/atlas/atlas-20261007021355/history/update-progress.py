import json
from pathlib import Path
root=Path.cwd();read=lambda p:json.loads(p.read_text());latest=read(root/'artifacts/atlas/latest.json');out=root/latest['evidence'];v=read(out/'validation.json');assert v['status']=='passed'
index=read(root/'projects/atlas-production-index.json');source=read(root/'projects/reference-atlas/index.json');done={r['id']for r in index['entries']};sheets={r['sheet']for r in source['entries']};complete=[s for s in sheets if all(r['id']in done for r in source['entries']if r['sheet']==s)];assert len(done)==708 and len(complete)==59
p=root/'projects/conversion-goal.json';g=read(p);g['progress']={'referenceCandidates':708,'remainingReferenceEntries':85,'completedReferenceSheets':59,'catalogCounts':read(out/'catalog-counts.json'),'humanArtAccepted':0}
g['lastCompletedBatch']={'sheet':'M059','subBatch':'building-parameter-variants','run':latest['run'],'state':'validated','wholeSheetComplete':True,'evidence':latest['evidence']}
next_rows=[r for r in source['entries']if r['sheet']=='M060'];g['activeBatch']={'sheet':'M060','subBatch':'building-parameter-variants','state':'queued','ids':[r['id']for r in next_rows],'scope':'按真实清单分别实现建筑尺寸层数组、共享坡顶朝向、墙面用途配色及旧屋顶有限形态；保持变体类型、父模板、真实构件厚度与来源边界。'};g['nextBatch']='M060'
g['limitations'][-1]='M001–M059共708条技术候选，余85；513独立图册母版、3共用引用、186图册组合、6建筑变体参考，完整图册59张，人工美术验收0。'
g['nextBatchNotes']=[
 '用户修正持续优先：最小组件体素，斜面和曲面连续，天空/星空使用实际贴图。',
 'M059两个独立子批已完成：角色动物6组合/12形态，建筑6变体/38形态；后者证据'+latest['run']+'，整库563测试、114份GLB和38次公开旋转撤销验证通过。',
 '累计708/793，余85；全库532基础候选、186组合、10类变体/47有限变体模型，731已生成条目，337未制作；人工美术验收0。',
 '旧角色动物病衣绷带局部留缝及第一人称袖管遮掌限制仍保留，不因建筑子批通过覆盖。',
 '新produceCatalogVariant和variant索引/统计已接通，但当前实现只覆盖025–030；M060必须逐合同扩展，不能直接拿尺寸缩放充作完成。',
 'M059保留019–022实际父模板，墙面/楼层/坡顶重排，原生家具安装只用自身格距。农庄是单层连续U形坡顶；工坊逐层完整楼面为明确作者变体。',
 '原world/FloorPlan门位容量、seed算法、core公务翼特殊值和civicPlan覆盖未提供，继续未绑定。',
 'M060的031–037分别核具体母版和层高，038/039核X/Z截面朝向，041核实际墙面用途；082/083旧屋顶必须保留历史几何/美术失败边界。',
 'M059混合gallery保留旧六组合及六新变体；当前包包含四父模板和递归组件，历史角色动物提交与包未覆盖。',
 '每批验证后推送origin/main已授权，不重复确认。单批完成不调用stop_goal；浏览器串行；源代码回归运行期间不改被测生产代码。']
p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
p=root/'README.md';s=p.read_text();lines=s.splitlines();at=next(i for i,l in enumerate(lines)if l.startswith('67 张完整图册已接入'));lines[at]='67 张完整图册已接入「图册」页，793 条参考逐 ID 对齐。M001–M059 共 **708 个参考 ID（513 个独立图册母版、3 条共享引用、186 个组合模板、6 类建筑参数变体）**已制作为候选，其余 85 条待制作或复核，人工美术验收为 0。[模型与历史记录](docs/ATLAS-PRODUCTION.md) · [M059 建筑变体](docs/M059-BUILDING-VARIANTS.md) · [最新总览]('+latest['evidence']+'/M059.png)。本批6类建筑含38种有限形态，合并旧库仍为532个基础候选；实例与参数形态不增加基础资产数。';p.write_text('\n'.join(lines)+'\n')
p=root/'docs/ATLAS-PRODUCTION.md';s=p.read_text();lines=s.splitlines();at=next(i for i,l in enumerate(lines)if l.startswith('M001–M058 和 M059'));lines[at]='M001–M059 已完成技术制作，累计 **708/793** 条参考候选，剩余85条；整张完成数59，人工美术验收0。最新 [M059 建筑参数变体](M059-BUILDING-VARIANTS.md)、[进度](../projects/conversion-goal.json) 和 [实际总览](../'+latest['evidence']+'/M059.png)。六类变体共38种尺寸/层数形态，与先前六条角色动物组合分别计数；继续采用最小体素组件、连续斜面/曲面和天空贴图的混合建模标准。';p.write_text('\n'.join(lines)+'\n')
p=root/'docs/M059-ARCHITECTURE-ASSEMBLIES.md';s=p.read_text();s=s.replace('\n\n本次只交付','\n\n后续状态：六条建筑参数变体已在[独立子批次](M059-BUILDING-VARIANTS.md)完成，M059整张现已具备技术候选。以下保留角色动物提交时的原始范围、验证和限制。\n\n本次只交付',1);p.write_text(s)
print(json.dumps({'run':latest['run'],'candidates':len(done),'completeSheets':len(complete),'remaining':793-len(done)},ensure_ascii=False))
