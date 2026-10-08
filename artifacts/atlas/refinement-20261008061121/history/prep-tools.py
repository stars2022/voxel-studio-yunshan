from pathlib import Path
src=Path('work/m001-refinement');dest=Path('work/m002-refinement')
for name in ['audit-retained-exports.ts','capture-review-page.mjs','package-refinement.py']:
 s=(src/name).read_text().replace('m001-refinement','m002-refinement').replace('M001','M002').replace('m001-gallery','m002-gallery').replace('LIFE-027','LIFE-031').replace('帘布三张','地毯三张')
 (dest/name).write_text(s)
