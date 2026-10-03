import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

// M014: component scope follows the catalogue. Walls, roofs and stairs in a
// reference's installation context are not silently welded into every master.
// Large solid foundations use 40 mm; fine joinery uses 20 mm. Ports retain pitch.
function paving(b:Shapes,x:number,y:number,z:number,w:number,d:number){
 const e=b.pitch;
 b.b(x,y,z,w,e,d,b.s.mortar);
 for(let xx=0;xx<w-e;xx+=.4)for(let zz=0;zz<d-e;zz+=.4)
  b.b(x+xx+e,y+e,z+zz+e,Math.min(.4-e,w-xx-e),e,Math.min(.4-e,d-zz-e),b.s.wall);
}
function masonry(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number,light=true){
 const e=b.pitch,m=light?b.s.wall:b.s.stone;
 b.b(x,y,z,w,h,d,m);
 // Actual recessed bed/perpend joints, backed by a mortar layer, on both faces.
 for(const zz of[z,z+d-e]){
  b.b(x,y,zz,w,h,e,b.s.mortar);
  for(let row=0;row*.32<h-e;row++){
   const start=row%2?-.24:0;
   for(let xx=start;xx<w;xx+=.48){const a=Math.max(e,xx+e),end=Math.min(w,xx+.48);
    b.b(x+a,y+row*.32+e,zz===z?zz-e:zz+e,end-a,Math.min(.32-e,h-row*.32-e),e,m);
   }
  }
 }
}
function stoneShoe(b:Shapes,x:number,z:number,w:number,d:number,h=.64){
 b.b(x,0,z,w,.12,d,b.s.stone);
 b.b(x+.04,.12,z+.04,w-.08,h-.2,d-.08,b.s.wall);
 b.b(x,.12,z,w,.04,d,b.s.mortar);
 b.b(x,h-.08,z,w,.08,d,b.s.wall);
 const ww=Math.min(.28,w-.16),xx=x+(w-ww)/2;
 b.b(xx-.04,.24,z+.02,ww+.08,.24,.04,b.s.stone);
 b.hui(xx,.28,z,ww,.16,b.s.wall,b.pitch);
}
function timberPier(b:Shapes,x:number,z:number,height:number,w=.28){
 b.b(x,0,z,w,.16,w,b.s.stone);
 b.b(x+.04,.16,z+.04,w-.08,height-.32,w-.08,b.s.wood);
 for(const y of[.16,height-.20]){
  b.b(x,y,z,w,.12,w,b.s.metal);
  b.b(x+.08,y+.04,z-b.pitch,w-.16,.04,b.pitch,b.s.bronze);
 }
 b.b(x+.04,height-.08,z+.04,w-.08,.08,w-.08,b.s.woodEdge);
}
function railLight(b:Shapes,x:number,y:number,z:number){
 b.b(x-.16,y,z-.16,.32,.12,.32,b.s.wall);
 b.b(x-.12,y+.12,z-.12,.24,.80,.24,b.s.wood);
 for(const yy of[y+.12,y+.84])b.b(x-.16,yy,z-.16,.32,.12,.32,b.s.metal);
 b.b(x-.08,y+.96,z-.08,.16,.08,.16,b.s.bronze);
 b.b(x-.08,y+.36,z-.16,.16,.40,.04,b.s.bronze);
 b.b(x-.04,y+.40,z-.20,.08,.32,.04,b.s.warm);
}
function handrail(b:Shapes,a:V3,c:V3){
 b.beam([a[0],a[1]+.86,a[2]],[c[0],c[1]+.86,c[2]],.12,b.s.woodEdge);
 b.beam([a[0],a[1]+.36,a[2]],[c[0],c[1]+.36,c[2]],.08,b.s.wood);
 const n=Math.ceil(Math.abs(c[2]-a[2])/.4);
 for(let i=1;i<n;i++){const t=i/n,y=a[1]+(c[1]-a[1])*t,z=a[2]+(c[2]-a[2])*t;b.b(a[0]-.02,y+.36,z-.02,.04,.48,.04,b.s.wood);}
}
function floorPiece(b:Shapes,x:number,z:number,w:number,d:number){
 b.b(x,0,z,w,.08,d,b.s.wood);
 b.b(x,.08,z,w,.08,d,b.s.structuralConcrete);
 paving(b,x,.16,z,w,d);
 for(const zz of[z,z+d-.04])b.b(x,0,zz,w,.08,.04,b.s.metal);
}

export const legacyBuildingRecipes:Record<string,AtlasRecipe>={
 'BUILT-053':{size:[1.28,.8,.9],pitch:.02,mount:'wall',features:'实际屋缘短支托：三层出挑木栱、抱壁背枋、上承枋、金属束箍和铜榫头',limits:'母版只含短支托，参考中的墙柱与瓦屋缘是安装上下文。作者默认墙顶到屋底间隙 0.8m；装配时须检查真实接触，不自动改写 FloorPlan 或建筑权限。',draw:(b,w)=>{
  b.part('抱壁木背枋及后侧锚带',()=>{b.b(.48,0,.64,.32,.8,.26,b.s.wood);for(const y of[.04,.56]){b.b(.44,y,.74,.40,.12,.16,b.s.metal);b.b(.52,y+.02,.88,.06,.08,.02,b.s.bronze);b.b(.70,y+.02,.88,.06,.08,.02,b.s.bronze);}});
  b.part('逐层伸出的真实木栱和退层牙头',()=>{for(let k=0;k<3;k++){const ww=.56+k*.24,z=.42-k*.18,y=.16+k*.16;b.b((w-ww)/2,y,z,ww,.16,.16,b.s.wood);b.b(.54,y,z+.16,.20,.16,.74-z,b.s.wood);b.b((w-ww)/2+.04,y,z-.04,ww-.08,.06,.04,b.s.woodEdge);for(const x of[(w-ww)/2,(w+ww)/2-.08])b.b(x,y,z,.08,.10,.10,b.s.bronze);}});
  b.part('顶承枋、分开的金属肩鞍与铜销',()=>{b.b(0,.64,0,w,.16,.20,b.s.wood);b.b(0,.64,.68,w,.16,.22,b.s.wood);b.b(.52,.64,.20,.24,.16,.48,b.s.wood);for(const x of[.08,1.08]){b.b(x,.64,.04,.12,.16,.82,b.s.metal);b.b(x+.02,.76,.10,.08,.04,.10,b.s.bronze);}for(const z of[.04,.74])b.b(.22,.76,z,.84,.04,.12,b.s.woodEdge);b.b(.58,.76,.20,.12,.04,.48,b.s.woodEdge);});
 }},
 'BUILT-054':{size:[.64,1.44,.92],pitch:.02,mount:'wall',features:'入口木纸灯笼：独立纸罩、内部电灯芯、镂空木骨架、吊接铜榫与壁侧挑臂',limits:'纸罩使用独立 paper 类别，不借玻璃或灯芯。灯芯发光与纸罩透光外观分开；当前实时渲染没有纸张次表面散射、纸透射或灯芯的全局间接照明。墙柱不焊入灯笼。',draw:(b)=>{
  b.part('木质挂墙背条和水平出挑臂',()=>{b.b(.24,0,.82,.16,1.44,.10,b.s.wood);b.b(.20,1.26,.24,.24,.18,.66,b.s.woodEdge);for(const y of[.12,1.10]){b.b(.20,y,.82,.24,.10,.10,b.s.metal);b.b(.26,y+.02,.80,.12,.06,.02,b.s.bronze);}b.b(.26,1.06,.26,.12,.20,.12,b.s.bronze);b.b(.28,1.12,.26,.08,.08,.12,0);});
  b.part('木顶底盘、四角实木骨架与镂空格边',()=>{for(const y of[.12,1.00]){b.b(.04,y,.04,.56,.08,.56,b.s.wood);b.b(.08,y+.08,.08,.48,.04,.48,b.s.woodEdge);}for(const x of[.08,.50])for(const z of[.08,.50])b.b(x,.20,z,.06,.80,.06,b.s.wood);for(const y of[.26,.90]){for(const z of[.06,.54])b.b(.08,y,z,.48,.04,.04,b.s.woodEdge);for(const x of[.06,.54])b.b(x,y,.10,.04,.04,.44,b.s.woodEdge);}for(const x of[.18,.30,.42])for(const z of[.06,.54])for(const y of[.20,.94])b.b(x,y,z,.02,.06,.04,b.s.wood);});
  b.part('四片单独纸罩和内部灯芯、电源座',()=>{for(const z of[.12,.50])b.b(.14,.30,z,.36,.60,.02,b.s.lanternPaper);for(const x of[.12,.50])b.b(x,.30,.14,.02,.60,.36,b.s.lanternPaper);b.b(.24,.20,.24,.16,.06,.16,b.s.metal);b.b(.28,.26,.28,.08,.60,.08,b.s.warm);});
  b.part('四角铜包边和下方系结',()=>{for(const x of[.06,.54])for(const z of[.06,.54])for(const y of[.14,1.02])b.b(x,y,z,.04,.04,.04,b.s.bronze);b.b(.26,.04,.26,.12,.08,.12,b.s.bronze);});
 }},
 'BUILT-055':{size:[8,.64,8],pitch:.04,features:'旧楼实体石基台：完整实心石芯、错缝石裙、浅石压边、分块铺面与四角锚座',limits:'以作者选择的 5×5m 旧楼占地加 3m 得到 8×8m 示例基台；是实心石体，40mm 精度。未读取原游戏 getFloorDimensions 或修改既有地形、地下层。',draw:(b,w,h,d)=>{
  b.part('完整实心石芯及下层基脚',()=>{b.b(0,0,0,w,h-.08,d,b.s.stone);});
  b.part('正背错缝石裙和侧面回绕块缝',()=>{masonry(b,0,.12,0,w,.32,d,false);for(const x of[0,w-.04]){b.b(x,.12,.04,.04,.32,d-.08,b.s.mortar);for(let z=.04;z<d-.04;z+=.48)b.b(x===0?-.04:w,.16,z,.04,.24,Math.min(.44,d-.04-z),b.s.stone);}});
  b.part('浅石压边和顶面方块铺装',()=>{paving(b,.32,.56,.32,w-.64,d-.64);for(const z of[0,d-.32])b.b(0,.48,z,w,.16,.32,b.s.wall);for(const x of[0,w-.32])b.b(x,.48,.32,.32,.16,d-.64,b.s.wall);for(let n=.64;n<w-.4;n+=.64){for(const z of[0,d-.32])b.b(n,.48,z,.04,.12,.32,b.s.mortar);for(const x of[0,w-.32])b.b(x,.48,n,.32,.12,.04,b.s.mortar);}});
  b.part('四角石锚座、金属压片与铜锁销',()=>{for(const x of[0,w-.48])for(const z of[0,d-.48]){b.b(x,.08,z,.48,.44,.48,b.s.wall);b.b(x+.08,.20,z,.32,.20,.04,b.s.stone);b.hui(x+.12,.24,z-.04,.24,.12,b.s.wall,.04);b.b(x+.08,.56,z+.08,.32,.08,.32,b.s.metal);b.b(x+.16,.60,z+.16,.16,.04,.16,b.s.bronze);}});
 }},
 'BUILT-056':{size:[6.4,1.84,6],pitch:.04,features:'旧南门石铺接台：6m 进深、四级入台、实体石侧墙、连续扶手与独立暖光柱',limits:'示例楼宽 20m，min(7,20×0.32)=6.4m；6m 深度按清单，40mm 网格。未接入旧游戏南门位置或真实山地地形；灯芯发光不等同于地面照明。',draw:(b,w,h,d)=>{
  b.part('实心接台与四级真实踏面',()=>{b.b(0,0,1.6,w,.72,d-1.6,b.s.stone);paving(b,0,.72,1.6,w,d-1.6);for(let i=0;i<4;i++){const top=.2+i*.2;b.b(.48,0,i*.4,w-.96,top-.08,.4,b.s.stone);paving(b,.48,top-.08,i*.4,w-.96,.4);}});
  b.part('侧墙、阶梯护边和压顶',()=>{for(const x of[0,w-.48]){for(let i=0;i<4;i++)b.b(x,0,i*.4,.48,.28+i*.2,.4,b.s.wall);b.b(x,0,1.6,.48,.80,d-1.6,b.s.wall);for(let z=1.68;z<d-.08;z+=.48)b.b(x,.12,z,.48,.04,.04,b.s.mortar);}});
  b.part('平台栏柱、连续木扶手和竖格',()=>{for(const x of[.24,w-.24]){railLight(b,x,.8,1.80);railLight(b,x,.8,d-.24);handrail(b,[x,.8,1.8],[x,.8,d-.24]);}});
 }},
 'BUILT-057':{size:[6.4,.24,6.4],pitch:.04,features:'旧楼楼梯井分片楼板：四块相接楼板、2.4×5.2m 真梯井、混凝土承板、木底梁和石铺面',limits:'只含四块楼板，参考图的另一层、承柱和十级楼梯需作为独立实例拼装。40mm 精度；不替代旧游戏 30 层楼数据或地下空间。',draw:(b,w,h,d)=>{
  b.part('左侧楼板片及铺面',()=>floorPiece(b,0,0,2,d));
  b.part('右侧楼板片及铺面',()=>floorPiece(b,4.4,0,2,d));
  b.part('井口前侧楼板片',()=>floorPiece(b,2,0,2.4,.4));
  b.part('井口后侧楼板片',()=>floorPiece(b,2,5.6,2.4,.8));
  b.part('井沿木包边、四角金属鞍与铜销',()=>{for(const x of[1.92,4.4])b.b(x,0,.4,.08,.08,5.2,b.s.woodEdge);for(const z of[.32,5.6])b.b(2,0,z,2.4,.08,.08,b.s.woodEdge);for(const x of[.08,6.08])for(const z of[.08,6.08]){b.b(x,0,z,.24,.20,.24,b.s.metal);b.b(x+.04,.20,z+.04,.16,.04,.16,b.s.bronze);}});
 }},
 'BUILT-058':{size:[4.4,3.2,.56],pitch:.02,features:'分段入口与窗洞墙：真实贯穿门洞和窗洞、砌石墙垛、木框、石脚、铜锁件及分层梁',limits:'墙体母版保留门窗空洞，门扇和玻璃分别实例化；没有将参考图中窗后家具焊入墙。未接入原游戏 architectureFacadeLayout、碰撞权限及旧档。',draw:(b,w)=>{
  b.part('三段实体石墙、门窗洞下墙和门槛',()=>{for(const [x,ww]of[[0,.5],[1.7,.4],[3.9,.5]])masonry(b,x,0,.12,ww,2.8,.32);masonry(b,2.1,0,.12,1.8,.84,.32);b.b(.5,0,.12,1.2,.12,.32,b.s.wall);});
  b.part('深木洞口框、分层顶部连续过梁',()=>{for(const x of[.4,1.7,2.0,3.9])b.b(x,.12,.08,.10,2.60,.40,b.s.wood);for(const y of[.84,2.60])b.b(2.0,y,.08,2.0,.12,.4,b.s.woodEdge);b.b(.4,2.6,.08,1.4,.12,.4,b.s.woodEdge);b.b(0,2.8,.08,w,.24,.4,b.s.wood);b.b(0,3.04,.08,w,.12,.4,b.s.metal);b.b(.12,3.16,.12,w-.24,.04,.32,b.s.woodEdge);});
  b.part('两端石脚、壁柱与铜包肩',()=>{for(const x of[.04,w-.40]){b.b(x,0,0,.36,.32,.56,b.s.stone);b.b(x+.06,.32,.08,.24,2.64,.40,b.s.wood);for(const y of[.32,2.90])b.b(x,.32===y?y:y-.04,0,.36,.16,.56,b.s.metal);b.b(x+.12,2.92,-.02,.12,.12,.04,b.s.bronze);}});
  b.part('入口壁灯、独立灯芯和铜框',()=>{b.b(.12,1.00,.02,.16,.96,.08,b.s.metal);b.b(.14,1.04,-.02,.12,.88,.06,b.s.bronze);b.b(.16,1.12,-.04,.08,.72,.04,b.s.warm);});
 }},
 'BUILT-059':{size:[.94,3.2,.94],pitch:.02,features:'旧楼层角木柱：精确 0.7m 木柱芯、分层石足、凹槽石饰、金属柱靴和铜抱肩',limits:'只含一根母柱，四角由实例复用。0.7m 柱芯来自清单，层高为作者选择的 3.2m；没有修改原 getFloorDimensions。',draw:(b,w,h,d)=>{
  b.part('三层石足、阴刻石面和连续柱础',()=>stoneShoe(b,0,0,w,d,.64));
  b.part('0.7m 实木柱芯、木收边与上端榫头',()=>{b.b(.12,.64,.12,.70,2.40,.70,b.s.wood);for(const x of[.14,.76])for(const z of[.10,.80])b.b(x,.82,z,.04,2.08,.04,b.s.woodEdge);b.b(.30,3.04,.30,.34,.16,.34,b.s.wood);});
  b.part('金属柱靴、上肩与铜锁扣',()=>{for(const y of[.64,2.88]){b.b(.08,y,.08,.78,.16,.78,b.s.metal);for(const x of[.10,.70])b.b(x,y+.04,.06,.14,.08,.04,b.s.bronze);}b.b(.04,3.04,.04,.86,.08,.86,b.s.woodEdge);});
 }},
 'BUILT-060':{size:[2.4,2.8,1.4],pitch:.02,features:'旧楼三面窗：U 形三面独立玻璃、层叠木梃、深金属玻璃压条、石窗台和铜接件',limits:'正面及左右返边共三面玻璃，后侧开放；两面可见来自参考，第三返边为作者补全。无窗后房间和家具，玻璃采用透明混合而无真实折射。',draw:(b,w,h,d)=>{
  b.part('U 形三边石窗台与顶木梁',()=>{for(const y of[0,2.56]){const m=y===0?b.s.wall:b.s.wood;b.b(0,y,0,w,.24,.28,m);for(const x of[0,w-.28])b.b(x,y,.28,.28,.24,d-.28,m);}for(const x of[0,w-.28])for(const z of[0,d-.28])timberPier(b,x,z,h,.28);});
  b.part('三面实体木窗下裙、压边和中梃',()=>{b.b(.28,.24,.04,w-.56,.44,.20,b.s.wood);for(const x of[.04,w-.24])b.b(x,.24,.28,.20,.44,d-.56,b.s.wood);for(const y of[.68,2.48]){b.b(.28,y,.04,w-.56,.08,.20,b.s.woodEdge);for(const x of[.04,w-.24])b.b(x,y,.28,.20,.08,d-.56,b.s.woodEdge);}b.b(1.16,.76,.06,.08,1.72,.16,b.s.wood);});
  b.part('三面独立薄玻璃及金属玻璃压条',()=>{b.b(.28,.76,.12,1.76,1.72,.02,b.s.glass);for(const x of[.12,2.26])b.b(x,.76,.28,.02,1.72,.84,b.s.glass);b.b(1.16,.76,.08,.08,1.72,.10,b.s.metal);for(const y of[.76,2.44]){b.b(.28,y,.10,1.84,.04,.04,b.s.metal);for(const x of[.10,2.26])b.b(x,y,.28,.04,.04,.84,b.s.metal);}for(const x of[.28,2.08])b.b(x,.76,.10,.04,1.72,.04,b.s.metal);});
  b.part('灯槽、铜饰和浅青玻璃蚀刻角线',()=>{b.b(.34,2.52,.02,1.72,.02,.02,b.s.energy);for(const x of[.16,2.18]){b.b(x-.02,.96,0,.10,.68,.06,b.s.metal);b.b(x,1.00,-.02,.06,.60,.04,b.s.warm);}for(const x of[.36,1.90]){b.b(x,.84,.10,.02,.18,.02,b.s.glassEtch);b.b(x,.84,.10,.16,.02,.02,b.s.glassEtch);}for(const x of[.06,2.16])b.b(x,2.64,-.02,.18,.08,.04,b.s.bronze);});
 }},
 'BUILT-061':{size:[3.2,.40,.36],pitch:.02,mount:'wall',features:'墙顶木压边：连续木压枋、上下退层收口、端部铜抱箍、金属卡带和榫孔',limits:'母版只有木压边，图中的石墙是安装上下文，不并入母版。需要在旧墙顶标高放置；不修改原 wallHeight 或自动贴合任意墙宽。',draw:(b,w,h,d)=>{
  b.part('连续木压枋与上下木收口',()=>{b.b(0,.04,.02,w,.32,d-.04,b.s.wood);for(const y of[0,.34])b.b(.04,y,0,w-.08,.06,d,b.s.woodEdge);b.b(.22,.18,0,w-.44,.04,.02,b.s.woodEdge);});
  b.part('端箍、金属卡带与铜鞍',()=>{for(const x of[.08,w-.20]){b.b(x,0,.02,.12,.40,.32,b.s.metal);for(const y of[.06,.28])b.b(x+.02,y,0,.08,.06,.04,b.s.bronze);}for(const x of[0,w-.04])b.b(x,.08,.08,.04,.24,.20,b.s.bronze);});
  b.part('真实端榫孔及背部锁口',()=>{for(const x of[0,w-.08])b.b(x,.16,.14,.08,.08,.08,0);b.b(1.48,0,.14,.24,.06,.08,0);});
 }},
 'BUILT-062':{size:[2.4,3.68,5.2],pitch:.04,features:'旧天枢十级实体楼梯：十级 0.24m 踢高 / 0.4m 踏深、实心石梯体、顶台和两侧木扶手',limits:'仅旧十级一跑母版，不替代新双跑梯。踏步作者尺寸 0.24/0.4m，是游戏几何示例而非建筑规范承诺；40mm 网格，底台 0.24m、顶台 2.64m。未接入角色控制器或寻路。',draw:(b,w,h,d)=>{
  b.part('十级完整实心石梯体及底顶接台',()=>{b.b(0,0,0,w,.16,.4,b.s.stone);paving(b,0,.16,0,w,.4);for(let i=0;i<10;i++){const top=.48+i*.24,z=.4+i*.4;b.b(0,0,z,w,top-.08,.4,b.s.stone);paving(b,0,top-.08,z,w,.4);}b.b(0,0,4.4,w,2.56,.8,b.s.stone);paving(b,0,2.56,4.4,w,.8);});
  b.part('两侧石压边、真实踏鼻和竖向灰缝',()=>{for(let i=0;i<10;i++){const y=.48+i*.24,z=.4+i*.4;b.b(.32,y-.08,z,w-.64,.04,.04,b.s.wall);for(const x of[0,w-.20])b.b(x,y-.08,z,.20,.16,.4,b.s.wall);for(const x of[0,w-.04])b.b(x,.12,z,.04,Math.max(.04,y-.24),.04,b.s.mortar);}});
  b.part('两侧连续木扶手、立柱、金属锁固及暖灯',()=>{for(const x of[.16,w-.16]){railLight(b,x,.24,.20);railLight(b,x,1.44,2.16);railLight(b,x,2.64,4.60);handrail(b,[x,.24,.20],[x,1.44,2.16]);handrail(b,[x,1.44,2.16],[x,2.64,4.60]);}});
 }},
 'BUILT-063':{size:[1.2,2.4,.16],pitch:.02,features:'旧门侧展开门扇：真实木板框、上下穿透木格、铜合页、长拉手和金属护角',limits:'母版是独立平直门扇，以安装口在墙侧展开；不是门框与石柱的重复资产。静态姿态，不含铰链动画，也没有旧游戏 6m 接近通道运行时逻辑。',draw:(b,w,h,d)=>{
  b.part('木门边梃、顶底横枋和实木腰板',()=>{for(const x of[0,w-.12])b.b(x,0,.04,.12,h,.12,b.s.wood);for(const y of[0,.28,1.94,2.24])b.b(.12,y,.04,w-.24,.16,.12,b.s.wood);b.b(.12,.80,.06,w-.24,.22,.08,b.s.wood);});
  b.part('上下穿透木格与独立木收边',()=>{for(let x=.20;x<w-.16;x+=.16)b.b(x,.44,.08,.04,1.50,.06,b.s.wood);for(const x of[.12,w-.16])b.b(x,.28,.02,.04,1.82,.14,b.s.woodEdge);for(const y of[.14,2.14])b.b(.12,y,.02,w-.24,.04,.14,b.s.woodEdge);});
  b.part('金属门护角、铜合页和长拉手',()=>{for(const x of[0,w-.12])for(const y of[0,h-.14]){b.b(x,y,.02,.12,.14,.14,b.s.metal);b.b(x+.04,y+.04,0,.04,.06,.02,b.s.bronze);}for(const y of[.40,1.72])b.b(w-.10,y,.04,.10,.32,.12,b.s.bronze);b.b(.12,.94,0,.04,.48,.04,b.s.bronze);for(const y of[.94,1.38])b.b(.12,y,0,.04,.04,.06,b.s.metal);});
 }},
 'BUILT-064':{size:[2.4,3.2,.72],pitch:.02,features:'旧木门柱与门枋：两只雕槽石脚、深木门柱、金属柱靴、铜抱肩与叠层门楣',limits:'独立无门扇框，门扇 BUILT-063 可接墙侧展开口。门洞 1.44m 宽，最低门枋 2.72m；不焊入门扇、不假称已有开门动画或权限逻辑。',draw:(b,w,h,d)=>{
  b.part('两只分层石脚及真实阴槽石饰',()=>{for(const x of[0,w-.48])stoneShoe(b,x,0,.48,d,.64);});
  b.part('门柱实木芯、凹进木边与上端插榫',()=>{for(const x of[.08,w-.40]){b.b(x,.64,.18,.32,2.48,.36,b.s.wood);for(const xx of[x+.02,x+.26])b.b(xx,.80,.14,.04,1.90,.04,b.s.woodEdge);b.b(x+.08,3.04,.26,.16,.16,.20,b.s.wood);}});
  b.part('多层门枋、金属肩套和铜角锁件',()=>{b.b(.08,2.72,.16,w-.16,.28,.4,b.s.wood);b.b(.12,2.74,.12,w-.24,.06,.04,b.s.woodEdge);b.b(.08,3.0,.18,w-.16,.12,.36,b.s.woodEdge);for(const x of[.04,w-.44])for(const y of[.64,2.86]){b.b(x,y,.10,.40,.16,.52,b.s.metal);b.b(x+.04,y+.04,.08,.08,.08,.04,b.s.bronze);}});
  b.part('墙侧门扇锚片和铜销',()=>{for(const y of[.40,1.72]){b.b(-.04,y,-.08,.16,.32,.28,b.s.metal);b.b(-.04,y,-.08,.04,.32,.08,b.s.bronze);}});
 }},
};

export const legacyBuildingMaterialRules:Record<string,{required:string[];allowed:string[];note:string}>=Object.fromEntries(Object.keys(legacyBuildingRecipes).map(id=>{
 const roles:Record<string,string[]>={
  '053':['wood','woodEdge','metal','bronze'],
  '054':['wood','woodEdge','metal','bronze','lanternPaper','warm'],
  '055':['stone','wall','mortar','metal','bronze'],
  '056':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm'],
  '057':['structuralConcrete','mortar','wall','wood','woodEdge','metal','bronze'],
  '058':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm'],
  '059':['stone','wall','mortar','wood','woodEdge','metal','bronze'],
  '060':['stone','wall','wood','woodEdge','metal','bronze','glass','glassEtch','energy','warm'],
  '061':['wood','woodEdge','metal','bronze'],
  '062':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm'],
  '063':['wood','woodEdge','metal','bronze'],
  '064':['stone','wall','mortar','wood','woodEdge','metal','bronze'],
 };
 const allowed=roles[id.slice(-3)];return[id,{required:allowed,allowed,note:id==='BUILT-054'?'独立灯笼纸罩为 paper；木骨架、金属座、铜接件、内部暖灯芯按实际格子分开。纸页、布料、玻璃与屏幕 ID 均未借用。':'按实际建筑层次分类：石块/灰缝/承板、实木/收边、金属/铜接件、玻璃/蚀刻/灯芯保持可单独替换；未按颜色借用。'}];
}));

export function configureLegacyBuildingAsset(a:Asset,id:string){
 if(!legacyBuildingRecipes[id])return;
 const box=(min:V3,max:V3)=>({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const empty=(min:V3,max:V3)=>a.openings.push(box(min,max));
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-053'){
  empty([.08,0,.02],[.30,.40,.16]);port('wall-top','legacy-bracket-wall',[.64,0,.78],[0,-1,0],[.32,0,.24]);port('roof-bearing','legacy-roof-bearing',[.64,.80,.44],[0,1,0],[.24,0,.68]);
 }else if(id==='BUILT-054'){
  empty([.16,.36,.18],[.24,.78,.46]);port('wall-mount','legacy-lantern-wall',[.32,.72,.92],[0,0,1],[.24,1.44,0]);
 }else if(id==='BUILT-055'){
  port('top-load','legacy-foundation',[4,.64,4],[0,1,0],[5,0,5]);
 }else if(id==='BUILT-056'){
  empty([.64,.84,1.72],[5.76,2.72,5.8]);port('north-entry','legacy-apron-6400',[3.2,.8,6],[0,0,1],[6.4,.24,0]);
 }else if(id==='BUILT-057'){
  a.source!.stairWell={minM:[2,0,.4],maxM:[4.4,.24,5.6],purpose:'reserved for stair installation; not an always-empty assembled passage'};empty([2.4,.24,.4],[4,2.16,5.6]);port('stair-top','legacy-stair-2400',[3.2,.24,5.6],[0,0,-1],[2.4,.24,0]);for(const x of[.40,6.0])for(const z of[.4,6.0])port('bearing-'+Math.round(x*100)+'-'+Math.round(z*100),'legacy-floor-bearing',[x,0,z],[0,-1,0],[.40,0,.40]);
 }else if(id==='BUILT-058'){
  empty([.52,.14,.04],[1.68,2.60,.52]);empty([2.12,.98,.04],[3.88,2.60,.52]);port('wall-left','legacy-wall-3200',[0,1.6,.28],[-1,0,0],[0,3.2,.56]);port('wall-right','legacy-wall-3200',[4.4,1.6,.28],[1,0,0],[0,3.2,.56]);
 }else if(id==='BUILT-059'){
  port('top-load','legacy-column-700',[.46,3.2,.46],[0,1,0],[.70,0,.70]);
 }else if(id==='BUILT-060'){
  empty([.30,.72,.28],[2.10,2.44,1.4]);port('wall-mount','legacy-bay-window',[1.2,1.4,1.4],[0,0,1],[2.4,2.8,0]);
 }else if(id==='BUILT-061'){
  empty([0,.16,.14],[.08,.24,.22]);port('wall-top','legacy-wall-trim',[1.6,0,.18],[0,-1,0],[3.2,0,.36]);port('end-left','legacy-trim-end',[0,.2,.18],[-1,0,0],[0,.4,.36]);port('end-right','legacy-trim-end',[3.2,.2,.18],[1,0,0],[0,.4,.36]);
 }else if(id==='BUILT-062'){
  for(let i=0;i<10;i++)empty([.36,.48+i*.24,.44+i*.4],[2.04,2.40+i*.24,.76+i*.4]);port('top-walkway','legacy-stair-2400',[1.2,2.64,5.2],[0,0,1],[2.4,.24,0]);port('bottom-walkway','legacy-stair-2400',[1.2,.24,0],[0,0,-1],[2.4,.24,0]);
 }else if(id==='BUILT-063'){
  empty([.26,.48,.04],[.34,.78,.16]);port('hinge-right','legacy-door-side',[1.2,1.2,.08],[1,0,0],[0,.32,.16]);
 }else if(id==='BUILT-064'){
  empty([.48,0,-.2],[1.92,2.72,.72]);port('open-leaf-left','legacy-door-side',[-.04,1.2,-.08],[-1,0,0],[0,.32,.16]);
 }
}
