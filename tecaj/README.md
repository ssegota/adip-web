# Tečaj astronomije — web modul za Pulsku Zvjezdarnicu

Samostojeći modul s **naslovnom stranicom i 16 lekcija**. Svaka lekcija ima kratak opis
teme, poveznicu za preuzimanje PDF prezentacije i tri interaktivna primjera.

Izgled je usklađen s glavnom stranicom (`css/modern.css`), ali modul **ne ovisi ni o čemu
izvan svoje mape** — nema build koraka, nema npm paketa, nema poziva na vanjske servise.
Sve je čisti HTML, CSS i JavaScript.

---

> **Za postavljanje idi na `UPUTE-cPanel.md`** — tamo je isto ovo razloženo
> na korake, sa sigurnosnom kopijom, provjerama i rješavanjem problema.
> Ovaj dokument je tehnička referenca.

## 1. Postavljanje kroz cPanel (kratka verzija)

1. U cPanelu otvorite **File Manager** i uđite u `public_html` (korijen stranice
   adip.hr — ondje gdje su `index.html`, `css/`, `js/` …).
2. Kliknite **Upload** i pošaljite cijelu mapu `tecaj` (ili ZIP pa **Extract**).
3. Provjerite da postoji `public_html/tecaj/index.html`.
4. Otvorite `https://adip.hr/tecaj/` — trebala bi se pojaviti naslovna tečaja.

To je sve. Ništa se ne konfigurira i ne restartira.

**Zašto radi bez ikakvog podešavanja:** postojeći `.htaccess` prvo provjerava postoji li
tražena datoteka ili mapa i tada je servira izravno; samo se ostalo prosljeđuje na
Node.js. A i `server.js` ima `express.static(__dirname)`, pa mapa radi u oba slučaja.

### Ako mapu želite zvati drukčije

Preimenujte je (npr. `priprema`) — sve poveznice unutar tečaja su relativne pa i dalje
rade. Jedino provjerite `TECAJ.ROOT` u `js/tecaj.js`: mora biti `'../'` ako je mapa
izravno u korijenu stranice (to je zadano), odnosno `'../../'` ako je ugurate jedan
nivo dublje.

---

## 2. Poveznica u glavnom izborniku

U svakoj glavnoj `.html` datoteci izbornik je upisan u samu stranicu. Dodajte **jedan
red** u `<nav class="nav" id="main-nav">`, najbolje odmah nakon „Preuzimanja“:

```html
<a href="tecaj/index.html" class="nav__link">Tečaj astronomije</a>
```

Točno **13 datoteka** u korijenu ima izbornik upisan u stranicu:

```
index.html                        galerija-povijest.html
aktivnosti.html                   povijest-zvjezdarnice.html
astrofotografija.html             posjet-pulskoj-zvjezdarnici.html
astronomsko-drustvo-istra-pula.html   radovi.html
downloads.html                    servisi.html
galerija-ostalo.html              galerija-slika.html
galerija-posjete.html
```

(`user.html` nema taj izbornik, pa ga preskočite.)

**Napomena:** u `downloads.html` taj red ima i klasu `active` i uvučen je dublje —
zato ga ručna zamjena „pronađi i zamijeni“ može promašiti. Naredba niže to pokriva.

Za starije (Drupal) stranice izbornik ubacuje `js/inject-header.js`. Tamo, u nizu
`nav__link` unutar funkcije `createModernHeader`, dodajte isti red s `${basePath}`:

```html
<a href="${basePath}tecaj/index.html" class="nav__link">Tečaj astronomije</a>
```

Za `en/` i `it/` verzije put je `../tecaj/index.html` (tečaj je samo na hrvatskom, pa
je poveznica ista za sve jezike).

### Brza zamjena naredbom (ako imate SSH)

Prvo kopija, pa zamjena — naredba čuva izvornu uvlaku i pokriva i `downloads.html`:

```bash
cp -a public_html public_html.backup
cd public_html
sed -i -E 's|^([[:space:]]*)(<a href="downloads\.html" class="nav__link( active)?">Preuzimanja</a>)|\1\2\n\1<a href="tecaj/index.html" class="nav__link">Tečaj astronomije</a>|' *.html
```

Provjera da nijedna stranica nije promašena:

```bash
for f in *.html; do grep -q 'id="main-nav"' "$f" && ! grep -q 'Tečaj astronomije' "$f" && echo "PROMAŠENO: $f"; done
```

Prazan ispis znači da su sve pokrivene.

---

## 3. Struktura

```
tecaj/
├── index.html            naslovna: mreža svih 16 lekcija
├── lekcija-01.html …     lekcija-16.html  (16 zasebnih stranica)
├── css/tecaj.css         svi stilovi (varijable su iste kao u modern.css)
├── js/tecaj.js           podaci o lekcijama, izbornik, PIN, pomoćne funkcije
├── data/vidljivost.js    koje su lekcije objavljene (generira urednička ploča)
├── pdf/                  16 PDF prezentacija
└── README.md             ovaj tekst
```

Svaka stranica lekcije je **samodostatna**: teorija je u HTML-u, a tri interaktivna
primjera u `<script>` bloku na dnu te iste datoteke. Nema zajedničke datoteke koju bi
promjena jedne lekcije mogla pokvariti.

---

## 4. Pristupni PIN

Tečaj je zatvoren PIN-om **1973**. Mijenja se u `js/tecaj.js`:

```js
TECAJ.PIN = '1973';
```

Kako se ponaša:

- PIN se traži pri **prvom dolasku u tečaj** u toj kartici preglednika — bilo kroz
  naslovnu, bilo upisom URL-a lekcije izravno (`…/tecaj/lekcija-01.html`).
- Nakon unosa pamti se u `sessionStorage`, pa se **između lekcija ne traži ponovno**.
- Zatvaranjem kartice se zaboravlja. Nova kartica ili novi prozor traže ga opet.
- Prijavljeni urednik ga ne mora unositi.

Sadržaj se skriva prije prvog crtanja (mali skript u `<head>` svake stranice), pa
lekcija ne „blijesne“ prije upita.

> **Iskrena napomena o razini zaštite.** Ovo je *mekana* brana — sprječava slučajne
> posjetitelje i pretraživače, ali nije sigurnosna mjera. PIN je zapisan u JavaScriptu
> koji svatko može pročitati, a PDF-ovi su dohvatljivi izravno na svojim URL-ovima
> (`…/tecaj/pdf/01-….pdf`). Za pravu zaštitu trebala bi provjera na serveru
> (npr. cPanel „Directory Privacy“ na mapi `tecaj/pdf/`, ili prijava kroz `server.js`).

---

## 5. Urednički način: uključivanje i isključivanje lekcija

Prijava koristi **isti račun i isti mehanizam kao glavna stranica** — korisničko ime
`admin`, lozinka `adip2026`, a stanje se pamti u `localStorage` pod ključem
`adip_token`. Zato: ako ste prijavljeni na glavnoj stranici, u tečaju ste prijavljeni
automatski, i obrnuto.

Prijaviti se možete gumbom **Prijava** na dnu izbornika tečaja ili poveznicom
*Prijava urednika* na PIN zaslonu.

Nakon prijave, na naslovnoj tečaja pojavljuje se ploča **Urednički način** s
prekidačem za svaku od 16 lekcija. Isključena lekcija:

- ne prikazuje se na naslovnoj ni u navigaciji „prethodna / sljedeća“,
- na svojoj stranici posjetitelju prikazuje „Lekcija trenutno nije dostupna“,
- vama kao uredniku ostaje vidljiva, s oznakom **skriveno**.

### Kako izmjene postaju vidljive svima

Prekidači djeluju **odmah, ali samo na vašem računalu** — namjerno, da možete
pregledati rezultat prije objave. Za objavu:

1. Kliknite **Preuzmi vidljivost.js**.
2. Preuzetom datotekom zamijenite `tecaj/data/vidljivost.js` kroz cPanel File Manager.
3. Gotovo — svi posjetitelji vide novo stanje.

Datoteka je čitljiva i može se urediti ručno:

```js
window.TECAJ_VIDLJIVOST = {
  1: true,    /* Nebeska sfera i astrognozija */
  2: true,    /* Koordinatni sustavi, gibanje Zemlje i vrijeme */
  3: false,   /* Udaljenosti i zvjezdane veličine  <- skrivena */
  ...
};
```

Za povratak na zadano (`status` iz `js/tecaj.js`) upišite
`window.TECAJ_VIDLJIVOST = null;` ili na ploči kliknite **Vrati na zadano** (to briše
samo lokalne izmjene).

Redoslijed prioriteta: `data/vidljivost.js` → lokalne uredničke izmjene → `status` u
`js/tecaj.js`.

---

## 6. Uređivanje sadržaja

### Naslov, opis ili PDF neke lekcije

Sve je na jednom mjestu — u polju `TECAJ.LEKCIJE` u `js/tecaj.js`:

```js
{
  n: 7,
  slug: 'lekcija-07.html',
  pdf: 'pdf/07-suncev-sustav-planeti.pdf',
  naslov: 'Sunčev sustav: planeti',
  podnaslov: 'Nastanak, linija leda, terestrički i divovski planeti',
  opis: 'Sunčev sustav nije zbirka nepovezanih tijela nego …',
  teme: ['Protoplanetarni disk', 'Linija leda', 'Terestrički planeti'],
  status: 'objavljeno'
}
```

Odatle se automatski grade: kartica na naslovnoj, naslov na stranici lekcije, stavka u
izborniku te poveznice „prethodna / sljedeća“. Naslov u `<title>` i tekst teorije mijenjaju
se u samoj `lekcija-NN.html`.

### Nova verzija PDF-a

Prepišite datoteku u `pdf/` istim imenom. Ništa drugo se ne mijenja.

### Nova lekcija (17. i dalje)

1. Kopirajte npr. `lekcija-16.html` u `lekcija-17.html`.
2. U novoj datoteci promijenite `<title>` i `TECAJ.init({ lekcija: 17 })`.
3. Dodajte PDF u `pdf/`.
4. Dodajte novi unos u `TECAJ.LEKCIJE`.

### Lekcija koja još nije gotova

Postavite joj `status: 'u-pripremi'` i `pdf: ''`. Kartica će se prikazati posivjelo i
neaktivno, a lekcija se neće pojaviti u izborniku ni u prev/next navigaciji.

### Promjena glavnog izbornika

Ako se izbornik glavne stranice promijeni, ažurirajte polje `GLAVNI_IZBORNIK` u
`js/tecaj.js`. To je jedno mjesto za sve 17 stranica tečaja.

---

## 7. Interaktivni primjeri

Svaki primjer je samostalan `(function () { … })()` blok pri dnu stranice lekcije. Koriste
se pomoćne funkcije iz `js/tecaj.js`:

| Funkcija | Čemu služi |
|---|---|
| `TECAJ.canvas(id, aspect, drawFn)` | canvas s podrškom za retina zaslone i automatskim ponovnim crtanjem pri promjeni širine |
| `TECAJ.slider(id, {format, onInput})` | klizač koji sam ispisuje vrijednost u `#id-out` |
| `TECAJ.chips(id, onPick)` | skupina gumba s jednim aktivnim |
| `TECAJ.loop(fn)` | animacijska petlja s `dt` u sekundama (`start`, `stop`, `toggle`) |
| `TECAJ.num`, `TECAJ.sci`, `TECAJ.auto` | brojevi s hrvatskim decimalnim zarezom |
| `TECAJ.dms`, `TECAJ.hms` | kutovi i vremena u astronomskom zapisu |
| `TECAJ.axes(ctx, box, opt)` | osi s mrežom i oznakama |
| `TECAJ.bbColor(T)`, `TECAJ.lambdaColor(nm)` | boja crnog tijela i boja valne duljine |

Sva fizika je izračunata u kodu, ne prepisana — mijenjanje ulaza daje ispravan izlaz.
Formule su navedene u komentarima i u tekstu teorije uz svaki primjer.

---

## 8. Tehničke bilješke

- **Bez ovisnosti.** Nema jQuery, MathJax, Chart.js ni CDN-a. Jedini vanjski resurs je
  Google font Inter, isti koji koristi glavna stranica; ako se ne učita, pada na
  sistemski sans-serif.
- **Slike s glavne stranice** (`../background.png`, logo) učitavaju se relativno. Ako ih
  nema, CSS ima gradijentnu zamjenu, a logo se sakriva — stranica ostaje ispravna.
- **Responzivno.** Iznad 1000 px teorija i primjeri stoje u dva stupca; ispod toga se
  slažu jedan pod drugi (teorija prva). Grafovi se sami prilagođavaju širini.
- **Ispis.** `@media print` skriva izbornik, podnožje i pozadinu, pa se lekcija može
  natisnuti kao radni list.
- **Veličina.** Oko 12 MB, od čega 11 MB su PDF-ovi.
- **Mapa `data/`** mora se poslati zajedno s ostalim. Ako je izgubite, stranice i dalje
  rade (vrijedi `status` iz `js/tecaj.js`), samo se u konzoli pojavi 404 za
  `data/vidljivost.js`.

---

Autor sadržaja: dr. sc. Sandi Baressi Šegota
Astronomsko društvo „Istra“ Pula
