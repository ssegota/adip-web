# Performance Baseline Report

Captured before any optimization on branch `perf/bandwidth-reduction`.

## Project map

- 67 HTML files (root + `/en/` + `/it/` + sub-paths)
- 10 local CSS files
- 19 local JS files (excluding `node_modules/`)
- 0 fonts (no `@font-face` files, no font files in repo)
- No build system — static site served by Express (`server.js`) or any static host

## Totals

| Category | Bytes | Notes |
| --- | --- | --- |
| Images (jpg/jpeg/png/gif/webp/svg) | 215,999,444 (≈206 MB) | 651 files |
| HTML | 935,329 (≈913 KB) | 67 files |
| CSS | 37,894 (≈37 KB) | 10 files |
| JS (browser, ex. `server.js`) | 254,516 (≈248 KB) | excludes Node-side `server.js` |
| Fonts | 0 | none |

Image bytes by folder:

| Folder | Bytes |
| --- | --- |
| `galerija/` (with `astrofotografija`) | 151,333,456 |
| `servisi/` (mostly `moon/public/data` SVGs) | 41,337,529 |
| `aktivnosti-slike/` | 20,124,033 |
| `sites/` (incl. themes) | 926,202 |
| `downloads-files/` (thumbs) | 462,863 |
| `background.png` (root) | 1,815,361 |

## Top 20 largest files

| Bytes | Path |
| --- | --- |
| 72,220,745 | `galerija/astrofotografija/duboki-svemir/1777715398675-horsehead wide2.jpg` |
| 18,502,272 | `galerija/astrofotografija/duboki-svemir/1777715472585-bodes galaxy.jpg` |
|  8,497,235 | `galerija/astrofotografija/duboki-svemir/1777715315430-M65&M66 .png` |
|  6,085,186 | `aktivnosti-slike/1777714980325-reklama-adip-festical-znanosti.png` |
|  3,715,093 | `galerija/astrofotografija/duboki-svemir/1777715398675-horsehead wide2_lowres.jpg` |
|  3,474,786 | `downloads-files/1770485003274-Lunarij_2026.pdf` |
|  2,681,702 | `galerija/astrofotografija/duboki-svemir/1771241181875-1000013340.jpg` |
|  2,513,476 | `downloads-files/1770484965611-adip-150-en_compressed.pdf` |
|  2,511,339 | `downloads-files/1770484882789-adip.150-hr_compressed.pdf` |
|  2,150,237 | `galerija/povijest/1770125916276-orion.jpg` |
|  1,815,361 | `background.png` (used as `body::before` background) |
|  1,538,898 | `galerija/ostalo/1770491467220-516257987_…_n.jpg` |
|  1,206,323 | `galerija/posjete/1770403825170-545069206_…_n.jpg` |
|  1,180,459 | `galerija/ostalo/1774781580828-100_0985.JPG` |
|  1,168,205 | `galerija/ostalo/1774781569638-100_0951.JPG` |
|  1,165,924 | `galerija/ostalo/1774781624014-IMC_2009_…024.jpg` |
|  1,164,260 | `galerija/ostalo/1774781641126-IMC_2009_…056.jpg` |
|  1,163,182 | `galerija/ostalo/1770403766626-540699679_…_n.jpg` |
|  1,162,671 | `galerija/ostalo/1774781648078-IMC_2009_…058.jpg` |
|  1,150,629 | `galerija/ostalo/1774781632105-IMC_2009_…055.jpg` |

## `<img>` attribute audit

Across all HTML files (excluding `node_modules`):

| Metric | Count |
| --- | --- |
| Total `<img>` tags | 148 |
| Missing `loading` | 125 |
| Missing `width` | 148 |
| Missing `height` | 148 |

Note: the bulk of gallery and activity images are **not** in static `<img>` tags — they are rendered at runtime from `data/galerija.json` and `data/aktivnosti.json` by `js/main.js`. Those dynamic paths must also be addressed in Phase A.

## CSS background-image references

- `css/modern.css`: `background: url('../background.png')` — used as a fixed body backdrop.
- `servisi/moon/style.css`: `background-image: url('/moon.jpg')` — used in the moon vite app (not loaded from main site pages, only via iframe of `servisi/moon/index.html`).

## External libraries (Phase D1 inventory)

No CDN-hosted CSS/JS frameworks are loaded from the main HTML pages — every page references only `css/modern.css` and `js/main.js` (plus inline `<script>` for upload handlers and a few page-specific local scripts).

Page-specific JS files referenced from HTML:
- `js/main.js` (62 KB) — every page
- `js/inject-header.js` (6 KB) — many pages
- `js/aktivnosti.js`, `js/services.js`, `js/downloads.js`, `js/user.js`, `js/povijest-zvjezdarnice.js`, etc.
- `servisi/astronomy.browser.min.js` (116 KB, already minified) — only on services pages

Local JS used directly: 19 files totalling ≈248 KB (browser-side only, excluding `server.js`).

No third-party libraries (jQuery, Bootstrap, FontAwesome, GA tags) appear in the head/body of the audited HTML pages. **Nothing to flag for human review** at this stage.

## Tool availability

- `node` v22, `npm` available — used for sharp / terser / csso / html-minifier-terser (installed locally).
- No `cwebp` / `avifenc` / `woff2_compress` binaries available — Sharp covers WebP + AVIF generation.
- No fonts in the repo → Phase E is effectively a no-op.

## Plan deviations declared up-front

1. **Phase E (Fonts)** will be skipped because no fonts are bundled — the site relies on system fonts. The plan section will close with a one-liner.
2. Most gallery/activity images are dynamic; Phase A3's "replace each `<img>` with `<picture>`" applies to static tags, plus the dynamic renderers in `js/main.js` will be updated to emit `<picture>` for the optimized variants.
3. Critical-CSS (D4) will be skipped — no `critical` / `penthouse` available; the plan permits skipping in that case.
