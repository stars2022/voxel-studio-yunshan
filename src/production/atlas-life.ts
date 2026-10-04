import {inspectAtlasMaterialAssignments} from './atlas-material-review';
import {Shapes} from './shapes';
import {eachCell,type V3,type Asset} from '../core/types';
import links from './atlas-links.json';
import {registerMarketRecipes} from './atlas-market';
import {registerWorkshopRecipes} from './atlas-workshop';
import {registerCommerceRecipes} from './atlas-commerce';
import {registerResearchRecipes} from './atlas-research';
import {registerCivicRecipes} from './atlas-civic';
import {registerPublicServiceRecipes} from './atlas-public-service';
import {registerCultureRecipes} from './atlas-culture';
import {registerFestivalRecipes} from './atlas-festival';
import {registerDomesticRecipes} from './atlas-domestic';

/** Authored reconstructions, not image-to-mesh inference. Only these IDs are
 * upgraded. Reference props belonging to other catalog entries are excluded. */
export type AtlasRecipe={size:V3;pitch:number;features:string;draw:(b:Shapes,w:number,h:number,d:number)=>void;mount?:'wall'|'ceiling'|'insert';limits:string;expectedComponents?:number;primaryMasterId?:string};
export const atlasLifeRecipes:Record<number,AtlasRecipe>={};
const add=(id:number,size:V3,features:string,draw:AtlasRecipe['draw'],options:Partial<Pick<AtlasRecipe,'mount'|'limits'|'pitch'|'expectedComponents'>>={})=>atlasLifeRecipes[id]={size,pitch:.01,features,draw,limits:'静态体素构造；无动画、交互或实测工程尺寸。',...options};
const frame=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,t:number,m:number)=>{b.b(x,y,z,t,h,d,m);b.b(x+w-t,y,z,t,h,d,m);b.b(x+t,y,z,w-2*t,t,d,m);b.b(x+t,y+h-t,z,w-2*t,t,d,m);};
function locks(b:Shapes,x:number,y:number,z:number,w:number,h:number,c=.05){for(const xx of[x,x+w-c])for(const yy of[y,y+h-c]){b.b(xx,yy,z,c,c,.06,b.s.metal);b.b(xx+.01,yy+.01,z-.01,c-.02,c-.02,.02,b.s.bronze);}}
function rail(b:Shapes,x:number,y:number,z:number,w:number){b.b(x,y,z,w,.03,.04,b.s.metal);b.b(x+.02,y+.03,z,w-.04,.02,.02,b.s.wood);b.b(x+.02,y+.03,z+.03,w-.04,.02,.01,b.s.metal);}
function handle(b:Shapes,x:number,y:number,z:number,w:number,h:number){b.b(x,y,z+.01,.02,h,.04,b.s.metal);b.b(x+w-.02,y,z+.01,.02,h,.04,b.s.metal);b.b(x,y,z,w,.02,.02,b.s.bronze);b.b(x,y+h-.02,z,w,.02,.02,b.s.bronze);}
function control(b:Shapes,x:number,y:number,z:number,w=.08,h=.12){b.b(x,y,z,w,h,.06,b.s.metal);b.b(x+.01,y+.02,z-.01,w-.02,Math.max(.01,h-.04),.01,b.s.screen);for(let i=0;i<Math.min(3,Math.floor((h-.035)/.025));i++)b.b(x+.02,y+.025+i*.025,z-.02,Math.max(.01,w-.04),.01,.01,b.s.displayGlyph);b.b(x+w-.03,y+.01,z-.01,.02,.01,.01,b.s.bronze);}
function pull(b:Shapes,x:number,y:number,z:number,w:number,h:number){b.pull(x,y,z,w,h);for(const xx of[x,x+w-.02])b.b(xx,y+.01,z+.01,.02,Math.max(.01,h-.02),.07,b.s.metal);}
function door(b:Shapes,x:number,y:number,z:number,w:number,h:number,glass=false){b.inset(x,y,z,w,h,.045,glass?b.s.glass:b.s.wall,!glass,glass?{recess:b.s.metal}:undefined);for(const yy of[y+.08,y+h-.14]){b.b(x-.01,yy,z-.01,.025,.06,.035,b.s.metal);b.b(x,yy+.01,z-.02,.01,.04,.02,b.s.bronze);}handle(b,x+w-.075,y+h*.42,z-.04,.04,.22);}
function floorHui(b:Shapes,x:number,y:number,z:number,w:number,t:number,m:number){b.b(x,y,z,w,t,t,m);b.b(x,y,z,t,t,w,m);b.b(x,y,z+w-t,w,t,t,m);b.b(x+w-t,y,z+2*t,t,t,w-2*t,m);b.b(x+2*t,y,z+2*t,w-2*t,t,t,m);b.b(x+2*t,y,z+2*t,t,t,w-4*t,m);b.b(x+2*t,y,z+w-3*t,w-4*t,t,t,m);}
function faucet(b:Shapes,x:number,y:number,z:number){
 b.b(x-.02,y,z-.02,.09,.025,.09,b.s.metal);b.b(x,y+.025,z,.05,.18,.05,b.s.metal);b.b(x-.005,y+.19,z-.16,.06,.05,.21,b.s.metal);b.b(x+.005,y+.175,z-.16,.04,.025,.04,b.s.bronze);b.b(x+.015,y+.165,z-.15,.02,.02,.02,0);b.b(x+.01,y+.24,z-.015,.03,.025,.08,b.s.bronze);
}
function sink(b:Shapes,w:number,h:number,d:number,ceramic:boolean){
 const m=ceramic?b.s.ceramicWhite:b.s.trim,rimMaterial=ceramic?b.s.ceramicWhite:b.s.wall;
 b.part('盆体、空腔、翻边与内收盆底',()=>{b.rounded(0,0,0,w,h,d,.03,m);b.rounded(.04,.04,.04,w-.08,h,d-.14,.03,0);b.b(.01,h-.03,.01,w-.02,.03,.03,rimMaterial);for(const x of[.01,w-.04])b.b(x,h-.03,.01,.03,.03,d-.02,rimMaterial);b.b(.01,h-.03,d-.08,w-.02,.03,.07,rimMaterial);});
 b.part('排水篦、溢流口与龙头阀座',()=>{b.cylinder(w/2,.03,d*.48,.035,.01,b.s.metal,.02);for(const xx of[-.01,.01])b.b(w/2+xx,.03,d*.48-.02,.01,.01,.04,b.s.metal);b.b(w/2-.035,h-.07,d-.11,.07,.02,.02,b.s.metal);b.b(w/2-.025,h-.065,d-.12,.05,.01,.01,b.s.energy);faucet(b,w/2-.025,h,d-.075);b.b(w*.75,h,d-.08,.05,.06,.05,b.s.metal);b.b(w*.75,h+.05,d-.085,.07,.02,.03,b.s.bronze);});
}
function squareCup(b:Shapes,x:number,y:number,z:number,size=.1){
 b.rounded(x,y,z,size,.09,size,.015,b.s.ceramicWhite);b.b(x+.02,y+.025,z+.02,size-.04,.09,size-.04,0);b.b(x+.01,y,z+.01,size-.02,.015,size-.02,b.s.bronze);b.hui(x+.02,y+.025,z-.01,size-.04,.06,b.s.ceramicTeal,.01);
}
function tube(b:Shapes,origin:V3,length:number,outer:number,inner:number,axis:0|1|2,m:number){const start=[...origin] as V3;for(const j of[0,1,2])if(j!==axis)start[j]-=outer;const size:[number,number,number]=[2*outer,2*outer,2*outer];size[axis]=length;eachCell(b.bounds(...start,...size),p=>{const rr=p.reduce((s,n,j)=>j===axis?s:s+((n+.5)*b.pitch-origin[j])**2,0);if(rr<=outer*outer&&rr>=inner*inner)b.g.set(p,m);});}

add(8,[1.1,1.8,.48],'独立衣柜内胆：通透挂衣区、可见搁板承托、双区立板和挂杆连接套',(b,w,h,d)=>{
 b.part('底顶板、两侧安装肋与中分板',()=>{for(const y of[0,h-.035])b.b(.02,y,.02,w-.04,.035,d-.04,b.s.wood);for(const x of[.02,w*.62,w-.055])b.b(x,.035,.02,.035,h-.07,d-.04,b.s.wood);});
 b.part('四层搁板与可见承托销',()=>{for(const y of[.32,.68,1.04,1.4]){b.b(w*.62+.035,y,.02,w*.38-.07,.025,d-.04,b.s.wood);for(const x of[w*.62+.035,w-.055])for(const z of[.08,d-.08])b.b(x,y-.025,z,.02,.025,.025,b.s.bronze);}});
 b.part('挂杆、双端承套与后背交叉拉撑',()=>{b.b(.035,h-.21,d*.49,w*.62-.035,.025,.025,b.s.metal);for(const x of[.03,w*.62-.035])b.b(x,h-.225,d*.47,.04,.055,.065,b.s.trim);b.beam([.04,.05,d-.03],[w-.04,h-.05,d-.03],.02,b.s.metal);});
},{mount:'insert',limits:'只包含内胆，不重复制作图中的衣柜外壳、柜门或衣物；插入衣柜需校验实际内尺寸。'});
add(9,[.65,.8,.24],'梳妆镜可见背壳、双侧枢轴、木框嵌石脚、退层镜框与窄底抽屉',(b,w,h,d)=>{
 b.part('台座、浅抽屉与石脚',()=>{b.slab(0,.04,0,w,.09,d);for(const x of[.03,w-.1])b.b(x,0,.05,.07,.04,.14,b.s.wall);b.b(.12,.055,-.01,w-.24,.055,.025,b.s.wood);pull(b,w/2-.04,.06,-.03,.08,.04);});
 b.part('木立柱、铜轴套与顶肩',()=>{for(const x of[.02,w-.075]){b.post(x,.13,d/2-.025,.06,h-.15,false);b.b(x,.44,d/2-.04,.09,.065,.08,b.s.bronze);}});
 b.part('镜背、内退玻璃与三层框口',()=>{b.b(.095,.18,d/2+.02,w-.19,h-.24,.035,b.s.wood);frame(b,.08,.16,d/2-.02,w-.16,h-.2,.045,.035,b.s.wood);frame(b,.115,.195,d/2-.025,w-.23,h-.27,.025,.015,b.s.metal);b.b(.13,.21,d/2-.005,w-.26,h-.3,.03,b.s.glass);locks(b,.08,.16,d/2-.04,w-.16,h-.2,.045);});
},{limits:'镜面是玻璃色占位，当前渲染不支持平面镜反射；镜轴仅有静态构造。'});
add(19,[.52,.055,.24],'输入托板：独立键帽与键间槽、掌托木边、右侧旋钮及后走线口',(b,w,h,d)=>{
 b.part('底壳、木围边与金属角锁',()=>{b.b(0,0,0,w,.025,d,b.s.metal);b.b(.025,.02,.025,w-.05,.015,d-.05,b.s.wood);for(const x of[0,w-.03])for(const z of[0,d-.03]){b.b(x,.015,z,.03,.03,.03,b.s.trim);b.b(x+.01,.035,z+.01,.01,.01,.01,b.s.bronze);}b.b(.03,.03,.01,w-.06,.015,.03,b.s.woodEdge);});
 b.part('四排键帽、长空格和分离旋钮',()=>{for(let row=0;row<4;row++)for(let col=0;col<11;col++){const xx=.035+col*.035,zz=.065+row*.035;b.b(xx,.035,zz,.025,.015,.025,row===3?b.s.polymerDark:b.s.polymer);}b.b(.12,.035,.035,.22,.015,.02,b.s.polymer);b.cylinder(w-.05,.03,d-.055,.03,.025,b.s.metal);b.b(w-.055,.055,d-.065,.01,.01,.02,b.s.bronze);});
 b.part('走线座和侧面状态条',()=>{b.b(.17,.015,d-.02,.12,.02,.02,0);b.b(.19,.015,d-.02,.08,.01,.01,b.s.metal);b.b(.42,.025,0,.05,.01,.01,b.s.energy);});
});
add(20,[.28,.48,.3],'折臂台灯：双木臂、销轴夹耳、退层石座、悬挂灯罩与格栅底口',(b,w,h,d)=>{
 b.part('退层石座、脚垫和触控区',()=>{b.b(.015,0,.07,w-.03,.025,d-.09,b.s.metal);b.b(.025,.025,.08,w-.05,.025,d-.11,b.s.wall);b.b(.045,.05,.1,w-.09,.02,d-.15,b.s.wood);control(b,.065,.035,.055,.06,.04);});
 b.part('双木臂、抱箍和三个轴关节',()=>{b.beam([.16,.075,.21],[.17,.29,.255],.035,b.s.wood);b.beam([.17,.29,.255],[.14,.45,.11],.035,b.s.wood);for(const [x,y,z]of[[.16,.09,.21],[.17,.29,.255],[.14,.43,.11]]){b.b(x-.035,y-.025,z-.025,.07,.05,.05,b.s.metal);b.b(x-.045,y-.01,z-.015,.01,.02,.03,b.s.bronze);}});
 b.part('悬吊灯框、内缩灯芯和透空格栅',()=>{b.b(.055,.38,.015,.2,.025,.15,b.s.metal);b.b(.07,.35,.03,.17,.03,.12,b.s.warm);frame(b,.055,.325,.015,.2,.06,.025,.02,b.s.wood);for(const x of[.055,.235])b.b(x,.325,.015,.02,.08,.15,b.s.wood);for(const z of[.015,.145])b.b(.055,.325,z,.2,.02,.02,b.s.wood);});
});
add(23,[.4,.44,.4],'圆凳：倒阶蓝灰软座、厚木面沿、外撇腿、四向脚枨与套脚',(b,w,h,d)=>{
 b.part('圈沿、软座与包边',()=>{b.cylinder(w/2,h-.07,d/2,.2,.04,b.s.wood);b.cylinder(w/2,h-.03,d/2,.18,.015,b.s.fabricEdge);b.cylinder(w/2,h-.015,d/2,.17,.015,b.s.fabric);});
 b.part('外撇木腿和金属石脚',()=>{for(const x of[.065,.3])for(const z of[.065,.3]){const top:[number,number,number]=[x<.2?x+.025:x-.025,h-.04,z<.2?z+.025:z-.025];b.beam([x,.045,z],top,.045,b.s.wood);b.b(x-.03,0,z-.03,.06,.025,.06,b.s.wall);b.b(x-.025,.025,z-.025,.05,.04,.05,b.s.metal);b.b(top[0]-.03,.335,top[2]-.03,.06,.04,.06,b.s.metal);}});
 b.part('四向脚枨和外露榫头',()=>{for(const z of[.09,.275])b.b(.075,.15,z,.24,.025,.025,b.s.wood);for(const x of[.09,.275])b.b(x,.15,.075,.025,.025,.24,b.s.wood);for(const x of[.055,.31])b.b(x,.35,.07,.02,.02,.02,b.s.bronze);});
});
add(24,[.9,.9,.34],'鞋柜：中空柜体、双翻板、退层门芯、双层内衬、顶通风槽与铰接座',(b,w,h,d)=>{
 b.cabinet(w,h,d,1,2,false);
 b.part('双翻板和浅色凹芯',()=>{for(let i=0;i<2;i++){const y=.14+i*.34;b.inset(.065,y,-.025,w-.13,.315,.04,b.s.wall);pull(b,w/2-.055,y+.245,-.05,.11,.045);for(const x of[.045,w-.07])b.b(x,y+.03,0,.025,.06,.05,b.s.bronze);b.b(.04,y+.035,.03,w-.08,.025,d-.06,b.s.wood);}});
 b.part('顶沿通风和侧控制座',()=>{for(let x=.12;x<w-.1;x+=.07)b.b(x,h-.04,.1,.025,.04,.16,0);control(b,w-.065,.69,-.035,.05,.1);});
},{limits:'翻板为闭合静态姿态；内部容器存在，未实现开合动画或鞋子库存。'});
add(25,[.9,.24,.24],'壁搁板：实木承托、前挡杆、铜销、三角托臂与双墙面安装板',(b,w,h,d)=>{
 b.part('层板、低挡杆和端柱',()=>{b.b(0,.12,0,w,.04,d,b.s.wood);b.b(.03,.205,.015,w-.06,.025,.025,b.s.wood);for(const x of[.02,w-.05]){b.b(x,.155,.015,.03,.07,.03,b.s.metal);b.b(x,.21,.015,.03,.03,.03,b.s.bronze);}b.b(.05,.16,d-.03,w-.1,.045,.03,b.s.wood);});
 b.part('透空托臂、墙板和四枚螺钉',()=>{for(const x of[.08,w-.12]){b.b(x,0,d-.03,.045,h,.03,b.s.metal);b.beam([x+.02,.015,d-.04],[x+.02,.12,.03],.025,b.s.metal);for(const y of[.025,h-.045])b.b(x+.01,y,d-.045,.02,.02,.015,b.s.bronze);}});
},{mount:'wall',limits:'只包含可安装层板，图中的书册与植物作为其他母版，不焊死在层板上。'});
add(26,[1.8,.16,.15],'窗帘双轨：贯通下开口、滑车、真空挂环、双墙座和端盖',(b,w,h,d)=>{
 b.part('两条下开口轨道与端盖',()=>{for(const z of[.02,.095]){b.b(0,.095,z,w,.035,.035,b.s.metal);b.b(.035,.095,z+.01,w-.07,.025,.015,0);for(const x of[0,w-.04])b.b(x,.085,z-.01,.04,.055,.055,b.s.enamel);}for(const x of[.18,w-.22]){b.b(x,.1,d-.02,.04,.06,.02,b.s.metal);b.b(x,.115,.04,.04,.025,d-.04,b.s.metal);}});
 b.part('滑车、销颈与镂空挂环',()=>{for(let x=.12;x<w-.08;x+=.16){b.b(x,.085,.03,.025,.025,.02,b.s.bronze);b.b(x+.005,.065,.035,.01,.035,.01,b.s.metal);frame(b,x-.005,.025,.025,.04,.05,.02,.01,b.s.metal);}});
},{mount:'wall',limits:'滑车与挂环可分选，未建立运动约束；帘片独立母版。'});
add(27,[.8,1.8,.1],'帘片：连续折叠体素薄壳、顶部穿孔吊耳、双下摆与织入回纹',(b,w,h,d)=>{
 b.part('连续折叠帘面与双下摆',()=>{const n=Math.round(w/b.pitch);for(let k=0;k<n;k++){const x=k*b.pitch,z=.035+.025*Math.cos(x*Math.PI/.07),next=.035+.025*Math.cos((x+b.pitch)*Math.PI/.07),lo=Math.min(z,next);b.b(x,0,lo,b.pitch,h-.07,Math.max(.02,Math.abs(z-next)+.015),b.s.fabric);for(const y of[.08,.19])b.b(x,y,lo-.01,b.pitch,.025,.01,b.s.wovenLight);}});
 b.part('织入回纹与穿孔吊耳',()=>{for(let x=.035;x<w-.05;x+=.14){frame(b,x,h-.1,.025,.06,.1,.035,.015,b.s.fabric);b.hui(x,.1,.015,.08,.08,b.s.wovenLight,.01);}b.b(0,h-.11,.025,w,.025,.06,b.s.fabricEdge);});
},{mount:'insert',limits:'实心薄壳帘片，无布料模拟；回纹为毫米级图案的厘米网格简化。'});
add(28,[.56,.14,.56],'顶灯：退层攒边框、凹入漫射芯、透气背壳、角鞍和吊装座',(b,w,h,d)=>{
 b.part('背壳与天花安装座',()=>{b.b(.04,.08,.04,w-.08,.035,d-.08,b.s.metal);b.b(.15,.115,.15,w-.3,.025,d-.3,b.s.trim);for(let x=.08;x<w-.06;x+=.06)b.b(x,.1,.065,.02,.015,.08,0);});
 b.part('木边、角鞍和内退灯芯',()=>{b.b(.03,.025,.03,w-.06,.055,d-.06,b.s.wood);b.b(.075,.015,.075,w-.15,.05,d-.15,b.s.warm);for(const x of[.015,w-.055])for(const z of[.015,d-.055]){b.b(x,0,z,.04,.095,.04,b.s.metal);b.b(x+.01,.01,z,.02,.025,.015,b.s.bronze);}for(const z of[.06,d-.075])b.b(.06,.01,z,w-.12,.02,.015,b.s.bronze);for(const x of[.06,w-.075])b.b(x,.01,.06,.015,.02,d-.12,b.s.bronze);});
},{mount:'ceiling'});
add(29,[.18,.42,.18],'壁灯：木背板、悬臂、双层端帽、四根笼骨、内缩灯芯和端销',(b,w,h,d)=>{
 b.part('背板与上下固定臂',()=>{b.b(.02,0,d-.035,w-.04,h,.025,b.s.metal);b.b(.04,.025,d-.045,w-.08,h-.05,.025,b.s.wood);for(const y of[.06,.33])b.b(.065,y,.045,.05,.035,d-.07,b.s.metal);});
 b.part('灯笼骨架、铜角与退面灯芯',()=>{for(const y of[.055,.325]){b.b(.005,y,0,w-.01,.03,.13,b.s.metal);b.b(.025,y+.03,.015,w-.05,.02,.10,b.s.bronze);}for(const x of[.015,w-.035])for(const z of[.01,.1])b.b(x,.085,z,.02,.245,.02,b.s.bronze);b.b(.045,.09,.03,w-.09,.23,.06,b.s.warm);b.b(.06,.035,.025,.06,.02,.07,b.s.bronze);b.b(.075,.015,.045,.03,.02,.03,b.s.metal);});
},{mount:'wall'});
add(30,[.28,.16,.035],'室内面板：双真实插孔、三孔组、双摇臂开关、状态屏与压框角锁',(b,w,h,d)=>{
 b.part('嵌墙盒、攒边框和分仓面板',()=>{b.b(0,0,0,w,h,d,b.s.wood);frame(b,0,0,-.01,w,h,.02,.015,b.s.metal);for(const x of[.015,.11,.2])b.b(x,.02,-.015,.075,.12,.025,b.s.polymer);locks(b,0,0,-.02,w,h,.03);});
 b.part('贯通插孔与双摇臂',()=>{for(const [x,y]of[[.035,.10],[.065,.10],[.05,.065],[.03,.035],[.07,.035]])b.b(x,y,-.02,.01,.025,d+.02,0);for(const x of[.12,.15]){b.b(x,.035,-.025,.025,.09,.025,b.s.polymerDark);b.b(x+.005,.045,-.035,.015,.045,.015,b.s.polymerDark);}control(b,.2,.03,-.02,.065,.1);});
},{mount:'wall'});

// M002 · kitchen and serving objects. Countertops and appliances stay distinct.
add(31,[1.8,.02,1.2],'地毯：分层包边、织入四角回纹、细分短穗与蓝灰芯',(b,w,h,d)=>{
 b.part('织物芯与双道包边',()=>{b.b(0,0,0,w,h,d,b.s.fabricEdge);b.b(.02,0,.02,w-.04,h,d-.04,b.s.fabric);for(const z of[.06,d-.09])b.b(.06,.01,z,w-.12,.01,.03,b.s.wovenLight);for(const x of[.06,w-.09])b.b(x,.01,.06,.03,.01,d-.12,b.s.wovenLight);});
 b.part('四角回纹和独立短穗',()=>{for(const x of[.11,w-.31])for(const z of[.11,d-.31])floorHui(b,x,.01,z,.2,.02,b.s.wovenLight);for(let z=.04;z<d-.02;z+=.055)for(const x of[-.06,w]){b.b(x,0,z,.06,.01,.02,b.s.wovenLight);b.b(x<0?-.02:w,.01,z,.025,.01,.025,b.s.wovenLight);}});
});
add(32,[1.6,.82,.76],'工作桌：攒边嵌石台面、抽屉、镂空侧枨、工具挂架和右侧终端',(b,w,h,d)=>{
 b.table(w,h,d);b.part('横枨、阶梯牙头和侧向工具挂架',()=>{for(const x of[.05,w-.1]){b.b(x,.2,.07,.045,.04,d-.14,b.s.wood);b.beam([x,.22,.09],[x,h-.13,d-.09],.03,b.s.metal);}b.b(.1,.2,d-.11,w-.2,.04,.035,b.s.wood);b.b(-.01,.48,.08,.055,.025,d-.16,b.s.metal);for(let z=.16;z<d-.1;z+=.12){b.b(-.015,.42,z,.06,.12,.025,b.s.metal);b.b(-.025,.41,z,.02,.025,.055,b.s.bronze);}});
 b.part('左抽屉、膝部净空与右侧控制盒',()=>{b.b(.12,.57,0,.55,.16,.45,b.s.wood);b.inset(.125,.59,-.015,.54,.135,.025,b.s.wood,false,{recess:b.s.woodEdge});pull(b,.34,.635,-.04,.13,.045);b.b(w-.23,.6,-.01,.13,.15,.09,b.s.metal);control(b,w-.22,.615,-.025,.11,.115);});
});
add(37,[1.2,.82,.6],'厨房下柜：左单门、右浅屉双开格、内腔、背部管线通孔与独立角柱',(b,w,h,d)=>{
 b.cabinet(w,h,d,2,1,false);
 b.part('左嵌芯门、铰链与右浅抽屉',()=>{door(b,.065,.14,-.015,w*.48-.06,h-.22);b.inset(w*.52,.61,-.015,w*.48-.065,.135,.04,b.s.wood,false,{recess:b.s.woodEdge});pull(b,w*.72,.65,-.04,.12,.04);});
 b.part('右开架搁板、门内层板和后管孔',()=>{b.b(w*.52,.34,.03,w*.48-.06,.025,d-.06,b.s.wood);b.b(.05,.42,.025,w*.46,.025,d-.055,b.s.wood);b.b(.18,.25,d-.04,.18,.18,.05,0);});
},{limits:'仅下柜母版，不包含参考图中的台面、碗盘库存；门和抽屉尚无动画。'});
add(38,[1.24,.06,.64],'厨房台面：厚石沿、倒阶外边、后挡水条、独立水槽与灶具安装孔',(b,w,h,d)=>{
 b.part('承托框、浅色石台与后挡水条',()=>{b.b(0,0,0,w,.025,d,b.s.metal);b.b(.005,.025,.005,w-.01,.035,d-.01,b.s.wall);b.b(.01,h,d-.035,w-.02,.065,.025,b.s.wall);for(const x of[0,w-.045])for(const z of[0,d-.045])b.b(x,0,z,.045,.025,.045,b.s.bronze);});
 b.part('真实通孔、嵌装边和检修线槽',()=>{for(const [x,ww]of[[.10,.46],[.70,.43]]){b.b(x-.015,.04,.14,ww+.03,.02,.38,b.s.trim);b.b(x,.0,.155,ww,.08,.35,0);}b.b(.08,.0,d-.09,.12,h,.025,0);});
},{mount:'insert',limits:'该台面有两个实际通孔，不含示意支腿和灶具；需匹配同尺寸盆体/设备，不能直接塞入其他默认尺寸。'});
add(39,[.72,1.3,.52],'双灶及烟罩：有孔支锅架、分离旋钮、滤网下口、折级烟罩和排烟接口',(b,w,h,d)=>{
 b.part('灶面、炉圈与透空锅架',()=>{b.b(0,0,0,w,.05,d,b.s.metal);b.b(.025,.05,.08,w-.05,.015,d-.11,b.s.trim);for(const x of[w*.25,w*.75]){b.cylinder(x,.06,d*.56,.105,.025,b.s.metal,.07);b.cylinder(x,.065,d*.56,.06,.015,b.s.energy,.035);for(const sign of[-1,1]){b.b(x+sign*.10-.012,.085,d*.56-.015,.025,.025,.15,b.s.metal);b.b(x-.075,.085,d*.56+sign*.1-.012,.15,.025,.025,b.s.metal);}}for(let i=0;i<4;i++){b.b(.11+i*.15,.005,-.025,.05,.04,.025,b.s.bronze);b.b(.13+i*.15,.015,-.035,.01,.02,.01,b.s.metal);}});
 b.part('烟罩折级外壳、过滤格栅与工作灯',()=>{b.b(.015,.84,.005,w-.03,.1,d-.01,b.s.metal);b.b(.045,.94,.025,w-.09,.04,d-.05,b.s.trim);b.b(.09,.98,.08,w-.18,.04,d-.14,b.s.metal);b.b(.055,.84,.08,w-.11,.055,d-.16,0);for(let x=.065;x<w-.04;x+=.04)b.b(x,.85,.08,.01,.015,d-.16,b.s.trim);b.b(.22,.86,-.005,.28,.025,.02,b.s.warm);locks(b,.015,.84,-.015,w-.03,.1,.04);});
 b.part('烟道、法兰和顶部贯通口',()=>{b.b(w/2-.1,1.02,d-.25,.2,h-1.02,.2,b.s.metal);b.b(w/2-.11,h-.035,d-.26,.22,.035,.22,b.s.trim);b.b(w/2-.07,1.04,d-.22,.14,.28,.14,0);});
},{expectedComponents:2,limits:'灶面与壁挂烟罩为两个有意分离的功能部件；不以虚构墙板把它们连成一块。无燃烧或油烟动画。'});
add(40,[.66,.18,.48],'厨房水槽：斜收盆底、贯通盆腔、溢流槽、滤水篦和分层出水嘴',(b,w,h,d)=>sink(b,w,h,d,false),{mount:'insert',limits:'只包含水槽和龙头，不重复加入下方柜体；不生成静态假水柱。'});
add(41,[.8,.68,.32],'厨房吊柜：双实门、双玻璃门、双层搁板、下照灯和后挂梁',(b,w,h,d)=>{
 b.part('悬挂柜框与背板',()=>{for(const x of[0,w/2-.015,w-.03])b.b(x,.02,0,.03,h-.04,d,b.s.wood);for(const y of[.02,h-.035,.33])b.b(0,y,0,w,.03,d,b.s.wood);b.b(0,.03,d-.025,w,h-.06,.025,b.s.wood);});
 b.part('四扇前门、铰链和细框玻璃',()=>{for(let j=0;j<4;j++)door(b,.02+j*(w-.04)/4,.055,-.025,(w-.04)/4-.012,h-.105,j>=2);});
 b.part('顶底包角、安装梁和两处下照灯',()=>{locks(b,0,.02,-.035,w,h-.04,.06);for(const x of[.13,w-.21])b.b(x,0,.09,.08,.02,.08,b.s.warm);b.b(.05,.52,d-.01,w-.1,.04,.025,b.s.metal);});
},{mount:'wall'});
add(42,[.96,1.7,.46],'食品柜：左五层开放架、右长门、铜合页、内空腔和底部通风',(b,w,h,d)=>{
 b.cabinet(w,h,d,2,1,false);b.part('左分层与右内层板',()=>{for(const y of[.4,.68,.96,1.24])b.b(.04,y,.025,w/2-.06,.025,d-.05,b.s.wood);for(const y of[.65,1.17])b.b(w/2+.02,y,.025,w/2-.06,.025,d-.05,b.s.wood);});
 b.part('右凹芯长门、合页和底通风',()=>{door(b,w/2+.025,.14,-.025,w/2-.075,h-.21);for(let x=.1;x<w/2-.03;x+=.06)b.b(x,.1,0,.02,.02,.035,0);});
},{limits:'不把图中的食品罐、药包或篮筐库存焊入柜体；柜体尺寸为制作假设。'});
add(43,[.68,1.82,.68],'双开冷藏柜：内腔、门封凹槽、铜长拉手、右门控制屏与散热格栅',(b,w,h,d)=>{
 b.part('隔热壳、内部搁板和橡胶调平脚',()=>{b.cabinet(w,h,d,1,4,false,b.s.metal,{foot:b.s.rubber,base:b.s.enamel,edge:b.s.trim});b.b(.04,.15,.04,w-.08,h-.19,.015,b.s.polymer);for(const x of[.04,w-.065])b.b(x,.14,.03,.025,h-.21,d-.065,b.s.polymer);});
 b.part('双门板、门封线和长拉手',()=>{for(let j=0;j<2;j++){const x=.025+j*(w-.05)/2,ww=(w-.05)/2-.015;frame(b,x,.15,-.035,ww,h-.23,.03,.02,b.s.rubber);b.inset(x+.015,.17,-.045,ww-.03,h-.27,.04,b.s.enamel,false,{frame:b.s.enamel,recess:b.s.rubber});handle(b,j?w/2+.025:w/2-.08,.61,-.085,.035,.63);}control(b,w-.19,1.31,-.065,.11,.28);});
 b.part('下格栅、可见换热背肋和角锁',()=>{for(let x=.075;x<w-.06;x+=.04)b.b(x,.05,-.025,.02,.065,.025,b.s.trim);b.b(.18,.065,-.035,.19,.012,.01,b.s.energy);for(let x=.07;x<w-.04;x+=.065)b.b(x,.3,d-.01,.015,1.3,.025,b.s.trim);locks(b,0,.1,-.06,w,h-.1,.065);});
},{limits:'门封和内腔为静态体素，制冷、开门与库存系统待接入。'});
add(44,[.36,.16,.28],'炊锅：空心分层锅壁、加厚锅沿、两只镂空耳柄和四个铆接耳座',(b,w,h,d)=>{
 b.part('锅底、锅壁与分层卷口',()=>{b.bowl(w/2,0,d/2,.125,h-.02,b.s.trim);b.cylinder(w/2,h-.025,d/2,.13,.025,b.s.metal,.105);b.cylinder(w/2,h-.015,d/2,.13,.015,b.s.metalBright,.115);b.cylinder(w/2,0,d/2,.09,.02,b.s.metal);});
 b.part('镂空双耳、木握和铆钉',()=>{for(const x of[0,w-.07]){b.b(x,.095,.10,.07,.025,.085,b.s.metal);b.b(x+.02,.095,.12,.03,.03,.045,0);b.b(x<.1?x:x+.05,.1,.10,.02,.025,.085,b.s.wood);for(const z of[.10,.165])b.b(x+.015,.12,z,.03,.015,.02,b.s.bronze);}});
});
add(45,[.28,.08,.28],'锅盖：环形密封沿、阶梯拱玻璃芯、铜压环和镂空桥式提手',(b,w,h,d)=>{
 b.part('环形盖沿和阶梯拱芯',()=>{b.cylinder(w/2,0,d/2,.14,.02,b.s.metal,.11);b.cylinder(w/2,.02,d/2,.12,.01,b.s.bronze,.11);for(let k=0;k<4;k++)b.cylinder(w/2,.01+k*.01,d/2,.12-k*.018,.01,b.s.glass);});
 b.part('提手承座与镂空桥形握把',()=>{b.b(.1,.045,.1,.08,.01,.08,b.s.bronze);for(const x of[.105,.155])b.b(x,.055,.115,.02,.025,.04,b.s.metal);b.b(.105,.075,.115,.07,.015,.04,b.s.wood);});
});
add(46,[.2,.1,.2],'通用陶碗：圈足、真实盆腔、双道色釉腰线和卷口',(b,w,h,d)=>{
 b.part('圈足与渐扩空心碗壁',()=>{b.cylinder(.1,0,.1,.055,.015,b.s.ceramicWhite,.035);b.bowl(.1,.015,.1,.1,h-.015,b.s.ceramicWhite);});
 b.part('色釉腰线与卷口',()=>{b.cylinder(.1,.06,.1,.084,.01,b.s.ceramicTeal,.072);b.cylinder(.1,.08,.1,.095,.01,b.s.ceramicTeal,.082);b.cylinder(.1,.09,.1,.10,.01,b.s.ceramicWhite,.083);});
},{limits:'图中多种碗盘是尺寸形态示意；本 ID 输出一个空心碗母版，不把五个外形计成五个基础资产。'});

// M003 · washroom, tea and counter. All holes below are voxel voids.
add(47,[.36,.3,.2],'杯壶器具：八棱保温壶、空心杯、独立壶嘴、环柄与底托',(b,w,h,d)=>{
 b.part('木托盘、包角与杯位',()=>{b.b(0,0,0,w,.025,d,b.s.wood);for(const x of[0,w-.035])for(const z of[0,d-.035])b.b(x,.01,z,.035,.025,.035,b.s.metal);});
 b.part('保温壶、出水嘴和镂空握柄',()=>{b.rounded(.035,.025,.04,.13,.23,.13,.025,b.s.enamel);for(const y of[.025,.235])b.cylinder(.1,y,.105,.07,.02,b.s.metal);b.cylinder(.1,.255,.105,.055,.02,b.s.metal);b.b(.085,.275,.09,.03,.02,.03,b.s.bronze);b.b(.15,.065,.08,.055,.16,.04,b.s.wood);b.b(.15,.09,.08,.03,.105,.04,0);b.b(.01,.22,.08,.04,.025,.04,b.s.metal);b.b(.0,.22,.08,.02,.02,.04,b.s.bronze);});
 b.part('独立空心杯与铜圈足',()=>squareCup(b,.24,.025,.055,.105));
},{limits:'壶盖为闭合静态构造；杯内腔开放，不使用图中假液面遮挡内腔。'});
add(48,[.42,.065,.28],'切配工具：拼板砧面、凹入接汁槽、环形提耳、菜刀刃背与铆接木柄',(b,w,h,d)=>{
 b.part('拼板砧面与四角金属包件',()=>{b.b(0,0,0,w,.035,d,b.s.wood);for(let x=.04;x<w-.02;x+=.05)b.b(x,.03,.02,.015,.005,d-.04,b.s.woodEdge);for(const x of[0,w-.035])for(const z of[0,d-.035]){b.b(x,.005,z,.035,.03,.035,b.s.metal);b.b(x+.01,.035,z+.01,.015,.01,.015,b.s.bronze);}for(const z of[.03,d-.04])b.b(.04,.025,z,w-.08,.015,.01,0);for(const x of[.03,w-.04])b.b(x,.025,.03,.01,.015,d-.06,0);});
 b.part('刀片、刃线、穿孔和铆接木柄',()=>{b.b(.065,.035,.09,.18,.015,.095,b.s.trim);b.b(.065,.04,.09,.18,.01,.01,b.s.metalBright);b.b(.23,.04,.12,.14,.025,.045,b.s.wood);b.b(.225,.035,.115,.025,.025,.055,b.s.metal);for(const x of[.27,.34])b.b(x,.06,.135,.01,.01,.01,b.s.bronze);b.b(.085,.03,.15,.02,.035,.02,0);});
},{limits:'仅砧板与刀具，调料罐、食物和背景刀架不合并为此资产。'});
add(49,[.5,.28,.34],'茶具组合母体：透水茶盘、提梁壶、真实杯腔、回纹与铜角',(b,w,h,d)=>{
 b.part('茶盘外框、透水条板与集水底',()=>{b.b(0,0,0,w,.015,d,b.s.metal);for(const z of[0,d-.025])b.b(0,.015,z,w,.035,.025,b.s.wood);for(const x of[0,w-.025])b.b(x,.015,0,.025,.035,d,b.s.wood);for(let z=.045;z<d-.025;z+=.035)b.b(.025,.025,z,w-.05,.02,.02,b.s.wood);for(const x of[0,w-.035])for(const z of[0,d-.035])b.b(x,.025,z,.035,.025,.035,b.s.bronze);});
 b.part('方壶、分层盖、提梁与出水嘴',()=>{b.rounded(.27,.045,.095,.17,.13,.15,.025,b.s.ceramic);b.b(.3,.175,.12,.11,.02,.1,b.s.ceramic);b.b(.34,.195,.15,.035,.02,.035,b.s.bronze);for(const x of[.27,.42])b.b(x,.15,.16,.02,.11,.025,b.s.wood);b.b(.27,.26,.16,.17,.02,.025,b.s.wood);b.hui(.315,.08,.085,.08,.07,b.s.ceramicTeal,.01);b.beam([.285,.11,.14],[.235,.18,.14],.035,b.s.ceramic);b.b(.22,.175,.13,.035,.025,.03,b.s.ceramic);b.b(.225,.185,.14,.02,.02,.01,0);});
 b.part('四只空心杯与独立底足',()=>{for(const x of[.04,.15])for(const z of[.055,.2])squareCup(b,x,.045,z,.08);});
},{limits:'清单把茶盘、壶与杯列为一个器具母版；部件可分选，但不虚报为六个新资产。'});
add(50,[.82,.76,.5],'洗面下柜：左柜门、中双屉、右开放格、后检修孔与底部承托',(b,w,h,d)=>{
 b.cabinet(w,h,d,1,1,false);
 b.part('分仓立板、抽屉与左凹芯门',()=>{for(const x of[w*.32,w*.7])b.b(x,.14,.02,.025,h-.2,d-.04,b.s.wood);door(b,.05,.145,-.025,w*.32-.06,h-.22);for(let j=0;j<2;j++){const y=.16+j*.25;b.b(w*.32+.025,y,0,w*.38-.03,.025,d-.04,b.s.wood);for(const xx of[w*.32+.025,w*.7-.025])b.b(xx,y,0,.025,.23,d-.04,b.s.wood);b.inset(w*.32+.035,y,-.025,w*.38-.045,.23,.04,b.s.wall);pull(b,w*.48,y+.11,-.05,.1,.04);}b.b(w*.72,.4,.02,w*.28-.035,.025,d-.05,b.s.wood);});
 b.part('后部给排水检修口与侧搁梁',()=>{b.b(w*.39,.3,d-.04,w*.22,.23,.05,0);b.b(.005,.22,.09,.035,.025,.25,b.s.metal);});
},{limits:'柜体独立，不含图中的台盆和瓶罐；可使用安装接口连接单独台盆。'});
add(51,[.74,.14,.46],'洗面盆：退面内腔、厚唇、溢流与排水篦、独立鹅颈出水嘴',(b,w,h,d)=>sink(b,w,h,d,true),{mount:'insert',limits:'省略流动水柱与液面，保留可检查的空盆和排水结构。'});
add(52,[.4,.78,.7],'坐便器：内空盆、分层座圈、存水底座、水箱、铰轴及竖起盖板',(b,w,h,d)=>{
 b.part('存水底座与空心瓷盆',()=>{b.rounded(.075,0,.12,w-.15,.3,.41,.05,b.s.ceramicWhite);b.bowl(w/2,.22,.26,.185,.17,b.s.ceramicWhite);b.cylinder(w/2,.39,.26,.20,.025,b.s.polymer,.135);b.cylinder(w/2,.37,.26,.19,.02,b.s.metal,.14);});
 b.part('水箱、封盖和前控制盒',()=>{b.rounded(.035,.32,.495,w-.07,.45,.19,.025,b.s.ceramicWhite);b.b(.035,h-.025,.495,w-.07,.025,.19,b.s.ceramicWhite);control(b,.035,.48,.475,.065,.14);b.b(.27,h-.035,.56,.05,.035,.035,b.s.bronze);});
 b.part('竖起盖板、内凹面和双铰轴',()=>{b.rounded(.035,.41,.455,w-.07,.33,.035,.045,b.s.metal);b.rounded(.055,.425,.435,w-.11,.30,.035,.035,b.s.polymer);b.rounded(.08,.45,.425,w-.16,.25,.02,.025,b.s.polymer);for(const x of[.06,w-.1]){b.b(x,.40,.425,.04,.045,.065,b.s.trim);b.b(x+.005,.425,.415,.025,.02,.02,b.s.bronze);}});
});
add(53,[.78,.55,1.64],'浴缸：真实深盆、厚石口沿、外侧分板、排水篦、侧控座和后端软靠',(b,w,h,d)=>{
 b.part('外壳、内盆与厚唇',()=>{b.rounded(0,0,0,w,h,d,.06,b.s.metal);b.rounded(.02,.04,.02,w-.04,h-.04,d-.04,.045,b.s.wall);b.rounded(.065,.1,.09,w-.13,h,d-.18,.04,0);for(const x of[.01,w-.05])b.b(x,h-.045,.045,.04,.045,d-.09,b.s.wall);for(const z of[.02,d-.06])b.b(.04,h-.045,z,w-.08,.045,.04,b.s.wall);});
 b.part('侧裙板、下包框与四脚套',()=>{for(const x of[0,w-.02]){b.b(x,.06,.06,.02,.025,d-.12,b.s.trim);for(let z=.11;z<d-.06;z+=.28)b.b(x,.105,z,.02,.30,.245,b.s.trim);}for(const x of[.02,w-.08])for(const z of[.03,d-.09])b.b(x,0,z,.06,.065,.06,b.s.trim);});
 b.part('出水嘴、排水口、检修饰框及软靠',()=>{faucet(b,.12,h-.02,d-.065);for(const x of[.34,.44])b.b(x,h-.025,d-.08,.04,.045,.04,b.s.bronze);b.b(.26,h-.035,.05,.27,.09,.13,b.s.rubber);b.cylinder(w/2,.09,d-.27,.035,.015,b.s.metal,.02);for(const z of[.16,d-.28])control(b,w-.02,.28,z,.06,.14);});
},{limits:'不生成固定水面和水柱；浴缸内腔深度可直接查询，尚无用水状态动画。'});
add(54,[.9,1.9,.075],'淋浴隔屏：细框玻璃、低门槛、上下导轨、两只铰座与真实把手间隙',(b,w,h,d)=>{
 b.part('四边承框、双导轨与角鞍',()=>{frame(b,0,0,0,w,h,d,.04,b.s.metal);locks(b,0,0,-.02,w,h,.07);b.b(.07,.04,-.01,w-.14,.02,.02,b.s.trim);b.b(.07,h-.06,-.01,w-.14,.02,.02,b.s.trim);});
 b.part('内退玻璃和压条',()=>{b.b(.05,.055,.03,w-.10,h-.11,.02,b.s.glass);frame(b,.045,.045,.015,w-.09,h-.09,.02,.015,b.s.bronze);b.hui(w-.24,h-.36,.02,.16,.18,b.s.glassEtch,.01);});
 b.part('把手支座与控制边盒',()=>{for(const y of[.75,1.06])b.b(w-.16,y,-.055,.025,.03,.095,b.s.metal);b.b(w-.16,.76,-.065,.025,.33,.025,b.s.wood);control(b,0,.96,-.045,.06,.3);});
},{mount:'insert',limits:'玻璃为透明材质 ID；纯色检查中按实色显示。静态门体尚无滑动约束。'});
add(55,[.6,.8,.08],'壁镜：内退镜芯、双侧灯槽、三层压框、下托台、角榫与控制钮',(b,w,h,d)=>{
 b.part('背壳、镜芯与三层框口',()=>{b.b(.025,.02,.045,w-.05,h-.04,.035,b.s.wood);frame(b,0,0,0,w,h,.055,.04,b.s.metal);frame(b,.06,.065,.005,w-.12,h-.13,.045,.01,b.s.energy);b.b(.075,.08,.025,w-.15,h-.16,.035,b.s.glass);locks(b,0,0,-.02,w,h,.065);});
 b.part('双侧灯槽、下托和独立开关',()=>{for(const x of[.025,w-.045]){b.b(x,.115,-.015,.025,h-.23,.025,b.s.bronze);b.b(x+.005,.13,-.025,.015,h-.26,.015,b.s.warm);}b.b(.07,.02,-.10,w-.14,.025,.16,b.s.trim);for(const x of[w-.16,w-.115])b.b(x,.105,.01,.025,.025,.015,b.s.metal);});
},{mount:'wall',limits:'没有实际镜像反射；色块、镜框和灯槽可以验模，但不冒充镜面渲染已实现。'});
add(56,[.34,.38,.28],'给排水节点：三通真实空腔、分体法兰、圈口、螺栓、手轮和杠杆阀',(b,w,h,d)=>{
 b.part('竖向空心主管与水平三通',()=>{tube(b,[.17,0,.14],h,.055,.03,1,b.s.metal);tube(b,[0,.15,.14],w,.045,.025,0,b.s.metal);for(const y of[.04,.3])tube(b,[.17,y,.14],.04,.075,.03,1,b.s.bronze);for(const x of[.025,.265])tube(b,[x,.15,.14],.04,.065,.025,0,b.s.bronze);tube(b,[.17,0,.14],h,.03,0,1,0);tube(b,[0,.15,.14],w,.025,0,0,0);});
 b.part('法兰螺栓和接口加厚唇',()=>{for(const y of[.04,.3])for(let i=0;i<8;i++){const a=i*Math.PI/4;b.b(.17+Math.cos(a)*.063-.008,y+.035,.14+Math.sin(a)*.063-.008,.016,.015,.016,b.s.trim);}for(const x of[0,w-.025])tube(b,[x,.15,.14],.025,.05,.025,0,b.s.trim);});
 b.part('手轮阀与杠杆阀的静态驱动件',()=>{for(const x of[.07,.27])b.b(x-.015,.18,.125,.03,.08,.03,b.s.trim);b.cylinder(.07,.26,.14,.045,.015,b.s.bronze,.03);for(const dx of[-.035,0])b.b(.07+dx,.26,.135,.04,.015,.01,b.s.metal);b.b(.065,.26,.10,.01,.015,.08,b.s.metal);b.b(.25,.265,.125,.08,.02,.03,b.s.metalTeal);b.b(.26,.255,.13,.03,.035,.02,b.s.bronze);});
},{mount:'insert',limits:'主管和支管贯通；阀门位置为静态示意，没有流体模拟或联动动画。'});
add(57,[.55,.4,.1],'毛巾挂架：双墙板、伸臂、方木横杆、两块折挂布片与织入回纹',(b,w,h,d)=>{
 b.part('墙板、销钉、伸臂与横杆',()=>{for(const x of[0,w-.055]){b.b(x,h-.13,d-.035,.055,.13,.035,b.s.metal);b.b(x+.015,h-.075,.01,.025,.03,d-.02,b.s.wood);for(const y of[h-.12,h-.04])b.b(x+.015,y,d-.045,.025,.02,.015,b.s.bronze);}b.b(.02,h-.07,0,w-.04,.035,.035,b.s.wood);});
 b.part('长短毛巾、折边与织入回纹',()=>{for(const [x,hh,m]of[[.08,.33,b.s.cottonWhite],[.32,.25,b.s.fabric]]){const y=h-.07-hh;b.b(x,y,-.01,.15,hh,.015,m);b.b(x,y+.03,.035,.15,hh-.03,.015,m);b.b(x,h-.07,-.01,.15,.015,.06,m);for(const yy of[y+.025,y+.085])b.b(x,yy,-.02,.15,.015,.01,b.s.fabricEdge);b.hui(x+.035,y+.04,-.02,.08,.07,b.s.wovenLight,.01);}});
},{mount:'wall',limits:'两块挂布为静态薄壳，没有布料解算。'});
add(64,[1.6,1.02,.64],'售货柜台：左木柜、右双层玻璃展示腔、厚面板、端灯槽与后端抽屉',(b,w,h,d)=>{
 b.cabinet(w,h-.08,d,1,1,false);b.part('左柜门、分隔与右双层展示腔',()=>{b.b(w*.38,.13,.01,.04,h-.25,d-.03,b.s.wood);door(b,.07,.16,-.025,w*.38-.095,h-.34);b.b(w*.41,.43,.03,w*.59-.05,.025,d-.06,b.s.wood);for(const x of[w*.42,w*.71]){frame(b,x,.13,-.015,w*.28,.71,.055,.025,b.s.metal);b.b(x+.025,.175,0,w*.28-.05,.64,.015,b.s.glass);}b.b(.13,.18,d-.025,.36,.4,.03,b.s.wood);pull(b,.24,.4,d,.13,.04);});
 b.part('台面、收银设备走线口与两侧灯槽',()=>{b.slab(-.025,h-.08,-.02,w+.05,.08,d+.04);b.b(w*.58,h-.08,d-.11,.12,.08,.045,0);for(const x of[.015,w-.065]){b.b(x,.22,-.035,.05,.59,.035,b.s.bronze);b.b(x+.015,.25,-.045,.02,.53,.02,b.s.warm);}});
},{limits:'展示库存、称重台和收银终端属于其他资产，不焊入柜台；玻璃柜内保持空腔。'});

registerMarketRecipes(add);
registerWorkshopRecipes(add);
registerCommerceRecipes(add);
registerResearchRecipes(add);
registerCivicRecipes(add);
registerPublicServiceRecipes(add);
registerCultureRecipes(add);
registerFestivalRecipes(add);
registerDomesticRecipes(add);
export function atlasSource(id:string){return(links as Record<string,{sheet:string;slot:number;imageSHA256:string}>)[id];}
export function finishAtlasMetadata(a:Asset,recipe:AtlasRecipe,roles:Record<string,number>){
 const bounds=a.parts[0].region,min=bounds.min.map(v=>v*a.cellSize),max=bounds.max.map(v=>v*a.cellSize);
 if(recipe.mount==='wall')a.ports=[{id:'wall-mount',kind:'wall-mount',position:[(min[0]+max[0])/2,(min[1]+max[1])/2,max[2]],normal:[0,0,1],size:[max[0]-min[0],max[1]-min[1],0],pitch:a.cellSize}];
 if(recipe.mount==='ceiling')a.ports=[{id:'ceiling-mount',kind:'ceiling-mount',position:[(min[0]+max[0])/2,max[1],(min[2]+max[2])/2],normal:[0,1,0],size:[max[0]-min[0],0,max[2]-min[2]],pitch:a.cellSize}];
 const n=Number(String(a.source?.catalogId).slice(5)),[w,h,d]=recipe.size,box=(lo:V3,hi:V3)=>({min:lo.map(v=>Math.round(v/a.cellSize)) as V3,max:hi.map(v=>Math.round(v/a.cellSize)) as V3});
 if(n===38){a.openings=[box([.10,0,.155],[.56,.06,.505]),box([.70,0,.155],[1.13,.06,.505])];for(const [id,x,ww]of[['sink',.10,.46],['hob',.70,.43]] as const)a.ports.push({id:id+'-cutout',kind:'counter-cutout',position:[x,0,.155],normal:[0,1,0],size:[ww,0,.35],pitch:a.cellSize});}
 if(n===40||n===51)a.openings=[box([.08,.06,.08],[w-.08,h,d-.15])];
 if(n===53)a.openings=[box([.10,.15,.17],[w-.10,h-.05,d-.30])];
 if(n===56){a.openings=[box([.15,0,.13],[.19,.38,.15])];a.ports=[{id:'pipe-bottom',kind:'water-pipe-60',position:[.17,0,.14],normal:[0,-1,0],size:[.06,0,.06],pitch:.01},{id:'pipe-top',kind:'water-pipe-60',position:[.17,.38,.14],normal:[0,1,0],size:[.06,0,.06],pitch:.01},{id:'pipe-left',kind:'water-pipe-50',position:[0,.15,.14],normal:[-1,0,0],size:[0,.05,.05],pitch:.01},{id:'pipe-right',kind:'water-pipe-50',position:[.34,.15,.14],normal:[1,0,0],size:[0,.05,.05],pitch:.01}];}
 if(n===75)a.openings=[box([.15,.05,0],[.51,.12,d]),box([.69,.05,0],[1.05,.12,d]),box([0,.05,.15],[w,.12,.31]),box([0,.05,.49],[w,.12,.65])];
 if(n===78)a.ports.push(...([['input',0,-1],['output',w,1]] as const).map(([id,x,sign])=>({id,kind:'conveyor-600',position:[x,.70,.30] as V3,normal:[sign,0,0] as V3,size:[0,.02,.46] as V3,pitch:.01})));
 if(n===79)a.openings=[box([.16,.17,.07],[w-.16,.54,.13])];
 if(n===82)a.openings=[box([.26,.35,.16],[w-.26,1.20,d-.13])];
 if(n===86)a.openings=[box([.075,.10,.075],[w-.075,h,d-.075])];
 if(n===87)a.openings=[box([.09,.14,.49],[.57,.62,.68]),box([.54,.10,.06],[.96,.30,.26])];
 if(n===88)a.openings=[box([.09,.10,.09],[w-.09,.48,d-.09])];
 if(n===95)a.openings=[box([.06,.06,.06],[w-.06,.34,d-.06])];
 if(n===109)a.openings=[box([.12,.22,.18],[w-.12,.80,d-.08])];
 if(n===111)a.openings=[box([.13,.10,.62],[.63,.52,.97])];
 if(n===112)a.openings=[box([.51,.16,.10],[w-.51,.70,.59]),box([1.20,.68,.30],[1.49,.93,.57])];
 if(n===113)a.openings=[box([.30,.40,.40],[.70,.78,.58])];
 if(n===114)a.openings=[box([.19,.20,.155],[.21,.31,.175])];
 if(n===115)a.openings=[box([.065,.05,.11],[.165,.25,.21]),box([.270,.02,.215],[.30,.165,.245]),box([.385,.02,.22],[.405,.095,.24]),box([.295,.01,.035],[.365,.03,.105])];
 if(n===117)a.openings=[box([.46,.12,.13],[1.20,.57,.66])];
 if(n===118)a.openings=[box([.14,.24,.10],[.64,.31,.55])];
 if(n===120){a.openings=[box([.05,-.03,0],[.12,0,.06]),box([w-.15,-.03,0],[w-.08,0,.06])];for(const [id,x]of[['clamp-a',.10],['clamp-b',w-.10]] as const)a.ports.push({id,kind:'bed-rail-clamp-80',position:[x,-.01,.07],normal:[0,0,1],size:[.08,.05,0],pitch:a.cellSize});}
 if(n===122){a.openings=[box([.58,.78,1.62],[1.18,1.28,2.22])];a.ports.push({id:'patient-entry',kind:'scanner-entry',position:[.88,.72,.06],normal:[0,0,-1],size:[.62,.58,0],pitch:a.cellSize});}
 if(n===123)a.openings=[box([.12,.92,-.13],[.28,1.00,-.03])];
 if(n===124)a.openings=[box([.05,1.67,.27],[.08,1.71,.29])];
 if(n===125)a.openings=[box([.22,.675,-.025],[.50,.705,.005]),box([.22,.675,1.965],[.50,.705,1.99])];
 if(n===126){a.openings=[box([0,0,.24],[w,1.12,.98])];a.ports.push({id:'walking-space',kind:'clear-walkway',position:[0,0,.61],normal:[-1,0,0],size:[0,1.10,.74],pitch:a.cellSize});}
 if(n===127)a.openings=[box([.27,.735,.24],[.79,.93,.51]),box([.51,.635,.36],[.53,.73,.38])];
 if(n===140)a.openings=[box([.30,.01,.01],[1.60,.40,.29])];
 if(n===141)a.openings=[box([.30,.10,.12],[1.90,.60,.88]),box([.82,.72,.46],[1.26,.78,.50])];
 if(n===142)a.openings=[box([.19,.20,.14],[.71,.53,.50]),box([.19,.62,.14],[.71,.94,.50])];
 if(n===143)a.openings=[box([.13,.64,.09],[.28,.84,.12]),box([.15,.21,.15],[.59,.68,.39])];
 if(n===144)a.openings=[box([.10,.98,.03],[.53,1.025,.35])];
 if(n===145)a.openings=[box([.065,.055,.065],[.595,.32,.355]),box([.255,.395,.195],[.410,.430,.225])];
 if(n===146)a.openings=[box([.15,.16,-.30],[1.01,1.70,.02])];
 if(n===147)a.openings=[box([.12,.20,.12],[.49,.65,.44]),box([.65,.20,.12],[1.02,.65,.44]),box([.40,.24,.48],[.54,.34,.52])];
 if(n===148)a.openings=[box([.24,.83,.20],[.25,.85,.23])];
 if(n===149)a.openings=[box([.58,.12,.10],[1.48,.62,.60]),box([1.89,.82,.21],[1.96,.83,.42])];
 if(n===150)a.openings=[box([.11,.19,.095],[.51,.55,.38])];
 if(n===151)a.openings=[box([.30,.24,.11],[1.00,.64,.60])];
 if(n===152)a.openings=[box([.105,.75,.08],[.405,.88,.43])];
 if(n===153)a.openings=[box([.25,.10,.14],[2.12,.64,.65])];
 if(n===154)a.openings=[box([.14,.05,.15],[.54,.28,.48])];
 if(n===155)a.openings=[box([.20,.20,.12],[.79,.61,.58])];
 if(n===156)a.openings=[box([.50,.68,.16],[1.32,1.32,.74]),box([.54,1.64,.16],[1.35,1.90,.74]),box([1.56,.24,-.04],[1.90,.36,-.02])];
 if(n===157)a.openings=[box([.13,1.20,.08],[.69,1.40,.33])];
 if(n===158)a.openings=[box([.08,.36,.055],[.24,.41,.265]),box([.08,.225,.385],[.24,.30,.56])];
 if(n===159)a.openings=[box([.15,1.28,.12],[.46,1.51,.30])];
 if(n===169)a.openings=[box([.18,.65,.13],[.22,1.25,.17])];
 if(n===170)a.openings=[box([.23,.28,.06],[.38,.48,.12])];
 if(n===171)a.openings=[box([.60,.075,.10],[.71,.09,.15])];
 if(n===172)a.openings=[box([.33,.91,.45],[.75,.92,.50])];
 if(n===173)a.openings=[box([.14,.20,.22],[.25,.60,.40])];
 if(n===174)a.openings=[box([.25,.72,.12],[.40,.76,.15])];
 if(n===175)a.openings=[box([.45,.75,.20],[.60,.95,.40])];
 if(n===176){a.openings=[box([.30,.02,.40],[.80,.10,.90])];for(const [id,x,sign]of[['join-left',0,-1],['join-right',w,1]] as const)a.ports.push({id,kind:'stage-1600',position:[x,.34,.80],normal:[sign,0,0],size:[0,.08,1.60],pitch:.02});}
 if(n===177)a.openings=[box([.94,1.08,.22],[.96,1.10,.40])];
 if(n===178){a.openings=[box([.20,.27,.13],[1.35,.65,.45])];a.ports.push({id:'tabletop',kind:'desktop',position:[0,.98,0],normal:[0,1,0],size:[w,0,d],pitch:a.cellSize});}
 if(n===179)a.openings=[box([.46,.20,.14],[.48,.30,.17])];
 if(n===180)a.openings=[box([.22,.65,.21],[.80,.90,.47])];
 if(n===181)a.openings=[box([.20,.045,.10],[.46,.055,.25])];
 if(n===182)a.openings=[box([.215,.96,.21],[.255,1.02,.25]),box([1.19,1.13,.19],[1.20,1.15,.23])];
 if(n===183)a.openings=[box([.50,.68,.20],[1.40,1.20,1.12])];
 if(n===184)a.openings=[box([.25,.12,.15],[.79,.53,.87])];
 if(n===185)a.openings=[box([.29,1.49,.08],[.30,1.55,.10])];
 if(n===186)a.openings=[box([.28,.20,.20],[.44,1.49,.52])];
 if(n===187)a.openings=[box([.49,.12,.13],[1.31,.30,.60])];
 if(n===188)a.openings=[box([.14,.565,.115],[.69,.70,.63])];
 if(n===189)a.openings=[box([.30,.62,.30],[2.04,.88,.85])];
 if(n===190)a.openings=[box([.285,.18,.16],[.33,.30,.34])];
 if(n===191)a.openings=[box([.57,.10,.095],[.59,.12,.115])];
 if(n===192)a.openings=[box([.14,.15,.08],[.20,.17,.12]),box([.17,.15,.26],[.28,.22,.34])];
 if(n===193){a.openings=[box([.50,.17,.16],[1.20,.65,.52])];a.ports.push({id:'desktop',kind:'desktop',position:[0,1.04,0],normal:[0,1,0],size:[1.8,0,.64],pitch:a.cellSize});}
 if(n===194)a.openings=[box([.15,.29,.13],[.75,.39,.48])];
 if(n===195)a.openings=[box([.47,.25,.11],[.70,.29,.34])];
 if(n===196)a.openings=[box([.17,1.11,.405],[.27,1.17,.43])];
 if(n===197)a.openings=[box([.20,.04,.20],[1.40,.18,.49])];
 if(n===198)a.openings=[box([.25,.40,.10],[.41,.52,.44])];
 if(n===199)a.openings=[box([.15,.17,.12],[.75,.65,.40])];
 if(n===200)a.openings=[box([.08,.08,.20],[.39,.43,.46]),box([.57,.06,.08],[.75,.26,.25])];
 if(n===227){a.openings=[box([.12,.40,.08],[1.26,.52,.10]),box([.31,.065,.19],[.35,.38,.23])];a.ports.push({id:'wall-mount',kind:'wall-mount',position:[.70,.36,.50],normal:[0,0,1],size:[1.4,.40,0],pitch:.01},{id:'soil-surface',kind:'planter-soil',position:[.08,.38,.07],normal:[0,1,0],size:[1.24,0,.30],pitch:.01});}

 if([149,151,155].includes(n))a.ports.push({id:'desktop-support',kind:'desktop',position:[0,n===149?.79:n===151?.80:.78,0],normal:[0,1,0],size:[w,0,d],pitch:a.cellSize});
 for(const port of a.ports)port.position=port.position.map(v=>Math.round(v/a.cellSize)*a.cellSize) as V3;
 const materialAssignmentReview=inspectAtlasMaterialAssignments(n,a,roles);
 a.source={...a.source,recipeRevision:3,reference:atlasSource(String(a.source?.catalogId)),dimensionBasis:'authored metres; no dimensions recoverable from a single independently scaled image tile',limitations:recipe.limits,kinematics:'static; no rig or runtime motion',referenceStage:'candidate',...(materialAssignmentReview?{materialAssignmentReview}:{})};return a;
}
