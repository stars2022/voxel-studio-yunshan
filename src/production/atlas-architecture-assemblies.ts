import type {Project} from '../core/types';
import {nearArchitecture,roofArchitecture} from './architecture-near-assembly';
import {distantArchitecture} from './architecture-distant';
import {civicLandmarkIds,makeCivicLandmark} from './civic-landmarks';
import {civicTransportIds,makeCivicTransport} from './civic-transport';
export const architectureAssemblyIds=['BUILT-019','BUILT-020','BUILT-021','BUILT-022','BUILT-023','BUILT-024','BUILT-040','BUILT-042','BUILT-075','BUILT-076','BUILT-077','BUILT-078',...civicLandmarkIds,...civicTransportIds];
export function architectureAssemblyParameters(id:string):Record<string,unknown>{
 if(id==='BUILT-023'||id==='BUILT-079')return{program:{enum:['bank','medical'],default:'bank'}};
 if(id==='BUILT-164')return{liftStop:{enum:['bottom','top'],default:'bottom'}};
 if(id==='BUILT-042')return{layoutSeed:{enum:[7,19],default:7}};
 if(['BUILT-075','BUILT-076','BUILT-077','BUILT-078'].includes(id))return{roofWidth:{enum:['standard','wide'],default:'standard'}};
 return{};
}
export function makeArchitectureAssembly(p:Project,catalogId:string,id:string,name:string,params:Record<string,string|number>={}){
 if(!architectureAssemblyIds.includes(catalogId))throw new Error('未知建筑组合配方');const schema=architectureAssemblyParameters(catalogId) as Record<string,{enum:(number|string)[]}>;
 for(const[k,v]of Object.entries(params))if(!schema[k]||!schema[k].enum.includes(v))throw new Error('未经验证的建筑组合参数 '+k);
 if(civicLandmarkIds.includes(catalogId))return makeCivicLandmark(p,catalogId,id,name,params);
 if(civicTransportIds.includes(catalogId))return makeCivicTransport(p,catalogId,id,name,params);
 if(catalogId==='BUILT-040'||catalogId==='BUILT-042')return distantArchitecture(p,catalogId,id,name,params);
 if(Number(catalogId.slice(6))>=75)return roofArchitecture(p,catalogId,id,name,String(params.roofWidth??'standard'));
 return nearArchitecture(p,catalogId,id,name,String(params.program??'default'));
}
