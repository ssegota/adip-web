/* =====================================================================
 *  Servisi - izgled kartica, ikone, kategorije i pretraživanje.
 *
 *  Kartice i dalje grade servisi.html i skripte pojedinih servisa
 *  (uvjeti.js, sateliti.js, sunce.js, oprema.js, services.js). Ova skripta
 *  ih samo "uređuje": dodaje ikonu, kategoriju, ključne riječi za
 *  pretraživanje i pristupačnost tipkovnicom. Kartice koje se pojave kasnije
 *  (dinamički servisi) hvata MutationObserver.
 *
 *  Novi servis: dodaj zapis u META (ključ = id kartice). Kartica bez zapisa
 *  dobiva generičku ikonu i kategoriju "alati".
 *  Ovisi o: ikone.js (adipIkona), main.js (getCurrentLang).
 * ===================================================================== */
(function () {
  'use strict';

  const LANG = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
  const ikona = (ime, kl) => (typeof window.adipIkona === 'function' ? window.adipIkona(ime, kl) : '');

  const TXT = {
    hr: {
      trazi: 'Pretraži servise…', traziLabel: 'Pretraži servise', sve: 'Sve',
      nema: 'Nijedan servis ne odgovara pretrazi.', ocisti: 'Očisti pretragu',
      broj: n => n + (n % 10 === 1 && n % 100 !== 11 ? ' servis' : ' servisa'),
      otvori: 'Otvori', detalji: 'Detalji', kategorije: 'Kategorije servisa', precac: 'Pritisni / za pretraživanje'
    },
    en: {
      trazi: 'Search services…', traziLabel: 'Search services', sve: 'All',
      nema: 'No services match your search.', ocisti: 'Clear search',
      broj: n => n === 1 ? '1 service' : n + ' services',
      otvori: 'Open', detalji: 'Details', kategorije: 'Service categories', precac: 'Press / to search'
    },
    it: {
      trazi: 'Cerca servizi…', traziLabel: 'Cerca servizi', sve: 'Tutti',
      nema: 'Nessun servizio corrisponde alla ricerca.', ocisti: 'Cancella ricerca',
      broj: n => n === 1 ? '1 servizio' : n + ' servizi',
      otvori: 'Apri', detalji: 'Dettagli', kategorije: 'Categorie di servizi', precac: 'Premi / per cercare'
    }
  }[LANG];

  const KATEGORIJE = {
    nebo:    { hr: 'Nebo',          en: 'Sky',               it: 'Cielo' },
    vrijeme: { hr: 'Vrijeme i more', en: 'Weather & sea',    it: 'Meteo e mare' },
    alati:   { hr: 'Alati',          en: 'Tools',            it: 'Strumenti' },
    igre:    { hr: 'Igre i učenje',  en: 'Games & learning', it: 'Giochi e apprendimento' }
  };
  const REDOSLIJED_KAT = ['nebo', 'vrijeme', 'alati', 'igre'];

  // Ključne riječi su namjerno na sva tri jezika - pretraga radi bez obzira na jezik stranice.
  const META = {
    'meteo-card':    { ik: 'cloud-sun', kat: 'vrijeme', kw: 'vrijeme prognoza temperatura kisa vjetar tlak meteo weather forecast rain wind tempo previsioni pioggia pljusak' },
    'uvjeti-card':   { ik: 'moon-star', kat: 'vrijeme', kw: 'uvjeti promatranje naoblaka oblaci seeing noc observing conditions clouds night condizioni osservazione nuvole notte' },
    'tide-card':     { ik: 'waves',     kat: 'vrijeme', kw: 'plima oseka more razina tide sea level marea mare' },
    'sunmoon-card':  { ik: 'sun-moon',  kat: 'nebo',    kw: 'sunce mjesec izlazak zalazak faza mjeseca sun moon sunrise sunset phase sole luna alba tramonto fase' },
    'vidljivo-card': { ik: 'telescope', kat: 'nebo',    kw: 'nebo vidljivo veceras planeti zvijezde objekti sky visible tonight planets stars cielo visibile stasera pianeti stelle' },
    'sunce-card':    { ik: 'sun',       kat: 'nebo',    kw: 'sunceva aktivnost pjege bljesak kp polarna svjetlost geomagnetska oluja solar activity flare sunspots aurora attivita solare macchie aurora' },
    'sat-card':      { ik: 'satellite', kat: 'nebo',    kw: 'sateliti iss prolazi svemirska postaja satellites passes space station satelliti passaggi stazione spaziale' },
    'gmn-card':      { ik: 'camera',    kat: 'nebo',    kw: 'gmn meteori kamera global meteor network meteors camera meteore' },
    'oprema-card':   { ik: 'calculator', kat: 'alati',  kw: 'kalkulator oprema teleskop okular povecanje vidno polje calculator equipment telescope eyepiece magnification field of view calcolatore telescopio oculare ingrandimento' },
    'knjige-card':   { ik: 'book-open', kat: 'alati',   kw: 'knjige knjiznica katalog posudba books library catalogue libri biblioteca catalogo' },
    'kalendar-card': { ik: 'calendar-days', kat: 'alati', kw: 'kalendar dogadanja aktivnosti termini calendar events activities calendario eventi attivita' },
    'senzori-card':  { ik: 'activity',  kat: 'alati',   kw: 'senzori mobitel mjerenja uzivo sensors phone measurements live sensori telefono misure' },
    'igra-card':     { ik: 'scan-search', kat: 'igre',  kw: 'igra asteroid pronadi slika game find image gioco trova immagine spot' },
    'palisa-card':   { ik: 'orbit',     kat: 'igre',    kw: 'palisa asteroidi povijest otkrica asteroids history discoveries asteroidi storia scoperte johann' }
  };

  /* Normalizacija za pretragu: mala slova, bez dijakritika (č ć š ž đ -> c c s z d). */
  function norm(s) {
    return (s || '').toString().toLowerCase()
      .replace(/đ/g, 'd').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  let aktivnaKat = 'sve';
  let upit = '';
  let el = {};

  /* ---------------------------------------------------------------
   *  Uređivanje jedne kartice
   * --------------------------------------------------------------- */
  function uredi(card) {
    if (!card || card.dataset.svcUi === '1' || !card.classList.contains('service-card')) return;
    card.dataset.svcUi = '1';

    const meta = META[card.id] || { ik: 'link', kat: 'alati', kw: '' };
    const kat = KATEGORIJE[meta.kat] ? meta.kat : 'alati';
    card.classList.add('svc-card', 'svc-kat-' + kat);
    card.dataset.kat = kat;

    const widget = card.querySelector('.widget-content');
    if (widget) card.classList.add('svc-card--widget');

    const naslov = card.querySelector('.service-title');
    if (naslov) naslov.removeAttribute('style');

    // Opis jednostavnih kartica (prvi <p> izravno u kartici)
    const opis = Array.from(card.children).find(c => c.tagName === 'P');
    if (opis) { opis.removeAttribute('style'); opis.classList.add('svc-desc'); }

    // Slika (Palisa, GMN logo) postaje "ikona" u znački; ostali dobivaju SVG.
    const znacka = document.createElement('span');
    znacka.className = 'svc-badge';
    const slika = Array.from(card.children).find(c => c.tagName === 'IMG');
    if (slika) {
      slika.removeAttribute('style');
      slika.classList.add('svc-badge-img');
      if (card.id === 'gmn-card') znacka.classList.add('svc-badge--logo');
      znacka.appendChild(slika);
    } else {
      znacka.innerHTML = ikona(meta.ik);
    }

    const glava = document.createElement('div');
    glava.className = 'svc-head';
    const tekst = document.createElement('div');
    tekst.className = 'svc-head-text';
    const oznaka = document.createElement('span');
    oznaka.className = 'svc-cat';
    oznaka.textContent = KATEGORIJE[kat][LANG];
    tekst.appendChild(oznaka);
    if (naslov) tekst.appendChild(naslov);
    glava.append(znacka, tekst);

    const strelica = document.createElement('span');
    strelica.className = 'svc-arrow';
    strelica.innerHTML = ikona('arrow-up-right');
    glava.appendChild(strelica);

    card.insertBefore(glava, card.firstChild);

    if (!widget) {
      const dno = document.createElement('span');
      dno.className = 'svc-cta';
      dno.innerHTML = TXT.otvori + ' ' + ikona('arrow-right');
      card.appendChild(dno);
    }

    // Pristupačnost: kartica se otvara i tipkovnicom
    card.setAttribute('role', 'button');
    card.tabIndex = 0;
    if (naslov && naslov.textContent.trim()) card.setAttribute('aria-label', naslov.textContent.trim());
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });

    card.dataset.trazi = norm([
      naslov ? naslov.textContent : '',
      opis ? opis.textContent : '',
      slika ? slika.alt : '',
      KATEGORIJE[kat].hr, KATEGORIJE[kat].en, KATEGORIJE[kat].it,
      meta.kw
    ].join(' '));
  }

  /* ---------------------------------------------------------------
   *  Filtriranje
   * --------------------------------------------------------------- */
  function sveKartice() {
    return Array.from(document.querySelectorAll('#main-services-grid > .service-card, #user-services-grid > .service-card'));
  }

  function primijeni() {
    const rijeci = norm(upit).split(' ').filter(Boolean);
    let vidljivo = 0;
    const poKat = {};

    sveKartice().forEach(card => {
      uredi(card);
      const tekst = card.dataset.trazi || norm(card.textContent);
      const odgovaraUpitu = rijeci.every(r => tekst.includes(r));
      if (odgovaraUpitu) poKat[card.dataset.kat] = (poKat[card.dataset.kat] || 0) + 1;
      const prikazi = odgovaraUpitu && (aktivnaKat === 'sve' || card.dataset.kat === aktivnaKat);
      card.hidden = !prikazi;
      if (prikazi) vidljivo++;
    });

    if (el.chips) {
      el.chips.querySelectorAll('.svc-chip').forEach(ch => {
        const k = ch.dataset.kat;
        const n = k === 'sve' ? Object.values(poKat).reduce((a, b) => a + b, 0) : (poKat[k] || 0);
        ch.querySelector('.svc-chip-n').textContent = n;
        ch.classList.toggle('is-empty', n === 0 && k !== 'sve');
      });
    }
    if (el.broj) el.broj.textContent = TXT.broj(vidljivo);
    if (el.prazno) el.prazno.hidden = vidljivo !== 0;
    if (el.ocisti) el.ocisti.hidden = !upit;
  }

  /* ---------------------------------------------------------------
   *  Traka za pretraživanje i filtri
   * --------------------------------------------------------------- */
  function napraviTraku() {
    const grid = document.getElementById('main-services-grid');
    if (!grid || document.getElementById('svc-toolbar')) return;

    const traka = document.createElement('div');
    traka.id = 'svc-toolbar';
    traka.className = 'svc-toolbar';
    traka.innerHTML = `
      <div class="svc-search">
        ${ikona('search', 'svc-search-icon')}
        <input type="search" id="svc-search-input" class="svc-search-input"
               autocomplete="off" spellcheck="false" enterkeyhint="search">
        <kbd class="svc-kbd" aria-hidden="true">/</kbd>
        <button type="button" class="svc-search-clear" hidden>${ikona('x')}</button>
      </div>
      <div class="svc-filters">
        <div class="svc-chips" role="group"></div>
        <span class="svc-count" aria-live="polite"></span>
      </div>`;
    grid.parentNode.insertBefore(traka, grid);

    const input = traka.querySelector('input');
    input.placeholder = TXT.trazi;
    input.setAttribute('aria-label', TXT.traziLabel);
    input.title = TXT.precac;
    const ocisti = traka.querySelector('.svc-search-clear');
    ocisti.setAttribute('aria-label', TXT.ocisti);
    ocisti.title = TXT.ocisti;

    const chips = traka.querySelector('.svc-chips');
    chips.setAttribute('aria-label', TXT.kategorije);
    ['sve'].concat(REDOSLIJED_KAT).forEach(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'svc-chip' + (k !== 'sve' ? ' svc-kat-' + k : '');
      b.dataset.kat = k;
      b.setAttribute('aria-pressed', k === aktivnaKat ? 'true' : 'false');
      const ime = document.createElement('span');
      ime.textContent = k === 'sve' ? TXT.sve : KATEGORIJE[k][LANG];
      const n = document.createElement('span');
      n.className = 'svc-chip-n';
      b.append(ime, n);
      b.addEventListener('click', () => {
        aktivnaKat = k;
        chips.querySelectorAll('.svc-chip').forEach(c => c.setAttribute('aria-pressed', c === b ? 'true' : 'false'));
        primijeni();
      });
      chips.appendChild(b);
    });

    // Poruka kad ništa ne odgovara
    const prazno = document.createElement('div');
    prazno.className = 'svc-empty glass-card';
    prazno.hidden = true;
    prazno.innerHTML = `${ikona('telescope', 'svc-empty-icon')}<p></p>
      <button type="button" class="btn btn--secondary btn--sm"></button>`;
    prazno.querySelector('p').textContent = TXT.nema;
    const praznoBtn = prazno.querySelector('button');
    praznoBtn.textContent = TXT.ocisti;
    const userGrid = document.getElementById('user-services-grid');
    (userGrid || grid).insertAdjacentElement('afterend', prazno);

    el = { input, chips, broj: traka.querySelector('.svc-count'), prazno, ocisti };

    const resetiraj = () => {
      input.value = ''; upit = '';
      aktivnaKat = 'sve';
      chips.querySelectorAll('.svc-chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.kat === 'sve' ? 'true' : 'false'));
      primijeni();
      input.focus();
    };

    input.addEventListener('input', () => { upit = input.value; primijeni(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; upit = ''; primijeni(); }
    });
    ocisti.addEventListener('click', () => { input.value = ''; upit = ''; primijeni(); input.focus(); });
    praznoBtn.addEventListener('click', resetiraj);

    // Prečac "/" fokusira pretragu (osim kad se već tipka u neko polje)
    document.addEventListener('keydown', e => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('.modal-overlay.active')) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  function init() {
    napraviTraku();
    sveKartice().forEach(uredi);
    primijeni();

    // Kartice koje skripte ubace kasnije
    let zakazano = false;
    const obs = new MutationObserver(() => {
      if (zakazano) return;
      zakazano = true;
      requestAnimationFrame(() => { zakazano = false; primijeni(); });
    });
    ['main-services-grid', 'user-services-grid'].forEach(id => {
      const g = document.getElementById(id);
      if (g) obs.observe(g, { childList: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
