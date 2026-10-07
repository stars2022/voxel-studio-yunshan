import hashlib,json,re,shutil
from pathlib import Path
root=Path.cwd();out=root/'artifacts/atlas/atlas-20261007070928';work=root/'work/age-variants';history=out/'history';history.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
v=read(out/'variant-verification.json');m=read(out/'variant-mcp-verification.json');pr=read(out/'previews.json');parents=read(out/'retained-parent-verification.json');material=read(out/'material-audit.json');counts=read(out/'catalog-counts.json')
assert all(r['status']=='passed' for r in [v,m,parents,material]);assert not m['errors'] and not pr['errors']
assert len(m['publicForms'])==len(m['quarterTurns'])==2 and pr['imageCount']==36 and pr['reusedImages']==30 and len(m['views'])==6
assert [n['version'] for n in m['notifications']]==m['expectedInvalidationVersions'] and len(m['notifications'])==19
snapshot=read(work/'validation-source-snapshot.json');assert len(snapshot)==377
changed={p:{'before':h,'after':digest(root/p)} for p,h in snapshot.items() if digest(root/p)!=h}
assert set(changed)=={'tests/atlas-domestic.test.ts','tests/atlas-structure.test.ts'}
write(work/'classification-assertion-correction.json',{'status':'passed','reason':'Two existing BUILT-only query assertions included every catalogVariantId; first CHAR variants exposed that incorrect expectation. Filter the expected variant IDs by the query prefix. Production code and the other 375 source/test files are unchanged.','changes':changed,'productionUnchanged':True,'affectedFilesRerunInFull':list(changed)})
write(work/'final-source-snapshot.json',{p:digest(root/p)for p in snapshot})
def summary(p):
 log=p.read_text();return {k:int(re.search(r'ℹ '+k+r' (\d+)',log).group(1)) for k in ['tests','pass','fail','cancelled','skipped','todo']}
initial=summary(work/'regression-tests.txt');repeat=summary(work/'classification-regression-rerun.txt')
assert initial=={'tests':125,'pass':123,'fail':2,'cancelled':0,'skipped':0,'todo':0}
assert repeat['tests']==repeat['pass'] and all(repeat[k]==0 for k in ['fail','cancelled','skipped','todo'])
assert '✓ built in' in (work/'build.txt').read_text()
for file in ['typecheck-initial.txt','typecheck-audit.txt','typecheck-pipeline.txt','typecheck-mcp.txt','typecheck-final.txt']:assert not (work/file).read_text().strip()
for file in ['preview-runtime-archive-verification.json','preview-cas-verification.json','mcp-runtime-archive-verification.json','mcp-cas-verification.json']:assert read(work/file)['status']=='passed'
for p in work.iterdir():
 if p.is_file() and (p.suffix in ['.txt','.json','.py','.ts']) and not p.name.endswith('.ysvox.json'):shutil.copy2(p,history/p.name)
for p in work.glob('draft-*.png'):shutil.copy2(p,history/p.name)
shutil.copy2(root/'work/maintenance/abandoned-pack-20261007.json',history/'abandoned-pack-20261007.json')
verifiers=history/'verifiers';verifiers.mkdir(exist_ok=True)
for file in ['scripts/verify-age-variants.ts','scripts/verify-age-variants-mcp.ts','scripts/verify-age-parents.ts','scripts/produce-reference-variants.ts','scripts/preview-reference-atlas.ts','scripts/package-variant-batch.py']:
 shutil.copy2(root/file,verifiers/Path(file).name)
write(history/'executed-script-hashes.json',{p.name:digest(p)for p in verifiers.iterdir()if p.is_file()})
write(out/'source-reference-review.json',read(work/'reference-review.json'))
default=[]
for row in pr['items']:
 for view,file in row['files'].items():
  reused=row['id'].startswith('BUILT-')
  default.append({'id':row['id'],'view':view,'file':'screenshots/'+file,'sha256':digest(out/'screenshots'/file),'reviewed':True,'reviewMethod':'Historical passed review reused after exact native/material/browser/renderer checks' if reused else 'individual captured PNG opened','reused':reused,**({'priorEvidence':'artifacts/atlas/atlas-20261007063858/visual-review.json','reuseEvidence':row['reuseEvidence']} if reused else {}),'note':'原始组件、独立头身比例、落地脚套及真实颈口可见；站姿中性覆衣，不作原图服装/坐姿宣称。' if not reused else '沿用已审首批默认；完整原生同一性详见previews.json。'})
views=[{**row,'reviewed':True,'accepted':True,'reviewMethod':'individual captured PNG opened','note':'真实背部/侧面或同米制地面下0.6m婴儿、1m幼儿、1.755m历史成人；成人不是未来1.8m变体。'} for row in m['views']]
write(out/'visual-review.json',{'status':'passed','run':v['run'],'defaultViews':default,'additionalViews':views,'boardsAndUI':[{'file':f,'sha256':digest(out/f),'opened':True}for f in ['M061.png','materials.png','atlas-editor.png']],'scope':'Six new defaults and all six MCP views individually opened; thirty earlier defaults reused with exact source/renderer proofs. Same-scale comparison includes the actual retained adult master. Technical candidates; human art acceptance0.'})
validation={'run':v['run'],'status':'passed','subBatch':'M061 infant and preschool age-height variants','wholeSheetComplete':True,'sheetProducedReferences':12,'sheetReferenceCount':12,'sheetFiniteFormsAcrossBothBatches':27,'regressionTests':{'tests':125,'pass':125,'fail':0,'cancelled':0,'skipped':0,'todo':0},'regressionExecution':{'initial':initial,'initialDurationMs':366538.381629,'affectedFilesRerun':repeat,'initialLog':'history/regression-tests.txt','rerunLog':'history/classification-regression-rerun.txt','combination':'125 distinct tests passed across the initial run and complete rerun of both corrected assertion files. Only those two tests changed; no production source changed.'},'newBatchTestsIncluded':4,'regressionTestFiles':['tests/'+f+'.test.ts'for f in ['core','catalog','production','material-roles','atlas-domestic','atlas-structure','atlas-building-variants','atlas-m060-buildings','atlas-roof-wall-variants','atlas-legacy-variants','atlas-age-variants','atlas-figure','atlas-avatar','rig']],'historicalFullRepositoryBaseline':{'commit':'a31c7202fa58cc8ecb58d68e7f125bbc013361a3','tests':575,'pass':575,'fail':0,'evidence':'artifacts/atlas/atlas-20261007054954/validation.json','rerunInThisBatch':False},'immediatePreviousBatch':{'commit':'7711e29d04aa2a9974bdea04f6f35bb754e33e66','regressions':99,'evidence':'artifacts/atlas/atlas-20261007063858/validation.json'},'unresolvedAssetFailures':0,'build':'passed','typecheck':'passed','mcpCheckGroups':len(m['checks']),'publicParameterCreations':2,'publicQuarterTurns':2,'mcpNotificationVersions':m['expectedInvalidationVersions'],'maximumNotificationBytes':max(n['bytes']for n in m['notifications']),'defaultScreenshots':36,'newDefaultScreenshots':6,'reusedDefaultScreenshots':30,'additionalMCPViews':6,'defaultVariants':2,'finiteForms':2,'distinctShapeConfigurations':2,'distinctPhysicalGeometryConfigurations':0,'distinctGeometryMaterialConfigurations':2,'newBaseMasters':0,'newAssemblies':0,'defaultInstances':sum(r['instances']for r in v['records']if r['isDefault']),'allFiniteFormInstances':sum(r['instances']for r in v['records']),'independentlyReadGLBs':sum(len(r['exports'])for r in v['records']),'maximumGLBBoundsErrorM':max(x['boundsErrorM']for r in v['records']for x in r['exports']),'newRoles':0,'totalRoles':512,'selectedHistoricalParentChecks':len(parents['checks']),'productionUnchangedSinceRegressionStart':True,'frozenSourceAndTestFiles':len(snapshot),'unchangedSourceAndTestFiles':375,'changedTestAssertions':changed,'sourceSnapshotSHA256':digest(work/'validation-source-snapshot.json'),'finalSourceSnapshotSHA256':digest(work/'final-source-snapshot.json'),'referenceCandidates':732,'remainingReferences':61,'completeSheets':61,'humanArtAccepted':0,'scope':'Exact0.6m/1m independent age body/head assemblies with original adult001 and061/062/067 sources retained. Only preschool installed body Y dimensions change; native5mmislands move rigidly. Static neutral clothing, real soles and neck interface; zero collision/emission, no identity/age/runtime controller binding.','history':'Initial production stopped at directory creation because an abandoned unindexed Git temp pack filled disk; no assets or indexes changed. git fsck passed and only that verified unused temporary pack was removed. Initial125regressions found two BUILT query test assertions that counted CHAR variants; their expected classification was corrected and both files rerun. Original failures and storage evidence retained.'}
assert validation['defaultInstances']==4 and validation['allFiniteFormInstances']==4 and validation['independentlyReadGLBs']==6
write(out/'validation.json',validation)
goal=read(root/'projects/conversion-goal.json');goal['progress'].update(referenceCandidates=732,remainingReferenceEntries=61,completedReferenceSheets=61,catalogCounts=counts)
goal['activeBatch']={'sheet':'M062','subBatch':'age-face-skin-variants','state':'queued','ids':['CHAR-019','CHAR-020','CHAR-021',*[f'CHAR-{n:03}'for n in range(24,33)]],'scope':'1.2/1.6/1.8m年龄、023真实192×16RGBA父面部图谱和024–029六UV单元、030–032肤色。'}
goal['lastCompletedBatch']={'sheet':'M061','subBatch':'infant-preschool-age-variants','run':v['run'],'state':'validated','wholeSheetComplete':True,'sheetProducedReferences':12,'sheetReferenceCount':12,'evidence':out.relative_to(root).as_posix()}
goal['limitations'][-1]='M001–M061完整，累计732条技术候选，余61。513独立图册母版、3共享引用、186图册组合、30变体参考/111有限形态，完整图册61张，人工美术验收0。'
goal['nextBatchNotes']=[
 '用户修正持续优先：最小组件体素，斜面和曲面连续，天空/星空使用真实贴图。',
 'M061完整12/12，两个子批合27形态。最新017/018两个年龄形态通过6实际GLB、6历史父件、2次公开创建/旋转撤销、19精确通知；125项相关测试跨初跑及两文件修正复跑通过。575整库通过仅是a31c7202历史基线。',
 '累计732/793，余61；基础533、组合186、变体34类/120形态、已生成756条、未制作312条。',
 '017使用原061和067infant，018安装身体由062纵向派生到1m，原062保留、原生细件按整数格刚性移动；头部不缩放。只有中性全覆衣站姿和衣套端部，原图坐姿/发型/背包未宣称。',
 'CHAR019/020/021继续独立063/064/059身体及068/066头，实际全高1.2/1.6/1.8m；不能统一缩小成人001。完整原001及源身体/头保留。',
 'CHAR023是材质贴图而非基础组件，真实192×16RGBA六格atlas缺失，须先交付非图册材质父件并在类型/索引/包中如实计数。024–029复用同图谱UV单元；030–034是同用途肤色。',
 '公开变体schema已支持BUILT与CHAR；ENV/LIFE后续须显式扩展。512语义用途上限保持，不能把脸贴图借用大气water材质通道。',
 '每批验证后推送origin/main已授权；完成子批不停止总目标。正式验证冻结生产代码，浏览器串行且设置PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright。',
 '磁盘紧张：仅归档已关闭scratch并校验可逐字节还原。Git本地gc.auto=0、maintenance.auto=false，防止大临时包复发；不删正式资产或历史对象。'
];write(root/'projects/conversion-goal.json',goal)
p=root/'README.md';lines=p.read_text().splitlines();lines[6]='67 张完整图册已接入「图册」页，793 条参考逐 ID 对齐。M001–M061 累计 **732 个参考 ID（513 个独立图册母版、3 条共享引用、186 个组合模板、30 类参数变体）**已制作为候选，其余 61 条待制作或复核，人工美术验收为 0。[模型与历史记录](docs/ATLAS-PRODUCTION.md) · [M061 婴儿与幼儿身高](docs/M061-AGE-VARIANTS.md) · [本批总览](artifacts/atlas/atlas-20261007070928/M061.png)。本子批 2 条参考、2 种形态；M061 两批共 12 条参考、27 种形态，完整图册 61 张。合并旧库基础候选 533；实例、换色及参数形态不增加基础资产数。';p.write_text('\n'.join(lines)+'\n')
p=root/'docs/ATLAS-PRODUCTION.md';lines=p.read_text().splitlines();lines[2]='M001–M061 累计 **732/793** 条参考候选，剩余 61 条；完整图册 61 张，人工美术验收 0。最新 [M061 婴儿与幼儿身高](M061-AGE-VARIANTS.md)、[进度](../projects/conversion-goal.json) 和 [实际总览](../artifacts/atlas/atlas-20261007070928/M061.png)。本子批 2 条参考、2 种形态，M061 两批共 12 条参考、27 种形态。0.6m 婴儿与 1m 幼儿保留独立年龄比例及原身体/头部；旧屋顶、墙色和交通 25 种形态见[首批记录](M061-LEGACY-VARIANTS.md)。保持最小体素组件、连续斜面/曲面及天空贴图的混合标准。';p.write_text('\n'.join(lines)+'\n')
print(json.dumps({'status':'passed','run':v['run'],'sourceFiles':len(snapshot),'distinctRegressions':125,'rerunTests':repeat['tests'],'references':732,'remaining':61},ensure_ascii=False))
