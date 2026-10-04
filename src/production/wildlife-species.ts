import {roundLoft,rigidMesh} from './mesh-shapes';
import type {V3} from '../core/types';
import {AvatarModel,axisPose} from './avatar-model';
import {ROOT,pin} from './held-shapes';
import {oval} from './care-goods';
import {faunaTube,feather,fin,sideEyes,surfacePatch} from './fauna-shapes';
import {atJoint,microPin,compactOwned} from './wildlife-shapes';

export function heron(m:AvatarModel,form:string){
 oval(m,'鹭鸟长胸腹','featherCream',[0,.67,.065],[.12,.20,.235]);oval(m,'鹭鸟灰背','featherGray',[0,.775,.12],[.113,.11,.225]);
 const hy=form==='watchful'?1.27:1.10,hz=form==='watchful'?-.235:-.30;
 faunaTube(m,'鹭鸟独立S颈','featherCream',[[0,.72,-.10],[0,.85,-.25],[0,1.03,-.12],[0,hy-.05,hz]],.055,.034,1,18,12);oval(m,'鹭鸟长头','featherCream',[0,hy,hz],[.052,.059,.088]);
 for(const s of[-1,1]){feather(m,'鹭鸟深眉羽'+s,'featherDark',[s*.037,hy+.025,hz-.03],[s*.041,hy+.037,hz+.065],.014,.008);faunaTube(m,'鹭鸟后冠羽'+s,'featherDark',[[s*.015,hy+.04,hz+.04],[s*.025,hy+.033,hz+.14],[s*.035,hy-.012,hz+.21]],.009,.002,1,8,8);
  const x=s*.062;faunaTube(m,'鹭鸟长胫'+s,'birdFootDark',[[x,.55,.013],[x,.25,.04],[x,.037,-.005]],.012,.008,1,6,8);oval(m,'鹭鸟腿覆羽'+s,'featherCream',[x,.52,.008],[.039,.11,.048]);
  for(const j of[-1,0,1]){const end:V3=[x+j*.035,.008,-.105+(j===0?-.018:0)];faunaTube(m,'鹭鸟分趾'+s+j,'birdFootDark',[[x,.033,-.007],[x+j*.016,.014,-.050],end],.006,.0035,1,5,8);pin(m,'鹭鸟最小趾爪'+s+j,end,'animalClaw');}faunaTube(m,'鹭鸟后趾'+s,'birdFootDark',[[x,.036,-.003],[x,.008,.07]],.005,.003,1,4,8);
  oval(m,'鹭鸟翼肩'+s,'featherGray',[s*.10,.74,.095],[.039,.096,.19]);for(let j=0;j<6;j++)feather(m,'鹭鸟分层翼羽'+s+j,j<3?'featherSlate':'featherDark',[s*.114,.78-j*.016,.07],[s*(.125+j*.002),.565+j*.008,.37-j*.024],.026,.009);
 }
 faunaTube(m,'鹭鸟细长上喙','birdBeak',[[0,hy-.010,hz-.064],[0,hy-.018,hz-.31]],.019,.0018,.75,5,10);faunaTube(m,'鹭鸟下喙','birdBeak',[[0,hy-.026,hz-.075],[0,hy-.025,hz-.285]],.011,.0016,.70,4,10);sideEyes(m,[0,hy+.012,hz-.034],.046,.011);
 for(let j=-1;j<=1;j++)feather(m,'鹭鸟窄尾羽'+j,'featherSlate',[j*.02,.68,.215],[j*.03,.57,.395],.025,.010);pin(m,'鹭鸟喙鼻孔',[.011,hy-.004,hz-.10],'animalNose');compactOwned(m);m.detail.anatomy='Independent long-legged heron, three front toes and hind toe, S-shaped neck, narrow straight beak, layered wings and trailing crest. Two authored static neck shapes.';
}

export function streamFish(m:AvatarModel,form:string){
 oval(m,'溪流鱼长纺锤身','liveScaleWhite',[0,.14,0],[.054,.066,.207]);const body=m.meshes.at(-1)!;surfacePatch(m,'溪流鱼连续鳞色区','liveScaleOrange',body,p=>p[1]>.134&&((p[2]>-.17&&p[2]<-.09)||(p[2]>-.018&&p[2]<.083)||p[2]>.139));
 oval(m,'溪流鱼窄尾柄','liveScaleOrange',[0,.14,.203],[.024,.027,.045]);const k=form==='broad-tail'?1:.67;for(const s of[-1,1]){fin(m,'溪流鱼真正叉尾'+s,'liveFin',[[0,.14,.226],[0,.14+s*.075*k,.318],[0,.14+s*.072*k,.358],[0,.14+s*.014,.292]],.005);fin(m,'溪流鱼长胸鳍'+s,'liveFin',[[s*.043,.126,-.090],[s*(.05+.060*k),.073,-.008],[s*.037,.111,.027]],.004);fin(m,'溪流鱼腹鳍'+s,'liveFin',[[s*.027,.092,.053],[s*.065,.062,.125],[s*.025,.095,.143]],.0035);faunaTube(m,'溪流鱼鳃盖缘'+s,'liveGill',[[s*.039,.172,-.12],[s*.052,.142,-.112],[s*.04,.107,-.10]],.003,.003,1,8,6);faunaTube(m,'溪流鱼口须'+s,'liveMouth',[[s*.011,.126,-.20],[s*.027,.121,-.22],[s*.032,.100,-.229]],.0028,.0015,1,5,6);}
 fin(m,'溪流鱼背鳍','liveFin',[[0,.191,-.067],[0,.263,-.035],[0,.209,.128]],.004);fin(m,'溪流鱼臀鳍','liveFin',[[0,.092,.075],[0,.05,.16],[0,.117,.173]],.0035);oval(m,'溪流鱼口唇','liveMouth',[0,.127,-.205],[.017,.012,.009]);pin(m,'溪流鱼最小口缝',[0,.128,-.212],'liveMouth');sideEyes(m,[0,.155,-.15],.037,.010);m.port('waterline-study',[0,.14,0],[0,1,0],[.12,.005,.56],ROOT);m.detail.anatomy='Elongate stream-fish author study with narrow peduncle, forked tail, longer paired fins, anal fin and oral barbels. Shares live-scale material purposes, not CHAR309 geometry or LIFE094 food fish.';
}

function insectLeg(m:AvatarModel,prefix:string,s:number,j:number,scale:number,articulated:boolean){const z=(-.007+j*.009)*scale,hip:V3=[s*.0025*scale,.024*scale,z],knee:V3=[s*(j===2?.021:.018)*scale,.020*scale,z+(j-1)*.008*scale],foot:V3=[s*(j===2?.028:.025)*scale,.002*scale,z+(j-1)*.014*scale],a=prefix+'-hip',b=prefix+'-knee';if(articulated){m.joint(a,ROOT,hip);m.joint(b,a,knee);}atJoint(m,articulated?a:ROOT,()=>{faunaTube(m,prefix+'基节','insectCuticle',[hip,knee],.0018*scale,.0014*scale,1,3,6);});atJoint(m,articulated?b:ROOT,()=>{faunaTube(m,prefix+'胫节','insectCuticle',[knee,foot],.0014*scale,.0009*scale,1,3,6);microPin(m,prefix+'最小跗节','insectCuticle',foot,m.b.pitch,articulated?b:ROOT);});}
function insectWings(m:AvatarModel,kind:'butterfly'|'bee'|'locust',s:number){const butterfly=kind==='butterfly',large=kind==='locust'?1.55:kind==='bee'?.5:1,rootX=s*.004*large,rootY=.032*large;
 for(const hind of[false,true]){const joint=(s<0?'left':'right')+(hind?'-hindwing':'-forewing');m.joint(joint,ROOT,[rootX,rootY,(hind?.006:-.006)*large]);atJoint(m,joint,()=>{
  const outline:V3[]=butterfly?(hind?[[s*.004,rootY,.002],[s*.058,rootY+.006,.015],[s*.052,rootY+.008,.040],[s*.029,rootY+.005,.050],[s*.007,rootY,.018]]:[[s*.004,rootY,-.003],[s*.027,rootY+.016,-.041],[s*.069,rootY+.022,-.054],[s*.076,rootY+.013,-.018],[s*.052,rootY+.003,.010],[s*.007,rootY,.009]]).map(p=>[p[0],rootY,p[2]]as V3):[[rootX,rootY,(hind?.005:-.008)*large],[s*(hind?.035:.042)*large,rootY,(hind?.031:-.027)*large],[s*(hind?.046:.060)*large,rootY,(hind?.026:-.025)*large],[s*(hind?.044:.058)*large,rootY,(hind?.012:-.013)*large],[s*.014*large,rootY,(hind?.005:-.001)*large]];
  fin(m,joint+'薄翼',butterfly?'butterflyScaleDark':'insectWingMembrane',outline,butterfly?.0009:.0006*large);
  const center=outline.reduce((p,q)=>p.map((v,i)=>v+q[i]/outline.length)as V3,[0,0,0]as V3);
  if(butterfly){const inner=outline.map(p=>p.map((v,i)=>center[i]+(v-center[i])*.73+(i===1?.0004:0))as V3);fin(m,joint+'蓝色鳞面','butterflyScaleBlue',inner,.0005);for(let j=1;j<outline.length-1;j++){const p=outline[j].map((v,i)=>center[i]+(v-center[i])*.84+(i===1?.0006:0))as V3;oval(m,joint+'浅鳞斑'+j,'butterflyScalePale',p,[.0025,.0006,.003]);}}
  for(let j=1;j<outline.length-1;j++){const p=outline[j].map((v,i)=>center[i]+(v-center[i])*.93+(i===1?.00015:0))as V3;faunaTube(m,joint+'翅脉'+j,butterfly?'butterflyScaleDark':'insectWingVein',[[rootX,rootY,(hind?.006:-.005)*large],p],butterfly?.00055:.0005*large,butterfly?.00035:.0003*large,1,2,6);}
 });}
}
export function insect(m:AvatarModel,form:string,kind:'butterfly'|'bee'|'locust'){
 const articulated=kind==='locust',k=articulated?1.55:kind==='bee'?.5:1,bodyRole=articulated?'insectCuticleGreen':kind==='bee'?'beePile':'insectCuticle';
 oval(m,kind+'胸节',bodyRole,[0,.027*k,0],[.009*k,.009*k,.013*k]);if(articulated)m.joint('head',ROOT,[0,.029*k,-.012*k]);atJoint(m,articulated?'head':ROOT,()=>{oval(m,kind+'头部',bodyRole,[0,.029*k,-.018*k],[.008*k,.008*k,.008*k]);for(const s of[-1,1]){oval(m,kind+'独立复眼'+s,'insectEye',[s*.0066*k,.030*k,-.020*k],[.003*k,.005*k,.004*k]);faunaTube(m,kind+'触角'+s,'insectCuticle',[[s*.003*k,.034*k,-.022*k],[s*.010*k,.046*k,-.032*k],[s*.013*k,.052*k,-.037*k]],.0008*k,.0005*k,1,5,6);microPin(m,kind+'最小触角端'+s,kind==='bee'?'beePile':'insectCuticle',[s*.013*k,.052*k,-.037*k],m.b.pitch,articulated?'head':ROOT);}});
 if(articulated){m.joint('abdomen',ROOT,[0,.027*k,.009*k]);m.joint('abdomen-tip','abdomen',[0,.024*k,.027*k]);atJoint(m,'abdomen',()=>oval(m,'昆虫可动腹前段',bodyRole,[0,.026*k,.017*k],[.008*k,.008*k,.014*k]));atJoint(m,'abdomen-tip',()=>oval(m,'昆虫可动腹末段',bodyRole,[0,.024*k,.031*k],[.006*k,.006*k,.013*k]));}
 else if(kind==='bee'){const levels=[-1,-.75,-.40,-.05,.30,.65,1];for(let j=0;j<levels.length-1;j++){const rings=levels.slice(j,j+2).map(t=>({y:(.023+.020*t)*k,rx:.010*k*Math.sqrt(Math.max(.015,1-t*t)),rz:.009*k*Math.sqrt(Math.max(.015,1-t*t))}));m.mesh(rigidMesh(roundLoft('蜂腹真实色带'+j,m.s[j%2?'insectCuticle':'beePile'],rings,12),[0,.025*k,0],Math.PI/2),ROOT);}}else oval(m,kind+'独立腹部',bodyRole,[0,.025,.023],[.0045,.005,.020]);
 for(const s of[-1,1]){for(let j=0;j<3;j++)insectLeg(m,(s<0?'left':'right')+'-leg'+j,s,j,k,articulated);insectWings(m,kind,s);}
 const fold=form==='folded-wings'||form==='wings-down'?1:0;for(const s of[-1,1])for(const part of['forewing','hindwing'])m.rig!.pose[(s<0?'left':'right')+'-'+part]=axisPose([0,0,1],s*(kind==='butterfly'?(fold?1.14:.25):(form==='flexed'?.55:fold?.12:.75)));
 if(articulated&&form==='flexed'){m.rig!.pose.abdomen=axisPose([1,0,0],-.25);m.rig!.pose['abdomen-tip']=axisPose([1,0,0],-.18);m.rig!.pose['left-leg0-hip']=axisPose([0,0,1],-.35);m.rig!.pose['left-leg0-knee']=axisPose([1,0,0],.35);m.rig!.pose.head=axisPose([0,1,0],.18);}
 m.port('thorax-mount',[0,.027*k,0],[0,1,0],[.01*k,.002*k,.012*k],ROOT);compactOwned(m);m.detail.anatomy='Six independently formed legs, head/thorax/abdomen, paired antennae, distinct compound eyes and four thin closed wings with actual vein solids. Minimum native details use 1mm pitch. Butterfly patterns are continuous thin scale layers, not voxel staircases.';m.detail.motion=articulated?'Actual wing, six hip/knee, head and abdomen local rigid joints; finite flexion study only, no animation clips or flight simulation.':'Wing-root joints retain the same bind geometry in two finite author poses; no animation clips or runtime ecology.';
}
