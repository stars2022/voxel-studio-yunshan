import hashlib,io,json,pathlib,subprocess,sys,zipfile
from urllib.parse import quote
root=pathlib.Path.cwd();out=root/json.loads((root/'artifacts/atlas/latest.json').read_text())['evidence']
info=json.loads((out/'batch-package.json').read_text())
parts=info.get('archiveParts',[{'file':info['archive'],'bytes':info['archiveBytes'],'sha256':info['archiveSHA256']}])
staged='--staged' in sys.argv
chunks=[]
for part in parts:
    path=out/part['file'];relative=path.relative_to(root).as_posix()
    data=subprocess.check_output(['git','show',':'+relative]) if staged else path.read_bytes()
    assert len(data)==part['bytes'] and hashlib.sha256(data).hexdigest()==part['sha256'],relative
    chunks.append(data)
payload=b''.join(chunks)
assert len(payload)==info['archiveBytes'] and hashlib.sha256(payload).hexdigest()==info['archiveSHA256']
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    assert archive.testzip() is None
    manifest=json.loads(archive.read('batch-manifest.json'))
    assert manifest['candidateReferences']==6 and manifest['finiteForms']==6 and manifest['candidateMasters']==0
    assert len(manifest['dependencies'])>0
    assert {'CHAR-023','CHAR-066','CHAR-069','CHAR-068'} <= {d['id'] for d in manifest['dependencies']}
    assert manifest['wholeSheetComplete'] and manifest['sheetProducedReferences']==12 and manifest['sheetReferenceCount']==12
    assert manifest['newMaterialEntries']==1 and manifest['additionalMaterialParents'][0]['id']=='CHAR-023'
    assert manifest['sheets']==[{'sheet':'M062','produced':12,'references':12}]
    assert len(manifest['selectedParentConfigurations'])==4
    assert {p['parent'] for p in manifest['selectedParentConfigurations']}=={'CHAR-023','CHAR-066','CHAR-069','CHAR-068'}
    for row in manifest['files']:
        contents=archive.read(row['path'])
        assert len(contents)==row['bytes'] and hashlib.sha256(contents).hexdigest()==row['sha256'],row['path']
        actual=subprocess.check_output(['git','show',':'+row['path']]) if staged else (root/row['path']).read_bytes()
        assert hashlib.sha256(actual).hexdigest()==row['sha256'],row['path']
    assert len(archive.namelist())==len(manifest['files'])+3
review={'status':'passed','run':info['run'],'source':'git index bytes' if staged else 'working tree bytes','crc':'passed','manifestHashesVerified':len(manifest['files']),'archiveBytes':len(payload),'archiveSHA256':info['archiveSHA256'],'partCount':len(parts),'references':6,'finiteForms':6,'newMaterialEntries':1,'newBaseMasters':0,'dependencies':len(manifest['dependencies']),'catalogContractReferencesOnly':len(manifest['catalogContractReferences'])}
if staged:
    (root/'work/face-atlas/staged-package-verification.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
else:
    (out/'package-verification.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
    base='https://github.com/stars2022/voxel-studio-yunshan/raw/main/'+out.relative_to(root).as_posix()+'/'
    download={'sheets':['M062'],'subBatch':'shared-six-cell-face-atlas','wholeSheetComplete':True,'run':info['run'],'status':'validated-technical-candidates','assemblies':0,'variants':6,'finiteForms':6,'newMaterialEntries':1,'newBaseMasters':0,'recursiveDependencies':len(manifest['dependencies']),'humanArtAccepted':0,'format':'split ZIP' if len(parts)>1 else 'ZIP','instructions':'下载全部分卷，按编号顺序合并后解压；也可用7-Zip打开.001。' if len(parts)>1 else '下载ZIP后直接解压。','details':'PACKAGE-DOWNLOAD.txt','files':[{**part,'url':base+quote(part['file'])} for part in parts],'completeArchiveSHA256':info['archiveSHA256'],'verification':'package-verification.json'}
    (out/'downloads.json').write_text(json.dumps(download,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(review,ensure_ascii=False))
