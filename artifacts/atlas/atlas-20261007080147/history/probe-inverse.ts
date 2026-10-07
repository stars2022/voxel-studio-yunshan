import {productionProject} from '../../src/production/style';
import {makeFaceVariant} from '../../src/production/face-variants';
import {Grid} from '../../src/core/grid';
import {outfitHash as hash} from '../../src/production/outfit-components';
const p=productionProject('probe');
for(const id of ['CHAR-024','CHAR-025','CHAR-026']){const a=makeFaceVariant(p,id,id.toLowerCase(),id),d=a.source!.faceAtlasVariant as any,old=p.assets[d.headSourceAssetId],next=structuredClone(p.assets[d.installedHeadAssetId]),c=next.source!.faceAtlasDerivation as any,g=new Grid(next.chunks);for(const r of c.removedCells)g.set(r.cell,r.material);next.chunks=g.serialize();const m=next.meshes!.find(m=>m.name===c.faceMesh)!;m.uvs=c.originalUV;delete m.faceAtlas;console.log(id,{chunksSame:hash(next.chunks)===hash(old.chunks),meshesSame:hash(next.meshes)===hash(old.meshes),oldCount:new Grid(old.chunks).count,newCount:g.count,oldKeys:Object.keys(old.chunks),newKeys:Object.keys(next.chunks)});}
