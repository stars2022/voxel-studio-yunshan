"""Read the complete reference index and actual native/GLB deliverables, without changing them."""
from pathlib import Path
from collections import Counter
import argparse,hashlib,json,struct
p=argparse.ArgumentParser();p.add_argument('--allow-incomplete',action='store_true');p.add_argument('--output',type=Path,required=True);args=p.parse_args()
root=Path.cwd();read=lambda f:json.loads(f.read_text());digest=lambda b:hashlib.sha256(b).hexdigest()
atlas=read(root/'projects/reference-atlas/index.json');index=read(root/'projects/atlas-production-index.json');latest=read(root/'artifacts/atlas/latest.json')
refs={r['id']:r for r in atlas['entries']};entries={r['id']:r for r in index['entries']};assert len(refs)==len(atlas['entries'])==793;assert len(entries)==len(index['entries']);assert not entries.keys()-refs.keys()
missing=sorted(refs.keys()-entries.keys());assert args.allow_incomplete or not missing,missing
records=[]
for id,r in entries.items():
 reference=refs[id];assert r['sheet']==reference['sheet'] and r['slot']==reference['slot'];assert r['referenceSHA256']==reference['imageSHA256']
 main=root/'projects'/r['file'];native_bytes=main.read_bytes();native=json.loads(native_bytes);directory=root/'projects/production'/r['file'][:20]/'exports'/id
 if r.get('kind') in ['assembly','variant']:assert r['assemblyId'] in native['assemblies']
 else:assert r['assetId'] in native['assets']
 files=[]
 for name in ['voxels.ysvox.json','interfaces.json','collision.json','visual.glb']:
  f=directory/name;b=f.read_bytes();files.append({'file':str(f.relative_to(root)),'bytes':len(b),'sha256':digest(b)})
  if name=='visual.glb':
   assert struct.unpack_from('<4sII',b)==(b'glTF',2,len(b));n,kind=struct.unpack_from('<II',b,12);assert kind==0x4e4f534a;doc=json.loads(b[20:20+n]);assert doc.get('scenes') and doc.get('nodes') and doc.get('meshes')
   assert all(not image.get('uri') for image in doc.get('images',[]));assert all(not buffer.get('uri') for buffer in doc.get('buffers',[]));assert all(view.get('byteOffset',0)+view['byteLength']<=doc['buffers'][view.get('buffer',0)]['byteLength'] for view in doc.get('bufferViews',[]))
   primitives=[p for mesh in doc['meshes'] for p in mesh['primitives']];assert primitives and all('POSITION'in p['attributes'] for p in primitives);triangles=sum(doc['accessors'][p['indices']]['count']//3 if 'indices'in p else doc['accessors'][p['attributes']['POSITION']]['count']//3 for p in primitives if p.get('mode',4)==4);assert triangles>0
  else:
   data=json.loads(b)
   if name=='voxels.ysvox.json':assert data.get('assets') and data.get('materials')
 records.append({'id':id,'sheet':r['sheet'],'slot':r['slot'],'kind':r.get('kind','shared-reference' if r.get('primaryMasterId') else 'base'),'nativeFile':str(main.relative_to(root)),'nativeBytes':len(native_bytes),'nativeSHA256':digest(native_bytes),'exports':files,'actualGLBTriangles':triangles,'referenceSHA256':r['referenceSHA256']})
 if len(records)%100==0:print('Verified',len(records),'actual reference deliverables',flush=True)
expected=Counter(r['sheet'] for r in refs.values());actual=Counter(r['sheet'] for r in entries.values());sheets=[{'sheet':s,'expected':expected[s],'actual':actual[s],'complete':actual[s]==expected[s]}for s in sorted(expected)]
report={'status':'passed','run':latest['run'],'referenceCount':793,'convertedReferences':len(records),'missingReferences':missing,'completeSheets':sum(s['complete']for s in sheets),'sheets':sheets,'nativeFilesRead':len(records),'actualGLBsRead':len(records),'exportFilesHashed':4*len(records),'records':records,'humanArtAccepted':0,'scope':'Actual native projects and four portable export files read and hashed for every indexed reference; binary GLB headers, embedded resources, buffer ranges and nonempty triangle primitives checked. This completeness audit does not replace per-batch geometry/material tests or reference-art refinement.'}
args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ['records','sheets']},ensure_ascii=False))
