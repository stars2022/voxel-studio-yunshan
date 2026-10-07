import type {Asset,Project,V3} from '../../src/core/types';
import type {AuthoredMesh} from '../../src/core/authored-mesh';
import {Grid} from '../../src/core/grid';
import {makeCatalogAsset} from '../../src/production/catalog-assets';
import {emptyMesh,mergeMeshes,roundLoft,rigidMesh} from '../../src/production/mesh-shapes';
import {geometryData} from '../../src/core/sky';
import {outfitHash as hash} from '../../src/production/outfit-components';
import {bevelBox,bevelMember,roundMember} from './refinement-shapes';

class DetailBuilder {
 readonly pitch=.005;readonly grid=new Grid();readonly meshes:AuthoredMesh[]=[];
 constructor(readonly p:Project,readonly original:Asset,readonly style=p.styles.yunshan){}
 role(role:string){const id=this.style[role];if(!id||!this.p.materials[id])throw Error('Missing refinement role '+role);return id;}
 mesh(m:AuthoredMesh){this.meshes.push(m);return m;}
 box(name:string,role:string,min:V3,size:V3,bevel=.003,grain=1){const id=this.role(role);return this.mesh(bevelBox(name,id,min,size,Math.min(bevel,Math.min(...size)*.24),this.p.materials[id].solid,grain));}
 member(name:string,role:string,start:V3,end:V3,width:number,depth=width,bevel=.002){const id=this.role(role);return this.mesh(bevelMember(name,id,start,end,width,depth,Math.min(bevel,Math.min(width,depth)*.24),this.p.materials[id].solid));}
 cylinder(name:string,role:string,start:V3,end:V3,radius:number,sides=24){const id=this.role(role);return this.mesh(roundMember(name,id,start,end,radius,this.p.materials[id].solid,sides));}
 voxel(role:string,min:V3,size:V3){const id=this.role(role),lo=min.map(v=>Math.round(v/this.pitch)),span=size.map(v=>Math.round(v/this.pitch));if(span.some(n=>n<1))throw Error('Subminimum detail');for(let x=0;x<span[0];x++)for(let y=0;y<span[1];y++)for(let z=0;z<span[2];z++)this.grid.set([lo[0]+x,lo[1]+y,lo[2]+z],id);}
 finish(features:string,details:Record<string,unknown>={}){
  const grouped=new Map<number,AuthoredMesh[]>();for(const m of this.meshes){const list=grouped.get(m.material)??[];list.push(m);grouped.set(m.material,list);}const ranges:any[]=[];
  const meshes=[...grouped].map(([material,list])=>{const name='refined-material-'+material;let firstIndex=0;for(const m of list){ranges.push({name:m.name,mesh:name,firstIndex,indexCount:m.indices.length,material});firstIndex+=m.indices.length;}return mergeMeshes(name,list);});
  return{...this.original,version:this.original.version+1,cellSize:this.pitch,chunks:this.grid.serialize(),parts:[],meshes,source:{...this.original.source,parameters:{...this.original.source?.parameters as any,refinement:'reference-v1'},recipeRevision:'reference-v1',features,componentIndexRanges:ranges,refinement:{version:1,baselineGeometrySHA256:hash(geometryData(this.original)),baselineSource:this.original.source,minimumComponentM:this.pitch,authority:'closed authored surfaces with independent native minimum fasteners',humanArtAccepted:false,...details}}} as Asset;
 }
}
export function makeM001Draft(p:Project,catalogId:string,id=catalogId.toLowerCase()+'-refined'){
 const original=makeCatalogAsset(catalogId,catalogId,id,p.styles.yunshan),b=new DetailBuilder(p,original);
 if(catalogId==='LIFE-008'){
  const w=1.1,h=1.8,d=.48,t=.035,split=.682;
  for(const[y,label]of[[0,'底'],[h-t,'顶']]as const)b.box(label+'板连续倒角','wood',[.02,y,.02],[w-.04,t,d-.04],.003,0);
  for(const[x,label]of[[.02,'左'],[split,'中'],[w-.055,'右']]as const)b.box(label+'分区立板','wood',[x,t,.02],[t,h-2*t,d-.04],.003,1);
  for(const y of[.32,.68,1.04,1.4]){
   b.box('独立倒角搁板'+y,'wood',[split+t,y,.025],[w-.055-split-t,.025,d-.05],.0025,0);
   for(const x of[split+t,w-.075])for(const z of[.08,d-.08])b.voxel('bronze',[x,y-.02,z],[.02,.02,.025]);
  }
  b.cylinder('连续圆截面钢挂杆','metal',[.055,1.6,.2475],[split,1.6,.2475],.013,24);
  for(const x of[.055,split-.018]){b.box('杆端承套','metal',[x,1.5725,.22],[.018,.055,.055],.003);for(const y of[1.58,1.615])b.voxel('bronze',[x+.005,y,.215],[.005,.005,.01]);}
  b.member('连续斜向背拉撑','metal',[.0375,.0525,.44],[1.0625,1.7475,.44],.018,.014,.0015);
  return b.finish('原尺寸独立柜内胆：连续倒角板材、顺板木纹UV、真实圆挂杆、可替换最小铜销',{scope:'interior insert only; separate cabinet shell, doors and stored garments retained outside this master',dimensionsM:[w,h,d]});
 }
 if(catalogId==='LIFE-009'){
  const w=.65;
  for(const x of[.03,w-.1])b.box('浅石台脚','stone',[x,0,.05],[.07,.04,.14],.003);
  b.box('窄木台座','wood',[0,.04,0],[w,.09,.24],.006,0);
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
  return b.finish('输入托板细化：独立倒角键帽、实缝、顺纹木边、黄铜旋钮与真实外接线',{dimensionsM:[.52,.073,.24],cableExtentSeparate:true,keyLegends:'no fabricated alphabet or key mapping'});
 }
 if(catalogId==='LIFE-020'){
  b.box('深铁底托','metal',[.015,0,.07],[.25,.024,.21],.005);
  b.box('浅石灯座','stone',[.025,.024,.08],[.23,.054,.19],.004);
  b.box('上台铜座','bronze',[.11,.078,.17],[.1,.018,.085],.003);
  const lower:V3=[.16,.1,.21],elbow:V3=[.22,.30,.265],upper:V3=[.12,.455,.105];
  b.member('连续下木臂','wood',lower,elbow,.032,.036,.003);
  b.member('连续上木臂','wood',elbow,upper,.032,.036,.003);
  for(const [j,c]of[lower,elbow,upper].entries()){b.box('轴关节夹块'+j,'metal',c.map((v,k)=>v-[.025,.023,.022][k])as V3,[.05,.046,.044],.004);b.cylinder('实际黄铜轴帽'+j,'bronze',[c[0]-.031,c[1],c[2]],[c[0]+.031,c[1],c[2]],.012,12);b.voxel('bronze',[Math.round((c[0]-.005)/.005)*.005,Math.round((c[1]+.019)/.005)*.005,Math.round((c[2]-.005)/.005)*.005],[.01,.01,.01]);}
  b.cylinder('灯头吊接轴','metal',[.12,.405,.105],[.12,.447,.105],.009,16);
  b.box('灯罩顶盖','metal',[.035,.387,.005],[.2,.023,.16],.0035,0);
  b.box('灯罩下框前','wood',[.035,.305,.005],[.2,.018,.018],.002,0);b.box('灯罩下框后','wood',[.035,.305,.147],[.2,.018,.018],.002,0);
  for(const x of[.035,.217])b.box('灯罩下框侧','wood',[x,.305,.023],[.018,.018,.124],.002,2);
  for(const x of[.035,.22])for(const z of[.005,.15]){b.box('四角灯框','wood',[x,.323,z],[.015,.064,.015],.002,1);b.voxel('bronze',[x,.39,z],[.015,.015,.015]);}
  for(const z of[.012,.147])b.box('前后透明灯罩','glass',[.05,.324,z],[.17,.06,.006],.001,1);
  for(const x of[.043,.22])b.box('侧面透明灯罩','glass',[x,.324,.022],[.006,.06,.124],.001,1);
  b.box('独立内光学面','warm',[.063,.334,.034],[.144,.042,.102],.003,0);
  b.voxel('lightCore',[.11,.35,.065],[.05,.025,.045]);
  b.box('底座按钮绝缘面','polymerDark',[.07,.031,.068],[.055,.03,.012],.002);b.voxel('bronze',[.08,.04,.06],[.03,.015,.015]);
  return b.finish('折臂台灯细化：连续双臂、独立轴帽、真实玻璃罩和分开的光学面/灯芯',{dimensionsM:[.28,.48,.30],lighting:'author static preview; no electricity or articulated animation binding'});
 }
 if(catalogId==='LIFE-023'){
  const role=b.role('wood'),rim=roundLoft('连续木圈与倒角',role,[{x:.2,z:.2,y:.365,rx:.187,rz:.187},{x:.2,z:.2,y:.372,rx:.2,rz:.2},{x:.2,z:.2,y:.397,rx:.2,rz:.2},{x:.2,z:.2,y:.404,rx:.192,rz:.192}],32,p.materials[role].solid);b.mesh(rim);
  const edge=b.role('fabricEdge');b.mesh(roundLoft('坐垫真实包边',edge,[{x:.2,z:.2,y:.400,rx:.169,rz:.169},{x:.2,z:.2,y:.414,rx:.181,rz:.181},{x:.2,z:.2,y:.423,rx:.179,rz:.179}],32,p.materials[edge].solid));
  const cloth=b.role('fabric');b.mesh(roundLoft('低鼓度软垫',cloth,[{x:.2,z:.2,y:.414,rx:.172,rz:.172},{x:.2,z:.2,y:.430,rx:.177,rz:.177},{x:.2,z:.2,y:.438,rx:.166,rz:.166},{x:.2,z:.2,y:.440,rx:.08,rz:.08}],32,p.materials[cloth].solid));
  const at=(v:number,y:number)=>v+(v<.2?1:-1)*.025*(y-.045)/.33;
  for(const x of[.065,.30])for(const z of[.065,.30]){b.box('石足','stone',[x-.03,0,z-.03],[.06,.025,.06],.003);b.box('铁脚套','metal',[x-.025,.025,z-.025],[.05,.035,.05],.003);b.member('外撇连续木腿','wood',[x,.045,z],[at(x,.375),.375,at(z,.375)],.043,.043,.003);b.voxel('bronze',[Math.round(x/.005)*.005-.01,.045,Math.round((z-.028)/.005)*.005],[.02,.01,.01]);}
  for(const z of[.065,.30])b.member('横向脚枨','wood',[at(.065,.155),.155,at(z,.155)],[at(.30,.155),.155,at(z,.155)],.027,.025,.002);
  for(const x of[.065,.30])b.member('纵向脚枨','wood',[at(x,.155),.155,at(.065,.155)],[at(x,.155),.155,at(.30,.155)],.027,.025,.002);
  return b.finish('小圆凳细化：连续圆座与低鼓度织物软垫、真正斜腿倒角、脚枨和石足',{dimensionsM:[.4,.44,.4],joins:'wood legs insert into metal feet and timber seat; no load-bearing certification'});
 }
 throw Error('M001 refinement draft not implemented '+catalogId);
}
