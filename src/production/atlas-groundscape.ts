import {Shapes} from './shapes';import {Grid} from '../core/grid';import {connectedLine,bladeLeaf,voxelLeaf} from '../core/voxel-shapes';import type {Asset,V3,Bounds} from '../core/types';import type {AtlasRecipe} from './atlas-life';import {atlasSource} from './atlas-life';import {productionReference,productionStyleRevision} from './style';
const pitch=.2,q=(n:number)=>Math.round(n/pitch),mod=(n:number,m:number)=>(n%m+m)%m;
type Params=Record<string,number|string>;type Detail={openings:Bounds[];[key:string]:unknown};
const limits='完整0.2m原生占用为编辑、显示及固体碰撞权威，米制Y-up。作者技术候选，未获人工美术验收。原terrainHeight、建筑footprint/地下层/门位、共享FloorPlan、道路排除、生态状态和控制器未收件。无原游戏集成、结构受力/水力认证、自动距离LOD或生长动画。远景仅精确共面合并。';
export const groundscapeDefaults:Record<string,Params>={'ENV-062':{height:.6},'ENV-064':{groundcover:'fern'},'ENV-065':{},'ENV-066':{waterDepth:.8},'ENV-067':{vineDrop:4.8},'ENV-069':{litterForm:'log'},'ENV-077':{excavation:'basement'},'ENV-078':{},'ENV-081':{substrate:'rock'},'ENV-082':{height:3.6},'ENV-084':{detail:'cap'},'ENV-085':{terraceHeight:1.2}};
export function groundscapeParameters(id:string):Record<string,any>{const choice=(values:(number|string)[],value:number|string,description:string)=>({type:typeof value==='string'?'string':'number',enum:values,default:value,description});switch(id){case'ENV-062':return{height:choice([.4,.6],.6,'原给定两档草簇高度，完整0.2m量化')};case'ENV-064':return{groundcover:choice(['fern','broadleaf'],'fern','同族蕨状羽片/阔叶地被，具体物种原数据未收件')};case'ENV-066':return{waterDepth:choice([.4,.8],.8,'明确作者静潭床到水面深度，叶柄随同源水深生成')};case'ENV-067':return{vineDrop:choice([2.4,4.8],4.8,'顶部附壁锚以下垂落长度米')};case'ENV-069':return{litterForm:choice(['leaves','branches','log'],'log','落叶/枯枝/空心倒木有限套装，不按单叶计母版')};case'ENV-077':return{excavation:choice(['courtyard','basement'],'basement','明确作者中庭/地下坑与真实入坑通道')};case'ENV-081':return{substrate:choice(['rock','soil'],'rock','同四个承托面约定的岩基/土基作者样件')};case'ENV-082':return{height:choice([2.4,3.6],3.6,'含基础与简单头石的作者挡墙总高')};case'ENV-084':return{detail:choice(['cap','weep'],'cap','附加滴水压顶/实孔泄水石套，同安装细部族')};case'ENV-085':return{terraceHeight:choice([.8,1.2],1.2,'农地与检查路面共同顶高，沟水低0.2m')};default:return{};}}
export function groundscapeVariants(id:string):Params[]{let all:Params[]=[{}];for(const[k,d]of Object.entries(groundscapeParameters(id)))all=all.flatMap(p=>d.enum.map((v:number|string)=>({...p,[k]:v})));return all;}
function paramsFor(id:string,p:Params){const defs=groundscapeParameters(id);for(const[k,v]of Object.entries(p))if(!defs[k]?.enum.includes(v))throw new Error('未验证的地被/地形衔接参数 '+k);return{...groundscapeDefaults[id],...p};}
function line(b:Shapes,a:V3,c:V3,m:number){connectedLine(b.g,pitch,a,c,m);}
/** Attached native blades preserve stem/rhizome IDs at their shared cells. */
function leaf(b:Shapes,base:V3,length:number,width:number,angle:number,tilt:number,m:number,curl=0,oval=false){const g=new Grid();if(oval)voxelLeaf(g,pitch,base,length,width,angle,tilt,m);else bladeLeaf(g,pitch,base,length,width,angle,tilt,m,curl);for(const[v,id]of g.cells())if(!b.g.get(v))b.g.set(v,id);}
function rhizomes(b:Shapes,sites:V3[]){for(const p of sites)line(b,[0,0,0],p,b.s.rootRhizome);}
function grass(b:Shapes,height:number){const sites:V3[]=[[-.4,0,-.2],[0,0,.4],[.4,0,-.2]];
 b.part('三株共用真实根茎，非整块草坡底盒',()=>rhizomes(b,sites));
 b.part('原给定0.2m方茎，完整0.4或0.6m高度',()=>{for(const p of sites)b.b(p[0],0,p[2],.2,height,.2,b.s.plantStem);});
 b.part('弯曲草叶侧展，成熟草叶与茎分材质',()=>{for(const[i,p]of sites.entries())for(let k=0;k<3;k++)leaf(b,[p[0],.2,p[2]],height*.9,.2,k*2.094+i*.7,.12,b.s.grassBlade,.12);});
 // Leaf discretisation is bounded by the actual legacy height contract.
 for(const[v]of b.g.cells())if(v[1]>=q(height))b.g.set(v,0);
}
function groundcover(b:Shapes,kind:string){b.part('根颈与真实根茎',()=>{rhizomes(b,[[-.4,0,0],[.4,0,0],[0,0,.4],[0,0,-.4]]);b.b(0,0,0,.2,.4,.2,b.s.plantStem);});
 if(kind==='fern'){
 const nodes:V3[][]=[];b.part('七条弧形蕨叶轴，保留一格以上羽片间隙',()=>{for(let i=0;i<7;i++){const a=i*Math.PI*2/7,points:V3[]=[[0,.2,0]];for(let k=1;k<=7;k++){const t=k/7,r=t*(1.5+(i%2)*.2);points.push([Math.cos(a)*r,.2+1.25*Math.sin(t*1.65),Math.sin(a)*r]);line(b,points[k-1],points[k],b.s.plantStem);}nodes.push(points);}});
 b.part('成对真实羽片，不用不透明整张平面',()=>{for(const[i,points]of nodes.entries())for(let k=2;k<7;k++)for(const sign of[-1,1])leaf(b,points[k],.75*(1-k/9),.2,i*Math.PI*2/7+sign*1.15,.18,b.s.fernFrond,.04);});
 }else{const sites:V3[]=[];b.part('阔叶地被辐射叶柄',()=>{for(let i=0;i<7;i++){const a=i*2.399,p:V3=[Math.cos(a)*.45,.4+(i%3)*.2,Math.sin(a)*.45];line(b,[0,.2,0],p,b.s.plantStem);sites.push(p);}});b.part('有厚度的椭圆阔叶与开放株间隙',()=>{for(const[i,p]of sites.entries())leaf(b,p,1.05,.7,i*2.399,.25,b.s.groundcoverLeaf,0,true);});}
}
function reed(b:Shapes,d:Detail){const sites:V3[]=[[-.6,0,-.4],[-.2,0,.4],[.6,0,0],[.4,0,-.6]];d.culmSitesM=sites;d.culmWidthM=.2;d.culmHeightM=1.6;
 b.part('四株相连根茎，须实接岸床',()=>rhizomes(b,sites));b.part('四根0.2×1.6×0.2米真实细茎',()=>{for(const p of sites)b.b(p[0],0,p[2],.2,1.6,.2,b.s.reedCulm);});
 b.part('细茎端部真实量化穗序',()=>{for(const[i,p]of sites.entries()){b.b(p[0]-.2,1.6,p[2],.6,.4,.2,b.s.reedPanicle);b.b(p[0],2,p[2],.2,.2,.2,b.s.reedPanicle);if(i%2)b.b(p[0],1.8,p[2]+.2,.2,.2,.2,b.s.reedPanicle);}});
 b.part('从茎节实际发出的窄长叶',()=>{for(const[i,p]of sites.entries())for(let k=0;k<3;k++)leaf(b,[p[0],.4+k*.4,p[2]],1.0,.2,i*1.8+k*2.6,.1,b.s.reedBlade,.3);});
}
function lotusDisk(b:Shapes,c:V3,r:number){const y=q(c[1]);for(let x=q(c[0]-r);x<q(c[0]+r);x++)for(let z=q(c[2]-r);z<q(c[2]+r);z++){const X=((x+.5)*pitch-c[0])/r,Z=((z+.5)*pitch-c[2])/r,dist=X*X+Z*Z;if(dist>1)continue;const h=dist>.6?2:1;for(let j=0;j<h;j++)if(!b.g.get([x,y+j,z]))b.g.set([x,y+j,z],b.s.lotusLeaf);}b.g.set([q(c[0]),y,q(c[2])],b.s.lotusLeaf);}
function lotus(b:Shapes,depth:number,d:Detail){const sites:V3[]=[[-1,0,-.6],[1.2,0,.4],[0,0,1.2],[0,0,-.2]],leaves:V3[]=[[-1,depth,-.6],[1.2,depth+.8,.4],[0,depth+.4,1.2]];d.waterDepthM=depth;d.waterSurfaceYM=depth;d.rootSitesM=sites;d.stillWaterOnly=true;
 b.part('浅水床内同源根茎',()=>rhizomes(b,sites));b.part('从床到实际水面和挺水叶的连续叶柄',()=>{for(let i=0;i<3;i++)line(b,sites[i],leaves[i],b.s.aquaticPetiole);line(b,sites[3],[0,depth+1,-.2],b.s.aquaticPetiole);});
 b.part('真实盘形荷叶、连续上卷叶缘和开放叶间隙',()=>{for(const[i,c]of leaves.entries())lotusDisk(b,c,[1,.8,.7][i]);});
 b.part('真实荷花花托与量化花瓣，非灌木花或灯芯',()=>{const c:V3=[0,depth+1,-.2];b.b(-.2,c[1],-.4,.6,.2,.6,b.s.lotusReceptacle);for(let i=0;i<6;i++)leaf(b,c,.65,.4,i*Math.PI/3,.65,b.s.lotusPetal,.1,true);});
}
function vines(b:Shapes,drop:number,d:Detail){const anchors:V3[]=[];const leaves:V3[]=[];
 b.part('顶部横向攀援茎与四条实际垂茎',()=>{line(b,[-1.2,0,-.2],[1.2,0,-.2],b.s.vineStem);for(let i=0;i<4;i++){let previous:V3=[-1.2+i*.8,0,-.2];for(let k=1;k<=q(drop);k++){const p:V3=[-1.2+i*.8+.2*Math.sin(k*.7+i),-k*pitch,-.2];line(b,previous,p,b.s.vineStem);previous=p;if(k%3===0){anchors.push(p);line(b,p,[p[0],p[1],-.2],b.s.vineStem);}if(k%2===1)leaves.push(p);}}});
 b.part('有独立轮廓的贴壁藤叶，向墙外生长',()=>{for(const[i,p]of leaves.entries())leaf(b,p,.55,.4,-Math.PI/2+(i%2?-.65:.65),-.2,b.s.vineLeaf,0,true);});
 b.part('顶锚与分层贴壁附着组织',()=>{for(const p of anchors)b.g.set([q(p[0]),q(p[1]),-1],b.s.rootRhizome);});d.attachmentsM=anchors;d.topAnchorM=[0,0,0];d.wallFaceZM=0;d.leafPlacements=leaves.length;d.legacyTileBlockLimit=360;d.originalTileBound=false;d.vineDropM=drop;
}
function litter(b:Shapes,form:string,d:Detail){if(form==='log'){
 b.part('连续空心倒木壳体，孔洞贯穿六米',()=>{for(let x=0;x<30;x++)for(let y=0;y<8;y++)for(let z=-4;z<4;z++){const r2=((y+.5)*pitch-.8)**2+((z+.5)*pitch)**2;if(r2<=.8**2&&r2>=.4**2)b.g.set([x,y,z],r2>.6**2?b.s.treeBark:b.s.deadWood);}});
 b.part('两端真实断口心材与有限裂边',()=>{for(const[v,m]of b.g.cells())if(v[0]===0||v[0]===29)b.g.set(v,b.s.rootHeartwood);b.b(0,1.2,0,.4,.4,.2,0);b.b(5.6,1.2,-.4,.4,.4,.2,0);});
 b.part('实接倒木外壳的枯分枝',()=>{b.beam([2,1.2,.6],[1,1.8,1.6],.2,b.s.deadWood);b.beam([2,1.2,.6],[2.8,2,1.2],.2,b.s.deadWood);b.beam([4,1.2,-.6],[4.8,1.8,-1.6],.2,b.s.deadWood);});
 b.part('接地枯叶与木表附生苔',()=>{for(const x of[1,3,5]){leaf(b,[x,0,.4],.8,.4,.7,.05,b.s.deadLeaf);b.g.set([q(x),7,0],b.s.moss);}});d.openings.push({min:[0,3,-1],max:[30,5,1]});d.boreM={min:[0,.6,-.2],max:[6,1,.2]};
 }else if(form==='branches'){b.part('直接接地的枯枝主轴及多级分叉',()=>{b.beam([0,.2,0],[3,.2,.2],.4,b.s.deadWood);for(const[x,z]of[[.4,-1],[1,1.2],[1.8,-1.4],[2.6,1]]){b.beam([x,.2,0],[x+.6,.2,z],.2,b.s.deadWood);b.beam([x+.3,.2,z*.6],[x-.2,.4,z],.2,b.s.deadWood);}});b.part('枯枝上残留树皮',()=>{for(let x=1;x<14;x+=3)b.g.set([x,2,0],b.s.treeBark);});b.part('真实枝端残留枯叶',()=>{for(const[x,z]of[[1,1.2],[2.4,-1.4],[3.2,1]])leaf(b,[x,.2,z],.6,.4,.5,.1,b.s.deadLeaf,0,true);});
 }else{b.part('相互覆盖的近地枯叶柄',()=>{for(let i=0;i<9;i++)line(b,[0,0,0],[Math.cos(i*2.4)*.7,0,Math.sin(i*2.4)*.7],b.s.deadLeaf);});b.part('真实厚一格的枯叶片，叶缘与间隙可读',()=>{for(let i=0;i<9;i++)leaf(b,[Math.cos(i*2.4)*.6,0,Math.sin(i*2.4)*.6],.8,.6,i*2.4,.05,b.s.deadLeaf,0,true);});b.part('叶堆上实接小枯枝',()=>b.beam([-.4,0,0],[.6,.2,.2],.2,b.s.deadWood));for(const[v,m]of [...b.g.cells()])if(v[1]<0){b.g.set(v,0);if(!b.g.get([v[0],0,v[2]]))b.g.set([v[0],0,v[2]],m);}}}
export function excavationBounds(mode:string){return mode==='courtyard'?{min:[4,.4,3] as V3,max:[8,7,7] as V3}:{min:[2,.4,2] as V3,max:[10,7,8] as V3};}
function excavation(b:Shapes,mode:string,d:Detail){const pit=excavationBounds(mode);
 b.part('完整岩基、自然深土和顶表土剖面',()=>{b.b(0,0,0,12,.4,10,b.s.bedrock);b.b(0,.4,0,12,3.8,10,b.s.soilSubstrate);b.b(0,4.2,0,12,.2,10,b.s.surfaceSoil);});
 b.part('真实中庭或地下坑及保留土顶的入口',()=>{b.b(pit.min[0],.4,pit.min[2],pit.max[0]-pit.min[0],4.2,pit.max[2]-pit.min[2],0);b.b(5,.4,0,2.4,2.6,pit.min[2],0);});
 b.part('真实暴露开挖面，独立于未开挖深土',()=>{const changes:V3[]=[];for(const[v,m]of b.g.cells())if(m===b.s.soilSubstrate&&((v[0]>0&&v[0]<59&&(!b.g.get([v[0]-1,v[1],v[2]])||!b.g.get([v[0]+1,v[1],v[2]])))||(v[2]>0&&v[2]<49&&(!b.g.get([v[0],v[1],v[2]-1])||!b.g.get([v[0],v[1],v[2]+1])))))changes.push(v);for(const v of changes)b.g.set(v,b.s.earthCutaway);});
 b.part('在土岩顶上实接的有限石缘，不覆盖坑洞',()=>{for(const x of[0,11.6])b.b(x,4.4,0,.4,.2,10,b.s.wall);for(const z of[0,9.6])b.b(0,4.4,z,12,.2,.4,b.s.wall);});
 d.openings.push({min:pit.min.map(q) as V3,max:pit.max.map(q) as V3},{min:[25,2,0],max:[37,15,q(pit.min[2])]});d.authorFootprintM={min:[0,0],max:[12,10]};d.excavation=mode;d.floorYM=.4;d.originalFootprintBound=false;d.originalBasementBound=false;
}
export function shoulderHeight(x:number,z:number){if(x>=4&&x<16)return Math.floor(z/2)+1;const shift=Math.round(1.5*Math.sin(x*.2));return z<20+shift?10:z<40+shift?20:30;}
function shoulder(b:Shapes,d:Detail){b.part('局部连续岩台保留2米崖阶，不做54米整体抹平',()=>{for(let x=0;x<60;x++)for(let z=0;z<60;z++){const h=shoulderHeight(x,z);for(let y=0;y<h;y++)b.g.set([x,y,z],y===h-1?(x>=4&&x<16?b.s.weatheredRock:b.s.surfaceSoil):y%7<2?b.s.weatheredRock:b.s.bedrock);}});
 b.part('真实0.2米踢高和0.4米进深的岩质检查台阶',()=>{for(let z=0;z<60;z++)for(let x=4;x<16;x++)b.g.set([x,shoulderHeight(x,z)-1,z],b.s.weatheredRock);});
 b.part('崖面有限实际节理凹槽，保留岩体连通',()=>{for(let x=20;x<58;x+=11)for(const z of[19,39])for(let y=3;y<shoulderHeight(x,z)-2;y++)if(!b.g.get([x,y,z-1]))b.g.set([x,y,z],0);});
 b.part('非通路岩肩上的贴生苔',()=>{for(const[x,z]of[[22,8],[40,28],[30,48],[52,55]])b.g.set([x,shoulderHeight(x,z),z],b.s.moss);});d.legacyShoulder={reportedM:54,reportedFactor:.82,originalInterpretationVerified:false,knownDefect:'broad shoulder erases cliffs',acceptedLegacyReproduction:false};d.inspectionSteps={widthM:2.4,riseM:.2,treadM:.4,originalRoadPermission:false};
}
export const bearingPads=[{x:1.2,z:1.2,top:2},{x:7.2,z:1.2,top:2.6},{x:1.2,z:5.2,top:3},{x:7.2,z:5.2,top:3.6}];
function foundation(b:Shapes,substrate:string,d:Detail){const rock=substrate==='rock';
 b.part('连续宽岩土体，非孤立尖锥或楼柱模型',()=>{for(let x=0;x<50;x++)for(let z=0;z<40;z++){const X=(x+.5)*pitch,Z=(z+.5)*pitch,pad=bearingPads.find(p=>X>=p.x&&X<p.x+1.6&&Z>=p.z&&Z<p.z+1.6),h=q(pad?.top??(.8+.12*X+.24*Z));for(let y=0;y<h;y++)b.g.set([x,y,z],y<2?b.s.bedrock:rock?(y===h-1?b.s.weatheredRock:b.s.bedrock):(y===h-1?b.s.surfaceSoil:b.s.soilSubstrate));}});
 b.part('四个与地形同源的量化平整承托面',()=>{for(const p of bearingPads)for(let x=q(p.x);x<q(p.x+1.6);x++)for(let z=q(p.z);z<q(p.z+1.6);z++)b.g.set([x,q(p.top)-1,z],rock?b.s.weatheredRock:b.s.surfaceSoil);});
 b.part('非承托面的局部贴生苔和真实裸露面',()=>{for(const[x,z]of[[22,9],[24,28],[4,34]]){let y=0;while(b.g.get([x,y,z]))y++;b.g.set([x,y,z],b.s.moss);}});d.bearingPads=bearingPads.map(p=>({...p,sizeM:[1.6,1.6]}));d.substrate=substrate;d.buildingSlabAndColumnsIncluded=false;d.structuralCapacityVerified=false;
}
export const wallFront=(y:number)=>q(.6+.25*y)*pitch;
export const weepXs=[2,5.4];
function retainingWall(b:Shapes,height:number,d:Detail){b.part('实际稳定基脚与向内收分的厚石墙体',()=>{b.b(0,0,0,8,.4,2.8,b.s.wall);for(let y=2;y<q(height)-1;y++){const front=wallFront(y*pitch);b.b(0,y*pitch,front,8,.2,2.4-front,b.s.wall);}});
 b.part('逐格独立砌缝与错列石面，非施工厚度认证',()=>{for(let y=2;y<q(height)-1;y++){const f=q(wallFront(y*pitch));for(let x=0;x<40;x++)if(y%3===0||mod(x+Math.floor(y/3)*4,8)===0)b.g.set([x,y,f],b.s.mortar);}});
 b.part('一体头石与真实下缘收口',()=>b.b(0,height-.2,wallFront(height-.2)-.2,8,.2,2.6-wallFront(height-.2)+.2,b.s.wall));
 b.part('两个可安装石套的真实穿墙排水槽',()=>{for(const x of weepXs)b.b(x,.6,0,.6,.6,2.8,0);});for(const x of weepXs)d.openings.push({min:[q(x+.2),4,0],max:[q(x+.4),5,14]});d.wallHeightM=height;d.backPlaneZM=2.4;d.weepSockets=weepXs.map(x=>({min:[x,.6,0],max:[x+.6,1.2,2.8]}));d.jointQuantizationM=.2;d.hydraulicModel=false;
}
function wallDetail(b:Shapes,detail:string,d:Detail){if(detail==='cap'){b.part('连续盖石承托层与外挑滴水边',()=>b.b(0,0,0,8,.4,1.6,b.s.wall));b.part('两侧真实下缘滴水槽，不借颜色线',()=>{for(const z of[0,1.4])b.b(0,0,z,8,.2,.2,0);});b.part('上层盖石错缝且保留连续下托',()=>{for(let x=1.6;x<8;x+=1.6)b.b(x,.2,0,.2,.2,1.6,b.s.mortar);});d.bearingStripM={min:[0,0,.2],max:[8,0,1.4]};d.dripGrooveDepthM=.2;
 }else{b.part('实石泄水套外框',()=>b.b(0,0,0,.6,.6,2.2,b.s.wall));b.part('贯穿全深的0.2米方孔',()=>b.b(.2,.2,0,.2,.2,2.2,0));b.part('真实端面砂浆安装带',()=>{for(const y of[0,.4])b.b(0,y,2,.6,.2,.2,b.s.mortar);});d.openings.push({min:[1,1,0],max:[2,2,11]});d.boreM={min:[.2,.2,0],max:[.4,.4,2.2]};}d.detail=detail;d.waterFlowSimulated=false;}
function terrace(b:Shapes,height:number,d:Detail){const H=q(height);
 b.part('共同高程的完整田块岩床与土体',()=>{b.b(0,0,0,8,.2,6,b.s.bedrock);b.b(0,.2,0,8,height-.2,6,b.s.soilSubstrate);b.b(0,height-.2,1.2,8,.2,4.8,b.s.surfaceSoil);});
 b.part('真实干砌石埂，不含砂浆，保留有限石缝',()=>{b.b(0,.2,0,8,height-.2,1.2,b.s.weatheredRock);for(let x=0;x<40;x++)for(let y=1;y<H;y++){if(mod(x+Math.floor(y/2)*3,8)===0&&y>1)b.g.set([x,y,0],0);else if((x+y)%4===0)b.g.set([x,y,0],b.s.bedrock);}for(let x=0;x<40;x+=3)if(x<16||x>=22)b.g.set([x,H,2],b.s.weatheredRock);});
 b.part('同源浅水沟与真实沟底',()=>{b.b(0,height-.4,4.8,8,.4,.8,0);b.b(0,height-.6,4.8,8,.2,.8,b.s.waterWornRock);b.b(0,height-.4,4.8,8,.2,.8,b.s.water);});
 b.part('与农地同顶高的通路及跨沟承石，沟水仍在下方',()=>b.b(3.2,height-.2,0,1.2,.2,6,b.s.wall));
 b.part('避开实际通路与水沟的田地草叶',()=>{for(const x of[.8,2,5.2,6.6])for(const z of[2,3.6]){b.g.set([q(x),H,q(z)],b.s.plantStem);leaf(b,[x,height,z],.45,.2,x+z,.5,b.s.grassBlade,.1);}});d.fieldTopYM=height;d.pathM={min:[3.2,height,0],max:[4.4,height+1.72,6]};d.ditch={waterTopYM:height-.2,bedTopYM:height-.4,zRangeM:[4.8,5.6],pathBridgeRetainsWater:true};d.dryStoneMortar=false;
}
const definitions:[string,V3,string,string][]=[
 ['ENV-062',[1.6,.6,1.6],'三株真实量化草叶簇、独立茎叶与根茎','保留0.4/0.6m高度与0.2m方茎；不是完整草坡，不能为追图擅自放大。'],
 ['ENV-064',[3.4,1.8,3.2],'蕨状羽片与阔叶地被两种实际叶架','明确作者小地被套装，具体物种和湿度分区未获原状态核实。'],
 ['ENV-065',[3.2,2.2,3.2],'四根细茎、真实穗序与弯叶的芦苇簇','源四茎0.2×1.6×0.2m，穗高另加0.6m；根须实接岸床。'],
 ['ENV-066',[4,2.4,3.4],'床面根茎、同水深叶柄、荷叶盘与独立荷花组织','只在作者0.4/0.8m浅静水样件验证，不放急瀑/深河；不模拟浮力。'],
 ['ENV-067',[3.6,5,.6],'真实附壁锚与垂茎、独立藤叶','顶部锚为原点，向负Y垂落，壁面Z0。原每tile最多360块是源描述，作者叶簇放置数独立记录，不称原tile绑定。'],
 ['ENV-069',[6,2.2,3.4],'枯叶、分叉枯枝与真空心倒木有限套装','枯叶不是食品茶叶，腐木/树皮/心材分别归类；近地接触、孔洞及通路需要安装核实。'],
 ['ENV-077',[12,4.6,10],'真实中庭/地下开挖、深土岩底与有土顶入口','明确作者footprint和坑形；原建筑定义未收件，不复制灯饰或把新坑当原地下室。'],
 ['ENV-078',[12,6.2,12],'保留真实崖阶的局部肩坡与岩质检查台阶','原54m/.82广肩坡抹平悬崖是已知问题；本作为12m局部街台研究，不称该旧缺陷已在原游戏修复。'],
 ['ENV-081',[10,3.8,8],'四个同源承托面与连续宽岩土基础','原楼板/柱属于建筑域，本母版不包含楼板或柱；辅助架仅核实际多点接触，不认证地基承载力。'],
 ['ENV-082',[8,3.6,2.8],'真实厚基脚、墙身收分、石砌缝与穿墙泄水槽','仅验证2.4/3.6m作者高度；砌缝量化0.2m是原生视觉分区，不是施工尺寸。安装需有实背填土和地面。'],
 ['ENV-084',[8,.4,1.6],'独立滴水压顶与真孔泄水石套','盖石下缘有实际槽，泄水套有0.2m贯通孔；附加套装配在明确作者挡墙上，不声称水力系统完成。'],
 ['ENV-085',[8,1.6,6],'干砌矮石埂、田块、通路和浅沟同源组件','田地/路面统一0.8或1.2m高程，水沟低0.2m；实土岩支撑，非漂浮石圈，原farm布局未绑定。']
];
function draw(b:Shapes,id:string,p:Params,d:Detail){switch(id){case'ENV-062':return grass(b,Number(p.height));case'ENV-064':return groundcover(b,String(p.groundcover));case'ENV-065':return reed(b,d);case'ENV-066':return lotus(b,Number(p.waterDepth),d);case'ENV-067':return vines(b,Number(p.vineDrop),d);case'ENV-069':return litter(b,String(p.litterForm),d);case'ENV-077':return excavation(b,String(p.excavation),d);case'ENV-078':return shoulder(b,d);case'ENV-081':return foundation(b,String(p.substrate),d);case'ENV-082':return retainingWall(b,Number(p.height),d);case'ENV-084':return wallDetail(b,String(p.detail),d);case'ENV-085':return terrace(b,Number(p.terraceHeight),d);default:throw new Error('缺少地被/地形配方');}}
export const groundscapeRecipes:Record<string,AtlasRecipe>=Object.fromEntries(definitions.map(([id,size,features,note])=>[id,{size,pitch,features,limits:note+limits,draw:(b:Shapes)=>draw(b,id,groundscapeDefaults[id],{openings:[]})}]));
const roleSets:Record<string,string[]>={'ENV-062':['rootRhizome','plantStem','grassBlade'],'ENV-064':['rootRhizome','plantStem','fernFrond','groundcoverLeaf'],'ENV-065':['rootRhizome','reedCulm','reedPanicle','reedBlade'],'ENV-066':['rootRhizome','aquaticPetiole','lotusLeaf','lotusPetal','lotusReceptacle'],'ENV-067':['rootRhizome','vineStem','vineLeaf'],'ENV-069':['deadLeaf','deadWood','treeBark','rootHeartwood','moss'],'ENV-077':['bedrock','soilSubstrate','surfaceSoil','earthCutaway','wall'],'ENV-078':['bedrock','weatheredRock','surfaceSoil','moss'],'ENV-081':['bedrock','weatheredRock','soilSubstrate','surfaceSoil','moss'],'ENV-082':['wall','mortar'],'ENV-084':['wall','mortar'],'ENV-085':['bedrock','soilSubstrate','surfaceSoil','weatheredRock','waterWornRock','water','wall','plantStem','grassBlade']};
export function inspectGroundscapeMaterials(id:string,a:Asset,s:Record<string,number>){if(!groundscapeRecipes[id])return null;const allowed=roleSets[id],p=a.source!.parameters as Params,excluded=id==='ENV-064'?[p.groundcover==='fern'?'groundcoverLeaf':'fernFrond']:id==='ENV-069'?(p.litterForm==='leaves'?['treeBark','rootHeartwood','moss']:p.litterForm==='branches'?['rootHeartwood','moss']:[]):id==='ENV-081'?(p.substrate==='rock'?['soilSubstrate','surfaceSoil']:['weatheredRock']):[],required=allowed.filter(r=>!excluded.includes(r)),used=new Set([...new Grid(a.chunks).cells()].map(([,m])=>m));for(const role of required)if(!used.has(s[role]))throw new Error(id+' 缺少实际用途材质 '+role);for(const m of used)if(!allowed.some(r=>s[r]===m))throw new Error(id+' 非约定用途材质 '+m);return{revision:1,method:'authored-use-and-actual-voxel-check',note:'草/蕨/地被/芦苇茎穗/荷叶柄花托/藤/枯叶腐木按用途独立，深土/开挖面/石墙/砂浆/沟水明确分层；叶花零发光，干砌石不含砂浆。'};}
export function makeGroundscapeAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Params={}):Asset{const r=groundscapeRecipes[catalogId];if(!r)throw new Error('尚无地被/地形衔接母版');const p=paramsFor(catalogId,params),s=new Proxy(style,{get(t,k){if(typeof k==='symbol')return Reflect.get(t,k);if(!Number.isInteger(t[k])||t[k]<1||t[k]>65535)throw new Error('缺少用途材质 '+k);return t[k];}}),b=new Shapes(pitch,s),d:Detail={openings:[]};draw(b,catalogId,p,d);if(b.g.count>1_000_000)throw new Error('单母版超过百万原生格预算');const bounds=b.g.bounds()!,a=b.finish(id,name,{kind:'catalog-recipe',catalogId,recipeRevision:3,styleReference:productionReference,styleRevision:productionStyleRevision,parameters:p,dimensionsM:bounds.max.map((n,i)=>(n-bounds.min[i])*pitch),nominalDesignSizeM:r.size,features:r.features,geometryStage:'candidate',reference:atlasSource(catalogId),referenceStage:'candidate',limitations:r.limits,units:'metres',front:'-Z',gameIntegration:false,animation:false,detail:d,terrain:{physicalPitchM:pitch,editPitchM:pitch,displaySource:'native occupancy',collisionSource:'native occupied solid materials',originalWorldBound:false,autoLOD:false}});a.openings=d.openings;a.ports[0].position=[0,0,0];
 if(catalogId==='ENV-067'){a.ports[0]={id:'wall-top',kind:'wall-attachment',position:[0,0,0],normal:[0,0,1],size:[2.4,0,0],pitch};for(const[v,i]of (d.attachmentsM as V3[]).map((v,i)=>[v,i] as const))a.ports.push({id:'holdfast-'+i,kind:'wall-attachment',position:[v[0],v[1],0],normal:[0,0,1],size:[.2,.2,0],pitch});}
 if(catalogId==='ENV-081')for(const[p,i]of bearingPads.map((p,i)=>[p,i] as const))a.ports.push({id:'bearing-'+i,kind:'foundation-contact',position:[p.x+.8,p.top,p.z+.8],normal:[0,1,0],size:[1.6,0,1.6],pitch});
 if(catalogId==='ENV-085')a.source!.waterFlow={routes:[{points:[[0,Number(p.terraceHeight)-.2,5.2],[8,Number(p.terraceHeight)-.2,5.2]],startDistanceM:0}],materialIds:[s.water],animated:false,originalRouteBound:false};
 a.source!.materialAssignmentReview=inspectGroundscapeMaterials(catalogId,a,style);return a;}
