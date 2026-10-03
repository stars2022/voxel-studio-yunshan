import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {Vector3,Matrix4,Quaternion,Triangle,Box3} from 'three';
import sharp from 'sharp';
import {Grid} from '../core/grid';
import {gridComponents} from '../core/checks';
import type {V3,Asset,Material,Bounds} from '../core/types';
export type Source={filename:string;data:string;resources?:Record<string,string>};
type Tex={data:Uint8Array;width:number;height:number;channels:number;wrapS:number;wrapT:number};
export type Tri={points:V3[];color:number[];uv?:number[][];texture?:Tex;vertexColors?:number[][];material:string;linearColor?:boolean;opaque?:boolean;opticalTransparency?:boolean};
export type Loaded={triangles:Tri[];warnings:string[];bounds:Bounds;sourceMaterials:string[]};
export type ConvertOptions={cellSize:number;origin:V3;scale:number;upAxis:'Y'|'Z';mode:'surface'|'solid';colorMode:'sample'|'uniform';material:number;thinPolicy:'conservative'|'center';name:string;assetId:string;materialStart:number;colorLevels?:4|8|16};
const transform=(v:number[],scale:number,up:string):V3=>(up==='Z'?[v[0]*scale,v[2]*scale,-v[1]*scale]:v.map(n=>n*scale)).map(n=>Object.is(n,-0)?0:n) as V3;
export async function loadMesh(source:Source,scale=1,upAxis='Y'):Promise<Loaded>{
 const triangles:Tri[]=[],warnings:string[]=[],bytes=Buffer.from(source.data,'base64');
 if(bytes.length>40_000_000)throw new Error('源文件最大 40MB');
 if(source.filename.toLowerCase().endsWith('.obj')){
  const vertices:number[][]=[],uvs:number[][]=[],colors:number[][]=[],mtls:Record<string,number[]>={};let current='untextured';
  for(const[name,data]of Object.entries(source.resources??{}))if(name.toLowerCase().endsWith('.mtl')){let mat='';for(const line of Buffer.from(data,'base64').toString().split(/\r?\n/)){const bits=line.trim().split(/\s+/);if(bits[0]==='newmtl')mat=bits.slice(1).join(' ');if(bits[0]==='Kd')mtls[mat]=bits.slice(1,4).map(Number);if(bits[0]==='map_Kd')warnings.push('OBJ map_Kd 暂不采样；请转换为带贴图的 GLB，或检查 Kd 色值。');}}
  for(const line of bytes.toString().split(/\r?\n/)){
   const bits=line.trim().split(/\s+/),kind=bits.shift();if(kind==='v'){const v=bits.map(Number);if(v.length<3||!v.every(Number.isFinite))throw new Error('OBJ 顶点无效');vertices.push(transform(v.slice(0,3),scale,upAxis));colors.push(v.length>=6?v.slice(3,6):[]);}
   if(kind==='vt')uvs.push(bits.slice(0,2).map(Number));if(kind==='usemtl')current=bits.join(' ');
   if(kind==='f'){
    const corners=bits.map(s=>{const a=s.split('/').map(Number);const vi=a[0]<0?vertices.length+a[0]:a[0]-1;return{v:vertices[vi],uv:uvs[a[1]-1],color:colors[vi]};});if(corners.some(c=>!c.v))throw new Error('OBJ 面引用无效');
    for(let i=1;i<corners.length-1;i++){const cs=[corners[0],corners[i],corners[i+1]];triangles.push({points:cs.map(c=>c.v as V3),color:[...(mtls[current]??[.65,.65,.65]),1],vertexColors:cs.every(c=>c.color.length)?cs.map(c=>c.color):undefined,material:current});}
   }
  }
  warnings.push('OBJ 无标准单位；已使用显式 scale 与 upAxis。多边形采用扇形三角化，凹多边形应先在源端三角化。');
 }else{
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);let doc;
  if(source.filename.toLowerCase().endsWith('.glb'))doc=await io.readBinary(bytes);
  else if(source.filename.toLowerCase().endsWith('.gltf')){
   const json=JSON.parse(bytes.toString()),resources:Record<string,Uint8Array>={};for(const[k,v]of Object.entries(source.resources??{}))resources[k]=Buffer.from(v,'base64');
   for(const resource of[...(json.buffers??[]),...(json.images??[])]){const uri=resource.uri;if(!uri)continue;if(uri.startsWith('data:')){const match=uri.match(/^data:[^;]+;base64,(.*)$/s);if(!match)throw new Error('仅支持 base64 data URI');resources[uri]=Buffer.from(match[1],'base64');}else if(!resources[uri])throw new Error(`缺失伴随文件 ${uri}；请同时上传，禁止网络/任意路径读取`);}
   doc=await io.readJSON({json,resources:resources as any});
  }else throw new Error('支持 GLB、glTF、OBJ');
  if(doc.getRoot().listAnimations().length)warnings.push('动画不体素化；导入静态节点姿态。');
  const texCache=new Map<any,Tex>();const scene=doc.getRoot().getDefaultScene()??doc.getRoot().listScenes()[0];if(!scene)throw new Error('glTF 没有场景');const nodes:any[]=[];scene.traverse(n=>nodes.push(n));
  for(const node of nodes){const mesh=node.getMesh();if(!mesh)continue;if(node.getSkin())throw new Error('蒙皮网格需在源端烘焙静态姿态后导入，避免错误几何');
   const world=new Matrix4().fromArray(node.getWorldMatrix()),inst=node.getExtension('EXT_mesh_gpu_instancing');let matrices=[world];
   if(inst){const at=inst.getAttribute('TRANSLATION'),ar=inst.getAttribute('ROTATION'),as=inst.getAttribute('SCALE'),count=(at??ar??as)?.getCount()??0;matrices=[];
    for(let i=0;i<count;i++){const tr=at?.getElement(i,[])??[0,0,0],rot=ar?.getElement(i,[])??[0,0,0,1],sc=as?.getElement(i,[])??[1,1,1];matrices.push(world.clone().multiply(new Matrix4().compose(new Vector3().fromArray(tr),new Quaternion().fromArray(rot),new Vector3().fromArray(sc))));}
   }
   for(const primitive of mesh.listPrimitives()){
    if(primitive.getMode()!==4)throw new Error('仅支持三角形图元，线/点/条带需先转换');if(primitive.listTargets().length)throw new Error('Morph 网格请先烘焙静态姿态');
    const positions=primitive.getAttribute('POSITION');if(!positions)continue;const index=primitive.getIndices(),count=index?.getCount()??positions.getCount(),mat=primitive.getMaterial(),factor=mat?.getBaseColorFactor()??[.65,.65,.65,1],texture=mat?.getBaseColorTexture();let tex:Tex|undefined;
    const texInfo=mat?.getBaseColorTextureInfo(),uv=primitive.getAttribute(`TEXCOORD_${texInfo?.getTexCoord()??0}`),vertexColor=primitive.getAttribute('COLOR_0');
    if(texture&&uv){tex=texCache.get(texture);if(!tex){const image=texture.getImage();if(image){const result=await sharp(image,{limitInputPixels:16_777_216}).ensureAlpha().raw().toBuffer({resolveWithObject:true});tex={data:result.data,width:result.info.width,height:result.info.height,channels:4,wrapS:texInfo?.getWrapS()??10497,wrapT:texInfo?.getWrapT()??10497};texCache.set(texture,tex);}}}
    const uvTransform=texInfo?.getExtension('KHR_texture_transform') as any,opticalTransparency=(mat?.getExtension('KHR_materials_transmission')?.getTransmissionFactor()??0)>0;if(opticalTransparency)warnings.push('透射材质只采样基础色，不把折射转成透明混合；实体填充会拒绝该壳体。');
    for(const matrix of matrices)for(let i=0;i<count;i+=3){const ids=[0,1,2].map(j=>index?index.getScalar(i+j):i+j);const points=ids.map(v=>transform(new Vector3().fromArray(positions.getElement(v,[])).applyMatrix4(matrix).toArray(),scale,upAxis));let uvs=uv?ids.map(v=>uv.getElement(v,[])):undefined;
     if(uvTransform&&uvs){const offset=uvTransform.getOffset(),s=uvTransform.getScale(),r=uvTransform.getRotation();uvs=uvs.map(([u,v])=>[offset[0]+Math.cos(r)*s[0]*u-Math.sin(r)*s[1]*v,offset[1]+Math.sin(r)*s[0]*u+Math.cos(r)*s[1]*v]);}
     triangles.push({points,color:[...factor],uv:uvs,texture:tex,vertexColors:vertexColor?ids.map(v=>vertexColor.getElement(v,[])):undefined,material:mat?.getName()??'untextured',linearColor:true,opaque:mat?.getAlphaMode()==='OPAQUE',opticalTransparency});
    }
   }
  }
 }
 if(!triangles.length||triangles.length>300000)throw new Error('网格必须有 1–300,000 个三角形');
 const min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];for(const t of triangles)for(const v of t.points){if(!v.every(n=>Number.isFinite(n)&&Math.abs(n)<32768))throw new Error('非有限或超范围坐标');for(let d=0;d<3;d++){min[d]=Math.min(min[d],v[d]);max[d]=Math.max(max[d],v[d]);}}
 return{triangles,warnings,bounds:{min,max},sourceMaterials:[...new Set(triangles.map(t=>t.material))]};
}
export function diagnoseMesh(mesh:Loaded,pitch:number){
 const edges=new Map<string,number>(),faces=new Set<string>(),parent=new Map<string,string>();let degenerate=0,duplicateFaces=0,transparent=0,thinTriangles=0,candidateTests=0;
 const root=(x:string):string=>{let r=x;while(parent.get(r)!==r)r=parent.get(r)!;while(x!==r){const n=parent.get(x)!;parent.set(x,r);x=n;}return r;};
 for(const t of mesh.triangles){const keys=t.points.map(p=>p.map(n=>Math.round(n*1e6)).join(','));for(const k of keys)if(!parent.has(k))parent.set(k,k);for(let i=0;i<3;i++){const a=keys[i],b=keys[(i+1)%3],k=[a,b].sort().join('|');edges.set(k,(edges.get(k)??0)+1);parent.set(root(a),root(b));}
  const face=[...keys].sort().join('|');if(faces.has(face))duplicateFaces++;faces.add(face);const tri=new Triangle(...t.points.map(p=>new Vector3(...p)) as [Vector3,Vector3,Vector3]);if(tri.getArea()<1e-12)degenerate++;
  if(t.opticalTransparency||t.opaque===false||(t.opaque!==true&&t.color[3]<1))transparent++;const spans=[0,1,2].map(i=>Math.max(...t.points.map(p=>p[i]))-Math.min(...t.points.map(p=>p[i])));if(spans.filter(n=>n>1e-7).some(n=>n<pitch))thinTriangles++;
  candidateTests+=spans.reduce((n,s)=>n*(Math.ceil(s/pitch)+2),1);
 }
 const boundaryEdges=[...edges.values()].filter(n=>n===1).length,nonManifoldEdges=[...edges.values()].filter(n=>n>2).length,components=new Set([...parent.keys()].map(root)).size;
 const componentBounds=new Map<string,Bounds>();for(const key of parent.keys()){const r=root(key),v=key.split(',').map(n=>Number(n)/1e6) as V3;let b=componentBounds.get(r);if(!b){b={min:[...v],max:[...v]};componentBounds.set(r,b);}for(let d=0;d<3;d++){b.min[d]=Math.min(b.min[d],v[d]);b.max[d]=Math.max(b.max[d],v[d]);}}
 const thinComponents=[...componentBounds.values()].filter(b=>b.max.some((n,d)=>n-b.min[d]<pitch)).length;let possibleOverlaps=0;const boxes=[...componentBounds.values()];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(boxes[i].min.every((v,d)=>v<boxes[j].max[d]&&boxes[i].max[d]>boxes[j].min[d]))possibleOverlaps++;
 const dims=mesh.bounds.max.map((v,i)=>Math.max(1,Math.ceil((v-mesh.bounds.min[i])/pitch)+2)),volume=dims.reduce((n,d)=>n*d,1);
 const estimatedWorkingMemoryMB=(volume*96+mesh.triangles.length*512)/1e6;
 const signedVolume=mesh.triangles.reduce((sum,t)=>{const [a,b,c]=t.points;return sum+(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;},0);
 return{estimatedWorkingMemoryMB,sourceSignedVolumeM3:boundaryEdges===0&&nonManifoldEdges===0&&duplicateFaces===0?Math.abs(signedVolume):null,triangles:mesh.triangles.length,boundaryEdges,nonManifoldEdges,duplicateFaces,degenerateTriangles:degenerate,transparentTriangles:transparent,subVoxelEdgeTriangles:thinTriangles,thinComponents,possibleComponentAABBOverlaps:possibleOverlaps,connectedComponents:components,watertight:boundaryEdges===0&&nonManifoldEdges===0&&duplicateFaces===0&&degenerate===0,boundsM:mesh.bounds,cellSizeM:pitch,estimatedGridCells:volume,estimatedDenseMemoryMB:volume*8/1e6,estimatedTriangleCellTests:candidateTests,risk:candidateTests>15_000_000||volume>2_000_000?'high':'normal',warnings:[...mesh.warnings,...(boundaryEdges?['存在开放边界/孔洞；实体填充会被拒绝。']:[]),...(nonManifoldEdges||duplicateFaces?['存在重复或非流形/粘连面；表面体素化合并占用格，但不能恢复被粘连结构。']:[]),...(thinComponents?['发现厚度小于格距的连通片，可能膨胀或丢失。']:[]),...(possibleOverlaps?['独立连通片包围盒有重叠，需对照源模型检查真实相交。']:[]),...(components>1?['存在多个独立连通片；未自动删除漂浮碎片。']:[]),...(transparent?['透明面参与表面体素化；透明度不证明实体封闭。']:[]),'采样只转移源颜色/贴图，不推断石材、木材、金属等语义。']};
}
const hex=(rgb:number[],levels:number)=>'#'+rgb.slice(0,3).map(n=>Math.round(Math.round(Math.max(0,Math.min(1,n))*(levels-1))*255/(levels-1))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function voxelize(mesh:Loaded,o:ConvertOptions,progress:(v:unknown)=>void=()=>{}){
 const start=performance.now(),diagnostics=diagnoseMesh(mesh,o.cellSize),g=new Grid(),materials:Record<string,Material>={},map=new Map<string,number>();
 if(diagnostics.estimatedGridCells>2_000_000||diagnostics.estimatedTriangleCellTests>50_000_000)throw Object.assign(new Error('转换预算超限：增大格距；已保留原件与诊断'),{diagnostics});
 if(o.mode==='solid'&&!diagnostics.watertight)throw Object.assign(new Error('实体填充拒绝非封闭/非流形网格；使用表面模式或手工修复'),{diagnostics});
 if(o.mode==='solid'&&diagnostics.transparentTriangles)throw Object.assign(new Error('透明壳体不自动实体填充；请拆分透明部件后转换'),{diagnostics});
 const s=o.cellSize,origin=o.origin,box=new Box3(),point=new Vector3(),near=new Vector3(),bary=new Vector3();let tests=0;const overlap=new Set<string>();
 for(let index=0;index<mesh.triangles.length;index++){
  const t=mesh.triangles[index],points=t.points.map(p=>p.map((n,d)=>{const grid=(n-origin[d])/s;return Math.abs(grid-Math.round(grid))<1e-5?origin[d]+Math.round(grid)*s:n;}) as V3),tri=new Triangle(...points.map(p=>new Vector3(...p)) as [Vector3,Vector3,Vector3]);if(tri.getArea()<1e-12)continue;
  const lo=[0,1,2].map(d=>Math.floor((Math.min(...points.map(p=>p[d]))-origin[d])/s+1e-5));
  const hi=[0,1,2].map(d=>Math.floor((Math.max(...points.map(p=>p[d]))-origin[d])/s-1e-5));for(let d=0;d<3;d++)hi[d]=Math.max(lo[d],hi[d]);
  for(let d=0;d<3;d++){const globalHi=Math.max(Math.floor((mesh.bounds.min[d]-origin[d])/s+1e-5),Math.ceil((mesh.bounds.max[d]-origin[d])/s-1e-5)-1);lo[d]=Math.min(lo[d],globalHi);hi[d]=Math.min(hi[d],globalHi);}
  for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++)for(let x=lo[0];x<=hi[0];x++){
   tests++;const v:V3=[x,y,z];box.min.set(x*s+origin[0],y*s+origin[1],z*s+origin[2]);box.max.copy(box.min).addScalar(s);if(!box.intersectsTriangle(tri))continue;
   box.getCenter(point);tri.closestPointToPoint(point,near);if(o.thinPolicy==='center'&&near.distanceTo(point)>s*.5+1e-8)continue;let material=o.material;
   if(o.colorMode==='sample'){
    tri.getBarycoord(near,bary);const weights=bary.toArray();let color=[...t.color];
    if(t.vertexColors)color=color.map((n,d)=>n*weights.reduce((sum,w,i)=>sum+w*(t.vertexColors![i][d]??1),0));
    if(t.texture&&t.uv){let u=weights.reduce((n,w,i)=>n+w*t.uv![i][0],0),v=weights.reduce((n,w,i)=>n+w*t.uv![i][1],0);const wrap=(n:number,mode:number)=>mode===33071?Math.max(0,Math.min(.999999,n)):mode===33648?1-Math.abs(((n%2)+2)%2-1):((n%1)+1)%1;u=wrap(u,t.texture.wrapS);v=wrap(v,t.texture.wrapT);const px=Math.min(t.texture.width-1,Math.floor(u*t.texture.width)),py=Math.min(t.texture.height-1,Math.floor(v*t.texture.height)),idx=(py*t.texture.width+px)*4;color=color.map((n,d)=>{const texel=t.texture!.data[idx+d]/255;const linear=t.linearColor&&d<3?(texel<=.04045?texel/12.92:((texel+.055)/1.055)**2.4):texel;return n*linear;});}
    if(t.linearColor)color=color.map((n,d)=>d===3?n:n<=.0031308?n*12.92:1.055*n**(1/2.4)-.055);if(t.opaque)color[3]=1;
    const c=hex(color,o.colorLevels??8),opacity=Math.round((color[3]??1)*10)/10,key=c+':'+opacity;
    if(!map.has(key)){if(map.size>=512)throw new Error('采样调色板超过 512 色，请降低每通道采样级数或改用统一材质');const id=o.materialStart+map.size;if(id>65535)throw new Error('材质 ID 耗尽');map.set(key,id);materials[id]={id,name:`采样 ${c}`,category:'sampled',color:c,roughness:.8,metalness:0,opacity,emissive:'#000000',intensity:0,solid:opacity>=1,source:`源基础色 × 纹理/顶点色；RGB 每通道 ${o.colorLevels??8} 级量化；未推断语义`};}
    material=map.get(key)!;
   }
   if(g.get(v))overlap.add(v.join(','));g.set(v,material);
  }
  if(index%100===0)progress({phase:'surface',progress:index/mesh.triangles.length,tests});
 }
 const surfaceCount=g.count,b=g.bounds();let filled=0;
 if(o.mode==='solid'&&b){
  // Scanline even/odd parity against original triangles, not flood-fill: preserves nested cavities.
  const a=new Vector3(),dir=new Vector3(1,0,0),hits:number[]=[];
  const {Ray}=await import('three');const ray=new Ray(a,dir),hit=new Vector3();const tris=mesh.triangles.map(t=>new Triangle(...t.points.map(p=>new Vector3(...p)) as [Vector3,Vector3,Vector3]));
  const work=(b.max[1]-b.min[1])*(b.max[2]-b.min[2])*tris.length;if(work>50_000_000)throw Object.assign(new Error('实体射线预算超限；增大格距'),{diagnostics});
  for(let y=b.min[1];y<b.max[1];y++)for(let z=b.min[2];z<b.max[2];z++){
   a.set((b.min[0]-1)*s+origin[0],(y+.500001)*s+origin[1],(z+.500003)*s+origin[2]);hits.length=0;for(const t of tris)if(ray.intersectTriangle(t.a,t.b,t.c,false,hit))hits.push(hit.x);hits.sort((a,b)=>a-b);const unique=hits.filter((n,i)=>!i||Math.abs(n-hits[i-1])>s*1e-7);
   for(let k=0;k+1<unique.length;k+=2)for(let x=Math.ceil((unique[k]-origin[0])/s-.5);(x+.5)*s+origin[0]<unique[k+1];x++)if(!g.get([x,y,z])){g.set([x,y,z],o.material);filled++;}
  }
 }
 const sizes=gridComponents(g),asset:Asset={id:o.assetId,name:o.name,version:1,category:'import',cellSize:s,origin,chunks:g.serialize(),parts:b?[{id:'root',name:'导入整体',parent:null,region:b}]:[],ports:[],openings:[],source:{diagnostics,options:o}};
 const boundsM=b?{min:b.min.map((n,i)=>n*s+origin[i]),max:b.max.map((n,i)=>n*s+origin[i])}:null;
 return{asset,materials,diagnostics,comparison:{sourceBoundsM:mesh.bounds,voxelBoundsM:boundsM,sourceTriangles:mesh.triangles.length,surfaceVoxels:surfaceCount,filledVoxels:filled,occupiedVolumeM3:g.count*s**3,voxelComponents:sizes.length,smallComponents:sizes.filter(n=>n<8).length,overlappingSurfaceCells:overlap.size,detailScaleM:s,dimensionDeltaM:boundsM?boundsM.max.map((n,i)=>(n-boundsM.min[i])-(mesh.bounds.max[i]-mesh.bounds.min[i])):null,holeAssessment:'未自动识别语义门窗；开放边、连通片及双精度预览用于人工确认。',warnings:['保守采样最多造成一格厚度偏差；格距以下孔洞和细缝可能闭合，必须对照原件。']},performance:{durationMs:performance.now()-start,triangleCellTests:tests,voxels:g.count,chunks:g.chunks.size}};
}
