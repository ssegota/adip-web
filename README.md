# Astronomsko društvo "Istra" Pula (ADIP) Web

Službena web stranica Astronomskog društva "Istra" Pula. Projekt obuhvaća informativne stranice o povijesti zvjezdarnice, društvenim aktivnostima, radovima, te interaktivne sadržaje poput kataloga knjiga i astronomskih igara.

## 🌟 Ključne Značajke (Key Features)

- **Višejezičnost**: Potpuna podrška za hrvatski, engleski (`en/`) i talijanski (`it/`) jezik.
- **Galerije Slika**: Dinamičke galerije za astrofotografiju, povijest i aktivnosti.
- **Katalog Knjiga**: Pretraživ katalog knjiga Pulske zvjezdarnice baziran na CSV podacima.
- **Novosti i Aktivnosti**: Sustav za prikaz najnovijih predavanja, promatranja i publikacija.
- **Interaktivni Sadržaj**: Astronomske igre i usluge (npr. "Spot the Asteroid").
- **Admin Panel**: Sučelje za upravljanje sadržajem i upload slika.

## 🛠️ Tehnologije (Tech Stack)

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla).
- **Backend**: Node.js s Express okvirom.
- **Baza podataka**: Lokalni JSON i CSV datoteke za jednostavnije upravljanje.
- **Server**: Konfiguriran za rad na cPanel-u putem `.htaccess` proxyja.

## 📁 Struktura Projekta (Project Structure)

- `/en/`, `/it/` - Prijevodi stranica na engleski i talijanski.
- `/js/`, `/css/` - JavaScript logika i stilovi.
- `/admin/` - Administratorsko sučelje.
- `/data/` - JSON datoteke s podacima o aktivnostima i publikacijama.
- `books.csv` - Katalog knjiga.
- `server.js` - Node.js server konfiguracija.
- `galerija-slika/` - Direktorij za pohranu uploadanih slika.

## 🚀 Početak Rada (Getting Started)

### Lokalno Pokretanje

1. Instalirajte ovisnosti:
   ```bash
   npm install
   ```

2. Pokrenite server:
   ```bash
   npm start
   ```

3. Otvorite `http://localhost:3000` u pregledniku.

## 📝 Održavanje (Maintenance)

- **Katalog knjiga**: Ažurirajte `books.csv` u korijenskom direktoriju. Sustav automatski parsira nove unose.
- **Dodavanje slika**: Koristite admin sučelje za siguran upload slika u odgovarajuće kategorije.
- **Prijevodi**: Svaka promjena na glavnim hrvatskim `.html` datotekama treba se reflektirati u `en/` i `it/` mapama.

---
© Astronomsko društvo "Istra" Pula
