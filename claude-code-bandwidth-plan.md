# Claude Code Task: Reduce Bandwidth on adip.hr

You are working on a static multilingual website (Croatian/English/Italian) for an astronomy club. The site has image-heavy gallery pages. Your job is to reduce total page weight by implementing three plans: **Image overhaul (A)**, **Code trimming (D)**, and **Fonts (E)**. Do not change the visual design, layout, URLs, or copy. Do not touch the login form behavior.

Work through the phases below in order. After each phase, run the verification steps and report what changed before moving on.

---

## Phase 0 — Pre-flight (do this before any edits)

1. Run `git status` and confirm the working tree is clean. If it isn't, stop and ask.
2. Create a new branch: `perf/bandwidth-reduction`.
3. Map the project:
   - List every `.html` file at the repo root and inside `/en/` and `/it/`.
   - Find every `<img>` reference (including those inside CSS `background-image:` rules).
   - Find every `.css`, `.js`, `.woff`, `.woff2`, `.ttf`, `.otf` file.
   - Identify the build system if any (`package.json`, `Gruntfile`, `gulpfile`, plain static, etc.).
4. Produce a baseline report and save it as `perf-baseline.md` in the repo root:
   - Total size of all images, broken down by folder.
   - Top 20 largest individual files (any type).
   - Total CSS bytes, total JS bytes, total font bytes.
   - A count of `<img>` tags missing `loading`, `width`, or `height` attributes.
5. Verify the tools below are available; if any are missing, install them locally (do **not** install globally):
   - `cwebp`, `avifenc` (or `@squoosh/cli` as a Node fallback)
   - `sharp` (Node, for resizing)
   - `terser` (JS minify), `csso` or `lightningcss` (CSS minify), `html-minifier-terser`
   - `fonttools` (Python, for `pyftsubset`) and `woff2_compress`
6. **Commit** the baseline report before making any changes.

If anything in this phase is ambiguous, pause and ask before proceeding.

---

## Phase A — Image overhaul

Goal: serve every image as a modern format at an appropriate resolution, with lazy loading, without breaking the existing layout.

### A1. Inventory and classify
Build a JSON manifest `image-manifest.json` listing every image with: path, dimensions, file size, format, and a classification:
- `hero` — full-width banner/header images
- `thumbnail` — gallery grid tiles
- `full` — full-resolution gallery photos (clicked into from thumbnails)
- `astrophoto` — astronomy images (these benefit most from AVIF; do not over-compress)
- `icon` — small UI graphics, logos
- `other`

### A2. Generate responsive variants
For each image (except icons and logos under 5KB):
- Generate widths: `480`, `768`, `1200`, `1920` (skip widths larger than the original).
- Generate two formats per width: `.webp` (quality 80, or 85 for astrophotos) and `.avif` (quality 55, or 65 for astrophotos).
- Keep the original as a fallback only if it's already small (< 100KB).
- Output to a parallel `assets/img-optimized/` tree mirroring the original folder structure.
- Strip EXIF/metadata from all generated copies.
- For images classified as `thumbnail`, generate only one variant at 480px wide, JPEG quality 70, plus WebP.

### A3. Update HTML
Replace each `<img src="...">` with a `<picture>` element:

```html
<picture>
  <source type="image/avif" srcset="…480w.avif 480w, …768w.avif 768w, …1200w.avif 1200w" sizes="(max-width: 768px) 100vw, 50vw">
  <source type="image/webp" srcset="…480w.webp 480w, …768w.webp 768w, …1200w.webp 1200w" sizes="(max-width: 768px) 100vw, 50vw">
  <img src="…fallback.jpg" alt="…" width="…" height="…" loading="lazy" decoding="async">
</picture>
```

Rules:
- Above-the-fold hero images: `loading="eager"` and add `fetchpriority="high"`.
- Everything else: `loading="lazy"` and `decoding="async"`.
- Always set `width` and `height` attributes from the actual source dimensions (prevents layout shift).
- Preserve every existing `alt`, `class`, `id`, and `style` attribute.
- Apply changes across all three language versions (`/`, `/en/`, `/it/`).

### A4. Gallery thumbnails
On `galerija-*.html` pages: the grid must reference the thumbnail variants, not the full-resolution images. The full-resolution version should only load when a user clicks into a single image (lightbox or detail view). If the current setup loads full-resolution into the grid, change it.

### A5. Verify
- Open three pages (homepage, one gallery index, one gallery detail) and confirm visually identical rendering.
- Re-run the baseline size script and report the percentage reduction in total image bytes.
- Confirm `<img>` elements without `width`/`height` count is now zero.

**Commit after Phase A passes.**

---

## Phase D — Code trimming

### D1. Audit
- List every `<script>` and `<link rel="stylesheet">` in the HTML files.
- Identify any libraries pulled from CDNs (Bootstrap, jQuery, FontAwesome, etc.) and any local CSS/JS.
- Flag any library that's only used for one or two features — note it in `perf-baseline.md` for human review. Do not remove libraries on your own; surface them and ask.

### D2. Minify
- Minify every local `.css` file with `lightningcss` (or `csso`). Save as `.min.css` and update HTML references.
- Minify every local `.js` file with `terser`. Save as `.min.js` and update HTML references.
- Minify each `.html` file with `html-minifier-terser` using these flags: `--collapse-whitespace --remove-comments --minify-css --minify-js`. Keep original `.html` filenames (no `.min.html`).
- Source maps: generate `.map` files but do not reference them from production HTML (keep them for debugging only).

### D3. Defer non-critical scripts
- Any `<script src="…">` in `<head>` that isn't needed for first paint: add `defer`.
- Analytics, the login form handler, social embed scripts: `defer` is fine; or move to just before `</body>`.
- Inline `<script>` blocks: only add `defer` if you can confirm they aren't depended on by earlier code.

### D4. Critical CSS (optional, only if a tool is available)
- If `critical` or `penthouse` is installable, generate inline critical CSS for `index.html`, `galerija-slika.html`, and `aktivnosti.html`. Inline it in `<head>` and load the full stylesheet with `<link rel="preload" as="style" onload="this.rel='stylesheet'">`.
- If those tools aren't available, skip this step — don't attempt critical CSS by hand.

### D5. Verify
- Open the three test pages in a headless browser (or have me check); confirm no JS errors in the console.
- Confirm the language switcher, navigation, and login modal still work.
- Report new CSS/JS/HTML byte totals vs baseline.

**Commit after Phase D passes.**

---

## Phase E — Fonts

### E1. Inventory
- List every font file referenced in CSS (`@font-face`) or HTML (`<link rel="preload">`).
- For each: format, file size, character set, weights/styles loaded.

### E2. Convert and subset
For each font that isn't already WOFF2:
- Convert to WOFF2 using `woff2_compress` or `fonttools`.
- Drop WOFF, TTF, EOT, SVG fallbacks. Modern browsers all support WOFF2; the fallback to system fonts is enough for the long tail.

For each font face:
- Subset to **Latin Extended-A** (covers Croatian: č, ć, ž, š, đ, and all Italian/English glyphs). Use `pyftsubset --unicodes="U+0000-024F,U+1E00-1EFF,U+2000-206F,U+2070-209F,U+20A0-20CF" --flavor=woff2`.
- Verify the subset still renders all visible text on the three language versions — do a spot check on a page with Croatian diacritics.

### E3. CSS updates
- Every `@font-face` block: add `font-display: swap;`.
- Remove `src:` entries for non-WOFF2 formats.
- Preload only the one or two font files needed for first paint:
  ```html
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  ```
- Do not preload italics or weights only used on a few pages.

### E4. Verify
- Open all three language versions; confirm text renders correctly including all diacritics (č, ć, ž, š, đ for Croatian; à, è, ò etc. for Italian).
- Report new font byte totals.

**Commit after Phase E passes.**

---

## Final report

Create `perf-results.md` summarizing:
- Image bytes: before → after, % reduction
- CSS bytes: before → after
- JS bytes: before → after
- HTML bytes: before → after
- Font bytes: before → after
- Estimated total page-weight reduction on the homepage and on `galerija-slika.html`
- A list of any libraries flagged in D1 that should be reviewed by a human
- Any deviations from this plan and why

Open a pull request from `perf/bandwidth-reduction` into the default branch with this report as the description.

---

## Guardrails (do not violate)

- **Do not** change visible design, copy, page URLs, or file paths users link to externally.
- **Do not** delete original image files — keep them; place optimized versions in `assets/img-optimized/` or alongside with new extensions.
- **Do not** remove any third-party library without surfacing it for review first.
- **Do not** install anything globally (`npm i -g`, `pip install` without venv). Use local installs and a `.gitignore`d `node_modules/` and `venv/`.
- **Do not** rewrite the login form, the language switcher, or any backend interaction.
- **Do not** introduce a build step that the current site doesn't have unless you commit the build output too (this is a static site).
- If any phase fails verification, stop and report — don't proceed to the next phase.
- Commit at the end of each phase with a clear message: `perf(images): …`, `perf(code): …`, `perf(fonts): …`.
