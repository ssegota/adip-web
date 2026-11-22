/* =====================================================================
 *  ADIP — Plima i oseka: izračunati mjesečni grafikon za Pulu
 *
 *  Crta isti kalendar kao slike servisi/tides/adip_YYYY-MM.jpg (5 redaka
 *  po 7 dana, krivulja ±60 cm, vremena visokih voda iznad retka, niskih
 *  ispod, mijene Mjeseca), ali krivulju RAČUNA u pregledniku harmonijskom
 *  prognozom: bez API ključa i bez ijednog mrežnog poziva pri prikazu.
 *  Tako slike jednog dana mogu otići.
 *
 *  HARMONIJSKE KONSTANTE ZA PULU
 *    Janeković, I. i Kuzmić, M. (2005): Numerical simulation of the
 *    Adriatic Sea principal tidal constituents. Annales Geophysicae 23,
 *    3207–3218, doi:10.5194/angeo-23-3207-2005 — Tablica 1, postaja 7
 *    "Pula" (objavljene vrijednosti iz Polli 1959, Mosetti 1959,
 *    Trotti 1969, Janeković i sur. 2003). Amplitude u cm, faze u
 *    stupnjevima "relative to 15° E", tj. prema zonskom vremenu UTC+1
 *    (Schuremanov κ'). U Greenwich fazu: G = κ' − σ · 1 h.
 *    Koristi se točno tih 7 komponenti (bez Q1) — kao program koji je
 *    izradio slike u servisi/tides/.
 *    Nula grafikona leži 1,9 cm ispod razine na slikama (Z0), kao na slikama.
 *
 *  ASTRONOMSKI ARGUMENTI (Schureman 1958, Manual of Harmonic Analysis and
 *  Prediction of Tides, SP 98): V se računa za svaki trenutak iz srednjih
 *  dužina s, h, p, N (Meeus, Astronomical Algorithms, 2. izd.). Čvorni
 *  faktori f i u (iz I, ν, ξ, ν', ν'') računaju se JEDNOM ZA GODINU, za
 *  sredinu godine (2. srpnja) — standardna praksa za godišnje tablice
 *  plime i način na koji su rađene slike.
 *
 *  PROVJERA prema slikama za 2026.: 219 od 220 ručno očitanih vremena
 *    visokih i niskih voda (studeni i srpanj) jednako je izračunu nakon
 *    zaokruživanja na 10 min, kao na slikama.
 *  VRIJEME: od 2024. slike su cijelu godinu u UTC+1 ("solarno mjerenje
 *    vremena"), do 2023. u lokalnom vremenu (ljeti UTC+2) — izračun
 *    slijedi isto pravilo (SOLARNO_OD), pa se slika i izračun ne razlikuju.
 *
 *  NIJE ZA NAVIGACIJU: čista astronomska plima, bez utjecaja vjetra i tlaka
 *  (bura, jugo i seši u Jadranu lako dodaju desetke centimetara).
 *
 *  Ovisi o: main.js (getCurrentLang) — neobavezno, bez njega je hrvatski.
 * ===================================================================== */
(function () {
  'use strict';

  const D2R = Math.PI / 180;
  const J2000 = Date.UTC(2000, 0, 1, 12);       // JD 2451545.0
  const SAT = 3600000;
  const DAN = 86400000;

  /** true = cijelu godinu UTC+1 kao slike od 2024. ("solarno"); false = Europe/Zagreb. */
  const SOLARNO_VRIJEME = false;
  /** Od ove godine slike su cijelu godinu u UTC+1; izračun slijedi slike. */
  const SOLARNO_OD = 2024;
  const VREMENSKA_ZONA = 'Europe/Zagreb';

  /* -----------------------------------------------------------------
   *  Konstante: [amplituda cm, faza κ' ° (15° E), brzina °/h]
   * ----------------------------------------------------------------- */
  const KONSTANTE = {
    M2: [15.07, 266.7, 28.9841042],
    S2: [ 8.68, 273.1, 30.0000000],
    N2: [ 2.34, 274.0, 28.4397295],
    K2: [ 2.45, 271.3, 30.0821373],
    K1: [15.63,  69.1, 15.0410686],
    O1: [ 4.96,  63.3, 13.9430356],
    P1: [ 4.94,  70.1, 14.9589314]
  };

  const Z0 = 1.9;   // cm — razina kao na slikama (prilagodba na slike za 2026.)

  // κ' (UTC+1) -> Greenwich faza G, jednom
  const LISTA = Object.keys(KONSTANTE).map(ime => {
    const [A, kapa, w] = KONSTANTE[ime];
    return { ime, A, G: kapa - w * 1, w };
  });

  /* -----------------------------------------------------------------
   *  Astronomija
   * ----------------------------------------------------------------- */

  const ostatak = (x, m) => ((x % m) + m) % m;

  /** Srednje dužine (°) za d dana od J2000 (UT ≈ TT; ΔT ~70 s je ovdje zanemariv). */
  function srednjeDuzine(d) {
    const T = d / 36525;
    return {
      s: 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T,   // Mjesec
      h: 280.46646 + 36000.76983 * T + 0.0003032 * T * T,          // Sunce
      p: 83.3532465 + 4069.0137287 * T - 0.0103200 * T * T,        // perigej Mjeseca
      N: 125.04452 - 1934.136261 * T + 0.0020708 * T * T           // uzlazni čvor
    };
  }

  /** Kut u (−180°, 180°]. */
  const kut180 = x => ostatak(x + 180, 360) - 180;

  /**
   * Čvorni faktori f i fazne korekcije u (°) po Schuremanu (jedn. 197–235),
   * s ω = 23,452° i i = 5,145°. Za Q1/N2 vrijede O1/M2, za S2/P1 f = 1, u = 0.
   */
  function cvorni(N) {
    const i = 5.145 * D2R, w = 23.452 * D2R, n = N * D2R;
    const I = Math.acos(Math.cos(i) * Math.cos(w) - Math.sin(i) * Math.sin(w) * Math.cos(n));
    const tg = Math.tan(n / 2);
    const a = Math.atan(Math.cos((w - i) / 2) / Math.cos((w + i) / 2) * tg) - n / 2;
    const b = Math.atan(Math.sin((w - i) / 2) / Math.sin((w + i) / 2) * tg) - n / 2;
    const xi = kut180(-(a + b) / D2R) * D2R;
    const nu = kut180((a - b) / D2R) * D2R;
    const s2I = Math.sin(2 * I), sI = Math.sin(I), c2 = Math.cos(I / 2) ** 2;
    const nu1 = Math.atan(s2I * Math.sin(nu) / (s2I * Math.cos(nu) + 0.3347));
    const nu2 = 0.5 * Math.atan(sI * sI * Math.sin(2 * nu) / (sI * sI * Math.cos(2 * nu) + 0.0727));

    const fM2 = c2 * c2 / 0.9154;
    const fO1 = sI * c2 / 0.3800;
    const fK1 = Math.sqrt(0.8965 * s2I * s2I + 0.6001 * s2I * Math.cos(nu) + 0.1006);
    const fK2 = Math.sqrt(19.0444 * sI ** 4 + 2.7702 * sI * sI * Math.cos(2 * nu) + 0.0981);
    const uM2 = (2 * xi - 2 * nu) / D2R;
    const uO1 = (2 * xi - nu) / D2R;
    return {
      f: { M2: fM2, N2: fM2, S2: 1, K2: fK2, K1: fK1, O1: fO1, Q1: fO1, P1: 1 },
      u: { M2: uM2, N2: uM2, S2: 0, K2: -2 * nu2 / D2R, K1: -nu1 / D2R, O1: uO1, Q1: uO1, P1: 0 }
    };
  }

  // Čvorni faktori jednom za godinu, za sredinu godine (2. 7. 00:00 UTC) —
  // tako se rade godišnje tablice plime i tako su rađene slike. Godina se
  // uzima po UTC+1, da cijeli mjesečni grafikon dijeli iste faktore.
  const cvorniGod = new Map();
  function cvorniZa(d) {
    const god = new Date(J2000 + d * DAN + SAT).getUTCFullYear();
    let c = cvorniGod.get(god);
    if (!c) {
      c = cvorni(srednjeDuzine((Date.UTC(god, 6, 2) - J2000) / DAN).N);
      cvorniGod.set(god, c);
    }
    return c;
  }

  /** Ravnotežni argument V (°); T = satni kut srednjeg Sunca (180° u ponoć UT). */
  function argument(ime, T, s, h, p) {
    switch (ime) {
      case 'M2': return 2 * T - 2 * s + 2 * h;
      case 'S2': return 2 * T;
      case 'N2': return 2 * T - 3 * s + 2 * h + p;
      case 'K2': return 2 * T + 2 * h;
      case 'K1': return T + h - 90;
      case 'O1': return T - 2 * s + h + 90;
      case 'P1': return T - h + 90;
      case 'Q1': return T - 3 * s + h + p + 90;
    }
    return 0;
  }

  /** Razina mora (cm prema srednjoj razini) u trenutku ms (UTC epoha). */
  function razina(ms) {
    const d = (ms - J2000) / DAN;
    const { s, h, p } = srednjeDuzine(d);
    const T = 180 + 360 * ostatak(d + 0.5, 1);
    const c = cvorniZa(d);
    let z = Z0;
    for (const k of LISTA) {
      const V = argument(k.ime, T, s, h, p);
      z += c.f[k.ime] * k.A * Math.cos((V + c.u[k.ime] - k.G) * D2R);
    }
    return z;
  }

  /**
   * Visoke i niske vode između dva trenutka. Uzorak svakih 6 min,
   * ekstrem parabolom kroz tri točke. Sitni "valovi" (par uzastopnih
   * ekstrema koji se razlikuju manje od PRAG_CM) se izbacuju — slike
   * ih također ne označavaju.
   */
  const PRAG_CM = 0.001;  // samo numerički šum — slike označavaju i ekstreme od 0,01 cm (9. 2. 2026.)
  function ekstremi(odMs, doMs) {
    const korak = 6 * 60000;
    const n = Math.ceil((doMs - odMs) / korak);
    const v = new Float64Array(n + 1);
    for (let i = 0; i <= n; i++) v[i] = razina(odMs + i * korak);

    const out = [];
    for (let i = 1; i < n; i++) {
      const a = v[i - 1], b = v[i], c = v[i + 1];
      const vis = b > a && b >= c;
      const niz = b < a && b <= c;
      if (!vis && !niz) continue;
      const naz = a - 2 * b + c;
      const dx = naz ? 0.5 * (a - c) / naz : 0;
      out.push({ t: odMs + (i + dx) * korak, h: b - 0.25 * (a - c) * dx, visoka: vis });
    }

    for (;;) {
      let min = PRAG_CM, k = -1;
      for (let i = 0; i + 1 < out.length; i++) {
        const r = Math.abs(out[i].h - out[i + 1].h);
        if (r < min) { min = r; k = i; }
      }
      if (k < 0) break;
      out.splice(k, 2);
    }
    return out;
  }

  /**
   * Glavne mijene Mjeseca — Meeus, Astronomical Algorithms, pogl. 49,
   * glavni periodički članovi (bez planetarnih; greška par minuta).
   * Vraća [{ t: ms UTC, mijena: 0 mlađak | 1 prva četvrt | 2 uštap | 3 zadnja četvrt }].
   */
  function mijene(odMs, doMs) {
    const out = [];
    const god = 2000 + (odMs - Date.UTC(2000, 0, 1)) / (365.25 * DAN);
    const k0 = Math.floor((god - 2000) * 12.3685) - 1;
    for (let kk = k0; kk < k0 + 4; kk++) {
      for (let q = 0; q < 4; q++) {
        const t = trenutakMijene(kk + q / 4, q);
        if (t >= odMs && t < doMs) out.push({ t, mijena: q });
      }
    }
    return out.sort((a, b) => a.t - b.t);
  }

  function trenutakMijene(k, q) {
    const T = k / 1236.85;
    const sin = Math.sin;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T
            - 0.000000150 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M  = (2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T ** 3) * D2R;
    const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3
              - 0.000000058 * T ** 4) * D2R;
    const F  = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3
              + 0.000000011 * T ** 4) * D2R;
    const Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3) * D2R;

    let c;
    if (q === 0 || q === 2) {
      const a = q === 0
        ? [-0.40720, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208]
        : [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209];
      c = a[0] * sin(Mp) + a[1] * E * sin(M) + a[2] * sin(2 * Mp) + a[3] * sin(2 * F)
        + a[4] * E * sin(Mp - M) + a[5] * E * sin(Mp + M) + a[6] * E * E * sin(2 * M)
        - 0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M)
        - 0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F)
        - 0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(Om);
    } else {
      c = -0.62801 * sin(Mp) + 0.17172 * E * sin(M) - 0.01183 * E * sin(Mp + M)
        + 0.00862 * sin(2 * Mp) + 0.00804 * sin(2 * F) + 0.00454 * E * sin(Mp - M)
        + 0.00204 * E * E * sin(2 * M) - 0.00180 * sin(Mp - 2 * F) - 0.00070 * sin(Mp + 2 * F)
        - 0.00040 * sin(3 * Mp) - 0.00034 * E * sin(2 * Mp - M) + 0.00032 * E * sin(M + 2 * F)
        + 0.00032 * E * sin(M - 2 * F) - 0.00028 * E * E * sin(Mp + 2 * M)
        + 0.00027 * E * sin(2 * Mp + M) - 0.00017 * sin(Om);
      const W = 0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp)
              - 0.00002 * Math.cos(Mp - M) + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F);
      c += q === 1 ? W : -W;
    }
    jde += c;
    return J2000 + (jde - 2451545.0) * DAN - 69000;   // TT -> UT (ΔT ≈ 69 s)
  }

  /* -----------------------------------------------------------------
   *  Vrijeme u Puli
   * ----------------------------------------------------------------- */

  let fmtZone = null;
  try {
    fmtZone = new Intl.DateTimeFormat('en-GB', {
      timeZone: VREMENSKA_ZONA, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  } catch (_) { /* stari preglednik: ostaje UTC+1 */ }

  const pomakCache = new Map();
  /** Minute ispred UTC u trenutku ms (60 ili 120). */
  function pomakMin(ms) {
    if (SOLARNO_VRIJEME || !fmtZone || new Date(ms + SAT).getUTCFullYear() >= SOLARNO_OD) return 60;
    const k = Math.floor(ms / SAT);
    let o = pomakCache.get(k);
    if (o === undefined) {
      const p = {};
      fmtZone.formatToParts(new Date(k * SAT)).forEach(x => { p[x.type] = x.value; });
      const kao = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
      o = Math.round((kao - k * SAT) / 60000);
      if (pomakCache.size > 5000) pomakCache.clear();
      pomakCache.set(k, o);
    }
    return o;
  }

  /** UTC trenutak lokalne ponoći (Date.UTC sam prenosi dan preko kraja mjeseca). */
  function lokalnaPonoc(god, mj, dan) {
    const kao = Date.UTC(god, mj - 1, dan);
    let t = kao - pomakMin(kao) * 60000;
    const o2 = pomakMin(t);
    if (kao - o2 * 60000 !== t) t = kao - o2 * 60000;
    return t;
  }

  /** Lokalni kalendarski podaci trenutka ms. */
  function lokalno(ms) {
    const d = new Date(ms + pomakMin(ms) * 60000);
    return { god: d.getUTCFullYear(), mj: d.getUTCMonth() + 1, dan: d.getUTCDate(),
             sat: d.getUTCHours(), min: d.getUTCMinutes() };
  }

  /** "HH:MM" zaokruženo na 10 min, kao na slikama. */
  function oznakaVremena(ms) {
    const l = lokalno(Math.round(ms / 600000) * 600000);
    return `${String(l.sat).padStart(2, '0')}:${String(l.min).padStart(2, '0')}`;
  }

  /* -----------------------------------------------------------------
   *  Tekstovi (hr / en / it)
   * ----------------------------------------------------------------- */

  const jezik = () => (typeof getCurrentLang === 'function' ? getCurrentLang() : 'hr');

  const TXT = {
    hr: {
      naslov: 'PLIME I OSEKE ZA', tocka: '.',
      mjeseci: ['SIJEČANJ', 'VELJAČU', 'OŽUJAK', 'TRAVANJ', 'SVIBANJ', 'LIPANJ',
                'SRPANJ', 'KOLOVOZ', 'RUJAN', 'LISTOPAD', 'STUDENI', 'PROSINAC'],
      red2: 'PREDVIĐENA KRETANJA MORSKIH MIJENA', red3: 'ZA LUKU PULA',
      dani: ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'],
      zona: { 60: 'srednjoeuropsko vrijeme (UTC+1)', 120: 'ljetno računanje vremena (UTC+2)',
              mix: 'lokalno vrijeme (UTC+1 / UTC+2)' },
      izracun: 'izračun',
      slika: 'Slika', izracunGumb: 'Izračun', prikaz: 'Prikaz plime',
      izracunOpis: 'Harmonijska prognoza za Pulu (Janeković i Kuzmić 2005), lokalno vrijeme. Nije za navigaciju.',
      nemaSlike: 'Slika nije dostupna za odabrani mjesec',
      alt: 'Izračunati grafikon plime i oseke za Pulu'
    },
    en: {
      naslov: 'TIDES FOR', tocka: '',
      mjeseci: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
      red2: 'PREDICTED SEA LEVEL', red3: 'PORT OF PULA',
      dani: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      zona: { 60: 'Central European Time (UTC+1)', 120: 'Central European Summer Time (UTC+2)',
              mix: 'local time (UTC+1 / UTC+2)' },
      izracun: 'computed',
      slika: 'Image', izracunGumb: 'Computed', prikaz: 'Tide view',
      izracunOpis: 'Harmonic prediction for Pula (Janeković & Kuzmić 2005), local time. Not for navigation.',
      nemaSlike: 'Image not available for selected month',
      alt: 'Computed tide chart for Pula'
    },
    it: {
      naslov: 'MAREE PER', tocka: '',
      mjeseci: ['GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO',
                'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'],
      red2: 'PREVISIONE DEL LIVELLO DEL MARE', red3: 'PORTO DI POLA',
      dani: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
      zona: { 60: 'ora solare (UTC+1)', 120: 'ora legale (UTC+2)', mix: 'ora locale (UTC+1 / UTC+2)' },
      izracun: 'calcolato',
      slika: 'Immagine', izracunGumb: 'Calcolato', prikaz: 'Vista maree',
      izracunOpis: 'Previsione armonica per Pola (Janeković e Kuzmić 2005), ora locale. Non per la navigazione.',
      nemaSlike: 'Immagine non disponibile per il mese selezionato',
      alt: 'Grafico calcolato delle maree per Pola'
    }
  };
  const tx = () => TXT[jezik()] || TXT.hr;

  /* -----------------------------------------------------------------
   *  Crtanje — mjere i boje preuzete sa slika adip_2026-*.jpg (800 × 566)
   * ----------------------------------------------------------------- */

  const M = {
    W: 800, H: 566,
    X0: 33.5, X1: 785.5,          // lijevi i desni rub okvira
    VRH: 37.5, KORAK: 107.5,       // gornji rub prvog retka, razmak redaka
    VIS: 81                        // visina okvira = 120 cm
  };
  M.DAN = (M.X1 - M.X0) / 7;
  const CM_PX = (M.VIS / 2) / 60;

  // Boje iz palete stranice (css/modern.css), na "papiru" kao na slikama
  const BOJA = {
    papir: '#ffffff',                        // --text-primary
    tinta: '#0a0a0f',                        // --bg-primary
    brojDana: 'rgba(138, 138, 160, 0.57)',   // --text-muted, na bijelom ≈ sivo-lila sa slika
    nedjelja: '#e74c3c',                     // .btn--danger
    mjesec: '#fbbf24',                       // --warning
    biljeska: '#8a8aa0'                      // --text-muted
  };

  const FONT = 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", sans-serif';

  /** Tekst stisnut vodoravno (slike koriste uski font); vraća širinu. */
  function uskiTekst(ctx, txt, x, y, sx, maxW) {
    const w = ctx.measureText(txt).width;
    const k = maxW ? Math.min(sx, maxW / w) : sx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, 1);
    ctx.fillText(txt, 0, 0);
    ctx.restore();
    return w * k;
  }

  /** Raspored oznaka u jednom retku: što bliže vremenu, bez preklapanja. */
  function rasporedi(oznake, lijevo, desno) {
    oznake.sort((a, b) => a.x - b.x);
    const RAZMAK = 2;
    for (let i = 0; i < oznake.length; i++) {
      const o = oznake[i];
      o.x = Math.max(o.x, lijevo + o.w / 2);
      if (i > 0) {
        const p = oznake[i - 1];
        o.x = Math.max(o.x, p.x + (p.w + o.w) / 2 + RAZMAK);
      }
    }
    for (let i = oznake.length - 1; i >= 0; i--) {
      const o = oznake[i];
      o.x = Math.min(o.x, desno - o.w / 2);
      if (i < oznake.length - 1) {
        const n = oznake[i + 1];
        o.x = Math.min(o.x, n.x - (n.w + o.w) / 2 - RAZMAK);
      }
    }
    return oznake;
  }

  function nacrtajMjesec(ctx, ikonaMjesta) {
    ctx.beginPath();
    ctx.arc(ikonaMjesta.x, ikonaMjesta.y, 13.3, 0, 2 * Math.PI);
    ctx.fillStyle = BOJA.tinta;
    ctx.fill();
    const q = ikonaMjesta.mijena;
    if (q !== 0) {
      ctx.beginPath();
      if (q === 2) {
        ctx.arc(ikonaMjesta.x, ikonaMjesta.y, 12.6, 0, 2 * Math.PI);
      } else {
        // prva četvrt: svijetla desna polovica; zadnja: lijeva (sjeverna polutka)
        const pocetak = q === 1 ? -Math.PI / 2 : Math.PI / 2;
        ctx.arc(ikonaMjesta.x, ikonaMjesta.y, 12.6, pocetak, pocetak + Math.PI);
        ctx.closePath();
      }
      ctx.fillStyle = BOJA.mjesec;
      ctx.fill();
    }
  }

  // slika zgrade Zvjezdarnice za prazne ćelije na kraju mjeseca (kao na slikama)
  let zgrada = null;
  function slikaZgrade(gotovo) {
    if (!zgrada) {
      zgrada = new Image();
      const prefiks = /\/(en|it)\//.test(window.location.pathname) ? '../' : '';
      zgrada.src = prefiks + 'povijest-zvjezdarnice/img/zgrada-1871.jpg';
    }
    if (zgrada.complete && zgrada.naturalWidth) return zgrada;
    zgrada.addEventListener('load', gotovo, { once: true });
    return null;
  }

  /**
   * Nacrta mjesec na canvas (800 × 566 logičkih piksela, oštro na retini).
   * mjesec: 1–12.
   */
  function nacrtaj(canvas, godina, mjesec) {
    const T = tx();
    const omjer = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(M.W * omjer);
    canvas.height = Math.round(M.H * omjer);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(omjer, 0, 0, omjer, 0, 0);

    const brDana = new Date(Date.UTC(godina, mjesec, 0)).getUTCDate();
    const prviDan = new Date(Date.UTC(godina, mjesec - 1, 1)).getUTCDay();   // 0 = nedjelja
    const POMAK = 2;   // prva dva polja prvog retka zauzima naslov
    const polje = d => d - 1 + POMAK;
    const xStupca = c => M.X0 + c * M.DAN;
    const vrhRetka = r => M.VRH + r * M.KORAK;

    // granice dana u stvarnom vremenu (dan s promjenom sata ima 23 ili 25 h)
    const ponoc = [];
    for (let d = 1; d <= brDana + 1; d++) ponoc[d] = lokalnaPonoc(godina, mjesec, d);
    const xVremena = (d, t) => {
      const p = polje(d);
      return xStupca(p % 7) + M.DAN * (t - ponoc[d]) / (ponoc[d + 1] - ponoc[d]);
    };

    ctx.fillStyle = BOJA.papir;
    ctx.fillRect(0, 0, M.W, M.H);
    ctx.textBaseline = 'alphabetic';

    // --- dani u tjednu ---
    ctx.font = `bold 19.5px ${FONT}`;
    ctx.textAlign = 'left';
    for (let c = 0; c < 7; c++) {
      const dt = ostatak(prviDan - POMAK + c, 7);
      const w = Math.min(ctx.measureText(T.dani[dt]).width * 0.9, M.DAN - 4);
      ctx.fillStyle = dt === 0 ? BOJA.nedjelja : BOJA.tinta;
      uskiTekst(ctx, T.dani[dt], xStupca(c) + (M.DAN - w) / 2, 19, 0.9, M.DAN - 4);
    }

    // --- ekstremi i mijene za cijeli mjesec ---
    const ex = ekstremi(ponoc[1] - 3 * SAT, ponoc[brDana + 1] + 3 * SAT);
    const mij = mijene(ponoc[1], ponoc[brDana + 1]);
    const zone = new Set();
    for (let d = 1; d <= brDana; d++) zone.add(pomakMin(ponoc[d] + 12 * SAT));

    const zadnjiRed = Math.floor(polje(brDana) / 7);
    const oznakeGore = [], oznakeDolje = [];
    for (let r = 0; r <= zadnjiRed; r++) { oznakeGore[r] = []; oznakeDolje[r] = []; }

    ctx.font = `14px ${FONT}`;
    const SX_VRIJEME = 0.8;
    for (const e of ex) {
      if (e.t < ponoc[1] || e.t >= ponoc[brDana + 1]) continue;
      const l = lokalno(e.t);
      const d = l.dan;
      const txt = oznakaVremena(e.t);
      const r = Math.floor(polje(d) / 7);
      (e.visoka ? oznakeGore : oznakeDolje)[r].push({
        x: xVremena(d, e.t), w: ctx.measureText(txt).width * SX_VRIJEME, txt
      });
    }

    for (let r = 0; r <= zadnjiRed; r++) {
      const vrh = vrhRetka(r), dno = vrh + M.VIS, nula = vrh + M.VIS / 2;
      const prviStupac = r === 0 ? POMAK : 0;
      const zadnjiStupac = r === zadnjiRed ? polje(brDana) % 7 : 6;
      const xa = xStupca(prviStupac), xb = xStupca(zadnjiStupac + 1);

      // os y
      ctx.fillStyle = BOJA.tinta;
      ctx.font = `14.5px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('+60', 29.5, vrh + 8);
      ctx.fillText('0', 29.5, nula + 1.5);
      ctx.fillText('-60', 29.5, dno - 3.5);
      ctx.textBaseline = 'alphabetic';

      // mreža: pola dana po ćeliji, nulta linija
      ctx.strokeStyle = BOJA.tinta;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let k = prviStupac * 2 + 1; k < (zadnjiStupac + 1) * 2; k++) {
        const x = M.X0 + k * M.DAN / 2;
        ctx.moveTo(x, vrh); ctx.lineTo(x, dno);
      }
      ctx.moveTo(xa, nula); ctx.lineTo(xb, nula);
      ctx.stroke();

      // brojevi dana (ispod krivulje)
      ctx.font = `bold 27px ${FONT}`;
      ctx.textAlign = 'center';
      for (let c = prviStupac; c <= zadnjiStupac; c++) {
        const d = r * 7 + c - POMAK + 1;
        const x = xStupca(c) + M.DAN / 2, y = nula + 9.7;
        const nedjelja = ostatak(prviDan + d - 1, 7) === 0;
        if (nedjelja) {
          ctx.fillStyle = BOJA.papir;
          ctx.fillText(String(d), x, y);
          ctx.strokeStyle = BOJA.nedjelja;
          ctx.lineWidth = 1.4;
          ctx.lineJoin = 'round';
          ctx.strokeText(String(d), x, y);
        } else {
          ctx.fillStyle = BOJA.brojDana;
          ctx.fillText(String(d), x, y);
        }
      }

      // krivulja (kontinuirano kroz cijeli redak)
      ctx.save();
      ctx.beginPath();
      ctx.rect(xa, vrh, xb - xa, M.VIS);
      ctx.clip();
      ctx.beginPath();
      let prva = true;
      for (let c = prviStupac; c <= zadnjiStupac; c++) {
        const d = r * 7 + c - POMAK + 1;
        const t0 = ponoc[d], t1 = ponoc[d + 1];
        for (let px = 0; px <= M.DAN; px += 0.5) {
          const y = nula - razina(t0 + (t1 - t0) * px / M.DAN) * CM_PX;
          const x = xStupca(c) + px;
          if (prva) { ctx.moveTo(x, y); prva = false; } else ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = BOJA.tinta;
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      // mijene: na dan mijene, na ~19 h ćelije, iznad nulte linije (kao na slikama)
      for (const m of mij) {
        const d = lokalno(m.t).dan;
        if (Math.floor(polje(d) / 7) !== r) continue;
        nacrtajMjesec(ctx, { x: xStupca(polje(d) % 7) + 0.8 * M.DAN, y: vrh + M.VIS / 4, mijena: m.mijena });
      }

      // okvir
      ctx.strokeStyle = BOJA.tinta;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(xa, vrh, xb - xa, M.VIS);

      // oznake vremena: visoke vode iznad, niske ispod
      ctx.fillStyle = BOJA.tinta;
      ctx.font = `14px ${FONT}`;
      ctx.textAlign = 'left';
      for (const [lista, y] of [[oznakeGore[r], vrh - 3], [oznakeDolje[r], dno + 12.5]]) {
        for (const o of rasporedi(lista, M.X0 - 2, M.W - 3)) {
          uskiTekst(ctx, o.txt, o.x - o.w / 2, y, SX_VRIJEME);
        }
      }
    }

    // --- naslov u prva dva polja ---
    {
      const vrh = vrhRetka(0);
      const x0 = M.X0, x1 = xStupca(POMAK), sred = (x0 + x1) / 2, maxW = x1 - x0 - 14;
      ctx.strokeStyle = BOJA.tinta;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x0, vrh, x1 - x0, M.VIS);
      ctx.fillStyle = BOJA.tinta;
      ctx.textAlign = 'left';
      const centar = (txt, y, font, sx) => {
        ctx.font = font;
        const w = Math.min(ctx.measureText(txt).width * sx, maxW);
        uskiTekst(ctx, txt, sred - w / 2, y, sx, maxW);
      };
      centar(`${T.naslov} ${T.mjeseci[mjesec - 1]} ${godina}${T.tocka}`, vrh + 34.5, `bold 17px ${FONT}`, 0.74);
      centar(T.red2, vrh + 49.5, `bold 12.5px ${FONT}`, 0.74);
      centar(T.red3, vrh + 64.5, `bold 12.5px ${FONT}`, 0.74);
      const zona = zone.size > 1 ? T.zona.mix : T.zona[[...zone][0]] || T.zona.mix;
      ctx.font = `8.5px ${FONT}`;
      ctx.fillStyle = BOJA.biljeska;
      const biljeska = `${T.izracun} · ${zona}`;
      const w = Math.min(ctx.measureText(biljeska).width * 0.9, maxW);
      uskiTekst(ctx, biljeska, x1 - 7 - w, vrh + 75.5, 0.9, maxW);
    }

    // --- prazna polja na kraju: zgrada Zvjezdarnice ---
    const kraj = polje(brDana) % 7;
    if (kraj < 6) {
      const vrh = vrhRetka(zadnjiRed);
      const x0 = xStupca(kraj + 1), x1 = M.X1;
      ctx.strokeStyle = BOJA.tinta;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x0, vrh, x1 - x0, M.VIS);
      const smjesti = (img) => {
        // samo zgrada, bez neba (izvorna fotografija je 700 × 347)
        const sk = img.naturalWidth / 700;
        const izv = [15 * sk, 165 * sk, 680 * sk, 125 * sk];
        const pad = 6, bw = x1 - x0 - 2 * pad, bh = M.VIS - 2 * pad;
        const k = Math.min(bw / izv[2], bh / izv[3]);
        const w = izv[2] * k, h = izv[3] * k;
        ctx.save();
        ctx.setTransform(omjer, 0, 0, omjer, 0, 0);
        ctx.filter = 'grayscale(1) contrast(1.6) brightness(1.12)';
        ctx.drawImage(img, ...izv, x0 + (x1 - x0 - w) / 2, vrh + (M.VIS - h) / 2, w, h);
        ctx.restore();
      };
      const kljuc = `${godina}-${mjesec}`;
      canvas.dataset.plima = kljuc;
      const img = slikaZgrade(() => { if (canvas.dataset.plima === kljuc) smjesti(zgrada); });
      if (img) smjesti(img);
    }

    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${T.alt}, ${String(mjesec).padStart(2, '0')}/${godina}`);
    return { ekstremi: ex, mijene: mij };
  }

  /* -----------------------------------------------------------------
   *  Modal: izbornik "Slika / Izračun"
   *
   *  Zadano je slika ako postoji za odabrani mjesec, inače izračun.
   *  Izbor posjetitelja pamti se u localStorage (ako je dostupan).
   * ----------------------------------------------------------------- */

  const KLJUC_IZBORA = 'adip_plima_prikaz';

  // izbor vrijedi i bez localStorage (privatni način, blokirani kolačići) — do reloada
  let izbor;
  function procitajIzbor() {
    if (izbor === undefined) {
      try { izbor = window.localStorage.getItem(KLJUC_IZBORA); } catch (_) { izbor = null; }
    }
    return izbor;
  }
  function spremiIzbor(v) {
    izbor = v;
    try { window.localStorage.setItem(KLJUC_IZBORA, v); } catch (_) { /* privatni način i sl. */ }
  }

  let zahtjev = 0;
  let ui = null;

  /** Ugradi izbornik i canvas u modal (jednom po otvaranju modala). */
  function sucelje() {
    const img = document.getElementById('tide-image');
    if (!img) return null;
    if (ui && ui.img === img && document.body.contains(ui.platno)) return ui;

    const T = tx();
    const red = document.getElementById('tide-month-select')?.parentElement;
    const grupa = document.createElement('div');
    grupa.className = 'plima-mod';
    grupa.setAttribute('role', 'group');
    grupa.setAttribute('aria-label', T.prikaz);
    const gumb = (txt, vrijednost) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = txt;
      b.dataset.prikaz = vrijednost;
      b.addEventListener('click', () => {
        if (b.disabled) return;
        spremiIzbor(vrijednost);
        osvjezi();
      });
      grupa.appendChild(b);
      return b;
    };
    const gumbSlika = gumb(T.slika, 'slika');
    const gumbIzracun = gumb(T.izracunGumb, 'izracun');
    gumbIzracun.title = T.izracunOpis;
    if (red) red.appendChild(grupa);

    const platno = document.createElement('canvas');
    platno.className = 'plima-platno';
    platno.hidden = true;
    img.insertAdjacentElement('afterend', platno);

    ui = { img, greska: document.getElementById('tide-error'), gumbSlika, gumbIzracun, platno,
           stanje: null, nacrtano: null };
    return ui;
  }

  function osvjezi() {
    if (!ui || !ui.stanje) return;
    const { godina, mjesec, imaSlike } = ui.stanje;
    const izbor = procitajIzbor();
    let nacin = null;                              // null = još se provjerava ima li slike
    if (izbor === 'izracun' || imaSlike === false) nacin = 'izracun';
    else if (imaSlike) nacin = 'slika';

    ui.gumbSlika.disabled = imaSlike === false;
    ui.gumbSlika.title = imaSlike === false ? tx().nemaSlike : '';
    ui.gumbSlika.setAttribute('aria-pressed', String(nacin === 'slika'));
    ui.gumbIzracun.setAttribute('aria-pressed', String(nacin === 'izracun'));

    ui.img.style.display = nacin === 'slika' ? 'block' : 'none';
    if (ui.greska) ui.greska.style.display = 'none';
    ui.platno.hidden = nacin !== 'izracun';

    const kljuc = `${godina}-${mjesec}`;
    if (nacin === 'izracun' && ui.nacrtano !== kljuc) {
      try {
        nacrtaj(ui.platno, godina, mjesec);
        ui.nacrtano = kljuc;
      } catch (err) {
        console.error('[ADIP] Izračun plime nije uspio:', err);
        ui.platno.hidden = true;
        if (ui.greska) ui.greska.style.display = 'block';
      }
    }
  }

  /** Redom probaj URL-ove; cb(url) s prvim koji postoji ili cb(null). */
  function provjeriSliku(urls, cb) {
    let i = 0;
    const sljedeci = () => {
      if (i >= urls.length) return cb(null);
      const url = urls[i++];
      const probna = new Image();
      probna.onload = () => cb(url);
      probna.onerror = sljedeci;
      probna.src = url;
    };
    sljedeci();
  }

  /**
   * Prikaži plimu za mjesec u otvorenom modalu (zove services.js).
   * urls: kandidati za gotovu sliku, redom.
   */
  function prikazi(godina, mjesec, urls) {
    const u = sucelje();
    if (!u) return;
    const moj = ++zahtjev;
    u.stanje = { godina, mjesec, imaSlike: null };
    osvjezi();
    provjeriSliku(urls || [], (url) => {
      if (moj !== zahtjev || !ui || !ui.stanje) return;
      ui.stanje.imaSlike = !!url;
      if (url && ui.img.getAttribute('src') !== url) ui.img.src = url;
      osvjezi();
    });
  }

  window.PlimaIzracun = { razina, ekstremi, mijene, nacrtaj, prikazi, KONSTANTE };
})();
