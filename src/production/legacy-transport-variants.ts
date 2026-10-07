import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import type {LegacyVehicleKind} from './legacy-variant-spec';

export const legacyVehicleDimensions:Record<LegacyVehicleKind,{body:V3;head:V3;offsetY:number}>={
 road:{body:[2.5,1.5,5.5],head:[1.9,.8,2.2],offsetY:0},
 maglev:{body:[3.3,1.5,16],head:[1.9,.8,2.2],offsetY:0},
 lightRail:{body:[3.3,1.5,16],head:[1.9,.8,2.2],offsetY:0},
 cable:{body:[2.5,1.5,3.5],head:[1.9,.8,2.2],offsetY:2.5},
 lift:{body:[2.5,1.5,5.5],head:[1.9,.8,2.2],offsetY:0},
 ferry:{body:[4.5,1.5,11],head:[1.9,.8,2.2],offsetY:0},
 flight:{body:[14,.8,17],head:[3,1.8,5],offsetY:0}
};

export function placeLegacyVehicle(b:ArchitectureBuilder,kind:LegacyVehicleKind){
 const spec=legacyVehicleDimensions[kind],[w,h,l]=spec.body,[hw,hh,hl]=spec.head;
 const a=b.asset('legacy-three-box-'+(kind==='lightRail'?'maglev':kind==='lift'?'road':kind),id=>{const c=new CivicComponent(b.p,id,'原三盒载具代理尺寸派生',['BUILT-169'],{bodyM:spec.body,headM:spec.head,authorHeadAndTrimPlacement:true,completeVehicle:false});
 c.box('body · 原用途尺寸盒','metalTeal',-w/2,0,-l/2,w,h,l);c.box('head · 独立玻璃头盒','glass',-hw/2,h,-l*.35,hw,hh,hl);c.box('trim · 未绑定光学饰面盒','vehicleInactiveOptic',-w*.42,h*.62,-l/2-.025,w*.84,.12,.025);c.pin('本体最小接销','bronze',[w/2-.04,h-.02,l/2-.04]);return c.finish();});
 const instance=b.place(a,[0,spec.offsetY,0],0,'vehicle-proxy');
 return{kind,instance,bodyM:spec.body,headM:spec.head,bodyOffsetY:spec.offsetY,sourceParts:['body','head','trim'],geometryFamily:kind==='lightRail'?'maglev':kind==='lift'?'road':kind,originalVehicleIdentity:null,originalRoute:null,identityBound:false,controllerBound:false,completeVehicle:false,sharedRoadPassengerFreightAppearance:kind==='road',originalLightRailRouteDistinctionUnbound:kind==='lightRail',scope:'Finite source proxy dimensions and authored head/trim placement retained. No second Vehicle identity, passengers, wheels, independent hull/wings or route/controller. Detailed full vehicles belong to277/279–285and are not counted again here.'};
}

export function militaryPad(p:Project,id:string){
 const c=new CivicComponent(p,id,'十四米勤务机位尺寸派生',['BUILT-181','BUILT-183'],{sourcePadM:[14,.2,14],streetEntry:'author',identityBound:false});
 c.box('站台混凝土承体','structuralConcrete',-7,0,-7,14,.15,14);c.box('石铺面','stone',-7,.15,-7,14,.05,14);
 for(const z of[-4,0,4])c.box('金色实际涂线','airfieldYellow',-6.1,.2,z-.09,12.2,.004,.18);
 c.slab('连续缓坡','pavementConcrete',[[-.9,.2,-7],[.9,.2,-7],[.9,0,-11],[-.9,0,-11]],.15);
 c.box('空白机位牌立杆','metal',6.5,.2,6.3,.2,3,.2);c.box('空白实体机位牌','metal',5.7,2.4,6.25,1.8,.8,.10);c.pin('牌杆连接销','bronze',[6.58,2.44,6.23]);
 const a=c.finish();a.ports=[{id:'author-street-entry',kind:'walk',position:[0,0,-11],normal:[0,0,-1],size:[1.8,2.2,0],pitch:.02}];return a;
}
