/* =====================================================================
 *  Preuzimanja - popis datoteka (/api/downloads), sličice, pretraga,
 *  pregled i admin upload/brisanje.
 *
 *  Sličice:
 *   - slike (jpg/png/...) prikazuju same sebe,
 *   - PDF sa spremljenom sličicom (thumbnailPath, pdftoppm pri uploadu) koristi nju,
 *   - PDF bez sličice: prva stranica se iscrta u pregledniku pomoću pdf.js
 *     (lijeno, tek kad je kartica blizu ekrana). pdf.js dohvaća samo potrebne
 *     dijelove datoteke HTTP Range zahtjevima, a gotova sličica se pamti
 *     u localStorage pa se drugi put ne crta ponovno,
 *   - sve ostalo (ili greška) dobiva ikonu tipa datoteke.
 *  Ovisi o: main.js (getCurrentLang), ikone.js (adipIkona).
 * ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    loadDownloads();
    initDownloadsAdmin();
    setupPreviewModal();
});

const downloadsTranslations = {
    hr: {
        download: 'Preuzmi',
        downloadFile: 'Preuzmi datoteku',
        deleteConfirm: 'Jeste li sigurni da želite obrisati ovu datoteku?',
        deleteLabel: 'Obriši',
        uploadSuccess: 'Datoteka uspješno učitana!',
        uploadError: 'Greška pri učitavanju.',
        deleteSuccess: 'Datoteka obrisana.',
        deleteError: 'Greška pri brisanju.',
        noFiles: 'Trenutno nema datoteka za preuzimanje.',
        noMatch: 'Nijedna datoteka ne odgovara pretrazi.',
        preview: 'Pregled',
        count: n => n + (n % 10 === 1 && n % 100 !== 11 ? ' datoteka' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? ' datoteke' : ' datoteka'))
    },
    en: {
        download: 'Download',
        downloadFile: 'Download file',
        deleteConfirm: 'Are you sure you want to delete this file?',
        deleteLabel: 'Delete',
        uploadSuccess: 'File uploaded successfully!',
        uploadError: 'Error uploading file.',
        deleteSuccess: 'File deleted.',
        deleteError: 'Error deleting file.',
        noFiles: 'No files available for download.',
        noMatch: 'No files match your search.',
        preview: 'Preview',
        count: n => n === 1 ? '1 file' : n + ' files'
    },
    it: {
        download: 'Scarica',
        downloadFile: 'Scarica il file',
        deleteConfirm: 'Sei sicuro di voler eliminare questo file?',
        deleteLabel: 'Elimina',
        uploadSuccess: 'File caricato con successo!',
        uploadError: 'Errore durante il caricamento.',
        deleteSuccess: 'File eliminato.',
        deleteError: 'Errore durante l\'eliminazione.',
        noFiles: 'Nessun file disponibile per il download.',
        noMatch: 'Nessun file corrisponde alla ricerca.',
        preview: 'Anteprima',
        count: n => n === 1 ? '1 file' : n + ' file'
    }
};

function dlLang() {
    return (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
}

function dt(key) {
    const tr = downloadsTranslations[dlLang()] || downloadsTranslations.hr;
    return tr[key] || downloadsTranslations.hr[key] || key;
}

function dlIkona(ime, klasa) {
    return (typeof window.adipIkona === 'function') ? window.adipIkona(ime, klasa) : '';
}

/* Pretraga bez obzira na velika slova i dijakritike (č ć š ž đ). */
function dlNorm(s) {
    return (s || '').toString().toLowerCase()
        .replace(/đ/g, 'd')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ').trim();
}

// Putanje datoteka su relativne na korijen; /en/ i /it/ trebaju '../'
function dlBasePath() {
    const p = window.location.pathname;
    return (p.includes('/en/') || p.includes('/it/')) ? '../' : '';
}

const DL_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];

function dlTip(ext) {
    if (ext === 'pdf') return { tip: 'pdf', ikona: 'file-text' };
    if (DL_IMAGE_EXT.includes(ext)) return { tip: 'slika', ikona: 'file-image' };
    if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)) return { tip: 'tekst', ikona: 'file-text' };
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return { tip: 'tablica', ikona: 'file-spreadsheet' };
    if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return { tip: 'prez', ikona: 'presentation' };
    if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return { tip: 'arhiva', ikona: 'file-archive' };
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return { tip: 'zvuk', ikona: 'file-audio' };
    if (['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) return { tip: 'video', ikona: 'file-video' };
    return { tip: 'ostalo', ikona: 'file' };
}

/* "0.29 MB" -> "290 KB", "10.02 MB" -> "10 MB" / "10,0 MB" prema jeziku */
function dlVelicina(str) {
    const m = /([\d.]+)\s*MB/i.exec(str || '');
    if (!m) return str || '';
    const mb = parseFloat(m[1]);
    const loc = { hr: 'hr-HR', en: 'en-GB', it: 'it-IT' }[dlLang()] || 'hr-HR';
    if (mb < 1) return Math.max(1, Math.round(mb * 1024)).toLocaleString(loc) + ' KB';
    return mb.toLocaleString(loc, { maximumFractionDigits: mb < 10 ? 1 : 0 }) + ' MB';
}

function dlDatum(file) {
    if (dlLang() === 'hr' || !file.uploadDateIso) return file.dateAdded || '';
    const d = new Date(file.uploadDateIso);
    if (isNaN(d)) return file.dateAdded || '';
    return d.toLocaleDateString(dlLang() === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* =====================================================================
 *  pdf.js - sličica prve stranice
 * ===================================================================== */

const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/';
const DL_THUMB_W = 480;            // px širine iscrtane stranice (≈2x kartica)
const DL_CACHE_PREFIX = 'adip-dl-thumb-v1:';
let pdfjsPromise = null;

function ucitajPdfJs() {
    if (!pdfjsPromise) {
        // import() kroz Function da stari preglednici ne padnu već pri parsiranju datoteke
        const uvezi = new Function('u', 'return import(u)');
        pdfjsPromise = uvezi(PDFJS_BASE + 'build/pdf.min.mjs').then(lib => {
            lib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'build/pdf.worker.min.mjs';
            return lib;
        });
        pdfjsPromise.catch(() => { pdfjsPromise = null; });
    }
    return pdfjsPromise;
}

async function iscrtajPdfSlicicu(url) {
    const lib = await ucitajPdfJs();
    const task = lib.getDocument({
        url,
        disableAutoFetch: true,     // ne skidaj cijeli PDF u pozadini
        disableStream: true,        // samo Range zahtjevi za potrebne dijelove
        rangeChunkSize: 65536,
        isEvalSupported: false,
        cMapUrl: PDFJS_BASE + 'cmaps/',
        cMapPacked: true,
        standardFontDataUrl: PDFJS_BASE + 'standard_fonts/'
    });
    try {
        const doc = await task.promise;
        const page = await doc.getPage(1);
        const vp1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: DL_THUMB_W / vp1.width });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(Math.min(vp.height, DL_THUMB_W * 1.6));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        return canvas.toDataURL('image/jpeg', 0.8);
    } finally {
        task.destroy();
    }
}

function cacheGet(key) {
    try { return localStorage.getItem(DL_CACHE_PREFIX + key); } catch (e) { return null; }
}
function cacheSet(key, val) {
    try { localStorage.setItem(DL_CACHE_PREFIX + key, val); } catch (e) { /* pun ili blokiran - nije bitno */ }
}

// Jedno po jedno crtanje da se ne opterećuje preglednik i server
let dlRed = Promise.resolve();
function uRed(fn) {
    const p = dlRed.then(fn, fn);
    dlRed = p.catch(() => {});
    return p;
}

function postaviSliku(thumb, src, onFail) {
    const img = new Image();
    img.className = 'dl-thumb-img';
    img.alt = '';
    img.decoding = 'async';
    img.onload = () => {
        img.classList.add('is-loaded');
        thumb.classList.remove('is-loading');
    };
    img.onerror = () => { img.remove(); if (onFail) onFail(); else thumb.classList.remove('is-loading'); };
    img.src = src;
    thumb.insertBefore(img, thumb.firstChild);
}

function ucitajPdfSlicicu(thumb, file, url) {
    const kljuc = file.filePath + '|' + (file.fileSize || '');
    const spremljeno = cacheGet(kljuc);
    if (spremljeno) { postaviSliku(thumb, spremljeno); return; }

    thumb.classList.add('is-loading');
    uRed(() => iscrtajPdfSlicicu(url))
        .then(src => {
            postaviSliku(thumb, src);
            spremiNaServer(file, src).then(ok => { if (!ok) cacheSet(kljuc, src); });
        })
        .catch(err => {
            console.warn('[ADIP preuzimanja] Sličica nije iscrtana:', file.fileName, err && err.message);
            thumb.classList.remove('is-loading');
        });
}

/* Iscrtanu sličicu pošalji serveru da je idući posjetitelji dobiju gotovu
 * (bez skidanja PDF-a). Server je prima samo za PDF koji još nema sličicu. */
async function spremiNaServer(file, dataUrl) {
    if (file.thumbnailPath || !file.id) return false;
    try {
        const blob = await (await fetch(dataUrl)).blob();
        const fd = new FormData();
        fd.append('thumbnail', blob, 'thumb.jpg');
        const r = await fetch('/api/downloads/' + encodeURIComponent(file.id) + '/thumbnail', { method: 'POST', body: fd });
        if (!r.ok) return r.status === 409;   // 409 = netko ju je već spremio
        const j = await r.json();
        if (j && j.thumbnailPath) file.thumbnailPath = j.thumbnailPath;
        return true;
    } catch (e) {
        return false;
    }
}

let dlObserver = null;
function lijenoUcitaj(thumb, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    if (!dlObserver) {
        dlObserver = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                dlObserver.unobserve(e.target);
                const f = e.target._dlLoad;
                delete e.target._dlLoad;
                if (f) f();
            });
        }, { rootMargin: '300px 0px' });
    }
    thumb._dlLoad = fn;
    dlObserver.observe(thumb);
}

/* =====================================================================
 *  Popis i pretraga
 * ===================================================================== */

let allDownloads = [];
let dlSearchBound = false;

async function loadDownloads() {
    try {
        const response = await fetch('/api/downloads');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        allDownloads = await response.json();
        allDownloads.forEach(f => {
            f._trazi = dlNorm([f.title, f.fileName, f.description, f.fileType].join(' '));
        });
        filtriraj();

        const searchInput = document.getElementById('downloads-search');
        if (searchInput && !dlSearchBound) {
            dlSearchBound = true;
            searchInput.addEventListener('input', filtriraj);
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Escape' && searchInput.value) { searchInput.value = ''; filtriraj(); }
            });
        }
    } catch (err) {
        console.error('Error loading downloads:', err);
    }
}

function filtriraj() {
    const input = document.getElementById('downloads-search');
    const rijeci = dlNorm(input ? input.value : '').split(' ').filter(Boolean);
    const filtered = allDownloads.filter(f => rijeci.every(r => f._trazi.includes(r)));
    renderDownloads(filtered, rijeci.length > 0);
}

function renderDownloads(files, searching) {
    const container = document.getElementById('downloads-grid');
    if (!container) return;
    container.innerHTML = '';

    const count = document.getElementById('downloads-count');
    if (count) count.textContent = allDownloads.length ? dt('count')(files.length) : '';

    if (files.length === 0) {
        const p = document.createElement('p');
        p.className = 'dl-empty';
        p.textContent = searching ? dt('noMatch') : dt('noFiles');
        container.appendChild(p);
        return;
    }

    const token = localStorage.getItem('adip_token'); // admin
    const basePath = dlBasePath();

    files.forEach(file => {
        const ext = (file.fileType || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const tip = dlTip(ext);
        const fullPath = basePath + file.filePath;

        const card = document.createElement('article');
        card.className = 'dl-card dl-tip-' + tip.tip;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', dt('preview') + ': ' + file.title);

        // Sličica
        const thumb = document.createElement('div');
        thumb.className = 'dl-thumb';
        thumb.innerHTML = `<div class="dl-fallback">${dlIkona(tip.ikona)}<span class="dl-fallback-ext"></span></div>
            <span class="dl-type"></span>`;
        thumb.querySelector('.dl-fallback-ext').textContent = (ext || 'file').toUpperCase();
        thumb.querySelector('.dl-type').textContent = (ext || 'file').toUpperCase();
        card.appendChild(thumb);

        if (DL_IMAGE_EXT.includes(ext)) {
            lijenoUcitaj(thumb, () => postaviSliku(thumb, fullPath));
        } else if (ext === 'pdf') {
            const pdfUrl = new URL(fullPath, window.location.href).href;
            if (file.thumbnailPath) {
                lijenoUcitaj(thumb, () => postaviSliku(thumb, basePath + file.thumbnailPath,
                    () => ucitajPdfSlicicu(thumb, file, pdfUrl)));
            } else {
                lijenoUcitaj(thumb, () => ucitajPdfSlicicu(thumb, file, pdfUrl));
            }
        }

        // Tekst
        const body = document.createElement('div');
        body.className = 'dl-body';
        const h = document.createElement('h3');
        h.className = 'dl-title';
        h.textContent = file.title;
        h.title = file.fileName || file.title;
        body.appendChild(h);
        if (file.description) {
            const d = document.createElement('p');
            d.className = 'dl-desc';
            d.textContent = file.description;
            body.appendChild(d);
        }
        const meta = document.createElement('div');
        meta.className = 'dl-meta';
        const info = document.createElement('div');
        info.className = 'dl-meta-info';
        [dlVelicina(file.fileSize), dlDatum(file)].filter(Boolean).forEach(t => {
            const s = document.createElement('span');
            s.textContent = t;
            info.appendChild(s);
        });
        const a = document.createElement('a');
        a.className = 'dl-download';
        a.href = fullPath;
        a.setAttribute('download', file.fileName || '');
        a.setAttribute('aria-label', dt('download') + ': ' + file.title);
        a.title = dt('download');
        a.innerHTML = dlIkona('download');
        a.addEventListener('click', e => e.stopPropagation());
        a.addEventListener('keydown', e => e.stopPropagation());
        meta.append(info, a);
        body.appendChild(meta);
        card.appendChild(body);

        if (token) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'dl-delete';
            del.setAttribute('aria-label', dt('deleteLabel') + ': ' + file.title);
            del.title = dt('deleteLabel');
            del.innerHTML = dlIkona('trash');
            del.addEventListener('click', e => deleteDownload(e, file.id));
            del.addEventListener('keydown', e => e.stopPropagation());
            card.appendChild(del);
        }

        card.addEventListener('click', () => openPreview(file));
        card.addEventListener('keydown', e => {
            if (e.target !== card) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPreview(file); }
        });

        container.appendChild(card);
    });
}

/* =====================================================================
 *  Admin
 * ===================================================================== */

function initDownloadsAdmin() {
    const token = localStorage.getItem('adip_token');
    const adminPanel = document.getElementById('admin-download-panel');

    if (token && adminPanel) {
        adminPanel.classList.remove('hidden');

        document.getElementById('download-upload-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('file-title').value;
            const desc = document.getElementById('file-desc').value;
            const fileInput = document.getElementById('file-input');
            const msg = document.getElementById('upload-msg');

            if (fileInput.files.length === 0) return;

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', desc);
            formData.append('file', fileInput.files[0]);

            try {
                msg.textContent = 'Uploading...';
                const response = await fetch('/api/downloads/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    msg.textContent = dt('uploadSuccess');
                    msg.style.color = 'green';
                    e.target.reset();
                    loadDownloads();
                } else {
                    throw new Error('Upload failed');
                }
            } catch (err) {
                console.error(err);
                msg.textContent = dt('uploadError');
                msg.style.color = 'red';
            }
        });
    }
}

async function deleteDownload(event, id) {
    event.stopPropagation();
    if (!confirm(dt('deleteConfirm'))) return;

    try {
        const response = await fetch(`/api/downloads/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadDownloads();
        } else {
            alert(dt('deleteError'));
        }
    } catch (err) {
        console.error(err);
        alert(dt('deleteError'));
    }
}

/* =====================================================================
 *  Pregled
 * ===================================================================== */

function setupPreviewModal() {
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.getElementById('close-preview');
    if (!modal) return;

    const zatvori = () => {
        modal.classList.remove('active');
        document.getElementById('preview-container').innerHTML = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', zatvori);
    modal.addEventListener('click', (e) => { if (e.target === modal) zatvori(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) zatvori();
    });
}

function openPreview(file) {
    const modal = document.getElementById('preview-modal');
    const title = document.getElementById('preview-title');
    const desc = document.getElementById('preview-desc');
    const size = document.getElementById('preview-size');
    const date = document.getElementById('preview-date');
    const downloadLink = document.getElementById('download-link');
    const container = document.getElementById('preview-container');

    title.textContent = file.title;
    desc.textContent = file.description || '';
    size.textContent = dlVelicina(file.fileSize);
    date.textContent = dlDatum(file);

    const fullPath = dlBasePath() + file.filePath;
    downloadLink.href = fullPath;
    container.innerHTML = '';

    const ext = (file.fileType || '').toLowerCase();

    if (DL_IMAGE_EXT.includes(ext)) {
        const img = document.createElement('img');
        img.src = fullPath;
        img.className = 'preview-image';
        img.alt = file.title;
        container.appendChild(img);
    } else if (ext === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = fullPath;
        iframe.title = file.title;
        iframe.style.width = '100%';
        iframe.style.height = '50vh';
        iframe.style.border = 'none';
        iframe.style.marginBottom = '1rem';
        container.appendChild(iframe);
    } else {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'preview-icon';
        iconDiv.innerHTML = dlIkona(dlTip(ext).ikona);
        container.appendChild(iconDiv);
    }

    modal.classList.add('active');
    const closeBtn = document.getElementById('close-preview');
    if (closeBtn) closeBtn.focus();
}
