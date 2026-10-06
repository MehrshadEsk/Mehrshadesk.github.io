# Mehrshad Eskandarpour — Signal & Form

A complete static redesign for **mehrshadesk.ir**. The site runs without a build step, a framework, or new production dependencies.

## Preview

Open `index.html`, or serve the project folder locally:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Local fonts, images and SVG artwork are included.

## Design

The requested palette is the foundation of every editable page:

- Brown `#703f37`: identity, headings, body text and the alternate theme.
- Sand `#c8b7a5`: rules, frames and warm neutral surfaces.
- Teal `#097c87`: actions, research details and signal artwork.
- White `#ffffff`: the primary background and contrasting text.

Tinted surfaces are derived from these colors. All editable pages use Consolas where available, with bundled DejaVu Sans Mono as the programming-style fallback, including Persian character support. Headings, paragraphs, controls and technical indices share the monospaced font stack. Paragraphs are justified, and the biography has one reading column at every screen size. A custom portrait frame, signal ornament and four research glyphs give the site a coherent identity.

The home page, all research directions, academic references, teaching history, contact page, learning catalogue, access vault and error page share the system. Both themes, narrow-screen layouts, keyboard navigation and reduced-motion preferences are supported.

## Preservation

All authored text in the 15 editable HTML files is preserved. Bio, research descriptions, publications, experience, education, course information and recommendation letters retain their original wording.

`time.html` and `farmad.html` are byte-for-byte unchanged and remain independent of the shared design files. Existing link destinations, access configuration, Google Apps Script backend, domain and access-protection code are preserved.

## Main files

- `styles.css`: shared monospaced typography, palette, headers, controls and responsive foundations.
- `home.css`: portfolio layout and indexed sections.
- `research-theme.css`, `research-motion.js`: research journals and canvas illustrations.
- `subpage-theme.css`: reference archive, contact studio, authorization panel and error states.
- `teaching-assistantships.css`: semester ledger.
- `learn.css`, `learn-pro.css`: Persian catalogue, course illustrations, dialogs and tuition workspace.
- `theme-init.js`, `design.js`, `script.js`, `learn.js`: appearance preferences, mobile navigation and existing interactions.
- `assets/`: bundled fonts, portrait, favicons and vault symbol. Font licensing is included.

## Deployment

Upload the **contents of this folder** to the root of the existing GitHub Pages repository. Include `assets/`, `CNAME` and `.nojekyll`. Replace the corresponding old files together so the shared styles and HTML stay in sync. The stylesheet/script version strings have been updated to refresh cached assets.

The backend needs no deployment for these design changes. Keep the existing access setup and administration guides for backend configuration.

This package has not been published to the live domain. See `DESIGN_NOTES.md` for validation details.
