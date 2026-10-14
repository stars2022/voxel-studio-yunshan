from pathlib import Path
import json, html

w = Path('work/m008-refinement')
loc = json.loads((w / 'production-location.json').read_text())
root = Path(loc['root'])
v = json.loads((root / 'validation.json').read_text())
items = json.loads((w / 'asset-notes.json').read_text())

def img(key):
    f = 'screenshots/' + key + '.png'
    return f'<a href="{f}"><img src="{f}" alt="{html.escape(key)}"></a>'

cards = ''
for i, name, detail in items:
    geom = i + ('-after-top-clay' if i in ['LIFE-125', 'LIFE-127', 'LIFE-141', 'LIFE-142', 'LIFE-143'] else '-after-front-clay')
    cards += f'<article>{img(i + "-after-material")}<div class="caption"><b>{i} · {html.escape(name)}</b><span>{html.escape(detail)}</span><div class="links"><a href="exports/{i}/visual.glb">GLB</a><a href="screenshots/{geom}.png">几何图</a><a href="../../../projects/{loc["run"]}-{i.lower()}.ysvox.json">原生文件</a></div></div></article>'

page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M008 · 医疗与公共事务器具精修</title><style>*{box-sizing:border-box}body{margin:0;background:#dfe5e2;color:#263b36;font:16px/1.5 "Noto Sans CJK SC","Microsoft YaHei",sans-serif}main{max-width:1664px;margin:auto}nav{padding:22px 28px;display:flex;gap:24px;flex-wrap:wrap}a{color:inherit}.board,.details{background:#f7f8f5;padding:28px;margin-bottom:28px;border:1px solid #cbd4ce}header{padding:8px 4px 23px}.eyebrow{font-size:13px;letter-spacing:3px;color:#617967}h1,h2{font-size:36px;line-height:1.2;margin:9px 0 12px}header p{margin:0;color:#597166}article{background:#edf0eb;border:1px solid #d4dcd4;overflow:hidden;border-radius:8px}img{display:block;width:100%;height:auto}.overview{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.caption{padding:13px 15px;background:#fff}.caption b,.caption span{display:block}.caption span,.caption a{font-size:13px;color:#66776b;margin-top:5px}.links{display:flex;gap:18px}.comparisons{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.pair h3{font-size:17px;margin:0;padding:13px 16px;background:#fff}.pair-images,.detail-images{display:grid;grid-template-columns:1fr 1fr;gap:2px}.detail-images{grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}figcaption{padding:8px 12px;font-size:13px}footer{padding:19px 4px 0;font-size:14px;color:#5d7265}.details h2{font-size:28px}@media(max-width:850px){.overview{grid-template-columns:repeat(2,1fr)}.comparisons,.detail-images{grid-template-columns:1fr}.board{padding:16px}h1,h2{font-size:28px}}</style><main><nav><a href="#overview">12 件总览</a><a href="#comparison-1">前后对照 1</a><a href="#comparison-2">前后对照 2</a><a href="#mark">标记细节</a><a href="#reference">参考图</a><a href="PACKAGE-DOWNLOAD.txt">资源包</a></nav>'''
page += f'<section class="board" id="overview"><header><div class="eyebrow">YUNSHAN / M008 / REFERENCE REFINEMENT · 01</div><h1>医疗与公共事务器具 · 参考精修</h1><p>12 件实际 3D 资产 · 最小块件 5mm · 连续曲面、实际孔洞与真实图形贴图 · 材质用途独立</p></header><div class="overview">{cards}</div><footer>首轮参考打磨交付 · 原生 / GLB / 历史母版完整保留 · 最终美术验收另计</footer></section>'
for n in range(2):
    pairs = ''.join(f'<article class="pair"><h3>{i} · {html.escape(name)}</h3><div class="pair-images"><figure>{img(i + "-before-material")}<figcaption>旧几何 · 当前用途材质</figcaption></figure><figure>{img(i + "-after-material")}<figcaption>本轮精修 · 同机位与灯光</figcaption></figure></div></article>' for i, name, _ in items[n * 6:n * 6 + 6])
    page += f'<section class="board" id="comparison-{n + 1}"><header><div class="eyebrow">M008 / ACTUAL 3D VIEWS / {n + 1:02d}</div><h2>形体前后对照</h2><p>共同米制取景范围；逐项核相机位置、目标、四元数和投影矩阵。</p></header><div class="comparisons">{pairs}</div><footer>平行双栏为一套两组，会议桌与六椅为一套七组；其他柜体和设备按各自母版范围交付。</footer></section>'
page += '<section class="details" id="mark"><h2>公告图形与像素用途换色</h2><p>公告标题、公共图标与三卡片为静态作者图形；换色仅改青色像素用途，白卡、深底、玻璃、框架与几何保持，撤销恢复。</p><div class="detail-images">'
for key, label in [('notice-closeup', '原公告图形'), ('notice-recolor', '青色像素换色'), ('notice-undo', '撤销恢复')]:
    page += f'<figure>{img("LIFE-140-" + key)}<figcaption>{label}</figcaption></figure>'
page += f'</div></section><section class="details"><h2>本批验证</h2><p>12 件新 GLB、13 份原生文档和 12 件历史母版保留；{v["triangles"]:,} 个显示三角形，{v["closedOrientedComponents"]} 个闭合有向组件。十件母版各一个连接组；126平行栏两组、141桌与六椅七组，均不新增清单母版。</p><p>{v["regressionTests"]} 项回归与构建通过；39 张最终截图已逐张打开，包括 12 对同机位材质图、7 张正面与 5 张顶面几何图、3 张公告图形换色/撤销实拍。已核真实孔洞、材质用途、原生细件依附、公开创建、重建、撤销和失败回滚。</p><p>医疗支架、担架、平行栏、洗台及公共事务显示/家具按原范围保留。输液、流体、消毒、身份、投票、档案内容、音频、电力和原游戏状态未绑定，光学面保持零发光。设备细部、透明表现和材料磨耗继续打磨；最终效果图验收另计。</p><p><a href="validation.json">验证汇总</a> · <a href="visual-review.json">逐图检查</a> · <a href="browser-verification.json">相机与接口证据</a> · <a href="production.json">生产记录</a> · <a href="PACKAGE-DOWNLOAD.txt">资源包</a></p></section><section class="details" id="reference"><h2>原参考图 M008</h2><img src="../../../projects/reference-atlas/images/M008.png" alt="M008 原参考图"></section></main></html>'
(root / 'review.html').write_text(page)
print(root / 'review.html')
