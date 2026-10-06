# Redesign notes — 6 October 2026

## Visual direction

Signal & Form is a warm, minimal editorial identity for an engineer and researcher. Brown, sand, teal and white establish a consistent hierarchy without a collection of unrelated themes. Restrained corner rounding, thin rules, local monospaced fonts and quiet technical accents connect the pages.

The home page has a large two-line identity, an asymmetric portrait frame and a custom signal motif. Research cards have four purpose-built SVG glyphs, with a teal feature card. The long biography stays complete in one justified reading column on desktop and phones. Section indices remain beside the content on wider screens. Experience and publications use readable rows; teaching and education use compact, deliberate panels.

Research pages pair large headings with the original technical canvas scenes, now using the requested palette. Reference letters keep their filters, disclosures and interactive network. The contact composer has a defined writing panel. The vault uses a two-column introduction and a restrained credential panel, stacking on phones. The Persian learning page carries the same colors through its course catalogue, syllabuses, sale countdowns, learning path and tuition calculator.

The alternate theme uses brown surfaces, white text and sand accents; primary actions remain teal. Themes are saved across editable pages. Keyboard focus, mobile navigation, content access without JavaScript, and reduced-motion preferences are supported.

## Content and functionality

- A normalized text comparison confirms identical authored wording in all 15 editable HTML files, including reference letters and the full biography.
- SHA-256 and byte comparisons confirm that `time.html` and `farmad.html` are identical to the supplied originals.
- Access configuration, Google Apps Script backend, screen-protection logic and custom-domain configuration are unchanged.
- Existing routes, external links, course prices, tuition logic and sale deadline are preserved.
- The legacy application-journey redirects still point to the existing vault routes.
- SVG viewBox attributes are corrected. Programming-style Latin and Persian fonts and a vault symbol are local assets; no new production package is required.
- Mobile course layout and countdown layout are corrected. Calculator controls remain separate from the results and clickable at narrow widths.

## Validation completed

Local Chromium review covered 12 visual pages at widths of 1440, 768, 390 and 320 pixels: 48 responsive renders. These pages have no document-level horizontal overflow or JavaScript runtime errors. Portraits and local fonts load. Desktop and phone screenshots were reviewed for the home page, research, references, contact, teaching, vault, courses and calculator. Dark rendering was checked across eight page types.

Interaction checks passed for mobile-menu opening, closing, Escape handling and section selection; saved theme persistence; reference-letter opening and closing, filters and expand-all; course dialogs; tuition values, course selection and participant limits; empty vault credential validation; and navigation without JavaScript. A contact-composer test captured the prefilled Gmail URL locally without opening a draft or sending an email.

Local links and anchors, unique IDs, image/font references, CSS parsing and JavaScript syntax checks passed.

No live access credentials were used. Real authorization, access requests, registration submissions and external services were not exercised. The live website has not been changed.

## Typography update

Consolas is the preferred font throughout editable pages. Bundled DejaVu Sans Mono regular and bold provide a consistent fallback and Persian glyph shaping. The serif display treatment is removed. Paragraph and letter text is justified with natural alignment on the last line. The full biography is one column at every viewport size. Responsive heading sizes are adjusted for the wider monospaced characters. The original authored wording and both protected pages remain unchanged.
