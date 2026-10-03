import test from 'node:test';
import assert from 'node:assert/strict';
import {newProject} from '../src/core/materials';
import {Grid} from '../src/core/grid';
import {checkGeometry} from '../src/core/checks';
import {worldPoint,type Project,type V3,type Bounds} from '../src/core/types';
function add(p:Project,id:string,pitch:number,cells:[V3,number][],position:V3=[0,0,0],rotation=0,origin:V3=[0,0,0]){const g=new Grid();for(const[v,m]of cells)g.set(v,m);p.assets[id]={id,name:id,version:1,category:'base',cellSize:pitch,origin,chunks:g.serialize(),parts:[],openings:[],ports:[]};p.instances[id]={id,assetId:id,name:id,position,rotation,parent:null};}
/** Deliberately enumerates the small reference grid, independently of interval merging. */
function enumerate(p:Project){const pitch=Math.min(...Object.values(p.assets).map(a=>a.cellSize)),cells=new Map<string,Set<string>>();for(const i of Object.values(p.instances)){const a=p.assets[i.assetId];for(const[v,m]of new Grid(a.chunks).cells()){if(!p.materials[m].solid)continue;const p0=worldPoint(a,i,v),p1=worldPoint(a,i,v.map(x=>x+1) as V3),min=p0.map((n,d)=>Math.round(Math.min(n,p1[d])/pitch)),max=p0.map((n,d)=>Math.round(Math.max(n,p1[d])/pitch));for(let x=min[0];x<max[0];x++)for(let y=min[1];y<max[1];y++)for(let z=min[2];z<max[2];z++){const k=[x,y,z].join(',');if(!cells.has(k))cells.set(k,new Set());cells.get(k)!.add(i.id);}}}return{pitch,cells};}

test('row intervals agree with enumerated cells for mixed pitch, negative origins, all rotations, three-way overlaps and transparent material',()=>{
 let seed=1927;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let sample=0;sample<40;sample++){
  const p=newProject();p.materials[99]={...p.materials[1],id:99,name:'non-solid glass',category:'glass',solid:false};
  for(let i=0;i<3;i++){const cells:[V3,number][]=[[[0,0,0],1]];for(let j=0;j<18;j++)cells.push([[Math.floor(rand()*5)-2,Math.floor(rand()*4)-1,Math.floor(rand()*5)-2],rand()<.2?99:1]);add(p,'i'+i,[.01,.02,.04][i],cells,[(sample%2)*.01,0,0],(sample+i)%4,[0,0,(sample%3)*.01]);}
  const clear={name:'asymmetric fractional region',min:[-.023,-.006,-.027] as V3,max:[.037,.041,.016] as V3},r=checkGeometry(p,[clear]),ref=enumerate(p);assert.equal(r.collisionGrids.length,1);assert.equal(r.occupiedCollisionCells,ref.cells.size);
  const pairs=new Map<string,number>(),contacts=Object.fromEntries(Object.keys(p.instances).map(id=>[id,new Set<string>()])),supported=new Set<string>(),solidOwners=new Set<string>();let cleared=0;const blockers=new Set<string>();
  for(const[key,set]of ref.cells){const ids=[...set].sort(),v=key.split(',').map(Number);for(const id of ids){solidOwners.add(id);if(v[1]<=0)supported.add(id);for(const below of ref.cells.get([v[0],v[1]-1,v[2]].join(','))??[])if(id!==below){supported.add(id);contacts[id].add(below);}}for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){const k=[ids[a],ids[b]].join('/');pairs.set(k,(pairs.get(k)??0)+1);}if(v.every((n,d)=>(n+.5)*ref.pitch>=clear.min[d]&&(n+.5)*ref.pitch<clear.max[d])){cleared++;for(const id of ids)blockers.add(id);}}
  assert.deepEqual(r.collisions.map(c=>[c.instances.join('/'),c.cells]).sort(),[...pairs].sort());assert.deepEqual(r.unsupported.sort(),[...solidOwners].filter(id=>!supported.has(id)).sort());for(const id of Object.keys(contacts))assert.deepEqual(r.contacts[id].sort(),[...contacts[id]].sort());assert.equal(r.clearances[0].occupiedCells,cleared);assert.deepEqual(r.clearances[0].blockedBy.sort(),[...blockers].sort());
 }
});

test('coarse solids keep their exact volume above the old cubic budget, with supported fine detail and detectable one-cell collisions',()=>{
 const p=newProject(),coarse:[V3,number][]=[];for(let x=0;x<10;x++)for(let y=0;y<10;y++)for(let z=0;z<10;z++)coarse.push([[x,y,z],1]);add(p,'coarse',.1,coarse);add(p,'fine',.005,[[[0,0,0],1]],[.2,1,.2]);
 const clear={name:'fine obstacle',min:[.2,1,.2] as V3,max:[.205,1.005,.205] as V3};let r=checkGeometry(p,[clear]);assert.equal(r.occupiedCollisionCells,8_000_001);assert.deepEqual(r.collisions,[]);assert.deepEqual(r.unsupported,[]);assert.deepEqual(r.contacts.fine,['coarse']);assert.equal(r.clearances[0].occupiedCells,1);
 p.instances.fine.position[1]=.995;r=checkGeometry(p);assert.equal(r.occupiedCollisionCells,8_000_000);assert.equal(r.collisions[0].cells,1);assert.ok(Math.abs(r.collisions[0].volumeM3-.005**3)<1e-20);
});

test('opening queries preserve empty/native solid/non-solid counts and find external blockers after rotation',()=>{
 const p=newProject();p.materials[99]={...p.materials[1],id:99,name:'glass',category:'glass',solid:false};add(p,'frame',.02,[[[0,0,0],1],[[1,0,0],99]],[.04,0,.02],1);p.assets.frame.openings=[{min:[0,0,0],max:[3,1,1]}];add(p,'blocker',.01,[[[0,0,0],1]],[.04,0,-.03]);const r=checkGeometry(p),opening=r.openings[0];assert.equal(opening.ownSolidCells,1);assert.equal(opening.nonCollisionCells,1);assert.equal(opening.emptyCells,1);assert.deepEqual(opening.blockedBy,['blocker']);
});

test('unbounded empty clearances allocate no voxels, while excessive row expansion is rejected before allocation',()=>{
 const p=newProject();add(p,'large',100,[[[0,0,0],1]]);add(p,'tiny',.005,[[[0,0,0],1]]);assert.throws(()=>checkGeometry(p),/行区间展开项/);
 const empty=newProject();assert.equal(checkGeometry(empty,[{name:'large empty area',min:[-1e6,-1e6,-1e6],max:[1e6,1e6,1e6]}]).clearances[0].occupiedCells,0);
});


test('fractional clearance boundaries match the exact JS cell-centre comparison, including representational neighbours',()=>{
 const p=newProject();add(p,'row',.1,Array.from({length:8},(_,x):[V3,number]=>[[x-4,0,0],1]));
 for(const boundary of [.15,.15000000000000002,-.15,-.15000000000000002,.25,.25000000000000006])for(const lower of [true,false]){const min:V3=[lower?boundary:-1,0,0],max:V3=[lower?1:boundary,.1,.1],r=checkGeometry(p,[{name:'boundary',min,max}]);const expected=Array.from({length:8},(_,x)=>(x-4+.5)*.1).filter(x=>x>=min[0]&&x<max[0]).length;assert.equal(r.clearances[0].occupiedCells,expected,JSON.stringify({boundary,lower}));}
});
