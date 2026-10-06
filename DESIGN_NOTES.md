# Redesign notes — 6 October 2026

## Visual direction

A precise editorial identity: cool white and charcoal surfaces, cobalt accents, large sans-serif headings, monospaced indices, thin rules, and restrained corner rounding. A corresponding dark theme uses the same hierarchy and is saved across pages.

The homepage separates the identity and portrait from the full biography. The biography uses two columns on larger screens and a single reading column on smaller screens. An index beside each main section makes the long portfolio easier to scan. Publications use compact rows rather than an accumulation of boxes.

Research pages, recommendation letters, the teaching archive, Persian learning pages, the contact composer, authorization states, and the 404 page use the same design foundations. Responsive rules account for smaller screens, and reduced-motion preferences are respected.

## Preservation and repairs

- The text-node comparison preserves all authored text from the 15 editable HTML files, including the complete biography, descriptions, paper titles, and recommendation letters.
- `time.html` and `farmad.html` are byte-for-byte identical to the uploaded originals. Neither references the redesigned shared files.
- The malformed homepage nesting and missing footer/script placement are repaired.
- The embedded portrait and Persian font are materialized as local assets. Missing favicon sizes are supplied. Latin fonts are local and include their license.
- Contact-form labels are associated with their fields. The broken JavaScript newline in the contact composer is repaired. Its Gmail draft no longer triggers a second mail-app fallback after opening a tab with `noopener`.
- Reference disclosures expose their state and keep collapsed letters outside the keyboard tab order. Existing SVG reference nodes also support Enter and Space.
- Hidden vault panels are kept outside the keyboard tab order. Credential checks, access configuration, and the backend are unchanged.
- The old blocking homepage introduction is removed from the runtime. Excessive tilt, sales shimmer, and decorative layers are reduced on the learning page; its existing courses, prices, countdowns, syllabus dialogs, and calculator remain.

## Verification

Passed: local image and font references, HTML navigation targets, unique IDs, text preservation, protected-file comparison, JavaScript syntax, and CSS brace/string balance. Interaction checks in a DOM emulation covered theme preference, tuition calculation and participant limits, course dialog events, recommendation-letter filters/disclosures, contact-draft URL construction, and empty vault credential validation.

A visual desktop/mobile browser review could not be completed: this environment's browser security policy blocked the local preview. Responsive layouts have been reviewed in the source but have not been visually browser-verified. Live access verification, actual access requests, and external form submissions were not exercised. No emails were sent and the live domain was not changed.
