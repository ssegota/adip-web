#!/usr/bin/env node
/**
 * D3: add `defer` to CDN <script src=…> in <head> on pages where the
 * script isn't needed at first paint. Skips legacy Drupal pages (node/,
 * povijest-zvjezdarnice/povijesne-licnosti.html, galerija-slika/35.html,
 * user.html, user/password.html) — those bootstrap jQuery + Drupal
 * synchronously and their inline scripts depend on that ordering.
 *
 * Touches only:
 *   servisi.html, en/servisi.html, it/servisi.html (suncalc + chart.js)
 *   servisi/visible.html (astronomy.browser.min.js)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
    'servisi.html',
    'en/servisi.html',
    'it/servisi.html',
    'servisi/visible.html',
];

const DEFER_HOSTS = [
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'astronomy.browser.min.js',
];

for (const rel of PAGES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    let changed = false;
    html = html.replace(/<script\s+([^>]*?)src="([^"]+)"([^>]*)>/g, (match, before, src, after) => {
        const all = before + after;
        if (/\bdefer\b/.test(all) || /\basync\b/.test(all)) return match;
        if (!DEFER_HOSTS.some((h) => src.includes(h))) return match;
        changed = true;
        return `<script ${before}src="${src}" defer${after}>`;
    });
    if (changed) {
        fs.writeFileSync(file, html, 'utf8');
        console.log('deferred CDN scripts in', rel);
    }
}
