import {BufferGeometry,BoxGeometry} from 'three';
export function objFromGeometry(g:BufferGeometry){const pos=g.getAttribute('position'),ind=g.getIndex();let text='# Synthetic verification fixture, units metres, Y up\n';for(let i=0;i<pos.count;i++)text+=`v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)}\n`;for(let i=0;i<(ind?.count??pos.count);i+=3)text+=`f ${[0,1,2].map(j=>(ind?ind.getX(i+j):i+j)+1).join(' ')}\n`;return text;}
export function cubeOBJ(size=1){const g=new BoxGeometry(size,size,size);g.translate(size/2,size/2,size/2);return objFromGeometry(g);}
export function adversarialOBJ(){
 let result='# Adversarial mesh: bonded duplicate, thin sheet, doorway/window apertures, detached fragment. Metres Y-up.\n',offset=0;
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,duplicate=false)=>{const g=new BoxGeometry(w,h,d);g.translate(x+w/2,y+h/2,z+d/2);const pos=g.getAttribute('position'),idx=g.index!;for(let i=0;i<pos.count;i++)result+=`v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)}\n`;for(let i=0;i<idx.count;i+=3)result+=`f ${[0,1,2].map(j=>idx.getX(i+j)+1+offset).join(' ')}\n`;if(duplicate)result+=`f ${[0,1,2].map(j=>idx.getX(j)+1+offset).join(' ')}\n`;offset+=pos.count;};
 // Frame leaves a 0.28m x 0.72m opening; 0.04m thin rear panel leaves a narrow slot.
 box(0,0,0,.22,1,.18,true);box(.50,0,0,.22,1,.18);box(.22,.72,0,.28,.28,.18);box(.22,0,0,.28,.08,.18);
 box(.05,.15,.20,.25,.7,.04);box(.36,.15,.20,.30,.7,.04);
 // Open zero-thickness triangle, connected to right plate, plus a disconnected fragment.
 result+=`v .36 .15 .24\nv .66 .15 .24\nv .66 .85 .24\nf ${offset+1} ${offset+2} ${offset+3}\n`;offset+=3;
 box(.88,.6,.12,.04,.04,.04);return result;
}
