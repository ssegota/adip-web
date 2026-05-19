#!/usr/bin/env node
/**
 * Reads image-manifest.json and writes optimized variants to
 * assets/img-optimized/, mirroring the source folder structure.
 *
 * - Per non-icon image: widths 480, 768, 1200, 1920 (skip widths > original),
 *   each in WebP and AVIF.
 *      WebP quality 85 for astrophotos, 80 otherwise.
 *      AVIF quality 65 for astrophotos, 55 otherwise.
 * - Extra "thumb" at width 480 in webp + jpeg q70 for any image whose
 *   classification is `full` or `astrophoto` (used in gallery grids).
 * - Hero (background.png): same as `full`, no thumb.
 * - Fallback for HTML <img src=>:
 *      original kept if size < 100 KB
 *      otherwise a 1200w JPEG q80 fallback is written next to the variants
 * - EXIF/metadata stripped on all outputs (sharp does this by default).
 * - Skips files already up-to-date (matches mtime, not just existence).
 *
 * Outputs paths use the original file basename + suffix, e.g.
 *      galerija/povijest/povijest_1-768.webp
 *      galerija/povijest/povijest_1-768.avif
 *      galerija/povijest/povijest_1-thumb.webp
 *      galerija/povijest/povijest_1-fallback.jpg
 *
 * Run from the repo root: node scripts/optimize-images.js [--concurrency=N]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'assets', 'img-optimized');
const MANIFEST_PATH = path.join(ROOT, 'image-manifest.json');

const WIDTHS = [480, 768, 1200, 1920];
const THUMB_WIDTH = 480;
const FALLBACK_WIDTH = 1200;
const FALLBACK_SIZE_CUTOFF = 100 * 1024;

const argConcurrency = (() => {
    const arg = process.argv.find((a) => a.startsWith('--concurrency='));
    if (arg) return parseInt(arg.split('=')[1], 10);
    return Math.max(2, require('os').cpus().length - 1);
})();

const onlyFilter = (() => {
    const arg = process.argv.find((a) => a.startsWith('--only='));
    if (arg) return arg.split('=')[1];
    return null;
})();

function shouldOptimize(entry) {
    if (entry.classification === 'icon') return false;
    if (!entry.width || !entry.height) return false;
    if (path.extname(entry.path).toLowerCase() === '.gif') return false;
    return true;
}

function variantPathFor(entry, width, format) {
    const dir = path.dirname(entry.path);
    const base = path.basename(entry.path, path.extname(entry.path));
    return path.join(OUT_ROOT, dir, `${base}-${width}.${format}`);
}

function thumbPath(entry, format) {
    const dir = path.dirname(entry.path);
    const base = path.basename(entry.path, path.extname(entry.path));
    return path.join(OUT_ROOT, dir, `${base}-thumb.${format}`);
}

function fallbackPath(entry) {
    const dir = path.dirname(entry.path);
    const base = path.basename(entry.path, path.extname(entry.path));
    return path.join(OUT_ROOT, dir, `${base}-fallback.jpg`);
}

function ensureDir(p) {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isUpToDate(outPath, srcMtime) {
    if (!fs.existsSync(outPath)) return false;
    return fs.statSync(outPath).mtimeMs >= srcMtime;
}

async function processEntry(entry) {
    const src = path.join(ROOT, entry.path);
    const srcMtime = fs.statSync(src).mtimeMs;
    const isAstro = entry.classification === 'astrophoto';
    const webpQ = isAstro ? 85 : 80;
    const avifQ = isAstro ? 65 : 55;

    const widths = WIDTHS.filter((w) => w <= entry.width);
    if (widths.length === 0) widths.push(entry.width);

    const tasks = [];

    for (const w of widths) {
        for (const fmt of ['webp', 'avif']) {
            const out = variantPathFor(entry, w, fmt);
            if (isUpToDate(out, srcMtime)) continue;
            tasks.push(async () => {
                ensureDir(out);
                let pipe = sharp(src).rotate().resize({
                    width: w,
                    withoutEnlargement: true,
                });
                if (fmt === 'webp') {
                    pipe = pipe.webp({ quality: webpQ, effort: 5 });
                } else {
                    pipe = pipe.avif({ quality: avifQ, effort: 4 });
                }
                await pipe.toFile(out);
            });
        }
    }

    // Thumbnail (grid) variant
    if (entry.classification === 'full' || entry.classification === 'astrophoto') {
        for (const fmt of ['webp', 'jpg']) {
            const out = thumbPath(entry, fmt);
            if (isUpToDate(out, srcMtime)) continue;
            tasks.push(async () => {
                ensureDir(out);
                let pipe = sharp(src).rotate().resize({
                    width: THUMB_WIDTH,
                    withoutEnlargement: true,
                });
                if (fmt === 'webp') pipe = pipe.webp({ quality: 75, effort: 5 });
                else pipe = pipe.jpeg({ quality: 70, mozjpeg: true });
                await pipe.toFile(out);
            });
        }
    }

    // Fallback JPEG only when original is large
    if (entry.size >= FALLBACK_SIZE_CUTOFF) {
        const out = fallbackPath(entry);
        if (!isUpToDate(out, srcMtime)) {
            tasks.push(async () => {
                ensureDir(out);
                await sharp(src)
                    .rotate()
                    .resize({ width: FALLBACK_WIDTH, withoutEnlargement: true })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(out);
            });
        }
    }

    for (const t of tasks) await t();
    return tasks.length;
}

async function runPool(items, worker, concurrency) {
    let i = 0;
    let done = 0;
    const total = items.length;
    const startedAt = Date.now();
    async function pull() {
        while (i < items.length) {
            const idx = i++;
            try {
                const n = await worker(items[idx]);
                done++;
                if (done % 10 === 0 || done === total) {
                    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
                    console.log(`[${done}/${total}] (${elapsed}s) ${items[idx].path}${n ? ` → ${n} files` : ' (cached)'}`);
                }
            } catch (err) {
                console.error('FAIL', items[idx].path, err.message);
            }
        }
    }
    await Promise.all(Array.from({ length: concurrency }, pull));
}

async function main() {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    let items = manifest.filter(shouldOptimize);
    if (onlyFilter) items = items.filter((m) => m.path.includes(onlyFilter));
    console.log(`Optimizing ${items.length} images with concurrency=${argConcurrency}`);
    await runPool(items, processEntry, argConcurrency);
    console.log('Done.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
