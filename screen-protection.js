(()=>{
  'use strict';

  // Browser-only deterrence. A website cannot fully block OS-level or camera screenshots.
  const STYLE_ID = 'screen-protection-style';
  const OVERLAY_ID = 'screen-protection-overlay';
  const SHIELD_CLASS = 'screen-protection-active';

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html, body {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      img, video, canvas, svg {
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
      body.${SHIELD_CLASS} > *:not(#${OVERLAY_ID}) {
        visibility: hidden !important;
      }
      #${OVERLAY_ID} {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #070a0d;
        color: #fff;
        font: 600 16px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: center;
      }
      body.${SHIELD_CLASS} #${OVERLAY_ID} { display: flex !important; }
      #${OVERLAY_ID} .sp-box {
        max-width: 520px;
        padding: 24px 28px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 14px;
        background: rgba(255,255,255,.06);
        box-shadow: 0 16px 50px rgba(0,0,0,.35);
      }
      #${OVERLAY_ID} .sp-title { font-size: 18px; margin-bottom: 7px; }
      #${OVERLAY_ID} .sp-sub { opacity: .72; font-size: 13px; font-weight: 400; }
      @media print {
        body > * { display: none !important; }
        html, body { background: #fff !important; }
        body::before {
          content: "Printing is disabled for this website.";
          display: block !important;
          color: #111 !important;
          font: 600 18px/1.4 Arial, sans-serif !important;
          padding: 40px !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureOverlay(){
    if (document.getElementById(OVERLAY_ID)) return;
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML = '<div class="sp-box"><div class="sp-title">Protected content</div><div class="sp-sub">Return to this tab to continue viewing.</div></div>';
    document.body.appendChild(overlay);
  }

  function shield(){
    if (!document.body) return;
    ensureOverlay();
    document.body.classList.add(SHIELD_CLASS);
  }

  function unshield(){
    if (!document.body) return;
    document.body.classList.remove(SHIELD_CLASS);
  }

  function blockEvent(event){
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  const init = () => {
    ensureOverlay();

    ['contextmenu','copy','cut','dragstart','selectstart'].forEach(type => {
      document.addEventListener(type, blockEvent, {capture:true});
    });

    document.addEventListener('keydown', event => {
      const key = String(event.key || '').toLowerCase();
      const mod = event.ctrlKey || event.metaKey;

      if (key === 'printscreen') {
        shield();
        try { navigator.clipboard?.writeText('Protected content — screenshot capture is restricted.'); } catch (_) {}
        window.setTimeout(() => {
          if (!document.hidden && document.hasFocus()) unshield();
        }, 1400);
        blockEvent(event);
        return;
      }

      // Discourage common copy/save/print/source/devtools shortcuts.
      const blockedModified = mod && ['c','s','p','u'].includes(key);
      const blockedDevtools = key === 'f12' || (mod && event.shiftKey && ['i','j','c'].includes(key));
      if (blockedModified || blockedDevtools) blockEvent(event);
    }, {capture:true});

    document.addEventListener('keyup', event => {
      if (String(event.key || '').toLowerCase() === 'printscreen') {
        shield();
        window.setTimeout(() => {
          if (!document.hidden && document.hasFocus()) unshield();
        }, 1400);
      }
    }, {capture:true});

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) shield();
      else window.setTimeout(unshield, 120);
    });

    window.addEventListener('blur', shield);
    window.addEventListener('focus', () => window.setTimeout(unshield, 120));
    window.addEventListener('beforeprint', shield);
    window.addEventListener('afterprint', unshield);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
