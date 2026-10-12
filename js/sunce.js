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

  /* ---------------------------------------------------------------
   *  Jezik (hr / en / it) — getCurrentLang() dolazi iz main.js.
   * --------------------------------------------------------------- */

  const LANG = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
  const LOCALE = { hr: 'hr-HR', en: 'en-GB', it: 'it-IT' }[LANG] || 'hr-HR';

  const STR = {
    hr: {
      g5: 'Ekstremna oluja', g4: 'Vrlo jaka oluja', g3: 'Jaka oluja', g2: 'Umjerena oluja',
      g1: 'Slaba oluja', aktivno: 'Aktivno', mirno: 'Mirno',
      naslov: 'Sunčeva aktivnost',
      ucitavam: 'Učitavam…',
      ucitavamPodatke: 'Učitavam podatke…',
      errNijedan: 'Nijedan izvor nije odgovorio',
      kp: 'Kp indeks', bljesak: 'Zadnji bljesak', podrucja: 'Aktivna područja', brojPjega: 'Broj pjega',
      polarnaKartica: 'Moguća polarna svjetlost i kod nas',
      nedostupnoKartica: 'Podaci trenutno nedostupni.<br>Otvori za detalje →',
      nemaBljeskova: 'Nema zabilježenih bljeskova u zadnjih 7 dana.',
      thKlasa: 'Klasa', thPocetak: 'Početak', thMaksimum: 'Maksimum', thKraj: 'Kraj',
      nemaKpProg: 'Prognoza Kp indeksa trenutno nije dostupna.',
      thVrijeme: 'Vrijeme', thKp: 'Kp', thStanje: 'Stanje',
      thPodrucje: 'Područje', thPolozaj: 'Položaj', thPjega: 'Pjega', thPovrsina: 'Površina',
      oluja: kp => `Geomagnetska oluja u tijeku (Kp ${kp})`,
      olujaTekst: `Pri ovoj razini polarna svjetlost može biti vidljiva i s naših širina,
                nisko nad sjevernim obzorom. Traži mjesto s čistim pogledom prema sjeveru,
                podalje od gradskih svjetala. Fotoaparat je vidi prije oka.`,
      pocetak: 'početak ',
      pjegaDatum: (n, d) => `${n} pjega · ${d}`,
      f107: 'Radio tok F10.7', sfu: 'sunčeve jedinice toka (sfu)',
      altHmi: 'Sunčeve pjege (SDO/HMI)', capHmi: 'Bijela svjetlost — pjege (SDO/HMI)',
      altAia: 'Korona 193 Å (SDO/AIA)', capAia: 'Korona 193 Å (SDO/AIA)',
      hPodrucja: 'Aktivna područja na disku',
      nedostupno: 'Podaci nedostupni.',
      hBljeskovi: 'Bljeskovi zadnjih 7 dana',
      hKpProg: 'Prognoza Kp indeksa',
      kakoCitati: `<strong>Kako čitati:</strong> Kp mjeri poremećaj Zemljinog magnetskog polja na
            skali 0–9. Do 4 je mirno, od 5 počinju geomagnetske oluje (NOAA skala G1–G5).
            Za polarnu svjetlost u Istri praktično treba Kp 7 ili više.
            Bljeskovi se dijele na klase A, B, C, M i X; svaka je deset puta jača od
            prethodne. M i X mogu poremetiti kratkovalne radioveze na obasjanoj strani Zemlje.
            F10.7 je radio tok na 10,7 cm i dobar je pokazatelj ukupne aktivnosti ciklusa.<br>
            <strong>Oprez:</strong> Sunce se nikada ne promatra bez ispravnog filtra
            postavljenog na prednju stranu instrumenta.<br>
            Podaci: NOAA SWPC. Slike: NASA/SDO.`,
      nijeDostupno: 'Podaci o Sunčevoj aktivnosti trenutno nisu dostupni.'
    },
    en: {
      g5: 'Extreme storm', g4: 'Severe storm', g3: 'Strong storm', g2: 'Moderate storm',
      g1: 'Minor storm', aktivno: 'Active', mirno: 'Quiet',
      naslov: 'Solar Activity',
      ucitavam: 'Loading…',
      ucitavamPodatke: 'Loading data…',
      errNijedan: 'None of the data sources responded',
      kp: 'Kp index', bljesak: 'Latest flare', podrucja: 'Active regions', brojPjega: 'Sunspot count',
      polarnaKartica: 'Aurora possibly visible even from here',
      nedostupnoKartica: 'Data currently unavailable.<br>Open for details →',
      nemaBljeskova: 'No flares recorded in the last 7 days.',
      thKlasa: 'Class', thPocetak: 'Start', thMaksimum: 'Peak', thKraj: 'End',
      nemaKpProg: 'The Kp index forecast is currently unavailable.',
      thVrijeme: 'Time', thKp: 'Kp', thStanje: 'Conditions',
      thPodrucje: 'Region', thPolozaj: 'Location', thPjega: 'Spots', thPovrsina: 'Area',
      oluja: kp => `Geomagnetic storm in progress (Kp ${kp})`,
      olujaTekst: `At this level the aurora may be visible even from our latitudes,
                low above the northern horizon. Look for a spot with a clear view to the north,
                away from city lights. A camera will pick it up before your eyes do.`,
      pocetak: 'start ',
      pjegaDatum: (n, d) => `${n} spots · ${d}`,
      f107: 'F10.7 radio flux', sfu: 'solar flux units (sfu)',
      altHmi: 'Sunspots (SDO/HMI)', capHmi: 'White light — sunspots (SDO/HMI)',
      altAia: 'Corona 193 Å (SDO/AIA)', capAia: 'Corona 193 Å (SDO/AIA)',
      hPodrucja: 'Active regions on the disc',
      nedostupno: 'Data unavailable.',
      hBljeskovi: 'Flares in the last 7 days',
      hKpProg: 'Kp index forecast',
      kakoCitati: `<strong>How to read this:</strong> Kp measures the disturbance of Earth's magnetic field on
            a scale of 0–9. Up to 4 is quiet; from 5 upwards geomagnetic storms begin (NOAA scale G1–G5).
            For an aurora in Istria you practically need Kp 7 or higher.
            Flares are divided into classes A, B, C, M and X; each is ten times stronger than
            the previous one. M and X flares can disrupt shortwave radio on the sunlit side of Earth.
            F10.7 is the radio flux at 10.7 cm and a good indicator of overall solar-cycle activity.<br>
            <strong>Caution:</strong> never observe the Sun without a proper filter
            fitted to the front of the instrument.<br>
            Data: NOAA SWPC. Images: NASA/SDO.`,
      nijeDostupno: 'Solar activity data is currently unavailable.'
    },
    it: {
      g5: 'Tempesta estrema', g4: 'Tempesta molto forte', g3: 'Tempesta forte', g2: 'Tempesta moderata',
      g1: 'Tempesta debole', aktivno: 'Attivo', mirno: 'Calmo',
      naslov: 'Attività solare',
      ucitavam: 'Caricamento…',
      ucitavamPodatke: 'Caricamento dati…',
      errNijedan: 'Nessuna fonte di dati ha risposto',
      kp: 'Indice Kp', bljesak: 'Ultimo brillamento', podrucja: 'Regioni attive', brojPjega: 'Numero di macchie',
      polarnaKartica: 'Aurora possibile anche da noi',
      nedostupnoKartica: 'Dati al momento non disponibili.<br>Apri per i dettagli →',
      nemaBljeskova: 'Nessun brillamento registrato negli ultimi 7 giorni.',
      thKlasa: 'Classe', thPocetak: 'Inizio', thMaksimum: 'Massimo', thKraj: 'Fine',
      nemaKpProg: 'La previsione dell\'indice Kp non è al momento disponibile.',
      thVrijeme: 'Ora', thKp: 'Kp', thStanje: 'Stato',
      thPodrucje: 'Regione', thPolozaj: 'Posizione', thPjega: 'Macchie', thPovrsina: 'Area',
      oluja: kp => `Tempesta geomagnetica in corso (Kp ${kp})`,
      olujaTekst: `A questo livello l'aurora può essere visibile anche dalle nostre latitudini,
                bassa sull'orizzonte settentrionale. Cercate un luogo con vista libera verso nord,
                lontano dalle luci della città. La fotocamera la rileva prima dell'occhio.`,
      pocetak: 'inizio ',
      pjegaDatum: (n, d) => `${n} macchie · ${d}`,
      f107: 'Flusso radio F10.7', sfu: 'unità di flusso solare (sfu)',
      altHmi: 'Macchie solari (SDO/HMI)', capHmi: 'Luce bianca — macchie (SDO/HMI)',
      altAia: 'Corona 193 Å (SDO/AIA)', capAia: 'Corona 193 Å (SDO/AIA)',
      hPodrucja: 'Regioni attive sul disco',
      nedostupno: 'Dati non disponibili.',
      hBljeskovi: 'Brillamenti degli ultimi 7 giorni',
      hKpProg: 'Previsione dell\'indice Kp',
      kakoCitati: `<strong>Come leggere:</strong> il Kp misura la perturbazione del campo magnetico terrestre
            su una scala da 0 a 9. Fino a 4 è calmo, da 5 iniziano le tempeste geomagnetiche (scala NOAA G1–G5).
            Per vedere l'aurora in Istria serve in pratica un Kp di 7 o superiore.
            I brillamenti si dividono nelle classi A, B, C, M e X; ciascuna è dieci volte più intensa
            della precedente. Le classi M e X possono disturbare le comunicazioni radio a onde corte sul lato
            illuminato della Terra. F10.7 è il flusso radio a 10,7 cm ed è un buon indicatore dell'attività
            complessiva del ciclo.<br>
            <strong>Attenzione:</strong> non osservate mai il Sole senza un filtro adeguato
            montato sulla parte anteriore dello strumento.<br>
            Dati: NOAA SWPC. Immagini: NASA/SDO.`,
      nijeDostupno: 'I dati sull\'attività solare non sono al momento disponibili.'
    }
  };

  function T(kljuc, ...arg) {
    const v = (STR[LANG] && STR[LANG][kljuc] !== undefined) ? STR[LANG][kljuc] : STR.hr[kljuc];
    return typeof v === 'function' ? v(...arg) : v;
  }

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
    if (kp >= 9) return { g: 'G5', tekst: T('g5'), boja: '#ff3b3b' };
    if (kp >= 8) return { g: 'G4', tekst: T('g4'), boja: '#ff6b6b' };
    if (kp >= 7) return { g: 'G3', tekst: T('g3'), boja: '#ff8c42' };
    if (kp >= 6) return { g: 'G2', tekst: T('g2'), boja: '#ffb020' };
    if (kp >= 5) return { g: 'G1', tekst: T('g1'), boja: '#ffd93d' };
    if (kp >= 4) return { g: '–', tekst: T('aktivno'), boja: '#a8d84a' };
    return { g: '–', tekst: T('mirno'), boja: '#00ff88' };
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
    return d.toLocaleString(LOCALE, {
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
            color: var(--accent-primary);">${T('naslov')}</h3>
        <div id="sunce-card-body" style="text-align: center; color: var(--text-muted);
             font-size: 0.9rem;">${T('ucitavam')}</div>
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

      if (!kp && !b && !p) throw new Error(T('errNijedan'));

      const redak = (naziv, vrijednost, boja) => `
        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);">
          <span style="color: var(--text-secondary);">${naziv}</span>
          <span style="font-weight: 600; color: ${boja || 'var(--accent-secondary)'};">${vrijednost}</span>
        </div>`;

      body.style.textAlign = 'left';
      body.innerHTML =
        (kp ? redak(T('kp'), `${kp.vrijednost.toFixed(2)} · ${g.tekst}`, g.boja) : '') +
        (b ? redak(T('bljesak'), b, bojaKlase(b)) : '') +
        (p ? redak(T('podrucja'), `${p.brojPodrucja}`) : '') +
        (p ? redak(T('brojPjega'), `${p.brojPjega}`) : '') +
        (kp && kp.vrijednost >= 7
          ? `<div style="margin-top: 0.6rem; padding: 0.4rem; border-radius: 6px;
                  background: rgba(255,60,60,0.15); color: #ff8c42; font-size: 0.8rem;
                  text-align: center;">${T('polarnaKartica')}</div>`
          : '');
    } catch (err) {
      console.warn('[ADIP sunce]', err);
      body.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">
        ${T('nedostupnoKartica')}</span>`;
    }
  }

  /* ---------------------------------------------------------------
   *  Modal
   * --------------------------------------------------------------- */

  function tablicaBljeskova(bljeskovi) {
    if (!bljeskovi || !bljeskovi.length) {
      return `<p style="color: var(--text-muted);">${T('nemaBljeskova')}</p>`;
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
              <th style="padding: 0.5rem;">${T('thKlasa')}</th>
              <th style="padding: 0.5rem;">${T('thPocetak')}</th>
              <th style="padding: 0.5rem;">${T('thMaksimum')}</th>
              <th style="padding: 0.5rem;">${T('thKraj')}</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  function tablicaKpPrognoze(kpProg) {
    if (!kpProg || !kpProg.length) {
      return `<p style="color: var(--text-muted);">${T('nemaKpProg')}</p>`;
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
              <th style="padding: 0.4rem;">${T('thVrijeme')}</th>
              <th style="padding: 0.4rem;">${T('thKp')}</th>
              <th style="padding: 0.4rem;">${T('thStanje')}</th>
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
              <th style="padding: 0.4rem;">${T('thPodrucje')}</th>
              <th style="padding: 0.4rem;">${T('thPolozaj')}</th>
              <th style="padding: 0.4rem;">${T('thPjega')}</th>
              <th style="padding: 0.4rem;">${T('thPovrsina')}</th>
              <th style="padding: 0.4rem;">${T('thKlasa')}</th>
            </tr>
          </thead>
          <tbody>${redovi}</tbody>
        </table>
      </div>`;
  }

  window.openSunceModal = async function () {
    const modal = document.getElementById('service-modal');
    if (!modal) return;

    document.getElementById('modal-title').textContent = T('naslov');
    document.getElementById('modal-body').innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">${T('ucitavamPodatke')}</div>`;
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
              <strong style="color: #ff8c42;">${T('oluja', kp.vrijednost.toFixed(2))}</strong>
              <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.35rem;">
                ${T('olujaTekst')}
              </div>
            </div>` : ''}

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                      gap: 1rem; margin-bottom: 2rem;">
            ${kp ? kartica(T('kp'), kp.vrijednost.toFixed(2),
              `${g.tekst}${g.g !== '–' ? ' · ' + g.g : ''} · ${vrijemeIz(kp.kada)}`, g.boja) : ''}
            ${bk ? kartica(T('bljesak'), bk,
              b.begin_time ? T('pocetak') + vrijemeIz(b.begin_time) : '', bojaKlase(bk)) : ''}
            ${p ? kartica(T('podrucja'), p.brojPodrucja,
              T('pjegaDatum', p.brojPjega, p.datum)) : ''}
            ${f ? kartica(T('f107'), f.toFixed(0),
              T('sfu')) : ''}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                      gap: 1rem; margin-bottom: 2rem;">
            <div style="text-align: center;">
              <img src="${SDO_HMI}" alt="${T('altHmi')}" loading="lazy"
                   style="width: 100%; max-width: 320px; border-radius: 12px;">
              <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem;">
                ${T('capHmi')}</div>
            </div>
            <div style="text-align: center;">
              <img src="${SDO_193}" alt="${T('altAia')}" loading="lazy"
                   style="width: 100%; max-width: 320px; border-radius: 12px;">
              <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.35rem;">
                ${T('capAia')}</div>
            </div>
          </div>

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">
            ${T('hPodrucja')}</h4>
          ${tablicaPodrucja(p) || `<p style="color: var(--text-muted);">${T('nedostupno')}</p>`}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">
            ${T('hBljeskovi')}</h4>
          ${tablicaBljeskova(d.bljeskovi)}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">
            ${T('hKpProg')}</h4>
          ${tablicaKpPrognoze(d.kpProg)}

          <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 1.5rem; line-height: 1.7;">
            ${T('kakoCitati')}
          </p>
        </div>`;
    } catch (err) {
      console.error('[ADIP sunce]', err);
      document.getElementById('modal-body').innerHTML = `
        <div style="padding: 2rem; color: var(--text-muted);">
          <p>${T('nijeDostupno')}</p>
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
