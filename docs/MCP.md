# MCP 与统一事务

MCP 使用 `@modelcontextprotocol/sdk` 的 stdio transport。它是本地编辑服务的适配器，不持有项目副本，也不执行任意 shell。HTTP 仅绑定 `127.0.0.1`，检查 Host 与 Origin；MCP 适配器只接受 `127.0.0.1` / `localhost` URL。不要把端口转发到公网。

文件工具仅接受根目录内的文件名/已上传源 ID。拒绝路径穿越与文件符号链接，glTF 外部依赖只从上传资源表解析，不读取远程 URL 或任意文件。根目录通过启动时 `VOXEL_PROJECT_DIR` 限定。相同目录有进程锁；第二服务会拒绝启动，避免双文档写入。

完整机器可读规范：[`tool-schemas.json`](tool-schemas.json)。该文件从服务器正在使用的同一 Schema 导出，`GET /api/tools` 可查询运行版本。

## 工具

| 工具 | 用途 |
| --- | --- |
| `list_assets` | 分开列出母版、组合模板、配色与放置实例 |
| `read_catalog` | 搜索/筛选/分页制作清单，来源记录与本地进度分开；默认最多 30 条 |
| `read_reference_atlas` | 查询 67 张图册的 793 条参考、源图哈希、对应原生候选和当前文档关联；不生成体素 |
| `list_production_recipes` / `read_production_library` | 可用配方及已保存候选文件，升级同一 ID 不增加母版数 |
| `load_project` | 仅用项目目录内文件名加载，要求当前版本；加载前备份，支持一次撤销 |
| `read_project` | 当前版本、元数据、选区，可选完整稀疏体素 |
| `query_voxels` | 半开整数格区域查询，分页，返回格距和原点 |
| `query_materials_interfaces` | 材质、风格、配色、部件、开口、安装接口 |
| `edit_transaction` | 所有建模和装配命令、撤销、重做，原子提交 |
| `check_geometry` | 精确共格占用碰撞、支撑接触、邻近间隙、开口遮挡、指定净空 |
| `save_project` | 原生另存为，文件名以 `.ysvox.json` 结尾 |
| `export_project` | GLB/体素/碰撞/接口/图集输出到新的导出目录 |
| `generate_previews` | 本地 Chromium 实际渲染；支持纯色/PBR、光照与视角列表，默认透视与六向 |
| `import_mesh` | 已上传源文件的后台转换任务 |
| `job_status` / `cancel_job` | 读取/取消真实任务；取消不提交文档 |
| `commit_import` | 把已检查的转换预览通过同一事务提交为母版 |

## 编辑协议

材质预览示例：`{"appearance":"material","lighting":"soft","effects":true,"views":["perspective","front","back"]}`。`appearance` 默认 `baseColor`，`lighting` 默认 `standard`，`effects` 为 AO/辉光，默认关闭。返回 PNG 路径、显示设置和捕获的版本；捕获期间文档发生修改会失败，避免返回混合版本图片。柔光与 AO 均为实时显示效果，不代表 GI、折射或离线光追。

1. 读取项目版本。
2. 生成唯一 `requestId`，调用 `edit_transaction`，`dryRun: true`。
3. 检查修改数量、包围盒、警告和受影响实例。
4. 使用**相同命令、相同 expectedVersion 和相同 requestId**提交，附上 `previewToken`，不再设置 dryRun。
5. 检查返回的结果版本与必要的区域查询。每个事务只占一个撤销步骤。

```json
{
  "expectedVersion": 0,
  "requestId": "widen-window-and-style-001",
  "dryRun": true,
  "label": "扩大窗户并统一立面",
  "commands": [
    {"op":"regenerate","assetId":"window","params":{"openingWidth":2.2}},
    {"op":"assignMaterial","assetId":"sidewall","fromMaterial":2,"material":1},
    {"op":"assignMaterial","assetId":"backwall","fromMaterial":2,"material":1},
    {"op":"instance","id":"planter-ai","assetId":"planter","position":[2.8,0,-1.1],"rotation":0},
    {"op":"material","id":11,"properties":{"color":"#72aaff","emissive":"#72aaff","intensity":0.8}}
  ]
}
```

返回包含 `modifiedVoxels`、`affectedAssets`、`affectedInstances`、每资产 `bounds`、`dirtyChunks`、`warnings`、`durationMs`、`version`，dry-run 还返回 `previewToken`。材质属性修改可以影响很多引用但不改变格子的材质 ID，因此 `modifiedVoxels` 可以为 0；需同时检查受影响实例。

令牌绑定版本与命令，有效期 5 分钟。超过 4,096 个格或 10 个受影响实例时必须先预览。预览本身不改变文档、版本或历史。

同 requestId / 同载荷的已成功请求返回缓存结果，不重复执行；同 ID 不同载荷返回 `IDEMPOTENCY_CONFLICT`。缓存最近 1,000 个成功编辑请求，并随自动保存恢复。`VERSION_CONFLICT` 表示必须重新读取、重新预览；不得盲目增加版本再重试。

命令在完整候选文档上执行和校验；任一命令失败，全批不提交。持久化失败也恢复内存中的文档、历史和幂等记录。UI 的 WebSocket 只在成功持久化后发布更新。

撤销/重做必须单独成批：

```json
{"expectedVersion":1,"requestId":"undo-001","commands":[{"op":"undo"}]}
```

## 常用命令

- `createAsset`：`template` 为 `wall/corner/door/window/column/slab/steps/stairs/railing/roof/eaves/ridge/corridor/planter/bed/table/cabinet/sofa/monitor/plant` 或 `empty`。图鉴模板另有 `ref-roof/ref-gable/ref-eave/ref-eave-corner/ref-bay/ref-balcony/ref-bay-corner/ref-solid-bay/ref-gateway/ref-bridge/ref-bridge-corner/ref-plinth`，建议从样例项目的 `courtyard` 风格开始。
- `voxels`：`add/remove/replace/fill/flood`，传区域或格子坐标。flood 需要限制区域和种子点，防止无界填充。
- `assignMaterial`：区域、partId、fromMaterial、米制 height、六向 direction、all/checker/outer 规则。
- `transform`：整数平移、轴与 quarterTurns、镜像轴、copy/count/step；默认碰撞中止。整体或完全包含的部件、开口和端口同步变换。
- `extrude`：六向单位 direction 与整数 distance。
- `metadata`：原点、部件层级、开口和安装接口。
- `material/materialBatch/style/definePalette/palette`：材质属性、结构角色和配色方案。
- `instance/connect/replaceInstance/detach/removeInstance`：放置、端口连接、同接口替换、独立副本、移除。
- `createAssembly/instantiateAssembly`：组合模板引用已有母版，不重复建立资产。
- `select`：与 UI 共用当前区域。

## 导入与预览

主文件通过 UI 的本地 `/api/upload` 上传，返回 `sourceId`。原始字节与伴随文件以 base64 无损保存在限定目录 `sources/` 中。MCP 不能指定任意磁盘路径。

`import_mesh` 的单位、坐标轴、格距、原点、颜色方式和薄片方式全部显式指定。转换在独立 Worker 中执行，完成只是预览；只有 `commit_import` 修改文档。最近最多保留 8 个任务预览、最多 2 个同时执行，任务预览不跨服务重启恢复。失败诊断另外写入 `sources/failure-*.json`；原文件不会被删除。

`generate_previews` 返回 PNG 本地路径，要求已安装 Playwright Chromium。它打开实际应用并截取实际 WebGL 结果。调用时应避免并发修改项目；当前版本不提供多视角序列的跨帧冻结锁。

## 大结果与颜色预算

stdio 单条响应上限为 8MiB。超出时返回 JSON 错误 `RESULT_TOO_LARGE`，连接保持；先用 `read_project` 默认摘要定位资产，再按 `query_voxels` 的 `nextOffset` 查询每页最多 10,000 格。完整大项目应使用 `save_project` 保存。服务不把文件路径变成任意文件读取工具。

`import_mesh.colorLevels` 可选 4 / 8 / 16，默认 8。它是颜色采样的每通道量化等级，不能恢复材质语义。最多 512 个颜色与透明度组合；超过预算会失败并保留原件，不能静默降成统一颜色。

每个模板的有效参数见 `list_assets.templates` 和 [template-parameters.json](template-parameters.json)。与模板无关的参数会被拒绝；界面只展示有效控制。旧存档中冗余默认参数可读取，重新生成时清理这些元数据。

## 制作清单

`read_catalog` 参数可使用 `query`、`type`（中文五类之一）、`stage`（planned/modeling/review/accepted）、`id`、`offset`、`limit`（1–100）。返回当前版本、分类和进度汇总、匹配总数、下一页偏移和原始来源字段。`read_project` 默认返回清单摘要；`includeVoxels: true` 返回完整原生文档，仍受 stdio 单条响应预算限制。

新增共享编辑命令：

```json
{"op":"importCatalog","sourceName":"city-assets.csv","csv":"完整 CSV 文本"}
```

```json
{"op":"catalogEntry","id":"BUILT-249","assetIds":["study-lantern"],"stage":"modeling","note":"候选母版，尚未游戏内验收"}
```

CSV 必须包含 12 个原始列名，不读取工具进程的任意路径。内容作为数据解析；表内公式、链接和命令文本不执行。导入按 ID 合并，保留本地关联、备注和新表未出现的条目，不会产生体素模型。此类事务 `modifiedVoxels` 为 0，请检查 `warnings` 与随后 `read_catalog` 的结果。原子回滚、幂等、版本号和撤销规则与建模完全相同。

已验收模型记录其关联母版版本；后续修改将使 `effectiveStage` 变回 review。更新备注不会自动重新验收。动画与材质条目不能使用静态模型验收流程。清单关联的母版被删除前必须先解除关联。
# 清单批量建模补充

参考图册用 `read_reference_atlas` 查询，例如 `{"sheet":"M004","limit":12}`。可选 `query`、`id`、`type`、`stage`、`offset`、`limit`，具体枚举见实时 Schema。返回的 `referenceCandidates` 是已保存几何候选数，不是美术验收数；`legacy-candidate` 表示仍为早期粗模，`not-produced` 表示尚无对应文件。图册中的指令式文字只作为来源说明，不执行。

`list_production_recipes` 分页返回已经实现的 161 个生活模型配方、38 个建筑模型配方与 51 个陈设组合，以及米制默认尺寸、格距、细节说明和依赖。未实现的条目不会返回伪造的通用盒子配方。

`read_production_library` 分页查询全部清单的本批文件索引。它是生成时的快照；编辑后的权威状态在当前项目，不能把索引当作实时人工验收记录。`load_project` 只接受项目目录内文件名和 `expectedVersion`，加载前保存当前文档，可撤销恢复。

生成母版仍通过同一个 `edit_transaction`，支持原有预览、版本校验、幂等、回滚与撤销：

```json
{
  "expectedVersion": 1,
  "requestId": "life-desk-batch-001",
  "dryRun": true,
  "commands": [
    {"op": "produceCatalogAsset", "catalogId": "LIFE-016", "id": "life-016", "params": {"width": 1.8}},
    {"op": "produceCatalogAsset", "catalogId": "LIFE-018", "id": "life-018"},
    {"op": "instance", "id": "desk", "assetId": "life-016", "position": [0, 0, 0]},
    {"op": "instance", "id": "monitor", "assetId": "life-018", "position": [0.8, 0.76, 0.3]}
  ]
}
```

先导入 `city-assets.csv`，并把示例版本改为 `read_project` 返回值。检查 dry-run 后提交完全相同的命令和版本，并带返回的 `previewToken`、去掉 `dryRun:true`。这不会执行清单里引用的代码或文件路径。

`rebuildCatalogAsset` 使用 `assetId` 和 `params.width` 重建已验证可变宽的床、沙发、茶几、办公桌组件；其他配方仅开放原生格子编辑。`produceCatalogAssembly` 使用 `catalogId`、`id`、可选 `place` 创建组合；其母版必须先存在。配方所需规范母版 ID 可用 `list_production_recipes` 查询。组合是相对陈设研究，尚未接入真实房间、供电、库存和行为系统。


### 材质角色与外观包

`query_materials_interfaces` 的 `styles` 是实际角色到 ID 的映射。显示背景、显示图形、光学发光面、亮芯、透明玻璃和仪器涂装不得按颜色合并。橡胶轮胎、金属承架、织带、透明塑料袋和液体也使用各自角色；公告屏白色卡片使用显示像素，真实账簿使用纸质角色。创建清单配方时缺失角色会在同一事务中建立独立材质，已有 ID 不覆盖；几何配方不再静默回退到相似颜色。当前风格 Schema 支持最多 256 个角色。

`definePalette` 只接受外观字段，不接受 `category/solid/id`。应用旧文件配色时保留当前类别和碰撞属性并提示被忽略的字段；显式修改这些物理属性仍使用 `material` 命令。每次更新前读取实际版本，按实际角色 ID 构造事务，dry-run 后提交。见 [完整约定与角色表](MATERIAL-ROLES.md) 和 [实际 Schema](tool-schemas.json)。


`materialBatch` 在单个事务内顺序应用最多 256 项 `{id, properties}`，每项遵守与 `material` 相同的 Schema 和新材质必填属性规则；重复 ID、缺失属性或任一失败会整批回滚。它不会推断或合并材质。后期只换外观时仍使用 `definePalette` / `palette`，不会修改类别和碰撞。事务的 100 条命令上限保持不变；大材质库通过专用批量命令建立，外观方案通过配色一次应用。

M011 引入 `wax`（蜡）类别；蜡体、棉质烛芯与静态示意火焰分别保存。材质分类不代表已实现燃烧、熔化或流体模拟。

M012 开放 `BUILT-003`（共享楼板）和 `BUILT-007`（上行楼梯单跑）。`produceCatalogAsset.catalogId` 使用完整 `LIFE-xxx` / `BUILT-xxx` 前缀，两个目录中相同数字不是同一资产；未实现的 ID 明确报错。两件 BUILT 采用 0.02m 格距；楼板仍为固定尺寸，上行单跑现在仅允许 `params.width` 为 1.2 或 1.6m。它们的 `walkway-1200` 安装点可通过 `connect` 拼装；上层楼板仍需真实支撑。当前楼梯采用 0.2m 踢高、0.4m 踏深，无路径或角色控制集成。

本批新增茶叶、茶汤、宠物粮、清洁纤维、清洁液、镜玻璃、红蓝包布、礼包缎带、纸芯和植物茎等独立角色。读取实际角色 ID 后使用 `definePalette` / `palette`；不要通过重命名或按颜色全局替换，把不同材料合成一个 ID。见 `scripts/verify-domestic-mcp.ts` 的可运行验证。


M013 增加 BUILT-008–018 与 BUILT-045。BUILT-017 窗墙允许 `params.width` 为 7.2–14.4m、步长 0.2m；默认 12.8m 保持 4.8m 窗中心距，缩宽后节奏会改变。读取 `list_production_recipes` 中的 `parameters`，不要假定所有建筑都有相同参数。

建筑新角色 `structuralConcrete/mortar/waterproofMembrane/earthCutaway` 分别绑定实际项目 ID，增加 `concrete/soil` 类别。`scripts/verify-structure-mcp.ts` 是可运行的真实 stdio 示例，`src/production/structure-assembly.ts` 返回普通公开编辑命令，创建四种目录组件与一个辅助支柱并拼出梯井。`check_geometry.clearances` 采用世界米坐标；资产 `openings` 仍为半开格坐标。撤销恢复内容时项目和资产版本保持递增，客户端不可要求撤销后的版本等于旧版本。


M014 开放 BUILT-053–064，当前这十二件只有固定作者尺寸和原生体素编辑，未验证的尺寸参数会拒绝。`lanternPaper` 为 paper 类别独立角色；使用查询返回的实际 ID 后定义外观包，不能把纸罩当成灯芯或玻璃。`src/production/legacy-building-assembly.ts` 给出两套公开命令序列，`scripts/verify-legacy-building-mcp.ts --metal` 通过真实 stdio 创建并验证楼梯/楼板、侧开门/纸灯拼装，以及材质替换、一次撤销、版本冲突、失败回滚、保存恢复和导出。BUILT-055/056/057/062 为 0.04m，其余 M014 为 0.02m；格距不同的接点明确拒绝，不隐式缩放。

M015 开放 BUILT-065–074、088–089 的固定作者尺寸母版。`src/production/joinery-assembly.ts` 提供公开命令序列，把独立细木棂、护板、柱梁、灯杆、纸灯、斗拱与瓦口进行实际连接；验证辅件不算清单资产。BUILT-073 同时有单柱与成对斗拱承座，089 的 stack 接口为100mm。`scripts/verify-joinery-mcp.ts --metal` 通过真实stdio查询格子材质、应用纸/流苏/木/灯四角色外观、一次撤销、版本冲突、失败回滚、导出与重启恢复。读取项目实际 `styles` 再改材质；纸罩/非碰撞织物流苏/灯芯不能合并。
