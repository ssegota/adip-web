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
    if (data.error) throw new Error(data.reason || 'API greška');
    if (!data.hourly || !data.hourly.time) throw new Error('Odgovor bez satnih podataka');

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
    if (bod >= 80) return { tekst: 'Izvrsno', boja: '#00ff88', ikona: tockica('#00ff88') };
    if (bod >= 60) return { tekst: 'Dobro', boja: '#7fdd52', ikona: tockica('#7fdd52') };
    if (bod >= 40) return { tekst: 'Osrednje', boja: '#ffb020', ikona: tockica('#ffb020') };
    if (bod >= 20) return { tekst: 'Slabo', boja: '#ff8c42', ikona: tockica('#ff8c42') };
    return { tekst: 'Loše', boja: '#ff6b6b', ikona: tockica('#ff6b6b') };
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
    return d.toLocaleTimeString('hr-HR', {
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
            color: var(--accent-primary);">Uvjeti za promatranje</h3>
        <div id="uvjeti-card-body" style="text-align: center; color: var(--text-muted);
             font-size: 0.9rem;">Učitavam prognozu…</div>
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
          ${sat(noc.od)}–${sat(noc.doK)} · naoblaka ${Math.round(s.ukupno)}%
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
          vjetar ${Math.round(s.vjetar)} km/h · rosa ${(s.temp - s.dew).toFixed(1)} °C
          ${m ? ` · Mjesec ${m.osvijetljenost}%` : ''}
        </div>`;
    } catch (err) {
      console.warn('[ADIP uvjeti]', err);
      body.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">
        Prognoza trenutno nedostupna.<br>Otvori za detalje →</span>`;
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
      const naziv = i === 0 ? 'Noćas'
        : dan.toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'numeric' });

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
            ${m && !m.iznadObzora ? '<small style="color: var(--text-muted);"> (ispod obzora)</small>' : ''}</td>
        </tr>` });
    }

    const najbolje = redovi.slice().sort((a, b) => b.bod - a.bod).slice(0, 3)
      .filter(r => r.bod >= 50).length;

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 700px;">
          <thead>
            <tr style="border-bottom: 2px solid var(--accent-primary); text-align: left;">
              <th style="padding: 0.5rem;">Noć</th>
              <th style="padding: 0.5rem;">Mrak</th>
              <th style="padding: 0.5rem;">Ocjena</th>
              <th style="padding: 0.5rem;">Naoblaka</th>
              <th style="padding: 0.5rem;" title="niski / srednji / visoki oblaci">N / S / V</th>
              <th style="padding: 0.5rem;" title="km/h">Vjetar</th>
              <th style="padding: 0.5rem;" title="razlika temperature i rosišta, °C">Rosa</th>
              <th style="padding: 0.5rem;">Mjesec</th>
            </tr>
          </thead>
          <tbody>${redovi.map(r => r.html).join('')}</tbody>
        </table>
      </div>
      ${najbolje === 0 ? `<p style="color: var(--text-muted); margin-top: 1rem; font-size: 0.85rem;">
        U sljedeća dva tjedna nema noći s ocjenom iznad 50.</p>` : ''}`;
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
          skup('cloud_cover_low', 'Niski oblaci', '#e74c3c'),
          skup('cloud_cover_mid', 'Srednji oblaci', '#f39c12'),
          skup('cloud_cover_high', 'Visoki oblaci', '#3498db')
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

    document.getElementById('modal-title').textContent = 'Uvjeti za promatranje';
    document.getElementById('modal-body').innerHTML =
      `<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Učitavam prognozu…</div>`;
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
                  Noćas: ${o.tekst} <span style="font-size: 1rem; color: var(--text-muted);">
                  (${s.bod}/100)</span></div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.35rem;">
                  Astronomski mrak ${sat(noc.od)}–${sat(noc.doK)} ·
                  naoblaka u prosjeku ${Math.round(s.ukupno)}%, najmanje ${Math.round(s.minOblaci)}%
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                        gap: 1rem; margin-top: 1.25rem;">
              ${[
                ['Niski oblaci', Math.round(s.low) + '%'],
                ['Srednji oblaci', Math.round(s.mid) + '%'],
                ['Visoki oblaci', Math.round(s.high) + '%'],
                ['Vjetar', Math.round(s.vjetar) + ' km/h'],
                ['Rosa (T − Td)', (s.temp - s.dew).toFixed(1) + ' °C'],
                ['Vlaga', Math.round(s.vlaga) + '%'],
                ['Mlazna struja', Math.round(s.jet) + ' km/h'],
                ['Vjerojatnost oborine', Math.round(s.kisa) + '%']
              ].map(([k, v]) => `
                <div>
                  <div style="color: var(--text-muted); font-size: 0.75rem;">${k}</div>
                  <div style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600;">${v}</div>
                </div>`).join('')}
            </div>
          </div>` : ''}

          <h4 style="color: var(--accent-primary); margin-bottom: 0.5rem;">
            Naoblaka po slojevima, sljedeća 3 dana</h4>
          <div style="position: relative; width: 100%; height: 240px; margin-bottom: 2rem;">
            <canvas id="uvjeti-graf"></canvas>
          </div>

          <h4 style="color: var(--accent-primary); margin-bottom: 0.5rem;">
            Sljedećih ${DANA - 1} noći</h4>
          ${tablicaNoci(data)}

          <p style="color: var(--text-muted); font-size: 0.78rem; margin-top: 1.5rem; line-height: 1.7;">
            <strong>Kako čitati:</strong> ocjena spaja naoblaku (najveća težina), razliku
            temperature i rosišta, vjetar pri tlu i brzinu mlazne struje na 250 hPa.
            Razlika ispod 2 °C znači da se rosa hvata na optiku — ponesi grijač ili sušilo.
            Jaka struja u visini obično znači titranje slike i lošije planetarno promatranje.
            Osvijetljenost Mjeseca je zaseban podatak jer ne kvari vedrinu, nego kontrast
            slabih objekata.<br>
            Podaci: Open-Meteo (ICON / ECMWF). Prognoza dulja od 5 dana je orijentacijska.
          </p>
        </div>`;

      nacrtajGraf(data);
    } catch (err) {
      console.error('[ADIP uvjeti]', err);
      document.getElementById('modal-body').innerHTML = `
        <div style="padding: 2rem; color: var(--text-muted);">
          <p>Prognoza trenutno nije dostupna.</p>
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
