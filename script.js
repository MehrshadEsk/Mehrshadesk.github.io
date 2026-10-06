/* A subtle reading indicator and section navigation. All content is visible without JS. */
(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.getElementById('site-intro')?.remove();
 const reveals = [...document.querySelectorAll('.reveal')];
 if (!reduced && 'IntersectionObserver' in window) {
  document.body.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
   for (const entry of entries) if (entry.isIntersecting) {entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  }, {threshold:.08});reveals.forEach(element => observer.observe(element));
 }
 const progress = document.createElement('div');progress.className = 'reading-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 const links = [...document.querySelectorAll('.portfolio-nav a')];
 const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
 let scheduled = false;
 function updateNavigation() {
  scheduled = false;
  const headerHeight = document.querySelector('.site-header')?.offsetHeight || 88;
  let current = '';
  for (const section of sections) if (section.getBoundingClientRect().top <= headerHeight + 110) current = '#' + section.id;
  for (const link of links) {
   if (link.hash === current) link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  }
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
 }
 const queue = () => {if (!scheduled) {scheduled = true;requestAnimationFrame(updateNavigation);}};
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
 document.fonts?.ready.then(queue);updateNavigation();
})();
