# M002 · 厨房与生活器物参考精修

本批按 M002 参考图精修 12 件现有资产，交付独立原生文件、GLB、真实织物贴图和同机位前后实拍。累计首轮打磨 **2/67 张、24 件参考**；793 条参考的技术转化总数不变，最终人工美术验收仍为 0。

[12 件实际总览](../artifacts/atlas/refinement-20261008061121/M002-materials.png) · [完整前后检查页](../artifacts/atlas/refinement-20261008061121/review.html) · [GLB 目录](../artifacts/atlas/refinement-20261008061121/exports) · [完整资源包](../artifacts/atlas/refinement-20261008061121/PACKAGE-DOWNLOAD.txt)

| 资产 | 本轮变化 |
| --- | --- |
| LIFE-031 起居地毯 | 连续低厚度毯面、双线四角回纹、短穗；织物颜色、法线和 ORM 为真实导出贴图。 |
| LIFE-032 通用工作桌 | 木攒边与浅石嵌芯、独立浅屉、连续斜撑、工具挂轨及实际安装的控制模块。 |
| LIFE-037 厨房操作柜体 | 实体框边、内凹门芯与浅浮纹、独立抽屉和开放层架，保留背部管线孔。 |
| LIFE-038 厨房台面 | 两个真实贯通孔、石面与木金属收边、挡水条、可见的四角金属包件。 |
| LIFE-039 灶具及烟罩 | 双灶圈、径向锅架、独立旋钮、扁平箱式倒角烟罩、进气格与贯通烟道。 |
| LIFE-040 水槽及龙头 | 连续内收厚盆壁、翻边、真实排水法兰、开放水嘴、独立阀柄与安装承耳。 |
| LIFE-041 厨房吊柜 | 两扇实门和两扇玻璃门、内层板、独立框边与五金、实际墙装挂梁。 |
| LIFE-042 食品储物柜 | 开放层架、成对长门、浅浮纹和铜拉手；不把储藏物品焊入柜体母版。 |
| LIFE-043 冷藏柜外壳 | 双门、独立橡胶封圈、内部层板、长拉手、分层静态显示和散热叶。 |
| LIFE-044 炊具锅体 | 48 段连续厚壁锅腔、卷口、锅底圈足与镂空木耳柄。 |
| LIFE-045 锅盖 | 有真实厚度的灰蓝玻璃弧面、金属沿、黄铜压圈和桥式提把。 |
| LIFE-046 碗盘容器 | 单件连续陶碗、真实内腔、卷口圈足、独立青釉边线及回纹嵌层。 |

最小原生块件为 **5mm，共 6,300 格**；其余表面为独立连续网格。显示网格合计 **31,160 个三角形**，463 个连续组件闭合且有向。11 件各自连通；LIFE-039 按用途保留灶具与墙装烟罩两个独立安装组。原生细件均依附实际几何；这些检查不等于机械承载或设备功能仿真。

## 材质和实际贴图

保持 512 个语义用途和项目实际材质 ID；木、石、涂装金属、钢、铜、橡胶、玻璃、陶瓷、布料及显示像素可分别替换。碰撞标志读取实际项目材质，外观换色不修改几何。M002 玻璃采用较清楚的灰蓝色外观；M001 的默认外观和全部已发布几何哈希保持不变。

地毯的 `hui-rug-v1` 描述使用主布和浅色织纹两个真实用途，生成 **1024×768** 颜色、法线、ORM 三图，内嵌 GLB 并分别导出。四角回纹对称，实际浏览器检查了纹样换色与撤销。所有毯面三角形的 UV 都保留两个有效轴；薄侧面没有折叠成一条纹理线。

## 验证与历史

- [生产记录](../artifacts/atlas/refinement-20261008061121/production.json)：12 份母版与 1 份总览原生，12 件实际 GLB 读回，75 个导出文件哈希核对，几何边界、闭合性、细件依附与逐组件连接图。
- [历史保留](../artifacts/atlas/refinement-20261008061121/baseline-exports.json)：12 份历史原生逐字节保留，12 件旧 GLB 实际读回，48 个旧导出文件哈希核对。
- [公开接口和实拍](../artifacts/atlas/refinement-20261008061121/browser-verification.json)：12 件创建、12 件重建及撤销、外来材质 ID 保留、无效参数回滚、12 个图册入口、材质换色与保存读回。39 张真实截图，12 对实际相机参数比较；最大差异 3.11e-15。实际加载前端 bundle 与构建文件 SHA 一致。
- [逐图检查](../artifacts/atlas/refinement-20261008061121/visual-review.json)：材料、素色、织物近照全部保留；最终图片逐项直接打开，或与已经打开的先前图片核实为逐字节相同，复核方式逐图记录。前后使用共同米制取景范围、相同用途材质与照明，历史原貌另存。
- [验证汇总](../artifacts/atlas/refinement-20261008061121/validation.json)：60 项不同回归检查通过。基础回归 58 项与后续实际表面用途、UV 回归合并计数；重复执行不重复计数。构建通过，最终源代码快照与实拍一致。

早期悬空细件、部件间隙、曲面接缝、抽屉朝向与 UV 修正记录保留于 `history/`。首次后处理试拍曾发白，按顺序复测各效果及组合后未能稳定复现；未把猜测的渲染器改动混入交付。最终对照统一采用已有直接 PBR 与摄影棚参考照明，关闭 AO、辉光和局部点光，两版设置相同。

## 打开和复现

在相同提交的编辑器中打开「图册 → M002」，或加载 `projects/refinement-20261008061121-m002-gallery.ysvox.json`。每件 `exports/LIFE-*/visual.glb` 都是独立交付。资源包解压后先读 `START-HERE.txt`。

```json
{"op":"produceCatalogAsset","catalogId":"LIFE-040","id":"sink-refined","params":{"refinement":"reference-v1"}}
```

默认 `baseline` 保留历史配方。公开重建同样接受 `refinement`。生产脚本支持 M001 / M002 参数；重做生产须在隔离工作区使用该批 `previous-index.json` 和 `previous-latest.json`，不能把已更新的精修索引当旧基线。

```sh
node --import tsx --test --test-concurrency=1 tests/kitchen-refinement.test.ts tests/reference-refinement.test.ts tests/material-roles.test.ts tests/atlas-material-correction.test.ts tests/atlas-face-variants.test.ts tests/render-materials.test.ts tests/mesh-plan.test.ts tests/production-library-counts.test.ts
npm run build
node --import tsx scripts/produce-reference-refinement.ts M002
node --import tsx scripts/verify-reference-refinement-browser.ts M002
```

## 后续范围

柜体、台面、灶具、水槽、锅盖和储藏物品仍是独立清单组件。台面双孔是当前尺寸下的作者布局，未宣称能同时安装保持独立尺寸的 LIFE-039 和 LIFE-040；完整厨房组合需另核尺寸和安装净空。冷藏、火焰、流水、门屉运动及原游戏状态均未绑定。后续继续细化表面使用痕迹与完整陈设，按顺序接续 **M003**；最终效果图质量验收独立记录。
