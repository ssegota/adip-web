/* =====================================================================
 *  ADIP — Sunčeva aktivnost
 *  js/sunce.js
 *
 *  Uključi u servisi.html POSLIJE services.js:
 *      <script src="js/sunce.js?v=1"></script>
 *  Kartica se ubacuje sama u #main-services-grid.
 *
 *  IZVOR: NOAA SWPC (besplatno, bez ključa, CORS dozvoljen)
 *         + slike SDO / NASA za prikaz diska.
 *
 *  NAPOMENA O FORMATU: SWPC je u ožujku 2026. prebacio dio JSON-a s
 *  "prvi red su nazivi stupaca" na obične objekte. Kod guta oba oblika
 *  jer nisu svi produkti prešli istovremeno.
 * ===================================================================== */

(function () {
  'use strict';

  const SWPC = 'https://services.swpc.noaa.gov';

  const URL_KP = `${SWPC}/products/noaa-planetary-k-index.json`;
  const URL_KP_PROGNOZA = `${SWPC}/products/noaa-planetary-k-index-forecast.json`;
  const URL_BLJESAK = `${SWPC}/json/goes/primary/xray-flares-latest.json`;
  const URL_BLJESKOVI_7 = `${SWPC}/json/goes/primary/xray-flares-7-day.json`;
  const URL_PODRUCJA = `${SWPC}/json/solar_regions.json`;
  const URL_F107 = `${SWPC}/products/10cm-flux-30-day.json`;

  const SDO_193 = 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0193.jpg';
  const SDO_HMI = 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIIC.jpg';

  let cache = null;

  /* ---------------------------------------------------------------
   *  Dohvat i normalizacija
   * --------------------------------------------------------------- */

  /**
   * SWPC ima dva oblika:
   *   stari: [["time_tag","Kp"], ["2026-01-01", "3.00"], ...]
   *   novi:  [{"time_tag":"2026-01-01","Kp":3.00}, ...]
   * Ovo vraća uvijek niz objekata.
   */
  function normaliziraj(json) {
    if (!Array.isArray(json) || !json.length) return [];
    if (Array.isArray(json[0])) {
      const kljucevi = json[0];
      return json.slice(1).map(red => {
        const o = {};
        kljucevi.forEach((k, i) => { o[k] = red[i]; });
        return o;
      });
    }
    return json;
  }

  async function json(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* Dohvati sve izvore, ali ne ruši prikaz ako neki zakaže */
  async function dohvatiSve() {
    if (cache && (Date.now() - cache._vrijeme) < 15 * 60 * 1000) return cache;

    const sigurno = async (url, obrada) => {
      try {
        return obrada(await json(url));
      } catch (e) {
        console.warn('[ADIP sunce]', url, e.message);
        return null;
      }
    };

    const [kp, kpProg, bljesak, bljeskovi, podrucja, f107] = await Promise.all([
      sigurno(URL_KP, normaliziraj),
      sigurno(URL_KP_PROGNOZA, normaliziraj),
      sigurno(URL_BLJESAK, d => Array.isArray(d) ? d : [d]),
      sigurno(URL_BLJESKOVI_7, d => Array.isArray(d) ? d : []),
      sigurno(URL_PODRUCJA, d => Array.isArray(d) ? d : []),
      sigurno(URL_F107, normaliziraj)
    ]);

    cache = { kp, kpProg, bljesak, bljeskovi, podrucja, f107, _vrijeme: Date.now() };
    return cache;
  }

  /* ---------------------------------------------------------------
   *  Izvlačenje vrijednosti
   * --------------------------------------------------------------- */

  function zadnjiKp(kp) {
    if (!kp || !kp.length) return null;
    const zadnji = kp[kp.length - 1];
    const v = parseFloat(zadnji.Kp ?? zadnji.kp_index ?? zadnji.estimated_kp);
    return Number.isFinite(v) ? { vrijednost: v, kada: zadnji.time_tag } : null;
  }

  /**
   * NOAA G-skala. Kp 5 je već mala oluja; za polarnu svjetlost na
   * našoj širini (44,9° N) praktično treba Kp 7 i više, i to nisko
   * na sjevernom obzoru.
   */
  function gSkala(kp) {
    if (kp >= 9) return { g: 'G5', tekst: 'Ekstremna oluja', boja: '#ff3b3b' };
    if (kp >= 8) return { g: 'G4', tekst: 'Vrlo jaka oluja', boja: '#ff6b6b' };
    if (kp >= 7) return { g: 'G3', tekst: 'Jaka oluja', boja: '#ff8c42' };
    if (kp >= 6) return { g: 'G2', tekst: 'Umjerena oluja', boja: '#ffb020' };
    if (kp >= 5) return { g: 'G1', tekst: 'Slaba oluja', boja: '#ffd93d' };
    if (kp >= 4) return { g: '–', tekst: 'Aktivno', boja: '#a8d84a' };
    return { g: '–', tekst: 'Mirno', boja: '#00ff88' };
  }

  function klasaBljeska(b) {
    if (!b) return null;
    return b.max_class || b.current_class || b.begin_class || null;
  }

  function bojaKlase(k) {
    if (!k) return 'var(--text-muted)';
    const s = String(k)[0].toUpperCase();
    if (s === 'X') return '#ff3b3b';
    if (s === 'M') return '#ff8c42';
    if (s === 'C') return '#ffd93d';
    return '#00ff88';
  }

  /* Zbroji pjege po aktivnim područjima za najnoviji datum */
  function pjege(podrucja) {
    if (!podrucja || !podrucja.length) return null;

    let zadnjiDatum = '';
    podrucja.forEach(p => {
      const d = p.observed_date || p.time_tag || '';
      if (d > zadnjiDatum) zadnjiDatum = d;
    });
    if (!zadnjiDatum) return null;

    const danasnja = podrucja.filter(p => (p.observed_date || p.time_tag) === zadnjiDatum);
    const ukupno = danasnja.reduce((a, p) => a + (Number(p.number_spots) || 0), 0);

    return {
      datum: String(zadnjiDatum).slice(0, 10),
      brojPodrucja: danasnja.length,
      brojPjega: ukupno,
      popis: danasnja
    };
  }

  function zadnjiF107(f107) {
    if (!f107 || !f107.length) return null;
    const z = f107[f107.length - 1];
    const v = parseFloat(z.flux ?? z['10cm_flux'] ?? z.f10_7);
    return Number.isFinite(v) ? v : null;
  }

  function vrijemeIz(s) {
    if (!s) return '–';
    const d = new Date(String(s).replace(' ', 'T').replace(/Z?$/, 'Z'));
    if (Number.isNaN(d.getTime())) return String(s);
    return d.toLocaleString('hr-HR', {
      day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
      hour12: false, timeZone: 'Europe/Zagreb'
    });
  }

  /* ---------------------------------------------------------------
   *  Kartica
   * --------------------------------------------------------------- */

  function napraviKarticu() {
    const grid = document.getElementById('main-services-grid');
    if (!grid || document.getElementById('sunce-card')) return;

    const card = document.createElement('div');
    card.className = 'service-card glass-card';
    card.id = 'sunce-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="widget-content">
        <h3 class="service-title" style="margin-bottom: 1rem; text-align: center;
            color: var(--accent-primary);">Sunčeva aktivnost</h3>
        <div id="sunce-card-body" style="text-align: center; color: var(--text-muted);
             font-size: 0.9rem;">Učitavam…</div>
      </div>`;

    card.addEventListener('click', () => window.openSunceModal());
    grid.appendChild(card);
  }

  async function osvjeziKarticu() {
    const body = document.getElementById('sunce-card-body');
    if (!body) return;

    try {
      const d = await dohvatiSve();
      const kp = zadnjiKp(d.kp);
      const g = kp ? gSkala(kp.vrijednost) : null;
      const b = klasaBljeska(d.bljesak && d.bljesak[0]);
      const p = pjege(d.podrucja);

      if (!kp && !b && !p) throw new Error('Nijedan izvor nije odgovorio');

      const redak = (naziv, vrijednost, boja) => `
        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="color: var(--text-secondary);">${naziv}</span>
          <span style="font-weight: 600; color: ${boja || 'var(--accent-secondary)'};">${vrijednost}</span>
        </div>`;

      body.style.textAlign = 'left';
      body.innerHTML =
        (kp ? redak('Kp indeks', `${kp.vrijednost.toFixed(2)} · ${g.tekst}`, g.boja) : '') +
        (b ? redak('Zadnji bljesak', b, bojaKlase(b)) : '') +
        (p ? redak('Aktivna područja', `${p.brojPodrucja}`) : '') +
        (p ? redak('Broj pjega', `${p.brojPjega}`) : '') +
        (kp && kp.vrijednost >= 7
          ? `<div style="margin-top: 0.6rem; padding: 0.4rem; border-radius: 6px;
                  background: rgba(255,60,60,0.15); color: #ff8c42; font-size: 0.8rem;
                  text-align: center;">Moguća polarna svjetlost i kod nas</div>`
          : '');
    } catch (err) {
      console.warn('[ADIP sunce]', err);
      body.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">
        Podaci trenutno nedostupni.<br>Otvori za detalje →</span>`;
    }
  }

  /* ---------------------------------------------------------------
   *  Modal
   * --------------------------------------------------------------- */

  function tablicaBljeskova(bljeskovi) {
    if (!bljeskovi || !bljeskovi.length) {
      return `<p style="color: var(--text-muted);">Nema zabilježenih bljeskova u zadnjih 7 dana.</p>`;
    }

    const sortirani = bljeskovi.slice().sort((a, b) =>
      String(b.max_time || b.begin_time || '').localeCompare(String(a.max_time || a.begin_time || '')));

    const redovi = sortirani.slice(0, 25).map(b => {
      const k = klasaBljeska(b);
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 0.5rem; color: ${bojaKlase(k)}; font-weight: 600;">${k || '–'}</td>
          <td style="padding: 0.5rem; white-space: nowrap;">${vrijemeIz(b.begin_time)}</td>
          <td style="padding: 0.5rem; white-space: nowrap;">${vrijemeIz(b.max_time)}</td>
          <td style="padding: 0.5rem; white-space: nowrap;">${vrijemeIz(b.end_time)}</td>
        </tr>`;
    }).join('');

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 480px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent-primary); text-align: left;">
              <th style="padding: 0.5rem;">Klasa</th>
              <th style="padding: 0.5rem;">Početak</th>
              <th style="padding: 0.5rem;">Maksimum</th>
              <th style="padding: 0.5rem;">Kraj</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  function tablicaKpPrognoze(kpProg) {
    if (!kpProg || !kpProg.length) {
      return `<p style="color: var(--text-muted);">Prognoza Kp indeksa trenutno nije dostupna.</p>`;
    }

    const buduci = kpProg.filter(r => {
      const t = r.time_tag || r[0];
      return t && new Date(String(t).replace(' ', 'T')) > new Date();
    }).slice(0, 24);

    const izvor = buduci.length ? buduci : kpProg.slice(-24);

    const redovi = izvor.map(r => {
      const kp = parseFloat(r.kp ?? r.Kp ?? r.kp_index);
      const g = Number.isFinite(kp) ? gSkala(kp) : null;
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 0.4rem;">${vrijemeIz(r.time_tag)}</td>
          <td style="padding: 0.4rem; color: ${g ? g.boja : 'inherit'}; font-weight: 600;">
            ${Number.isFinite(kp) ? kp.toFixed(2) : '–'}</td>
          <td style="padding: 0.4rem; color: var(--text-secondary);">${g ? g.tekst : '–'}</td>
        </tr>`;
    }).join('');

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 320px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent-primary); text-align: left;">
              <th style="padding: 0.4rem;">Vrijeme</th>
              <th style="padding: 0.4rem;">Kp</th>
              <th style="padding: 0.4rem;">Stanje</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  function tablicaPodrucja(p) {
    if (!p || !p.popis.length) return '';

    const redovi = p.popis
      .sort((a, b) => (Number(b.number_spots) || 0) - (Number(a.number_spots) || 0))
      .map(r => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 0.4rem;">AR ${r.region || '–'}</td>
          <td style="padding: 0.4rem;">${r.location || '–'}</td>
          <td style="padding: 0.4rem;">${r.number_spots ?? '–'}</td>
          <td style="padding: 0.4rem;">${r.area ?? '–'}</td>
          <td style="padding: 0.4rem;">${r.mag_class || r.spot_class || '–'}</td>
        </tr>`).join('');

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 480px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent-primary); text-align: left;">
              <th style="padding: 0.4rem;">Područje</th>
              <th style="padding: 0.4rem;">Položaj</th>
              <th style="padding: 0.4rem;">Pjega</th>
              <th style="padding: 0.4rem;">Površina</th>
              <th style="padding: 0.4rem;">Klasa</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  window.openSunceModal = async function () {
    const modal = document.getElementById('service-modal');
    if (!modal) return;

    document.getElementById('modal-title').textContent = 'Sunčeva aktivnost';
    document.getElementById('modal-body').innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Učitavam podatke…</div>`;
    modal.classList.add('active');

    try {
      const d = await dohvatiSve();
      const kp = zadnjiKp(d.kp);
      const g = kp ? gSkala(kp.vrijednost) : null;
      const b = d.bljesak && d.bljesak[0];
      const bk = klasaBljeska(b);
      const p = pjege(d.podrucja);
      const f = zadnjiF107(d.f107);

      const kartica = (naziv, vrijednost, dodatak, boja) => `
        <div class="glass-card" style="padding: 1rem;">
          <div style="color: var(--text-muted); font-size: 0.8rem;">${naziv}</div>
          <div style="font-size: 1.6rem; font-weight: 600; color: ${boja || 'var(--text-primary)'};
                      margin: 0.25rem 0;">${vrijednost}</div>
          <div style="color: var(--text-secondary); font-size: 0.8rem;">${dodatak || ''}</div>
        </div>`;

      document.getElementById('modal-body').innerHTML = `
        <div style="padding: 1rem;">

          ${kp && kp.vrijednost >= 7 ? `
            <div style="padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;
                        background: rgba(255,60,60,0.15); border: 1px solid rgba(255,140,66,0.4);">
              <strong style="color: #ff8c42;">Geomagnetska oluja u tijeku (Kp ${kp.vrijednost.toFixed(2)})</strong>
              <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.35rem;">
                Pri ovoj razini polarna svjetlost može biti vidljiva i s naših širina,
                nisko nad sjevernim obzorom. Traži mjesto s čistim pogledom prema sjeveru,
                podalje od gradskih svjetala. Fotoaparat je vidi prije oka.
              </div>
            </div>` : ''}

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                      gap: 1rem; margin-bottom: 2rem;">
            ${kp ? kartica('Kp indeks', kp.vrijednost.toFixed(2),
              `${g.tekst}${g.g !== '–' ? ' · ' + g.g : ''} · ${vrijemeIz(kp.kada)}`, g.boja) : ''}
            ${bk ? kartica('Zadnji bljesak', bk,
              b.begin_time ? 'početak ' + vrijemeIz(b.begin_time) : '', bojaKlase(bk)) : ''}
            ${p ? kartica('Aktivna područja', p.brojPodrucja,
              `${p.brojPjega} pjega · ${p.datum}`) : ''}
            ${f ? kartica('Radio tok F10.7', f.toFixed(0),
              'sunčeve jedinice toka (sfu)') : ''}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                      gap: 1rem; margin-bottom: 2rem;">
            <div style="text-align: center;">
              <img src="${SDO_HMI}" alt="Sunčeve pjege (SDO/HMI)" loading="lazy"
                   style="width: 100%; max-width: 320px; border-radius: 12px;">
              <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem;">
                Bijela svjetlost — pjege (SDO/HMI)</div>
            </div>
            <div style="text-align: center;">
              <img src="${SDO_193}" alt="Korona 193 Å (SDO/AIA)" loading="lazy"
                   style="width: 100%; max-width: 320px; border-radius: 12px;">
              <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem;">
                Korona 193 Å (SDO/AIA)</div>
            </div>
          </div>

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">
            Aktivna područja na disku</h4>
          ${tablicaPodrucja(p) || '<p style="color: var(--text-muted);">Podaci nedostupni.</p>'}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">
            Bljeskovi zadnjih 7 dana</h4>
          ${tablicaBljeskova(d.bljeskovi)}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">
            Prognoza Kp indeksa</h4>
          ${tablicaKpPrognoze(d.kpProg)}

          <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 1.5rem; line-height: 1.7;">
            <strong>Kako čitati:</strong> Kp mjeri poremećaj Zemljinog magnetskog polja na
            skali 0–9. Do 4 je mirno, od 5 počinju geomagnetske oluje (NOAA skala G1–G5).
            Za polarnu svjetlost u Istri praktično treba Kp 7 ili više.
            Bljeskovi se dijele na klase A, B, C, M i X; svaka je deset puta jača od
            prethodne. M i X mogu poremetiti kratkovalne radioveze na obasjanoj strani Zemlje.
            F10.7 je radio tok na 10,7 cm i dobar je pokazatelj ukupne aktivnosti ciklusa.<br>
            <strong>Oprez:</strong> Sunce se nikada ne promatra bez ispravnog filtra
            postavljenog na prednju stranu instrumenta.<br>
            Podaci: NOAA SWPC. Slike: NASA/SDO.
          </p>
        </div>`;
    } catch (err) {
      console.error('[ADIP sunce]', err);
      document.getElementById('modal-body').innerHTML = `
        <div style="padding: 2rem; color: var(--text-muted);">
          <p>Podaci o Sunčevoj aktivnosti trenutno nisu dostupni.</p>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">${err.message}</p>
        </div>`;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('main-services-grid')) return;
    napraviKarticu();
    osvjeziKarticu();
  });
})();
