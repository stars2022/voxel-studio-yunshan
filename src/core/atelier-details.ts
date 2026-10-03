import {voxelIndex} from './voxel-shapes';
import type {Asset,V3} from './types';
import {generateAtelierJoinery} from './atelier-joinery';
import {generateAtelierPlanter} from './atelier-planter';

export function generateAtelierDetail(id:string,name:string,type:string,p:Record<string,number>,s:number,m:Record<string,number>,styleName='atelier'):Asset{
 if(Object.values(p).some(n=>!Number.isFinite(n)||n<0||n>50))throw new Error('细部参数须为 0–50 的有限数。');
 const defaults:Record<string,V3>={'atelier-railing':[1.8,.95,.2],'atelier-planter':[1.2,1,.6],'atelier-lantern':[.22,.7,.26]};
 const q=(n:number)=>voxelIndex(n,s),snap=(n:number)=>q(n)*s,dims=defaults[type].map((n,i)=>snap(p[['width','height','depth'][i]]??n)) as V3,[W,H,D]=dims;
 if(!dims.every(n=>Number.isFinite(n)&&n>0)||s>.025)throw new Error('细部模板需要不大于 0.025m 的格距和正尺寸。');
 if(q(W+.2)*q(H+.2)*q(D+.2)>2_000_000)throw new Error('细部模板超过候选格预算。');
 if(type==='atelier-railing'&&(W<.6||H<.6||D<.16)||type==='atelier-planter'&&(W<.7||H<.7||D<.4)||type==='atelier-lantern'&&(W<.16||H<.5||D<.2))throw new Error('细部模板尺寸不足，无法保留截面。');
 for(const k of['stone','wall','wood','metal','wallAlt','woodAlt','energy','warm','trim','bronze','cavity','amber','leaf','leafAlt','flower','soil'])if(!m[k])throw new Error('细部模板需要 atelier 材质角色：'+k);
 if(type==='atelier-planter')return generateAtelierPlanter(id,name,p,dims,s,m,styleName);
 return generateAtelierJoinery(id,name,type,dims,s,m,styleName);
}
