/* =====================================================================
 *  ADIP — Prolazi ISS-a i satelita nad Pulom
 *  js/sateliti.js
 *
 *  Uključi u servisi.html POSLIJE services.js:
 *      <script src="js/sateliti.js?v=1"></script>
 *  Kartica se ubacuje sama u #main-services-grid — ne treba dirati HTML.
 *
 *  Ovisnosti: satellite.js (učitava se sam s CDN-a), SunCalc (već je na stranici).
 *
 *  IZVOR PODATAKA: Celestrak GP (TLE). Celestrak šalje CORS zaglavlja,
 *  pa dohvat ide izravno iz preglednika. Ako ga ikad zatvore, u server.js
 *  dodaj proxy i promijeni TLE_BASE ispod:
 *
 *      app.get('/api/tle', async (req, res) => {
 *        const q = new URLSearchParams(req.query).toString();
 *        const r = await fetch('https://celestrak.org/NORAD/elements/gp.php?' + q);
 *        res.type('text/plain').send(await r.text());
 *      });
 *
 *  RAČUNICA: SGP4 propagacija (satellite.js), vidljivost = satelit obasjan
 *  Suncem + promatrač u sumraku/mraku. Cilindrični model Zemljine sjene.
 *  Točnost je reda nekoliko sekundi na vremenu i ~1° na poziciji, što je
 *  za vizualno promatranje sasvim dovoljno.
 * ===================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------
   *  Jezik (hr / en / it) — getCurrentLang() dolazi iz main.js.
   * --------------------------------------------------------------- */

  const LANG = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
  const LOCALE = { hr: 'hr-HR', en: 'en-GB', it: 'it-IT' }[LANG] || 'hr-HR';

  const STR = {
    hr: {
      smjerovi: ['S', 'SSI', 'SI', 'ISI', 'I', 'IJI', 'JI', 'JJI',
        'J', 'JJZ', 'JZ', 'ZJZ', 'Z', 'ZSZ', 'SZ', 'SSZ'],
      iss: 'ISS (Međunarodna svemirska postaja)',
      tiangong: 'Tiangong (kineska postaja)',
      errLib: 'Ne mogu učitati satellite.js',
      errCelestrak: 'Celestrak nije vratio podatke',
      errIssTle: 'Nema TLE za ISS',
      naslovKartice: 'Prolazi satelita',
      racunam: 'Računam prolaze…',
      nemaIss: 'Nema vidljivih prolaza ISS-a u sljedećih 5 dana.',
      otvoriOstale: 'Otvori za ostale satelite →',
      sljedeciIss: 'Sljedeći prolaz ISS-a',
      maxPrema: (el, sm) => `max ${el}° prema ${sm}`,
      ukupno: n => `ukupno ${n} prolaza →`,
      nedostupnoKartica: 'Podaci trenutno nedostupni.<br>Otvori za detalje →',
      nemaProlaza: 'Nema vidljivih prolaza.',
      thSatelit: 'Satelit', thDatum: 'Datum', thPocetak: 'Početak', thIzlazi: 'Izlazi',
      thMax: 'Max', thSmjerMax: 'Smjer max', thNestaje: 'Nestaje', thTrajanje: 'Trajanje',
      naslovModala: 'Prolazi satelita nad Pulom',
      sgp4: '(SGP4 propagacija u pregledniku, potraje koju sekundu)',
      ostali: (od, doK) => `Ostali svijetli sateliti (noćas, ${od}–${doK})`,
      ostaliNedostupni: 'Popis ostalih satelita trenutno nije dostupan.',
      uvod: min => `Prikazani su samo prolazi vidljivi golim okom: satelit mora biti obasjan Suncem
            dok je kod nas već mrak, i dizati se barem ${min}° iznad obzora.`,
      smjeroviLegenda: `Smjerovi: S = sjever, I = istok, J = jug, Z = zapad. Vremena su po lokalnom
            vremenu Pule. Podaci: Celestrak (TLE), proračun SGP4.`,
      nedostupnoModal: 'Podaci o satelitima trenutno nisu dostupni.'
    },
    en: {
      smjerovi: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
      iss: 'ISS (International Space Station)',
      tiangong: 'Tiangong (Chinese space station)',
      errLib: 'Unable to load satellite.js',
      errCelestrak: 'Celestrak returned no data',
      errIssTle: 'No TLE available for the ISS',
      naslovKartice: 'Satellite Passes',
      racunam: 'Calculating passes…',
      nemaIss: 'No visible ISS passes in the next 5 days.',
      otvoriOstale: 'Open for other satellites →',
      sljedeciIss: 'Next ISS pass',
      maxPrema: (el, sm) => `max ${el}° towards ${sm}`,
      ukupno: n => `${n} passes in total →`,
      nedostupnoKartica: 'Data currently unavailable.<br>Open for details →',
      nemaProlaza: 'No visible passes.',
      thSatelit: 'Satellite', thDatum: 'Date', thPocetak: 'Start', thIzlazi: 'Appears',
      thMax: 'Max', thSmjerMax: 'Max direction', thNestaje: 'Disappears', thTrajanje: 'Duration',
      naslovModala: 'Satellite Passes over Pula',
      sgp4: '(SGP4 propagation in the browser, takes a few seconds)',
      ostali: (od, doK) => `Other bright satellites (tonight, ${od}–${doK})`,
      ostaliNedostupni: 'The list of other satellites is currently unavailable.',
      uvod: min => `Only passes visible to the naked eye are shown: the satellite must be lit by the Sun
            while it is already dark here, and rise at least ${min}° above the horizon.`,
      smjeroviLegenda: `Directions: N = north, E = east, S = south, W = west. Times are in Pula local
            time. Data: Celestrak (TLE), SGP4 calculation.`,
      nedostupnoModal: 'Satellite data is currently unavailable.'
    },
    it: {
      smjerovi: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'],
      iss: 'ISS (Stazione Spaziale Internazionale)',
      tiangong: 'Tiangong (stazione spaziale cinese)',
      errLib: 'Impossibile caricare satellite.js',
      errCelestrak: 'Celestrak non ha restituito dati',
      errIssTle: 'Nessun TLE disponibile per la ISS',
      naslovKartice: 'Passaggi di satelliti',
      racunam: 'Calcolo dei passaggi…',
      nemaIss: 'Nessun passaggio visibile della ISS nei prossimi 5 giorni.',
      otvoriOstale: 'Apri per gli altri satelliti →',
      sljedeciIss: 'Prossimo passaggio della ISS',
      maxPrema: (el, sm) => `max ${el}° verso ${sm}`,
      ukupno: n => `${n} passaggi in totale →`,
      nedostupnoKartica: 'Dati al momento non disponibili.<br>Apri per i dettagli →',
      nemaProlaza: 'Nessun passaggio visibile.',
      thSatelit: 'Satellite', thDatum: 'Data', thPocetak: 'Inizio', thIzlazi: 'Appare',
      thMax: 'Max', thSmjerMax: 'Direzione max', thNestaje: 'Scompare', thTrajanje: 'Durata',
      naslovModala: 'Passaggi di satelliti sopra Pola',
      sgp4: '(propagazione SGP4 nel browser, richiede qualche secondo)',
      ostali: (od, doK) => `Altri satelliti luminosi (stanotte, ${od}–${doK})`,
      ostaliNedostupni: 'L\'elenco degli altri satelliti non è al momento disponibile.',
      uvod: min => `Sono mostrati solo i passaggi visibili a occhio nudo: il satellite deve essere illuminato
            dal Sole mentre da noi è già buio, e salire almeno ${min}° sopra l'orizzonte.`,
      smjeroviLegenda: `Direzioni: N = nord, E = est, S = sud, O = ovest. Gli orari sono nell'ora locale
            di Pola. Dati: Celestrak (TLE), calcolo SGP4.`,
      nedostupnoModal: 'I dati sui satelliti non sono al momento disponibili.'
    }
  };

  function T(kljuc, ...arg) {
    const v = (STR[LANG] && STR[LANG][kljuc] !== undefined) ? STR[LANG][kljuc] : STR.hr[kljuc];
    return typeof v === 'function' ? v(...arg) : v;
  }

  const SAT_LIB = 'https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js';
  const TLE_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

  const COORDS = (typeof PULA_COORDS !== 'undefined')
    ? PULA_COORDS
    : { lat: 44.8683, lng: 13.8481 };
  const TZ = (typeof OBS_TZ !== 'undefined') ? OBS_TZ : 'Europe/Zagreb';

  const OBS_ALT_KM = 0.03;          // Monte Zaro, ~30 m
  const MIN_ELEVATION = 10;         // ispod 10° smeta obzor i kuće
  const SUN_MAX_ALT = -6;           // promatrač: građanski sumrak ili tamnije
  const EARTH_R = 6378.137;

  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const SMJEROVI = T('smjerovi');

  /* Sateliti koje uvijek računamo pojedinačno (NORAD katalog broj) */
  const GLAVNI = [
    { id: 25544, ime: T('iss'), kratko: 'ISS' },
    { id: 48274, ime: T('tiangong'), kratko: 'Tiangong' }
  ];

  let satLibPromise = null;
  let cache = { tle: {}, vrijeme: 0 };

  /* ---------------------------------------------------------------
   *  Pomoćno
   * --------------------------------------------------------------- */

  function ucitajSatelliteJs() {
    if (window.satellite) return Promise.resolve();
    if (satLibPromise) return satLibPromise;

    satLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SAT_LIB;
      s.onload = resolve;
      s.onerror = () => reject(new Error(T('errLib')));
      document.head.appendChild(s);
    });
    return satLibPromise;
  }

  function vrijeme(date) {
    return date.toLocaleTimeString(LOCALE, {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: TZ
    });
  }

  function datum(date) {
    return date.toLocaleDateString(LOCALE, {
      weekday: 'short', day: 'numeric', month: 'numeric', timeZone: TZ
    });
  }

  function smjer(azimutDeg) {
    const a = ((azimutDeg % 360) + 360) % 360;
    return SMJEROVI[Math.round(a / 22.5) % 16];
  }

  /* Položaj Sunca u ECI koordinatama (km). Niska preciznost (~0,01°),
   * više nego dovoljno za test je li satelit u Zemljinoj sjeni. */
  function sunceEci(date) {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const n = jd - 2451545.0;
    const L = ((280.460 + 0.9856474 * n) % 360) * DEG;
    const g = ((357.528 + 0.9856003 * n) % 360) * DEG;
    const lambda = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
    const eps = (23.439 - 0.0000004 * n) * DEG;
    const R = (1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g)) * 149597870.7;

    return {
      x: R * Math.cos(lambda),
      y: R * Math.cos(eps) * Math.sin(lambda),
      z: R * Math.sin(eps) * Math.sin(lambda)
    };
  }

  /* Je li satelit obasjan Suncem? Cilindrični model sjene:
   * ako je satelit na suprotnoj strani od Sunca i njegova okomita
   * udaljenost od osi Zemlja–Sunce je manja od polumjera Zemlje,
   * onda je u sjeni. */
  function obasjan(rSat, rSun) {
    const dot = rSat.x * rSun.x + rSat.y * rSun.y + rSat.z * rSun.z;
    if (dot > 0) return true;

    const sunNorm = Math.sqrt(rSun.x ** 2 + rSun.y ** 2 + rSun.z ** 2);
    const ux = rSun.x / sunNorm, uy = rSun.y / sunNorm, uz = rSun.z / sunNorm;
    const proj = rSat.x * ux + rSat.y * uy + rSat.z * uz;

    const px = rSat.x - proj * ux;
    const py = rSat.y - proj * uy;
    const pz = rSat.z - proj * uz;

    return Math.sqrt(px * px + py * py + pz * pz) > EARTH_R;
  }

  function promatracUMraku(date) {
    if (typeof SunCalc === 'undefined') return true;   // bez SunCalca ne filtriraj
    const pos = SunCalc.getPosition(date, COORDS.lat, COORDS.lng);
    return pos.altitude * RAD < SUN_MAX_ALT;
  }

  /* ---------------------------------------------------------------
   *  TLE
   * --------------------------------------------------------------- */

  async function dohvatiTle(query, kljuc) {
    // Keširaj 3 sata — TLE se ionako osvježava par puta dnevno
    if (cache.tle[kljuc] && (Date.now() - cache.vrijeme) < 3 * 3600 * 1000) {
      return cache.tle[kljuc];
    }

    const res = await fetch(`${TLE_BASE}?${query}&FORMAT=TLE`);
    if (!res.ok) throw new Error(`Celestrak HTTP ${res.status}`);

    const tekst = (await res.text()).trim();
    if (!tekst || tekst.toLowerCase().includes('no gp data')) {
      throw new Error(T('errCelestrak'));
    }

    const linije = tekst.split(/\r?\n/).map(l => l.trimEnd());
    const sateliti = [];

    for (let i = 0; i + 2 < linije.length + 1; i += 3) {
      const ime = (linije[i] || '').trim();
      const l1 = linije[i + 1];
      const l2 = linije[i + 2];
      if (!l1 || !l2 || l1[0] !== '1' || l2[0] !== '2') continue;
      sateliti.push({ ime, l1, l2 });
    }

    cache.tle[kljuc] = sateliti;
    cache.vrijeme = Date.now();
    return sateliti;
  }

  /* ---------------------------------------------------------------
   *  Računanje prolaza
   * --------------------------------------------------------------- */

  function racunajProlaze(tle, pocetak, kraj, korakSek, minEl) {
    const satrec = satellite.twoline2satrec(tle.l1, tle.l2);
    if (!satrec || satrec.error) return [];

    const promatrac = {
      latitude: COORDS.lat * DEG,
      longitude: COORDS.lng * DEG,
      height: OBS_ALT_KM
    };

    const prolazi = [];
    let trenutni = null;

    for (let t = pocetak.getTime(); t <= kraj.getTime(); t += korakSek * 1000) {
      const kada = new Date(t);

      let pv;
      try {
        pv = satellite.propagate(satrec, kada);
      } catch (e) {
        continue;
      }
      if (!pv || !pv.position) continue;

      const gmst = satellite.gstime(kada);
      const ecf = satellite.eciToEcf(pv.position, gmst);
      const look = satellite.ecfToLookAngles(promatrac, ecf);
      const el = look.elevation * RAD;

      if (el >= minEl) {
        const vidljiv = obasjan(pv.position, sunceEci(kada)) && promatracUMraku(kada);

        if (!trenutni) {
          trenutni = {
            pocetak: kada, kraj: kada,
            azPocetak: look.azimuth * RAD,
            azKraj: look.azimuth * RAD,
            maxEl: el, maxAz: look.azimuth * RAD, maxKada: kada,
            vidljiv: vidljiv
          };
        } else {
          trenutni.kraj = kada;
          trenutni.azKraj = look.azimuth * RAD;
          trenutni.vidljiv = trenutni.vidljiv || vidljiv;
          if (el > trenutni.maxEl) {
            trenutni.maxEl = el;
            trenutni.maxAz = look.azimuth * RAD;
            trenutni.maxKada = kada;
          }
        }
      } else if (trenutni) {
        trenutni.trajanje = Math.round((trenutni.kraj - trenutni.pocetak) / 1000);
        if (trenutni.vidljiv && trenutni.trajanje >= 30) prolazi.push(trenutni);
        trenutni = null;
      }
    }

    if (trenutni) {
      trenutni.trajanje = Math.round((trenutni.kraj - trenutni.pocetak) / 1000);
      if (trenutni.vidljiv && trenutni.trajanje >= 30) prolazi.push(trenutni);
    }

    return prolazi;
  }

  /* Noćni prozor: od večerašnjeg sumraka do sutrašnjeg svitanja */
  function nocniProzor() {
    const sad = new Date();
    let pocetak = sad;
    let kraj = new Date(sad.getTime() + 14 * 3600 * 1000);

    if (typeof SunCalc !== 'undefined') {
      const danas = SunCalc.getTimes(sad, COORDS.lat, COORDS.lng);
      const sutra = SunCalc.getTimes(new Date(sad.getTime() + 86400000), COORDS.lat, COORDS.lng);

      pocetak = (sad > danas.dusk) ? sad : danas.dusk;
      kraj = sutra.dawn;

      // Ako je već svanulo, gledaj sljedeću noć
      if (kraj <= pocetak) {
        pocetak = danas.dusk;
        kraj = sutra.dawn;
      }
    }

    return { pocetak, kraj };
  }

  /* ---------------------------------------------------------------
   *  Kartica
   * --------------------------------------------------------------- */

  function napraviKarticu() {
    const grid = document.getElementById('main-services-grid');
    if (!grid || document.getElementById('sat-card')) return null;

    const card = document.createElement('div');
    card.className = 'service-card glass-card';
    card.id = 'sat-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="widget-content">
        <h3 class="service-title" style="margin-bottom: 1rem; text-align: center;
            color: var(--accent-primary);">${T('naslovKartice')}</h3>
        <div id="sat-card-body" style="text-align: center; color: var(--text-muted);
             font-size: 0.9rem; padding: 0.5rem 0;">${T('racunam')}</div>
      </div>`;

    card.addEventListener('click', () => window.openSatelitiModal());
    grid.appendChild(card);
    return card;
  }

  async function osvjeziKarticu() {
    const body = document.getElementById('sat-card-body');
    if (!body) return;

    try {
      await ucitajSatelliteJs();

      const tle = await dohvatiTle('CATNR=25544', 'iss');
      if (!tle.length) throw new Error(T('errIssTle'));

      const sad = new Date();
      const doKada = new Date(sad.getTime() + 5 * 86400 * 1000);
      const prolazi = racunajProlaze(tle[0], sad, doKada, 20, MIN_ELEVATION);

      if (!prolazi.length) {
        body.innerHTML = `<span style="color: var(--text-muted);">
          ${T('nemaIss')}</span>
          <div style="margin-top: 0.75rem; font-size: 0.8rem;">${T('otvoriOstale')}</div>`;
        return;
      }

      const p = prolazi[0];
      body.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-muted);">${T('sljedeciIss')}</div>
        <div style="font-size: 1.4rem; font-weight: 600; color: var(--text-primary);
             margin: 0.25rem 0;">${vrijeme(p.pocetak).slice(0, 5)}</div>
        <div style="font-size: 0.85rem;">${datum(p.pocetak)} ·
             ${T('maxPrema', Math.round(p.maxEl), smjer(p.maxAz))}</div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--accent-primary);">
             ${T('ukupno', prolazi.length)}</div>`;
    } catch (err) {
      console.warn('[ADIP sateliti]', err);
      body.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">
        ${T('nedostupnoKartica')}</span>`;
    }
  }

  /* ---------------------------------------------------------------
   *  Modal
   * --------------------------------------------------------------- */

  function otvoriModal(naslov, html) {
    const modal = document.getElementById('service-modal');
    if (!modal) return;
    document.getElementById('modal-title').textContent = naslov;
    document.getElementById('modal-body').innerHTML = html;
    modal.classList.add('active');
  }

  function tablicaProlaza(prolazi, prikaziIme) {
    if (!prolazi.length) {
      return `<p style="color: var(--text-muted); padding: 1rem;">${T('nemaProlaza')}</p>`;
    }

    const redovi = prolazi.map(p => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
        ${prikaziIme ? `<td style="padding: 0.5rem;">${p.ime}</td>` : ''}
        <td style="padding: 0.5rem; white-space: nowrap;">${datum(p.pocetak)}</td>
        <td style="padding: 0.5rem; white-space: nowrap;">${vrijeme(p.pocetak)}</td>
        <td style="padding: 0.5rem;">${smjer(p.azPocetak)}</td>
        <td style="padding: 0.5rem; color: var(--accent-primary); font-weight: 600;">
            ${Math.round(p.maxEl)}°</td>
        <td style="padding: 0.5rem;">${smjer(p.maxAz)}</td>
        <td style="padding: 0.5rem;">${smjer(p.azKraj)}</td>
        <td style="padding: 0.5rem; white-space: nowrap;">
            ${Math.floor(p.trajanje / 60)}m ${p.trajanje % 60}s</td>
      </tr>`).join('');

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 560px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent-primary); text-align: left;">
              ${prikaziIme ? `<th style="padding: 0.5rem;">${T('thSatelit')}</th>` : ''}
              <th style="padding: 0.5rem;">${T('thDatum')}</th>
              <th style="padding: 0.5rem;">${T('thPocetak')}</th>
              <th style="padding: 0.5rem;">${T('thIzlazi')}</th>
              <th style="padding: 0.5rem;">${T('thMax')}</th>
              <th style="padding: 0.5rem;">${T('thSmjerMax')}</th>
              <th style="padding: 0.5rem;">${T('thNestaje')}</th>
              <th style="padding: 0.5rem;">${T('thTrajanje')}</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  window.openSatelitiModal = async function () {
    otvoriModal(T('naslovModala'), `
      <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
        ${T('racunam')} <span style="color: var(--text-muted); font-size: 0.85rem;">
        ${T('sgp4')}</span>
      </div>`);

    try {
      await ucitajSatelliteJs();

      const sad = new Date();
      const doKada = new Date(sad.getTime() + 7 * 86400 * 1000);

      /* --- Glavni sateliti, 7 dana --- */
      let glavniHtml = '';
      for (const g of GLAVNI) {
        try {
          const tle = await dohvatiTle(`CATNR=${g.id}`, 'sat' + g.id);
          if (!tle.length) continue;
          const prolazi = racunajProlaze(tle[0], sad, doKada, 20, MIN_ELEVATION);
          glavniHtml += `
            <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">${g.ime}</h4>
            ${tablicaProlaza(prolazi, false)}`;
        } catch (e) {
          console.warn('[ADIP sateliti]', g.kratko, e);
        }
      }

      /* --- Ostali svijetli sateliti, samo večeras --- */
      const { pocetak, kraj } = nocniProzor();
      let ostaliHtml = '';

      try {
        const visual = await dohvatiTle('GROUP=visual', 'visual');
        const svi = [];

        visual.forEach(tle => {
          if (GLAVNI.some(g => tle.ime.includes(g.kratko))) return;
          const p = racunajProlaze(tle, pocetak, kraj, 30, 20);   // stroži prag: 20°
          p.forEach(x => svi.push(Object.assign({ ime: tle.ime }, x)));
        });

        svi.sort((a, b) => a.pocetak - b.pocetak);

        ostaliHtml = `
          <h4 style="color: var(--accent-primary); margin: 2rem 0 0.5rem;">
            ${T('ostali', vrijeme(pocetak).slice(0, 5), vrijeme(kraj).slice(0, 5))}
          </h4>
          ${tablicaProlaza(svi.slice(0, 40), true)}`;
      } catch (e) {
        console.warn('[ADIP sateliti] visual grupa:', e);
        ostaliHtml = `<p style="color: var(--text-muted); padding: 1rem;">
          ${T('ostaliNedostupni')}</p>`;
      }

      otvoriModal(T('naslovModala'), `
        <div style="padding: 1rem;">
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
            ${T('uvod', MIN_ELEVATION)}
          </p>
          <p style="color: var(--text-muted); font-size: 0.8rem;">
            ${T('smjeroviLegenda')}
          </p>
          ${glavniHtml}
          ${ostaliHtml}
        </div>`);
    } catch (err) {
      console.error('[ADIP sateliti]', err);
      otvoriModal(T('naslovModala'), `
        <div style="padding: 2rem; color: var(--text-muted);">
          <p>${T('nedostupnoModal')}</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">${err.message}</p>
        </div>`);
    }
  };

  /* ---------------------------------------------------------------
   *  Start
   * --------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('main-services-grid')) return;
    napraviKarticu();
    // Odgodi da kartica prvo iscrta, pa tek onda kreni s računanjem
    setTimeout(osvjeziKarticu, 100);
  });
})();
