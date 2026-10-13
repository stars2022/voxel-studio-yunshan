from pathlib import Path
import json
w=Path('work/m007-refinement');loc=json.load(open(w/'production-location.json'));root=Path(loc['root']);v=json.load(open(root/'validation.json'));items=json.load(open(w/'asset-notes.json'));link='../'+str(root);rows='\n'.join('| '+' | '.join(r)+' |'for r in items)
Path('docs/M007-REFERENCE-REFINEMENT.md').write_text(f'''# M007 · 科研与医疗器具参考精修

12 件现有母版首轮精修；累计 **7/67张、84件参考**。793条参考已技术转化，最终效果图质量验收另计。

[实际总览]({link}/M007-materials.png) · [前后对照]({link}/review.html) · [GLB]({link}/exports) · [下载包]({link}/PACKAGE-DOWNLOAD.txt)

| 资产 | 名称 | 本轮变化 |
| --- | --- | --- |
{rows}

显示几何共{v['triangles']:,}个三角形、{v['nativeMinimumCells']}个5mm原生细格和{v['closedOrientedComponents']}个闭合有向组件。111桌椅是一个清单套件、两个有意分离的连接组；115的开放量杯、两瓶和培养皿是一个清单套件、四组。其余10件各一个实际连接组。

斜观察罩是一片真正连续薄玻璃，与钢压框和罩轴分开；仪器腔保持空置。显微镜双目筒和物镜套筒为连续空心结构，载物台光孔贯通，独立玻璃载片放在孔上；不把装上玻璃后的整个光路称为开放空气通道。样品瓶、杯和皿都具有真实内壁、底壁与口沿，瓶盖单列；白色刻线为独立印墨示意，没有计量校准声明。

实验台槽内有真实排水口、水嘴与插座真孔；通信机柜八层托盘、逐层前孔、侧百叶、顶网和后线槽均查实际三角面。托盘剪刀指环和侧提耳、床栏夹口、医疗气口也核真实开口。护栏插入端口置于实际夹口止挡面，医疗面板两端口置于真正墙装背座；未复制一张病床来冒认模块安装完成。扫描环是连续贯通厚环，有限静态患者包络在床面上方通过，床板、导轨与承座实接；这不是动态行程或临床设备规格验收。

独立用途继续使用实际512角色与原碰撞属性。书册/资料夹用纸、纸板与布脊，背包使用独立包布/皮边/包五金，插座与红呼叫钮为塑料；玻璃、涂装金属、钢、黄铜、显示图形和光学面分开。M007未绑定供电，光学面保持零发光；图形为静态作者图案。控制台主屏新增`energy-v1`圆形路径与趋势图，真实1024×768颜色/法线/ORM随GLB导出，之前图形设计的渲染和几何保持。

## 验证与文件

- [生产记录]({link}/production.json)：12新GLB实际读回、13原生文档、{v['finalExportFilesHashed']}个导出文件和{v['newTexturePNGs']}张图形PNG核SHA-256。
- [历史留存]({link}/baseline-exports.json)：12历史原生/GLB保留、48旧导出文件核验。此前M001–M006的72件精修几何哈希保持。
- [浏览器验证]({link}/browser-verification.json)：12公开创建、重建与撤销、失败回滚、外来用途ID和12个图册入口；实际加载bundle与冻结构建匹配。
- [逐图检查]({link}/visual-review.json)：39张最终截图逐张实际打开，包括12对同米制机位前后材质图、7正面与5顶面几何图、3张量杯刻线换色/撤销实拍。
- [验证汇总]({link}/validation.json)：{v['regressionTests']}项相关回归及构建通过，其余781参考索引保持。

草稿的挂杆、聚光座、书夹承面和显示后托间隙按真实接触修正。首次数组验证发现斜托调用传入角色字符串而非项目实际ID，已修正；测试对五块屏幕误按五个贴图材质计数的断言也按既有同描述合并契约纠正。失败日志留存。12张首稿均打开；控制台主屏更新后再打开该件第二稿，正式39张截图对应同一冻结源码。首次导出候选的113未含原生细格，已补两枚真实5mm罩轴扣销；前一候选的12GLB/13原生与状态记录保留，隔离重产只改变113，其余11件几何哈希相同。最终看图随后发现112柜内木承板遮住槽腔并阻挡排水；已对真实承板开槽/排水孔，加入整台装配的射线与首命中材质断言，隔离重产只改变112。第二候选的部分捕获图、实际打开7张的记录及主动中止浏览器日志留存，不冒称39张验收。

## 使用与后续

编辑器选择「图册 → M007」，或加载`projects/{loc['run']}-m007-gallery.ysvox.json`；各`exports/LIFE-*/visual.glb`可单独使用，下载包解压先读`START-HERE.txt`。显式参数`{{"refinement":"reference-v1"}}`选择精修版，默认baseline保留旧配方。生产与浏览器脚本支持M001–M007；重产使用隔离工作区和本批原基线索引。

这是静态科研/医疗母版，没有课程状态、实验反应、显微成像/倍率、校准计量、医用气体、临床诊疗、服务器运行或扫描床运动绑定。真实开口与静态包络通过不等于这些功能已实现。玻璃近景、背包细褶、设备壳接缝、器械盘细件反差、金属磨耗及最终效果图质量继续打磨；下一批 **M008**。
''')
p=Path('README.md');s=p.read_text();old=next(l for l in s.splitlines()if l.startswith('**M006 的12件'));new=f'**M007的12件科研与医疗器具已交付首轮精修**：连续斜玻璃罩、双目筒、空心样品容器、真实载台孔与贯通扫描环；{v["regressionTests"]}项相关回归，39张逐图检查实拍。[变化](docs/M007-REFERENCE-REFINEMENT.md) · [总览]({root}/M007-materials.png) · [GLB]({root}/exports) · [下载包]({root}/PACKAGE-DOWNLOAD.txt)。累计首轮7/67张、84件，接续M008；最终效果图验收另计。[M001](docs/M001-REFERENCE-REFINEMENT.md) · [M002](docs/M002-REFERENCE-REFINEMENT.md) · [M003](docs/M003-REFERENCE-REFINEMENT.md) · [M004](docs/M004-REFERENCE-REFINEMENT.md) · [M005](docs/M005-REFERENCE-REFINEMENT.md) · [M006](docs/M006-REFERENCE-REFINEMENT.md)。';p.write_text(s.replace(old,new))
p=Path('projects/conversion-goal.json');g=json.load(open(p));g['lastCompletedBatch']={'sheets':['M007'],'subBatch':'reference-art-refinement-v1','run':loc['run'],'state':'validated-first-pass','wholeSheetFirstPassDelivered':True,'refinedReferences':12,'newReferences':0,'humanArtAccepted':False,'evidence':str(root)}
for k in ['refinementPhase','visualRefinementPhase']:g[k].update(firstPassSheets=7,lastDeliveredSheet='M007',nextSheet='M008')
g['visualRefinementPhase'].update(firstPassReferences=84,evidence=str(root/'visual-review.json'));g['nextBatch']='M008';g['activeBatch'].update(sheets=['M008'],state='queued',ids=[r['id']for r in json.load(open('projects/reference-atlas/index.json'))['entries']if r['sheet']=='M008']);g['nextBatchNotes'][1]=f'M007首轮12件、13原生、12新GLB及12历史母版/GLB、39实拍、{v["regressionTests"]}项相关回归；不增加清单母版。';g['nextBatchNotes'][2]=g['nextBatchNotes'][2].replace('M007','M008');p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
p=Path('AGENTS.md');p.write_text(p.read_text()+'''
- M007首轮累计7/67张、84件，接续M008；111桌椅两组、115四件空容器四组，各算一份清单套件。仪器与样品、椅子与控制台、病床与护栏/墙面板不重复合入其他ID。资料夹保留原柜内静态范围。
- M007闭壳检查之外先验证网格数组和实际用途ID；斜托不能把角色字符串传作数字ID。同图形描述的五屏允许合成三材质网格，物理屏组件范围仍逐件保留。energy-v1是真实受光PBR作者显示图形；光学面未绑定供电时零发光。
- M007载物台孔与覆玻璃、套筒孔与物镜玻璃分别检查；杯/瓶/皿底壁和颈口是真实连续壳。护栏插入端口在实际夹口止挡面，墙面板端口在实际背座；管气口须同时穿过主壳。扫描床上方只核有限静态包络，不冒称行程、显微成像、气体、电力或临床功能。
- M007实验台排水须对完整装配发射射线并断言相邻槽底首命中钢材；单独钢槽的孔检查不能排除木承板遮挡。逐件原生细格数必须大于零；113补真实5mm罩轴扣销。两次候选与部分看图记录保留，最终39张必须对应修正后同一冻结源码。
''')
print('M007 records updated; M008 queued')
