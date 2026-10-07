from pathlib import Path
import json,hashlib
root=Path(json.loads(Path('work/m001-refinement/production-location.json').read_text())['root'])
b=json.loads((root/'browser-verification.json').read_text());keys=json.loads(Path('work/m001-refinement/viewed-image-keys.json').read_text())
assert b['status']=='passed'and len(set(keys))==39 and set(keys)=={v['key']for v in b['views']}
views=[]
for v in b['views']:
 assert hashlib.sha256((root/v['file']).read_bytes()).hexdigest()==v['sha256']
 views.append({k:v[k]for k in ['key','file','sha256']}|{'openedAndInspected':True})
observations=[
 ('LIFE-008','搁板方向按参考调整，铜挂杆为圆截面，板边和连续背撑清楚。','当前母版为独立内胆；参考图的外壳、门和衣物仍需由独立资产组成展示。'),
 ('LIFE-009','可见石脚和角铁、镜面枢轴、铜细边、暖光细条已成形。','环境反射仍较平；未实现平面场景镜像，台面瓶盒未并入镜架母版。'),
 ('LIFE-019','键帽分离、旋钮置于画面右侧，线缆与托板倒角可辨。','参考键帽字符不清晰，未虚构键位；仍可进一步细化表面尺度和细小接口。'),
 ('LIFE-020','折臂改为连续斜杆，圆转轴、灯框、暖光窗清楚，木材层没有被局部点光冲白。','静态姿态；关节动画、局部光的真实灯具分布及环境照明仍未绑定。'),
 ('LIFE-023','坐垫圆弧没有台阶，凳腿外撇，横撑及四脚抱件可见；顶面织纹方向正常。','坐垫表面仍可继续向参考块面细节微调，不能把纹理网格视为实际分块。'),
 ('LIFE-024','两个翻斗具有真实倾角和空腔，把手接上面板，前板和边框不再平贴柜体。','鞋履为独立资产；翻斗是静态形状，未声明抽屉运动或完整开闭净空。'),
 ('LIFE-025','层板倒角、深铁护栏、加高的真实墙挂板可见。','书本、盆花与装饰画仍按独立清单组件处理，后续组合展示需要补充。'),
 ('LIFE-026','双轨、端帽、墙座和八组浅色挂扣比原细杆更接近参考比例。','全长机位下单个挂扣较小；轨道滑动未绑定。'),
 ('LIFE-027','连续褶面消除了侧边台阶；两个回纹位于浅色下缘，近照能辨织纹。换色使主布和回纹一起变红，浅色地纹保持，撤销恢复。','参考色纹作为受光用途贴图保留在素色视图内；没有把贴图细节计为几何或真实织物模拟。'),
 ('LIFE-028','仰视下灯窗、木框、铜压边和黑角帽层次可辨，正面可见天花固定盘。','整片灯窗仍偏平；后续可细化表面层次与场景照明，当前非光学仿真。'),
 ('LIFE-029','背板、悬臂与灯体真实连接，玻璃和光芯分层后外框可辨。','参考灯面的小回纹及更丰富的框架细节仍待下一轮；静态发光不等于现场照明完成。'),
 ('LIFE-030','插孔改到画面左侧且包括斜孔，两个摇杆和右侧显示面独立；连续壳边与最小铜扣保持。','插孔已用真实射线验证贯通，但在浅色背景上深度对比偏弱；设备状态和开关功能未绑定。'),
]
report={'run':b['run'],'sheet':'M001','status':'reviewed-first-pass','reviewer':'Codex visual inspection of actual opened files','humanArtAccepted':False,'referenceFile':'projects/reference-atlas/images/M001.png','referenceSHA256':hashlib.sha256(Path('projects/reference-atlas/images/M001.png').read_bytes()).hexdigest(),'viewedFiles':views,'models':[{'id':i,'observed':o,'remaining':r}for i,o,r in observations],'comparisonMethod':{'sameWorldFraming':True,'sameCameraVerified':True,'pairs':12,'maxCameraError':max(r['maxError']for r in b['cameraComparisons']),'appearance':'Retained original geometry is shown with the same current purpose finish as the refined geometry. Historical original native/export bytes are stored separately.','lighting':'Studio + reference lighting + AO + bloom; local practical-light approximation disabled for both versions.','imageEditing':'None. Report boards only arrange the original editor captures.','clay':'12 front views use the editor solid-mode control. Palette-derived woven artwork remains visible, as recorded for LIFE-027.'},'conclusion':'12件完成第一轮参考形体、用途材质与导出打磨；不是最终效果图质量验收。保留逐件后续差距，不把技术通过换算为人工美术通过。'}
(root/'visual-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'viewed':len(views),'models':len(observations),'cameraMaxError':report['comparisonMethod']['maxCameraError']},ensure_ascii=False))
