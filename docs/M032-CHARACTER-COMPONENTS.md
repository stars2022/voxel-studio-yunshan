# M032：年龄身体、头部与穿戴附件

本批为 12 个清单母版、24 种有限参数形态的技术候选。最小眼眉、扣件、织标使用 5 mm 原生体素，躯体、鼻耳、帽冠、袋腔与肩带使用实际连续网格。所有角色材料与网格均为非碰撞视觉件，未修改原 0.2 m 玩法网格。人工美术验收为 0。

[12 件实图](../artifacts/atlas/atlas-20261004084218/M032.png) · [素色与材质](../artifacts/atlas/atlas-20261004084218/materials.png) · [资产包](../artifacts/atlas/atlas-20261004084218/云山-M032-12件三维资产包.zip) · [验证报告](../artifacts/atlas/atlas-20261004084218/validation.json)

| 清单 ID | 内容 | 有限参数与形态数 |
| --- | --- | --- |
| CHAR-013 | 真正开底软帽，连续帽舌、皮圈、铜夹、装饰玻璃徽 | capFit=adult / teen，2 |
| CHAR-014 | 帆布袋身、独立内衬、皮边与后铰盖，真孔提把、肩带 | carry=hand / shoulder；lid=closed / open，4 |
| CHAR-015 | 粗轮廓体系的成对婴幼儿脚组件，不含完整身体 | 1 |
| CHAR-059–065 | 成人 A、成人 B、婴儿、学龄前、学龄儿童、青少年、老年衣身 | 各有 extremities=covered / sockets，14 |
| CHAR-066 | 独立成人精细头部，连续额颊下颌、鼻耳，原生眼眉唇 | 1 |
| CHAR-067 | 独立婴儿与幼儿颅面，宽颅、短下脸 | headStage=infant / toddler，2 |

母版与配色、左右复用、实例和参数形态分别计数。所有参数形态均提供原生文件和 GLB，位于包内 `projects/production/atlas-20261004084218/variants/`。每个默认母版另提供近/远与材质 GLB、碰撞、接口和材质图集。

## 比例与组件范围

以下尺寸均为作者设定，原角色源码、受保护身体净空及尺寸矩阵未收件。总高包括独立头部；身体文件本身不包含头部。成人 A/B 是两种外观选择，未根据衣服推断性别或身份。

| 身体 | 总高 m | 独立头高 m | 髋高 m | 膝高 m | 肩高 m | 肩半宽 m |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 成人 A | 1.70 | 0.240 | 0.860 | 0.460 | 1.370 | 0.205 |
| 成人 B | 1.70 | 0.240 | 0.850 | 0.450 | 1.365 | 0.188 |
| 婴儿 | 0.60 | 0.190 | 0.220 | 0.125 | 0.360 | 0.096 |
| 学龄前 | 0.90 | 0.205 | 0.390 | 0.205 | 0.630 | 0.116 |
| 学龄儿童 | 1.20 | 0.215 | 0.570 | 0.300 | 0.910 | 0.138 |
| 青少年 | 1.50 | 0.230 | 0.755 | 0.405 | 1.190 | 0.166 |
| 老年 | 1.64 | 0.240 | 0.825 | 0.445 | 1.310 | 0.184 |

各年龄分别设定头身、肩髋与四肢比例，未将成人等比缩小。老年体型采用收束肢体与圆肩轮廓；强弯背姿态留给 CHAR-080。身体的 covered 端部是全覆衣的中性手套/脚套形，不是精细可抓握手或裸足。sockets 形态删除这四个端部，并保留相同腕踝挂点，供后续 CHAR-070/071 与 CHAR-073/074 骨骼体系使用。

头发未计入头部母版。CHAR-066 使用更多颅颊颌截面与独立鼻耳，CHAR-067 两种颅面均独立制作。参考中的发型、原面部图集没有被假称为已经集成。

## 腔体与静态安装

帽冠有外壁、内壁、开底边和顶壳；皮圈两端贯通，不能以封底盘冒充环。帽舌后缘留出额头空间。帽徽是零发光的有色不透明装饰玻璃，不是灯芯，也不声称有真实折射。

包有实际口部、底部、帆布壁和独立衬里。打开盖子会将原连续网格绕后铰轴旋转 90°，不重新栅格化。提把后移并增加实际接耳，让开盖有空间；肩带从袋面接耳上行，顶部承接带与衣袖肩顶实际三角面接触。包的位置避开垂落手臂。

[成人穿戴](../artifacts/atlas/atlas-20261004084218/figure-adults-view-0.png) · [七种体型同尺度](../artifacts/atlas/atlas-20261004084218/figure-ages-view-1.png) · [开盖与附件](../artifacts/atlas/atlas-20261004084218/figure-accessories-view-0.png) · [移除端部与幼儿头](../artifacts/atlas/atlas-20261004084218/figure-sockets-view-0.png)

四组样件保存实际母版和米制实例位置。年龄对照中 CHAR-062/063/064/065 的灰色头部是明确标为 `author-proportion-envelope` 的辅助包络，不是完成的儿童、青少年或老年头部。CHAR-068/069 在后续批次；这些灰色占位不计入清单完成数。

安装检查对成人穿戴样件核对真实网格顶点、面心、双向三角边穿越及肩部接触点，不能推及任意姿势或服装。全部角色没有物理碰撞，因此通用体素碰撞为空；穿戴检查是另做的表面核验，不是借“无碰撞”证明没有穿插。

编辑器放置与挂接对纯视觉件允许连续米制坐标；有实体原生体素或声明开口的组件仍要求共格。接口类型、格距、方向和截面匹配检查保留。原生、GLB 与接口导出分别校验。

## 材质与来源边界

新增 11 个用途角色（默认 ID 255–265）：modelSuit、modelSuitTrim、hatCloth、hatBand、hatHardware、bagCloth、bagLeather、bagHardware、bagLining、bagLabel、hatBadgeGlass。新文档共有 239 个角色。几何实际引用项目映射；外来项目已占用的数字 ID 保留，新增角色另行分配。衣布、皮边、铜扣、衬布、标签油墨和玻璃分开，眼睑/耳内褶线不借唇部材质。

原清单帽子“12岁以上种子/警卫官条件”、挎包“6岁以上种子条件”、CHAR-015“height<=0.6 提前返回，无完整四肢”保存为未绑定来源规则。CHAR-061 是另一个精细婴儿身体母版，不能把它与旧粗轮廓提前返回规则混为一体。本批不写 Citizen 或模拟数据，没有骨骼、蒙皮、动画、年龄控制器、自动距离 LOD 或游戏运行集成。

历史清单中的“5cm细格”不覆盖用户最新要求：只最小组件体素，曲面和斜面可用连续网格。

## 复核

先构建编辑器，再生成实际浏览器截图。SwiftShader 为软件 WebGL；截图不是图像生成。

```sh
npm run build
npm run test:cloud
npx tsx scripts/produce-reference-atlas.ts --sheets=M032
npx tsx scripts/verify-figure-exports.ts
npx tsx scripts/verify-figure-variants.ts
npx tsx scripts/audit-atlas-materials.ts
npx tsx scripts/audit-atlas-galleries.ts --sheets=M032
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npx tsx scripts/preview-reference-atlas.ts --sheets=M032
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npx tsx scripts/verify-figure-mcp.ts
npx tsx scripts/verify-figure-installation.ts
```

实际通过数量、近远三角形、原生细块、GLB 精度、MCP 与保存回读结果以本批 `validation.json` 及关联原始报告为准。
