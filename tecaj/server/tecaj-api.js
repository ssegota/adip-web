/* =========================================================
   Tečaj astronomije — poslužiteljski dio
   Astronomsko društvo "Istra" Pula

   Registrira dva poziva na postojeći Express `app`:

     GET  /api/tecaj-vidljivost   → trenutno stanje (za sinkronizaciju ploče)
     POST /api/tecaj-vidljivost   → zapiši novo stanje (traži token)

   POST zapisuje tecaj/data/vidljivost.js — datoteku koju stranice tečaja
   učitavaju običnom <script> oznakom. Zato izmjena odmah vrijedi za
   svakog posjetitelja i s bilo kojeg računala, bez ikakvog uploada.

   ── UGRADNJA ────────────────────────────────────────────
   U server.js, IZNAD reda `app.listen(...)`, dodaj jedan red:

       require('./tecaj/server/tecaj-api')(app);

   Ništa drugo. Modul koristi samo ugrađene Node module (fs, path).
   ========================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JS_FILE = path.join(DATA_DIR, 'vidljivost.js');
const JSON_FILE = path.join(DATA_DIR, 'vidljivost.json');

module.exports = function registrirajTecajApi(app, opcije) {
  opcije = opcije || {};

  /* Isti token koji /api/login u server.js vraća pri uspješnoj prijavi.
     Ako ga tamo promijeniš, proslijedi novi:
         require('./tecaj/server/tecaj-api')(app, { token: 'novi-token' }); */
  const TOKEN = opcije.token || 'fake-jwt-token-adip';

  /* Prihvati samo oblik { brojLekcije: boolean }. Sve drugo se odbacuje —
     da poziv izvana ne može upisati bilo što u datoteku koja se izvršava
     kao JavaScript u pregledniku. */
  function ocisti(v) {
    const out = {};
    if (!v || typeof v !== 'object') return out;
    Object.keys(v).forEach(function (k) {
      const n = parseInt(k, 10);
      if (!isNaN(n) && n >= 1 && n <= 99 && String(n) === String(k).trim()
        && typeof v[k] === 'boolean') {
        out[n] = v[k];
      }
    });
    return out;
  }

  function zapisi(vid) {
    const redovi = Object.keys(vid).map(Number)
      .sort(function (a, b) { return a - b; })
      .map(function (n) { return '  ' + n + ': ' + (vid[n] ? 'true ' : 'false') + ','; })
      .join('\n');

    const sadrzaj =
      '/* Vidljivost lekcija tečaja — vrijedi za SVE posjetitelje.\n' +
      ' *\n' +
      ' * Ovu datoteku zapisuje server (POST /api/tecaj-vidljivost) kad urednik\n' +
      ' * pomakne prekidač na naslovnoj tečaja. Ne uređivati ručno dok se\n' +
      ' * koristi urednička ploča — bit će prepisana.\n' +
      ' *\n' +
      ' * Zapisano: ' + new Date().toISOString() + '\n' +
      ' */\n' +
      'window.TECAJ_VIDLJIVOST = {\n' + redovi + '\n};\n';

    fs.mkdirSync(DATA_DIR, { recursive: true });

    /* Zapis preko privremene datoteke pa preimenovanje — tako posjetitelj
       koji upravo učitava stranicu nikad ne dobije polovičnu datoteku. */
    const tmp = JS_FILE + '.tmp';
    fs.writeFileSync(tmp, sadrzaj, 'utf8');
    fs.renameSync(tmp, JS_FILE);

    /* Isto stanje i kao JSON, za GET poziv */
    fs.writeFileSync(JSON_FILE, JSON.stringify(vid, null, 2), 'utf8');
  }

  app.get('/api/tecaj-vidljivost', function (req, res) {
    fs.readFile(JSON_FILE, 'utf8', function (err, data) {
      if (err) return res.json({ success: true, vidljivost: null });
      try {
        res.json({ success: true, vidljivost: JSON.parse(data) });
      } catch (e) {
        res.json({ success: true, vidljivost: null });
      }
    });
  });

  app.post('/api/tecaj-vidljivost', function (req, res) {
    const tijelo = req.body || {};

    if (tijelo.token !== TOKEN) {
      return res.status(401).json({ success: false, message: 'Nije dopušteno — prijavi se ponovno.' });
    }

    const vid = ocisti(tijelo.vidljivost);
    if (!Object.keys(vid).length) {
      return res.status(400).json({ success: false, message: 'Nema ispravnih podataka.' });
    }

    try {
      zapisi(vid);
      res.json({ success: true, vidljivost: vid });
    } catch (e) {
      console.error('[tecaj] zapis vidljivosti nije uspio:', e);
      res.status(500).json({
        success: false,
        message: 'Zapis na disk nije uspio (' + (e.code || e.message) + '). ' +
          'Provjeri prava pisanja na mapi tecaj/data/.'
      });
    }
  });

  console.log('[tecaj] API vidljivosti registriran → ' + JS_FILE);
};
