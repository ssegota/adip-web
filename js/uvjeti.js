/* =====================================================================
 *  ADIP — Uvjeti za promatranje
 *  js/uvjeti.js
 *
 *  Uključi u servisi.html POSLIJE services.js:
 *      <script src="js/uvjeti.js?v=1"></script>
 *  Kartica se ubacuje sama u #main-services-grid.
 *
 *  IZVOR: Open-Meteo (besplatno, bez ključa, CORS dozvoljen).
 *  Ovisnosti: Chart.js i SunCalc — oboje je već na servisi.html.
 *
 *  ŠTO SE RAČUNA
 *   - naoblaka po slojevima; visoki cirusi najviše smetaju jer se
 *     ne vide na prvi pogled a upiju svjetlo slabih objekata
 *   - razlika temperature i rosišta: ispod 2 °C rosa se hvata na optiku
 *   - vjetar na 250 hPa (mlazna struja) kao gruba zamjena za seeing;
 *     jaka struja u visini znači titranje slike
 *   - osvijetljenost Mjeseca preko SunCalca, jer pun Mjesec pokvari
 *     i najvedriju noć za maglice
 * ===================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------
   *  Jezik (hr / en / it) — getCurrentLang() dolazi iz main.js.
   *  Hrvatski tekstovi su izvorni; en/it su prijevodi istih ključeva.
   * --------------------------------------------------------------- */

  const LANG = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
  const LOCALE = { hr: 'hr-HR', en: 'en-GB', it: 'it-IT' }[LANG] || 'hr-HR';

  const STR = {
    hr: {
      naslov: 'Uvjeti za promatranje',
      ucitavam: 'Učitavam prognozu…',
      izvrsno: 'Izvrsno', dobro: 'Dobro', osrednje: 'Osrednje', slabo: 'Slabo', lose: 'Loše',
      naoblaka: 'naoblaka', vjetar: 'vjetar', rosa: 'rosa', mjesec: 'Mjesec',
      nedostupnoKartica: 'Prognoza trenutno nedostupna.<br>Otvori za detalje →',
      nocas: 'Noćas',
      ispodObzora: '(ispod obzora)',
      thNoc: 'Noć', thMrak: 'Mrak', thOcjena: 'Ocjena', thNaoblaka: 'Naoblaka',
      thSlojevi: 'N / S / V', thSlojeviTitle: 'niski / srednji / visoki oblaci',
      thVjetar: 'Vjetar', thRosa: 'Rosa', thRosaTitle: 'razlika temperature i rosišta, °C',
      thMjesec: 'Mjesec',
      nemaDobrih: 'U sljedeća dva tjedna nema noći s ocjenom iznad 50.',
      niski: 'Niski oblaci', srednji: 'Srednji oblaci', visoki: 'Visoki oblaci',
      vjetarV: 'Vjetar', rosaV: 'Rosa (T − Td)', vlaga: 'Vlaga', mlazna: 'Mlazna struja',
      oborina: 'Vjerojatnost oborine',
      astroMrak: 'Astronomski mrak',
      prosjek: (p, m) => `naoblaka u prosjeku ${p}%, najmanje ${m}%`,
      grafNaslov: 'Naoblaka po slojevima, sljedeća 3 dana',
      sljedecih: n => `Sljedećih ${n} noći`,
      kakoCitati: `<strong>Kako čitati:</strong> ocjena spaja naoblaku (najveća težina), razliku
            temperature i rosišta, vjetar pri tlu i brzinu mlazne struje na 250 hPa.
            Razlika ispod 2 °C znači da se rosa hvata na optiku — ponesi grijač ili sušilo.
            Jaka struja u visini obično znači titranje slike i lošije planetarno promatranje.
            Osvijetljenost Mjeseca je zaseban podatak jer ne kvari vedrinu, nego kontrast
            slabih objekata.<br>
            Podaci: Open-Meteo (ICON / ECMWF). Prognoza dulja od 5 dana je orijentacijska.`,
      nijeDostupna: 'Prognoza trenutno nije dostupna.',
      errApi: 'API greška', errSatni: 'Odgovor bez satnih podataka'
    },
    en: {
      naslov: 'Observing Conditions',
      ucitavam: 'Loading forecast…',
      izvrsno: 'Excellent', dobro: 'Good', osrednje: 'Fair', slabo: 'Poor', lose: 'Bad',
      naoblaka: 'cloud cover', vjetar: 'wind', rosa: 'dew margin', mjesec: 'Moon',
      nedostupnoKartica: 'Forecast currently unavailable.<br>Open for details →',
      nocas: 'Tonight',
      ispodObzora: '(below horizon)',
      thNoc: 'Night', thMrak: 'Darkness', thOcjena: 'Rating', thNaoblaka: 'Cloud cover',
      thSlojevi: 'L / M / H', thSlojeviTitle: 'low / mid / high clouds',
      thVjetar: 'Wind', thRosa: 'Dew', thRosaTitle: 'temperature minus dew point, °C',
      thMjesec: 'Moon',
      nemaDobrih: 'There are no nights rated above 50 in the next two weeks.',
      niski: 'Low clouds', srednji: 'Mid clouds', visoki: 'High clouds',
      vjetarV: 'Wind', rosaV: 'Dew margin (T − Td)', vlaga: 'Humidity', mlazna: 'Jet stream',
      oborina: 'Chance of precipitation',
      astroMrak: 'Astronomical darkness',
      prosjek: (p, m) => `average cloud cover ${p}%, minimum ${m}%`,
      grafNaslov: 'Cloud cover by layer, next 3 days',
      sljedecih: n => `Next ${n} nights`,
      kakoCitati: `<strong>How to read this:</strong> the rating combines cloud cover (the largest weight),
            the difference between temperature and dew point, surface wind and the jet-stream speed at 250 hPa.
            A difference below 2 °C means dew will form on the optics — bring a heater or a hair dryer.
            Strong winds aloft usually mean a shimmering image and poorer planetary viewing.
            Moon illumination is listed separately because it does not spoil a clear sky, only the contrast
            of faint objects.<br>
            Data: Open-Meteo (ICON / ECMWF). Forecasts beyond 5 days are only indicative.`,
      nijeDostupna: 'The forecast is currently unavailable.',
      errApi: 'API error', errSatni: 'Response contains no hourly data'
    },
    it: {
      naslov: 'Condizioni di osservazione',
      ucitavam: 'Caricamento previsioni…',
      izvrsno: 'Ottime', dobro: 'Buone', osrednje: 'Discrete', slabo: 'Scarse', lose: 'Pessime',
      naoblaka: 'nuvolosità', vjetar: 'vento', rosa: 'margine rugiada', mjesec: 'Luna',
      nedostupnoKartica: 'Previsioni al momento non disponibili.<br>Apri per i dettagli →',
      nocas: 'Stanotte',
      ispodObzora: '(sotto l\'orizzonte)',
      thNoc: 'Notte', thMrak: 'Buio', thOcjena: 'Valutazione', thNaoblaka: 'Nuvolosità',
      thSlojevi: 'B / M / A', thSlojeviTitle: 'nubi basse / medie / alte',
      thVjetar: 'Vento', thRosa: 'Rugiada', thRosaTitle: 'differenza tra temperatura e punto di rugiada, °C',
      thMjesec: 'Luna',
      nemaDobrih: 'Nelle prossime due settimane non ci sono notti con valutazione superiore a 50.',
      niski: 'Nubi basse', srednji: 'Nubi medie', visoki: 'Nubi alte',
      vjetarV: 'Vento', rosaV: 'Margine rugiada (T − Td)', vlaga: 'Umidità', mlazna: 'Corrente a getto',
      oborina: 'Probabilità di precipitazioni',
      astroMrak: 'Buio astronomico',
      prosjek: (p, m) => `nuvolosità media ${p}%, minima ${m}%`,
      grafNaslov: 'Nuvolosità per strati, prossimi 3 giorni',
      sljedecih: n => `Prossime ${n} notti`,
      kakoCitati: `<strong>Come leggere:</strong> la valutazione combina la nuvolosità (il peso maggiore),
            la differenza tra temperatura e punto di rugiada, il vento al suolo e la velocità della corrente
            a getto a 250 hPa. Una differenza inferiore a 2 °C significa che la rugiada si deposita sull'ottica —
            portate una fascia riscaldante o un asciugacapelli.
            Un forte vento in quota di solito significa un'immagine tremolante e osservazioni planetarie peggiori.
            L'illuminazione della Luna è indicata a parte perché non rovina il sereno, ma il contrasto
            degli oggetti deboli.<br>
            Dati: Open-Meteo (ICON / ECMWF). Le previsioni oltre i 5 giorni sono solo indicative.`,
      nijeDostupna: 'Le previsioni non sono al momento disponibili.',
      errApi: 'Errore API', errSatni: 'Risposta senza dati orari'
    }
  };

  function T(kljuc, ...arg) {
    const v = (STR[LANG] && STR[LANG][kljuc] !== undefined) ? STR[LANG][kljuc] : STR.hr[kljuc];
    return typeof v === 'function' ? v(...arg) : v;
  }

  const COORDS = (typeof PULA_COORDS !== 'undefined')
    ? PULA_COORDS
    : { lat: 44.8683, lng: 13.8481 };
  const TZ = (typeof OBS_TZ !== 'undefined') ? OBS_TZ : 'Europe/Zagreb';

  const API = 'https://api.open-meteo.com/v1/forecast';
  const DANA = 14;

  let podaci = null;
  let grafInstance = null;

  /* ---------------------------------------------------------------
   *  Dohvat
   * --------------------------------------------------------------- */

  async function dohvati() {
    if (podaci && (Date.now() - podaci._vrijeme) < 20 * 60 * 1000) return podaci;

    const hourly = [
      'temperature_2m', 'dew_point_2m', 'relative_humidity_2m',
      'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid', 'cloud_cover_high',
      'wind_speed_10m', 'wind_gusts_10m', 'precipitation_probability',
      'visibility', 'wind_speed_250hPa'
    ].join(',');

    const url = `${API}?latitude=${COORDS.lat}&longitude=${COORDS.lng}`
      + `&hourly=${hourly}`
      + `&timezone=${encodeURIComponent(TZ)}&forecast_days=${DANA}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const data = await res.json();
    if (data.error) throw new Error(data.reason || T('errApi'));
    if (!data.hourly || !data.hourly.time) throw new Error(T('errSatni'));

    data._vrijeme = Date.now();
    podaci = data;
    return data;
  }

  /* ---------------------------------------------------------------
   *  Ocjena
   * --------------------------------------------------------------- */

  /**
   * Ocjena 0–100. Naoblaka nosi najviše jer bez vedrog neba
   * ostalo nije ni bitno; visoki oblaci se broje s manjom težinom
   * od niskih, ali se ne zanemaruju.
   */
  function ocijeni(s) {
    const oblaci = (s.low * 1.0 + s.mid * 0.8 + s.high * 0.6) / 2.4;

    let bod = 100 - oblaci;

    const rosa = s.temp - s.dew;
    if (rosa < 1) bod -= 18;
    else if (rosa < 2) bod -= 12;
    else if (rosa < 4) bod -= 5;

    if (s.vjetar > 40) bod -= 20;
    else if (s.vjetar > 25) bod -= 10;
    else if (s.vjetar > 15) bod -= 4;

    if (s.jet > 120) bod -= 12;
    else if (s.jet > 80) bod -= 6;

    if (s.kisa > 50) bod -= 25;
    else if (s.kisa > 20) bod -= 10;

    return Math.max(0, Math.min(100, Math.round(bod)));
  }

  function tockica(boja) {
    return `<span style="display:inline-block;width:0.8em;height:0.8em;border-radius:50%;background:${boja};vertical-align:middle;"></span>`;
  }

  function opis(bod) {
    if (bod >= 80) return { tekst: T('izvrsno'), boja: '#00ff88', ikona: tockica('#00ff88') };
    if (bod >= 60) return { tekst: T('dobro'), boja: '#7fdd52', ikona: tockica('#7fdd52') };
    if (bod >= 40) return { tekst: T('osrednje'), boja: '#ffb020', ikona: tockica('#ffb020') };
    if (bod >= 20) return { tekst: T('slabo'), boja: '#ff8c42', ikona: tockica('#ff8c42') };
    return { tekst: T('lose'), boja: '#ff6b6b', ikona: tockica('#ff6b6b') };
  }

  /* Sažmi satne vrijednosti unutar zadanog vremenskog raspona */
  function sazmi(data, od, doK) {
    const h = data.hourly;
    const uzorci = [];

    h.time.forEach((t, i) => {
      const kada = new Date(t);        // Open-Meteo vraća lokalno vrijeme bez zone
      if (kada >= od && kada <= doK) {
        uzorci.push({
          kada: kada,
          temp: h.temperature_2m?.[i],
          dew: h.dew_point_2m?.[i],
          low: h.cloud_cover_low?.[i] ?? 0,
          mid: h.cloud_cover_mid?.[i] ?? 0,
          high: h.cloud_cover_high?.[i] ?? 0,
          ukupno: h.cloud_cover?.[i] ?? 0,
          vjetar: h.wind_speed_10m?.[i] ?? 0,
          jet: h.wind_speed_250hPa?.[i] ?? 0,
          kisa: h.precipitation_probability?.[i] ?? 0,
          vlaga: h.relative_humidity_2m?.[i] ?? 0
        });
      }
    });

    if (!uzorci.length) return null;

    const sr = k => uzorci.reduce((a, u) => a + (Number(u[k]) || 0), 0) / uzorci.length;
    const min = k => Math.min(...uzorci.map(u => Number(u[k]) || 0));

    const sazetak = {
      temp: sr('temp'), dew: sr('dew'), low: sr('low'), mid: sr('mid'),
      high: sr('high'), ukupno: sr('ukupno'), vjetar: sr('vjetar'),
      jet: sr('jet'), kisa: Math.max(...uzorci.map(u => u.kisa)),
      vlaga: sr('vlaga'), minOblaci: min('ukupno'), uzorci: uzorci
    };
    sazetak.bod = ocijeni(sazetak);
    return sazetak;
  }

  /* Tamni dio noći: od kraja sumraka do početka svitanja */
  function nocZa(datum) {
    if (typeof SunCalc === 'undefined') {
      const od = new Date(datum); od.setHours(21, 0, 0, 0);
      const doK = new Date(datum); doK.setHours(28, 0, 0, 0);
      return { od, doK };
    }
    const t1 = SunCalc.getTimes(datum, COORDS.lat, COORDS.lng);
    const t2 = SunCalc.getTimes(new Date(datum.getTime() + 86400000), COORDS.lat, COORDS.lng);
    return { od: t1.dusk, doK: t2.dawn };
  }

  function mjesecZa(datum) {
    if (typeof SunCalc === 'undefined') return null;
    const noc = nocZa(datum);
    const sredina = new Date((noc.od.getTime() + noc.doK.getTime()) / 2);
    const ill = SunCalc.getMoonIllumination(sredina);
    const pos = SunCalc.getMoonPosition(sredina, COORDS.lat, COORDS.lng);
    return {
      osvijetljenost: Math.round(ill.fraction * 100),
      iznadObzora: pos.altitude > 0
    };
  }

  function sat(d) {
    return d.toLocaleTimeString(LOCALE, {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  /* ---------------------------------------------------------------
   *  Kartica
   * --------------------------------------------------------------- */

  function napraviKarticu() {
    const grid = document.getElementById('main-services-grid');
    if (!grid || document.getElementById('uvjeti-card')) return;

    const card = document.createElement('div');
    card.className = 'service-card glass-card';
    card.id = 'uvjeti-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="widget-content">
        <h3 class="service-title" style="margin-bottom: 1rem; text-align: center;
            color: var(--accent-primary);">${T('naslov')}</h3>
        <div id="uvjeti-card-body" style="text-align: center; color: var(--text-muted);
             font-size: 0.9rem;">${T('ucitavam')}</div>
      </div>`;

    card.addEventListener('click', () => window.openUvjetiModal());
    grid.appendChild(card);
  }

  async function osvjeziKarticu() {
    const body = document.getElementById('uvjeti-card-body');
    if (!body) return;

    try {
      const data = await dohvati();
      const noc = nocZa(new Date());
      const s = sazmi(data, noc.od, noc.doK);

      if (!s) throw new Error('Nema podataka za noćas');

      const o = opis(s.bod);
      const m = mjesecZa(new Date());

      body.innerHTML = `
        <div style="font-size: 2rem; line-height: 1;">${o.ikona}</div>
        <div style="font-size: 1.3rem; font-weight: 600; color: ${o.boja}; margin: 0.35rem 0;">
          ${o.tekst}</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          ${sat(noc.od)}–${sat(noc.doK)} · ${T('naoblaka')} ${Math.round(s.ukupno)}%
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
          ${T('vjetar')} ${Math.round(s.vjetar)} km/h · ${T('rosa')} ${(s.temp - s.dew).toFixed(1)} °C
          ${m ? ` · ${T('mjesec')} ${m.osvijetljenost}%` : ''}
        </div>`;
    } catch (err) {
      console.warn('[ADIP uvjeti]', err);
      body.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">
        ${T('nedostupnoKartica')}</span>`;
    }
  }

  /* ---------------------------------------------------------------
   *  Modal
   * --------------------------------------------------------------- */

  function tablicaNoci(data) {
    const danas = new Date();
    const redovi = [];

    for (let i = 0; i < DANA - 1; i++) {
      const dan = new Date(danas.getTime() + i * 86400000);
      const noc = nocZa(dan);
      const s = sazmi(data, noc.od, noc.doK);
      if (!s) continue;

      const o = opis(s.bod);
      const m = mjesecZa(dan);
      const naziv = i === 0 ? T('nocas')
        : dan.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'numeric' });

      redovi.push({ bod: s.bod, html: `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 0.5rem; white-space: nowrap;">
            ${i === 0 ? '<strong>' : ''}${naziv}${i === 0 ? '</strong>' : ''}</td>
          <td style="padding: 0.5rem; white-space: nowrap; color: var(--text-muted);">
            ${sat(noc.od)}–${sat(noc.doK)}</td>
          <td style="padding: 0.5rem;">
            <span style="color: ${o.boja}; font-weight: 600;">${o.ikona} ${o.tekst}</span>
            <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;
                        margin-top: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${s.bod}%; background: ${o.boja};"></div>
            </div>
          </td>
          <td style="padding: 0.5rem;">${Math.round(s.ukupno)}%
            <small style="color: var(--text-muted);"> (min ${Math.round(s.minOblaci)}%)</small></td>
          <td style="padding: 0.5rem;">${Math.round(s.low)} / ${Math.round(s.mid)} / ${Math.round(s.high)}</td>
          <td style="padding: 0.5rem;">${Math.round(s.vjetar)}</td>
          <td style="padding: 0.5rem;">${(s.temp - s.dew).toFixed(1)}</td>
          <td style="padding: 0.5rem;">${m ? m.osvijetljenost + '%' : '–'}
            ${m && !m.iznadObzora ? `<small style="color: var(--text-muted);"> ${T('ispodObzora')}</small>` : ''}</td>
        </tr>` });
    }

    const najbolje = redovi.slice().sort((a, b) => b.bod - a.bod).slice(0, 3)
      .filter(r => r.bod >= 50).length;

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 700px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent-primary); text-align: left;">
              <th style="padding: 0.5rem;">${T('thNoc')}</th>
              <th style="padding: 0.5rem;">${T('thMrak')}</th>
              <th style="padding: 0.5rem;">${T('thOcjena')}</th>
              <th style="padding: 0.5rem;">${T('thNaoblaka')}</th>
              <th style="padding: 0.5rem;" title="${T('thSlojeviTitle')}">${T('thSlojevi')}</th>
              <th style="padding: 0.5rem;" title="km/h">${T('thVjetar')}</th>
              <th style="padding: 0.5rem;" title="${T('thRosaTitle')}">${T('thRosa')}</th>
              <th style="padding: 0.5rem;">${T('thMjesec')}</th>
            </tr>
          </thead>
          <tbody>${redovi.map(r => r.html).join('')}</tbody>
        </table>
      </div>
      ${najbolje === 0 ? `<p style="color: var(--text-muted); margin-top: 1rem; font-size: 0.85rem;">
        ${T('nemaDobrih')}</p>` : ''}`;
  }

  function nacrtajGraf(data) {
    const canvas = document.getElementById('uvjeti-graf');
    if (!canvas || typeof Chart === 'undefined') return;

    const h = data.hourly;
    const n = Math.min(72, h.time.length);
    const labels = h.time.slice(0, n).map(t => t.slice(5, 16).replace('T', ' '));

    const skup = (kljuc, oznaka, boja) => ({
      label: oznaka,
      data: (h[kljuc] || []).slice(0, n),
      borderColor: boja,
      backgroundColor: boja + '33',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      fill: true
    });

    if (grafInstance) grafInstance.destroy();

    grafInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          skup('cloud_cover_low', T('niski'), '#e74c3c'),
          skup('cloud_cover_mid', T('srednji'), '#f39c12'),
          skup('cloud_cover_high', T('visoki'), '#3498db')
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#aaa', boxWidth: 12 } },
          tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}%` } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' },
               ticks: { color: '#888', maxTicksLimit: 8, autoSkip: true } },
          y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.06)' },
               ticks: { color: '#888', callback: v => v + '%' } }
        }
      }
    });
  }

  window.openUvjetiModal = async function () {
    const modal = document.getElementById('service-modal');
    if (!modal) return;

    document.getElementById('modal-title').textContent = T('naslov');
    document.getElementById('modal-body').innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">${T('ucitavam')}</div>`;
    modal.classList.add('active');

    try {
      const data = await dohvati();
      const noc = nocZa(new Date());
      const s = sazmi(data, noc.od, noc.doK);
      const o = s ? opis(s.bod) : null;

      document.getElementById('modal-body').innerHTML = `
        <div style="padding: 1rem;">

          ${s ? `
          <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
              <div style="font-size: 3rem; line-height: 1;">${o.ikona}</div>
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 1.5rem; font-weight: 600; color: ${o.boja};">
                  ${T('nocas')}: ${o.tekst} <span style="font-size: 1rem; color: var(--text-muted);">
                  (${s.bod}/100)</span></div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.35rem;">
                  ${T('astroMrak')} ${sat(noc.od)}–${sat(noc.doK)} ·
                  ${T('prosjek', Math.round(s.ukupno), Math.round(s.minOblaci))}
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                        gap: 1rem; margin-top: 1.25rem;">
              ${[
                [T('niski'), Math.round(s.low) + '%'],
                [T('srednji'), Math.round(s.mid) + '%'],
                [T('visoki'), Math.round(s.high) + '%'],
                [T('vjetarV'), Math.round(s.vjetar) + ' km/h'],
                [T('rosaV'), (s.temp - s.dew).toFixed(1) + ' °C'],
                [T('vlaga'), Math.round(s.vlaga) + '%'],
                [T('mlazna'), Math.round(s.jet) + ' km/h'],
                [T('oborina'), Math.round(s.kisa) + '%']
              ].map(([k, v]) => `
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem;">${k}</div>
                  <div style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600;">${v}</div>
                </div>`).join('')}
            </div>
          </div>` : ''}

          <h4 style="color: var(--accent-primary); margin-bottom: 0.5rem;">
            ${T('grafNaslov')}</h4>
          <div style="position: relative; width: 100%; height: 240px; margin-bottom: 2rem;">
            <canvas id="uvjeti-graf"></canvas>
          </div>

          <h4 style="color: var(--accent-primary); margin-bottom: 0.5rem;">
            ${T('sljedecih', DANA - 1)}</h4>
          ${tablicaNoci(data)}

          <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 1.5rem; line-height: 1.7;">
            ${T('kakoCitati')}
          </p>
        </div>`;

      nacrtajGraf(data);
    } catch (err) {
      console.error('[ADIP uvjeti]', err);
      document.getElementById('modal-body').innerHTML = `
        <div style="padding: 2rem; color: var(--text-muted);">
          <p>${T('nijeDostupna')}</p>
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
