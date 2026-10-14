from pathlib import Path
import json

w=Path('work/m008-refinement');loc=json.loads((w/'production-location.json').read_text());root=Path(loc['root']);v=json.loads((root/'validation.json').read_text());items=json.loads((w/'asset-notes.json').read_text());link='../'+str(root);rows='\n'.join('| '+' | '.join(row)+' |'for row in items)
Path('docs/M008-REFERENCE-REFINEMENT.md').write_text(f'''# M008 · 医疗与公共事务器具参考精修

12件现有参考首轮精修；累计 **8/67张、96件**。793条参考的技术转化已齐全，最终效果图质量验收另计。

[实际总览]({link}/M008-materials.png) · [前后对照]({link}/review.html) · [GLB]({link}/exports) · [下载包]({link}/PACKAGE-DOWNLOAD.txt)

| 资产 | 名称 | 本轮变化 |
| --- | --- | --- |
{rows}

显示几何共{v['triangles']:,}个三角形、{v['nativeMinimumCells']}个5mm原生细格和{v['closedOrientedComponents']}个闭合有向组件。126为一套平行双栏、两连接组；141为原会议桌与六椅套件、七连接组。其余10件各一连接组，内部器皿、册盒与重复椅子不计新增独立资产。

药柜有16个真实空屉，其中一屉保持静态拉出和原三份塑料包示意范围。输液架保留五辐轮脚、分开的双挂钩、连续薄壁软袋和封口、独立液色与空心滴管；没有剂量、药物类别或输液功能声明。担架的连续剪叉、转轴、穿握环、橙垫和三条织带独立，固定姿态不等于已实现折叠。康复栏中间保留有限通行空间，不冒称无障碍工程认证。

洗台真实陶瓷盆、排水口、空心弯管与柜体各自检查。全装配对盆内14个点先命中陶瓷底面，中央排水口在盆腔/承板范围不受遮挡；弯管的转弯不被解释为一条向下无限开放的射线。上承板和分仓板都让出盆腔，分液盒/急救盒按真实钢座挂到背板。

公告面新增`notice-v1`：参考短题「公告」、公共图标及三卡片；核验面新增`verify-v1`：作者头像与勾记。实际1024×768颜色、法线和ORM在WebGL与GLB共用算法。像素用实际显示用途，玻璃盖、金属框和纸盒分开；作者图形不代表实时公告、已核验身份或已投票。全件按参考侧向镜像，原生格、法线和三角朝向一并变换；文字UV在实际前盖面验证并看图。

讲台使用真正连续斜承稿面与固定凹刻石芯前板，后方层格开放，不借用带拉手的柜门冒称固定面板。册盒柜保留原范围的纸板、纸页、布脊、标签印墨；门芯凹刻是盲槽，未切穿石板。档案柜两门以90度静态姿态保存并连接实际铰座。取证盒有真实空腔、独立盖/密封圈、搭扣孔、穿指橡胶柄和用途独立的天平印墨。

## 文件与验证

- [生产记录]({link}/production.json)：12个新GLB实际读回、13份原生文档及{v['finalExportFilesHashed']}个导出文件核SHA-256；真实贴图PNG共{v['newTexturePNGs']}张。
- [历史留存]({link}/baseline-exports.json)：12份原生母版、12个历史GLB和48个旧导出文件保持。M001–M007此前84件精修几何哈希保持。
- [浏览器检查]({link}/browser-verification.json)：12公开创建、重建与撤销、错误批次回滚、外来ID、12图册入口；核实际加载构建SHA和12对同米制机位。
- [逐图记录]({link}/visual-review.json)：39张最终图逐张打开，含12对材质图、7正面/5顶面几何图和3张公告像素换色/撤销近景。
- [验证汇总]({link}/validation.json)：{v['regressionTests']}项相关回归和构建通过，其余781条参考索引保持。

首轮39张候选图中实际打开15张后，发现盆沿未覆盖石台开口四角；已补真实白釉承托沿，并核它与台面的实际接触，矩形沿随后仍露两内角，已改为匹配曲盆内口的连续白釉沿，并实际打开材质/顶视两近景确认。两次隔离重产均只改变127，其余11件几何哈希保持。两份中间候选均捕获39张、实际打开15张，各自的技术浏览器报告与看图记录均保留，不计最终交付。曲沿修正后完成8项M008检查，并将起点从分液盒内部移到其下方，重跑完整洗台检查通过。其他60项保留原始通过记录，69项是去重检查总数；失败查询、修正原因和全部原始输出保留。

工作区刷新曾丢失未提交的草稿；当前源码、原生、GLB、回归和实拍均在恢复后的工作区重新生成。此前丢失的图与日志不计本批验收证据；说明保留于history/workspace-refresh-note.json。通过检查的源码与草稿另有GitHub检查点，资产交付计数只在最终包完成后更新。

## 使用与后续

编辑器选择「图册 → M008」，或加载`projects/{loc['run']}-m008-gallery.ysvox.json`；单件使用`exports/LIFE-*/visual.glb`。完整包先读`START-HERE.txt`。显式参数`{{"refinement":"reference-v1"}}`选择精修版，默认baseline保留原配方。

本批是静态参考母版，输液、流体、消毒、身份、投票、档案内容、音频、电力与运动未绑定。软袋近景、织带弯折、回纹竖边反差、金属磨耗和最终效果图质量仍可继续细化；下一批 **M009**。
''')
p=Path('README.md');s=p.read_text();old=next(l for l in s.splitlines()if l.startswith('**M007的12件'));new=f'**M008的12件医疗与公共事务器具已交付首轮精修**：连续软袋/剪叉/斜台、真实陶瓷盆和票缝、凹刻石芯与公告/头像PBR贴图；{v["regressionTests"]}项相关回归，39张逐图检查。[变化](docs/M008-REFERENCE-REFINEMENT.md) · [总览]({root}/M008-materials.png) · [GLB]({root}/exports) · [下载包]({root}/PACKAGE-DOWNLOAD.txt)。累计首轮8/67张、96件，接续M009；最终效果图验收另计。[M001](docs/M001-REFERENCE-REFINEMENT.md) · [M002](docs/M002-REFERENCE-REFINEMENT.md) · [M003](docs/M003-REFERENCE-REFINEMENT.md) · [M004](docs/M004-REFERENCE-REFINEMENT.md) · [M005](docs/M005-REFERENCE-REFINEMENT.md) · [M006](docs/M006-REFERENCE-REFINEMENT.md) · [M007](docs/M007-REFERENCE-REFINEMENT.md)。';p.write_text(s.replace(old,new))
p=Path('projects/conversion-goal.json');g=json.loads(p.read_text());g['lastCompletedBatch']={'sheets':['M008'],'subBatch':'reference-art-refinement-v1','run':loc['run'],'state':'validated-first-pass','wholeSheetFirstPassDelivered':True,'refinedReferences':12,'newReferences':0,'humanArtAccepted':False,'evidence':str(root)}
for k in ['refinementPhase','visualRefinementPhase']:g[k].update(firstPassSheets=8,lastDeliveredSheet='M008',nextSheet='M009')
g['visualRefinementPhase'].update(firstPassReferences=96,evidence=str(root/'visual-review.json'));g['nextBatch']='M009';g['activeBatch'].update(sheets=['M009'],state='queued',ids=[r['id']for r in json.loads(Path('projects/reference-atlas/index.json').read_text())['entries']if r['sheet']=='M009']);g['nextBatchNotes'][1]=f'M008首轮12件、13原生、12新GLB及12历史母版/GLB、39实拍、{v["regressionTests"]}项相关回归；不增加清单母版。';g['nextBatchNotes'][2]=g['nextBatchNotes'][2].replace('M008','M009');p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
p=Path('AGENTS.md');p.write_text(p.read_text()+'''
- M008首轮累计8/67张、96件，接续M009；126两独立平行栏、141会议桌与六椅七组均是一份原清单套件。124原两袋与静态液色、123原包、144/146原册盒范围保留，不计新增母版。
- M008洗盆检查须覆盖完整柜体内的盆底点阵、上承板和分仓板；盆内首命中陶瓷，中央排水只在真实盆腔/承板范围要求开放，弯管另查空心段。143收票缝首命中真实空舱底，不能只查台面孤件。
- M008公告短题、图标与核验头像/勾记是独立显示用途的受光PBR图形，非纸或临床/投票状态。全件侧向镜像同时变换真实原生格、法线和朝向，前面UV及实际文字方向都要检查。142是固定凹刻石芯前板，不能带柜门拉手；盲刻槽不能切穿石芯。
- 工作区刷新可能丢失未提交scratch；通过检查的配方及真实草稿可先推送已授权的origin/main检查点，明确导出/最终实拍仍待完成，正式交付计数最后更新。恢复后的证据重新生成，不复用丢失图/日志的验收声明。
''')
print('M008 records updated; M009 queued')
