document.addEventListener('DOMContentLoaded', () => {
    loadDownloads();
    initDownloadsAdmin();
    setupPreviewModal();
});

const downloadsTranslations = {
    hr: {
        download: 'Preuzmi',
        deleteConfirm: 'Jeste li sigurni da želite obrisati ovu datoteku?',
        uploadSuccess: 'Datoteka uspješno učitana!',
        uploadError: 'Greška pri učitavanju.',
        deleteSuccess: 'Datoteka obrisana.',
        deleteError: 'Greška pri brisanju.',
        noFiles: 'Trenutno nema datoteka za preuzimanje.',
        preview: 'Pregled'
    },
    en: {
        download: 'Download',
        deleteConfirm: 'Are you sure you want to delete this file?',
        uploadSuccess: 'File uploaded successfully!',
        uploadError: 'Error uploading file.',
        deleteSuccess: 'File deleted.',
        deleteError: 'Error deleting file.',
        noFiles: 'No files available for download.',
        preview: 'Preview'
    },
    it: {
        download: 'Scarica',
        deleteConfirm: 'Sei sicuro di voler eliminare questo file?',
        uploadSuccess: 'File caricato con successo!',
        uploadError: 'Errore durante il caricamento.',
        deleteSuccess: 'File eliminato.',
        deleteError: 'Errore durante l\'eliminazione.',
        noFiles: 'Nessun file disponibile per il download.',
        preview: 'Anteprima'
    }
};

function dt(key) {
    const lang = getCurrentLang(); // From main.js
    return downloadsTranslations[lang][key] || key;
}

// Store downloads globally for search filtering
let allDownloads = [];

async function loadDownloads() {
    try {
        const response = await fetch('/api/downloads');
        allDownloads = await response.json();
        renderDownloads(allDownloads);

        // Setup search functionality
        const searchInput = document.getElementById('downloads-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const filtered = allDownloads.filter(file => {
                    return file.title.toLowerCase().includes(query) ||
                        file.fileName.toLowerCase().includes(query) ||
                        (file.description && file.description.toLowerCase().includes(query)) ||
                        file.fileType.toLowerCase().includes(query);
                });
                renderDownloads(filtered);
            });
        }
    } catch (err) {
        console.error('Error loading downloads:', err);
    }
}

function renderDownloads(files) {
    const container = document.getElementById('downloads-grid');
    if (!container) return;

    container.innerHTML = '';

    if (files.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">${dt('noFiles')}</p>`;
        return;
    }

    const token = localStorage.getItem('adip_token'); // Check if admin

    // Determine base path for file URLs (handle /en/ and /it/ subdirectories)
    const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
    const basePath = isSubdir ? '../' : '';

    files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'download-card';

        const ext = file.fileType.toLowerCase();
        const fullPath = basePath + file.filePath;

        let iconContent = '';

        // Check if it's an image file - show actual thumbnail
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            iconContent = `<img class="file-thumbnail" src="${fullPath}" alt="${file.title}">`;
        } else {
            // Use emoji icons for non-image files
            let icon = '📄';
            if (ext === 'pdf') icon = '📕';
            else if (['zip', 'rar', '7z'].includes(ext)) icon = '📦';
            else if (['doc', 'docx'].includes(ext)) icon = '📝';
            else if (['xls', 'xlsx'].includes(ext)) icon = '📊';
            iconContent = `<div class="file-icon">${icon}</div>`;
        }

        card.innerHTML = `
            ${iconContent}
            <div class="file-name" title="${file.fileName}">${file.title}</div>
            <div class="file-date">${file.dateAdded} • ${file.fileType.toUpperCase()}</div>
            ${token ? `<button class="delete-btn-overlay" onclick="deleteDownload(event, ${file.id})">✕</button>` : ''}
        `;

        // Click to preview
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn-overlay')) {
                openPreview(file);
            }
        });

        // Show delete button on hover if admin
        if (token) {
            card.addEventListener('mouseenter', () => card.querySelector('.delete-btn-overlay').classList.add('visible'));
            card.addEventListener('mouseleave', () => card.querySelector('.delete-btn-overlay').classList.remove('visible'));
        }

        container.appendChild(card);
    });
}

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

function setupPreviewModal() {
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.getElementById('close-preview');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.getElementById('preview-container').innerHTML = '';
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.getElementById('preview-container').innerHTML = '';
        }
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
    size.textContent = file.fileSize;
    date.textContent = file.dateAdded;

    // Determine path (handle relative/absolute)
    // Assuming backend returns relative path like "downloads-files/file.ext"
    // We need to make sure it works from /en/ or /it/ subdirs too.
    const isSubdir = window.location.pathname.includes('/en/') || window.location.pathname.includes('/it/');
    const basePath = isSubdir ? '../' : '';
    const fullPath = basePath + file.filePath;

    downloadLink.href = fullPath;
    container.innerHTML = '';

    const ext = file.fileType.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        const img = document.createElement('img');
        img.src = fullPath;
        img.className = 'preview-image';
        container.appendChild(img);
    } else if (ext === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = fullPath;
        iframe.style.width = '100%';
        iframe.style.height = '50vh';
        iframe.style.border = 'none';
        iframe.style.marginBottom = '1rem';
        container.appendChild(iframe);
    } else {
        // Generic icon for others
        const iconDiv = document.createElement('div');
        iconDiv.style.fontSize = '5rem';
        iconDiv.style.marginBottom = '1rem';

        if (['zip', 'rar', '7z'].includes(ext)) iconDiv.textContent = '📦';
        else if (['doc', 'docx'].includes(ext)) iconDiv.textContent = '📝';
        else if (['xls', 'xlsx'].includes(ext)) iconDiv.textContent = '📊';
        else iconDiv.textContent = '📄';

        container.appendChild(iconDiv);
    }

    modal.classList.add('active');
}
