/* Povijest Zvjezdarnice - interaktivni dijelovi stranice */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Jezik ---------- */
    const LANG = ['en', 'it'].includes(document.documentElement.lang) ? document.documentElement.lang : 'hr';
    // Hrvatski piše godine s točkom ("1874."), engleski i talijanski bez nje
    const yr = y => (LANG === 'hr' ? `${String(y).replace(/\.$/, '')}.` : String(y).replace(/\.$/, ''));
    const pct = v => (LANG === 'hr' ? `${v} %` : `${v}%`);

    const UI = {
        hr: {
            all: 'Sve', comet: 'Komet', palisa: 'Palisa', world: 'Ostatak svijeta', share: 'Udio Palise',
            total: 'Ukupno', showTable: 'Prikaži tablicu', hideTable: 'Sakrij tablicu',
            chartAria: 'Stupčasti grafikon: broj otkrivenih asteroida po godinama 1874.–1880., Palisa i ostatak svijeta'
        },
        en: {
            all: 'All', comet: 'Comet', palisa: 'Palisa', world: 'Rest of the world', share: 'Palisa’s share',
            total: 'Total', showTable: 'Show table', hideTable: 'Hide table',
            chartAria: 'Bar chart: number of asteroids discovered per year 1874–1880, Palisa and the rest of the world'
        },
        it: {
            all: 'Tutti', comet: 'Cometa', palisa: 'Palisa', world: 'Resto del mondo', share: 'Quota di Palisa',
            total: 'Totale', showTable: 'Mostra tabella', hideTable: 'Nascondi tabella',
            chartAria: 'Grafico a barre: numero di asteroidi scoperti per anno 1874–1880, Palisa e resto del mondo'
        }
    }[LANG];

    /* ---------- Podaci ---------- */

    // era: au = Austro-Ugarska, rat = 1918.-1972., adip = od 1973.
    const EVENTS = [
        { y: '1802.', era: 'au', t: 'Mornarička knjižnica osnovana u Veneciji', to: 'knjiznica' },
        { y: '1840.', era: 'au', t: 'Pomorska zvjezdarnica u Veneciji – začetak pulske', to: 'pocetci' },
        { y: '1850.', era: 'au', t: 'Mornarička akademija i Zvjezdarnica u Trstu', to: 'pocetci' },
        { y: '1853.', era: 'au', t: 'Pula glavna ratna luka; gradnja utvrde Zaro', to: 'pocetci' },
        { y: '1866.', era: 'au', t: 'Tegetthoff pobjeđuje u Viškom boju', to: 'tegetthoff' },
        { y: '1869.', era: 'au', t: 'Osnutak Hidrografskog zavoda i Zvjezdarnice', to: 'pocetci' },
        { y: '1871.', era: 'au', t: 'Nova zgrada na Monte Zaru; dolazi Johann Palisa', to: 'pocetci' },
        { y: '1874.', era: 'au', t: 'Palisa otkriva (136) Austria', to: 'palisa' },
        { y: '1875.', era: 'au', t: 'Car Franjo Josip I. imenuje Polanu i Adriju', to: 'palisa' },
        { y: '1877.', era: 'au', t: 'Spomenik Tegetthoffu ispred Zvjezdarnice', to: 'zlatno-doba' },
        { y: '1878.', era: 'au', t: 'Otkriven asteroid (183) Istria', to: 'palisa' },
        { y: '1880.', era: 'au', t: 'Palisa odlazi u Beč', to: 'palisa' },
        { y: '1881.', era: 'au', t: 'Reflektor «Brachyt», najveći te vrste', to: 'instrumenti' },
        { y: '1893.', era: 'au', t: 'Ivo Benko preuzima upravu Zvjezdarnice', to: 'benko' },
        { y: '1898.', era: 'au', t: 'Benko: Zemlja nema drugi, tamni satelit', to: 'benko' },
        { y: '1913.', era: 'au', t: 'Geomagnetska karta Jadrana', to: 'zlatno-doba' },
        { y: '1918.', era: 'rat', t: 'Talijanska okupacija; instrumenti odneseni', to: 'rat' },
        { y: '1920.', era: 'rat', t: 'Uklonjen Tegetthoffov spomenik', to: 'tegetthoff' },
        { y: '1944.', era: 'rat', t: 'Savezničko bombardiranje razara zgradu', to: 'rat' },
        { y: '1947.', era: 'rat', t: 'Obnova krila; meteorološka postaja', to: 'meteoroloska-postaja' },
        { y: '1949.', era: 'rat', t: 'Postaju preuzima hidrometeorološka služba', to: 'meteoroloska-postaja' },
        { y: '1973.', era: 'adip', t: 'Osnovano Astronomsko društvo «Istra» Pula', to: 'adip' },
        { y: '1975.', era: 'adip', t: 'Teleskop «Celestron 8»; knjižnica vraćena u Pulu', to: 'adip' },
        { y: '1978.', era: 'adip', t: '100 godina asteroida «Istria»', to: 'adip' },
        { y: '1982.', era: 'adip', t: 'Zvjezdarnica predana ADIP-u', to: 'adip' },
        { y: '1983.', era: 'adip', t: 'Spomenik kulture C kategorije', to: 'adip' },
        { y: '1991.', era: 'adip', t: 'Knjiga E. Puha «Zvjezdarnica u Puli»', to: 'adip' },
        { y: '1993.', era: 'adip', t: 'Galileo: regije Palisa, Vienna i Pola na Idi', to: 'palisa' },
        { y: '1999.', era: 'adip', t: 'Kupola ponovno radi; pomrčina Sunca', to: 'adip' },
        { y: '2006.', era: 'adip', t: 'Početak sanacije; rađa se meteorska mreža', to: 'obnova' },
        { y: '2009.', era: 'adip', t: 'Otvorenje obnovljene Zvjezdarnice', to: 'obnova' },
        { y: '2010.', era: 'adip', t: 'Povelja Hrvatske zajednice tehničke kulture', to: 'danas' },
        { y: '2016.', era: 'adip', t: 'Meteorit «Križevci» na Festivalu znanosti', to: 'danas' },
        { y: '2018.', era: 'adip', t: 'Globalna meteorska mreža', to: 'danas' },
        { y: '2021.', era: 'adip', t: '150 godina Zvjezdarnice; GMN premašuje 500 kamera', to: 'danas' }
    ];

    // Tekstovi vremenske crte na EN/IT, istim redoslijedom kao EVENTS
    const EVENTS_I18N = {
        en: [
            'Navy Library founded in Venice', 'Naval observatory in Venice – the forerunner of Pula',
            'Naval Academy and Observatory in Trieste', 'Pula becomes the main naval port; Fort Zaro is built',
            'Tegetthoff wins the Battle of Lissa (Vis)', 'Hydrographic Office and Observatory founded',
            'New building on Monte Zaro; Johann Palisa arrives', 'Palisa discovers (136) Austria',
            'Emperor Franz Joseph I names Polana and Adria', 'Tegetthoff monument unveiled in front of the Observatory',
            'Asteroid (183) Istria discovered', 'Palisa moves to Vienna',
            'The “Brachyt” reflector, the largest of its kind', 'Ivo Benko becomes director of the Observatory',
            'Benko: the Earth has no second, dark moon', 'Geomagnetic map of the Adriatic',
            'Italian occupation; instruments taken away', 'Tegetthoff monument removed',
            'Allied bombing destroys the building', 'Wing rebuilt; meteorological station',
            'Hydrometeorological service takes over the station', 'Astronomical Society “Istra” Pula founded',
            '“Celestron 8” telescope; Navy Library returns to Pula', '100 years of asteroid “Istria”',
            'Observatory handed over to ADIP', 'Declared a cultural monument (category C)',
            'E. Puh’s book “Zvjezdarnica u Puli”', 'Galileo: regions Palisa, Vienna and Pola on Ida',
            'Dome working again; solar eclipse', 'Renovation begins; the meteor network is born',
            'Renovated Observatory reopens', 'Charter of the Croatian Community of Technical Culture',
            '“Križevci” meteorite at the Science Festival', 'Global Meteor Network',
            '150 years of the Observatory; GMN passes 500 cameras'
        ],
        it: [
            'Fondata a Venezia la Biblioteca della Marina', 'Osservatorio della Marina a Venezia – il precursore di Pola',
            'Accademia di Marina e Osservatorio a Trieste', 'Pola principale porto militare; costruzione del forte Zaro',
            'Tegetthoff vince la battaglia di Lissa', 'Fondazione dell’Ufficio Idrografico e dell’Osservatorio',
            'Nuovo edificio sul Monte Zaro; arriva Johann Palisa', 'Palisa scopre (136) Austria',
            'L’imperatore Francesco Giuseppe I battezza Polana e Adria', 'Monumento a Tegetthoff davanti all’Osservatorio',
            'Scoperto l’asteroide (183) Istria', 'Palisa si trasferisce a Vienna',
            'Il riflettore «Brachyt», il più grande del suo tipo', 'Ivo Benko assume la direzione dell’Osservatorio',
            'Benko: la Terra non ha un secondo satellite oscuro', 'Carta geomagnetica dell’Adriatico',
            'Occupazione italiana; strumenti portati via', 'Rimosso il monumento a Tegetthoff',
            'I bombardamenti alleati distruggono l’edificio', 'Ricostruita un’ala; stazione meteorologica',
            'Il servizio idrometeorologico rileva la stazione', 'Fondata la Società Astronomica «Istra» Pola',
            'Telescopio «Celestron 8»; la biblioteca torna a Pola', '100 anni dell’asteroide «Istria»',
            'L’Osservatorio affidato all’ADIP', 'Monumento culturale di categoria C',
            'Il libro di E. Puh «Zvjezdarnica u Puli»', 'Galileo: regioni Palisa, Vienna e Pola su Ida',
            'La cupola torna in funzione; eclissi di Sole', 'Inizio del restauro; nasce la rete meteorica',
            'Riapertura dell’Osservatorio restaurato', 'Carta della Comunità croata della cultura tecnica',
            'Il meteorite «Križevci» al Festival della scienza', 'Global Meteor Network',
            '150 anni dell’Osservatorio; la GMN supera le 500 camere'
        ]
    };

    // Popis s izvorne stranice o Palisi (redoslijed otkrića)
    const DISCOVERIES = [
        ['(136)', 'Austria', 1874], ['(137)', 'Meliboea', 1874], ['(140)', 'Siwa', 1874],
        ['(142)', 'Polana', 1875], ['(143)', 'Adria', 1875], ['(151)', 'Abudantia', 1875],
        ['(153)', 'Hilda', 1875], ['(155)', 'Scylla', 1875], ['(156)', 'Xanthippe', 1875],
        ['(178)', 'Belisana', 1877], ['(182)', 'Elsa', 1878], ['(183)', 'Istria', 1878],
        ['(184)', 'Dejopeja', 1878], ['(192)', 'Nausikea', 1879], ['(195)', 'Eurikleia', 1879],
        ['(197)', 'Arete', 1879], ['(201)', 'Penelope', 1879], ['C/1879 Q1', 'komet', 1879],
        ['(204)', 'Kalisto', 1879], ['(205)', 'Marta', 1879], ['(207)', 'Hedda', 1879],
        ['(208)', 'Lacrimosa', 1879], ['(210)', 'Isabela', 1879], ['(211)', 'Isolda', 1879],
        ['(212)', 'Medea', 1880], ['(214)', 'Aschera', 1880], ['(216)', 'Kleopatra', 1880],
        ['(218)', 'Bianca', 1880], ['(219)', 'Thusnelda', 1880]
    ];

    const NOTES_I18N = {
        en: {
            Austria: 'Palisa’s first minor planet, discovered on 18 March 1874. As the first asteroid discovered from Austria, it was named Austria.',
            Polana: 'Named personally by Emperor Franz Joseph I during his visit to Pula on 8 April 1875. Polana means “a woman of Pula”.',
            Adria: 'Named, together with Polana, by Emperor Franz Joseph I himself on 8 April 1875. Adria is the Adriatic.',
            Istria: 'An asteroid named after Istria. ADIP marked the centenary of its discovery in 1978 with a lecture, an exhibition and a commemorative envelope.',
            komet: 'The only comet Palisa discovered from Pula (1879).',
            Lacrimosa: 'ADIP member Denis Štimac imaged this asteroid – look for the animation in the astrophotography gallery (Comets category).'
        },
        it: {
            Austria: 'Il primo pianetino di Palisa, scoperto il 18 marzo 1874. Essendo il primo asteroide scoperto dall’Austria, fu chiamato Austria.',
            Polana: 'Battezzato personalmente dall’imperatore Francesco Giuseppe I durante la visita a Pola l’8 aprile 1875. Polana significa “donna di Pola”.',
            Adria: 'Battezzato, insieme a Polana, dallo stesso imperatore Francesco Giuseppe I l’8 aprile 1875. Adria è l’Adriatico.',
            Istria: 'Asteroide dedicato all’Istria. Nel 1978 l’ADIP ne ha celebrato il centenario della scoperta con una conferenza, una mostra e una busta commemorativa.',
            komet: 'L’unica cometa scoperta da Palisa a Pola (1879).',
            Lacrimosa: 'Il socio dell’ADIP Denis Štimac ha ripreso questo asteroide – cerca l’animazione nella galleria di astrofotografia (categoria Comete).'
        }
    };

    const NOTES_HR = {
        Austria: 'Prvi Palisin mali planet, otkriven 18. ožujka 1874. Kao prvi asteroid otkriven iz Austrije dobio je ime Austria.',
        Polana: 'Ime mu je osobno dao car Franjo Josip I. prilikom posjeta Puli 8. travnja 1875. Polana znači Puležanka.',
        Adria: 'Ime mu je, zajedno s Polanom, osobno dao car Franjo Josip I. 8. travnja 1875. Adria je Jadran.',
        Istria: 'Asteroid nazvan po Istri. Stotu godišnjicu njegova otkrića ADIP je 1978. obilježio predavanjem, izložbom i spomen-kuvertom.',
        komet: 'Jedini komet koji je Palisa otkrio iz Pule (1879.).',
        Lacrimosa: 'Član ADIP-a Denis Štimac snimio je ovaj asteroid – animaciju potražite u galeriji astrofotografija (kategorija Kometi).'
    };
    const NOTES = LANG === 'hr' ? NOTES_HR : NOTES_I18N[LANG];

    const YEARS = [1874, 1875, 1876, 1877, 1878, 1879, 1880];
    const PALISA = [3, 6, 0, 1, 3, 10, 5];
    const WORLD = [3, 11, 12, 9, 9, 10, 3]; // ostatak svijeta (bez Palise)

    const CITY = {
        hr: { paris: 'Pariz', vienna: 'Beč', pola: 'Pola (Pula)' },
        en: { paris: 'Paris', vienna: 'Vienna', pola: 'Pola (Pula)' },
        it: { paris: 'Parigi', vienna: 'Vienna', pola: 'Pola' }
    }[LANG];
    const OBSERVATORIES = [
        [CITY.pola, 28], ['Clinton', 22], [CITY.paris, 10], ['Marseille', 10], ['Ann Arbor', 6],
        ['Toulouse', 5], ['Berlin', 2], ['Peking', 1], [CITY.vienna, 1]
    ];
    const DISCOVERERS = [
        ['Palisa, J.', 28], ['Peters, C. H. F.', 22], ['Watson, J. C.', 7], ['Borrelly, A.', 6],
        ['Perrotin, J.', 5], ['Henry, P. P.', 5], ['Henry, P. M.', 5], ['Coggia, J.', 3],
        ['Knorre, V.', 2], ['Schulhof, L.', 1], ['Cottenot, P.', 1]
    ];

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    /* ---------- Vremenska crta ---------- */
    function initTimeline() {
        const track = $('#ph-timeline');
        if (!track) return;
        track.innerHTML = EVENTS.map((e, i) => `
            <button type="button" class="ph-event" data-era="${e.era}" data-to="${e.to}">
                <span class="ph-event__year">${esc(yr(e.y))}</span>
                <span class="ph-event__text">${esc(LANG === 'hr' ? e.t : EVENTS_I18N[LANG][i])}</span>
            </button>`).join('');

        track.addEventListener('click', e => {
            const ev = e.target.closest('.ph-event');
            if (!ev) return;
            const target = document.getElementById(ev.dataset.to);
            if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        });

        $$('.ph-timeline__eras .ph-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                $$('.ph-timeline__eras .ph-chip').forEach(c => c.classList.toggle('is-active', c === chip));
                const era = chip.dataset.era;
                $$('.ph-event', track).forEach(ev => {
                    ev.classList.toggle('is-hidden', era !== 'all' && ev.dataset.era !== era);
                });
                track.scrollLeft = 0;
            });
        });
    }

    /* ---------- Navigacija poglavlja: scrollspy + napredak ---------- */
    function initNav() {
        const nav = $('.ph-nav');
        if (!nav) return;

        // Visina fiksnog headera određuje gdje se navigacija lijepi
        const header = $('.header');
        const setTop = () => {
            const h = header ? header.getBoundingClientRect().height : 70;
            document.querySelector('.ph').style.setProperty('--ph-nav-top', `${Math.round(h)}px`);
        };
        setTop();
        window.addEventListener('resize', setTop);

        const links = $$('.ph-nav__link', nav);
        const byId = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
        const sections = $$('.ph-chapter');
        const progress = $('.ph-progress', nav);

        const setActive = id => {
            links.forEach(l => l.classList.toggle('is-active', l === byId.get(id)));
            const active = byId.get(id);
            if (active) {
                const list = active.parentElement.parentElement;
                const left = active.offsetLeft - list.clientWidth / 2 + active.clientWidth / 2;
                list.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
            }
        };

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                const offset = nav.getBoundingClientRect().bottom + 40;
                let current = null;
                for (const s of sections) {
                    if (s.getBoundingClientRect().top <= offset) current = s.id;
                }
                if (current !== onScroll.last) {
                    onScroll.last = current;
                    setActive(current);
                }
                const doc = document.documentElement;
                const max = doc.scrollHeight - window.innerHeight;
                if (progress) progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Brojači u heroju ---------- */
    function initCounters() {
        const nums = $$('.ph-stat__num[data-count]');
        if (reduceMotion || !('IntersectionObserver' in window)) return;
        const fmt = (el, v) => {
            const target = Number(el.dataset.count);
            el.textContent = target >= 1000 ? yr(v) : String(v);
        };
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                const el = entry.target;
                const target = Number(el.dataset.count);
                const from = target >= 1000 ? target - 60 : 0;
                const start = performance.now();
                const dur = 1100;
                const step = now => {
                    const p = Math.min(1, (now - start) / dur);
                    const eased = 1 - Math.pow(1 - p, 3);
                    fmt(el, Math.round(from + (target - from) * eased));
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
        }, { threshold: 0.6 });
        nums.forEach(n => io.observe(n));
    }

    /* ---------- Pojavljivanje pri skrolanju ---------- */
    function initReveal() {
        const els = $$('.ph-reveal');
        if (reduceMotion || !('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('is-in'));
            return;
        }
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        els.forEach(el => io.observe(el));
    }

    /* ---------- Palisina otkrića ---------- */
    function initDiscoveries() {
        const list = $('#ph-disc-list');
        const filters = $('#ph-disc-filters');
        const note = $('#ph-disc-note');
        if (!list || !filters) return;

        const years = [...new Set(DISCOVERIES.map(d => d[2]))];
        filters.innerHTML = `<button type="button" class="ph-chip is-active" data-year="all">${UI.all} (${DISCOVERIES.length})</button>` +
            years.map(y => `<button type="button" class="ph-chip" data-year="${y}">${yr(y)} (${DISCOVERIES.filter(d => d[2] === y).length})</button>`).join('');

        list.innerHTML = DISCOVERIES.map(([num, name, year], i) => {
            const label = name === 'komet' ? UI.comet : name;
            const noteAttr = NOTES[name] ? ` data-note="${esc(name)}"` : '';
            return `<li data-year="${year}">
                <button type="button" class="ph-disc__item"${noteAttr}${noteAttr ? '' : ' tabindex="-1"'}>
                    <span class="ph-disc__num">${String(i + 1).padStart(2, '0')}. ${esc(num)}</span>
                    <span class="ph-disc__name">${esc(label)}</span>
                    <span class="ph-disc__year">${yr(year)}</span>
                </button>
            </li>`;
        }).join('');

        filters.addEventListener('click', e => {
            const chip = e.target.closest('.ph-chip');
            if (!chip) return;
            $$('.ph-chip', filters).forEach(c => c.classList.toggle('is-active', c === chip));
            const y = chip.dataset.year;
            $$('li', list).forEach(li => { li.hidden = y !== 'all' && li.dataset.year !== y; });
        });

        list.addEventListener('click', e => {
            const btn = e.target.closest('.ph-disc__item[data-note]');
            if (!btn) return;
            $$('.ph-disc__item', list).forEach(b => b.classList.toggle('is-open', b === btn));
            const key = btn.dataset.note;
            const title = btn.querySelector('.ph-disc__num').textContent.replace(/^\d+\.\s*/, '');
            note.innerHTML = `<strong>${esc(title)} ${esc(key === 'komet' ? '' : key)}</strong> — ${esc(NOTES[key])}`;
        });
    }

    /* ---------- Grafikon: složeni stupci po godinama ---------- */
    function initChart() {
        const host = $('#ph-chart-svg');
        if (!host) return;

        // Na uskim ekranima crta se manji SVG, da tekst ostane čitljiv
        const narrow = host.clientWidth < 520;
        const W = narrow ? 360 : 640, H = narrow ? 240 : 260, m = { t: 22, r: 4, b: 26, l: 26 };
        const iw = W - m.l - m.r, ih = H - m.t - m.b;
        const totals = YEARS.map((_, i) => PALISA[i] + WORLD[i]);
        const yMax = 25;
        const y = v => m.t + ih - (v / yMax) * ih;
        const band = iw / YEARS.length;
        const bw = Math.min(46, band * 0.56);
        const GAP = 2; // razmak između segmenata

        const css = getComputedStyle(document.querySelector('.ph'));
        const cPalisa = css.getPropertyValue('--ph-palisa').trim() || '#1a9fc7';
        const cWorld = css.getPropertyValue('--ph-world').trim() || '#8b5cf6';

        // Pravokutnik zaobljen samo na vrhu (podatkovni kraj), ravan na dnu
        const topRounded = (x, y0, w, h, r) => {
            if (h <= 0) return '';
            r = Math.min(r, h, w / 2);
            return `M${x},${y0 + h}V${y0 + r}Q${x},${y0} ${x + r},${y0}H${x + w - r}Q${x + w},${y0} ${x + w},${y0 + r}V${y0 + h}Z`;
        };

        let grid = '';
        for (let v = 0; v <= yMax; v += 5) {
            grid += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>` +
                `<text class="axis-label" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
        }

        const cols = YEARS.map((year, i) => {
            const cx = m.l + band * i + band / 2;
            const x = cx - bw / 2;
            const p = PALISA[i], w = WORLD[i];
            const pTop = y(p);
            const pH = y(0) - pTop;
            // Ostatak svijeta stoji na Palisinom segmentu, odvojen razmakom
            const wBottom = p > 0 ? pTop - GAP : y(0);
            const wTop = y(p + w) - (p > 0 ? GAP : 0);
            const wH = wBottom - wTop;
            const palisaPath = p > 0 ? `<path class="bar" fill="${cPalisa}" d="${w > 0 ? `M${x},${y(0)}V${pTop}H${x + bw}V${y(0)}Z` : topRounded(x, pTop, bw, pH, 4)}"/>` : '';
            const worldPath = w > 0 ? `<path class="bar" fill="${cWorld}" d="${topRounded(x, wTop, bw, wH, 4)}"/>` : '';
            return `<g class="col" data-i="${i}">
                ${palisaPath}${worldPath}
                <text class="val-label" x="${cx}" y="${wTop - 6}" text-anchor="middle">${totals[i]}</text>
                <text class="axis-label" x="${cx}" y="${H - 6}" text-anchor="middle">${narrow ? `'${String(year).slice(2)}${LANG === 'hr' ? '.' : ''}` : yr(year)}</text>
                <rect class="hit" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih + m.b}"/>
            </g>`;
        }).join('');

        host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(UI.chartAria)}">${grid}<line x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}" stroke="rgba(255,255,255,0.25)"/>${cols}</svg>`;

        // Tooltip
        const tip = document.createElement('div');
        tip.className = 'ph-tooltip';
        tip.setAttribute('role', 'tooltip');
        document.body.appendChild(tip);

        const show = (i, evt) => {
            const total = totals[i];
            const share = total ? Math.round((PALISA[i] / total) * 100) : 0;
            tip.innerHTML = `<div style="font-weight:600;margin-bottom:0.3rem;">${yr(YEARS[i])}</div>
                <div class="ph-tooltip__row"><span><i style="background:${cPalisa}"></i>${UI.palisa}</span><b>${PALISA[i]}</b></div>
                <div class="ph-tooltip__row"><span><i style="background:${cWorld}"></i>${UI.world}</span><b>${WORLD[i]}</b></div>
                <div class="ph-tooltip__row" style="margin-top:0.25rem;border-top:1px solid rgba(255,255,255,0.1);padding-top:0.25rem;"><span>${UI.share}</span><b>${pct(share)}</b></div>`;
            tip.classList.add('is-visible');
            const px = evt.clientX, py = evt.clientY;
            const r = tip.getBoundingClientRect();
            let left = px + 14, top = py - r.height - 10;
            if (left + r.width > window.innerWidth - 8) left = px - r.width - 14;
            if (top < 8) top = py + 16;
            tip.style.left = `${left}px`;
            tip.style.top = `${top}px`;
        };
        const hide = () => {
            tip.classList.remove('is-visible');
            $$('.col', host).forEach(c => c.classList.remove('is-hover'));
        };

        $$('.col', host).forEach(col => {
            const i = Number(col.dataset.i);
            col.addEventListener('pointermove', e => {
                $$('.col', host).forEach(c => c.classList.toggle('is-hover', c === col));
                show(i, e);
            });
            col.addEventListener('pointerleave', hide);
        });
        window.addEventListener('scroll', hide, { passive: true });

        // Tablični prikaz
        const table = $('#ph-chart-table');
        const toggle = $('.ph-table-toggle');
        $('tbody', table).innerHTML = YEARS.map((year, i) => `<tr><td>${yr(year)}</td><td>${PALISA[i]}</td><td>${WORLD[i]}</td><td>${totals[i]}</td><td>${pct(Math.round((PALISA[i] / totals[i]) * 100))}</td></tr>`).join('') +
            `<tr><td><strong>${UI.total}</strong></td><td><strong>${PALISA.reduce((a, b) => a + b)}</strong></td><td><strong>${WORLD.reduce((a, b) => a + b)}</strong></td><td><strong>${totals.reduce((a, b) => a + b)}</strong></td><td></td></tr>`;
        toggle.addEventListener('click', () => {
            const open = table.hidden;
            table.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? UI.hideTable : UI.showTable;
        });
    }

    /* ---------- Rang-liste ---------- */
    function renderRank(el, rows, highlight) {
        if (!el) return;
        const max = Math.max(...rows.map(r => r[1]));
        el.innerHTML = rows.map(([name, v]) => `
            <li class="${name === highlight ? 'is-hl' : ''}">
                <span>${esc(name)}</span>
                <span class="ph-rank__bar" style="--w: ${(v / max) * 100}%"></span>
                <span class="ph-rank__val">${v}</span>
            </li>`).join('');
    }

    /* ---------- Instrumenti: filter ---------- */
    function initInstruments() {
        const chips = $$('#instrumenti .ph-chip');
        const cards = $$('#instrumenti .ph-instr__card');
        chips.forEach(chip => {
            const fate = chip.dataset.fate;
            if (fate !== 'all') chip.textContent += ` (${cards.filter(c => c.dataset.fate === fate).length})`;
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.toggle('is-active', c === chip));
                cards.forEach(card => card.classList.toggle('is-hidden', fate !== 'all' && card.dataset.fate !== fate));
            });
        });
    }

    /* ---------- Tlocrt prije / poslije ---------- */
    function initPlan() {
        const plan = $('#ph-plan');
        const buttons = $$('[data-plan]');
        buttons.forEach(btn => btn.addEventListener('click', () => {
            const after = btn.dataset.plan === 'after';
            plan.classList.toggle('is-after', after);
            buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        }));
    }

    /* ---------- Faze obnove (tabovi) ---------- */
    function initSteps() {
        const root = $('#ph-steps');
        if (!root) return;
        const tabs = $$('[role="tab"]', root);
        const select = tab => {
            tabs.forEach(t => {
                const on = t === tab;
                t.setAttribute('aria-selected', String(on));
                t.tabIndex = on ? 0 : -1;
                document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
            });
        };
        tabs.forEach((tab, i) => {
            tab.tabIndex = i === 0 ? 0 : -1;
            tab.addEventListener('click', () => select(tab));
            tab.addEventListener('keydown', e => {
                const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (!dir) return;
                const next = tabs[(i + dir + tabs.length) % tabs.length];
                select(next);
                next.focus();
            });
        });
    }

    /* ---------- Lightbox (iz main.js) ---------- */
    function initFigures() {
        document.addEventListener('click', e => {
            const fig = e.target.closest('.ph .ph-fig');
            if (!fig || typeof openLightbox !== 'function') return;
            const group = fig.dataset.group;
            const figs = group ? $$(`.ph .ph-fig[data-group="${group}"]`) : [fig];
            const images = figs.map(f => {
                const img = f.querySelector('img');
                const cap = f.querySelector('figcaption');
                return { src: new URL(img.getAttribute('src'), location.href).pathname, description: cap ? cap.textContent.trim() : img.alt };
            });
            openLightbox(images, figs.indexOf(fig), true);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTimeline();
        initNav();
        initCounters();
        initReveal();
        initDiscoveries();
        initChart();
        renderRank($('#ph-rank-obs'), OBSERVATORIES, CITY.pola);
        renderRank($('#ph-rank-people'), DISCOVERERS, 'Palisa, J.');
        initInstruments();
        initPlan();
        initSteps();
        initFigures();
    });
})();
