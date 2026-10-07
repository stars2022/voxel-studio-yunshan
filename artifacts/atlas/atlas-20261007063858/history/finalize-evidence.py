import hashlib,json,re,shutil
from pathlib import Path
root=Path.cwd();out=root/'artifacts/atlas/atlas-20261007063858';work=root/'work/m061';history=out/'history';history.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
v=read(out/'variant-verification.json');m=read(out/'variant-mcp-verification.json');pr=read(out/'previews.json');parents=read(out/'retained-parent-verification.json');material=read(out/'material-audit.json');counts=read(out/'catalog-counts.json');recap=read(out/'capture-recheck.json')
assert all(r['status']=='passed' for r in [v,m,parents,material,recap]);assert not m['errors'] and not pr['errors']
assert len(m['publicForms'])==len(m['quarterTurns'])==25 and pr['imageCount']==30 and len(m['views'])==28
assert [n['version'] for n in m['notifications']]==m['expectedInvalidationVersions'] and len(m['notifications'])==168
snapshot=read(work/'validation-source-snapshot.json');assert len(snapshot)==373
assert all(digest(root/p)==h for p,h in snapshot.items())
log=(work/'regression-tests.txt').read_text();summary={k:int(re.search(r'ℹ '+k+r' (\d+)',log).group(1)) for k in ['tests','pass','fail','cancelled','skipped','todo']};assert summary=={'tests':99,'pass':99,'fail':0,'cancelled':0,'skipped':0,'todo':0}
assert '✓ built in' in (work/'build.txt').read_text()
for file in ['typecheck-initial.txt','typecheck-audit.txt','typecheck-pipeline.txt','typecheck-mcp.txt']:assert not (work/file).read_text().strip()
for file in ['preview-runtime-archive-verification.json','preview-cas-verification.json','mcp-runtime-archive-verification.json','mcp-cas-verification.json']:assert read(work/file)['status']=='passed'
for p in work.iterdir():
 if p.is_file() and (p.suffix in ['.txt','.json','.py','.ts']) and not p.name.endswith('.ysvox.json'):shutil.copy2(p,history/p.name)
shutil.copytree(work/'history',history,dirs_exist_ok=True)
verifiers=history/'verifiers';verifiers.mkdir(exist_ok=True)
for file in ['scripts/verify-legacy-variants.ts','scripts/verify-legacy-variants-mcp.ts','scripts/verify-legacy-parents.ts','scripts/produce-reference-variants.ts','scripts/preview-reference-atlas.ts','scripts/package-variant-batch.py']:
 shutil.copy2(root/file,verifiers/Path(file).name)
write(history/'executed-script-hashes.json',{p.name:digest(p) for p in verifiers.iterdir() if p.is_file()})
reference=read(work/'reference-review.json');write(out/'source-reference-review.json',reference)
notes={'BUILT-084':'连续单脊屋面和分层木底；双脊谷部另以实际端面复核，真实柱/承座可见。','BUILT-085':'058原门窗孔、木框与墙面格保留；11种墙面预设分别可见。','BUILT-182':'14m机位石面、三条标线、空白杆牌及连续坡道可见。'}
default=[]
for row in pr['items']:
 for view,file in row['files'].items():
  individual=view=='front' or (view=='material' and row['id'] in ['BUILT-084','BUILT-085','BUILT-182'])
  default.append({'id':row['id'],'view':view,'file':'screenshots/'+file,'sha256':digest(out/'screenshots'/file),'reviewed':True,'reviewMethod':'individual captured PNG opened' if individual else ('opened in M061.png at visible scale' if view=='isometric' else 'opened in materials.png side-by-side board'),'note':notes.get(row['id'],'原三盒代理合同与米制尺寸；不是详细车辆的图片复刻。')})
views=[]
for row in m['views']:
 individual=row['key'].endswith('-back') or row['key'] in ['BUILT-084-gable-end','double-ridge-actual-valley','wall-colors-coexisting']
 rejected=row['key']=='BUILT-171-back'
 views.append({**row,'reviewed':True,'accepted':not rejected,'reviewMethod':'individual captured PNG opened' if individual else 'opened in legacy-variants.png at visible scale','note':'Initial back view was visibly compressed despite passed native/export checks; retained as failed presentation evidence. Separate fresh12frame capture below supersedes it; root cause not established.' if rejected else '有限形态、背面或实际接合完整可见。',**({'supersededBy':'variant-BUILT-171-back-rechecked.png'} if rejected else {})})
for row in recap['captures']:views.append({**row,'reviewed':True,'accepted':True,'reviewMethod':'individual captured PNG opened','note':'重新加载真实原生文档，等待12帧；171与172实际同形背面一致。'})
visual={'status':'passed','run':v['run'],'defaultViews':default,'additionalViews':views,'boardsAndUI':[{'file':f,'sha256':digest(out/f),'opened':True} for f in ['M061.png','materials.png','legacy-variants.png','atlas-editor.png']],'failedPresentationRetained':'variant-BUILT-171-back.png','scope':'All30defaults reviewed via10front individual views,10isometric board views and10material board views (3material views also opened individually). Fifteen nondefault forms viewed in25formboard; all default backs, gable, valley and coexisting walls individually opened. Original anomalous171back was rejected and separately recaptured with172comparison. No source geometry or default image changed. Technical candidate review; human art acceptance remains0.'}
write(out/'visual-review.json',visual)
validation={'run':v['run'],'status':'passed','subBatch':'M061 legacy roof wall and transport parameter variants','wholeSheetComplete':False,'sheetProducedReferences':10,'sheetReferenceCount':12,'regressionTests':summary,'regressionDurationMs':422269.56154,'newBatchTestsIncluded':5,'regressionTestFiles':['tests/'+f+'.test.ts' for f in ['core','catalog','production','material-roles','atlas-domestic','atlas-structure','atlas-building-variants','atlas-m060-buildings','atlas-roof-wall-variants','atlas-legacy-variants']],'historicalFullRepositoryBaseline':{'commit':'a31c7202fa58cc8ecb58d68e7f125bbc013361a3','tests':575,'pass':575,'fail':0,'evidence':'artifacts/atlas/atlas-20261007054954/validation.json','rerunInThisBatch':False},'unresolvedAssetFailures':0,'presentationAnomaly':'One original171back capture rejected and superseded by two successful individual171/172captures; unknown transient capture cause retained in visual evidence.','build':'passed','typecheck':'passed','mcpCheckGroups':len(m['checks']),'publicParameterCreations':25,'publicQuarterTurns':25,'mcpNotificationVersions':m['expectedInvalidationVersions'],'maximumNotificationBytes':max(n['bytes'] for n in m['notifications']),'defaultScreenshots':30,'reusedDefaultScreenshots':0,'additionalMCPViews':28,'additionalRecheckedViews':2,'defaultVariants':10,'finiteForms':25,'distinctPhysicalGeometryConfigurations':10,'distinctGeometryMaterialConfigurations':23,'newBaseMasters':0,'newAssemblies':0,'defaultInstances':sum(r['instances'] for r in v['records'] if r['isDefault']),'allFiniteFormInstances':sum(r['instances'] for r in v['records']),'independentlyReadGLBs':sum(len(r['exports']) for r in v['records']),'maximumGLBBoundsErrorM':max(x['boundsErrorM'] for r in v['records'] for x in r['exports']),'newRoles':0,'totalRoles':512,'wallAppearanceInstances':11,'roofAppearanceInstances':2,'selectedHistoricalParentChecks':len(parents['checks']),'sourceAndTestsUnchangedSinceRegressionStart':True,'frozenSourceAndTestFiles':len(snapshot),'sourceSnapshotSHA256':digest(work/'validation-source-snapshot.json'),'referenceCandidates':730,'remainingReferences':63,'completeSheets':60,'humanArtAccepted':0,'scope':'Ten reference parameter variants; continuous closed roof valley with actual triangle support checks, exact386556cell wall with scoped colors, source three-box proxies,14m pad with actual ramp. Full historic076/058/169/181 retained. Original seedRGB, profiles, Vehicleidentity/routes, pad logic and controllers remain unbound.','history':'Draft valley bearer minimum originally omitted an intermediate crease; real closed-mesh verification caught it and geometry was corrected before source freeze. Initial undo assertion helper rejected absent assembly maps; null normalization fixed the test and all99regressions passed. Supplemental capture script route and browser callback errors were fixed; original logs retained.'}
assert validation['defaultInstances']==48 and validation['allFiniteFormInstances']==565 and validation['independentlyReadGLBs']==75
write(out/'validation.json',validation)
goal=read(root/'projects/conversion-goal.json');goal['progress'].update(referenceCandidates=730,remainingReferenceEntries=63,completedReferenceSheets=60,catalogCounts=counts)
goal['activeBatch']={'sheet':'M061','subBatch':'infant-preschool-age-variants','state':'queued','ids':['CHAR-017','CHAR-018'],'scope':'0.6m婴儿和1.0m幼儿，真实独立年龄比例；保留001组合与061/062等实际父组件。'}
goal['lastCompletedBatch']={'sheet':'M061','subBatch':'legacy-roof-wall-transport-variants','run':v['run'],'state':'validated','wholeSheetComplete':False,'sheetProducedReferences':10,'sheetReferenceCount':12,'evidence':out.relative_to(root).as_posix()}
goal['limitations'][-1]='M001–M060完整，M061完成10/12；累计730条技术候选，余63。513独立图册母版、3共享引用、186图册组合、28变体参考/109有限形态，完整图册60张，人工美术验收0。'
goal['nextBatchNotes']=[
 '用户修正持续优先：最小组件体素，斜面和曲面连续，天空/星空使用真实贴图。',
 'M061首批10条参考25形态已完成验证；99相关回归、75实际GLB、25次公开创建和旋转撤销、168条精确通知、10历史父源检查通过。a31c7202整库575测试为上一批基线，并非本次重跑。',
 '累计730/793，余63；全库基础533、组合186、变体32类/118形态、已生成754条、未制作314条。M061年龄017/018未完成，完整图册仍60张。',
 '084双脊三层连续跨谷，实际底面三角承托；085完整058的386556格保留。11墙色及2瓦色只作同用途外观实例，全库仍512语义用途。',
 '170–176保留169原三盒代理合同，171/172与170/174分别共形；参考图更详细，不能冒称完整Vehicle。完整277/279–285另在M048。182为181的14m机位派生，原控制器仍未绑定。',
 'CHAR017/018保留0.6m/1m阶梯，必须使用061婴儿/062幼儿真实比例；018需要明确1m幼儿安装派生，不能缩小成人001。019/020/021后续为1.2/1.6/1.8m。',
 'CHAR023父面部图谱确实缺失，制作024–029前须先交付真实023非图册父资产；肤色030–034只作同用途外观，不增加人物身份或母版。',
 '公开变体schema目前仍BUILT-only，接入CHAR须明确扩展并验证非法类型、原子回滚及一次撤销。',
 '每批验证后推送origin/main已授权；完成当前子批不能停止整个目标。正式验证期间不修改被测生产代码；浏览器串行并设置PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright。'
];write(root/'projects/conversion-goal.json',goal)
p=root/'README.md';lines=p.read_text().splitlines();lines[6]='67 张完整图册已接入「图册」页，793 条参考逐 ID 对齐。M001–M060 及 M061 已完成部分累计 **730 个参考 ID（513 个独立图册母版、3 条共享引用、186 个组合模板、28 类参数变体）**已制作为候选，其余 63 条待制作或复核，人工美术验收为 0。[模型与历史记录](docs/ATLAS-PRODUCTION.md) · [M061 旧屋顶、墙色和交通变体](docs/M061-LEGACY-VARIANTS.md) · [本批总览](artifacts/atlas/atlas-20261007063858/M061.png)。本子批 10 条参考、25 种有限形态，M061 完成 10/12，整张完成数仍为 60。合并旧库基础候选 533；实例、换色及参数形态不增加基础资产数。';p.write_text('\n'.join(lines)+'\n')
p=root/'docs/ATLAS-PRODUCTION.md';lines=p.read_text().splitlines();lines[2]='M001–M060 及 M061 已完成部分累计 **730/793** 条参考候选，剩余 63 条；整张完成数 60，人工美术验收 0。最新 [M061 旧屋顶、墙色和交通变体](M061-LEGACY-VARIANTS.md)、[进度](../projects/conversion-goal.json) 和 [实际总览](../artifacts/atlas/atlas-20261007063858/M061.png)。本子批 10 条参考、25 种形态，M061 暂完成 10/12；CHAR-017、018 年龄身高继续制作。原 076、058、169、181 保留，载具为原三盒代理，完整车辆另见 M048。保持最小体素组件、连续斜面/曲面及天空贴图的混合标准。';p.write_text('\n'.join(lines)+'\n')
print(json.dumps({'status':'passed','run':v['run'],'sourceFiles':len(snapshot),'regressions':99,'references':730,'remaining':63},ensure_ascii=False))
