import hashlib,json,re,shutil
from pathlib import Path

root=Path.cwd();work=root/'work/m062-palette';out=root/'artifacts/atlas/atlas-20261007072858';history=out/'history'
history.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,value):p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
v=read(out/'variant-verification.json');m=read(out/'variant-mcp-verification.json');parents=read(out/'retained-parent-verification.json');pr=read(out/'previews.json');counts=read(out/'catalog-counts.json')
assert all(x['status']=='passed' for x in [v,m,parents,read(out/'material-audit.json')])
assert len(v['records'])==39 and len(parents['checks'])==45 and len(m['views'])==21
assert len(m['publicForms'])==len(m['quarterTurns'])==39 and len(m['notifications'])==242
assert not pr['errors'] and pr['imageCount']==81 and pr['reusedImages']==0
snapshot=read(work/'validation-source-snapshot.json');assert len(snapshot)==382
assert all(digest(root/p)==h for p,h in snapshot.items()),'Frozen production/test source changed'
write(work/'final-source-snapshot.json',snapshot)
def summary(p):
 text=p.read_text();return {k:int(re.search(r'ℹ '+k+r' (\d+)',text).group(1)) for k in ['tests','pass','fail','cancelled','skipped','todo']}
regression=summary(work/'regression-tests.txt');target=summary(work/'targeted-tests.txt')
assert regression=={'tests':142,'pass':142,'fail':0,'cancelled':0,'skipped':0,'todo':0}
assert target=={'tests':8,'pass':8,'fail':0,'cancelled':0,'skipped':0,'todo':0}
assert '✓ built in' in (work/'build.txt').read_text()
for file in ['typecheck-initial.txt','typecheck-audit.txt','typecheck-parent-fix.txt','typecheck-mcp.txt','typecheck-mcp-final.txt']:assert not (work/file).read_text().strip()
for file in ['preview-runtime-archive-verification.json','preview-cas-verification.json','mcp-runtime-archive-verification.json','mcp-cas-verification.json']:assert read(work/file)['status']=='passed'
for p in work.iterdir():
 if p.is_file() and p.suffix in ['.txt','.json','.py','.ts'] and not p.name.endswith('.ysvox.json'):shutil.copy2(p,history/p.name)
shutil.copytree(work/'mcp-initial-event-assertion',history/'mcp-initial-event-assertion',dirs_exist_ok=True,ignore=shutil.ignore_patterns('*.ysvox.json'))
for name in ['abandoned-pack-20261007.json','loose-pack-after-m061-age.json','closed-old-drafts.json']:shutil.copy2(root/'work/maintenance'/name,history/name)
verifiers=history/'verifiers';verifiers.mkdir(exist_ok=True)
for file in ['scripts/verify-character-palette-variants.ts','scripts/verify-character-palette-parents.ts','scripts/verify-character-palette-mcp.ts','scripts/produce-reference-variants.ts','scripts/preview-reference-atlas.ts','scripts/package-variant-batch.py']:shutil.copy2(root/file,verifiers/Path(file).name)
write(history/'executed-script-hashes.json',{p.name:digest(p)for p in verifiers.iterdir()if p.is_file()})
write(out/'source-reference-review.json',read(work/'reference-review.json'))
individual={r['file']:r for r in read(work/'individual-visual-review.json')};assert len(individual)==30
default=[]
for row in pr['items']:
 for view,name in row['files'].items():
  file='screenshots/'+name;assert (file in individual) == (view=='material' or (view=='front' and row['id'] in ['CHAR-019','CHAR-020','CHAR-021']))
  default.append({'id':row['id'],'view':view,'file':file,'sha256':digest(out/file),'reviewed':file in individual or view=='isometric','reviewMethod':'individual captured PNG opened' if file in individual else 'opened in actual sheet board' if view=='isometric' else 'captured; not separately opened','reused':False})
additional=read(work/'mcp-visual-review.json');assert len(additional)==21
for row in additional:assert row['reviewed'] and digest(out/row['file'])==row['sha256']
write(out/'visual-review.json',{'status':'passed','run':v['run'],'defaultViews':default,'additionalViews':additional,'boardsAndUI':[{'file':f,'sha256':digest(out/f),'opened':True}for f in ['M062.png','M063.png','M064.png','materials.png','atlas-editor.png']],'scope':'All 27 default isometric views opened on sheet boards, all 27 materials individually opened, plus all 3 age fronts and 21 MCP views individually opened. Other 24 front PNGs captured but not separately opened. Technical candidate review, human art acceptance0.'})
validation={'run':v['run'],'status':'passed','subBatch':'M062–M064 age heights and character palettes','wholeSheetComplete':False,'sheets':[{'sheet':'M062','produced':6,'references':12},{'sheet':'M063','produced':12,'references':12},{'sheet':'M064','produced':9,'references':12}],'regressionTests':regression,'regressionDurationMs':427354.703832,'targetedTests':target,'newBatchTestsIncluded':4,'regressionTestFiles':['tests/'+f+'.test.ts'for f in ['core','catalog','production','material-roles','atlas-domestic','atlas-structure','atlas-building-variants','atlas-m060-buildings','atlas-roof-wall-variants','atlas-legacy-variants','atlas-age-variants','atlas-character-palettes','atlas-character','atlas-figure','atlas-avatar','rig']],'historicalFullRepositoryBaseline':{'commit':'a31c7202fa58cc8ecb58d68e7f125bbc013361a3','tests':575,'pass':575,'fail':0,'evidence':'artifacts/atlas/atlas-20261007054954/validation.json','rerunInThisBatch':False},'immediatePreviousBatch':{'commit':'639e79a494f2f5d612d78cd6f09d954320029f94','distinctRegressions':125,'evidence':'artifacts/atlas/atlas-20261007070928/validation.json'},'unresolvedAssetFailures':0,'build':'passed','typecheck':'passed','mcpCheckGroups':len(m['checks']),'publicParameterCreations':39,'publicQuarterTurns':39,'mcpNotificationVersions':m['expectedInvalidationVersions'],'maximumNotificationBytes':max(n['bytes']for n in m['notifications']),'defaultScreenshots':81,'newDefaultScreenshots':81,'reusedDefaultScreenshots':0,'additionalMCPViews':21,'defaultVariants':27,'finiteForms':39,'distinctShapeConfigurations':8,'distinctPhysicalGeometryConfigurations':0,'distinctGeometryMaterialConfigurations':39,'newBaseMasters':0,'newAssemblies':0,'defaultInstances':sum(r['instances']for r in v['records']if r['isDefault']),'allFiniteFormInstances':sum(r['instances']for r in v['records']),'independentlyReadGLBs':sum(len(r['exports'])for r in v['records']),'maximumGLBBoundsErrorM':max(x['boundsErrorM']for r in v['records']for x in r['exports']),'newRoles':0,'totalRoles':512,'newScopedAppearanceMaterials':27,'selectedHistoricalParentChecks':45,'selectedParentConfigurations':11,'productionUnchangedSinceRegressionStart':True,'frozenSourceAndTestFiles':382,'unchangedSourceAndTestFiles':382,'sourceSnapshotSHA256':digest(work/'validation-source-snapshot.json'),'finalSourceSnapshotSHA256':digest(work/'final-source-snapshot.json'),'referenceCandidates':759,'remainingReferences':34,'completeSheets':62,'humanArtAccepted':0,'scope':'Three independent age body/head height variants; 24 exact source RGB references with both002garments; 8 actual shapes. Native5mmdetails preserved or translated rigidly for body installation. All 512 semantic roles, foreign IDs and complete parents retained. Garment2canonical parent newly exported against actual M031historical geometry hash. Static neutral bodies, torso/thigh/back-hair component palette scope; no source outfits or runtime age/role binding.','history':'Initial new palette test import failed because a source condition key was not padded to3digits; corrected before production/freeze. Parent verifier return type corrected after TypeScript errors. Initial MCP completed all39forms/turns and21captures, then failed because verifier expected project_changed instead of actual state-invalidated; verifier corrected and complete workflow rerun. Every original failure preserved. No production code changed after freeze.'}
assert (validation['defaultInstances'],validation['allFiniteFormInstances'],validation['independentlyReadGLBs'])==(70,82,117)
write(out/'validation.json',validation)
goal=read(root/'projects/conversion-goal.json');goal['progress'].update(referenceCandidates=759,remainingReferenceEntries=34,completedReferenceSheets=62,catalogCounts=counts)
goal['activeBatch']={'sheet':'M062','subBatch':'shared-six-cell-face-atlas','state':'queued','ids':[f'CHAR-{n:03}'for n in range(24,30)],'additionalMaterialParents':['CHAR-023'],'scope':'Actual shared192×16RGBAatlas and six32×16UV cells with retained adult/elder/child heads;023is a material resource, not a base master.'}
goal['lastCompletedBatch']={'sheets':['M062','M063','M064'],'subBatch':'age-character-palettes','run':v['run'],'state':'validated','wholeSheetComplete':False,'sheetProducedReferences':27,'sheetReferenceCount':36,'evidence':out.relative_to(root).as_posix()}
goal['limitations'][-1]='M001–M061及M063完整，累计759条技术候选，余34。513独立图册母版、3共享引用、186图册组合、57变体参考/150有限形态，完整图册62张，人工美术验收0。'
goal['nextBatchNotes']=[
 '用户修正优先：最小组件体素，斜面和曲面连续，天空/星空使用真实贴图。',
 '最新27参考/39形态通过117实际GLB、45父核对、39MCP创建/旋转撤销、242精确通知和142相关回归。575整库测试仅是a31c7202历史基线。',
 '累计759/793，余34；基础533、组合186、变体61类/159形态、已生成783条、未制作285条。M0626/12、M06312/12、M0649/12。',
 '019/020/021实际1.2/1.6/1.8m使用独立年龄身体与原头，030–053按RGB用途换色。002两种躯干、004单大腿、010短发后片，不称完整服装或新母版；512用途不扩。',
 'CHAR023是材质贴图而非基础组件，须交付真实192×16RGBA六格父图谱及实际材质类型计数。024–029复用同图谱UV单元；原始像素源码缺失，设计只能称作者实现。',
 '下一批脸atlas使用原066/069/068school头，保存原件和明确的旧面部体素移除记录，保持连续头壳和原生耳细件；不借大气water通道。原profile/心情/年龄自动条件未绑定。',
 '剩余另有M0643形体、M06512形体/LOD、M06612动物/环境/家具、M0671沙发；按真实参数范围派生并保留父件。',
 '每批验证后推送origin/main已授权，子批完成不停止总目标。正式验证冻结源代码，浏览器严格串行且设置PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright。',
 '磁盘紧张，仅归档已关闭scratch并校验逐字节恢复；本地gc.auto=0、maintenance.auto=false，不删除正式资产或Git历史。'
];write(root/'projects/conversion-goal.json',goal)
p=root/'README.md';lines=p.read_text().splitlines();lines[6]='67 张完整图册已接入「图册」页，793 条参考逐 ID 对齐。累计 **759 个参考 ID（513 个独立图册母版、3 条共享引用、186 个组合模板、57 类参数变体）**已制作为候选，其余 34 条待制作或复核，人工美术验收为 0。[模型与历史记录](docs/ATLAS-PRODUCTION.md) · [M062–M064 年龄及配色](docs/M062-M064-AGE-PALETTES.md) · [本批下载](artifacts/atlas/atlas-20261007072858/PACKAGE-DOWNLOAD.txt)。本批 27 条参考、39 种形态；M062 为 6/12、M063 为 12/12、M064 为 9/12，完整图册 62 张。合并旧库基础候选 533；换色和参数形态不增加基础资产数。';p.write_text('\n'.join(lines)+'\n')
p=root/'docs/ATLAS-PRODUCTION.md';lines=p.read_text().splitlines();lines[2]='累计 **759/793** 条参考候选，剩余 34 条；M001–M061 及 M063 完整，共 62 张，人工美术验收 0。最新 [M062–M064 年龄及配色](M062-M064-AGE-PALETTES.md)、[进度](../projects/conversion-goal.json) 和 [下载](../artifacts/atlas/atlas-20261007072858/PACKAGE-DOWNLOAD.txt)。本批 27 条参考、39 种形态；M062 为 6/12、M063 为 12/12、M064 为 9/12。实际独立年龄身体达到 1.2/1.6/1.8m，24 条用途配色包含 002 两种上衣。保持最小体素组件、连续斜面/曲面及真实贴图的混合标准。';p.write_text('\n'.join(lines)+'\n')
print(json.dumps({'status':'passed','run':v['run'],'frozenFiles':382,'regressions':142,'references':759,'remaining':34},ensure_ascii=False))
