import {Shapes} from './shapes';
import {Grid} from '../core/grid';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

// M013 uses metre dimensions, with every construction rasterised to 20 mm.
// These are authored structural candidates, not a claimed FloorPlan integration.
const solidPanel=(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number)=>{
 b.b(x,y,z+.02,w,h,Math.max(.02,d-.02),b.s.mortar);
 for(let yy=0;yy<h-.001;yy+=.32)for(let xx=0;xx<w-.001;xx+=.48)
  b.b(x+xx+.02,y+yy+.02,z,Math.min(.44,w-xx-.02),Math.min(.28,h-yy-.02),d-.02,b.s.wall);
};
function floor(b:Shapes,x:number,y:number,z:number,w:number,d:number,thickness=.20){
 b.b(x,y,z,w,thickness-.04,d,b.s.structuralConcrete);
 for(let xx=0;xx<w;xx+=.40)for(let zz=0;zz<d;zz+=.40)
  b.b(x+xx+.02,y+thickness-.04,z+zz+.02,Math.min(.38,w-xx-.02),.04,Math.min(.38,d-zz-.02),b.s.wall);
 for(const zz of[z,z+d-.04])b.b(x,y,zz,w,.10,.04,b.s.metal);
 for(const xx of[x,x+w-.04])b.b(xx,y,z,.04,.10,d,b.s.metal);
}
function column(b:Shapes,x:number,z:number,height:number,wide=.24){
 b.b(x,0,z,wide,.14,wide,b.s.stone);
 b.b(x+.02,.14,z+.02,wide-.04,height-.28,wide-.04,b.s.wood);
 for(const y of[.14,height-.16])b.b(x,y,z,wide,.10,wide,b.s.metal);
 b.b(x+.06,height-.06,z+.06,wide-.12,.06,wide-.12,b.s.bronze);
}
function railPost(b:Shapes,x:number,y:number,z:number){
 b.b(x-.10,y-.02,z-.10,.20,.12,.20,b.s.metal);
 b.b(x-.06,y+.10,z-.06,.12,.80,.12,b.s.wood);
 b.b(x-.10,y+.90,z-.10,.20,.10,.20,b.s.metal);
 b.b(x-.06,y+1.00,z-.06,.12,.04,.12,b.s.bronze);
 b.b(x-.03,y+.23,z-.08,.06,.46,.02,b.s.warm);
}
function railing(b:Shapes,a:V3,c:V3,posts=true){
 if(posts){railPost(b,...a);railPost(b,...c);}
 b.beam([a[0],a[1]+.87,a[2]],[c[0],c[1]+.87,c[2]],.10,b.s.wood);
 b.beam([a[0],a[1]+.30,a[2]],[c[0],c[1]+.30,c[2]],.06,b.s.metal);
 const n=Math.max(1,Math.round(Math.hypot(c[0]-a[0],c[2]-a[2])/.28));
 for(let i=1;i<n;i++){const t=i/n,x=a[0]+t*(c[0]-a[0]),y=a[1]+t*(c[1]-a[1]),z=a[2]+t*(c[2]-a[2]);b.b(x-.02,y+.31,z-.02,.04,.56,.04,b.s.wood);}
}
function reverseInFootprint(b:Shapes,w:number,d:number,draw:(q:Shapes)=>void){
 const q=new Shapes(b.pitch,b.s);draw(q);const nx=b.index(w),nz=b.index(d);
 for(const[v,m]of q.g.cells())b.g.set([nx-v[0]-1,v[1],nz-v[2]-1],m);
 for(const part of q.parts)b.parts.push({...part,id:'part-'+b.parts.length,region:{min:[nx-part.region.max[0],part.region.min[1],nz-part.region.max[2]],max:[nx-part.region.min[0],part.region.max[1],nz-part.region.min[2]]}});
}
function flight(b:Shapes,w:number){
 b.part('石质底顶平台和金属端鞍',()=>{floor(b,0,0,0,w,.4);floor(b,0,1.6,3.6,w,.8);});
 b.part('八级石踏面、真实踢面与两侧木梯梁',()=>{
  for(let i=0;i<8;i++){const z=.4+i*.4,top=.4+i*.2;b.b(0,top-.08,z,w,.08,.40,b.s.wall);b.b(0,top-.20,z,w,.12,.06,b.s.stone);b.b(.16,top-.02,z+.04,w-.32,.02,.02,b.s.mortar);}
  for(const x of[.12,w-.12])b.beam([x,.12,.18],[x,1.72,3.62],.16,b.s.wood);
 });
 b.part('顶台承柱和横枨',()=>{for(const x of[.04,w-.24])column(b,x,4.12,1.60,.20);b.b(.12,1.46,4.14,w-.24,.10,.10,b.s.wood);});
 b.part('双侧连续扶手、竖梃与独立暖光芯',()=>{
  for(const x of[.12,w-.12]){railing(b,[x,.20,.14],[x,1.80,3.70]);railing(b,[x,1.80,3.70],[x,1.80,4.28]);}
 });
}
function portal(b:Shapes,w:number,courtyard:boolean){
 const opening=courtyard?1.60:1.80,left=(w-opening)/2;
 b.part('石基和内外连续门槛',()=>{floor(b,0,0,0,w,.80);b.b(left,.16,-.20,opening,.04,.24,b.s.wall);});
 b.part('砌块墙垛、深木门柱与金属套脚',()=>{
  for(const x of[0,w-left])solidPanel(b,x,.20,.24,left,2.56,.24);
  for(const x of[left-.10,left+opening]){b.b(x,.20,.20,.10,2.42,.34,b.s.wood);b.b(x-.02,.20,.18,.14,.22,.38,b.s.metal);}
  for(const x of[.04,w-.36]){b.b(x,.20,.18,.32,.22,.40,b.s.stone);b.b(x+.04,.42,.22,.24,2.16,.30,b.s.wall);for(const y of[.46,2.54])b.b(x-.02,y,.16,.36,.10,.42,b.s.metal);}
 });
 b.part('门楣、压顶与分层铜连接',()=>{
  b.b(0,2.74,.18,w,.24,.36,b.s.metal);b.b(.10,2.90,.20,w-.20,.10,.32,b.s.wall);
  b.b(left-.10,2.54,.20,opening+.20,.18,.32,b.s.wood);b.b(left,2.56,.18,opening,.06,.02,b.s.woodEdge);
  for(const x of[.08,w-.20])b.b(x,2.78,.14,.12,.12,.06,b.s.bronze);
  if(courtyard){b.b(w/2-.16,2.56,.14,.32,.14,.04,b.s.metal);b.hui(w/2-.12,2.58,.12,.24,.10,b.s.bronze,.02);}
 });
 b.part('固定开启门扇、真实板框与穿透通道',()=>{
  for(const x of[left-.02,left+opening-.06]){b.b(x,.22,.48,.08,2.24,.72,b.s.wood);b.b(x,.36,.56,.08,1.96,.04,b.s.woodEdge);for(const z of[.48,1.14])b.b(x-.02,.26,z,.12,2.18,.06,b.s.woodEdge);for(const y of[.30,2.30])b.b(x-.02,y,.50,.12,.08,.70,b.s.woodEdge);for(const y of[.56,1.84])b.b(x-.02,y,.44,.12,.12,.08,b.s.bronze);}
 });
 b.part('壁灯架、灯芯和柱脚铆接件',()=>{
  for(const x of[.19,w-.25]){b.b(x-.04,.70,.12,.16,1.18,.10,b.s.metal);b.b(x-.02,.74,.08,.12,1.10,.06,b.s.bronze);b.b(x,.80,.06,.08,.96,.04,b.s.warm);b.b(x-.02,2.35,.12,.12,.12,.12,b.s.bronze);}
 });
}

export const structureRecipes:Record<string,AtlasRecipe>={
 'BUILT-008':{size:[1.6,2.84,4.4],pitch:.02,features:'回行单跑：1.6m 跑道、八级 0.2/0.4m 石踏步、连续扶手与反向出口',limits:'仅回行一跑，参考图中的另一跑及半转平台由独立组件拼装。已保留真实离散踏步，没有代替游戏的 StairSurface、角色控制或寻路。',draw:(b,w)=>reverseInFootprint(b,w,4.4,q=>flight(q,w))},
 'BUILT-009':{size:[3.6,2.84,1.6],pitch:.02,features:'半转平台：双 1.6m 接口、中央梯井缺口、石铺面、木柱与侧后扶手',limits:'独立半转平台；中间 0.4m 梯井保留，两个同侧接口分别接上行和回行。支撑仅作几何接触校验，未作荷载计算。',draw:(b,w,h,d)=>{
  b.part('U 形实际承板、石面与梯井缺口',()=>{floor(b,0,1.6,0,w,d);b.b(1.6,1.6,0,.40,.20,.60,0);});
  b.part('四根承柱、石足与平台下承梁',()=>{for(const x of[.04,w-.24])for(const z of[.04,d-.24])column(b,x,z,1.60,.20);b.b(.12,1.46,d-.16,w-.24,.14,.12,b.s.wood);for(const x of[.12,2.0])b.b(x,1.46,.04,1.48,.14,.12,b.s.wood);});
  b.part('后边、侧边护栏及梯井护边',()=>{railing(b,[.12,1.8,.12],[.12,1.8,d-.12]);railing(b,[w-.12,1.8,.12],[w-.12,1.8,d-.12]);railing(b,[.12,1.8,d-.12],[w-.12,1.8,d-.12]);b.b(1.60,1.6,.60,.40,.08,.04,b.s.metal);});
 }},
 'BUILT-010':{size:[1.6,.40,1.2],pitch:.02,features:'奇数级差低接台：0.2m 补高、前后标高接口、石踏面与真实踢面',limits:'仅提供一个 0.2m 补高段；必须由楼层数据选择使用。未接入 FloorPlan 条件或自动判断级数。',draw:(b,w,h,d)=>{
  b.part('低台和补高平台',()=>{floor(b,0,0,0,w,d);floor(b,0,.20,.40,w,d-.40);});
  b.part('边鞍、分层石收边和防滑线',()=>{for(const x of[0,w-.14])for(const z of[0,d-.14]){const y=z<.3?.12:.32;b.b(x,y,z,.14,.08,.14,b.s.metal);b.b(x+.04,y+.06,z+.04,.06,.02,.06,b.s.bronze);}b.b(.18,.18,.08,w-.36,.02,.02,b.s.mortar);b.b(.18,.38,.48,w-.36,.02,.02,b.s.mortar);});
  b.part('内嵌暖色照明槽',()=>{b.b(.54,.05,0,.52,.10,.04,b.s.metal);b.b(.60,.07,0,.40,.06,.02,b.s.warm);});
 }},
 'BUILT-011':{size:[4,1.86,3.2],pitch:.02,features:'双坡屋面：真实瓦垄、重叠瓦口、端山墙、可接屋脊与檐下椽梁',limits:'独立屋面与封闭山墙端，保留空屋腔；不是整幢建筑。瓦曲线以阶梯格表达，未接入 RoofRegion、屋顶行走或雨水模拟。',draw:(b,w,h,d)=>{
  b.part('底封板、檐枋及独立檐下椽条',()=>{b.b(.14,.10,.14,w-.28,.04,d-.28,b.s.wood);for(const z of[.06,d-.18])b.b(.08,.04,z,w-.16,.14,.12,b.s.wood);for(let x=.16;x<w-.1;x+=.28){b.b(x,0,.04,.08,.18,.34,b.s.wood);b.b(x,0,d-.38,.08,.18,.34,b.s.wood);}});
  b.part('薄木屋壳、防水膜与两面实际坡度',()=>{for(let i=0;i<80;i++){const z=i*.04,y=.22+Math.floor((i<40?i:79-i)/5)*.18;b.b(.04,y-.14,z,w-.08,.20,.04,b.s.wood);b.b(.04,y+.06,z,w-.08,.02,.04,b.s.waterproofMembrane);}});
  b.part('阶梯瓦垄、逐片瓦口和檐口',()=>{for(let x=.06;x<w-.05;x+=.24)for(let i=0;i<8;i++)for(const sign of[0,1]){const z=sign?d-(i+1)*.20:i*.20,y=.30+i*.18;b.b(x,y,z,Math.min(.22,w-.04-x),.06,.20,b.s.roof);b.b(x,y-.14,z+(sign?.18:0),Math.min(.22,w-.04-x),.14,.02,b.s.roof);for(const offset of[.02,.16])if(x+offset+.04<=w-.02)b.b(x+offset,y+.04,z+.04,.04,.04,.14,b.s.roof);b.b(x,y,z+(sign?.16:0),Math.min(.22,w-.04-x),.04,.04,b.s.roof);}});
  b.part('两端封闭山墙、砖缝与踏步封檐',()=>{for(const x of[.14,w-.26])for(let i=0;i<39;i++){const z=.04+i*.08,hh=.20+Math.min(z,d-z-.08)*.9;b.b(x,.14,z,.12,hh,.08,b.s.wall);if(i%4===0)b.b(x,.14,z,.02,hh,.02,b.s.mortar);b.b(x-.04,.14+hh,z,.20,.06,.08,b.s.roof);}});
  b.part('连续屋脊、金属脊鞍与檐下电灯',()=>{for(let x=.04;x<w-.02;x+=.28){b.b(x,1.60,1.45,Math.min(.26,w-.02-x),.20,.30,b.s.roof);b.b(x+.02,1.78,1.48,Math.min(.22,w-.04-x),.08,.24,b.s.roof);}for(const x of[.04,w-.20]){b.b(x,1.62,1.44,.16,.20,.32,b.s.metal);b.b(x+.04,1.80,1.50,.08,.06,.20,b.s.bronze);}for(const z of[.06,d-.14])for(let x=.32;x<w-.2;x+=.56){b.b(x,.06,z,.14,.14,.08,b.s.metal);b.b(x+.02,.08,z-.02,.10,.08,.02,b.s.warm);}});
 }},
 'BUILT-012':{size:[4,.20,1.8],pitch:.02,features:'回廊平檐顶：层叠封边、薄木檩架、金属泛水、防水膜与柱头承位',limits:'母版只含檐顶，柱子另行拼装；放置 Y=2.6m 时顶面为 2.8m。没有复制参考图中的四根独立柱。',draw:(b,w,h,d)=>{
  b.part('下椽、两道承枋与柱头鞍座',()=>{for(const z of[.10,d-.22])b.b(.10,0,z,w-.20,.08,.12,b.s.wood);for(let x=.14;x<w-.1;x+=.32)b.b(x,0,.08,.08,.10,d-.16,b.s.wood);for(const x of[.02,w-.18])for(const z of[.02,d-.18]){b.b(x,0,z,.16,.14,.16,b.s.metal);b.b(x+.04,.12,z+.04,.08,.06,.08,b.s.bronze);}});
  b.part('封板、防水膜、平瓦与独立折水边',()=>{b.b(.04,.08,.04,w-.08,.04,d-.08,b.s.wood);b.b(.04,.12,.04,w-.08,.02,d-.08,b.s.waterproofMembrane);for(let x=.10;x<w-.1;x+=.40)for(let z=.10;z<d-.1;z+=.40)b.b(x,.14,z,Math.min(.38,w-.10-x),.04,Math.min(.38,d-.10-z),b.s.roof);for(const z of[0,d-.06])b.b(0,.10,z,w,.10,.06,b.s.metal);for(const x of[0,w-.06])b.b(x,.10,0,.06,.10,d,b.s.metal);});
  b.part('木封边、铜角与下檐灯芯',()=>{for(const z of[.02,d-.04])b.b(.18,.04,z,w-.36,.06,.02,b.s.woodEdge);for(const x of[.28,w-.44]){b.b(x,.04,0,.16,.06,.02,b.s.warm);b.b(x,.04,d-.02,.16,.06,.02,b.s.warm);}});
 }},
 'BUILT-013':{size:[4,.20,.20],pitch:.02,features:'0.2m 防水补边：单列瓦、橡胶膜、金属承槽、折水线与齐平接头',limits:'总宽固定为 0.2m，是屋面补边而非完整屋面。可接本批平檐边；坡屋面的任意边坡匹配仍未实现。',draw:(b,w,h,d)=>{
  b.part('金属承槽和连续防水膜',()=>{b.b(0,0,0,w,.08,d,b.s.metal);b.b(.06,.08,.02,w-.12,.02,d-.04,b.s.waterproofMembrane);b.b(0,.10,d-.04,w,.10,.04,b.s.metal);});
  b.part('单列分片瓦及前折水唇',()=>{for(let x=.10;x<w-.1;x+=.28){b.b(x,.10,.04,Math.min(.26,w-.10-x),.06,.10,b.s.roof);b.b(x,.14,.04,Math.min(.26,w-.10-x),.02,.02,b.s.roof);}b.b(.12,.08,0,w-.24,.02,.04,b.s.metalBright);});
  b.part('两端铜锁片和收口',()=>{for(const x of[0,w-.10]){b.b(x,.08,0,.10,.12,d,b.s.metal);b.b(x+.02,.16,.04,.06,.04,.12,b.s.bronze);}});
 }},
 'BUILT-014':{size:[4.4,6.4,7.6],pitch:.02,features:'两层服务翼剖面：真实梯井空洞、前接台、后墙、石柱、木梁与入口',limits:'独立服务翼壳体，楼梯和半转平台从各自母版实例化；剖面保留开放侧供检查。作者尺寸，不改动原游戏楼层、用途、权限或旧档。',draw:(b,w,h,d)=>{
  b.part('周边基础、前厅铺面和上层前接台',()=>{floor(b,0,0,0,w,1.2);floor(b,0,0,7.2,w,.4);for(const x of[0,4.08])floor(b,x,0,1.2,.32,6);floor(b,0,3.2,0,w,1.2);});
  b.part('四根贯层石柱、连接圈梁与剖面封顶',()=>{for(const x of[.04,w-.28])for(const z of[.04,d-.28]){b.b(x+.02,.20,z+.02,.20,6.0,.20,b.s.wall);for(const y of[.2,3.08,6.08])b.b(x-.04,y,z-.04,.32,.16,.32,b.s.metal);for(const y of[.36,3.24,6.24])b.b(x+.08,y,z-.02,.08,.10,.04,b.s.bronze);}for(const y of[3.08,6.08]){b.b(.16,y,.18,w-.32,.16,.16,b.s.wood);b.b(.16,y,d-.34,w-.32,.16,.16,b.s.wood);for(const x of[.12,w-.28])b.b(x,y,.30,.16,.16,d-.60,b.s.wood);}});
  b.part('背部砌体与局部保留侧壁',()=>{solidPanel(b,.28,.20,7.44,w-.56,5.88,.10);solidPanel(b,.20,.20,6.02,.10,5.88,1.38);for(const y of[.98,4.20]){b.b(.90,y,7.40,2.60,1.62,.20,0);for(const x of[.84,3.50])b.b(x,y-.06,7.40,.06,1.74,.18,b.s.wood);for(const yy of[y-.06,y+1.62])b.b(.84,yy,7.40,2.72,.06,.18,b.s.wood);}for(const y of[1.0,4.2]){b.b(.26,y,7.34,.16,.74,.12,b.s.metal);b.b(.30,y+.08,7.30,.08,.58,.04,b.s.warm);}});
  b.part('入口门楣、上接台侧护边与可见柱脚',()=>{b.b(.28,2.74,.22,w-.56,.18,.20,b.s.wood);for(const x of[.30,w-.50]){b.b(x,.20,.20,.20,2.54,.20,b.s.wood);b.b(x,.34,.16,.20,.12,.04,b.s.metal);}b.b(.30,3.4,.08,.12,.12,1.10,b.s.metal);b.b(w-.42,3.4,.08,.12,.12,1.10,b.s.metal);});
 }},
 'BUILT-015':{size:[3.6,3,1.2],pitch:.02,features:'南入口墙段：1.8m 穿透门洞、柱脚、木门楣、独立灯槽与开启门扇',limits:'墙与门洞均是真实格子；门扇固定开启，没有铰链动画或实际 door/function 路由。门洞高度与通道需按实例位置复核。',draw:(b,w)=>portal(b,w,false)},
 'BUILT-016':{size:[3.2,3,1.2],pitch:.02,features:'内院入口墙段：1.6m 穿透开口、双开木扇、浅石柱和回纹门楣',limits:'本件为地层内院门静态候选，不自动生成到上层。开启的门扇占用真实空间，未实现门扇转动或权限系统。',draw:(b,w)=>portal(b,w,true)},
 'BUILT-017':{size:[12.8,3,.4],pitch:.02,features:'三跨窗洞墙：默认 4.8m 中心距、1.6m 窗、间隔墙垛与独立木格',limits:'默认采用清单的 4.8m 窗节奏；缩窄整体宽度会改变中心距，不能作为原 FloorPlan 的无损替换。窗格有真实空隙，未生成玻璃或功能入口。',draw:(b,w,h,d)=>{
  const centres=[1.6,w/2,w-1.6];
  b.part('砌块墙体、基脚与压顶',()=>{solidPanel(b,0,.20,.14,w,2.56,.14);b.b(0,0,0,w,.20,d,b.s.stone);b.b(0,2.76,0,w,.24,d,b.s.metal);for(let x=.02;x<w;x+=.48)b.b(x,2.84,.02,Math.min(.44,w-x-.02),.14,.36,b.s.wall);for(const cx of centres)b.b(cx-.8,.8,.10,1.6,1.4,.22,0);});
  b.part('窗台、木压条和真实窗格孔',()=>{for(const cx of centres){for(const x of[cx-.86,cx+.80])b.b(x,.74,.08,.06,1.52,.24,b.s.wood);for(const y of[.74,2.20])b.b(cx-.86,y,.08,1.72,.06,.24,b.s.wood);b.b(cx-.90,.68,.04,1.8,.08,.32,b.s.wall);for(const x of[cx-.46,cx+.42])b.b(x,.82,.18,.04,1.36,.06,b.s.wood);for(const y of[1.06,1.88])b.b(cx-.80,y,.18,1.6,.04,.06,b.s.wood);}});
  b.part('独立石柱、金属套肩与铜锁销',()=>{for(const x of[.02,(centres[0]+centres[1])/2-.12,(centres[1]+centres[2])/2-.12,w-.26]){b.b(x,0,.02,.24,.28,.36,b.s.stone);b.b(x+.02,.28,.08,.20,2.48,.24,b.s.wall);for(const y of[.28,2.68])b.b(x-.02,y,0,.28,.12,.4,b.s.metal);b.b(x+.08,2.72,-.02,.08,.08,.04,b.s.bronze);}});
 }},
 'BUILT-018':{size:[2.4,2.6,1.6],pitch:.02,features:'地下层切角：实混凝土墙板、防水膜、角钢、砌石收边与剖面土层',limits:'局部剖切结构样件；土层是可单独隐藏或重赋材质的体素部件，未读取或修改旧游戏档案、金库、地下层用途及权限。',draw:(b,w,h,d)=>{
  b.part('实混凝土墙、底板及上部楼板',()=>{b.b(.22,.16,.22,2.0,2.24,.16,b.s.structuralConcrete);b.b(.22,.16,.22,.16,2.24,1.16,b.s.structuralConcrete);b.b(.18,0,.18,2.06,.16,1.24,b.s.structuralConcrete);floor(b,.12,2.40,.12,2.16,1.36);});
  b.part('外侧连续橡胶膜和金属防水压条',()=>{b.b(.20,.14,.20,2.04,2.26,.02,b.s.waterproofMembrane);b.b(.20,.14,.20,.02,2.26,1.2,b.s.waterproofMembrane);for(const x of[.22,2.12])b.b(x,.16,.18,.04,2.24,.02,b.s.metal);for(const y of[.16,2.28])b.b(.22,y,.18,1.94,.04,.02,b.s.metal);});
  b.part('土层切边和独立石质块屑',()=>{b.b(0,0,0,w,2.4,.18,b.s.earthCutaway);b.b(0,0,.18,.18,2.4,d-.18,b.s.earthCutaway);for(let j=0;j<30;j++){const x=j===0?.04:.06+((j*17)%106)*.02,y=j===0?.14:.10+((j*31)%102)*.02;b.b(x,y,-.02,[.12,.18,.16][j%3],[.18,.24,.12][j%3],.06,b.s.stone);}for(let j=0;j<9;j++)b.b(-.02,.18+(j%3)*.7,.30+Math.floor(j/3)*.40,.06,.16,.18,b.s.stone);});
  b.part('边角钢、剖口石压沿与铜连接',()=>{for(const x of[.12,2.12])b.b(x,2.40,.10,.16,.20,1.4,b.s.metal);for(const x of[.14,2.14])b.b(x,2.54,.12,.10,.06,.12,b.s.bronze);b.b(.38,.16,.36,1.82,.08,.12,b.s.wall);for(const x of[.38,2.04]){b.b(x,.24,.38,.08,2.16,.06,b.s.metal);for(const y of[.42,1.34,2.16])b.b(x+.02,y,.42,.04,.06,.02,b.s.bronze);}});
  // The open room side is the -Z front; earth remains behind the real wall.
  const old=b.g,nz=b.index(d);b.g=new Grid();for(const[v,m]of old.cells())b.g.set([v[0],v[1],nz-v[2]-1],m);for(const part of b.parts)part.region={min:[part.region.min[0],part.region.min[1],nz-part.region.max[2]],max:[part.region.max[0],part.region.max[1],nz-part.region.min[2]]};
 }},
 'BUILT-045':{size:[1.04,2.44,.36],pitch:.02,features:'墙侧牌框：双木立梃、石基脚、分层压顶、实体涂装牌芯和挂扣',limits:'牌芯为作者选择的涂装金属，角纹为油墨；没有捏造 Building 用途文字。墙侧安装仍需真实墙面，展示底座不等于已绑定入口。',draw:(b,w,h,d)=>{
  b.part('双层石脚、两根木梃和顶横枋',()=>{b.b(0,0,0,w,.18,d,b.s.stone);b.b(.06,.18,.04,w-.12,.12,d-.08,b.s.wall);for(const x of[.10,w-.26]){b.b(x,.30,.08,.16,2.04,.20,b.s.wood);for(const y of[.34,2.18])b.b(x-.04,y,.04,.24,.14,.28,b.s.metal);b.b(x+.04,2.30,.08,.08,.08,.12,b.s.bronze);}b.b(.10,2.30,.08,w-.20,.14,.20,b.s.wood);});
  b.part('实体牌芯、木压框、退面层次与印刷角纹',()=>{b.b(.18,.58,.06,w-.36,1.50,.12,b.s.wood);b.b(.26,.66,.04,w-.52,1.34,.04,b.s.enamel);for(const x of[.20,w-.26])b.b(x,.62,.02,.06,1.42,.06,b.s.woodEdge);for(const y of[.62,1.98])b.b(.20,y,.02,w-.40,.06,.06,b.s.woodEdge);for(const x of[.28,w-.42])for(const y of[.70,1.80])b.hui(x,y,.02,.12,.14,b.s.printedDark,.02);});
  b.part('后置挂扣和浅埋固定销',()=>{for(const x of[.12,w-.20])for(const y of[.48,2.02]){b.b(x,y,.26,.08,.14,.10,b.s.metal);b.b(x+.02,y+.02,.30,.04,.06,.06,0);b.b(x+.02,y-.02,.02,.04,.06,.06,b.s.bronze);}});
 }},
};

export const structureMaterialRules:Record<string,{required:string[],allowed:string[],note:string}>={};
const structural=['stone','wall','wood','metal','bronze','mortar','structuralConcrete','warm'];
for(const id of['BUILT-008','BUILT-009','BUILT-010'])structureMaterialRules[id]={required:['wall','metal','bronze','structuralConcrete'],allowed:[...structural],note:'石踏面、混凝土承板、木构件、金属、铜接件与电灯芯按实际用途独立；不是同色替代。'};
for(const id of['BUILT-011','BUILT-012','BUILT-013'])structureMaterialRules[id]={required:['roof','waterproofMembrane','metal','bronze'],allowed:[...structural,'roof','waterproofMembrane','woodEdge','metalBright'],note:'瓦片、木基层、弹性橡胶防水膜、金属泛水与铜锁件分别归类；膜层不会借轮胎角色。'};
for(const id of['BUILT-014','BUILT-015','BUILT-016','BUILT-017'])structureMaterialRules[id]={required:['wall','mortar','wood','metal','bronze'],allowed:[...structural,'woodEdge'],note:'砌石、砌筑砂浆、混凝土板、木门窗构件、金属与独立灯芯分开；门窗孔洞是真实空格。'};
structureMaterialRules['BUILT-018']={required:['structuralConcrete','waterproofMembrane','earthCutaway','stone','metal','bronze'],allowed:[...structural,'waterproofMembrane','earthCutaway'],note:'混凝土实墙与板、防水橡胶膜、土层、石屑、金属压条各有独立 ID，不统一当灰石材。'};
structureMaterialRules['BUILT-045']={required:['wood','enamel','printedDark','metal','bronze'],allowed:['stone','wall','wood','woodEdge','enamel','printedDark','metal','bronze'],note:'实体牌芯采用涂装金属，木牌框和印刷角纹分开；没有使用纸页或屏幕模拟外观。'};

export function configureStructureAsset(a:Asset,id:string){
 const width=(a.source!.dimensionsM as V3)[0],box=(min:V3,max:V3)=>({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const empty=(min:V3,max:V3)=>a.openings.push(box(min,max));
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 const walk=(id:string,x:number,y:number,z:number,sign:number)=>port(id,'walkway-1600',[x,y,z],[0,0,sign],[1.6,.20,0]);
 if(id==='BUILT-008'){
  empty([.30,.20,1.10],[1.30,.90,2]);for(let i=0;i<8;i++)empty([.24,.42+i*.2,4.4-(.72+i*.4)],[1.36,2.30+i*.2,4.4-(.48+i*.4)]);
  walk('bottom-walkway',.8,.2,4.4,1);walk('top-walkway',.8,1.8,0,-1);
 }else if(id==='BUILT-009'){
  empty([1.62,.20,0],[1.98,2.8,.58]);empty([.30,1.82,.68],[3.30,2.70,1.30]);walk('outbound',.8,1.8,0,-1);walk('return',2.8,1.8,0,-1);
 }else if(id==='BUILT-010'){
  empty([.24,.42,.50],[1.36,2.30,1.10]);walk('bottom-walkway',.8,.2,0,-1);walk('top-walkway',.8,.4,1.2,1);
 }else if(id==='BUILT-011'){
  empty([.60,.40,1.30],[.80,.80,1.50]);port('ridge-left','gable-ridge',[0,1.76,1.6],[-1,0,0],[0,.20,.30]);port('ridge-right','gable-ridge',[4,1.76,1.6],[1,0,0],[0,.20,.30]);
 }else if(id==='BUILT-012'){
  empty([.28,0,.32],[.36,.06,1.42]);port('weather-back','roof-edge-4000',[2,.2,1.8],[0,0,1],[4,.2,0]);for(const x of[.1,3.9])for(const z of[.1,1.7])port('column-'+Math.round(x*10)+'-'+Math.round(z*10),'column-200',[x,0,z],[0,-1,0],[.2,0,.2]);
 }else if(id==='BUILT-013'){
  empty([.30,.17,.04],[3.70,.20,.14]);port('weather-front','roof-edge-4000',[2,.2,0],[0,0,-1],[4,.2,0]);
 }else if(id==='BUILT-014'){
  empty([2.02,.22,1.22],[2.38,6.0,5.58]);empty([.60,.22,0],[3.8,2.60,1.18]);empty([.60,3.62,0],[3.8,5.90,1.18]);walk('lower-flight',1.2,.2,1.2,1);walk('upper-flight',3.2,3.4,1.2,1);
 }else if(id==='BUILT-015'||id==='BUILT-016'){
  const opening=id==='BUILT-015'?1.8:1.6,left=(width-opening)/2;empty([left+.12,.22,-.16],[left+opening-.12,2.50,1.22]);port('wall-left','wall-3000',[0,1.5,.40],[-1,0,0],[0,3,.4]);port('wall-right','wall-3000',[width,1.5,.40],[1,0,0],[0,3,.4]);
 }else if(id==='BUILT-017'){
  for(const cx of[1.6,width/2,width-1.6])empty([cx-.40,1.12,.08],[cx+.38,1.84,.34]);port('wall-left','wall-3000',[0,1.5,.20],[-1,0,0],[0,3,.4]);port('wall-right','wall-3000',[width,1.5,.20],[1,0,0],[0,3,.4]);
 }else if(id==='BUILT-018'){
  empty([.46,.26,.36],[2.02,2.28,1.08]);port('top-load','floor-support',[1.2,2.6,.8],[0,1,0],[2.16,0,1.36]);
 }else if(id==='BUILT-045'){
  empty([.14,.50,.30],[.18,.54,.36]);port('wall-mount','sign-wall',[.52,1.40,.36],[0,0,1],[.80,1.8,0]);
 }
}
