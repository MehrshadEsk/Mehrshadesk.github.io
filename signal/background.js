/* Procedural image samples, a Sobel edge map and a moving 3x3 kernel.
   Perspective-projected voxel faces; no libraries, assets or network requests. */
(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const N = 26;
  const extent = 2.94;
  const step = extent / N;
  const pixels = [];
  const image = [];
  const edges = [];
  const orange = [237, 106, 39];
  const burgundy = [130, 30, 58];
  let width = 0, height = 0, unit = 1, cx = 0, cy = 0;
  let raf = 0, last = 0, drawn = 0, time = 0;
  let pointer = [0, 0], eased = [0, 0];
  let sinY, cosY, sinX, cosX;

  // Synthetic grayscale image. Its samples become individual square voxels.
  for (let row = 0; row < N; row++) {
    image[row] = [];
    for (let col = 0; col < N; col++) {
      const x = (col + .5) / N * 2 - 1;
      const y = (row + .5) / N * 2 - 1;
      const radius = Math.hypot(x + .08, y - .06);
      const ring = Math.exp(-Math.pow((radius - .52) * 7.2, 2));
      const core = Math.exp(-((x - .20) ** 2 + (y + .16) ** 2) * 10);
      const diagonal = Math.exp(-Math.pow((x + y * .65 + .24) * 4, 2)) * .22;
      const window = Math.pow(Math.max(0, 1 - Math.max(Math.abs(x), Math.abs(y)) ** 4), 2);
      image[row][col] = Math.min(1, (.14 + .64 * ring + .42 * core + diagonal) * window);
    }
  }
  const sample = (r, c) => image[Math.max(0, Math.min(N - 1, r))][Math.max(0, Math.min(N - 1, c))];
  for (let row = 0; row < N; row++) {
    edges[row] = [];
    for (let col = 0; col < N; col++) {
      const gx = -sample(row-1,col-1) + sample(row-1,col+1) - 2*sample(row,col-1) + 2*sample(row,col+1) - sample(row+1,col-1) + sample(row+1,col+1);
      const gy = -sample(row-1,col-1) - 2*sample(row-1,col) - sample(row-1,col+1) + sample(row+1,col-1) + 2*sample(row+1,col) + sample(row+1,col+1);
      edges[row][col] = Math.min(1, Math.hypot(gx, gy) * .83);
      pixels.push({ x: (col+.5)*step-extent/2, y: extent/2-(row+.5)*step, row, col, value: image[row][col], edge: edges[row][col] });
    }
  }

  function project(x, y, z) {
    const xx = x*cosY + z*sinY;
    const zz = -x*sinY + z*cosY;
    const yy = y*cosX - zz*sinX;
    const depth = y*sinX + zz*cosX;
    const perspective = 6.4 / (6.4-depth);
    return [cx + xx*unit*perspective, cy - yy*unit*perspective, depth];
  }
  function polygon(points, fill, stroke, lineWidth = .55) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function rgba(color, alpha) { return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`; }
  function color(value) {
    const blend = Math.max(0, Math.min(1, (value-.12)*1.16));
    return burgundy.map((v, i) => Math.round(v + (orange[i]-v)*blend));
  }
  function frame(z, offset, opacity) {
    const s = extent/2 + .10;
    const corner = .19;
    const p = (x, y) => project(x+offset, y+offset*.45, z);
    polygon([p(-s,-s),p(s,-s),p(s,s),p(-s,s)], null, `rgba(130,30,58,${opacity*.26})`, .65);
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      const a = p(x*s,y*(s-corner)), b = p(x*s,y*s), c = p(x*(s-corner),y*s);
      ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]);
      ctx.strokeStyle = rgba(orange, opacity); ctx.lineWidth = 1; ctx.stroke();
    }
  }
  function imagePlane(z, offset, edgeMap) {
    const half = step * .405;
    for (const pixel of pixels) {
      const value = edgeMap ? pixel.edge : pixel.value;
      if (value < .035) continue;
      const x = pixel.x+offset, y = pixel.y+offset*.45;
      const corners = [project(x-half,y-half,z),project(x+half,y-half,z),project(x+half,y+half,z),project(x-half,y+half,z)];
      polygon(corners, rgba(edgeMap?burgundy:orange, .025 + value*.10));
    }
    frame(z, offset, .26);
  }
  function paint() {
    ctx.clearRect(0,0,width,height);
    eased[0] += (pointer[0]-eased[0])*.07;
    eased[1] += (pointer[1]-eased[1])*.07;
    const rotationY = -.43 + Math.sin(time*.17)*.12 + eased[0]*.10;
    const rotationX = .25 + Math.cos(time*.13)*.055 - eased[1]*.07;
    sinY=Math.sin(rotationY);cosY=Math.cos(rotationY);sinX=Math.sin(rotationX);cosX=Math.cos(rotationX);

    // A soft ground shadow separates the floating matrix from the white page.
    const shadowY = cy + extent*unit*.63;
    ctx.save(); ctx.translate(cx+12, shadowY); ctx.scale(1,.19);
    const shadow = ctx.createRadialGradient(0,0,0,0,0,unit*1.62);
    shadow.addColorStop(0,'rgba(130,30,58,.07)');shadow.addColorStop(1,'rgba(130,30,58,0)');
    ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,unit*1.62,0,Math.PI*2);ctx.fill();ctx.restore();

    // Two quieter image layers reveal the depth of the processing stack.
    imagePlane(-1.02, -.10, true);
    imagePlane(-.55, -.04, false);
    frame(-.08, 0, .48);

    const scan = (Math.sin(time*.39-.5)*.5+.5)*(extent+.3)-extent/2-.15;
    const kernelX = Math.round((Math.sin(time*.27)*.5+.5)*(N-5))+2;
    const kernelY = Math.round((Math.sin(time*.19+1.1)*.5+.5)*(N-5))+2;
    const mix = .13 + (Math.sin(time*.18)*.5+.5)*.16;
    const faces = [];
    const half = step*.413;
    const baseZ = -.035;
    const addFace = (vertices,fill,stroke) => {
      const points = vertices.map(p=>project(p[0],p[1],p[2]));
      faces.push({ points, fill, stroke, depth: points.reduce((sum,p)=>sum+p[2],0)/points.length });
    };
    for (const pixel of pixels) {
      const {x,y,row,col} = pixel;
      const value = pixel.value*(1-mix)+pixel.edge*mix;
      const band = Math.exp(-Math.pow((x-scan)*6.4,2));
      const kernel = Math.abs(col-kernelX)<=1 && Math.abs(row-kernelY)<=1;
      const z = .025 + Math.round(value*8)/8*.59 + band*.045;
      const x0=x-half,x1=x+half,y0=y-half,y1=y+half;
      let front = color(value);
      if (band>.25 || kernel) front=orange;
      const alpha = .13 + Math.pow(value,.68)*.79 + band*.06;
      const sideColor = color(value*.45);
      // Positive X and Y faces are visible from the selected camera angle.
      if (value>.075) {
        addFace([[x1,y0,baseZ],[x1,y1,baseZ],[x1,y1,z],[x1,y0,z]],rgba(sideColor,Math.min(.65,alpha*.72)));
        addFace([[x0,y1,baseZ],[x1,y1,baseZ],[x1,y1,z],[x0,y1,z]],rgba(front,Math.min(.68,alpha*.75)));
      }
      addFace([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],rgba(front,Math.min(.98,alpha)),kernel?'rgba(237,106,39,.85)':null);
    }
    faces.sort((a,b)=>a.depth-b.depth);
    for (const face of faces) polygon(face.points,face.fill,face.stroke);

    // A thin orange scan plane travels across the square pixel volume.
    if (scan>-extent/2 && scan<extent/2) {
      const scanPlane=[project(scan,-extent/2,-.10),project(scan,extent/2,-.10),project(scan,extent/2,.72),project(scan,-extent/2,.72)];
      polygon(scanPlane,'rgba(237,106,39,.035)','rgba(237,106,39,.27)',.7);
    }
    // The projected 3x3 kernel marks a real neighbourhood in the source image.
    const centerX=(kernelX+.5)*step-extent/2,centerY=extent/2-(kernelY+.5)*step;
    const h=step*1.52;
    const kernelZ=.79;
    const corners=[project(centerX-h,centerY-h,kernelZ),project(centerX+h,centerY-h,kernelZ),project(centerX+h,centerY+h,kernelZ),project(centerX-h,centerY+h,kernelZ)];
    polygon(corners,'rgba(237,106,39,.025)','rgba(237,106,39,.78)',1);
    // One faint projection ray links the filter window to the edge-map layer.
    const source=project(centerX,centerY,-1.02),target=project(centerX,centerY,kernelZ);
    ctx.beginPath();ctx.moveTo(source[0],source[1]);ctx.lineTo(target[0],target[1]);ctx.setLineDash([2,5]);
    ctx.strokeStyle='rgba(130,30,58,.16)';ctx.lineWidth=.6;ctx.stroke();ctx.setLineDash([]);
  }
  function resize() {
    width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const mobile=width<=720;
    unit=mobile?Math.min(width*.19,height*.13):Math.min(width*.112,height*.175);
    cx=width*(mobile?.44:.285);cy=height*(mobile?.40:.515);
    paint();
  }
  function animate(now) {
    if (reduced.matches||document.hidden) { raf=0;return; }
    if (last) time+=Math.min((now-last)/1000,.075);
    last=now;
    if (now-drawn>=38) { paint();drawn=now; }
    raf=requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(raf);raf=0;last=0;
    if (!reduced.matches&&!document.hidden) raf=requestAnimationFrame(animate);
    else if (!document.hidden) paint();
  }
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pointermove',event=>{pointer=[event.clientX/width-.5,event.clientY/height-.5];},{passive:true});
  resize();sync();
})();
