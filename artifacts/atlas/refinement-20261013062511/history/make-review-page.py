from pathlib import Path
import json, html

w = Path('work/m004-refinement')
loc = json.loads((w / 'production-location.json').read_text())
root = Path(loc['root'])
v = json.loads((root / 'validation.json').read_text())
items = json.loads((w / 'asset-notes.json').read_text())

def img(key):
    f = 'screenshots/' + key + '.png'
    return f'<a href="{f}"><img src="{f}" alt="{html.escape(key)}"></a>'

cards = ''
for i, name, detail in items:
    geom = i + ('-after-top-clay' if i in ['LIFE-073', 'LIFE-075'] else '-after-front-clay')
    cards += f'<article>{img(i + "-after-material")}<div class="caption"><b>{i} · {html.escape(name)}</b><span>{html.escape(detail)}</span><div class="links"><a href="exports/{i}/visual.glb">GLB</a><a href="screenshots/{geom}.png">几何图</a><a href="../../../projects/{loc["run"]}-{i.lower()}.ysvox.json">原生文件</a></div></div></article>'

page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M004 · 商铺与物流配件精修</title><style>*{box-sizing:border-box}body{margin:0;background:#dfe5e2;color:#263b36;font:16px/1.5 "Noto Sans CJK SC","Microsoft YaHei",sans-serif}main{max-width:1664px;margin:auto}nav{padding:22px 28px;display:flex;gap:24px;flex-wrap:wrap}a{color:inherit}.board,.details{background:#f7f8f5;padding:28px;margin-bottom:28px;border:1px solid #cbd4ce}header{padding:8px 4px 23px}.eyebrow{font-size:13px;letter-spacing:3px;color:#617967}h1,h2{font-size:36px;line-height:1.2;margin:9px 0 12px}header p{margin:0;color:#597166}article{background:#edf0eb;border:1px solid #d4dcd4;overflow:hidden;border-radius:8px}img{display:block;width:100%;height:auto}.overview{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.caption{padding:13px 15px;background:#fff}.caption b,.caption span{display:block}.caption span,.caption a{font-size:13px;color:#66776b;margin-top:5px}.links{display:flex;gap:18px}.comparisons{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.pair h3{font-size:17px;margin:0;padding:13px 16px;background:#fff}.pair-images,.detail-images{display:grid;grid-template-columns:1fr 1fr;gap:2px}.detail-images{grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}figcaption{padding:8px 12px;font-size:13px}footer{padding:19px 4px 0;font-size:14px;color:#5d7265}.details h2{font-size:28px}@media(max-width:850px){.overview{grid-template-columns:repeat(2,1fr)}.comparisons,.detail-images{grid-template-columns:1fr}.board{padding:16px}h1,h2{font-size:28px}}</style><main><nav><a href="#overview">12 件总览</a><a href="#comparison-1">前后对照 1</a><a href="#comparison-2">前后对照 2</a><a href="#woven">织物细节</a><a href="#reference">参考图</a><a href="PACKAGE-DOWNLOAD.txt">资源包</a></nav>'''
page += f'<section class="board" id="overview"><header><div class="eyebrow">YUNSHAN / M004 / REFERENCE REFINEMENT · 01</div><h1>商铺与物流配件 · 参考精修</h1><p>12 件实际 3D 资产 · 最小块件 5mm · 连续坡面、薄壁褶皱与实际孔洞 · 材质用途独立</p></header><div class="overview">{cards}</div><footer>首轮参考打磨交付 · 原生 / GLB / 历史母版完整保留 · 最终美术验收另计</footer></section>'
for n in range(2):
    pairs = ''.join(f'<article class="pair"><h3>{i} · {html.escape(name)}</h3><div class="pair-images"><figure>{img(i + "-before-material")}<figcaption>旧几何 · 当前用途材质</figcaption></figure><figure>{img(i + "-after-material")}<figcaption>本轮精修 · 同机位与灯光</figcaption></figure></div></article>' for i, name, _ in items[n * 6:n * 6 + 6])
    page += f'<section class="board" id="comparison-{n + 1}"><header><div class="eyebrow">M004 / ACTUAL 3D VIEWS / {n + 1:02d}</div><h2>形体前后对照</h2><p>共同米制取景范围；逐项核相机位置、目标、四元数和投影矩阵。</p></header><div class="comparisons">{pairs}</div><footer>空盘 / 格条筐和封签 / 码板各为一份套件；箱体、托盘和绑带按独立清单分别交付。</footer></section>'
page += '<section class="details" id="woven"><h2>真实织边贴图与材质换色</h2><p>布棚织边为受光 PBR 颜色、法线和 ORM 贴图；奶白织线和同用途实体织边一起换色，蓝布及其他用途保持。换色与撤销不改变几何或碰撞。</p><div class="detail-images">'
for key, label in [('woven-closeup', '奶白织边'), ('woven-recolor', '织边换色'), ('woven-undo', '撤销恢复')]:
    page += f'<figure>{img("LIFE-070-" + key)}<figcaption>{label}</figcaption></figure>'
page += f'</div></section><section class="details"><h2>本批验证</h2><p>12 件新 GLB、13 份原生文档和 12 件历史母版保留；{v["triangles"]:,} 个显示三角形，{v["closedOrientedComponents"]} 个闭合有向组件。十件母版各为一个连接组，069 和 073 套件各有两个独立形体。</p><p>{v["regressionTests"]} 项回归与构建通过；39 张最终截图已逐张打开，包括 12 对同机位材质图、10 张正面与 2 张顶面几何图、3 张织边实拍。已核真实孔洞、材质用途、原生细件依附、公开创建、重建、撤销和失败回滚。</p><p>065 交付空陈列夹具和作者展示点，原库存契约作为来源保存，尚未绑定；标签登记条为作者图形。071 为木箱，076 为单条绑带；多箱、完整陈列、布料和锁扣运动及最终效果图验收继续打磨。</p><p><a href="validation.json">验证汇总</a> · <a href="visual-review.json">逐图检查</a> · <a href="browser-verification.json">相机与接口证据</a> · <a href="production.json">生产记录</a> · <a href="PACKAGE-DOWNLOAD.txt">资源包</a></p></section><section class="details" id="reference"><h2>原参考图 M004</h2><img src="../../../projects/reference-atlas/images/M004.png" alt="M004 原参考图"></section></main></html>'
(root / 'review.html').write_text(page)
print(root / 'review.html')
