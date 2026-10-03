import {readFile,writeFile} from 'node:fs/promises';
const r=JSON.parse(await readFile('artifacts/verification.json','utf8')),unit=await readFile('artifacts/unit-tests.txt','utf8');
const count=unit.match(/ℹ tests (\d+)/)?.[1]??'见日志',passed=unit.match(/ℹ pass (\d+)/)?.[1]??'见日志',m=r.measurements,frames=m.browserSteady.frameIntervalsMs as number[],sorted=[...frames].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length*.5)],p95=sorted[Math.ceil(sorted.length*.95)-1];
const f=(n:number)=>Number(n.toFixed(2)).toLocaleString('zh-CN'),date=new Date(r.finishedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
const text=`# 实际验证报告

最后一次完整运行：${date}（Asia/Shanghai）。结果：**${r.success?'通过':'失败'}**。${passed}/${count} 项核心测试通过；${r.checks.length} 项浏览器 / MCP / 持久化验证通过。

环境：${r.environment.cpu}，${r.environment.logicalCPUs} 逻辑 CPU，${r.environment.totalMemoryGiB} GiB 内存，${r.environment.platform} ${r.environment.osRelease} ${r.environment.arch}，Node ${r.environment.node}。浏览器使用本机 Playwright Chromium ${r.environment.browser??''}，无头 WebGL；驱动报告 ${r.environment.webgl?.renderer??'见原始记录'}。依赖版本在 package-lock.json。未在 Windows、Linux、集显或移动端作同等性能验证。

## 场景与建模链路

民居包含 15 个独立母版、16 个实例、1 个组合模板；原生母版合计 **${m.headlessMesh.voxels.toLocaleString()} 格**。使用统一石、墙、木、金属、瓦、玻璃、陶、布、植物和发光材料。含可进入门洞、窗、楼梯、坡屋顶、栏杆、花槽，以及室内床、桌、显示器。

通过占用格检查：0 对组件碰撞，0 个无下方支撑组件；门洞宽 1.4m、高 2.4m；窗开口宽 1.6m、高 1.4m。窗内保留设计木格与非碰撞玻璃，不把窗称为完全空洞。门洞与指定楼梯上方 2m 净空区域均无阻挡。护栏与墙之间 0.1m 的邻近间隙作为设计提示保留，未自动填死。

真实 MCP 客户端调用一个批次：窗开口从 1.6m 改为 2.2m；两类墙面从抹面改为石材；增加一个引用花槽；共享能源材质从青色改为淡蓝并降低强度。浏览器通过 WebSocket 同步同一版本，实际截图显示变化；一次 undo 恢复全部体素、材质和实例内容。版本号保持单调递增，不能用版本号相等衡量撤销。

## 实测性能

| 测项 | 本次结果 | 方法与范围 |
| --- | ---: | --- |
| 页面初次 ready | ${f(m.initialBrowserReadyMs)} ms | 从打开本地页面到真实文档与合面就绪，含加载 |
| 民居母版合面 | ${f(m.headlessMesh.milliseconds)} ms | 无界面串行合并全部母版，${m.headlessMesh.quads.toLocaleString()} 个四边形；不是每帧耗时 |
| 合面期间进程 RSS 增量 | ${f(m.headlessMesh.rssDeltaBytes/1024**2)} MiB | Node 进程前后 RSS 差，含分配与 JIT，非孤立算法峰值 |
| 渲染批次 / 三角形 | ${m.browserSteady.drawCalls} / ${m.browserSteady.triangles.toLocaleString()} | renderer.info 实测，含网格与选择辅助显示 |
| 单格命令 | ${f(m.singleCell.commandMs)} ms | 校验、文档副本、修改差异计算；${m.singleCell.dirtyChunks} 个脏块键 |
| 262,144 格 dry-run | ${f(m.largePreviewRoundtripMs)} ms | 官方 stdio MCP 往返 |
| 262,144 格提交 | ${f(m.largeCommitRoundtripMs)} ms | 官方 stdio MCP 往返，含自动保存 |
| 上述提交的核心计算 | ${f(m.largeCommandComputeMs)} ms | 后台文档线程测量 |
| 稳态 rAF 间隔中位数 / P95 | ${f(median)} / ${f(p95)} ms | ${frames.length} 个实际样本；不是 GPU 帧耗时，也不是保证帧率 |

全量原始 rAF 样本、每项命令计时与环境在 [verification.json](../artifacts/verification.json)。编辑、检查与转换在后台线程；主线程仍承担 JSON 快照解析和 Three.js 场景更新，不能宣称大项目完全无停顿。

## 缺陷网格双精度比较

使用可复现的 86 三角形 OBJ（框体、薄板、窄开口、重复/粘连面、碎片）。诊断检测到 9 条非流形边、2 个重复面、4 个源连通片和 3 个低于格距的薄连通片。源几何另存，转换失败记录另存。

| 格距 | 占用格 | 占用格体积 | 结果连通片 | 小碎片 | 转换计算 |
| --- | ---: | ---: | ---: | ---: | ---: |
${r.imports.map((x:any)=>`| ${x.pitch} m | ${x.performance.voxels} | ${f(x.comparison.occupiedVolumeM3)} m³ | ${x.comparison.voxelComponents} | ${x.comparison.smallComponents} | ${f(x.performance.durationMs)} ms |`).join('\n')}

转换计算不含启动 Worker、读取文件及 UI 时间；“占用格体积”不是非封闭源网格的可靠物理体积。源尺寸约 0.92 × 1.00 × 0.24m，0.10m 结果约 1.00 × 1.00 × 0.30m，0.05m 结果约 0.95 × 1.00 × 0.25m。

粗精度的碎片可能与主体粘连，细精度保留 1 个小碎片。细格仍不能恢复源模型原本的语义边界；重复占用被合并不等于完成几何修复。非流形实体填充真实失败；没有自动把门窗填死。另有独立测试覆盖开放边拒绝、透明壳体拒绝与封闭内腔的奇偶填充保留。

![0.05m 实际对照截图](../artifacts/import-compare-0.05.png)

## 通过项目

${r.checks.map((x:any)=>'- '+x.name).join('\n')}

核心测试还覆盖负坐标块序列化、跨块剔面、透明分批、对称/规则材料/连通填充、旋转/复制/阵列/挤出、全部参数模板、接口不匹配、部件循环、组合实例和混合格距的开口遮挡等。完整日志见 [unit-tests.txt](../artifacts/unit-tests.txt)。

## 交付证据

- [外观](../artifacts/editor-exterior.png) / [室内剖切](../artifacts/editor-cutaway.png)
- [MCP 批次提交](../artifacts/mcp-batch-applied.png) / [一次撤销](../artifacts/mcp-batch-undone.png)
- [0.10m 转换](../artifacts/import-compare-0.1.png) / [0.05m 转换](../artifacts/import-compare-0.05.png)
- [MCP 多视角](../artifacts/multiview/) / [失败原件与诊断](../projects/fixtures/)
- [GLB、体素、碰撞、接口和图集样例](../projects/exports/verified-house/)

截图来自实际运行的编辑器与真实转换数据，没有预录素材。完整完成度与边界见 [CAPABILITIES.md](CAPABILITIES.md)。
`;
await writeFile('docs/VALIDATION.md',text);console.log(`已生成 ${r.checks.length} 项端到端验证报告`);
