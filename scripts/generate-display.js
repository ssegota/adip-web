#!/usr/bin/env node
/*
 * Lokalno generira kopije za prikaz u lightboxu (<mapa>/display/<ime>.jpg, duža stranica
 * <= 2560 px) - ista pravila kao server (lib/display-copies.js). Na serveru se to radi
 * samo (upload + backfill pri pokretanju), ova skripta služi za lokalni rad i testiranje.
 * Postojeće svježe kopije se preskaču. Mape display/ nisu u gitu (.gitignore).
 *
 * Upotreba:  node scripts/generate-display.js [mapa-ili-slika ...]
 *            (bez argumenata: galerija/ i aktivnosti-slike/)
 * Treba `sharp` (npm install) ili ImageMagick.
 */
const fs = require('fs');
const path = require('path');
const { makeDisplayCopy, detectEngine } = require('../lib/display-copies');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const targets = (args.length ? args : ['galerija', 'aktivnosti-slike']).map(a => path.resolve(root, a));

function walk(p, out) {
    const st = fs.statSync(p);
    if (st.isFile()) return out.push(p);
    for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
        if (ent.isDirectory() && (ent.name === 'thumbs' || ent.name === 'display')) continue;
        walk(path.join(p, ent.name), out);
    }
}

(async () => {
    const files = [];
    targets.forEach(t => walk(t, files));
    const counts = { made: 0, fresh: 0, small: 0, unsupported: 0, failed: 0 };
    for (const f of files) {
        try {
            const r = await makeDisplayCopy(f);
            counts[r]++;
            if (r === 'made') console.log('kopija:', path.relative(root, f));
        } catch (e) {
            counts.failed++;
            console.error('greška:', path.relative(root, f), '-', e.message);
        }
    }
    console.log(`Alat: ${await detectEngine()}. Novih: ${counts.made}, već svježih: ${counts.fresh}, ` +
        `malih (bez kopije): ${counts.small}, ostalo: ${counts.unsupported}, grešaka: ${counts.failed}`);
    if (counts.failed) process.exitCode = 1;
})();
