/* Portfolio navigation and optional reveal motion; content is visible without JavaScript. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('site-intro')?.remove();
  const reveals = [...document.querySelectorAll('.reveal')];
  if (!reduced && 'IntersectionObserver' in window) {
    document.body.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    reveals.forEach(element => observer.observe(element));
  }
  const navLinks = [...document.querySelectorAll('.portfolio-nav a')];
  const sections = navLinks.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  let scheduled = false;
  function updateNavigation() {
    scheduled = false;
    const headerHeight = document.querySelector('.site-header')?.offsetHeight || 86;
    let current = '';
    for (const section of sections) if (section.getBoundingClientRect().top <= headerHeight + 110) current = '#' + section.id;
    for (const link of navLinks) {
      if (link.hash === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateNavigation);
  }, { passive: true });
  updateNavigation();
})();
