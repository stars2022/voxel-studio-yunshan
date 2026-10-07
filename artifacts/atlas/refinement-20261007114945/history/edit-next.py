from pathlib import Path
p=Path('work/m001-refinement/refined-m001.ts')
s=p.read_text().replace('bevelBox,bevelMember,roundMember','bevelBox,bevelMember,roundMember,radialUV')
s=s.replace('const lower:V3=[.16,.1,.21],elbow:V3=[.22,.30,.265],upper:V3=[.12,.455,.105];','const lower:V3=[.14,.1,.19],elbow:V3=[.06,.30,.20],upper:V3=[.32,.455,.17];')
s=s.replace("b.cylinder('灯头吊接轴','metal',[.12,.405,.105],[.12,.447,.105],.009,16);", "b.cylinder('灯头吊接轴','metal',[.32,.405,.17],[.32,.447,.17],.009,16);\n  const headStart=b.meshes.length,headCells=new Set([...b.grid.cells()].map(([v])=>v.join(',')));")
s=s.replace("[.063,.334,.034],[.144,.042,.102]", "[.053,.324,.025],[.164,.060,.120]")
s=s.replace("  b.box('底座按钮绝缘面'", "  for(let j=headStart;j<b.meshes.length;j++)b.meshes[j]=rigidMesh(b.meshes[j],[.185,0,.085]);\n  const headDetails=[...b.grid.cells()].filter(([v])=>!headCells.has(v.join(',')));for(const[v]of headDetails)b.grid.set(v,0);for(const[v,m]of headDetails)b.grid.set([v[0]+37,v[1],v[2]+17],m);\n  b.box('底座按钮绝缘面'")
s=s.replace('dimensionsM:[.28,.48,.30]','dimensionsM:[.435,.485,.30]')
s=s.replace('b.mesh(rim);',"b.mesh(radialUV(rim,[.2,.2],.2,true));")
s=s.replace("b.mesh(roundLoft('坐垫真实包边'", "b.mesh(radialUV(roundLoft('坐垫真实包边'").replace("32,p.materials[edge].solid));", "32,p.materials[edge].solid),[.2,.2],.181));")
s=s.replace("b.mesh(roundLoft('低鼓度软垫'", "b.mesh(radialUV(roundLoft('低鼓度软垫'").replace("32,p.materials[cloth].solid));", "32,p.materials[cloth].solid),[.2,.2],.177));")
s=s.replace("  return b.finish('小圆凳细化", "  for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const center:V3=[.2+Math.sin(angle)*.191,.381,.2+Math.cos(angle)*.191],foot:V3=[center[0]-.028,.352,center[2]-.012];const clip=bevelBox('座沿铁箍',b.role('metal'),[-.028,.350,.185],[.056,.057,.032],.003,true);for(let k=0;k<clip.positions.length;k+=3){const x=clip.positions[k],z=clip.positions[k+2];clip.positions[k]=.2+x*Math.cos(angle)+z*Math.sin(angle);clip.positions[k+2]=.2-x*Math.sin(angle)+z*Math.cos(angle);const nx=clip.normals[k],nz=clip.normals[k+2];clip.normals[k]=nx*Math.cos(angle)+nz*Math.sin(angle);clip.normals[k+2]=-nx*Math.sin(angle)+nz*Math.cos(angle);}b.mesh(clip);b.voxel('bronze',[Math.round((center[0]-.015)/.005)*.005,.365,Math.round((center[2]-.015)/.005)*.005],[.03,.035,.03]);}\n  return b.finish('小圆凳细化")
# Wall panel: pale painted surround, true holes remain in both the socket and backing.
s=s.replace("const poly=b.role('polymer');b.mesh", "for(const [min,size]of[[[.012,.012,-.014],[.256,.012,.017]],[[.012,.136,-.014],[.256,.012,.017]],[[.012,.024,-.014],[.010,.112,.017]],[[.10,.024,-.014],[.015,.112,.017]],[[.173,.024,-.014],[.013,.112,.017]],[[.254,.024,-.014],[.014,.112,.017]]]as [V3,V3][])b.box('实涂浅色分区底板','enamel',min,size,.0015);\n  const poly=b.role('polymer');b.mesh")
s=s.replace("  return b.finish('控制面板细化", "  b.reflectX(.28);\n  return b.finish('控制面板细化")
# Fuller wall lamp luminous volume, with only a thin real clearance inside the glass.
s=s.replace("[.041,.078,.028],[.098,.235,.07]", "[.031,.068,.024],[.119,.253,.082]")
p.write_text(s)
