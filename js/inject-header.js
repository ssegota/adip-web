/**
 * Modern Header Injection Script for Legacy Pages
 * Injects the new sidebar navigation into old Drupal pages
 */

(function () {
    'use strict';

    // Determine base path based on current URL depth
    function getBasePath() {
        const path = window.location.pathname;
        const depth = (path.match(/\//g) || []).length - 1;
        if (depth <= 1) return './';
        return '../'.repeat(depth - 1);
    }

    const basePath = getBasePath();

    // Create modern header HTML
    function createModernHeader() {
        const header = document.createElement('header');
        header.className = 'header';
        header.innerHTML = `
            <div class="menu-toggle" id="menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <a href="${basePath}index.html" class="header__logo">
                <img src="${basePath}sites/all/themes/black_hole/logo.png" alt="ADIP Logo">
                <div>
                    <div class="header__title">Pulska Zvjezdarnica</div>
                    <div class="header__subtitle">Astronomsko društvo "Istra" Pula</div>
                </div>
            </a>

            <nav class="nav" id="main-nav">
                <button class="nav__close" id="nav-close">✕</button>
                <a href="${basePath}index.html" class="nav__link">🏠 Naslovna</a>
                <a href="${basePath}aktivnosti.html" class="nav__link">📅 Aktivnosti</a>
                <a href="${basePath}galerija-slika.html" class="nav__link">🖼️ Galerija</a>
                <a href="${basePath}povijest-zvjezdarnice.html" class="nav__link">📜 Povijest</a>
                <a href="${basePath}posjet-pulskoj-zvjezdarnici.html" class="nav__link">🔭 Posjeti</a>
                <a href="${basePath}astronomsko-drustvo-istra-pula.html" class="nav__link">ℹ️ O nama</a>
                <div class="nav__spacer"></div>
                <button class="btn btn--secondary nav__login" id="sidebar-login-btn">Prijava</button>
            </nav>
            <div class="nav-overlay" id="nav-overlay"></div>

            <div class="user-controls">
                <button class="lang-toggle" id="lang-toggle">EN</button>
            </div>
        `;
        return header;
    }

    // Initialize navigation functionality
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

    // Mark active navigation link
    function setActiveLink() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.nav__link');

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath.includes('povijest') && href.includes('povijest')) {
                link.classList.add('active');
            } else if (currentPath.includes('aktivnosti') && href.includes('aktivnosti')) {
                link.classList.add('active');
            } else if (currentPath.includes('galerija') && href.includes('galerija')) {
                link.classList.add('active');
            } else if (currentPath.includes('posjet') && href.includes('posjet')) {
                link.classList.add('active');
            } else if (currentPath.includes('astronomsko-drustvo') && href.includes('astronomsko-drustvo')) {
                link.classList.add('active');
            }
        });
    }

    // Inject the header
    function injectHeader() {
        // Add page-blur class for blurred background on non-home pages
        document.body.classList.add('page-blur');

        // Load modern CSS if not already loaded
        if (!document.querySelector('link[href*="modern.css"]')) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = basePath + 'css/modern.css';
            document.head.appendChild(cssLink);
        }

        // Remove old header and nav-buttons
        const oldHeader = document.querySelector('header.clearfix');
        const oldNavButtons = document.querySelector('ul.nav-buttons');
        const oldNavBottom = document.querySelector('ul.nav-bottom');

        if (oldHeader) oldHeader.remove();
        if (oldNavButtons) oldNavButtons.remove();
        if (oldNavBottom) oldNavBottom.remove();

        // Create and insert new header
        const newHeader = createModernHeader();
        document.body.insertBefore(newHeader, document.body.firstChild);

        // Add padding to content for fixed header
        const content = document.querySelector('.content');
        if (content) {
            content.style.paddingTop = '100px';
        }

        // Initialize navigation
        initNavigation();
        setActiveLink();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHeader);
    } else {
        injectHeader();
    }
})();
