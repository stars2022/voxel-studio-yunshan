import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

// M015 contains independently replaceable details. Reference walls and glazing
// are installation context, not a reason to duplicate them in every master.
function pier(b:Shapes,x:number,z:number,h:number,t=.4){
 b.b(x,0,z,t,.16,t,b.s.stone);b.b(x+.04,.16,z+.04,t-.08,.16,t-.08,b.s.wall);
 b.b(x+.08,.32,z+.08,t-.16,h-.48,t-.16,b.s.wood);
 for(const y of[.32,h-.28]){b.b(x+.04,y,z+.04,t-.08,.12,t-.08,b.s.metal);b.b(x+.12,y+.04,z+.02,t-.24,.04,.04,b.s.bronze);}
 b.b(x+.04,h-.16,z+.04,t-.08,.16,t-.08,b.s.woodEdge);
}
function frame(b:Shapes,x:number,y:number,z:number,w:number,h:number,t:number){
 for(const xx of[x,x+w-t])b.b(xx,y,z,t,h,.06,b.s.wood);
 for(const yy of[y,y+h-t])b.b(x,yy,z,w,t,.06,b.s.woodEdge);
}
function bracket(b:Shapes,x:number,y:number,z:number){
 // Crossing arms with exposed undersides and a separate diagonal knee.
 b.b(x+.40,y,z+.60,.24,.64,.28,b.s.wood);
 b.beam([x+.52,y+.12,z+.72],[x+.52,y+.68,z+.10],.12,b.s.wood);
 for(let k=0;k<3;k++){
  const w=.48+k*.28,xx=x+.52-w/2,yy=y+.24+k*.20,zz=z+.36-k*.16;
  b.b(xx,yy,zz,w,.16,.18,b.s.wood);b.b(x+.44,yy,zz+.18,.16,.16,.80-(zz-z)-.18,b.s.wood);
  b.b(xx+.04,yy,zz-.04,w-.08,.06,.04,b.s.woodEdge);
  for(const end of[xx,xx+w-.08]){b.b(end,yy+.04,zz-.04,.08,.08,.06,b.s.metal);b.b(end+.02,yy+.06,zz-.06,.04,.04,.04,b.s.bronze);}
 }
 b.b(x,y+.84,z,1.04,.16,.24,b.s.wood);b.b(x,y+.84,z+.68,1.04,.16,.24,b.s.wood);
 b.b(x+.40,y+.80,z+.20,.24,.20,.52,b.s.wood);
}
function hangingArm(b:Shapes){
 b.b(.20,0,.84,.20,1.12,.12,b.s.wood);
 for(const y of[.12,.88]){b.b(.16,y,.82,.28,.12,.16,b.s.metal);b.b(.24,y+.02,.80,.12,.08,.02,b.s.bronze);}
 b.b(.18,.92,.04,.24,.16,.86,b.s.wood);b.b(.20,1.06,.06,.20,.04,.82,b.s.woodEdge);
 b.beam([.30,.48,.84],[.30,.96,.36],.12,b.s.wood);
 b.b(.16,.90,.04,.28,.20,.16,b.s.metal);b.b(.22,.94,.02,.16,.10,.04,b.s.bronze);
 // Shelf: the lantern seats here; the open upper lug captures the same tongue.
 b.b(.28,.68,.06,.10,.08,.20,b.s.bronze);b.b(.28,.68,.22,.10,.24,.04,b.s.bronze);
}
function tileRoof(b:Shapes,w:number,d:number){
 const e=b.pitch;
 // Curved profile is a stepped real section, not a sloped display mesh.
 const top=(z:number)=>.20+Math.round((.22*z/d+.09*Math.max(0,1-z/.24))/e)*e;
 for(let z=0;z<d-e/2;z+=e){const y=top(z);b.b(0,y-.16,z,w,.08,e,b.s.wood);b.b(0,y-.08,z,w,e,e,b.s.waterproofMembrane);b.b(0,y-.06,z,w,.06,e,b.s.roof);}
 for(let x=0;x<w-.1;x+=.6){
  for(let z=0;z<d-.08;z+=.24){const y=top(z),len=Math.min(.28,d-z);b.b(x+.06,y,z,.48,.04,len,b.s.roof);b.b(x+.08,y+.04,z+.02,.04,.04,len-.02,b.s.roof);b.b(x+.48,y+.04,z+.02,.04,.04,len-.02,b.s.roof);b.b(x+.12,y+.02,z,.36,.02,.04,b.s.roof);}
  const y=top(0)-.02;b.cylinder(x+.30,y,-.08,.16,.12,b.s.roof,0,'z');b.cylinder(x+.30,y,-.10,.12,.02,b.s.roof,0,'z');b.hui(x+.24,y-.06,-.12,.12,.12,b.s.roof,e);
  b.b(x+.22,0,.06,.16,.16,.68,b.s.wood);b.b(x+.22,.04,-.02,.16,.08,.12,b.s.woodEdge);
 }
 for(const x of[0,w-.08]){b.b(x,.08,0,.08,.16,d,b.s.metal);b.b(x,.12,-.08,.08,.12,.10,b.s.bronze);}
 b.b(0,.08,d-.08,w,.24,.08,b.s.wood);b.b(.08,.32,d-.08,w-.16,.04,.08,b.s.metal);
}

export const joineryRecipes:Record<string,AtlasRecipe>={
 'BUILT-065':{size:[2.48,1.44,.64],pitch:.02,mount:'insert',features:'可拆三面细木棂：三分正面、双横棂、U形两侧返边、角部回纹与独立铜锁片',limits:'仅木棂外挂件，参考图的玻璃、粗柱和石台不重复并入。正面普通三分；返边采用直角U形，未重现参考图的斜向折面。固定作者尺寸，宽窗3–12分与旧游戏 facade layout 尚未接入。',draw:(b,w,h,d)=>{
  b.part('三分正面细框与双横棂',()=>{frame(b,0,0,0,w,h,.04);for(const x of[.82,1.64])b.b(x,0,0,.04,h,.06,b.s.wood);for(const y of[.18,1.22])b.b(.04,y,-.02,w-.08,.04,.06,b.s.woodEdge);});
  b.part('两面返窗细棂和连续端边',()=>{for(const x of[0,w-.04]){b.b(x,0,.06,.04,.04,d-.06,b.s.woodEdge);b.b(x,h-.04,.06,.04,.04,d-.06,b.s.woodEdge);for(const z of[.30,d-.04])b.b(x,.04,z,.04,h-.08,.04,b.s.wood);for(const y of[.18,1.22])b.b(x,y,.04,.04,.04,d-.04,b.s.woodEdge);}});
  b.part('上角穿插格纹和小回字',()=>{for(const x of[.10,.92,1.74]){b.b(x,.04,0,.04,.26,.06,b.s.wood);b.b(x+.50,1.14,0,.04,.26,.06,b.s.wood);b.b(x,1.14,0,.04,.26,.06,b.s.wood);b.b(x,1.14,-.02,.54,.04,.06,b.s.wood);}});
  b.part('六处金属夹、铜销与装配舌',()=>{for(const x of[.02,1.22,w-.06])for(const y of[0,h-.06]){b.b(x,y,0,.04,.06,.08,b.s.metal);b.b(x,y+.02,-.02,.04,.02,.02,b.s.bronze);}b.b(1.16,0,.08,.16,.08,.10,b.s.wood);});
 }},
 'BUILT-066':{size:[3.2,1.24,.92],pitch:.02,features:'错缝石基浮雕：实体石芯、两行近面错缝石、退层线脚、真凹槽回纹和铜接件',limits:'独立近景石基片，正面分块与雕刻是真实体素；不是完整PBR石材。作者固定6列2行节奏，未实现旧代码30列上限、邻近相机生成或seed色差。',draw:(b,w,h,d)=>{
  b.part('连续实体石芯与双层基脚',()=>{b.b(0,0,0,w,.12,d,b.s.stone);b.b(.06,.12,.06,w-.12,.12,d-.12,b.s.wall);b.b(.12,.24,.12,w-.24,.80,d-.24,b.s.stone);b.b(.04,1.04,.04,w-.08,.12,d-.08,b.s.wall);b.b(0,1.16,0,w,.08,d,b.s.wall);});
  b.part('两行错缝石面与独立砂浆背层',()=>{b.b(.20,.30,.08,2.8,.64,.04,b.s.mortar);for(let row=0;row<2;row++)for(let i=0;i<7;i++){const x=Math.max(.2,.2+i*.46-(row%2)*.22),end=Math.min(3,.2+(i+1)*.46-(row%2)*.22);if(end>x)b.b(x+.02,.32+row*.32,.04,end-x-.02,.30,.08,b.s.wall);}});
  b.part('三段凹刻面板、立体回纹与边线',()=>{for(const x of[.32,1.2,2.08]){b.b(x,.42,.02,.76,.44,.06,b.s.stone);b.b(x+.04,.46,0,.68,.36,.04,b.s.wall);b.hui(x+.16,.50,-.02,.40,.28,b.s.stone,.02);}for(const y of[.28,.96])b.b(.20,y,0,2.8,.04,.12,b.s.wall);});
  b.part('两侧窄金属护角与铜扣',()=>{for(const x of[.12,2.92]){b.b(x,.28,.02,.16,.72,.10,b.s.metal);for(const y of[.36,.80])b.b(x+.04,y,0,.08,.10,.02,b.s.bronze);}});
 }},
 'BUILT-067':{size:[3.2,2.8,.64],pitch:.02,features:'独立窗开间柱梁：全高木柱、叠石脚、退层头梁、同柱短斜托和可接窗下护板',limits:'母版只含梁柱框，窗棂/护板单独连接，玻璃尚未装入。作者净开间2.48m，不能当作填死的墙片；未接入旧游戏梁柱生成。',draw:(b,w,h,d)=>{
  b.part('双木柱、叠石脚与金属柱靴',()=>{for(const x of[0,w-.4])pier(b,x,.12,h,.4);});
  b.part('分层木头梁和底部窗台承枋',()=>{b.b(.08,2.48,.12,w-.16,.20,.40,b.s.wood);b.b(.08,2.68,.10,w-.16,.08,.44,b.s.woodEdge);b.b(.32,.08,.16,w-.64,.08,.32,b.s.wood);b.b(.32,.16,.16,w-.64,.04,.06,b.s.woodEdge);});
  b.part('终止在两侧同柱的短斜托',()=>{b.beam([.28,2.12,.32],[.12,2.52,.32],.10,b.s.wood);b.beam([w-.28,2.12,.32],[w-.12,2.52,.32],.10,b.s.wood);});
  b.part('梁肩压箍与独立铜榫件',()=>{for(const x of[.08,w-.32]){b.b(x,2.48,.08,.24,.24,.48,b.s.metal);b.b(x+.06,2.54,.06,.12,.12,.04,b.s.bronze);}b.b(1.52,2.50,.10,.16,.10,.02,b.s.bronze);});
 }},
 'BUILT-068':{size:[2.48,.84,.20],pitch:.02,mount:'insert',features:'可拆窗下护板：三块攒边浅石嵌芯、真实阴槽回纹、木竖枨、金属角夹和铜销',limits:'仅窗下护板，不焊入参考中的玻璃和全高柱。石质嵌芯是作者选择；限定安装于住宅/工坊/农舍/书院的元数据，没有运行时楼层用途判定。',draw:(b,w,h,d)=>{
  b.part('连续木背框、顶底枨与四道立枨',()=>{for(const y of[0,h-.08])b.b(0,y,0,w,.08,d,b.s.woodEdge);for(const x of[0,.80,1.60,2.40])b.b(x,.08,0,.08,h-.16,d,b.s.wood);});
  b.part('三块浅石芯及真退进阴槽',()=>{for(const x of[.08,.88,1.68]){b.b(x,.08,.08,.72,.68,.10,b.s.stone);b.b(x+.04,.12,.06,.64,.60,.12,b.s.wall);for(const y of[.12,.68])b.b(x+.04,y,.04,.64,.04,.04,b.s.wall);for(const xx of[x+.04,x+.64])b.b(xx,.12,.04,.04,.56,.04,b.s.wall);}});
  b.part('石质回纹浮雕独立于木框',()=>{for(const x of[.28,1.08,1.88])b.hui(x,.28,.04,.32,.28,b.s.stone,.02);});
  b.part('四角夹与固定铜销',()=>{for(const x of[0,w-.08])for(const y of[0,h-.08]){b.b(x,y,0,.08,.08,.20,b.s.metal);b.b(x+.02,y+.02,-.02,.04,.04,.04,b.s.bronze);}});
 }},
 'BUILT-069':{size:[.96,1.56,1.04],pitch:.02,mount:'wall',features:'墙侧固定小牌：薄木牌框、两只真实挂环、出挑木臂、铜锁件和非发光实体牌面',limits:'牌面木底加物理印墨占位回纹，未声称读取游戏真实店名；牌面不随镜头转向。安装墙柱仅是参考上下文，不并入；静态挂环无摆动。',draw:(b,w)=>{
  b.part('壁侧背条、出挑木臂及斜托',()=>{b.b(.40,.48,.92,.16,1.08,.12,b.s.wood);b.b(.40,1.40,.08,.16,.16,.90,b.s.woodEdge);b.beam([.48,1.04,.96],[.48,1.44,.48],.12,b.s.wood);});
  b.part('宽展挂梁与两只开口挂环',()=>{b.b(.06,1.38,.04,.84,.16,.16,b.s.wood);for(const x of[.16,.72]){b.b(x,1.12,.08,.08,.26,.08,b.s.bronze);b.b(x+.02,1.18,.08,.04,.12,.08,0);}for(const x of[.06,.80]){b.b(x,1.38,.02,.10,.16,.20,b.s.metal);b.b(x+.02,1.44,0,.06,.06,.02,b.s.bronze);}});
  b.part('木牌窄框和下沉木芯',()=>{for(const x of[.16,.72])b.b(x,1.06,.04,.08,.08,.12,b.s.metal);frame(b,0,.16,0,w,.98,.08);b.b(.08,.24,.04,w-.16,.82,.04,b.s.wood);b.b(.08,.24,.02,w-.16,.02,.02,b.s.woodEdge);});
  b.part('实体油墨回纹、牌框铜夹及壁侧固定片',()=>{b.hui(.28,.40,.02,.40,.44,b.s.printedMark,.02);for(const y of[.62,1.28]){b.b(.36,y,.90,.24,.12,.14,b.s.metal);b.b(.42,y+.04,.88,.12,.04,.02,b.s.bronze);}b.b(.4,.14,0,.16,.08,.08,b.s.bronze);});
 }},
 'BUILT-070':{size:[.60,1.12,.98],pitch:.02,mount:'wall',features:'独立贴墙灯笼杆：木背枋、阶梯斜托、铜锁接头、承托舌和独立灯笼接口',limits:'仅灯杆，不重复包含BUILT-071或参考墙柱；通过承座与灯笼挂环接合。墙体碰撞带和局部照明尚未接入游戏。',draw:(b)=>{
  b.part('木背枋、斜撑和独立横杆',()=>hangingArm(b));
  b.part('木臂顶层收边',()=>b.b(.18,1.08,.08,.24,.04,.72,b.s.woodEdge));
  b.part('背枋下榫与阶梯锁座',()=>{b.b(.16,0,.84,.28,.08,.14,b.s.metal);b.b(.22,.02,.82,.16,.04,.04,b.s.bronze);});
  b.part('挂臂侧面的铜插销',()=>{for(const z of[.28,.66])b.b(.14,.96,z,.06,.08,.08,b.s.bronze);});
 }},
 'BUILT-071':{size:[.56,1.44,.56],pitch:.02,features:'分件木框纸罩灯笼：四片纸罩、四角木骨、上下金属帽、内部灯芯、铜挂环与织物流苏',limits:'母版为独立可挂灯笼，杆由BUILT-070复用。灯罩是纸、穗是纤维、光源是内部电灯芯，均不借玻璃。透明混合不等于纸张透射或已照亮墙地；静态不含摆动。',draw:(b)=>{
  b.part('上下木盘、金属帽和铜角钉',()=>{for(const y of[.24,1.10]){b.b(0,y,0,.56,.08,.56,b.s.metal);b.b(.04,y+.08,.04,.48,.04,.48,b.s.woodEdge);for(const x of[.02,.50])for(const z of[.02,.50])b.b(x,y+.02,z,.04,.04,.04,b.s.bronze);}});
  b.part('细木骨、上下一体格边',()=>{for(const x of[.04,.46])for(const z of[.04,.46])b.b(x,.32,z,.06,.78,.06,b.s.wood);for(const y of[.42,.96]){for(const z of[.06,.48])b.b(.08,y,z,.40,.04,.02,b.s.woodEdge);for(const x of[.06,.48])b.b(x,y,.08,.02,.04,.40,b.s.woodEdge);}for(const x of[.16,.36])for(const z of[.06,.48])for(const y of[.32,1.0])b.b(x,y,z,.02,.10,.02,b.s.wood);});
  b.part('纸罩、内部灯芯和电源座',()=>{for(const z of[.10,.44])b.b(.10,.34,z,.36,.76,.02,b.s.lanternPaper);for(const x of[.10,.44])b.b(x,.34,.12,.02,.76,.32,b.s.lanternPaper);b.b(.22,.32,.22,.12,.08,.12,b.s.metal);b.b(.26,.40,.26,.04,.64,.04,b.s.warm);});
  b.part('帽沿阶梯角鞍与外露铜销',()=>{for(const y of[.26,1.12])for(const x of[.02,.42])for(const z of[-.02,.52]){b.b(x,y,z,.12,.10,.04,b.s.metal);b.b(x+.02,y+.02,z===-.02?-.04:.56,.06,.06,.02,b.s.bronze);}});
  b.part('铜挂环开口和流苏独立底结',()=>{b.b(.20,1.22,.20,.04,.10,.16,b.s.bronze);b.b(.20,1.32,.20,.16,.12,.16,b.s.bronze);b.b(.24,1.36,.20,.08,.04,.16,0);b.b(.20,.20,.20,.16,.04,.16,b.s.bronze);b.b(.24,.14,.24,.08,.06,.08,b.s.lanternTassel);for(const x of[.22,.26,.30])b.b(x,0,.26,.02,.16,.04,b.s.lanternTassel);});
 }},
 'BUILT-072':{size:[1.60,2.56,1.28],pitch:.02,features:'亭柱脚与斗拱细部：双层石础、短示例柱芯、三层交叠出挑栱、斜托和开放承檐枋',limits:'一根亭柱的细部母版，通过四次实例化复用；屋瓦由BUILT-073另接，不含整个屋顶或填满亭间的墙。参考未示出的背面作结构补全。',draw:(b)=>{
  b.part('两层石柱脚和阴刻面',()=>{b.b(.38,0,.64,.84,.16,.64,b.s.stone);b.b(.42,.16,.68,.76,.28,.56,b.s.wall);b.hui(.56,.22,.66,.48,.16,b.s.stone,.02);});
  b.part('木柱芯、肩箍和铜销',()=>{b.b(.58,.44,.76,.44,1.12,.36,b.s.wood);for(const y of[.44,1.32]){b.b(.54,y,.72,.52,.12,.44,b.s.metal);b.b(.68,y+.04,.70,.24,.04,.04,b.s.bronze);}});
  b.part('三层交叠斗栱与斜托',()=>b.shifted([.28,1.4,.20],c=>bracket(c,0,0,0)));
  b.part('横向顶部开放承檐枋与端部金属鞍',()=>{for(const z of[.20,.88])b.b(0,2.40,z,1.60,.16,.24,b.s.wood);for(const x of[.08,1.40]){b.b(x,2.4,.2,.12,.16,.92,b.s.metal);b.b(x+.02,2.5,.28,.08,.06,.08,b.s.bronze);}});
 }},
 'BUILT-073':{size:[3,.58,1.28],pitch:.02,features:'真实飞檐瓦口：0.6m节奏五道凹瓦、前端圆瓦当回纹、曲线阶梯截面、木椽、防水膜与金属侧收口',limits:'独立3m局部檐边，五组0.6m瓦口；依真实高度端口拼接。瓦面截面由20mm体素逐级构成，参考弧面近似为阶梯；不生成漂浮的第二屋顶。',draw:(b,w,h,d)=>{
  b.part('木檐基层、防水膜和阶梯瓦面',()=>tileRoof(b,w,d));
  b.part('两端石质封头和凹入端纹',()=>{for(const x of[0,2.84]){b.b(x,.08,-.08,.16,.36,.24,b.s.wall);b.b(x+.04,.16,-.10,.08,.16,.02,b.s.stone);b.b(x+.06,.20,-.12,.04,.08,.04,b.s.wall);}});
  b.part('后侧接檐木枋与金属固定扣',()=>{b.b(.16,.12,1.16,2.68,.10,.12,b.s.wood);for(const x of[.24,1.44,2.64]){b.b(x,.14,1.24,.12,.16,.04,b.s.metal);b.b(x+.04,.18,1.26,.04,.08,.02,b.s.bronze);}});
  b.part('五个椽端木收口',()=>{for(let x=.22;x<3;x+=.6)b.b(x,.02,0,.16,.10,.08,b.s.woodEdge);});
 }},
 'BUILT-074':{size:[3,1.24,1.28],pitch:.02,mount:'wall',features:'成对檐下斗栱：双组交错木托、同柱斜撑、真实空隙、连续承枋和背侧金属抱箍',limits:'成对支托母版，不将参考墙柱及两块屋面焊入。底部背枋实际承压，顶部可接BUILT-073；未自动匹配旧游戏 roofEdge。',draw:(b,w)=>{
  b.part('后侧连续木背枋及双组短竖托',()=>{b.b(.24,0,.88,w-.48,.20,.32,b.s.wood);for(const x of[.52,2.24])b.b(x,0,.88,.24,.44,.32,b.s.wood);});
  b.part('左侧交叠栱与斜托',()=>b.shifted([.12,.20,.12],c=>bracket(c,0,0,0)));
  b.part('右侧交叠栱与斜托',()=>b.shifted([1.84,.20,.12],c=>bracket(c,0,0,0)));
  b.part('顶部连续承枋与可见铜锁件',()=>{for(const z of[.12,.88])b.b(0,1.20,z,w,.04,.24,b.s.woodEdge);for(const x of[.52,2.24]){b.b(x,.04,.84,.24,.16,.40,b.s.metal);b.b(x+.06,.10,.82,.12,.08,.04,b.s.bronze);}});
 }},
 'BUILT-088':{size:[6.8,4.0,3.2],pitch:.04,features:'南侧柱廊门盖：六根木柱、六座石脚、真实连梁与斜撑、分层瓦檐屋盖和门前开放空间',limits:'按作者楼宽10m×0.68生成6.8m门盖，柱高/进深为作者尺寸。六柱来自清单；参考的门扇和背墙不属于本母版。40mm精度，不改原游戏v4构件或FloorPlan。',draw:(b,w,h,d)=>{
  b.part('六根实木柱与六座分层石脚',()=>{for(const x of[.16,6.00])for(const z of[.16,1.32,2.48]){b.b(x,0,z,.64,.16,.64,b.s.stone);b.b(x+.04,.16,z+.04,.56,.40,.56,b.s.wall);b.b(x+.12,.56,z+.12,.40,2.76,.40,b.s.wood);for(const y of[.56,3.04]){b.b(x+.08,y,z+.08,.48,.16,.48,b.s.metal);b.b(x+.20,y+.04,z+.04,.24,.08,.08,b.s.bronze);}}});
  b.part('六柱同轴连梁和短斜撑',()=>{for(const z of[.28,1.44,2.60])b.b(.28,3.20,z,6.24,.24,.40,b.s.wood);for(const x of[.28,6.12]){b.b(x,3.20,.28,.40,.24,2.72,b.s.wood);for(const z of[.40,2.72]){b.beam([x+.2,2.80,z],[x===.28?x+.72:x-.32,3.32,z],.16,b.s.wood);}}});
  b.part('木屋面承板、防水膜、瓦面与分道瓦槽',()=>{b.b(0,3.44,0,w,.16,d,b.s.wood);b.b(0,3.60,0,w,.04,d,b.s.waterproofMembrane);b.b(0,3.64,0,w,.08,d,b.s.roof);for(let x=.12;x<w-.16;x+=.40)for(let z=.08;z<d-.12;z+=.48){b.b(x,3.72,z,Math.min(.32,w-x),.04,Math.min(.52,d-z),b.s.roof);b.b(x+.04,3.76,z+.04,.04,.04,Math.min(.48,d-z-.04),b.s.roof);}for(const z of[0,3.04])b.b(0,3.72,z,w,.24,.16,b.s.roof);});
  b.part('木檐下压条、端部铜套和六座独立暖灯',()=>{for(const z of[0,d-.08])b.b(.16,3.32,z,w-.32,.12,.08,b.s.woodEdge);for(const x of[.04,6.56])for(const z of[.04,2.96]){b.b(x,3.56,z,.20,.44,.20,b.s.metal);b.b(x+.04,3.68,z-.04,.12,.16,.08,b.s.bronze);}for(const x of[.4,6.24])for(const z of[.20,1.36,2.52]){b.b(x,1.64,z,.16,1.0,.12,b.s.bronze);b.b(x+.04,1.76,z-.04,.08,.76,.08,b.s.warm);}});
 }},
 'BUILT-089':{size:[2.4,20,2.4],pitch:.10,features:'六层巨柱单元：六段3.2m层高、实体混凝土芯、分片浅石覆面、木竖枋、六道承楼金属鞍和独立暖灯',limits:'单根六层巨柱母版，作者层高3.2m加底/顶帽共20m；六根立面巨柱与五个六层体量通过实例复用，不计成额外母版。100mm精度，与20/40mm构件不能直接connect；0.2m世界网格和真实楼层系统未接入。',draw:(b)=>{
  b.part('两层完整石基与实体结构芯',()=>{b.b(0,0,0,2.4,.2,2.4,b.s.stone);b.b(.2,.2,.2,2,.2,2,b.s.wall);b.b(.5,.4,.5,1.4,19.2,1.4,b.s.structuralConcrete);b.b(.2,19.6,.2,2,.4,2,b.s.wall);});
  b.part('六层独立石覆面及木竖枋',()=>{for(let k=0;k<6;k++){const y=.4+k*3.2;for(const z of[.4,1.9])b.b(.5,y+.2,z,1.4,2.8,.1,b.s.wall);for(const x of[.4,1.9])b.b(x,y+.2,.5,.1,2.8,1.4,b.s.wall);for(const x of[.4,1.8])for(const z of[.4,1.8])b.b(x,y,z,.2,3.2,.2,b.s.wood);}});
  b.part('六道金属承楼鞍、铜锁接和石压帽',()=>{for(let k=0;k<6;k++){const y=3.3+k*3.2;b.b(.2,y,.2,2,.3,2,b.s.metal);for(const x of[0,2])b.b(x,y+.1,.8,.4,.2,.8,b.s.metal);for(const x of[.3,1.9])for(const z of[.2,2.0])b.b(x,y+.1,z,.2,.1,.1,b.s.bronze);}});
  b.part('各层铜窄灯框与独立内芯',()=>{for(let k=0;k<6;k++){const y=.9+k*3.2;for(const z of[.2,2.0]){b.b(1,y,z,.4,1.6,.2,b.s.bronze);b.b(1.1,y+.1,z===.2?.1:2.2,.2,1.4,.1,b.s.warm);}for(const z of[.4,1.9])b.b(.8,y+.6,z, .1,.4,.1,b.s.metal);}});
 }},
};

const roles:Record<string,string[]>={
 '065':['wood','woodEdge','metal','bronze'],'066':['stone','wall','mortar','metal','bronze'],
 '067':['stone','wall','wood','woodEdge','metal','bronze'],'068':['wood','woodEdge','stone','wall','metal','bronze'],
 '069':['wood','woodEdge','metal','bronze','printedMark'],'070':['wood','woodEdge','metal','bronze'],
 '071':['wood','woodEdge','metal','bronze','lanternPaper','lanternTassel','warm'],
 '072':['stone','wall','wood','woodEdge','metal','bronze'],'073':['wood','woodEdge','roof','stone','wall','waterproofMembrane','metal','bronze'],
 '074':['wood','woodEdge','metal','bronze'],'088':['stone','wall','wood','woodEdge','waterproofMembrane','roof','metal','bronze','warm'],
 '089':['stone','wall','structuralConcrete','wood','metal','bronze','warm'],
};
export const joineryMaterialRules=Object.fromEntries(Object.keys(joineryRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:id==='BUILT-071'?'纸罩/纤维流苏/内灯芯/木骨/金属帽/铜环逐格独立，流苏不借红按钮、红果实或电灯。':id==='BUILT-069'?'木牌框、木牌芯、实体印墨与铜挂环独立；牌面不是屏幕，不发光。':'石块/砂浆/结构芯/实木/瓦/防水膜/金属/铜件/灯芯依据实际构造分类；只包含本清单条目的实体构造。'}]));

export function configureJoineryAsset(a:Asset,id:string){
 if(!joineryRecipes[id])return;
 const box=(min:V3,max:V3)=>({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const empty=(min:V3,max:V3)=>a.openings.push(box(min,max));
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-065'){empty([.18,.28,0],[.72,1.12,.06]);port('sill','joinery-lattice',[1.24,0,.10],[0,-1,0],[2.48,0,.20]);a.source!.divisions=3;a.source!.horizontalBars=2;}
 if(id==='BUILT-066')port('top','joinery-plinth',[1.60,1.24,.46],[0,1,0],[3.2,0,.92]);
 if(id==='BUILT-067'){a.source!.windowSocket={minM:[.36,.20,.12],maxM:[2.84,2.48,.84],purpose:'reserved for separate panel/lattice; not an always-empty passage'};port('panel','joinery-panel',[1.6,.20,.30],[0,1,0],[2.48,0,.20]);}
 if(id==='BUILT-068'){port('bottom','joinery-panel',[1.24,0,.10],[0,-1,0],[2.48,0,.20]);port('lattice','joinery-lattice',[1.24,.84,.10],[0,1,0],[2.48,0,.20]);a.source!.allowedUses=['home','workshop','farm','school'];}
 if(id==='BUILT-069'){empty([.18,1.18,.08],[.22,1.30,.16]);port('wall','joinery-wall-plaque',[.48,1.02,1.04],[0,0,1],[.24,1.08,0]);}
 if(id==='BUILT-070'){port('wall','joinery-lantern-arm',[.30,.56,.98],[0,0,1],[.28,1.12,0]);port('lantern','joinery-lantern-seat',[.30,.76,.14],[0,1,0],[.16,0,.16]);}
 if(id==='BUILT-071'){empty([.14,.50,.14],[.22,.90,.42]);port('hanger','joinery-lantern-seat',[.28,1.32,.28],[0,-1,0],[.16,0,.16]);}
 if(id==='BUILT-072'){empty([.08,.60,.04],[.40,1.50,.60]);port('roof','joinery-roof',[.8,2.56,.64],[0,1,0],[1.60,0,1.28]);}
 if(id==='BUILT-073'){port('column-seat','joinery-roof',[1.5,0,.64],[0,-1,0],[1.60,0,1.28]);port('bottom','joinery-eave-pair',[1.5,0,.64],[0,-1,0],[3,0,1.28]);for(const [name,x,normal]of[['left',0,-1],['right',3,1]]as const)port(name,'joinery-eave-end',[x,.28,.64],[normal,0,0],[0,.56,1.28]);}
 if(id==='BUILT-074'){empty([1.20,.24,.04],[1.78,1.18,.80]);port('roof','joinery-eave-pair',[1.5,1.24,.64],[0,1,0],[3,0,1.28]);port('wall','joinery-bracket-bearing',[1.50,0,1.04],[0,-1,0],[2.52,0,.32]);}
 if(id==='BUILT-088'){empty([1.12,0,-.40],[5.68,2.64,3.6]);a.source!.columnCount=6;a.source!.authoredBuildingWidthM=10;port('roof-top','landmark-canopy',[3.4,4,1.6],[0,1,0],[6.8,0,3.2]);}
 if(id==='BUILT-089'){a.source!.floorCount=6;a.source!.floorHeightM=3.2;a.source!.instancePlan={columnsPerSixFloorMass:6,sixFloorMasses:5,gameIntegration:false};for(let k=0;k<6;k++)port('floor-'+(k+1),'giant-floor-bearing',[0,3.6+k*3.2,1.2],[-1,0,0],[0,.2,.8]);port('stack-bottom','giant-column-stack',[1.2,0,1.2],[0,-1,0],[2.4,0,2.4]);port('stack-top','giant-column-stack',[1.2,20,1.2],[0,1,0],[2.4,0,2.4]);}
}
