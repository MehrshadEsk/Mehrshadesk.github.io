/* Four original, unlabeled scientific sculptures in true 3D.
 * Locally vendored Three.js r180 (MIT). Geometry, topology, materials and motion
 * are authored here; there are no external models, textures, fonts or requests.
 * These are conceptual visuals, never measured experimental results.
 */
import * as T from './assets/vendor/three/three.module.min.js';
import { ResearchSoftwareRenderer } from './research-software-renderer.js';
const TAU=Math.PI*2;
const media=matchMedia('(prefers-reduced-motion: reduce)');
const instances=new Set();
let animation=0;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const v3=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function colors(){return document.documentElement.dataset.theme==='dark'
  ? {dark:0x304958,metal:0xa5bac9,pearl:0xced9df,teal:0x71b7bb,brass:0xd3ac76,line:0x639199,floor:0x294858,ink:0x82b3c3,bg:0x101c25}
  : {dark:0x263f52,metal:0x657e8d,pearl:0xdbe3e7,teal:0x397f8c,brass:0xb58d59,line:0x6c999d,floor:0xbfcdd3,ink:0x4c7c91,bg:0xf8f8f6};}
const geometry={
  sphere:new T.SphereGeometry(1,14,10),
  smallSphere:new T.SphereGeometry(1,9,7),
  cylinder:new T.CylinderGeometry(1,1,1,12),
  box:new T.BoxGeometry(1,1,1)
};
function material(model,role,extra={}){
  const m=new T.MeshStandardMaterial({color:model.C[role],roughness:.42,metalness:.38,...extra});
  model.materials.push({m,role});return m;
}
function lineMaterial(model,role,opacity=.3,extra={}){
  const m=new T.LineBasicMaterial({color:model.C[role],transparent:true,opacity,depthWrite:false,...extra});
  model.materials.push({m,role});return m;
}
function mesh(model,geo,mat,p=v3(),s=v3(1,1,1),parent=model.group){
  const m=new T.Mesh(geo,mat);m.position.copy(p);m.scale.copy(s);m.castShadow=!model.compact;m.receiveShadow=!model.compact;parent.add(m);return m;
}
function ball(model,p,r,mat,parent=model.group){return mesh(model,geometry.sphere,mat,p,v3(r,r,r),parent);}
function cube(model,p,s,mat,parent=model.group){return mesh(model,geometry.box,mat,p,s,parent);}
function rod(model,a,b,r,mat,parent=model.group){
  const mid=a.clone().add(b).multiplyScalar(.5),length=a.distanceTo(b);
  const m=mesh(model,geometry.cylinder,mat,mid,v3(r,length,r),parent);
  m.quaternion.setFromUnitVectors(v3(0,1,0),b.clone().sub(a).normalize());return m;
}
function polyline(model,points,mat,parent=model.group){
  const line=new T.Line(new T.BufferGeometry().setFromPoints(points),mat);parent.add(line);return line;
}
function lineSegments(model,segments,mat){
  const array=[];segments.forEach(([a,b])=>array.push(...a.toArray(),...b.toArray()));
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(array,3));
  const line=new T.LineSegments(geo,mat);model.group.add(line);return line;
}
function arc(a,b,lift=.35){
  const middle=a.clone().add(b).multiplyScalar(.5);middle.y+=lift;
  return new T.QuadraticBezierCurve3(a,middle,b);
}
function ring(model,center,r,mat,segments=96){
  const points=Array.from({length:segments+1},(_,i)=>v3(center.x+Math.cos(i/segments*TAU)*r,center.y,center.z+Math.sin(i/segments*TAU)*r));
  return polyline(model,points,mat);
}
function instanceMesh(model,geo,mat,items){
  const m=new T.InstancedMesh(geo,mat,items.length),dummy=new T.Object3D();
  items.forEach((it,i)=>{
    dummy.position.copy(it.p);dummy.rotation.set(0,it.yaw||0,0);
    dummy.scale.copy(it.s||v3(it.r||1,it.r||1,it.r||1));dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
    if(it.color!==undefined)m.setColorAt(i,new T.Color(it.color));
  });
  m.castShadow=!model.compact;m.receiveShadow=!model.compact;model.group.add(m);return m;
}
function particles(model,paths,{count=64,speed=.15,r=.037,role='teal',phase=0}={}){
  const mat=material(model,role,{roughness:.2,metalness:.15,emissive:model.C[role],emissiveIntensity:.35});
  const mesh=new T.InstancedMesh(geometry.smallSphere,mat,count),dummy=new T.Object3D();
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);model.group.add(mesh);
  return time=>{
    for(let i=0;i<count;i++){
      const curve=paths[i%paths.length],u=(time*speed+i*.61803398875+phase)%1;
      dummy.position.copy(curve.getPoint(u));
      const size=r*(.65+.35*Math.sin(u*Math.PI));dummy.scale.setScalar(size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
  };
}
function surface(model,r=5){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const g=canvas.getContext('2d'),gradient=g.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.4,'rgba(255,255,255,.45)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gradient;g.fillRect(0,0,128,128);
  const mat=new T.MeshBasicMaterial({color:model.C.floor,map:new T.CanvasTexture(canvas),transparent:true,opacity:.38,depthWrite:false});
  model.materials.push({m:mat,role:'floor'});
  const geo=new T.CircleGeometry(r,64);geo.userData.softGround=true;
  const floor=mesh(model,geo,mat,v3(0,-.12,0));floor.rotation.x=-Math.PI/2;floor.castShadow=false;floor.receiveShadow=false;
  return floor;
}
function chip(model,center,{w=1.4,h=.28,d=1.4}={}){
  const dark=material(model,'dark'),metal=material(model,'metal'),pearl=material(model,'pearl'),brass=material(model,'brass',{roughness:.32,metalness:.7});
  const group=new T.Group();group.position.copy(center);model.group.add(group);
  cube(model,v3(0,0,0),v3(w,h,d),dark,group);
  cube(model,v3(0,h*.7,0),v3(w*.76,h*.45,d*.76),pearl,group);
  cube(model,v3(0,h*.96,0),v3(w*.49,.028,d*.49),metal,group);
  for(let i=0;i<8;i++){
    const a=-.4+i*.8/7;
    for(const sign of [-1,1]){
      cube(model,v3(a*w,-h*.1,sign*(d/2+.08)),v3(w*.035,.045,.18),brass,group);
      cube(model,v3(sign*(w/2+.08),-h*.1,a*d),v3(.18,.045,d*.035),brass,group);
    }
  }
  return group;
}

/* Dense, clustered sensor field. The topology is hierarchical: sensor-to-relay,
   relay-to-cluster-head, then a spanning backbone to the sink. */
function wireless(model){
  const rnd=random(9071),C=model.C;
  surface(model,5.1);
  const body=material(model,'dark'),cap=material(model,'pearl'),led=material(model,'teal',{emissive:C.teal,emissiveIntensity:.2});
  const count=model.compact?12:28,clusters=6,nodes=[],heads=[],links=[],localPaths=[];
  const clusterColors=[C.teal,C.ink,C.metal,C.teal,C.ink,C.brass];
  const footprints=[];
  for(let k=0;k<clusters;k++){
    const angle=k*TAU/clusters+.25;
    const center=v3(Math.cos(angle)*3.15,0,Math.sin(angle)*3.15*.86);
    heads.push(center.clone().add(v3(0,.63,0)));
    const discMat=new T.MeshBasicMaterial({color:clusterColors[k],transparent:true,opacity:.045,depthWrite:false,side:T.DoubleSide});
    const disc=mesh(model,new T.CircleGeometry(1.42,64),discMat,center.clone().add(v3(0,-.105,0)));disc.rotation.x=-Math.PI/2;disc.castShadow=false;
    ring(model,center.clone().add(v3(0,-.1,0)),1.42,lineMaterial(model,'line',.25));
    const wave=ring(model,center.clone().add(v3(0,.02,0)),1,lineMaterial(model,'teal',.25));footprints.push({wave,center,k});
    const group=[];
    for(let j=0;j<count;j++){
      const a=j*2.39996323+k,r=.25+Math.sqrt((j+.5)/count)*1.17;
      const p=v3(center.x+Math.cos(a)*r,0,center.z+Math.sin(a)*r);
      group.push(p);nodes.push({p,k});
    }
    const top=center.clone().add(v3(0,.29,0));
    mesh(model,geometry.cylinder,cap,center.clone().add(v3(0,.19,0)),v3(.2,.42,.2));
    mesh(model,geometry.cylinder,body,top,v3(.16,.17,.16));
    rod(model,top.clone().add(v3(0,.05,0)),heads[k],.018,body);
    ball(model,heads[k],.047,led);
    const relays=group.filter((_,i)=>i%7===0);
    group.forEach((p,j)=>{
      const relay=relays.reduce((best,q)=>p.distanceToSquared(q)<p.distanceToSquared(best)?q:best,relays[0]);
      const target=j%7===0?heads[k]:relay.clone().add(v3(0,.17,0));
      const start=p.clone().add(v3(0,.15,0));
      const curve=arc(start,target,j%7===0?.2:.08);
      links.push(...curve.getPoints(12).slice(1).map((q,i)=>[curve.getPoint(i/12),q]));
      if(j%3===0)localPaths.push(curve);
      const nearest=group.map((q,i)=>({q,i,d:p.distanceToSquared(q)})).filter(q=>q.i!==j).sort((a,b)=>a.d-b.d)[0];
      if(nearest&&nearest.i>j)links.push([start,nearest.q.clone().add(v3(0,.15,0))]);
    });
  }
  const bodies=nodes.map(({p})=>({p:p.clone().add(v3(0,.065,0)),s:v3(.063,.13,.063)}));
  instanceMesh(model,geometry.cylinder,body,bodies);
  instanceMesh(model,geometry.cylinder,cap,nodes.map(({p})=>({p:p.clone().add(v3(0,.135,0)),s:v3(.065,.015,.065)})));
  instanceMesh(model,geometry.smallSphere,led,nodes.map(({p,k})=>({p:p.clone().add(v3(0,.15,0)),r:.024,color:clusterColors[k]})));
  lineSegments(model,links,lineMaterial(model,'line',model.compact?.26:.22));
  chip(model,v3(0,.34,0),{w:1.35,h:.32,d:1.35});
  const sink=v3(0,.72,0),backbone=[];
  heads.forEach((p,k)=>{
    const to=k%2===0?sink:heads[k-1];const path=arc(p,to,.6);backbone.push(path);
    polyline(model,path.getPoints(32),lineMaterial(model,k%2?'line':'teal',.55));
    if(k%2===0){const redundant=arc(p,heads[(k+2)%6],.32);polyline(model,redundant.getPoints(24),lineMaterial(model,'metal',.17));}
  });
  const localTraffic=particles(model,localPaths,{count:model.compact?42:112,speed:.16,r:.031});
  const trunkTraffic=particles(model,backbone,{count:model.compact?15:30,speed:.11,r:.047,role:'brass'});
  model.update=t=>{
    localTraffic(t);trunkTraffic(t);
    footprints.forEach(({wave,center,k})=>{
      const u=(t*.105+k*.17)%1,s=.35+u*1.05;
      wave.position.set(center.x*(1-s),0,center.z*(1-s));wave.scale.set(s,1,s);wave.material.opacity=.25*(1-u);
    });
  };
  model.camera={position:v3(9,8.1,10.5),target:v3(0,.1,0),fov:37};
}

/* Radio-access infrastructure: three tri-sector masts, moving user equipment,
   hysteresis-based handover, and physical backhaul to an inference processor. */
function ran(model){
  const C=model.C,rnd=random(353),metal=material(model,'metal'),pearl=material(model,'pearl'),dark=material(model,'dark');
  const teal=material(model,'teal',{emissive:C.teal,emissiveIntensity:.12});
  surface(model,5.25);
  const positions=[v3(-3,0,-1.8),v3(2.65,0,-2.1),v3(.9,0,3.1)],tips=[];
  const rings=[];
  positions.forEach((p,k)=>{
    cube(model,p.clone().add(v3(0,.04,0)),v3(.7,.15,.7),pearl);
    const height=2.2+(k===1?.35:0),tip=p.clone().add(v3(0,height,0));tips.push(tip);
    for(let j=0;j<3;j++){
      const a=j*TAU/3,base=p.clone().add(v3(Math.cos(a)*.27,.14,Math.sin(a)*.27));
      rod(model,base,tip,.024,metal);
      for(let level=0;level<5;level++){
        const yy=.3+level*.34,frac=1-yy/height;
        const a1=p.clone().add(v3(Math.cos(a)*.27*frac,yy,Math.sin(a)*.27*frac));
        const a2=p.clone().add(v3(Math.cos(a+TAU/3)*.27*(1-(yy+.3)/height),yy+.3,Math.sin(a+TAU/3)*.27*(1-(yy+.3)/height)));
        rod(model,a1,a2,.013,metal);
      }
      const panelCenter=p.clone().add(v3(Math.cos(a)*.16,height-.24,Math.sin(a)*.16));
      const panel=cube(model,panelCenter,v3(.18,.68,.09),pearl);panel.rotation.y=-a+Math.PI/2;
      const strip=cube(model,panelCenter.clone().add(v3(Math.cos(a)*.052,0,Math.sin(a)*.052)),v3(.025,.51,.025),teal);
      const sector=new T.Mesh(new T.CircleGeometry(1.95,48,a-.9,1.8),new T.MeshBasicMaterial({color:k===1?C.brass:C.teal,transparent:true,opacity:.042,side:T.DoubleSide,depthWrite:false}));
      sector.rotation.x=-Math.PI/2;sector.position.copy(p).add(v3(0,-.105,0));model.group.add(sector);
    }
    ball(model,tip.clone().add(v3(0,.12,0)),.046,teal);
    for(let j=0;j<2;j++)rings.push({mesh:ring(model,p.clone().add(v3(0,-.085,0)),1,lineMaterial(model,'teal',.2)),p,phase:k*.2+j*.5});
  });
  const buildings=[];
  for(let i=0;i<(model.compact?12:26);i++){
    const a=rnd()*TAU,r=3+rnd()*1.8;
    const p=v3(Math.cos(a)*r,0,Math.sin(a)*r),h=.15+rnd()*.55;
    buildings.push({p:p.clone().add(v3(0,h/2-.09,0)),s:v3(.2+rnd()*.15,h,.2+rnd()*.2)});
  }
  instanceMesh(model,geometry.box,material(model,'pearl',{roughness:.85,metalness:.1}),buildings);
  chip(model,v3(-.25,.22,-.1),{w:1.3,h:.22,d:1.15});
  const hub=v3(-.25,.48,-.1),backhaul=tips.map(p=>arc(p,hub,.4));
  backhaul.forEach(path=>polyline(model,path.getPoints(40),lineMaterial(model,'teal',.36)));
  const data=particles(model,backhaul,{count:model.compact?12:24,speed:.13,r:.04,role:'brass'});
  const users=[];
  for(let i=0;i<(model.compact?9:18);i++){
    const phone=new T.Group();model.group.add(phone);
    cube(model,v3(0,.12,0),v3(.095,.23,.028),dark,phone);
    cube(model,v3(0,.13,.017),v3(.072,.17,.007),teal,phone);
    const conn=new T.Line(new T.BufferGeometry().setFromPoints(Array.from({length:25},()=>v3())),lineMaterial(model,'teal',.26));
    conn.geometry.attributes.position.setUsage(T.DynamicDrawUsage);model.group.add(conn);
    const dot=ball(model,v3(),.031,teal);
    users.push({phone,conn,dot,serving:i%3,i});
  }
  model.update=t=>{
    data(t);
    users.forEach(user=>{
      const {i,phone,conn,dot}=user,a=t*(.022+(i%3)*.007)+i*2.399;
      const radius=1.35+(i%5)*.52;
      phone.position.set(Math.cos(a)*radius,.01,Math.sin(a*.83+i*.2)*radius*.85);
      phone.rotation.y=-a*.6;
      const distances=positions.map(p=>p.distanceToSquared(phone.position));
      const nearest=distances.indexOf(Math.min(...distances));
      if(distances[nearest]<distances[user.serving]*.84)user.serving=nearest;
      const curve=arc(phone.position.clone().add(v3(0,.25,0)),tips[user.serving],.24),attr=conn.geometry.attributes.position;
      for(let j=0;j<25;j++){const p=curve.getPoint(j/24);attr.setXYZ(j,p.x,p.y,p.z);}attr.needsUpdate=true;
      dot.position.copy(curve.getPoint((t*.17+i*.17)%1));
    });
    rings.forEach(({mesh,p,phase})=>{
      const u=(t*.1+phase)%1,s=.45+u*1.65;
      mesh.position.set(p.x*(1-s),0,p.z*(1-s));mesh.scale.set(s,1,s);mesh.material.opacity=.2*(1-u);
    });
  };
  model.camera={position:v3(9,7.2,10),target:v3(0,.45,0),fov:38};
}

/* Inspired by the supplied manuscript: elliptic-curve computation in a hardware
   wallet, with distinct real/dummy paths and an unlabeled leakage trace.
   No cryptographic or experimental performance claims are encoded here. */
function security(model){
  const C=model.C;
  const dark=material(model,'dark',{roughness:.32,metalness:.65}),metal=material(model,'metal',{metalness:.72,roughness:.28});
  const pearl=material(model,'pearl',{roughness:.45,metalness:.25}),teal=material(model,'teal',{emissive:C.teal,emissiveIntensity:.18});
  const brass=material(model,'brass',{metalness:.7,roughness:.28});
  surface(model,4.5);
  // Machined wallet enclosure and exposed secure computation stack.
  const wallet=new T.Group();wallet.rotation.y=-.15;wallet.position.set(0,.27,.3);model.group.add(wallet);
  const shape=new T.Shape();const w=1.5,h=2.25,r=.22;
  shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
  shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
  const enclosure=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.07,bevelThickness:.06,curveSegments:10}),dark);
  enclosure.rotation.x=-Math.PI/2;enclosure.castShadow=!model.compact;wallet.add(enclosure);
  cube(model,v3(0,.26,-.77),v3(2.35,.06,1.66),metal,wallet);
  cube(model,v3(0,.3,-.77),v3(2.06,.024,1.41),dark,wallet);
  for(let i=0;i<2;i++)mesh(model,geometry.cylinder,metal,v3(-.42+i*.84,.28,1.55),v3(.15,.07,.15),wallet);
  // A raised silicon die and a multilayer board suggest the arithmetic hierarchy.
  cube(model,v3(0,.58,.55),v3(2.4,.07,1.65),material(model,'teal',{roughness:.83,metalness:.2}),wallet);
  chip(model,v3(0,1.05,.85),{w:1.3,h:.24,d:1.22});
  const traces=[],rays=[];
  for(let i=0;i<10;i++){
    const x=-1.03+i*.23;
    traces.push([v3(x,.63,-.2),v3(x,.63,.1)],[v3(x,.63,.1),v3(x*.53,.63,.4)]);
    ball(model,v3(x,.64,-.21),.032,brass,wallet);
  }
  lineSegments(model,traces,lineMaterial(model,'brass',.58));
  // The two branches of y² = x³ - x + 1 are geometric illustration only.
  const curves=[];
  for(const sign of [-1,1]){
    const points=[];
    for(let i=0;i<=120;i++){
      const x=-1.3247+i/120*3.22,term=x*x*x-x+1;
      if(term>=0)points.push(v3(x*1.13-.4,1.95+sign*Math.sqrt(term)*.49,-1.45));
    }
    const path=new T.CatmullRomCurve3(points);curves.push(path);
    polyline(model,path.getPoints(150),lineMaterial(model,'teal',.82));
  }
  // A finite-field point set over F97, rather than a decorative random grid.
  const points=[];
  for(let x=0;x<97;x++)for(let y=0;y<97;y++)if((y*y-(x*x*x+2*x+3))%97===0)points.push({p:v3((x-48)*.035,1.7+(y-48)*.025,-1.56),r:.022});
  instanceMesh(model,geometry.smallSphere,material(model,'metal',{roughness:.6,metalness:.1}),points);
  const real=[],dummy=[];
  for(let i=0;i<4;i++){
    const p=v3(-2.3+i*.1,.72+i*.45,.25-i*.42),q=v3(2.2-i*.08,.68+i*.43,.3-i*.4);
    ball(model,p,.105,teal);ball(model,q,.09,brass);
    real.push(arc(v3(0,1.25,.85),p,.3));dummy.push(arc(v3(0,1.25,.85),q,.3));
  }
  [...real,...dummy].forEach((path,i)=>polyline(model,path.getPoints(24),lineMaterial(model,i<4?'teal':'brass',.28)));
  const p1=particles(model,real,{count:12,speed:.11,r:.042});
  const p2=particles(model,dummy,{count:10,speed:.14,r:.035,role:'brass',phase:.3});
  const ecc=particles(model,curves,{count:6,speed:.045,r:.055,role:'brass'});
  const wavePoints=Array.from({length:180},()=>v3()),wave=polyline(model,wavePoints,lineMaterial(model,'brass',.73));
  wave.geometry.attributes.position.setUsage(T.DynamicDrawUsage);
  const screenPoints=Array.from({length:100},(_,i)=>v3(-.84+i/99*1.68,.32,-.77));
  const screen=polyline(model,screenPoints,lineMaterial(model,'teal',.9),wallet);screen.geometry.attributes.position.setUsage(T.DynamicDrawUsage);
  model.update=t=>{
    p1(t);p2(t);ecc(t);
    const attr=wave.geometry.attributes.position,scr=screen.geometry.attributes.position;
    for(let i=0;i<180;i++){
      const u=i/179,x=-2.8+u*5.6;
      const value=Math.sin(u*64-t*1.7)*Math.sin(u*17+t*.35)*.18+Math.sin(u*121-t*2)*.045;
      attr.setXYZ(i,x,.7+value,2.95);if(i<100)scr.setXYZ(i,-.84+i/99*1.68,.324,-.77+Math.sin(i*.23-t*1.9)*Math.sin(i*.057)*.27);
    }
    attr.needsUpdate=true;scr.needsUpdate=true;
  };
  model.camera={position:v3(8.5,7.5,10.4),target:v3(0,1.05,.1),fov:35};
}

/* A spatial encoder–bottleneck–decoder architecture. Nodes are arranged in real
   layers, edges join adjacent layers, and activations propagate in depth order.
   A recurrent memory path feeds the latent representation. */
function efficient(model){
  const C=model.C,rnd=random(2848),compact=model.compact;
  surface(model,5.15);
  const nodeMat=material(model,'metal',{roughness:.29,metalness:.63}),latentMat=material(model,'brass',{roughness:.28,metalness:.66});
  const dims=compact?[4,5,4,3,2,3,4,4]:[7,8,7,5,3,5,7,6],nodes=[],layers=[],edges=[],paths=[];
  dims.forEach((n,l)=>{
    const x=-4.25+l*8.5/(dims.length-1),spacing=compact?.37:.30,layer=[];
    for(let y=0;y<n;y++)for(let z=0;z<n;z++){
      const p=v3(x,1.5+(y-(n-1)/2)*spacing,(z-(n-1)/2)*spacing);
      const item={p,r:l===4?.086:.053,color:l===4?C.brass:l===0||l===7?C.teal:C.metal,l};
      nodes.push(item);layer.push(item);
    }
    layers.push(layer);
    // Minimal polished frame behind each layer gives the lattice physical depth.
    const side=(n-1)*spacing+.38,half=side/2;
    const frame=[v3(x,1.5-half,-half),v3(x,1.5+half,-half),v3(x,1.5+half,half),v3(x,1.5-half,half),v3(x,1.5-half,-half)];
    polyline(model,frame,lineMaterial(model,l===4?'brass':'metal',l===4?.4:.16));
  });
  layers.slice(0,-1).forEach((layer,l)=>{
    const next=layers[l+1];
    layer.forEach((node,i)=>{
      const nearest=next.map((b,j)=>({b,j,d:(node.p.y-b.p.y)**2+(node.p.z-b.p.z)**2})).sort((a,b)=>a.d-b.d);
      const degree=compact?3:6;
      for(let k=0;k<Math.min(degree,nearest.length);k++){
        const b=nearest[(k*3+i)%Math.min(nearest.length,degree*3)].b;
        edges.push([node.p,b.p]);
        if((i+k*3+l)%9===0)paths.push({curve:arc(node.p,b.p,.04),layer:l,weight:.65+rnd()*.35});
      }
    });
  });
  const neurons=instanceMesh(model,geometry.smallSphere,nodeMat,nodes);
  neurons.instanceColor.setUsage(T.DynamicDrawUsage);
  lineSegments(model,edges,lineMaterial(model,'teal',compact?.24:.19));
  // A small proportion of active synapses makes the signal direction legible.
  const pulseMat=material(model,'teal',{roughness:.18,metalness:.2,emissive:C.teal,emissiveIntensity:.8});
  const pulseCount=paths.length;
  const pulse=new T.InstancedMesh(geometry.smallSphere,pulseMat,pulseCount),object=new T.Object3D();pulse.instanceMatrix.setUsage(T.DynamicDrawUsage);model.group.add(pulse);
  const memory=new T.CatmullRomCurve3(Array.from({length:65},(_,i)=>{
    const a=i/64*TAU;return v3(.62+Math.cos(a)*1.08,2.9+Math.sin(a)*.3,Math.sin(a)*1.34);
  }));
  polyline(model,memory.getPoints(100),lineMaterial(model,'brass',.52));
  const memoryPulses=particles(model,[memory],{count:7,speed:.048,r:.047,role:'brass'});
  const memoryNodes=Array.from({length:10},(_,i)=>({p:memory.getPoint(i/10),r:.052}));
  instanceMesh(model,geometry.smallSphere,latentMat,memoryNodes);
  const bridge=arc(v3(.6,1.52,0),memory.getPoint(.18),.2);polyline(model,bridge.getPoints(32),lineMaterial(model,'brass',.35));
  const color=new T.Color(),baseColor=new T.Color(),activeColor=new T.Color(C.teal);
  model.update=t=>{
    const batch=(t*.41)%9-1;
    nodes.forEach((node,i)=>{
      const activation=Math.exp(-(((batch-node.l)*2.8)**2));
      baseColor.setHex(node.l===4?model.C.brass:node.l===0||node.l===7?model.C.teal:model.C.metal);
      color.copy(baseColor).lerp(activeColor,activation*.8);neurons.setColorAt(i,color);
    });neurons.instanceColor.needsUpdate=true;
    paths.forEach((path,i)=>{
      const u=clamp(batch-path.layer),on=batch>=path.layer&&batch<=path.layer+1;
      object.position.copy(path.curve.getPoint(u));object.scale.setScalar(on?.035*path.weight:.00001);object.updateMatrix();pulse.setMatrixAt(i,object.matrix);
    });pulse.instanceMatrix.needsUpdate=true;memoryPulses(t);
  };
  model.camera={position:v3(8.4,6.2,11.2),target:v3(0,1.5,0),fov:34};
}

const builders={wireless,ran,security,efficient};
function running(){return !document.hidden&&!media.matches&&[...instances].some(m=>m.visible&&!m.lost);}
function schedule(){
  cancelAnimationFrame(animation);animation=0;
  for(const m of instances){m.last=0;m.draw();}
  if(running())animation=requestAnimationFrame(tick);
}
function tick(now){
  animation=0;
  for(const model of instances){
    if(!model.visible||model.lost)continue;
    const interval=1000/(model.renderer.isSoftwareRenderer?(model.compact?10:16):(model.compact?18:30));
    if(model.last&&now-model.last<interval)continue;
    const dt=model.last?Math.min(.09,(now-model.last)/1000):0;model.last=now;model.time+=dt;model.draw();
  }
  if(running())animation=requestAnimationFrame(tick);
}
export function createResearchScene(host,{type='wireless',compact=false}={}){
  const surface=host.querySelector('.research-network-shell')||host;
  const canvas=document.createElement('canvas');
  let context;
  try{context=canvas.getContext('webgl2',{alpha:true,antialias:!compact,powerPreference:'low-power'});}catch{}
  const renderer=context?new T.WebGLRenderer({canvas,context,alpha:true,antialias:!compact,powerPreference:'low-power'}):new ResearchSoftwareRenderer({compact});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,compact?1.25:1.65));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  renderer.shadowMap.enabled=!compact;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.domElement.className='research-network-canvas';renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new T.Scene(),group=new T.Group();scene.add(group);
  const model={host,surface,renderer,scene,group,C:colors(),materials:[],compact,visible:false,lost:false,time:9.4,last:0,aim:{x:0,y:0},pointer:{x:0,y:0},update:()=>{}};
  const ambient=new T.HemisphereLight(0xffffff,0x526673,2.7);scene.add(ambient);
  const key=new T.DirectionalLight(0xfff7eb,3.9);key.position.set(-4,9,6);scene.add(key);
  key.castShadow=!compact;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.04;key.shadow.bias=-.0001;
  const fill=new T.DirectionalLight(0xa9d6e2,2.3);fill.position.set(7,4,-5);scene.add(fill);
  const rim=new T.DirectionalLight(0xffffff,1.4);rim.position.set(0,4,7);scene.add(rim);
  try{(builders[type]||wireless)(model);}catch(error){renderer.dispose();throw error;}
  const camera=new T.PerspectiveCamera(model.camera.fov,1,.1,100);camera.position.copy(model.camera.position);camera.lookAt(model.camera.target);
  function resize(){
    const rect=surface.getBoundingClientRect();if(!rect.width||!rect.height)return;
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();model.draw();
  }
  model.draw=()=>{
    if(model.lost)return;
    model.pointer.x+=(model.aim.x-model.pointer.x)*.065;model.pointer.y+=(model.aim.y-model.pointer.y)*.065;
    group.rotation.y=media.matches?-.12:-.12+Math.sin(model.time*.075)*.065+model.pointer.x*.13;
    group.rotation.x=media.matches?0:model.pointer.y*.035;
    model.update(model.time);renderer.render(scene,camera);
    surface.dataset.motionState=media.matches?'still':model.visible&&!document.hidden?'running':'paused';
    surface.dataset.renderer=renderer.isSoftwareRenderer?'software-3d':'webgl';
  };
  renderer.setClearColor(model.C.bg,0);
  resize();surface.replaceChildren(renderer.domElement);
  const observer=new ResizeObserver(resize);observer.observe(surface);
  if(!compact){
    host.addEventListener('pointermove',e=>{if(media.matches||e.pointerType==='touch')return;const r=host.getBoundingClientRect();model.aim.x=clamp((e.clientX-r.left)/r.width-.5,-.5,.5);model.aim.y=clamp((e.clientY-r.top)/r.height-.5,-.5,.5);},{passive:true});
    host.addEventListener('pointerleave',()=>{model.aim={x:0,y:0};},{passive:true});
  }
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();model.lost=true;surface.dataset.motionState='paused';schedule();});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{model.lost=false;schedule();});
  model.recolor=()=>{
    model.C=colors();model.materials.forEach(({m,role})=>{m.color.setHex(model.C[role]);if(m.emissive?.getHex())m.emissive.setHex(model.C[role]);});renderer.setClearColor(model.C.bg,0);model.draw();
  };
  instances.add(model);
  return {setVisible(visible){if(model.visible===visible)return;model.visible=visible;schedule();},resize};
}
document.addEventListener('visibilitychange',schedule);media.addEventListener('change',schedule);
window.addEventListener('site-theme-change',()=>{instances.forEach(m=>m.recolor());schedule();});
