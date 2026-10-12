/**
 * ADIP Modern Website - Main JavaScript
 * Handles: Navigation, Login Modal, Activity Loading, Editing, Lightbox, Language Toggle
 */

const translations = {
    hr: {
        publication: 'Publikacija',
        downloadPdf: 'Preuzmi PDF',
        openLink: 'Otvori poveznicu',
        noAbstract: 'Nema sažetka.',
        noContent: 'Nema sadržaja.',
        readMore: 'Klikni za više →',
        errorLoading: 'Greška pri učitavanju sadržaja.',
        serverError: 'Greška servera.',
        delete: 'Obriši',
        deleteImageConfirm: 'Jeste li sigurni da želite obrisati ovu sliku?',
        deleteError: 'Brisanje nije uspjelo.',
        successAdd: 'Rad uspješno dodan!',
        errorAdd: 'Greška pri dodavanju.',
        loginSuccess: 'Uspješna prijava!',
        loginError: 'Pogrešni podaci!',
        logout: 'Odjava',
        login: 'Prijava',
        noActivities: 'Nema aktivnosti za prikaz.',
        noActivitiesYear: 'Nema aktivnosti za odabranu godinu.',
        untitled: 'Bez naslova',
        deleteConfirm: 'Jeste li sigurni da želite obrisati ovu aktivnost?',
        deleteDisabled: 'Brisanje nije omogućeno na statičkoj demo verziji.',
        publishSuccess: 'Aktivnost objavljena!',
        publishError: 'Greška pri objavi',
        publishDisabled: 'Objavljivanje nije omogućeno na statičkoj demo verziji.',
        maxImages: 'Maksimalno 3 slike!',
        allYears: 'Sve godine',
        serverConnectionError: 'Greška pri povezivanju sa serverom',
        // Uređivanje aktivnosti
        edit: 'Uredi',
        save: 'Spremi',
        cancel: 'Odustani',
        editDescription: 'Uredi opis',
        saveError: 'Spremanje nije uspjelo.',
        editTitle: 'Naslov',
        editDate: 'Datum',
        editYear: 'Godina',
        editContent: 'Sadržaj',
        editContentHint: 'Prazan red = novi paragraf. Jedan Enter = novi red.',
        editImages: 'Slike (do 3)',
        editImagesHint: 'Klikni ✕ za uklanjanje slike. Dodaj nove ispod.',
        editAddImages: 'Dodaj slike',
        editSaved: 'Promjene spremljene!',
        editSavedLocal: 'Server nije dostupan - promjene su spremljene samo lokalno u ovom pregledniku.',
        editError: 'Greška pri spremanju promjena.',
        editEmptyTitle: 'Naslov ne smije biti prazan.',
        deleted: 'Aktivnost obrisana!',
        deletedLocal: 'Server nije dostupan - aktivnost je sakrivena samo lokalno u ovom pregledniku.',
        localDataNote: 'Prikazane su lokalne (nespremljene) izmjene.',
        resetLocal: '↺ Poništi lokalne izmjene',
        storageFull: 'Slike su prevelike za lokalnu pohranu. Tekst je spremljen, slike nisu.',
        // Services
        serviceAdded: 'Servis dodan!',
        serviceAddError: 'Greška pri dodavanju servisa.',
        astroSunrise: 'Izlazak Sunca',
        astroSunset: 'Zalazak Sunca',
        astroMoonPhase: 'Faza Mjeseca',
        astroDate: 'Datum',
        tideTitle: 'PLIME I OSEKE ZA',
        tideLevel: 'Razina mora (m)',
        tideDisclaimer: '* Grafikoni su simulacije temeljene na mjesečevim fazama. Nisu za navigaciju.',
        suncalcError: 'SunCalc biblioteka nije učitana.',
        genericError: 'Došlo je do greške: ',
        moonNew: 'Mlađak',
        moonWaxingCrescent: 'Rastući srp',
        moonFirstQuarter: 'Prva četvrt',
        moonWaxingGibbous: 'Rastući izbočeni',
        moonFull: 'Pun Mjesec',
        moonWaningGibbous: 'Padajući izbočeni',
        moonLastQuarter: 'Zadnja četvrt',
        moonWaningCrescent: 'Padajući srp',
        sunMoonTitle: 'Sunce i Mjesec -',
        sunriseSunsetTitle: 'Izlazak i zalazak Sunca',
        selectMonth: 'Mjesec',
        selectYear: 'Godina',
        show: 'Prikaži',
        imageNotFound: 'Slika nije dostupna za odabrani mjesec',
        olderPapers: 'Arhiva radova'
    },
    en: {
        publication: 'Publication',
        downloadPdf: 'Download PDF',
        openLink: 'Open Link',
        noAbstract: 'No abstract available.',
        noContent: 'No content.',
        readMore: 'Read more →',
        errorLoading: 'Error loading content.',
        serverError: 'Server error.',
        delete: 'Delete',
        deleteImageConfirm: 'Are you sure you want to delete this image?',
        deleteError: 'Delete failed.',
        successAdd: 'Paper successfully added!',
        errorAdd: 'Error adding paper.',
        loginSuccess: 'Login successful!',
        loginError: 'Invalid credentials!',
        logout: 'Logout',
        login: 'Login',
        noActivities: 'No activities to display.',
        noActivitiesYear: 'No activities for selected year.',
        untitled: 'Untitled',
        deleteConfirm: 'Are you sure you want to delete this activity?',
        deleteDisabled: 'Deletion is not enabled on static demo version.',
        publishSuccess: 'Activity published!',
        publishError: 'Error publishing',
        publishDisabled: 'Publishing is not enabled on static demo version.',
        maxImages: 'Max 3 images!',
        allYears: 'All years',
        serverConnectionError: 'Error connecting to server',
        // Editing
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        editDescription: 'Edit description',
        saveError: 'Saving failed.',
        editTitle: 'Title',
        editDate: 'Date',
        editYear: 'Year',
        editContent: 'Content',
        editContentHint: 'Empty line = new paragraph. Single Enter = line break.',
        editImages: 'Images (up to 3)',
        editImagesHint: 'Click ✕ to remove an image. Add new ones below.',
        editAddImages: 'Add images',
        editSaved: 'Changes saved!',
        editSavedLocal: 'Server unavailable - changes saved locally in this browser only.',
        editError: 'Error saving changes.',
        editEmptyTitle: 'Title cannot be empty.',
        deleted: 'Activity deleted!',
        deletedLocal: 'Server unavailable - activity hidden locally in this browser only.',
        localDataNote: 'Showing local (unsaved) changes.',
        resetLocal: '↺ Reset local changes',
        storageFull: 'Images too large for local storage. Text saved, images were not.',
        // Services
        serviceAdded: 'Service added!',
        serviceAddError: 'Error adding service.',
        astroSunrise: 'Sunrise',
        astroSunset: 'Sunset',
        astroMoonPhase: 'Moon Phase',
        astroDate: 'Date',
        tideTitle: 'TIDES FOR',
        tideLevel: 'Sea Level (m)',
        tideDisclaimer: '* Charts are simulations based on moon phases. Not for navigation.',
        suncalcError: 'SunCalc library not loaded.',
        genericError: 'An error occurred: ',
        moonNew: 'New Moon',
        moonWaxingCrescent: 'Waxing Crescent',
        moonFirstQuarter: 'First Quarter',
        moonWaxingGibbous: 'Waxing Gibbous',
        moonFull: 'Full Moon',
        moonWaningGibbous: 'Waning Gibbous',
        moonLastQuarter: 'Last Quarter',
        moonWaningCrescent: 'Waning Crescent',
        sunMoonTitle: 'Sun and Moon -',
        sunriseSunsetTitle: 'Sunrise and Sunset',
        selectMonth: 'Month',
        selectYear: 'Year',
        show: 'Show',
        imageNotFound: 'Image not available for selected month',
        olderPapers: 'Older Papers'
    },
    it: {
        publication: 'Pubblicazione',
        downloadPdf: 'Scarica PDF',
        openLink: 'Apri Link',
        noAbstract: 'Nessun riassunto disponibile.',
        noContent: 'Nessun contenuto.',
        readMore: 'Leggi tutto →',
        errorLoading: 'Errore nel caricamento del contenuto.',
        serverError: 'Errore del server.',
        delete: 'Elimina',
        deleteImageConfirm: 'Sei sicuro di voler eliminare questa immagine?',
        deleteError: 'Eliminazione non riuscita.',
        successAdd: 'Articolo aggiunto con successo!',
        errorAdd: 'Errore durante l\'aggiunta.',
        loginSuccess: 'Accesso effettuato!',
        loginError: 'Credenziali non valide!',
        logout: 'Esci',
        login: 'Accedi',
        noActivities: 'Nessuna attività da visualizzare.',
        noActivitiesYear: 'Nessuna attività per l\'anno selezionato.',
        untitled: 'Senza titolo',
        deleteConfirm: 'Sei sicuro di voler eliminare questa attività?',
        deleteDisabled: 'L\'eliminazione non è abilitata nella versione demo.',
        publishSuccess: 'Attività pubblicata!',
        publishError: 'Errore nella pubblicazione',
        publishDisabled: 'La pubblicazione non è abilitata nella versione demo.',
        maxImages: 'Massimo 3 immagini!',
        allYears: 'Tutti gli anni',
        serverConnectionError: 'Errore di connessione al server',
        // Modifica
        edit: 'Modifica',
        save: 'Salva',
        cancel: 'Annulla',
        editDescription: 'Modifica descrizione',
        saveError: 'Salvataggio non riuscito.',
        editTitle: 'Titolo',
        editDate: 'Data',
        editYear: 'Anno',
        editContent: 'Contenuto',
        editContentHint: 'Riga vuota = nuovo paragrafo. Un Invio = a capo.',
        editImages: 'Immagini (max 3)',
        editImagesHint: 'Clicca ✕ per rimuovere. Aggiungi nuove sotto.',
        editAddImages: 'Aggiungi immagini',
        editSaved: 'Modifiche salvate!',
        editSavedLocal: 'Server non disponibile - modifiche salvate solo in questo browser.',
        editError: 'Errore nel salvataggio.',
        editEmptyTitle: 'Il titolo non può essere vuoto.',
        deleted: 'Attività eliminata!',
        deletedLocal: 'Server non disponibile - attività nascosta solo in questo browser.',
        localDataNote: 'Modifiche locali (non salvate sul server).',
        resetLocal: '↺ Annulla modifiche locali',
        storageFull: 'Immagini troppo grandi per il salvataggio locale. Testo salvato, immagini no.',
        // Services
        serviceAdded: 'Servizio aggiunto!',
        serviceAddError: 'Errore durante l\'aggiunta del servizio.',
        astroSunrise: 'Alba',
        astroSunset: 'Tramonto',
        astroMoonPhase: 'Fase Lunare',
        astroDate: 'Data',
        tideTitle: 'MAREE PER',
        tideLevel: 'Livello del mare (m)',
        tideDisclaimer: '* I grafici sono simulazioni basate sulle fasi lunari. Non per la navigazione.',
        suncalcError: 'Libreria SunCalc non caricata.',
        genericError: 'Si è verificato un errore: ',
        moonNew: 'Luna Nuova',
        moonWaxingCrescent: 'Luna Crescente',
        moonFirstQuarter: 'Primo Quarto',
        moonWaxingGibbous: 'Gibbosa Crescente',
        moonFull: 'Luna Piena',
        moonWaningGibbous: 'Gibbosa Calante',
        moonLastQuarter: 'Ultimo Quarto',
        moonWaningCrescent: 'Luna Calante',
        sunMoonTitle: 'Sole e Luna -',
        sunriseSunsetTitle: 'Alba e tramonto',
        selectMonth: 'Mese',
        selectYear: 'Anno',
        show: 'Mostra',
        imageNotFound: 'Immagine non disponibile per il mese selezionato',
        olderPapers: 'Archivio documenti'
    }
};

function getCurrentLang() {
    const path = window.location.pathname;
    if (path.includes('/it/')) return 'it';
    if (path.includes('/en/')) return 'en';
    return 'hr';
}

function t(key) {
    const lang = getCurrentLang();
    return translations[lang][key] || key;
}

// Jezik knjige u katalogu (books.csv) je na hrvatskom
const BOOK_LANGUAGES = {
    'Njemački': { en: 'German', it: 'Tedesco' },
    'Talijanski': { en: 'Italian', it: 'Italiano' },
    'Engleski': { en: 'English', it: 'Inglese' },
    'Hrvatski': { en: 'Croatian', it: 'Croato' },
    'Francuski': { en: 'French', it: 'Francese' },
    'Latinski': { en: 'Latin', it: 'Latino' }
};

function translateBookLanguage(value) {
    const known = BOOK_LANGUAGES[value];
    return known ? tr({ hr: value, en: known.en, it: known.it }) : value;
}

// Kratki tekstovi izvan rječnika: tr({ hr, en, it })
function tr(texts) {
    return texts[getCurrentLang()] || texts.hr;
}

let allActivitiesData = [];

/* ==================== Helpers ==================== */

function isLoggedIn() {
    return !!localStorage.getItem('adip_token');
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ==================== Thumbnailovi ==================== */
/*
 * Thumbnail slike iz galerije/aktivnosti je <mapa>/thumbs/<ime>.jpg.
 * Nastaje pri uploadu (makeThumb, u pregledniku) ili skriptom scripts/generate-thumbs.sh.
 * Prikazi koriste thumbnail, a original se učitava tek u lightboxu.
 * Ako thumbnail ne postoji, <img> se sam vrati na original.
 */
const THUMB_SIZE = 400; // kraća stranica, px

function thumbUrl(src) {
    const s = String(src || '');
    if (!/^\/?(galerija|aktivnosti-slike)\//.test(s)) return s;
    const i = s.lastIndexOf('/');
    return s.slice(0, i + 1) + 'thumbs/' + s.slice(i + 1).replace(/\.[^.]+$/, '') + '.jpg';
}

function setThumbSrc(img, src) {
    const thumb = thumbUrl(src);
    if (thumb !== src) {
        img.addEventListener('error', () => { img.src = src; }, { once: true });
    }
    img.src = thumb;
}

function thumbImgHtml(src, alt, className) {
    const cls = className ? ` class="${className}"` : '';
    return `<img${cls} src="${escapeHtml(thumbUrl(src))}" data-full="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=this.dataset.full">`;
}

// Umanjena JPEG kopija slike (Blob) ili null ako preglednik ne može dekodirati sliku
async function makeThumb(file) {
    if (!file || !/^image\//.test(file.type) || typeof createImageBitmap !== 'function') return null;
    try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const scale = Math.min(1, THUMB_SIZE / Math.min(bmp.width, bmp.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bmp.width * scale));
        canvas.height = Math.max(1, Math.round(bmp.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        if (bmp.close) bmp.close();
        return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    } catch (e) {
        console.warn('Thumbnail nije generiran:', e);
        return null;
    }
}

// Dodaje slike i njihove thumbnailove u FormData. i-ti thumb pripada i-toj slici,
// pa se za neuspjeli thumb šalje prazan placeholder koji server odbaci.
async function appendImagesWithThumbs(fd, files, imageField, thumbField) {
    const thumbs = await Promise.all(files.map(makeThumb));
    files.forEach((f, i) => {
        fd.append(imageField, f);
        fd.append(thumbField, thumbs[i] || new Blob([], { type: 'application/octet-stream' }), 'thumb.jpg');
    });
}

/**
 * Pretvara obični tekst u paragrafe.
 * Prazan red -> novi <p>, jedan prijelom reda -> <br>.
 * Koristi text node-ove pa nema rizika od ubacivanja HTML-a.
 */
function renderParagraphs(el, text) {
    if (!el) return;
    el.innerHTML = '';

    const normalized = String(text || '')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    const blocks = normalized.split(/\n{2,}/).filter(b => b.trim() !== '');

    if (blocks.length === 0) {
        el.textContent = t('noContent');
        return;
    }

    blocks.forEach(block => {
        const p = document.createElement('p');
        block.split('\n').forEach((line, i) => {
            if (i > 0) p.appendChild(document.createElement('br'));
            p.appendChild(document.createTextNode(line));
        });
        el.appendChild(p);
    });
}

/* ==================== Lokalne izmjene (fallback bez servera) ==================== */

const LOCAL_EDITS_KEY = 'adip_local_activity_edits';
const LOCAL_DELETES_KEY = 'adip_local_activity_deletes';

function getLocalEdits() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_EDITS_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function getLocalDeletes() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_DELETES_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function saveLocalEdit(id, data) {
    const edits = getLocalEdits();
    edits[String(id)] = data;
    localStorage.setItem(LOCAL_EDITS_KEY, JSON.stringify(edits));
}

function saveLocalDelete(id) {
    const deletes = getLocalDeletes();
    if (!deletes.includes(String(id))) {
        deletes.push(String(id));
        localStorage.setItem(LOCAL_DELETES_KEY, JSON.stringify(deletes));
    }
}

function hasLocalChanges() {
    return Object.keys(getLocalEdits()).length > 0 || getLocalDeletes().length > 0;
}

function clearLocalChanges() {
    localStorage.removeItem(LOCAL_EDITS_KEY);
    localStorage.removeItem(LOCAL_DELETES_KEY);
}

function applyLocalOverrides(list) {
    const edits = getLocalEdits();
    const deletes = getLocalDeletes().map(String);

    return (list || [])
        .filter(a => !deletes.includes(String(a.id)))
        .map(a => {
            const patch = edits[String(a.id)];
            return patch ? Object.assign({}, a, patch) : a;
        });
}

/* Banner koji javlja da postoje lokalne izmjene */
function renderLocalNotice() {
    const container = document.getElementById('all-activities');
    if (!container || !container.parentNode) return;

    let notice = document.getElementById('local-changes-notice');

    if (!hasLocalChanges() || !isLoggedIn()) {
        if (notice) notice.remove();
        return;
    }

    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'local-changes-notice';
        notice.style.cssText = 'grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-secondary);';
        container.parentNode.insertBefore(notice, container);
    }

    notice.innerHTML = '<span>' + escapeHtml(t('localDataNote')) + '</span>';
    const btn = document.createElement('button');
    btn.className = 'btn btn--secondary btn--sm';
    btn.textContent = t('resetLocal');
    btn.addEventListener('click', () => {
        clearLocalChanges();
        window.location.reload();
    });
    notice.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLoginModal();
    initPasswordToggles();
    initLanguageToggle();
    initActivityModal();
    initActivityForm();
    ensureLightbox();

    // Load mixed content on homepage
    const activitiesContainer = document.getElementById('activities-container');
    if (activitiesContainer) {
        loadHomepageContent(activitiesContainer, 6); // Show 6 mixed items
    }

    const allActivities = document.getElementById('all-activities');
    if (allActivities) {
        loadActivities(allActivities, 100); // Show all on activities page
    }

    // Galerija "Slike aktivnosti"
    if (document.getElementById('activity-gallery')) {
        initActivityGalleryPage();
    }

    // Init Radovi
    initRadoviPage();
});

// ==================== Homepage Logic (Mixed Content) ====================

/* Bazni prefiks za data/ ovisno o jezičnom poddirektoriju */
function dataBasePath() {
    const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
    return isSubdir ? '../' : '';
}

/* Dohvati JSON, a ako ne uspije vrati prazan niz umjesto pucanja */
async function fetchJsonSafe(relPath) {
    try {
        const res = await fetch(dataBasePath() + relPath);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (err) {
        console.warn('Ne mogu dohvatiti', relPath, err);
        return [];
    }
}

async function loadHomepageContent(container, limit = 6) {
    try {
        const [activitiesRaw, radoviRaw] = await Promise.all([
            fetchJsonSafe('data/aktivnosti.json'),
            fetchJsonSafe('data/radovi.json')
        ]);

        const activities = applyLocalOverrides(activitiesRaw || []);

        // Da modal i osvježavanje rade i s naslovnice
        allActivitiesData = activities;

        const normalizedActivities = activities.map(a => ({
            data: a,
            kind: 'activity',
            sortDate: parseDate(a.date)
        }));

        const normalizedRadovi = (radoviRaw || []).map(r => ({
            data: r,
            kind: 'rad',
            sortDate: parseDate(r.dateAdded || `01. 01. ${r.year}.`)
        }));

        const mixed = [...normalizedActivities, ...normalizedRadovi]
            .sort((a, b) => b.sortDate - a.sortDate)
            .slice(0, limit);

        if (mixed.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted);">${t('noActivities')}</p>`;
            return;
        }

        container.innerHTML = '';

        mixed.forEach((entry, idx) => {
            const item = entry.data;
            const card = document.createElement('div');
            card.className = 'activity-card';
            card.style.cursor = 'pointer';
            card.dataset.index = idx;

            if (entry.kind === 'rad') {
                const isPdf = item.type === 'pdf';
                const linkText = isPdf ? t('downloadPdf') : t('openLink');

                card.style.borderLeft = '3px solid var(--accent-secondary)';
                card.innerHTML = `
                    <div class="activity-card__date">${t('publication')} | ${escapeHtml(item.year)}</div>
                    <h3 class="activity-card__title">${escapeHtml(item.title)}</h3>
                    ${item.authors ? `<p class="activity-card__content">${escapeHtml(item.authors)}</p>` : ''}
                    <div style="margin-top: 1rem;">
                        <span class="btn btn--secondary btn--sm">${linkText}</span>
                    </div>
                `;

                card.addEventListener('click', () => {
                    if (item.link) {
                        window.open(item.link, '_blank', 'noopener');
                    } else {
                        window.location.href = dataBasePath() + 'radovi.html';
                    }
                });
            } else {
                const imageHtml = (item.images && item.images.length)
                    ? thumbImgHtml(item.images[0], item.title, 'activity-card__image')
                    : '';

                card.innerHTML = `
                    ${imageHtml}
                    <div class="activity-card__content-wrapper">
                        <div class="activity-card__date">${escapeHtml(item.date || '')}</div>
                        <h3 class="activity-card__title">${escapeHtml(item.title || t('untitled'))}</h3>
                        <p class="activity-card__content">${escapeHtml(truncateText(item.content, 120))}</p>
                        <span style="color: var(--accent-primary); font-size: 0.85rem;">${t('readMore')}</span>
                    </div>
                `;

                card.addEventListener('click', () => showActivityModal(item));
            }

            container.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading homepage content:', err);
        container.innerHTML = `<p>${t('errorLoading')}</p>`;
    }
}

// Helper: Parse multiple date formats to Date object
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);

    const cleaned = String(dateStr).trim();
    const hrMatch = cleaned.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/);
    const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const yearMatch = cleaned.match(/^(\d{4})$/);

    if (hrMatch) {
        return new Date(`${hrMatch[3]}-${hrMatch[2].padStart(2, '0')}-${hrMatch[1].padStart(2, '0')}`);
    }

    if (isoMatch) {
        return new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`);
    }

    if (yearMatch) {
        return new Date(`${yearMatch[1]}-01-01`);
    }

    const fallback = new Date(cleaned);
    return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
}

// ==================== Radovi Page Logic ====================
function initRadoviPage() {
    const listContainer = document.getElementById('radovi-list');
    const uploadForm = document.getElementById('radovi-upload-form');
    const adminPanel = document.getElementById('radovi-admin-panel');
    const loginBtn = document.getElementById('sidebar-login-btn');

    if (isLoggedIn() && adminPanel) {
        adminPanel.classList.remove('hidden');
        if (loginBtn) loginBtn.textContent = t('logout');
    }

    // Load list
    if (listContainer) {
        loadRadovi(listContainer);
    }

    // Handle upload
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('radovi-message');
            const formData = new FormData(e.target);

            try {
                const response = await fetch('/api/radovi/upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    messageDiv.textContent = t('successAdd');
                    messageDiv.style.color = '#00ff88';
                    e.target.reset();
                    if (listContainer) loadRadovi(listContainer); // Reload list
                } else {
                    messageDiv.textContent = t('errorAdd');
                    messageDiv.style.color = '#ff4444';
                }
            } catch (err) {
                console.error(err);
                messageDiv.textContent = t('serverError');
                messageDiv.style.color = '#ff4444';
            }
        });
    }
}

// Store radovi globally for search filtering
let allRadovi = [];

async function loadRadovi(container) {
    try {
        const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
        const jsonPath = isSubdir ? '../data/radovi.json' : 'data/radovi.json';

        const response = await fetch(jsonPath);
        allRadovi = await response.json();

        renderRadovi(container, allRadovi);
        setupRadoviFilters(container);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>${t('errorLoading')}</p>`;
    }
}

function setupRadoviFilters(container) {
    const yearSelect = document.getElementById('filter-year');
    const authorChecks = document.querySelectorAll('.filter-author');
    const searchInput = document.getElementById('radovi-search');
    const resetBtn = document.getElementById('reset-filters');

    // Populate Year Dropdown
    if (yearSelect) {
        while (yearSelect.options.length > 1) {
            yearSelect.remove(1);
        }

        const years = [...new Set(allRadovi.map(r => r.year))].filter(y => y).sort((a, b) => b - a);
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        });

        yearSelect.addEventListener('change', () => applyRadoviFilters(container));
    }

    // Author Checkboxes
    authorChecks.forEach(ch => {
        ch.addEventListener('change', () => applyRadoviFilters(container));
    });

    // Search Input
    if (searchInput) {
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        newSearch.addEventListener('input', () => applyRadoviFilters(container));
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (yearSelect) yearSelect.value = '';
            authorChecks.forEach(ch => ch.checked = false);
            const search = document.getElementById('radovi-search');
            if (search) search.value = '';
            applyRadoviFilters(container);
        });
    }
}

function applyRadoviFilters(container) {
    const searchInput = document.getElementById('radovi-search');
    const yearSelect = document.getElementById('filter-year');
    const authorChecks = document.querySelectorAll('.filter-author:checked');

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const year = yearSelect ? yearSelect.value : '';
    const selectedAuthors = Array.from(authorChecks).map(cb => cb.value.toLowerCase());

    const filtered = allRadovi.filter(rad => {
        const matchesSearch = !query ||
            rad.title.toLowerCase().includes(query) ||
            rad.authors.toLowerCase().includes(query) ||
            String(rad.year).includes(query);

        const matchesYear = !year || String(rad.year) === year;

        let matchesAuthors = true;
        if (selectedAuthors.length > 0) {
            matchesAuthors = selectedAuthors.some(authName => rad.authors.toLowerCase().includes(authName));
        }

        return matchesSearch && matchesYear && matchesAuthors;
    });

    renderRadovi(container, filtered);
}

function renderRadovi(container, radovi) {
    const loggedIn = isLoggedIn();

    container.innerHTML = '';

    if (!radovi || radovi.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">${t('noContent')}</p>`;
        return;
    }

    const listContainer = document.createElement('div');
    listContainer.className = 'radovi-archive-list';
    listContainer.style.gridColumn = '1 / -1';
    listContainer.style.marginTop = '0';

    const list = document.createElement('div');
    list.className = 'radovi-list-items';

    radovi.forEach(rad => {
        const isPdf = rad.type === 'pdf';
        const linkText = isPdf ? 'PDF' : 'Link';

        const deleteBtn = loggedIn ?
            `<button onclick="deleteRad(${rad.id})" class="btn btn--danger btn--xs" style="margin-left: 0.5rem;">✕</button>` : '';

        const item = document.createElement('div');
        item.className = 'radovi-item';
        item.id = `rad-${rad.id}`;
        item.style.cssText = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0.75rem; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
            font-size: 0.9rem;
        `;

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden; flex: 1;">
                <span style="color: var(--text-muted); min-width: 40px; font-size: 0.85rem;">${escapeHtml(rad.year)}</span>
                <div style="display: flex; flex-direction: column; overflow: hidden;">
                    <span style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);" title="${escapeHtml(rad.title)}">${escapeHtml(rad.title)}</span>
                    <span style="color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem;" title="${escapeHtml(rad.authors)}">${escapeHtml(rad.authors)}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; margin-left: 1rem;">
                <a href="${escapeHtml(rad.link)}" target="_blank" class="btn btn--secondary btn--xs">${linkText}</a>
                ${deleteBtn}
            </div>
        `;
        list.appendChild(item);
    });

    listContainer.appendChild(list);
    container.appendChild(listContainer);
}

// Global function for onclick
window.deleteRad = async function (id) {
    if (!confirm(t('deleteConfirm'))) return;

    try {
        const res = await fetch(`/api/radovi/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            const el = document.getElementById(`rad-${id}`);
            if (el) el.remove();
        } else {
            alert(t('errorAdd'));
        }
    } catch (err) {
        console.error(err);
        alert(t('serverError'));
    }
};

// ==================== Activity Form (Upload with Images) ====================
function initActivityForm() {
    const form = document.getElementById('activity-form');
    const messageDiv = document.getElementById('post-message');
    const imageInput = document.getElementById('activity-images');

    // Limit to 3 images
    if (imageInput) {
        imageInput.addEventListener('change', () => {
            if (imageInput.files.length > 3) {
                alert(t('maxImages'));
                imageInput.value = '';
            }
        });
    }

    const dateInput = document.getElementById('activity-date');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dateField = document.getElementById('activity-date');
            if (dateField && !dateField.value) {
                dateField.value = new Date().toISOString().split('T')[0];
            }

            const formData = new FormData();
            formData.append('title', document.getElementById('activity-title').value);
            formData.append('content', document.getElementById('activity-content').value);
            formData.append('year', document.getElementById('activity-year').value);
            if (dateField && dateField.value) {
                formData.append('date', dateField.value);
            }

            const images = document.getElementById('activity-images');
            if (images && images.files) {
                await appendImagesWithThumbs(formData, Array.from(images.files).slice(0, 3), 'images', 'thumbs');
            }

            try {
                const response = await fetch('/api/aktivnosti', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    if (messageDiv) {
                        messageDiv.textContent = t('publishSuccess');
                        messageDiv.style.color = '#00ff88';
                    }
                    form.reset();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    if (messageDiv) {
                        messageDiv.textContent = t('publishError');
                        messageDiv.style.color = '#ff4444';
                    }
                }
            } catch (err) {
                console.error(err);
                if (messageDiv) {
                    messageDiv.textContent = t('serverConnectionError');
                    messageDiv.style.color = '#ff4444';
                }
            }
        });
    }
}

// ==================== Navigation ====================
function initNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    const overlay = document.getElementById('nav-overlay');
    const navClose = document.getElementById('nav-close');

    function toggleNav() {
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        menuToggle.classList.toggle('active');
    }

    function closeNav() {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
    }

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', toggleNav);
    }

    if (navClose) {
        navClose.addEventListener('click', closeNav);
    }

    if (overlay) {
        overlay.addEventListener('click', closeNav);
    }

    if (nav) {
        nav.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', closeNav);
        });
    }
}

// ==================== Login Modal ====================
function initLoginModal() {
    const loginBtn = document.getElementById('login-btn') || document.getElementById('sidebar-login-btn');
    const sidebarLoginBtn = document.getElementById('sidebar-login-btn');
    const modal = document.getElementById('login-modal');
    const closeModal = document.getElementById('close-modal');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    updateLoginButton();

    function handleLoginClick() {
        const token = localStorage.getItem('adip_token');
        if (token) {
            localStorage.removeItem('adip_token');
            localStorage.removeItem('adip_pw');
            updateLoginButton();
            window.location.reload();
        } else {
            modal.classList.add('active');
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLoginClick);
    }

    if (sidebarLoginBtn && sidebarLoginBtn !== loginBtn) {
        sidebarLoginBtn.addEventListener('click', handleLoginClick);
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            loginMessage.textContent = '...';
            loginMessage.style.color = 'var(--text-secondary)';

            let token = null;
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok && data.success) token = data.token;
            } catch (err) {
                // Server nedostupan - offline demo prijava
                console.warn('Prijava bez servera:', err);
                if (username === 'admin' && password === 'adip2026') {
                    token = 'demo-token';
                }
            }

            if (token) {
                localStorage.setItem('adip_token', token);
                loginMessage.textContent = t('loginSuccess');
                loginMessage.style.color = '#00ff88';
                setTimeout(() => {
                    modal.classList.remove('active');
                    updateLoginButton();
                    window.location.reload();
                }, 800);
            } else {
                loginMessage.textContent = t('loginError');
                loginMessage.style.color = '#ff4444';
            }
        });
    }
}

/* Gumb "prikaži lozinku" - dodaje se automatski na svako polje tipa password */
function initPasswordToggles() {
    const eyeOpen = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeClosed = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.dataset.toggleReady) return;
        input.dataset.toggleReady = '1';

        // Omotaj polje da gumb možemo pozicionirati unutar njega
        const wrap = document.createElement('div');
        wrap.className = 'password-field';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'password-toggle';
        btn.innerHTML = eyeOpen;
        const showLabel = tr({ hr: 'Prikaži lozinku', en: 'Show password', it: 'Mostra password' });
        const hideLabel = tr({ hr: 'Sakrij lozinku', en: 'Hide password', it: 'Nascondi password' });
        btn.setAttribute('aria-label', showLabel);
        btn.title = showLabel;

        btn.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.innerHTML = show ? eyeClosed : eyeOpen;
            btn.setAttribute('aria-label', show ? hideLabel : showLabel);
            btn.title = show ? hideLabel : showLabel;
            input.focus();
        });

        wrap.appendChild(btn);
    });
}

function updateLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    const sidebarLoginBtn = document.getElementById('sidebar-login-btn');
    const token = localStorage.getItem('adip_token');

    function updateBtn(btn) {
        if (btn) {
            if (token) {
                btn.textContent = t('logout');
                btn.classList.remove('btn--secondary');
                btn.classList.add('btn--primary');
            } else {
                btn.textContent = t('login');
                btn.classList.add('btn--secondary');
                btn.classList.remove('btn--primary');
            }
        }
    }

    updateBtn(loginBtn);
    updateBtn(sidebarLoginBtn);

    // Show/hide admin panels
    const adminPanels = document.querySelectorAll('.admin-panel');
    adminPanels.forEach(panel => {
        panel.classList.toggle('hidden', !token);
    });
}

// ==================== Load Activities ====================
async function loadActivities(container, limit = 10, filterYear = null) {
    try {
        const raw = await fetchJsonSafe('data/aktivnosti.json');
        allActivitiesData = applyLocalOverrides(raw);

        renderLocalNotice();

        if (!allActivitiesData || allActivitiesData.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted);">${t('noActivities')}</p>`;
            return;
        }

        // Setup year filter if on aktivnosti page
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter && yearFilter.options.length === 0) {
            setupYearFilter(yearFilter, allActivitiesData);
            return; // setupYearFilter will render
        }

        let filtered = allActivitiesData;
        if (filterYear && filterYear !== 'all') {
            filtered = allActivitiesData.filter(a => a.year == filterYear);
        }

        renderActivityCards(container, filtered.slice(0, limit));
    } catch (err) {
        console.error('Error loading activities:', err);
        container.innerHTML = `<p style="color: var(--text-muted);">${t('errorLoading')}</p>`;
    }
}

function setupYearFilter(select, activities) {
    const years = [...new Set(activities.map(a => a.year).filter(y => y))].sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = t('allYears');
    select.appendChild(allOption);

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });

    if (years.includes(currentYear)) {
        select.value = currentYear;
    } else if (years.length > 0) {
        select.value = years[0];
    }

    select.addEventListener('change', () => {
        const container = document.getElementById('all-activities');
        if (container) {
            renderFilteredActivities(container, 100, select.value);
        }
    });

    const container = document.getElementById('all-activities');
    if (container) {
        renderFilteredActivities(container, 100, select.value);
    }
}

function renderFilteredActivities(container, limit, filterYear) {
    let filtered = allActivitiesData;
    if (filterYear && filterYear !== 'all') {
        filtered = allActivitiesData.filter(a => a.year == filterYear);
    }
    renderActivityCards(container, filtered.slice(0, limit));
}

/* Zajednički renderer kartica aktivnosti */
function renderActivityCards(container, activities) {
    container.innerHTML = '';

    if (!activities || activities.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">${t('noActivitiesYear')}</p>`;
        return;
    }

    activities.forEach(activity => {
        const card = document.createElement('article');
        card.className = 'activity-card';
        card.style.cursor = 'pointer';

        const imageHtml = (activity.images && activity.images.length)
            ? thumbImgHtml(activity.images[0], activity.title, 'activity-card__image')
            : '';

        card.innerHTML = `
            ${imageHtml}
            <div class="activity-card__content-wrapper">
                <div class="activity-card__date">${escapeHtml(activity.date || 'N/A')}</div>
                <h3 class="activity-card__title">${escapeHtml(activity.title || t('untitled'))}</h3>
                <p class="activity-card__content">${escapeHtml(truncateText(activity.content, 150))}</p>
                <span style="color: var(--accent-primary); font-size: 0.85rem;">${t('readMore')}</span>
            </div>
        `;
        card.addEventListener('click', () => showActivityModal(activity));
        container.appendChild(card);
    });
}

function truncateText(text, length) {
    if (!text) return '';
    const flat = String(text).replace(/\s*\n\s*/g, ' ').trim();
    if (flat.length <= length) return flat;
    return flat.substring(0, length) + '...';
}

// ==================== Activity Modal ====================
let currentActivityId = null;
let currentActivity = null;
let editState = null; // { images: [], newFiles: [] }

function initActivityModal() {
    const activityModal = document.getElementById('activity-modal');
    const closeBtn = document.getElementById('close-activity-modal');
    const closeActivityBtn = document.getElementById('close-activity-btn');
    const deleteBtn = document.getElementById('delete-activity-btn');

    if (!activityModal) return;

    // Ukloni inline stilove s × gumba da CSS (sticky) preuzme kontrolu
    if (closeBtn) {
        closeBtn.removeAttribute('style');
        closeBtn.addEventListener('click', closeActivityModal);
    }

    if (closeActivityBtn) {
        closeActivityBtn.addEventListener('click', closeActivityModal);
    }

    if (deleteBtn) {
        deleteBtn.removeAttribute('style');
        deleteBtn.classList.add('btn--danger');
        deleteBtn.addEventListener('click', deleteCurrentActivity);
    }

    activityModal.addEventListener('click', (e) => {
        if (e.target === activityModal) {
            closeActivityModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activityModal.classList.contains('active')) {
            const lightbox = document.getElementById('lightbox');
            if (lightbox && lightbox.classList.contains('active')) return; // lightbox ima prednost
            closeActivityModal();
        }
    });
}

function closeActivityModal() {
    const modal = document.getElementById('activity-modal');
    if (!modal) return;
    exitEditMode();
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function showActivityModal(activity) {
    const modal = document.getElementById('activity-modal');
    const title = document.getElementById('activity-modal-title');
    const date = document.getElementById('activity-modal-date');
    const content = document.getElementById('activity-modal-content');
    const imagesContainer = document.getElementById('activity-modal-images');

    // Ako stranica nema modal, barem odvedi korisnika na stranicu aktivnosti
    if (!modal || !title || !content) {
        window.location.href = dataBasePath() + 'aktivnosti.html';
        return;
    }

    currentActivityId = activity.id;
    currentActivity = activity;

    renderActivityView(activity);

    modal.classList.add('active');
    modal.scrollTop = 0;
    const inner = modal.querySelector('.modal');
    if (inner) inner.scrollTop = 0;
}

/* Prikaz (read-only) sadržaja u modalu */
function renderActivityView(activity) {
    const title = document.getElementById('activity-modal-title');
    const date = document.getElementById('activity-modal-date');
    const content = document.getElementById('activity-modal-content');
    const imagesContainer = document.getElementById('activity-modal-images');
    const deleteBtn = document.getElementById('delete-activity-btn');
    const loggedIn = isLoggedIn();

    exitEditMode(true);

    title.textContent = activity.title || t('untitled');
    if (date) date.textContent = activity.date || '';

    // Paragrafi
    renderParagraphs(content, activity.content);

    // Delete gumb
    if (deleteBtn) {
        deleteBtn.classList.toggle('hidden', !loggedIn);
    }

    // Edit gumb
    ensureEditButton();
    const editBtn = document.getElementById('edit-activity-btn');
    if (editBtn) editBtn.classList.toggle('hidden', !loggedIn);

    // Slike -> lightbox
    if (imagesContainer) {
        imagesContainer.innerHTML = '';
        imagesContainer.classList.remove('hidden');
        const images = activity.images || [];
        images.forEach((imgUrl, index) => {
            const img = document.createElement('img');
            setThumbSrc(img, imgUrl);
            img.alt = activity.title || '';
            img.loading = 'lazy';
            img.addEventListener('click', () => {
                openLightbox(
                    images.map(src => ({ src: src, description: activity.title || '' })),
                    index,
                    true // ne diraj putanje
                );
            });
            imagesContainer.appendChild(img);
        });
    }
}

/* Dodaje "Uredi" gumb u red gumba modala (samo jednom) */
function ensureEditButton() {
    if (document.getElementById('edit-activity-btn')) return;

    const closeActivityBtn = document.getElementById('close-activity-btn');
    if (!closeActivityBtn || !closeActivityBtn.parentNode) return;

    const row = closeActivityBtn.parentNode;

    const editBtn = document.createElement('button');
    editBtn.id = 'edit-activity-btn';
    editBtn.className = 'btn btn--primary hidden';
    editBtn.type = 'button';
    editBtn.textContent = t('edit');
    editBtn.addEventListener('click', enterEditMode);
    row.insertBefore(editBtn, closeActivityBtn);

    const saveBtn = document.createElement('button');
    saveBtn.id = 'save-activity-btn';
    saveBtn.className = 'btn btn--primary hidden';
    saveBtn.type = 'button';
    saveBtn.style.flex = '1';
    saveBtn.textContent = t('save');
    saveBtn.addEventListener('click', saveActivityEdit);
    row.insertBefore(saveBtn, closeActivityBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit-btn';
    cancelBtn.className = 'btn btn--secondary hidden';
    cancelBtn.type = 'button';
    cancelBtn.textContent = t('cancel');
    cancelBtn.addEventListener('click', () => {
        if (currentActivity) renderActivityView(currentActivity);
    });
    row.insertBefore(cancelBtn, closeActivityBtn);
}

/* Kreira (jednom) formu za uređivanje unutar modala */
function ensureEditForm() {
    let form = document.getElementById('activity-edit-container');
    if (form) return form;

    const content = document.getElementById('activity-modal-content');
    if (!content || !content.parentNode) return null;

    form = document.createElement('div');
    form.id = 'activity-edit-container';
    form.className = 'activity-edit hidden';
    form.innerHTML = `
        <div class="form-group">
            <label class="form-label" for="edit-title">${t('editTitle')}</label>
            <input type="text" class="form-input" id="edit-title">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
                <label class="form-label" for="edit-date">${t('editDate')}</label>
                <input type="text" class="form-input" id="edit-date" placeholder="${tr({ hr: 'npr. 15. 03. 2026.', en: 'e.g. 15. 03. 2026.', it: 'es. 15. 03. 2026.' })}">
            </div>
            <div class="form-group">
                <label class="form-label" for="edit-year">${t('editYear')}</label>
                <input type="number" class="form-input" id="edit-year" min="1900" max="2100">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label" for="edit-content">${t('editContent')}</label>
            <textarea class="form-textarea" id="edit-content"></textarea>
            <small class="activity-edit__hint">${t('editContentHint')}</small>
        </div>
        <div class="form-group">
            <label class="form-label">${t('editImages')}</label>
            <div class="edit-thumbs" id="edit-thumbs"></div>
            <small class="activity-edit__hint">${t('editImagesHint')}</small>
            <input type="file" class="form-input" id="edit-new-images" accept="image/*" multiple style="margin-top: 0.75rem; padding: 0.6rem;">
        </div>
        <div class="edit-message" id="edit-message"></div>
    `;

    content.parentNode.insertBefore(form, content.nextSibling);

    const fileInput = form.querySelector('#edit-new-images');
    fileInput.addEventListener('change', () => {
        if (!editState) return;
        const files = Array.from(fileInput.files || []);
        const free = 3 - (editState.images.length + editState.newFiles.length);
        if (files.length > free) {
            alert(t('maxImages'));
            fileInput.value = '';
            return;
        }
        editState.newFiles = editState.newFiles.concat(files);
        fileInput.value = '';
        renderEditThumbs();
    });

    return form;
}

function enterEditMode() {
    if (!currentActivity || !isLoggedIn()) return;

    const form = ensureEditForm();
    if (!form) return;

    editState = {
        images: (currentActivity.images || []).slice(),
        newFiles: []
    };

    document.getElementById('edit-title').value = currentActivity.title || '';
    document.getElementById('edit-date').value = currentActivity.date || '';
    document.getElementById('edit-year').value = currentActivity.year || '';
    document.getElementById('edit-content').value = String(currentActivity.content || '')
        .replace(/\\n/g, '\n');
    document.getElementById('edit-message').textContent = '';

    renderEditThumbs();

    // Sakrij read-only prikaz
    document.getElementById('activity-modal-content').classList.add('hidden');
    const imagesContainer = document.getElementById('activity-modal-images');
    if (imagesContainer) imagesContainer.classList.add('hidden');
    form.classList.remove('hidden');

    // Gumbi
    toggleEl('edit-activity-btn', false);
    toggleEl('delete-activity-btn', false);
    toggleEl('close-activity-btn', false);
    toggleEl('save-activity-btn', true);
    toggleEl('cancel-edit-btn', true);
}

function exitEditMode(silent = false) {
    const form = document.getElementById('activity-edit-container');
    if (form) form.classList.add('hidden');

    const content = document.getElementById('activity-modal-content');
    if (content) content.classList.remove('hidden');

    const imagesContainer = document.getElementById('activity-modal-images');
    if (imagesContainer) imagesContainer.classList.remove('hidden');

    toggleEl('save-activity-btn', false);
    toggleEl('cancel-edit-btn', false);
    toggleEl('close-activity-btn', true);
    if (isLoggedIn()) {
        toggleEl('edit-activity-btn', true);
        toggleEl('delete-activity-btn', true);
    }

    editState = null;
}

function toggleEl(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
}

function renderEditThumbs() {
    const wrap = document.getElementById('edit-thumbs');
    if (!wrap || !editState) return;

    wrap.innerHTML = '';

    editState.images.forEach((src, i) => {
        wrap.appendChild(buildThumb(src, false, () => {
            editState.images.splice(i, 1);
            renderEditThumbs();
        }));
    });

    editState.newFiles.forEach((file, i) => {
        const url = URL.createObjectURL(file);
        wrap.appendChild(buildThumb(url, true, () => {
            URL.revokeObjectURL(url);
            editState.newFiles.splice(i, 1);
            renderEditThumbs();
        }));
    });
}

function buildThumb(src, isNew, onRemove) {
    const div = document.createElement('div');
    div.className = 'edit-thumb' + (isNew ? ' edit-thumb--new' : '');

    const img = document.createElement('img');
    setThumbSrc(img, src);
    img.alt = '';
    div.appendChild(img);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'edit-thumb__remove';
    btn.innerHTML = '&times;';
    btn.title = '✕';
    btn.addEventListener('click', onRemove);
    div.appendChild(btn);

    return div;
}

/* Spremanje izmjena: prvo server, ako ne uspije -> lokalno */
async function saveActivityEdit() {
    if (!editState || !currentActivity) return;

    const msg = document.getElementById('edit-message');
    const newTitle = document.getElementById('edit-title').value.trim();
    const newDate = document.getElementById('edit-date').value.trim();
    const newYear = document.getElementById('edit-year').value.trim();
    const newContent = document.getElementById('edit-content').value;

    if (!newTitle) {
        msg.textContent = t('editEmptyTitle');
        msg.style.color = '#ff4444';
        return;
    }

    const saveBtn = document.getElementById('save-activity-btn');
    if (saveBtn) saveBtn.disabled = true;
    msg.style.color = 'var(--text-secondary)';
    msg.textContent = '...';

    const fd = new FormData();
    fd.append('title', newTitle);
    fd.append('date', newDate);
    fd.append('year', newYear);
    fd.append('content', newContent);
    fd.append('keepImages', JSON.stringify(editState.images));
    await appendImagesWithThumbs(fd, editState.newFiles, 'images', 'thumbs');

    let serverOk = false;
    let serverActivity = null;
    let errorMessage = '';

    try {
        const res = await fetch('/api/aktivnosti/' + currentActivity.id + '/update', {
            method: 'POST',
            body: fd
        });

        const raw = await res.text();
        let data = null;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            // Server je vratio HTML umjesto JSON-a (npr. 404 stranica)
            throw new Error('HTTP ' + res.status + ' - ' + raw.slice(0, 120).replace(/\s+/g, ' '));
        }

        if (res.ok && data.success) {
            serverOk = true;
            serverActivity = data.activity;
        } else {
            errorMessage = data.message || ('HTTP ' + res.status);
        }
    } catch (err) {
        console.warn('Spremanje na server nije uspjelo:', err);
        errorMessage = err.message;
    }

    const patch = {
        title: newTitle,
        date: newDate,
        year: newYear ? Number(newYear) : currentActivity.year,
        content: newContent
    };

    let storageWarning = false;

    if (serverOk) {
        currentActivity = serverActivity || Object.assign({}, currentActivity, patch);
    } else {
        // Lokalni fallback - nove slike pretvori u data URL
        const localImages = editState.images.slice();
        try {
            for (const file of editState.newFiles) {
                localImages.push(await fileToDataUrl(file));
            }
        } catch (e) {
            storageWarning = true;
        }
        patch.images = localImages;

        try {
            saveLocalEdit(currentActivity.id, patch);
        } catch (e) {
            storageWarning = true;
            patch.images = editState.images.slice();
            try {
                saveLocalEdit(currentActivity.id, patch);
            } catch (e2) {
                msg.textContent = t('editError') + ' ' + errorMessage;
                msg.style.color = '#ff4444';
                if (saveBtn) saveBtn.disabled = false;
                return;
            }
        }

        currentActivity = Object.assign({}, currentActivity, patch);
    }

    allActivitiesData = allActivitiesData.map(a =>
        String(a.id) === String(currentActivity.id) ? currentActivity : a
    );

    // Osvježi prikaz
    renderActivityView(currentActivity);
    refreshActivityLists();
    renderLocalNotice();

    const after = document.getElementById('edit-message');
    if (after) {
        if (serverOk) {
            after.textContent = t('editSaved');
            after.style.color = '#00ff88';
        } else {
            after.textContent = (storageWarning ? t('storageFull') : t('editSavedLocal')) + ' (' + errorMessage + ')';
            after.style.color = '#ffb020';
        }
    }
    if (serverOk) {
        alert(t('editSaved'));
    } else {
        alert((storageWarning ? t('storageFull') : t('editSavedLocal')) + '\n\nRazlog: ' + errorMessage);
    }

    if (saveBtn) saveBtn.disabled = false;
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('read error'));
        reader.readAsDataURL(file);
    });
}

/* Brisanje aktivnosti: server, pa lokalni fallback */
async function deleteCurrentActivity() {
    if (!currentActivityId) return;
    if (!confirm(t('deleteConfirm'))) return;

    let serverOk = false;
    try {
        const res = await fetch('/api/aktivnosti/' + currentActivityId + '/delete', {
            method: 'POST'
        });
        const raw = await res.text();
        const data = JSON.parse(raw);
        serverOk = res.ok && data.success;
    } catch (err) {
        console.warn('Brisanje na serveru nije uspjelo:', err);
    }

    if (!serverOk) {
        saveLocalDelete(currentActivityId);
    }

    allActivitiesData = allActivitiesData.filter(a => String(a.id) !== String(currentActivityId));

    closeActivityModal();
    refreshActivityLists();
    renderLocalNotice();

    alert(serverOk ? t('deleted') : t('deletedLocal'));
}

/* Ponovno iscrtavanje lista bez ponovnog dohvaćanja JSON-a */
function refreshActivityLists() {
    const allActivities = document.getElementById('all-activities');
    if (allActivities) {
        const yearFilter = document.getElementById('year-filter');
        renderFilteredActivities(allActivities, 100, yearFilter ? yearFilter.value : 'all');
    }

    const homepage = document.getElementById('activities-container');
    if (homepage) {
        loadHomepageContent(homepage, 6);
    }
}

// ==================== Language Toggle ====================
function initLanguageToggle() {
    const langSelector = document.querySelector('.lang-selector');
    const langCurrent = document.querySelector('.lang-current');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!langSelector && !langCurrent) {
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            handleOldToggle(langToggle);
        }
        return;
    }

    const currentLang = getCurrentLang();
    const path = window.location.pathname;

    if (langCurrent) {
        const langLabels = { hr: 'HR', en: 'EN', it: 'IT' };
        langCurrent.textContent = langLabels[currentLang] + ' ▼';
    }

    langOptions.forEach(option => {
        const targetLang = option.dataset.lang;
        if (!targetLang) return;

        if (targetLang === currentLang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }

        option.href = getPathForLanguage(path, currentLang, targetLang);
    });
}

function getPathForLanguage(currentPath, fromLang, toLang) {
    let basePath = currentPath;

    if (fromLang === 'en') {
        basePath = currentPath.replace('/en/', '/');
    } else if (fromLang === 'it') {
        basePath = currentPath.replace('/it/', '/');
    }
    basePath = basePath.replace('//', '/');

    if (basePath === '/' || basePath === '') {
        basePath = '/index.html';
    }

    if (toLang === 'hr') {
        return basePath;
    } else {
        return '/' + toLang + basePath;
    }
}

// Fallback for old single toggle button
function handleOldToggle(langToggle) {
    const path = window.location.pathname;
    const currentLang = getCurrentLang();

    const nextLang = currentLang === 'hr' ? 'EN' : 'HR';
    langToggle.textContent = nextLang;

    langToggle.addEventListener('click', () => {
        const targetLang = nextLang.toLowerCase();
        window.location.href = getPathForLanguage(path, currentLang, targetLang);
    });
}

// ==================== Post Activity (for admin) ====================
async function postActivity(title, content) {
    alert(t('publishDisabled'));
    return { success: false };
}

// ==================== Upload Image (for admin) ====================
async function uploadImage(formData) {
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    } catch (err) {
        console.error('Error uploading image:', err);
        return { success: false };
    }
}

// ==================== Lightbox Gallery ====================
let lightboxImages = [];
let currentImageIndex = 0;
let lightboxRawPaths = false;
let lightboxInitialized = false;

/* Kreira #lightbox u DOM-u ako ga stranica nema */
function ensureLightbox() {
    let lightbox = document.getElementById('lightbox');

    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.id = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox__content">
                <button class="lightbox__close" aria-label="${tr({ hr: 'Zatvori', en: 'Close', it: 'Chiudi' })}">&times;</button>
                <button class="lightbox__nav lightbox__nav--prev" aria-label="${tr({ hr: 'Prethodna', en: 'Previous', it: 'Precedente' })}">&#10094;</button>
                <img class="lightbox__image" id="lightbox-image" src="" alt="">
                <button class="lightbox__nav lightbox__nav--next" aria-label="${tr({ hr: 'Sljedeća', en: 'Next', it: 'Successiva' })}">&#10095;</button>
                <div class="lightbox__caption" id="lightbox-caption"></div>
                <div class="lightbox__counter" id="lightbox-counter"></div>
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    initLightbox();
    return lightbox;
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightboxInitialized) return;
    lightboxInitialized = true;

    const closeBtn = lightbox.querySelector('.lightbox__close');
    const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    const nextBtn = lightbox.querySelector('.lightbox__nav--next');

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', () => navigateLightbox(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateLightbox(1));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(images, index = 0, rawPaths = false) {
    if (!images || images.length === 0) return;

    ensureLightbox();

    // Podrži i običan niz stringova
    lightboxImages = images.map(img =>
        typeof img === 'string' ? { src: img, description: '' } : img
    );
    lightboxRawPaths = rawPaths;
    currentImageIndex = index;

    updateLightboxImage();

    const lightbox = document.getElementById('lightbox');
    lightbox.classList.add('active');

    // Sakrij navigaciju ako je samo jedna slika
    const navs = lightbox.querySelectorAll('.lightbox__nav');
    navs.forEach(n => n.style.display = lightboxImages.length > 1 ? 'flex' : 'none');

    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.classList.remove('active');

    // Ako je ispod otvoren modal, zadrži zaključan scroll
    const activityModal = document.getElementById('activity-modal');
    const serviceModal = document.getElementById('service-modal');
    const modalOpen =
        (activityModal && activityModal.classList.contains('active')) ||
        (serviceModal && serviceModal.classList.contains('active'));

    if (!modalOpen) document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    if (lightboxImages.length === 0) return;
    currentImageIndex = (currentImageIndex + direction + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = lightboxImages[currentImageIndex];
    if (!img) return;

    const desc = getLocalizedDescription(img.description);
    const src = lightboxRawPaths
        ? img.src
        : (img.src.startsWith('/') ? img.src : '/' + img.src);

    const imgEl = document.getElementById('lightbox-image');
    const capEl = document.getElementById('lightbox-caption');
    const counterEl = document.getElementById('lightbox-counter');

    if (imgEl) {
        imgEl.src = src;
        imgEl.alt = desc || '';
    }
    if (capEl) capEl.textContent = desc || '';
    if (counterEl) {
        counterEl.textContent = lightboxImages.length > 1
            ? `${currentImageIndex + 1} / ${lightboxImages.length}`
            : '';
    }
}

// Load gallery from JSON
// Prvo API (uvijek svjež, bez keša - inače se obrisana slika i dalje prikazuje),
// a statični JSON samo kao rezerva kad server nije dostupan.
async function fetchGalleryData() {
    try {
        const res = await fetch('/api/galerija', { cache: 'no-store' });
        if (res.ok) return await res.json();
    } catch (e) { /* server nije dostupan */ }

    const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
    const res = await fetch(isSubdir ? '../data/galerija.json' : 'data/galerija.json', { cache: 'no-store' });
    return res.json();
}

async function loadGallery(category, containerId) {
    try {
        const data = await fetchGalleryData();
        const topLevelCategories = ['povijest', 'posjete', 'ostalo'];

        let images;
        if (topLevelCategories.includes(category)) {
            images = data[category] || [];
        } else {
            images = data.astrofotografija?.[category] || [];
        }

        renderGallery(images, containerId, category);
    } catch (err) {
        console.error('Error loading gallery:', err);
    }
}

function renderGallery(images, containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loggedIn = isLoggedIn();

    // Nove slike se u JSON dodaju na kraj - okreni da najnovije budu prve
    const ordered = (images || []).slice().reverse();

    container.innerHTML = ordered.map((img, index) => {
        const desc = getLocalizedDescription(img.description);
        const imgSrc = img.src.startsWith('/') ? img.src : '/' + img.src;

        const deleteBtn = loggedIn ?
            `<button type="button" class="btn btn--danger btn--sm gallery-item__delete" data-src="${escapeHtml(img.src)}" title="${escapeHtml(t('delete'))}" style="position: absolute; top: 5px; right: 5px; z-index: 10; padding: 2px 6px; font-size: 12px; opacity: 0.8;">✕</button>
            <button type="button" class="btn btn--primary btn--sm gallery-item__edit" data-index="${index}" title="${escapeHtml(t('editDescription'))}" style="position: absolute; top: 5px; right: 36px; z-index: 10; padding: 2px 6px; font-size: 12px; opacity: 0.8;">✎</button>`
            : '';

        return `
        <div class="gallery-item" data-index="${index}" style="position: relative;">
            ${deleteBtn}
            ${thumbImgHtml(imgSrc, desc)}
        </div>
    `}).join('');

    // Lightbox mora koristiti isti redoslijed kao prikaz
    window.galleryImages = ordered;
    container.dataset.category = category;
    ensureLightbox();

    if (!container.dataset.galleryBound) {
        container.dataset.galleryBound = '1';
        container.addEventListener('click', (e) => {
            const del = e.target.closest('.gallery-item__delete');
            if (del) {
                e.stopPropagation();
                deleteGalleryImage(del.dataset.src, container.dataset.category, container.id);
                return;
            }
            const edit = e.target.closest('.gallery-item__edit');
            if (edit) {
                e.stopPropagation();
                editGalleryDescription(window.galleryImages[parseInt(edit.dataset.index, 10)], container.id);
                return;
            }
            const item = e.target.closest('.gallery-item');
            if (item) openLightbox(window.galleryImages, parseInt(item.dataset.index, 10));
        });
    }
}

// Global function to delete gallery image
window.deleteGalleryImage = async function (src, category, containerId) {
    if (!confirm(t('deleteImageConfirm'))) return;

    try {
        const res = await fetch('/api/galerija/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src, category })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
            // Makni sliku iz prikaza bez ponovnog učitavanja (radi i za prikaz "Sve")
            const norm = p => String(p || '').replace(/^\/+/, '');
            const remaining = (window.galleryImages || []).filter(img => norm(img.src) !== norm(src));
            renderGallery(remaining.slice().reverse(), containerId, category);
            document.dispatchEvent(new CustomEvent('gallery:deleted', { detail: { src: norm(src) } }));
        } else {
            alert(data.message || t('deleteError'));
        }
    } catch (err) {
        console.error(err);
        alert(t('serverError'));
    }
};

// Uređivanje opisa slike (samo prijavljeni), na hrvatskom, engleskom i talijanskom.
// Prazan prijevod znači da se na tom jeziku prikazuje hrvatski opis.
function editGalleryDescription(img, containerId) {
    if (!img) return;

    let overlay = document.getElementById('gallery-edit-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gallery-edit-modal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <button type="button" class="modal__close" data-close aria-label="${escapeHtml(tr({ hr: 'Zatvori', en: 'Close', it: 'Chiudi' }))}">&times;</button>
                <div class="modal__header">
                    <h3 class="modal__title">${escapeHtml(t('editDescription'))}</h3>
                </div>
                <img class="gallery-edit__preview" alt="" style="width: 100%; max-height: 220px; object-fit: contain; border-radius: 8px; margin-bottom: 1rem;">
                ${['hr', 'en', 'it'].map(l => `
                <div class="form-group">
                    <label class="form-label" for="gallery-edit-${l}">${{ hr: 'Hrvatski', en: 'English', it: 'Italiano' }[l]}</label>
                    <textarea class="form-textarea gallery-edit__text" id="gallery-edit-${l}" data-lang="${l}" rows="3"></textarea>
                </div>`).join('')}
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button type="button" class="btn btn--secondary" data-close>${escapeHtml(t('cancel'))}</button>
                    <button type="button" class="btn btn--primary gallery-edit__save">${escapeHtml(t('save'))}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const close = () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        overlay.addEventListener('click', e => {
            if (e.target === overlay || e.target.closest('[data-close]')) close();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) close();
        });
        overlay.close = close;
    }

    const fields = Array.from(overlay.querySelectorAll('.gallery-edit__text'));
    const saveBtn = overlay.querySelector('.gallery-edit__save');
    const preview = overlay.querySelector('.gallery-edit__preview');
    const current = img.description && typeof img.description === 'object'
        ? img.description
        : { hr: img.description || '' };

    setThumbSrc(preview, img.src.startsWith('/') ? img.src : '/' + img.src);
    fields.forEach(f => { f.value = current[f.dataset.lang] || ''; });
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    (fields.find(f => f.dataset.lang === getCurrentLang()) || fields[0]).focus();

    saveBtn.onclick = async () => {
        saveBtn.disabled = true;
        try {
            const res = await fetch('/api/galerija/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    src: img.src,
                    description: Object.fromEntries(fields.map(f => [f.dataset.lang, f.value]))
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                // Isti objekt dijele prikaz i lightbox (i cache stranice astrofotografije)
                img.description = data.description;
                renderGallery((window.galleryImages || []).slice().reverse(), containerId,
                    document.getElementById(containerId).dataset.category);
                overlay.close();
            } else {
                alert(data.message || t('saveError'));
            }
        } catch (err) {
            console.error(err);
            alert(t('serverError'));
        } finally {
            saveBtn.disabled = false;
        }
    };
}

function getLocalizedDescription(desc) {
    if (!desc) return '';
    if (typeof desc === 'string') return desc;

    const lang = getCurrentLang();
    if (lang === 'en') return desc.en || desc.hr || '';
    if (lang === 'it') return desc.it || desc.hr || '';
    return desc.hr || desc.en || '';
}

// ==================== Galerija: Slike aktivnosti ====================
/*
 * Slike se ne kopiraju nigdje - čitaju se izravno iz data/aktivnosti.json,
 * pa je ova galerija uvijek u sinkronizaciji s aktivnostima.
 */

let activityGalleryAll = [];   // svi zapisi {src, title, date, year, activity}
let activityGalleryShown = []; // trenutno prikazani (za lightbox indekse)

async function initActivityGalleryPage() {
    const container = document.getElementById('activity-gallery');
    if (!container) return;

    const raw = await fetchJsonSafe('data/aktivnosti.json');
    const activities = applyLocalOverrides(raw || []);

    activityGalleryAll = [];

    activities
        .slice()
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))
        .forEach(activity => {
            (activity.images || []).forEach(src => {
                if (!src) return;
                activityGalleryAll.push({
                    src: src,
                    title: activity.title || t('untitled'),
                    date: activity.date || '',
                    year: activity.year || new Date(parseDate(activity.date)).getFullYear(),
                    activity: activity
                });
            });
        });

    setupActivityGalleryFilter();
    renderActivityGallery('all');
}

function setupActivityGalleryFilter() {
    const select = document.getElementById('activity-gallery-year');
    if (!select || select.options.length > 0) return;

    const years = [...new Set(activityGalleryAll.map(i => i.year).filter(y => y))]
        .sort((a, b) => b - a);

    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = t('allYears');
    select.appendChild(allOpt);

    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
    });

    select.addEventListener('change', () => renderActivityGallery(select.value));
}

function renderActivityGallery(filterYear = 'all') {
    const container = document.getElementById('activity-gallery');
    const countEl = document.getElementById('activity-gallery-count');
    if (!container) return;

    activityGalleryShown = (filterYear && filterYear !== 'all')
        ? activityGalleryAll.filter(i => String(i.year) === String(filterYear))
        : activityGalleryAll.slice();

    container.innerHTML = '';

    if (activityGalleryShown.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1;">${t('noContent')}</p>`;
        if (countEl) countEl.textContent = '';
        return;
    }

    activityGalleryShown.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.title = item.date ? `${item.title} (${item.date})` : item.title;

        const img = document.createElement('img');
        setThumbSrc(img, item.src);
        img.alt = item.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        div.appendChild(img);

        div.addEventListener('click', () => {
            openLightbox(
                activityGalleryShown.map(i => ({
                    src: i.src,
                    description: i.date ? `${i.title} — ${i.date}` : i.title
                })),
                index,
                true // zadrži originalne putanje
            );
        });

        container.appendChild(div);
    });

    if (countEl) {
        countEl.textContent = `${activityGalleryShown.length} ${activityGalleryShown.length === 1
            ? tr({ hr: 'slika', en: 'photo', it: 'foto' })
            : tr({ hr: 'slika', en: 'photos', it: 'foto' })}`;
    }
}

// ==================== Library Catalog (CSV) ====================
async function loadLibraryCatalog(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
    const csvPath = isSubdir ? '../books.csv' : 'books.csv';

    try {
        if (window.location.protocol === 'file:') {
            throw new Error('Local file access blocked by browser security (CORS). Please run via server (node server.js).');
        }

        const response = await fetch(csvPath);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        const csvText = await response.text();
        const books = parseCSV(csvText);

        renderLibraryCatalog(books, container);
    } catch (err) {
        console.error('Error loading library catalog:', err);
        const errorMsg = tr({
            hr: 'Greška pri učitavanju. Ako koristite lokalne datoteke, molimo pokrenite lokalni server (node server.js).',
            en: 'Error loading data. If using local files, please use a local server (node server.js).',
            it: 'Errore nel caricamento dei dati. Se usi file locali, avvia un server locale (node server.js).'
        });

        container.innerHTML = `
            <div class="text-center" style="color: var(--text-muted); padding: 1rem;">
                <p>${errorMsg}</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem; color: #e74c3c;">${escapeHtml(err.message || '')}</p>
            </div>
        `;
    }
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^\t"]+)(?=\s*\t|\s*$)/g);
        if (!row) continue;

        const clean = (val) => {
            if (!val) return '';
            val = val.trim();
            if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
            return val;
        };

        result.push({
            title: clean(row[0]),
            author: clean(row[1]),
            year: clean(row[2]),
            publisher: clean(row[3]),
            place: clean(row[4]),
            isbn: clean(row[5]),
            adip_id: clean(row[6]),
            language: translateBookLanguage(clean(row[7])),
            condition: clean(row[8])
        });
    }
    return result;
}

function renderLibraryCatalog(books, container) {
    container.innerHTML = '';

    let state = {
        data: [...books],
        sortField: null,
        sortAsc: true,
        filters: {}
    };

    const processData = () => {
        let processed = books.filter(book => {
            return Object.keys(state.filters).every(key => {
                const term = state.filters[key].toLowerCase();
                const val = (book[key] || '').toLowerCase();
                return val.includes(term);
            });
        });

        if (state.sortField) {
            processed.sort((a, b) => {
                const valA = (a[state.sortField] || '').toLowerCase();
                const valB = (b[state.sortField] || '').toLowerCase();
                if (valA < valB) return state.sortAsc ? -1 : 1;
                if (valA > valB) return state.sortAsc ? 1 : -1;
                return 0;
            });
        }
        return processed;
    };

    const headers = [
        { key: 'title', label: tr({ hr: 'Naslov', en: 'Title', it: 'Titolo' }) },
        { key: 'author', label: tr({ hr: 'Autor', en: 'Author', it: 'Autore' }) },
        { key: 'year', label: tr({ hr: 'Godina', en: 'Year', it: 'Anno' }) },
        { key: 'publisher', label: tr({ hr: 'Naklada', en: 'Publisher', it: 'Editore' }) },
        { key: 'place', label: tr({ hr: 'Mjesto', en: 'Place', it: 'Luogo' }) },
        { key: 'isbn', label: 'ISBN' },
        { key: 'adip_id', label: 'ID' },
        { key: 'language', label: tr({ hr: 'Jezik', en: 'Lang', it: 'Lingua' }) }
    ];

    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 900px; font-size: 0.9rem;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--accent-primary);">
                        ${headers.map(h => `
                            <th style="padding: 0.5rem; text-align: left; vertical-align: top; min-width: 120px;">
                                <div class="sort-header" data-key="${h.key}" style="cursor: pointer; color: var(--accent-primary); margin-bottom: 0.25rem;">
                                    ${h.label} <span class="sort-icon"></span>
                                </div>
                                <input type="text" data-filter="${h.key}" class="column-filter form-input" 
                                       placeholder="..." 
                                       style="width: 100%; padding: 0.25rem; font-size: 0.8rem; padding-left: 0.5rem;">
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody id="library-table-body"></tbody>
            </table>
        </div>
        <p id="library-count" style="margin-top: 0.5rem; font-size: 0.8rem; text-align: right; color: var(--text-muted);"></p>
    `;

    const updateTable = () => {
        const processed = processData();
        const tbody = document.getElementById('library-table-body');
        const count = document.getElementById('library-count');

        if (!tbody) return;

        if (processed.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center;">${tr({ hr: 'Nema pronađenih knjiga.', en: 'No books found.', it: 'Nessun libro trovato.' })}</td></tr>`;
        } else {
            tbody.innerHTML = processed.map(book => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <td style="padding: 0.5rem;">${escapeHtml(book.title)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.author)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.year)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.publisher)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.place)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.isbn)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.adip_id)}</td>
                    <td style="padding: 0.5rem;">${escapeHtml(book.language)}</td>
                </tr>
            `).join('');
        }

        if (count) count.textContent = `${processed.length} ${tr({ hr: 'knjiga', en: 'books', it: 'libri' })}`;

        container.querySelectorAll('.sort-icon').forEach(span => span.textContent = '');
        if (state.sortField) {
            const activeHeader = container.querySelector(`.sort-header[data-key="${state.sortField}"] .sort-icon`);
            if (activeHeader) activeHeader.textContent = state.sortAsc ? '▲' : '▼';
        }
    };

    container.querySelectorAll('.sort-header').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.key;
            if (state.sortField === key) {
                state.sortAsc = !state.sortAsc;
            } else {
                state.sortField = key;
                state.sortAsc = true;
            }
            updateTable();
        });
    });

    container.querySelectorAll('.column-filter').forEach(input => {
        input.addEventListener('input', (e) => {
            const key = e.target.dataset.filter;
            state.filters[key] = e.target.value;
            updateTable();
        });
    });

    updateTable();
}

function openLibraryModal() {
    const title = tr({ hr: 'Katalog knjiga Pulske Zvjezdarnice', en: 'Pula Observatory Book Catalog', it: 'Catalogo dei libri dell’Osservatorio di Pola' });

    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.getElementById('close-modal');

    if (!modal || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = '<div id="library-catalog-container" style="padding: 1rem;">' + tr({ hr: 'Učitavanje…', en: 'Loading…', it: 'Caricamento…' }) + '</div>';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        modalBody.innerHTML = '';
        closeBtn.removeEventListener('click', closeModal);
    };
    closeBtn.addEventListener('click', closeModal);

    loadLibraryCatalog('library-catalog-container');
}

function openAsteroidGame() {
    const title = 'Spot the Asteroid';
    const gameUrl = '/games/asteroid.html';

    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.getElementById('close-modal');

    if (!modal || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = `
        <div style="width: 100%; height: 80vh;">
            <iframe src="${gameUrl}" 
                    style="width: 100%; height: 100%; border: none; border-radius: 8px;" 
                    allow="autoplay; encrypted-media"></iframe>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        modalBody.innerHTML = '';
        closeBtn.removeEventListener('click', closeModal);
    };
    closeBtn.addEventListener('click', closeModal);
}