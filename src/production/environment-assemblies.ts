import type {Project,V3,Asset} from '../core/types';
import type {AuthorEnvironment} from '../core/author-environment';
import {authorEnvironmentState} from '../core/author-environment';
import type {AtmosphereTexture} from '../core/atmosphere-texture';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {civicAsset} from './civic-landmarks';
import {CivicComponent} from './civic-components';
import {LandscapeComponent,terrainTile,terrainHeightAt,type HeightField} from './landscape-components';
import {floodedField} from './habitat-components';
import {parkSource,pavedPad,pavilion,gardenBridge,parkPlants,parkPart,parkLamp,parkGuard} from './park-components';
import {districtHouse,route} from './district-components';
import {emptyMesh,quad} from './mesh-shapes';

export const environmentAssemblyIds=['ENV-115','ENV-121','ENV-126','ENV-129','ENV-130','ENV-132','ENV-133','ENV-135'];
export const environmentParameters=(id:string):Record<string,any>=>id==='ENV-115'||id==='ENV-133'?{hour:{type:'number',minimum:0,maximum:24,default:12}}:id==='ENV-121'?{weather:{enum:['clear','overcast','rain','fog'],default:'clear'}}:id==='ENV-129'?{windStrength:{enum:['calm','breeze','strong'],default:'breeze'}}:id==='ENV-130'?{winterCover:{enum:['snow','frost'],default:'snow'}}:id==='ENV-132'?{damageState:{enum:['baseline','aftermath'],default:'aftermath'}}:{};
export const environmentVariants=(id:string):Record<string,string|number>[]=>id==='ENV-115'?[{hour:12},{hour:18},{hour:0}]:id==='ENV-133'?[{hour:12},{hour:17}]:id==='ENV-121'?['clear','overcast','rain','fog'].map(weather=>({weather})):id==='ENV-129'?['calm','breeze','strong'].map(windStrength=>({windStrength})):id==='ENV-130'?['snow','frost'].map(winterCover=>({winterCover})):id==='ENV-132'?['baseline','aftermath'].map(damageState=>({damageState})):[{}];
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const climateGround:HeightField=(x,z)=>2+6*clamp((Math.abs(x)-2)/4)+5*clamp((z-10)/8)*clamp((Math.abs(x)-7)/5);
function background(b:ArchitectureBuilder,hour=12,weather:AuthorEnvironment['weather']='clear'){
 const visibility=weather==='fog'?.68:weather==='rain'?.8:1,skyAssetIds=['ENV-110','ENV-112','ENV-113','ENV-114'].map(id=>b.original(id,{hour,weather:weather==='clear'?'clear':'overcast',visibility}));
 for(const asset of skyAssetIds)b.place(asset,[0,0,0],0,'environment-background');
 return{version:1,hour,weather,visibility,skyAssetIds,clockSource:'author-preview',originalStateBound:false}as AuthorEnvironment;
}
/** Alpha cards are explicit nonphysical surfaces, never solid cloud voxel blocks. */
export function atmosphereCard(b:ArchitectureBuilder,key:string,kind:AtmosphereTexture['kind'],corners:V3[],density:number,light=1,wind=0,seed=52){
 const role=kind==='cloud'?'weatherCloud':kind==='fog'?'valleyFog':'rainDroplet',descriptor:AtmosphereTexture={version:1,kind,seed,density,light,wind};
 const asset=civicAsset(b,'atmosphere-'+key+'-'+JSON.stringify(descriptor)+'-'+JSON.stringify(corners),id=>{const c=new CivicComponent(b.p,id,kind==='cloud'?'真实透明云贴图':kind==='fog'?'地形范围内透明谷雾贴图':'有限降雨贴图层',['ENV-121','ENV-126'],{descriptor,physical:false}),m=emptyMesh('atmosphere-'+kind,c.role(role));quad(m,corners,[0,0,-1]);
  for(let j=0;j<m.positions.length;j+=3){const at=corners.findIndex(p=>p.every((n,d)=>Math.abs(n-m.positions[j+d])<1e-8));m.uvs[j/3*2]=[0,1,1,0][at];m.uvs[j/3*2+1]=[1,1,0,0][at];}
  m.atmosphere=descriptor;m.collision=false;c.meshes.push(m);const a=c.finish();a.meshes![0].atmosphere=descriptor;a.source!.openVisualSurface=true;a.source!.textureAuthority='Saved bounded descriptor and palette; evaluated RGBA is embedded in GLB and exported PNG';return a;});
 return b.place(asset,[0,0,0],0,'atmosphere');
}
function valley(b:ArchitectureBuilder,s:ReturnType<typeof parkSource>){
 terrainTile(b,s,'climate-valley',[0,0,0],climateGround,1,'near',40);s.waterBodies=[floodedField(b,'climate-river',climateGround,()=>3,[-20,-20,20,20],1)];
 for(const x of[-12,12]){pavedPad(b,s,'climate-bank-'+x,[x-3,-15,x+3,x<0?0:1],8.4,7.6);route(s,'bank approach '+x,[[x,8.4,-14],[x,8.4,x<0?4:2]],1.3);}
 gardenBridge(b,s,'climate-crossing',0,-9,18,8.4,climateGround);route(s,'actual valley crossing',[[-12,8.4,-9],[12,8.4,-9]],1.2);
 pavedPad(b,s,'climate-pavilion',[-16,0,-6,10],8.4,7.6);s.climatePavilion=pavilion(b,s,'climate-pavilion',-11,8.4,5,7,7);
 parkPart(b,'climate-house-foundation','真实房屋楼板底基础',c=>{c.box('基础实芯','structuralConcrete',8,7.6,1,8,.4,8);c.pin('基础边销','bronze',[8.1,7.8,1.1]);},['BUILT-003','ENV-081']);s.climateHouse=districtHouse(b,s,'climate-house',[12,8.4,5],8,8,1,false,undefined,false);
 parkPlants(b,s,'climate-tree',climateGround,[[-16,-6],[16,-6]],[['ENV-050',{height:16}]],1,-20);parkPlants(b,s,'climate-shrub',climateGround,[[-16,12],[16,12]],[['ENV-061',{habit:'low'}]],1,-20);
 parkLamp(b,s,[-15,8.4,1]);parkGuard(b,s,'left-bank-valley-edge',[-9.2,8.4,-6.6],[-9.2,8.4,-.2]);parkGuard(b,s,'right-bank-valley-edge',[9.2,8.4,-6.6],[9.2,8.4,.8]);
 s.originalRuntimeBound=false;s.authorValley={sizeM:40,waterY:3,walkY:8.4,sourceWorldBound:false};
}
function cloudLayers(b:ArchitectureBuilder,s:any,e:AuthorEnvironment,wind=0){
 const light=authorEnvironmentState(e).sunIntensity/3.6*.7+.3,count=e.weather==='clear'?2:e.weather==='overcast'?4:3,records=[];
 for(let j=0;j<count;j++){const x=-17+j*10+wind*2,y=24+(j%2)*3,z=12+j*1.4;const instance=atmosphereCard(b,'high-'+j,'cloud',[[x-8,y-3,z],[x+8,y-3,z],[x+8,y+3,z],[x-8,y+3,z]],e.weather==='clear'?.40:.82,light,wind,52+j);records.push(instance);}
 s.atmosphere={clouds:records,fog:[],rain:[],maximumCards:12,clockAuthority:'author snapshot',originalRuntimeBound:false};
 if(e.weather==='rain')for(const z of[-4,6,14]){const lower=Math.max(8.8,terrainHeightAt(climateGround,17,z,1,-20,-20)+.12);s.atmosphere.rain.push(atmosphereCard(b,'rain-'+z,'rain',[[-17,lower,z],[17,lower,z],[17,23,z],[-17,23,z]],.8,light,wind,64+z));}
 if(e.weather==='fog')fogLayers(b,s,light);
}
function fogLayers(b:ArchitectureBuilder,s:any,light=1){s.atmosphere??={clouds:[],fog:[],rain:[],maximumCards:12};
 // Thin crossed surfaces remain in the real open valley, below the landmarks.
 // Leave a central waterline corridor visible in ground and aerial views.
 for(const [j,z]of[-13,-3,7].entries())for(const side of[-1,1]){const x=side*2.3,low=(xx:number)=>Math.max(3.25,terrainHeightAt(climateGround,xx,z-3,1,-20,-20)+.12);s.atmosphere.fog.push(atmosphereCard(b,'valley-'+j+'-'+side,'fog',[[x-.8,low(x-.8),z-3],[x+.8,low(x+.8),z-3],[x+.8,low(x+.8)+1.95,z+3],[x-.8,low(x-.8)+1.95,z+3]],.6,light,0,80+j));}
 s.atmosphere.waterlineGapM=3;s.atmosphere.maximumFogLayersPerRay=6;s.atmosphere.landmarkHeightsM=[8.4,12.4];s.atmosphere.volumetricScattering=false;
}
function windFlag(b:ArchitectureBuilder,strength:string){const amount=strength==='calm'?0:strength==='breeze'?.5:1;
 const instance=parkPart(b,'climate-wind-'+strength,'同一作者风向的连续旗面',c=>{c.box('旗杆石座','stone',-6.9,8.4,7.6,.8,.35,.8);c.tube('旗杆','metal',[[-6.5,8.7,8],[-6.5,13,8]],.05);c.pin('挂旗最小铜销','bronze',[-6.52,12.4,8]);
  for(let j=0;j<12;j++){const x=-6.5+j/12*2.4,X=-6.5+(j+1)/12*2.4,f=(u:number)=>Math.sin(u*5)*amount*.3,lower=(u:number)=>11.6-(1-amount)*u*.55;const front:V3[]=[[x,12.6,8+f(j/12)],[X,12.6,8+f((j+1)/12)],[X,lower((j+1)/12),8+f((j+1)/12)],[x,lower(j/12),8+f(j/12)]],back=front.map(v=>[v[0],v[1],v[2]+.02]as V3),m=emptyMesh('连续旗布片-'+j,c.role('bannerCloth'));quad(m,front,[0,0,-1]);quad(m,back,[0,0,1]);for(let k=0;k<4;k++){const next=(k+1)%4;quad(m,[front[k],front[next],back[next],back[k]],k===0?[0,1,0]:k===2?[0,-1,0]:k===1?[1,0,0]:[-1,0,0]);}c.mesh(m);}
 },['LIFE-148','LIFE-185']);return{instance,strength,direction:[1,0,0],flagAmplitudeM:amount*.3,cloudOffsetM:amount*2,vegetationAnimation:false,waterFlowRemainsDownhill:true,originalWindContract:'source pending verification; no authoritative wind field supplied'};
}
function winter(b:ArchitectureBuilder,s:any,kind:string){const role=kind==='frost'?'frostCover':'snowCover',depth=kind==='frost'?.012:.16,patches=[];
 // Coverage only on selected, supported uphill terrain; paths and water stay clear.
 for(const [j,[x,z,w,d]]of[[-19,11,10,8],[8,11,11,8],[-19,-19,5,4],[14,-19,5,4]].entries()){
  const asset=civicAsset(b,'climate-cover-'+kind+'-'+j,id=>{const c=new CivicComponent(b.p,id,kind==='frost'?'实际地表薄霜层':'实际地表积雪层',['ENV-130'],{kind,depth,physical:false});const xs=Array.from({length:w+1},(_,k)=>x+k),zs=Array.from({length:d+1},(_,k)=>z+k);c.surface('连续地形覆盖',role,xs,zs,(xx,zz)=>terrainHeightAt(climateGround,xx,zz,1,-20,-20)+depth,depth);return c.finish();});patches.push(b.place(asset,[0,0,0],0,'seasonal-cover'));
 }s.seasonal={kind,depthM:depth,patches,authorOptIn:true,originalSeasonConfirmed:false,sourceStatus:'待核实',physicalSnowOrSlipperiness:false};
}
function aftermath(b:ArchitectureBuilder,s:any,state:string){s.disaster={state,authorOnly:true,eventBound:false,inventoryChanged:false,roadsRemoved:false,ecologyChanged:false,sourceVegetationRetained:true};if(state==='baseline')return;
 const deposit=parkPart(b,'climate-silt','实体作者淤泥与冲刷边界',c=>{c.surface('岸边同源湿土淤积','wetSoil',[-5,-4,-3],[-18,-14,-10],(x,z)=>terrainHeightAt(climateGround,x,z,1,-20,-20)+.18,.18);},['ENV-132']);
 // A separate fallen-branch sample, not a deletion or state change of the live tree.
 const fallen=parkPart(b,'climate-fallen-branch','独立折枝与露木断口',c=>{c.beam('原木树皮','deadWood',[14,8.08,-17],[18,8.08,-17],.28);c.beam('折出次枝','deadWood',[16,8.08,-17],[17,8.8,-16],.10);c.box('露木断端','rootHeartwood',13.98,7.97,-17.13,.04,.24,.26);},['ENV-069']);s.disaster.deposit=deposit;s.disaster.fallenBranch=fallen;s.disaster.note='Finite author deposit and fallen branch specimen; no source event, hazard, road, ownership or production consequences.';
}
export function bonsaiAssembly(p:Project,id:string,name:string){const b=new ArchitectureBuilder(p,id),pot=b.original('ENV-097',{vesselForm:'bonsai'}),tree=b.original('ENV-134'),potInstance=b.place(pot,[-.68,0,-.44],0,'container'),treeInstance=b.place(tree,[0,0,0],0,'bonsai');return b.finish('ENV-135',name,{parameters:{},bonsai:{pot:potInstance,plant:treeInstance,baseOrigin:[0,0,0],plantingInterface:[1.12,.16,.64],potMouthY:.32,rootPlugBottomY:.16,rootSoilTopY:.28,drainLowerBore:{min:[-.08,.08,-.08],max:[.08,.24,.08]},topSoilIsPorousMaterialNotOpenBore:true,hydrologyBound:false,movableRigBound:false,naturalTreeScaled:false},scope:'Original bonsai and dedicated pot retained and independently replaceable. Finite actual installation; no physics/moving controller or human art acceptance.'});}
export function makeEnvironmentAssembly(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 if(catalogId==='ENV-135')return bonsaiAssembly(p,id,name);const b=new ArchitectureBuilder(p,id),s=parkSource();s.parameters={...Object.fromEntries(Object.entries(environmentParameters(catalogId)).map(([k,v])=>[k,v.default])),...params};
 valley(b,s);const hour=Number((s.parameters as any).hour??12),weather=((s.parameters as any).weather??'clear') as AuthorEnvironment['weather'];s.environment=background(b,hour,weather);cloudLayers(b,s,s.environment as AuthorEnvironment,catalogId==='ENV-129'?({calm:0,breeze:.5,strong:1}as any)[(s.parameters as any).windStrength]:0);
 if(catalogId==='ENV-126')fogLayers(b,s);
 if(catalogId==='ENV-129')s.wind=windFlag(b,String((s.parameters as any).windStrength));
 if(catalogId==='ENV-130')winter(b,s,String((s.parameters as any).winterCover));
 if(catalogId==='ENV-132')aftermath(b,s,String((s.parameters as any).damageState));
 if(catalogId==='ENV-133')s.contactLighting={actualGroundContacts:true,directionalAndHemisphereFromSavedHour:true,screenSpaceAO:false,originalRendererTargetArtAccepted:false,originalEnergyBound:false};
 s.scope='Author finite environmental snapshot with actual exported textures, continuous terrain and native minimum components. Original SimState/hour/weather/wind/season/disaster/energy, controllers and human art acceptance remain unbound.';return b.finish(catalogId,name,JSON.parse(JSON.stringify(s)));
}
