(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scenes = document.querySelectorAll('.research-stage--network[data-network-scene]');
  if (!scenes.length) return;

  const configs = {
    wireless: { seed: 11, nodes: 90, radius: 0.97, rotY: -0.42, rotX: -0.12, pulseEvery: 1, blue: '#68afcf', deep: '#2a82ba', line: 'rgba(68,143,187,0.78)', ambient: 'rgba(90,186,224,0.13)' },
    ran:      { seed: 23, nodes: 96, radius: 0.99, rotY: -0.48, rotX: -0.10, pulseEvery: 1, blue: '#5eaed6', deep: '#1d7bb6', line: 'rgba(45,133,188,0.80)', ambient: 'rgba(81,180,225,0.14)' },
    security: { seed: 37, nodes: 88, radius: 0.95, rotY: -0.36, rotX: -0.14, pulseEvery: 1, blue: '#6fb8d7', deep: '#1c7398', line: 'rgba(70,132,168,0.74)', ambient: 'rgba(87,171,203,0.11)' },
    efficient:{ seed: 53, nodes: 92, radius: 0.98, rotY: -0.40, rotX: -0.08, pulseEvery: 1, blue: '#73b5d2', deep: '#237eb5', line: 'rgba(66,140,184,0.76)', ambient: 'rgba(100,187,224,0.12)' }
  };

  function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  function buildSphere(config){
    const rand = mulberry32(config.seed);
    const nodes = [], edges = [];
    const count = config.nodes;
    for (let i=0; i<count; i++) {
      const yy = 1 - 2 * (i + 0.5) / count;
      const r = Math.sqrt(1 - yy * yy);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      const jitter = (0.89 + rand() * 0.18) * config.radius;
      nodes.push({
        x: Math.cos(th) * r * jitter,
        y: yy * jitter,
        z: Math.sin(th) * r * jitter,
        weight: (i % 12 === 0 ? 1.7 : (i % 7 === 0 ? 1.2 : 1)),
        phase: i * 0.29 + rand() * 0.7
      });
    }
    nodes.forEach((a, i) => {
      const matches = nodes.map((b, j) => ({ j, d: (a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2 }))
        .filter(v => v.j !== i)
        .sort((x,y)=>x.d-y.d)
        .slice(0, i % 4 === 0 ? 4 : 3);
      matches.forEach(({j, d}, k) => {
        if (j > i && d < 0.52) edges.push({ a:i, b:j, d, phase:(i+j)*0.71 + k*0.33, speed:0.22 + ((i+j)%7)*0.04 });
      });
    });
    return {nodes, edges};
  }

  function attach(stage){
    const canvas = stage.querySelector('.research-network-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d', {alpha:true});
    if (!context) return;
    const key = stage.dataset.networkScene || 'wireless';
    const config = configs[key] || configs.wireless;
    const sphere = buildSphere(config);
    const nodes = sphere.nodes, edges = sphere.edges;
    let w = 300, h = 300, dpr = 1, last = 0, time = 0, paused = false;
    let rotY = config.rotY, rotX = config.rotX, targetY = config.rotY, targetX = config.rotX;

    function resize(){
      const rect = stage.getBoundingClientRect();
      w = Math.max(260, rect.width); h = Math.max(280, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});

    const pointer = e => {
      const rect = stage.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
      targetY = config.rotY + mouseX * 0.72;
      targetX = config.rotX - mouseY * 0.40;
    };
    stage.addEventListener('pointermove', pointer, {passive:true});
    stage.addEventListener('pointerleave', () => { targetY = config.rotY; targetX = config.rotX; });

    function transform(node, extra){
      let a = rotY + extra, b = rotX;
      let x = node.x * Math.cos(a) - node.z * Math.sin(a);
      let z = node.x * Math.sin(a) + node.z * Math.cos(a);
      let y = node.y * Math.cos(b) - z * Math.sin(b);
      z = node.y * Math.sin(b) + z * Math.cos(b);
      const persp = 3.85 / (3.85 - z);
      const size = Math.min(w * 0.355, h * 0.415);
      return { x: w * 0.54 + x * size * persp, y: h * 0.50 + y * size * persp, z, s: persp };
    }
    function glow(x,y,r,a){
      const g = context.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, `rgba(100,188,224,${a})`);
      g.addColorStop(0.35, `rgba(120,200,230,${a*0.42})`);
      g.addColorStop(1, 'rgba(87,180,223,0)');
      return g;
    }

    function draw(now){
      if (document.hidden) { last = now; requestAnimationFrame(draw); return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      if (!reducedMotion && !paused) {
        time += dt;
        rotY += (targetY - rotY) * Math.min(1, dt * 1.8);
        rotX += (targetX - rotX) * Math.min(1, dt * 1.8);
      }
      context.clearRect(0,0,w,h);

      const ambient = context.createRadialGradient(w*0.55,h*0.50,0,w*0.55,h*0.50,w*0.45);
      ambient.addColorStop(0, config.ambient);
      ambient.addColorStop(0.55, 'rgba(99,186,225,0.05)');
      ambient.addColorStop(1, 'rgba(99,186,225,0)');
      context.fillStyle = ambient;
      context.beginPath(); context.arc(w*0.55,h*0.50,w*0.45,0,Math.PI*2); context.fill();

      const ringX = w*0.545, ringY = h*0.505, ringR = Math.min(w,h)*0.34;
      context.strokeStyle = 'rgba(160,203,226,0.30)';
      context.lineWidth = 1;
      context.setLineDash([3,6]);
      context.beginPath(); context.ellipse(ringX, ringY, ringR, ringR*1.02, 0, 0, Math.PI*2); context.stroke();
      context.beginPath(); context.ellipse(ringX, ringY, ringR*0.84, ringR*0.88, 0, 0, Math.PI*2); context.stroke();
      context.setLineDash([]);

      const projections = nodes.map(n => transform(n, time*0.09));
      const ordered = edges.slice().sort((a,b)=>(projections[a.a].z + projections[a.b].z) - (projections[b.a].z + projections[b.b].z));
      for (const e of ordered) {
        const a = projections[e.a], b = projections[e.b];
        const depth = (a.z + b.z) * 0.5;
        const alpha = Math.min(0.82, Math.max(0.11, 0.28 + depth*0.22));
        const curvature = Math.sin(e.phase) * 6;
        const mx = (a.x+b.x)/2 + curvature;
        const my = (a.y+b.y)/2 - curvature;
        context.beginPath();
        context.moveTo(a.x,a.y);
        context.quadraticCurveTo(mx,my,b.x,b.y);
        context.strokeStyle = config.line.replace(/0\.[0-9]+\)/, `${alpha.toFixed(2)})`);
        context.lineWidth = depth > 0.18 ? 1.05 : 0.72;
        context.stroke();
        if (e.d < 0.36) {
          const p = (time * e.speed + e.phase) % 1;
          const inv = 1 - p;
          const px = inv*inv*a.x + 2*inv*p*mx + p*p*b.x;
          const py = inv*inv*a.y + 2*inv*p*my + p*p*b.y;
          context.fillStyle = glow(px, py, 13, 0.18 + Math.max(0, depth)*0.12);
          context.beginPath(); context.arc(px,py,14,0,Math.PI*2); context.fill();
          context.fillStyle = config.deep;
          context.beginPath(); context.arc(px,py,2.05 + Math.max(0, depth)*0.7,0,Math.PI*2); context.fill();
        }
      }
      projections.map((p,i)=>({...p, i})).sort((a,b)=>a.z-b.z).forEach(p => {
        const radius = (nodes[p.i].weight*2.4 + 1.3) * p.s;
        const alpha = Math.min(1, Math.max(0.24, 0.58 + p.z*0.22));
        context.fillStyle = glow(p.x,p.y,radius*4.5,(p.z+1.4)*0.11);
        context.beginPath(); context.arc(p.x,p.y,radius*4.4,0,Math.PI*2); context.fill();
        context.fillStyle = `rgba(255,255,255,${alpha})`;
        context.beginPath(); context.arc(p.x,p.y,radius+1.25,0,Math.PI*2); context.fill();
        context.fillStyle = nodes[p.i].weight > 1.4 ? config.deep : config.blue;
        context.beginPath(); context.arc(p.x,p.y,radius*0.72,0,Math.PI*2); context.fill();
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  scenes.forEach(attach);
})();
