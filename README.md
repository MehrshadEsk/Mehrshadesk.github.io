# Mehrshad Eskandarpour — portfolio

A static, responsive personal portfolio for **mehrshadesk.ir**. Open `index.html` or run a local static server; there is no build step and no new package dependency.

```sh
python3 -m http.server 8000
```

The redesign uses a shared typography and color system, local Latin and Persian fonts, an optional saved light/dark preference, and page-specific layouts. Existing authored portfolio, research, teaching, and reference wording is preserved.

## File organization

- `styles.css`: typography, theme tokens, shared headers, controls, and responsive foundations.
- `home.css`: portfolio identity, biography, research, publications, industry experience, teaching, education, and contact.
- `research-theme.css` and `research-motion.js`: research page layouts and the existing technical visualizations.
- `subpage-theme.css`: references, contact composer, vault, private status page, and 404.
- `teaching-assistantships.css`: semester and course archive.
- `learn.css` and `learn-pro.css`: existing learning-page components and the redesigned presentation.
- `theme-init.js` and `design.js`: theme preference and shared accessibility behavior.
- `script.js` and `learn.js`: portfolio navigation and existing course interactions.
- `assets/`: local fonts, restored portrait, and favicon files. Font licensing is included.

`time.html` and `farmad.html` are unchanged, self-contained originals. Their content, code, and appearance remain independent of the redesign.

## Deployment

Upload the **entire project folder's contents**, including `assets/`, to the root of the existing GitHub Pages repository. Keep `CNAME` and `.nojekyll`. The existing custom domain configuration is preserved. This archive has not been deployed to the live domain.

The access configuration and Google Apps Script backend are unchanged. The redesign alone does not require a backend deployment. Keep the original access setup and admin guides for any separate backend changes.

See `DESIGN_NOTES.md` for the change summary and verification limits.
