# Editorial design system — 14 October 2026

Use `styles.css` as the source of truth for palette, typography, container width, focus styles, controls, theme variables and navigation. Page-specific styles describe layout rather than independent brand systems.

The main light palette is cream, sand, olive and charcoal. Vermilion marks primary actions and restrained details. Charcoal text on vermilion maintains readable primary-button contrast; smaller body text uses ink or the accessible muted text token. The saved dark appearance uses charcoal surfaces and cream/sand text.

English text uses Space Grotesk; Persian text uses Estedad. Both are local WOFF2, with 400, 500, 600 and 700 weights. Persian pages retain `lang="fa" dir="rtl"`, and mixed Latin terms use `bdi` or local LTR direction. The shared header collapses into a keyboard-accessible mobile menu at 760 pixels. Content stays visible without entrance animation. Reduced motion is respected.

The homepage uses one portrait, a short introduction, the complete original biography displayed openly in the standard indexed section, open research lists and editorial publication rows. All original professional and academic content remains. The learning page groups Python, C++ and AI courses without course artwork or ticking sale counters. The original syllabuses, enrollment URL and calculator values remain. An expired-discount notice asks learners to confirm pricing before registration.

Four custom animated SVG systems visualize sensor routing, intelligent RAN control, cryptographic leakage/trust, and efficient AI. The homepage includes compact versions; research articles have full scenes with dedicated mobile compositions. Motion pauses offscreen, supports a persisted pause control, and respects reduced-motion preferences. Static SVG posters remain available without JavaScript. Recommendation shortcuts replace the animated network while preserving all seven letters, filters and disclosure interactions. English and Persian prose is justified with natural final-line alignment. The Tehran, Iran portrait badge is removed. Contact opens a prefilled draft and never automatically sends email. Vault and operational tools reuse the same visual identity while retaining their existing remote integrations.

The provided photo replaces the portfolio portrait and teaching portrait. The portrait displays in its original colors, without a grayscale filter. See `REDESIGN_REPORT.md` for the complete change record and verification scope.

The third content revision removes course promotion from the homepage, splits experience into two named groups with three appointments each, updates the instructor end date, and removes the Questions sections from all research pages. The portrait now displays at 340 pixels on larger desktops and 240 pixels on phones.
