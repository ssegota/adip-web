#!/usr/bin/env node
/**
 * Scans the source-image tree, classifies every image, records its dimensions
 * and on-disk size, and writes image-manifest.json at the repo root.
 *
 * Run from the repo root:  node scripts/build-image-manifest.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = [
    'galerija',
    'aktivnosti-slike',
    'sites',
    'downloads-files',
    'povijest-zvjezdarnice',
    'galerija-slika',
    'public',
    'admin',
];

const ROOT_FILES = ['background.png'];

const SKIP = (p) =>
    p.includes('/node_modules/') ||
    p.includes('/servisi/moon/') ||
    p.includes('/.git/') ||
    p.startsWith('assets/img-optimized/');

const EXT = /\.(jpe?g|png|gif|webp)$/i;

function walk(dir, out) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const rel = path.relative(ROOT, abs);
        if (SKIP(rel)) continue;
        const st = fs.statSync(abs);
        if (st.isDirectory()) walk(abs, out);
        else if (EXT.test(name)) out.push(rel);
    }
}

function classify(rel, size) {
    const lower = rel.toLowerCase();
    if (lower.includes('/themes/') || lower.endsWith('logo.png')) return 'icon';
    if (lower === 'background.png') return 'hero';
    if (lower.startsWith('galerija/astrofotografija/')) return 'astrophoto';
    if (lower.startsWith('galerija/')) return 'full';
    if (lower.startsWith('aktivnosti-slike/')) return 'full';
    if (lower.includes('thumbnails')) return 'thumbnail';
    if (size < 5 * 1024) return 'icon';
    return 'other';
}

async function main() {
    const files = [];
    for (const d of SCAN_DIRS) walk(path.join(ROOT, d), files);
    for (const f of ROOT_FILES) {
        const abs = path.join(ROOT, f);
        if (fs.existsSync(abs)) files.push(f);
    }
    files.sort();

    const manifest = [];
    for (const rel of files) {
        const abs = path.join(ROOT, rel);
        const st = fs.statSync(abs);
        let width = null;
        let height = null;
        let format = path.extname(rel).slice(1).toLowerCase();
        try {
            const meta = await sharp(abs).metadata();
            width = meta.width || null;
            height = meta.height || null;
            format = meta.format || format;
        } catch (err) {
            // best-effort; keep size only
        }
        manifest.push({
            path: rel,
            size: st.size,
            width,
            height,
            format,
            classification: classify(rel, st.size),
        });
    }

    fs.writeFileSync(
        path.join(ROOT, 'image-manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    const totals = manifest.reduce(
        (acc, m) => {
            acc[m.classification] = (acc[m.classification] || 0) + m.size;
            acc.total += m.size;
            acc.count += 1;
            return acc;
        },
        { total: 0, count: 0 }
    );
    console.log('Manifest entries:', manifest.length);
    console.log('Totals by class:', totals);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
