import {catalogStages,catalogTypes,queryCatalog,effectiveStage,type CatalogEntry} from '../core/catalog';
import type {Command,Project} from '../core/types';
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
type Options={getProject:()=>Project;edit:(commands:Command[],label:string,preview?:boolean)=>Promise<void>;safe:(f:()=>any)=>any;openAsset:(id:string)=>any;modal:(title:string,body:string,buttons:{label:string;primary?:boolean;action:()=>any}[])=>void;close:()=>void};
export class CatalogPanel{
 query='';type='';stage='';offset=0;
 constructor(private el:HTMLElement,private options:Options){}
 render(){
  const p=this.options.getProject(),result=queryCatalog(p,{query:this.query,type:this.type,stage:this.stage,offset:this.offset,limit:24}),s=result.summary;
  this.el.innerHTML=`<section class="section catalog-head"><div class="row between"><h2>制作清单</h2><span class="pill">${s.total} 项</span></div><p class="subtle">${esc(s.sourceName??'导入城市资产 CSV')}<br>条目用于排产，模型以资产库为准。</p><div class="catalog-totals">${Object.entries(s.types).map(([type,count])=>`<span>${esc(type)}<b>${count}</b></span>`).join('')}</div><p class="subtle">关联 ${s.linkedMasters} 个母版 · 验收 ${s.stages.accepted} 项</p><label class="catalog-import">导入 / 合并 CSV<input id="catalog-file" type="file" accept=".csv,text/csv"></label></section><div class="pane field-stack"><input id="catalog-search" aria-label="搜索制作清单" placeholder="ID、名称、接口…" value="${esc(this.query)}"><select id="catalog-type" aria-label="条目类型"><option value="">全部类型</option>${catalogTypes.map(t=>`<option ${t===this.type?'selected':''}>${esc(t)}</option>`).join('')}</select><select id="catalog-stage" aria-label="制作进度"><option value="">全部制作进度</option>${Object.entries(catalogStages).map(([k,v])=>`<option value="${k}" ${k===this.stage?'selected':''}>${v}</option>`).join('')}</select></div><div id="catalog-rows"></div>`;
  const search=this.el.querySelector<HTMLInputElement>('#catalog-search')!;search.oninput=()=>{this.query=search.value;this.offset=0;this.renderRows();};
  for(const [id,key]of[['catalog-type','type'],['catalog-stage','stage']] as const)this.el.querySelector<HTMLSelectElement>('#'+id)!.onchange=e=>{this[key]=(e.target as HTMLSelectElement).value;this.offset=0;this.renderRows();};
  this.el.querySelector<HTMLInputElement>('#catalog-file')!.onchange=e=>this.options.safe(async()=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(file.size>8_000_000)throw new Error('CSV 文件过大');await this.options.edit([{op:'importCatalog',sourceName:file.name,csv:await file.text()}],'合并制作清单',true);});
  this.renderRows();
 }
 private renderRows(){
  const r=queryCatalog(this.options.getProject(),{query:this.query,type:this.type,stage:this.stage,offset:this.offset,limit:24});
  if(this.offset&&this.offset>=r.total){this.offset=0;this.renderRows();return;}
  const el=this.el.querySelector<HTMLElement>('#catalog-rows')!;
  el.innerHTML=`<div class="pane row between catalog-pagination"><small>${r.total?this.offset+1:0}–${Math.min(this.offset+24,r.total)} / ${r.total}</small><button id="catalog-prev" ${!this.offset?'disabled':''}>‹</button><button id="catalog-next" ${r.nextOffset===null?'disabled':''}>›</button></div>${r.entries.map(e=>`<button class="catalog-row" data-catalog-id="${esc(e.id)}"><div class="row between"><small>${esc(e.id)}</small><span class="catalog-stage">${catalogStages[e.effectiveStage]}</span></div><b>${esc(e.source['中文名称'])}</b><small>${esc(e.source['条目类型'])} · ${esc(e.source['类别'])}</small><small class="catalog-source">原表：${esc(e.source['状态'])}</small></button>`).join('')||'<p class="empty">没有匹配条目</p>'}`;
  el.querySelector<HTMLButtonElement>('#catalog-prev')!.onclick=()=>{this.offset=Math.max(0,this.offset-24);this.renderRows();};el.querySelector<HTMLButtonElement>('#catalog-next')!.onclick=()=>{this.offset+=24;this.renderRows();};
  el.querySelectorAll<HTMLButtonElement>('[data-catalog-id]').forEach(button=>button.onclick=()=>this.open(button.dataset.catalogId!));
 }
 private open(id:string){
  const p=this.options.getProject(),e=p.catalog!.entries[id],stage=effectiveStage(e,p);
  this.options.modal(`${e.id} · ${e.source['中文名称']}`,`<div class="catalog-detail"><p>原表状态：<b>${esc(e.source['状态'])}</b>。保留为来源记录，未自动验证原表提到的代码或资产。</p><div class="field-stack"><label>本项目进度<select id="catalog-edit-stage">${Object.entries(catalogStages).map(([k,v])=>`<option value="${k}" ${k===stage?'selected':''}>${v}</option>`).join('')}</select></label><label>关联真实母版（可多选）<select id="catalog-assets" multiple size="5">${Object.values(p.assets).map(a=>`<option value="${esc(a.id)}" ${e.assetIds.includes(a.id)?'selected':''}>${esc(a.name)} · ${esc(a.id)}</option>`).join('')}</select></label><label>制作 / 验收记录<textarea id="catalog-note" maxlength="4000">${esc(e.note)}</textarea></label></div><p class="subtle">验收针对记录的母版版本；母版改动后自动显示待验收。动画、材质条目目前不能按模型方式验收。</p>${Object.entries(e.source).filter(([k])=>!['asset_id','中文名称','状态'].includes(k)).map(([k,v])=>`<div class="catalog-source-field"><b>${esc(k)}</b><p>${esc(v)||'—'}</p></div>`).join('')}</div>`,[
   {label:'关闭',action:this.options.close},
   ...(e.assetIds.length?[{label:'查看关联模型',action:()=>{this.options.close();void this.options.openAsset(e.assetIds[0]);}}]:[]),
   {label:'保存制作记录',primary:true,action:async()=>{const stage=(document.getElementById('catalog-edit-stage') as HTMLSelectElement).value,assetIds=[...(document.getElementById('catalog-assets') as HTMLSelectElement).selectedOptions].map(o=>o.value),note=(document.getElementById('catalog-note') as HTMLTextAreaElement).value;this.options.close();await this.options.edit([{op:'catalogEntry',id,stage,assetIds,note}],'更新制作记录');}}
  ]);
 }
}
