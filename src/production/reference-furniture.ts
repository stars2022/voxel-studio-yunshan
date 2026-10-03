import type {Placement} from './layouts';

/** Review arrangements of existing catalog masters, not additional base assets. */
export const referenceFurniture:{id:string;name:string;items:Placement[];note:string}[]=[
 {id:'01-bed',name:'双人床',items:[[1,0,0,0],[2,.06,.42,.06],[3,0,0,2.02],[4,.06,.62,.06]],note:'四个母版拼装；床头嵌板、独立枕被、角部榫肩和侧控盒。'},
 {id:'02-nightstand',name:'床头柜',items:[[5,0,0,0]],note:'双抽屉、嵌芯、凹拉手和套脚；抽屉尚无运动状态。'},
 {id:'03-wardrobe',name:'双门衣柜',items:[[6,0,0,0],[7,.06,.14,-.03],[8,.04,.14,.04]],note:'柜体、双门、内部搁板分别可编辑；合页仅静态几何。'},
 {id:'04-sofa',name:'双人沙发',items:[[10,0,0,0],[11,.11,.28,.04]],note:'真实透空扶手、两组独立坐垫和背垫。'},
 {id:'05-armchair',name:'扶手椅',items:[[12,0,0,0],[13,.11,.28,.04]],note:'单席木框与软垫使用两个独立母版。'},
 {id:'06-coffee',name:'茶几',items:[[14,0,0,0],[15,0,.42,0],[106,.16,.15,.12],[106,.17,.21,.13],[106,.72,.15,.12]],note:'攒边浅石芯桌面、下搁板；三本书复用同一书本母版。'},
 {id:'07-desk',name:'书桌',items:[[16,0,0,0],[17,.18,0,.12]],note:'右侧三屉箱、开放膝部、后穿枨和贯穿走线孔。'},
 {id:'08-dining-table',name:'餐桌',items:[[21,0,0,0]],note:'石芯桌面、木框、套肩与阶梯牙头。'},
 {id:'09-dining-chair',name:'餐椅',items:[[22,0,0,0]],note:'三竖枨透空靠背、回纹中牌、薄坐垫和脚枨。'},
 {id:'10-bookcase',name:'书架',items:[[108,0,0,0]],note:'双开放上格、浅色下柜门、书本厚度和分簇盆栽。'},
 {id:'11-monitor',name:'桌面显示器',items:[[18,0,0,0]],note:'分层底座、后散热壳、角件；屏幕图形是静态体素。'},
 {id:'12-terminal',name:'家庭控制终端 · 形制研究',items:[[147,0,0,0]],note:'复用 LIFE-147 查询终端母版研究家庭终端形制，未增加基础资产；输入板有实体支撑，无全息或交互功能。'},
];
