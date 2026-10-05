import {createHash} from 'node:crypto';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import type {Project,V3} from '../core/types';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import {civicAsset} from './civic-landmarks';
import {pavedPad} from './park-components';
export function lifeSpaceRoom(b:ArchitectureBuilder,s:any,n:number,w:number,d:number,bath=false){
 const p=b.p; s.room={dimensions:[w,2.8,d],floorY:0,entrance:[w/2,0,0],usePoints:[],seats:[],supportedPairs:[],mounts:[],sourceLegacy:'life-20261002143409-scene-'+String(n).padStart(3,'0')+'.ysvox.json',legacyLayoutRetainedInOriginalFile:true,originalFloorPlanBound:false,utilitiesBound:false};const room=s.room;
 if(!bath)pavedPad(b,s,'life-space-'+n,[0,0,w,d],0,-.28);
 const shell=civicAsset(b,'life-space-shell-'+n,id=>{const c=new CivicComponent(p,id,'真实窗洞、木梁与切角房间墙',['BUILT-003','BUILT-015','BUILT-017','BUILT-059'],{w,d,height:2.8,cutawaySides:['front','right'],doorWidth:1.4});
  // Back wall and a side window are actual structural surfaces. Two camera sides are intentionally open.
  c.box('后墙砂浆芯','mortar',0,0,d,w,2.64,.14);for(let x=.02;x<w-.02;x+=.58)for(let y=.02;y<2.62;y+=.33)c.box('后墙分层石块','wall',x,y,d-.015,Math.min(.56,w-x-.01),Math.min(.31,2.63-y),.025);
  c.box('侧窗下裙','wall',-.14,0,0,.14,.9,d);c.box('侧窗上墙','wall',-.14,2.25,0,.14,.39,d);for(const z of[0,d-1])c.box('侧窗实垛','wall',-.14,.9,z,.14,1.35,1);
  c.box('独立侧窗玻璃','glass',-.06,.94,1.06,.015,1.25,d-2.12);for(let z=1.04;z<d-1;z+=.42)c.box('窗竖木格','wood',-.1,.92,z,.13,1.33,.035);c.box('窗横木格','woodEdge',-.1,1.6,1,.13,.04,d-2);
  for(const [x,z]of[[0,0],[0,d],[w,d]]){c.box('独立墙角木柱','wood',x-.08,0,z-.08,.16,2.8,.16);for(const y of[.10,2.5]){c.box('柱头金属箍','metal',x-.095,y,z-.095,.19,.10,.19);c.pin('墙角铜销','bronze',[x-.02,y+.02,z-.10]);}}
  c.box('后墙通长承梁','woodEdge',-.08,2.64,d-.10,w+.16,.16,.20);c.box('左墙通长承梁','woodEdge',-.10,2.64,-.08,.20,.16,d+.16);
  const half=w/2;for(const [x,W]of[[0,half-.7],[half+.7,half-.7]])c.box('前墙切口踢脚','wood',x,0,-.08,W,.18,.16);for(const x of[half-.78,half+.70])c.box('真实入口侧柱截面','wood',x,0,-.08,.08,.65,.16);
  c.ports=[{id:'door',kind:'author-room-entry',position:[w/2,0,0],normal:[0,0,-1],size:[1.4,2.2,0],pitch:.02}];return c.finish();});room.shell=b.place(shell,[0,0,0],0,'room-shell');
 return room;
}
/** Canonical originals remain intact; corrected materials do not change any occupied cell. */
export function spaceFurniture(b:ArchitectureBuilder,n:number){
 const canonical=b.original('LIFE-'+String(n).padStart(3,'0'));if(n!==111)return canonical;
 return b.asset('classroom-material-111',id=>{const old=b.p.assets[canonical],a=structuredClone(old),g=new Grid(a.chunks),s=b.p.styles.yunshan,changes:Record<string,number>={};for(const[cell,m]of g.cells()){const v=cell.map((n,k)=>a.origin[k]+(n+.5)*a.cellSize);let next=m;if(m===s.fabricEdge&&v[0]>.075&&v[1]>=.55&&v[2]>.60)next=s.bookCloth;else if(v[0]<0&&m===s.fabricEdge)next=s.canvas;else if(v[0]<0&&m===s.fabric)next=s.canvas;if(next!==m){if(b.p.materials[next].solid!==b.p.materials[m].solid)throw new Error('Native material correction must preserve collision');g.set(cell,next);const key=m+'->'+next;changes[key]=(changes[key]??0)+1;}}a.id=id;a.name=old.name+' · 书封包布用途修正';a.chunks=g.serialize();a.source={kind:'assembly-derived-component',baseCatalogIds:['LIFE-111'],notCatalogMaster:true,materialOnly:true,sourceAssetId:canonical,sourceGeometrySHA256:createHash('sha256').update(JSON.stringify(geometryData(old))).digest('hex'),materialChanges:changes,reason:'Only actual book covers use bookCloth. Shoulder bag cloth is distinct; native occupancy, collision and all ports/parts remain unchanged.'};return a;});
}
