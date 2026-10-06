/* Shared theme controls and accessibility behavior. No application data is stored here. */
(() => {
  'use strict';
  const root = document.documentElement;
  const persian = root.lang === 'fa';
  const toggles = [...document.querySelectorAll('.theme-toggle')];
  function applyTheme(theme, save = false) {
    const dark = theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    for (const toggle of toggles) {
      const label = persian ? (dark ? 'تغییر به زمینه روشن' : 'تغییر به زمینه تیره') : `Switch to ${dark ? 'light' : 'dark'} theme`;
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
      toggle.setAttribute('aria-pressed', String(dark));
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#11151c' : '#f7f8fa');
    if (save) { try { localStorage.setItem('mehrshad-theme', root.dataset.theme); } catch {} }
    window.dispatchEvent(new Event('site-theme-change'));
  }
  toggles.forEach(toggle => toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true)));
  window.addEventListener('storage', event => { if (event.key === 'mehrshad-theme') applyTheme(event.newValue); });
  applyTheme(root.dataset.theme);

  // Collapsed authorization panels must not remain in the keyboard tab order.
  for (const panel of document.querySelectorAll('.request-shell,.result-overlay')) {
    const sync = () => {
      const open = panel.classList.contains('open') || panel.classList.contains('show');
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
    };
    sync();
    new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['class'] });
  }
})();
