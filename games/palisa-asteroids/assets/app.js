(function () {
  "use strict";

  const grid = document.getElementById("grid");

  // ---- formatting helpers ----
  function num(v, digits) {
    if (v === null || v === undefined || v === "") return null;
    const n = parseFloat(v);
    if (Number.isNaN(n)) return v;
    return digits === undefined ? String(n) : n.toFixed(digits);
  }

  function fmtDate(iso) {
    if (!iso) return iso;
    const d = new Date(iso + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    });
  }

  function row(label, value) {
    if (value === null || value === undefined || value === "") return "";
    return `<dt>${label}</dt><dd>${value}</dd>`;
  }

  function spectral(p) {
    const t = p.spec_T, b = p.spec_B;
    if (t && b && t !== b) return `${t} (Tholen) · ${b} (SMASS)`;
    return t || b || null;
  }

  function periodYears(per) {
    const d = parseFloat(per);
    if (Number.isNaN(d)) return null;
    return (d / 365.25).toFixed(2);
  }

  // ---- card builder ----
  function buildCard(a) {
    const card = document.createElement("article");
    card.className = "card";

    const p = a.phys || {};
    const o = a.orbit || {};
    const uid = "ast-" + a.number;

    const physRows =
      row("Diameter", p.diameter ? `${num(p.diameter)} km` : null) +
      row("Rotation period", p.rot_per ? `${num(p.rot_per)} h` : null) +
      row("Spectral type", spectral(p)) +
      row("Geometric albedo", num(p.albedo)) +
      row("Absolute magnitude (H)", num(p.H));

    const orbRows =
      row("Orbit class", a.orbit_class_full || a.orbit_class) +
      row("Semi-major axis", o.a ? `${num(o.a)} au` : null) +
      row("Eccentricity", num(o.e)) +
      row("Inclination", o.i ? `${num(o.i)}°` : null) +
      row("Perihelion", o.q ? `${num(o.q)} au` : null) +
      row("Aphelion", o.ad ? `${num(o.ad)} au` : null) +
      row("Orbital period", periodYears(o.per) ? `${periodYears(o.per)} yr` : null);

    const discRows =
      row("Discovered", fmtDate(a.discovery_date)) +
      row("Discovery site", a.discovery_site) +
      row("First observation", o.first_obs);

    card.innerHTML = `
      <button class="card-head" aria-expanded="false" aria-controls="${uid}">
        <span class="card-num">${a.number}</span>
        <span class="card-name">${a.name}</span>
        <span class="chevron" aria-hidden="true">▼</span>
      </button>
      <div class="card-body" id="${uid}">
        <div class="card-body-inner">
          <p class="namesake">${a.namesake && a.namesake !== "Q" ? "Named for: " + a.namesake : "Origin of name uncertain."}</p>

          <div class="section-label">Discovery</div>
          <dl class="facts">${discRows}</dl>

          <div class="section-label">Physical</div>
          <dl class="facts">${physRows || "<dd>No physical data published.</dd>"}</dl>

          <div class="section-label">Orbit</div>
          <dl class="facts">${orbRows}</dl>

          <div class="links">
            <a href="${a.jpl_sbdb_url}" target="_blank" rel="noopener">JPL Small-Body DB ↗</a>
            <a class="secondary" href="${a.wikipedia_url}" target="_blank" rel="noopener">Wikipedia ↗</a>
          </div>
        </div>
      </div>`;

    const head = card.querySelector(".card-head");
    head.addEventListener("click", function () {
      const isOpen = card.classList.toggle("open");
      head.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    return card;
  }

  // ---- render ----
  const data = (typeof ASTEROIDS !== "undefined" ? ASTEROIDS : []).slice()
    .sort((a, b) => a.number - b.number);

  data.forEach(a => grid.appendChild(buildCard(a)));
})();
