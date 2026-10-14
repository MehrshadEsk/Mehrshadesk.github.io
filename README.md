# Mehrshad Eskandarpour — Editorial portfolio

A buildless GitHub Pages project for `mehrshadesk.ir`, redesigned on 14 October 2026. The original English portfolio and Persian course catalogue retain their research, publications, employment, education, recommendation letters, syllabuses and operational flows.

The shared visual system uses warm cream `#FAF7F0`, sand `#E3D9C8`, olive `#72785A`, charcoal `#292C23`, and restrained vermilion `#F25432`. Space Grotesk and Estedad are bundled locally as WOFF2 in weights 400–700; their OFL licenses are included. The supplied new portrait replaces both previous profile images. The portrait displays in its original colors; no grayscale filter is applied.

## Structure

| Files | Purpose |
|---|---|
| `styles.css`, `theme-init.js`, `design.js` | Shared tokens, type, components, saved appearance and accessible navigation |
| `index.html`, `home.css`, `script.js` | Portfolio; full biography displayed openly, separate work and professional experience groups |
| `learn.html`, `learn/index.html`, `learn.css`, `learn.js` | Course catalogue, six original syllabuses, tuition calculator and enrollment links |
| `research-*.html`, `research-theme.css`, `research-motion.css`, `research-motion.js` | All five original research URLs, four animated research systems, mobile scenes and static fallback posters |
| `academic-references.html`, `contact.html`, `subpage-theme.css` | Letters, filters, contact composer and access-page presentation |
| `teaching-assistantships.html`, `teaching-assistantships.css` | Original semester and course archive |
| `apply-vault*.html`, `access-config.js`, `google-apps-script.gs` | Original access service integration and protected landing page |
| `time.html`, `time-ui.css`, `time-app.js` | Attendance tool; original operational logic and endpoint |
| `farmad.html`, `farmad-ui.css`, `farmad-app.js` | Field report tool; image attachments, location, preview and PDF export |
| `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml` | Existing static deployment and indexing configuration |

No production dependencies, framework migration, package installation or build step is required. Preserve the existing repository metadata and hosting settings when copying these files. See `DEPLOYMENT.md` for exact instructions and `REDESIGN_REPORT.md` for verification, file changes, deletions and limitations.

## Local preview

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Real access authorization, attendance records and enrollment depend on existing external services; those services were not modified or exercised during verification. This package has not been pushed or deployed.

## Research visualizations

`research-motion.js` contains four hand-authored vector scene renderers and responsive mobile variants. The browser upgrades static fallback posters to native SVG animation. Animations pause when offscreen or the tab is hidden, respect reduced motion, and share a persisted user pause setting. The diagrams are conceptual illustrations and contain no invented experimental measurements. English and Persian prose is justified; the portrait is in color and its location badge is removed.

## Homepage content revision

The full authored biography uses the same indexed section layout as the research and experience panels. The homepage has no Learn link or course callout. Work experiences and Professional experiences are separate groups with the supplied appointment types and dates; MCI Hamrahe Avval / NAK is included with a concise role-based description. The five existing role descriptions are retained. The portrait is larger. All five research pages omit the Questions section while retaining their papers and animations.
