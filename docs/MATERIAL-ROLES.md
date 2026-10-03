# 按材质与用途分类，而不是按颜色借用

这是用户要求的持续制作约定，见项目根目录 `AGENTS.md`。体素存储材质 ID；`styles.yunshan` 保存用途角色到 ID 的映射；`materials` 保存物理类别与可替换外观。即使两个角色目前颜色相同，也不能因此合并。

## 本批落实范围

M007 的 12 件科研、医疗和课堂候选已修正可见的跨类别借用：仪器白色机壳使用涂装金属，硬瓶盖和键帽使用塑料，显示图表使用显示图形，红色呼叫按钮独立于水果，量杯刻度使用印刷标记，纸页独立于织物。显微镜实际格子中分开了以下层：

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `glass` | 6 | 光学前玻璃、载玻片 / glass |
| `screen` | 14 | 深色显示底面，保留独立发光参数 / metal |
| `displayGlyph` | 57 | 屏幕文字示意、图表和状态图形 / emissive |
| `opticsGlow` | 53 | 青色光学发光面 / emissive |
| `lightCore` | 54 | 高亮光芯 / emissive |
| `enamel` | 55 | 浅色涂装仪器外壳 / metal |
| `metal` / `trim` | 4 / 43 | 承力金属与压条套箍 / metal |
| `bronze` | 41 | 黄铜连接件、旋钮环 / metal |
| `signalRed` / `polymer` | 56 / 58 | 控制键与浅灰硬塑料 / plastic |
| `ceramicWhite` | 59 | 白釉陶瓷 / ceramic |
| `printedMark` | 60 | 刻度、印刷标记 / ink |
| `paperSheet` | 61 | 纸页 / paper |

M008 的 12 件医疗与公共事务候选按同一规则制作，新增以下独立角色，并检查了实际占用格：

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `rubber` | 62 | 脚轮轮胎、密封条、软握把 / rubber |
| `safetyFabric` | 63 | 橙色担架软垫与缝边 / fabric |
| `webbing` | 64 | 深色固定织带 / fabric |
| `flexibleClear` | 65 | 输液袋壁、软管、滴管 / plastic |
| `fluidBlue` / `fluidAmber` | 66 / 67 | 两种静态示意液体 / water，非碰撞 |
| `bookCover` / `archiveBoard` | 68 / 69 | 纸质封皮与档案纸板 / paper |
| `displayWhite` | 70 | 公告屏白色卡片、核验图形 / emissive |
| `printedDark` | 71 | 实体纸上的印字、箱面刻印 / ink |

同为深色，担架的金属承架、橡胶轮胎和固定织带保持三个独立 ID。取证盒的浅色外壳使用 `enamel`，不使用石材。洗台的石芯台面、陶瓷盆、塑料分液盒和涂装柜壳也分别赋值。公告屏白色“纸张”是显示图形；真实账簿则有纸页、封皮和印字。显示画面没有真实业务数据；液体颜色不表征药品种类。

M009 的信息台、旗座、柜体、座椅、双层床和摄像器继续按实际材料制作，新增：

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `bannerCloth` | 72 | 灰蓝仪仗旗布 / fabric |
| `bannerPattern` | 73 | 旗面织入纹样 / fabric，浅金色也不是黄铜 |
| `cottonWhite` | 74 | 床品、枕头、折叠棉毯和白毛巾 / fabric |
| `printedRed` | 75 | 急救盒红色印刷标记 / ink，不借用水果或控制键 |
| `rigidClear` | 76 | 硬塑料瓶壁、透明护片 / plastic，独立于柔性袋壁和不透明键帽 |

瓶盖、瓶壁、液体、纸标签和印字分别赋值。摄像器的浅色壳体为涂装金属，雨罩为金属，线缆为橡胶；镜头玻璃、光学发光面和亮芯单独保留。旗布与纹样可以各自换色，棉枕不跟着旗布改色。材质类别由配方明确指定，不是从 AI 图片自动推断出的检测结论。

数字 ID 是新文档默认值，不能假定每个用户文档相同。创建配方时 `ensureProductionRoles` 保留已有材质和角色；若首选 ID 已被占用，分配空闲 ID，并在同一事务中记录绑定。直接调用缺少角色的几何配方会报错，不回退到近似颜色。此变更未自动重分配用户旧文件的格子；重新制作的图册候选使用带时间戳的新文件。

M001–M006 的 72 件现已逐件复核并修正实际赋值，其中 54 件发生材质 ID 变化，18 件无需修改。逐件选择和限制写在 `src/production/atlas-material-review.ts`，保存的母版携带 `source.materialAssignmentReview`。生成时对实际格子执行必要角色、禁止角色和部分纯材质器具的类别边界检查。旧原生文件保留，不会在打开时悄悄迁移。

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `ceramicTeal` | 77 | 碗、杯、壶上的青釉 / ceramic |
| `polymerDark` | 78 | 深色键帽、塑料封条、塑料盖槽 / plastic |
| `metalBright` | 79 | 钢刃、承盘、耐磨台、锅沿 / metal |
| `wovenLight` | 80 | 帘、毯、巾的米白织入纹样与织边 / fabric |
| `glassEtch` | 81 | 玻璃蚀刻纹样 / glass |
| `rope` | 82 | 捕鱼绳网 / fabric，独立于固定织带 |
| `oreVein` / `oreMatrix` | 83 / 84 | 含铜矿脉与深色矿石基质 / stone |
| `grainPale` / `vegetableStalk` | 85 / 86 | 浅色谷粒与白色菜梗 / food |
| `fishPale` / `fishEye` | 87 / 88 | 鱼腹眼圈与眼口暗部 / food |
| `bottleAmber` | 89 | 琥珀玻璃瓶壁 / glass |
| `inkTeal` | 90 | 卷轴水线、包装与封面青色印字 / ink |
| `paperEdge` | 91 | 纸页边缘和折纸侧边 / paper |
| `bookCloth` | 92 | 书脊装帧布 / fabric |
| `metalTeal` | 93 | 阀柄青色涂装 / metal |
| `printedWarning` | 94 | 台边黄色警示涂印 / ink |

食材的 `foodRoot/fruitRed/grain/fish/fishBack`（48–52）在新建项目中明确归为 `food`；不再把人工建模的鱼称为未知采样材质。旧文件类别仍按原样读取。白色冷藏柜的门壳、塑料内衬、橡胶门封和金属框分别赋值；碗的全部格子都属于陶瓷；地毯的穗结也属于织物。书皮和鱼体、卷轴画面和布料、价签和金属字、矿脉和黄铜硬件均已分开。

此前分类修正不是外观包操作：它重新分配原先错误的 ID，部分原来误用实体材质的显示像素改成非碰撞，硬塑料价签护片改为实体。比较报告逐件列出碰撞标记变化。修正后的外观包切换必须保持全部 ID 与碰撞属性不变；测试分别检查两种操作，不能混为一谈。

这些分类是制作时明确选择的材料，不声称从参考图自动识别出实际物理材质。LIFE-096 琥珀瓶目前仍为实心静态简化，没有瓶内空腔或内容物；改变玻璃透明度不能补出缺失几何。石脚和石芯桌面仍按参考风格保留，没有为了消除石材而把它们统改成金属。

此前整改覆盖 M001–M009 的 108 件图册候选；M010、M011 又各增加 12 件独立复核候选，当前合计 132 件。早期粗模、其他独立家具/建筑研究及剩余参考条目不因这次修正自动通过审核。历史 `paper` / ID 45 保留兼容，但这 132 件保存候选的实际格子不再使用它。`sampled` 仍仅表示来源不明的采样色。


## M010 文娱与器材角色

本批新增 13 个用途角色。类别是明确的制作选择，不是对图片做物理材质识别。M010 阶段角色库共 81 项；此前保存的项目不在读取时强制增补，MCP/UI 创建新配方时在同一事务中分配缺失角色。

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `safetyMetal` | 95 | 消防器材红漆钢壳 / metal |
| `lacquerWood` | 96 | 鼓身朱红髹漆木胎 / wood |
| `canvas` | 97 | 绘画绷布 / fabric，独立于纸页 |
| `pigmentInk` / `pigmentMist` | 98 / 99 | 深浅绘画颜料 / ink，非屏幕像素 |
| `drumSkin` | 100 | 本设计选择的合成聚合物鼓膜 / plastic |
| `instrumentWire` | 101 | 独立金属琴弦 / metal |
| `brushFibre` | 102 | 合成纤维笔尖 / fabric |
| `redHose` | 103 | 红色消防橡胶软管 / rubber |
| `incense` / `ember` | 104 / 105 | 压制植物香材 / plant，示意余烬 / emissive |
| `polymerRed` | 106 | 红色硬塑料箱体 / plastic，独立于控制键 |
| `speakerCone` | 107 | 扬声器聚合物振膜 / plastic，独立于鼓膜和显示屏 |

消防柜的钢瓶、软管和塑料箱即使都是红色，也保持三个独立 ID。画轴为纸，画架绷布为布，图画由独立颜料格表示；介绍牌是纸质展签，未伪装成屏幕。鼓膜明确选用现代合成聚合物，不暗称其为皮革。香枝只做静态植物材料，未实现燃烧或烟，悬灯采用电发光芯，不借其他材料表现蜡烛。

`tests/atlas-culture.test.ts` 查询上述实际格子，检查印刷纸路、共鸣腔、鼓腔、线盘轴孔和挂笔间隙；还测试舞台接口、画室及演出/礼仪陈设、独立换材质一次撤销、用户 ID 冲突与失败回滚。模型外观仍需人工验收，画中景物和文字只是简化的体素示意。


## M011 文娱与礼仪材质

M011 当时新增 24 个用途角色，角色库共 105 项。相似红、白、金色不能推断成同一种材料。

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `festivalRed` | 108 | 红旗、礼仪覆布与软座 / fabric |
| `gameFelt` | 109 | 游艺台呢 / fabric |
| `gameWhite` / `gameBlack` | 110 / 111 | 黑白釉面棋子 / ceramic |
| `ballOrange` / `ballWhite` / `ballBlue` / `ballYellow` / `ballDark` / `ballRed` | 112–117 | 作者选择的合成聚合物球皮 / plastic |
| `racketString` | 118 | 尼龙球拍网弦 / fabric |
| `shuttleVanes` / `shuttleCork` | 119 / 120 | 尼龙羽球裙片 / plastic；软木球头 / plant |
| `giftPaper` / `giftRibbon` | 121 / 122 | 礼盒包装纸 / paper；缎带 / fabric |
| `cakeCrumb` / `cakeCream` / `cakeGlaze` | 123–125 | 糕体、奶油、糖饰 / food |
| `candleWax` | 126 | 蜡体 / wax |
| `candleWick` / `candleFlame` | 127 / 128 | 棉芯 / fabric；示意火焰 / emissive |
| `ceramicRed` | 129 | 朱红釉花瓶 / ceramic |
| `flowerWhite` / `flowerAmber` | 130 / 131 | 白色、橙金花瓣 / plant |

球皮不是从图片自动识别的真皮；棋子按作者选择使用釉面陶瓷。礼盒纸与缎带、布幔织纹与金属连接件、糕体与奶油、蜡烛与电灯芯分别保留 ID。花灯的玻璃护面和内部电发光芯独立；蜡烛只是静态示意，没有燃烧、熔蜡或烟。

`tests/atlas-festival.test.ts` 查询上述实际格子，并检查球腔、拍网孔、纸本、抽屉、空棺、杯腔及更新后的七套陈设。`materialBatch` 为有上限的显式材质批量编辑；逐项执行与单材质相同的校验，重复 ID 或任何失败整批回滚。外观包通过三条配色命令建立和应用，105 个角色不再挤占普通事务的 100 条命令预算。

## M012 生活设备与建筑组件

本批新增 11 个用途角色；新文档共 116 项。首选 ID 只适用于新文档；导入、编辑和 MCP 必须读取项目实际 `styles.yunshan` 映射。

| 角色 | 新文档首选 ID | 用途 / 类别 |
| --- | ---: | --- |
| `teaLeaf` / `teaLiquid` | 132 / 133 | 干茶叶 / food；静态茶汤 / water |
| `petKibble` | 134 | 宠物食品颗粒 / food |
| `cleanerFibre` / `cleanerLiquid` | 135 / 136 | 尼龙刷纤维 / fabric；清洁剂示意液体 / water |
| `mirrorGlass` | 137 | 背镀镜玻璃 / glass；当前无场景镜像 |
| `giftWrapRed` / `giftWrapBlue` | 138 / 139 | 红、蓝礼包包布 / fabric |
| `giftWrapBand` / `giftBoard` | 140 / 141 | 礼包缎带 / fabric；硬纸内芯 / paper |
| `plantStem` | 142 | 草本植物茎与花托 / plant |

洗衣机壳使用 `enamel`，滚筒使用 `metalBright`，门封使用 `rubber`，玻璃门使用 `glass`，显示像素使用 `displayGlyph`，门环光学面使用 `opticsGlow`。镜子、空瓶玻璃、塑料瓶壁、纸标和瓶盖分别保存；不能因颜色相近而合并。礼包织纹使用通用 `wovenLight`，不借旗面材质。辅助花卉的茎、叶、花瓣和花心全部属于植物；旧配方的灯芯花瓣借用已移除。

`tests/atlas-domestic.test.ts` 直接查询材质格子，并验证空滚筒、杯腔、礼包空腔、排水孔、楼板层次和真实台阶；外观更换不改变几何、类别或碰撞。`scripts/verify-domestic-mcp.ts` 通过真实 stdio MCP 操作当前 UI 文档，验证分类换色、一次撤销、版本冲突、失败回滚、建筑接口拼装、导出与重启恢复。模型和材料仍为作者选择的候选，不能据此宣称还原了图片中的真实物理材料。

## M013 建筑分层材质

本批新增四个角色，新文档共 120 项。材质分类是制作决定，不是从图片自动识别的实际配方。

| 角色 | 首选 ID | 实际用途 / 类别 |
| --- | ---: | --- |
| `structuralConcrete` | 143 | 承板、地下实墙 / concrete |
| `mortar` | 144 | 砌筑砂浆及防滑线 / concrete |
| `waterproofMembrane` | 145 | 弹性橡胶防水膜 / rubber，独立于轮胎与密封件 |
| `earthCutaway` | 146 | 剖面土层 / soil，独立于栽培土与石屑 |

石铺面、瓦片、木基层、金属泛水、铜锁片、灯芯仍使用各自角色。实体牌芯是作者选择的涂装金属，角纹为油墨，不使用屏幕像素；混凝土不按灰色借石材。`tests/atlas-structure.test.ts` 直接查询这些层的整数格，验证换外观不改其余材料、角色、占用、接口及碰撞，一次撤销完整恢复。`scripts/verify-structure-mcp.ts` 同时验证真实 UI 的混凝土分类筛选、MCP 修改同步、版本冲突、失败回滚、保存和导出。

当前 192 个保存候选都有实际用量和作者分类复核，见[材质审计](../artifacts/atlas/atlas-20261003132803/material-audit.json)。旧格式中的栽培土角色 `soil` / 13 仍保留历史 stone 类别兼容；它独立于 `stone` / 1，未在读取时重命名或合并。新剖面土层使用明确的 soil 类别，旧文件不会自动迁移。

## M014 木纸灯笼与建筑材料

新文档增加 `lanternPaper`，首选 ID 147，物理类别 `paper`；新文档共 121 个用途角色。纸罩不与 `paperSheet` 纸页、历史 `paper` 棉布、玻璃或灯芯合并。内部电灯芯用 `warm`；木骨架/收边用 `wood/woodEdge`，金属电座与挂接带用 `metal`，铜吊环与连接用 `bronze`。数字 ID 仍按实际项目绑定读取，用户已占用 147 时分配空闲 ID。

纸罩在素色模式不透明，材质试作用透明混合近似；没有真实透射或纸张次表面散射。独立电灯芯的 emissive 不代表纸罩和场景已受真实照明。石基、灰缝、混凝土承板、实木、玻璃、金属和铜件同样按实际格子区分。

`tests/atlas-legacy-building.test.ts` 验证实际纸罩/灯芯/木/铜坐标、用户 ID 冲突、缺角色报错、外观包与一次撤销、原生/GLB 材质映射。真实 [MCP 分类验证](../artifacts/atlas/atlas-20261003120646/legacy-building-mcp-verification.json)检查 UI paper 筛选和同文档同步。外观包没有改变体素、接口、碰撞或其他角色；材质分类复核不等于美术验收。

## M015 纤维流苏与建筑细部

新增 `lanternTassel`，新文档首选 ID 148，类别 fabric、非碰撞；M015 当时的新文档共122个用途角色。纸灯的纸罩、流苏、电灯芯、木骨、金属帽、铜环各自使用实际ID，未借用红果实、红按钮或灯芯做红色穗。用户占用148时分配空闲ID，创建失败整批回滚。实体木牌上的回纹使用印墨，瓦当回纹仍是瓦，石压头才是石材。

[真实MCP分类验证](../artifacts/atlas/atlas-20261003124439/joinery-mcp-verification.json)查询实际纸/纤维/木/灯格子，验证UI织物筛选、四角色外观包、一次撤销、版本冲突、保存和GLB映射。纸灯总览保留未支撑提示，安装到杆与承台后检查通过；没有改动流苏碰撞属性来清除提示。

## M016 灯箱、能量区与耐火内衬

新文档共 125 个用途角色，新增以下独立映射。首选数字 ID 已被用户使用时仍分配空闲 ID，不覆盖原材质。

| 角色 | 首选 ID | 实际用途 / 类别 |
| --- | ---: | --- |
| `signDiffuser` | 149 | 实体灯箱丙烯酸透光板 / plastic |
| `energyField` | 150 | 静态能量光柱示意 / emissive，非碰撞 |
| `flueLiner` | 151 | 烟道耐火陶内衬 / ceramic |

BUILT-101 的印字、透光塑料板、内部电灯芯和木金属框分别使用 `printedDark`、`signDiffuser`、`warm` 和相应结构角色。实体灯箱不是显示器；图形不用 `displayGlyph`，透光板不用纸罩或玻璃。BUILT-095 的非碰撞能量区与实体灯带、玻璃护片、金属导流柱分开。BUILT-102 的陶内衬、石砌体、砂浆、木顶帽、防水层和泛水各有实际材质 ID。

`tests/atlas-exterior.test.ts` 查询这些层的实际整数格，并验证四角色外观包、用户 ID 冲突、失败回滚、一次撤销及原生/GLB 映射。材质分类是作者依据构造指定的，不声称由参考图自动识别。当前透明混合与 emissive 没有真实灯箱透射、全局照明或能量场模拟。[M016 实际 MCP 记录](../artifacts/atlas/atlas-20261003132803/exterior-mcp-verification.json)已验证塑料筛选、四角色外观包与界面同步，未改变类别或非碰撞能量区。

## 后期换外观

先读取 `query_materials_interfaces` 返回的 `styles`，再按实际 ID 修改 `material` 或定义、应用 `palette`。材质包允许字段为 `name/color/roughness/metalness/opacity/emissive/intensity/surface/surfaceScale/surfaceStrength/surfaceSeed/surfaceRotation`。定义新配色时带入 `id`、`category`、`solid` 会被 Schema 拒绝。旧文件的配色可能包含这些字段，应用时会提示并忽略，保留当前类别与碰撞设置。

换外观不修改体素 ID、孔洞、部件、安装点或碰撞属性。透明度发生变化可能需要重新生成显示表面，这是派生网格变化；权威体素不变。`material` 命令仍允许显式修改物理类别与碰撞设置，那属于文档编辑，不属于外观包。

目前支持一个文档内共享材质的统一替换和保存配色；跨多个项目文件自动迁移第三方材质包尚未实现。材质不是实际仪器功能，显微镜没有成像、倍率或调焦动画；发光使用 emissive 与可选屏幕辉光，没有全局光照模拟。

## UI、导出与验证

材质面板可按物理类别筛选，显示当前 ID 的中文类别和用途角色。原生 JSON 保留完整 `styles` 与 `materials`。本版本新导出的 GLB 材质 `extras` 包含 `voxelMaterialId/materialRoles/materialCategory`，图集 JSON 包含 `roles/category`，接口 JSON 包含 `materialRoles`。早期导出没有新增字段，可从随附原生文件读取映射；需要这些字段时用当前导出器重新导出。

`tests/atlas-public-service.test.ts` 验证 M009 的实际分类、床铺与梯间空格、摄像壳腔、两张办理台的实例拼装，以及新角色与用户 ID 冲突时的原子分配；`tests/atlas-civic.test.ts` 验证 M008 实际格子的分类、真实孔洞、独立材质替换和一次撤销；`tests/material-roles.test.ts` 验证光学分层确实存在于格子中、独立修改不会串色、首选 ID 冲突不覆盖用户材质、缺失角色不静默替代、失败回滚、撤销、原生和 GLB 导出映射以及外观包不改变碰撞。真实 stdio MCP 验证额外检查界面与规范文档同步，并一次撤销光学面与显示图形、橡胶与担架布料、旗布与织纹和红色印字的整批外观修改。

逐件数据可运行 `npx tsx scripts/audit-atlas-materials.ts` 重新核验，输出到 `artifacts/atlas/latest.json` 指定的证据目录。`npx tsx scripts/compare-atlas-material-classification.ts --saved` 将当前原生文件与修正前的索引逐格比较，记录 ID 变化、碰撞标记变化，并断言每个占用位置、原点、格距、包围盒、接口及声明孔洞保持不变。比较不把两份不同的材质分配哈希误称为相同几何哈希。

`tests/atlas-material-correction.test.ts` 对键帽、插座、冰箱内衬和门面、盆体、坐便座圈、机壳及钢刃的实际坐标断言材质；也检查书页与油墨、鱼各部位、玻璃瓶与塑料盖、仅换织物不影响陶瓷纸张、外国 ID 冲突、回滚及原生/GLB 往返。MCP 另查询盆、座圈、毛巾格子，并让 UI 实际显示织物独立换色与一次撤销。

上一轮整改报告：[分类对照](../artifacts/atlas/atlas-20261003063047/material-classification.html)。M012 当时 144 件的[材质用量与复核](../artifacts/atlas/atlas-20261003092028/material-audit.json)、[M011 几何修正实图](../artifacts/atlas/atlas-20261003081509/festival-revision.html)和[十二份总览支撑审计](../artifacts/atlas/atlas-20261003092028/gallery-support-audit.json)保留实际范围。M002 壁挂柜未安装支架的既有告警仍存在；分类复核不等于完成安装或美术验收。
