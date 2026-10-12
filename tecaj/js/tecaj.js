/* =========================================================
   Tečaj astronomije — zajednički sloj
   Astronomsko društvo "Istra" Pula

   Ovdje je JEDNO mjesto za:
     1) popis i opise svih 16 lekcija  (TECAJ.LEKCIJE)
     2) izbornik i podnožje koji se ubacuju u svaku stranicu
     3) pomoćne funkcije za interaktivne module

   DODAVANJE LEKCIJE 13-16: uredite unos u TECAJ.LEKCIJE ispod
   (naslov, podnaslov, opis, teme, pdf) i postavite status: 'objavljeno'.
   ========================================================= */

(function () {
  'use strict';

  var TECAJ = window.TECAJ = {};

  /* Relativni put do korijena glavne stranice.
     Tečaj živi u podmapi (npr. /tecaj/), pa je to '../'.
     Ako mapu preimenujete, ovo ne treba mijenjati. */
  TECAJ.ROOT = '../';

  /* ---------------------------------------------------------
     1. PODACI O LEKCIJAMA
     --------------------------------------------------------- */

  TECAJ.LEKCIJE = [
    {
      n: 1,
      slug: 'lekcija-01.html',
      pdf: 'pdf/01-nebeska-sfera-astrognozija.pdf',
      naslov: 'Nebeska sfera i astrognozija',
      podnaslov: 'Model neba, prividna gibanja i prepoznavanje zviježđa',
      opis: 'Nebo kao kugla proizvoljnog polumjera: položaj je par kutova, a udaljenosti mjerimo u stupnjevima. Prividna dnevna vrtnja, cirkumpolarna kapica, zviježđa četiriju godišnjih doba i kako golim okom razlikovati planet od zvijezde.',
      teme: ['Nebeska sfera', 'Cirkumpolarna zviježđa', 'Zviježđa godišnjih doba', 'Opažanje planeta'],
      status: 'objavljeno'
    },
    {
      n: 2,
      slug: 'lekcija-02.html',
      pdf: 'pdf/02-koordinatni-sustavi-vrijeme.pdf',
      naslov: 'Koordinatni sustavi, gibanje Zemlje i vrijeme',
      podnaslov: 'Od azimuta i visine do zvjezdanog i pojasnog vremena',
      opis: 'Horizontski i ekvatorski sustav te prijelaz među njima, kulminacija i uvjeti izlaska i zalaska. Rotacija i revolucija Zemlje kao izvor svih naših mjera vremena — od pravog Sunca preko analeme do UTC-a.',
      teme: ['Horizontski sustav', 'Ekvatorski sustavi', 'Gibanje Zemlje', 'Mjerenje vremena', 'Precesija'],
      status: 'objavljeno'
    },
    {
      n: 3,
      slug: 'lekcija-03.html',
      pdf: 'pdf/03-udaljenosti-zvjezdane-velicine.pdf',
      naslov: 'Udaljenosti i zvjezdane veličine',
      podnaslov: 'Astronomska jedinica, parsek, paralaksa i Pogsonova relacija',
      opis: 'Temelj svega što slijedi: bez udaljenosti nema luminoziteta, mase ni dobi svemira. Jedinice razmjera, mjerenje brzine svjetlosti, trigonometrijska paralaksa do misije Gaia i logaritamska ljestvica magnituda.',
      teme: ['AJ, ly, pc', 'Brzina svjetlosti', 'Paralaksa', 'Magnitude'],
      status: 'objavljeno'
    },
    {
      n: 4,
      slug: 'lekcija-04.html',
      pdf: 'pdf/04-nebeska-mehanika.pdf',
      naslov: 'Nebeska mehanika',
      podnaslov: 'Keplerovi zakoni, gravitacija i kozmičke brzine',
      opis: 'Jedini alat kojim u svemiru mjerimo mase — od asteroida do jata galaksija. Geometrija elipse, tri Keplerova zakona, Newtonova generalizacija, energija na stazi i vis-viva jednadžba.',
      teme: ['Keplerovi zakoni', 'Gravitacija', 'Vis-viva', 'Kozmičke brzine', 'Hohmannov transfer'],
      status: 'objavljeno'
    },
    {
      n: 5,
      slug: 'lekcija-05.html',
      pdf: 'pdf/05-em-zracenje-crno-tijelo.pdf',
      naslov: 'Elektromagnetsko zračenje i crno tijelo',
      podnaslov: 'Planck, Wien, Stefan-Boltzmann, Kirchhoff i Doppler',
      opis: 'Sve što znamo o zvijezdama — osim masa — doznali smo iz njihove svjetlosti. Spektar od radiovalova do gama-zraka, prozori atmosfere, temperatura iz boje, luminozitet iz temperature i radijalna brzina iz pomaka linije.',
      teme: ['EM spektar', 'Planckova krivulja', 'Wienov zakon', 'Spektralne linije', 'Dopplerov efekt'],
      status: 'objavljeno'
    },
    {
      n: 6,
      slug: 'lekcija-06.html',
      pdf: 'pdf/06-teleskopi.pdf',
      naslov: 'Teleskopi i opažački instrumenti',
      podnaslov: 'Promjer, razlučivanje, montaže, detektori i interferometrija',
      opis: 'Teleskop se ne kupuje po povećanju nego po promjeru. Tri zadaće instrumenta, moć razlučivanja i izlazna zjenica, tipovi i aberacije, seeing i njegovo svladavanje, od oka do CCD-a te zašto opažamo iz svemira.',
      teme: ['Moć razlučivanja', 'Refraktor i reflektor', 'Montaže', 'Detektori i filtri', 'Radioteleskopi'],
      status: 'objavljeno'
    },
    {
      n: 7,
      slug: 'lekcija-07.html',
      pdf: 'pdf/07-suncev-sustav-planeti.pdf',
      naslov: 'Sunčev sustav: planeti',
      podnaslov: 'Nastanak, linija leda, terestrički i divovski planeti',
      opis: 'Sunčev sustav nije zbirka nepovezanih tijela nego ostatak jednog procesa — i sve se razlike mogu iz njega izvesti. Protoplanetarni disk i linija leda, dvije skupine planeta, atmosfere, prstenovi i najzanimljiviji sateliti.',
      teme: ['Protoplanetarni disk', 'Linija leda', 'Terestrički planeti', 'Divovi', 'Sateliti'],
      status: 'objavljeno'
    },
    {
      n: 8,
      slug: 'lekcija-08.html',
      pdf: 'pdf/08-suncev-sustav-mala-tijela.pdf',
      naslov: 'Sunčev sustav: mala tijela',
      podnaslov: 'Asteroidi, rezonancije, kometi, meteori i meteoriti',
      opis: 'Mala tijela su ostatci gradnje — najbolje sačuvani uzorci materijala od kojeg su nastali planeti. Glavni pojas i Kirkwoodove pukotine, objekti blizu Zemlje i planetarna obrana, građa i obitelji kometa, rojevi i njihovi roditelji.',
      teme: ['Glavni pojas', 'Rezonancije', 'NEO', 'Kometi', 'Meteorski rojevi'],
      status: 'objavljeno'
    },
    {
      n: 9,
      slug: 'lekcija-09.html',
      pdf: 'pdf/09-sunce-izvori-energije.pdf',
      naslov: 'Sunce i izvori zvjezdane energije',
      podnaslov: 'Defekt mase, p-p lanac, građa i aktivnost',
      opis: 'Sunce je jedina zvijezda koju vidimo kao plohu, a ne kao točku. Zašto kemijski i gravitacijski izvori ne mogu objasniti njegovu dob, kako radi proton-protonski lanac, kako je Sunce građeno i kako njegova aktivnost dolazi do nas.',
      teme: ['Defekt mase', 'p-p lanac i CNO', 'Slojevi Sunca', 'Pjege i ciklus', 'Sunčev vjetar'],
      status: 'objavljeno'
    },
    {
      n: 10,
      slug: 'lekcija-10.html',
      pdf: 'pdf/10-fotometrija-hr-dijagram.pdf',
      naslov: 'Fotometrija, spektroskopija i HR-dijagram',
      podnaslov: 'Najvažniji jedan crtež u astrofizici',
      opis: 'Apsolutna magnituda i modul udaljenosti, indeks boje i spektralne klase O B A F G K M, čitanje položaja zvijezde u HR-dijagramu i izvođenje polumjera. Odnos mase i sjaja te procjena vijeka na glavnom nizu.',
      teme: ['Modul udaljenosti', 'Indeks boje', 'Spektralne klase', 'HR-dijagram', 'Masa i vijek'],
      status: 'objavljeno'
    },
    {
      n: 11,
      slug: 'lekcija-11.html',
      pdf: 'pdf/11-dvojne-zvijezde-evolucija.pdf',
      naslov: 'Dvojne i promjenjive zvijezde, evolucija',
      podnaslov: 'Mjerenje masa, kefeide i put od oblaka do bijelog patuljka',
      opis: 'Dvojne zvijezde su jedini izravan način mjerenja mase zvijezde — a masa određuje sve ostalo. Vizualno, spektroskopski i pomrčinski dvojne, krivulje sjaja i radijalnih brzina, kefeide kao mjerne šipke i evolucijski putovi.',
      teme: ['Dvojne zvijezde', 'Krivulja sjaja', 'Kefeide', 'Evolucija', 'Supernove'],
      status: 'objavljeno'
    },
    {
      n: 12,
      slug: 'lekcija-12.html',
      pdf: 'pdf/12-galaksije-kozmologija.pdf',
      naslov: 'Skupovi, galaksije i kozmologija',
      podnaslov: 'Od točke skretanja do dobi svemira',
      opis: 'Sve dosad naučeno slaže se u jednu ljestvicu koja seže do ruba vidljivog svemira. Otvoreni i kuglasti skupovi, Mliječna staza i tamna tvar, Hubbleova klasifikacija, Hubbleov zakon te kronologija i sudbina svemira.',
      teme: ['Zvjezdani skupovi', 'Mliječna staza', 'Tamna tvar', 'Hubbleov zakon', 'Veliki prasak'],
      status: 'objavljeno'
    },

    {
      n: 13,
      slug: 'lekcija-13.html',
      pdf: 'pdf/13-sferna-astronomija.pdf',
      naslov: 'Sferna astronomija i računske tehnike',
      podnaslov: 'Alat, a ne nove pojave: trokut, refrakcija, sumraci, pomrčine',
      opis: 'Nakon ovog predavanja zadatci se rješavaju brže i sigurnije. Tri poučka sferne trigonometrije i kada koji uzeti, izlazak i zalazak s refrakcijom, trajanje sumraka, uvjeti za pomrčinu i Saros, julijanski datum kao algoritam te procjena reda veličine i propagacija pogrešaka.',
      teme: ['Sferni trokut', 'Refrakcija i sumraci', 'Pomrčine i Saros', 'Julijanski datum', 'Pogreške'],
      status: 'objavljeno'
    },
    {
      n: 14,
      slug: 'lekcija-14.html',
      pdf: 'pdf/14-egzoplaneti-astrobiologija.pdf',
      naslov: 'Egzoplaneti i astrobiologija',
      podnaslov: 'Od nula poznatih planeta 1995. do gotovo šest tisuća danas',
      opis: 'Pet načina da se vidi nevidljivo i pristranost svakog od njih. Dubina tranzita daje polumjer, radijalne brzine masu, a zajedno gustoću i sastav. Nastanjiva zona, crveni patuljci kao prilika i problem, spektroskopija atmosfera te Drakeova jednadžba i Fermijev paradoks.',
      teme: ['Tranzitna metoda', 'Radijalne brzine', 'Masa i polumjer', 'Nastanjiva zona', 'Drakeova jednadžba'],
      status: 'objavljeno'
    },
    {
      n: 15,
      slug: 'lekcija-15.html',
      pdf: 'pdf/15-relativisticka-astrofizika.pdf',
      naslov: 'Relativistička i visokoenergetska astrofizika',
      podnaslov: 'Crne rupe, akrecija, pulsari i gravitacijski valovi',
      opis: 'Ovdje dobivaju pozadinu pojmovi koje smo dosad koristili bez objašnjenja. Načelo ekvivalencije i klasične provjere opće teorije relativnosti, gravitacijsko lećenje, anatomija crne rupe i njezina sjena, akrecija kao najučinkovitiji izvor energije te astronomija s više glasnika.',
      teme: ['Opća relativnost', 'Gravitacijsko lećenje', 'Crne rupe', 'Akrecija', 'Gravitacijski valovi'],
      status: 'objavljeno'
    },
    {
      n: 16,
      slug: 'lekcija-16.html',
      pdf: 'pdf/16-praktikum.pdf',
      naslov: 'Praktikum: opažanje, mjerenje i obrada',
      podnaslov: 'Kako se do svega prethodnog zapravo dolazi — i kako to možete sami',
      opis: 'Dosad smo učili što znamo o svemiru; ovo je predavanje o tome kako se do toga dolazi. Planiranje opažanja iz efemerida, omjer signala i šuma, kalibracijski snimci bias-dark-flat, slaganje, aperturna i diferencijalna fotometrija, astrometrija te vođenje dnevnika i pisanje izvještaja.',
      teme: ['Planiranje', 'SNR i ekspozicija', 'Kalibracija', 'Diferencijalna fotometrija', 'Astrometrija'],
      status: 'objavljeno'
    }
  ];

  TECAJ.get = function (n) {
    for (var i = 0; i < TECAJ.LEKCIJE.length; i++) {
      if (TECAJ.LEKCIJE[i].n === n) return TECAJ.LEKCIJE[i];
    }
    return null;
  };

  /* ---------------------------------------------------------
     2. IZBORNIK, ZAGLAVLJE I PODNOŽJE
     --------------------------------------------------------- */

  /* Izbornik glavne stranice — ako se on promijeni, promijenite i ovdje. */
  var GLAVNI_IZBORNIK = [
    ['index.html', 'Naslovna'],
    ['aktivnosti.html', 'Aktivnosti'],
    ['galerija-slika.html', 'Galerija'],
    ['povijest-zvjezdarnice.html', 'Povijest'],
    ['posjet-pulskoj-zvjezdarnici.html', 'Posjeti'],
    ['radovi.html', 'Radovi'],
    ['servisi.html', 'Servisi'],
    ['downloads.html', 'Preuzimanja'],
    ['astronomsko-drustvo-istra-pula.html', 'O nama']
  ];

  function nizIzbornika() {
    var R = TECAJ.ROOT;
    var html = '';
    for (var i = 0; i < GLAVNI_IZBORNIK.length; i++) {
      html += '<a href="' + R + GLAVNI_IZBORNIK[i][0] + '" class="nav__link">' +
        GLAVNI_IZBORNIK[i][1] + '</a>';
      /* Tečaj stoji odmah ispod „Preuzimanja“ — isto mjesto kao u izborniku
         glavne stranice, jedna stavka, bez popisa lekcija. */
      if (GLAVNI_IZBORNIK[i][0] === 'downloads.html') {
        html += '<a href="index.html" class="nav__link active">Tečaj astronomije</a>';
      }
    }
    html += '<div class="nav__spacer"></div>';
    html += '<button class="btn btn--secondary nav__login" id="sidebar-login-btn">Prijava</button>';
    return html;
  }

  function zaglavlje(aktivnaLekcija) {
    var R = TECAJ.ROOT;
    var h = document.createElement('header');
    h.className = 'header';
    h.innerHTML =
      '<div class="menu-toggle" id="menu-toggle" role="button" tabindex="0" aria-label="Izbornik">' +
      '<span></span><span></span><span></span></div>' +

      '<a href="' + R + 'index.html" class="header__logo">' +
      '<img src="' + R + 'sites/all/themes/black_hole/logo.png" alt="ADIP logo" ' +
      'onerror="this.style.display=\'none\'">' +
      '<div><div class="header__title">Pulska Zvjezdarnica</div>' +
      '<div class="header__subtitle">Astronomsko društvo &quot;Istra&quot; Pula</div></div></a>' +

      '<nav class="nav" id="main-nav">' +
      '<button class="nav__close" id="nav-close" aria-label="Zatvori izbornik">✕</button>' +
      nizIzbornika() +
      '</nav>' +
      '<div class="nav-overlay" id="nav-overlay"></div>' +

      '<a href="index.html" class="btn btn--secondary btn--small">Tečaj</a>';
    return h;
  }

  function podnozje() {
    var f = document.createElement('footer');
    f.className = 'footer';
    f.innerHTML =
      '<div class="footer__contact">' +
      '<strong>Astronomsko društvo &quot;Istra&quot; Pula</strong><br>' +
      '<a href="https://www.ztkpula.hr/hr/" target="_blank" rel="noopener" ' +
      'style="color:inherit;text-decoration:none;border-bottom:1px dotted rgba(255,255,255,.5)">' +
      'Zajednica tehničke kulture Pula</a><br>' +
      'Glavinićev uspon 1, 52100 Pula - HR<br>' +
      'Email: <a href="mailto:astroistra.pu@pu.t-com.hr">astroistra.pu@pu.t-com.hr</a> | Tel: 091/214-1966<br>' +
      '<span style="color:var(--text-muted)">Tečaj astronomije &middot; priprema za natjecanje &middot; ' +
      'dr. sc. Sandi Baressi Šegota</span>' +
      '</div>';
    return f;
  }

  /* Padajuci izbornici: svaki [data-dropdown] ima .dropdown__toggle
     i .dropdown__menu s .dropdown__item stavkama (npr. udzbenik po
     razredima na naslovnoj). Radi misem i tipkovnicom. */
  function oziviPadajuce() {
    var kutije = document.querySelectorAll('[data-dropdown]');
    if (!kutije.length) return;

    var otvoreni = null;

    function zatvori(vrati) {
      if (!otvoreni) return;
      var t = otvoreni.querySelector('.dropdown__toggle');
      otvoreni.classList.remove('otvoren');
      if (t) {
        t.setAttribute('aria-expanded', 'false');
        if (vrati) t.focus();
      }
      otvoreni = null;
    }

    function otvori(kutija) {
      if (otvoreni && otvoreni !== kutija) zatvori(false);
      kutija.classList.add('otvoren');
      var t = kutija.querySelector('.dropdown__toggle');
      if (t) t.setAttribute('aria-expanded', 'true');
      otvoreni = kutija;
    }

    function stavke(kutija) {
      return Array.prototype.slice.call(kutija.querySelectorAll('.dropdown__item'));
    }

    function fokusiraj(kutija, i) {
      var s = stavke(kutija);
      if (!s.length) return;
      if (i < 0) i = s.length - 1;
      if (i >= s.length) i = 0;
      s[i].focus();
    }

    Array.prototype.forEach.call(kutije, function (kutija) {
      var toggle = kutija.querySelector('.dropdown__toggle');
      if (!toggle) return;

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (kutija.classList.contains('otvoren')) zatvori(false);
        else otvori(kutija);
      });

      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();   /* inace bi isti pritisak obradio i izbornik ispod */
          otvori(kutija);
          fokusiraj(kutija, e.key === 'ArrowDown' ? 0 : -1);
        }
      });

      kutija.addEventListener('keydown', function (e) {
        var s = stavke(kutija);
        var i = s.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' && i >= 0) { e.preventDefault(); fokusiraj(kutija, i + 1); }
        else if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); fokusiraj(kutija, i - 1); }
        else if (e.key === 'Home' && i >= 0) { e.preventDefault(); fokusiraj(kutija, 0); }
        else if (e.key === 'End' && i >= 0) { e.preventDefault(); fokusiraj(kutija, -1); }
      });

      /* Klik na stavku pokrece preuzimanje i zatvara izbornik */
      stavke(kutija).forEach(function (a) {
        a.addEventListener('click', function () { zatvori(false); });
      });
    });

    document.addEventListener('click', function (e) {
      if (otvoreni && !otvoreni.contains(e.target)) zatvori(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') zatvori(true);
    });
  }

  function ozivi() {
    var toggle = document.getElementById('menu-toggle');
    var nav = document.getElementById('main-nav');
    var overlay = document.getElementById('nav-overlay');
    var close = document.getElementById('nav-close');
    if (!toggle || !nav) return;

    function otvori() {
      nav.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function zatvori() {
      nav.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    toggle.addEventListener('click', otvori);
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); otvori(); }
    });
    close.addEventListener('click', zatvori);
    overlay.addEventListener('click', zatvori);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') zatvori();
    });

    /* Aktivna lekcija u izborniku vidljiva bez skrolanja */
    var akt = nav.querySelector('.nav__link.active');
    if (akt && akt.offsetTop > 400) nav.scrollTop = akt.offsetTop - 200;
  }

  /* ---------------------------------------------------------
     3. PRISTUP: PIN, prijava urednika, vidljivost lekcija
     --------------------------------------------------------- */

  /* PIN za ulaz u tečaj. Ovo je mekana zaštita: sprječava slučajne
     posjetitelje, ali nije sigurnosna mjera — PDF-ovi su dostupni na
     svojim URL-ovima i svatko može pročitati ovu datoteku. */
  TECAJ.PIN = '1973';

  var KLJUC_ULAZ = 'tecaj_ulaz';        /* sessionStorage: traje dok je kartica otvorena */
  var KLJUC_VID = 'tecaj_vidljivost';   /* localStorage: uredničke izmjene, samo lokalno */
  var KLJUC_TOKEN = 'adip_token';       /* isti kljuc kao glavna stranica */

  /* sessionStorage ne radi na svim file:// postavkama — zato zamjena u memoriji */
  var memUlaz = false;
  function citaj(store, k) {
    try { return window[store].getItem(k); } catch (e) { return null; }
  }
  function pisi(store, k, v) {
    try { window[store].setItem(k, v); return true; } catch (e) { return false; }
  }

  TECAJ.jeUrednik = function () { return !!citaj('localStorage', KLJUC_TOKEN); };

  /* --- Razgovor sa serverom ---
     TECAJ.ROOT je '../', pa se '../api/...' s /tecaj/nesto.html razrješava
     u /api/..., bez obzira gdje je korijen stranice. */
  function apiPoziv(put, tijelo, cb) {
    var gotovo = false;
    var sat = setTimeout(function () { fin(false, null, 'server ne odgovara'); }, 8000);
    function fin(ok, podaci, greska) {
      if (gotovo) return;
      gotovo = true;
      clearTimeout(sat);
      cb(ok, podaci, greska);
    }
    if (typeof fetch !== 'function') return fin(false, null, 'preglednik ne podržava fetch');
    try {
      fetch(TECAJ.ROOT + 'api/' + put, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tijelo)
      }).then(function (r) {
        return r.text().then(function (txt) {
          var d = null;
          try { d = JSON.parse(txt); } catch (e) { }
          if (r.ok && d && d.success) fin(true, d, null);
          else if (d && d.message) fin(false, d, d.message);
          else fin(false, null, 'HTTP ' + r.status);
        });
      }).catch(function () { fin(false, null, 'server nedostupan'); });
    } catch (e) {
      fin(false, null, 'server nedostupan');
    }
  }

  /* Zapis vidljivosti na server — vrijedi za sve posjetitelje i sva računala */
  TECAJ.spremiVidljivost = function (o, cb) {
    var tok = citaj('localStorage', KLJUC_TOKEN);
    if (!tok) return cb(false, 'niste prijavljeni');
    apiPoziv('tecaj-vidljivost', { token: tok, vidljivost: o }, function (ok, d, greska) {
      cb(ok, greska);
    });
  };
  TECAJ.imaUlaz = function () {
    return memUlaz || citaj('sessionStorage', KLJUC_ULAZ) === '1' || TECAJ.jeUrednik();
  };

  /* --- Vidljivost lekcije ---
     Redoslijed prioriteta:
       1. window.TECAJ_VIDLJIVOST  (data/vidljivost.js — vrijedi za sve posjetitelje)
       2. localStorage             (uredničke izmjene na ovom računalu, za pregled)
       3. status u TECAJ.LEKCIJE   (zadano)
     Urednik uvijek vidi sve. */
  function lokalnaVidljivost() {
    try { return JSON.parse(citaj('localStorage', KLJUC_VID) || 'null'); }
    catch (e) { return null; }
  }
  TECAJ.vidljiva = function (L) {
    if (!L) return false;
    var lok = lokalnaVidljivost();
    if (lok && typeof lok[L.n] === 'boolean') return lok[L.n];
    var glob = window.TECAJ_VIDLJIVOST;
    if (glob && typeof glob[L.n] === 'boolean') return glob[L.n];
    return L.status === 'objavljeno';
  };
  /* Ono što posjetitelj smije otvoriti (urednik smije sve) */
  TECAJ.dostupna = function (L) { return TECAJ.jeUrednik() || TECAJ.vidljiva(L); };

  /* --- Zaslon s PIN-om --- */
  function pinZaslon(nakon) {
    var w = document.createElement('div');
    w.className = 'pin-gate';
    w.innerHTML =
      '<div class="pin-box">' +
      '<h1 class="pin-naslov">Tečaj <span class="text-gradient">astronomije</span></h1>' +
      '<p class="pin-tekst">Sadržaj je namijenjen polaznicima tečaja. ' +
      'Unesite pristupni PIN koji ste dobili na predavanju.</p>' +
      '<form id="pin-form" autocomplete="off">' +
      '<input class="pin-unos" id="pin-unos" type="text" inputmode="numeric" ' +
      'maxlength="8" placeholder="PIN" aria-label="Pristupni PIN">' +
      '<div class="pin-greska" id="pin-greska"></div>' +
      '<button class="btn btn--primary" type="submit" style="width:100%">Otvori tečaj</button>' +
      '</form>' +
      '<div class="pin-alt">' +
      '<button class="chip-btn" id="pin-prijava">Prijava urednika</button>' +
      '<a class="chip-btn" href="' + TECAJ.ROOT + 'index.html">← Na glavnu stranicu</a>' +
      '</div>' +
      '<p class="pin-nota">PIN se pamti dok ne zatvorite karticu preglednika, ' +
      'pa se između lekcija ne traži ponovno.</p>' +
      '</div>';
    document.body.appendChild(w);

    var unos = w.querySelector('#pin-unos');
    var greska = w.querySelector('#pin-greska');
    setTimeout(function () { unos.focus(); }, 60);

    w.querySelector('#pin-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (unos.value.trim() === TECAJ.PIN) {
        memUlaz = true;
        pisi('sessionStorage', KLJUC_ULAZ, '1');
        w.classList.add('pin-gate--off');
        setTimeout(function () {
          if (w.parentNode) w.parentNode.removeChild(w);
        }, 320);
        document.documentElement.classList.remove('tecaj-zakljucano');
        nakon();
      } else {
        greska.textContent = 'PIN nije točan. Pokušajte ponovno.';
        w.querySelector('.pin-box').classList.remove('pin-trese');
        void w.querySelector('.pin-box').offsetWidth;
        w.querySelector('.pin-box').classList.add('pin-trese');
        unos.select();
      }
    });
    w.querySelector('#pin-prijava').addEventListener('click', function () {
      w.querySelector('.pin-box').style.display = 'none';
      prijavaModal(function () { location.reload(); }, function () {
        w.querySelector('.pin-box').style.display = '';
      });
    });
  }

  /* --- Modal za prijavu urednika (isti podaci kao glavna stranica) --- */
  function prijavaModal(nakonPrijave, nakonOdustajanja) {
    var m = document.createElement('div');
    m.className = 'modal-overlay active';
    m.innerHTML =
      '<div class="modal">' +
      '<div class="modal__header"><h3 class="modal__title">Prijava urednika</h3>' +
      '<p style="color:var(--text-secondary)">Isti podaci kao na glavnoj stranici</p></div>' +
      '<form id="tp-form">' +
      '<div class="form-group"><label class="form-label">Korisničko ime</label>' +
      '<input type="text" class="form-input" id="tp-user" autocomplete="username" required></div>' +
      '<div class="form-group"><label class="form-label">Lozinka</label>' +
      '<input type="password" class="form-input" id="tp-pass" autocomplete="current-password" required></div>' +
      '<div id="tp-msg" style="margin-bottom:1rem;font-size:.9rem"></div>' +
      '<button type="submit" class="btn btn--primary" style="width:100%">Prijavi se</button>' +
      '</form>' +
      '<button class="btn btn--secondary" style="width:100%;margin-top:.5rem" id="tp-cancel">Odustani</button>' +
      '</div>';
    document.body.appendChild(m);
    var msg = m.querySelector('#tp-msg');

    function zatvori() {
      if (m.parentNode) m.parentNode.removeChild(m);
      if (nakonOdustajanja) nakonOdustajanja();
    }
    m.querySelector('#tp-cancel').addEventListener('click', zatvori);
    m.addEventListener('click', function (e) { if (e.target === m) zatvori(); });

    m.querySelector('#tp-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = m.querySelector('#tp-user').value;
      var pw = m.querySelector('#tp-pass').value;
      var gumb = m.querySelector('#tp-form button[type="submit"]');

      msg.textContent = '…';
      msg.style.color = 'var(--text-secondary)';
      if (gumb) gumb.disabled = true;

      function uspjeh(napomena) {
        msg.textContent = napomena || 'Uspješna prijava!';
        msg.style.color = napomena ? '#fbbf24' : '#34d399';
        setTimeout(function () {
          if (m.parentNode) m.parentNode.removeChild(m);
          if (nakonPrijave) nakonPrijave();
        }, napomena ? 1600 : 600);
      }

      /* Isto kao js/main.js glavne stranice: prvo pravi /api/login, pa token
         koji server vrati. Bez njega server ne prihvaća zapis vidljivosti. */
      apiPoziv('login', { username: u, password: pw }, function (ok, d, greska) {
        if (gumb) gumb.disabled = false;
        if (ok && d && d.token) {
          pisi('localStorage', KLJUC_TOKEN, d.token);
          uspjeh();
          return;
        }
        /* Server nedostupan → lokalna prijava kao rezerva (bez zapisa na server) */
        if (u === 'admin' && pw === 'adip2026') {
          pisi('localStorage', KLJUC_TOKEN, 'demo-token');
          uspjeh('Prijavljeni ste, ali server nije odgovorio (' + (greska || '?') +
            ') — izmjene će vrijediti samo na ovom računalu.');
          return;
        }
        msg.textContent = greska === 'server nedostupan' || greska === 'server ne odgovara'
          ? 'Server nije dostupan, a podaci nisu ispravni.'
          : 'Pogrešni podaci!';
        msg.style.color = '#f87171';
      });
    });
  }

  function oziviPrijavu() {
    var btn = document.getElementById('sidebar-login-btn');
    if (!btn) return;
    function osvjezi() {
      if (TECAJ.jeUrednik()) {
        btn.textContent = 'Odjava';
        btn.classList.remove('btn--secondary');
        btn.classList.add('btn--primary');
      } else {
        btn.textContent = 'Prijava';
        btn.classList.add('btn--secondary');
        btn.classList.remove('btn--primary');
      }
    }
    osvjezi();
    btn.addEventListener('click', function () {
      if (TECAJ.jeUrednik()) {
        try { localStorage.removeItem(KLJUC_TOKEN); } catch (e) { }
        location.reload();
      } else {
        prijavaModal(function () { location.reload(); });
      }
    });
  }

  /* ---------------------------------------------------------
     4. GRAĐA STRANICA
     --------------------------------------------------------- */

  /* Naslovna tečaja: mreža kartica. Skrivene lekcije posjetitelj ne vidi;
     urednik ih vidi posivjelo, s oznakom „skriveno“. */
  TECAJ.mrezaLekcija = function (elId) {
    var box = document.getElementById(elId);
    if (!box) return;
    var urednik = TECAJ.jeUrednik();
    var html = '';
    var prikazano = 0;
    for (var i = 0; i < TECAJ.LEKCIJE.length; i++) {
      var L = TECAJ.LEKCIJE[i];
      var vid = TECAJ.vidljiva(L);
      if (!vid && !urednik) continue;
      prikazano++;
      var soon = L.status !== 'objavljeno';
      var skriveno = !vid;
      var mrtva = soon || (skriveno && !urednik);
      var tags = '';
      for (var t = 0; t < L.teme.length && t < 4; t++) {
        tags += '<span class="tag">' + escapeHtml(L.teme[t]) + '</span>';
      }
      html +=
        '<a class="lesson-card' + (mrtva ? ' lesson-card--soon' : '') +
        (skriveno ? ' lesson-card--skrivena' : '') + '" href="' +
        (mrtva ? '#' : L.slug) + '"' + (mrtva ? ' aria-disabled="true"' : '') + '>' +
        (skriveno ? '<span class="card-znak">skriveno</span>' : '') +
        '<div class="lesson-card__top">' +
        '<div class="lesson-card__num">' + L.n + '</div>' +
        '<div><div class="lesson-card__title">' + escapeHtml(L.naslov) + '</div>' +
        '<div class="lesson-card__subtitle">' + escapeHtml(L.podnaslov) + '</div></div>' +
        '</div>' +
        '<p class="lesson-card__desc">' + escapeHtml(kratko(L.opis, 165)) + '</p>' +
        (tags ? '<div class="tag-row">' + tags + '</div>' : '') +
        '<div class="lesson-card__foot">' +
        '<span>' + (soon ? 'U pripremi' : (L.pdf ? 'PDF + 3 primjera' : '3 primjera')) + '</span>' +
        '<span class="lesson-card__cta">' + (mrtva ? '—' : 'Otvori →') + '</span>' +
        '</div></a>';
    }
    if (!prikazano) {
      html = '<div class="panel" style="grid-column:1/-1;text-align:center">' +
        '<p style="margin:0">Trenutno nema objavljenih lekcija.</p></div>';
    }
    box.innerHTML = html;
  };

  /* Stranica lekcije: zaglavlje s naslovom, PDF-om i prev/next */
  TECAJ.zaglavljeLekcije = function (n, elId) {
    var L = TECAJ.get(n);
    var box = document.getElementById(elId);
    if (!L || !box) return;
    var pdfBtn = L.pdf
      ? '<a class="btn btn--primary" href="' + L.pdf + '" download>Preuzmi PDF prezentaciju</a>'
      : '<span class="btn btn--secondary" style="opacity:.5;cursor:default">PDF u pripremi</span>';

    box.innerHTML =
      '<div>' +
      '<div class="lesson-head__eyebrow">Lekcija ' + L.n + ' od ' + TECAJ.LEKCIJE.length + '</div>' +
      '<h1 class="lesson-head__title">' + escapeHtml(L.naslov) + '</h1>' +
      '<p class="lesson-head__subtitle">' + escapeHtml(L.podnaslov) + '</p>' +
      '</div>' +
      '<div class="lesson-head__actions">' + pdfBtn +
      '<a class="btn btn--secondary" href="index.html">← Sve lekcije</a>' +
      '</div>';
  };

  TECAJ.navLekcije = function (n, elId) {
    var box = document.getElementById(elId);
    if (!box) return;
    /* Preskoči lekcije koje trenutni posjetitelj ne smije otvoriti */
    function trazi(od, korak) {
      for (var k = od; k >= 1 && k <= TECAJ.LEKCIJE.length; k += korak) {
        var L = TECAJ.get(k);
        if (L && TECAJ.dostupna(L)) return L;
      }
      return null;
    }
    var prev = trazi(n - 1, -1);
    var next = trazi(n + 1, 1);

    function link(L, smjer) {
      var kl = 'lesson-nav__link' + (smjer === 'next' ? ' lesson-nav__link--next' : '');
      if (!L || !TECAJ.dostupna(L)) {
        return '<span class="' + kl + ' lesson-nav__link--disabled">' +
          '<span class="lesson-nav__dir">' + (smjer === 'next' ? 'Sljedeća' : 'Prethodna') + '</span>' +
          '<span class="lesson-nav__name">' + (L ? 'nije dostupna' : '—') + '</span></span>';
      }
      return '<a class="' + kl + '" href="' + L.slug + '">' +
        '<span class="lesson-nav__dir">' + (smjer === 'next' ? 'Sljedeća →' : '← Prethodna') + '</span>' +
        '<span class="lesson-nav__name">' + L.n + '. ' + escapeHtml(L.naslov) + '</span></a>';
    }
    box.innerHTML = link(prev, 'prev') + link(next, 'next');
  };

  /* --- Urednička ploča: prekidači vidljivosti (samo za prijavljene) --- */
  TECAJ.urednickaPloca = function (elId) {
    var box = document.getElementById(elId);
    if (!box) return;
    if (!TECAJ.jeUrednik()) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');

    var red = '';
    for (var i = 0; i < TECAJ.LEKCIJE.length; i++) {
      var L = TECAJ.LEKCIJE[i];
      var on = TECAJ.vidljiva(L);
      red +=
        '<label class="vid-red' + (on ? '' : ' vid-red--off') + '">' +
        '<span class="vid-broj">' + L.n + '</span>' +
        '<span class="vid-ime">' + escapeHtml(L.naslov) + '</span>' +
        '<span class="prekidac' + (on ? ' prekidac--on' : '') + '">' +
        '<input type="checkbox" data-n="' + L.n + '"' + (on ? ' checked' : '') + '>' +
        '<span class="prekidac__kvacica"></span></span>' +
        '</label>';
    }

    box.innerHTML =
      '<div class="panel urednik">' +
      '<h2 class="panel__title">Urednički način — vidljivost lekcija</h2>' +
      '<p style="margin-bottom:1rem">Prekidač djeluje odmah i <strong>za sve posjetitelje</strong> — ' +
      'sprema se na server, pa vrijedi i kad se prijavite s drugog računala. ' +
      'Isključena lekcija nema karticu na naslovnoj, preskače se u navigaciji, a njezina ' +
      'stranica posjetitelja vraća na popis. Vi je vidite uz oznaku <em>skriveno</em>.</p>' +
      '<div class="vid-popis">' + red + '</div>' +
      '<div class="btn-row" style="margin-top:1.25rem">' +
      '<button class="chip-btn" id="vid-sve">Uključi sve</button>' +
      '<button class="chip-btn" id="vid-nista">Isključi sve</button>' +
      '</div>' +
      '<div class="vid-stanje" id="vid-stanje"></div>' +
      '<div class="btn-row hidden" id="vid-rezerva">' +
      '<button class="btn btn--secondary btn--small" id="vid-izvoz">Preuzmi vidljivost.js</button>' +
      '<span style="align-self:center;font-size:.82rem;color:var(--text-muted)">' +
      'zamijeni njome tecaj/data/vidljivost.js preko cPanela</span>' +
      '</div>' +
      '</div>';

    function stanjeSad() {
      var o = {};
      for (var i = 0; i < TECAJ.LEKCIJE.length; i++) {
        o[TECAJ.LEKCIJE[i].n] = TECAJ.vidljiva(TECAJ.LEKCIJE[i]);
      }
      return o;
    }

    function poruka(tekst, vrsta) {
      var el = document.getElementById('vid-stanje');
      if (!el) return;
      el.textContent = tekst;
      el.className = 'vid-stanje' + (vrsta ? ' vid-stanje--' + vrsta : '');
      var rez = document.getElementById('vid-rezerva');
      if (rez) rez.classList.toggle('hidden', vrsta !== 'bad');
    }

    /* Primijeni novo stanje: odmah u prikazu, pa zapis na server. */
    function primijeni(o) {
      window.TECAJ_VIDLJIVOST = o;
      try { localStorage.removeItem(KLJUC_VID); } catch (e) { }
      TECAJ.urednickaPloca(elId);
      TECAJ.mrezaLekcija('lesson-grid');
      poruka('Spremam na server…', 'radi');

      TECAJ.spremiVidljivost(o, function (ok, greska) {
        if (ok) {
          poruka('Spremljeno na server — vidljivo svima i s drugih računala.', 'ok');
        } else {
          /* Server nije primio: zadrži izmjenu lokalno da pregled radi,
             i ponudi datoteku za ručni prijenos. */
          pisi('localStorage', KLJUC_VID, JSON.stringify(o));
          poruka('NIJE spremljeno na server (' + (greska || 'nepoznata greška') +
            '). Izmjena za sada vrijedi samo na ovom računalu.', 'bad');
        }
      });
    }

    box.addEventListener('change', function (e) {
      var cb = e.target;
      if (!cb.dataset || !cb.dataset.n) return;
      var o = stanjeSad();
      o[cb.dataset.n] = cb.checked;
      primijeni(o);
    });
    box.querySelector('#vid-sve').addEventListener('click', function () {
      var o = {}; TECAJ.LEKCIJE.forEach(function (L) { o[L.n] = true; }); primijeni(o);
    });
    box.querySelector('#vid-nista').addEventListener('click', function () {
      var o = {}; TECAJ.LEKCIJE.forEach(function (L) { o[L.n] = false; }); primijeni(o);
    });

    /* Rezervni put ako server ne prima zapis */
    box.querySelector('#vid-izvoz').addEventListener('click', function () {
      var o = stanjeSad();
      var redovi = TECAJ.LEKCIJE.map(function (L) {
        return '  ' + L.n + ': ' + (o[L.n] ? 'true ' : 'false') + ',   /* ' + L.naslov + ' */';
      }).join('\n');
      var txt =
        '/* Vidljivost lekcija tečaja — vrijedi za SVE posjetitelje.\n' +
        '   Postavite ovu datoteku u tecaj/data/vidljivost.js.\n' +
        '   true = vidljiva, false = skrivena. */\n' +
        'window.TECAJ_VIDLJIVOST = {\n' + redovi + '\n};\n';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
      a.download = 'vidljivost.js';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 500);
    });

    /* Uvodna poruka: je li server dostupan i jesmo li prijavljeni pravim tokenom */
    if (citaj('localStorage', KLJUC_TOKEN) === 'demo-token') {
      poruka('Prijavljeni ste bez servera — izmjene neće doći do posjetitelja. ' +
        'Odjavite se i prijavite ponovno kad server bude dostupan.', 'bad');
    } else if (lokalnaVidljivost()) {
      poruka('Postoji izmjena koja nije stigla na server. Pomaknite bilo koji prekidač ' +
        'da se pokuša ponovno, ili preuzmite datoteku ispod.', 'bad');
    }
  };

  /* Poruka na stranici lekcije koju posjetitelj ne smije otvoriti.
     Sadržaj se NE briše, samo skriva istim mehanizmom kao PIN vrata — inače
     bi skripte primjera na dnu stranice ostale bez svojih elemenata. */
  function zabrana() {
    document.documentElement.classList.add('tecaj-zakljucano');
    var w = document.createElement('div');
    w.className = 'pin-gate';
    w.innerHTML =
      '<div class="pin-box">' +
      '<h1 class="pin-naslov" style="font-size:1.5rem">Lekcija trenutno nije dostupna</h1>' +
      '<p class="pin-tekst">Ova je lekcija privremeno skrivena. Ostale lekcije rade ' +
      'normalno — vratite se na popis.</p>' +
      '<a class="btn btn--primary" href="index.html" style="width:100%">← Sve lekcije</a>' +
      '</div>';
    document.body.appendChild(w);
  }

  /* Glavna inicijalizacija — poziva se iz svake stranice */
  TECAJ.init = function (opt) {
    opt = opt || {};
    var n = typeof opt.lekcija === 'number' ? opt.lekcija : null;

    function sagradi() {
      document.documentElement.classList.remove('tecaj-zakljucano');
      document.body.insertBefore(zaglavlje(n), document.body.firstChild);
      var main = document.querySelector('main') || document.body;
      if (main.parentNode) main.parentNode.insertBefore(podnozje(), main.nextSibling);
      ozivi();
      oziviPadajuce();
      oziviPrijavu();
      if (TECAJ.jeUrednik()) document.body.classList.add('urednik-aktivan');

      if (n === null) {
        TECAJ.mrezaLekcija('lesson-grid');
        TECAJ.urednickaPloca('urednik-ploca');
      } else {
        var L = TECAJ.get(n);
        if (L && !TECAJ.dostupna(L)) { zabrana(); return; }
        if (L && !TECAJ.vidljiva(L)) {
          var v = document.createElement('div');
          v.className = 'container';
          v.innerHTML = '<div class="verdict verdict--warn" style="margin:0 0 1.5rem">' +
            '<strong>Skriveno posjetiteljima.</strong> Ovu lekciju trenutno vidite samo vi ' +
            'kao urednik. Vidljivost se mijenja na <a href="index.html">naslovnoj tečaja</a>.' +
            '</div>';
          main.insertBefore(v, main.firstChild);
        }
        TECAJ.zaglavljeLekcije(n, 'lesson-head');
        TECAJ.navLekcije(n, 'lesson-nav');
        if (L && !document.title) document.title = L.n + '. ' + L.naslov;
      }
      if (typeof opt.nakon === 'function') opt.nakon();
    }

    if (TECAJ.imaUlaz()) sagradi();
    else pinZaslon(sagradi);
  };

  /* ---------------------------------------------------------
     4. POMOĆNE FUNKCIJE
     --------------------------------------------------------- */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  TECAJ.escapeHtml = escapeHtml;

  function kratko(s, n) {
    if (s.length <= n) return s;
    var cut = s.lastIndexOf(' ', n);
    return s.slice(0, cut > 0 ? cut : n) + '…';
  }

  TECAJ.el = function (id) { return document.getElementById(id); };

  /* Broj s hrvatskim decimalnim zarezom */
  TECAJ.num = function (x, d) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    d = d === undefined ? 2 : d;
    return x.toLocaleString('hr-HR', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  TECAJ.sup = function (n) {
    return String(n).split('').map(function (c) { return SUP[c] || c; }).join('');
  };

  /* Znanstvena notacija: 4,25 × 10⁹ */
  TECAJ.sci = function (x, d) {
    if (!isFinite(x) || x === 0) return x === 0 ? '0' : '—';
    d = d === undefined ? 2 : d;
    var e = Math.floor(Math.log10(Math.abs(x)));
    var m = x / Math.pow(10, e);
    if (Math.abs(m) >= 9.995) { m /= 10; e += 1; }
    return TECAJ.num(m, d) + ' × 10' + TECAJ.sup(e);
  };

  /* Automatski izbor: obični broj za razumne veličine, inače znanstvena */
  TECAJ.auto = function (x, d) {
    if (!isFinite(x)) return '—';
    var a = Math.abs(x);
    if (a !== 0 && (a < 1e-3 || a >= 1e5)) return TECAJ.sci(x, d === undefined ? 2 : d);
    if (a >= 100) return TECAJ.num(x, 0);
    if (a >= 10) return TECAJ.num(x, 1);
    return TECAJ.num(x, d === undefined ? 2 : d);
  };

  /* Kut u stupnjevima -> stupnjevi, minute, sekunde */
  TECAJ.dms = function (deg, sekDec) {
    var znak = deg < 0 ? '−' : '';
    var a = Math.abs(deg);
    var d = Math.floor(a);
    var mFull = (a - d) * 60;
    var m = Math.floor(mFull);
    var s = (mFull - m) * 60;
    if (s >= 59.995) { s = 0; m += 1; }
    if (m >= 60) { m = 0; d += 1; }
    return znak + d + '° ' + pad(m) + "' " + TECAJ.num(s, sekDec === undefined ? 1 : sekDec) + '"';
  };

  /* Sati u obliku 12h 34m 56s */
  TECAJ.hms = function (hours) {
    var a = ((hours % 24) + 24) % 24;
    var h = Math.floor(a);
    var mFull = (a - h) * 60;
    var m = Math.floor(mFull);
    var s = Math.round((mFull - m) * 60);
    if (s === 60) { s = 0; m += 1; }
    if (m === 60) { m = 0; h = (h + 1) % 24; }
    return h + 'ʰ ' + pad(m) + 'ᵐ ' + pad(s) + 'ˢ';
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  TECAJ.pad = pad;

  TECAJ.rad = function (d) { return d * Math.PI / 180; };
  TECAJ.deg = function (r) { return r * 180 / Math.PI; };
  TECAJ.clamp = function (x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); };

  TECAJ.debounce = function (fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  };

  /* --- Canvas s podrškom za retina zaslone --- */
  TECAJ.canvas = function (id, aspect, drawFn) {
    var cv = document.getElementById(id);
    if (!cv) return null;
    var ctx = cv.getContext('2d');
    var api = { cv: cv, ctx: ctx, W: 0, H: 0 };

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cssW = cv.clientWidth || cv.parentNode.clientWidth || 600;
      var cssH = Math.max(120, Math.round(cssW / aspect));
      cv.style.height = cssH + 'px';
      cv.width = Math.round(cssW * dpr);
      cv.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      api.W = cssW;
      api.H = cssH;
      api.draw();
    }
    api.draw = function () {
      if (!api.W) return;
      ctx.save();
      ctx.clearRect(0, 0, api.W, api.H);
      drawFn(ctx, api.W, api.H, api);
      ctx.restore();
    };
    api.resize = resize;
    /* Koordinate miša/prsta u CSS pikselima */
    api.pos = function (ev) {
      var r = cv.getBoundingClientRect();
      var p = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    };
    window.addEventListener('resize', TECAJ.debounce(resize, 120));
    requestAnimationFrame(resize);
    return api;
  };

  /* --- Slider: #id + #id-out; vraća objekt s .value --- */
  TECAJ.slider = function (id, opt) {
    opt = opt || {};
    var inp = document.getElementById(id);
    var out = document.getElementById(id + '-out');
    if (!inp) return { value: 0 };
    var api = {
      input: inp,
      get value() { return parseFloat(inp.value); },
      set value(v) { inp.value = v; api.refresh(); }
    };
    api.refresh = function () {
      if (out) out.textContent = opt.format ? opt.format(parseFloat(inp.value)) : inp.value;
    };
    inp.addEventListener('input', function () {
      api.refresh();
      if (opt.onInput) opt.onInput(parseFloat(inp.value));
    });
    api.refresh();
    return api;
  };

  /* --- Skupina gumbâ (chip) s jednim aktivnim --- */
  TECAJ.chips = function (containerId, onPick) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.chip-btn');
      if (!b) return;
      var svi = box.querySelectorAll('.chip-btn');
      for (var i = 0; i < svi.length; i++) svi[i].classList.remove('active');
      b.classList.add('active');
      onPick(b.dataset.value, b);
    });
  };

  /* --- Animacijska petlja s dt u sekundama --- */
  TECAJ.loop = function (step) {
    var raf = null, prev = 0, api = {};
    function tick(t) {
      var dt = prev ? Math.min((t - prev) / 1000, 0.05) : 0;
      prev = t;
      step(dt);
      raf = requestAnimationFrame(tick);
    }
    api.running = false;
    api.start = function () {
      if (api.running) return;
      api.running = true; prev = 0;
      raf = requestAnimationFrame(tick);
    };
    api.stop = function () {
      api.running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    api.toggle = function () { api.running ? api.stop() : api.start(); return api.running; };
    return api;
  };

  /* --- Približna boja crnog tijela zadane temperature (RGB) --- */
  TECAJ.bbColor = function (T) {
    /* Tanner Helland aproksimacija, T u K */
    var t = TECAJ.clamp(T, 1000, 40000) / 100, r, g, b;
    if (t <= 66) {
      r = 255;
      g = 99.47 * Math.log(t) - 161.12;
    } else {
      r = 329.7 * Math.pow(t - 60, -0.1332);
      g = 288.12 * Math.pow(t - 60, -0.0755);
    }
    if (t >= 66) b = 255;
    else if (t <= 19) b = 0;
    else b = 138.52 * Math.log(t - 10) - 305.04;
    return 'rgb(' + Math.round(TECAJ.clamp(r, 0, 255)) + ',' +
      Math.round(TECAJ.clamp(g, 0, 255)) + ',' +
      Math.round(TECAJ.clamp(b, 0, 255)) + ')';
  };

  /* --- Boja vidljive valne duljine (nm) --- */
  TECAJ.lambdaColor = function (nm) {
    var r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    var f = 1;
    if (nm > 700) f = 0.3 + 0.7 * (780 - nm) / 80;
    else if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    return 'rgb(' + Math.round(255 * Math.pow(r * f, 0.8)) + ',' +
      Math.round(255 * Math.pow(g * f, 0.8)) + ',' +
      Math.round(255 * Math.pow(b * f, 0.8)) + ')';
  };

  /* --- Crtanje osi za dijagrame --- */
  TECAJ.axes = function (ctx, box, opt) {
    opt = opt || {};
    var L = box.l, T = box.t, R = box.l + box.w, B = box.t + box.h;
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B);
    ctx.stroke();

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.5)';

    var i, p, v;
    if (opt.xTicks) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (i = 0; i < opt.xTicks.length; i++) {
        v = opt.xTicks[i];
        p = L + box.w * ((v.at !== undefined ? v.at : v) - opt.x0) / (opt.x1 - opt.x0);
        if (p < L - 1 || p > R + 1) continue;
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.moveTo(p, T); ctx.lineTo(p, B); ctx.stroke();
        ctx.fillText(v.label !== undefined ? v.label : TECAJ.auto(v), p, B + 5);
      }
    }
    if (opt.yTicks) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (i = 0; i < opt.yTicks.length; i++) {
        v = opt.yTicks[i];
        p = B - box.h * ((v.at !== undefined ? v.at : v) - opt.y0) / (opt.y1 - opt.y0);
        if (p < T - 1 || p > B + 1) continue;
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.moveTo(L, p); ctx.lineTo(R, p); ctx.stroke();
        ctx.fillText(v.label !== undefined ? v.label : TECAJ.auto(v), L - 6, p);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath();
    ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.font = '12px Inter, sans-serif';
    if (opt.xLabel) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(opt.xLabel, L + box.w / 2, B + 34);
    }
    if (opt.yLabel) {
      ctx.save();
      ctx.translate(L - 42, T + box.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(opt.yLabel, 0, 0);
      ctx.restore();
    }
  };

  /* --- Zvjezdana pozadina za canvas --- */
  TECAJ.starfield = function (ctx, W, H, n, seed) {
    var s = seed || 12345;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < n; i++) {
      var x = rnd() * W, y = rnd() * H, r = 0.3 + rnd() * 0.9;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + rnd() * 0.45).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
  };

  /* --- Tekstualna oznaka na canvasu --- */
  TECAJ.tag = function (ctx, x, y, text, color, align) {
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || 'rgba(255,255,255,.75)';
    ctx.fillText(text, x, y);
  };

})();
