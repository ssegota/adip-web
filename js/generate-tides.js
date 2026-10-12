#!/usr/bin/env node
/* =====================================================================
 *  ADIP — generator podataka o plimi za Pulu
 *
 *  Povuče godinu dana visokih i niskih voda i zapiše ih u
 *  servisi/tides/pula-YYYY.json, u formatu koji čita widget.
 *
 *  Pokreće se NA SERVERU, ne u pregledniku. Razlog: API ključ ne smije
 *  biti vidljiv posjetiteljima, a besplatna razina daje 50 zahtjeva
 *  dnevno — što bi na javnoj stranici presušilo u par minuta.
 *  Ovako je to ~10 poziva godišnje.
 *
 *  UPORABA
 *    1. Uzmi besplatan ključ na tidecheck.com (bez kartice, 50 zahtjeva/dan)
 *    2. export TIDECHECK_API_KEY="tvoj-kljuc"
 *    3. node tools/generate-tides.js            # tekuća godina
 *       node tools/generate-tides.js 2027       # određena godina
 *
 *  CRON (jednom mjesečno, 3:15 prvog u mjesecu):
 *    15 3 1 * * cd /put/do/stranice && TIDECHECK_API_KEY=xxx node tools/generate-tides.js
 *
 *  Traži Node 18+ (ugrađeni fetch).
 * ===================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.TIDECHECK_API_KEY;
const YEAR = parseInt(process.argv[2], 10) || new Date().getFullYear();

const PULA = { lat: 44.8683, lng: 13.8481 };
const OUT_DIR = path.join(__dirname, '..', 'servisi', 'tides');
const OUT_FILE = path.join(OUT_DIR, `pula-${YEAR}.json`);

const BASE = 'https://tidecheck.com/api';
const CHUNK_DAYS = 30;          // besplatna razina dopušta 1–37
const DATUM = 'MSL';            // srednja razina mora; 'LAT' za visine iznad
                                // najniže astronomske vode, kao na pomorskim kartama

if (!API_KEY) {
  console.error('Nedostaje TIDECHECK_API_KEY.\n' +
                'Uzmi besplatan ključ na tidecheck.com i postavi:\n' +
                '  export TIDECHECK_API_KEY="..."');
  process.exit(1);
}

const api = async (endpoint) => {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'X-API-Key': API_KEY, 'Accept': 'application/json' }
  });
  if (res.status === 429) throw new Error('Dnevna kvota potrošena (50/dan). Pokušaj sutra.');
  if (res.status === 401) throw new Error('API ključ odbijen — provjeri TIDECHECK_API_KEY.');
  if (!res.ok) throw new Error(`HTTP ${res.status} na ${endpoint}`);
  return res.json();
};

/** Pronađi postaju za Pulu; ako je nema po imenu, uzmi najbližu koordinatama. */
async function resolveStation() {
  try {
    const found = await api('/stations/search?q=Pula');
    const list = found.stations || found.results || found;
    const hit = Array.isArray(list)
      ? list.find(s => /pula/i.test(s.name || '') && /HR|Croatia|Hrvat/i.test(s.country || s.region || ''))
        || list[0]
      : null;
    if (hit) return hit;
  } catch (err) {
    console.warn('Pretraga po imenu nije uspjela:', err.message);
  }

  const near = await api(`/stations/nearest?lat=${PULA.lat}&lng=${PULA.lng}`);
  const list = near.stations || near.results || near;
  const hit = Array.isArray(list) ? list[0] : near;
  if (!hit) throw new Error('Nije pronađena nijedna postaja za Pulu.');
  return hit;
}

const iso = d => d.toISOString().slice(0, 10);

/** "2026-08-10T09:40:00+02:00" ili epoch -> "09:40" po lokalnom vremenu Pule. */
function localHHMM(value) {
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('hr-HR', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Zagreb'
  });
}

function localDate(value) {
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d);
}

async function main() {
  const station = await resolveStation();
  const stationId = station.id ?? station.stationId ?? station.station_id;
  console.log(`Postaja: ${station.name || '?'} (id ${stationId})`);

  const result = {};
  let calls = 0;

  const start = new Date(Date.UTC(YEAR, 0, 1));
  const end = new Date(Date.UTC(YEAR, 11, 31));

  for (let cur = new Date(start); cur <= end; cur.setUTCDate(cur.getUTCDate() + CHUNK_DAYS)) {
    const from = iso(cur);
    const days = Math.min(
      CHUNK_DAYS,
      Math.round((end - cur) / 86400000) + 1
    );

    const data = await api(
      `/station/${stationId}/tides?days=${days}&start=${from}&datum=${DATUM}`
    );
    calls++;

    const extremes = data.extremes || data.tides || [];
    for (const e of extremes) {
      const date = localDate(e.time ?? e.dt ?? e.timestamp);
      const hhmm = localHHMM(e.time ?? e.dt ?? e.timestamp);
      if (!date || !hhmm || !date.startsWith(String(YEAR))) continue;

      (result[date] ||= []).push({
        t: hhmm,
        h: Number(Number(e.height ?? e.value).toFixed(2))
      });
    }

    process.stdout.write(`  ${from} +${days}d  (${extremes.length} ekstrema)\n`);
    await new Promise(r => setTimeout(r, 400));   // budi pristojan prema API-ju
  }

  for (const k of Object.keys(result)) {
    result[k].sort((a, b) => a.t.localeCompare(b.t));
  }

  const dayCount = Object.keys(result).length;
  if (dayCount < 300) {
    console.warn(`Upozorenje: samo ${dayCount} dana s podacima — provjeri odgovor API-ja.`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(result), 'utf8');

  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(0);
  console.log(`\nZapisano ${OUT_FILE}`);
  console.log(`${dayCount} dana, ${kb} kB, ${calls} poziva na API.`);
}

main().catch(err => {
  console.error('\nGREŠKA:', err.message);
  process.exit(1);
});