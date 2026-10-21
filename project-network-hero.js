/* Four original, concept-specific research illustrations.
   R01: wireless mesh, R02: adaptive radio access, R03: cryptographic security,
   R04: efficient neural processing. Canvas only, no external dependencies. */
(() => {
  'use strict';
  const stages = [...document.querySelectorAll('.research-stage--network[data-network-scene]')];
  if (!stages.length) return;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const C = { blue:'#2689c0', cyan:'#68bbdb', dark:'#20628e', navy:'#123a59', pale:'#c2e1ef', light:'#e5f2fa', teal:'#33b4ac', violet:'#7b95c7', white:'#fff', grid:'rgba(76,148,183,.14)' };
  const PI=Math.PI, TAU=2*Math.PI;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t*t*(3-2*t);
  function rand(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
  function circ(g,x,y,r,fill,stroke=null,sw=1){g.beginPath();g.arc(x,y,Math.max(0.01,r),0,TAU);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=sw;g.stroke();}}
  function seg(g,x,y,X,Y,color=C.pale,width=1){g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.lineWidth=width;g.strokeStyle=color;g.stroke();}
  function path(g,pts,color=C.pale,width=1){g.beginPath();g.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)g.lineTo(...pts[i]);g.lineWidth=width;g.strokeStyle=color;g.stroke();}
  function rounded(g,x,y,w,h,r=10){g.beginPath();g.roundRect(x,y,w,h,r);}
  function txt(g,s,x,y,size=11,col=C.dark,weight=600,align='left'){
    g.font=`${weight} ${size}px "Space Grotesk",Arial,sans-serif`;g.textAlign=align;g.textBaseline='middle';g.fillStyle=col;g.fillText(s,x,y);
  }
  function glow(g,x,y,r,alpha=.32,color='104,187,219'){
    const v=g.createRadialGradient(x,y,0,x,y,r);v.addColorStop(0,`rgba(${color},${alpha})`);v.addColorStop(.36,`rgba(${color},${alpha*.43})`);v.addColorStop(1,`rgba(${color},0)`);circ(g,x,y,r,v);
  }
  function blip(g,x,y,r=4,color=C.blue){glow(g,x,y,r*5,.24);circ(g,x,y,r+1.9,'#ffffff');circ(g,x,y,r,color);}
  function quad(g,a,c,b,stroke,width=1){g.beginPath();g.moveTo(a[0],a[1]);g.quadraticCurveTo(c[0],c[1],b[0],b[1]);g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}
  function quadPoint(a,c,b,t){return [(1-t)**2*a[0]+2*(1-t)*t*c[0]+t*t*b[0],(1-t)**2*a[1]+2*(1-t)*t*c[1]+t*t*b[1]];}
  function packet(g,a,c,b,t,color=C.blue,r=3){const [x,y]=quadPoint(a,c,b,((t%1)+1)%1);glow(g,x,y,15,.23);circ(g,x,y,r,'#fff');circ(g,x,y,r*.72,color);}
  function isometric(g){
    g.save();g.strokeStyle='rgba(91,151,185,.10)';g.lineWidth=.85;
    for(let i=-8;i<=13;i++){let x=50+i*65;seg(g,x,495,x+370,325,C.grid,.72);seg(g,x,495,x-370,325,C.grid,.72);}
    g.restore();
  }
  const r01rand=rand(1108), sphere=[];
  for(let i=0;i<105;i++){
    let y=1-2*(i+.5)/105,r=Math.sqrt(1-y*y),q=i*PI*(3-Math.sqrt(5)),jitter=.90+r01rand()*.13;
    sphere.push({x:Math.cos(q)*r*jitter,y:y*jitter,z:Math.sin(q)*r*jitter,major:i%11===0,phase:r01rand()*8});
  }
  const sphereEdges=[];
  sphere.forEach((a,i)=>{
    let nearest=sphere.map((b,j)=>({j,d:(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2})).filter(o=>o.j!==i).sort((a,b)=>a.d-b.d).slice(0,i%4===0?5:4);
    nearest.forEach(o=>{if(o.j>i&&o.d<.58)sphereEdges.push({a:i,b:o.j,phase:(i+o.j)*.171,speed:.19+(i%7)*.027});});
  });
  function drawWireless(g,t,m){
    glow(g,405,280,300,.22);
    g.save();g.translate(405+m.x*14,272+m.y*10);
    g.strokeStyle='rgba(122,191,220,.16)';g.setLineDash([4,8]);g.lineWidth=1;
    for(let i=0;i<4;i++){g.beginPath();g.ellipse(0,0,212+i*20,(212+i*20)*(.93+i*.024),i*.34+t*.014*(i%2?1:-1),0,TAU);g.stroke();}
    g.setLineDash([]);
    const ry=t*.108-.45+m.x*.24,rx=-.24+m.y*.15;
    const projected=sphere.map(n=>{let x=n.x*Math.cos(ry)-n.z*Math.sin(ry),z=n.x*Math.sin(ry)+n.z*Math.cos(ry),y=n.y*Math.cos(rx)-z*Math.sin(rx);z=n.y*Math.sin(rx)+z*Math.cos(rx);let p=3.8/(3.8-z);return{x:x*211*p,y:y*211*p,z,p};});
    sphereEdges.forEach((e,i)=>{
      let a=projected[e.a],b=projected[e.b],depth=(a.z+b.z)/2,alpha=clamp(.25+depth*.22,.09,.65);
      let bend=Math.sin(e.phase+t*.34)*6;
      let mid=[(a.x+b.x)/2+bend,(a.y+b.y)/2-bend*.8];
      quad(g,[a.x,a.y],mid,[b.x,b.y],`rgba(55,145,199,${alpha})`,depth>.2?1.2:.75);
      if(i%3===0){let u=(t*e.speed+e.phase)%1;packet(g,[a.x,a.y],mid,[b.x,b.y],u,C.blue,1.8);}
    });
    projected.map((v,i)=>({...v,i})).sort((a,b)=>a.z-b.z).forEach(p=>{
      let node=sphere[p.i],r=(node.major?4.7:2.6)*p.p,alpha=clamp(.55+p.z*.22,.35,1);
      if(node.major){
        glow(g,p.x,p.y,r*5,.20);
        const wave=(Math.sin(t*1.1+node.phase)+1)*.5;
        circ(g,p.x,p.y,r*1.5+wave*7,null,`rgba(75,183,221,${0.18*(1-wave)})`,1.2);
      }
      circ(g,p.x,p.y,r+1.3,`rgba(255,255,255,${alpha})`);circ(g,p.x,p.y,r*.72,node.major?C.blue:C.cyan);
    });
    // ambient uplink traffic around the globe shell
    for(let i=0;i<10;i++){
      const ang=t*.22+i*TAU/10, rr=242+Math.sin(t+i)*10;
      const x=Math.cos(ang)*rr, y=Math.sin(ang)*rr*.78;
      circ(g,x,y,1.7,'rgba(70,184,220,.38)');
    }
    g.restore();
  }
  function tower(g,x,y,active,t,label){
    const blue=active?C.blue:C.dark;
    glow(g,x,y-31,99,active?.17:.10,active?'50,173,218':'92,169,207');
    const groundY=y+48;
    g.beginPath();g.ellipse(x,groundY,55,17,0,0,TAU);g.fillStyle='rgba(61,141,185,.055)';g.fill();g.strokeStyle='rgba(77,153,195,.25)';g.lineWidth=1;g.stroke();
    path(g,[[x,y-55],[x-28,groundY],[x+27,groundY],[x,y-55]],blue,2.3);
    for(let j=0;j<4;j++){let yy=y-27+j*20;let factor=(yy-(y-55))/(groundY-(y-55));seg(g,x-28*factor,yy,x+27*factor,yy,'rgba(38,124,169,.65)',1.25);}
    seg(g,x,y-82,x,y-54,blue,2.4);
    rounded(g,x-5,y-81,10,14,4);g.fillStyle=C.white;g.fill();g.strokeStyle=blue;g.stroke();
    blip(g,x,y-83,3,active?C.teal:C.blue);
    for(let k=0;k<3;k++){
      let phase=(t*.38+k/3)%1;
      g.beginPath();g.arc(x,y-80,18+phase*86,PI*1.14,PI*1.86);
      g.lineWidth=1.5-phase*.7;g.strokeStyle=`rgba(55,164,207,${(.36*(1-phase)*(active?1:.75)).toFixed(3)})`;g.stroke();
    }
  }
  function phone(g,x,y,angle=0){
    g.save();g.translate(x,y);g.rotate(angle);
    glow(g,0,0,25,.14);rounded(g,-8,-15,16,27,4);g.fillStyle='#f7fcff';g.fill();g.lineWidth=2;g.strokeStyle=C.dark;g.stroke();
    rounded(g,-5,-10,10,16,1.5);g.fillStyle='#d8f2fa';g.fill();circ(g,0,9,1.25,C.cyan);
    g.restore();
  }
  function drawRan(g,t,m){
    glow(g,380,285,335,.25,'94,188,223');isometric(g);
    const nodes=[{x:205,y:285},{x:446,y:183},{x:632,y:335}];
    nodes.forEach((n,i)=>{
      let rad=[130,138,127][i];
      g.beginPath();g.ellipse(n.x,n.y-27,rad,rad*.68,-.06,0,TAU);
      g.fillStyle=i===1?'rgba(48,185,175,.055)':'rgba(84,179,219,.05)';g.fill();
      g.strokeStyle=i===1?'rgba(43,174,164,.26)':'rgba(55,163,214,.22)';g.lineWidth=1;g.setLineDash([4,7]);g.stroke();g.setLineDash([]);
      g.beginPath();g.ellipse(n.x,n.y-27,rad*.62,rad*.42,-.05,0,TAU);g.strokeStyle='rgba(55,163,214,.20)';g.stroke();
      g.beginPath();g.ellipse(n.x,n.y-27,rad*.34,rad*.23,-.05,0,TAU);g.strokeStyle='rgba(55,163,214,.12)';g.stroke();
    });
    const hub=[397,435], connections=[[[205,312],[315,444],hub],[[446,210],[447,367],hub],[[632,362],[536,462],hub]];
    connections.forEach(([a,c,b],i)=>{quad(g,a,c,b,'rgba(65,155,194,.40)',1.4);packet(g,a,c,b,(t*.16+i*.31)%1,C.teal,2.8);packet(g,b,c,a,(t*.13+i*.19)%1,C.blue,2.0);});
    nodes.forEach((n,i)=>tower(g,n.x,n.y,i===1||Math.floor(t/3)%3===i,t,['01','02','03'][i]));
    const tracks=[
      {p0:[165,427], c:[250,462], p1:[401,463], c2:[510,475], p2:[650,420], phase:0},
      {p0:[650,386], c:[540,355], p1:[408,330], c2:[302,323], p2:[180,352], phase:.38},
      {p0:[150,360], c:[260,316], p1:[392,276], c2:[514,260], p2:[684,286], phase:.71}
    ];
    tracks.forEach((tr,k)=>{
      quad(g,tr.p0,tr.c,tr.p1,'rgba(46,148,201,.18)',1.4);quad(g,tr.p1,tr.c2,tr.p2,'rgba(46,148,201,.18)',1.4);
      let travel=(t*.05+tr.phase)%1,u=travel<.5?travel*2:(travel-.5)*2;
      let at=travel<.5?quadPoint(tr.p0,tr.c,tr.p1,u):quadPoint(tr.p1,tr.c2,tr.p2,u);
      phone(g,at[0]+m.x*4,at[1]+m.y*3,Math.sin(t*.9+k)*.08);
      let closest=travel<.34?0:travel<.68?1:2;
      let n=nodes[closest];
      quad(g,[at[0],at[1]-18],[(at[0]+n.x)/2,(at[1]+n.y)/2-52],[n.x,n.y-82],k===1?'rgba(46,148,201,.32)':'rgba(46,177,165,.46)',1.15);
      const point=quadPoint([at[0],at[1]-18],[(at[0]+n.x)/2,(at[1]+n.y)/2-52],[n.x,n.y-82],.56);blip(g,point[0],point[1],2.2,k===1?C.blue:C.teal);
    });
    // central controller abstraction
    rounded(g,325,366,145,61,12);g.fillStyle='rgba(255,255,255,.78)';g.fill();g.strokeStyle='rgba(87,167,204,.28)';g.lineWidth=1.15;g.stroke();
    circ(g,346,387,4,C.teal);
    for(let i=0;i<3;i++){rounded(g,339+i*40,407,31,5,2.5);g.fillStyle='#dcecf4';g.fill();rounded(g,339+i*40,407,31*(.40+.48*(.5+.5*Math.sin(t*.8+i*1.6))),5,2.5);g.fillStyle=i===1?C.teal:C.blue;g.fill();}
    // orbiting handover indicators around the active tower
    let active=nodes[Math.floor(t/3)%3];
    for(let i=0;i<3;i++){let a=t*.9+i*TAU/3;circ(g,active.x+22*Math.cos(a),active.y-92+12*Math.sin(a),1.8,'rgba(53,186,175,.55)');}
  }
  function drawShield(g,x,y,sc){
    g.save();g.translate(x,y);g.scale(sc,sc);
    g.beginPath();g.moveTo(0,-143);g.bezierCurveTo(64,-112,111,-109,111,-109);g.lineTo(110,1);g.bezierCurveTo(110,82,55,129,0,156);g.bezierCurveTo(-55,129,-110,82,-110,1);g.lineTo(-111,-109);g.bezierCurveTo(-72,-113,-34,-124,0,-143);g.closePath();
    const fill=g.createLinearGradient(0,-143,0,156);fill.addColorStop(0,'rgba(250,254,255,.94)');fill.addColorStop(1,'rgba(216,242,250,.70)');g.fillStyle=fill;g.fill();
    g.strokeStyle='rgba(37,141,190,.83)';g.lineWidth=2;g.stroke();
    g.save();g.scale(.85,.86);g.strokeStyle='rgba(66,179,199,.35)';g.lineWidth=1.1;g.stroke();g.restore();
    // A big lock symbol, in the visual language of security rather than networking.
    g.beginPath();g.arc(0,-2,36,PI,TAU);g.strokeStyle=C.dark;g.lineWidth=8;g.stroke();
    rounded(g,-54,-11,108,84,15);g.fillStyle=C.dark;g.fill();
    rounded(g,-48,-5,96,71,11);g.fillStyle='#2a80b1';g.fill();
    circ(g,0,25,10,'#edfbff');rounded(g,-4.5,29,9,20,4);g.fillStyle='#edfbff';g.fill();
    g.restore();
  }
  function cube(g,x,y,s,label){
    g.save();g.translate(x,y);
    g.beginPath();g.moveTo(0,-s*.26);g.lineTo(s*.5,0);g.lineTo(0,s*.28);g.lineTo(-s*.5,0);g.closePath();g.fillStyle='#faffff';g.fill();g.strokeStyle='rgba(50,145,191,.77)';g.lineWidth=1.2;g.stroke();
    path(g,[[-s*.5,0],[-s*.5,s*.46],[0,s*.73],[0,s*.28]],'rgba(50,145,191,.70)',1.2);
    path(g,[[s*.5,0],[s*.5,s*.46],[0,s*.73]],'rgba(50,145,191,.70)',1.2);
    g.beginPath();g.moveTo(-s*.5,0);g.lineTo(0,s*.28);g.lineTo(0,s*.73);g.lineTo(-s*.5,s*.46);g.closePath();g.fillStyle='rgba(202,234,247,.82)';g.fill();
    g.beginPath();g.moveTo(s*.5,0);g.lineTo(0,s*.28);g.lineTo(0,s*.73);g.lineTo(s*.5,s*.46);g.closePath();g.fillStyle='rgba(108,187,222,.25)';g.fill();
    if(label)txt(g,label,0,s*.44,9,C.navy,700,'center');g.restore();
  }
  function drawSecurity(g,t,m){
    glow(g,397,275,282,.18,'112,174,222');
    const cx=397+m.x*10,cy=269+m.y*7;
    g.save();g.translate(cx,cy);
    [171,195,224].forEach((r,j)=>{
      g.beginPath();g.arc(0,0,r,0,TAU);g.strokeStyle=`rgba(69,147,196,${.19-j*.025})`;g.lineWidth=1;g.setLineDash(j===1?[2,8]:j===2?[1,11]:[5,7]);g.lineDashOffset=(j%2?1:-1)*t*(4+j*3);g.stroke();g.setLineDash([]);
      for(let i=0;i<j+8;i++){
        let a=i*TAU/(j+8)+t*(j%2?-.033:.023),x=Math.cos(a)*r,y=Math.sin(a)*r;
        circ(g,x,y,j===0?2.7:1.75,i%3===0?C.teal:C.cyan);
      }
    });
    for(let i=0;i<24;i++){
      let a=TAU*i/24+t*.011,r=151;
      seg(g,Math.cos(a)*r,Math.sin(a)*r,Math.cos(a)*(r+7),Math.sin(a)*(r+7),i%3===0?'rgba(33,135,187,.42)':'rgba(78,172,201,.19)',1.5);
    }
    g.restore();
    const inA=[90,241],inC=[230,215],inB=[cx-122,cy-11];
    const outA=[cx+122,cy-11],outC=[576,204],outB=[718,241];
    quad(g,inA,inC,inB,'rgba(70,150,193,.36)',1.7);quad(g,outA,outC,outB,'rgba(39,166,155,.42)',1.7);
    for(let j=0;j<5;j++)packet(g,inA,inC,inB,(t*.13+j*.21)%1,j%3===0?C.violet:C.blue,2.6);
    for(let j=0;j<5;j++)packet(g,outA,outC,outB,(t*.13+j*.21)%1,C.teal,2.6);
    // stream encoded symbols as abstract blocks, not words
    const glyphCols=['rgba(43,127,177,.46)','rgba(43,127,177,.30)','rgba(43,127,177,.24)'];
    for(let i=0;i<8;i++){
      const x=74+i*26, y=285+(i%2)*11;
      rounded(g,x,y,12,9,2.8);g.fillStyle=glyphCols[i%3];g.fill();
      rounded(g,636+i*7,284+(i%2)*8,6,6,1.5);g.fillStyle=i<5?'rgba(51,180,172,.42)':'rgba(51,180,172,.18)';g.fill();
    }
    seg(g,480,448,670,448,'rgba(43,150,192,.30)',1.4);
    [525,590,655].forEach((x,i)=>{cube(g,x,420+Math.sin(t*.5+i)*3,38,``);if(i<2)packet(g,[x+19,443],[x+30,435],[x+44,443],t*.2+i*.45,C.teal,2);});
    for(let i=0;i<3;i++){let x=128+i*22;circ(g,x,341,2.4,i===2?C.teal:C.pale);}    
    drawShield(g,cx,cy,.88);
    g.save();g.beginPath();g.rect(cx-82,cy-87,164,168);g.clip();
    const sweep=(t*28%260)-135;seg(g,cx-100,cy+sweep,cx+100,cy+sweep,'rgba(92,222,217,.22)',2.4);g.restore();
    // subtle lock pulses
    for(let i=0;i<2;i++){
      const rr=38+((t*22+i*18)%36);circ(g,cx,cy+25,rr,null,`rgba(54,184,173,${.16-i*.05})`,1.15);
    }
  }
  function waveform(g,x,y,w,amp,t){
    g.beginPath();for(let i=0;i<=w;i+=4){let phase=(i/w)*14*PI-t*2.8,env=Math.sin(i/w*PI)**2,v=Math.sin(phase)*Math.sin(phase*.31)*amp*env;let yy=y+v;if(i===0)g.moveTo(x+i,yy);else g.lineTo(x+i,yy);}
    g.strokeStyle='rgba(35,152,191,.58)';g.lineWidth=1.7;g.stroke();
  }
  function drawAI(g,t,m){
    glow(g,435,283,315,.22,'110,191,228');
    const layers=[{x:142,ys:[175,231,286,341,398]},{x:290,ys:[145,197,248,299,350,401]},{x:426,ys:[227,282,338]},{x:558,ys:[153,207,260,313,367,421]},{x:688,ys:[192,262,334,403]}];
    layers.forEach((l,i)=>{
      rounded(g,l.x-(i===2?27:21),125,i===2?54:42,324,21);
      g.fillStyle=i===2?'rgba(49,178,171,.105)':'rgba(104,183,218,.045)';g.fill();
      g.strokeStyle=i===2?'rgba(48,168,165,.36)':'rgba(80,164,207,.10)';g.lineWidth=1;g.stroke();
    });
    layers.slice(0,-1).forEach((layer,l)=>{
      let next=layers[l+1];
      layer.ys.forEach((y,i)=>next.ys.forEach((ny,j)=>{
        const active=(i*7+j*3+l)%5<2 || l===1 && j===1;
        const a=[layer.x,y+m.y*3],b=[next.x,ny-m.y*3],c=[(a[0]+b[0])/2,(y+ny)/2-10-((l===1||l===2)?8:0)];
        quad(g,a,c,b,active?'rgba(51,156,198,.29)':'rgba(58,159,196,.075)',active?1.2:.75);
        if(active && (i+j+l)%3===0)packet(g,a,c,b,(t*(.10+(l%2)*.02)+i*.16+j*.17)%1,l===2?C.teal:C.blue,2.4);
      }));
    });
    layers.forEach((l,i)=>l.ys.forEach((y,j)=>{
      let ax=l.x+(i===2?m.x*5:0),v=(Math.sin(t*1.6+i*.9+j*.75)+1)/2;
      let r=i===2?7.1:4.2+v*.8;
      if(i===2)glow(g,ax,y,28,.21,'38,190,179');
      circ(g,ax,y,r+2,'#fff');circ(g,ax,y,r,i===2?C.teal:j%3===0?C.dark:C.cyan);
    }));
    // bottom abstractions instead of labels
    rounded(g,362,461,133,7,3.5);g.fillStyle='#d2e9f4';g.fill();
    rounded(g,362,461,51+10*Math.sin(t*.8)**2,7,3.5);g.fillStyle=C.teal;g.fill();
    waveform(g,65,497,163,12,t);
    for(let i=0;i<6;i++){
      const x=568+i*21;
      rounded(g,x,476,12,8,3);g.fillStyle=i<4?'rgba(63,165,211,.65)':'rgba(63,165,211,.18)';g.fill();
    }
    // latent ring + circulating memory points
    g.beginPath();g.ellipse(426,282,52,122,0,0,TAU);g.strokeStyle='rgba(36,179,170,.21)';g.lineWidth=1;g.setLineDash([3,7]);g.stroke();g.setLineDash([]);
    for(let i=0;i<5;i++){let a=t*.35+i*TAU/5;circ(g,426+52*Math.cos(a),282+122*Math.sin(a),3,i%2?C.teal:C.cyan);}
    // output shimmer bars
    for(let i=0;i<5;i++){rounded(g,603+i*20,118+(i%2)*10,9,50+Math.sin(t*1.1+i)*18,4);g.fillStyle='rgba(105,189,221,.10)';g.fill();}
  }
  function boot(stage){
    const canvas=stage.querySelector('canvas.research-network-canvas');if(!canvas)return;
    const g=canvas.getContext('2d',{alpha:true});if(!g)return;
    const scene=stage.dataset.networkScene;
    let w=1,h=1,dpr=1,visible=true,manualPause=false,last=0,clock=0,frame=0;
    let pointer={x:0,y:0},aim={x:0,y:0};
    function resize(){const rect=stage.querySelector('.research-network-shell').getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';render();}
    const pause=stage.querySelector('[data-scene-pause]');
    function updatePause(){if(!pause)return;pause.setAttribute('aria-pressed',String(manualPause));pause.textContent=manualPause?'Play motion':'Pause motion';pause.setAttribute('aria-label',manualPause?'Resume research scene motion':'Pause research scene motion');pause.disabled=media.matches;}
    function render(){
      g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
      const zoom=Math.min(w/800,h/560);
      g.translate((w-800*zoom)/2,(h-560*zoom)/2);g.scale(zoom,zoom);
      if(scene==='ran')drawRan(g,clock,pointer);
      else if(scene==='security')drawSecurity(g,clock,pointer);
      else if(scene==='efficient')drawAI(g,clock,pointer);
      else drawWireless(g,clock,pointer);
    }
    function tick(now){frame=0;if(!visible||document.hidden)return;let dt=last?Math.min(.05,(now-last)/1000):.016;last=now;
      if(!manualPause&&!media.matches){clock+=dt;pointer.x+=(aim.x-pointer.x)*Math.min(1,dt*2.2);pointer.y+=(aim.y-pointer.y)*Math.min(1,dt*2.2);}render();
      if(!manualPause&&!media.matches)frame=requestAnimationFrame(tick);
    }
    function sync(){cancelAnimationFrame(frame);frame=0;last=0;render();if(!media.matches&&!manualPause&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
    stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();aim.x=clamp((e.clientX-r.left)/r.width-.5,-.5,.5);aim.y=clamp((e.clientY-r.top)/r.height-.5,-.5,.5);},{passive:true});
    stage.addEventListener('pointerleave',()=>{aim.x=0;aim.y=0;},{passive:true});
    if(pause){pause.addEventListener('click',()=>{manualPause=!manualPause;updatePause();sync();});updatePause();}
    document.addEventListener('visibilitychange',sync);
    media.addEventListener('change',()=>{updatePause();sync();});
    if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage.querySelector('.research-network-shell'));
    else window.addEventListener('resize',resize,{passive:true});
    if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.01}).observe(stage);
    resize();sync();
  }
  stages.forEach(boot);
})();
