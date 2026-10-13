import {validateAuthoredMeshes} from '../../src/core/authored-mesh';
import {productionProject} from '../../src/production/style';
import {makeResearchRefinement,researchRefinementIds} from '../../src/production/research-refinement';
import {architectureClosed,architectureComponents} from '../../scripts/lib/architecture-audit';
import {heldContactGroups} from '../../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
const p=productionProject('M007 probe');
for(const id of researchRefinementIds){try{const a=makeResearchRefinement(id,id,id.toLowerCase(),p.styles.yunshan,p),c=(validateAuthoredMeshes(a,p.materials),architectureClosed(a)),parts=architectureComponents(a),groups=heldContactGroups({...a,meshes:parts.map((m,i)=>({...m,name:i+':'+m.name}))},p.materials),attached=nativeIslandAttachments(a);console.log(JSON.stringify({id,closed:c.filter(r=>!r.closed||!r.oriented),unattached:attached.filter(r=>!r.attached),groups:groups.length,isolated:groups.length>1?groups.slice(1):[]}));}catch(e){console.log(id,String(e));}}
