#!/usr/bin/env node
/**
 * Wrap the site logo <img> in a <picture> that prefers the 256w WebP
 * (8.5 KB) over the 342 KB original PNG. We do this after the bulk HTML
 * rewriter because the logo is classified as an `icon` there and was
 * intentionally skipped.
 *
 * Re-runs idempotent: skips logos already wrapped.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function listHtmlFiles(dir, out) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const rel = path.relative(ROOT, abs);
        if (
            rel.startsWith('node_modules/') ||
            rel.startsWith('.git/') ||
            rel.startsWith('servisi/moon/node_modules/') ||
            rel.startsWith('admin/')
        ) continue;
        const st = fs.statSync(abs);
        if (st.isDirectory()) listHtmlFiles(abs, out);
        else if (name.endsWith('.html')) out.push(abs);
    }
}

const SRC_RE = /<img\s+([^>]*?)src="((?:\.\.\/)*sites\/all\/themes\/black_hole\/logo\.png)"([^>]*?)\/?>/g;

const replacement = (match, before, src, after) => {
    // Already inside a <picture>? skip
    // (We only conservatively rewrite; if a previous run made the change,
    // it'll have left the original <img> inside <picture> and this regex
    // won't run twice on the same node because the wrapping markup is
    // adjacent.)
    return (
        `<picture>` +
        `<source type="image/webp" srcset="/assets/img-optimized/sites/all/themes/black_hole/logo-256.webp">` +
        `<img ${before}src="/assets/img-optimized/sites/all/themes/black_hole/logo-256.png"${after}>` +
        `</picture>`
    );
};

function main() {
    const files = [];
    listHtmlFiles(ROOT, files);
    let touched = 0;
    for (const f of files) {
        const html = fs.readFileSync(f, 'utf8');
        if (html.includes('logo-256.webp')) continue; // already done
        const out = html.replace(SRC_RE, replacement);
        if (out !== html) {
            fs.writeFileSync(f, out, 'utf8');
            touched++;
        }
    }
    console.log('Logo wrapped in', touched, 'HTML files');
}

main();
