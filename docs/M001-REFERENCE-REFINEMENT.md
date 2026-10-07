# M001 · 家居细部首轮参考打磨

793 条参考的技术转化已齐全。本批从 M001 重新检查 12 件现有资产，重做主要形体、连续倒角、斜杆、圆弧和帘布贴图，并保存同机位前后实拍。**本批是首轮参考打磨交付，最终人工美术验收仍为 0。** 没有新增清单 ID，也没有把改版计作新基础母版。

[12 件实际总览](../artifacts/atlas/refinement-20261007114945/M001-materials.png) · [前后对照一](../artifacts/atlas/refinement-20261007114945/M001-comparison-01.png) · [前后对照二](../artifacts/atlas/refinement-20261007114945/M001-comparison-02.png) · [完整检查页](../artifacts/atlas/refinement-20261007114945/review.html) · [资源包](../artifacts/atlas/refinement-20261007114945/PACKAGE-DOWNLOAD.txt)

| 资产 | 本轮实际变化 |
| --- | --- |
| LIFE-008 衣物收纳隔层 | 调整搁板朝向，连续板材倒角、圆铜挂杆和斜向背拉撑；最小铜销保留原生块件。 |
| LIFE-009 梳妆镜架 | 石脚、台座角铁、镜面枢轴、细铜边、灯条及抽屉握杆分别成形。 |
| LIFE-019 输入设备托板 | 独立键帽与边框、右侧圆旋钮、连续线缆和接口；不虚构参考图无法读清的键位字符。 |
| LIFE-020 书桌灯 | 连续折臂、圆转轴、倾斜连接、木灯框、玻璃与暖光窗分层。 |
| LIFE-023 小圆凳 | 连续圆弧坐垫与正确顶面 UV，外撇腿、横撑和四脚抱件。 |
| LIFE-024 玄关鞋柜 | 两个有真实倾角与空腔的翻斗，铜握杆接上实际斜面，侧轴和角件独立。 |
| LIFE-025 墙面置物层板 | 木板倒角、深铁护栏及真实背部墙挂板。 |
| LIFE-026 窗帘挂轨 | 双轨、厚端帽、墙座及八组独立挂扣。 |
| LIFE-027 窗帘帘片 | 6mm 厚的闭合连续褶面、六吊耳、下缘受光 PBR 回纹贴图。 |
| LIFE-028 室内顶灯 | 天花固定盘、连续木框、浅色侧带、铜压边、分层灯窗；新增实际仰视预设用于检查。 |
| LIFE-029 壁灯灯体 | 深铁背板、木悬臂、灯框、玻璃与光芯分别成形。 |
| LIFE-030 电源／控制面板 | 五个实际贯通插孔（含斜孔）、两个摇杆及右侧分层显示面；按参考调整左右排列。 |

最小原生细件为 **5mm**，共 **22,525 格**；其余斜面、曲面和倒角保存独立连续网格。12 件显示网格共 **27,900 个三角形**，包括原生格生成的显示面。原生占用层不能代表全部连续显示面。383 个连续组件均闭合且有向，逐组件接触图与原生细件依附检查全部通过；这些检查不是机械承载或设备功能仿真。

## 材质与贴图

保持 512 个语义用途及项目实际 ID，不新增同色借用、不覆盖外来 ID。木、铜、钢、石、布、玻璃、屏幕底面、显示像素和光芯分别可换。碰撞设置从实际项目材质读取，外观修改不改变几何或碰撞。

帘布下缘回纹使用保存于原生文件的 `hui-border-v1` 描述，由浅色织物和主布用途生成 **1024×192** 颜色、法线、ORM 三张真实贴图，均嵌入 GLB 并单独导出。真实浏览器近照检查了主布换红、浅色地纹保持、撤销恢复；保存后原生几何与用途映射不变。它使用受光 PBR，未借用天空或水面的无光照通道。编辑器素色模式中仍保留此用途纹样，报告已明确记录。

## 验证与历史保留

- [生产检查](../artifacts/atlas/refinement-20261007114945/production.json)：12 件母版和 1 份总览原生读回、12 件新 GLB 的实际边界、75 个导出文件 SHA-256、闭合性、部件接触和安装接口。
- [历史检查](../artifacts/atlas/refinement-20261007114945/baseline-exports.json)：12 份历史原生逐字节保留，12 件实际历史 GLB 读回及 48 个旧导出文件哈希核对。
- [浏览器与 MCP](../artifacts/atlas/refinement-20261007114945/browser-verification.json)：12 件公开创建、12 件重建及撤销、无效参数回滚、外来材质 1800 保留、12 个图册入口、纹样换色与保存读回。实际加载前端 bundle 与已构建文件 SHA 一致。
- [逐图检查](../artifacts/atlas/refinement-20261007114945/visual-review.json)：39 张实际截图已逐张打开，包括 12 对材质前后图、12 张正面素色图及 3 张织纹近照。前后使用共同米制取景范围、相同用途外观与灯光；相机位置、目标、四元数及投影矩阵最大误差为 `2.665e-15`。原始历史外观另存，不将当前对照外观冒称旧版本原貌。
- [回归记录](../artifacts/atlas/refinement-20261007114945/history/regression-final.txt)：52 项通过；构建通过。覆盖默认旧配方、孔洞射线、圆面 UV、闭合与部件接触、实际 GLB 纹理/UV、换材质、公开重建/撤销及 GPU 纹理释放。

首版原生序列化负零差异、早期部分组件间隙、旧前端构建未显示织纹以及局部点光过曝的试拍与失败记录保留在 `history/`。最终版修正了镜框、斜面把手、灯窗承接和顶灯内部支承；重新生产、重跑测试、重建前端后拍摄全部 39 张最终图，没有把中断试拍计为最终通过。

## 打开与复现

启动相同提交的编辑器后，在「图册 → M001」打开新版；也可加载 `projects/refinement-20261007114945-m001-gallery.ysvox.json` 或各件原生文件。GLB 位于本批 `exports/LIFE-*/visual.glb`。资源包按仓库相对路径保存文件，解压后先读 `START-HERE.txt`。

公开配方和重建命令新增显式参数 `refinement: "reference-v1"`；默认 `baseline` 仍生成原有几何。示例命令：

```json
{"op":"produceCatalogAsset","catalogId":"LIFE-023","id":"stool-refined","params":{"refinement":"reference-v1"}}
```

```sh
npx tsx --test --test-concurrency=2 tests/reference-refinement.test.ts tests/material-roles.test.ts tests/atlas-material-correction.test.ts tests/atlas-face-variants.test.ts tests/render-materials.test.ts tests/mesh-plan.test.ts tests/production-library-counts.test.ts
npm run build
```

生产脚本会更新索引，且要求索引仍指向保存的旧母版。需要重做完整生产证据时，在隔离工作区使用本批 `previous-index.json` 与 `previous-latest.json` 恢复其生产前指针，再运行 `scripts/produce-reference-refinement.ts`；不能把已精修的索引当旧基线。浏览器脚本读取生产脚本写入的 `work/m001-refinement/production-location.json`，应在构建完成后单独串行运行。

## 后续差距

镜面目前使用 PBR 环境反射；完整衣柜外壳、门、衣物、鞋履、书盆和台面摆件按独立清单组件保留，后续需要组合呈现参考场景。壁灯回纹、灯窗层次、表面尺度和插孔在浅背景上的深度对比还可继续细化。灯具、抽屉、开关与帘轨均为静态资产，原游戏状态和动画未绑定。

技术转化仍为 793/793，首轮视觉打磨交付为 1/67 张；人工美术验收为 0。按用户要求接续 M002，继续保留各批真实对照、验证并推送现有远程分支。
