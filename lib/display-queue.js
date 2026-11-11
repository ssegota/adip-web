/*
 * Red za kopije za prikaz u lightboxu (vidi lib/display-copies.js), u server procesu.
 *  - queueDisplayCopy(): nakon admin uploada, ima prednost,
 *  - startBackfill(): pri pokretanju servera, nakon kratke odgode, sve slike bez kopije.
 * Obrada je strogo sekvencijalna u JEDNOM radnom procesu (lib/display-worker.js) koji
 * se pokreće samo dok ima posla - glavni proces ne učitava sharp i ne blokira zahtjeve.
 * Ako radni proces pukne (npr. ubijen zbog memorije), ta slika se bilježi kao greška,
 * a posao se nastavlja (najviše 3 uzastopna pada, onda odustaje do idućeg restarta).
 * Više Passenger procesa: backfill radi samo onaj koji uzme tmp/display-backfill.lock.
 * Stanje se vidi na /api/version (polje display).
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { fork } = require('child_process');
const { IMAGE_RE, displayPathFor } = require('./display-copies');

const SKIP_DIRS = new Set(['thumbs', 'display']);
const LOCK_STALE_MS = 15 * 60 * 1000;
const LOCK_RETRY_MS = 2 * 60 * 1000;
const MAX_CRASHES = 3;

const status = {
    engine: 'unknown', // sharp | imagemagick | none (javlja radni proces)
    backfill: 'idle',  // idle | waiting | running | done | locked | disabled
    total: 0,
    made: 0,
    skipped: 0,
    failed: 0,
    queued: 0,
    lastError: null
};

let ROOT = path.join(__dirname, '..');
const queue = [];
const queued = new Set();
let worker = null;
let current = null;
let crashes = 0;
let disabled = false;

function log(...args) { console.log('[display]', ...args); }
function rel(f) { return path.relative(ROOT, f); }

function enqueue(file, front) {
    if (disabled || queued.has(file)) return;
    queued.add(file);
    if (front) queue.unshift(file); else queue.push(file);
    status.queued = queue.length;
    next();
}

function startWorker() {
    worker = fork(path.join(__dirname, 'display-worker.js'), [], {
        cwd: ROOT,
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        // manje malloc arena = manje memorije uz libvips
        env: Object.assign({}, process.env, { MALLOC_ARENA_MAX: '2' })
    });
    worker.ready = false;
    worker.on('message', onMessage);
    worker.on('error', e => { status.lastError = 'worker: ' + e.message; });
    worker.on('exit', (code, signal) => {
        const w = worker;
        worker = null;
        if (current) {
            // pao usred slike
            crashes++;
            status.failed++;
            status.lastError = `${rel(current)}: radni proces završio (${signal || code})`;
            console.error('[display] greška:', status.lastError);
            queued.delete(current);
            current = null;
            if (crashes >= MAX_CRASHES) return disable('radni proces stalno pada - odustajem do restarta');
        } else if (w && !w.ready && !disabled) {
            return disable('radni proces se nije pokrenuo');
        }
        next();
    });
}

function disable(reason) {
    disabled = true;
    log(reason);
    queue.length = 0;
    queued.clear();
    status.queued = 0;
    finishBackfill();
}

function onMessage(msg) {
    if (!msg) return;
    if (msg.engine) {
        status.engine = msg.engine;
        worker.ready = true;
        if (msg.engine === 'none') {
            return disable('ni sharp ni ImageMagick nisu dostupni - kopije za prikaz se ne rade (cPanel -> Setup Node.js App -> Run NPM Install)');
        }
        log(`radni proces spreman (${msg.engine})`);
        return next();
    }
    if (!msg.file || msg.file !== current) return;
    current = null;
    queued.delete(msg.file);
    crashes = 0;
    if (msg.error) {
        status.failed++;
        status.lastError = `${rel(msg.file)}: ${msg.error}`;
        console.error('[display] greška:', status.lastError);
    } else if (msg.result === 'made') {
        status.made++;
        log(`kopija ${rel(msg.file)} (${msg.ms} ms)`);
    } else if (msg.result !== 'fresh') {
        status.skipped++;
    }
    touchLock();
    // kratka pauza između slika
    setTimeout(next, 50);
}

function next() {
    if (disabled || current) return;
    if (!queue.length) {
        if (worker) worker.disconnect(); // radni proces izlazi, memorija se oslobađa
        if (status.backfill === 'running') finishBackfill();
        return;
    }
    if (!worker) return startWorker();
    if (!worker.ready || !worker.connected) return;
    current = queue.shift();
    status.queued = queue.length;
    worker.send({ file: current });
}

/* ---------- Backfill ---------- */
let lockFile = null;
let lockHeld = false;

function touchLock() {
    if (!lockHeld) return;
    const now = new Date();
    try { fs.utimesSync(lockFile, now, now); } catch (e) { /* ignore */ }
}

function acquireLock() {
    try {
        fs.mkdirSync(path.dirname(lockFile), { recursive: true });
        fs.writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
        lockHeld = true;
        return true;
    } catch (e) {
        if (e.code !== 'EEXIST') return false;
        try {
            // Lock je ostao od procesa koji više ne radi (Passenger restart) ili je star
            const owner = parseInt(fs.readFileSync(lockFile, 'utf8'), 10);
            let ownerAlive = false;
            if (owner && owner !== process.pid) {
                try { process.kill(owner, 0); ownerAlive = true; } catch (err) { ownerAlive = err.code === 'EPERM'; }
            }
            if (!ownerAlive || Date.now() - fs.statSync(lockFile).mtimeMs > LOCK_STALE_MS) {
                fs.writeFileSync(lockFile, String(process.pid));
                lockHeld = true;
                return true;
            }
        } catch (e2) { /* ignore */ }
        return false;
    }
}

function finishBackfill() {
    if (status.backfill !== 'running' && status.backfill !== 'waiting') return;
    status.backfill = disabled ? 'disabled' : 'done';
    if (lockHeld) {
        try { fs.unlinkSync(lockFile); } catch (e) { /* ignore */ }
        lockHeld = false;
    }
    log(`backfill gotov: novih ${status.made}, preskočeno ${status.skipped}, grešaka ${status.failed}`);
}

async function collect(dir, out) {
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (SKIP_DIRS.has(ent.name)) {
                // ostaci prekinutog pisanja (.ime.tmp-PID)
                if (ent.name === 'display') {
                    for (const f of await fsp.readdir(p).catch(() => [])) {
                        if (/^\..*\.tmp-\d+$/.test(f)) await fsp.unlink(path.join(p, f)).catch(() => {});
                    }
                }
                continue;
            }
            await collect(p, out);
        } else if (ent.isFile() && IMAGE_RE.test(ent.name) && !ent.name.startsWith('.')) {
            out.push(p);
        }
    }
}

/** Pozadinski backfill; ne blokira start i ne ruši server. */
function startBackfill(root, dirs, opts = {}) {
    ROOT = root;
    lockFile = path.join(root, 'tmp', 'display-backfill.lock');
    if (process.env.DISPLAY_BACKFILL === '0') { status.backfill = 'disabled'; return; }
    status.backfill = 'waiting';
    const attempt = async () => {
        try {
            if (!acquireLock()) {
                // drugi proces (npr. stari prije restarta) još radi - pokušaj kasnije
                if (status.backfill !== 'locked') log('backfill radi drugi proces - pokušavam ponovno za 2 min');
                status.backfill = 'locked';
                const retry = setTimeout(attempt, LOCK_RETRY_MS);
                if (retry.unref) retry.unref();
                return;
            }
            const files = [];
            for (const d of dirs) await collect(path.join(root, d), files);
            status.total = files.length;
            status.backfill = 'running';
            log(`backfill: provjeravam ${files.length} slika`);
            files.forEach(f => enqueue(f, false));
            if (!files.length) finishBackfill();
        } catch (e) {
            status.lastError = e.message;
            console.error('[display] backfill nije uspio:', e.message);
            finishBackfill();
        }
    };
    const timer = setTimeout(attempt, opts.delayMs == null ? 15000 : opts.delayMs);
    if (timer.unref) timer.unref();
}

/** Nakon admin uploada: kopija čim red dopusti (ispred backfilla). */
function queueDisplayCopy(absImagePath) {
    if (absImagePath && IMAGE_RE.test(absImagePath)) enqueue(path.resolve(absImagePath), true);
}

module.exports = { displayPathFor, queueDisplayCopy, startBackfill, status };
