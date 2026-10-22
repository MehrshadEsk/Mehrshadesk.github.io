/* Original conceptual research diagrams. No measured or live data.
 * Shared animation clock, bounded pixel density, visibility lifecycle, and
 * native reduced-motion support. No libraries or network requests required. */
(() => {
  'use strict';
  const hosts = [...document.querySelectorAll('[data-network-scene], [data-research-motion]')];
  if (!hosts.length) return;
  const TAU = Math.PI * 2;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  let strokeScale = 1, opacityScale = 1, nodeScale = 1;
  const alpha = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${clamp(a * opacityScale)})`;
  };
  function palette() {
    return document.documentElement.dataset.theme === 'dark'
      ? { ink:'#d6e8f2', muted:'#98b5c6', blue:'#67b7df', teal:'#63d1c2', violet:'#a8a1df', orange:'#e3ae82', line:'#375663', paper:'#142d3a' }
      : { ink:'#254c64', muted:'#688696', blue:'#287da9', teal:'#279f98', violet:'#8b84ba', orange:'#c68c65', line:'#c5dbe5', paper:'#f8fcfe' };
  }
  function line(g,a,b,color,width=1,dash=[]) {
    g.beginPath();g.moveTo(...a);g.lineTo(...b);g.strokeStyle=color;g.lineWidth=width*strokeScale;
    g.setLineDash(dash);g.stroke();g.setLineDash([]);
  }
  function poly(g,points,color,width=1,fill=null,close=false) {
    g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));
    if(close)g.closePath();if(fill){g.fillStyle=fill;g.fill();}
    if(color){g.strokeStyle=color;g.lineWidth=width*strokeScale;g.stroke();}
  }
  function dot(g,x,y,r,fill,stroke=null,width=1) {
    g.beginPath();g.arc(x,y,Math.max(.1,r*nodeScale),0,TAU);
    if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width*strokeScale;g.stroke();}
  }
  function box(g,x,y,w,h,fill,stroke=null,r=6) {
    g.beginPath();g.roundRect(x,y,w,h,r);
    if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=strokeScale;g.stroke();}
  }
  function label(g,value,x,y,C,options={}) {
    g.font=`${options.weight||500} ${options.size||11}px 'Space Grotesk', sans-serif`;
    g.fillStyle=options.color||C.muted;g.textAlign=options.align||'left';
    g.textBaseline='middle';g.fillText(value,x,y);
  }
  function curve(g,a,c,b,color,width=1,dash=[]) {
    g.beginPath();g.moveTo(...a);g.quadraticCurveTo(...c,...b);
    g.strokeStyle=color;g.lineWidth=width*strokeScale;g.setLineDash(dash);g.stroke();g.setLineDash([]);
  }
  function at(a,c,b,t) {
    return [(1-t)**2*a[0]+2*(1-t)*t*c[0]+t*t*b[0],(1-t)**2*a[1]+2*(1-t)*t*c[1]+t*t*b[1]];
  }
  function packet(g,a,c,b,progress,color,size=3) {
    for(let i=3;i>=0;i--) {
      const u=((progress-i*.024)%1+1)%1;const [x,y]=at(a,c,b,u);
      dot(g,x,y,size*(1-i*.16),alpha(color,.9-i*.22));
    }
  }
  function ellipse(g,x,y,rx,ry,color,width=1,dash=[],rotation=0,fill=null) {
    g.beginPath();g.ellipse(x,y,rx,ry,rotation,0,TAU);
    if(fill){g.fillStyle=fill;g.fill();}g.strokeStyle=color;g.lineWidth=width*strokeScale;
    g.setLineDash(dash);g.stroke();g.setLineDash([]);
  }
  function hex(g,x,y,r,fill,stroke,rotate=Math.PI/6) {
    poly(g,Array.from({length:6},(_,i)=>[x+Math.cos(i*TAU/6+rotate)*r,y+Math.sin(i*TAU/6+rotate)*r]),stroke,1.2,fill,true);
  }
  function chip(g,x,y,w,h,C,title,color=C.blue) {
    for(let i=0;i<7;i++) {
      const yy=y+9+i*(h-18)/6;
      line(g,[x-9,yy],[x,yy],alpha(color,.6),1.3);line(g,[x+w,yy],[x+w+9,yy],alpha(color,.6),1.3);
    }
    box(g,x,y,w,h,C.paper,color,8);box(g,x+7,y+7,w-14,h-14,alpha(color,.055),alpha(color,.2),4);
    if(title)label(g,title,x+w/2,y+h/2,C,{color,align:'center',size:12,weight:600});
  }
  function board(g,C,compact) {
    for(let x=40;x<=760;x+=40)for(let y=65;y<=530;y+=40)dot(g,x,y,.8,alpha(C.muted,.18));
    if(!compact)[[24,38,1,1],[776,38,-1,1],[24,560,1,-1],[776,560,-1,-1]].forEach(([x,y,sx,sy])=>{
      line(g,[x+16*sx,y],[x,y],C.line);line(g,[x,y],[x,y+16*sy],C.line);
    });
  }
  function waveform(g,x,y,w,h,t,C,color=C.blue,mode=0) {
    line(g,[x,y],[x+w,y],alpha(C.line,.8));const pts=[];
    for(let i=0;i<=w;i+=2) {
      const u=i/w,envelope=Math.sin(u*Math.PI)**1.3;
      const v=mode?Math.sin(u*63+t)*Math.sin(u*17-t*.3):Math.sin(u*45-t*2)*.65+Math.sin(u*81-t*1.6)*.25;
      pts.push([x+i,y+v*h*envelope]);
    }
    poly(g,pts,color,1.5);
  }

  /* R01: hierarchical sensor routing, RF propagation, and spectrum. */
  const clusters=[{x:183,y:186,phase:.1},{x:563,y:163,phase:.7},{x:638,y:351,phase:1.4},{x:233,y:392,phase:2.1}];
  function wireless(g,t,C,compact,pointer) {
    board(g,C,compact);const hub=[401+pointer.x*5,292+pointer.y*4];
    ellipse(g,...hub,165,120,alpha(C.blue,.13),1,[3,8],-.22);
    // Secondary relay paths and selection rings reveal the routing hierarchy.
    clusters.forEach((cluster,k)=>{
      const next=clusters[(k+1)%clusters.length];
      const a=[cluster.x,cluster.y],b=[next.x,next.y],c=[(a[0]+b[0])/2,(a[1]+b[1])/2+(k%2?40:-40)];
      curve(g,a,c,b,alpha(C.violet,.2),.9,[3,6]);
      if(k%2===0)packet(g,a,c,b,t*.09+k*.21,C.violet,2.2);
    });
    clusters.forEach((cluster,k)=>{
      const head=[cluster.x,cluster.y];
      ellipse(g,...head,94,63,alpha(C.blue,.22),1,[4,6],-.22,alpha(C.blue,.025));
      for(let r=0;r<2;r++) {
        const phase=(t*.18+r*.5+cluster.phase)%1;
        ellipse(g,...head,24+phase*83,16+phase*55,alpha(C.teal,.26*(1-phase)),1.2,[],-.22);
      }
      const control=[lerp(head[0],hub[0],.5),lerp(head[1],hub[1],.5)-34];
      curve(g,head,control,hub,alpha(C.blue,.48),1.6);packet(g,head,control,hub,t*.19+k*.23,C.blue,3.2);
      for(let j=0;j<7;j++) {
        const angle=j*TAU/7+cluster.phase;
        const node=[head[0]+Math.cos(angle)*81,head[1]+Math.sin(angle)*53];
        const parent=j===4?[head[0]+Math.cos((j-1)*TAU/7+cluster.phase)*81,head[1]+Math.sin((j-1)*TAU/7+cluster.phase)*53]:head;
        const c=[(node[0]+parent[0])/2,(node[1]+parent[1])/2-8];
        curve(g,node,c,parent,alpha(C.teal,.26),1);
        if(j%2===0)packet(g,node,c,parent,t*.24+j*.16+k*.24,C.teal,2.2);
        hex(g,...node,6,C.paper,alpha(C.blue,.55));dot(g,...node,1.9,j===4?C.violet:C.teal);
        if(j%2===0){
          const energy=.4+.5*(.5+.5*Math.sin(t*.18+j+k));
          g.beginPath();g.arc(...node,11,-Math.PI/2,-Math.PI/2+TAU*energy);
          g.strokeStyle=alpha(C.teal,.45);g.lineWidth=strokeScale;g.stroke();
        }
        if(j===Math.floor(t*.13+k)%7){
          ellipse(g,...node,17,12,alpha(C.teal,.45),1,[2,4],-.22);
          packet(g,node,c,parent,t*.35,C.teal,3.2);
        }
        const nextAngle=(j+1)*TAU/7+cluster.phase;
        line(g,node,[head[0]+Math.cos(nextAngle)*81,head[1]+Math.sin(nextAngle)*53],alpha(C.blue,.12),.7);
      }
      hex(g,...head,17,C.paper,C.blue);hex(g,...head,10,alpha(C.blue,.12),alpha(C.blue,.32));dot(g,...head,3,C.blue);
      if(!compact)label(g,`CLUSTER 0${k+1}`,head[0],head[1]+26,C,{align:'center',size:9});
    });
    for(let i=0;i<3;i++)hex(g,hub[0],hub[1]+20-i*12,44-i*2,C.paper,alpha(C.blue,.4));
    hex(g,...hub,37,C.paper,C.blue);hex(g,...hub,25,alpha(C.blue,.1),alpha(C.blue,.3));
    for(let i=0;i<6;i++) {
      const a=t*.045+i*TAU/6;dot(g,hub[0]+Math.cos(a)*56,hub[1]+Math.sin(a)*39,2.7,i%2?C.blue:C.teal);
    }
    chip(g,hub[0]-18,hub[1]-13,36,26,C,'',C.blue);
    if(!compact) {
      label(g,'GATEWAY',hub[0],hub[1]+65,C,{align:'center',color:C.ink,size:10});
      label(g,'MULTI-HOP SENSOR MESH',48,67,C,{size:11,color:C.ink});
      label(g,'ROUTING / CLUSTERING / RF',751,67,C,{align:'right',size:9});
      box(g,52,478,696,66,alpha(C.paper,.82),C.line);label(g,'RF SPECTRUM',69,494,C,{size:9});
      for(let i=0;i<44;i++) {
        const h=5+Math.sin(i*.21+1)**6*22+Math.sin(i*.28-t*.65)**8*8;
        box(g,195+i*7.4,532-h,3.3,h,alpha(i>18&&i<28?C.teal:C.blue,.53),null,1);
      }
      waveform(g,562,518,165,16,t,C,C.teal);
      label(g,'FREQUENCY',195,540,C,{size:8});label(g,'MODULATED SIGNAL',563,540,C,{size:8});
    }
  }

  /* R02: moving UEs, serving-cell association, resource blocks, RL feedback. */
  const cells=[{x:177,y:280},{x:402,y:221},{x:627,y:280}];
  function antenna(g,x,y,C,color,t) {
    poly(g,[[x,y-56],[x-19,y+30],[x+19,y+30],[x,y-56]],color,1.8);
    line(g,[x-10,y-15],[x+10,y-15],color,1.3);line(g,[x-15,y+8],[x+15,y+8],color,1.3);
    line(g,[x-15,y+8],[x+10,y-15],alpha(color,.6));line(g,[x+15,y+8],[x-10,y-15],alpha(color,.6));
    box(g,x-4,y-72,8,23,C.paper,color,2);dot(g,x,y-75,3.6,color);
    for(let side=-1;side<=1;side+=2)for(let i=0;i<2;i++) {
      const r=14+i*11+(t*.8%1)*2;
      g.beginPath();g.arc(x,y-66,r,side<0?Math.PI*.75:-Math.PI*.25,side<0?Math.PI*1.25:Math.PI*.25);
      g.strokeStyle=alpha(color,.4-i*.1);g.lineWidth=1.2;g.stroke();
    }
  }
  function ran(g,t,C,compact) {
    board(g,C,compact);const activeStep=Math.floor((t/16%1)*4);
    cells.forEach((cell,i)=>{
      const {x,y}=cell;
      ellipse(g,x,y+4,128,83,alpha(i===activeStep%3?C.teal:C.blue,.26),1,[3,6],0,alpha(C.blue,.025));
      for(let j=0;j<3;j++) {
        const angle=j*TAU/3-t*.018;
        line(g,[x,y+4],[x+Math.cos(angle)*128,y+4+Math.sin(angle)*83],alpha(C.blue,.15));
        // Sector demand changes independently of the moving devices.
        g.beginPath();g.moveTo(x,y+4);
        g.ellipse(x,y+4,124,80,0,angle,angle+TAU/3);g.closePath();
        g.fillStyle=alpha(j===activeStep%3?C.teal:C.blue,.02+.035*(.5+.5*Math.sin(t*.6+i+j)));
        g.fill();
      }
      const controller=[400,101],ap=[x,y-81],bend=[x,126];
      curve(g,ap,bend,controller,alpha(C.violet,.38),1,[3,5]);
      packet(g,activeStep<2?ap:controller,bend,activeStep<2?controller:ap,t*.18+i*.33,C.violet,2.8);
      antenna(g,x,y,C,i===activeStep%3?C.teal:C.blue,t);
      if(!compact)label(g,`gNB 0${i+1}`,x,y+49,C,{align:'center',size:10,color:C.ink});
    });
    chip(g,337,69,126,62,C,compact?'RL':'RL CONTROLLER',C.violet);
    for(let i=0;i<3;i++) {
      const x=177+i*225;
      for(let j=0;j<8;j++)box(g,x-39+j*10,344+(i===1?-59:0),6,5,alpha(j<(Math.floor(t*.5)+i*3)%6+2?C.teal:C.blue,.42),null,1);
    }
    for(let i=0;i<7;i++) {
      const u=(t*.025+i/7)%1,x=94+u*606,y=359+Math.sin(u*TAU+i*.7)*36;
      const distances=cells.map(c=>(c.x-x)**2+(c.y+40-y)**2);
      const serving=distances.indexOf(Math.min(...distances));
      const a=[x,y-13],b=[cells[serving].x,cells[serving].y-70],c=[(a[0]+b[0])/2,(a[1]+b[1])/2-25];
      curve(g,a,c,b,alpha(C.teal,i===2?.64:.24),i===2?1.5:.8);
      if(i%2===0)packet(g,b,c,a,t*.27+i*.17,C.teal,2.5);
      box(g,x-6,y-11,12,22,C.paper,C.ink,3);line(g,[x-3,y-7],[x+3,y-7],C.teal);dot(g,x,y+7,1.1,C.blue);
      if(i===2)ellipse(g,x,y+3,16,23,alpha(C.teal,.45));
    }
    if(!compact) {
      label(g,'MOBILITY-AWARE RADIO ACCESS',48,38,C,{color:C.ink});
      ['OBSERVE','DECIDE','ALLOCATE','REBALANCE'].forEach((s,i)=>{
        box(g,57+i*178,444,158,31,i===activeStep?alpha(C.violet,.1):alpha(C.paper,.7),i===activeStep?C.violet:C.line,3);
        dot(g,71+i*178,459,2.4,i===activeStep?C.violet:C.line);
        label(g,s,84+i*178,459,C,{size:9,color:i===activeStep?C.violet:C.muted});
      });
      cells.forEach((_,i)=>{
        label(g,`CELL 0${i+1}`,58+i*239,503,C,{size:9});
        for(let j=0;j<12;j++) {
          const on=(j+Math.floor(t*.45)+i*4)%12<7;
          box(g,58+i*239+j*15,521,11,16,on?alpha((j+i)%3?C.blue:C.teal,.65):alpha(C.line,.45),null,1);
        }
      });
      label(g,'CONCEPTUAL TIME–FREQUENCY ALLOCATION',400,562,C,{align:'center',size:9});
    }
  }

  /* R03: cryptographic processor, diffusion, leakage analysis, and trust. */
  function security(g,t,C,compact) {
    board(g,C,compact);const cx=400,cy=267;
    // Key expansion branches feed the transformation, while the trace below
    // makes leakage analysis a separate scientific process.
    [[233,129],[400,112],[567,129]].forEach(([x,y],i)=>{
      const a=[x,y+14],b=[400,174],c=[x,169];
      curve(g,a,c,b,alpha(C.violet,.28),1,[2,5]);
      packet(g,a,c,b,t*.15+i*.33,C.violet,2.2);
      hex(g,x,y,15,C.paper,alpha(C.violet,.6));
      for(let j=0;j<3;j++)line(g,[x-6,y-5+j*5],[x+6-(j%2)*4,y-5+j*5],alpha(C.violet,.65),1.3);
    });
    for(let j=0;j<3;j++) {
      const r=83+j*28;
      ellipse(g,cx,cy,r,r,alpha(j===1?C.teal:C.blue,.25),1,j===1?[2,7]:[5,9]);
      for(let i=0;i<8;i++) {
        const a=i*TAU/8+t*.05*(j%2?-1:1);
        dot(g,cx+r*Math.cos(a),cy+r*Math.sin(a),j===1?2.7:1.8,j===1?C.teal:C.blue);
      }
    }
    const shield=[[400,186],[461,210],[458,279],[438,315],[400,342],[362,315],[342,279],[339,210]];
    poly(g,shield,C.blue,1.8,C.paper,true);
    poly(g,shield.map(([x,y])=>[cx+(x-cx)*.86,cy+(y-cy)*.86]),alpha(C.blue,.22),1,alpha(C.blue,.035),true);
    g.beginPath();g.arc(cx,cy-15,16,Math.PI,TAU);g.strokeStyle=C.ink;g.lineWidth=3;g.stroke();
    box(g,cx-27,cy-15,54,43,alpha(C.blue,.13),C.blue,5);dot(g,cx,cy+1,4,C.ink);line(g,[cx,cy+4],[cx,cy+13],C.ink,2);
    [[64,208,false],[625,208,true]].forEach(([x,y,cipher])=>{
      box(g,x-11,y-17,120,127,alpha(C.paper,.88),C.line,5);
      for(let row=0;row<6;row++)for(let col=0;col<6;col++) {
        const shuffled=(row*11+col*7+Math.floor(t*.65))%9,fill=cipher?shuffled<5:(row+col)%4===0;
        box(g,x+col*17,y+row*15,10,8,fill?alpha(cipher?C.teal:C.blue,.75):alpha(C.line,.48),null,1);
      }
      if(!compact)label(g,cipher?'CIPHERTEXT':'PLAINTEXT',x+49,y+130,C,{align:'center',size:9});
    });
    const left=[[174,256],[240,216],[306,256]],right=[[494,256],[560,216],[614,256]];
    curve(g,...left,alpha(C.blue,.4),1.4);curve(g,...right,alpha(C.teal,.4),1.4);
    for(let i=0;i<3;i++){packet(g,...left,t*.19+i*.33,C.blue,3);packet(g,...right,t*.19+i*.33,C.teal,3);}
    const leakage=[[400,343],[400,412],[260,452]];
    curve(g,...leakage,alpha(C.orange,.5),1,[3,5]);packet(g,...leakage,t*.13,C.orange,2.4);
    box(g,62,411,220,119,alpha(C.paper,.86),C.line,4);
    for(let i=0;i<4;i++)line(g,[77,440+i*19],[267,440+i*19],alpha(C.line,.5));
    waveform(g,77,478,190,27,t*.45,C,C.orange,1);
    const scan=77+(t*.12%1)*190;line(g,[scan,438],[scan,514],alpha(C.orange,.45));
    for(let i=0;i<4;i++) {
      const x=386+i*89;
      if(i<3){line(g,[x+59,473],[x+84,473],alpha(C.teal,.5));packet(g,[x+59,473],[x+72,465],[x+84,473],t*.22+i*.2,C.teal,2.3);}
      box(g,x,441,59,65,alpha(C.paper,.95),alpha(C.teal,.65),5);
      for(let j=0;j<3;j++)line(g,[x+10,455+j*8],[x+28+(j%2)*11,455+j*8],alpha(C.blue,.35),2);
      poly(g,[[x+33,488],[x+38,493],[x+48,481]],C.teal,1.8);
    }
    if(!compact) {
      label(g,'PROTECTED COMPUTATION',400,65,C,{align:'center',color:C.ink});label(g,'KEY / TRANSFORM / VERIFY',400,86,C,{align:'center',size:9});
      label(g,'SIDE-CHANNEL ANALYSIS',77,425,C,{size:9});label(g,'AUTHENTICATED CHAIN',555,525,C,{align:'center',size:9});
      label(g,'LEAKAGE',330,402,C,{size:8,color:C.orange});
      label(g,'KEY EXPANSION',400,143,C,{align:'center',size:8,color:C.violet});
    }
  }

  /* R04: sparse neural processing, recurrent memory, graph compression. */
  const layers=[{x:99,n:6},{x:232,n:8},{x:390,n:3},{x:548,n:7},{x:697,n:5}];
  const ys=(n,i)=>n===3?222+i*43:163+i*199/(n-1);
  function efficient(g,t,C,compact) {
    board(g,C,compact);const cycle=t*.17%5;
    // Input features and the retained representation share a moving envelope.
    waveform(g,68,102,143,20,t,C,C.blue);
    for(let i=0;i<10;i++) {
      const h=7+15*(.5+.5*Math.sin(t*.8+i*.7));
      box(g,588+i*12,117-h,6,h,alpha(i%3?C.teal:C.blue,.46),null,1);
    }
    layers.slice(0,-1).forEach((layer,l)=>{
      const next=layers[l+1];
      for(let i=0;i<layer.n;i++)for(let j=0;j<next.n;j++) {
        const retained=(i*7+j*3+l*5)%7<3;
        const a=[layer.x,ys(layer.n,i)],b=[next.x,ys(next.n,j)],c=[(a[0]+b[0])/2,(a[1]+b[1])/2-9];
        const attention=.72+.28*Math.sin(t*.6+i*.9+j*.3);
        curve(g,a,c,b,alpha(l===1||l===2?C.teal:C.blue,(retained?.34:.06)*attention),retained?1.1:.7);
        if(retained&&(i+j)%3===0)packet(g,a,c,b,(cycle-l)*.8+i*.12+j*.17,l===1||l===2?C.teal:C.blue,2.6);
      }
    });
    box(g,361,159,58,205,alpha(C.teal,.035),alpha(C.teal,.24),28);
    layers.forEach((layer,l)=>{
      for(let i=0;i<layer.n;i++) {
        const y=ys(layer.n,i),active=Math.exp(-(((cycle-l-i*.035)*2.6)**2));
        dot(g,layer.x,y,l===2?11:7,C.paper,alpha(l===2?C.teal:C.blue,.55),1.3);
        dot(g,layer.x,y,(l===2?5:2.5)+active*2,l===2?C.teal:alpha(C.blue,.5+active*.5));
        if(active>.2)dot(g,layer.x,y,11+active*7,null,alpha(C.teal,active*.25));
      }
      if(!compact)label(g,['INPUT','ENCODER','LATENT','DECODER','OUTPUT'][l],layer.x,389,C,{align:'center',size:9,color:l===2?C.teal:C.muted});
    });
    const route=[[390,161],[476,94],[444,95]];
    curve(g,...route,alpha(C.violet,.5),1.3,[3,5]);packet(g,...route,t*.17,C.violet,2.5);
    box(g,342,71,96,48,C.paper,alpha(C.violet,.6),6);
    for(let i=0;i<6;i++)box(g,353+i*13,84,8,22,alpha(C.violet,(Math.floor(t*.55)+i)%6<3?.7:.14),null,2);
    if(!compact) {
      label(g,'INCREMENTAL MEMORY',390,51,C,{align:'center',size:10,color:C.ink});
      label(g,'SIGNAL FEATURES',140,137,C,{align:'center',size:8});
      label(g,'RETAINED FEATURES',643,137,C,{align:'center',size:8});
      label(g,'COMPACT REPRESENTATION',390,423,C,{align:'center',size:9,color:C.teal});
      box(g,53,456,694,91,alpha(C.paper,.88),C.line,5);
      const points=[[80,485],[110,476],[142,492],[99,517],[134,521],[170,502],[190,481]];
      points.forEach((p,i)=>{
        for(let j=i+1;j<points.length;j++)if((i+j)%3!==0)line(g,p,points[j],alpha(C.blue,.18));
        dot(g,...p,4,i%3===0?C.teal:alpha(C.blue,.45));
      });
      curve(g,[204,501],[244,485],[281,501],alpha(C.blue,.4));packet(g,[204,501],[244,485],[281,501],t*.19,C.blue,2.7);
      chip(g,291,480,117,42,C,'GRAPH POLICY',C.teal);
      curve(g,[417,501],[461,485],[503,501],alpha(C.teal,.4));packet(g,[417,501],[461,485],[503,501],t*.19+.5,C.teal,2.7);
      [[524,490],[563,514],[597,482],[632,509]].forEach((p,i,arr)=>{
        if(i)line(g,arr[i-1],p,alpha(C.teal,.5),1.3);
        dot(g,...p,5.5,C.paper,C.teal,1.4);dot(g,...p,2,C.teal);
      });
      label(g,'PROMPT GRAPH',133,536,C,{align:'center',size:8});label(g,'REUSABLE CONTEXT',578,536,C,{align:'center',size:8});
      waveform(g,650,501,73,15,t,C,C.teal);
    }
  }

  const renderers={wireless,ran,security,efficient},states=[];
  let frame=0,C=palette();
  function render(state) {
    const {g,width,height,dpr,compact}=state;if(!width||!height)return;
    strokeScale=compact?2.2:1.2;opacityScale=compact?1.65:1.22;nodeScale=compact?1.25:1;
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
    const artHeight=compact?(state.type==='security'?540:470):600,offsetY=compact?30:0,scale=Math.min(width/800,height/artHeight);
    g.translate((width-800*scale)/2,(height-artHeight*scale)/2-offsetY*scale);g.scale(scale,scale);
    renderers[state.type](g,state.time,C,compact,state.pointer);
    state.host.dataset.motionState=reduced.matches?'still':state.visible&&!document.hidden?'running':'paused';
  }
  function resize(state) {
    const rect=state.host.getBoundingClientRect();state.width=Math.max(0,rect.width);state.height=Math.max(0,rect.height);
    state.dpr=Math.min(window.devicePixelRatio||1,state.compact?1.5:2);
    state.canvas.width=Math.round(state.width*state.dpr);state.canvas.height=Math.round(state.height*state.dpr);render(state);
  }
  function canRun(){return !reduced.matches&&!document.hidden&&states.some(s=>s.visible);}
  function tick(now) {
    frame=0;
    for(const state of states) {
      if(!state.visible)continue;const interval=state.compact?1000/24:1000/30;
      if(state.last&&now-state.last<interval)continue;
      const dt=state.last?Math.min(.1,(now-state.last)/1000):0;state.last=now;state.time+=dt;
      state.pointer.x+=(state.aim.x-state.pointer.x)*.07;state.pointer.y+=(state.aim.y-state.pointer.y)*.07;render(state);
    }
    if(canRun())frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;states.forEach(state=>{state.last=0;render(state);});
    if(canRun())frame=requestAnimationFrame(tick);
  }
  for(const host of hosts) {
    const type=host.dataset.networkScene||host.dataset.researchMotion;if(!renderers[type])continue;
    const compact=host.hasAttribute('data-research-motion')&&!!host.closest('.research-preview');
    const surface=host.querySelector('.research-network-shell')||host;
    const canvas=host.querySelector('canvas')||document.createElement('canvas');
    canvas.className='research-network-canvas';canvas.setAttribute('aria-hidden','true');
    const g=canvas.getContext('2d',{alpha:true});if(!g){host.dataset.motionState='fallback';continue;}
    // Preserve the static SVG until a usable canvas is available.
    surface.replaceChildren(canvas);
    const state={host:surface,canvas,g,type,compact,width:0,height:0,dpr:1,visible:false,time:3.2,last:0,pointer:{x:0,y:0},aim:{x:0,y:0}};
    states.push(state);
    if(!compact) {
      host.addEventListener('pointermove',event=>{
        if(reduced.matches||event.pointerType==='touch')return;const r=host.getBoundingClientRect();
        state.aim={x:clamp((event.clientX-r.left)/r.width-.5,-.5,.5),y:clamp((event.clientY-r.top)/r.height-.5,-.5,.5)};
      },{passive:true});
      host.addEventListener('pointerleave',()=>{state.aim={x:0,y:0};},{passive:true});
    }
    resize(state);
  }
  if('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){const state=states.find(s=>s.host===entry.target);if(state)state.visible=entry.isIntersecting;}
      sync();
    },{threshold:.02});states.forEach(s=>observer.observe(s.host));
  }else states.forEach(s=>{s.visible=true;});
  if('ResizeObserver' in window) {
    const observer=new ResizeObserver(entries=>{
      for(const entry of entries){const state=states.find(s=>s.host===entry.target);if(state)resize(state);}
    });states.forEach(s=>observer.observe(s.host));
  }else window.addEventListener('resize',()=>states.forEach(resize),{passive:true});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  window.addEventListener('site-theme-change',()=>{C=palette();sync();});
  document.fonts?.ready.then(()=>states.forEach(render));sync();
})();
