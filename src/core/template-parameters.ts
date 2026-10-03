// Only controls that affect this generator are advertised. Old saved documents may have
// redundant default fields; regenerate filters those before applying new, validated input.
import {architectureCatalog,architectureParameters} from '../production/architecture';
const extras:Record<string,string[]>={
 'atelier-bay':['openingWidth','openingHeight','glass'],
 'atelier-railing':[],'atelier-planter':['detail'],'atelier-lantern':[],
 wall:[],corner:['thickness'],door:['thickness','openingWidth','openingHeight'],window:['thickness','openingWidth','openingHeight','sill','glass','detail'],column:[],slab:[],steps:['steps'],stairs:['steps'],railing:['thickness','spacing'],roof:['thickness','detail'],eaves:['thickness','detail'],ridge:[],corridor:['thickness'],planter:['thickness','detail'],bed:['thickness'],table:['thickness'],cabinet:['thickness'],sofa:['thickness'],monitor:[],plant:[],
 'ref-roof':['thickness','detail'],'ref-gable':['thickness','detail'],'ref-eave':['thickness','detail'],'ref-eave-corner':['thickness','detail'],'ref-bay':['openingWidth','openingHeight','glass','detail'],'ref-balcony':['openingWidth','openingHeight','glass','detail'],'ref-bay-corner':['openingWidth','openingHeight','glass','detail'],'ref-solid-bay':['openingWidth','openingHeight','sill','detail'],'ref-gateway':['openingWidth','openingHeight','detail'],'ref-bridge':['detail'],'ref-bridge-corner':['detail'],'ref-plinth':['detail']
};
export const templateParameters=(type:string)=>type in architectureCatalog?architectureParameters(type):['width','height','depth',...(extras[type]??[])];
export const filterParameters=(type:string,params:Record<string,number>)=>Object.fromEntries(Object.entries(params).filter(([key])=>templateParameters(type).includes(key)));
export function assertParameters(type:string,params:Record<string,number>){for(const key of Object.keys(params))if(!templateParameters(type).includes(key))throw new Error(`未知或不适用的模板参数 ${key}（${type}）；支持 ${templateParameters(type).join(', ')}。`);}
