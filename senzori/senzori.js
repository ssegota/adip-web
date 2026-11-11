/* ADIP Senzori — stranica /senzori/
   Popis sesija, grafovi (Chart.js), način »uživo« i upravljanje tokenima.
   API: /api/senzori (vidi senzori/server/README.md). */
(function () {
  'use strict';

  var API = '/api/senzori';
  var LIMIT = 3000;               // redaka za prikaz
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
    if (odabrana !== id) unistiGrafove();
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

  function ucitajSesiju() {
    if (!odabrana) return Promise.resolve();
    var id = odabrana;
    return dohvati(API + '/sesije/' + encodeURIComponent(id) + '?limit=' + LIMIT).then(function (s) {
      if (id !== odabrana) return;
      var meta = [s.deviceModel || 'nepoznat uređaj'];
      if (s.appVersion) meta.push('aplikacija ' + s.appVersion);
      if (s.sampleRateHz) meta.push(s.sampleRateHz + ' Hz');
      meta.push('početak ' + datum(s.startedAt));
      meta.push('zadnja promjena ' + datum(s.updatedAt));
      $('sz-meta').textContent = meta.join(' · ');
      $('sz-prikaz-info').textContent = s.totalRows > s.rows.length
        ? 'Prikazano zadnjih ' + s.rows.length.toLocaleString('hr-HR') + ' od ' + s.totalRows.toLocaleString('hr-HR') + ' redaka — cijela sesija je u CSV-u.'
        : 'Prikazano svih ' + (s.totalRows || 0).toLocaleString('hr-HR') + ' redaka.';
      crtajGrafove(s.columns || [], s.rows || []);
    }).catch(function (e) {
      if (e.status === 404) {
        odabrana = null;
        unistiGrafove();
        $('sz-sadrzaj').classList.add('hidden');
        $('sz-odaberi').classList.remove('hidden');
        $('sz-odaberi').textContent = 'Sesija više ne postoji.';
      } else {
        $('sz-prikaz-info').textContent = 'Učitavanje nije uspjelo (' + e.message + ').';
      }
    });
  }

  function unistiGrafove() {
    Object.keys(grafovi).forEach(function (k) { grafovi[k].destroy(); });
    grafovi = {};
    $('sz-grafovi').innerHTML = '';
  }

  function oznakaVremena(v, epoha) {
    if (!epoha) return (v / 1000).toFixed(1) + ' s';
    var d = new Date(v);
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    return dd(d.getHours()) + ':' + dd(d.getMinutes()) + ':' + dd(d.getSeconds());
  }

  function crtajGrafove(stupci, redovi) {
    var it = stupci.indexOf('t_ms');
    if (it < 0 || typeof Chart === 'undefined') {
      $('sz-prikaz-info').textContent += typeof Chart === 'undefined' ? ' (Biblioteka za grafove nije učitana.)' : '';
      return;
    }
    var epoha = redovi.length && redovi[0][it] > 1e12;

    GRAFOVI.forEach(function (g) {
      var skupovi = g.serije.map(function (s) {
        var ix = stupci.indexOf(s.stupac);
        var podaci = [];
        if (ix >= 0) {
          for (var i = 0; i < redovi.length; i++) {
            var y = redovi[i][ix], x = redovi[i][it];
            if (y != null && x != null) podaci.push({ x: x, y: y });
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
      if (postojeci) {
        postojeci.data.datasets.forEach(function (d, i) { d.data = skupovi[i].data; });
        postojeci.update('none');
        return;
      }

      var omot = el('div', 'sz-graf');
      omot.id = 'sz-graf-' + g.id;
      omot.appendChild(el('h3', null, g.naslov));
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
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
          plugins: {
            legend: { display: g.serije.length > 1, labels: { color: '#a0a0b0', boxWidth: 12 } },
            decimation: { enabled: true, algorithm: 'lttb', samples: 800 },
            tooltip: { callbacks: { title: function (it) { return it.length ? oznakaVremena(it[0].parsed.x, epoha) : ''; } } }
          },
          scales: {
            x: { type: 'linear', ticks: { color: '#a0a0b0', maxTicksLimit: 8, callback: function (v) { return oznakaVremena(v, epoha); } },
                 grid: { color: 'rgba(255,255,255,0.06)' } },
            y: { ticks: { color: '#a0a0b0' }, grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });
    });
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
    if (ukljuceno) osvjezi();
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
