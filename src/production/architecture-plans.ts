import type {RoofForm} from './architecture-roofs';
export type Cell=[number,number];
export type RoofPlacement={form:RoofForm;x:number;z:number;w:number;d:number;y:number};
export type BuildingPlan={family:string;variant:string;nx:number;nz:number;lower:Cell[];upper:Cell[];roofs:RoofPlacement[];fixture:string;purposePoints:[number,number,number][];openLower?:boolean;tallHall?:boolean};
const rect=(x:number,z:number,w:number,d:number):Cell[]=>Array.from({length:w*d},(_,i)=>[x+i%w,z+Math.floor(i/w)]);
const unique=(...a:Cell[][]):Cell[]=>[...new Map(a.flat().map(c=>[c.join(','),c])).values()];
const roof=(form:RoofForm,x:number,z:number,w:number,d:number,level:number):RoofPlacement=>({form,x:x*3.2,z:z*3.2,w:w*3.2,d:d*3.2,y:level*3.2+.2});
/** One source of floor occupancy for near buildings, six-family studies and distant bundles. */
export function architecturePlan(id:string,variant='default'):BuildingPlan{
 if(id==='BUILT-019')return{family:'residential',variant,nx:6,nz:4,lower:unique(rect(0,0,2,4),rect(4,0,2,4),rect(2,2,2,2)),upper:unique(rect(2,2,4,2),rect(5,0,1,2)),roofs:[roof('gable',0,0,2,4,1),roof('gable',4,0,1,2,1),roof('gable',2,2,4,2,2),roof('flat',5,0,1,2,2)],fixture:'LIFE-024',purposePoints:[[1.6,.2,1.6],[14.4,.2,1.6]]};
 if(id==='BUILT-020')return{family:'market',variant,nx:6,nz:5,lower:unique(rect(0,3,6,2),[[0,0],[2,0],[4,0]]),upper:unique(rect(0,3,6,2),rect(5,0,1,3)),roofs:[...([0,2,4].map(x=>roof('gable',x,0,1,1,1))),roof('gable',0,3,6,2,2),roof('flat',5,0,1,3,2),roof('flat',0,1,1,2,1)],fixture:'LIFE-064',purposePoints:[[1.6,.2,1.6],[8,.2,1.6],[14.4,.2,1.6]]};
 if(id==='BUILT-021')return{family:'workshop',variant,nx:6,nz:4,lower:rect(0,0,6,4),upper:unique(rect(0,3,6,1),rect(5,0,1,3)),roofs:Array.from({length:3},(_,j)=>roof('industrial',j*2,0,2,4,2)),fixture:'LIFE-084',purposePoints:[[3.2,.2,3.2],[9.6,.2,6.4]],tallHall:true};
 if(id==='BUILT-022')return{family:'civic',variant,nx:6,nz:4,lower:unique(rect(0,0,2,4),rect(4,0,2,4),rect(2,3,2,1),rect(2,0,2,1)),upper:unique(rect(0,3,6,1),rect(5,0,1,3)),roofs:[roof('hip',0,0,2,3,1),roof('hip',4,0,1,3,1),roof('gable',2,0,2,1,1),roof('hip',0,3,6,1,2),roof('flat',5,0,1,3,2)],fixture:'LIFE-142',purposePoints:[[3.2,.2,3.2],[8,.2,11.2]]};
 if(id==='BUILT-023'&&variant==='medical')return{family:'finance-medical',variant,nx:6,nz:5,lower:unique(rect(0,0,2,5),rect(4,1,2,3),rect(2,2,2,1)),upper:unique(rect(4,1,2,3),rect(5,0,1,1)),roofs:[roof('flat',0,0,2,5,1),roof('flat',2,2,2,1,1),roof('flat',4,1,2,3,2),roof('flat',5,0,1,1,2)],fixture:'LIFE-123',purposePoints:[[1.6,.2,1.6],[14.4,.2,4.8]]};
 if(id==='BUILT-023')return{family:'finance-medical',variant:'bank',nx:6,nz:4,lower:rect(0,0,6,4),upper:rect(4,0,2,4),roofs:[roof('flat',0,0,4,4,1),roof('flat',4,0,2,4,2)],fixture:'LIFE-151',purposePoints:[[3.2,.2,3.2],[9.6,.2,6.4]]};
 if(id==='BUILT-024')return{family:'waterfront',variant,nx:6,nz:3,lower:[],upper:unique(rect(0,2,6,1),rect(5,0,1,2)),roofs:[roof('gable',0,2,6,1,2),roof('flat',5,0,1,2,2),roof('flat',0,0,1,2,1),roof('flat',4,0,1,2,1)],fixture:'LIFE-188',purposePoints:[[4.8,.2,3.2],[11.2,.2,3.2]],openLower:true};
 throw new Error('未知建筑平面 '+id);
}
export const architectureFamilies=['BUILT-019','BUILT-020','BUILT-021','BUILT-022','BUILT-023','BUILT-024'];
