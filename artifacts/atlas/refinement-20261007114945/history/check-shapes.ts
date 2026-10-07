import assert from 'node:assert/strict';
import {architectureClosed} from '../../scripts/lib/architecture-audit';
import {bevelBox,bevelMember,roundMember} from './refinement-shapes';
const meshes=[bevelBox('box',1,[0,0,0],[.9,.04,.24],.003,true,0),bevelMember('diagonal',1,[.1,.1,.1],[.2,.4,.15],.04,.04,.003,true),roundMember('pin',1,[0,0,0],[.05,.04,.03],.01,true)];
for(const mesh of meshes){const a:any={id:mesh.name,name:mesh.name,cellSize:.005,origin:[0,0,0],chunks:{},meshes:[mesh],ports:[],openings:[]};const checked=architectureClosed(a);assert.ok(checked.every(x=>x.closed&&x.oriented),JSON.stringify(checked));console.log(mesh.name,mesh.indices.length/3,'closed oriented actual triangles');}
