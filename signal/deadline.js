(() => {
  'use strict';
  const deadline = Date.parse(window.SIGNAL_CONFIG.DEADLINE);
  const status = document.getElementById('deadline-status');
  const fields = ['days','hours','minutes','seconds'].map(unit => document.getElementById('cd-' + unit));
  if (!status || fields.some(field => !field)) return;
  let timer;
  function update() {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
    fields.forEach((field, i) => { field.textContent = String(values[i]).padStart(2, '0'); });
    if (seconds === 0) {
      status.textContent = 'Registration deadline has passed';
      clearInterval(timer);
    }
  }
  timer = setInterval(update, 1000);
  update();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();
