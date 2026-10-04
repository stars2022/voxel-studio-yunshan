import type {V3} from '../core/types';
import {AvatarModel,axisPose} from './avatar-model';
import {ROOT,loopXY} from './held-shapes';
import {oval} from './care-goods';
import {faunaTube} from './fauna-shapes';
import {atJoint,microPin,compactOwned} from './wildlife-shapes';

/** Visible guide geometry is plastic rig tooling, not biological bone. */
function marker(m:AvatarModel,id:string,p:V3,r:number){atJoint(m,id,()=>{oval(m,id+'关节导球','rigJointMarker',p,[r,r,r]);microPin(m,id+'最小轴心标记','rigSocketMarker',p,m.b.pitch,id);});}
function branch(m:AvatarModel,id:string,parent:string,p:V3,r=.011){m.joint(id,parent,p);m.rod(parent+'到'+id+'骨链导杆','rigGuide',m.world.get(parent)!,p,r,parent);marker(m,id,p,r*1.65);}
function socket(m:AvatarModel,id:string,joint:string,size=.03){m.port(id,m.world.get(joint)!,[0,1,0],[size,size,size],joint);}
function rootAt(m:AvatarModel,p:V3,r:number){m.rig!.joints[0].translation=p;m.world.set(ROOT,p);marker(m,ROOT,p,r);}

export function quadrupedRig(m:AvatarModel,form:string){
 rootAt(m,[0,.37,.06],.023);branch(m,'pelvis',ROOT,[0,.39,.22],.015);branch(m,'chest',ROOT,[0,.40,-.12],.016);branch(m,'neck','chest',[0,.485,-.20],.012);branch(m,'head','neck',[0,.525,-.24],.011);branch(m,'muzzle','head',[0,.50,-.405],.010);
 atJoint(m,'head',()=>{for(const s of[-1,1]){faunaTube(m,'头壳侧导架'+s,'rigGuide',[[0,.575,-.25],[s*.073,.553,-.27],[s*.079,.49,-.275],[0,.48,-.265]],.009,.009,1,8,8);loopXY(m,'眼眶导环'+s,'rigGuide',[s*.045,.54,-.315],.020,.020,.007,.012);}m.rod('下颌导杆','rigGuide',[-.048,.486,-.30],[.048,.486,-.30],.008,'head');m.rod('颅顶连杆','rigGuide',[0,.525,-.24],[0,.575,-.25],.008,'head');m.rod('下颌连杆','rigGuide',[0,.525,-.24],[0,.486,-.30],.007,'head');for(const s of[-1,1])m.rod('眶缘连杆'+s,'rigGuide',[0,.525,-.24],[s*.045,.56,-.315],.006,'head');});
 for(const s of[-1,1])for(const front of[true,false]){const side=s<0?'left':'right',name=side+(front?'-front':'-hind'),x=s*.11,z=front?-.19:.22,parent=front?'chest':'pelvis';branch(m,name+'-shoulder',parent,[x,.34,z],.011);branch(m,name+'-knee',name+'-shoulder',[x,.19,z+(front?.014:.047)],.010);branch(m,name+'-ankle',name+'-knee',[x,.043,z],.008);branch(m,name+'-toe',name+'-ankle',[x,.023,z-.06],.007);socket(m,name+'-foot',name+'-toe');}
 for(let j=0;j<4;j++){const z=-.10+j*.072,y=.37+(z-.06)*(z<.06?-1/6:.125);for(const s of[-1,1])atJoint(m,ROOT,()=>faunaTube(m,'胸廓肋导架'+s+j,'rigGuide',[[0,y,z],[s*.12,.37,z],[s*.10,.26,z],[0,.242,z]],.006,.006,1,9,8));}
 branch(m,'tail-base','pelvis',[0,.44,.31],.009);branch(m,'tail-mid','tail-base',[0,.60,.46],.008);branch(m,'tail-tip','tail-mid',[0,.71,.38],.006);
 socket(m,'neck-wear','neck',.08);socket(m,'tail-end','tail-tip');if(form==='stride-study'){m.rig!.pose['left-front-shoulder']=axisPose([1,0,0],-.20);m.rig!.pose['left-front-knee']=axisPose([1,0,0],.24);m.rig!.pose['right-hind-shoulder']=axisPose([1,0,0],.17);m.rig!.pose['right-hind-knee']=axisPose([1,0,0],-.22);m.rig!.pose.neck=axisPose([0,1,0],.22);m.rig!.pose['tail-base']=axisPose([0,1,0],.32);}
 m.detail.family='Quadruped author guide approximately matched to CHAR307 dog proportions; not an original game skeleton, soft skin or automatically retargeted animal.';compactOwned(m);
}

export function birdRig(m:AvatarModel,form:string){
 rootAt(m,[0,.50,.045],.023);branch(m,'chest',ROOT,[0,.59,-.085],.015);branch(m,'neck-base','chest',[0,.70,-.14],.012);branch(m,'neck-mid','neck-base',[0,.83,-.09],.010);branch(m,'head','neck-mid',[0,.97,-.18],.010);branch(m,'beak','head',[0,.95,-.36],.008);
 atJoint(m,'head',()=>{m.rod('鸟颅连杆','rigGuide',[0,.97,-.18],[0,.94,-.22],.006,'head');for(const s of[-1,1])faunaTube(m,'鸟头导架'+s,'rigGuide',[[0,1.005,-.17],[s*.048,.97,-.17],[s*.037,.934,-.19],[0,.94,-.22]],.007,.007,1,7,8);});
 for(const s of[-1,1]){const side=s<0?'left':'right';branch(m,side+'-wing-root','chest',[s*.085,.565,-.028],.012);branch(m,side+'-wing-elbow',side+'-wing-root',[s*.26,.595,.02],.010);branch(m,side+'-wing-wrist',side+'-wing-elbow',[s*.405,.545,.087],.009);branch(m,side+'-wing-tip',side+'-wing-wrist',[s*.64,.50,.13],.006);atJoint(m,side+'-wing-wrist',()=>{for(let j=0;j<4;j++)m.rod(side+'翼掌射线'+j,'rigGuide',[s*.405,.545,.087],[s*(.45+j*.06),.48-j*.012,.26-j*.027],.004,side+'-wing-wrist');});
  branch(m,side+'-hip',ROOT,[s*.061,.405,.035],.010);branch(m,side+'-knee',side+'-hip',[s*.061,.265,.075],.008);branch(m,side+'-ankle',side+'-knee',[s*.061,.04,.003],.006);atJoint(m,side+'-ankle',()=>{for(let j=-1;j<=1;j++)m.rod(side+'前趾导杆'+j,'rigGuide',[s*.061,.04,.003],[s*.061+j*.026,.008,-.09],.004,side+'-ankle');m.rod(side+'后趾导杆','rigGuide',[s*.061,.04,.003],[s*.061,.008,.063],.004,side+'-ankle');});socket(m,side+'-foot',side+'-ankle');socket(m,side+'-wing-end',side+'-wing-tip');
 }
 for(let j=0;j<3;j++)for(const s of[-1,1]){const z=-.048+j*.065,y=.50+(z-.045)*(z<.045?-.09/.13:-.02/.195);atJoint(m,ROOT,()=>faunaTube(m,'鸟胸廓导架'+s+j,'rigGuide',[[0,y,z],[s*.10,.51,z],[0,.414,z]],.006,.006,1,8,8));}
 branch(m,'tail',ROOT,[0,.48,.24],.009);atJoint(m,'tail',()=>{for(let j=-2;j<=2;j++)m.rod('鸟尾射线'+j,'rigGuide',[0,.48,.24],[j*.026,.47,.39],.004,'tail');});socket(m,'head-mount','head');
 if(form==='wing-study'){for(const s of[-1,1]){const side=s<0?'left':'right';m.rig!.pose[side+'-wing-root']=axisPose([0,0,1],s*.40);m.rig!.pose[side+'-wing-elbow']=axisPose([0,1,0],s*.22);}m.rig!.pose['neck-mid']=axisPose([1,0,0],-.15);m.rig!.pose.tail=axisPose([1,0,0],.15);}
 m.detail.family='Independent bird guide with neck, two root/elbow/wrist/tip chains, legs, toes and tail. No merged bilateral wing mesh can cross its rigid joint ownership.';compactOwned(m);
}

export function fishRig(m:AvatarModel,form:string){
 rootAt(m,[0,.14,-.025],.011);branch(m,'head',ROOT,[0,.14,-.13],.006);branch(m,'jaw','head',[0,.12,-.203],.004);branch(m,'spine-mid',ROOT,[0,.14,.055],.006);branch(m,'spine-rear','spine-mid',[0,.14,.13],.005);branch(m,'tail-base','spine-rear',[0,.14,.22],.004);branch(m,'tail-fin','tail-base',[0,.14,.27],.0035);
 atJoint(m,'head',()=>{m.rod('鱼颅连杆','rigGuide',[0,.14,-.13],[0,.18,-.13],.004,'head');for(const s of[-1,1])faunaTube(m,'鱼颅侧导架'+s,'rigGuide',[[0,.18,-.13],[s*.042,.153,-.13],[s*.031,.106,-.13],[0,.106,-.17]],.004,.004,1,8,8);m.rod('鱼口导横杆','rigGuide',[-.016,.121,-.20],[.016,.121,-.20],.003,'head');});
 for(const [owner,zs]of [[ROOT,[-.06,-.024,.01]],['spine-mid',[.06,.094]],['spine-rear',[.145,.18]]] as [string,number[]][]){for(const z of zs)for(const s of[-1,1])atJoint(m,owner,()=>faunaTube(m,'鱼肋导架'+s+z,'rigGuide',[[0,.14,z],[s*.037,.115,z],[s*.024,.084,z]],.0025,.0015,1,6,6));}
 for(const s of[-1,1]){branch(m,(s<0?'left':'right')+'-pectoral',ROOT,[s*.032,.122,-.076],.003);atJoint(m,(s<0?'left':'right')+'-pectoral',()=>{for(let j=0;j<3;j++)m.rod('鱼胸鳍射线'+s+j,'rigGuide',[s*.032,.122,-.076],[s*(.066+j*.013),.10,-.025+j*.013],.002,(s<0?'left':'right')+'-pectoral');});}
 branch(m,'dorsal',ROOT,[0,.179,.008],.003);atJoint(m,'dorsal',()=>{for(let j=0;j<4;j++)m.rod('鱼背鳍射线'+j,'rigGuide',[0,.179,.008],[0,.224-j*.007,j*.025],.002,'dorsal');});atJoint(m,'tail-fin',()=>{for(const s of[-1,1])for(let j=0;j<4;j++)m.rod('鱼尾鳍射线'+s+j,'rigGuide',[0,.14,.27],[0,.14+s*(.015+j*.018),.32+j*.008],.002,'tail-fin');});
 socket(m,'head-axis','head');socket(m,'tail-axis','tail-fin');if(form==='tail-bend'){m.rig!.pose['spine-mid']=axisPose([0,1,0],.18);m.rig!.pose['spine-rear']=axisPose([0,1,0],.22);m.rig!.pose['tail-base']=axisPose([0,1,0],-.30);m.rig!.pose['tail-fin']=axisPose([0,1,0],-.16);m.rig!.pose['left-pectoral']=axisPose([0,0,1],.20);}
 m.detail.family='Independent articulated fish guide with serial spine/peduncle, caudal, pectoral and dorsal owners. Finite yaw pose, not swimming clips or fluid dynamics.';compactOwned(m);
}
