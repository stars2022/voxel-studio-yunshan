# 三张参考图的材质试作

2026-10-03，北京时间。本轮处理已存在的 28 件建筑与 12 件家居设计，没有新增模型，也没有将材质变体计为清单完成项。当前结果有材质区分，但**尚未达到参考图的整体美术标准**。

## 查看与修改

运行 `npm run build`、`npm start`，打开 `http://127.0.0.1:4317/?library=1&material=1&look=reference&ao=1&bloom=1&view=perspective`。

在「批量库 → 参考图鉴 · 几何与材质」选择「材质」组的总览或单件。打开材质版时自动启用材质预览；「纯色」按钮仍可检查实际轮廓。右侧材质库中可编辑基础色、粗糙度、金属度、不透明度、发光、表面纹理周期/强度/种子/方向。配色方案包含「原始素色」和「参考材质试作」，切换使用事务预览，支持撤销。保存配色现在也保存表面纹理参数。

实际截图：

- [六件同光照、同机位处理前后](../artifacts/material-study/pilot.png)
- [建筑主体 12 件](../artifacts/material-study/建筑主体.png)
- [立面细部 16 件](../artifacts/material-study/立面细部.png)
- [家居 12 件](../artifacts/material-study/家居.png)
- [编辑器界面](../artifacts/material-study/material-library-ui.png)

这些是 WebGL 实际渲染截图及其排版，没有生成式重绘、修图补细节或离线渲染。前后对照使用相同柔光、AO 与辉光设置，差别来自保存的材质属性。玻璃由不透明改为透明会改变可见表面，但体素占用不变。

## 处理内容

共享的 21 个材质角色包括青灰基座石、暖灰石灰岩、烟熏榆木、石墨金属、哑釉屋瓦、浅青玻璃、陶瓷、亚麻、深浅叶色、土壤、黄铜、青色与暖色灯芯等。角色来自模型原先的材质 ID，没有从图片猜测颜色后冒充材质识别。

石材、木材、织物、陶瓦和金属使用带固定种子的程序化颜色/法线/粗糙度贴图。纹理周期使用米制局部坐标；原生文件保存参数，GLB 内嵌同一算法生成的 PNG 贴图，UV 使用同一尺度及旋转。21 个角色定义见 `src/production/reference-finish.ts`。

「柔光」使用环境反射、主光和填充光，加 VSM 阴影滤波，并降低 SSAO 半径与混合强度，减少之前的宽黑边。透明物体不作为不透明 VSM 遮挡物。该设置属于查看方式，不改变资产数据，也不作为模型烘焙进 GLB。

## 与参考图的差距

| 部分 | 本轮已有 | 仍需处理 |
| --- | --- | --- |
| 石材 | 细微色差、微面和粗糙度 | 独立石块的边角磨损、结构缝层次、较大尺度的不规则色差 |
| 木材 | 可导出的定向木纹、粗糙度 | 部分横梁与立柱仍共用木材 ID，需要逐构件分配纹理方向；缺少端纹与构件接缝精修 |
| 金属 | 金属度、环境反射与黄铜色 | 边缘倒角/压条厚度不足，不能单靠反射参数补出参考图的轮廓高光 |
| 织物 | 织纹和亚麻色系、包边材质 | 坐垫过于平直，缺少弧度、厚薄变化与褶皱几何 |
| 植物 | 两档叶色、哑光叶面和栽培土 | 枝叶过于规则，密度和生长层次不足 |
| 玻璃/灯具 | 透明混合、真实材质发光与屏幕辉光 | 无折射、GI 或准确的有色透射阴影；门窗后的完整内景也未补建 |

因此这一轮能验证材质链路、改善材质区分，不能作为参考图等级的美术验收。模板轮廓、倒角、软垫和植物仍要在真实体素几何里继续处理。原始纯色几何保留，方便分开评审。

## 文件与复现

索引为 `projects/material-index.json`，批次为 `finish-20261002162906`。43 份原生项目包含 40 件设计与 3 个总览；文件名见索引。原始建筑、家居文件未改写。新文件内的体素、材质 ID、部件、接口、实例与原件逐项哈希比对一致。

`artifacts/material-study/exports/finish-*/` 每个目录包含：

- `visual.glb`：视觉网格，含 PBR 与纹理。
- `voxels.ysvox.json`：可无损继续编辑的体素项目。
- `collision.json`、`interfaces.json`：碰撞格与组件接口。
- `atlas.png`、`atlas.json`：基础色图集及映射。程序表面贴图嵌入 GLB；色板图集自身不是全部表面纹理。

```sh
npm run produce:materials
npm run build
npm run preview:materials
npm run preview:materials -- --full
npm run export:materials
npm run verify:materials
npm test
```

重新制作生成新批次文件、更新材质索引，不覆盖旧批次；截图/验证脚本使用单独的运行目录和回环端口 4343、4344，不修改正在编辑的项目。源码位于 `src/production/reference-finish.ts`、`src/client/viewer.ts` 和 `scripts/*reference-materials.ts`。

## 实测范围

环境：Apple M3 Pro、18 GiB、Darwin 27.2.0、Node 24.19.0、Chromium 153.0.8010.12。自动截图使用 **SwiftShader 软件 WebGL**；下列耗时不是游戏帧率或真实 GPU 性能承诺。

- 43 份原生/导出文件逐项验证完成；40 件单体 GLB 经真实导入器重读，包围盒最大误差 `1.049 × 10⁻⁷ m`。3 个总览验证了原生数据与材质贴图，但未另作导入器包围盒测试。
- 43 份导出及检查总耗时 **72.40 秒**，视觉 GLB 合计 **44,859,996 字节**。结果见 `artifacts/material-study/export-verification.json`。
- 官方 stdio MCP 客户端整批赋材质并等待界面同步耗时 **1,166.97 ms**，改动体素数 **0**。dry-run、版本冲突、幂等、异常批次回滚、单次撤销/重做、配色切换、保存与进程重启恢复均通过。结果见 `artifacts/material-study/mcp-verification.json`。
- 新增 `generate_previews` 的材质/纯色、光照与视角参数，实际调用生成了透视与正面材质 PNG。文档变化时拒绝返回混合版本预览。
- 全套 **78/78** 测试通过，日志：`artifacts/material-study/full-tests.log`。构建日志：`artifacts/material-study/build.log`。前端构建仍有单 bundle 大于 500 kB 的体积提示。

目前没有对照评审通过数，也没有宣称与 AI 参考图逐像素或物理一致。
