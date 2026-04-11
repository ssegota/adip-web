let poiData = [];
let activeFilters = {
    type: 'all',
    search: ''
};

const mapContainer = document.getElementById('mapContainer');
const moonMap = document.getElementById('moonMap');
const markersOverlay = document.getElementById('markersOverlay');
const zoomView = document.getElementById('zoomView');
const poiTitle = document.getElementById('poiTitle');
const poiImageContainer = document.getElementById('poiImageContainer');
const poiDescription = document.getElementById('poiDescription');
const poiSearch = document.getElementById('poiSearch');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentPOIId = null;
let currentTimer = null;

// Fetch and init
async function init() {
    try {
        const response = await fetch('/data/poiData.json');
        poiData = await response.json();
        renderMarkers();
        initEventListeners();
    } catch (err) {
        console.error('Failed to load POI data:', err);
    }
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

function renderMarkers() {
    markersOverlay.innerHTML = '';
    
    // Near-side is approx -90 to 90 Longitude. 
    // We center the projection on 0,0.
    poiData.forEach(poi => {
        const latRad = degToRad(poi.lat);
        const longRad = degToRad(poi.long);
        
        // Orthographic projection components
        const cosLat = Math.cos(latRad);
        const cosLong = Math.cos(longRad);
        const sinLat = Math.sin(latRad);
        const sinLong = Math.sin(longRad);
        
        // Visibility: point must be on near side with margin from limb.
        // cos(c) = cosLat*cosLong at lat0=0, long0=0.
        // Threshold 0.06 keeps markers clearly inside the disk.
        const isVisible = cosLat * cosLong > 0.06;

        if (!isVisible) return;

        const marker = document.createElement('div');
        marker.className = `marker type-${poi.type}`;
        marker.dataset.id = poi.id;
        
        // Orthographic x, y in [-1, 1]
        const x_coord = cosLat * sinLong;
        const y_coord = sinLat;
        
        // FullMoon2010.jpg: moon disk fills ~94% of the image (r ≈ 47% each side).
        // Use 46 to keep all markers visibly inside the disk boundary.
        const r_scale = 46;
        const x_pct = 50 + x_coord * r_scale;
        const y_pct = 50 - y_coord * r_scale;
        
        marker.style.left = x_pct + '%';
        marker.style.top = y_pct + '%';
        
        marker.addEventListener('mouseenter', () => { if (!editMode) showPOI(poi.id); });
        initDrag(marker, poi);
        markersOverlay.appendChild(marker);
    });
    
    updateMarkerVisibility();
}

function updateMarkerVisibility() {
    const markers = markersOverlay.querySelectorAll('.marker');
    markers.forEach(marker => {
        const id = marker.dataset.id;
        const poi = poiData.find(p => p.id === id);
        
        if (!poi) return;

        const matchesSearch = poi.title.toLowerCase().includes(activeFilters.search.toLowerCase());
        const matchesType = activeFilters.type === 'all' || poi.type === activeFilters.type;
        const isNearSide = poi.long >= -90 && poi.long <= 90;

        if (matchesSearch && matchesType && isNearSide) {
            marker.classList.remove('hidden');
        } else {
            marker.classList.add('hidden');
        }
    });
}

function showPOI(id) {
    if (id === currentPOIId) return;
    currentPOIId = id;
    
    if (currentTimer) clearTimeout(currentTimer);
    
    // Smooth transition start
    poiTitle.style.opacity = 0;
    poiTitle.style.transform = 'translateY(10px)';
    poiImageContainer.style.opacity = 0;
    poiDescription.style.opacity = 0;
    poiDescription.style.transform = 'translateY(5px)';
    
    currentTimer = setTimeout(() => {
        const poi = poiData.find(p => p.id === id);
        if (!poi) return;

        poiTitle.textContent = poi.title;
        const imgEl = document.createElement('img');
        imgEl.alt = poi.title;
        imgEl.style.width = '100%';
        imgEl.style.height = '100%';
        imgEl.style.objectFit = 'cover';
        imgEl.src = poi.image || '';
        imgEl.onerror = () => {
            // Try Wikimedia API as fallback
            const searchName = encodeURIComponent(poi.title);
            imgEl.onerror = () => { imgEl.style.display = 'none'; };
            imgEl.src = `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${searchName}.jpg&width=640`;
        };
        imgEl.id = 'poiImg';
        // Remove only the previous img; keep imageEditOverlay intact
        const old = poiImageContainer.querySelector('#poiImg');
        if (old) old.remove();
        poiImageContainer.insertBefore(imgEl, poiImageContainer.firstChild);
        poiDescription.textContent = poi.description;
        
        poiTitle.style.opacity = 1;
        poiTitle.style.transform = 'translateY(0)';
        poiImageContainer.style.opacity = 1;
        poiDescription.style.opacity = 1;
        poiDescription.style.transform = 'translateY(0)';
    }, 200);
}

function initEventListeners() {
    // Search
    poiSearch.addEventListener('input', (e) => {
        activeFilters.search = e.target.value;
        updateMarkerVisibility();
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilters.type = btn.dataset.type;
            updateMarkerVisibility();
        });
    });

    // Zoom logic
    mapContainer.addEventListener('mousemove', (e) => {
        const rect = moonMap.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;
        
        if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
            const zoomLevel = 8;
            zoomView.style.backgroundPosition = `${relX * 100}% ${relY * 100}%`;
            zoomView.style.backgroundSize = `${zoomLevel * 100}%`;
        }
    });

    // Handle overlay resize
    const updateOverlaySize = () => {
        const rect = moonMap.getBoundingClientRect();
        // The moon image is square; use the smaller dimension so overlay
        // matches the actual rendered circle on both axes.
        const dim = Math.min(rect.width, rect.height);
        markersOverlay.style.width = dim + 'px';
        markersOverlay.style.height = dim + 'px';
    };
    
    window.addEventListener('resize', updateOverlaySize);
    moonMap.addEventListener('load', updateOverlaySize);
    if (moonMap.complete) updateOverlaySize();

    // ─── Edit Mode ───────────────────────────────────────────────────────────
    const editModeBtn  = document.getElementById('editModeBtn');
    const saveBtn      = document.getElementById('saveBtn');
    const exportBtn    = document.getElementById('exportBtn');
    const coordReadout = document.getElementById('coordReadout');

    // Password modal elements
    const passwordModal   = document.getElementById('passwordModal');
    const passwordInput   = document.getElementById('passwordInput');
    const passwordConfirm = document.getElementById('passwordConfirm');
    const passwordCancel  = document.getElementById('passwordCancel');
    const passwordError   = document.getElementById('passwordError');

    // SHA-256 hash of default password "lunar" — change hash to change password.
    const PASS_HASH = '9738b6bf3ae32f433b04b1c3687ac8fec5bf4383b44086c7fb09c5e2a81991cf';

    async function hashPassword(pw) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function activateEditMode() {
        editMode = true;
        document.body.classList.add('edit-mode');
        editModeBtn.classList.add('active');
        editModeBtn.textContent = 'Exit Edit';
        saveBtn.classList.remove('hidden');
        exportBtn.classList.remove('hidden');
        coordReadout.classList.remove('hidden');
        renderMarkers();
    }

    function deactivateEditMode() {
        editMode = false;
        document.body.classList.remove('edit-mode');
        editModeBtn.classList.remove('active');
        editModeBtn.textContent = 'Edit Mode';
        saveBtn.classList.add('hidden');
        exportBtn.classList.add('hidden');
        coordReadout.classList.add('hidden');
        renderMarkers();
    }

    editModeBtn.addEventListener('click', () => {
        if (editMode) {
            deactivateEditMode();
        } else {
            // Show password modal
            passwordInput.value = '';
            passwordError.classList.add('hidden');
            passwordModal.classList.remove('hidden');
            setTimeout(() => passwordInput.focus(), 50);
        }
    });

    async function tryUnlock() {
        const hash = await hashPassword(passwordInput.value);
        if (hash === PASS_HASH) {
            passwordModal.classList.add('hidden');
            activateEditMode();
        } else {
            passwordError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    passwordConfirm.addEventListener('click', tryUnlock);
    passwordCancel.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
    });
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryUnlock();
        if (e.key === 'Escape') passwordCancel.click();
    });

    // Save → POST to Vite middleware → overwrites public/data/poiData.json
    saveBtn.addEventListener('click', async () => {
        saveBtn.classList.add('saving');
        saveBtn.textContent = 'Saving...';
        try {
            const res = await fetch('/api/save-poi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(poiData, null, 2)
            });
            const data = await res.json();
            if (data.ok) {
                saveBtn.textContent = 'Saved!';
                setTimeout(() => { saveBtn.textContent = 'Save'; }, 2000);
            } else {
                saveBtn.textContent = 'Error!';
                setTimeout(() => { saveBtn.textContent = 'Save'; }, 2000);
            }
        } catch (e) {
            saveBtn.textContent = 'Error!';
            setTimeout(() => { saveBtn.textContent = 'Save'; }, 2000);
        } finally {
            saveBtn.classList.remove('saving');
        }
    });

    // Export download
    exportBtn.addEventListener('click', () => {
        const json = JSON.stringify(poiData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'poiData.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Image URL editor
    const imageEditOverlay = document.getElementById('imageEditOverlay');
    const imageUrlInput    = document.getElementById('imageUrlInput');
    const imageUrlSave     = document.getElementById('imageUrlSave');
    const imageUrlCancel   = document.getElementById('imageUrlCancel');

    poiImageContainer.addEventListener('click', () => {
        if (!editMode || !currentPOIId) return;
        const poi = poiData.find(p => p.id === currentPOIId);
        if (!poi) return;
        imageUrlInput.value = poi.image || '';
        imageEditOverlay.classList.remove('hidden');
        imageUrlInput.focus();
        imageUrlInput.select();
    });

    imageUrlSave.addEventListener('click', () => {
        if (!currentPOIId) return;
        const poi = poiData.find(p => p.id === currentPOIId);
        if (poi) {
            poi.image = imageUrlInput.value.trim();
            showPOI(null);         // reset
            currentPOIId = null;
            showPOI(poi.id);       // reload with new image
        }
        imageEditOverlay.classList.add('hidden');
    });

    imageUrlCancel.addEventListener('click', () => {
        imageEditOverlay.classList.add('hidden');
    });

    imageUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  imageUrlSave.click();
        if (e.key === 'Escape') imageUrlCancel.click();
    });
}

// ─── Drag / Inverse Projection ────────────────────────────────────────────────
function radToDeg(r) { return r * 180 / Math.PI; }

function pixelToLatLong(xPct, yPct) {
    const r_scale = 46;
    const x = (xPct - 50) / r_scale;   // -1 … 1  (east positive)
    const y = (50 - yPct) / r_scale;   // -1 … 1  (north positive)
    const rho = Math.sqrt(x * x + y * y);
    if (rho > 1) return null;           // outside disk
    const c   = Math.asin(rho);
    const lat = radToDeg(Math.asin(y * Math.sin(c) / (rho || 1)));
    const lon = radToDeg(Math.atan2(x * Math.sin(c), rho * Math.cos(c)));
    return { lat: +lat.toFixed(3), long: +lon.toFixed(3) };
}

function initDrag(markerEl, poi) {
    let dragging = false;
    let startX, startY;
    const coordReadout = document.getElementById('coordReadout');

    markerEl.addEventListener('mousedown', (e) => {
        if (!editMode) return;
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        markerEl.style.zIndex = 200;
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const overlayRect = markersOverlay.getBoundingClientRect();
        const xPct = ((e.clientX - overlayRect.left) / overlayRect.width)  * 100;
        const yPct = ((e.clientY - overlayRect.top)  / overlayRect.height) * 100;
        const coords = pixelToLatLong(xPct, yPct);
        if (coords) {
            markerEl.style.left = xPct + '%';
            markerEl.style.top  = yPct + '%';
            coordReadout.textContent = `lat: ${coords.lat.toFixed(2)}°  long: ${coords.long.toFixed(2)}°`;
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!dragging) return;
        dragging = false;
        markerEl.style.zIndex = '';
        const overlayRect = markersOverlay.getBoundingClientRect();
        const xPct = ((e.clientX - overlayRect.left) / overlayRect.width)  * 100;
        const yPct = ((e.clientY - overlayRect.top)  / overlayRect.height) * 100;
        const coords = pixelToLatLong(xPct, yPct);
        if (coords) {
            poi.lat  = coords.lat;
            poi.long = coords.long;
            coordReadout.textContent = `lat: ${coords.lat.toFixed(2)}°  long: ${coords.long.toFixed(2)}°`;
        }
    });
}

let editMode = false;

init();
