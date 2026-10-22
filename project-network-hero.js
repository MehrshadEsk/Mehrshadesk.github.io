/* Load the locally bundled 3D engine only when a research visual approaches.
   Figures remain useful without JavaScript or WebGL. No third-party requests. */
(() => {
  'use strict';
  const hosts=[...document.querySelectorAll('[data-network-scene], [data-research-motion]')];
  if(!hosts.length)return;
  let engine;
  const states=hosts.map(host=>({host,visible:false,pending:false,scene:null}));
  async function activate(state){
    if(state.pending||state.scene)return;
    state.pending=true;
    try{
      engine ||= import('./research-3d-scenes.js?v=20261022-voice-v8');
      const {createResearchScene}=await engine;
      state.scene=createResearchScene(state.host,{
        type:state.host.dataset.networkScene||state.host.dataset.researchMotion,
        compact:!!state.host.closest('.research-preview')
      });
      state.scene.setVisible(state.visible);
    }catch(error){
      state.host.dataset.motionState='fallback';
      // Static, label-free vector artwork remains in place if WebGL is absent.
      console.info('Research visual: using the static illustration.');
    }
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        const state=states.find(s=>s.host===entry.target);
        state.visible=entry.isIntersecting;
        if(state.visible)activate(state);
        state.scene?.setVisible(state.visible);
      }
    },{rootMargin:'120px 0px',threshold:0});
    states.forEach(s=>observer.observe(s.host));
  }else states.forEach(s=>{s.visible=true;activate(s);});
})();
