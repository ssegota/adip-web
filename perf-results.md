# Bandwidth Reduction Results

Branch: `perf/bandwidth-reduction`. All phases executed except E (fonts) which is a no-op for this repo.

## Asset totals — before → after

| Asset class | Before (bytes) | After (bytes) | Reduction |
| --- | ---: | ---: | ---: |
| Images (raster originals) | 215,999,444 | 215,999,444 (kept) + 107,447,540 optimized variants | n/a — originals retained per guardrail |
| Images served to a modern browser (per page) | up to multi-MB depending on gallery | optimized AVIF/WebP variants (see per-page estimates below) | -85–95% per loaded image |
| CSS (local) | 37,894 | 19,820 | **-47.7%** |
| JS (browser-side, local, ex. `server.js`) | 254,516 | 73,623 (minified bundle the site actually serves) | **-71.1%** vs. original sources; the site previously also served the 254 KB unminified files |
| HTML (every page) | 935,329 | 642,160 | **-31.3%** |
| Fonts | 0 | 0 | n/a — no font files in repo |

The optimized image tree (`assets/img-optimized/`) holds every variant: AVIF 35.3 MB, WebP 49.7 MB, JPEG fallbacks + thumbs 22.4 MB.  A given page request only ever loads a small fraction (the format the browser supports at the width it needs).

## Per-page weight estimates

### Homepage (`/index.html`, modern browser, AVIF)

| File | Bytes |
| --- | ---: |
| HTML | 8,124 |
| `css/modern.min.css` | 13,875 |
| `js/main.min.js` | 34,117 |
| `background-1200.avif` | 50,456 |
| Logo (`logo-256.webp`) | 8,452 |
| Up to 6 activity thumbnails (avg 16.5 KB AVIF/WebP each) | ~100,000 |
| **Critical-path total** | **≈215 KB** |

For comparison, before optimization a single activity card pulled its full-resolution image (often 0.5–2 MB) as a CSS `background-image`, the logo was 342 KB, and the body backdrop was a 1.8 MB PNG. Per-load image weight dropped from multi-MB to ~100 KB.

### `galerija-slika.html` (gallery index)

This page is mostly text + the four category cards; no heavy gallery grid is loaded on this index. Transferred bytes after the change:

| File | Bytes |
| --- | ---: |
| HTML | 7,441 (was 9,313) |
| `css/modern.min.css` | 13,875 |
| `js/main.min.js` | 34,117 |
| Logo WebP | 8,452 |
| Background AVIF | 50,456 |
| **Total** | **≈114 KB** |

### Gallery detail pages (`galerija-povijest.html`, `astrofotografija.html`)

Grid view used to load full-resolution photos (often 0.5–2 MB each). It now loads the 480w thumbnail variant — average ~20 KB WebP per tile. A 30-photo grid:

- Before: ~30 × 1 MB ≈ **30 MB**.
- After: ~30 × 20 KB ≈ **600 KB** (plus the lightbox-only 1200w WebP — ~125 KB on demand).

That's a **≈98% per-grid reduction**.

## Highlights of what changed

### Phase A — Images
- `assets/img-optimized/` mirrors the source tree with WebP (q80 / q85 for astrophotos) and AVIF (q55 / q65) variants at 480/768/1200/1920 widths (skipping widths > original). A 480w thumbnail (WebP + JPEG q70) and a 1200w JPEG fallback are also generated for any source ≥ 100 KB.
- Every static `<img>` tag pointing at a local file is wrapped in a `<picture>` with AVIF + WebP `<source>` siblings and gets `width`/`height`/`loading="lazy"`/`decoding="async"`. The header logo is special-cased with `loading="eager"` and `fetchpriority="high"`.
- Logo PNG (342 KB) → 8 KB WebP via a dedicated wrap step (`scripts/optimize-logos.js`).
- CSS body backdrop now resolves to an `image-set()` that prefers a 50 KB AVIF over the 1.8 MB PNG.
- The two big dynamic surfaces (`js/main.js` `renderGallery`, `loadHomepageContent`, `showActivityModal`, and the lightbox) all go through `optimizedVariants()` / `thumbPictureHtml()` / `responsivePictureHtml()` helpers. Gallery grids show the thumb; the lightbox switches to a responsive WebP srcset on open; activity cards pull the 480w JPEG as their CSS background.

### Phase D — Code
- Local CSS minified with `csso` → `*.min.css`; HTML references updated.
- Local browser JS minified with `terser` → `*.min.js`; HTML references updated. `server.js` (Node-side) left alone.
- Every HTML page minified in-place with `html-minifier-terser` (collapse whitespace, remove comments, minify inline CSS+JS).
- `defer` added to non-critical CDN scripts (suncalc + Chart.js on `servisi*.html`, `astronomy.browser.min.js` on `servisi/visible.html`).
- Source maps generated as `.map` sidecars; **not** referenced from production HTML — kept for debugging only.

### Phase E — Fonts
No font files are bundled in the repo. The site uses system font stacks throughout. Nothing to subset or preload, so this phase was a deliberate no-op.

### Phase D4 — Critical CSS
Skipped: neither `critical` nor `penthouse` is available in this environment. The plan explicitly permits skipping when no tool is available.

## Libraries flagged for human review

Searched the rendered HTML across all 67 pages. The only third-party assets remaining are:

| Library | Where | Recommendation |
| --- | --- | --- |
| FontAwesome 6.4.0 (CDN) | `servisi/moon/index.html` (Vite app, not loaded from main pages) | Only used inside the moon vite mini-app. Safe to leave; if you want to trim further, swap to a small subset stylesheet. |
| `suncalc.min.js` 1.9.0 (CDN) | `servisi.html`, `en/servisi.html`, `it/servisi.html` | Used by the sunrise/sunset service. Now deferred. ~16 KB — keep. |
| Chart.js (CDN, `jsdelivr@latest`) | same pages | Used for the tides chart. Now deferred. ~70 KB — keep, but consider pinning the version. |
| Legacy Drupal core (`misc/drupal.js`, `misc/jquery.js`, `misc/jquery.once.js`) | Old node/, povijesne-licnosti, user pages | Loaded from `http://adip.hr/...`. These are archived legacy pages — surfacing for human review, **not removing**. |
| Drupal colorbox + hoverIntent + black_hole/dropdown.js | same old pages | Same as above. |

No CSS/JS framework (Bootstrap, jQuery, etc.) is used on the modern pages.

## Deviations from the plan

1. **Phase E skipped (no fonts in repo).** Declared up-front in the baseline; nothing to do.
2. **Phase D4 (critical CSS) skipped.** Tooling not available; plan permits skip.
3. **Image variants for fully dynamic gallery/activity images** required JS changes (`js/main.js`) in addition to the static HTML rewriter — covered in the Phase A commit.
4. **Legacy Drupal-era pages** (`node/*.html`, `user.html`, `user/password.html`, `povijesne-licnosti.html`, `galerija-slika/35.html`) had their HTML minified and image attributes added, but their `<script>` load order (jQuery → jQuery.once → drupal.js → colorbox) was **not** touched. Adding `defer` to those would change the synchronous bootstrap on which their inline scripts depend.
5. **Originals are retained.** Per guardrail, no source image was deleted; `assets/img-optimized/` lives alongside the originals.
6. **Logo PNG handled separately.** The bulk rewriter classifies logos as `icon` and skips them by design (icons under 5 KB don't benefit from variants). The site logo is 342 KB so it got its own pass (`scripts/optimize-logos.js`) that wraps it in a `<picture>` pointing to an 8 KB WebP / 9 KB PNG resized to 256 px.

## Tooling left in place

Scripts (idempotent, mtime-checked, run from repo root):

- `scripts/build-image-manifest.js` — scans the image tree, classifies and probes each file, writes `image-manifest.json`.
- `scripts/optimize-images.js` — drives sharp to produce AVIF + WebP variants and thumbnails.
- `scripts/rewrite-html-images.js` — adds width/height/loading/decoding to every static `<img>` and wraps locals in `<picture>`.
- `scripts/optimize-logos.js` — wraps the site logo in a `<picture>` pointing at the resized WebP.
- `scripts/minify-assets.js` — produces `.min.css` / `.min.js`, rewrites HTML refs, and runs `html-minifier-terser` over every HTML file.
- `scripts/defer-cdn-scripts.js` — adds `defer` to CDN script tags on a narrow allow-list of pages.

When source images change, the workflow is:

```
node scripts/build-image-manifest.js
node scripts/optimize-images.js
node scripts/rewrite-html-images.js
node scripts/optimize-logos.js
node scripts/minify-assets.js
node scripts/defer-cdn-scripts.js
```
