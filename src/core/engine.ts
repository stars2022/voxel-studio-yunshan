import {surfaceKinds} from './surface';
import {mergeCatalog,updateCatalogEntry,validateCatalog} from './catalog';
import {assertParameters,filterParameters} from './template-parameters';
import {createHash,randomUUID} from 'node:crypto';
import Ajv from 'ajv';
import {Grid,chunkKey} from './grid';
import {clone,eachCell,inside,rotateY,validRegion,dirs,type Project,type Asset,type V3,type Bounds,type Command,type Envelope,type EditResult} from './types';
import {generateTemplate} from './templates';
import {transactionSchema} from './schema';
import {makeCatalogAsset} from '../production/catalog-assets';
import {makeLifeAssembly} from '../production/layouts';
import {ensureProductionRoles} from '../production/style';
import {appearanceKeys,materialAppearance} from './material-appearance';
const ajv=new Ajv({strict:false,allErrors:true}),validate=ajv.compile(transactionSchema);
export class EditError extends Error{constructor(public code:string,message:string,public details?:unknown){super(message);}}
export function validateProject(p:Project){
 if(!p||p.format!=='yunshan.voxels'||p.formatVersion!==1||p.units!=='metres'||p.upAxis!=='Y'||!Number.isInteger(p.version)||p.version<0)throw new Error('不支持的原生项目格式');
 if(Object.keys(p.assets).length>500||Object.keys(p.instances).length>3000||Object.keys(p.materials).length>4096)throw new Error('项目超出安全上限');
 for(const[k,m]of Object.entries(p.materials)){if(typeof m.name!=='string'||typeof m.solid!=='boolean'||!['stone','wood','metal','ceramic','tile','glass','fabric','plant','water','emissive','sampled','plastic','paper','ink','rubber','food','wax','concrete','soil'].includes(m.category)||String(m.id)!==k||m.id<1||m.id>65535||!Number.isInteger(m.id)||!/^#[0-9a-fA-F]{6}$/.test(m.color)||!/^#[0-9a-fA-F]{6}$/.test(m.emissive)||![m.roughness,m.metalness,m.opacity].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!Number.isFinite(m.intensity)||m.intensity<0||m.intensity>20)throw new Error('无效材质');if(m.surface!==undefined&&!surfaceKinds.includes(m.surface)||m.surfaceScale!==undefined&&(!Number.isFinite(m.surfaceScale)||m.surfaceScale<.02||m.surfaceScale>10)||m.surfaceStrength!==undefined&&(!Number.isFinite(m.surfaceStrength)||m.surfaceStrength<0||m.surfaceStrength>1)||m.surfaceSeed!==undefined&&(!Number.isInteger(m.surfaceSeed)||m.surfaceSeed<0||m.surfaceSeed>65535)||m.surfaceRotation!==undefined&&![0,90,180,270].includes(m.surfaceRotation))throw new Error('无效表面纹理参数');}
 for(const roles of Object.values(p.styles))for(const id of Object.values(roles))if(!Number.isInteger(id)||!p.materials[id])throw new Error('风格引用缺失材质');
 for(const[id,a]of Object.entries(p.assets)){
  if(id!==a.id||!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!Number.isFinite(a.cellSize)||a.cellSize<.005||a.cellSize>1||a.origin.length!==3||!a.origin.every(Number.isFinite))throw new Error('无效资产坐标系');
  const g=new Grid(a.chunks);for(const[,m]of g.cells())if(!p.materials[m])throw new Error(`材质 ${m} 不存在`);
  // Sparse L-shaped assets can have large empty bounding volumes. Metadata does
  // not enumerate that volume; actual region edits retain validRegion's 2M cap.
  const parts=new Set(a.parts.map(x=>x.id));for(const part of a.parts){validRegion(part.region,64_000_000);if(part.parent&&!parts.has(part.parent))throw new Error('部件父级缺失');let curr=part;const seen=new Set<string>();while(curr.parent){if(seen.has(curr.id))throw new Error('部件层级存在环');seen.add(curr.id);curr=a.parts.find(x=>x.id===curr.parent)!;}}
  for(const port of a.ports)if(![...port.position,...port.normal,...port.size,port.pitch].every(Number.isFinite)||port.pitch<=0||port.normal.filter(n=>Math.abs(n)===1).length!==1||port.normal.some(n=>![0,1,-1].includes(n)))throw new Error('无效安装接口');
  for(const o of a.openings)validRegion(o);
 }
 for(const i of Object.values(p.instances)){if(!p.assets[i.assetId]||i.position.length!==3||!i.position.every(Number.isFinite)||!Number.isInteger(i.rotation)||i.rotation<0||i.rotation>3)throw new Error('无效实例');const seen=new Set<string>();let c=i;while(c.parent){if(seen.has(c.id)||!p.instances[c.parent])throw new Error('实例父级缺失或循环');seen.add(c.id);c=p.instances[c.parent];}}
 for(const a of Object.values(p.assemblies??{}))for(const i of a.instances)if(!p.assets[i.assetId]||!i.position.every(Number.isFinite))throw new Error('组合模板引用缺失母版或无效位置');
 if(p.selection.assetId&&!p.assets[p.selection.assetId])throw new Error('选区引用缺失资产');
 validateCatalog(p);
}
type Snapshot={label:string;document:string};
export class Engine{
 project:Project; undoStack:Snapshot[]=[];redoStack:Snapshot[]=[];
 idempotency=new Map<string,{hash:string,result:EditResult}>();previews=new Map<string,{hash:string,time:number}>();
 constructor(p:Project){validateProject(p);this.project=clone(p);}
 execute(e:Envelope):EditResult{
  if(!validate(e))throw new EditError('INVALID_INPUT',ajv.errorsText(validate.errors));
  const t=performance.now(),hash=createHash('sha256').update(JSON.stringify({version:e.expectedVersion,commands:e.commands})).digest('hex');
  const prior=this.idempotency.get(e.requestId);if(prior){if(prior.hash!==hash)throw new EditError('IDEMPOTENCY_CONFLICT','requestId 已用于不同请求');return clone(prior.result);}
  if(e.expectedVersion!==this.project.version)throw new EditError('VERSION_CONFLICT',`版本冲突：请求 ${e.expectedVersion}，当前 ${this.project.version}`);
  const historyOp=e.commands.find(c=>c.op==='undo'||c.op==='redo');if(historyOp&&e.commands.length!==1)throw new EditError('INVALID_INPUT','撤销/重做必须单独执行');
  const before=this.project,warnings:string[]=[];let work=clone(before),history:Snapshot|undefined;
  if(historyOp){const stack=historyOp.op==='undo'?this.undoStack:this.redoStack;history=stack.at(-1);if(!history)throw new EditError('EMPTY_HISTORY','没有可撤销/重做的操作');work=JSON.parse(history.document);}
  else for(const c of e.commands)this.apply(work,c,warnings);
  validateProject(work);
  const dirty:Record<string,string[]>={},bounds:Record<string,Bounds|null>={},affected=new Set<string>();let modified=0;
  for(const id of new Set([...Object.keys(before.assets),...Object.keys(work.assets)])){
    const a=before.assets[id],b=work.assets[id];if(JSON.stringify(a)===JSON.stringify(b))continue;affected.add(id);
    const old=new Grid(a?.chunks??{}),now=new Grid(b?.chunks??{}),keys=new Set<string>();
    const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];
    for(const g of[old,now])for(const[p,m]of g.cells()){if((g===old?now:old).get(p)===m)continue;if(g===now&&old.get(p))continue;modified++;for(let d=0;d<3;d++){min[d]=Math.min(min[d],p[d]);max[d]=Math.max(max[d],p[d]+1);}keys.add(chunkKey(p));for(const dir of dirs)keys.add(chunkKey(p.map((n,d)=>n+dir[d]) as V3));}
    dirty[id]=[...keys];bounds[id]=min[0]===Infinity?null:{min,max};if(b)b.version=(a?.version??0)+1;
  }
  const materialChanged=JSON.stringify(before.materials)!==JSON.stringify(work.materials);
  if(materialChanged)for(const a of Object.values(work.assets)){affected.add(a.id);dirty[a.id]=Object.keys(a.chunks);}
  const affectedInstances=Object.values(work.instances).filter(i=>affected.has(i.assetId)||JSON.stringify(i)!==JSON.stringify(before.instances[i.id])).map(i=>i.id);
  for(const i of Object.values(before.instances))if(!work.instances[i.id])affectedInstances.push(i.id);
  const result:EditResult={version:before.version,modifiedVoxels:modified,affectedAssets:[...affected],affectedInstances,bounds,warnings,dryRun:!!e.dryRun,dirtyChunks:dirty,label:e.label??historyOp?.op??'编辑事务',durationMs:performance.now()-t};
  if(e.dryRun){const token=randomUUID();this.previews.set(token,{hash,time:Date.now()});if(this.previews.size>100)this.previews.delete(this.previews.keys().next().value!);return{...result,previewToken:token};}
  if(!historyOp&&(modified>4096||affectedInstances.length>10)){
   const preview=e.previewToken?this.previews.get(e.previewToken):null;
   if(!preview||preview.hash!==hash||Date.now()-preview.time>300000)throw new EditError('PREVIEW_REQUIRED','大范围修改请先 dry-run，检查数量、包围盒及实例后提交 previewToken',result);
  }
  if(historyOp){(historyOp.op==='undo'?this.undoStack:this.redoStack).pop();(historyOp.op==='undo'?this.redoStack:this.undoStack).push({label:history!.label,document:JSON.stringify(before)});}
  else {this.undoStack.push({label:e.label??'编辑事务',document:JSON.stringify(before)});this.redoStack=[];}
  let budget=this.undoStack.reduce((n,s)=>n+s.document.length,0);while(this.undoStack.length>50||(budget>64_000_000&&this.undoStack.length>1))budget-=this.undoStack.shift()!.document.length;
  work.version=before.version+1;work.modifiedAt=new Date().toISOString();this.project=work;result.version=work.version;result.durationMs=performance.now()-t;
  this.idempotency.set(e.requestId,{hash,result:clone(result)});if(this.idempotency.size>1000)this.idempotency.delete(this.idempotency.keys().next().value!);return result;
 }
 private apply(p:Project,c:Command,warnings:string[]){
  if(c.op==='produceCatalogAsset'){
   const e=p.catalog?.entries[c.catalogId];if(!e||e.source['条目类型']!=='基础组件')throw new Error('先导入清单；此操作只生成已实现的基础组件');
   if(p.assets[c.id])throw new Error('资产 ID 重复');const styleName=c.style??'yunshan',style=p.styles[styleName];if(!style)throw new Error('风格不存在');
   const added=ensureProductionRoles(p,styleName);if(added.length)warnings.push('新增独立材质角色：'+added.join('、')+'；已有材质保持原样。');
   const a=makeCatalogAsset(c.catalogId,e.source['中文名称'],c.id,style,c.params??{});a.source!.style=styleName;p.assets[c.id]=a;
   updateCatalogEntry(p,{id:c.catalogId,stage:'modeling',assetIds:[...new Set([...e.assetIds,c.id])],note:'已有可编辑几何候选；尺寸为制作默认值。尚未通过人工美术、游戏功能点、LOD 或动画验收。'});return;
  }
  if(c.op==='rebuildCatalogAsset'){
   const old=p.assets[c.assetId];if(old?.source?.kind!=='catalog-recipe')throw new Error('不是清单配方生成的母版');
   const styleName=String(old.source.style??'yunshan');ensureProductionRoles(p,styleName);const a=makeCatalogAsset(String(old.source.catalogId),old.name,old.id,p.styles[styleName],{...(old.source.parameters as Record<string,number|string>),...c.params});a.origin=old.origin;a.source!.style=styleName;p.assets[a.id]=a;warnings.push('重新生成母版几何；手工体素修改会被替换，所有放置实例同步。');return;
  }
  if(c.op==='produceCatalogAssembly'){
   const e=p.catalog?.entries[c.catalogId];if(!e||e.source['条目类型']!=='组合模板')throw new Error('先导入对应组合清单');
   p.assemblies??={};if(p.assemblies[c.id])throw new Error('组合 ID 重复');const a=makeLifeAssembly(p,c.catalogId,c.id,e.source['中文名称']);p.assemblies[c.id]=a;
   if(c.place)for(const i of a.instances){if(p.instances[i.id])throw new Error('实例 ID 重复');p.instances[i.id]=i;}
   updateCatalogEntry(p,{id:c.catalogId,stage:'modeling',assetIds:[...new Set(a.instances.map(i=>i.assetId))],note:'已生成组合 '+c.id+'；复用母版的相对陈设研究。未接入真实房间 FloorPlan、功能点、供电、库存或行为系统，不能作为游戏集成验收。'});return;
  }
  if(c.op==='importCatalog'){const r=mergeCatalog(p,c.csv,c.sourceName);warnings.push(`清单新增 ${r.added} 项、更新 ${r.updated} 项、保留未出现的 ${r.retained} 项；原表状态仅作来源记录，不代表模型验收。`);return;}
  if(c.op==='catalogEntry'){updateCatalogEntry(p,c as any);return;}
  const asset=()=>{const a=p.assets[c.assetId];if(!a)throw new Error(`资产 ${c.assetId} 不存在`);return a;};
  const material=()=>{if(!p.materials[c.material])throw new Error('材质不存在');return c.material as number;};
  if(c.op==='createAssembly'){p.assemblies??={};const instances=c.instanceIds.map((id:string)=>{if(!p.instances[id])throw new Error('组合引用实例不存在');return clone(p.instances[id]);});for(const i of instances)if(i.parent&&!c.instanceIds.includes(i.parent))i.parent=null;p.assemblies[c.id]={id:c.id,name:c.name,version:(p.assemblies[c.id]?.version??0)+1,instances};return;}
  if(c.op==='instantiateAssembly'){const assembly=p.assemblies?.[c.assemblyId];if(!assembly)throw new Error('组合模板不存在');for(const i of assembly.instances){const id=c.prefix+'-'+i.id;if(id.length>80||p.instances[id])throw new Error('组合实例 ID 重复/过长');const rotated=rotateY(i.position,c.rotation),position=rotated.map((n,d)=>n+c.position[d]) as V3;this.apply(p,{op:'instance',id,assetId:i.assetId,name:i.name,position,rotation:(i.rotation+c.rotation)%4,parent:i.parent?c.prefix+'-'+i.parent:null},warnings);}return;}
  if(c.op==='metadata'){const a=asset();for(const k of['origin','parts','ports','openings'] as const)if(c[k]!==undefined)(a as any)[k]=clone(c[k]);return;}
  if(c.op==='definePalette'){for(const id of Object.keys(c.materials))if(!p.materials[id])throw new Error('配色引用缺失材质');p.palettes[c.name]=c.materials;return;}
  if(c.op==='createAsset'){
   if(p.assets[c.id])throw new Error('资产 ID 重复');const style=p.styles[c.style??'yunshan'];if(!style)throw new Error('风格不存在');
   p.assets[c.id]=c.template==='empty'?{id:c.id,name:c.name,version:0,category:'base',cellSize:c.cellSize,origin:[0,0,0],chunks:{},parts:[],ports:[],openings:[]}:generateTemplate(c.id,c.name,c.template,c.params??{},c.cellSize,style,c.style??'yunshan');return;
  }
  if(c.op==='regenerate'){const a=asset();if(!a.template)throw new Error('该资产没有参数模板');assertParameters(a.template.type,c.params);p.assets[a.id]=generateTemplate(a.id,a.name,a.template.type,filterParameters(a.template.type,{...a.template.params,...c.params}),a.cellSize,p.styles[a.template.style],a.template.style);p.assets[a.id].origin=a.origin;warnings.push('参数重建替换该母版的手工体素编辑；所有引用实例同步。');return;}
  if(['voxels','assignMaterial','transform','extrude'].includes(c.op)){
   const a=asset(),g=new Grid(a.chunks);let region=c.region as Bounds|undefined;if(c.partId){const part=a.parts.find(x=>x.id===c.partId);if(!part)throw new Error('部件不存在');region=part.region;}if(region)validRegion(region);
   if(c.op==='voxels'){
    if(!region&&!c.cells?.length)throw new Error('提供 region 或 cells');if(c.mode!=='remove')material();
    const targets:V3[]=c.cells?[...c.cells]:[];if(region)eachCell(region,v=>targets.push(v));if(targets.length>2_000_000)throw new Error('操作过大');
    if(c.mode==='flood'){
      if(!region||!c.cells?.length)throw new Error('连通填充需要 region 和种子 cells');const seed=c.cells[0] as V3,original=g.get(seed),seen=new Set<string>(),queue:V3[]=[seed];targets.length=0;
      for(let q=0;q<queue.length;q++){const v=queue[q],key=v.join(',');if(seen.has(key)||!inside(v,region)||g.get(v)!==original)continue;seen.add(key);targets.push(v);for(const d of dirs)queue.push(v.map((n,i)=>n+d[i]) as V3);}
    }
    for(const v of targets){let positions:V3[]=[v];if(c.symmetry)for(const axis of c.symmetry.axes){positions.push(...positions.map(q=>{const r=[...q] as V3;r[axis]=2*c.symmetry.pivot[axis]-q[axis]-1;return r;}));}
     for(const q of positions){const old=g.get(q);if(c.mode==='add'&&old)continue;if(c.mode==='replace'&&(!old||(c.fromMaterial&&old!==c.fromMaterial)))continue;g.set(q,c.mode==='remove'?0:c.material);}}
   }else if(c.op==='assignMaterial'){
    material();if(c.direction&&!dirs.some(d=>d.every((v,i)=>v===c.direction[i])))throw new Error('表面方向必须是六向单位向量');
    const matches=[...g.cells(region)].filter(([v,m])=>{
     if(c.fromMaterial&&m!==c.fromMaterial)return false;if(c.height){const y=a.origin[1]+v[1]*a.cellSize;if(y<c.height.min||y>=c.height.max)return false;}
     if(c.direction&&g.get(v.map((n,i)=>n+c.direction[i]) as V3))return false;
     if(c.rule==='outer'&&!dirs.some(d=>!g.get(v.map((n,i)=>n+d[i]) as V3)))return false;
     if(c.rule==='checker'&&Math.floor(v.reduce((s,n)=>s+n,0)/(c.period??1))%2!==0)return false;return true;
    });for(const[v]of matches)g.set(v,c.material);
   }else if(c.op==='extrude'){
    if(!dirs.some(d=>d.every((v,i)=>v===c.direction[i])))throw new Error('挤出方向必须是六向单位向量');const cells=[...g.cells(region)];if(cells.length*c.distance>1_000_000)throw new Error('挤出过大');for(const[v,m]of cells)if(!g.get(v.map((n,i)=>n+c.direction[i]) as V3))for(let j=1;j<=c.distance;j++)g.set(v.map((n,i)=>n+c.direction[i]*j) as V3,m);
   }else{
    const bounds=region??g.bounds();if(!bounds)return;const cells=[...g.cells(bounds)],count=c.count??1;if(cells.length*count>1_000_000)throw new Error('阵列过大');
    const mapped:(v:V3,k:number)=>V3=(v,k)=>{let q=v.map((n,i)=>n-bounds.min[i]) as V3;let dims=bounds.max.map((n,i)=>n-bounds.min[i]) as V3;
      if(c.mirror!==undefined)q[c.mirror]=dims[c.mirror]-1-q[c.mirror];
      if(c.rotation){const axis=c.rotation.axis,u=(axis+1)%3,z=(axis+2)%3;for(let j=0;j<((c.rotation.quarterTurns%4)+4)%4;j++){[q[u],q[z]]=[dims[z]-1-q[z],q[u]];[dims[u],dims[z]]=[dims[z],dims[u]];}}
      return q.map((n,i)=>n+bounds.min[i]+(c.translation?.[i]??0)+(c.step?.[i]??0)*k) as V3;
    };
    if(!c.copy)for(const[v]of cells)g.set(v,0);
    for(let k=0;k<count;k++)for(const[v,m]of cells){const q=mapped(v,k);if(g.get(q)&&!c.overwrite)throw new Error('变换与已有体素相撞；可先预览并显式 overwrite');g.set(q,m);}
    if(!c.copy&&count===1){
     const corner=(v:V3)=>{let q=v.map((n,i)=>n-bounds.min[i]) as V3;let dims=bounds.max.map((n,i)=>n-bounds.min[i]) as V3;if(c.mirror!==undefined)q[c.mirror]=dims[c.mirror]-q[c.mirror];if(c.rotation){const axis=c.rotation.axis,u=(axis+1)%3,z=(axis+2)%3;for(let j=0;j<((c.rotation.quarterTurns%4)+4)%4;j++){[q[u],q[z]]=[dims[z]-q[z],q[u]];[dims[u],dims[z]]=[dims[z],dims[u]];}}return q.map((n,i)=>n+bounds.min[i]+(c.translation?.[i]??0)) as V3;};
     const fully=(b:Bounds)=>b.min.every((n,i)=>n>=bounds.min[i]&&b.max[i]<=bounds.max[i]);
     const rotate=(v:V3)=>{const q=[...v] as V3;if(c.mirror!==undefined)q[c.mirror]*=-1;if(c.rotation){const axis=c.rotation.axis,u=(axis+1)%3,z=(axis+2)%3;for(let j=0;j<((c.rotation.quarterTurns%4)+4)%4;j++)[q[u],q[z]]=[-q[z],q[u]];}return q;};
     const mapBounds=(b:Bounds)=>{const corners:V3[]=[];for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]])corners.push(corner([x,y,z]));return{min:[0,1,2].map(d=>Math.min(...corners.map(v=>v[d]))) as V3,max:[0,1,2].map(d=>Math.max(...corners.map(v=>v[d]))) as V3};};
     for(const part of a.parts)if(fully(part.region))part.region=mapBounds(part.region);
     a.openings=a.openings.map(b=>fully(b)?mapBounds(b):b);
     for(const port of a.ports){const v=port.position.map(n=>n/a.cellSize) as V3;if(v.every((n,i)=>n>=bounds.min[i]&&n<=bounds.max[i])){port.position=corner(v).map(n=>n*a.cellSize) as V3;port.normal=rotate(port.normal);port.size=rotate(port.size).map(Math.abs) as V3;}}
    }
    warnings.push(c.copy?'复制/阵列复制体素，未复制接口定义；可在元数据编辑器补充。':'完全包含于选区的部件、开口和接口已同步变换；跨越选区边界的定义需检查。');
   }
   a.chunks=g.serialize();const rootPart=a.parts.find(p=>p.parent===null&&p.id==='root'),actualBounds=g.bounds();if(rootPart&&actualBounds)rootPart.region=actualBounds;return;
  }
  if(c.op==='materialBatch'){const ids=new Set<number>();for(const entry of c.entries){if(ids.has(entry.id))throw new Error('批量材质 ID 重复');ids.add(entry.id);this.apply(p,{op:'material',id:entry.id,properties:entry.properties},warnings);}return;}
  if(c.op==='material'){const old=p.materials[c.id];if(!old&&['name','category','color','roughness','metalness','opacity','emissive','intensity','solid'].some(k=>c.properties[k]===undefined))throw new Error('新材质需要全部属性');p.materials[c.id]={...old,...c.properties,id:c.id};return;}
  if(c.op==='palette'){const palette=p.palettes[c.name];if(!palette)throw new Error('配色方案不存在');let legacy=false;for(const[id,props]of Object.entries(palette)){if(!p.materials[id])throw new Error('配色引用缺失材质');if(Object.keys(props).some(k=>!(appearanceKeys as readonly string[]).includes(k)))legacy=true;Object.assign(p.materials[id],materialAppearance(props));}if(legacy)warnings.push('旧配色中的非外观字段已忽略；保留当前材质 ID、分类与碰撞属性。');return;}
  if(c.op==='style'){for(const m of Object.values(c.roles))if(!p.materials[m as number])throw new Error('风格引用缺失材质');p.styles[c.id]=c.roles;return;}
  if(c.op==='instance'){
   const a=asset();for(let d=0;d<3;d++)if(Math.abs(c.position[d]/a.cellSize-Math.round(c.position[d]/a.cellSize))>1e-5)throw new Error('实例位置必须吸附到母版格距');
   p.instances[c.id]={id:c.id,assetId:a.id,name:c.name??a.name,position:c.position,rotation:c.rotation??0,parent:c.parent??null};return;
  }
  if(c.op==='connect'){
   if(p.instances[c.id])throw new Error('实例 ID 重复');const a=asset(),target=p.instances[c.targetInstanceId];if(!target)throw new Error('目标实例不存在');const b=p.assets[target.assetId],port=a.ports.find(x=>x.id===c.portId),other=b.ports.find(x=>x.id===c.targetPortId);if(!port||!other)throw new Error('接口不存在');
   if(Math.abs(a.cellSize-b.cellSize)>1e-8||Math.abs(port.pitch-other.pitch)>1e-8||port.kind!==other.kind)throw new Error('格距或接口类型不兼容');
   const n=rotateY(port.normal,c.rotation),m=rotateY(other.normal,target.rotation);if(n.some((v,i)=>v!==-m[i]))throw new Error('接口法线必须相对');
   const x=rotateY(port.size,c.rotation).map(Math.abs),y=rotateY(other.size,target.rotation).map(Math.abs);if(x.some((v,i)=>Math.abs(v-y[i])>1e-5))throw new Error('接口截面不匹配');
   const pa=rotateY(port.position.map((v,i)=>v+a.origin[i]) as V3,c.rotation),pb=rotateY(other.position.map((v,i)=>v+b.origin[i]) as V3,target.rotation);
   const position=pb.map((v,i)=>v+target.position[i]-pa[i]) as V3,oa=rotateY(a.origin,c.rotation),ob=rotateY(b.origin,target.rotation);if(oa.some((v,i)=>Math.abs((v+position[i]-ob[i]-target.position[i])/a.cellSize-Math.round((v+position[i]-ob[i]-target.position[i])/a.cellSize))>1e-5))throw new Error('端口重合但两组件网格原点不共格');
   p.instances[c.id]={id:c.id,assetId:a.id,name:a.name,position,rotation:c.rotation,parent:target.id};return;
  }
  if(c.op==='replaceInstance'){const i=p.instances[c.instanceId];if(!i)throw new Error('实例不存在');const a=asset(),old=p.assets[i.assetId];if(a.cellSize!==old.cellSize||JSON.stringify(a.ports)!==JSON.stringify(old.ports)||JSON.stringify(a.origin)!==JSON.stringify(old.origin))throw new Error('替换组件格距、原点或接口不一致');i.assetId=a.id;return;}
  if(c.op==='detach'){const i=p.instances[c.instanceId];if(!i||p.assets[c.newAssetId])throw new Error('实例缺失或资产 ID 重复');const a=clone(p.assets[i.assetId]);a.id=c.newAssetId;a.name+=' · 独立副本';p.assets[a.id]=a;i.assetId=a.id;return;}
  if(c.op==='removeInstance'){if(Object.values(p.instances).some(i=>i.parent===c.id))throw new Error('先移除或重新挂接子实例');delete p.instances[c.id];return;}
  if(c.op==='removeAsset'){if(Object.values(p.instances).some(i=>i.assetId===c.id)||Object.values(p.assemblies??{}).some(a=>a.instances.some(i=>i.assetId===c.id)))throw new Error('资产仍被实例/组合模板引用');if(Object.values(p.catalog?.entries??{}).some(e=>e.assetIds.includes(c.id)))throw new Error('资产仍被制作清单引用，请先解除关联');delete p.assets[c.id];if(p.selection.assetId===c.id)p.selection={assetId:null,region:null,partId:null};return;}
  if(c.op==='select'){if(c.assetId&&!p.assets[c.assetId])throw new Error('选区资产不存在');if(c.partId&&!p.assets[c.assetId]?.parts.some(x=>x.id===c.partId))throw new Error('选区部件不存在');if(c.region)validRegion(c.region);p.selection={assetId:c.assetId,region:c.region,partId:c.partId};return;}
  if(c.op==='renameProject'){p.name=c.name;return;}
  if(c.op==='installAsset'){if(p.assets[c.asset.id])throw new Error('导入资产 ID 重复');if(c.materials)for(const[id,m]of Object.entries(c.materials)){if(p.materials[id]&&JSON.stringify(p.materials[id])!==JSON.stringify(m))throw new Error('导入材质 ID 冲突');p.materials[id]=m as any;}p.assets[c.asset.id]=c.asset;return;}
  throw new Error(`未知命令 ${c.op}`);
 }
}
