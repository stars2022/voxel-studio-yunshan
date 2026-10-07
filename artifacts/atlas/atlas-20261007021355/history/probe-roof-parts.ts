import {readFile} from 'node:fs/promises';
import {architectureClosed,architectureComponents} from '../../scripts/lib/architecture-audit';
import {nativeIslandAttachments} from '../../src/production/mixed-review';
for(const size of['compact','expanded']){const p=JSON.parse(await readFile('work/m059-buildings/farm-current-'+size+'.ysvox.json','utf8'));for(const a of Object.values(p.assets)as any[])if(a.id.startsWith('architecture-roof-variant-farm'))console.log(JSON.stringify({size,asset:a.id,closed:architectureClosed(a),native:nativeIslandAttachments({...a,meshes:architectureComponents(a)})}));}
