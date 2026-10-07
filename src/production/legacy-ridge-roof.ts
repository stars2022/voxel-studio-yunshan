import type {Project,V3} from '../core/types';
import {CivicComponent} from './civic-components';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {variantFloor} from './building-variant-components';
import {emptyMesh,quad} from './mesh-shapes';
import {legacyRoofPlan,legacyRoofColors} from './legacy-variant-spec';
import {scopedLegacyFinish} from './scoped-legacy-finish';

const round=(x:number)=>Math.round(x*1e8)/1e8;
export function ridgeProfile(program:string){
 const plan=legacyRoofPlan(program),d=plan.depth,n=plan.ridges,span=d/n;
 const knots=[-.4,0,...Array.from({length:n*2},(_,i)=>(i+1)*span/2),d+.4];
 const height=(z:number)=>z<0||z>d?.24+.2*Math.max(-z,z-d):.24+1.48*(1-Math.abs(((z%span)/(span/2))-1));
 return{plan,knots,height};
}
/** A single closed surface across every valley, with no intersecting roof volumes. */
export function legacyRidgeRoof(p:Project,id:string,program:string){
 const{plan,knots,height}=ridgeProfile(program),w=plan.width,d=plan.depth,c=new CivicComponent(p,id,'旧住宅单/双脊连续屋面',['BUILT-076','BUILT-011','BUILT-012','BUILT-013'],{...plan,overhangM:.4,valleyAuthority:'one connected closed slab for each actual construction layer'});
 for(const[name,role,offset,t]of[['连续瓦基','roof',0,.07],['完整防水膜','waterproofMembrane',-.07,.015],['连续木望板','wood',-.085,.08]]as const)c.surface(name,role,[-.4,w+.4],knots,(_,z)=>height(z)+offset,t);
 // Every tile includes an actual ridge/valley crease if its finite span crosses one.
 const nx=Math.round((w+.8)/.4),nz=Math.round((d+.8)/.4);
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
  const x0=round(-.4+ix*.4+.012),x1=round(-.4+(ix+1)*.4-.012),z0=round(-.4+iz*.4+.012),z1=round(-.4+(iz+1)*.4-.012),zs=[z0,...knots.filter(z=>z>z0&&z<z1),z1];
  const pieces=plan.ridges===2?[[z0,Math.min(z1,d/2-.14)],[Math.max(z0,d/2+.14),z1]].filter(([a,b])=>b>a):[[z0,z1]];
  for(const[j,[a,b]]of pieces.entries())c.surface('真实连续瓦垄-'+ix+'-'+iz+'-'+j,'roof',[x0,x1],[a,...zs.filter(z=>z>a&&z<b),b],(_,z)=>height(z)+.025,.025);
 }
 for(let i=0;i<plan.ridges;i++){
  const z=d/plan.ridges*(i+.5);c.box('通长脊-'+i,'roof',-.4,1.71,z-.12,w+.8,.18,.24);
  for(const x of[-.38,w+.24]){c.box('脊端扣','metal',x,1.85,z-.14,.14,.06,.28);c.pin('最小脊扣销','bronze',[x+.04,1.90,z-.02]);}
 }
 for(const x of[-.35,w+.23])c.surface('山面实木收边-'+x,'woodEdge',[x,x+.12],knots,(_,z)=>height(z)-.165,.14);
 if(plan.ridges===2){const z=d/2;c.surface('谷部连续防水金属槽','metal',[-.4,w+.4],[z-.14,z,z+.14],(_,zz)=>height(zz)+.015,.015);}
 const a=c.finish();a.source!.ridgePositionsZ=Array.from({length:plan.ridges},(_,i)=>d/plan.ridges*(i+.5));return a;
}

/** Flat-bottom timber bearing closes the actual sloping underside-to-column gap. */
function bearing(p:Project,id:string,program:string,z:number,bottom:number){
 const{height,knots}=ridgeProfile(program),c=new CivicComponent(p,id,'真实坡底木承楔',['BUILT-059','BUILT-076'],{program,z,bottom}),zs=[z-.18,...knots.filter(v=>v>z-.18&&v<z+.18),z+.18],m=emptyMesh('闭合贴合承楔',c.role('woodEdge'));
 const at=(x:number,j:number,lower=false):V3=>[x,lower?bottom:height(zs[j])-.165,zs[j]];
 for(let j=0;j<zs.length-1;j++){
  quad(m,[at(-.25,j),at(.25,j),at(.25,j+1),at(-.25,j+1)],[0,1,0]);quad(m,[at(-.25,j,true),at(.25,j,true),at(.25,j+1,true),at(-.25,j+1,true)],[0,-1,0]);
  for(const x of[-.25,.25])quad(m,[at(x,j),at(x,j+1),at(x,j+1,true),at(x,j,true)],[Math.sign(x),0,0]);
 }
 for(const j of[0,zs.length-1])quad(m,[at(-.25,j),at(.25,j),at(.25,j,true),at(-.25,j,true)],[0,0,j===0?-1:1]);c.mesh(m);return c.finish();
}
export function placeLegacyRoof(b:ArchitectureBuilder,program:string,tone:keyof typeof legacyRoofColors){
 const{plan,height,knots}=ridgeProfile(program),w=plan.width,d=plan.depth;
 const originalRoof=b.asset('legacy-roof-uncolored-'+program,id=>legacyRidgeRoof(b.p,id,program));
 const style='legacy-roof-'+tone,candidate=scopedLegacyFinish(b.p,b.p.assets[originalRoof],'candidate','roof',style,legacyRoofColors[tone],558+Object.keys(legacyRoofColors).indexOf(tone),'BUILT-076');
 const roof=b.asset('legacy-roof-'+program+'-'+tone+'-'+b.p.styles[style].roof,id=>({...candidate,id}));
 const floor=b.asset('legacy-variant-floor-3p2',id=>variantFloor(b.p,id,3.2,3.2));for(let x=0;x<w-.001;x+=3.2)for(let z=0;z<d-.001;z+=3.2)b.place(floor,[round(x),0,round(z)],0,'floor');
 const supports:{column:string;bearing:string;undersideY:number;topY:number}[]=[];
 const xs=[.3,...Array.from({length:Math.round(w/3.2)-1},(_,i)=>(i+1)*3.2),w-.3];
 for(const z of[.3,d/2,d-.3]){
  const bottom=round(Math.min(...[z-.18,...knots.filter(v=>v>z-.18&&v<z+.18),z+.18].map(height))-.165-.08),h=round(3.4+bottom-.2),part=b.asset('legacy-roof-bearing-'+program+'-'+z,id=>bearing(b.p,id,program,z,bottom));
  for(const x of xs){const column=b.column(x,z,.2,h),support=b.place(part,[x,3.4,0],0,'bearing');supports.push({column,bearing:support,undersideY:3.4+height(z)-.165,topY:.2+h});}
 }
 const roofInstance=b.place(roof,[0,3.4,0],0,'roof');return{plan,roofInstance,supports,uncoloredRoofAsset:originalRoof,style,originalSeedRGBBound:false,ridgeChoice:'farm has one ridge; home width greater than35m has two. Explicit authored finite dimensions; not recovered Building data.'};
}
