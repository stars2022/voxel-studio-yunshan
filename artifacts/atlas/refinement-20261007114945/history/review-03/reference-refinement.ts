import type {Asset,Project,V3,Port} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';
import {Grid} from '../core/grid';
import {makeLifeAsset} from './life';
import {emptyMesh,mergeMeshes,roundLoft,rigidMesh} from './mesh-shapes';
import {geometryData,assetBoundsM} from '../core/sky';
import {outfitHash as hash} from './outfit-components';
import {slottedPlate,foldedCloth} from './refinement-detail-shapes';
import {bevelBox,bevelMember,roundMember,radialUV} from './refinement-shapes';

class DetailBuilder {
 readonly pitch=.005;readonly grid=new Grid();readonly meshes:AuthoredMesh[]=[];
 constructor(readonly p:Project,readonly original:Asset,readonly style=p.styles.yunshan){}
 role(role:string){const id=this.style[role];if(!id||!this.p.materials[id])throw Error('Missing refinement role '+role);return id;}
 mesh(m:AuthoredMesh){this.meshes.push(m);return m;}
 box(name:string,role:string,min:V3,size:V3,bevel=.003,grain=1){const id=this.role(role);return this.mesh(bevelBox(name,id,min,size,Math.min(bevel,Math.min(...size)*.24),this.p.materials[id].solid,grain));}
 member(name:string,role:string,start:V3,end:V3,width:number,depth=width,bevel=.002){const id=this.role(role);return this.mesh(bevelMember(name,id,start,end,width,depth,Math.min(bevel,Math.min(width,depth)*.24),this.p.materials[id].solid));}
 cylinder(name:string,role:string,start:V3,end:V3,radius:number,sides=24){const id=this.role(role);return this.mesh(roundMember(name,id,start,end,radius,this.p.materials[id].solid,sides));}
 voxel(role:string,min:V3,size:V3){const id=this.role(role),lo=min.map(v=>Math.round(v/this.pitch)),span=size.map(v=>Math.round(v/this.pitch));if(span.some(n=>n<1))throw Error('Subminimum detail');for(let x=0;x<span[0];x++)for(let y=0;y<span[1];y++)for(let z=0;z<span[2];z++)this.grid.set([lo[0]+x,lo[1]+y,lo[2]+z],id);}
 reflectX(width:number){
  const cells=[...this.grid.cells()];for(const [cell]of cells)this.grid.set(cell,0);for(const[cell,m]of cells)this.grid.set([Math.round(width/this.pitch)-1-cell[0],cell[1],cell[2]],m);
  for(const mesh of this.meshes){for(let k=0;k<mesh.positions.length;k+=3){mesh.positions[k]=Math.round((width-mesh.positions[k])*1e9)/1e9;mesh.normals[k]=-mesh.normals[k];}for(let k=0;k<mesh.indices.length;k+=3)[mesh.indices[k+1],mesh.indices[k+2]]=[mesh.indices[k+2],mesh.indices[k+1]];}
 }
 mountPorts():Port[]{
  const id=String(this.original.source!.catalogId),port=(name:string,position:V3,normal:V3,size:V3,kind='mount'):Port=>({id:name,kind,position,normal,size,pitch:this.pitch});
  const plane=(name:string,part:AuthoredMesh,axis:number,sign:number,kind:string)=>{const coords=Array.from({length:part.positions.length/3},(_,i)=>part.positions.slice(i*3,i*3+3)as V3),limit=sign<0?Math.min(...coords.map(v=>v[axis])):Math.max(...coords.map(v=>v[axis])),ps=coords.filter(v=>Math.abs(v[axis]-limit)<1e-8),lo=[0,1,2].map(k=>Math.min(...ps.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...ps.map(p=>p[k]))),normal=[0,0,0]as V3;normal[axis]=sign;return port(name,lo.map((v,k)=>(v+hi[k])/2)as V3,normal,lo.map((v,k)=>hi[k]-v)as V3,kind);};
  if(['LIFE-025','LIFE-026'].includes(id))return this.meshes.filter(m=>m.name===(id==='LIFE-025'?'深铁墙面安装板':'墙面装轨座')).map((m,k)=>plane('wall-'+k,m,2,1,'wall'));
  if(id==='LIFE-028')return[plane('ceiling',this.meshes.find(m=>m.name==='天花固定盘')!,1,1,'ceiling')];
  if(id==='LIFE-029')return[plane('wall',this.meshes.find(m=>m.name==='深铁壁灯背板')!,2,1,'wall')];
  if(id==='LIFE-030')return[plane('wall',this.meshes.find(m=>m.name==='贯通插孔金属背盒')!,2,1,'wall')];
  if(id==='LIFE-027')return this.meshes.filter(m=>m.name==='吊耳上缘').map((m,k)=>plane('hanger-'+k,m,1,1,'curtain-hanger'));
  const merged=emptyMesh('actual lower contact envelope',1,true);for(const m of this.meshes)merged.positions.push(...m.positions);
  return[plane('base',merged,1,-1,'base')];
 }

 finish(features:string,details:Record<string,unknown>={}){
  const grouped=new Map<string,AuthoredMesh[]>();for(const m of this.meshes){const key=m.material+':'+JSON.stringify(m.wovenPattern??null),list=grouped.get(key)??[];list.push(m);grouped.set(key,list);}const ranges:any[]=[];
  const meshes=[...grouped].map(([key,list],index)=>{const material=list[0].material,name='refined-material-'+material+'-'+index;let firstIndex=0;for(const m of list){ranges.push({name:m.name,mesh:name,firstIndex,indexCount:m.indices.length,material});firstIndex+=m.indices.length;}return{...mergeMeshes(name,list),...(list[0].wovenPattern?{wovenPattern:list[0].wovenPattern}:{})};});
  const result={...this.original,version:this.original.version+1,cellSize:this.pitch,chunks:this.grid.serialize(),parts:[],meshes,source:{...this.original.source,parameters:{...this.original.source?.parameters as any,refinement:'reference-v1'},recipeRevision:'reference-v1',features,componentIndexRanges:ranges,refinement:{version:1,baselineGeometrySHA256:hash(geometryData(this.original)),baselineSource:this.original.source,baselinePorts:this.original.ports,minimumComponentM:this.pitch,authority:'closed authored surfaces with independent native minimum fasteners',humanArtAccepted:false,...details}}} as Asset;
  result.ports=this.mountPorts();const bounds=assetBoundsM(result)!;result.source!.dimensionsM=bounds.max.map((v,k)=>v-bounds.min[k]);result.source!.refinedBoundsM=bounds;
  result.source!.limitations='作者静态参考精修候选；原游戏功能和动画未绑定，人工美术验收未完成。';
  result.source!.materialAssignmentReview={revision:2,method:'actual mixed component roles and palette-derived textile artwork',nativeRoles:[...new Set([...this.grid.cells()].map(([,id])=>id))],meshRoles:[...new Set(meshes.map(m=>m.material))],texturedRoles:meshes.flatMap(m=>m.wovenPattern?Object.values(m.wovenPattern.materials):[])};
  return result;
 }
}
export const referenceRefinementIds=['LIFE-008','LIFE-009','LIFE-019','LIFE-020','LIFE-023','LIFE-024','LIFE-025','LIFE-026','LIFE-027','LIFE-028','LIFE-029','LIFE-030'];
export function makeReferenceRefinement(catalogId:string,name:string,id:string,style:Record<string,number>,context:Project){
 if(!referenceRefinementIds.includes(catalogId))throw Error('此资产尚未验证参考精修版本');
 const p=context,original=makeLifeAsset(catalogId,name,id,style),b=new DetailBuilder(p,original,style);
 if(catalogId==='LIFE-008'){
  const w=1.1,h=1.8,d=.48,t=.035,split=.682;
  for(const[y,label]of[[0,'底'],[h-t,'顶']]as const)b.box(label+'板连续倒角','wood',[.02,y,.02],[w-.04,t,d-.04],.003,0);
  for(const[x,label]of[[.02,'左'],[split,'中'],[w-.055,'右']]as const)b.box(label+'分区立板','wood',[x,t,.02],[t,h-2*t,d-.04],.003,1);
  for(const y of[.32,.68,1.04,1.4]){
   b.box('独立倒角搁板'+y,'wood',[split+t,y,.025],[w-.055-split-t,.025,d-.05],.0025,0);
   for(const x of[split+t,w-.075])for(const z of[.08,d-.08])b.voxel('bronze',[x,y-.02,z],[.02,.02,.025]);
  }
  b.cylinder('连续圆截面铜挂杆','bronze',[.055,1.6,.2475],[split,1.6,.2475],.013,24);
  for(const x of[.055,split-.018]){b.box('杆端承套','metal',[x,1.5725,.22],[.018,.055,.055],.003);for(const y of[1.58,1.615])b.voxel('bronze',[x+.005,y,.215],[.005,.005,.01]);}
  b.member('连续斜向背拉撑','metal',[.0375,.0525,.44],[1.0625,1.7475,.44],.018,.014,.0015);
  b.reflectX(w);
  return b.finish('原尺寸独立柜内胆：连续倒角板材、顺板木纹UV、真实圆铜挂杆、可替换最小铜销',{scope:'interior insert only; separate cabinet shell, doors and stored garments retained outside this master',dimensionsM:[w,h,d]});
 }
 if(catalogId==='LIFE-009'){
  const w=.65;
  for(const x of[.025,.555])for(const z of[-.02,.17])b.box('可见浅石台脚','stone',[x,0,z],[.07,.04,.07],.003);
  b.box('窄木台座','wood',[0,.04,0],[w,.09,.24],.006,0);
  for(const x of[-.004,.589]){b.box('底台前角铁抱件','metal',[x,.035,-.012],[.065,.09,.038],.003);b.voxel('bronze',[Math.round((x+.015)/.005)*.005,.0675,-.02],[.035,.035,.015]);}
  b.box('抽屉可见前板','woodEdge',[.115,.055,-.012],[.42,.052,.016],.002,0);
  for(const x of[.28,.355])b.voxel('metal',[x,.0725,-.03],[.015,.015,.02]);
  b.box('抽屉铜握杆','bronze',[.28,.0725,-.039],[.09,.015,.01],.002,0);
  for(const x of[.02,w-.075]){b.box('镜架木立柱','wood',[x,.13,.095],[.06,.64,.055],.0035,1);b.box('柱顶深铁抱帽','metal',[x-.004,.73,.09],[.068,.045,.065],.003);b.voxel('bronze',[x+.01,.745,.085],[.03,.02,.01]);}
  for(const x of[.075,.56])b.cylinder('镜面枢轴','bronze',[x,.48,.12],[x+.025,.48,.12],.018,20);
  const x=.095,y=.185,z=.12,ww=.46,hh=.565,t=.035;
  b.box('真实镜背薄板','wood',[x+.015,y+.015,z+.025],[ww-.03,hh-.03,.016],.002,1);
  for(const xx of[x,x+ww-t])b.box('竖向镜框','wood',[xx,y,z-.025],[t,hh,.055],.003,1);
  for(const yy of[y,y+hh-t])b.box('横向镜框','wood',[x+t,yy,z-.025],[ww-2*t,t,.055],.003,0);
  b.box('独立背镀镜玻璃','mirrorGlass',[x+t+.004,y+t+.004,z+.016],[ww-2*t-.008,hh-2*t-.008,.007],.001);
  for(const xx of[x-.004,x+ww-.036])for(const yy of[y-.004,y+hh-.036]){b.box('铁角护件','metal',[xx,yy,z-.033],[.04,.04,.02],.002);b.voxel('bronze',[xx+.01,yy+.01,z-.038],[.02,.02,.01]);}
  for(const xx of[.065,.568]){b.box('独立侧灯槽深铁承壳','metal',[xx,.33,.073],[.023,.23,.045],.002);b.box('真实暖色侧光学条','warm',[xx+.004,.345,.067],[.015,.20,.008],.001);b.voxel('lightCore',[Math.round((xx+.008)/.005)*.005,.355,.075],[.005,.18,.015]);}
  for(const xx of[.132,.511])b.box('镜内铜细压边','bronze',[xx,.222,.118],[.007,.491,.009],.001);
  for(const yy of[.222,.706])b.box('镜内铜细压边','bronze',[.139,yy,.118],[.372,.007,.009],.001,0);
  return b.finish('梳妆镜细化：连续木框倒角、独立枢轴、背镀镜玻璃、窄抽屉与最小铜扣',{reflection:'PBR environment reflection; no planar scene mirror claimed',pose:'static pivot construction',dimensionsM:[.65,.8,.24]});
 }
 if(catalogId==='LIFE-019'){
  b.box('键盘深铁底壳','metal',[0,0,0],[.52,.022,.24],.005,0);
  b.box('木质上承板','wood',[.02,.022,.025],[.48,.012,.195],.003,0);
  for(const z of[.005,.22])b.box('前后木边','wood',[.025,.024,z],[.47,.024,.02],.0025,0);
  for(const x of[.005,.49])b.box('两端木边','wood',[x,.022,.025],[.025,.024,.195],.0025,2);
  for(const x of[0,.485])for(const z of[0,.205]){b.box('深铁角锁','metal',[x,.01,z],[.035,.04,.035],.003);b.voxel('bronze',[x+.005,.045,z+.005],[.025,.01,.025]);}
  b.box('开关承盘','metal',[.03,.033,.033],[.415,.009,.178],.003);
  for(let row=0;row<4;row++)for(let col=0;col<11;col++){const x=.036+col*.036,z=.066+row*.036;b.box('独立键帽-'+row+'-'+col,row===3||col===0||col===10?'polymerDark':'polymer',[x,.042,z],[.028,.016,.026],.0022,0);}
  b.box('空格键','polymer',[.14,.042,.034],[.19,.017,.024],.0025,0);
  for(const x of[.04,.085,.35,.40])b.box('前排修饰键','polymerDark',[x,.042,.034],[.033,.016,.024],.0022,0);
  b.cylinder('旋钮轴座','metal',[.477,.033,.178],[.477,.052,.178],.028,24);
  b.cylinder('黄铜旋钮','bronze',[.477,.052,.178],[.477,.073,.178],.025,16);
  b.voxel('printedDark',[.475,.07,.165],[.005,.005,.01]);
  b.box('后走线接头','polymerDark',[.455,.024,.223],[.03,.022,.028],.002);
  b.cylinder('真实柔性电缆第一段','rubber',[.47,.035,.25],[.48,.033,.286],.004,12);
  b.cylinder('真实柔性电缆第二段','rubber',[.48,.033,.286],[.52,.027,.326],.004,12);
  b.reflectX(.52);
  return b.finish('输入托板细化：独立倒角键帽、实缝、顺纹木边、黄铜旋钮与真实外接线',{dimensionsM:[.52,.073,.24],cableExtentSeparate:true,keyLegends:'no fabricated alphabet or key mapping'});
 }
 if(catalogId==='LIFE-020'){
  b.box('深铁底托','metal',[.015,0,.07],[.25,.024,.21],.005);
  b.box('浅石灯座','stone',[.025,.024,.08],[.23,.054,.19],.004);
  b.box('上台铜座','bronze',[.11,.078,.17],[.1,.018,.085],.003);
  const lower:V3=[.14,.1,.19],elbow:V3=[.06,.30,.20],upper:V3=[.32,.455,.17];
  b.member('连续下木臂','wood',lower,elbow,.032,.036,.003);
  b.member('连续上木臂','wood',elbow,upper,.032,.036,.003);
  for(const [j,c]of[lower,elbow,upper].entries()){b.box('轴关节夹块'+j,'metal',c.map((v,k)=>v-[.025,.023,.022][k])as V3,[.05,.046,.044],.004);b.cylinder('实际黄铜轴帽'+j,'bronze',[c[0]-.031,c[1],c[2]],[c[0]+.031,c[1],c[2]],.012,12);b.voxel('bronze',[Math.round((c[0]-.005)/.005)*.005,Math.round((c[1]+.019)/.005)*.005,Math.round((c[2]-.005)/.005)*.005],[.01,.01,.01]);}
  b.cylinder('灯头吊接轴','metal',[.32,.405,.17],[.32,.447,.17],.009,16);
  const headStart=b.meshes.length,headCells=new Set([...b.grid.cells()].map(([v])=>v.join(',')));
  b.box('灯罩顶盖','metal',[.035,.387,.005],[.2,.023,.16],.0035,0);
  b.box('灯罩下框前','wood',[.035,.305,.005],[.2,.018,.018],.002,0);b.box('灯罩下框后','wood',[.035,.305,.147],[.2,.018,.018],.002,0);
  for(const x of[.035,.217])b.box('灯罩下框侧','wood',[x,.305,.023],[.018,.018,.124],.002,2);
  for(const x of[.035,.22])for(const z of[.005,.15]){b.box('四角灯框','wood',[x,.323,z],[.015,.064,.015],.002,1);b.voxel('bronze',[x,.39,z],[.015,.015,.015]);}
  for(const z of[.012,.147])b.box('前后透明灯罩','glass',[.05,.324,z],[.17,.06,.006],.001,1);
  for(const x of[.043,.22])b.box('侧面透明灯罩','glass',[x,.324,.022],[.006,.06,.124],.001,1);
  b.box('独立内光学面','warm',[.053,.324,.025],[.164,.060,.120],.003,0);
  b.voxel('lightCore',[.11,.35,.065],[.05,.025,.045]);
  for(let j=headStart;j<b.meshes.length;j++)b.meshes[j]=rigidMesh(b.meshes[j],[.185,0,.085]);
  const headDetails=[...b.grid.cells()].filter(([v])=>!headCells.has(v.join(',')));for(const[v]of headDetails)b.grid.set(v,0);for(const[v,m]of headDetails)b.grid.set([v[0]+37,v[1],v[2]+17],m);
  b.box('底座按钮绝缘面','polymerDark',[.07,.031,.068],[.055,.03,.012],.002);b.voxel('bronze',[.08,.04,.06],[.03,.015,.015]);
  return b.finish('折臂台灯细化：连续双臂、独立轴帽、真实玻璃罩和分开的光学面/灯芯',{dimensionsM:[.435,.485,.30],lighting:'author static preview; no electricity or articulated animation binding'});
 }
 if(catalogId==='LIFE-023'){
  const role=b.role('wood'),rim=roundLoft('连续木圈与倒角',role,[{x:.2,z:.2,y:.365,rx:.187,rz:.187},{x:.2,z:.2,y:.372,rx:.2,rz:.2},{x:.2,z:.2,y:.397,rx:.2,rz:.2},{x:.2,z:.2,y:.404,rx:.192,rz:.192}],32,p.materials[role].solid);b.mesh(radialUV(rim,[.2,.2],.2,true));
  const edge=b.role('fabricEdge');b.mesh(radialUV(roundLoft('坐垫真实包边',edge,[{x:.2,z:.2,y:.400,rx:.169,rz:.169},{x:.2,z:.2,y:.414,rx:.181,rz:.181},{x:.2,z:.2,y:.423,rx:.179,rz:.179}],32,p.materials[edge].solid),[.2,.2],.181));
  const cloth=b.role('fabric');b.mesh(radialUV(roundLoft('低鼓度软垫',cloth,[{x:.2,z:.2,y:.414,rx:.172,rz:.172},{x:.2,z:.2,y:.430,rx:.177,rz:.177},{x:.2,z:.2,y:.438,rx:.166,rz:.166},{x:.2,z:.2,y:.440,rx:.08,rz:.08}],32,p.materials[cloth].solid),[.2,.2],.177));
  const at=(v:number,y:number)=>v+(v<.2?1:-1)*.025*(y-.045)/.33;
  for(const x of[.065,.30])for(const z of[.065,.30]){b.box('石足','stone',[x-.03,0,z-.03],[.06,.025,.06],.003);b.box('铁脚套','metal',[x-.025,.025,z-.025],[.05,.035,.05],.003);b.member('外撇连续木腿','wood',[x,.045,z],[at(x,.375),.375,at(z,.375)],.043,.043,.003);b.voxel('bronze',[Math.round(x/.005)*.005-.01,.045,Math.round((z-.028)/.005)*.005],[.02,.01,.01]);}
  for(const z of[.065,.30])b.member('横向脚枨','wood',[at(.065,.155),.155,at(z,.155)],[at(.30,.155),.155,at(z,.155)],.027,.025,.002);
  for(const x of[.065,.30])b.member('纵向脚枨','wood',[at(x,.155),.155,at(.065,.155)],[at(x,.155),.155,at(.30,.155)],.027,.025,.002);
  for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const center:V3=[.2+Math.sin(angle)*.191,.381,.2+Math.cos(angle)*.191];const clip=bevelBox('座沿铁箍',b.role('metal'),[-.028,.350,.185],[.056,.057,.032],.003,true);for(let k=0;k<clip.positions.length;k+=3){const x=clip.positions[k],z=clip.positions[k+2];clip.positions[k]=.2+x*Math.cos(angle)+z*Math.sin(angle);clip.positions[k+2]=.2-x*Math.sin(angle)+z*Math.cos(angle);const nx=clip.normals[k],nz=clip.normals[k+2];clip.normals[k]=nx*Math.cos(angle)+nz*Math.sin(angle);clip.normals[k+2]=-nx*Math.sin(angle)+nz*Math.cos(angle);}b.mesh(clip);b.voxel('bronze',[Math.round((center[0]-.015)/.005)*.005,.365,Math.round((center[2]-.015)/.005)*.005],[.03,.035,.03]);}
  return b.finish('小圆凳细化：连续圆座与低鼓度织物软垫、真正斜腿倒角、脚枨和石足',{dimensionsM:[.4,.44,.4],joins:'wood legs insert into metal feet and timber seat; no load-bearing certification'});
 }
 if(catalogId==='LIFE-024'){
  const w=.9,h=.9,d=.34;
  for(const x of[.025,.805])for(const z of[.025,.245]){b.box('石柜足','stone',[x,0,z],[.07,.045,.07],.003);b.box('脚上铁套','metal',[x+.005,.04,z+.005],[.06,.08,.06],.004);b.voxel('bronze',[x+.015,.065,z-.005],[.035,.03,.015]);}
  for(const x of[.025,.835])b.box('独立柜侧板','wood',[x,.105,.02],[.04,.745,.30],.0035,1);
  for(const y of[.11,.465,.84])b.box('柜底中顶承板','wood',[.015,y,.005],[.87,.035,.33],.004,0);
  b.box('实木顶台','wood',[0,.875,0],[w,.025,d],.005,0);
  b.box('薄背板','wood',[.065,.145,.3075],[.77,.695,.0125],.002,1);
  for(const y of[.145,.49]){
   const first=b.meshes.length;
   b.box('翻斗底托','wood',[.07,y+.006,.015],[.76,.018,.245],.002,0);
   for(const x of[.07,.806])b.box('翻斗侧壁','wood',[x,y+.024,.015],[.024,.285,.245],.002,1);
   b.box('斗内后挡','wood',[.094,y+.024,.24],[.712,.15,.02],.002,0);
   b.box('浅色实涂翻板','enamel',[.065,y,-.02],[.77,.307,.029],.003,0);
   for(const x of[.065,.817])b.box('门侧木压条','woodEdge',[x,y,-.032],[.018,.307,.018],.002,1);
   for(const yy of[y,y+.289])b.box('门端木压条','woodEdge',[.083,yy,-.032],[.734,.018,.018],.002,0);
   for(const x of[.385,.493])b.box('拉手双座','metal',[x,y+.244,-.052],[.022,.022,.025],.002);
   b.box('实铜抽屉把手','bronze',[.382,y+.247,-.061],[.136,.016,.015],.002,0);
   for(let k=first;k<b.meshes.length;k++)b.meshes[k]=rigidMesh(b.meshes[k],[0,0,0],-.32,0,[.45,y+.018,.022]);
   for(const x of[.055,.827]){b.cylinder('真正翻斗铰轴','bronze',[x,y+.018,.022],[x+.018,y+.018,.022],.018,16);b.voxel('metal',[x-.005,Math.round(y/.005)*.005,-.005],[.015,.035,.05]);}
  }
  // Continuous open front ventilation gaps between three separate upper rails.
  for(const x of[.065,.3275,.59])b.box('顶沿通风横段','wood',[x,.825,-.008],[.245,.034,.032],.003,0);
  return b.finish('玄关鞋柜细化：双翻斗连续刚体斜置、真实铰轴、可见内腔和连续倒角木框',{dimensionsM:[w,h,d],drawerOpeningRadians:.32,pose:'static author-open drawers, no game inventory or animation binding'});
 }
 if(catalogId==='LIFE-025'){
  b.box('连续倒角壁搁层板','wood',[0,.12,0],[.9,.04,.24],.005,0);
  b.box('层板前沿木收边','woodEdge',[.015,.115,-.005],[.87,.045,.022],.003,0);
  b.box('低挡连续钢杆','metal',[.032,.212,.012],[.836,.02,.022],.003,0);
  b.box('后端限位木条','wood',[.05,.16,.21],[.8,.035,.028],.003,0);
  for(const x of[.02,.8475]){b.box('挡杆铁柱','metal',[x,.1525,.01],[.03,.0775,.03],.003);b.voxel('bronze',[Math.round(x/.005)*.005,.2175,.005],[.025,.015,.04]);}
  for(const x of[.08,.78]){
   b.box('深铁墙面安装板','metal',[x,0,.215],[.045,.24,.025],.0035);
   b.box('横向承托肋','metal',[x,.105,.025],[.045,.025,.21],.003,2);
   b.member('正常连续三角斜撑','metal',[x+.0225,.0325,.225],[x+.0225,.118,.035],.022,.023,.002);
   for(const y of[.025,.195])b.voxel('bronze',[x+.01,y,.205],[.025,.02,.02]);
  }
  return b.finish('壁搁板细化：真实连续倒角、顺向木纹、非阶梯斜撑及独立挡杆',{dimensionsM:[.9,.24,.24],context:'Books, planter and plant remain independent source assets'});
 }
 if(catalogId==='LIFE-026'){
  for(const z of[.02,.095]){
   b.box('轨道连续顶梁','metal',[.025,.122,z],[1.75,.012,.039],.002,0);
   for(const zz of[z,z+.031])b.box('轨道真侧壁','metal',[.025,.089,zz],[1.75,.033,.008],.0015,0);
   for(const zz of[z,z+.027])b.box('下缘滑轮承唇','metal',[.025,.087,zz],[1.75,.008,.012],.0015,0);
   for(const x of[0,1.755]){b.box('浅色封口端鞍','enamel',[x,.075,z-.012],[.045,.07,.063],.004);b.voxel('bronze',[x+.01,.10,z-.017],[.015,.025,.01]);}
  }
  for(const x of[.18,1.58]){b.box('墙面装轨座','metal',[x,.065,.125],[.04,.095,.025],.003);b.box('双轨承托连臂','metal',[x,.135,.028],[.04,.025,.115],.003,2);b.voxel('bronze',[x+.01,.075,.12],[.02,.02,.01]);}
  for(let k=0;k<10;k++){
   const x=.11+k*.16;
   b.box('槽内滑车','bronze',[x,.101,.03],[.028,.015,.019],.002);
   b.box('滑车下伸销','metal',[x+.009,.071,.035],[.01,.035,.01],.001);
   const yy=.027,zz=.027,t=.009,ww=.046,hh=.047;
   for(const xx of[x-.009,x-.009+ww-t])b.box('真空挂环双侧','metal',[xx,yy,zz],[t,hh,.018],.0015);
   for(const y of[yy,yy+hh-t])b.box('真空挂环上下','metal',[x, y,zz],[ww-2*t,t,.018],.0015,0);
  }
  return b.finish('双窗帘轨细化：连续下开口槽、实际承唇、独立滑车和真空挂环',{dimensionsM:[1.8,.16,.15],motion:'static carriages; no motion constraints'});
 }
 if(catalogId==='LIFE-028'){
  b.box('退层金属背壳','metal',[.04,.078,.04],[.48,.032,.48],.004);
  b.box('天花固定盘','trim',[.15,.111,.15],[.26,.029,.26],.003);
  for(const z of[.025,.50]){b.box('前后木边框','wood',[.025,.023,z],[.51,.053,.035],.003,0);b.box('浅石侧嵌条','stone',[.06,.037,z-.001],[.44,.025,.037],.002,0);}
  for(const x of[.025,.5]){b.box('左右木边框','wood',[x,.023,.06],[.035,.053,.44],.003,2);b.box('浅石侧嵌条','stone',[x-.001,.037,.062],[.037,.025,.436],.002,2);}
  b.box('玻璃发光面护片','glass',[.069,.014,.069],[.422,.008,.422],.001);
  b.box('内退暖色光学面','warm',[.08,.022,.08],[.4,.018,.4],.003);
  b.voxel('lightCore',[.155,.04,.155],[.25,.02,.25]);
  for(const z of[.061,.485])b.box('下沿铜压线','bronze',[.061,.010,z],[.438,.016,.014],.002,0);
  for(const x of[.061,.485])b.box('下沿铜压线','bronze',[x,.010,.075],[.014,.016,.410],.002,2);
  for(const x of[.015,.50])for(const z of[.015,.50]){b.box('四角深铁抱鞍','metal',[x,0,z],[.045,.095,.045],.004);b.voxel('bronze',[x+.005,.005,z+.005],[.035,.025,.035]);b.voxel('bronze',[x+.005,.0675,z-.005],[.035,.025,.015]);}
  return b.finish('顶灯细化：真实攒边、独立侧石嵌条、透明护片与内退光学面/灯芯',{dimensionsM:[.56,.14,.56],preferredView:'underside',lighting:'author static light preview'});
 }
 if(catalogId==='LIFE-029'){
  b.box('深铁壁灯背板','metal',[.025,0,.1475],[.13,.42,.0325],.004,1);
  b.box('浅色背板嵌芯','stone',[.0475,.035,.1375],[.085,.35,.016],.002,1);
  for(const y of[.02,.36]){b.box('背板铁抱块','metal',[.028,y,.126],[.124,.045,.041],.003);for(const x of[.038,.118])b.voxel('bronze',[x,y+.005,.121],[.025,.03,.01]);}
  for(const y of[.055,.353]){b.box('连续木质灯臂','wood',[.06,y,.044],[.06,.027,.105],.003,2);b.voxel('bronze',[.065,y+.005,.132],[.05,.015,.02]);}
  for(const y of[.035,.325]){b.box('木质顶底盖','wood',[.0025,y,-.005],[.175,.029,.14],.004,0);b.box('金属盖沿','metal',[.005,y+.005,0],[.17,.013,.13],.002,0);}
  for(const x of[.0125,.15])for(const z of[.005,.1075])b.box('连续方木笼骨','wood',[x,.064,z],[.0175,.261,.0175],.002,1);
  for(const z of[.0125,.1075])b.box('前后玻璃灯罩','glass',[.03,.067,z],[.12,.255,.005],.001,1);
  for(const x of[.025,.15])b.box('侧玻璃灯罩','glass',[x,.067,.0175],[.005,.255,.09],.001,1);
  b.box('独立暖色光学面','warm',[.031,.068,.024],[.119,.253,.082],.002,1);
  b.voxel('lightCore',[.0675,.1,.0475],[.045,.19,.03]);
  for(const x of[.0175,.145])for(const y of[.0475,.3275])b.voxel('bronze',[x,y,.0],[.0175,.015,.015]);
  return b.finish('壁灯细化：连续悬臂木骨、石芯背座、四面玻璃与独立光学面和灯芯',{dimensionsM:[.18,.42,.18],lighting:'static author light preview; game switch unbound'});
 }
 if(catalogId==='LIFE-027'){
  const bands:[number,number,string][]=[[0,.055,'fabric'],[.055,.07,'fabricEdge'],[.07,.19,'wovenLight'],[.19,.2075,'fabric'],[.2075,.2225,'wovenLight'],[.2225,1.73,'fabric']];
  for(const [lo,hi,role] of bands){const id=b.role(role),m=foldedCloth('连续帘面分用途带'+lo,id,lo,hi,p.materials[id].solid);if(lo===.07){m.wovenPattern={version:1,design:'hui-border-v1',width:1024,height:192,sizeM:[.8,.12],materials:{ground:b.role('wovenLight'),motif:b.role('fabric')}};for(let k=0;k<m.positions.length;k+=3){m.uvs[k/3*2]=Math.max(0,Math.min(1,m.positions[k]/.8));m.uvs[k/3*2+1]=Math.max(0,Math.min(1,(m.positions[k+1]-.07)/.12));}}b.mesh(m);}
  for(let i=0;i<6;i++){
   const x=.024+i*.142,z=.045+.033*Math.cos((x+.026)/.8*Math.PI*11);
   for(const xx of[x,x+.043])b.box('织物吊耳双侧','fabric',[xx,1.72,z],[.009,.075,.008],.0015);
   b.box('吊耳上缘','fabric',[x+.009,1.786,z],[.034,.009,.008],.0015,0);
   b.box('吊耳下缘','fabric',[x+.009,1.72,z],[.034,.009,.008],.0015,0);
   b.voxel('fabricEdge',[Math.round(x/.005)*.005,1.72,Math.round(z/.005)*.005],[.01,.01,.01]);
  }
  return b.finish('帘片细化：真实薄壳、米制织纹UV、双下摆和真空吊耳',{dimensionsM:[.8,1.8,.1],patternStatus:'saved palette-derived woven Hui border with exported albedo, normal and roughness/metalness maps',simulation:'static continuous drape, no cloth simulation'});
 }
 if(catalogId==='LIFE-030'){
  const slots=[{x:.027,y:.077,width:.006,height:.017},{x:.049,y:.077,width:.006,height:.017},{x:.038,y:.045,width:.006,height:.016},{x:.021,y:.022,width:.006,height:.018,angle:-.55},{x:.055,y:.022,width:.006,height:.018,angle:.55}];
  const metal=b.role('metal');b.mesh(slottedPlate('贯通插孔金属背盒',metal,[0,0,0],[.28,.16,.035],slots.map(s=>({...s,x:s.x+.022,y:s.y+.025})),true));
  for(const x of[0,.268])b.box('竖向深铁压框','metal',[x,0,-.012],[.012,.16,.018],.002,1);
  for(const y of[0,.148])b.box('横向深铁压框','metal',[.012,y,-.012],[.256,.012,.018],.002,0);
  for(const [min,size]of[[[.012,.012,-.014],[.256,.012,.017]],[[.012,.136,-.014],[.256,.012,.017]],[[.012,.024,-.014],[.010,.112,.017]],[[.10,.024,-.014],[.015,.112,.017]],[[.173,.024,-.014],[.013,.112,.017]],[[.254,.024,-.014],[.014,.112,.017]]]as [V3,V3][])b.box('实涂浅色分区底板','enamel',min,size,.0015);
  const poly=b.role('polymer');b.mesh(slottedPlate('真实通孔绝缘插座',poly,[.022,.025,-.02],[.078,.111,.025],slots,p.materials[poly].solid));
  for(const x of[.115,.146]){b.box('独立摇臂座','metal',[x,.025,-.017],[.027,.111,.018],.002);b.mesh(rigidMesh(bevelBox('正常斜面摇臂',b.role('polymerDark'),[x+.002,.029,-.027],[.023,.101,.016],.002,true),[0,0,0],.055,0,[x+.0135,.0795,-.019]));b.voxel('displayGlyph',[x+.005,.105,-.03],[.015,.005,.005]);}
  for(const [y,hh] of[[.087,.048],[.025,.05]]){b.box('屏幕独立金属框','metal',[.186,y,-.022],[.068,hh,.029],.003);b.box('真实屏幕底面','screen',[.194,y+.008,-.025],[.052,hh-.016,.006],.001);}
  b.voxel('displayGlyph',[.2075,.1025,-.03],[.025,.015,.005]);
  for(const x of[.201,.231])b.voxel('displayGlyph',[x,.038,-.03],[.005,.025,.005]);
  for(const y of[.038,.058])b.voxel('displayGlyph',[.206,y,-.03],[.025,.005,.005]);
  for(const x of[0,.255])for(const y of[0,.135]){b.box('面板四角铁锁','metal',[x,y,-.022],[.025,.025,.032],.003);b.voxel('bronze',[x+.005,y+.005,-.025],[.015,.015,.015]);}
  b.reflectX(.28);
  return b.finish('控制面板细化：五个实际贯通插孔、正常斜面双摇臂、独立屏底/图形及铜角',{dimensionsM:[.28,.16,.035],throughSlots:slots,display:'static authored symbols; no electrical or switch state binding'});
 }
 throw Error('Reference refinement not implemented '+catalogId);
}
