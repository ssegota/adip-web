#!/usr/bin/env node
/* Test prijave za administraciju (lib/auth.js + server.js).
 *
 *   node scripts/test-auth.js
 *
 * Pokreće server na slučajnom portu s privremenom mapom za prijavu i testnom
 * lozinkom, pa:
 *  - iz izvornog koda pronađe SVE rute (app.get/post/put/delete/patch) i za svaku
 *    koja mijenja podatke provjeri da bez prijave vraća 401 (osim javnih iz
 *    PUBLIC_WRITES) - nova ruta bez zaštite odmah padne;
 *  - provjeri da s prijavom te iste rute prolaze provjeru (s nepostojećim id-em,
 *    pa ništa ne mijenjaju);
 *  - prijavu, odjavu, ograničenje pokušaja, promjenu lozinke, CSRF (Origin)
 *    i da tajne / kôd servera nisu dostupni kao statika.
 * Ne dira data/*.json (koristi samo nepostojeće id-eve i neispravna tijela).
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const auth = require('../lib/auth');

const ROOT = path.join(__dirname, '..');
const PORT = 20000 + Math.floor(Math.random() * 20000);
const BASE = 'http://localhost:' + PORT;
const PASS = 'testna-lozinka-' + Date.now();
const NEW_PASS = 'nova-testna-lozinka-' + Date.now();

let failed = 0, passed = 0;
function check(name, cond, extra) {
    if (cond) passed++;
    else { failed++; console.log('FAIL', name, extra !== undefined ? extra : ''); }
}

function routesFromSource() {
    const files = ['server.js', 'lib/auth.js', 'tecaj/server/tecaj-api.js', 'senzori/server/senzori-api.js'];
    const out = [];
    const re = /app\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
    files.forEach(f => {
        const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
        let m;
        while ((m = re.exec(src))) out.push({ method: m[1].toUpperCase(), path: m[2], file: f });
    });
    return out;
}

async function req(method, p, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    if (opts.cookie) headers.Cookie = opts.cookie;
    let body = opts.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
    }
    const r = await fetch(BASE + p, { method, headers, body, redirect: 'manual' });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { }
    return { status: r.status, json, text, setCookie: r.headers.get('set-cookie') || '' };
}

async function main() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adip-auth-test-'));
    fs.writeFileSync(path.join(dir, 'users.json'),
        JSON.stringify({ users: { admin: { hash: auth.hashPassword(PASS) } } }));
    const srv = spawn(process.execPath, ['server.js'], {
        cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(PORT), ADIP_AUTH_DIR: dir, ADIP_AUTH_NO_RESET: '1' }),
        stdio: ['ignore', 'pipe', 'pipe']
    });
    let log = '';
    srv.stdout.on('data', d => { log += d; });
    srv.stderr.on('data', d => { log += d; });
    try {
        for (let i = 0; i < 100; i++) {
            try { await fetch(BASE + '/api/version'); break; } catch (e) { await new Promise(r => setTimeout(r, 100)); }
        }

        const routes = routesFromSource();
        check('pronađene rute', routes.length > 25, routes.length);
        const isPublic = (method, p) => auth.PUBLIC_WRITES.some(w => (w.method === '*' || w.method === method) && w.re.test(p));
        const fill = p => p.replace(/:[a-zA-Z]+/g, '999999999999');
        const mutating = routes.filter(r => r.method !== 'GET');

        // 1. Bez prijave: svaka ne-javna ruta koja mijenja podatke -> 401
        for (const r of mutating) {
            const p = fill(r.path);
            if (isPublic(r.method, p)) continue;
            const res = await req(r.method, p, { body: {} });
            check('401 bez prijave: ' + r.method + ' ' + r.path, res.status === 401, res.status);
        }
        // i nepostojeće rute / druge metode (zabrana po zadanom)
        for (const [m, p] of [['POST', '/api/nepostojece'], ['PUT', '/api/galerija'], ['DELETE', '/index.html'], ['PATCH', '/api/aktivnosti/1'],
            ['POST', '/API/AKTIVNOSTI/1/DELETE'], ['POST', '/api/aktivnosti/1/delete/'], ['POST', '//api/upload']]) {
            const res = await req(m, p, { body: {} });
            check('401 po zadanom: ' + m + ' ' + p, res.status === 401, res.status);
        }
        // Javno čitanje radi
        for (const p of ['/api/aktivnosti', '/api/galerija', '/api/radovi', '/api/servisi', '/api/downloads', '/api/tecaj-vidljivost', '/api/senzori/status', '/index.html', '/data/galerija.json']) {
            const res = await req('GET', p);
            check('javni GET ' + p, res.status === 200, res.status);
        }
        // Javni upload sličice: bez prijave prolazi auth (400 jer nije JPEG), ne 401
        {
            const fd = new FormData();
            fd.append('thumbnail', new Blob([Buffer.from('nije jpeg')], { type: 'image/jpeg' }), 't.jpg');
            const res = await req('POST', '/api/downloads/999999999999/thumbnail', { body: fd });
            check('javni thumbnail ne traži prijavu', res.status === 400, res.status);
        }
        // Senzori imaju vlastitu provjeru
        {
            const res = await req('POST', '/api/senzori/batch', { body: {} });
            check('senzori batch: vlastita provjera (401 senzori)', res.status === 401 && res.json && res.json.ok === false, res.status);
        }

        // 2. Statika ne odaje tajne ni kôd servera
        for (const p of ['/data/.auth/users.json', '/data/%2eauth/users.json', '/data/.auth/sessions.json', '/server.js', '/package.json',
            '/lib/auth.js', '/node_modules/express/package.json', '/senzori/server/senzori-api.js', '/tecaj/server/tecaj-api.js',
            '/.gitignore', '/deploy/sftp-deploy.sh', '/scripts/test-auth.js', '/data/senzori/tokeni.json']) {
            const res = await req('GET', p);
            check('skriveno: ' + p, res.status === 404, res.status);
        }

        // 3. Prijava
        let res = await req('POST', '/api/login', { body: { username: 'admin', password: 'kriva' } });
        check('kriva lozinka -> 401', res.status === 401 && !res.setCookie, res.status);
        const msgWrongPw = res.json && res.json.message;
        res = await req('POST', '/api/login', { body: { username: 'nepostoji', password: 'kriva' } });
        check('nepostojeći korisnik -> ista poruka', res.status === 401 && res.json.message === msgWrongPw, res.json);
        res = await req('POST', '/api/login', { body: { username: 'admin', password: PASS }, headers: { Origin: 'https://evil.example' } });
        check('prijava s tuđeg Origin -> 403', res.status === 403, res.status);
        res = await req('POST', '/api/login', { body: { username: 'admin', password: PASS }, headers: { Origin: BASE } });
        check('prijava -> 200', res.status === 200 && res.json.success === true && !('token' in res.json), res.json);
        check('kolačić HttpOnly + SameSite=Strict', /adip_sess=[A-Za-z0-9_-]{40,}/.test(res.setCookie) && /HttpOnly/i.test(res.setCookie) && /SameSite=Strict/i.test(res.setCookie), res.setCookie);
        const cookie = res.setCookie.split(';')[0];

        res = await req('GET', '/api/session', { cookie });
        check('sesija aktivna', res.json && res.json.authenticated === true && res.json.username === 'admin', res.json);
        res = await req('GET', '/api/session');
        check('bez kolačića nije prijavljen', res.json && res.json.authenticated === false, res.json);
        res = await req('GET', '/api/session', { cookie: 'adip_sess=' + 'A'.repeat(43) });
        check('lažni token nije prijavljen', res.json && res.json.authenticated === false, res.json);

        // 4. S prijavom: ne-javne rute prolaze provjeru (nepostojeći id -> 404/400, nikad 401)
        for (const r of mutating) {
            const p = fill(r.path);
            if (isPublic(r.method, p) || /\/api\/(login|logout|password)$/.test(p)) continue;
            // Rute koje bi s ispravnim tijelom stvorile zapis šalju se s neispravnim / praznim multipartom
            const fd = new FormData();
            const body = /upload$|^\/api\/aktivnosti$|^\/api\/servisi$/.test(p) ? null : {};
            if (body === null) {
                // samo provjera da auth prolazi: Origin s tuđe domene -> 403 (CSRF), bez kolačića 401 (gore)
                const csrf = await req(r.method, p, { cookie, body: fd, headers: { Origin: 'https://evil.example' } });
                check('CSRF zaštita: ' + r.method + ' ' + r.path, csrf.status === 403, csrf.status);
                continue;
            }
            const res2 = await req(r.method, p, { cookie, body, headers: { Origin: BASE } });
            check('s prijavom prolazi: ' + r.method + ' ' + r.path, res2.status !== 401 && res2.status !== 403 && res2.status < 500, res2.status);
        }
        // Sec-Fetch-Site: cross-site -> 403 i s valjanim kolačićem
        res = await req('POST', '/api/aktivnosti/999999999999/delete', { cookie, headers: { 'Sec-Fetch-Site': 'cross-site' } });
        check('Sec-Fetch-Site cross-site -> 403', res.status === 403, res.status);

        // 5. Path traversal kod galerije
        {
            const fd = new FormData();
            fd.append('category', '../../js');
            fd.append('image', new Blob([Buffer.from('x')], { type: 'image/png' }), 'a.png');
            const r2 = await req('POST', '/api/galerija/upload', { cookie, body: fd });
            check('kategorija s ../ -> 400', r2.status === 400, r2.status);
            const fd2 = new FormData();
            fd2.append('category', 'ostalo');
            fd2.append('image', new Blob([Buffer.from('<svg/>')], { type: 'image/svg+xml' }), 'a.svg');
            const r3 = await req('POST', '/api/galerija/upload', { cookie, body: fd2 });
            check('SVG u galeriju -> 400', r3.status === 400, r3.status);
            const fd3 = new FormData();
            fd3.append('file', new Blob([Buffer.from('<script>alert(1)</script>')], { type: 'text/html' }), 'x.html');
            const r4 = await req('POST', '/api/downloads/upload', { cookie, body: fd3 });
            check('HTML u preuzimanja -> 400', r4.status === 400, r4.status);
        }

        // 6. Promjena lozinke
        res = await req('POST', '/api/password', { body: { currentPassword: PASS, newPassword: NEW_PASS } });
        check('promjena lozinke bez prijave -> 401', res.status === 401, res.status);
        const login2 = await req('POST', '/api/login', { body: { username: 'admin', password: PASS } });
        const cookie2 = login2.setCookie.split(';')[0];
        res = await req('POST', '/api/password', { cookie, body: { currentPassword: 'kriva', newPassword: NEW_PASS } });
        check('kriva trenutna lozinka -> 403', res.status === 403, res.status);
        res = await req('POST', '/api/password', { cookie, body: { currentPassword: PASS, newPassword: 'kratka' } });
        check('prekratka nova lozinka -> 400', res.status === 400, res.status);
        res = await req('POST', '/api/password', { cookie, body: { currentPassword: PASS, newPassword: NEW_PASS } });
        check('promjena lozinke -> 200', res.status === 200 && res.json.success, res.json);
        res = await req('GET', '/api/session', { cookie: cookie2 });
        check('druga sesija odjavljena nakon promjene', res.json.authenticated === false, res.json);
        res = await req('GET', '/api/session', { cookie });
        check('trenutna sesija ostaje', res.json.authenticated === true, res.json);
        res = await req('POST', '/api/login', { body: { username: 'admin', password: PASS } });
        check('stara lozinka više ne radi', res.status === 401, res.status);
        const stored = fs.readFileSync(path.join(dir, 'users.json'), 'utf8');
        check('u datoteci nema lozinke u čistom obliku', !stored.includes(NEW_PASS) && /scrypt\$/.test(stored));

        // 7. Odjava
        res = await req('POST', '/api/logout', { cookie });
        check('odjava -> 200 i briše kolačić', res.status === 200 && /Max-Age=0/.test(res.setCookie), res.setCookie);
        res = await req('GET', '/api/session', { cookie });
        check('nakon odjave sesija ne vrijedi', res.json.authenticated === false, res.json);
        res = await req('POST', '/api/aktivnosti/999999999999/delete', { cookie });
        check('nakon odjave admin ruta -> 401', res.status === 401, res.status);

        // 8. Ograničenje pokušaja (posebna IP adresa preko X-Forwarded-For)
        const xff = { 'X-Forwarded-For': '203.0.113.7' };
        let last;
        for (let i = 0; i < 10; i++) last = await req('POST', '/api/login', { body: { username: 'admin', password: 'kriva' + i }, headers: xff });
        check('10 pogrešnih -> još 401', last.status === 401, last.status);
        res = await req('POST', '/api/login', { body: { username: 'admin', password: NEW_PASS }, headers: xff });
        check('11. pokušaj (i s ispravnom lozinkom) -> 429', res.status === 429, res.status);
        res = await req('POST', '/api/login', { body: { username: 'admin', password: NEW_PASS }, headers: { 'X-Forwarded-For': '203.0.113.8' } });
        check('druga IP adresa se i dalje može prijaviti', res.status === 200, res.status);
    } finally {
        srv.kill();
        fs.rmSync(dir, { recursive: true, force: true });
    }
    console.log(`\n${passed} prošlo, ${failed} palo`);
    if (failed) { console.log('--- log servera ---\n' + log); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
