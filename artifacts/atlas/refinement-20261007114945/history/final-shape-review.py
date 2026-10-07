from pathlib import Path
import json,hashlib
root=Path('work/m001-refinement/review-03')
report=json.loads((root/'draft-preview.json').read_text());assert report['status']=='captured-draft-preview' and len(report['views'])==12
old=json.loads((root/'source-sha256.json').read_text());assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in old.items())
p=Path('src/production/refinement-finish.ts');s=p.read_text().replace("fabric:{color:'#5c818c',surfaceScale:.07,surfaceStrength:.42}","fabric:{color:'#5c818c',surfaceScale:.48,surfaceStrength:.60}").replace("fabricEdge:{color:'#4c6b76',surfaceScale:.065,surfaceStrength:.40}","fabricEdge:{color:'#4c6b76',surfaceScale:.4,surfaceStrength:.55}").replace("surface:'fabric',surfaceScale:.07,surfaceStrength:.38","surface:'fabric',surfaceScale:.48,surfaceStrength:.55");p.write_text(s)
p=Path('src/production/reference-refinement.ts');s=p.read_text().replace('Math.sin(angle)*.191','Math.sin(angle)*.214').replace('Math.cos(angle)*.191','Math.cos(angle)*.214').replace('[.056,.057,.032],.003,true)',"[.056,.057,.032],.003,p.materials[b.role('metal')].solid)")
s=s.replace("[.06,.025,.06],.003);b.box('铁脚套'", "[.06,.04,.06],.003);b.box('铁脚套'")
s=s.replace("slots.map(s=>({...s,x:s.x+.022,y:s.y+.025})),true)", "slots.map(s=>({...s,x:s.x+.022,y:s.y+.025})),p.materials[metal].solid)")
s=s.replace("[.08,.022,.08],[.4,.018,.4]", "[.08,.024,.08],[.4,.018,.4]")
s=s.replace("  return b.finish('玄关鞋柜细化", "  for(const x of[.005,.825])for(const z of[.001,.270]){b.box('柜顶深铁护角','metal',[x,.785,z],[.07,.116,.067],.0035);b.voxel('bronze',[x+.01,.85,z-.006],[.05,.04,.02]);}\n  return b.finish('玄关鞋柜细化")
s=s.replace("[x,0,.215],[.045,.24,.025]", "[x-.01,0,.215],[.065,.34,.025]").replace("for(const y of[.025,.195])b.voxel('bronze',[x+.01,y,.205],[.025,.02,.02]);", "for(const y of[.025,.305])b.voxel('bronze',[x,y,.205],[.045,.025,.02]);")
a=s.index(" if(catalogId==='LIFE-026'){");z=s.index(" if(catalogId==='LIFE-028'){",a)
s=s[:a]+''' if(catalogId==='LIFE-026'){
  for(const z of[.028,.118]){
   b.box('轨道连续顶梁','metal',[.035,.19,z],[1.73,.016,.055],.0025,0);
   for(const zz of[z,z+.043])b.box('轨道真侧壁','metal',[.035,.135,zz],[1.73,.055,.012],.002,0);
   for(const zz of[z,z+.037])b.box('下缘滑轮承唇','metal',[.035,.129,zz],[1.73,.012,.018],.002,0);
  }
  for(const x of[0,1.72]){
   b.box('完整双轨端鞍','enamel',[x,.105,.008],[.08,.127,.188],.005);
   b.box('端鞍前铁框','metal',[x+.011,.117,-.003],[.058,.097,.016],.0025);
   b.voxel('bronze',[x+.0275,.1475,-.010],[.025,.04,.015]);
  }
  for(const x of[.20,1.55]){b.box('墙面装轨座','metal',[x,.08,.19],[.065,.185,.03],.004);b.box('双轨承托连臂','metal',[x,.206,.035],[.065,.026,.178],.0035,2);b.voxel('bronze',[x+.015,.225,.18],[.035,.025,.02]);}
  for(let k=0;k<8;k++){
   const x=.15+k*.21;
   b.box('槽内滑车','bronze',[x,.15,.041],[.042,.018,.025],.002);
   b.box('滑车下伸销','metal',[x+.015,.095,.045],[.012,.06,.013],.0015);
   const y=.02,z=.027,t=.014,w=.065,h=.078;
   for(const xx of[x-.01,x-.01+w-t])b.box('真空挂环双侧','enamel',[xx,y,z],[t,h,.026],.002);
   for(const yy of[y,y+h-t])b.box('真空挂环上下','enamel',[x+.004,yy,z],[w-2*t,t,.026],.002,0);
   b.voxel('bronze',[Math.round((x-.005)/.005)*.005,.065,.02],[.01,.015,.015]);
  }
  return b.finish('双窗帘轨细化：实际双槽与承唇、加厚端鞍、滑车和独立浅色金属挂环',{dimensionsM:[1.8,.265,.23],motion:'static carriages; no motion constraints'});
 }
'''+s[z:];p.write_text(s)
p=Path('src/client/main.ts');s=p.read_text().replace('get performance(){return{lighting:',"get performance(){return{camera:{type:viewer.camera.type,position:viewer.camera.position.toArray(),target:viewer.controls.target.toArray(),quaternion:viewer.camera.quaternion.toArray(),projectionMatrix:viewer.camera.projectionMatrix.toArray()},lighting:");p.write_text(s)
