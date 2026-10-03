import {Shapes} from './shapes';
import type {AtlasRecipe} from './atlas-life';
import type {Asset,V3} from '../core/types';

// M017: dimensions below are authored metres. A reference tile is not a scale drawing.
function masonry(b:Shapes,x:number,y:number,z:number,w:number,h:number,d:number){
 const e=b.pitch;b.b(x,y,z,w,h,d,b.s.mortar);
 for(let yy=0;yy<h-e;yy+=.4)for(let xx=0;xx<w-e;xx+=.8){
  const ww=Math.min(.8-e,w-xx-e),hh=Math.min(.4-e,h-yy-e);
  b.b(x+xx+e,y+yy+e,z,ww,hh,d,b.s.wall);
 }
}
function stonePost(b:Shapes,x:number,z:number,t:number,h:number,entry=false){
 b.b(x,0,z,t,.24,t,b.s.stone);masonry(b,x+.04,.24,z+.04,t-.08,.48,t-.08);
 b.b(x+.12,.72,z+.12,t-.24,h-1.12,t-.24,b.s.wood);
 masonry(b,x+.24,.80,z+.08,t-.48,h-1.36,t-.16);
 for(const y of[.72,h-.56]){b.b(x+.08,y,z+.08,t-.16,.20,t-.16,b.s.metal);for(const xx of[x+.08,x+t-.24])b.b(xx,y+.04,z+.04,.16,.12,.08,b.s.bronze);}
 b.b(x+.16,h-.36,z+.16,t-.32,.24,t-.32,b.s.wall);b.b(x+.24,h-.12,z+.24,t-.48,.12,t-.48,b.s.wall);
 b.hui(x+.28,1,z+.04,t-.56,.48,b.s.stone);
 for(const xx of entry?[x+.12,x+t-.28]:[x+.12]){b.b(xx,1.32,z,.16,.88,.16,b.s.metal);b.b(xx+.04,1.40,z-.04,.08,.72,.04,b.s.warm);b.b(xx,1.32,z-.04,.16,.08,.04,b.s.bronze);}
}
function windowBay(b:Shapes,x:number,y:number,w:number,h:number,z:number,stone=false){
 const e=b.pitch;
 b.b(x,y,z,w,.24,.64,stone?b.s.wall:b.s.metal);b.b(x,y+h-.24,z,w,.24,.64,stone?b.s.wall:b.s.metal);
 for(const xx of[x,x+w-.16]){b.b(xx,y+.24,z+.12,.16,h-.48,.40,b.s.wood);b.b(xx,y+.24,z+.08,.04,h-.48,.48,b.s.metal);}
 b.b(x+.16,y+.24,z+.28,w-.32,h-.48,e,b.s.glass);
 for(const yy of[y+.24,y+h-.40]){b.b(x+.16,yy,z+.24,w-.32,.08,.12,b.s.metal);b.b(x+.16,yy+.08,z+.28,w-.32,.04,.04,b.s.rubber);}
 for(const xx of[x+.16,x+w-.20])b.b(xx,y+.32,z+.24,.04,h-.72,.12,b.s.metal);
 b.b(x+.16,y+h-.72,z+.24,w-.32,.08,.12,b.s.woodEdge);
 b.b(x+.16,y+.16,z,w-.32,.08,.12,b.s.metal); // proud sill and drain path
 for(const xx of[x+.24,x+w-.32]){b.b(xx,y+.12,z,.08,.04,.32,0);b.b(xx,y+h-.20,z-.04,.08,.12,.04,b.s.bronze);}
}
function screen(b:Shapes,x:number,y:number,z:number,w:number,h:number,boat=false){
 const e=b.pitch;
 b.b(x,y,z,w,h,.24,b.s.metal);b.b(x+.08,y+.08,z,w-.16,h-.16,.08,b.s.screen);
 b.b(x+.08,y+.08,z-e,w-.16,h-.16,e,b.s.glass);
 for(const xx of[x,x+w-.08])for(const yy of[y,y+h-.08])b.b(xx,yy,z-e,.08,.08,e,b.s.bronze);
 const ink=b.s.displayGlyph,white=b.s.displayWhite;
 const pixel=(xx:number,yy:number,ww:number,hh:number,m:number)=>{const x0=Math.max(xx,x+.08),y0=Math.max(yy,y+.08);b.b(x0,y0,z-.08,Math.min(xx+ww,x+w-.08)-x0,Math.min(yy+hh,y+h-.08)-y0,.04,m);};
 if(boat){
  pixel(x+.20,y+.24,w*.42,.08,ink);pixel(x+.28,y+.32,w*.30,.12,ink);pixel(x+.40,y+.44,.24,.08,white);
  for(let k=0;k<3;k++){pixel(x+w*.66,y+.24+k*.16,w*.22,.04,ink);pixel(x+w*.62,y+.24+k*.16,.04,.04,white);}
 }else{
  const cx=x+w/2;b.b(cx-.04,y+h*.40,z-.08,.08,h*.32,.04,ink);b.b(cx-.20,y+h*.58,z-.08,.40,.04,.04,white);
  b.b(cx-.24,y+h*.40,z-.08,.48,.04,.04,ink);for(const dx of[-.24,.20])b.b(cx+dx,y+h*.40,z-.08,.04,.16,.04,ink);
  for(let k=0;k<3;k++)for(let j=0;j<4;j++)b.b(x+.16+j*.12,y+.16+k*.12+(j%2)*.04,z-.08,.12,.04,.04,ink);
 }
 // Pixels are cells bonded to the glass, not floating in front of it.
 b.b(x+.08,y+.08,z-.04,w-.16,h-.16,.04,b.s.glass);
 // Restore glyphs on the front layer after laying the protective backing.
 // At pitch 40mm z-.08 is adjacent to that layer; at 20mm fill the intervening layer.
 if(e===.02)b.b(x+.08,y+.08,z-.06,w-.16,h-.16,.02,b.s.glass);
 for(let yy=y+.12;yy<y+h-.12;yy+=.16)b.b(x+w-.08,yy,z+.24,.08,.08,.04,b.s.metal);
 b.b(x+.08,y+.08,z+.24,w-.24,h-.16,.04,b.s.polymerDark);
}
function shortRoof(b:Shapes,w:number,d:number,base:number){
 const e=b.pitch;
 for(let z=0;z<d-e/2;z+=e){const q=Math.abs(z+e/2-d/2)/(d/2),y=Math.round((base+.64*(1-q)+.20*Math.max(0,(q-.76)/.24))/e)*e;
  b.b(0,y,z,w,.08,e,b.s.wood);b.b(0,y+.08,z,w,.04,e,b.s.waterproofMembrane);b.b(0,y+.12,z,w,.08,e,b.s.roof);
  for(let x=.08;x<w-.08;x+=.32)b.b(x,y+.20,z,.08,.04,e,b.s.roof);
 }
 b.b(0,base+.76,d/2-.12,w,.16,.24,b.s.roof);
 for(const x of[0,w-.16]){b.b(x,base+.76,d/2-.12,.16,.24,.24,b.s.metal);b.b(x+.04,base+1,d/2-.08,.08,.08,.16,b.s.bronze);}
}

export const waterfrontRecipes:Record<string,AtlasRecipe>={
 'BUILT-104':{size:[2.4,3.6,4],pitch:.04,features:'门侧装卸石台：分层承台、真石铺缝、侧框、四根短柱与装卸端口',limits:'清单0.2w×3.6×4m按作者楼宽12m落为2.4×3.6×4m实体台，不缩成图中的矮桌；不含箱堆。四组砌石承墩之间保留真实架空空间，外接楼梯另装。',draw:(b,w,h,d)=>{
  b.part('四组分缝砌石承墩和真实架空空间',()=>{for(const x of[0,w-.56])for(const z of[0,d-.56]){b.b(x,0,z,.56,.24,.56,b.s.stone);masonry(b,x,.24,z,.56,2.80,.56);b.b(x,3.04,z,.56,.16,.56,b.s.stone);}for(const z of[.08,d-.40])b.b(0,3.20,z,w,.16,.32,b.s.stone);for(const x of[.08,w-.40])b.b(x,3.20,0,.32,.16,d,b.s.stone);});
  b.part('独立混凝土承板、砂浆与铺块',()=>{b.b(0,3.36,0,w,.12,d,b.s.structuralConcrete);b.b(0,3.48,0,w,.04,d,b.s.mortar);for(let x=.04;x<w;x+=.4)for(let z=.04;z<d;z+=.4)b.b(x,3.52,z,.36,.08,.36,b.s.wall);});
  b.part('铺装压边与真实滴水槽',()=>{for(const z of[0,d-.08])b.b(0,3.52,z,w,.08,.08,b.s.wall);for(const x of[0,w-.08])b.b(x,3.52,0,.08,.08,d,b.s.wall);b.b(.16,3.36,.08,w-.32,.04,.04,0);});
  b.part('木金属边框与铜角',()=>{for(const x of[0,w-.24])for(const z of[0,d-.24]){b.b(x,.24,z,.24,3.04,.24,b.s.wood);for(const y of[.24,3.12]){b.b(x,y,z,.24,.16,.24,b.s.metal);b.b(x+.04,y+.04,z-.04,.16,.08,.04,b.s.bronze);}}});
 }},
 'BUILT-105':{size:[.8,8.4,.8],pitch:.04,features:'通高石壁柱：0.8m柱宽、独立木框、石嵌面、基脚与压顶、暖色检修灯',limits:'单根0.8m宽通高母柱，作者高8.4m。2/4列由放置实例实现；未将重复柱算成新资产，尚未接入原楼高函数。',draw:b=>{
  b.part('分层石足、木框与高石芯',()=>stonePost(b,0,0,.8,8.4));
  b.part('后侧连续安装背轨',()=>b.b(.24,.8,.76,.32,7.04,.04,b.s.metal));
  b.part('逐层压条与石分缝',()=>{for(const y of[2.8,5.6])b.b(.20,y,.04,.40,.08,.04,b.s.metal);});
  b.part('两只背部铜安装插口',()=>{for(const y of[1.2,7.2]){b.b(.24,y,.72,.32,.24,.08,b.s.bronze);b.b(.32,y+.08,.72,.16,.08,.08,0);}});
 }},
 'BUILT-106':{size:[3.84,5.88,.64],pitch:.04,features:'钱庄中央通高玻璃带：三格分层窗、实木竖梃、独立密封、金属压条及排水缝',limits:'作者楼宽12m/楼高8.4m，对应清单0.32w和0.7h得到3.84×5.88m。是玻璃带而非整栋楼；无室内植物、真实折射或开窗动画。',draw:(b,w,h)=>{
  b.part('三格窗框与独立退进玻璃',()=>{for(let i=0;i<3;i++)windowBay(b,i*1.28,0,1.28,h,0);});
  b.part('逐层横梃及铜肩',()=>{for(const y of[1.96,3.92])b.b(.16,y,.24,w-.32,.08,.12,b.s.metal);});
  b.part('石窗台、砌筑灰缝与真实出水孔',()=>{masonry(b,0,0,0,w,.20,.64);for(const x of[.24,1.52,2.8])b.b(x,.12,0,.08,.04,.32,0);});
  b.part('背部安装轨和端部固定件',()=>{for(const x of[0,w-.16])b.b(x,.24,.52,.16,h-.48,.12,b.s.metal);});
 }},
 'BUILT-107':{size:[1.2,5.6,1.2],pitch:.04,features:'钱庄入口独立石柱：1.2m截面、5.6m高度、双灯芯、攒边石芯与铜锁肩',limits:'仅一根入口石柱；两侧±0.32w用同母版实例放置，保持中央门洞。不含入口门扇或屋盖。',draw:b=>{
  b.part('入口柱的石足、木框与分层压顶',()=>stonePost(b,0,0,1.2,5.6,true));
  b.part('基座回纹石雕实格',()=>b.hui(.28,.32,0,.64,.32,b.s.stone));
  b.part('侧面压边木带',()=>{for(const x of[.08,1.04])b.b(x,.96,.16,.08,4.04,.88,b.s.woodEdge);});
  b.part('柱顶铜榫与真实榫孔',()=>{b.b(.40,5.48,.40,.40,.12,.40,b.s.bronze);b.b(.52,5.48,.52,.16,.12,.16,0);});
 }},
 'BUILT-108':{size:[8,4.64,1.6],pitch:.04,features:'四柱门前柱廊：四石脚、石嵌木柱、穿枋短盖、真实三孔与独立玻璃吊灯',limits:'本候选四柱版，6/8柱不是已完成变体。M017文字中纸页描述与柱廊名称不符，按参考图的柱梁构造制作；通行净空逐格验证。',draw:(b,w)=>{
  b.part('四根分层柱与石足',()=>{for(const x of[.16,2.48,4.80,7.12])stonePost(b,x,.40,.72,3.84);});
  b.part('双排穿枋和三层短屋盖',()=>{for(const z of[.40,.96])b.b(.16,3.76,z,7.68,.24,.24,b.s.wood);b.b(0,4.08,0,w,.20,1.6,b.s.wood);b.b(0,4.28,0,w,.04,1.6,b.s.waterproofMembrane);b.b(0,4.32,0,w,.24,1.6,b.s.roof);for(let x=.08;x<w;x+=.4)b.b(x,4.56,.08,.32,.08,1.44,b.s.roof);});
  b.part('柱顶短栱、金属锁鞍和铜销',()=>{for(const x of[.16,2.48,4.80,7.12]){b.b(x-.08,3.84,.24,.88,.24,1.12,b.s.woodEdge);b.b(x,4.28,0,.72,.32,.16,b.s.metal);b.b(x+.24,4.36,-.04,.24,.16,.04,b.s.bronze);}});
  b.part('三只实际连杆吊灯的玻璃罩与内部灯芯',()=>{for(const x of[1.60,3.92,6.24]){b.b(x,3.20,.64,.08,.88,.08,b.s.metal);b.b(x-.12,2.76,.52,.32,.48,.32,b.s.glass);b.b(x-.08,2.80,.56,.24,.40,.24,b.s.warm);for(const y of[2.72,3.24])b.b(x-.16,y,.48,.40,.08,.40,b.s.bronze);}});
 }},
 'BUILT-109':{size:[6.4,1.92,.8],pitch:.04,features:'门侧矮石墙：分层石芯、木金属边柱、暖牌的透光板与印墨、双端接面',limits:'一侧6.4m边墙，另一侧重复实例化；中央轴须在拼装中留空。实体暖牌采用透光塑料/印墨/灯芯，不是屏幕。',draw:(b,w)=>{
  b.part('分层墙芯和石压顶',()=>{b.b(0,0,0,w,.24,.8,b.s.stone);masonry(b,.4,.24,.20,w-.8,1.20,.4);b.b(.32,1.44,.12,w-.64,.16,.56,b.s.stone);});
  b.part('两端框柱和铜套肩',()=>{for(const x of[0,w-.48]){b.b(x,.24,.16,.48,1.52,.48,b.s.wood);for(const y of[.24,1.52])b.b(x,y,.12,.48,.16,.56,b.s.metal);b.b(x+.12,1.76,.28,.24,.16,.24,b.s.wall);b.b(x+.12,1.56,.08,.24,.08,.04,b.s.bronze);}});
  b.part('凹入灯箱、实体透光板和灯芯',()=>{b.b(2.56,.64,.08,1.28,.64,.20,b.s.metal);b.b(2.64,.72,.08,1.12,.48,.04,b.s.signDiffuser);b.b(2.68,.76,.20,1.04,.40,.04,b.s.warm);});
  b.part('实体导向印墨和两端石回纹',()=>{b.b(2.88,.92,.04,.64,.04,.04,b.s.printedDark);b.b(3.36,.84,.04,.04,.20,.04,b.s.printedDark);for(const x of[.72,5.12])b.hui(x,.68,.16,.56,.48,b.s.stone);});
 }},
 'BUILT-110':{size:[4,6,4],pitch:.04,features:'4×6×4m观察小塔：石基、开放木框观察层、栏杆、真瓦垄飞檐与顶端青灯',limits:'清单4×6×4m的作者塔体含顶部6m青灯节点，开放观察腔/前入口真实留空。屋顶以40mm阶梯表达；无巡警AI、天线通信或局部光照。',draw:(b,w,h,d)=>{
  b.part('三层石台与木观察层底板',()=>{b.b(0,0,0,w,.24,d,b.s.stone);masonry(b,.16,.24,.16,3.68,.40,3.68);b.b(.32,.64,.32,3.36,.16,3.36,b.s.wall);b.b(.56,.80,.56,2.88,.16,2.88,b.s.wood);});
  b.part('四柱框架、抬梁与侧向斜撑',()=>{for(const x of[.56,3.12])for(const z of[.56,3.12]){b.b(x,.96,z,.32,2.52,.32,b.s.wood);for(const y of[.96,3.12]){b.b(x-.04,y,z-.04,.40,.16,.40,b.s.metal);b.b(x+.08,y+.04,z-.08,.16,.08,.04,b.s.bronze);}}for(const z of[.56,3.12])b.b(.56,3.36,z,2.88,.24,.32,b.s.wood);for(const x of[.56,3.12])b.b(x,3.36,.56,.32,.24,2.88,b.s.wood);});
  b.part('三面围栏、前侧1.2m入口与分离照明',()=>{for(const y of[1.20,1.92]){b.b(.56,y,3.16,2.88,.12,.20,b.s.woodEdge);for(const x of[.56,3.16])b.b(x,y,.72,.20,.12,2.60,b.s.woodEdge);for(const x of[.56,2.60])b.b(x,y,.56,.84,.12,.20,b.s.woodEdge);}for(const x of[.64,3.20]){b.b(x,2.48,.52,.16,.48,.08,b.s.metal);b.b(x+.04,2.56,.48,.08,.32,.04,b.s.warm);}});
  b.part('实木山架、椽托与双坡瓦垄',()=>{for(const x of[.56,3.12])for(let z=.56;z<3.44;z+=.04){const q=Math.abs(z+.02-2)/2,top=Math.round((3.6+.64*(1-q))/.04)*.04;b.b(x,3.6,z,.32,top-3.6,.04,b.s.wood);}shortRoof(b,4,4,3.60);});
  b.part('后侧天线支杆与顶部独立青灯',()=>{b.b(2.84,3.36,2.68,.16,2.48,.16,b.s.metal);b.b(2.72,5.20,2.56,.40,.64,.40,b.s.glass);b.b(2.80,5.28,2.64,.24,.48,.24,b.s.energy);b.b(2.72,5.84,2.56,.40,.16,.40,b.s.metal);});
 }},
 'BUILT-111':{size:[12,3.6,.8],pitch:.04,features:'航站前厅双侧玻璃：每侧3.84m三格、中央4.32m门洞、通长门头青带与石包边',limits:'作者楼宽12m，每侧0.32w；中央4.32m净空，门头在Y=3.2m以上。左右窗不是封闭整立面；植物、门扇与人流系统另属组件。',draw:(b,w,h)=>{
  b.part('双侧三格退进玻璃与窗梃',()=>{for(const start of[0,8.16])for(let i=0;i<3;i++)windowBay(b,start+i*1.28,0,1.28,3.2,.08,true);});
  b.part('跨越真实门洞的分层门楣',()=>{b.b(0,3.20,0,w,.12,.8,b.s.wood);b.b(0,3.32,0,w,.08,.8,b.s.metal);b.b(0,3.40,0,w,.20,.8,b.s.wall);});
  b.part('门头青色灯芯与包角',()=>{b.b(3.84,3.24,-.04,4.32,.08,.04,b.s.energy);for(const x of[0,11.76]){b.b(x,3.20,-.04,.24,.32,.08,b.s.metal);b.b(x+.08,3.28,-.08,.08,.16,.04,b.s.bronze);}});
  b.part('两侧石台分缝与排水通道',()=>{for(const start of[0,8.16]){masonry(b,start,0,.08,3.84,.20,.64);for(const x of[.24,1.52,2.8])b.b(start+x,.12,.08,.08,.04,.32,0);}});
 }},
 'BUILT-112':{size:[9,2.4,7],pitch:.04,features:'渡口木栈台：9×7m桩基台、0.6m真实木板梁厚度、六桩石足及开放前后口',limits:'作者建筑6×4m，按清单宽深各加3m得到9×7m；板梁总厚0.6m，两侧栏杆托耳另各出挑0.4m。桩脚1.8m是作者选择；113木桩和114侧栏作为独立母版安装，未合并计算。',draw:(b,w,h,d)=>{
  b.part('六组石足、木桩与金属桩帽',()=>{for(const x of[.24,w-.80])for(const z of[.24,3.24,6.24]){b.b(x-.08,0,z-.08,.72,.20,.72,b.s.wall);b.b(x,.20,z,.56,1.72,.56,b.s.wood);b.b(x-.04,1.60,z-.04,.64,.24,.64,b.s.metal);b.b(x+.16,1.68,z-.08,.24,.08,.04,b.s.bronze);}});
  b.part('0.6m厚度内的主梁横梁与连续基层',()=>{for(const x of[.24,w-.80])b.b(x,1.8,0,.56,.32,d,b.s.wood);for(const z of[.24,3.24,6.24])b.b(0,1.92,z,w,.20,.56,b.s.wood);b.b(0,2.12,0,w,.08,d,b.s.wood);});
  b.part('逐根木铺板、可见板缝与边框',()=>{for(let z=.08;z<d-.08;z+=.32)b.b(.08,2.20,z,w-.16,.20,Math.min(.28,d-.08-z),b.s.woodEdge);for(const z of[0,d-.08])b.b(0,2.12,z,w,.28,.08,b.s.wood);for(const x of[0,w-.08])b.b(x,2.12,0,.08,.28,d,b.s.wood);});
  b.part('六组独立木桩安装鞍和侧栏承托面',()=>{for(const x of[0,7.8])for(const z of[0,2.88,5.76]){b.b(x,2.32,z,1.2,.08,1.2,b.s.metal);for(const xx of[x+.08,x+1.04])b.b(xx,2.36,z+.08,.08,.04,.08,b.s.bronze);}for(const x of[-.4,9])for(const z of[0,6.6])b.b(x,2.20,z,.40,.20,.40,b.s.metal);});
 }},
 'BUILT-113':{size:[1.2,6,1.2],pitch:.04,features:'6m木桩显示件：0.8m方木芯、上下铜角箍、独立显示底面/玻璃/图形和后壳散热孔',limits:'单根母桩，清单两侧各三根通过六实例实现。6m全高包含石足与显示机壳，不把屏幕像素归为实体灯芯；画面静态。',draw:b=>{
  b.part('分层石足与0.8m木芯',()=>{b.b(0,0,0,1.2,.24,1.2,b.s.stone);masonry(b,.08,.24,.08,1.04,.40,1.04);b.b(.20,.64,.20,.8,5.36,.8,b.s.wood);});
  b.part('上下抱箍、铜角锁和木端盖',()=>{for(const y of[.64,2.16,4.64,5.64]){b.b(.16,y,.16,.88,.20,.88,b.s.metal);for(const x of[.16,.88])b.b(x,y+.04,.12,.16,.12,.04,b.s.bronze);}b.b(.24,5.84,.24,.72,.16,.72,b.s.woodEdge);});
  b.part('竖屏玻璃、显示像素与独立机壳',()=>screen(b,.12,2.4,0,.96,2.16));
  b.part('机壳侧通风实孔与键区',()=>{b.b(1,2.56,.28,.12,1.68,.40,b.s.metal);for(let y=2.64;y<4.16;y+=.16)b.b(1,y,.36,.12,.08,.24,0);b.b(.36,2.12,.04,.48,.12,.12,b.s.polymerDark);});
 }},
 'BUILT-114':{size:[7,1.12,.4],pitch:.04,features:'渡口独立侧栏显示件：双横杆、七根竖栏、石脚木柱与横向静态航船屏',limits:'7m独立侧栏、一侧一个母版实例，另一侧旋转复用；前后口由拼装保持。七根细竖杆不含端柱，40mm格距的实际高1.12m。',draw:(b,w)=>{
  b.part('两端石脚、木立柱和铜箍',()=>{for(const x of[0,6.6]){b.b(x,0,0,.40,.16,.40,b.s.wall);b.b(x+.04,.16,.04,.32,.96,.32,b.s.wood);b.b(x,.88,0,.40,.16,.40,b.s.metal);b.b(x+.12,.92,-.04,.16,.08,.04,b.s.bronze);}});
  b.part('连续双横杆和七根独立竖栏',()=>{for(const y of[.24,.96])b.b(.20,y,.12,6.60,.12,.16,b.s.woodEdge);for(let i=0;i<7;i++)b.b(.76+i*.88,.36,.16,.08,.60,.08,b.s.wood);});
  b.part('中置静态航船显示器',()=>screen(b,2.20,.36,-.08,2.60,.60,true));
  b.part('屏底电缆槽与两只固定鞍',()=>{b.b(2.12,.28,.08,2.76,.08,.24,b.s.metal);for(const x of[2.12,4.80])b.b(x,.28,-.12,.08,.72,.28,b.s.metal);});
 }},
 'BUILT-115':{size:[6,3.6,.8],pitch:.04,features:'医馆单层石窗带：三格玻璃、石包边、木金属回纹格、上亮窗及排水缝',limits:'一层6×3.6m母版，逐层复用；不把楼层实例算新资产。内窗实际玻璃、上部通风孔为空，非印在墙面的窗图。',draw:(b,w,h)=>{
  b.part('单层三格石包窗与独立玻璃',()=>{for(let i=0;i<3;i++)windowBay(b,i*2,0,2,3.2,.08,true);});
  b.part('上层通风孔石梁与立梃',()=>{b.b(0,3.2,.08,w,.40,.64,b.s.mortar);for(let x=.16;x<5.6;x+=.40){b.b(x,3.24,.08,.24,.28,.64,b.s.wall);b.b(x+.04,3.28,.08,.16,.16,.64,0);}});
  b.part('木金属格纹及石台回纹',()=>{for(let i=0;i<3;i++){b.hui(i*2+.28,.36,.32,1.44,.48,b.s.metal);b.hui(i*2+.28,2.4,.32,1.44,.48,b.s.metal);b.b(i*2+.96,.80,.24,.08,1.60,.12,b.s.wood);}});
  b.part('端部铜连接和石包边',()=>{for(const x of[0,5.84]){b.b(x,0,0,.16,3.60,.8,b.s.wall);b.b(x,3.32,-.04,.16,.16,.04,b.s.bronze);}});
 }},
};

const roles:Record<string,string[]>={
 '104':['stone','wall','structuralConcrete','mortar','wood','metal','bronze'],
 '105':['stone','wall','mortar','wood','metal','bronze','warm'],
 '106':['wall','mortar','wood','woodEdge','metal','bronze','glass','rubber'],
 '107':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm'],
 '108':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm','glass','roof','waterproofMembrane'],
 '109':['stone','wall','mortar','wood','metal','bronze','warm','signDiffuser','printedDark'],
 '110':['stone','wall','mortar','wood','woodEdge','metal','bronze','warm','energy','glass','roof','waterproofMembrane'],
 '111':['wall','mortar','wood','woodEdge','metal','bronze','glass','rubber','energy'],
 '112':['wall','wood','woodEdge','metal','bronze'],
 '113':['stone','wall','mortar','wood','woodEdge','metal','bronze','screen','displayGlyph','displayWhite','glass','polymerDark'],
 '114':['wall','wood','woodEdge','metal','bronze','screen','displayGlyph','displayWhite','glass','polymerDark'],
 '115':['wall','mortar','wood','woodEdge','metal','bronze','glass','rubber'],
};
export const waterfrontMaterialRules=Object.fromEntries(Object.keys(waterfrontRecipes).map(id=>[id,{required:roles[id.slice(-3)],allowed:roles[id.slice(-3)],note:['BUILT-113','BUILT-114'].includes(id)?'木桩/栏杆与显示机壳分层；屏幕底面、青白像素、玻璃、塑料机背各自独立，像素不是灯芯或印墨。':id==='BUILT-109'?'实体暖牌的透光塑料、印墨和内部灯芯各自独立，不使用屏幕或显示图形。':'按实际石、灰缝、木框、金属压条、玻璃、密封与独立灯芯逐格归类；不依据相近颜色分配。'}]));

export function configureWaterfrontAsset(a:Asset,id:string){
 if(!waterfrontRecipes[id])return;
 const empty=(min:V3,max:V3)=>a.openings.push({min:min.map(n=>Math.round(n/a.cellSize)) as V3,max:max.map(n=>Math.round(n/a.cellSize)) as V3});
 const port=(id:string,kind:string,position:V3,normal:V3,size:V3)=>a.ports.push({id,kind,position,normal,size,pitch:a.cellSize});
 if(id==='BUILT-104'){empty([.56,.24,0],[1.84,3.2,4]);port('loading','loading-2400',[1.2,3.6,4],[0,0,1],[2.4,.24,0]);a.source!.authoredBuildingWidthM=12;}
 if(id==='BUILT-105'){for(const y of[1.2,7.2])empty([.32,y+.08,.72],[.48,y+.16,.8]);a.source!.stoneColumnWidthM=.8;}
 if(id==='BUILT-106')a.source!.facadeBasis={buildingWidthM:12,buildingHeightM:8.4,widthFactor:.32,heightFactor:.7};
 if(id==='BUILT-107'){empty([.52,5.48,.52],[.68,5.6,.68]);a.source!.entryColumnWidthM=1.2;}
 if(id==='BUILT-108'){for(const x of[.88,3.20,5.52])empty([x,0,0],[x+1.6,2.68,1.6]);a.source!.columnCount=4;}
 if(id==='BUILT-109'){port('left','low-wall',[0,0,.4],[-1,0,0],[0,1.6,.8]);port('right','low-wall',[6.4,0,.4],[1,0,0],[0,1.6,.8]);}
 if(id==='BUILT-110'){empty([1.4,.96,0],[2.6,3.32,3.12]);a.source!.overallHeightM=6;}
 if(id==='BUILT-111'){empty([3.84,0,-.2],[8.16,3.2,1]);a.source!.centralDoorWidthM=4.32;}
 if(id==='BUILT-112'){
  for(const x of[0,7.8])for(const z of[0,2.88,5.76])port(`pile-${Math.round(x*100)}-${Math.round(z*100)}`,'dock-pile',[x+.6,2.4,z+.6],[0,1,0],[1.2,0,1.2]);
  port('rail-left','dock-rail',[-.2,2.4,3.48],[0,1,0],[.4,0,7]);port('rail-right','dock-rail',[9.2,2.4,3.52],[0,1,0],[.4,0,7]);
  empty([1.24,2.4,-.2],[7.76,4.8,7.2]);a.source!.deckThicknessM=.6;a.source!.authoredBuildingFootprintM=[6,4];
 }
 if(id==='BUILT-113'){port('foot','dock-pile',[.6,0,.6],[0,-1,0],[1.2,0,1.2]);a.source!.timberWidthM=.8;}
 if(id==='BUILT-114'){port('bottom','dock-rail',[3.52,0,.2],[0,-1,0],[7,0,.4]);a.source!.verticalBarCount=7;}
 if(id==='BUILT-115'){for(let x=.16;x<5.6;x+=.40)empty([x+.04,3.28,.08],[x+.20,3.44,.72]);port('left','clinic-window',[0,0,.4],[-1,0,0],[0,3.6,.8]);port('right','clinic-window',[6,0,.4],[1,0,0],[0,3.6,.8]);}
}
