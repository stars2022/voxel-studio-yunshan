import hashlib,json,re,shutil
from pathlib import Path

root=Path.cwd();work=root/'work/face-atlas';out=root/'artifacts/atlas/atlas-20261007080147';history=out/'history'
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,value):p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def summary(p):
 text=p.read_text();result={k:int(re.search(r'ℹ '+k+r' (\d+)',text).group(1)) for k in ['tests','pass','fail','cancelled','skipped','todo']}
 result['durationMs']=float(re.search(r'ℹ duration_ms ([\d.]+)',text).group(1));return result
v=read(out/'variant-verification.json');m=read(out/'variant-mcp-verification.json');parents=read(out/'retained-parent-verification.json');pr=read(out/'previews.json');counts=read(out/'catalog-counts.json')
assert all(x['status']=='passed'for x in [v,m,parents,read(out/'material-audit.json'),read(out/'new-material-production.json')])
assert len(v['records'])==6 and len(parents['checks'])==12 and len(m['views'])==17
assert len(m['publicForms'])==len(m['quarterTurns'])==6 and len(m['notifications'])==43
assert not pr['errors'] and pr['imageCount']==36 and pr['reusedImages']==0 and pr['resumedImages']==18
assert len(m['textureUploads'])==3 and all(t['gpuTextureCount']==1 and t['actualBytesMatched']for t in m['textureUploads'])
assert m['textureUploads'][0]['pixelsSHA256']==m['textureUploads'][2]['pixelsSHA256']!=m['textureUploads'][1]['pixelsSHA256']
snapshot=read(work/'validation-source-snapshot.json');assert len(snapshot)==389
changed=[p for p,h in snapshot.items()if digest(root/p)!=h]
assert set(changed)=={'src/production/library.ts','tests/viewer-framing.test.ts'},changed
finalSnapshot={p:digest(root/p)for p in snapshot};write(work/'final-source-snapshot.json',finalSnapshot)
regression=summary(work/'full-regression-tests.txt');target=summary(work/'targeted-final.txt')
assert regression['tests']==592 and regression['pass']==590 and regression['fail']==2 and all(regression[k]==0 for k in ['cancelled','skipped','todo'])
fixed=summary(work/'regression-fixes.txt');assert fixed['tests']==fixed['pass']==9 and all(fixed[k]==0 for k in ['fail','cancelled','skipped','todo'])
resolved={'tests':592,'pass':592,'fail':0,'basis':'Initial complete sweep590passed/2failed, followed by9/9focused tests covering both corrected failures and7overlapping passes; not a second full sweep.'}
assert target['tests']==target['pass']==4 and all(target[k]==0 for k in ['fail','cancelled','skipped','todo'])
assert '✓ built in' in (work/'build-draft-02.txt').read_text()
assert '✓ built in' in (work/'build-regression-fixes.txt').read_text()
for file in ['typecheck-core.txt','typecheck-pipeline.txt','typecheck-final-source.txt','typecheck-verifiers.txt','typecheck-mcp-fixed.txt','typecheck-regression-fixes.txt']:assert not (work/file).read_text().strip()
for file in ['preview-runtime-archive-verification.json','preview-cas-verification.json','mcp-runtime-archive-verification.json','mcp-cas-verification.json']:assert read(work/file)['status']=='passed'
history.mkdir(exist_ok=True)
for p in work.iterdir():
 if p.is_file() and p.suffix in ['.txt','.json','.py','.ts','.png'] and not p.name.endswith('.ysvox.json'):shutil.copy2(p,history/p.name)
shutil.copytree(work/'draft-01',history/'draft-01',dirs_exist_ok=True)
shutil.copytree(work/'full-regression-initial-failures',history/'full-regression-initial-failures',dirs_exist_ok=True)
shutil.copy2(root/'work/maintenance/closed-old-drafts-face-batch.json',history/'closed-old-drafts-face-batch.json')
verifiers=history/'verifiers';verifiers.mkdir(exist_ok=True)
for file in ['scripts/verify-face-variants.ts','scripts/verify-face-parents.ts','scripts/verify-face-mcp.ts','scripts/produce-face-atlas.ts','scripts/produce-reference-variants.ts','scripts/preview-reference-atlas.ts','scripts/package-variant-batch.py']:shutil.copy2(root/file,verifiers/Path(file).name)
write(history/'final-script-hashes.json',{p.name:digest(p)for p in verifiers.iterdir()if p.is_file()})
write(out/'source-reference-review.json',read(work/'reference-review.json'))
individual={r['file']:r for r in read(work/'individual-visual-review.json')};assert len(individual)==18
default=[]
for row in pr['items']:
 for view,name in row['files'].items():
  file='screenshots/'+name;assert (file in individual)==(view=='material' or (view=='front' and row['id'] in [f'CHAR-{n:03}'for n in range(24,30)]))
  if file in individual:assert digest(out/file)==individual[file]['sha256']
  default.append({'id':row['id'],'view':view,'file':file,'sha256':digest(out/file),'reviewed':file in individual or view=='isometric','reviewMethod':'individual captured PNG opened'if file in individual else 'opened in actual sheet board'if view=='isometric'else'captured; not separately opened in this batch','reused':False})
additional=read(work/'mcp-visual-review.json');assert len(additional)==17
for row in additional:assert row['reviewed'] and digest(out/row['file'])==row['sha256']
write(out/'visual-review.json',{'status':'passed','run':v['run'],'defaultViews':default,'additionalViews':additional,'boardsAndUI':[{'file':f,'sha256':digest(out/f),'opened':True}for f in ['M062.png','materials.png','atlas-editor.png']],'rawAtlas':{'file':'projects/production/atlas-20261007080147/materials/CHAR-023/face-atlas-931a8764e299fe79.png','opened':True},'scope':'All12isometric views opened on M062board,all12material views individually opened,new6facefronts individually opened,17MCPviews individually opened. Older6fronts captured but not separately opened in this batch. Technical candidate review,human art acceptance0.'})
validation={'run':v['run'],'status':'passed','subBatch':'M062 shared six-cell face atlas','wholeSheetComplete':True,'sheets':[{'sheet':'M062','produced':12,'references':12}],'fullRepositoryInitialSweep':regression,'focusedRegressionFixes':fixed,'focusedRegressionFiles':['tests/viewer-framing.test.ts','tests/atlas-roof-wall-variants.test.ts'],'resolvedDistinctRegressionTests':resolved,'fullRepositoryCommand':'npm run test:cloud (tsx --test --test-concurrency=2 tests/*.test.ts)','targetedTests':target,'newBatchTestsIncluded':4,'historicalFullRepositoryBaseline':{'commit':'a31c7202fa58cc8ecb58d68e7f125bbc013361a3','tests':575,'pass':575,'evidence':'artifacts/atlas/atlas-20261007054954/validation.json'},'unresolvedAssetFailures':0,'build':'passed','typecheck':'passed','mcpCheckGroups':len(m['checks']),'publicParameterCreations':6,'publicQuarterTurns':6,'mcpNotificationVersions':m['expectedInvalidationVersions'],'maximumNotificationBytes':max(n['bytes']for n in m['notifications']),'defaultScreenshots':36,'resumedSameRunScreenshots':18,'reusedHistoricalScreenshots':0,'additionalMCPViews':17,'defaultVariants':6,'finiteForms':6,'distinctShapeConfigurations':3,'distinctPhysicalGeometryConfigurations':0,'distinctGeometryMaterialConfigurations':6,'newBaseMasters':0,'newAssemblies':0,'newMaterialEntries':1,'defaultInstances':6,'allFiniteFormInstances':6,'nativeCells':212,'defaultTriangles':4304,'independentlyReadGLBs':18,'maximumGLBBoundsErrorM':max(x['boundsErrorM']for r in v['records']for x in r['exports']),'newRoles':0,'totalRoles':512,'atlasRoleInputs':9,'newScopedAppearanceMaterials':1,'selectedParentChecks':12,'selectedParentConfigurations':4,'actualGPUTextureVerification':m['textureUploads'],'all389SourceFilesUnchangedThroughInitialSweep':True,'productionGeometryUnchangedSinceRegressionStart':True,'changesAfterInitialSweep':{'src/production/library.ts':'Error message restored compatible prefix only; no branch or validation behavior change.','tests/viewer-framing.test.ts':'Fixture now includes actual192x16faceDataTexture material and asserts clipping applied/cleared.'},'frozenSourceAndTestFiles':389,'unchangedSourceAndTestFiles':387,'sourceSnapshotSHA256':digest(work/'validation-source-snapshot.json'),'finalSourceSnapshotSHA256':digest(work/'final-source-snapshot.json'),'referenceCandidates':765,'remainingReferences':28,'completeSheets':63,'humanArtAccepted':0,'scope':'New023actualmaterialresource,notbase;6UVcells on3preserved originalcontinuous heads with5mmnative ears. Exact sharedRGBA,litPBR,actualGPUcolor/undo,originalsourceinverse and realparents. Authoredpixels,originalruntimeconditions unbound,static bareheads,notfullhairstyles/ornaments.','history':'Initial optional head-parameter type fixed. Initial face removal accidentally included root bounding region; excluded root and retained ears. Inverse cells matched but chunk insertion order differed; original order now recorded and exact recovery passed. Draft elder forehead creases separated and child pupils made two pixels tall. MCP completed runtime but initial tsc found an implicit-any callback; only number annotation changed afterward, exact executed script retained. Initial preview30 lacked six older material views; all-materials rerun captured18 and resumed18,now36. Initial full sweep592tests:590passed,2failed due extended parent diagnostic prefix and stale Viewer mock lacking proceduralMaterials. Restored compatible message prefix and extended realface-texture clipping fixture;both suites rerun9/9pass,build/typecheck passed. No geometry or runtime branch changed. All failures,drafts and initial previews retained;initial389sourcefiles were unchanged through full sweep,then onlythese2files changed.'}
write(out/'validation.json',validation)
goal=read(root/'projects/conversion-goal.json');goal['progress'].update(referenceCandidates=765,remainingReferenceEntries=28,completedReferenceSheets=63,catalogCounts=counts)
goal['activeBatch']={'sheets':['M064','M065'],'subBatch':'character-body-growth-palettes','state':'queued','ids':[f'CHAR-{n:03}'for n in range(76,85)],'scope':'Controlled local body proportions, posture, pregnancy stages, age heads and five-color skin group; retain actual parents and minimum native pieces.'}
goal['nextBatch']='M064'
goal['lastCompletedBatch']={'sheets':['M062'],'subBatch':'shared-six-cell-face-atlas','run':v['run'],'state':'validated','wholeSheetComplete':True,'newReferences':6,'sheetProducedReferences':12,'sheetReferenceCount':12,'additionalMaterialParents':['CHAR-023'],'evidence':out.relative_to(root).as_posix()}
goal['limitations'][-1]='M001–M063完整，累计765条技术候选，余28。513独立图册母版、3共享引用、186图册组合、63变体参考/156有限形态，完整图册63张，人工美术验收0。'
goal['nextBatchNotes']=[
 '用户修正优先：最小组件体素，斜面和曲面连续，天空/星空使用真实贴图。',
 f'最新六格面孔通过18实际GLB、12父核对、6MCP创建/旋转撤销、43精确通知；本批整库592项初跑590通过/2失败，兼容修正后相关9项全通过，合计592项问题已清零。',
 '累计765/793，余28；基础533、组合186、变体67类/165形态、材质资源1、已生成790、未制作278。M001–M063完整，M0649/12。',
 '023真实192×16RGBA已交付，024–029按UV复用；9独立用途、512角色不扩，三原头保留，最小耳格5mm。原像素源码缺失，自动年龄/情绪与动画未绑定。',
 '接续M064076–078及M065079–084形体/成长/肤色9条，按实际父件局部派生，不整体随意缩放，不增人物实体。',
 '之后M065357–362和M066363–364共8条LOD；M0667环境3家具、M0671沙发共11条。',
 '每批验证后推送origin/main已授权，子批完成不停止总目标。正式验证冻结源代码，浏览器严格串行，PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright。',
 '磁盘紧张，只归档已关闭scratch并逐字节校验；不删除正式资产或Git历史，本地gc.auto=0、maintenance.auto=false。'
];write(root/'projects/conversion-goal.json',goal)
p=root/'README.md';lines=p.read_text().splitlines();lines[6]='67 张完整图册已接入「图册」页，793 条参考逐 ID 对齐。累计 **765 个参考 ID（513 个独立图册母版、3 条共享引用、186 个组合模板、63 类参数变体）**已制作为候选，其余 28 条待制作或复核，人工美术验收为 0。[模型与历史记录](docs/ATLAS-PRODUCTION.md) · [M062 六格面孔](docs/M062-FACE-ATLAS.md) · [本批下载](artifacts/atlas/atlas-20261007080147/PACKAGE-DOWNLOAD.txt)。本批 6 条参考及 1 个额外材质资源，M001–M063 已完整；M064 为 9/12。合并旧库基础候选 533；023 材质与换色形态不增加基础资产数。';p.write_text('\n'.join(lines)+'\n')
p=root/'docs/ATLAS-PRODUCTION.md';lines=p.read_text().splitlines();lines[2]='累计 **765/793** 条参考候选，剩余 28 条；M001–M063 完整，人工美术验收 0。最新 [M062 六格面孔](M062-FACE-ATLAS.md)、[进度](../projects/conversion-goal.json) 和 [下载](../artifacts/atlas/atlas-20261007080147/PACKAGE-DOWNLOAD.txt)。本批 6 条 UV 变体与真实 023 材质父资源：一张 192×16 RGBA、三个原头型，保留连续头壳及 5 mm 耳内块。M062 达 12/12，M064 保持 9/12；最小体素组件、连续斜面/曲面和真实贴图的混合标准继续适用。';p.write_text('\n'.join(lines)+'\n')
print(json.dumps({'status':'passed','run':v['run'],'frozenFiles':389,'resolvedDistinctRegressions':592,'initialFullPass':590,'focusedFixPass':9,'references':765,'remaining':28},ensure_ascii=False))
