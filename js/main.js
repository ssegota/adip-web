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
        sunMoonTitle: 'Sunce i Mjesec -'
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
        sunMoonTitle: 'Sun and Moon -'
    }
};

function t(key) {
    const isEnglish = window.location.pathname.includes('/en/');
    const lang = isEnglish ? 'en' : 'hr';
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

async function loadRadovi(container) {
    try {
        const response = await fetch('/api/radovi');
        const radovi = await response.json();
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

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>${t('errorLoading')}</p>`;
    }
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
                const response = await fetch('http://localhost:3000/api/aktivnosti', {
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
        // Use absolute path for robustness
        const response = await fetch('/data/aktivnosti.json');
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
            alert(t('deleteDisabled'));
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
    const langToggle = document.getElementById('lang-toggle');
    if (!langToggle) return;

    // Detect language from URL
    const path = window.location.pathname;
    const isEnglish = path.includes('/en/');

    // Set Button Text
    langToggle.textContent = isEnglish ? 'HR' : 'EN';

    langToggle.addEventListener('click', () => {
        let newPath;

        if (isEnglish) {
            // Switch to Croatian (remove /en/)
            newPath = path.replace('/en/', '/');
            // Handle edge case where /en/ might be at the start but replaced to //
            newPath = newPath.replace('//', '/');
        } else {
            // Switch to English (prepend /en/)
            // Ensure we handle root path correctly
            if (path === '/' || path === '/index.html') {
                newPath = '/en/index.html';
            } else {
                newPath = '/en' + path;
            }
        }

        // Redirect
        window.location.href = newPath;
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
        // Use absolute path
        const response = await fetch('/data/galerija.json');
        const data = await response.json();

        let images;
        if (category === 'povijest') {
            images = data.povijest || [];
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

    const isEnglish = window.location.pathname.includes('/en/');
    return isEnglish ? (desc.en || desc.hr || '') : (desc.hr || desc.en || '');
}
