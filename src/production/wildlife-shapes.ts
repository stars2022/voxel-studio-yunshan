import {AvatarModel} from './avatar-model';
import {ROOT} from './held-shapes';
import {mergeMeshes} from './mesh-shapes';
import type {V3} from '../core/types';

/** Assign newly authored pieces together, without changing bind-space coordinates. */
export function atJoint(m:AvatarModel,joint:string,draw:()=>void){const n=m.meshes.length,v=m.rig!.voxelJoints.length,p=m.ports.length;draw();for(const mesh of m.meshes.slice(n))m.rig!.meshJoints[mesh.name]=joint;for(const owner of m.rig!.voxelJoints.slice(v))owner.joint=joint;for(const port of m.ports.slice(p))m.rig!.sockets[port.id]=joint;}
export function microPin(m:AvatarModel,name:string,role:string,c:V3,size=m.b.pitch,joint=ROOT){const p=c.map(v=>Math.round((v-size/2)/m.b.pitch)*m.b.pitch)as V3;m.box(name,role,...p,size,size,size,joint);}
/** Merge only equal material AND equal rigid owner, preserving joint boundaries. */
export function compactOwned(m:AvatarModel){const groups=new Map<string,typeof m.meshes>();for(const mesh of m.meshes){const key=mesh.material+'/'+m.rig!.meshJoints[mesh.name];groups.set(key,[...(groups.get(key)??[]),mesh]);}const meshes:typeof m.meshes=[],owners:Record<string,string>={},sources:Record<string,string[]>={},ranges:Record<string,{name:string;firstIndex:number;indexCount:number}[]>={};for(const parts of groups.values()){const joint=m.rig!.meshJoints[parts[0].name],name=parts.length===1?parts[0].name:joint+'-'+parts[0].material+'-same-purpose';meshes.push(parts.length===1?parts[0]:mergeMeshes(name,parts));owners[name]=joint;sources[name]=parts.map(x=>x.name);let index=0;ranges[name]=parts.map(p=>{const r={name:p.name,firstIndex:index,indexCount:p.indices.length};index+=p.indices.length;return r;});}m.meshes=meshes;m.rig!.meshJoints=owners;m.detail.originalComponents=sources;m.detail.componentIndexRanges=ranges;}
