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

  const SMJEROVI = ['S', 'SSI', 'SI', 'ISI', 'I', 'IJI', 'JI', 'JJI',
    'J', 'JJZ', 'JZ', 'ZJZ', 'Z', 'ZSZ', 'SZ', 'SSZ'];

  /* Sateliti koje uvijek računamo pojedinačno (NORAD katalog broj) */
  const GLAVNI = [
    { id: 25544, ime: 'ISS (Međunarodna svemirska postaja)', kratko: 'ISS' },
    { id: 48274, ime: 'Tiangong (kineska postaja)', kratko: 'Tiangong' }
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
      s.onerror = () => reject(new Error('Ne mogu učitati satellite.js'));
      document.head.appendChild(s);
    });
    return satLibPromise;
  }

  function vrijeme(date) {
    return date.toLocaleTimeString('hr-HR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: TZ
    });
  }

  function datum(date) {
    return date.toLocaleDateString('hr-HR', {
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
      throw new Error('Celestrak nije vratio podatke');
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
            color: var(--accent-primary);">Prolazi satelita</h3>
        <div id="sat-card-body" style="text-align: center; color: var(--text-muted);
             font-size: 0.9rem; padding: 0.5rem 0;">Računam prolaze…</div>
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
      if (!tle.length) throw new Error('Nema TLE za ISS');

      const sad = new Date();
      const doKada = new Date(sad.getTime() + 5 * 86400 * 1000);
      const prolazi = racunajProlaze(tle[0], sad, doKada, 20, MIN_ELEVATION);

      if (!prolazi.length) {
        body.innerHTML = `<span style="color: var(--text-muted);">
          Nema vidljivih prolaza ISS-a u sljedećih 5 dana.</span>
          <div style="margin-top: 0.75rem; font-size: 0.8rem;">Otvori za ostale satelite →</div>`;
        return;
      }

      const p = prolazi[0];
      body.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-muted);">Sljedeći prolaz ISS-a</div>
        <div style="font-size: 1.4rem; font-weight: 600; color: var(--text-primary);
             margin: 0.25rem 0;">${vrijeme(p.pocetak).slice(0, 5)}</div>
        <div style="font-size: 0.85rem;">${datum(p.pocetak)} ·
             max ${Math.round(p.maxEl)}° prema ${smjer(p.maxAz)}</div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--accent-primary);">
             ukupno ${prolazi.length} prolaza →</div>`;
    } catch (err) {
      console.warn('[ADIP sateliti]', err);
      body.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">
        Podaci trenutno nedostupni.<br>Otvori za detalje →</span>`;
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
      return `<p style="color: var(--text-muted); padding: 1rem;">Nema vidljivih prolaza.</p>`;
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
              ${prikaziIme ? '<th style="padding: 0.5rem;">Satelit</th>' : ''}
              <th style="padding: 0.5rem;">Datum</th>
              <th style="padding: 0.5rem;">Početak</th>
              <th style="padding: 0.5rem;">Izlazi</th>
              <th style="padding: 0.5rem;">Max</th>
              <th style="padding: 0.5rem;">Smjer max</th>
              <th style="padding: 0.5rem;">Nestaje</th>
              <th style="padding: 0.5rem;">Trajanje</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  window.openSatelitiModal = async function () {
    otvoriModal('Prolazi satelita nad Pulom', `
      <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
        Računam prolaze… <span style="color: var(--text-muted); font-size: 0.85rem;">
        (SGP4 propagacija u pregledniku, potraje koju sekundu)</span>
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
            Ostali svijetli sateliti (noćas, ${vrijeme(pocetak).slice(0, 5)}–${vrijeme(kraj).slice(0, 5)})
          </h4>
          ${tablicaProlaza(svi.slice(0, 40), true)}`;
      } catch (e) {
        console.warn('[ADIP sateliti] visual grupa:', e);
        ostaliHtml = `<p style="color: var(--text-muted); padding: 1rem;">
          Popis ostalih satelita trenutno nije dostupan.</p>`;
      }

      otvoriModal('Prolazi satelita nad Pulom', `
        <div style="padding: 1rem;">
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
            Prikazani su samo prolazi vidljivi golim okom: satelit mora biti obasjan Suncem
            dok je kod nas već mrak, i dizati se barem ${MIN_ELEVATION}° iznad obzora.
          </p>
          <p style="color: var(--text-muted); font-size: 0.8rem;">
            Smjerovi: S = sjever, I = istok, J = jug, Z = zapad. Vremena su po lokalnom
            vremenu Pule. Podaci: Celestrak (TLE), proračun SGP4.
          </p>
          ${glavniHtml}
          ${ostaliHtml}
        </div>`);
    } catch (err) {
      console.error('[ADIP sateliti]', err);
      otvoriModal('Prolazi satelita nad Pulom', `
        <div style="padding: 2rem; color: var(--text-muted);">
          <p>Podaci o satelitima trenutno nisu dostupni.</p>
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
