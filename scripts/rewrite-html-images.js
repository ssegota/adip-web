#!/usr/bin/env node
/**
 * Rewrites <img> tags across every HTML file in the repo (root, en/, it/,
 * and their subdirs):
 *   - sets width/height from image-manifest.json (or from existing
 *     style="height:H; width:W" attributes) when missing — prevents CLS
 *   - adds loading="lazy" and decoding="async" when missing
 *   - if the image is a local file present in the manifest, the <img> is
 *     wrapped in a <picture> with AVIF + WebP <source> tags pointing at
 *     /assets/img-optimized/<original-dir>/<base>-{480,768,1200,1920}.{avif,webp}
 *
 * Skipped:
 *   - <img> tags with empty src (e.g. the lightbox placeholder)
 *   - tags that are children of an existing <picture>
 *   - SVGs, GIFs, and the small site logo (already tiny)
 *   - external URLs that are NOT served from this repo
 *
 * Hero-class first-paint images (e.g. the header logo) get
 * loading="eager" + fetchpriority="high" instead of lazy.
 */

const fs = require('fs');
const path = require('path');
const { parse, HTMLElement } = require('node-html-parser');

const ROOT = path.resolve(__dirname, '..');

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'image-manifest.json'), 'utf8'));
const manifestByPath = new Map();
for (const m of manifest) {
    // Index by normalized leading-slash form too
    manifestByPath.set(m.path, m);
    manifestByPath.set('/' + m.path, m);
}

function listHtmlFiles(dir, out) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const rel = path.relative(ROOT, abs);
        if (
            rel.startsWith('node_modules/') ||
            rel.startsWith('.git/') ||
            rel.startsWith('servisi/moon/node_modules/') ||
            rel === 'servisi/moon/index.html' || // built artifact for vite app
            rel.startsWith('admin/') // admin page is separate, skip
        ) continue;
        const st = fs.statSync(abs);
        if (st.isDirectory()) listHtmlFiles(abs, out);
        else if (name.endsWith('.html')) out.push(abs);
    }
}

function normalizeSrc(src, htmlFileAbs) {
    if (!src) return null;
    if (/^(?:https?:)?\/\//i.test(src)) return null; // external
    if (src.startsWith('data:')) return null;

    // Strip leading slash for repo-rooted absolute paths
    if (src.startsWith('/')) {
        return src.slice(1);
    }
    // Resolve relative path against the HTML file directory
    const htmlDir = path.dirname(htmlFileAbs);
    const abs = path.resolve(htmlDir, src);
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (rel.startsWith('..')) return null;
    return rel;
}

function isSkippableExt(p) {
    return /\.(svg|gif)$/i.test(p);
}

function isLogoLike(src) {
    return /logo\.png$/i.test(src) || /themes\//.test(src);
}

function variantBase(relPath) {
    const dir = path.dirname(relPath);
    const base = path.basename(relPath, path.extname(relPath));
    const prefix = '/assets/img-optimized/';
    return prefix + (dir === '.' ? '' : dir + '/') + base;
}

function pageRelativePrefix(htmlFileAbs) {
    // Compute the path back to repo root from the HTML file, so we can
    // emit URLs that work when the site is hosted under any sub-path. We
    // prefer absolute URLs (leading slash) — they already work from any
    // depth on this site — so we just always return "/".
    return '/';
}

function buildSrcsets(relPath, entryWidth) {
    const widths = [480, 768, 1200, 1920].filter((w) => w <= entryWidth);
    if (widths.length === 0) widths.push(entryWidth);
    const baseUrl = variantBase(relPath);
    return {
        avif: widths.map((w) => `${baseUrl}-${w}.avif ${w}w`).join(', '),
        webp: widths.map((w) => `${baseUrl}-${w}.webp ${w}w`).join(', '),
        fallback: entry => {
            const fb = `${baseUrl}-fallback.jpg`;
            return entryWidth ? fb : null;
        },
    };
}

function readSizeFromStyle(style) {
    if (!style) return { width: null, height: null };
    const wm = style.match(/(?:^|;)\s*width\s*:\s*(\d+)px/i);
    const hm = style.match(/(?:^|;)\s*height\s*:\s*(\d+)px/i);
    return {
        width: wm ? parseInt(wm[1], 10) : null,
        height: hm ? parseInt(hm[1], 10) : null,
    };
}

function transformFile(absPath) {
    const html = fs.readFileSync(absPath, 'utf8');
    const root = parse(html, { comment: true, lowerCaseTagName: false, voidTag: { closingSlash: true } });

    let changed = 0;

    root.querySelectorAll('img').forEach((img) => {
        // Skip if inside <picture> we already added
        if (img.parentNode && img.parentNode.rawTagName && img.parentNode.rawTagName.toLowerCase() === 'picture') {
            return;
        }
        const src = img.getAttribute('src');
        // Empty src (e.g. lightbox placeholder) — only ensure no implicit eager
        if (!src) return;

        // Add decoding=async to any img missing it
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
            changed++;
        }

        const rel = normalizeSrc(src, absPath);
        const isLogo = isLogoLike(src);
        const isExternalOrUnknown = rel === null;

        // Resolve dimensions
        const manifestEntry = rel ? manifestByPath.get(rel) : null;
        const style = img.getAttribute('style');
        const fromStyle = readSizeFromStyle(style);

        const targetWidth = img.getAttribute('width') || (manifestEntry && manifestEntry.width) || fromStyle.width;
        const targetHeight = img.getAttribute('height') || (manifestEntry && manifestEntry.height) || fromStyle.height;

        if (!img.hasAttribute('width') && targetWidth) {
            img.setAttribute('width', String(targetWidth));
            changed++;
        }
        if (!img.hasAttribute('height') && targetHeight) {
            img.setAttribute('height', String(targetHeight));
            changed++;
        }

        // Loading attribute
        if (!img.hasAttribute('loading')) {
            if (isLogo) {
                img.setAttribute('loading', 'eager');
                if (!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'high');
            } else {
                img.setAttribute('loading', 'lazy');
            }
            changed++;
        }

        // Wrap in <picture> when we have a local optimized variant set,
        // but skip the tiny logo and skippable extensions.
        if (!isLogo && !isExternalOrUnknown && manifestEntry && !isSkippableExt(rel) && manifestEntry.classification !== 'icon') {
            const { width: entryW } = manifestEntry;
            const widths = [480, 768, 1200, 1920].filter((w) => w <= entryW);
            if (widths.length === 0) widths.push(entryW);
            const baseUrl = variantBase(rel);
            const avifSrcset = widths.map((w) => `${baseUrl}-${w}.avif ${w}w`).join(', ');
            const webpSrcset = widths.map((w) => `${baseUrl}-${w}.webp ${w}w`).join(', ');
            const fallback = manifestEntry.size >= 100 * 1024 ? `${baseUrl}-fallback.jpg` : null;
            const sizesAttr = ` sizes="(max-width: 768px) 100vw, 50vw"`;

            // Update <img> src to fallback if we created one
            if (fallback) {
                img.setAttribute('src', fallback);
                changed++;
            }

            const sourceAvif = new HTMLElement('source', {}, `type="image/avif" srcset="${avifSrcset}"${sizesAttr}`, null);
            sourceAvif.setAttribute('type', 'image/avif');
            sourceAvif.setAttribute('srcset', avifSrcset);
            sourceAvif.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw');

            const sourceWebp = new HTMLElement('source', {}, '', null);
            sourceWebp.setAttribute('type', 'image/webp');
            sourceWebp.setAttribute('srcset', webpSrcset);
            sourceWebp.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw');

            const picture = new HTMLElement('picture', {}, '', null);
            picture.appendChild(sourceAvif);
            picture.appendChild(sourceWebp);

            // Replace img with picture
            const parent = img.parentNode;
            if (parent) {
                const idx = parent.childNodes.indexOf(img);
                if (idx >= 0) {
                    parent.childNodes.splice(idx, 1, picture);
                    picture.appendChild(img);
                    changed++;
                }
            }
        }
    });

    if (changed > 0) {
        fs.writeFileSync(absPath, root.toString(), 'utf8');
    }
    return changed;
}

function main() {
    const files = [];
    listHtmlFiles(ROOT, files);
    let total = 0;
    let touched = 0;
    for (const f of files) {
        const n = transformFile(f);
        total += n;
        if (n > 0) touched++;
    }
    console.log(`Processed ${files.length} HTML files, touched ${touched}, attribute changes: ${total}`);
}

main();
