from pathlib import Path
import json
w=Path('work/m003-refinement');loc=json.load(open(w/'production-location.json'));root=Path(loc['root']);v=json.load(open(root/'validation.json'));items=json.load(open(w/'asset-notes.json'));link='../'+str(root)
rows='\n'.join('| '+' | '.join(row)+' |'for row in items)
doc=f'''# M003 · 杯壶与卫浴器物参考精修

12 件现有资产的首轮参考打磨。累计 **3/67 张、36 件参考** 完成首轮精修；793 条参考已技术转化，最终效果图质量验收另计。

[实际总览]({link}/M003-materials.png) · [前后检查页]({link}/review.html) · [GLB]({link}/exports) · [下载包]({link}/PACKAGE-DOWNLOAD.txt)

| 资产 | 名称 | 本轮变化 |
| --- | --- | --- |
{rows}

器皿、盆壁、座圈、圆支管与毛巾采用真实连续网格；最小五金保留 **5mm 原生块件**。本批共 {v['triangles']:,} 个显示三角形、{v['nativeMinimumCells']} 个原生细格和 {v['closedOrientedComponents']} 个闭合有向组件。12 件各通过真实组件接触检查。

两条毛巾各有前后垂片、绕杆弧面、薄侧壁与连续褶皱。独立 `hui-towel-v1` 织带从实际布料用途生成 1024×384 颜色、法线及 ORM，共六张真实 PNG，内嵌 GLB 并随 LIFE-057 导出。换色与撤销保持另一条织带和几何；纹样三角形 UV 均有两个有效轴。

刀身挂孔、柜背检修孔、排水口、柜台走线孔和四口管件均用实际三角面射线检查。材质保持项目实际 512 个语义用途及碰撞属性；白瓷、青釉、木材、钢管、红色涂装钢手轮、玻璃、镜芯、屏底与显示图形可独立修改。已发布的 M001/M002 24 件几何哈希保持。

## 验证与文件

- [生产报告]({link}/production.json)：12 新 GLB 实际读回、13 原生文档、{v['finalExportFilesHashed']} 个导出文件哈希核对。
- [历史留存]({link}/baseline-exports.json)：12 历史原生母版与 GLB 保留，48 个旧导出文件再次核对。
- [浏览器验证]({link}/browser-verification.json)：公开创建、重建、一次撤销、失败回滚、外来用途 ID 和 12 个图册入口。
- [逐图检查]({link}/visual-review.json)：39 张最终截图全部实际打开；12 对同机位前后材质图、12 张正面几何图、3 张毛巾织纹换色及撤销近照。现有素色显示保留织纹，轮廓与开口另查几何视图。
- [验证汇总]({link}/validation.json)：{v['regressionTests']} 项回归与构建通过；实拍加载 bundle SHA 与冻结构建逐文件匹配；其余 781 条参考索引保持。

2026-10-08 尚未提交的 M003 文件在环境重启后未恢复。本批按已确认方案重新生成，使用本批实际测量与验证数据；缺失旧记录没有冒称已留档。重建时的连接检查、测试失败和修订记录保留在 `history/`。

## 使用

在同一版本编辑器选择「图册 → M003」，或加载 `projects/{loc['run']}-m003-gallery.ysvox.json`。每个 `exports/LIFE-*/visual.glb` 可独立使用，下载包解压后读 `START-HERE.txt`。

```json
{{"op":"produceCatalogAsset","catalogId":"LIFE-057","id":"towels","params":{{"refinement":"reference-v1"}}}}
```

默认 `baseline` 保留原配方。生产及浏览器验证脚本均支持 M001/M002/M003；重做时使用隔离工作区和本批 `previous-index.json`、`previous-latest.json` 保存的原基线。

## 后续

本批为空器皿、空设备及静态陈列母版；杯壶和茶具分别仍算一个清单资产。柜体、盆体、货品、收银设备等各按独立清单交付。镜芯沿用现有 PBR 表现，平面场景反射尚未实现；门屉运动、水流、阀门状态与布料物理未绑定。完整陈设、细微磨耗及最终效果图验收继续打磨。下一批 **M004**。
'''
Path('docs/M003-REFERENCE-REFINEMENT.md').write_text(doc)
p=Path('README.md');s=p.read_text();old=next(line for line in s.splitlines()if line.startswith('**M002 的 12 件'))
new=f'**M003 的 12 件杯壶与卫浴器物已交付首轮参考精修**：空心器皿、连续盆壁、四口管路和双毛巾真实织纹；{v["regressionTests"]} 项回归与 39 张实际截图。[本轮变化](docs/M003-REFERENCE-REFINEMENT.md) · [实际总览]({root}/M003-materials.png) · [GLB]({root}/exports) · [下载包]({root}/PACKAGE-DOWNLOAD.txt)。累计首轮 3/67 张、36 件，接续 M004；最终效果图验收另计。[M001](docs/M001-REFERENCE-REFINEMENT.md) · [M002](docs/M002-REFERENCE-REFINEMENT.md)。'
p.write_text(s.replace(old,new))
p=Path('projects/conversion-goal.json');g=json.load(open(p));g['lastCompletedBatch']={'sheets':['M003'],'subBatch':'reference-art-refinement-v1','run':loc['run'],'state':'validated-first-pass','wholeSheetFirstPassDelivered':True,'refinedReferences':12,'newReferences':0,'humanArtAccepted':False,'evidence':str(root)}
for key in ['refinementPhase','visualRefinementPhase']:g[key].update(firstPassSheets=3,lastDeliveredSheet='M003',nextSheet='M004')
g['visualRefinementPhase'].update(firstPassReferences=36,evidence=str(root/'visual-review.json'));g['nextBatch']='M004';g['activeBatch'].update(sheets=['M004'],state='queued',ids=[r['id']for r in json.load(open('projects/reference-atlas/index.json'))['entries']if r['sheet']=='M004'])
g['nextBatchNotes'][1]=f'M003首轮12件已交付：13原生、12新GLB、12历史母版/GLB、39逐图检查实拍、{v["regressionTests"]}项回归；不增加参考或基础母版。';g['nextBatchNotes'][2]=g['nextBatchNotes'][2].replace('M003','M004')
p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
p=Path('AGENTS.md');p.write_text(p.read_text()+'''\n- M003首轮累计3/67张、36件，接续M004；杯壶和茶具各按一个清单母版计数，不把内部杯数当新增资产。柜体、盆体、货品和收银设备仍独立。\n- M003四口接头须保留实际上下/左右通路和连续圆支管；坐便盖静态打开，镜芯沿用现有PBR，不冒称平面场景反射。\n- M003两条毛巾须保存真实前后薄壁、绕杆弧面及独立织物用途。hui-towel-v1颜色/法线/ORM从实际角色生成并导出；全部纹样三角UV须有两个有效轴，换色与撤销保持另一条织带。\n''')
print('M003 docs and next M004 updated')
