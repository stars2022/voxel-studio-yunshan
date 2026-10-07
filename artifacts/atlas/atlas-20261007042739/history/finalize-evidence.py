from pathlib import Path
import hashlib,json,re,shutil
root=Path.cwd();scratch=root/'work/m060';read=lambda p:json.loads(p.read_text());latest=read(root/'artifacts/atlas/latest.json');out=root/latest['evidence']
v=read(out/'variant-verification.json');m=read(out/'variant-mcp-verification.json');pre=read(out/'previews.json');counts=read(out/'catalog-counts.json')
assert latest['run']=='atlas-20261007042739' and latest['kind']=='variant-batch'
assert v['status']==m['status']=='passed' and not pre['errors'] and len(v['records'])==32 and len(v['variants'])==25 and len(m['quarterTurns'])==32
assert len(m['specialPublicForms'])==3 and all(r['passed']for r in m['specialPublicForms'])
assert counts['atlasReferenceCandidates']==715 and counts['atlasVariantCandidates']==13 and counts['atlasVariantForms']==70 and counts['atlasAssemblyCandidates']==186 and counts['baseModels']==532
def count(text,key):
 match=re.search(r'(?:ℹ|#) '+key+r' (\d+)',text);assert match;return int(match[1])
full=(scratch/'tests-full.txt').read_text();target=(scratch/'tests-targeted.txt').read_text()
assert count(full,'tests')==count(full,'pass')==569 and count(full,'fail')==0 and read(scratch/'tests-full-exit.json')['exitCode']==0
assert count(target,'tests')==count(target,'pass')==6 and count(target,'fail')==0
assert 'built in' in (scratch/'build.txt').read_text() and not (scratch/'typecheck-final.txt').read_text().strip() and not (scratch/'typecheck-mcp-capture.txt').read_text().strip()
for name in ['validation-code-snapshot.json','pipeline-code-snapshot.json']:
 for file,sha in read(scratch/name).items():assert hashlib.sha256((root/file).read_bytes()).hexdigest()==sha,file
assert m['binding']['verifierSHA256']==read(scratch/'pipeline-code-snapshot.json')['scripts/verify-m060-buildings-mcp.ts']
assert [n['version']for n in m['notifications']]==m['expectedInvalidationVersions']
assert read(out/'visual-review.json')['status']=='reviewed-technical-candidates'
parents=read(out/'retained-parent-verification.json');assert parents['status']=='passed' and len(parents['checks'])==7
assert len({(p['parent'],p['program'])for p in parents['checks']})==4
records=v['records'];audits=[r['audit']for r in records]
report={'run':latest['run'],'status':'passed','subBatch':'M060 building dimension/floor variants','wholeSheetComplete':False,'sheetProducedReferences':7,'sheetReferenceCount':12,'fullRepositoryTests':569,'fullRepositoryPass':569,'fullRepositoryFail':0,'targetedTests':{'tests':6,'pass':6,'fail':0},'unresolvedFailures':0,'mcpCheckGroups':len(m['checks']),'publicQuarterTurns':len(m['quarterTurns']),'specialPublicParameterCreations':m['specialPublicForms'],'build':'passed','typecheck':'passed','defaultScreenshots':pre['imageCount'],'additionalMCPViews':len(m['views']),'defaultVariants':7,'finiteForms':32,'distinctGeometryConfigurations':v['distinctGeometryConfigurations'],'newBaseMasters':0,'newAssemblies':0,'defaultInstances':sum(r['instances']for r in latest['models']),'allFiniteFormInstances':sum(r['instances']for r in records),'stairWitnesses':sum(len(a['routes'])for a in audits),'wingLinkWitnesses':sum(len(a['links'])for a in audits),'floorWitnesses':sum(len(a['floors'])for a in audits),'columnWitnesses':sum(len(a['columns'])for a in audits),'roofGroups':sum(len(a['roofs'])for a in audits),'closedPartChecks':sum(len(c['closed'])for a in audits for c in a['components']),'nativeAttachmentChecks':sum(len(c['native'])for a in audits for c in a['components']),'independentlyReadGLBs':sum(len(r['exports'])for r in records),'maximumGLBBoundsErrorM':max(e['boundsErrorM']for r in records for e in r['exports']),'newRoles':0,'totalRoles':512,'sourceAndTestsUnchangedSinceFullSuiteStart':True,'mcpNotificationVersions':m['expectedInvalidationVersions'],'selectedHistoricalParentConfigurations':4,'humanArtAccepted':0,'scope':'Seven parameter variants of retained civic, bank, medical and waterfront parents. Explicit fixed interchange and known main-seed dimension fixtures; real medical H floor masks and continuous roof layers. Original Building/FloorPlan, capacity, door positions, seed algorithms, civicPlan and controller remain unavailable.','history':'First geometric probe found a floating-point zero-width edge tile next to the medical stair core. The paving helper now omits degenerate cut tiles while retaining bearing layers; all32forms and unchanged M059 default geometry/source definitions pass targeted tests. First preview launch used the default browser cache; rerun uses the already-installed workspace Chromium. MCP verifier checkpoints each completed form with source, script and screenshot hashes; no loss of a final in-memory report is used to infer missing checks.'}
assert report['independentlyReadGLBs']==96 and report['defaultScreenshots']==21
(out/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
history=out/'history';history.mkdir(exist_ok=True)
for p in scratch.iterdir():
 if p.is_file() and p.suffix in{'.txt','.json','.png','.ts','.py'} and not p.name.endswith('.ysvox.json') and not p.name.startswith('package-review') and 'staged-package' not in p.name and p.name not in {'package.txt'}:shutil.copy2(p,history/p.name)
verifiers=history/'verifiers';verifiers.mkdir(exist_ok=True)
for file in read(scratch/'pipeline-code-snapshot.json'):shutil.copy2(root/file,verifiers/Path(file).name)
for source,target in [('tests-full.txt','tests.txt'),('tests-targeted.txt','tests-targeted.txt'),('build.txt','build.txt'),('typecheck-mcp-capture.txt','typecheck.txt'),('validation-code-snapshot.json','validation-code-snapshot.json')]:shutil.copy2(scratch/source,out/target)
doc=root/'docs/M060-BUILDING-VARIANTS.md';text=doc.read_text();marker='\n<!-- verified-results -->\n';text=text.split(marker)[0]
text+=marker+'\n整库569项测试、6项专项、构建和类型检查通过。实际MCP完成'+str(len(m['checks']))+'组检查，32种形态逐一旋转并撤销，另通过公开命令创建固定换乘殿、已知主种子航站楼及15层市场钱庄。96份近景、远档和材质GLB独立读回；最大米制边界误差'+str(report['maximumGLBBoundsErrorM'])+'m。\n\n实际几何核验包含'+str(report['stairWitnesses'])+'个梯级/平台承脚与上身点、'+str(report['wingLinkWitnesses'])+'个翼楼连接点、'+str(report['columnWitnesses'])+'个柱脚、'+str(report['roofGroups'])+'组屋面承接，以及全部新增闭合组件与原生细件接触。21张默认视图、'+str(len(m['views']))+'张MCP视图和覆盖32形态的3页实图表随证据保存。\n\n本批包保留四种实际父配置，包括医疗母版的历史原生、GLB、接口及碰撞导出；它们与新形态的递归依赖一并交付。原始失败日志也保留，未把父屋面外观限制或原游戏未绑定状态改写为通过。\n'
doc.write_text(text);print(json.dumps(report,ensure_ascii=False))
