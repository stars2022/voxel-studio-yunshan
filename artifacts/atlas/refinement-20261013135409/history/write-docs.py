from pathlib import Path
import json
w=Path('work/m006-refinement');loc=json.load(open(w/'production-location.json'));root=Path(loc['root']);v=json.load(open(root/'validation.json'));items=json.load(open(w/'asset-notes.json'));link='../'+str(root)
rows='\n'.join('| '+' | '.join(row)+' |' for row in items)
doc=f'''# M006 · 终端、食材与书画参考精修

12 件现有资产的首轮参考打磨。累计 **6/67 张、72 件参考** 完成首轮精修；793 条参考已技术转化，最终效果图质量验收另计。

[实际总览]({link}/M006-materials.png) · [前后检查页]({link}/review.html) · [GLB]({link}/exports) · [下载包]({link}/PACKAGE-DOWNLOAD.txt)

| 资产 | 名称 | 本轮变化 |
| --- | --- | --- |
{rows}

终端和讲台斜面使用真正连续平面，粮堆与叶菜采用有限厚度曲面，鱼体、叉尾、眼圈、卷端与书脊使用闭合连续组件；最小扣销和书角保留 **5mm 原生块件**。本批共 {v['triangles']:,} 个显示三角形、{v['nativeMinimumCells']} 个原生细格、{v['closedOrientedComponents']} 个闭合有向组件。12 件各为一个实际连接组；内部瓶包、谷粒和叶片不增加清单母版计数。

089/091 的斜石操作台、钢键盘托板和独立塑料键帽实际接触，后机箱与木屏框连接；检修腔、前机箱通风孔、读取槽保持。090 仅为可装在柜台上的独立玻璃屏，包含双木柱、石质锁座、贯通传声槽和侧控制框；不把参考图的整张柜台合入屏体。109 的连续斜台与真实前束腰、后承柱相接，开放背仓保持。110 的浅柜、双门、通风格和粉笔槽是实际组件。

092 是一个低粮堆：独立长谷粒密集沿真实半堆表面贴合，底面有真实封底，深浅用途仍保留各自原碰撞属性。093 是一株独立青叶菜，白色食材根盘、菜梗与非碰撞植物叶面分开；十三片真实薄叶有两面和封闭边缘。094 为静态鱼食材，银灰体、背、腹和眼部独立；叉尾保留真实缺口，鳍条收在叶片轮廓内，鳃弧跟随鱼体。

095 是一只可复用空金属箱，有独立盖、钢箍、锁扣、贯通提手与纸/红墨标签，没有复制小箱。096 的开盒、纸包、织带、琥珀玻璃瓶壁与塑料旋盖各按实际用途分类；瓶内为空，玻璃壳有真实内壁与底壁，不用实心玻璃块冒称空瓶。106 一本书和107一幅展开卷轴各保留一个清单母版。

新增用途感知图形描述 `SurfaceArtwork`：金融图表、货箱轮廓、教学建筑/圆图、书封建筑纹和山水画心在编辑器与实际 GLB 中使用同一 **1024×768 颜色/法线/ORM** 数据。纸/油墨与屏幕底面/显示像素严格分开，保持512语义用途和原 `solid`；画心为作者设计，不冒称取得原图像素或参考水墨原稿。纸纤维表面为新增受光 PBR 类型，公开材质命令及编辑器均可选择。所有纹样三角 UV 保持两个有效轴。只换山水青墨颜色会更新真实 GPU 图形贴图，保持纸、深墨、几何和碰撞，一次撤销恢复。

## 验证与文件

- [生产报告]({link}/production.json)：12 新 GLB 实际读回、13 原生文档、{v['finalExportFilesHashed']} 个导出文件核 SHA-256，包含 {v['newTexturePNGs']} 张新增图形 PNG。
- [历史留存]({link}/baseline-exports.json)：12 历史原生母版与 GLB 保留，48 个旧导出文件再次核对；此前 M001–M005 的60件精修几何哈希保持。
- [浏览器验证]({link}/browser-verification.json)：12 件公开创建、重建、一次撤销、失败回滚、外来用途 ID 和12个图册入口。
- [逐图检查]({link}/visual-review.json)：39张最终截图实际打开，12对共同米制机位前后材质图、7张正面与5张顶面几何图、3张山水画心换色/撤销细节。
- [验证汇总]({link}/validation.json)：{v['regressionTests']}项回归与构建通过；实际加载 bundle SHA 与冻结构建一致，其余781条参考索引保持。

首稿实拍发现粮堆露出平厚底面、尾鳍条越过叉口、山水画心太淡及讲台束腰缺失，已按实际画面修正；12张首稿与12张第二稿实际打开并留存。初次纸纤维参数被既有材质 schema 拒绝，补齐公开类型、schema和真实纹理算法；较密粮粒触发安装面查询的大数组参数上限，改为逐坐标求界并限制单材质顶点预算。失败日志和修订源码保留，不将未拍摄的失败尝试计作已查看预览。

## 使用

在同一版本编辑器选择「图册 → M006」，或加载 `projects/{loc['run']}-m006-gallery.ysvox.json`。每个 `exports/LIFE-*/visual.glb` 可独立使用；下载包解压后先读 `START-HERE.txt`。

```json
{{"op":"produceCatalogAsset","catalogId":"LIFE-107","id":"open-scroll","params":{{"refinement":"reference-v1"}}}}
```

默认 `baseline` 保留原配方。生产与浏览器验证脚本支持 M001–M006；重新生产使用隔离工作区及本批保存的 `previous-index.json`、`previous-latest.json` 原基线。

## 后续范围

当前是静态母版和作者图形，没有金融行情/交易、扫码签收、库存数量、药品名称或剂量、话筒音频、教学播放、翻页或收卷动画。参考图中的陈列货架、柜台、不同鱼种、粮食品种、重复书册和收卷样件不重复合入这些ID。

完整陈列、鱼鳞与鳍纹、植物次级叶脉、金属磨耗及更细水墨笔触仍可继续打磨；首轮技术与看图检查不自动记为最终效果图达标。下一批 **M007**。
'''
Path('docs/M006-REFERENCE-REFINEMENT.md').write_text(doc)
p=Path('README.md');s=p.read_text();old=next(line for line in s.splitlines()if line.startswith('**M005 的 12 件'))
new=f'**M006 的12件终端、食材与书画已交付首轮参考精修**：连续斜面、真实叶片与鱼尾、空心药瓶、书册与画卷，以及随GLB导出的屏幕/画心贴图；{v["regressionTests"]}项回归与39张逐图检查实拍。[本轮变化](docs/M006-REFERENCE-REFINEMENT.md) · [实际总览]({root}/M006-materials.png) · [GLB]({root}/exports) · [下载包]({root}/PACKAGE-DOWNLOAD.txt)。累计首轮6/67张、72件，接续M007；最终效果图验收另计。[M001](docs/M001-REFERENCE-REFINEMENT.md) · [M002](docs/M002-REFERENCE-REFINEMENT.md) · [M003](docs/M003-REFERENCE-REFINEMENT.md) · [M004](docs/M004-REFERENCE-REFINEMENT.md) · [M005](docs/M005-REFERENCE-REFINEMENT.md)。'
p.write_text(s.replace(old,new))
p=Path('projects/conversion-goal.json');g=json.load(open(p));g['lastCompletedBatch']={'sheets':['M006'],'subBatch':'reference-art-refinement-v1','run':loc['run'],'state':'validated-first-pass','wholeSheetFirstPassDelivered':True,'refinedReferences':12,'newReferences':0,'humanArtAccepted':False,'evidence':str(root)}
for key in ['refinementPhase','visualRefinementPhase']:g[key].update(firstPassSheets=6,lastDeliveredSheet='M006',nextSheet='M007')
g['visualRefinementPhase'].update(firstPassReferences=72,evidence=str(root/'visual-review.json'));g['nextBatch']='M007';g['activeBatch'].update(sheets=['M007'],state='queued',ids=[r['id']for r in json.load(open('projects/reference-atlas/index.json'))['entries']if r['sheet']=='M007']);assert g['activeBatch']['ids']
g['nextBatchNotes'][1]=f'M006首轮12件已交付：13原生、12新GLB、{v["newTexturePNGs"]}张图形PNG、12历史母版/GLB、39逐图检查实拍、{v["regressionTests"]}项回归；不增加参考或基础母版。';g['nextBatchNotes'][2]=g['nextBatchNotes'][2].replace('M006','M007');p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
p=Path('AGENTS.md');p.write_text(p.read_text()+'''
- M006首轮累计6/67张、72件，接续M007；090仅柜台屏，092/093/094是独立食材母版，106/107各一本书/一幅展开画卷。货架、柜台、颜色/品种和重复陈列不合入这些ID充数。
- M006显示图形与纸面印墨须保存独立用途的SurfaceArtwork，真实1024×768颜色/法线/ORM在WebGL和GLB使用同一算法。禁止借织物/大气或不受光通道；换青墨保留纸、深墨、几何与碰撞，撤销恢复。作者山水不是原图像素；纸纤维表面与paper类别保持独立概念。
- M006连续斜台、键盘托板、屏后机箱及讲台前束腰须实接；密粮堆查询安装面用逐坐标求界，遵守单材质顶点预算。叉尾鳍条须收在真实尾叶内；药瓶内壁/底壁与颈口查实际三角面，装盖后不声称整瓶顶部通透。草稿与最终实拍分别记录实际打开数。
''')
print('M006 docs and next M007 updated')
