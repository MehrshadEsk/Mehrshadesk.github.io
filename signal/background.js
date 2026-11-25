(() => {
  const canvas=document.getElementById('scene');
  const ctx=canvas?.getContext('2d'); if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let w,h,frame;
  function resize(){const d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
  function draw(t=0){ctx.clearRect(0,0,w,h);for(let j=0;j<7;j++){ctx.beginPath();ctx.strokeStyle=`rgba(130,30,58,${0.032+j*.004})`;ctx.lineWidth=1;for(let x=0;x<=w+8;x+=8){const y=h*(.31+j*.075)+Math.sin(x/155+j*.65+t*.00035)*30+Math.sin(x/75-t*.00018+j)*12;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}if(!reduced.matches)frame=requestAnimationFrame(draw);}
  function restart(){cancelAnimationFrame(frame);resize();draw();}addEventListener('resize',restart);reduced.addEventListener?.('change',restart);restart();
})();
