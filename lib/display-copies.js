/*
 * Kopije slika za prikaz u lightboxu.
 *
 * Originali u galeriji znaju imati desetke MB (astrofotografije), a lightbox ih je
 * učitavao cijele - i na mobitelu. Zato uz svaku sliku postoji umanjena kopija:
 *   <mapa-slike>/display/<ime-bez-ekstenzije>.jpg
 * (duža stranica najviše 2560 px, progresivni JPEG q82, bez metapodataka).
 * Original ostaje dostupan gumbom »Puna rezolucija«.
 *
 * Ova datoteka je sama obrada jedne slike. Kopije nastaju na serveru (galerija/ i
 * aktivnosti-slike/ se ne deployaju iz gita) - red, backfill i radni proces su u
 * lib/display-queue.js i lib/display-worker.js; lokalno: scripts/generate-display.js.
 * Datoteka se piše u privremenu (.ime.tmp-PID) pa preimenuje - ako proces bude ubijen
 * usred posla, nikad se ne servira pola slike. Postojeća kopija novija od originala
 * se preskače, pa je obrada idempotentna.
 *
 * Kopija se NE radi kad je original već malen (duža stranica <= 2560 px i < 500 KB,
 * ili JPEG <= 2560 px i < 1.5 MB) ni za GIF (animacija); tada frontend dobije 404 i
 * prikaže original (isti mehanizam kao za thumbnailove).
 *
 * Alat: npm paket `sharp` (optionalDependencies). Ako nije instaliran ili se ne može
 * učitati na hostingu, pokušava se ImageMagick (convert/magick) ako postoji; inače
 * se kopije ne rade i sve radi kao prije (lightbox prikazuje original).
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { execFile } = require('child_process');

const MAX_EDGE = 2560;
const QUALITY = 82;
const SMALL_BYTES = 500 * 1024;
const SMALL_JPEG_BYTES = 1.5 * 1024 * 1024;
const IMAGE_RE = /\.(jpe?g|png|webp|tiff?)$/i;

// sharp se učitava tek kad zatreba (u radnom procesu lib/display-worker.js),
// da glavni server proces nikad ne drži libvips memoriju.
let sharp; // undefined = još nije učitan, null = nije dostupan
function loadSharp() {
    if (sharp !== undefined) return sharp;
    try {
        sharp = require('sharp');
        sharp.cache(false);       // bez cachea - drži memoriju niskom na shared hostingu
        sharp.concurrency(1);     // libvips s jednom dretvom
    } catch (e) {
        sharp = null;
    }
    return sharp;
}

let imageMagick; // undefined = još nije provjereno, null = nema ga
function findImageMagick() {
    if (imageMagick !== undefined) return Promise.resolve(imageMagick);
    const candidates = ['magick', 'convert', '/usr/bin/magick', '/usr/bin/convert', '/usr/local/bin/convert'];
    return new Promise(resolve => {
        const tryNext = i => {
            if (i >= candidates.length) { imageMagick = null; return resolve(null); }
            execFile(candidates[i], ['-version'], { timeout: 10000 }, (err, stdout) => {
                if (!err && /ImageMagick/.test(String(stdout))) { imageMagick = candidates[i]; return resolve(imageMagick); }
                tryNext(i + 1);
            });
        };
        tryNext(0);
    });
}

let engine = null; // 'sharp' | 'imagemagick' | 'none'

function displayPathFor(imagePath) {
    const dir = path.join(path.dirname(imagePath), 'display');
    const name = path.basename(imagePath).replace(/\.[^.]+$/, '') + '.jpg';
    return path.join(dir, name);
}

async function imageSize(file) {
    if (sharp) {
        const m = await sharp(file, { limitInputPixels: false, failOn: 'none' }).metadata();
        // EXIF orijentacija 5-8 zamjenjuje širinu i visinu, ali duža stranica ostaje ista
        return { width: m.width || 0, height: m.height || 0 };
    }
    const im = await findImageMagick();
    const identify = im && im.endsWith('magick') ? [im, ['identify']] : [im && im.replace(/convert$/, 'identify'), []];
    return new Promise((resolve, reject) => {
        execFile(identify[0], [...identify[1], '-ping', '-format', '%w %h', file + '[0]'], { timeout: 60000 }, (err, out) => {
            if (err) return reject(err);
            const [w, h] = String(out).trim().split(/\s+/).map(Number);
            resolve({ width: w || 0, height: h || 0 });
        });
    });
}

async function encode(src, tmp) {
    if (sharp) {
        await sharp(src, { limitInputPixels: false, failOn: 'none', sequentialRead: true })
            .rotate() // EXIF orijentacija
            .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
            .flatten({ background: '#000000' }) // prozirnost -> crna (kao lightbox i thumbovi)
            .jpeg({ quality: QUALITY, progressive: true, mozjpeg: false })
            .toFile(tmp);
        return;
    }
    const im = await findImageMagick();
    const args = [
        '-limit', 'memory', '256MiB', '-limit', 'map', '512MiB',
        '-define', `jpeg:size=${MAX_EDGE * 2}x${MAX_EDGE * 2}`, // shrink-on-load za velike JPEG-ove
        src + '[0]',
        '-auto-orient', '-background', 'black', '-flatten',
        '-resize', `${MAX_EDGE}x${MAX_EDGE}>`,
        '-strip', '-interlace', 'JPEG', '-quality', String(QUALITY),
        'jpg:' + tmp
    ];
    if (im.endsWith('magick')) args.unshift('convert');
    await new Promise((resolve, reject) => {
        execFile(im, args, { timeout: 10 * 60 * 1000 }, err => err ? reject(err) : resolve());
    });
}

/**
 * Napravi kopiju za prikaz za jednu sliku. Vraća 'made' | 'fresh' | 'small' | 'unsupported'.
 * Baca grešku ako obrada ne uspije.
 */
async function makeDisplayCopy(src) {
    if (!IMAGE_RE.test(src)) return 'unsupported';
    if ((await detectEngine()) === 'none') throw new Error('nema alata za obradu slika (sharp/ImageMagick)');
    const out = displayPathFor(src);
    const st = await fsp.stat(src);
    try {
        const ost = await fsp.stat(out);
        if (ost.mtimeMs >= st.mtimeMs && ost.size > 0) return 'fresh';
    } catch (e) { /* nema kopije */ }

    const { width, height } = await imageSize(src);
    const longEdge = Math.max(width, height);
    if (longEdge && longEdge <= MAX_EDGE) {
        const isJpeg = /\.jpe?g$/i.test(src);
        if (st.size < SMALL_BYTES || (isJpeg && st.size < SMALL_JPEG_BYTES)) {
            // Original je dovoljno malen; ukloni eventualnu zastarjelu kopiju
            await fsp.unlink(out).catch(() => {});
            return 'small';
        }
    }

    await fsp.mkdir(path.dirname(out), { recursive: true });
    const tmp = path.join(path.dirname(out), '.' + path.basename(out) + '.tmp-' + process.pid);
    try {
        await encode(src, tmp);
        await fsp.rename(tmp, out); // atomarno: nikad se ne servira napola zapisana datoteka
    } catch (e) {
        await fsp.unlink(tmp).catch(() => {});
        throw e;
    }
    return 'made';
}

/** Koji alat je dostupan: 'sharp' | 'imagemagick' | 'none' */
async function detectEngine() {
    if (engine) return engine;
    if (loadSharp()) engine = 'sharp';
    else engine = (await findImageMagick()) ? 'imagemagick' : 'none';
    return engine;
}

module.exports = { MAX_EDGE, IMAGE_RE, displayPathFor, makeDisplayCopy, detectEngine };
