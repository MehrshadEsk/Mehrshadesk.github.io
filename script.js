(()=>{
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = document.getElementById('site-intro');
  if (!reduced) document.body.classList.add('motion-ready');

  if (intro) {
    if (reduced) {
      intro.remove();
    } else {
      window.setTimeout(() => intro.classList.add('is-ready'), 620);
      window.setTimeout(() => intro.classList.add('is-leaving'), 1120);
      window.setTimeout(() => intro.remove(), 1640);
    }
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const portrait = document.querySelector('.hero-portrait');
  if (portrait) {
    const fallback = () => {
      if (!portrait.dataset.fallback) return;
      const src = portrait.dataset.fallback;
      delete portrait.dataset.fallback;
      portrait.src = src;
    };
    portrait.addEventListener('error', fallback, {once:true});
    if (portrait.complete && !portrait.naturalWidth) fallback();
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    reveals.forEach((el, index) => {
      el.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 55}ms`);
      observer.observe(el);
    });
  }

  const header = document.querySelector('.site-header');
  let lastY = window.scrollY;
  const updateHeader = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 18);
    document.documentElement.style.setProperty('--scroll-y', `${y}px`);
    lastY = y;
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, {passive:true});

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block:'start'});
      history.replaceState(null, '', id);
    });
  });
})();
