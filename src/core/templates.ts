import {assertParameters,filterParameters} from './template-parameters';
import {atelierCatalog,generateAtelier} from './atelier';
import {generateAtelierDetail} from './atelier-details';
import {Grid} from './grid';
import {architectureCatalog,generateArchitecture} from '../production/architecture';
import {referenceCatalog,generateReference} from './reference-templates';
import {eachCell,type Asset,type Bounds,type V3} from './types';
export const templateCatalog = {
 ...architectureCatalog,
 ...atelierCatalog,
 ...referenceCatalog,
 wall:'墙段',corner:'转角墙',door:'门框',window:'窗框',column:'柱梁',slab:'楼板',steps:'台阶',stairs:'楼梯',railing:'栏杆',roof:'坡屋顶',eaves:'阶梯飞檐',ridge:'屋脊',corridor:'连廊',planter:'种植槽',bed:'床',table:'桌',cabinet:'柜',sofa:'沙发',monitor:'显示器',plant:'植物'
};
export function generateTemplate(id:string,name:string,type:string,p:Record<string,number>,cellSize:number,style:Record<string,number>,styleName='yunshan'):Asset{
 if(!(type in templateCatalog))throw new Error('未知模板');if(!Number.isFinite(cellSize)||cellSize<.005||cellSize>1)throw new Error('格距范围 0.005–1m');
 assertParameters(type,p);
 if(type in architectureCatalog)return generateArchitecture(id,name,type,p,cellSize,style,styleName);
 if(type==='atelier-bay')return generateAtelier(id,name,p,cellSize,style,styleName);
 if(type in atelierCatalog)return generateAtelierDetail(id,name,type,p,cellSize,style,styleName);
 if(type in referenceCatalog)return generateReference(id,name,type,p,cellSize,style,styleName);
 const defaults:Record<string,[number,number,number]>={wall:[3,3,.2],corner:[2,3,2],door:[3,3,.3],window:[3,3,.3],column:[.3,3,.3],slab:[6,.2,5],steps:[2,.6,1.2],stairs:[1.2,1.2,2.4],railing:[3,1,.15],roof:[6.8,1.4,5.8],eaves:[3,.6,1],ridge:[.3,.4,6],corridor:[3,3,2],planter:[1.2,.6,.6],bed:[1.5,.7,2],table:[1.3,.8,.7],cabinet:[1.2,1.8,.5],sofa:[2,.85,.8],monitor:[.7,.5,.15],plant:[.8,1.4,.8]};
 const base=defaults[type];for(const [key,v] of Object.entries(p)){if(!['width','height','depth','thickness','detail','openingWidth','openingHeight','sill','glass','steps','spacing'].includes(key))throw new Error('未知模板参数 '+key);if(!Number.isFinite(v)||v<0||v>50)throw new Error('参数必须为 0–50 的有限米数/密度');if(['width','height','depth','thickness'].includes(key)&&v<cellSize)throw new Error('尺寸不能小于一个体素');}
 const n=(v:number)=>Math.max(1,Math.round(v/cellSize)),w=n(p.width??base[0]),h=n(p.height??base[1]),d=n(p.depth??base[2]),t=n(p.thickness??.15),detail=Math.max(1,Math.round(p.detail??2));
 const effective:Record<string,number>={...p,width:w*cellSize,height:h*cellSize,depth:d*cellSize,thickness:t*cellSize,detail};
 if(w*h*d>2_000_000)throw new Error('模板包围体超过 2,000,000 格，请增大格距');
 const g=new Grid(),parts:Asset['parts']=[],openings:Bounds[]=[];
 const box=(min:V3,max:V3,mat:number)=>{if(max.every((v,i)=>v>min[i]))eachCell({min,max},v=>g.set(v,mat));};
 const part=(id:string,name:string,min:V3,max:V3)=>parts.push({id,name,parent:'root',region:{min,max}});
 const s=style, wall=s.wall,frame=s.metal,wood=s.wood;
 if(['wall','door','window'].includes(type)){
   box([0,0,0],[w,h,d],wall);part('body','墙体',[0,0,0],[w,h,d]);
   box([0,0,0],[w,Math.min(2,h),d],s.stone);
   if(type!=='wall'){
    const ow=Math.min(w-2*t,n(p.openingWidth??(type==='door'?1.4:1.6))),oh=Math.min(h-t,n(p.openingHeight??(type==='door'?2.4:1.4))),ox=Math.floor((w-ow)/2),oy=type==='door'?0:Math.min(h-oh-t,n(p.sill??.9));
    if(ow<1||oh<1||ox<t||oy<0)throw new Error('开口与边框尺寸不兼容');
    Object.assign(effective,{openingWidth:ow*cellSize,openingHeight:oh*cellSize});if(type==='window')Object.assign(effective,{sill:oy*cellSize,glass:p.glass===0?0:1});
    box([ox-t,Math.max(0,oy-t),0],[ox+ow+t,oy+oh+t,d],frame);box([ox,oy,0],[ox+ow,oy+oh,d],0);
    openings.push({min:[ox,oy,0],max:[ox+ow,oy+oh,d]});
    if(type==='window'&&p.glass!==0)box([ox,oy,Math.floor(d/2)],[ox+ow,oy+oh,Math.floor(d/2)+1],s.glass);
    if(type==='window'&&detail>1){box([Math.floor(w/2),oy,0],[Math.floor(w/2)+1,oy+oh,1],wood);}
    part('frame','开口框架',[ox-t,Math.max(0,oy-t),0],[ox+ow+t,oy+oh+t,d]);
   }
   box([0,h-1,0],[w,h,1],s.energy);part('energy','能源檐线',[0,h-1,0],[w,h,1]);
 }else if(type==='corner'){box([0,0,0],[w,h,t],wall);box([0,0,0],[t,h,d],wall);box([0,0,0],[t,h,t],frame);
 }else if(type==='column'||type==='slab'){box([0,0,0],[w,h,d],type==='column'?wood:s.stone);if(type==='column')box([0,0,0],[w,Math.min(h,2),d],frame);
 }else if(type==='steps'||type==='stairs'){
   const count=Math.max(1,Math.min(h,d,Math.round(p.steps??Math.max(1,h/2))));
   effective.steps=count;
   for(let k=0;k<count;k++){const z0=Math.floor(k*d/count),z1=Math.floor((k+1)*d/count),top=Math.max(1,Math.round((k+1)*h/count));box([0,0,z0],[w,top,z1],s.stone);box([0,top-1,z0],[w,top,Math.min(z0+1,z1)],s.energy);}
 }else if(type==='railing'){
   box([0,h-1,0],[w,h,d],wood);const gap=Math.max(2,n(p.spacing??.5));for(let x=0;x<w;x+=gap)box([x,0,0],[Math.min(w,x+t),h,d],frame);box([w-t,0,0],[w,h,d],frame);box([0,Math.floor(h/3),0],[w,Math.floor(h/3)+1,d],frame);
 }else if(type==='roof'||type==='eaves'){
   for(let x=0;x<w;x++)for(let z=0;z<d;z++){
     const dist=Math.min(z,d-1-z),slope=Math.min(1,dist/Math.max(1,Math.floor((d-1)/2)));let y=type==='roof'?Math.floor(slope*(h-1)):Math.floor((z/Math.max(1,d-1))*(h-1));
     const edge=Math.min(x,w-1-x,z,d-1-z);if(type==='roof'&&edge<2)y=Math.min(h-1,y+2-edge); // stepped upturned eaves
     box([x,Math.max(0,y-t+1),z],[x+1,y+1,z+1],s.roof);
     if(detail>1&&x%Math.max(2,n(.4))===0)g.set([x,y,z],s.metal);
   }
   box([0,0,0],[w,1,1],s.energy);box([0,0,d-1],[w,1,d],s.energy);
 }else if(type==='ridge'){box([0,0,0],[w,Math.max(1,h-1),d],s.roof);box([Math.floor(w/2),h-1,0],[Math.floor(w/2)+1,h,d],frame);
 }else if(type==='corridor'){
   box([0,0,0],[w,t,d],s.stone);for(const x of[0,w-t])for(const z of[0,d-t])box([x,0,z],[x+t,h,z+t],wood);box([0,h-t,0],[w,h,d],s.roof);
 }else if(type==='planter'){
   box([0,0,0],[w,Math.min(t,h),d],s.ceramic);box([0,0,0],[t,h,d],s.ceramic);box([w-t,0,0],[w,h,d],s.ceramic);box([0,0,0],[w,h,t],s.ceramic);box([0,0,d-t],[w,h,d],s.ceramic);
   box([t,t,t],[w-t,Math.max(t+1,h-1),d-t],s.soil);
   for(let x=t+1;x<w-t;x+=Math.max(2,Math.floor(5/detail))){const y=h+1+((x*17)%3);box([x,h-1,Math.floor(d/2)],[x+1,y+1,Math.floor(d/2)+1],wood);box([Math.max(t,x-1),y-1,Math.max(t,Math.floor(d/2)-1)],[Math.min(w-t,x+2),y+1,Math.min(d-t,Math.floor(d/2)+2)],s.leaf);}
 }else if(['bed','table','cabinet','sofa','monitor'].includes(type)){
   if(type==='cabinet'){box([0,0,0],[w,h,d],wood);box([t,t,t],[w-t,h-t,d],0);box([0,Math.floor(h/2),0],[w,Math.floor(h/2)+1,d],wood);box([0,0,d-1],[w,h,d],s.fabric);box([Math.floor(w/2),Math.floor(h/2),d-1],[Math.floor(w/2)+1,Math.floor(h/2)+2,d],frame);
   }else if(type==='monitor'){box([0,Math.floor(h/3),0],[w,h,Math.max(1,d)],frame);box([1,Math.floor(h/3)+1,0],[w-1,h-1,1],s.screen);box([Math.floor(w/2),0,0],[Math.floor(w/2)+1,Math.floor(h/3),d],frame);box([Math.floor(w/4),0,0],[Math.ceil(w*3/4),1,d],frame);box([2,Math.floor(h/2),0],[Math.max(3,w-2),Math.floor(h/2)+1,1],s.energy);
   }else{
    const top=type==='table'?h-1:Math.max(2,Math.floor(h*.6));for(const x of[0,Math.max(0,w-t)])for(const z of[0,Math.max(0,d-t)])box([x,0,z],[Math.min(w,x+t),top,Math.min(d,z+t)],wood);
    box([0,top-1,0],[w,top+1,d],wood);if(type!=='table'){box([0,top+1,0],[w,h,d],s.fabric);box([0,0,d-t],[w,h+1,d],wood);if(type==='bed')box([t,h,Math.max(t,d-n(.5))],[w-t,h+1,d-t],s.fabric);else{box([0,top,0],[t,h+1,d],wood);box([w-t,top,0],[w,h+1,d],wood);}}
   }
 }else if(type==='plant'){
  box([Math.floor(w/2),0,Math.floor(d/2)],[Math.floor(w/2)+1,h,Math.floor(d/2)+1],wood);for(let y=Math.floor(h/3);y<h;y++){const r=Math.max(1,Math.round((1-y/h)*Math.min(w,d)/2));box([Math.max(0,Math.floor(w/2)-r),y,Math.max(0,Math.floor(d/2)-r)],[Math.min(w,Math.floor(w/2)+r+1),y+1,Math.min(d,Math.floor(d/2)+r+1)],s.leaf);}
 }
 const b=g.bounds()??{min:[0,0,0] as V3,max:[w,h,d] as V3};parts.unshift({id:'root',name:'整体',parent:null,region:b});
 const W=w*cellSize,H=h*cellSize,D=d*cellSize;
 if(type==='railing')effective.spacing=Math.max(2,n(p.spacing??.5))*cellSize;
 return{id,name,version:1,category:'template',cellSize,origin:[0,0,0],chunks:g.serialize(),parts,openings,template:{type,params:filterParameters(type,effective),style:styleName},ports:[{id:'left',kind:'edge',position:[0,0,0],normal:[-1,0,0],size:[0,H,D],pitch:cellSize},{id:'right',kind:'edge',position:[W,0,0],normal:[1,0,0],size:[0,H,D],pitch:cellSize},{id:'base',kind:'support',position:[0,0,0],normal:[0,-1,0],size:[W,0,D],pitch:cellSize},{id:'top',kind:'support',position:[0,H,0],normal:[0,1,0],size:[W,0,D],pitch:cellSize}]};
}
