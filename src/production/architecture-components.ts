import {Grid} from '../core/grid';
import {type AuthoredMesh} from '../core/authored-mesh';
import {emptyMesh,quad,mergeMeshes} from './mesh-shapes';
import type {Asset,Project,V3} from '../core/types';

export const architecturePitch=.02;
/** An assembly component is editable geometry, but is not another catalogue master. */
export class ArchitectureComponent {
 meshes:AuthoredMesh[]=[];grid=new Grid();ports:Asset['ports']=[];
 constructor(public p:Project,public id:string,public name:string,public dependencies:string[],public parameters:Record<string,unknown>={}){}
 role(name:string){const id=this.p.styles.yunshan[name];if(!id||!this.p.materials[id])throw new Error('建筑组合缺材质用途 '+name);return id;}
 mesh(m:AuthoredMesh){m.collision=this.p.materials[m.material].solid;for(let k=0;k<m.positions.length;k+=3){const n=m.normals.slice(k,k+3).map(Math.abs),axis=n.indexOf(Math.max(...n)),v=m.positions.slice(k,k+3);m.uvs[k/3*2]=axis===0?v[2]:v[0];m.uvs[k/3*2+1]=axis===1?v[2]:v[1];}this.meshes.push(m);}
 box(name:string,role:string,x:number,y:number,z:number,w:number,h:number,d:number){if(Math.min(w,h,d)<=0)throw new Error('建筑实体尺寸须为正');const m=emptyMesh(name,this.role(role));const v:V3[]=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];for(const [ids,n]of [[[0,1,2,3],[0,0,-1]],[[4,5,6,7],[0,0,1]],[[0,4,7,3],[-1,0,0]],[[1,5,6,2],[1,0,0]],[[0,1,5,4],[0,-1,0]],[[3,2,6,7],[0,1,0]]]as [number[],V3][])quad(m,ids.map(i=>v[i]),n);this.mesh(m);}
 pin(name:string,role:string,p:V3){const v=p.map(n=>Math.round(n/architecturePitch)) as V3;if(role!=='bronze')throw new Error('当前最小细件仅声明为非承载铜销');this.grid.set(v,this.role('architecturePin'));}
 /** Closed metre-space roof slab. Top/bottom share the same tessellation. */
 surface(name:string,role:string,xs:number[],zs:number[],height:(x:number,z:number)=>number,thickness:number){
  const m=emptyMesh(name,this.role(role)),point=(i:number,j:number,lower=false):V3=>[xs[i],height(xs[i],zs[j])-(lower?thickness:0),zs[j]];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
   quad(m,[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],[0,1,0]);
   quad(m,[point(i,j,true),point(i+1,j,true),point(i+1,j+1,true),point(i,j+1,true)],[0,-1,0]);
  }
  for(let i=0;i<xs.length-1;i++)for(const j of[0,zs.length-1])quad(m,[point(i,j),point(i+1,j),point(i+1,j,true),point(i,j,true)],[0,0,j===0?-1:1]);
  for(let j=0;j<zs.length-1;j++)for(const i of[0,xs.length-1])quad(m,[point(i,j),point(i,j+1),point(i,j+1,true),point(i,j,true)],[i===0?-1:1,0,0]);
  this.mesh(m);
 }
 finish():Asset{
  const grouped=new Map<number,AuthoredMesh[]>();for(const m of this.meshes){const bucket=grouped.get(m.material)??[];bucket.push(m);grouped.set(m.material,bucket);}
  const ranges:{name:string;mesh:string;firstIndex:number;indexCount:number;material:number}[]=[];
  const meshes=[...grouped].map(([material,items])=>{const name='material-'+material;let firstIndex=0;for(const m of items){ranges.push({name:m.name,mesh:name,firstIndex,indexCount:m.indices.length,material});firstIndex+=m.indices.length;}return mergeMeshes(name,items);});
  return{id:this.id,name:this.name,version:1,category:'import',cellSize:architecturePitch,origin:[0,0,0],chunks:this.grid.serialize(),parts:[],ports:this.ports,openings:[],meshes,source:{kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:this.dependencies,parameters:this.parameters,componentIndexRanges:ranges,authority:'authored-metre-geometry',dimensionBasis:'Explicit author dimensions; source masters referenced by ID remain unchanged. Continuous component alternative, not an assertion of identical source occupancy.',runtimeIntegrated:false}};
 }
}

export function architectureFloor(p:Project,id:string,w=3.2,d=3.2){
 const b=new ArchitectureComponent(p,id,'石铺面与混凝土楼板', ['BUILT-003'],{w,d});
 b.box('承板','structuralConcrete',0,0,0,w,.16,d);
 b.box('砂浆结合层','mortar',0,.16,0,w,.02,d);
 for(let x=0;x<w-.001;x+=.8)for(let z=0;z<d-.001;z+=.8)b.box('铺面-'+x+'-'+z,'wall',x+.01,.18,z+.01,Math.min(.78,w-x-.02),.02,Math.min(.78,d-z-.02));
 for(const x of[.06,w-.08])for(const z of[.06,d-.08])b.pin('定位销','bronze',[x,.16,z]);
 b.ports=[{id:'top',kind:'architecture-floor',position:[w/2,.2,d/2],normal:[0,1,0],size:[w,0,d],pitch:.02}];return b.finish();
}
export function architectureColumn(p:Project,id:string,h=3.2){
 const b=new ArchitectureComponent(p,id,'木柱、石础与金属抱箍',['BUILT-059'],{h,core:.24});
 b.box('石足','stone',-.2,0,-.2,.4,.24,.4);b.box('实木柱芯','wood',-.12,.24,-.12,.24,h-.24,.24);
 for(const y of[.24,h-.18]){b.box('金属柱箍','metal',-.15,y,-.15,.30,.12,.30);b.pin('铜锁销','bronze',[-.01,y+.04,-.16]);}
 b.box('柱顶承枋','woodEdge',-.25,h-.10,-.18,.50,.10,.36);return b.finish();
}
export function architectureWall(p:Project,id:string,kind:'window'|'door'|'open'|'solid',w=3.2){
 const b=new ArchitectureComponent(p,id,kind==='door'?'真实门洞墙':kind==='open'?'开敞廊柱墙':kind==='window'?'真实窗洞与玻璃':'砌筑实体墙',['BUILT-017','BUILT-015'],{kind,w,h:3.2});
 const side=(w-1.6)/2;
 const stone=(name:string,x:number,y:number,width:number,h:number)=>{b.box(name+'灰缝芯','mortar',x,y,.03,width,h,.18);for(let row=0;row<h-.001;row+=.4)for(let col=0;col<width-.001;col+=.8)b.box(name+'石块-'+row+'-'+col,'wall',x+col+.01,y+row+.01,0,Math.min(.78,width-col-.02),Math.min(.38,h-row-.02),.24);};
 if(kind==='solid')stone('整墙',0,0,w,3.04);
 else if(kind!=='open'){
  stone('左垛',0,0,side,3.04);stone('右垛',w-side,0,side,3.04);
  const bottom=kind==='window'?.9:0,top=2.6;
  if(bottom)stone('窗下裙',side,0,1.6,bottom);stone('洞上墙',side,top,1.6,3.04-top);
  for(const x of[side,side+1.54])b.box('洞口木梃','wood',x,bottom,-.04,.06,top-bottom,.32);
  b.box('洞口木过梁','woodEdge',side,top-.06,-.04,1.6,.06,.32);
  if(kind==='window'){
   b.box('窗台','stone',side-.04,bottom-.08,-.10,1.68,.08,.40);
   b.box('独立薄玻璃','glass',side+.06,bottom+.04,.11,1.48,top-bottom-.10,.02);
   for(const x of[side+.5,side+1.05])b.box('木窗中梃','wood',x,bottom+.04,.08,.04,top-bottom-.10,.10);
   b.box('木窗横枋','woodEdge',side+.06,1.7,.08,1.48,.04,.10);
  }
 }
 for(const x of[0,w-.16]){b.box('壁柱','wood',x,0,-.08,.16,3.04,.40);for(const y of[.16,2.84]){b.box('壁柱箍','metal',x-.02,y,-.10,.20,.12,.44);b.pin('铜锁销','bronze',[x+.06,y+.04,-.12]);}}
 b.box('顶部承梁','wood',0,3.04,-.08,w,.16,.40);return b.finish();
}
export function architectureRail(p:Project,id:string,w=3.2){
 const b=new ArchitectureComponent(p,id,'廊边木栏与实际竖梃',['BUILT-097'],{w,h:1.1});
 for(const x of[.10,w-.18]){b.box('栏柱石脚','stone',x-.04,0,-.12,.16,.16,.24);b.box('栏柱','wood',x,.16,-.06,.08,.94,.12);b.pin('栏柱销','bronze',[x+.02,.92,-.08]);}
 for(const y of[.3,1.02])b.box('连续扶枋','woodEdge',.06,y,-.08,w-.12,.08,.16);
 for(let x=.35;x<w-.2;x+=.32)b.box('竖格','wood',x,.38,-.03,.04,.64,.06);return b.finish();
}
