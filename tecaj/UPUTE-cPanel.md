# Postavljanje tečaja na adip.hr — korak po korak

Ukupno vrijeme: 10–15 minuta. Ništa se ne kompilira i ništa se ne restartira.

---

## Prije početka

Trebaš:

- pristup **cPanelu** za adip.hr
- mapu **`ZA-UPLOAD/tecaj`** (ili `tecaj.zip`)
- urednički račun: **admin** (lozinka kao za administraciju stranice)

---

## Korak 1 — Napravi sigurnosnu kopiju

Ovo je jedini korak koji **ne** smiješ preskočiti.

1. cPanel → **File Manager**
2. Uđi u mapu u kojoj su `index.html`, `server.js` i `css/` (obično **`public_html`**)
3. Klikni **Settings** (gore desno) → uključi **Show Hidden Files (dotfiles)** → *Save*
   → tako ćeš vidjeti i `.htaccess`
4. Vrati se jednu razinu gore, desni klik na mapu `public_html` → **Compress** →
   *Zip Archive* → **Compress File(s)**
5. Kad se stvori `public_html.zip`, desni klik → **Download** i spremi ga na svoje računalo

> Ako hosting ima **JetBackup**, dovoljno je tamo napraviti *File Backup* mape.

---

## Korak 2 — Nađi pravu mapu

Tečaj mora doći u istu mapu u kojoj su `index.html` i `server.js`. Prepoznaješ je po tome
što u njoj istovremeno postoje:

```
index.html      css/        js/       server.js
.htaccess       radovi.html           galerija-slika.html
```

Na standardnom cPanel setupu to je **`public_html`**. Ako adip.hr radi kao addon domena
ili poddomena, onda je to njezin *Document Root* (vidljiv u cPanel → **Domains**).

---

## Korak 3 — Pošalji i raspakiraj `tecaj.zip`

1. U File Manageru budi u toj mapi (npr. `public_html`)
2. Klikni **Upload** (gornja traka)
3. Odaberi `tecaj.zip` → čekaj da traka dođe do 100 %
4. Klikni **Go Back to …** dolje lijevo
5. Osvježi popis (**Reload**) — vidjet ćeš `tecaj.zip`
6. **Desni klik na `tecaj.zip` → Extract** → potvrdi putanju (mora biti ta ista mapa) →
   **Extract File(s)**
7. Zatvori prozorčić, **Reload** — sada postoji mapa **`tecaj`**
8. Desni klik na `tecaj.zip` → **Delete** (više ne treba)

### Provjeri da je sve na mjestu

Uđi u `tecaj` i provjeri da vidiš:

```
index.html          lekcija-01.html … lekcija-16.html
css/tecaj.css       js/tecaj.js
data/vidljivost.js  pdf/  (16 PDF-ova)
```

U `data/` mora biti i `.htaccess` — vidjet ćeš ga samo ako si u Koraku 1 uključio
*Show Hidden Files*.

---

## Korak 4 — Prvi test

Otvori u pregledniku:

```
https://adip.hr/tecaj/
```

Trebaš odmah dobiti popis 16 lekcija (tečaj je javan, bez PIN-a).
Otvori bilo koju lekciju: grafovi rade, PDF se preuzima.

Ako umjesto toga dobiješ 404 ili popis datoteka, mapa je na pogrešnom mjestu — vrati se
na Korak 2.

> **Ništa se ne restartira.** Tečaj su obične statične datoteke. Postojeći `.htaccess`
> prvo provjerava postoji li datoteka i tada je servira izravno, a i `server.js` ima
> `express.static(__dirname)` — radi u oba slučaja, s Node aplikacijom ili bez nje.

---

## Korak 5 — Dodaj poveznicu u izbornik

Izbornik je upisan u svaku stranicu posebno: **13 datoteka** u korijenu, plus 13 u `en/`
i 13 u `it/` ako želiš poveznicu i tamo. Zato postoje dva puta.

### Ručno kroz File Manager

Za svaku datoteku iz popisa niže:

1. Desni klik → **Edit** (ili *Code Editor*)
2. Nađi red:

   ```html
   <a href="downloads.html" class="nav__link">Preuzimanja</a>
   ```

3. **Ispod** njega dodaj:

   ```html
   <a href="tecaj/index.html" class="nav__link">Tečaj astronomije</a>
   ```

4. **Save Changes**

Popis datoteka:

```
index.html                             galerija-slika.html
aktivnosti.html                        posjet-pulskoj-zvjezdarnici.html
astrofotografija.html                  povijest-zvjezdarnice.html
astronomsko-drustvo-istra-pula.html    radovi.html
downloads.html                         servisi.html
galerija-ostalo.html
galerija-posjete.html
galerija-povijest.html
```

Dvije napomene:

- U **`downloads.html`** taj red ima i `class="nav__link active"` i uvučen je dublje —
  traži samo `downloads.html" class="nav__link`, ne cijeli red.
- `user.html` **nema** taj izbornik, preskoči ga.

Za `en/` i `it/` isto, ali put je `../tecaj/index.html`, a stavka se zove
*Downloads* / *Download*.

### Provjeri

Otvori adip.hr, klikni na hamburger izbornik gore lijevo. Ispod „Preuzimanja“ mora
stajati **Tečaj astronomije** i voditi na tečaj.

---

## Korak 6 — Provjeri urednički način

1. U tečaju otvori izbornik → **Prijava** (dolje) → `admin` / lozinka administracije
2. Na naslovnoj tečaja pojavi se ploča **Urednički način** s 16 prekidača
3. Isključi jednu lekciju za test — kartica posivi i dobije oznaku *skriveno*
4. Otvori tečaj u **anonimnom prozoru** (Ctrl+Shift+N) → te lekcije nema

Prekidači djeluju **samo na tvom računalu**, za pregled. Da vrijede za sve:

1. **Preuzmi vidljivost.js**
2. File Manager → `tecaj/data/` → **Upload** → odaberi preuzeti `vidljivost.js` →
   potvrdi **Overwrite**
3. Gotovo. (Mapa ima `.htaccess` koji brani predmemoriranje, pa se vidi odmah.)

---

## Korak 7 — Licenca

Tečaj je javan i objavljen pod licencom **CC BY-NC 4.0** (dijeljenje i prilagodba uz
navođenje autora i društva, isključivo nekomercijalno). PDF-ove zato nije potrebno
zaštićivati lozinkom.

---

## Ako nešto ne radi

| Simptom | Uzrok i rješenje |
|---|---|
| `/tecaj/` daje 404 | mapa nije u istoj razini kao `index.html` — provjeri Korak 2 |
| Stranica bez stilova, gola slova | nedostaje `tecaj/css/tecaj.css` — raspakiraj ZIP ponovno |
| Nema pozadinske slike i loga | normalno ako `background.png` nije u korijenu; sve ostalo radi |
| Grafovi se ne crtaju | JavaScript je isključen ili blokiran dodatkom |
| Promijenio sam `vidljivost.js`, ne vidi se | Ctrl+Shift+R (tvrdo osvježavanje) |
| Poveznica u izborniku dvaput | pokrenuo si skriptu s `--primijeni` na već izmijenjenim datotekama iz starije verzije — vrati iz `*.bak-tecaj` |

---

## Sažetak za sljedeći put

Kad mijenjaš samo sadržaj tečaja, dovoljno je poslati promijenjene datoteke:

| Što mijenjaš | Što pošalji |
|---|---|
| tekst lekcije | tu `lekcija-NN.html` |
| naslov, opis, popis lekcija | `js/tecaj.js` |
| nova verzija prezentacije | tu datoteku u `pdf/` |
| koje su lekcije objavljene | `data/vidljivost.js` |
| napomena o licenci (CC BY-NC 4.0) | `index.html` i `podnozje()` u `js/tecaj.js` |

Izbornik glavne stranice ne treba dirati ponovno.
