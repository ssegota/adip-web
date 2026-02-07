/**
 * ADIP Modern Website - Main JavaScript
 * Handles: Navigation, Login Modal, Activity Loading, Language Toggle
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
        imageNotFound: 'Slika nije dostupna za odabrani mjesec'
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
        imageNotFound: 'Image not available for selected month'
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
        imageNotFound: 'Immagine non disponibile per il mese selezionato'
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

let allActivitiesData = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLoginModal();
    initLanguageToggle();
    initActivityModal();
    initActivityForm();

    // Load mixed content on homepage
    const activitiesContainer = document.getElementById('activities-container');
    if (activitiesContainer) {
        loadHomepageContent(activitiesContainer, 6); // Show 6 mixed items
    }

    const allActivities = document.getElementById('all-activities');
    if (allActivities) {
        loadActivities(allActivities, 100); // Show all on activities page
    }

    // Init Radovi
    initRadoviPage();
});

// ==================== Homepage Logic (Mixed Content) ====================
async function loadHomepageContent(container, limit = 6) {
    try {
        // Fetch both sources parallel
        const [actRes, radRes] = await Promise.all([
            fetch('/api/aktivnosti').catch(() => ({ json: () => [] })),
            fetch('/api/radovi').catch(() => ({ json: () => [] }))
        ]);

        const activities = await actRes.json();
        const radovi = await radRes.json();

        // Normalize data for merging
        const normalizedActivities = (activities || []).map(a => ({
            ...a,
            type: 'activity',
            sortDate: parseDate(a.date)
        }));

        const normalizedRadovi = (radovi || []).map(r => ({
            ...r,
            // Radovi have 'year' but maybe no exact date. Use Jan 1st of year + small offset or 'dateAdded' if available?
            // User added 'dateAdded' in json manually. Let's use that if exists, else year.
            sortDate: parseDate(r.dateAdded || `01. 01. ${r.year}.`),
            isRad: true
        }));

        // Merge and sort desc
        const mixed = [...normalizedActivities, ...normalizedRadovi]
            .sort((a, b) => b.sortDate - a.sortDate)
            .slice(0, limit);

        container.innerHTML = mixed.map(item => {
            if (item.isRad) {
                // Render Rad card
                const isPdf = item.type === 'pdf';
                const icon = isPdf ? '📄' : '🔗';
                const linkText = isPdf ? t('downloadPdf') : t('openLink');
                return `
                <div class="activity-card" style="border-left: 3px solid var(--accent-secondary);">
                    <div class="activity-card__date">${t('publication')} | ${item.year}</div>
                    <h3 class="activity-card__title">${icon} ${item.title}</h3>
                    <p class="activity-card__content" style="flex:1;">${item.abstract ? item.abstract.substring(0, 100) + '...' : t('noAbstract')}</p>
                    <div style="margin-top: 1rem;">
                            <a href="${item.link}" target="_blank" class="btn btn--secondary btn--sm">${linkText}</a>
                    </div>
                </div>`;
            } else {
                // Render Activity card
                const imageHtml = item.images && item.images.length > 0
                    ? `<div class="activity-card__image" style="background-image: url('${item.images[0]}')"></div>`
                    : '';
                return `
                <div class="activity-card" onclick="openActivityModal(${item.id})">
                    ${imageHtml}
                    <div class="activity-card__content-wrapper">
                        <div class="activity-card__date">${item.date}</div>
                        <h3 class="activity-card__title">${item.title}</h3>
                        <p class="activity-card__content">${item.content.substring(0, 100)}...</p>
                    </div>
                </div>`;
            }
        }).join('');

    } catch (err) {
        console.error('Error loading homepage content:', err);
        container.innerHTML = `<p>${t('errorLoading')}</p>`;
    }
}

// Helper: Parse DD. MM. YYYY. to Date object
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.replace('.', '').split('.');
    if (parts.length < 3) return new Date(0);
    // hr date format: DD. MM. YYYY. -> parts[2]-parts[1]-parts[0]
    return new Date(`${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`);
}

// ==================== Radovi Page Logic ====================
function initRadoviPage() {
    const listContainer = document.getElementById('radovi-list');
    const uploadForm = document.getElementById('radovi-upload-form');
    // Admin Upload Logic
    const adminPanel = document.getElementById('radovi-admin-panel');
    const loginBtn = document.getElementById('sidebar-login-btn');

    const isLoggedIn = localStorage.getItem('adip_token');

    if (isLoggedIn && adminPanel) {
        adminPanel.classList.remove('hidden');
        if (loginBtn) loginBtn.textContent = 'Odjava'; // Hardcoded for now or use t('logout') if available in context
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
        const response = await fetch('/api/radovi');
        allRadovi = await response.json();

        renderRadovi(container, allRadovi);

        // Setup search functionality
        const searchInput = document.getElementById('radovi-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const filtered = allRadovi.filter(rad => {
                    return rad.title.toLowerCase().includes(query) ||
                        rad.authors.toLowerCase().includes(query) ||
                        String(rad.year).includes(query) ||
                        (rad.abstract && rad.abstract.toLowerCase().includes(query));
                });
                renderRadovi(container, filtered);
            });
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>${t('errorLoading')}</p>`;
    }
}

function renderRadovi(container, radovi) {
    const isLoggedIn = localStorage.getItem('adip_token');

    container.innerHTML = '';

    if (!radovi || radovi.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">${t('noContent')}</p>`;
        return;
    }

    radovi.forEach(rad => {
        const isPdf = rad.type === 'pdf';
        const icon = isPdf ? '📄' : '🔗';
        const linkText = isPdf ? t('downloadPdf') : t('openLink');

        const deleteBtn = isLoggedIn ?
            `<button onclick="deleteRad(${rad.id})" class="btn btn--danger btn--sm" style="margin-left: auto;">${t('deleteConfirm') ? '🗑️' : '🗑️'}</button>` : '';

        const card = document.createElement('div');
        card.className = 'activity-card'; // Reuse activity card style
        card.id = `rad-${rad.id}`;
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="activity-card__date">${rad.year} | ${rad.authors}</div>
                ${deleteBtn}
            </div>
            <h3 class="activity-card__title">${icon} ${rad.title}</h3>
            <p class="activity-card__content" style="flex:1;">${rad.abstract || t('noAbstract')}</p>
            <div style="margin-top: 1rem;">
                 <a href="${rad.link}" target="_blank" class="btn btn--secondary btn--sm">${linkText}</a>
            </div>
        `;
        container.appendChild(card);
    });
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
            alert(t('errorAdd')); // Reuse error message or add 'Error deleting'
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
    if (dateInput) {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('title', document.getElementById('activity-title').value);
            formData.append('content', document.getElementById('activity-content').value);
            formData.append('year', document.getElementById('activity-year').value);

            const dateInput = document.getElementById('activity-date');

            // Set default date to today if empty (on load, this should be done outside submit, but user asked for default)
            // Ideally we set it when form inits.
            if (dateInput && !dateInput.value) {
                // dateInput type="date" expects YYYY-MM-DD
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }

            if (dateInput && dateInput.value) {
                formData.append('date', dateInput.value);
            }

            // Add images
            const images = document.getElementById('activity-images');
            if (images && images.files) {
                for (let i = 0; i < Math.min(images.files.length, 3); i++) {
                    formData.append('images', images.files[i]);
                }
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

    // Close nav when clicking a link
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

    // Check if already logged in
    updateLoginButton();

    function handleLoginClick() {
        const token = localStorage.getItem('adip_token');
        if (token) {
            // Logout
            localStorage.removeItem('adip_token');
            updateLoginButton();
            window.location.reload();
        } else {
            // Show modal
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

            // Client-side mock login for GitHub Pages
            if (username === 'admin' && password === 'adip2026') {
                localStorage.setItem('adip_token', 'demo-token');
                loginMessage.textContent = t('loginSuccess');
                loginMessage.style.color = '#00ff88';
                setTimeout(() => {
                    modal.classList.remove('active');
                    updateLoginButton();
                    window.location.reload();
                }, 1000);
            } else {
                loginMessage.textContent = t('loginError');
                loginMessage.style.color = '#ff4444';
            }
        });
    }
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
        // Use relative path based on language directory
        const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
        const response = await fetch(isSubdir ? '../data/aktivnosti.json' : 'data/aktivnosti.json');
        allActivitiesData = await response.json();

        if (!allActivitiesData || allActivitiesData.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted);">${t('noActivities')}</p>`;
            return;
        }

        // Setup year filter if on aktivnosti page
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter && yearFilter.options.length === 0) {
            setupYearFilter(yearFilter, allActivitiesData);
            return; // setupYearFilter will call loadActivities again with filter
        }

        // Filter by year if specified
        let filtered = allActivitiesData;
        if (filterYear && filterYear !== 'all') {
            filtered = allActivitiesData.filter(a => a.year == filterYear);
        }

        const toShow = filtered.slice(0, limit);
        container.innerHTML = '';

        if (toShow.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted);">${t('noActivitiesYear')}</p>`;
            return;
        }

        toShow.forEach(activity => {
            const card = document.createElement('article');
            card.className = 'activity-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="activity-card__date">${activity.date || 'N/A'}</div>
                <h3 class="activity-card__title">${activity.title || t('untitled')}</h3>
                <p class="activity-card__content">${truncateText(activity.content, 150)}</p>
                <span style="color: var(--accent-primary); font-size: 0.85rem;">${t('readMore')}</span>
            `;
            card.addEventListener('click', () => showActivityModal(activity));
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading activities:', err);
        container.innerHTML = `<p style="color: var(--text-muted);">${t('errorLoading')}</p>`;
    }
}

function setupYearFilter(select, activities) {
    const years = [...new Set(activities.map(a => a.year).filter(y => y))].sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();

    // Add "All" option
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

    // Set default to current year if available, otherwise first year
    if (years.includes(currentYear)) {
        select.value = currentYear;
    } else if (years.length > 0) {
        select.value = years[0];
    }

    // Add change listener
    select.addEventListener('change', () => {
        const container = document.getElementById('all-activities');
        if (container) {
            renderFilteredActivities(container, 100, select.value);
        }
    });

    // Trigger initial filter
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

    const toShow = filtered.slice(0, limit);
    container.innerHTML = '';

    if (toShow.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">${t('noActivitiesYear')}</p>`;
        return;
    }

    toShow.forEach(activity => {
        const card = document.createElement('article');
        card.className = 'activity-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="activity-card__date">${activity.date || 'N/A'}</div>
            <h3 class="activity-card__title">${activity.title || t('untitled')}</h3>
            <p class="activity-card__content">${truncateText(activity.content, 150)}</p>
            <span style="color: var(--accent-primary); font-size: 0.85rem;">${t('readMore')}</span>
        `;
        card.addEventListener('click', () => showActivityModal(activity));
        container.appendChild(card);
    });
}

function truncateText(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// ==================== Activity Modal ====================
let currentActivityId = null;

function initActivityModal() {
    const activityModal = document.getElementById('activity-modal');
    const closeBtn = document.getElementById('close-activity-modal');
    const closeActivityBtn = document.getElementById('close-activity-btn');
    const deleteBtn = document.getElementById('delete-activity-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            activityModal.classList.remove('active');
        });
    }

    if (closeActivityBtn) {
        closeActivityBtn.addEventListener('click', () => {
            activityModal.classList.remove('active');
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!currentActivityId) return;
            if (!confirm(t('deleteConfirm'))) return;

            try {
                const response = await fetch(`/api/aktivnosti/${currentActivityId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();

                if (data.success) {
                    alert(t('serviceAdded') ? 'Aktivnost obrisana!' : 'Activity deleted!'); // Reuse or add trans
                    activityModal.classList.remove('active');
                    // Reload activities
                    const allActivities = document.getElementById('all-activities');
                    if (allActivities) {
                        loadActivities(allActivities, 100);
                    }
                    // Also reload homepage if needed
                    const activitiesContainer = document.getElementById('activities-container');
                    if (activitiesContainer) {
                        loadHomepageContent(activitiesContainer, 6);
                    }
                } else {
                    alert(t('errorAdd') || 'Error deleting');
                }
            } catch (err) {
                console.error(err);
                alert(t('serverError'));
            }
        });
    }

    if (activityModal) {
        activityModal.addEventListener('click', (e) => {
            if (e.target === activityModal) {
                activityModal.classList.remove('active');
            }
        });
    }
}

function showActivityModal(activity) {
    const modal = document.getElementById('activity-modal');
    const title = document.getElementById('activity-modal-title');
    const date = document.getElementById('activity-modal-date');
    const content = document.getElementById('activity-modal-content');
    const imagesContainer = document.getElementById('activity-modal-images');
    const deleteBtn = document.getElementById('delete-activity-btn');
    const isLoggedIn = localStorage.getItem('adip_token');

    currentActivityId = activity.id;

    if (modal && title && content) {
        title.textContent = activity.title || t('untitled');
        date.textContent = activity.date || '';
        content.textContent = activity.content || '';

        // Show/hide delete button based on login status
        if (deleteBtn) {
            if (isLoggedIn) {
                deleteBtn.classList.remove('hidden');
            } else {
                deleteBtn.classList.add('hidden');
            }
        }

        // Display images if available
        if (imagesContainer) {
            imagesContainer.innerHTML = '';
            if (activity.images && activity.images.length > 0) {
                activity.images.forEach(imgUrl => {
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = activity.title;
                    img.style.cssText = 'width: 150px; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;';
                    img.addEventListener('click', () => {
                        window.open(imgUrl, '_blank');
                    });
                    imagesContainer.appendChild(img);
                });
            }
        }

        modal.classList.add('active');
    }
}

// ==================== Language Toggle ====================
function initLanguageToggle() {
    // The language selector is now a dropdown in HTML
    // This function sets the current language indicator and handles link generation
    const langSelector = document.querySelector('.lang-selector');
    const langCurrent = document.querySelector('.lang-current');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!langSelector && !langCurrent) {
        // Fallback for old toggle button
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            handleOldToggle(langToggle);
        }
        return;
    }

    const currentLang = getCurrentLang();
    const path = window.location.pathname;

    // Update current language display
    if (langCurrent) {
        const langLabels = { hr: '🇭🇷 HR', en: '🇬🇧 EN', it: '🇮🇹 IT' };
        langCurrent.textContent = langLabels[currentLang] + ' ▼';
    }

    // Mark current language as active and set correct hrefs
    langOptions.forEach(option => {
        const targetLang = option.dataset.lang;
        if (!targetLang) return;

        // Mark active
        if (targetLang === currentLang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }

        // Calculate href
        option.href = getPathForLanguage(path, currentLang, targetLang);
    });
}

function getPathForLanguage(currentPath, fromLang, toLang) {
    let basePath = currentPath;

    // Remove current language prefix if present
    if (fromLang === 'en') {
        basePath = currentPath.replace('/en/', '/');
    } else if (fromLang === 'it') {
        basePath = currentPath.replace('/it/', '/');
    }
    // Clean up any double slashes
    basePath = basePath.replace('//', '/');

    // Handle root path
    if (basePath === '/' || basePath === '') {
        basePath = '/index.html';
    }

    // Add target language prefix
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

    // Set button text to next language
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
        const response = await fetch('http://localhost:3000/api/upload', {
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

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const closeBtn = lightbox.querySelector('.lightbox__close');
    const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    const nextBtn = lightbox.querySelector('.lightbox__nav--next');

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', () => navigateLightbox(-1));
    nextBtn?.addEventListener('click', () => navigateLightbox(1));

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

function openLightbox(images, index = 0) {
    lightboxImages = images;
    currentImageIndex = index;
    updateLightboxImage();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    currentImageIndex = (currentImageIndex + direction + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = lightboxImages[currentImageIndex];
    const desc = getLocalizedDescription(img.description);
    // Ensure absolute path
    const src = img.src.startsWith('/') ? img.src : '/' + img.src;
    document.getElementById('lightbox-image').src = src;
    document.getElementById('lightbox-caption').textContent = desc || '';
}

// Load gallery from JSON
async function loadGallery(category, containerId) {
    try {
        // Use relative path based on language directory
        const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
        const response = await fetch(isSubdir ? '../data/galerija.json' : 'data/galerija.json');
        const data = await response.json();

        // Top-level categories (not astrofotografija subcategories)
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

    const isLoggedIn = localStorage.getItem('adip_token');

    container.innerHTML = images.map((img, index) => {
        const desc = getLocalizedDescription(img.description);
        // Ensure src is absolute path
        const imgSrc = img.src.startsWith('/') ? img.src : '/' + img.src;

        const deleteBtn = isLoggedIn ?
            `<button onclick="event.stopPropagation(); deleteGalleryImage('${imgSrc}', '${category}', '${containerId}')" class="btn btn--danger btn--sm" style="position: absolute; top: 5px; right: 5px; z-index: 10; padding: 2px 6px; font-size: 12px; opacity: 0.8; border: none; border-radius: 4px; color: white;">✕</button>`
            : '';

        return `
        <div class="gallery-item" onclick="openLightbox(galleryImages, ${index})" style="position: relative;">
            ${deleteBtn}
            <img src="${imgSrc}" alt="${desc || ''}" loading="lazy">
        </div>
    `}).join('');

    // Store for lightbox
    window.galleryImages = images;
}

// Global function to delete gallery image
window.deleteGalleryImage = async function (src, category, containerId) {
    if (!confirm(t('deleteConfirm'))) return;

    try {
        const res = await fetch('/api/galerija/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src, category })
        });

        const data = await res.json();
        if (data.success) {
            // Reload gallery
            loadGallery(category, containerId);
        } else {
            alert(t('errorAdd')); // Reuse error message
        }
    } catch (err) {
        console.error(err);
        alert(t('serverError'));
    }
};

function getLocalizedDescription(desc) {
    if (!desc) return '';
    if (typeof desc === 'string') return desc;

    const lang = getCurrentLang();
    if (lang === 'en') return desc.en || desc.hr || '';
    if (lang === 'it') return desc.it || desc.hr || '';
    return desc.hr || desc.en || '';
}

// ==================== Library Catalog (CSV) ====================
async function loadLibraryCatalog(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Detect if we are in a language subdirectory
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
        const errorMsg = isEnglish
            ? 'Error loading data. If using local files, please use a local server (node server.js).'
            : 'Greška pri učitavanju. Ako koristite lokalne datoteke, molimo pokrenite lokalni server (node server.js).';

        container.innerHTML = `
            <div class="text-center" style="color: var(--text-muted); padding: 1rem;">
                <p>⚠️ ${t('errorLoad') || 'Error loading data'}</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem; color: #e74c3c;">${err.message || errorMsg}</p>
            </div>
        `;
    }
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    // We expect standard headers, but let's be robust
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        // Handle CSV lines with potential quoted fields containing commas
        // Regex: Match quoted string OR non-comma-non-quote sequence
        const row = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!row) continue;

        // Manual mapping based on "Naslov,Autor(i),Godina izdanja,Naklada,Mjesto,ISBN,ADIP-broj,Jezik,Stanje (1-5)"
        // Note: User edited the CSV to potentially remove empty fields, so we rely on index.

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
            language: clean(row[7]),
            condition: clean(row[8])
        });
    }
    return result;
}

function renderLibraryCatalog(books, container) {
    const isEnglish = window.location.pathname.includes('/en/');
    container.innerHTML = ''; // Clear "Loading..."

    // State for filtering and sorting
    let state = {
        data: [...books],
        sortField: null,
        sortAsc: true,
        filters: {}
    };

    // Helper: Sort and Filter Data
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

    const render = () => {
        const filteredBooks = processData();

        const headers = [
            { key: 'title', label: isEnglish ? 'Title' : 'Naslov' },
            { key: 'author', label: isEnglish ? 'Author' : 'Autor' },
            { key: 'year', label: isEnglish ? 'Year' : 'Godina' },
            { key: 'publisher', label: isEnglish ? 'Publisher' : 'Naklada' },
            { key: 'place', label: isEnglish ? 'Place' : 'Mjesto' },
            { key: 'isbn', label: 'ISBN' }, // Often empty but present
            { key: 'adip_id', label: 'ID' },
            { key: 'language', label: isEnglish ? 'Lang' : 'Jezik' }
        ];

        // Create Header (Sortable) + Filter Row
        let tableHtml = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 900px; font-size: 0.9rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--accent-primary);">
                            ${headers.map(h => `
                                <th style="padding: 0.5rem; text-align: left; vertical-align: top; min-width: 100px;">
                                    <div class="sort-header" data-key="${h.key}" style="cursor: pointer; color: var(--accent-primary); margin-bottom: 0.25rem;">
                                        ${h.label} ${state.sortField === h.key ? (state.sortAsc ? '▲' : '▼') : ''}
                                    </div>
                                    <input type="text" data-filter="${h.key}" class="column-filter form-input" 
                                           placeholder="..." 
                                           value="${state.filters[h.key] || ''}"
                                           style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (filteredBooks.length === 0) {
            tableHtml += `<tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center;">${isEnglish ? 'No books found.' : 'Nema pronađenih knjiga.'}</td></tr>`;
        } else {
            filteredBooks.forEach(book => {
                tableHtml += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <td style="padding: 0.5rem;">${book.title || ''}</td>
                        <td style="padding: 0.5rem;">${book.author || ''}</td>
                        <td style="padding: 0.5rem;">${book.year || ''}</td>
                        <td style="padding: 0.5rem;">${book.publisher || ''}</td>
                        <td style="padding: 0.5rem;">${book.place || ''}</td>
                        <td style="padding: 0.5rem;">${book.isbn || ''}</td>
                        <td style="padding: 0.5rem;">${book.adip_id || ''}</td>
                        <td style="padding: 0.5rem;">${book.language || ''}</td>
                    </tr>
                `;
            });
        }

        tableHtml += '</tbody></table></div>';
        tableHtml += `<p style="margin-top: 0.5rem; font-size: 0.8rem; text-align: right; color: var(--text-muted);">${filteredBooks.length} ${isEnglish ? 'books' : 'knjiga'}</p>`;

        container.innerHTML = tableHtml;

        // Re-attach event listeners
        container.querySelectorAll('.sort-header').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.dataset.key;
                if (state.sortField === key) {
                    state.sortAsc = !state.sortAsc;
                } else {
                    state.sortField = key;
                    state.sortAsc = true;
                }
                render();
            });
        });

        container.querySelectorAll('.column-filter').forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.filter;
                state.filters[key] = e.target.value;
                // Debounce could be added here, but for client-side valid
                requestAnimationFrame(() => {
                    // We don't partial render, we re-render full table but keep input focus?
                    // Re-rendering replacing inputs makes them lose focus. 
                    // Better strategy: Filter data, update rows only? 
                    // For simplicity, we just update the specific rows. BUT replacing HTML kills focus.
                    // Let's implement a simpler "Enter to search" or just live filter but careful with focus.

                    // Actually, re-rendering the whole table on every keystroke causes input focus loss.
                    // Solution: Don't re-render inputs. Just re-render tbody.
                });
            });
            // Optimization: Only re-render on 'change' or 'blur' or Enter?
            // Or better: Separate Header and Body logic.
        });

        // Quick fix for focus loss: Re-focus the input after render
        // This is a bit hacky but works for simple implementations
        const focused = document.activeElement;
        if (focused && focused.dataset && focused.dataset.filter) {
            const input = container.querySelector(`input[data-filter="${focused.dataset.filter}"]`);
            if (input) {
                input.focus();
                input.selectionStart = input.value.length;
                input.selectionEnd = input.value.length;
            }
        }
    };

    // Split render to avoid destroying inputs
    // We will render the Structure once, then update Body

    // Initial Render Loop
    // To handle focus correctly, we need to bind listeners once or preserve elements.
    // Simplified approach: Render structure once. Update rows on change.

    const headers = [
        { key: 'title', label: isEnglish ? 'Title' : 'Naslov' },
        { key: 'author', label: isEnglish ? 'Author' : 'Autor' },
        { key: 'year', label: isEnglish ? 'Year' : 'Godina' },
        { key: 'publisher', label: isEnglish ? 'Publisher' : 'Naklada' },
        { key: 'place', label: isEnglish ? 'Place' : 'Mjesto' },
        { key: 'isbn', label: 'ISBN' },
        { key: 'adip_id', label: 'ID' },
        { key: 'language', label: isEnglish ? 'Lang' : 'Jezik' }
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
            tbody.innerHTML = `<tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center;">${isEnglish ? 'No books found.' : 'Nema pronađenih knjiga.'}</td></tr>`;
        } else {
            tbody.innerHTML = processed.map(book => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <td style="padding: 0.5rem;">${book.title || ''}</td>
                    <td style="padding: 0.5rem;">${book.author || ''}</td>
                    <td style="padding: 0.5rem;">${book.year || ''}</td>
                    <td style="padding: 0.5rem;">${book.publisher || ''}</td>
                    <td style="padding: 0.5rem;">${book.place || ''}</td>
                    <td style="padding: 0.5rem;">${book.isbn || ''}</td>
                    <td style="padding: 0.5rem;">${book.adip_id || ''}</td>
                    <td style="padding: 0.5rem;">${book.language || ''}</td>
                </tr>
            `).join('');
        }

        count.textContent = `${processed.length} ${isEnglish ? 'books' : 'knjiga'}`;

        // Update Sort Icons
        container.querySelectorAll('.sort-icon').forEach(span => span.textContent = '');
        if (state.sortField) {
            const activeHeader = container.querySelector(`.sort-header[data-key="${state.sortField}"] .sort-icon`);
            if (activeHeader) activeHeader.textContent = state.sortAsc ? '▲' : '▼';
        }
    };

    // Bind Events
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

    // Initial Render
    updateTable();
}

function openLibraryModal() {
    const isEnglish = window.location.pathname.includes('/en/');
    const title = isEnglish ? 'Pula Observatory Book Catalog' : 'Katalog knjiga Pulske Zvjezdarnice';

    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.getElementById('close-modal');

    if (!modal || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = '<div id="library-catalog-container" style="padding: 1rem;">Loading...</div>';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close handler
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
    const isEnglish = window.location.pathname.includes('/en/');
    const title = 'Spot the Asteroid';

    // Path to the game file.
    // If we are in /en/, we need ../games/asteroid.html
    const gameUrl = isEnglish ? '../games/asteroid.html' : 'games/asteroid.html';

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
