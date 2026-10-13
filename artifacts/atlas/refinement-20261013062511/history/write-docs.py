from pathlib import Path
import json

w = Path('work/m004-refinement')
loc = json.loads((w / 'production-location.json').read_text())
root = Path(loc['root'])
v = json.loads((root / 'validation.json').read_text())
items = json.loads((w / 'asset-notes.json').read_text())
link = '../' + str(root)
rows = '\n'.join('| ' + ' | '.join(row) + ' |' for row in items)
doc = f'''# M004 · 商铺与物流配件参考精修

12 件现有资产的首轮参考打磨。累计 **4/67 张、48 件参考** 完成首轮精修；793 条参考已技术转化，最终效果图质量验收另计。

[实际总览]({link}/M004-materials.png) · [前后检查页]({link}/review.html) · [GLB]({link}/exports) · [下载包]({link}/PACKAGE-DOWNLOAD.txt)

| 资产 | 名称 | 本轮变化 |
| --- | --- | --- |
{rows}

棚面、薄壁褶皱帘、袋壁、斜把手和绑带采用真实连续网格；最小五金保留 **5mm 原生块件**。本批共 {v['triangles']:,} 个显示三角形、{v['nativeMinimumCells']} 个原生细格和 {v['closedOrientedComponents']} 个闭合有向组件。十件母版各为一个实际连接组；069 的盘/筐和 073 的封签/码板分别为同一清单套件中的两个独立形体，不增加母版计数。

LIFE-070 的 `market-stripe-v1` 织边从实际布料用途生成 1024×192 颜色、法线及 ORM 三张真实 PNG，内嵌 GLB 并独立导出，记录作者米制尺寸 1.4×0.12m。奶白双线和顶部缝线随 `wovenLight` 换色、撤销；同用途实体织边同步改变，蓝色布面、木框和金属夹件保持。全部纹样三角形 UV 都有两个有效轴。连续篷布、三片褶皱帘有真实厚度和闭合侧壁，夹件接触前横梁；织边高于篷面以避免共面闪烁。

安装孔、提手孔、封签孔、棘轮空窗、四向叉孔与两个中央开格均用真实三角面射线检查；底板、内部空腔和承块遮挡控制也实核。托盘顶板横跨三根真实支梁，九个承块与三滑木保持。材质维持项目实际 512 个语义用途与碰撞属性；木、石、搪瓷金属、塑料卡罩、纸页、印墨、固定织带及布料分开。回收图形是贴合袋壁的独立印墨，红封签是硬塑料；包装标签没有借用屏幕或食材角色。已发布 M001–M003 的 36 件几何哈希保持。

## 验证与文件

- [生产报告]({link}/production.json)：12 新 GLB 实际读回、13 原生文档、{v['finalExportFilesHashed']} 个新导出文件核 SHA-256。
- [历史留存]({link}/baseline-exports.json)：12 历史原生母版与 GLB 保留，48 个旧导出文件再次核对。
- [浏览器验证]({link}/browser-verification.json)：12 件公开创建、重建、一次撤销、失败回滚、外来用途 ID 和 12 个图册入口。
- [逐图检查]({link}/visual-review.json)：39 张最终截图全部实际打开；12 对同机位前后材质图、10 张正面和 2 张顶面几何图、3 张布棚织边换色及撤销实拍。素色显示仍保留织纹，轮廓和开口另查实际几何。
- [验证汇总]({link}/validation.json)：{v['regressionTests']} 项回归与构建通过；实际加载 bundle SHA 与冻结构建逐文件匹配；其余 781 条参考索引保持。

连接检查中曾发现布棚夹件、箱盖与托盘顶板未实接，最终候选已按真实接触修正。草稿与最终源码、试拍、验证记录保留于 `history/`；最终截图和导出对应同一冻结源码，不以早期候选图作为最终证据。

## 使用

在同一版本编辑器选择「图册 → M004」，或加载 `projects/{loc['run']}-m004-gallery.ysvox.json`。每个 `exports/LIFE-*/visual.glb` 可独立使用；下载包解压后先读 `START-HERE.txt`。

```json
{{"op":"produceCatalogAsset","catalogId":"LIFE-070","id":"market-canopy","params":{{"refinement":"reference-v1"}}}}
```

默认 `baseline` 保留原配方。生产与浏览器验证脚本支持 M001/M002/M003/M004；重新生产时使用隔离工作区和本批 `previous-index.json`、`previous-latest.json` 保存的原基线。

## 后续范围

本批交付独立空母版及静态套件。LIFE-065 保留原库存数量、生命周期与展示渲染契约作为来源信息，八个展示点是作者布局，尚未接原运行状态；未补造食品或库存。071 按既有实际材质审阅交付木箱，072 交付单箱，073 的登记条为作者图形，未声明可扫码身份。076 交付一条固定带，货箱与托盘按各自清单交付；布料、门屉、张力和锁扣运动仍为静态。

与效果图相比，货架金属护角的金色包边、表面磨耗与局部纹理仍可深化；价格轨目前采用单张长标签，参考的两张卡片布局需后续细化；封签与码板的完整变体及陈列货品组合另做。首轮技术和看图通过不自动记为最终美术达标。下一批 **M005**。
'''
Path('docs/M004-REFERENCE-REFINEMENT.md').write_text(doc)

p = Path('README.md')
s = p.read_text()
old = next(line for line in s.splitlines() if line.startswith('**M003 的 12 件'))
new = f'**M004 的 12 件商铺与物流配件已交付首轮参考精修**：五层货架、六抽屉双开格、连续布棚与真实织边、四向叉孔托盘和独立棘轮绑带；{v["regressionTests"]} 项回归与 39 张实际截图。[本轮变化](docs/M004-REFERENCE-REFINEMENT.md) · [实际总览]({root}/M004-materials.png) · [GLB]({root}/exports) · [下载包]({root}/PACKAGE-DOWNLOAD.txt)。累计首轮 4/67 张、48 件，接续 M005；最终效果图验收另计。[M001](docs/M001-REFERENCE-REFINEMENT.md) · [M002](docs/M002-REFERENCE-REFINEMENT.md) · [M003](docs/M003-REFERENCE-REFINEMENT.md)。'
p.write_text(s.replace(old, new))

p = Path('projects/conversion-goal.json')
g = json.loads(p.read_text())
g['lastCompletedBatch'] = {'sheets': ['M004'], 'subBatch': 'reference-art-refinement-v1', 'run': loc['run'], 'state': 'validated-first-pass', 'wholeSheetFirstPassDelivered': True, 'refinedReferences': 12, 'newReferences': 0, 'humanArtAccepted': False, 'evidence': str(root)}
for key in ['refinementPhase', 'visualRefinementPhase']:
    g[key].update(firstPassSheets=4, lastDeliveredSheet='M004', nextSheet='M005')
g['visualRefinementPhase'].update(firstPassReferences=48, evidence=str(root / 'visual-review.json'))
g['nextBatch'] = 'M005'
g['activeBatch'].update(sheets=['M005'], state='queued', ids=[r['id'] for r in json.load(open('projects/reference-atlas/index.json'))['entries'] if r['sheet'] == 'M005'])
assert g['activeBatch']['ids']
g['nextBatchNotes'][1] = f'M004首轮12件已交付：13原生、12新GLB、12历史母版/GLB、39逐图检查实拍、{v["regressionTests"]}项回归；不增加参考或基础母版。'
g['nextBatchNotes'][2] = g['nextBatchNotes'][2].replace('M004', 'M005')
p.write_text(json.dumps(g, ensure_ascii=False, indent=2) + '\n')

p = Path('AGENTS.md')
p.write_text(p.read_text() + '''
- M004首轮累计4/67张、48件，接续M005；069空盘/格条筐与073封签/码板各为一个清单套件、两个独立连接组，不复制变体或组合充数。076为单条织带，不复制独立箱体或托盘。
- M004棚面、褶皱帘与袋壁须为真实连续闭合薄壁；market-stripe-v1颜色/法线/ORM从实际布料用途生成并嵌入GLB，全部纹样三角UV须有两个有效轴。wovenLight纹样和同用途实体织边同步换色；蓝布、框架和其他用途保持，撤销恢复。
- M004托盘五顶板横跨三横梁、九承块和三滑木，四向叉孔须查真实三角射线及承块遮挡控制。夹件、箱盖与顶板接触须实核；065八个作者展示点不冒称已接原库存运行契约，073作者登记图形不冒称可扫码身份。
''')
print('M004 docs and next M005 updated')
