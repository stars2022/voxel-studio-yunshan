import {texturedFaceMaterial} from './face-material';
import {faceAtlasSignature} from '../core/face-atlas';
import {texturedSkyMaterial,disposeSkyMaterial} from './sky-material';
import {activeAuthorEnvironment} from '../core/author-environment';
import {SkyPreview} from './sky-preview';
import type {SkyClock} from '../core/sky';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RenderMaterialLibrary,setMaterialClip} from './render-materials';
import type {VoxelEmitter} from '../core/emission';
import {Grid} from '../core/grid';
import {clone,validRegion,type Project,type Asset,type V3,type Bounds,type Material} from '../core/types';
import {visibleAssetIds,meshMaterialSignature,displayAsset,dirtyMeshChunks} from './mesh-plan';
import type {MeshBucket} from '../core/mesh';
type Built={texture?:MeshBucket['texture'];geometry:THREE.BufferGeometry;material:number;unlit?:boolean;doubleSided?:boolean;opacity?:number;vertexAlpha?:boolean};
export class Viewer {
 renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera:THREE.PerspectiveCamera|THREE.OrthographicCamera;controls:OrbitControls;root=new THREE.Group();original=new THREE.Group();
 worker=new Worker(new URL('./mesh-worker.ts',import.meta.url),{type:'module'});cache=new Map<string,Map<string,Built[]>>();renderCache=new Map<string,Built[]>();private materialLibrary=new RenderMaterialLibrary();materials=this.materialLibrary.materials;pending=new Map<string,(v:any)=>void>();
 skyPreview=new SkyPreview();environmentPreview=new SkyPreview();private skyRestore:{camera:THREE.PerspectiveCamera|THREE.OrthographicCamera;target:THREE.Vector3;clay:boolean}|null=null;
 private proceduralMaterials:THREE.Material[]=[];
 private cacheSources=new Map<string,{asset:Asset;signature:string}>();private materialSignature='';private cacheAccess=new Map<string,number>();private accessClock=0;
 isolatedRegion:Bounds|null=null;lastMeshedAssets:string[]=[];meshJobs=0;lastMeshError:string|null=null;
 project!:Project;assetId:string|null=null;mode:'scene'|'asset'='scene';ready=false;tool='orbit';selectedInstance:string|null=null;clipY=Infinity;layer:number|null=null;
 onPick:(p:V3|null,normal:V3|null,assetId:string|null,instanceId:string|null,event:PointerEvent)=>void=()=>{};onDrag:(p:V3|null,event:PointerEvent)=>void=()=>{};
 onStats:(stats:any)=>void=()=>{};hover=new THREE.Box3Helper(new THREE.Box3(),0xc7e2a8);selection=new THREE.Box3Helper(new THREE.Box3(),0xefd892);preview=new THREE.Box3Helper(new THREE.Box3(),0x80dfd1);
 lastMeshMs=0;frameTimes:number[]=[];lastFrame=performance.now();revision=0;
 private updateQueue:Promise<void>=Promise.resolve();private builtProject:Project|undefined;
 get renderedVersion(){return this.ready?this.builtProject?.version??null:null;}
 aoEnabled=false;composer!:EffectComposer;renderPass!:RenderPass;aoPass!:SSAOPass;
 bloomEnabled=false;bloomPass!:UnrealBloomPass;
 clayEnabled=false;
 // Base-colour face-normal contrast; saved face/sky textures remain visible. No scene lights, emission,
 // transparency, environment, shadows, AO or bloom. Occupancy is unchanged.
 clayMaterial=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,clipping:true,toneMapped:false,uniforms:{baseColor:{value:new THREE.Color(0xffffff)},unlitComponent:{value:false},texturedComponent:{value:false},skyMap:{value:null},skyOpacity:{value:1}},
  vertexShader:`#include <common>
   #include <clipping_planes_pars_vertex>
   attribute vec4 color;
   varying vec3 clayVertexColor;
   varying vec3 clayNormal;
   varying vec2 skyUV;
   void main(){skyUV=uv;clayVertexColor=color.rgb;clayNormal=normalize(normalMatrix*normal);vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;
   #include <clipping_planes_vertex>
   }`,
  fragmentShader:`#include <clipping_planes_pars_fragment>
   uniform vec3 baseColor;
   uniform bool unlitComponent;
   uniform bool texturedComponent;
   uniform sampler2D skyMap;
   uniform float skyOpacity;
   varying vec3 clayVertexColor;
   varying vec3 clayNormal;
   varying vec2 skyUV;
   void main(){
   #include <clipping_planes_fragment>
   vec3 n=normalize(clayNormal)*(gl_FrontFacing?1.0:-1.0);
   float shade=unlitComponent?1.0:0.58+0.39*max(0.0,dot(n,normalize(vec3(-0.35,0.65,1.0))));
   gl_FragColor=texturedComponent?texture2D(skyMap,skyUV)*vec4(vec3(shade),1.0):vec4(baseColor*clayVertexColor*shade,1.0);if(texturedComponent){gl_FragColor.a*=skyOpacity;if(gl_FragColor.a<0.01)discard;}
   #include <colorspace_fragment>
   }`});
 emitterCache=new Map<string,VoxelEmitter[]>();practicalLights=new THREE.Group();practicalsEnabled=false;
 studio=true;referenceLighting=false;sun!:THREE.DirectionalLight;ambient!:THREE.HemisphereLight;fill!:THREE.DirectionalLight;ground!:THREE.Mesh;grid!:THREE.GridHelper;environment:THREE.Texture|null=null;
 constructor(public el:HTMLElement){
  this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x27332e);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;this.renderer.localClippingEnabled=true;el.appendChild(this.renderer.domElement);
  this.camera=new THREE.PerspectiveCamera(37,1,.01,500);this.camera.position.set(11,8,-12);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(3,1.8,2);this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=.1;
  this.scene.add(this.root,this.original,this.practicalLights);this.ambient=new THREE.HemisphereLight(0xf2f4f6,0x77766e,1.25);this.scene.add(this.ambient);this.sun=new THREE.DirectionalLight(0xfff1dd,3.6);this.sun.position.set(-5,12,-8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.normalBias=.01;this.sun.shadow.bias=-.0002;this.sun.shadow.radius=3;this.scene.add(this.sun,this.sun.target);this.fill=new THREE.DirectionalLight(0xcdddec,.7);this.fill.position.set(10,7,10);this.scene.add(this.fill);
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.ground=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshStandardMaterial({color:0xc5c9c8,roughness:1,metalness:0}));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-.015;this.ground.receiveShadow=true;this.scene.add(this.ground);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();this.scene.environment=this.environment;this.scene.environmentIntensity=.28;
  const grid=new THREE.GridHelper(40,80,0x5b7054,0x3c5040);grid.position.y=-.012;grid.material.transparent=true;grid.material.opacity=.42;this.scene.add(grid);this.grid=grid;this.setStudio(true);
  this.scene.add(this.hover,this.selection,this.preview);for(const h of[this.hover,this.selection,this.preview]){h.visible=false;(h.material as THREE.Material).depthTest=false;h.renderOrder=99;}
  this.composer=new EffectComposer(this.renderer);this.composer.renderTarget1.samples=Math.min(4,this.renderer.capabilities.maxSamples);this.composer.renderTarget2.samples=Math.min(4,this.renderer.capabilities.maxSamples);this.renderPass=new RenderPass(this.scene,this.camera);this.aoPass=new SSAOPass(this.scene,this.camera,512,512,16);this.aoPass.kernelRadius=.25;this.aoPass.minDistance=.00005;this.aoPass.maxDistance=.015;
  const hide=(this.aoPass as any)._overrideVisibility.bind(this.aoPass);(this.aoPass as any)._overrideVisibility=()=>{hide();this.scene.traverse(o=>{if(o instanceof THREE.Mesh&&o.visible&&(Array.isArray(o.material)?o.material.some(m=>m.transparent):o.material.transparent)){o.visible=false;(this.aoPass as any)._visibilityCache.push(o);}});};
  setMaterialClip(this.aoPass.normalMaterial,this.clipY);this.composer.addPass(this.renderPass);this.composer.addPass(this.aoPass);this.bloomPass=new UnrealBloomPass(new THREE.Vector2(512,512),.22,.22,1.55);this.composer.addPass(this.bloomPass);this.composer.addPass(new OutputPass());this.renderer.info.autoReset=false;
  new ResizeObserver(()=>this.resize()).observe(el);this.worker.onmessage=e=>{this.pending.get(e.data.id)?.(e.data);this.pending.delete(e.data.id);};
  this.worker.onerror=e=>{for(const done of this.pending.values())done({error:e.message||'体素网格线程失败'});this.pending.clear();};
  this.renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0)return;const hit=this.pick(e);this.onPick(hit?.voxel??null,hit?.normal??null,hit?.assetId??null,hit?.instanceId??null,e);});
  this.renderer.domElement.addEventListener('pointermove',e=>{const hit=this.pick(e);if(this.mode==='asset'&&this.tool!=='orbit'&&hit&&this.assetId){const a=this.project.assets[this.assetId];let v=hit.voxel;if(this.tool==='brush')v=v.map((n,i)=>n+hit.normal[i]) as V3;this.box(this.hover,{min:v,max:v.map(n=>n+1) as V3},a);this.onDrag(v,e);}else this.hover.visible=false;});
  this.renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  const animate=()=>{requestAnimationFrame(animate);const now=performance.now();this.frameTimes.push(now-this.lastFrame);this.lastFrame=now;if(this.frameTimes.length>120)this.frameTimes.shift();this.controls.update();
   // Geometry rebuilds may dispose GPU buffers before the worker returns.
   // Keep the last complete frame until rebuild() publishes its replacement;
   // rendering old meshes here would re-upload disposed materials and buffers.
   if(!this.ready&&!(this.original.visible&&this.original.children.length))return;
   this.renderer.info.reset();if(this.skyPreview.clock||this.environmentPreview.clock){const previous=this.renderer.autoClear;this.renderer.autoClear=false;this.renderer.clear();(this.skyPreview.clock?this.skyPreview:this.environmentPreview).render(this.renderer,this.camera,this.el.clientWidth/this.el.clientHeight);this.renderer.clearDepth();this.renderer.render(this.scene,this.camera);this.renderer.autoClear=previous;}else if(!this.clayEnabled&&(this.aoEnabled||this.bloomEnabled)&&this.studio){this.aoPass.enabled=this.aoEnabled;this.bloomPass.enabled=this.bloomEnabled;this.syncEffectsCamera();this.composer.render();}else this.renderer.render(this.scene,this.camera);};animate();
 }
 syncEffectsCamera(){
  const mat=this.aoPass.ssaoMaterial,flag=this.camera instanceof THREE.PerspectiveCamera?1:0;
  if(mat.defines.PERSPECTIVE_CAMERA!==flag){mat.defines.PERSPECTIVE_CAMERA=flag;mat.needsUpdate=true;}
  mat.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix);mat.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse);mat.uniforms.cameraNear.value=this.camera.near;mat.uniforms.cameraFar.value=this.camera.far;
 }
 resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.composer?.setSize(w,h);if(this.camera instanceof THREE.PerspectiveCamera)this.camera.aspect=w/h;else{const vertical=this.camera.top-this.camera.bottom;this.camera.left=-vertical*w/h/2;this.camera.right=vertical*w/h/2;}this.camera.updateProjectionMatrix();}
 setTool(tool:string){this.tool=tool;this.controls.mouseButtons.LEFT=tool==='orbit'?THREE.MOUSE.ROTATE:-1 as any;this.renderer.domElement.style.cursor=tool==='orbit'?'grab':'crosshair';}
 makeMaterials(p:Project){this.materialLibrary.sync(p.materials,this.clipY,Math.min(8,this.renderer.capabilities.getMaxAnisotropy()));}

 meshMode:'near'|'far'='near';timeOfDay:'day'|'night'='day';
 setMeshMode(mode:'near'|'far'){if(mode!=='near'&&mode!=='far')throw new Error('Invalid mesh mode');this.meshMode=mode;return this.update(this.project);}
 setTimeOfDay(time:'day'|'night'){if(time!=='day'&&time!=='night')throw new Error('Invalid time of day');this.timeOfDay=time;this.setStudio(this.studio);}
 update(project:Project){
  const rev=++this.revision,meshMode=this.meshMode;this.project=project;this.ready=false;this.el.classList.add('meshing');
  // A hash means completed geometry. Serialise cache writes and skip superseded queued
  // snapshots so undo/redo cannot publish an empty or partially populated asset cache.
  this.updateQueue=this.updateQueue.catch(()=>{}).then(async()=>{if(rev===this.revision)await this.buildSnapshot(project,rev,meshMode);});
  return this.updateQueue;
 }
 private async buildSnapshot(project:Project,rev:number,meshMode:'near'|'far'){
  const signature=meshMode+meshMaterialSignature(project),materialSignature=JSON.stringify(project.materials);
  if(materialSignature!==this.materialSignature){this.makeMaterials(project);this.materialSignature=materialSignature;}
  const visible=visibleAssetIds(project,this.mode,this.assetId);this.lastMeshedAssets=[];this.lastMeshError=null;
  const tasks:Promise<void>[]=[];
  for(const key of visible){
   const a=project.assets[key],gridAsset=displayAsset(a,this.mode==='asset'?this.layer:null,this.mode==='asset'?this.isolatedRegion:null),old=this.cacheSources.get(key),assetSignature=signature+(a.sky?JSON.stringify(Object.values(a.sky.materials).map(id=>[id,project.materials[id].color,project.materials[id].opacity])):'');
   const effectSignature=assetSignature+JSON.stringify((a.meshes??[]).filter(m=>m.atmosphere||m.faceAtlas).map(m=>m.faceAtlas?faceAtlasSignature(m.faceAtlas,project.materials):[m.material,project.materials[m.material].color,project.materials[m.material].opacity]));
   const changed=dirtyMeshChunks(old?.asset,gridAsset,old?.signature!==effectSignature);this.cacheAccess.set(key,++this.accessClock);
   if(!changed.length){this.cacheSources.set(key,{asset:gridAsset,signature:effectSignature});continue;}
   const id=crypto.randomUUID();this.lastMeshedAssets.push(key);this.meshJobs++;
   tasks.push(new Promise<void>((resolve,reject)=>{
    this.pending.set(id,data=>{
     if(data.error){reject(new Error(`资产 ${key} 网格生成失败：${data.error}`));return;}
     // Publish hashes/snapshots only after the worker has returned complete geometry.
     const next=new Map<string,Built[]>();
     try{for(const chunk of data.chunks){const list=chunk.buckets.map((b:MeshBucket)=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(b.uvs,2));if(b.colors)geometry.setAttribute('color',new THREE.Float32BufferAttribute(b.colors,4));geometry.setIndex(b.indices);geometry.computeBoundingSphere();return{texture:b.texture,geometry,material:b.material,unlit:b.unlit,doubleSided:b.doubleSided,opacity:b.opacity,vertexAlpha:b.colors?.some((v,i)=>i%4===3&&v<1)};});next.set(chunk.key,list);}}
     catch(e){for(const list of next.values())list.forEach(b=>b.geometry.dispose());reject(e);return;}
     let cached=this.cache.get(key);if(!cached){cached=new Map;this.cache.set(key,cached);}
     this.dropMerged(key);if(data.replaceAll){for(const list of cached.values())list.forEach(b=>b.geometry.dispose());cached.clear();}for(const [ck,list]of next){cached.get(ck)?.forEach(b=>b.geometry.dispose());if(list.length)cached.set(ck,list);else cached.delete(ck);}
     this.cacheSources.set(key,{asset:gridAsset,signature:effectSignature});this.emitterCache.set(key,data.emitters??[]);this.lastMeshMs=data.durationMs;resolve();
    });
    this.worker.postMessage({id,asset:gridAsset,materials:project.materials,keys:changed,far:meshMode==='far',replaceAll:old?.signature!==effectSignature||!!old?.asset.sky!==!!gridAsset.sky||!!old?.asset.meshes!==!!gridAsset.meshes});
   }));
  }
  // Await every job before the next snapshot can write the cache, including failures.
  const settled=await Promise.allSettled(tasks),error=settled.find(r=>r.status==='rejected') as PromiseRejectedResult|undefined;
  if(error){this.lastMeshError=String(error.reason?.message??error.reason);if(rev===this.revision)this.el.classList.remove('meshing');throw error.reason;}
  for(const id of this.cache.keys())if(!project.assets[id])this.dropAssetCache(id);
  this.builtProject=project;if(rev!==this.revision)return;if(this.skyPreview.clock){if(Object.values(project.assets).some(a=>a.sky))this.skyPreview.set(project,this.skyPreview.clock);else this.setSkyPreview(null);}this.syncAuthorEnvironment();this.rebuild();this.pruneCache(new Set(visible));this.ready=true;this.el.classList.remove('meshing');
 }
 private dropAssetCache(id:string){for(const list of this.cache.get(id)?.values()??[])for(const b of list)b.geometry.dispose();this.cache.delete(id);this.dropMerged(id);this.emitterCache.delete(id);this.cacheSources.delete(id);this.cacheAccess.delete(id);}
 get geometryBytes(){let bytes=0;const add=(g:THREE.BufferGeometry)=>{for(const a of Object.values(g.attributes))bytes+=a.array.byteLength;bytes+=g.index?.array.byteLength??0;};for(const chunks of this.cache.values())for(const list of chunks.values())for(const b of list)add(b.geometry);for(const list of this.renderCache.values())for(const b of list)add(b.geometry);return bytes;}
 private pruneCache(visible:Set<string>){const inactive=[...this.cache.keys()].filter(id=>!visible.has(id)).sort((a,b)=>(this.cacheAccess.get(a)??0)-(this.cacheAccess.get(b)??0));while(inactive.length&&(inactive.length>8||this.geometryBytes>128*1024*1024))this.dropAssetCache(inactive.shift()!);}
 dropMerged(id:string){for(const b of this.renderCache.get(id)??[])b.geometry.dispose();this.renderCache.delete(id);}
 merged(id:string):Built[]{
  const existing=this.renderCache.get(id);if(existing)return existing;
  const groups=new Map<string,THREE.BufferGeometry[]>(),settings=new Map<string,Built>();let textureIndex=0;for(const list of this.cache.get(id)?.values()??[])for(const b of list){const key=String(b.material)+(b.texture?'-texture-'+textureIndex++:'');settings.set(key,b);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(b.geometry);}
  const merged:Built[]=[];for(const [key,geometries]of groups){const geometry=mergeGeometries(geometries,false);if(geometry){geometry.computeBoundingSphere();merged.push({...settings.get(key)!,geometry});}}this.renderCache.set(id,merged);return merged;
 }
 rebuild(){
  this.original.visible=false;this.proceduralMaterials.forEach(disposeSkyMaterial);this.proceduralMaterials=[];const faceMaterials=new Map<string,THREE.MeshStandardMaterial>();this.root.clear();this.practicalLights.clear();let lightCount=0;const add=(a:Asset,position:V3,rotation:number,instanceId:string|null)=>{if(a.sky&&(this.skyPreview.clock||this.mode==='scene'&&Object.values(this.project.assemblies??{}).some(v=>(v.source?.environment as any)?.skyAssetIds?.includes(a.id))))return;const group=new THREE.Group();group.position.fromArray(position);group.rotation.y=rotation*Math.PI/2;for(const b of this.merged(a.id)){const sourceMaterial=this.materials.get(b.material);if(!sourceMaterial)continue;let material:THREE.MeshStandardMaterial|THREE.MeshBasicMaterial=sourceMaterial;if(b.unlit){material=texturedSkyMaterial(b);this.proceduralMaterials.push(material);}else if(b.texture){const key=b.material+':'+b.texture.key;let face=faceMaterials.get(key);if(!face){face=texturedFaceMaterial(b,sourceMaterial);faceMaterials.set(key,face);this.proceduralMaterials.push(face);}material=face;}if(b.texture)setMaterialClip(material,this.clipY);const mesh=new THREE.Mesh(b.geometry,material);mesh.userData={assetId:a.id,instanceId};mesh.onBeforeRender=()=>{if(this.clayEnabled){this.clayMaterial.uniforms.baseColor.value.copy(material.color);this.clayMaterial.uniforms.unlitComponent.value=!!b.unlit;this.clayMaterial.uniforms.texturedComponent.value=!!b.texture;this.clayMaterial.uniforms.skyMap.value=b.texture?material.map:null;this.clayMaterial.uniforms.skyOpacity.value=material.opacity;this.clayMaterial.uniformsNeedUpdate=true;}};mesh.castShadow=!b.unlit&&!material.transparent;mesh.receiveShadow=!b.unlit&&!material.transparent;mesh.renderOrder=material.transparent?2:sourceMaterial.emissiveIntensity>0?1:0;group.add(mesh);}this.root.add(group);
   for(const e of this.emitterCache.get(a.id)??[]){if(lightCount>=8)break;const mat=this.project.materials[e.material];if(!mat?.intensity)continue;const light=new THREE.PointLight(mat.emissive,Math.min(4,mat.intensity*e.area*35),1.35,2);light.position.fromArray(e.position).applyAxisAngle(new THREE.Vector3(0,1,0),rotation*Math.PI/2).add(new THREE.Vector3().fromArray(position));this.practicalLights.add(light);lightCount++;}
  };
  if(this.mode==='asset'&&this.assetId&&this.project.assets[this.assetId])add(this.project.assets[this.assetId],[0,0,0],0,null);else for(const i of Object.values(this.project.instances))add(this.project.assets[i.assetId],i.position,i.rotation,i.id);
  if(this.mode==='asset'&&this.project.selection.region&&this.project.selection.assetId===this.assetId)this.box(this.selection,this.project.selection.region,this.project.assets[this.assetId!]);else this.selection.visible=false;
  this.practicalLights.visible=!this.clayEnabled&&this.studio&&this.practicalsEnabled;this.fitLight();this.onStats({drawObjects:this.root.children.reduce((n,g)=>n+g.children.length,0),triangles:this.renderer.info.render.triangles,meshMs:this.lastMeshMs});
 }
 syncAuthorEnvironment(){const active=this.mode==='scene'?activeAuthorEnvironment(this.project):null;if(active)this.environmentPreview.set(this.project,active.state.clock,active.environment.skyAssetIds,active.rotation);else{const wasActive=!!this.environmentPreview.clock;this.environmentPreview.clear();if(wasActive)this.setStudio(this.studio);}}
 get authorEnvironment(){const a=this.mode==='scene'?activeAuthorEnvironment(this.project):null;return a?{...a,background:this.environmentPreview.stats}:null;}
 async setMode(mode:'scene'|'asset',assetId?:string){if(this.skyPreview.clock)this.setSkyPreview(null);this.mode=mode;this.assetId=assetId??this.assetId;this.original.visible=false;this.layer=null;this.isolatedRegion=null;await this.update(this.project);await this.updateQueue;this.fit();}
 contentBounds(){return new THREE.Box3().setFromObject(this.original.visible&&this.original.children.length?this.original:this.root);}
 frame(bounds?:THREE.Box3){
  const b=bounds??this.contentBounds();if(b.isEmpty())return;const center=b.getCenter(new THREE.Vector3()),dir=this.camera.position.clone().sub(center).normalize(),right=new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);let w=0,h=0,depth=0;
  for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){const v=new THREE.Vector3(x,y,z).sub(center);w=Math.max(w,Math.abs(v.dot(right)));h=Math.max(h,Math.abs(v.dot(up)));depth=Math.max(depth,Math.abs(v.dot(dir)));}
  const aspect=this.el.clientWidth/this.el.clientHeight,half=Math.max(h,w/aspect,.05)*1.26;this.controls.target.copy(center);
  if(this.camera instanceof THREE.OrthographicCamera){this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;this.camera.zoom=1;}
  else{const distance=half/Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))+depth;this.camera.position.copy(center).addScaledVector(dir,distance);}
  // Long bridges can place the fitted camera beyond the old 500m far plane.
  // Cover the complete bounding sphere, including subsequent orbit rotations.
  const radius=b.getSize(new THREE.Vector3()).length()/2;
  this.camera.far=Math.max(500,this.camera.position.distanceTo(center)+radius*1.5+.1);
  this.camera.updateProjectionMatrix();this.controls.update();this.fitLight();
 }
 focusRegion(region:Bounds){
  if(this.mode!=='asset'||!this.assetId)return;
  const a=this.project.assets[this.assetId],point=(v:V3)=>new THREE.Vector3(...v.map((n,i)=>a.origin[i]+n*a.cellSize) as V3);
  const b=new THREE.Box3(point(region.min),point(region.max)),center=b.getCenter(new THREE.Vector3());
  this.camera.position.add(center.clone().sub(this.controls.target));this.controls.target.copy(center);this.controls.update();this.frame(b);
 }
 fit(){const box=this.contentBounds();if(box.isEmpty())return;const center=box.getCenter(new THREE.Vector3()),d=Math.max(...box.getSize(new THREE.Vector3()).toArray(),.1);this.controls.target.copy(center);this.camera.position.copy(center).add(new THREE.Vector3(1.15,.85,-1.5).multiplyScalar(d*1.65));this.controls.update();this.frame();}

 view(name:string){if(this.skyPreview.clock)this.setSkyPreview(null);const box=new THREE.Box3().setFromObject(this.original.visible&&this.original.children.length?this.original:this.root),center=box.isEmpty()?new THREE.Vector3():box.getCenter(new THREE.Vector3()),d=box.isEmpty()?5:Math.max(...box.getSize(new THREE.Vector3()).toArray(),1),aspect=this.el.clientWidth/this.el.clientHeight;const perspective=name==='perspective';
  const old=this.controls.target.clone();this.controls.dispose();this.camera=perspective?new THREE.PerspectiveCamera(37,aspect,.01,500):new THREE.OrthographicCamera(-d*.8*aspect,d*.8*aspect,d*.8,-d*.8,.01,500);
  const directions:Record<string,number[]>={perspective:[1.15,.85,-1.5],isometric:[1,1,-1],front:[0,0,-1],back:[0,0,1],left:[-1,0,0],right:[1,0,0],top:[0,1,0],bottom:[0,-1,0]};const dir=new THREE.Vector3().fromArray(directions[name]??directions.perspective);if(name==='top')this.camera.up.set(0,0,1);else if(name==='bottom')this.camera.up.set(0,0,-1);this.camera.position.copy(center).add(dir.multiplyScalar(d*1.8));this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.copy(center);this.controls.enableDamping=true;this.setTool(this.tool);this.controls.update();this.ground.visible=!this.clayEnabled&&this.studio&&name!=='bottom'&&!this.project?.assets[this.assetId!]?.sky;this.renderPass.camera=this.camera;this.aoPass.camera=this.camera;this.frame();
 }
 toggleProjection(){this.view(this.camera instanceof THREE.PerspectiveCamera?'front':'perspective');}
 setSkyPreview(clock:SkyClock|null){
  if(clock){this.skyPreview.set(this.project,clock);if(!this.skyRestore){this.skyRestore={camera:this.camera.clone(),target:this.controls.target.clone(),clay:this.clayEnabled};this.setClay(false);this.controls.dispose();this.camera=new THREE.PerspectiveCamera(60,this.el.clientWidth/this.el.clientHeight,.05,500);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.setSkyObserver([0,1.6,0],[1,.12,-.35]);}this.rebuild();this.ground.visible=false;this.grid.visible=false;this.renderPass.camera=this.camera;this.aoPass.camera=this.camera;
  }else{this.skyPreview.clear();const r=this.skyRestore;this.skyRestore=null;if(r){this.controls.dispose();this.camera=r.camera;this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.copy(r.target);this.controls.enableDamping=true;this.controls.update();this.rebuild();this.setClay(r.clay);this.renderPass.camera=this.camera;this.aoPass.camera=this.camera;this.resize();}}
 }
 setSkyObserver(position:V3,direction:V3){if(!this.skyPreview.clock)throw new Error('先开启天空预览');if([...position,...direction].some(n=>!Number.isFinite(n))||Math.hypot(...direction)<.0001)throw new Error('无效天空观察点');this.camera.position.fromArray(position);this.controls.target.copy(this.camera.position).add(new THREE.Vector3(...direction).normalize());this.controls.update();}
 setClay(enabled:boolean){
  this.clayEnabled=enabled;this.scene.overrideMaterial=enabled?this.clayMaterial:null;
  setMaterialClip(this.clayMaterial,this.clipY);
  if(enabled){this.renderer.setClearColor(this.project?.assets[this.assetId!]?.sky?.kind==='stars'?0x071125:0xcacaca);this.renderer.shadowMap.enabled=false;this.scene.environment=null;this.ground.visible=false;this.grid.visible=false;this.practicalLights.visible=false;this.hover.visible=false;this.selection.visible=false;this.preview.visible=false;}
  else this.setStudio(this.studio);
 }
 setClip(value:number){if(!Number.isFinite(value)&&value!==Infinity)throw new Error("Invalid clip height");this.clipY=value;setMaterialClip(this.clayMaterial,value);this.practicalLights.children.forEach(l=>l.visible=l.position.y<value);setMaterialClip(this.aoPass.normalMaterial,value);for(const material of [...this.materials.values(),...this.proceduralMaterials])setMaterialClip(material,value);}
 setStudio(enabled:boolean){
  this.studio=enabled;const soft=enabled&&this.referenceLighting;
  const shadowType=soft?THREE.VSMShadowMap:THREE.PCFSoftShadowMap,shadowChanged=this.renderer.shadowMap.enabled!==enabled||this.renderer.shadowMap.type!==shadowType;
  this.practicalLights.visible=enabled&&this.practicalsEnabled;document.body.classList.toggle('studio-light',enabled);
  const backdrop=soft?0xd6d7d3:0xc5c9c8;this.renderer.setClearColor(enabled?backdrop:0x27332e);(this.ground.material as THREE.MeshStandardMaterial).color.setHex(backdrop);
  this.grid.visible=!enabled;this.ground.visible=enabled;this.renderer.shadowMap.enabled=enabled;
  this.renderer.shadowMap.type=shadowType;this.sun.shadow.radius=soft?5:3;this.sun.shadow.blurSamples=8;
  // Shadow enablement and filtering are shader defines. Cached materials must
  // recompile when these change, including currently hidden asset materials.
  if(shadowChanged){const affected=new Set<THREE.Material>(this.materials.values());this.scene.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])affected.add(m);});for(const m of affected)m.needsUpdate=true;}
  this.ambient.intensity=enabled?(soft?.8:1.25):2.6;this.sun.intensity=enabled?(soft?2.6:3.6):3.1;this.sun.color.setHex(soft?0xfff6e9:0xfff1dd);this.fill.intensity=soft?.6:.7;
  this.scene.environment=enabled?this.environment:null;this.scene.environmentIntensity=soft?.75:.28;this.renderer.toneMappingExposure=enabled?(soft?1:.85):1.1;
  if(this.aoPass){this.aoPass.kernelRadius=soft?.085:.25;this.aoPass.minDistance=soft?.00001:.00005;this.aoPass.maxDistance=soft?.001:.015;
   // Multiply only part of the screen-space occlusion into the scene. Keeping
   // source alpha in this blend avoids darkening the entire frame at opacity < 1.
   this.aoPass.copyMaterial.uniforms.opacity.value=soft?.55:1;this.aoPass.copyMaterial.blendDst=soft?THREE.OneMinusSrcAlphaFactor:THREE.ZeroFactor;
   // AO modulates scene RGB, never coverage. Reducing destination alpha made
   // the opaque canvas blend with the white page and washed out every material.
   this.aoPass.copyMaterial.blendSrcAlpha=THREE.ZeroFactor;this.aoPass.copyMaterial.blendDstAlpha=THREE.OneFactor;
  }
  if(enabled&&this.timeOfDay==='night'){this.renderer.setClearColor(0x18252e);(this.ground.material as THREE.MeshStandardMaterial).color.setHex(0x52616a);this.ambient.intensity=.25;this.sun.intensity=.5;this.sun.color.setHex(0x9bc0e1);this.fill.intensity=.16;this.scene.environmentIntensity=.035;this.renderer.toneMappingExposure=.9;}
  if(this.project?.assets[this.assetId!]?.sky?.kind==='stars'){this.renderer.setClearColor(0x071125);this.ground.visible=false;this.grid.visible=false;}this.fitLight();if(this.clayEnabled)this.setClay(true);
 }
 setReferenceLighting(enabled:boolean){this.referenceLighting=enabled;this.setStudio(this.studio);}
 fitLight(){const b=new THREE.Box3().setFromObject(this.original.visible&&this.original.children.length?this.original:this.root);if(b.isEmpty())return;const center=b.getCenter(new THREE.Vector3()),d=Math.max(...b.getSize(new THREE.Vector3()).toArray(),1);this.sun.position.copy(center).add(new THREE.Vector3(-.6,this.referenceLighting?2.5:1.5,-1).multiplyScalar(d));this.sun.target.position.copy(center);const cam=this.sun.shadow.camera;cam.left=-d;cam.right=d;cam.top=d;cam.bottom=-d;cam.near=.01;cam.far=d*5;cam.updateProjectionMatrix();this.sun.shadow.normalBias=d*.0008;this.ground.position.y=b.min.y-.005;
  const active=this.mode==='scene'?activeAuthorEnvironment(this.project):null;if(active&&!this.skyPreview.clock){const s=active.state,day=s.sunIntensity>s.moonIntensity;this.sun.position.copy(center).add(new THREE.Vector3(...(day?s.sun:s.moon)).multiplyScalar(d*2));this.sun.color.set(day?s.sunColor:s.moonColor);this.sun.intensity=day?s.sunIntensity:s.moonIntensity;this.ambient.intensity=s.hemisphereIntensity;this.fill.intensity=s.fillIntensity;this.scene.environmentIntensity=.02;this.renderer.toneMappingExposure=s.exposure;this.ground.visible=false;this.grid.visible=false;this.sun.shadow.normalBias=Math.max(.001,d*.00015);}
 }
 safeGLTFLoader(){const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(!url.startsWith('blob:')&&!url.startsWith('data:'))throw new Error('原件预览禁止外部地址读取，请同时选择伴随文件');return url;});return new GLTFLoader(manager);}
 async sourceObject(source:{filename:string;data:string;resources?:Record<string,string>;scale:number;upAxis:string}){
  const bytes=Uint8Array.from(atob(source.data),c=>c.charCodeAt(0));let input:string|ArrayBuffer=bytes.buffer;
  if(source.filename.toLowerCase().endsWith('.gltf')){const json=JSON.parse(new TextDecoder().decode(bytes));for(const item of[...(json.buffers??[]),...(json.images??[])])if(item.uri&&!item.uri.startsWith('data:')){const content=source.resources?.[item.uri];if(!content)throw new Error('预览缺失伴随文件 '+item.uri);const mime=/\.png$/i.test(item.uri)?'image/png':/\.jpe?g$/i.test(item.uri)?'image/jpeg':'application/octet-stream';item.uri='data:'+mime+';base64,'+content;}input=JSON.stringify(json);}
  const result=await this.safeGLTFLoader().parseAsync(input,'');result.scene.scale.multiplyScalar(source.scale);if(source.upAxis==='Z')result.scene.rotation.x=-Math.PI/2;return result.scene;
 }
 clearOriginal(){this.original.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const mat of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(mat))if(v instanceof THREE.Texture)v.dispose();mat.dispose();}}});this.original.clear();}
 async showGLB(data:string){const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0)),gltf=await this.safeGLTFLoader().parseAsync(bytes.buffer,'');this.root.clear();this.practicalLights.clear();this.clearOriginal();this.selection.visible=false;this.original.visible=true;this.original.add(gltf.scene);gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){const transparent=(Array.isArray(o.material)?o.material.some(m=>m.transparent):o.material.transparent);o.castShadow=!transparent;o.receiveShadow=!transparent;}});this.view('front');const box=new THREE.Box3().setFromObject(this.original),center=box.getCenter(new THREE.Vector3()),d=Math.max(...box.getSize(new THREE.Vector3()).toArray(),.5);this.controls.target.copy(center);this.camera.position.copy(center).add(new THREE.Vector3(1,.85,-1.6).multiplyScalar(d*1.6));this.controls.update();this.frame();return{bounds:box.getSize(new THREE.Vector3()).toArray()};}
 async setLayer(value:number|null){if(value!==null&&this.project.assets[this.assetId!]?.sky)throw new Error('程序天空没有体素层');if(value!==null&&(!Number.isInteger(value)||Math.abs(value)>32768))throw new Error('层坐标必须为有效整数');this.layer=value;await this.update(this.project);}
 async isolateRegion(region:Bounds|null){if(region&&this.project.assets[this.assetId!]?.sky)throw new Error('程序天空没有体素选区');if(region)validRegion(region);this.isolatedRegion=region?clone(region):null;await this.update(this.project);if(region)this.focusRegion(region);else this.fit();}
 box(helper:THREE.Box3Helper,b:Bounds,a:Asset){helper.box.set(new THREE.Vector3(...b.min.map((n,i)=>a.origin[i]+n*a.cellSize) as V3),new THREE.Vector3(...b.max.map((n,i)=>a.origin[i]+n*a.cellSize) as V3));helper.visible=true;helper.updateMatrixWorld(true);}
 groundPoint(event:PointerEvent):V3|null{const rect=this.el.getBoundingClientRect(),mouse=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster(),point=new THREE.Vector3();ray.setFromCamera(mouse,this.camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)?point.toArray() as V3:null;}
 pick(event:PointerEvent){if(!this.ready)return null;const rect=this.el.getBoundingClientRect(),mouse=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,this.camera);const hits=ray.intersectObject(this.root,true).filter(h=>h.point.y<=this.clipY+.0001&&!this.project.assets[h.object.userData.assetId]?.sky);
  if(hits.length){const hit=hits[0],a=this.project.assets[hit.object.userData.assetId];if(!a)return null;const local=hit.object.worldToLocal(hit.point.clone()),n=hit.face!.normal;const voxel=local.toArray().map((x,d)=>Math.floor((x-a.origin[d]-n.getComponent(d)*a.cellSize*.001)/a.cellSize)) as V3;return{voxel,normal:n.toArray() as V3,assetId:a.id,instanceId:hit.object.userData.instanceId};}
  if(this.mode==='asset'&&this.assetId&&!this.project.assets[this.assetId].sky){const a=this.project.assets[this.assetId],point=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-a.origin[1]),point)){const voxel=point.toArray().map((n,d)=>Math.floor((n-a.origin[d])/a.cellSize)) as V3;voxel[1]=-1;return{voxel,normal:[0,1,0] as V3,assetId:a.id,instanceId:null};}}
  return null;
 }
 async showComparison(triangles:{points:V3[],color:number[]}[],asset?:Asset,materials?:Record<string,Material>,source?:{filename:string;data:string;resources?:Record<string,string>;scale:number;upAxis:string}){
  this.root.clear();this.practicalLights.clear();this.clearOriginal();this.selection.visible=false;this.original.visible=true;
  if(source&&/\.glb|\.gltf$/i.test(source.filename))this.original.add(await this.sourceObject(source));
  else{const pos:number[]=[],colors:number[]=[];for(const t of triangles)for(const p of t.points){pos.push(...p);colors.push(...t.color.slice(0,3));}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();this.original.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide})));}
  const originalBox=new THREE.Box3().setFromObject(this.original),shift=originalBox.getSize(new THREE.Vector3()).x*1.25;
  if(asset){const combined={...this.project.materials,...materials},id=crypto.randomUUID();const data:any=await new Promise((resolve,reject)=>{this.pending.set(id,value=>value.error?reject(new Error(value.error)):resolve(value));this.worker.postMessage({id,asset,materials:combined,keys:Object.keys(asset.chunks)});});
   const groups=new Map<number,THREE.BufferGeometry[]>();for(const chunk of data.chunks)for(const b of chunk.buckets){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));geo.setIndex(b.indices);if(!groups.has(b.material))groups.set(b.material,[]);groups.get(b.material)!.push(geo);}
   for(const [mid,geometries]of groups){const geometry=mergeGeometries(geometries,false)!;geometries.forEach(g=>g.dispose());const m=combined[mid],mat=new THREE.MeshStandardMaterial({color:m.color,opacity:m.opacity,transparent:m.opacity<1,depthWrite:m.opacity>=1,roughness:m.roughness,metalness:m.metalness,emissive:m.emissive,emissiveIntensity:m.intensity,side:m.opacity<1?THREE.DoubleSide:THREE.FrontSide}),mesh=new THREE.Mesh(geometry,mat);mesh.position.x=-shift;this.original.add(mesh);}
  }
  this.original.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=!(o.material as THREE.Material).transparent;o.receiveShadow=o.castShadow;}});this.view('perspective');this.frame();
 }
}
