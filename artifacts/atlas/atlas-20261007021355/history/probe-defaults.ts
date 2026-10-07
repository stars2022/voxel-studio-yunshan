import {productionProject} from '../../src/production/style';
import {buildingVariantIds,buildingVariantForms} from '../../src/production/building-variant-spec';
import {makeBuildingVariant} from '../../src/production/building-variants';
import {architectureClosed} from '../../scripts/lib/architecture-audit';
import {validateProject} from '../../src/core/engine';
import {writeFile} from 'node:fs/promises';
for(const id of buildingVariantIds){const p=productionProject(id),a=makeBuildingVariant(p,id,id.toLowerCase(),id);p.assemblies={[a.id]:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));validateProject(p);const bad=Object.values(p.assets).filter(a=>a.id.includes('variant')).flatMap(a=>architectureClosed(a).filter(c=>!c.closed||!c.oriented).map(c=>({asset:a.id,...c})));console.log(JSON.stringify({id,forms:buildingVariantForms(id).length,assets:Object.keys(p.assets).length,instances:a.instances.length,bad}));await writeFile('work/m059-buildings/'+id+'.ysvox.json',JSON.stringify(p));}
