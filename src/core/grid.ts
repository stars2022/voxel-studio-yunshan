import {type V3,type Bounds,inside} from './types';
export const CHUNK=16;
export const chunkKey=(p:V3)=>p.map(v=>Math.floor(v/CHUNK)).join(',');
const local=(v:number)=>((v%CHUNK)+CHUNK)%CHUNK;
export class Grid {
  chunks=new Map<string,Uint16Array>();
  dirty=new Set<string>();
  count=0;
  constructor(serial:Record<string,number[]>={}){
    for(const [k,pairs] of Object.entries(serial)){
      if(!/^-?\d+,-?\d+,-?\d+$/.test(k)||k.split(',').some(n=>Math.abs(Number(n))>2048)||pairs.length%2||pairs.length>8192)throw new Error('损坏的体素块');
      const data=new Uint16Array(CHUNK**3);
      for(let j=0;j<pairs.length;j+=2){const n=pairs[j],m=pairs[j+1];if(!Number.isInteger(n)||n<0||n>=4096||!Number.isInteger(m)||m<1||m>65535||data[n])throw new Error('无效体素索引/材质'); data[n]=m;this.count++;}
      if(pairs.length)this.chunks.set(k,data);
    }
    if(this.count>1_000_000)throw new Error('单资产最多 1,000,000 体素');
  }
  get(p:V3){return this.chunks.get(chunkKey(p))?.[local(p[0])+local(p[1])*16+local(p[2])*256]??0;}
  set(p:V3,m:number){
    if(!p.every(v=>Number.isInteger(v)&&Math.abs(v)<=32768)||!Number.isInteger(m)||m<0||m>65535)throw new Error('体素必须使用有界整数坐标及材质 ID');
    const k=chunkKey(p),idx=local(p[0])+local(p[1])*16+local(p[2])*256;let c=this.chunks.get(k);const old=c?.[idx]??0;if(old===m)return false;
    if(!c){if(!m)return false; c=new Uint16Array(4096);this.chunks.set(k,c);}c[idx]=m;this.count+=(m?1:0)-(old?1:0);this.dirty.add(k);
    for(let d=0;d<3;d++)if(local(p[d])===0||local(p[d])===15){const v=[...p] as V3;v[d]+=local(p[d])===0?-1:1;this.dirty.add(chunkKey(v));}
    return true;
  }
  *cells(region?:Bounds):Generator<[V3,number]>{for(const [k,c] of this.chunks){const base=k.split(',').map(Number).map(v=>v*16);for(let n=0;n<4096;n++)if(c[n]){const p:V3=[base[0]+n%16,base[1]+Math.floor(n/16)%16,base[2]+Math.floor(n/256)];if(!region||inside(p,region))yield[p,c[n]];}}}
  bounds():Bounds|null{let min:V3=[Infinity,Infinity,Infinity],max:V3=[-Infinity,-Infinity,-Infinity];for(const[p]of this.cells())for(let d=0;d<3;d++){min[d]=Math.min(min[d],p[d]);max[d]=Math.max(max[d],p[d]+1);}return this.count?{min,max}:null;}
  serialize(){const out:Record<string,number[]>={};for(const[k,c]of this.chunks){const a:number[]=[];for(let i=0;i<c.length;i++)if(c[i])a.push(i,c[i]);if(a.length)out[k]=a;}return out;}
}
