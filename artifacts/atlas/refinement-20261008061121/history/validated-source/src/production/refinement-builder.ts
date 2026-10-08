import type {Asset,Project,V3,Port} from '../core/types';
import type {AuthoredMesh} from '../core/authored-mesh';
import {Grid} from '../core/grid';
import {emptyMesh,mergeMeshes} from './mesh-shapes';
import {geometryData,assetBoundsM} from '../core/sky';
import {outfitHash as hash} from './outfit-components';
import {bevelBox,bevelMember,roundMember} from './refinement-shapes';
export class DetailBuilder {
 readonly pitch=.005;readonly grid=new Grid();readonly meshes:AuthoredMesh[]=[];
 constructor(readonly p:Project,readonly original:Asset,readonly style=p.styles.yunshan){}
 role(role:string){const id=this.style[role];if(!id||!this.p.materials[id])throw Error('Missing refinement role '+role);return id;}
 mesh(m:AuthoredMesh){this.meshes.push(m);return m;}
 box(name:string,role:string,min:V3,size:V3,bevel=.003,grain=1){const id=this.role(role);return this.mesh(bevelBox(name,id,min,size,Math.min(bevel,Math.min(...size)*.24),this.p.materials[id].solid,grain));}
 member(name:string,role:string,start:V3,end:V3,width:number,depth=width,bevel=.002){const id=this.role(role);return this.mesh(bevelMember(name,id,start,end,width,depth,Math.min(bevel,Math.min(width,depth)*.24),this.p.materials[id].solid));}
 cylinder(name:string,role:string,start:V3,end:V3,radius:number,sides=24){const id=this.role(role);return this.mesh(roundMember(name,id,start,end,radius,this.p.materials[id].solid,sides));}
 voxel(role:string,min:V3,size:V3){const id=this.role(role),lo=min.map(v=>Math.round(v/this.pitch)),span=size.map(v=>Math.round(v/this.pitch));if(span.some(n=>n<1))throw Error('Subminimum detail');for(let x=0;x<span[0];x++)for(let y=0;y<span[1];y++)for(let z=0;z<span[2];z++)this.grid.set([lo[0]+x,lo[1]+y,lo[2]+z],id);}
 reflectX(width:number){
  const cells=[...this.grid.cells()];for(const [cell]of cells)this.grid.set(cell,0);for(const[cell,m]of cells)this.grid.set([Math.round(width/this.pitch)-1-cell[0],cell[1],cell[2]],m);
  for(const mesh of this.meshes){for(let k=0;k<mesh.positions.length;k+=3){mesh.positions[k]=Math.round((width-mesh.positions[k])*1e9)/1e9;mesh.normals[k]=-mesh.normals[k];}for(let k=0;k<mesh.indices.length;k+=3)[mesh.indices[k+1],mesh.indices[k+2]]=[mesh.indices[k+2],mesh.indices[k+1]];}
 }
 mountPorts():Port[]{
  const id=String(this.original.source!.catalogId),port=(name:string,position:V3,normal:V3,size:V3,kind='mount'):Port=>({id:name,kind,position,normal,size,pitch:this.pitch});
  const plane=(name:string,part:AuthoredMesh,axis:number,sign:number,kind:string)=>{const coords=Array.from({length:part.positions.length/3},(_,i)=>part.positions.slice(i*3,i*3+3)as V3),limit=sign<0?Math.min(...coords.map(v=>v[axis])):Math.max(...coords.map(v=>v[axis])),ps=coords.filter(v=>Math.abs(v[axis]-limit)<1e-8),lo=[0,1,2].map(k=>Math.min(...ps.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...ps.map(p=>p[k]))),normal=[0,0,0]as V3;normal[axis]=sign;return port(name,lo.map((v,k)=>(v+hi[k])/2)as V3,normal,lo.map((v,k)=>hi[k]-v)as V3,kind);};
  if(['LIFE-025','LIFE-026'].includes(id))return this.meshes.filter(m=>m.name===(id==='LIFE-025'?'深铁墙面安装板':'墙面装轨座')).map((m,k)=>plane('wall-'+k,m,2,1,'wall'));
  if(id==='LIFE-028')return[plane('ceiling',this.meshes.find(m=>m.name==='天花固定盘')!,1,1,'ceiling')];
  if(id==='LIFE-029')return[plane('wall',this.meshes.find(m=>m.name==='深铁壁灯背板')!,2,1,'wall')];
  if(id==='LIFE-030')return[plane('wall',this.meshes.find(m=>m.name==='贯通插孔金属背盒')!,2,1,'wall')];
  if(id==='LIFE-027')return this.meshes.filter(m=>m.name==='吊耳上缘').map((m,k)=>plane('hanger-'+k,m,1,1,'curtain-hanger'));
  const merged=emptyMesh('actual lower contact envelope',1,true);for(const m of this.meshes)merged.positions.push(...m.positions);
  return[plane('base',merged,1,-1,'base')];
 }

 finish(features:string,details:Record<string,unknown>={}){
  // JSON stores signed zero as zero. Canonicalize before hashing, saving and export.
  for(const mesh of this.meshes)for(const values of[mesh.positions,mesh.normals,mesh.uvs])for(let k=0;k<values.length;k++)if(values[k]===0)values[k]=0;
  const grouped=new Map<string,AuthoredMesh[]>();for(const m of this.meshes){const key=m.material+':'+JSON.stringify(m.wovenPattern??null),list=grouped.get(key)??[];list.push(m);grouped.set(key,list);}const ranges:any[]=[];
  const meshes=[...grouped].map(([key,list],index)=>{const material=list[0].material,name='refined-material-'+material+'-'+index;let firstIndex=0;for(const m of list){ranges.push({name:m.name,mesh:name,firstIndex,indexCount:m.indices.length,material});firstIndex+=m.indices.length;}return{...mergeMeshes(name,list),...(list[0].wovenPattern?{wovenPattern:list[0].wovenPattern}:{})};});
  const result={...this.original,version:this.original.version+1,cellSize:this.pitch,chunks:this.grid.serialize(),parts:[],meshes,source:{...this.original.source,parameters:{...this.original.source?.parameters as any,refinement:'reference-v1'},recipeRevision:'reference-v1',features,componentIndexRanges:ranges,refinement:{version:1,baselineGeometrySHA256:hash(geometryData(this.original)),baselineSource:this.original.source,baselinePorts:this.original.ports,minimumComponentM:this.pitch,authority:'closed authored surfaces with independent native minimum fasteners',humanArtAccepted:false,...details}}} as Asset;
  result.ports=this.mountPorts();const bounds=assetBoundsM(result)!;result.source!.dimensionsM=bounds.max.map((v,k)=>v-bounds.min[k]);result.source!.refinedBoundsM=bounds;
  result.source!.limitations='作者静态参考精修候选；原游戏功能和动画未绑定，人工美术验收未完成。';
  result.source!.materialAssignmentReview={revision:2,method:'actual mixed component roles and palette-derived textile artwork',nativeRoles:[...new Set([...this.grid.cells()].map(([,id])=>id))],meshRoles:[...new Set(meshes.map(m=>m.material))],texturedRoles:meshes.flatMap(m=>m.wovenPattern?Object.values(m.wovenPattern.materials):[])};
  return result;
 }
}
