import {Quaternion,Vector3} from 'three';
import {Shapes} from './shapes';import {loft,roundLoft} from './mesh-shapes';import type {Ring} from './mesh-shapes';import type {AuthoredMesh} from '../core/authored-mesh';import type {Port,V3} from '../core/types';import type {RigDescriptor} from '../core/rig';
export const snap=(v:number)=>Math.round(v*1e9)/1e9||0;
export class AvatarModel{
 b:Shapes;meshes:AuthoredMesh[]=[];ports:Port[]=[];detail:Record<string,unknown>={};rig?:RigDescriptor;world=new Map<string,V3>();
 constructor(public s:Record<string,number>){this.b=new Shapes(.005,s);}
 bind(kind:RigDescriptor['kind']){this.rig={version:1,kind,joints:[],meshJoints:{},voxelJoints:[],sockets:{},pose:{},authority:'author',originalSkeletonBound:false};}
 joint(id:string,parent:string|null,world:V3){if(!this.rig)throw new Error('先建立绑定');const p=parent?this.world.get(parent)!:[0,0,0];this.rig.joints.push({id,parent,translation:world.map((v,i)=>snap(v-p[i])) as V3});this.world.set(id,world);}
 mesh(mesh:AuthoredMesh,joint?:string){this.meshes.push(mesh);if(this.rig){if(!joint)throw new Error('绑定网格缺关节 '+mesh.name);this.rig.meshJoints[mesh.name]=joint;}}
 add(name:string,role:string,rings:Ring[],joint?:string,round=true){this.mesh(round?roundLoft(name,this.s[role],rings):loft(name,this.s[role],rings),joint);}
 box(name:string,role:string,x:number,y:number,z:number,w:number,h:number,d:number,joint?:string){this.b.part(name,()=>this.b.b(x,y,z,w,h,d,this.s[role]));if(this.rig){if(!joint)throw new Error('绑定块缺关节');this.rig.voxelJoints.push({region:this.b.bounds(x,y,z,w,h,d),joint});}}
 port(id:string,position:V3,normal:V3=[0,1,0],size:V3=[.1,.01,.1],joint?:string){this.ports.push({id,kind:'character-socket',position:position.map(snap) as V3,normal,size,pitch:.005});if(this.rig){if(!joint)throw new Error('绑定挂点缺关节');this.rig.sockets[id]=joint;}}
 rod(name:string,role:string,start:V3,end:V3,radius:number,joint?:string){const d=new Vector3(...end).sub(new Vector3(...start)),length=d.length(),q=new Quaternion().setFromUnitVectors(new Vector3(0,1,0),d.normalize()),mesh=loft(name,this.s[role],[{y:0,rx:radius,rz:radius},{y:length,rx:radius*.86,rz:radius*.86}]);for(let i=0;i<mesh.positions.length;i+=3){const p=new Vector3(...mesh.positions.slice(i,i+3)).applyQuaternion(q).add(new Vector3(...start)),n=new Vector3(...mesh.normals.slice(i,i+3)).applyQuaternion(q);mesh.positions.splice(i,3,...p.toArray().map(snap));mesh.normals.splice(i,3,...n.toArray().map(snap));}this.mesh(mesh,joint);}
}
export const axisPose=(axis:V3,angle:number):[number,number,number,number]=>new Quaternion().setFromAxisAngle(new Vector3(...axis).normalize(),angle).toArray();
