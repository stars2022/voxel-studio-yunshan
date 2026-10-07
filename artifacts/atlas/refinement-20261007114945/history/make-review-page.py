from pathlib import Path
import json, html

loc=json.loads(Path('work/m001-refinement/production-location.json').read_text())
root=Path(loc['root'])
items=[
 ('LIFE-008','衣物收纳隔层','板材倒角、铜挂杆、背拉撑'),
 ('LIFE-009','梳妆镜架','石脚、镜枢轴、细灯条'),
 ('LIFE-019','桌面输入设备托板','独立键帽、圆旋钮、线缆'),
 ('LIFE-020','书桌灯','连续折臂、转轴、暖光灯窗'),
 ('LIFE-023','小圆凳','圆弧坐垫、外撇腿、独立抱箍'),
 ('LIFE-024','玄关鞋柜','倾斜翻斗、真实空腔、铜把手'),
 ('LIFE-025','墙面置物层板','木板倒角、铁护栏、背部挂板'),
 ('LIFE-026','窗帘挂轨','双轨、厚端帽、八组挂扣'),
 ('LIFE-027','窗帘帘片','连续褶面、六吊耳、真实织纹贴图'),
 ('LIFE-028','室内顶灯','天花固定盘、灯窗、铜压边'),
 ('LIFE-029','壁灯灯体','墙背板、悬臂、玻璃与光芯分层'),
 ('LIFE-030','室内电源／控制面板','五个真插孔、摇杆、分层显示面'),
]
def img(key):
 p='screenshots/'+key+'.png'
 return f'<a href="{p}"><img src="{p}" alt="{html.escape(key)}"></a>'
cards=''.join(f'<article>{img(i+"-after-material")}<div class="caption"><b>{i} · {name}</b><span>{detail}</span></div></article>'for i,name,detail in items)
def comparisons(rows):
 return ''.join(f'<article class="pair"><h3>{i} · {name}</h3><div class="pair-images"><figure>{img(i+"-before-material")}<figcaption>原母版 · 当前用途材质</figcaption></figure><figure>{img(i+"-after-material")}<figcaption>本轮打磨 · 相同机位／灯光</figcaption></figure></div></article>'for i,name,_ in rows)
sections=''.join(f'<section class="board" id="comparison-{n+1}"><header><div class="eyebrow">M001 / ACTUAL 3D VIEWS / {n+1:02d}</div><h2>形体前后对照</h2><p>每对图采用共同取景范围、相同相机与灯光；原生母版和原始截图完整保留。</p></header><div class="comparisons">{comparisons(items[n*6:n*6+6])}</div><footer>首轮参考打磨 · 还需继续细化场景配件、镜面反射与表面细节 · 人工美术验收未完成</footer></section>'for n in range(2))
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M001 · 首轮参考打磨</title><style>
*{box-sizing:border-box}body{margin:0;background:#dfe5e2;color:#263b36;font:16px/1.5 "Noto Sans CJK SC","Microsoft YaHei",sans-serif}main{max-width:1664px;margin:auto}nav{padding:22px 28px;display:flex;gap:24px;flex-wrap:wrap}a{color:inherit}nav a{text-decoration:none;border-bottom:1px solid #859a8c}.board{background:#f7f8f5;padding:28px;margin:0 0 28px;border:1px solid #cbd4ce}header{padding:8px 4px 23px}.eyebrow{font-size:13px;letter-spacing:3px;color:#617967}h1,h2{font-size:36px;line-height:1.2;margin:9px 0 12px;font-weight:700}header p{margin:0;color:#597166}article{background:#edf0eb;border:1px solid #d4dcd4;overflow:hidden;border-radius:8px}article img{display:block;width:100%;height:auto}.overview{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.caption{padding:13px 15px 15px;background:#fff}.caption b{display:block;font-size:16px}.caption span{display:block;font-size:13px;color:#66776b;margin-top:5px}.comparisons{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.pair h3{font-size:17px;margin:0;padding:13px 16px;background:#fff}.pair-images{display:grid;grid-template-columns:1fr 1fr;gap:2px}figure{margin:0}figcaption{padding:8px 12px;font-size:13px;background:#edf0eb;color:#4d6256}footer{padding:19px 4px 0;font-size:14px;color:#5d7265}.details{padding:26px;background:#f7f8f5;margin-bottom:28px}.details h2{font-size:28px}.detail-images{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.detail-images img,.reference{width:100%;height:auto;display:block}.notes{max-width:1150px}.notes p{margin:12px 0}.links{display:flex;gap:22px;flex-wrap:wrap;font-size:15px}@media(max-width:850px){.overview{grid-template-columns:repeat(2,1fr)}.comparisons{grid-template-columns:1fr}.board{padding:16px}h1,h2{font-size:28px}.detail-images{grid-template-columns:1fr}}
</style><main><nav><a href="#overview">12 件总览</a><a href="#comparison-1">前后对照 1</a><a href="#comparison-2">前后对照 2</a><a href="#woven">织纹与换色</a><a href="#reference">原参考图</a></nav>
'''
page+=f'<section class="board" id="overview"><header><div class="eyebrow">YUNSHAN / M001 / REFERENCE REFINEMENT · 01</div><h1>家居细部 · 首轮参考打磨</h1><p>12 件真实 3D 资产 · 最小块件 5mm · 连续斜面、倒角与曲面 · 材质用途可分别替换</p></header><div class="overview">{cards}</div><footer>实际编辑器截图 · 本轮 39 张逐张检查、12 对同机位对照 · 未计入人工美术验收</footer></section>'
page+=sections
page+='<section class="details" id="woven"><h2>真实帘布贴图与材质换色</h2><p>下缘回纹使用受光 PBR 贴图，包含颜色、法线和 ORM。修改布料用途颜色后，实际显示贴图更新；撤销恢复，几何与碰撞不变。</p><div class="detail-images">'
for key,label in [('woven-closeup','原织纹'),('woven-recolor','布料用途换色'),('woven-undo','撤销恢复')]:page+=f'<figure>{img("LIFE-027-"+key)}<figcaption>{label}</figcaption></figure>'
page+='</div></section><section class="details notes"><h2>本批范围与检查</h2><p>本批完成 M001 的首轮形体、材质和导出打磨；793 条参考的技术转化总数不增加。12 件母版与 1 份总览原生文件、12 件新 GLB、12 件历史原生和历史 GLB 均保留。</p><p>52 项回归检查通过。383 个连续组件闭合且有向，12 件组件接触图均连通；原生小件依附于真实几何。插座面板的五个孔洞实通。</p><p>仍需继续细化：镜面目前采用环境反射；柜体外壳、衣物、书盆和台面摆件依原清单保持独立。当前灯光、抽屉与控制面板是静态资产，人工美术验收未完成。</p><div class="links"><a href="validation.json">验证汇总</a><a href="visual-review.json">逐图检查</a><a href="browser-verification.json">接口与相机证据</a><a href="production.json">原生与导出记录</a></div></section>'
page+='<section class="details" id="reference"><h2>原参考图 M001</h2><img class="reference" src="../../../projects/reference-atlas/images/M001.png" alt="M001 原参考图"></section></main></html>'
(root/'review.html').write_text(page)
print(root/'review.html')
