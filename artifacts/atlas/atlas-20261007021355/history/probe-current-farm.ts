import {productionProject} from '../../src/production/style';
import {makeBuildingVariant} from '../../src/production/building-variants';
import {auditBuildingVariant} from '../../scripts/lib/building-variant-audit';
import {writeFile} from 'node:fs/promises';
for(const sizeCase of['compact','expanded']){const p=productionProject('farm'),a=makeBuildingVariant(p,'BUILT-026','farm','farm',{sizeCase});p.assemblies={farm:a};p.instances=Object.fromEntries(a.instances.map(i=>[i.id,i]));const r=auditBuildingVariant(p,a);console.log(JSON.stringify({sizeCase,passed:r.passed,roofs:r.roofs,badComponents:r.components.filter(c=>c.closed.some(x=>!x.closed||!x.oriented)||c.native.some(x=>!x.attached))}));await writeFile('work/m059-buildings/farm-current-'+sizeCase+'.ysvox.json',JSON.stringify(p));}
