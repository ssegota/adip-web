/**
 * ADIP Modern Website - Main JavaScript
 * Handles: Navigation, Login Modal, Activity Loading, Language Toggle
 */

let allActivitiesData = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLoginModal();
    initLanguageToggle();
    initActivityModal();
    initActivityForm();

    // Load activities if on index or aktivnosti page
    const activitiesContainer = document.getElementById('activities-container');
    if (activitiesContainer) {
        loadActivities(activitiesContainer, 3); // Show 3 on homepage
    }

    const allActivities = document.getElementById('all-activities');
    if (allActivities) {
        loadActivities(allActivities, 100); // Show all on activities page
    }
});

// ==================== Activity Form (Upload with Images) ====================
function initActivityForm() {
    const form = document.getElementById('activity-form');
    const messageDiv = document.getElementById('post-message');
    const imageInput = document.getElementById('activity-images');

    // Limit to 3 images
    if (imageInput) {
        imageInput.addEventListener('change', () => {
            if (imageInput.files.length > 3) {
                alert('Maksimalno 3 slike!');
                imageInput.value = '';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('title', document.getElementById('activity-title').value);
            formData.append('content', document.getElementById('activity-content').value);
            formData.append('year', document.getElementById('activity-year').value);

            const dateInput = document.getElementById('activity-date');
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
                        messageDiv.textContent = 'Aktivnost objavljena!';
                        messageDiv.style.color = '#00ff88';
                    }
                    form.reset();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    if (messageDiv) {
                        messageDiv.textContent = 'Greška pri objavi';
                        messageDiv.style.color = '#ff4444';
                    }
                }
            } catch (err) {
                console.error(err);
                if (messageDiv) {
                    messageDiv.textContent = 'Greška pri povezivanju sa serverom';
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
                loginMessage.textContent = 'Uspješna prijava!';
                loginMessage.style.color = '#00ff88';
                setTimeout(() => {
                    modal.classList.remove('active');
                    updateLoginButton();
                    window.location.reload();
                }, 1000);
            } else {
                loginMessage.textContent = 'Pogrešni podaci!';
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
                btn.textContent = 'Odjava';
                btn.classList.remove('btn--secondary');
                btn.classList.add('btn--primary');
            } else {
                btn.textContent = 'Prijava';
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
        const response = await fetch('data/aktivnosti.json');
        allActivitiesData = await response.json();

        if (!allActivitiesData || allActivitiesData.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">Nema aktivnosti za prikaz.</p>';
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
            container.innerHTML = '<p style="color: var(--text-muted);">Nema aktivnosti za odabranu godinu.</p>';
            return;
        }

        toShow.forEach(activity => {
            const card = document.createElement('article');
            card.className = 'activity-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="activity-card__date">${activity.date || 'N/A'}</div>
                <h3 class="activity-card__title">${activity.title || 'Bez naslova'}</h3>
                <p class="activity-card__content">${truncateText(activity.content, 150)}</p>
                <span style="color: var(--accent-primary); font-size: 0.85rem;">Klikni za više →</span>
            `;
            card.addEventListener('click', () => showActivityModal(activity));
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading activities:', err);
        container.innerHTML = '<p style="color: var(--text-muted);">Greška pri učitavanju aktivnosti.</p>';
    }
}

function setupYearFilter(select, activities) {
    const years = [...new Set(activities.map(a => a.year).filter(y => y))].sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();

    // Add "All" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Sve godine';
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
        container.innerHTML = '<p style="color: var(--text-muted);">Nema aktivnosti za odabranu godinu.</p>';
        return;
    }

    toShow.forEach(activity => {
        const card = document.createElement('article');
        card.className = 'activity-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="activity-card__date">${activity.date || 'N/A'}</div>
            <h3 class="activity-card__title">${activity.title || 'Bez naslova'}</h3>
            <p class="activity-card__content">${truncateText(activity.content, 150)}</p>
            <span style="color: var(--accent-primary); font-size: 0.85rem;">Klikni za više →</span>
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
            if (!confirm('Jeste li sigurni da želite obrisati ovu aktivnost?')) return;
            alert('Brisanje nije omogućeno na statičkoj demo verziji.');
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
        title.textContent = activity.title || 'Bez naslova';
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

    if (langToggle) {
        const currentLang = localStorage.getItem('adip_lang') || 'hr';
        langToggle.textContent = currentLang === 'hr' ? 'EN' : 'HR';

        langToggle.addEventListener('click', () => {
            const newLang = currentLang === 'hr' ? 'en' : 'hr';
            localStorage.setItem('adip_lang', newLang);
            // In a real app, this would switch the page content
            alert('Prijevod na engleski jezik je u pripremi / English translation coming soon');
        });
    }
}

// ==================== Post Activity (for admin) ====================
// ==================== Post Activity (for admin) ====================
async function postActivity(title, content) {
    alert('Objavljivanje nije omogućeno na statičkoj demo verziji.');
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
    document.getElementById('lightbox-image').src = img.src;
    document.getElementById('lightbox-caption').textContent = img.description || '';
}

// Load gallery from JSON
async function loadGallery(category, containerId) {
    try {
        const response = await fetch('data/galerija.json');
        const data = await response.json();

        let images;
        if (category === 'povijest') {
            images = data.povijest || [];
        } else {
            images = data.astrofotografija?.[category] || [];
        }

        renderGallery(images, containerId);
    } catch (err) {
        console.error('Error loading gallery:', err);
    }
}

function renderGallery(images, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = images.map((img, index) => `
        <div class="gallery-item" onclick="openLightbox(galleryImages, ${index})">
            <img src="${img.src}" alt="${img.description || ''}" loading="lazy">
        </div>
    `).join('');

    // Store for lightbox
    window.galleryImages = images;
}
