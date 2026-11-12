/* Set the saved theme before CSS paints. The default is the dark theme. */
(() => {
  try {
    const saved = localStorage.getItem('mehrshad-theme');
    document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark';
  } catch { document.documentElement.dataset.theme = 'dark'; }
})();
