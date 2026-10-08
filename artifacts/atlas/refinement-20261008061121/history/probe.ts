import {writeFile,readFile} from 'node:fs/promises';
import {productionProject} from '../../src/production/style';
import {makeCatalogAsset} from '../../src/production/catalog-assets';
import {kitchenRefinementIds} from '../../src/production/kitchen-refinement';
import {architectureClosed,architectureComponents} from '../../scripts/lib/architecture-audit';
import {heldContactGroups} from '../../scripts/lib/held-audit';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
import {validateProject} from '../../src/core/engine';
import {assetBoundsM,geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {displayMesh} from '../../src/core/mesh';
const records:any[]=[];
for(const id of kitchenRefinementIds){try{
 const p=productionProject('M002 probe'),a=makeCatalogAsset(id,id,id.toLowerCase(),p.styles.yunshan,{refinement:'reference-v1'},p);p.assets[a.id]=a;validateProject(p);
 const closure=architectureClosed(a),attachments=nativeIslandAttachments(a),components=architectureComponents(a),groups=heldContactGroups({...a,meshes:components.map((m,i)=>({...m,name:i+':'+m.name}))},p.materials);
 const row={id,geometrySHA256:hash(geometryData(a)),bounds:assetBoundsM(a),triangles:displayMesh(a,p.materials).reduce((n,m)=>n+m.indices.length/3,0),components:closure.length,closureFailures:closure.filter(r=>!r.closed||!r.oriented),attachmentFailures:attachments.filter(r=>!r.attached),contactGroups:groups};records.push(row);console.log(JSON.stringify(row));
}catch(e:any){records.push({id,error:e.stack});console.log(id,e.stack);}}
const out=process.argv[2]??'work/m002-refinement/probe-01.json';await writeFile(out,JSON.stringify({records},null,2));
