import type {Asset,Project,V3} from '../core/types';
import {makeWildlifeAsset} from './atlas-wildlife';
import {makeCareAsset} from './atlas-care';
import {makeFaunaAsset} from './atlas-fauna';
export const wildlifeScenes=['dog-collar-tag','cat-collar-tag','dog-harness','cat-harness','cow-tag']as const;
export type WildlifeScene=typeof wildlifeScenes[number];
export function wildlifeScene(base:Project,kind:WildlifeScene):Project{const p=structuredClone(base);p.name='M043 · '+kind;p.assets={};p.instances={};const s=p.styles.yunshan,place=(a:Asset,position:V3=[0,0,0])=>{p.assets[a.id]=a;p.instances[a.id]={id:a.id,assetId:a.id,name:a.name,position,rotation:0,parent:null};},cat=kind.startsWith('cat'),form=cat?'cat':'dog';
 if(kind==='cow-tag'){place(makeFaunaAsset('CHAR-315','保留原牛315','source-cow',s));place(makeWildlifeAsset('CHAR-331','独立家畜佩牌','livestock-tag',s));}
 else{place(makeCareAsset(cat?'CHAR-306':'CHAR-307',cat?'保留原猫306':'保留原犬307','source-animal',s));if(kind.endsWith('harness'))place(makeWildlifeAsset('CHAR-330','独立胸背带','harness',s,{harnessFit:form}));else{const collar=makeWildlifeAsset('CHAR-328','独立项圈','collar',s,{collarFit:form}),tag=makeWildlifeAsset('CHAR-329','独立爪印名牌','pet-tag',s),mount=collar.ports.find(p=>p.id==='tag-mount')!,top=tag.ports.find(p=>p.id==='hanger-top')!;place(collar);place(tag,mount.position.map((v,i)=>v-top.position[i])as V3);}}
 p.selection={assetId:Object.values(p.instances)[0].assetId,partId:null,region:null};return JSON.parse(JSON.stringify(p));
}
