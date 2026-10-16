/* Connected navigation, section transitions, and an accessible mobile drawer. */
(() => {
  'use strict';

  const sidebar = document.getElementById('portfolio-sidebar');
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const close = document.querySelector('[data-sidebar-close]');
  const backdrop = document.querySelector('[data-sidebar-backdrop]');
  const content = document.getElementById('portfolio-content');
  const toolbar = document.querySelector('.portfolio-topbar');
  const track = document.querySelector('.sidebar-nav-track');
  if (!sidebar || !toggle || !close || !backdrop || !content || !toolbar || !track) return;

  const mobile = window.matchMedia('(max-width: 1024px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const links = [...sidebar.querySelectorAll('.sidebar-nav-link[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  const counter = sidebar.querySelector('[data-section-number]');
  const location = toolbar.querySelector('[data-current-section]');
  let isOpen = false;
  let scheduled = false;
  let activeIndex = -1;
  let motionFrame = 0;
  let motionTimer = 0;

  function focusableElements() {
    return [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
      .filter(element => element.getClientRects().length > 0);
  }

  function setOpen(open, restoreFocus = false) {
    isOpen = mobile.matches && open;
    document.body.toggleAttribute('data-sidebar-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    backdrop.hidden = !isOpen;
    content.inert = isOpen;
    sidebar.inert = mobile.matches && !isOpen;

    if (mobile.matches) {
      sidebar.setAttribute('aria-hidden', String(!isOpen));
      if (isOpen) {
        sidebar.setAttribute('role', 'dialog');
        sidebar.setAttribute('aria-modal', 'true');
      } else {
        sidebar.removeAttribute('role');
        sidebar.removeAttribute('aria-modal');
      }
    } else {
      sidebar.removeAttribute('aria-hidden');
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
    }

    if (isOpen) close.focus();
    else if (restoreFocus) toggle.focus();
  }

  function alignMarker(link) {
    if (!link) return;
    const height = link.offsetHeight;
    const offset = link.offsetTop;
    const firstCenter = (links[0]?.offsetHeight || height) / 2;
    track.style.setProperty('--active-offset', `${offset}px`);
    track.style.setProperty('--active-height', `${height}px`);
    track.style.setProperty('--rail-progress', `${Math.max(0, offset + height / 2 - firstCenter)}px`);
  }

  function animateSelection(link) {
    window.clearTimeout(motionTimer);
    window.cancelAnimationFrame(motionFrame);
    sidebar.classList.remove('is-section-changing');
    for (const item of links) item.classList.remove('is-arriving');
    if (reducedMotion.matches || document.hidden) return;
    motionFrame = window.requestAnimationFrame(() => {
      sidebar.classList.add('is-section-changing');
      link.classList.add('is-arriving');
      motionTimer = window.setTimeout(() => {
        sidebar.classList.remove('is-section-changing');
        link.classList.remove('is-arriving');
      }, 900);
    });
  }

  function updateActiveSection() {
    scheduled = false;
    // Account for the site's anchor spacing and sticky top toolbar.
    const readingLine = mobile.matches ? 144 : 160;
    let nextIndex = 0;
    for (let index = 0; index < sections.length; index++) {
      if (sections[index]?.getBoundingClientRect().top <= readingLine) nextIndex = index;
    }
    const page = document.documentElement;
    if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= page.scrollHeight - 4) {
      nextIndex = links.length - 1;
    }
    const active = links[nextIndex];
    if (!active) return;

    if (nextIndex !== activeIndex) {
      for (const [index, link] of links.entries()) {
        if (index === nextIndex) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
      if (counter) counter.textContent = String(nextIndex + 1).padStart(2, '0');
      if (location) location.textContent = active.querySelector('.sidebar-link-label').textContent.trim();
      if (activeIndex >= 0) animateSelection(active);
      activeIndex = nextIndex;
    }
    alignMarker(active);
  }

  function queueUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateActiveSection);
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));
  close.addEventListener('click', () => setOpen(false, true));
  backdrop.addEventListener('click', () => setOpen(false, true));

  sidebar.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !mobile.matches || !isOpen) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    const target = link.hash && document.getElementById(link.hash.slice(1));
    setOpen(false);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    } else toggle.focus();
  });

  document.addEventListener('keydown', event => {
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusableElements();
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  mobile.addEventListener('change', () => {
    const focusedInSidebar = sidebar.contains(document.activeElement);
    const focusedOnToggle = document.activeElement === toggle;
    setOpen(false, mobile.matches && focusedInSidebar);
    if (!mobile.matches && focusedOnToggle) links[activeIndex]?.focus();
    // The mobile-only close control disappears on desktop.
    if (!mobile.matches && document.activeElement === close) links[activeIndex]?.focus();
    queueUpdate();
  });
  reducedMotion.addEventListener('change', () => {
    window.clearTimeout(motionTimer);
    window.cancelAnimationFrame(motionFrame);
    sidebar.classList.remove('is-section-changing');
    for (const link of links) link.classList.remove('is-arriving');
  });
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate, { passive: true });
  window.addEventListener('hashchange', queueUpdate);
  window.addEventListener('pageshow', () => {
    setOpen(false, mobile.matches && sidebar.contains(document.activeElement));
    queueUpdate();
  });
  window.addEventListener('load', queueUpdate, { once: true });
  document.fonts?.ready.then(queueUpdate);
  setOpen(false);
  updateActiveSection();
  window.requestAnimationFrame(() => sidebar.classList.add('sidebar-ready'));
})();
