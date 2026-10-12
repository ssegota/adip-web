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

  /* Jezik (hr / en / it) — getCurrentLang() dolazi iz main.js.
   * L(hr, en, it) vraća tekst za trenutni jezik; hrvatski je izvorni. */
  const LANG = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'hr';
  function L(hr, en, it) {
    if (LANG === 'en') return en;
    if (LANG === 'it') return it;
    return hr;
  }

  const SPREMNIK = 'adip_oprema';

  /* Tipične vrijednosti za brzi početak */
  const PRESET_TELESKOPI = [
    { ime: L('Zeiss Coudé 200/3000 (Zvjezdarnica)', 'Zeiss Coudé 200/3000 (Observatory)', 'Zeiss Coudé 200/3000 (Osservatorio)'), d: 200, f: 3000 },
    { ime: 'Newton 150/750', d: 150, f: 750 },
    { ime: 'Newton 200/1000', d: 200, f: 1000 },
    { ime: 'SC 203/2032 (C8)', d: 203, f: 2032 },
    { ime: L('Refraktor 80/600 (ED)', 'Refractor 80/600 (ED)', 'Rifrattore 80/600 (ED)'), d: 80, f: 600 },
    { ime: L('Refraktor 102/1000', 'Refractor 102/1000', 'Rifrattore 102/1000'), d: 102, f: 1000 },
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
    if (skala < 0.4) return { tekst: L('jako preuzorkovano — slika je "prazna", razmisli o reduktoru', 'heavily oversampled — the image is "empty", consider a focal reducer', 'fortemente sovracampionato — l\'immagine è "vuota", valuta un riduttore di focale'), boja: '#ffb020' };
    if (skala < 0.7) return { tekst: L('preuzorkovano za naše seeing uvjete', 'oversampled for our seeing conditions', 'sovracampionato per il nostro seeing'), boja: '#ffb020' };
    if (skala <= 2.0) return { tekst: L('dobro uzorkovanje za planetarnu i deep-sky snimku', 'good sampling for planetary and deep-sky imaging', 'buon campionamento per riprese planetarie e deep-sky'), boja: '#00ff88' };
    if (skala <= 4.0) return { tekst: L('poduzorkovano — široko polje, zvijezde kvadratične', 'undersampled — wide field, square-looking stars', 'sottocampionato — campo largo, stelle squadrate'), boja: '#ffb020' };
    return { tekst: L('jako poduzorkovano — samo za vrlo široko polje', 'heavily undersampled — only for very wide fields', 'fortemente sottocampionato — solo per campi molto larghi'), boja: '#ff6b6b' };
  }

  function ocjenaZjenice(z) {
    if (z > 7) return { tekst: L('šire od zjenice oka — dio svjetla se gubi', 'wider than the eye\'s pupil — some light is lost', 'più larga della pupilla dell\'occhio — parte della luce va persa'), boja: '#ffb020' };
    if (z > 5) return { tekst: L('najsvjetlije, idealno za maglice pod tamnim nebom', 'brightest view, ideal for nebulae under dark skies', 'immagine più luminosa, ideale per nebulose sotto cieli bui'), boja: '#00ff88' };
    if (z >= 2) return { tekst: L('svestrano, dobra ravnoteža', 'versatile, a good balance', 'versatile, un buon compromesso'), boja: '#00ff88' };
    if (z >= 0.7) return { tekst: L('veliko povećanje, za planete i dvojne zvijezde', 'high magnification, for planets and double stars', 'alto ingrandimento, per pianeti e stelle doppie'), boja: '#00ff88' };
    return { tekst: L('prazno povećanje — slika je tamna i mutna', 'empty magnification — the image is dark and blurry', 'ingrandimento vuoto — l\'immagine è scura e sfocata'), boja: '#ff6b6b' };
  }

  function fmt(x, dec) {
    if (x === null || x === undefined || !Number.isFinite(x)) return '–';
    const s = x.toFixed(dec === undefined ? 1 : dec);
    return LANG === 'en' ? s : s.replace('.', ',');
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
        ${L('Upiši barem otvor i žarišnu duljinu teleskopa.', 'Enter at least the telescope aperture and focal length.', 'Inserisci almeno l\'apertura e la lunghezza focale del telescopio.')}</p>`;
      return;
    }

    let html = '';

    /* --- Teleskop --- */
    html += `<h4 style="color: var(--accent-primary); margin: 1rem 0 0.5rem;">${L('Teleskop', 'Telescope', 'Telescopio')}</h4>`;
    html += red(L('Svjetlosni omjer', 'Focal ratio', 'Rapporto focale'), `f/${fmt((f * barlow) / d, 1)}`,
      barlow !== 1 ? `${L('s Barlowom', 'with Barlow', 'con Barlow')} ×${fmt(barlow, 1)}` : '');
    html += red(L('Granična magnituda', 'Limiting magnitude', 'Magnitudine limite'), `${fmt(2.7 + 5 * Math.log10(d), 1)} mag`,
      L('vizualno, pod tamnim nebom', 'visual, under dark skies', 'visuale, sotto cielo buio'));
    html += red(L('Razlučivanje', 'Resolution', 'Risoluzione'), `${fmt(116 / d, 2)}″`,
      `Dawes · Rayleigh ${fmt(138 / d, 2)}″`);
    html += red(L('Korisno povećanje', 'Useful magnification', 'Ingrandimento utile'), `${fmt(d / 7, 0)}× – ${fmt(2 * d, 0)}×`,
      L('iznad gornje granice slika više ne dobiva detalje', 'above the upper limit the image gains no further detail', 'oltre il limite superiore l\'immagine non guadagna più dettagli'));

    /* --- Okular --- */
    const viz = izracunajVizualno(d, f, fOk, afov, barlow);
    if (viz) {
      const oz = ocjenaZjenice(viz.izlaznaZjenica);
      const preveliko = viz.povecanje > viz.maxKorisno;

      html += `<h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">${L('S okularom', 'With eyepiece', 'Con oculare')}</h4>`;
      html += red(L('Povećanje', 'Magnification', 'Ingrandimento'), `${fmt(viz.povecanje, 0)}×`,
        preveliko ? L('iznad korisne granice za ovaj otvor', 'above the useful limit for this aperture', 'oltre il limite utile per questa apertura') : '',
        preveliko ? '#ffb020' : null);
      html += red(L('Izlazna zjenica', 'Exit pupil', 'Pupilla d\'uscita'), `${fmt(viz.izlaznaZjenica, 2)} mm`, oz.tekst, oz.boja);
      if (viz.tfovDeg) {
        html += red(L('Stvarno vidno polje', 'True field of view', 'Campo reale'), stupnjevi(viz.tfovDeg),
          `${L('Mjesec je ~31′ — stane', 'The Moon is ~31′ — fits', 'La Luna è ~31′ — ci sta')} ${fmt(viz.tfovMin / 31, 1)}×`);
      }
    }

    /* --- Kamera --- */
    const foto = izracunajFoto(d, f, px, w, h, barlow);
    if (foto) {
      const ou = ocjenaUzorkovanja(foto.skala);

      html += `<h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.5rem;">${L('S kamerom', 'With camera', 'Con fotocamera')}</h4>`;
      html += red(L('Skala slike', 'Image scale', 'Scala dell\'immagine'), `${fmt(foto.skala, 2)} ″/px`, ou.tekst, ou.boja);

      if (foto.fovSirinaMin) {
        html += red(L('Vidno polje', 'Field of view', 'Campo inquadrato'),
          `${fmt(foto.fovSirinaMin, 1)}′ × ${fmt(foto.fovVisinaMin, 1)}′`,
          `${L('senzor', 'sensor', 'sensore')} ${fmt(foto.senzorSirinaMm, 1)} × ${fmt(foto.senzorVisinaMm, 1)} mm · ` +
          L(`Mjesec zauzima ${fmt(31 / foto.fovSirinaMin * 100, 0)}% širine`,
            `the Moon spans ${fmt(31 / foto.fovSirinaMin * 100, 0)}% of the width`,
            `la Luna occupa il ${fmt(31 / foto.fovSirinaMin * 100, 0)}% della larghezza`));
      }

      // NPF-ish granica ekspozicije bez praćenja (samo za kratke žarišne)
      if (f <= 300) {
        const sek = 500 / (f * barlow);
        html += red(L('Najdulja ekspozicija bez praćenja', 'Longest exposure without tracking', 'Posa massima senza inseguimento'), `≈ ${fmt(sek, 1)} s`,
          L('pravilo 500/f — dulje od toga zvijezde se izvlače u crtice', '500/f rule — any longer and stars trail into streaks', 'regola del 500/f — oltre, le stelle diventano strisciate'));
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
      <h3 class="service-title">${L('Kalkulator opreme', 'Equipment Calculator', 'Calcolatore di strumentazione')}</h3>
      <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
        ${L('Povećanje, vidno polje, skala slike', 'Magnification, field of view, image scale', 'Ingrandimento, campo visivo, scala dell\'immagine')}</p>`;

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

    document.getElementById('modal-title').textContent = L('Kalkulator opreme', 'Equipment Calculator', 'Calcolatore di strumentazione');

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
          <h4 style="color: var(--accent-primary); margin-bottom: 0.75rem;">${L('Teleskop', 'Telescope', 'Telescopio')}</h4>
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">${L('Brzi odabir', 'Quick select', 'Selezione rapida')}</label>
            <select class="form-input" onchange="oprema_presetTeleskop(this.value)">
              <option value="">${L('— odaberi ili upiši ručno —', '— choose or enter manually —', '— scegli o inserisci a mano —')}</option>
              ${opcije(PRESET_TELESKOPI)}
            </select>
          </div>
          ${polje('tel-d', L('Otvor objektiva (mm)', 'Aperture (mm)', 'Apertura (mm)'), L('npr. 200', 'e.g. 200', 'es. 200'))}
          ${polje('tel-f', L('Žarišna duljina (mm)', 'Focal length (mm)', 'Lunghezza focale (mm)'), L('npr. 1000', 'e.g. 1000', 'es. 1000'))}
          ${polje('barlow', L('Barlow / reduktor (×)', 'Barlow / reducer (×)', 'Barlow / riduttore (×)'), L('1 = bez, 2 = Barlow ×2, 0.63 = reduktor', '1 = none, 2 = Barlow ×2, 0.63 = reducer', '1 = nessuno, 2 = Barlow ×2, 0.63 = riduttore'), '0.01')}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.75rem;">${L('Okular', 'Eyepiece', 'Oculare')}</h4>
          ${polje('ok-f', L('Žarišna duljina okulara (mm)', 'Eyepiece focal length (mm)', 'Lunghezza focale dell\'oculare (mm)'), L('npr. 10', 'e.g. 10', 'es. 10'))}
          ${polje('ok-afov', L('Prividno vidno polje (°)', 'Apparent field of view (°)', 'Campo apparente (°)'), L('npr. 52 · Plössl 50, širokokutni 68–82', 'e.g. 52 · Plössl 50, wide-angle 68–82', 'es. 52 · Plössl 50, grandangolare 68–82'))}

          <h4 style="color: var(--accent-primary); margin: 1.5rem 0 0.75rem;">${L('Kamera', 'Camera', 'Fotocamera')}</h4>
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">${L('Brzi odabir', 'Quick select', 'Selezione rapida')}</label>
            <select class="form-input" onchange="oprema_presetKamera(this.value)">
              <option value="">${L('— odaberi ili upiši ručno —', '— choose or enter manually —', '— scegli o inserisci a mano —')}</option>
              ${opcije(PRESET_KAMERE)}
            </select>
          </div>
          ${polje('cam-px', L('Veličina piksela (µm)', 'Pixel size (µm)', 'Dimensione del pixel (µm)'), L('npr. 3.76', 'e.g. 3.76', 'es. 3.76'), '0.01')}
          ${polje('cam-w', L('Širina senzora (px)', 'Sensor width (px)', 'Larghezza del sensore (px)'), L('npr. 3008', 'e.g. 3008', 'es. 3008'), '1')}
          ${polje('cam-h', L('Visina senzora (px)', 'Sensor height (px)', 'Altezza del sensore (px)'), L('npr. 3008', 'e.g. 3008', 'es. 3008'), '1')}
        </div>

        <div>
          <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">${L('Rezultat', 'Result', 'Risultato')}</h3>
          <div id="oprema-rezultat" style="font-size: 0.95rem;"></div>
          <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 1.5rem; line-height: 1.6;">
            ${L(`Granica korisnog povećanja (2× otvor u mm) vrijedi za dobre uvjete;
            po lošijem seeingu praktična granica je bliža 1,5×. Skala slike računa se
            za binning 1×1. Vrijednosti se pamte u ovom pregledniku.`,
            `The useful magnification limit (2× the aperture in mm) applies in good conditions;
            in poorer seeing the practical limit is closer to 1.5×. The image scale is calculated
            for 1×1 binning. Values are remembered in this browser.`,
            `Il limite di ingrandimento utile (2× l'apertura in mm) vale in buone condizioni;
            con seeing peggiore il limite pratico è più vicino a 1,5×. La scala dell'immagine è calcolata
            per il binning 1×1. I valori vengono memorizzati in questo browser.`)}
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
