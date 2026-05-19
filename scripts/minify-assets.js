#!/usr/bin/env node
/**
 * D2/D3: minify local CSS and JS, generate `.min.css` / `.min.js` next
 * to the original (sourcemaps as `.map` siblings, NOT referenced from
 * production), and rewrite HTML to point at the minified bundles.
 * Then run html-minifier-terser over every HTML file in-place.
 *
 * Run from repo root:  node scripts/minify-assets.js
 *
 * Honoured guardrails:
 *   - Original files kept on disk (kept for debugging / source maps).
 *   - HTML references updated; the only on-the-wire change is `.min.css`
 *     in <link> and `.min.js` in <script src>.
 *   - server.js (Node-side) is NOT processed.
 *   - servisi/moon/* is NOT processed (separate vite app).
 *   - admin/* is NOT processed (admin-only page that already lives off
 *     the public navigation).
 */

const fs = require('fs');
const path = require('path');
const { minify: minifyJs } = require('terser');
const { minify: minifyHtml } = require('html-minifier-terser');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function listFiles(dir, exts, out) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const rel = path.relative(ROOT, abs);
        if (
            rel.startsWith('node_modules/') ||
            rel.startsWith('.git/') ||
            rel.startsWith('servisi/moon/') ||
            rel.startsWith('admin/') ||
            rel.startsWith('scripts/') ||
            rel.endsWith('.min.css') ||
            rel.endsWith('.min.js')
        ) continue;
        const st = fs.statSync(abs);
        if (st.isDirectory()) listFiles(abs, exts, out);
        else if (exts.some((e) => name.endsWith(e))) out.push(abs);
    }
}

async function minifyCss(file) {
    const csso = require.resolve('csso-cli/bin/csso');
    const out = file.replace(/\.css$/, '.min.css');
    const map = out + '.map';
    execSync(`node ${csso} -i ${JSON.stringify(file)} -o ${JSON.stringify(out)} --source-map file`, {
        stdio: ['ignore', 'ignore', 'pipe'],
    });
    return { src: file, out, map };
}

async function minifyJsFile(file) {
    const code = fs.readFileSync(file, 'utf8');
    const filename = path.basename(file);
    let result;
    try {
        result = await minifyJs({ [filename]: code }, {
            compress: { passes: 2 },
            mangle: true,
            sourceMap: {
                filename,
                url: filename.replace(/\.js$/, '.min.js.map'),
            },
        });
    } catch (err) {
        console.warn('terser failed for', file, '— keeping original');
        return null;
    }
    const out = file.replace(/\.js$/, '.min.js');
    const map = out + '.map';
    fs.writeFileSync(out, result.code, 'utf8');
    if (result.map) fs.writeFileSync(map, result.map, 'utf8');
    return { src: file, out, map };
}

function rewriteHtmlRefs(htmlPath, htmlContent, mapping) {
    let changed = false;
    let out = htmlContent;
    for (const { from, to } of mapping) {
        // Replace href="...from..." → href="...to..." (and src="…")
        // Use a permissive replace that ignores leading ../ etc.
        const escFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match optional ../../ prefix then exact path; preserve query params
        const re = new RegExp(`((?:\\.\\./)*)${escFrom}(\\?[^"]*)?`, 'g');
        const replaced = out.replace(re, (match, prefix, query) => {
            changed = true;
            return `${prefix || ''}${to}${query || ''}`;
        });
        out = replaced;
    }
    return { content: out, changed };
}

async function main() {
    const cssFiles = [];
    const jsFiles = [];
    const htmlFiles = [];
    listFiles(ROOT, ['.css'], cssFiles);
    listFiles(ROOT, ['.js'], jsFiles);
    listFiles(ROOT, ['.html'], htmlFiles);
    // Drop server.js (Node-side) and existing .min files
    const jsToMinify = jsFiles.filter((f) => {
        const rel = path.relative(ROOT, f);
        if (rel === 'server.js') return false;
        if (rel.endsWith('.min.js')) return false;
        if (rel.endsWith('-min.js')) return false;
        return true;
    });
    const cssToMinify = cssFiles.filter((f) => !f.endsWith('.min.css'));

    console.log(`Minifying ${cssToMinify.length} CSS and ${jsToMinify.length} JS files...`);

    const cssResults = [];
    for (const f of cssToMinify) {
        try {
            const r = await minifyCss(f);
            cssResults.push(r);
        } catch (err) {
            console.warn('csso failed for', f, err.message);
        }
    }
    const jsResults = [];
    for (const f of jsToMinify) {
        const r = await minifyJsFile(f);
        if (r) jsResults.push(r);
    }

    // Build rewrite map from absolute filesystem path → repo-relative .min
    const mapping = [];
    for (const r of [...cssResults, ...jsResults]) {
        const fromRel = path.relative(ROOT, r.src).split(path.sep).join('/');
        const toRel = path.relative(ROOT, r.out).split(path.sep).join('/');
        mapping.push({ from: fromRel, to: toRel });
    }
    // Sort longer paths first so nested matches happen before shorter ones
    mapping.sort((a, b) => b.from.length - a.from.length);

    let touched = 0;
    for (const html of htmlFiles) {
        if (path.relative(ROOT, html).startsWith('servisi/moon/')) continue;
        if (path.relative(ROOT, html).startsWith('admin/')) continue;
        const original = fs.readFileSync(html, 'utf8');
        const { content, changed } = rewriteHtmlRefs(html, original, mapping);
        if (changed) {
            fs.writeFileSync(html, content, 'utf8');
            touched++;
        }
    }
    console.log(`Updated references in ${touched} HTML files.`);

    // Now minify each HTML in-place
    let htmlBefore = 0;
    let htmlAfter = 0;
    let htmlTouched = 0;
    for (const html of htmlFiles) {
        if (path.relative(ROOT, html).startsWith('servisi/moon/')) continue;
        if (path.relative(ROOT, html).startsWith('admin/')) continue;
        const input = fs.readFileSync(html, 'utf8');
        htmlBefore += input.length;
        try {
            const out = await minifyHtml(input, {
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true,
                conservativeCollapse: false,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                decodeEntities: false,
                keepClosingSlash: true,
            });
            fs.writeFileSync(html, out, 'utf8');
            htmlAfter += out.length;
            htmlTouched++;
        } catch (err) {
            console.warn('html-minifier failed for', html, '— keeping original');
            htmlAfter += input.length;
        }
    }
    console.log(`Minified ${htmlTouched} HTML files. HTML: ${htmlBefore} → ${htmlAfter} bytes`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
