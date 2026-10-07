import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path.cwd();w=root/'work/lod-variants';o=root/'artifacts/atlas/atlas-20261007090922';r=json.loads((o/'variant-mcp-verification.json').read_text())
if '--partial' in sys.argv:
 sources=list(dict.fromkeys(x['audit']['sourceCatalogId'] for x in json.loads((o/'variant-verification.json').read_text())['records']))
 r={'views':[{'key':'lod-'+s+'-'+v,'time':'night' if v=='night' else 'day','file':'variant-lod-'+s+'-'+v+'.png'} for s in sources for v in ['front','isometric','night']]}
else:assert r['status']=='passed' and len(r['views'])==60
for start in range(0,60,6):
 rows=r['views'][start:start+6]
 if not all((o/row['file']).exists() for row in rows):continue
 canvas=Image.new('RGB',(1800,1080),'#e8ebe7');draw=ImageDraw.Draw(canvas)
 for j,row in enumerate(rows):
  img=Image.open(o/row['file']).convert('RGB');img.thumbnail((594,500));x=j%3*600+(600-img.width)//2;y=j//3*540+30;canvas.paste(img,(x,y));draw.text((j%3*600+12,j//3*540+10),row['key']+' / '+row['time'],fill='#182e25')
 canvas.save(w/f'mcp-review-{start//6+1:02}.png')
print('Available review boards created from actual MCP images')
