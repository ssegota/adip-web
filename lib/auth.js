/* =========================================================
   Prijava za administraciju stranice (adip.hr)

   - Lozinke: scrypt (Node crypto) s nasumičnom solju po korisniku,
     usporedba u konstantnom vremenu. U datoteci je samo hash.
   - Sesija: nasumični token (32 bajta) u kolačiću adip_sess
     (HttpOnly, Secure, SameSite=Strict). Na serveru se čuva samo
     SHA-256 tokena, u datoteci (radi i s više Passenger procesa i
     preživljava restart nakon deploya).
   - Trajanje: 12 h neaktivnosti, najviše 7 dana od prijave.
   - Ograničenje: 10 pogrešnih pokušaja po IP-u (100 ukupno) u 15 min -> 429.
   - Zaštita od CSRF: SameSite=Strict + provjera Origin/Sec-Fetch-Site
     na svakom zahtjevu koji mijenja podatke.
   - Zabrana po zadanom: SVAKI zahtjev koji nije GET/HEAD/OPTIONS traži
     prijavu, osim izričito navedenih javnih ruta (PUBLIC_WRITES).

   Podaci (users.json, sessions.json) su u data/.auth/ (ili ADIP_AUTH_DIR).
   data/ se ne deploya pa promjena lozinke preživljava svaki deploy;
   server.js tu mapu blokira za statiku.

   Rute:
     POST /api/login     {username, password} -> kolačić sesije
     POST /api/logout    -> poništava sesiju
     GET  /api/session   -> {authenticated, username}
     POST /api/password  {currentPassword, newPassword} (traži prijavu)
   ========================================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* Početni račun. Koristi se SAMO kad users.json još ne postoji (prvo
   pokretanje). U javnom repozitoriju je samo scrypt hash nasumične lozinke
   od 24 znaka (~140 bita) - iz njega se lozinka ne može izračunati.
   Lozinku treba promijeniti nakon prve prijave (/user/password.html). */
const SEED_USERS = {
    admin: 'scrypt$32768$8$1$6fd18c42c49f5ab7da537d813ecd7b08$22c4b6bd710a67ba76159121f8016819ae7094c59f067dd542a52bb9c40c3412'
};

const COOKIE = 'adip_sess';
const IDLE_MS = 12 * 60 * 60 * 1000;          // 12 h bez aktivnosti
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;   // najviše 7 dana od prijave
const TOUCH_MS = 5 * 60 * 1000;               // "zadnja aktivnost" se zapisuje najviše svakih 5 min
const MAX_FAILS = 10;                         // po IP-u
const MAX_FAILS_GLOBAL = 100;                 // ukupno (ako IP iza proxyja nije pouzdan)
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;

const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 32 };

/* Javni zahtjevi koji mijenjaju podatke (sve ostalo traži prijavu). */
const PUBLIC_WRITES = [
    { method: 'POST', re: /^\/api\/login\/?$/i },
    { method: 'POST', re: /^\/api\/logout\/?$/i },
    // Posjetitelj šalje sličicu PDF-a (samo JPEG <= 600 KB, samo PDF bez sličice) - vidi server.js
    { method: 'POST', re: /^\/api\/downloads\/[^/]+\/thumbnail\/?$/i },
    // Senzori imaju vlastitu provjeru (Bearer token aplikacije / lozinka) - senzori/server/senzori-api.js
    { method: '*', re: /^\/api\/senzori(\/|$)/i, ownAuth: true }
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function sha256(s) {
    return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, SCRYPT.keylen,
        { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 128 * SCRYPT.N * SCRYPT.r * 2 });
    return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('hex'), hash.toString('hex')].join('$');
}

// Lažni hash za nepostojećeg korisnika - da odgovor traje jednako dugo
const DUMMY_HASH = hashPassword(crypto.randomBytes(18).toString('base64'));

function verifyPassword(password, stored) {
    if (typeof password !== 'string' || !password || password.length > MAX_PASSWORD) return false;
    const d = String(stored || '').split('$');
    if (d.length !== 6 || d[0] !== 'scrypt') return false;
    const N = parseInt(d[1], 10), r = parseInt(d[2], 10), p = parseInt(d[3], 10);
    if (!(N >= 1024 && N <= 1048576 && (N & (N - 1)) === 0 && r >= 1 && r <= 32 && p >= 1 && p <= 16)) return false;
    const salt = Buffer.from(d[4], 'hex');
    const expected = Buffer.from(d[5], 'hex');
    if (!salt.length || expected.length < 16) return false;
    let actual;
    try {
        actual = crypto.scryptSync(password, salt, expected.length, { N, r, p, maxmem: 128 * N * r * 2 });
    } catch (e) {
        return false;
    }
    return crypto.timingSafeEqual(actual, expected);
}

/* IP klijenta: iza Apache proxyja zadnji unos X-Forwarded-For dodaje sam proxy
   (isto kao u senzori-api.js); prve unose klijent može lažirati. */
function clientIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
        const parts = xff.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length) return parts[parts.length - 1];
    }
    return (req.socket && req.socket.remoteAddress) || '?';
}

function parseCookies(header) {
    const out = {};
    String(header || '').split(';').forEach(part => {
        const i = part.indexOf('=');
        if (i < 0) return;
        const k = part.slice(0, i).trim();
        if (k && !(k in out)) out[k] = part.slice(i + 1).trim();
    });
    return out;
}

function isLocalHost(req) {
    const host = String(req.headers.host || '').toLowerCase();
    return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

function writeJsonAtomic(file, data) {
    const tmp = file + '.' + process.pid + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
}

function readJson(file, fallback) {
    try {
        const v = JSON.parse(fs.readFileSync(file, 'utf8'));
        return v && typeof v === 'object' ? v : fallback;
    } catch (e) {
        return fallback;
    }
}

module.exports = function createAuth(options) {
    options = options || {};
    const dir = path.resolve(options.dir || process.env.ADIP_AUTH_DIR || path.join(__dirname, '..', 'data', '.auth'));
    const USERS_FILE = path.join(dir, 'users.json');
    const SESSIONS_FILE = path.join(dir, 'sessions.json');

    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    if (!fs.existsSync(USERS_FILE)) {
        const seed = options.seedUsers || SEED_USERS;
        const users = {};
        Object.keys(seed).forEach(u => { users[u] = { hash: seed[u], created: new Date().toISOString() }; });
        writeJsonAtomic(USERS_FILE, { users });
        console.log('[auth] stvoren početni korisnički račun u ' + USERS_FILE);
    }

    const readUsers = () => readJson(USERS_FILE, { users: {} }).users || {};
    const readSessions = () => readJson(SESSIONS_FILE, {});

    /* ── ograničenje pokušaja ── */
    const fails = new Map(); // ip -> {n, since}
    let globalFails = { n: 0, since: Date.now() };
    function isBlocked(ip) {
        if (Date.now() - globalFails.since > FAIL_WINDOW_MS) globalFails = { n: 0, since: Date.now() };
        if (globalFails.n >= MAX_FAILS_GLOBAL) return true;
        const f = fails.get(ip);
        if (!f) return false;
        if (Date.now() - f.since > FAIL_WINDOW_MS) { fails.delete(ip); return false; }
        return f.n >= MAX_FAILS;
    }
    function recordFail(ip) {
        const now = Date.now();
        globalFails.n++;
        const f = fails.get(ip);
        if (!f || now - f.since > FAIL_WINDOW_MS) fails.set(ip, { n: 1, since: now });
        else f.n++;
        if (fails.size > 10000) {
            for (const [k, v] of fails) if (now - v.since > FAIL_WINDOW_MS) fails.delete(k);
        }
    }

    /* ── sesije ── */
    function pruneSessions(sessions, now) {
        Object.keys(sessions).forEach(k => {
            const s = sessions[k];
            if (!s || now - s.seen > IDLE_MS || now - s.created > MAX_AGE_MS) delete sessions[k];
        });
        return sessions;
    }

    function createSession(username) {
        const token = crypto.randomBytes(32).toString('base64url');
        const now = Date.now();
        const sessions = pruneSessions(readSessions(), now);
        sessions[sha256(token)] = { u: username, created: now, seen: now };
        writeJsonAtomic(SESSIONS_FILE, sessions);
        return token;
    }

    function tokenFrom(req) {
        const t = parseCookies(req.headers.cookie)[COOKIE];
        return t && /^[A-Za-z0-9_-]{20,100}$/.test(t) ? t : null;
    }

    // Vraća {username, key} za valjanu sesiju ili null
    function getSession(req) {
        if (req.adipSession !== undefined) return req.adipSession;
        req.adipSession = null;
        const token = tokenFrom(req);
        if (!token) return null;
        const key = sha256(token);
        const sessions = readSessions();
        const s = sessions[key];
        const now = Date.now();
        if (!s || now - s.seen > IDLE_MS || now - s.created > MAX_AGE_MS) return null;
        // korisnik mora i dalje postojati
        if (!readUsers()[s.u]) return null;
        if (now - s.seen > TOUCH_MS) {
            s.seen = now;
            try { writeJsonAtomic(SESSIONS_FILE, pruneSessions(sessions, now)); } catch (e) { /* nije kritično */ }
        }
        req.adipSession = { username: s.u, key };
        return req.adipSession;
    }

    function setCookie(req, res, token, maxAgeSec) {
        const parts = [COOKIE + '=' + token, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=' + maxAgeSec];
        if (!isLocalHost(req)) parts.push('Secure');
        res.append('Set-Cookie', parts.join('; '));
    }

    /* ── provjera izvora zahtjeva (CSRF, dodatna zaštita uz SameSite) ── */
    function sameOrigin(req) {
        const site = req.headers['sec-fetch-site'];
        if (site && site !== 'same-origin' && site !== 'none') return false;
        const origin = req.headers.origin;
        if (!origin) return true; // ne-preglednički klijent (curl...) - kolačić ionako treba
        if (origin === 'null') return false;
        let host;
        try { host = new URL(origin).host.toLowerCase(); } catch (e) { return false; }
        const allowed = [req.headers.host, req.headers['x-forwarded-host']]
            .filter(Boolean)
            .map(h => String(h).split(',')[0].trim().toLowerCase());
        return allowed.includes(host);
    }

    function deny(res, code, message) {
        res.set('Cache-Control', 'no-store');
        return res.status(code).json({ success: false, message });
    }

    /* Middleware: zabrana po zadanom za sve što mijenja podatke */
    function guard(req, res, next) {
        if (SAFE_METHODS.has(req.method)) return next();
        const pub = PUBLIC_WRITES.find(p => (p.method === '*' || p.method === req.method) && p.re.test(req.path));
        if (pub && pub.ownAuth) return next();
        if (!sameOrigin(req)) return deny(res, 403, 'Zahtjev s drugog izvora nije dopušten.');
        if (pub) return next();
        if (!getSession(req)) return deny(res, 401, 'Potrebna je prijava.');
        next();
    }

    // Za GET rute koje traže prijavu
    function requireSession(req, res, next) {
        if (!getSession(req)) return deny(res, 401, 'Potrebna je prijava.');
        next();
    }

    function install(app, jsonParser) {
        const parse = jsonParser || ((req, res, next) => next());

        app.post('/api/login', parse, (req, res) => {
            res.set('Cache-Control', 'no-store');
            const ip = clientIp(req);
            if (isBlocked(ip)) return deny(res, 429, 'Previše neuspjelih pokušaja. Pokušajte ponovno za 15 minuta.');
            const b = req.body || {};
            const username = typeof b.username === 'string' ? b.username.trim() : '';
            const password = typeof b.password === 'string' ? b.password : '';
            const users = readUsers();
            const user = username && username.length <= 100 && Object.prototype.hasOwnProperty.call(users, username)
                ? users[username] : null;
            const ok = verifyPassword(password, user ? user.hash : DUMMY_HASH) && !!user;
            if (!ok) {
                recordFail(ip);
                return deny(res, 401, 'Pogrešno korisničko ime ili lozinka.');
            }
            fails.delete(ip);
            const token = createSession(username);
            setCookie(req, res, token, Math.floor(MAX_AGE_MS / 1000));
            res.json({ success: true, username });
        });

        app.post('/api/logout', (req, res) => {
            res.set('Cache-Control', 'no-store');
            const token = tokenFrom(req);
            if (token) {
                const sessions = readSessions();
                const key = sha256(token);
                if (sessions[key]) {
                    delete sessions[key];
                    try { writeJsonAtomic(SESSIONS_FILE, sessions); } catch (e) { console.error('[auth] logout:', e.message); }
                }
            }
            setCookie(req, res, '', 0);
            res.json({ success: true });
        });

        app.get('/api/session', (req, res) => {
            res.set('Cache-Control', 'no-store');
            const s = getSession(req);
            res.json(s ? { authenticated: true, username: s.username } : { authenticated: false });
        });

        app.post('/api/password', parse, requireSession, (req, res) => {
            res.set('Cache-Control', 'no-store');
            const ip = clientIp(req);
            if (isBlocked(ip)) return deny(res, 429, 'Previše neuspjelih pokušaja. Pokušajte ponovno za 15 minuta.');
            const b = req.body || {};
            const current = typeof b.currentPassword === 'string' ? b.currentPassword : '';
            const next = typeof b.newPassword === 'string' ? b.newPassword : '';
            const username = req.adipSession.username;
            const users = readUsers();
            const user = users[username];
            if (!user || !verifyPassword(current, user.hash)) {
                recordFail(ip);
                return deny(res, 403, 'Trenutna lozinka nije točna.');
            }
            if (next.length < MIN_PASSWORD || next.length > MAX_PASSWORD) {
                return deny(res, 400, 'Nova lozinka mora imati ' + MIN_PASSWORD + ' do ' + MAX_PASSWORD + ' znakova.');
            }
            if (next === current) return deny(res, 400, 'Nova lozinka mora biti drukčija od trenutne.');
            user.hash = hashPassword(next);
            user.changed = new Date().toISOString();
            writeJsonAtomic(USERS_FILE, { users });
            // Odjavi sve ostale sesije tog korisnika
            const sessions = readSessions();
            Object.keys(sessions).forEach(k => {
                if (sessions[k] && sessions[k].u === username && k !== req.adipSession.key) delete sessions[k];
            });
            writeJsonAtomic(SESSIONS_FILE, sessions);
            res.json({ success: true });
        });
    }

    return { guard, requireSession, install, getSession, dir, PUBLIC_WRITES };
};

module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;
module.exports.PUBLIC_WRITES = PUBLIC_WRITES;
