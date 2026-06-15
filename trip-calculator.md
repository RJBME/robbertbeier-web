---
layout: default
title: EV Trip Calculator
permalink: /trip-calculator/
---

{% comment %}
=============================================================
  EV TRIP CALCULATOR
  Runs 100% client-side (GitHub Pages friendly — no backend).

  Data sources (all free, no API key):
    - Nominatim (OpenStreetMap)  → geocode addresses
    - OSRM demo server           → route distance + duration
    - Open-Meteo                 → temperature for the trip

  Efficiency MODEL is built at page load from your real charging
  sessions (energy_kwh + miles_added + temperature_f). See buildModel().
=============================================================
{% endcomment %}

<style>
  .trip-container { font-family: -apple-system, sans-serif; max-width: 1000px; margin: auto; color: var(--text); }

  .charge-nav { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--dash-border); align-items: center; }
  .charge-nav a { font-size: 0.78rem; font-weight: 600; text-decoration: none; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--dash-border); background: var(--dash-card); color: #888; transition: all 0.15s; }
  .charge-nav a:hover  { border-color: var(--link); color: var(--link); }
  .charge-nav a.active { background: var(--link); border-color: var(--link); color: #fff; font-weight: 700; }

  .trip-header h1 { margin: 0 0 4px 0; }
  .trip-header p  { margin: 0 0 20px 0; color: #888; font-size: 0.85rem; }

  .trip-card { background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 20px; margin-bottom: 20px; }

  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field.full { grid-column: 1 / -1; }
  .field label { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: #888; letter-spacing: 0.06em; }
  .field input, .field select {
    padding: 9px 12px; border-radius: 8px; border: 1px solid var(--dash-border);
    background: var(--bg); color: var(--text); font-size: 0.85rem; box-sizing: border-box; width: 100%;
  }
  .field .hint { font-size: 0.62rem; color: #888; }
  .quick-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .quick-row button {
    font-size: 0.68rem; padding: 3px 10px; border-radius: 14px; cursor: pointer;
    border: 1px solid var(--dash-border); background: var(--dash-card); color: #888; transition: all 0.15s;
  }
  .quick-row button:hover { border-color: var(--link); color: var(--link); }

  .opt-row { display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-end; margin-top: 16px; }
  .opt-row .field { flex: 1; min-width: 130px; }
  .check { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; color: var(--text); }
  .check input { width: auto; }

  .go-btn {
    width: 100%; margin-top: 18px; padding: 13px; border: none; border-radius: 10px;
    background: var(--link); color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .go-btn:hover { opacity: 0.9; }
  .go-btn:disabled { opacity: 0.5; cursor: progress; }

  .status-msg { font-size: 0.78rem; color: #888; margin-top: 10px; text-align: center; min-height: 1em; }
  .status-msg.err { color: #ef4444; }

  /* Results */
  #results { display: none; }
  .result-hero { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .hero-stat { flex: 1; min-width: 130px; background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px; padding: 16px; text-align: center; }
  .hero-stat .big { font-size: 1.7rem; font-weight: 800; line-height: 1.1; }
  .hero-stat .lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-top: 4px; }
  .hero-stat .sub { font-size: 0.7rem; color: #888; margin-top: 3px; }

  /* Route options */
  .routes-title { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: #888; font-weight: 700; margin-bottom: 8px; }
  .routes-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
  .route-card {
    flex: 1; min-width: 140px; text-align: left; cursor: pointer; font-family: inherit;
    background: var(--dash-card); border: 1px solid var(--dash-border); border-radius: 12px;
    padding: 12px 14px; transition: all 0.15s; color: var(--text);
  }
  .route-card:hover { border-color: var(--link); }
  .route-card.sel { border-color: var(--link); box-shadow: inset 0 0 0 1px var(--link); background: rgba(93,63,211,0.06); }
  .route-card .rc-top { font-size: 1.05rem; font-weight: 700; }
  .route-card .rc-dim { color: #888; font-weight: 400; font-size: 0.8rem; }
  .route-card .rc-energy { font-size: 0.8rem; color: var(--link); font-weight: 600; margin-top: 3px; }
  .route-card .rc-tags { margin-top: 7px; display: flex; gap: 5px; flex-wrap: wrap; }
  .rtag { font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: var(--dash-border); color: #888; }
  .rtag.eff { background: #22c55e22; color: #16a34a; }

  .fleet-note { font-size: 0.74rem; color: var(--text); background: #3b82f614; border: 1px solid #3b82f640; border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; }

  .verdict { border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; font-size: 0.92rem; font-weight: 600; display: flex; align-items: center; gap: 12px; }
  .verdict .vicon { font-size: 1.6rem; }
  .verdict.ok    { background: #22c55e1a; border: 1px solid #22c55e55; color: var(--text); }
  .verdict.tight { background: #eab3081a; border: 1px solid #eab30855; color: var(--text); }
  .verdict.no    { background: #ef44441a; border: 1px solid #ef444455; color: var(--text); }

  #map { height: 320px; border-radius: 12px; margin-bottom: 18px; border: 1px solid var(--dash-border); z-index: 0; }

  .breakdown { font-size: 0.82rem; }
  .breakdown h4 { margin: 0 0 12px 0; font-size: 0.9rem; }
  .breakdown table { width: 100%; border-collapse: collapse; }
  .breakdown td { padding: 8px 4px; border-bottom: 1px solid var(--dash-border); vertical-align: middle; }
  .breakdown tr:last-child td { border-bottom: none; }
  .breakdown td:last-child { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap; }
  .breakdown .factor-src { font-size: 0.62rem; color: #888; display: block; margin-top: 1px; }
  .src-data  { color: #22c55e; }
  .src-model { color: #eab308; }

  .soc-bar-wrap { margin-top: 4px; }
  .soc-bar { height: 22px; border-radius: 6px; background: var(--dash-border); overflow: hidden; position: relative; display: flex; }
  .soc-fill { background: linear-gradient(90deg, #22c55e, #16a34a); transition: width 0.4s; }
  .soc-used { background: repeating-linear-gradient(45deg, #ef444455, #ef444455 6px, transparent 6px, transparent 12px); }
  .soc-labels { display: flex; justify-content: space-between; font-size: 0.62rem; color: #888; margin-top: 4px; }

  .disclaimer { font-size: 0.66rem; color: #888; line-height: 1.5; margin-top: 6px; }
  .disclaimer b { color: var(--text); }

  @media (max-width: 600px) {
    .field-grid { grid-template-columns: 1fr; }
    .hero-stat .big { font-size: 1.4rem; }
  }
</style>

<div class="trip-container">

<script>(function(){
  var lnk = document.querySelector("link[rel~='icon']") || document.createElement('link');
  lnk.rel = 'icon';
  lnk.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>";
  if (!lnk.parentNode) document.head.appendChild(lnk);
})();</script>

  <nav class="charge-nav">
    <a href="/charging/">⚡ Dashboard</a>
    <a href="/charging-history/">📋 History</a>
    <a href="/charging-analytics/">📊 Analytics</a>
    <a href="/trip-calculator/" class="active">🧭 Trip</a>
  </nav>

  <div class="trip-header">
    <h1>🧭 EV Trip Calculator</h1>
    <p>Energy estimate built from <strong id="modelSessionCount">your</strong> real charging sessions — temperature-aware.</p>
  </div>

  <div class="trip-card">
    <div class="field-grid">
      <div class="field full">
        <label>Start</label>
        <input id="startAddr" type="text" placeholder="Address, city, or place" autocomplete="off">
        <div class="quick-row"><button type="button" onclick="useHome('startAddr')">🏠 Home</button></div>
      </div>
      <div class="field full">
        <label>Destination</label>
        <input id="endAddr" type="text" placeholder="Address, city, or place" autocomplete="off">
        <div class="quick-row"><button type="button" onclick="useHome('endAddr')">🏠 Home</button></div>
      </div>
    </div>

    <div class="opt-row">
      <div class="field">
        <label>Vehicle</label>
        <select id="vehSel"></select>
      </div>
      <div class="field">
        <label>Departure date</label>
        <input id="depDate" type="date">
      </div>
      <div class="field">
        <label>Road type</label>
        <select id="roadType">
          <option value="auto">Auto (from route)</option>
          <option value="highway">Mostly highway</option>
          <option value="mixed">Mixed</option>
          <option value="city">Mostly city</option>
        </select>
      </div>
    </div>

    <div class="opt-row">
      <div class="field">
        <label>Start charge % <span style="font-weight:400;text-transform:none">(optional)</span></label>
        <input id="startSoc" type="number" min="0" max="100" placeholder="e.g. 80">
      </div>
      <div class="field">
        <label>Reserve buffer %</label>
        <input id="reserve" type="number" min="0" max="50" value="10">
        <span class="hint">Don't plan to arrive below this</span>
      </div>
      <label class="check" style="flex:1;min-width:130px"><input type="checkbox" id="roundTrip"> Round trip</label>
    </div>

    <button class="go-btn" id="goBtn" onclick="planTrip()">Estimate trip ⚡</button>
    <div class="status-msg" id="status"></div>
  </div>

  <div id="results">
    <div id="routeOptions"></div>
    <div class="fleet-note" id="fleetNote" style="display:none"></div>
    <div class="verdict" id="verdict"></div>

    <div class="result-hero">
      <div class="hero-stat"><div class="big" id="rDist">–</div><div class="lbl">Distance</div><div class="sub" id="rDistSub"></div></div>
      <div class="hero-stat"><div class="big" id="rEnergy">–</div><div class="lbl">Energy needed</div><div class="sub" id="rEnergySub"></div></div>
      <div class="hero-stat"><div class="big" id="rEff">–</div><div class="lbl">Est. efficiency</div><div class="sub" id="rEffSub"></div></div>
      <div class="hero-stat"><div class="big" id="rTemp">–</div><div class="lbl">Trip temp</div><div class="sub" id="rTempSub"></div></div>
    </div>

    <div class="trip-card" id="socCard" style="display:none">
      <h4 style="margin:0 0 12px 0;font-size:0.9rem;">State of charge</h4>
      <div class="soc-bar-wrap">
        <div class="soc-bar">
          <div class="soc-fill" id="socFill"></div>
          <div class="soc-used" id="socUsed"></div>
        </div>
        <div class="soc-labels"><span id="socStartLbl"></span><span id="socEndLbl"></span></div>
      </div>
    </div>

    <div id="map"></div>

    <div class="trip-card breakdown">
      <h4>How this estimate was built</h4>
      <table>
        <tr><td>Base efficiency <span class="factor-src src-data">✓ from your sessions</span></td><td id="bBase"></td></tr>
        <tr><td>Temperature adjustment <span class="factor-src src-model">≈ EV temp curve, anchored to your data</span></td><td id="bTemp"></td></tr>
        <tr><td>Road-type adjustment <span class="factor-src src-model">≈ physics estimate</span></td><td id="bRoad"></td></tr>
        <tr><td>Effective efficiency</td><td id="bEff"></td></tr>
        <tr><td>Usable battery</td><td id="bBatt"></td></tr>
      </table>
      <p class="disclaimer">
        <b>Base efficiency is straight from your data</b> — the median mi/kWh across your real charging sessions, at the temperature they typically happened.
        <b>The temperature adjustment</b> uses a published EV range-vs-temperature curve, anchored to that number — your logged range estimates are too noisy to fit the cold-weather slope directly, so the <i>magnitude</i> is yours and the <i>direction</i> is the curve's.
        <b>Road-type</b> is a physics estimate (aero drag rises with speed²) — your logs don't record driving style.
        Routing &amp; geocoding via OpenStreetMap (Nominatim + OSRM); temperature via Open-Meteo. Estimates only — your mileage will vary.
      </p>
    </div>
  </div>

</div>

<script>
// ============================================================
//  REAL SESSION DATA (embedded by Jekyll at build time)
// ============================================================
const RAW_SESSIONS = [
{% assign ss = site.charging | sort: "date" %}{% for s in ss %}{% if s.energy_kwh and s.energy_kwh != "" %}{"v":{{ s.vehicle | jsonify }},"kwh":{{ s.energy_kwh }},"mi":{% if s.miles_added and s.miles_added != "" %}{{ s.miles_added }}{% else %}0{% endif %},"tf":{% if s.temperature_f and s.temperature_f != "" %}{{ s.temperature_f }}{% else %}null{% endif %},"soc":{% if s.soc_added and s.soc_added != "" %}{{ s.soc_added }}{% else %}null{% endif %}},
{% endif %}{% endfor %}
];

// Known usable battery capacity (kWh) — fallback only; the model also derives
// this straight from your data (energy added ÷ %SoC added), so a new car
// self-calibrates as it logs sessions.
const BATTERY = { '2025 Mach-E GT': 91.7, "LRB's 2025 Mach-E GT": 91.7 };
const DEFAULT_BATTERY = 91.7;
const MIN_OWN_SESSIONS = 5; // below this, a vehicle borrows the fleet average
const FLEET_FALLBACK_EFF = 3.0; // mi/kWh if a vehicle has no usable data

// SE-Michigan monthly avg temp (°F) — last-resort fallback for temperature
const MI_MONTHLY_F = [26,29,38,49,60,70,75,73,65,53,41,31];

// Canonical EV efficiency vs ambient temp, relative to ~70°F peak (=1.00).
// Shape from published EV range-vs-temperature studies (Geotab/Recurrent).
const TEMP_CURVE = [[0,0.62],[20,0.72],[32,0.78],[50,0.90],[65,0.99],[72,1.00],[86,0.95],[100,0.88]];
// Road-type / speed multiplier relative to ~40 mph mixed driving (=1.00).
const SPEED_CURVE = [[20,1.10],[30,1.06],[40,1.00],[50,0.95],[60,0.89],[70,0.83],[80,0.78]];

function lerp(curve, x){
  if (x <= curve[0][0]) return curve[0][1];
  if (x >= curve[curve.length-1][0]) return curve[curve.length-1][1];
  for (let i=0;i<curve.length-1;i++){
    const [x0,y0]=curve[i], [x1,y1]=curve[i+1];
    if (x>=x0 && x<=x1) return y0 + (y1-y0)*(x-x0)/(x1-x0);
  }
  return 1;
}
function median(a){ if(!a.length) return null; const b=[...a].sort((x,y)=>x-y); const m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2; }

// ============================================================
//  MODEL — built from RAW_SESSIONS
// ============================================================
const MODEL = (function buildModel(){
  const veh = {};
  let usableCount = 0;
  RAW_SESSIONS.forEach(s => {
    if (!(s.kwh > 0)) return;
    if (!(s.v in veh)) veh[s.v] = { effs: [], temps: [], batt: [] };
    if (s.mi > 0){
      const e = s.mi / s.kwh;
      if (e > 1 && e < 6){ // sanity bounds — drop guess-o-meter outliers
        veh[s.v].effs.push(e);
        if (s.tf != null) veh[s.v].temps.push(s.tf);
        usableCount++;
      }
    }
    // Usable battery = energy added ÷ fraction of pack added (ignore tiny charges)
    if (s.soc != null && s.soc >= 15) veh[s.v].batt.push(s.kwh / (s.soc / 100));
  });

  // Fleet averages from vehicles that already have enough of their own data —
  // these become the prior a brand-new car inherits the day you switch.
  const estEffs = [], estBatts = [];
  for (const v in veh){
    if (veh[v].effs.length >= MIN_OWN_SESSIONS) estEffs.push(median(veh[v].effs));
    if (veh[v].batt.length >= MIN_OWN_SESSIONS) estBatts.push(median(veh[v].batt));
  }
  const fleetEff  = estEffs.length  ? median(estEffs)  : FLEET_FALLBACK_EFF;
  const fleetBatt = estBatts.length ? median(estBatts) : DEFAULT_BATTERY;

  // Per vehicle: use its OWN data when it has enough, otherwise borrow the fleet.
  //   baseEff = median mi/kWh magnitude (direction of temp comes from the curve)
  //   tRef    = the temperature those sessions typically happened at
  //   battery = data-derived usable kWh, or known spec, or fleet average
  for (const v in veh){
    const d = veh[v];
    d.ownEff  = d.effs.length >= MIN_OWN_SESSIONS;
    d.ownBatt = d.batt.length >= MIN_OWN_SESSIONS;
    d.nEff    = d.effs.length;
    d.baseEff = d.ownEff ? median(d.effs) : (d.effs.length ? (median(d.effs) + fleetEff) / 2 : fleetEff);
    d.tRef    = d.temps.length ? median(d.temps) : 60;
    d.battery = d.ownBatt ? median(d.batt) : (BATTERY[v] || fleetBatt);
    d.battSrc = d.ownBatt ? 'your data' : (BATTERY[v] ? 'spec' : 'fleet avg');
  }
  return { veh, usableCount, fleetEff, fleetBatt };
})();

// Predict absolute mi/kWh for a vehicle at a given temperature.
// Anchors your real efficiency at its typical temperature, then scales by the
// canonical temperature curve so cold correctly reduces range and warm restores it.
function predictEff(vehName, tempF){
  const v = MODEL.veh[vehName] || { baseEff: MODEL.fleetEff, tRef: 60 };
  return v.baseEff * lerp(TEMP_CURVE, tempF) / lerp(TEMP_CURVE, v.tRef);
}
function vehModel(name){ return MODEL.veh[name] || { baseEff: MODEL.fleetEff, tRef: 60, battery: MODEL.fleetBatt, battSrc: 'fleet avg', ownEff: false, nEff: 0 }; }

// ============================================================
//  UI setup
// ============================================================
(function initUI(){
  document.getElementById('modelSessionCount').textContent = MODEL.usableCount + ' of your';
  const sel = document.getElementById('vehSel');
  const names = Object.keys(MODEL.veh);
  // default order: most data first
  names.sort((a,b)=> (MODEL.veh[b].effs.length||0) - (MODEL.veh[a].effs.length||0));
  if (!names.length) names.push('2025 Mach-E GT');
  names.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
  const dd = document.getElementById('depDate');
  dd.value = new Date().toISOString().slice(0,10);
  dd.min = '2000-01-01';
})();

const HOME = { lat: 42.3714, lon: -83.4702, label: 'Home — Plymouth, MI' };
function useHome(id){ document.getElementById(id).value = HOME.label; document.getElementById(id).dataset.home = '1'; }

function setStatus(msg, isErr){
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.className = 'status-msg' + (isErr ? ' err' : '');
}

// ============================================================
//  External APIs (all free, no key)
// ============================================================
async function geocode(q, el){
  if (el && el.dataset.home === '1') return { lat: HOME.lat, lon: HOME.lon, name: HOME.label };
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const j = await r.json();
  if (!j.length) throw new Error('Could not find "' + q + '"');
  return { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name };
}

async function route(a, b){
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&alternatives=3`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j.routes || !j.routes.length) throw new Error('No driving route found between those points.');
  return j.routes.slice(0, 3).map(rt => ({ miles: rt.distance / 1609.34, hours: rt.duration / 3600, geometry: rt.geometry }));
}

async function tripTemp(lat, lon, dateStr){
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((d - today) / 86400000);
  try {
    // Within forecast/recent window → exact daily forecast
    if (diffDays >= -60 && diffDays <= 15){
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
      const j = await (await fetch(u)).json();
      const mx = j.daily?.temperature_2m_max?.[0], mn = j.daily?.temperature_2m_min?.[0];
      if (mx != null && mn != null) return { f: (mx + mn) / 2, src: 'forecast' };
    }
    // Otherwise → climatology from the same calendar date, prior years (archive)
    const yr = d.getFullYear();
    const md = dateStr.slice(5);
    const temps = [];
    for (let y = yr - 1; y >= yr - 3; y--){
      const ds = y + '-' + md;
      const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${ds}&end_date=${ds}&daily=temperature_2m_mean&temperature_unit=fahrenheit&timezone=auto`;
      const j = await (await fetch(u)).json();
      const t = j.daily?.temperature_2m_mean?.[0];
      if (t != null) temps.push(t);
    }
    if (temps.length) return { f: temps.reduce((s,x)=>s+x,0)/temps.length, src: 'historical avg' };
  } catch(e){ /* fall through */ }
  return { f: MI_MONTHLY_F[d.getMonth()], src: 'seasonal est' };
}

// ============================================================
//  Main flow
// ============================================================
let MAP, ROUTE_LAYER, STATE = null;
async function planTrip(){
  const btn = document.getElementById('goBtn');
  const startEl = document.getElementById('startAddr'), endEl = document.getElementById('endAddr');
  if (!startEl.value.trim() || !endEl.value.trim()){ setStatus('Enter a start and destination.', true); return; }
  btn.disabled = true;
  try {
    setStatus('Finding locations…');
    const [A, B] = await Promise.all([ geocode(startEl.value.trim(), startEl), geocode(endEl.value.trim(), endEl) ]);

    setStatus('Planning route…');
    const routes = await route(A, B);

    const mid = { lat: (A.lat + B.lat) / 2, lon: (A.lon + B.lon) / 2 };
    setStatus('Checking the weather…');
    const temp = await tripTemp(mid.lat, mid.lon, document.getElementById('depDate').value);

    setStatus('');
    STATE = { A, B, routes, temp, sel: 0 };
    renderRouteOptions();
    compute(A, B, routes[0], temp);
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e){
    setStatus(e.message || 'Something went wrong. Try a more specific address.', true);
  } finally {
    btn.disabled = false;
  }
}

// Recompute everything from inputs when a route is already loaded
function refresh(){ if (STATE){ renderRouteOptions(); compute(STATE.A, STATE.B, STATE.routes[STATE.sel], STATE.temp); } }

// Shared math — used by both the route cards and the full result render
function estimate(rt, temp){
  const round   = document.getElementById('roundTrip').checked;
  const miles   = rt.miles * (round ? 2 : 1);
  const vehName = document.getElementById('vehSel').value;
  const m       = vehModel(vehName);
  const tempEff = predictEff(vehName, temp.f);
  const road    = roadFactor(rt);
  const effEff  = tempEff * road.f;
  const energy  = miles / effEff;
  return { round, miles, hours: rt.hours * (round ? 2 : 1), vehName, m, batt: m.battery,
           baseEff: m.baseEff, tempEff, tempMult: tempEff / m.baseEff, road, effEff,
           energy, pctBatt: energy / m.battery * 100 };
}

function renderRouteOptions(){
  const box = document.getElementById('routeOptions');
  box.innerHTML = '';
  const routes = STATE.routes;
  const ests = routes.map(rt => estimate(rt, STATE.temp));
  if (routes.length > 1){
    const t = document.createElement('div');
    t.className = 'routes-title';
    t.textContent = routes.length + ' route options — tap to compare';
    box.appendChild(t);
  }
  const minE = Math.min(...ests.map(e => e.energy)), maxE = Math.max(...ests.map(e => e.energy));
  const minT = Math.min(...ests.map(e => e.hours)), maxT = Math.max(...ests.map(e => e.hours));
  const grid = document.createElement('div');
  grid.className = 'routes-grid';
  routes.forEach((rt, i) => {
    const e = ests[i];
    const tags = [];
    if (routes.length > 1){
      if (e.energy === minE && minE !== maxE) tags.push('<span class="rtag eff">⚡ least energy</span>');
      if (e.hours === minT && minT !== maxT)  tags.push('<span class="rtag">fastest</span>');
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'route-card' + (i === STATE.sel ? ' sel' : '');
    card.innerHTML =
      `<div class="rc-top">${e.miles.toFixed(0)} mi <span class="rc-dim">· ${fmtDur(e.hours)}</span></div>`
      + `<div class="rc-energy">${e.energy.toFixed(1)} kWh · ${e.pctBatt.toFixed(0)}%</div>`
      + (tags.length ? `<div class="rc-tags">${tags.join('')}</div>` : '');
    card.onclick = () => { STATE.sel = i; refresh(); };
    grid.appendChild(card);
  });
  box.appendChild(grid);
}

function roadFactor(rt){
  const sel = document.getElementById('roadType').value;
  if (sel === 'highway') return { f: lerp(SPEED_CURVE, 68), label: 'Mostly highway' };
  if (sel === 'city')    return { f: lerp(SPEED_CURVE, 28), label: 'Mostly city' };
  if (sel === 'mixed')   return { f: lerp(SPEED_CURVE, 42), label: 'Mixed' };
  const mph = rt.miles / Math.max(rt.hours, 0.01);
  return { f: lerp(SPEED_CURVE, mph), label: `Auto · ${Math.round(mph)} mph avg` };
}

function compute(A, B, rt, temp){
  const e = estimate(rt, temp);

  // Hero stats
  document.getElementById('rDist').textContent = e.miles.toFixed(0) + ' mi';
  document.getElementById('rDistSub').textContent = e.round ? 'round trip' : fmtDur(e.hours);
  document.getElementById('rEnergy').textContent = e.energy.toFixed(1) + ' kWh';
  document.getElementById('rEnergySub').textContent = e.pctBatt.toFixed(0) + '% of battery';
  document.getElementById('rEff').textContent = e.effEff.toFixed(2);
  document.getElementById('rEffSub').textContent = 'mi / kWh';
  document.getElementById('rTemp').textContent = Math.round(temp.f) + '°F';
  document.getElementById('rTempSub').textContent = temp.src;

  // "Running on fleet average" note for a freshly-added car
  const fn = document.getElementById('fleetNote');
  if (!e.m.ownEff){
    fn.style.display = 'block';
    fn.innerHTML = `ℹ️ <b>${e.vehName}</b> has only ${e.m.nEff} session${e.m.nEff===1?'':'s'} with range data so far — using your fleet average until it builds its own profile.`;
  } else {
    fn.style.display = 'none';
  }

  // Breakdown
  document.getElementById('bBase').textContent = e.baseEff.toFixed(2) + ' mi/kWh  '
    + (e.m.ownEff ? '(your avg @ ' + Math.round(e.m.tRef) + '°F)' : '(fleet avg)');
  document.getElementById('bTemp').textContent = (e.tempMult>=1?'+':'') + ((e.tempMult-1)*100).toFixed(0) + '%  (' + Math.round(temp.f) + '°F)';
  document.getElementById('bRoad').textContent = (e.road.f>=1?'+':'') + ((e.road.f-1)*100).toFixed(0) + '%  · ' + e.road.label;
  document.getElementById('bEff').textContent = e.effEff.toFixed(2) + ' mi/kWh';
  document.getElementById('bBatt').textContent = e.batt.toFixed(1) + ' kWh  (' + e.m.battSrc + ')';

  // SoC + verdict
  buildVerdict(e.energy, e.batt, e.effEff);

  drawMap(A, B, rt.geometry);
}

function buildVerdict(energy, batt, effEff){
  const socEl = document.getElementById('startSoc');
  const vEl = document.getElementById('verdict');
  const socCard = document.getElementById('socCard');
  const reserve = Math.max(0, Math.min(50, +document.getElementById('reserve').value || 0));

  if (socEl.value === '' || isNaN(+socEl.value)){
    socCard.style.display = 'none';
    const need = energy / batt * 100;
    vEl.className = 'verdict ok';
    vEl.innerHTML = `<span class="vicon">🔋</span><span>This trip needs about <b>${Math.round(need)}%</b> of a full charge. Enter your starting charge above for an arrival estimate.</span>`;
    return;
  }
  const startSoc = Math.max(0, Math.min(100, +socEl.value));
  const usedPct = energy / batt * 100;
  const endSoc = startSoc - usedPct;
  const endMiles = Math.max(0, endSoc) / 100 * batt * effEff;

  socCard.style.display = 'block';
  document.getElementById('socFill').style.width = Math.max(0, endSoc) + '%';
  document.getElementById('socUsed').style.width = Math.min(usedPct, Math.max(0, startSoc)) + '%';
  document.getElementById('socStartLbl').textContent = 'Start ' + Math.round(startSoc) + '%';
  document.getElementById('socEndLbl').textContent = endSoc >= 0 ? ('Arrive ' + Math.round(endSoc) + '%  ·  ' + Math.round(endMiles) + ' mi left') : ('Short by ' + Math.round(-endSoc) + '%');

  if (endSoc < 0){
    const deficitKwh = (-endSoc) / 100 * batt;
    vEl.className = 'verdict no';
    vEl.innerHTML = `<span class="vicon">🛑</span><span>You won't make it — short by about <b>${(-endSoc).toFixed(0)}%</b> (${deficitKwh.toFixed(1)} kWh). Plan a charging stop along the way.</span>`;
  } else if (endSoc < reserve){
    vEl.className = 'verdict tight';
    vEl.innerHTML = `<span class="vicon">⚠️</span><span>Cutting it close — you'd arrive around <b>${endSoc.toFixed(0)}%</b>, below your ${reserve}% buffer. Doable, but top up if you can.</span>`;
  } else {
    vEl.className = 'verdict ok';
    vEl.innerHTML = `<span class="vicon">✅</span><span>You'll make it comfortably — arriving around <b>${endSoc.toFixed(0)}%</b> with ~${Math.round(endMiles)} mi of range to spare.</span>`;
  }
}

function fmtDur(h){
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh ? `${hh}h ${mm}m drive` : `${mm}m drive`;
}

// ============================================================
//  Map (Leaflet, lazy-loaded on first use)
// ============================================================
function loadLeaflet(){
  return new Promise(res => {
    if (window.L) return res();
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = res; document.body.appendChild(js);
  });
}
async function drawMap(A, B, geometry){
  await loadLeaflet();
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (!MAP){
    MAP = L.map('map', { scrollWheelZoom: false });
    L.tileLayer(dark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap, © CARTO', maxZoom: 19 }).addTo(MAP);
  }
  if (ROUTE_LAYER) ROUTE_LAYER.forEach(l => MAP.removeLayer(l));
  const line = L.geoJSON(geometry, { style: { color: '#5d3fd3', weight: 5, opacity: 0.85 } }).addTo(MAP);
  const mA = L.marker([A.lat, A.lon]).addTo(MAP).bindPopup('Start');
  const mB = L.marker([B.lat, B.lon]).addTo(MAP).bindPopup('Destination');
  ROUTE_LAYER = [line, mA, mB];
  MAP.fitBounds(line.getBounds(), { padding: [30, 30] });
  setTimeout(() => MAP.invalidateSize(), 100);
}

// Enter key submits
['startAddr','endAddr'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') planTrip(); });
  document.getElementById(id).addEventListener('input', e => { delete e.target.dataset.home; });
});

// Tweaking vehicle / road / charge after a route is loaded → live re-estimate
// (no re-routing or weather call needed — same route, new numbers)
['vehSel','roadType','startSoc','reserve','roundTrip'].forEach(id => {
  document.getElementById(id).addEventListener('change', refresh);
});
</script>
