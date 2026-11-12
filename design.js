/* Shared appearance and keyboard behavior. Auth data remains in the original vault code. */
(() => {
 'use strict';
 const root = document.documentElement;
 root.classList.remove('no-js');root.classList.add('has-js');
 const persian = root.lang === 'fa';
 const toggles = [...document.querySelectorAll('.theme-toggle')];
 function applyTheme(theme, save = false) {
  const dark = theme === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  for (const toggle of toggles) {
   const label = persian ? (dark ? 'تغییر به زمینه روشن' : 'تغییر به زمینه تیره') : `Switch to ${dark ? 'light' : 'dark'} theme`;
   toggle.setAttribute('aria-label', label);toggle.setAttribute('title', label);toggle.setAttribute('aria-pressed', String(dark));
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#292C23' : '#FAF7F0');
  if (save) { try { localStorage.setItem('mehrshad-theme', root.dataset.theme); } catch {} }
  window.dispatchEvent(new Event('site-theme-change'));
 }
 toggles.forEach(toggle => toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true)));
 window.addEventListener('storage', event => { if (event.key === 'mehrshad-theme') applyTheme(event.newValue); });
 applyTheme(root.dataset.theme);
 const menu = document.querySelector('.portfolio-nav');
 const menuButton = document.querySelector('.nav-toggle');
 if (menu && menuButton) {
  const mobile = matchMedia('(max-width: 760px)');
  function setOpen(open, restoreFocus = false) {
   menu.classList.toggle('is-open', open);menu.inert = mobile.matches && !open;menuButton.setAttribute('aria-expanded', String(open));
   menuButton.setAttribute('aria-label', persian ? (open ? 'بستن فهرست' : 'باز کردن فهرست') : (open ? 'Close navigation' : 'Open navigation'));
   if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a') && mobile.matches) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false, true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setOpen(false); });
  mobile.addEventListener('change', () => setOpen(false));setOpen(false);
  menuButton.addEventListener('keydown', event => {if(event.key === 'Tab' && !event.shiftKey && menuButton.getAttribute('aria-expanded') === 'true') {event.preventDefault();menu.querySelector('a')?.focus();}});
  menu.addEventListener('keydown', event => {const items=[...menu.querySelectorAll('a')];if(event.key==='Tab'&&!event.shiftKey&&document.activeElement===items.at(-1)){setOpen(false);menuButton.focus();}});
 }
 for (const panel of document.querySelectorAll('.request-shell,.result-overlay')) {
  const sync = () => {
   const open = panel.classList.contains('open') || panel.classList.contains('show');
   panel.inert = !open;panel.setAttribute('aria-hidden', String(!open));
  };
  sync();new MutationObserver(sync).observe(panel, {attributes:true,attributeFilter:['class']});
 }
})();
