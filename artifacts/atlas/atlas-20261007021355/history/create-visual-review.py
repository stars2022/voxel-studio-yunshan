from pathlib import Path
import json,hashlib
root=Path.cwd();scratch=root/'work/m059-buildings';read=lambda p:json.loads(p.read_text());latest=read(root/'artifacts/atlas/latest.json');out=root/latest['evidence'];m=read(out/'variant-mcp-verification.json');formal=read(out/'variant-verification.json');inspected=read(scratch/'inspected-images.json');seen={r['file']for r in inspected}
assert m['status']=='passed' and len(m['formBoard'])==38 and len(m['formBoardPages'])==4
required={r['file']for r in m['formBoardPages']}|{'variant-farm-public-create.png','variant-farm-quarter-turn.png','variant-farm-purpose-palette.png'}
assert required<=seen,required-seen
for row in inspected:assert hashlib.sha256((out/row['file']).read_bytes()).hexdigest()==row['sha256']
key=lambda r:(r['id'],json.dumps(r['params'],sort_keys=True))
records={key(r):r for r in formal['records']};board_sources=[]
for r in m['formBoard']:
 source=records[key(r)];board_sources.append({**r,'imageSHA256':hashlib.sha256((out/r['file']).read_bytes()).hexdigest(),'nativeDirectory':source['directory'],'geometrySHA256':source['geometrySHA256']})
assert len({key(r)for r in board_sources})==38
review={'run':latest['run'],'status':'reviewed-technical-candidates','humanArtAccepted':0,'individuallyOpenedImages':inspected,'finiteFormCoverage':{'forms':38,'reviewMethod':'Four actual editor contact sheets were opened and inspected. Six default material views and all default back/cutaway/stair-component views were opened separately; selected nondefault tall residential, commercial, workshop and civic views were also opened at full view. Individual opening of all32 nondefault screenshots is not claimed.','pages':m['formBoardPages'],'sourceImages':board_sources},'observations':[
 'All six families retain continuous roof, wall, window and floor silhouettes in material views. Parameter forms visibly change bay arrangement, footprint and storey count while preserving the authored family masks.',
 'The revised single-storey farm has one continuous U-shaped roof. Earlier screenshots of the intersecting three-roof prototype remain in history.',
 'Five independent stair-height closeups show actual treads, continuous sloped undersides and inclined wood rails. Floor cutaways show the authored open interior layout and the stair well, rather than fictional original rooms.',
 'Tall twelve-storey residential and five-storey workshop views preserve the full building; three real glazed workshop roof strips remain visible.',
 'Public farm creation, quarter-turn duplication and a separate purpose palette were inspected; the palette visibly changes roof/render/paving/glass appearance without rebuilding geometry.'
 ],'limitations':[
 'Default previews and MCP form captures show different brightness and individual framing. The contact sheets are not calibrated scale or color comparisons; actual material purposes and exported glass pixels are checked independently.',
 'Roof corner faceting and ridge appearance inherit the authored parent roof algorithm. Civic and academy roofs retain visible segmented shading; these remain art candidates.',
 'Isolated staircase views expose the long ends of columns intended for floor-to-floor repetition. Open interiors have sparse retained native furniture relative to their large parameterized footprints.',
 'Reference illustrations show ornate low-rise buildings, whereas the catalogue contract specifies much taller and wider forms. These screenshots follow the numeric contract and do not claim a visual match or human acceptance.',
 'Original world/FloorPlan, doors, room capacities, use points, seed perturbation, civic overrides, dynamic controller, full gait and engineering certification remain unbound. Finite support/clearance probes do not establish those properties.'
 ]}
(out/'visual-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':review['status'],'individuallyOpened':len(inspected),'finiteForms':38,'boards':4,'humanArtAccepted':0}))
