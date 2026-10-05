import {skyState,type SkyClock} from './sky';
import {rotateY,type Project,type V3} from './types';
export type AuthorEnvironment={version:1;hour:number;weather:'clear'|'overcast'|'rain'|'fog';visibility:number;skyAssetIds:string[];clockSource:'author-preview';originalStateBound:false};
export function validAuthorEnvironment(value:unknown):value is AuthorEnvironment{
 const v=value as AuthorEnvironment;return !!v&&v.version===1&&v.clockSource==='author-preview'&&v.originalStateBound===false&&Number.isFinite(v.hour)&&v.hour>=0&&v.hour<=24&&Number.isFinite(v.visibility)&&v.visibility>=0&&v.visibility<=1&&['clear','overcast','rain','fog'].includes(v.weather)&&Array.isArray(v.skyAssetIds)&&v.skyAssetIds.length===4&&v.skyAssetIds.every(id=>typeof id==='string');
}
export function authorEnvironmentState(e:AuthorEnvironment,rotation=0){
 if(!validAuthorEnvironment(e))throw new Error('Invalid author environment');
 const clock:SkyClock={hour:e.hour,weather:e.weather==='clear'?'clear':'overcast',visibility:e.visibility},s=skyState(clock),attenuation=e.weather==='clear'?1:e.weather==='overcast'?.48:e.weather==='rain'?.3:.42;
 return{clock,sun:rotateY(s.sun,rotation),moon:rotateY(s.moon,rotation),sunIntensity:3.6*s.daylight*attenuation,moonIntensity:.35*(1-s.daylight),hemisphereIntensity:.18+1.0*s.daylight*attenuation,fillIntensity:.08+.35*s.daylight,exposure:.9+.1*s.daylight,sunColor:s.twilight>.3?'#ffd09a':'#fff2dc',moonColor:'#9ebee5',originalStateBound:false as const};
}
/** Only a single fully present environment controls author preview lighting.
 * Multiple environment templates in a gallery stay neutral and independent. */
export function activeAuthorEnvironment(p:Project){
 const instances=Object.values(p.instances),candidates=Object.values(p.assemblies??{}).filter(a=>validAuthorEnvironment(a.source?.environment)&&(a.source!.environment as AuthorEnvironment).skyAssetIds.every(id=>instances.some(i=>i.assetId===id)));
 if(candidates.length!==1)return null;const a=candidates[0],environment=a.source!.environment as AuthorEnvironment,first=instances.find(i=>i.assetId===environment.skyAssetIds[0])!,template=a.instances.find(i=>i.assetId===first.assetId)!;
 const rotation=(first.rotation-template.rotation+4)%4,position=first.position.map((n,d)=>n-rotateY(template.position,rotation)[d])as V3;
 return{assemblyId:a.id,environment,rotation,position,state:authorEnvironmentState(environment,rotation)};
}
