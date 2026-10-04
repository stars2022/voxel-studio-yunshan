export type V3 = [number, number, number];
export type Bounds = {min: V3; max: V3}; // half-open, voxel indices unless named *M
export type Material = {id:number; name:string; category:string; color:string; roughness:number; metalness:number; opacity:number; emissive:string; intensity:number; solid:boolean; source?:string; surface?:import('./surface').SurfaceKind; surfaceScale?:number; surfaceStrength?:number; surfaceSeed?:number; surfaceRotation?:number};
export type Port = {id:string; kind:string; position:V3; normal:V3; size:V3; pitch:number}; // metres
export type Part = {id:string; name:string; parent:string|null; region:Bounds};
export type Asset = {id:string; name:string; version:number; category:'base'|'template'|'import'; cellSize:number; origin:V3; chunks:Record<string,number[]>; parts:Part[]; ports:Port[]; openings:Bounds[]; template?:{type:string; params:Record<string,number>; style:string}; source?:Record<string,unknown>;rig?:import('./rig').RigDescriptor;meshes?:import('./authored-mesh').AuthoredMesh[];sky?:import('./sky').SkyDescriptor};
export type Instance = {id:string; assetId:string; name:string; position:V3; rotation:number; parent:string|null};
export type Selection = {assetId:string|null; region:Bounds|null; partId:string|null};
export type Assembly = {id:string;name:string;version:number;instances:Instance[]};
export type Project = {format:'yunshan.voxels'; formatVersion:1; name:string; units:'metres'; upAxis:'Y'; version:number; materials:Record<string,Material>; styles:Record<string,Record<string,number>>; palettes:Record<string,Record<string,Partial<Material>>>; assets:Record<string,Asset>; assemblies?:Record<string,Assembly>; instances:Record<string,Instance>; selection:Selection; catalog?:import('./catalog').Catalog; createdAt:string; modifiedAt:string};
export type Command = {op:string; [key:string]:any};
export type Envelope = {expectedVersion:number; requestId:string; commands:Command[]; dryRun?:boolean; previewToken?:string; label?:string};
export type EditResult = {version:number; modifiedVoxels:number; affectedAssets:string[]; affectedInstances:string[]; bounds:Record<string,Bounds|null>; warnings:string[]; dryRun:boolean; previewToken?:string; dirtyChunks:Record<string,string[]>; label:string; durationMs:number};
export const clone = <T>(x:T):T=>structuredClone(x);
export const dirs:V3[]=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export const inside=(p:V3,b:Bounds)=>p.every((v,i)=>v>=b.min[i]&&v<b.max[i]);
export const regionVolume=(b:Bounds)=>b.max.reduce((v,n,i)=>v*(n-b.min[i]),1);
export function validRegion(b:Bounds,limit=2_000_000){
  if(!b||!Array.isArray(b.min)||!Array.isArray(b.max)||b.min.length!==3||b.max.length!==3||![...b.min,...b.max].every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=32768)||b.max.some((v,i)=>v<=b.min[i])||regionVolume(b)>limit)throw new Error('区域无效或超过 2,000,000 个候选格');
}
export function eachCell(b:Bounds,fn:(p:V3)=>void){validRegion(b);for(let y=b.min[1];y<b.max[1];y++)for(let z=b.min[2];z<b.max[2];z++)for(let x=b.min[0];x<b.max[0];x++)fn([x,y,z]);}
export function rotateY(p:V3,q:number):V3 {const n=((q%4)+4)%4; return n===0?[...p]:n===1?[p[2],p[1],-p[0]]:n===2?[-p[0],p[1],-p[2]]:[-p[2],p[1],p[0]];}
export function worldPoint(a:Asset,i:Instance,p:V3):V3{const v=rotateY(p.map((n,d)=>a.origin[d]+n*a.cellSize) as V3,i.rotation);return v.map((n,d)=>n+i.position[d]) as V3;}
