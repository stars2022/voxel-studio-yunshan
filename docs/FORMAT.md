# 原生体素与引擎接口格式 v1

原生项目为 UTF-8 JSON，标识 `format: "yunshan.voxels"`、`formatVersion: 1`。不支持的版本明确拒绝，不静默迁移。单位固定 `metres`，Y 向上，右手坐标；空格的材质 ID 为 0，实体材质为 uint16 正整数。

## 坐标

每个母版有独立 `cellSize`（米）与 `origin: [x,y,z]`（米）。当前原生资产支持 0.005–1m 格距，小件可用 5mm；网格导入仍限制为 0.01–1m，建筑图鉴配方仍只接受其已验证的格距。不同格距可放在同一项目中独立编辑，但 `connect` 拒绝格距不同的接口；不会默默重采样。5mm 文件需要此版本或更高版本的读取器。格子 `[i,j,k]` 的局部空间最小角为：

```text
localMin = origin + [i,j,k] * cellSize
localMax = localMin + [cellSize,cellSize,cellSize]
worldPoint = rotationY(instance.rotation * π/2) * localPoint + instance.position
```

`instance.rotation` 是 0、1、2、3，右手绕 Y 正向。`parent` 记录安装关系，`position` 始终为世界米坐标，不是再次叠加的父级变换。安装点的 `position` 为相对于网格原点的米坐标，世界坐标为实例旋转 `origin + port.position` 后平移。

所有 `region`、`openings` 与查询区域都是**半开格坐标**：包含 `min`、不包含 `max`。所有接口、实例位置与净空检查区域都是**米**。字段不会混用这两种单位。

## 稀疏块

`asset.chunks` 为 `{ "cx,cy,cz": [index,materialId,index,materialId,...] }`。块边长为 16；只存非零材质，不存空块。块坐标用向负无穷取整，不是截断。

```text
cx = floor(i / 16)
lx = ((i % 16) + 16) % 16
index = lx + 16 * ly + 256 * lz
i = cx * 16 + index % 16
j = cy * 16 + floor(index / 16) % 16
k = cz * 16 + floor(index / 256)
```

运行时每个存在的块为 `Uint16Array(4096)`，空块不分配。在块边界修改时相邻块也标脏。显示层剔除隐藏面，在每块每个轴向平面上做按材质的贪心合面。面向透明材质的非透明面保留，同材质内部面去除。局部脏块计算完成后，显示缓存按资产/材质合并 BufferGeometry；实例共用它们。只改基础色、发光等属性不重新计算体素表面。

## 项目结构

- `assets`：唯一 ID → 母版。包含名称、版本、格距、原点、稀疏块、部件、开口、接口、可选参数模板与导入来源。
- `assets[*].category`：`base` 手工资产、`template` 参数化母版、`import` 导入体素结果。
- `parts`：`id/name/parent/region`；用于分组与规则选择，不另存第二份体素。允许部件区域重叠，例如墙体区域包含边框区域。禁止父级环。
- `ports`：`id/kind/position/normal/size/pitch`。法线为六向单位向量，截面尺寸以米表示。连接验证格距、节距、类型、相反法线与旋转后截面。
- `instances`：独立放置记录，引用 `assetId`。不复制体素。独立副本操作会显式新增一个母版。
- `assemblies`：组合模板，存一组实例定义并继续引用母版；实例化会生成新的放置 ID，不新增基础母版。
- `materials`：真实基础色、粗糙度、金属度、透明度、发光色/强度与 `solid` 碰撞参与标记。
- `styles`：结构角色 → 材质 ID，例如 `wall`、`wood`、`metal`、`roof`、`energy`。参数模板读取该表。
- `palettes`：共享材质属性的配色方案；不是新资产，也不复制网格。
- `selection`：当前共享母版、区域与部件；MCP 可以读取、修改。
- `version`：项目单调递增版本；撤销也递增。资产自身版本同样在修改后递增。

`autosave.ysvox.json` 在相同项目字段外包含 `session`，保存撤销/重做与幂等结果。游戏引擎可以忽略该字段。手工另存为和开放体素导出只包含项目数据。

## 导出物

| 文件 | 内容 |
| --- | --- |
| `visual.glb` | 合面的米制三角网格、PBR 材质、纹理图集、发光强度扩展，节点保持实例名称/位置/90° 旋转 |
| `voxels.ysvox.json` | 无损原生体素项目，能继续编辑；不是从 GLB 再体素化的结果 |
| `collision.json` | 每个母版的格距、原点和参与碰撞的整数格坐标，以及放置实例 |
| `interfaces.json` | 名称、版本、原点、格距、部件区域、开口、安装端口和放置关系 |
| `atlas.png` / `atlas.json` | 材质色板图集及像素矩形/中心 UV；每个色板 16×16 像素 |

碰撞格可直接按上述公式变成 AABB，再由引擎按轴合并；编辑器不声称它们已是优化过的凸碰撞体。GLB 的节点 `extras` 保留母版 ID、实例 ID、格距、原点、单位、接口；本版本新导出的材质 `extras` 保留 `voxelMaterialId`、`materialRoles`（例如 `yunshan.glass`）与 `materialCategory`。`interfaces.json.materialRoles` 保存完整风格映射；`atlas.json.materials[*].roles/category` 同样保留用途与类别。旧导出缺少这些新增字段时，以随附原生 JSON 的 `styles/materials` 为准。完整部件层级以原生 JSON 与接口文件为准，GLB 场景节点当前扁平导出。

GLB 使用 float32 顶点。体素化时对距离格线小于 `1e-5` 格的坐标作容差吸附，避免导出重导入在格线两侧凭空增厚。非格线上的输入仍按实际三角形相交处理。

## 限额

单母版 1,000,000 占用格；一次区域最多 2,000,000 候选格；最多 500 母版、3,000 实例；单事务最多 100 命令。导入限制 40MB 主文件、300,000 三角形、2,000,000 预算格和 50,000,000 候选测试；混合精度碰撞最多展开 3,000,000 格。超限明确报错，原文档不变。
# 可选表面细节字段

材质可附带 `surface`（`none/stone/wood/metal/ceramic/fabric`）、`surfaceScale`（0.02–10 米，默认 0.5）、`surfaceStrength`（0–1，默认 0.35）。省略时保持原有纯色着色。字段随原生项目无损保存，使用 src/core/surface.ts 的确定性算法生成表面贴图；GLB 烘焙同一算法的纹理并使用以米为基础的局部投影 UV。它们不改变体素、尺寸或碰撞数据。

可选 `surfaceSeed` 为 0–65535 的整数；省略或 0 使用旧版算法，非零使用带低频结构和微表面的确定性纹理。`surfaceRotation` 为 0/90/180/270 度，默认 0。纹理变换为 `u'=(cosθ·u+sinθ·v)/surfaceScale`、`v'=(-sinθ·u+cosθ·v)/surfaceScale`；编辑器与 GLB 使用同一变换，GLB 将其直接写入 UV。横梁与立柱可分别引用同色、不同纹理方向的材质，作为同一材质库的角色，不计入资产数量。

## 可选制作清单

`catalog` 为 formatVersion 1 的可选字段，不存在时兼容旧文档。包含 `sourceName`、`importedAt` 和以稳定 ID 为键的 `entries`，最多 5,000 项。每项保存 `id`、完整的 12 列 `source` 字符串、`stage`、`assetIds`、`note`，模型验收后保存 `reviewedVersions`（关联母版 ID → 当时版本）。来源状态始终保留原文；运行时根据当前母版版本计算有效审核状态。

清单是制作元数据，不是模型和放置实例。整项目原生保存/导出保留清单；仅导出单母版时省略全库清单，避免产生缺失的关联母版引用。GLB、碰撞和接口文件不包含排产记录。


## 材质用途与外观包

材质类别支持 `stone/wood/metal/ceramic/tile/glass/fabric/plant/water/emissive/sampled/plastic/paper/ink/rubber/food/wax/concrete/soil`。`plastic/paper/ink/rubber` 文件需要本版本或更新读取器。`sampled` 仅代表未识别物理类别的采样色。新配方禁止按近似颜色借用类别；详见 [材质分类约定](MATERIAL-ROLES.md)。

角色绑定由 `styles[styleId][role]` 解析，不能依靠新文档首选数字 ID 推断其他文档的用途。角色可查询，缺失材质引用会拒绝加载。风格编辑最多支持 256 个角色。外观包只保存外观字段，不能改变材质 ID、类别或 `solid`；旧配色包含的非外观字段在应用时忽略并返回警告。


材质类别补充：M011 新增 `wax` 表示蜡体，保存及导出不转换为塑料或发光材质。棉芯仍属 `fabric`，示意火焰属 `emissive`；食品糕体、奶油和糖饰属 `food`。新增类别沿用原生 v1 的材质记录结构；旧版严格枚举的读取器须更新类别表后读取，不能静默归成采样色。


M013 增加 `concrete`（混凝土/砂浆）和 `soil`（土层）类别。二者不改变 v1 JSON 的字段结构，读取器需同步更新严格枚举；不支持时必须明确拒绝，不能默默变成石材。已有存档的类别和数字 ID 不自动迁移。土层、防水膜、混凝土和砂浆的用途角色分别保存，后期资源包不能合并它们。


M014 的 `lanternPaper` 是独立 paper 用途角色（新文档首选 147），不新增类别或合并纸页、玻璃与灯芯。BUILT-057 在作者元数据 `source.stairWell` 中保存米制 `minM/maxM` 安装留空；此元数据不改变碰撞，`openings` 仍表示应保持空的格坐标检查体。40mm 的四件大型实体建筑组件通过实际格距限制与其他组件连接；导出不重采样。

M015 的 `lanternTassel` 为独立 fabric 用途角色（新文档首选148、非碰撞），不改变已有纸罩、布料或灯芯ID。`source.windowSocket` 使用米制 minM/maxM 描述安装区，独立于格坐标 openings；`source.floorCount/floorHeightM/instancePlan` 描述六层巨柱的作者尺寸与复用意图，不自动生成游戏楼层。BUILT-089 为0.10m，和0.02/0.04m接口不能直接connect。
