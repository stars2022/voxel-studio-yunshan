import {templateCatalog} from '../src/core/templates';
import {templateParameters} from '../src/core/template-parameters';
import {writeFile,mkdir} from 'node:fs/promises';
import {demoProject} from '../src/core/demo';
import {toolDefinitions} from '../src/core/schema';
await mkdir('projects',{recursive:true});await writeFile('projects/qinglan-house.ysvox.json',JSON.stringify(demoProject(),null,2));await writeFile('docs/tool-schemas.json',JSON.stringify(toolDefinitions,null,2));console.log('已生成民居项目与 MCP Schema');

await writeFile('docs/template-parameters.json',JSON.stringify(Object.fromEntries(Object.entries(templateCatalog).map(([id,name])=>[id,{name,parameters:templateParameters(id),units:'metres; detail/glass/steps are dimensionless'}])),null,2));
