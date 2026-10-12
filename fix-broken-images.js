#!/usr/bin/env node
/**
 * Fix broken image references on the pages listed by the user. Two
 * kinds of fixes:
 *
 *   REPLACE  — the referenced file is gone (404 locally and on production)
 *              but a clearly-equivalent file ships in
 *              sites/default/files/images/ already. Swap the src to the
 *              existing file using a root-anchored "/sites/…" path so it
 *              works at every nesting depth.
 *
 *   REMOVE   — there is no equivalent on disk or on production. The
 *              <img …> element is removed wholesale; the surrounding
 *              card/paragraph text stays.
 *
 * Run from repo root:  node fix-broken-images.js
 * Idempotent: a second run finds nothing to change.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Anchor each broken src on its basename + the optional preceding
// directory ("palisa/", "zvjezdarnica_nekada/", etc.). The matching
// regex below catches the same basename whether it's referenced via
// http://www.adip.hr/…, http://adip.hr/…, ../sites/…, ../../sites/…,
// or any combination of those.
const REPLACE = {
    // → povijest_bracom.jpg
    'Brachyt_m.jpg':              '/sites/default/files/images/povijest_bracom.jpg',
    // → povijest_Zvmioni.jpg
    'zvjezdarnica_nekada/Zvmioni.jpg': '/sites/default/files/images/povijest_Zvmioni.jpg',
    // → povijest_Tegetthoff.jpg
    'zvjezdarnica_nekada/Teget01.jpg': '/sites/default/files/images/povijest_Tegetthoff.jpg',
    '220px-Tegetthoff-lithographie.jpg': '/sites/default/files/images/povijest_Tegetthoff.jpg',
    // → povijest__Biblio.jpg
    'mornaricka_bibl.jpg':        '/sites/default/files/images/povijest__Biblio.jpg',
    // → povijest_Palisam.jpg
    'palisa/Palisam.jpg':         '/sites/default/files/images/povijest_Palisam.jpg',
    // → povijest_Benko.jpg
    'benko_grb.jpg':              '/sites/default/files/images/povijest_Benko.jpg',
    // povijesne-licnosti.html listing page references three portraits via
    // http://www.adip.hr — strip the host so the local file is used and
    // HTTPS pages stop being mixed-content blocked.
    'povijest_Palisam.jpg':       '/sites/default/files/images/povijest_Palisam.jpg',
    'povijest_Benko.jpg':         '/sites/default/files/images/povijest_Benko.jpg',
    'povijest_Tegetthoff.jpg':    '/sites/default/files/images/povijest_Tegetthoff.jpg',
};

// Basenames (or basename+single-dir-prefix) whose <img> we will delete
// because there is no replacement anywhere.
const REMOVE = new Set([
    'T&S_m.jpg',
    'Steinheil_m.jpg',
    'regno-italia.png',
    'zvjezdarnica_nekada/Austria-Hungaria.gif',
    'zvjezdarnica_nekada/Zvita.jpg',
    'zvjezdarnica_nekada/Zvrat.jpg',
    'zvjezdarnica_nekada/Zvsada.jpg',
    'zvjezdarnica_nekada/New.jpg',
    'palisa/PalisaM1.jpg',
    'palisa/PalisaM2.jpg',
    'palisa/maxwolf.jpg',
    'palisa/Wolf_2.jpg',
    'palisa/Wolf_3.jpg',
    'palisa/pal_dom1.jpg',
    'palisa/pal_dom2.jpg',
    'palisa/pal_pom_sun.jpg',
    'palisa/zv_bec1.jpg',
    'zvjezdarnica_nekada/SRH.gif',
    'zvjezdarnica_nekada/RH.gif',
    // astronomsko-drustvo-istra-pula.html image-grid — the six historical
    // photos were hosted only at http://www.adip.hr/ which now 404s, and
    // they don't ship in the repo either. The surrounding image-card
    // <div> with its caption stays so the page layout is intact; the
    // <img> just goes.
    '100_god_Istra-m.jpg',
    'Djemo-m.jpg',
    'Lenjinova_10a-m.jpg',
    'Lenjinova_10b-m.jpg',
    'Mladi_01-m.jpg',
    'Mladi_02-m.jpg',
]);

// The seven pages the user called out + the povijesne-licnosti listing
// page (whose http://www.adip.hr/ thumbnails were also being blocked).
const TARGETS = [
    'astronomsko-drustvo-istra-pula.html',
    'povijest-zvjezdarnice/zvjezdarnica-nekada.html',
    'povijest-zvjezdarnice/mornaricka-knjiznica.html',
    'povijest-zvjezdarnice/stari-instrumenti.html',
    'povijest-zvjezdarnice/povijesne-licnosti.html',
    'povijest-zvjezdarnice/povijesne-licnosti/johann-palisa.html',
    'povijest-zvjezdarnice/povijesne-licnosti/barun-ivo-benko-von-boinik.html',
    'povijest-zvjezdarnice/povijesne-licnosti/viceadmiral-wilhelm-von-tegetthoff.html',
];

const ALL_FILES = TARGETS.flatMap((p) => [p, 'en/' + p, 'it/' + p]);

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function srcRegexFor(token) {
    // Matches src="…<token>" where the leading path is any combination of
    // "http(s)://(www.)?adip.hr/…", "(../)*sites/…", or just bare.
    return new RegExp(
        `src="(?:https?:\\/\\/(?:www\\.)?adip\\.hr)?(?:[./]*sites\\/default\\/files\\/images\\/)?${escapeRegex(token)}"`,
        'g'
    );
}

// Greedy match for a full <img …> element. [^>] already includes \n and
// whitespace, so multi-line attributes are captured automatically. We
// keep the body lazy to stop at the FIRST closing ">" (the opening
// tag's "/>" or ">"), and require the src token somewhere inside.
function removeImgRegexFor(token) {
    return new RegExp(
        `<img\\b[^>]*?${srcRegexFor(token).source}[^>]*?>\\s*`,
        'g'
    );
}

let totalReplaced = 0;
let totalRemoved = 0;
const perFile = {};

for (const rel of ALL_FILES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
        console.warn('missing target file (skipped):', rel);
        continue;
    }
    let html = fs.readFileSync(file, 'utf8');
    const before = { replaced: 0, removed: 0 };

    // Apply REPLACE substitutions: rewrite the src attribute.
    for (const [token, replacement] of Object.entries(REPLACE)) {
        const re = srcRegexFor(token);
        html = html.replace(re, () => {
            before.replaced++;
            return `src="${replacement}"`;
        });
    }

    // Apply REMOVE: delete the whole <img …> element. The
    // trailing-whitespace eat lets us avoid leaving a dangling blank
    // line in cards that had the image as the only child of a
    // .history-img-container.
    for (const token of REMOVE) {
        const re = removeImgRegexFor(token);
        html = html.replace(re, () => {
            before.removed++;
            return '';
        });
    }

    if (before.replaced || before.removed) {
        fs.writeFileSync(file, html, 'utf8');
        perFile[rel] = before;
        totalReplaced += before.replaced;
        totalRemoved += before.removed;
    }
}

console.log('Replaced:', totalReplaced, '  Removed:', totalRemoved, '  Files touched:', Object.keys(perFile).length);
console.table(perFile);
