import {ArchitectureComponent} from './architecture-components';
import type {Project,V3} from '../core/types';
import {productionProject} from './style';
import type {AtlasRecipe} from './atlas-life';

export const nonReferenceBaseRecipes:Record<string,Omit<AtlasRecipe,'draw'>>={'BUILT-004':{size:[6.4,3.2,.4]as V3,pitch:.02,features:'共享0.4m分段墙、实际门窗贯通洞、独立20mm铜销',limits:'新作者父母版；原FloorPlan门位和控制器未提供，不冒称历史原件。'}};
export function makeSharedWall(name:string,id:string,style:Record<string,number>,params:Record<string,string|number>={},context?:Project){
 if(Object.keys(params).length)throw new Error('共享墙只支持已验证的固定开洞配置');
 let p:Project;
 if(context)p={...context,styles:{...context.styles,yunshan:style}};
 else{p=productionProject(name);const defaults=p.styles.yunshan,materials:Project['materials']={};for(const role of['wall','mortar','wood','woodEdge','metal','architecturePin']){const to=style[role];if(!to)throw new Error('共享墙缺少实际材质用途 '+role);materials[to]={...p.materials[defaults[role]],id:to};}p={...p,styles:{yunshan:style},materials};}
 const a=segmentedWall(p,id);a.name=name;return a;
}

/** New authored BUILT-004; this is not a recovered historical wall master. */
export function segmentedWall(p:Project,id:string){
 const width=6.4,height=3.2,thickness=.4;
 const holes=[{name:'door',min:[.4,0,0]as V3,max:[1.6,2.4,.4]as V3},{name:'window',min:[3.2,.9,0]as V3,max:[5.6,2.4,.4]as V3}];
 const b=new ArchitectureComponent(p,id,'共享分段实体墙 · 明确作者母版',[],{width,height,wallThicknessM:thickness,holesM:holes});
 // Masonry stops at the actual end-post faces; overlapping exterior planes flicker in material view.
 const xs=[.16,.4,1.6,3.2,5.6,width-.16],ys=[0,.9,2.4,3.04];
 const panels:{min:V3;max:V3}[]=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
  const cx=(xs[i]+xs[i+1])/2,cy=(ys[j]+ys[j+1])/2;if(holes.some(h=>cx>h.min[0]&&cx<h.max[0]&&cy>h.min[1]&&cy<h.max[1]))continue;
  const x=xs[i],y=ys[j],w=xs[i+1]-x,h=ys[j+1]-y;panels.push({min:[x,y,0],max:[x+w,y+h,.4]});
  b.box('分段灰缝芯-'+i+'-'+j,'mortar',x,y,.04,w,h,.32);
  for(let row=y;row<y+h-1e-8;row+=.4)for(let col=x;col<x+w-1e-8;col+=.8){const ww=Math.min(.78,x+w-col-.02),hh=Math.min(.38,y+h-row-.02);if(Math.min(ww,hh)>1e-8)b.box('实体墙块-'+col+'-'+row,'wall',col+.01,row+.01,0,ww,hh,.4);}
 }
 for(const x of[0,width-.16]){
  b.box('端壁木柱','wood',x,0,0,.16,3.04,.4);
  for(const y of[.16,2.84]){
   b.box('柱箍前固定片','metal',x,y,-.02,.16,.10,.04);
   b.pin('柱箍铜销','bronze',[x+.06,y+.04,-.04]);
  }
 }
 b.box('上口连续木枋','woodEdge',0,3.04,0,width,.16,.4);
 b.parameters.wallPanelsM=panels;
 b.ports=[{id:'left',kind:'segmented-wall',position:[0,0,0],normal:[-1,0,0],size:[0,height,.4],pitch:.02},{id:'right',kind:'segmented-wall',position:[width,0,0],normal:[1,0,0],size:[0,height,.4],pitch:.02}];
 const a=b.finish();a.openings=holes.map(h=>({min:h.min.map(n=>n/.02)as V3,max:h.max.map(n=>n/.02)as V3}));
 a.source={...a.source,kind:'catalog-recipe',catalogId:'BUILT-004',recipeRevision:1,notCatalogMaster:false,style:'yunshan',parameters:{},dimensionsM:[width,height,thickness],wallPanelsM:panels,holesM:holes,wallThicknessM:thickness,reference:null,sourceStatus:'New independently authored parent from the supplied0.4m thickness and real opening contract; no prior saved BUILT-004 or original FloorPlan implementation was available.',limitations:'Door and window bounds are explicit author fixtures. Original source doors, FloorPlan, collision controller and room capacity are unbound; trim protrusion is separate from the0.4m masonry thickness.'};
 return a;
}
