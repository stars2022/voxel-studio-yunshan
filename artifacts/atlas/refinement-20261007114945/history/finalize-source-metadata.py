from pathlib import Path
p=Path('src/production/reference-refinement.ts');s=p.read_text();s=s.replace('  result.ports=this.mountPorts();result.source!.dimensionsM=details.dimensionsM;result.source!.refinedBoundsM=assetBoundsM(result);return result;', """  result.ports=this.mountPorts();const bounds=assetBoundsM(result)!;result.source!.dimensionsM=bounds.max.map((v,k)=>v-bounds.min[k]);result.source!.refinedBoundsM=bounds;
  result.source!.limitations='作者静态参考精修候选；原游戏功能和动画未绑定，人工美术验收未完成。';
  result.source!.materialAssignmentReview={revision:2,method:'actual mixed component roles and palette-derived textile artwork',nativeRoles:[...new Set([...this.grid.cells()].map(([,id])=>id))],meshRoles:[...new Set(meshes.map(m=>m.material))],texturedRoles:meshes.flatMap(m=>m.wovenPattern?Object.values(m.wovenPattern.materials):[])};
  return result;""")
p.write_text(s)
