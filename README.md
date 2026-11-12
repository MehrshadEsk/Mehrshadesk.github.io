# Mehrshad Eskandarpour — Portfolio

Static personal research portfolio for GitHub Pages. The November 2026 redesign uses a bespoke dark technical-editorial system, monospaced type (the project's existing local code fonts), crisp research diagrams, and a complete row-based paper archive.

## Research directions

- `research-wireless-systems.html` — **Wireless Communications Networks** (6 research works)
- `research-cryptography-coding.html` — **Secure Computing and Processing** (4 research works)

The homepage **displays all ten distinct research works directly**, without a hidden “View all” list. The 2025 arXiv manuscript `2508.12707` is linked as a preprint version of the 2026 IET Networks journal publication, rather than counted as an unrelated paper. The complete biography is still accessible through *Read full biography*.

## Citation checks (November 2026)

Article metadata has been checked against accessible publisher records, arXiv, SSRN, DBLP, ResearchGate and Research Square.

Corrections include:

- **IET Networks (2026):** four authors, including Saba Pirahmadian. The arXiv version is linked.
- **RF-EMF review:** publication year 2026 in volume 58 special issue; author name Amirsaman Nooramin.
- **Graph-Aware RL:** direct Research Square preprint DOI `10.21203/rs.3.rs-10458568/v1`, replacing a general Google Scholar profile link.
- **Energy-Efficient Routing (2025):** author list aligned with arXiv.
- Existing publisher links and years of the other records were retained or updated to match available bibliographic sources.

Direct Google Scholar profile retrieval returned an access-denied response (403), so **this is not a claim of a complete live Google Scholar sync**. The archive preserves the ten distinct works available in the supplied website and linked bibliographic sources.

## Deployment

Copy the **contents** of this directory to the GitHub Pages repository root (not the containing directory). Keep the existing `.nojekyll`, `CNAME` and licensing files. No build pipeline is required. The site does not require external UI frameworks or external fonts.

## Design files

- `assets/minimal-portfolio.css` — shared dark/light portfolio styling and special lab interface
- `assets/research-wireless-comms.svg` — clean network illustration, no labels
- `assets/research-secure-computing.svg` — clean computing illustration, no labels
- `styles.css`, `home.css`, `portfolio-sidebar.css` and other source styles remain because other site sections depend on them.

Original private vault, course platform, and teaching pages are preserved; independent application functionality is not replaced by this visual redesign.
