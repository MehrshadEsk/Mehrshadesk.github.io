/* Research motion system: original vector scenes, progressive enhancement,
 * native SVG animation, and explicit offscreen/reduced-motion lifecycle. */
(() => {
  'use strict';

  const style = `
    .rs-ink{stroke:var(--ink,#292C23);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .rs-rule{stroke:var(--line,#E3D9C8);fill:none;stroke-width:1}
    .rs-soft{fill:var(--surface,#F1EBDF);stroke:var(--line,#E3D9C8);stroke-width:1}
    .rs-face{fill:var(--bg,#FAF7F0);stroke:var(--ink,#292C23);stroke-width:1.3;stroke-linejoin:round}
    .rs-sand{fill:var(--line,#E3D9C8);stroke:var(--ink,#292C23);stroke-width:1.3;stroke-linejoin:round}
    .rs-olive{stroke:var(--olive,#72785A);fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .rs-accent{stroke:var(--accent,#F25432);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .rs-dot{fill:var(--accent,#F25432)}.rs-fill{fill:var(--olive,#72785A)}
    .rs-label{fill:var(--muted,#626750);font:500 13px 'Space Grotesk',sans-serif;letter-spacing:1.3px}
    .rs-small{fill:var(--muted,#626750);font:400 12px 'Space Grotesk',sans-serif;letter-spacing:.5px}
    .rs-name{fill:var(--ink,#292C23);font:500 15px 'Space Grotesk',sans-serif;letter-spacing:.2px}
    .rs-grid{stroke:var(--line,#E3D9C8);stroke-width:.65;opacity:.44;fill:none}
    .rs-trace{stroke:var(--olive,#72785A);fill:none;stroke-width:1.2;opacity:.28}
    .rs-faint{opacity:.3}.rs-boundary{stroke:var(--olive,#72785A);fill:none;stroke-width:1;stroke-dasharray:4 7;opacity:.55}
  `;
  const text = (x,y,label,kind='rs-label',anchor='start') => `<text x="${x}" y="${y}" class="${kind}" text-anchor="${anchor}">${label}</text>`;
  const line = (x1,y1,x2,y2,kind='rs-rule') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${kind}"/>`;
  const circle = (x,y,r,kind='rs-olive') => `<circle cx="${x}" cy="${y}" r="${r}" class="${kind}"/>`;
  const path = (d,kind='rs-olive',extra='') => `<path d="${d}" class="${kind}" ${extra}/>`;
  function animate(attribute,values,duration,begin=0,extra='') {
    return `<animate attributeName="${attribute}" values="${values}" dur="${duration}s" begin="${begin}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".42 0 .58 1;.42 0 .58 1" ${extra}/>`;
  }
  function packet(d,seconds,offset=0,animated=true,color='rs-dot',radius=3) {
    const motion=animated?`<animateMotion path="${d}" dur="${seconds}s" begin="-${offset}s" repeatCount="indefinite" calcMode="paced"/>`:'';
    if(!animated)return '';
    return `<circle r="${radius}" class="${color}" opacity=".92">${motion}</circle>`;
  }
  function pulse(x,y,maxR,offset,animated) {
    return `<circle cx="${x}" cy="${y}" r="${maxR*.65}" class="rs-accent" opacity=".14">${animated?`<animate attributeName="r" values="10;${maxR}" dur="4s" begin="-${offset}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".3;0" dur="4s" begin="-${offset}s" repeatCount="indefinite"/>`:''}</circle>`;
  }
  function sensor(x,y,head=false) {
    return `<g transform="translate(${x} ${y})">${head?'<path d="M-18-6 0-16 18-6 0 4Z" class="rs-sand"/><path d="M-18-6v13l18 10 18-10V-6L0 4Z" class="rs-face"/><path d="M0 4v13" class="rs-ink"/><path d="M-5-5h10M-3-9h6" class="rs-accent"/>':'<path d="M-9-3 0-8 9-3 0 2Z" class="rs-face"/><path d="M-9-3v7l9 5 9-5V-3L0 2Z" class="rs-soft"/>'}<circle cy="${head?-6:-3}" r="${head?2.8:1.8}" class="${head?'rs-dot':'rs-fill'}"/></g>`;
  }
  function chip(x,y,w=80,label='') {
    const pins=[];
    for(let i=-3;i<=3;i++) {
      pins.push(line(x-w/2-10,y+i*7,x-w/2,y+i*7,'rs-ink'));
      pins.push(line(x+w/2,y+i*7,x+w/2+10,y+i*7,'rs-ink'));
    }
    return `<g>${pins.join('')}<rect x="${x-w/2}" y="${y-30}" width="${w}" height="60" rx="4" class="rs-sand"/><rect x="${x-w/2+7}" y="${y-23}" width="${w-14}" height="46" rx="2" class="rs-face"/>${label?text(x,y+4,label,'rs-name','middle'):''}</g>`;
  }
  function isometricGrid() {
    let s='';
    for(let i=0;i<9;i++)s+=path(`M${70+i*60} 270l190 110`,'rs-grid');
    for(let i=0;i<9;i++)s+=path(`M${210+i*60} 260l-190 110`,'rs-grid');
    return `<g>${s}</g>`;
  }
  function wireless(animated) {
    const clusters=[{x:160,y:174,n:[[93,117],[96,218],[187,104],[221,202],[143,245]]},{x:606,y:157,n:[[552,96],[668,106],[683,192],[576,232],[638,237]]},{x:241,y:347,n:[[154,320],[157,388],[258,419],[312,380],[309,304]]},{x:612,y:347,n:[[530,312],[539,399],[636,414],[695,372],[697,293]]}];
    let s=isometricGrid();
    const routes=['M160 174C242 188 305 232 398 256','M606 157C548 178 489 219 423 255','M241 347C292 328 343 296 398 270','M612 347C555 327 490 291 423 270'];
    routes.forEach((d,i)=>s+=path(d,'rs-olive')+packet(d,4.4+i*.2,i*.85,animated));
    clusters.forEach((c,i)=>{
      s+=`<ellipse cx="${c.x}" cy="${c.y+10}" rx="87" ry="46" class="rs-boundary"/>`;
      s+=pulse(c.x,c.y,50,i*.9,animated);
      c.n.forEach(([x,y],j)=>{
        const d=`M${x} ${y}L${c.x} ${c.y}`;
        s+=path(d,'rs-trace')+packet(d,3.3+j*.35,i+j*.4,animated,'rs-fill',2);
        s+=sensor(x,y);
      });
      s+=sensor(c.x,c.y,true);
    });
    s+=`<g transform="translate(410 261)"><path d="M-35-18 0-36 35-18 0 1Z" class="rs-sand"/><path d="M-35-18v40L0 41l35-19v-40L0 1Z" class="rs-face"/><path d="M0 1v40" class="rs-ink"/><path d="M-20 3v15m7-11v15m-1-48 14-7 14 7-14 7Z" class="rs-olive"/><circle cx="-19" cy="-7" r="2" class="rs-dot"/></g>`;
    s+=text(410,331,'GATEWAY','rs-label','middle');
    s+=text(56,58,'WIRELESS SENSOR NETWORK');
    s+=text(744,58,'RF / ROUTING','rs-small','end');
    s+=line(56,450,744,450)+circle(60,472,2,'rs-dot')+text(72,475,'ENERGY-AWARE PATHS','rs-small');
    s+=text(744,475,'ADAPTIVE COVERAGE','rs-small','end');
    return s;
  }
  function tower(x,y) {
    return `<g transform="translate(${x} ${y})"><path d="M0-44-18 22h36L0-44ZM-8-10h16M-12 5h24M-18 22 8-10M18 22-8-10" class="rs-ink"/><path d="M-4-44v-15h8v15" class="rs-accent"/><path d="M-15-57q-9 10 0 20m30-20q9 10 0 20M-23-63q-17 16 0 32m46-32q17 16 0 32" class="rs-olive"/><path d="M-24 24 0 37l24-13-24-13Z" class="rs-soft"/></g>`;
  }
  function device(x,y) {
    return `<g transform="translate(${x} ${y})"><rect x="-5" y="-8" width="10" height="16" rx="2" class="rs-face"/><path d="M-2-5h4" class="rs-olive"/><circle cy="5" r="1" class="rs-fill"/></g>`;
  }
  function ran(animated) {
    let s=text(56,58,'INTELLIGENT RADIO ACCESS')+text(744,58,'OBSERVE / ACT / ADAPT','rs-small','end');
    s+=chip(400,119,120,'RL POLICY');
    const xs=[170,400,630];
    xs.forEach((x,i)=>{
      const control=`M${x} 227C${x} 180 400 194 400 151`;
      s+=path(control,'rs-olive', 'stroke-dasharray="3 5"')+packet(control,4.6,i*.8,animated,'rs-fill',2.5);
      s+=`<ellipse cx="${x}" cy="314" rx="119" ry="65" class="rs-boundary"/><ellipse cx="${x}" cy="314" rx="91" ry="48" class="rs-rule"/>`;
      const users=[[-75,16],[-49,44],[-20,74],[47,31],[77,56],[36,83]];
      users.forEach(([dx,dy],j)=>{
        const d=`M${x} 270L${x+dx} ${260+dy}`;
        s+=path(d,'rs-trace')+packet(d,3+j*.3,j*.6+i,animated,'rs-fill',1.8)+device(x+dx,260+dy);
      });
      s+=tower(x,255)+text(x,390,`CELL 0${i+1}`,'rs-small','middle');
      for(let j=0;j<10;j++)s+=`<rect x="${x-65+j*13}" y="419" width="9" height="17" rx="1" class="${j%3===i?'rs-dot':'rs-fill'}" opacity="${j%3===i?.8:.2}">${animated?animate('opacity',j%3===i?'.25;.9;.25':'.2;.48;.2',6,-i-j*.2):''}</rect>`;
    });
    const mobility='M118 349C255 412 447 289 659 360';
    s+=path(mobility,'rs-accent','stroke-dasharray="2 7" opacity=".35"');
    s+=animated?`<g><animateMotion path="${mobility}" dur="12s" repeatCount="indefinite"/>${circle(0,0,14,'rs-accent')}<rect x="-5" y="-8" width="10" height="16" rx="2" class="rs-face"/><circle cy="5" r="1" class="rs-dot"/></g>`:device(355,357)+circle(355,357,14,'rs-accent');
    s+=line(56,450,744,450)+text(56,475,'MOBILITY-AWARE ASSOCIATION','rs-small')+text(744,475,'QoS-AWARE SCHEDULING','rs-small','end');
    return s;
  }
  function security(animated) {
    let s=text(56,58,'SECURITY &amp; CRYPTOGRAPHY')+text(744,58,'LEAKAGE / TRUST','rs-small','end');
    s+=`<rect x="236" y="99" width="235" height="210" rx="6" class="rs-boundary"/>`;
    s+=text(354,124,'PROTECTED COMPUTATION','rs-small','middle');
    for(let i=0;i<3;i++)s+=`<g transform="translate(${87+i*6} ${173-i*10})"><path d="M0 0h57v56H0Z" class="rs-face"/><path d="M11 15h34M11 25h22M11 35h30" class="rs-rule"/></g>`;
    s+=text(125,260,'INPUT','rs-label','middle');
    const input='M160 202H279',output='M426 202H634';
    s+=path(input,'rs-olive')+packet(input,3.3,.5,animated)+path(output,'rs-olive')+packet(output,4.2,2,animated);
    s+=chip(354,202,110);
    s+=`<g transform="translate(354 199)"><rect x="-13" y="-4" width="26" height="24" rx="2" class="rs-face"/><path d="M-8-4v-10a8 8 0 0 1 16 0v10" class="rs-ink"/><circle cy="6" r="2.5" class="rs-dot"/><path d="M0 7v6" class="rs-accent"/></g>`;
    s+=`<rect x="636" y="165" width="75" height="74" rx="3" class="rs-face"/>`;
    for(let i=0;i<4;i++)for(let j=0;j<6;j++)s+=`<rect x="${647+j*8}" y="${177+i*12}" width="4" height="5" class="${(i+j)%3?'rs-fill':'rs-dot'}" opacity="${(i+j)%3?.4:.8}"/>`;
    s+=text(674,260,'CIPHERTEXT','rs-label','middle');
    const leak='M354 233V280C354 296 197 291 197 330';
    s+=path(leak,'rs-accent','stroke-dasharray="4 6"')+packet(leak,5.2,1.2,animated);
    s+=`<rect x="65" y="336" width="294" height="101" class="rs-soft"/>`+text(81,357,'SIDE-CHANNEL TRACE','rs-small');
    for(let i=0;i<4;i++)s+=line(80,373+i*15,342,373+i*15,'rs-grid');
    const trace='M81 403 93 401 105 405 117 398 129 402 137 383 144 413 152 373 163 409 174 400 185 402 195 397 206 403 216 383 224 410 236 378 245 400 257 401 269 406 280 392 289 400 301 385 312 409 325 402 341 400';
    s+=path(trace,'rs-olive');
    if(animated)s+=`<rect x="80" y="370" width="20" height="48" fill="var(--accent,#F25432)" opacity=".1"><animate attributeName="x" values="80;321;80" dur="10s" repeatCount="indefinite"/></rect>`;
    s+=path('M365 387h55','rs-olive')+packet('M365 387h55',2.4,0,animated);
    for(let i=0;i<3;i++)for(let j=0;j<4;j++)s+=`<rect x="${431+j*14}" y="${356+i*23}" width="9" height="17" rx="1" class="${(i+j)%4===0?'rs-dot':'rs-fill'}" opacity=".4">${animated?animate('opacity','.2;.8;.2',6,-i-j*.3):''}</rect>`;
    s+=text(456,434,'FEATURES','rs-small','middle');
    const nodes=[[584,345],[674,332],[721,381],[618,406],[573,385]];
    [[0,1],[1,2],[2,3],[3,4],[4,0],[0,3],[1,3]].forEach(([a,b],i)=>{
      const d=`M${nodes[a]}L${nodes[b]}`;s+=path(d,i===5?'rs-accent':'rs-trace')+packet(d,3.2+i*.2,i*.4,animated,i===5?'rs-dot':'rs-fill',1.7);
    });
    nodes.forEach(([x,y])=>s+=`<path d="M${x-9} ${y-5}l9-5 9 5v10l-9 5-9-5Z" class="rs-face"/>`);
    s+=text(650,434,'CONTRACT GRAPH','rs-small','middle');
    s+=line(56,450,744,450)+text(56,475,'LEARNED VULNERABILITY ANALYSIS','rs-small')+text(744,475,'SYSTEM ASSUMPTIONS','rs-small','end');
    return s;
  }
  function waveform(x,y,width,height,phase=0) {
    let s='';
    for(let i=0;i<35;i++) {
      const h=6+Math.abs(Math.sin(i*.75+phase)*Math.cos(i*.17+phase))*height;
      const xx=x+i*width/34;
      s+=line(xx,y-h/2,xx,y+h/2, i>10&&i<19?'rs-accent':'rs-olive');
    }
    return s;
  }
  function memory(x,y,animated) {
    let s='';
    for(let i=2;i>=0;i--)s+=`<g transform="translate(${x} ${y+i*16})"><path d="M-45-20 0-43 45-20 0 4Z" class="rs-sand"/><path d="M-45-20v12L0 17l45-25v-12L0 4Z" class="rs-face"/><path d="M0 4v13" class="rs-ink"/><circle cx="-30" cy="-7" r="2" class="${i===0?'rs-dot':'rs-fill'}">${animated?animate('opacity','.3;1;.3',5,-i):''}</circle></g>`;
    return s;
  }
  function efficient(animated) {
    let s=text(56,58,'INTELLIGENT &amp; EFFICIENT AI')+text(744,58,'SIGNAL / MEMORY / CONTEXT','rs-small','end');
    s+=text(62,112,'ACOUSTIC STRUCTURE','rs-small')+text(642,112,'ADAPTATION','rs-small','middle');
    s+=`<rect x="59" y="127" width="210" height="111" class="rs-soft"/>`+waveform(76,179,175,76,.4);
    s+=`<rect x="559" y="127" width="186" height="111" class="rs-soft"/>`+waveform(574,179,155,58,1.3);
    if(animated)s+=`<rect x="64" y="133" width="17" height="98" fill="var(--accent,#F25432)" opacity=".09"><animate attributeName="x" values="64;244;64" dur="9s" repeatCount="indefinite"/></rect>`;
    const toMemory='M271 178H358',fromMemory='M457 178H557';
    s+=path(toMemory,'rs-olive')+packet(toMemory,3.4,0,animated)+path(fromMemory,'rs-olive')+packet(fromMemory,3.4,1.7,animated);
    s+=memory(408,162,animated)+text(408,246,'INCREMENTAL MEMORY','rs-small','middle');
    s+=line(56,280,744,280,'rs-grid');
    const graph=[[93,353],[130,315],[177,327],[218,303],[265,346],[290,389],[239,414],[187,389],[144,427],[97,400],[177,350],[236,371]];
    const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0],[0,10],[10,2],[10,7],[10,11],[11,4],[11,6],[9,7]];
    edges.forEach(([a,b],i)=>s+=path(`M${graph[a]}L${graph[b]}`,[0,1,3,4,5,6].includes(i)?'rs-olive':'rs-trace'));
    graph.forEach(([x,y],i)=>s+=circle(x,y,[1,2,4,5,6,7].includes(i)?6:4,[1,2,4,5,6,7].includes(i)?'rs-face':'rs-soft'));
    s+=text(177,453,'PROMPT STRUCTURE','rs-small','middle');
    s+=chip(410,367,111,'GRAPH RL');
    const streamA='M302 367H343',streamB='M477 367H538';
    s+=path(streamA,'rs-olive')+packet(streamA,2.5,.1,animated)+path(streamB,'rs-accent')+packet(streamB,2.5,1.4,animated);
    const small=[[558,356],[604,324],[657,343],[691,389],[634,414],[583,398]];
    small.forEach(([x,y],i)=>{
      const next=small[(i+1)%small.length],d=`M${x} ${y}L${next}`;
      s+=path(d,'rs-olive')+packet(d,3.3,i*.6,animated,'rs-dot',2.2)+circle(x,y,8,'rs-face')+circle(x,y,2,'rs-dot');
    });
    s+=text(626,453,'COMPACT CONTEXT','rs-small','middle');
    return s;
  }
  const renderers={wireless,ran,security,efficient};
  function wirelessMobile(animated) {
    let s=text(28,38,'ADAPTIVE SENSOR NETWORK');
    const heads=[[91,145],[307,145],[94,363],[306,363]];
    heads.forEach(([x,y],i)=>{
      const route=`M${x} ${y}L200 253`;
      s+=path(route,'rs-olive')+packet(route,4+i*.3,i,animated);
      s+=`<ellipse cx="${x}" cy="${y+7}" rx="61" ry="38" class="rs-boundary"/>`+pulse(x,y,35,i,animated);
      const small=i<2?[[-30,-54],[30,-47],[-39,40]]:[[-34,-48],[39,-39],[-9,51]];
      small.forEach(([dx,dy],j)=>{
        const d=`M${x+dx} ${y+dy}L${x} ${y}`;s+=path(d,'rs-trace')+packet(d,3.5,j*.7+i,animated,'rs-fill',2)+sensor(x+dx,y+dy);
      });
      s+=sensor(x,y,true);
    });
    s+=chip(200,253,96,'GATEWAY')+text(200,308,'ENERGY-AWARE ROUTING','rs-small','middle');
    s+=line(28,451,372,451)+text(28,477,'RF COVERAGE / CLUSTERING','rs-small');
    return s;
  }
  function ranMobile(animated) {
    let s=text(28,38,'INTELLIGENT RADIO ACCESS')+chip(200,103,104,'RL POLICY');
    [75,200,325].forEach((x,i)=>{
      const d=`M${x} 240C${x} 172 200 197 200 135`;
      s+=path(d,'rs-olive','stroke-dasharray="3 5"')+packet(d,4.5,i*.7,animated,'rs-fill',2);
      s+=`<ellipse cx="${x}" cy="303" rx="62" ry="50" class="rs-boundary"/>`+tower(x,271);
      [[-27,60],[29,52],[-4,80]].forEach(([dx,dy],j)=>{
        const r=`M${x} 279L${x+dx} ${264+dy}`;s+=path(r,'rs-trace')+packet(r,3.2,j*.7,animated,'rs-fill',2)+device(x+dx,264+dy);
      });
      s+=text(x,383,`CELL 0${i+1}`,'rs-small','middle');
      for(let j=0;j<5;j++)s+=`<rect x="${x-31+j*13}" y="408" width="9" height="18" class="${j%3===i?'rs-dot':'rs-fill'}" opacity=".4">${animated?animate('opacity','.2;.85;.2',6,-i-j*.3):''}</rect>`;
    });
    const d='M44 348C171 421 228 290 358 351';
    s+=path(d,'rs-accent','stroke-dasharray="2 6" opacity=".4"');
    s+=animated?`<g><animateMotion path="${d}" dur="12s" repeatCount="indefinite"/>${circle(0,0,12,'rs-accent')}<rect x="-4" y="-7" width="8" height="14" rx="2" class="rs-face"/></g>`:device(214,351)+circle(214,351,12,'rs-accent');
    s+=line(28,451,372,451)+text(28,477,'MOBILITY / QoS / ALLOCATION','rs-small');
    return s;
  }
  function securityMobile(animated) {
    let s=text(28,38,'LEAKAGE &amp; TRUST ANALYSIS');
    s+=`<rect x="139" y="81" width="128" height="160" rx="4" class="rs-boundary"/>`+text(203,104,'CRYPTO CORE','rs-small','middle');
    s+=`<rect x="33" y="140" width="40" height="52" class="rs-face"/><path d="M41 154h24m-24 10h17m-17 10h21" class="rs-rule"/>`+text(53,219,'INPUT','rs-small','middle');
    s+=chip(203,161,78);
    s+=`<path d="M194 154v-6a9 9 0 0 1 18 0v6" class="rs-ink"/><rect x="190" y="154" width="26" height="23" rx="2" class="rs-face"/><circle cx="203" cy="164" r="2" class="rs-dot"/>`;
    s+=`<rect x="327" y="140" width="40" height="52" class="rs-face"/>`+text(347,219,'OUTPUT','rs-small','middle');
    ['M74 161H154','M253 161H326'].forEach((d,i)=>s+=path(d,'rs-olive')+packet(d,3.8,i*1.4,animated));
    const leak='M203 193V267';s+=path(leak,'rs-accent','stroke-dasharray="4 6"')+packet(leak,4,1,animated);
    s+=text(28,280,'SIDE-CHANNEL TRACE','rs-small')+`<rect x="28" y="291" width="344" height="61" class="rs-soft"/>`;
    s+=path('M42 327 58 325 69 330 80 323 91 326 103 309 115 335 125 302 134 325 147 327 160 322 170 328 181 309 193 334 205 306 218 323 229 326 240 333 254 315 265 327 278 310 289 335 304 324 320 326 337 320 358 327','rs-olive');
    if(animated)s+=`<rect x="38" y="297" width="17" height="48" fill="var(--accent,#F25432)" opacity=".12"><animate attributeName="x" values="38;345;38" dur="10s" repeatCount="indefinite"/></rect>`;
    for(let i=0;i<3;i++)for(let j=0;j<5;j++)s+=`<rect x="${54+j*15}" y="${378+i*14}" width="9" height="8" class="${(i+j)%4===0?'rs-dot':'rs-fill'}" opacity=".4">${animated?animate('opacity','.2;.8;.2',5,-i-j*.3):''}</rect>`;
    s+=text(88,439,'FEATURES','rs-small','middle');
    const ns=[[269,385],[319,369],[352,409],[301,430],[255,413]];
    ns.forEach(([x,y],i)=>{const d=`M${x} ${y}L${ns[(i+1)%ns.length]}`;s+=path(d,'rs-olive')+packet(d,3.4,i*.4,animated,'rs-dot',2)+circle(x,y,6,'rs-face')});
    s+=text(304,455,'CONTRACT GRAPH','rs-small','middle');
    return s;
  }
  function efficientMobile(animated) {
    let s=text(28,38,'INFORMATION / MEMORY / CONTEXT');
    s+=text(78,111,'SPEECH','rs-small','middle')+text(325,111,'ADAPTATION','rs-small','middle');
    s+=`<rect x="28" y="125" width="104" height="95" class="rs-soft"/><rect x="275" y="125" width="98" height="95" class="rs-soft"/>`;
    s+=waveform(38,172,85,65,.4)+waveform(284,172,80,46,1.3);
    s+=memory(204,157,animated)+text(204,249,'INCREMENTAL MEMORY','rs-small','middle');
    ['M133 172H153','M252 172H273'].forEach((d,i)=>s+=path(d,'rs-olive')+packet(d,2.4,i*.9,animated,'rs-dot',2));
    s+=line(28,278,372,278,'rs-grid');
    const g=[[37,337],[65,313],[103,323],[125,359],[95,398],[57,379],[77,350]];
    g.forEach(([x,y],i)=>{const d=`M${x} ${y}L${g[(i+1)%g.length]}`;s+=path(d,'rs-trace')+circle(x,y,i%2?5:3,'rs-face')});
    s+=path('M37 337 77 350 103 323m-26 27 18 48','rs-olive');
    s+=chip(202,356,78,'GRAPH RL');
    ['M129 356H153','M251 356H275'].forEach((d,i)=>s+=path(d,'rs-olive')+packet(d,2.8,i,animated,'rs-dot',2));
    const compact=[[296,334],[350,346],[341,397],[287,382]];
    compact.forEach(([x,y],i)=>{const d=`M${x} ${y}L${compact[(i+1)%compact.length]}`;s+=path(d,'rs-olive')+packet(d,3,i*.6,animated,'rs-dot',2)+circle(x,y,7,'rs-face')+circle(x,y,1.8,'rs-dot')});
    s+=text(79,438,'PROMPT GRAPH','rs-small','middle')+text(320,438,'COMPACT CONTEXT','rs-small','middle');
    return s;
  }
  const mobileRenderers={wireless:wirelessMobile,ran:ranMobile,security:securityMobile,efficient:efficientMobile};
  function render(type,id,animated=true,mobile=false) {
    const renderer=(mobile?mobileRenderers:renderers)[type]||wireless;
    return `<svg class="research-scene" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mobile?400:800} 500" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${type} research illustration</title><desc id="${id}-desc">Conceptual illustration of the research direction, without experimental measurements.</desc><style>${style}</style><g class="research-scene-content">${renderer(animated)}</g></svg>`;
  }

  if(typeof module==='object'&&module.exports) {
    module.exports={render,types:Object.keys(renderers)};
    return;
  }
  if(typeof document==='undefined')return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const smallViewport=matchMedia('(max-width:760px)');
  const hosts=[...document.querySelectorAll('[data-research-motion]')];
  if(!hosts.length)return;
  let userPaused=false;
  try{userPaused=localStorage.getItem('mehrshad-research-paused')==='1'}catch{}
  const states=[];
  hosts.forEach((host,index)=>{
    const type=host.dataset.researchMotion;
    try{
      const holder=document.createElement('div');
      holder.innerHTML=render(type,`research-${index}`,true,smallViewport.matches&&!host.closest('.research-preview'));
      const svg=holder.firstElementChild;
      const description=host.querySelector('img')?.getAttribute('alt');
      if(description)svg.querySelector('desc').textContent=description;
      host.replaceChildren(svg);
      const state={host,svg,visible:false,type,id:`research-${index}`,description};states.push(state);
      svg.pauseAnimations();svg.setCurrentTime(2.8);
    }catch{host.dataset.motionState='fallback'}
  });
  function sync() {
    for(const state of states) {
      const run=state.visible&&!document.hidden&&!reduced.matches&&!userPaused;
      if(run)state.svg.unpauseAnimations();else state.svg.pauseAnimations();
      state.host.dataset.motionState=run?'running':reduced.matches?'still':'paused';
    }
    for(const button of document.querySelectorAll('[data-research-pause]')) {
      button.disabled=reduced.matches;
      button.setAttribute('aria-pressed',String(userPaused));
      button.setAttribute('aria-label',reduced.matches?'Animation paused by reduced-motion preference':userPaused?'Play research animations':'Pause research animations');
      const label=button.querySelector('span');if(label)label.textContent=reduced.matches?'Still view':userPaused?'Play motion':'Pause motion';
      button.dataset.paused=String(userPaused||reduced.matches);
    }
  }
  if('IntersectionObserver'in window) {
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){const state=states.find(s=>s.host===entry.target);if(state)state.visible=entry.isIntersecting}
      sync();
    },{threshold:.05});
    states.forEach(s=>observer.observe(s.host));
  }else states.forEach(s=>s.visible=true);
  document.querySelectorAll('[data-research-pause]').forEach(button=>button.addEventListener('click',()=>{
    userPaused=!userPaused;
    try{localStorage.setItem('mehrshad-research-paused',userPaused?'1':'0')}catch{}
    sync();
  }));
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  smallViewport.addEventListener('change',()=>{
    for(const state of states) {
      const holder=document.createElement('div');
      holder.innerHTML=render(state.type,state.id,true,smallViewport.matches&&!state.host.closest('.research-preview'));
      state.svg=holder.firstElementChild;
      if(state.description)state.svg.querySelector('desc').textContent=state.description;
      state.svg.pauseAnimations();state.svg.setCurrentTime(2.8);state.host.replaceChildren(state.svg);
    }
    sync();
  });
  sync();
})();
