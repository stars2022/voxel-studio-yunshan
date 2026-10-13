from pathlib import Path
import json
w=Path('work/m005-refinement');loc=json.load(open(w/'production-location.json'));root=Path(loc['root']);v=json.load(open(root/'validation.json'));items=json.load(open(w/'asset-notes.json'));link='../'+str(root)
rows='\n'.join('| '+' | '.join(row)+' |' for row in items)
doc=f'''# M005 · 工坊与仓储器具参考精修

12 件现有资产的首轮参考打磨。累计 **5/67 张、60 件参考** 完成首轮精修；793 条参考已技术转化，最终效果图质量验收另计。

[实际总览]({link}/M005-materials.png) · [前后检查页]({link}/review.html) · [GLB]({link}/exports) · [下载包]({link}/PACKAGE-DOWNLOAD.txt)

| 资产 | 名称 | 本轮变化 |
| --- | --- | --- |
{rows}

滚筒、连续橡胶回路、剪叉钢臂、调平螺柱、刀盘护弧及真实网绳采用连续闭合网格；最小紧固件与石质细格保留 **5mm 原生块件**。本批共 {v['triangles']:,} 个显示三角形、{v['nativeMinimumCells']} 个原生细格和 {v['closedOrientedComponents']} 个闭合有向组件。11 件母版各为一个实际连接组；087 的网笼与硬塑捕捞箱是同一清单套件中的两个独立形体，未增加基础母版计数。

078 的橡胶回路有上承段、下回程与两个连续滚端，十八片钢链片分别建模；输入输出作者接口放在实际钢链承面。079 的两组剪叉、导轨、滑块、枢轴和底承枨实接，台下通路保持；侧控已移到前侧并抬高，以免被台面挡住。084 为一体二十刃齿钢盘、真实轴孔与连续上半护弧，护弧背托连接机架。参考中的侧控、双屉、刀盘和网箱左右关系在显式精修母版中镜像修正，原配方保持。

082 的观察玻璃、涂装钢壳、深钢压框、检修盖与实际内腔分开；侧孔射线通至另一侧钢壁，玻璃后方到真实后壳保持空腔。083 的 99 个挂板孔逐孔查真实三角面，扳手环口与刀盘轴孔及扳手尾孔另核实际组件与整把扳手；五件工具由实际挂钩承托，属于工具架原清单内容。086 的空木筐和 087 的空硬塑箱保留底板、孔与真实缝隙，不加入作物或鱼。网绳采用实际共享结点和作者垂坠，不以透明实体板代替网目。

085 是一个相接矿料母版：不规则连续石质切面与有限厚度的细矿脉层实接，矿脉仍为 `oreVein` 石质用途，无五金、发光或矿产数值；展示货箱与其他矿色未合入本 ID。088 的箱壳是硬塑料，密封圈是橡胶；蓝色雪花底与白色枝纹为独立印墨，外置握耳通过真实承座连接，不把提孔穿进保温壳。

材质继续使用实际 512 个语义用途与原碰撞属性；木、石、钢、橡胶、塑料、玻璃、显示像素、绳纤维和印墨独立。金边属于金属包角，黄色升降台警示属于油墨。实际 GLB 的观察窗采用透明混合，0.25 不透明度保存于其色板 PNG 的实际透明通道；冷链蓝墨换色和一次撤销保持白墨、箱壳及其他用途。受光 PBR 表面随 GLB 导出，本批未新增织纹作者贴图。已发布 M001–M004 的 48 件几何哈希保持。

## 验证与文件

- [生产报告]({link}/production.json)：12 新 GLB 实际读回、13 原生文档、{v['finalExportFilesHashed']} 个导出文件核 SHA-256。
- [历史留存]({link}/baseline-exports.json)：12 历史原生母版与 GLB 保留，48 个旧导出文件再次核对。
- [浏览器验证]({link}/browser-verification.json)：12 件公开创建、重建、一次撤销、失败回滚、外来用途 ID 和 12 个图册入口。
- [逐图检查]({link}/visual-review.json)：39 张最终截图全部实际打开；12 对同机位前后材质图、7 张正面与 5 张顶面几何图、3 张冷链印墨换色与撤销实拍。
- [验证汇总]({link}/validation.json)：{v['regressionTests']} 项回归与构建通过；实际加载 bundle SHA 与冻结构建逐文件匹配；其余 781 条参考索引保持。

初稿的控制盒承座、导轨底撑和抽屉滑轨间隙已按真实接触修正。首次测试中的版本号与色板透明通道断言按既有导出和撤销契约修正，失败日志及后续验证保持可追溯；不把这些断言修订冒称运行时故障修复。12 张草稿实拍另存。首个已推送候选在最终看图时发现侧控遮挡和扳手尾孔被柄占用，已修正并重新导出；最终 39 张截图对应同一冻结源码。初候选的 39 张捕获图及实际打开的 21 张记录按真实状态留存，不冒称全部逐图验收。

## 使用

在同一版本编辑器选择「图册 → M005」，或加载 `projects/{loc['run']}-m005-gallery.ysvox.json`。每个 `exports/LIFE-*/visual.glb` 可独立使用；下载包解压后先读 `START-HERE.txt`。

```json
{{"op":"produceCatalogAsset","catalogId":"LIFE-084","id":"mining-cutter","params":{{"refinement":"reference-v1"}}}}
```

默认 `baseline` 保留原配方。生产与浏览器验证脚本支持 M001–M005；重新生产时使用隔离工作区及本批 `previous-index.json`、`previous-latest.json` 保存的原基线。

## 后续范围

这些是静态独立母版或原清单套件，显示图形为作者符号；没有称重数值、温度数据、带速、机加工、刀盘旋转、升降行程、工具取放、捕鱼或库存运行绑定。077/081/086 保持空置，082 只交付机床围壳，087 保留空网与空箱。

金属边缘磨耗、矿料颗粒与更细的矿脉、网绳微观编织、控制面板布局和完整陈列仍可继续深化；首轮检查通过不自动记为最终效果图达标。下一批 **M006**。
'''
Path('docs/M005-REFERENCE-REFINEMENT.md').write_text(doc)
p=Path('README.md');s=p.read_text();old=next(line for line in s.splitlines()if line.startswith('**M004 的 12 件'))
new=f'**M005 的 12 件工坊与仓储器具已交付首轮参考精修**：连续输送带、双剪架、一体齿刃刀盘、透明机床窗、99孔工具架与真实菱形网；{v["regressionTests"]} 项回归与 39 张实际截图。[本轮变化](docs/M005-REFERENCE-REFINEMENT.md) · [实际总览]({root}/M005-materials.png) · [GLB]({root}/exports) · [下载包]({root}/PACKAGE-DOWNLOAD.txt)。累计首轮 5/67 张、60 件，接续 M006；最终效果图验收另计。[M001](docs/M001-REFERENCE-REFINEMENT.md) · [M002](docs/M002-REFERENCE-REFINEMENT.md) · [M003](docs/M003-REFERENCE-REFINEMENT.md) · [M004](docs/M004-REFERENCE-REFINEMENT.md)。'
p.write_text(s.replace(old,new))
p=Path('projects/conversion-goal.json');g=json.load(open(p));g['lastCompletedBatch']={'sheets':['M005'],'subBatch':'reference-art-refinement-v1','run':loc['run'],'state':'validated-first-pass','wholeSheetFirstPassDelivered':True,'refinedReferences':12,'newReferences':0,'humanArtAccepted':False,'evidence':str(root)}
for key in ['refinementPhase','visualRefinementPhase']:g[key].update(firstPassSheets=5,lastDeliveredSheet='M005',nextSheet='M006')
g['visualRefinementPhase'].update(firstPassReferences=60,evidence=str(root/'visual-review.json'));g['nextBatch']='M006';g['activeBatch'].update(sheets=['M006'],state='queued',ids=[r['id']for r in json.load(open('projects/reference-atlas/index.json'))['entries']if r['sheet']=='M006']);assert g['activeBatch']['ids']
g['nextBatchNotes'][1]=f'M005首轮12件已交付：13原生、12新GLB、12历史母版/GLB、39逐图检查实拍、{v["regressionTests"]}项回归；不增加参考或基础母版。';g['nextBatchNotes'][2]=g['nextBatchNotes'][2].replace('M005','M006');p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
p=Path('AGENTS.md');p.write_text(p.read_text()+'''
- M005首轮累计5/67张、60件，接续M006；087空网笼/空硬塑捕捞箱是单一清单套件两个连接组。077/081/086保持空置，082只作围壳，085仅单个矿料母版，不复制货品、作物、鱼、矿箱或刀具充数。
- M005连续输送回路须有上承段、下回程和滚端；作者输入输出端口置于实际钢链承面。剪叉导轨底撑、控制座和抽屉滑轨须实接。99挂板孔逐孔实核；刀盘孔与扳手孔查各自真实三角面，不能把装入轴后的整机轴心声称通透。
- M005观察窗GLB透明混合及实际色板PNG透明通道须核对；雪花蓝墨与白墨用途独立，换蓝墨保持箱壳、白纹与几何，撤销恢复。绳网用真实共享结点和开放网目，矿脉仍归石质用途，无发光或金属五金借色。
''')
print('M005 docs and next M006 updated')
