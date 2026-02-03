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

// Open Astronomy Modal with Monthly Data
window.openAstronomyModal = function openAstronomyModal() {
    console.log("Opening Astronomy Modal");
    try {
        if (typeof SunCalc === 'undefined') {
            alert(t('suncalcError'));
            return;
        }

        const modal = document.getElementById('service-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const locale = getLocale();

        const monthName = now.toLocaleString(locale, { month: 'long' });
        // Capitalize first letter
        const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        modalTitle.textContent = `${t('sunMoonTitle')} ${monthNameCap} ${currentYear}`;

        // Generate Table
        let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 600px;">
                <thead style="background: rgba(255,255,255,0.05); border-bottom: 2px solid var(--border-glass);">
                    <tr>
                        <th style="padding: 0.75rem; text-align: left;">${t('astroDate')}</th>
                        <th style="padding: 0.75rem; text-align: left;">${t('astroSunrise')}</th>
                        <th style="padding: 0.75rem; text-align: left;">${t('astroSunset')}</th>
                        <th style="padding: 0.75rem; text-align: left;">${t('astroMoonPhase')}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const formatTime = (date) => date ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '--:--';

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day, 12, 0, 0); // Noon to avoid timezone issues
            const sunTimes = SunCalc.getTimes(date, PULA_COORDS.lat, PULA_COORDS.lng);
            const moonIllum = SunCalc.getMoonIllumination(date);

            let phaseIcon = '';
            const p = moonIllum.phase;
            if (p < 0.03) phaseIcon = '🌑';
            else if (p < 0.25) phaseIcon = '🌒';
            else if (p < 0.28) phaseIcon = '🌓';
            else if (p < 0.5) phaseIcon = '🌔';
            else if (p < 0.53) phaseIcon = '🌕';
            else if (p < 0.75) phaseIcon = '🌖';
            else if (p < 0.78) phaseIcon = '🌗';
            else phaseIcon = '🌘';

            // Highlight current day
            const isToday = day === now.getDate();
            const rowStyle = isToday ? 'background: rgba(52, 152, 219, 0.1); font-weight: bold;' : 'border-bottom: 1px solid rgba(0,0,0,0.05);';

            html += `
                <tr style="${rowStyle}">
                    <td style="padding: 0.75rem;">${day}.${currentMonth + 1}.</td>
                    <td style="padding: 0.75rem;">${formatTime(sunTimes.sunrise)}</td>
                    <td style="padding: 0.75rem;">${formatTime(sunTimes.sunset)}</td>
                    <td style="padding: 0.75rem;">${phaseIcon} ${Math.round(moonIllum.fraction * 100)}%</td>
                </tr>
            `;
        }

        html += `
                </tbody>
            </table>
        </div>
        `;

        modalBody.innerHTML = html;
        modal.classList.add('active');
    } catch (e) {
        console.error("Error in openAstronomyModal:", e);
        alert(t('genericError') + e.message);
    }
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

// Open Tide Modal with Monthly Calendar
window.openTideModal = function openTideModal() {
    console.log("Opening Tide Modal");
    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (typeof SunCalc === 'undefined') {
        alert(t('suncalcError'));
        return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const locale = getLocale();

    const monthName = now.toLocaleString(locale, { month: 'long' });

    modalTitle.textContent = `${t('tideTitle')} ${monthName.toUpperCase()} ${currentYear}.`;

    // Calendar Grid Structure
    let html = `
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border-glass); border: 1px solid var(--border-glass);">
    `;

    // Headers - Dynamic based on locale, starting Monday
    // Generate dates for a known Monday week (e.g. Jan 5 1970)
    const dayHeaders = [];
    for (let i = 0; i < 7; i++) {
        // Jan 5, 1970 is Monday
        const d = new Date(1970, 0, 5 + i);
        dayHeaders.push(d.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase());
    }

    dayHeaders.forEach(day => {
        html += `<div style="background: var(--bg-card); padding: 5px; text-align: center; font-weight: bold; font-size: 0.8rem;">${day}</div>`;
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayIndex = (firstDay.getDay() + 6) % 7; // Shift so Mon=0, Sun=6
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before 1st of month
    for (let i = 0; i < startingDayIndex; i++) {
        html += `<div style="background: var(--bg-card); min-height: 100px;"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayOfWeek = date.getDay(); // 0=Sun
        const isSunday = dayOfWeek === 0;
        const color = isSunday ? '#e74c3c' : 'var(--text-primary)';
        const moonIllum = SunCalc.getMoonIllumination(date);

        let moonIcon = '';
        if (moonIllum.phase < 0.05) moonIcon = '🌑'; // New
        else if (moonIllum.phase > 0.23 && moonIllum.phase < 0.27) moonIcon = '🌓'; // First Q
        else if (moonIllum.phase > 0.48 && moonIllum.phase < 0.52) moonIcon = '🌕'; // Full
        else if (moonIllum.phase > 0.73 && moonIllum.phase < 0.77) moonIcon = '🌗'; // Last Q

        const canvasId = `tide-canvas-${day}`;

        html += `
        <div style="background: #fff; color: #000; position: relative; min-height: 100px; padding: 2px; overflow: hidden;">
            <div style="position: absolute; top: 2px; left: 2px; font-weight: bold; color: ${isSunday ? 'red' : 'black'}; font-size: 0.9rem; z-index: 2;">${day}</div>
            <div style="position: absolute; top: 2px; right: 2px; font-size: 1rem; z-index: 2;">${moonIcon}</div>
            <div style="margin-top: 15px; height: 80px; width: 100%;">
                <canvas id="${canvasId}" width="150" height="80" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
        </div>
        `;
    }

    html += `</div>`; // Close grid

    // Add Legend/Footer
    html += `
    <div style="margin-top: 10px; font-size: 0.8rem; text-align: center; color: var(--text-muted);">
        ${t('tideDisclaimer')}
    </div>
    `;

    modalBody.innerHTML = html;
    modal.classList.add('active');

    // Draw the graphs after DOM insertion
    setTimeout(() => {
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            drawTideCanvas(`tide-canvas-${day}`, date);
        }
    }, 50);
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
