/* ADIP Senzori — stranica /senzori/
   Popis sesija, grafovi (Chart.js), način »uživo« i upravljanje tokenima.
   API: /api/senzori (vidi senzori/server/README.md). */
(function () {
  'use strict';

  var API = '/api/senzori';
  var LIMIT = 60000;              // završena sesija: zadnjih N redaka (cijela sesija je u CSV-u)
  var MAX_REDOVA = 60000;         // gornja granica redaka u memoriji (≈ 5 min × 200 Hz, 20 min × 50 Hz)
  var POVIJEST_S = 600;           // uživo: pri otvaranju se učita zadnjih 10 min (do MAX_REDOVA)
  var PRIRAST_S = 10;             // uživo: osvježavanje traži zadnjih ~10 s (+ vrijeme od zadnjeg dohvata), spaja se po t_ms
  var SIRINA_OSI_Y = 64;          // px — ista za sve grafove, da se osi x poklapaju
  var HZ_ZADANO = 200;            // ako sesija ne navodi sampleRateHz
  var PROZORI = [10, 30, 60, 300];                  // izbornik širine prozora (s)
  var MIN_SIRINA_MS = 1000;       // najuži prozor pri zumiranju
  var UZIVO_MS = 3000;            // osvježavanje u načinu uživo
  var POPIS_MS = 15000;           // osvježavanje popisa inače
  var SVJEZE_MS = 30000;          // sesija »uživo« ako je ažurirana u zadnjih 30 s
  var KLJUC_LOZINKE = 'senzori_lozinka';   // samo sessionStorage (kartica)

  var GRAFOVI = [
    { id: 'acc', naslov: 'Akceleracija (m/s²)', serije: [
      { stupac: 'ax', oznaka: 'x', boja: '#00d4ff' },
      { stupac: 'ay', oznaka: 'y', boja: '#f59e0b' },
      { stupac: 'az', oznaka: 'z', boja: '#a78bfa' }] },
    { id: 'lux', naslov: 'Osvijetljenost (lux)', serije: [{ stupac: 'lux', oznaka: 'lux', boja: '#facc15' }] },
    { id: 'infra', naslov: 'Infrazvuk 0,5–20 Hz (relativno / dBFS, osim ako je kalibrirano)', serije: [{ stupac: 'infra', oznaka: 'infra', boja: '#4ade80' }] },
    { id: 'p', naslov: 'Tlak zraka (hPa)', serije: [{ stupac: 'p_hpa', oznaka: 'p', boja: '#f472b6' }] }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var sesije = [];
  var odabrana = null;            // sessionId
  var grafovi = {};               // id → Chart
  var timerUzivo = null, timerPopis = null, zauzeto = false;
  var prozorS = 60;               // zadana širina prozora uživo (s)
  /* Učitani redovi odabrane sesije, sortirani po t_ms. */
  var buf = null;                 // { id, uzivo, stupci, it, redovi, ukupno }
  var trebaPuno = true;           // sljedeći dohvat: cijela povijest, ne samo prirast
  var zadnjiDohvat = 0;
  /* Pogled — zajednički za sve grafove. sirina null = cijela (učitana) sesija;
     prati = kraj prozora slijedi najnovije mjerenje (uživo). */
  var prikaz = { sirina: null, kraj: null, prati: true };
  var raspon = null;              // izračunati raspon osi x { min, max, korak, epoha }

  /* ── pomoćne ── */

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function datum(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function trajanje(s) {
    if (!isFinite(s) || s <= 0) return '';
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sek = s % 60;
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    return h ? h + ':' + dd(m) + ':' + dd(sek) : m + ':' + dd(sek);
  }

  function jeUzivo(s) {
    return s.updatedAt && Date.now() - new Date(s.updatedAt).getTime() < SVJEZE_MS;
  }

  function dohvati(url, opcije) {
    return fetch(url, Object.assign({ cache: 'no-store' }, opcije || {})).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var e = new Error((j && j.error) || ('HTTP ' + r.status));
          e.status = r.status;
          throw e;
        }
        return j;
      });
    });
  }

  function lozinka() {
    try { return sessionStorage.getItem(KLJUC_LOZINKE) || ''; } catch (e) { return ''; }
  }

  function zapamtiLozinku(l) {
    try { if (l) sessionStorage.setItem(KLJUC_LOZINKE, l); else sessionStorage.removeItem(KLJUC_LOZINKE); } catch (e) { }
    $('sz-obrisi').classList.toggle('hidden', !l || !odabrana);
  }

  function poruka(tekst, vrsta) {
    var p = $('sz-poruka');
    p.textContent = tekst || '';
    p.className = 'sz-poruka' + (vrsta ? ' ' + vrsta : '');
  }

  /* ── popis sesija ── */

  function ucitajPopis() {
    return dohvati(API + '/sesije').then(function (popis) {
      sesije = Array.isArray(popis) ? popis : [];
      crtajPopis();
    }).catch(function (e) {
      $('sz-popis').innerHTML = '';
      $('sz-popis').appendChild(el('p', 'sz-prazno', 'Popis nije dostupan (' + e.message + ').'));
    });
  }

  function crtajPopis() {
    var c = $('sz-popis');
    c.innerHTML = '';
    if (!sesije.length) {
      c.appendChild(el('p', 'sz-prazno', 'Još nema poslanih mjerenja.'));
      return;
    }
    sesije.forEach(function (s) {
      var b = el('button', 'sz-sesija' + (s.sessionId === odabrana ? ' aktivna' : ''));
      b.type = 'button';
      var d = el('div', 'sz-sesija__datum', datum(s.startedAt || s.updatedAt));
      if (jeUzivo(s)) d.appendChild(el('span', 'sz-znacka', 'UŽIVO'));
      b.appendChild(d);
      b.appendChild(el('div', 'sz-sesija__info', s.deviceModel || 'nepoznat uređaj'));
      var info = [(s.rows || 0).toLocaleString('hr-HR') + ' redaka'];
      if (s.sampleRateHz) {
        info.push(s.sampleRateHz + ' Hz');
        var t = trajanje(s.rows / s.sampleRateHz);
        if (t) info.push('≈ ' + t);
      }
      b.appendChild(el('div', 'sz-sesija__info', info.join(' · ')));
      b.title = s.sessionId;
      b.addEventListener('click', function () { odaberi(s.sessionId); });
      c.appendChild(b);
    });
  }

  /* ── detalj i grafovi ── */

  function odaberi(id) {
    if (odabrana !== id) { unistiGrafove(); buf = null; zadanPrikaz(); }
    odabrana = id;
    crtajPopis();
    $('sz-odaberi').classList.add('hidden');
    $('sz-sadrzaj').classList.remove('hidden');
    $('sz-naslov').textContent = id;
    $('sz-csv').href = API + '/sesije/' + encodeURIComponent(id) + '/csv';
    $('sz-csv').setAttribute('download', id + '.csv');
    $('sz-obrisi').classList.toggle('hidden', !lozinka());
    return ucitajSesiju();
  }

  function hzSesije(id) {
    var s = sesije.find(function (x) { return x.sessionId === id; });
    return (s && s.sampleRateHz) || HZ_ZADANO;
  }

  /* Uživo: prvi dohvat donosi zadnjih POVIJEST_S sekundi (za listanje unatrag), a zatim
     samo zadnjih ~PRIRAST_S s koji se spajaju po t_ms (API zna samo »zadnjih N redaka«). */
  function ucitajSesiju() {
    if (!odabrana) return Promise.resolve();
    var id = odabrana, uzivo = !!timerUzivo, hz = hzSesije(id);
    var puno = !buf || buf.id !== id || buf.uzivo !== uzivo || trebaPuno;
    var lim = !uzivo ? LIMIT
      : puno ? Math.min(MAX_REDOVA, Math.ceil(POVIJEST_S * hz) + 50)
      : Math.min(MAX_REDOVA, Math.ceil((PRIRAST_S + (Date.now() - zadnjiDohvat) / 1000) * hz) + 50);
    var pocetak = Date.now();
    return dohvati(API + '/sesije/' + encodeURIComponent(id) + '?limit=' + lim).then(function (s) {
      if (id !== odabrana || uzivo !== !!timerUzivo) return;
      zadnjiDohvat = pocetak;
      var meta = [s.deviceModel || 'nepoznat uređaj'];
      if (s.appVersion) meta.push('aplikacija ' + s.appVersion);
      if (s.sampleRateHz) meta.push(s.sampleRateHz + ' Hz');
      meta.push('početak ' + datum(s.startedAt));
      meta.push('zadnja promjena ' + datum(s.updatedAt));
      $('sz-meta').textContent = meta.join(' · ');
      spoji(id, uzivo, puno, s);
      crtajGrafove();
    }).catch(function (e) {
      if (e.status === 404) {
        odabrana = null;
        buf = null;
        unistiGrafove();
        $('sz-sadrzaj').classList.add('hidden');
        $('sz-odaberi').classList.remove('hidden');
        $('sz-odaberi').textContent = 'Sesija više ne postoji.';
      } else {
        $('sz-prikaz-info').textContent = 'Učitavanje nije uspjelo (' + e.message + ').';
      }
    });
  }

  function spoji(id, uzivo, puno, s) {
    var stupci = s.columns || [], it = stupci.indexOf('t_ms'), ukupno = s.totalRows || 0;
    var redovi = (s.rows || []).filter(function (r) { return it >= 0 && r[it] != null; });
    if (!puno && buf && (stupci.join() !== buf.stupci.join() || ukupno < buf.ukupno)) puno = true;
    if (puno) {
      for (var i = 1; i < redovi.length; i++) {
        if (redovi[i][it] < redovi[i - 1][it]) { redovi.sort(function (a, b) { return a[it] - b[it]; }); break; }
      }
      buf = { id: id, uzivo: uzivo, stupci: stupci, it: it, redovi: redovi, ukupno: ukupno };
      trebaPuno = false;
      return;
    }
    // propušteni redovi (npr. kartica je bila u pozadini) → idući put cijela povijest
    if (ukupno - buf.ukupno > redovi.length) trebaPuno = true;
    var zadnji = buf.redovi.length ? buf.redovi[buf.redovi.length - 1][it] : -Infinity;
    for (var j = 0; j < redovi.length; j++) {
      if (redovi[j][it] > zadnji) { buf.redovi.push(redovi[j]); zadnji = redovi[j][it]; }
    }
    buf.ukupno = ukupno;
    if (buf.redovi.length > MAX_REDOVA) buf.redovi.splice(0, buf.redovi.length - MAX_REDOVA);
  }

  function unistiGrafove() {
    Object.keys(grafovi).forEach(function (k) { grafovi[k].destroy(); });
    grafovi = {};
    $('sz-grafovi').innerHTML = '';
  }

  /* ── os x ── */

  function oznakaVremena(v, epoha, korakMs) {
    if (!epoha) return (v / 1000).toFixed(korakMs && korakMs < 1000 ? 1 : 0) + ' s';
    var d = new Date(v);
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    var t = dd(d.getHours()) + ':' + dd(d.getMinutes()) + ':' + dd(d.getSeconds());
    if (korakMs && korakMs < 1000) t += ',' + Math.floor(d.getMilliseconds() / 100);
    return t;
  }

  function oznakaSirine(ms) {
    var s = ms / 1000;
    if (s < 10) return s.toFixed(1).replace('.', ',') + ' s';
    if (s < 120) return Math.round(s) + ' s';
    return trajanje(s) + ' min';
  }

  /* Razmak oznaka (ms) za zadani raspon — najviše ~10 oznaka. */
  function korakZa(rasponMs, maxN) {
    maxN = maxN || 10;
    var koraci = [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000,
                  600000, 900000, 1800000, 3600000, 7200000, 10800000, 21600000, 43200000, 86400000];
    for (var i = 0; i < koraci.length; i++) if (rasponMs / koraci[i] <= maxN) return koraci[i];
    return Math.ceil(rasponMs / maxN / 86400000) * 86400000;
  }

  /* Oznake na višekratnicima koraka (okrugle sekunde po satu), uvijek isti razmak. */
  function oznakeOsiX(raspon, k) {
    var o = [];
    for (var v = Math.ceil(raspon.min / k) * k; v <= raspon.max + 1e-6; v += k) o.push({ value: v });
    return o;
  }

  /* Vrijednosti osi y: za vrlo male brojeve (|v| < 0,01) eksponencijalni zapis. */
  function brojY(os, v, i, oznake) {
    var maks = 0;
    for (var j = 0; j < oznake.length; j++) maks = Math.max(maks, Math.abs(oznake[j].value));
    if (maks > 0 && maks < 1e-2) return v === 0 ? '0' : v.toExponential(1);
    return Chart.Ticks.formatters.numeric.call(os, v, i, oznake);   // zadano (decimale prema razmaku)
  }

  /* ── pogled (zajednička os x) ── */

  function zadanPrikaz() {
    prikaz = { sirina: timerUzivo ? prozorS * 1000 : null, kraj: null, prati: true };
    uskladiIzbornik();
  }

  function uskladiIzbornik() {
    var s = prikaz.sirina, sel = $('sz-prozor');
    sel.options[0].textContent = s == null ? 'cijela' : oznakaSirine(s);   // vlastita širina (zoom)
    sel.value = s && PROZORI.indexOf(s / 1000) >= 0 ? String(s / 1000) : '';
  }

  function granicePodataka() {
    if (!buf || buf.it < 0 || !buf.redovi.length) return null;
    return { prvi: buf.redovi[0][buf.it], zadnji: buf.redovi[buf.redovi.length - 1][buf.it] };
  }

  function najvecaSirina(g) {
    var span = Math.max(g.zadnji - g.prvi, MIN_SIRINA_MS);
    return buf.uzivo ? Math.max(span, PROZORI[PROZORI.length - 1] * 1000) : span;
  }

  /* Iz pogleda i učitanih podataka računa raspon osi x (isti za sve grafove).
     Uživo i »prati«: prozor završava zadnjim mjerenjem sesije (ne satom preglednika,
     pa razlika satova ne stvara prazninu). Pomicanje je ograničeno na učitane podatke;
     ako je podataka manje od prozora, os ipak ima punu širinu (podaci desno). */
  function izracunajRaspon() {
    var g = granicePodataka();
    if (!g) return null;
    var span = Math.max(g.zadnji - g.prvi, MIN_SIRINA_MS);
    if (!buf.uzivo && prikaz.sirina != null && prikaz.sirina >= span) prikaz.sirina = null;
    var sirina = prikaz.sirina == null ? span : prikaz.sirina;
    var kraj;
    if (prikaz.sirina == null) kraj = g.prvi + span;
    else if (buf.uzivo && prikaz.prati) kraj = g.zadnji;
    else {
      kraj = prikaz.kraj == null ? g.zadnji : prikaz.kraj;
      kraj = Math.min(kraj, g.zadnji);
      if (sirina >= g.zadnji - g.prvi) kraj = g.zadnji;
      else kraj = Math.max(kraj, g.prvi + sirina);
      if (buf.uzivo && kraj >= g.zadnji) prikaz.prati = true;   // dovučeno do kraja → opet prati
      prikaz.kraj = kraj;
    }
    return { min: kraj - sirina, max: kraj, korak: korakZa(sirina), epoha: g.prvi > 1e12 };
  }

  var cekaCrtanje = false;
  function primijeniPrikaz(odmah) {
    if (!odmah) {
      if (!cekaCrtanje) { cekaCrtanje = true; requestAnimationFrame(function () { cekaCrtanje = false; primijeniPrikaz(true); }); }
      return;
    }
    raspon = izracunajRaspon();
    if (!raspon) return;
    Object.keys(grafovi).forEach(function (k) {
      var x = grafovi[k].options.scales.x;
      x.min = raspon.min;
      x.max = raspon.max;
      grafovi[k].update('none');
    });
    azurirajKontrole();
  }

  /* Pogled [min, min + sirina]; sidro: vrijednosti ostaju unutar podataka. */
  function postaviPogled(min, sirina) {
    var g = granicePodataka();
    if (!g) return;
    sirina = Math.max(MIN_SIRINA_MS, Math.min(sirina, najvecaSirina(g)));
    prikaz.sirina = sirina;
    prikaz.kraj = min + sirina;
    prikaz.prati = false;
    uskladiIzbornik();
    primijeniPrikaz();
  }

  function pomakni(dms) {
    if (!raspon) return;
    postaviPogled(raspon.min + dms, raspon.max - raspon.min);
  }

  /* faktor > 1 = širi prozor; udio = položaj sidra (0 lijevo … 1 desno). */
  function zumiraj(faktor, udio) {
    if (!raspon) return;
    var sir = raspon.max - raspon.min;
    if (buf && buf.uzivo && prikaz.prati) udio = 1;            // dok prati, sidro je desni rub
    var g = granicePodataka();
    var nova = Math.max(MIN_SIRINA_MS, Math.min(sir * faktor, najvecaSirina(g)));
    var sidro = raspon.min + udio * sir;
    var prati = prikaz.prati && buf.uzivo;
    postaviPogled(sidro - udio * nova, nova);
    if (prati) prikaz.prati = true;
  }

  function naUzivo() {
    prikaz.prati = true;
    prikaz.kraj = null;
    if (prikaz.sirina == null) prikaz.sirina = prozorS * 1000;
    primijeniPrikaz(true);
  }

  function cijelaSesija() {
    prikaz = { sirina: null, kraj: null, prati: true };
    uskladiIzbornik();
    primijeniPrikaz(true);
  }

  function azurirajKontrole() {
    var uzivo = !!(buf && buf.uzivo);
    var prosl = uzivo && !prikaz.prati;
    $('sz-na-uzivo').classList.toggle('hidden', !prosl);
    $('sz-cijela').classList.toggle('hidden', uzivo || prikaz.sirina == null);
    if (!buf || !raspon) return;
    var n = buf.redovi.length.toLocaleString('hr-HR'), uk = buf.ukupno.toLocaleString('hr-HR');
    var g = granicePodataka();
    var od = oznakaVremena(g.prvi, raspon.epoha), doo = oznakaVremena(g.zadnji, raspon.epoha);
    var sir = oznakaSirine(raspon.max - raspon.min);
    var info;
    if (uzivo) {
      info = (prosl ? 'Pregled prošlosti (podaci se i dalje dohvaćaju)' : 'Uživo') + ': prozor ' + sir +
        ' · u memoriji ' + od + '–' + doo + ' (' + n + ' od ' + uk + ' redaka' +
        (buf.redovi.length >= MAX_REDOVA ? ', ograničenje ' + MAX_REDOVA.toLocaleString('hr-HR') : '') + ').';
    } else if (buf.ukupno > buf.redovi.length) {
      info = 'Prikazano zadnjih ' + n + ' od ' + uk + ' redaka (' + od + '–' + doo + ') — cijela sesija je u CSV-u.';
    } else {
      info = 'Prikazano svih ' + uk + ' redaka (' + od + '–' + doo + ').';
    }
    if (prikaz.sirina != null || uzivo) info += ' Povucite graf vodoravno za pomicanje; Ctrl + kotačić ili dva prsta za zoom.';
    else info += ' Ctrl + kotačić ili dva prsta za zoom, zatim povucite vodoravno.';
    $('sz-prikaz-info').textContent = info;
  }

  /* ── povlačenje i zoom (pointer events; vertikalno listanje stranice ostaje pregledniku) ── */

  var pokazivaci = {};            // pointerId → { x, y }
  var vuci = null;                // { id, x0, y0, odluka: null|'h'|'v', r0, chart }
  var stisak = null;              // { d0, s0, sidro, chart }

  function udioX(chart, clientX) {
    var a = chart.chartArea, rect = chart.canvas.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left - a.left) / Math.max(1, a.right - a.left)));
  }

  function sirinaPlatna(chart) { return Math.max(1, chart.chartArea.right - chart.chartArea.left); }

  function dodajInterakciju(canvas, chart) {
    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pokazivaci[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pokazivaci);
      if (ids.length === 2 && raspon) {
        var a = pokazivaci[ids[0]], b = pokazivaci[ids[1]];
        var s0 = raspon.max - raspon.min, u = udioX(chart, (a.x + b.x) / 2);
        stisak = { d0: Math.max(20, Math.abs(a.x - b.x)), s0: s0, sidro: raspon.min + u * s0, chart: chart };
        vuci = null;
        try { canvas.setPointerCapture(ids[0]); canvas.setPointerCapture(ids[1]); } catch (x) { }
        return;
      }
      if (ids.length === 1 && raspon) vuci = { id: e.pointerId, x0: e.clientX, y0: e.clientY, odluka: null, r0: raspon, chart: chart };
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = pokazivaci[e.pointerId];
      if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      if (stisak) {
        var ids = Object.keys(pokazivaci);
        if (ids.length < 2) return;
        var a = pokazivaci[ids[0]], b = pokazivaci[ids[1]];
        var nova = stisak.s0 * stisak.d0 / Math.max(20, Math.abs(a.x - b.x));
        var u = udioX(stisak.chart, (a.x + b.x) / 2);
        var prati = buf && buf.uzivo && prikaz.prati;
        if (prati) {                                   // dok prati, sidro je desni rub
          postaviPogled(Infinity, nova);
          prikaz.prati = true;
        } else {
          postaviPogled(stisak.sidro - u * nova, nova);
        }
        e.preventDefault();
        return;
      }
      if (!vuci || vuci.id !== e.pointerId) return;
      var dx = e.clientX - vuci.x0, dy = e.clientY - vuci.y0;
      if (!vuci.odluka) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          vuci.odluka = 'h';
          try { canvas.setPointerCapture(e.pointerId); } catch (x) { }
          canvas.classList.add('vuce');
        } else if (Math.abs(dy) > 6) {
          vuci.odluka = 'v';
        }
      }
      if (vuci.odluka === 'h') {
        var r0 = vuci.r0, s = r0.max - r0.min;
        postaviPogled(r0.min - dx / sirinaPlatna(vuci.chart) * s, s);
        e.preventDefault();
      }
    });
    var kraj = function (e) {
      delete pokazivaci[e.pointerId];
      if (stisak && Object.keys(pokazivaci).length < 2) stisak = null;
      if (vuci && vuci.id === e.pointerId) vuci = null;
      canvas.classList.remove('vuce');
    };
    canvas.addEventListener('pointerup', kraj);
    canvas.addEventListener('pointercancel', kraj);
    canvas.addEventListener('wheel', function (e) {
      if (!raspon) return;
      var w = sirinaPlatna(chart), s = raspon.max - raspon.min;
      if (e.ctrlKey) {                                   // Ctrl + kotačić, pinch na touchpadu
        e.preventDefault();
        zumiraj(Math.exp(Math.max(-100, Math.min(100, e.deltaY)) * 0.01), udioX(chart, e.clientX));
      } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {   // vodoravno listanje touchpadom
        e.preventDefault();
        pomakni(e.deltaX / w * s);
      }
    }, { passive: false });
    canvas.addEventListener('dblclick', function () { if (buf && buf.uzivo) naUzivo(); else cijelaSesija(); });
  }

  function crtajGrafove() {
    var stupci = buf ? buf.stupci : [], redovi = buf ? buf.redovi : [], it = buf ? buf.it : -1;
    raspon = izracunajRaspon();
    if (it < 0 || !raspon || typeof Chart === 'undefined') {
      azurirajKontrole();
      if (typeof Chart === 'undefined') $('sz-prikaz-info').textContent += ' (Biblioteka za grafove nije učitana.)';
      return;
    }

    GRAFOVI.forEach(function (g) {
      var skupovi = g.serije.map(function (s) {
        var ix = stupci.indexOf(s.stupac);
        var podaci = [];
        if (ix >= 0) {
          for (var i = 0; i < redovi.length; i++) {
            var y = redovi[i][ix];
            if (y != null) podaci.push({ x: redovi[i][it], y: y });
          }
        }
        return { label: s.oznaka, data: podaci, borderColor: s.boja, backgroundColor: s.boja,
                 borderWidth: 1.2, pointRadius: 0, tension: 0 };
      });
      var ima = skupovi.some(function (d) { return d.data.length; });
      var postojeci = grafovi[g.id];

      if (!ima) {
        if (postojeci) { postojeci.destroy(); delete grafovi[g.id]; var o = $('sz-graf-' + g.id); if (o) o.remove(); }
        return;
      }
      var nule = skupovi.every(function (d) { return d.data.every(function (p) { return p.y === 0; }); });
      if (postojeci) {
        postojeci.data.datasets.forEach(function (d, i) { d.data = skupovi[i].data; });
        postojeci.options.scales.x.min = raspon.min;
        postojeci.options.scales.x.max = raspon.max;
        postojeci.update('none');
        var n0 = $('sz-graf-' + g.id).querySelector('.sz-graf__nule');
        if (n0) n0.classList.toggle('hidden', !nule);
        return;
      }

      var omot = el('div', 'sz-graf');
      omot.id = 'sz-graf-' + g.id;
      var h3 = el('h3', null, g.naslov);
      h3.appendChild(el('span', 'sz-graf__nule' + (nule ? '' : ' hidden'), ' — sve vrijednosti su 0'));
      omot.appendChild(h3);
      var platno = el('div', 'sz-graf__platno');
      var canvas = document.createElement('canvas');
      platno.appendChild(canvas);
      omot.appendChild(platno);
      // redoslijed grafova prema GRAFOVI
      var kontejner = $('sz-grafovi'), umetnut = false;
      for (var k = GRAFOVI.indexOf(g) + 1; k < GRAFOVI.length && !umetnut; k++) {
        var sljedeci = $('sz-graf-' + GRAFOVI[k].id);
        if (sljedeci) { kontejner.insertBefore(omot, sljedeci); umetnut = true; }
      }
      if (!umetnut) kontejner.appendChild(omot);

      grafovi[g.id] = new Chart(canvas, {
        type: 'line',
        data: { datasets: skupovi },
        options: {
          animation: false,
          parsing: false,
          normalized: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 36 } },   // mjesto za zadnju oznaku — stalna širina područja grafa
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
          plugins: {
            legend: { display: g.serije.length > 1, labels: { color: '#a0a0b0', boxWidth: 12 } },
            decimation: { enabled: true, algorithm: 'lttb', samples: 800 },
            tooltip: { callbacks: {
              title: function (it) { return it.length && raspon ? oznakaVremena(it[0].parsed.x, raspon.epoha, 1) : ''; },
              label: function (c) {
                var y = c.parsed.y, a = Math.abs(y);
                return c.dataset.label + ': ' + (a && (a < 1e-2 || a >= 1e5) ? y.toExponential(3) : Number(y.toPrecision(7)).toLocaleString('hr-HR', { maximumFractionDigits: 7 }));
              } } }
          },
          scales: {
            x: { type: 'linear', min: raspon.min, max: raspon.max,
                 ticks: { color: '#a0a0b0', autoSkip: false, maxRotation: 0,
                          callback: function (v) { return raspon ? oznakaVremena(v, raspon.epoha, this.$korak || raspon.korak) : ''; } },
                 afterBuildTicks: function (os) {
                   if (!raspon) return;
                   // na uskom zaslonu rjeđe oznake (~75 px po oznaci); isti razmak na svim grafovima
                   var n = Math.max(2, Math.min(10, Math.floor((os.chart.width - SIRINA_OSI_Y - 36) / 75)));
                   os.$korak = korakZa(raspon.max - raspon.min, n);
                   os.ticks = oznakeOsiX(raspon, os.$korak);
                 },
                 grid: { color: 'rgba(255,255,255,0.06)' } },
            y: { ticks: { color: '#a0a0b0', callback: function (v, i, oznake) { return brojY(this, v, i, oznake); } },
                 afterFit: function (os) { os.width = SIRINA_OSI_Y; },   // ista širina → poravnate osi x
                 grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });
      dodajInterakciju(canvas, grafovi[g.id]);
    });
    azurirajKontrole();
  }

  /* ── uživo ── */

  function osvjezi() {
    if (zauzeto) return;
    zauzeto = true;
    Promise.all([ucitajPopis(), ucitajSesiju()]).then(function () { zauzeto = false; }, function () { zauzeto = false; });
  }

  function postaviUzivo(ukljuceno) {
    clearInterval(timerUzivo);
    timerUzivo = ukljuceno ? setInterval(osvjezi, UZIVO_MS) : null;
    zadanPrikaz();
    if (ukljuceno) osvjezi();
    else ucitajSesiju();          // natrag na cijelu (učitanu) sesiju
  }
  /* ── brisanje sesije ── */

  function obrisiSesiju() {
    var l = lozinka();
    if (!odabrana || !l) return;
    if (!confirm('Trajno obrisati sesiju »' + odabrana + '«?')) return;
    dohvati(API + '/sesije/' + encodeURIComponent(odabrana), { method: 'DELETE', headers: { 'X-Senzori-Lozinka': l } })
      .then(function () {
        odabrana = null;
        unistiGrafove();
        $('sz-sadrzaj').classList.add('hidden');
        $('sz-odaberi').classList.remove('hidden');
        $('sz-odaberi').textContent = 'Sesija je obrisana.';
        ucitajPopis();
      })
      .catch(function (e) {
        if (e.status === 401) zapamtiLozinku('');
        alert('Brisanje nije uspjelo: ' + e.message);
      });
  }

  /* ── tokeni ── */

  function lozinkaIzPolja() {
    return $('sz-lozinka').value || lozinka();
  }

  function kreirajToken(ev) {
    ev.preventDefault();
    var l = lozinkaIzPolja();
    poruka('Izrađujem token…');
    dohvati(API + '/tokeni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lozinka: l, naziv: $('sz-naziv').value.trim() })
    }).then(function (j) {
      zapamtiLozinku(l);
      $('sz-token-vrijednost').textContent = j.token;
      $('sz-novi-token').classList.remove('hidden');
      $('sz-naziv').value = '';
      poruka('Token »' + j.naziv + '« je izrađen (id ' + j.id + ').', 'uspjeh');
      if (!$('sz-tablica-tokena').classList.contains('hidden')) popisTokena();
    }).catch(function (e) {
      if (e.status === 401) zapamtiLozinku('');
      poruka(e.message, 'greska');
    });
  }

  function popisTokena() {
    var l = lozinkaIzPolja();
    if (!l) { poruka('Upišite lozinku.', 'greska'); return; }
    dohvati(API + '/tokeni', { headers: { 'X-Senzori-Lozinka': l } }).then(function (j) {
      zapamtiLozinku(l);
      var tb = $('sz-tokeni-tijelo');
      tb.innerHTML = '';
      if (!j.tokeni.length) {
        var r0 = el('tr'); var td0 = el('td', null, 'Nema tokena.'); td0.colSpan = 5; r0.appendChild(td0); tb.appendChild(r0);
      }
      j.tokeni.forEach(function (t) {
        var r = el('tr');
        r.appendChild(el('td', null, t.naziv));
        r.appendChild(el('td', null, t.id));
        r.appendChild(el('td', null, datum(t.created)));
        r.appendChild(el('td', null, t.lastUsed ? datum(t.lastUsed) : '—'));
        var td = el('td');
        var b = el('button', 'btn btn--danger btn--xs', 'Opozovi');
        b.type = 'button';
        b.addEventListener('click', function () { opozovi(t); });
        td.appendChild(b);
        r.appendChild(td);
        tb.appendChild(r);
      });
      $('sz-tablica-tokena').classList.remove('hidden');
      poruka('');
    }).catch(function (e) {
      if (e.status === 401) zapamtiLozinku('');
      poruka(e.message, 'greska');
    });
  }

  function opozovi(t) {
    if (!confirm('Opozvati token »' + t.naziv + '« (' + t.id + ')? Aplikacija s tim tokenom više neće moći slati mjerenja.')) return;
    dohvati(API + '/tokeni/' + encodeURIComponent(t.id), { method: 'DELETE', headers: { 'X-Senzori-Lozinka': lozinkaIzPolja() } })
      .then(function () { poruka('Token »' + t.naziv + '« je opozvan.', 'uspjeh'); popisTokena(); })
      .catch(function (e) { poruka(e.message, 'greska'); });
  }

  function kopiraj() {
    var t = $('sz-token-vrijednost').textContent;
    var gotovo = function () { $('sz-kopiraj').textContent = 'Kopirano ✓'; setTimeout(function () { $('sz-kopiraj').textContent = 'Kopiraj'; }, 2000); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t).then(gotovo, function () { odaberiTekst(); });
    } else {
      odaberiTekst();
      try { if (document.execCommand('copy')) gotovo(); } catch (e) { }
    }
  }

  function odaberiTekst() {
    var r = document.createRange();
    r.selectNodeContents($('sz-token-vrijednost'));
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* ── start ── */

  document.addEventListener('DOMContentLoaded', function () {
    if (lozinka()) $('sz-lozinka').value = lozinka();
    $('sz-uzivo').addEventListener('change', function () { postaviUzivo(this.checked); });
    $('sz-prozor').addEventListener('change', function () {
      var v = parseInt(this.value, 10);
      if (PROZORI.indexOf(v) < 0) return;
      if (timerUzivo) prozorS = v;
      if (!raspon) { prikaz.sirina = v * 1000; return; }
      var prati = !!timerUzivo && prikaz.prati;
      postaviPogled(raspon.max - v * 1000, v * 1000);     // desni rub ostaje
      if (prati) prikaz.prati = true;
    });
    $('sz-na-uzivo').addEventListener('click', naUzivo);
    $('sz-cijela').addEventListener('click', cijelaSesija);
    $('sz-obrisi').addEventListener('click', obrisiSesiju);
    $('sz-forma-token').addEventListener('submit', kreirajToken);
    $('sz-popis-tokena').addEventListener('click', popisTokena);
    $('sz-kopiraj').addEventListener('click', kopiraj);
    $('sz-zaboravi').addEventListener('click', function () {
      zapamtiLozinku('');
      $('sz-lozinka').value = '';
      $('sz-tablica-tokena').classList.add('hidden');
      poruka('Lozinka je zaboravljena.');
    });

    ucitajPopis().then(function () {
      // ?s=<sessionId> otvara sesiju izravno; inače najnovija
      var trazena = new URLSearchParams(location.search).get('s');
      var prva = sesije.find(function (s) { return s.sessionId === trazena; }) || sesije[0];
      if (prva) odaberi(prva.sessionId);
      if (sesije.some(jeUzivo)) { $('sz-uzivo').checked = true; postaviUzivo(true); }
    });
    timerPopis = setInterval(function () { if (!timerUzivo) ucitajPopis(); }, POPIS_MS);
  });
})();
