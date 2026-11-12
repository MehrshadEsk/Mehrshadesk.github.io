/* Set the saved theme before CSS paints. The default is the editorial light theme. */
(() => {
  try {
    const saved = localStorage.getItem('mehrshad-theme');
    document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light';
  } catch { document.documentElement.dataset.theme = 'light'; }
})();
