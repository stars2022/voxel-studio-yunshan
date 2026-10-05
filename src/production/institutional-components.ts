import {createHash} from 'node:crypto';
import {Grid} from '../core/grid';
import {geometryData} from '../core/sky';
import {ArchitectureBuilder} from './architecture-near-assembly';
import {CivicComponent} from './civic-components';
import {publicFurniture} from './public-space-components';

export function institutionalFurniture(b:ArchitectureBuilder,n:number){
 const original=publicFurniture(b,n);if(![147,148,151].includes(n))return original;
 return b.asset('institution-material-'+n,id=>{const old=b.p.assets[original],a=structuredClone(old),g=new Grid(a.chunks),s=b.p.styles.yunshan,changes:Record<string,number>={};for(const[cell,m]of g.cells()){const next=m===s.energy?s.opticsGlow:m===s.warm?s.lightCore:m;if(next!==m){if(b.p.materials[next].solid!==b.p.materials[m].solid)throw new Error('Optical derivative changes collision');g.set(cell,next);const key=m+'->'+next;changes[key]=(changes[key]??0)+1;}}a.id=id;a.name=old.name+' · 独立光学用途';a.chunks=g.serialize();a.source={kind:'assembly-derived-component',notCatalogMaster:true,baseCatalogIds:['LIFE-'+n],materialOnly:true,sourceAssetId:original,sourceGeometrySHA256:createHash('sha256').update(JSON.stringify(geometryData(old))).digest('hex'),materialChanges:changes,reason:'Only actual optical strips and lamp cores use opticsGlow/lightCore; original state remains unbound, zero emission. Every native cell and geometry field retained.'};return a;});
}
export function institutionalBench(b:ArchitectureBuilder){
 b.original('LIFE-154');return b.asset('institution-continuous-three-seat-bench',id=>{const c=new CivicComponent(b.p,id,'三席连座与连续倾斜靠背',['LIFE-154'],{originalRetained:true,seats:3,seatTopM:.48,alternativeContinuousUpholstery:true});
 for(const x of[.04,.65,1.26,1.87])for(const z of[.06,.58]){c.box('独立木座腿','wood',x-.035,0,z-.035,.07,.69,.07);c.box('地脚金属套','metal',x-.04,0,z-.04,.08,.06,.08);}for(const z of[.06,.58])c.box('贯通下枨','wood',.04,.29,z-.025,1.83,.055,.05);
 for(let j=0;j<3;j++){const x=.10+j*.61;c.box('实承座板','wood',x,.34,.06,.49,.05,.53);c.box('独立布垫包边','fabricEdge',x,.39,.055,.49,.075,.50);c.box('连续布座面','fabric',x+.012,.402,.062,.466,.078,.48);c.beam('连续后倾软靠','fabric',[x+.245,.49,.535],[x+.245,.93,.635],.47,.075);for(const xx of[x-.035,x+.505])c.box('实接扶手','woodEdge',xx,.655,.045,.04,.045,.57);}
 c.pin('最小连座销','bronze',[.04,.34,.06]);return c.finish();});
}
export function institutionalVault(b:ArchitectureBuilder){
 b.original('LIFE-144');return b.asset('institution-closed-record-vault',id=>{const c=new CivicComponent(b.p,id,'静态密闭档案保险柜及连续圆形锁盘',['LIFE-144'],{authorAlternative:true,interior:[.14,.10,.12,2.06,2.16,.82],doorState:'closed-static',securitySimulation:false});
 for(const x of[0,2.06])c.box('保险柜钢侧壁','metal',x,0,0,.14,2.3,.9);for(const y of[0,2.16])c.box('保险柜顶底钢板','metal',0,y,0,2.2,.14,.9);c.box('后承钢板','metal',.14,.14,.82,1.92,2.02,.08);c.box('闭合涂装钢门','enamel',.13,.14,0,1.94,2.02,.12);for(const y of[.42,1.70])c.box('静态实接合页','metalBright',.08,y,-.025,.12,.28,.18);
 c.tube('连续圆形锁盘','metalBright',[[1.10,1.17,-.04],[1.10,1.17,.02]],.53,40);c.tube('锁轴中心','bronze',[[1.10,1.17,-.24],[1.10,1.17,-.02]],.065,16);for(const dx of[-1,1])for(const dy of[-1,1])c.beam('连续锁柄斜臂','metal',[1.10,1.17,-.20],[1.10+dx*.26,1.17+dy*.26,-.20],.045);c.pin('最小门框销','bronze',[.04,.22,.02]);return c.finish();});
}
export function institutionalStage(b:ArchitectureBuilder){
 b.original('LIFE-176');return b.asset('institution-stage-ramp',id=>{const c=new CivicComponent(b.p,id,'整体木台、独立承脚与连续坡道',['LIFE-176'],{originalThreeStepModuleRetained:true,stageTopM:.42,rampRiseM:.42,rampRunM:2.4,authorAlternative:true,automaticAccessibilityClaim:false});
 c.box('舞台连续木承面','wood',.6,.34,5.2,8,.08,3.4);for(const x of[.65,2.6,4.6,6.6,8.45])for(const z of[5.25,6.8,8.45]){c.box('舞台实接承腿','metal',x,0,z,.1,.34,.1);c.box('独立钢脚板','metal',x-.04,0,z-.04,.18,.04,.18);}for(const z of[5.2,8.5])c.box('台下前后实梁','metal',.6,.25,z,8,.09,.1);
 c.surface('连续木坡道','wood',[.65,1.85],[2.8,5.2],(_,z)=>(z-2.8)*.42/2.4,.12);for(const z of[3.6,4.4,5.1])for(const x of[.69,1.73])c.box('坡底实接承脚','metal',x,0,z,.08,(z-2.8)*.42/2.4-.08,.08);
 for(const x of[.66,1.84]){c.beam('连续坡侧扶手','woodEdge',[x,.90,2.85],[x,1.32,5.2],.045);for(const z of[2.85,4.0,5.17])c.box('坡栏实接柱','metal',x-.02,(z-2.8)*.42/2.4-.04,z-.02,.04,.98,.04);}
 c.pin('最小舞台锁销','bronze',[.66,.36,5.24]);c.pin('最小坡道销','bronze',[.70,.22,4.2]);return c.finish();});
}
