/* A self-contained WebGL point-cloud volume: no CDN, fonts, trackers or libraries. */
(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) { fallback(); return; }
  const vertex = `
    attribute vec3 aPos;
    attribute float aKind;
    uniform float uTime;
    uniform float uAspect;
    uniform float uMobile;
    uniform vec2 uPointer;
    varying float vAlpha;
    varying float vScan;
    varying float vKind;
    void main(){
      float t=uTime;
      vec3 p=aPos;
      float kind=aKind;
      if(kind<.5){
        float pulse=sin(p.x*5.+t*.46)*cos(p.y*4.-t*.22)*sin(p.z*5.+t*.3);
        p*=1.+pulse*.045;
      }
      float ry=t*.072+uPointer.x*.13;
      float rx=-.24+sin(t*.11)*.07+uPointer.y*.07;
      p.xz=mat2(cos(ry),-sin(ry),sin(ry),cos(ry))*p.xz;
      p.yz=mat2(cos(rx),-sin(rx),sin(rx),cos(rx))*p.yz;
      float perspective=3.8/(4.8+p.z);
      vec2 xy=p.xy*perspective*.79;
      xy.x/=uAspect;
      xy+=vec2(mix(-.42,0.,uMobile),mix(.03,.19,uMobile));
      gl_Position=vec4(xy,p.z*.08,1.);
      float scan=exp(-pow((p.y-sin(t*.35)*1.65)*9.,2.));
      gl_PointSize=clamp((1.8+scan*1.7)*perspective,1.,3.8);
      vAlpha=(.22+.46*(1.-smoothstep(-1.6,1.5,p.z)))*(kind>.5?.36:1.);
      vScan=scan;
      vKind=kind;
    }`;
  const fragment = `
    precision mediump float;
    varying float vAlpha;
    varying float vScan;
    varying float vKind;
    void main(){
      float d=length(gl_PointCoord-.5)*2.;
      if(d>1.) discard;
      vec3 base=mix(vec3(.51,.12,.23),vec3(.93,.42,.15),vScan*.85);
      if(vKind>.5)base=mix(base,vec3(.61,.25,.32),.55);
      gl_FragColor=vec4(base,vAlpha*(1.-d*.6));
    }`;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
    return s;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('WebGL unavailable');
  } catch { fallback(); return; }
  gl.useProgram(program);
  const points = [];
  // Image samples mapped onto a displaced, spherical 3D manifold.
  const mobile = innerWidth <= 720;
  const rows = mobile ? 74 : 105, columns = mobile ? 122 : 182;
  for (let y = 1; y < rows; y++) {
    const lat = y / rows * Math.PI;
    for (let x = 0; x < columns; x++) {
      const lon = x / columns * Math.PI * 2;
      const r = 1.37 + .1 * Math.sin(lat*7 + Math.cos(lon*3)) * Math.cos(lon*6) + .055*Math.sin(lat*15+lon*8);
      const px = Math.sin(lat)*Math.cos(lon), py = Math.cos(lat), pz = Math.sin(lat)*Math.sin(lon);
      // Open sampling seams make depth and the reconstruction structure visible.
      if (Math.sin(lon*3+lat*2)>.97 && y%9>2) continue;
      points.push(px*r, py*r, pz*r, 0);
    }
  }
  // Three sparse, floating image planes and their 3D frame edges.
  for (let layer=0;layer<3;layer++) {
    const z = (layer-1)*1.62;
    for (let y=0;y<=40;y++) for(let x=0;x<=40;x++) {
      const edge = x===0||x===40||y===0||y===40;
      if (!edge && (x%4!==0 || y%4!==0)) continue;
      points.push((x/40-.5)*3.62,(y/40-.5)*3.62,z,1);
    }
  }
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'aPos'),kind=gl.getAttribLocation(program,'aKind');
  gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);
  gl.enableVertexAttribArray(kind);gl.vertexAttribPointer(kind,1,gl.FLOAT,false,16,12);
  const uTime=gl.getUniformLocation(program,'uTime'),uAspect=gl.getUniformLocation(program,'uAspect'),uMobile=gl.getUniformLocation(program,'uMobile'),uPointer=gl.getUniformLocation(program,'uPointer');
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  let paused=reduced.matches,raf=0,elapsed=0,last=0,pointer=[0,0],lastDraw=0;
  function size(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform1f(uAspect,innerWidth/innerHeight);gl.uniform1f(uMobile,innerWidth<=720?1:0);
    draw();
  }
  function draw(){
    gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uTime,elapsed+12);gl.uniform2fv(uPointer,pointer);
    gl.drawArrays(gl.POINTS,0,points.length/4);
  }
  function tick(now){
    if(paused||document.hidden){raf=0;return;}
    if(last)elapsed+=Math.min((now-last)/1000,.06);last=now;
    if(now-lastDraw>32){draw();lastDraw=now;}
    raf=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(raf);raf=0;last=0;
    if(!paused&&!document.hidden)raf=requestAnimationFrame(tick);
  }
  reduced.addEventListener('change',e=>{paused=e.matches;sync();draw();});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',size,{passive:true});
  window.addEventListener('pointermove',e=>{pointer=[e.clientX/innerWidth-.5,e.clientY/innerHeight-.5];},{passive:true});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;sync();fallback();});
  size();sync();

  function fallback() {
    // Real perspective projection of the same sampled volume, for WebGL-disabled
    // browsers. This path also keeps the background usable on older hardware.
    const surface = document.createElement('canvas');
    surface.id = 'scene'; surface.setAttribute('aria-hidden', 'true');
    canvas.replaceWith(surface);
    const ctx = surface.getContext('2d', { alpha: true });
    if (!ctx) return;
    const cloud = [];
    const rings = innerWidth < 720 ? 43 : 60;
    const segments = innerWidth < 720 ? 75 : 104;
    for (let y = 1; y < rings; y++) {
      const lat = y / rings * Math.PI;
      for (let x = 0; x < segments; x++) {
        const lon = x / segments * Math.PI * 2;
        if (Math.sin(lon * 3 + lat * 2) > .97 && y % 9 > 2) continue;
        const r = 1.37 + .1 * Math.sin(lat*7+Math.cos(lon*3))*Math.cos(lon*6) + .055*Math.sin(lat*15+lon*8);
        cloud.push([Math.sin(lat)*Math.cos(lon)*r, Math.cos(lat)*r, Math.sin(lat)*Math.sin(lon)*r]);
      }
    }
    let width=0,height=0,dpr=1,stopped=reduced.matches,time=12,previous=0,frame=0,painted=0;
    let pointerX=0,pointerY=0;
    function resize() {
      width=innerWidth; height=innerHeight; dpr=Math.min(devicePixelRatio||1,1.3);
      surface.width=width*dpr;surface.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);paint();
    }
    function project(point) {
      const ry=time*.072+pointerX*.13,rx=-.24+Math.sin(time*.11)*.07+pointerY*.07;
      let x=point[0]*Math.cos(ry)-point[2]*Math.sin(ry),z=point[0]*Math.sin(ry)+point[2]*Math.cos(ry);
      const y=point[1]*Math.cos(rx)-z*Math.sin(rx);z=point[1]*Math.sin(rx)+z*Math.cos(rx);
      const scale=3.8/(4.8+z),unit=Math.min(height*.31,width*(width<721?.38:.25));
      return [width*(width<721?.5:.285)+x*scale*unit,height*(width<721?.40:.49)-y*scale*unit,z,y,scale];
    }
    function paint() {
      ctx.clearRect(0,0,width,height);
      // Reconstructed samples glow at the moving cross-sectional scan.
      const scan=Math.sin(time*.35)*1.65;
      const samples=cloud.map(p=>project(p)).sort((a,b)=>b[2]-a[2]);
      for(const p of samples) {
        const hit=Math.exp(-Math.pow((p[3]-scan)*9,2));
        const alpha=.18+(.5*(1.6-p[2])/3.2);
        ctx.fillStyle=hit>.22?`rgba(237,106,39,${Math.min(.9,alpha+hit*.35)})`:`rgba(130,30,58,${alpha})`;
        const s=Math.max(.7,(1.15+hit*.8)*p[4]);ctx.fillRect(p[0],p[1],s,s);
      }
      // Perspective image planes, sampling grids and corner brackets.
      ctx.lineWidth=.7;
      for(let l=-1;l<=1;l++) {
        for(let axis=0;axis<2;axis++) for(let line=0;line<=8;line++) {
          const fixed=(line/8-.5)*3.62;
          const a=axis?[fixed,-1.81,l*1.62]:[-1.81,fixed,l*1.62];
          const b=axis?[fixed,1.81,l*1.62]:[1.81,fixed,l*1.62];
          const pa=project(a),pb=project(b);
          ctx.strokeStyle=line===0||line===8?'rgba(130,30,58,.18)':'rgba(130,30,58,.045)';
          ctx.beginPath();ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1]);ctx.stroke();
        }
        ctx.strokeStyle='rgba(237,106,39,.46)';ctx.lineWidth=1;
        for(const x of [-1,1])for(const y of [-1,1]) {
          const a=project([x*1.81,y*1.55,l*1.62]),b=project([x*1.81,y*1.81,l*1.62]),c=project([x*1.55,y*1.81,l*1.62]);
          ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.stroke();
        }
      }
    }
    function animate(now) {
      if(stopped||document.hidden){frame=0;return;}
      if(previous)time+=Math.min((now-previous)/1000,.06);previous=now;
      if(now-painted>40){paint();painted=now;}
      frame=requestAnimationFrame(animate);
    }
    function state() {
      cancelAnimationFrame(frame);previous=0;
      if(!stopped&&!document.hidden)frame=requestAnimationFrame(animate);
    }
    reduced.addEventListener('change',e=>{stopped=e.matches;state();paint();});
    document.addEventListener('visibilitychange',state);
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('pointermove',e=>{pointerX=e.clientX/innerWidth-.5;pointerY=e.clientY/innerHeight-.5;},{passive:true});
    resize();state();
  }
})();
