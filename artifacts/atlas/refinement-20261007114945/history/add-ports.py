from pathlib import Path
p=Path('work/m001-refinement/refined-m001.ts');s=p.read_text().replace('Asset,Project,V3','Asset,Project,V3,Port').replace("import {geometryData} from '../../src/core/sky';", "import {geometryData,assetBoundsM} from '../../src/core/sky';")
s=s.replace('  return{...this.original,version:', '  const result={...this.original,version:')
s=s.replace('baselineSource:this.original.source,minimumComponentM:', 'baselineSource:this.original.source,baselinePorts:this.original.ports,minimumComponentM:')
needle="}}} as Asset;\n }"
assert needle in s
s=s.replace(needle,"}}} as Asset;\n  result.ports=this.mountPorts();result.source!.dimensionsM=details.dimensionsM;result.source!.refinedBoundsM=assetBoundsM(result);return result;\n }")
pos=s.index('\n finish(features:')
s=s[:pos]+'''
 mountPorts():Port[]{
  const id=String(this.original.source!.catalogId),port=(name:string,position:V3,normal:V3,size:V3,kind='mount'):Port=>({id:name,kind,position,normal,size,pitch:this.pitch});
  const plane=(name:string,part:AuthoredMesh,axis:number,sign:number,kind:string)=>{const coords=Array.from({length:part.positions.length/3},(_,i)=>part.positions.slice(i*3,i*3+3)as V3),limit=sign<0?Math.min(...coords.map(v=>v[axis])):Math.max(...coords.map(v=>v[axis])),ps=coords.filter(v=>Math.abs(v[axis]-limit)<1e-8),lo=[0,1,2].map(k=>Math.min(...ps.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...ps.map(p=>p[k]))),normal=[0,0,0]as V3;normal[axis]=sign;return port(name,lo.map((v,k)=>(v+hi[k])/2)as V3,normal,lo.map((v,k)=>hi[k]-v)as V3,kind);};
  if(['LIFE-025','LIFE-026'].includes(id))return this.meshes.filter(m=>m.name===(id==='LIFE-025'?'深铁墙面安装板':'墙面装轨座')).map((m,k)=>plane('wall-'+k,m,2,1,'wall'));
  if(id==='LIFE-028')return[plane('ceiling',this.meshes.find(m=>m.name==='天花固定盘')!,1,1,'ceiling')];
  if(id==='LIFE-029')return[plane('wall',this.meshes.find(m=>m.name==='深铁壁灯背板')!,2,1,'wall')];
  if(id==='LIFE-030')return[plane('wall',this.meshes.find(m=>m.name==='贯通插孔金属背盒')!,2,1,'wall')];
  if(id==='LIFE-027')return this.meshes.filter(m=>m.name==='吊耳上缘').map((m,k)=>plane('hanger-'+k,m,1,1,'curtain-hanger'));
  const merged=emptyMesh('actual lower contact envelope',1,true);for(const m of this.meshes)merged.positions.push(...m.positions);
  return[plane('base',merged,1,-1,'base')];
 }
'''+s[pos:]
p.write_text(s)
