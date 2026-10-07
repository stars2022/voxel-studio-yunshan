from pathlib import Path
import json,hashlib,shutil,struct
root=Path.cwd();scratch=root/'work/m059-buildings';read=lambda p:json.loads(p.read_text());latest=read(root/'artifacts/atlas/latest.json');out=root/latest['evidence'];formal=read(out/'variant-verification.json');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
original=root/'scripts/verify-building-variants-mcp.ts';snap=read(scratch/'pipeline-code-snapshot.json');assert sha(original)==snap[str(original.relative_to(root))]
for f,digest in read(scratch/'validation-code-snapshot.json').items():assert sha(root/f)==digest
lines=(scratch/'mcp.txt').read_text().splitlines();expected=['read_production_library OK','list_production_recipes OK','list_assets OK'];views=[]
def view(key,stage):
 p=out/('variant-'+key+'.png');data=p.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';width,height=struct.unpack('>II',data[16:24]);assert width>200 and height>200
 row={'key':key,'file':p.name,'sha256':sha(p),'dimensions':[width,height],'evidence':stage};views.append(row)
for row in latest['models']:
 expected+=['load_project OK','edit_transaction OK','edit_transaction OK'];view(row['id']+'-back','original default capture')
 if row['id']!='BUILT-026':
  view(row['id']+'-first-floor-cutaway','original default cutaway');view(row['id']+'-stair-component','original default source-component capture')
for row in formal['records']:
 expected+=['load_project OK']+['edit_transaction OK']*4
 if not row['isDefault']:
  expected+=['edit_transaction OK']*2;view(row['id']+'-'+'-'.join(str(v)for v in row['params'].values()),'original finite-form capture')
loop_end=len(expected);assert loop_end==275 and len(views)==48
# The next stages are reachable only after the serial38-form loop and every contained assertion.
expected+=['load_project OK']+['edit_transaction OK']*3+['edit_transaction ERROR']*5+['edit_transaction OK']*2+['export_project OK']+['edit_transaction OK']*4+['load_project OK','query_voxels OK']+['edit_transaction OK']*4
assert len(expected)==297 and lines==expected
for key in ['farm-public-create','farm-quarter-turn','farm-purpose-palette']:view(key,'original interrupted public-case capture; repeated in completion run')
last=formal['records'][-1];assert sha(out/'variant-mcp-runtime/finite-form.ysvox.json')==sha(root/last['directory']/'voxels.ysvox.json')
export_dirs=list((out/'variant-mcp-runtime/exports').glob('building-variant-quarter-turn-*'));assert len(export_dirs)==1
export_hashes=[{'file':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(export_dirs[0].iterdir())if p.is_file()]
shutil.copy2(original,scratch/'mcp-interrupted-source.ts');shutil.copy2(scratch/'mcp.txt',scratch/'mcp-interrupted.txt')
for row in views[-3:]:shutil.copy2(out/row['file'],scratch/('interrupted-'+row['file']))
report={'run':latest['run'],'status':'completed-prefix-verified','overallMCPStatus':'interrupted-before-final-report','originalVerifier':str(original.relative_to(root)),'originalVerifierSHA256':sha(original),'log':'history/mcp-interrupted.txt','logSHA256':sha(scratch/'mcp.txt'),'exactExpectedLogLines':297,'serial38FormLoopEndLine':275,'proof':'The297-line log matches the unchanged verifier operation sequence exactly, including the five intentional rejection cases. Subsequent public creation/export/query/palette calls are reachable only after all38 serial quarter-turn/undo assertions and48 capture assertions. The final finite-form runtime native bytes match the final verified shape. No final save/restart or near/far assertion is inferred from the interrupted suffix; these and public cases are repeated in the completion run. Original browser triangle counts and notification data were held in memory and are not invented.','quarterTurns':[{'id':r['id'],'params':r['params'],'passed':True,'evidence':'verified original control-flow prefix; see interrupted-mcp-recovery.json'}for r in formal['records']],'views':views,'completedCaptureCount':51,'originalPublicExportFiles':export_hashes,'sourceAndTestsUnchanged':True}
(out/'interrupted-mcp-recovery.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':report['status'],'logLines':297,'recoveredQuarterTurns':38,'captures':51}))
