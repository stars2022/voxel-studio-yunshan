import {Vector3} from 'three';
import type {V3} from '../core/types';
import {AvatarModel} from './avatar-model';
import {heldModel,ROOT,slab,loopXY} from './held-shapes';
import {roundBand,rigidMesh} from './mesh-shapes';
import {oval} from './care-goods';
import {faunaTube} from './fauna-shapes';
import {microPin,compactOwned} from './wildlife-shapes';

const point=(p:V3,c:V3,a:number):V3=>[p[0]+c[0],p[1]*Math.cos(a)-p[2]*Math.sin(a)+c[1],p[1]*Math.sin(a)+p[2]*Math.cos(a)+c[2]];
export const collarSpec=(form:string)=>form==='cat'?{target:'CHAR-306',c:[0,.294,-.146]as V3,rx:.096,rz:.121,w:.021,a:-.64}:{target:'CHAR-307',c:[0,.489,-.208]as V3,rx:.130,rz:.156,w:.028,a:-.64};
function buckle(q:AvatarModel,z:number,width:number){slab(q,'独立扣壳','petBuckle',-width/2,-.016,z-.010,width,.032,.018);slab(q,'未绑定光学片','petOptic',-width*.28,-.005,z-.012,width*.56,.010,.003);for(const x of[-width/2-.003,width/2])slab(q,'金属扣侧梁'+x,'petHardware',x,-.017,z-.009,.005,.034,.013);}
export function petCollar(m:AvatarModel,form:string){const f=collarSpec(form),q=heldModel(m.s);q.mesh(roundBand('真实贯通项圈织带',m.s.petWebbing,[{y:-f.w/2,rx:f.rx,rz:f.rz},{y:f.w/2,rx:f.rx,rz:f.rz}],.006),ROOT);q.mesh(roundBand('项圈贴肤软衬',m.s.harnessLiner,[{y:-f.w/2+.002,rx:f.rx-.005,rz:f.rz-.005},{y:f.w/2-.002,rx:f.rx-.005,rz:f.rz-.005}],.003),ROOT);buckle(q,-f.rz,.045);loopXY(q,'项圈真实悬挂环','petHardware',[.032,-.021,-f.rz-.007],.010,.015,.003,.006);
 // Open adjustment slots in a distinct free strap end, with real through-walls.
 const z=-f.rz-.014;for(const y of[-.012,.007])slab(q,'调整尾带边'+y,'petWebbing',-.077,y,z,.065,.005,.007);for(const x of[-.077,-.058,-.039,-.020])slab(q,'调整孔间桥'+x,'petWebbing',x,-.012,z,.005,.024,.007);
 for(const mesh of q.meshes)m.mesh(rigidMesh(mesh,f.c,f.a),ROOT);for(const s of[-1,1])microPin(m,'最小扣轴'+s,'petHardware',point([s*.023,0,-f.rz-.005],f.c,f.a),.005);m.port('tag-mount',point([.032,-.033,-f.rz-.007],f.c,f.a),[0,-1,0],[.015,.006,.006],ROOT);m.port('neck-fit',f.c,[0,1,0],[f.rx*2,f.w,f.rz*2],ROOT);m.detail.fit={...f,innerRxM:f.rx-.008,innerRzM:f.rz-.008,meaning:'Finite fit to actual saved cat/dog. Local Y is tilted neck axis; independent accessory, no skin merge.'};compactOwned(m);
}

function tagFace(m:AvatarModel,paw:boolean,w:number,h:number,role='petTagEnamel'){slab(m,'名牌圆角金属底','petTagMetal',-w/2,0,-.003,w,h,.006);slab(m,'实体珐琅牌面',role,-w/2+.003,.004,-.005,w-.006,h-.008,.003);if(paw){oval(m,'爪印掌部油墨','petTagInk',[0,h*.37,-.0055],[w*.18,h*.13,.001]);for(const x of[-.30,-.11,.11,.30])oval(m,'爪印趾部油墨'+x,'petTagInk',[w*x,h*(.64+(.30-Math.abs(x))*.32),-.0055],[w*.08,h*.085,.001]);}loopXY(m,'名牌真正孔眼','petTagMetal',[0,h+.004,0],w*.13,w*.16,.0025,.006);loopXY(m,'名牌连接环','petHardware',[0,h+.013,-.001],w*.15,w*.18,.0025,.005);microPin(m,'名牌最小背铆钉','petTagMetal',[0,h*.45,.002],m.b.pitch);m.port('hanger-top',[0,h+.013+w*.18,-.001],[0,1,0],[w*.25,.004,.004],ROOT);m.detail.tagContent=paw?'Decorative paw emblem only, not a name, identity or ownership record':'Blank real tag face, no invented identity';}
export function petTag(m:AvatarModel,form:string){tagFace(m,form==='paw',.047,.051);compactOwned(m);}

export const harnessSpec=(form:string)=>form==='cat'?{target:'CHAR-306',cy:.2233,rx:.104,ry:.111,zs:[-.064,.077],w:.020}:{target:'CHAR-307',cy:.3773,rx:.150,ry:.170,zs:[-.075,.105],w:.028};
export function petHarness(m:AvatarModel,form:string){const f=harnessSpec(form),k=form==='cat'?.66:1;for(const [j,z]of f.zs.entries()){for(const [role,offset,t]of [['petWebbing',0,.005],['harnessLiner',-.004,.003]]as[string,number,number][]){const ring=roundBand('胸背'+j+role,m.s[role],[{y:-f.w/2,rx:f.rx+offset,rz:f.ry+offset},{y:f.w/2,rx:f.rx+offset,rz:f.ry+offset}],t);m.mesh(rigidMesh(ring,[0,f.cy,z],Math.PI/2),ROOT);}}
 const start=f.zs[0]-f.w/2,end=f.zs[1]+f.w/2,top=f.cy+f.ry-.003,bottom=f.cy-f.ry-.003;
 slab(m,'背部连续连接织带','petWebbing',-.018*k,top,start,.036*k,.009*k,end-start);slab(m,'腹部连续连接织带','petWebbing',-.014*k,bottom,start,.028*k,.008*k,end-start);
 for(const s of[-1,1]){slab(m,'侧向连接织带'+s,'petWebbing',s*f.rx-(s>0?.004:.003),f.cy-.018*k,start,.007,.036*k,end-start);loopXY(m,'侧边真实调节扣'+s,'petHardware',[s*(f.rx+.004),f.cy,(start+end)/2],.006,.023*k,.0025,.032*k);microPin(m,'最小侧扣销'+s,'petHardware',[s*(f.rx+.002),f.cy+.007*k,(start+end)/2],.005);}
 faunaTube(m,'背部真实提环','petWebbing',[[-.018*k,top+.004,-.025*k],[-.025*k,top+.053*k,.015*k],[.025*k,top+.053*k,.015*k],[.018*k,top+.004,-.025*k]],.006*k,.006*k,.70,12,8);loopXY(m,'背部牵引五金环','petHardware',[0,top+.015*k,.066*k],.012*k,.017*k,.003,.007);m.port('leash-mount',[0,top+.030*k,.066*k],[0,1,0],[.018*k,.005,.005],ROOT);m.port('chest-fit',[0,f.cy,f.zs[0]],[0,0,-1],[f.rx*2,f.ry*2,f.w],ROOT);m.detail.fit={...f,meaning:'Two real thorax bands with back/ventral/side connectors. Native cat or dog is retained separately; no claim of all poses, load safety or leash simulation.'};compactOwned(m);
}

export function livestockTag(m:AvatarModel,form:string){const c:V3=[0,1.055,-.425],rx=form==='cow-wide'?.200:.189,rz=form==='cow-wide'?.258:.244,a=-.75,w=.044,q=heldModel(m.s);q.mesh(roundBand('家畜独立登记佩带',m.s.livestockWebbing,[{y:-w/2,rx,rz},{y:w/2,rx,rz}],.009),ROOT);buckle(q,-rz,.064);
 for(const mesh of q.meshes)m.mesh(rigidMesh(mesh,c,a),ROOT);const front=point([0,0,-rz-.012],c,a),ring:V3=[0,front[1]-.025,front[2]-.003];loopXY(m,'家畜牌真实上扣环','petHardware',ring,.015,.020,.004,.009);m.rod('登记牌上环固定桥','petHardware',point([0,-.009,-rz-.007],c,a),[0,ring[1]+.018,ring[2]],.004,ROOT);
 const tag=heldModel(m.s);tagFace(tag,false,.09,.116,'livestockTagEnamel');const off:V3=[0,ring[1]-.019-(.116+.013+.09*.18),ring[2]];for(const mesh of tag.meshes)m.mesh(rigidMesh(mesh,off),ROOT);microPin(m,'家畜牌最小背铆钉','petTagMetal',[0,off[1]+.116*.45,off[2]+.002],.005);for(const s of[-1,1])microPin(m,'家畜扣最小轴'+s,'petHardware',point([s*.032,0,-rz-.005],c,a),.005);m.port('neck-fit',c,[0,1,0],[rx*2,w,rz*2],ROOT);m.detail.fit={target:'CHAR-315',c,rx,rz,w,a,meaning:'Finite authored cow collar-and-blank-registration-tag study. Tag hangs vertically from real loop. No identity number or runtime ownership invented.'};compactOwned(m);
}
