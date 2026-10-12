/* =====================================================================
 *  ADIP — Servisi
 *  Kompletna zamjena za js/services.js
 *  Podigni verziju u servisi.html:  <script src="js/services.js?v=12"></script>
 * ===================================================================== */

const PULA_COORDS = { lat: 44.8683, lng: 13.8481 };
const OBS_TZ = 'Europe/Zagreb';        // zona zvjezdarnice, NE zona posjetitelja
const TIDE_FIRST_YEAR = 2014;          // prva godina za koju postoje slike

/* =====================================================================
 *  Inicijalizacija
 * ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadServices();
  initAdminPanel();
  renderAstronomyWidget();
  renderTideWidget();

  document.getElementById('close-modal')?.addEventListener('click', closeModal);

  document.getElementById('service-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'service-modal') closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

/* =====================================================================
 *  Pomoćne funkcije
 * ===================================================================== */

function getLocale() {
  const p = window.location.pathname;
  if (p.includes('/en/')) return 'en-GB';
  if (p.includes('/it/')) return 'it-IT';    // prije je talijanski dobivao hr-HR
  return 'hr-HR';
}

function isSubdirLocale() {
  const p = window.location.pathname;
  return p.includes('/en/') || p.includes('/it/');
}

/**
 * Tekstovi kojih nema u rječniku iz main.js (hr / en / it).
 * Hrvatski je izvorni; ključ se bira prema getCurrentLang().
 */
const SERVICES_STR = {
  tideUnavailable: {
    hr: 'Otvorite za mjesečnu tablicu',
    en: 'Open for the monthly table',
    it: 'Apri per la tabella mensile'
  },
  tideCreditTitle: {
    hr: 'Razina iznad globalne srednje razine mora. '
      + 'Model ~8 km rezolucije — nije za navigaciju.',
    en: 'Level above global mean sea level. '
      + 'Model with ~8 km resolution — not for navigation.',
    it: 'Livello rispetto al livello medio globale del mare. '
      + 'Modello con risoluzione di ~8 km — non adatto alla navigazione.'
  }
};

function svcStr(key) {
  const lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
  const e = SERVICES_STR[key];
  return (e && e[lang] !== undefined) ? e[lang] : e.hr;
}

/** t() s pouzdanim fallbackom — original je zvao t() bez zaštite. */
function svcTr(key, fallback) {
  try {
    const v = typeof t === 'function' ? t(key) : null;
    return (v && v !== key) ? v : fallback;
  } catch (_) {
    return fallback;
  }
}

/**
 * Podne (UTC) onog kalendarskog dana koji je TRENUTNO u Puli.
 *
 * Zašto ne new Date():
 *  1. SunCalc bira solarni ciklus najbliži zadanom trenutku, pa bi za
 *     dužinu 13,85° E sve prije ~01:56 lokalno vratilo JUČERAŠNJI dan.
 *  2. Posjetitelj iz druge vremenske zone može biti na drugom datumu.
 * Podne po UTC je 13:00/14:00 u Puli — uvijek isti kalendarski dan.
 */
function observatoryToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OBS_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = k => parts.find(p => p.type === k).value;
  return new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);
}

/** Formatiranje u 24h, uvijek u vremenu Pule. */
function formatObsTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString(getLocale(), {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: OBS_TZ
  });
}

/* =====================================================================
 *  Admin panel
 * ===================================================================== */

function initAdminPanel() {
  const token = localStorage.getItem('adip_token');
  const adminPanel = document.getElementById('admin-service-panel');
  if (!token || !adminPanel) return;

  adminPanel.classList.remove('hidden');

  document.getElementById('service-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('service-title').value;
    const url   = document.getElementById('service-url').value;
    const type  = document.getElementById('service-type').value;

    try {
      const response = await fetch('/api/servisi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, type })
      });
      const result = await response.json();
      if (result.success) {
        alert(svcTr('serviceAdded', 'Servis dodan.'));
        loadServices();
        e.target.reset();
      } else {
        alert(svcTr('serviceAddError', 'Greška pri dodavanju servisa.'));
      }
    } catch (err) {
      console.error('[ADIP]', err);
      alert(svcTr('serviceAddError', 'Greška pri dodavanju servisa.'));
    }
  });
}

/* =====================================================================
 *  Dinamički servisi
 * ===================================================================== */

async function loadServices() {
  const container = document.getElementById('user-services-grid');
  if (!container) return;

  try {
    const response = await fetch('/api/servisi');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const services = await response.json();
    container.innerHTML = '';

    services.forEach(service => {
      const card = document.createElement('div');
      card.className = 'service-card glass-card';
      card.onclick = () => openModal(service.title, service.url, service.type);

      // textContent umjesto innerHTML — naslov dolazi iz baze,
      // s innerHTML bi proizvoljni HTML iz baze završio u stranici.
      const title = document.createElement('h3');
      title.className = 'service-title';
      title.textContent = service.title;

      card.append(title);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('[ADIP] Neuspjelo učitavanje servisa:', err);
  }
}

/* =====================================================================
 *  Modal
 * ===================================================================== */

function openModal(title, contentSrc, type) {
  const modal      = document.getElementById('service-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');
  if (!modal) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = '';

  if (type === 'iframe') {
    const iframe = document.createElement('iframe');
    iframe.src = contentSrc;
    iframe.loading = 'lazy';
    Object.assign(iframe.style, {
      width: '100%', height: '80vh', border: 'none', borderRadius: '8px'
    });
    modalBody.appendChild(iframe);
  } else if (type === 'image') {
    const img = document.createElement('img');
    img.src = contentSrc;
    Object.assign(img.style, {
      maxWidth: '100%', maxHeight: '80vh', display: 'block', margin: '0 auto'
    });
    modalBody.appendChild(img);
  }

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('service-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.getElementById('modal-body').innerHTML = '';   // zaustavi iframe
}

/* =====================================================================
 *  WIDGET: Sunce i Mjesec
 * ===================================================================== */

/** Kružna udaljenost dviju faza; 0,99 i 0,01 su udaljene 0,02 — ne 0,98. */
function phaseDistance(a, b) {
  const d = Math.abs(a - b) % 1;
  return Math.min(d, 1 - d);
}

// Sinodički mjesec je 29,53 dana => 1 dan = 0,0339 u jedinicama faze.
// ±0,02 daje prozor od ~1,2 dana oko svake glavne faze, simetrično.
const CARDINAL_HALF_WIDTH = 0.02;

const CARDINAL_PHASES = [
  { center: 0.00, icon: '', key: 'moonNew',          hr: 'Mlađak' },
  { center: 0.25, icon: '', key: 'moonFirstQuarter', hr: 'Prva četvrt' },
  { center: 0.50, icon: '', key: 'moonFull',         hr: 'Uštap' },
  { center: 0.75, icon: '', key: 'moonLastQuarter',  hr: 'Zadnja četvrt' }
];

/**
 * Ikona i naziv iz JEDNE funkcije. U originalu su bila dva odvojena
 * lanca if-ova koja su se mogla razići pri svakoj izmjeni.
 *
 * Faza je kružna veličina: 0 i 1 su ista točka. Stari linearni lanac
 * je hvatao mlađak samo na 0–0,03, pa je 0,97–1,00 (isti mlađak, dan
 * ranije) završavao kao "stari opadajući srp" uz osvijetljenost 0 %.
 */
function getMoonPhaseInfo(phase) {
  const p = ((phase % 1) + 1) % 1;

  for (const c of CARDINAL_PHASES) {
    if (phaseDistance(p, c.center) < CARDINAL_HALF_WIDTH) return c;
  }
  if (p < 0.25) return { icon: '', key: 'moonWaxingCrescent', hr: 'Mladi rastući srp' };
  if (p < 0.50) return { icon: '', key: 'moonWaxingGibbous',  hr: 'Rastući gibavi Mjesec' };
  if (p < 0.75) return { icon: '', key: 'moonWaningGibbous',  hr: 'Opadajući gibavi Mjesec' };
  return          { icon: '', key: 'moonWaningCrescent', hr: 'Stari opadajući srp' };
}

/**
 * Postotak vezan uz naziv faze, da se njih dvoje ne mogu proturječiti.
 * Dan prije uštapa fraction je 0,996 -> Math.round da 100 %, dok je
 * naziv (posve točno) "Rastući gibavi Mjesec". Na ekranu je to izgledalo
 * kao greška, pa gornju granicu izvan uštapa držimo na 99 %.
 */
function formatIllumination(fraction, phaseKey) {
  const pct = fraction * 100;
  if (phaseKey !== 'moonFull' && pct > 99) return 99;
  if (phaseKey !== 'moonNew'  && pct < 1 && pct > 0) return 1;
  return Math.round(pct);
}

function renderAstronomyWidget() {
  if (typeof SunCalc === 'undefined') {
    console.warn('[ADIP] SunCalc nije učitan');
    return;
  }

  const day  = observatoryToday();
  const sun  = SunCalc.getTimes(day, PULA_COORDS.lat, PULA_COORDS.lng);
  const moon = SunCalc.getMoonIllumination(day);

  const set = (id, value, html = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = value; else el.textContent = value;
  };

  set('astro-sunrise', formatObsTime(sun.sunrise));
  set('astro-sunset',  formatObsTime(sun.sunset));

  const info = getMoonPhaseInfo(moon.phase);
  set('astro-moon-phase', svcTr(info.key, info.hr), true);

  // fraction = osvijetljeni dio diska (0–1). NE phase — to je pozicija u ciklusu.
  set('astro-moon-illum', `${formatIllumination(moon.fraction, info.key)}%`);
}

/* =====================================================================
 *  WIDGET: Plima i oseka
 *
 *  Stara verzija je crtala Math.sin() s faznim pomakom = dan_u_mjesecu * 0,8.
 *  To nije bila predikcija nego ukras: krivulja je diskontinuirano skakala
 *  na prijelazu mjeseca i nije imala veze s morem.
 *
 *  Sada se povlači sea_level_height_msl iz Open-Meteo Marine API-ja.
 *  Besplatno i bez ključa za nekomercijalnu uporabu.
 *
 *  OGRANIČENJA (svjesno prihvaćena):
 *   - model radi na ~8 km rezolucije, što ne hvata razvedenu obalu;
 *     nije za navigaciju
 *   - referentna razina je GLOBALNA srednja razina mora, ne najniža
 *     astronomska voda kakvu koriste pomorske karte -> apsolutne visine
 *     se neće poklopiti sa slikom adip_YYYY-MM.jpg, ali oblik i vremena
 *     ekstrema hoće
 *   - uključen je i barometarski efekt, pa ovo nije čista astronomska
 *     plima nego očekivana stvarna razina
 * ===================================================================== */

const TIDE_API = 'https://marine-api.open-meteo.com/v1/marine';

let tideChartInstance = null;

async function renderTideWidget() {
  const canvas = document.getElementById('tideChart');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    console.warn('[ADIP] Chart.js nije učitan');
    return showTideMessage(svcTr('tideUnavailable', svcStr('tideUnavailable')));
  }

  const url = `${TIDE_API}?latitude=${PULA_COORDS.lat}&longitude=${PULA_COORDS.lng}`
            + `&minutely_15=sea_level_height_msl&hourly=sea_level_height_msl`
            + `&timezone=${encodeURIComponent(OBS_TZ)}`
            + `&forecast_days=1&cell_selection=sea`;

  let labels, values;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.reason || 'API je vratio grešku');

    // 15-minutni niz je izvorni u srednjoj Europi; drugdje je interpoliran,
    // a ponegdje potpuno prazan — zato provjeravamo ima li stvarnih vrijednosti.
    const fine = data.minutely_15?.sea_level_height_msl;
    const src = (Array.isArray(fine) && fine.some(v => v !== null && v !== undefined))
      ? data.minutely_15
      : data.hourly;

    if (!src?.time || !src.sea_level_height_msl) {
      throw new Error('odgovor ne sadrži sea_level_height_msl');
    }

    const pairs = src.time
      .map((t, i) => ({ t, v: src.sea_level_height_msl[i] }))
      .filter(p => p.v !== null && p.v !== undefined && Number.isFinite(Number(p.v)));

    if (pairs.length < 4) throw new Error(`premalo točaka (${pairs.length})`);

    labels = pairs.map(p => p.t.slice(11, 16));   // "2026-08-10T09:45" -> "09:45"
    values = pairs.map(p => Number(p.v));
  } catch (err) {
    console.warn('[ADIP] Podaci o plimi nedostupni:', err.message);
    // Namjerno NE crtamo izmišljenu krivulju.
    return showTideMessage(svcTr('tideUnavailable', svcStr('tideUnavailable')));
  }

  showTideExtremes(labels, values);

  if (tideChartInstance) tideChartInstance.destroy();   // spriječi "Canvas is already in use"

  tideChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: svcTr('tideLevel', 'Razina mora'),
        data: values,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,     // BEZ ovoga Chart.js prepiše CSS visinu
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y.toFixed(2)} m` } }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#aaa', maxTicksLimit: 5, autoSkip: true }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#aaa', maxTicksLimit: 4, callback: v => v.toFixed(1) }
          // BEZ fiksnog min/max: stari -1.5/+1.5 je krivulju za Pulu
          // (raspon ~0,3–0,9 m) spljoštio u gotovo ravnu crtu.
        }
      }
    }
  });
}

/** Ispiše vrijeme najviše i najniže vode uz obaveznu atribuciju izvora. */
function showTideExtremes(labels, values) {
  const el = document.getElementById('tide-credit');
  if (!el) return;

  let hi = 0, lo = 0;
  values.forEach((v, i) => {
    if (v > values[hi]) hi = i;
    if (v < values[lo]) lo = i;
  });

  el.textContent = `▲ ${labels[hi]}  ▼ ${labels[lo]}  ·  Open-Meteo / Copernicus`;
  el.title = svcStr('tideCreditTitle');
}

function showTideMessage(text) {
  const canvas = document.getElementById('tideChart');
  // Zahtijeva omotač oko canvasa (vidi servisi.html), inače bi ovo
  // obrisalo i naslov kartice.
  if (!canvas || !canvas.parentElement) return;
  canvas.parentElement.innerHTML =
    `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;
               margin: 0; padding: 2rem 0.5rem;">${text}</p>`;
  const credit = document.getElementById('tide-credit');
  if (credit) credit.textContent = '';
}

/* =====================================================================
 *  Modali sa slikama (izlazak/zalazak Sunca, plima)
 * ===================================================================== */

function getSunriseBasePath() {
  return isSubdirLocale() ? '../servisi/sunrises/' : 'servisi/sunrises/';
}

function getTideBasePath() {
  return isSubdirLocale() ? '../servisi/tides/' : 'servisi/tides/';
}

function getSunriseImageUrl(year, month, basePath) {
  return `${basePath}ncal_${year}_${String(month).padStart(2, '0')}.gif`;
}

function getTideImageUrl(year, month, basePath) {
  return `${basePath}adip_${year}-${String(month).padStart(2, '0')}.jpg`;
}

function getMonthNames() {
  const l = getLocale();
  if (l.startsWith('en')) return ['January','February','March','April','May','June',
                                  'July','August','September','October','November','December'];
  if (l.startsWith('it')) return ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                                  'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  return ['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj',
          'Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac'];
}

/**
 * Zajednički predložak za oba modala — prije je bio kopiran dvaput,
 * pa je svaki popravak trebalo raditi na dva mjesta.
 * Gornja granica godina je dinamična; stari kod je imao tvrdo upisano
 * 2026 i od 1.1.2027. ne bi imao tekuću godinu u popisu.
 */
function buildImageBrowser(prefix, initialUrl, onShowFn) {
  const now   = observatoryToday();
  const month = now.getUTCMonth() + 1;
  const year  = now.getUTCFullYear();
  const names = getMonthNames();

  const months = names.map((n, i) =>
    `<option value="${i + 1}"${i + 1 === month ? ' selected' : ''}>${n}</option>`).join('');

  const years = [];
  for (let y = TIDE_FIRST_YEAR; y <= Math.max(year, TIDE_FIRST_YEAR); y++) {
    years.push(`<option value="${y}"${y === year ? ' selected' : ''}>${y}</option>`);
  }

  const notFound = svcTr('imageNotFound', 'Slika nije dostupna za odabrani mjesec');

  return `
    <div style="padding: 1rem;">
      <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center;
                  flex-wrap: wrap; justify-content: center;">
        <label style="color: var(--text-secondary);">${svcTr('selectMonth', 'Mjesec')}:</label>
        <select id="${prefix}-month-select" class="form-input" style="width: auto; min-width: 120px;">
          ${months}
        </select>
        <label style="color: var(--text-secondary);">${svcTr('selectYear', 'Godina')}:</label>
        <select id="${prefix}-year-select" class="form-input" style="width: auto; min-width: 100px;">
          ${years.join('')}
        </select>
        <button class="btn btn--primary" onclick="${onShowFn}()">${svcTr('show', 'Prikaži')}</button>
      </div>
      <div style="text-align: center;">
        <img id="${prefix}-image" src="${initialUrl}" alt=""
             style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
        <p id="${prefix}-error" style="display: none; color: var(--text-muted); padding: 2rem;">
          ${notFound}
        </p>
      </div>
    </div>`;
}

/** Zajednička obrada greške učitavanja slike (bez inline onerror atributa). */
function wireImageFallback(prefix) {
  const img = document.getElementById(`${prefix}-image`);
  const err = document.getElementById(`${prefix}-error`);
  if (!img || !err) return;
  img.onerror = () => { img.style.display = 'none'; err.style.display = 'block'; };
  img.onload  = () => { img.style.display = 'block'; err.style.display = 'none'; };
}

window.openAstronomyModal = function () {
  const modal = document.getElementById('service-modal');
  if (!modal) return;

  const now = observatoryToday();
  document.getElementById('modal-title').textContent =
    svcTr('sunriseSunsetTitle', 'Izlazak i zalazak Sunca');
  document.getElementById('modal-body').innerHTML = buildImageBrowser(
    'sunrise',
    getSunriseImageUrl(now.getUTCFullYear(), now.getUTCMonth() + 1, getSunriseBasePath()),
    'updateSunriseImage'
  );
  wireImageFallback('sunrise');
  modal.classList.add('active');
};

window.openTideModal = function () {
  const modal = document.getElementById('service-modal');
  if (!modal) return;

  const now = observatoryToday();
  document.getElementById('modal-title').textContent = svcTr('tideTitle', 'Plima i oseka');
  document.getElementById('modal-body').innerHTML = buildImageBrowser(
    'tide',
    getTideImageUrl(now.getUTCFullYear(), now.getUTCMonth() + 1, getTideBasePath()),
    'updateTideImage'
  );
  wireImageFallback('tide');
  modal.classList.add('active');
};

window.updateSunriseImage = function () {
  const m = parseInt(document.getElementById('sunrise-month-select').value, 10);
  const y = parseInt(document.getElementById('sunrise-year-select').value, 10);
  document.getElementById('sunrise-image').src = getSunriseImageUrl(y, m, getSunriseBasePath());
};

window.updateTideImage = function () {
  const m = parseInt(document.getElementById('tide-month-select').value, 10);
  const y = parseInt(document.getElementById('tide-year-select').value, 10);
  document.getElementById('tide-image').src = getTideImageUrl(y, m, getTideBasePath());
};