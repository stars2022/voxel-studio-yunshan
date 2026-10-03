import type {Project} from './types';

export const catalogTypes=['基础组件','组合模板','配色尺寸变体','材质贴图','动画特效'] as const;
export const catalogStages={planned:'待制作',modeling:'建模中',review:'待验收',accepted:'已验收'} as const;
export type CatalogStage=keyof typeof catalogStages;
export type CatalogEntry={id:string;source:Record<string,string>;stage:CatalogStage;assetIds:string[];note:string;reviewedVersions?:Record<string,number>};
export type Catalog={sourceName:string;importedAt:string;entries:Record<string,CatalogEntry>};
const headers=['asset_id','中文名称','类别','条目类型','用途关联系统','状态','现有证据','生产方式','依赖接口','基础母版ID','派生规则','验收要求'];
const safeId=(s:string)=>/^(?!__proto__$|prototype$|constructor$)[a-zA-Z0-9_-]{1,80}$/.test(s);

// CSV is source data only. No formulas, paths, links or instructions are executed.
export function parseCatalogCSV(csv:string):CatalogEntry[]{
 if(typeof csv!=='string'||csv.length>4_000_000)throw new Error('清单 CSV 超过 4,000,000 字符');
 const text=csv.replace(/^\uFEFF/,''),rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
 const cell=()=>{if(field.length>12000)throw new Error('清单单元格过长');row.push(field);field='';closed=false;if(row.length>30)throw new Error('清单列数过多');};
 const line=()=>{cell();if(row.some(s=>s!==''))rows.push(row);row=[];if(rows.length>5001)throw new Error('清单最多 5,000 项');};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c===','){cell();continue;}
  if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;line();continue;}
  if(closed)throw new Error('CSV 引号后只能接分隔符或换行');
  if(c==='"'){if(field)throw new Error('CSV 字段内引号必须转义');quoted=true;}else field+=c;
 }
 if(quoted)throw new Error('CSV 引号未闭合');if(field||closed||row.length)line();
 const head=rows.shift();if(!head||head.length!==headers.length||new Set(head).size!==head.length||headers.some(h=>!head.includes(h)))throw new Error('CSV 列名不匹配城市资产清单格式');
 const seen=new Set<string>();return rows.map((r,i)=>{
  if(r.length!==head.length)throw new Error(`CSV 第 ${i+2} 行列数不匹配`);
  const source=Object.fromEntries(head.map((h,j)=>[h,r[j]])),id=source.asset_id;
  if(!safeId(id)||seen.has(id))throw new Error(`清单 ID 无效或重复：${id}`);seen.add(id);
  if(!source['中文名称']||!catalogTypes.includes(source['条目类型'] as any))throw new Error(`清单名称或类型无效：${id}`);
  return{id,source,stage:'planned',assetIds:[],note:''};
 });
}

export function effectiveStage(entry:CatalogEntry,p:Pick<Project,'assets'>):CatalogStage{
 if(entry.stage==='accepted'&&entry.assetIds.some(id=>p.assets[id]?.version!==entry.reviewedVersions?.[id]))return'review';
 return entry.stage;
}
export function catalogSummary(p:Pick<Project,'assets'|'catalog'>){
 const entries=Object.values(p.catalog?.entries??{}),types=Object.fromEntries(catalogTypes.map(t=>[t,0])),stages=Object.fromEntries(Object.keys(catalogStages).map(t=>[t,0])),sourceStatuses:Record<string,number>=Object.create(null);
 for(const e of entries){types[e.source['条目类型']]++;stages[effectiveStage(e,p)]++;const s=e.source['状态'];sourceStatuses[s]=(sourceStatuses[s]??0)+1;}
 return{sourceName:p.catalog?.sourceName??null,total:entries.length,types,stages,sourceStatuses,linkedEntries:entries.filter(e=>e.assetIds.length).length,linkedMasters:new Set(entries.flatMap(e=>e.assetIds)).size};
}
export function queryCatalog(p:Project,args:{query?:string;type?:string;stage?:string;offset?:number;limit?:number;id?:string}){
 const q=(args.query??'').toLocaleLowerCase(),all=Object.values(p.catalog?.entries??{}),filtered=all.filter(e=>(!args.id||e.id===args.id)&&(!args.type||e.source['条目类型']===args.type)&&(!args.stage||effectiveStage(e,p)===args.stage)&&(!q||Object.values(e.source).join('\n').toLocaleLowerCase().includes(q)));
 const offset=args.offset??0,limit=args.limit??30;return{version:p.version,summary:catalogSummary(p),total:filtered.length,offset,nextOffset:offset+limit<filtered.length?offset+limit:null,entries:filtered.slice(offset,offset+limit).map(e=>({...e,effectiveStage:effectiveStage(e,p)}))};
}
export function mergeCatalog(p:Project,csv:string,sourceName:string){
 if(!sourceName||sourceName.length>160||/[\x00-\x1f/\\]/.test(sourceName))throw new Error('清单来源仅允许文件名');
 const rows=parseCatalogCSV(csv);if(!rows.length)throw new Error('清单没有数据行');
 p.catalog??={sourceName,importedAt:'',entries:{}};let added=0,updated=0;
 for(const row of rows){const old=p.catalog.entries[row.id];if(old){const changed=JSON.stringify(old.source)!==JSON.stringify(row.source);p.catalog.entries[row.id]={...old,source:row.source,...(changed&&old.stage==='accepted'?{stage:'review' as const,reviewedVersions:undefined}:{})};updated+=Number(changed);}else{p.catalog.entries[row.id]=row;added++;}}
 if(Object.keys(p.catalog.entries).length>5000)throw new Error('清单最多 5,000 项');
 p.catalog.sourceName=sourceName;p.catalog.importedAt=new Date().toISOString();return{added,updated,retained:Object.keys(p.catalog.entries).length-rows.length};
}
export function updateCatalogEntry(p:Project,c:{id:string;stage?:CatalogStage;assetIds?:string[];note?:string}){
 const e=p.catalog?.entries[c.id];if(!e)throw new Error('清单条目不存在');
 if(c.assetIds!==undefined){if(c.assetIds.some(id=>!p.assets[id]))throw new Error('清单关联的母版不存在');e.assetIds=[...c.assetIds];if(e.stage==='accepted')e.stage='review';delete e.reviewedVersions;}
 if(c.note!==undefined)e.note=c.note;if(c.stage)e.stage=c.stage;
 if(c.stage==='accepted'){
  if(!e.note.trim()||!e.assetIds.length||e.assetIds.some(id=>!Object.values(p.assets[id].chunks).some(c=>c.length)))throw new Error('验收需要关联非空母版并填写验收记录');
  if(['材质贴图','动画特效'].includes(e.source['条目类型']))throw new Error('当前清单仅支持模型验收，材质及动画需要专用验收流程');
  e.reviewedVersions=Object.fromEntries(e.assetIds.map(id=>[id,p.assets[id].version]));
 }
}
export function validateCatalog(p:Project){
 const c=p.catalog;if(c===undefined)return;
 if(!c||typeof c.sourceName!=='string'||c.sourceName.length>160||/[\x00-\x1f/\\]/.test(c.sourceName)||typeof c.importedAt!=='string'||!c.entries||Array.isArray(c.entries)||Object.keys(c.entries).length>5000)throw new Error('无效制作清单');
 for(const[id,e]of Object.entries(c.entries)){
  if(!e||id!==e.id||!safeId(id)||!Object.hasOwn(catalogStages,e.stage)||typeof e.note!=='string'||e.note.length>4000||!e.source||Object.keys(e.source).length!==headers.length||headers.some(h=>typeof e.source[h]!=='string'||e.source[h].length>12000)||e.source.asset_id!==id||!catalogTypes.includes(e.source['条目类型'] as any)||!Array.isArray(e.assetIds)||e.assetIds.length>100||new Set(e.assetIds).size!==e.assetIds.length||e.assetIds.some(id=>!safeId(id)||!Object.hasOwn(p.assets,id)))throw new Error('无效清单条目：'+id);
  if(e.stage==='accepted'&&(!e.assetIds.length||!e.note.trim()||['材质贴图','动画特效'].includes(e.source['条目类型'])||e.assetIds.some(id=>!Number.isInteger(e.reviewedVersions?.[id])||e.reviewedVersions![id]<0)))throw new Error('清单验收凭据缺失：'+id);
 }
}
