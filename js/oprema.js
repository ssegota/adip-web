/* =====================================================================
 *  ADIP — Kalkulator opreme
 *  js/oprema.js
 *
 *  Uključi u servisi.html POSLIJE services.js:
 *      <script src="js/oprema.js?v=1"></script>
 *  Kartica se ubacuje sama u #main-services-grid.
 *
 *  Bez vanjskih ovisnosti — sve je čista računica u pregledniku.
 *  Zadnji uneseni podaci pamte se u localStorage ovog preglednika.
 * ===================================================================== */

(function () {
  'use strict';

  const SPREMNIK = 'adip_oprema';

  /* Tipične vrijednosti za brzi početak */
  const PRESET_TELESKOPI = [
    { ime: 'Zeiss Coudé 200/3000 (Zvjezdarnica)', d: 200, f: 3000 },
    { ime: 'Newton 150/750', d: 150, f: 750 },
    { ime: 'Newton 200/1000', d: 200, f: 1000 },
    { ime: 'SC 203/2032 (C8)', d: 203, f: 2032 },
    { ime: 'Refraktor 80/600 (ED)', d: 80, f: 600 },
    { ime: 'Refraktor 102/1000', d: 102, f: 1000 },
    { ime: 'Maksutov 127/1500', d: 127, f: 1500 },
    { ime: 'Dobson 250/1200', d: 250, f: 1200 }
  ];

  const PRESET_KAMERE = [
    { ime: 'ZWO ASI224MC', px: 3.75, w: 1304, h: 976 },
    { ime: 'ZWO ASI294MC', px: 4.63, w: 4144, h: 2822 },
    { ime: 'ZWO ASI533MC', px: 3.76, w: 3008, h: 3008 },
    { ime: 'Canon APS-C (18 Mpx)', px: 4.30, w: 5184, h: 3456 },
    { ime: 'Canon / Nikon full frame (24 Mpx)', px: 5.94, w: 6000, h: 4000 },
    { ime: 'Seestar S50', px: 2.90, w: 1080, h: 1920 }
  ];

  /* ---------------------------------------------------------------
   *  Računica
   * --------------------------------------------------------------- */

  /**
   * Sve formule na jednom mjestu, da se ne razilaze.
   *  - povećanje = žarišna teleskopa / žarišna okulara
   *  - izlazna zjenica = otvor / povećanje; iznad ~7 mm gubi se svjetlo
   *    jer snop postaje širi od zjenice oka
   *  - Dawes 116/D i Rayleigh 138/D su empirijske granice razlučivanja
   *  - granična magnituda vrijedi za dobro nebo i priviknuto oko
   */
  function izracunajVizualno(d, f, fOkular, afov, barlow) {
    if (!d || !f || !fOkular) return null;

    const fEff = f * (barlow || 1);
    const povecanje = fEff / fOkular;
    const izlaznaZjenica = d / povecanje;
    const tfovDeg = afov ? afov / povecanje : null;

    return {
      fOmjer: fEff / d,
      povecanje: povecanje,
      izlaznaZjenica: izlaznaZjenica,
      tfovDeg: tfovDeg,
      tfovMin: tfovDeg ? tfovDeg * 60 : null,
      maxKorisno: 2 * d,
      minKorisno: d / 7,
      dawes: 116 / d,
      rayleigh: 138 / d,
      granicnaMag: 2.7 + 5 * Math.log10(d)
    };
  }

  /**
   * Skala slike: koliko lučnih sekundi neba pada na jedan piksel.
   * 206265 je broj lučnih sekundi u radijanu; dijeljenje s 1000
   * pretvara mikrometre u milimetre.
   */
  function izracunajFoto(d, f, pxUm, sirinaPx, visinaPx, barlow) {
    if (!d || !f || !pxUm) return null;

    const fEff = f * (barlow || 1);
    const skala = 206.265 * pxUm / fEff;

    return {
      fOmjer: fEff / d,
      skala: skala,
      fovSirinaMin: sirinaPx ? skala * sirinaPx / 60 : null,
      fovVisinaMin: visinaPx ? skala * visinaPx / 60 : null,
      senzorSirinaMm: sirinaPx ? sirinaPx * pxUm / 1000 : null,
      senzorVisinaMm: visinaPx ? visinaPx * pxUm / 1000 : null
    };
  }

  /* Ocjena uzorkovanja: pravilo je ~2 piksela po FWHM zvijezde.
   * Uz tipično seeing 2–3" kod nas, ciljamo 0,7–1,5 "/px. */
  function ocjenaUzorkovanja(skala) {
    if (skala < 0.4) return { tekst: 'jako preuzorkovano — slika je "prazna", razmisli o reduktoru', boja: '#ffb020' };
    if (skala < 0.7) return { tekst: 'preuzorkovano za naše seeing uvjete', boja: '#ffb020' };
    if (skala <= 2.0) return { tekst: 'dobro uzorkovanje za planetarnu i deep-sky snimku', boja: '#00ff88' };
    if (skala <= 4.0) return { tekst: 'poduzorkovano — široko polje, zvijezde kvadratične', boja: '#ffb020' };
    return { tekst: 'jako poduzorkovano — samo za vrlo široko polje', boja: '#ff6b6b' };
  }

  function ocjenaZjenice(z) {
    if (z > 7) return { tekst: 'šire od zjenice oka — dio svjetla se gubi', boja: '#ffb020' };
    if (z > 5) return { tekst: 'najsvjetlije, idealno za maglice pod tamnim nebom', boja: '#00ff88' };
    if (z >= 2) return { tekst: 'svestrano, dobra ravnoteža', boja: '#00ff88' };
    if (z >= 0.7) return { tekst: 'veliko povećanje, za planete i dvojne zvijezde', boja: '#00ff88' };
    return { tekst: 'prazno povećanje — slika je tamna i mutna', boja: '#ff6b6b' };
  }

  function fmt(x, dec) {
    if (x === null || x === undefined || !Number.isFinite(x)) return '–';
    return x.toFixed(dec === undefined ? 1 : dec).replace('.', ',');
  }

  function stupnjevi(deg) {
    if (!deg) return '–';
    if (deg >= 1) return `${fmt(deg, 2)}° (${fmt(deg * 60, 0)}′)`;
    return `${fmt(deg * 60, 1)}′`;
  }

  /* ---------------------------------------------------------------
   *  Spremanje unosa
   * --------------------------------------------------------------- */

  function spremi() {
    try {
      const v = {};
      ['tel-d', 'tel-f', 'ok-f', 'ok-afov', 'barlow', 'cam-px', 'cam-w', 'cam-h']
        .forEach(id => { v[id] = document.getElementById(id)?.value || ''; });
      localStorage.setItem(SPREMNIK, JSON.stringify(v));
    } catch (e) { /* privatni način rada — nema veze */ }
  }

  function ucitaj() {
    try {
      const v = JSON.parse(localStorage.getItem(SPREMNIK) || '{}');
      Object.keys(v).forEach(id => {
        const el = document.getElementById(id);
        if (el && v[id]) el.value = v[id];
      });
      return Object.keys(v).length > 0;
    } catch (e) { return false; }
  }

  /* ---------------------------------------------------------------
   *  Prikaz rezultata
   * --------------------------------------------------------------- */

  function broj(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const v = parseFloat(String(el.value).replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  }

  function red(naziv, vrijednost, napomena, boja) {
    return `
      <div style="display: flex; justify-content: space-between; align-items: baseline;
                  gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <span style="color: var(--text-secondary);">${naziv}</span>
        <span style="text-align: right;">
          <strong style="color: ${boja || 'var(--accent-secondary)'}; font-size: 1.05rem;">${vrijednost}</strong>
          ${napomena ? `<br><small style="color: var(--text-muted);">${napomena}</small>` : ''}
        </span>
      </div>`;
  }

  window.oprema_izracunaj = function () {
    const d = broj('tel-d');
    const f = broj('tel-f');
    const fOk = broj('ok-f');
    const afov = broj('ok-afov');
    const barlow = broj('barlow') || 1;
    const px = broj('cam-px');
    const w = broj('cam-w');
    const h = broj('cam-h');

    spremi();

    const izlaz = document.getElementById('oprema-rezultat');
    if (!izlaz) return;

    if (!d || !f) {
      izlaz.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">
        Upiši barem otvor i žarišnu duljinu teleskopa.</p>`;
      return;
    }

    let html = '';

    /* --- Teleskop --- */
    html += `<h4 style="color: var(--accent-primary); margin: 1rem 0 0.5rem;">Teleskop</h4>`;
    html += red('Svjetlosni omjer', `f/${fmt((f * barlow) / d, 1)}`,
      barlow !== 1 ? `s Barlowom ×${fmt(barlow, 1)}` : '');
    html += red('Granična magnituda', `${fmt(2.7 + 5 * Math.log10(d), 1)} mag`,
      'vizualno, pod tamnim nebom');
    html += red('Razlučivanje', `${fmt(116 / d, 2)}″`,
      `Dawes · Rayleigh ${fmt(138 / d, 2)}″`);
    html += red('Korisno povećanje', `${fmt(d / 7, 0)}× – ${fmt(2 * d, 0)}×`,
      'iznad gornje granice slika više ne dobiva detalje');

    /* --- Okular --- */
    const viz = izracunajVizualno(d, f, fOk, afov, barlow);
    if (viz) {
      const oz = ocjenaZjenice(viz.izlaznaZjenica);
      const preveliko = viz.povecanje > viz.maxKorisno;

      html += `<h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">S okularom</h4>`;
      html += red('Povećanje', `${fmt(viz.povecanje, 0)}×`,
        preveliko ? 'iznad korisne granice za ovaj otvor' : '',
        preveliko ? '#ffb020' : null);
      html += red('Izlazna zjenica', `${fmt(viz.izlaznaZjenica, 2)} mm`, oz.tekst, oz.boja);
      if (viz.tfovDeg) {
        html += red('Stvarno vidno polje', stupnjevi(viz.tfovDeg),
          `Mjesec je ~31′ — stane ${fmt(viz.tfovMin / 31, 1)}×`);
      }
    }

    /* --- Kamera --- */
    const foto = izracunajFoto(d, f, px, w, h, barlow);
    if (foto) {
      const ou = ocjenaUzorkovanja(foto.skala);

      html += `<h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">S kamerom</h4>`;
      html += red('Skala slike', `${fmt(foto.skala, 2)} ″/px`, ou.tekst, ou.boja);

      if (foto.fovSirinaMin) {
        html += red('Vidno polje',
          `${fmt(foto.fovSirinaMin, 1)}′ × ${fmt(foto.fovVisinaMin, 1)}′`,
          `senzor ${fmt(foto.senzorSirinaMm, 1)} × ${fmt(foto.senzorVisinaMm, 1)} mm · ` +
          `Mjesec zauzima ${fmt(31 / foto.fovSirinaMin * 100, 0)}% širine`);
      }

      // NPF-ish granica ekspozicije bez praćenja (samo za kratke žarišne)
      if (f <= 300) {
        const sek = 500 / (f * barlow);
        html += red('Najdulja ekspozicija bez praćenja', `≈ ${fmt(sek, 1)} s`,
          'pravilo 500/f — dulje od toga zvijezde se izvlače u crtice');
      }
    }

    izlaz.innerHTML = html;
  };

  /* ---------------------------------------------------------------
   *  Kartica i modal
   * --------------------------------------------------------------- */

  function napraviKarticu() {
    const grid = document.getElementById('main-services-grid');
    if (!grid || document.getElementById('oprema-card')) return;

    const card = document.createElement('div');
    card.className = 'service-card glass-card';
    card.id = 'oprema-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <h3 class="service-title">Kalkulator opreme</h3>
      <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
        Povećanje, vidno polje, skala slike</p>`;

    card.addEventListener('click', () => window.openOpremaModal());
    grid.appendChild(card);
  }

  function opcije(lista, tip) {
    return lista.map((p, i) =>
      `<option value="${i}">${p.ime}</option>`).join('');
  }

  window.oprema_presetTeleskop = function (i) {
    const p = PRESET_TELESKOPI[i];
    if (!p) return;
    document.getElementById('tel-d').value = p.d;
    document.getElementById('tel-f').value = p.f;
    window.oprema_izracunaj();
  };

  window.oprema_presetKamera = function (i) {
    const p = PRESET_KAMERE[i];
    if (!p) return;
    document.getElementById('cam-px').value = p.px;
    document.getElementById('cam-w').value = p.w;
    document.getElementById('cam-h').value = p.h;
    window.oprema_izracunaj();
  };

  window.openOpremaModal = function () {
    const modal = document.getElementById('service-modal');
    if (!modal) return;

    document.getElementById('modal-title').textContent = 'Kalkulator opreme';

    const polje = (id, oznaka, placeholder, korak) => `
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label class="form-label" for="${id}">${oznaka}</label>
        <input type="number" step="${korak || 'any'}" class="form-input" id="${id}"
               placeholder="${placeholder || ''}" oninput="oprema_izracunaj()">
      </div>`;

    document.getElementById('modal-body').innerHTML = `
      <div style="padding: 1rem; display: grid; grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr);
                  gap: 2rem; align-items: start;">

        <div>
          <h4 style="color: var(--accent-primary); margin-bottom: 0.75rem;">Teleskop</h4>
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Brzi odabir</label>
            <select class="form-input" onchange="oprema_presetTeleskop(this.value)">
              <option value="">— odaberi ili upiši ručno —</option>
              ${opcije(PRESET_TELESKOPI)}
            </select>
          </div>
          ${polje('tel-d', 'Otvor objektiva (mm)', 'npr. 200')}
          ${polje('tel-f', 'Žarišna duljina (mm)', 'npr. 1000')}
          ${polje('barlow', 'Barlow / reduktor (×)', '1 = bez, 2 = Barlow ×2, 0.63 = reduktor', '0.01')}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.75rem;">Okular</h4>
          ${polje('ok-f', 'Žarišna duljina okulara (mm)', 'npr. 10')}
          ${polje('ok-afov', 'Prividno vidno polje (°)', 'npr. 52 · Plössl 50, širokokutni 68–82')}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.75rem;">Kamera</h4>
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Brzi odabir</label>
            <select class="form-input" onchange="oprema_presetKamera(this.value)">
              <option value="">— odaberi ili upiši ručno —</option>
              ${opcije(PRESET_KAMERE)}
            </select>
          </div>
          ${polje('cam-px', 'Veličina piksela (µm)', 'npr. 3.76', '0.01')}
          ${polje('cam-w', 'Širina senzora (px)', 'npr. 3008', '1')}
          ${polje('cam-h', 'Visina senzora (px)', 'npr. 3008', '1')}
        </div>

        <div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Rezultat</h3>
          <div id="oprema-rezultat" style="font-size: 0.95rem;"></div>
          <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 1.5rem; line-height: 1.6;">
            Granica korisnog povećanja (2× otvor u mm) vrijedi za dobre uvjete;
            po lošijem seeingu praktična granica je bliža 1,5×. Skala slike računa se
            za binning 1×1. Vrijednosti se pamte u ovom pregledniku.
          </p>
        </div>
      </div>

      <style>
        @media (max-width: 720px) {
          #modal-body > div { grid-template-columns: 1fr !important; gap: 1rem !important; }
        }
      </style>`;

    ucitaj();
    window.oprema_izracunaj();
    modal.classList.add('active');
  };

  document.addEventListener('DOMContentLoaded', napraviKarticu);
})();
