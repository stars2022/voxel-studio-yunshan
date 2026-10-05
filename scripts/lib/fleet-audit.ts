import type {V3} from '../../src/core/types';
import type {FleetSource} from '../../src/production/fleet-components';
import {CivicAudit} from './civic-audit';
import {districtClearance} from './district-audit';
export function fleetClearance(a:CivicAudit){
 const base=districtClearance(a),s=a.assembly.source as unknown as FleetSource;
 for(const r of s.walkSamples??[]){base.checks.push(a.head(r.name,r.point,r.width));const point=[r.point[0],r.point[1]-.02,r.point[2]]as V3,hits=a.point(point,undefined,true);base.contacts.push({name:r.name,point,contacts:hits,supported:!!hits.length});}
 for(const r of s.clearBoxes??[])base.checks.push(a.clear(r.name,r.min,r.max,r.exclude??[]));
 for(const r of s.contacts??[]){const hits=a.point(r.point,r.exclude,true).filter(h=>!r.role||h.material===a.p.styles.yunshan[r.role]);base.contacts.push({name:r.name,point:r.point,contacts:hits,supported:!!hits.length});}
 for(const [i,v]of(s.driverEyes??[]).entries())base.checks.push(a.clear('actual driver eye volume '+i,[v[0]-.15,v[1]-.1,v[2]-.15],[v[0]+.15,v[1]+.25,v[2]+.15]));
 if(s.cable){const c=s.cable as any;for(const x of c.cableX){const hits=a.point([x,c.cableY,0]);if(hits.some(h=>h.instance===c.hanger))throw new Error('Real clamp hole blocked');if(!hits.some(h=>h.material===a.p.styles.yunshan.suspensionCable))throw new Error('Cable missing in clamp hole');}}
 if(s.lift)for(const x of[-2,2])for(const y of[1.65,3.5]){const hits=a.point([x,y,2.11]);for(const role of['metal','cableSheave'])if(!hits.some(h=>h.material===a.p.styles.yunshan[role]))throw new Error('Actual lift roller/guide contact missing '+x+','+y+' '+role);}
 return base;
}
