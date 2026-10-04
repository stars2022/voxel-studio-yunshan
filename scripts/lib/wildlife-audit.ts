import assert from 'node:assert/strict';
import {Vector3} from 'three';
import type {Asset,Material} from '../../src/core/types';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import {rigMatrices,rigPoint} from '../../src/core/rig';
import {displayMesh} from '../../src/core/mesh';
import {heldContactGroups} from './held-audit';
import {shapeDistance} from './held-audit';
import {auditShape,inside,penetration} from './mesh-audit';
import {productionProject} from '../../src/production/style';
import {makeWildlifeAsset,wildlifeIds,wildlifeVariants} from '../../src/production/atlas-wildlife';
import {makeCareAsset} from '../../src/production/atlas-care';
import {makeFaunaAsset} from '../../src/production/atlas-fauna';
import {wildlifeScenes,wildlifeScene} from '../../src/production/wildlife-assembly';
import type {V3} from '../../src/core/types';

/** Read the actual saved index ranges, verifying a complete non-overlapping partition.
 * Closed primitive solids may intersect at their joints; grouping does not weld them. */
export function wildlifeComponents(a:Asset,posed=false):AuthoredMesh[]{const ranges=(a.source?.detail as any)?.componentIndexRanges??{},matrices=a.rig?rigMatrices(a):undefined,out:AuthoredMesh[]=[];for(const m of a.meshes??[]){const parts=ranges[m.name]??[{name:m.name,firstIndex:0,indexCount:m.indices.length}];let end=0;for(const part of parts){assert.equal(part.firstIndex,end);assert.ok(part.indexCount>0&&part.indexCount%3===0);end+=part.indexCount;const indices=m.indices.slice(part.firstIndex,end),positions:number[]=[],normals:number[]=[],uvs:number[]=[],mapped=new Map<number,number>();for(const i of indices){if(mapped.has(i))continue;mapped.set(i,mapped.size);const v=new Vector3(...m.positions.slice(i*3,i*3+3)),n=new Vector3(...m.normals.slice(i*3,i*3+3));if(posed&&matrices){const matrix=matrices.skin[matrices.indices.get(a.rig!.meshJoints[m.name])!];v.applyMatrix4(matrix);n.transformDirection(matrix);}positions.push(...v.toArray());normals.push(...n.toArray());uvs.push(...m.uvs.slice(i*2,i*2+2));}out.push({...m,name:part.name,positions,normals,uvs,indices:indices.map(i=>mapped.get(i)!)});}assert.equal(end,m.indices.length);}return out;}
export function wildlifeConnections(a:Asset,materials:Record<string,Material>,posed=false){const meshes=wildlifeComponents(a,posed);if(posed){for(const [j,b]of displayMesh(a,materials).filter(b=>!b.meshName).entries())meshes.push({name:'posed-native-'+j,material:b.material,collision:false,positions:b.positions,normals:b.normals,uvs:b.uvs,indices:b.indices});return heldContactGroups({...a,rig:undefined,meshes,chunks:{}},materials);}return heldContactGroups({...a,rig:undefined,meshes},materials);}
export function wildlifeClosed(a:Asset){const records=[];for(const m of wildlifeComponents(a)){const edges=new Map<string,number>(),winding=new Map<string,number>();for(let k=0;k<m.indices.length;k+=3){const pts=m.indices.slice(k,k+3).map(i=>m.positions.slice(i*3,i*3+3));for(let j=0;j<3;j++){const x=pts[j].join(','),y=pts[(j+1)%3].join(','),key=[x,y].sort().join('|');edges.set(key,(edges.get(key)??0)+1);winding.set(key,(winding.get(key)??0)+(x<y?1:-1));}}records.push({name:m.name,closed:[...edges.values()].every(v=>v===2),oriented:[...winding.values()].every(v=>v===0)});}return records;}

export function wildlifeWearAudit(){const p=productionProject('M043 finite wear audit'),records=[];const shapes=(a:Asset,offset:V3=[0,0,0])=>wildlifeAuditShapes(a,p.materials,offset);
 for(const id of['CHAR-328','CHAR-330','CHAR-331'])for(const params of wildlifeVariants(id)){const a=makeWildlifeAsset(id,id,id,p.styles.yunshan,params),f=(a.source!.detail as any).fit,target=f.target,b=target==='CHAR-315'?makeFaunaAsset(target,target,target,p.styles.yunshan):makeCareAsset(target,target,target,p.styles.yunshan),x=shapes(a),y=shapes(b),result=penetration(x,y),distance=Math.min(...x.flatMap(xx=>y.filter(yy=>xx.box.clone().expandByScalar(.035).intersectsBox(yy.box)).map(yy=>shapeDistance(xx,yy))));assert.equal(result.contained+result.crossing,0,JSON.stringify({id,params,...result}));assert.ok(distance<(params.livestockFit==='cow-wide'?.025:.010));records.push({id,params,target,...result,minimumDistanceM:distance,scope:'Specified static source body only; clearance/proximity, no load or all-pose certification'});}
 for(const kind of wildlifeScenes.filter(k=>k.endsWith('collar-tag'))){const q=wildlifeScene(p,kind),animal=q.assets['source-animal'],tag=q.assets['pet-tag'],collar=q.assets.collar,offset=q.instances['pet-tag'].position,t=shapes(tag,offset),body=shapes(animal),result=penetration(t,body);assert.equal(result.contained+result.crossing,0,JSON.stringify({kind,...result}));const ring=t.filter(t=>/连接环/.test(t.name)||t.name.includes(String(p.styles.yunshan.petHardware))),collarRing=shapes(collar).filter(t=>/悬挂环/.test(t.name)||t.name.includes(String(p.styles.yunshan.petHardware))),distance=Math.min(...ring.flatMap(a=>collarRing.map(b=>shapeDistance(a,b))));assert.ok(distance<.0035);records.push({scene:kind,id:'CHAR-329',target:String(animal.source!.catalogId),...result,ringSurfaceDistanceM:distance,actualPosition:offset,scope:'Actual tag translated between named hanger and collar mount; no fake identity'});}
 return records;
}

export function wildlifeApertureAudit(){const p=productionProject('M043 actual apertures'),rows=[];for(const id of wildlifeIds)for(const params of wildlifeVariants(id)){const a=makeWildlifeAsset(id,id,id,p.styles.yunshan,params),shapes=wildlifeAuditShapes(a,p.materials),checks:{name:string;point:V3;solid:boolean}[]=[],add=(name:string,point:V3,solid=false)=>checks.push({name,point,solid}),f=(a.source!.detail as any).fit;
 if(id==='CHAR-320'){add('long legs remain separate',[0,.025,-.05]);add('solid heron torso',[0,.67,.065],true);}
 if(id==='CHAR-321'){add('actual bifurcated tail centre',[0,.14,.345]);add('solid elongate fish body',[0,.14,0],true);}
 if(id==='CHAR-322'){add('space beyond butterfly head',[0,.032,-.052]);add('solid narrow butterfly abdomen',[0,.025,.023],true);}
 if(id==='CHAR-323'){add('space below insect body',[0,.005,0]);add('solid bee head',[0,.0145,-.009],true);}
 if(id==='CHAR-324'){add('open rib cage',[0,.31,.05]);add('real central guide joint',[0,.37,.06],true);for(const s of[-1,1])add('open eye guide '+s,rigPoint(a,[s*.045,.54,-.315],'head'));}
 if(id==='CHAR-325'){add('open bird rib cage',[0,.47,.017]);add('real bird guide root',[0,.50,.045],true);}
 if(id==='CHAR-326'){add('space between fish ribs',[0,.104,-.06]);add('real fish guide root',[0,.14,-.025],true);}
 if(id==='CHAR-327'){add('space between insect feet',[0,.005,0]);add('actual thorax solid',[0,.027*1.55,0],true);}
 if(id==='CHAR-328'||id==='CHAR-331'){add('neck opening through centre',f.c);add('actual woven band',[f.rx-(id==='CHAR-328'?.003:.004),f.c[1],f.c[2]],true);}
 if(id==='CHAR-329'){add('true tag eyelet',[0,.055,0]);add('true hanging ring',[0,.064,-.001]);add('solid metal tag',[0,.025,0],true);}
 if(id==='CHAR-330'){add('actual empty thorax aperture',[0,f.cy,f.zs[0]]);add('solid outer harness band',[f.rx-.0025,f.cy,f.zs[0]],true);}
 for(const c of checks){const hit=shapes.some(s=>inside(new Vector3(...c.point),s));assert.equal(hit,c.solid,id+JSON.stringify(params)+' '+c.name);rows.push({id,params,name:c.name,point:c.point,expectedSolid:c.solid,actualSolid:hit});}}
 return rows;
}

export function wildlifeAuditShapes(a:Asset,materials:Record<string,Material>,offset:V3=[0,0,0]){return[...wildlifeComponents(a,true).map(m=>({name:m.name,positions:m.positions,indices:m.indices})),...displayMesh(a,materials).filter(b=>!b.meshName).map((b,j)=>({name:'native-'+j,positions:b.positions,indices:b.indices}))].map(b=>auditShape(b.name,b.positions.map((v,k)=>v+offset[k%3]),b.indices));}
