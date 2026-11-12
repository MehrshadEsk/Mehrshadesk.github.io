/* Only active-section navigation; all content stays visible without JS. */
(() => {'use strict';
 const links=[...document.querySelectorAll('.portfolio-nav a')].filter(a=>a.getAttribute('href').startsWith('#'));
 const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
 let scheduled=false;
 function update(){scheduled=false;let current='';for(const s of sections)if(s.getBoundingClientRect().top<180)current='#'+s.id;
  for(const a of links)if(a.hash===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');}
 const queue=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);update();
})();
