// Services Page Logic

const PULA_COORDS = { lat: 44.8683, lng: 13.8481 };

// Load services on page load
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    initAdminPanel();
    renderAstronomyWidget();
    renderTideWidget();

    // Lightbox / Modal logic
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    const serviceModal = document.getElementById('service-modal');
    if (serviceModal) {
        serviceModal.addEventListener('click', (e) => {
            if (e.target.id === 'service-modal') closeModal();
        });
    }
});

function getLocale() {
    return window.location.pathname.includes('/en/') ? 'en-US' : 'hr-HR';
}

// Admin Panel Toggle
function initAdminPanel() {
    const token = localStorage.getItem('adip_token');
    const adminPanel = document.getElementById('admin-service-panel');
    if (token && adminPanel) {
        adminPanel.classList.remove('hidden');

        document.getElementById('service-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('service-title').value;
            const url = document.getElementById('service-url').value;
            const type = document.getElementById('service-type').value;

            try {
                const response = await fetch('/api/servisi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, url, type })
                });
                const result = await response.json();
                if (result.success) {
                    alert(t('serviceAdded'));
                    loadServices();
                    e.target.reset();
                } else {
                    alert(t('serviceAddError'));
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
}

// Fetch and render generic services
async function loadServices() {
    try {
        const response = await fetch('/api/servisi');
        const services = await response.json();
        const container = document.getElementById('user-services-grid');
        container.innerHTML = '';

        services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card glass-card';
            card.onclick = () => openModal(service.title, service.url, service.type);

            card.innerHTML = `
        <div class="service-icon">🔗</div>
        <h3 class="service-title">${service.title}</h3>
      `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to load services', err);
    }
}

// Modal Logic
function openModal(title, contentSrc, type) {
    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = title;
    modalBody.innerHTML = '';

    if (type === 'iframe') {
        const iframe = document.createElement('iframe');
        iframe.src = contentSrc;
        iframe.style.width = '100%';
        iframe.style.height = '80vh';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        modalBody.appendChild(iframe);
    } else if (type === 'image') {
        const img = document.createElement('img');
        img.src = contentSrc;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '80vh';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        modalBody.appendChild(img);
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('service-modal');
    modal.classList.remove('active');
    document.getElementById('modal-body').innerHTML = ''; // Clear content to stop iframe
}

function getPhaseName(phase) {
    if (phase < 0.03) return t('moonNew');
    if (phase < 0.25) return t('moonWaxingCrescent');
    if (phase < 0.28) return t('moonFirstQuarter');
    if (phase < 0.5) return t('moonWaxingGibbous');
    if (phase < 0.53) return t('moonFull');
    if (phase < 0.75) return t('moonWaningGibbous');
    if (phase < 0.78) return t('moonLastQuarter');
    return t('moonWaningCrescent');
}

// ==================== WIDGET: ASTRONOMY (Sun/Moon) ====================
function renderAstronomyWidget() {
    const now = new Date();

    if (typeof SunCalc === 'undefined') {
        console.warn('SunCalc library not loaded');
        return;
    }

    // Using SunCalc (loaded via CDN in HTML)
    const sunTimes = SunCalc.getTimes(now, PULA_COORDS.lat, PULA_COORDS.lng);
    const moonIllumination = SunCalc.getMoonIllumination(now);

    const formatTime = (date) => date ? date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) : '--:--';

    document.getElementById('astro-sunrise').textContent = formatTime(sunTimes.sunrise);
    document.getElementById('astro-sunset').textContent = formatTime(sunTimes.sunset);

    // Moon Phase
    const phase = moonIllumination.phase; // 0.0 - 1.0
    let phaseName = getPhaseName(phase);

    let phaseIcon = '';
    if (phase < 0.03) phaseIcon = '🌑';
    else if (phase < 0.25) phaseIcon = '🌒';
    else if (phase < 0.28) phaseIcon = '🌓';
    else if (phase < 0.5) phaseIcon = '🌔';
    else if (phase < 0.53) phaseIcon = '🌕';
    else if (phase < 0.75) phaseIcon = '🌖';
    else if (phase < 0.78) phaseIcon = '🌗';
    else phaseIcon = '🌘';

    document.getElementById('astro-moon-phase').innerHTML = `${phaseIcon} ${phaseName}`;
    document.getElementById('astro-moon-illum').textContent = `${Math.round(moonIllumination.fraction * 100)}%`;
}

// Open Astronomy Modal with Sunrise/Sunset Image
window.openAstronomyModal = function openAstronomyModal() {
    console.log("Opening Astronomy Modal");
    try {
        const modal = document.getElementById('service-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        modalTitle.textContent = t('sunriseSunsetTitle') || 'Izlazak i zalazak Sunca';

        // Build month/year selectors
        const monthOptions = [];
        const monthNames = getLocale().includes('en')
            ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            : getLocale().includes('it')
                ? ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
                : ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];

        for (let m = 1; m <= 12; m++) {
            const selected = m === currentMonth ? 'selected' : '';
            monthOptions.push(`<option value="${m}" ${selected}>${monthNames[m - 1]}</option>`);
        }

        const yearOptions = [];
        for (let y = 2014; y <= 2026; y++) {
            const selected = y === currentYear ? 'selected' : '';
            yearOptions.push(`<option value="${y}" ${selected}>${y}</option>`);
        }

        const basePath = getImageBasePath();
        const initialImageUrl = getSunriseImageUrl(currentYear, currentMonth, basePath);

        let html = `
        <div style="padding: 1rem;">
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; justify-content: center;">
                <label style="color: var(--text-secondary);">${t('selectMonth') || 'Mjesec'}:</label>
                <select id="sunrise-month-select" class="form-input" style="width: auto; min-width: 120px;">
                    ${monthOptions.join('')}
                </select>
                <label style="color: var(--text-secondary);">${t('selectYear') || 'Godina'}:</label>
                <select id="sunrise-year-select" class="form-input" style="width: auto; min-width: 100px;">
                    ${yearOptions.join('')}
                </select>
                <button class="btn btn--primary" onclick="updateSunriseImage()">${t('show') || 'Prikaži'}</button>
            </div>
            <div id="sunrise-image-container" style="text-align: center;">
                <img id="sunrise-image" src="${initialImageUrl}" alt="Sunrise/Sunset Calendar" 
                     style="max-width: 100%; max-height: 70vh; border-radius: 8px;"
                     onerror="this.src=''; this.alt='${t('imageNotFound') || 'Slika nije dostupna za odabrani mjesec'}'; this.style.display='none'; document.getElementById('sunrise-error').style.display='block';">
                <p id="sunrise-error" style="display: none; color: var(--text-muted); padding: 2rem;">${t('imageNotFound') || 'Slika nije dostupna za odabrani mjesec'}</p>
            </div>
        </div>
        `;

        modalBody.innerHTML = html;
        modal.classList.add('active');
    } catch (e) {
        console.error("Error in openAstronomyModal:", e);
        alert(t('genericError') + e.message);
    }
}

// Helper to get base path for images
function getImageBasePath() {
    const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
    return isSubdir ? '../sites/default/files/images/servisi/sunrises-tides/' : 'sites/default/files/images/servisi/sunrises-tides/';
}

// Get sunrise image URL - tries different naming patterns
function getSunriseImageUrl(year, month, basePath) {
    const monthPadded = month.toString().padStart(2, '0');
    // Primary format: ncal_YYYY_MM.gif
    return `${basePath}ncal_${year}_${monthPadded}.gif`;
}

// Update sunrise image based on selections
window.updateSunriseImage = function () {
    const month = parseInt(document.getElementById('sunrise-month-select').value);
    const year = parseInt(document.getElementById('sunrise-year-select').value);
    const basePath = getImageBasePath();

    const img = document.getElementById('sunrise-image');
    const errorMsg = document.getElementById('sunrise-error');

    img.style.display = 'block';
    errorMsg.style.display = 'none';
    img.src = getSunriseImageUrl(year, month, basePath);
}


// ==================== WIDGET: TIDES (Simulated Graph) ====================
// Note: We simulate a tide curve based on moon phase for visualization purposes.
// Real tide prediction requires complex harmonic constants or external API.
function renderTideWidget() {
    const ctx = document.getElementById('tideChart')?.getContext('2d');
    if (!ctx) return;

    // Generate data points for 24h
    const labels = [];
    const data = [];

    const now = new Date();
    const moonIllum = typeof SunCalc !== 'undefined' ? SunCalc.getMoonIllumination(now).fraction : 0.5;

    // Spring Tides (MAX) at New (0.0) and Full (1.0)
    // Neap Tides (MIN) at Quarters (0.5)
    // Logic: |fraction - 0.5| * 2 => (0->1, 0.5->0, 1->1) where 1 is Spring
    const springFactor = Math.abs(moonIllum - 0.5) * 2;

    // Scale amplitude: Neap = 50% of Spring
    // Base 0.5 + up to 0.5 based on springFactor
    const amplitude = 0.5 + (springFactor * 0.5);

    for (let i = 0; i <= 24; i++) {
        labels.push(`${i}:00`);
        const offset = now.getDate() * 0.8;
        const val = Math.sin((i + offset) * (2 * Math.PI / 12.4)) * amplitude;
        data.push(val);
    }

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js library not loaded');
        return;
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: t('tideLevel'),
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa', maxTicksLimit: 6 } },
                y: { display: false, min: -1.5, max: 1.5 }
            }
        }
    });
}

// Open Tide Modal with Tide Image
window.openTideModal = function openTideModal() {
    console.log("Opening Tide Modal");
    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    modalTitle.textContent = t('tideTitle') || 'Plima i oseka';

    // Build month/year selectors
    const monthOptions = [];
    const monthNames = getLocale().includes('en')
        ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        : getLocale().includes('it')
            ? ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
            : ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];

    for (let m = 1; m <= 12; m++) {
        const selected = m === currentMonth ? 'selected' : '';
        monthOptions.push(`<option value="${m}" ${selected}>${monthNames[m - 1]}</option>`);
    }

    const yearOptions = [];
    for (let y = 2014; y <= 2026; y++) {
        const selected = y === currentYear ? 'selected' : '';
        yearOptions.push(`<option value="${y}" ${selected}>${y}</option>`);
    }

    const basePath = getImageBasePath();
    const initialImageUrl = getTideImageUrl(currentYear, currentMonth, basePath);

    let html = `
    <div style="padding: 1rem;">
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; justify-content: center;">
            <label style="color: var(--text-secondary);">${t('selectMonth') || 'Mjesec'}:</label>
            <select id="tide-month-select" class="form-input" style="width: auto; min-width: 120px;">
                ${monthOptions.join('')}
            </select>
            <label style="color: var(--text-secondary);">${t('selectYear') || 'Godina'}:</label>
            <select id="tide-year-select" class="form-input" style="width: auto; min-width: 100px;">
                ${yearOptions.join('')}
            </select>
            <button class="btn btn--primary" onclick="updateTideImage()">${t('show') || 'Prikaži'}</button>
        </div>
        <div id="tide-image-container" style="text-align: center;">
            <img id="tide-image" src="${initialImageUrl}" alt="Tide Calendar" 
                 style="max-width: 100%; max-height: 70vh; border-radius: 8px;"
                 onerror="this.src=''; this.alt='${t('imageNotFound') || 'Slika nije dostupna za odabrani mjesec'}'; this.style.display='none'; document.getElementById('tide-error').style.display='block';">
            <p id="tide-error" style="display: none; color: var(--text-muted); padding: 2rem;">${t('imageNotFound') || 'Slika nije dostupna za odabrani mjesec'}</p>
        </div>
    </div>
    `;

    modalBody.innerHTML = html;
    modal.classList.add('active');
}

// Get tide image URL
function getTideImageUrl(year, month, basePath) {
    const monthPadded = month.toString().padStart(2, '0');
    // Primary format: adip_YYYY-MM.jpg
    return `${basePath}adip_${year}-${monthPadded}.jpg`;
}

// Update tide image based on selections
window.updateTideImage = function () {
    const month = parseInt(document.getElementById('tide-month-select').value);
    const year = parseInt(document.getElementById('tide-year-select').value);
    const basePath = getImageBasePath();

    const img = document.getElementById('tide-image');
    const errorMsg = document.getElementById('tide-error');

    img.style.display = 'block';
    errorMsg.style.display = 'none';
    img.src = getTideImageUrl(year, month, basePath);
}

function drawTideCanvas(canvasId, date) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Configuration
    const centerY = h / 2;
    const amplitude = h * 0.35; // Leaving clear space top/bottom

    // Moon influence
    const moonIllum = SunCalc.getMoonIllumination(date).fraction;
    const tideFactor = 0.5 + (moonIllum * 0.5); // Higher tides at full/new moon

    // Draw Axis Line
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();

    // Draw Sine Wave
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;

    // Simulation params
    // 2 semi-diurnal tides per day (approx 12.4h period)
    const dayOffset = date.getDate() * 0.8; // Phase shift per day

    for (let x = 0; x <= w; x++) {
        const timeRatio = x / w; // 0 to 1 (0h to 24h)
        const hour = timeRatio * 24;

        // y = sin(B(x + C)) + D
        // Period T = 12.4h -> B = 2*PI / 12.4
        const y = Math.sin((hour + dayOffset) * (2 * Math.PI / 12.4)) * (amplitude * tideFactor);

        const canvasY = centerY - y; // Invert Y because canvas 0 is top

        if (x === 0) ctx.moveTo(x, canvasY);
        else ctx.lineTo(x, canvasY);
    }
    ctx.stroke();

    // Draw Times (approx peaks)
    ctx.fillStyle = '#666';
    ctx.font = '9px Arial';
    // Ideally we would calculate local maxima/minima here
    // But for simulation, let's keep it clean as requested image
}
