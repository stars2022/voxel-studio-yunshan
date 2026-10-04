import {Shapes} from './shapes';
import {Grid} from '../core/grid';
import type {Asset,V3} from '../core/types';
import type {AtlasRecipe} from './atlas-life';
import {atlasSource} from './atlas-life';
import {productionReference,productionStyleRevision} from './style';
import type {FlowRoute,WaterFlow} from '../core/water-flow';
const pitch=.2;
const limits='完整0.2m原生占用，米制/Y向上，编辑/显示/固体碰撞同源；静态近远网格共面合并，水面共面顶点及T接点共享索引，硬边法线独立。原WorldDefinition、单河九点/单瀑原路径、terrainHeight、96m流送、身体控制器均未提供；作者样件，不称原游戏集成或人工美术验收。水/泡沫非碰撞、不发光，无动画、流体、浮力或运行水速。';
export const originalHydrologyDimensions={fallHeightM:153,fallWidthM:24,poolRadiusM:50,poolPolygonSides:24,legacyFarPeaks:23,legacyFarSamplingM:48} as const;
type Params=Record<string,number|string>;
type Route=FlowRoute&{widthM:number};
export const hydrologyDefaults:Record<string,Params>={'ENV-014':{soilDepth:2},'ENV-015':{},'ENV-016':{grainDiameter:.8},'ENV-017':{shoreSize:3.6},'ENV-019':{},'ENV-026':{},'ENV-027':{},'ENV-028':{},'ENV-029':{},'ENV-032':{levels:3,stepHeight:2},'ENV-034':{waterWidth:2.4},'ENV-035':{component:'junctionY'}};
export function hydrologyParameters(id:string):Record<string,any>{const choose=(values:(number|string)[],value:number|string,description:string)=>({type:typeof value==='string'?'string':'number',enum:values,default:value,description});switch(id){case'ENV-014':return{soilDepth:choose([1,2],2,'同族浅/深土，厚度米')};case'ENV-016':return{grainDiameter:choose([.4,.8],.8,'群落最大粒径米；实际0.2m量化，不按粒计模型')};case'ENV-017':return{shoreSize:choose([1.2,3.6],3.6,'底锚一致的水蚀岸石宽/深米')};case'ENV-032':return{levels:choose([2,3],3,'真实落差级数'),stepHeight:choose([1,2],2,'每级米制落差')};case'ENV-034':return{waterWidth:choose([1.2,2.4],2.4,'真实溪槽宽度米')};case'ENV-035':return{component:choose(['junctionY','junctionT','bendLeft','bendRight'],'junctionY','同族Y/T汇口与左右河弯')};default:return{};}}
export function hydrologyVariants(id:string):Params[]{const entries=Object.entries(hydrologyParameters(id));let variants:Params[]=[{}];for(const[k,def]of entries)variants=variants.flatMap(p=>def.enum.map((v:number|string)=>({...p,[k]:v})));return variants;}
function parameters(id:string,params:Params){const defs=hydrologyParameters(id);for(const[k,v]of Object.entries(params))if(!defs[k]?.enum.includes(v))throw new Error('未验证的水文/岩土参数 '+k);return{...hydrologyDefaults[id],...params};}
const quant=(n:number)=>Math.round(n/pitch),mod=(n:number,m:number)=>(n%m+m)%m;
function foliage(b:Shapes,x:number,y:number,z:number){b.b(x,y,z,.6,.2,.6,b.s.moss);b.b(x+.2,y+.2,z+.2,.2,.4,.2,b.s.shrubFoliage);}
function rootedSoil(b:Shapes,soilDepth:number){const top=2+soilDepth;
 b.part('真实基岩与不规则土岩界面',()=>{for(let x=0;x<40;x++)for(let z=0;z<30;z++){const h=9+(mod(Math.floor(x/5)+Math.floor(z/6),3)===0?2:0);for(let y=0;y<h;y++)b.g.set([x,y,z],y<2?b.s.bedrock:b.s.weatheredRock);}});
 b.part('有厚度深土与独立表土剖面',()=>{for(let x=0;x<40;x++)for(let z=0;z<30;z++){const base=9+(mod(Math.floor(x/5)+Math.floor(z/6),3)===0?2:0);for(let y=base;y<quant(top);y++)b.g.set([x,y,z],y<quant(top)-2?b.s.soilSubstrate:b.s.surfaceSoil);}});
 b.part('连续树干、实际树皮和切口心材',()=>{b.cylinder(4,top,2,.8,1.6,b.s.treeBark);b.cylinder(4,top+1.4,2,.6,.2,b.s.rootHeartwood);for(const x of[3.2,4.6])b.b(x,top+.2,1.8,.2,1.2,.4,b.s.rootHeartwood);});
 b.part('真实贴入土岩的外露主根和分根',()=>{for(const x of[2.2,3.4,4.6,5.8]){b.beam([4,top+.4,2],[x,top-.4,.2],.4,b.s.treeBark);b.beam([x,top-.4,.2],[x-.4,2,-.2],.2,b.s.treeBark);b.beam([x-.4,2,-.2],[x-.8,1.6,.2],.2,b.s.treeBark);b.beam([x,top-.8,0],[x+.6,2.4,-.2],.2,b.s.rootHeartwood);}});
 b.part('地面苔层和稀疏灌木',()=>{for(const[x,z]of[[.6,.8],[6.6,1],[1.2,4.6],[5.8,4.4]])foliage(b,x,top,z);});
}
function monolith(b:Shapes){
 b.part('不规则完整接地岩足与渐变岩柱',()=>{for(let x=0;x<24;x++)for(let z=0;z<24;z++){const X=(x+.5)*pitch-2.4,Z=(z+.5)*pitch-2.4,r=Math.abs(X)/2.4+Math.abs(Z)/2.4;if(r>1.55)continue;const h=Math.round((r<.8?7.6:r<1.1?4.2:1.4)/pitch)-(mod(x+2*z,7)===0?1:0);for(let y=0;y<h;y++)b.g.set([x,y,z],b.s.bedrock);}});
 b.part('真实风化暴露面与不规则端裂',()=>{for(const[v]of b.g.cells()){const[x,y,z]=v;if((mod(Math.floor(x/3)+Math.floor(z/4),3)===1&&y%7<2)||!b.g.get([x,y+1,z]))b.g.set(v,b.s.weatheredRock);}b.b(2.2,5.8,.8,.4,2,2.4,0);b.b(.8,3.8,2.6,1,.6,.4,0);});
 b.part('接地薄岩屑，避免独立浮石',()=>{for(const[x,z]of[[.6,1],[3.2,.6],[1,3.2]]){b.b(x,0,z,.8,.4,.6,b.s.weatheredRock);b.b(x+.2,.4,z+.2,.4,.2,.2,b.s.bedrock);}});
 b.part('岩肩贴生植被',()=>{for(const[x,z]of[[1.4,1.6],[2.8,2.8]]){const xx=quant(x),zz=quant(z);let y=0;while(b.g.get([xx,y,zz]))y++;b.g.set([xx,y,zz],b.s.moss);b.g.set([xx,y+1,zz],b.s.shrubFoliage);}});
}
function gravel(b:Shapes,diameter:number){
 b.part('实际薄岩床和土夹层，不用整坡散盒',()=>{b.b(0,0,0,6,.2,6,b.s.bedrock);for(const[x,z]of[[.2,.2],[3,4],[4,.6]])b.b(x,0,z,1.2,.2,.8,b.s.surfaceSoil);});
 const stones=[[.6,.6],[1.4,1.2],[2.2,.6],[4,.8],[4.6,.6],[5.2,1.6],[.8,2.2],[1.8,2.6],[4.6,2.8],[5.4,3.8],[.6,4],[1.6,4.8],[2.4,5.4],[4,4.6],[4.8,5.2]];
 for(const parity of[0,1])b.part(parity?'暖灰角砾，逐格实接岩床':'深灰角砾，大小量化而非各算母版',()=>{for(const[i,[cx,cz]]of stones.entries()){if(i%2!==parity)continue;const n=Math.max(2,quant(diameter)-(i%3)),r=n/2;for(let x=0;x<n;x++)for(let z=0;z<n;z++){const norm=(Math.abs(x+.5-r)+Math.abs(z+.5-r))/r;if(norm>1.5)continue;const h=Math.max(1,Math.round(n*(1-.4*norm)));for(let y=0;y<h;y++)b.g.set([quant(cx)-Math.floor(r)+x,1+y,quant(cz)-Math.floor(r)+z],parity?b.s.weatheredRock:b.s.bedrock);}}});
 b.part('离散粒顶实风化面',()=>{for(const[v,m]of b.g.cells())if(v[1]>1&&!b.g.get([v[0],v[1]+1,v[2]])&&m===b.s.bedrock&&mod(v[0]+v[2],3)===0)b.g.set(v,b.s.weatheredRock);});
}
function shoreRock(b:Shapes,size:number){const n=quant(size),h=quant(size*2/3);
 b.part('有实际平底的水蚀岩体和退层岸肩',()=>{for(let x=0;x<n;x++)for(let z=0;z<n;z++){const X=Math.abs((x+.5)/n-.5),Z=Math.abs((z+.5)/n-.5);if(X+Z>.85)continue;const top=Math.max(2,Math.round(h*(.45+.55*(z+.5)/n))-(mod(x+z,5)===0?1:0));for(let y=0;y<top;y++)b.g.set([x,y,z],b.s.waterWornRock);}});
 b.part('实际侵蚀凹穴与保留上方岩顶',()=>{const x=Math.max(1,Math.floor(n*.35)),width=Math.max(1,Math.floor(n*.3));b.b(x*pitch,.2,0,width*pitch,.2,Math.max(.4,size*.25),0);});
 b.part('较暗浸蚀基面和独立顶面风化石',()=>{for(const[v]of b.g.cells()){if(v[1]===0&&v[2]<n/2)b.g.set(v,b.s.bedrock);else if(!b.g.get([v[0],v[1]+1,v[2]])&&mod(v[0]+v[2],4)===0)b.g.set(v,b.s.weatheredRock);}});
 b.part('顶肩稀疏苔层',()=>{const x=Math.floor(n*.5),z=Math.floor(n*.7);let y=0;while(b.g.get([x,y,z]))y++;if(y)b.g.set([x,y,z],b.s.moss);});
}
function distantRidge(b:Shapes){
 const peaks=[[5,7,10],[14,6,16],[24,7,12],[33,6,18],[43,7,13]];
 b.part('一个连续代理岩脊体，不把峰实例各算模型',()=>{for(let x=0;x<240;x++)for(let z=0;z<60;z++){const X=(x+.5)*pitch,Z=(z+.5)*pitch;let h=.4;for(const[cx,cz,top]of peaks){const d=Math.abs(X-cx)/8+Math.abs(Z-cz)/6;h=Math.max(h,top*Math.max(0,1-d)**.6);}const H=Math.max(2,Math.floor(h/pitch));for(let y=0;y<H;y++)b.g.set([x,y,z],b.s.distantRock);}});
 b.part('显式岩脊断口浅槽',()=>{for(const x of[9.6,19.4,29.2,38.8])b.b(x,1,4,.2,2,.4,0);});
 b.part('代理顶部贴生苔层',()=>{for(let x=10;x<230;x+=21)for(let z=15;z<45;z+=11){let y=0;while(b.g.get([x,y,z]))y++;b.g.set([x,y,z],b.s.moss);}});
 b.part('代理上稀疏叶簇，无行走地形承诺',()=>{for(const[cx,cz]of peaks){const x=quant(cx),z=quant(cz);let y=0;while(b.g.get([x,y,z]))y++;b.g.set([x,y,z],b.s.shrubFoliage);b.g.set([x,y+1,z],b.s.shrubFoliage);}});
}
const route=(points:V3[],widthM:number,startDistanceM=0):Route=>({points,widthM,startDistanceM});
export function authoredWaterRoutes(id:string,p:Params):Route[]{
 if(id==='ENV-026')return[route([[5,6.4,0],[5,6.4,8],[5,.4,8],[5,.4,16]],4)];
 if(id==='ENV-027')return[route([8,7,5,5,8,10,11,9,8].map((x,i)=>[x,.4,i*4] as V3),4)];
 if(id==='ENV-028')return[route([[12,153,1.2],[12,0,1.2]],24)];
 if(id==='ENV-029')return[route([[50,.4,14],[50,.4,106]],4)];
 if(id==='ENV-032'){const n=Number(p.levels),step=Number(p.stepHeight),points:V3[]=[[6,.4+n*step,0]];for(let i=1;i<=n;i++){points.push([6,.4+(n-i+1)*step,i*6],[6,.4+(n-i)*step,i*6]);}points.push([6,.4,n*6+2]);return[route(points,4)];}
 if(id==='ENV-034')return[route([[4,3.4,0],[4.4,3.2,2],[4.6,2.8,4],[4.2,2.2,6],[3.6,1.8,8],[3.4,1.2,10],[3.8,.8,12],[4,.4,16]],Number(p.waterWidth))];
 if(id==='ENV-035'){const c=p.component;if(c==='junctionY'){const a:V3=[5,.4,0],b:V3=[15,.4,0],j:V3=[10,.4,10];return[route([a,j],2.4,-Math.hypot(5,10)),route([b,j],2.4,-Math.hypot(5,10)),route([j,[10,.4,20]],4)];}if(c==='junctionT')return[route([[10,.4,0],[10,.4,10]],2.4,-10),route([[0,.4,10],[10,.4,10]],2.4,-10),route([[10,.4,10],[10,.4,20]],4)];return[route([[10,.4,0],[10,.4,10],[c==='bendLeft'?0:20,.4,10]],4)];}
 return[];
}
function closestXZ(x:number,z:number,routes:Route[]){let best=Infinity,result={margin:Infinity,height:0,distance:Infinity};for(const r of routes)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=dx*dx+dz*dz;if(!len)continue;const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/len)),distance=Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz),margin=distance-r.widthM/2;if(margin<best){best=margin;result={margin,height:a[1]+t*(b[1]-a[1]),distance};}}return result;}
function channel(b:Shapes,id:string,w:number,d:number,routes:Route[]){const nx=quant(w),nz=quant(d),top=new Int16Array(nx*nz),wet=new Uint8Array(nx*nz),bank=new Uint8Array(nx*nz);
 for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){const q=closestXZ((x+.5)*pitch,(z+.5)*pitch,routes),k=x+z*nx;if(q.margin>1.2)continue;top[k]=Math.max(2,Math.round(q.height/pitch));wet[k]=Number(q.margin<=1e-8);bank[k]=1;}
 b.part('同路由真实连续河床与岸岩实体',()=>{for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){const k=x+z*nx;if(!bank[k])continue;const h=top[k]-1+(wet[k]?0:3+mod(Math.floor(x/4)+Math.floor(z/5),3));for(let y=0;y<h;y++)b.g.set([x,y,z],y===0?b.s.bedrock:b.s.waterWornRock);}});
 b.part('连续薄水层，水与岸共享逐格描述',()=>{for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){const k=x+z*nx;if(wet[k])b.g.set([x,top[k]-1,z],b.s.flowWater);}});
 b.part('重力方向真实落水竖面，切除原床而非穿岩',()=>{for(let x=0;x<nx;x++)for(let z=0;z<nz-1;z++){const k=x+z*nx,j=k+nx;if(wet[k]&&wet[j]&&top[j]<top[k])for(let y=top[j]-1;y<top[k];y++)b.g.set([x,y,z],b.s.fallWater);}});
 b.part('落点泡沫与岸边水泡，仅替换水体格',()=>{for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){const k=x+z*nx;if(!wet[k])continue;const impact=z>0&&top[k-nx]>top[k],bankEdge=(x>0&&!wet[k-1])||(x<nx-1&&!wet[k+1]);if((impact||bankEdge)&&mod(x+z,3)!==0)b.g.set([x,top[k]-1,z],b.s.waterFoam);}});
 b.part('岸岩上实生表土与苔层',()=>{for(let x=1;x<nx-1;x++)for(let z=2;z<nz-2;z++){const k=x+z*nx;if(!bank[k]||wet[k])continue;let y=top[k]+2+mod(Math.floor(x/4)+Math.floor(z/5),3);if(mod(x+z,7)===0)b.g.set([x,y-1,z],b.s.surfaceSoil);if(mod(x+z*3,19)===0)b.g.set([x,y,z],b.s.moss);}});
 b.part('岸肩稀疏灌丛，端口两米内不植入',()=>{for(let x=2;x<nx-2;x+=7)for(let z=10;z<nz-10;z+=13){const k=x+z*nx;if(bank[k]&&!wet[k]){const y=top[k]+2+mod(Math.floor(x/4)+Math.floor(z/5),3);b.g.set([x,y,z],b.s.shrubFoliage);b.g.set([x,y+1,z],b.s.shrubFoliage);}}});
}
function curtain(b:Shapes){const nx=quant(originalHydrologyDimensions.fallWidthM),ny=quant(originalHydrologyDimensions.fallHeightM);
 b.part('153米完整落差、24米宽真实水帘体',()=>{for(let x=0;x<nx;x++)for(let y=0;y<ny;y++){const z=5+Math.round(Math.sin(y*.03)*.5);for(let k=0;k<2;k++)b.g.set([x,y,z+k],b.s.fallWater);}});
 b.part('逐条透明水芯，保持原水帘占用与连接',()=>{for(let x=1;x<nx;x+=5)for(let y=0;y<ny;y++){const z=5+Math.round(Math.sin(y*.03)*.5);b.g.set([x,y,z+1],b.s.flowWater);}});
 b.part('顶部两米起落水脊与底部五米静态泡沫条',()=>{for(let x=0;x<nx;x++)for(let y=0;y<ny;y++)if((y<25||y>ny-10)&&mod(x+y,7)<2){const z=5+Math.round(Math.sin(y*.03)*.5);b.g.set([x,y,z],b.s.waterFoam);}});
 b.part('完整落水边缘连接带',()=>{for(const y of[0,ny-1])for(let x=0;x<nx;x++)b.g.set([x,y,6],b.s.fallWater);});
}
export function inPool(x:number,z:number,r=50){const X=x-50,Z=z-50,apothem=r*Math.cos(Math.PI/24);for(let i=0;i<24;i++){const a=(2*i+1)*Math.PI/24;if(X*Math.cos(a)+Z*Math.sin(a)>apothem+1e-8)return false;}return true;}
function pool(b:Shapes){const nx=500,nz=530,shape=(x:number,z:number)=>inPool(x,z)||(x>=46.8&&x<53.2&&z>=90&&z<106),inside=(x:number,z:number)=>inPool(x,z,48.8)||(x>=48&&x<52&&z>=90&&z<106);
 b.part('50米半径24边真实潭床和接河出口',()=>{for(let x=0;x<nx;x++)for(let z=0;z<nz;z++)if(shape((x+.5)*pitch,(z+.5)*pitch))b.g.set([x,0,z],b.s.bedrock);});
 b.part('薄水层与独立岸石，出口不封闭',()=>{for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){const X=(x+.5)*pitch,Z=(z+.5)*pitch;if(!shape(X,Z))continue;if(inside(X,Z))b.g.set([x,1,z],b.s.flowWater);else for(let y=1;y<5+mod(Math.floor(x/10)+Math.floor(z/13),3);y++)b.g.set([x,y,z],b.s.waterWornRock);}});
 b.part('明确作者落点的静态冲击泡沫',()=>{for(let x=190;x<310;x++)for(let z=20;z<120;z++){const r=Math.hypot((x+.5)*pitch-50,(z+.5)*pitch-14);if(r<8&&mod(x+z*3,7)<3&&b.g.get([x,1,z])===b.s.flowWater)b.g.set([x,1,z],b.s.waterFoam);}});
 b.part('实际岸岩上的少量苔层与叶簇',()=>{for(let x=2;x<nx-2;x+=13)for(let z=2;z<500;z+=17){if(b.g.get([x,2,z])!==b.s.waterWornRock)continue;let y=2;while(b.g.get([x,y,z]))y++;b.g.set([x,y,z],b.s.moss);if(mod(x+z,3)===0)b.g.set([x,y+1,z],b.s.shrubFoliage);}});
}
function draw(b:Shapes,id:string,p:Params){switch(id){case'ENV-014':return rootedSoil(b,Number(p.soilDepth));case'ENV-015':return monolith(b);case'ENV-016':return gravel(b,Number(p.grainDiameter));case'ENV-017':return shoreRock(b,Number(p.shoreSize));case'ENV-019':return distantRidge(b);case'ENV-028':return curtain(b);case'ENV-029':return pool(b);default:{const d=id==='ENV-026'?16:id==='ENV-027'?32:id==='ENV-032'?Number(p.levels)*6+2:id==='ENV-034'?16:20,w=id==='ENV-026'?10:id==='ENV-027'?16:id==='ENV-032'?12:id==='ENV-034'?8:20;return channel(b,id,w,d,authoredWaterRoutes(id,p));}}}
const definitions:[string,V3,string,string][]=[
 ['ENV-014',[8,6,6.4],'岩土剖面与裸露木质根：连续岩基、真厚深土/表土、树皮根和截面心材','soilDepth为1/2米两个已验证厚度，同一根际家族。'],
 ['ENV-015',[4.8,8.2,4.8],'中尺度破岩独石：非规则接地岩足、渐变柱身、真实端裂与肩台植被','底锚为实测包围盒底中，放在明确岩地上；不能盖住原地形裂缝。'],
 ['ENV-016',[6,1,6],'0.2米量化碎石群落：大小角砾、两种实际岩材与薄岩床','最大粒径参数0.4/0.8米，群内量化粒径0.4–0.8；石粒不是额外母版。'],
 ['ENV-017',[3.6,2.6,3.6],'灰白水蚀岸石：有限平底、退层石肩、真实侵蚀凹穴和湿基面','1.2/3.6米两个宽深规格，独立石件，不把配景水/整个河床算成该岩石。'],
 ['ENV-019',[48,19,12],'一个远山连续岩脊代理：五个明确作者峰形、浅断口与远景叶簇','原23峰参数/48m采样原件未取得。本作48m宽作者代理用完整0.2m占用，distantRock非碰撞，不称可探索山体或23个模型。'],
 ['ENV-026',[10,8,16],'单瀑四节点共享路径：上游平段、一次6米落差与下游接槽','由作者top6.4/bottom0.4派生四节点、三线段；只有一个落瀑，不能因参考拼图冒称原多瀑。'],
 ['ENV-027',[16,1.6,32],'九点作者连续河面：弯曲水带、共享顶点、累积米制流向UV及同源岩床','原九点中心线未收件；新作九点坐标明确，不称原线路复原。河床和岸线由相同路由生成。'],
 ['ENV-028',[24,153,1.8],'153米落差与24米宽原生水帘：真细格水体、透明水芯与有限静态泡沫','保留原给定落差和宽度；无原世界起落高程，使用局部0–153m。纯非碰撞水体组件，在明确床/潭场景验证不穿岩。'],
 ['ENV-029',[100,2,106],'50米半径24边基形潭面：真岩床、岸岩、明确冲击区和6米接河出口','保留原50m半径/24边基形，新增作者4m宽接河口；多边潭岸仍为候选，非原自然潭地形美术验收。'],
 ['ENV-032',[12,8,20],'可核多级跌水：连续水床、真实阶差、每级落点静态泡沫与接续口','已验证2/3级和每级1/2米，四个组件形状，均顺坡，不把水帘穿进岩床。'],
 ['ENV-034',[8,5,16],'山涧支流：有深度的量化溪床、窄水带、坡向连续落水和真实上下口','已验证宽1.2/2.4m；作者上游3.4m、下游0.4m，需在明确上源和汇口场景接续，不是原水源复原。'],
 ['ENV-035',[20,1.6,20],'支流Y/T汇口和左右河弯：原生布尔并水面、同源岸线、共享索引及一致UV','同一家族四拓扑形状，汇点站距0、上游负站距、下游正站距；静态UV，无流动纹理动画。'],
];
export const hydrologyRecipes:Record<string,AtlasRecipe>=Object.fromEntries(definitions.map(([id,size,features,note])=>[id,{size,pitch,features,limits:note+limits,draw:(b:Shapes)=>draw(b,id,hydrologyDefaults[id])}]));
const geologyRoles:Record<string,string[]>={'ENV-014':['bedrock','weatheredRock','soilSubstrate','surfaceSoil','treeBark','rootHeartwood','moss','shrubFoliage'],'ENV-015':['bedrock','weatheredRock','moss','shrubFoliage'],'ENV-016':['bedrock','weatheredRock','surfaceSoil'],'ENV-017':['waterWornRock','bedrock','weatheredRock','moss'],'ENV-019':['distantRock','moss','shrubFoliage'],'ENV-028':['flowWater','fallWater','waterFoam'],'ENV-029':['bedrock','waterWornRock','flowWater','waterFoam','moss','shrubFoliage']};
export function inspectHydrologyMaterials(id:string,a:Asset,s:Record<string,number>){if(!hydrologyRecipes[id])return null;const required=geologyRoles[id]??['bedrock','waterWornRock','flowWater','waterFoam','surfaceSoil','moss','shrubFoliage',...(['ENV-026','ENV-032','ENV-034'].includes(id)?['fallWater']:[])],used=new Set([...new Grid(a.chunks).cells()].map(([,m])=>m));for(const r of required)if(!used.has(s[r]))throw new Error(id+' 缺少实际用途材质 '+r);for(const m of used)if(!required.some(r=>s[r]===m))throw new Error(id+' 非约定用途材质 '+m);return{revision:1,method:'authored-use-and-actual-voxel-check',note:'树皮/根心材、深土/表土、水蚀石、独立流水/水帘/泡沫及远景非碰撞岩代理分别归类；水和泡沫零发光，原生格与材质ID权威。'};}
export function makeHydrologyAsset(catalogId:string,name:string,id:string,style:Record<string,number>,params:Params={}):Asset{const r=hydrologyRecipes[catalogId];if(!r)throw new Error('尚无该水文母版');const p=parameters(catalogId,params),s=new Proxy(style,{get(t,k){if(typeof k==='symbol')return Reflect.get(t,k);if(!Number.isInteger(t[k])||t[k]<1||t[k]>65535)throw new Error('缺少用途材质 '+k);return t[k];}}),b=new Shapes(pitch,s);draw(b,catalogId,p);if(b.g.count>1_000_000)throw new Error('水文单母版超过百万占用格预算');const bounds=b.g.bounds()!,routes=authoredWaterRoutes(catalogId,p),a=b.finish(id,name,{kind:'catalog-recipe',catalogId,recipeRevision:3,styleReference:productionReference,styleRevision:productionStyleRevision,dimensionsM:bounds.max.map((v,i)=>(v-bounds.min[i])*pitch),envelopeM:r.size,parameters:p,features:r.features,geometryStage:'candidate',gameIntegration:false,animation:false,units:'metres',front:'-Z',reference:atlasSource(catalogId),referenceStage:'candidate',limitations:r.limits,dimensionBasis:'explicit original dimensions only where stated; otherwise authored metre geometry on full 0.2m grid',terrain:{physicalPitchM:pitch,editPitchM:pitch,displaySource:'native occupancy',collisionSource:'native occupied solid materials',originalWorldBound:false,autoLOD:false},waterTopology:{originalRouteBound:false,waterSimulated:false,flowTextureAnimated:false,sharedIndexedVertices:!!routes.length,tJunctionsConformed:!!routes.length}});
 if(['ENV-015','ENV-017'].includes(catalogId)){a.origin=[-(bounds.min[0]+bounds.max[0])*pitch/2,-bounds.min[1]*pitch,-(bounds.min[2]+bounds.max[2])*pitch/2];a.ports[0].position=[0,0,0];a.source!.anchor='measured bottom centre';}
 if(routes.length){a.source!.waterFlow={routes,materialIds:[s.flowWater,s.fallWater,s.waterFoam],animated:false,originalRouteBound:false} satisfies WaterFlow;for(const[i,route]of routes.entries())for(const[end,index]of[['inlet',0],['outlet',route.points.length-1]]as const){const p=route.points[index],q=route.points[end==='inlet'?1:index-1],dir=p.map((v,d)=>v-q[d]),axis=dir.map(Math.abs).indexOf(Math.max(...dir.map(Math.abs))),normal:V3=[0,0,0];normal[axis]=Math.sign(dir[axis]);if(!normal[axis])normal[1]=Math.sign(dir[1]);a.ports.push({id:`route-${i}-${end}`,kind:'water-route',position:p,normal,size:axis===0?[0,.2,route.widthM]:axis===1?[route.widthM,0,.4]:[route.widthM,.2,0],pitch});}}
 if(catalogId==='ENV-028'){a.source!.fall={dropM:153,widthM:24,worldTopReceived:false,worldBottomReceived:false};a.ports.find(p=>p.id==='route-0-outlet')!.kind='water-impact';}
 if(catalogId==='ENV-029'){a.source!.pool={radiusM:50,polygonSides:24,outletWidthM:4,outletEndZM:106,authorImpactM:[50,.4,14],originalPoolShapeReceived:false};a.ports.push({id:'impact',kind:'water-impact',position:[50,.4,14],normal:[0,1,0],size:[24,0,.4],pitch});}
 if(catalogId==='ENV-019')a.source!.proxy={authoredPeaks:5,originalPeakParametersReceived:false,originalPeakCount:23,originalSamplingM:48,explorable:false};
 a.source!.materialAssignmentReview=inspectHydrologyMaterials(catalogId,a,style);return a;
}
