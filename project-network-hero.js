/* Fetch the shared 3D engine ahead of scrolling, then build each scene near view. */
(() => {
  'use strict';
  const hosts = [...document.querySelectorAll('[data-network-scene], [data-research-motion]')];
  if (!hosts.length) return;

  let engine;
  const states = new Map(hosts.map(host => [host, { visible: false, pending: false, scene: null }]));

  function loadEngine() {
    engine ||= import('./research-3d-scenes.js?v=20261104-loading').catch(error => {
      engine = undefined;
      throw error;
    });
    return engine;
  }

  async function activate(host, state) {
    if (state.pending || state.scene) return;
    state.pending = true;
    try {
      const { createResearchScene } = await loadEngine();
      if (!state.visible) return;
      state.scene = createResearchScene(host, {
        type: host.dataset.networkScene || host.dataset.researchMotion,
        compact: !!host.closest('.research-preview')
      });
      state.scene.setVisible(true);
    } catch {
      host.dataset.motionState = 'fallback';
    } finally {
      state.pending = false;
    }
  }

  if ('IntersectionObserver' in window) {
    const preload = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      preload.disconnect();
      // Keep the SVG visible if preloading fails.
      loadEngine().catch(() => {});
    }, { rootMargin: '800px 0px' });

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const state = states.get(entry.target);
        state.visible = entry.isIntersecting;
        if (state.scene) state.scene.setVisible(state.visible);
        else if (state.visible) activate(entry.target, state);
      }
    }, { rootMargin: '120px 0px' });

    for (const host of hosts) {
      preload.observe(host);
      observer.observe(host);
    }
  } else {
    for (const [host, state] of states) {
      state.visible = true;
      activate(host, state);
    }
  }
})();
